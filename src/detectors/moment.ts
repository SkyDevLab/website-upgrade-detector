import { DetectedLibrary, DetectionContext, LibraryDetector } from '../shared/types.ts';
import { getWindow, getScriptUrls, reconcileVersionSignals } from './utils.ts';
import { extractVersionFromUrl } from '../analyzer/versionParser.ts';

export const momentDetector: LibraryDetector = {
  id: 'moment',
  name: 'Moment.js',
  npmPackage: 'moment',

  detect(context?: DetectionContext): DetectedLibrary | null {
    const win = getWindow(context);
    const scriptUrls = getScriptUrls(context);

    let runtimeSignal: { version?: string; evidence: string } | null = null;
    let urlSignal: { version?: string; evidence: string } | null = null;

    // 1. Runtime inspection: window.moment
    if (
      win?.moment &&
      typeof win.moment === 'function' &&
      (typeof win.moment.utc === 'function' || typeof win.moment.duration === 'function' || typeof win.moment.version === 'string')
    ) {
      const ver = typeof win.moment.version === 'string' ? win.moment.version : undefined;
      runtimeSignal = {
        version: ver,
        evidence: ver
          ? `window.moment.version = ${ver}`
          : 'window.moment detected with standard Moment.js API'
      };
    }

    // 2. Script URL inspection
    for (const url of scriptUrls) {
      if (/moment(?:[.-]|\.min|@)/i.test(url)) {
        if (!/(?:moment-timezone|moment-locales)/i.test(url)) {
          const extracted = extractVersionFromUrl(url, 'moment');
          if (extracted) {
            urlSignal = {
              version: extracted,
              evidence: `Script URL contains Moment.js version: ${url}`
            };
            break;
          } else if (!urlSignal) {
            urlSignal = {
              evidence: `Script URL references Moment.js: ${url}`
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
      name: 'Moment.js',
      npmPackage: 'moment',
      detectedVersion: finalVersion,
      evidence,
      confidence,
      conflictingSignals
    };
  }
};
