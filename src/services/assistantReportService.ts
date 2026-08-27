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
import { sessionService } from "./sessionService";
import { Report, AssistantReport, StudentReportItem, User } from "../types";

const ASSISTANT_REPORTS_COLLECTION = "assistantReports";
const LEGACY_REPORTS_COLLECTION = "reports"; // Backward-compatibility sync

// Helper to convert internal Report to ecosystem AssistantReport
export function reportToAssistantReport(report: Report): AssistantReport {
  const sessionId = report.sessionId || sessionService.generateSessionId(report.date, report.shift, report.classId);

  const absentStudents = (report.students || [])
    .filter((s) => s.attendance === "excused" || s.attendance === "unexcused")
    .map((s) => `${s.studentName} (${s.attendance === "excused" ? "Có phép" : "Không phép"})`);

  const studentsNeedAttention = (report.students || [])
    .filter((s) => (s.comprehension && (s.comprehension === "needs_effort" || s.comprehension === "not_grasping")) ||
                   (s.attitude && (s.attitude === "passive" || s.attitude === "unfocused")) ||
                   (s.homework && s.homework === "none"))
    .map((s) => ({
      studentId: s.studentId,
      studentName: s.studentName,
      reason: s.comment || (s.homework === "none" ? "Chưa làm BTVN" : "Cần lưu ý thêm về mức độ hiểu bài & thái độ"),
    }));

  const presentCount = (report.students || []).filter((s) => s.attendance === "present").length;
  const lateCount = (report.students || []).filter((s) => s.attendance === "late").length;
  const excusedCount = (report.students || []).filter((s) => s.attendance === "excused").length;
  const unexcusedCount = (report.students || []).filter((s) => s.attendance === "unexcused").length;

  const hwCompleted = (report.students || []).filter((s) => s.homework === "completed" || s.homework === "excellent").length;
  const hwIncomplete = (report.students || []).filter((s) => s.homework === "incomplete").length;
  const hwNone = (report.students || []).filter((s) => s.homework === "none").length;

  return {
    id: report.id,
    assistantId: report.assistantId,
    assistantName: report.assistantName,
    date: report.date,
    shift: report.shift,
    classId: report.classId,
    className: report.className,
    teacherId: report.teacherId || "teacher_thaythang",
    teacherName: report.teacherName || "Thầy Thắng",
    sessionId,
    attendanceData: {
      total: (report.students || []).length,
      present: presentCount,
      late: lateCount,
      excused: excusedCount,
      unexcused: unexcusedCount,
      students: report.students,
    },
    homeworkData: {
      assigned: report.homeworkAssigned,
      completedCount: hwCompleted,
      incompleteCount: hwIncomplete,
      noneCount: hwNone,
      students: (report.students || []).map((s) => ({
        studentId: s.studentId,
        studentName: s.studentName,
        homework: s.homework,
        score: s.homeworkScore,
        comment: s.comment,
      })),
    },
    absentStudents,
    studentsNeedAttention,
    generalReport: report.generalFeedback,
    issues: report.misconceptionTags || [],
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

// Convert ecosystem AssistantReport back to full internal Report
export function assistantReportToReport(ar: AssistantReport & Partial<Report>): Report {
  const students: StudentReportItem[] = ar.attendanceData?.students || ar.students || [];

  return {
    id: ar.id,
    date: ar.date,
    shift: ar.shift,
    classId: ar.classId,
    className: ar.className,
    assistantId: ar.assistantId,
    assistantName: ar.assistantName,
    assistantIds: ar.assistantIds || (ar.assistantId ? [ar.assistantId] : []),
    assistantNames: ar.assistantNames || (ar.assistantName ? [ar.assistantName] : []),
    teacherId: ar.teacherId,
    teacherName: ar.teacherName,
    sessionId: ar.sessionId,
    lessonContent: ar.lessonContent || "",
    homeworkAssigned: ar.homeworkAssigned || ar.homeworkData?.assigned || "",
    generalFeedback: ar.generalFeedback || ar.generalReport || "",
    selectedCriteria: ar.selectedCriteria || [],
    selectedPersona: ar.selectedPersona || "pedagogical",
    criteriaStudentMap: ar.criteriaStudentMap || {},
    misconceptionNotes: ar.misconceptionNotes || "",
    misconceptionStudents: ar.misconceptionStudents || [],
    misconceptionTags: ar.misconceptionTags || ar.issues || [],
    misconceptionStudentMap: ar.misconceptionStudentMap || {},
    customMisconceptionTags: ar.customMisconceptionTags || [],
    attendanceStats: {
      total: ar.attendanceData?.total || students.length,
      present: ar.attendanceData?.present || students.filter((s) => s.attendance === "present").length,
      late: ar.attendanceData?.late || students.filter((s) => s.attendance === "late").length,
      excused: ar.attendanceData?.excused || students.filter((s) => s.attendance === "excused").length,
      unexcused: ar.attendanceData?.unexcused || students.filter((s) => s.attendance === "unexcused").length,
    },
    students,
    status: ar.status || "submitted",
    notes: ar.notes,
    approvedBy: ar.approvedBy,
    approvedAt: ar.approvedAt,
    createdAt: ar.createdAt || new Date().toISOString(),
    updatedAt: ar.updatedAt || new Date().toISOString(),
  };
}

export const assistantReportService = {
  // Check for duplicate reports for (date, shift, classId)
  async checkDuplicateReport(
    date: string,
    shift: string,
    classId: string,
    currentReportId?: string
  ): Promise<Report | null> {
    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        const q = query(
          collection(db, ASSISTANT_REPORTS_COLLECTION),
          where("date", "==", date),
          where("shift", "==", shift),
          where("classId", "==", classId)
        );
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          const ar = docSnap.data() as AssistantReport;
          if (!currentReportId || ar.id !== currentReportId) {
            return assistantReportToReport(ar);
          }
        }
      } catch (err) {
        console.warn("checkDuplicateReport error:", err);
      }
    }

    // Fallback to local check
    const localReports = storageService.getReports();
    const found = localReports.find(
      (r) =>
        r.date === date &&
        r.shift === shift &&
        r.classId === classId &&
        (!currentReportId || r.id !== currentReportId)
    );
    return found || null;
  },

  async createAssistantReport(report: Report): Promise<Report> {
    return this.saveAssistantReport(report, "create");
  },

  async updateAssistantReport(report: Report): Promise<Report> {
    return this.saveAssistantReport(report, "update");
  },

  async saveAssistantReport(report: Report, action: "create" | "update" = "update"): Promise<Report> {
    notifySyncStatus("saving", `Đang lưu báo cáo lớp ${report.className}...`);

    // Ensure sessionId is established
    if (!report.sessionId) {
      report.sessionId = sessionService.generateSessionId(report.date, report.shift, report.classId);
    }

    // Always update local cache
    storageService.saveReport(report);

    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        const ar = reportToAssistantReport(report);

        // 1. Save to ecosystem collection `assistantReports/{reportId}`
        // Include full fields so internal properties remain 100% intact
        const fullCloudPayload = {
          ...report,
          ...ar,
        };

        await setDoc(doc(db, ASSISTANT_REPORTS_COLLECTION, report.id), fullCloudPayload, { merge: true });

        // 2. Also keep backward compatibility in `reports/{reportId}`
        await setDoc(doc(db, LEGACY_REPORTS_COLLECTION, report.id), fullCloudPayload, { merge: true });

        // 3. Link or create teachingSessions/{sessionId} in shared database
        await sessionService.saveSession({
          id: report.sessionId,
          classId: report.classId,
          className: report.className,
          date: report.date,
          shift: report.shift,
          teacherId: report.teacherId || "teacher_thaythang",
          teacherName: report.teacherName || "Thầy Thắng",
          assistantId: report.assistantId,
          assistantName: report.assistantName,
          lessonContent: report.lessonContent,
          assistantReportId: report.id,
          homeworkAssigned: report.homeworkAssigned,
          status: report.status === "approved" ? "completed" : "in_progress",
          updatedAt: new Date().toISOString(),
        });

        notifySyncStatus("synced", `Đã đồng bộ realtime báo cáo lớp ${report.className} lên Firebase`);
      } catch (err: any) {
        console.error("assistantReportService.saveAssistantReport error:", err);
        notifySyncStatus("error", "Lỗi đồng bộ Firebase: " + err.message);
      }
    }

    return report;
  },

  async deleteAssistantReport(reportId: string): Promise<void> {
    notifySyncStatus("saving", "Đang xóa báo cáo...");
    storageService.deleteReport(reportId);

    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, ASSISTANT_REPORTS_COLLECTION, reportId));
        await deleteDoc(doc(db, LEGACY_REPORTS_COLLECTION, reportId));
        notifySyncStatus("synced", "Đã xóa báo cáo trên Firebase");
      } catch (err: any) {
        console.error("deleteAssistantReport error:", err);
        notifySyncStatus("error", "Lỗi xóa báo cáo: " + err.message);
      }
    }
  },

  async getAssistantReports(user?: User | null): Promise<Report[]> {
    const { db, isConfigured } = getFirebaseInstance();
    if (isConfigured && db) {
      try {
        const ref = collection(db, ASSISTANT_REPORTS_COLLECTION);
        const q = query(ref, orderBy("date", "desc"));
        const snap = await getDocs(q);
        const reports: Report[] = [];
        snap.forEach((d) => {
          const ar = d.data() as AssistantReport;
          reports.push(assistantReportToReport(ar));
        });

        if (reports.length > 0) {
          storageService.saveReports(reports);
          return this.filterReportsByRole(reports, user);
        }
      } catch (err) {
        console.warn("getAssistantReports error:", err);
      }
    }

    const local = storageService.getReports();
    return this.filterReportsByRole(local, user);
  },

  // Realtime subscription via Firestore onSnapshot()
  subscribeAssistantReports(
    callback: (reports: Report[]) => void,
    user?: User | null
  ): Unsubscribe | null {
    const { db, isConfigured } = getFirebaseInstance();
    if (!isConfigured || !db) return null;

    try {
      const q = query(collection(db, ASSISTANT_REPORTS_COLLECTION), orderBy("date", "desc"));
      return onSnapshot(
        q,
        (snapshot) => {
          const reports: Report[] = [];
          snapshot.forEach((d) => {
            const ar = d.data() as AssistantReport;
            reports.push(assistantReportToReport(ar));
          });

          if (reports.length > 0) {
            storageService.saveReports(reports);
          }

          const filtered = this.filterReportsByRole(reports, user);
          notifySyncStatus("synced", `Đã đồng bộ realtime (${reports.length} báo cáo)`);
          callback(filtered);
        },
        (err) => {
          console.warn("subscribeAssistantReports snapshot error:", err);
          notifySyncStatus("offline", "Mất kết nối Firestore (Đang chạy chế độ Offline)");
        }
      );
    } catch (e) {
      return null;
    }
  },

  // Role-based filtering:
  // - Admin: see all reports
  // - Teacher: see reports for assigned classes
  // - Assistant: see own reports or assigned classes
  filterReportsByRole(reports: Report[], user?: User | null): Report[] {
    if (!user || user.role === "admin") return reports;

    if (user.role === "teacher") {
      if (user.assignedClassIds && user.assignedClassIds.length > 0) {
        return reports.filter((r) => user.assignedClassIds?.includes(r.classId));
      }
      return reports; // If no class filter specified, teacher sees all teaching reports
    }

    // Assistant role: only sees own reports or assigned classes
    return reports.filter(
      (r) =>
        r.assistantId === user.id ||
        r.assistantId === user.assistantId ||
        (user.assignedClassIds && user.assignedClassIds.includes(r.classId)) ||
        (r.assistantIds && (r.assistantIds.includes(user.id) || (user.assistantId && r.assistantIds.includes(user.assistantId))))
    );
  },
};
