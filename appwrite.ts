

import * as Appwrite from 'appwrite';

// ====================================================================
// !! IMPORTANT !!
//
// Replace these placeholder values with your actual Appwrite project details.
// You can find these in your Appwrite console under 'Settings'.
// ====================================================================
const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1'; // Your Appwrite Endpoint
const APPWRITE_PROJECT_ID = '68ef9f1000305edffab9'; // Your Appwrite Project ID

// It's recommended to create a new database for this application.
// Find the Database ID in your Appwrite console -> Databases.
export const APPWRITE_DATABASE_ID = 'pajal_db'; 

// ====================================================================
// Collection & Bucket IDs
//
// You must create these collections and this bucket in your Appwrite project
// with the specified attributes and permissions.
// ====================================================================

// --- Database Collection IDs ---
export const USERS_COLLECTION_ID = 'users';             // Collection for user profiles
export const CLASSES_COLLECTION_ID = 'classes';           // Collection for class schedules
export const NOTIFICATIONS_COLLECTION_ID = 'notifications'; // Collection for notifications
export const PREFERENCES_COLLECTION_ID = 'user_preferences'; // Collection for user-specific settings

// --- Storage Bucket ID ---
export const PROFILE_PIC_BUCKET_ID = 'profile_pics'; // Bucket for user profile pictures

const client = new Appwrite.Client();

client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

export const account = new Appwrite.Account(client);
export const databases = new Appwrite.Databases(client);
export const storage = new Appwrite.Storage(client);

export const ID = Appwrite.ID;
export const Query = Appwrite.Query;

/**
 * ====================================================================
 * Appwrite Collection Setup Guide:
 * ====================================================================
 * 
 * Go to your Appwrite Console -> Databases -> [Your Database] and create the following collections:
 * 
 * 1. `users` (Collection ID: users)
 *    - Attributes:
 *      - `userId` (string, required, size: 255) -> Appwrite User ID ($id from Account)
 *      - `name` (string, required, size: 255)
 *      - `username` (string, required, size: 255)
 *      - `role` (string, required, size: 50)
 *      - `nim_nip` (string, required, size: 255)
 *      - `classType` (string, optional, size: 255)
 *      - `profilePicId` (string, optional, size: 255)
 *      - `registrationDate` (datetime, required)
 *      - `isSuspended` (boolean, required, default: false)
 *    - Permissions:
 *      - Document Level: Grant Read access to `role:all`
 *      - Document Level: Grant Update/Delete access to `user:{userId}` (where userId is the attribute)
 * 
 * 2. `classes` (Collection ID: classes)
 *    - Attributes:
 *      - `name` (string, required, size: 255)
 *      - `classTypes` (string[], optional)
 *      - `start` (datetime, required)
 *      - `end` (datetime, required)
 *      - `location` (string, required, size: 255)
 *      - `lecturers` (string[], required)
 *      - `note` (string, optional, size: 1000)
 *      - `status` (string, required, size: 50)
 *    - Permissions:
 *      - Collection Level: Grant Read access to `role:member`
 *      - Document Level: Grant Update/Delete access to users with `role:lecturer`
 * 
 * 3. `notifications` (Collection ID: notifications)
 *    - Attributes:
 *      - `classId` (string, required, size: 255)
 *      - `className` (string, required, size: 255)
 *      - `message` (string, required, size: 500)
 *      - `date` (datetime, required)
 *      - `readBy` (string[], optional)
 *      - `deletedBy` (string[], optional)
 *    - Permissions:
 *      - Collection Level: Grant Read access to `role:member`
 * 
 * 4. `user_preferences` (Collection ID: user_preferences)
 *    - Attributes:
 *      - `userId` (string, required, size: 255)
 *      - `reminder` (integer, optional)
 *      - `archivedClassIds` (string[], optional)
 *      - `deletedClassIds` (string[], optional)
 *    - Permissions:
 *      - Document Level: Grant Read/Update access to `user:{userId}`
 *
 * ====================================================================
 * Appwrite Storage Setup Guide:
 * ====================================================================
 * 
 * Go to your Appwrite Console -> Storage and create a new bucket:
 * 
 * 1. `profile_pics` (Bucket ID: profile_pics)
 *    - Permissions:
 *      - File Level: Grant Read access to `role:all`
 *      - File Level: Grant Create/Update/Delete access to `role:member`
 */
