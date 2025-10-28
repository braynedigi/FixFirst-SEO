'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface KeyboardShortcutsProps {
  onNewAudit?: () => void
  onNewProject?: () => void
  onBulkUpload?: () => void
}

export default function KeyboardShortcuts({ 
  onNewAudit, 
  onNewProject,
  onBulkUpload 
}: KeyboardShortcutsProps) {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return
      }

      // Global shortcuts (no modifier keys)
      switch (e.key.toLowerCase()) {
        case 'n':
          if (onNewAudit) {
            e.preventDefault()
            onNewAudit()
            toast.success('Opening new audit modal...', { icon: '⚡', duration: 1000 })
          }
          break
        case 'p':
          if (onNewProject) {
            e.preventDefault()
            onNewProject()
            toast.success('Opening new project modal...', { icon: '⚡', duration: 1000 })
          }
          break
        case 'b':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (onBulkUpload) {
              onBulkUpload()
              toast.success('Opening bulk upload...', { icon: '⚡', duration: 1000 })
            }
          }
          break
        case 'g':
          // Navigation shortcuts with 'g' prefix
          if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault()
            // Listen for next key
            const nextKeyHandler = (nextE: KeyboardEvent) => {
              const nextKey = nextE.key.toLowerCase()
              switch (nextKey) {
                case 'd':
                  router.push('/dashboard')
                  toast.success('Going to Dashboard...', { icon: '🏠', duration: 1000 })
                  break
                case 's':
                  router.push('/settings')
                  toast.success('Going to Settings...', { icon: '⚙️', duration: 1000 })
                  break
                case 'a':
                  router.push('/admin')
                  toast.success('Going to Admin...', { icon: '👑', duration: 1000 })
                  break
                case 'p':
                  router.push('/profile')
                  toast.success('Going to Profile...', { icon: '👤', duration: 1000 })
                  break
                case 'h':
                  router.push('/')
                  toast.success('Going Home...', { icon: '🏠', duration: 1000 })
                  break
              }
              document.removeEventListener('keydown', nextKeyHandler)
            }
            document.addEventListener('keydown', nextKeyHandler, { once: true })
          }
          break
        case '?':
          if (e.shiftKey) {
            e.preventDefault()
            showShortcutsHelp()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router, onNewAudit, onNewProject, onBulkUpload])

  return null
}

function showShortcutsHelp() {
  const shortcuts = [
    { key: 'Cmd/Ctrl + K', action: 'Open command palette' },
    { key: 'N', action: 'New audit' },
    { key: 'P', action: 'New project' },
    { key: 'Cmd/Ctrl + B', action: 'Bulk upload' },
    { key: 'G then D', action: 'Go to Dashboard' },
    { key: 'G then S', action: 'Go to Settings' },
    { key: 'G then A', action: 'Go to Admin' },
    { key: 'G then P', action: 'Go to Profile' },
    { key: 'G then H', action: 'Go to Home' },
    { key: 'Esc', action: 'Close modal/dialog' },
    { key: '?', action: 'Show this help' },
  ]

  const helpMessage = shortcuts
    .map(s => `<div class="flex justify-between gap-4 mb-2">
      <kbd class="px-2 py-1 bg-background-secondary rounded text-xs border border-border">${s.key}</kbd>
      <span class="text-sm">${s.action}</span>
    </div>`)
    .join('')

  toast.custom((t) => (
    <div className={`${
      t.visible ? 'animate-enter' : 'animate-leave'
    } max-w-md w-full bg-background-card shadow-lg rounded-lg pointer-events-auto border border-border p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">⌨️ Keyboard Shortcuts</h3>
        <button 
          onClick={() => toast.dismiss(t.id)}
          className="text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <div dangerouslySetInnerHTML={{ __html: helpMessage }} />
      </div>
    </div>
  ), {
    duration: 10000,
    position: 'top-center',
  })
}

