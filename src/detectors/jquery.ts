import { DetectedLibrary, DetectionContext, LibraryDetector } from '../shared/types.ts';
import { getWindow, getScriptUrls, reconcileVersionSignals } from './utils.ts';
import { extractVersionFromUrl } from '../analyzer/versionParser.ts';

export const jqueryDetector: LibraryDetector = {
  id: 'jquery',
  name: 'jQuery',
  npmPackage: 'jquery',

  detect(context?: DetectionContext): DetectedLibrary | null {
    const win = getWindow(context);
    const scriptUrls = getScriptUrls(context);

    let runtimeSignal: { version?: string; evidence: string } | null = null;
    let urlSignal: { version?: string; evidence: string } | null = null;

    // 1. Runtime inspection
    const jqCandidate = win?.jQuery || (win?.$ && win.$.fn?.jquery ? win.$ : undefined);
    if (jqCandidate && typeof jqCandidate === 'function' && jqCandidate.fn?.jquery) {
      const version = String(jqCandidate.fn.jquery);
      runtimeSignal = {
        version,
        evidence: `window.jQuery detected (jQuery.fn.jquery = ${version})`
      };
    } else if (jqCandidate && typeof jqCandidate === 'function' && jqCandidate.expando) {
      // Detected jQuery without explicit version string
      runtimeSignal = {
        evidence: 'window.jQuery detected (version string not exposed on fn.jquery)'
      };
    }

    // 2. Script URL inspection
    for (const url of scriptUrls) {
      if (/jquery(?:[.-]|\.min|\.slim|@)/i.test(url)) {
        const extracted = extractVersionFromUrl(url, 'jquery');
        if (extracted) {
          urlSignal = {
            version: extracted,
            evidence: `Script URL contains jQuery version: ${url}`
          };
          break;
        } else if (!urlSignal) {
          urlSignal = {
            evidence: `Script URL references jQuery: ${url}`
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
      name: 'jQuery',
      npmPackage: 'jquery',
      detectedVersion: finalVersion,
      evidence,
      confidence,
      conflictingSignals
    };
  }
};
