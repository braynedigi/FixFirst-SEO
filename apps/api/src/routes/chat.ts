import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import ChatService from '../services/chatService';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

/**
 * GET /api/chat/conversations
 * Get all conversations for the current user
 */
router.get('/conversations', async (req: AuthRequest, res, next) => {
  try {
    const conversations = await ChatService.getUserConversations(req.userId!);
    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/chat/conversations
 * Create a new conversation
 */
router.post('/conversations', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, title } = z.object({
      projectId: z.string().optional(),
      title: z.string().optional(),
    }).parse(req.body);

    const conversation = await ChatService.createConversation(
      req.userId!,
      projectId,
      title
    );

    res.json(conversation);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    next(error);
  }
});

/**
 * GET /api/chat/conversations/:id
 * Get a specific conversation with all messages
 */
router.get('/conversations/:id', async (req: AuthRequest, res, next) => {
  try {
    const conversation = await ChatService.getConversation(
      req.params.id,
      req.userId!
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/chat/conversations/:id
 * Update conversation title
 */
router.patch('/conversations/:id', async (req: AuthRequest, res, next) => {
  try {
    const { title } = z.object({
      title: z.string().min(1).max(100),
    }).parse(req.body);

    const conversation = await ChatService.updateConversationTitle(
      req.params.id,
      req.userId!,
      title
    );

    res.json(conversation);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    if (error.message === 'Conversation not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * DELETE /api/chat/conversations/:id
 * Delete a conversation
 */
router.delete('/conversations/:id', async (req: AuthRequest, res, next) => {
  try {
    await ChatService.deleteConversation(req.params.id, req.userId!);
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error: any) {
    if (error.message === 'Conversation not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/chat/conversations/:id/messages
 * Send a message in a conversation
 */
router.post('/conversations/:id/messages', async (req: AuthRequest, res, next) => {
  try {
    const { content } = z.object({
      content: z.string().min(1).max(5000),
    }).parse(req.body);

    const result = await ChatService.sendMessage(
      req.params.id,
      req.userId!,
      content
    );

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data. Message must be 1-5000 characters.' });
    }
    if (error.message === 'Conversation not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'OpenAI not configured') {
      return res.status(503).json({ error: 'AI chat is not configured. Please contact administrator.' });
    }
    next(error);
  }
});

/**
 * GET /api/chat/stats
 * Get chat statistics for the current user
 */
router.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const stats = await ChatService.getChatStats(req.userId!);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export { router as chatRoutes };

