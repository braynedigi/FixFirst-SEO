'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, CreditCard, Download, AlertCircle, CheckCircle, 
  TrendingUp, Users, BarChart3, Search, Calendar 
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // Handle PayPal return
  useEffect(() => {
    const subscriptionId = searchParams?.get('subscription_id')
    const token = searchParams?.get('token')
    
    if (subscriptionId || token) {
      const actualId = subscriptionId || token
      if (actualId) {
        activateMutation.mutate(actualId)
      }
    }
  }, [searchParams])

  // Fetch subscription data
  const { data, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await billingApi.getSubscription()
      return response.data
    },
  })

  // Fetch invoices
  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await billingApi.getInvoices()
      return response.data
    },
  })

  // Activate subscription mutation
  const activateMutation = useMutation({
    mutationFn: (subscriptionId: string) => billingApi.activate(subscriptionId),
    onSuccess: () => {
      toast.success('Subscription activated successfully! 🎉')
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      // Clean up URL
      router.replace('/billing')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to activate subscription')
    },
  })

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: () => billingApi.cancel(),
    onSuccess: () => {
      toast.success('Subscription cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel subscription')
    },
  })

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel your subscription? You will be downgraded to the FREE plan.')) {
      cancelMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const subscription = data?.subscription
  const usage = data?.usage

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-text-primary">Billing & Usage</h1>
          </div>
          <button
            onClick={() => router.push('/pricing')}
            className="btn-primary"
          >
            Upgrade Plan
          </button>
        </div>

        {/* Current Plan Card */}
        <div className="card mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">
                  {usage?.plan?.name || 'Free'} Plan
                </h2>
                <p className="text-text-secondary">
                  ${usage?.plan?.price || 0}/month
                </p>
              </div>
            </div>
            
            {subscription?.status === 'ACTIVE' && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Active</span>
              </div>
            )}
          </div>

          {subscription?.status === 'ACTIVE' && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="btn-secondary text-red-400 hover:bg-red-500/10"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          )}
        </div>

        {/* Usage Statistics */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Usage This Month</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <UsageCard
              icon={<BarChart3 className="w-6 h-6" />}
              label="Projects"
              current={usage?.current?.projects || 0}
              limit={usage?.limits?.projects || 0}
            />
            <UsageCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Audits"
              current={usage?.current?.audits || 0}
              limit={usage?.limits?.auditsPerMonth || 0}
            />
            <UsageCard
              icon={<Users className="w-6 h-6" />}
              label="Team Members"
              current={usage?.current?.teamMembers || 0}
              limit={usage?.limits?.teamMembers || 0}
            />
            <UsageCard
              icon={<Search className="w-6 h-6" />}
              label="Keywords"
              current={usage?.current?.keywords || 0}
              limit={usage?.limits?.keywords || 0}
            />
          </div>
        </div>

        {/* Upgrade Notice */}
        {usage?.plan?.tier === 'FREE' && (
          <div className="card border-2 border-primary/20 bg-primary/5 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-text-primary mb-2">Upgrade to unlock more features</h3>
                <p className="text-text-secondary mb-4">
                  Get unlimited audits, team collaboration, and advanced analytics with our Pro plan.
                </p>
                <button
                  onClick={() => router.push('/pricing')}
                  className="btn-primary"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice History */}
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Invoice History</h2>
          {invoices && invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Description</th>
                    <th className="text-center py-3 px-4 text-text-secondary font-medium">Amount</th>
                    <th className="text-center py-3 px-4 text-text-secondary font-medium">Status</th>
                    <th className="text-center py-3 px-4 text-text-secondary font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice: any) => (
                    <tr key={invoice.id} className="border-b border-border hover:bg-background-secondary transition-colors">
                      <td className="py-3 px-4 text-text-secondary">
                        {formatDateTime(invoice.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-text-primary">
                        {invoice.description || 'Subscription payment'}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-text-primary">
                        ${invoice.amount.toFixed(2)} {invoice.currency}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {invoice.invoiceUrl && (
                          <a
                            href={invoice.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:underline"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No invoices yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function UsageCard({ icon, label, current, limit }: any) {
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100)
  const color = percentage >= 90 ? 'bg-red-400' : percentage >= 70 ? 'bg-orange-400' : 'bg-green-400'

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-primary">{icon}</div>
        <span className="text-text-secondary font-medium">{label}</span>
      </div>
      <div className="mb-2">
        <p className="text-2xl font-bold text-text-primary">
          {current} {isUnlimited ? '' : `/ ${limit}`}
        </p>
        {!isUnlimited && (
          <p className="text-sm text-text-secondary">{percentage.toFixed(0)}% used</p>
        )}
      </div>
      {!isUnlimited && (
        <div className="w-full bg-background-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <p className="text-sm text-green-400">Unlimited</p>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    PAID: 'bg-green-500/20 text-green-400',
    PENDING: 'bg-orange-500/20 text-orange-400',
    FAILED: 'bg-red-500/20 text-red-400',
    CANCELLED: 'bg-gray-500/20 text-gray-400',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || colors.PENDING}`}>
      {status}
    </span>
  )
}

