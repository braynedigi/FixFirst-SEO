import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';
import { parseHtml } from '../../crawler';

export class CanonicalRule implements IAuditRule {
  id = 'tech-canonical';
  category = 'technical' as const;
  name = 'Canonical Tag';
  description = 'Check for proper canonical tag implementation to prevent duplicate content';
  weight = 4;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const $ = parseHtml(page.html);
    const canonical = $('link[rel="canonical"]').attr('href');

    if (!canonical) {
      return {
        passed: false,
        score: 0,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: 'No canonical tag found',
            recommendation: 'Add a canonical tag to specify the preferred version of this page: <link rel="canonical" href="https://example.com/page" />. This helps prevent duplicate content issues.',
            metadata: {},
          },
        ],
      };
    }

    // Check if canonical is absolute URL
    if (!canonical.startsWith('http')) {
      return {
        passed: false,
        score: this.weight * 0.5,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: 'Canonical tag uses relative URL',
            recommendation: 'Use an absolute URL in the canonical tag to avoid ambiguity. Change from relative path to full URL (e.g., https://example.com/page).',
            metadata: { canonical },
          },
        ],
      };
    }

    // Check if canonical points to itself or a different page
    const canonicalUrl = new URL(canonical);
    const pageUrl = new URL(page.finalUrl);
    
    if (canonicalUrl.href !== pageUrl.href) {
      return {
        passed: true,
        score: this.weight,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: 'Canonical tag points to a different URL',
            recommendation: 'The canonical tag points to a different URL. Ensure this is intentional if this is a duplicate or variant page.',
            metadata: { canonical, currentUrl: page.finalUrl },
          },
        ],
      };
    }

    return {
      passed: true,
      score: this.weight,
      issues: [],
    };
  }
}

