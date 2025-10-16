
import React, { useState, useEffect } from 'react';
import type { ClassInstance, User } from '../types';
import { View } from '../types';
import { formatFullDate, formatShortTime, D_BUILDING_MAP, F_BUILDING_MAP } from '../constants';
import XMarkIcon from './icons/XMarkIcon';
import ClassStatusIcon from './ClassStatusIcon';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import ConfirmationModal from './modals/ConfirmationModal';
import RestoreIcon from './icons/RestoreIcon';
import { useTheme } from '../ThemeContext';
import InformationCircleIcon from './icons/InformationCircleIcon';
import InfoModal from './modals/InfoModal';

interface ClassDetailViewProps {
  user: User;
  classData: ClassInstance;
  onClose: () => void;
  archiveClass: (classId: string) => void;
  restoreClass: (classId: string) => void;
  isArchived: boolean;
}

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="mb-8">
        <p className="font-bold text-lg md:text-xl">{label}</p>
        <div className="pl-4">{children}</div>
    </div>
);

const ClassDetailView: React.FC<ClassDetailViewProps> = ({ user, classData, onClose, archiveClass, restoreClass, isArchived }) => {
    const [isRoomHighlighted, setIsRoomHighlighted] = useState(true);
    const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const { isDarkMode } = useTheme();
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsRoomHighlighted(prev => !prev);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const building = classData.location.toUpperCase().startsWith('D') ? 'D' : 'F';
    const map = building === 'D' ? D_BUILDING_MAP : F_BUILDING_MAP;
    
    const handleConfirmArchive = () => {
        archiveClass(classData.$id);
        setIsArchiveConfirmOpen(false);
    };

    const handleConfirmRestore = () => {
        restoreClass(classData.$id);
        setIsRestoreConfirmOpen(false);
    };

    const borderColorClass = isDarkMode ? 'border-text/50' : 'border-black/50';
    
  return (
    <div className="w-full h-full flex flex-col bg-card text-text">
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} currentView={View.CLASS_DETAIL} />
      <ConfirmationModal
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={handleConfirmArchive}
        title={
            <span>
                Arsip kelas <strong className="font-bold">{classData.name}</strong>?
            </span>
        }
      />
      <ConfirmationModal
        isOpen={isRestoreConfirmOpen}
        onClose={() => setIsRestoreConfirmOpen(false)}
        onConfirm={handleConfirmRestore}
        title={
            <span>
                Pulihkan kelas <strong className="font-bold">{classData.name}</strong>?
            </span>
        }
      />
      <header className="bg-secondary p-4 shadow-md z-10 grid grid-cols-3 items-center text-text">
        <div className="justify-self-start">
            {isArchived ? (
                <button onClick={() => setIsRestoreConfirmOpen(true)} aria-label="Pulihkan Kelas">
                    <RestoreIcon className="w-7 h-7 md:w-8 md:h-8" />
                </button>
            ) : (
                <button onClick={() => setIsArchiveConfirmOpen(true)} aria-label="Arsip Kelas">
                    <ArchiveBoxIcon className="w-7 h-7 md:w-8 md:h-8" />
                </button>
            )}
        </div>
        <h1 
            onClick={() => setIsInfoModalOpen(true)}
            className="font-bold text-xl md:text-2xl justify-self-center text-center whitespace-nowrap overflow-hidden text-ellipsis w-full cursor-pointer title-hover-underline"
            role="button"
            aria-label="Informasi Detail Kelas"
        >
            {classData.name}
        </h1>
        <div className="justify-self-end">
            <button onClick={onClose} aria-label="Tutup Detail Kelas">
              <XMarkIcon className="w-7 h-7 md:w-8 md:h-8" />
            </button>
        </div>
      </header>
      <main className="flex-grow p-6 overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-start mb-8">
            <p className="font-bold text-lg md:text-xl">Status</p>
            <div className="text-right">
                <ClassStatusIcon status={classData.status} withLabel size="lg"/>
            </div>
        </div>

        <div className="flex justify-between items-start mb-8">
            <p className="font-bold text-lg md:text-xl">Kategori Kelas</p>
            <p className="text-sm md:text-base font-normal text-right max-w-[60%]">
                {(() => {
                    const types = classData.classTypes;
                    const numTypes = types.length;

                    if (user.role === 'student') {
                        if (numTypes === 0) return null;
                        if (numTypes === 1) return <span className={types[0] === user.classType ? 'font-bold' : ''}>{types[0]}</span>;
                        
                        return types.map((type, index) => {
                            const isUserClass = type === user.classType;
                            let separator = '';
                            if (index < numTypes - 2) {
                                separator = ', ';
                            } else if (index === numTypes - 2) {
                                separator = ' dan ';
                            }

                            return (
                                <React.Fragment key={type}>
                                    <span className={isUserClass ? 'font-bold' : ''}>{type}</span>
                                    <span>{separator}</span>
                                </React.Fragment>
                            );
                        });
                    }
                    
                    // Fallback for lecturer or single class
                    return types.join(', ');
                })()}
            </p>
        </div>
        
        <div className="flex justify-between items-center mb-8">
            <p className="font-bold text-lg md:text-xl">Tanggal Kelas</p>
            <p className="text-sm md:text-base">{formatFullDate(classData.start)}</p>
        </div>

        <div className="flex justify-between items-center mb-8">
            <p className="font-bold text-lg md:text-xl">Jam Kelas</p>
            <p className="text-sm md:text-base">{`${formatShortTime(classData.start)} - ${formatShortTime(classData.end)}`}</p>
        </div>

        <div className="mb-8">
             <div className="flex justify-between items-center mb-4">
                <p className="font-bold text-lg md:text-xl">Ruang Kelas</p>
                <p className="text-sm md:text-base">{classData.location.toUpperCase()}</p>
            </div>
            <div className="w-full flex justify-center">
                <div className="w-full md:w-1/2">
                    <p className="font-bold text-center mb-2 md:text-lg">Gedung {building}</p>
                    <div className={`grid ${building === 'D' ? 'grid-cols-4' : 'grid-cols-2'} gap-1`}>
                        {map.flat().map(room => (
                            <div key={room} className={`border ${borderColorClass} p-4 text-sm md:text-base font-semibold transition-colors duration-1000 flex items-center justify-center ${classData.location.toUpperCase() === room && isRoomHighlighted ? `bg-primary text-header-text` : 'bg-card text-text'}`}>
                                {room}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        
        <DetailRow label="Catatan">
            <p className="text-sm md:text-base italic text-text-secondary">{classData.note || "Tidak ada catatan."}</p>
        </DetailRow>

        <DetailRow label="Dosen Pengampu">
            <ul className="list-disc list-inside">
                {classData.lecturers.map(lecturer => (
                    <li key={lecturer} className="text-sm md:text-base">{lecturer}</li>
                ))}
            </ul>
        </DetailRow>

      </main>
    </div>
  );
};

export default ClassDetailView;