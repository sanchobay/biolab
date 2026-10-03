// O1–O3 (ExecPlan 0007, PRD-0004 §3, ADR-0004): precache list, routing and the generated worker's lifecycle.
import { describe, expect, it, vi } from 'vitest';
import { APP_SHELL, decideRoute, precacheList, precacheVersion, serviceWorkerSource } from '../../src/pwa/serviceWorker';

const BUILD_FILES = [
  'index.html',
  'assets/index-AbC123.js',
  'assets/index-AbC123.js.map',
  'assets/index-XyZ789.css',
  'assets/inter-latin-wght-normal-Dx4k.woff2',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'sw.js',
  'assets/index-XyZ789.css',
];

describe('O1 precache list and version', () => {
  it('keeps every build file as a sorted root-relative URL, without the worker or source maps', () => {
    expect(precacheList(BUILD_FILES)).toEqual([
      '/assets/index-AbC123.js',
      '/assets/index-XyZ789.css',
      '/assets/inter-latin-wght-normal-Dx4k.woff2',
      '/icons/icon-192.png',
      '/index.html',
      '/manifest.webmanifest',
    ]);
    expect(precacheList(BUILD_FILES)).toContain(APP_SHELL);
  });

  it('derives a stable version that changes when the file list changes', () => {
    const list = precacheList(BUILD_FILES);
    expect(precacheVersion(list)).toBe(precacheVersion([...list]));
    expect(precacheVersion(list)).toMatch(/^[0-9a-f]{8}$/);
    expect(precacheVersion(precacheList([...BUILD_FILES, 'assets/index-New456.js']))).not.toBe(precacheVersion(list));
  });
});

describe('O2 routing', () => {
  const origin = 'https://biolab.test';
  const precached = new Set(['/index.html', '/assets/index-AbC123.js']);
  const route = (method: string, mode: string, url: string) => {
    const parsed = new URL(url);
    return decideRoute({ method, mode, origin: parsed.origin, pathname: parsed.pathname }, origin, precached);
  };

  it('serves navigations from the app shell and precached files from the cache', () => {
    expect(route('GET', 'navigate', `${origin}/`)).toBe('shell');
    expect(route('GET', 'navigate', `${origin}/anything`)).toBe('shell');
    expect(route('GET', 'cors', `${origin}/assets/index-AbC123.js`)).toBe('precache');
  });

  it('sends other same-origin GETs to the network and never touches other requests', () => {
    expect(route('GET', 'cors', `${origin}/not-precached.txt`)).toBe('network');
    expect(route('POST', 'cors', `${origin}/index.html`)).toBe('ignore');
    expect(route('GET', 'cors', 'https://example.com/font.woff2')).toBe('ignore');
  });
});

// A minimal ServiceWorkerGlobalScope: enough to run the generated source exactly as the browser would.
type Handler = (event: Record<string, unknown>) => void;

function runWorker(list: string[], version: string, network: (url: string) => Promise<Response>) {
  const handlers: Record<string, Handler> = {};
  const stores = new Map<string, Map<string, Response>>();
  const pathOf = (input: string | { url: string }) => new URL(typeof input === 'string' ? input : input.url, 'https://biolab.test').pathname;
  const openStore = (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name) as Map<string, Response>;
    return {
      addAll: async (requests: (string | { url: string })[]) => {
        for (const request of requests) store.set(pathOf(request), await network(pathOf(request)));
      },
      match: async (input: string | { url: string }) => store.get(pathOf(input))?.clone(),
    };
  };
  const caches = {
    open: async (name: string) => openStore(name),
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
  };
  const self = {
    addEventListener: (type: string, handler: Handler) => {
      handlers[type] = handler;
    },
    skipWaiting: vi.fn(async () => undefined),
    clients: { claim: vi.fn(async () => undefined) },
    location: { origin: 'https://biolab.test' },
  };
  class FakeRequest {
    readonly url: string;
    readonly init: unknown;
    constructor(url: string, init?: unknown) {
      this.url = url;
      this.init = init;
    }
  }
  const fetchImpl = vi.fn((request: string | { url: string }) => network(pathOf(request)));
  new Function('self', 'caches', 'fetch', 'URL', 'Response', 'Request', serviceWorkerSource(list, version))(
    self,
    caches,
    fetchImpl,
    URL,
    Response,
    FakeRequest,
  );

  const lifecycle = async (type: string, extra: Record<string, unknown> = {}) => {
    let pending: Promise<unknown> = Promise.resolve();
    handlers[type]({ ...extra, waitUntil: (promise: Promise<unknown>) => (pending = promise) });
    await pending;
  };
  const request = async (method: string, mode: string, url: string) => {
    let response: Promise<Response> | undefined;
    handlers.fetch({ request: { method, mode, url }, respondWith: (value: Promise<Response>) => (response = value) });
    return response ? await response : undefined;
  };
  return { handlers, stores, self, fetchImpl, lifecycle, request };
}

describe('O3 generated service worker', () => {
  const list = precacheList(BUILD_FILES);
  const version = precacheVersion(list);
  const online = (url: string) => Promise.resolve(new Response(`body of ${url}`));

  it('precaches every URL into a versioned cache on install', async () => {
    const worker = runWorker(list, version, online);
    await worker.lifecycle('install');
    expect([...worker.stores.keys()]).toEqual([`biolab-${version}`]);
    expect([...(worker.stores.get(`biolab-${version}`) ?? new Map()).keys()].sort()).toEqual(list);
  });

  it('deletes only older BioLab caches on activate and claims clients', async () => {
    const worker = runWorker(list, version, online);
    worker.stores.set('biolab-old00000', new Map());
    worker.stores.set('someone-else', new Map());
    await worker.lifecycle('install');
    await worker.lifecycle('activate');
    expect([...worker.stores.keys()].sort()).toEqual([`biolab-${version}`, 'someone-else']);
    expect(worker.self.clients.claim).toHaveBeenCalled();
  });

  it('answers navigations and precached files from the cache while offline', async () => {
    let offline = false;
    const worker = runWorker(list, version, (url) => (offline ? Promise.reject(new TypeError('offline')) : online(url)));
    await worker.lifecycle('install');
    offline = true;
    expect(await (await worker.request('GET', 'navigate', 'https://biolab.test/'))?.text()).toBe('body of /index.html');
    expect(await (await worker.request('GET', 'cors', 'https://biolab.test/assets/index-AbC123.js'))?.text()).toBe(
      'body of /assets/index-AbC123.js',
    );
    expect(await worker.request('GET', 'cors', 'https://example.com/x.js')).toBeUndefined();
  });

  it('activates a waiting worker only on SKIP_WAITING', () => {
    const worker = runWorker(list, version, online);
    worker.handlers.message({ data: { type: 'OTHER' } });
    expect(worker.self.skipWaiting).not.toHaveBeenCalled();
    worker.handlers.message({ data: { type: 'SKIP_WAITING' } });
    expect(worker.self.skipWaiting).toHaveBeenCalledTimes(1);
  });
});
