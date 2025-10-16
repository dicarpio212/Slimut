import React, { useState, useEffect, useRef } from 'react';
import type { User, UserRole } from '../types';
import UserIcon from './icons/UserIcon';
import { useTheme } from '../ThemeContext';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import LoginInfoModal from './modals/LoginInfoModal';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';
import { getAvailableClassTypes } from '../constants';


interface LoginProps {
    onLogin: (user: User) => void;
    onRegister: (username: string) => string | null;
    allUsers: User[];
    realtimeDate: Date;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, allUsers, realtimeDate }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { isDarkMode } = useTheme();
    const [loginHistory, setLoginHistory] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const titleClickCount = useRef(0);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLUListElement>(null);


    // Load login history on mount
    useEffect(() => {
        try {
            const historyStr = localStorage.getItem('login_history') || '[]';
            setLoginHistory(JSON.parse(historyStr));
        } catch (error) {
            console.error("Failed to load login history", error);
        }
    }, []);

    // Handle clicking outside of the suggestions box
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    
    useEffect(() => {
        if (highlightedIndex > -1 && suggestionsRef.current) {
            const highlightedItem = suggestionsRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedItem) {
                highlightedItem.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }
        }
    }, [highlightedIndex]);


    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        setTimeout(() => {
            const loginInput = username.toLowerCase();
            
            const userDbToSearch = isAdminMode 
                ? allUsers.filter(u => u.role === 'administrator')
                : allUsers.filter(u => u.role !== 'administrator');

            const foundUser = userDbToSearch.find(user =>
                (user.username.toLowerCase() === loginInput || (!isAdminMode && user.name.toLowerCase() === loginInput)) &&
                user.password_raw === password
            );

            if (foundUser) {
                if (foundUser.isSuspended) {
                    setError('Akun Anda telah ditangguhkan.');
                    setIsLoading(false);
                    return;
                }
                onLogin(foundUser);
            } else {
                 const adminUser = allUsers.find(u => u.role === 'administrator' && u.username.toLowerCase() === loginInput && u.password_raw === password);
                if (adminUser) {
                    onLogin(adminUser);
                } else {
                    setError('Username atau password salah.');
                }
            }
            setIsLoading(false);
        }, 500);
    };
    
    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        setTimeout(() => {
            if (!username.trim()) {
                setError('Username wajib diisi.');
                setIsLoading(false);
                return;
            }
            
            const errorMsg = onRegister(username);

            if (errorMsg) {
                setError(errorMsg);
            }
            setIsLoading(false);
        }, 500);
    };


    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUsername(value);
        if (value.trim() && !isSigningUp) {
            const filteredSuggestions = loginHistory.filter(name => 
                name.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
            setShowSuggestions(filteredSuggestions.length > 0);
            setHighlightedIndex(-1);
        } else {
            setShowSuggestions(false);
        }
    };
    
    const handleSuggestionClick = (name: string) => {
        setUsername(name);
        setShowSuggestions(false);
    };

    const handleTitleClick = () => {
        titleClickCount.current += 1;
        if (titleClickCount.current === 5) {
            setIsAdminMode(true);
            setIsSigningUp(false);
            setError('');
            setUsername('');
            setPassword('');
        }
        setTimeout(() => {
            titleClickCount.current = 0;
        }, 1500);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex > -1) {
                    handleSuggestionClick(suggestions[highlightedIndex]);
                    passwordInputRef.current?.focus();
                } else if (suggestions.length > 0) {
                    // If user presses enter without explicit selection, select the first one
                    handleSuggestionClick(suggestions[0]);
                    passwordInputRef.current?.focus();
                }
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
    };


    const inputBgClass = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';
    const inputTextClass = isDarkMode ? 'text-white' : 'text-black';

    return (
        <div className="w-full h-screen bg-background flex flex-col justify-center items-center p-4">
             <LoginInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} mode={isSigningUp ? 'register' : 'login'} />
             <div className="w-full max-w-sm md:max-w-2xl">
                <div className="relative mb-[-50px] md:mb-[-75px] z-10 flex justify-center">
                    <div className="w-[100px] h-[100px] md:w-[150px] md:h-[150px] bg-card rounded-full flex items-center justify-center border-4 border-background shadow-lg">
                        <UserIcon className="w-12 h-12 md:w-20 md:h-20 text-text-secondary" />
                    </div>
                </div>
                
                <div className="bg-card rounded-xl shadow-2xl p-6 pt-20 md:px-16 md:pb-16 md:pt-28 text-text">
                    <h1 onClick={handleTitleClick} className="text-2xl md:text-4xl font-bold text-center mb-4 md:mb-8 cursor-pointer" title="Klik 5x untuk mode admin">
                        {isAdminMode ? 'Admin Login' : (isSigningUp ? 'Halaman Daftar' : 'Halaman Login')}
                    </h1>
                    
                    <form onSubmit={isSigningUp ? handleRegisterSubmit : handleLoginSubmit}>
                        <div className="mb-4 md:mb-6 relative" ref={wrapperRef}>
                            <input 
                                type="text"
                                placeholder={isAdminMode ? "Admin Username" : (isSigningUp ? "Username Baru" : "Username atau Nama Lengkap")}
                                value={username}
                                onChange={handleUsernameChange}
                                onFocus={handleUsernameChange}
                                onKeyDown={handleKeyDown}
                                className={`w-full p-3 md:p-5 md:text-xl rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all ${inputBgClass} ${inputTextClass}`}
                                required
                                autoComplete="off"
                            />
                            {showSuggestions && !isSigningUp && !isAdminMode &&(
                                <ul ref={suggestionsRef} className="absolute z-20 w-full bg-card border border-text/20 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg animate-dropdown">
                                    {suggestions.map((name, index) => (
                                        <li 
                                            key={index}
                                            onClick={() => handleSuggestionClick(name)}
                                            className={`px-3 py-2 cursor-pointer hover:bg-secondary/30 ${index === highlightedIndex ? 'bg-secondary/50' : ''}`}
                                        >
                                            {name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {!isSigningUp && (
                            <div className="mb-6 md:mb-8 relative">
                                <input
                                    ref={passwordInputRef}
                                    type={isPasswordVisible ? 'text' : 'password'}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full p-3 md:p-5 md:text-xl rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all ${inputBgClass} ${inputTextClass}`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordVisible(prev => !prev)}
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary"
                                    aria-label={isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"}
                                >
                                    {isPasswordVisible ? <EyeSlashIcon className="w-6 h-6"/> : <EyeIcon className="w-6 h-6"/>}
                                </button>
                            </div>
                        )}
                        {error && <p className="text-red-500 text-sm md:text-base text-center mb-4 md:mb-6">{error}</p>}
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-header-text font-bold p-3 md:p-5 md:text-xl rounded-full hover:bg-primary-dark transition-all duration-300 disabled:bg-primary/50 flex justify-center items-center"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-header-text border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                isSigningUp ? 'Daftar' : 'Login'
                            )}
                        </button>
                    </form>
                    {!isAdminMode && (
                        <p className="text-center mt-6 text-sm md:text-base text-text-secondary">
                            {isSigningUp ? "Sudah punya akun? " : "Belum punya akun? "}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSigningUp(!isSigningUp);
                                    setError('');
                                    setUsername('');
                                    setPassword('');
                                }}
                                className="font-bold text-primary hover:underline"
                            >
                                {isSigningUp ? "Login" : "Daftar"}
                            </button>
                        </p>
                    )}
                </div>
             </div>
            <button 
                onClick={() => setIsInfoModalOpen(true)} 
                className="mt-8 text-text-secondary hover:text-primary transition-colors"
                aria-label="Informasi Bantuan"
            >
                <QuestionMarkCircleIcon className="w-10 h-10" />
            </button>
        </div>
    );
};

export default Login;