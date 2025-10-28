import { IAuditRule } from '@seo-audit/shared';

// Technical rules
import { HttpStatusRule } from './technical/http-status';
import { HttpsRule } from './technical/https';
import { CanonicalRule } from './technical/canonical';
import { RobotsTxtRule } from './technical/robots-txt';
import { SitemapRule } from './technical/sitemap';
import { SecurityHeadersRule } from './technical/security-headers';
import { MobileFriendlyRule } from './technical/mobile-friendly';

// On-Page rules
import { TitleTagRule } from './onpage/title-tag';
import { MetaDescriptionRule } from './onpage/meta-description';
import { H1TagRule } from './onpage/h1-tag';
import { WordCountRule } from './onpage/word-count';
import { ImageAltTextRule } from './onpage/image-alt-text';
import { OpenGraphRule } from './onpage/open-graph';
import { LinksRule } from './onpage/links';

// Structured Data rules
import { JsonLdRule } from './structured-data/jsonld';
import { OrganizationSchemaRule } from './structured-data/organization-schema';
import { ProductSchemaRule } from './structured-data/product-schema';
import { ArticleSchemaRule } from './structured-data/article-schema';
import { LocalBusinessSchemaRule } from './structured-data/local-business-schema';

// Performance rules
import { LoadTimeRule } from './performance/load-time';
import { PageSizeRule } from './performance/page-size';
import { RequestCountRule } from './performance/request-count';

// Local SEO rules
import { NapConsistencyRule } from './local-seo/nap-consistency';
import { GoogleMapsRule } from './local-seo/google-maps';
import { BusinessProfileRule } from './local-seo/business-profile';

export const allRules: IAuditRule[] = [
  // Technical (35 points)
  new HttpStatusRule(),
  new HttpsRule(),
  new CanonicalRule(),
  new RobotsTxtRule(),
  new SitemapRule(),
  new SecurityHeadersRule(),
  new MobileFriendlyRule(),
  
  // On-Page (25 points)
  new TitleTagRule(),
  new MetaDescriptionRule(),
  new H1TagRule(),
  new WordCountRule(),
  new ImageAltTextRule(),
  new OpenGraphRule(),
  new LinksRule(),
  
  // Structured Data (20 points)
  new JsonLdRule(),
  new OrganizationSchemaRule(),
  new ProductSchemaRule(),
  new ArticleSchemaRule(),
  new LocalBusinessSchemaRule(),
  
  // Performance (15 points)
  new LoadTimeRule(),
  new PageSizeRule(),
  new RequestCountRule(),
  
  // Local SEO (5 points)
  new NapConsistencyRule(),
  new GoogleMapsRule(),
  new BusinessProfileRule(),
];

