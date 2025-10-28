'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsApi, recommendationsApi, competitorsApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target, 
  Users,
  Lightbulb,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowLeft,
  Plus,
  ExternalLink,
  Trash2
} from 'lucide-react'

export default function ProjectAnalyticsPage() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedDays, setSelectedDays] = useState(30)
  const [showCompetitorModal, setShowCompetitorModal] = useState(false)

  // Fetch analytics trends
  const { data: trendsData } = useQuery({
    queryKey: ['analytics-trends', projectId, selectedDays],
    queryFn: async () => {
      const response = await analyticsApi.getTrends(projectId, selectedDays)
      return response.data
    },
  })

  // Fetch issue distribution
  const { data: issuesData } = useQuery({
    queryKey: ['analytics-issues', projectId],
    queryFn: async () => {
      const response = await analyticsApi.getIssueDistribution(projectId)
      return response.data
    },
  })

  // Fetch performance metrics
  const { data: performanceData } = useQuery({
    queryKey: ['analytics-performance', projectId],
    queryFn: async () => {
      const response = await analyticsApi.getPerformanceMetrics(projectId, 10)
      return response.data
    },
  })

  // Fetch competitors comparison
  const { data: comparisonData, refetch: refetchComparison } = useQuery({
    queryKey: ['competitors-compare', projectId],
    queryFn: async () => {
      const response = await competitorsApi.compare(projectId)
      return response.data
    },
  })

  const trends = trendsData?.trends || []
  const statistics = trendsData?.statistics || {}
  const bySeverity = issuesData?.bySeverity || []
  const byCategory = issuesData?.byCategory || []
  const performance = performanceData?.performance || []

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/project/${projectId}`)}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Analytics & Insights</h1>
            
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              {[7, 14, 30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setSelectedDays(days)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedDays === days
                      ? 'bg-primary text-white'
                      : 'bg-background-card text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Avg Score"
            value={statistics.avgScore || 0}
            change={statistics.scoreChangePercent}
            icon={<BarChart3 className="w-5 h-5" />}
            suffix="/100"
          />
          <StatCard
            title="Best Score"
            value={statistics.maxScore || 0}
            icon={<TrendingUp className="w-5 h-5 text-success" />}
            suffix="/100"
          />
          <StatCard
            title="Lowest Score"
            value={statistics.minScore || 0}
            icon={<TrendingDown className="w-5 h-5 text-error" />}
            suffix="/100"
          />
          <StatCard
            title="Total Audits"
            value={statistics.totalAudits || 0}
            icon={<Target className="w-5 h-5 text-accent" />}
          />
        </div>

        {/* Trends Chart */}
        {trends.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4">Score Trends</h2>
            <div className="space-y-4">
              {trends.map((audit: any, index: number) => (
                <div key={audit.id} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-24 text-sm text-text-secondary">
                    {new Date(audit.completedAt).toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-background-secondary rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                          style={{ width: `${audit.totalScore}%` }}
                        />
                      </div>
                      <div className="font-semibold text-lg w-16 text-right">
                        {audit.totalScore}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issue Distribution */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* By Severity */}
          {bySeverity.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Issues by Severity</h2>
              <div className="space-y-3">
                {bySeverity.map((item: any) => (
                  <div key={item.severity} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.severity === 'CRITICAL' && <AlertCircle className="w-5 h-5 text-error" />}
                      {item.severity === 'WARNING' && <AlertCircle className="w-5 h-5 text-warning" />}
                      {item.severity === 'INFO' && <Info className="w-5 h-5 text-info" />}
                      <span className="capitalize">{item.severity.toLowerCase()}</span>
                    </div>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Category */}
          {byCategory.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Issues by Category</h2>
              <div className="space-y-3">
                {byCategory.map((item: any) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <span className="capitalize">{item.category.toLowerCase().replace('_', ' ')}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Competitors Comparison */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Competitor Analysis
            </h2>
            <button
              onClick={() => setShowCompetitorModal(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Competitor
            </button>
          </div>

          {comparisonData?.rankings && comparisonData.rankings.length > 0 ? (
            <>
              <div className="space-y-4 mb-6">
                {comparisonData.rankings.map((site: any) => (
                  <div key={site.name} className="flex items-center gap-4 p-4 bg-background-secondary rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                      {site.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{site.name}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-2xl font-bold">{site.totalScore}</span>
                      <span className="text-sm text-text-secondary">/100</span>
                    </div>
                  </div>
                ))}
              </div>

              {comparisonData.competitors.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-3">Tracked Competitors</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {comparisonData.competitors.map((comp: any) => (
                      <div
                        key={comp.id}
                        className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{comp.name}</div>
                          <div className="text-sm text-text-secondary">{comp.domain}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {comp.scores && (
                            <span className="font-semibold">{comp.scores.total}/100</span>
                          )}
                          <button
                            onClick={async () => {
                              if (confirm('Remove this competitor?')) {
                                try {
                                  await competitorsApi.delete(comp.id)
                                  toast.success('Competitor removed')
                                  refetchComparison()
                                } catch (error) {
                                  toast.error('Failed to remove competitor')
                                }
                              }
                            }}
                            className="p-2 hover:bg-background rounded transition-colors text-error"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No competitors tracked yet. Add competitors to compare your performance.</p>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        {performance.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Performance Over Time</h2>
            <div className="space-y-3">
              {performance.map((audit: any) => (
                <div key={audit.auditId} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-24 text-sm text-text-secondary">
                    {new Date(audit.completedAt).toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-background-secondary rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all"
                          style={{ width: `${audit.performanceScore}%` }}
                        />
                      </div>
                      <div className="font-semibold w-12 text-right">
                        {audit.performanceScore}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showCompetitorModal && (
          <AddCompetitorModal
            projectId={projectId}
            onClose={() => setShowCompetitorModal(false)}
            onSuccess={() => {
              refetchComparison()
              setShowCompetitorModal(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  change,
  icon,
  suffix = '',
}: {
  title: string
  value: number
  change?: number
  icon: React.ReactNode
  suffix?: string
}) {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-3">
        <span className="text-text-secondary text-sm">{title}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="text-3xl font-bold mb-1">
        {value}
        {suffix && <span className="text-lg text-text-secondary">{suffix}</span>}
      </div>
      {change !== undefined && change !== 0 && (
        <div className={`text-sm flex items-center gap-1 ${change > 0 ? 'text-success' : 'text-error'}`}>
          {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
  )
}

function AddCompetitorModal({
  projectId,
  onClose,
  onSuccess,
}: {
  projectId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await competitorsApi.create(projectId, { name, domain })
      toast.success('Competitor added successfully!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add competitor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="card max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Add Competitor</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Competitor Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Competitor Inc."
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="competitor.com"
              className="input"
              required
              disabled={loading}
            />
            <p className="text-xs text-text-secondary mt-1">
              Enter just the domain (without https://)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Competitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

