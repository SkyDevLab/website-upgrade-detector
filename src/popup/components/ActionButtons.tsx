import React from 'react';

interface ActionButtonsProps {
  onScan: () => void;
  onRefreshVersions: () => void;
  isScanning: boolean;
  hasLibraries: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onScan,
  onRefreshVersions,
  isScanning,
  hasLibraries
}) => {
  return (
    <div className="action-buttons">
      <button
        type="button"
        className="btn btn-primary"
        onClick={onScan}
        disabled={isScanning}
      >
        {isScanning ? (
          <>
            <span className="spinner"></span>
            Scanning...
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Scan Website
          </>
        )}
      </button>

      {hasLibraries && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRefreshVersions}
          disabled={isScanning}
          title="Bypass 6-hour cache and query npm registry again"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh Versions
        </button>
      )}
    </div>
  );
};
