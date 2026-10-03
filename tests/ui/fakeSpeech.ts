// A minimal speechSynthesis stand-in for jsdom (ExecPlan 0009): records utterances and lets a test end them.
import { vi } from 'vitest';
import type { VoiceLike } from '../../src/ui/speech/voices';

export class FakeUtterance {
  text: string;
  voice: VoiceLike | null = null;
  lang = '';
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

export interface FakeSpeech {
  synth: {
    speaking: boolean;
    paused: boolean;
    getVoices: () => VoiceLike[];
    speak: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
    addEventListener: (type: string, listener: () => void) => void;
    removeEventListener: (type: string, listener: () => void) => void;
  };
  /** Every utterance passed to speak(), in order. */
  spoken: FakeUtterance[];
  /** Ends the most recent utterance, as the browser does when it finishes speaking. */
  finishCurrent: () => void;
  /** Replaces the voice list and fires voiceschanged. */
  setVoices: (voices: VoiceLike[]) => void;
}

export function voice(name: string, lang: string, localService = true, isDefault = false): VoiceLike {
  return { name, lang, localService, default: isDefault, voiceURI: name };
}

export const LAPTOP_VOICES: VoiceLike[] = [
  voice('Albert', 'en-US'),
  voice('Daniel', 'en-GB'),
  voice('Milena', 'ru-RU'),
  voice('Samantha', 'en-US', true, true),
];

/** Installs the fake on window; returns handles for the test. */
export function installFakeSpeech(initialVoices: VoiceLike[] = LAPTOP_VOICES): FakeSpeech {
  let voices = initialVoices;
  const listeners = new Set<() => void>();
  const spoken: FakeUtterance[] = [];
  const synth: FakeSpeech['synth'] = {
    speaking: false,
    paused: false,
    getVoices: () => voices,
    speak: vi.fn((utterance: FakeUtterance) => {
      spoken.push(utterance);
      synth.speaking = true;
    }),
    cancel: vi.fn(() => {
      synth.speaking = false;
      synth.paused = false;
    }),
    pause: vi.fn(() => {
      synth.paused = true;
    }),
    resume: vi.fn(() => {
      synth.paused = false;
    }),
    addEventListener: (type, listener) => {
      if (type === 'voiceschanged') listeners.add(listener);
    },
    removeEventListener: (type, listener) => {
      if (type === 'voiceschanged') listeners.delete(listener);
    },
  };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, writable: true, value: synth });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, writable: true, value: FakeUtterance });
  return {
    synth,
    spoken,
    finishCurrent: () => spoken[spoken.length - 1]?.onend?.(),
    setVoices: (next) => {
      voices = next;
      listeners.forEach((listener) => listener());
    },
  };
}

export function removeFakeSpeech(): void {
  Reflect.deleteProperty(window, 'speechSynthesis');
  Reflect.deleteProperty(window, 'SpeechSynthesisUtterance');
}
