'use client'

import { useState } from 'react'

export default function FarmerDashboard() {
  const [shadowMode] = useState<'GHOST' | 'LEARNING' | 'FULL'>('LEARNING') // mock

  const moisture = 45 // mock
  const earnings = 1200 // mock
  const sensorHealth = 'Good' // mock

  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-2xl mb-4">Çiftçi Paneli</h1>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="bg-surface p-4 rounded">
          <h3>Toprak Nemi</h3>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div className="bg-accent h-4 rounded-full" style={{ width: `${moisture}%` }}></div>
          </div>
          <p>{moisture}%</p>
        </div>

        <div className="bg-surface p-4 rounded">
          <h3>Bu Ay Kazanım</h3>
          <p>{earnings} ₸</p>
        </div>

        <div className="bg-surface p-4 rounded">
          <h3>Sensör Sağlık</h3>
          <p>{sensorHealth}</p>
        </div>
      </div>

      {shadowMode === 'LEARNING' && (
        <div className="bg-yellow-500 p-4 rounded mb-4">
          <h3>📚 Sistem Tavsiyesi</h3>
          <p>Sulama önerisi: 10m³</p>
        </div>
      )}

      {shadowMode === 'FULL' && (
        <div className="bg-green-500 p-4 rounded mb-4">
          <h3>Otomatik Öneri</h3>
          <p>Sulama yap: 10m³ - Sebep: Düşük nem</p>
          <p>FHS Skoru: 8.5</p>
          <button className="bg-accent text-white p-2 rounded mr-2">YAP</button>
          <button className="bg-red-500 text-white p-2 rounded">YAPMA</button>
        </div>
      )}
    </div>
  )
}