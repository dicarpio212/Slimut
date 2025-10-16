
import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { ClassInstance, User } from '../types';
import { View, ClassStatus } from '../types';
import { formatFullDate, formatShortTime, getStatusColor } from '../constants';
import XMarkIcon from './icons/XMarkIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ClassStatusIcon from './ClassStatusIcon';
import DesktopClassCard from './DesktopClassCard';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import ConfirmationModal from './modals/ConfirmationModal';
import TrashIcon from './icons/TrashIcon';
import PencilIcon from './icons/PencilIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import InfoModal from './modals/InfoModal';
import ChevronDownSimpleIcon from './icons/ChevronDownSimpleIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import Square4GridIcon from './icons/Square4GridIcon';
import XMarkCircleIcon from './icons/XMarkCircleIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface CalendarViewProps {
  user: User;
  allUsers: User[];
  setView: (view: View) => void;
  allClasses: ClassInstance[];
  realtimeDate: Date;
  setSelectedClass: (cls: ClassInstance | null) => void;
  setPreviousView: (view: View) => void;
  displayDate: Date | null;
  setDisplayDate: React.Dispatch<React.SetStateAction<Date | null>>;
  selectedDate: Date | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>;
  archiveClass: (classId: string) => void;
  deleteClass: (classId: string) => void;
  cancelClass: (classId: string) => void;
  isSelectionModeActive: boolean;
  setIsSelectionModeActive: (isActive: boolean) => void;
  selectedClassIds: Set<string>;
  toggleSelectedClass: (classId: string) => void;
  clearSelectedClasses: () => void;
  archiveSelectedClasses: () => void;
  deleteSelectedClasses: () => void;
  cancelSelectedClasses: () => void;
  setSelectedClassIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  user,
  allUsers,
  setView, 
  allClasses, 
  realtimeDate, 
  setSelectedClass, 
  setPreviousView,
  displayDate,
  setDisplayDate,
  selectedDate,
  setSelectedDate,
  archiveClass,
  deleteClass,
  cancelClass,
  isSelectionModeActive,
  setIsSelectionModeActive,
  selectedClassIds,
  toggleSelectedClass,
  clearSelectedClasses,
  archiveSelectedClasses,
  deleteSelectedClasses,
  cancelSelectedClasses,
  setSelectedClassIds,
}) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const dateToDisplayRef = useRef<Date | null>(selectedDate);
  const [contextMenu, setContextMenu] = useState<{ cursorX: number, cursorY: number, visible: boolean, classInstance: ClassInstance | null }>({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ opacity: 0, position: 'absolute' });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [classToArchive, setClassToArchive] = useState<ClassInstance | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassInstance | null>(null);
  const [classToCancel, setClassToCancel] = useState<ClassInstance | null>(null);
  const [exitAnimation, setExitAnimation] = useState(new Map<string, 'collapse' | 'delete'>());
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<'archive' | 'delete' | 'cancel' | null>(null);

  if (selectedDate) {
      dateToDisplayRef.current = selectedDate;
  }
  
  const effectiveDisplayDate = displayDate || realtimeDate;

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

        if (x + menuWidth > windowWidth) x = contextMenu.cursorX - menuWidth;
        if (y + menuHeight > windowHeight) y = contextMenu.cursorY - menuHeight;
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

  const changeMonth = (delta: number) => {
    setDisplayDate(prev => {
      const newDate = new Date(prev || realtimeDate);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  const handleDayClick = (day: number) => {
      if (isSelectionModeActive) return;
      const newSelectedDate = new Date(effectiveDisplayDate.getFullYear(), effectiveDisplayDate.getMonth(), day);
      if (selectedDate && selectedDate.getTime() === newSelectedDate.getTime()) {
        setIsAnimatingOut(true);
        setTimeout(() => {
            setSelectedDate(null);
            setIsAnimatingOut(false);
        }, 375);
      } else {
        setSelectedDate(newSelectedDate);
      }
  }

  const handleClassCardClick = (cls: ClassInstance) => {
    if (isSelectionModeActive) {
        toggleSelectedClass(cls.$id);
    } else {
        setSelectedClass(cls);
        setPreviousView(View.CALENDAR);
        setView(View.CLASS_DETAIL);
    }
  };
  
  const calendarGrid = useMemo(() => {
    const year = effectiveDisplayDate.getFullYear();
    const month = effectiveDisplayDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid = [];
    let day = 1;
    for (let i = 0; i < 6; i++) {
        const week = [];
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
                const prevMonthDays = new Date(year, month, 0).getDate();
                week.push({ day: prevMonthDays - firstDay + j + 1, isCurrentMonth: false });
            } else if (day > daysInMonth) {
                week.push({ day: day - daysInMonth, isCurrentMonth: false });
                day++;
            } else {
                week.push({ day, isCurrentMonth: true });
                day++;
            }
        }
        grid.push(week);
        if (day > daysInMonth && grid.length * 7 >= daysInMonth + firstDay) break;
    }
    return grid;
  }, [effectiveDisplayDate]);

  const dateForDetails = selectedDate || (isAnimatingOut ? dateToDisplayRef.current : null);

  const selectedDateClasses = useMemo(() => {
      if (!dateForDetails) return [];
      return allClasses.filter(cls => {
          const classDate = new Date(cls.start);
          return classDate.getFullYear() === dateForDetails.getFullYear() &&
                 classDate.getMonth() === dateForDetails.getMonth() &&
                 classDate.getDate() === dateForDetails.getDate();
      }).sort((a,b) => a.start.getTime() - b.start.getTime());
  }, [dateForDetails, allClasses]);

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

  const handleArchiveRequest = () => {
    if (contextMenu.classInstance) setClassToArchive(contextMenu.classInstance);
    setContextMenu({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
  };

  const handleEditRequest = () => {
    if (contextMenu.classInstance) {
        setSelectedClass(contextMenu.classInstance);
        setPreviousView(View.CALENDAR);
        setView(View.EDIT_CLASS);
    }
    setContextMenu({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
  };

  const handleArchiveConfirm = () => {
    if (classToArchive) {
        const isLastClassOnDay = selectedDateClasses.length === 1;
        const classToAnimate = classToArchive;
        setClassToArchive(null);

        setExitAnimation(prev => new Map(prev).set(classToAnimate.$id, 'collapse'));

        setTimeout(() => {
            archiveClass(classToAnimate.$id);
            if (isLastClassOnDay) {
              handleDayClick(classToAnimate.start.getDate());
            }
        }, 200);
    }
  };

  const handleDeleteRequest = () => {
    if (contextMenu.classInstance) setClassToDelete(contextMenu.classInstance);
    setContextMenu({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
  };

  const handleDeleteConfirm = () => {
    if (classToDelete) {
        const isLastClassOnDay = selectedDateClasses.length === 1;
        const classToAnimate = classToDelete;
        setClassToDelete(null);

        setExitAnimation(prev => new Map(prev).set(classToAnimate.$id, 'delete'));

        setTimeout(() => {
            deleteClass(classToAnimate.$id);
            if (isLastClassOnDay) {
              handleDayClick(classToAnimate.start.getDate());
            }
        }, 200);
    }
  };
  
    const handleCancelRequest = () => {
        if (contextMenu.classInstance) {
            setClassToCancel(contextMenu.classInstance);
        }
        setContextMenu({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
    };

    const handleCancelConfirm = () => {
        if (classToCancel) {
            cancelClass(classToCancel.$id);
            setClassToCancel(null);
        }
    };

  const handleSelectAll = () => {
      const allVisibleIds = selectedDateClasses.map(cls => cls.$id);
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
        const isLastBatchOnDay = selectedDateClasses.length === selectedClassIds.size;
        const dateToClose = selectedDate;
        setActionToConfirm(null);

        if (action === 'cancel') {
            cancelSelectedClasses();
            if (isLastBatchOnDay && dateToClose) {
                handleDayClick(dateToClose.getDate());
            }
            return;
        }

        const animationType = action === 'delete' ? 'delete' : 'collapse';
        setExitAnimation(prev => {
            const newMap = new Map(prev);
            selectedClassIds.forEach(id => newMap.set(id, animationType));
            return newMap;
        });

        setTimeout(() => {
            if (action === 'archive') archiveSelectedClasses();
            else if (action === 'delete') deleteSelectedClasses();
            
            if (isLastBatchOnDay && dateToClose) {
                handleDayClick(dateToClose.getDate());
            }
        }, 200);
    };

  return (
    <div className="w-full h-full flex flex-col bg-background text-text">
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} currentView={View.CALENDAR} />
      {contextMenu.visible && <div className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden backdrop-blur-sm"></div>}
      {contextMenu.visible && (
        <div ref={contextMenuRef} style={menuStyle} className="absolute bg-card rounded-md shadow-lg z-50 py-1 animate-dropdown">
            <button onClick={handleSelectRequest} className="flex items-center w-full px-4 py-2 text-left text-sm text-text hover:bg-black/10 whitespace-nowrap">
                <CheckBadgeIcon className="w-5 h-5 mr-3" />
                <span>Pilih kelas</span>
            </button>
            <button onClick={handleArchiveRequest} className="flex items-center w-full px-4 py-2 text-left text-sm text-text hover:bg-black/10 whitespace-nowrap">
                <ArchiveBoxIcon className="w-5 h-5 mr-3" />
                <span>Arsip kelas</span>
            </button>
            {user.role === 'lecturer' && contextMenu.classInstance?.status !== ClassStatus.Selesai && contextMenu.classInstance?.status !== ClassStatus.Batal && (
                <button onClick={handleEditRequest} className="flex items-center w-full px-4 py-2 text-left text-sm text-text hover:bg-black/10 whitespace-nowrap">
                    <PencilIcon className="w-5 h-5 mr-3" />
                    <span>Edit kelas</span>
                </button>
            )}
            {user.role === 'lecturer' && contextMenu.classInstance?.status !== ClassStatus.Selesai && contextMenu.classInstance?.status !== ClassStatus.Batal && (
                <button 
                    onClick={handleCancelRequest}
                    className="flex items-center w-full px-4 py-2 text-left text-sm hover:bg-black/10 whitespace-nowrap"
                >
                    <XMarkIcon className="w-5 h-5 mr-3" />
                    <span>Batalkan kelas</span>
                </button>
            )}
            <button onClick={handleDeleteRequest} className="flex items-center w-full px-4 py-2 text-left text-sm text-text hover:bg-black/10 whitespace-nowrap">
                <TrashIcon className="w-5 h-5 mr-3" />
                <span>Hapus kelas</span>
            </button>
        </div>
      )}
      <ConfirmationModal isOpen={!!classToArchive} onClose={() => setClassToArchive(null)} onConfirm={handleArchiveConfirm}
        title={<span>Arsip kelas <strong className="font-bold">{classToArchive?.name}</strong>?</span>}
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
        isOpen={!!classToCancel}
        onClose={() => setClassToCancel(null)}
        onConfirm={handleCancelConfirm}
        title={
            <span>
                Batalkan kelas <strong className="font-bold">{classToCancel?.name}</strong>?
            </span>
        }
      />
       <ConfirmationModal
        isOpen={actionToConfirm === 'archive'}
        onClose={() => setActionToConfirm(null)}
        onConfirm={handleMultiActionConfirm}
        title={<span>Arsipkan <strong className="font-bold">{selectedClassIds.size}</strong> kelas terpilih?</span>}
      />
      <ConfirmationModal
        isOpen={actionToConfirm === 'delete'}
        onClose={() => setActionToConfirm(null)}
        onConfirm={handleMultiActionConfirm}
        title={<span>Hapus <strong className="font-bold">{selectedClassIds.size}</strong> kelas terpilih?</span>}
      />
       <ConfirmationModal
        isOpen={actionToConfirm === 'cancel'}
        onClose={() => setActionToConfirm(null)}
        onConfirm={handleMultiActionConfirm}
        title={<span>Batalkan <strong className="font-bold">{selectedClassIds.size}</strong> kelas terpilih?</span>}
      />

      <header className="bg-secondary p-4 shadow-md z-10 grid grid-cols-3 items-center text-text">
        {isSelectionModeActive ? (
            <div className="w-full flex justify-around items-center text-text col-span-3">
                <button onClick={() => setActionToConfirm('archive')} className="flex flex-col items-center disabled:opacity-50" disabled={selectedClassIds.size === 0}>
                    <ArchiveBoxIcon className="w-7 h-7" />
                    <span className="text-xs mt-1">Arsip</span>
                </button>
                {user.role === 'lecturer' && (
                    <button onClick={() => setActionToConfirm('cancel')} className="flex flex-col items-center disabled:opacity-50" disabled={selectedClassIds.size === 0}>
                        <XMarkIcon className="w-7 h-7" />
                        <span className="text-xs mt-1">Batalkan</span>
                    </button>
                )}
                <button onClick={() => setActionToConfirm('delete')} className="flex flex-col items-center disabled:opacity-50" disabled={selectedClassIds.size === 0}>
                    <TrashIcon className="w-7 h-7" />
                    <span className="text-xs mt-1">Hapus</span>
                </button>
                <button onClick={handleSelectAll} className="flex flex-col items-center text-text disabled:opacity-50" disabled={selectedDateClasses.length === 0}>
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
                    aria-label="Informasi Kalender"
                >
                    Kalender
                </h1>
                <div className="justify-self-end">
                    <button onClick={() => setView(View.DASHBOARD)} aria-label="Tutup Kalender">
                      <XMarkIcon className="w-7 h-7 md:w-8 md:h-8" />
                    </button>
                </div>
            </>
        )}
      </header>

      <main className="flex-grow p-4 flex flex-col overflow-hidden">
        <div className="w-full flex-grow flex flex-col gap-4 lg:flex-row lg:relative lg:gap-0">
          
            <div className={`bg-card rounded-lg shadow-md p-4 flex flex-col flex-shrink-0
              lg:absolute lg:top-0 lg:h-full lg:w-[calc(50%-0.5rem)] lg:transition-all lg:duration-[375ms] lg:ease-in-out lg:z-10
              ${(selectedDate && !isAnimatingOut) ? 'lg:left-0' : 'lg:left-1/2 lg:-translate-x-1/2'}`}
            >
                <div className="flex justify-between items-center mb-4 px-2">
                    <button onClick={() => changeMonth(-1)}><ChevronLeftIcon className="w-6 h-6 md:w-7 md:h-7" /></button>
                    <h2 className="font-bold text-lg md:text-2xl">{effectiveDisplayDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => changeMonth(1)}><ChevronRightIcon className="w-6 h-6 md:w-7 md:h-7" /></button>
                </div>
                <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center text-sm md:text-base flex-grow">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => <div key={day} className="font-bold p-2 text-text-secondary">{day}</div>)}
                    {calendarGrid.flat().map((cell, i) => {
                        const cellDate = new Date(effectiveDisplayDate.getFullYear(), effectiveDisplayDate.getMonth(), cell.day);
                        const classesOnDay = cell.isCurrentMonth ? allClasses.filter(cls => {
                            const classDate = new Date(cls.start);
                            return classDate.getFullYear() === cellDate.getFullYear() && classDate.getMonth() === cellDate.getMonth() && classDate.getDate() === cellDate.getDate();
                        }) : [];

                        const isToday = cell.isCurrentMonth && cellDate.toDateString() === realtimeDate.toDateString();
                        const isSelected = cell.isCurrentMonth && selectedDate && cellDate.toDateString() === selectedDate.toDateString();
                        
                        return (
                            <div key={i} 
                                 className={`border border-text/20 flex flex-col p-1 transition duration-150 hover:shadow-lg ${isSelectionModeActive ? 'cursor-default' : 'cursor-pointer'} ${!cell.isCurrentMonth ? 'opacity-70' : ''} ${isToday ? 'border-text border-2' : ''} ${isSelected ? `border-primary border-2` : ''}`}
                                 onClick={() => cell.isCurrentMonth && handleDayClick(cell.day)}
                            >
                                <span className={`text-left md:text-lg ${!cell.isCurrentMonth ? 'text-gray-400' : ''}`}>{cell.day}</span>
                                
                                <div className="flex-grow grid grid-cols-3 content-start justify-items-center gap-1 mt-1 lg:hidden">
                                    {classesOnDay.slice(0, 3).map(cls => (
                                        <div key={cls.$id + '-m'}>
                                            <ClassStatusIcon status={cls.status} size="xs" />
                                        </div>
                                    ))}
                                </div>

                                <div className="hidden lg:flex flex-grow items-center justify-center pt-1">
                                    <div className="grid grid-cols-3 gap-[2px] w-full max-w-[42px] aspect-square">
                                        {Array.from({ length: 9 }).map((_, index) => {
                                            const cls = classesOnDay[index];
                                            const color = cls ? getStatusColor(cls.status) : 'transparent';
                                            return (
                                                <div
                                                    key={cls ? cls.$id + '-d' : `empty-${index}`}
                                                    className="w-full aspect-square rounded-sm"
                                                    style={{ backgroundColor: color }}
                                                    title={cls ? `${cls.name} (${cls.status})` : undefined}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={`
                ${selectedDate || isAnimatingOut ? 'flex' : 'hidden'}
                ${isAnimatingOut ? 'animate-slide-up-out' : 'animate-slide-up'}
                bg-card rounded-lg shadow-md p-4 flex-col flex-1 min-h-0
                lg:absolute lg:top-0 lg:h-full lg:w-[calc(50%-0.5rem)] lg:left-1/2 lg:translate-x-[calc(1rem)]
            `}>
                {dateForDetails && (
                    <>
                        <h3 className="font-bold text-lg md:text-xl text-center mb-4 flex-shrink-0">{formatFullDate(dateForDetails)}</h3>
                        <div className="overflow-y-auto no-scrollbar pb-4 max-h-[19vh] md:max-h-none">
                            {selectedDateClasses.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="lg:hidden space-y-2">
                                        {selectedDateClasses.map(cls => {
                                            const handleMenuClick = (e: React.MouseEvent | React.TouchEvent) => {
                                                e.stopPropagation();
                                                handleShowContextMenu(e, cls);
                                            };
                                            const isSelected = selectedClassIds.has(cls.$id);
                                            const exitAnimationType = exitAnimation.get(cls.$id);
                                            const animationClass = exitAnimationType === 'delete' 
                                                ? 'animate-card-exit-left' 
                                                : exitAnimationType === 'collapse' 
                                                ? 'animate-card-exit' 
                                                : '';
                                            return (
                                                <div 
                                                    key={cls.$id}
                                                    className={`relative bg-background rounded-lg p-3 grid grid-cols-12 gap-2 items-center transition duration-200 hover:shadow-lg hover:-translate-y-1 ${!isSelectionModeActive && 'cursor-pointer'} ${animationClass} ${contextMenu.visible && contextMenu.classInstance?.$id === cls.$id ? 'relative z-[49] scale-105 shadow-2xl' : ''} ${isSelected ? 'border-[3px] border-primary' : ''}`}
                                                    onClick={() => handleClassCardClick(cls)}
                                                    onContextMenu={(e) => e.preventDefault()}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 z-10">
                                                            <CheckCircleIcon className="w-8 h-8 text-primary bg-background rounded-full" />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center min-w-0 col-span-10">
                                                        <button
                                                            onClick={handleMenuClick}
                                                            onTouchStart={handleMenuClick}
                                                            className="p-1 -ml-1 mr-2 text-text-secondary hover:text-primary"
                                                            aria-label="Opsi lainnya"
                                                        >
                                                            <ChevronDownSimpleIcon className="w-6 h-6" />
                                                        </button>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-base truncate">{cls.name}</p>
                                                            <p className="text-sm text-text-secondary truncate">{`${formatShortTime(cls.start)} - ${formatShortTime(cls.end)} di ${cls.location}`}</p>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 flex justify-end items-center">
                                                      <ClassStatusIcon status={cls.status} withLabel={true} size="sm-md" />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="hidden lg:grid grid-cols-1 gap-4">
                                        {selectedDateClasses.map(cls => {
                                            const lecturer = allUsers.find(u => u.name === cls.lecturers[0]);
                                            const lecturerProfilePic = lecturer ? lecturer.profilePic : null;
                                            return (
                                                <DesktopClassCard 
                                                  key={cls.$id} 
                                                  cls={cls} 
                                                  onSelect={() => handleClassCardClick(cls)} 
                                                  userRole={user.role}
                                                  minHeight='auto'
                                                  onContextMenu={(e) => handleShowContextMenu(e, cls)}
                                                  exitAnimationType={exitAnimation.get(cls.$id)}
                                                  lecturerProfilePic={lecturerProfilePic}
                                                  isSelected={selectedClassIds.has(cls.$id)}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-text-secondary mt-8">Tidak ada jadwal.</p>
                            )}
                        </div>
                    </>
                )}
            </div>
            
        </div>
      </main>
    </div>
  );
};

export default CalendarView;