'use client'

import { useQuery } from '@tanstack/react-query'
import { comparisonApi } from '@/lib/api'
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, Info, Calendar } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface AuditComparisonProps {
  auditId1: string
  auditId2: string
}

export default function AuditComparison({ auditId1, auditId2 }: AuditComparisonProps) {
  const { data: comparison, isLoading, error } = useQuery({
    queryKey: ['comparison', auditId1, auditId2],
    queryFn: async () => {
      const response = await comparisonApi.compare(auditId1, auditId2)
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !comparison) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <p className="text-text-secondary">Failed to load comparison</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Audit 1 (Baseline)</h3>
            <div className="space-y-1">
              <p className="font-semibold text-lg">{comparison.audit1.url}</p>
              <p className="text-sm text-text-secondary flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDateTime(comparison.audit1.date)}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Audit 2 (Comparison)</h3>
            <div className="space-y-1">
              <p className="font-semibold text-lg">{comparison.audit2.url}</p>
              <p className="text-sm text-text-secondary flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDateTime(comparison.audit2.date)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Score Comparison */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Score Comparison</h2>
        
        <div className="space-y-4">
          <ScoreComparisonRow
            label="Overall Score"
            score1={comparison.audit1.scores.total}
            score2={comparison.audit2.scores.total}
            change={comparison.changes.totalScore}
          />
          <ScoreComparisonRow
            label="Technical SEO"
            score1={comparison.audit1.scores.technical}
            score2={comparison.audit2.scores.technical}
            change={comparison.changes.technicalScore}
          />
          <ScoreComparisonRow
            label="On-Page SEO"
            score1={comparison.audit1.scores.onPage}
            score2={comparison.audit2.scores.onPage}
            change={comparison.changes.onPageScore}
          />
          <ScoreComparisonRow
            label="Structured Data"
            score1={comparison.audit1.scores.structuredData}
            score2={comparison.audit2.scores.structuredData}
            change={comparison.changes.structuredDataScore}
          />
          <ScoreComparisonRow
            label="Performance"
            score1={comparison.audit1.scores.performance}
            score2={comparison.audit2.scores.performance}
            change={comparison.changes.performanceScore}
          />
          <ScoreComparisonRow
            label="Local SEO"
            score1={comparison.audit1.scores.localSeo}
            score2={comparison.audit2.scores.localSeo}
            change={comparison.changes.localSeoScore}
          />
        </div>
      </div>

      {/* Issue Comparison */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Issue Comparison</h2>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-error/10 border border-error/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Critical Issues</span>
              <ChangeIndicator change={comparison.changes.criticalIssues} />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold">{comparison.audit1.issueCount.critical}</span>
              <span className="text-xl text-text-secondary">→</span>
              <span className="text-2xl font-bold">{comparison.audit2.issueCount.critical}</span>
            </div>
          </div>

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Warnings</span>
              <ChangeIndicator change={comparison.changes.warningIssues} />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold">{comparison.audit1.issueCount.warning}</span>
              <span className="text-xl text-text-secondary">→</span>
              <span className="text-2xl font-bold">{comparison.audit2.issueCount.warning}</span>
            </div>
          </div>

          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Total Pages</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold">{comparison.audit1.pageCount}</span>
              <span className="text-xl text-text-secondary">→</span>
              <span className="text-2xl font-bold">{comparison.audit2.pageCount}</span>
            </div>
          </div>
        </div>

        {/* New Issues */}
        {comparison.newIssues && comparison.newIssues.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-error" />
              New Issues ({comparison.newIssues.length})
            </h3>
            <div className="space-y-2">
              {comparison.newIssues.slice(0, 5).map((issue: any, index: number) => (
                <div key={index} className="bg-background-secondary p-3 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadgeClass(issue.severity)}`}>
                      {issue.severity}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{issue.rule?.title || 'Unknown Rule'}</p>
                      <p className="text-sm text-text-secondary">{issue.description}</p>
                      {issue.pageUrl && (
                        <p className="text-xs text-text-secondary mt-1">
                          Page: {issue.pageUrl}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {comparison.newIssues.length > 5 && (
                <p className="text-sm text-text-secondary">
                  ... and {comparison.newIssues.length - 5} more new issues
                </p>
              )}
            </div>
          </div>
        )}

        {/* Resolved Issues */}
        {comparison.resolvedIssues && comparison.resolvedIssues.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Resolved Issues ({comparison.resolvedIssues.length})
            </h3>
            <div className="space-y-2">
              {comparison.resolvedIssues.slice(0, 5).map((issue: any, index: number) => (
                <div key={index} className="bg-success/10 border border-success/30 p-3 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadgeClass(issue.severity)}`}>
                      {issue.severity}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{issue.rule?.title || 'Unknown Rule'}</p>
                      <p className="text-sm text-text-secondary">{issue.description}</p>
                      {issue.pageUrl && (
                        <p className="text-xs text-text-secondary mt-1">
                          Page: {issue.pageUrl}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {comparison.resolvedIssues.length > 5 && (
                <p className="text-sm text-text-secondary">
                  ... and {comparison.resolvedIssues.length - 5} more resolved issues
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreComparisonRow({ label, score1, score2, change }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(score1)}`}>
            {score1}
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-[80px] justify-center">
          {change > 0 && <TrendingUp className="w-5 h-5 text-success" />}
          {change < 0 && <TrendingDown className="w-5 h-5 text-error" />}
          {change === 0 && <Minus className="w-5 h-5 text-text-secondary" />}
          <span className={`font-semibold ${
            change > 0 ? 'text-success' : change < 0 ? 'text-error' : 'text-text-secondary'
          }`}>
            {change > 0 ? '+' : ''}{change}
          </span>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(score2)}`}>
            {score2}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChangeIndicator({ change }: { change: number }) {
  if (change === 0) return null
  
  return (
    <span className={`text-xs font-medium flex items-center gap-1 ${
      change > 0 ? 'text-error' : 'text-success'
    }`}>
      {change > 0 ? '+' : ''}{change}
      {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
    </span>
  )
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-success'
  if (score >= 75) return 'text-warning'
  return 'text-error'
}

function getSeverityBadgeClass(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
    case 'ERROR':
      return 'bg-error/20 text-error border border-error/30'
    case 'WARNING':
      return 'bg-warning/20 text-warning border border-warning/30'
    case 'INFO':
      return 'bg-accent/20 text-accent border border-accent/30'
    default:
      return 'bg-background-secondary text-text-secondary'
  }
}

