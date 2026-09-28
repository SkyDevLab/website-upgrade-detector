import { DetectedLibrary, DetectionContext, LibraryDetector } from '../shared/types.ts';
import { getWindow, getScriptUrls, getStylesheetUrls, reconcileVersionSignals } from './utils.ts';
import { extractVersionFromUrl } from '../analyzer/versionParser.ts';

export const bootstrapDetector: LibraryDetector = {
  id: 'bootstrap',
  name: 'Bootstrap',
  npmPackage: 'bootstrap',

  detect(context?: DetectionContext): DetectedLibrary | null {
    const win = getWindow(context);
    const scriptUrls = getScriptUrls(context);
    const styleUrls = getStylesheetUrls(context);

    let runtimeSignal: { version?: string; evidence: string } | null = null;
    let urlSignal: { version?: string; evidence: string } | null = null;
    let cssSignal: { version?: string; evidence: string } | null = null;

    // 1. Runtime inspection: window.bootstrap (Bootstrap 5+)
    if (win?.bootstrap && typeof win.bootstrap === 'object') {
      const b = win.bootstrap;
      const ver =
        b.VERSION ||
        b.Tooltip?.VERSION ||
        b.Modal?.VERSION ||
        b.Dropdown?.VERSION ||
        b.Alert?.VERSION;

      if (typeof ver === 'string') {
        runtimeSignal = {
          version: ver,
          evidence: `window.bootstrap.VERSION = ${ver}`
        };
      } else if (b.Tooltip || b.Modal || b.Dropdown) {
        runtimeSignal = {
          evidence: 'window.bootstrap runtime components detected (Modal/Tooltip)'
        };
      }
    }

    // Legacy Bootstrap 3/4 attached to jQuery
    if (!runtimeSignal && win?.jQuery?.fn) {
      const jqFn = win.jQuery.fn;
      const jqBootstrapVer =
        jqFn.tooltip?.Constructor?.VERSION ||
        jqFn.modal?.Constructor?.VERSION ||
        jqFn.dropdown?.Constructor?.VERSION;

      if (typeof jqBootstrapVer === 'string') {
        runtimeSignal = {
          version: jqBootstrapVer,
          evidence: `Bootstrap jQuery plugin version = ${jqBootstrapVer}`
        };
      } else if (jqFn.emulateTransitionEnd) {
        runtimeSignal = {
          evidence: 'Bootstrap jQuery transition plugin (emulateTransitionEnd) detected'
        };
      }
    }

    // 2. Script URL inspection
    for (const url of scriptUrls) {
      if (/bootstrap(?:[.-]|\.bundle|\.min|@)/i.test(url)) {
        if (!/(?:react-bootstrap|bootstrap-icons|bootstrap-vue)/i.test(url)) {
          const extracted = extractVersionFromUrl(url, 'bootstrap');
          if (extracted) {
            urlSignal = {
              version: extracted,
              evidence: `Script URL contains Bootstrap version: ${url}`
            };
            break;
          } else if (!urlSignal) {
            urlSignal = {
              evidence: `Script URL references Bootstrap: ${url}`
            };
          }
        }
      }
    }

    // 3. Stylesheet inspection
    for (const url of styleUrls) {
      if (/bootstrap(?:[.-]|\.min|@)/i.test(url)) {
        if (!/(?:react-bootstrap|bootstrap-icons|bootstrap-vue)/i.test(url)) {
          const extracted = extractVersionFromUrl(url, 'bootstrap');
          if (extracted) {
            cssSignal = {
              version: extracted,
              evidence: `CSS stylesheet link contains Bootstrap version: ${url}`
            };
            break;
          } else if (!cssSignal) {
            cssSignal = {
              evidence: `CSS stylesheet link references Bootstrap: ${url}`
            };
          }
        }
      }
    }

    if (!runtimeSignal && !urlSignal && !cssSignal) {
      return null;
    }

    const { finalVersion, evidence, conflictingSignals, confidence } =
      reconcileVersionSignals(runtimeSignal, urlSignal, cssSignal);

    return {
      name: 'Bootstrap',
      npmPackage: 'bootstrap',
      detectedVersion: finalVersion,
      evidence,
      confidence,
      conflictingSignals
    };
  }
};
