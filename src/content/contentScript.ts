import { DetectionContext } from '../shared/types.ts';
import { runAllDetectors } from '../detectors/index.ts';

/**
 * Extracts raw, JSON-safe detection signals from the page's execution environment.
 * Designed to be invoked in the MAIN execution world of the target webpage.
 */
export function extractPageSignals(): DetectionContext {
  const win = window as any;

  // 1. Extract Window Global Object Signals safely (avoiding circular references)
  const windowObj: Record<string, any> = {};

  // jQuery
  try {
    const jq = win.jQuery || (win.$ && win.$.fn?.jquery ? win.$ : undefined);
    if (jq && typeof jq === 'function') {
      windowObj.jQuery = {
        version: jq.fn?.jquery ? String(jq.fn.jquery) : undefined,
        fn: { jquery: jq.fn?.jquery ? String(jq.fn.jquery) : undefined },
        expando: Boolean(jq.expando)
      };
    }
  } catch {}

  // React
  try {
    if (win.React && typeof win.React === 'object') {
      windowObj.React = {
        version: typeof win.React.version === 'string' ? win.React.version : undefined,
        createElement: typeof win.React.createElement === 'function' ? () => {} : undefined
      };
    }
    if (win.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const renderers = win.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers;
      const rendererList: Array<{ version?: string }> = [];
      if (renderers) {
        if (typeof renderers.forEach === 'function') {
          renderers.forEach((r: any) => {
            if (r?.version) rendererList.push({ version: String(r.version) });
          });
        } else if (typeof renderers === 'object') {
          for (const key of Object.keys(renderers)) {
            if (renderers[key]?.version) {
              rendererList.push({ version: String(renderers[key].version) });
            }
          }
        }
      }
      windowObj.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        renderers: rendererList
      };
    }
  } catch {}

  // Vue
  try {
    if (win.Vue && (typeof win.Vue === 'function' || typeof win.Vue === 'object')) {
      windowObj.Vue = {
        version: typeof win.Vue.version === 'string' ? win.Vue.version : undefined,
        createApp: typeof win.Vue.createApp === 'function' ? () => {} : undefined,
        component: typeof win.Vue.component === 'function' ? () => {} : undefined
      };
    }
    if (win.__VUE__ === true) {
      windowObj.__VUE__ = true;
    }
    if (win.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      const hookApps = win.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps;
      const appList: Array<{ version?: string }> = [];
      if (Array.isArray(hookApps)) {
        for (const app of hookApps) {
          if (app?.version) appList.push({ version: String(app.version) });
        }
      }
      windowObj.__VUE_DEVTOOLS_GLOBAL_HOOK__ = { apps: appList };
    }
  } catch {}

  // Angular
  try {
    if (win.ng && typeof win.ng === 'object') {
      windowObj.ng = {
        version: win.ng.version?.full
          ? { full: String(win.ng.version.full) }
          : typeof win.ng.version === 'string'
          ? { full: String(win.ng.version) }
          : undefined,
        coreTokens: Boolean(win.ng.coreTokens),
        probe: typeof win.ng.probe === 'function'
      };
    }
    if (win.angular && typeof win.angular === 'object') {
      windowObj.angular = {
        version: win.angular.version?.full
          ? { full: String(win.angular.version.full) }
          : undefined,
        module: typeof win.angular.module === 'function' ? () => {} : undefined
      };
    }
  } catch {}

  // Bootstrap
  try {
    if (win.bootstrap && typeof win.bootstrap === 'object') {
      const b = win.bootstrap;
      windowObj.bootstrap = {
        VERSION: b.VERSION || b.Tooltip?.VERSION || b.Modal?.VERSION || b.Dropdown?.VERSION,
        Tooltip: b.Tooltip ? { VERSION: b.Tooltip.VERSION } : undefined,
        Modal: b.Modal ? { VERSION: b.Modal.VERSION } : undefined
      };
    }
    if (win.jQuery?.fn) {
      const jqFn = win.jQuery.fn;
      const bVer =
        jqFn.tooltip?.Constructor?.VERSION ||
        jqFn.modal?.Constructor?.VERSION ||
        jqFn.dropdown?.Constructor?.VERSION;
      if (bVer || jqFn.emulateTransitionEnd) {
        if (!windowObj.jQuery) windowObj.jQuery = { fn: {} };
        windowObj.jQuery.fn.tooltip = { Constructor: { VERSION: bVer } };
        windowObj.jQuery.fn.emulateTransitionEnd = Boolean(jqFn.emulateTransitionEnd);
      }
    }
  } catch {}

  // Lodash
  try {
    const candidates = [win._, win.lodash].filter(Boolean);
    for (const c of candidates) {
      if (typeof c === 'function' && typeof c.VERSION === 'string') {
        const isLodash =
          typeof c.debounce === 'function' ||
          typeof c.cloneDeep === 'function' ||
          typeof c.kebabCase === 'function' ||
          typeof c.isPlainObject === 'function';
        if (isLodash) {
          windowObj._ = {
            VERSION: String(c.VERSION),
            debounce: () => {},
            cloneDeep: () => {}
          };
          break;
        }
      }
    }
  } catch {}

  // Axios
  try {
    if (
      win.axios &&
      (typeof win.axios === 'function' || typeof win.axios === 'object') &&
      typeof win.axios.request === 'function'
    ) {
      windowObj.axios = {
        VERSION: typeof win.axios.VERSION === 'string' ? win.axios.VERSION : undefined,
        request: () => {},
        get: () => {}
      };
    }
  } catch {}

  // Moment.js
  try {
    if (win.moment && typeof win.moment === 'function') {
      windowObj.moment = {
        version: typeof win.moment.version === 'string' ? win.moment.version : undefined,
        utc: () => {},
        duration: () => {}
      };
    }
  } catch {}

  // Three.js
  try {
    if (win.THREE && typeof win.THREE === 'object') {
      windowObj.THREE = {
        REVISION: win.THREE.REVISION !== undefined ? String(win.THREE.REVISION) : undefined,
        Scene: Boolean(win.THREE.Scene),
        WebGLRenderer: Boolean(win.THREE.WebGLRenderer),
        Vector3: Boolean(win.THREE.Vector3)
      };
    }
  } catch {}

  // Tailwind CSS
  try {
    if (win.tailwind && typeof win.tailwind === 'object') {
      windowObj.tailwind = {
        version:
          typeof win.tailwind.version === 'string'
            ? win.tailwind.version
            : typeof win.tailwind.VERSION === 'string'
            ? win.tailwind.VERSION
            : undefined,
        config: Boolean(win.tailwind.config)
      };
    }
  } catch {}

  // 2. Extract Script URLs
  const scripts: Array<{ src?: string }> = [];
  try {
    const scriptElements = document.scripts;
    for (let i = 0; i < scriptElements.length; i++) {
      const src = scriptElements[i].src;
      if (src) {
        scripts.push({ src });
      }
    }
  } catch {}

  // 3. Extract Stylesheet URLs & Inline Comments
  const stylesheets: Array<{ href?: string; text?: string }> = [];
  try {
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    linkElements.forEach((link) => {
      const href = (link as HTMLLinkElement).href;
      if (href) stylesheets.push({ href });
    });

    const styleTags = document.querySelectorAll('style');
    styleTags.forEach((style) => {
      const text = style.textContent || '';
      if (text.includes('tailwindcss') || text.includes('--tw-') || text.includes('--bs-')) {
        // Only keep small relevant snippet to avoid huge payloads
        stylesheets.push({ text: text.slice(0, 500) });
      }
    });
  } catch {}

  // 4. Extract Key Framework DOM Attributes
  const domAttributes: Array<{ name: string; value: string }> = [];
  try {
    // Angular ng-version
    const ngElem = document.querySelector('[ng-version]');
    if (ngElem) {
      domAttributes.push({
        name: 'ng-version',
        value: ngElem.getAttribute('ng-version') || ''
      });
    }

    // React data-reactroot
    if (document.querySelector('[data-reactroot], [data-reactid]')) {
      domAttributes.push({ name: 'data-reactroot', value: 'true' });
    }

    // Vue scoped data-v-*
    const vueScoped = Array.from(document.querySelectorAll('*')).find((el) =>
      Array.from(el.attributes).some((a) => a.name.startsWith('data-v-'))
    );
    if (vueScoped) {
      domAttributes.push({ name: 'data-v-app', value: 'true' });
    }
  } catch {}

  return {
    windowObj,
    scripts,
    stylesheets,
    domAttributes
  };
}

// Enable content script to respond to runtime messages if contacted
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'WUD_SCAN_PAGE') {
      try {
        const signals = extractPageSignals();
        const detected = runAllDetectors(signals);
        sendResponse({ success: true, libraries: detected, signals });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Scan error'
        });
      }
      return true; // Keep message channel open for async response
    }
  });
}
