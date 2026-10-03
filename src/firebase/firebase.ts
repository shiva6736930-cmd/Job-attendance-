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
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is unreachable.');
      return { connected: false, error: 'Offline' };
    }
    if (error?.message?.includes('Missing or insufficient permissions')) {
      return { connected: false, error: 'Permission denied in Firebase Console rules' };
    }
    return { connected: true };
  }
}

/**
 * Sync helpers for Employees collection (Dual Write to ensure persistence regardless of Firebase Console rules)
 */
export async function syncEmployeeToCloud(emp: Employee, userId?: string): Promise<boolean> {
  const uid = userId || auth.currentUser?.uid;
  let succeeded = false;
  let lastError: any = null;

  const payload = { ...emp, userId: uid };

  // 1. Try Firestore: users/{uid}/employees/{id}
  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'employees', emp.id), payload);
      succeeded = true;
    } catch (e: any) {
      lastError = e;
      console.warn('Firestore user subcollection write failed, trying top-level:', e?.message);
    }
  }

  // 2. Try Firestore: employees/{id}
  try {
    await setDoc(doc(db, 'employees', emp.id), payload);
    succeeded = true;
  } catch (e: any) {
    lastError = e;
    console.warn('Firestore top-level employees write failed:', e?.message);
  }

  // 3. Try Realtime Database: employees/{id}
  try {
    await set(ref(rtdb, `employees/${emp.id}`), payload);
    succeeded = true;
  } catch (e: any) {
    lastError = e;
    console.warn('RTDB employees write failed:', e?.message);
  }

  // 4. Try Realtime Database: users/{uid}/employees/{id}
  if (uid) {
    try {
      await set(ref(rtdb, `users/${uid}/employees/${emp.id}`), payload);
      succeeded = true;
    } catch (e: any) {
      console.warn('RTDB user subcollection write failed:', e?.message);
    }
  }

  if (!succeeded && lastError) {
    console.error('All cloud destinations failed for employee:', emp.name, lastError);
    throw lastError;
  }

  return succeeded;
}

export async function deleteEmployeeFromCloud(id: string, userId?: string): Promise<void> {
  const uid = userId || auth.currentUser?.uid;
  if (uid) {
    deleteDoc(doc(db, 'users', uid, 'employees', id)).catch(() => {});
    remove(ref(rtdb, `users/${uid}/employees/${id}`)).catch(() => {});
  }
  deleteDoc(doc(db, 'employees', id)).catch(() => {});
  remove(ref(rtdb, `employees/${id}`)).catch(() => {});
}

/**
 * Sync helpers for Attendance records (Dual Write)
 */
export async function syncAttendanceToCloud(record: AttendanceRecord, userId?: string): Promise<boolean> {
  const uid = userId || auth.currentUser?.uid;
  let succeeded = false;
  let lastError: any = null;

  const payload = { ...record, userId: uid };

  // 1. Try Firestore: users/{uid}/attendance/{id}
  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'attendance', record.id), payload);
      succeeded = true;
    } catch (e: any) {
      lastError = e;
      console.warn('Firestore user attendance write failed, trying top-level:', e?.message);
    }
  }

  // 2. Try Firestore: attendance/{id}
  try {
    await setDoc(doc(db, 'attendance', record.id), payload);
    succeeded = true;
  } catch (e: any) {
    lastError = e;
    console.warn('Firestore top-level attendance write failed:', e?.message);
  }

  // 3. Try Realtime Database: attendance/{id}
  try {
    await set(ref(rtdb, `attendance/${record.id}`), payload);
    succeeded = true;
  } catch (e: any) {
    lastError = e;
    console.warn('RTDB attendance write failed:', e?.message);
  }

  // 4. Try Realtime Database: users/{uid}/attendance/{id}
  if (uid) {
    try {
      await set(ref(rtdb, `users/${uid}/attendance/${record.id}`), payload);
      succeeded = true;
    } catch (e: any) {
      console.warn('RTDB user attendance write failed:', e?.message);
    }
  }

  if (!succeeded && lastError) {
    console.error('All cloud destinations failed for attendance:', record.id, lastError);
    throw lastError;
  }

  return succeeded;
}

export async function deleteAttendanceFromCloud(id: string, userId?: string): Promise<void> {
  const uid = userId || auth.currentUser?.uid;
  if (uid) {
    deleteDoc(doc(db, 'users', uid, 'attendance', id)).catch(() => {});
    remove(ref(rtdb, `users/${uid}/attendance/${id}`)).catch(() => {});
  }
  deleteDoc(doc(db, 'attendance', id)).catch(() => {});
  remove(ref(rtdb, `attendance/${id}`)).catch(() => {});
}

/**
 * Real-time listeners for Cloud synchronization
 * Subscribes to multiple cloud paths and merges them seamlessly
 */
