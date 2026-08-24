import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  School,
  GraduationCap,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  CheckSquare,
  Key,
  Landmark,
  SunMedium,
  MessageCircleHeart,
  Coffee,
  X,
  UserCheck,
  ListChecks,
  ArrowRight,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  PenTool,
  Flame,
  ShieldCheck,
  Zap,
  ThumbsUp,
  AlertTriangle,
  Trophy,
  Trash2,
  Camera,
  Layers,
  Users,
} from "lucide-react";
import {
  Report,
  StudentReportItem,
  User,
  ClassItem,
  Assistant,
  Student,
  AttendanceStatus,
  HomeworkStatus,
  FeedbackPersona,
} from "../types";
import { storageService } from "../services/storage";
import { aiService } from "../services/ai";
import {
  FEEDBACK_CRITERIA,
  FEEDBACK_CRITERIA_CATEGORIES,
  PERSONA_STYLES,
  SAMPLE_FEEDBACK_TEMPLATES,
  SampleFeedbackTemplate,
  STUDENT_QUICK_TAGS,
  COMMON_MATH_MISCONCEPTIONS,
  QUICK_STUDENT_REMARK_SUGGESTIONS,
} from "../data/feedbackCriteria";
import {
  generateDirectCriteriaFeedback,
  generateSmartClassFeedback,
  generateDetailedFullFeedback,
} from "../utils/feedbackGenerator";
import { SampleFeedbackModal } from "./SampleFeedbackModal";
import { QuickApiKeyModal } from "./QuickApiKeyModal";

interface CreateReportViewProps {
  currentUser: User;
  classes?: ClassItem[];
  assistants?: Assistant[];
  allStudents?: Student[];
  onReportSaved?: (report: Report) => void;
  editingReport?: Report | null;
  onCancelEdit?: () => void;
}

