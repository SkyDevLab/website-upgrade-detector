import { DetectedLibrary, DetectionContext, LibraryDetector } from '../shared/types.ts';
import { getWindow, getScriptUrls, reconcileVersionSignals } from './utils.ts';
import { extractVersionFromUrl, normalizeThreeRevision } from '../analyzer/versionParser.ts';

export const threeDetector: LibraryDetector = {
  id: 'three',
  name: 'Three.js',
  npmPackage: 'three',

  detect(context?: DetectionContext): DetectedLibrary | null {
    const win = getWindow(context);
    const scriptUrls = getScriptUrls(context);

    let runtimeSignal: { version?: string; evidence: string } | null = null;
    let urlSignal: { version?: string; evidence: string } | null = null;

    // 1. Runtime inspection: window.THREE
    if (
      win?.THREE &&
      typeof win.THREE === 'object' &&
      (win.THREE.Scene || win.THREE.WebGLRenderer || win.THREE.Vector3 || win.THREE.REVISION)
    ) {
      const rawRevision = win.THREE.REVISION;
      if (rawRevision !== undefined) {
        const normalized = normalizeThreeRevision(rawRevision);
        runtimeSignal = {
          version: normalized,
          evidence: `window.THREE.REVISION = ${rawRevision} (normalized to ${normalized})`
        };
      } else {
        runtimeSignal = {
          evidence: 'window.THREE detected with 3D engine components (Scene/Vector3)'
        };
      }
    }

    // 2. Script URL inspection
    for (const url of scriptUrls) {
      if (/three(?:[.-]|\.min|@)/i.test(url)) {
        if (!/(?:three-stdlib|three-mesh-bvh|three-orbit-controls)/i.test(url)) {
          const extracted = extractVersionFromUrl(url, 'three');
          if (extracted) {
            const normalized = normalizeThreeRevision(extracted);
            urlSignal = {
              version: normalized,
              evidence: `Script URL contains Three.js version: ${url} (normalized to ${normalized})`
            };
            break;
          } else if (!urlSignal) {
            urlSignal = {
              evidence: `Script URL references Three.js: ${url}`
            };
          }
        }
      }
    }

    if (!runtimeSignal && !urlSignal) {
      return null;
    }

    const { finalVersion, evidence, conflictingSignals, confidence } =
      reconcileVersionSignals(runtimeSignal, urlSignal);

    return {
      name: 'Three.js',
      npmPackage: 'three',
      detectedVersion: finalVersion,
      evidence,
      confidence,
      conflictingSignals
    };
  }
};