export function subscribeCloudEmployees(
  onUpdate: (employees: Employee[]) => void,
  onError: (err: unknown) => void,
  userId?: string
): () => void {
  const uid = userId || auth.currentUser?.uid;
  const unsubs: (() => void)[] = [];

  const handleIncoming = (list: Employee[]) => {
    // Filter by user if userId is set, or include legacy unassigned
    const filtered = list.filter((e) => !uid || !e.userId || e.userId === uid);
    if (filtered.length > 0) {
      onUpdate(filtered);
    }
  };

  // 1. Listen to top-level employees in Firestore
  try {
    const unsubTop = onSnapshot(
      collection(db, 'employees'),
      (snap) => {
        const list: Employee[] = [];
        snap.forEach((d) => list.push(d.data() as Employee));
        handleIncoming(list);
      },
      (err) => {
        console.warn('Firestore employees snapshot error:', err?.message);
        onError(err);
      }
    );
    unsubs.push(unsubTop);
  } catch (e) {
    onError(e);
  }

  // 2. If user is logged in, also listen to users/{uid}/employees
  if (uid) {
    try {
      const unsubUser = onSnapshot(
        collection(db, 'users', uid, 'employees'),
        (snap) => {
          const list: Employee[] = [];
          snap.forEach((d) => list.push(d.data() as Employee));
          handleIncoming(list);
        },
        (err) => {
          console.warn('Firestore user employees snapshot error:', err?.message);
        }
      );
      unsubs.push(unsubUser);
    } catch (e) {
      // Ignore
    }
  }

  // 3. Fallback: Listen to Realtime Database employees
  try {
    const rtdbRef = ref(rtdb, 'employees');
    onValue(
      rtdbRef,
      (snap) => {
        const val = snap.val();
        if (val && typeof val === 'object') {
          handleIncoming(Object.values(val));
        }
      },
      (err) => {
        console.warn('RTDB employees snapshot error:', err?.message);
      }
    );
  } catch (e) {
    // Ignore
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}

export function subscribeCloudAttendance(
  onUpdate: (records: AttendanceRecord[]) => void,
  onError: (err: unknown) => void,
  userId?: string
): () => void {
  const uid = userId || auth.currentUser?.uid;
  const unsubs: (() => void)[] = [];

  const handleIncoming = (list: AttendanceRecord[]) => {
    const filtered = list.filter((r) => !uid || !r.userId || r.userId === uid);
    if (filtered.length > 0) {
      onUpdate(filtered);
    }
  };

  // 1. Listen to top-level attendance in Firestore
  try {
    const unsubTop = onSnapshot(
      collection(db, 'attendance'),
      (snap) => {
        const list: AttendanceRecord[] = [];
        snap.forEach((d) => list.push(d.data() as AttendanceRecord));
        handleIncoming(list);
      },
      (err) => {
        console.warn('Firestore attendance snapshot error:', err?.message);
        onError(err);
      }
    );
    unsubs.push(unsubTop);
  } catch (e) {
    onError(e);
  }

  // 2. If user is logged in, also listen to users/{uid}/attendance
  if (uid) {
    try {
      const unsubUser = onSnapshot(
        collection(db, 'users', uid, 'attendance'),
        (snap) => {
          const list: AttendanceRecord[] = [];
          snap.forEach((d) => list.push(d.data() as AttendanceRecord));
          handleIncoming(list);
        },
        (err) => {
          console.warn('Firestore user attendance snapshot error:', err?.message);
        }
      );
      unsubs.push(unsubUser);
    } catch (e) {
      // Ignore
    }
  }

  // 3. Fallback: Listen to Realtime Database attendance
  try {
    const rtdbRef = ref(rtdb, 'attendance');
    onValue(
      rtdbRef,
      (snap) => {
        const val = snap.val();
        if (val && typeof val === 'object') {
          handleIncoming(Object.values(val));
        }
      },
      (err) => {
        console.warn('RTDB attendance snapshot error:', err?.message);
      }
    );
  } catch (e) {
    // Ignore
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}

/**
 * Fetch all records from all available cloud sources
 */
export async function fetchAllFromCloud(userId?: string): Promise<{ employees: Employee[]; attendance: AttendanceRecord[] }> {
  const uid = userId || auth.currentUser?.uid;
  const empMap = new Map<string, Employee>();
  const attMap = new Map<string, AttendanceRecord>();

  // 1. Fetch from Firestore users/{uid}/employees
  if (uid) {
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'employees'));
      snap.forEach((d) => {
        const e = d.data() as Employee;
        empMap.set(e.id, e);
      });
    } catch (e) {
      // Ignore
    }
  }

  // 2. Fetch from Firestore employees
  try {
    const snap = await getDocs(collection(db, 'employees'));
    snap.forEach((d) => {
      const e = d.data() as Employee;
      if (!uid || !e.userId || e.userId === uid) {
        empMap.set(e.id, e);
      }
    });
  } catch (e) {
    // Ignore
  }

  // 3. Fetch from RTDB employees
  try {
    const rsnap = await get(ref(rtdb, 'employees'));
    const val = rsnap.val();
    if (val && typeof val === 'object') {
      Object.values(val).forEach((item: any) => {
        if (item && item.id && (!uid || !item.userId || item.userId === uid)) {
          empMap.set(item.id, item as Employee);
        }
      });
    }
  } catch (e) {
    // Ignore
  }

  // 4. Fetch from Firestore users/{uid}/attendance
  if (uid) {
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'attendance'));
      snap.forEach((d) => {
        const r = d.data() as AttendanceRecord;
        attMap.set(r.id, r);
      });
    } catch (e) {
      // Ignore
    }
  }

  // 5. Fetch from Firestore attendance
  try {
    const snap = await getDocs(collection(db, 'attendance'));
    snap.forEach((d) => {
      const r = d.data() as AttendanceRecord;
      if (!uid || !r.userId || r.userId === uid) {
        attMap.set(r.id, r);
      }
    });
  } catch (e) {
    // Ignore
  }

  // 6. Fetch from RTDB attendance
  try {
    const rsnap = await get(ref(rtdb, 'attendance'));
    const val = rsnap.val();
    if (val && typeof val === 'object') {
      Object.values(val).forEach((item: any) => {
        if (item && item.id && (!uid || !item.userId || item.userId === uid)) {
          attMap.set(item.id, item as AttendanceRecord);
        }
      });
    }
  } catch (e) {
    // Ignore
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
