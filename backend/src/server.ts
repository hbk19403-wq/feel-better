import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { runMigrations } from './config/migrate';
import { runSeed } from './config/seed';
import app from './app';
import { initializeSocketServer } from './websocket/sessionSocket';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  await runMigrations();
  await runSeed();

  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: { origin: '*', credentials: true },
  });
  initializeSocketServer(io);

  httpServer.listen(PORT, () => {
    console.log(`\n✅ 1800-FeelBetter backend running on http://localhost:${PORT}`);
    console.log(`✅ WebSocket ready`);
    console.log(`\nTest: curl http://localhost:${PORT}/health\n`);
  });
}

start().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
