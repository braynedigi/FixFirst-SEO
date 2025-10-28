'use client'

import { useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function BrandingProvider() {
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/branding`)
        const branding = response.data

        // Update favicon
        if (branding.faviconUrl) {
          // Remove existing favicon links
          const existingFavicons = document.querySelectorAll("link[rel*='icon']")
          existingFavicons.forEach(link => link.remove())

          // Add new favicon
          const link = document.createElement('link')
          link.rel = 'icon'
          link.href = branding.faviconUrl
          document.head.appendChild(link)

          // Also add apple-touch-icon
          const appleLink = document.createElement('link')
          appleLink.rel = 'apple-touch-icon'
          appleLink.href = branding.faviconUrl
          document.head.appendChild(appleLink)
        }

        // Update page title with app name
        if (branding.appName && branding.appName !== 'FixFirst SEO') {
          const titleParts = document.title.split('-')
          if (titleParts.length > 0) {
            document.title = `${branding.appName} - ${titleParts.slice(1).join('-').trim()}`
          }
        }

        // Apply custom colors to CSS variables
        if (branding.primaryColor || branding.accentColor) {
          const root = document.documentElement
          if (branding.primaryColor) {
            // Convert hex to RGB for the CSS variables
            const hex = branding.primaryColor.replace('#', '')
            const r = parseInt(hex.substring(0, 2), 16)
            const g = parseInt(hex.substring(2, 4), 16)
            const b = parseInt(hex.substring(4, 6), 16)
            root.style.setProperty('--color-primary', `${r} ${g} ${b}`)
          }
          if (branding.accentColor) {
            const hex = branding.accentColor.replace('#', '')
            const r = parseInt(hex.substring(0, 2), 16)
            const g = parseInt(hex.substring(2, 4), 16)
            const b = parseInt(hex.substring(4, 6), 16)
            root.style.setProperty('--color-accent', `${r} ${g} ${b}`)
          }
        }
      } catch (error) {
        console.error('Failed to fetch branding:', error)
      }
    }

    fetchBranding()
  }, [])

  return null // This component doesn't render anything
}

