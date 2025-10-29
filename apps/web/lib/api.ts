import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth API
export const authApi = {
  register: (email: string, password: string) =>
    api.post('/api/auth/register', { email, password }),
  login: (email: string, password: string, twoFactorToken?: string) =>
    api.post('/api/auth/login', { email, password, twoFactorToken }),
  me: () => api.get('/api/auth/me'),
};

// Two-Factor Authentication API
export const twoFactorApi = {
  getStatus: () => api.get('/api/2fa/status'),
  setup: (email: string) => api.post('/api/2fa/setup', { email }),
  enable: (secret: string, token: string) => api.post('/api/2fa/enable', { secret, token }),
  disable: (token: string) => api.post('/api/2fa/disable', { token }),
  verify: (token: string) => api.post('/api/2fa/verify', { token }),
  regenerateBackupCodes: (token: string) => api.post('/api/2fa/backup-codes/regenerate', { token }),
};

// Projects API
export const projectsApi = {
  getAll: () => api.get('/api/projects'),
  getOne: (id: string) => api.get(`/api/projects/${id}`),
  create: (data: { name: string; domain: string }) =>
    api.post('/api/projects', data),
  update: (id: string, data: { name?: string; domain?: string; tags?: any[] }) =>
    api.put(`/api/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/projects/${id}`),
  toggleFavorite: (id: string) => api.patch(`/api/projects/${id}/favorite`),
  updateLastViewed: (id: string) => api.patch(`/api/projects/${id}/view`),
  updateTags: (id: string, tags: any[]) => api.patch(`/api/projects/${id}/tags`, { tags }),
};

// Audits API
export const auditsApi = {
  getAll: () => api.get('/api/audits'),
  getOne: (id: string) => api.get(`/api/audits/${id}`),
  create: (data: { url: string; projectId?: string; keywords?: string[] }) =>
    api.post('/api/audits', data),
  delete: (id: string) => api.delete(`/api/audits/${id}`),
  deleteFailed: () => api.delete('/api/audits/failed'),
  exportCSV: (id: string) => {
    const token = localStorage.getItem('token');
    const url = `${API_URL}/api/audits/${id}/export/csv`;
    window.location.href = `${url}?token=${token}`;
  },
  bulkStart: (urls: string[], projectId?: string) => 
    api.post('/api/audits/bulk', { urls, projectId }),
};

// Admin API
export const adminApi = {
  getRules: () => api.get('/api/admin/rules'),
  updateRule: (id: string, data: any) =>
    api.patch(`/api/admin/rules/${id}`, data),
  getUsers: () => api.get('/api/admin/users'),
  updateUserPlan: (id: string, planTier: string) =>
    api.patch(`/api/admin/users/${id}/plan`, { planTier }),
  getStats: () => api.get('/api/admin/stats'),
};

// User API
export const userApi = {
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/api/user/password', { currentPassword, newPassword }),
  getUsage: () => api.get('/api/user/usage'),
  generateApiKey: () => api.post('/api/user/api-key'),
  revokeApiKey: () => api.delete('/api/user/api-key'),
  getApiKeyStatus: () => api.get('/api/user/api-key/status'),
  deleteAccount: (password: string) =>
    api.delete('/api/user/account', { data: { password } }),
  updateNotifications: (preferences: any) =>
    api.patch('/api/user/notifications', preferences),
  getNotifications: () => api.get('/api/user/notifications'),
  updateSlackWebhook: (webhookUrl: string) =>
    api.patch('/api/user/slack', { webhookUrl }),
  getSlackStatus: () => api.get('/api/user/slack'),
  testSlackWebhook: () => api.post('/api/user/slack/test'),
};

// Comparison API
export const comparisonApi = {
  getHistory: (projectId: string) => api.get(`/api/comparison/history/${projectId}`),
  compareAudits: (auditId1: string, auditId2: string) =>
    api.get(`/api/comparison/compare/${auditId1}/${auditId2}`),
  getTrends: (projectId: string, limit?: number) =>
    api.get(`/api/comparison/trends/${projectId}`, { params: { limit } }),
};