export const CreateReportView: React.FC<CreateReportViewProps> = ({
  currentUser,
  classes: propsClasses,
  assistants: propsAssistants,
  allStudents: propsAllStudents,
  onReportSaved,
  editingReport,
  onCancelEdit,
}) => {
  const isAdmin = currentUser.role === "admin";
  const settings = storageService.getSettings();

  const classes = useMemo(() => {
    return propsClasses && propsClasses.length > 0 ? propsClasses : storageService.getClasses();
  }, [propsClasses]);

  const assistants = useMemo(() => {
    return propsAssistants && propsAssistants.length > 0 ? propsAssistants : storageService.getAssistants();
  }, [propsAssistants]);

  const allStudents = useMemo(() => {
    return propsAllStudents && propsAllStudents.length > 0 ? propsAllStudents : storageService.getStudents();
  }, [propsAllStudents]);

  // Section 1: General Info
  const [date, setDate] = useState<string>(() => {
    if (editingReport) return editingReport.date;
    return new Date().toISOString().split("T")[0];
  });
  const [shift, setShift] = useState<string>(() => {
    if (editingReport) return editingReport.shift;
    return "Ca 1 (17:30 – 19:45)";
  });
  const [classId, setClassId] = useState<string>(() => {
    if (editingReport) return editingReport.classId;
    const initialClasses = propsClasses && propsClasses.length > 0 ? propsClasses : storageService.getClasses();
    if (initialClasses && initialClasses.length > 0) return initialClasses[0].id;
    return "cls_9a1";
  });

  // Hỗ trợ chọn 2 hoặc 3 trợ giảng cùng ca
  const [selectedAssistantIds, setSelectedAssistantIds] = useState<string[]>(() => {
    if (editingReport?.assistantIds && editingReport.assistantIds.length > 0) {
      return editingReport.assistantIds;
    }
    if (editingReport?.assistantId) {
      return [editingReport.assistantId];
    }
    const initialAssistants = propsAssistants && propsAssistants.length > 0 ? propsAssistants : storageService.getAssistants();
    if (currentUser.role === "assistant") {
      if (currentUser.assistantId) return [currentUser.assistantId];
      const match = initialAssistants.find(
        (a) =>
          a.id === currentUser.id ||
          a.email === currentUser.email ||
          a.username === currentUser.username
      );
      if (match) return [match.id];
      return [currentUser.id];
    }
    return initialAssistants.length > 0 ? [initialAssistants[0].id] : ["asst_1"];
  });

  const selectedAssistantNames = useMemo(() => {
    return selectedAssistantIds.map((id) => {
      const found = assistants.find((a) => a.id === id);
      if (found) return found.name;
      if (id === currentUser.id) return currentUser.name;
      return id;
    });
  }, [selectedAssistantIds, assistants, currentUser]);

  const combinedAssistantName = useMemo(() => {
    return selectedAssistantNames.length > 0
      ? selectedAssistantNames.join(", ")
      : currentUser.name || "Trợ giảng CLB";
  }, [selectedAssistantNames, currentUser]);

  const assistantId = selectedAssistantIds[0] || "asst_1";

  const [teacherName, setTeacherName] = useState<string>(() => {
    if (editingReport) return editingReport.teacherName;
    return "Thầy Thắng";
  });
  const [lessonContent, setLessonContent] = useState<string>(() => {
    if (editingReport) return editingReport.lessonContent;
    return "";
  });
  const [homeworkAssigned, setHomeworkAssigned] = useState<string>(() => {
    if (editingReport) return editingReport.homeworkAssigned || "";
    return "";
  });

  // Section 2: Student List & Detailed Cards (Matching Image 1)
  const [studentRows, setStudentRows] = useState<StudentReportItem[]>(() => {
    if (editingReport && editingReport.students) {
      return editingReport.students;
    }
    return [];
  });
  const [showStudentCards, setShowStudentCards] = useState(false);
  const [showRollCallList, setShowRollCallList] = useState(false);
  const [isAssistantPickerOpen, setIsAssistantPickerOpen] = useState(false);

  // Section 3: Whole-Class Criteria (Matching Image 2 & 3)
  const [generalFeedback, setGeneralFeedback] = useState<string>(() => {
    if (editingReport) return editingReport.generalFeedback || "";
    return "";
  });
  const [selectedPersona, setSelectedPersona] = useState<FeedbackPersona>(() => {
    if (editingReport?.selectedPersona) return editingReport.selectedPersona;
    return "pedagogical";
  });
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>(() => {
    if (editingReport?.selectedCriteria) return editingReport.selectedCriteria;
    return ["att_on_time", "eq_full", "hw_full", "att_hardworking", "disc_quiet", "pres_master"];
  });
  const [criteriaStudentMap, setCriteriaStudentMap] = useState<Record<string, string>>(() => {
    if (editingReport?.criteriaStudentMap) return editingReport.criteriaStudentMap;
    return {};
  });

  // Section 4: Misconceptions & Math Mistakes (Ghi chú riêng về lỗi sai & lầm lẫn)
  const [misconceptionNotes, setMisconceptionNotes] = useState<string>(() => {
    if (editingReport?.misconceptionNotes) return editingReport.misconceptionNotes;
    return "";
  });
  const [misconceptionStudents, setMisconceptionStudents] = useState<string[]>(() => {
    if (editingReport?.misconceptionStudents) return editingReport.misconceptionStudents;
    return [];
  });
  const [misconceptionTags, setMisconceptionTags] = useState<string[]>(() => {
    if (editingReport?.misconceptionTags) return editingReport.misconceptionTags;
    return [];
  });

  // Quick suggestion popup state for student remark
  const [activeSuggestionStudentId, setActiveSuggestionStudentId] = useState<string | null>(null);

  // UI state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDetailedGenerating, setAiDetailedGenerating] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [lastAutosave, setLastAutosave] = useState<string | null>(null);

  // Update students when class changes
  useEffect(() => {
    if (editingReport && editingReport.classId === classId) {
      setStudentRows(editingReport.students || []);
      return;
    }

    const filtered = allStudents.filter((s) => s.classId === classId);
    const rows: StudentReportItem[] = filtered.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      attendance: "present",
      homework: "completed",
      comprehension: "good",
      attitude: "active",
      comment: "",
      homeworkScore: 9,
      quickTags: ["Đi học đầy đủ"],
      bonusPoints: 0,
      avatar: s.avatar,
    }));
    setStudentRows(rows);
  }, [classId, editingReport, allStudents]);

  // Autosave draft every 15s
  useEffect(() => {
    if (editingReport) return;
    const interval = setInterval(() => {
      if (classId && (lessonContent || generalFeedback)) {
        storageService.saveReportDraft({
          date,
          shift,
          classId,
          assistantId,
          teacherName,
          lessonContent,
          homeworkAssigned,
          generalFeedback,
          selectedCriteria,
          selectedPersona,
          criteriaStudentMap,
          misconceptionNotes,
          misconceptionStudents,
          misconceptionTags,
          students: studentRows,
          updatedAt: new Date().toLocaleTimeString("vi-VN"),
        });
        setLastAutosave(new Date().toLocaleTimeString("vi-VN"));
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [
    date,
    shift,
    classId,
    assistantId,
    teacherName,
    lessonContent,
    homeworkAssigned,
    generalFeedback,
    selectedCriteria,
    selectedPersona,
    criteriaStudentMap,
    misconceptionNotes,
    misconceptionStudents,
    misconceptionTags,
    studentRows,
    editingReport,
  ]);

  // Smart criteria toggle (handles mutual exclusivity automatically & supports co-existence)
  const handleToggleCriterion = (id: string) => {
    const crit = FEEDBACK_CRITERIA.find((c) => c.id === id);
    setSelectedCriteria((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        if (crit?.exclusiveWith) {
          return [...prev.filter((item) => item !== crit.exclusiveWith), id];
        }
        return [...prev, id];
      }
    });
  };

  const handleSelectAllPraise = () => {
    const praiseIds = FEEDBACK_CRITERIA.filter((c) => c.type === "praise").map((c) => c.id);
    setSelectedCriteria((prev) => Array.from(new Set([...prev, ...praiseIds])));
    setFeedbackToast({ type: "info", message: "Đã chọn tất cả các tiêu chí khen ngợi!" });
  };

  const handleDeselectAll = () => {
    setSelectedCriteria([]);
    setFeedbackToast({ type: "info", message: "Đã bỏ chọn tất cả các tiêu chí!" });
  };

  // Student tagging helper for criteria
  const handleToggleStudentForCriterion = (criterionId: string, studentName: string) => {
    setCriteriaStudentMap((prev) => {
      const currentStr = prev[criterionId] || "";
      const names = currentStr
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);

      let newNames: string[];
      if (names.some((n) => n.toLowerCase() === studentName.toLowerCase())) {
        newNames = names.filter((n) => n.toLowerCase() !== studentName.toLowerCase());
      } else {
        newNames = [...names, studentName];
      }

      return {
        ...prev,
        [criterionId]: newNames.join(", "),
      };
    });
  };

  const handleClearStudentsForCriterion = (criterionId: string) => {
    setCriteriaStudentMap((prev) => {
      const next = { ...prev };
      delete next[criterionId];
      return next;
    });
  };

  const handleCriterionStudentTextChange = (criterionId: string, value: string) => {
    setCriteriaStudentMap((prev) => ({
      ...prev,
      [criterionId]: value,
    }));
  };

  // Misconception helpers
  const handleToggleMisconceptionStudent = (studentName: string) => {
    setMisconceptionStudents((prev) =>
      prev.includes(studentName)
        ? prev.filter((n) => n !== studentName)
        : [...prev, studentName]
    );
  };

  const handleToggleMisconceptionTag = (tag: string) => {
    setMisconceptionTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Individual student card actions (Image 1)
  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setStudentRows((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, attendance: status } : s))
    );
  };

  const handleToggleStudentQuickTag = (studentId: string, tagLabel: string) => {
    setStudentRows((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;
        const currentTags = s.quickTags || [];
        const nextTags = currentTags.includes(tagLabel)
          ? currentTags.filter((t) => t !== tagLabel)
          : [...currentTags, tagLabel];
        return { ...s, quickTags: nextTags };
      })
    );
  };

  const handleStudentCommentChange = (studentId: string, text: string) => {
    setStudentRows((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, comment: text } : s))
    );
  };

  const handleAddBonusPoint = (studentId: string) => {
    setStudentRows((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;
        const currentPoints = s.bonusPoints || 0;
        return { ...s, bonusPoints: currentPoints + 1 };
      })
    );
    const student = studentRows.find((s) => s.studentId === studentId);
    setFeedbackToast({
      type: "success",
      message: `🏆 Đã cộng 1 điểm thưởng cho ${student?.studentName || "học sinh"}!`,
    });
  };

  const handleCopyStudentRemark = (student: StudentReportItem) => {
    const lines: string[] = [];
    lines.push(`👤 Học sinh: ${student.studentName}`);
    lines.push(`• Tình trạng: ${student.attendance === "present" ? "Có mặt" : student.attendance === "late" ? "Đi muộn" : "Vắng"}`);
    if (student.quickTags && student.quickTags.length > 0) {
      lines.push(`• Đánh giá: ${student.quickTags.join(", ")}`);
    }
    if (student.comment?.trim()) {
      lines.push(`• Nhận xét riêng: ${student.comment.trim()}`);
    }
    if (student.bonusPoints && student.bonusPoints > 0) {
      lines.push(`• Điểm thưởng: +${student.bonusPoints} sao/điểm`);
    }

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedStudentId(student.studentId);
    setTimeout(() => setCopiedStudentId(null), 2000);
    setFeedbackToast({
      type: "success",
      message: `Đã sao chép nhận xét của ${student.studentName}!`,
    });
  };

  const handleClearStudentData = (studentId: string) => {
    if (!window.confirm("Bạn có muốn đặt lại nhận xét và tiêu chí của học sinh này?")) return;
    setStudentRows((prev) =>
      prev.map((s) =>
        s.studentId === studentId
          ? {
              ...s,
              comment: "",
              quickTags: ["Đi học đầy đủ"],
              bonusPoints: 0,
              attendance: "present",
            }
          : s
      )
    );
  };

  const handleApplyStudentRemarkSuggestion = (studentId: string, suggestion: string) => {
    setStudentRows((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;
        const current = s.comment?.trim() || "";
        const next = current ? `${current}; ${suggestion}` : suggestion;
        return { ...s, comment: next };
      })
    );
    setActiveSuggestionStudentId(null);
  };

  // KIỂU 1: Tổng hợp nhanh theo tích chọn (Đơn giản, ngắn gọn, trực diện - 0s)
  const handleGenerateDirectCriteria = () => {
    let contentToUse = lessonContent.trim();
    if (!contentToUse) {
      contentToUse = "Chuyên đề Toán học tư duy & Rèn luyện kỹ năng giải bài";
      setLessonContent(contentToUse);
    }

    const currentClass = classes.find((c) => c.id === classId);
    const currentAssistant = assistants.find((a) => a.id === assistantId);

    const presentCount = studentRows.filter((s) => s.attendance === "present").length;
    const lateStudents = studentRows.filter((s) => s.attendance === "late").map((s) => s.studentName);
    const absentStudents = studentRows
      .filter((s) => s.attendance === "excused" || s.attendance === "unexcused")
      .map((s) => s.studentName);

    let notes = `Sĩ số: ${presentCount}/${studentRows.length} học sinh có mặt.`;
    if (lateStudents.length > 0) notes += ` Đi muộn: ${lateStudents.join(", ")}.`;
    if (absentStudents.length > 0) notes += ` Vắng: ${absentStudents.join(", ")}.`;

    const directText = generateDirectCriteriaFeedback({
      className: currentClass?.name || "Lớp Toán",
      teacherName: teacherName.trim() || "Thầy Thắng",
      assistantName: currentAssistant?.name || currentUser.name || "Trợ giảng CLB",
      lessonContent: contentToUse,
      homeworkAssigned: homeworkAssigned.trim() || "Hoàn thành toàn bộ phiếu bài tập được giao.",
      persona: selectedPersona,
      selectedCriteria,
      criteriaStudentMap,
      misconceptionNotes,
      misconceptionStudents,
      misconceptionTags,
      customNotes: notes,
    });

    setGeneralFeedback(directText);
    setFeedbackToast({
      type: "success",
      message: "⚡ Đã tổng hợp nhanh theo các mục tích chọn (đơn giản, ngắn gọn)!",
    });
  };

  // KIỂU 2: AI viết lại súc tích, ngắn gọn & mượt mà (AI Gemini)
  const handleGenerateClassAI = async () => {
    let contentToUse = lessonContent.trim();
    if (!contentToUse) {
      contentToUse = "Chuyên đề Toán học tư duy & Rèn luyện kỹ năng giải bài";
      setLessonContent(contentToUse);
    }

    const currentClass = classes.find((c) => c.id === classId);
    const currentAssistant = assistants.find((a) => a.id === assistantId);

    const selectedCriteriaLabels = FEEDBACK_CRITERIA.filter((c) =>
      selectedCriteria.includes(c.id)
    ).map((c) => {
      const tagged = criteriaStudentMap[c.id]?.trim();
      const typeStr = c.type === "praise" ? "Khen ngợi" : "Lưu ý";
      if (tagged) {
        return `${c.label} (${typeStr}: ${tagged})`;
      }
      return `${c.label} (${typeStr})`;
    });

    const presentCount = studentRows.filter((s) => s.attendance === "present").length;
    const lateStudents = studentRows.filter((s) => s.attendance === "late").map((s) => s.studentName);
    const absentStudents = studentRows
      .filter((s) => s.attendance === "excused" || s.attendance === "unexcused")
      .map((s) => s.studentName);

    let notes = `Sĩ số: ${presentCount}/${studentRows.length} có mặt.`;
    if (lateStudents.length > 0) notes += ` Muộn: ${lateStudents.join(", ")}.`;
    if (absentStudents.length > 0) notes += ` Vắng: ${absentStudents.join(", ")}.`;
    if (misconceptionTags.length > 0) {
      notes += ` Lỗi sai hay gặp: ${misconceptionTags.join(", ")}.`;
    }
    if (misconceptionStudents.length > 0) {
      notes += ` Học sinh cần kèm thêm: ${misconceptionStudents.join(", ")}.`;
    }
    if (misconceptionNotes.trim()) {
      notes += ` Ghi chú lỗi sai: ${misconceptionNotes.trim()}.`;
    }

    setAiGenerating(true);
    setFeedbackToast({
      type: "info",
      message: "✨ AI Gemini đang viết lại bài nhận xét ngắn gọn, súc tích theo văn phong...",
    });

    try {
      const feedbackText = await aiService.generateClassFeedback({
        className: currentClass?.name || "Lớp Toán",
        teacherName: teacherName.trim() || "Thầy Thắng",
        assistantName: currentAssistant?.name || currentUser.name || "Trợ giảng CLB",
        lessonContent: contentToUse,
        homeworkAssigned: homeworkAssigned.trim() || "Hoàn thành toàn bộ phiếu bài tập được giao.",
        persona: selectedPersona,
        selectedCriteriaLabels,
        customNotes: notes,
      });

      if (feedbackText && feedbackText.trim()) {
        setGeneralFeedback(feedbackText.trim());
      } else {
        const localGenerated = generateSmartClassFeedback({
          className: currentClass?.name || "Lớp Toán",
          teacherName: teacherName.trim(),
          assistantName: currentAssistant?.name || currentUser.name,
          lessonContent: contentToUse,
          homeworkAssigned: homeworkAssigned.trim(),
          persona: selectedPersona,
          selectedCriteria,
          criteriaStudentMap,
          misconceptionNotes,
          misconceptionStudents,
          misconceptionTags,
          customNotes: notes,
        });
        setGeneralFeedback(localGenerated);
      }

      setFeedbackToast({
        type: "success",
        message: "✨ AI đã viết lại bài nhận xét súc tích thành công!",
      });
    } catch (err: any) {
      console.warn("AI generation error, using fallback:", err);
      const fallbackText = generateSmartClassFeedback({
        className: currentClass?.name || "Lớp Toán",
        teacherName: teacherName.trim(),
        assistantName: currentAssistant?.name || currentUser.name,
        lessonContent: contentToUse,
        homeworkAssigned: homeworkAssigned.trim(),
        persona: selectedPersona,
        selectedCriteria,
        criteriaStudentMap,
        misconceptionNotes,
        misconceptionStudents,
        misconceptionTags,
        customNotes: notes,
      });
      setGeneralFeedback(fallbackText);
      setFeedbackToast({
        type: "success",
        message: "Đã tổng hợp bài nhận xét ngắn gọn theo văn phong đã chọn!",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  // KIỂU 3: AI Tổng hợp đầy đủ, chi tiết, thân thiện, khích lệ & truyền cảm hứng
  const handleGenerateDetailedFeedback = async () => {
    let contentToUse = lessonContent.trim();
    if (!contentToUse) {
      contentToUse = "Chuyên đề Toán học tư duy & Rèn luyện kỹ năng giải bài";
      setLessonContent(contentToUse);
    }

    const currentClass = classes.find((c) => c.id === classId);
    const currentAssistant = assistants.find((a) => a.id === assistantId);

    const selectedCriteriaLabels = FEEDBACK_CRITERIA.filter((c) =>
      selectedCriteria.includes(c.id)
    ).map((c) => {
      const tagged = criteriaStudentMap[c.id]?.trim();
      const typeStr = c.type === "praise" ? "Tuyên dương" : "Lưu ý rèn thêm";
      if (tagged) {
        return `${c.label} (${typeStr}: ${tagged})`;
      }
      return `${c.label} (${typeStr})`;
    });

    const presentCount = studentRows.filter((s) => s.attendance === "present").length;
    const lateStudents = studentRows.filter((s) => s.attendance === "late").map((s) => s.studentName);
    const absentStudents = studentRows
      .filter((s) => s.attendance === "excused" || s.attendance === "unexcused")
      .map((s) => s.studentName);

    let notes = `Sĩ số: ${presentCount}/${studentRows.length} học sinh có mặt.`;
    if (lateStudents.length > 0) notes += ` Đi muộn: ${lateStudents.join(", ")}.`;
    if (absentStudents.length > 0) notes += ` Vắng: ${absentStudents.join(", ")}.`;
    if (misconceptionTags.length > 0) {
      notes += ` Lỗi sai hay gặp: ${misconceptionTags.join(", ")}.`;
    }
    if (misconceptionStudents.length > 0) {
      notes += ` Học sinh cần kèm thêm: ${misconceptionStudents.join(", ")}.`;
    }
    if (misconceptionNotes.trim()) {
      notes += ` Ghi chú lỗi sai: ${misconceptionNotes.trim()}.`;
    }

    setAiDetailedGenerating(true);
    setFeedbackToast({
      type: "info",
      message: "✨ AI Gemini đang soạn bài báo cáo toàn diện, văn phong thân thiện, khích lệ và truyền cảm hứng...",
    });

    try {
      const feedbackText = await aiService.generateClassFeedback({
        className: currentClass?.name || "Lớp Toán",
        teacherName: teacherName.trim() || "Thầy Thắng",
        assistantName: currentAssistant?.name || currentUser.name || "Trợ giảng CLB",
        lessonContent: contentToUse,
        homeworkAssigned: homeworkAssigned.trim() || "Hoàn thành toàn bộ bài tập trong phiếu và nộp đúng hạn.",
        persona: selectedPersona,
        selectedCriteriaLabels,
        customNotes: notes,
        misconceptionNotes,
        misconceptionStudents,
        misconceptionTags,
        mode: "detailed",
        selectedCriteria,
        criteriaStudentMap,
      });

      if (feedbackText && feedbackText.trim()) {
        setGeneralFeedback(feedbackText.trim());
      } else {
        const fullText = generateDetailedFullFeedback({
          className: currentClass?.name || "Lớp Toán",
          teacherName: teacherName.trim() || "Thầy Thắng",
          assistantName: currentAssistant?.name || currentUser.name || "Trợ giảng CLB",
          lessonContent: contentToUse,
          homeworkAssigned: homeworkAssigned.trim() || "Hoàn thành toàn bộ bài tập trong phiếu và nộp đúng hạn.",
          persona: selectedPersona,
          selectedCriteria,
          criteriaStudentMap,
          misconceptionNotes,
          misconceptionStudents,
          misconceptionTags,
          customNotes: notes,
        });
        setGeneralFeedback(fullText);
      }

      setFeedbackToast({
        type: "success",
        message: "🌟 AI đã hoàn thiện bài báo cáo toàn diện, tràn đầy cảm hứng và năng lượng tích cực!",
      });
    } catch (err: any) {
      console.warn("AI detailed feedback error, using template generator:", err);
      const fullText = generateDetailedFullFeedback({
        className: currentClass?.name || "Lớp Toán",
        teacherName: teacherName.trim() || "Thầy Thắng",
        assistantName: currentAssistant?.name || currentUser.name || "Trợ giảng CLB",
        lessonContent: contentToUse,
        homeworkAssigned: homeworkAssigned.trim() || "Hoàn thành toàn bộ bài tập trong phiếu và nộp đúng hạn.",
        persona: selectedPersona,
        selectedCriteria,
        criteriaStudentMap,
        misconceptionNotes,
        misconceptionStudents,
        misconceptionTags,
        customNotes: notes,
      });
      setGeneralFeedback(fullText);
      setFeedbackToast({
        type: "success",
        message: "📋 Đã tạo bản báo cáo nhận xét toàn diện & bài bản!",
      });
    } finally {
      setAiDetailedGenerating(false);
    }
  };

  const handleApplyTemplate = (tpl: SampleFeedbackTemplate) => {
    setGeneralFeedback(tpl.content);
    setFeedbackToast({
      type: "success",
      message: `Đã áp dụng "${tpl.title}" vào ô nhận xét chung!`,
    });
  };

  const handleCopyZalo = () => {
    if (!generalFeedback.trim()) return;
    navigator.clipboard.writeText(generalFeedback.trim());
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2500);
    setFeedbackToast({
      type: "success",
      message: "Đã sao chép nội dung bài nhận xét để dán vào nhóm Zalo Phụ huynh!",
    });
  };

  const handleSaveReport = (targetStatus: "draft" | "submitted" | "approved") => {
    if (!lessonContent.trim()) {
      setFeedbackToast({
        type: "error",
        message: "Vui lòng nhập nội dung bài học đã giảng dạy!",
      });
      return;
    }
    if (!generalFeedback.trim()) {
      setFeedbackToast({
        type: "error",
        message: "Vui lòng tạo hoặc nhập nội dung nhận xét chung cả lớp!",
      });
      return;
    }

    const currentClass = classes.find((c) => c.id === classId);
    const currentAssistant = assistants.find((a) => a.id === assistantId);
    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);

    const presentCount = studentRows.filter((s) => s.attendance === "present").length;
    const lateCount = studentRows.filter((s) => s.attendance === "late").length;
    const excusedCount = studentRows.filter((s) => s.attendance === "excused").length;
    const unexcusedCount = studentRows.filter((s) => s.attendance === "unexcused").length;

    const newReport: Report = {
      id: editingReport?.id || `rep_${Date.now()}`,
      date,
      shift,
      classId,
      className: currentClass?.name || "Lớp học",
      assistantId,
      assistantName: currentAssistant?.name || currentUser.name,
      teacherName: teacherName.trim(),
      lessonContent: lessonContent.trim(),
      homeworkAssigned: homeworkAssigned.trim(),

      // Whole-class feedback
      generalFeedback: generalFeedback.trim(),
      selectedCriteria,
      selectedPersona,
      criteriaStudentMap,

      // Misconceptions
      misconceptionNotes: misconceptionNotes.trim(),
      misconceptionStudents,
      misconceptionTags,

      attendanceStats: {
        total: studentRows.length,
        present: presentCount,
        late: lateCount,
        excused: excusedCount,
        unexcused: unexcusedCount,
      },

      students: studentRows,
      status: targetStatus,
      approvedBy: targetStatus === "approved" ? currentUser.name : editingReport?.approvedBy,
      approvedAt: targetStatus === "approved" ? nowStr : editingReport?.approvedAt,
      createdAt: editingReport?.createdAt || nowStr,
      updatedAt: nowStr,
    };

    storageService.saveReport(newReport);
    storageService.clearReportDraft();

    setFeedbackToast({
      type: "success",
      message:
        targetStatus === "approved"
          ? "🎉 Đã duyệt báo cáo buổi học thành công! Trợ giảng đã nhận được thông báo xác nhận."
          : targetStatus === "submitted"
          ? "📤 Đã gửi báo cáo cho Giáo viên duyệt thành công! Bạn sẽ nhận được thông báo xác nhận ngay khi Thầy phê duyệt."
          : "💾 Đã lưu bản nháp báo cáo thành công!",
    });

    if (onReportSaved) {
      onReportSaved(newReport);
    }
  };

  const presentCount = studentRows.filter((s) => s.attendance === "present").length;
  const lateCount = studentRows.filter((s) => s.attendance === "late").length;
  const absentCount = studentRows.filter(
    (s) => s.attendance === "excused" || s.attendance === "unexcused"
  ).length;

  const currentPersonaObj =
    PERSONA_STYLES.find((p) => p.id === selectedPersona) || PERSONA_STYLES[0];
  const apiKeyCount = settings.apiKeyList?.length || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-blue-100 text-blue-900 border border-blue-200">
              <BookOpen className="w-6 h-6 text-blue-900" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingReport ? "Chỉnh Sửa Báo Cáo Buổi Học" : "Báo Cáo & Nhận Xét Buổi Học"}
                </h2>
                {editingReport?.status === "approved" && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Đã được duyệt
                  </span>
                )}
                {editingReport?.status === "submitted" && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-300 flex items-center gap-1 shadow-xs">
                    <Clock className="w-3 h-3 text-blue-700" /> Chờ GV duyệt
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Ghi nhận nề nếp ca dạy, đánh giá học sinh, ghi chú lỗi sai và tạo nhận xét gửi Zalo Phụ huynh.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {lastAutosave && (
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> Đã lưu nháp lúc {lastAutosave}
            </span>
          )}

          {editingReport && onCancelEdit && (
            <button type="button" onClick={onCancelEdit} className="btn-3d-secondary text-xs">
              Hủy
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSaveReport("draft")}
            className="btn-3d-secondary text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Lưu nháp</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveReport("submitted")}
            className="btn-3d-primary text-xs"
          >
            <Send className="w-4 h-4 text-amber-400" />
            <span>Gửi báo cáo cho GV</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleSaveReport("approved")}
              className="btn-3d-amber text-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Duyệt báo cáo</span>
            </button>
          )}
        </div>
      </div>

      {/* TRẠNG THÁI XÁC NHẬN PHÊ DUYỆT TỪ GIÁO VIÊN */}
      {editingReport?.status === "approved" && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-emerald-950 tracking-tight">
                  ✓ XÁC NHẬN: BÁO CÁO NÀY ĐÃ ĐƯỢC GIÁO VIÊN PHÊ DUYỆT
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-xs">
                  Đã duyệt chính thức
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-medium mt-1 leading-relaxed">
                Người phê duyệt: <strong className="font-black text-emerald-950">{editingReport.approvedBy || "Thầy Thắng (Chủ nhiệm)"}</strong> • 
                Thời gian duyệt: <strong className="font-mono text-emerald-900">{editingReport.approvedAt || editingReport.updatedAt}</strong>.
                Báo cáo đã được thông qua và nội dung nhận xét đã sẵn sàng để gửi cho Quý Phụ huynh.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyZalo}
              className="btn-3d-primary text-xs w-full sm:w-auto"
            >
              {copiedZalo ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-amber-400" />
              )}
              <span>{copiedZalo ? "Đã sao chép!" : "Copy nhận xét gửi Zalo"}</span>
            </button>
          </div>
        </div>
      )}

      {editingReport?.status === "submitted" && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-xs shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-blue-950 block">
                ⏳ Trạng thái: Báo cáo đã gửi cho Giáo viên (Thầy Thắng) phê duyệt
              </span>
              <p className="text-[11px] text-blue-800 font-medium mt-0.5">
                Khi Giáo viên phê duyệt, hệ thống sẽ gửi thông báo chuông và hiển thị dấu xác nhận "Đã duyệt" trên tài khoản của bạn.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-blue-200 text-blue-900 px-3 py-1 rounded-full border border-blue-300 shrink-0">
            Chờ GV duyệt
          </span>
        </div>
      )}

      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border-2 shadow-sm ${
            feedbackToast.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : feedbackToast.type === "error"
              ? "bg-rose-50 text-rose-900 border-rose-300"
              : "bg-blue-50 text-blue-950 border-blue-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackToast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackToast.message}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-slate-400 hover:text-slate-700 ml-4 font-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* STEP 1: Thông Tin Chung Ca Dạy */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-xs shadow-xs">
              1
            </span>
            <h3 className="text-sm font-black text-slate-900">Thông Tin Chung Ca Dạy</h3>
          </div>
          <span className="text-xs font-black text-blue-900 bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
            CLB TOÁN THẦY THẮNG
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-800" />
              Ngày học:
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Shift */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-800" />
              Ca học:
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="Ca 1 (17:30 – 19:45)">Ca 1 (17:30 – 19:45)</option>
              <option value="Ca 1 (18:00 – 20:30)">Ca 1 (18:00 – 20:30)</option>
              <option value="Ca 2 (19:45 – 21:45)">Ca 2 (19:45 – 21:45)</option>
              <option value="Ca Sáng (08:30 – 10:45)">Ca Sáng (08:30 – 10:45)</option>
              <option value="Ca Chiều (14:30 – 16:45)">Ca Chiều (14:30 – 16:45)</option>
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-blue-800" />
              Lớp học:
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-black text-blue-950"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.grade})
                </option>
              ))}
            </select>
          </div>

          {/* Assistant */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-blue-800" />
              Trợ giảng phụ trách:
            </label>
            {currentUser.role === "assistant" ? (
              <div className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-blue-200 bg-blue-50/80 font-black text-blue-950 flex items-center justify-between shadow-2xs">
                <span>{assistants.find((a) => a.id === assistantId)?.name || currentUser.name}</span>
                <span className="text-[10px] bg-blue-200/90 text-blue-900 px-2 py-0.5 rounded font-black tracking-wider">
                  BẠN (Tự động)
                </span>
              </div>
            ) : (
              <select
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-bold text-slate-800"
              >
                {assistants.map((asst) => (
                  <option key={asst.id} value={asst.id}>
                    {asst.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Teacher */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Giáo viên giảng dạy chính:
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="VD: Thầy Thắng"
              className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-bold text-slate-900"
            />
          </div>

          {/* Lesson Content */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
              <span>
                Nội dung bài học hôm nay: <span className="text-rose-500 font-black">*</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                (Chuyên đề toán, dạng bài đã học)
              </span>
            </label>
            <input
              type="text"
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              placeholder="VD: Chuyên đề 4: Phương trình vô tỷ chứa căn bậc hai và phương pháp đặt ẩn phụ."
              className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-bold text-slate-900"
            />
          </div>
        </div>

        {/* Homework */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Bài tập về nhà & Dặn dò buổi tới:
          </label>
          <input
            type="text"
            value={homeworkAssigned}
            onChange={(e) => setHomeworkAssigned(e.target.value)}
            placeholder="VD: Phiếu bài tập số 5 (bài 1 đến bài 4), hạn nộp trước 18:00 thứ 5."
            className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-semibold text-slate-800"
          />
        </div>
      </div>

      {/* STEP 2: TIÊU CHÍ NHẬN XÉT CHUNG CA DẠY (MATCHING IMAGE 2 & IMAGE 3 EXACTLY) */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-6">
        {/* Step 2 Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-blue-800">
              2
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Tiêu Chí Nhận Xét Chung Cả Lớp
                </h3>
                <span className="text-xs font-black text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {selectedCriteria.length}/{FEEDBACK_CRITERIA.length} tiêu chí
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Tích chọn tiêu chí nề nếp, dụng cụ, BTVN, thái độ và kỹ năng tính toán của lớp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllPraise}
              className="btn-3d-secondary text-xs py-1.5 px-2.5"
            >
              ✓ Chọn tất cả khen
            </button>

            <button
              type="button"
              onClick={handleDeselectAll}
              className="btn-3d-secondary text-xs py-1.5 px-2.5"
            >
              Bỏ chọn hết
            </button>

            <button
              type="button"
              onClick={() => setIsSampleModalOpen(true)}
              className="btn-3d-amber text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-950" />
              <span>Mẫu có sẵn</span>
            </button>
          </div>
        </div>

        {/* 7 CATEGORIES GRID (2-COLUMN CARDS EXACTLY AS SCREENSHOTS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEEDBACK_CRITERIA_CATEGORIES.map((cat) => {
            const itemsInCat = FEEDBACK_CRITERIA.filter((c) => c.category === cat.id);

            return (
              <div
                key={cat.id}
                className="p-5 rounded-3xl bg-slate-50/70 border-2 border-slate-200 space-y-3 shadow-2xs hover:bg-slate-50/90 transition-all"
              >
                {/* Category Header */}
                <div className="flex items-center gap-2.5 font-black text-xs text-slate-900 tracking-wide">
                  <div className="p-1.5 rounded-xl bg-blue-100 text-blue-900 border border-blue-200">
                    {cat.id === "attendance" && <Clock className="w-4 h-4" />}
                    {cat.id === "equipment" && <PenTool className="w-4 h-4" />}
                    {cat.id === "homework" && <BookOpen className="w-4 h-4" />}
                    {cat.id === "attitude" && <Flame className="w-4 h-4" />}
                    {cat.id === "discipline" && <ShieldCheck className="w-4 h-4" />}
                    {cat.id === "interaction" && <Zap className="w-4 h-4" />}
                    {cat.id === "presentation" && <ThumbsUp className="w-4 h-4" />}
                  </div>
                  <span className="uppercase">{cat.title}</span>
                </div>

                {/* Items in this category */}
                <div className="space-y-2.5">
                  {itemsInCat.map((item) => {
                    const isChecked = selectedCriteria.includes(item.id);
                    const isPraise = item.type === "praise";
                    const currentStudentNames = criteriaStudentMap[item.id] || "";
                    const parsedSelectedNames = currentStudentNames
                      .split(",")
                      .map((n) => n.trim().toLowerCase())
                      .filter(Boolean);

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border-2 transition-all space-y-2.5 ${
                          isChecked
                            ? isPraise
                              ? "bg-emerald-50/40 border-emerald-400 shadow-xs"
                              : "bg-amber-50/40 border-amber-400 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        {/* Option row with checkbox & badge */}
                        <div
                          onClick={() => handleToggleCriterion(item.id)}
                          className="flex items-center justify-between gap-2.5 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 ${
                                isChecked
                                  ? isPraise
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "bg-amber-600 border-amber-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className="text-xs sm:text-[13px] font-bold text-slate-800 leading-snug">
                              {item.label}
                            </span>
                          </div>

                          {/* Right Badge: ✨ Khen / ⚠️ Lưu ý */}
                          <span
                            className={`px-3 py-1 rounded-xl text-[11px] font-black shrink-0 flex items-center gap-1 ${
                              isPraise
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : "bg-amber-100 text-amber-900 border border-amber-300"
                            }`}
                          >
                            {isPraise ? "✨ Khen" : "⚠️ Lưu ý"}
                          </span>
                        </div>

                        {/* Student Tagging Sub-Section (When checked) */}
                        {isChecked && (
                          <div
                            className={`pt-2.5 border-t space-y-2 ${
                              isPraise ? "border-emerald-200/80" : "border-amber-200/80"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1 font-bold">
                                {isPraise ? (
                                  <span className="text-emerald-950 font-black">
                                    Tuyên dương học sinh:
                                  </span>
                                ) : (
                                  <span className="text-amber-950 font-black">
                                    Lưu ý riêng học sinh:
                                  </span>
                                )}
                              </div>

                              {currentStudentNames.trim() && (
                                <button
                                  type="button"
                                  onClick={() => handleClearStudentsForCriterion(item.id)}
                                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Xóa</span>
                                </button>
                              )}
                            </div>

                            {/* Quick Pick Student Chips */}
                            <div className="flex flex-wrap gap-1.5">
                              {studentRows.length > 0 ? (
                                studentRows.map((st) => {
                                  const isTagSelected = parsedSelectedNames.includes(
                                    st.studentName.trim().toLowerCase()
                                  );

                                  return (
                                    <button
                                      key={st.studentId}
                                      type="button"
                                      onClick={() =>
                                        handleToggleStudentForCriterion(
                                          item.id,
                                          st.studentName
                                        )
                                      }
                                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                        isTagSelected
                                          ? isPraise
                                            ? "bg-emerald-600 text-white shadow-2xs"
                                            : "bg-amber-600 text-white shadow-2xs"
                                          : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                      }`}
                                    >
                                      <span>{st.studentName}</span>
                                      {isTagSelected && (
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      )}
                                    </button>
                                  );
                                })
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Chưa có danh sách học sinh
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 3: MỤC GHI CHÚ RIÊNG (KIẾN THỨC CÁC EM CÒN LẦM LẪN, SAI SÓT - THEO YÊU CẦU NGƯỜI DÙNG) */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md border-2 border-amber-600">
              3
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Ghi Chú Riêng: Kiến Thức Các Em Còn Lầm Lẫn, Sai Sót
                </h3>
                <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Mục quan trọng
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Ghi chú các dạng bài học sinh còn lúng túng, hay nhầm dấu, quên ĐKXĐ... để thầy cô kèm cặp và củng cố buổi sau
              </p>
            </div>
          </div>
        </div>

        {/* 1. Phần Bấm Chọn Nhanh Học Sinh Mắc Lỗi */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border-2 border-amber-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-700" />
              Bấm chọn nhanh học sinh cần lưu ý / mắc lỗi:
            </span>
            {misconceptionStudents.length > 0 && (
              <span className="text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                Đã chọn {misconceptionStudents.length} học sinh
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {studentRows.length > 0 ? (
              studentRows.map((st) => {
                const isSelected = misconceptionStudents.includes(st.studentName);

                return (
                  <button
                    key={st.studentId}
                    type="button"
                    onClick={() => handleToggleMisconceptionStudent(st.studentName)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-amber-600 text-white shadow-xs border-2 border-amber-700"
                        : "bg-white text-slate-800 border-2 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50"
                    }`}
                  >
                    <span>{st.studentName}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-slate-400 italic">
                Chưa có danh sách học sinh
              </span>
            )}
          </div>
        </div>

        {/* 2. Gợi Ý Bấm Nhanh Các Lỗi Sai Toán Học Thường Gặp */}
        <div className="space-y-2">
          <span className="text-xs font-black text-slate-900 block">
            Gợi ý nhanh các lỗi sai toán học phổ biến (Bấm để thêm vào ghi chú):
          </span>
          <div className="flex flex-wrap gap-2">
            {COMMON_MATH_MISCONCEPTIONS.map((tag) => {
              const isSelected = misconceptionTags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleMisconceptionTag(tag)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-blue-700 text-white shadow-xs border border-blue-800"
                      : "bg-slate-50 text-slate-700 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/60"
                  }`}
                >
                  <span>{tag}</span>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Ô Nhập Chi Tiết Ghi Chú Lỗi Sai */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Chi tiết nội dung kiến thức các em còn lầm lẫn / Hướng dẫn khắc phục:
          </label>
          <textarea
            rows={3}
            value={misconceptionNotes}
            onChange={(e) => setMisconceptionNotes(e.target.value)}
            placeholder="VD: Khi làm câu 2 phương trình vô tỷ, các em hay quên đối chiếu điều kiện xác định x >= 2 trước khi kết luận nghiệm. Đầu ca sau trợ giảng cần cho làm thêm 2 bài tương tự để khắc sâu..."
            className="w-full p-3.5 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white font-medium text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-inner"
          />
        </div>
      </div>

      {/* STEP 4: LỰA CHỌN VĂN PHONG, TỔNG HỢP & XUẤT BÁO CÁO GỬI ZALO */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-emerald-800">
              4
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Tổng Hợp Nhận Xét Cả Lớp & Xuất Gửi Zalo
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Chọn văn phong truyền cảm hứng, bấm 1 trong 3 kiểu tổng hợp và sao chép gửi Phụ huynh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(true)}
              className="btn-3d-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5"
              title="Quản lý API Key Gemini"
            >
              <Key className="w-3.5 h-3.5 text-blue-700" />
              <span>Cài đặt AI ({apiKeyCount > 0 ? `${apiKeyCount} Keys` : "Mặc định"})</span>
            </button>
          </div>
        </div>

        {/* SECTION: 4 PERSONA CARDS GRID */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-black text-xs text-slate-900 uppercase tracking-wide">
                LỰA CHỌN VĂN PHONG SOẠN NHẬN XÉT (AI GEMINI):
              </span>
            </div>
            <span className="text-xs font-black text-blue-900 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
              Đang chọn: {currentPersonaObj.title}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {PERSONA_STYLES.map((persona) => {
              const isSelected = selectedPersona === persona.id;

              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => setSelectedPersona(persona.id)}
                  className={`text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer space-y-2 relative overflow-hidden ${
                    isSelected
                      ? "bg-blue-50/90 border-blue-600 shadow-md ring-2 ring-blue-500/30"
                      : "bg-slate-50/70 border-slate-200 hover:border-blue-400 hover:bg-white"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-900">
                        {persona.id === "pedagogical" && <Landmark className="w-4 h-4" />}
                        {persona.id === "positive" && <SunMedium className="w-4 h-4" />}
                        {persona.id === "friendly" && <MessageCircleHeart className="w-4 h-4" />}
                        {persona.id === "warm_humor" && <Coffee className="w-4 h-4" />}
                      </div>
                      <h5 className="font-black text-xs text-slate-900 leading-tight">
                        {persona.title}
                      </h5>
                    </div>

                    <span className="inline-block text-[10px] font-black text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md mb-1.5">
                      {persona.badge}
                    </span>

                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      {persona.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 SYNTHESIS STYLES */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-black text-xs text-slate-900 uppercase tracking-wide">
                BẤM CHỌN 1 TRONG 3 KIỂU TỔNG HỢP NHẬN XÉT:
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* KIỂU 1: TỔNG HỢP NHANH THEO TÍCH CHỌN */}
            <button
              type="button"
              onClick={handleGenerateDirectCriteria}
              className="p-4 rounded-2xl border-2 border-blue-200 bg-linear-to-br from-blue-50/80 to-white hover:border-blue-600 hover:shadow-md transition-all flex flex-col justify-between text-left cursor-pointer group space-y-2.5"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-900 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                      <ListChecks className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded-md">
                      KIỂU 1 • 0 GIÂY
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ⚡ Nhanh gọn
                  </span>
                </div>

                <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-900 transition-colors">
                  Tổng Hợp Nhanh Theo Tích Chọn
                </h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1">
                  Trích xuất trực diện các tiêu chí đã chọn thành gạch đầu dòng rõ ràng, kèm ghi chú lỗi sai.
                </p>
              </div>

              <div className="pt-2 border-t border-blue-100 flex items-center justify-between w-full text-xs font-black text-blue-800">
                <span>Tạo nhận xét nhanh</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-blue-600" />
              </div>
            </button>

            {/* KIỂU 2: AI VIẾT LẠI SÚC TÍCH & MƯỢT MÀ */}
            <button
              type="button"
              onClick={handleGenerateClassAI}
              disabled={aiGenerating}
              className="p-4 rounded-2xl border-2 border-amber-300 bg-linear-to-br from-amber-50/80 via-amber-50/30 to-white hover:border-amber-500 hover:shadow-md transition-all flex flex-col justify-between text-left cursor-pointer group space-y-2.5 relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-200 text-amber-950 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      {aiGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-md">
                      KIỂU 2 • AI GEMINI
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                    ✨ Súc tích
                  </span>
                </div>

                <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-950 transition-colors">
                  AI Viết Lại Súc Tích (5-8 Dòng)
                </h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1">
                  AI cô đọng lại thành 5-8 dòng ngắn gọn, giàu cảm xúc theo văn phong <strong>{currentPersonaObj.title}</strong>.
                </p>
              </div>

              <div className="pt-2 border-t border-amber-200/70 flex items-center justify-between w-full text-xs font-black text-amber-900">
                <span>{aiGenerating ? "Đang viết lại..." : "Viết lại với AI Gemini"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-700" />
              </div>
            </button>

            {/* KIỂU 3: AI TỔNG HỢP ĐẦY ĐỦ / TOÀN DIỆN & TRUYỀN CẢM HỨNG */}
            <button
              type="button"
              onClick={handleGenerateDetailedFeedback}
              disabled={aiDetailedGenerating || aiGenerating}
              className="p-4 rounded-2xl border-2 border-emerald-300 bg-linear-to-br from-emerald-50/80 via-teal-50/30 to-white hover:border-emerald-600 hover:shadow-md transition-all flex flex-col justify-between text-left cursor-pointer group space-y-2.5 relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-200 text-emerald-950 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      {aiDetailedGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-200/90 px-2 py-0.5 rounded-md">
                      KIỂU 3 • AI TOÀN DIỆN
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                    🌟 Truyền cảm hứng
                  </span>
                </div>

                <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-950 transition-colors">
                  AI Báo Cáo Toàn Diện & Truyền Cảm Hứng
                </h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1">
                  AI tổng hợp đầy đủ bài bản, văn phong thân thiện, khích lệ và truyền cảm hứng theo <strong>{currentPersonaObj.title}</strong>.
                </p>
              </div>

              <div className="pt-2 border-t border-emerald-200/70 flex items-center justify-between w-full text-xs font-black text-emerald-900">
                <span>{aiDetailedGenerating ? "AI đang soạn báo cáo..." : "Tạo báo cáo toàn diện với AI"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-emerald-700" />
              </div>
            </button>
          </div>
        </div>

        {/* Whole-Class Feedback Textarea */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" />
              <span>Nội Dung Bài Nhận Xét Chung Cả Lớp (Gửi Zalo Phụ Huynh):</span>
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyZalo}
                disabled={!generalFeedback.trim()}
                className="btn-3d-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                {copiedZalo ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{copiedZalo ? "Đã copy nhận xét!" : "Sao chép gửi Zalo"}</span>
              </button>
            </div>
          </div>

          <textarea
            rows={13}
            value={generalFeedback}
            onChange={(e) => setGeneralFeedback(e.target.value)}
            placeholder="Bấm chọn 1 trong 3 kiểu tổng hợp ở trên (Kiểu 1: Nhanh gọn 0s, Kiểu 2: Súc tích AI, Kiểu 3: Đầy đủ toàn diện) hoặc tự chỉnh sửa trực tiếp tại đây..."
            className="w-full p-4 rounded-2xl border-2 border-slate-300 bg-white font-medium text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-inner"
          />

          {/* Quick action buttons below textarea */}
          <div className="flex items-center justify-between text-xs gap-2 flex-wrap pt-1">
            <span className="text-slate-400 font-medium">
              Độ dài: <strong className="text-slate-700">{generalFeedback.length}</strong> ký tự ({generalFeedback.split("\n").filter(Boolean).length} dòng)
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleGenerateDirectCriteria}
                className="btn-3d-secondary text-[11px] py-1 px-2.5 flex items-center gap-1"
              >
                <ListChecks className="w-3 h-3 text-blue-600" />
                <span>Nhanh gọn (Kiểu 1)</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerateClassAI()}
                disabled={aiGenerating}
                className="btn-3d-secondary text-[11px] py-1 px-2.5 flex items-center gap-1"
              >
                {aiGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-600" />
                )}
                <span>Súc tích (Kiểu 2)</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerateDetailedFeedback()}
                disabled={aiDetailedGenerating || aiGenerating}
                className="btn-3d-secondary text-[11px] py-1 px-2.5 flex items-center gap-1"
              >
                {aiDetailedGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                ) : (
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                )}
                <span>AI Toàn diện (Kiểu 3)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSampleModalOpen(true)}
                className="btn-3d-secondary text-[11px] py-1 px-2.5 flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3 text-indigo-600" />
                <span>Mẫu có sẵn</span>
              </button>
              {generalFeedback && (
                <button
                  type="button"
                  onClick={() => setGeneralFeedback("")}
                  className="btn-3d-secondary text-[11px] py-1 px-2 text-slate-500 hover:text-rose-600"
                >
                  Xóa trắng
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FINAL SAVE / SUBMIT / APPROVE ACTIONS */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-black text-slate-900 text-sm block">Hoàn tất báo cáo buổi học</span>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Lưu nháp để chỉnh sửa sau hoặc gửi cho Giáo viên phê duyệt.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => handleSaveReport("draft")}
            className="btn-3d-secondary text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Lưu bản nháp</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveReport("submitted")}
            className="btn-3d-primary text-xs"
          >
            <Send className="w-4 h-4 text-amber-400" />
            <span>Gửi báo cáo cho GV</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleSaveReport("approved")}
              className="btn-3d-amber text-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Duyệt báo cáo ngay</span>
            </button>
          )}
        </div>
      </div>

      {/* Sample Feedback Modal */}
      <SampleFeedbackModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectTemplate={handleApplyTemplate}
      />

      {/* Quick API Key Settings Modal */}
      <QuickApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaved={() => {
          setFeedbackToast({ type: "success", message: "Đã cập nhật cấu hình API Key!" });
        }}
      />
    </div>
  );
};
