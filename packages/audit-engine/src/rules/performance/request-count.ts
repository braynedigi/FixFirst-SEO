import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';

export class RequestCountRule implements IAuditRule {
  id = 'perf-requests';
  category = 'performance' as const;
  name = 'Request Count';
  description = 'Ensure fewer than 50 HTTP requests';
  weight = 3;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const requestCount = page.resources.length;

    if (requestCount <= 30) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    if (requestCount <= 50) {
      return {
        passed: true,
        score: this.weight * 0.7,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: `Moderate number of HTTP requests (${requestCount})`,
            recommendation: 'Consider reducing requests by combining files, using CSS sprites, or implementing lazy loading.',
            metadata: { requestCount },
          },
        ],
      };
    }

    if (requestCount <= 100) {
      return {
        passed: false,
        score: this.weight * 0.3,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: `High number of HTTP requests (${requestCount})`,
            recommendation: 'Reduce HTTP requests. Combine CSS/JS files, use sprite sheets, lazy-load images, and remove unused resources.',
            metadata: { requestCount },
          },
        ],
      };
    }

    return {
      passed: false,
      score: 0,
      issues: [
        {
          pageId: null,
          ruleId: this.id,
          severity: 'critical',
          message: `Excessive HTTP requests (${requestCount})`,
          recommendation: 'Urgent: Too many requests are slowing down your page. Audit and remove unnecessary resources, combine files, and implement aggressive caching.',
          metadata: { requestCount },
        },
      ],
    };
  }
}

