import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../services/jwtService';
import { dbGet, dbRun } from '../config/database';

export function initializeSocketServer(io: Server): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    try {
      const payload = verifyAccessToken(token);
      (socket as any).userId = payload.sub;
      (socket as any).userRole = payload.role;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    socket.join(`user:${userId}`);

    socket.on('session:join', (sessionId: string) => socket.join(`session:${sessionId}`));
    socket.on('session:leave', (sessionId: string) => socket.leave(`session:${sessionId}`));

    socket.on('session:start', (sessionId: string) => {
      dbRun("UPDATE sessions SET status = 'active', started_at = datetime('now') WHERE id = ?", [sessionId]);
      io.to(`session:${sessionId}`).emit('session:call_started', { sessionId, startTime: new Date().toISOString() });
    });

    socket.on('session:crisis_flag', (sessionId: string) => {
      io.to(`session:${sessionId}`).emit('session:crisis_flag', { sessionId, resourceUrl: 'https://988lifeline.org' });
    });

    socket.on('session:timer_warning', (data: { sessionId: string; remainingSeconds: number }) => {
      io.to(`session:${data.sessionId}`).emit('session:timer_warning', data);
    });

    socket.on('disconnect', () => socket.leave(`user:${userId}`));
  });
}
