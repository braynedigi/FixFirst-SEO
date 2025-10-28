import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

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

// Helper function to check if user has access to issue
async function checkIssueAccess(issueId: string, userId: string): Promise<{ hasAccess: boolean; projectId: string | null }> {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      audit: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!issue) {
    return { hasAccess: false, projectId: null };
  }

  const projectId = issue.audit.project.id;

  // Check if user is project owner
  if (issue.audit.project.userId === userId) {
    return { hasAccess: true, projectId };
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

  if (member) {
    return { hasAccess: true, projectId };
  }

  return { hasAccess: false, projectId: null };
}

// Get comments for an issue
router.get('/issue/:issueId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { issueId } = req.params;

    // Check access
    const { hasAccess } = await checkIssueAccess(issueId, req.userId!);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comments = await prisma.comment.findMany({
      where: { issueId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(comments);
  } catch (error) {
    next(error);
  }
});

// Create a comment
const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

router.post('/issue/:issueId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { issueId } = req.params;
    const data = createCommentSchema.parse(req.body);

    // Check access
    const { hasAccess, projectId } = await checkIssueAccess(issueId, req.userId!);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comment = await prisma.comment.create({
      data: {
        issueId,
        userId: req.userId!,
        content: data.content,
      },
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
    if (projectId) {
      await logActivity(projectId, req.userId!, 'COMMENTED', 'issue', issueId, {
        commentId: comment.id,
      });
    }

    res.status(201).json(comment);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    next(error);
  }
});

// Update a comment
const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

router.patch('/:commentId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { commentId } = req.params;
    const data = updateCommentSchema.parse(req.body);

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        issue: {
          include: {
            audit: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only comment author can update
    if (existingComment.userId !== req.userId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: data.content },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    res.json(updatedComment);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    next(error);
  }
});

// Delete a comment
router.delete('/:commentId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { commentId } = req.params;

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        issue: {
          include: {
            audit: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const projectId = existingComment.issue.audit.project.id;
    const isProjectOwner = existingComment.issue.audit.project.userId === req.userId;
    const isCommentAuthor = existingComment.userId === req.userId;

    // Check permission (comment author or project owner/admin can delete)
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.userId!,
        },
      },
    });

    const isAdmin = member?.role === 'ADMIN' || member?.role === 'OWNER';

    if (!isCommentAuthor && !isProjectOwner && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this comment' });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as commentsRoutes };

