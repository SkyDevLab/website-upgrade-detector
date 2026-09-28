import { NpmCacheEntry } from '../shared/types.ts';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const STORAGE_PREFIX = 'wud_npm_cache_';

// In-memory fallback for environments without chrome.storage.local (tests, development)
const memoryCache = new Map<string, NpmCacheEntry>();

/**
 * Checks if chrome.storage.local is available.
 */
function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome?.storage?.local);
}

/**
 * Retrieves cached latest version for a package if still valid (< 6 hours).
 */
export async function getCachedLatestVersion(packageName: string): Promise<string | null> {
  const key = `${STORAGE_PREFIX}${packageName}`;

  if (isChromeStorageAvailable()) {
    try {
      const result = await chrome.storage.local.get(key);
      const entry: NpmCacheEntry | undefined = result[key];
      if (entry && typeof entry.timestamp === 'number' && typeof entry.version === 'string') {
        const age = Date.now() - entry.timestamp;
        if (age < CACHE_TTL_MS) {
          return entry.version;
        }
      }
    } catch {
      // Fallback to memory cache on storage error
    }
  }

  const memEntry = memoryCache.get(packageName);
  if (memEntry && typeof memEntry.timestamp === 'number') {
    const age = Date.now() - memEntry.timestamp;
    if (age < CACHE_TTL_MS) {
      return memEntry.version;
    }
    memoryCache.delete(packageName);
  }

  return null;
}

/**
 * Stores latest version for a package with current timestamp.
 */
export async function setCachedLatestVersion(
  packageName: string,
  version: string
): Promise<void> {
  const key = `${STORAGE_PREFIX}${packageName}`;
  const entry: NpmCacheEntry = {
    version,
    timestamp: Date.now()
  };

  memoryCache.set(packageName, entry);

  if (isChromeStorageAvailable()) {
    try {
      await chrome.storage.local.set({ [key]: entry });
    } catch {
      // Best-effort storage
    }
  }
}

/**
 * Clears all cached npm versions from memory and chrome.storage.local.
 */
export async function clearNpmCache(): Promise<void> {
  memoryCache.clear();

  if (isChromeStorageAvailable()) {
    try {
      const allItems = await chrome.storage.local.get(null);
      const keysToRemove = Object.keys(allItems).filter((k) => k.startsWith(STORAGE_PREFIX));
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }
    } catch {
      // Best-effort clear
    }
  }
}

/**
 * For testing purposes: inspect or set cache TTL directly.
 */
export const TEST_EXPORTS = {
  CACHE_TTL_MS,
  memoryCache
};
