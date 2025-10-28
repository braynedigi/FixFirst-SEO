'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recommendationsApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  Lightbulb, 
  Zap, 
  TrendingUp, 
  Code,
  FileText,
  Gauge,
  LayoutGrid,
  Smartphone,
  MapPin,
  Shield,
  CheckCircle2,
  AlertCircle,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface RecommendationsProps {
  auditId: string
}

export default function Recommendations({ auditId }: RecommendationsProps) {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Fetch recommendations
  const { data: recData, isLoading } = useQuery({
    queryKey: ['recommendations', auditId],
    queryFn: async () => {
      const response = await recommendationsApi.getForAudit(auditId)
      return response.data
    },
  })

  // Generate recommendations if they don't exist
  const generateMutation = useMutation({
    mutationFn: () => recommendationsApi.generate(auditId),
    onSuccess: (response) => {
      if (response.data.generated) {
        toast.success('Recommendations generated!')
      }
      queryClient.invalidateQueries({ queryKey: ['recommendations', auditId] })
    },
    onError: () => {
      toast.error('Failed to generate recommendations')
    },
  })

  // Mark recommendation as implemented
  const implementMutation = useMutation({
    mutationFn: (recommendationId: string) => 
      recommendationsApi.markImplemented(recommendationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', auditId] })
    },
    onError: () => {
      toast.error('Failed to update recommendation')
    },
  })

  const recommendations = recData?.recommendations || []

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
          <p className="text-text-secondary mb-4">
            Generate AI-powered recommendations to improve your SEO
          </p>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="btn-primary"
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate Recommendations'}
          </button>
        </div>
      </div>
    )
  }

  // Group by priority
  const critical = recommendations.filter((r: any) => r.priority === 'CRITICAL')
  const high = recommendations.filter((r: any) => r.priority === 'HIGH')
  const medium = recommendations.filter((r: any) => r.priority === 'MEDIUM')
  const low = recommendations.filter((r: any) => r.priority === 'LOW')

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card bg-error/10 border-error/30">
          <div className="text-sm text-text-secondary mb-1">Critical</div>
          <div className="text-2xl font-bold text-error">{critical.length}</div>
        </div>
        <div className="card bg-warning/10 border-warning/30">
          <div className="text-sm text-text-secondary mb-1">High Priority</div>
          <div className="text-2xl font-bold text-warning">{high.length}</div>
        </div>
        <div className="card bg-accent/10 border-accent/30">
          <div className="text-sm text-text-secondary mb-1">Medium</div>
          <div className="text-2xl font-bold text-accent">{medium.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-text-secondary mb-1">Low</div>
          <div className="text-2xl font-bold">{low.length}</div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {critical.length > 0 && (
          <RecommendationGroup
            title="🚨 Critical Priority"
            recommendations={critical}
            expandedId={expandedId}
            onToggle={setExpandedId}
            onImplement={(id) => implementMutation.mutate(id)}
          />
        )}
        
        {high.length > 0 && (
          <RecommendationGroup
            title="⚠️ High Priority"
            recommendations={high}
            expandedId={expandedId}
            onToggle={setExpandedId}
            onImplement={(id) => implementMutation.mutate(id)}
          />
        )}
        
        {medium.length > 0 && (
          <RecommendationGroup
            title="📊 Medium Priority"
            recommendations={medium}
            expandedId={expandedId}
            onToggle={setExpandedId}
            onImplement={(id) => implementMutation.mutate(id)}
          />
        )}
        
        {low.length > 0 && (
          <RecommendationGroup
            title="📝 Low Priority"
            recommendations={low}
            expandedId={expandedId}
            onToggle={setExpandedId}
            onImplement={(id) => implementMutation.mutate(id)}
          />
        )}
      </div>
    </div>
  )
}

