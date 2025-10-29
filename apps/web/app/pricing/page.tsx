'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { billingApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Check, Zap, Rocket, Crown, ArrowLeft } from 'lucide-react'

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await billingApi.getSubscription()
      return response.data
    },
  })

  const subscribeMutation = useMutation({
    mutationFn: (planTier: 'PRO' | 'ENTERPRISE') => billingApi.subscribe(planTier),
    onSuccess: (response) => {
      // Redirect to PayPal approval URL
      if (response.data.approvalUrl) {
        window.location.href = response.data.approvalUrl
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create subscription')
      setLoading(null)
    },
  })

  const handleSubscribe = (planTier: 'PRO' | 'ENTERPRISE') => {
    setLoading(planTier)
    subscribeMutation.mutate(planTier)
  }

  const currentPlan = subscription?.usage?.plan?.tier || 'FREE'

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-text-secondary">
            Scale your SEO efforts with powerful tools and unlimited potential
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* FREE Plan */}
          <PricingCard
            name="Free"
            icon={<Zap className="w-10 h-10" />}
            price={0}
            description="Perfect for getting started"
            features={[
              '1 Project',
              '10 Audits per month',
              '1 Team member',
              '10 Keywords tracking',
              'Basic analytics',
              'Email support',
            ]}
            current={currentPlan === 'FREE'}
            buttonText="Current Plan"
            buttonDisabled={true}
          />

          {/* PRO Plan */}
          <PricingCard
            name="Professional"
            icon={<Rocket className="w-10 h-10" />}
            price={29}
            description="For growing businesses"
            features={[
              '10 Projects',
              '100 Audits per month',
              '5 Team members',
              '100 Keywords tracking',
              'Advanced analytics',
              'Priority email support',
              'Custom reports',
              'API access',
            ]}
            current={currentPlan === 'PRO'}
            popular={true}
            onSubscribe={() => handleSubscribe('PRO')}
            loading={loading === 'PRO'}
            buttonText={currentPlan === 'PRO' ? 'Current Plan' : 'Upgrade to Pro'}
            buttonDisabled={currentPlan === 'PRO'}
          />

          {/* ENTERPRISE Plan */}
          <PricingCard
            name="Enterprise"
            icon={<Crown className="w-10 h-10" />}
            price={99}
            description="For large teams"
            features={[
              'Unlimited Projects',
              'Unlimited Audits',
              'Unlimited Team members',
              'Unlimited Keywords',
              'Advanced analytics',
              'Dedicated support',
              'Custom integrations',
              'White-label options',
              'SLA guarantee',
            ]}
            current={currentPlan === 'ENTERPRISE'}
            onSubscribe={() => handleSubscribe('ENTERPRISE')}
            loading={loading === 'ENTERPRISE'}
            buttonText={currentPlan === 'ENTERPRISE' ? 'Current Plan' : 'Upgrade to Enterprise'}
            buttonDisabled={currentPlan === 'ENTERPRISE'}
          />
        </div>

        {/* FAQ / Trust Section */}
        <div className="text-center">
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">All Plans Include</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <Feature text="SSL Security" />
              <Feature text="Regular updates" />
              <Feature text="Cancel anytime" />
              <Feature text="30-day money-back" />
              <Feature text="99.9% uptime SLA" />
              <Feature text="GDPR compliant" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PricingCard({
  name,
  icon,
  price,
  description,
  features,
  popular,
  current,
  onSubscribe,
  loading,
  buttonText,
  buttonDisabled,
}: any) {
  return (
    <div className={`card relative ${popular ? 'border-2 border-primary' : ''}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
          MOST POPULAR
        </div>
      )}
      
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-4">
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-2">{name}</h3>
        <p className="text-text-secondary">{description}</p>
      </div>

      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-5xl font-bold text-text-primary">${price}</span>
          <span className="text-text-secondary">/month</span>
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature: string, index: number) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span className="text-text-secondary">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSubscribe}
        disabled={buttonDisabled || loading}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
          current
            ? 'bg-background-secondary text-text-secondary cursor-not-allowed'
            : popular
            ? 'bg-primary text-white hover:bg-primary/90'
            : 'bg-background-secondary text-text-primary hover:bg-background-card'
        }`}
      >
        {loading ? 'Processing...' : buttonText}
      </button>
    </div>
  )
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check className="w-5 h-5 text-green-400" />
      <span className="text-text-secondary">{text}</span>
    </div>
  )
}

