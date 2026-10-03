// One reader at a time (PRD-0005 §5, ADR-0005 §1): a module-level controller over the browser's speechSynthesis.
// Text is spoken chunk by chunk; each reading has a session number, so late events from a cancelled reading are ignored.
// The browser objects are read at call time, so a page without speech support simply never starts.
import { useSyncExternalStore } from 'react';
import type { VoiceLike } from './voices';

export type SpeechStatus = 'idle' | 'speaking' | 'paused';

export interface SpeechState {
  status: SpeechStatus;
  /** The region that is reading, e.g. "explanation" or "learn-theory". */
  owner: string | null;
}

const IDLE: SpeechState = { status: 'idle', owner: null };

let state: SpeechState = IDLE;
let session = 0;
const listeners = new Set<() => void>();

function set(next: SpeechState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

function engine(): { synth: SpeechSynthesis; Utterance: typeof SpeechSynthesisUtterance } | null {
  if (typeof window === 'undefined') return null;
  const synth = (window as Partial<Window>).speechSynthesis;
  const Utterance = (window as { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance }).SpeechSynthesisUtterance;
  return synth && Utterance ? { synth, Utterance } : null;
}

export const speechSupported = (): boolean => engine() !== null;

/** Voices the browser reports now; Chrome fills the list asynchronously and then fires voiceschanged. */
export const currentVoices = (): VoiceLike[] => engine()?.synth.getVoices() ?? [];

/** Starts reading for `owner`, stopping any other reading first. Returns false when nothing can be spoken. */
export function startSpeech(owner: string, chunks: readonly string[], voice: VoiceLike): boolean {
  const e = engine();
  if (!e || chunks.length === 0) return false;
  const id = ++session;
  e.synth.cancel();
  set({ status: 'speaking', owner });

  const speakFrom = (index: number) => {
    if (id !== session) return;
    if (index >= chunks.length) {
      set(IDLE);
      return;
    }
    const utterance = new e.Utterance(chunks[index]);
    utterance.voice = voice as unknown as SpeechSynthesisVoice;
    utterance.lang = voice.lang;
    utterance.onend = () => speakFrom(index + 1);
    utterance.onerror = () => {
      if (id !== session) return;
      session += 1;
      set(IDLE);
    };
    e.synth.speak(utterance);
  };
  speakFrom(0);
  return true;
}

export function pauseSpeech(): void {
  if (state.status !== 'speaking') return;
  engine()?.synth.pause();
  set({ ...state, status: 'paused' });
}

export function resumeSpeech(): void {
  if (state.status !== 'paused') return;
  engine()?.synth.resume();
  set({ ...state, status: 'speaking' });
}

/** Stops the current reading; with an owner, only when that region is the one reading. */
export function stopSpeech(owner?: string): void {
  if (state.status === 'idle' || (owner !== undefined && state.owner !== owner)) return;
  session += 1;
  engine()?.synth.cancel();
  set(IDLE);
}

export const speechStore = {
  getState: (): SpeechState => state,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Back to idle without speaking (tests). */
  reset(): void {
    session += 1;
    set(IDLE);
  },
};

export const useSpeechState = (): SpeechState => useSyncExternalStore(speechStore.subscribe, speechStore.getState, speechStore.getState);
