import { prisma } from "@/lib/prisma"

export enum LogLevel {
  INFO = "INFO",
  WARNING = "WARNING", 
  ERROR = "ERROR",
  CRITICAL = "CRITICAL"
}

export enum AlertCategory {
  SYSTEM = "SYSTEM",
  SENSOR = "SENSOR",
  DECISION = "DECISION",
  ANOMALY = "ANOMALY"
}

interface LogEntry {
  level: LogLevel
  category: AlertCategory
  message: string
  details?: any
  farmId?: number
  sensorId?: number
  timestamp: Date
}

export class Logger {
  static async log(entry: LogEntry): Promise<void> {
    // Vercel Function Logs uyumlu structured JSON log
    const structuredLog = {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      category: entry.category,
      message: entry.message,
      details: entry.details || null,
      farmId: entry.farmId || null,
      sensorId: entry.sensorId || null
    }

    // Console'a structured JSON formatında yaz
    console.log(JSON.stringify(structuredLog))
    
    // Veritabanına log kaydet (try/catch ile)
    try {
      // Eğer systemLog tablosu varsa kullan, yoksa hata vermez
      await (prisma as any).systemLog?.create({
        data: {
          level: entry.level,
          category: entry.category,
          message: entry.message,
          details: entry.details ? JSON.stringify(entry.details) : null,
          farmId: entry.farmId,
          sensorId: entry.sensorId,
          timestamp: entry.timestamp
        }
      })
    } catch (error) {
      // Tablo yoksa sessizce geç
      console.log('Database logging not available, using console only')
    }
  }

  // Kritik hatalar için özel metodlar - Vercel structured format
  static async criticalError(message: string, details?: any, farmId?: number): Promise<void> {
    const structuredLog = {
      timestamp: new Date().toISOString(),
      level: LogLevel.CRITICAL,
      category: AlertCategory.SYSTEM,
      message,
      details: details || null,
      farmId: farmId || null,
      sensorId: null,
      severity: "critical",
      source: "decisionGuard"
    }

    console.log(JSON.stringify(structuredLog))

    await this.log({
      level: LogLevel.CRITICAL,
      category: AlertCategory.SYSTEM,
      message: `🚨 KRİTİK: ${message}`,
      details,
      farmId,
      timestamp: new Date()
    })
  }

  static async sensorWarning(message: string, details?: any, farmId?: number, sensorId?: number): Promise<void> {
    const structuredLog = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARNING,
      category: AlertCategory.SENSOR,
      message,
      details: details || null,
      farmId: farmId || null,
      sensorId: sensorId || null,
      severity: "warning",
      source: "decisionGuard"
    }

    console.log(JSON.stringify(structuredLog))

    await this.log({
      level: LogLevel.WARNING,
      category: AlertCategory.SENSOR,
      message: `⚠️ SENSÖR: ${message}`,
      details,
      farmId,
      sensorId,
      timestamp: new Date()
    })
  }

  static async decisionWarning(message: string, details?: any, farmId?: number): Promise<void> {
    const structuredLog = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARNING,
      category: AlertCategory.DECISION,
      message,
      details: details || null,
      farmId: farmId || null,
      sensorId: null,
      severity: "warning",
      source: "decisionGuard"
    }

    console.log(JSON.stringify(structuredLog))

    await this.log({
      level: LogLevel.WARNING,
      category: AlertCategory.DECISION,
      message: `⚠️ KARAR: ${message}`,
      details,
      farmId,
      timestamp: new Date()
    })
  }

  static async anomalyAlert(message: string, details?: any, farmId?: number, sensorId?: number): Promise<void> {
    const structuredLog = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category: AlertCategory.ANOMALY,
      message,
      details: details || null,
      farmId: farmId || null,
      sensorId: sensorId || null,
      severity: "error",
      source: "decisionGuard"
    }

    console.log(JSON.stringify(structuredLog))

    await this.log({
      level: LogLevel.ERROR,
      category: AlertCategory.ANOMALY,
      message: `🚨 ANOMALİ: ${message}`,
      details,
      farmId,
      sensorId,
      timestamp: new Date()
    })
  }

  // INFO seviyesi için - Vercel'de filtrelenmez
  static async info(message: string, details?: any, farmId?: number): Promise<void> {
    const structuredLog = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category: AlertCategory.SYSTEM,
      message,
      details: details || null,
      farmId: farmId || null,
      sensorId: null,
      severity: "info",
      source: "decisionGuard"
    }

    console.log(JSON.stringify(structuredLog))

    await this.log({
      level: LogLevel.INFO,
      category: AlertCategory.SYSTEM,
      message,
      details,
      farmId,
      timestamp: new Date()
    })
  }
}
