

import React, { useState, useMemo, useRef } from 'react';
import type { User, UserRole } from '../types';
import { View } from '../types';
import PencilIcon from './icons/PencilIcon';
import CheckIcon from './icons/CheckIcon';
import XMarkIcon from './icons/XMarkIcon';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';
import { getAvailableClassTypes } from '../constants';
import BanIcon from './icons/BanIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './modals/ConfirmationModal';
import InfoModal from './modals/InfoModal';
import DownloadIcon from './icons/DownloadIcon';

declare var html2canvas: any;
declare var jspdf: any;

type SortableKeys = 'name' | 'nim_nip' | 'classType' | 'role';

interface AdminDashboardProps {
    adminUser: User;
    allUsers: User[];
    onUpdateUserByAdmin: (updatedUser: User) => Promise<string | null>;
    setView: (view: View) => void;
    onLogout: () => void;
    onSelectUser: (user: User) => void;
    realtimeDate: Date;
    onSuspendUser: (userId: string) => void;
    onDeleteUser: (userId: string) => void;
}

interface UserRowProps {
    user: User;
    onSave: (updatedUser: User) => Promise<string | null>;
    onUpdateError: (msg: string) => void;
    onSelect: (user: User) => void;
    realtimeDate: Date;
    onSuspend: (user: User) => void;
    onDelete: (user: User) => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, onSave, onUpdateError, onSelect, realtimeDate, onSuspend, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<User>(user);
    const [passwordVisible, setPasswordVisible] = useState(false);
    
