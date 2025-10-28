import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';

export class JsonLdRule implements IAuditRule {
  id = 'schema-jsonld';
  category = 'structured-data' as const;
  name = 'JSON-LD Detection';
  description = 'Detect presence of JSON-LD structured data';
  weight = 5;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const jsonLdCount = page.jsonLdData.length;

    if (jsonLdCount === 0) {
      return {
        passed: false,
        score: 0,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: 'No JSON-LD structured data found',
            recommendation: 'Add JSON-LD structured data to help search engines understand your content better. Start with Organization or LocalBusiness schema.',
            metadata: {},
          },
        ],
      };
    }

    // Extract schema types
    const schemaTypes = page.jsonLdData.map((data) => {
      if (data['@type']) return data['@type'];
      if (data['@graph']) {
        return data['@graph'].map((item: any) => item['@type']).filter(Boolean);
      }
      return 'Unknown';
    }).flat();

    return {
      passed: true,
      score: this.weight,
      issues: [
        {
          pageId: null,
          ruleId: this.id,
          severity: 'info',
          message: `Found ${jsonLdCount} JSON-LD block(s) with types: ${schemaTypes.join(', ')}`,
          recommendation: 'JSON-LD structured data detected. Verify it\'s properly configured using Google\'s Rich Results Test.',
          metadata: { jsonLdCount, schemaTypes },
        },
      ],
    };
  }
}

