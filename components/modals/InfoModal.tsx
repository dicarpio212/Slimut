import React from 'react';
import XMarkIcon from '../icons/XMarkIcon';
import { View } from '../../types';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: View;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, currentView }) => {
    if (!isOpen) return null;

    const getTitle = () => {
        switch (currentView) {
            case View.DASHBOARD: return "Informasi Dashboard";
            case View.CALENDAR: return "Informasi Kalender";
            case View.NOTIFICATIONS: return "Informasi Notifikasi";
            case View.ARCHIVED_CLASSES: return "Informasi Arsip Kelas";
            case View.CLASS_DETAIL: return "Informasi Detail Kelas";
            case View.ADD_CLASS:
            case View.EDIT_CLASS:
                return "Informasi Tambah/Edit Kelas";
            case View.PROFILE: return "Informasi Profil Pengguna";
            case View.ADMIN_APP_USAGE: return "Informasi Aktivitas";
            case View.ADMIN_DASHBOARD: return "Informasi Pengguna";
            default: return "Informasi Aplikasi PAJAL🕒";
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case View.DASHBOARD:
                return (
                    <>
                        <section className="mb-6">
                            <h3 className="font-bold text-lg text-primary mb-2">Fitur Utama Dashboard</h3>
                            <ul className="list-disc list-inside space-y-2 text-text-secondary">
                                <li><strong>Pencarian & Filter:</strong> Gunakan ikon pencarian untuk mencari kelas berdasarkan nama. Gunakan tombol filter untuk menyaring jadwal berdasarkan waktu, nama kelas, status, dan dosen/kategori kelas.</li>
                                <li><strong>Pengingat:</strong> Atur pengingat (15-120 menit) sebelum kelas dimulai melalui ikon jam. Notifikasi akan muncul di layar.</li>
                                <li><strong>Aksi Cepat:</strong> <strong>Tahan lama (mobile)</strong> atau <strong>klik kanan (desktop)</strong> pada sebuah jadwal untuk membuka menu aksi cepat seperti Arsip, Edit, Batalkan, atau Hapus kelas.</li>
                                <li><strong>Mode Pemilihan (Selection Mode):</strong> Dari menu aksi cepat, pilih 'Pilih kelas' untuk masuk ke mode pemilihan. Di sini, Anda dapat memilih beberapa kelas sekaligus untuk diarsipkan, dibatalkan, atau dihapus secara massal.</li>
                                <li><strong>Manajemen Kelas (Dosen):</strong> Dosen dapat menambah kelas baru menggunakan tombol '+' di header (mobile) atau di sidebar navigasi (desktop).</li>
                            </ul>
                        </section>
                         <section className="mb-6">
                            <h3 className="font-bold text-lg text-primary mb-2">Ucapan Terima Kasih</h3>
                            <p className="text-text-secondary mb-4">
                                Aplikasi ini dikembangkan untuk memenuhi Tugas dan Ujian Tengah Semester mata kuliah Interaksi Manusia dan Komputer. Kami memohon maaf apabila terdapat kekurangan dalam fitur maupun tampilan. Masukan dan saran sangat kami hargai.
                            </p>
                            <p className="text-text-secondary">
                                Terima kasih sebesar-besarnya kami sampaikan kepada Bapak <strong>Iman Saladin B. Azhar, S.Kom., M.M.S.I.</strong> selaku dosen pengampu mata kuliah Interaksi Manusia dan Komputer atas bimbingan dan ilmunya.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-bold text-lg text-primary mb-2">Kelompok 7</h3>
                            <ul className="list-none space-y-1 text-text-secondary">
                                <li>Sanvic Dicaprio (09011282227081)</li>
                                <li>Pandu Akbar Manjaring (09011182227012)</li>
                                <li>MUHTADIN (09011182227102)</li>
                            </ul>
                        </section>
                    </>
                );
            case View.CALENDAR:
                return (
                    <section>
                        <h3 className="font-bold text-lg text-primary mb-2">Fitur Kalender</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary">
                            <li><strong>Navigasi Bulan:</strong> Gunakan tombol panah di bagian atas untuk berpindah antar bulan.</li>
                            <li><strong>Lihat Jadwal Harian:</strong> Klik pada tanggal untuk menampilkan semua jadwal pada hari tersebut. Klik tanggal yang sama lagi untuk menyembunyikannya.</li>
                            <li><strong>Indikator Status:</strong> Kotak tanggal menampilkan indikator visual untuk status kelas pada hari itu (misalnya, biru untuk 'Belum', hijau untuk 'Selesai').</li>
                             <li><strong>Aksi Cepat & Mode Pemilihan:</strong> Saat melihat jadwal harian, Anda dapat <strong>tahan lama (mobile)</strong> atau <strong>klik kanan (desktop)</strong> pada sebuah kelas untuk mengakses menu aksi. Anda juga bisa masuk ke <strong>Mode Pemilihan</strong> untuk mengelola beberapa jadwal pada hari itu secara bersamaan.</li>
                        </ul>
                    </section>
                );
            case View.NOTIFICATIONS:
                 return (
                    <section>
                        <h3 className="font-bold text-lg text-primary mb-2">Fitur Notifikasi</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary">
                            <li><strong>Pemicu Notifikasi:</strong> Notifikasi dibuat secara otomatis ketika sebuah kelas <strong>dimulai</strong>, <strong>berakhir</strong>, <strong>dibatalkan</strong>, atau mengalami <strong>perubahan jadwal</strong>.</li>
                            <li><strong>Daftar Notifikasi:</strong> Halaman ini menampilkan semua notifikasi yang relevan, dikelompokkan berdasarkan tanggal. Notifikasi yang belum dibaca akan ditandai tebal.</li>
                            <li><strong>Navigasi Cepat:</strong> Klik pada sebuah notifikasi untuk langsung membuka halaman detail kelas terkait.</li>
                            <li><strong>Manajemen Notifikasi:</strong> Anda dapat menghapus semua notifikasi yang ada dengan ikon tempat sampah di pojok kiri atas.</li>
                        </ul>
                    </section>
                );
            case View.ARCHIVED_CLASSES:
                 return (
                    <section>
                        <h3 className="font-bold text-lg text-primary mb-2">Fitur Arsip Kelas</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary">
                            <li><strong>Daftar Arsip:</strong> Menampilkan semua kelas yang telah Anda arsipkan. Kelas di sini tidak akan muncul di dashboard atau kalender utama Anda.</li>
                            <li><strong>Aksi Cepat:</strong> <strong>Tahan lama (mobile)</strong> atau <strong>klik kanan (desktop)</strong> pada kelas untuk memulihkan atau menghapusnya secara permanen.</li>
                            <li><strong>Mode Pemilihan:</strong> Masuk ke mode pemilihan untuk memilih beberapa kelas arsip sekaligus, lalu pulihkan atau hapus semuanya secara massal.</li>
                        </ul>
                    </section>
                );
            case View.CLASS_DETAIL:
                 return (
                    <section>
                        <h3 className="font-bold text-lg text-primary mb-2">Fitur Detail Kelas</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary">
                            <li><strong>Informasi Lengkap:</strong> Halaman ini menyajikan semua detail tentang kelas, termasuk status, jadwal, dosen, dan catatan.</li>
                            <li><strong>Highlight Kelas (Mahasiswa):</strong> Jika ini adalah jadwal multikelas, kategori kelas Anda akan <strong>dicetak tebal</strong> untuk memudahkan identifikasi.</li>
                            <li><strong>Peta Ruangan:</strong> Visualisasi denah gedung (D atau F) akan ditampilkan, dengan lokasi ruang kelas yang bersangkutan ditandai untuk memudahkan pencarian.</li>
                            <li><strong>Aksi Cepat:</strong> Anda dapat langsung mengarsipkan kelas ini (atau memulihkannya jika sudah diarsip) menggunakan ikon di pojok kiri atas.</li>
                        </ul>
                    </section>
                );
            case View.ADD_CLASS:
            case View.EDIT_CLASS:
                 return (
                    <section>
                        <h3 className="font-bold text-lg text-primary mb-2">Fitur Tambah & Edit Kelas</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary">
                            <li><strong>Multikelas:</strong> Centang kotak 'Multikelas' untuk membuat satu jadwal yang berlaku bagi beberapa kategori kelas sekaligus (maksimal 4). Mahasiswa dari semua kategori kelas yang dipilih akan melihat jadwal ini.</li>
                            <li><strong>Manajemen Multikelas:</strong> Saat mengedit, Anda dapat menambah atau menghapus kategori kelas. Sistem akan secara otomatis membuat jadwal untuk mahasiswa di kategori baru dan menghapus jadwal dari mahasiswa di kategori yang dihilangkan.</li>
                            <li><strong>Impor Massal (XLSX):</strong> Untuk menambah banyak kelas sekaligus, unduh template file .xlsx, isi sesuai format (termasuk beberapa kategori kelas dipisah koma), lalu unggah kembali.</li>
                            <li><strong>Validasi Konflik:</strong> Sistem akan mencegah Anda menyimpan jadwal jika terjadi bentrok—baik karena ruangan sudah terpakai, maupun karena Anda (sebagai dosen) sudah punya jadwal lain di waktu yang sama.</li>
                            <li><strong>Aturan Waktu:</strong> Kelas tidak dapat dijadwalkan pada waktu yang sudah berlalu dan harus dibuat minimal 30 menit sebelum kelas dimulai.</li>
                        </ul>
                    </section>
                );
            case View.PROFILE:
                return (
                    <section>
                        <h3 className="font-bold text-lg text-primary mb-2">Fitur Profil</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary">
                            <li><strong>Pengguna Baru:</strong> Bagi pengguna baru, Anda wajib melengkapi nama lengkap, NIM/NIP, dan kategori kelas (untuk mahasiswa) sebelum dapat mengakses fitur lain.</li>
                            <li><strong>Edit Biodata:</strong> Anda dapat mengubah username dan password Anda. Nama lengkap, NIM/NIP, dan Kategori Kelas dikunci setelah disimpan pertama kali.</li>
                            <li><strong>Sinkronisasi Nama (Dosen):</strong> Jika Anda mengubah nama lengkap, nama Anda akan otomatis diperbarui di semua jadwal kelas yang Anda ampu.</li>
                            <li><strong>Foto Profil:</strong> Klik ikon kamera pada gambar profil untuk mengunggah atau mengganti foto Anda.</li>
                            <li><strong>Logout:</strong> Tombol logout untuk keluar dari aplikasi terletak di bagian bawah halaman ini.</li>
                        </ul>
                    </section>
                );
            case View.ADMIN_APP_USAGE:
                return (
                    <section>
                        <h3 className="font-bold text-lg text-primary mb-2">Analisis Aktivitas Aplikasi</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary">
                            <li><strong>Grafik Aktivitas Kelas:</strong> Menampilkan jumlah kelas yang terjadwal setiap harinya dalam satu bulan. Klik pada sebuah tanggal untuk memfilter grafik lain dan melihat data spesifik untuk hari tersebut. Gunakan panah untuk navigasi antar bulan.</li>
                            <li><strong>Distribusi Status & Penggunaan Ruangan:</strong> Grafik ini menunjukkan rincian data untuk periode yang dipilih (baik satu bulan penuh atau satu hari spesifik). Ini membantu memantau status kelas (selesai, batal, dll.) dan melihat ruangan mana yang paling sering digunakan.</li>
                            <li><strong>Download Laporan:</strong> Klik tombol "Download PDF" untuk mengunduh ringkasan visual dari semua grafik dalam format A4. Laporan ini akan selalu dalam tata letak desktop untuk konsistensi.</li>
                        </ul>
                    </section>
                );
            case View.ADMIN_DASHBOARD:
                return (
                    <section>
                        <h3 className="font-bold text-lg text-primary mb-2">Manajemen Pengguna</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary">
                            <li><strong>Tabel Pengguna:</strong> Menampilkan semua pengguna terdaftar (kecuali admin). Klik pada header kolom untuk mengurutkan data.</li>
                            <li><strong>Edit Data:</strong> Klik ikon pensil untuk mengedit data pengguna langsung di dalam tabel.</li>
                            <li><strong>Aksi Pengguna:</strong> Anda dapat menangguhkan (suspend) akun untuk sementara atau menghapusnya secara permanen. Pengguna yang ditangguhkan tidak dapat login.</li>
                            <li><strong>Lihat Detail:</strong> Klik pada baris pengguna mana pun (di luar mode edit) untuk melihat halaman detail lengkap, termasuk daftar jadwal kelas yang terkait dengan pengguna tersebut.</li>
                            <li><strong>Download Laporan:</strong> Unduh daftar lengkap pengguna dalam format PDF melalui tombol di pojok kiri atas.</li>
                        </ul>
                    </section>
                );
            default:
                return <p>Tidak ada informasi yang tersedia untuk tampilan ini.</p>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300 animate-fadeIn" onClick={onClose}>
            <div 
                className="bg-card text-text rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] flex flex-col animate-modal-appear" 
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b border-text/10 flex justify-between items-center flex-shrink-0">
                    <h2 className="font-bold text-xl">{getTitle()}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10" aria-label="Tutup">
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

export default InfoModal;