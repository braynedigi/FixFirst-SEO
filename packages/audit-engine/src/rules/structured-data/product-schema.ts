import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';

export class ProductSchemaRule implements IAuditRule {
  id = 'schema-product';
  category = 'structured-data' as const;
  name = 'Product Schema';
  description = 'Validate Product schema markup if applicable';
  weight = 4;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    
    // Find Product schema
    let productSchema: any = null;
    for (const data of page.jsonLdData) {
      if (data['@type'] === 'Product') {
        productSchema = data;
        break;
      }
      if (data['@graph']) {
        const product = data['@graph'].find((item: any) => item['@type'] === 'Product');
        if (product) {
          productSchema = product;
          break;
        }
      }
    }

    if (!productSchema) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    // Validate required properties for Product
    const requiredProps = ['name', 'image', 'description'];
    const recommendedProps = ['offers', 'brand', 'sku', 'aggregateRating'];
    const missing = [];
    const present = [];

    for (const prop of [...requiredProps, ...recommendedProps]) {
      if (productSchema[prop]) {
        present.push(prop);
      } else {
        missing.push(prop);
      }
    }

    const hasRequired = requiredProps.every(prop => productSchema[prop]);
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
            severity: 'critical',
            message: `Product schema missing required properties: ${missing.filter(p => requiredProps.includes(p)).join(', ')}`,
            recommendation: 'Add required properties: name, image, and description for valid Product schema.',
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
            message: `Product schema could be enhanced. Missing: ${missing.join(', ')}`,
            recommendation: 'Add offers (with price), brand, sku, and aggregateRating for rich product results.',
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

