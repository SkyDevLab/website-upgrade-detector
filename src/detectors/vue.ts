import { DetectedLibrary, DetectionContext, LibraryDetector } from '../shared/types.ts';
import { getWindow, getScriptUrls, reconcileVersionSignals } from './utils.ts';
import { extractVersionFromUrl } from '../analyzer/versionParser.ts';

export const vueDetector: LibraryDetector = {
  id: 'vue',
  name: 'Vue',
  npmPackage: 'vue',

  detect(context?: DetectionContext): DetectedLibrary | null {
    const win = getWindow(context);
    const scriptUrls = getScriptUrls(context);

    let runtimeSignal: { version?: string; evidence: string } | null = null;
    let urlSignal: { version?: string; evidence: string } | null = null;
    let metaSignal: { version?: string; evidence: string } | null = null;

    // 1. Runtime inspection: window.Vue
    if (
      win?.Vue &&
      (typeof win.Vue === 'function' || typeof win.Vue === 'object') &&
      (typeof win.Vue.version === 'string' ||
        typeof win.Vue.component === 'function' ||
        typeof win.Vue.createApp === 'function')
    ) {
      const ver = typeof win.Vue.version === 'string' ? win.Vue.version : undefined;
      runtimeSignal = {
        version: ver,
        evidence: ver
          ? `window.Vue.version = ${ver}`
          : 'window.Vue detected with valid Vue runtime API'
      };
    }

    // 2. Vue DevTools hook or Vue 3 global flag
    if (!runtimeSignal?.version && win?.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = win.__VUE_DEVTOOLS_GLOBAL_HOOK__;
      let hookVersion: string | undefined;

      if (Array.isArray(hook.apps)) {
        for (const app of hook.apps) {
          if (app?.version && typeof app.version === 'string') {
            hookVersion = app.version;
            break;
          }
        }
      }

      if (hookVersion) {
        runtimeSignal = {
          version: hookVersion,
          evidence: `Vue DevTools hook exposed app version: ${hookVersion}`
        };
      } else if (win.__VUE__ === true) {
        runtimeSignal = {
          evidence: 'Vue 3 global runtime flag (window.__VUE__ = true) detected'
        };
      }
    } else if (!runtimeSignal && win?.__VUE__ === true) {
      runtimeSignal = {
        evidence: 'Vue 3 runtime flag (window.__VUE__ = true) detected'
      };
    }

    // 3. Script URL inspection
    for (const url of scriptUrls) {
      if (/vue(?:[.-]|\.runtime|\.global|\.esm-browser|\.min|@)/i.test(url)) {
        if (!/(?:vue-router|vuex|pinia|vue-i18n)/i.test(url)) {
          const extracted = extractVersionFromUrl(url, 'vue');
          if (extracted) {
            urlSignal = {
              version: extracted,
              evidence: `Script URL contains Vue version: ${url}`
            };
            break;
          } else if (!urlSignal) {
            urlSignal = {
              evidence: `Script URL references Vue: ${url}`
            };
          }
        }
      }
    }

    // 4. Scoped CSS data-v-* attributes or context attributes
    if (context?.domAttributes) {
      const hasVueScoped = context.domAttributes.some((a) => /^data-v-[a-f0-9]+$/i.test(a.name));
      if (hasVueScoped) {
        metaSignal = {
          evidence: 'DOM element with Vue scoped CSS attribute (data-v-*) detected'
        };
      }
    } else if (typeof document !== 'undefined') {
      const vueScopedElem = document.querySelector('[data-v-]') ||
        Array.from(document.querySelectorAll('*')).find((el) =>
          Array.from(el.attributes).some((attr) => attr.name.startsWith('data-v-'))
        );
      if (vueScopedElem) {
        metaSignal = {
          evidence: 'DOM element with Vue single-file component scoped CSS (data-v-*) detected'
        };
      }
    }

    if (!runtimeSignal && !urlSignal && !metaSignal) {
      return null;
    }

    const { finalVersion, evidence, conflictingSignals, confidence } =
      reconcileVersionSignals(runtimeSignal, urlSignal, null, metaSignal);

    return {
      name: 'Vue',
      npmPackage: 'vue',
      detectedVersion: finalVersion,
      evidence,
      confidence,
      conflictingSignals
    };
  }
};
