import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { auditRoutes } from './routes/audits';
import { projectRoutes } from './routes/projects';
import { authRoutes } from './routes/auth';
import { adminRoutes } from './routes/admin';
import { userRoutes } from './routes/user';
import { comparisonRoutes } from './routes/comparison';
import { brandingRoutes } from './routes/branding';
import { schedulesRoutes } from './routes/schedules';
import { bulkAuditsRoutes } from './routes/bulk-audits';
import { teamsRoutes } from './routes/teams';
import { commentsRoutes } from './routes/comments';
import { activitiesRoutes } from './routes/activities';
import { analyticsRoutes } from './routes/analytics';
import { recommendationsRoutes } from './routes/recommendations';
import { competitorsRoutes } from './routes/competitors';
import { settingsRoutes } from './routes/settings';
import { reportsRoutes } from './routes/reports';
import { profileRoutes } from './routes/profile';
import { emailTemplatesRoutes } from './routes/email-templates';
import webhooksRoutes from './routes/webhooks';
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import { websocketService } from './services/websocket-service';
import { startScheduler } from './services/scheduler';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.io with CORS
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3005',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize WebSocket service
websocketService.setIO(io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join audit room to receive updates
  socket.on('join-audit', (auditId: string) => {
    socket.join(`audit:${auditId}`);
    console.log(`📡 Client ${socket.id} joined audit:${auditId}`);
  });

  // Leave audit room
  socket.on('leave-audit', (auditId: string) => {
    socket.leave(`audit:${auditId}`);
    console.log(`📡 Client ${socket.id} left audit:${auditId}`);
  });

  // Relay audit events from worker to all clients in room
  socket.on('worker-audit-update', ({ auditId, data }: { auditId: string; data: any }) => {
    io.to(`audit:${auditId}`).emit(`audit:${auditId}`, data);
    console.log(`📡 Relaying audit update for ${auditId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/comparison', comparisonRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/bulk-audits', bulkAuditsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/competitors', competitorsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/email-templates', emailTemplatesRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Error handling
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  
  // Start cron scheduler for recurring audits
  startScheduler();
});

