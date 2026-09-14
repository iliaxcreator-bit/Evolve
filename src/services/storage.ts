import { EvolveState } from '../types';
import { createInitialSeedState } from '../data/seedData';

const STORAGE_KEY = 'evolve_os_state_v1';

type StateListener = (state: EvolveState) => void;
const listeners: Set<StateListener> = new Set();

let currentState: EvolveState | null = null;

export function getStoredState(): EvolveState {
  if (currentState) return currentState;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.version >= 1 && Array.isArray(parsed.tasks)) {
        if (!Array.isArray(parsed.clientActivities)) {
          parsed.clientActivities = createInitialSeedState().clientActivities || [];
        }
        currentState = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse stored EVOLVE OS state, using fresh seed data:', err);
  }

  const initial = createInitialSeedState();
  saveState(initial);
  return initial;
}

export function saveState(nextState: EvolveState): void {
  currentState = nextState;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch (err) {
    console.error('Error writing EVOLVE OS state to localStorage:', err);
  }
  listeners.forEach(fn => {
    try {
      fn(nextState);
    } catch (e) {
      console.error('Error in state listener:', e);
    }
  });
}

export function subscribeToState(fn: StateListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function exportStateAsJson(): string {
  const state = getStoredState();
  return JSON.stringify(state, null, 2);
}

export function validateAndImportState(jsonStr: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'File is not a valid JSON object' };
    }
    if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.clients) || !Array.isArray(parsed.projects)) {
      return { success: false, error: 'Missing core EVOLVE OS entities (tasks, clients, projects)' };
    }
    saveState(parsed as EvolveState);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Invalid JSON syntax' };
  }
}

export function resetToSeedData(): EvolveState {
  const fresh = createInitialSeedState();
  saveState(fresh);
  return fresh;
}
