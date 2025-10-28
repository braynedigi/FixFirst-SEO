'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Users, Mail, UserPlus, X, Trash2, Shield, Eye, Edit3, LogOut } from 'lucide-react';

interface TeamManagementProps {
  projectId: string;
  isOwner: boolean;
  isAdmin: boolean;
  currentUserId: string;
}

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  inviter: {
    email: string;
  };
}

export default function TeamManagement({ projectId, isOwner, isAdmin, currentUserId }: TeamManagementProps) {
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');

  // Fetch members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members', projectId],
    queryFn: async () => {
      const response = await teamsApi.getMembers(projectId);
      return response.data as Member[];
    },
  });

  // Fetch invitations
  const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: ['team-invitations', projectId],
    queryFn: async () => {
      if (!isOwner && !isAdmin) return [];
      const response = await teamsApi.getInvitations(projectId);
      return response.data as Invitation[];
    },
    enabled: isOwner || isAdmin,
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      teamsApi.inviteMember(projectId, data),
    onSuccess: (response) => {
      const invitationUrl = response.data.invitationUrl;
      toast.success('Invitation sent successfully!');
      
      // Copy invitation URL to clipboard
      if (invitationUrl && navigator.clipboard) {
        navigator.clipboard.writeText(invitationUrl).then(() => {
          toast.success('Invitation link copied to clipboard!', { duration: 4000 });
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['team-invitations', projectId] });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: string) =>
      teamsApi.cancelInvitation(projectId, invitationId),
    onSuccess: () => {
      toast.success('Invitation cancelled');
      queryClient.invalidateQueries({ queryKey: ['team-invitations', projectId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel invitation');
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      teamsApi.updateMemberRole(projectId, memberId, role),
    onSuccess: () => {
      toast.success('Role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', projectId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update role');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      teamsApi.removeMember(projectId, memberId),
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', projectId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove member');
    },
  });

  // Leave project mutation
  const leaveProjectMutation = useMutation({
    mutationFn: () => teamsApi.leaveProject(projectId),
    onSuccess: () => {
      toast.success('You have left the project');
      window.location.href = '/dashboard';
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to leave project');
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Shield className="w-4 h-4 text-primary" />;
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-accent" />;
      case 'MEMBER':
        return <Edit3 className="w-4 h-4 text-warning" />;
      case 'VIEWER':
        return <Eye className="w-4 h-4 text-text-muted" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'ADMIN':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'MEMBER':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'VIEWER':
        return 'bg-text-muted/10 text-text-muted border-text-muted/20';
      default:
        return 'bg-background-card text-text-primary border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-xl font-semibold text-text-primary">Team Members</h3>
            <p className="text-sm text-text-muted">
              Manage who has access to this project
            </p>
          </div>
        </div>
        {(isOwner || isAdmin) && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-background-card border border-border rounded-lg overflow-hidden">
        {loadingMembers ? (
          <div className="p-8 text-center text-text-muted">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No members yet</div>
        ) : (
          <div className="divide-y divide-border">
            {members.map((member) => (
              <div key={member.id} className="p-4 hover:bg-background-light transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {member.user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-primary">{member.user.email}</p>
                        {member.userId === currentUserId && (
                          <span className="text-xs text-text-muted">(You)</span>
                        )}
                      </div>
                      <p className="text-sm text-text-muted">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Role Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(member.role)}`}>
                      {getRoleIcon(member.role)}
                      {member.role}
                    </div>

                    {/* Actions */}
                    {isOwner && member.role !== 'OWNER' && (
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => updateRoleMutation.mutate({ memberId: member.id, role: e.target.value })}
                          className="px-2 py-1 rounded bg-background-dark border border-border text-sm text-text-primary"
                          disabled={updateRoleMutation.isPending}
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="MEMBER">Member</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                        <button
                          onClick={() => {
                            if (confirm('Remove this member?')) {
                              removeMemberMutation.mutate(member.id);
                            }
                          }}
                          className="p-2 hover:bg-error/10 text-error rounded transition-colors"
                          disabled={removeMemberMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {!isOwner && member.userId === currentUserId && member.role !== 'OWNER' && (
                      <button
                        onClick={() => {
                          if (confirm('Leave this project?')) {
                            leaveProjectMutation.mutate();
                          }
                        }}
                        className="btn-secondary text-error flex items-center gap-2"
                        disabled={leaveProjectMutation.isPending}
                      >
                        <LogOut className="w-4 h-4" />
                        Leave
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {(isOwner || isAdmin) && invitations.length > 0 && (
        <div className="bg-background-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 bg-background-light border-b border-border">
            <h4 className="font-semibold text-text-primary flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Pending Invitations ({invitations.length})
            </h4>
          </div>
          <div className="divide-y divide-border">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-4 hover:bg-background-light transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{invitation.email}</p>
                    <p className="text-sm text-text-muted">
                      Invited by {invitation.inviter.email} • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(invitation.role)}`}>
                      {invitation.role}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm('Cancel this invitation?')) {
                          cancelInvitationMutation.mutate(invitation.id);
                        }
                      }}
                      className="p-2 hover:bg-error/10 text-error rounded transition-colors"
                      disabled={cancelInvitationMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-card border border-border rounded-lg p-6 max-w-md w-full m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-background-light rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-background-dark border border-border rounded-lg text-text-primary focus:border-primary focus:outline-none appearance-none cursor-pointer hover:bg-background-light transition-colors"
                  style={{ 
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="ADMIN" className="bg-background-card text-text-primary py-2">
                    🛡️ Admin - Can manage members and settings
                  </option>
                  <option value="MEMBER" className="bg-background-card text-text-primary py-2">
                    👤 Member - Can view and comment
                  </option>
                  <option value="VIEWER" className="bg-background-card text-text-primary py-2">
                    👁️ Viewer - Read-only access
                  </option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

