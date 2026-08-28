import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  enableIndexedDbPersistence,
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { storageService } from "./storage";
import { FirestoreSyncStatus } from "../types";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let isPersistenceEnabled = false;

// Global sync state listeners
type SyncStatusListener = (status: FirestoreSyncStatus, msg?: string) => void;
const syncListeners: Set<SyncStatusListener> = new Set();
let currentSyncStatus: FirestoreSyncStatus = "synced";
let currentSyncMessage: string = "Đã đồng bộ";

export function getFirebaseConfig() {
  const settings = storageService.getSettings();
  if (settings.firebaseConfig && settings.firebaseConfig.projectId) {
    return settings.firebaseConfig;
  }

  // Check if environment variables or default ecosystem project are present
  const envProjectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID;
  if (envProjectId) {
    return {
      apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "",
      authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "",
    };
  }

  return null;
}

export function getFirebaseInstance() {
  const config = getFirebaseConfig();
  if (!config || !config.projectId) {
    return { app: null, db: null, auth: null, isConfigured: false };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    auth = getAuth(app);

    // Enable Offline Persistence for PWA / Real-time multi-device
    if (typeof window !== "undefined" && !isPersistenceEnabled) {
      isPersistenceEnabled = true;
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === "failed-precondition") {
          console.warn("Firestore offline persistence: multiple tabs open");
        } else if (err.code === "unimplemented") {
          console.warn("Firestore offline persistence: browser does not support IndexedDB");
        }
      });
    }

    return { app, db, auth, isConfigured: true };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return { app: null, db: null, auth: null, isConfigured: false, error };
  }
}

export function notifySyncStatus(status: FirestoreSyncStatus, msg?: string) {
  currentSyncStatus = status;
  currentSyncMessage = msg || (status === "synced" ? "Đã đồng bộ" : status === "saving" ? "Đang lưu dữ liệu" : "Mất kết nối");
  syncListeners.forEach((fn) => fn(status, currentSyncMessage));
}

export function onSyncStatusChange(fn: SyncStatusListener): () => void {
  syncListeners.add(fn);
  fn(currentSyncStatus, currentSyncMessage);
  return () => {
    syncListeners.delete(fn);
  };
}

export function resetFirebaseInstance() {
  app = null;
  db = null;
  auth = null;
  isPersistenceEnabled = false;
}

