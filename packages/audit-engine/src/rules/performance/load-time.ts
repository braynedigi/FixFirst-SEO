import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';

export class LoadTimeRule implements IAuditRule {
  id = 'perf-load-time';
  category = 'performance' as const;
  name = 'Page Load Time';
  description = 'Verify page loads in under 3 seconds';
  weight = 5;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const loadTime = page.loadTime;
    const loadTimeSeconds = loadTime / 1000;

    if (loadTimeSeconds <= 2) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    if (loadTimeSeconds <= 3) {
      return {
        passed: true,
        score: this.weight * 0.8,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: `Page load time is acceptable (${loadTimeSeconds.toFixed(2)}s)`,
            recommendation: 'Consider optimizing to get under 2 seconds for better user experience.',
            metadata: { loadTime: loadTimeSeconds },
          },
        ],
      };
    }

    if (loadTimeSeconds <= 5) {
      return {
        passed: false,
        score: this.weight * 0.5,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: `Page loads slowly (${loadTimeSeconds.toFixed(2)}s)`,
            recommendation: 'Optimize page load time. Compress images, minify CSS/JS, enable caching, and use a CDN.',
            metadata: { loadTime: loadTimeSeconds },
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
          message: `Page loads very slowly (${loadTimeSeconds.toFixed(2)}s)`,
          recommendation: 'Urgent: Reduce page load time. Check server response time, optimize images, minimize HTTP requests, and enable compression.',
          metadata: { loadTime: loadTimeSeconds },
        },
      ],
    };
  }
}

