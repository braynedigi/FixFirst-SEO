import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';
import { parseHtml } from '../../crawler';

export class BusinessProfileRule implements IAuditRule {
  id = 'local-business-profile';
  category = 'local-seo' as const;
  name = 'Google Business Profile';
  description = 'Check for Google Business Profile or Maps links';
  weight = 1;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const $ = parseHtml(page.html);
    
    // Check for Google Business/Maps links
    const businessLinks = $('a[href*="google.com/maps"], a[href*="g.page"], a[href*="business.google.com"]');
    const hasBusinessLink = businessLinks.length > 0;

    if (hasBusinessLink) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    return {
      passed: true,
      score: this.weight,
      issues: [
        {
          pageId: null,
          ruleId: this.id,
          severity: 'info',
          message: 'No Google Business Profile link found',
          recommendation: 'If you have a Google Business Profile, link to it from your website. This can improve local search visibility.',
          metadata: {},
        },
      ],
    };
  }
}

