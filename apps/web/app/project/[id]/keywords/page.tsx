'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keywordsApi, keywordGroupsApi, gscApi, projectsApi } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Search, Plus, TrendingUp, TrendingDown, Minus, ArrowLeft, 
  Loader2, Download, Upload, Play, Pause, Trash2, BarChart3,
  Filter, Link as LinkIcon, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Keyword {
  id: string;
  keyword: string;
  currentPosition: number | null;
  previousPosition: number | null;
  bestPosition: number | null;
  device: string;
  location: string;
  searchVolume: number | null;
  isTracking: boolean;
  group: { id: string; name: string; color: string } | null;
  rankings: Array<{
    position: number | null;
    capturedAt: string;
    impressions: number | null;
    clicks: number | null;
    ctr: number | null;
  }>;
}

export default function KeywordsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showGSCModal, setShowGSCModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectsApi.getOne(projectId);
      return response.data;
    },
  });

  // Fetch keywords
  const { data: keywords = [], isLoading } = useQuery({
    queryKey: ['keywords', projectId],
    queryFn: async () => {
      const response = await keywordsApi.getByProject(projectId);
      return response.data;
    },
  });

  // Fetch groups
  const { data: groups = [] } = useQuery({
    queryKey: ['keyword-groups', projectId],
    queryFn: async () => {
      const response = await keywordGroupsApi.getByProject(projectId);
      return response.data;
    },
  });

  // Check GSC status
  const { data: gscStatus } = useQuery({
    queryKey: ['gsc-status'],
    queryFn: async () => {
      const response = await gscApi.getStatus();
      return response.data;
    },
  });

  // Sync GSC mutation
  const syncMutation = useMutation({
    mutationFn: () => keywordsApi.syncGSC(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords', projectId] });
      toast.success('Rankings synced successfully from Google Search Console');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to sync rankings');
    },
  });

  // Delete keyword mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => keywordsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords', projectId] });
      toast.success('Keyword deleted');
    },
    onError: () => toast.error('Failed to delete keyword'),
  });

  // Toggle tracking mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => keywordsApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords', projectId] });
      toast.success('Tracking status updated');
    },
  });

  // Filter keywords
  const filteredKeywords = keywords.filter((kw: Keyword) => {
    const matchesSearch = kw.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || kw.group?.id === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  // Calculate stats
  const stats = {
    total: keywords.length,
    top3: keywords.filter((k: Keyword) => k.currentPosition && k.currentPosition <= 3).length,
    top10: keywords.filter((k: Keyword) => k.currentPosition && k.currentPosition <= 10).length,
    improved: keywords.filter((k: Keyword) => {
      if (!k.currentPosition || !k.previousPosition) return false;
      return k.currentPosition < k.previousPosition;
    }).length,
  };

  const getRankChange = (kw: Keyword) => {
    if (!kw.currentPosition || !kw.previousPosition) return null;
    return kw.previousPosition - kw.currentPosition;
  };

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
                <h1 className="text-2xl font-bold text-text-primary">Keyword Rankings</h1>
                <p className="text-sm text-text-secondary mt-1">
                  {project?.name} • Track and monitor your keyword positions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {gscStatus?.connected && (
                <button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50"
                >
                  {syncMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Syncing...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Sync GSC</>
                  )}
                </button>
              )}
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-background-secondary text-text-primary rounded-lg hover:bg-background-secondary/80"
              >
                <Upload className="w-4 h-4" />
                Bulk Add
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add Keyword
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Keywords', value: stats.total, icon: Search, color: 'text-primary' },
            { label: 'Top 3 Positions', value: stats.top3, icon: TrendingUp, color: 'text-success' },
            { label: 'Top 10 Positions', value: stats.top10, icon: BarChart3, color: 'text-warning' },
            { label: 'Improved', value: stats.improved, icon: TrendingUp, color: 'text-success' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-background-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">{stat.label}</span>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* GSC Connection Warning */}
        {!gscStatus?.connected && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Google Search Console Not Connected</p>
              <p className="text-xs text-text-secondary mt-1">
                Connect GSC to automatically sync keyword rankings and get real data from Google.
              </p>
              <button
                onClick={() => setShowGSCModal(true)}
                className="mt-2 text-xs font-medium text-warning hover:underline"
              >
                Connect Now →
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search keywords..."
              className="w-full pl-10 pr-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
          >
            <option value="all">All Groups</option>
            {groups.map((group: any) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>

        {/* Keywords Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredKeywords.length === 0 ? (
          <div className="bg-background-card border border-border rounded-lg p-12 text-center">
            <Search className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">No Keywords Yet</h3>
            <p className="text-text-secondary mb-6">
              Add keywords to start tracking your search engine rankings
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Add Your First Keyword
            </button>
          </div>
        ) : (
          <div className="bg-background-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-background-secondary border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-tertiary uppercase">Keyword</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-text-tertiary uppercase">Position</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-text-tertiary uppercase">Change</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-text-tertiary uppercase">Best</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-text-tertiary uppercase">Volume</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-text-tertiary uppercase">Device</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-text-tertiary uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredKeywords.map((kw: Keyword) => {
                  const change = getRankChange(kw);
                  return (
                    <tr key={kw.id} className="hover:bg-background-secondary/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-text-primary">{kw.keyword}</p>
                          {kw.group && (
                            <span
                              className="inline-block mt-1 px-2 py-0.5 text-xs rounded"
                              style={{ backgroundColor: kw.group.color + '20', color: kw.group.color }}
                            >
                              {kw.group.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {kw.currentPosition ? (
                          <span className="text-lg font-bold text-text-primary">
                            #{kw.currentPosition}
                          </span>
                        ) : (
                          <span className="text-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {change !== null && change !== 0 && (
                          <div className={`flex items-center justify-center gap-1 ${change > 0 ? 'text-success' : 'text-error'}`}>
                            {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span className="font-medium">{Math.abs(change)}</span>
                          </div>
                        )}
                        {change === 0 && <Minus className="w-4 h-4 text-text-tertiary mx-auto" />}
                        {change === null && <span className="text-text-tertiary">-</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {kw.bestPosition ? (
                          <span className="text-sm text-text-secondary">#{kw.bestPosition}</span>
                        ) : (
                          <span className="text-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {kw.searchVolume ? (
                          <span className="text-sm text-text-secondary">{kw.searchVolume.toLocaleString()}</span>
                        ) : (
                          <span className="text-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs text-text-secondary">{kw.device}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/project/${projectId}/keywords/${kw.id}`)}
                            className="p-2 hover:bg-background-secondary rounded transition-colors"
                            title="View Details"
                          >
                            <BarChart3 className="w-4 h-4 text-text-secondary" />
                          </button>
                          <button
                            onClick={() => toggleMutation.mutate(kw.id)}
                            className="p-2 hover:bg-background-secondary rounded transition-colors"
                            title={kw.isTracking ? 'Pause' : 'Resume'}
                          >
                            {kw.isTracking ? (
                              <Pause className="w-4 h-4 text-text-secondary" />
                            ) : (
                              <Play className="w-4 h-4 text-text-secondary" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${kw.keyword}"?`)) {
                                deleteMutation.mutate(kw.id);
                              }
                            }}
                            className="p-2 hover:bg-error/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-error" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals (Add, Bulk Add, GSC Connect) - Simplified for brevity */}
      {showAddModal && (
        <AddKeywordModal
          projectId={projectId}
          groups={groups}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['keywords', projectId] });
          }}
        />
      )}

      {showBulkModal && (
        <BulkAddModal
          projectId={projectId}
          groups={groups}
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            setShowBulkModal(false);
            queryClient.invalidateQueries({ queryKey: ['keywords', projectId] });
          }}
        />
      )}

      {showGSCModal && (
        <GSCConnectModal onClose={() => setShowGSCModal(false)} />
      )}
    </div>
  );
}

