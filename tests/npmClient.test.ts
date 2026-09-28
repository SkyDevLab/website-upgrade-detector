import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLatestVersion, fetchLatestVersions, buildNpmLatestUrl } from '../src/npm/client.ts';
import { clearNpmCache } from '../src/npm/cache.ts';

describe('NPM Client', () => {
  beforeEach(async () => {
    await clearNpmCache();
    vi.restoreAllMocks();
  });

  it('builds registry URLs for regular and scoped packages', () => {
    expect(buildNpmLatestUrl('jquery')).toBe('https://registry.npmjs.org/jquery/latest');
    expect(buildNpmLatestUrl('@angular/core')).toBe('https://registry.npmjs.org/@angular%2Fcore/latest');
  });

  it('successfully retrieves latest version from registry', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: 'jquery',
        version: '3.7.1'
      })
    });

    const result = await fetchLatestVersion('jquery', false, mockFetch as any);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.version).toBe('3.7.1');
    expect(result.fromCache).toBe(false);
    expect(result.error).toBeUndefined();
  });

  it('uses cached version on subsequent calls within TTL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: 'react',
        version: '19.1.1'
      })
    });

    // First call (fetches from registry)
    const res1 = await fetchLatestVersion('react', false, mockFetch as any);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(res1.version).toBe('19.1.1');
    expect(res1.fromCache).toBe(false);

    // Second call without forceRefresh (should hit cache)
    const res2 = await fetchLatestVersion('react', false, mockFetch as any);
    expect(mockFetch).toHaveBeenCalledTimes(1); // Not called again!
    expect(res2.version).toBe('19.1.1');
    expect(res2.fromCache).toBe(true);

    // Third call with forceRefresh = true (bypasses cache)
    const res3 = await fetchLatestVersion('react', true, mockFetch as any);
    expect(mockFetch).toHaveBeenCalledTimes(2); // Called again!
    expect(res3.fromCache).toBe(false);
  });

  it('handles package not found (404)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    const result = await fetchLatestVersion('non-existent-package-xyz', false, mockFetch as any);

    expect(result.version).toBeNull();
    expect(result.error).toContain('not found on npm');
  });

  it('handles network failure (fetch rejected)', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch (offline)'));

    const result = await fetchLatestVersion('axios', false, mockFetch as any);

    expect(result.version).toBeNull();
    expect(result.error).toContain('Network error: Failed to fetch (offline)');
  });

  it('handles malformed registry response without version', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: 'broken-package'
        // Missing version and dist-tags
      })
    });

    const result = await fetchLatestVersion('broken-package', false, mockFetch as any);

    expect(result.version).toBeNull();
    expect(result.error).toContain('did not contain a valid version string');
  });

  it('batch fetches multiple packages concurrently', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('jquery')) {
        return { ok: true, status: 200, json: async () => ({ version: '3.7.1' }) };
      }
      if (url.includes('axios')) {
        return { ok: true, status: 200, json: async () => ({ version: '1.7.2' }) };
      }
      return { ok: false, status: 404 };
    });

    const map = await fetchLatestVersions(['jquery', 'axios', 'unknown-pkg'], false, mockFetch as any);

    expect(map.size).toBe(3);
    expect(map.get('jquery')?.version).toBe('3.7.1');
    expect(map.get('axios')?.version).toBe('1.7.2');
    expect(map.get('unknown-pkg')?.version).toBeNull();
  });
});
