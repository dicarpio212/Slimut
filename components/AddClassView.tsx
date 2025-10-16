import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import DateTimePicker from './modals/DateTimePicker';
import { formatDate, formatShortTime, isValidLocation, getAvailableClassTypes } from '../constants';
import { useTheme } from '../ThemeContext';
import InformationCircleIcon from './icons/InformationCircleIcon';
import InfoModal from './modals/InfoModal';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ConfirmationModal from './modals/ConfirmationModal';


declare var XLSX: any;

type FullNewClassData = {
    name: string;
    classTypes: string[];
    start: Date;
    end: Date;
    location: string;
    note: string;
};

interface AddClassViewProps {
    setView: (view: View) => void;
    addClass: (classData: FullNewClassData) => string | null;
    addBatchClasses: (classesData: FullNewClassData[], rowNumbers: number[]) => { successCount: number; errors: string[] };
    realtimeDate: Date;
}

const draftKey = 'addClassDraft';

const formatLocationFromFile = (locStr: string): string => {
    if (!locStr) return '';
    const cleaned = String(locStr).replace(/\./g, '').toUpperCase();
    const building = cleaned.charAt(0);
    if (building !== 'D' && building !== 'F') return String(locStr).toUpperCase();
    const numbers = cleaned.substring(1).replace(/[^0-9]/g, '');
    if (numbers.length === 0) return building;
    if (numbers.length === 1) return `${building}.${numbers}`;
    return `${building}.${numbers.charAt(0)}.${numbers.substring(1)}`;
};

