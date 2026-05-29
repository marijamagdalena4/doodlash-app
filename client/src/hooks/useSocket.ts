import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { connectSocket, getSocket } from '../lib/socket';
import { playFanfare, playPop, playTick } from '../lib/sounds';
import { loadSession, saveSession, updateSessionPlayerId } from '../store/session';
import { useGameStore } from '../store/useGameStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useRoomStore } from '../store/useRoomStore';
import type { JoinAckSuccess, Stroke } from '../types';

export function useSocketListeners() {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;

    const socket = connectSocket();
    socket.on('player_joined', ({ players, hostId }) => {
      useRoomStore.getState().setPlayers(players);
      useRoomStore.getState().setHostId(hostId);
      useRoomStore.getState().setIsHost(hostId === usePlayerStore.getState().playerId);
    });

    socket.on('player_left', ({ players, hostId }) => {
      useRoomStore.getState().setPlayers(players);
      if (hostId) {
        useRoomStore.getState().setHostId(hostId);
        useRoomStore.getState().setIsHost(hostId === usePlayerStore.getState().playerId);
      }
    });

    socket.on('ready_update', ({ players }) => {
      useRoomStore.getState().setPlayers(players);
    });

    socket.on('rounds_updated', ({ totalRounds }) => {
      useRoomStore.getState().setTotalRounds(totalRounds);
      useGameStore.getState().setTotalRounds(totalRounds);
    });

    socket.on('game_starting', ({ totalRounds }) => {
      useGameStore.getState().setTotalRounds(totalRounds);
      useRoomStore.getState().setTotalRounds(totalRounds);
    });

    socket.on('turn_start', ({ drawerId, hintStructure, round, totalRounds, strokes }) => {
      const gs = useGameStore.getState();
      gs.setPhase('playing');
      gs.setDrawerId(drawerId);
      gs.setHint(hintStructure);
      gs.setRound(round);
      gs.setTotalRounds(totalRounds);
      gs.setStrokes(strokes || []);
      gs.setSecretWord('');
      gs.setMessages([]);
      gs.clearGuessedIds();
      gs.setShowScoreboard(false);
      gs.setShowReplay(false);
      gs.setSecondsLeft(100);
    });

    socket.on('word_secret', ({ word }) => {
      useGameStore.getState().setSecretWord(word);
    });

    socket.on('draw_stroke', (stroke: Stroke) => {
      useGameStore.getState().addStroke(stroke);
    });

    socket.on('canvas_clear', () => {
      useGameStore.getState().setStrokes([]);
    });

    socket.on('canvas_undo', ({ strokes }: { strokes: Stroke[] }) => {
      useGameStore.getState().setStrokes(strokes);
    });

    socket.on('canvas_fill', (stroke: Stroke) => {
      useGameStore.getState().addStroke(stroke);
    });

    socket.on('hint_reveal', ({ hintStructure }) => {
      useGameStore.getState().setHint(hintStructure);
    });

    socket.on('timer_sync', ({ secondsLeft }) => {
      const prev = useGameStore.getState().secondsLeft;
      useGameStore.getState().setSecondsLeft(secondsLeft);
      if (secondsLeft <= 10 && secondsLeft < prev) {
        playTick(useGameStore.getState().muted);
      }
    });

    socket.on('guess_result', ({ correct, playerId, points, name }) => {
      if (correct) {
        playPop(useGameStore.getState().muted);
        useGameStore.getState().addGuessedId(playerId);
        useGameStore.getState().addMessage({
          playerId,
          name,
          text: `🎉 ${name} guessed it! (+${points})`,
          ts: Date.now(),
          correct: true,
        });
      }
    });

    socket.on('chat_message', (msg) => {
      useGameStore.getState().addMessage(msg);
    });

    socket.on('players_update', ({ players }) => {
      useRoomStore.getState().setPlayers(players);
    });

    socket.on('round_end', ({ word, players }) => {
      const gs = useGameStore.getState();
      gs.setLastWord(word);
      gs.setPhase('scoreboard');
      gs.setShowScoreboard(true);
      gs.setSecretWord(word);
      useRoomStore.getState().setPlayers(players);
      gs.setShowReplay(true);
      setTimeout(() => gs.setShowReplay(false), 2000);
    });

    socket.on('game_over', ({ finalScores }) => {
      useGameStore.getState().setFinalScores(finalScores);
      useGameStore.getState().setPhase('ended');
      useGameStore.getState().setShowScoreboard(true);
      playFanfare(useGameStore.getState().muted);
    });

    socket.on('return_to_lobby', ({ players, hostId, totalRounds }) => {
      useRoomStore.getState().setPlayers(players);
      useRoomStore.getState().setHostId(hostId);
      useRoomStore.getState().setTotalRounds(totalRounds);
      useRoomStore.getState().setIsHost(hostId === usePlayerStore.getState().playerId);
      useGameStore.getState().resetGame();
      const code = useRoomStore.getState().roomCode;
      if (window.location.pathname === '/game') {
        window.location.href = `/lobby?room=${code}`;
      }
    });

    socket.on('close_guess', ({ message }) => {
      toast(message, { icon: '⚡' });
    });

    socket.on('waiting_for_player', ({ name }: { name: string }) => {
      toast(`Waiting for ${name}...`, { duration: 5000, icon: '⏳' });
    });

    socket.on('emoji_reaction', () => {
      /* handled in component */
    });

    return () => {
      socket.removeAllListeners();
      registered.current = false;
    };
  }, []);
}

