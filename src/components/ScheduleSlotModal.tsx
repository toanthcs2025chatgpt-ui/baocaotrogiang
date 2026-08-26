import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  School,
  UserCheck,
  MapPin,
  ListOrdered,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Sun,
  SunDim,
  Moon,
  Sparkles,
  Trash2,
  Save,
  ArrowRight,
  Edit3,
  Check,
  Eye,
  Layers,
  CalendarDays,
  Tag,
  CheckCircle,
  Clock3,
} from "lucide-react";
import {
  TimetableSlot,
  ShiftConfig,
  ClassItem,
  Assistant,
  User,
  ScheduleItemStatus,
  ShiftId,
} from "../types";

interface ScheduleSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Partial<TimetableSlot> | null;
  shiftConfigs: ShiftConfig[];
  classes: ClassItem[];
  assistants: Assistant[];
  currentUser: User;
  onSave: (slotData: TimetableSlot, applyToAllWeeks?: boolean) => void;
  onDelete?: (
    slotId: string,
    options?: { deleteFromMaster?: boolean; dayOfWeek?: number; shiftId?: ShiftId }
  ) => void;
  onCreateReportFromSlot?: (slot: TimetableSlot) => void;
  initialMode?: "view" | "edit";
}

const DAY_NAMES: Record<number, string> = {
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
  7: "Chủ Nhật",
};

