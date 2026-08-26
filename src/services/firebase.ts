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
      const masterSlots = storageService.getMasterTimetableSlots();
      const timetableSlots = storageService.getTimetableSlots();
      const settings = storageService.getSettings();

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
      // Sync master timetable slots
      for (const m of masterSlots) {
        await setDoc(doc(db, "master_timetable_slots", m.id), m);
      }
      // Sync timetable slots
      for (const t of timetableSlots) {
        await setDoc(doc(db, "timetable_slots", t.id), t);
      }
      // Sync settings
      await setDoc(doc(db, "settings", "global_config"), settings);

      return {
        success: true,
        message: `Đã đồng bộ ${classes.length} lớp, ${students.length} học sinh, ${assistants.length} trợ giảng, ${reports.length} báo cáo và ${masterSlots.length + timetableSlots.length} ca lịch học lên Firestore thành công!`,
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

      // Pull master timetable slots
      const masterSnap = await getDocs(collection(db, "master_timetable_slots"));
      const masterSlots: any[] = [];
      masterSnap.forEach((doc) => masterSlots.push(doc.data()));
      if (masterSlots.length > 0) {
        localStorage.setItem("thaythang_master_timetable_slots_v2", JSON.stringify(masterSlots));
      }

      // Pull timetable slots
      const timeSnap = await getDocs(collection(db, "timetable_slots"));
      const timetableSlots: any[] = [];
      timeSnap.forEach((doc) => timetableSlots.push(doc.data()));
      if (timetableSlots.length > 0) {
        localStorage.setItem("thaythang_timetable_slots_v2", JSON.stringify(timetableSlots));
      }

      return {
        success: true,
        message: `Đã tải toàn bộ dữ liệu từ Firestore thành công!`,
      };
    } catch (error: any) {
      throw new Error(error.message || "Lỗi khi kéo dữ liệu từ Firebase");
    }
  },
};
