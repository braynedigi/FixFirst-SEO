'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { twoFactorApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Shield, Copy, Check, AlertCircle, Key, Download } from 'lucide-react'
import Image from 'next/image'

export default function SecurityTab() {
  const queryClient = useQueryClient()
  const [setupStep, setSetupStep] = useState<'initial' | 'setup' | 'verify'>('initial')
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  // Fetch 2FA status
  const { data: status, isLoading } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      const response = await twoFactorApi.getStatus()
      return response.data
    },
  })

  // Setup 2FA
  const setupMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await twoFactorApi.setup(email)
      return response.data
    },
    onSuccess: (data) => {
      setQrCodeData(data.qrCodeDataUrl)
      setSecret(data.secret)
      setSetupStep('setup')
    },
    onError: () => {
      toast.error('Failed to setup 2FA')
    },
  })

  // Enable 2FA
  const enableMutation = useMutation({
    mutationFn: async ({ secret, token }: { secret: string; token: string }) => {
      const response = await twoFactorApi.enable(secret, token)
      return response.data
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes)
      setShowBackupCodes(true)
      setSetupStep('verify')
      toast.success('2FA enabled successfully!')
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to enable 2FA'
      toast.error(message)
    },
  })

  // Disable 2FA
  const disableMutation = useMutation({
    mutationFn: async (token: string) => {
      await twoFactorApi.disable(token)
    },
    onSuccess: () => {
      toast.success('2FA disabled successfully!')
      setDisableCode('')
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to disable 2FA'
      toast.error(message)
    },
  })

  // Regenerate backup codes
  const regenerateCodesMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await twoFactorApi.regenerateBackupCodes(token)
      return response.data
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes)
      setShowBackupCodes(true)
      toast.success('Backup codes regenerated!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to regenerate backup codes'
      toast.error(message)
    },
  })

  const handleStartSetup = () => {
    const email = localStorage.getItem('userEmail') || 'user@example.com' // Get from auth context
    setupMutation.mutate(email)
  }

  const handleVerifyAndEnable = () => {
    if (!secret || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }
    enableMutation.mutate({ secret, token: verificationCode })
  }

  const handleDisable = () => {
    if (!disableCode) {
      toast.error('Please enter your 2FA code')
      return
    }
    disableMutation.mutate(disableCode)
  }

  const copyToClipboard = (text: string, setCopied: (val: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fixfirst-seo-backup-codes.txt'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Backup codes downloaded!')
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6" />
              Two-Factor Authentication (2FA)
            </h2>
            <p className="text-text-secondary">
              Add an extra layer of security to your account
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            status?.enabled 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {status?.enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {status?.enabled && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-400">
              <p className="font-medium">2FA is active on your account</p>
              <p className="text-blue-300/80">You have {status?.remainingBackupCodes || 0} backup codes remaining</p>
            </div>
          </div>
        )}
      </div>

      {/* Setup or Manage 2FA */}
      {!status?.enabled && setupStep === 'initial' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Enable 2FA</h3>
          <p className="text-text-secondary mb-6">
            We recommend using an authenticator app like Google Authenticator, Authy, or 1Password.
          </p>
          <button
            onClick={handleStartSetup}
            disabled={setupMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <Shield className="w-5 h-5" />
            {setupMutation.isPending ? 'Setting up...' : 'Setup 2FA'}
          </button>
        </div>
      )}

      {/* Setup Step: Scan QR Code */}
      {setupStep === 'setup' && qrCodeData && secret && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>
          <p className="text-text-secondary mb-6">
            Scan this QR code with your authenticator app, or enter the secret key manually.
          </p>

          {/* QR Code */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-white p-4 rounded-lg">
              <Image
                src={qrCodeData}
                alt="2FA QR Code"
                width={200}
                height={200}
              />
            </div>
          </div>

          {/* Manual Secret */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Secret Key (manual entry)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={secret}
                readOnly
                className="input flex-1 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(secret, setCopiedSecret)}
                className="btn-secondary flex items-center gap-2"
              >
                {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Verification Code */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Enter Verification Code</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="input w-full font-mono text-lg tracking-wider text-center"
              maxLength={6}
            />
            <p className="text-sm text-text-secondary mt-1">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleVerifyAndEnable}
              disabled={enableMutation.isPending || verificationCode.length !== 6}
              className="btn-primary flex-1"
            >
              {enableMutation.isPending ? 'Verifying...' : 'Verify and Enable'}
            </button>
            <button
              onClick={() => {
                setSetupStep('initial')
                setQrCodeData(null)
                setSecret(null)
                setVerificationCode('')
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Backup Codes Display */}
      {showBackupCodes && backupCodes.length > 0 && (
        <div className="card border-2 border-yellow-500/50">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-1">Save Your Backup Codes</h3>
              <p className="text-text-secondary">
                Store these codes in a safe place. Each code can only be used once.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 p-4 bg-background-secondary rounded-lg">
            {backupCodes.map((code, index) => (
              <div key={index} className="font-mono text-sm py-2 px-3 bg-background-card rounded border border-border">
                {code}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadBackupCodes}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Codes
            </button>
            <button
              onClick={() => copyToClipboard(backupCodes.join('\n'), setCopiedCodes)}
              className="btn-secondary flex items-center gap-2"
            >
              {copiedCodes ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy All
            </button>
            <button
              onClick={() => setShowBackupCodes(false)}
              className="btn-secondary ml-auto"
            >
              I've Saved Them
            </button>
          </div>
        </div>
      )}

      {/* Manage 2FA (when enabled) */}
      {status?.enabled && setupStep === 'initial' && (
        <>
          {/* Regenerate Backup Codes */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Backup Codes</h3>
            <p className="text-text-secondary mb-4">
              You have {status?.remainingBackupCodes || 0} backup codes remaining. Generate new codes if you've used all of them.
            </p>
            <button
              onClick={() => {
                const code = prompt('Enter your 2FA code to regenerate backup codes:')
                if (code) regenerateCodesMutation.mutate(code)
              }}
              disabled={regenerateCodesMutation.isPending}
              className="btn-secondary flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              {regenerateCodesMutation.isPending ? 'Generating...' : 'Regenerate Backup Codes'}
            </button>
          </div>

          {/* Disable 2FA */}
          <div className="card border border-red-500/20">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Disable 2FA</h3>
            <p className="text-text-secondary mb-4">
              Disabling 2FA will make your account less secure. Enter your 2FA code to confirm.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="input flex-1 font-mono text-lg tracking-wider text-center"
                maxLength={6}
              />
              <button
                onClick={handleDisable}
                disabled={disableMutation.isPending || disableCode.length !== 6}
                className="btn-primary bg-red-500 hover:bg-red-600"
              >
                {disableMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

