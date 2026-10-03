import { BookOpen, FlaskConical, Info, LayoutGrid, Moon, Sun, type LucideIcon } from 'lucide-react';
import { LOCALES, LOCALE_META, splitName, useI18n } from '../i18n';
import { DisplaySettings } from './DisplaySettings';
import type { Destination, View } from './navigation';
import { OfflineStatus } from './pwa/OfflineStatus';
import type { Theme } from './theme';

interface HeaderProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  view: View;
  onNavigate: (destination: Destination) => void;
}

// Views of the single page (PRD-0003 §2). "Experiments" opens the one available experiment at the start of its workflow.
const NAV: { view: View; target: string; icon: LucideIcon }[] = [
  { view: 'experiment', target: 'experiment-controls', icon: LayoutGrid },
  { view: 'learn', target: 'learn-title', icon: BookOpen },
  { view: 'about', target: 'about-title', icon: Info },
];

/** Compact laboratory header (DESIGN_SYSTEM §10, §28–§30): brand, navigation, language, theme and experiment identity. */
export function Header({ theme, onThemeChange, view, onNavigate }: HeaderProps) {
  const { locale, m, setLocale } = useI18n();
  const h = m.header;
  const labels: Record<View, string> = { experiment: h.experiments, learn: h.learn, about: h.about };
  const [before, after] = splitName(h.identity);

  return (
    <header className="app-header">
      <div className="brand-block">
        <span className="brand">
          <FlaskConical aria-hidden="true" size={22} strokeWidth={2} />
          BioLab
        </span>
        <span className="brand-tagline">{h.tagline}</span>
      </div>

      <nav aria-label={h.mainNav} className="main-nav">
        <ul>
          {NAV.map(({ view: target, target: focus, icon: Icon }) => (
            <li key={target}>
              <a
                href={`#${focus}`}
                aria-current={view === target ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate({ view: target, target: focus });
                }}
                className="nav-link"
              >
                <Icon aria-hidden="true" size={16} strokeWidth={2} />
                {labels[target]}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="header-tools">
        <OfflineStatus />
        {/* Each language is named in its own script and marked with its own lang (PRD-0003 §9). */}
        <div role="group" aria-label={h.languageGroup} className="segmented language-switch">
          {LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              lang={option}
              aria-label={LOCALE_META[option].name}
              aria-pressed={locale === option}
              onClick={() => setLocale(option)}
            >
              {LOCALE_META[option].short}
            </button>
          ))}
        </div>
        <div role="group" aria-label={h.themeGroup} className="segmented theme-switch">
          {(
            [
              { value: 'light', label: h.lightTheme, icon: Sun },
              { value: 'dark', label: h.darkTheme, icon: Moon },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" aria-label={label} aria-pressed={theme === value} onClick={() => onThemeChange(value)}>
              <Icon aria-hidden="true" size={16} strokeWidth={2} />
            </button>
          ))}
        </div>
        <DisplaySettings />
        {/* Static identity, not a selector: the MVP has one experiment (DESIGN_SYSTEM §24). */}
        <div className="experiment-identity">
          <h1>
            {before}
            <i>Arthrospira platensis</i>
            {after}
          </h1>
          <p>{h.identityRun}</p>
        </div>
      </div>
    </header>
  );
}
