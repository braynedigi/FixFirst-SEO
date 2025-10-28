'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { comparisonApi, projectsApi } from '@/lib/api';
import ScoreHistoryChart from '@/components/ScoreHistoryChart';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProjectHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // Fetch project details
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectsApi.getOne(projectId);
      return response.data;
    },
  });

  // Fetch audit history
  const { data: history, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['audit-history', projectId],
    queryFn: async () => {
      const response = await comparisonApi.getHistory(projectId);
      return response.data;
    },
    enabled: !!projectId,
  });

  const isLoading = projectLoading || historyLoading;
  const error = projectError || historyError;

  if (error) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="bg-background-card border border-border rounded-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Error Loading History</h2>
          <p className="text-text-secondary mb-4">
            {(error as any)?.response?.data?.error || 'Failed to load project history'}
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-text-secondary">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <div className="bg-background-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Score History</h1>
                <p className="text-sm text-text-secondary mt-1">
                  {project?.name} • {project?.domain}
                </p>
              </div>
            </div>

            <Link
              href={`/project/${projectId}`}
              className="px-4 py-2 bg-background-secondary text-text-primary rounded-lg hover:bg-background-secondary/80 transition-colors"
            >
              View Project
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {history && history.length > 0 ? (
          <div className="space-y-8">
            {/* Main Chart */}
            <ScoreHistoryChart data={history} projectName={project?.name || ''} />

            {/* Additional Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score Breakdown */}
              <div className="bg-background-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-text-primary mb-4">Latest Score Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Overall Score', value: history[0].totalScore, color: 'text-primary' },
                    { label: 'Performance', value: history[0].performanceScore, color: 'text-blue-500' },
                    { label: 'Technical SEO', value: history[0].technicalScore, color: 'text-green-500' },
                    { label: 'On-Page SEO', value: history[0].onPageScore, color: 'text-yellow-500' },
                    { label: 'Structured Data', value: history[0].structuredDataScore, color: 'text-pink-500' },
                    { label: 'Local SEO', value: history[0].localSeoScore, color: 'text-indigo-500' },
                  ].map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{metric.label}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-background-secondary rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${metric.color.replace('text-', 'bg-')}`}
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                        <span className={`font-bold text-sm ${metric.color} min-w-[3rem] text-right`}>
                          {metric.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issue Trends */}
              <div className="bg-background-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-text-primary mb-4">Current Issues</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-error/10 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-error">Critical Issues</p>
                      <p className="text-xs text-error/80 mt-1">Requires immediate attention</p>
                    </div>
                    <div className="text-3xl font-bold text-error">{history[0].criticalIssues}</div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-warning/10 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-warning">Warning Issues</p>
                      <p className="text-xs text-warning/80 mt-1">Should be addressed</p>
                    </div>
                    <div className="text-3xl font-bold text-warning">{history[0].warningIssues}</div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-info/10 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-info">Info Issues</p>
                      <p className="text-xs text-info/80 mt-1">Nice to have improvements</p>
                    </div>
                    <div className="text-3xl font-bold text-info">{history[0].infoIssues}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Comparison Table */}
            <div className="bg-background-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">Audit History Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Date</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">Overall</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">Performance</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">Technical</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">On-Page</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">Issues</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 10).map((audit, index) => {
                      const prevAudit = history[index + 1];
                      const scoreDiff = prevAudit ? audit.totalScore - prevAudit.totalScore : 0;

                      return (
                        <tr key={audit.id} className="border-b border-border hover:bg-background-secondary transition-colors">
                          <td className="py-3 px-4 text-sm text-text-primary">
                            {new Date(audit.completedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-bold text-text-primary">{audit.totalScore}</span>
                              {scoreDiff !== 0 && (
                                <span className={`text-xs ${scoreDiff > 0 ? 'text-success' : 'text-error'}`}>
                                  ({scoreDiff > 0 ? '+' : ''}{scoreDiff})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-text-secondary">{audit.performanceScore}</td>
                          <td className="py-3 px-4 text-center text-text-secondary">{audit.technicalScore}</td>
                          <td className="py-3 px-4 text-center text-text-secondary">{audit.onPageScore}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-error font-medium">{audit.criticalIssues}</span>
                            {' / '}
                            <span className="text-warning font-medium">{audit.warningIssues}</span>
                            {' / '}
                            <span className="text-info font-medium">{audit.infoIssues}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link
                              href={`/audit/${audit.id}`}
                              className="text-sm text-primary hover:underline"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-background-card border border-border rounded-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">No History Available</h3>
            <p className="text-text-secondary mb-6">
              This project doesn't have any completed audits yet. Run your first audit to start tracking history.
            </p>
            <Link
              href={`/project/${projectId}`}
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Run First Audit
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

