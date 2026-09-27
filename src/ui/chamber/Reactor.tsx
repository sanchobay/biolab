import { useId, type CSSProperties } from 'react';
import { REACTOR_POOL, type ReactorVisualState } from '../../presentation/reactorVisualState';

// Vessel geometry (drawing space 0 0 520 460; the viewBox crops the empty margins).
const VESSEL_OUTER = 'M166 104 V358 Q166 382 190 382 H370 Q394 382 394 358 V104 Z';
const VESSEL_INNER = 'M171 104 V356 Q171 377 192 377 H368 Q389 377 389 356 V104 Z';
const LIQUID_TOP = 152;
// One helical trichome segment, drawn as a sine path.
const FILAMENT = 'M0 0 c2.5 -5 5.5 -5 8 0 s5.5 5 8 0 s5.5 -5 8 0 s5.5 5 8 0';

/** Deterministic placement so the scene is stable between renders (visual randomness only, ADR-0002 §7). */
function pseudoRandom(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Layout is computed once, outside React. Pool membership and keys survive every sample update.
const FILAMENT_POOL = Array.from({ length: REACTOR_POOL.filaments }, (_, i) => ({
  transform: `translate(${(204 + pseudoRandom(i, 1) * 150).toFixed(1)} ${(190 + pseudoRandom(i, 2) * 148).toFixed(1)}) rotate(${Math.round(pseudoRandom(i, 7) * 180)}) scale(${(0.65 + pseudoRandom(i, 8) * 0.3).toFixed(2)})`,
  duration: 0.8 + 0.4 * pseudoRandom(i, 3),
  delay: `${-(pseudoRandom(i, 4) * 24).toFixed(1)}s`,
  dx: `${((i % 2 ? -1 : 1) * (14 + pseudoRandom(i, 5) * 12)).toFixed(1)}px`,
  dy: `${((i % 2 ? 1 : -1) * (30 + pseudoRandom(i, 6) * 18)).toFixed(1)}px`,
  opacity: 0.7 + 0.25 * pseudoRandom(i, 9),
}));
const AIR_POOL = Array.from({ length: REACTOR_POOL.aeration }, (_, i) => ({
  x: 220 + ((i * 47) % 122),
  radius: 3.3 + pseudoRandom(i, 22) * 1.1,
  // Shared travel time keeps the staggered pool distributed along the full diffuser stream.
  duration: 6.8,
  dx: `${(pseudoRandom(i, 24) * 12 - 6).toFixed(1)}px`,
}));
const PHOTO_POOL = Array.from({ length: REACTOR_POOL.photosynthesis }, (_, i) => ({
  x: 192 + ((i * 53) % 178),
  y: 232 + pseudoRandom(i, 12) * 110,
  duration: 5 + pseudoRandom(i, 13) * 2,
  delay: `${-(pseudoRandom(i, 14) * 10).toFixed(1)}s`,
  rise: `${-Math.round(58 + pseudoRandom(i, 15) * 24)}px`,
}));

export interface ReactorProps {
  visual: ReactorVisualState;
  /** Localized accessible description of the depicted state. */
  label: string;
}

/**
 * Illustrative photobioreactor (DESIGN_SYSTEM §14, PRD-0002 §5). Each layer is a separate, labelled SVG group driven by
 * model outputs, so it can be animated independently. Every appearance is an illustrative cue, never a measurement.
 */
export function Reactor({ visual, label }: ReactorProps) {
  const { lampOn, lampIntensity: glow, aeration, capacity, density, filamentCount, mixingSeconds } = visual;
  const liquidId = `${useId()}-liquid`;
  // Culture colour follows capacity: paler, never darker; unchanged by darkness.
  const cultureFill = `color-mix(in srgb, var(--bl-culture) ${Math.round(capacity * 100)}%, var(--bl-culture-reduced))`;
  const filamentStroke = `color-mix(in srgb, var(--bl-filament) 85%, ${cultureFill})`;
  // Optical contrast only: keep ordinary illumination readable at the normal workspace scale.
  const beamStrength = Math.min(1, glow * 1.65);
  const beamOpacity = { opacity: `calc(var(--bl-glow-max) * ${beamStrength.toFixed(3)})` };

  return (
    <svg
      viewBox="28 8 452 446"
      role="img"
      aria-label={label}
      className="reactor"
      preserveAspectRatio="xMidYMid meet"
      data-lamp={lampOn ? 'on' : 'off'}
      data-aeration={aeration}
      data-health={visual.health ?? 'preview'}
      data-photosynthesis={visual.photosynthesisActivity}
      style={{ '--bl-culture-activity': visual.cultureActivity } as CSSProperties}
    >
      <defs>
        <linearGradient id="rx-steel" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--bl-steel-3)' }} />
          <stop offset="0.35" style={{ stopColor: 'var(--bl-steel-1)' }} />
          <stop offset="0.65" style={{ stopColor: 'var(--bl-steel-2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--bl-steel-3)' }} />
        </linearGradient>
        <linearGradient id="rx-beam" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--bl-glow)', stopOpacity: 1 }} />
          <stop offset="0.55" style={{ stopColor: 'var(--bl-glow)', stopOpacity: 0.8 }} />
          <stop offset="1" style={{ stopColor: 'var(--bl-glow)', stopOpacity: 0 }} />
        </linearGradient>
        <linearGradient id="rx-liquid-shade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--bl-glass-shine)', stopOpacity: 0.45 }} />
          <stop offset="0.22" style={{ stopColor: 'var(--bl-glass-shine)', stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: 'var(--bl-filament)', stopOpacity: 0.3 }} />
        </linearGradient>
        <linearGradient id="rx-liquid-depth" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--bl-filament)', stopOpacity: 0.28 }} />
          <stop offset="0.2" style={{ stopColor: 'var(--bl-filament)', stopOpacity: 0 }} />
          <stop offset="0.78" style={{ stopColor: 'var(--bl-filament)', stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: 'var(--bl-filament)', stopOpacity: 0.32 }} />
        </linearGradient>
        <clipPath id="rx-vessel">
          <path d={VESSEL_INNER} />
        </clipPath>
        <clipPath id={liquidId}>
          <path d={`M171 ${LIQUID_TOP + 2} H389 V356 Q389 377 368 377 H192 Q171 377 171 356 Z`} />
        </clipPath>
      </defs>

      <ellipse cx="280" cy="436" rx="214" ry="14" style={{ fill: 'var(--bl-floor-shadow)' }} />

      {/* Lamp: a vertical panel whose glow falls on the vessel (glow opacity follows √(I / 2,200) in light, off in darkness). */}
      <g data-layer="lamp">
        <ellipse cx="64" cy="432" rx="30" ry="6" style={{ fill: 'var(--bl-steel-3)' }} />
        <rect x="60" y="330" width="8" height="102" fill="url(#rx-steel)" />
        <rect x="44" y="118" width="40" height="220" rx="10" fill="url(#rx-steel)" style={{ stroke: 'var(--bl-steel-3)' }} />
        <rect x="74" y="128" width="8" height="200" rx="4" style={{ fill: 'var(--bl-steel-3)' }} />
        <rect
          x="74"
          y="128"
          width="8"
          height="200"
          rx="4"
          style={{ fill: 'var(--bl-glow)', opacity: lampOn ? 0.45 + 0.55 * glow : 0 }}
          className="bl-fade rx-lamp-emission"
        />
      </g>
      <path data-layer="glow" d="M82 128 L389 98 L389 388 L82 328 Z" fill="url(#rx-beam)" style={beamOpacity} className="bl-fade" />

      {/* Base platform; the ring shows the air pump setting. */}
      <g data-layer="base">
        <rect x="110" y="392" width="340" height="24" fill="url(#rx-steel)" />
        <ellipse cx="280" cy="416" rx="170" ry="12" style={{ fill: 'var(--bl-steel-3)' }} />
        <ellipse cx="280" cy="392" rx="170" ry="14" style={{ fill: 'var(--bl-steel-1)', stroke: 'var(--bl-steel-2)' }} />
        <path
          d="M118 404 A162 11 0 0 0 442 404"
          fill="none"
          style={{ stroke: 'var(--bl-accent-aeration)' }}
          strokeWidth={8}
          strokeOpacity={visual.aerationRing * 0.25}
          strokeLinecap="round"
          className="bl-fade"
        />
        <path
          d="M118 404 A162 11 0 0 0 442 404"
          fill="none"
          style={{ stroke: 'var(--bl-accent-aeration)' }}
          strokeWidth={2.5}
          strokeOpacity={visual.aerationRing}
          strokeLinecap="round"
          className="bl-fade"
        />
      </g>

      <g data-layer="frame">
        <rect x="144" y="86" width="10" height="308" fill="url(#rx-steel)" />
        <rect x="406" y="86" width="10" height="308" fill="url(#rx-steel)" />
      </g>

      <path data-layer="glass-back" d={VESSEL_OUTER} style={{ fill: 'var(--bl-glass)' }} />

      <g data-layer="culture" clipPath="url(#rx-vessel)">
        <rect x="166" y={LIQUID_TOP} width="228" height="232" style={{ fill: cultureFill }} opacity={density} className="bl-fade" />
        <rect x="166" y={LIQUID_TOP} width="228" height="232" fill="url(#rx-liquid-shade)" />
        <rect x="166" y={LIQUID_TOP} width="228" height="232" fill="url(#rx-liquid-depth)" />
        <rect x="166" y="104" width="228" height="280" fill="url(#rx-beam)" style={{ opacity: `calc(var(--bl-glow-max) * ${(beamStrength * 0.65).toFixed(3)})` }} className="bl-fade rx-lamp-emission" />
        <g clipPath={`url(#${liquidId})`}>
          <path d="M230 140 C188 208 290 256 238 308 S214 384 256 402" className="bl-anim rx-liquid-current" />
          <path d="M340 132 C286 192 365 258 312 318 S344 386 306 402" className="bl-anim rx-liquid-current rx-liquid-current-back" />
        </g>
        <ellipse
          cx="280"
          cy={LIQUID_TOP}
          rx="112"
          ry="8"
          style={{ fill: `color-mix(in srgb, ${cultureFill} 55%, var(--bl-glass-shine))` }}
          opacity={density}
          className="bl-fade bl-anim rx-surface-body"
        />
        <path
          d="M140 152 q15 -3 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0"
          style={{ fill: 'none', stroke: 'var(--bl-glass-shine)' }}
          strokeOpacity={0.8}
          strokeWidth={1.5}
          className="bl-anim rx-surface"
        />

        {/* Biomass reveals members of a bounded pool; motion uses model capacity, production and health. */}
        <g data-layer="filaments" clipPath={`url(#${liquidId})`}>
          {FILAMENT_POOL.map((particle, i) => {
            const style = {
              animationDuration: `${(mixingSeconds * particle.duration).toFixed(1)}s`,
              animationDelay: particle.delay,
              '--bl-dx': particle.dx,
              '--bl-dy': particle.dy,
              fill: 'none',
              stroke: filamentStroke,
            } as CSSProperties;
            return (
              <g key={i} style={{ opacity: i < filamentCount ? particle.opacity : 0 }} className="bl-fade">
                {/* Circulate in vessel coordinates, so each filament's scale/rotation cannot shrink its travel. */}
                <g className="bl-anim rx-filament" style={style}>
                  <path data-particle="filament" transform={particle.transform} d={FILAMENT} strokeWidth={2.2} strokeLinecap="round" />
                </g>
              </g>
            );
          })}
        </g>

        {/* Fine activity bubbles follow specific photosynthetic production: an activity cue, not an oxygen measurement. */}
        <g data-layer="activity-bubbles" clipPath={`url(#${liquidId})`}>
          {PHOTO_POOL.map((particle, i) => (
            <g key={i} className="bl-fade" style={{ opacity: Math.min(1, Math.max(0, visual.photosynthesisActivity * REACTOR_POOL.photosynthesis - i)) }}>
              <circle
                data-particle="photosynthesis"
                cx={particle.x}
                cy={particle.y}
                r={1.9}
                style={
                  {
                    animationDuration: `${particle.duration}s`,
                    animationDelay: particle.delay,
                    '--bl-rise': particle.rise,
                  } as CSSProperties
                }
                className="bl-anim rx-photo-bubble"
              />
            </g>
          ))}
        </g>

        <g data-layer="sparger">
          <path d="M206 104 V366" fill="none" style={{ stroke: 'var(--bl-steel-2)' }} strokeWidth={5} strokeOpacity={0.9} />
          <rect x="204" y="364" width="152" height="7" rx="3.5" style={{ fill: 'var(--bl-steel-3)', stroke: 'var(--bl-steel-2)' }} />
        </g>

        {/* Aeration bubbles depend on the aeration setting only. */}
        <g data-layer="aeration-bubbles" clipPath={`url(#${liquidId})`}>
          {AIR_POOL.map((particle, i) => (
            <g key={i} className="bl-fade" style={{ opacity: i < visual.aerationCount ? 1 : 0 }}>
              <circle
                data-particle="aeration"
                cx={particle.x}
                cy={360}
                r={particle.radius}
                style={
                  {
                    animationDuration: `${particle.duration * (aeration === 'low' ? 1.5 : 1)}s`,
                    animationDelay: `${-((i + 0.5) / Math.max(1, visual.aerationCount)) * particle.duration * (aeration === 'low' ? 1.5 : 1)}s`,
                    '--bl-bubble-dx': particle.dx,
                    // Reduced motion distributes static bubbles along the stream instead of stacking on the diffuser.
                    '--bl-still-y': `${-24 - ((i * 67) % 170)}px`,
                  } as CSSProperties
                }
                fillOpacity={0.3}
                strokeWidth={1.5}
                className="bl-anim rx-air-bubble"
              />
            </g>
          ))}
        </g>


        <g data-layer="probes">
          <rect x="324" y="96" width="10" height="210" rx="5" style={{ fill: 'var(--bl-glass-shine)', stroke: 'var(--bl-steel-3)' }} opacity={0.9} />
          <circle cx="329" cy="308" r="8" style={{ fill: 'var(--bl-glass-shine)', stroke: 'var(--bl-steel-3)' }} opacity={0.9} />
          <rect x="350" y="96" width="6" height="236" rx="3" style={{ fill: 'var(--bl-steel-2)', stroke: 'var(--bl-steel-3)' }} />
        </g>
      </g>

      <g data-layer="glass-front">
        <rect x="180" y="116" width="12" height="246" rx="6" style={{ fill: 'var(--bl-glass-shine)' }} opacity={0.6} />
        <rect x="372" y="122" width="6" height="232" rx="3" style={{ fill: 'var(--bl-glass-shine)' }} opacity={0.35} />
        <path d={VESSEL_OUTER} fill="none" style={{ stroke: 'var(--bl-glass-edge)' }} strokeWidth={2} />
        <ellipse cx="280" cy="104" rx="114" ry="8" fill="none" style={{ stroke: 'var(--bl-glass-edge)' }} strokeWidth={1.5} />
      </g>

      <g data-layer="lid">
        <rect x="136" y="70" width="288" height="24" rx="8" fill="url(#rx-steel)" style={{ stroke: 'var(--bl-steel-3)' }} />
        <ellipse cx="280" cy="70" rx="144" ry="8" style={{ fill: 'var(--bl-steel-1)', stroke: 'var(--bl-steel-2)' }} />
        {[160, 196, 364, 400].map((x) => (
          <circle key={x} cx={x} cy="84" r="3.5" style={{ fill: 'var(--bl-steel-3)' }} />
        ))}
        <rect x="321" y="38" width="16" height="34" rx="4" style={{ fill: 'var(--bl-steel-3)' }} />
        <path d="M329 38 C329 18 352 12 372 16" fill="none" style={{ stroke: 'var(--bl-steel-3)' }} strokeWidth={2.5} strokeLinecap="round" />
        <rect x="347" y="48" width="12" height="24" rx="3" style={{ fill: 'var(--bl-steel-2)', stroke: 'var(--bl-steel-3)' }} />
        <rect x="198" y="48" width="16" height="24" rx="3" style={{ fill: 'var(--bl-steel-2)', stroke: 'var(--bl-steel-3)' }} />
      </g>

      {/* Air line from the pump in the base, over the lid, down to the sparger. */}
      <g data-layer="air-line" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M126 388 V60 Q126 44 142 44 H192 Q206 44 206 54 V58" style={{ stroke: 'var(--bl-steel-3)' }} strokeWidth={8} />
        <path d="M126 388 V60 Q126 44 142 44 H192 Q206 44 206 54 V58" style={{ stroke: 'var(--bl-steel-1)' }} strokeWidth={3} />
      </g>
    </svg>
  );
}
