import { io, Socket } from 'socket.io-client';
import type { JoinAck } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function joinLobby(payload: {
  name: string;
  characterId: string;
  roomCode?: string;
}): Promise<JoinAck> {
  return new Promise((resolve) => {
    connectSocket().emit('join_lobby', payload, (ack: JoinAck) => resolve(ack));
  });
}

export function rejoinLobby(payload: {
  roomCode: string;
  playerId: string;
  name: string;
  characterId: string;
}): Promise<JoinAck> {
  return new Promise((resolve) => {
    connectSocket().emit('rejoin_lobby', payload, (ack: JoinAck) => resolve(ack));
  });
}
