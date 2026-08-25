import { Student, StudentReportItem, FeedbackPersona, Report, AIBulletin } from "../types";
import { storageService } from "./storage";
import {
  generateSmartClassFeedback,
  generateDetailedFullFeedback,
  GenerateFeedbackOptions,
} from "../utils/feedbackGenerator";

export interface GenerateBulletinParams {
  period: "weekly" | "monthly" | "custom";
  timeframeLabel: string;
  classId?: string;
  className?: string;
  reports: Report[];
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
  praiseStudents: Array<{
    studentName: string;
    className: string;
    highlight: string;
  }>;
  commonMisconceptions: string[];
}

export interface AIRefineRequest {
  studentName: string;
  attendance: string;
  homework: string;
  comprehension: string;
  attitude: string;
  rawComment?: string;
  action: "rewrite" | "short" | "positive" | "teacher_style" | "improvement" | "custom";
  customPrompt?: string;
}

export const aiService = {
  // Get currently active API key from settings if set
  getActiveApiKey(): string | undefined {
    const settings = storageService.getSettings();
    if (
      settings.apiKeyList &&
      settings.apiKeyList.length > 0 &&
      settings.activeApiKeyIndex >= 0 &&
      settings.activeApiKeyIndex < settings.apiKeyList.length
    ) {
      return settings.apiKeyList[settings.activeApiKeyIndex]?.trim();
    }
    return undefined;
  },

  // Single comment generation / refinement
  async refineComment(req: AIRefineRequest): Promise<string> {
    const apiKey = this.getActiveApiKey();

    try {
      const response = await fetch("/api/ai/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req, apiKey }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.comment) return data.comment;
      }
    } catch (e) {
      console.warn("API refine error, using fallback template:", e);
    }

    // Fallback template if server/AI unavailable
    return req.rawComment?.trim() || `${req.studentName} tham gia buổi học chăm chỉ, hoàn thành nhiệm vụ và tiếp thu bài tốt.`;
  },

  // Full student learning journey analysis
  async analyzeStudentProgress(
    student: Student,
    historyReports: any[]
  ): Promise<{
    strengths: string[];
    improvements: string[];
    trend: string;
    attentionPoints: string[];
    teacherAdvice: string;
    parentSummary: string;
  }> {
    const apiKey = this.getActiveApiKey();

    try {
      const response = await fetch("/api/ai/student-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student, historyReports, apiKey }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.analysis) return data.analysis;
      }
    } catch (e) {
      console.warn("AI student analysis error:", e);
    }

    return {
      strengths: [
        "Nắm vững các dạng toán cơ bản và phương pháp tính toán",
        "Có tinh thần tự giác và thái độ học tập tích cực",
      ],
      improvements: [
        "Rèn luyện thêm kỹ năng phân tích và tư duy các bài toán nâng cao",
        "Trình bày bài giải cẩn thận, chi tiết hơn ở các bước biến đổi",
      ],
      trend: "Tiến bộ đều đặn qua từng chuyên đề học tập",
      attentionPoints: ["Cần chú ý cẩn thận khi bấm máy tính và kiểm tra lại kết quả."],
      teacherAdvice: "Động viên con tự giác làm thêm phiếu bài tập nâng cao để bứt phá điểm số.",
      parentSummary: `${student.name} có nỗ lực học tập tốt, tiếp thu nhanh các kiến thức trọng tâm. Phụ huynh tiếp tục đồng hành cùng con hoàn thiện BTVN đầy đủ.`,
    };
  },

  // Batch generate draft comments for students in a class
  async batchGenerateComments(
    lessonContent: string,
    students: Array<{
      studentId: string;
      studentName: string;
      attendance: string;
      homework: string;
      comprehension: string;
      attitude: string;
    }>
  ): Promise<Array<{ studentId: string; comment: string }>> {
    const apiKey = this.getActiveApiKey();

    try {
      const response = await fetch("/api/ai/batch-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonContent, students, apiKey }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.comments && Array.isArray(data.comments) && data.comments.length > 0) {
          return data.comments;
        }
      }
    } catch (e) {
      console.warn("Batch comments error, generating fallback:", e);
    }

    return students.map((s) => ({
      studentId: s.studentId,
      comment: `${s.studentName} học tập nghiêm túc, chú ý lắng nghe và hoàn thành tốt nội dung ${lessonContent || "buổi học"}.`,
    }));
  },

  // Whole-class general feedback generation
  async generateClassFeedback(params: {
    className: string;
    teacherName: string;
    assistantName: string;
    lessonContent: string;
    homeworkAssigned: string;
    persona: FeedbackPersona;
    selectedCriteriaLabels: string[];
    customNotes?: string;
    misconceptionNotes?: string;
    misconceptionStudents?: string[];
    misconceptionTags?: string[];
    mode?: "concise" | "detailed";
    selectedCriteria?: string[];
    criteriaStudentMap?: Record<string, string>;
  }): Promise<string> {
    const apiKey = this.getActiveApiKey();

    try {
      const response = await fetch("/api/ai/class-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, apiKey }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.feedback && data.feedback.trim()) {
          return data.feedback.trim();
        }
      } else {
        const err = await response.json().catch(() => ({}));
        console.warn("Server AI returned error, switching to template generator:", err.error);
      }
    } catch (err) {
      console.warn("Fetch class-feedback failed, switching to template generator:", err);
    }

    // Seamless fallback to our rich pedagogical generator engine
    if (params.mode === "detailed") {
      return generateDetailedFullFeedback(params);
    }
    return generateSmartClassFeedback(params);
  },

  // Weekly & Monthly Academic Bulletin Generator
  async generateAIBulletin(params: GenerateBulletinParams): Promise<AIBulletin> {
    const apiKey = this.getActiveApiKey();

    try {
      const response = await fetch("/api/ai/bulletin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, apiKey }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.bulletin) {
          const newBulletin: AIBulletin = {
            id: `bulletin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            period: params.period,
            title: data.bulletin.title || `Bản Tin Học Vụ (${params.timeframeLabel})`,
            timeframeLabel: params.timeframeLabel,
            classId: params.classId || (params.className === "Toàn bộ các lớp" ? "all" : undefined),
            className: params.className || "Toàn bộ các lớp",
            content: data.bulletin.content,
            summary: data.bulletin.summary || {
              totalReports: params.reports.length,
              approvedReports: params.reports.length,
              frequentAbsenceStudents: params.frequentAbsenceStudents,
              repeatedIssueStudents: params.repeatedIssueStudents,
              praiseHighlights: params.praiseStudents,
              commonMisconceptions: params.commonMisconceptions,
            },
            createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
            generatedBy: apiKey ? "AI Gemini 2.5 Flash" : "Hệ Thống Phân Tích Học Thuật",
          };
          return newBulletin;
        }
      }
    } catch (e) {
      console.warn("API bulletin error, using smart fallback:", e);
    }

    // Client fallback
    const periodName = params.period === "monthly" ? "HÀNG THÁNG" : params.period === "custom" ? "TỔNG HỢP TOÀN KHÓA" : "HÀNG TUẦN";
    const isSpecificClass = params.className && params.className !== "Toàn bộ các lớp";
    const classSuffix = isSpecificClass ? ` - LỚP ${params.className.toUpperCase()}` : "";
    const greetingTarget = isSpecificClass ? `lớp ${params.className}` : "toàn CLB";

    return {
      id: `bulletin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      period: params.period,
      title: `Bản Tin Học Vụ & Nề Nếp ${periodName}${classSuffix} (${params.timeframeLabel})`,
      timeframeLabel: params.timeframeLabel,
      classId: params.classId || (params.className === "Toàn bộ các lớp" ? "all" : undefined),
      className: params.className || "Toàn bộ các lớp",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      generatedBy: "Hệ Thống Phân Tích Học Thuật",
      summary: {
        totalReports: params.reports.length,
        approvedReports: params.reports.length,
        frequentAbsenceStudents: params.frequentAbsenceStudents,
        repeatedIssueStudents: params.repeatedIssueStudents,
        praiseHighlights: params.praiseStudents,
        commonMisconceptions: params.commonMisconceptions,
      },
      content: `📢 **BẢN TIN HỌC VỤ & ĐỒNG HÀNH CHUYÊN MÔN ${periodName}${classSuffix} • CLB TOÁN THẦY THẮNG**
*(Tổng hợp từ các báo cáo ca dạy đã duyệt – ${params.timeframeLabel})*

Kính gửi Quý Phụ huynh và các con học sinh ${greetingTarget},

CLB TOÁN THẦY THẮNG xin gửi đến Quý Phụ huynh và các con BẢN TIN HỌC VỤ ${params.timeframeLabel.toLowerCase()}, tổng hợp chi tiết tình hình học tập, nề nếp và các điểm cần lưu ý.

---
🌟 **1. TỔNG QUAN HỌC TẬP:**
Trong ${params.timeframeLabel.toLowerCase()}, ${isSpecificClass ? `lớp ${params.className}` : "các lớp của CLB"} đã hoàn thành tốt đẹp các ca dạy theo đúng tiến độ phân phối chương trình (${params.reports.length} ca dạy đã được Thầy Thắng duyệt). Các con học sinh cơ bản nắm vững các phương pháp giải toán trọng tâm.

---
🏆 **2. TUYÊN DƯƠNG HỌC SINH TIÊU BIỂU & TIẾN BỘ NỔI BẬT:**
${
  params.praiseStudents.length > 0
    ? params.praiseStudents.map((s) => `• **${s.studentName}** (${s.className}): ${s.highlight}`).join("\n")
    : "• Tất cả các con học sinh đều thể hiện thái độ học tập tích cực và nỗ lực."
}

---
⚠️ **3. CẢNH BÁO HỌC VỤ & NHẮC NHỞ QUAN TRỌNG:**
*(Kính đề nghị Quý Phụ huynh phối hợp cùng Thầy cô sát sao nhắc nhở các con)*

📌 **Học sinh vắng / nghỉ buổi học (Cần bổ trợ bài gấp):**
${
  params.frequentAbsenceStudents.length > 0
    ? params.frequentAbsenceStudents
        .map(
          (s) =>
            `• **${s.studentName}** (${s.className}): Đã nghỉ **${s.absenceCount} buổi** (Ngày ${s.dates.join(", ")}).`
        )
        .join("\n")
    : "• Nề nếp chuyên cần rất tốt, không có học sinh nghỉ nhiều buổi."
}

📌 **Học sinh bị nhắc nhiều lần về cùng một vấn đề (Đi muộn, mất trật tự, tính ẩu, lười tư duy):**
${
  params.repeatedIssueStudents.length > 0
    ? params.repeatedIssueStudents
        .map(
          (s) =>
            `• **${s.studentName}** (${s.className}) - *[${s.issueLabel}]*: Bị nhắc ${s.occurrences} lần (${s.details.join("; ")}).`
        )
        .join("\n")
    : "• Đa số học sinh giữ vững nề nếp và thái độ học tập nghiêm túc."
}

---
💡 **4. CÁC LỖI SAI KIẾN THỨC CẦN RÈN LUYỆN THÊM:**
${
  params.commonMisconceptions.length > 0
    ? params.commonMisconceptions.map((m) => `• ${m}`).join("\n")
    : "• Đa số các con nắm chắc các bước giải, chỉ cần lưu ý tính cẩn thận."
}

---
🎯 **5. LỜI DẶN DÒ TỪ THẦY THẮNG & ĐỘI NGŨ TRỢ GIẢNG:**
Kính chúc Quý Phụ huynh luôn dồi dào sức khỏe, chúc các con luôn đam mê học toán, tự tin và bứt phá điểm số trong các kỳ thi sắp tới!`,
    };
  },
};

