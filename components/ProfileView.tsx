

import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { User, UserRole } from '../types';
import { View } from '../types';
import { useTheme } from '../ThemeContext';
import XMarkIcon from './icons/XMarkIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import CameraIcon from './icons/CameraIcon';
import LogoutIcon from './icons/LogoutIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import InfoModal from './modals/InfoModal';
import ConfirmationModal from './modals/ConfirmationModal';
import { getAvailableClassTypes } from '../constants';
import ChevronDownIcon from './icons/ChevronDownIcon';


interface ProfileViewProps {
    user: User;
    onUpdateProfile: (updatedUser: User, newProfilePicFile?: File) => Promise<string | null>;
    onLogout: () => void;
    onClose: () => void;
    realtimeDate: Date;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateProfile, onLogout, onClose, realtimeDate }) => {
    const [name, setName] = useState(user.name);
    const [username, setUsername] = useState(user.username);
    const [nimNip, setNimNip] = useState(user.nim_nip);
    const [password, setPassword] = useState(user.password_raw);
    const [profilePic, setProfilePic] = useState(user.profilePic);
    const [newProfilePicFile, setNewProfilePicFile] = useState<File | undefined>();
    const [classType, setClassType] = useState(user.classType || '');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isDarkMode } = useTheme();
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [isClassTypeDropdownOpen, setIsClassTypeDropdownOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const classTypeRef = useRef<HTMLDivElement>(null);
    const classTypeDropdownRef = useRef<HTMLUListElement>(null);
    const availableClassTypes = getAvailableClassTypes(realtimeDate);
    
    const isNewUser = user.nim_nip === '';
    const isAdmin = user.role === 'administrator';
    const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);


    const filteredClassTypes = useMemo(() => {
        if (!classType.trim()) {
            return availableClassTypes;
        }
        return availableClassTypes.filter(type => 
            type.toLowerCase().includes(classType.toLowerCase())
        );
    }, [classType, availableClassTypes]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (classTypeRef.current && !classTypeRef.current.contains(event.target as Node)) {
                setIsClassTypeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    useEffect(() => {
        if (!isClassTypeDropdownOpen) {
            setHighlightedIndex(-1);
        }
    }, [isClassTypeDropdownOpen]);

    useEffect(() => {
        if (highlightedIndex >= 0 && classTypeDropdownRef.current) {
            const highlightedItem = classTypeDropdownRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedItem) {
                highlightedItem.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }
        }
    }, [highlightedIndex]);

    const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setNewProfilePicFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setError('Pilih file gambar yang valid (JPG, PNG, dll.).');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        const requiredFields = [name, username, password];
        if (!isAdmin) {
            requiredFields.push(nimNip);
            if(selectedRole === 'student') {
                requiredFields.push(classType);
            }
        }
        if (requiredFields.some(field => !String(field).trim())) {
             setError('Semua kolom wajib diisi.');
             setIsLoading(false);
            return;
        }
        
        if (isNewUser && selectedRole === 'student') {
            const month = realtimeDate.getMonth();
            const isEvenSemesterPeriod = month >= 0 && month <= 5;
            const match = classType.match(/SK(\d+)[A-D]/i);
            if (match) {
                const semester = parseInt(match[1], 10);
                const isSemesterEven = semester % 2 === 0;
                if (isEvenSemesterPeriod && !isSemesterEven) {
                    setError(`Error: Kategori kelas semester ganjil (${classType}) tidak valid pada periode semester genap (Januari-Juni).`);
                    setIsLoading(false);
                    return;
                }
                if (!isEvenSemesterPeriod && isSemesterEven) {
                    setError(`Error: Kategori kelas semester genap (${classType}) tidak valid pada periode semester ganjil (Juli-Desember).`);
                    setIsLoading(false);
                    return;
                }
            } else if (!availableClassTypes.includes(classType.toUpperCase())) {
                setError(`Error: Kategori kelas "${classType}" tidak valid.`);
                setIsLoading(false);
                return;
            }
        }

        const updatedUser: User = {
            ...user,
            name: name.trim(),
            username: username.trim(),
            nim_nip: nimNip.trim(),
            role: selectedRole,
            classType: selectedRole === 'student' ? classType.trim().toUpperCase() : null,
            password_raw: password,
            profilePic: profilePic, // The URL will be updated in App.tsx
            profilePicId: user.profilePicId,
        };
        
        const errorMsg = await onUpdateProfile(updatedUser, newProfilePicFile);
        if (errorMsg) {
            setError(errorMsg);
        }
        setIsLoading(false);
    };

    const handleLogoutConfirm = () => {
        setIsLogoutConfirmOpen(false);
        onLogout();
    };

    const handleClassTypeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isNewUser) return;
        if (isClassTypeDropdownOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev + 1) % filteredClassTypes.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev - 1 + filteredClassTypes.length) % filteredClassTypes.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex >= 0) {
                    setClassType(filteredClassTypes[highlightedIndex]);
                    setIsClassTypeDropdownOpen(false);
                }
            } else if (e.key === 'Escape') {
                setIsClassTypeDropdownOpen(false);
            }
        }
    };

    const inputClasses = `w-full p-3 rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`;
    const labelText = selectedRole === 'student' ? 'NIM' : 'NIP';

    return (
        <div className="w-full h-full flex flex-col bg-background text-text">
            <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} currentView={View.PROFILE} />
            <ConfirmationModal
                isOpen={isLogoutConfirmOpen}
                onClose={() => setIsLogoutConfirmOpen(false)}
                onConfirm={handleLogoutConfirm}
                title="Apakah Anda yakin ingin keluar?"
                confirmText="Ya"
                cancelText="Batal"
            />
            <header className="bg-secondary p-4 shadow-md z-10 grid grid-cols-3 items-center">
                <div className="justify-self-start">
                    <div className="w-7 h-7" />
                </div>
                <h1 
                    onClick={() => setIsInfoModalOpen(true)}
                    className="font-bold text-xl md:text-2xl justify-self-center cursor-pointer title-hover-underline whitespace-nowrap"
                    role="button"
                    aria-label="Informasi Profil"
                >
                    Profil Pengguna
                </h1>
                <div className="justify-self-end">
                    <button onClick={onClose} aria-label="Tutup" disabled={isNewUser && !isAdmin} className={(isNewUser && !isAdmin) ? 'opacity-0' : ''}>
                        <XMarkIcon className="w-7 h-7" />
                    </button>
                </div>
            </header>

            <main className="flex-grow overflow-y-auto no-scrollbar p-6">
                <form onSubmit={handleSave} className="max-w-lg mx-auto space-y-6">
                    {isNewUser && !isAdmin && (
                        <div className="bg-primary/20 text-primary-dark p-3 rounded-lg text-center mb-6 font-semibold">
                            Selamat datang! Silakan lengkapi profil Anda untuk melanjutkan.
                        </div>
                    )}
                    <div className="flex justify-center">
                        <div className="relative">
                            {profilePic ? (
                                <img src={profilePic} alt="Profil" className="w-32 h-32 rounded-full object-cover border-4 border-card shadow-lg" />
                            ) : (
                                <UserCircleIcon className="w-32 h-32 text-text-secondary" />
                            )}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-1 right-1 bg-primary text-header-text rounded-full p-2 hover:bg-primary-dark transition-colors"
                                aria-label="Ubah foto profil"
                            >
                                <CameraIcon className="w-5 h-5" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePicChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                    </div>
                    
                    {isNewUser && !isAdmin && (
                        <div className="flex justify-center">
                             <label className="flex items-center cursor-pointer p-2">
                                <input
                                    type="checkbox"
                                    checked={selectedRole === 'lecturer'}
                                    onChange={(e) => setSelectedRole(e.target.checked ? 'lecturer' : 'student')}
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="ml-3 text-text-secondary font-semibold">Saya mendaftar sebagai Dosen</span>
                            </label>
                        </div>
                    )}


                    <div>
                        <label htmlFor="name" className="block font-bold mb-2">Nama Lengkap</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={`${inputClasses} disabled:opacity-70 disabled:cursor-not-allowed`} disabled={!isNewUser && !isAdmin} />
                    </div>
                    
                    {!isAdmin && (
                        <>
                             {selectedRole === 'student' && (
                                <div className="relative" ref={classTypeRef}>
                                    <label htmlFor="classType" className="block font-bold mb-2">Kategori Kelas</label>
                                    <div className="relative">
                                        <input id="classType" type="text" value={classType} 
                                            onChange={(e) => setClassType(e.target.value)} 
                                            onFocus={() => isNewUser && setIsClassTypeDropdownOpen(true)} 
                                            onKeyDown={handleClassTypeKeyDown}
                                            placeholder="e.g. SK1A" 
                                            className={`${inputClasses} disabled:opacity-70 disabled:cursor-not-allowed`}
                                            disabled={!isNewUser}
                                            autoComplete="off" 
                                        />
                                        {isNewUser && (
                                            <button type="button" onClick={() => setIsClassTypeDropdownOpen(p => !p)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                <ChevronDownIcon className="w-5 h-5 text-text-secondary" />
                                            </button>
                                        )}
                                    </div>
                                    {isNewUser && isClassTypeDropdownOpen && filteredClassTypes.length > 0 && (
                                        <ul ref={classTypeDropdownRef} className="absolute z-10 w-full mt-1 bg-card border border-text/20 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {filteredClassTypes.map((type, index) => (
                                                <li 
                                                    key={type} 
                                                    onClick={() => { setClassType(type); setIsClassTypeDropdownOpen(false); }} 
                                                    className={`px-4 py-2 cursor-pointer ${highlightedIndex === index ? 'bg-black/10' : 'hover:bg-black/10'}`}
                                                >
                                                    {type}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            <div>
                                <label htmlFor="nimNip" className="block font-bold mb-2">{labelText}</label>
                                <input id="nimNip" type="text" value={nimNip} onChange={(e) => setNimNip(e.target.value)} className={`${inputClasses} disabled:opacity-70 disabled:cursor-not-allowed`} disabled={!isNewUser} />
                            </div>
                        </>
                    )}


                    <div>
                        <label htmlFor="username" className="block font-bold mb-2">Username</label>
                        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={`${inputClasses} disabled:opacity-70 disabled:cursor-not-allowed`} disabled={isAdmin} />
                    </div>

                    <div>
                        <label htmlFor="password" className="block font-bold mb-2">Password</label>
                        <input id="password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} />
                    </div>

                    {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
                    
                    <div className="pt-4 space-y-4">
                        <button type="submit" disabled={isLoading} className="w-full bg-primary text-header-text font-bold p-4 rounded-full hover:bg-primary-dark transition-all duration-300 text-lg flex justify-center items-center disabled:opacity-50">
                             {isLoading ? (
                                <div className="w-6 h-6 border-2 border-header-text border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Simpan Perubahan'
                            )}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsLogoutConfirmOpen(true)}
                            className="w-full flex items-center justify-center bg-card text-red-500 border-2 border-red-500 font-bold p-3 rounded-full hover:bg-red-500/10 transition-colors"
                        >
                            <LogoutIcon className="w-6 h-6 mr-2" />
                            <span>Logout</span>
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default ProfileView;
