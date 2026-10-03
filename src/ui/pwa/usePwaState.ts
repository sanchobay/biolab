import { useSyncExternalStore } from 'react';
import { pwaStore, type PwaState } from '../../pwa/register';

/** The offline and update state, re-rendering on every store change (PRD-0004 §4–§5). */
export const usePwaState = (): PwaState => useSyncExternalStore(pwaStore.subscribe, pwaStore.getState, pwaStore.getState);
