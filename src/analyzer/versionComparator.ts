import { parseSemver, ParsedSemver } from './versionParser.ts';

/**
 * Compares two prerelease identifier arrays according to SemVer 2.0.0 specification.
 * Example: ["alpha", "1"] vs ["alpha", "2"]
 */
function comparePrereleases(preA?: string, preB?: string): number {
  // If neither has prerelease, they are equal in this aspect
  if (!preA && !preB) return 0;

  // A version with a prerelease has LOWER precedence than one without
  // e.g. 1.0.0-beta < 1.0.0
  if (preA && !preB) return -1;
  if (!preA && preB) return 1;

  const partsA = preA!.split('.');
  const partsB = preB!.split('.');
  const minLength = Math.min(partsA.length, partsB.length);

  for (let i = 0; i < minLength; i++) {
    const a = partsA[i];
    const b = partsB[i];

    const isANum = /^\d+$/.test(a);
    const isBNum = /^\d+$/.test(b);

    if (isANum && isBNum) {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (numA !== numB) {
        return numA > numB ? 1 : -1;
      }
    } else if (isANum && !isBNum) {
      // Numeric identifiers have lower precedence than non-numeric
      return -1;
    } else if (!isANum && isBNum) {
      return 1;
    } else {
      // Compare lexically in ASCII order
      if (a !== b) {
        return a > b ? 1 : -1;
      }
    }
  }

  // Larger set of pre-release fields has higher precedence if all previous match
  if (partsA.length !== partsB.length) {
    return partsA.length > partsB.length ? 1 : -1;
  }

  return 0;
}

/**
 * Compares two semantic version strings.
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 * Returns null if either version is not valid semver.
 */
export function compareSemver(v1: string, v2: string): number | null {
  const parsed1 = parseSemver(v1);
  const parsed2 = parseSemver(v2);

  if (!parsed1 || !parsed2) {
    return null;
  }

  // 1. Compare Major
  if (parsed1.major !== parsed2.major) {
    return parsed1.major > parsed2.major ? 1 : -1;
  }

  // 2. Compare Minor
  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor > parsed2.minor ? 1 : -1;
  }

  // 3. Compare Patch
  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch > parsed2.patch ? 1 : -1;
  }

  // 4. Compare Prerelease
  return comparePrereleases(parsed1.prerelease, parsed2.prerelease);
}

/**
 * Checks if targetVersion is strictly newer than currentVersion.
 * Returns null if either version cannot be parsed.
 */
export function isNewerVersion(currentVersion: string, targetVersion: string): boolean | null {
  const result = compareSemver(targetVersion, currentVersion);
  if (result === null) return null;
  return result > 0;
}

/**
 * Checks if targetVersion has a higher major version than currentVersion.
 */
export function isMajorDifference(currentVersion: string, targetVersion: string): boolean {
  const parsedCurrent = parseSemver(currentVersion);
  const parsedTarget = parseSemver(targetVersion);

  if (!parsedCurrent || !parsedTarget) return false;
  return parsedTarget.major > parsedCurrent.major;
}

/**
 * Returns parsed objects if valid, or null.
 */
export function getParsedVersions(
  current?: string,
  latest?: string
): { current: ParsedSemver | null; latest: ParsedSemver | null } {
  return {
    current: current ? parseSemver(current) : null,
    latest: latest ? parseSemver(latest) : null
  };
}
