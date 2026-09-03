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
  Plus,
  Tag,
  UserCheck,
  ListChecks,
  ArrowRight,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  RotateCcw,
  ArrowUpDown,
  Lock,
  Unlock,
  Edit2,
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
import { assistantReportService } from "../services/assistantReportService";
import { sessionService } from "../services/sessionService";
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

  // Attendance stats counts
  const presentCount = useMemo(() => {
    return (studentRows || []).filter((s) => s.attendance === "present").length;
  }, [studentRows]);

  const lateCount = useMemo(() => {
    return (studentRows || []).filter((s) => s.attendance === "late").length;
  }, [studentRows]);

  const excusedCount = useMemo(() => {
    return (studentRows || []).filter((s) => s.attendance === "excused").length;
  }, [studentRows]);

  const unexcusedCount = useMemo(() => {
    return (studentRows || []).filter((s) => s.attendance === "unexcused").length;
  }, [studentRows]);

  const absentCount = useMemo(() => {
    return (studentRows || []).filter(
      (s) => s.attendance === "excused" || s.attendance === "unexcused"
    ).length;
  }, [studentRows]);

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
  const currentMisconceptionUserKey = useMemo(() => {
    if (currentUser.role === "assistant") {
      return currentUser.assistantId || currentUser.username || currentUser.id;
    }
    return "admin";
  }, [currentUser]);

  const [customMisconceptions, setCustomMisconceptions] = useState<string[]>(() => {
    if (editingReport?.customMisconceptionTags) return editingReport.customMisconceptionTags;
    try {
      const cfg = storageService.getMathMisconceptionsConfig(
        currentUser.role === "assistant"
          ? currentUser.assistantId || currentUser.username || currentUser.id
          : "admin"
      );
      return cfg.custom || [];
    } catch {}
    return [];
  });
  const [isAddingCustomMisconception, setIsAddingCustomMisconception] = useState(false);
  const [newCustomMisconceptionText, setNewCustomMisconceptionText] = useState("");
  const [isMisconceptionsLocked, setIsMisconceptionsLocked] = useState<boolean>(() => {
    try {
      const cfg = storageService.getMathMisconceptionsConfig(
        currentUser.role === "assistant"
          ? currentUser.assistantId || currentUser.username || currentUser.id
          : "admin"
      );
      return cfg.isLocked;
    } catch {}
    return false;
  });
  const [editingMisconceptionTag, setEditingMisconceptionTag] = useState<string | null>(null);
  const [editingMisconceptionText, setEditingMisconceptionText] = useState<string>("");

  const [orderedMisconceptionList, setOrderedMisconceptionList] = useState<string[]>(() => {
    try {
      const uKey =
        currentUser.role === "assistant"
          ? currentUser.assistantId || currentUser.username || currentUser.id
          : "admin";
      const cfg = storageService.getMathMisconceptionsConfig(uKey);
      const allPool = Array.from(
        new Set([
          ...(cfg.custom || []),
          ...(cfg.globalCustom || []),
          ...COMMON_MATH_MISCONCEPTIONS,
        ])
      );
      if (cfg.order && cfg.order.length > 0) {
        const valid = cfg.order.filter((item) => allPool.includes(item));
        const missing = allPool.filter((item) => !valid.includes(item));
        return [...valid, ...missing];
      }
      return allPool;
    } catch {}
    return Array.from(new Set([...customMisconceptions, ...COMMON_MATH_MISCONCEPTIONS]));
  });

  // Keep orderedMisconceptionList synchronized when user or customMisconceptions change
  useEffect(() => {
    const cfg = storageService.getMathMisconceptionsConfig(currentMisconceptionUserKey);
    setCustomMisconceptions(cfg.custom || []);
    setIsMisconceptionsLocked(cfg.isLocked);

    const allPool = Array.from(
      new Set([
        ...(cfg.custom || []),
        ...(cfg.globalCustom || []),
        ...COMMON_MATH_MISCONCEPTIONS,
      ])
    );

    setOrderedMisconceptionList((prev) => {
      if (cfg.order && cfg.order.length > 0) {
        const valid = cfg.order.filter((item) => allPool.includes(item));
        const missing = allPool.filter((item) => !valid.includes(item));
        return [...valid, ...missing];
      }
      const valid = prev.filter((item) => allPool.includes(item));
      const missing = allPool.filter((item) => !valid.includes(item));
      return [...valid, ...missing];
    });
  }, [currentMisconceptionUserKey]);

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
  const [misconceptionStudentMap, setMisconceptionStudentMap] = useState<Record<string, string[]>>(() => {
    if (editingReport?.misconceptionStudentMap) return editingReport.misconceptionStudentMap;
    return {};
  });

  const allAvailableMisconceptions = useMemo(() => {
    return orderedMisconceptionList;
  }, [orderedMisconceptionList]);

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

  // Update students when class changes (safely preserves user-entered data)
  useEffect(() => {
    if (editingReport && editingReport.classId === classId) {
      setStudentRows(editingReport.students || []);
      return;
    }

    const filtered = allStudents.filter((s) => s.classId === classId);
    setStudentRows((prevRows) => {
      // If user has already entered data for this class, preserve all modified fields
      if (prevRows.length > 0 && prevRows.some((r) => filtered.some((s) => s.id === r.studentId))) {
        return filtered.map((s) => {
          const existing = prevRows.find((r) => r.studentId === s.id);
          if (existing) {
            return { ...existing, studentName: s.name, avatar: s.avatar || existing.avatar };
          }
          return {
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
          };
        });
      }

      return filtered.map((s) => ({
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
    });
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

  // Misconception & Math Mistakes Helpers (Per-user configuration: Admin configures global, Assistant configures personal)
  const handleAddNewCustomMisconception = () => {
    const text = newCustomMisconceptionText.trim();
    if (!text) return;
    if (allAvailableMisconceptions.includes(text)) {
      setFeedbackToast({ type: "info", message: "Lỗi này đã có trong danh sách của bạn!" });
      setNewCustomMisconceptionText("");
      setIsAddingCustomMisconception(false);
      if (!misconceptionTags.includes(text)) {
        setMisconceptionTags((prev) => [...prev, text]);
      }
      return;
    }
    const updatedCustom = [text, ...customMisconceptions];
    setCustomMisconceptions(updatedCustom);

    // Put new custom error at the very top of ordered list
    const nextOrder = [text, ...orderedMisconceptionList.filter((i) => i !== text)];
    setOrderedMisconceptionList(nextOrder);

    // Save to user's personalized or global storage
    try {
      storageService.saveMathMisconceptionsConfig(
        { custom: updatedCustom, order: nextOrder },
        currentMisconceptionUserKey
      );
    } catch {}

    // Automatically select it
    setMisconceptionTags((prev) => [...prev, text]);
    setNewCustomMisconceptionText("");
    setIsAddingCustomMisconception(false);
    setFeedbackToast({
      type: "success",
      message: isAdmin
        ? `✓ Đã tạo lỗi mới vào danh mục toàn CLB: "${text}"`
        : `✓ Đã thêm lỗi mới vào danh mục cá nhân của bạn: "${text}"`,
    });
  };

  const handleMoveMisconceptionUp = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (index <= 0) return;
    setOrderedMisconceptionList((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      try {
        storageService.saveMathMisconceptionsConfig(
          { order: next },
          currentMisconceptionUserKey
        );
      } catch {}
      return next;
    });
  };

  const handleMoveMisconceptionDown = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (index >= orderedMisconceptionList.length - 1) return;
    setOrderedMisconceptionList((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      try {
        storageService.saveMathMisconceptionsConfig(
          { order: next },
          currentMisconceptionUserKey
        );
      } catch {}
      return next;
    });
  };

  const handleMoveMisconceptionToTop = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (index <= 0) return;
    setOrderedMisconceptionList((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      try {
        storageService.saveMathMisconceptionsConfig(
          { order: next },
          currentMisconceptionUserKey
        );
      } catch {}
      return next;
    });
    setFeedbackToast({ type: "info", message: "Đã chuyển lỗi lên đầu danh sách" });
  };

  const handleResetMisconceptionOrder = () => {
    const cfg = storageService.getMathMisconceptionsConfig(currentMisconceptionUserKey);
    const defaultOrder = Array.from(
      new Set([
        ...customMisconceptions,
        ...(cfg.globalCustom || []),
        ...COMMON_MATH_MISCONCEPTIONS,
      ])
    );
    setOrderedMisconceptionList(defaultOrder);
    try {
      storageService.saveMathMisconceptionsConfig(
        { order: defaultOrder },
        currentMisconceptionUserKey
      );
    } catch {}
    setFeedbackToast({ type: "info", message: "Đã khôi phục thứ tự mặc định" });
  };

  const handleDeleteCustomMisconception = (tag: string) => {
    const isMyCustom = customMisconceptions.includes(tag);
    if (!isAdmin && !isMyCustom) {
      setFeedbackToast({ type: "error", message: "Bạn chỉ có thể xóa các lỗi do chính bạn tạo!" });
      return;
    }
    const updatedCustom = customMisconceptions.filter((t) => t !== tag);
    setCustomMisconceptions(updatedCustom);
    const nextOrder = orderedMisconceptionList.filter((t) => t !== tag);
    setOrderedMisconceptionList(nextOrder);

    try {
      storageService.saveMathMisconceptionsConfig(
        { custom: updatedCustom, order: nextOrder },
        currentMisconceptionUserKey
      );
    } catch {}

    setMisconceptionTags((prev) => prev.filter((t) => t !== tag));
    setMisconceptionStudentMap((prev) => {
      const next = { ...prev };
      delete next[tag];
      return next;
    });
    setFeedbackToast({ type: "info", message: `Đã xóa lỗi: "${tag}"` });
  };

  const handleToggleMisconceptionsLock = () => {
    setIsMisconceptionsLocked((prev) => {
      const next = !prev;
      try {
        storageService.saveMathMisconceptionsConfig(
          { isLocked: next },
          currentMisconceptionUserKey
        );
      } catch {}
      if (next) {
        setEditingMisconceptionTag(null);
        setIsAddingCustomMisconception(false);
        setFeedbackToast({ type: "info", message: "🔒 Đã khóa danh mục lỗi!" });
      } else {
        setFeedbackToast({
          type: "info",
          message: "🔓 Đã mở khóa: Bạn có thể thêm, sửa, xóa và sắp xếp lỗi.",
        });
      }
      return next;
    });
  };

  const handleStartEditMisconception = (tag: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isMyCustom = customMisconceptions.includes(tag);
    if (!isAdmin && !isMyCustom) {
      setFeedbackToast({ type: "error", message: "Bạn chỉ có thể sửa nội dung các lỗi do bạn tạo!" });
      return;
    }
    setEditingMisconceptionTag(tag);
    setEditingMisconceptionText(tag);
  };

  const handleCancelEditMisconception = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingMisconceptionTag(null);
    setEditingMisconceptionText("");
  };

  const handleSaveEditMisconception = (oldTag: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isMyCustom = customMisconceptions.includes(oldTag);
    if (!isAdmin && !isMyCustom) {
      setFeedbackToast({ type: "error", message: "Bạn chỉ có thể sửa nội dung các lỗi do bạn tạo!" });
      return;
    }
    const trimmed = editingMisconceptionText.trim();
    if (!trimmed) {
      setFeedbackToast({ type: "error", message: "Nội dung lỗi không được để trống!" });
      return;
    }
    if (trimmed === oldTag) {
      setEditingMisconceptionTag(null);
      return;
    }

    // 1. Update in ordered list
    const nextOrder = orderedMisconceptionList.map((item) => (item === oldTag ? trimmed : item));
    setOrderedMisconceptionList(nextOrder);

    // 2. Update custom misconceptions list
    let nextCustom = customMisconceptions;
    if (customMisconceptions.includes(oldTag)) {
      nextCustom = customMisconceptions.map((item) => (item === oldTag ? trimmed : item));
    } else {
      nextCustom = [...customMisconceptions, trimmed];
    }
    setCustomMisconceptions(nextCustom);

    try {
      storageService.saveMathMisconceptionsConfig(
        { custom: nextCustom, order: nextOrder },
        currentMisconceptionUserKey
      );
    } catch {}

    // 3. Update selected misconceptionTags
    setMisconceptionTags((prev) => prev.map((t) => (t === oldTag ? trimmed : t)));

    // 4. Update student map
    setMisconceptionStudentMap((prev) => {
      const next = { ...prev };
      if (next[oldTag]) {
        next[trimmed] = next[oldTag];
        delete next[oldTag];
      }
      return next;
    });

    setEditingMisconceptionTag(null);
    setEditingMisconceptionText("");
    setFeedbackToast({ type: "success", message: `✓ Đã cập nhật: "${trimmed}"` });
  };

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

  const handleToggleStudentForMisconception = (tag: string, studentName: string) => {
    setMisconceptionStudentMap((prev) => {
      const currentList = prev[tag] || [];
      const nextList = currentList.includes(studentName)
        ? currentList.filter((s) => s !== studentName)
        : [...currentList, studentName];

      const newMap = { ...prev, [tag]: nextList };

      // Also sync misconceptionStudents with unique list
      const allStudentsWithMistakes = Array.from(
        new Set(Object.values(newMap).flat())
      );
      setMisconceptionStudents((prevStudents) =>
        Array.from(new Set([...prevStudents, ...allStudentsWithMistakes]))
      );

      return newMap;
    });
  };

  const handleSelectAllStudentsForMisconception = (tag: string) => {
    const allNames = studentRows.map((s) => s.studentName);
    setMisconceptionStudentMap((prev) => ({
      ...prev,
      [tag]: allNames,
    }));
    setMisconceptionStudents((prev) => Array.from(new Set([...prev, ...allNames])));
  };

  const handleClearStudentsForMisconception = (tag: string) => {
    setMisconceptionStudentMap((prev) => {
      const next = { ...prev };
      delete next[tag];
      return next;
    });
  };

  const handleAutoFillNotesFromErrors = () => {
    if (misconceptionTags.length === 0) {
      setFeedbackToast({ type: "info", message: "Chưa chọn tiêu chí lỗi nào để điền!" });
      return;
    }
    const lines: string[] = [];
    misconceptionTags.forEach((tag) => {
      const students = misconceptionStudentMap[tag] || [];
      if (students.length > 0) {
        lines.push(`- ${tag}: ${students.join(", ")}`);
      } else {
        lines.push(`- ${tag}`);
      }
    });
    const summaryText = lines.join("\n");
    setMisconceptionNotes((prev) => {
      if (!prev.trim()) return summaryText;
      return `${prev.trim()}\n\nLỗi cần củng cố:\n${summaryText}`;
    });
    setFeedbackToast({
      type: "success",
      message: "✓ Đã tổng hợp tóm tắt lỗi sai vào ô ghi chú!",
    });
  };

  // Assistant selection helpers (Support 1, 2 or 3 assistants per shift)
  const handleToggleAssistant = (id: string) => {
    setSelectedAssistantIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one assistant
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 4) return prev;
        return [...prev, id];
      }
    });
  };

  // Quick roll call & absence helpers
  const handleSetAllPresent = () => {
    setStudentRows((prev) =>
      prev.map((s) => ({
        ...s,
        attendance: "present" as AttendanceStatus,
        quickTags: s.quickTags && s.quickTags.length > 0 ? s.quickTags : ["Đi học đầy đủ"],
      }))
    );
    setFeedbackToast({
      type: "success",
      message: "✓ Đã điểm danh tất cả học sinh có mặt!",
    });
  };

  const handleToggleStudentAbsent = (studentId: string, type: "excused" | "unexcused") => {
    setStudentRows((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;
        const newStatus: AttendanceStatus = s.attendance === type ? "present" : type;
        return {
          ...s,
          attendance: newStatus,
        };
      })
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
    const excusedStudents = studentRows.filter((s) => s.attendance === "excused").map((s) => s.studentName);
    const unexcusedStudents = studentRows.filter((s) => s.attendance === "unexcused").map((s) => s.studentName);

    let notes = `Sĩ số: ${presentCount}/${studentRows.length} học sinh có mặt.`;
    if (excusedStudents.length > 0) notes += ` Nghỉ có phép: ${excusedStudents.join(", ")}.`;
    if (unexcusedStudents.length > 0) notes += ` Nghỉ không phép: ${unexcusedStudents.join(", ")}.`;
    if (lateStudents.length > 0) notes += ` Đi muộn: ${lateStudents.join(", ")}.`;

    const directText = generateDirectCriteriaFeedback({
      className: currentClass?.name || "Lớp Toán",
      teacherName: teacherName.trim() || "Thầy Thắng",
      assistantName: combinedAssistantName,
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
    const excusedStudents = studentRows.filter((s) => s.attendance === "excused").map((s) => s.studentName);
    const unexcusedStudents = studentRows.filter((s) => s.attendance === "unexcused").map((s) => s.studentName);

    let notes = `Sĩ số: ${presentCount}/${studentRows.length} có mặt.`;
    if (excusedStudents.length > 0) notes += ` Nghỉ có phép: ${excusedStudents.join(", ")}.`;
    if (unexcusedStudents.length > 0) notes += ` Nghỉ không phép: ${unexcusedStudents.join(", ")}.`;
    if (lateStudents.length > 0) notes += ` Muộn: ${lateStudents.join(", ")}.`;
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
        assistantName: combinedAssistantName,
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
          assistantName: combinedAssistantName,
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
        assistantName: combinedAssistantName,
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
    const excusedStudents = studentRows.filter((s) => s.attendance === "excused").map((s) => s.studentName);
    const unexcusedStudents = studentRows.filter((s) => s.attendance === "unexcused").map((s) => s.studentName);

    let notes = `Sĩ số: ${presentCount}/${studentRows.length} học sinh có mặt.`;
    if (excusedStudents.length > 0) notes += ` Nghỉ có phép: ${excusedStudents.join(", ")}.`;
    if (unexcusedStudents.length > 0) notes += ` Nghỉ không phép: ${unexcusedStudents.join(", ")}.`;
    if (lateStudents.length > 0) notes += ` Đi muộn: ${lateStudents.join(", ")}.`;
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
        assistantName: combinedAssistantName,
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
          assistantName: combinedAssistantName,
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
        assistantName: combinedAssistantName,
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

  const handleSaveReport = async (targetStatus: "draft" | "submitted" | "approved") => {
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

    // Kiểm tra trùng lặp báo cáo (Cùng ngày, ca, lớp)
    const existingDuplicate = await assistantReportService.checkDuplicateReport(
      date,
      shift,
      classId,
      editingReport?.id
    );

    if (existingDuplicate && !editingReport) {
      const confirmOverwrite = window.confirm(
        `⚠️ Cảnh báo trùng lặp báo cáo:\nĐã có báo cáo cho lớp "${currentClass?.name}" vào ${date} (${shift}) tạo bởi ${existingDuplicate.assistantName}.\n\nBạn có muốn tiếp tục lưu và ghi đè báo cáo này không?`
      );
      if (!confirmOverwrite) {
        return;
      }
    }

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
      assistantId: selectedAssistantIds[0] || assistantId,
      assistantName: combinedAssistantName,
      assistantIds: selectedAssistantIds,
      assistantNames: selectedAssistantNames,
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
      misconceptionStudentMap,
      customMisconceptionTags: customMisconceptions,

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

    // Save to Firestore Realtime ecosystem and local cache
    await assistantReportService.saveAssistantReport(newReport);
    storageService.clearReportDraft();

    setFeedbackToast({
      type: "success",
      message:
        targetStatus === "approved"
          ? "🎉 Đã duyệt và đồng bộ báo cáo buổi học lên Firebase thành công!"
          : targetStatus === "submitted"
          ? "📤 Đã gửi báo cáo realtime cho Giáo viên duyệt thành công!"
          : "💾 Đã lưu bản nháp báo cáo lên hệ thống thành công!",
    });

    if (onReportSaved) {
      onReportSaved(newReport);
    }
  };

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          {/* Assistant: "Trợ Giảng Báo Cáo" (Hỗ trợ chọn 1, 2 hoặc 3 trợ giảng cùng ca) */}
          <div className="relative">
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-black text-slate-900">
                <GraduationCap className="w-3.5 h-3.5 text-blue-800" />
                Trợ Giảng Báo Cáo:
              </span>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                (Chọn 1–3 người)
              </span>
            </label>

            {/* Selected Assistant Chips & Dropdown Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAssistantPickerOpen(!isAssistantPickerOpen)}
                className="w-full text-left text-xs px-3 py-2 rounded-xl border-2 border-blue-200 bg-blue-50/50 hover:bg-white focus:outline-none focus:border-blue-600 font-bold text-slate-900 transition-all flex items-center justify-between min-h-[42px] cursor-pointer shadow-2xs"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedAssistantIds.length > 0 ? (
                    selectedAssistantIds.map((id) => {
                      const asst = assistants.find((a) => a.id === id);
                      const name = asst?.name || (id === currentUser.id ? currentUser.name : id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 bg-blue-900 text-white text-[11px] font-black px-2 py-0.5 rounded-lg shadow-2xs"
                        >
                          <span>{name}</span>
                          {selectedAssistantIds.length > 1 && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAssistant(id);
                              }}
                              className="hover:bg-blue-700 rounded px-0.5 ml-0.5 cursor-pointer text-amber-300 font-bold"
                              title="Bỏ chọn trợ giảng này"
                            >
                              ✕
                            </span>
                          )}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-slate-400">Chọn trợ giảng...</span>
                  )}
                </div>
                <span className="text-xs text-blue-900 font-black shrink-0 ml-2">
                  {isAssistantPickerOpen ? "▲" : "▼"}
                </span>
              </button>

              {/* Popup Picker */}
              {isAssistantPickerOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-white rounded-2xl border-2 border-slate-300 shadow-xl z-40 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-black text-slate-500 px-2 py-1 border-b border-slate-100 flex items-center justify-between">
                    <span>Tích chọn trợ giảng cùng ca ({selectedAssistantIds.length}/3)</span>
                    <button
                      type="button"
                      onClick={() => setIsAssistantPickerOpen(false)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                    >
                      Đóng
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                    {assistants.map((asst) => {
                      const isSelected = selectedAssistantIds.includes(asst.id);
                      return (
                        <button
                          key={asst.id}
                          type="button"
                          onClick={() => handleToggleAssistant(asst.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-blue-100 text-blue-950 font-black border border-blue-300"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                                isSelected
                                  ? "bg-blue-900 border-blue-900 text-white font-black"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && "✓"}
                            </span>
                            <span>{asst.name}</span>
                          </div>
                          {asst.id === currentUser.id && (
                            <span className="text-[9px] bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded font-black">
                              Bạn
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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

      {/* STEP 1.5: ĐIỂM DANH & TÍCH CHỌN HỌC SINH NGHỈ HỌC, NGHỈ KHÔNG PHÉP */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-indigo-700">
              1.5
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900">
                  Điểm Danh & Tích Chọn Học Sinh Nghỉ Học
                </h3>
                <span className="text-xs font-black text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Theo dõi chuyên cần
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Tích chọn nhanh học sinh nghỉ có phép, nghỉ không phép hoặc đi muộn để tự động cập nhật vào bài nhận xét.
              </p>
            </div>
          </div>

          {/* Quick attendance stats badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              Sĩ số: <strong>{studentRows.length}</strong>
            </span>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300">
              Có mặt: <strong>{presentCount}</strong>
            </span>
            {excusedCount > 0 && (
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
                Nghỉ có phép: <strong>{excusedCount}</strong>
              </span>
            )}
            {unexcusedCount > 0 && (
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-rose-100 text-rose-900 border border-rose-300">
                Nghỉ K.phép: <strong>{unexcusedCount}</strong>
              </span>
            )}
            {lateCount > 0 && (
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-orange-100 text-orange-900 border border-orange-300">
                Muộn: <strong>{lateCount}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Quick action buttons toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">
            Thao tác nhanh điểm danh ca học:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSetAllPresent}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Tất cả có mặt</span>
            </button>
          </div>
        </div>

        {/* Interactive Student Attendance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {studentRows.length > 0 ? (
            studentRows.map((st, idx) => {
              const isPresent = st.attendance === "present";
              const isExcused = st.attendance === "excused";
              const isUnexcused = st.attendance === "unexcused";
              const isLate = st.attendance === "late";

              return (
                <div
                  key={st.studentId}
                  className={`p-3 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2.5 ${
                    isUnexcused
                      ? "bg-rose-50/80 border-rose-300 ring-2 ring-rose-300/40"
                      : isExcused
                      ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-300/40"
                      : isLate
                      ? "bg-orange-50/80 border-orange-300 ring-2 ring-orange-300/40"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 font-black text-base flex items-center justify-center shrink-0 overflow-hidden border-2 border-slate-200 shadow-xs">
                        {st.avatar ? (
                          <img
                            src={st.avatar}
                            alt={st.studentName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          st.studentName.charAt(0)
                        )}
                      </div>
                      <span className="font-black text-xs text-slate-900 leading-tight">
                        {st.studentName}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isPresent
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                          : isExcused
                          ? "bg-amber-200 text-amber-950 border border-amber-300"
                          : isUnexcused
                          ? "bg-rose-200 text-rose-950 border border-rose-300"
                          : "bg-orange-200 text-orange-950 border border-orange-300"
                      }`}
                    >
                      {isPresent
                        ? "Có mặt"
                        : isExcused
                        ? "Nghỉ có phép"
                        : isUnexcused
                        ? "Nghỉ K.Phép"
                        : "Đi muộn"}
                    </span>
                  </div>

                  {/* 4 status toggle buttons */}
                  <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleAttendanceChange(st.studentId, "present")}
                      className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                        isPresent
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-900"
                      }`}
                      title="Có mặt"
                    >
                      Có mặt
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAttendanceChange(st.studentId, "excused")}
                      className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                        isExcused
                          ? "bg-amber-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-900"
                      }`}
                      title="Nghỉ có phép"
                    >
                      Nghỉ phép
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAttendanceChange(st.studentId, "unexcused")}
                      className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                        isUnexcused
                          ? "bg-rose-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-900"
                      }`}
                      title="Nghỉ học không phép"
                    >
                      K.phép
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAttendanceChange(st.studentId, "late")}
                      className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                        isLate
                          ? "bg-orange-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-orange-100 hover:text-orange-900"
                      }`}
                      title="Đi muộn"
                    >
                      Muộn
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-slate-400">
              Chưa có danh sách học sinh cho lớp học này.
            </div>
          )}
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
                              ? "bg-emerald-100/95 border-emerald-500 shadow-sm ring-1 ring-emerald-400/50"
                              : "bg-amber-100/95 border-amber-500 shadow-sm ring-1 ring-amber-400/50"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
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
                            <span
                              className={`text-xs sm:text-[13px] leading-snug ${
                                isChecked
                                  ? isPraise
                                    ? "font-black text-emerald-950"
                                    : "font-black text-amber-950"
                                  : "font-bold text-slate-800"
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>

                          {/* Right Badge: ✨ Khen / ⚠️ Lưu ý */}
                          <span
                            className={`px-3 py-1 rounded-xl text-[11px] font-black shrink-0 flex items-center gap-1 ${
                              isPraise
                                ? isChecked
                                  ? "bg-emerald-200 text-emerald-950 border border-emerald-400"
                                  : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : isChecked
                                ? "bg-amber-200 text-amber-950 border border-amber-400"
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
                              isPraise ? "border-emerald-300/80" : "border-amber-300/80"
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
                                  className={`text-[10px] font-bold flex items-center gap-0.5 cursor-pointer ${
                                    isPraise
                                      ? "text-emerald-800 hover:text-rose-600"
                                      : "text-amber-800 hover:text-rose-600"
                                  }`}
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
                                            ? "bg-emerald-700 text-white shadow-2xs font-black ring-1 ring-emerald-800"
                                            : "bg-amber-700 text-white shadow-2xs font-black ring-1 ring-amber-800"
                                          : isPraise
                                          ? "bg-white/90 text-emerald-950 border border-emerald-300 hover:bg-white hover:border-emerald-400"
                                          : "bg-white/90 text-amber-950 border border-amber-300 hover:bg-white hover:border-amber-400"
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
                                <span className={`text-[11px] italic ${isPraise ? "text-emerald-800" : "text-amber-800"}`}>
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

      {/* STEP 3: MỤC GHI CHÚ RIÊNG: KIẾN THỨC CÁC EM CÒN LẦM LẪN, SAI SÓT (CHECK CHỌN & CHỌN NHANH HỌC SINH) */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-6">
        {/* Step 3 Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
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
                  {misconceptionTags.length} lỗi đã chọn
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Tích chọn các lỗi sai toán học. Dưới mỗi lỗi sẽ có nút bấm chọn nhanh học sinh mắc lỗi đó để theo dõi và kèm cặp.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Nút Khóa / Mở Khóa Danh Mục */}
            <button
              type="button"
              onClick={handleToggleMisconceptionsLock}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-xs cursor-pointer transition-all border-2 shadow-xs ${
                isMisconceptionsLocked
                  ? "bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-950 shadow-sm"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300"
              }`}
              title={
                isMisconceptionsLocked
                  ? "Đang khóa: Bấm vào đây để MỞ KHÓA thêm, sửa nội dung, xóa và sắp xếp lỗi"
                  : "Đang mở: Bấm vào đây để KHÓA LẠI (bảo vệ danh mục)"
              }
            >
              {isMisconceptionsLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>🔒 Đang khóa sửa (Bấm mở)</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span>🔓 Đang mở sửa (Bấm khóa)</span>
                </>
              )}
            </button>

            {!isMisconceptionsLocked && (
              <>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomMisconception((prev) => !prev)}
                  className="btn-3d-amber text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-950" />
                  <span>
                    {isAdmin ? "+ Tạo lỗi toàn CLB" : "+ Thêm lỗi vào danh mục của tôi"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleResetMisconceptionOrder}
                  className="px-2.5 py-1.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 text-xs cursor-pointer transition-all"
                  title="Khôi phục thứ tự danh mục ban đầu"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>Thứ tự mặc định</span>
                </button>
              </>
            )}

            {misconceptionTags.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMisconceptionTags([]);
                  setMisconceptionStudentMap({});
                  setFeedbackToast({ type: "info", message: "Đã bỏ chọn tất cả các lỗi!" });
                }}
                className="btn-3d-secondary text-xs py-1.5 px-2.5 cursor-pointer"
              >
                Bỏ chọn hết
              </button>
            )}
          </div>
        </div>

        {/* Thông báo trạng thái cấu hình danh mục */}
        <div className="flex items-center justify-between gap-2 p-2.5 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin ? (
              <span className="font-bold text-purple-900 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <span>👑</span>
                <span>Quản trị viên: Đang quản lý danh mục chuẩn toàn CLB</span>
              </span>
            ) : (
              <span className="font-bold text-blue-900 bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <span>👤</span>
                <span>
                  Danh mục của: <strong>{currentUser.name}</strong> (Lưu cấu hình riêng cho bạn)
                </span>
              </span>
            )}
            {customMisconceptions.length > 0 && (
              <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-lg">
                +{customMisconceptions.length} lỗi tự thêm
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            {isAdmin
              ? "Thay đổi của bạn sẽ cập nhật làm mẫu chuẩn cho toàn hệ thống."
              : "Các lỗi bạn tự thêm và thứ tự lỗi được lưu riêng vào tài khoản của bạn."}
          </span>
        </div>

        {/* Form thêm lỗi sai tùy chỉnh */}
        {isAddingCustomMisconception && !isMisconceptionsLocked && (
          <div className="p-4 rounded-2xl bg-amber-50/95 border-2 border-amber-400 shadow-sm space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-800" />
                {isAdmin
                  ? "Tạo tiêu chí lỗi sai toán học mới cho toàn bộ CLB (Đưa lên đầu danh sách):"
                  : `Thêm tiêu chí lỗi sai vào danh mục cá nhân của ${currentUser.name}:`}
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCustomMisconception(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCustomMisconceptionText}
                onChange={(e) => setNewCustomMisconceptionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewCustomMisconception();
                  }
                }}
                placeholder={
                  isAdmin
                    ? "VD: Nhầm hệ thức lượng trong tam giác vuông, Quên đổi dấu bất đẳng thức (Toàn hệ thống)..."
                    : "VD: Nhầm công thức Vi-ét, Tính sai căn bậc hai (Lưu riêng cho bạn)..."
                }
                className="flex-1 p-2.5 rounded-xl border-2 border-amber-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddNewCustomMisconception}
                className="btn-3d-primary text-xs px-4 py-2 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Thêm lỗi</span>
              </button>
            </div>
            {!isAdmin && (
              <p className="text-[11px] text-amber-800 font-medium italic">
                💡 Lỗi sai này sẽ được lưu riêng vào tài khoản của bạn, không làm ảnh hưởng tới trợ giảng khác.
              </p>
            )}
          </div>
        )}

        {/* Danh Sách Lỗi Sai - Mỗi lỗi 1 hàng trọn chiều rộng (Full-width row) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 block">
                Danh mục các lỗi sai toán học (Bấm chọn lỗi để mở danh sách học sinh):
              </span>
              {!isMisconceptionsLocked && (
                <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                  🔓 Có thể sửa, xóa lỗi riêng & đổi thứ tự
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-600 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
              {misconceptionTags.length}/{allAvailableMisconceptions.length} lỗi được đánh dấu
            </span>
          </div>

          {/* Danh sách 1 lỗi trên 1 hàng canh hết chiều rộng cả khung */}
          <div className="flex flex-col gap-3.5 w-full">
            {allAvailableMisconceptions.map((tag, idx) => {
              const isChecked = misconceptionTags.includes(tag);
              const taggedStudents = misconceptionStudentMap[tag] || [];
              const isMyCustom = customMisconceptions.includes(tag);
              const isEditing = editingMisconceptionTag === tag;
              const canEditOrDelete = isAdmin || isMyCustom;

              return (
                <div
                  key={tag}
                  className={`w-full p-4 rounded-2xl border-2 transition-all space-y-3 ${
                    isChecked
                      ? "bg-[#f59e0b] border-[#b45309] shadow-md ring-2 ring-[#fbbf24]/80 text-slate-950"
                      : "bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 hover:shadow-sm text-slate-800"
                  }`}
                >
                  {/* Hàng Tiêu Chí Lỗi & Controls */}
                  <div className="flex items-start justify-between gap-3 w-full">
                    {/* Nếu đang chỉnh sửa nội dung lỗi này */}
                    {isEditing ? (
                      <div className="flex-1 flex items-start gap-2.5">
                        <span className="text-sm sm:text-base font-black min-w-[36px] h-8 flex items-center justify-center rounded-xl shrink-0 bg-blue-600 text-white border-2 border-blue-700 shadow-2xs">
                          {idx + 1}
                        </span>
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                        >
                          <input
                            type="text"
                            value={editingMisconceptionText}
                            onChange={(e) => setEditingMisconceptionText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveEditMisconception(tag);
                              } else if (e.key === "Escape") {
                                handleCancelEditMisconception();
                              }
                            }}
                            placeholder="Nhập nội dung lỗi sai..."
                            className="flex-1 p-2.5 rounded-xl border-2 border-blue-500 bg-white font-bold text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            autoFocus
                          />
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleSaveEditMisconception(tag, e)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Lưu</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditMisconception}
                              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer border border-slate-300"
                            >
                              <X className="w-4 h-4" />
                              <span>Hủy</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Hiển thị bình thường */
                      <div
                        onClick={() => handleToggleMisconceptionTag(tag)}
                        className="flex items-start gap-2.5 flex-1 cursor-pointer select-none group min-w-0"
                      >
                        {/* Số thứ tự TO, IN ĐẬM, TƯƠNG PHẢN NỔI BẬT */}
                        <span
                          className={`text-sm sm:text-base font-black min-w-[36px] h-8 flex items-center justify-center rounded-xl shrink-0 transition-all border-2 shadow-2xs ${
                            isChecked
                              ? "bg-slate-950 text-amber-300 border-slate-950 ring-2 ring-amber-900/30"
                              : "bg-slate-900 text-amber-300 border-slate-950 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-700"
                          }`}
                          title={`Thứ tự ${idx + 1}`}
                        >
                          {idx + 1}
                        </span>

                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 mt-1.5 ${
                            isChecked
                              ? "bg-slate-950 border-slate-950 text-amber-400 shadow-xs"
                              : "border-slate-400 bg-white group-hover:border-amber-500"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                        </div>

                        {/* Tiêu đề lỗi & Badges - HIỂN THỊ ĐẦY ĐỦ VĂN BẢN TRỌN CHIỀU RỘNG */}
                        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-xs sm:text-sm leading-relaxed pt-0.5 break-words ${
                                isChecked
                                  ? "font-black text-slate-950 drop-shadow-2xs"
                                  : "font-bold text-slate-800 group-hover:text-slate-950"
                              }`}
                            >
                              {tag}
                            </span>
                            {isMyCustom && !isAdmin && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300 shrink-0">
                                👤 Của bạn
                              </span>
                            )}
                            {isMyCustom && isAdmin && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300 shrink-0">
                                👑 CLB
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bộ nút Điều khiển & Đếm HS */}
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {/* Đếm số học sinh */}
                      {isChecked && (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${
                            taggedStudents.length > 0
                              ? "bg-slate-950 text-amber-300 border-slate-950 shadow-2xs"
                              : "bg-amber-200/90 text-amber-950 border-amber-400/80"
                          }`}
                        >
                          {taggedStudents.length} HS
                        </span>
                      )}

                      {/* Khi MỞ KHÓA (!isMisconceptionsLocked) -> Hiện nút Sửa, Sắp xếp, Xóa */}
                      {!isMisconceptionsLocked && !isEditing && (
                        <>
                          {/* Nút Sửa nội dung lỗi (Admin sửa tất cả, Trợ giảng sửa lỗi tự tạo) */}
                          {canEditOrDelete && (
                            <button
                              type="button"
                              onClick={(e) => handleStartEditMisconception(tag, e)}
                              className={`p-1.5 px-2.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold shadow-2xs ${
                                isChecked
                                  ? "bg-slate-950/90 hover:bg-slate-950 text-white border-slate-950"
                                  : "bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border-blue-200"
                              }`}
                              title="Sửa nội dung lỗi này"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Sửa</span>
                            </button>
                          )}

                          {/* Nút Chuyển Lên Đầu */}
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => handleMoveMisconceptionToTop(idx, e)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isChecked
                                  ? "bg-amber-100 hover:bg-slate-950 hover:text-amber-300 text-amber-950 border-amber-400/80"
                                  : "bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 border-slate-300"
                              }`}
                              title="Chuyển lỗi này lên đầu danh sách"
                            >
                              <ChevronsUp className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Nút Chuyển Lên */}
                          <button
                            type="button"
                            onClick={(e) => handleMoveMisconceptionUp(idx, e)}
                            disabled={idx === 0}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-20 disabled:pointer-events-none ${
                              isChecked
                                ? "bg-amber-100 hover:bg-slate-950 hover:text-amber-300 text-amber-950 border-amber-400/80"
                                : "bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 border-slate-300"
                            }`}
                            title="Di chuyển lên trên"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút Chuyển Xuống */}
                          <button
                            type="button"
                            onClick={(e) => handleMoveMisconceptionDown(idx, e)}
                            disabled={idx === allAvailableMisconceptions.length - 1}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-20 disabled:pointer-events-none ${
                              isChecked
                                ? "bg-amber-100 hover:bg-slate-950 hover:text-amber-300 text-amber-950 border-amber-400/80"
                                : "bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 border-slate-300"
                            }`}
                            title="Di chuyển xuống dưới"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút Xóa lỗi (Admin xóa tất cả, Trợ giảng xóa lỗi tự tạo) */}
                          {canEditOrDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomMisconception(tag);
                              }}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isChecked
                                  ? "bg-rose-100 text-rose-800 hover:bg-rose-700 hover:text-white border-rose-300"
                                  : "bg-rose-50 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200"
                              }`}
                              title="Xóa lỗi này khỏi danh sách"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* KHI CHỌN TIÊU CHÍ: Ở DƯỚI TÍCH CHỌN SẼ CÓ KHUNG CHỌN NHANH HỌC SINH ỨNG VỚI TIÊU CHÍ ĐÓ */}
                  {isChecked && (
                    <div className="p-3.5 rounded-xl bg-amber-50/95 border-2 border-amber-600/50 shadow-inner space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-950 font-black flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-amber-800" />
                          Chọn nhanh học sinh mắc lỗi này:
                        </span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <button
                            type="button"
                            onClick={() => handleSelectAllStudentsForMisconception(tag)}
                            className="text-[11px] text-blue-800 hover:text-blue-950 hover:underline cursor-pointer"
                          >
                            Tất cả ({studentRows.length})
                          </button>
                          <span className="text-amber-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleClearStudentsForMisconception(tag)}
                            className="text-[11px] text-slate-500 hover:text-rose-700 cursor-pointer"
                          >
                            Bỏ chọn
                          </button>
                        </div>
                      </div>

                      {/* Danh sách nút chọn nhanh học sinh */}
                      <div className="flex flex-wrap gap-1.5">
                        {studentRows.length > 0 ? (
                          studentRows.map((st) => {
                            const isStudentSelected = taggedStudents.includes(st.studentName);

                            return (
                              <button
                                key={st.studentId}
                                type="button"
                                onClick={() =>
                                  handleToggleStudentForMisconception(tag, st.studentName)
                                }
                                className={`px-2.5 py-1 rounded-xl text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                                  isStudentSelected
                                    ? "bg-slate-950 text-amber-300 font-black border-2 border-slate-900 shadow-xs ring-2 ring-amber-400/80"
                                    : "bg-white text-slate-800 border-2 border-amber-200 hover:border-amber-500 hover:bg-amber-100 font-bold shadow-2xs"
                                }`}
                              >
                                <span>{st.studentName}</span>
                                {isStudentSelected && (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-amber-800/80 italic">
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

        {/* 3. Ô Nhập Chi Tiết Ghi Chú Lỗi Sai & Nút Tự Động Tạo Gợi Ý */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 block">
              Chi tiết nội dung kiến thức các em còn lầm lẫn / Hướng dẫn khắc phục:
            </label>
            {misconceptionTags.length > 0 && (
              <button
                type="button"
                onClick={handleAutoFillNotesFromErrors}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Điền nhanh tóm tắt lỗi vào ô</span>
              </button>
            )}
          </div>
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-black text-xs text-slate-900 uppercase tracking-wide">
                LỰA CHỌN VĂN PHONG SOẠN NHẬN XÉT (AI GEMINI):
              </span>
            </div>
            <span
              className={`text-xs font-black px-3.5 py-1 rounded-xl border shadow-2xs transition-all ${
                selectedPersona === "pedagogical"
                  ? "text-blue-950 bg-blue-100 border-blue-300"
                  : selectedPersona === "positive"
                  ? "text-emerald-950 bg-emerald-100 border-emerald-300"
                  : selectedPersona === "friendly"
                  ? "text-violet-950 bg-violet-100 border-violet-300"
                  : selectedPersona === "warm_humor"
                  ? "text-amber-950 bg-amber-100 border-amber-300"
                  : "text-blue-900 bg-blue-50 border-blue-200"
              }`}
            >
              Đang chọn: <strong>{currentPersonaObj.title}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {PERSONA_STYLES.map((persona) => {
              const isSelected = selectedPersona === persona.id;

              // Color configs specific to each persona (increased depth/saturation by 20% for higher contrast)
              const colorConfig = {
                pedagogical: {
                  selectedBg:
                    "bg-gradient-to-br from-blue-200 via-sky-100 to-indigo-200 border-blue-600 ring-4 ring-blue-500/30 shadow-md",
                  unselectedBg:
                    "bg-gradient-to-br from-blue-100/80 via-sky-50 to-blue-100/60 border-blue-300 hover:border-blue-600 hover:bg-blue-150/70 shadow-2xs",
                  selectedIconBg: "bg-blue-700 text-white shadow-xs",
                  unselectedIconBg: "bg-blue-200 text-blue-950 border border-blue-300",
                  badge: "bg-blue-200 text-blue-950 border border-blue-400 font-black",
                  title: "text-blue-950",
                  checkBg: "bg-blue-600 text-white",
                },
                positive: {
                  selectedBg:
                    "bg-gradient-to-br from-emerald-200 via-teal-100 to-green-200 border-emerald-600 ring-4 ring-emerald-500/30 shadow-md",
                  unselectedBg:
                    "bg-gradient-to-br from-emerald-100/80 via-teal-50 to-emerald-100/60 border-emerald-300 hover:border-emerald-600 hover:bg-emerald-150/70 shadow-2xs",
                  selectedIconBg: "bg-emerald-700 text-white shadow-xs",
                  unselectedIconBg: "bg-emerald-200 text-emerald-950 border border-emerald-300",
                  badge: "bg-emerald-200 text-emerald-950 border border-emerald-400 font-black",
                  title: "text-emerald-950",
                  checkBg: "bg-emerald-600 text-white",
                },
                friendly: {
                  selectedBg:
                    "bg-gradient-to-br from-violet-200 via-purple-100 to-fuchsia-200 border-violet-600 ring-4 ring-violet-500/30 shadow-md",
                  unselectedBg:
                    "bg-gradient-to-br from-violet-100/80 via-purple-50 to-violet-100/60 border-violet-300 hover:border-violet-600 hover:bg-violet-150/70 shadow-2xs",
                  selectedIconBg: "bg-violet-700 text-white shadow-xs",
                  unselectedIconBg: "bg-violet-200 text-violet-950 border border-violet-300",
                  badge: "bg-violet-200 text-violet-950 border border-violet-400 font-black",
                  title: "text-violet-950",
                  checkBg: "bg-violet-600 text-white",
                },
                warm_humor: {
                  selectedBg:
                    "bg-gradient-to-br from-amber-200 via-amber-100 to-orange-200 border-amber-600 ring-4 ring-amber-500/30 shadow-md",
                  unselectedBg:
                    "bg-gradient-to-br from-amber-100/80 via-orange-50 to-amber-100/60 border-amber-300 hover:border-amber-600 hover:bg-amber-150/70 shadow-2xs",
                  selectedIconBg: "bg-amber-700 text-white shadow-xs",
                  unselectedIconBg: "bg-amber-200 text-amber-950 border border-amber-300",
                  badge: "bg-amber-200 text-amber-950 border border-amber-400 font-black",
                  title: "text-amber-950",
                  checkBg: "bg-amber-600 text-white",
                },
              }[persona.id as "pedagogical" | "positive" | "friendly" | "warm_humor"] || {
                selectedBg: "bg-blue-200 border-blue-600 ring-4 ring-blue-500/30",
                unselectedBg: "bg-slate-100 border-slate-300 hover:border-blue-400",
                selectedIconBg: "bg-blue-700 text-white",
                unselectedIconBg: "bg-blue-200 text-blue-950",
                badge: "bg-blue-200 text-blue-950 border border-blue-400 font-black",
                title: "text-slate-950",
                checkBg: "bg-blue-600 text-white",
              };

              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => setSelectedPersona(persona.id)}
                  className={`text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer space-y-2 relative overflow-hidden ${
                    isSelected ? colorConfig.selectedBg : colorConfig.unselectedBg
                  }`}
                >
                  {isSelected && (
                    <div
                      className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full ${colorConfig.checkBg} flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-white`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-1.5 pr-6">
                      <div
                        className={`p-1.5 rounded-xl transition-colors ${
                          isSelected ? colorConfig.selectedIconBg : colorConfig.unselectedIconBg
                        }`}
                      >
                        {persona.id === "pedagogical" && <Landmark className="w-4 h-4" />}
                        {persona.id === "positive" && <SunMedium className="w-4 h-4" />}
                        {persona.id === "friendly" && <MessageCircleHeart className="w-4 h-4" />}
                        {persona.id === "warm_humor" && <Coffee className="w-4 h-4" />}
                      </div>
                      <h5 className={`font-black text-xs leading-tight ${colorConfig.title}`}>
                        {persona.title}
                      </h5>
                    </div>

                    <span
                      className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md mb-1.5 shadow-2xs ${colorConfig.badge}`}
                    >
                      {persona.badge}
                    </span>

                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
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
              className="p-4 rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-150/90 via-sky-100/90 to-blue-200/80 hover:border-blue-700 hover:from-blue-200 hover:to-sky-200 hover:shadow-md transition-all flex flex-col justify-between text-left cursor-pointer group space-y-2.5 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-700 text-white group-hover:bg-blue-800 transition-colors shadow-xs">
                      <ListChecks className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-950 bg-blue-200 px-2 py-0.5 rounded-md border border-blue-300">
                      KIỂU 1 • 0 GIÂY
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-950 bg-emerald-200 px-2 py-0.5 rounded-md border border-emerald-400">
                    ⚡ Nhanh gọn
                  </span>
                </div>

                <h4 className="text-sm font-black text-blue-950 group-hover:text-blue-900 transition-colors">
                  Tổng Hợp Nhanh Theo Tích Chọn
                </h4>
                <p className="text-[11px] text-slate-800 font-medium leading-relaxed mt-1">
                  Trích xuất trực diện các tiêu chí đã chọn thành gạch đầu dòng rõ ràng, kèm ghi chú lỗi sai.
                </p>
              </div>

              <div className="pt-2 border-t border-blue-300 flex items-center justify-between w-full text-xs font-black text-blue-950">
                <span>Tạo nhận xét nhanh</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-blue-700" />
              </div>
            </button>

            {/* KIỂU 2: AI VIẾT LẠI SÚC TÍCH & MƯỢT MÀ */}
            <button
              type="button"
              onClick={handleGenerateClassAI}
              disabled={aiGenerating}
              className="p-4 rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-150/90 via-amber-100/90 to-orange-150/80 hover:border-amber-700 hover:from-amber-200 hover:to-orange-200 hover:shadow-md transition-all flex flex-col justify-between text-left cursor-pointer group space-y-2.5 relative overflow-hidden shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-700 text-white group-hover:bg-amber-800 transition-colors shadow-xs">
                      {aiGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 bg-amber-200 px-2 py-0.5 rounded-md border border-amber-400">
                      KIỂU 2 • AI GEMINI
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-amber-950 bg-amber-200 px-2 py-0.5 rounded-md border border-amber-400">
                    ✨ Súc tích
                  </span>
                </div>

                <h4 className="text-sm font-black text-amber-950 group-hover:text-amber-900 transition-colors">
                  AI Viết Lại Súc Tích (5-8 Dòng)
                </h4>
                <p className="text-[11px] text-slate-800 font-medium leading-relaxed mt-1">
                  AI cô đọng lại thành 5-8 dòng ngắn gọn, giàu cảm xúc theo văn phong <strong>{currentPersonaObj.title}</strong>.
                </p>
              </div>

              <div className="pt-2 border-t border-amber-300 flex items-center justify-between w-full text-xs font-black text-amber-950">
                <span>{aiGenerating ? "Đang viết lại..." : "Viết lại với AI Gemini"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-800" />
              </div>
            </button>

            {/* KIỂU 3: AI TỔNG HỢP ĐẦY ĐỦ / TOÀN DIỆN & TRUYỀN CẢM HỨNG */}
            <button
              type="button"
              onClick={handleGenerateDetailedFeedback}
              disabled={aiDetailedGenerating || aiGenerating}
              className="p-4 rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-150/90 via-teal-100/90 to-green-150/80 hover:border-emerald-700 hover:from-emerald-200 hover:to-teal-200 hover:shadow-md transition-all flex flex-col justify-between text-left cursor-pointer group space-y-2.5 relative overflow-hidden shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-700 text-white group-hover:bg-emerald-800 transition-colors shadow-xs">
                      {aiDetailedGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 bg-emerald-200 px-2 py-0.5 rounded-md border border-emerald-400">
                      KIỂU 3 • AI TOÀN DIỆN
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-950 bg-emerald-200 px-2 py-0.5 rounded-md border border-emerald-400">
                    🌟 Truyền cảm hứng
                  </span>
                </div>

                <h4 className="text-sm font-black text-emerald-950 group-hover:text-emerald-900 transition-colors">
                  AI Báo Cáo Toàn Diện & Truyền Cảm Hứng
                </h4>
                <p className="text-[11px] text-slate-800 font-medium leading-relaxed mt-1">
                  AI tổng hợp đầy đủ bài bản, văn phong thân thiện, khích lệ và truyền cảm hứng theo <strong>{currentPersonaObj.title}</strong>.
                </p>
              </div>

              <div className="pt-2 border-t border-emerald-300 flex items-center justify-between w-full text-xs font-black text-emerald-950">
                <span>{aiDetailedGenerating ? "AI đang soạn báo cáo..." : "Tạo báo cáo toàn diện với AI"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-emerald-800" />
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
