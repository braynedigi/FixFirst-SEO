'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Users, Shield, BarChart3, Settings as SettingsIcon, LogOut, Home, ArrowLeft, Mail, Send, Palette, FileText, Edit2, Save, X, RotateCcw, Eye } from 'lucide-react'
import { useBranding } from '@/components/BrandingProvider'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type TabType = 'rules' | 'users' | 'stats' | 'email' | 'branding' | 'settings' | 'templates'

export default function AdminPage() {
  const router = useRouter()
  const branding = useBranding()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('stats')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'ADMIN') {
      toast.error('Access denied. Admin role required.')
      router.push('/dashboard')
      return
    }

    setUser(parsedUser)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out')
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
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
          
          <div className="mb-4 pb-4 border-b border-border">
            <p className="text-xs text-text-secondary mb-1">Signed in as</p>
            <p className="text-sm font-medium">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-error/20 text-error text-xs rounded border border-error/30">
              ADMIN
            </span>
          </div>
          
          <nav className="space-y-2">
            <NavItem 
              icon={<Home />} 
              label="Dashboard" 
              onClick={() => router.push('/dashboard')} 
            />
            <NavItem 
              icon={<Shield />} 
              label="Admin Panel" 
              active 
            />
          </nav>

          <button
            onClick={handleLogout}
            className="mt-8 flex items-center gap-2 text-text-secondary hover:text-text-primary w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
                Admin Panel
              </h2>
              <p className="text-text-secondary">Manage system settings, rules, and users</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border">
            <TabButton
              icon={<BarChart3 />}
              label="System Stats"
              active={activeTab === 'stats'}
              onClick={() => setActiveTab('stats')}
            />
            <TabButton
              icon={<SettingsIcon />}
              label="Audit Rules"
              active={activeTab === 'rules'}
              onClick={() => setActiveTab('rules')}
            />
            <TabButton
              icon={<Users />}
              label="Users"
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
            />
            <TabButton
              icon={<Mail />}
              label="Email Settings"
              active={activeTab === 'email'}
              onClick={() => setActiveTab('email')}
            />
            <TabButton
              icon={<Palette />}
              label="Branding"
              active={activeTab === 'branding'}
              onClick={() => setActiveTab('branding')}
            />
            <TabButton
              icon={<SettingsIcon />}
              label="API Settings"
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
            <TabButton
              icon={<FileText />}
              label="Email Templates"
              active={activeTab === 'templates'}
              onClick={() => setActiveTab('templates')}
            />
          </div>

          {/* Tab Content */}
          {activeTab === 'stats' && <SystemStatsTab />}
          {activeTab === 'rules' && <RulesTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'email' && <EmailSettingsTab />}
          {activeTab === 'branding' && <BrandingTab />}
          {activeTab === 'settings' && <APISettingsTab />}
          {activeTab === 'templates' && <EmailTemplatesTab />}
        </div>
      </main>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active = false,
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
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
        active
          ? 'bg-primary/10 text-primary border border-primary/30'
          : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  )
}

function TabButton({
  icon,
  label,
  active = false,
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
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-text-secondary hover:text-text-primary'
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  )
}

function SystemStatsTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    },
  })

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Total Users"
        value={stats?.totalUsers || 0}
        icon={<Users className="w-8 h-8 text-primary" />}
      />
      <StatCard
        title="Total Projects"
        value={stats?.totalProjects || 0}
        icon={<BarChart3 className="w-8 h-8 text-accent" />}
      />
      <StatCard
        title="Total Audits"
        value={stats?.totalAudits || 0}
        icon={<Shield className="w-8 h-8 text-success" />}
      />
      <StatCard
        title="Completed Audits"
        value={stats?.completedAudits || 0}
        subtitle={`${Math.round(((stats?.completedAudits || 0) / (stats?.totalAudits || 1)) * 100)}% success rate`}
        icon={<span className="text-3xl">✅</span>}
      />
      <StatCard
        title="Failed Audits"
        value={stats?.failedAudits || 0}
        subtitle={`${Math.round(((stats?.failedAudits || 0) / (stats?.totalAudits || 1)) * 100)}% failure rate`}
        icon={<span className="text-3xl">❌</span>}
      />
      <StatCard
        title="System Status"
        value="Online"
        subtitle="All services operational"
        icon={<span className="text-3xl">🟢</span>}
      />
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-text-secondary mb-1">{title}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {value}
          </p>
          {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
        </div>
        <div className="drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">{icon}</div>
      </div>
    </div>
  )
}

