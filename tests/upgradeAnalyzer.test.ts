import { describe, it, expect } from 'vitest';
import { analyzeUpgrade, computeSummary } from '../src/analyzer/upgradeAnalyzer.ts';
import { DetectedLibrary, UpgradeAnalysis } from '../src/shared/types.ts';

describe('Upgrade Analyzer', () => {
  const baseLibrary: DetectedLibrary = {
    name: 'jQuery',
    npmPackage: 'jquery',
    detectedVersion: '3.6.4',
    evidence: ['window.jQuery detected'],
    confidence: 'high'
  };

  it('marks status as CURRENT when detected version equals latest published version', () => {
    const analysis = analyzeUpgrade(baseLibrary, '3.6.4');
    expect(analysis.status).toBe('CURRENT');
    expect(analysis.isMajorUpdate).toBe(false);
    expect(analysis.statusMessage).toBe('Current');
  });

  it('marks status as UPDATE_AVAILABLE for minor or patch differences', () => {
    const analysis = analyzeUpgrade(baseLibrary, '3.7.1');
    expect(analysis.status).toBe('UPDATE_AVAILABLE');
    expect(analysis.isMajorUpdate).toBe(false);
    expect(analysis.statusMessage).toBe('Update available');
  });

  it('marks status as UPDATE_AVAILABLE with isMajorUpdate=true for major version increases', () => {
    const reactLib: DetectedLibrary = {
      name: 'React',
      npmPackage: 'react',
      detectedVersion: '18.2.0',
      evidence: ['window.React.version = 18.2.0'],
      confidence: 'high'
    };

    const analysis = analyzeUpgrade(reactLib, '19.1.1');
    expect(analysis.status).toBe('UPDATE_AVAILABLE');
    expect(analysis.isMajorUpdate).toBe(true);
    expect(analysis.statusMessage).toBe('Major version update available');
  });

  it('marks status as UNKNOWN when detected version is unparseable', () => {
    const unknownLib: DetectedLibrary = {
      name: 'Tailwind CSS',
      npmPackage: 'tailwindcss',
      detectedVersion: undefined,
      evidence: ['Tailwind classes detected'],
      confidence: 'medium'
    };

    const analysis = analyzeUpgrade(unknownLib, '3.4.1');
    expect(analysis.status).toBe('UNKNOWN');
    expect(analysis.statusMessage).toBe('Version could not be determined');
  });

  it('marks status as CHECK_FAILED when npm registry fetch fails', () => {
    const analysis = analyzeUpgrade(baseLibrary, null, 'Network offline');
    expect(analysis.status).toBe('CHECK_FAILED');
    expect(analysis.statusMessage).toBe("Couldn't check latest version");
    expect(analysis.errorMessage).toBe('Network offline');
  });

  it('computeSummary correctly aggregates metrics across all statuses', () => {
    const analyses: UpgradeAnalysis[] = [
      {
        library: baseLibrary,
        latestVersion: '3.7.1',
        status: 'UPDATE_AVAILABLE',
        isMajorUpdate: false,
        statusMessage: 'Update available'
      },
      {
        library: { ...baseLibrary, name: 'React', npmPackage: 'react' },
        latestVersion: '19.0.0',
        status: 'UPDATE_AVAILABLE',
        isMajorUpdate: true,
        statusMessage: 'Major version update available'
      },
      {
        library: { ...baseLibrary, name: 'Three.js', npmPackage: 'three', detectedVersion: '0.180.0' },
        latestVersion: '0.180.0',
        status: 'CURRENT',
        isMajorUpdate: false,
        statusMessage: 'Current'
      },
      {
        library: { ...baseLibrary, name: 'Tailwind CSS', npmPackage: 'tailwindcss', detectedVersion: undefined },
        latestVersion: '3.4.1',
        status: 'UNKNOWN',
        isMajorUpdate: false,
        statusMessage: 'Version could not be determined'
      },
      {
        library: { ...baseLibrary, name: 'CustomLib', npmPackage: 'custom' },
        latestVersion: null,
        status: 'CHECK_FAILED',
        isMajorUpdate: false,
        statusMessage: "Couldn't check latest version"
      }
    ];

    const summary = computeSummary(analyses);
    expect(summary.totalDetected).toBe(5);
    expect(summary.updatesAvailable).toBe(2);
    expect(summary.current).toBe(1);
    expect(summary.unknown).toBe(1);
    expect(summary.failed).toBe(1);
  });
});
