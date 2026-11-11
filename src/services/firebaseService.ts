import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Student, AttendanceRecord, SessionConfig, AppCustomization } from '../types';
import {
  initialStudents,
  initialAttendanceRecords,
  initialSessionConfig,
} from '../data/mockData';
import { defaultCustomization, DEFAULT_ADMIN_SLUG } from './storage';

const STUDENTS_COLLECTION = 'students';
const ATTENDANCE_COLLECTION = 'attendance';
const SETTINGS_COLLECTION = 'settings';

// Sync or seed initial data to Firestore if empty
export async function seedInitialFirestoreDataIfEmpty(): Promise<void> {
  try {
    const initDoc = await getDoc(doc(db, SETTINGS_COLLECTION, 'initialized'));
    if (!initDoc.exists()) {
      console.log('First-time setup: Seeding initial students and sample attendance to Firestore...');
      for (const s of initialStudents) {
        await setDoc(doc(db, STUDENTS_COLLECTION, s.id), s);
      }
      for (const a of initialAttendanceRecords) {
        await setDoc(doc(db, ATTENDANCE_COLLECTION, a.id), a);
      }
      await setDoc(doc(db, SETTINGS_COLLECTION, 'initialized'), {
        initializedAt: new Date().toISOString(),
      });
    }

    const sessionDoc = await getDoc(doc(db, SETTINGS_COLLECTION, 'session'));
    if (!sessionDoc.exists()) {
      await setDoc(doc(db, SETTINGS_COLLECTION, 'session'), initialSessionConfig);
    }

    const customDoc = await getDoc(doc(db, SETTINGS_COLLECTION, 'customization'));
    if (!customDoc.exists()) {
      await setDoc(doc(db, SETTINGS_COLLECTION, 'customization'), defaultCustomization);
    }

    const adminSlugDoc = await getDoc(doc(db, SETTINGS_COLLECTION, 'adminSecret'));
    if (!adminSlugDoc.exists()) {
      await setDoc(doc(db, SETTINGS_COLLECTION, 'adminSecret'), {
        slug: DEFAULT_ADMIN_SLUG,
        updatedAt: new Date().toISOString(),
      });
    }

    const adminPassDoc = await getDoc(doc(db, SETTINGS_COLLECTION, 'adminPassword'));
    if (!adminPassDoc.exists()) {
      await setDoc(doc(db, SETTINGS_COLLECTION, 'adminPassword'), {
        password: 'yemcojoe',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'initial_seed');
  }
}

// ---------------- Students API ----------------

export async function fetchStudentsFromFirestore(): Promise<Student[]> {
  try {
    const snap = await getDocs(collection(db, STUDENTS_COLLECTION));
    if (snap.empty) {
      return initialStudents;
    }
    const list: Student[] = [];
    snap.forEach((d) => list.push(d.data() as Student));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, STUDENTS_COLLECTION);
    return initialStudents;
  }
}

export async function saveStudentToFirestore(student: Student): Promise<void> {
  try {
    await setDoc(doc(db, STUDENTS_COLLECTION, student.id), student);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${STUDENTS_COLLECTION}/${student.id}`);
  }
}

export async function deleteStudentFromFirestore(studentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, STUDENTS_COLLECTION, studentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${STUDENTS_COLLECTION}/${studentId}`);
  }
}

export async function deleteMultipleStudentsFromFirestore(studentIds: string[]): Promise<void> {
  try {
    const promises = studentIds.map((id) => deleteDoc(doc(db, STUDENTS_COLLECTION, id)));
    await Promise.all(promises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, STUDENTS_COLLECTION);
  }
}

export function subscribeToStudents(callback: (students: Student[]) => void): () => void {
  return onSnapshot(
    collection(db, STUDENTS_COLLECTION),
    (snap) => {
      const list: Student[] = [];
      snap.forEach((d) => list.push(d.data() as Student));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, STUDENTS_COLLECTION);
    }
  );
}

// ---------------- Attendance API ----------------

export async function fetchAttendanceFromFirestore(): Promise<AttendanceRecord[]> {
  try {
    const q = query(collection(db, ATTENDANCE_COLLECTION), orderBy('timestamp', 'desc'), limit(150));
    const snap = await getDocs(q);
    if (snap.empty) {
      return [];
    }
    const list: AttendanceRecord[] = [];
    snap.forEach((d) => list.push(d.data() as AttendanceRecord));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ATTENDANCE_COLLECTION);
    return [];
  }
}

export async function saveAttendanceRecordToFirestore(record: AttendanceRecord): Promise<void> {
  try {
    await setDoc(doc(db, ATTENDANCE_COLLECTION, record.id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ATTENDANCE_COLLECTION}/${record.id}`);
  }
}

export async function deleteAttendanceRecordFromFirestore(recordId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ATTENDANCE_COLLECTION, recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ATTENDANCE_COLLECTION}/${recordId}`);
  }
}

export async function deleteMultipleAttendanceRecordsFromFirestore(recordIds: string[]): Promise<void> {
  try {
    const promises = recordIds.map((id) => deleteDoc(doc(db, ATTENDANCE_COLLECTION, id)));
    await Promise.all(promises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, ATTENDANCE_COLLECTION);
  }
}

export async function deleteAllAttendanceRecordsFromFirestore(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, ATTENDANCE_COLLECTION));
    const promises: Promise<void>[] = [];
    snap.forEach((d) => {
      promises.push(deleteDoc(d.ref));
    });
    await Promise.all(promises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, ATTENDANCE_COLLECTION);
  }
}

export function subscribeToAttendance(callback: (records: AttendanceRecord[]) => void): () => void {
  return onSnapshot(
    collection(db, ATTENDANCE_COLLECTION),
    (snap) => {
      const list: AttendanceRecord[] = [];
      snap.forEach((d) => list.push(d.data() as AttendanceRecord));
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, ATTENDANCE_COLLECTION);
    }
  );
}

// ---------------- Settings API ----------------

export async function fetchSessionConfigFromFirestore(): Promise<SessionConfig> {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, 'session'));
    if (snap.exists()) {
      return snap.data() as SessionConfig;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/session`);
  }
  return initialSessionConfig;
}

export async function saveSessionConfigToFirestore(config: SessionConfig): Promise<void> {
  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, 'session'), config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/session`);
  }
}

export async function fetchCustomizationFromFirestore(): Promise<AppCustomization> {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, 'customization'));
    if (snap.exists()) {
      return { ...defaultCustomization, ...(snap.data() as AppCustomization) };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/customization`);
  }
  return defaultCustomization;
}

export async function saveCustomizationToFirestore(customization: AppCustomization): Promise<void> {
  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, 'customization'), customization);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/customization`);
  }
}

export async function fetchAdminSecretSlugFromFirestore(): Promise<string> {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, 'adminSecret'));
    if (snap.exists() && snap.data().slug) {
      return snap.data().slug;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/adminSecret`);
  }
  return DEFAULT_ADMIN_SLUG;
}

export async function saveAdminSecretSlugToFirestore(slug: string): Promise<void> {
  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, 'adminSecret'), {
      slug,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/adminSecret`);
  }
}

export async function fetchAdminPasswordFromFirestore(): Promise<string> {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, 'adminPassword'));
    if (snap.exists() && snap.data().password) {
      return snap.data().password;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/adminPassword`);
  }
  return 'yemcojoe';
}

export async function saveAdminPasswordToFirestore(password: string): Promise<void> {
  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, 'adminPassword'), {
      password,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/adminPassword`);
  }
}