function RulesTab() {
  const queryClient = useQueryClient()
  
  const { data: rules, isLoading } = useQuery({
    queryKey: ['admin-rules'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/admin/rules`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    },
  })

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = localStorage.getItem('token')
      const response = await axios.patch(`${API_URL}/api/admin/rules/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] })
      toast.success('Rule updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update rule')
    },
  })

  if (isLoading) {
    return <LoadingState />
  }

  const categories = {
    TECHNICAL: 'Technical & Indexing',
    ONPAGE: 'On-Page Optimization',
    STRUCTURED_DATA: 'Structured Data',
    PERFORMANCE: 'Performance',
    LOCAL_SEO: 'Local SEO',
  }

  const groupedRules = rules?.reduce((acc: any, rule: any) => {
    if (!acc[rule.category]) {
      acc[rule.category] = []
    }
    acc[rule.category].push(rule)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      {Object.entries(categories).map(([key, label]) => (
        <div key={key}>
          <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {label}
          </h3>
          <div className="grid gap-4">
            {groupedRules?.[key]?.map((rule: any) => (
              <RuleCard key={rule.id} rule={rule} onUpdate={updateRuleMutation.mutate} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RuleCard({ rule, onUpdate }: { rule: any; onUpdate: (data: any) => void }) {
  const [isActive, setIsActive] = useState(rule.isActive)
  const [weight, setWeight] = useState(rule.weight)

  const handleToggle = () => {
    const newValue = !isActive
    setIsActive(newValue)
    onUpdate({ id: rule.id, data: { isActive: newValue } })
  }

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    setWeight(newValue)
  }

  const handleWeightBlur = () => {
    if (weight !== rule.weight) {
      onUpdate({ id: rule.id, data: { weight } })
    }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold">{rule.name}</h4>
            <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`}>
              {isActive ? 'Active' : 'Disabled'}
            </span>
          </div>
          <p className="text-sm text-text-secondary mb-3">{rule.description}</p>
          
          <div className="flex items-center gap-6">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Weight (points)</label>
              <input
                type="number"
                value={weight}
                onChange={handleWeightChange}
                onBlur={handleWeightBlur}
                min="0"
                max="20"
                className="input w-20 text-center"
              />
            </div>
            
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Status</label>
              <button
                onClick={handleToggle}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-success/20 text-success border border-success/40 hover:bg-success/30'
                    : 'bg-error/20 text-error border border-error/40 hover:bg-error/30'
                }`}
              >
                {isActive ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UsersTab() {
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    },
  })

  const updatePlanMutation = useMutation({
    mutationFn: async ({ userId, planTier }: { userId: string; planTier: string }) => {
      const token = localStorage.getItem('token')
      const response = await axios.patch(
        `${API_URL}/api/admin/users/${userId}/plan`,
        { planTier },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User plan updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user plan')
    },
  })

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Add New User
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-semibold">Email</th>
                <th className="text-left p-4 text-sm font-semibold">Role</th>
                <th className="text-left p-4 text-sm font-semibold">Plan</th>
                <th className="text-left p-4 text-sm font-semibold">Projects</th>
                <th className="text-left p-4 text-sm font-semibold">Joined</th>
                <th className="text-left p-4 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user: any) => (
                <tr key={user.id} className="border-b border-border hover:bg-background-secondary transition-colors">
                  <td className="p-4 font-medium">{user.email}</td>
                  <td className="p-4">
                    <span className={`badge ${user.role === 'ADMIN' ? 'badge-error' : 'badge-info'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={user.planTier}
                      onChange={(e) => {
                        if (user.role !== 'ADMIN') {
                          updatePlanMutation.mutate({ userId: user.id, planTier: e.target.value })
                        }
                      }}
                      disabled={user.role === 'ADMIN'}
                      className="input py-1"
                    >
                      <option value="FREE">Free</option>
                      <option value="PRO">Pro</option>
                      <option value="AGENCY">Agency</option>
                    </select>
                  </td>
                  <td className="p-4 text-text-secondary">{user._count?.projects || 0}</td>
                  <td className="p-4 text-text-secondary text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setSelectedUserId(user.id)}
                      className="text-primary hover:underline text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUserDeleted={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            setSelectedUserId(null)
          }}
        />
      )}

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onUserCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            setShowCreateModal(false)
          }}
        />
      )}
    </>
  )
}

function EmailSettingsTab() {
  const [testEmail, setTestEmail] = useState('')
  const [isSending, setIsSending] = useState(false)

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address')
      return
    }

    setIsSending(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_URL}/api/admin/test-email`,
        { to: testEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`Test email sent to ${testEmail}! Check your inbox.`)
      setTestEmail('')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send test email')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Configuration Status */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Email Configuration Status
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-background-secondary rounded-lg border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">SMTP Configuration</h4>
              <p className="text-sm text-text-secondary mb-2">
                Email notifications are configured via environment variables in the API server.
              </p>
              <div className="text-xs font-mono bg-background-card p-3 rounded border border-border space-y-1">
                <div>SMTP_HOST: <span className="text-primary">smtp.gmail.com</span> (example)</div>
                <div>SMTP_PORT: <span className="text-primary">587</span></div>
                <div>SMTP_USER: <span className="text-primary">your-email@gmail.com</span></div>
                <div>SMTP_PASS: <span className="text-warning">••••••••</span> (hidden)</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-background-secondary rounded-lg border border-border">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">📧</span>
              Email Types Configured
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span>Welcome emails for new users</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span>Audit completion notifications</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span>Audit failure alerts</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-info/10 rounded-lg border border-info/30">
            <h4 className="font-semibold mb-2 text-info flex items-center gap-2">
              <span>ℹ️</span>
              Configuration Notes
            </h4>
            <ul className="space-y-1 text-sm text-text-secondary">
              <li>• Email settings are configured in <code className="text-xs px-1 py-0.5 bg-background-card rounded">apps/api/.env</code></li>
              <li>• If not configured, emails will be logged to console instead</li>
              <li>• Check <code className="text-xs px-1 py-0.5 bg-background-card rounded">EMAIL_SETUP.md</code> for detailed setup instructions</li>
              <li>• Users can manage their notification preferences in Settings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Test Email Sender */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Test Email System
        </h3>
        
        <p className="text-sm text-text-secondary mb-4">
          Send a test email to verify your SMTP configuration is working correctly.
        </p>

        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="recipient@example.com"
            className="input flex-1"
            disabled={isSending}
          />
          <button
            onClick={sendTestEmail}
            disabled={isSending || !testEmail}
            className="btn-primary flex items-center gap-2 min-w-[140px] justify-center"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Test
              </>
            )}
          </button>
        </div>

        <div className="mt-4 p-3 bg-background-secondary rounded border border-border text-xs text-text-secondary">
          <p className="font-semibold mb-1">What happens when you click "Send Test":</p>
          <ul className="space-y-1 ml-4">
            <li>• Sends a welcome email to the specified address</li>
            <li>• If email is not configured, you'll get a friendly error message</li>
            <li>• Check API logs to see if email service is initialized</li>
            <li>• Check worker logs for email sending status</li>
          </ul>
        </div>
      </div>

      {/* Email Templates Preview */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Email Templates
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-background-secondary rounded-lg border border-border">
            <div className="text-3xl mb-2">🎉</div>
            <h4 className="font-semibold mb-1">Welcome Email</h4>
            <p className="text-xs text-text-secondary">
              Sent when users register. Includes feature overview and getting started guide.
            </p>
          </div>
          
          <div className="p-4 bg-background-secondary rounded-lg border border-border">
            <div className="text-3xl mb-2">✅</div>
            <h4 className="font-semibold mb-1">Audit Complete</h4>
            <p className="text-xs text-text-secondary">
              Sent when audits finish. Shows score, grade, and link to full report.
            </p>
          </div>
          
          <div className="p-4 bg-background-secondary rounded-lg border border-border">
            <div className="text-3xl mb-2">❌</div>
            <h4 className="font-semibold mb-1">Audit Failed</h4>
            <p className="text-xs text-text-secondary">
              Sent when audits fail. Includes error details and retry option.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-background-secondary rounded border border-border text-xs">
          <p className="text-text-secondary">
            All email templates feature a dark theme matching the app design, responsive layout, 
            and professional branding. Templates are located in <code className="px-1 py-0.5 bg-background-card rounded">apps/api/src/services/email-service.ts</code>
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Documentation & Resources
        </h3>
        
        <div className="grid md:grid-cols-2 gap-3">
          <a 
            href="https://github.com/nodemailer/nodemailer" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-4 bg-background-secondary rounded-lg border border-border hover:border-primary/50 transition-colors"
          >
            <h4 className="font-semibold mb-1 text-primary">📚 Nodemailer Docs</h4>
            <p className="text-xs text-text-secondary">Official Nodemailer documentation and guides</p>
          </a>
          
          <div className="p-4 bg-background-secondary rounded-lg border border-border">
            <h4 className="font-semibold mb-1">📄 EMAIL_SETUP.md</h4>
            <p className="text-xs text-text-secondary">Complete setup guide with all SMTP providers</p>
          </div>
          
          <div className="p-4 bg-background-secondary rounded-lg border border-border">
            <h4 className="font-semibold mb-1">📄 EMAIL_ENV_EXAMPLE.md</h4>
            <p className="text-xs text-text-secondary">Quick environment variable configuration</p>
          </div>
          
          <div className="p-4 bg-background-secondary rounded-lg border border-border">
            <h4 className="font-semibold mb-1">📄 EMAIL_FEATURE_SUMMARY.md</h4>
            <p className="text-xs text-text-secondary">Complete feature overview and benefits</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function BrandingTab() {
  const queryClient = useQueryClient()

  const { data: branding, isLoading } = useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/branding`)
      return response.data
    },
  })

  const [formData, setFormData] = useState({
    appName: '',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '',
    accentColor: '',
    footerText: '',
  })

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)

  // Update form when branding data loads
  useEffect(() => {
    if (branding) {
      setFormData({
        appName: branding.appName || '',
        logoUrl: branding.logoUrl || '',
        faviconUrl: branding.faviconUrl || '',
        primaryColor: branding.primaryColor || '#06b6d4',
        accentColor: branding.accentColor || '#10b981',
        footerText: branding.footerText || '',
      })
      setLogoPreview(branding.logoUrl || null)
      setFaviconPreview(branding.faviconUrl || null)
    }
  }, [branding])

  // Handle logo file upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only image files are allowed (JPEG, PNG, GIF, SVG)')
      return
    }

    setIsUploadingLogo(true)
    const uploadFormData = new FormData()
    uploadFormData.append('logo', file)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_URL}/api/branding/upload/logo`, uploadFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      const logoUrl = response.data.logoUrl
      setFormData(prev => ({ ...prev, logoUrl }))
      setLogoPreview(logoUrl)
      toast.success('Logo uploaded successfully!')
      queryClient.invalidateQueries({ queryKey: ['branding'] })
    } catch (error: any) {
      console.error('Logo upload error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload logo'
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to upload logo')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // Handle favicon file upload
  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/x-icon', 'image/vnd.microsoft.icon']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only image files are allowed (ICO, PNG, JPEG)')
      return
    }

    setIsUploadingFavicon(true)
    const uploadFormData = new FormData()
    uploadFormData.append('favicon', file)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_URL}/api/branding/upload/favicon`, uploadFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      const faviconUrl = response.data.faviconUrl
      setFormData(prev => ({ ...prev, faviconUrl }))
      setFaviconPreview(faviconUrl)
      toast.success('Favicon uploaded successfully!')
      queryClient.invalidateQueries({ queryKey: ['branding'] })
    } catch (error: any) {
      console.error('Favicon upload error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload favicon'
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to upload favicon')
    } finally {
      setIsUploadingFavicon(false)
    }
  }

  const updateBrandingMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = localStorage.getItem('token')
      const response = await axios.patch(`${API_URL}/api/branding`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] })
      toast.success('Branding settings updated successfully! Refresh the page to see changes.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update branding settings')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateBrandingMutation.mutate(formData)
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* App Name */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Application Name
        </h3>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            App Name/Logo Text
          </label>
          <input
            type="text"
            value={formData.appName}
            onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
            placeholder="FixFirst SEO"
            className="input"
            maxLength={50}
          />
          <p className="text-xs text-text-secondary mt-1">
            This will appear in the sidebar and page titles
          </p>
        </div>
      </div>

      {/* Logo & Favicon */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Logo & Favicon
        </h3>
        
        <div className="space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Logo (Optional)
            </label>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Upload Section */}
              <div>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isUploadingLogo}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {isUploadingLogo ? (
                      <>
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm text-text-secondary">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium mb-1">Click to upload logo</p>
                        <p className="text-xs text-text-secondary">PNG, JPG, GIF, SVG (max 2MB)</p>
                        <p className="text-xs text-text-secondary mt-1">Recommended: 200x50px</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Preview Section */}
              <div>
                <div className="border border-border rounded-lg p-6 bg-background-secondary flex items-center justify-center min-h-[150px]">
                  {logoPreview ? (
                    <div className="text-center">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="max-h-24 max-w-full object-contain mb-2"
                        onError={() => setLogoPreview(null)}
                      />
                      <p className="text-xs text-text-secondary">Current Logo</p>
                    </div>
                  ) : (
                    <div className="text-center text-text-secondary">
                      <p className="text-sm">No logo uploaded</p>
                      <p className="text-xs mt-1">Upload a file or enter URL below</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* URL Input (Alternative) */}
            <div className="mt-3">
              <label className="block text-xs text-text-secondary mb-1">
                Or enter logo URL directly:
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => {
                  setFormData({ ...formData, logoUrl: e.target.value })
                  setLogoPreview(e.target.value)
                }}
                placeholder="https://example.com/logo.png"
                className="input text-sm"
              />
            </div>
          </div>

          {/* Favicon Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Favicon (Optional)
            </label>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Upload Section */}
              <div>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="favicon-upload"
                    accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/jpeg"
                    onChange={handleFaviconUpload}
                    className="hidden"
                    disabled={isUploadingFavicon}
                  />
                  <label
                    htmlFor="favicon-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {isUploadingFavicon ? (
                      <>
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm text-text-secondary">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium mb-1">Click to upload favicon</p>
                        <p className="text-xs text-text-secondary">ICO, PNG (max 2MB)</p>
                        <p className="text-xs text-text-secondary mt-1">Recommended: 32x32px</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Preview Section */}
              <div>
                <div className="border border-border rounded-lg p-6 bg-background-secondary flex items-center justify-center min-h-[150px]">
                  {faviconPreview ? (
                    <div className="text-center">
                      <img 
                        src={faviconPreview} 
                        alt="Favicon preview" 
                        className="w-8 h-8 object-contain mb-2 mx-auto"
                        onError={() => setFaviconPreview(null)}
                      />
                      <p className="text-xs text-text-secondary">Current Favicon</p>
                    </div>
                  ) : (
                    <div className="text-center text-text-secondary">
                      <p className="text-sm">No favicon uploaded</p>
                      <p className="text-xs mt-1">Upload a file or enter URL below</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* URL Input (Alternative) */}
            <div className="mt-3">
              <label className="block text-xs text-text-secondary mb-1">
                Or enter favicon URL directly:
              </label>
              <input
                type="url"
                value={formData.faviconUrl}
                onChange={(e) => {
                  setFormData({ ...formData, faviconUrl: e.target.value })
                  setFaviconPreview(e.target.value)
                }}
                placeholder="https://example.com/favicon.ico"
                className="input text-sm"
              />
            </div>
          </div>

          <div className="p-4 bg-success/10 rounded-lg border border-success/30">
            <h4 className="font-semibold mb-2 text-success flex items-center gap-2">
              <span>✅</span>
              File Upload is Ready!
            </h4>
            <ul className="space-y-1 text-sm text-text-secondary">
              <li>• <strong>Drag & drop or click</strong> to upload files directly</li>
              <li>• <strong>Instant preview</strong> of your uploaded images</li>
              <li>• <strong>Auto-saved</strong> - no need to click "Save Branding" after upload</li>
              <li>• <strong>Or use URLs</strong> if you prefer external hosting</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Brand Colors
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Primary Color
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-20 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                placeholder="#06b6d4"
                className="input flex-1"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Used for buttons, links, and highlights
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Accent Color
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={formData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                className="w-20 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                placeholder="#10b981"
                className="input flex-1"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Used for success states and gradients
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-background-secondary rounded-lg">
          <h4 className="font-semibold mb-2">Preview</h4>
          <div className="flex gap-3">
            <div 
              className="w-20 h-20 rounded-lg shadow-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: formData.primaryColor }}
            >
              Primary
            </div>
            <div 
              className="w-20 h-20 rounded-lg shadow-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: formData.accentColor }}
            >
              Accent
            </div>
            <div 
              className="flex-1 h-20 rounded-lg shadow-lg flex items-center justify-center text-white font-bold"
              style={{ 
                background: `linear-gradient(135deg, ${formData.primaryColor} 0%, ${formData.accentColor} 100%)` 
              }}
            >
              Gradient
            </div>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Footer Text
        </h3>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Copyright & Branding Text
          </label>
          <input
            type="text"
            value={formData.footerText}
            onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
            placeholder="© 2025 YourCompany. All rights reserved."
            className="input"
            maxLength={200}
          />
          <p className="text-xs text-text-secondary mt-1">
            This appears at the bottom of pages and in email footers
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            if (branding) {
              setFormData({
                appName: branding.appName || '',
                logoUrl: branding.logoUrl || '',
                faviconUrl: branding.faviconUrl || '',
                primaryColor: branding.primaryColor || '#06b6d4',
                accentColor: branding.accentColor || '#10b981',
                footerText: branding.footerText || '',
              })
              toast.success('Changes reset')
            }
          }}
          className="btn-secondary"
        >
          Reset Changes
        </button>
        <button
          type="submit"
          disabled={updateBrandingMutation.isPending}
          className="btn-primary min-w-[150px]"
        >
          {updateBrandingMutation.isPending ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            'Save Branding'
          )}
        </button>
      </div>

      {/* Important Note */}
      <div className="p-4 bg-warning/10 rounded-lg border border-warning/30">
        <h4 className="font-semibold mb-2 text-warning flex items-center gap-2">
          <span>⚠️</span>
          Important Notes
        </h4>
        <ul className="space-y-1 text-sm text-text-secondary">
          <li>• <strong>Refresh required:</strong> After saving, refresh your browser to see changes</li>
          <li>• <strong>Colors:</strong> Must be valid hex colors (e.g., #06b6d4)</li>
          <li>• <strong>URLs:</strong> Logo and favicon must be accessible public URLs</li>
          <li>• <strong>CSS:</strong> For advanced theming, edit <code className="text-xs px-1 py-0.5 bg-background-card rounded">tailwind.config.ts</code></li>
        </ul>
      </div>
    </form>
  )
}

function UserDetailsModal({ userId, onClose, onUserDeleted }: { userId: string; onClose: () => void; onUserDeleted: () => void }) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    email: '',
    password: '',
    role: '' as 'USER' | 'ADMIN',
    planTier: '' as 'FREE' | 'PRO' | 'AGENCY',
  })

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    },
  })

  // Initialize edit form when user data loads
  useEffect(() => {
    if (user && !isEditing) {
      setEditForm({
        email: user.email,
        password: '',
        role: user.role,
        planTier: user.planTier,
      })
    }
  }, [user, isEditing])

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token')
      const response = await axios.patch(
        `${API_URL}/api/admin/users/${userId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User updated successfully')
      setIsEditing(false)
      setEditForm({ ...editForm, password: '' }) // Clear password field
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user')
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    },
    onSuccess: () => {
      toast.success('User deleted successfully')
      onUserDeleted()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    },
  })

  const handleSaveEdit = () => {
    const updateData: any = {}
    
    // Only include changed fields
    if (editForm.email !== user.email) updateData.email = editForm.email
    if (editForm.role !== user.role) updateData.role = editForm.role
    if (editForm.planTier !== user.planTier) updateData.planTier = editForm.planTier
    if (editForm.password && editForm.password.length >= 6) updateData.password = editForm.password

    if (Object.keys(updateData).length === 0) {
      toast.error('No changes to save')
      return
    }

    updateUserMutation.mutate(updateData)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (user) {
      setEditForm({
        email: user.email,
        password: '',
        role: user.role,
        planTier: user.planTier,
      })
    }
  }

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this user? This will permanently delete all their projects and audits.`)) {
      deleteUserMutation.mutate()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold">{isEditing ? 'Edit User' : 'User Details'}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl">&times;</button>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : user ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="input w-full"
                    required
                  />
                ) : (
                  <p className="font-medium">{user.email}</p>
                )}
              </div>

              {/* Password (only in edit mode) */}
              {isEditing && (
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">
                    New Password <span className="text-xs text-text-secondary">(leave blank to keep current)</span>
                  </label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="input w-full"
                    placeholder="Enter new password (min 6 characters)"
                    minLength={6}
                  />
                </div>
              )}

              {/* Role & Plan */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Role</label>
                  {isEditing ? (
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'USER' | 'ADMIN' })}
                      className="input w-full"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    <p className="font-medium">
                      <span className={`badge ${user.role === 'ADMIN' ? 'badge-error' : 'badge-info'}`}>
                        {user.role}
                      </span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Plan</label>
                  {isEditing ? (
                    <select
                      value={editForm.planTier}
                      onChange={(e) => setEditForm({ ...editForm, planTier: e.target.value as 'FREE' | 'PRO' | 'AGENCY' })}
                      className="input w-full"
                    >
                      <option value="FREE">Free</option>
                      <option value="PRO">Pro</option>
                      <option value="AGENCY">Agency</option>
                    </select>
                  ) : (
                    <p className="font-medium">
                      <span className="badge badge-success">{user.planTier}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Read-only fields (not editable) */}
              {!isEditing && (
                <>
                  <div>
                    <label className="text-sm text-text-secondary">Joined</label>
                    <p className="font-medium">{new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary">API Key Status</label>
                    <p className="font-medium">
                      {user.apiKeyHash ? (
                        <span className="text-success">Active since {new Date(user.apiKeyCreatedAt).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-text-secondary">Not generated</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary">Email Notifications</label>
                    <p className="font-medium">
                      {user.notificationPreferences ? (
                        <span className="text-success">Enabled</span>
                      ) : (
                        <span className="text-text-secondary">Disabled</span>
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Projects */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Projects ({user.projects?.length || 0})</h3>
              {user.projects && user.projects.length > 0 ? (
                <div className="space-y-2">
                  {user.projects.map((project: any) => (
                    <div key={project.id} className="p-3 bg-background-secondary rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium">{project.domain}</p>
                        <p className="text-sm text-text-secondary">
                          Created: {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="badge badge-info">{project._count.audits} audits</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-sm">No projects yet</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-border">
              {isEditing ? (
                <>
                  <button onClick={onClose} className="btn-secondary">
                    Close
                  </button>
                  <div className="flex gap-3">
                    <button onClick={handleCancelEdit} className="btn-secondary">
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveEdit}
                      disabled={updateUserMutation.isPending}
                      className="btn-primary min-w-[120px]"
                    >
                      {updateUserMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleDelete}
                    disabled={deleteUserMutation.isPending}
                    className="px-4 py-2 bg-error/20 text-error border border-error/40 rounded-lg font-medium hover:bg-error/30 transition-all disabled:opacity-50"
                  >
                    {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                  </button>
                  <div className="flex gap-3">
                    <button onClick={onClose} className="btn-secondary">
                      Close
                    </button>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="btn-primary"
                    >
                      Edit User
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-text-secondary">User not found</p>
        )}
      </div>
    </div>
  )
}

function CreateUserModal({ onClose, onUserCreated }: { onClose: () => void; onUserCreated: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER' as 'USER' | 'ADMIN',
    planTier: 'FREE' as 'FREE' | 'PRO' | 'AGENCY',
  })

  const createUserMutation = useMutation({
    mutationFn: async (data: Omit<typeof formData, 'confirmPassword'>) => {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_URL}/api/admin/users`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data
    },
    onSuccess: () => {
      toast.success('User created successfully')
      onUserCreated()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create user')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    const { confirmPassword, ...submitData } = formData
    createUserMutation.mutate(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold">Create New User</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input w-full"
              required
              placeholder="user@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input w-full"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Confirm Password *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="input w-full"
              required
              minLength={6}
              placeholder="Re-enter password"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
              className="input w-full"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Plan Tier */}
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Plan Tier</label>
            <select
              value={formData.planTier}
              onChange={(e) => setFormData({ ...formData, planTier: e.target.value as 'FREE' | 'PRO' | 'AGENCY' })}
              className="input w-full"
            >
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
              <option value="AGENCY">Agency</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createUserMutation.isPending}
              className="btn-primary min-w-[120px]"
            >
              {createUserMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function APISettingsTab() {
  const [openAIKey, setOpenAIKey] = useState('')
  const [gscClientId, setGscClientId] = useState('')
  const [gscClientSecret, setGscClientSecret] = useState('')
  const [gscRedirectUri, setGscRedirectUri] = useState('http://localhost:3001/api/gsc/callback')
  const [paypalMode, setPaypalMode] = useState('sandbox')
  const [paypalClientId, setPaypalClientId] = useState('')
  const [paypalClientSecret, setPaypalClientSecret] = useState('')
  const [paypalProPlanId, setPaypalProPlanId] = useState('')
  const [paypalEnterprisePlanId, setPaypalEnterprisePlanId] = useState('')
  const [psiApiKey, setPsiApiKey] = useState('')
  const [isEditingOpenAI, setIsEditingOpenAI] = useState(false)
  const [isEditingGSC, setIsEditingGSC] = useState(false)
  const [isEditingPayPal, setIsEditingPayPal] = useState(false)
  const [isEditingPSI, setIsEditingPSI] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const queryClient = useQueryClient()

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return response.data
    },
  })

  const updateSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string; isSecret?: boolean }) => {
      const response = await axios.put(`${API_URL}/api/settings/${data.key}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('API Settings updated successfully!')
      setIsEditing(false)
      setOpenAIKey('')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update settings')
    },
  })

  const testOpenAIMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      const response = await axios.post(
        `${API_URL}/api/settings/test-openai`,
        { apiKey },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      return response.data
    },
    onSuccess: () => {
      toast.success('✅ OpenAI API key is valid!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Invalid API key')
    },
  })

  const handleSaveOpenAI = () => {
    if (!openAIKey.trim()) {
      toast.error('Please enter an API key')
      return
    }

    if (!openAIKey.startsWith('sk-')) {
      toast.error('OpenAI API keys must start with "sk-"')
      return
    }

    updateSettingMutation.mutate({
      key: 'OPENAI_API_KEY',
      value: openAIKey,
      description: 'OpenAI API key for AI-powered recommendations',
      isSecret: true,
    })
  }

  const handleTestOpenAI = () => {
    if (!openAIKey.trim()) {
      toast.error('Please enter an API key to test')
      return
    }

    testOpenAIMutation.mutate(openAIKey)
  }

  const handleSaveGSC = async () => {
    if (!gscClientId.trim() || !gscClientSecret.trim()) {
      toast.error('Please enter both Client ID and Client Secret')
      return
    }

    try {
      await Promise.all([
        updateSettingMutation.mutateAsync({
          key: 'GSC_CLIENT_ID',
          value: gscClientId,
          description: 'Google Search Console OAuth Client ID',
          isSecret: false,
        }),
        updateSettingMutation.mutateAsync({
          key: 'GSC_CLIENT_SECRET',
          value: gscClientSecret,
          description: 'Google Search Console OAuth Client Secret',
          isSecret: true,
        }),
        updateSettingMutation.mutateAsync({
          key: 'GSC_REDIRECT_URI',
          value: gscRedirectUri,
          description: 'Google Search Console OAuth Redirect URI',
          isSecret: false,
        }),
      ])
      toast.success('GSC settings saved! Restart API server to apply changes.')
      setIsEditingGSC(false)
    } catch (error) {
      // Error already handled by mutation
    }
  }

  const handleSavePayPal = async () => {
    if (!paypalClientId.trim() || !paypalClientSecret.trim()) {
      toast.error('Please enter both PayPal Client ID and Client Secret')
      return
    }

    try {
      await Promise.all([
        updateSettingMutation.mutateAsync({
          key: 'PAYPAL_MODE',
          value: paypalMode,
          description: 'PayPal mode (sandbox or live)',
          isSecret: false,
        }),
        updateSettingMutation.mutateAsync({
          key: 'PAYPAL_CLIENT_ID',
          value: paypalClientId,
          description: 'PayPal API Client ID',
          isSecret: false,
        }),
        updateSettingMutation.mutateAsync({
          key: 'PAYPAL_CLIENT_SECRET',
          value: paypalClientSecret,
          description: 'PayPal API Client Secret',
          isSecret: true,
        }),
        ...(paypalProPlanId ? [updateSettingMutation.mutateAsync({
          key: 'PAYPAL_PRO_PLAN_ID',
          value: paypalProPlanId,
          description: 'PayPal PRO subscription plan ID',
          isSecret: false,
        })] : []),
        ...(paypalEnterprisePlanId ? [updateSettingMutation.mutateAsync({
          key: 'PAYPAL_ENTERPRISE_PLAN_ID',
          value: paypalEnterprisePlanId,
          description: 'PayPal ENTERPRISE subscription plan ID',
          isSecret: false,
        })] : []),
      ])
      toast.success('PayPal settings saved! Restart API server to apply changes.')
      setIsEditingPayPal(false)
    } catch (error) {
      // Error already handled by mutation
    }
  }

  const handleSavePSI = () => {
    if (!psiApiKey.trim()) {
      toast.error('Please enter PageSpeed Insights API key')
      return
    }

    updateSettingMutation.mutate({
      key: 'PSI_API_KEY',
      value: psiApiKey,
      description: 'Google PageSpeed Insights API Key',
      isSecret: true,
    })
    setIsEditingPSI(false)
  }

  if (isLoading) return <LoadingState />

  const existingOpenAIKey = settingsData?.find((s: any) => s.key === 'OPENAI_API_KEY')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Settings</h2>
        <p className="text-text-secondary">Manage third-party API keys and integrations</p>
      </div>

      {/* OpenAI Settings Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">🤖 OpenAI Integration</h3>
            <p className="text-sm text-text-secondary">
              API key for AI-powered SEO recommendations
            </p>
          </div>
          <div className="flex items-center gap-2">
            {existingOpenAIKey && (
              <span className="px-3 py-1 bg-success/20 text-success text-xs font-medium rounded-full border border-success/30">
                ✓ Configured
              </span>
            )}
          </div>
        </div>

        {!isEditingOpenAI && existingOpenAIKey ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">OpenAI API Key</div>
                  <div className="text-xs text-text-secondary font-mono">••••••••</div>
                </div>
              </div>
              <button
                onClick={() => setIsEditingOpenAI(true)}
                className="btn-secondary btn-sm"
              >
                Update Key
              </button>
            </div>
            <div className="text-xs text-text-secondary">
              Last updated: {new Date(existingOpenAIKey.updatedAt).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
              <input
                type="text"
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
                placeholder="sk-..."
                className="input w-full font-mono text-sm"
              />
              <p className="text-xs text-text-secondary mt-1">
                Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  platform.openai.com/api-keys
                </a>
              </p>
            </div>

            <div className="flex gap-3">
              {isEditingOpenAI && (
                <button
                  onClick={() => {
                    setIsEditingOpenAI(false)
                    setOpenAIKey('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleTestOpenAI}
                disabled={testOpenAIMutation.isPending || !openAIKey.trim()}
                className="btn-secondary"
              >
                {testOpenAIMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Testing...
                  </span>
                ) : (
                  'Test Connection'
                )}
              </button>
              <button
                onClick={handleSaveOpenAI}
                disabled={updateSettingMutation.isPending || !openAIKey.trim()}
                className="btn-primary"
              >
                {updateSettingMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save API Key'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-4 p-4 bg-accent/10 border border-accent/30 rounded-lg">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-accent text-xs font-bold">ℹ</span>
              </div>
            </div>
            <div className="text-sm text-text-secondary space-y-1">
              <p>
                <strong>Why configure OpenAI?</strong> Enables AI-powered, detailed SEO recommendations with:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                <li>Detailed problem analysis explaining WHY issues matter</li>
                <li>Step-by-step solutions with specific code examples</li>
                <li>Impact assessments predicting improvements</li>
                <li>Smart prioritization based on effort vs. value</li>
              </ul>
              <p className="pt-2">
                <strong>Cost:</strong> ~$0.02-0.05 per audit (~$5-15/month for 100 audits)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* GSC Settings Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">🔍 Google Search Console</h3>
            <p className="text-sm text-text-secondary">
              OAuth credentials for keyword tracking integration
            </p>
          </div>
          <div className="flex items-center gap-2">
            {settingsData?.find((s: any) => s.key === 'GSC_CLIENT_ID') && (
              <span className="px-3 py-1 bg-success/20 text-success text-xs font-medium rounded-full border border-success/30">
                ✓ Configured
              </span>
            )}
          </div>
        </div>

        {!isEditingGSC && settingsData?.find((s: any) => s.key === 'GSC_CLIENT_ID') ? (
          <div className="space-y-3">
            <div className="p-3 bg-background-secondary rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Client ID</span>
                <span className="text-xs text-text-secondary">Configured</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Client Secret</span>
                <span className="text-xs text-text-secondary font-mono">••••••••</span>
              </div>
            </div>
            <button
              onClick={() => setIsEditingGSC(true)}
              className="btn-secondary btn-sm"
            >
              Update Credentials
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Client ID</label>
              <input
                type="text"
                value={gscClientId}
                onChange={(e) => setGscClientId(e.target.value)}
                placeholder="123456789-xxx.apps.googleusercontent.com"
                className="input w-full font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Client Secret</label>
              <input
                type="text"
                value={gscClientSecret}
                onChange={(e) => setGscClientSecret(e.target.value)}
                placeholder="GOCSPX-..."
                className="input w-full font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Redirect URI</label>
              <input
                type="text"
                value={gscRedirectUri}
                onChange={(e) => setGscRedirectUri(e.target.value)}
                className="input w-full font-mono text-sm"
              />
              <p className="text-xs text-text-secondary mt-1">
                Must match the redirect URI in your Google Cloud Console
              </p>
            </div>

            <div className="flex gap-3">
              {isEditingGSC && (
                <button
                  onClick={() => {
                    setIsEditingGSC(false)
                    setGscClientId('')
                    setGscClientSecret('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSaveGSC}
                disabled={updateSettingMutation.isPending}
                className="btn-primary"
              >
                {updateSettingMutation.isPending ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="text-sm text-text-secondary space-y-1">
            <p><strong>Setup Guide:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2 text-xs">
              <li>Go to Google Cloud Console → APIs & Services → Credentials</li>
              <li>Create OAuth 2.0 Client ID (Web application)</li>
              <li>Add authorized redirect URI</li>
              <li>Copy Client ID and Client Secret here</li>
            </ol>
            <p className="pt-2 text-xs">
              See <code className="px-1 py-0.5 bg-background-card rounded">docs/GSC_SETUP_GUIDE.md</code> for detailed instructions
            </p>
          </div>
        </div>
      </div>

      {/* PayPal Settings Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">💳 PayPal Integration</h3>
            <p className="text-sm text-text-secondary">
              API credentials for subscription billing
            </p>
          </div>
          <div className="flex items-center gap-2">
            {settingsData?.find((s: any) => s.key === 'PAYPAL_CLIENT_ID') && (
              <span className="px-3 py-1 bg-success/20 text-success text-xs font-medium rounded-full border border-success/30">
                ✓ Configured
              </span>
            )}
          </div>
        </div>

        {!isEditingPayPal && settingsData?.find((s: any) => s.key === 'PAYPAL_CLIENT_ID') ? (
          <div className="space-y-3">
            <div className="p-3 bg-background-secondary rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mode</span>
                <span className="text-xs font-mono">{settingsData?.find((s: any) => s.key === 'PAYPAL_MODE')?.value || 'sandbox'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Client ID</span>
                <span className="text-xs text-text-secondary">Configured</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Client Secret</span>
                <span className="text-xs text-text-secondary font-mono">••••••••</span>
              </div>
            </div>
            <button
              onClick={() => setIsEditingPayPal(true)}
              className="btn-secondary btn-sm"
            >
              Update Credentials
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mode</label>
              <select
                value={paypalMode}
                onChange={(e) => setPaypalMode(e.target.value)}
                className="input w-full"
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="live">Live (Production)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Client ID</label>
              <input
                type="text"
                value={paypalClientId}
                onChange={(e) => setPaypalClientId(e.target.value)}
                placeholder="AYxxxxxxxxxxxxxx"
                className="input w-full font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Client Secret</label>
              <input
                type="text"
                value={paypalClientSecret}
                onChange={(e) => setPaypalClientSecret(e.target.value)}
                placeholder="EKxxxxxxxxxxxxxx"
                className="input w-full font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">PRO Plan ID (Optional)</label>
              <input
                type="text"
                value={paypalProPlanId}
                onChange={(e) => setPaypalProPlanId(e.target.value)}
                placeholder="P-XXXXXXXXXXXX"
                className="input w-full font-mono text-sm"
              />
              <p className="text-xs text-text-secondary mt-1">
                Leave empty if not using subscriptions yet
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ENTERPRISE Plan ID (Optional)</label>
              <input
                type="text"
                value={paypalEnterprisePlanId}
                onChange={(e) => setPaypalEnterprisePlanId(e.target.value)}
                placeholder="P-YYYYYYYYYYYY"
                className="input w-full font-mono text-sm"
              />
            </div>

            <div className="flex gap-3">
              {isEditingPayPal && (
                <button
                  onClick={() => {
                    setIsEditingPayPal(false)
                    setPaypalClientId('')
                    setPaypalClientSecret('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSavePayPal}
                disabled={updateSettingMutation.isPending}
                className="btn-primary"
              >
                {updateSettingMutation.isPending ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="text-sm text-text-secondary space-y-1">
            <p><strong>Setup Guide:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2 text-xs">
              <li>Go to PayPal Developer Dashboard</li>
              <li>Create a new app or use existing</li>
              <li>Copy Client ID and Secret from app details</li>
              <li>Create subscription plans and copy Plan IDs</li>
            </ol>
            <p className="pt-2 text-xs">
              See <code className="px-1 py-0.5 bg-background-card rounded">docs/PAYPAL_BILLING_SETUP.md</code> for detailed instructions
            </p>
          </div>
        </div>
      </div>

      {/* PageSpeed Insights Settings Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">⚡ Google PageSpeed Insights</h3>
            <p className="text-sm text-text-secondary">
              API key for SEO audit performance analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            {settingsData?.find((s: any) => s.key === 'PSI_API_KEY') && (
              <span className="px-3 py-1 bg-success/20 text-success text-xs font-medium rounded-full border border-success/30">
                ✓ Configured
              </span>
            )}
          </div>
        </div>

        {!isEditingPSI && settingsData?.find((s: any) => s.key === 'PSI_API_KEY') ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">PageSpeed Insights API Key</div>
                  <div className="text-xs text-text-secondary font-mono">••••••••</div>
                </div>
              </div>
              <button
                onClick={() => setIsEditingPSI(true)}
                className="btn-secondary btn-sm"
              >
                Update Key
              </button>
            </div>
            <div className="text-xs text-text-secondary">
              Last updated: {new Date(settingsData.find((s: any) => s.key === 'PSI_API_KEY').updatedAt).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">PageSpeed Insights API Key</label>
              <input
                type="text"
                value={psiApiKey}
                onChange={(e) => setPsiApiKey(e.target.value)}
                placeholder="AIza..."
                className="input w-full font-mono text-sm"
              />
              <p className="text-xs text-text-secondary mt-1">
                Get your API key from{' '}
                <a
                  href="https://developers.google.com/speed/docs/insights/v5/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Cloud Console
                </a>
              </p>
            </div>

            <div className="flex gap-3">
              {isEditingPSI && (
                <button
                  onClick={() => {
                    setIsEditingPSI(false)
                    setPsiApiKey('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSavePSI}
                disabled={updateSettingMutation.isPending || !psiApiKey.trim()}
                className="btn-primary"
              >
                {updateSettingMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save API Key'
                )}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-xs font-bold">ℹ</span>
              </div>
            </div>
            <div className="text-sm text-text-secondary space-y-1">
              <p><strong>Why configure PageSpeed Insights?</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                <li>Required for running SEO audits</li>
                <li>Analyzes page performance, accessibility, SEO, and best practices</li>
                <li>Provides Core Web Vitals metrics</li>
                <li>Free to use with generous quota (25,000 requests/day)</li>
              </ul>
              <p className="pt-2">
                <strong>Setup:</strong> Go to Google Cloud Console → APIs & Services → Credentials → Create API Key
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Loading...</p>
      </div>
    </div>
  )
}

function EmailTemplatesTab() {
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const queryClient = useQueryClient()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/email-templates`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return response.data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ key, data }: { key: string; data: any }) => {
      return axios.put(`${API_URL}/api/email-templates/${key}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
    },
    onSuccess: () => {
      toast.success('Template updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      setEditingTemplate(null)
      setEditForm({})
    },
    onError: () => {
      toast.error('Failed to update template')
    },
  })

  const resetMutation = useMutation({
    mutationFn: async (key: string) => {
      return axios.post(`${API_URL}/api/email-templates/${key}/reset`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
    },
    onSuccess: () => {
      toast.success('Template reset to default!')
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
    },
    onError: () => {
      toast.error('Failed to reset template')
    },
  })

  const handleEdit = (template: any) => {
    setEditingTemplate(template.key)
    setEditForm({
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      description: template.description,
      isActive: template.isActive,
    })
  }

  const handleSave = (key: string) => {
    updateMutation.mutate({ key, data: editForm })
  }

  const handleCancel = () => {
    setEditingTemplate(null)
    setEditForm({})
  }

  const handleReset = (key: string) => {
    if (confirm('Are you sure you want to reset this template to default? This cannot be undone.')) {
      resetMutation.mutate(key)
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Email Templates</h2>
        <p className="text-text-secondary">
          Customize email notifications sent to users. Edit templates directly in the admin panel - no code required!
        </p>
      </div>

      {/* Template Cards */}
      <div className="space-y-6">
        {templates?.map((template: any) => (
          <div key={template.key} className="card">
            {editingTemplate === template.key ? (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Editing: {template.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCancel()}
                      className="btn-secondary btn-sm flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(template.key)}
                      disabled={updateMutation.isPending}
                      className="btn-primary btn-sm flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {updateMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Template Name</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email Subject</label>
                  <input
                    type="text"
                    value={editForm.subject || ''}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="input w-full font-mono text-sm"
                    placeholder="Use {{variableName}} for dynamic content"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <input
                    type="text"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">HTML Content</label>
                  <textarea
                    value={editForm.htmlContent || ''}
                    onChange={(e) => setEditForm({ ...editForm, htmlContent: e.target.value })}
                    className="input w-full font-mono text-xs"
                    rows={15}
                    placeholder="Edit HTML template..."
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    Available variables: {'{{project.name}}'}, {'{{audit.score}}'}, {'{{user.email}}'}, {'{{frontendUrl}}'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`active-${template.key}`}
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor={`active-${template.key}`} className="text-sm">
                    Template is active
                  </label>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      template.key === 'audit-complete' ? 'bg-success/20 text-success' :
                      template.key === 'invitation' ? 'bg-accent/20 text-accent' :
                      'bg-primary/20 text-primary'
                    }`}>
                      {template.key === 'audit-complete' ? '✓' : template.key === 'invitation' ? '🤝' : '📊'}
                    </div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <span className={`text-xs ${template.isActive ? 'text-success' : 'text-error'}`}>
                        {template.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="btn-secondary btn-sm flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleReset(template.key)}
                      className="btn-secondary btn-sm flex items-center gap-2"
                      title="Reset to default"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-text-secondary mb-2">{template.description}</p>
                  </div>

                  <div className="bg-background-secondary p-3 rounded">
                    <div className="text-xs text-text-secondary mb-1">Subject:</div>
                    <div className="font-mono text-sm">{template.subject}</div>
                  </div>

                  <div className="bg-background-secondary p-3 rounded">
                    <div className="text-xs text-text-secondary mb-1">Last Updated:</div>
                    <div className="text-sm">{new Date(template.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Helper Info */}
      <div className="card bg-accent/5 border-accent/30">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Template Variables Guide
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="font-medium">Common Variables:</p>
            <ul className="space-y-1 text-text-secondary">
              <li className="font-mono text-xs">{'{{project.name}}'} - Project name</li>
              <li className="font-mono text-xs">{'{{project.domain}}'} - Project domain</li>
              <li className="font-mono text-xs">{'{{user.email}}'} - User's email</li>
              <li className="font-mono text-xs">{'{{frontendUrl}}'} - Frontend URL</li>
              <li className="font-mono text-xs">{'{{year}}'} - Current year</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Audit Variables:</p>
            <ul className="space-y-1 text-text-secondary">
              <li className="font-mono text-xs">{'{{audit.overallScore}}'} - Audit score</li>
              <li className="font-mono text-xs">{'{{audit.grade}}'} - Score grade</li>
              <li className="font-mono text-xs">{'{{auditUrl}}'} - Link to audit</li>
              <li className="font-mono text-xs">{'{{projectUrl}}'} - Link to project</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-warning/10 rounded">
          <p className="text-sm text-warning font-medium">⚠️ Important:</p>
          <p className="text-xs text-text-secondary mt-1">
            Make sure to maintain proper HTML structure. Invalid HTML may cause rendering issues. Use the Reset button to restore defaults if needed.
          </p>
        </div>
      </div>
    </div>
  )
}
