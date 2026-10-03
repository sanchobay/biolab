// R1 (ExecPlan 0009, PRD-0005 §5, ADR-0005 §1): only local voices of the interface language, preferred voices first.
import { describe, expect, it } from 'vitest';
import { PREFERRED_VOICES, pickVoice, type VoiceLike } from '../../src/ui/speech/voices';

const voice = (name: string, lang: string, localService = true, isDefault = false): VoiceLike => ({
  name,
  lang,
  localService,
  default: isDefault,
  voiceURI: name,
});

// The voices Chrome exposes on the demo laptop (ExecPlan 0009 device inventory), plus a network voice.
const LAPTOP = [
  voice('Albert', 'en-US'),
  voice('Bad News', 'en-US'),
  voice('Daniel', 'en-GB'),
  voice('Fred', 'en-US'),
  voice('Google US English', 'en-US', false),
  voice('Karen', 'en-AU'),
  voice('Milena', 'ru-RU'),
  voice('Moira', 'en-IE'),
  voice('Samantha', 'en-US', true, true),
  voice('Tessa', 'en-ZA'),
  voice('Zarvox', 'en-US'),
];

const named = (voices: VoiceLike[], ...names: string[]) => voices.filter((v) => !names.includes(v.name));

describe('R1 voice choice', () => {
  it('prefers Samantha, Daniel, Karen, Moira, Tessa in that order', () => {
    expect(PREFERRED_VOICES).toEqual(['Samantha', 'Daniel', 'Karen', 'Moira', 'Tessa']);
    expect(pickVoice(LAPTOP, 'en')?.name).toBe('Samantha');
    expect(pickVoice(named(LAPTOP, 'Samantha'), 'en')?.name).toBe('Daniel');
    expect(pickVoice(named(LAPTOP, 'Samantha', 'Daniel'), 'en')?.name).toBe('Karen');
    expect(pickVoice(named(LAPTOP, 'Samantha', 'Daniel', 'Karen', 'Moira'), 'en')?.name).toBe('Tessa');
  });

  it('never uses a network voice, even a preferred name', () => {
    const networkOnly = [voice('Samantha', 'en-US', false), voice('Google US English', 'en-US', false), voice('Fred', 'en-US')];
    expect(pickVoice(networkOnly, 'en')?.name).toBe('Fred');
    expect(pickVoice([voice('Google русский', 'ru-RU', false)], 'ru')).toBeNull();
  });

  it('falls back to any local voice of the language except novelty voices', () => {
    const novelty = [voice('Albert', 'en-US'), voice('Bubbles', 'en-US'), voice('Zarvox', 'en-US'), voice('Whisper', 'en-US')];
    expect(pickVoice([...novelty, voice('Fred', 'en-US')], 'en')?.name).toBe('Fred');
    expect(pickVoice(novelty, 'en')).toBeNull();
  });

  it('prefers the default voice, then the main region, in the fallback', () => {
    expect(pickVoice([voice('Yuri', 'ru-RU'), voice('Milena', 'ru-RU', true, true)], 'ru')?.name).toBe('Milena');
    expect(pickVoice([voice('Rishi', 'en-IN'), voice('Fred', 'en-US')], 'en')?.name).toBe('Fred');
  });

  it('never reads one language with another language voice', () => {
    expect(pickVoice(LAPTOP, 'ru')?.name).toBe('Milena');
    expect(pickVoice(LAPTOP, 'kk')).toBeNull();
    expect(pickVoice([voice('Samantha', 'en-US'), voice('Milena', 'ru-RU')], 'kk')).toBeNull();
  });

  it('accepts underscore language tags, as macOS reports them', () => {
    expect(pickVoice([voice('Aru', 'kk_KZ'), voice('Samantha', 'en-US')], 'kk')?.name).toBe('Aru');
    expect(pickVoice([voice('Aru', 'kk-KZ')], 'kk')?.name).toBe('Aru');
  });
});
