import { NormalizedLandmark } from "@mediapipe/tasks-vision";

export const SPRINT_SEQUENCE = {
  PREP_TIME: 3000,
  BEEP_1: 4000,
  BEEP_2: 5000,
  BEEP_3: 6000,
  GUN_SHOT: 7000
};

const playImpactBeep = (isFinal: boolean) => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth"; 
  
  osc.frequency.setValueAtTime(isFinal ? 600 : 300, ctx.currentTime);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.005); 
  
  const decayTime = isFinal ? 0.8 : 0.3;
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decayTime);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + decayTime + 0.1);
};

export function process_sprint_landmarks(landmarks: NormalizedLandmark[][]) {
  const player = landmarks[0];
  const hipX = (player[23].x + player[24].x) / 2;
  const groundWristY = Math.max(player[15].y, player[16].y);
  const ankleY = (player[27].y + player[28].y) / 2;
  return { hipX, groundWristY, ankleY };
}

export const sprintRoutine = (onGo: () => void) => {
  // 3 sekundy na ustawienie się, potem 3 piknięcia co sekundę
[3000, 4000, 5000].forEach((delay) => {
  setTimeout(() => playImpactBeep(false), delay);
});

setTimeout(() => {
  playImpactBeep(true); // To jest to uderzenie na start
  onGo();
}, 6000);
};

