import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Settings,
  Copy,
  FileSpreadsheet,
  Printer,
  Sun,
  SunDim,
  Moon,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  School,
  UserCheck,
  MapPin,
  HelpCircle,
  Filter,
  Search,
  Check,
  RotateCcw,
  Edit3,
  Trash2,
  ArrowRight,
  Info,
  CalendarDays,
  Layers,
  Sparkle,
  Maximize2,
  History,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  TimetableSlot,
  ShiftConfig,
  TimetableSettings,
  ClassItem,
  Assistant,
  User,
  ShiftPeriod,
  ShiftId,
  ScheduleItemStatus,
  MasterTimetableSlot,
} from "../types";
import { storageService, DEFAULT_SHIFT_CONFIGS } from "../services/storage";
import { ShiftSettingsModal } from "./ShiftSettingsModal";
import { ScheduleSlotModal } from "./ScheduleSlotModal";
import { TeachingHistorySection } from "./TeachingHistorySection";

interface ScheduleViewProps {
  currentUser: User;
  onNavigateCreateReport?: (initialData: {
    className?: string;
    reportDate?: string;
    reportShift?: string;
    lessonTopic?: string;
    lessonContent?: string;
    homeworkAssigned?: string;
  }) => void;
}

// Day of week labels in Vietnamese (1 = Thứ Hai ... 7 = Chủ Nhật)
const DAY_LABELS = [
  { dayOfWeek: 1, name: "Thứ Hai", shortName: "Thứ 2" },
  { dayOfWeek: 2, name: "Thứ Ba", shortName: "Thứ 3" },
  { dayOfWeek: 3, name: "Thứ Tư", shortName: "Thứ 4" },
  { dayOfWeek: 4, name: "Thứ Năm", shortName: "Thứ 5" },
  { dayOfWeek: 5, name: "Thứ Sáu", shortName: "Thứ 6" },
  { dayOfWeek: 6, name: "Thứ Bảy", shortName: "Thứ 7" },
  { dayOfWeek: 7, name: "Chủ Nhật", shortName: "Chủ Nhật" },
];

