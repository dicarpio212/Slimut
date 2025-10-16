import React from 'react';
import XMarkIcon from '../icons/XMarkIcon';

interface LoginInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'login' | 'register';
}

const LoginInfoModal: React.FC<LoginInfoModalProps> = ({ isOpen, onClose, mode = 'login' }) => {
    if (!isOpen) return null;

    const title = mode === 'login' ? "Informasi Login" : "Informasi Pendaftaran";

    const renderContent = () => {
        if (mode === 'register') {
            return (
                 <section>
                    <p className="text-text-secondary mb-4">
                        Untuk mendaftar, pilih peran Anda (Mahasiswa atau Dosen), lalu masukkan username unik yang Anda inginkan. Username tidak boleh sama dengan pengguna lain.
                    </p>
                    <p className="text-text-secondary mb-4">
                        Password default akan diberikan secara otomatis oleh sistem. Anda dapat (dan disarankan) mengubahnya nanti di halaman profil Anda.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-md mb-1">Password Default</h4>
                            <ul className="list-disc list-inside space-y-1 text-text-secondary pl-2">
                                <li><strong>Dosen:</strong> 123456</li>
                                <li><strong>Mahasiswa:</strong> 1234</li>
                            </ul>
                        </div>
                    </div>
                    <p className="text-text-secondary mt-4">
                        Setelah berhasil mendaftar, Anda akan diarahkan ke halaman profil untuk melengkapi data diri (Nama Lengkap & NIM/NIP) sebelum dapat mengakses dashboard.
                    </p>
                </section>
            );
        }

        // Default login content
        return (
            <section>
                <p className="text-text-secondary">
                    Untuk masuk ke dalam aplikasi, pilih peran Anda (Mahasiswa atau Dosen), lalu masukkan Username atau Nama Lengkap Anda beserta password yang sesuai. Input tidak bersifat case-sensitive (kapitalisasi huruf diabaikan).
                </p>
            </section>
        );
    }


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300 animate-fadeIn" onClick={onClose}>
            <div 
                className="bg-card text-text rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] flex flex-col animate-modal-appear" 
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b border-text/10 flex justify-between items-center flex-shrink-0">
                    <h2 className="font-bold text-xl">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full" aria-label="Tutup">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="p-6 overflow-y-auto no-scrollbar">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default LoginInfoModal;