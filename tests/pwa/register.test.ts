// O4 (ExecPlan 0007, PRD-0004 §4–§5, ADR-0004 §3): registration, offline-ready, update waiting and user-initiated reload.
import { describe, expect, it, vi } from 'vitest';
import { createPwaStore, pwaReducer, registerServiceWorker, type PwaState } from '../../src/pwa/register';

type Listener = () => void;

function fakeWorker(state = 'installing') {
  const listeners: Listener[] = [];
  return {
    state,
    postMessage: vi.fn(),
    addEventListener: (_type: 'statechange', listener: Listener) => listeners.push(listener),
    become(next: string) {
      this.state = next;
      listeners.forEach((listener) => listener());
    },
  };
}

function fakeContainer(options: { active?: boolean; waiting?: boolean; controller?: boolean } = {}) {
  const updateListeners: Listener[] = [];
  const controllerListeners: Listener[] = [];
  const registration = {
    active: options.active ? fakeWorker('activated') : null,
    waiting: options.waiting ? fakeWorker('installed') : null,
    installing: null as ReturnType<typeof fakeWorker> | null,
    addEventListener: (_type: 'updatefound', listener: Listener) => updateListeners.push(listener),
  };
  const container = {
    controller: options.controller ? {} : null,
    ready: Promise.resolve(registration),
    register: vi.fn(async () => registration),
    addEventListener: (_type: 'controllerchange', listener: Listener) => controllerListeners.push(listener),
  };
  return {
    container,
    registration,
    fireUpdateFound(worker: ReturnType<typeof fakeWorker>) {
      registration.installing = worker;
      updateListeners.forEach((listener) => listener());
    },
    fireControllerChange: () => controllerListeners.forEach((listener) => listener()),
  };
}

const initial: PwaState = { offlineReady: false, updateWaiting: false, online: true, dismissed: false };

describe('O4 PWA state', () => {
  it('reduces registration and network events', () => {
    let state = pwaReducer(initial, { type: 'ready' });
    expect(state.offlineReady).toBe(true);
    state = pwaReducer(state, { type: 'offline' });
    expect(state.online).toBe(false);
    state = pwaReducer(state, { type: 'updateWaiting' });
    expect(state).toMatchObject({ updateWaiting: true, dismissed: false });
    expect(pwaReducer(state, { type: 'dismiss' }).dismissed).toBe(true);
    expect(pwaReducer(state, { type: 'online' }).online).toBe(true);
  });
});

describe('O4 registration', () => {
  it('registers nothing unless enabled and supported', async () => {
    const fake = fakeContainer({ active: true });
    const store = createPwaStore();
    expect(await registerServiceWorker({ enabled: false, container: fake.container, store, reload: vi.fn() })).toBeNull();
    expect(fake.container.register).not.toHaveBeenCalled();
    expect(await registerServiceWorker({ enabled: true, container: undefined, store, reload: vi.fn() })).toBeNull();
    expect(store.getState().offlineReady).toBe(false);
  });

  it('marks the app offline-ready once a worker is active', async () => {
    const fake = fakeContainer({ active: true });
    const store = createPwaStore();
    await registerServiceWorker({ enabled: true, container: fake.container, store, reload: vi.fn() });
    expect(fake.container.register).toHaveBeenCalledWith('/sw.js');
    expect(store.getState().offlineReady).toBe(true);
  });

  it('marks an update as waiting when a new worker installs under an existing controller', async () => {
    const fake = fakeContainer({ active: true, controller: true });
    const store = createPwaStore();
    await registerServiceWorker({ enabled: true, container: fake.container, store, reload: vi.fn() });
    expect(store.getState().updateWaiting).toBe(false);
    const next = fakeWorker();
    fake.fireUpdateFound(next);
    next.become('installed');
    expect(store.getState().updateWaiting).toBe(true);
  });

  it('reports an update that was already waiting at load', async () => {
    const fake = fakeContainer({ active: true, waiting: true, controller: true });
    const store = createPwaStore();
    await registerServiceWorker({ enabled: true, container: fake.container, store, reload: vi.fn() });
    expect(store.getState().updateWaiting).toBe(true);
  });

  it('reloads once, and only after the user asked for the update', async () => {
    const fake = fakeContainer({ active: true, waiting: true, controller: true });
    const store = createPwaStore();
    const reload = vi.fn();
    await registerServiceWorker({ enabled: true, container: fake.container, store, reload });

    // The first-install claim also fires controllerchange; it must never reload by itself.
    fake.fireControllerChange();
    expect(reload).not.toHaveBeenCalled();

    store.applyUpdate();
    expect(fake.registration.waiting?.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    fake.fireControllerChange();
    fake.fireControllerChange();
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
