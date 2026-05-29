import crypto from 'crypto';
import type { CharacterId, Player, Room } from './types.js';

const rooms = new Map<string, Room>();

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateRoomCode(): string {
  let code: string;
  let attempts = 0;
  do {
    const letters = Array.from({ length: 4 }, () =>
      ALPHA[crypto.randomInt(0, ALPHA.length)]
    ).join('');
    const digits = crypto.randomInt(1000, 10000).toString();
    code = `${letters}-${digits}`;
    attempts++;
  } while (rooms.has(code) && attempts < 100);
  return code;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function createRoom(): Room {
  const code = generateRoomCode();
  const room: Room = {
    code,
    hostId: '',
    players: [],
    phase: 'lobby',
    round: 0,
    totalRounds: 5,
    turnOrder: [],
    currentDrawerIndex: 0,
    currentWord: '',
    hintReveals: [],
    strokes: [],
    guessedPlayers: new Set(),
    timer: null,
    syncTimer: null,
    secondsLeft: 100,
    turnStartedAt: 0,
    usedWords: [],
    hintsRevealedCount: 0,
    correctGuessCount: 0,
    scoreboardTimer: null,
    drawerSkipTimer: null,
    joinCounter: 0,
    disconnectTimers: new Map(),
    waitingForPlayerId: null,
  };
  rooms.set(code, room);
  return room;
}

export function addPlayer(
  room: Room,
  socketId: string,
  name: string,
  characterId: CharacterId
): Player {
  const player: Player = {
    id: socketId,
    name: name.trim().slice(0, 16),
    characterId,
    score: 0,
    roundScore: 0,
    ready: false,
    connected: true,
    guessStreak: 0,
    joinOrder: room.joinCounter++,
  };
  room.players.push(player);
  if (!room.hostId) {
    room.hostId = socketId;
  }
  return player;
}

export function findPlayer(room: Room, playerId: string): Player | undefined {
  return room.players.find((p) => p.id === playerId);
}

export function removePlayer(room: Room, playerId: string, immediate = false): boolean {
  const idx = room.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return false;

  const timer = room.disconnectTimers.get(playerId);
  if (timer) {
    clearTimeout(timer);
    room.disconnectTimers.delete(playerId);
  }

  if (!immediate && room.phase === 'playing') {
    return false;
  }

  room.players.splice(idx, 1);
  if (room.waitingForPlayerId === playerId) {
    room.waitingForPlayerId = null;
  }

  if (room.hostId === playerId && room.players.length > 0) {
    const sorted = [...room.players].sort((a, b) => a.joinOrder - b.joinOrder);
    room.hostId = sorted[0].id;
  } else if (room.players.length === 0) {
    room.hostId = '';
  }

  room.turnOrder = room.turnOrder.filter((id) => id !== playerId);
  return true;
}

export function deleteRoomIfEmpty(code: string): void {
  const room = rooms.get(code);
  if (room && room.players.length === 0) {
    clearRoomTimers(room);
    rooms.delete(code);
  }
}

export function clearRoomTimers(room: Room): void {
  if (room.timer) clearInterval(room.timer);
  if (room.syncTimer) clearInterval(room.syncTimer);
  if (room.scoreboardTimer) clearTimeout(room.scoreboardTimer);
  if (room.drawerSkipTimer) clearTimeout(room.drawerSkipTimer);
  room.timer = null;
  room.syncTimer = null;
  room.scoreboardTimer = null;
  room.drawerSkipTimer = null;
}

export function allPlayersReady(room: Room): boolean {
  if (room.players.length < 2) return false;
  return room.players.every((p) => p.ready);
}

export { rooms };
