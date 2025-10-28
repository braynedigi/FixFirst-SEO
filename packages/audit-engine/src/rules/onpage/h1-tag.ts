import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';
import { parseHtml } from '../../crawler';

export class H1TagRule implements IAuditRule {
  id = 'onpage-h1';
  category = 'onpage' as const;
  name = 'H1 Tag';
  description = 'Ensure exactly one H1 tag exists on the page';
  weight = 4;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const $ = parseHtml(page.html);
    const h1Tags = $('h1');
    const count = h1Tags.length;

    if (count === 0) {
      return {
        passed: false,
        score: 0,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'critical',
            message: 'No H1 tag found',
            recommendation: 'Add an H1 tag to your page. The H1 should describe the main topic and include your primary keyword.',
            metadata: {},
          },
        ],
      };
    }

    if (count > 1) {
      const h1Texts = h1Tags.map((_, el) => $(el).text().trim()).get();
      return {
        passed: false,
        score: this.weight * 0.5,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: `Multiple H1 tags found (${count})`,
            recommendation: 'Use only one H1 tag per page. Multiple H1s can dilute the page focus. Consider changing additional H1s to H2 or H3.',
            metadata: { count, h1Texts },
          },
        ],
      };
    }

    const h1Text = h1Tags.first().text().trim();
    if (h1Text.length < 10) {
      return {
        passed: false,
        score: this.weight * 0.7,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: 'H1 tag is too short',
            recommendation: 'Make your H1 more descriptive. It should clearly describe the page content and include relevant keywords.',
            metadata: { h1Text },
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

