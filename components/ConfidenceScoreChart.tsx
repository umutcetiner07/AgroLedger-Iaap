'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface AnomalyData {
  type: string
  avgConfidence: number
  count: number
}

interface ChartData {
  name: string
  confidence: number
  count: number
  color: string
}

export default function ConfidenceScoreChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBar, setSelectedBar] = useState<number | null>(null)

  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const result = await response.json()
      
      if (result.error) {
        console.error('API Error:', result.error)
        return
      }

      const chartData: ChartData[] = result.anomalyStats.map((stat: AnomalyData, index: number) => ({
        name: stat.type.replace('_', ' ').toUpperCase(),
        confidence: stat.avgConfidence,
        count: stat.count,
        color: getColorByType(stat.type, index)
      }))

      setData(chartData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching confidence score data:', error)
      setLoading(false)
    }
  }

  const getColorByType = (type: string, index: number): string => {
    const colors = [
      'bg-gradient-to-t from-accent to-cyan-400',
      'bg-gradient-to-t from-purple-500 to-pink-400',
      'bg-gradient-to-t from-orange-500 to-yellow-400',
      'bg-gradient-to-t from-green-500 to-emerald-400',
      'bg-gradient-to-t from-blue-500 to-indigo-400'
    ]
    return colors[index % colors.length]
  }

  useEffect(() => {
    fetchData()
    
    // Her 60 saniyede bir veri güncelle
    const interval = setInterval(fetchData, 60000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-gray-800">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-40 bg-gray-700 rounded mb-4"></div>
          <div className="flex space-x-2">
            <div className="h-3 bg-gray-700 rounded w-1/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    )
  }

  const maxConfidence = Math.max(...data.map(d => d.confidence), 100)

  return (
    <motion.div 
      className="bg-surface rounded-xl p-6 border border-gray-800 hover:border-accent transition-all duration-300"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">AI Confidence Score</h3>
          <p className="text-gray-400 text-sm">Anomali Tespit Güvenilirliği</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">Gerçek Zamanlı</span>
        </div>
      </div>

      {/* Grafik Alanı */}
      <div className="relative h-64 mb-6">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 25, 50, 75, 100].map((value) => (
            <div key={value} className="relative">
              <div className="absolute left-0 right-0 border-t border-gray-800"></div>
              <span className="absolute -left-8 -top-2 text-xs text-gray-500">{value}%</span>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="relative h-full flex items-end justify-around ml-8">
          {data.map((item, index) => (
            <motion.div
              key={item.name}
              className="flex flex-col items-center flex-1 max-w-20"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              {/* Bar */}
              <div className="relative w-full flex flex-col items-center">
                <motion.div
                  className={`w-full ${item.color} rounded-t-lg cursor-pointer transition-all duration-300 hover:opacity-80`}
                  style={{ height: `${(item.confidence / maxConfidence) * 100}%` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.confidence / maxConfidence) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                  onMouseEnter={() => setSelectedBar(index)}
                  onMouseLeave={() => setSelectedBar(null)}
                >
                  {/* Value Label */}
                  <motion.div
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-accent text-white text-xs px-2 py-1 rounded"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: selectedBar === index ? 1 : 0, 
                      y: selectedBar === index ? 0 : 10 
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.confidence}%
                  </motion.div>
                </motion.div>

                {/* Count Badge */}
                <div className="absolute -bottom-2 bg-background border border-gray-700 rounded-full px-2 py-1">
                  <span className="text-xs text-gray-300">{item.count}</span>
                </div>
              </div>

              {/* Label */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400 font-medium">{item.name}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Özet İstatistikler */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-background rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Ortalama Güven</p>
          <p className="text-lg font-bold text-accent">
            {data.length > 0 
              ? Math.round(data.reduce((sum, d) => sum + d.confidence, 0) / data.length)
              : 0}%
          </p>
        </div>
        
        <div className="bg-background rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Toplam Anomali</p>
          <p className="text-lg font-bold text-white">
            {data.reduce((sum, d) => sum + d.count, 0)}
          </p>
        </div>

        <div className="bg-background rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">En Yüksek Skor</p>
          <p className="text-lg font-bold text-green-400">
            {data.length > 0 ? Math.max(...data.map(d => d.confidence)) : 0}%
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center space-x-2">
            <div className={`w-3 h-3 ${item.color} rounded`}></div>
            <span className="text-xs text-gray-400">{item.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
