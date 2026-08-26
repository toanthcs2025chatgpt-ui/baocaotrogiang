export type UserRole = "admin" | "assistant";

export type TabType =
  | "dashboard"
  | "schedule"
  | "create_report"
  | "reports_history"
  | "students"
  | "classes"
  | "assistants"
  | "statistics"
  | "settings";

export type ShiftPeriod = "morning" | "afternoon" | "evening";

export type ShiftId =
  | "morning_1"
  | "morning_2"
  | "afternoon_1"
  | "afternoon_2"
  | "evening_1"
  | "evening_2";

export interface ShiftConfig {
  id: ShiftId;
  name: string; // "Ca Sáng 1", "Ca Sáng 2", "Ca Chiều 1", "Ca Chiều 2", "Ca Tối 1", "Ca Tối 2"
  period: ShiftPeriod; // "morning" | "afternoon" | "evening"
  startTime: string; // "07:30"
  endTime: string; // "09:30"
}

export type ScheduleItemStatus = "upcoming" | "in_progress" | "completed" | "cancelled";

export interface TimetableSlot {
  id: string;
  date: string; // "YYYY-MM-DD"
  dayOfWeek: number; // 1 = Thứ Hai, ..., 7 = Chủ Nhật
  shiftId: ShiftId;
  classId?: string;
  className: string;
  teacherName?: string;
  assistantId?: string;
  assistantName?: string;
  room?: string;
  
  // Lesson & Progress tracking fields
  lessonTopic: string; // Tên bài học / Chuyên đề
  lessonContent?: string; // Nội dung bài học (Lý thuyết, ví dụ, bài tập trọng tâm)
  progressNote?: string; // Đã học đến phần nào (Ví dụ: "Đã xong Dạng 2, chữa bài 1-4")
  homework?: string; // Bài tập về nhà giao
  homeworkDeadline?: string; // Hạn nộp BTVN
  generalNotes?: string; // Ghi chú thêm
  status: ScheduleItemStatus; // "upcoming" | "in_progress" | "completed" | "cancelled"
  
  isRecurringMaster?: boolean; // Lịch cố định hàng tuần cả năm
  applyToAllWeeks?: boolean;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface MasterTimetableSlot {
  id: string;
  dayOfWeek: number; // 1 = T2 ... 7 = CN
  shiftId: ShiftId;
  classId?: string;
  className: string;
  teacherName?: string;
  assistantId?: string;
  assistantName?: string;
  room?: string;
  lessonTopic?: string;
  lessonContent?: string;
  progressNote?: string;
  homework?: string;
  homeworkDeadline?: string;
  generalNotes?: string;
}

export interface TimetableSettings {
  shifts: ShiftConfig[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  username?: string;
  password?: string;
  phone?: string;
  avatar?: string;
  assignedClassIds?: string[];
  assistantId?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  grade: string;
  teacherName: string;
  assistantIds: string[];
  schedule: string; // e.g. "Thứ 3, Thứ 5 (18:00 - 20:00)"
  room: string;
  description?: string;
  active: boolean;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  className?: string;
  dob?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  note?: string;
  avatar?: string;
  joinedDate?: string;
}

export interface Assistant {
  id: string;
  name: string;
  email: string;
  phone: string;
  username?: string; // Tên đăng nhập
  password?: string; // Mật khẩu
  classes: string[]; // class IDs
  avatar?: string;
  active: boolean;
  joinedDate: string;
  notes?: string;
}

export type AttendanceStatus = "present" | "late" | "excused" | "unexcused";
export type HomeworkStatus = "excellent" | "completed" | "incomplete" | "none";
export type ComprehensionLevel = "very_good" | "good" | "acceptable" | "needs_effort" | "not_grasping";
export type AttitudeLevel = "very_active" | "active" | "normal" | "passive" | "unfocused";

export interface StudentReportItem {
  studentId: string;
  studentName: string;
  attendance: AttendanceStatus;
  homework: HomeworkStatus;
  comprehension?: ComprehensionLevel;
  attitude?: AttitudeLevel;
  comment?: string;
  homeworkScore?: number | null;
  testScore?: number | null;
  quickTags?: string[]; // e.g. ["Đi học đầy đủ", "Hoàn thành BTVN", "Tập trung nghe giảng", ...]
  bonusPoints?: number;
  avatar?: string;
}

export type FeedbackPersona =
  | "pedagogical" // Chuẩn sư phạm – Khách quan
  | "positive" // Tích cực – Khích lệ
  | "friendly" // Thân thiện – Gần gũi
  | "warm_humor"; // “Thầy cô chủ nhiệm” – Ấm áp & Hài hước

export interface FeedbackCriterionItem {
  id: string;
  category: string;
  categoryName: string;
  label: string;
  type: "praise" | "warning"; // Khen | Lưu ý
  exclusiveWith?: string; // ID of opposite criterion to auto-uncheck
}

export type ReportStatus = "draft" | "submitted" | "approved";

export interface Report {
  id: string;
  date: string; // YYYY-MM-DD
  shift: string; // e.g. "Ca 1 (17:30 - 19:30)" | "Ca 2 (19:30 - 21:30)"
  classId: string;
  className: string;
  assistantId: string;
  assistantName: string;
  assistantIds?: string[];
  assistantNames?: string[];
  teacherName: string;
  lessonContent: string;
  homeworkAssigned?: string;
  
