import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';
import { parseHtml } from '../../crawler';

export class MetaDescriptionRule implements IAuditRule {
  id = 'onpage-meta-description';
  category = 'onpage' as const;
  name = 'Meta Description';
  description = 'Check meta description exists and is 120-160 characters';
  weight = 4;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const $ = parseHtml(page.html);
    const description = $('meta[name="description"]').attr('content')?.trim() || '';

    if (!description) {
      return {
        passed: false,
        score: 0,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: 'No meta description found',
            recommendation: 'Add a meta description: <meta name="description" content="Your compelling description here">. This helps improve click-through rates from search results.',
            metadata: {},
          },
        ],
      };
    }

    const length = description.length;

    if (length < 120) {
      return {
        passed: false,
        score: this.weight * 0.5,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: `Meta description is too short (${length} characters)`,
            recommendation: 'Expand your meta description to 120-160 characters for better visibility in search results.',
            metadata: { description, length },
          },
        ],
      };
    }

    if (length > 160) {
      return {
        passed: false,
        score: this.weight * 0.7,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: `Meta description is too long (${length} characters)`,
            recommendation: 'Shorten your meta description to 120-160 characters. Search engines may truncate longer descriptions.',
            metadata: { description, length },
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

