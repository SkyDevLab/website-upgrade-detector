import React from 'react';

interface HeaderProps {
  hostname?: string;
}

export const Header: React.FC<HeaderProps> = ({ hostname }) => {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="brand-logo">
          <img
            src="./icons/icon48.png"
            alt="Website Upgrade Detector"
            width="32"
            height="32"
            className="brand-logo-img"
          />
        </div>
        <div>
          <h1 className="title">Website Upgrade Detector</h1>
          <p className="subtitle">by SkyDevLab</p>
        </div>
      </div>
      {hostname && (
        <div className="domain-pill" title={`Active site: ${hostname}`}>
          <span className="domain-dot"></span>
          <span className="domain-name">{hostname}</span>
        </div>
      )}
    </header>
  );
};
