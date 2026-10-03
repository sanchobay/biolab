import '@fontsource-variable/inter/index.css';
import '@fontsource-variable/jetbrains-mono/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerServiceWorker, type RegisterOptions } from './pwa/register';
import './styles/index.css';
import { App } from './ui/App';
import { applyPreferences, browserStorage, loadPreferences } from './ui/preferences';

// Stored display settings apply before the first render, so the page never flashes at the wrong size (PRD-0005 §4).
applyPreferences(loadPreferences(browserStorage()));

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Offline support in production builds only; dev and tests never register a worker (ADR-0004 §3).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void registerServiceWorker({
      enabled: true,
      container: navigator.serviceWorker as unknown as RegisterOptions['container'],
      reload: () => window.location.reload(),
      network: window,
    });
  });
}
