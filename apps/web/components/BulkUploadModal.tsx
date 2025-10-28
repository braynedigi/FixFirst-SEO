'use client';

import { useState } from 'react';
import { bulkAuditsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface BulkUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkUploadModal({ onClose, onSuccess }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const response = await bulkAuditsApi.uploadCSV(file);
      const data = response.data;
      
      // Transform backend response to match modal UI expectations
      const successResults = data.details.filter((d: any) => d.status === 'QUEUED');
      const errors = data.details.filter((d: any) => d.status === 'FAILED');
      
      const transformedResults = {
        totalProcessed: data.details.length,
        successCount: successResults.length,
        errorCount: errors.length,
        results: successResults.map((r: any, idx: number) => ({
          row: idx + 1,
          url: r.url,
          auditId: r.auditId,
        })),
        errors: errors.map((r: any, idx: number) => ({
          row: idx + 1,
          url: r.url,
          error: r.message || 'Failed to process',
        })),
      };
      
      setResults(transformedResults);
      
      if (successResults.length > 0) {
        toast.success(`${successResults.length} audits queued successfully!`);
        onSuccess();
      }
      
      if (errors.length > 0) {
        toast.error(`${errors.length} URLs failed to process`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload file');
      console.error('Upload error:', error.response?.data);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Bulk Audit Upload</h2>
            <p className="text-text-secondary text-sm">Upload a CSV file with multiple URLs to audit</p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl">&times;</button>
        </div>

        {!results ? (
          <>
            {/* Download Template */}
            <div className="mb-6 p-4 bg-background-secondary rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">CSV Format</h3>
                  <p className="text-sm text-text-secondary mb-3">
                    Your CSV must have a <code className="px-1 py-0.5 bg-background-card rounded">url</code> column. 
                    Optionally include a <code className="px-1 py-0.5 bg-background-card rounded">name</code> column for project names.
                  </p>
                  <button
                    onClick={() => bulkAuditsApi.downloadTemplate()}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upload CSV File</label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <span className="btn-primary inline-block">
                      Choose File
                    </span>
                  </label>
                  {file && (
                    <p className="mt-3 text-sm text-text-secondary">
                      Selected: <span className="text-text-primary font-medium">{file.name}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="btn-primary min-w-[120px] disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Upload & Process'
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-background-secondary rounded-lg border border-border">
                  <p className="text-sm text-text-secondary mb-1">Total URLs</p>
                  <p className="text-2xl font-bold">{results.totalProcessed}</p>
                </div>
                <div className="p-4 bg-success/20 rounded-lg border border-success/40">
                  <p className="text-sm text-success mb-1">Queued</p>
                  <p className="text-2xl font-bold text-success">{results.successCount}</p>
                </div>
                <div className="p-4 bg-error/20 rounded-lg border border-error/40">
                  <p className="text-sm text-error mb-1">Failed</p>
                  <p className="text-2xl font-bold text-error">{results.errorCount}</p>
                </div>
              </div>

              {/* Success List */}
              {results.results && results.results.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    Successfully Queued ({results.results.length})
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {results.results.map((result: any, idx: number) => (
                      <div key={idx} className="p-3 bg-success/10 rounded-lg border border-success/20 text-sm">
                        <p className="text-success font-medium">Row {result.row}: {result.url}</p>
                        <p className="text-xs text-text-secondary mt-1">Audit ID: {result.auditId}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error List */}
              {results.errors && results.errors.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-error" />
                    Errors ({results.errors.length})
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {results.errors.map((error: any, idx: number) => (
                      <div key={idx} className="p-3 bg-error/10 rounded-lg border border-error/20 text-sm">
                        <p className="text-error font-medium">Row {error.row}</p>
                        <p className="text-xs text-text-secondary mt-1">{error.url || 'Invalid URL'}</p>
                        <p className="text-xs text-error mt-1">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button onClick={onClose} className="btn-primary">
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

