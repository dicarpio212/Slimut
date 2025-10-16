
import React from 'react';
import type { User, ClassInstance } from '../types';
import { View } from '../types';
import { formatFullDate, formatShortTime, getStatusColor } from '../constants';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UserCircleIcon from './icons/UserCircleIcon';

interface AdminUserDetailViewProps {
    user: User;
    allClasses: ClassInstance[];
    onClose: () => void;
    setView: (view: View) => void;
    setSelectedClass: (cls: ClassInstance | null) => void;
    setPreviousView: (view: View) => void;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode; isPassword?: boolean }> = ({ label, value, isPassword }) => (
    <div className="py-4 border-b border-text/10 flex flex-col md:flex-row md:items-center">
        <p className="font-bold text-base md:text-lg w-full md:w-1/3 flex-shrink-0">{label}</p>
        <div className={`mt-1 md:mt-0 md:pl-4 text-text-secondary ${isPassword ? 'font-mono' : ''}`}>{value || '-'}</div>
    </div>
);

const AdminUserDetailView: React.FC<AdminUserDetailViewProps> = ({ user, allClasses, onClose, setView, setSelectedClass, setPreviousView }) => {
    const userClasses = (
        user.role === 'lecturer'
            ? allClasses.filter(cls => cls.lecturers.some(lec => lec === user.name))
            : allClasses.filter(cls => user.classType && cls.classTypes.includes(user.classType))
    ).sort((a, b) => a.start.getTime() - b.start.getTime());

    const handleClassClick = (cls: ClassInstance) => {
        setSelectedClass(cls);
        setPreviousView(View.ADMIN_USER_DETAIL);
        setView(View.CLASS_DETAIL);
    };

    return (
        <div className="w-full h-full flex flex-col bg-background text-text">
            <header className="bg-secondary p-4 shadow-md z-10 grid grid-cols-3 items-center text-text">
                <div className="justify-self-start">
                    <button onClick={onClose} aria-label="Kembali ke Manajemen Pengguna">
                        <ArrowLeftIcon className="w-7 h-7" />
                    </button>
                </div>
                <h1 className="font-bold text-xl md:text-2xl justify-self-center text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
                    Detail Pengguna
                </h1>
                <div className="justify-self-end"><div className="w-7 h-7" /></div>
            </header>

            <main className="flex-grow p-4 lg:p-6 overflow-y-auto no-scrollbar">
                <div className="max-w-4xl mx-auto">
                    <section className="bg-card p-4 lg:p-6 rounded-lg shadow-md mb-6">
                        <div className="flex justify-between items-start">
                           <h2 className="text-2xl font-bold mb-4 text-primary">Data Akun</h2>
                           {user.isSuspended && (
                                <span className="text-sm font-bold text-red-500 bg-red-500/20 px-3 py-1 rounded-full">Ditangguhkan</span>
                           )}
                        </div>
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            <div className="flex-shrink-0 mx-auto md:mx-0">
                                {user.profilePic ? (
                                    <img src={user.profilePic} alt="Profil" className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-card shadow-lg" />
                                ) : (
                                    <UserCircleIcon className="w-24 h-24 md:w-32 md:h-32 text-text-secondary" />
                                )}
                            </div>
                            <div className="flex-grow w-full">
                                <DetailRow label="Nama Lengkap" value={user.name} />
                                <DetailRow label={user.role === 'student' ? 'NIM' : 'NIP'} value={user.nim_nip} />
                                <DetailRow label="Kelas" value={user.classType} />
                                <DetailRow label="Jenis Akun" value={user.role === 'student' ? 'Mahasiswa' : 'Dosen'} />
                                <DetailRow label="Username" value={user.username} />
                                <div className="py-4 flex flex-col md:flex-row md:items-center">
                                    <p className="font-bold text-base md:text-lg w-full md:w-1/3 flex-shrink-0">Password</p>
                                    <div className="mt-1 md:mt-0 md:pl-4 text-text-secondary font-mono">{user.password_raw || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-card p-4 lg:p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold mb-4 text-primary">Jadwal Kelas Terkait</h2>
                        {userClasses.length > 0 ? (
                            <div className="space-y-3">
                                {userClasses.map(cls => {
                                    const stripColor = getStatusColor(cls.status);
                                    return (
                                        <div 
                                            key={cls.$id} 
                                            className="bg-background rounded-lg border border-text/10 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors flex overflow-hidden"
                                            onClick={() => handleClassClick(cls)}
                                            role="button"
                                            aria-label={`Lihat detail untuk kelas ${cls.name}`}
                                        >
                                            <div className="w-2 flex-shrink-0" style={{ backgroundColor: stripColor }}></div>
                                            <div className="p-4 flex-grow">
                                                <p className="font-bold text-lg text-text">{cls.name}</p>
                                                <p className="text-sm text-primary font-semibold">
                                                   {cls.classTypes.join(', ')}
                                                </p>
                                                <p className="text-text-secondary mt-2">{formatFullDate(cls.start)}</p>
                                                <p className="text-text-secondary">{`${formatShortTime(cls.start)} - ${formatShortTime(cls.end)} di ${cls.location}`}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-text-secondary text-center py-4">Tidak ada jadwal terkait untuk pengguna ini.</p>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default AdminUserDetailView;