function RecommendationGroup({
  title,
  recommendations,
  expandedId,
  onToggle,
  onImplement,
}: {
  title: string
  recommendations: any[]
  expandedId: string | null
  onToggle: (id: string | null) => void
  onImplement: (id: string) => void
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">{title}</h3>
      {recommendations.map((rec) => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          isExpanded={expandedId === rec.id}
          onToggle={() => onToggle(expandedId === rec.id ? null : rec.id)}
          onImplement={() => onImplement(rec.id)}
        />
      ))}
    </div>
  )
}

function RecommendationCard({
  recommendation,
  isExpanded,
  onToggle,
  onImplement,
}: {
  recommendation: any
  isExpanded: boolean
  onToggle: () => void
  onImplement: () => void
}) {
  const categoryIcons: Record<string, React.ReactNode> = {
    QUICK_WIN: <Zap className="w-5 h-5" />,
    TECHNICAL_IMPROVEMENT: <Code className="w-5 h-5" />,
    CONTENT_OPTIMIZATION: <FileText className="w-5 h-5" />,
    PERFORMANCE_BOOST: <Gauge className="w-5 h-5" />,
    STRUCTURED_DATA: <LayoutGrid className="w-5 h-5" />,
    MOBILE_OPTIMIZATION: <Smartphone className="w-5 h-5" />,
    LOCAL_SEO: <MapPin className="w-5 h-5" />,
    SECURITY: <Shield className="w-5 h-5" />,
  }

  const priorityColors: Record<string, string> = {
    CRITICAL: 'border-error bg-error/5',
    HIGH: 'border-warning bg-warning/5',
    MEDIUM: 'border-accent bg-accent/5',
    LOW: 'border-border bg-background-card',
  }

  return (
    <div className={`card ${priorityColors[recommendation.priority]} transition-all`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {categoryIcons[recommendation.category] || <Target className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h4 className="font-semibold mb-1">{recommendation.title}</h4>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <span className="capitalize">
                  {recommendation.category.toLowerCase().replace('_', ' ')}
                </span>
                <span>•</span>
                <span>Effort: {recommendation.effort}</span>
                <span>•</span>
                <span>Impact Score: {recommendation.estimatedValue}/100</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {recommendation.isImplemented && (
                <div className="flex items-center gap-1 text-success text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Done
                </div>
              )}
              <button
                onClick={onToggle}
                className="p-2 hover:bg-background-secondary rounded transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <p className="text-text-secondary mb-3">{recommendation.description}</p>

          {isExpanded && (
            <div className="space-y-4 pt-4 border-t border-border">
              {/* Detailed Analysis */}
              {recommendation.metadata?.detailedAnalysis && (
                <div>
                  <h5 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    Why This Matters
                  </h5>
                  <div className="bg-background-secondary p-4 rounded-lg">
                    <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                      {recommendation.metadata.detailedAnalysis}
                    </p>
                  </div>
                </div>
              )}

              {/* Step-by-Step Solution */}
              {recommendation.metadata?.stepByStepSolution && (
                <div>
                  <h5 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    How to Fix It
                  </h5>
                  <div className="bg-background-secondary p-4 rounded-lg">
                    <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                      {recommendation.metadata.stepByStepSolution}
                    </p>
                  </div>
                </div>
              )}

              {/* Expected Impact */}
              <div>
                <h5 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Expected Impact
                </h5>
                <div className="bg-background-secondary p-4 rounded-lg">
                  <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                    {recommendation.impact}
                  </p>
                </div>
              </div>

              {/* Code Examples */}
              {recommendation.metadata?.codeExamples && (
                <div>
                  <h5 className="font-semibold mb-2 flex items-center gap-2">
                    <Code className="w-5 h-5 text-warning" />
                    Code Examples
                  </h5>
                  <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm text-green-400 font-mono">
                      {recommendation.metadata.codeExamples}
                    </pre>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onImplement}
                  className={`${recommendation.isImplemented ? 'btn-secondary' : 'btn-primary'} text-sm flex items-center gap-2`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {recommendation.isImplemented ? 'Mark as Pending' : 'Mark as Implemented'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