export const firebaseService = {
  isConfigured(): boolean {
    const { isConfigured } = getFirebaseInstance();
    return !!isConfigured;
  },

  reset(): void {
    resetFirebaseInstance();
  },

  async testConnection(): Promise<{ success: boolean; message: string }> {
    resetFirebaseInstance();
    const { db, isConfigured } = getFirebaseInstance();
    if (!isConfigured || !db) {
      throw new Error("Chưa nhập đủ Firebase Project ID và API Key.");
    }
    try {
      const pingDoc = doc(db, "settings", "connection_ping");
      await setDoc(pingDoc, {
        lastPing: new Date().toISOString(),
        client: "CLB Toán Thầy Thắng App",
        status: "connected",
      }, { merge: true });
      const snap = await getDoc(pingDoc);
      if (snap.exists()) {
        return {
          success: true,
          message: "Kết nối thành công tới Firebase Cloud Firestore!",
        };
      } else {
        throw new Error("Không thể xác thực bản ghi kiểm tra trên Firestore.");
      }
    } catch (err: any) {
      console.error("Firestore test ping failed:", err);
      throw new Error(err.message || "Không thể kết nối tới Firebase Firestore.");
    }
  },

  getDb(): Firestore | null {
    const { db } = getFirebaseInstance();
    return db;
  },

  getAuth(): Auth | null {
    const { auth } = getFirebaseInstance();
    return auth;
  },

  // "Migrate dữ liệu cũ lên Firebase" - Full ecosystem migration
  async migrateLocalDataToFirebase(): Promise<{
    success: boolean;
    message: string;
    stats: {
      usersCount: number;
      classesCount: number;
      studentsCount: number;
      reportsCount: number;
      sessionsCount: number;
    };
  }> {
    const { db, isConfigured } = getFirebaseInstance();
    if (!isConfigured || !db) {
      throw new Error("Chưa cấu hình Firebase Project. Vui lòng nhập Firebase Config trong Cài đặt trước.");
    }

    notifySyncStatus("saving", "Đang migrate dữ liệu cũ lên Cloud Firestore...");

    try {
      const classes = storageService.getClasses();
      const students = storageService.getStudents();
      const assistants = storageService.getAssistants();
      const adminUser = storageService.getAdminUser();
      const reports = storageService.getReports();
      const masterSlots = storageService.getMasterTimetableSlots();
      const timetableSlots = storageService.getTimetableSlots();
      const settings = storageService.getSettings();

      // 1. Migrate Users collection (Admin + Assistants + Teachers)
      const allUsers = [
        adminUser,
        ...assistants.map((a) => ({
          id: a.id,
          name: a.name,
          email: a.email,
          phone: a.phone,
          role: "assistant",
          username: a.username,
          password: a.password,
          avatar: a.avatar,
          assignedClassIds: a.classes,
          assistantId: a.id,
        })),
      ];

      for (const u of allUsers) {
        await setDoc(doc(db, "users", u.id), u, { merge: true });
      }

      // 2. Migrate Classes collection
      for (const c of classes) {
        await setDoc(doc(db, "classes", c.id), c, { merge: true });
      }

      // 3. Migrate Students collection
      for (const s of students) {
        await setDoc(doc(db, "students", s.id), s, { merge: true });
      }

      // 4. Migrate assistantReports & teachingSessions
      let sessionsCount = 0;
      for (const r of reports) {
        const sessionId = r.sessionId || `session_${r.date.replace(/[^a-zA-Z0-9]/g, "")}_${r.shift.replace(/[^a-zA-Z0-9]/g, "")}_${r.classId.replace(/[^a-zA-Z0-9]/g, "")}`;
        
        const fullReport = {
          ...r,
          sessionId,
          teacherId: r.teacherId || "teacher_thaythang",
          teacherName: r.teacherName || "Thầy Thắng",
        };

        // Save to assistantReports collection
        await setDoc(doc(db, "assistantReports", r.id), fullReport, { merge: true });
        // Save to backward-compatible reports collection
        await setDoc(doc(db, "reports", r.id), fullReport, { merge: true });

        // Save to teachingSessions collection
        await setDoc(doc(db, "teachingSessions", sessionId), {
          id: sessionId,
          classId: r.classId,
          className: r.className,
          date: r.date,
          shift: r.shift,
          teacherId: r.teacherId || "teacher_thaythang",
          teacherName: r.teacherName || "Thầy Thắng",
          assistantId: r.assistantId,
          assistantName: r.assistantName,
          lessonContent: r.lessonContent,
          assistantReportId: r.id,
          homeworkAssigned: r.homeworkAssigned,
          status: r.status === "approved" ? "completed" : "in_progress",
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        sessionsCount++;
      }

      // 5. Migrate timetable & master slots
      for (const m of masterSlots) {
        await setDoc(doc(db, "master_timetable_slots", m.id), m, { merge: true });
      }
      for (const t of timetableSlots) {
        await setDoc(doc(db, "timetable_slots", t.id), t, { merge: true });
      }

      // 6. Global config
      await setDoc(doc(db, "settings", "global_config"), settings, { merge: true });

      notifySyncStatus("synced", "Migrate dữ liệu thành công lên Firebase!");

      return {
        success: true,
        message: `Migrate thành công ${classes.length} lớp học, ${students.length} học sinh, ${allUsers.length} tài khoản, ${reports.length} báo cáo trợ giảng và ${sessionsCount} buổi học lên Firestore!`,
        stats: {
          usersCount: allUsers.length,
          classesCount: classes.length,
          studentsCount: students.length,
          reportsCount: reports.length,
          sessionsCount,
        },
      };
    } catch (err: any) {
      console.error("Migration error:", err);
      notifySyncStatus("error", "Lỗi migrate: " + err.message);
      throw new Error(err.message || "Lỗi trong quá trình migrate dữ liệu lên Firebase");
    }
  },

  // Pull all data from Firestore into local cache
  async pullAllFromFirebase(): Promise<{ success: boolean; message: string }> {
    const { db, isConfigured } = getFirebaseInstance();
    if (!isConfigured || !db) {
      throw new Error("Chưa cấu hình Firebase.");
    }

    try {
      // Pull classes
      const classSnap = await getDocs(collection(db, "classes"));
      const classes: any[] = [];
      classSnap.forEach((doc) => classes.push(doc.data()));
      if (classes.length > 0) {
        storageService.saveClasses(classes);
      }

      // Pull students
      const studentSnap = await getDocs(collection(db, "students"));
      const students: any[] = [];
      studentSnap.forEach((doc) => students.push(doc.data()));
      if (students.length > 0) {
        storageService.saveStudents(students);
      }

      // Pull assistantReports
      const repSnap = await getDocs(collection(db, "assistantReports"));
      const reports: any[] = [];
      repSnap.forEach((doc) => reports.push(doc.data()));
      if (reports.length > 0) {
        storageService.saveReports(reports);
      }

      return {
        success: true,
        message: `Đã kéo về thành công ${classes.length} lớp, ${students.length} học sinh và ${reports.length} báo cáo từ Firebase!`,
      };
    } catch (error: any) {
      throw new Error(error.message || "Lỗi khi kéo dữ liệu từ Firebase");
    }
  },
};
