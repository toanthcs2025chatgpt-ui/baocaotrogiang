import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { getFirebaseInstance, notifySyncStatus } from "./firebase";
import { storageService } from "./storage";
import { ClassItem } from "../types";

const CLASSES_COLLECTION = "classes";

export const classService = {
  // Get all classes: from Firestore if connected, fallback to local storage
  async getClasses(): Promise<ClassItem[]> {
    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, CLASSES_COLLECTION));
        const list: ClassItem[] = [];
        snap.forEach((d) => list.push(d.data() as ClassItem));
        if (list.length > 0) {
          storageService.saveClasses(list);
          return list;
        }
      } catch (err) {
        console.warn("classService.getClasses Firestore fetch error:", err);
      }
    }
    return storageService.getClasses();
  },

  async saveClass(cls: ClassItem): Promise<ClassItem> {
    notifySyncStatus("saving", `Đang lưu lớp ${cls.name}...`);
    storageService.saveClass(cls);

    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, CLASSES_COLLECTION, cls.id), cls, { merge: true });
        notifySyncStatus("synced", `Đã đồng bộ lớp ${cls.name} lên Firebase`);
      } catch (err: any) {
        console.error("classService.saveClass error:", err);
        notifySyncStatus("error", "Lỗi lưu lớp: " + err.message);
      }
    }
    return cls;
  },

  async deleteClass(classId: string): Promise<void> {
    notifySyncStatus("saving", "Đang xóa lớp...");
    storageService.deleteClass(classId);

    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, CLASSES_COLLECTION, classId));
        notifySyncStatus("synced", "Đã xóa lớp trên Firebase");
      } catch (err: any) {
        console.error("classService.deleteClass error:", err);
        notifySyncStatus("error", "Lỗi xóa lớp: " + err.message);
      }
    }
  },

  // Realtime subscription to classes collection
  subscribeClasses(callback: (classes: ClassItem[]) => void): Unsubscribe | null {
    const { db, isConfigured } = getFirebaseInstance();
    if (!isConfigured || !db) return null;

    try {
      const q = collection(db, CLASSES_COLLECTION);
      return onSnapshot(
        q,
        (snapshot) => {
          const list: ClassItem[] = [];
          snapshot.forEach((d) => list.push(d.data() as ClassItem));
          if (list.length > 0) {
            storageService.saveClasses(list);
          }
          callback(list);
        },
        (err) => {
          console.warn("subscribeClasses error:", err);
          notifySyncStatus("offline", "Mất kết nối Firestore (Classes)");
        }
      );
    } catch (e) {
      return null;
    }
  },
};
