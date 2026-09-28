import { describe, it, expect } from 'vitest';
import {
  compareSemver,
  isNewerVersion,
  isMajorDifference
} from '../src/analyzer/versionComparator.ts';

describe('Version Comparator', () => {
  it('correctly compares patch versions', () => {
    expect(compareSemver('3.7.1', '3.6.4')).toBe(1);
    expect(compareSemver('3.6.4', '3.7.1')).toBe(-1);
    expect(isNewerVersion('3.6.4', '3.7.1')).toBe(true);
    expect(isNewerVersion('3.7.1', '3.6.4')).toBe(false);
  });

  it('correctly compares numeric minor versions rather than alphabetical', () => {
    // 3.10.0 > 3.9.0 (alphabetically "3.10.0" < "3.9.0" so numeric check is critical!)
    expect(compareSemver('3.10.0', '3.9.0')).toBe(1);
    expect(compareSemver('3.9.0', '3.10.0')).toBe(-1);
    expect(isNewerVersion('3.9.0', '3.10.0')).toBe(true);
  });

  it('correctly compares major versions', () => {
    // 10.0.0 > 9.99.0 (alphabetically "10.0.0" < "9.99.0")
    expect(compareSemver('10.0.0', '9.99.0')).toBe(1);
    expect(compareSemver('9.99.0', '10.0.0')).toBe(-1);
    expect(isNewerVersion('9.99.0', '10.0.0')).toBe(true);
  });

  it('identifies major differences accurately', () => {
    expect(isMajorDifference('3.6.4', '4.2.0')).toBe(true);
    expect(isMajorDifference('18.2.0', '19.1.1')).toBe(true);
    expect(isMajorDifference('3.6.4', '3.7.1')).toBe(false);
    expect(isMajorDifference('5.2.0', '5.3.3')).toBe(false);
  });

  it('correctly handles equal versions', () => {
    expect(compareSemver('0.180.0', '0.180.0')).toBe(0);
    expect(compareSemver('18.2.0', '18.2.0')).toBe(0);
    expect(isNewerVersion('0.180.0', '0.180.0')).toBe(false);
  });

  it('compares pre-release versions according to SemVer 2.0.0 spec', () => {
    // A version with pre-release has lower precedence than standard release
    expect(compareSemver('1.0.0', '1.0.0-beta.1')).toBe(1);
    expect(compareSemver('1.0.0-beta.1', '1.0.0')).toBe(-1);

    // Pre-release numeric comparison
    expect(compareSemver('1.0.0-beta.2', '1.0.0-beta.1')).toBe(1);
    expect(compareSemver('1.0.0-rc.1', '1.0.0-beta.9')).toBe(1);
  });

  it('returns null when comparing invalid or unparseable versions', () => {
    expect(compareSemver('invalid', '3.6.4')).toBeNull();
    expect(compareSemver('3.6.4', 'not-a-version')).toBeNull();
    expect(isNewerVersion('invalid', '3.6.4')).toBeNull();
  });
});
