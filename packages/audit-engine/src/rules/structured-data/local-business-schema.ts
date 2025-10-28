import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';

export class LocalBusinessSchemaRule implements IAuditRule {
  id = 'schema-local-business';
  category = 'structured-data' as const;
  name = 'LocalBusiness Schema';
  description = 'Validate LocalBusiness schema markup if applicable';
  weight = 3;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    
    // Find LocalBusiness schema
    let businessSchema: any = null;
    for (const data of page.jsonLdData) {
      if (data['@type'] === 'LocalBusiness' || (typeof data['@type'] === 'string' && data['@type'].includes('Business'))) {
        businessSchema = data;
        break;
      }
      if (data['@graph']) {
        const business = data['@graph'].find((item: any) => 
          item['@type'] === 'LocalBusiness' || (typeof item['@type'] === 'string' && item['@type'].includes('Business'))
        );
        if (business) {
          businessSchema = business;
          break;
        }
      }
    }

    if (!businessSchema) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    // Validate required properties
    const requiredProps = ['name', 'address'];
    const recommendedProps = ['telephone', 'openingHours', 'geo', 'priceRange'];
    const missing = [];
    const present = [];

    for (const prop of [...requiredProps, ...recommendedProps]) {
      if (businessSchema[prop]) {
        present.push(prop);
      } else {
        missing.push(prop);
      }
    }

    const hasRequired = requiredProps.every(prop => businessSchema[prop]);
    const coverage = present.length / (requiredProps.length + recommendedProps.length);
    const score = Math.round(coverage * this.weight);

    if (!hasRequired) {
      return {
        passed: false,
        score: 0,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: `LocalBusiness schema missing required properties: ${missing.filter(p => requiredProps.includes(p)).join(', ')}`,
            recommendation: 'Add required properties: name and address (PostalAddress) for valid LocalBusiness schema.',
            metadata: { missing, present },
          },
        ],
      };
    }

    if (missing.length > 0) {
      return {
        passed: true,
        score,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: `LocalBusiness schema could be enhanced. Missing: ${missing.join(', ')}`,
            recommendation: 'Add telephone, openingHours, geo coordinates, and priceRange for better local search visibility.',
            metadata: { missing, present },
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

