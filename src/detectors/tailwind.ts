import { DetectedLibrary, DetectionContext, LibraryDetector } from '../shared/types.ts';
import { getWindow, getScriptUrls, getStylesheetUrls, reconcileVersionSignals } from './utils.ts';
import { extractVersionFromUrl } from '../analyzer/versionParser.ts';

export const tailwindDetector: LibraryDetector = {
  id: 'tailwind',
  name: 'Tailwind CSS',
  npmPackage: 'tailwindcss',

  detect(context?: DetectionContext): DetectedLibrary | null {
    const win = getWindow(context);
    const scriptUrls = getScriptUrls(context);
    const styleUrls = getStylesheetUrls(context);

    let runtimeSignal: { version?: string; evidence: string } | null = null;
    let urlSignal: { version?: string; evidence: string } | null = null;
    let cssSignal: { version?: string; evidence: string } | null = null;

    // 1. Runtime inspection: window.tailwind (Tailwind Play CDN)
    if (win?.tailwind && typeof win.tailwind === 'object') {
      const ver =
        typeof win.tailwind.version === 'string'
          ? win.tailwind.version
          : typeof win.tailwind.VERSION === 'string'
          ? win.tailwind.VERSION
          : undefined;

      if (ver) {
        runtimeSignal = {
          version: ver,
          evidence: `window.tailwind.version = ${ver}`
        };
      } else if (win.tailwind.config || typeof win.tailwind === 'object') {
        runtimeSignal = {
          evidence: 'window.tailwind runtime CDN object detected'
        };
      }
    }

    // 2. Script URL inspection (e.g. cdn.tailwindcss.com or tailwindcss@3.4.1)
    for (const url of scriptUrls) {
      if (/cdn\.tailwindcss\.com/i.test(url) || /tailwind(?:css)?(?:[.-]|\.min|@)/i.test(url)) {
        // Match cdn.tailwindcss.com/3.4.1 or @tailwindcss/3.4.1 or tailwindcss@3.4.1
        const cdnMatch = url.match(/cdn\.tailwindcss\.com\/(\d+\.\d+(?:\.\d+)?)/i);
        const extracted = cdnMatch ? cdnMatch[1] : extractVersionFromUrl(url, 'tailwindcss') || extractVersionFromUrl(url, 'tailwind');

        if (extracted) {
          urlSignal = {
            version: extracted,
            evidence: `Tailwind CDN script URL contains version: ${url}`
          };
          break;
        } else if (!urlSignal) {
          urlSignal = {
            evidence: `Tailwind CDN script URL referenced: ${url}`
          };
        }
      }
    }

    // 3. Stylesheet URL inspection
    for (const url of styleUrls) {
      if (/tailwind(?:css)?(?:[.-]|\.min|@)/i.test(url)) {
        const extracted = extractVersionFromUrl(url, 'tailwindcss') || extractVersionFromUrl(url, 'tailwind');
        if (extracted) {
          cssSignal = {
            version: extracted,
            evidence: `CSS stylesheet link contains Tailwind version: ${url}`
          };
          break;
        } else if (!cssSignal) {
          cssSignal = {
            evidence: `CSS stylesheet link references Tailwind: ${url}`
          };
        }
      }
    }

    // 4. Inspect CSS text or computed properties for Tailwind signature (--tw-*)
    if (!runtimeSignal && !urlSignal && !cssSignal) {
      // Check context stylesheets text or DOM style tags
      let foundTwRule = false;
      let commentVersion: string | null = null;

      if (context?.stylesheets) {
        for (const sheet of context.stylesheets) {
          if (sheet.text) {
            const vMatch = sheet.text.match(/\/\*!\s*tailwindcss\s+v?(\d+\.\d+(?:\.\d+)?)/i);
            if (vMatch) {
              commentVersion = vMatch[1];
              break;
            }
            if (sheet.text.includes('--tw-') || sheet.text.includes('--tw-scale-x')) {
              foundTwRule = true;
            }
          }
        }
      }

      if (typeof document !== 'undefined') {
        try {
          const styleTags = document.querySelectorAll('style');
          for (let i = 0; i < styleTags.length; i++) {
            const content = styleTags[i].textContent || '';
            const vMatch = content.match(/\/\*!\s*tailwindcss\s+v?(\d+\.\d+(?:\.\d+)?)/i);
            if (vMatch) {
              commentVersion = vMatch[1];
              break;
            }
            if (content.includes('--tw-') || content.includes('--tw-ring-offset-shadow')) {
              foundTwRule = true;
            }
          }
        } catch {
          // Ignore DOM stylesheet access restrictions
        }
      }

      if (commentVersion) {
        cssSignal = {
          version: commentVersion,
          evidence: `Tailwind header comment exposed version: ${commentVersion}`
        };
      } else if (foundTwRule) {
        cssSignal = {
          evidence: 'Tailwind CSS custom properties detected (--tw-*)'
        };
      }
    }

    if (!runtimeSignal && !urlSignal && !cssSignal) {
      return null;
    }

    const { finalVersion, evidence, conflictingSignals, confidence } =
      reconcileVersionSignals(runtimeSignal, urlSignal, cssSignal);

    return {
      name: 'Tailwind CSS',
      npmPackage: 'tailwindcss',
      detectedVersion: finalVersion,
      evidence,
      confidence,
      conflictingSignals
    };
  }
};
