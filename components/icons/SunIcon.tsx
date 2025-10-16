import React from 'react';

const SunIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={2} className={className}>
        <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 1V3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 21V23" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.22 4.22L5.64 5.64" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18.36 18.36L19.78 19.78" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1 12H3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12H23" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.22 19.78L5.64 18.36" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18.36 5.64L19.78 4.22" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default SunIcon;