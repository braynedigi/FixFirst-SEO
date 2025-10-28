import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';
import { parseHtml } from '../../crawler';

export class GoogleMapsRule implements IAuditRule {
  id = 'local-google-maps';
  category = 'local-seo' as const;
  name = 'Google Maps Embed';
  description = 'Detect embedded Google Maps on the page';
  weight = 2;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const $ = parseHtml(page.html);
    
    // Check for Google Maps iframe
    const mapIframe = $('iframe[src*="google.com/maps"]');
    const hasMap = mapIframe.length > 0;

    if (hasMap) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    // Check for geo coordinates in schema
    let hasGeoSchema = false;
    for (const data of page.jsonLdData) {
      if (data.geo || (data.address && data.address.geo)) {
        hasGeoSchema = true;
        break;
      }
    }

    if (hasGeoSchema) {
      return {
        passed: true,
        score: this.weight * 0.7,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: 'Geo coordinates found in schema but no embedded map',
            recommendation: 'Consider adding an embedded Google Map for better user experience on your contact/location page.',
            metadata: {},
          },
        ],
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
          message: 'No Google Maps embed detected',
          recommendation: 'If this is a local business, consider embedding a Google Map on your contact page to help customers find you.',
          metadata: {},
        },
      ],
    };
  }
}

