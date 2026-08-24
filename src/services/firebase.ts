import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { getAuth, Auth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { storageService } from "./storage";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export function getFirebaseInstance() {
  const settings = storageService.getSettings();
  if (!settings.useFirebase || !settings.firebaseConfig || !settings.firebaseConfig.projectId) {
    return { app: null, db: null, auth: null, isConfigured: false };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(settings.firebaseConfig);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    auth = getAuth(app);
    return { app, db, auth, isConfigured: true };
  } catch (error) {
    console.error("Firebase init error:", error);
    return { app: null, db: null, auth: null, isConfigured: false, error };
  }
}

export const firebaseService = {
  isConfigured(): boolean {
    const { isConfigured } = getFirebaseInstance();
    return !!isConfigured;
  },

  async syncAllToFirebase(): Promise<{ success: boolean; message: string }> {
    const { db, isConfigured } = getFirebaseInstance();
    if (!isConfigured || !db) {
      throw new Error("Chưa cấu hình Firebase hoặc chưa bật chế độ Firebase.");
    }

    try {
      const classes = storageService.getClasses();
      const students = storageService.getStudents();
      const assistants = storageService.getAssistants();
      const reports = storageService.getReports();

      // Sync classes
      for (const c of classes) {
        await setDoc(doc(db, "classes", c.id), c);
      }
      // Sync students
      for (const s of students) {
        await setDoc(doc(db, "students", s.id), s);
      }
      // Sync assistants
      for (const a of assistants) {
        await setDoc(doc(db, "assistants", a.id), a);
      }
      // Sync reports
      for (const r of reports) {
        await setDoc(doc(db, "reports", r.id), r);
      }

      return {
        success: true,
        message: `Đã đồng bộ ${classes.length} lớp, ${students.length} học sinh, ${assistants.length} trợ giảng và ${reports.length} báo cáo lên Firestore thành công!`,
      };
    } catch (error: any) {
      console.error("Sync error:", error);
      throw new Error(error.message || "Lỗi đồng bộ Firebase Firestore");
    }
  },

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
        localStorage.setItem("thaythang_classes_v1", JSON.stringify(classes));
      }

      // Pull students
      const studentSnap = await getDocs(collection(db, "students"));
      const students: any[] = [];
      studentSnap.forEach((doc) => students.push(doc.data()));
      if (students.length > 0) {
        localStorage.setItem("thaythang_students_v1", JSON.stringify(students));
      }

      // Pull reports
      const repSnap = await getDocs(collection(db, "reports"));
      const reports: any[] = [];
      repSnap.forEach((doc) => reports.push(doc.data()));
      if (reports.length > 0) {
        localStorage.setItem("thaythang_reports_v1", JSON.stringify(reports));
      }

      return {
        success: true,
        message: `Đã tải dữ liệu từ Firestore thành công!`,
      };
    } catch (error: any) {
      throw new Error(error.message || "Lỗi khi kéo dữ liệu từ Firebase");
    }
  },
};
