// @vitest-environment jsdom
// R4 (ExecPlan 0009, PRD-0005 §5, ADR-0005 §1): one reader at a time, chunk by chunk, with pause, resume and stop.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { pauseSpeech, resumeSpeech, speechStore, startSpeech, stopSpeech } from '../../src/ui/speech/speechController';
import { installFakeSpeech, removeFakeSpeech, voice, type FakeSpeech } from './fakeSpeech';

const samantha = voice('Samantha', 'en-US', true, true);
let fake: FakeSpeech;

beforeEach(() => {
  fake = installFakeSpeech();
});

afterEach(() => {
  speechStore.reset();
  removeFakeSpeech();
});

describe('R4 speech controller', () => {
  it('speaks chunks one after another with the chosen voice and its language, then returns to idle', () => {
    expect(startSpeech('explanation', ['First.', 'Second.'], samantha)).toBe(true);
    expect(speechStore.getState()).toEqual({ status: 'speaking', owner: 'explanation' });
    expect(fake.spoken.map((u) => u.text)).toEqual(['First.']);
    expect(fake.spoken[0].voice).toBe(samantha);
    expect(fake.spoken[0].lang).toBe('en-US');

    fake.finishCurrent();
    expect(fake.spoken.map((u) => u.text)).toEqual(['First.', 'Second.']);
    fake.finishCurrent();
    expect(speechStore.getState()).toEqual({ status: 'idle', owner: null });
  });

  it('pauses, resumes and stops', () => {
    startSpeech('results', ['One.'], samantha);
    pauseSpeech();
    expect(fake.synth.pause).toHaveBeenCalledTimes(1);
    expect(speechStore.getState().status).toBe('paused');
    resumeSpeech();
    expect(fake.synth.resume).toHaveBeenCalledTimes(1);
    expect(speechStore.getState().status).toBe('speaking');
    stopSpeech();
    expect(fake.synth.cancel).toHaveBeenCalled();
    expect(speechStore.getState()).toEqual({ status: 'idle', owner: null });
  });

  it('starting another region stops the current one, and late ends from the cancelled reading are ignored', () => {
    startSpeech('explanation', ['Old one.', 'Old two.'], samantha);
    const stale = fake.spoken[0];
    const cancelsBefore = fake.synth.cancel.mock.calls.length;
    startSpeech('learn-theory', ['New one.', 'New two.'], samantha);
    expect(fake.synth.cancel.mock.calls.length).toBeGreaterThan(cancelsBefore);
    expect(speechStore.getState()).toEqual({ status: 'speaking', owner: 'learn-theory' });

    stale.onend?.();
    expect(fake.spoken.map((u) => u.text)).toEqual(['Old one.', 'New one.']);
    fake.finishCurrent();
    expect(fake.spoken.map((u) => u.text)).toEqual(['Old one.', 'New one.', 'New two.']);
  });

  it('stops only its own reading when an owner is given', () => {
    startSpeech('results', ['One.'], samantha);
    stopSpeech('explanation');
    expect(speechStore.getState().owner).toBe('results');
    stopSpeech('results');
    expect(speechStore.getState().status).toBe('idle');
  });

  it('does nothing without speech support or text', () => {
    expect(startSpeech('results', [], samantha)).toBe(false);
    removeFakeSpeech();
    expect(startSpeech('results', ['One.'], samantha)).toBe(false);
    expect(speechStore.getState().status).toBe('idle');
  });
});
