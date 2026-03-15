'use client'

import { useEffect, useState } from 'react'

interface Analytics {
  hitRate: number
  complianceRate: number
  anomalyPrecision: number
}

interface Decision {
  id: number
  farmId: number
  decision: string
  appliedAt: string
}

export default function ShadowAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [decisions, setDecisions] = useState<Decision[]>([])

  useEffect(() => {
    fetch('/api/shadow/analytics').then(res => res.json()).then(setAnalytics)
    // Mock decisions
    setDecisions([
      { id: 1, farmId: 1, decision: 'Irrigate 5m3', appliedAt: '2024-03-01' },
      { id: 2, farmId: 2, decision: 'No action', appliedAt: '2024-03-02' },
    ])
  }, [])

  const enableFullAutonomy = analytics && analytics.hitRate > 75

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-6">Shadow Analytics</h1>

      {analytics && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface p-4 rounded">
            <h3>Hit Rate</h3>
            <p>{analytics.hitRate}%</p>
          </div>
          <div className="bg-surface p-4 rounded">
            <h3>Compliance</h3>
            <p>{analytics.complianceRate.toFixed(1)}%</p>
          </div>
          <div className="bg-surface p-4 rounded">
            <h3>Delta</h3>
            <p>5.2%</p>
          </div>
          <div className="bg-surface p-4 rounded">
            <h3>Precision</h3>
            <p>{analytics.anomalyPrecision.toFixed(1)}%</p>
          </div>
        </div>
      )}

      <button disabled={!enableFullAutonomy} className="bg-accent text-white p-2 rounded mb-6">
        Full Autonomy Aç
      </button>

      <table className="w-full bg-surface">
        <thead>
          <tr>
            <th className="p-2">Farm ID</th>
            <th className="p-2">Decision</th>
            <th className="p-2">Applied At</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map(d => (
            <tr key={d.id}>
              <td className="p-2">{d.farmId}</td>
              <td className="p-2">{d.decision}</td>
              <td className="p-2">{d.appliedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}