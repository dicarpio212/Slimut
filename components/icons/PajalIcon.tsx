import React from 'react';

const PajalIcon: React.FC<{ className?: string }> = ({ className = "w-24 h-24" }) => (
  <svg viewBox="0 0 125 100" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* Rhombus with outline */}
    <path
      d="M50 1 L100 50 L50 99 L1 50 Z"
      fill="#50B1F4"
      stroke="#2C508A"
      strokeWidth="6"
      strokeLinejoin="round"
    />
    {/* Checkmark white outline */}
    <path
      d="M28 52 L48 72 L110 10"
      stroke="white"
      strokeWidth="20"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Main checkmark */}
    <path
      d="M28 52 L48 72 L110 10"
      stroke="#2C508A"
      strokeWidth="12"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export default PajalIcon;