// Modal Components (Simplified)
function AddKeywordModal({ projectId, groups, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    keyword: '',
    groupId: '',
    targetUrl: '',
    device: 'DESKTOP' as 'DESKTOP' | 'MOBILE' | 'TABLET',
  });

  const mutation = useMutation({
    mutationFn: () => keywordsApi.create({ ...formData, projectId }),
    onSuccess,
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to add keyword'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-card border border-border rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Add Keyword</h2>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Keyword *</label>
            <input
              type="text"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
              placeholder="e.g., seo audit tool"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Group</label>
            <select
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="">No Group</option>
              {groups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Device</label>
            <select
              value={formData.device}
              onChange={(e) => setFormData({ ...formData, device: e.target.value as any })}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="DESKTOP">Desktop</option>
              <option value="MOBILE">Mobile</option>
              <option value="TABLET">Tablet</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-background-secondary text-text-primary rounded-lg hover:bg-background-secondary/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? 'Adding...' : 'Add Keyword'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkAddModal({ projectId, groups, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    keywords: '',
    groupId: '',
    device: 'DESKTOP' as 'DESKTOP' | 'MOBILE' | 'TABLET',
  });

  const mutation = useMutation({
    mutationFn: () => keywordsApi.bulkCreate({
      projectId,
      groupId: formData.groupId || undefined,
      keywords: formData.keywords.split('\n').map(k => k.trim()).filter(Boolean),
      device: formData.device,
    }),
    onSuccess: (data: any) => {
      toast.success(`Added ${data.data.created} keywords`);
      onSuccess();
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to bulk add keywords'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-card border border-border rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Bulk Add Keywords</h2>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Keywords (one per line) *</label>
            <textarea
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary font-mono text-sm"
              rows={6}
              placeholder="seo audit&#10;keyword ranking&#10;competitor analysis"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Group</label>
            <select
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="">No Group</option>
              {groups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-background-secondary text-text-primary rounded-lg hover:bg-background-secondary/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? 'Adding...' : 'Add Keywords'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GSCConnectModal({ onClose }: any) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['gsc-auth-url'],
    queryFn: async () => {
      const response = await gscApi.getAuthUrl();
      return response.data;
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-card border border-border rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Connect Google Search Console</h2>
        
        {error ? (
          <div className="mb-6">
            <div className="p-4 bg-error/10 border border-error rounded-lg mb-4">
              <p className="text-sm font-medium text-error mb-2">⚠️ GSC API Not Configured</p>
              <p className="text-xs text-text-secondary">
                Google Search Console credentials are not set up. Follow the setup guide to enable GSC integration.
              </p>
            </div>
            <div className="p-4 bg-background-secondary rounded-lg">
              <p className="text-sm font-medium text-text-primary mb-2">📖 Quick Setup:</p>
              <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside">
                <li>Go to Google Cloud Console</li>
                <li>Enable Google Search Console API</li>
                <li>Create OAuth 2.0 credentials</li>
                <li>Add redirect URI: <code className="text-xs bg-background-primary px-1 py-0.5 rounded">http://localhost:3001/api/gsc/callback</code></li>
                <li>Set environment variables (GSC_CLIENT_ID, GSC_CLIENT_SECRET)</li>
                <li>Restart API server</li>
              </ol>
              <p className="text-xs text-text-tertiary mt-3">
                See <code className="bg-background-primary px-1 py-0.5 rounded">docs/GSC_SETUP_GUIDE.md</code> for detailed instructions
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-text-secondary mb-4">
              Connect your Google Search Console account to automatically sync keyword rankings and get real data from Google.
            </p>
            <div className="p-3 bg-primary/10 border border-primary rounded-lg">
              <p className="text-xs text-text-secondary">
                ✨ <strong className="text-text-primary">Free forever</strong> • Real Google data • 16 months history
              </p>
            </div>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-background-secondary text-text-primary rounded-lg hover:bg-background-secondary/80"
          >
            {error ? 'Close' : 'Cancel'}
          </button>
          {!error && data?.authUrl && (
            <a
              href={data.authUrl}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-center"
            >
              {isLoading ? 'Loading...' : 'Connect GSC'}
            </a>
          )}
          {error && (
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-center"
            >
              Setup Now →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

