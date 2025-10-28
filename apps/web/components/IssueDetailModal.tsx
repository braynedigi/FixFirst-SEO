'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import IssueComments from '@/components/IssueComments';

interface IssueDetailModalProps {
  issue: any;
  currentUserEmail: string;
  onClose: () => void;
}

export default function IssueDetailModal({ issue, currentUserEmail, onClose }: IssueDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!mounted) return null;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="w-5 h-5" />;
      case 'WARNING':
        return <Info className="w-5 h-5" />;
      default:
        return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-error/10 text-error border-error/20';
      case 'WARNING':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-info/10 text-info border-info/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background-card border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-2">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(issue.severity)}`}>
                {getSeverityIcon(issue.severity)}
                {issue.severity}
              </span>
              <span className="text-sm text-text-muted">{issue.rule.category}</span>
            </div>
            <h2 className="text-xl font-bold text-text-primary">{issue.rule.name}</h2>
            <p className="text-sm text-text-muted mt-1">{issue.rule.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-light rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Issue Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">Issue</h3>
              <p className="text-text-muted">{issue.message}</p>
            </div>

            {issue.pageUrl && (
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">Affected Page</h3>
                <a
                  href={issue.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm break-all"
                >
                  {issue.pageUrl}
                </a>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">How to Fix</h3>
              <div className="bg-background-light border border-border rounded-lg p-4">
                <p className="text-text-primary whitespace-pre-wrap">{issue.recommendation}</p>
              </div>
            </div>

            {issue.metadata && Object.keys(issue.metadata).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">Additional Details</h3>
                <div className="bg-background-light border border-border rounded-lg p-4">
                  <pre className="text-xs text-text-muted overflow-x-auto">
                    {JSON.stringify(issue.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t border-border pt-6">
            <IssueComments issueId={issue.id} currentUserEmail={currentUserEmail} />
          </div>
        </div>
      </div>
    </div>
  );
}

