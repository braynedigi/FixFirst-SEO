'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auditsApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Search, Zap, LineChart, Shield, CheckCircle } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url) {
      toast.error('Please enter a URL')
      return
    }

    setLoading(true)
    try {
      const response = await auditsApi.create({ url })
      toast.success('Audit started!')
      router.push(`/audit/${response.data.auditId}`)
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Please log in to run an audit')
        router.push('/auth/login')
      } else {
        toast.error(error.response?.data?.error || 'Failed to start audit')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary via-accent to-success rounded-lg flex items-center justify-center shadow-lg shadow-primary/50">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">FixFirst SEO</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => router.push('/auth/login')}
              className="btn-secondary"
            >
              Log In
            </button>
            <button
              onClick={() => router.push('/auth/register')}
              className="btn-primary"
            >
              Sign Up
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6">
        <div className="py-20 text-center">
          <div className="inline-block mb-4">
            <span className="badge badge-info text-sm px-4 py-2">
              ⚡ Comprehensive SEO Analysis
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
            Optimize Your Website's SEO
          </h1>
          
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-12">
            Get a detailed SEO audit in minutes. Analyze technical SEO, on-page optimization, performance, structured data, and more.
          </p>

          {/* URL Input */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-16">
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="input flex-1"
                disabled={loading}
              />
              <button
                type="submit"
                className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  'Start Free Audit'
                )}
              </button>
            </div>
          </form>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Technical SEO"
              description="HTTPS, canonical tags, robots.txt, sitemaps, and more"
              score="35"
            />
            <FeatureCard
              icon={<CheckCircle className="w-6 h-6" />}
              title="On-Page Analysis"
              description="Title tags, meta descriptions, heading structure, content quality"
              score="25"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Performance"
              description="Page speed, Core Web Vitals, load times, optimization tips"
              score="15"
            />
            <FeatureCard
              icon={<LineChart className="w-6 h-6" />}
              title="Structured Data"
              description="JSON-LD validation, schema markup, rich results eligibility"
              score="20"
            />
          </div>
        </div>

        {/* Comprehensive Audit Categories */}
        <div className="py-20 bg-background-secondary">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">28+ SEO Checks Across 5 Categories</h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Get a complete picture of your website's SEO health with our comprehensive audit engine
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <CategoryDetail
                title="Technical SEO"
                score="35 points"
                icon={<Shield className="w-8 h-8" />}
                checks={[
                  'HTTP Status Code Validation',
                  'HTTPS Security Enforcement',
                  'Canonical Tag Implementation',
                  'Robots.txt Configuration',
                  'XML Sitemap Detection',
                  'Security Headers (HSTS, CSP, X-Frame-Options)',
                  'Mobile-Friendly Viewport',
                ]}
              />
              <CategoryDetail
                title="On-Page Optimization"
                score="25 points"
                icon={<CheckCircle className="w-8 h-8" />}
                checks={[
                  'Title Tag Length & Quality (30-60 chars)',
                  'Meta Description Optimization (120-160 chars)',
                  'H1 Tag Presence & Uniqueness',
                  'Content Word Count (300+ words)',
                  'Image Alt Text Coverage',
                  'Open Graph & Twitter Card Tags',
                  'Internal & External Link Analysis',
                ]}
              />
              <CategoryDetail
                title="Structured Data"
                score="20 points"
                icon={<LineChart className="w-8 h-8" />}
                checks={[
                  'JSON-LD Detection & Validation',
                  'Organization Schema',
                  'Product Schema',
                  'Article/BlogPosting Schema',
                  'LocalBusiness Schema',
                ]}
              />
              <CategoryDetail
                title="Performance & Speed"
                score="15 points"
                icon={<Zap className="w-8 h-8" />}
                checks={[
                  'Page Load Time (<3 seconds)',
                  'Page Size Optimization (<2MB)',
                  'HTTP Request Count (<50)',
                  'Resource Loading Analysis',
                ]}
              />
            </div>

            <div className="mt-8 text-center">
              <div className="card inline-block">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-primary">100</div>
                  <div className="text-left">
                    <div className="font-semibold">Total Score</div>
                    <div className="text-sm text-text-secondary">
                      Get graded from A to F based on your overall performance
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">Why Choose FixFirst SEO?</h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Professional-grade SEO analysis with actionable insights
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <BenefitCard
                icon="🚀"
                title="Fast & Accurate"
                description="Get comprehensive results in under 2 minutes. Our crawler analyzes up to 25 pages simultaneously."
              />
              <BenefitCard
                icon="📊"
                title="Actionable Insights"
                description="Every issue comes with a 'How to Fix' recommendation. No guesswork, just clear action steps."
              />
              <BenefitCard
                icon="🎯"
                title="Real-Time Tracking"
                description="Watch your audit progress live. See exactly what's being checked and when."
              />
              <BenefitCard
                icon="🔒"
                title="Secure & Private"
                description="Your data is encrypted and secure. We never share your audit results with third parties."
              />
              <BenefitCard
                icon="💡"
                title="SEO Best Practices"
                description="Built on industry standards and Google's own recommendations for optimal search performance."
              />
              <BenefitCard
                icon="📈"
                title="Track Progress"
                description="Compare audits over time. See how your improvements impact your SEO score."
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-20 bg-background-secondary">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <StatCard number="28+" label="SEO Checks" />
              <StatCard number="25" label="Pages Crawled" />
              <StatCard number="<2min" label="Average Audit Time" />
              <StatCard number="100%" label="Accuracy" />
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">Choose Your Plan</h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Start free and upgrade as your needs grow
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <PricingCard
                name="Free"
                price="$0"
                period="forever"
                features={[
                  '1 audit per day',
                  'All 28 SEO checks',
                  'Detailed reports',
                  'Issue recommendations',
                  'Basic support',
                ]}
                cta="Get Started"
                popular={false}
              />
              <PricingCard
                name="Pro"
                price="$29"
                period="per month"
                features={[
                  '25 audits per month',
                  'All 28 SEO checks',
                  'PDF export',
                  'Priority support',
                  'Audit history',
                  'Compare audits',
                ]}
                cta="Start Pro Trial"
                popular={true}
              />
              <PricingCard
                name="Agency"
                price="$99"
                period="per month"
                features={[
                  '200 audits per month',
                  'White-label reports',
                  'API access',
                  'Dedicated support',
                  'Team collaboration',
                  'Custom branding',
                ]}
                cta="Contact Sales"
                popular={false}
              />
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="py-20 bg-background-secondary">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Step
                number="1"
                title="Enter URL"
                description="Simply paste your website URL and click 'Start Audit'"
              />
              <Step
                number="2"
                title="Analysis"
                description="Our engine crawls your site and runs 28+ SEO checks"
              />
              <Step
                number="3"
                title="Get Results"
                description="Receive a detailed report with actionable recommendations"
              />
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">Frequently Asked Questions</h2>
              <p className="text-text-secondary">
                Everything you need to know about FixFirst SEO
              </p>
            </div>

            <div className="space-y-4">
              <FAQItem
                question="How long does an audit take?"
                answer="Most audits complete in under 2 minutes. The exact time depends on your website size and the number of pages crawled (up to 25 pages)."
              />
              <FAQItem
                question="What SEO factors do you check?"
                answer="We perform 28+ checks across 5 categories: Technical SEO (35 points), On-Page Optimization (25 points), Structured Data (20 points), Performance (15 points), and Local SEO (5 points). This includes everything from HTTPS security to meta tags, page speed, schema markup, and more."
              />
              <FAQItem
                question="Do I need to install anything?"
                answer="No installation required! FixFirst SEO is a web-based tool. Simply enter your URL and get instant results in your browser."
              />
              <FAQItem
                question="Can I audit any website?"
                answer="Yes! You can audit any publicly accessible website. Enter the URL and we'll crawl it to generate a comprehensive SEO report."
              />
              <FAQItem
                question="How is the score calculated?"
                answer="Your score is based on weighted categories totaling 100 points. Each check has a specific point value. The final score determines your grade from A (90-100) to F (below 60)."
              />
              <FAQItem
                question="What's the difference between plans?"
                answer="Free: 1 audit/day. Pro ($29/mo): 25 audits/month + PDF export + audit history. Agency ($99/mo): 200 audits/month + white-label reports + API access + team features."
              />
              <FAQItem
                question="Can I export my audit results?"
                answer="Yes! Pro and Agency plans include PDF export. You can download detailed reports with your branding (Agency plan) and share them with clients or stakeholders."
              />
              <FAQItem
                question="Do you store my website data?"
                answer="We only store audit results and metadata. We don't store full HTML content beyond what's needed for the audit. All data is encrypted and secure."
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
              Ready to Improve Your SEO?
            </h2>
            <p className="text-xl text-text-secondary mb-8">
              Join thousands of website owners who trust FixFirst SEO for their optimization needs
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push('/auth/register')}
                className="btn-primary text-lg px-8 py-3"
              >
                Start Free Audit
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="btn-secondary text-lg px-8 py-3"
              >
                Log In
              </button>
            </div>
            <p className="text-sm text-text-secondary mt-6">
              No credit card required • Full access to all 28 checks • Results in under 2 minutes
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-text-secondary">
          <p>© 2025 SEO Audit Tool. Powered By Brayne Smart Solutions Corp.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  score,
}: {
  icon: React.ReactNode
  title: string
  description: string
  score?: string
}) {
  return (
    <div className="card hover:border-primary/50 transition-all relative">
      {score && (
        <div className="absolute top-4 right-4 text-xs font-bold text-primary bg-gradient-to-r from-primary/20 to-accent/20 px-2 py-1 rounded border border-primary/30">
          {score} pts
        </div>
      )}
      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 via-accent/20 to-success/20 rounded-lg flex items-center justify-center mb-4 mx-auto text-primary border border-primary/30 shadow-lg shadow-primary/20">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  )
}

function CategoryDetail({
  title,
  score,
  icon,
  checks,
}: {
  title: string
  score: string
  icon: React.ReactNode
  checks: string[]
}) {
  return (
    <div className="card">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 via-accent/20 to-success/20 rounded-lg flex items-center justify-center text-primary flex-shrink-0 border border-primary/30 shadow-lg shadow-primary/20">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold mb-1">{title}</h3>
          <p className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-semibold">{score}</p>
        </div>
      </div>
      <ul className="space-y-3">
        {checks.map((check, index) => (
          <li key={index} className="flex items-start gap-3 text-sm">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span className="text-text-secondary">{check}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="card text-center hover:border-primary/50 transition-all border-primary/20">
      <div className="text-4xl mb-4 drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">{icon}</div>
      <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="card border-primary/30">
      <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">{number}</div>
      <div className="text-text-secondary">{label}</div>
    </div>
  )
}

function PricingCard({
  name,
  price,
  period,
  features,
  cta,
  popular,
}: {
  name: string
  price: string
  period: string
  features: string[]
  cta: string
  popular: boolean
}) {
  return (
    <div className={`card relative ${popular ? 'border-primary shadow-lg shadow-primary/30' : ''}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-primary via-accent to-success text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg shadow-primary/50">
            Most Popular
          </span>
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{name}</h3>
        <div className="flex items-baseline justify-center gap-1 mb-2">
          <span className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{price}</span>
          <span className="text-text-secondary text-sm">/{period}</span>
        </div>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-sm">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button className={`w-full ${popular ? 'btn-primary' : 'btn-secondary'}`}>
        {cta}
      </button>
    </div>
  )
}

function Step({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-gradient-to-br from-primary via-accent to-success rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 mx-auto shadow-lg shadow-primary/50 border border-primary/30">
        {number}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="font-semibold pr-8">{question}</h3>
        <div className={`text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-border text-text-secondary animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  )
}

