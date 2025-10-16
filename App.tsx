import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, ClassStatus, UserRole } from './types';
import type { ClassInstance, Notification, User } from './types';
import { generateClassInstances, getClassStatus, normalizeName, formatShortTime } from './constants';
import { USERS_DATA } from './users';
import RealtimeHeader from './components/RealtimeHeader';
import Dashboard from './components/Dashboard';
import NotificationsView from './components/NotificationsView';
import CalendarView from './components/CalendarView';
import ClassDetailView from './components/ClassDetailView';
import HomeIcon from './components/icons/HomeIcon';
import BellIcon from './components/icons/BellIcon';
import CalendarIcon from './components/icons/CalendarIcon';
import Bars3Icon from './components/icons/Bars3Icon';
import ArchivedClassesView from './components/ArchivedClassesView';
import ArchiveBoxIcon from './components/icons/ArchiveBoxIcon';
import PaletteIcon from './components/icons/PaletteIcon';
import ThemeSelectorModal from './components/modals/ThemeSelectorModal';
import PlusCircleIcon from './components/icons/PlusCircleIcon';
import AddClassView from './components/AddClassView';
import SplashScreen from './components/SplashScreen';
import EditClassView from './components/EditClassView';
import Login from './components/Login';
import ProfileView from './components/ProfileView';
import UserCircleIcon from './components/icons/UserCircleIcon';
import AdminDashboard from './components/AdminDashboard';
import UsersIcon from './components/icons/UsersIcon';
import AdminUserDetailView from './components/AdminUserDetailView';
import AdminAppUsageView from './components/AdminAppUsageView';
import ChartBarIcon from './components/icons/ChartBarIcon';
import PajalIcon from './components/icons/PajalIcon';

type NewClassData = {
    name: string;
    start: Date;
    end: Date;
    location: string;
    note: string;
};

type FullNewClassData = NewClassData & { classTypes: string[] };

const isTimeOverlapping = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
    return start1 < end2 && start2 < end1;
};

const checkClassConflict = (
    newClass: NewClassData & { location: string }, 
    existingClasses: (ClassInstance | FullNewClassData)[], 
    lecturerName: string,
    classIdsToIgnore: string[] = []
): string | null => {
    const newStart = new Date(newClass.start);
    const newEnd = new Date(newClass.end);
    
    const normalizedLecturerName = normalizeName(lecturerName);

    for (const existingClass of existingClasses) {
        // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
        if ('$id' in existingClass && classIdsToIgnore.includes(existingClass.$id)) continue;
        if ('status' in existingClass && (existingClass.status === ClassStatus.Batal || existingClass.status === ClassStatus.Selesai)) continue;

        const existingStart = new Date(existingClass.start);
        const existingEnd = new Date(existingClass.end);
        
        if (newStart.toDateString() !== existingStart.toDateString()) continue;

        if (isTimeOverlapping(newStart, newEnd, existingStart, existingEnd)) {
            if (existingClass.location.toUpperCase() === newClass.location.toUpperCase()) {
                return `Jadwal bentrok: Ruang ${newClass.location} sudah digunakan oleh kelas "${existingClass.name}" pada waktu yang sama.`;
            }
            
            if ('lecturers' in existingClass) {
                const isLecturerInvolved = existingClass.lecturers.some(lec => normalizeName(lec) === normalizedLecturerName);
                if (isLecturerInvolved) {
                    return `Jadwal bentrok: Anda sudah memiliki jadwal lain (${existingClass.name} di Ruang ${existingClass.location}) pada waktu yang sama.`;
                }
            }
        }
    }

    return null; 
};

const getUpdatedUser = (user: User, currentDate: Date): User => {
    if (user.role !== 'student' || !user.classType || !user.registrationDate) {
        return user;
    }

    try {
        const registrationDate = new Date(user.registrationDate);
        
        const getPeriodInfo = (d: Date) => ({
            year: d.getFullYear(),
            // Jan-Jun is period 1 (even semester), Jul-Dec is period 2 (odd semester)
            period: d.getMonth() < 6 ? 1 : 2,
        });

        const registration = getPeriodInfo(registrationDate);
        const current = getPeriodInfo(currentDate);

        // Calculate total semesters passed since registration
        const periodsPassed = (current.year - registration.year) * 2 + (current.period - registration.period);

        const classLetterMatch = user.classType.match(/[A-D]$/i);
        const classLetter = classLetterMatch ? classLetterMatch[0].toUpperCase() : 'A';

        // Semester 1 is the base
        const currentSemester = 1 + periodsPassed;

        if (currentSemester > 0 && currentSemester <= 10) {
            const newClassType = `SK${currentSemester}${classLetter}`;
            return { ...user, classType: newClassType };
        }
    } catch (e) {
        console.error("Failed to update class type", e);
    }
    
    return user;
};


