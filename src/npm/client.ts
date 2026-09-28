import { getCachedLatestVersion, setCachedLatestVersion } from './cache.ts';
import { NpmRegistryResponse } from '../shared/types.ts';

const NPM_REGISTRY_BASE = 'https://registry.npmjs.org';

export interface NpmLookupResult {
  version: string | null;
  fromCache: boolean;
  error?: string;
}

/**
 * Builds the registry URL for a package's latest release.
 * For scoped packages (e.g. '@angular/core'), standard npm registry accepts
 * either '@angular%2Fcore/latest' or '@angular/core/latest'. We encode the slash for safety.
 */
export function buildNpmLatestUrl(packageName: string): string {
  const trimmed = packageName.trim();
  const safePkg = trimmed.startsWith('@')
    ? `@${encodeURIComponent(trimmed.slice(1))}`
    : encodeURIComponent(trimmed);
  return `${NPM_REGISTRY_BASE}/${safePkg}/latest`;
}

/**
 * Retrieves the latest published version for an npm package.
 * First checks local cache (unless forceRefresh is true).
 * Strictly queries only the npm registry package endpoint without sending
 * any webpage context, URLs, or user data.
 */
export async function fetchLatestVersion(
  packageName: string,
  forceRefresh: boolean = false,
  fetchFn: typeof fetch = fetch
): Promise<NpmLookupResult> {
  const cleanPackageName = packageName.trim();

  // 1. Check cache if not forcing refresh
  if (!forceRefresh) {
    try {
      const cached = await getCachedLatestVersion(cleanPackageName);
      if (cached) {
        return {
          version: cached,
          fromCache: true
        };
      }
    } catch {
      // Cache failure should not block fetching
    }
  }

  // 2. Query npm registry
  const url = buildNpmLatestUrl(cleanPackageName);

  try {
    const response = await fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    if (response.status === 404) {
      return {
        version: null,
        fromCache: false,
        error: `Package '${cleanPackageName}' not found on npm`
      };
    }

    if (!response.ok) {
      return {
        version: null,
        fromCache: false,
        error: `npm registry returned HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data: NpmRegistryResponse = await response.json();

    const version = data.version || data['dist-tags']?.latest;

    if (!version || typeof version !== 'string') {
      return {
        version: null,
        fromCache: false,
        error: 'Registry response did not contain a valid version string'
      };
    }

    // 3. Store valid version into cache
    await setCachedLatestVersion(cleanPackageName, version);

    return {
      version,
      fromCache: false
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown network failure';
    return {
      version: null,
      fromCache: false,
      error: `Network error: ${message}`
    };
  }
}

/**
 * Batch fetches latest versions for multiple packages concurrently.
 */
export async function fetchLatestVersions(
  packageNames: string[],
  forceRefresh: boolean = false,
  fetchFn: typeof fetch = fetch
): Promise<Map<string, NpmLookupResult>> {
  const results = new Map<string, NpmLookupResult>();
  const uniqueNames = Array.from(new Set(packageNames.map((p) => p.trim())));

  await Promise.all(
    uniqueNames.map(async (pkg) => {
      const result = await fetchLatestVersion(pkg, forceRefresh, fetchFn);
      results.set(pkg, result);
    })
  );

  return results;
}
