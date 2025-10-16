
import React from 'react';

const EyeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639l4.418-5.523A2 2 0 018.25 5.25h7.5a2 2 0 011.8.95l4.418 5.523a1.012 1.012 0 010 .639l-4.418 5.523A2 2 0 0115.75 18.75h-7.5a2 2 0 01-1.8-.95l-4.418-5.523z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default EyeIcon;