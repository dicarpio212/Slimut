import React, { useState } from 'react';
import { formatDate, formatTime } from '../constants';
import DateTimePicker from './modals/DateTimePicker';
import InformationCircleIcon from './icons/InformationCircleIcon';
import InfoModal from './modals/InfoModal';
import { View } from '../types';

interface RealtimeHeaderProps {
  realtimeDate: Date;
  setRealtimeDate: (date: Date) => void;
  currentView: View;
}

const RealtimeHeader: React.FC<RealtimeHeaderProps> = ({ realtimeDate, setRealtimeDate, currentView }) => {
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const handleConfirm = (newDate: Date) => {
    setRealtimeDate(newDate);
  }

  return (
    <>
      <header className="bg-primary text-header-text p-2 flex justify-between items-center w-full h-[5vh] shadow-md z-40">
        <div 
          className="font-bold font-helvetica cursor-pointer px-2 text-base md:text-xl"
          onClick={() => setPickerMode('date')}>
          {formatDate(realtimeDate)}
        </div>
        <div className="flex items-center space-x-2">
          {currentView === View.DASHBOARD && (
            <button onClick={() => setIsInfoModalOpen(true)} className="p-1 rounded-full" aria-label="Informasi Aplikasi">
                <InformationCircleIcon className="w-6 h-6 md:w-7 md:h-7" />
            </button>
          )}
          <div 
            className="font-bold font-helvetica cursor-pointer px-2 text-base md:text-xl"
            onClick={() => setPickerMode('time')}>
            {formatTime(realtimeDate)}
          </div>
        </div>
      </header>
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} currentView={View.DASHBOARD} />
      {pickerMode && (
        <DateTimePicker 
          mode={pickerMode}
          initialValue={realtimeDate}
          onClose={() => setPickerMode(null)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
};

export default RealtimeHeader;