    const availableClasses = useMemo(() => getAvailableClassTypes(realtimeDate), [realtimeDate]);

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditData(user);
        setIsEditing(true);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(false);
        onUpdateError('');
    };

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (editData.role === 'student' && editData.classType) {
            const month = realtimeDate.getMonth();
            const isEvenSemesterPeriod = month >= 0 && month <= 5;
            const match = editData.classType.match(/SK(\d+)[A-D]/i);

            if (!availableClasses.includes(editData.classType.toUpperCase())) {
                onUpdateError(`Error: Kategori kelas "${editData.classType}" tidak valid untuk periode saat ini.`);
                return;
            }
            if (match) {
                const semester = parseInt(match[1], 10);
                const isSemesterEven = semester % 2 === 0;
                if (isEvenSemesterPeriod && !isSemesterEven) {
                    onUpdateError(`Error: Kategori kelas semester ganjil (${editData.classType}) tidak valid pada periode semester genap (Januari-Juni).`);
                    return;
                }
                if (!isEvenSemesterPeriod && isSemesterEven) {
                    onUpdateError(`Error: Kategori kelas semester genap (${editData.classType}) tidak valid pada periode semester ganjil (Juli-Desember).`);
                    return;
                }
            }
        }

        const errorMsg = await onSave(editData);
        if (errorMsg) {
            onUpdateError(errorMsg);
        } else {
            setIsEditing(false);
             onUpdateError('');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.stopPropagation();
        const { name, value } = e.target;
        
        if (name === 'role') {
            const newRole = value as UserRole;
            setEditData({ 
                ...editData, 
                role: newRole,
                classType: newRole === 'lecturer' ? null : editData.classType 
            });
        } else {
            const finalValue = name === 'classType' ? value.trim().toUpperCase() : value.trim();
            setEditData({ ...editData, [name]: finalValue });
        }
    };

    return (
        <tr 
            className={`border-b border-text/20 transition-colors ${!isEditing ? 'cursor-pointer hover:bg-black/5' : ''} ${user.isSuspended ? 'bg-red-500/10' : ''}`}
            onClick={() => !isEditing && onSelect(user)}
        >
            <td className="p-3 align-middle">
                {isEditing ? <input type="text" name="name" value={editData.name} onChange={handleChange} className="w-full bg-background text-text p-1 rounded min-w-[200px]" onClick={e => e.stopPropagation()} /> : user.name}
            </td>
            <td className="p-3 align-middle">
                {isEditing ? <input type="text" name="nim_nip" value={editData.nim_nip} onChange={handleChange} className="w-full bg-background text-text p-1 rounded min-w-[150px]" onClick={e => e.stopPropagation()}/> : user.nim_nip}
            </td>
            <td className="p-3 align-middle">
                {isEditing && editData.role === 'student' ? (
                     <input type="text" name="classType" value={editData.classType || ''} onChange={handleChange} className="w-full bg-background text-text p-1 rounded" onClick={e => e.stopPropagation()} />
                ) : user.classType || '-'}
            </td>
            <td className="p-3 capitalize align-middle">
                {isEditing ? (
                    <select name="role" value={editData.role} onChange={handleChange} className="w-full bg-background text-text p-1 rounded" onClick={e => e.stopPropagation()}>
                        <option value="student">Mahasiswa</option>
                        <option value="lecturer">Dosen</option>
                    </select>
                ) : (user.role === 'student' ? 'Mahasiswa' : 'Dosen')}
            </td>
            <td className="p-3 align-middle">
                {isEditing ? <input type="text" name="username" value={editData.username} onChange={handleChange} className="w-full bg-background text-text p-1 rounded min-w-[120px]" onClick={e => e.stopPropagation()}/> : user.username}
            </td>
            <td className="p-3 min-w-[150px] align-middle">
                {isEditing ? (
                     <div className="relative" onClick={e => e.stopPropagation()}>
                        <input type={passwordVisible ? 'text' : 'password'} name="password_raw" value={editData.password_raw} onChange={handleChange} className="w-full bg-background text-text p-1 rounded pr-8" />
                        <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 px-2 text-text-secondary">
                           {passwordVisible ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                ) : '••••••••'}
            </td>
            <td className="p-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                {isEditing ? (
                    <div className="flex justify-center space-x-2">
                        <button onClick={handleSave} className="p-1 text-green-500 hover:text-green-700" aria-label="Simpan"><CheckIcon className="w-5 h-5" /></button>
                        <button onClick={handleCancel} className="p-1 text-red-500 hover:text-red-700" aria-label="Batal"><XMarkIcon className="w-5 h-5" /></button>
                    </div>
                ) : (
                    <div className="flex justify-center items-center space-x-2">
                        <button onClick={handleEdit} className="p-1 hover:text-primary" aria-label="Edit"><PencilIcon className="w-5 h-5" /></button>
                        <button onClick={() => onSuspend(user)} className={`p-1 ${user.isSuspended ? 'text-green-500 hover:text-green-700' : 'text-yellow-600 hover:text-yellow-800'}`} aria-label={user.isSuspended ? 'Aktifkan' : 'Tangguhkan'}>
                            {user.isSuspended ? <CheckCircleIcon className="w-5 h-5" /> : <BanIcon className="w-5 h-5" />}
                        </button>
                         <button onClick={() => onDelete(user)} className="p-1 text-red-500 hover:text-red-700" aria-label="Hapus"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                )}
            </td>
        </tr>
    );
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminUser, allUsers, onUpdateUserByAdmin, setView, onLogout, onSelectUser, realtimeDate, onSuspendUser, onDeleteUser }) => {
    const [error, setError] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys | null; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });
    const [userToSuspend, setUserToSuspend] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const usersToList = allUsers.filter(u => u.role !== 'administrator');
    
    const sortedUsers = useMemo(() => {
        let sortableItems = [...usersToList];
        if (sortConfig && sortConfig.key) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key!] || '';
                const valB = b[sortConfig.key!] || '';

                if (valA < valB) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [usersToList, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };
    
    const handleSuspendConfirm = () => {
        if (userToSuspend) {
            onSuspendUser(userToSuspend.docId);
            setUserToSuspend(null);
        }
    };
    
    const handleDeleteConfirm = () => {
        if (userToDelete) {
            onDeleteUser(userToDelete.docId);
            setUserToDelete(null);
        }
    };

    const handleDownloadPdf = async () => {
        const { jsPDF } = jspdf;
        const tableNode = tableContainerRef.current;
        if (!tableNode) return;

        const isDarkMode = document.documentElement.style.getPropertyValue('--color-background') === '#121212';
        
        const reportContainer = document.createElement('div');
        reportContainer.style.position = 'absolute';
        reportContainer.style.left = '-9999px';
        reportContainer.style.width = '1200px';
        reportContainer.style.padding = '20px';
        reportContainer.style.backgroundColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
        reportContainer.style.color = isDarkMode ? '#FFFFFF' : '#000000';
        document.body.appendChild(reportContainer);

        const header = `
            <div style="display: flex; align-items: center; border-bottom: 2px solid ${isDarkMode ? '#FFF' : '#000'}; padding-bottom: 10px; margin-bottom: 20px; font-family: 'Helvetica', 'Arial', sans-serif;">
                <svg viewBox="0 0 125 100" xmlns="http://www.w3.org/2000/svg" style="width: 50px; height: 50px;">
                    <path d="M50 1 L100 50 L50 99 L1 50 Z" fill="#50B1F4" stroke="#2C508A" stroke-width="6" stroke-linejoin="round" />
                    <path d="M28 52 L48 72 L110 10" stroke="white" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                    <path d="M28 52 L48 72 L110 10" stroke="#2C508A" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                </svg>
                <div style="margin-left: 15px;">
                    <h1 style="font-size: 24px; font-weight: bold; margin: 0;">PAJAL</h1>
                    <p style="font-size: 16px; margin: 0;">Laporan Data Pengguna</p>
                </div>
                <div style="margin-left: auto; text-align: right;">
                    <p style="margin:0; font-size: 14px;">Dicetak pada:</p>
                    <p style="margin:0; font-size: 14px;">${new Date().toLocaleString('id-ID')}</p>
                </div>
            </div>
        `;
        reportContainer.innerHTML = header;

        const tableClone = tableNode.querySelector('table')?.cloneNode(true) as HTMLElement;
        if (tableClone) {
            tableClone.style.width = '100%';
            tableClone.style.borderCollapse = 'collapse';
            tableClone.querySelectorAll('th, td').forEach(cell => {
                // FIX: Cast Element to HTMLElement to access the style property.
                (cell as HTMLElement).style.border = `1px solid ${isDarkMode ? '#555' : '#ddd'}`;
                (cell as HTMLElement).style.padding = '8px';
                (cell as HTMLElement).style.textAlign = 'left';
            });
            tableClone.querySelectorAll('th').forEach(th => {
                 // FIX: Cast Element to HTMLElement to access the style property.
                 (th as HTMLElement).style.backgroundColor = isDarkMode ? '#333' : '#f2f2f2';
            });
            const headerCells = Array.from(tableClone.querySelectorAll('thead th'));
            const actionColumnIndex = headerCells.findIndex(th => th.textContent?.includes('AKSI'));

            if (actionColumnIndex > -1) {
                Array.from(tableClone.querySelectorAll('tr')).forEach(tr => {
                    tr.children[actionColumnIndex]?.remove();
                });
            }
            reportContainer.appendChild(tableClone);
        }

        const canvas = await html2canvas(reportContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        });
        
        document.body.removeChild(reportContainer);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save(`Laporan_Pengguna_PAJAL_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="w-full h-full flex flex-col bg-background text-text">
            <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} currentView={View.ADMIN_DASHBOARD} />
            <ConfirmationModal
                isOpen={!!userToSuspend}
                onClose={() => setUserToSuspend(null)}
                onConfirm={handleSuspendConfirm}
                title={<span>{userToSuspend?.isSuspended ? 'Aktifkan' : 'Tangguhkan'} akun <strong>{userToSuspend?.name}</strong>?</span>}
                confirmText={userToSuspend?.isSuspended ? 'Ya, Aktifkan' : 'Ya, Tangguhkan'}
            />
             <ConfirmationModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title={
                    <div className="flex flex-col items-center">
                        <span className="font-bold text-red-500 text-2xl">PERINGATAN!</span>
                        <span className="mt-4">
                            Yakin ingin menghapus akun <strong>{userToDelete?.name}</strong>?
                        </span>
                        <p className="text-sm mt-2 text-text-secondary">Tindakan ini akan menghapus pengguna dan semua data terkait (termasuk semua jadwal kelas yang dibuat jika pengguna adalah dosen) secara permanen.</p>
                    </div>
                }
                confirmText="Ya, Hapus Permanen"
            />
            <header className="bg-secondary p-4 shadow-md z-10 grid grid-cols-3 items-center text-text">
                <div className="justify-self-start">
                    <button onClick={handleDownloadPdf} className="flex items-center space-x-2 bg-primary text-header-text font-semibold py-1 px-3 rounded-lg hover:bg-primary-dark transition-colors" aria-label="Download Laporan PDF">
                        <DownloadIcon className="w-4 h-4"/>
                        <span className="hidden sm:inline text-sm">Download PDF</span>
                    </button>
                </div>
                <h1 
                    onClick={() => setIsInfoModalOpen(true)}
                    className="font-bold text-xl md:text-2xl justify-self-center cursor-pointer title-hover-underline"
                    role="button"
                    aria-label="Informasi Pengguna"
                >
                    Pengguna
                </h1>
                <div className="justify-self-end">
                    <button onClick={() => setView(View.ADMIN_APP_USAGE)} className="p-2 hover:bg-black/10 rounded-lg" aria-label="Kembali ke Aktivitas">
                        <XMarkIcon className="w-7 h-7" />
                    </button>
                </div>
            </header>

            <main className="flex-grow p-4 lg:p-6 overflow-auto no-scrollbar">
                {error && (
                    <div className="bg-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-center">
                        <p>{error}</p>
                        <button onClick={() => setError('')} className="font-bold underline mt-1">Tutup</button>
                    </div>
                )}
                <div className="bg-card rounded-lg shadow-md overflow-hidden" ref={tableContainerRef}>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm md:text-base whitespace-nowrap">
                            <thead className="bg-text/5 border-b-2 border-text/20 uppercase text-text-secondary">
                                <tr>
                                    <th className="p-3"><button onClick={() => requestSort('name')} className="font-bold w-full text-left flex items-center">NAMA LENGKAP<span className="ml-1">{getSortIndicator('name')}</span></button></th>
                                    <th className="p-3"><button onClick={() => requestSort('nim_nip')} className="font-bold w-full text-left flex items-center">NIM/NIP<span className="ml-1">{getSortIndicator('nim_nip')}</span></button></th>
                                    <th className="p-3"><button onClick={() => requestSort('classType')} className="font-bold w-full text-left flex items-center">KELAS<span className="ml-1">{getSortIndicator('classType')}</span></button></th>
                                    <th className="p-3"><button onClick={() => requestSort('role')} className="font-bold w-full text-left flex items-center">JENIS AKUN<span className="ml-1">{getSortIndicator('role')}</span></button></th>
                                    <th className="p-3 font-bold">USERNAME</th>
                                    <th className="p-3 font-bold">PASSWORD</th>
                                    <th className="p-3 text-center font-bold">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="text-text">
                                {sortedUsers.map(user => (
                                    <UserRow key={user.id} user={user} onSave={onUpdateUserByAdmin} onUpdateError={setError} onSelect={onSelectUser} realtimeDate={realtimeDate} onSuspend={setUserToSuspend} onDelete={setUserToDelete} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                 {usersToList.length === 0 && (
                    <p className="text-center text-text-secondary mt-10">Tidak ada pengguna yang terdaftar.</p>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
