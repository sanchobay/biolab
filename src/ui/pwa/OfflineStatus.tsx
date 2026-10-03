import { CloudCheck, CloudOff } from 'lucide-react';
import { useI18n } from '../../i18n';
import { usePwaState } from './usePwaState';

/** Header status: shown only once the app is really cached, so it never claims offline readiness it lacks (PRD-0004 §5). */
export function OfflineStatus() {
  const { m } = useI18n();
  const { offlineReady, online } = usePwaState();
  if (!offlineReady) return null;
  const Icon = online ? CloudCheck : CloudOff;
  return (
    <p className="offline-status">
      <Icon aria-hidden="true" size={16} strokeWidth={2} />
      <span>{online ? m.pwa.offlineReady : m.pwa.offline}</span>
    </p>
  );
}
