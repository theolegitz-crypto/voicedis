import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string) {
  const url = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost';

  if (!socket) {
    socket = io(url, {
      transports: ['websocket'],
      autoConnect: false,
      auth: {
        token,
      },
    });
  }

  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

