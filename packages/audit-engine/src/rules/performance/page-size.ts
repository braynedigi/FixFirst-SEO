import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';

export class PageSizeRule implements IAuditRule {
  id = 'perf-page-size';
  category = 'performance' as const;
  name = 'Page Size';
  description = 'Check that page size is under 2MB';
  weight = 3;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const totalSize = page.resources.reduce((sum, r) => sum + r.size, 0) + page.pageSize;
    const sizeMB = totalSize / (1024 * 1024);

    if (sizeMB <= 1) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    if (sizeMB <= 2) {
      return {
        passed: true,
        score: this.weight * 0.7,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: `Page size is acceptable (${sizeMB.toFixed(2)}MB)`,
            recommendation: 'Consider reducing page size to under 1MB for faster loading on slower connections.',
            metadata: { sizeMB },
          },
        ],
      };
    }

    if (sizeMB <= 3) {
      return {
        passed: false,
        score: this.weight * 0.3,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: `Page size is large (${sizeMB.toFixed(2)}MB)`,
            recommendation: 'Reduce page size. Compress and optimize images, remove unused CSS/JS, and enable Gzip compression.',
            metadata: { sizeMB },
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
          message: `Page size is too large (${sizeMB.toFixed(2)}MB)`,
          recommendation: 'Urgent: Significantly reduce page size. Optimize all images, lazy-load resources, and remove unnecessary assets.',
          metadata: { sizeMB },
        },
      ],
    };
  }
}

