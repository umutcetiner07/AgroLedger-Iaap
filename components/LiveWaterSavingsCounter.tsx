'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface WaterSavingsData {
  totalSavings: number
  totalPayment: number
  totalFarms: number
  lastUpdated: string
}

export default function LiveWaterSavingsCounter() {
  const [data, setData] = useState<WaterSavingsData>({
    totalSavings: 0,
    totalPayment: 0,
    totalFarms: 0,
    lastUpdated: ''
  })
  const [loading, setLoading] = useState(true)
  const [animatedSavings, setAnimatedSavings] = useState(0)
  const [animatedPayment, setAnimatedPayment] = useState(0)

  // Sayı animasyonu
  const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
    const startTime = Date.now()
    const animate = () => {
      const currentTime = Date.now()
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing fonksiyonu
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = start + (end - start) * easeOutQuart
      
      callback(Math.round(currentValue))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const result = await response.json()
      
      if (result.error) {
        console.error('API Error:', result.error)
        return
      }

      setData(result)
      
      // Animasyonlu sayı güncelleme
      animateValue(animatedSavings, result.totalSavings, 2000, setAnimatedSavings)
      animateValue(animatedPayment, result.totalPayment, 2000, setAnimatedPayment)
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching water savings data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Her 30 saniyede bir veri güncelle
    const interval = setInterval(fetchData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-gray-800">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="bg-surface rounded-xl p-6 border border-gray-800 hover:border-accent transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Canlı Su Tasarrufu</h3>
          <p className="text-gray-400 text-sm">Kazakistan Tarım Projeleri</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">Canlı</span>
        </div>
      </div>

      {/* Ana Sayı */}
      <div className="mb-6">
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-bold text-accent">
            {animatedSavings.toLocaleString('tr-TR')}
          </span>
          <span className="text-xl text-gray-400">m³</span>
        </div>
        <p className="text-gray-400 mt-2">Toplam Tasarruf Edilen Su</p>
      </div>

      {/* Detaylar */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-background rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400">Toplam Ödeme</p>
              <p className="text-lg font-semibold text-white">
                ₺{animatedPayment.toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400">Aktif Çiftlik</p>
              <p className="text-lg font-semibold text-white">
                {data.totalFarms}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Güncelleme zamanı */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Son güncelleme</span>
        <span>
          {data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString('tr-TR') : '-'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div 
            className="bg-gradient-to-r from-accent to-cyan-400 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((animatedSavings / 100000) * 100, 100)}%` }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Hedef: 100.000 m³</p>
      </div>
    </motion.div>
  )
}
