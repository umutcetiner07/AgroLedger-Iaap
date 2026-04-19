'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Farm {
  id: number
  name: string
  farmerName: string
  region: string
  cropType: string
  fhsScore: number
  lat: number
  lng: number
  areaHa: number
}

interface MapProps {
  farms: Farm[]
}

export default function Map({ farms }: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Initialize the map
    const map = L.map(mapContainerRef.current).setView([48.0, 68.0], 5)

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    mapRef.current = map

    // Add markers for each farm
    farms.forEach(farm => {
      const marker = L.marker([farm.lat, farm.lng])
      
      // Create popup content
      const popupContent = `
        <div class="text-sm">
          <div class="font-semibold text-gray-900">${farm.name}</div>
          <div class="text-gray-700">Farmer: ${farm.farmerName}</div>
          <div class="text-gray-700">Crop: ${farm.cropType}</div>
          <div class="text-gray-700">FHS: <span class="font-bold" style="color: ${farm.fhsScore > 75 ? '#10b981' : farm.fhsScore >= 50 ? '#eab308' : '#ef4444'}">${farm.fhsScore}</span></div>
          <div class="text-gray-700">Area: ${farm.areaHa} ha</div>
        </div>
      `
      
      marker.bindPopup(popupContent)
      marker.addTo(map)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [farms])

  return (
    <div 
      ref={mapContainerRef} 
      className="h-96 w-full rounded-lg overflow-hidden"
      style={{ backgroundColor: '#1f2937' }}
    />
  )
}
