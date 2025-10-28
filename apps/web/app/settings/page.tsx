'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { authApi, userApi } from '@/lib/api'
import { User, Shield, CreditCard, Bell, Key, LogOut, Copy, Eye, EyeOff, AlertTriangle, Send, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { useBranding } from '@/components/BrandingProvider'

export default function SettingsPage() {
  const router = useRouter()
  const branding = useBranding()
  const [activeTab, setActiveTab] = useState<'profile' | 'plan' | 'notifications' | 'security'>('profile')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
    }
  }, [router])

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await authApi.me()
      return response.data
    },
  })

  const handleLogout = () => {
    localStorage.removeItem('token')
    toast.success('Logged out successfully')
    router.push('/auth/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-background-card border-r border-border">
        <div className="p-6">
          {branding?.logoUrl ? (
            <div className="mb-8 flex items-center justify-center">
              <img 
                src={branding.logoUrl} 
                alt={branding.appName || 'FixFirst SEO'} 
                className="max-h-12 w-auto object-contain"
              />
            </div>
          ) : (
            <h1 className="text-xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {branding?.appName || 'FixFirst SEO'}
            </h1>
          )}

          <nav className="space-y-2">
            <NavItem
              icon={<User className="w-5 h-5" />}
              label="Dashboard"
              onClick={() => router.push('/dashboard')}
            />
            <NavItem
              icon={<Shield className="w-5 h-5" />}
              label="Settings"
              active
            />
            <NavItem
              icon={<LogOut className="w-5 h-5" />}
              label="Logout"
              onClick={handleLogout}
            />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
            Settings
          </h2>

          <div className="flex gap-8">
            {/* Tab Navigation */}
            <div className="w-64 flex-shrink-0">
              <div className="card p-4 space-y-2">
                <TabButton
                  active={activeTab === 'profile'}
                  onClick={() => setActiveTab('profile')}
                  icon={<User className="w-5 h-5" />}
                  label="Profile"
                />
                <TabButton
                  active={activeTab === 'plan'}
                  onClick={() => setActiveTab('plan')}
                  icon={<CreditCard className="w-5 h-5" />}
                  label="Plan & Billing"
                />
                <TabButton
                  active={activeTab === 'security'}
                  onClick={() => setActiveTab('security')}
                  icon={<Key className="w-5 h-5" />}
                  label="Security"
                />
                <TabButton
                  active={activeTab === 'notifications'}
                  onClick={() => setActiveTab('notifications')}
                  icon={<Bell className="w-5 h-5" />}
                  label="Notifications"
                />
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1">
              {activeTab === 'profile' && <ProfileTab user={user} />}
              {activeTab === 'plan' && <PlanTab user={user} />}
              {activeTab === 'security' && <SecurityTab user={user} />}
              {activeTab === 'notifications' && (
                <>
                  <NotificationsTab />
                  <SlackIntegrationSection />
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all ${
        active
          ? 'bg-primary text-white shadow-lg shadow-primary/30'
          : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}

function ProfileTab({ user }: { user: any }) {
  return (
    <div className="card space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Profile Information</h3>
        <p className="text-text-secondary text-sm">
          Update your account profile information and email address.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="input bg-background-secondary cursor-not-allowed"
          />
          <p className="text-xs text-text-secondary mt-1">
            Email address cannot be changed currently
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">User ID</label>
          <input
            type="text"
            value={user?.id || ''}
            disabled
            className="input bg-background-secondary cursor-not-allowed font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Role</label>
          <span className={`badge ${user?.role === 'ADMIN' ? 'badge-success' : 'badge-info'}`}>
            {user?.role || 'USER'}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Member Since</label>
          <p className="text-text-secondary">
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}

function PlanTab({ user }: { user: any }) {
  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => {
      const response = await userApi.getUsage()
      return response.data
    },
  })

  const planInfo = {
    FREE: {
      name: 'Free Plan',
      color: 'text-text-secondary',
      limits: '1 audit per day',
      features: ['Basic SEO analysis', '1 audit/day', 'Dashboard access'],
    },
    PRO: {
      name: 'Pro Plan',
      color: 'text-primary',
      limits: '25 audits per month',
      features: [
        'Advanced SEO analysis',
        '25 audits/month',
        'PDF export',
        'Priority support',
        'Historical data',
      ],
    },
    AGENCY: {
      name: 'Agency Plan',
      color: 'text-success',
      limits: '200 audits per month',
      features: [
        'Full SEO analysis',
        '200 audits/month',
        'PDF export',
        'White-label reports',
        'API access',
        'Priority support',
      ],
    },
  }

  const currentPlan = planInfo[user?.planTier as keyof typeof planInfo] || planInfo.FREE

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Current Plan</h3>
          <p className="text-text-secondary text-sm">
            Manage your subscription and billing information
          </p>
        </div>

        <div className="p-6 bg-background-secondary rounded-lg border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-2xl font-bold ${currentPlan.color}`}>
                {currentPlan.name}
              </h4>
              <p className="text-text-secondary text-sm mt-1">{currentPlan.limits}</p>
            </div>
            <span className="badge badge-success text-lg px-4 py-2">Active</span>
          </div>

          <div className="space-y-2 mt-6">
            <h5 className="font-semibold mb-3">Features included:</h5>
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-success">✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => toast.info('Plan upgrade coming soon!')}
            className="btn-primary"
          >
            Upgrade Plan
          </button>
          <button
            onClick={() => toast.info('Billing portal coming soon!')}
            className="btn-secondary"
          >
            Manage Billing
          </button>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Usage This Period</h3>
        {usage ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-background-secondary rounded-lg">
              <p className="text-text-secondary text-sm">Audits Used</p>
              <p className="text-2xl font-bold mt-1">{usage.auditsUsed}</p>
              <p className="text-xs text-text-secondary mt-1">of {usage.auditsLimit}</p>
            </div>
            <div className="p-4 bg-background-secondary rounded-lg">
              <p className="text-text-secondary text-sm">Remaining</p>
              <p className={`text-2xl font-bold mt-1 ${usage.auditsRemaining > 0 ? 'text-success' : 'text-error'}`}>
                {usage.auditsRemaining}
              </p>
              <p className="text-xs text-text-secondary mt-1">audits left</p>
            </div>
            <div className="p-4 bg-background-secondary rounded-lg">
              <p className="text-text-secondary text-sm">Resets In</p>
              <p className="text-2xl font-bold mt-1">{usage.daysUntilReset}</p>
              <p className="text-xs text-text-secondary mt-1">days</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-text-secondary text-sm">Loading usage...</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SecurityTab({ user }: { user: any }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')

  const { data: apiKeyStatus, refetch: refetchApiKeyStatus } = useQuery({
    queryKey: ['apiKeyStatus'],
    queryFn: async () => {
      const response = await userApi.getApiKeyStatus()
      return response.data
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: () => userApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to change password')
    },
  })

  const generateApiKeyMutation = useMutation({
    mutationFn: () => userApi.generateApiKey(),
    onSuccess: (response) => {
      setApiKey(response.data.apiKey)
      setShowApiKey(true)
      refetchApiKeyStatus()
      toast.success('API key generated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate API key')
    },
  })

  const revokeApiKeyMutation = useMutation({
    mutationFn: () => userApi.revokeApiKey(),
    onSuccess: () => {
      setApiKey('')
      setShowApiKey(false)
      refetchApiKeyStatus()
      toast.success('API key revoked successfully!')
    },
    onError: () => {
      toast.error('Failed to revoke API key')
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: () => userApi.deleteAccount(deletePassword),
    onSuccess: () => {
      toast.success('Account deleted successfully')
      localStorage.removeItem('token')
      window.location.href = '/auth/login'
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete account')
    },
  })

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    changePasswordMutation.mutate()
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    toast.success('API key copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Password</h3>
          <p className="text-text-secondary text-sm">
            Update your password to keep your account secure
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Password</label>
            <div className="relative">
              <input 
                type={showCurrentPassword ? "text" : "password"}
                className="input pr-10" 
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">New Password</label>
            <div className="relative">
              <input 
                type={showNewPassword ? "text" : "password"}
                className="input pr-10" 
                placeholder="Enter new password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Confirm New Password</label>
            <input 
              type="password" 
              className="input" 
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handlePasswordChange}
            disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">API Access</h3>
          <p className="text-text-secondary text-sm">
            Generate and manage API keys for programmatic access
          </p>
        </div>

        {showApiKey && apiKey ? (
          <div className="space-y-4">
            <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-success">Save this API key!</p>
                  <p className="text-sm text-text-secondary mt-1">
                    This is the only time you'll see this key. Store it securely.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={apiKey}
                  readOnly
                  className="input font-mono text-sm flex-1"
                />
                <button
                  onClick={copyApiKey}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowApiKey(false)}
              className="btn-secondary"
            >
              I've saved my key
            </button>
          </div>
        ) : (
          <div className="p-4 bg-background-secondary rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">API Key</p>
                {apiKeyStatus?.hasApiKey ? (
                  <p className="text-sm text-text-secondary mt-1">
                    Created {apiKeyStatus.createdAt ? new Date(apiKeyStatus.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                ) : (
                  <p className="text-sm text-text-secondary mt-1">
                    {apiKeyStatus?.canGenerate 
                      ? 'No API key generated yet'
                      : 'Available for Agency plan members'}
                  </p>
                )}
              </div>
              {apiKeyStatus?.canGenerate ? (
                <div className="flex gap-2">
                  {apiKeyStatus.hasApiKey && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to revoke your API key? This will break any integrations using it.')) {
                          revokeApiKeyMutation.mutate()
                        }
                      }}
                      disabled={revokeApiKeyMutation.isPending}
                      className="btn-secondary text-error hover:bg-error/10"
                    >
                      Revoke
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (apiKeyStatus.hasApiKey) {
                        if (confirm('Generating a new key will revoke the old one. Continue?')) {
                          generateApiKeyMutation.mutate()
                        }
                      } else {
                        generateApiKeyMutation.mutate()
                      }
                    }}
                    disabled={generateApiKeyMutation.isPending}
                    className="btn-secondary"
                  >
                    {generateApiKeyMutation.isPending ? 'Generating...' : apiKeyStatus.hasApiKey ? 'Regenerate' : 'Generate Key'}
                  </button>
                </div>
              ) : (
                <span className="badge badge-warning">Upgrade Required</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="card border-error/50">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2 text-error">Danger Zone</h3>
          <p className="text-text-secondary text-sm">
            Irreversible and destructive actions
          </p>
        </div>

        <div className="p-4 bg-error/10 rounded-lg border border-error/30">
          <div className="space-y-4">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-text-secondary mt-1">
                Permanently delete your account and all data. This action cannot be undone.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Enter your password to confirm</label>
              <input
                type="password"
                className="input"
                placeholder="Enter password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                if (confirm('Are you absolutely sure? This will permanently delete your account and all your audit data. This action cannot be undone.')) {
                  deleteAccountMutation.mutate()
                }
              }}
              disabled={deleteAccountMutation.isPending || !deletePassword}
              className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteAccountMutation.isPending ? 'Deleting Account...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const { data: preferences, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await userApi.getNotifications()
      return response.data
    },
  })

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [auditComplete, setAuditComplete] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)

  useEffect(() => {
    if (preferences) {
      setEmailNotifications(preferences.emailNotifications ?? true)
      setAuditComplete(preferences.auditComplete ?? true)
      setWeeklyReport(preferences.weeklyReport ?? false)
    }
  }, [preferences])

  const updateNotificationsMutation = useMutation({
    mutationFn: (prefs: any) => userApi.updateNotifications(prefs),
    onSuccess: () => {
      toast.success('Notification preferences saved!')
      refetch()
    },
    onError: () => {
      toast.error('Failed to save preferences')
    },
  })

  const handleSave = () => {
    updateNotificationsMutation.mutate({
      emailNotifications,
      auditComplete,
      weeklyReport,
    })
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Notification Preferences</h3>
        <p className="text-text-secondary text-sm">
          Choose how you want to be notified about your audits
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-text-secondary mt-1">
              Receive email updates about your audits
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-background-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
          <div>
            <p className="font-medium">Audit Completed</p>
            <p className="text-sm text-text-secondary mt-1">
              Get notified when an audit finishes
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={auditComplete}
              onChange={(e) => setAuditComplete(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-background-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
          <div>
            <p className="font-medium">Weekly Report</p>
            <p className="text-sm text-text-secondary mt-1">
              Receive a weekly summary of your audits
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={weeklyReport}
              onChange={(e) => setWeeklyReport(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-background-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <button
          onClick={handleSave}
          disabled={updateNotificationsMutation.isPending}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateNotificationsMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

// Slack Integration Tab Component (to be added to NotificationsTab)
function SlackIntegrationSection() {
  const [slackWebhook, setSlackWebhook] = useState('')
  const [showSlackInput, setShowSlackInput] = useState(false)

  const { data: slackStatus, refetch: refetchSlack } = useQuery({
    queryKey: ['slack-status'],
    queryFn: async () => {
      const response = await userApi.getSlackStatus()
      return response.data
    },
  })

  const updateSlackMutation = useMutation({
    mutationFn: (webhook: string) => userApi.updateSlackWebhook(webhook),
    onSuccess: () => {
      toast.success('Slack webhook saved!')
      refetchSlack()
      setShowSlackInput(false)
      setSlackWebhook('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save Slack webhook')
    },
  })

  const testSlackMutation = useMutation({
    mutationFn: () => userApi.testSlackWebhook(),
    onSuccess: () => {
      toast.success('Test notification sent to Slack!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send test notification')
    },
  })

  const handleSlackSave = () => {
    if (slackWebhook && !slackWebhook.includes('hooks.slack.com')) {
      toast.error('Please enter a valid Slack webhook URL')
      return
    }
    updateSlackMutation.mutate(slackWebhook)
  }

  const handleRemoveSlack = () => {
    if (confirm('Are you sure you want to remove Slack integration?')) {
      updateSlackMutation.mutate('')
    }
  }

  return (
    <div className="card mt-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Send className="w-5 h-5" />
          Slack Integration
        </h3>
        <p className="text-text-secondary text-sm">
          Receive audit notifications in your Slack workspace
        </p>
      </div>

      {slackStatus?.configured ? (
        <div className="space-y-4">
          <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-success flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  Slack Connected
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  Notifications are being sent to your Slack workspace
                </p>
              </div>
              <button
                onClick={() => testSlackMutation.mutate()}
                disabled={testSlackMutation.isPending}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {testSlackMutation.isPending ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowSlackInput(true)}
              className="btn-secondary"
            >
              Update Webhook
            </button>
            <button
              onClick={handleRemoveSlack}
              disabled={updateSlackMutation.isPending}
              className="btn-secondary text-error hover:bg-error/10"
            >
              Remove Integration
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-background-secondary rounded-lg border border-border">
            <p className="text-sm text-text-secondary mb-3">
              Connect your Slack workspace to receive real-time notifications when audits complete or fail.
            </p>
            <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
              <li>
                Go to{' '}
                <a
                  href="https://api.slack.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Slack API
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Create a new app or select an existing one</li>
              <li>Enable Incoming Webhooks and create a new webhook URL</li>
              <li>Copy the webhook URL and paste it below</li>
            </ol>
          </div>

          <button
            onClick={() => setShowSlackInput(true)}
            className="btn-primary"
          >
            Connect Slack
          </button>
        </div>
      )}

      {showSlackInput && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Slack Webhook URL</label>
            <input
              type="url"
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="input font-mono text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSlackSave}
              disabled={!slackWebhook || updateSlackMutation.isPending}
              className="btn-primary disabled:opacity-50"
            >
              {updateSlackMutation.isPending ? 'Saving...' : 'Save Webhook'}
            </button>
            <button
              onClick={() => {
                setShowSlackInput(false)
                setSlackWebhook('')
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
