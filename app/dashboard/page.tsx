'use client'

import { useState, useEffect } from 'react'
import { PrismaClient } from '@prisma/client'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, MapPin, TrendingUp, CreditCard, Droplets, Wheat, AlertCircle, CheckCircle } from 'lucide-react'

// Dynamic import for Leaflet to avoid SSR issues
const Map = dynamic(() => import('@/components/dashboard/map'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-800 rounded-lg flex items-center justify-center">Loading map...</div>
})

const prisma = new PrismaClient()

interface FarmData {
  id: number
  name: string
  farmerName: string
  region: string
  cropType: string
  fhsScore: number
  lat: number
  lng: number
  lastIrrigation: Date
  areaHa: number
}

interface CreditApplication {
  id: number
  farmerName: string
  farmName: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED'
  savingsSharePct: number
  createdAt: Date
}

interface DashboardStats {
  totalFarmers: number
  totalFields: number
  averageFHS: number
  pendingCredits: number
}

export default function Dashboard() {
  const [farmData, setFarmData] = useState<FarmData[]>([])
  const [creditApplications, setCreditApplications] = useState<CreditApplication[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalFarmers: 0,
    totalFields: 0,
    averageFHS: 0,
    pendingCredits: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data from API
      const [farmsResponse, creditsResponse] = await Promise.all([
        fetch('/api/dashboard/farms').then(res => res.json()),
        fetch('/api/dashboard/credits').then(res => res.json())
      ])

      const farms = farmsResponse.farms || []
      const credits = creditsResponse.credits || []

      setFarmData(farms)
      setCreditApplications(credits)

      // Calculate stats
      const totalFarmers = new Set(farms.map(f => f.farmerName)).size
      const totalFields = farms.length
      const averageFHS = farms.length > 0 
        ? Math.round(farms.reduce((sum, f) => sum + f.fhsScore, 0) / farms.length)
        : 0
      const pendingCredits = credits.filter(c => c.status === 'PENDING').length

      setStats({
        totalFarmers,
        totalFields,
        averageFHS,
        pendingCredits
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFHSColor = (score: number) => {
    if (score > 75) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getMarkerColor = (score: number) => {
    if (score > 75) return '#22c55e'
    if (score >= 50) return '#eab308'
    return '#ef4444'
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      APPROVED: 'bg-green-500 text-white',
      PENDING: 'bg-yellow-500 text-white',
      REJECTED: 'bg-red-500 text-white'
    }
    return variants[status as keyof typeof variants] || 'bg-gray-500 text-white'
  }

  const getHealthStatus = (score: number) => {
    if (score > 75) return { text: 'Healthy', color: 'bg-green-500' }
    if (score >= 50) return { text: 'At Risk', color: 'bg-yellow-500' }
    return { text: 'Critical', color: 'bg-red-500' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Branding */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mr-4">
              <Wheat className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">BerekeAI Investor Dashboard</h1>
              <p className="text-gray-400">Real-time agricultural insights across Kazakhstan</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>Live Data</span>
            <span className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>Kazakhstan Region</span>
            <span className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* TOP STATS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700 hover:border-emerald-500 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Farmers</CardTitle>
              <Users className="h-5 w-5 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{stats.totalFarmers}</div>
              <p className="text-xs text-gray-500 mt-1">Active partners</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:border-emerald-500 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Fields</CardTitle>
              <MapPin className="h-5 w-5 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{stats.totalFields}</div>
              <p className="text-xs text-gray-500 mt-1">Across Kazakhstan</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:border-emerald-500 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Field Health Score</CardTitle>
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getFHSColor(stats.averageFHS)}`}>
                {stats.averageFHS}
              </div>
              <p className="text-xs text-gray-500 mt-1">Scale: 0-100</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:border-emerald-500 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Pending Credits</CardTitle>
              <CreditCard className="h-5 w-5 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{stats.pendingCredits}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* INTERACTIVE MAP */}
          <Card className="bg-gray-800 border-gray-700 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-emerald-400" />
                Farm Locations - Kazakhstan
              </CardTitle>
              <p className="text-sm text-gray-400">Real-time field health monitoring</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96">
                <Map 
                  farms={farmData.map(farm => ({
                    ...farm,
                    color: getMarkerColor(farm.fhsScore)
                  }))} 
                />
              </div>
            </CardContent>
          </Card>

          {/* FIELD HEALTH SCORE TABLE */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" />
                Field Health Scores
              </CardTitle>
              <p className="text-sm text-gray-400">Performance metrics across all farms</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-2 text-gray-400">Farmer</th>
                      <th className="text-left p-2 text-gray-400">Region</th>
                      <th className="text-left p-2 text-gray-400">Crop</th>
                      <th className="text-left p-2 text-gray-400">FHS</th>
                      <th className="text-left p-2 text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmData.slice(0, 8).map((farm, index) => {
                      const healthStatus = getHealthStatus(farm.fhsScore)
                      return (
                        <tr key={farm.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                          <td className="p-2 text-white">{farm.farmerName}</td>
                          <td className="p-2 text-gray-300">{farm.region}</td>
                          <td className="p-2 text-gray-300">{farm.cropType}</td>
                          <td className={`p-2 font-semibold ${getFHSColor(farm.fhsScore)}`}>
                            {farm.fhsScore}
                          </td>
                          <td className="p-2">
                            <Badge className={`${healthStatus.color} text-white text-xs`}>
                              {healthStatus.text}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CREDIT APPLICATIONS PANEL */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-emerald-400" />
              Credit Applications
            </CardTitle>
            <p className="text-sm text-gray-400">Water-saving investment opportunities</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {creditApplications.map((application) => (
                <div key={application.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-white">{application.farmerName}</div>
                    <div className="text-sm text-gray-400">{application.farmName}</div>
                    <div className="text-sm text-gray-500">
                      {application.savingsSharePct.toFixed(1)}% share • {new Date(application.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge className={`${getStatusBadge(application.status)} text-sm`}>
                    {application.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
