import { describe, it, expect } from 'vitest';
import {
  parseSemver,
  isValidSemver,
  extractVersionFromUrl,
  normalizeThreeRevision
} from '../src/analyzer/versionParser.ts';

describe('Version Parser', () => {
  it('parses standard 3-part semantic versions', () => {
    const v1 = parseSemver('3.6.4');
    expect(v1).toEqual({
      major: 3,
      minor: 6,
      patch: 4,
      prerelease: undefined,
      raw: '3.6.4'
    });

    const v2 = parseSemver('10.0.0');
    expect(v2).toEqual({
      major: 10,
      minor: 0,
      patch: 0,
      prerelease: undefined,
      raw: '10.0.0'
    });
  });

  it('parses versions with leading v or spaces', () => {
    const v = parseSemver('  v18.2.0 ');
    expect(v).not.toBeNull();
    expect(v?.major).toBe(18);
    expect(v?.minor).toBe(2);
    expect(v?.patch).toBe(0);
  });

  it('parses pre-release versions', () => {
    const v = parseSemver('1.2.3-beta.1');
    expect(v).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: 'beta.1',
      raw: '1.2.3-beta.1'
    });

    const rc = parseSemver('19.0.0-rc.2');
    expect(rc?.prerelease).toBe('rc.2');
  });

  it('normalizes Three.js revisions to semver', () => {
    expect(normalizeThreeRevision('180')).toBe('0.180.0');
    expect(normalizeThreeRevision('r180')).toBe('0.180.0');
    expect(normalizeThreeRevision('r99')).toBe('0.99.0');

    const parsed = parseSemver('r180');
    expect(parsed?.major).toBe(0);
    expect(parsed?.minor).toBe(180);
    expect(parsed?.patch).toBe(0);
  });

  it('handles unknown or invalid version strings gracefully', () => {
    expect(parseSemver('')).toBeNull();
    expect(parseSemver('unknown')).toBeNull();
    expect(parseSemver('v-custom-build')).toBeNull();
    expect(parseSemver(null as any)).toBeNull();
    expect(parseSemver(undefined as any)).toBeNull();

    expect(isValidSemver('3.6.4')).toBe(true);
    expect(isValidSemver('invalid')).toBe(false);
  });

  it('extracts versions from script and stylesheet URLs', () => {
    expect(extractVersionFromUrl('https://code.jquery.com/jquery-3.6.4.min.js', 'jquery')).toBe('3.6.4');
    expect(extractVersionFromUrl('https://unpkg.com/react@18.2.0/umd/react.production.min.js', 'react')).toBe('18.2.0');
    expect(extractVersionFromUrl('https://cdn.jsdelivr.net/npm/@angular/core@17.2.1/fesm2022/core.mjs', '@angular/core')).toBe('17.2.1');
    expect(extractVersionFromUrl('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css', 'bootstrap')).toBe('5.3.3');
    expect(extractVersionFromUrl('https://cdnjs.cloudflare.com/ajax/libs/axios/1.7.2/axios.min.js', 'axios')).toBe('1.7.2');
    expect(extractVersionFromUrl('https://cdn.tailwindcss.com/3.4.1', 'tailwindcss')).toBe('3.4.1');
  });
});
