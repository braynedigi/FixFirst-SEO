'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backlinksApi } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Link as LinkIcon, TrendingUp, Shield, AlertCircle,
  ExternalLink, Check, X, Filter, Plus, Play, Trash2
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

const COLORS = ['#10b981', '#f59e0b', '#ef4444']

export default function BacklinksPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id as string
  const queryClient = useQueryClient()
  
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showMonitorModal, setShowMonitorModal] = useState(false)

  // Fetch backlinks
  const { data: backlinks, isLoading: backlinksLoading } = useQuery({
    queryKey: ['backlinks', projectId, statusFilter],
    queryFn: async () => {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {}
      const response = await backlinksApi.getByProject(projectId, filters)
      return response.data
    },
  })

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['backlink-stats', projectId],
    queryFn: async () => {
      const response = await backlinksApi.getStats(projectId)
      return response.data
    },
  })

  // Fetch quality analysis
  const { data: quality } = useQuery({
    queryKey: ['backlink-quality', projectId],
    queryFn: async () => {
      const response = await backlinksApi.getQuality(projectId)
      return response.data
    },
  })

  // Fetch trends
  const { data: trends } = useQuery({
    queryKey: ['backlink-trends', projectId],
    queryFn: async () => {
      const response = await backlinksApi.getTrends(projectId, 30)
      return response.data
    },
  })

  // Fetch monitors
  const { data: monitors } = useQuery({
    queryKey: ['backlink-monitors', projectId],
    queryFn: async () => {
      const response = await backlinksApi.getMonitors(projectId)
      return response.data
    },
  })

  if (backlinksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Prepare quality chart data
  const qualityData = quality ? [
    { name: 'High Quality', value: quality.high, color: '#10b981' },
    { name: 'Medium Quality', value: quality.medium, color: '#f59e0b' },
    { name: 'Low Quality', value: quality.low, color: '#ef4444' },
  ].filter(d => d.value > 0) : []

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/project/${projectId}`)}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Backlink Monitoring</h1>
              <p className="text-text-secondary">Track and analyze your backlinks</p>
            </div>
          </div>
          <button
            onClick={() => setShowMonitorModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Monitor
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<LinkIcon className="w-6 h-6" />}
            label="Total Backlinks"
            value={stats?.total || 0}
            color="text-primary"
          />
          <StatCard
            icon={<Check className="w-6 h-6" />}
            label="Active"
            value={stats?.active || 0}
            color="text-green-400"
          />
          <StatCard
            icon={<Shield className="w-6 h-6" />}
            label="Avg Domain Authority"
            value={stats?.avgDomainAuthority || 0}
            suffix="/100"
            color="text-blue-400"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Dofollow Links"
            value={stats?.dofollow || 0}
            color="text-purple-400"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Quality Distribution */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Link Quality</h2>
            {qualityData.length > 0 ? (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={qualityData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {qualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {qualityData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-text-secondary">{item.name}</span>
                      </div>
                      <span className="font-semibold text-text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-text-secondary">No data available</p>
            )}
          </div>

          {/* Trends */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">New Backlinks (30 days)</h2>
            {trends && trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="New Links"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-text-secondary">No trend data available</p>
            )}
          </div>
        </div>

        {/* Monitors Section */}
        {monitors && monitors.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Active Monitors</h2>
            <div className="space-y-3">
              {monitors.map((monitor: any) => (
                <MonitorCard key={monitor.id} monitor={monitor} projectId={projectId} />
              ))}
            </div>
          </div>
        )}

        {/* Backlinks Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Backlinks</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-background-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-primary text-white'
                    : 'bg-background-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('LOST')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  statusFilter === 'LOST'
                    ? 'bg-primary text-white'
                    : 'bg-background-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                Lost
              </button>
            </div>
          </div>
          
          {backlinks && backlinks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Source</th>
                    <th className="text-center py-3 px-4 text-text-secondary font-medium">DA</th>
                    <th className="text-center py-3 px-4 text-text-secondary font-medium">PA</th>
                    <th className="text-center py-3 px-4 text-text-secondary font-medium">Spam</th>
                    <th className="text-center py-3 px-4 text-text-secondary font-medium">Rel</th>
                    <th className="text-center py-3 px-4 text-text-secondary font-medium">Status</th>
                    <th className="text-center py-3 px-4 text-text-secondary font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {backlinks.map((backlink: any) => (
                    <tr key={backlink.id} className="border-b border-border hover:bg-background-secondary transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-text-primary">{backlink.sourceDomain}</p>
                          {backlink.anchorText && (
                            <p className="text-sm text-text-secondary truncate max-w-xs">
                              "{backlink.anchorText}"
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <ScoreBadge score={backlink.domainAuthority} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <ScoreBadge score={backlink.pageAuthority} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <SpamBadge score={backlink.spamScore} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <RelBadge rel={backlink.rel} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={backlink.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={backlink.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <LinkIcon className="w-12 h-12 mx-auto mb-4 text-text-muted" />
              <p className="text-text-secondary mb-4">No backlinks found</p>
              <button
                onClick={() => setShowMonitorModal(true)}
                className="btn-primary"
              >
                Create Your First Monitor
              </button>
            </div>
          )}
        </div>

        {/* Monitor Modal */}
        {showMonitorModal && (
          <MonitorModal
            projectId={projectId}
            onClose={() => setShowMonitorModal(false)}
          />
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, suffix, color }: any) {
  return (
    <div className="card">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-3xl font-bold text-text-primary">
        {value}{suffix}
      </p>
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  )
}

function MonitorCard({ monitor, projectId }: any) {
  const queryClient = useQueryClient()

  const runCheckMutation = useMutation({
    mutationFn: () => backlinksApi.runCheck(monitor.id),
    onSuccess: () => {
      toast.success('Monitor check completed!')
      queryClient.invalidateQueries({ queryKey: ['backlink-monitors', projectId] })
      queryClient.invalidateQueries({ queryKey: ['backlinks', projectId] })
    },
    onError: () => {
      toast.error('Failed to run check')
    },
  })

  return (
    <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
      <div>
        <h3 className="font-semibold text-text-primary">{monitor.name}</h3>
        <p className="text-sm text-text-secondary">{monitor.targetUrl}</p>
        <p className="text-xs text-text-muted mt-1">
          {monitor.totalBacklinks} backlinks • {monitor.checkFrequency} checks
        </p>
      </div>
      <button
        onClick={() => runCheckMutation.mutate()}
        disabled={runCheckMutation.isPending}
        className="btn-secondary flex items-center gap-2"
      >
        <Play className="w-4 h-4" />
        {runCheckMutation.isPending ? 'Checking...' : 'Check Now'}
      </button>
    </div>
  )
}

function MonitorModal({ projectId, onClose }: any) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [frequency, setFrequency] = useState('daily')

  const createMutation = useMutation({
    mutationFn: () => backlinksApi.createMonitor({
      projectId,
      name,
      targetUrl,
      checkFrequency: frequency,
    }),
    onSuccess: () => {
      toast.success('Monitor created successfully!')
      queryClient.invalidateQueries({ queryKey: ['backlink-monitors', projectId] })
      onClose()
    },
    onError: () => {
      toast.error('Failed to create monitor')
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Create Backlink Monitor</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Monitor Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Homepage Monitor"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Target URL</label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Check Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="input w-full"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !name || !targetUrl}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Monitor'}
            </button>
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) return <span className="text-text-muted">-</span>
  const color = score >= 50 ? 'text-green-400' : score >= 30 ? 'text-orange-400' : 'text-red-400'
  return <span className={`font-semibold ${color}`}>{score}</span>
}

function SpamBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) return <span className="text-text-muted">-</span>
  const color = score <= 20 ? 'text-green-400' : score <= 40 ? 'text-orange-400' : 'text-red-400'
  return <span className={`font-semibold ${color}`}>{score}</span>
}

function RelBadge({ rel }: { rel?: string }) {
  if (!rel) return <span className="text-text-muted">-</span>
  const isDofollow = rel === 'dofollow'
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      isDofollow ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
    }`}>
      {rel}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    ACTIVE: 'bg-green-500/20 text-green-400',
    LOST: 'bg-red-500/20 text-red-400',
    BROKEN: 'bg-orange-500/20 text-orange-400',
    NOFOLLOW: 'bg-gray-500/20 text-gray-400',
  }
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.ACTIVE}`}>
      {status}
    </span>
  )
}

