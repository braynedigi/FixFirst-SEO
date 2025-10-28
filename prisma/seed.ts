import { PrismaClient, RuleCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const rules = [
  // Technical & Indexing (35 points total)
  {
    id: 'tech-http-status',
    category: 'TECHNICAL' as RuleCategory,
    name: 'HTTP Status Check',
    description: 'Verify that the page returns a successful HTTP status code (200)',
    weight: 5,
  },
  {
    id: 'tech-https',
    category: 'TECHNICAL' as RuleCategory,
    name: 'HTTPS Enforcement',
    description: 'Ensure the website uses HTTPS for secure connections',
    weight: 5,
  },
  {
    id: 'tech-canonical',
    category: 'TECHNICAL' as RuleCategory,
    name: 'Canonical Tag',
    description: 'Check for proper canonical tag implementation to prevent duplicate content',
    weight: 4,
  },
  {
    id: 'tech-robots-txt',
    category: 'TECHNICAL' as RuleCategory,
    name: 'Robots.txt',
    description: 'Verify robots.txt file exists and is properly configured',
    weight: 3,
  },
  {
    id: 'tech-sitemap',
    category: 'TECHNICAL' as RuleCategory,
    name: 'XML Sitemap',
    description: 'Check for XML sitemap presence and accessibility',
    weight: 3,
  },
  {
    id: 'tech-security-headers',
    category: 'TECHNICAL' as RuleCategory,
    name: 'Security Headers',
    description: 'Verify presence of security headers (HSTS, CSP, X-Frame-Options)',
    weight: 5,
  },
  {
    id: 'tech-mobile-friendly',
    category: 'TECHNICAL' as RuleCategory,
    name: 'Mobile Friendliness',
    description: 'Check viewport meta tag and mobile responsiveness',
    weight: 5,
  },
  {
    id: 'tech-core-web-vitals',
    category: 'TECHNICAL' as RuleCategory,
    name: 'Core Web Vitals',
    description: 'Measure Core Web Vitals via Google PageSpeed Insights',
    weight: 5,
  },

  // On-Page (25 points total)
  {
    id: 'onpage-title',
    category: 'ONPAGE' as RuleCategory,
    name: 'Title Tag',
    description: 'Verify title tag exists and is 30-60 characters long',
    weight: 5,
  },
  {
    id: 'onpage-meta-description',
    category: 'ONPAGE' as RuleCategory,
    name: 'Meta Description',
    description: 'Check meta description exists and is 120-160 characters',
    weight: 4,
  },
  {
    id: 'onpage-h1',
    category: 'ONPAGE' as RuleCategory,
    name: 'H1 Tag',
    description: 'Ensure exactly one H1 tag exists on the page',
    weight: 4,
  },
  {
    id: 'onpage-word-count',
    category: 'ONPAGE' as RuleCategory,
    name: 'Content Length',
    description: 'Check that page has at least 300 words of content',
    weight: 3,
  },
  {
    id: 'onpage-images-alt',
    category: 'ONPAGE' as RuleCategory,
    name: 'Image Alt Text',
    description: 'Verify all images have alt text attributes',
    weight: 3,
  },
  {
    id: 'onpage-open-graph',
    category: 'ONPAGE' as RuleCategory,
    name: 'Open Graph Tags',
    description: 'Check for Open Graph and Twitter Card meta tags',
    weight: 3,
  },
  {
    id: 'onpage-links',
    category: 'ONPAGE' as RuleCategory,
    name: 'Internal/External Links',
    description: 'Analyze link structure and check for broken links',
    weight: 3,
  },

  // Structured Data (20 points total)
  {
    id: 'schema-jsonld',
    category: 'STRUCTURED_DATA' as RuleCategory,
    name: 'JSON-LD Detection',
    description: 'Detect presence of JSON-LD structured data',
    weight: 5,
  },
  {
    id: 'schema-organization',
    category: 'STRUCTURED_DATA' as RuleCategory,
    name: 'Organization Schema',
    description: 'Validate Organization schema markup',
    weight: 4,
  },
  {
    id: 'schema-product',
    category: 'STRUCTURED_DATA' as RuleCategory,
    name: 'Product Schema',
    description: 'Validate Product schema markup if applicable',
    weight: 4,
  },
  {
    id: 'schema-article',
    category: 'STRUCTURED_DATA' as RuleCategory,
    name: 'Article Schema',
    description: 'Validate Article schema markup if applicable',
    weight: 4,
  },
  {
    id: 'schema-local-business',
    category: 'STRUCTURED_DATA' as RuleCategory,
    name: 'LocalBusiness Schema',
    description: 'Validate LocalBusiness schema markup if applicable',
    weight: 3,
  },

  // Performance (15 points total)
  {
    id: 'perf-load-time',
    category: 'PERFORMANCE' as RuleCategory,
    name: 'Page Load Time',
    description: 'Verify page loads in under 3 seconds',
    weight: 5,
  },
  {
    id: 'perf-page-size',
    category: 'PERFORMANCE' as RuleCategory,
    name: 'Page Size',
    description: 'Check that page size is under 2MB',
    weight: 3,
  },
  {
    id: 'perf-requests',
    category: 'PERFORMANCE' as RuleCategory,
    name: 'Request Count',
    description: 'Ensure fewer than 50 HTTP requests',
    weight: 3,
  },
  {
    id: 'perf-psi-metrics',
    category: 'PERFORMANCE' as RuleCategory,
    name: 'PSI Performance Metrics',
    description: 'Analyze LCP, CLS, and INP from PageSpeed Insights',
    weight: 4,
  },

  // Local SEO (5 points total)
  {
    id: 'local-nap',
    category: 'LOCAL_SEO' as RuleCategory,
    name: 'NAP Consistency',
    description: 'Check for consistent Name, Address, Phone information',
    weight: 2,
  },
  {
    id: 'local-google-maps',
    category: 'LOCAL_SEO' as RuleCategory,
    name: 'Google Maps Embed',
    description: 'Detect embedded Google Maps on the page',
    weight: 2,
  },
  {
    id: 'local-business-profile',
    category: 'LOCAL_SEO' as RuleCategory,
    name: 'Google Business Profile',
    description: 'Check for Google Business Profile or Maps links',
    weight: 1,
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@seoaudit.com' },
    update: { passwordHash: adminPassword },
    create: {
      email: 'admin@seoaudit.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      planTier: 'AGENCY',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create test user
  const testPassword = await bcrypt.hash('password123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: { passwordHash: testPassword },
    create: {
      email: 'test@example.com',
      passwordHash: testPassword,
      role: 'USER',
      planTier: 'PRO',
    },
  });
  console.log('✅ Test user created:', testUser.email);

  // Seed rules
  for (const rule of rules) {
    await prisma.rule.upsert({
      where: { id: rule.id },
      update: {},
      create: rule,
    });
  }
  console.log(`✅ ${rules.length} rules created`);

  // Seed branding settings
  await prisma.settings.upsert({
    where: { id: 'branding' },
    update: {},
    create: {
      id: 'branding',
      appName: 'FixFirst SEO',
      primaryColor: '#06b6d4',
      accentColor: '#10b981',
      footerText: '© 2025 FixFirst SEO. Powered By Brayne Smart Solutions Corp.',
    },
  });
  console.log('✅ Branding settings initialized');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

