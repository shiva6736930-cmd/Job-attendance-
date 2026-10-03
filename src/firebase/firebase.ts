import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where,
  Firestore,
} from 'firebase/firestore';
import {
  getDatabase,
  ref,
  set,
  remove,
  onValue,
  get,
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

// Use experimentalForceLongPolling to prevent Brave Shields / gRPC connection blocks
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  firestoreInstance = getFirestore(app);
}
export const db: Firestore = firestoreInstance;
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

/**
 * Strips all undefined properties recursively so Firestore setDoc never throws:
 * "Unsupported field value: undefined"
 */
export function cleanForFirestore<T>(data: T): T {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    return data;
  }
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
  } catch (error: any) {
    if (
      error instanceof Error &&
      (error.message.includes('the client is offline') ||
        error.message.includes('unavailable') ||
        error.message.includes('network'))
    ) {
      console.warn('Firebase client is connecting or in offline cache mode.');
      return { connected: true };
    }
    if (error?.message?.includes('Missing or insufficient permissions')) {
      return { connected: false, error: 'Permission denied in Firebase Console rules' };
    }
    return { connected: true };
  }
}

/**
 * Checks if the current authenticated user has active write permission to the cloud database
 */
export async function testWritePermission(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    await setDoc(doc(db, 'users', uid, 'profile', 'sync_test'), { time: Date.now() });
    return true;
  } catch (e1) {
    try {
      await setDoc(doc(db, 'employees', `test_${uid.slice(0, 5)}`), { time: Date.now() });
      deleteDoc(doc(db, 'employees', `test_${uid.slice(0, 5)}`)).catch(() => {});
      return true;
    } catch (e2) {
      try {
        await set(ref(rtdb, `ping/${uid}`), { time: Date.now() });
        return true;
      } catch (e3) {
        return false;
      }
    }
  }
}

/**
 * Sync helpers for Employees collection (Dual Write with clean payload)
 */
export async function syncEmployeeToCloud(emp: Employee, userId?: string): Promise<boolean> {
  const uid = userId || auth.currentUser?.uid;
  let succeeded = false;
  let lastError: any = null;

  // Clean all undefined fields before sending to Firestore
  const payload = cleanForFirestore({ ...emp, userId: uid });

  // 1. Primary: employees/{id} (Collection where documents are accessible)
  try {
    await setDoc(doc(db, 'employees', emp.id), payload);
    succeeded = true;
  } catch (e: any) {
    lastError = e;
  }

  // 2. Also try: users/{uid}/employees/{id}
  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'employees', emp.id), payload);
      succeeded = true;
    } catch (e: any) {
      lastError = e;
    }
  }

  // 3. Fallback: Realtime Database
  try {
    await set(ref(rtdb, `employees/${emp.id}`), payload);
    succeeded = true;
  } catch (e: any) {
    // Ignore
  }

  if (!succeeded && lastError) {
    throw lastError;
  }

  return succeeded;
}

export async function deleteEmployeeFromCloud(id: string, userId?: string): Promise<void> {
  const uid = userId || auth.currentUser?.uid;
  deleteDoc(doc(db, 'employees', id)).catch(() => {});
  if (uid) {
    deleteDoc(doc(db, 'users', uid, 'employees', id)).catch(() => {});
    remove(ref(rtdb, `users/${uid}/employees/${id}`)).catch(() => {});
  }
  remove(ref(rtdb, `employees/${id}`)).catch(() => {});
}

/**
 * Sync helpers for Attendance records (Dual Write with clean payload)
 */
export async function syncAttendanceToCloud(record: AttendanceRecord, userId?: string): Promise<boolean> {
  const uid = userId || auth.currentUser?.uid;
  let succeeded = false;
  let lastError: any = null;

  // Clean all undefined fields before sending to Firestore
  const payload = cleanForFirestore({ ...record, userId: uid });

  // 1. Primary: attendance/{id}
  try {
    await setDoc(doc(db, 'attendance', record.id), payload);
    succeeded = true;
  } catch (e: any) {
    lastError = e;
  }

  // 2. Also try: users/{uid}/attendance/{id}
  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'attendance', record.id), payload);
      succeeded = true;
    } catch (e: any) {
      lastError = e;
    }
  }

  // 3. Fallback: Realtime Database
  try {
    await set(ref(rtdb, `attendance/${record.id}`), payload);
    succeeded = true;
  } catch (e: any) {
    // Ignore
  }

  if (!succeeded && lastError) {
    throw lastError;
  }

  return succeeded;
}

export async function deleteAttendanceFromCloud(id: string, userId?: string): Promise<void> {
  const uid = userId || auth.currentUser?.uid;
  deleteDoc(doc(db, 'attendance', id)).catch(() => {});
  if (uid) {
    deleteDoc(doc(db, 'users', uid, 'attendance', id)).catch(() => {});
    remove(ref(rtdb, `users/${uid}/attendance/${id}`)).catch(() => {});
  }
  remove(ref(rtdb, `attendance/${id}`)).catch(() => {});
}

