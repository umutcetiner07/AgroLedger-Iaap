'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const mockData = [
  { month: 'Oct', savings: 1200 },
  { month: 'Nov', savings: 1400 },
  { month: 'Dec', savings: 1100 },
  { month: 'Jan', savings: 1600 },
  { month: 'Feb', savings: 1800 },
  { month: 'Mar', savings: 2000 },
]

const kpis = [
  { label: 'Toplam Çiftçi', value: 8 },
  { label: 'Aktif Sensör', value: 12 },
  { label: 'Offline Sensör', value: 4 },
  { label: 'Bu Ay Tasarruf (m³)', value: 2500 },
  { label: 'Açık Ticket', value: 3 },
  { label: 'Aktif Anomali', value: 5 },
  { label: 'Shadow Accuracy (%)', value: 85 },
  { label: 'FHS Ortalaması', value: 7.2 },
]

const gateways = [
  { name: 'Gateway A', solar: 85, battery: 90, lastHeartbeat: 'PRIMARY', status: 'Online' },
  { name: 'Gateway B', solar: 70, battery: 95, lastHeartbeat: 'BACKUP', status: 'Standby' },
]

const anomalies = [
  { type: 'LOW_MOISTURE', farmer: 'Farmer 1', time: '2h ago', confidence: 0.85, status: 'Bekliyor' },
  { type: 'HIGH_TEMPERATURE', farmer: 'Farmer 2', time: '4h ago', confidence: 0.90, status: 'Manuel Sulama' },
  { type: 'SENSOR_FAILURE', farmer: 'Farmer 3', time: '6h ago', confidence: 0.75, status: 'Onaylı' },
  // Add more mock anomalies
]

const banners = [
  { type: 'weather', message: 'Fırtına Uyarısı — SLA Donduruldu', color: 'bg-orange-500' },
  { type: 'shadow', message: 'Ghost Mode — Sistem öğreniyor', color: 'bg-blue-500' },
]

export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 bg-surface p-4">
        <h2 className="text-accent mb-4">IaaP Admin</h2>
        <ul>
          <li className="mb-2">Dashboard</li>
          <li className="mb-2">Farms</li>
          <li className="mb-2">Cooperatives</li>
          <li className="mb-2">Sensors</li>
          <li className="mb-2">Maintenance</li>
          <li className="mb-2">Shadow Analytics</li>
          <li className="mb-2">Reports</li>
        </ul>
      </aside>
      <main className="flex-1 p-6">
        <h1 className="text-2xl mb-6">Admin Dashboard</h1>

        {/* Banners */}
        {banners.map((banner, i) => (
          <div key={i} className={`p-4 mb-4 ${banner.color} text-white rounded`}>
            {banner.message}
          </div>
        ))}

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-surface p-4 rounded">
              <h3 className="text-accent">{kpi.label}</h3>
              <p className="text-2xl">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Gateway Health */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {gateways.map((gw, i) => (
            <div key={i} className="bg-surface p-4 rounded">
              <h3>{gw.name}</h3>
              <p>Solar: {gw.solar}%</p>
              <p>Battery: {gw.battery}%</p>
              <p>Last Heartbeat: {gw.lastHeartbeat}</p>
              <p>Status: {gw.status}</p>
            </div>
          ))}
        </div>

        {/* Anomaly Feed */}
        <div className="bg-surface p-4 rounded mb-6">
          <h3 className="text-accent mb-4">Anomaly Feed</h3>
          <ul>
            {anomalies.map((anom, i) => (
              <li key={i} className="mb-2">
                {anom.type} - {anom.farmer} - {anom.time} - {anom.confidence} - {anom.status}
              </li>
            ))}
          </ul>
        </div>

        {/* Chart */}
        <div className="bg-surface p-4 rounded">
          <h3 className="text-accent mb-4">Son 6 Ay Tasarruf</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="savings" stroke="#2dd4bf" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  )
}