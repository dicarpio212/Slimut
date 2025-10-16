

import React, { useState } from 'react';
import type { Notification, ClassInstance, User } from '../types';
import { View } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './modals/ConfirmationModal';
import InformationCircleIcon from './icons/InformationCircleIcon';
import InfoModal from './modals/InfoModal';

interface NotificationsViewProps {
  user: User;
  setView: (view: View) => void;
  notifications: Notification[];
  allClasses: ClassInstance[];
  setSelectedClass: (cls: ClassInstance | null) => void;
  setPreviousView: (view: View) => void;
  markNotificationAsRead: (id: string) => void;
  deleteAllNotifications: () => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ user, setView, notifications, allClasses, setSelectedClass, setPreviousView, markNotificationAsRead, deleteAllNotifications }) => {
    const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    
    // FIX: Replaced `reduce` with a `forEach` loop for grouping notifications. This resolves a complex type inference issue where `notifs` was incorrectly typed as `unknown`, causing a crash when calling `.map()`.
    const groupedNotifications: Record<string, Notification[]> = {};
    notifications.forEach((notif) => {
        const dateKey = notif.date.toLocaleDateString('id-ID');
        if (!groupedNotifications[dateKey]) {
            groupedNotifications[dateKey] = [];
        }
        groupedNotifications[dateKey].push(notif);
    });

    const handleNotificationClick = (notif: Notification) => {
        markNotificationAsRead(notif.$id);
        const targetClass = allClasses.find(cls => cls.$id === notif.classId);
        if (targetClass) {
            setSelectedClass(targetClass);
            setPreviousView(View.NOTIFICATIONS);
            setView(View.CLASS_DETAIL);
        }
    }

    const handleBackToDashboard = () => {
        setView(View.DASHBOARD);
    }

    const handleDeleteAllConfirm = () => {
        deleteAllNotifications();
        setIsDeleteAllConfirmOpen(false);
    };

  return (
    <div className="w-full h-full flex flex-col bg-background">
       <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} currentView={View.NOTIFICATIONS} />
      <ConfirmationModal
        isOpen={isDeleteAllConfirmOpen}
        onClose={() => setIsDeleteAllConfirmOpen(false)}
        onConfirm={handleDeleteAllConfirm}
        title="Hapus semua notifikasi?"
      />
      {/* Header */}
      <header className="bg-secondary p-4 shadow-md z-10 grid grid-cols-3 items-center text-text">
        <div className="justify-self-start">
            {notifications.length > 0 ? (
                <button onClick={() => setIsDeleteAllConfirmOpen(true)} aria-label="Hapus semua notifikasi">
                    <TrashIcon className="w-7 h-7 md:w-8 md:h-8" />
                </button>
            ) : (
                <div className="w-7 h-7 md:w-8 md:h-8" />
            )}
        </div>
        <h1 
            onClick={() => setIsInfoModalOpen(true)}
            className="font-bold text-xl md:text-2xl justify-self-center cursor-pointer title-hover-underline"
            role="button"
            aria-label="Informasi Notifikasi"
        >
            Notifikasi
        </h1>
        <div className="justify-self-end">
            <button onClick={handleBackToDashboard} aria-label="Tutup Notifikasi">
                <XMarkIcon className="w-7 h-7 md:w-8 md:h-8" />
            </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow p-4 overflow-y-auto no-scrollbar">
        {Object.keys(groupedNotifications).length === 0 ? (
            <div className="text-center text-text-secondary mt-10 md:text-lg">
                <p>Tidak ada notifikasi.</p>
            </div>
        ) : (
           Object.entries(groupedNotifications)
            .sort(([dateA], [dateB]) => new Date(dateB.split('/').reverse().join('-')).getTime() - new Date(dateA.split('/').reverse().join('-')).getTime())
            .map(([date, notifs]) => (
                <div key={date} className="mb-6">
                    <p className="text-text-secondary font-semibold mb-2 ml-1 md:text-lg">{date}</p>
                    <div className="space-y-2">
                        {notifs.map((notif) => (
                            <div 
                                key={notif.$id} 
                                className={`bg-card rounded-lg p-4 shadow cursor-pointer transition text-text hover:bg-black/5 ${!notif.readBy.includes(user.id) ? 'font-bold' : 'font-normal'}`}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                <p className="truncate">{notif.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))
        )}
      </main>
    </div>
  );
};

export default NotificationsView;