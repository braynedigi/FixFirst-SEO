/**
 * AI Chat Service
 * 
 * Provides SEO-focused AI chat assistance using OpenAI
 */

import { PrismaClient } from '@prisma/client';
import { getOpenAIClient } from './aiRecommendations';

const prisma = new PrismaClient();

const SYSTEM_PROMPT = `You are an expert SEO consultant and assistant for FixFirst SEO, a professional SEO audit platform. Your role is to help users:

1. **Understand SEO Issues**: Explain audit findings, metrics, and recommendations in clear, actionable terms
2. **Provide Solutions**: Offer specific, implementable solutions for SEO problems
3. **Best Practices**: Share current SEO best practices and Google guidelines
4. **Strategy Advice**: Help users develop effective SEO strategies
5. **Technical Help**: Assist with technical SEO, performance optimization, and implementation

**Your Communication Style:**
- Clear and concise
- Action-oriented with specific steps
- Use examples and code snippets when helpful
- Explain technical concepts in accessible language
- Prioritize practical, implementable advice

**Context Awareness:**
When provided with audit data or project context, reference specific issues and metrics from that data.

**Remember:**
- Focus on white-hat, sustainable SEO practices
- Keep Google's guidelines and Core Web Vitals in mind
- Prioritize user experience alongside search optimization
- Be encouraging and constructive

Answer user questions professionally and helpfully.`;

export class ChatService {
  /**
   * Create a new chat conversation
   */
  static async createConversation(userId: string, projectId?: string, title?: string) {
    // Get project context if provided
    let context = null;
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          audits: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              issues: true,
            },
          },
        },
      });

      if (project) {
        const lastAudit = project.audits[0];
        context = {
          projectDomain: project.domain,
          projectName: project.name,
          lastAuditScore: lastAudit?.overallScore,
          lastAuditDate: lastAudit?.createdAt,
          issueCount: lastAudit?.issues?.length || 0,
        };
      }
    }

    return await prisma.chatConversation.create({
      data: {
        userId,
        projectId,
        title: title || 'New Conversation',
        context,
      },
    });
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string) {
    return await prisma.chatConversation.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            createdAt: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get a conversation with all messages
   */
  static async getConversation(conversationId: string, userId: string) {
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return conversation;
  }

  /**
   * Send a message and get AI response
   */
  static async sendMessage(conversationId: string, userId: string, content: string) {
    // Verify conversation belongs to user
    const conversation = await this.getConversation(conversationId, userId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content,
      },
    });

    try {
      // Get OpenAI client
      const openai = await getOpenAIClient();
      if (!openai) {
        throw new Error('OpenAI not configured');
      }

      // Build conversation history
      const messages: any[] = [
        { role: 'system', content: SYSTEM_PROMPT },
      ];

      // Add project context if available
      if (conversation.context) {
        const contextMsg = `Current project context:\n${JSON.stringify(conversation.context, null, 2)}`;
        messages.push({ role: 'system', content: contextMsg });
      }

      // Add conversation history (last 10 messages for context window)
      const recentMessages = conversation.messages.slice(-10);
      for (const msg of recentMessages) {
        messages.push({
          role: msg.role.toLowerCase(),
          content: msg.content,
        });
      }

      // Add current user message
      messages.push({
        role: 'user',
        content,
      });

      // Get AI response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const assistantContent = completion.choices[0].message.content || 'Sorry, I could not generate a response.';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Save assistant message
      const assistantMessage = await prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: assistantContent,
          metadata: {
            model: 'gpt-4',
            tokensUsed,
            finishReason: completion.choices[0].finish_reason,
          },
        },
      });

      // Update conversation title if it's the first exchange
      if (conversation.messages.length === 0 && conversation.title === 'New Conversation') {
        // Generate title from first message
        const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
        await prisma.chatConversation.update({
          where: { id: conversationId },
          data: { title },
        });
      }

      return {
        userMessage,
        assistantMessage,
        tokensUsed,
      };
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Save error message
      const errorMessage = await prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: `I apologize, but I encountered an error: ${error.message}. Please try again or contact support if the issue persists.`,
          metadata: {
            error: true,
            errorMessage: error.message,
          },
        },
      });

      return {
        userMessage,
        assistantMessage: errorMessage,
        error: error.message,
      };
    }
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(conversationId: string, userId: string) {
    // Verify ownership
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    await prisma.chatConversation.delete({
      where: { id: conversationId },
    });
  }

  /**
   * Update conversation title
   */
  static async updateConversationTitle(conversationId: string, userId: string, title: string) {
    // Verify ownership
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /**
   * Get chat statistics for a user
   */
  static async getChatStats(userId: string) {
    const [conversationCount, messageCount, totalTokens] = await Promise.all([
      prisma.chatConversation.count({ where: { userId } }),
      prisma.chatMessage.count({
        where: {
          conversation: { userId },
        },
      }),
      prisma.chatMessage.aggregate({
        where: {
          conversation: { userId },
          metadata: { not: null },
        },
        _sum: {
          metadata: true,
        },
      }),
    ]);

    return {
      conversations: conversationCount,
      messages: messageCount,
      estimatedTokens: totalTokens._sum || 0,
    };
  }
}

export default ChatService;

