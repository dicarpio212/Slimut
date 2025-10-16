
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { ClassInstance, Notification, User } from '../types';
import { View, ClassStatus, TimeFilter, StatusFilter } from '../types';
import { formatFullDate, formatShortTime, getStatusColor, normalizeName } from '../constants';

import SearchIcon from './icons/SearchIcon';
import PaperClipIcon from './icons/PaperClipIcon';
import ClassStatusIcon from './ClassStatusIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import XMarkIcon from './icons/XMarkIcon';
import DesktopClassCard from './DesktopClassCard';
import ClockIcon from './icons/ClockIcon';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import ConfirmationModal from './modals/ConfirmationModal';
import MobileClassCard from './MobileClassCard';
import TrashIcon from './icons/TrashIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import PencilIcon from './icons/PencilIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import Square4GridIcon from './icons/Square4GridIcon';
import XMarkCircleIcon from './icons/XMarkCircleIcon';

interface DashboardProps {
  user: User;
  allUsers: User[];
  onProfileClick: () => void;
  setView: (view: View) => void;
  setSelectedClass: (cls: ClassInstance | null) => void;
  setPreviousView: (view: View) => void;
  allClasses: ClassInstance[];
  realtimeDate: Date;
  notifications: Notification[];
  isSearchActive: boolean;
  setIsSearchActive: (isActive: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  reminder: number | null;
  setReminder: (value: number | null) => void;
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

const FilterButton: React.FC<{label: string, isActive: boolean, onClick: () => void}> = ({label, isActive, onClick}) => (
    <button 
        onClick={onClick}
        className={`px-4 py-1 md:py-2 rounded-full text-sm md:text-base transition-colors duration-200 w-full ${isActive ? 'bg-primary text-header-text font-bold' : 'bg-card text-text'}`}
    >
        {label}
    </button>
);

const FilterDropdown: React.FC<{
  label: string;
  options: string[];
  onSelect: (value: string) => void;
  isActive: boolean;
  isOpen: boolean;
  toggleOpen: () => void;
}> = ({ label, options, onSelect, isActive, isOpen, toggleOpen }) => {
  return (
    <div className="relative w-full">
      <FilterButton label={label} isActive={isActive} onClick={toggleOpen} />
      {isOpen && (
        <div className="absolute top-full mt-2 w-max min-w-full bg-card rounded-md shadow-lg z-20 overflow-hidden animate-dropdown">
          <ul className="text-left">
            {options.map(option => (
              <li
                key={option}
                className="px-4 py-2 text-text md:text-base hover:bg-black/10 cursor-pointer capitalize"
                onClick={() => onSelect(option)}
              >
                {option === 'semua' ? 'Semua' : option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, allUsers, onProfileClick, setView, setSelectedClass, setPreviousView, allClasses, realtimeDate, isSearchActive, setIsSearchActive, searchQuery, setSearchQuery, reminder, setReminder, archiveClass, deleteClass, cancelClass, isSelectionModeActive, setIsSelectionModeActive, selectedClassIds, toggleSelectedClass, clearSelectedClasses, archiveSelectedClasses, deleteSelectedClasses, cancelSelectedClasses, setSelectedClassIds }) => {
    const [timeFilter, setTimeFilter] = useState<TimeFilter>(TimeFilter.Semua);
    const [classFilter, setClassFilter] = useState('semua');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(StatusFilter.Semua);
    const [additionalFilter, setAdditionalFilter] = useState('semua');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const filtersRef = useRef<HTMLDivElement>(null);
    const [isReminderDropdownOpen, setIsReminderDropdownOpen] = useState(false);
    const reminderRef = useRef<HTMLDivElement>(null);
    const [contextMenu, setContextMenu] = useState<{ cursorX: number, cursorY: number, visible: boolean, classInstance: ClassInstance | null }>({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ opacity: 0, position: 'absolute' });
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const [classToArchive, setClassToArchive] = useState<ClassInstance | null>(null);
    const [classToDelete, setClassToDelete] = useState<ClassInstance | null>(null);
    const [classToCancel, setClassToCancel] = useState<ClassInstance | null>(null);
    const [exitAnimation, setExitAnimation] = useState(new Map<string, 'collapse' | 'delete'>());
    const [actionToConfirm, setActionToConfirm] = useState<'archive' | 'delete' | 'cancel' | null>(null);


    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
          setActiveDropdown(null);
        }
        if (reminderRef.current && !reminderRef.current.contains(event.target as Node)) {
          setIsReminderDropdownOpen(false);
        }
        if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
            setContextMenu({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [contextMenu.visible]);
    
    const [periodDate, setPeriodDate] = useState(new Date(realtimeDate));
    
    React.useEffect(() => {
        if(timeFilter === TimeFilter.Semua) {
            setPeriodDate(new Date(realtimeDate));
        }
    }, [realtimeDate, timeFilter]);

    const handleClassCardClick = (cls: ClassInstance) => {
        if (isSelectionModeActive) {
            toggleSelectedClass(cls.$id);
        } else {
            setSelectedClass(cls);
            setPreviousView(View.DASHBOARD);
            setView(View.CLASS_DETAIL);
        }
    };
    
    const filteredClasses = useMemo(() => {
        return allClasses
        .filter(cls => {
            if (searchQuery && !cls.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            if (classFilter !== 'semua' && cls.name !== classFilter) {
                return false;
            }
            if (statusFilter !== StatusFilter.Semua && cls.status !== statusFilter as string) {
                return false;
            }

            if (additionalFilter !== 'semua') {
                if (user.role === 'lecturer') {
                    if (!cls.classTypes.includes(additionalFilter)) return false;
                } else { // student
                    if (!cls.lecturers.some(l => normalizeName(l) === additionalFilter)) return false;
                }
            }
            
            if(timeFilter !== TimeFilter.Semua) {
                 const classDate = new Date(cls.start);
                 classDate.setHours(0,0,0,0);
                 const pDate = new Date(periodDate);
                 pDate.setHours(0,0,0,0);

                if (timeFilter === TimeFilter.Harian) {
                    if (classDate.getTime() !== pDate.getTime()) return false;
                } else if (timeFilter === TimeFilter.Mingguan) {
                    const startOfWeek = new Date(pDate);
                    startOfWeek.setDate(pDate.getDate() - pDate.getDay());
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    if (classDate < startOfWeek || classDate > endOfWeek) return false;
                } else if (timeFilter === TimeFilter.Bulanan) {
                    if (classDate.getFullYear() !== pDate.getFullYear() || classDate.getMonth() !== pDate.getMonth()) return false;
                }
            }

            return true;
        })
        .sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [allClasses, searchQuery, classFilter, statusFilter, additionalFilter, timeFilter, periodDate, user.role]);

    const classNames = useMemo(() => ['semua', ...Array.from(new Set(allClasses.map(c => c.name)))], [allClasses]);
    
    const additionalFilterOptions = useMemo(() => {
        if (user.role === 'lecturer') {
            const types = new Set<string>();
            allClasses.forEach(cls => {
                cls.classTypes.forEach(ct => types.add(ct));
            });
            return ['semua', ...Array.from(types).sort()];
        } else { // student
            const lecturers = new Set<string>();
            allClasses.forEach(cls => {
                cls.lecturers.forEach(lec => lecturers.add(normalizeName(lec)));
            });
            return ['semua', ...Array.from(lecturers).sort()];
        }
    }, [allClasses, user.role]);

    const handlePeriodChange = (delta: number) => {
        const newDate = new Date(periodDate);
        if (timeFilter === TimeFilter.Harian) newDate.setDate(newDate.getDate() + delta);
        else if (timeFilter === TimeFilter.Mingguan) newDate.setDate(newDate.getDate() + delta * 7);
        else if (timeFilter === TimeFilter.Bulanan) newDate.setMonth(newDate.getMonth() + delta);
        setPeriodDate(newDate);
    };

    const handleShowContextMenu = (e: React.MouseEvent | React.TouchEvent, cls: ClassInstance) => {
        e.preventDefault();
        e.stopPropagation();

        if (isSelectionModeActive) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        setMenuStyle({ opacity: 0, position: 'fixed' }); 
        setContextMenu({ cursorX: clientX, cursorY: clientY, visible: true, classInstance: cls });
    };

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

    const handleSelectRequest = () => {
        if (contextMenu.classInstance) {
            setIsSelectionModeActive(true);
            toggleSelectedClass(contextMenu.classInstance.$id);
        }
        setContextMenu({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
    };
    
    const handleArchiveRequest = () => {
        if (contextMenu.classInstance) {
            setClassToArchive(contextMenu.classInstance);
        }
        setContextMenu({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
    };

    const handleEditRequest = () => {
        if (contextMenu.classInstance) {
            setSelectedClass(contextMenu.classInstance);
            setPreviousView(View.DASHBOARD);
            setView(View.EDIT_CLASS);
        }
        setContextMenu({ cursorX: 0, cursorY: 0, visible: false, classInstance: null });
    };

    const handleArchiveConfirm = () => {
        if (classToArchive) {
            const classId = classToArchive.$id;
            setClassToArchive(null);
            setExitAnimation(prev => new Map(prev).set(classId, 'collapse'));
            setTimeout(() => {
                archiveClass(classId);
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
                deleteClass(classId);
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
        const allVisibleIds = filteredClasses.map(cls => cls.$id);
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
        setActionToConfirm(null);

        if (action === 'cancel') {
            cancelSelectedClasses();
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
        }, 200);
    };


    const renderPeriodDisplay = () => {
        if (timeFilter === TimeFilter.Semua) {
            return <div className="bg-secondary text-text font-bold py-2 px-4 rounded-lg text-center md:text-lg">Semua periode</div>;
        }

        let displayString = '';
        if (timeFilter === TimeFilter.Harian) {
            displayString = periodDate.toLocaleDateString('id-ID');
        } else if (timeFilter === TimeFilter.Mingguan) {
            const startOfWeek = new Date(periodDate);
            startOfWeek.setDate(periodDate.getDate() - periodDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            displayString = `${startOfWeek.toLocaleDateString('id-ID')} - ${endOfWeek.toLocaleDateString('id-ID')}`;
        } else if (timeFilter === TimeFilter.Bulanan) {
            const startOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
            const endOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0);
            displayString = `${startOfMonth.toLocaleDateString('id-ID')} - ${endOfMonth.toLocaleDateString('id-ID')}`;
        }

        return (
             <div className="bg-secondary text-text font-bold py-2 px-4 rounded-lg text-center flex items-center justify-between md:text-lg">
                <button onClick={() => handlePeriodChange(-1)}><ChevronLeftIcon className="w-5 h-5 md:w-6 md:h-6" /></button>
                <span>{displayString}</span>
                <button onClick={() => handlePeriodChange(1)}><ChevronRightIcon className="w-5 h-5 md:w-6 md:h-6" /></button>
            </div>
        );
    };
    
    const toggleDropdown = (name: string) => {
        setActiveDropdown(prev => (prev === name ? null : name));
    };

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
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
                onClick={handleArchiveRequest}
                className="flex items-center w-full px-4 py-2 text-left text-sm hover:bg-black/10 whitespace-nowrap"
            >
                <ArchiveBoxIcon className="w-5 h-5 mr-3" />
                <span>Arsip kelas</span>
            </button>
            {user.role === 'lecturer' && contextMenu.classInstance?.status !== ClassStatus.Selesai && contextMenu.classInstance?.status !== ClassStatus.Batal && (
                <button 
                    onClick={handleEditRequest}
                    className="flex items-center w-full px-4 py-2 text-left text-sm hover:bg-black/10 whitespace-nowrap"
                >
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
        isOpen={!!classToArchive}
        onClose={() => setClassToArchive(null)}
        onConfirm={handleArchiveConfirm}
        title={
            <span>
                Arsip kelas <strong className="font-bold">{classToArchive?.name}</strong>?
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
      {/* Header */}
      <header className="bg-secondary p-4 shadow-md z-10">
         <div className="flex justify-between items-center text-text">
            {!isSearchActive ? (
                <>
                    <button onClick={onProfileClick} className="font-bold text-lg md:text-xl truncate max-w-[150px] md:max-w-xs text-text" title={user.name}>
                        {user.name}
                    </button>
                    
                    <div className="flex items-center space-x-2">
                        {user.role === 'lecturer' && (
                            <button onClick={() => setView(View.ADD_CLASS)} aria-label="Tambah Kelas" className="lg:hidden">
                                <PlusCircleIcon className="w-7 h-7" />
                            </button>
                        )}
                        <div ref={reminderRef} className="relative">
                            <button
                                onClick={() => setIsReminderDropdownOpen(prev => !prev)}
                                className="p-1"
                                aria-haspopup="true"
                                aria-expanded={isReminderDropdownOpen}
                                aria-label="Buka pengingat"
                            >
                                <ClockIcon className="w-7 h-7" />
                            </button>
                            {isReminderDropdownOpen && (
                                <div className="absolute top-full mt-2 w-40 bg-card rounded-lg shadow-xl z-40 animate-dropdown right-0">
                                    <ul className="py-1">
                                        {[
                                            { label: '15 menit', value: 15 },
                                            { label: '30 menit', value: 30 },
                                            { label: '45 menit', value: 45 },
                                            { label: '60 menit', value: 60 },
                                            { label: '120 menit', value: 120 },
                                            { label: 'Nonaktif', value: null },
                                        ].map(({ label, value }) => (
                                            <li key={label}>
                                                <button
                                                    onClick={() => {
                                                        setReminder(value);
                                                        setIsReminderDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm md:text-base transition-colors ${
                                                        reminder === value
                                                            ? 'bg-primary text-header-text'
                                                            : 'text-text hover:bg-black/10'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setIsSearchActive(true)} aria-label="Cari">
                            <SearchIcon className="w-7 h-7"/>
                        </button>
                    </div>
                </>
            ) : (
                <div className="w-full flex items-center space-x-2">
                  <div className="flex-grow flex items-center bg-card rounded-full px-3 py-1 shadow-inner">
                      <SearchIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                      <input 
                          type="text" 
                          placeholder="Cari nama kelas..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-transparent text-text outline-none ml-2 text-base md:text-lg"
                          autoFocus
                      />
                  </div>
                  <button onClick={() => {
                      setIsSearchActive(false);
                      setSearchQuery('');
                  }} aria-label="Tutup pencarian">
                      <XMarkIcon className="w-7 h-7 md:w-8 md:h-8" />
                  </button>
                </div>
            )}
        </div>
        {isSelectionModeActive ? (
            <div className="mt-4 flex justify-around items-center space-x-2 text-text">
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
                <button onClick={handleSelectAll} className="flex flex-col items-center text-text disabled:opacity-50" disabled={filteredClasses.length === 0}>
                    <Square4GridIcon className="w-7 h-7" />
                    <span className="text-xs mt-1">Pilih Semua</span>
                </button>
                <button onClick={clearSelectedClasses} className="flex flex-col items-center text-text">
                    <XMarkCircleIcon className="w-7 h-7" />
                    <span className="text-xs mt-1">Batal Pilih</span>
                </button>
            </div>
        ) : (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2" ref={filtersRef}>
                <FilterDropdown 
                    label={timeFilter === TimeFilter.Semua ? "Filter Waktu" : timeFilter} 
                    isActive={timeFilter !== TimeFilter.Semua} 
                    options={Object.values(TimeFilter)}
                    onSelect={(value) => { setTimeFilter(value as TimeFilter); setActiveDropdown(null); }}
                    isOpen={activeDropdown === 'time'}
                    toggleOpen={() => toggleDropdown('time')}
                />
                <FilterDropdown 
                    label={classFilter === 'semua' ? "Filter Kelas" : classFilter.substring(0,12) + (classFilter.length > 12 ? '...' : '')} 
                    isActive={classFilter !== 'semua'} 
                    options={classNames}
                    onSelect={(value) => { setClassFilter(value); setActiveDropdown(null); }}
                    isOpen={activeDropdown === 'class'}
                    toggleOpen={() => toggleDropdown('class')}
                />
                <FilterDropdown 
                    label={statusFilter === 'semua' ? "Filter Status" : statusFilter} 
                    isActive={statusFilter !== StatusFilter.Semua} 
                    options={Object.values(StatusFilter)}
                    onSelect={(value) => { setStatusFilter(value as StatusFilter); setActiveDropdown(null); }}
                    isOpen={activeDropdown === 'status'}
                    toggleOpen={() => toggleDropdown('status')}
                />
                <FilterDropdown 
                    label={additionalFilter === 'semua' ? (user.role === 'lecturer' ? 'Filter Kategori Kelas' : 'Filter Dosen') : additionalFilter.substring(0,12) + (additionalFilter.length > 12 ? '...' : '')}
                    isActive={additionalFilter !== 'semua'} 
                    options={additionalFilterOptions}
                    onSelect={(value) => { setAdditionalFilter(value); setActiveDropdown(null); }}
                    isOpen={activeDropdown === 'additional'}
                    toggleOpen={() => toggleDropdown('additional')}
                />
            </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-grow p-4 lg:p-6 overflow-y-auto no-scrollbar">
        <div className="mb-4">
            {renderPeriodDisplay()}
        </div>
        
        {filteredClasses.length > 0 ? (
            <>
                {/* Mobile/Tablet View */}
                <div className="lg:hidden">
                    {filteredClasses.map(cls => 
                        <MobileClassCard 
                            key={cls.$id} 
                            cls={cls} 
                            onSelect={() => handleClassCardClick(cls)}
                            onShowContextMenu={handleShowContextMenu}
                            exitAnimationType={exitAnimation.get(cls.$id)}
                            isHighlighted={contextMenu.visible && contextMenu.classInstance?.$id === cls.$id}
                            isSelected={selectedClassIds.has(cls.$id)}
                        />
                    )}
                </div>

                {/* Desktop View */}
                <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredClasses.map(cls => {
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
        ) : (
            <div className="text-center text-text-secondary mt-10 md:text-lg">
                <p>Tidak ada jadwal yang sesuai dengan filter.</p>
                 {allClasses.length === 0 && user.role === 'lecturer' && (
                    <p className="mt-2">Klik tombol '+' di atas untuk menambah kelas baru.</p>
                )}
                 {allClasses.length === 0 && user.role === 'student' && (
                    <p className="mt-2">Belum ada kelas yang ditambahkan oleh dosen.</p>
                )}
            </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;