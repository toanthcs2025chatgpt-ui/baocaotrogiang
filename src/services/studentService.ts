import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { getFirebaseInstance, notifySyncStatus } from "./firebase";
import { storageService } from "./storage";
import { Student } from "../types";

const STUDENTS_COLLECTION = "students";

export const studentService = {
  async getStudents(classId?: string): Promise<Student[]> {
    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        const ref = collection(db, STUDENTS_COLLECTION);
        const q = classId ? query(ref, where("classId", "==", classId)) : ref;
        const snap = await getDocs(q);
        const list: Student[] = [];
        snap.forEach((d) => list.push(d.data() as Student));
        if (list.length > 0) {
          if (!classId) {
            storageService.saveStudents(list);
          }
          return list;
        }
      } catch (err) {
        console.warn("studentService.getStudents error:", err);
      }
    }
    return classId ? storageService.getStudentsByClass(classId) : storageService.getStudents();
  },

  async saveStudent(student: Student): Promise<Student> {
    notifySyncStatus("saving", `Đang lưu học sinh ${student.name}...`);
    storageService.saveStudent(student);

    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, STUDENTS_COLLECTION, student.id), student, { merge: true });
        notifySyncStatus("synced", `Đã đồng bộ học sinh ${student.name} lên Firebase`);
      } catch (err: any) {
        console.error("studentService.saveStudent error:", err);
        notifySyncStatus("error", "Lỗi lưu học sinh: " + err.message);
      }
    }
    return student;
  },

  async saveStudents(students: Student[]): Promise<void> {
    notifySyncStatus("saving", `Đang lưu ${students.length} học sinh...`);
    storageService.saveStudents(students);

    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        for (const s of students) {
          await setDoc(doc(db, STUDENTS_COLLECTION, s.id), s, { merge: true });
        }
        notifySyncStatus("synced", `Đã đồng bộ ${students.length} học sinh lên Firebase`);
      } catch (err: any) {
        console.error("studentService.saveStudents error:", err);
        notifySyncStatus("error", "Lỗi lưu danh sách học sinh: " + err.message);
      }
    }
  },

  async deleteStudent(studentId: string): Promise<void> {
    notifySyncStatus("saving", "Đang xóa học sinh...");
    storageService.deleteStudent(studentId);

    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, STUDENTS_COLLECTION, studentId));
        notifySyncStatus("synced", "Đã xóa học sinh trên Firebase");
      } catch (err: any) {
        console.error("studentService.deleteStudent error:", err);
        notifySyncStatus("error", "Lỗi xóa học sinh: " + err.message);
      }
    }
  },

  // Realtime subscription to students
  subscribeStudents(callback: (students: Student[]) => void, classId?: string): Unsubscribe | null {
    const { db, isConfigured } = getFirebaseInstance();
    if (!isConfigured || !db) return null;

    try {
      const ref = collection(db, STUDENTS_COLLECTION);
      const q = classId ? query(ref, where("classId", "==", classId)) : ref;
      return onSnapshot(
        q,
        (snapshot) => {
          const list: Student[] = [];
          snapshot.forEach((d) => list.push(d.data() as Student));
          if (list.length > 0 && !classId) {
            storageService.saveStudents(list);
          }
          callback(list);
        },
        (err) => {
          console.warn("subscribeStudents error:", err);
          notifySyncStatus("offline", "Mất kết nối Firestore (Students)");
        }
      );
    } catch (e) {
      return null;
    }
  },
};
