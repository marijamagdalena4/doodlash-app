import type { Server, Socket } from 'socket.io';
import {
  addPlayer,
  allPlayersReady,
  createRoom,
  deleteRoomIfEmpty,
  findPlayer,
  getRoom,
  removePlayer,
} from './rooms.js';
import type { CharacterId, JoinAck, Stroke } from './types.js';
import { toPublicPlayers } from './types.js';
import {
  buildHint,
  endTurn,
  getDrawerId,
  handleCanvasClear,
  handleCanvasFill,
  handleCanvasUndo,
  handleChat,
  handleDrawerDisconnect,
  handleGuess,
  handleStroke,
  playAgain,
  startGame,
} from './game.js';
import { get as levenshtein } from 'fast-levenshtein';

const VALID_CHARS = new Set(['char_1', 'char_2', 'char_3', 'char_4', 'char_5', 'char_6']);

function sendGameStateIfPlaying(io: Server, socket: Socket, room: NonNullable<ReturnType<typeof getRoom>>): void {
  if (room.phase !== 'playing' && room.phase !== 'scoreboard') return;
  const drawerId = getDrawerId(room);
  socket.emit('turn_start', {
    drawerId,
    hintStructure: buildHint(room),
    round: room.round,
    totalRounds: room.totalRounds,
    strokes: room.strokes,
  });
  if (socket.id === drawerId) {
    socket.emit('word_secret', { word: room.currentWord });
  }
  socket.emit('timer_sync', { secondsLeft: room.secondsLeft });
  if (room.phase === 'scoreboard') {
    socket.emit('round_end', {
      word: room.currentWord,
      players: toPublicPlayers(room.players),
      round: room.round,
    });
  }
}

function normalizeRoomCode(code?: string): string | undefined {
  if (!code) return undefined;
  return code.trim().toUpperCase();
}

function successAck(
  roomCode: string,
  playerId: string,
  isHost: boolean,
  room: ReturnType<typeof getRoom>
): JoinAck {
  if (!room) return { error: 'Room not found' };
  return {
    roomCode,
    playerId,
    isHost,
    phase: room.phase,
    players: toPublicPlayers(room.players),
    hostId: room.hostId,
    totalRounds: room.totalRounds,
  };
}

