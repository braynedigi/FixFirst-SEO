import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';

export class ArticleSchemaRule implements IAuditRule {
  id = 'schema-article';
  category = 'structured-data' as const;
  name = 'Article Schema';
  description = 'Validate Article schema markup if applicable';
  weight = 4;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    
    // Find Article schema (Article, NewsArticle, BlogPosting)
    let articleSchema: any = null;
    const articleTypes = ['Article', 'NewsArticle', 'BlogPosting'];
    
    for (const data of page.jsonLdData) {
      if (articleTypes.includes(data['@type'])) {
        articleSchema = data;
        break;
      }
      if (data['@graph']) {
        const article = data['@graph'].find((item: any) => articleTypes.includes(item['@type']));
        if (article) {
          articleSchema = article;
          break;
        }
      }
    }

    if (!articleSchema) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    // Validate required properties
    const requiredProps = ['headline', 'author', 'datePublished'];
    const recommendedProps = ['image', 'publisher', 'dateModified'];
    const missing = [];
    const present = [];

    for (const prop of [...requiredProps, ...recommendedProps]) {
      if (articleSchema[prop]) {
        present.push(prop);
      } else {
        missing.push(prop);
      }
    }

    const hasRequired = requiredProps.every(prop => articleSchema[prop]);
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
            message: `Article schema missing required properties: ${missing.filter(p => requiredProps.includes(p)).join(', ')}`,
            recommendation: 'Add required properties: headline, author, and datePublished for valid Article schema.',
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
            message: `Article schema could be enhanced. Missing: ${missing.join(', ')}`,
            recommendation: 'Add image, publisher (Organization), and dateModified for better article visibility.',
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