const AddClassView: React.FC<AddClassViewProps> = ({ setView, addClass, addBatchClasses, realtimeDate }) => {
    const [name, setName] = useState('');
    const [selectedClassTypes, setSelectedClassTypes] = useState<string[]>([]);
    const [currentClassTypeInput, setCurrentClassTypeInput] = useState('');
    const [date, setDate] = useState(new Date(realtimeDate));
    const [startTime, setStartTime] = useState(() => {
        const d = new Date(realtimeDate);
        d.setHours(8, 0, 0, 0);
        return d;
    });
    const [endTime, setEndTime] = useState(() => {
        const d = new Date(realtimeDate);
        d.setHours(10, 0, 0, 0);
        return d;
    });
    const [location, setLocation] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [picker, setPicker] = useState<'date' | 'startTime' | 'endTime' | null>(null);
    const { isDarkMode } = useTheme();
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isMultiClass, setIsMultiClass] = useState(false);
    
    const [isClassTypeDropdownOpen, setIsClassTypeDropdownOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const classTypeRef = useRef<HTMLDivElement>(null);
    const classTypeDropdownRef = useRef<HTMLDivElement>(null);
    const availableClassTypes = getAvailableClassTypes(realtimeDate);

    useEffect(() => {
        try {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                const draft = JSON.parse(savedDraft);
                setName(draft.name || '');
                setSelectedClassTypes(draft.selectedClassTypes || []);
                setCurrentClassTypeInput(draft.currentClassTypeInput || '');
                setIsMultiClass(draft.isMultiClass || false);
                setDate(draft.date ? new Date(draft.date) : new Date(realtimeDate));
                setStartTime(draft.startTime ? new Date(draft.startTime) : startTime);
                setEndTime(draft.endTime ? new Date(draft.endTime) : endTime);
                setLocation(draft.location || '');
                setNote(draft.note || '');
            }
        } catch (e) { console.error("Failed to load add class draft", e); }
    }, []);

    useEffect(() => {
        const draft = { name, selectedClassTypes, currentClassTypeInput, isMultiClass, date: date.toISOString(), startTime: startTime.toISOString(), endTime: endTime.toISOString(), location, note };
        try { localStorage.setItem(draftKey, JSON.stringify(draft)); } catch (e) { console.error("Failed to save add class draft", e); }
    }, [name, selectedClassTypes, currentClassTypeInput, isMultiClass, date, startTime, endTime, location, note]);


    const filteredClassTypes = useMemo(() => {
        const lowercasedInput = currentClassTypeInput.toLowerCase();
        if (!lowercasedInput.trim()) return availableClassTypes.filter(type => !selectedClassTypes.includes(type));
        return availableClassTypes.filter(type => !selectedClassTypes.includes(type) && type.toLowerCase().includes(lowercasedInput));
    }, [currentClassTypeInput, availableClassTypes, selectedClassTypes]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (classTypeRef.current && !classTypeRef.current.contains(event.target as Node)) setIsClassTypeDropdownOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    useEffect(() => { if (!isClassTypeDropdownOpen) setHighlightedIndex(-1); }, [isClassTypeDropdownOpen]);
    useEffect(() => { if (highlightedIndex >= 0 && classTypeDropdownRef.current) { const el = classTypeDropdownRef.current.children[highlightedIndex] as HTMLElement; if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }, [highlightedIndex]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const finalClassTypes = isMultiClass ? selectedClassTypes : (currentClassTypeInput.trim() ? [currentClassTypeInput.trim()] : []);
        if (!name.trim() || !location.trim() || finalClassTypes.length === 0) { setError('Kategori kelas, nama kelas, dan lokasi wajib diisi.'); return; }
        const formattedLocation = location.trim().toUpperCase();
        if (!isValidLocation(formattedLocation)) { setError('Ruang kelas tidak valid. Pilih dari denah yang tersedia.'); return; }
        const startDateTime = new Date(date);
        startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        const endDateTime = new Date(date);
        endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
        if (endDateTime.getTime() <= startDateTime.getTime()) { setError('Jam selesai harus setelah jam mulai.'); return; }
        
        const classToCreate: FullNewClassData = {
            name: name.trim(),
            classTypes: finalClassTypes.map(ct => ct.toUpperCase()),
            start: startDateTime,
            end: endDateTime,
            location: formattedLocation,
            note: note.trim()
        };
        const errorMsg = addClass(classToCreate);
        if (errorMsg) setError(errorMsg);
        else { handleResetForm(true); setView(View.DASHBOARD); }
    };

    const handleResetForm = (skipConfirm = false) => {
        if (!skipConfirm) { setIsResetConfirmOpen(true); return; }
        setName(''); setSelectedClassTypes([]); setCurrentClassTypeInput(''); setIsMultiClass(false);
        setDate(new Date(realtimeDate));
        const dStart = new Date(realtimeDate); dStart.setHours(8, 0, 0, 0); setStartTime(dStart);
        const dEnd = new Date(realtimeDate); dEnd.setHours(10, 0, 0, 0); setEndTime(dEnd);
        setLocation(''); setNote(''); setError('');
        localStorage.removeItem(draftKey);
        setIsResetConfirmOpen(false);
    };

    const handlePickerConfirm = (newDate: Date) => { if (picker === 'date') setDate(newDate); else if (picker === 'startTime') setStartTime(newDate); else if (picker === 'endTime') setEndTime(newDate); };
    const getPickerInitialValue = () => { if (picker === 'date') return date; if (picker === 'startTime') return startTime; if (picker === 'endTime') return endTime; return new Date(); }
    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value; const cleaned = rawValue.replace(/\./g, '').toUpperCase();
        if (cleaned.length === 0) { setLocation(''); return; }
        const building = cleaned[0]; if (building !== 'D' && building !== 'F') { setLocation(rawValue.toUpperCase()); return; }
        const numbers = cleaned.substring(1).replace(/[^0-9]/g, ''); let formatted = building;
        if (numbers.length > 0) formatted += '.' + numbers[0];
        if (numbers.length > 1) formatted += '.' + numbers.substring(1);
        setLocation(formatted.substring(0, 7));
    };

    const addClassType = (type: string) => {
        const upperType = type.trim().toUpperCase();
        if (upperType && !selectedClassTypes.includes(upperType) && availableClassTypes.includes(upperType) && selectedClassTypes.length < 4) {
            setSelectedClassTypes(prev => [...prev, upperType]);
        }
        setCurrentClassTypeInput('');
        setHighlightedIndex(-1);
    };

    const removeClassType = (typeToRemove: string) => setSelectedClassTypes(prev => prev.filter(t => t !== typeToRemove));
    
    const handleClassTypeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isClassTypeDropdownOpen) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(prev => (prev + 1) % filteredClassTypes.length); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(prev => (prev - 1 + filteredClassTypes.length) % filteredClassTypes.length); }
            else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex >= 0) { const selected = filteredClassTypes[highlightedIndex]; if (isMultiClass) addClassType(selected); else { setCurrentClassTypeInput(selected); setIsClassTypeDropdownOpen(false); } }
                else if (isMultiClass && currentClassTypeInput.trim()) addClassType(currentClassTypeInput);
            }
            else if (e.key === 'Escape') { setIsClassTypeDropdownOpen(false); }
            else if (e.key === 'Tab' && isMultiClass && currentClassTypeInput.trim()) {
                e.preventDefault();
                const input = currentClassTypeInput.trim().toUpperCase();
                const exactMatch = availableClassTypes.find(ct => ct === input);
                if (exactMatch) {
                    addClassType(exactMatch);
                } else {
                    const prefixMatches = availableClassTypes.filter(ct => ct.startsWith(input) && !selectedClassTypes.includes(ct));
                    prefixMatches.slice(0, 4 - selectedClassTypes.length).forEach(addClassType);
                }
            }
            else if (isMultiClass && e.key === 'Backspace' && currentClassTypeInput === '' && selectedClassTypes.length > 0) removeClassType(selectedClassTypes[selectedClassTypes.length - 1]);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            setError('');
            try {
                const data = evt.target?.result; const workbook = XLSX.read(data, { type: 'binary', cellDates: true }); const sheetName = workbook.SheetNames[0]; const worksheet = workbook.Sheets[sheetName]; const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const rowsToProcess = jsonData.slice(1);
                if (rowsToProcess.length === 0 || rowsToProcess.every(row => row.every(cell => cell === null || cell === undefined || String(cell).trim() === ''))) {
                    setError('File kosong atau tidak memiliki data jadwal.');
                    return;
                }
    
                const successfullyParsedRows: { classData: FullNewClassData, rowNum: number }[] = [];
                const parsingErrors: string[] = [];
    
                for (let i = 0; i < rowsToProcess.length; i++) {
                    const row = rowsToProcess[i];
                    const rowIndex = i + 2;

                    if (row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
                        continue;
                    }
                    
                    let isRowValid = true;
                    const [name, classTypesRaw, date, startTime, endTime, location, note] = row;
    
                    if (!name || !classTypesRaw || !date || !startTime || !endTime || !location) {
                        parsingErrors.push(`Baris ${rowIndex}: Data tidak lengkap. Pastikan kolom Nama, Kategori, Tanggal, Jam Mulai, Jam Selesai, & Lokasi diisi.`);
                        continue;
                    }

                    const classTypes = String(classTypesRaw).split(',').map(ct => ct.trim().toUpperCase()).filter(ct => ct);
    
                    if (classTypes.length === 0) {
                        parsingErrors.push(`Baris ${rowIndex}: Kategori kelas tidak boleh kosong.`);
                        isRowValid = false;
                    }
                    if (classTypes.length > 4) {
                        parsingErrors.push(`Baris ${rowIndex}: Maksimal 4 kategori kelas yang dapat ditambahkan sekaligus.`);
                        isRowValid = false;
                    }
                    for (const ct of classTypes) {
                        if (!availableClassTypes.includes(ct)) {
                            parsingErrors.push(`Baris ${rowIndex}: Kategori kelas "${ct}" tidak valid untuk periode saat ini.`);
                            isRowValid = false;
                        }
                    }
                    if (!isRowValid) continue;
    
                    let classDate: Date;
                    if (date instanceof Date) {
                        classDate = date;
                    } else {
                        const parts = String(date).split(/[-/.]/);
                        if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
                            classDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                        } else {
                            parsingErrors.push(`Baris ${rowIndex}: Format tanggal tidak valid (gunakan DD/MM/YYYY).`);
                            isRowValid = false;
                        }
                    }
    
                    if (isRowValid && isNaN((classDate!).getTime())) {
                        parsingErrors.push(`Baris ${rowIndex}: Tanggal tidak valid.`);
                        isRowValid = false;
                    }
                    if (!isRowValid) continue;
    
                    const parseTime = (timeInput: any): { hours: number, minutes: number } | null => {
                        if (timeInput instanceof Date) return { hours: timeInput.getHours(), minutes: timeInput.getMinutes() };
                        if (typeof timeInput === 'string') {
                            const parts = timeInput.split(':');
                            if (parts.length >= 2 && parts[0].length === 2 && parts[1].length === 2) {
                                const hours = parseInt(parts[0], 10);
                                const minutes = parseInt(parts[1], 10);
                                if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                                    return { hours, minutes };
                                }
                            }
                        }
                        return null;
                    }
                    const startTimeData = parseTime(startTime);
                    const endTimeData = parseTime(endTime);
    
                    if (!startTimeData || !endTimeData) {
                        parsingErrors.push(`Baris ${rowIndex}: Format waktu tidak valid (gunakan HH:MM).`);
                        isRowValid = false;
                    }
                    if (!isRowValid) continue;
    
                    const startDateTime = new Date(classDate!);
                    startDateTime.setHours(startTimeData!.hours, startTimeData!.minutes, 0, 0);
                    const endDateTime = new Date(classDate!);
                    endDateTime.setHours(endTimeData!.hours, endTimeData!.minutes, 0, 0);
                    
                    if (endDateTime <= startDateTime) {
                        parsingErrors.push(`Baris ${rowIndex}: Jam selesai harus setelah jam mulai.`);
                        isRowValid = false;
                    }
                    if (!isRowValid) continue;
    
                    const formattedLocation = formatLocationFromFile(String(location));
                    if (!isValidLocation(formattedLocation)) {
                        parsingErrors.push(`Baris ${rowIndex}: Ruang kelas "${location}" tidak valid.`);
                        isRowValid = false;
                    }
                    if (!isRowValid) continue;
    
                    const classData: FullNewClassData = {
                        name: String(name).trim(),
                        classTypes: classTypes,
                        start: startDateTime,
                        end: endDateTime,
                        location: formattedLocation,
                        note: note ? String(note).trim() : ''
                    };
                    successfullyParsedRows.push({ classData, rowNum: rowIndex });
                }

                if (successfullyParsedRows.length > 0) {
                    const classesData = successfullyParsedRows.map(r => r.classData);
                    const rowNumbers = successfullyParsedRows.map(r => r.rowNum);
                    
                    const { successCount, errors: conflictErrors } = addBatchClasses(classesData, rowNumbers);
                    
                    const allErrors = [...parsingErrors, ...conflictErrors];

                    if (allErrors.length > 0) {
                        let finalErrorMsg = `Proses impor selesai.\n\n`;
                        if (successCount > 0) {
                            finalErrorMsg += `Berhasil menambahkan ${successCount} jadwal.\n\n`;
                        }
                        finalErrorMsg += `Gagal menambahkan/memproses ${allErrors.length} baris/jadwal karena kesalahan berikut:\n` + allErrors.join('\n');
                        setError(finalErrorMsg);
                    } else if (successCount > 0) {
                        handleResetForm(true);
                        setView(View.DASHBOARD);
                    } else {
                         setError("Tidak ada data jadwal valid yang ditemukan dalam file.");
                    }
                } else if (parsingErrors.length > 0) {
                     setError(`Gagal memproses file:\n${parsingErrors.join('\n')}`);
                } else {
                     setError("Tidak ada data jadwal valid yang ditemukan dalam file.");
                }
    
            } catch (err) {
                setError('Gagal memproses file. Pastikan formatnya benar.');
                console.error(err);
            }
        };
        reader.onerror = () => { setError('Gagal membaca file.'); };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };
    
    const handleDownloadTemplate = () => {
        const headers = [
            "Nama Kelas",
            "Kategori Kelas (dipisah koma, maks 4)",
            "Tanggal (DD/MM/YYYY)",
            "Jam Mulai (HH:MM)",
            "Jam Selesai (HH:MM)",
            "Lokasi",
            "Catatan (Opsional)"
        ];
        
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        
        ws['!cols'] = [
            { wch: 40 }, // Nama Kelas
            { wch: 35 }, // Kategori Kelas
            { wch: 20 }, // Tanggal
            { wch: 15 }, // Jam Mulai
            { wch: 15 }, // Jam Selesai
            { wch: 15 }, // Lokasi
            { wch: 50 }  // Catatan
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Jadwal");
        XLSX.writeFile(wb, "Template_Tambah_Jadwal.xlsx");
    };

    const inputClasses = `w-full p-3 rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`;
    const timeInputClasses = `${inputClasses} cursor-pointer text-center`;

    return (
        <div className="w-full h-full flex flex-col bg-background text-text">
             <ConfirmationModal isOpen={isResetConfirmOpen} onClose={() => setIsResetConfirmOpen(false)} onConfirm={() => handleResetForm(true)} title="Kosongkan formulir?" confirmText="Ya, Kosongkan" />
            <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} currentView={View.ADD_CLASS} />
            {picker && ( <DateTimePicker mode={picker === 'date' ? 'date' : 'time'} initialValue={getPickerInitialValue()} onClose={() => setPicker(null)} onConfirm={handlePickerConfirm} /> )}
            <header className="bg-secondary p-4 shadow-md z-10 grid grid-cols-3 items-center">
                <div className="justify-self-start"> <div className="w-7 h-7" /> </div>
                <h1 onClick={() => setIsInfoModalOpen(true)} className="font-bold text-xl md:text-2xl justify-self-center cursor-pointer title-hover-underline whitespace-nowrap" role="button" aria-label="Informasi Tambah Kelas"> Tambah Kelas </h1>
                <div className="justify-self-end"> <button onClick={() => setView(View.DASHBOARD)} aria-label="Tutup"><XMarkIcon className="w-7 h-7" /></button> </div>
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar p-6">
                <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
                    <div> <label htmlFor="className" className="block font-bold mb-2">Nama Kelas</label> <input id="className" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Interaksi Manusia dan Komputer" className={inputClasses} /> </div>
                    <div className="relative" ref={classTypeRef}>
                        <label className="block font-bold mb-2">Kategori Kelas</label>
                        {!isMultiClass ? (
                             <div className="relative"> <input id="classType" type="text" value={currentClassTypeInput} onChange={(e) => setCurrentClassTypeInput(e.target.value)} onFocus={() => setIsClassTypeDropdownOpen(true)} onKeyDown={handleClassTypeKeyDown} placeholder="e.g. SK1A" className={inputClasses} autoComplete="off"/> <button type="button" onClick={() => setIsClassTypeDropdownOpen(p => !p)} className="absolute inset-y-0 right-0 flex items-center pr-3"> <ChevronDownIcon className="w-5 h-5 text-text-secondary" /> </button> </div>
                        ) : (
                            <div className={`${inputClasses} flex flex-wrap items-center gap-2`} onClick={() => classTypeRef.current?.querySelector('input')?.focus()}>
                                {selectedClassTypes.map(type => ( <span key={type} className="bg-primary text-header-text rounded-md px-2 py-1 flex items-center gap-1 text-sm font-semibold"> {type} <button type="button" onClick={() => removeClassType(type)} className="hover:bg-black/20 rounded-full"> <XMarkIcon className="w-3 h-3" /> </button> </span> ))}
                                <input type="text" value={currentClassTypeInput} onChange={(e) => setCurrentClassTypeInput(e.target.value)} onFocus={() => setIsClassTypeDropdownOpen(true)} onKeyDown={handleClassTypeKeyDown} placeholder={selectedClassTypes.length >= 4 ? "Maks. 4 kelas" : "Tambah kelas..."} className="bg-transparent outline-none flex-grow" disabled={selectedClassTypes.length >= 4} />
                            </div>
                        )}
                        {isClassTypeDropdownOpen && filteredClassTypes.length > 0 && (
                            <div ref={classTypeDropdownRef} className="absolute z-10 w-full mt-1 bg-card border border-text/20 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {filteredClassTypes.map((type, index) => ( <div key={type} onClick={() => { if (isMultiClass) addClassType(type); else { setCurrentClassTypeInput(type); setIsClassTypeDropdownOpen(false); } }} className={`px-4 py-2 cursor-pointer ${highlightedIndex === index ? 'bg-black/10' : 'hover:bg-black/10'}`}> {type} </div> ))}
                            </div>
                        )}
                         <div className="mt-2"> <label className="flex items-center cursor-pointer"> <input type="checkbox" checked={isMultiClass} onChange={e => setIsMultiClass(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/> <span className="ml-2 text-sm">Multikelas</span> </label> </div>
                    </div>
                    <div> <label className="block font-bold mb-2">Tanggal Kelas</label> <div className={timeInputClasses} onClick={() => setPicker('date')}> {formatDate(date)} </div> </div>
                    <div className="flex gap-4"> <div className="w-1/2"> <label className="block font-bold mb-2 text-center">Jam Mulai</label> <div className={timeInputClasses} onClick={() => setPicker('startTime')}> {formatShortTime(startTime)} </div> </div> <div className="w-1/2"> <label className="block font-bold mb-2 text-center">Jam Selesai</label> <div className={timeInputClasses} onClick={() => setPicker('endTime')}> {formatShortTime(endTime)} </div> </div> </div>
                    <div> <label htmlFor="location" className="block font-bold mb-2">Ruang Kelas</label> <input id="location" type="text" value={location} onChange={handleLocationChange} placeholder="e.g. F.2.2 atau D.1.3" className={inputClasses} /> </div>
                    <div> <label htmlFor="notes" className="block font-bold mb-2">Catatan Tambahan (Opsional)</label> <textarea id="notes" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Informasi tambahan untuk kelas..." className={`${inputClasses} h-28 resize-none`} /> </div>
                    {error && <p className="text-red-500 text-center font-semibold whitespace-pre-wrap">{error}</p>}
                    <div className="pt-4 space-y-4"> <button type="submit" className="w-full bg-primary text-header-text font-bold p-4 rounded-full hover:bg-primary-dark transition-all duration-300 text-lg"> Simpan Kelas </button> <button type="button" onClick={() => handleResetForm()} className="w-full bg-card text-text-secondary border-2 border-text-secondary font-bold p-3 rounded-full hover:bg-text-secondary/10 transition-colors"> Kosongkan Form </button> </div>
                    <div className="relative my-6"> <div className="absolute inset-0 flex items-center" aria-hidden="true"> <div className="w-full border-t border-text/30" /> </div> <div className="relative flex justify-center"> <span className="bg-background px-2 text-sm text-text-secondary">atau</span> </div> </div>
                     <div className="flex flex-col sm:flex-row gap-4 justify-center"> <button type="button" onClick={handleDownloadTemplate} className="w-full sm:w-auto flex-1 bg-card text-primary-dark border-2 border-primary-dark font-bold py-3 px-4 rounded-full hover:bg-primary-dark/10 transition-colors"> Download Template </button> <label htmlFor="xlsx-upload" className="w-full sm:w-auto flex-1 bg-card text-primary-dark border-2 border-primary-dark font-bold py-3 px-4 rounded-full hover:bg-primary-dark/10 transition-colors cursor-pointer text-center"> Upload File .xlsx </label> <input id="xlsx-upload" type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} /> </div>
                </form>
            </main>
        </div>
    );
};

export default AddClassView;