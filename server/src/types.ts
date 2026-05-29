export type CharacterId = 'char_1' | 'char_2' | 'char_3' | 'char_4' | 'char_5' | 'char_6';
export type GamePhase = 'lobby' | 'playing' | 'scoreboard' | 'ended';

export interface Player {
  id: string;
  name: string;
  characterId: CharacterId;
  score: number;
  roundScore: number;
  ready: boolean;
  connected: boolean;
  guessStreak: number;
  joinOrder: number;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: StrokePoint[];
  color: string;
  size: number;
  tool: 'brush' | 'eraser' | 'fill';
  fillData?: { x: number; y: number; color: string };
}

export interface HintStructure {
  display: string;
  wordLengths: number[];
  totalLetters: number;
  revealedIndices: number[];
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  phase: GamePhase;
  round: number;
  totalRounds: number;
  turnOrder: string[];
  currentDrawerIndex: number;
  currentWord: string;
  hintReveals: number[];
  strokes: Stroke[];
  guessedPlayers: Set<string>;
  timer: NodeJS.Timeout | null;
  syncTimer: NodeJS.Timeout | null;
  secondsLeft: number;
  turnStartedAt: number;
  usedWords: string[];
  hintsRevealedCount: number;
  correctGuessCount: number;
  scoreboardTimer: NodeJS.Timeout | null;
  drawerSkipTimer: NodeJS.Timeout | null;
  joinCounter: number;
  disconnectTimers: Map<string, NodeJS.Timeout>;
  waitingForPlayerId: string | null;
}

export interface JoinAckSuccess {
  roomCode: string;
  playerId: string;
  isHost: boolean;
  phase: GamePhase;
  players: PlayerPublic[];
  hostId: string;
  totalRounds: number;
}

export interface JoinAckError {
  error: string;
}

export type JoinAck = JoinAckSuccess | JoinAckError;

export interface PlayerPublic {
  id: string;
  name: string;
  characterId: CharacterId;
  score: number;
  roundScore: number;
  ready: boolean;
  connected: boolean;
  guessStreak: number;
}

export function toPublicPlayer(p: Player): PlayerPublic {
  return {
    id: p.id,
    name: p.name,
    characterId: p.characterId,
    score: p.score,
    roundScore: p.roundScore,
    ready: p.ready,
    connected: p.connected,
    guessStreak: p.guessStreak,
  };
}

export function toPublicPlayers(players: Player[]): PlayerPublic[] {
  return players.map(toPublicPlayer);
}
