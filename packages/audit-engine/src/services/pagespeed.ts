import axios from 'axios';

export interface PSIMetrics {
  performanceScore: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint (ms)
  cls: number | null; // Cumulative Layout Shift (score)
  inp: number | null; // Interaction to Next Paint (ms)
  fcp: number | null; // First Contentful Paint (ms)
  tbt: number | null; // Total Blocking Time (ms)
  speedIndex: number | null; // Speed Index (ms)
  // Additional metrics
  tti: number | null; // Time to Interactive (ms)
  si: number | null; // Speed Index (ms)
}

export interface PSIOpportunity {
  id: string;
  title: string;
  description: string;
  displayValue?: string;
  score: number;
}

export interface PSIResult {
  mobile: PSIMetrics;
  desktop: PSIMetrics;
  opportunities: PSIOpportunity[];
  diagnostics: PSIOpportunity[];
  rawData?: any;
}

export class PageSpeedInsightsService {
  private apiKey: string | null;
  private baseUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

  constructor(apiKey?: string) {
    // API key is optional - PSI works without it but has lower rate limits
    this.apiKey = apiKey || process.env.PSI_API_KEY || null;
  }

  async analyzeUrl(url: string): Promise<PSIResult> {
    try {
      console.log(`[PSI] Analyzing ${url}...`);

      // Run both mobile and desktop analyses in parallel
      const [mobileData, desktopData] = await Promise.all([
        this.fetchPSIData(url, 'mobile'),
        this.fetchPSIData(url, 'desktop'),
      ]);

      const mobile = this.extractMetrics(mobileData);
      const desktop = this.extractMetrics(desktopData);

      // Extract opportunities and diagnostics (from mobile since they're usually more detailed)
      const opportunities = this.extractOpportunities(mobileData);
      const diagnostics = this.extractDiagnostics(mobileData);

      console.log(`[PSI] Completed analysis for ${url}`);
      console.log(`[PSI] Mobile Score: ${mobile.performanceScore}, Desktop Score: ${desktop.performanceScore}`);

      return {
        mobile,
        desktop,
        opportunities,
        diagnostics,
        rawData: { mobile: mobileData, desktop: desktopData },
      };
    } catch (error: any) {
      console.error('[PSI] Error analyzing URL:', error.message);
      
      // Return null data if PSI fails (don't block the audit)
      return this.getEmptyResult();
    }
  }

  private async fetchPSIData(url: string, strategy: 'mobile' | 'desktop'): Promise<any> {
    const params: any = {
      url,
      strategy,
      category: ['performance', 'accessibility', 'best-practices', 'seo'],
    };

    if (this.apiKey) {
      params.key = this.apiKey;
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 60000, // 60 second timeout
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn('[PSI] Rate limit exceeded, consider adding an API key');
      }
      throw error;
    }
  }

  private extractMetrics(data: any): PSIMetrics {
    const lighthouseResult = data.lighthouseResult;
    const categories = lighthouseResult.categories;
    const audits = lighthouseResult.audits;

    return {
      performanceScore: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
      
      // Core Web Vitals
      lcp: this.getMetricValue(audits['largest-contentful-paint']),
      cls: this.getMetricValue(audits['cumulative-layout-shift'], true),
      inp: this.getMetricValue(audits['interaction-to-next-paint']),
      fcp: this.getMetricValue(audits['first-contentful-paint']),
      tbt: this.getMetricValue(audits['total-blocking-time']),
      speedIndex: this.getMetricValue(audits['speed-index']),
      tti: this.getMetricValue(audits['interactive']),
      si: this.getMetricValue(audits['speed-index']),
    };
  }

  private getMetricValue(audit: any, isCLS = false): number | null {
    if (!audit || !audit.numericValue) return null;
    
    // CLS is already a score, others are in milliseconds
    if (isCLS) {
      return Math.round(audit.numericValue * 1000) / 1000; // Round to 3 decimals
    }
    
    return Math.round(audit.numericValue);
  }

  private extractOpportunities(data: any): PSIOpportunity[] {
    const audits = data.lighthouseResult.audits;
    const opportunities: PSIOpportunity[] = [];

    // Get all audits that have savings (opportunities)
    Object.keys(audits).forEach((key) => {
      const audit = audits[key];
      
      if (
        audit.details?.type === 'opportunity' &&
        audit.score !== null &&
        audit.score < 1
      ) {
        opportunities.push({
          id: audit.id,
          title: audit.title,
          description: audit.description,
          displayValue: audit.displayValue,
          score: audit.score,
        });
      }
    });

    // Sort by potential savings (score)
    return opportunities
      .sort((a, b) => a.score - b.score)
      .slice(0, 10); // Top 10 opportunities
  }

  private extractDiagnostics(data: any): PSIOpportunity[] {
    const audits = data.lighthouseResult.audits;
    const diagnostics: PSIOpportunity[] = [];

    // Important diagnostic audits to check
    const diagnosticKeys = [
      'uses-long-cache-ttl',
      'total-byte-weight',
      'dom-size',
      'critical-request-chains',
      'user-timings',
      'diagnostics',
    ];

    diagnosticKeys.forEach((key) => {
      const audit = audits[key];
      
      if (audit && audit.score !== null && audit.score < 1) {
        diagnostics.push({
          id: audit.id,
          title: audit.title,
          description: audit.description,
          displayValue: audit.displayValue,
          score: audit.score,
        });
      }
    });

    return diagnostics.slice(0, 5); // Top 5 diagnostics
  }

  private getEmptyResult(): PSIResult {
    const emptyMetrics: PSIMetrics = {
      performanceScore: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
      lcp: null,
      cls: null,
      inp: null,
      fcp: null,
      tbt: null,
      speedIndex: null,
      tti: null,
      si: null,
    };

    return {
      mobile: emptyMetrics,
      desktop: emptyMetrics,
      opportunities: [],
      diagnostics: [],
    };
  }

  // Method to check if API key is configured
  hasApiKey(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const psiService = new PageSpeedInsightsService();