const App: React.FC = () => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isSplashScreen, setIsSplashScreen] = useState(true);
    const [view, setView] = useState<View>(View.DASHBOARD);
    const [lastView, setLastView] = useState<View>(View.DASHBOARD);
    const [allClasses, setAllClasses] = useState<ClassInstance[]>([]);
    const [archivedClassIds, setArchivedClassIds] = useState<Set<string>>(new Set());
    const [realtimeDate, setRealtimeDate] = useState(new Date());
    const [selectedClass, setSelectedClass] = useState<ClassInstance | null>(null);
    const [selectedUserByAdmin, setSelectedUserByAdmin] = useState<User | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [previousView, setPreviousView] = useState<View>(View.DASHBOARD);
    const [reminder, setReminder] = useState<number | null>(30);
    const [onScreenNotification, setOnScreenNotification] = useState<string | null>(null);
    const [studentDeletedClassIds, setStudentDeletedClassIds] = useState<Set<string>>(new Set());
    const [lecturerDeletedClassIds, setLecturerDeletedClassIds] = useState<Set<string>>(new Set());

    const [calendarDisplayDate, setCalendarDisplayDate] = useState<Date | null>(null);
    const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(null);
    
    // State for UI
    const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
    const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());

    const prevRealtimeDateRef = useRef<Date>(realtimeDate);

    useEffect(() => {
        const splashTimer = setTimeout(() => setIsSplashScreen(false), 2500);
        return () => clearTimeout(splashTimer);
    }, []);

    useEffect(() => {
        try {
            const savedUsersStr = localStorage.getItem('allUsers');
            if (savedUsersStr) {
                const users = JSON.parse(savedUsersStr).map((u: any) => {
                    if (!u.registrationDate) u.registrationDate = new Date('2024-01-01T00:00:00');
                    else u.registrationDate = new Date(u.registrationDate);
                    if (u.classType === undefined) u.classType = null;
                    u.isSuspended = u.isSuspended || false;
                    return u;
                });
                setAllUsers(users);
            } else {
                setAllUsers(USERS_DATA);
            }
        } catch (error) { console.error("Failed to load users", error); setAllUsers(USERS_DATA); }

        try {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                let user = JSON.parse(savedUser);
                if (!user.registrationDate) user.registrationDate = new Date('2024-01-01T00:00:00');
                else user.registrationDate = new Date(user.registrationDate);
                if (user.classType === undefined) user.classType = null;
                user.isSuspended = user.isSuspended || false;
                user = getUpdatedUser(user, new Date());
                setCurrentUser(user);
                if (user.role === 'administrator') {
                    handleSetView(View.ADMIN_APP_USAGE);
                } else if (user.nim_nip === '' || (user.role === 'student' && !user.classType)) {
                    handleSetView(View.PROFILE);
                }
            }
        } catch (error) { console.error("Could not load user", error); setCurrentUser(null); }

        try {
            const savedClassesStr = localStorage.getItem('allClasses');
            if (savedClassesStr) {
                const parsedClasses = JSON.parse(savedClassesStr);
                let finalClasses: any[] = [];
        
                // One-time migration for users with old data structure
                if (parsedClasses.length > 0 && parsedClasses[0].hasOwnProperty('classType')) {
                    const groups = new Map<string, any[]>();
                    const singles: any[] = [];
                    
                    parsedClasses.forEach((cls: any) => {
                        if (cls.groupId) {
                            if (!groups.has(cls.groupId)) {
                                groups.set(cls.groupId, []);
                            }
                            groups.get(cls.groupId)!.push(cls);
                        } else {
                            singles.push(cls);
                        }
                    });
        
                    singles.forEach(cls => {
                        finalClasses.push({
                            ...cls,
                            classTypes: [cls.classType],
                            classType: undefined,
                            groupId: undefined
                        });
                    });
        
                    groups.forEach(group => {
                        const representative = group[0];
                        finalClasses.push({
                            ...representative,
                            classTypes: group.map(c => c.classType).sort(),
                            classType: undefined,
                            groupId: undefined
                        });
                    });
                } else {
                    finalClasses = parsedClasses;
                }
        
                const classesWithDates = finalClasses.map((cls: any) => ({
                    ...cls,
                    start: new Date(cls.start),
                    end: new Date(cls.end),
                    createdAt: cls.createdAt ? new Date(cls.createdAt) : new Date(cls.start), // Migration for existing classes
                }));
                setAllClasses(classesWithDates);
            } else {
                setAllClasses(generateClassInstances());
            }
        } catch (error) { console.error("Failed to load classes", error); setAllClasses(generateClassInstances()); }

        try {
            const savedNotifsStr = localStorage.getItem('notifications');
            if (savedNotifsStr) {
                const parsedNotifs = JSON.parse(savedNotifsStr);
                const notifsWithDates = parsedNotifs.map((notif: any) => ({ ...notif, date: new Date(notif.date), readBy: notif.readBy || [], deletedBy: notif.deletedBy || [] }));
                setNotifications(notifsWithDates);
            }
        } catch (error) { console.error("Failed to load notifications", error); }

        try {
            const savedReminder = localStorage.getItem('reminder');
            if (savedReminder !== null) setReminder(JSON.parse(savedReminder));
        } catch (error) { console.error("Failed to load reminder", error); }
    }, []);
    
    useEffect(() => { if (allUsers.length > 0) localStorage.setItem('allUsers', JSON.stringify(allUsers)); }, [allUsers]);
    useEffect(() => { if (allClasses.length > 0) localStorage.setItem('allClasses', JSON.stringify(allClasses)); }, [allClasses]);
    useEffect(() => { localStorage.setItem('notifications', JSON.stringify(notifications)); }, [notifications]);
    useEffect(() => { localStorage.setItem('reminder', JSON.stringify(reminder)); }, [reminder]);

    useEffect(() => {
        if (currentUser) {
            const roleKey = currentUser.role === 'student' ? `deleted_classes_${currentUser.name}` : `deleted_classes_${currentUser.name}`;
            const archivedKey = `archived_classes_${currentUser.name}`;
            try {
                const savedDeleted = localStorage.getItem(roleKey);
                const deletedSetter = currentUser.role === 'student' ? setStudentDeletedClassIds : setLecturerDeletedClassIds;
                deletedSetter(savedDeleted ? new Set(JSON.parse(savedDeleted) as string[]) : new Set());

                const savedArchived = localStorage.getItem(archivedKey);
                setArchivedClassIds(savedArchived ? new Set(JSON.parse(savedArchived) as string[]) : new Set());
            } catch (error) {
                console.error("Failed to load user-specific data", error);
            }
        } else {
            setStudentDeletedClassIds(new Set());
            setLecturerDeletedClassIds(new Set());
            setArchivedClassIds(new Set());
        }
    }, [currentUser]);

    const allUserVisibleClasses = useMemo(() => {
        if (!currentUser || currentUser.role === 'administrator') return [];
        const suspendedLecturerNames = new Set(allUsers.filter(u => u.role === 'lecturer' && u.isSuspended).map(u => u.name));
        const deletedIds = currentUser.role === 'student' ? studentDeletedClassIds : lecturerDeletedClassIds;
        // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
        let classes = allClasses.filter(cls => !deletedIds.has(cls.$id));

        if (currentUser.role === 'student' && currentUser.registrationDate) {
            const registrationTime = new Date(currentUser.registrationDate).getTime();
            const cancellationTimes = new Map<string, number>();
            notifications.forEach(n => {
                if (n.message.includes('telah dibatalkan')) {
                    const existingTime = cancellationTimes.get(n.classId);
                    const notificationTime = new Date(n.date).getTime();
                    if (!existingTime || notificationTime < existingTime) cancellationTimes.set(n.classId, notificationTime);
                }
            });

            classes = classes.filter(cls => {
                if (cls.status === ClassStatus.Batal) {
                    // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
                    const cancelledAt = cancellationTimes.get(cls.$id);
                    if (cancelledAt && cancelledAt < registrationTime) return false;
                }
                return true;
            });
        }
        
        if (currentUser.role === 'lecturer') {
            const lecturerName = normalizeName(currentUser.name);
            classes = classes.filter(cls => cls.lecturers.some(lec => normalizeName(lec) === lecturerName));
        } else if (currentUser.role === 'student') {
            classes = classes.filter(cls => 
                cls.classTypes.includes(currentUser.classType!) &&
                !cls.lecturers.some(lecturerName => suspendedLecturerNames.has(lecturerName))
            );
        }
        
        return classes;
    }, [allClasses, allUsers, currentUser, studentDeletedClassIds, lecturerDeletedClassIds, notifications]);

    const userClasses = useMemo(() => {
        // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
        return allUserVisibleClasses.filter(cls => !archivedClassIds.has(cls.$id));
    }, [allUserVisibleClasses, archivedClassIds]);

    const userArchivedClasses = useMemo(() => {
        // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
        return allUserVisibleClasses.filter(cls => archivedClassIds.has(cls.$id));
    }, [allUserVisibleClasses, archivedClassIds]);

    const userNotifications = useMemo(() => {
        if (!currentUser || currentUser.role === 'administrator') return [];
        const registrationTime = currentUser.registrationDate ? new Date(currentUser.registrationDate).getTime() : 0;
        const timeFilteredNotifications = notifications.filter(n => new Date(n.date).getTime() >= registrationTime);
        // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
        const visibleClassIds = new Set(allUserVisibleClasses.map(c => c.$id));
        
        let relevantNotifications = timeFilteredNotifications.filter(n => 
            visibleClassIds.has(n.classId) && !n.deletedBy.includes(currentUser.id)
        );
        
        if (currentUser.role === 'lecturer') {
            relevantNotifications = relevantNotifications.filter(notif => !notif.message.includes("telah dibatalkan") && !notif.message.includes("mengalami perubahan"));
        }
        return relevantNotifications;
    }, [notifications, allUserVisibleClasses, currentUser]);

    useEffect(() => {
        const timer = setInterval(() => setRealtimeDate(prevDate => new Date(prevDate.getTime() + 1000)), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!allClasses.length) return;
        const currentDate = realtimeDate;
        let newNotifications: Notification[] = [];
        let didClassesUpdate = false;

        const updatedClasses = allClasses.map(cls => {
            if (cls.status === ClassStatus.Selesai || cls.status === ClassStatus.Batal) return cls;
            const newStatus = getClassStatus(cls, currentDate);
            
            if (cls.status !== newStatus) {
                didClassesUpdate = true;
                
                let message = '';
                if (newStatus === ClassStatus.Aktif) message = `Kelas ${cls.name} telah dimulai.`;
                else if (newStatus === ClassStatus.Selesai) message = `Kelas ${cls.name} telah berakhir.`;
                
                if (message) {
                    // FIX: Create a full Notification object satisfying the AppwriteDocument interface.
                    newNotifications.push({ 
                        $id: `notif-${cls.$id}-${newStatus}-${currentDate.getTime()}`, 
                        $createdAt: currentDate.toISOString(),
                        $updatedAt: currentDate.toISOString(),
                        $permissions: [],
                        $collectionId: 'notifications',
                        $databaseId: 'local',
                        classId: cls.$id, 
                        className: cls.name, 
                        message, 
                        date: currentDate, 
                        readBy: [],
                        deletedBy: [],
                    });
                }
                
                return { ...cls, status: newStatus };
            }
            return cls;
        });

        if (didClassesUpdate) {
            setAllClasses(updatedClasses);
            if (newNotifications.length > 0) {
                setNotifications(prev => [...newNotifications, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
            }
        }

        if (reminder !== null) {
            userClasses.forEach(cls => {
                if (cls.status === ClassStatus.Belum || cls.status === ClassStatus.Segera) {
                    const reminderTime = new Date(cls.start.getTime() - reminder * 60000);
                    if (currentDate.getTime() >= reminderTime.getTime() && currentDate.getTime() < reminderTime.getTime() + 1000) {
                        setOnScreenNotification(`🚨Kelas ${cls.name} akan dimulai🚨`);
                    }
                }
            });
        }
        prevRealtimeDateRef.current = currentDate;
    }, [realtimeDate]);

    // This effect ensures the student's class type is always up-to-date with the realtime clock.
    useEffect(() => {
        if (currentUser && currentUser.role === 'student') {
            const updatedUser = getUpdatedUser(currentUser, realtimeDate);
            if (updatedUser.classType !== currentUser.classType) {
                setCurrentUser(updatedUser);
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }
        }
    }, [realtimeDate, currentUser]);

    const handleLogin = (user: User) => {
        const updatedUser = getUpdatedUser(user, realtimeDate);
        if (user.classType !== updatedUser.classType) setAllUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        const historyStr = localStorage.getItem('login_history') || '[]';
        const history = JSON.parse(historyStr);
        if (user.role !== 'administrator' && !history.includes(user.name)) {
            history.unshift(user.name);
            localStorage.setItem('login_history', JSON.stringify(history.slice(0, 5)));
        }
        if (updatedUser.role === 'administrator') {
            handleSetView(View.ADMIN_APP_USAGE);
        } else if (updatedUser.nim_nip === '' || (updatedUser.role === 'student' && !updatedUser.classType)) {
            handleSetView(View.PROFILE);
        } else {
            setView(View.DASHBOARD);
        }
    };

    const handleRegister = (username: string): string | null => {
        const trimmedUsername = username.trim().toLowerCase();
        const allIdentities = new Set<string>();
        allUsers.forEach(u => { allIdentities.add(u.username.toLowerCase()); allIdentities.add(u.name.toLowerCase()); });
        if (allIdentities.has(trimmedUsername)) return "Username ini sudah digunakan atau sama dengan nama pengguna lain.";
        if (username.trim().length < 3) return "Username minimal 3 karakter.";
        // FIX: Add missing 'docId' and 'profilePicId' properties to satisfy the User type.
        const newUser: User = { 
            id: `user-${new Date().getTime()}`, 
            docId: `doc-user-${new Date().getTime()}`,
            username: username.trim(), 
            role: 'student', // Default role
            password_raw: '1234', // Default student password
            name: username.trim(), 
            nim_nip: '', 
            classType: null, 
            profilePic: null, 
            profilePicId: null,
            registrationDate: new Date(realtimeDate), 
            isSuspended: false 
        };
        const updatedUsers = [...allUsers, newUser];
        setAllUsers(updatedUsers);
        handleLogin(newUser);
        return null;
    };

    const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('currentUser'); setView(View.DASHBOARD); };

    // FIX: Make the function async to match the expected Promise return type in props.
    const updateUserProfile = async (updatedUser: User): Promise<string | null> => {
        const originalUser = allUsers.find(u => u.id === updatedUser.id);
        if (!originalUser) return "Pengguna tidak ditemukan.";

        const isNewUserSetup = originalUser.nim_nip === '';
        
        if (updatedUser.role === 'lecturer') {
            updatedUser.classType = null;
        }

        if (isNewUserSetup && updatedUser.role === 'student' && !updatedUser.classType) {
            return "Kategori Kelas wajib diisi untuk mahasiswa.";
        }

        const trimmedUsername = updatedUser.username.trim().toLowerCase();
        const trimmedName = updatedUser.name.trim().toLowerCase();
        const trimmedNimNip = updatedUser.nim_nip.trim();

        if (updatedUser.role === 'administrator' && trimmedUsername !== 'adminpajal') {
            return "Username admin tidak dapat diubah.";
        }
        
        const otherUsersIdentities = new Set<string>();
        allUsers.forEach(u => { if (u.id !== updatedUser.id) { otherUsersIdentities.add(u.username.toLowerCase()); otherUsersIdentities.add(u.name.toLowerCase()); } });
        if (otherUsersIdentities.has(trimmedUsername)) return "Username telah digunakan oleh pengguna lain.";
        if (updatedUser.role !== 'administrator' && otherUsersIdentities.has(trimmedName)) return "Nama Lengkap telah digunakan oleh pengguna lain.";
        if (originalUser.nim_nip !== trimmedNimNip || (originalUser.nim_nip === '' && trimmedNimNip !== '')) {
            if (allUsers.some(u => u.id !== updatedUser.id && u.nim_nip === trimmedNimNip)) return "NIM/NIP ini sudah digunakan oleh pengguna lain.";
        }
        
        if (isNewUserSetup && updatedUser.role === 'student' && updatedUser.classType) localStorage.setItem(`classType_last_update_${updatedUser.id}`, updatedUser.registrationDate.toISOString());
        if (originalUser.name !== updatedUser.name) setAllClasses(prevClasses => prevClasses.map(cls => ({ ...cls, lecturers: cls.lecturers.map(lecturer => lecturer === originalUser.name ? updatedUser.name : lecturer) })));
        
        if (isNewUserSetup && updatedUser.role === 'lecturer') {
            updatedUser.password_raw = '123456'; // Set lecturer default password
        }

        const updatedUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        setAllUsers(updatedUsers);
        setCurrentUser(updatedUser);
        localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setView(updatedUser.role === 'administrator' ? View.ADMIN_APP_USAGE : View.DASHBOARD);
        return null;
    };

    // FIX: Make the function async to match the expected Promise return type in props.
    const updateUserByAdmin = async (updatedUser: User): Promise<string | null> => {
        if (!currentUser || currentUser.role !== 'administrator') return "Akses ditolak.";
        
        const allOtherUsers = allUsers.filter(u => u.id !== updatedUser.id);
        if (allOtherUsers.some(u => u.username.toLowerCase() === updatedUser.username.toLowerCase())) return `Username "${updatedUser.username}" sudah digunakan.`;
        if (allOtherUsers.some(u => u.name.toLowerCase() === updatedUser.name.toLowerCase())) return `Nama "${updatedUser.name}" sudah digunakan.`;
        if (updatedUser.nim_nip && allOtherUsers.some(u => u.nim_nip === updatedUser.nim_nip)) return `NIM/NIP "${updatedUser.nim_nip}" sudah digunakan.`;
        
        const originalUser = allUsers.find(u => u.id === updatedUser.id);
        if (originalUser && originalUser.name !== updatedUser.name) {
            setAllClasses(prevClasses => prevClasses.map(cls => ({ ...cls, lecturers: cls.lecturers.map(lecturer => lecturer === originalUser.name ? updatedUser.name : lecturer) })));
        }

        if (originalUser && updatedUser.role === 'student' && originalUser.classType !== updatedUser.classType) {
            try {
                localStorage.setItem(`classType_last_update_${updatedUser.id}`, realtimeDate.toISOString());
            } catch (e) {
                console.error("Failed to update class type timestamp for user:", updatedUser.id, e);
            }
        }

        const updatedUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        setAllUsers(updatedUsers);
        return null;
    };
    
    const handleSuspendUser = (userId: string) => {
        setAllUsers(prevUsers => 
            prevUsers.map(u => 
                u.id === userId ? { ...u, isSuspended: !u.isSuspended } : u
            )
        );
    };

    const handleDeleteUser = (userId: string) => {
        const userToDelete = allUsers.find(u => u.id === userId);
        if (!userToDelete) return;

        if (userToDelete.role === 'lecturer') {
            setAllClasses(prevClasses => 
                prevClasses.filter(cls => !cls.lecturers.some(lec => lec === userToDelete.name))
            );
        }

        setAllUsers(prevUsers => prevUsers.filter(u => u.id !== userId));

        try {
            localStorage.removeItem(`archived_classes_${userToDelete.name}`);
            localStorage.removeItem(`deleted_classes_${userToDelete.name}`);
        } catch (error) {
            console.error("Failed to clean up user data from localStorage", error);
        }
    };


    const markNotificationAsRead = (notificationId: string) => { if (!currentUser) return; setNotifications(prev => prev.map(n => (n.$id === notificationId && !n.readBy.includes(currentUser.id)) ? { ...n, readBy: [...n.readBy, currentUser.id] } : n)); };
    const markAllNotificationsAsRead = () => { if (!currentUser) return; const userVisibleNotifIds = new Set(userNotifications.map(n => n.$id)); setNotifications(prev => prev.map(n => (userVisibleNotifIds.has(n.$id) && !n.readBy.includes(currentUser.id)) ? { ...n, readBy: [...n.readBy, currentUser.id] } : n)); };
    
    const deleteAllNotifications = () => {
        if (!currentUser) return;
        const userVisibleNotifIds = new Set(userNotifications.map(n => n.$id));
        setNotifications(prevNotifs => 
            prevNotifs.map(notif => {
                if (userVisibleNotifIds.has(notif.$id) && !notif.deletedBy.includes(currentUser.id)) {
                    return { ...notif, deletedBy: [...notif.deletedBy, currentUser.id] };
                }
                return notif;
            })
        );
    };

    const handleCloseDetail = () => { setLastView(View.CLASS_DETAIL); setView(previousView); };

    const archiveClass = (classId: string) => {
        if (!currentUser) return;
        const newArchivedIds = new Set(archivedClassIds);
        newArchivedIds.add(classId);
        setArchivedClassIds(newArchivedIds);
        localStorage.setItem(`archived_classes_${currentUser.name}`, JSON.stringify(Array.from(newArchivedIds)));
        if (view === View.CLASS_DETAIL) handleCloseDetail();
    };
    
    const cancelClass = (classId: string) => {
        // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
        const baseClass = allClasses.find(c => c.$id === classId);
        if (!baseClass || baseClass.status === ClassStatus.Selesai || baseClass.status === ClassStatus.Batal) {
            return;
        }
    
        setAllClasses(prevClasses => prevClasses.map(cls => 
            cls.$id === classId ? { ...cls, status: ClassStatus.Batal } : cls
        ));
    
        // FIX: Create a full Notification object satisfying the AppwriteDocument interface.
        const newNotification: Notification = {
            $id: `notif-${baseClass.$id}-${ClassStatus.Batal}-${realtimeDate.getTime()}`,
            $createdAt: realtimeDate.toISOString(),
            $updatedAt: realtimeDate.toISOString(),
            $permissions: [],
            $collectionId: 'notifications',
            $databaseId: 'local',
            classId: baseClass.$id,
            className: baseClass.name,
            message: `Kelas ${baseClass.name} telah dibatalkan.`,
            date: realtimeDate,
            readBy: [],
            deletedBy: [],
        };
        setNotifications(prev => [newNotification, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()));
    };

    const deleteClass = (classId: string) => {
        if (!currentUser) return;
        const deletedSetter = currentUser.role === 'student' ? setStudentDeletedClassIds : setLecturerDeletedClassIds;
        const deletedIds = currentUser.role === 'student' ? studentDeletedClassIds : lecturerDeletedClassIds;
        const newDeletedIds = new Set(deletedIds);
        newDeletedIds.add(classId);
        deletedSetter(newDeletedIds);
        localStorage.setItem(`deleted_classes_${currentUser.name}`, JSON.stringify(Array.from(newDeletedIds)));
        if (currentUser.role === 'lecturer') cancelClass(classId);
        // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
        if (view === View.CLASS_DETAIL && selectedClass?.$id === classId) handleCloseDetail();
    };

    const restoreClass = (classId: string) => {
        if (!currentUser) return;
        const newArchivedIds = new Set(archivedClassIds);
        newArchivedIds.delete(classId);
        setArchivedClassIds(newArchivedIds);
        localStorage.setItem(`archived_classes_${currentUser.name}`, JSON.stringify(Array.from(newArchivedIds)));
        if (view === View.CLASS_DETAIL) handleCloseDetail();
    };

    const deleteArchivedClass = (classId: string) => {
        if (!currentUser) return;
        const newArchivedIds = new Set(archivedClassIds);
        newArchivedIds.delete(classId);
        setArchivedClassIds(newArchivedIds);
        localStorage.setItem(`archived_classes_${currentUser.name}`, JSON.stringify(Array.from(newArchivedIds)));
        deleteClass(classId);
    };

    const handleSetView = (newView: View) => {
        if (currentUser && currentUser.role !== 'administrator' && currentUser.nim_nip === '' && view === View.PROFILE && newView !== View.PROFILE) {
            alert("Harap lengkapi dan simpan profil Anda untuk melanjutkan.");
            return; 
        }
        setLastView(view);
        setIsSelectionModeActive(false);
        setSelectedClassIds(new Set());
        if (newView === View.CALENDAR && calendarDisplayDate === null) setCalendarDisplayDate(new Date(realtimeDate));
        if (view === View.DASHBOARD && newView !== View.DASHBOARD) { setIsSearchActive(false); setSearchQuery(''); }
        if (view === View.NOTIFICATIONS && newView !== View.NOTIFICATIONS) markAllNotificationsAsRead();
        setView(newView);
    };

    const addClass = (classData: FullNewClassData): string | null => {
        if (!currentUser || currentUser.role !== 'lecturer') return "Hanya dosen yang bisa menambah kelas.";
        
        const startDateTime = new Date(classData.start);
        if (startDateTime < realtimeDate) return `Tidak dapat menjadwalkan kelas "${classData.name}" pada waktu yang sudah berlalu.`;
        const timeDifference = startDateTime.getTime() - realtimeDate.getTime();
        if (timeDifference < 30 * 60 * 1000) return `Kelas "${classData.name}" harus dijadwalkan minimal 30 menit dari sekarang.`;
        
        const conflictError = checkClassConflict(classData, allClasses, currentUser.name);
        if (conflictError) return conflictError;
    
        // FIX: Create a full ClassInstance object satisfying the AppwriteDocument interface.
        const newClass: ClassInstance = {
            $id: `${classData.name.replace(/\s/g, '')}-${new Date().getTime()}`,
            $createdAt: new Date().toISOString(),
            $updatedAt: new Date().toISOString(),
            $permissions: [],
            $collectionId: 'classes',
            $databaseId: 'local',
            createdAt: new Date(),
            ...classData,
            lecturers: [currentUser.name],
            // FIX: Cast object to 'any' to bypass strict type checking for the utility function.
            status: getClassStatus({ ...classData, createdAt: new Date(), status: ClassStatus.Belum } as any, realtimeDate),
        };
    
        setAllClasses(prev => [...prev, newClass].sort((a,b) => a.start.getTime() - b.start.getTime()));
        return null;
    };

    const addBatchClasses = (classesData: FullNewClassData[], rowNumbers: number[]): { successCount: number; errors: string[] } => {
        if (!currentUser || currentUser.role !== 'lecturer') {
            return { successCount: 0, errors: ["Hanya dosen yang bisa menambah kelas."] };
        }

        let tempAllClasses: (ClassInstance | FullNewClassData)[] = [...allClasses];
        const classesToAdd: ClassInstance[] = [];
        const finalErrors: string[] = [];
        let successfulAdds = 0;

        for (let i = 0; i < classesData.length; i++) {
            const classData = classesData[i];
            const rowNum = rowNumbers[i];
            
            const startDateTime = new Date(classData.start);
            if (startDateTime < realtimeDate) {
                finalErrors.push(`Baris ${rowNum}: Kelas "${classData.name}" dijadwalkan pada waktu yang sudah berlalu.`);
                continue;
            }
            
            const conflictError = checkClassConflict(classData, tempAllClasses, currentUser.name);
            if (conflictError) {
                finalErrors.push(`Baris ${rowNum} (${classData.name}): ${conflictError}`);
                continue;
            }

            // FIX: Create a full ClassInstance object satisfying the AppwriteDocument interface.
            const newClass: ClassInstance = {
                $id: `${classData.name.replace(/\s/g, '')}-${new Date().getTime()}-${i}`,
                $createdAt: new Date().toISOString(),
                $updatedAt: new Date().toISOString(),
                $permissions: [],
                $collectionId: 'classes',
                $databaseId: 'local',
                createdAt: new Date(),
                ...classData,
                lecturers: [currentUser.name],
                // FIX: Cast object to 'any' to bypass strict type checking for the utility function.
                status: getClassStatus({ ...classData, createdAt: new Date(), status: ClassStatus.Belum } as any, realtimeDate),
            };

            classesToAdd.push(newClass);
            tempAllClasses.push(newClass);
            successfulAdds++;
        }

        if (classesToAdd.length > 0) {
            setAllClasses(prev => [...prev, ...classesToAdd].sort((a, b) => a.start.getTime() - b.start.getTime()));
        }
        
        return { successCount: successfulAdds, errors: finalErrors };
    };

    const updateClass = (classToEdit: ClassInstance, updatedData: NewClassData & { classTypes: string[] }): string | null => {
        if (!currentUser || currentUser.role !== 'lecturer') return "Hanya dosen yang dapat mengubah kelas.";

        const startDateTime = new Date(updatedData.start);
        const endDateTime = new Date(updatedData.end);
        if (startDateTime < realtimeDate) return "Tidak dapat menjadwalkan kelas pada waktu yang sudah berlalu.";
        if (startDateTime.getTime() - realtimeDate.getTime() < 30 * 60 * 1000) return "Kelas harus dijadwalkan minimal 30 menit dari sekarang.";
        
        // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
        const conflictError = checkClassConflict(updatedData, allClasses, currentUser.name, [classToEdit.$id]);
        if (conflictError) return conflictError;

        const updatedClass: ClassInstance = {
            ...classToEdit,
            name: updatedData.name,
            classTypes: updatedData.classTypes,
            start: startDateTime,
            end: endDateTime,
            location: updatedData.location,
            note: updatedData.note,
            status: classToEdit.status,
        };
        updatedClass.status = getClassStatus(updatedClass, realtimeDate);

        setAllClasses(prevClasses => 
            // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
            prevClasses.map(c => c.$id === classToEdit.$id ? updatedClass : c)
            .sort((a,b) => a.start.getTime() - b.start.getTime())
        );

        const changes = [];
        if (classToEdit.name !== updatedData.name) changes.push('nama kelas');
        
        const oldTypes = new Set(classToEdit.classTypes);
        const newTypes = new Set(updatedData.classTypes);
        if (oldTypes.size !== newTypes.size || ![...oldTypes].every(type => newTypes.has(type)) || ![...newTypes].every(type => oldTypes.has(type))) {
            changes.push('kategori kelas');
        }
        
        const oldDate = new Date(classToEdit.start);
        const newDate = updatedData.start;
        const oldEndDate = new Date(classToEdit.end);
        const newEndDate = updatedData.end;
        if (oldDate.toDateString() !== newDate.toDateString() || formatShortTime(oldDate) !== formatShortTime(newDate) || formatShortTime(oldEndDate) !== formatShortTime(newEndDate)) {
            changes.push('jam kelas');
        }

        if (classToEdit.location.toUpperCase() !== updatedData.location.toUpperCase()) {
            changes.push('ruang kelas');
        }

        let changesString = '';
        if (changes.length > 0) {
            if (changes.length === 1) {
                changesString = changes[0];
            } else if (changes.length === 2) {
                changesString = `${changes[0]} dan ${changes[1]}`;
            } else {
                changesString = `${changes.slice(0, -1).join(', ')}, dan ${changes[changes.length - 1]}`;
            }
        } else if (classToEdit.note !== updatedData.note) {
            changesString = 'catatan';
        }
        
        if (changesString) {
            const notificationMessage = `Kelas ${updatedData.name} mengalami perubahan pada informasi ${changesString}.`;
            // FIX: Create a full Notification object satisfying the AppwriteDocument interface.
            const newNotification: Notification = {
                $id: `notif-edit-${classToEdit.$id}-${realtimeDate.getTime()}`,
                $createdAt: realtimeDate.toISOString(),
                $updatedAt: realtimeDate.toISOString(),
                $permissions: [],
                $collectionId: 'notifications',
                $databaseId: 'local',
                classId: classToEdit.$id,
                className: updatedData.name,
                message: notificationMessage,
                date: realtimeDate,
                readBy: [],
                deletedBy: [],
            };
            setNotifications(prev => [newNotification, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()));
        }
        
        return null;
    };
    
    const handleSetSelectedClass = (cls: ClassInstance | null) => {
        setSelectedClass(cls);
    };

    const toggleSelectedClass = (classId: string) => {
        setSelectedClassIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(classId)) {
                newSet.delete(classId);
            } else {
                newSet.add(classId);
            }
            return newSet;
        });
    };

    const clearSelectedClasses = () => { setSelectedClassIds(new Set()); setIsSelectionModeActive(false); };
    
    const archiveSelectedClasses = () => {
        if (!currentUser) return;
        const newArchivedIds = new Set(archivedClassIds);
        selectedClassIds.forEach((id) => newArchivedIds.add(id));
        setArchivedClassIds(newArchivedIds);
        localStorage.setItem(`archived_classes_${currentUser.name}`, JSON.stringify(Array.from(newArchivedIds)));
        clearSelectedClasses();
    };
    
    const deleteSelectedClasses = () => {
        if (!currentUser) return;
        if (currentUser.role === 'student') {
            setStudentDeletedClassIds(prevIds => {
                const newIds = new Set(prevIds);
                selectedClassIds.forEach((id: string) => newIds.add(id));
                localStorage.setItem(`deleted_classes_${currentUser.name}`, JSON.stringify(Array.from(newIds)));
                return newIds;
            });
        } else if (currentUser.role === 'lecturer') {
            setLecturerDeletedClassIds(prevIds => {
                const newIds = new Set(prevIds);
                selectedClassIds.forEach((id: string) => newIds.add(id));
                localStorage.setItem(`deleted_classes_${currentUser.name}`, JSON.stringify(Array.from(newIds)));
                return newIds;
            });

            const newNotifications: Notification[] = [];
            const updatedClasses = allClasses.map(cls => {
                // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
                if (selectedClassIds.has(cls.$id) && cls.status !== ClassStatus.Selesai && cls.status !== ClassStatus.Batal) {
                    // FIX: Create a full Notification object satisfying the AppwriteDocument interface.
                    newNotifications.push({ $id: `notif-${cls.$id}-${ClassStatus.Batal}-${realtimeDate.getTime()}`, $createdAt: realtimeDate.toISOString(), $updatedAt: realtimeDate.toISOString(), $permissions: [], $collectionId: 'notifications', $databaseId: 'local', classId: cls.$id, className: cls.name, message: `Kelas ${cls.name} telah dibatalkan.`, date: realtimeDate, readBy: [], deletedBy: [] });
                    return { ...cls, status: ClassStatus.Batal };
                }
                return cls;
            });

             if (newNotifications.length > 0) {
                setNotifications(prevNotifs => [...newNotifications, ...prevNotifs].sort((a, b) => b.date.getTime() - a.date.getTime()));
            }
            setAllClasses(updatedClasses);
        }
        clearSelectedClasses();
    };

    const cancelSelectedClasses = () => {
        const newNotifications: Notification[] = [];

        const updatedClasses = allClasses.map(cls => {
            // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
            if (selectedClassIds.has(cls.$id) && cls.status !== ClassStatus.Selesai && cls.status !== ClassStatus.Batal) {
                // FIX: Create a full Notification object satisfying the AppwriteDocument interface.
                newNotifications.push({ $id: `notif-${cls.$id}-${ClassStatus.Batal}-${realtimeDate.getTime()}`, $createdAt: realtimeDate.toISOString(), $updatedAt: realtimeDate.toISOString(), $permissions: [], $collectionId: 'notifications', $databaseId: 'local', classId: cls.$id, className: cls.name, message: `Kelas ${cls.name} telah dibatalkan.`, date: realtimeDate, readBy: [], deletedBy: [] });
                return { ...cls, status: ClassStatus.Batal };
            }
            return cls;
        });

        if (newNotifications.length > 0) {
            setNotifications(prevNotifs => [...newNotifications, ...prevNotifs].sort((a, b) => b.date.getTime() - a.date.getTime()));
        }
        setAllClasses(updatedClasses);
        clearSelectedClasses();
    };

    const restoreSelectedClasses = () => {
        if (!currentUser) return;
        const newArchivedIds = new Set(archivedClassIds);
        selectedClassIds.forEach((id) => newArchivedIds.delete(id));
        setArchivedClassIds(newArchivedIds);
        localStorage.setItem(`archived_classes_${currentUser.name}`, JSON.stringify(Array.from(newArchivedIds)));
        clearSelectedClasses();
    };
    
    const deleteSelectedArchivedClasses = () => {
        if (!currentUser) return;
        setArchivedClassIds(prevIds => {
            const newIds = new Set(prevIds);
            selectedClassIds.forEach((id) => newIds.delete(id));
            localStorage.setItem(`archived_classes_${currentUser.name}`, JSON.stringify(Array.from(newIds)));
            return newIds;
        });
        if (currentUser.role === 'student') {
            setStudentDeletedClassIds(prevIds => {
                const newIds = new Set(prevIds);
                selectedClassIds.forEach((id: string) => newIds.add(id));
                localStorage.setItem(`deleted_classes_${currentUser.name}`, JSON.stringify(Array.from(newIds)));
                return newIds;
            });
        } else if (currentUser.role === 'lecturer') {
            setLecturerDeletedClassIds(prevIds => {
                const newIds = new Set(prevIds);
                selectedClassIds.forEach((id: string) => newIds.add(id));
                localStorage.setItem(`deleted_classes_${currentUser.name}`, JSON.stringify(Array.from(newIds)));
                return newIds;
            });
            const newNotifications: Notification[] = [];
            const updatedClasses = allClasses.map(cls => {
                // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
                if (selectedClassIds.has(cls.$id) && cls.status !== ClassStatus.Selesai && cls.status !== ClassStatus.Batal) {
                    // FIX: Create a full Notification object satisfying the AppwriteDocument interface.
                    newNotifications.push({ $id: `notif-${cls.$id}-${ClassStatus.Batal}-${realtimeDate.getTime()}`, $createdAt: realtimeDate.toISOString(), $updatedAt: realtimeDate.toISOString(), $permissions: [], $collectionId: 'notifications', $databaseId: 'local', classId: cls.$id, className: cls.name, message: `Kelas ${cls.name} telah dibatalkan.`, date: realtimeDate, readBy: [], deletedBy: [] });
                    return { ...cls, status: ClassStatus.Batal };
                }
                return cls;
            });
            if (newNotifications.length > 0) {
                setNotifications(prevNotifs => [...newNotifications, ...prevNotifs].sort((a, b) => b.date.getTime() - a.date.getTime()));
            }
            setAllClasses(updatedClasses);
        }
        clearSelectedClasses();
    };

    const handleSelectUserByAdmin = (user: User) => {
        setSelectedUserByAdmin(user);
        handleSetView(View.ADMIN_USER_DETAIL);
    };

    const renderView = () => {
        if (!currentUser) return null;
        switch (view) {
            case View.DASHBOARD:
                return <Dashboard 
                    user={currentUser} allUsers={allUsers.filter(u => u.role !== 'administrator')} onProfileClick={() => handleSetView(View.PROFILE)}
                    setView={handleSetView} setSelectedClass={handleSetSelectedClass} setPreviousView={setPreviousView}
                    allClasses={userClasses} realtimeDate={realtimeDate} notifications={notifications}
                    isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    reminder={reminder} setReminder={setReminder} archiveClass={archiveClass} deleteClass={deleteClass} cancelClass={cancelClass}
                    isSelectionModeActive={isSelectionModeActive} setIsSelectionModeActive={setIsSelectionModeActive}
                    selectedClassIds={selectedClassIds} toggleSelectedClass={toggleSelectedClass} clearSelectedClasses={clearSelectedClasses}
                    archiveSelectedClasses={archiveSelectedClasses} deleteSelectedClasses={deleteSelectedClasses} cancelSelectedClasses={cancelSelectedClasses} setSelectedClassIds={setSelectedClassIds}
                />;
            case View.NOTIFICATIONS:
                return <NotificationsView user={currentUser} setView={handleSetView} notifications={userNotifications} allClasses={allUserVisibleClasses} setSelectedClass={handleSetSelectedClass} setPreviousView={setPreviousView} markNotificationAsRead={markNotificationAsRead} deleteAllNotifications={deleteAllNotifications} />;
            case View.CALENDAR:
                return <CalendarView 
                    user={currentUser} allUsers={allUsers.filter(u => u.role !== 'administrator')} setView={handleSetView} allClasses={userClasses}
                    realtimeDate={realtimeDate} setSelectedClass={handleSetSelectedClass} setPreviousView={setPreviousView}
                    displayDate={calendarDisplayDate} setDisplayDate={setCalendarDisplayDate} selectedDate={calendarSelectedDate} setSelectedDate={setCalendarSelectedDate}
                    archiveClass={archiveClass} deleteClass={deleteClass} cancelClass={cancelClass}
                    isSelectionModeActive={isSelectionModeActive} setIsSelectionModeActive={setIsSelectionModeActive}
                    selectedClassIds={selectedClassIds} toggleSelectedClass={toggleSelectedClass} clearSelectedClasses={clearSelectedClasses}
                    archiveSelectedClasses={archiveSelectedClasses} deleteSelectedClasses={deleteSelectedClasses} cancelSelectedClasses={cancelSelectedClasses} setSelectedClassIds={setSelectedClassIds}
                />
            case View.CLASS_DETAIL:
                if (selectedClass) {
                    // FIX: Property 'id' does not exist on type 'ClassInstance'. Use '$id' instead.
                    const isArchived = userArchivedClasses.some(c => c.$id === selectedClass.$id);
                    return <ClassDetailView user={currentUser} classData={selectedClass} onClose={handleCloseDetail} archiveClass={archiveClass} restoreClass={restoreClass} isArchived={isArchived} />
                }
                handleSetView(View.DASHBOARD); return null;
            case View.ARCHIVED_CLASSES:
                return <ArchivedClassesView 
                    user={currentUser} setView={handleSetView} archivedClasses={userArchivedClasses}
                    setSelectedClass={handleSetSelectedClass} setPreviousView={setPreviousView}
                    restoreClass={restoreClass} deleteArchivedClass={deleteArchivedClass} allUsers={allUsers.filter(u => u.role !== 'administrator')}
                    isSelectionModeActive={isSelectionModeActive} setIsSelectionModeActive={setIsSelectionModeActive}
                    selectedClassIds={selectedClassIds} toggleSelectedClass={toggleSelectedClass} clearSelectedClasses={clearSelectedClasses}
                    restoreSelectedClasses={restoreSelectedClasses} deleteSelectedArchivedClasses={deleteSelectedArchivedClasses} setSelectedClassIds={setSelectedClassIds}
                />
            case View.PROFILE:
                return <ProfileView user={currentUser} onUpdateProfile={updateUserProfile as any} onLogout={handleLogout} onClose={() => handleSetView(currentUser.role === 'administrator' ? View.ADMIN_APP_USAGE : View.DASHBOARD)} realtimeDate={realtimeDate} />;
            case View.ADD_CLASS:
                return <AddClassView setView={handleSetView} addClass={addClass} addBatchClasses={addBatchClasses} realtimeDate={realtimeDate} />
            case View.EDIT_CLASS:
                if (selectedClass) return <EditClassView setView={handleSetView} updateClass={updateClass} classToEdit={selectedClass} realtimeDate={realtimeDate} />
                handleSetView(View.DASHBOARD); return null;
            case View.ADMIN_APP_USAGE:
                return <AdminAppUsageView allClasses={allClasses} allUsers={allUsers} />;
            case View.ADMIN_DASHBOARD:
                return <AdminDashboard adminUser={currentUser} allUsers={allUsers} onUpdateUserByAdmin={updateUserByAdmin as any} setView={handleSetView} onLogout={handleLogout} onSelectUser={handleSelectUserByAdmin} realtimeDate={realtimeDate} onSuspendUser={handleSuspendUser} onDeleteUser={handleDeleteUser}/>;
            case View.ADMIN_USER_DETAIL:
                const processedSelectedUser = selectedUserByAdmin ? getUpdatedUser(selectedUserByAdmin, realtimeDate) : null;
                if (processedSelectedUser) {
                    return <AdminUserDetailView 
                        user={processedSelectedUser} 
                        allClasses={allClasses} 
                        onClose={() => handleSetView(View.ADMIN_DASHBOARD)}
                        setView={setView}
                        setSelectedClass={setSelectedClass}
                        setPreviousView={setPreviousView}
                    />;
                }
                handleSetView(View.ADMIN_DASHBOARD); return null;
            default: return null;
        }
    };

    if (isSplashScreen) return <SplashScreen />;
    if (!currentUser) return <Login onLogin={handleLogin} onRegister={handleRegister} allUsers={allUsers} realtimeDate={realtimeDate} />;
    
    let animationClass = '';
    if (view === View.CLASS_DETAIL) animationClass = 'animate-fade-in-detail';
    else if (lastView !== View.LOGIN) animationClass = 'animate-fade-in-view';
    
    const sidebarButtonJustifyClass = isDesktopSidebarCollapsed ? 'justify-center' : 'justify-start';
    const sidebarButtonClass = `flex items-center p-2 rounded-lg hover:bg-primary-hover w-full transition-colors font-medium text-text ${sidebarButtonJustifyClass}`;
    const activeSidebarButtonClass = `flex items-center p-2 rounded-lg bg-primary text-header-text w-full font-bold ${sidebarButtonJustifyClass}`;
    const iconClass = "w-8 h-8 flex-shrink-0";
    const buttonTextClass = `text-base whitespace-nowrap overflow-hidden transition-all duration-150 ${isDesktopSidebarCollapsed ? 'w-0 opacity-0' : 'opacity-100 ml-4'}`;
    const profileTextClass = `flex flex-col items-start text-left whitespace-nowrap overflow-hidden transition-all duration-150 ${isDesktopSidebarCollapsed ? 'w-0 opacity-0' : 'opacity-100 ml-3'}`;
    const footerButtonClass = "flex flex-col items-center justify-center h-full w-full rounded-lg transition-colors duration-200";
    const activeFooterButtonClass = "bg-primary text-header-text";
    const inactiveFooterButtonClass = "text-text";

    const renderAdminLayout = () => (
        <div className="flex flex-col h-full w-full bg-card animate-fade-in-slow">
            <RealtimeHeader realtimeDate={realtimeDate} setRealtimeDate={setRealtimeDate} currentView={view} />
            <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                <aside className={`hidden lg:flex flex-col bg-secondary p-4 space-y-2 shadow-md z-30 ${isDesktopSidebarCollapsed ? 'w-24' : 'w-64'} transition-all duration-150 ease-in-out`}>
                    <div className={`flex items-center pb-4 ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-start'}`}>
                        <button onClick={() => setIsDesktopSidebarCollapsed(prev => !prev)} aria-label="Ubah navigasi" className="text-header-text p-1"><Bars3Icon className="w-7 h-7" /></button>
                        <div className={`flex items-center overflow-hidden transition-all duration-150 ${isDesktopSidebarCollapsed ? 'w-0 opacity-0' : 'opacity-100 ml-2'}`}>
                            <PajalIcon className="w-8 h-8 flex-shrink-0" />
                            <span className="text-2xl font-bold text-white ml-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>PAJAL</span>
                        </div>
                    </div>
                    <button onClick={() => handleSetView(View.ADMIN_APP_USAGE)} className={view === View.ADMIN_APP_USAGE ? activeSidebarButtonClass : sidebarButtonClass} disabled={view === View.ADMIN_APP_USAGE}> <ChartBarIcon className={iconClass} /> <span className={buttonTextClass}>Aktivitas</span> </button>
                    <button onClick={() => handleSetView(View.ADMIN_DASHBOARD)} className={view === View.ADMIN_DASHBOARD ? activeSidebarButtonClass : sidebarButtonClass} disabled={view === View.ADMIN_DASHBOARD}> <UsersIcon className={iconClass} /> <span className={buttonTextClass}>Pengguna</span> </button>
                    <div className="flex-grow"></div>
                    <button onClick={() => setIsThemeModalOpen(true)} className={sidebarButtonClass} aria-label="Pilih tema"> <PaletteIcon className={iconClass} /> <span className={buttonTextClass}>Ganti Tema</span> </button>
                    <div className={`flex items-center p-2 mt-4 rounded-lg cursor-pointer hover:bg-black/20 ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-start'}`} onClick={() => handleSetView(View.PROFILE)}>
                        {currentUser.profilePic ? ( <img src={currentUser.profilePic} alt="Profil" className="w-12 h-12 rounded-full flex-shrink-0 object-cover" /> ) : ( <UserCircleIcon className="w-12 h-12 text-text flex-shrink-0" /> )}
                        <div className={profileTextClass}> <p className="font-bold text-sm text-text truncate">{currentUser.name}</p> <p className="text-xs text-text capitalize">{currentUser.role}</p> </div>
                    </div>
                </aside>
                 <main className="flex-1 relative overflow-hidden"> <div key={view} className={`w-full absolute top-0 left-0 right-0 bottom-0 ${animationClass}`}> {renderView()} </div> </main>
                <footer className="lg:hidden flex-shrink-0 w-full h-16 bg-secondary grid grid-cols-4 justify-items-center items-center shadow-[0_-2px_5px_rgba(0,0,0,0.1)] z-30">
                    <button onClick={() => handleSetView(View.ADMIN_APP_USAGE)} className={`${footerButtonClass} ${view === View.ADMIN_APP_USAGE ? activeFooterButtonClass : inactiveFooterButtonClass}`}> <ChartBarIcon className="w-6 h-6" /> <span className="text-xs font-bold">Aktivitas</span> </button>
                    <button onClick={() => handleSetView(View.ADMIN_DASHBOARD)} className={`${footerButtonClass} ${view === View.ADMIN_DASHBOARD ? activeFooterButtonClass : inactiveFooterButtonClass}`}> <UsersIcon className="w-6 h-6" /> <span className="text-xs font-bold">Pengguna</span> </button>
                    <button onClick={() => setIsThemeModalOpen(true)} className={`${footerButtonClass} ${inactiveFooterButtonClass}`}> <PaletteIcon className="w-6 h-6" /> <span className="text-xs font-bold">Tema</span> </button>
                    <button onClick={() => handleSetView(View.PROFILE)} className={`${footerButtonClass} ${view === View.PROFILE ? activeFooterButtonClass : inactiveFooterButtonClass}`}> <UserCircleIcon className="w-6 h-6" /> <span className="text-xs font-bold">Profil</span> </button>
                </footer>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-screen flex flex-col antialiased bg-background">
            <ThemeSelectorModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
            {onScreenNotification && ( <div onClick={() => setOnScreenNotification(null)} className="absolute top-5 left-1/2 -translate-x-1/2 w-[95%] h-[10vh] bg-card rounded-lg shadow-2xl z-50 animate-slide-down cursor-pointer flex items-center justify-center p-2"> <p className="text-center font-bold text-text text-2xl md:text-4xl leading-tight">{onScreenNotification}</p> </div> )}
            
            {currentUser.role === 'administrator' ? (
                renderAdminLayout()
            ) : (
                 <div className="flex flex-col h-full w-full bg-card animate-fade-in-slow">
                    <RealtimeHeader realtimeDate={realtimeDate} setRealtimeDate={setRealtimeDate} currentView={view} />
                    <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                        <aside className={`hidden lg:flex flex-col bg-secondary p-4 space-y-2 shadow-md z-30 ${isDesktopSidebarCollapsed ? 'w-24' : 'w-64'} transition-all duration-150 ease-in-out`}>
                            <div className={`flex items-center pb-4 ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-start'}`}>
                                <button onClick={() => setIsDesktopSidebarCollapsed(prev => !prev)} aria-label="Ubah navigasi" className="text-header-text p-1"><Bars3Icon className="w-7 h-7" /></button>
                                <div className={`flex items-center overflow-hidden transition-all duration-150 ${isDesktopSidebarCollapsed ? 'w-0 opacity-0' : 'opacity-100 ml-2'}`}>
                                    <PajalIcon className="w-8 h-8 flex-shrink-0" />
                                    <span className="text-2xl font-bold text-white ml-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>PAJAL</span>
                                </div>
                            </div>
                            <button onClick={() => handleSetView(View.DASHBOARD)} className={view === View.DASHBOARD ? activeSidebarButtonClass : sidebarButtonClass} disabled={view === View.DASHBOARD}> <HomeIcon className={iconClass} /> <span className={buttonTextClass}>Dashboard</span> </button>
                            {currentUser.role === 'lecturer' && ( <button onClick={() => handleSetView(View.ADD_CLASS)} className={view === View.ADD_CLASS ? activeSidebarButtonClass : sidebarButtonClass} aria-label="Tambah Kelas"> <PlusCircleIcon className={iconClass} /> <span className={buttonTextClass}>Tambah Kelas</span> </button> )}
                            <button onClick={() => handleSetView(View.CALENDAR)} className={view === View.CALENDAR ? activeSidebarButtonClass : sidebarButtonClass} aria-label="Buka kalender"> <CalendarIcon className={iconClass} /> <span className={buttonTextClass}>Kalender</span> </button>
                            <button onClick={() => handleSetView(View.ARCHIVED_CLASSES)} className={view === View.ARCHIVED_CLASSES ? activeSidebarButtonClass : sidebarButtonClass} aria-label="Buka arsip"> <ArchiveBoxIcon className={iconClass} /> <span className={buttonTextClass}>Arsip</span> </button>
                            <button onClick={() => handleSetView(View.NOTIFICATIONS)} className={view === View.NOTIFICATIONS ? activeSidebarButtonClass : sidebarButtonClass} aria-label="Lihat notifikasi"> <div className="relative"> <BellIcon className={iconClass} /> {userNotifications.filter(n => !n.readBy.includes(currentUser.id)).length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{userNotifications.filter(n => !n.readBy.includes(currentUser.id)).length}</span> } </div> <span className={buttonTextClass}>Notifikasi</span> </button>
                            <div className="flex-grow"></div>
                            <button onClick={() => setIsThemeModalOpen(true)} className={sidebarButtonClass} aria-label="Pilih tema"> <PaletteIcon className={iconClass} /> <span className={buttonTextClass}>Ganti Tema</span> </button>
                            <div className={`flex items-center p-2 mt-4 rounded-lg cursor-pointer hover:bg-black/20 ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-start'}`} onClick={() => handleSetView(View.PROFILE)}>
                                {currentUser.profilePic ? ( <img src={currentUser.profilePic} alt="Profil" className="w-12 h-12 rounded-full flex-shrink-0 object-cover" /> ) : ( <UserCircleIcon className="w-12 h-12 text-text flex-shrink-0" /> )}
                                <div className={profileTextClass}> <p className="font-bold text-sm text-text truncate">{currentUser.name}</p> <p className="text-xs text-text capitalize">{currentUser.role}</p> </div>
                            </div>
                        </aside>
                        <main className="flex-1 relative overflow-hidden"> <div key={view} className={`w-full absolute top-0 left-0 right-0 bottom-0 ${animationClass}`}> {renderView()} </div> </main>
                        <footer className="lg:hidden flex-shrink-0 w-full h-16 bg-secondary grid grid-cols-5 justify-items-center items-center shadow-[0_-2px_5px_rgba(0,0,0,0.1)] z-30">
                            <button onClick={() => handleSetView(View.DASHBOARD)} className={`${footerButtonClass} ${view === View.DASHBOARD ? activeFooterButtonClass : inactiveFooterButtonClass}`}> <HomeIcon className="w-6 h-6" /> <span className="text-xs font-bold">Dashboard</span> </button>
                            <button onClick={() => handleSetView(View.CALENDAR)} className={`${footerButtonClass} ${view === View.CALENDAR ? activeFooterButtonClass : inactiveFooterButtonClass}`}> <CalendarIcon className="w-6 h-6" /> <span className="text-xs font-bold">Kalender</span> </button>
                            <button onClick={() => setIsThemeModalOpen(true)} className={`${footerButtonClass} ${inactiveFooterButtonClass}`}> <PaletteIcon className="w-6 h-6" /> <span className="text-xs font-bold">Tema</span> </button>
                            <button onClick={() => handleSetView(View.ARCHIVED_CLASSES)} className={`${footerButtonClass} ${view === View.ARCHIVED_CLASSES ? activeFooterButtonClass : inactiveFooterButtonClass}`}> <ArchiveBoxIcon className="w-6 h-6" /> <span className="text-xs font-bold">Arsip</span> </button>
                            <button onClick={() => handleSetView(View.NOTIFICATIONS)} className={`${footerButtonClass} ${view === View.NOTIFICATIONS ? activeFooterButtonClass : inactiveFooterButtonClass}`}> <div className="relative"> <BellIcon className="w-6 h-6" /> {userNotifications.filter(n => !n.readBy.includes(currentUser.id)).length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">{userNotifications.filter(n => !n.readBy.includes(currentUser.id)).length}</span> } </div> <span className="text-xs font-bold">Notifikasi</span> </button>
                        </footer>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-in-slow { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-slow { animation: fade-in-slow 0.9s ease-in-out; }
                .animate-fade-in-view { animation: fadeIn 0.2s ease-out; }
                .animate-fade-in-detail { animation: fadeIn 0.4s ease-out; }
                @keyframes slide-down { from { transform: translate(-50%, -150%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
                .animate-slide-down { animation: slide-down 0.2s ease-out; }
                @keyframes slide-up { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-slide-up { animation: slide-up 0.27s ease-out; }
                .animate-modal-appear { animation: slide-up 0.27s ease-out; }
                @keyframes slide-up-out { from { transform: translateY(0); opacity: 1; } to { transform: translateY(50px); opacity: 0; } }
                .animate-slide-up-out { animation: slide-up-out 0.27s ease-out forwards; }
                @keyframes slide-out-to-right-desktop { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100%); } }
                @keyframes slide-in-from-right-desktop { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
                @media (min-width: 1024px) { .animate-slide-up { animation: slide-in-from-right-desktop 0.375s ease-out; } .animate-slide-up-out { animation: slide-out-to-right-desktop 0.375s ease-out forwards; } }
                @keyframes dropdown { from { opacity: 0; transform: scaleY(0.95) translateY(-10px); } to { opacity: 1; transform: scaleY(1) translateY(0); } }
                .animate-dropdown { animation: dropdown 0.2s ease-out; transform-origin: top; }
                @keyframes card-exit-animation { to { opacity: 0; transform: scale(0.9); height: 0; padding-top: 0; padding-bottom: 0; margin-top: 0; margin-bottom: 0; border-width: 0; } }
                .animate-card-exit { animation: card-exit-animation 0.2s ease-out forwards; overflow: hidden; }
                @keyframes card-exit-left-animation { to { opacity: 0; transform: translateX(-100px) scale(0.95); height: 0; padding-top: 0; padding-bottom: 0; margin-top: 0; margin-bottom: 0; border-width: 0; } }
                .animate-card-exit-left { animation: card-exit-left-animation 0.2s ease-out forwards; overflow: hidden; }
                @keyframes card-exit-restore-animation { to { opacity: 0; transform: scale(1.05); height: 0; padding-top: 0; padding-bottom: 0; margin-top: 0; margin-bottom: 0; border-width: 0; } }
                .animate-card-exit-restore { animation: card-exit-restore-animation 0.2s ease-out forwards; overflow: hidden; }
                @keyframes splash-fade { 0% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
                .animate-splash { animation: splash-fade 2.5s ease-in-out forwards; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .title-hover-underline { position: relative; display: inline-block; }
                .title-hover-underline::after { content: ''; position: absolute; width: 100%; transform: scaleX(0); height: 2px; bottom: -4px; left: 0; background-color: currentColor; transform-origin: center; transition: transform 0.2s ease-in-out; }
                .title-hover-underline:hover::after { transform: scaleX(1); }
            `}</style>
        </div>
    );
};

export default App;
