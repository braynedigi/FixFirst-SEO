'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [projectName, setProjectName] = useState('');

  // Accept invitation mutation
  const acceptMutation = useMutation({
    mutationFn: () => teamsApi.acceptInvitation(token),
    onSuccess: (response) => {
      setStatus('success');
      setProjectName(response.data.project.name);
      setMessage('You have successfully joined the project!');
      toast.success('Successfully joined the project!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    },
    onError: (error: any) => {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Failed to accept invitation');
    },
  });

  useEffect(() => {
    // Auto-accept on mount if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setStatus('error');
      setMessage('Please log in to accept this invitation');
      setTimeout(() => {
        router.push(`/login?redirect=/invite/${params.token}`);
      }, 2000);
    } else {
      acceptMutation.mutate();
    }
  }, [params.token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-dark via-background to-background-light flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-background-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {status === 'loading' && (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-error" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-text-primary">
              {status === 'loading' && 'Processing Invitation...'}
              {status === 'success' && 'Welcome Aboard!'}
              {status === 'error' && 'Invitation Error'}
            </h1>

            <p className="text-text-muted">
              {status === 'loading' && 'Please wait while we process your invitation...'}
              {status === 'success' && (
                <>
                  {message}
                  {projectName && (
                    <span className="block mt-2 font-semibold text-primary">
                      Project: {projectName}
                    </span>
                  )}
                </>
              )}
              {status === 'error' && message}
            </p>

            {status === 'success' && (
              <div className="pt-4">
                <p className="text-sm text-text-muted mb-4">
                  Redirecting to dashboard in 3 seconds...
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-primary w-full"
                >
                  Go to Dashboard Now
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="pt-4 space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="btn-primary w-full"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="btn-secondary w-full"
                >
                  Back to Home
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-text-muted">
            <Mail className="w-4 h-4 inline mr-1" />
            Team Invitation
          </p>
        </div>
      </div>
    </div>
  );
}

