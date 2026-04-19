'use client'

import 'leaflet/dist/leaflet.css'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('./KazakhMaps'), { ssr: false })
const stats = [
  { label: 'Total Farmers', value: '5', sub: 'Active partners', icon: '👨‍🌾' },
  { label: 'Active Fields', value: '10', sub: 'Across Kazakhstan', icon: '🌾' },
  { label: 'Avg FHS Score', value: '72', sub: 'Field Health Score', icon: '📊' },
  { label: 'Pending Credits', value: '2', sub: 'Awaiting approval', icon: '💳' },
]

const farms = [
  { name: "Aibek's Wheat Farm", farmer: 'Aibek Dzhaksybekov', region: 'Almaty', crop: 'Wheat', fhs: 82, status: 'Healthy' },
  { name: "Nursultan's Sunflower", farmer: 'Nursultan Bekov', region: 'Turkestan', crop: 'Sunflower', fhs: 67, status: 'At Risk' },
  { name: "Zarina's Barley Field", farmer: 'Zarina Akhmetova', region: 'Karaganda', crop: 'Barley', fhs: 91, status: 'Healthy' },
  { name: "Marat's Cotton Farm", farmer: 'Marat Seitkali', region: 'Pavlodar', crop: 'Cotton', fhs: 54, status: 'At Risk' },
  { name: "Aigul's Wheat Farm", farmer: 'Aigul Nurmagambetova', region: 'Kostanay', crop: 'Wheat', fhs: 48, status: 'Critical' },
]

const credits = [
  { farmer: 'Aibek Dzhaksybekov', amount: '$45,000', status: 'APPROVED' },
  { farmer: 'Nursultan Bekov', amount: '$32,000', status: 'PENDING' },
  { farmer: 'Zarina Akhmetova', amount: '$78,000', status: 'APPROVED' },
  { farmer: 'Marat Seitkali', amount: '$21,000', status: 'REJECTED' },
  { farmer: 'Aigul Nurmagambetova', amount: '$55,000', status: 'PENDING' },
]

function statusColor(status: string) {
  if (status === 'Healthy' || status === 'APPROVED') return '#10b981'
  if (status === 'At Risk' || status === 'PENDING') return '#f59e0b'
  return '#ef4444'
}

export default function AdminDashboard() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif', padding: '32px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>🌾</span>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#10b981', margin: 0 }}>BerekeAI Admin Dashboard</h1>
        </div>
        <p style={{ color: '#94a3b8', margin: 0 }}>Agricultural Intelligence Platform — Kazakhstan Region · {new Date().toLocaleDateString('en-GB')}</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#10b981' }}>{s.value}</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', marginTop: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Map + Credits */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        
        {/* Map */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>🗺️ Farm Locations — Kazakhstan</h2>
          </div>
          <div style={{ height: '350px' }}>
            <Map />
          </div>
        </div>

        {/* Credit Applications */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>💳 Credit Applications</h2>
          </div>
          <div style={{ padding: '16px' }}>
            {credits.map((c) => (
              <div key={c.farmer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #1e293b' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{c.farmer}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>{c.amount}</div>
                </div>
                <span style={{ background: statusColor(c.status) + '22', color: statusColor(c.status), padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Farm Table */}
      <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>🌿 Field Health Monitor</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['Farm', 'Farmer', 'Region', 'Crop', 'FHS Score', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {farms.map((f) => (
              <tr key={f.name} style={{ borderBottom: '1px solid #0f172a' }}>
                <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '500' }}>{f.name}</td>
                <td style={{ padding: '14px 20px', fontSize: '14px', color: '#94a3b8' }}>{f.farmer}</td>
                <td style={{ padding: '14px 20px', fontSize: '14px', color: '#94a3b8' }}>{f.region}</td>
                <td style={{ padding: '14px 20px', fontSize: '14px', color: '#94a3b8' }}>{f.crop}</td>
                <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '700', color: statusColor(f.status) }}>{f.fhs}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ background: statusColor(f.status) + '22', color: statusColor(f.status), padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
