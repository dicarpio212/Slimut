
import React from 'react';
import type { ClassInstance, UserRole } from '../types';
import { getStatusColor, getInitials, formatShortTime, formatDate } from '../constants';
import PaperClipIcon from './icons/PaperClipIcon';
import ClassStatusIcon from './ClassStatusIcon';
import MoreVerticalIcon from './icons/MoreVerticalIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface DesktopClassCardProps {
    cls: ClassInstance;
    onSelect: () => void;
    userRole: UserRole;
    minHeight?: string;
    onContextMenu?: (e: React.MouseEvent) => void;
    exitAnimationType?: 'collapse' | 'delete' | 'restore';
    lecturerProfilePic: string | null;
    isSelected?: boolean;
}

const DesktopClassCard: React.FC<DesktopClassCardProps> = ({ cls, onSelect, userRole, minHeight = '300px', onContextMenu, exitAnimationType, lecturerProfilePic, isSelected = false }) => {
    const bgColor = getStatusColor(cls.status);
    const lecturerName = cls.lecturers.length > 0 ? cls.lecturers[0] : 'N/A';
    const initials = getInitials(lecturerName);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent onSelect from firing
        if (onContextMenu) {
            onContextMenu(e);
        }
    };

    const animationClass = exitAnimationType === 'delete'
        ? 'animate-card-exit-left'
        : exitAnimationType === 'collapse'
        ? 'animate-card-exit'
        : exitAnimationType === 'restore'
        ? 'animate-card-exit-restore'
        : '';
        
    const displayInfo = userRole === 'lecturer' 
        ? cls.classTypes.join(' | ') 
        : lecturerName;

    return (
        <div 
            className={`relative rounded-lg shadow-md overflow-hidden flex flex-col bg-card cursor-pointer transition-shadow transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 ${animationClass} ${isSelected ? 'border-[3px] border-primary' : 'border border-text/10'}`}
            style={{ minHeight }}
            onClick={onSelect}
            onContextMenu={(e) => e.preventDefault()}
        >
            {isSelected && (
                <div className="absolute top-2 left-2 z-10">
                    <CheckCircleIcon className="w-8 h-8 text-primary bg-card rounded-full" />
                </div>
            )}
            <div className="relative">
                <div style={{ backgroundColor: bgColor }} className="h-28 p-4 flex flex-col justify-between font-bold text-header-text min-w-0">
                    <div className="min-w-0 w-[65%]">
                        <h3 className="text-xl hover:underline truncate" title={cls.name}>{cls.name}</h3>
                        <p className="text-sm">{`${formatShortTime(cls.start)} - ${formatShortTime(cls.end)} / ${formatDate(cls.start)}`}</p>
                    </div>
                    <p className="text-sm truncate w-[65%]" title={displayInfo}>{displayInfo}</p>
                </div>
                
                {onContextMenu && (
                    <button
                        onClick={handleMenuClick}
                        className="absolute top-2 right-2 p-1 text-header-text rounded-full hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label="Opsi lainnya"
                    >
                        <MoreVerticalIcon className="w-6 h-6" />
                    </button>
                )}
                
                <div 
                    className="absolute top-20 right-4 w-16 h-16 bg-background rounded-full flex items-center justify-center border-4 border-card text-text-secondary text-2xl font-semibold overflow-hidden"
                >
                    {lecturerProfilePic ? (
                        <img src={lecturerProfilePic} alt={initials} className="w-full h-full object-cover" />
                    ) : (
                        <span>{initials}</span>
                    )}
                </div>
            </div>
            
            <div className="flex-grow p-4 pt-8 text-sm text-text-secondary">
                <p className="italic overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {cls.note || "Tidak ada catatan tambahan."}
                </p>
            </div>

            <footer className="border-t border-text/10 p-3 flex justify-between items-center text-text-secondary">
                <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-text">{cls.location}</span>
                    {cls.note && (
                        <span title="Catatan tersedia">
                            <PaperClipIcon className="w-5 h-5" />
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <ClassStatusIcon status={cls.status} size="sm" />
                    <span className="font-semibold text-sm capitalize" style={{ color: bgColor }}>
                        {cls.status}
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default DesktopClassCard;