'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { auditsApi, comparisonApi, reportsApi } from '@/lib/api'
import { formatDateTime, getScoreColor, getScoreGrade, getSeverityBadgeClass } from '@/lib/utils'
import { ArrowLeft, Download, RefreshCw, AlertTriangle, CheckCircle2, Info, TrendingUp, Lightbulb, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import TrendChart from '@/components/TrendChart'
import Recommendations from '@/components/Recommendations'
import { useAuditWebSocket } from '@/hooks/useAuditWebSocket'

type TabType = 'overview' | 'technical' | 'onpage' | 'schema' | 'performance' | 'local' | 'trends' | 'recommendations'

export default function AuditResultsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const auditId = params.id as string
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [realtimeProgress, setRealtimeProgress] = useState<number | null>(null)
  const [realtimeMessage, setRealtimeMessage] = useState<string | null>(null)

  const { data: audit, isLoading, refetch } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      const response = await auditsApi.getOne(auditId)
      return response.data
    },
    // Remove polling - WebSocket will handle updates
    refetchInterval: false,
    staleTime: 0,
  })

  // WebSocket real-time updates
  const { isConnected } = useAuditWebSocket({
    auditId,
    onUpdate: (update) => {
      // Update real-time progress
      if (update.progress !== undefined) {
        setRealtimeProgress(update.progress)
      }
      if (update.message) {
        setRealtimeMessage(update.message)
      }

      // Refetch audit data if status changed
      if (update.status === 'COMPLETED' || update.status === 'FAILED') {
        refetch()
      }
    },
    onComplete: () => {
      toast.success('Audit completed successfully! 🎉', { duration: 5000 })
      // Refetch to get final data
      refetch()
      // Also refetch trend data
      queryClient.invalidateQueries({ queryKey: ['trends', audit?.project?.id] })
    },
    onError: (error) => {
      toast.error(`Audit failed: ${error}`, { duration: 5000 })
      refetch()
    },
  })

  // Fallback: if WebSocket misses events, periodically refetch while running
  useEffect(() => {
    if (!audit) return
    if (audit.status === 'COMPLETED' || audit.status === 'FAILED') return

    const intervalId = setInterval(() => {
      refetch()
    }, 4000)

    return () => clearInterval(intervalId)
  }, [audit, refetch])

  // Fetch historical trend data for this project
  const { data: trendData } = useQuery({
    queryKey: ['trends', audit?.project?.id],
    queryFn: async () => {
      if (!audit?.project?.id) return []
      const response = await comparisonApi.getTrends(audit.project.id, 15)
      return response.data
    },
    enabled: !!audit?.project?.id && audit?.status === 'COMPLETED',
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading audit...</p>
        </div>
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
          <p className="text-text-secondary">Audit not found</p>
          <button onClick={() => router.push('/dashboard')} className="btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isRunning = audit.status === 'QUEUED' || audit.status === 'RUNNING'
  const isCompleted = audit.status === 'COMPLETED'

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm md:text-base"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            Back to Dashboard
          </button>

          {isCompleted && (
            <div className="flex flex-wrap gap-2 md:gap-3 w-full sm:w-auto">
              <button 
                onClick={() => {
                  try {
                    toast.success('Generating PDF Report...', { duration: 2000 })
                    reportsApi.downloadPDF(auditId)
                  } catch (error) {
                    toast.error('Failed to generate PDF')
                  }
                }}
                className="btn-primary flex items-center gap-2 text-sm md:text-base"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">PDF Report</span>
                <span className="sm:hidden">PDF</span>
              </button>
              
              {/* Export Dropdown */}
              <div className="relative group">
                <button className="btn-secondary flex items-center gap-2 text-sm md:text-base">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export Data</span>
                  <span className="sm:hidden">Export</span>
                </button>
                
                <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-background-card border border-border rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      try {
                        toast.success('Downloading Issues CSV...', { duration: 2000 })
                        reportsApi.downloadIssuesCSV(auditId)
                      } catch (error) {
                        toast.error('Failed to download CSV')
                      }
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-background-secondary flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Issues CSV
                  </button>
                  <button
                    onClick={() => {
                      try {
                        toast.success('Downloading Recommendations CSV...', { duration: 2000 })
                        reportsApi.downloadRecommendationsCSV(auditId)
                      } catch (error) {
                        toast.error('Failed to download CSV')
                      }
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-background-secondary flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Recommendations CSV
                  </button>
                  <button
                    onClick={() => {
                      try {
                        toast.success('Downloading Legacy CSV...', { duration: 2000 })
                        auditsApi.exportCSV(auditId)
                      } catch (error) {
                        toast.error('Failed to download CSV')
                      }
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-background-secondary flex items-center gap-2 text-sm rounded-b-lg"
                  >
                    <Download className="w-4 h-4" />
                    Full Report CSV
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => refetch()}
                className="btn-secondary flex items-center gap-2 flex-1 sm:flex-initial justify-center text-sm md:text-base"
              >
                <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* Audit Header */}
        <div className="card mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold mb-2 break-words">{audit.url}</h1>
              <p className="text-sm md:text-base text-text-secondary">
                {audit.project?.name} • {formatDateTime(audit.startedAt)}
              </p>
            </div>

            {isCompleted && audit.totalScore !== null && (
              <div className="text-center md:text-right flex-shrink-0">
                <div className={`text-4xl md:text-5xl font-bold ${getScoreColor(audit.totalScore)} mb-2`}>
                  {audit.totalScore}
                </div>
                <div className="text-xs md:text-sm text-text-secondary">
                  Grade {getScoreGrade(audit.totalScore)}
                </div>
              </div>
            )}
          </div>

            {isRunning && (
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 md:gap-3 text-primary text-sm md:text-base">
                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span>{realtimeMessage || 'Audit in progress...'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected && (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        Live
                      </span>
                    )}
                    <span className="text-xs text-text-secondary">
                      {realtimeProgress !== null ? `${realtimeProgress}%` : '...'}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-background-secondary rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${realtimeProgress !== null ? realtimeProgress : 50}%` }} 
                  />
                </div>
                <p className="text-xs text-text-secondary mt-2">Real-time updates via WebSocket • No refresh needed</p>
              </div>
            )}
        </div>

        {isCompleted && (
          <>
            {/* Category Scores */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
              <CategoryScoreCard title="Technical" score={audit.technicalScore} maxScore={35} />
              <CategoryScoreCard title="On-Page" score={audit.onPageScore} maxScore={25} />
              <CategoryScoreCard title="Schema" score={audit.structuredDataScore} maxScore={20} />
              <CategoryScoreCard title="Performance" score={audit.performanceScore} maxScore={15} />
              <CategoryScoreCard title="Local SEO" score={audit.localSeoScore} maxScore={5} />
            </div>

            {/* Tabs */}
            <div className="card mb-6 md:mb-8">
              <div className="flex gap-2 md:gap-4 border-b border-border mb-4 md:mb-6 overflow-x-auto scrollbar-hide">
                <Tab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                  Overview
                </Tab>
                <Tab active={activeTab === 'technical'} onClick={() => setActiveTab('technical')}>
                  Technical
                </Tab>
                <Tab active={activeTab === 'onpage'} onClick={() => setActiveTab('onpage')}>
                  On-Page
                </Tab>
                <Tab active={activeTab === 'schema'} onClick={() => setActiveTab('schema')}>
                  Schema
                </Tab>
                <Tab active={activeTab === 'performance'} onClick={() => setActiveTab('performance')}>
                  Performance
                </Tab>
                <Tab active={activeTab === 'local'} onClick={() => setActiveTab('local')}>
                  Local SEO
                </Tab>
                {trendData && trendData.length >= 2 && (
                  <Tab active={activeTab === 'trends'} onClick={() => setActiveTab('trends')}>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Trends
                    </span>
                  </Tab>
                )}
                <Tab active={activeTab === 'recommendations'} onClick={() => setActiveTab('recommendations')}>
                  <span className="flex items-center gap-1">
                    <Lightbulb className="w-4 h-4" />
                    Recommendations
                  </span>
                </Tab>
              </div>

              <div>
                {activeTab === 'overview' && <OverviewTab audit={audit} />}
                {activeTab === 'technical' && <IssuesTab issues={audit.issues.filter((i: any) => i.rule.category === 'TECHNICAL')} />}
                {activeTab === 'onpage' && <IssuesTab issues={audit.issues.filter((i: any) => i.rule.category === 'ONPAGE')} />}
                {activeTab === 'schema' && <IssuesTab issues={audit.issues.filter((i: any) => i.rule.category === 'STRUCTURED_DATA')} />}
                {activeTab === 'performance' && <PerformanceTab audit={audit} issues={audit.issues.filter((i: any) => i.rule.category === 'PERFORMANCE')} />}
                {activeTab === 'local' && <IssuesTab issues={audit.issues.filter((i: any) => i.rule.category === 'LOCAL_SEO')} />}
                {activeTab === 'trends' && <TrendsTab trendData={trendData || []} audit={audit} />}
                {activeTab === 'recommendations' && <Recommendations auditId={auditId} />}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CategoryScoreCard({ title, score, maxScore }: { title: string; score: number; maxScore: number }) {
  const percentage = Math.min((score / maxScore) * 100, 100)
  
  return (
    <div className="card p-4 min-w-0">
      <div className="text-xs md:text-sm text-text-secondary mb-2 truncate">{title}</div>
      <div className={`text-xl md:text-2xl font-bold ${getScoreColor(percentage)}`}>
        {score}/{maxScore}
      </div>
      <div className="w-full bg-background-secondary rounded-full h-1.5 mt-2 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${percentage >= 80 ? 'bg-success' : percentage >= 50 ? 'bg-warning' : 'bg-error'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 md:pb-4 px-2 md:px-3 font-medium transition-colors relative whitespace-nowrap text-sm md:text-base flex-shrink-0 ${
        active ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
    </button>
  )
}

function OverviewTab({ audit }: { audit: any }) {
  const criticalIssues = audit.issues.filter((i: any) => i.severity === 'CRITICAL')
  const warningIssues = audit.issues.filter((i: any) => i.severity === 'WARNING')

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Issues */}
      <div>
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Critical Issues</h3>
        {criticalIssues.length > 0 ? (
          <div className="space-y-2 md:space-y-3">
            {criticalIssues.slice(0, 5).map((issue: any) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        ) : (
          <p className="text-success flex items-center gap-2 text-sm md:text-base">
            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
            No critical issues found!
          </p>
        )}
      </div>

      {warningIssues.length > 0 && (
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Warnings</h3>
          <div className="space-y-2 md:space-y-3">
            {warningIssues.slice(0, 5).map((issue: any) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Pages Crawled */}
      <div>
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Pages Crawled ({audit.pages?.length || 0})</h3>
        <div className="space-y-2">
          {audit.pages?.slice(0, 10).map((page: any) => (
            <div key={page.id} className="flex items-center justify-between text-xs md:text-sm p-2 md:p-3 bg-background-secondary rounded-lg gap-2">
              <span className="truncate flex-1 min-w-0">{page.url}</span>
              <span className={`ml-2 flex-shrink-0 font-medium ${page.statusCode === 200 ? 'text-success' : 'text-error'}`}>
                {page.statusCode}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PerformanceTab({ audit, issues }: { audit: any; issues: any[] }) {
  const psiData = audit.psiData;
  const hasPSI = psiData && psiData.mobile;

  return (
    <div className="space-y-6">
      {hasPSI ? (
        <>
          {/* Core Web Vitals */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Core Web Vitals (Mobile)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Largest Contentful Paint"
                value={psiData.mobile.lcp}
                unit="ms"
                good={2500}
                needs={4000}
                description="How quickly the main content loads"
              />
              <MetricCard
                title="Cumulative Layout Shift"
                value={psiData.mobile.cls}
                unit=""
                good={0.1}
                needs={0.25}
                description="Visual stability during page load"
                reverse
              />
              <MetricCard
                title="Interaction to Next Paint"
                value={psiData.mobile.inp}
                unit="ms"
                good={200}
                needs={500}
                description="How quickly page responds to interactions"
              />
            </div>
          </div>

          {/* PageSpeed Scores */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">PageSpeed Insights Scores</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ScoreCard title="Performance" score={psiData.mobile.performanceScore} />
              <ScoreCard title="Accessibility" score={psiData.mobile.accessibility} />
              <ScoreCard title="Best Practices" score={psiData.mobile.bestPractices} />
              <ScoreCard title="SEO" score={psiData.mobile.seo} />
            </div>
          </div>

          {/* Mobile vs Desktop */}
          {psiData.desktop && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Desktop Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="LCP (Desktop)"
                  value={psiData.desktop.lcp}
                  unit="ms"
                  good={2500}
                  needs={4000}
                />
                <MetricCard
                  title="CLS (Desktop)"
                  value={psiData.desktop.cls}
                  unit=""
                  good={0.1}
                  needs={0.25}
                  reverse
                />
                <MetricCard
                  title="INP (Desktop)"
                  value={psiData.desktop.inp}
                  unit="ms"
                  good={200}
                  needs={500}
                />
              </div>
            </div>
          )}

          {/* Opportunities */}
          {psiData.opportunities && psiData.opportunities.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Optimization Opportunities</h3>
              <div className="space-y-3">
                {psiData.opportunities.slice(0, 5).map((opp: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-background-secondary rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{opp.title}</h4>
                      {opp.displayValue && (
                        <span className="text-sm text-primary">{opp.displayValue}</span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">{opp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 bg-background-secondary rounded-lg border border-border">
          <p className="text-text-secondary mb-2">PageSpeed Insights data not available</p>
          <p className="text-sm text-text-secondary">This audit was run without PSI analysis</p>
        </div>
      )}

      {/* SEO Performance Rules */}
      {issues.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Performance Issues</h3>
          <div className="space-y-3">
            {issues.map((issue: any) => (
              <IssueCard key={issue.id} issue={issue} expanded />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  title,
  value,
  unit,
  good,
  needs,
  description,
  reverse = false,
}: {
  title: string
  value: number | null
  unit: string
  good: number
  needs: number
  description: string
  reverse?: boolean
}) {
  if (value === null) {
    return (
      <div className="card p-4">
        <h4 className="text-sm font-medium mb-2">{title}</h4>
        <p className="text-2xl font-bold text-text-secondary">-</p>
        <p className="text-xs text-text-secondary mt-2">{description}</p>
      </div>
    )
  }

  // Determine color based on threshold (reverse for CLS where lower is better)
  let color = 'text-success'
  if (reverse) {
    if (value > needs) color = 'text-error'
    else if (value > good) color = 'text-warning'
  } else {
    if (value > needs) color = 'text-error'
    else if (value > good) color = 'text-warning'
  }

  return (
    <div className="card p-4">
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      <p className={`text-2xl font-bold ${color}`}>
        {value.toLocaleString()}
        {unit && <span className="text-base ml-1">{unit}</span>}
      </p>
      <p className="text-xs text-text-secondary mt-2">{description}</p>
    </div>
  )
}

function ScoreCard({ title, score }: { title: string; score: number }) {
  let color = 'text-success'
  let bgColor = 'bg-success/20'
  
  if (score < 50) {
    color = 'text-error'
    bgColor = 'bg-error/20'
  } else if (score < 90) {
    color = 'text-warning'
    bgColor = 'bg-warning/20'
  }

  return (
    <div className={`p-4 rounded-lg ${bgColor} border border-current/20`}>
      <p className="text-sm text-text-secondary mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{score}</p>
    </div>
  )
}

function IssuesTab({ issues }: { issues: any[] }) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-8 md:py-12">
        <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-success mx-auto mb-3 md:mb-4" />
        <p className="text-text-secondary text-sm md:text-base px-4">All checks passed! No issues found in this category.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {issues.map((issue: any) => (
        <IssueCard key={issue.id} issue={issue} expanded />
      ))}
    </div>
  )
}

function IssueCard({ issue, expanded }: { issue: any; expanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(expanded || false)

  const severityIcons = {
    CRITICAL: <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-error flex-shrink-0" />,
    WARNING: <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-warning flex-shrink-0" />,
    INFO: <Info className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />,
  }

  return (
    <div className="border border-border rounded-lg p-3 md:p-4 hover:border-primary/50 transition-all">
      <div
        className="flex items-start justify-between gap-2 md:gap-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
          {severityIcons[issue.severity as keyof typeof severityIcons]}
          <div className="flex-1 min-w-0">
            <div className="font-medium mb-1 text-sm md:text-base">{issue.rule.name}</div>
            <p className="text-xs md:text-sm text-text-secondary">{issue.message}</p>
          </div>
        </div>
        <span className={`badge text-xs flex-shrink-0 ${getSeverityBadgeClass(issue.severity)}`}>
          {issue.severity}
        </span>
      </div>

      {isExpanded && (
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border">
          <h4 className="font-medium mb-2 text-xs md:text-sm">How to Fix:</h4>
          <p className="text-xs md:text-sm text-text-secondary">{issue.recommendation}</p>
        </div>
      )}
    </div>
  )
}

function TrendsTab({ trendData, audit }: { trendData: any[]; audit: any }) {
  if (!trendData || trendData.length < 2) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Not Enough Data for Trends</h3>
        <p className="text-text-secondary">
          Run more audits for this project to see historical trends
        </p>
      </div>
    )
  }

  // Find current audit position in trends
  const currentAuditIndex = trendData.findIndex((d) => d.date === (audit.completedAt || audit.startedAt))
  const previousScore = currentAuditIndex > 0 ? trendData[currentAuditIndex - 1].totalScore : null
  const scoreChange = previousScore !== null ? audit.totalScore - previousScore : null

  return (
    <div className="space-y-6">
      {/* Improvement Summary */}
      {scoreChange !== null && (
        <div className="bg-background-secondary rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">Since Last Audit</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Score Change</p>
              <p className={`text-2xl font-bold ${scoreChange >= 0 ? 'text-success' : 'text-error'}`}>
                {scoreChange > 0 && '+'}
                {scoreChange}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Previous Score</p>
              <p className="text-2xl font-bold text-text-primary">{previousScore}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Current Score</p>
              <p className="text-2xl font-bold text-primary">{audit.totalScore}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Trend</p>
              <p className={`text-2xl font-bold ${scoreChange >= 0 ? 'text-success' : 'text-error'}`}>
                {scoreChange >= 0 ? '📈' : '📉'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Historical Trend Chart */}
      <div>
        <TrendChart data={trendData} showCategories height={400} title="Historical Performance" />
      </div>

      {/* Category Breakdown Over Time */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-background-secondary rounded-lg p-4 border border-border">
          <h4 className="font-semibold mb-3">Category Performance</h4>
          <div className="space-y-3">
            <CategoryTrend
              name="Technical SEO"
              current={audit.technicalScore}
              max={35}
              previous={trendData[currentAuditIndex - 1]?.technical}
              color="text-accent"
            />
            <CategoryTrend
              name="On-Page SEO"
              current={audit.onPageScore}
              max={25}
              previous={trendData[currentAuditIndex - 1]?.onPage}
              color="text-success"
            />
            <CategoryTrend
              name="Schema Markup"
              current={audit.structuredDataScore}
              max={20}
              previous={trendData[currentAuditIndex - 1]?.structuredData}
              color="text-warning"
            />
            <CategoryTrend
              name="Performance"
              current={audit.performanceScore}
              max={15}
              previous={trendData[currentAuditIndex - 1]?.performance}
              color="text-primary"
            />
          </div>
        </div>

        <div className="bg-background-secondary rounded-lg p-4 border border-border">
          <h4 className="font-semibold mb-3">Audit Statistics</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Total Audits</span>
              <span className="font-semibold">{trendData.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Best Score</span>
              <span className="font-semibold text-success">
                {Math.max(...trendData.map((d) => d.totalScore))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Lowest Score</span>
              <span className="font-semibold text-error">
                {Math.min(...trendData.map((d) => d.totalScore))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Average Score</span>
              <span className="font-semibold text-primary">
                {Math.round(trendData.reduce((sum, d) => sum + d.totalScore, 0) / trendData.length)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Overall Improvement</span>
              <span className={`font-semibold ${trendData[trendData.length - 1].totalScore >= trendData[0].totalScore ? 'text-success' : 'text-error'}`}>
                {trendData[trendData.length - 1].totalScore >= trendData[0].totalScore ? '+' : ''}
                {trendData[trendData.length - 1].totalScore - trendData[0].totalScore}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryTrend({
  name,
  current,
  max,
  previous,
  color,
}: {
  name: string
  current: number
  max: number
  previous?: number
  color: string
}) {
  const change = previous !== undefined ? current - previous : null
  const percentage = Math.round((current / max) * 100)

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm">{name}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${color}`}>
            {current}/{max}
          </span>
          {change !== null && (
            <span className={`text-xs ${change >= 0 ? 'text-success' : 'text-error'}`}>
              {change > 0 && '+'}
              {change}
            </span>
          )}
        </div>
      </div>
      <div className="w-full bg-background rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${
            percentage >= 80 ? 'bg-success' : percentage >= 50 ? 'bg-warning' : 'bg-error'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

