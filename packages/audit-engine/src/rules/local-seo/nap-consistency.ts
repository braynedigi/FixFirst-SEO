import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';
import { parseHtml } from '../../crawler';

export class NapConsistencyRule implements IAuditRule {
  id = 'local-nap';
  category = 'local-seo' as const;
  name = 'NAP Consistency';
  description = 'Check for consistent Name, Address, Phone information';
  weight = 2;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const $ = parseHtml(page.html);
    const text = $('body').text();

    // Simple pattern matching for phone numbers
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex) || [];

    // Check for address keywords
    const addressKeywords = ['street', 'avenue', 'road', 'suite', 'floor', 'building'];
    const hasAddress = addressKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );

    // Check LocalBusiness schema for NAP
    let hasSchemaAddress = false;
    let hasSchemaPhone = false;

    for (const data of page.jsonLdData) {
      if (data['@type']?.includes('Business') || data['@type'] === 'Organization') {
        if (data.address) hasSchemaAddress = true;
        if (data.telephone) hasSchemaPhone = true;
      }
    }

    const napFound = {
      phone: phones.length > 0,
      address: hasAddress,
      schemaAddress: hasSchemaAddress,
      schemaPhone: hasSchemaPhone,
    };

    if (napFound.phone && napFound.address && napFound.schemaAddress && napFound.schemaPhone) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    if (!napFound.phone && !napFound.address) {
      return {
        passed: true,
        score: this.weight,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: 'No NAP (Name, Address, Phone) information detected',
            recommendation: 'If this is a local business, add your contact information prominently and in LocalBusiness schema.',
            metadata: napFound,
          },
        ],
      };
    }

    const missing = [];
    if (!napFound.phone) missing.push('phone');
    if (!napFound.address) missing.push('address');
    if (!napFound.schemaAddress) missing.push('schema address');
    if (!napFound.schemaPhone) missing.push('schema phone');

    return {
      passed: false,
      score: this.weight * 0.5,
      issues: [
        {
          pageId: null,
          ruleId: this.id,
          severity: 'info',
          message: `Incomplete NAP information. Missing: ${missing.join(', ')}`,
          recommendation: 'Add complete NAP (Name, Address, Phone) information in both visible text and LocalBusiness schema for better local SEO.',
          metadata: napFound,
        },
      ],
    };
  }
}

