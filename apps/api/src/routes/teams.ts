import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import crypto from 'crypto';
import { sendInvitationEmail } from '../services/emailService';
import { emailService } from '../services/email-service';

const router = Router();
const prisma = new PrismaClient();

// Helper function to log activities
async function logActivity(
  projectId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: any = {}
) {
  await prisma.activity.create({
    data: {
      projectId,
      userId,
      action: action as any,
      entityType,
      entityId,
      metadata,
    },
  });
}

// Helper function to check if user has permission
async function checkProjectPermission(
  projectId: string,
  userId: string,
  requiredRole: string[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']
): Promise<{ hasAccess: boolean; userRole: string | null }> {
  // Check if user is the project owner
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: userId },
  });

  if (project) {
    return { hasAccess: true, userRole: 'OWNER' };
  }

  // Check if user is a member
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (member && requiredRole.includes(member.role)) {
    return { hasAccess: true, userRole: member.role };
  }

  return { hasAccess: false, userRole: null };
}

// Get project members
router.get('/:projectId/members', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;

    // Check permission
    const { hasAccess } = await checkProjectPermission(projectId, req.userId!);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Get project owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    // Combine owner and members
    const allMembers = [
      {
        id: 'owner',
        projectId,
        userId: project!.userId,
        role: 'OWNER',
        joinedAt: project!.createdAt,
        user: project!.user,
      },
      ...members,
    ];

    res.json(allMembers);
  } catch (error) {
    next(error);
  }
});

// Invite member to project
const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

router.post('/:projectId/invite', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;
    const data = inviteMemberSchema.parse(req.body);

    // Check permission (only OWNER and ADMIN can invite)
    const { hasAccess, userRole } = await checkProjectPermission(projectId, req.userId!, ['OWNER', 'ADMIN']);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Only project owners and admins can invite members' });
    }

    // Check if user is trying to invite themselves
    const inviterUser = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (inviterUser?.email === data.email) {
      return res.status(400).json({ error: 'Cannot invite yourself' });
    }

    // Check if already a member or has pending invitation
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a member of this project' });
      }
    }

    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        projectId,
        email: data.email,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const invitation = await prisma.invitation.create({
      data: {
        projectId,
        email: data.email,
        role: data.role,
        token,
        invitedBy: req.userId!,
        expiresAt,
      },
      include: {
        project: true,
        inviter: {
          select: {
            email: true,
          },
        },
      },
    });

    // Log activity
    await logActivity(projectId, req.userId!, 'INVITED', 'user', data.email, {
      role: data.role,
    });

    // Send invitation email
    try {
      await sendInvitationEmail(invitation.id);
      console.log(`📧 Invitation email sent to ${data.email}`);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the invitation if email fails
    }

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.inviter.email,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    next(error);
  }
});

// Get pending invitations for a project
router.get('/:projectId/invitations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;

    // Check permission
    const { hasAccess } = await checkProjectPermission(projectId, req.userId!, ['OWNER', 'ADMIN']);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const invitations = await prisma.invitation.findMany({
      where: { projectId, status: 'PENDING' },
      include: {
        inviter: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invitations);
  } catch (error) {
    next(error);
  }
});

// Cancel/delete invitation
router.delete('/:projectId/invitations/:invitationId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId, invitationId } = req.params;

    // Check permission
    const { hasAccess } = await checkProjectPermission(projectId, req.userId!, ['OWNER', 'ADMIN']);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, projectId },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    res.json({ success: true, message: 'Invitation cancelled' });
  } catch (error) {
    next(error);
  }
});

// Accept invitation (public endpoint, protected by token)
router.post('/accept/:token', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { project: true },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invitation has already been processed' });
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Get current user
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });

    if (user!.email !== invitation.email) {
      return res.status(400).json({ error: 'This invitation is not for your email address' });
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: invitation.projectId,
          userId: req.userId!,
        },
      },
    });

    if (existingMember) {
      // User is already a member, just update invitation status
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        message: 'You are already a member of this project',
        project: invitation.project,
      });
    }

    // Add user to project
    await prisma.projectMember.create({
      data: {
        projectId: invitation.projectId,
        userId: req.userId!,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
      },
    });

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    // Log activity
    await logActivity(invitation.projectId, req.userId!, 'JOINED', 'project', invitation.projectId, {
      role: invitation.role,
    });

    res.json({
      success: true,
      message: 'Successfully joined the project',
      project: invitation.project,
    });
  } catch (error) {
    next(error);
  }
});

// Update member role
const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});

router.patch('/:projectId/members/:memberId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId, memberId } = req.params;
    const data = updateRoleSchema.parse(req.body);

    // Check permission (only OWNER can change roles)
    const { hasAccess, userRole } = await checkProjectPermission(projectId, req.userId!, ['OWNER']);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Only project owners can change member roles' });
    }

    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.projectId !== projectId) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const updatedMember = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role: data.role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await logActivity(projectId, req.userId!, 'UPDATED', 'member_role', memberId, {
      newRole: data.role,
      userId: member.userId,
    });

    res.json(updatedMember);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    next(error);
  }
});

// Remove member from project
router.delete('/:projectId/members/:memberId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId, memberId } = req.params;

    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.projectId !== projectId) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Check permission
    const { hasAccess, userRole } = await checkProjectPermission(projectId, req.userId!, ['OWNER', 'ADMIN']);

    // OWNER can remove anyone, ADMIN can remove MEMBER and VIEWER, users can remove themselves
    const canRemove =
      userRole === 'OWNER' ||
      (userRole === 'ADMIN' && ['MEMBER', 'VIEWER'].includes(member.role)) ||
      member.userId === req.userId;

    if (!canRemove) {
      return res.status(403).json({ error: 'You do not have permission to remove this member' });
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    // Log activity
    const action = member.userId === req.userId ? 'LEFT' : 'DELETED';
    await logActivity(projectId, req.userId!, action, 'member', memberId, {
      userId: member.userId,
    });

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
});

// Leave project (current user)
router.post('/:projectId/leave', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.params;

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.userId!,
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'You are not a member of this project' });
    }

    await prisma.projectMember.delete({
      where: { id: member.id },
    });

    // Log activity
    await logActivity(projectId, req.userId!, 'LEFT', 'project', projectId);

    res.json({ success: true, message: 'You have left the project' });
  } catch (error) {
    next(error);
  }
});

// Get all pending invitations for the current user
router.get('/my-invitations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        email: user.email,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        inviter: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invitations);
  } catch (error) {
    next(error);
  }
});

export { router as teamsRoutes };

