
import React, { useEffect, useRef, useState } from 'react';
import type { ClassInstance, User } from '../types';
import { ClassStatus, View } from '../types';
import { useTheme } from '../ThemeContext';
import DownloadIcon from './icons/DownloadIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import InfoModal from './modals/InfoModal';

declare var Chart: any;
declare var html2canvas: any;
declare var jspdf: any;

interface AdminAppUsageViewProps {
    allClasses: ClassInstance[];
    allUsers: User[];
}

const hexToRgba = (hex: string, alpha: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
    }
    // Fallback for invalid hex
    return `rgba(239, 119, 34, ${alpha})`; 
};

const getChartAnalytics = (allClasses: ClassInstance[], allUsers: User[], selectedDate: string | null, activityChartMonth: Date) => {
    const classesToDisplay = selectedDate
        ? allClasses.filter(cls => {
            const classDate = new Date(cls.start);
            const dataDate = new Date(selectedDate);
            return classDate.getFullYear() === dataDate.getFullYear() &&
                    classDate.getMonth() === dataDate.getMonth() &&
                    classDate.getDate() === dataDate.getDate();
        })
        : allClasses.filter(cls => {
            const classDate = new Date(cls.start);
            return classDate.getFullYear() === activityChartMonth.getFullYear() &&
                    classDate.getMonth() === activityChartMonth.getMonth();
        });
    
    const titleSuffix = selectedDate 
        ? `pada ${new Date(selectedDate).toLocaleDateString('id-ID')}`
        : `(${activityChartMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })})`;

    // Status Pie Chart Data
    const statusOrder: ClassStatus[] = [ClassStatus.Selesai, ClassStatus.Aktif, ClassStatus.Batal, ClassStatus.Belum, ClassStatus.Segera];
    const statusCounts = classesToDisplay.reduce((acc, cls) => {
        acc[cls.status] = (acc[cls.status] || 0) + 1;
        return acc;
    }, {} as Record<ClassStatus, number>);
    const pieChartLabels = statusOrder.filter(s => statusCounts[s] > 0);
    const pieChartData = pieChartLabels.map(s => statusCounts[s]);
    const pieChartColors = pieChartLabels.map(s => {
        switch(s) {
            case ClassStatus.Selesai: return '#127F19';
            case ClassStatus.Aktif: return '#B2A300';
            case ClassStatus.Batal: return '#E00C0C';
            case ClassStatus.Belum: return '#2367CB';
            case ClassStatus.Segera: return '#09AAA4';
            default: return '#BABABA';
        }
    });

    // Room Usage Bar Chart Data
    const validStatusesForRoomCount = [ClassStatus.Belum, ClassStatus.Aktif, ClassStatus.Segera, ClassStatus.Selesai];
    const roomUsageCounts = classesToDisplay
        .filter(cls => validStatusesForRoomCount.includes(cls.status))
        .reduce((acc, cls) => {
            const room = cls.location.toUpperCase();
            acc[room] = (acc[room] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    const sortedRoomUsage = Object.entries(roomUsageCounts)
        .map(([room, count]) => ({ room, count }))
        .sort((a, b) => (b.count as number) - (a.count as number));

    // Activity Line Chart Data
    const year = activityChartMonth.getFullYear();
    const month = activityChartMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const activityLabels: string[] = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
    const activityDates: Date[] = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    
    const dailyActivity = new Map<string, number>();
    activityDates.forEach(date => dailyActivity.set(date.toISOString().split('T')[0], 0));

    const suspendedLecturerNames = new Set(allUsers.filter(u => u.role === 'lecturer' && u.isSuspended).map(u => u.name));
    const scheduledClasses = allClasses.filter(cls => 
        cls.status !== ClassStatus.Batal && 
        !cls.lecturers.some(lecturerName => suspendedLecturerNames.has(lecturerName))
    );

    scheduledClasses.forEach(cls => {
        const scheduledDate = new Date(cls.start);
        if (scheduledDate.getFullYear() === year && scheduledDate.getMonth() === month) {
            const dateKey = scheduledDate.toISOString().split('T')[0];
            if (dailyActivity.has(dateKey)) {
                dailyActivity.set(dateKey, dailyActivity.get(dateKey)! + 1);
            }
        }
    });

    const activityData = activityDates.map(date => dailyActivity.get(date.toISOString().split('T')[0]) || 0);

    return {
        titleSuffix,
        pieChartLabels, pieChartData, pieChartColors,
        sortedRoomUsage,
        activityLabels, activityDates, activityData,
    };
};

const getChartConfig = (type: string, data: any, options: any) => ({ type, data, options });

const AdminAppUsageView: React.FC<AdminAppUsageViewProps> = ({ allClasses, allUsers }) => {
    const statusChartRef = useRef<HTMLCanvasElement>(null);
    const roomUsageChartRef = useRef<HTMLCanvasElement>(null);
    const activityChartRef = useRef<HTMLCanvasElement>(null);
    const chartsContainerRef = useRef<HTMLDivElement>(null);
    const chartInstances = useRef<{ [key: string]: any }>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [activityChartMonth, setActivityChartMonth] = useState(new Date());
    const { theme, isDarkMode } = useTheme();
    const [roomUsageChartHeight, setRoomUsageChartHeight] = useState(250);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);


    useEffect(() => {
        const textColor = isDarkMode ? '#FFFFFF' : '#000000';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;
        
        const analytics = getChartAnalytics(allClasses, allUsers, selectedDate, activityChartMonth);

        const chartTitleOptions = { color: textColor, font: { size: 16 } };

        const statusConfig = getChartConfig('pie', 
            { labels: analytics.pieChartLabels.map(l => l.charAt(0).toUpperCase() + l.slice(1)), datasets: [{ data: analytics.pieChartData, backgroundColor: analytics.pieChartColors }] },
            { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: textColor } }, title: { display: true, text: `Distribusi Status Kelas ${analytics.titleSuffix}`, ...chartTitleOptions } } }
        );
        
        const roomUsageConfig = getChartConfig('bar',
            { labels: analytics.sortedRoomUsage.map(item => item.room), datasets: [{ label: 'Jumlah Kelas', data: analytics.sortedRoomUsage.map(item => item.count), backgroundColor: hexToRgba(theme.colors.primary, 0.6), borderColor: theme.colors.primary, borderWidth: 1 }] },
            { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: false } } }
        );

        const activityConfig = getChartConfig('line',
            { labels: analytics.activityLabels, datasets: [{ label: 'Jumlah Kelas Terjadwal', data: analytics.activityData, fill: false, borderColor: theme.colors.secondary, tension: 0.1 }] },
            { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: false } }, scales: { x: { ticks: { maxRotation: 0, minRotation: 0 } }, y: { beginAtZero: true, ticks: { precision: 0 } } },
                onClick: (_: any, elements: any[]) => { if (elements.length > 0) setSelectedDate(analytics.activityDates[elements[0].index].toISOString()); }
            }
        );

        const renderChart = (ref: React.RefObject<HTMLCanvasElement>, key: string, config: any) => {
            if (chartInstances.current[key]) chartInstances.current[key].destroy();
            if (ref.current) {
                const ctx = ref.current.getContext('2d');
                if (ctx) chartInstances.current[key] = new Chart(ctx, config);
            }
        };

        renderChart(statusChartRef, 'status', statusConfig);
        renderChart(roomUsageChartRef, 'roomUsage', roomUsageConfig);
        renderChart(activityChartRef, 'activity', activityConfig);

        const numRooms = analytics.sortedRoomUsage.length;
        const barHeight = 45;
        const xAxisHeight = 80;
        const calculatedHeight = Math.max(250, (numRooms * barHeight) + xAxisHeight);
        setRoomUsageChartHeight(calculatedHeight);

        return () => {
            Object.values(chartInstances.current).forEach((chart: any) => chart?.destroy());
        };

    }, [allClasses, allUsers, selectedDate, isDarkMode, activityChartMonth, theme]);

    const handleDownloadPdf = async () => {
        const { jsPDF } = jspdf;

        const createChartImage = (config: any, width: number, height: number, isDarkMode: boolean) => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.style.display = 'none';
            document.body.appendChild(canvas);
            
            const tempConfig = JSON.parse(JSON.stringify(config));
            tempConfig.options.animation = false;
            tempConfig.options.responsive = false;
            tempConfig.options.maintainAspectRatio = false;
            
            const textColor = isDarkMode ? '#FFFFFF' : '#000000';
            const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            Chart.defaults.color = textColor;
            Chart.defaults.borderColor = gridColor;

            const chart = new Chart(canvas.getContext('2d'), tempConfig);
            const imageUrl = chart.toBase64Image();
            chart.destroy();
            document.body.removeChild(canvas);
            return imageUrl;
        };
        
        const analytics = getChartAnalytics(allClasses, allUsers, selectedDate, activityChartMonth);
        const textColor = isDarkMode ? '#FFFFFF' : '#000000';
        const chartTitleOptions = { color: textColor, font: { size: 16 } };

        const statusConfig = getChartConfig('pie', 
            { labels: analytics.pieChartLabels.map(l => l.charAt(0).toUpperCase() + l.slice(1)), datasets: [{ data: analytics.pieChartData, backgroundColor: analytics.pieChartColors }] },
            { plugins: { legend: { position: 'top', labels: { color: textColor } }, title: { display: true, text: `Distribusi Status Kelas ${analytics.titleSuffix}`, ...chartTitleOptions } } }
        );
        const roomUsageConfig = getChartConfig('bar',
            { labels: analytics.sortedRoomUsage.map(item => item.room), datasets: [{ label: 'Jumlah Kelas', data: analytics.sortedRoomUsage.map(item => item.count), backgroundColor: hexToRgba(theme.colors.primary, 0.6), borderColor: theme.colors.primary, borderWidth: 1 }] },
            { indexAxis: 'y', plugins: { legend: { display: false } } }
        );
        const activityConfig = getChartConfig('line',
            { labels: analytics.activityLabels, datasets: [{ label: 'Jumlah Kelas Terjadwal', data: analytics.activityData, fill: false, borderColor: theme.colors.secondary, tension: 0.1 }] },
            { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        );
        
        const numRooms = analytics.sortedRoomUsage.length;
        const barHeight = 45;
        const xAxisHeight = 80;
        const calculatedRoomUsageHeight = Math.max(250, (numRooms * barHeight) + xAxisHeight);

        const chartImages = {
          activity: createChartImage(activityConfig, 1160, 500, isDarkMode),
          status: createChartImage(statusConfig, 568, 500, isDarkMode),
          roomUsage: createChartImage(roomUsageConfig, 568, calculatedRoomUsageHeight, isDarkMode),
        };

        const reportContainer = document.createElement('div');
        reportContainer.style.position = 'absolute';
        reportContainer.style.left = '-9999px';
        reportContainer.style.width = '1200px';
        reportContainer.style.padding = '20px';
        reportContainer.style.backgroundColor = isDarkMode ? '#121212' : '#E4E4E4';
        reportContainer.style.color = isDarkMode ? '#FFFFFF' : '#000000';
        reportContainer.style.fontFamily = "'Helvetica', 'Arial', sans-serif";
        document.body.appendChild(reportContainer);
        
        reportContainer.innerHTML = `
            <div style="display: flex; align-items: center; border-bottom: 2px solid ${isDarkMode ? '#FFF' : '#000'}; padding-bottom: 10px; margin-bottom: 20px;">
                <svg viewBox="0 0 125 100" xmlns="http://www.w3.org/2000/svg" style="width: 50px; height: 50px;">
                    <path d="M50 1 L100 50 L50 99 L1 50 Z" fill="#50B1F4" stroke="#2C508A" stroke-width="6" stroke-linejoin="round" />
                    <path d="M28 52 L48 72 L110 10" stroke="white" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                    <path d="M28 52 L48 72 L110 10" stroke="#2C508A" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                </svg>
                <div style="margin-left: 15px;">
                    <h1 style="font-size: 24px; font-weight: bold; margin: 0;">PAJAL</h1>
                    <p style="font-size: 16px; margin: 0;">Laporan Aktivitas Aplikasi</p>
                </div>
                <div style="margin-left: auto; text-align: right;">
                    <p style="margin:0; font-size: 14px;">Dicetak pada:</p>
                    <p style="margin:0; font-size: 14px;">${new Date().toLocaleString('id-ID')}</p>
                </div>
            </div>
            <div style="background-color: ${isDarkMode ? '#1E1E1E' : '#FFFFFF'}; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h2 style="font-weight: bold; font-size: 18px; text-align: center; margin-bottom: 8px;">${getDynamicActivityTitle()}</h2>
                <img src="${chartImages.activity}" style="width: 100%; height: auto;" />
            </div>
            <div style="display: flex; gap: 24px; align-items: flex-start;">
                <div style="background-color: ${isDarkMode ? '#1E1E1E' : '#FFFFFF'}; border-radius: 8px; padding: 16px; width: 50%; display: flex; flex-direction: column; align-items: center;">
                    <img src="${chartImages.status}" style="max-width: 400px; width: 100%; height: auto;" />
                </div>
                <div style="background-color: ${isDarkMode ? '#1E1E1E' : '#FFFFFF'}; border-radius: 8px; padding: 16px; width: 50%;">
                    <h2 style="font-weight: bold; font-size: 18px; text-align: center; margin-bottom: 8px;">Jumlah Kelas per Ruangan ${analytics.titleSuffix}</h2>
                    <img src="${chartImages.roomUsage}" style="width: 100%; height: auto;" />
                </div>
            </div>
        `;
        
        const canvas = await html2canvas(reportContainer, { scale: 2, useCORS: true, backgroundColor: isDarkMode ? '#121212' : '#E4E4E4' });
        document.body.removeChild(reportContainer);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / ratio;
        
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }
        
        const xOffset = (pdfWidth - imgWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, 10, imgWidth, imgHeight);
        pdf.save(`Laporan_Aktivitas_PAJAL_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handlePrevMonth = () => {
        setActivityChartMonth(current => {
            const newDate = new Date(current);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };
    
    const handleNextMonth = () => {
        setActivityChartMonth(current => {
            const newDate = new Date(current);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };

    const getDynamicActivityTitle = () => {
        const monthName = activityChartMonth.toLocaleString('id-ID', { month: 'long' });
        const year = activityChartMonth.getFullYear();
        return `Aktivitas Kelas (${monthName} ${year})`;
    };
    
    const titleSuffix = selectedDate 
        ? `pada ${new Date(selectedDate).toLocaleDateString('id-ID')}`
        : `(${activityChartMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })})`;

    return (
        <div className="w-full h-full flex flex-col bg-background text-text">
            <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} currentView={View.ADMIN_APP_USAGE} />
            <header className="bg-secondary p-4 shadow-md z-10 grid grid-cols-3 items-center text-text">
                <div className="justify-self-start"></div>
                <h1 
                    onClick={() => setIsInfoModalOpen(true)}
                    className="font-bold text-xl md:text-2xl justify-self-center cursor-pointer title-hover-underline"
                    role="button"
                    aria-label="Informasi Aktivitas"
                >
                    Aktivitas
                </h1>
                <div className="justify-self-end">
                    <button onClick={handleDownloadPdf} className="flex items-center space-x-2 bg-primary text-header-text font-semibold py-1 px-3 rounded-lg hover:bg-primary-dark transition-colors" aria-label="Download Laporan PDF">
                        <DownloadIcon className="w-4 h-4"/>
                        <span className="hidden sm:inline text-sm">Download PDF</span>
                    </button>
                </div>
            </header>
            <main className="flex-grow p-4 lg:p-6 overflow-auto no-scrollbar">
                {selectedDate && (
                    <div className="bg-primary/10 text-primary-dark p-3 rounded-lg mb-4 flex justify-between items-center animate-fadeIn">
                        <p className="font-semibold">
                            Menampilkan data untuk tanggal: <strong className="font-bold">{new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                        </p>
                        <button onClick={() => setSelectedDate(null)} className="font-bold bg-primary/20 hover:bg-primary/30 py-1 px-3 rounded-md transition-colors">Reset</button>
                    </div>
                )}
                <div ref={chartsContainerRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-card p-4 rounded-lg shadow-md lg:col-span-2 h-[40vh] lg:h-[45vh] flex flex-col">
                        <div className="flex justify-between items-center mb-2 px-2">
                            <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-black/10 transition-colors" aria-label="Bulan Sebelumnya">
                                <ChevronLeftIcon className="w-6 h-6" />
                            </button>
                            <h2 className="font-bold text-center text-base md:text-lg">{getDynamicActivityTitle()}</h2>
                            <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-black/10 transition-colors" aria-label="Bulan Berikutnya">
                                <ChevronRightIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-grow relative h-full">
                            <canvas ref={activityChartRef}></canvas>
                        </div>
                    </div>
                    <div className="bg-card p-4 rounded-lg shadow-md h-[40vh] lg:h-[45vh]">
                        <canvas ref={statusChartRef}></canvas>
                    </div>
                    <div className="bg-card p-4 rounded-lg shadow-md flex flex-col">
                        <h2 className="font-bold text-base text-center mb-2" style={{ color: isDarkMode ? '#FFF' : '#000' }}>
                            {`Jumlah Kelas per Ruangan ${titleSuffix}`}
                        </h2>
                        <div className="flex-grow relative" style={{ height: `${roomUsageChartHeight}px` }}>
                            <canvas ref={roomUsageChartRef}></canvas>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminAppUsageView;
