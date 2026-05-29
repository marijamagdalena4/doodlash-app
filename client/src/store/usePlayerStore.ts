import { create } from 'zustand';
import type { CharacterId } from '../types';

interface PlayerState {
  name: string;
  characterId: CharacterId | null;
  playerId: string;
  setName: (name: string) => void;
  setCharacterId: (id: CharacterId) => void;
  setPlayerId: (id: string) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  name: '',
  characterId: null,
  playerId: '',
  setName: (name) => set({ name }),
  setCharacterId: (characterId) => set({ characterId }),
  setPlayerId: (playerId) => set({ playerId }),
  reset: () => set({ name: '', characterId: null, playerId: '' }),
}));
