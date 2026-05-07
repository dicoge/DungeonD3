// ============================================================
// 音效服務 (expo-av)
// 後期可替換為真實音效檔案
// ============================================================
import { Audio } from 'expo-av';

// 頻率對應
const NOTE_FREQ: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25,
  F5: 698.46, G5: 783.99, A5: 880.00,
};

let audioEnabled = false;

export async function initAudio() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    audioEnabled = true;
  } catch {
    audioEnabled = false;
  }
}

// 播放一個音符（使用短促的 Beep）
async function playTone(freq: number, duration: number = 150) {
  if (!audioEnabled) return;
  try {
    // expo-av 不支持直接合成音色
    // 這裡預留介面，未來可改用實際音檔
    // 目前平穩(no-op)度過，遊戲核心功能優先
  } catch {}
}

export const SFX = {
  async roll() {
    await playTone(NOTE_FREQ.G4, 100);
    setTimeout(() => playTone(NOTE_FREQ.C5, 100), 80);
  },

  async hit() {
    await playTone(NOTE_FREQ.A3, 150);
  },

  async miss() {
    await playTone(NOTE_FREQ.C3, 100);
  },

  async playerHit() {
    await playTone(NOTE_FREQ.E3, 200);
  },

  async pickup() {
    await playTone(NOTE_FREQ.G5, 100);
    setTimeout(() => playTone(NOTE_FREQ.C5, 100), 60);
    setTimeout(() => playTone(NOTE_FREQ.E5, 150), 120);
  },

  async levelUp() {
    const notes = [NOTE_FREQ.C5, NOTE_FREQ.E5, NOTE_FREQ.G5, NOTE_FREQ.C5];
    for (let i = 0; i < notes.length; i++) {
      setTimeout(() => playTone(notes[i], 150), i * 100);
    }
  },

  async enemyDie() {
    await playTone(NOTE_FREQ.A3, 100);
    setTimeout(() => playTone(NOTE_FREQ.E3, 150), 60);
    setTimeout(() => playTone(NOTE_FREQ.A3, 200), 140);
  },

  async floor() {
    await playTone(NOTE_FREQ.C5, 200);
    setTimeout(() => playTone(NOTE_FREQ.E5, 200), 150);
    setTimeout(() => playTone(NOTE_FREQ.G5, 300), 300);
  },

  async crit() {
    await playTone(NOTE_FREQ.C4, 80);
    setTimeout(() => playTone(NOTE_FREQ.E4, 80), 50);
    setTimeout(() => playTone(NOTE_FREQ.G4, 100), 100);
  },

  async btn() {
    await playTone(NOTE_FREQ.C5, 50);
  },

  async heal() {
    await playTone(NOTE_FREQ.E4, 150);
    setTimeout(() => playTone(NOTE_FREQ.G4, 150), 100);
    setTimeout(() => playTone(NOTE_FREQ.C5, 200), 200);
  },

  async buy() {
    await playTone(NOTE_FREQ.G4, 100);
    setTimeout(() => playTone(NOTE_FREQ.C5, 150), 80);
  },

  async equip() {
    await playTone(NOTE_FREQ.E4, 100);
    setTimeout(() => playTone(NOTE_FREQ.G4, 150), 80);
  },
};
