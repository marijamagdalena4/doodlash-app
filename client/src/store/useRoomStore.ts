import { create } from 'zustand';
import type { Player } from '../types';

interface RoomState {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  hostId: string;
  totalRounds: number;
  setRoomCode: (code: string) => void;
  setPlayers: (players: Player[]) => void;
  setIsHost: (isHost: boolean) => void;
  setHostId: (hostId: string) => void;
  setTotalRounds: (n: number) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomCode: '',
  players: [],
  isHost: false,
  hostId: '',
  totalRounds: 5,
  setRoomCode: (roomCode) => set({ roomCode }),
  setPlayers: (players) => set({ players }),
  setIsHost: (isHost) => set({ isHost }),
  setHostId: (hostId) => set({ hostId }),
  setTotalRounds: (totalRounds) => set({ totalRounds }),
  reset: () =>
    set({ roomCode: '', players: [], isHost: false, hostId: '', totalRounds: 5 }),
}));
