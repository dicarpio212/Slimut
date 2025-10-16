

import React from 'react';
import type { ClassInstance } from '../types';
import { formatFullDate, formatShortTime, getStatusColor } from '../constants';
import PaperClipIcon from './icons/PaperClipIcon';
import ClassStatusIcon from './ClassStatusIcon';
import ChevronDownSimpleIcon from './icons/ChevronDownSimpleIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface MobileClassCardProps {
    cls: ClassInstance;
    onSelect: () => void;
    onShowContextMenu?: (e: React.TouchEvent | React.MouseEvent, cls: ClassInstance) => void;
    exitAnimationType?: 'collapse' | 'delete' | 'restore';
    isHighlighted?: boolean;
    isSelected?: boolean;
}

const MobileClassCard: React.FC<MobileClassCardProps> = ({ cls, onSelect, onShowContextMenu, exitAnimationType, isHighlighted = false, isSelected = false }) => {
    const stripColor = getStatusColor(cls.status);

    const handleMenuClick = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation(); // Prevent onSelect from firing
        if (onShowContextMenu) {
            onShowContextMenu(e, cls);
        }
    };

    const animationClass = exitAnimationType === 'delete'
        ? 'animate-card-exit-left'
        : exitAnimationType === 'collapse'
        ? 'animate-card-exit'
        : exitAnimationType === 'restore'
        ? 'animate-card-exit-restore'
        : '';

    return (
        <div 
            className={`relative bg-card rounded-lg shadow-md mb-4 flex transition duration-200 ease-in-out hover:shadow-xl hover:-translate-y-1 ${animationClass} ${isHighlighted ? 'relative z-[49] scale-105 shadow-2xl' : ''} ${isSelected ? 'border-[3px] border-primary' : ''}`}
            onClick={onSelect}
            onContextMenu={(e) => e.preventDefault()}
        >
             {isSelected && (
                <div className="absolute top-2 right-2 z-10">
                    <CheckCircleIcon className="w-8 h-8 text-primary bg-card rounded-full" />
                </div>
            )}
            <div className="w-2 rounded-l-lg" style={{ backgroundColor: stripColor }}></div>
            <div className="p-4 flex-1 grid grid-cols-10 gap-2">
                <div className="flex flex-col justify-between min-w-0 col-span-6">
                    <div className="min-w-0">
                        <h3 className="font-bold text-lg md:text-xl text-text truncate">{cls.name}</h3>
                        <p className="text-sm md:text-base text-text-secondary mt-1 truncate">{`${formatFullDate(cls.start)} / ${cls.location}`}</p>
                    </div>
                    <div className="flex items-center text-sm md:text-base text-text-secondary mt-2 min-h-[28px]">
                       {onShowContextMenu && (
                            <button
                                onClick={handleMenuClick}
                                onTouchStart={handleMenuClick}
                                className="p-1 -ml-1 text-text-secondary hover:text-primary"
                                aria-label="Opsi lainnya"
                            >
                                <ChevronDownSimpleIcon className="w-6 h-6" />
                            </button>
                        )}
                        {cls.note && (
                            <div className="flex items-center ml-1">
                                <PaperClipIcon className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                                <span>Catatan tersedia</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col justify-between items-end col-span-4">
                    <p className="font-bold text-[14.5px] md:text-base text-text whitespace-nowrap">{`${formatShortTime(cls.start)} - ${formatShortTime(cls.end)}`}</p>
                    <ClassStatusIcon status={cls.status} withLabel={true} size="md" />
                </div>
            </div>
        </div>
    );
};

export default MobileClassCard;