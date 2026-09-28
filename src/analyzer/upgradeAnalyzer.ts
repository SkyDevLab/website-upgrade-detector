import { DetectedLibrary, UpgradeAnalysis } from '../shared/types.ts';
import { compareSemver, isMajorDifference } from './versionComparator.ts';
import { isValidSemver } from './versionParser.ts';

/**
 * Analyzes detected library version against latest published npm version.
 * Adheres to SkyDevLab terminology and safety rules:
 * - "Update available" instead of "You must upgrade"
 * - "Detected version" instead of "Installed version"
 * - "Latest published version" instead of "Latest recommended version"
 */
export function analyzeUpgrade(
  library: DetectedLibrary,
  latestVersion: string | null | undefined,
  fetchError?: string | null
): UpgradeAnalysis {
  // If npm fetch failed
  if (fetchError || latestVersion === null || latestVersion === undefined) {
    return {
      library,
      latestVersion: null,
      status: 'CHECK_FAILED',
      isMajorUpdate: false,
      statusMessage: "Couldn't check latest version",
      errorMessage: fetchError || 'NPM registry lookup failed'
    };
  }

  // If detected version is missing or invalid semver
  if (!library.detectedVersion || !isValidSemver(library.detectedVersion)) {
    return {
      library,
      latestVersion,
      status: 'UNKNOWN',
      isMajorUpdate: false,
      statusMessage: 'Version could not be determined'
    };
  }

  // If latest version is invalid semver
  if (!isValidSemver(latestVersion)) {
    return {
      library,
      latestVersion,
      status: 'CHECK_FAILED',
      isMajorUpdate: false,
      statusMessage: 'Invalid latest version format from registry',
      errorMessage: `Registry returned unparseable version: ${latestVersion}`
    };
  }

  const comparison = compareSemver(latestVersion, library.detectedVersion);

  if (comparison === null) {
    return {
      library,
      latestVersion,
      status: 'UNKNOWN',
      isMajorUpdate: false,
      statusMessage: 'Version comparison unsupported'
    };
  }

  if (comparison > 0) {
    // Latest is strictly newer than detected
    const isMajor = isMajorDifference(library.detectedVersion, latestVersion);
    return {
      library,
      latestVersion,
      status: 'UPDATE_AVAILABLE',
      isMajorUpdate: isMajor,
      statusMessage: isMajor
        ? 'Major version update available'
        : 'Update available'
    };
  }

  // Detected version is equal to (or somehow ahead of / pre-release newer than) latest
  return {
    library,
    latestVersion,
    status: 'CURRENT',
    isMajorUpdate: false,
    statusMessage: 'Current'
  };
}

/**
 * Computes high-level summary counts from an array of UpgradeAnalysis items.
 */
export function computeSummary(analyses: UpgradeAnalysis[]) {
  let totalDetected = analyses.length;
  let updatesAvailable = 0;
  let current = 0;
  let unknown = 0;
  let failed = 0;

  for (const item of analyses) {
    switch (item.status) {
      case 'UPDATE_AVAILABLE':
        updatesAvailable++;
        break;
      case 'CURRENT':
        current++;
        break;
      case 'UNKNOWN':
        unknown++;
        break;
      case 'CHECK_FAILED':
        failed++;
        break;
    }
  }

  return {
    totalDetected,
    updatesAvailable,
    current,
    unknown,
    failed
  };
}
