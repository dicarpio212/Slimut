import React from 'react';
import { ClassStatus } from '../types';
import { getStatusColor, COLORS } from '../constants';
import CheckIcon from './icons/CheckIcon';
import XMarkIcon from './icons/XMarkIcon';

interface ClassStatusIconProps {
  status: ClassStatus;
  withLabel?: boolean;
  size?: 'xxs' | 'xs' | 'sm' | 'sm-md' | 'md' | 'lg';
}

const ClassStatusIcon: React.FC<ClassStatusIconProps> = ({ status, withLabel = false, size = 'md' }) => {
  const color = getStatusColor(status);
  const sizeClasses = {
    xxs: { container: 'w-2 h-2', icon: 'w-1 h-1', label: 'text-[6px]' },
    xs: { container: 'w-3 h-3', icon: 'w-2 h-2', label: 'text-[7px]' },
    sm: { container: 'w-4 h-4', icon: 'w-3 h-3', label: 'text-[8px]' },
    'sm-md': { container: 'w-8 h-8', icon: 'w-5 h-5', label: 'text-xs' },
    md: { container: 'w-10 h-10', icon: 'w-6 h-6', label: 'text-base' },
    lg: { container: 'w-10 h-10', icon: 'w-6 h-6', label: 'text-sm' },
  };
  const classes = sizeClasses[size];

  const renderIcon = () => {
    switch (status) {
      case ClassStatus.Selesai:
        return <span style={{ color }}><CheckIcon className={classes.icon} /></span>;
      case ClassStatus.Aktif: {
        const sizeMap = {
          xxs: { h: 4, w: 3 },
          xs: { h: 8, w: 7 },
          sm: { h: 12, w: 10 },
          'sm-md': { h: 18, w: 16 },
          md: { h: 25, w: 21 },
          lg: { h: 24, w: 20 },
        };
        const s = sizeMap[size];
        return (
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: `${s.h / 2}px solid transparent`,
              borderBottom: `${s.h / 2}px solid transparent`,
              borderLeft: `${s.w}px solid ${color}`,
            }}
          />
        );
      }
      case ClassStatus.Batal:
        return <span style={{ color }}><XMarkIcon className={classes.icon} /></span>;
      case ClassStatus.Belum:
        return <div className={classes.icon} style={{ backgroundColor: color }} />;
      case ClassStatus.Segera: {
        const sizeMap = {
          xxs: { s: 3 },
          xs: { s: 6 },
          sm: { s: 10 },
          'sm-md': { s: 16 },
          md: { s: 22 },
          lg: { s: 22 },
        };
        const { s } = sizeMap[size];
        return (
          <div
            style={{
              width: `${s}px`,
              height: `${s}px`,
              backgroundColor: color,
              transform: 'rotate(45deg)',
            }}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {renderIcon()}
      {withLabel && <span className={`mt-1 font-semibold ${classes.label}`} style={{ color }}>{status}</span>}
    </div>
  );
};

export default ClassStatusIcon;