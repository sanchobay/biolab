import { CircleCheck, Droplets, FlaskConical, OctagonAlert, Sun, Thermometer, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { StateIconKey } from '../presentation/labels';

const ICONS: Record<StateIconKey, LucideIcon> = {
  healthy: CircleCheck,
  suboptimal: TriangleAlert,
  stressed: OctagonAlert,
  thermal: Thermometer,
  photoinhibition: Sun,
  'ph-low': Droplets,
  'ph-high': Droplets,
  // Used only by the Ready explanation ("Ready to experiment").
  info: FlaskConical,
  error: TriangleAlert,
};

export function StateIcon({ name, className, size = 16 }: { name: StateIconKey; className?: string; size?: number }) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" size={size} strokeWidth={2} className={className} />;
}
