import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import CommandPalette from '@/components/CommandPalette'
import BrandingProvider from '@/components/BrandingProvider'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FixFirst SEO - Comprehensive Website Analysis | brayne Smart Solutions',
  description: 'Powered by brayne Smart Solutions. Analyze your website with our comprehensive SEO audit tool. Get actionable insights on technical SEO, on-page optimization, performance, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BrandingProvider />
        <ThemeProvider>
          <Providers>
            {children}
            <CommandPalette />
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'bg-background-card border border-border text-text-primary',
                duration: 4000,
              }}
            />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}

