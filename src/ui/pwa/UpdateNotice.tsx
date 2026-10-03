import { RefreshCw } from 'lucide-react';
import { useI18n } from '../../i18n';
import { pwaStore } from '../../pwa/register';
import { usePwaState } from './usePwaState';

/** A newer version is installed: offer Reload, never reload by itself, so a run is never interrupted (PRD-0004 §4). */
export function UpdateNotice() {
  const { m } = useI18n();
  const { updateWaiting, dismissed } = usePwaState();
  if (!updateWaiting || dismissed) return null;
  return (
    <div role="status" aria-label={m.pwa.updateAvailable} className="update-notice">
      <span>{m.pwa.updateAvailable}</span>
      <button type="button" onClick={() => pwaStore.applyUpdate()} className="update-reload">
        <RefreshCw aria-hidden="true" size={14} strokeWidth={2} />
        {m.pwa.reload}
      </button>
      <button type="button" onClick={() => pwaStore.dispatch({ type: 'dismiss' })} className="ghost-button">
        {m.common.dismiss}
      </button>
    </div>
  );
}
