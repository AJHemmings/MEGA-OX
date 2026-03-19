// Web Audio API sound effects — no audio files needed.
// AudioContext must be created on user interaction, then reused.

let ctx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!ctx) ctx = new AudioContext();
  return ctx;
};

const playTone = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue = 0.3,
  delay = 0
) => {
  const audioCtx = getCtx();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime + delay);

  gainNode.gain.setValueAtTime(gainValue, audioCtx.currentTime + delay);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);

  oscillator.start(audioCtx.currentTime + delay);
  oscillator.stop(audioCtx.currentTime + delay + duration);
};

// Short click — a marker was placed
export const playMarkerPlaced = () => {
  playTone(440, 0.08, 'square', 0.15);
};

// Rising two-note chime — it's your turn
export const playYourTurn = () => {
  playTone(523, 0.15, 'sine', 0.25);        // C5
  playTone(659, 0.2, 'sine', 0.25, 0.15);   // E5
};

// Three-note ascending fanfare — you won a micro board
export const playMicroBoardWon = () => {
  playTone(523, 0.12, 'sine', 0.3);
  playTone(659, 0.12, 'sine', 0.3, 0.13);
  playTone(784, 0.2, 'sine', 0.3, 0.26);
};

// Ascending arpeggio — game won
export const playGameWon = () => {
  [523, 659, 784, 1047].forEach((f, i) => {
    playTone(f, 0.18, 'sine', 0.3, i * 0.12);
  });
};

// Descending tone — game lost
export const playGameLost = () => {
  playTone(392, 0.2, 'sine', 0.25);
  playTone(330, 0.3, 'sine', 0.25, 0.22);
};
