import { DetectedLibrary, DetectionContext, LibraryDetector } from '../shared/types.ts';
import { getWindow, getScriptUrls, reconcileVersionSignals } from './utils.ts';
import { extractVersionFromUrl } from '../analyzer/versionParser.ts';

export const reactDetector: LibraryDetector = {
  id: 'react',
  name: 'React',
  npmPackage: 'react',

  detect(context?: DetectionContext): DetectedLibrary | null {
    const win = getWindow(context);
    const scriptUrls = getScriptUrls(context);

    let runtimeSignal: { version?: string; evidence: string } | null = null;
    let urlSignal: { version?: string; evidence: string } | null = null;
    let metaSignal: { version?: string; evidence: string } | null = null;

    // 1. Runtime inspection: window.React
    // Ensure strict validation against random variables like window.react = "hello"
    if (
      win?.React &&
      typeof win.React === 'object' &&
      (typeof win.React.createElement === 'function' || typeof win.React.version === 'string')
    ) {
      const ver = typeof win.React.version === 'string' ? win.React.version : undefined;
      runtimeSignal = {
        version: ver,
        evidence: ver
          ? `window.React.version = ${ver} (createElement API confirmed)`
          : 'window.React detected with valid createElement API'
      };
    }

    // 2. React DevTools hook inspection (__REACT_DEVTOOLS_GLOBAL_HOOK__)
    if (!runtimeSignal?.version && win?.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = win.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.renderers) {
        let hookVersion: string | undefined;
        if (typeof hook.renderers.forEach === 'function') {
          hook.renderers.forEach((renderer: any) => {
            if (renderer?.version && typeof renderer.version === 'string') {
              hookVersion = renderer.version;
            }
          });
        } else if (typeof hook.renderers === 'object') {
          for (const key of Object.keys(hook.renderers)) {
            const renderer = hook.renderers[key];
            if (renderer?.version && typeof renderer.version === 'string') {
              hookVersion = renderer.version;
              break;
            }
          }
        }

        if (hookVersion) {
          runtimeSignal = {
            version: hookVersion,
            evidence: `React DevTools renderer hook exposed version: ${hookVersion}`
          };
        } else if (!runtimeSignal) {
          runtimeSignal = {
            evidence: 'React DevTools global hook (__REACT_DEVTOOLS_GLOBAL_HOOK__) detected'
          };
        }
      }
    }

    // 3. Script URL inspection
    for (const url of scriptUrls) {
      if (/(?:react|react-dom)(?:[.-]|\.production|\.development|@)/i.test(url)) {
        // Exclude react-router, react-bootstrap, etc. from matching base react
        if (!/(?:react-router|react-bootstrap|react-redux|react-icons)/i.test(url)) {
          const extracted = extractVersionFromUrl(url, 'react') || extractVersionFromUrl(url, 'react-dom');
          if (extracted) {
            urlSignal = {
              version: extracted,
              evidence: `Script URL contains React version: ${url}`
            };
            break;
          } else if (!urlSignal) {
            urlSignal = {
              evidence: `Script URL references React: ${url}`
            };
          }
        }
      }
    }

    // 4. DOM inspection (data-reactroot or fiber keys or context domAttributes)
    if (context?.domAttributes) {
      const hasReactAttr = context.domAttributes.some((a) =>
        a.name === 'data-reactroot' || a.name.startsWith('data-reactid')
      );
      if (hasReactAttr) {
        metaSignal = {
          evidence: 'DOM element with data-reactroot attribute detected'
        };
      }
    } else if (typeof document !== 'undefined') {
      const reactRoot = document.querySelector('[data-reactroot], [data-reactid]');
      if (reactRoot) {
        metaSignal = {
          evidence: 'DOM element with data-reactroot / data-reactid detected'
        };
      }
    }

    if (!runtimeSignal && !urlSignal && !metaSignal) {
      return null;
    }

    const { finalVersion, evidence, conflictingSignals, confidence } =
      reconcileVersionSignals(runtimeSignal, urlSignal, null, metaSignal);

    return {
      name: 'React',
      npmPackage: 'react',
      detectedVersion: finalVersion,
      evidence,
      confidence,
      conflictingSignals
    };
  }
};