  // Whole-Class General Feedback (Nhận xét chung cả lớp)
  generalFeedback?: string;
  selectedCriteria?: string[];
  selectedPersona?: FeedbackPersona;
  criteriaStudentMap?: Record<string, string>; // criterionId -> list of student names
  
  // Ghi chú riêng về kiến thức các em còn lầm lẫn, sai sót (Mục mới theo yêu cầu)
  misconceptionNotes?: string;
  misconceptionStudents?: string[]; // Danh sách tên HS mắc lỗi chung
  misconceptionTags?: string[]; // Các lỗi sai toán học phổ biến được chọn
  misconceptionStudentMap?: Record<string, string[]>; // Error tag -> list of student names
  customMisconceptionTags?: string[]; // Custom errors added by user

  // Attendance & Quick roll call
  attendanceStats?: {
    total: number;
    present: number;
    late: number;
    excused: number;
    unexcused: number;
  };
  absentOrLateNotes?: string;

  students: StudentReportItem[];
  status: ReportStatus;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIStudentAnalysis {
  strengths: string[];
  improvements: string[];
  trend: string;
  attentionPoints: string[];
  teacherAdvice: string;
  parentSummary: string;
  generatedAt?: string;
}

export interface AIBulletin {
  id: string;
  period: "weekly" | "monthly" | "custom";
  title: string;
  timeframeLabel: string;
  classId?: string; // or 'all'
  className?: string;
  content: string; // The generated full bulletin text
  summary: {
    totalReports: number;
    approvedReports: number;
    frequentAbsenceStudents: Array<{
      studentId: string;
      studentName: string;
      className: string;
      absenceCount: number;
      dates: string[];
    }>;
    repeatedIssueStudents: Array<{
      studentId: string;
      studentName: string;
      className: string;
      issueType: string;
      issueLabel: string;
      occurrences: number;
      details: string[];
    }>;
    praiseHighlights: Array<{
      studentName: string;
      className: string;
      highlight: string;
    }>;
    commonMisconceptions: string[];
  };
  createdAt: string;
  generatedBy: string;
}

export interface AppNotification {
  id: string;
  type: "report_approved" | "report_submitted" | "report_created" | "general";
  title: string;
  message: string;
  reportId?: string;
  targetAssistantId?: string; // ID of assistant who receives this notification
  targetRole?: UserRole | "all";
  senderName: string;
  createdAt: string;
  read: boolean;
  className?: string;
  reportDate?: string;
  reportShift?: string;
}

export interface ClubSettings {
  clubName: string;
  slogan: string;
  hotline: string;
  address: string;
  apiKeyList: string[];
  activeApiKeyIndex: number;
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  useFirebase: boolean;
  googleDriveConfig?: {
    isConnected: boolean;
    email?: string;
    connectedAt?: string;
    autoSync?: boolean;
    folderName?: string;
  };
}
