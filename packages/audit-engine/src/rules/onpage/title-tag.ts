import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';
import { parseHtml } from '../../crawler';

export class TitleTagRule implements IAuditRule {
  id = 'onpage-title';
  category = 'onpage' as const;
  name = 'Title Tag';
  description = 'Verify title tag exists and is 30-60 characters long';
  weight = 5;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const $ = parseHtml(page.html);
    const title = $('title').text().trim();

    if (!title) {
      return {
        passed: false,
        score: 0,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'critical',
            message: 'No title tag found',
            recommendation: 'Add a title tag to your page: <title>Your Page Title - Brand Name</title>. The title should be descriptive and include your target keywords.',
            metadata: {},
          },
        ],
      };
    }

    const length = title.length;

    if (length < 30) {
      return {
        passed: false,
        score: this.weight * 0.5,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: `Title tag is too short (${length} characters)`,
            recommendation: 'Expand your title tag to 30-60 characters. Include descriptive keywords and your brand name.',
            metadata: { title, length },
          },
        ],
      };
    }

    if (length > 60) {
      return {
        passed: false,
        score: this.weight * 0.7,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: `Title tag is too long (${length} characters)`,
            recommendation: 'Shorten your title tag to 30-60 characters. Search engines may truncate longer titles in search results.',
            metadata: { title, length },
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

