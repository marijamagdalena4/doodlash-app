let tickAudio: HTMLAudioElement | null = null;
let popAudio: HTMLAudioElement | null = null;
let fanfareAudio: HTMLAudioElement | null = null;

function beep(freq: number, duration: number, volume = 0.15): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* ignore */
  }
}

export function playTick(muted: boolean): void {
  if (muted) return;
  beep(880, 0.05, 0.08);
}

export function playPop(muted: boolean): void {
  if (muted) return;
  beep(523, 0.1, 0.2);
  setTimeout(() => beep(659, 0.15, 0.15), 50);
}

export function playFanfare(muted: boolean): void {
  if (muted) return;
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => beep(f, 0.2, 0.12), i * 120);
  });
}

export function initSounds(): void {
  tickAudio = null;
  popAudio = null;
  fanfareAudio = null;
}
