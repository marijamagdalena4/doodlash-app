import { create } from 'zustand';
import type { ChatMessage, FinalScore, GamePhase, HintStructure, Stroke } from '../types';

interface GameState {
  phase: GamePhase;
  round: number;
  totalRounds: number;
  drawerId: string;
  hint: HintStructure | null;
  secretWord: string;
  secondsLeft: number;
  strokes: Stroke[];
  messages: ChatMessage[];
  showScoreboard: boolean;
  lastWord: string;
  finalScores: FinalScore[];
  guessedIds: Set<string>;
  muted: boolean;
  showReplay: boolean;
  setPhase: (phase: GamePhase) => void;
  setRound: (round: number) => void;
  setTotalRounds: (n: number) => void;
  setDrawerId: (id: string) => void;
  setHint: (hint: HintStructure | null) => void;
  setSecretWord: (word: string) => void;
  setSecondsLeft: (n: number) => void;
  setStrokes: (strokes: Stroke[]) => void;
  addStroke: (stroke: Stroke) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setShowScoreboard: (show: boolean) => void;
  setLastWord: (word: string) => void;
  setFinalScores: (scores: FinalScore[]) => void;
  addGuessedId: (id: string) => void;
  clearGuessedIds: () => void;
  setMuted: (muted: boolean) => void;
  setShowReplay: (show: boolean) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'lobby',
  round: 0,
  totalRounds: 5,
  drawerId: '',
  hint: null,
  secretWord: '',
  secondsLeft: 100,
  strokes: [],
  messages: [],
  showScoreboard: false,
  lastWord: '',
  finalScores: [],
  guessedIds: new Set(),
  muted: false,
  showReplay: false,
  setPhase: (phase) => set({ phase }),
  setRound: (round) => set({ round }),
  setTotalRounds: (totalRounds) => set({ totalRounds }),
  setDrawerId: (drawerId) => set({ drawerId }),
  setHint: (hint) => set({ hint }),
  setSecretWord: (secretWord) => set({ secretWord }),
  setSecondsLeft: (secondsLeft) => set({ secondsLeft }),
  setStrokes: (strokes) => set({ strokes }),
  addStroke: (stroke) => set((s) => ({ strokes: [...s.strokes, stroke] })),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setMessages: (messages) => set({ messages }),
  setShowScoreboard: (showScoreboard) => set({ showScoreboard }),
  setLastWord: (lastWord) => set({ lastWord }),
  setFinalScores: (finalScores) => set({ finalScores }),
  addGuessedId: (id) =>
    set((s) => {
      const guessedIds = new Set(s.guessedIds);
      guessedIds.add(id);
      return { guessedIds };
    }),
  clearGuessedIds: () => set({ guessedIds: new Set() }),
  setMuted: (muted) => set({ muted }),
  setShowReplay: (showReplay) => set({ showReplay }),
  resetGame: () =>
    set({
      phase: 'lobby',
      round: 0,
      drawerId: '',
      hint: null,
      secretWord: '',
      secondsLeft: 100,
      strokes: [],
      messages: [],
      showScoreboard: false,
      lastWord: '',
      finalScores: [],
      guessedIds: new Set(),
      showReplay: false,
    }),
}));