// Helper to format Date to YYYY-MM-DD
function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Helper to format Vietnamese date: DD/MM
function formatVNShort(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

// Helper to get Monday of the week for a given date
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  currentUser,
  onNavigateCreateReport,
}) => {
  // Current selected reference date (default: today)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Data states
  const [timetableSettings, setTimetableSettings] = useState<TimetableSettings>(() =>
    storageService.getTimetableSettings()
  );
  const [allSlots, setAllSlots] = useState<TimetableSlot[]>(() =>
    storageService.getTimetableSlots()
  );
  const [classes, setClasses] = useState<ClassItem[]>(() =>
    storageService.getClasses()
  );
  const [assistants, setAssistants] = useState<Assistant[]>(() =>
    storageService.getAssistants()
  );

  // Filter states
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Modals
  const [isShiftSettingsOpen, setIsShiftSettingsOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Partial<TimetableSlot> | null>(null);
  const [modalInitialMode, setModalInitialMode] = useState<"view" | "edit">("view");
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "info"; msg: string } | null>(
    null
  );

  const showToast = (msg: string, type: "success" | "info" = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const isAdmin = currentUser.role === "admin";

  // Reload data when component mounts or storage changes
  const reloadData = () => {
    setTimetableSettings(storageService.getTimetableSettings());
    setAllSlots(storageService.getTimetableSlots());
    setClasses(storageService.getClasses());
    setAssistants(storageService.getAssistants());
  };

  // Calculate 7 dates of current week (Mon -> Sun)
  const weekDates = useMemo(() => {
    const monday = getMonday(selectedDate);
    const dates: Array<{
      dayOfWeek: number;
      dateStr: string;
      label: string;
      shortName: string;
      isToday: boolean;
    }> = [];
    const todayStr = formatDate(new Date());

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatDate(d);
      const info = DAY_LABELS[i];
      dates.push({
        dayOfWeek: info.dayOfWeek,
        dateStr,
        label: info.name,
        shortName: info.shortName,
        isToday: dateStr === todayStr,
      });
    }
    return dates;
  }, [selectedDate]);

  // Week range label (e.g., "24/08/2026 – 30/08/2026")
  const weekRangeLabel = useMemo(() => {
    if (weekDates.length === 0) return "";
    const start = weekDates[0].dateStr;
    const end = weekDates[6].dateStr;
    const startParts = start.split("-");
    const endParts = end.split("-");
    return `Từ ${startParts[2]}/${startParts[1]}/${startParts[0]} đến ${endParts[2]}/${endParts[1]}/${endParts[0]}`;
  }, [weekDates]);

  // Navigate weeks
  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  };

  const handleCurrentWeek = () => {
    setSelectedDate(new Date());
  };

  // Shifts from settings or fallback
  const shifts: ShiftConfig[] = useMemo(() => {
    if (
      timetableSettings.shifts &&
      Array.isArray(timetableSettings.shifts) &&
      timetableSettings.shifts.length === 6
    ) {
      return timetableSettings.shifts;
    }
    return DEFAULT_SHIFT_CONFIGS;
  }, [timetableSettings]);

  // Retrieve Effective Slots for the Selected Week (Inherits Master Recurring Schedule for all weeks automatically!)
  const effectiveWeekSlots = useMemo(() => {
    const rawEffective = storageService.getEffectiveSlotsForWeek(
      weekDates.map((w) => ({ dayOfWeek: w.dayOfWeek, dateStr: w.dateStr }))
    );

    return rawEffective.filter((slot) => {
      // Class filter
      if (selectedClassFilter !== "all" && slot.classId !== selectedClassFilter) {
        return false;
      }

      // Period filter
      if (selectedPeriodFilter !== "all") {
        const sc = shifts.find((s) => s.id === slot.shiftId);
        if (sc && sc.period !== selectedPeriodFilter) return false;
      }

      // Search keyword (class, lesson topic, teacher, assistant)
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchClass = slot.className.toLowerCase().includes(kw);
        const matchTopic = slot.lessonTopic.toLowerCase().includes(kw);
        const matchContent = (slot.lessonContent || "").toLowerCase().includes(kw);
        const matchProgress = (slot.progressNote || "").toLowerCase().includes(kw);
        const matchTeacher = (slot.teacherName || "").toLowerCase().includes(kw);
        const matchAssistant = (slot.assistantName || "").toLowerCase().includes(kw);
        if (
          !matchClass &&
          !matchTopic &&
          !matchContent &&
          !matchProgress &&
          !matchTeacher &&
          !matchAssistant
        ) {
          return false;
        }
      }

      return true;
    });
  }, [weekDates, allSlots, selectedClassFilter, selectedPeriodFilter, searchKeyword, shifts]);

  // Map slots by `${date}_${shiftId}` for instant cell lookup
  const slotMap = useMemo(() => {
    const map = new Map<string, TimetableSlot>();
    for (const slot of effectiveWeekSlots) {
      map.set(`${slot.date}_${slot.shiftId}`, slot);
    }
    return map;
  }, [effectiveWeekSlots]);

  // Handle Save Shift Settings
  const handleSaveShiftSettings = (newSettings: TimetableSettings) => {
    storageService.saveTimetableSettings(newSettings);
    setTimetableSettings(newSettings);
    showToast("Đã lưu cài đặt khung giờ ca học thành công!");
  };

  // Handle Save Slot
  const handleSaveSlot = (slotData: TimetableSlot, applyToAllWeeks: boolean = true) => {
    const saved = storageService.saveTimetableSlot(slotData, applyToAllWeeks);
    reloadData();
    if (applyToAllWeeks !== false) {
      showToast(`Đã lưu & tự động đồng bộ lớp ${saved.className} cho tất cả các tuần tiếp theo!`);
    } else {
      showToast(`Đã cập nhật ca học lớp ${saved.className} tuần này!`);
    }
  };

  // Handle Delete Slot
  const handleDeleteSlot = (
    slotId: string,
    options?: { deleteFromMaster?: boolean; dayOfWeek?: number; shiftId?: ShiftId }
  ) => {
    storageService.deleteTimetableSlot(slotId, {
      deleteFromMaster: options?.deleteFromMaster !== false,
      dayOfWeek: options?.dayOfWeek,
      shiftId: options?.shiftId,
    });
    reloadData();
    showToast("Đã xóa ca học và đồng bộ lịch các tuần tiếp theo!", "info");
  };

  // Handle Setting Current Week as Master Recurring Schedule
  const handleSaveCurrentWeekAsMaster = () => {
    // Get ALL slots for the current selected week (unfiltered)
    const allCurrentWeekSlots = storageService.getEffectiveSlotsForWeek(
      weekDates.map((w) => ({ dayOfWeek: w.dayOfWeek, dateStr: w.dateStr }))
    );

    if (allCurrentWeekSlots.length === 0) {
      showToast("Chưa có buổi học nào trong tuần này để lưu làm mẫu!", "info");
      return;
    }

    const count = allCurrentWeekSlots.length;
    const currentWeekEndDate = weekDates[6]?.dateStr;
    storageService.setWeekAsMasterTemplate(allCurrentWeekSlots, currentWeekEndDate);
    reloadData();
    showToast(
      `Đã tự động đồng bộ & xây dựng ${count} ca học của tuần này cho toàn bộ các tuần tiếp theo trong năm học!`
    );
  };

  // Handle Copy Week Schedule to next week
  const handleCopyWeekToNext = () => {
    const currentMonday = getMonday(selectedDate);
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(nextMonday.getDate() + 7);

    const sourceDates: string[] = [];
    const targetDates: string[] = [];

    for (let i = 0; i < 7; i++) {
      const srcD = new Date(currentMonday);
      srcD.setDate(srcD.getDate() + i);
      sourceDates.push(formatDate(srcD));

      const tgtD = new Date(nextMonday);
      tgtD.setDate(tgtD.getDate() + i);
      targetDates.push(formatDate(tgtD));
    }

    // First ensure current week is master template
    const allCurrentWeekSlots = storageService.getEffectiveSlotsForWeek(
      weekDates.map((w) => ({ dayOfWeek: w.dayOfWeek, dateStr: w.dateStr }))
    );
    if (allCurrentWeekSlots.length > 0) {
      storageService.setWeekAsMasterTemplate(allCurrentWeekSlots, weekDates[6]?.dateStr);
    }

    const copied = storageService.copyWeekSchedule(sourceDates, targetDates);
    reloadData();

    // Advance to next week to view copied schedule
    setSelectedDate(nextMonday);
    showToast(
      `Đã đồng bộ thành công ${copied.length || allCurrentWeekSlots.length} ca học sang tuần tiếp theo!`
    );
  };

  // Handle Quick Create Report from Slot
  const handleCreateReportFromSlot = (slot: TimetableSlot) => {
    const shiftConfig = shifts.find((s) => s.id === slot.shiftId);
    const shiftLabel = shiftConfig
      ? `${shiftConfig.name} (${shiftConfig.startTime} – ${shiftConfig.endTime})`
      : slot.shiftId;

    if (onNavigateCreateReport) {
      onNavigateCreateReport({
        className: slot.className,
        reportDate: slot.date,
        reportShift: shiftLabel,
        lessonTopic: slot.lessonTopic,
        lessonContent: slot.lessonContent,
        homeworkAssigned: slot.homework,
      });
    }
  };

  // Export timetable to Excel (.xlsx)
  const handleExportExcel = () => {
    const exportData: any[] = [];

    // Header metadata
    exportData.push(["THỜI KHÓA BIỂU & TIẾN ĐỘ BÀI HỌC - CLB TOÁN THẦY THẮNG"]);
    exportData.push([`Khoảng thời gian: ${weekRangeLabel}`]);
    exportData.push([]);

    // Table headers
    const headers = [
      "Ca Học",
      "Khung Giờ",
      ...weekDates.map((w) => `${w.label} (${formatVNShort(w.dateStr)})`),
    ];
    exportData.push(headers);

    for (const shift of shifts) {
      const row: any[] = [shift.name, `${shift.startTime} – ${shift.endTime}`];
      for (const w of weekDates) {
        const slot = slotMap.get(`${w.dateStr}_${shift.id}`);
        if (slot) {
          const lines = [
            `Lớp: ${slot.className}`,
            `Phòng: ${slot.room || "-"}`,
            `GV: ${slot.teacherName || "-"} | TG: ${slot.assistantName || "-"}`,
            `Bài học: ${slot.lessonTopic}`,
            slot.progressNote ? `Đã học: ${slot.progressNote}` : "",
            slot.homework ? `BTVN: ${slot.homework}` : "",
          ].filter(Boolean);
          row.push(lines.join("\n"));
        } else {
          row.push("-");
        }
      }
      exportData.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    // Column widths
    ws["!cols"] = [
      { wch: 16 },
      { wch: 18 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ThoiKhoaBieu");
    XLSX.writeFile(
      wb,
      `ThoiKhoaBieu_Tuan_${weekDates[0]?.dateStr || "Export"}.xlsx`
    );
    showToast("Đã xuất file Excel Thời khóa biểu tuần thành công!");
  };

  // Period styling with HIGH CONTRAST & DISTINCT PALETTE
  const getPeriodStyle = (period: ShiftPeriod) => {
    switch (period) {
      case "morning":
        return {
          banner: "bg-amber-600 text-white font-black",
          badge: "bg-amber-100 text-amber-950 border border-amber-300",
          headerCell: "bg-amber-50 border-r-2 border-amber-300 text-amber-950",
          cellActiveBg:
            "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white border-2 border-amber-800 shadow-md hover:shadow-lg hover:brightness-105 transition-all",
          cellDot: "bg-amber-300",
          icon: <Sun className="w-4 h-4 text-amber-200" />,
          title: "Ca Sáng",
        };
      case "afternoon":
        return {
          banner: "bg-sky-600 text-white font-black",
          badge: "bg-sky-100 text-sky-950 border border-sky-300",
          headerCell: "bg-sky-50 border-r-2 border-sky-300 text-sky-950",
          cellActiveBg:
            "bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 text-white border-2 border-sky-900 shadow-md hover:shadow-lg hover:brightness-105 transition-all",
          cellDot: "bg-sky-300",
          icon: <SunDim className="w-4 h-4 text-sky-200" />,
          title: "Ca Chiều",
        };
      case "evening":
        return {
          banner: "bg-indigo-700 text-white font-black",
          badge: "bg-indigo-100 text-indigo-950 border border-indigo-300",
          headerCell: "bg-indigo-50 border-r-2 border-indigo-300 text-indigo-950",
          cellActiveBg:
            "bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white border-2 border-indigo-950 shadow-md hover:shadow-lg hover:brightness-105 transition-all",
          cellDot: "bg-indigo-300",
          icon: <Moon className="w-4 h-4 text-indigo-200" />,
          title: "Ca Tối",
        };
    }
  };

  // Group shifts by period: Sáng (2 ca), Chiều (2 ca), Tối (2 ca)
  const groupedShifts = useMemo(() => {
    const morning = shifts.filter((s) => s.period === "morning");
    const afternoon = shifts.filter((s) => s.period === "afternoon");
    const evening = shifts.filter((s) => s.period === "evening");
    return [
      { period: "morning" as ShiftPeriod, label: "🌅 BUỔI SÁNG (2 CA)", shifts: morning },
      { period: "afternoon" as ShiftPeriod, label: "☀️ BUỔI CHIỀU (2 CA)", shifts: afternoon },
      { period: "evening" as ShiftPeriod, label: "🌙 BUỔI TỐI (2 CA)", shifts: evening },
    ];
  }, [shifts]);

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border-2 flex items-center gap-2.5 text-xs font-black ${
              toastMsg.type === "success"
                ? "bg-emerald-50 border-emerald-400 text-emerald-950"
                : "bg-blue-50 border-blue-400 text-blue-950"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg.msg}</span>
          </div>
        </div>
      )}

      {/* Main Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-300 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Title & Description */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-xs">
                CLB Toán Thầy Thắng
              </span>
              <span className="px-3 py-1 rounded-xl bg-indigo-100 text-indigo-950 border border-indigo-300 font-black text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-700" />
                Lịch Cố Định Cả Năm • Tự Động Sao Chép Hàng Tuần
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <span>📅 Thời Khóa Biểu & Tiến Độ Giảng Dạy</span>
            </h1>
            <p className="text-xs text-slate-600 font-medium max-w-2xl">
              Thời khóa biểu cố định cả năm học (6 ca/ngày). Nhấn vào từng ô để <strong>phóng to xem đầy đủ thông tin</strong> (bài học, tiến độ, BTVN, giáo viên, trợ giảng).
            </p>
          </div>

          {/* Action Buttons Top */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShiftSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-black text-xs border-2 border-slate-300 hover:border-blue-500 transition-all shadow-xs cursor-pointer"
              title="Cài đặt giờ vào ca và kết thúc ca học"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Cài Đặt Giờ Ca</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={handleCopyWeekToNext}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 font-black text-xs border-2 border-blue-300 hover:border-blue-500 transition-all shadow-xs cursor-pointer"
                title="Sao chép toàn bộ lịch tuần này sang tuần tiếp theo và chuyển sang tuần đó"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-700" />
                <span>⚡ Đồng Bộ Sang Tuần Kế Tiếp</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={handleSaveCurrentWeekAsMaster}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-black text-xs border-2 border-indigo-300 hover:border-indigo-500 transition-all shadow-xs cursor-pointer"
                title="Lưu tất cả ca học hiện tại làm mẫu cố định cho cả năm và tự động đồng bộ mọi tuần tiếp theo"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-700" />
                <span>Lưu Lịch Cố Định Năm</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("teaching-history-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-black text-xs border-2 border-indigo-200 hover:border-indigo-400 transition-all shadow-xs cursor-pointer"
              title="Cuộn nhanh xuống xem Lịch sử dạy học chi tiết theo từng tháng"
            >
              <History className="w-3.5 h-3.5 text-indigo-700" />
              <span>Sổ Dạy Học Tháng</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setEditingSlot({
                    date: weekDates[0]?.dateStr || formatDate(new Date()),
                    dayOfWeek: 1,
                    shiftId: "evening_1",
                    status: "upcoming",
                  });
                  setModalInitialMode("edit");
                  setIsSlotModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Buổi Học</span>
              </button>
            )}
          </div>
        </div>

        {/* Week Navigator Bar */}
        <div className="mt-4 pt-4 border-t-2 border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Week Selection Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-300">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-blue-900 transition-colors cursor-pointer"
                title="Tuần trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCurrentWeek}
                className="px-3 py-1 rounded-lg bg-white text-blue-950 font-black text-xs shadow-2xs hover:bg-blue-50 transition-colors cursor-pointer border border-slate-200"
              >
                Tuần Này
              </button>

              <button
                type="button"
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-blue-900 transition-colors cursor-pointer"
                title="Tuần tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Date picker to jump to any week */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={formatDate(selectedDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(new Date(e.target.value));
                  }
                }}
                className="px-2.5 py-1 rounded-xl bg-white border-2 border-slate-300 hover:border-blue-400 font-bold text-xs text-slate-800 outline-hidden cursor-pointer"
                title="Chọn ngày để chuyển đến tuần tương ứng"
              />

              <div className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 font-black text-xs flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                <span>{weekRangeLabel}</span>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Class Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-black text-slate-500 uppercase">Lớp:</span>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-white border-2 border-slate-200 font-bold text-xs text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả lớp</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Period Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-black text-slate-500 uppercase">Buổi:</span>
              <select
                value={selectedPeriodFilter}
                onChange={(e) => setSelectedPeriodFilter(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-white border-2 border-slate-200 font-bold text-xs text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả buổi</option>
                <option value="morning">Chỉ Ca Sáng</option>
                <option value="afternoon">Chỉ Ca Chiều</option>
                <option value="evening">Chỉ Ca Tối</option>
              </select>
            </div>

            {/* Keyword search */}
            <div className="relative min-w-[150px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm lớp, bài học..."
                className="w-full pl-7 pr-2.5 py-1 rounded-xl bg-white border-2 border-slate-200 font-bold text-xs text-slate-800 outline-hidden focus:border-blue-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Distinction Color Legend Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
        <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black">
              <Sun className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-black text-amber-950">2 CA SÁNG: </span>
              <span className="text-amber-900 font-bold">
                {shifts.filter((s) => s.period === "morning").map((s) => `${s.name} (${s.startTime}–${s.endTime})`).join(" • ")}
              </span>
            </div>
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-sky-50 border-2 border-sky-300 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black">
              <SunDim className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-black text-sky-950">2 CA CHIỀU: </span>
              <span className="text-sky-900 font-bold">
                {shifts.filter((s) => s.period === "afternoon").map((s) => `${s.name} (${s.startTime}–${s.endTime})`).join(" • ")}
              </span>
            </div>
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-indigo-50 border-2 border-indigo-300 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-black">
              <Moon className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-black text-indigo-950">2 CA TỐI: </span>
              <span className="text-indigo-900 font-bold">
                {shifts.filter((s) => s.period === "evening").map((s) => `${s.name} (${s.startTime}–${s.endTime})`).join(" • ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN TIMETABLE GRID TABLE - FIT-TO-SCREEN (T2 ĐẾN CN TRONG 1 KHUNG HÌNH) */}
      {/* MỖI Ô CHỈ HIỆN TÊN LỚP HỌC, NHẤN VÀO SẼ PHÓNG TO VÀ HIỆN ĐẦY ĐỦ THÔNG TIN */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-md overflow-hidden">
        <div className="w-full overflow-x-auto lg:overflow-x-visible">
          <table className="w-full table-fixed border-collapse text-left">
            {/* Column Width Definitions: 1 Header Column (12%) + 7 Day Columns (12.57% each) */}
            <colgroup>
              <col className="w-[12%] min-w-[100px]" />
              <col className="w-[12.57%]" />
              <col className="w-[12.57%]" />
              <col className="w-[12.57%]" />
              <col className="w-[12.57%]" />
              <col className="w-[12.57%]" />
              <col className="w-[12.57%]" />
              <col className="w-[12.57%]" />
            </colgroup>

            {/* Table Header: 7 Days of the Week */}
            <thead>
              <tr className="bg-slate-950 text-white border-b-2 border-slate-800">
                <th className="p-2.5 text-center font-black text-xs uppercase tracking-wider border-r-2 border-slate-800 bg-slate-950 text-amber-400">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ca / Giờ</span>
                  </div>
                </th>
                {weekDates.map((w) => (
                  <th
                    key={w.dateStr}
                    className={`p-2.5 text-center border-r border-slate-800 last:border-r-0 transition-colors ${
                      w.isToday ? "bg-blue-900 text-amber-300 ring-2 ring-amber-400 inset-0" : ""
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-black flex items-center justify-center gap-1">
                        <span>{w.shortName}</span>
                        {w.isToday && (
                          <span className="px-1 py-0.1 bg-amber-400 text-slate-950 text-[9px] font-black rounded uppercase">
                            Hôm nay
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[11px] font-bold font-mono ${
                          w.isToday ? "text-amber-300" : "text-slate-300"
                        }`}
                      >
                        {formatVNShort(w.dateStr)}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body grouped by Sáng (2 ca), Chiều (2 ca), Tối (2 ca) */}
            <tbody className="divide-y-2 divide-slate-300 bg-slate-100">
              {groupedShifts.map((group) => {
                const style = getPeriodStyle(group.period);
                return (
                  <React.Fragment key={group.period}>
                    {/* Period Divider Banner Row */}
                    <tr className="border-t-2 border-b-2 border-slate-400">
                      <td
                        colSpan={8}
                        className={`px-3 py-1.5 font-black text-xs uppercase tracking-wider shadow-xs ${style.banner}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {style.icon}
                            <span>{group.label}</span>
                          </div>
                          <span className="text-[10px] font-bold opacity-95 lowercase font-mono hidden sm:inline">
                            {group.shifts.map((s) => `${s.name} (${s.startTime}–${s.endTime})`).join("  |  ")}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Shifts in this period */}
                    {group.shifts.map((shift) => (
                      <tr
                        key={shift.id}
                        className="transition-colors border-b border-slate-300 bg-white"
                      >
                        {/* Shift Header Info Cell */}
                        <td
                          className={`p-2 border-r-2 border-slate-300 align-middle ${style.headerCell}`}
                        >
                          <div className="space-y-1 text-center">
                            <div className="font-black text-slate-950 text-xs truncate">
                              {shift.name}
                            </div>
                            <div className="px-1.5 py-0.5 rounded-lg bg-white border border-slate-400 font-black text-[11px] text-slate-950 font-mono shadow-2xs">
                              {shift.startTime}
                              <span className="text-slate-400 mx-0.5">–</span>
                              {shift.endTime}
                            </div>
                          </div>
                        </td>

                        {/* 7 Days Columns for this shift */}
                        {weekDates.map((w) => {
                          const slotKey = `${w.dateStr}_${shift.id}`;
                          const slot = slotMap.get(slotKey);

                          return (
                            <td
                              key={w.dateStr}
                              className={`p-1.5 border-r border-slate-300 last:border-r-0 align-middle transition-all ${
                                w.isToday ? "bg-amber-50/50" : "bg-white"
                              }`}
                            >
                              {slot ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSlot(slot);
                                    setModalInitialMode("view");
                                    setIsSlotModalOpen(true);
                                  }}
                                  className={`w-full min-h-[52px] px-2.5 py-2 rounded-2xl flex items-center justify-center text-center cursor-pointer group transition-all transform active:scale-98 ${style.cellActiveBg}`}
                                  title={`Nhấn để xem chi tiết buổi học: ${slot.className}`}
                                >
                                  {/* ONLY AND STRICTLY SHOW CLASS NAME */}
                                  <span className="font-black text-xs sm:text-[13px] leading-snug tracking-tight text-white line-clamp-2 px-0.5">
                                    {slot.className}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isAdmin) {
                                      setEditingSlot({
                                        date: w.dateStr,
                                        dayOfWeek: w.dayOfWeek,
                                        shiftId: shift.id,
                                        status: "upcoming",
                                      });
                                      setModalInitialMode("edit");
                                      setIsSlotModalOpen(true);
                                    }
                                  }}
                                  disabled={!isAdmin}
                                  className={`w-full min-h-[58px] rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-600 hover:bg-blue-50/60 flex flex-col items-center justify-center p-1 text-center transition-all group ${
                                    isAdmin ? "cursor-pointer" : "cursor-default"
                                  }`}
                                  title={isAdmin ? `+ Thêm ca học ${w.shortName} (${shift.name})` : "Trống"}
                                >
                                  {isAdmin ? (
                                    <div className="opacity-30 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-slate-600 group-hover:text-blue-900">
                                      <Plus className="w-3.5 h-3.5" />
                                      <span className="text-[10px] font-black">Thêm</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs font-bold text-slate-300">—</span>
                                  )}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-4 rounded-2xl bg-white border-2 border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            💡 <strong>Mẹo:</strong> Nhấn vào bất kỳ ô lớp học nào trên bảng để phóng to toàn màn hình, xem bài học, nội dung lý thuyết, bài tập về nhà và lập báo cáo buổi học.
          </span>
        </div>

        <div className="flex items-center gap-3 font-black text-slate-700 shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Ca Sáng
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
            Ca Chiều
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-700" />
            Ca Tối
          </span>
        </div>
      </div>

      {/* Teaching History & Monthly Session Records Section */}
      <TeachingHistorySection
        currentUser={currentUser}
        classes={classes}
        assistants={assistants}
        shifts={shifts}
        onNavigateCreateReport={onNavigateCreateReport}
        onOpenSlotDetail={(slot) => {
          setEditingSlot(slot);
          setModalInitialMode("view");
          setIsSlotModalOpen(true);
        }}
      />

      {/* Shift Settings Modal */}
      <ShiftSettingsModal
        isOpen={isShiftSettingsOpen}
        onClose={() => setIsShiftSettingsOpen(false)}
        currentSettings={timetableSettings}
        onSave={handleSaveShiftSettings}
      />

      {/* Schedule Slot Add/Edit/View Zoom Modal */}
      <ScheduleSlotModal
        isOpen={isSlotModalOpen}
        onClose={() => {
          setIsSlotModalOpen(false);
          setEditingSlot(null);
        }}
        slot={editingSlot}
        shiftConfigs={shifts}
        classes={classes}
        assistants={assistants}
        currentUser={currentUser}
        onSave={handleSaveSlot}
        onDelete={handleDeleteSlot}
        onCreateReportFromSlot={handleCreateReportFromSlot}
        initialMode={modalInitialMode}
      />
    </div>
  );
};
