import React, { useState } from 'react';
import ChevronUpIcon from '../icons/ChevronUpIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';

interface DateTimePickerProps {
    mode: 'date' | 'time';
    initialValue: Date;
    onClose: () => void;
    onConfirm: (newDate: Date) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ mode, initialValue, onClose, onConfirm }) => {
    const [tempValue, setTempValue] = useState(new Date(initialValue));
    const [year, setYear] = useState(initialValue.getFullYear());
    const [month, setMonth] = useState(initialValue.getMonth());
    const [hour, setHour] = useState(initialValue.getHours().toString().padStart(2,'0'));
    const [minute, setMinute] = useState(initialValue.getMinutes().toString().padStart(2,'0'));
    const [second, setSecond] = useState(initialValue.getSeconds().toString().padStart(2,'0'));


    const handleConfirm = () => {
        if (mode === 'date') {
            onConfirm(tempValue);
        } else {
            const newDate = new Date(initialValue);
            newDate.setHours(parseInt(hour, 10), parseInt(minute, 10), parseInt(second, 10));
            onConfirm(newDate);
        }
        onClose();
    };
    
    const renderCalendar = () => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const blanks = Array(firstDay).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        
        const changeMonth = (delta: number) => {
            const newDate = new Date(year, month + delta);
            setYear(newDate.getFullYear());
            setMonth(newDate.getMonth());
        }

        return (
            <div className="w-full p-4">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="font-bold text-lg p-2">&lt;</button>
                    <span className="font-bold text-xl">{`${new Date(year, month).toLocaleString('id-ID', { month: 'long' })} ${year}`}</span>
                    <button onClick={() => changeMonth(1)} className="font-bold text-lg p-2">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="font-bold text-text-secondary">{d}</div>)}
                    {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                    {days.map(d => {
                        const isSelected = d === tempValue.getDate() && month === tempValue.getMonth() && year === tempValue.getFullYear();
                        return (
                            <div key={d} 
                                 onClick={() => {
                                    const newDate = new Date(tempValue);
                                    newDate.setFullYear(year, month, d);
                                    setTempValue(newDate);
                                 }}
                                 className={`cursor-pointer p-2 rounded-full flex items-center justify-center aspect-square hover:bg-secondary/50 ${isSelected ? `bg-primary text-header-text` : ''}`}>
                                {d}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
    
    const handleTimeInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, max: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (val === '') {
            setter('');
            return;
        }

        const numVal = parseInt(val, 10);
        
        if (numVal > max) {
            setter(max.toString());
        } else if (val.length > 2) {
            // handles '003' -> '03', or '040' -> '40'
            setter(val.slice(-2));
        } else {
            setter(val);
        }
    }

    const handleTimeChange = (unit: 'hour' | 'minute' | 'second', delta: number) => {
        if (unit === 'hour') {
            const currentHour = parseInt(hour, 10);
            const newHour = (currentHour + delta + 24) % 24;
            setHour(newHour.toString().padStart(2, '0'));
        } else if (unit === 'minute') {
            const currentMinute = parseInt(minute, 10);
            const newMinute = (currentMinute + delta + 60) % 60;
            setMinute(newMinute.toString().padStart(2, '0'));
        } else {
            const currentSecond = parseInt(second, 10);
            const newSecond = (currentSecond + delta + 60) % 60;
            setSecond(newSecond.toString().padStart(2, '0'));
        }
    };


    const renderTimePicker = () => {
        return (
            <div className="flex items-center justify-center h-full p-8 text-5xl font-bold">
                <div className="flex flex-col items-center">
                    <button onClick={() => handleTimeChange('hour', 1)} className="p-2 text-text-secondary hover:text-text transition-colors" aria-label="Increase hour">
                        <ChevronUpIcon className="w-10 h-10" />
                    </button>
                    <input type="text" value={hour} onChange={handleTimeInputChange(setHour, 23)} onBlur={(e) => setHour(e.target.value.padStart(2,'0'))} className="w-24 text-center bg-transparent outline-none"/>
                    <button onClick={() => handleTimeChange('hour', -1)} className="p-2 text-text-secondary hover:text-text transition-colors" aria-label="Decrease hour">
                        <ChevronDownIcon className="w-10 h-10" />
                    </button>
                </div>
                <span>:</span>
                <div className="flex flex-col items-center">
                    <button onClick={() => handleTimeChange('minute', 1)} className="p-2 text-text-secondary hover:text-text transition-colors" aria-label="Increase minute">
                        <ChevronUpIcon className="w-10 h-10" />
                    </button>
                    <input type="text" value={minute} onChange={handleTimeInputChange(setMinute, 59)} onBlur={(e) => setMinute(e.target.value.padStart(2,'0'))} className="w-24 text-center bg-transparent outline-none"/>
                    <button onClick={() => handleTimeChange('minute', -1)} className="p-2 text-text-secondary hover:text-text transition-colors" aria-label="Decrease minute">
                        <ChevronDownIcon className="w-10 h-10" />
                    </button>
                </div>
                <span>:</span>
                <div className="flex flex-col items-center">
                    <button onClick={() => handleTimeChange('second', 1)} className="p-2 text-text-secondary hover:text-text transition-colors" aria-label="Increase second">
                        <ChevronUpIcon className="w-10 h-10" />
                    </button>
                    <input type="text" value={second} onChange={handleTimeInputChange(setSecond, 59)} onBlur={(e) => setSecond(e.target.value.padStart(2,'0'))} className="w-24 text-center bg-transparent outline-none"/>
                    <button onClick={() => handleTimeChange('second', -1)} className="p-2 text-text-secondary hover:text-text transition-colors" aria-label="Decrease second">
                        <ChevronDownIcon className="w-10 h-10" />
                    </button>
                </div>
            </div>
        );
    }
    
    const widthClass = mode === 'date' ? 'w-[90%] md:w-1/2 lg:w-1/3' : 'w-[85%] md:w-1/3';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 animate-fadeIn">
            <div className={`bg-card rounded-lg shadow-xl flex flex-col ${widthClass}`}>
                <div className="flex-grow text-text">
                    {mode === 'date' ? renderCalendar() : renderTimePicker()}
                </div>
                <div className="flex justify-between p-4 border-t border-text/20">
                    <button onClick={onClose} className="font-bold py-2 px-4 rounded text-text-secondary">Batal</button>
                    <button onClick={handleConfirm} className="font-bold py-2 px-4 rounded text-primary-dark">OK</button>
                </div>
            </div>
        </div>
    );
};

export default DateTimePicker;