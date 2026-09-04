const STORAGE_KEY = 'rto_shield_state';
const SETTINGS_KEY = 'rto_shield_settings';
const SCHEMA_VERSION = 1;

export function saveState(key: string, data: unknown): void {
  try {
    const payload = JSON.stringify({ version: SCHEMA_VERSION, data });
    localStorage.setItem(key, payload);
  } catch {
    console.warn('Failed to persist state to localStorage');
  }
}

export function loadState<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== SCHEMA_VERSION) return null;
    return parsed.data as T;
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  } catch {
    console.warn('Failed to clear localStorage');
  }
}

export { STORAGE_KEY, SETTINGS_KEY };
