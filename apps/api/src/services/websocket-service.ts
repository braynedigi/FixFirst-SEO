import { Server as SocketServer } from 'socket.io';

// Singleton to hold the WebSocket server instance
class WebSocketService {
  private io: SocketServer | null = null;

  setIO(io: SocketServer) {
    this.io = io;
    console.log('✅ WebSocket service initialized');
  }

  getIO(): SocketServer {
    if (!this.io) {
      throw new Error('WebSocket server not initialized. Call setIO() first.');
    }
    return this.io;
  }

  // Emit audit update to specific audit room
  emitAuditUpdate(auditId: string, data: any) {
    if (!this.io) {
      console.warn('⚠️ WebSocket not initialized, skipping emit');
      return;
    }
    
    // Emit to the specific audit room
    this.io.to(`audit:${auditId}`).emit(`audit:${auditId}`, data);
    console.log(`📡 Emitted update to audit:${auditId}`, data);
  }
}

// Export a singleton instance
export const websocketService = new WebSocketService();

