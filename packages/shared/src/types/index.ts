// Database Models
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  planTier: 'free' | 'pro' | 'agency';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  domain: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AuditStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface Audit {
  id: string;
  projectId: string;
  url: string;
  status: AuditStatus;
  totalScore: number | null;
  technicalScore: number | null;
  onPageScore: number | null;
  structuredDataScore: number | null;
  performanceScore: number | null;
  localSeoScore: number | null;
  startedAt: Date;
  completedAt: Date | null;
  metadata: Record<string, any>;
}

export interface Page {
  id: string;
  auditId: string;
  url: string;
  statusCode: number;
  crawledAt: Date;
  htmlSnapshot: string | null;
  loadTime: number | null;
  pageSize: number | null;
}

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface Issue {
  id: string;
  auditId: string;
  pageId: string | null;
  ruleId: string;
  severity: IssueSeverity;
  message: string;
  recommendation: string;
  metadata: Record<string, any>;
}

export type RuleCategory = 'technical' | 'onpage' | 'structured-data' | 'performance' | 'local-seo';

export interface Rule {
  id: string;
  category: RuleCategory;
  name: string;
  description: string;
  weight: number;
  isActive: boolean;
}

// API Request/Response Types
export interface CreateAuditRequest {
  url: string;
  projectId?: string;
  keywords?: string[];
}

export interface CreateAuditResponse {
  auditId: string;
  status: AuditStatus;
  message: string;
}

export interface AuditResultResponse {
  audit: Audit;
  issues: Issue[];
  pages: Page[];
  categoryScores: {
    technical: number;
    onpage: number;
    structuredData: number;
    performance: number;
    localSeo: number;
  };
}

// Audit Engine Types
export interface CrawlResult {
  url: string;
  finalUrl: string;
  statusCode: number;
  headers: Record<string, string>;
  html: string;
  loadTime: number;
  pageSize: number;
  screenshot?: Buffer;
  resources: ResourceInfo[];
  internalLinks: string[];
  externalLinks: string[];
  jsonLdData: any[];
  consoleErrors: string[];
}

export interface ResourceInfo {
  type: 'image' | 'script' | 'stylesheet' | 'font' | 'other';
  url: string;
  size: number;
}

export interface RuleCheckResult {
  passed: boolean;
  score: number;
  issues: Omit<Issue, 'id' | 'auditId'>[];
}

export interface AuditRuleContext {
  page: CrawlResult;
  allPages: CrawlResult[];
  projectDomain: string;
}

export interface IAuditRule {
  id: string;
  category: RuleCategory;
  name: string;
  description: string;
  weight: number;
  check(context: AuditRuleContext): Promise<RuleCheckResult>;
}

// Performance Metrics (Google PSI)
export interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  inp: number; // Interaction to Next Paint
  fcp: number; // First Contentful Paint
  tbt: number; // Total Blocking Time
  tti: number; // Time to Interactive
}

export interface PSIResponse {
  metrics: PerformanceMetrics;
  score: number;
  opportunities: PSIOpportunity[];
}

export interface PSIOpportunity {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

// Rate Limiting
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

// Job Queue Types
export interface AuditJobData {
  auditId: string;
  url: string;
  projectId: string;
  userId: string;
  maxPages?: number;
}

export interface AuditJobProgress {
  stage: 'crawling' | 'analyzing' | 'scoring' | 'completed';
  progress: number; // 0-100
  message: string;
}

