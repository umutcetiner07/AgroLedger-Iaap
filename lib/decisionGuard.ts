import { prisma } from "@/lib/prisma"
import { Logger, AlertCategory } from "./logger"

// Validation Layer - Sensör veri kalitesi kontrolü
interface SensorValidationResult {
  isValid: boolean
  issues: string[]
  confidence: number
}

interface SensorDataQuality {
  batteryLevel: number
  signalStrength: number
  dataConsistency: boolean
  anomalyScore: number
}

export async function canDecide(farmId: number): Promise<{ can: boolean, status: string, details?: any }> {
  // 1. Sensör verilerini getir
  const sensors = await prisma.sensor.findMany({
    where: { farmId },
    select: { 
      lastReadingAt: true,
      battery: true,
      lat: true,
      lng: true,
      isEstimated: true
    },
    orderBy: { lastReadingAt: 'desc' }
  })

  if (sensors.length === 0) {
    return { can: false, status: "NO_SENSORS" }
  }

  // 2. Validation Layer - Sensör veri kalitesini kontrol et
  const validationResults = await Promise.all(
    sensors.map(sensor => validateSensorData(sensor, farmId))
  )

  const overallValidation = validateOverallSensorData(validationResults)
  
  if (!overallValidation.isValid) {
    return { 
      can: false, 
      status: "DATA_QUALITY_ISSUES", 
      details: {
        issues: overallValidation.issues,
        confidence: overallValidation.confidence
      }
    }
  }

  // 3. Zaman bazlı kontrol
  const now = new Date()
  const latestReading = sensors.reduce((latest, sensor) => {
    if (!sensor.lastReadingAt) return latest
    return sensor.lastReadingAt > latest ? sensor.lastReadingAt : latest
  }, new Date(0))

  const diffMs = now.getTime() - latestReading.getTime()
  const diffMin = diffMs / (1000 * 60)

  // 4. Anomali tespiti
  const anomalyDetection = await detectAnomalies(sensors, farmId)
  
  // 5. Nihai karar mantığı
  const decision = makeFinalDecision({
    timeDiff: diffMin,
    validation: overallValidation,
    anomalies: anomalyDetection,
    sensorCount: sensors.length
  })

  return decision
}

// Validation Layer - Sensör veri kalitesi kontrolü
async function validateSensorData(sensor: any, farmId: number): Promise<SensorValidationResult> {
  const issues: string[] = []
  let confidence = 1.0

  // Batarya seviyesi kontrolü
  if (sensor.battery !== undefined && sensor.battery !== null) {
    if (sensor.battery < 10) {
      issues.push("LOW_BATTERY")
      confidence -= 0.3
      // KRİTİK: Logla ve notification gönder
      await Logger.sensorWarning(
        `Sensör ${sensor.id} kritik düşük batarya seviyesi: ${sensor.battery}%`,
        { sensorId: sensor.id, battery: sensor.battery, farmId },
        farmId,
        sensor.id
      )
    } else if (sensor.battery < 20) {
      issues.push("MEDIUM_BATTERY")
      confidence -= 0.1
      await Logger.sensorWarning(
        `Sensör ${sensor.id} düşük batarya seviyesi: ${sensor.battery}%`,
        { sensorId: sensor.id, battery: sensor.battery, farmId },
        farmId,
        sensor.id
      )
    }
  }

  // Tahmini veri kontrolü
  if (sensor.isEstimated) {
    issues.push("ESTIMATED_DATA")
    confidence -= 0.2
  }

  // Konum doğruluğu kontrolü
  if (!sensor.lat || !sensor.lng) {
    issues.push("MISSING_LOCATION")
    confidence -= 0.1
  }

  return {
    isValid: issues.length === 0,
    issues,
    confidence: Math.max(0, confidence)
  }
}

function validateOverallSensorData(results: SensorValidationResult[]): SensorValidationResult {
  const allIssues = results.flatMap(r => r.issues)
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length

  return {
    isValid: allIssues.length === 0 && avgConfidence > 0.7,
    issues: allIssues,
    confidence: avgConfidence
  }
}

// Anomali tespiti
async function detectAnomalies(sensors: any[], farmId: number): Promise<{
  hasAnomalies: boolean
  anomalyCount: number
  types: string[]
}> {
  // Son 24 saatteki anomalileri kontrol Et
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const recentAnomalies = await prisma.anomalyLog.count({
    where: {
      sensor: { farmId },
      createdAt: { gte: twentyFourHoursAgo }
    }
  })

  // Sensör okuma tutarsızlıklarını kontrol Et
  const inconsistentReadings = sensors.filter(sensor => {
    // Son 1 saat içinde okuma yapmamış sensörler
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return sensor.lastReadingAt && new Date(sensor.lastReadingAt) < oneHourAgo
  })

  if (inconsistentReadings.length > 0) {
    await Logger.decisionWarning(
      `Çiftlik ${farmId} için ${inconsistentReadings.length} sensör 1 saatten fazla okumamış`,
      { 
        farmId, 
        inconsistentSensors: inconsistentReadings.map(s => ({ id: s.id, lastReadingAt: s.lastReadingAt })),
        type: "MISSING_READINGS"
      }
    )
  }

  return {
    hasAnomalies: recentAnomalies > 0 || inconsistentReadings.length > 0,
    anomalyCount: recentAnomalies,
    types: ["MISSING_READINGS", "RECENT_ANOMALIES"]
  }
}

// Nihai karar mantığı
function makeFinalDecision(params: {
  timeDiff: number
  validation: SensorValidationResult
  anomalies: { hasAnomalies: boolean; anomalyCount: number }
  sensorCount: number
}): { can: boolean, status: string, details?: any } {
  const { timeDiff, validation, anomalies } = params

  // Öncelik sırası:
  // 1. Veri kalitesi en önemli
  if (!validation.isValid) {
    return {
      can: false,
      status: "DATA_QUALITY_FAILED",
      details: {
        issues: validation.issues,
        confidence: validation.confidence
      }
    }
  }

  // 2. Aktif anomaliler
  if (anomalies.hasAnomalies) {
    return {
      can: false,
      status: "ACTIVE_ANOMALIES",
      details: {
        anomalyCount: anomalies.anomalyCount,
        recommendation: "CHECK_ANOMALY_LOGS"
      }
    }
  }

  // 3. Zaman bazlı karar
  if (timeDiff < 15) {
    return { can: true, status: "REAL_TIME" }
  }
  
  if (timeDiff < 120) {
    return { can: true, status: "DELAYED" }
  }

  return { can: false, status: "SENSOR_OFFLINE" }
}