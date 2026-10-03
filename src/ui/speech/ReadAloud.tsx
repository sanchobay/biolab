import { Pause, Play, Square, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { speechChunks } from '../../presentation/speech';
import { currentVoices, pauseSpeech, resumeSpeech, speechSupported, startSpeech, stopSpeech, useSpeechState } from './speechController';
import { pickVoice, type VoiceLike } from './voices';

const ICON = { 'aria-hidden': true, size: 16, strokeWidth: 2 } as const;

/** The device's voices, updated when the browser finishes loading them (Chrome fires voiceschanged). */
function useVoices(): VoiceLike[] {
  const [voices, setVoices] = useState<VoiceLike[]>(currentVoices);
  useEffect(() => {
    const synth = speechSupported() ? window.speechSynthesis : null;
    if (!synth) return undefined;
    const update = () => setVoices(currentVoices());
    update();
    synth.addEventListener('voiceschanged', update);
    return () => synth.removeEventListener('voiceschanged', update);
  }, []);
  return voices;
}

interface ReadAloudProps {
  /** The region this control reads; one region reads at a time. */
  id: string;
  /** The text to read, taken when reading starts (a snapshot: it does not follow later updates). */
  getText: () => string;
}

/**
 * Read aloud control (PRD-0005 §5, DESIGN_SYSTEM §31): Read aloud → Pause / Resume and Stop. Local voices of the
 * interface language only; when there is none, or no speech support, the control stays visible, disabled, with the
 * reason. Reading never starts by itself and stops when the language changes or the region unmounts.
 */
export function ReadAloud({ id, getText }: ReadAloudProps) {
  const { locale, m } = useI18n();
  const s = m.speech;
  const voices = useVoices();
  const supported = speechSupported();
  const voice = supported ? pickVoice(voices, locale) : null;
  const { status, owner } = useSpeechState();
  const mine = owner === id ? status : 'idle';
  const primary = useRef<HTMLButtonElement>(null);

  // Cleanup runs on a language change and on unmount (e.g. a view change); it only stops this region's reading.
  useEffect(() => () => stopSpeech(id), [id, locale]);

  const reason = !supported ? s.unsupported : voice ? null : s.noVoice;
  const reasonId = `${id}-speech-reason`;

  const onPrimary = () => {
    if (mine === 'speaking') pauseSpeech();
    else if (mine === 'paused') resumeSpeech();
    else if (voice) startSpeech(id, speechChunks(getText()), voice);
  };

  return (
    <div className="read-aloud" data-speech-skip="">
      <button
        ref={primary}
        type="button"
        disabled={mine === 'idle' && reason !== null}
        aria-describedby={reason ? reasonId : undefined}
        onClick={onPrimary}
        className="ghost-button"
      >
        {mine === 'speaking' ? <Pause {...ICON} /> : mine === 'paused' ? <Play {...ICON} /> : <Volume2 {...ICON} />}
        {mine === 'speaking' ? s.pause : mine === 'paused' ? s.resume : s.readAloud}
      </button>
      {mine !== 'idle' && (
        <button
          type="button"
          onClick={() => {
            stopSpeech(id);
            primary.current?.focus();
          }}
          className="ghost-button"
        >
          <Square {...ICON} />
          {s.stop}
        </button>
      )}
      {reason && (
        <span id={reasonId} className="speech-reason">
          {reason}
        </span>
      )}
    </div>
  );
}
