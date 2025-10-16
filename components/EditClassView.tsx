
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, ClassInstance } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import DateTimePicker from './modals/DateTimePicker';
import { formatDate, formatShortTime, isValidLocation, getAvailableClassTypes } from '../constants';
import { useTheme } from '../ThemeContext';
import InfoModal from './modals/InfoModal';
import ConfirmationModal from './modals/ConfirmationModal';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface EditClassViewProps {
    setView: (view: View) => void;
    updateClass: (classToEdit: ClassInstance, classData: {
        name: string;
        classTypes: string[];
        start: Date;
        end: Date;
        location: string;
        note: string;
    }) => string | null;
    classToEdit: ClassInstance;
    realtimeDate: Date;
}

const EditClassView: React.FC<EditClassViewProps> = ({ setView, updateClass, classToEdit, realtimeDate }) => {
    const [name, setName] = useState(classToEdit.name);
    const [isMultiClass, setIsMultiClass] = useState(classToEdit.classTypes.length > 1);
    const [selectedClassTypes, setSelectedClassTypes] = useState<string[]>(
        classToEdit.classTypes.length > 1 ? classToEdit.classTypes : []
    );
    const [currentClassTypeInput, setCurrentClassTypeInput] = useState(
        classToEdit.classTypes.length > 1 ? '' : (classToEdit.classTypes[0] || '')
    );
    const [date, setDate] = useState(new Date(classToEdit.start));
    const [startTime, setStartTime] = useState(new Date(classToEdit.start));
    const [endTime, setEndTime] = useState(new Date(classToEdit.end));
    const [location, setLocation] = useState(classToEdit.location);
    const [note, setNote] = useState(classToEdit.note);
    const [error, setError] = useState('');
    const [picker, setPicker] = useState<'date' | 'startTime' | 'endTime' | null>(null);
    const { isDarkMode } = useTheme();
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isClassTypeDropdownOpen, setIsClassTypeDropdownOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const classTypeRef = useRef<HTMLDivElement>(null);
    const classTypeDropdownRef = useRef<HTMLDivElement>(null);
    const availableClassTypes = getAvailableClassTypes(realtimeDate);
    
    const draftKey = `editClassDraft_${classToEdit.$id}`;

    useEffect(() => {
        try {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                const draft = JSON.parse(savedDraft);
                const isMulti = draft.isMultiClass ?? classToEdit.classTypes.length > 1;
                setName(draft.name ?? classToEdit.name);
                setIsMultiClass(isMulti);
                setSelectedClassTypes(draft.selectedClassTypes ?? (isMulti ? classToEdit.classTypes : []));
                setCurrentClassTypeInput(draft.currentClassTypeInput ?? (isMulti ? '' : (classToEdit.classTypes[0] || '')));
                setDate(draft.date ? new Date(draft.date) : new Date(classToEdit.start));
                setStartTime(draft.startTime ? new Date(draft.startTime) : new Date(classToEdit.start));
                setEndTime(draft.endTime ? new Date(draft.endTime) : new Date(classToEdit.end));
                setLocation(draft.location ?? classToEdit.location);
                setNote(draft.note ?? classToEdit.note);
            }
        } catch (e) { console.error("Failed to load edit class draft", e); }
    }, [classToEdit, draftKey]);

    useEffect(() => {
        const draft = { name, isMultiClass, selectedClassTypes, currentClassTypeInput, date: date.toISOString(), startTime: startTime.toISOString(), endTime: endTime.toISOString(), location, note };
        try { localStorage.setItem(draftKey, JSON.stringify(draft)); } catch (e) { console.error("Failed to save edit class draft", e); }
    }, [name, isMultiClass, selectedClassTypes, currentClassTypeInput, date, startTime, endTime, location, note, draftKey]);

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
        const finalClassTypes = (isMultiClass ? selectedClassTypes : (currentClassTypeInput.trim() ? [currentClassTypeInput.trim()] : [])).filter(ct => ct.trim());
        if (!name.trim() || !location.trim() || finalClassTypes.length === 0) { setError('Kategori kelas, nama kelas, dan lokasi wajib diisi.'); return; }
        
        for (const classType of finalClassTypes) {
            if (!availableClassTypes.includes(classType.toUpperCase())) {
                setError(`Error: Kategori kelas "${classType}" tidak valid untuk periode saat ini.`);
                return;
            }
        }
        
        const formattedLocation = location.trim().toUpperCase();
        if (!isValidLocation(formattedLocation)) { setError('Ruang kelas tidak valid. Pilih dari denah yang tersedia.'); return; }
        const startDateTime = new Date(date);
        startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        const endDateTime = new Date(date);
        endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
        if (endDateTime.getTime() <= startDateTime.getTime()) { setError('Jam selesai harus setelah jam mulai.'); return; }

        const updatedData = { name: name.trim(), classTypes: finalClassTypes.map(ct => ct.toUpperCase()), start: startDateTime, end: endDateTime, location: formattedLocation, note: note.trim() };
        const errorMsg = updateClass(classToEdit, updatedData);
        if (errorMsg) setError(errorMsg);
        else { localStorage.removeItem(draftKey); setView(View.DASHBOARD); }
    };

    const handleResetChanges = () => {
        const isMulti = classToEdit.classTypes.length > 1;
        setName(classToEdit.name); 
        setIsMultiClass(isMulti);
        setSelectedClassTypes(isMulti ? classToEdit.classTypes : []);
        setCurrentClassTypeInput(isMulti ? '' : (classToEdit.classTypes[0] || ''));
        setDate(new Date(classToEdit.start)); 
        setStartTime(new Date(classToEdit.start)); 
        setEndTime(new Date(classToEdit.end));
        setLocation(classToEdit.location); 
        setNote(classToEdit.note); 
        setError('');
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

    const inputClasses = `w-full p-3 rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`;
    const timeInputClasses = `${inputClasses} cursor-pointer text-center`;

    return (
        <div className="w-full h-full flex flex-col bg-background text-text">
            <ConfirmationModal isOpen={isResetConfirmOpen} onClose={() => setIsResetConfirmOpen(false)} onConfirm={handleResetChanges} title="Batalkan semua perubahan?" confirmText="Ya, Batalkan" />
            <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} currentView={View.EDIT_CLASS} />
            {picker && ( <DateTimePicker mode={picker === 'date' ? 'date' : 'time'} initialValue={getPickerInitialValue()} onClose={() => setPicker(null)} onConfirm={handlePickerConfirm} /> )}
            <header className="bg-secondary p-4 shadow-md z-10 grid grid-cols-3 items-center">
                <div className="justify-self-start"> <div className="w-7 h-7" /> </div>
                <h1 onClick={() => setIsInfoModalOpen(true)} className="font-bold text-xl md:text-2xl justify-self-center cursor-pointer title-hover-underline whitespace-nowrap" role="button" aria-label="Informasi Edit Kelas"> Edit Kelas </h1>
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
                    {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
                    <div className="pt-4 space-y-4"> <button type="submit" className="w-full bg-primary text-header-text font-bold p-4 rounded-full hover:bg-primary-dark transition-all duration-300 text-lg"> Simpan Perubahan </button> <button type="button" onClick={() => setIsResetConfirmOpen(true)} className="w-full bg-card text-text-secondary border-2 border-text-secondary font-bold p-3 rounded-full hover:bg-text-secondary/10 transition-colors"> Batalkan Perubahan </button> </div>
                </form>
            </main>
        </div>
    );
};

export default EditClassView;