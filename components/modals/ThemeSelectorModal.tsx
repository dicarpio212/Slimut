import React from 'react';
import { useTheme } from '../../ThemeContext';
import { themes } from '../../themes';
import XMarkIcon from '../icons/XMarkIcon';
import CheckIcon from '../icons/CheckIcon';
import MoonIcon from '../icons/MoonIcon';
import SunIcon from '../icons/SunIcon';


interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const { theme, themeKey, setThemeByName, isDarkMode, toggleDarkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 animate-fadeIn" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-11/12 md:w-1/2 lg:w-1/3 text-text animate-modal-appear" onClick={(e) => e.stopPropagation()}>
        <header className="p-4 border-b border-text/10 flex justify-between items-center">
          <h2 className="font-bold text-xl">Pilih Tema</h2>
          <div className="flex items-center space-x-2">
            <button onClick={toggleDarkMode} className="p-1 rounded-full hover:bg-text/10" aria-label={isDarkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}>
              {isDarkMode ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
            <button onClick={onClose} className="p-1 rounded-full" aria-label="Tutup">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </header>
        <main className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(themes).map(([key, themeOption]) => {
                    const isSelected = themeKey === key;
                    const cardColor = isDarkMode ? '#1E1E1E' : themeOption.colors.card;
                    const textColor = isDarkMode ? '#FFFFFF' : themeOption.colors.text;
                    const backgroundColor = isDarkMode ? '#121212' : themeOption.colors.background;

                    return (
                        <button 
                            key={key} 
                            onClick={() => setThemeByName(key)}
                            className="p-4 rounded-lg border-2 transition-colors duration-200"
                            style={{
                                borderColor: isSelected ? themeOption.colors.primary : 'transparent',
                                backgroundColor: cardColor,
                            }}
                        >
                            <div className="flex justify-between items-center mb-3">
                               <span className="font-semibold" style={{color: textColor}}>{themeOption.name}</span>
                               {/* FIX: Replaced direct styling of `CheckIcon` with a wrapping `span`. The `CheckIcon` component does not accept a `style` prop, causing a type error. By moving the style to a parent `span`, the icon's color can be correctly controlled via `currentColor` while adhering to the component's props interface. */}
                               {isSelected && <span style={{ color: themeOption.colors.primary }}><CheckIcon className="w-5 h-5" /></span>}
                            </div>
                            <div className="flex space-x-2 h-8 rounded overflow-hidden">
                               <div className="w-1/4" style={{ backgroundColor: themeOption.colors.primary }}></div>
                               <div className="w-1/4" style={{ backgroundColor: themeOption.colors.secondary }}></div>
                               <div className="w-1/4" style={{ backgroundColor: backgroundColor }}></div>
                               <div className="w-1/4" style={{ backgroundColor: textColor }}></div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </main>
      </div>
    </div>
  );
};

export default ThemeSelectorModal;