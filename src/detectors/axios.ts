import { DetectedLibrary, DetectionContext, LibraryDetector } from '../shared/types.ts';
import { getWindow, getScriptUrls, reconcileVersionSignals } from './utils.ts';
import { extractVersionFromUrl } from '../analyzer/versionParser.ts';

export const axiosDetector: LibraryDetector = {
  id: 'axios',
  name: 'Axios',
  npmPackage: 'axios',

  detect(context?: DetectionContext): DetectedLibrary | null {
    const win = getWindow(context);
    const scriptUrls = getScriptUrls(context);

    let runtimeSignal: { version?: string; evidence: string } | null = null;
    let urlSignal: { version?: string; evidence: string } | null = null;

    // 1. Runtime inspection: window.axios
    if (
      win?.axios &&
      (typeof win.axios === 'function' || typeof win.axios === 'object') &&
      typeof win.axios.request === 'function' &&
      typeof win.axios.get === 'function'
    ) {
      const ver = typeof win.axios.VERSION === 'string' ? win.axios.VERSION : undefined;
      runtimeSignal = {
        version: ver,
        evidence: ver
          ? `window.axios.VERSION = ${ver}`
          : 'window.axios detected with standard Axios client API'
      };
    }

    // 2. Script URL inspection
    for (const url of scriptUrls) {
      if (/axios(?:[.-]|\.min|@)/i.test(url)) {
        const extracted = extractVersionFromUrl(url, 'axios');
        if (extracted) {
          urlSignal = {
            version: extracted,
            evidence: `Script URL contains Axios version: ${url}`
          };
          break;
        } else if (!urlSignal) {
          urlSignal = {
            evidence: `Script URL references Axios: ${url}`
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
      name: 'Axios',
      npmPackage: 'axios',
      detectedVersion: finalVersion,
      evidence,
      confidence,
      conflictingSignals
    };
  }
};
