
export enum View {
  LOGIN,
  DASHBOARD,
  NOTIFICATIONS,
  CALENDAR,
  CLASS_DETAIL,
  ARCHIVED_CLASSES,
  ADD_CLASS,
  EDIT_CLASS,
  PROFILE,
  ADMIN_APP_USAGE,
  ADMIN_DASHBOARD,
  ADMIN_USER_DETAIL,
}

export interface AppwriteDocument {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    $collectionId: string;
    $databaseId: string;
}

export type UserRole = 'student' | 'lecturer' | 'administrator';

export interface User extends Partial<AppwriteDocument> {
  id: string; // Appwrite User ID ($id from account)
  docId: string; // Appwrite document ID
  name: string;
  username: string;
  role: UserRole;
  nim_nip: string;
  classType: string | null;
  password_raw: string; // Only used for initial creation/update, not stored long-term
  profilePic: string | null; // URL from Appwrite Storage
  profilePicId: string | null; // File ID from Appwrite Storage
  registrationDate: Date;
  isSuspended: boolean;
}

export enum ClassStatus {
  Selesai = 'selesai',
  Aktif = 'aktif',
  Belum = 'belum',
  Batal = 'batal',
  Segera = 'segera',
}

export interface ClassInstance extends AppwriteDocument {
  // id will be $id from Appwrite
  createdAt: Date; // Note: This will be mapped from Appwrite's $createdAt
  name:string;
  classTypes: string[];
  start: Date;
  end: Date;
  location: string;
  lecturers: string[];
  note: string;
  status: ClassStatus;
}

export interface Notification extends AppwriteDocument {
  // id will be $id from Appwrite
  classId: string;
  className: string;
  message: string;
  date: Date;
  readBy: string[];
  deletedBy: string[];
}

export interface UserPreferences extends AppwriteDocument {
    userId: string;
    reminder: number | null;
    archivedClassIds: string[];
    deletedClassIds: string[];
}


export enum TimeFilter {
    Semua = 'semua',
    Harian = 'harian',
    Mingguan = 'mingguan',
    Bulanan = 'bulanan',
}

export enum StatusFilter {
    Semua = 'semua',
    Aktif = 'aktif',
    Belum = 'belum',
    Batal = 'batal',
    Selesai = 'selesai',
    Segera = 'segera',
}