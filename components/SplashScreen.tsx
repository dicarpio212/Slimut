import React from 'react';
import PajalIcon from './icons/PajalIcon';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col justify-center items-center z-50 animate-splash">
      {/* Main content, vertically centered */}
      <div className="flex-grow flex flex-col justify-center items-center">
        <PajalIcon className="w-32 h-32 md:w-48 md:h-48" />
        <h1
          className="text-7xl md:text-9xl font-bold mt-4"
          style={{ color: '#283593' }}
        >
          PAJAL
        </h1>
      </div>
      {/* Footer tagline */}
      <div className="w-full text-center p-4 flex-shrink-0">
        <p className="text-text-secondary font-semibold text-sm md:text-base">
          ragumu, rugimu
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
