// Service-worker registration and offline state (PRD-0004 §4–§5, ADR-0004 §3).
// Production only; dev and tests never register. The browser objects are injected, so the logic is testable without them.

export interface PwaState {
  /** An active worker has precached the build: the app works offline. */
  offlineReady: boolean;
  /** A newer version is installed and waits for the student's Reload. */
  updateWaiting: boolean;
  online: boolean;
  /** The update notice was dismissed for this page load. */
  dismissed: boolean;
}

export type PwaEvent = { type: 'ready' } | { type: 'updateWaiting' } | { type: 'online' } | { type: 'offline' } | { type: 'dismiss' };

export function pwaReducer(state: PwaState, event: PwaEvent): PwaState {
  switch (event.type) {
    case 'ready':
      return { ...state, offlineReady: true };
    case 'updateWaiting':
      return { ...state, updateWaiting: true, dismissed: false };
    case 'online':
      return { ...state, online: true };
    case 'offline':
      return { ...state, online: false };
    case 'dismiss':
      return { ...state, dismissed: true };
  }
}

export interface PwaStore {
  getState(): PwaState;
  subscribe(listener: () => void): () => void;
  dispatch(event: PwaEvent): void;
  setUpdater(updater: () => void): void;
  /** Activates the waiting version; called only from the Reload button. */
  applyUpdate(): void;
  reset(): void;
}

const onlineNow = (): boolean => (typeof navigator === 'undefined' ? true : navigator.onLine !== false);

export function createPwaStore(): PwaStore {
  const initial = (): PwaState => ({ offlineReady: false, updateWaiting: false, online: onlineNow(), dismissed: false });
  let state = initial();
  let updater: () => void = () => undefined;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch(event) {
      const next = pwaReducer(state, event);
      if (next !== state) {
        state = next;
        emit();
      }
    },
    setUpdater(next) {
      updater = next;
    },
    applyUpdate: () => updater(),
    reset() {
      state = initial();
      updater = () => undefined;
      emit();
    },
  };
}

/** The app's single store; the header status and the update notice read it. */
export const pwaStore = createPwaStore();

// Structural subsets of the browser types, so tests can pass plain objects.
interface WorkerLike {
  state: string;
  postMessage(message: unknown): void;
  addEventListener(type: 'statechange', listener: () => void): void;
}

interface RegistrationLike {
  active: unknown;
  waiting: WorkerLike | null;
  installing: WorkerLike | null;
  addEventListener(type: 'updatefound', listener: () => void): void;
}

interface ContainerLike {
  controller: unknown;
  ready: Promise<unknown>;
  register(url: string): Promise<RegistrationLike>;
  addEventListener(type: 'controllerchange', listener: () => void): void;
}

interface NetworkEvents {
  addEventListener(type: 'online' | 'offline', listener: () => void): void;
}

export interface RegisterOptions {
  enabled: boolean;
  container: ContainerLike | undefined;
  store?: PwaStore;
  reload: () => void;
  network?: NetworkEvents;
}

export async function registerServiceWorker({ enabled, container, store = pwaStore, reload, network }: RegisterOptions): Promise<RegistrationLike | null> {
  if (!enabled || !container) return null;

  network?.addEventListener('online', () => store.dispatch({ type: 'online' }));
  network?.addEventListener('offline', () => store.dispatch({ type: 'offline' }));

  // Reload only after the student pressed Reload; the first install's clients.claim() also fires controllerchange.
  let reloadRequested = false;
  let reloaded = false;
  container.addEventListener('controllerchange', () => {
    if (reloadRequested && !reloaded) {
      reloaded = true;
      reload();
    }
  });

  let registration: RegistrationLike;
  try {
    registration = await container.register('/sw.js');
  } catch {
    // Blocked storage or a private window: the app keeps working online, and no offline claim is shown.
    return null;
  }

  store.setUpdater(() => {
    const waiting = registration.waiting;
    if (!waiting) return;
    reloadRequested = true;
    waiting.postMessage({ type: 'SKIP_WAITING' });
  });

  const hasController = () => Boolean(container.controller);
  if (registration.waiting && hasController()) store.dispatch({ type: 'updateWaiting' });
  registration.addEventListener('updatefound', () => {
    const installing = registration.installing;
    installing?.addEventListener('statechange', () => {
      if (installing.state === 'installed' && hasController()) store.dispatch({ type: 'updateWaiting' });
    });
  });

  if (registration.active) store.dispatch({ type: 'ready' });
  else void container.ready.then(() => store.dispatch({ type: 'ready' }));
  return registration;
}
