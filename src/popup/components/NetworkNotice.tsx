import React from 'react';

interface NetworkNoticeProps {
  message?: string;
}

export const NetworkNotice: React.FC<NetworkNoticeProps> = ({ message }) => {
  return (
    <div className="network-alert">
      <div className="network-alert-icon">⚠</div>
      <div className="network-alert-body">
        <strong>Unable to check latest versions</strong>
        <p>
          {message ||
            'Your detected libraries are still shown, but upgrade status could not be determined due to a network or registry failure.'}
        </p>
      </div>
    </div>
  );
};
