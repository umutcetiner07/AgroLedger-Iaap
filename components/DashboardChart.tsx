'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface ChartData {
  date: string
  savings: number
}

interface DashboardChartProps {
  data: ChartData[]
  title: string
  color?: string
}

export default function DashboardChart({ data, title, color = '#3b82f6' }: DashboardChartProps) {
  const [animatedData, setAnimatedData] = useState<ChartData[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data)
    }, 500)
    return () => clearTimeout(timer)
  }, [data])

  const maxValue = Math.max(...data.map(d => d.savings), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-surface rounded-xl p-6 border border-gray-800"
    >
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      
      <div className="h-64 relative">
        {/* Chart Grid */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div key={percent} className="border-b border-gray-800/50" style={{ height: '20%' }}>
              <span className="text-xs text-gray-500 absolute left-0 -top-2">
                {Math.round((maxValue * percent) / 100)}
              </span>
            </div>
          ))}
        </div>

        {/* Chart Bars */}
        <div className="absolute inset-0 flex items-end justify-around px-4 pb-6">
          {animatedData.length > 0 ? (
            animatedData.map((item, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center flex-1 max-w-12"
                initial={{ height: 0 }}
                animate={{ height: `${(item.savings / maxValue) * 100}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
              >
                <div 
                  className="w-full rounded-t-md"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-400 mt-2 text-center">
                  {item.date.split('-').slice(1).join('/')}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <p className="text-gray-400 text-sm">Henüz veri bulunmuyor</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center mt-4 space-x-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
        <span className="text-sm text-gray-400">Su Tasarrufu (m³)</span>
      </div>
    </motion.div>
  )
}
