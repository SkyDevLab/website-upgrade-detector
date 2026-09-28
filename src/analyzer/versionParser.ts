/**
 * Semantic version parser and extractor for Website Upgrade Detector
 */

export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  raw: string;
}

/**
 * Normalizes Three.js revision (e.g., "180" or "r180") into npm semver format "0.180.0".
 */
export function normalizeThreeRevision(revision: string | number): string {
  const str = String(revision).trim();
  const match = str.match(/^r?(\d+)$/i);
  if (match) {
    return `0.${match[1]}.0`;
  }
  return str;
}

/**
 * Extracts a version number from a script or stylesheet URL.
 * Matches patterns like:
 * - jquery-3.6.4.min.js
 * - react@18.2.0
 * - vue.esm-browser.3.4.21.js
 * - bootstrap/5.3.3/css/bootstrap.min.css
 * - tailwindcss v3.4.1
 */
export function extractVersionFromUrl(url: string, libraryPrefix?: string): string | null {
  if (!url) return null;

  // If specific library prefix is provided
  if (libraryPrefix) {
    const escaped = libraryPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Patterns like prefix@1.2.3, prefix-1.2.3, prefix/1.2.3, prefix.com/1.2.3
    const prefixRegex = new RegExp(
      `(?:${escaped})(?:\\.(?:com|org|net|io|dev))?[@/-]v?(\\d+(?:\\.\\d+)+(?:-[0-9A-Za-z.-]+)?)`,
      'i'
    );
    const match = url.match(prefixRegex);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Generic npm CDN patterns (e.g. unpkg.com/package@1.2.3/... or cdnjs.cloudflare.com/.../1.2.3/...)
  const cdnAtRegex = /@(\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z.-]+)?)/;
  const atMatch = url.match(cdnAtRegex);
  if (atMatch && atMatch[1]) {
    return atMatch[1];
  }

  // Version in path segment: /v?1.2.3/ or /v?1.2.3.min.
  const pathVersionRegex = /(?:[/-]v?|@)(\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z.-]+)?)(?:\.min|\.bundle|\.production|\.development)?\.(?:js|css)/i;
  const pathMatch = url.match(pathVersionRegex);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  return null;
}

/**
 * Parses a string into a structured semantic version object.
 * Supports:
 * - Standard 3-part: "3.6.4", "18.2.0"
 * - 2-part normalized to 0 patch: "3.7" -> major: 3, minor: 7, patch: 0
 * - Prereleases: "1.2.3-beta.1", "19.0.0-rc.2"
 * Returns null if the version string is not valid semver.
 */
export function parseSemver(versionString: string | undefined | null): ParsedSemver | null {
  if (!versionString || typeof versionString !== 'string') {
    return null;
  }

  let cleaned = versionString.trim();
  // Strip leading 'v' or 'v.'
  if (cleaned.startsWith('v') || cleaned.startsWith('V')) {
    cleaned = cleaned.substring(1).replace(/^\./, '');
  }

  // Check for Three.js style revision (e.g., "r180" or pure "180" if single number > 20)
  if (/^r?\d+$/i.test(cleaned)) {
    cleaned = normalizeThreeRevision(cleaned);
  }

  // SemVer regex pattern
  const semverRegex = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;
  const match = cleaned.match(semverRegex);

  if (!match) {
    return null;
  }

  const major = parseInt(match[1], 10);
  const minor = match[2] !== undefined ? parseInt(match[2], 10) : 0;
  const patch = match[3] !== undefined ? parseInt(match[3], 10) : 0;
  const prerelease = match[4];

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    return null;
  }

  return {
    major,
    minor,
    patch,
    prerelease,
    raw: versionString.trim()
  };
}

/**
 * Validates whether a version string can be reliably parsed into semver.
 */
export function isValidSemver(versionString: string | undefined | null): boolean {
  return parseSemver(versionString) !== null;
}
