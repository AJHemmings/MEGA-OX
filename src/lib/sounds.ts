// Web Audio API sound effects — no audio files needed.
// AudioContext must be created on user interaction, then reused.
//
// The tones themselves come from the theme, which is why this file reads
// CLASSIC_THEME directly rather than tokens.ts: a var() string means nothing
// to an oscillator. Theme sounds are numbers, not CSS.
import { CLASSIC_THEME } from '../theme/defaults';
import { ThemeSounds } from '../theme/types';

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

const playEvent = (event: keyof ThemeSounds) => {
  CLASSIC_THEME.sounds[event].forEach(t =>
    playTone(t.freq, t.dur, t.wave, t.gain, t.delay)
  );
};

// The five exported names are imported by GameWrapper and OnlineGameView and
// must not change. What each one sounds like now lives in the theme.
export const playMarkerPlaced  = () => playEvent('marker_placed');   // short click
export const playYourTurn      = () => playEvent('your_turn');       // rising two-note chime
export const playMicroBoardWon = () => playEvent('micro_board_won'); // three-note fanfare
export const playGameWon       = () => playEvent('game_won');        // ascending arpeggio
export const playGameLost      = () => playEvent('game_lost');       // descending tone

// Unlock AudioContext after a user gesture — call this on first click
export const resumeAudio = (): void => {
  const audioCtx = getCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
};
