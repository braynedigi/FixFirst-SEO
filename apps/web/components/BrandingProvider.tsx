'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface BrandingSettings {
  appName: string
  logoUrl?: string | null
  faviconUrl?: string | null
  primaryColor?: string
  accentColor?: string
  footerText?: string
}

const BrandingContext = createContext<BrandingSettings | null>(null)

export function useBranding() {
  const context = useContext(BrandingContext)
  return context || {
    appName: 'FixFirst SEO',
    logoUrl: null,
    faviconUrl: null,
  }
}

export default function BrandingProvider({ children }: { children?: ReactNode }) {
  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/branding`)
      return response.data
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })

  useEffect(() => {
    if (!branding) return

    const brandingData = branding

        // Update favicon
        if (brandingData.faviconUrl) {
          // Remove existing favicon links
          const existingFavicons = document.querySelectorAll("link[rel*='icon']")
          existingFavicons.forEach(link => link.remove())

          // Add new favicon
          const link = document.createElement('link')
          link.rel = 'icon'
          link.href = brandingData.faviconUrl
          document.head.appendChild(link)

          // Also add apple-touch-icon
          const appleLink = document.createElement('link')
          appleLink.rel = 'apple-touch-icon'
          appleLink.href = brandingData.faviconUrl
          document.head.appendChild(appleLink)
        }

    // Update page title with app name
    if (brandingData.appName && brandingData.appName !== 'FixFirst SEO') {
      const titleParts = document.title.split('-')
      if (titleParts.length > 0) {
        document.title = `${brandingData.appName} - ${titleParts.slice(1).join('-').trim()}`
      }
    }

    // Apply custom colors to CSS variables
    if (brandingData.primaryColor || brandingData.accentColor) {
      const root = document.documentElement
      if (brandingData.primaryColor) {
        // Convert hex to RGB for the CSS variables
        const hex = brandingData.primaryColor.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        root.style.setProperty('--color-primary', `${r} ${g} ${b}`)
      }
      if (brandingData.accentColor) {
        const hex = brandingData.accentColor.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        root.style.setProperty('--color-accent', `${r} ${g} ${b}`)
      }
    }
  }, [branding])

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  )
}

