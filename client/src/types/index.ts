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

export interface ChatMessage {
  playerId: string;
  name: string;
  text: string;
  ts: number;
  isGuess?: boolean;
  correct?: boolean;
}

export interface SessionData {
  name: string;
  characterId: CharacterId;
  roomCode: string;
  playerId: string;
}

export interface JoinAckSuccess {
  roomCode: string;
  playerId: string;
  isHost: boolean;
  phase: GamePhase;
  players: Player[];
  hostId: string;
  totalRounds: number;
}

export interface JoinAckError {
  error: string;
}

export type JoinAck = JoinAckSuccess | JoinAckError;

export interface FinalScore {
  id: string;
  name: string;
  characterId: CharacterId;
  score: number;
}

export const CHARACTERS = [
  { id: 'char_1' as const, name: 'Blobby', fill: '#FF6B6B', accent: '#C0392B' },
  { id: 'char_2' as const, name: 'Ziggy', fill: '#FFD93D', accent: '#F39C12' },
  { id: 'char_3' as const, name: 'Mint', fill: '#6BCB77', accent: '#27AE60' },
  { id: 'char_4' as const, name: 'Inky', fill: '#4D96FF', accent: '#2980B9' },
  { id: 'char_5' as const, name: 'Lavvy', fill: '#C77DFF', accent: '#8E44AD' },
  { id: 'char_6' as const, name: 'Tangy', fill: '#FF9F43', accent: '#E67E22' },
];

export const PALETTE = [
  '#000000', '#FFFFFF', '#808080', '#C0C0C0', '#800000', '#FF0000',
  '#FF6B6B', '#FF9F43', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF',
  '#E74C3C', '#E67E22', '#F1C40F', '#27AE60', '#2980B9', '#8E44AD',
  '#2C3E50', '#34495E', '#1ABC9C', '#16A085', '#D35400', '#7F8C8D',
];
