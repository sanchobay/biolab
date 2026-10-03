// Offline service worker, generated at build time (PRD-0004 §3, ADR-0004).
// This module is DOM-free and Node-free: vite.config.ts (ES lib only) builds the worker from it, and tests run it.

/** The app shell every navigation is answered with. */
export const APP_SHELL = '/index.html';
/** Cache names are `biolab-<version>`; activation removes older ones with this prefix only. */
export const CACHE_PREFIX = 'biolab-';

/** Files served from public/ (PRD-0004 §2); a test keeps this list equal to the folder's contents. */
export const PUBLIC_FILES = [
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
] as const;

export type Route = 'shell' | 'precache' | 'network' | 'ignore';

export interface RouteRequest {
  method: string;
  mode: string;
  origin: string;
  pathname: string;
}

/** Every build file as a sorted, unique, root-relative URL; the worker itself and source maps are never cached. */
export function precacheList(files: readonly string[]): string[] {
  const urls = files
    .map((file) => `/${file.replace(/^\.?\//, '')}`)
    .filter((url) => url !== '/sw.js' && !url.endsWith('.map'));
  return [...new Set(urls)].sort();
}

/** FNV-1a hash of the list: stable for the same build output, different whenever a file changes name. */
export function precacheVersion(list: readonly string[]): string {
  let hash = 0x811c9dc5;
  for (const char of list.join('\n')) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Same-origin navigations get the cached app shell; precached files are cache-first; everything else is left alone. */
export function decideRoute(request: RouteRequest, selfOrigin: string, precached: ReadonlySet<string>): Route {
  if (request.method !== 'GET' || request.origin !== selfOrigin) return 'ignore';
  if (request.mode === 'navigate') return 'shell';
  return precached.has(request.pathname) ? 'precache' : 'network';
}

/** The complete worker script. `decideRoute` is inlined from this module, so the tested function is the shipped one. */
export function serviceWorkerSource(list: readonly string[], version: string): string {
  return `/* BioLab service worker (ADR-0004), generated at build time. Do not edit. */
const PREFIX = ${JSON.stringify(CACHE_PREFIX)};
const CACHE = PREFIX + ${JSON.stringify(version)};
const SHELL = ${JSON.stringify(APP_SHELL)};
const PRECACHE = ${JSON.stringify(list)};
const PRECACHED = new Set(PRECACHE);
const decideRoute = ${decideRoute.toString()};

self.addEventListener('install', (event) => {
  // "reload" bypasses the HTTP cache, so a new version never precaches stale files.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// A new version waits until the student presses Reload (PRD-0004 §4).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const route = decideRoute({ method: request.method, mode: request.mode, origin: url.origin, pathname: url.pathname }, self.location.origin, PRECACHED);
  if (route === 'ignore') return;
  if (route === 'network') {
    event.respondWith(
      fetch(request).catch(() => caches.open(CACHE).then((cache) => cache.match(url.pathname)).then((cached) => cached || Response.error())),
    );
    return;
  }
  const key = route === 'shell' ? SHELL : url.pathname;
  event.respondWith(caches.open(CACHE).then((cache) => cache.match(key)).then((cached) => cached || fetch(request)));
});
`;
}
