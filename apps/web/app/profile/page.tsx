'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi, authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Bell, MessageSquare, Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import SecurityTab from './SecurityTab'

type TabType = 'profile' | 'password' | 'security' | 'notifications' | 'integrations'

export default function ProfilePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await profileApi.get()
      return response.data
    },
  })

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await authApi.me()
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
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
            <h1 className="text-3xl font-bold text-text-primary">Profile Settings</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          <TabButton
            icon={<User />}
            label="Profile"
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          />
          <TabButton
            icon={<Lock />}
            label="Password"
            active={activeTab === 'password'}
            onClick={() => setActiveTab('password')}
          />
          <TabButton
            icon={<Shield />}
            label="Security"
            active={activeTab === 'security'}
            onClick={() => setActiveTab('security')}
          />
          <TabButton
            icon={<Bell />}
            label="Notifications"
            active={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
          />
          <TabButton
            icon={<MessageSquare />}
            label="Integrations"
            active={activeTab === 'integrations'}
            onClick={() => setActiveTab('integrations')}
          />
        </div>

        {/* Content */}
        {activeTab === 'profile' && <ProfileTab profile={profile} />}
        {activeTab === 'password' && <PasswordTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'integrations' && <IntegrationsTab profile={profile} />}
      </div>
    </div>
  )
}

function TabButton({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-primary text-primary font-semibold'
          : 'border-transparent text-text-secondary hover:text-text-primary'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function ProfileTab({ profile }: { profile: any }) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState(profile?.email || '')

  const updateMutation = useMutation({
    mutationFn: (data: { email: string }) => profileApi.update(data),
    onSuccess: () => {
      toast.success('Profile updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({ email })
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Account Role</label>
              <div className="input bg-background-secondary cursor-not-allowed">
                <Shield className="w-4 h-4 inline mr-2" />
                {profile?.role}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Plan Tier</label>
              <div className="input bg-background-secondary cursor-not-allowed">
                {profile?.planTier}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Member Since</label>
            <div className="input bg-background-secondary cursor-not-allowed">
              {new Date(profile?.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn-primary"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      profileApi.changePassword(data),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    changePasswordMutation.mutate({ currentPassword, newPassword })
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Change Password</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input w-full pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input w-full pr-10"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-sm text-text-secondary mt-1">Must be at least 8 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input w-full pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={changePasswordMutation.isPending}
          className="btn-primary"
        >
          {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}

function NotificationsTab() {
  const queryClient = useQueryClient()

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await profileApi.getNotifications()
      return response.data.preferences
    },
  })

  const updateMutation = useMutation({
    mutationFn: (preferences: any) => profileApi.updateNotifications(preferences),
    onSuccess: () => {
      toast.success('Notification preferences updated!')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      toast.error('Failed to update preferences')
    },
  })

  const handleToggle = (key: string, value: boolean) => {
    updateMutation.mutate({ [key]: value })
  }

  if (isLoading) {
    return <div className="card"><p>Loading...</p></div>
  }

  const notifications = [
    {
      key: 'auditComplete',
      title: 'Audit Completion',
      description: 'Get notified when your SEO audits are complete',
      value: notificationsData?.auditComplete !== false,
    },
    {
      key: 'weeklyDigest',
      title: 'Weekly Digest',
      description: 'Receive a weekly summary of all your audits and activity',
      value: notificationsData?.weeklyDigest !== false,
    },
    {
      key: 'teamInvitations',
      title: 'Team Invitations',
      description: 'Get notified when you're invited to collaborate on projects',
      value: notificationsData?.teamInvitations !== false,
    },
    {
      key: 'projectActivity',
      title: 'Project Activity',
      description: 'Receive updates about activity on your projects',
      value: notificationsData?.projectActivity !== false,
    },
  ]

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
      <p className="text-text-secondary mb-6">
        Choose which notifications you'd like to receive via email
      </p>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.key}
            className="flex items-start justify-between p-4 bg-background-secondary rounded-lg"
          >
            <div className="flex-1">
              <h3 className="font-medium mb-1">{notification.title}</h3>
              <p className="text-sm text-text-secondary">{notification.description}</p>
            </div>
            <button
              onClick={() => handleToggle(notification.key, !notification.value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notification.value ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notification.value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function IntegrationsTab({ profile }: { profile: any }) {
  const queryClient = useQueryClient()
  const [slackWebhook, setSlackWebhook] = useState(profile?.slackWebhookUrl || '')

  const updateSlackMutation = useMutation({
    mutationFn: (data: { webhookUrl: string | null }) => profileApi.updateSlack(data),
    onSuccess: () => {
      toast.success('Slack integration updated!')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => {
      toast.error('Failed to update Slack integration')
    },
  })

  const handleSaveSlack = () => {
    updateSlackMutation.mutate({ webhookUrl: slackWebhook || null })
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Slack Integration</h2>
        <p className="text-text-secondary mb-4">
          Get audit completion notifications in your Slack workspace
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Slack Webhook URL</label>
            <input
              type="url"
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="input w-full"
            />
            <p className="text-sm text-text-secondary mt-1">
              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Learn how to create a Slack webhook
              </a>
            </p>
          </div>

          <button
            onClick={handleSaveSlack}
            disabled={updateSlackMutation.isPending}
            className="btn-primary"
          >
            {updateSlackMutation.isPending ? 'Saving...' : 'Save Slack Integration'}
          </button>
        </div>
      </div>
    </div>
  )
}

