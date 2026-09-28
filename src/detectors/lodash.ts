import { DetectedLibrary, DetectionContext, LibraryDetector } from '../shared/types.ts';
import { getWindow, getScriptUrls, reconcileVersionSignals } from './utils.ts';
import { extractVersionFromUrl } from '../analyzer/versionParser.ts';

export const lodashDetector: LibraryDetector = {
  id: 'lodash',
  name: 'Lodash',
  npmPackage: 'lodash',

  detect(context?: DetectionContext): DetectedLibrary | null {
    const win = getWindow(context);
    const scriptUrls = getScriptUrls(context);

    let runtimeSignal: { version?: string; evidence: string } | null = null;
    let urlSignal: { version?: string; evidence: string } | null = null;

    // 1. Runtime inspection: window._ or window.lodash
    const candidates = [win?._, win?.lodash].filter(Boolean);

    for (const candidate of candidates) {
      if (typeof candidate === 'function' && typeof candidate.VERSION === 'string') {
        // Distinguish from Underscore.js: Lodash has debounce/cloneDeep/isPlainObject
        const hasLodashMethods =
          typeof candidate.debounce === 'function' ||
          typeof candidate.cloneDeep === 'function' ||
          typeof candidate.kebabCase === 'function' ||
          typeof candidate.isPlainObject === 'function';

        if (hasLodashMethods) {
          const ver = candidate.VERSION;
          runtimeSignal = {
            version: ver,
            evidence: `window._ detected with Lodash methods (VERSION = ${ver})`
          };
          break;
        }
      }
    }

    // 2. Script URL inspection
    for (const url of scriptUrls) {
      if (/lodash(?:[.-]|\.min|@)/i.test(url)) {
        const extracted = extractVersionFromUrl(url, 'lodash');
        if (extracted) {
          urlSignal = {
            version: extracted,
            evidence: `Script URL contains Lodash version: ${url}`
          };
          break;
        } else if (!urlSignal) {
          urlSignal = {
            evidence: `Script URL references Lodash: ${url}`
          };
        }
      }
    }

    if (!runtimeSignal && !urlSignal) {
      return null;
    }

    const { finalVersion, evidence, conflictingSignals, confidence } =
      reconcileVersionSignals(runtimeSignal, urlSignal);

    return {
      name: 'Lodash',
      npmPackage: 'lodash',
      detectedVersion: finalVersion,
      evidence,
      confidence,
      conflictingSignals
    };
  }
};
