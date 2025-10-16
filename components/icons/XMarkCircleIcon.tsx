import React from 'react';

const XMarkCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M14.5 9.5L9.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9.5 9.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default XMarkCircleIcon;