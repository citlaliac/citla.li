import React from 'react';

function CecBrandHalo({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 72"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="cec-brand-halo-outer"
        d="M 18 36 C 20 8, 58 3, 94 12 C 112 22, 114 48, 96 62 C 72 74, 34 70, 18 50 C 14 42, 15 38, 18 36 Z"
        fill="none"
      />
      <path
        className="cec-brand-halo-inner"
        d="M 26 36 C 28 14, 56 10, 88 17 C 102 25, 104 44, 90 56 C 70 66, 38 63, 26 49 C 23 42, 24 38, 26 36 Z"
        fill="none"
      />
    </svg>
  );
}

function CecBrandTitle({ as: Tag = 'h1', className = 'cec-brand-title', id }) {
  return (
    <div className="cec-brand-shrine">
      <Tag id={id} className={className} aria-label="Catholic e-Cloud">
        <span className="cec-brand-crown">
          <CecBrandHalo className="cec-brand-halo cec-brand-halo--rear" />
          <span className="cec-brand-c">C</span>
          <CecBrandHalo className="cec-brand-halo cec-brand-halo--front" />
        </span>
        atholic <span className="cec-brand-ecloud">e-Cloud</span>
      </Tag>
    </div>
  );
}

export default CecBrandTitle;
