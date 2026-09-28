import React from 'react';

interface SummaryProps {
  totalDetected: number;
  updatesAvailable: number;
  current: number;
  unknown: number;
  failed: number;
}

export const Summary: React.FC<SummaryProps> = ({
  totalDetected,
  updatesAvailable,
  current,
  unknown,
  failed
}) => {
  return (
    <div className="summary-card">
      <div className="summary-headline">
        <span className="summary-count">{totalDetected}</span>
        <span className="summary-label">
          {totalDetected === 1 ? 'library detected' : 'libraries detected'}
        </span>
      </div>

      <div className="summary-badges">
        {updatesAvailable > 0 && (
          <span className="badge badge-warning" title={`${updatesAvailable} updates available`}>
            ⚠ {updatesAvailable} {updatesAvailable === 1 ? 'update' : 'updates'}
          </span>
        )}
        {current > 0 && (
          <span className="badge badge-success" title={`${current} up-to-date`}>
            ✓ {current} current
          </span>
        )}
        {unknown > 0 && (
          <span className="badge badge-neutral" title={`${unknown} version unknown`}>
            ? {unknown} unknown
          </span>
        )}
        {failed > 0 && (
          <span className="badge badge-danger" title={`${failed} registry checks failed`}>
            ⚠ {failed} failed
          </span>
        )}
      </div>
    </div>
  );
};
