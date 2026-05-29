import type { Server, Socket } from 'socket.io';
import {
  clearRoomTimers,
  findPlayer,
  getRoom,
} from './rooms.js';
import type { HintStructure, Player, Room, Stroke } from './types.js';
import { toPublicPlayers } from './types.js';
import { buildHintStructure, pickWord } from './words.js';

const TURN_SECONDS = 100;
const SCOREBOARD_MS = 6000;
const DRAWER_SKIP_MS = 5000;

export function getDrawerId(room: Room): string | null {
  if (room.turnOrder.length === 0) return null;
  return room.turnOrder[room.currentDrawerIndex] ?? null;
}

export function buildHint(room: Room): HintStructure {
  const h = buildHintStructure(room.currentWord, room.hintReveals);
  return {
    display: h.display,
    wordLengths: h.wordLengths,
    totalLetters: h.totalLetters,
    revealedIndices: h.revealedIndices,
  };
}

export function resetTurnState(room: Room): void {
  room.strokes = [];
  room.guessedPlayers = new Set();
  room.hintReveals = [];
  room.hintsRevealedCount = 0;
  room.correctGuessCount = 0;
  room.players.forEach((p) => {
    p.roundScore = 0;
  });
}

export function calculateGuesserPoints(
  room: Room,
  rank: number
): number {
  const placementBases = [350, 280, 220];
  const placementBase = placementBases[Math.min(rank, 2)];
  const base = room.hintsRevealedCount > 0 ? 180 : placementBase;
  const multiplier = Math.max(0.15, room.secondsLeft / 100);
  let points = Math.round(base * multiplier);
  if (room.secondsLeft >= 90) {
    points += 50;
  }
  return points;
}

export function startGame(io: Server, room: Room): void {
  clearRoomTimers(room);
  room.phase = 'playing';
  room.round = 1;
  room.turnOrder = shuffle([...room.players.map((p) => p.id)]);
  room.currentDrawerIndex = 0;
  room.usedWords = [];
  room.players.forEach((p) => {
    p.score = 0;
    p.guessStreak = 0;
    p.ready = false;
  });
  startTurn(io, room);
}

export function startTurn(io: Server, room: Room): void {
  clearRoomTimers(room);
  resetTurnState(room);

  const drawerId = getDrawerId(room);
  if (!drawerId) {
    endGame(io, room);
    return;
  }

  room.currentWord = pickWord(room.usedWords);
  room.usedWords.push(room.currentWord);
  room.secondsLeft = TURN_SECONDS;
  room.turnStartedAt = Date.now();

  const hint = buildHint(room);

  io.to(room.code).emit('turn_start', {
    drawerId,
    hintStructure: hint,
    round: room.round,
    totalRounds: room.totalRounds,
    strokes: [],
  });

  const drawerSocket = io.sockets.sockets.get(drawerId);
  if (drawerSocket) {
    drawerSocket.emit('word_secret', { word: room.currentWord });
  }

  io.to(room.code).emit('players_update', { players: toPublicPlayers(room.players) });

  room.timer = setInterval(() => {
    room.secondsLeft -= 1;

    if (room.secondsLeft === 60 || room.secondsLeft === 30) {
      revealRandomHint(io, room);
    }

    if (room.secondsLeft <= 0) {
      endTurn(io, room);
    }
  }, 1000);

  room.syncTimer = setInterval(() => {
    io.to(room.code).emit('timer_sync', { secondsLeft: room.secondsLeft });
  }, 5000);

  io.to(room.code).emit('timer_sync', { secondsLeft: room.secondsLeft });
}

function revealRandomHint(io: Server, room: Room): void {
  const structure = buildHintStructure(room.currentWord, room.hintReveals);
  const unrevealed = structure.letterIndices.filter(
    (l) => !room.hintReveals.includes(l.index)
  );
  if (unrevealed.length === 0) return;

  const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
  room.hintReveals.push(pick.index);
  room.hintsRevealedCount += 1;

  io.to(room.code).emit('hint_reveal', {
    index: pick.index,
    letter: pick.letter,
    hintStructure: buildHint(room),
  });
}

