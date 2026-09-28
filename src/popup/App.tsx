import React, { useState, useEffect, useCallback } from 'react';
import { DetectedLibrary, UpgradeAnalysis } from '../shared/types.ts';
import { extractPageSignals } from '../content/contentScript.ts';
import { runAllDetectors } from '../detectors/index.ts';
import { fetchLatestVersions } from '../npm/client.ts';
import { analyzeUpgrade, computeSummary } from '../analyzer/upgradeAnalyzer.ts';
import { Header } from './components/Header.tsx';
import { Summary } from './components/Summary.tsx';
import { ActionButtons } from './components/ActionButtons.tsx';
import { LibraryCard } from './components/LibraryCard.tsx';
import { NetworkNotice } from './components/NetworkNotice.tsx';

export const App: React.FC = () => {
  const [hostname, setHostname] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [analyses, setAnalyses] = useState<UpgradeAnalysis[]>([]);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  /**
   * Scans the active webpage for supported libraries and queries npm for latest versions.
   */
  const handleScan = useCallback(async (forceRefresh = false) => {
    setIsScanning(true);
    setStatusMessage(null);
    setNetworkError(null);

    // Development / Browser mock fallback if extension APIs are unavailable
    if (typeof chrome === 'undefined' || !chrome.tabs?.query || !chrome.scripting?.executeScript) {
      setHostname('localhost (demo mode)');
      // Simulate demo scan for development
      setTimeout(async () => {
        const mockLibraries: DetectedLibrary[] = [
          {
            name: 'jQuery',
            npmPackage: 'jquery',
            detectedVersion: '3.6.4',
            evidence: ['window.jQuery detected (jQuery.fn.jquery = 3.6.4)'],
            confidence: 'high'
          },
          {
            name: 'React',
            npmPackage: 'react',
            detectedVersion: '18.2.0',
            evidence: ['window.React.version = 18.2.0 (createElement API confirmed)'],
            confidence: 'high'
          },
          {
            name: 'Axios',
            npmPackage: 'axios',
            detectedVersion: '1.7.2',
            evidence: ['window.axios.VERSION = 1.7.2'],
            confidence: 'high'
          },
          {
            name: 'Three.js',
            npmPackage: 'three',
            detectedVersion: '0.180.0',
            evidence: ['window.THREE.REVISION = 180 (normalized to 0.180.0)'],
            confidence: 'high'
          }
        ];

        const pkgs = mockLibraries.map((l) => l.npmPackage);
        const npmResults = await fetchLatestVersions(pkgs, forceRefresh);
        const analyzed = mockLibraries.map((lib) => {
          const res = npmResults.get(lib.npmPackage);
          return analyzeUpgrade(lib, res?.version, res?.error);
        });

        setAnalyses(analyzed);
        setHasScanned(true);
        setIsScanning(false);
      }, 400);
      return;
    }

    try {
      // 1. Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        setStatusMessage('No active browser tab found.');
        setIsScanning(false);
        return;
      }

      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        setStatusMessage('Cannot scan internal browser pages. Please open a website to scan.');
        setIsScanning(false);
        return;
      }

      let parsedHostname = '';
      try {
        parsedHostname = new URL(tab.url).hostname;
        setHostname(parsedHostname);
      } catch {
        setHostname(tab.url);
      }

      // 2. Execute extraction script in MAIN execution world of the page
      const [injectionResult] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: extractPageSignals
      });

      const signals = injectionResult?.result;
      if (!signals) {
        setStatusMessage('Unable to access page context. Site may be protected by browser policies.');
        setIsScanning(false);
        return;
      }

      // 3. Run all modular detectors locally
      const detected = runAllDetectors(signals);

      if (detected.length === 0) {
        setAnalyses([]);
        setHasScanned(true);
        setIsScanning(false);
        return;
      }

      // 4. Query npm registry for latest versions
      const packageNames = detected.map((d) => d.npmPackage);
      let npmResults = new Map();
      let hasNetworkFailure = false;

      try {
        npmResults = await fetchLatestVersions(packageNames, forceRefresh);
      } catch (err) {
        hasNetworkFailure = true;
        setNetworkError('Failed to communicate with the npm registry.');
      }

      // 5. Analyze upgrades for each detected library
      const analyzedList = detected.map((lib) => {
        const npmRes = npmResults.get(lib.npmPackage);
        if (npmRes?.error && npmRes.error.includes('Network error')) {
          hasNetworkFailure = true;
        }
        return analyzeUpgrade(lib, npmRes?.version, npmRes?.error);
      });

      if (hasNetworkFailure) {
        setNetworkError('Unable to check latest versions from npm. Detected libraries are still displayed.');
      }

      setAnalyses(analyzedList);
      setHasScanned(true);
    } catch (err) {
      console.error('[Website Upgrade Detector] Scan error:', err);
      setStatusMessage('An error occurred while scanning the webpage.');
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Automatically initiate a scan when popup is opened
  useEffect(() => {
    handleScan(false);
  }, [handleScan]);

  const summary = computeSummary(analyses);

  return (
    <div className="popup-container">
      <Header hostname={hostname} />

      <main className="main-content">
        <ActionButtons
          onScan={() => handleScan(false)}
          onRefreshVersions={() => handleScan(true)}
          isScanning={isScanning}
          hasLibraries={analyses.length > 0}
        />

        {statusMessage && (
          <div className="notice-box info">
            <span>ℹ</span>
            <p>{statusMessage}</p>
          </div>
        )}

        {networkError && <NetworkNotice message={networkError} />}

        {hasScanned && analyses.length > 0 && (
          <>
            <Summary
              totalDetected={summary.totalDetected}
              updatesAvailable={summary.updatesAvailable}
              current={summary.current}
              unknown={summary.unknown}
              failed={summary.failed}
            />

            <div className="divider"></div>

            <section className="library-list">
              {analyses.map((analysis) => (
                <LibraryCard
                  key={analysis.library.npmPackage}
                  analysis={analysis}
                />
              ))}
            </section>
          </>
        )}

        {hasScanned && analyses.length === 0 && !statusMessage && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p className="empty-title">No supported libraries detected</p>
            <p className="empty-subtitle">
              This webpage does not appear to expose any of the 10 supported libraries.
            </p>
          </div>
        )}
      </main>

      <footer className="footer">
        <span>Microsoft Edge Manifest V3 MVP</span>
        <span>•</span>
        <span>SkyDevLab</span>
      </footer>
    </div>
  );
};
