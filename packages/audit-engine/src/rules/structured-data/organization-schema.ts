import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';

export class OrganizationSchemaRule implements IAuditRule {
  id = 'schema-organization';
  category = 'structured-data' as const;
  name = 'Organization Schema';
  description = 'Validate Organization schema markup';
  weight = 4;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    
    // Find Organization schema
    let orgSchema: any = null;
    for (const data of page.jsonLdData) {
      if (data['@type'] === 'Organization') {
        orgSchema = data;
        break;
      }
      if (data['@graph']) {
        const org = data['@graph'].find((item: any) => item['@type'] === 'Organization');
        if (org) {
          orgSchema = org;
          break;
        }
      }
    }

    if (!orgSchema) {
      return {
        passed: true,
        score: this.weight,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: 'No Organization schema found',
            recommendation: 'Consider adding Organization schema if this is a business website. Include name, logo, url, and sameAs properties.',
            metadata: {},
          },
        ],
      };
    }

    // Validate required properties
    const requiredProps = ['name', 'url'];
    const recommendedProps = ['logo', 'sameAs', 'contactPoint'];
    const missing = [];
    const present = [];

    for (const prop of [...requiredProps, ...recommendedProps]) {
      if (orgSchema[prop]) {
        present.push(prop);
      } else {
        missing.push(prop);
      }
    }

    const hasRequired = requiredProps.every(prop => orgSchema[prop]);
    const coverage = present.length / (requiredProps.length + recommendedProps.length);
    const score = Math.round(coverage * this.weight);

    if (!hasRequired) {
      return {
        passed: false,
        score: score * 0.5,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: `Organization schema missing required properties: ${missing.filter(p => requiredProps.includes(p)).join(', ')}`,
            recommendation: 'Add missing required properties to your Organization schema. At minimum, include name and url.',
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
            message: `Organization schema could be enhanced. Missing: ${missing.join(', ')}`,
            recommendation: 'Add logo, sameAs (social media URLs), and contactPoint for a more complete Organization schema.',
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

