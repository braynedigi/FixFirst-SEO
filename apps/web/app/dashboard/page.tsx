'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditsApi, projectsApi, teamsApi, comparisonApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { formatDateTime, getScoreColor, getScoreGrade } from '@/lib/utils'
import { Plus, LogOut, Settings, BarChart3, Clock, CheckCircle2, AlertCircle, Trash2, RotateCcw, Shield, Calendar, Upload, FolderOpen, ExternalLink, Mail, Star, Filter, Copy, Check, Search, X, Tag as TagIcon, CreditCard, DollarSign, MessageSquare } from 'lucide-react'
import TrendChart from '@/components/TrendChart'
import ThemeToggle from '@/components/ThemeToggle'
import BulkUploadModal from '@/components/BulkUploadModal'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import NotificationBell from '@/components/NotificationBell'
import { useBranding } from '@/components/BrandingProvider'
import Image from 'next/image'

export default function DashboardPage() {
  const router = useRouter()
  const branding = useBranding()
  const queryClient = useQueryClient()
  const [showNewAuditModal, setShowNewAuditModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [projectFilter, setProjectFilter] = useState<'all' | 'favorites'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [auditStatusFilter, setAuditStatusFilter] = useState<'all' | 'COMPLETED' | 'FAILED' | 'RUNNING'>('all')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Get user role from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.role)
      } catch (error) {
        console.error('Failed to parse user data:', error)
      }
    }

    // Listen for command palette trigger
    const handleOpenNewAuditModal = () => {
      setShowNewAuditModal(true)
    }

    window.addEventListener('open-new-audit-modal', handleOpenNewAuditModal)
    return () => window.removeEventListener('open-new-audit-modal', handleOpenNewAuditModal)
  }, [router])

  const { data: audits, isLoading: auditsLoading, refetch: refetchAudits } = useQuery({
    queryKey: ['audits'],
    queryFn: async () => {
      const response = await auditsApi.getAll()
      return response.data
    },
    // WebSocket will handle real-time updates
    refetchInterval: false,
    staleTime: 30000, // 30 seconds
  })

  // Listen to WebSocket updates for running audits
  useEffect(() => {
    if (!audits) return

    const runningAudits = audits.filter((a: any) => a.status === 'QUEUED' || a.status === 'RUNNING')
    if (runningAudits.length === 0) return

    const { io } = require('socket.io-client')
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')

    socket.on('connect', () => {
      // Join rooms for all running audits
      runningAudits.forEach((audit: any) => {
        socket.emit('join-audit', audit.id)
      })
    })

    // Listen for any audit updates
    runningAudits.forEach((audit: any) => {
      socket.on(`audit:${audit.id}`, (update: any) => {
        // Refetch audits when status changes
        if (update.status === 'COMPLETED') {
          toast.success(`Audit for ${audit.url} completed! 🎉`)
          refetchAudits()
        } else if (update.status === 'FAILED') {
          toast.error(`Audit for ${audit.url} failed`)
          refetchAudits()
        }
      })
    })

    return () => {
      runningAudits.forEach((audit: any) => {
        socket.emit('leave-audit', audit.id)
      })
      socket.disconnect()
    }
  }, [audits, refetchAudits])

  const { data: projects, refetch: refetchProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectsApi.getAll()
      return response.data
    },
  })

  // Fetch pending invitations for the current user
  const { data: pendingInvitations = [], refetch: refetchInvitations } = useQuery({
    queryKey: ['my-invitations'],
    queryFn: async () => {
      const response = await teamsApi.getMyInvitations()
      return response.data
    },
  })

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: (projectId: string) => projectsApi.toggleFavorite(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project updated')
    },
    onError: () => {
      toast.error('Failed to update project')
    },
  })

  // Copy URL to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleAcceptInvitation = async (token: string, projectName: string) => {
    try {
      toast.loading('Accepting invitation...', { id: token })
      await teamsApi.acceptInvitation(token)
      toast.success(`Successfully joined ${projectName}!`, { id: token })
      refetchInvitations()
      refetchProjects()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to accept invitation', { id: token })
    }
  }

  const handleDeclineInvitation = async (invitationId: string, projectName: string) => {
    // For now, we can close the banner - in a full implementation, we'd have a decline endpoint
    toast.success(`Invitation to ${projectName} declined`)
    refetchInvitations()
  }

  // Get trend data from all completed audits
  const trendData = audits
    ?.filter((a: any) => a.status === 'COMPLETED' && a.totalScore !== null)
    ?.sort((a: any, b: any) => new Date(a.completedAt || a.startedAt).getTime() - new Date(b.completedAt || b.startedAt).getTime())
    ?.slice(-15) // Last 15 audits
    ?.map((audit: any) => ({
      date: audit.completedAt || audit.startedAt,
      totalScore: audit.totalScore,
      technical: audit.technicalScore,
      onPage: audit.onPageScore,
      structuredData: audit.structuredDataScore,
      performance: audit.performanceScore,
      localSeo: audit.localSeoScore,
    }))

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out')
    router.push('/')
  }

  const stats = {
    totalAudits: audits?.length || 0,
    completedAudits: audits?.filter((a: any) => a.status === 'COMPLETED').length || 0,
    avgScore: audits?.length
      ? Math.round(
          audits
            .filter((a: any) => a.totalScore)
            .reduce((sum: number, a: any) => sum + a.totalScore, 0) /
            audits.filter((a: any) => a.totalScore).length
        ) || 0
      : 0,
  }

  // Filter projects based on search and filter
  const filteredProjects = projects?.filter((project: any) => {
    // Search filter
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.domain.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Favorite filter
    const matchesFavorite = projectFilter === 'all' || project.isFavorite
    
    return matchesSearch && matchesFavorite
  }) || []

  // Filter audits based on search and status
  const filteredAudits = audits?.filter((audit: any) => {
    // Search filter
    const matchesSearch = !searchQuery || 
      audit.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.project?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Status filter
    const matchesStatus = auditStatusFilter === 'all' || audit.status === auditStatusFilter
    
    return matchesSearch && matchesStatus
  }) || []

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
          
          <nav className="space-y-2">
            <NavItem icon={<BarChart3 />} label="Dashboard" active />
            <NavItem icon={<BarChart3 />} label="Analytics" onClick={() => router.push('/analytics')} />
            <NavItem icon={<MessageSquare />} label="AI Assistant" onClick={() => router.push('/chat')} />
            <NavItem icon={<Calendar />} label="Scheduled Audits" onClick={() => router.push('/schedules')} />
            <NavItem icon={<Upload />} label="Bulk Upload" onClick={() => setShowBulkUploadModal(true)} />
            <NavItem icon={<CreditCard />} label="Billing" onClick={() => router.push('/billing')} />
            <NavItem icon={<Settings />} label="Settings" onClick={() => router.push('/settings')} />
            {userRole === 'ADMIN' && (
              <>
                <NavItem icon={<Shield />} label="Admin Panel" onClick={() => router.push('/admin')} />
                <NavItem icon={<Shield />} label="Custom Rules" onClick={() => router.push('/custom-rules')} />
              </>
            )}
          </nav>

          <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Log Out</span>
                </button>
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <ThemeToggle />
                </div>
              </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="p-3 bg-background-secondary rounded-lg border border-border">
              <p className="text-xs text-text-secondary mb-2">Keyboard Shortcuts</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Command Palette</span>
                  <kbd className="px-2 py-1 bg-background-card rounded border border-border">⌘K</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">New Audit</span>
                  <kbd className="px-2 py-1 bg-background-card rounded border border-border">N</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">New Project</span>
                  <kbd className="px-2 py-1 bg-background-card rounded border border-border">P</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Show All</span>
                  <kbd className="px-2 py-1 bg-background-card rounded border border-border">?</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">Dashboard</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowBulkUploadModal(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Bulk Upload
                </button>
                <button
                  onClick={() => setShowNewAuditModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Audit
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search projects and audits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Pending Invitations Banner */}
          {pendingInvitations && pendingInvitations.length > 0 && (
            <div className="mb-6 bg-primary/10 border border-primary/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-primary mb-2">
                    You have {pendingInvitations.length} pending invitation{pendingInvitations.length > 1 ? 's' : ''}!
                  </h3>
                  <div className="space-y-2">
                    {pendingInvitations.map((invitation: any) => (
                      <div key={invitation.id} className="flex items-center justify-between bg-background-card/50 rounded p-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{invitation.project.name}</p>
                          <p className="text-xs text-text-muted">
                            From {invitation.inviter.email} • Role: {invitation.role}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeclineInvitation(invitation.id, invitation.project.name)}
                            className="btn-secondary text-sm px-4 py-2"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAcceptInvitation(invitation.token, invitation.project.name)}
                            className="btn-primary text-sm px-4 py-2"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Audits"
              value={stats.totalAudits}
              icon={<BarChart3 className="w-5 h-5" />}
            />
            <StatCard
              title="Completed"
              value={stats.completedAudits}
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="success"
            />
            <StatCard
              title="Avg Score"
              value={stats.avgScore}
              icon={<BarChart3 className="w-5 h-5" />}
              suffix="/100"
            />
          </div>

          {/* Score Trends */}
          {trendData && trendData.length >= 2 && (
            <div className="card mb-8">
              <TrendChart 
                data={trendData} 
                showCategories
                height={350}
                title="Score Trends"
              />
            </div>
          )}

          {/* Recently Viewed Projects */}
          {projects && projects.filter((p: any) => p.lastViewedAt).length > 0 && (
            <div className="card mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recently Viewed
                </h3>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {projects
                  .filter((p: any) => p.lastViewedAt)
                  .sort((a: any, b: any) => 
                    new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime()
                  )
                  .slice(0, 5)
                  .map((project: any) => (
                    <div
                      key={project.id}
                      onClick={() => router.push(`/project/${project.id}`)}
                      className="flex-shrink-0 w-64 p-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold group-hover:text-primary transition-colors truncate flex-1">{project.name}</h4>
                        {project.isFavorite && <Star className="w-4 h-4 fill-warning text-warning flex-shrink-0 ml-2" />}
                      </div>
                      <p className="text-sm text-text-secondary truncate mb-2">{project.domain}</p>
                      <div className="text-xs text-text-muted">
                        Viewed {new Date(project.lastViewedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                My Projects
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-background-secondary rounded-lg p-1">
                  <button
                    onClick={() => setProjectFilter('all')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      projectFilter === 'all' 
                        ? 'bg-primary text-white' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setProjectFilter('favorites')}
                    className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                      projectFilter === 'favorites' 
                        ? 'bg-primary text-white' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Star className="w-3 h-3" />
                    Favorites
                  </button>
                </div>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>
            </div>

            {projects && projects.length > 0 ? (
              <>
                {filteredProjects.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects
                      .map((project: any) => (
                      <div
                        key={project.id}
                        className="p-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group relative"
                        onClick={() => router.push(`/project/${project.id}`)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavoriteMutation.mutate(project.id)
                          }}
                          className="absolute top-3 right-3 p-1 hover:bg-background-secondary rounded transition-colors z-10"
                        >
                          <Star 
                            className={`w-5 h-5 transition-colors ${
                              project.isFavorite 
                                ? 'fill-warning text-warning' 
                                : 'text-text-secondary hover:text-warning'
                            }`} 
                          />
                        </button>
                        <div className="flex items-start justify-between mb-2 pr-8">
                          <h4 className="font-semibold group-hover:text-primary transition-colors">{project.name}</h4>
                          <ExternalLink className="w-4 h-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-text-secondary mb-3 flex items-center gap-2">
                          <span className="truncate">{project.domain}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(project.domain, project.id)
                            }}
                            className="p-1 hover:bg-background-secondary rounded flex-shrink-0"
                            title="Copy domain"
                          >
                            {copiedId === project.id ? (
                              <Check className="w-3 h-3 text-success" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </p>
                        
                        {/* Tags */}
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {project.tags.slice(0, 3).map((tag: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                <TagIcon className="w-2.5 h-2.5" />
                                {tag.name}
                              </span>
                            ))}
                            {project.tags.length > 3 && (
                              <span className="text-xs text-text-secondary px-2 py-0.5">
                                +{project.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-text-secondary">
                          <span>{project._count?.audits || 0} audits</span>
                          <span>{project._count?.members || 1} members</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    {searchQuery ? (
                      <>
                        <Search className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                        <p className="text-text-secondary mb-4">No projects found matching "{searchQuery}"</p>
                        <button onClick={() => setSearchQuery('')} className="btn-secondary text-sm">
                          Clear Search
                        </button>
                      </>
                    ) : (
                      <>
                        <Star className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                        <p className="text-text-secondary mb-4">No favorite projects yet. Star a project to add it here!</p>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary mb-4">No projects yet. Create your first project!</p>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="btn-primary"
                >
                  Create First Project
                </button>
              </div>
            )}
          </div>

          {/* Recent Audits */}
          <div className="card">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Recent Audits</h3>
                
                {audits && audits.filter((a: any) => a.status === 'FAILED').length > 0 && (
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete all failed audits?')) {
                        try {
                          toast.loading('Deleting failed audits...', { id: 'delete-failed' })
                          await auditsApi.deleteFailed()
                          toast.success('Failed audits deleted!', { id: 'delete-failed' })
                          refetchAudits()
                        } catch (error) {
                          toast.error('Failed to delete audits', { id: 'delete-failed' })
                        }
                      }
                    }}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Failed Audits
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 bg-background-secondary rounded-lg p-1">
                <button
                  onClick={() => setAuditStatusFilter('all')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    auditStatusFilter === 'all' 
                      ? 'bg-primary text-white' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAuditStatusFilter('COMPLETED')}
                  className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                    auditStatusFilter === 'COMPLETED' 
                      ? 'bg-success text-white' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </button>
                <button
                  onClick={() => setAuditStatusFilter('RUNNING')}
                  className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                    auditStatusFilter === 'RUNNING' 
                      ? 'bg-primary text-white' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Running
                </button>
                <button
                  onClick={() => setAuditStatusFilter('FAILED')}
                  className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                    auditStatusFilter === 'FAILED' 
                      ? 'bg-error text-white' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  Failed
                </button>
              </div>
            </div>
            
            {auditsLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-text-secondary mt-4">Loading audits...</p>
              </div>
            ) : audits && audits.length > 0 ? (
              filteredAudits.length > 0 ? (
                <div className="space-y-4">
                  {filteredAudits.map((audit: any) => (
                  <AuditRow
                    key={audit.id}
                    audit={audit}
                    onClick={() => router.push(`/audit/${audit.id}`)}
                    onDelete={async () => {
                      if (confirm('Are you sure you want to delete this audit?')) {
                        try {
                          toast.loading('Deleting audit...', { id: `delete-${audit.id}` })
                          await auditsApi.delete(audit.id)
                          toast.success('Audit deleted!', { id: `delete-${audit.id}` })
                          refetchAudits()
                        } catch (error) {
                          toast.error('Failed to delete audit', { id: `delete-${audit.id}` })
                        }
                      }
                    }}
                    onRetry={async () => {
                      try {
                        toast.loading('Starting new audit...', { id: `retry-${audit.id}` })
                        const response = await auditsApi.create({ url: audit.url })
                        toast.success('New audit started!', { id: `retry-${audit.id}` })
                        router.push(`/audit/${response.data.auditId}`)
                      } catch (error) {
                        toast.error('Failed to start audit', { id: `retry-${audit.id}` })
                      }
                    }}
                  />
                ))}
              </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary mb-4">
                    No audits found matching your filters
                  </p>
                  <button 
                    onClick={() => {
                      setSearchQuery('')
                      setAuditStatusFilter('all')
                    }} 
                    className="btn-secondary text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary">No audits yet. Create your first audit!</p>
                <button
                  onClick={() => setShowNewAuditModal(true)}
                  className="btn-primary mt-4"
                >
                  Start First Audit
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Audit Modal */}
      {showNewAuditModal && (
        <NewAuditModal
          onClose={() => setShowNewAuditModal(false)}
          onSuccess={(auditId) => {
            setShowNewAuditModal(false)
            router.push(`/audit/${auditId}`)
          }}
        />
      )}

      {showBulkUploadModal && (
        <BulkUploadModal
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={() => {
            refetchAudits()
          }}
        />
      )}

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onSuccess={(projectId) => {
            setShowNewProjectModal(false)
            refetchProjects()
            toast.success('Project created!')
          }}
        />
      )}

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        onNewAudit={() => setShowNewAuditModal(true)}
        onNewProject={() => setShowNewProjectModal(true)}
        onBulkUpload={() => setShowBulkUploadModal(true)}
      />
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

function StatCard({
  title,
  value,
  icon,
  color = 'primary',
  suffix = '',
}: {
  title: string
  value: number
  icon: React.ReactNode
  color?: string
  suffix?: string
}) {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <span className="text-text-secondary text-sm">{title}</span>
        <span className={`text-${color}`}>{icon}</span>
      </div>
      <div className="text-3xl font-bold">
        {value}
        {suffix && <span className="text-lg text-text-secondary">{suffix}</span>}
      </div>
    </div>
  )
}

function AuditRow({ audit, onClick, onDelete, onRetry }: { audit: any; onClick: () => void; onDelete?: () => void; onRetry?: () => void }) {
  const statusConfig = {
    QUEUED: { label: 'Queued', icon: <Clock className="w-4 h-4" />, color: 'text-text-secondary' },
    RUNNING: { label: 'Running', icon: <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />, color: 'text-primary' },
    COMPLETED: { label: 'Completed', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-success' },
    FAILED: { label: 'Failed', icon: <AlertCircle className="w-4 h-4" />, color: 'text-error' },
  }

  const status = statusConfig[audit.status as keyof typeof statusConfig]

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-md">
      <div 
        onClick={onClick} 
        className="flex-1 cursor-pointer"
      >
        <div className="font-medium mb-1">{audit.url}</div>
        <div className="text-sm text-text-secondary">
          {audit.project?.name} • {formatDateTime(audit.startedAt)}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {audit.totalScore !== null && (
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(audit.totalScore)}`}>
              {audit.totalScore}
            </div>
            <div className="text-xs text-text-secondary">
              Grade {getScoreGrade(audit.totalScore)}
            </div>
          </div>
        )}

        <div className={`flex items-center gap-2 ${status.color}`}>
          {status.icon}
          <span className="text-sm">{status.label}</span>
        </div>

        {/* Action buttons for failed audits */}
        {audit.status === 'FAILED' && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRetry?.()
              }}
              className="p-2 hover:bg-background-secondary rounded-lg transition-colors text-primary hover:text-primary-light"
              title="Retry audit"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
              className="p-2 hover:bg-background-secondary rounded-lg transition-colors text-error hover:text-error/80"
              title="Delete audit"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function NewAuditModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (auditId: string) => void
}) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await auditsApi.create({ url })
      toast.success('Audit started!')
      onSuccess(response.data.auditId)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start audit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="card max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">New SEO Audit</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Website URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Starting...' : 'Start Audit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NewProjectModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (projectId: string) => void
}) {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await projectsApi.create({ name, domain })
      toast.success('Project created!')
      onSuccess(response.data.id)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="card max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Create New Project</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Website"
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="input"
              required
              disabled={loading}
            />
            <p className="text-xs text-text-secondary mt-1">
              Enter just the domain (without https://)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

