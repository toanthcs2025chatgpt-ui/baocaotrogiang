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
import { TeachingSession, TimetableSlot } from "../types";
import { storageService } from "./storage";

const TEACHING_SESSIONS_COLLECTION = "teachingSessions";

export const sessionService = {
  // Generate a deterministic or standard sessionId for a lesson
  generateSessionId(date: string, shift: string, classId: string): string {
    const cleanDate = date.replace(/[^a-zA-Z0-9]/g, "");
    const cleanShift = shift.replace(/[^a-zA-Z0-9]/g, "");
    const cleanClass = classId.replace(/[^a-zA-Z0-9]/g, "");
    return `session_${cleanDate}_${cleanShift}_${cleanClass}`;
  },

  async getSession(sessionId: string): Promise<TeachingSession | null> {
    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        const snap = await getDoc(doc(db, TEACHING_SESSIONS_COLLECTION, sessionId));
        if (snap.exists()) {
          return snap.data() as TeachingSession;
        }
      } catch (e) {
        console.warn("sessionService.getSession error:", e);
      }
    }
    return null;
  },

  async getSessions(date?: string, classId?: string): Promise<TeachingSession[]> {
    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        const ref = collection(db, TEACHING_SESSIONS_COLLECTION);
        let q = query(ref, orderBy("date", "desc"));
        if (date && classId) {
          q = query(ref, where("date", "==", date), where("classId", "==", classId));
        } else if (date) {
          q = query(ref, where("date", "==", date));
        } else if (classId) {
          q = query(ref, where("classId", "==", classId));
        }
        const snap = await getDocs(q);
        const list: TeachingSession[] = [];
        snap.forEach((d) => list.push(d.data() as TeachingSession));
        return list;
      } catch (e) {
        console.warn("sessionService.getSessions error:", e);
      }
    }
    return [];
  },

  // Save or link a teaching session with assistant report
  async saveSession(session: TeachingSession): Promise<TeachingSession> {
    notifySyncStatus("saving", `Đang lưu buổi học ${session.className}...`);
    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, TEACHING_SESSIONS_COLLECTION, session.id), {
          ...session,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        notifySyncStatus("synced", "Đã đồng bộ thông tin buổi học chung lên Firebase");
      } catch (err: any) {
        console.error("sessionService.saveSession error:", err);
        notifySyncStatus("error", "Lỗi lưu buổi học: " + err.message);
      }
    }
    return session;
  },

  // Subscribe to real-time updates for a single session
  subscribeSession(sessionId: string, callback: (session: TeachingSession | null) => void): Unsubscribe | null {
    const { db, isConfigured } = getFirebaseInstance();
    if (!isConfigured || !db) return null;

    try {
      return onSnapshot(
        doc(db, TEACHING_SESSIONS_COLLECTION, sessionId),
        (snap) => {
          if (snap.exists()) {
            callback(snap.data() as TeachingSession);
          } else {
            callback(null);
          }
        },
        (err) => {
          console.warn("subscribeSession error:", err);
        }
      );
    } catch (e) {
      return null;
    }
  },

  // Subscribe to all teaching sessions (Realtime dashboard for Admin & Teachers)
  subscribeAllSessions(callback: (sessions: TeachingSession[]) => void): Unsubscribe | null {
    const { db, isConfigured } = getFirebaseInstance();
    if (!isConfigured || !db) return null;

    try {
      const q = query(collection(db, TEACHING_SESSIONS_COLLECTION), orderBy("date", "desc"));
      return onSnapshot(
        q,
        (snapshot) => {
          const list: TeachingSession[] = [];
          snapshot.forEach((d) => list.push(d.data() as TeachingSession));
          callback(list);
        },
        (err) => {
          console.warn("subscribeAllSessions error:", err);
        }
      );
    } catch (e) {
      return null;
    }
  },
};