export function registerSocketHandlers(io: Server, socket: Socket): void {
  let currentRoomCode: string | null = null;

  socket.on('join_lobby', (payload: { name: string; characterId: string; roomCode?: string }, ack?: (res: JoinAck) => void) => {
    const name = payload?.name?.trim();
    const characterId = payload?.characterId as CharacterId;

    if (!name || name.length > 16) {
      ack?.({ error: 'Invalid name' });
      return;
    }
    if (!VALID_CHARS.has(characterId)) {
      ack?.({ error: 'Invalid character' });
      return;
    }

    const requestedCode = normalizeRoomCode(payload.roomCode);
    let room = requestedCode ? getRoom(requestedCode) : undefined;

    if (requestedCode && !room) {
      ack?.({ error: 'Room not found' });
      return;
    }

    if (room && room.phase !== 'lobby') {
      ack?.({ error: 'Game already started' });
      return;
    }

    if (room && room.players.length >= 6) {
      ack?.({ error: 'Room is full' });
      return;
    }

    if (!room) {
      room = createRoom();
    }

    const player = addPlayer(room, socket.id, name, characterId);
    currentRoomCode = room.code;
    socket.join(room.code);

    io.to(room.code).emit('player_joined', {
      players: toPublicPlayers(room.players),
      hostId: room.hostId,
    });

    ack?.(successAck(room.code, player.id, room.hostId === socket.id, room));
  });

  socket.on('rejoin_lobby', (payload: { roomCode: string; playerId: string; name: string; characterId: string }, ack?: (res: JoinAck) => void) => {
    const roomCode = normalizeRoomCode(payload?.roomCode);
    const room = roomCode ? getRoom(roomCode) : undefined;

    if (!room) {
      ack?.({ error: 'Room not found' });
      return;
    }

    const existing = room.players.find((p) => p.id === payload.playerId);
    if (existing) {
      const timer = room.disconnectTimers.get(existing.id);
      if (timer) {
        clearTimeout(timer);
        room.disconnectTimers.delete(existing.id);
      }
      room.waitingForPlayerId = null;
      existing.connected = true;
      existing.name = payload.name.trim().slice(0, 16);
      existing.characterId = payload.characterId as CharacterId;
      const oldSocket = existing.id;
      existing.id = socket.id;

      room.turnOrder = room.turnOrder.map((id) => (id === oldSocket ? socket.id : id));
      if (room.hostId === oldSocket) room.hostId = socket.id;

      currentRoomCode = room.code;
      socket.join(room.code);

      io.to(room.code).emit('player_joined', {
        players: toPublicPlayers(room.players),
        hostId: room.hostId,
      });

      sendGameStateIfPlaying(io, socket, room);
      ack?.(successAck(room.code, socket.id, room.hostId === socket.id, room));
      return;
    }

    if (room.phase !== 'lobby' && room.phase !== 'playing' && room.phase !== 'scoreboard') {
      ack?.({ error: 'Cannot rejoin' });
      return;
    }

    if (room.players.length >= 6) {
      ack?.({ error: 'Room is full' });
      return;
    }

    const player = addPlayer(room, socket.id, payload.name, payload.characterId as CharacterId);
    currentRoomCode = room.code;
    socket.join(room.code);

    io.to(room.code).emit('player_joined', {
      players: toPublicPlayers(room.players),
      hostId: room.hostId,
    });

    sendGameStateIfPlaying(io, socket, room);
    ack?.(successAck(room.code, player.id, room.hostId === socket.id, room));
  });

  socket.on('player_ready', ({ ready }: { ready: boolean }) => {
    const room = currentRoomCode ? getRoom(currentRoomCode) : undefined;
    if (!room || room.phase !== 'lobby') return;
    const player = findPlayer(room, socket.id);
    if (!player) return;
    player.ready = !!ready;
    io.to(room.code).emit('ready_update', { players: toPublicPlayers(room.players) });
  });

  socket.on('set_rounds', ({ totalRounds }: { totalRounds: number }) => {
    const room = currentRoomCode ? getRoom(currentRoomCode) : undefined;
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;
    if (![3, 5, 7].includes(totalRounds)) return;
    room.totalRounds = totalRounds;
    io.to(room.code).emit('rounds_updated', { totalRounds });
  });

  socket.on('start_game', () => {
    const room = currentRoomCode ? getRoom(currentRoomCode) : undefined;
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;
    if (!allPlayersReady(room)) return;
    io.to(room.code).emit('game_starting', { totalRounds: room.totalRounds });
    startGame(io, room);
  });

  socket.on('draw_stroke', (stroke: Stroke) => {
    const room = currentRoomCode ? getRoom(currentRoomCode) : undefined;
    if (!room) return;
    handleStroke(io, room, socket, stroke);
  });

  socket.on('canvas_clear', () => {
    const room = currentRoomCode ? getRoom(currentRoomCode) : undefined;
    if (!room) return;
    handleCanvasClear(io, room, socket);
  });

  socket.on('canvas_undo', ({ strokes }: { strokes: Stroke[] }) => {
    const room = currentRoomCode ? getRoom(currentRoomCode) : undefined;
    if (!room) return;
    handleCanvasUndo(io, room, socket, strokes);
  });

  socket.on('canvas_fill', (fillStroke: Stroke) => {
    const room = currentRoomCode ? getRoom(currentRoomCode) : undefined;
    if (!room) return;
    handleCanvasFill(io, room, socket, fillStroke);
  });

  socket.on('player_guess', ({ guess }: { guess: string }) => {
    const room = currentRoomCode ? getRoom(currentRoomCode) : undefined;
    if (!room) return;

    const player = findPlayer(room, socket.id);
    const drawerId = getDrawerId(room);
    if (!player || socket.id === drawerId) return;

    const normalized = guess.trim().toLowerCase();
    const answer = room.currentWord.trim().toLowerCase();

    if (
      normalized &&
      normalized !== answer &&
      levenshtein.get(normalized, answer) <= 1 &&
      !room.guessedPlayers.has(socket.id)
    ) {
      socket.emit('close_guess', { message: '⚡ So close!' });
    }

    if (room.guessedPlayers.has(socket.id)) {
      handleChat(io, room, socket, guess);
      return;
    }

    handleGuess(io, room, socket, guess);
  });

  socket.on('chat_message', ({ text }: { text: string }) => {
    const room = currentRoomCode ? getRoom(currentRoomCode) : undefined;
    if (!room) return;
    handleChat(io, room, socket, text);
  });

  socket.on('play_again', () => {
    const room = currentRoomCode ? getRoom(currentRoomCode) : undefined;
    if (!room || room.hostId !== socket.id) return;
    playAgain(io, room);
  });

  socket.on('emoji_reaction', ({ emoji }: { emoji: string }) => {
    const room = currentRoomCode ? getRoom(currentRoomCode) : undefined;
    if (!room || room.phase !== 'playing') return;
    const player = findPlayer(room, socket.id);
    if (!player) return;
    const now = Date.now();
    const key = `reaction_${socket.id}`;
    const last = (socket.data as Record<string, number>)[key] ?? 0;
    if (now - last < 3000) return;
    (socket.data as Record<string, number>)[key] = now;
    io.to(room.code).emit('emoji_reaction', {
      playerId: socket.id,
      name: player.name,
      emoji,
    });
  });

  socket.on('disconnect', () => {
    if (!currentRoomCode) return;
    const room = getRoom(currentRoomCode);
    if (!room) return;

    const player = findPlayer(room, socket.id);
    if (!player) {
      currentRoomCode = null;
      return;
    }

    const wasDrawer = getDrawerId(room) === socket.id;
    const oldId = socket.id;
    player.connected = false;

    if (room.phase === 'lobby') {
      removePlayer(room, oldId, true);
      io.to(room.code).emit('player_left', {
        playerId: oldId,
        players: toPublicPlayers(room.players),
        hostId: room.hostId,
      });
      if (room.players.length === 0) deleteRoomIfEmpty(currentRoomCode);
      currentRoomCode = null;
      return;
    }

    room.waitingForPlayerId = oldId;
    io.to(room.code).emit('player_disconnected', {
      playerId: oldId,
      name: player.name,
    });
    io.to(room.code).emit('waiting_for_player', {
      playerId: oldId,
      name: player.name,
    });

    if (wasDrawer) {
      handleDrawerDisconnect(io, room);
    }

    const timer = setTimeout(() => {
      removePlayer(room, oldId, true);
      room.turnOrder = room.turnOrder.filter((id) => id !== oldId);
      if (room.waitingForPlayerId === oldId) room.waitingForPlayerId = null;
      io.to(room.code).emit('player_left', {
        playerId: oldId,
        players: toPublicPlayers(room.players),
        hostId: room.hostId,
      });
      if (room.players.length === 0) deleteRoomIfEmpty(room.code);
    }, 30000);
    room.disconnectTimers.set(oldId, timer);

    currentRoomCode = null;
  });
}
