import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize OpenAI client (will be null if API key not provided)
let openai: OpenAI | null = null;
let apiKeySource: 'env' | 'database' | null = null;

// Function to get OpenAI API key from environment or database
async function getOpenAIKey(): Promise<string | null> {
  // First, check environment variable
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // If not in env, check database
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'OPENAI_API_KEY' },
      select: { value: true },
    });
    
    if (setting?.value) {
      return setting.value;
    }
  } catch (error) {
    console.error('Error fetching OpenAI key from database:', error);
  }

  return null;
}

// Initialize OpenAI client
async function initializeOpenAI() {
  try {
    const apiKey = await getOpenAIKey();
    
    if (apiKey) {
      openai = new OpenAI({ apiKey });
      apiKeySource = process.env.OPENAI_API_KEY ? 'env' : 'database';
      console.log(`✅ OpenAI service initialized (key from ${apiKeySource})`);
    } else {
      console.log('⚠️  OpenAI API key not provided. AI recommendations will use fallback mode.');
    }
  } catch (error) {
    console.error('Failed to initialize OpenAI:', error);
  }
}

// Initialize on module load
initializeOpenAI();

// Function to reinitialize OpenAI (called when settings are updated)
export async function reinitializeOpenAI() {
  console.log('🔄 Reinitializing OpenAI service...');
  await initializeOpenAI();
}

interface Issue {
  severity: string;
  message: string;
  recommendation: string;
  rule: {
    name: string;
    category: string;
    description: string;
  };
  metadata?: any;
}

interface AIRecommendation {
  title: string;
  description: string;
  detailedAnalysis: string;
  stepByStepSolution: string;
  impactExplanation: string;
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedValue: number;
  codeExamples?: string;
}

/**
 * Generate AI-powered recommendations from audit issues
 */
export async function generateAIRecommendations(
  issues: Issue[],
  websiteUrl: string
): Promise<AIRecommendation[]> {
  // If OpenAI is not available, use fallback
  if (!openai) {
    console.log('⚠️  Using fallback recommendations (OpenAI not configured)');
    return generateFallbackRecommendations(issues);
  }

  try {
    // Group issues by rule to avoid duplicates and save API costs
    const uniqueIssues = issues.reduce((acc, issue) => {
      const key = issue.rule.name;
      if (!acc[key]) {
        acc[key] = issue;
      }
      return acc;
    }, {} as Record<string, Issue>);

    const issuesArray = Object.values(uniqueIssues);
    
    // Process in batches to avoid token limits
    const batchSize = 5;
    const recommendations: AIRecommendation[] = [];

    for (let i = 0; i < issuesArray.length; i += batchSize) {
      const batch = issuesArray.slice(i, i + batchSize);
      const batchRecs = await generateBatchRecommendations(batch, websiteUrl);
      recommendations.push(...batchRecs);
    }

    console.log(`✅ Generated ${recommendations.length} AI recommendations`);
    return recommendations;
  } catch (error: any) {
    console.error('Error generating AI recommendations:', error.message);
    console.log('⚠️  Falling back to basic recommendations');
    return generateFallbackRecommendations(issues);
  }
}

/**
 * Generate recommendations for a batch of issues
 */
