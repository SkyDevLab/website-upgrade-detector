import { describe, it, expect } from 'vitest';
import { runAllDetectors } from '../src/detectors/index.ts';
import { jqueryDetector } from '../src/detectors/jquery.ts';
import { reactDetector } from '../src/detectors/react.ts';
import { vueDetector } from '../src/detectors/vue.ts';
import { angularDetector } from '../src/detectors/angular.ts';
import { bootstrapDetector } from '../src/detectors/bootstrap.ts';
import { lodashDetector } from '../src/detectors/lodash.ts';
import { axiosDetector } from '../src/detectors/axios.ts';
import { momentDetector } from '../src/detectors/moment.ts';
import { threeDetector } from '../src/detectors/three.ts';
import { tailwindDetector } from '../src/detectors/tailwind.ts';

describe('Modular Detectors', () => {
  it('detects jQuery via runtime window.jQuery', () => {
    const result = jqueryDetector.detect({
      windowObj: {
        jQuery: Object.assign(() => {}, { fn: { jquery: '3.6.4' } })
      }
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe('jQuery');
    expect(result?.detectedVersion).toBe('3.6.4');
    expect(result?.confidence).toBe('high');
    expect(result?.evidence[0]).toContain('window.jQuery detected');
  });

  it('detects jQuery via script URL when runtime is absent', () => {
    const result = jqueryDetector.detect({
      scripts: [{ src: 'https://code.jquery.com/jquery-3.7.1.min.js' }]
    });

    expect(result).not.toBeNull();
    expect(result?.detectedVersion).toBe('3.7.1');
    expect(result?.confidence).toBe('medium');
  });

  it('detects React via runtime and rejects weak false positives', () => {
    // False positive rejection: window.react = "hello" must NOT be detected
    const falsePositive = reactDetector.detect({
      windowObj: { react: 'hello', React: 'just a string' }
    });
    expect(falsePositive).toBeNull();

    // Genuine React
    const valid = reactDetector.detect({
      windowObj: {
        React: {
          version: '18.2.0',
          createElement: () => {}
        }
      }
    });
    expect(valid).not.toBeNull();
    expect(valid?.name).toBe('React');
    expect(valid?.detectedVersion).toBe('18.2.0');
    expect(valid?.confidence).toBe('high');
  });

  it('detects React via React DevTools hook', () => {
    const result = reactDetector.detect({
      windowObj: {
        __REACT_DEVTOOLS_GLOBAL_HOOK__: {
          renderers: [{ version: '18.3.1' }]
        }
      }
    });

    expect(result).not.toBeNull();
    expect(result?.detectedVersion).toBe('18.3.1');
    expect(result?.confidence).toBe('high');
  });

  it('detects Vue via runtime and devtools hook', () => {
    const result = vueDetector.detect({
      windowObj: {
        Vue: {
          version: '3.4.21',
          createApp: () => {}
        }
      }
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Vue');
    expect(result?.detectedVersion).toBe('3.4.21');
  });

  it('detects Angular via DOM ng-version attribute', () => {
    const result = angularDetector.detect({
      domAttributes: [{ name: 'ng-version', value: '17.2.1' }]
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Angular');
    expect(result?.npmPackage).toBe('@angular/core');
    expect(result?.detectedVersion).toBe('17.2.1');
    expect(result?.confidence).toBe('high');
  });

  it('detects Bootstrap via window.bootstrap and CSS stylesheet links', () => {
    const result = bootstrapDetector.detect({
      windowObj: {
        bootstrap: {
          Tooltip: { VERSION: '5.3.3' }
        }
      },
      stylesheets: [{ href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css' }]
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Bootstrap');
    expect(result?.detectedVersion).toBe('5.3.3');
  });

  it('detects Lodash and distinguishes it from Underscore.js', () => {
    // Underscore lacks debounce / cloneDeep / isPlainObject
    const underscore = lodashDetector.detect({
      windowObj: {
        _: Object.assign(() => {}, { VERSION: '1.13.6', each: () => {} })
      }
    });
    expect(underscore).toBeNull();

    // Genuine Lodash has debounce / cloneDeep
    const lodash = lodashDetector.detect({
      windowObj: {
        _: Object.assign(() => {}, {
          VERSION: '4.17.21',
          debounce: () => {},
          cloneDeep: () => {}
        })
      }
    });
    expect(lodash).not.toBeNull();
    expect(lodash?.detectedVersion).toBe('4.17.21');
  });

  it('detects Axios via runtime methods and version', () => {
    const result = axiosDetector.detect({
      windowObj: {
        axios: Object.assign(() => {}, {
          VERSION: '1.7.2',
          request: () => {},
          get: () => {}
        })
      }
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Axios');
    expect(result?.detectedVersion).toBe('1.7.2');
  });

  it('detects Moment.js via runtime version', () => {
    const result = momentDetector.detect({
      windowObj: {
        moment: Object.assign(() => {}, {
          version: '2.30.1',
          utc: () => {}
        })
      }
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Moment.js');
    expect(result?.detectedVersion).toBe('2.30.1');
  });

  it('detects Three.js and normalizes numeric revision', () => {
    const result = threeDetector.detect({
      windowObj: {
        THREE: {
          REVISION: '180',
          Scene: true
        }
      }
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Three.js');
    expect(result?.detectedVersion).toBe('0.180.0');
  });

  it('detects Tailwind CSS via script URL and CSS comments', () => {
    const result = tailwindDetector.detect({
      scripts: [{ src: 'https://cdn.tailwindcss.com/3.4.1' }]
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Tailwind CSS');
    expect(result?.npmPackage).toBe('tailwindcss');
    expect(result?.detectedVersion).toBe('3.4.1');
  });

  it('handles conflicting signals between runtime and script URL with priority to runtime', () => {
    const result = jqueryDetector.detect({
      windowObj: {
        jQuery: Object.assign(() => {}, { fn: { jquery: '3.6.4' } })
      },
      scripts: [{ src: 'https://code.jquery.com/jquery-3.5.1.min.js' }]
    });

    expect(result).not.toBeNull();
    // Prioritizes runtime
    expect(result?.detectedVersion).toBe('3.6.4');
    expect(result?.conflictingSignals).toBeDefined();
    expect(result?.conflictingSignals?.length).toBe(2);
    expect(result?.evidence.some((e) => e.includes('Conflicting version signals'))).toBe(true);
  });

  it('runAllDetectors finds multiple libraries concurrently on a page', () => {
    const detected = runAllDetectors({
      windowObj: {
        jQuery: Object.assign(() => {}, { fn: { jquery: '3.6.4' } }),
        React: { version: '18.2.0', createElement: () => {} },
        axios: Object.assign(() => {}, { VERSION: '1.7.2', request: () => {}, get: () => {} })
      },
      scripts: [{ src: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js' }]
    });

    expect(detected.length).toBe(4);
    const names = detected.map((d) => d.name);
    expect(names).toContain('jQuery');
    expect(names).toContain('React');
    expect(names).toContain('Axios');
    expect(names).toContain('Three.js');
  });
});
