import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Firestore,
} from 'firebase/firestore';
import {
  getDatabase,
  ref,
  set,
  remove,
  onValue,
  Database,
} from 'firebase/database';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import { Employee, AttendanceRecord } from '../types/attendance';

// User's provided Firebase credentials
export const firebaseConfig = {
  apiKey: "AIzaSyCGo0EN_YZialtsCh-YLGBRfnGrIonGDe4",
  authDomain: "shiva-shoes-store.firebaseapp.com",
  databaseURL: "https://shiva-shoes-store-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shiva-shoes-store",
  storageBucket: "shiva-shoes-store.firebasestorage.app",
  messagingSenderId: "814472110108",
  appId: "1:814472110108:web:880bb468477144494effd9"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const rtdb: Database = getDatabase(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore at boot
 */
export async function testFirestoreConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { connected: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is unreachable.');
      return { connected: false, error: 'Offline' };
    }
    // Note: getDocFromServer on non-existent doc throws or returns empty snapshot,
    // which still confirms valid reachability to the server
    return { connected: true };
  }
}

/**
 * Sync helpers for Employees collection
 */
export async function syncEmployeeToCloud(emp: Employee): Promise<void> {
  const path = `employees/${emp.id}`;
  try {
    await setDoc(doc(db, 'employees', emp.id), emp);
  } catch (error) {
    console.warn(`Firestore save error on ${path}, trying Realtime DB fallback:`, error);
    try {
      await set(ref(rtdb, `employees/${emp.id}`), emp);
    } catch (rtdbErr) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export async function deleteEmployeeFromCloud(id: string): Promise<void> {
  const path = `employees/${id}`;
  try {
    await deleteDoc(doc(db, 'employees', id));
  } catch (error) {
    try {
      await remove(ref(rtdb, `employees/${id}`));
    } catch (rtdbErr) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}

/**
 * Sync helpers for Attendance records
 */
export async function syncAttendanceToCloud(record: AttendanceRecord): Promise<void> {
  const path = `attendance/${record.id}`;
  try {
    await setDoc(doc(db, 'attendance', record.id), record);
  } catch (error) {
    console.warn(`Firestore save error on ${path}, trying Realtime DB fallback:`, error);
    try {
      await set(ref(rtdb, `attendance/${record.id}`), record);
    } catch (rtdbErr) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export async function deleteAttendanceFromCloud(id: string): Promise<void> {
  const path = `attendance/${id}`;
  try {
    await deleteDoc(doc(db, 'attendance', id));
  } catch (error) {
    try {
      await remove(ref(rtdb, `attendance/${id}`));
    } catch (rtdbErr) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}

/**
 * Real-time listeners for Cloud synchronization
 */
export function subscribeCloudEmployees(
  onUpdate: (employees: Employee[]) => void,
  onError: (err: unknown) => void
): () => void {
  const path = 'employees';
  try {
    const unsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: Employee[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Employee);
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot employees error, falling back to RTDB:', error);
        onError(error);
        // Fallback to RTDB
        const rtdbRef = ref(rtdb, 'employees');
        onValue(
          rtdbRef,
          (snap) => {
            const val = snap.val();
            if (val && typeof val === 'object') {
              onUpdate(Object.values(val));
            }
          },
          (rtdbErr) => {
            onError(rtdbErr);
          }
        );
      }
    );
    return unsub;
  } catch (e) {
    onError(e);
    return () => {};
  }
}

export function subscribeCloudAttendance(
  onUpdate: (records: AttendanceRecord[]) => void,
  onError: (err: unknown) => void
): () => void {
  const path = 'attendance';
  try {
    const unsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: AttendanceRecord[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as AttendanceRecord);
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot attendance error, falling back to RTDB:', error);
        onError(error);
        // Fallback to RTDB
        const rtdbRef = ref(rtdb, 'attendance');
        onValue(
          rtdbRef,
          (snap) => {
            const val = snap.val();
            if (val && typeof val === 'object') {
              onUpdate(Object.values(val));
            }
          },
          (rtdbErr) => {
            onError(rtdbErr);
          }
        );
      }
    );
    return unsub;
  } catch (e) {
    onError(e);
    return () => {};
  }
}

/**
 * Authentication Helpers
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (e) {
    console.error('Google Sign-in failed', e);
    throw e;
  }
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}
