'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { competitorsApi, projectsApi, auditsApi } from '@/lib/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { 
  Users2, Plus, Trash2, ArrowLeft, Loader2, 
  TrendingUp, TrendingDown, Minus, Award, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Competitor {
  id: string;
  projectId: string;
  name: string;
  domain: string;
  createdAt: string;
  snapshots?: CompetitorSnapshot[];
}

interface CompetitorSnapshot {
  id: string;
  competitorId: string;
  totalScore: number;
  technicalScore: number;
  onPageScore: number;
  structuredDataScore: number;
  performanceScore: number;
  localSeoScore: number;
  capturedAt: string;
}

export default function CompetitorAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedView, setSelectedView] = useState<'comparison' | 'trends'>('comparison');

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectsApi.getOne(projectId);
      return response.data;
    },
  });

  // Fetch latest project audit
  const { data: projectAudit } = useQuery({
    queryKey: ['latest-audit', projectId],
    queryFn: async () => {
      const response = await auditsApi.getAll();
      const audits = response.data.filter((a: any) => a.projectId === projectId && a.status === 'COMPLETED');
      return audits.sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
    },
  });

  // Fetch competitors
  const { data: competitors, isLoading } = useQuery({
    queryKey: ['competitors', projectId],
    queryFn: async () => {
      const response = await competitorsApi.getAll(projectId);
      return response.data;
    },
  });

  // Delete competitor mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => competitorsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors', projectId] });
      toast.success('Competitor removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove competitor');
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from competitors?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Prepare comparison data
  const comparisonData = [
    {
      category: 'Overall',
      'Your Site': projectAudit?.totalScore || 0,
      ...competitors?.reduce((acc: any, comp: Competitor) => {
        const latestSnapshot = comp.snapshots?.[0];
        if (latestSnapshot) {
          acc[comp.name] = latestSnapshot.totalScore;
        }
        return acc;
      }, {}),
    },
    {
      category: 'Performance',
      'Your Site': projectAudit?.performanceScore || 0,
      ...competitors?.reduce((acc: any, comp: Competitor) => {
        const latestSnapshot = comp.snapshots?.[0];
        if (latestSnapshot) {
          acc[comp.name] = latestSnapshot.performanceScore;
        }
        return acc;
      }, {}),
    },
    {
      category: 'Technical',
      'Your Site': projectAudit?.technicalScore || 0,
      ...competitors?.reduce((acc: any, comp: Competitor) => {
        const latestSnapshot = comp.snapshots?.[0];
        if (latestSnapshot) {
          acc[comp.name] = latestSnapshot.technicalScore;
        }
        return acc;
      }, {}),
    },
    {
      category: 'On-Page',
      'Your Site': projectAudit?.onPageScore || 0,
      ...competitors?.reduce((acc: any, comp: Competitor) => {
        const latestSnapshot = comp.snapshots?.[0];
        if (latestSnapshot) {
          acc[comp.name] = latestSnapshot.onPageScore;
        }
        return acc;
      }, {}),
    },
    {
      category: 'Structured Data',
      'Your Site': projectAudit?.structuredDataScore || 0,
      ...competitors?.reduce((acc: any, comp: Competitor) => {
        const latestSnapshot = comp.snapshots?.[0];
        if (latestSnapshot) {
          acc[comp.name] = latestSnapshot.structuredDataScore;
        }
        return acc;
      }, {}),
    },
    {
      category: 'Local SEO',
      'Your Site': projectAudit?.localSeoScore || 0,
      ...competitors?.reduce((acc: any, comp: Competitor) => {
        const latestSnapshot = comp.snapshots?.[0];
        if (latestSnapshot) {
          acc[comp.name] = latestSnapshot.localSeoScore;
        }
        return acc;
      }, {}),
    },
  ];

  // Prepare radar chart data
  const radarData = [
    {
      subject: 'Performance',
      'Your Site': projectAudit?.performanceScore || 0,
      ...competitors?.slice(0, 2).reduce((acc: any, comp: Competitor, idx: number) => {
        const latestSnapshot = comp.snapshots?.[0];
        if (latestSnapshot) {
          acc[`Competitor ${idx + 1}`] = latestSnapshot.performanceScore;
        }
        return acc;
      }, {}),
      fullMark: 100,
    },
    {
      subject: 'Technical',
      'Your Site': projectAudit?.technicalScore || 0,
      ...competitors?.slice(0, 2).reduce((acc: any, comp: Competitor, idx: number) => {
        const latestSnapshot = comp.snapshots?.[0];
        if (latestSnapshot) {
          acc[`Competitor ${idx + 1}`] = latestSnapshot.technicalScore;
        }
        return acc;
      }, {}),
      fullMark: 100,
    },
    {
      subject: 'On-Page',
      'Your Site': projectAudit?.onPageScore || 0,
      ...competitors?.slice(0, 2).reduce((acc: any, comp: Competitor, idx: number) => {
        const latestSnapshot = comp.snapshots?.[0];
        if (latestSnapshot) {
          acc[`Competitor ${idx + 1}`] = latestSnapshot.onPageScore;
        }
        return acc;
      }, {}),
      fullMark: 100,
    },
    {
      subject: 'Structured Data',
      'Your Site': projectAudit?.structuredDataScore || 0,
      ...competitors?.slice(0, 2).reduce((acc: any, comp: Competitor, idx: number) => {
        const latestSnapshot = comp.snapshots?.[0];
        if (latestSnapshot) {
          acc[`Competitor ${idx + 1}`] = latestSnapshot.structuredDataScore;
        }
        return acc;
      }, {}),
      fullMark: 100,
    },
    {
      subject: 'Local SEO',
      'Your Site': projectAudit?.localSeoScore || 0,
      ...competitors?.slice(0, 2).reduce((acc: any, comp: Competitor, idx: number) => {
        const latestSnapshot = comp.snapshots?.[0];
        if (latestSnapshot) {
          acc[`Competitor ${idx + 1}`] = latestSnapshot.localSeoScore;
        }
        return acc;
      }, {}),
      fullMark: 100,
    },
  ];

  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

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
                <h1 className="text-2xl font-bold text-text-primary">Competitor Analysis</h1>
                <p className="text-sm text-text-secondary mt-1">
                  {project?.name} • Track and compare against competitors
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Competitor
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !competitors || competitors.length === 0 ? (
          <div className="bg-background-card border border-border rounded-lg p-12 text-center">
            <Users2 className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">No Competitors Added</h3>
            <p className="text-text-secondary mb-6">
              Add competitors to track and compare their SEO performance against yours
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add Your First Competitor
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedView('comparison')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedView === 'comparison'
                    ? 'bg-primary text-white'
                    : 'bg-background-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                Score Comparison
              </button>
              <button
                onClick={() => setSelectedView('trends')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedView === 'trends'
                    ? 'bg-primary text-white'
                    : 'bg-background-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                Trend Analysis
              </button>
            </div>

            {selectedView === 'comparison' ? (
              <>
                {/* Score Comparison Chart */}
                <div className="bg-background-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-bold text-text-primary mb-4">Category Comparison</h3>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="category" stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Your Site" fill="#8b5cf6" />
                        {competitors?.map((comp: Competitor, idx: number) => (
                          <Bar key={comp.id} dataKey={comp.name} fill={colors[(idx + 1) % colors.length]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="bg-background-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-bold text-text-primary mb-4">Overall Performance Radar</h3>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" style={{ fontSize: '10px' }} />
                        <Radar name="Your Site" dataKey="Your Site" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                        {competitors?.slice(0, 2).map((comp: Competitor, idx: number) => (
                          <Radar
                            key={comp.id}
                            name={`Competitor ${idx + 1}`}
                            dataKey={`Competitor ${idx + 1}`}
                            stroke={colors[(idx + 1) % colors.length]}
                            fill={colors[(idx + 1) % colors.length]}
                            fillOpacity={0.3}
                          />
                        ))}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-background-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-text-primary mb-4">Trend Analysis</h3>
                <p className="text-text-secondary">
                  Historical trend data will be available once competitors have multiple snapshots over time.
                </p>
              </div>
            )}

            {/* Competitor Cards */}
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-4">Tracked Competitors ({competitors.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {competitors.map((competitor: Competitor) => (
                  <CompetitorCard
                    key={competitor.id}
                    competitor={competitor}
                    projectScore={projectAudit?.totalScore || 0}
                    onDelete={() => handleDelete(competitor.id, competitor.name)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Competitor Modal */}
      {showAddModal && (
        <AddCompetitorModal
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['competitors', projectId] });
          }}
        />
      )}
    </div>
  );
}