async function generateBatchRecommendations(
  issues: Issue[],
  websiteUrl: string
): Promise<AIRecommendation[]> {
  const prompt = buildPrompt(issues, websiteUrl);

  try {
    const completion = await openai!.chat.completions.create({
      model: 'gpt-3.5-turbo', // Using 3.5 for cost efficiency
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO consultant and web developer. Your job is to analyze website SEO issues and provide detailed, actionable recommendations. Always include specific code examples and step-by-step solutions.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);
    return parsed.recommendations || [];
  } catch (error: any) {
    console.error('Error in batch generation:', error.message);
    // Fallback for this batch
    return issues.map(issue => createFallbackRecommendation(issue));
  }
}

/**
 * Build prompt for OpenAI
 */
function buildPrompt(issues: Issue[], websiteUrl: string): string {
  const issuesText = issues
    .map(
      (issue, index) => `
${index + 1}. Issue: ${issue.rule.name}
   Severity: ${issue.severity}
   Category: ${issue.rule.category}
   Message: ${issue.message}
   Current Recommendation: ${issue.recommendation}
`
    )
    .join('\n');

  return `
Analyze the following SEO issues for the website: ${websiteUrl}

${issuesText}

For each issue, provide a detailed recommendation in the following JSON format:
{
  "recommendations": [
    {
      "title": "Clear, actionable title",
      "description": "Brief 2-3 sentence description of the problem",
      "detailedAnalysis": "Detailed explanation of WHY this is a problem and its impact on SEO",
      "stepByStepSolution": "Numbered steps to fix the issue with specific instructions",
      "impactExplanation": "Clear explanation of the positive impact after fixing",
      "effort": "LOW | MEDIUM | HIGH",
      "estimatedValue": 0-100 (how valuable this fix is),
      "codeExamples": "Specific code examples (if applicable)"
    }
  ]
}

Important:
- Be specific and actionable
- Include code examples where relevant (HTML, CSS, JS, server config)
- Explain the impact in terms of SEO rankings, user experience, and conversions
- Make effort estimates realistic
- Provide value scores based on impact vs effort
- Keep solutions practical and implementable

Return ONLY the JSON object, no additional text.
`;
}

/**
 * Fallback recommendations when OpenAI is unavailable
 */
function generateFallbackRecommendations(issues: Issue[]): AIRecommendation[] {
  // Group by rule to avoid duplicates
  const uniqueIssues = issues.reduce((acc, issue) => {
    const key = issue.rule.name;
    if (!acc[key]) {
      acc[key] = issue;
    }
    return acc;
  }, {} as Record<string, Issue>);

  return Object.values(uniqueIssues).map(issue => createFallbackRecommendation(issue));
}

/**
 * Create a basic recommendation without AI
 */
function createFallbackRecommendation(issue: Issue): AIRecommendation {
  const templates = getRecommendationTemplates();
  const template = templates[issue.rule.name] || templates['default'];

  return {
    title: issue.rule.name,
    description: issue.message,
    detailedAnalysis: template.analysis || issue.recommendation || 'This issue affects your website\'s SEO performance.',
    stepByStepSolution: template.solution || 'Please review the issue and implement the recommended fixes.',
    impactExplanation: template.impact || 'Fixing this will improve your SEO score and search engine rankings.',
    effort: estimateEffort(issue.severity),
    estimatedValue: estimateValue(issue.severity),
    codeExamples: template.codeExample,
  };
}

/**
 * Estimate effort based on severity
 */
function estimateEffort(severity: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  switch (severity) {
    case 'CRITICAL':
      return 'MEDIUM';
    case 'WARNING':
      return 'LOW';
    case 'INFO':
      return 'LOW';
    default:
      return 'MEDIUM';
  }
}

/**
 * Estimate value based on severity
 */
function estimateValue(severity: string): number {
  switch (severity) {
    case 'CRITICAL':
      return 95;
    case 'WARNING':
      return 70;
    case 'INFO':
      return 50;
    default:
      return 60;
  }
}

/**
 * Recommendation templates for common issues
 */
function getRecommendationTemplates(): Record<string, any> {
  return {
    'Security Headers': {
      analysis: `Your website is missing critical HTTP security headers that protect against common web vulnerabilities. These headers are essential for:
      
- **HSTS (HTTP Strict Transport Security)**: Prevents protocol downgrade attacks and ensures all connections use HTTPS
- **Content-Security-Policy (CSP)**: Protects against Cross-Site Scripting (XSS) and data injection attacks
- **X-Frame-Options**: Prevents clickjacking attacks by controlling if your site can be embedded in iframes
- **X-Content-Type-Options**: Prevents MIME-sniffing attacks
- **Referrer-Policy**: Controls how much referrer information is shared

Search engines like Google consider security an important ranking factor. Missing these headers can negatively impact your SEO and user trust.`,
      solution: `Follow these steps to implement security headers:

1. **For Nginx servers**, add to your server configuration:
   
2. **For Apache servers**, add to your .htaccess:

3. **For Node.js/Express applications**, use the helmet middleware:
   - Run: npm install helmet
   - Add to your server: app.use(helmet())

4. **Test your implementation**:
   - Visit: https://securityheaders.com
   - Enter your domain and verify all headers are present
   - Aim for an A+ rating

5. **Monitor regularly**: Set up automated checks to ensure headers remain configured`,
      impact: `After implementing security headers, you will:

✅ **Improve SEO Rankings**: Google rewards secure websites with better rankings
✅ **Increase User Trust**: Browsers will mark your site as secure
✅ **Protect User Data**: Prevent common attacks like XSS, clickjacking, and MITM
✅ **Pass Security Audits**: Meet industry security standards
✅ **Reduce Bounce Rate**: Users feel safer and stay longer on secure sites`,
      codeExample: `// Nginx Configuration
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

// Node.js/Express with Helmet
const helmet = require('helmet');
app.use(helmet());

// Custom CSP configuration
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'", "https://trusted-cdn.com"],
    imgSrc: ["'self'", "data:", "https:"],
  }
}));`,
    },
    'Meta Description': {
      analysis: `Meta descriptions are crucial for SEO as they appear in search engine results pages (SERPs) and significantly impact click-through rates. A missing or poor meta description means:

- Search engines may generate one automatically (often poorly)
- Lower click-through rates from search results
- Missed opportunity to showcase your unique value proposition
- Reduced relevance signals to search engines

Meta descriptions should be 150-160 characters, compelling, and include your target keywords naturally.`,
      solution: `1. **Add meta description tags to every page**:
   - Place in the <head> section of your HTML
   - Keep it between 150-160 characters
   - Include target keywords naturally
   
2. **Write compelling copy that**:
   - Clearly describes the page content
   - Includes a call-to-action
   - Highlights unique value
   - Uses active voice

3. **Make each description unique** across all pages

4. **Test and optimize**:
   - Monitor click-through rates in Google Search Console
   - A/B test different descriptions
   - Update based on performance`,
      impact: `Proper meta descriptions lead to:

✅ **Higher CTR**: 5-15% improvement in click-through rates from search results
✅ **Better Rankings**: Improved engagement signals to search engines
✅ **More Qualified Traffic**: Clearer expectations lead to lower bounce rates
✅ **Improved Brand Perception**: Professional, compelling descriptions build trust`,
      codeExample: `<!-- Good Meta Description -->
<meta name="description" content="Get professional SEO audits that identify and fix critical issues. Improve your rankings with actionable recommendations and detailed reports. Start your free audit today!">

<!-- React/Next.js -->
<Head>
  <meta name="description" content="Your compelling description here..." />
</Head>

<!-- Dynamic meta descriptions in Node.js -->
app.get('/product/:id', (req, res) => {
  const product = getProduct(req.params.id);
  res.render('product', {
    metaDescription: \`Buy \${product.name} - \${product.shortDescription}. Free shipping on orders over $50.\`
  });
});`,
    },
    default: {
      analysis: 'This issue may impact your website\'s SEO performance and user experience. Addressing it will help improve your search engine rankings.',
      solution: '1. Review the specific issue identified\n2. Consult relevant documentation\n3. Implement the recommended changes\n4. Test thoroughly\n5. Monitor the results',
      impact: 'Fixing this issue will contribute to better SEO performance, improved user experience, and potentially higher search engine rankings.',
    },
  };
}

export default {
  generateAIRecommendations,
};

