import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import socketHandler from './sockets/socketHandler.js';

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO with CORS rules
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000, // 60 seconds
});

// Configure Socket.IO Redis Adapter (for Production Scaling)
const configureRedis = async () => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const { createClient } = await import('redis');
      const { createAdapter } = await import('@socket.io/redis-adapter');

      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();

      // Register error handlers to prevent unhandled exceptions from crashing the process
      pubClient.on('error', (err) => {
        console.error('Redis Pub Client Error:', err.message);
      });
      subClient.on('error', (err) => {
        console.error('Redis Sub Client Error:', err.message);
      });

      await Promise.all([pubClient.connect(), subClient.connect()]);

      // Test write/publish permissions to ensure the Redis user has full pub/sub capabilities
      try {
        await pubClient.publish('synctube_test_connection_channel', 'test');
        io.adapter(createAdapter(pubClient, subClient));
        console.log('Socket.IO Redis Adapter configured successfully.');
      } catch (permissionErr) {
        console.error('Redis credentials do not support publishing (Write/Publish Restricted):', permissionErr.message);
        console.log('Falling back to standard In-Memory adapter.');
        await Promise.all([pubClient.disconnect(), subClient.disconnect()]).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to initialize Socket.IO Redis Adapter:', err.message);
    }
  } else {
    console.log('No REDIS_URL provided. Operating on standard Memory adapter.');
  }
};

// Start Server Routine
const startServer = async () => {
  // Connect database
  await connectDB();

  // Setup Redis if available
  await configureRedis();

  // Bind Socket.IO handlers
  socketHandler(io);

  // Start listening
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Fatal Server Startup Error:', error);
  process.exit(1);
});
