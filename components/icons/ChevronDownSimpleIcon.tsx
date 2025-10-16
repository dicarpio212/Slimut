import React from 'react';

const ChevronDownSimpleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5.70711 9.71069C6.09763 9.32016 6.7308 9.32016 7.12132 9.71069L12 14.5894L16.8787 9.71069C17.2692 9.32016 17.9024 9.32016 18.2929 9.71069C18.6834 10.1012 18.6834 10.7344 18.2929 11.1249L12.7071 16.7107C12.3166 17.1012 11.6834 17.1012 11.2929 16.7107L5.70711 11.1249C5.31658 10.7344 5.31658 10.1012 5.70711 9.71069Z" fill="currentColor"/>
  </svg>
);

export default ChevronDownSimpleIcon;