export function handleGuess(
  io: Server,
  room: Room,
  socket: Socket,
  guess: string
): void {
  const player = findPlayer(room, socket.id);
  if (!player || room.phase !== 'playing') return;

  const drawerId = getDrawerId(room);
  if (!drawerId || socket.id === drawerId) return;

  const normalized = guess.trim().toLowerCase();
  if (!normalized) return;

  const isCorrect =
    normalized === room.currentWord.trim().toLowerCase();

  if (isCorrect) {
    if (room.guessedPlayers.has(socket.id)) return;

    room.guessedPlayers.add(socket.id);
    const rank = room.correctGuessCount;
    room.correctGuessCount += 1;

    let points = calculateGuesserPoints(room, rank);
    player.guessStreak += 1;
    if (player.guessStreak >= 3) {
      points += 50;
    }
    player.score += points;
    player.roundScore += points;

    const drawer = findPlayer(room, drawerId);
    if (drawer) {
      drawer.score += 40;
      drawer.roundScore += 40;
    }

    io.to(room.code).emit('guess_result', {
      correct: true,
      playerId: socket.id,
      points,
      name: player.name,
    });

    io.to(room.code).emit('players_update', { players: toPublicPlayers(room.players) });

    const nonDrawers = room.turnOrder.filter((id) => id !== drawerId);
    const allGuessed = nonDrawers.every((id) => room.guessedPlayers.has(id));
    if (allGuessed) {
      endTurn(io, room);
    }
    return;
  }

  player.guessStreak = 0;

  io.to(room.code).emit('chat_message', {
    playerId: socket.id,
    name: player.name,
    text: guess.trim().slice(0, 60),
    ts: Date.now(),
    isGuess: true,
  });
}

export function handleChat(
  io: Server,
  room: Room,
  socket: Socket,
  text: string
): void {
  const player = findPlayer(room, socket.id);
  if (!player || room.phase !== 'playing') return;

  const drawerId = getDrawerId(room);
  if (socket.id === drawerId) return;

  io.to(room.code).emit('chat_message', {
    playerId: socket.id,
    name: player.name,
    text: text.trim().slice(0, 60),
    ts: Date.now(),
    isGuess: false,
  });
}

export function endTurn(io: Server, room: Room): void {
  if (room.phase !== 'playing') return;
  clearRoomTimers(room);
  room.phase = 'scoreboard';

  io.to(room.code).emit('round_end', {
    word: room.currentWord,
    players: toPublicPlayers(room.players),
    round: room.round,
  });

  room.scoreboardTimer = setTimeout(() => {
    advanceAfterScoreboard(io, room);
  }, SCOREBOARD_MS);
}

function advanceAfterScoreboard(io: Server, room: Room): void {
  if (!getRoom(room.code)) return;

  room.currentDrawerIndex += 1;

  if (room.currentDrawerIndex >= room.turnOrder.length) {
    room.currentDrawerIndex = 0;
    room.round += 1;
  }

  if (room.round > room.totalRounds) {
    endGame(io, room);
    return;
  }

  room.phase = 'playing';
  startTurn(io, room);
}

export function endGame(io: Server, room: Room): void {
  clearRoomTimers(room);
  room.phase = 'ended';

  const finalScores = [...room.players]
    .sort((a, b) => b.score - a.score)
    .map((p) => ({
      id: p.id,
      name: p.name,
      characterId: p.characterId,
      score: p.score,
    }));

  io.to(room.code).emit('game_over', { finalScores });
}

export function playAgain(io: Server, room: Room): void {
  clearRoomTimers(room);
  room.phase = 'lobby';
  room.round = 0;
  room.turnOrder = [];
  room.currentDrawerIndex = 0;
  room.currentWord = '';
  room.usedWords = [];
  resetTurnState(room);
  room.players.forEach((p) => {
    p.score = 0;
    p.roundScore = 0;
    p.ready = false;
    p.guessStreak = 0;
  });
  io.to(room.code).emit('return_to_lobby', {
    players: toPublicPlayers(room.players),
    hostId: room.hostId,
    totalRounds: room.totalRounds,
  });
}

export function handleDrawerDisconnect(io: Server, room: Room): void {
  if (room.drawerSkipTimer) clearTimeout(room.drawerSkipTimer);
  room.drawerSkipTimer = setTimeout(() => {
    if (room.phase === 'playing') {
      endTurn(io, room);
    }
  }, DRAWER_SKIP_MS);
}

export function handleStroke(
  io: Server,
  room: Room,
  socket: Socket,
  stroke: Stroke
): boolean {
  const drawerId = getDrawerId(room);
  if (socket.id !== drawerId || room.phase !== 'playing') return false;
  room.strokes.push(stroke);
  socket.to(room.code).emit('draw_stroke', stroke);
  return true;
}

export function handleCanvasClear(io: Server, room: Room, socket: Socket): boolean {
  const drawerId = getDrawerId(room);
  if (socket.id !== drawerId || room.phase !== 'playing') return false;
  room.strokes = [];
  io.to(room.code).emit('canvas_clear', {});
  return true;
}

export function handleCanvasUndo(
  io: Server,
  room: Room,
  socket: Socket,
  strokes: Stroke[]
): boolean {
  const drawerId = getDrawerId(room);
  if (socket.id !== drawerId || room.phase !== 'playing') return false;
  room.strokes = strokes;
  io.to(room.code).emit('canvas_undo', { strokes });
  return true;
}

export function handleCanvasFill(
  io: Server,
  room: Room,
  socket: Socket,
  fillStroke: Stroke
): boolean {
  const drawerId = getDrawerId(room);
  if (socket.id !== drawerId || room.phase !== 'playing') return false;
  room.strokes.push(fillStroke);
  io.to(room.code).emit('canvas_fill', fillStroke);
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
