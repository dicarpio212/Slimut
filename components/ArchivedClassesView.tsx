

import React, { useState, useRef, useEffect } from 'react';
import type { ClassInstance, User } from '../types';
import { View } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import MobileClassCard from './MobileClassCard';
import DesktopClassCard from './DesktopClassCard';
import RestoreIcon from './icons/RestoreIcon';
import ConfirmationModal from './modals/ConfirmationModal';
import TrashIcon from './icons/TrashIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import InfoModal from './modals/InfoModal';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import Square4GridIcon from './icons/Square4GridIcon';
import XMarkCircleIcon from './icons/XMarkCircleIcon';

interface ArchivedClassesViewProps {
  user: User;
  setView: (view: View) => void;
  archivedClasses: ClassInstance[];
  setSelectedClass: (cls: ClassInstance | null) => void;
  setPreviousView: (view: View) => void;
  restoreClass: (classId: string) => void;
  deleteArchivedClass: (classId: string) => void;
  allUsers: User[];
  isSelectionModeActive: boolean;
  setIsSelectionModeActive: (isActive: boolean) => void;
  selectedClassIds: Set<string>;
  toggleSelectedClass: (classId: string) => void;
  clearSelectedClasses: () => void;
  restoreSelectedClasses: () => void;
  deleteSelectedArchivedClasses: () => void;
  setSelectedClassIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const ArchivedClassesView: React.FC<ArchivedClassesViewProps> = ({ user, setView, archivedClasses, setSelectedClass, setPreviousView, restoreClass, deleteArchivedClass, allUsers, isSelectionModeActive, setIsSelectionModeActive, selectedClassIds, toggleSelectedClass, clearSelectedClasses, restoreSelectedClasses, deleteSelectedArchivedClasses, setSelectedClassIds }) => {
    const [contextMenu, setContextMenu] = useState<{ cursorX: number, cursorY: number, visible: boolean, classInstance: ClassInstance | null }>({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ opacity: 0, position: 'absolute' });
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const [classToRestore, setClassToRestore] = useState<ClassInstance | null>(null);
    const [classToDelete, setClassToDelete] = useState<ClassInstance | null>(null);
    const [exitAnimation, setExitAnimation] = useState(new Map<string, 'collapse' | 'delete' | 'restore'>());
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<'restore' | 'delete' | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setContextMenu({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [contextMenu.visible]);
    
    useEffect(() => {
        if (contextMenu.visible && contextMenuRef.current) {
            const menu = contextMenuRef.current;
            const menuWidth = menu.offsetWidth;
            const menuHeight = menu.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            let x = contextMenu.cursorX;
            let y = contextMenu.cursorY;

            if (x + menuWidth > windowWidth) {
                x = contextMenu.cursorX - menuWidth;
            }
            if (y + menuHeight > windowHeight) {
                y = contextMenu.cursorY - menuHeight;
            }
            if (x < 0) x = 5;
            if (y < 0) y = 5;
            
            setMenuStyle({
                position: 'fixed',
                top: `${y}px`,
                left: `${x}px`,
                opacity: 1,
            });
        }
    }, [contextMenu]);
    
    const handleBackToDashboard = () => {
        setView(View.DASHBOARD);
    };

    const handleClassCardClick = (cls: ClassInstance) => {
        if (isSelectionModeActive) {
            toggleSelectedClass(cls.$id);
        } else {
            setSelectedClass(cls);
            setPreviousView(View.ARCHIVED_CLASSES);
            setView(View.CLASS_DETAIL);
        }
    };

    const sortedClasses = React.useMemo(() => 
        [...archivedClasses].sort((a,b) => b.start.getTime() - a.start.getTime()), 
    [archivedClasses]);

    const handleShowContextMenu = (e: React.MouseEvent | React.TouchEvent, cls: ClassInstance) => {
        e.preventDefault();
        e.stopPropagation();

        if (isSelectionModeActive) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setMenuStyle({ opacity: 0, position: 'fixed' }); 
        setContextMenu({ cursorX: clientX, cursorY: clientY, visible: true, classInstance: cls });
    };

    const handleSelectRequest = () => {
        if (contextMenu.classInstance) {
            setIsSelectionModeActive(true);
            toggleSelectedClass(contextMenu.classInstance.$id);
        }
        setContextMenu({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
    };

    const handleRestoreRequest = () => {
        if (contextMenu.classInstance) {
            setClassToRestore(contextMenu.classInstance);
        }
        setContextMenu({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
    };

    const handleRestoreConfirm = () => {
        if (classToRestore) {
            const classId = classToRestore.$id;
            setClassToRestore(null);
            setExitAnimation(prev => new Map(prev).set(classId, 'restore'));
            setTimeout(() => {
                restoreClass(classId);
            }, 200);
        }
    };

    const handleDeleteRequest = () => {
        if (contextMenu.classInstance) {
            setClassToDelete(contextMenu.classInstance);
        }
        setContextMenu({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
    };

    const handleDeleteConfirm = () => {
        if (classToDelete) {
            const classId = classToDelete.$id;
            setClassToDelete(null);
            setExitAnimation(prev => new Map(prev).set(classId, 'delete'));
            setTimeout(() => {
                deleteArchivedClass(classId);
            }, 200);
        }
    };

    const handleSelectAll = () => {
        const allVisibleIds = sortedClasses.map(cls => cls.$id);
        const areAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedClassIds.has(id));

        if (areAllSelected) {
            setSelectedClassIds(new Set());
        } else {
            setSelectedClassIds(new Set(allVisibleIds));
        }
    };

    const handleMultiActionConfirm = () => {
        if (!actionToConfirm) return;
        const action = actionToConfirm;
        
        const animationType = action === 'delete' ? 'delete' : 'restore';
        setExitAnimation(prev => {
            const newMap = new Map(prev);
            selectedClassIds.forEach(id => newMap.set(id, animationType));
            return newMap;
        });

        setActionToConfirm(null);

        setTimeout(() => {
            if (action === 'restore') restoreSelectedClasses();
            else if (action === 'delete') deleteSelectedArchivedClasses();
        }, 200);
    };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} currentView={View.ARCHIVED_CLASSES} />
      {contextMenu.visible && <div className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden backdrop-blur-sm"></div>}
      {contextMenu.visible && (
        <div
            ref={contextMenuRef}
            style={menuStyle}
            className="absolute bg-card text-text rounded-md shadow-lg z-50 py-1 animate-dropdown"
        >
            <button 
                onClick={handleSelectRequest}
                className="flex items-center w-full px-4 py-2 text-left text-sm hover:bg-black/10 whitespace-nowrap"
            >
                <CheckBadgeIcon className="w-5 h-5 mr-3" />
                <span>Pilih kelas</span>
            </button>
            <button 
                onClick={handleRestoreRequest}
                className="flex items-center w-full px-4 py-2 text-left text-sm hover:bg-black/10 whitespace-nowrap"
            >
                <RestoreIcon className="w-5 h-5 mr-3" />
                <span>Pulihkan kelas</span>
            </button>
            <button
                onClick={handleDeleteRequest}
                className="flex items-center w-full px-4 py-2 text-left text-sm hover:bg-black/10 whitespace-nowrap"
              >
                  <TrashIcon className="w-5 h-5 mr-3" />
                  <span>Hapus kelas</span>
              </button>
        </div>
      )}
      <ConfirmationModal
        isOpen={!!classToRestore}
        onClose={() => setClassToRestore(null)}
        onConfirm={handleRestoreConfirm}
        title={
            <span>
                Pulihkan kelas <strong className="font-bold">{classToRestore?.name}</strong>?
            </span>
        }
      />
      <ConfirmationModal
            isOpen={!!classToDelete}
            onClose={() => setClassToDelete(null)}
            onConfirm={handleDeleteConfirm}
            title={
                <span>
                    Hapus kelas <strong className="font-bold">{classToDelete?.name}</strong> secara permanen?
                </span>
            }
        />
        <ConfirmationModal
            isOpen={actionToConfirm === 'restore'}
            onClose={() => setActionToConfirm(null)}
            onConfirm={handleMultiActionConfirm}
            title={<span>Pulihkan <strong className="font-bold">{selectedClassIds.size}</strong> kelas terpilih?</span>}
        />
        <ConfirmationModal
            isOpen={actionToConfirm === 'delete'}
            onClose={() => setActionToConfirm(null)}
            onConfirm={handleMultiActionConfirm}
            title={<span>Hapus <strong className="font-bold">{selectedClassIds.size}</strong> kelas terpilih secara permanen?</span>}
        />
      {/* Header */}
      <header className="bg-secondary p-4 shadow-md z-10 grid grid-cols-3 items-center text-text">
        {isSelectionModeActive ? (
             <div className="w-full flex justify-around items-center text-text col-span-3">
                <button onClick={() => setActionToConfirm('restore')} className="flex flex-col items-center disabled:opacity-50" disabled={selectedClassIds.size === 0}>
                    <RestoreIcon className="w-7 h-7" />
                    <span className="text-xs mt-1">Pulihkan</span>
                </button>
                <button onClick={() => setActionToConfirm('delete')} className="flex flex-col items-center disabled:opacity-50" disabled={selectedClassIds.size === 0}>
                    <TrashIcon className="w-7 h-7" />
                    <span className="text-xs mt-1">Hapus</span>
                </button>
                <button onClick={handleSelectAll} className="flex flex-col items-center text-text disabled:opacity-50" disabled={sortedClasses.length === 0}>
                    <Square4GridIcon className="w-7 h-7" />
                    <span className="text-xs mt-1">Pilih Semua</span>
                </button>
                <button onClick={clearSelectedClasses} className="flex flex-col items-center text-text">
                    <XMarkCircleIcon className="w-7 h-7" />
                    <span className="text-xs mt-1">Batal Pilih</span>
                </button>
            </div>
        ) : (
            <>
                <div className="justify-self-start">
                    <div className="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <h1 
                    onClick={() => setIsInfoModalOpen(true)}
                    className="font-bold text-xl md:text-2xl justify-self-center cursor-pointer title-hover-underline"
                    role="button"
                    aria-label="Informasi Arsip"
                >
                    Arsip Kelas
                </h1>
                <div className="justify-self-end">
                    <button onClick={handleBackToDashboard} aria-label="Tutup Arsip">
                        <XMarkIcon className="w-7 h-7 md:w-8 md:h-8" />
                    </button>
                </div>
            </>
        )}
      </header>

      {/* Content */}
      <main className="flex-grow p-4 lg:p-6 overflow-y-auto no-scrollbar">
        {sortedClasses.length === 0 ? (
            <div className="text-center text-text-secondary mt-10 md:text-lg">
                <p>Tidak ada kelas yang diarsipkan.</p>
            </div>
        ) : (
           <>
                {/* Mobile/Tablet View */}
                <div className="lg:hidden">
                    {sortedClasses.map((cls) => (
                        <MobileClassCard 
                            key={cls.$id} 
                            cls={cls} 
                            onSelect={() => handleClassCardClick(cls)}
                            onShowContextMenu={handleShowContextMenu}
                            exitAnimationType={exitAnimation.get(cls.$id)}
                            isHighlighted={contextMenu.visible && contextMenu.classInstance?.$id === cls.$id}
                            isSelected={selectedClassIds.has(cls.$id)}
                        />
                    ))}
                </div>

                {/* Desktop View */}
                <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {sortedClasses.map((cls) => {
                        const lecturer = allUsers.find(u => u.name === cls.lecturers[0]);
                        const lecturerProfilePic = lecturer ? lecturer.profilePic : null;
                        return (
                            <DesktopClassCard 
                                key={cls.$id} 
                                cls={cls} 
                                onSelect={() => handleClassCardClick(cls)}
                                userRole={user.role}
                                onContextMenu={(e) => handleShowContextMenu(e, cls)}
                                exitAnimationType={exitAnimation.get(cls.$id)}
                                lecturerProfilePic={lecturerProfilePic}
                                isSelected={selectedClassIds.has(cls.$id)}
                            />
                        )
                    })}
                </div>
           </>
        )}
      </main>
    </div>
  );
};

export default ArchivedClassesView;