// Schedules API
export const schedulesApi = {
  getAll: () => api.get('/api/schedules'),
  getOne: (id: string) => api.get(`/api/schedules/${id}`),
  create: (data: {
    projectId: string;
    url: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    nextRunAt?: string;
    isActive?: boolean;
  }) => api.post('/api/schedules', data),
  update: (id: string, data: {
    url?: string;
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    nextRunAt?: string;
    isActive?: boolean;
  }) => api.patch(`/api/schedules/${id}`, data),
  delete: (id: string) => api.delete(`/api/schedules/${id}`),
  toggle: (id: string) => api.post(`/api/schedules/${id}/toggle`),
};

// Bulk Audits API
export const bulkAuditsApi = {
  uploadCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    return axios.post(`${API_URL}/api/bulk-audits/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  downloadTemplate: () => {
    const token = localStorage.getItem('token');
    const url = `${API_URL}/api/bulk-audits/template`;
    window.location.href = url;
  },
};

// Teams API
export const teamsApi = {
  getMembers: (projectId: string) => api.get(`/api/teams/${projectId}/members`),
  inviteMember: (projectId: string, data: { email: string; role: string }) =>
    api.post(`/api/teams/${projectId}/invite`, data),
  getInvitations: (projectId: string) => api.get(`/api/teams/${projectId}/invitations`),
  getMyInvitations: () => api.get(`/api/teams/my-invitations`),
  cancelInvitation: (projectId: string, invitationId: string) =>
    api.delete(`/api/teams/${projectId}/invitations/${invitationId}`),
  acceptInvitation: (token: string) => api.post(`/api/teams/accept/${token}`),
  updateMemberRole: (projectId: string, memberId: string, role: string) =>
    api.patch(`/api/teams/${projectId}/members/${memberId}`, { role }),
  removeMember: (projectId: string, memberId: string) =>
    api.delete(`/api/teams/${projectId}/members/${memberId}`),
  leaveProject: (projectId: string) => api.post(`/api/teams/${projectId}/leave`),
};

// Comments API
export const commentsApi = {
  getForIssue: (issueId: string) => api.get(`/api/comments/issue/${issueId}`),
  create: (issueId: string, content: string) =>
    api.post(`/api/comments/issue/${issueId}`, { content }),
  update: (commentId: string, content: string) =>
    api.patch(`/api/comments/${commentId}`, { content }),
  delete: (commentId: string) => api.delete(`/api/comments/${commentId}`),
};

// Activities API
export const activitiesApi = {
  getForProject: (projectId: string, limit?: number, offset?: number) =>
    api.get(`/api/activities/project/${projectId}`, { params: { limit, offset } }),
  getRecent: (limit?: number) => api.get('/api/activities/recent', { params: { limit } }),
  getStats: (projectId: string, days?: number) =>
    api.get(`/api/activities/project/${projectId}/stats`, { params: { days } }),
};

// Analytics API
export const analyticsApi = {
  getTrends: (projectId: string, days?: number) =>
    api.get(`/api/analytics/trends/${projectId}`, { params: { days } }),
  getIssueDistribution: (projectId: string) =>
    api.get(`/api/analytics/issues/${projectId}`),
  getPerformanceMetrics: (projectId: string, limit?: number) =>
    api.get(`/api/analytics/performance/${projectId}`, { params: { limit } }),
  createSnapshot: (auditId: string) =>
    api.post(`/api/analytics/snapshot/${auditId}`),
};

// Recommendations API
export const recommendationsApi = {
  generate: (auditId: string) =>
    api.post(`/api/recommendations/generate/${auditId}`),
  getForAudit: (auditId: string) =>
    api.get(`/api/recommendations/${auditId}`),
  markImplemented: (recommendationId: string) =>
    api.patch(`/api/recommendations/${recommendationId}/implement`),
};

// Competitors API
export const competitorsApi = {
  getAll: (projectId: string) =>
    api.get(`/api/competitors/${projectId}`),
  create: (projectId: string, data: { name: string; domain: string }) =>
    api.post(`/api/competitors/${projectId}`, data),
  delete: (competitorId: string) =>
    api.delete(`/api/competitors/${competitorId}`),
  getSnapshots: (competitorId: string, limit?: number) =>
    api.get(`/api/competitors/${competitorId}/snapshots`, { params: { limit } }),
  createSnapshot: (competitorId: string, data: {
    totalScore: number;
    technicalScore: number;
    onPageScore: number;
    structuredDataScore: number;
    performanceScore: number;
    localSeoScore: number;
    metadata?: any;
  }) =>
    api.post(`/api/competitors/${competitorId}/snapshot`, data),
  compare: (projectId: string) =>
    api.get(`/api/competitors/${projectId}/compare`),
};

// Settings API
export const settingsApi = {
  getAll: () => api.get('/api/settings'),
  getByKey: (key: string) => api.get(`/api/settings/${key}`),
  update: (key: string, data: { value: string; description?: string; isSecret?: boolean }) =>
    api.put(`/api/settings/${key}`, data),
  delete: (key: string) => api.delete(`/api/settings/${key}`),
  testOpenAI: (apiKey: string) => api.post('/api/settings/test-openai', { apiKey }),
};

// Reports API
export const reportsApi = {
  downloadPDF: (auditId: string) => {
    const token = localStorage.getItem('token');
    const url = `${API_URL}/api/reports/pdf/${auditId}`;
    window.open(`${url}?token=${token}`, '_blank');
  },
  downloadIssuesCSV: (auditId: string) => {
    const token = localStorage.getItem('token');
    const url = `${API_URL}/api/reports/csv/issues/${auditId}`;
    window.open(`${url}?token=${token}`, '_blank');
  },
  downloadRecommendationsCSV: (auditId: string) => {
    const token = localStorage.getItem('token');
    const url = `${API_URL}/api/reports/csv/recommendations/${auditId}`;
    window.open(`${url}?token=${token}`, '_blank');
  },
  downloadAnalyticsCSV: (projectId: string) => {
    const token = localStorage.getItem('token');
    const url = `${API_URL}/api/reports/csv/analytics/${projectId}`;
    window.open(`${url}?token=${token}`, '_blank');
  },
};

// Profile API
export const profileApi = {
  get: () => api.get('/api/profile'),
  update: (data: { email?: string }) => api.put('/api/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/api/profile/change-password', data),
  getNotifications: () => api.get('/api/profile/notifications'),
  updateNotifications: (preferences: {
    auditComplete?: boolean;
    weeklyDigest?: boolean;
    teamInvitations?: boolean;
    projectActivity?: boolean;
  }) => api.put('/api/profile/notifications', preferences),
  updateSlack: (data: { webhookUrl?: string | null }) =>
    api.put('/api/profile/slack', data),
};

// Email Templates API
export const emailTemplatesApi = {
  getAll: () => api.get('/api/email-templates'),
  getByKey: (key: string) => api.get(`/api/email-templates/${key}`),
  update: (key: string, data: {
    name?: string;
    subject?: string;
    htmlContent?: string;
    description?: string;
    isActive?: boolean;
  }) => api.put(`/api/email-templates/${key}`, data),
  reset: (key: string) => api.post(`/api/email-templates/${key}/reset`),
};

// Webhooks API
export const webhooksApi = {
  getAll: (projectId?: string) => 
    api.get('/api/webhooks', { params: projectId ? { projectId } : {} }),
  create: (data: { projectId?: string; url: string; events: string[]; secret?: string }) =>
    api.post('/api/webhooks', data),
  update: (id: string, data: { url?: string; events?: string[]; enabled?: boolean; secret?: string }) =>
    api.put(`/api/webhooks/${id}`, data),
  delete: (id: string) => api.delete(`/api/webhooks/${id}`),
  test: (id: string) => api.post(`/api/webhooks/${id}/test`),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/api/notifications', { params }),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.post('/api/notifications/mark-all-read'),
  archive: (id: string) => api.delete(`/api/notifications/${id}`),
  
  // Notification Rules
  getRules: (projectId?: string) =>
    api.get('/api/notifications/rules', { params: projectId ? { projectId } : {} }),
  createRule: (data: {
    projectId?: string;
    name: string;
    event: string;
    conditions: Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
      value: any;
    }>;
    channels: ('IN_APP' | 'EMAIL' | 'SLACK' | 'WEBHOOK')[];
  }) => api.post('/api/notifications/rules', data),
  updateRule: (id: string, data: {
    name?: string;
    conditions?: Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
      value: any;
    }>;
    channels?: ('IN_APP' | 'EMAIL' | 'SLACK' | 'WEBHOOK')[];
    enabled?: boolean;
  }) => api.put(`/api/notifications/rules/${id}`, data),
  deleteRule: (id: string) => api.delete(`/api/notifications/rules/${id}`),
};

// Goals API
export const goalsApi = {
  getByProject: (projectId: string) => api.get(`/api/goals/project/${projectId}`),
  getOne: (id: string) => api.get(`/api/goals/${id}`),
  create: (data: {
    projectId: string;
    name: string;
    targetScore: number;
    category?: 'OVERALL' | 'PERFORMANCE' | 'TECHNICAL' | 'ON_PAGE' | 'STRUCTURED_DATA' | 'LOCAL_SEO';
    deadline?: string;
    description?: string;
  }) => api.post('/api/goals', data),
  update: (id: string, data: {
    name?: string;
    targetScore?: number;
    category?: 'OVERALL' | 'PERFORMANCE' | 'TECHNICAL' | 'ON_PAGE' | 'STRUCTURED_DATA' | 'LOCAL_SEO';
    deadline?: string;
    description?: string;
  }) => api.put(`/api/goals/${id}`, data),
  delete: (id: string) => api.delete(`/api/goals/${id}`),
  check: (id: string) => api.post(`/api/goals/${id}/check`),
  getProgress: (id: string) => api.get(`/api/goals/${id}/progress`),
};

// Keywords API
export const keywordsApi = {
  getByProject: (projectId: string) => api.get(`/api/keywords/project/${projectId}`),
  getOne: (id: string) => api.get(`/api/keywords/${id}`),
  create: (data: {
    projectId: string;
    groupId?: string;
    keyword: string;
    targetUrl?: string;
    device?: 'DESKTOP' | 'MOBILE' | 'TABLET';
    location?: string;
    language?: string;
  }) => api.post('/api/keywords', data),
  bulkCreate: (data: {
    projectId: string;
    groupId?: string;
    keywords: string[];
    device?: 'DESKTOP' | 'MOBILE' | 'TABLET';
    location?: string;
  }) => api.post('/api/keywords/bulk', data),
  update: (id: string, data: {
    groupId?: string | null;
    targetUrl?: string | null;
    isTracking?: boolean;
  }) => api.patch(`/api/keywords/${id}`, data),
  delete: (id: string) => api.delete(`/api/keywords/${id}`),
  toggle: (id: string) => api.post(`/api/keywords/${id}/toggle`),
  syncGSC: (projectId: string) => api.post('/api/keywords/sync-gsc', { projectId }),
};

// Keyword Groups API
export const keywordGroupsApi = {
  getByProject: (projectId: string) => api.get(`/api/keyword-groups/project/${projectId}`),
  create: (data: {
    projectId: string;
    name: string;
    color?: string;
    description?: string;
  }) => api.post('/api/keyword-groups', data),
  update: (id: string, data: {
    name?: string;
    color?: string;
    description?: string;
  }) => api.patch(`/api/keyword-groups/${id}`, data),
  delete: (id: string) => api.delete(`/api/keyword-groups/${id}`),
};

// Google Search Console API
export const gscApi = {
  getStatus: () => api.get('/api/gsc/status'),
  getAuthUrl: () => api.get('/api/gsc/auth-url'),
  getSites: () => api.get('/api/gsc/sites'),
  getTopKeywords: (siteUrl: string, limit?: number) => 
    api.get('/api/gsc/top-keywords', { params: { siteUrl, limit } }),
  disconnect: () => api.post('/api/gsc/disconnect'),
};

// Dashboard Analytics API
export const dashboardAnalyticsApi = {
  getOverview: (days?: number) => 
    api.get('/api/dashboard-analytics/overview', { params: { days } }),
  getTrends: (days?: number, projectId?: string) => 
    api.get('/api/dashboard-analytics/trends', { params: { days, projectId } }),
  getProjectComparison: () => 
    api.get('/api/dashboard-analytics/project-comparison'),
  getScoreDistribution: () => 
    api.get('/api/dashboard-analytics/score-distribution'),
  getActivitySummary: (days?: number) => 
    api.get('/api/dashboard-analytics/activity-summary', { params: { days } }),
};

// Billing API
export const billingApi = {
  getSubscription: () => api.get('/api/billing/subscription'),
  getPlans: () => api.get('/api/billing/plans'),
  subscribe: (planTier: 'PRO' | 'ENTERPRISE') => 
    api.post('/api/billing/subscribe', { planTier }),
  activate: (subscriptionId: string) => 
    api.post('/api/billing/activate', { subscriptionId }),
  cancel: () => api.post('/api/billing/cancel'),
  getInvoices: () => api.get('/api/billing/invoices'),
};

