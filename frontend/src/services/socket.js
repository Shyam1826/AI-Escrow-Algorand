import { io } from 'socket.io-client';

let socket = null;

export function connectSocket() {
  const token = localStorage.getItem('token');
  const API_BASE = import.meta.env.VITE_API_URL;

  if (!token || !API_BASE) return null;
  if (socket?.connected) return socket;

  socket = io(API_BASE, {
    transports: ['websocket'],
    auth: { token }
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

