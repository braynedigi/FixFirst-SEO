'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { MessageSquare, Send, Edit2, Trash2, X, Check } from 'lucide-react';

interface IssueCommentsProps {
  issueId: string;
  currentUserEmail: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
  };
}

export default function IssueComments({ issueId, currentUserEmail }: IssueCommentsProps) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', issueId],
    queryFn: async () => {
      const response = await commentsApi.getForIssue(issueId);
      return response.data as Comment[];
    },
  });

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: (content: string) => commentsApi.create(issueId, content),
    onSuccess: () => {
      toast.success('Comment added');
      queryClient.invalidateQueries({ queryKey: ['comments', issueId] });
      setNewComment('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add comment');
    },
  });

  // Update comment mutation
  const updateMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentsApi.update(commentId, content),
    onSuccess: () => {
      toast.success('Comment updated');
      queryClient.invalidateQueries({ queryKey: ['comments', issueId] });
      setEditingId(null);
      setEditContent('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update comment');
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => commentsApi.delete(commentId),
    onSuccess: () => {
      toast.success('Comment deleted');
      queryClient.invalidateQueries({ queryKey: ['comments', issueId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete comment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createMutation.mutate(newComment);
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return;
    updateMutation.mutate({ commentId, content: editContent });
  };

  const handleDelete = (commentId: string) => {
    if (confirm('Delete this comment?')) {
      deleteMutation.mutate(commentId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-text-primary">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h4>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-8 text-text-muted">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-text-muted bg-background-card border border-border rounded-lg">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 text-text-muted/50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-background-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {comment.user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">
                      {comment.user.email}
                      {comment.user.email === currentUserEmail && (
                        <span className="ml-2 text-xs text-text-muted">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted">{formatDate(comment.createdAt)}</p>
                  </div>
                </div>

                {comment.user.email === currentUserEmail && editingId !== comment.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(comment)}
                      className="p-1.5 hover:bg-background-light rounded transition-colors"
                      title="Edit comment"
                    >
                      <Edit2 className="w-4 h-4 text-text-muted" />
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-1.5 hover:bg-error/10 rounded transition-colors"
                      title="Delete comment"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                    </button>
                  </div>
                )}
              </div>

              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 bg-background-dark border border-border rounded-lg text-text-primary focus:border-primary focus:outline-none resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(comment.id)}
                      disabled={updateMutation.isPending || !editContent.trim()}
                      className="btn-primary text-sm py-1 px-3 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn-secondary text-sm py-1 px-3 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-text-primary whitespace-pre-wrap">{comment.content}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="bg-background-card border border-border rounded-lg p-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full px-3 py-2 bg-background-dark border border-border rounded-lg text-text-primary placeholder-text-muted focus:border-primary focus:outline-none resize-none mb-3"
          rows={3}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createMutation.isPending || !newComment.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {createMutation.isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}

