'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const icon = L.divIcon({
  className: '',
  html: `<div style="background:#10b981;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(16,185,129,0.8)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const farms = [
  { name: "Aibek's Wheat Farm", farmer: 'Aibek Dzhaksybekov', lat: 43.222, lng: 76.851, fhs: 82 },
  { name: "Nursultan's Sunflower", farmer: 'Nursultan Bekov', lat: 43.302, lng: 68.270, fhs: 67 },
  { name: "Zarina's Barley Field", farmer: 'Zarina Akhmetova', lat: 49.804, lng: 73.141, fhs: 91 },
  { name: "Marat's Cotton Farm", farmer: 'Marat Seitkali', lat: 52.283, lng: 76.967, fhs: 54 },
  { name: "Aigul's Wheat Farm", farmer: 'Aigul Nurmagambetova', lat: 53.214, lng: 63.625, fhs: 48 },
]

export default function KazakhMaps() {
  return (
    <MapContainer center={[48, 68]} zoom={4} style={{ height: '100%', width: '100%', background: '#0f172a' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; CartoDB'
      />
      {farms.map((f) => (
        <Marker key={f.name} position={[f.lat, f.lng]} icon={icon}>
          <Popup>
            <div style={{ fontSize: '13px' }}>
              <strong>{f.farmer}</strong><br />
              {f.name}<br />
              FHS Score: <strong style={{ color: '#10b981' }}>{f.fhs}</strong>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
