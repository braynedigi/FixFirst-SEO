import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';
import { parseHtml } from '../../crawler';

export class MobileFriendlyRule implements IAuditRule {
  id = 'tech-mobile-friendly';
  category = 'technical' as const;
  name = 'Mobile Friendliness';
  description = 'Check viewport meta tag and mobile responsiveness';
  weight = 5;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const $ = parseHtml(page.html);
    const viewport = $('meta[name="viewport"]').attr('content');

    if (!viewport) {
      return {
        passed: false,
        score: 0,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'critical',
            message: 'No viewport meta tag found',
            recommendation: 'Add a viewport meta tag to make your site mobile-friendly: <meta name="viewport" content="width=device-width, initial-scale=1">',
            metadata: {},
          },
        ],
      };
    }

    // Check for proper viewport configuration
    const hasWidthDevice = viewport.includes('width=device-width');
    const hasInitialScale = viewport.includes('initial-scale');

    if (!hasWidthDevice || !hasInitialScale) {
      return {
        passed: false,
        score: this.weight * 0.5,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: 'Viewport meta tag is not properly configured',
            recommendation: 'Update your viewport meta tag to: <meta name="viewport" content="width=device-width, initial-scale=1">',
            metadata: { viewport },
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