export const ScheduleSlotModal: React.FC<ScheduleSlotModalProps> = ({
  isOpen,
  onClose,
  slot,
  shiftConfigs,
  classes,
  assistants,
  currentUser,
  onSave,
  onDelete,
  onCreateReportFromSlot,
  initialMode = "view",
}) => {
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [applyToAllWeeks, setApplyToAllWeeks] = useState<boolean>(true);

  const [formData, setFormData] = useState<Partial<TimetableSlot>>({
    date: "",
    dayOfWeek: 1,
    shiftId: "evening_1",
    classId: "",
    className: "",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "",
    assistantName: "",
    room: "",
    lessonTopic: "",
    lessonContent: "",
    progressNote: "",
    homework: "",
    homeworkDeadline: "",
    generalNotes: "",
    status: "upcoming",
  });

  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUser.role === "admin";

  useEffect(() => {
    if (isOpen && slot) {
      // If slot has existing id and lessonTopic or className, default to view mode unless explicitly created as new
      const isNewEmptySlot = !slot.className && !slot.lessonTopic;
      setMode(isNewEmptySlot ? "edit" : initialMode);
      setApplyToAllWeeks(true);

      setFormData({
        id: slot.id,
        date: slot.date || "",
        dayOfWeek: slot.dayOfWeek || 1,
        shiftId: slot.shiftId || "evening_1",
        classId: slot.classId || (classes.length > 0 ? classes[0].id : ""),
        className: slot.className || (classes.length > 0 ? classes[0].name : ""),
        teacherName: slot.teacherName || "Thầy Thắng (Chủ nhiệm)",
        assistantId:
          slot.assistantId ||
          (currentUser.role === "assistant" && currentUser.assistantId
            ? currentUser.assistantId
            : assistants.length > 0
            ? assistants[0].id
            : ""),
        assistantName:
          slot.assistantName ||
          (currentUser.role === "assistant"
            ? currentUser.name
            : assistants.length > 0
            ? assistants[0].name
            : ""),
        room: slot.room || (classes.length > 0 ? classes[0].room || "Phòng 301" : "Phòng 301"),
        lessonTopic: slot.lessonTopic || "",
        lessonContent: slot.lessonContent || "",
        progressNote: slot.progressNote || "",
        homework: slot.homework || "",
        homeworkDeadline: slot.homeworkDeadline || "",
        generalNotes: slot.generalNotes || "",
        status: slot.status || "upcoming",
        isRecurringMaster: slot.isRecurringMaster,
      });
      setError(null);
    }
  }, [isOpen, slot, classes, assistants, currentUser, initialMode]);

  if (!isOpen) return null;

  const currentShiftConfig = shiftConfigs.find((s) => s.id === formData.shiftId) || shiftConfigs[0];

  const handleClassChange = (classId: string) => {
    const foundClass = classes.find((c) => c.id === classId);
    if (foundClass) {
      setFormData((prev) => ({
        ...prev,
        classId: foundClass.id,
        className: foundClass.name,
        teacherName: foundClass.teacherName || prev.teacherName,
        room: foundClass.room || prev.room,
      }));
    } else {
      setFormData((prev) => ({ ...prev, classId, className: classId }));
    }
  };

  const handleAssistantChange = (assistantId: string) => {
    const found = assistants.find((a) => a.id === assistantId);
    setFormData((prev) => ({
      ...prev,
      assistantId,
      assistantName: found ? found.name : "",
    }));
  };

  const handleSave = () => {
    if (!formData.date) {
      setError("Vui lòng chọn ngày học!");
      return;
    }
    if (!formData.className?.trim()) {
      setError("Vui lòng chọn hoặc nhập tên Lớp học!");
      return;
    }
    if (!formData.lessonTopic?.trim()) {
      setError("Vui lòng nhập Tên bài học / Chuyên đề!");
      return;
    }

    const slotPayload: TimetableSlot = {
      id: formData.id || `slot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      date: formData.date,
      dayOfWeek: formData.dayOfWeek || 1,
      shiftId: (formData.shiftId as ShiftId) || "evening_1",
      classId: formData.classId,
      className: formData.className,
      teacherName: formData.teacherName || "Thầy Thắng (Chủ nhiệm)",
      assistantId: formData.assistantId,
      assistantName: formData.assistantName,
      room: formData.room || "Phòng học CLB",
      lessonTopic: formData.lessonTopic,
      lessonContent: formData.lessonContent,
      progressNote: formData.progressNote,
      homework: formData.homework,
      homeworkDeadline: formData.homeworkDeadline,
      generalNotes: formData.generalNotes,
      status: (formData.status as ScheduleItemStatus) || "upcoming",
      applyToAllWeeks,
    };

    onSave(slotPayload, applyToAllWeeks);
    onClose();
  };

  const quickProgressTemplates = [
    "Đã xong lý thuyết & chữa bài tập 1-4",
    "Đã học xong Dạng 1 (Cơ bản) và Dạng 2 (Nâng cao)",
    "Đã dạy xong toàn bộ chuyên đề; Chữa phiếu BTVN",
    "Đang luyện tập câu C hình; giải đáp thắc mắc",
    "Hoàn thành bài kiểm tra 15 phút đầu giờ và chữa đề",
  ];

  const getShiftPeriodStyle = (shiftId?: string) => {
    if (!shiftId) {
      return {
        banner: "bg-slate-900 text-white",
        badge: "bg-slate-100 text-slate-900 border-slate-300",
        icon: <Clock className="w-5 h-5 text-amber-400" />,
        label: "Ca học",
      };
    }
    if (shiftId.startsWith("morning")) {
      return {
        banner: "bg-amber-600 text-white",
        badge: "bg-amber-100 text-amber-950 border-amber-300",
        icon: <Sun className="w-5 h-5 text-amber-200" />,
        label: "Ca Sáng",
      };
    }
    if (shiftId.startsWith("afternoon")) {
      return {
        banner: "bg-sky-600 text-white",
        badge: "bg-sky-100 text-sky-950 border-sky-300",
        icon: <SunDim className="w-5 h-5 text-sky-200" />,
        label: "Ca Chiều",
      };
    }
    return {
      banner: "bg-indigo-700 text-white",
      badge: "bg-indigo-100 text-indigo-950 border-indigo-300",
      icon: <Moon className="w-5 h-5 text-indigo-200" />,
      label: "Ca Tối",
    };
  };

  const periodStyle = getShiftPeriodStyle(formData.shiftId);

  const getStatusInfo = (status?: ScheduleItemStatus) => {
    switch (status) {
      case "completed":
        return {
          label: "Đã hoàn thành",
          bg: "bg-emerald-100 text-emerald-950 border-2 border-emerald-400",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" />,
        };
      case "in_progress":
        return {
          label: "Đang diễn ra",
          bg: "bg-amber-100 text-amber-950 border-2 border-amber-400",
          icon: <Clock3 className="w-4 h-4 text-amber-700" />,
        };
      case "cancelled":
        return {
          label: "Tạm hoãn / Nghỉ",
          bg: "bg-rose-100 text-rose-950 border-2 border-rose-400",
          icon: <AlertCircle className="w-4 h-4 text-rose-700" />,
        };
      default:
        return {
          label: "Sắp diễn ra",
          bg: "bg-blue-100 text-blue-950 border-2 border-blue-400",
          icon: <Clock className="w-4 h-4 text-blue-700" />,
        };
    }
  };

  const statusInfo = getStatusInfo(formData.status as ScheduleItemStatus);

  // Format full Vietnamese date (e.g. 24/08/2026)
  const formatVNDateFull = (dateStr?: string) => {
    if (!dateStr) return "";
    const p = dateStr.split("-");
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return dateStr;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 w-full max-w-3xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Banner */}
        <div
          className={`px-5 py-4 ${periodStyle.banner} flex items-center justify-between border-b-2 border-slate-900/20 shadow-sm`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center font-black shadow-inner">
              {periodStyle.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10.5px] font-black uppercase tracking-wider">
                  {periodStyle.label} • {currentShiftConfig?.name}
                </span>
                <span className="text-xs font-mono font-bold opacity-90">
                  {currentShiftConfig?.startTime} – {currentShiftConfig?.endTime}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                {mode === "view"
                  ? "Chi Tiết & Phóng To Buổi Học"
                  : formData.id
                  ? "Chỉnh Sửa Thông Tin Buổi Học"
                  : "Thêm Ca Học Vào Thời Khóa Biểu"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Button if editing is permitted */}
            {formData.id && (
              <button
                type="button"
                onClick={() => setMode(mode === "view" ? "edit" : "view")}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title={mode === "view" ? "Chuyển sang sửa nội dung" : "Quay lại xem chi tiết"}
              >
                {mode === "view" ? (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Chỉnh sửa</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Xem chi tiết</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-900 text-sm">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-black flex items-center gap-2.5 shadow-xs">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW MODE: PHÓNG TO & HIỂN THỊ TOÀN BỘ THÔNG TIN CHI TIẾT */}
          {/* ======================================================== */}
          {mode === "view" ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* 1. Header Card: Class Name, Day/Date, Time, Status */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 border-2 border-slate-300 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase text-blue-900 tracking-wider">
                      Lớp học & Ca dạy
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
                      {formData.className || "Chưa có tên lớp"}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-2xs ${statusInfo.bg}`}
                    >
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </div>

                    {formData.isRecurringMaster && (
                      <span className="px-2.5 py-1.5 rounded-xl bg-indigo-100 text-indigo-950 border-2 border-indigo-300 font-black text-xs flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Lịch cố định năm</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-300 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-300">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Thời gian</div>
                    <div className="font-black text-slate-950">
                      {DAY_NAMES[formData.dayOfWeek || 1]}, {formatVNDateFull(formData.date)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-300">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Khung giờ</div>
                    <div className="font-black text-slate-950 font-mono">
                      {currentShiftConfig?.startTime} – {currentShiftConfig?.endTime}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-300">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Phòng học</div>
                    <div className="font-black text-slate-950 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{formData.room || "Phòng CLB"}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-300">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Trợ giảng</div>
                    <div className="font-black text-blue-900 truncate">
                      {formData.assistantName || "Thầy Thắng"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Main Lesson Topic & Progress Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-950 tracking-wider">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <span>Tên Bài Học / Chuyên Đề Giảng Dạy</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-950 leading-snug">
                    {formData.lessonTopic || "Chưa có tên bài học cụ thể"}
                  </div>
                </div>

                {/* Progress Note Box */}
                <div className="p-3 rounded-xl bg-white border-2 border-amber-400 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-amber-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Tiến Độ Đã Học Đến Phần Nào:
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 text-[10px] font-black">
                      Cập nhật thực tế
                    </span>
                  </div>
                  <div className="font-bold text-slate-950 text-sm leading-relaxed">
                    {formData.progressNote || "Chưa cập nhật tiến độ phần đã học."}
                  </div>
                </div>

                {/* Detailed Lesson Content (if available) */}
                {formData.lessonContent && (
                  <div className="p-3 rounded-xl bg-white/90 border border-amber-300 space-y-1">
                    <div className="text-[11px] font-black uppercase text-slate-700">
                      📝 Nội dung chi tiết bài giảng:
                    </div>
                    <div className="text-xs font-medium text-slate-800 whitespace-pre-line leading-relaxed">
                      {formData.lessonContent}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Homework & Submission Deadline */}
              <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5 tracking-wider">
                    <FileCheck className="w-4 h-4 text-blue-700" />
                    Bài Tập Về Nhà (BTVN) Đã Giao:
                  </span>
                  {formData.homeworkDeadline && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-200 text-blue-950 font-black text-[11px]">
                      Hạn nộp: {formatVNDateFull(formData.homeworkDeadline)}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-white border-2 border-blue-200 font-bold text-slate-950 text-sm">
                  {formData.homework || "Không giao thêm bài tập về nhà."}
                </div>
              </div>

              {/* 4. Personnel & Note Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 space-y-1">
                  <div className="font-black text-slate-500 uppercase text-[10px]">
                    👨‍🏫 Giáo viên phụ trách chính
                  </div>
                  <div className="font-black text-slate-900 text-sm">
                    {formData.teacherName || "Thầy Thắng (Chủ nhiệm)"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 space-y-1">
                  <div className="font-black text-slate-500 uppercase text-[10px]">
                    👩‍🏫 Trợ giảng đồng hành ca học
                  </div>
                  <div className="font-black text-slate-900 text-sm">
                    {formData.assistantName || "Chưa phân công"}
                  </div>
                </div>
              </div>

              {formData.generalNotes && (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 space-y-1 text-xs">
                  <div className="font-black text-slate-600 uppercase text-[10px]">
                    📌 Ghi chú & Nhắc nhở thêm
                  </div>
                  <div className="font-medium text-slate-800">{formData.generalNotes}</div>
                </div>
              )}
            </div>
          ) : (
            /* ======================================================== */
            /* EDIT MODE: CHỈNH SỬA / THÊM MỚI NỘI DUNG BUỔI HỌC */
            /* ======================================================== */
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Section 1: Thời gian & Ca học */}
              <div className="p-4 rounded-2xl bg-slate-100 border-2 border-slate-300 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-950 tracking-wider">
                  <Calendar className="w-4 h-4 text-blue-700" />
                  <span>1. Thời Gian & Ca Học</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Ngày học: <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        const d = new Date(newDate);
                        const day = d.getDay() === 0 ? 7 : d.getDay(); // 1=Mon...7=Sun
                        setFormData((prev) => ({ ...prev, date: newDate, dayOfWeek: day }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 font-bold text-slate-950 outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Khung ca học: <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formData.shiftId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          shiftId: e.target.value as ShiftId,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 font-bold text-slate-950 outline-hidden text-xs cursor-pointer"
                    >
                      {shiftConfigs.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name} ({sc.startTime} – {sc.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Lớp học & Nhân sự */}
              <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-300 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-950 tracking-wider">
                  <School className="w-4 h-4 text-blue-700" />
                  <span>2. Lớp Học & Nhân Sự Phụ Trách</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1">
                      Lớp học: <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formData.classId}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-blue-300 focus:border-blue-600 font-bold text-slate-950 outline-hidden text-xs"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.grade})
                        </option>
                      ))}
                      <option value="custom_other">+ Nhập lớp khác...</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1">
                      Phòng học:
                    </label>
                    <input
                      type="text"
                      value={formData.room || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, room: e.target.value }))}
                      placeholder="VD: Phòng 301 - Tầng 3"
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 font-bold text-slate-950 outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1">
                      Giáo viên giảng dạy:
                    </label>
                    <input
                      type="text"
                      value={formData.teacherName || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, teacherName: e.target.value }))
                      }
                      placeholder="Thầy Thắng (Chủ nhiệm)"
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 font-bold text-slate-950 outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1">
                      Trợ giảng phụ trách:
                    </label>
                    <select
                      value={formData.assistantId || ""}
                      onChange={(e) => handleAssistantChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 font-bold text-slate-950 outline-hidden text-xs"
                    >
                      <option value="">-- Chọn trợ giảng --</option>
                      {assistants.map((ast) => (
                        <option key={ast.id} value={ast.id}>
                          {ast.name} ({ast.phone || "Trợ giảng"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Bài học & Tiến độ */}
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-950 tracking-wider">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  <span>3. Tên Bài Học, Tiến Độ & BTVN</span>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-950 mb-1">
                    📖 Tên bài học / Chuyên đề: <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lessonTopic || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lessonTopic: e.target.value }))
                    }
                    placeholder="VD: Bất đẳng thức Cauchy & Kỹ thuật chọn điểm rơi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-amber-400 focus:border-amber-600 font-black text-slate-950 text-sm outline-hidden"
                  />
                </div>

                {/* Progress Note */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-950">
                      🎯 Đã học đến phần nào (Tiến độ thực tế):
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.progressNote || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, progressNote: e.target.value }))
                    }
                    placeholder="VD: Đã dạy xong Dạng 2, chữa bài tập 1-4; Bài 5,6 giao về nhà"
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 font-bold text-slate-950 outline-hidden text-xs"
                  />

                  {/* Quick suggestions */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Gợi ý:
                    </span>
                    {quickProgressTemplates.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, progressNote: t }))}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white hover:bg-amber-100 text-slate-800 border border-slate-300 hover:border-amber-400 transition-colors cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lesson Content */}
                <div>
                  <label className="block text-xs font-black text-slate-950 mb-1">
                    📝 Nội dung chi tiết bài giảng:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.lessonContent || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lessonContent: e.target.value }))
                    }
                    placeholder="1. Lý thuyết trọng tâm&#10;2. Ví dụ mẫu và phân dạng&#10;3. Bài tập rèn luyện tại lớp"
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 font-medium text-slate-950 outline-hidden text-xs"
                  />
                </div>

                {/* BTVN & Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-950 mb-1">
                      📚 Bài tập về nhà (BTVN):
                    </label>
                    <input
                      type="text"
                      value={formData.homework || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, homework: e.target.value }))
                      }
                      placeholder="VD: Làm bài 4, 5, 6 Phiếu Chuyên Đề 05"
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 font-bold text-slate-950 outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-950 mb-1">
                      ⏰ Hạn nộp:
                    </label>
                    <input
                      type="date"
                      value={formData.homeworkDeadline || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, homeworkDeadline: e.target.value }))
                      }
                      className="w-full px-2.5 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-600 font-bold text-slate-950 outline-hidden text-xs"
                    />
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-950 mb-1">
                    🚦 Trạng thái buổi học:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "upcoming", label: "Sắp diễn ra", color: "border-blue-400 bg-blue-100 text-blue-950" },
                      { id: "in_progress", label: "Đang diễn ra", color: "border-amber-400 bg-amber-100 text-amber-950" },
                      { id: "completed", label: "Đã hoàn thành", color: "border-emerald-400 bg-emerald-100 text-emerald-950" },
                      { id: "cancelled", label: "Tạm hoãn / Nghỉ", color: "border-rose-400 bg-rose-100 text-rose-950" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, status: st.id as ScheduleItemStatus }))
                        }
                        className={`py-1.5 px-2.5 rounded-xl border-2 font-black text-xs transition-all cursor-pointer text-center ${
                          formData.status === st.id
                            ? `${st.color} shadow-xs ring-2 ring-blue-600`
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 4: Cài đặt áp dụng toàn bộ năm học */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 border-2 border-indigo-300">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToAllWeeks}
                    onChange={(e) => setApplyToAllWeeks(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-2 border-indigo-400 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="font-black text-indigo-950 text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-700" />
                      Áp dụng cố định cho toàn bộ năm học (cho tất cả các tuần)
                    </span>
                    <p className="text-[11px] text-indigo-800 font-medium">
                      Khi tích chọn, ca học này sẽ trở thành lịch mẫu cố định hàng tuần cho cả năm,
                      tự động sao chép sang mọi tuần mới mà không cần thiết lập lại.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 bg-slate-100 border-t-2 border-slate-300 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {formData.id && onDelete && isAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Bạn có chắc chắn muốn xóa buổi học này khỏi Thời khóa biểu?")) {
                    onDelete(formData.id!, {
                      deleteFromMaster: formData.isRecurringMaster || applyToAllWeeks,
                      dayOfWeek: formData.dayOfWeek,
                      shiftId: formData.shiftId as ShiftId,
                    });
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-black text-xs border-2 border-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Xóa buổi học</span>
              </button>
            )}

            {formData.id && onCreateReportFromSlot && (
              <button
                type="button"
                onClick={() => {
                  onCreateReportFromSlot(formData as TimetableSlot);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Tự động điền dữ liệu buổi học này vào Báo Cáo Buổi Học"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Lập Báo Cáo Buổi Học</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mode === "view" ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border-2 border-slate-300 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Chỉnh Sửa Thông Tin</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.id) {
                      setMode("view");
                    } else {
                      onClose();
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border-2 border-slate-300 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  {formData.id ? "Quay lại xem chi tiết" : "Hủy"}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Buổi Học</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
