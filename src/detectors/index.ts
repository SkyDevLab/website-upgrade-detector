import { DetectedLibrary, DetectionContext, LibraryDetector } from '../shared/types.ts';
import { jqueryDetector } from './jquery.ts';
import { reactDetector } from './react.ts';
import { vueDetector } from './vue.ts';
import { angularDetector } from './angular.ts';
import { bootstrapDetector } from './bootstrap.ts';
import { lodashDetector } from './lodash.ts';
import { axiosDetector } from './axios.ts';
import { momentDetector } from './moment.ts';
import { threeDetector } from './three.ts';
import { tailwindDetector } from './tailwind.ts';

/**
 * Registry of all 10 supported MVP detectors.
 */
export const ALL_DETECTORS: LibraryDetector[] = [
  jqueryDetector,
  reactDetector,
  vueDetector,
  angularDetector,
  bootstrapDetector,
  lodashDetector,
  axiosDetector,
  momentDetector,
  threeDetector,
  tailwindDetector
];

/**
 * Executes all registered detectors against the current context and returns detected libraries.
 */
export function runAllDetectors(context?: DetectionContext): DetectedLibrary[] {
  const detected: DetectedLibrary[] = [];

  for (const detector of ALL_DETECTORS) {
    try {
      const result = detector.detect(context);
      if (result) {
        detected.push(result);
      }
    } catch (err) {
      console.warn(`[Website Upgrade Detector] Error in detector ${detector.name}:`, err);
    }
  }

  return detected;
}

export {
  jqueryDetector,
  reactDetector,
  vueDetector,
  angularDetector,
  bootstrapDetector,
  lodashDetector,
  axiosDetector,
  momentDetector,
  threeDetector,
  tailwindDetector
};
