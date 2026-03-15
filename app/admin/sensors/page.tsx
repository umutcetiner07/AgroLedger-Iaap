'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

import { LatLngExpression } from 'leaflet'

interface Sensor {
  id: number
  name: string
  lat: number | null
  lng: number | null
  lastReadingAt: string | null
  battery: number | null
  isEstimated: boolean
  anomalies: any[]
}

export default function SensorsMap() {
  const [sensors, setSensors] = useState<Sensor[]>([])

  useEffect(() => {
    fetch('/api/sensors')
      .then(res => res.json())
      .then(setSensors)
  }, [])

  const getPinColor = (sensor: Sensor) => {
    const now = new Date()
    const lastSeen = sensor.lastReadingAt ? new Date(sensor.lastReadingAt) : null
    const diffMin = lastSeen ? (now.getTime() - lastSeen.getTime()) / (1000 * 60) : Infinity
    const battery = sensor.battery || 0

    if (diffMin < 15 && battery > 30) return 'green'
    if ((diffMin >= 15 && diffMin < 120) || sensor.isEstimated) return 'yellow'
    if (diffMin >= 120 || battery < 15) return 'red'
    if (sensor.anomalies.length > 0) return 'orange'
    return 'blue'
  }

  return (
    <div className="h-screen">
      <MapContainer center={[43.222, 76.851] as LatLngExpression} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {sensors.filter(s => s.lat && s.lng).map(sensor => (
          <Marker key={sensor.id} position={[sensor.lat!, sensor.lng!] as LatLngExpression}>
            <Popup>{sensor.name} - Status: {getPinColor(sensor)}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}