import React, { useState } from 'react';
import { UpgradeAnalysis } from '../../shared/types.ts';
import { getNpmPackageUrl } from '../../npm/packageMap.ts';

interface LibraryCardProps {
  analysis: UpgradeAnalysis;
}

export const LibraryCard: React.FC<LibraryCardProps> = ({ analysis }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { library, latestVersion, status, isMajorUpdate, statusMessage, errorMessage } = analysis;

  const handleOpenNpm = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getNpmPackageUrl(library.npmPackage);
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'UPDATE_AVAILABLE':
        return isMajorUpdate ? (
          <span className="badge badge-major">
            ⚠ Major version update available
          </span>
        ) : (
          <span className="badge badge-warning">
            ⚠ Update available
          </span>
        );
      case 'CURRENT':
        return (
          <span className="badge badge-success">
            ✓ Current
          </span>
        );
      case 'UNKNOWN':
        return (
          <span className="badge badge-neutral">
            ? Version unknown
          </span>
        );
      case 'CHECK_FAILED':
        return (
          <span className="badge badge-danger">
            ⚠ Couldn't check latest version
          </span>
        );
    }
  };

  const detectedDisplay = library.detectedVersion || 'Unknown';
  const latestDisplay = latestVersion || '—';

  return (
    <div
      className={`library-card ${isExpanded ? 'is-expanded' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="card-header">
        <div className="card-header-left">
          <h3 className="library-name">{library.name}</h3>
          <div className="version-flow">
            <span className="version-pill detected" title="Detected version">
              {detectedDisplay}
            </span>
            <span className="version-arrow">→</span>
            <span className="version-pill latest" title="Latest published version">
              {latestDisplay}
            </span>
          </div>
        </div>

        <div className="card-header-right">
          {getStatusBadge()}
          <span className="expand-chevron">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="card-details">
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Detected:</span>
              <span className="detail-value">{detectedDisplay}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Latest published:</span>
              <span className="detail-value">{latestDisplay}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="detail-value">{statusMessage}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Package:</span>
              <code className="pkg-code">{library.npmPackage}</code>
            </div>
          </div>

          {errorMessage && (
            <div className="detail-error">
              ⚠ {errorMessage}
            </div>
          )}

          {library.conflictingSignals && library.conflictingSignals.length > 0 && (
            <div className="conflicts-box">
              <div className="conflicts-title">⚠ Conflicting version signals</div>
              <ul className="conflicts-list">
                {library.conflictingSignals.map((sig, idx) => (
                  <li key={idx}>
                    <strong>{sig.source}:</strong> {sig.version}
                  </li>
                ))}
              </ul>
              <div className="conflicts-resolution">
                Using runtime version because it is stronger evidence.
              </div>
            </div>
          )}

          <div className="evidence-section">
            <div className="evidence-title">Evidence:</div>
            <ul className="evidence-list">
              {library.evidence.map((item, idx) => (
                <li key={idx} className="evidence-item">
                  <span className="check-icon">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-footer">
            <button
              type="button"
              className="btn btn-npm"
              onClick={handleOpenNpm}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View Package on npm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
