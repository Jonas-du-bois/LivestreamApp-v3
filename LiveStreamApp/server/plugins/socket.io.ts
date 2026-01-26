import { Server as IOServer } from 'socket.io';

export default defineNitroPlugin(() => {
  // Attach socket.io to the underlying Node HTTP server on first request
  useRuntimeConfig; // ensure TS doesn't complain about unused imports in nitro context

  return {
    hooks: {
      'request': (req: any) => {
        const res = req?.res;
        if (!res) return;
        const server: any = res.socket?.server;
        if (!server) return;

        // Avoid multiple initializations
        if (server.io) {
          // already attached
          return;
        }

        const io = new (require('socket.io').Server)(server, {
          path: '/socket.io',
        }) as IOServer;

        server.io = io; // attach to http server so handlers can access it
        (globalThis as any).io = io; // optional global reference for convenience

        io.on('connection', (socket) => {
          // Room management
          socket.on('join-room', (room: string) => {
            if (typeof room === 'string') {
              socket.join(room);
              socket.emit('joined', { room });
            }
          });

          socket.on('leave-room', (room: string) => {
            if (typeof room === 'string') {
              socket.leave(room);
              socket.emit('left', { room });
            }
          });

          // Basic ping
          socket.on('ping', () => socket.emit('pong'));
        });

        console.log('[socket.io] attached to server');
      },
    },
  } as any;
});