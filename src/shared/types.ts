/**
 * Core types for Website Upgrade Detector by SkyDevLab
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface VersionSignal {
  source: string;
  version: string;
}

export interface DetectedLibrary {
  name: string;
  npmPackage: string;
  detectedVersion?: string;
  evidence: string[];
  confidence: ConfidenceLevel;
  conflictingSignals?: VersionSignal[];
}

export type UpgradeStatus =
  | 'CURRENT'
  | 'UPDATE_AVAILABLE'
  | 'UNKNOWN'
  | 'CHECK_FAILED';

export interface UpgradeAnalysis {
  library: DetectedLibrary;
  latestVersion: string | null;
  status: UpgradeStatus;
  isMajorUpdate: boolean;
  statusMessage: string;
  errorMessage?: string;
}

export interface DetectionContext {
  windowObj?: Record<string, any>;
  scripts?: Array<{ src?: string; text?: string }>;
  stylesheets?: Array<{ href?: string; text?: string }>;
  domAttributes?: Array<{ name: string; value: string }>;
  html?: string;
}

export interface LibraryDetector {
  id: string;
  name: string;
  npmPackage: string;
  detect: (context?: DetectionContext) => DetectedLibrary | null;
}

export interface NpmCacheEntry {
  version: string;
  timestamp: number;
}

export interface NpmRegistryResponse {
  name?: string;
  version?: string;
  'dist-tags'?: {
    latest?: string;
    [tag: string]: string | undefined;
  };
  error?: string;
}

export interface ScanResult {
  url: string;
  hostname: string;
  timestamp: number;
  libraries: DetectedLibrary[];
  analyses: UpgradeAnalysis[];
  summary: {
    totalDetected: number;
    updatesAvailable: number;
    current: number;
    unknown: number;
    failed: number;
  };
  checkFailedNotice?: string;
}
