'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsApi, projectsApi } from '@/lib/api'
import { Search, BarChart3, FileText, Settings, Shield, TrendingUp, LogOut, X, Calendar, Upload } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  category: 'navigation' | 'audits' | 'projects' | 'actions'
  keywords?: string[]
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

  // Get user role from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.role)
      } catch (error) {
        console.error('Failed to parse user data:', error)
      }
    }
  }, [])

  // Fetch data for search
  const { data: audits } = useQuery({
    queryKey: ['audits'],
    queryFn: async () => {
      const response = await auditsApi.getAll()
      return response.data
    },
    enabled: isOpen,
  })

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectsApi.getAll()
      return response.data
    },
    enabled: isOpen,
  })

  // Global keyboard listener for Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
        setSearchQuery('')
        setSelectedIndex(0)
      }

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchQuery('')
        setSelectedIndex(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Build command list
  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View your dashboard',
      icon: <BarChart3 className="w-5 h-5" />,
      action: () => {
        router.push('/dashboard')
        setIsOpen(false)
      },
      category: 'navigation',
      keywords: ['home', 'main', 'overview'],
    },
    {
      id: 'nav-schedules',
      label: 'Go to Scheduled Audits',
      description: 'Manage recurring audits',
      icon: <Calendar className="w-5 h-5" />,
      action: () => {
        router.push('/schedules')
        setIsOpen(false)
      },
      category: 'navigation',
      keywords: ['scheduled', 'recurring', 'automation', 'cron'],
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'Manage your account',
      icon: <Settings className="w-5 h-5" />,
      action: () => {
        router.push('/settings')
        setIsOpen(false)
      },
      category: 'navigation',
      keywords: ['profile', 'preferences', 'account'],
    },
    // Admin Panel (only for admins)
    ...(userRole === 'ADMIN' ? [{
      id: 'nav-admin',
      label: 'Go to Admin Panel',
      description: 'Manage users and rules',
      icon: <Shield className="w-5 h-5" />,
      action: () => {
        router.push('/admin')
        setIsOpen(false)
      },
      category: 'navigation' as const,
      keywords: ['admin', 'manage', 'users'],
    }] : []),
    // Actions
    {
      id: 'action-new-audit',
      label: 'Start New Audit',
      description: 'Create a new SEO audit',
      icon: <TrendingUp className="w-5 h-5" />,
      action: () => {
        router.push('/dashboard')
        setIsOpen(false)
        // Trigger new audit modal after navigation
        setTimeout(() => {
          const event = new CustomEvent('open-new-audit-modal')
          window.dispatchEvent(event)
        }, 100)
      },
      category: 'actions',
      keywords: ['create', 'start', 'run'],
    },
    {
      id: 'action-logout',
      label: 'Log Out',
      description: 'Sign out of your account',
      icon: <LogOut className="w-5 h-5" />,
      action: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/')
        setIsOpen(false)
      },
      category: 'actions',
      keywords: ['sign out', 'exit'],
    },
    // Recent Audits
    ...(audits?.slice(0, 5).map((audit: any) => ({
      id: `audit-${audit.id}`,
      label: audit.url,
      description: `Score: ${audit.totalScore || 'Pending'} • ${formatDateTime(audit.startedAt)}`,
      icon: <FileText className="w-5 h-5" />,
      action: () => {
        router.push(`/audit/${audit.id}`)
        setIsOpen(false)
      },
      category: 'audits' as const,
      keywords: [audit.url, audit.status, audit.totalScore?.toString()],
    })) || []),
    // Projects
    ...(projects?.map((project: any) => ({
      id: `project-${project.id}`,
      label: project.name,
      description: `${project.domain}`,
      icon: <FileText className="w-5 h-5" />,
      action: () => {
        // Navigate to dashboard and filter by project (future enhancement)
        router.push('/dashboard')
        setIsOpen(false)
      },
      category: 'projects' as const,
      keywords: [project.name, project.domain],
    })) || []),
  ]

  // Filter commands based on search query
  const filteredCommands = commands.filter(cmd => {
    const query = searchQuery.toLowerCase()
    const labelMatch = cmd.label.toLowerCase().includes(query)
    const descMatch = cmd.description?.toLowerCase().includes(query)
    const keywordMatch = cmd.keywords?.some(k => k.toLowerCase().includes(query))
    return labelMatch || descMatch || keywordMatch
  })

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = []
    }
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, Command[]>)

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault()
        filteredCommands[selectedIndex].action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands])

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  if (!isOpen) return null

  const categoryLabels = {
    navigation: 'Navigation',
    actions: 'Actions',
    audits: 'Recent Audits',
    projects: 'Projects',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
        <div
          className="w-full max-w-2xl bg-background-card border border-border rounded-lg shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-text-secondary flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commands, audits, projects..."
              className="flex-1 bg-transparent text-text-primary placeholder-text-secondary outline-none text-base"
              autoFocus
            />
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <kbd className="px-2 py-1 bg-background-secondary rounded border border-border">ESC</kbd>
              <span>to close</span>
            </div>
          </div>

          {/* Command List */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No results found for "{searchQuery}"</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} className="mb-4">
                  <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </div>
                  <div className="space-y-1">
                    {cmds.map((cmd, index) => {
                      const globalIndex = filteredCommands.indexOf(cmd)
                      const isSelected = globalIndex === selectedIndex

                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                            isSelected
                              ? 'bg-primary/20 border border-primary/50 text-primary'
                              : 'text-text-primary hover:bg-background-secondary'
                          }`}
                        >
                          <div className={`flex-shrink-0 ${isSelected ? 'text-primary' : 'text-text-secondary'}`}>
                            {cmd.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{cmd.label}</div>
                            {cmd.description && (
                              <div className="text-sm text-text-secondary truncate">
                                {cmd.description}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <kbd className="px-2 py-1 text-xs bg-primary/20 rounded border border-primary/50">
                              ↵
                            </kbd>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Hints */}
          <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-text-secondary bg-background-secondary">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background-card rounded border border-border">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-background-card rounded border border-border">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background-card rounded border border-border">↵</kbd>
                Select
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 bg-background-card rounded border border-border">⌘K</kbd>
              <span>to toggle</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

