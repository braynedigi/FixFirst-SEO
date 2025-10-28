'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { dashboardAnalyticsApi } from '@/lib/api'
import { 
  ArrowLeft, TrendingUp, TrendingDown, BarChart3, PieChart, 
  Activity, Calendar, Target, Award 
} from 'lucide-react'
import { 
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'

const TIME_RANGES = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
]

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']

export default function AnalyticsPage() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState(30)

  // Fetch analytics data
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview', timeRange],
    queryFn: async () => {
      const response = await dashboardAnalyticsApi.getOverview(timeRange)
      return response.data
    },
  })

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-trends', timeRange],
    queryFn: async () => {
      const response = await dashboardAnalyticsApi.getTrends(timeRange)
      return response.data
    },
  })

  const { data: comparison, isLoading: comparisonLoading } = useQuery({
    queryKey: ['analytics-comparison'],
    queryFn: async () => {
      const response = await dashboardAnalyticsApi.getProjectComparison()
      return response.data
    },
  })

  const { data: distribution, isLoading: distributionLoading } = useQuery({
    queryKey: ['analytics-distribution'],
    queryFn: async () => {
      const response = await dashboardAnalyticsApi.getScoreDistribution()
      return response.data
    },
  })

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['analytics-activity', timeRange],
    queryFn: async () => {
      const response = await dashboardAnalyticsApi.getActivitySummary(timeRange)
      return response.data
    },
  })

  const isLoading = overviewLoading || trendsLoading || comparisonLoading || distributionLoading || activityLoading

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Prepare distribution chart data
  const distributionData = distribution ? [
    { name: 'Excellent (90+)', value: distribution.distribution.excellent, color: '#10b981' },
    { name: 'Good (70-89)', value: distribution.distribution.good, color: '#3b82f6' },
    { name: 'Needs Work (50-69)', value: distribution.distribution.needsWork, color: '#f59e0b' },
    { name: 'Poor (<50)', value: distribution.distribution.poor, color: '#ef4444' },
  ].filter(d => d.value > 0) : []

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Portfolio Analytics</h1>
              <p className="text-text-secondary mt-1">Comprehensive insights across all your projects</p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === range.value
                    ? 'bg-primary text-white'
                    : 'bg-background-card text-text-secondary hover:text-text-primary'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Target className="w-6 h-6" />}
            label="Average Score"
            value={overview?.overview.avgTotalScore || 0}
            trend={overview?.overview.scoreTrend}
            suffix="/100"
          />
          <StatCard
            icon={<BarChart3 className="w-6 h-6" />}
            label="Total Projects"
            value={overview?.overview.totalProjects || 0}
          />
          <StatCard
            icon={<Activity className="w-6 h-6" />}
            label="Total Audits"
            value={overview?.overview.totalAudits || 0}
            timeRange={`Last ${timeRange} days`}
          />
          <StatCard
            icon={<Award className="w-6 h-6" />}
            label="Performance"
            value={overview?.overview.avgPerformanceScore || 0}
            suffix="/100"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Score Trends */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Score Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgTotalScore" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Total Score"
                  dot={{ fill: '#8b5cf6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgPerformanceScore" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Performance"
                  dot={{ fill: '#10b981' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgTechnicalScore" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Technical"
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Score Distribution */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Score Distribution
            </h2>
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-text-secondary">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Activity Chart */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Audit Activity
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activity?.activity || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
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
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="failed" fill="#ef4444" name="Failed" />
              <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top & Bottom Performing Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Performing */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-green-400">
              <TrendingUp className="w-5 h-5" />
              Top Performing Projects
            </h2>
            <div className="space-y-3">
              {overview?.topPerforming.map((project: any, index: number) => (
                <div 
                  key={project.projectId} 
                  className="flex items-center justify-between p-3 bg-background-secondary rounded-lg hover:bg-background-card transition-colors cursor-pointer"
                  onClick={() => router.push(`/project/${project.projectId}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{project.projectName}</p>
                      <p className="text-sm text-text-secondary">{project.domain}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">{project.totalScore}</p>
                    <p className="text-xs text-text-secondary">Score</p>
                  </div>
                </div>
              ))}
              {(!overview?.topPerforming || overview.topPerforming.length === 0) && (
                <p className="text-text-secondary text-center py-4">No projects yet</p>
              )}
            </div>
          </div>

          {/* Bottom Performing */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-orange-400">
              <TrendingDown className="w-5 h-5" />
              Needs Attention
            </h2>
            <div className="space-y-3">
              {overview?.bottomPerforming.map((project: any, index: number) => (
                <div 
                  key={project.projectId} 
                  className="flex items-center justify-between p-3 bg-background-secondary rounded-lg hover:bg-background-card transition-colors cursor-pointer"
                  onClick={() => router.push(`/project/${project.projectId}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{project.projectName}</p>
                      <p className="text-sm text-text-secondary">{project.domain}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-400">{project.totalScore}</p>
                    <p className="text-xs text-text-secondary">Score</p>
                  </div>
                </div>
              ))}
              {(!overview?.bottomPerforming || overview.bottomPerforming.length === 0) && (
                <p className="text-text-secondary text-center py-4">No projects yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Project Comparison Table */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">All Projects Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Project</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-medium">Total</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-medium">Performance</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-medium">Technical</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-medium">On-Page</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-medium">Audits</th>
                </tr>
              </thead>
              <tbody>
                {comparison?.projects.map((project: any) => (
                  <tr 
                    key={project.id} 
                    className="border-b border-border hover:bg-background-secondary transition-colors cursor-pointer"
                    onClick={() => router.push(`/project/${project.id}`)}
                  >
                    <td className="py-3 px-4">
                      <p className="font-medium text-text-primary">{project.name}</p>
                      <p className="text-sm text-text-secondary">{project.domain}</p>
                    </td>
                    <td className="text-center py-3 px-4">
                      <ScoreBadge score={project.latestAudit?.totalScore} />
                    </td>
                    <td className="text-center py-3 px-4">
                      <ScoreBadge score={project.latestAudit?.performanceScore} />
                    </td>
                    <td className="text-center py-3 px-4">
                      <ScoreBadge score={project.latestAudit?.technicalScore} />
                    </td>
                    <td className="text-center py-3 px-4">
                      <ScoreBadge score={project.latestAudit?.onPageScore} />
                    </td>
                    <td className="text-center py-3 px-4 text-text-secondary">
                      {project.totalAudits}
                    </td>
                  </tr>
                ))}
                {(!comparison?.projects || comparison.projects.length === 0) && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-text-secondary">
                      No projects yet. Create your first project to see analytics!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, trend, suffix, timeRange }: any) {
  const trendColor = trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : null

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="text-primary">{icon}</div>
        {trend !== undefined && TrendIcon && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{Math.abs(trend)}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-text-primary">
          {value}{suffix}
        </p>
        <p className="text-sm text-text-secondary mt-1">{label}</p>
        {timeRange && <p className="text-xs text-text-muted mt-1">{timeRange}</p>}
      </div>
    </div>
  )
}

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) {
    return <span className="text-text-muted">-</span>
  }

  const color = score >= 90 
    ? 'text-green-400' 
    : score >= 70 
    ? 'text-blue-400' 
    : score >= 50 
    ? 'text-orange-400' 
    : 'text-red-400'

  return <span className={`font-semibold ${color}`}>{score}</span>
}

