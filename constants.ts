// FIX: Module '"./types"' has no exported member 'ClassSchedule'.
import type { ClassInstance, ClassStatus } from './types';
import { ClassStatus as ClassStatusEnum } from './types';

export const COLORS = {
  green: '#127F19', // selesai
  gold: '#B2A300',  // aktif
  red: '#E00C0C',    // batal
  blue: '#2367CB',   // belum
  blueDark: '#09AAA4', // segera
};

const DAY_MAP: { [key: string]: number } = {
  'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6
};

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export const normalizeName = (name: string): string => {
    if (!name) return '';
    return name.split(',')[0].trim();
};

export const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
};

export const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

export const formatShortTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

export const formatFullDate = (date: Date) => {
    return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
};

export const generateClassInstances = (): ClassInstance[] => {
  return [];
};

export const getClassStatus = (cls: Omit<ClassInstance, 'id' | 'lecturers' | 'name' | 'note' | 'classTypes'>, now: Date): ClassStatus => {
    if (cls.status === ClassStatusEnum.Batal) return ClassStatusEnum.Batal;
    if (now > cls.end) return ClassStatusEnum.Selesai;
    if (now >= cls.start && now <= cls.end) return ClassStatusEnum.Aktif;
    
    const thirtyMinutesInMs = 30 * 60 * 1000;
    const timeUntilStart = cls.start.getTime() - now.getTime();
    if (timeUntilStart > 0 && timeUntilStart <= thirtyMinutesInMs) {
        return ClassStatusEnum.Segera;
    }

    return ClassStatusEnum.Belum;
};

export const getStatusColor = (status: ClassStatus) => {
    switch(status) {
        case ClassStatusEnum.Selesai: return COLORS.green;
        case ClassStatusEnum.Aktif: return COLORS.gold;
        case ClassStatusEnum.Batal: return COLORS.red;
        case ClassStatusEnum.Belum: return COLORS.blue;
        case ClassStatusEnum.Segera: return COLORS.blueDark;
        default: return '#BABABA';
    }
};

export const D_BUILDING_MAP = [
    ["D.3.4", "D.3.3", "D.3.2", "D.3.1"],
    ["D.2.4", "D.2.3", "D.2.2", "D.2.1"],
    ["D.1.4", "D.1.3", "D.1.2", "D.1.1"],
];

export const F_BUILDING_MAP = [
    ["F.2.2", "F.2.1"],
    ["F.1.2", "F.1.1"],
];

const VALID_LOCATIONS = new Set([
    ...D_BUILDING_MAP.flat(),
    ...F_BUILDING_MAP.flat()
]);

export const isValidLocation = (location: string): boolean => {
    return VALID_LOCATIONS.has(location.toUpperCase());
};

export const DESKTOP_CARD_COLORS = [
    '#1a73e8', // Blue
    '#d93025', // Red
    '#f29900', // Orange
    '#1e8e3e', // Green
    '#8f43b3', // Purple
    '#007b83', // Teal
    '#c5221f', // Dark Red
    '#5f6368', // Gray
];

export const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % DESKTOP_CARD_COLORS.length);
    return DESKTOP_CARD_COLORS[index];
};

export const getInitials = (name: string): string => {
    if (!name) return '?';
    const names = name.split(' ');
    const validNames = names.filter(n => n.length > 1 && !n.includes('.'));
    if (validNames.length > 0) {
        return validNames[0][0].toUpperCase();
    }
    if (names.length > 0) {
        return names[0][0].toUpperCase();
    }
    return '?';
};

export const ODD_SEMESTERS = [1, 3, 5, 7, 9];
export const EVEN_SEMESTERS = [2, 4, 6, 8, 10];
export const CLASS_SUFFIXES = ['A', 'B', 'C', 'D'];

export const getAvailableClassTypes = (date: Date): string[] => {
    const month = date.getMonth(); // 0-11
    const isEvenSemesterPeriod = month >= 0 && month <= 5; // Jan - June

    const semesters = isEvenSemesterPeriod ? EVEN_SEMESTERS : ODD_SEMESTERS;
    
    const classTypes: string[] = [];
    semesters.forEach(sem => {
        CLASS_SUFFIXES.forEach(suffix => {
            classTypes.push(`SK${sem}${suffix}`);
        });
    });

    return classTypes;
};