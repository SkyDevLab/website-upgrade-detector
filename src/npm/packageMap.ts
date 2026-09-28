/**
 * Mapping between detector IDs / technology names and canonical npm package names.
 *
 * Special Mappings:
 * - 'angular' maps to '@angular/core', the core runtime package for Angular applications.
 * - 'tailwind' maps to 'tailwindcss', the official npm package for the Tailwind CSS framework.
 * - 'three' maps to 'three', where Three.js publishes releases (e.g. 0.180.0 corresponds to r180).
 */

export const PACKAGE_MAP: Record<string, string> = {
  jquery: 'jquery',
  react: 'react',
  vue: 'vue',
  angular: '@angular/core',
  bootstrap: 'bootstrap',
  lodash: 'lodash',
  axios: 'axios',
  moment: 'moment',
  three: 'three',
  tailwind: 'tailwindcss'
};

export function getNpmPackageName(detectorId: string): string {
  const mapped = PACKAGE_MAP[detectorId.toLowerCase()];
  if (!mapped) {
    throw new Error(`Unknown detector ID: ${detectorId}. No npm package mapping defined.`);
  }
  return mapped;
}

export function getNpmPackageUrl(packageName: string): string {
  return `https://www.npmjs.com/package/${encodeURIComponent(packageName)}`;
}