// Competitor Card Component
function CompetitorCard({
  competitor,
  projectScore,
  onDelete,
}: {
  competitor: Competitor;
  projectScore: number;
  onDelete: () => void;
}) {
  const latestSnapshot = competitor.snapshots?.[0];
  const scoreDiff = latestSnapshot ? latestSnapshot.totalScore - projectScore : 0;

  return (
    <div className="bg-background-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-text-primary mb-1">{competitor.name}</h4>
          <p className="text-sm text-text-secondary font-mono">{competitor.domain}</p>
        </div>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-error/10 rounded-lg transition-colors"
          title="Remove"
        >
          <Trash2 className="w-4 h-4 text-error" />
        </button>
      </div>

      {latestSnapshot ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Overall Score</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-text-primary">{latestSnapshot.totalScore}</span>
              {scoreDiff > 0 && (
                <div className="flex items-center gap-1 text-error">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">+{scoreDiff}</span>
                </div>
              )}
              {scoreDiff < 0 && (
                <div className="flex items-center gap-1 text-success">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm">{scoreDiff}</span>
                </div>
              )}
              {scoreDiff === 0 && (
                <div className="flex items-center gap-1 text-text-tertiary">
                  <Minus className="w-4 h-4" />
                  <span className="text-sm">Tied</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            {[
              { label: 'Performance', value: latestSnapshot.performanceScore },
              { label: 'Technical', value: latestSnapshot.technicalScore },
              { label: 'On-Page', value: latestSnapshot.onPageScore },
              { label: 'Local SEO', value: latestSnapshot.localSeoScore },
            ].map((metric) => (
              <div key={metric.label}>
                <p className="text-xs text-text-tertiary">{metric.label}</p>
                <p className="text-lg font-bold text-text-primary">{metric.value}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-text-tertiary pt-3 border-t border-border">
            Last updated: {new Date(latestSnapshot.capturedAt).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-warning">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">No snapshot data available</p>
        </div>
      )}
    </div>
  );
}

// Add Competitor Modal Component
function AddCompetitorModal({
  projectId,
  onClose,
  onSuccess,
}: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
  });

  const mutation = useMutation({
    mutationFn: (data: { name: string; domain: string }) =>
      competitorsApi.create(projectId, data),
    onSuccess: () => {
      toast.success('Competitor added successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add competitor');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-card border border-border rounded-lg max-w-lg w-full p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Add Competitor</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Competitor Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
              placeholder="e.g., Main Competitor"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Website Domain *
            </label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary font-mono text-sm"
              placeholder="example.com"
              required
            />
            <p className="text-xs text-text-tertiary mt-1">
              Enter the domain without http:// or https://
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-background-secondary text-text-primary rounded-lg hover:bg-background-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Adding...' : 'Add Competitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