export async function tryRejoin(): Promise<JoinAckSuccess | null> {
  const session = loadSession();
  if (!session) return null;

  const ack = await import('../lib/socket').then((m) =>
    m.rejoinLobby({
      roomCode: session.roomCode,
      playerId: session.playerId,
      name: session.name,
      characterId: session.characterId,
    })
  );

  if ('error' in ack) {
    return null;
  }

  updateSessionPlayerId(ack.playerId);
  saveSession({
    name: session.name,
    characterId: session.characterId,
    roomCode: ack.roomCode,
    playerId: ack.playerId,
  });

  usePlayerStore.getState().setPlayerId(ack.playerId);
  usePlayerStore.getState().setName(session.name);
  usePlayerStore.getState().setCharacterId(session.characterId);
  useRoomStore.getState().setRoomCode(ack.roomCode);
  useRoomStore.getState().setPlayers(ack.players);
  useRoomStore.getState().setHostId(ack.hostId);
  useRoomStore.getState().setIsHost(ack.isHost);
  useRoomStore.getState().setTotalRounds(ack.totalRounds);
  useGameStore.getState().setPhase(ack.phase);
  useGameStore.getState().setTotalRounds(ack.totalRounds);

  return ack;
}

export function emitReady(ready: boolean): void {
  getSocket().emit('player_ready', { ready });
}

export function emitSetRounds(totalRounds: number): void {
  getSocket().emit('set_rounds', { totalRounds });
}

export function emitStartGame(): void {
  getSocket().emit('start_game', {});
}

export function emitPlayAgain(): void {
  getSocket().emit('play_again', {});
}

export function emitGuess(guess: string): void {
  getSocket().emit('player_guess', { guess });
}

export function emitChat(text: string): void {
  getSocket().emit('chat_message', { text });
}

export function emitStroke(stroke: Stroke): void {
  getSocket().emit('draw_stroke', stroke);
}

export function emitCanvasClear(): void {
  getSocket().emit('canvas_clear', {});
}

export function emitCanvasUndo(strokes: Stroke[]): void {
  getSocket().emit('canvas_undo', { strokes });
}

export function emitCanvasFill(stroke: Stroke): void {
  getSocket().emit('canvas_fill', stroke);
}

export function emitEmoji(emoji: string): void {
  getSocket().emit('emoji_reaction', { emoji });
}