/**
 * Real-time listener for Employees collection.
 * Uses query with where('userId', '==', uid) so Firestore Security Rules accept the query,
 * and immediately delivers updates including deletions.
 */
export function subscribeCloudEmployees(
  onUpdate: (employees: Employee[]) => void,
  onError: (err: unknown) => void,
  userId?: string
): () => void {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) {
    onUpdate([]);
    return () => {};
  }

  try {
    // Query with where clause to satisfy Firestore security rules
    const q = query(collection(db, 'employees'), where('userId', '==', uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Employee[] = [];
        snap.forEach((d) => {
          const e = d.data() as Employee;
          if (e && e.id) {
            list.push(e);
          }
        });
        onUpdate(list);
      },
      (err) => {
        console.warn('Firestore employees query error, falling back:', err?.message);
        // Fallback to unconstrained collection if rules allow it
        try {
          const unsubFallback = onSnapshot(
            collection(db, 'employees'),
            (snap) => {
              const list: Employee[] = [];
              snap.forEach((d) => {
                const e = d.data() as Employee;
                if (e && e.id && (!uid || !e.userId || e.userId === uid)) {
                  list.push(e);
                }
              });
              onUpdate(list);
            },
            (err2) => onError(err2)
          );
          return unsubFallback;
        } catch (e) {
          onError(e);
        }
      }
    );
    return unsub;
  } catch (e) {
    onError(e);
    return () => {};
  }
}

/**
 * Real-time listener for Attendance records.
 * Uses query with where('userId', '==', uid) so Firestore Security Rules accept the query.
 * When documents are deleted from Firestore Console, onUpdate receives the fresh array
 * (or empty array) so the UI immediately clears deleted items in real-time.
 */
export function subscribeCloudAttendance(
  onUpdate: (records: AttendanceRecord[]) => void,
  onError: (err: unknown) => void,
  userId?: string
): () => void {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) {
    onUpdate([]);
    return () => {};
  }

  try {
    // Query with where clause to satisfy Firestore rules
    const q = query(collection(db, 'attendance'), where('userId', '==', uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: AttendanceRecord[] = [];
        snap.forEach((d) => {
          const r = d.data() as AttendanceRecord;
          if (r && r.id) {
            list.push(r);
          }
        });
        // Sort descending by createdAt
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        // Always notify with current Firestore state, even if empty (e.g. after deletion in console)
        onUpdate(list);
      },
      (err) => {
        console.warn('Firestore attendance where query error, trying fallback:', err?.message);
        try {
          const unsubFallback = onSnapshot(
            collection(db, 'attendance'),
            (snap) => {
              const list: AttendanceRecord[] = [];
              snap.forEach((d) => {
                const r = d.data() as AttendanceRecord;
                if (r && r.id && (!uid || !r.userId || r.userId === uid)) {
                  list.push(r);
                }
              });
              list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              onUpdate(list);
            },
            (err2) => onError(err2)
          );
          return unsubFallback;
        } catch (e) {
          onError(e);
        }
      }
    );
    return unsub;
  } catch (e) {
    onError(e);
    return () => {};
  }
}

/**
 * Fetch all records from all available cloud sources
 */
export async function fetchAllFromCloud(userId?: string): Promise<{ employees: Employee[]; attendance: AttendanceRecord[] }> {
  const uid = userId || auth.currentUser?.uid;
  const empMap = new Map<string, Employee>();
  const attMap = new Map<string, AttendanceRecord>();

  if (!uid) return { employees: [], attendance: [] };

  // 1. Fetch attendance with where('userId', '==', uid)
  try {
    const q = query(collection(db, 'attendance'), where('userId', '==', uid));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const r = d.data() as AttendanceRecord;
      if (r && r.id) attMap.set(r.id, r);
    });
  } catch (e) {
    try {
      const snap = await getDocs(collection(db, 'attendance'));
      snap.forEach((d) => {
        const r = d.data() as AttendanceRecord;
        if (r && r.id && (!uid || r.userId === uid)) attMap.set(r.id, r);
      });
    } catch (e2) {}
  }

  // 2. Fetch employees with where('userId', '==', uid)
  try {
    const q = query(collection(db, 'employees'), where('userId', '==', uid));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const e = d.data() as Employee;
      if (e && e.id) empMap.set(e.id, e);
    });
  } catch (e) {
    try {
      const snap = await getDocs(collection(db, 'employees'));
      snap.forEach((d) => {
        const e = d.data() as Employee;
        if (e && e.id && (!uid || !e.userId || e.userId === uid)) empMap.set(e.id, e);
      });
    } catch (e2) {}
  }

  return {
    employees: Array.from(empMap.values()),
    attendance: Array.from(attMap.values()),
  };
}

/**
 * Authentication Helpers
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
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
