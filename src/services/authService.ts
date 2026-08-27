import {
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
  Unsubscribe,
} from "firebase/firestore";
import { getFirebaseInstance, notifySyncStatus } from "./firebase";
import { storageService } from "./storage";
import { User, UserRole } from "../types";

const USERS_COLLECTION = "users";

export const authService = {
  // Check if currentUser exists in Firestore or local
  async getCurrentUser(): Promise<User | null> {
    const local = storageService.getCurrentUser();
    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db && local?.id) {
      try {
        const snap = await getDoc(doc(db, USERS_COLLECTION, local.id));
        if (snap.exists()) {
          const uData = snap.data() as User;
          storageService.setCurrentUser(uData);
          return uData;
        }
      } catch (e) {
        console.warn("authService.getCurrentUser error:", e);
      }
    }
    return local;
  },

  async getAllUsers(): Promise<User[]> {
    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, USERS_COLLECTION));
        const users: User[] = [];
        snap.forEach((d) => users.push(d.data() as User));
        return users;
      } catch (e) {
        console.warn("authService.getAllUsers error:", e);
      }
    }
    return [
      storageService.getAdminUser(),
      ...storageService.getAssistants().map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        role: "assistant" as UserRole,
        username: a.username,
        password: a.password,
        avatar: a.avatar,
        assignedClassIds: a.classes,
        assistantId: a.id,
      })),
    ];
  },

  async saveUser(user: User): Promise<void> {
    notifySyncStatus("saving", "Đang lưu thông tin tài khoản...");
    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, USERS_COLLECTION, user.id), {
          ...user,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        notifySyncStatus("synced", "Đã đồng bộ tài khoản lên Firebase");
      } catch (err: any) {
        console.error("saveUser error:", err);
        notifySyncStatus("error", "Lỗi lưu tài khoản: " + err.message);
      }
    }
    if (user.role === "admin") {
      storageService.saveAdminUser(user);
    }
  },

  async deleteUser(userId: string): Promise<void> {
    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, USERS_COLLECTION, userId));
      } catch (e) {
        console.warn("deleteUser error:", e);
      }
    }
  },

  // Subscribe to all ecosystem users realtime
  subscribeUsers(callback: (users: User[]) => void): Unsubscribe | null {
    const { db, isConfigured } = getFirebaseInstance();
    if (!isConfigured || !db) return null;

    try {
      const q = collection(db, USERS_COLLECTION);
      return onSnapshot(q, (snapshot) => {
        const users: User[] = [];
        snapshot.forEach((d) => users.push(d.data() as User));
        callback(users);
      }, (err) => {
        console.warn("subscribeUsers error:", err);
      });
    } catch (e) {
      return null;
    }
  },
};
