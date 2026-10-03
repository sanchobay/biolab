import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { PUBLIC_FILES, precacheList, precacheVersion, serviceWorkerSource } from './src/pwa/serviceWorker';

/** Emits sw.js with the build's own file list inlined, so every deploy is a new cache version (ADR-0004 §2). Build only. */
function offlineServiceWorker(): Plugin {
  return {
    name: 'biolab-offline-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const list = precacheList([...Object.keys(bundle), ...PUBLIC_FILES]);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: serviceWorkerSource(list, precacheVersion(list)) });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), offlineServiceWorker()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
