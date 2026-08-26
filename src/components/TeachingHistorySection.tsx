import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Search,
  Filter,
  Users,
  School,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UserCheck,
  MapPin,
  HelpCircle,
  ArrowRight,
  Info,
  CalendarDays,
  Layers,
  History,
  Check,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  TimetableSlot,
  ShiftConfig,
  ClassItem,
  Assistant,
  User,
  Report,
} from "../types";
import { storageService } from "../services/storage";
import { ReportDetailModal } from "./ReportDetailModal";

interface TeachingHistorySectionProps {
  currentUser: User;
  classes: ClassItem[];
  assistants: Assistant[];
  shifts: ShiftConfig[];
  onNavigateCreateReport?: (initialData: {
    className?: string;
    reportDate?: string;
    reportShift?: string;
    lessonTopic?: string;
    lessonContent?: string;
    homeworkAssigned?: string;
  }) => void;
  onOpenSlotDetail?: (slot: TimetableSlot) => void;
}

// Format YYYY-MM to Vietnamese display: "Tháng MM/YYYY"
function formatMonthDisplay(yearMonth: string): string {
  if (!yearMonth) return "";
  const parts = yearMonth.split("-");
  if (parts.length === 2) {
    return `Tháng ${parts[1]}/${parts[0]}`;
  }
  return yearMonth;
}

// Format YYYY-MM-DD to "Thứ X, DD/MM/YYYY"
function formatFullDateVN(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dayName = days[d.getDay()];
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${dayName}, ${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export const TeachingHistorySection: React.FC<TeachingHistorySectionProps> = ({
  currentUser,
  classes,
  assistants,
  shifts,
  onNavigateCreateReport,
  onOpenSlotDetail,
}) => {
  // Current selected month: default to current month YYYY-MM (e.g. 2026-08)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  });

  // Filter states
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterReportStatus, setFilterReportStatus] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // State to view a specific report modal
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  // Expanded items state (accordion or toggle detail)
  const [expandedSlotIds, setExpandedSlotIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set(monthTeachingSessions.map((s) => s.id));
    setExpandedSlotIds(allIds);
  };

  const collapseAll = () => {
    setExpandedSlotIds(new Set());
  };

  // Quick month changes
  const handlePrevMonth = () => {
    const parts = selectedMonth.split("-");
    let y = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const parts = selectedMonth.split("-");
    let y = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, "0")}`);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${yyyy}-${mm}`);
  };

  // Combine Timetable Slots and Reports for the selected month
  const monthTeachingSessions = useMemo(() => {
    const allSlots = storageService.getTimetableSlots();
    const allReports = storageService.getReports();

    // Map reports by date + class or className
    const reportMap = new Map<string, Report>();
    for (const rep of allReports) {
      if (rep.date && rep.date.startsWith(selectedMonth)) {
        reportMap.set(`${rep.date}_${rep.className}`, rep);
        reportMap.set(`${rep.date}_${rep.classId}`, rep);
      }
    }

    // Filter slots for this month
    const slotsInMonth = allSlots.filter((slot) => {
      if (!slot.date) return false;
      return slot.date.startsWith(selectedMonth);
    });

    // Also check if there are reports in this month that might not have a slot, create a session
    const combinedSessions: Array<
      TimetableSlot & {
        report?: Report;
        hasReport: boolean;
      }
    > = [];

    const processedKeys = new Set<string>();

    for (const slot of slotsInMonth) {
      const normalizedClass = storageService.normalizeClassReference(slot.classId, slot.className);
      const rep =
        reportMap.get(`${slot.date}_${normalizedClass.className}`) ||
        reportMap.get(`${slot.date}_${slot.className}`) ||
        reportMap.get(`${slot.date}_${normalizedClass.classId}`) ||
        reportMap.get(`${slot.date}_${slot.classId}`);
      combinedSessions.push({
        ...slot,
        classId: normalizedClass.classId,
        className: normalizedClass.className,
        report: rep,
        hasReport: !!rep,
      });
      processedKeys.add(`${slot.date}_${normalizedClass.className}`);
      processedKeys.add(`${slot.date}_${slot.className}`);
    }

    // Add any orphan reports that didn't match an existing timetable slot
    for (const rep of allReports) {
      if (rep.date && rep.date.startsWith(selectedMonth)) {
        const normalizedClass = storageService.normalizeClassReference(rep.classId, rep.className);
        if (
          !processedKeys.has(`${rep.date}_${normalizedClass.className}`) &&
          !processedKeys.has(`${rep.date}_${rep.className}`)
        ) {
          combinedSessions.push({
            id: `rep_slot_${rep.id}`,
            date: rep.date,
            dayOfWeek: new Date(rep.date).getDay() === 0 ? 7 : new Date(rep.date).getDay(),
            shiftId: "evening_1",
            classId: normalizedClass.classId,
            className: normalizedClass.className,
            teacherName: rep.teacherName,
            assistantName: rep.assistantName,
            assistantId: rep.assistantId,
            room: "Phòng CLB",
            lessonTopic: rep.lessonContent.split("\n")[0] || "Buổi học theo lịch",
            lessonContent: rep.lessonContent,
            progressNote: "Đã có báo cáo buổi học hoàn chỉnh",
            homework: rep.homeworkAssigned || "",
            status: "completed",
            report: rep,
            hasReport: true,
          });
        }
      }
    }

    // Filter by Class
    let filtered = combinedSessions.filter((s) => {
      if (filterClass !== "all") {
        if (s.classId !== filterClass && !s.className.includes(filterClass)) {
          return false;
        }
      }

      // Filter by report status
      if (filterReportStatus === "has_report" && !s.hasReport) return false;
      if (filterReportStatus === "no_report" && s.hasReport) return false;
      if (filterReportStatus === "completed" && s.status !== "completed") return false;

      // Filter keyword
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchClass = (s.className || "").toLowerCase().includes(kw);
        const matchTopic = (s.lessonTopic || "").toLowerCase().includes(kw);
        const matchContent = (s.lessonContent || "").toLowerCase().includes(kw);
        const matchProgress = (s.progressNote || "").toLowerCase().includes(kw);
        const matchTeacher = (s.teacherName || "").toLowerCase().includes(kw);
        const matchAssistant = (s.assistantName || "").toLowerCase().includes(kw);
        const matchHomework = (s.homework || "").toLowerCase().includes(kw);
        if (
          !matchClass &&
          !matchTopic &&
          !matchContent &&
          !matchProgress &&
          !matchTeacher &&
          !matchAssistant &&
          !matchHomework
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [selectedMonth, filterClass, filterReportStatus, searchKeyword, sortOrder]);

  // Statistics for this month
  const monthStats = useMemo(() => {
    const totalSessions = monthTeachingSessions.length;
    const reportedSessions = monthTeachingSessions.filter((s) => s.hasReport).length;
    const uniqueClasses = new Set(monthTeachingSessions.map((s) => s.className)).size;
    const withHomework = monthTeachingSessions.filter((s) => !!s.homework).length;

    return {
      totalSessions,
      reportedSessions,
      uniqueClasses,
      withHomework,
      reportRate: totalSessions > 0 ? Math.round((reportedSessions / totalSessions) * 100) : 0,
    };
  }, [monthTeachingSessions]);

  // Export to Excel
  const handleExportMonthExcel = () => {
    const exportData: any[] = [];

    // Header metadata
    exportData.push([
      `SỔ THEO DÕI LỊCH SỬ DẠY HỌC & TIẾN ĐỘ BÀI GIẢNG – ${formatMonthDisplay(
        selectedMonth
      ).toUpperCase()}`,
    ]);
    exportData.push([`CLB Toán Thầy Thắng • Xuất ngày: ${new Date().toLocaleDateString("vi-VN")}`]);
    exportData.push([]);

    // Column Headers
    const headers = [
      "STT",
      "Ngày Dạy",
      "Thứ",
      "Ca Học",
      "Lớp Học",
      "Phòng",
      "Giáo Viên",
      "Trợ Giảng",
      "Chuyên Đề / Bài Học",
      "Nội Dung Chi Tiết",
      "Tiến Độ Đã Học",
      "Bài Tập Về Nhà (BTVN)",
      "Hạn Nộp BTVN",
      "Trạng Thái Báo Cáo",
    ];
    exportData.push(headers);

    monthTeachingSessions.forEach((s, idx) => {
      const shiftConfig = shifts.find((sh) => sh.id === s.shiftId);
      const shiftName = shiftConfig
        ? `${shiftConfig.name} (${shiftConfig.startTime}–${shiftConfig.endTime})`
        : s.shiftId || "Ca dạy";

      exportData.push([
        idx + 1,
        s.date,
        formatFullDateVN(s.date).split(",")[0],
        shiftName,
        s.className,
        s.room || "Phòng CLB",
        s.teacherName || "Thầy Thắng",
        s.assistantName || "Trợ giảng",
        s.lessonTopic || "-",
        s.lessonContent || "-",
        s.progressNote || "-",
        s.homework || "-",
        s.homeworkDeadline || "-",
        s.hasReport
          ? s.report?.status === "approved"
            ? "Đã duyệt báo cáo"
            : "Đã nộp báo cáo"
          : "Chưa nộp báo cáo",
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 12 },
      { wch: 22 },
      { wch: 28 },
      { wch: 16 },
      { wch: 22 },
      { wch: 20 },
      { wch: 35 },
      { wch: 40 },
      { wch: 35 },
      { wch: 35 },
      { wch: 15 },
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LichSuDayHoc");
    XLSX.writeFile(wb, `LichSuDayHoc_${selectedMonth.replace("-", "_")}.xlsx`);
  };

  // Helper to get shift badge
  const getShiftBadge = (shiftId?: string) => {
    const sc = shifts.find((s) => s.id === shiftId);
    if (!sc) {
      return {
        name: "Ca Học",
        time: "",
        badge: "bg-slate-100 text-slate-800 border-slate-300",
        period: "Ca dạy",
      };
    }
    if (sc.period === "morning") {
      return {
        name: sc.name,
        time: `${sc.startTime} – ${sc.endTime}`,
        badge: "bg-amber-100 text-amber-950 border-amber-300",
        period: "🌅 Ca Sáng",
      };
    }
    if (sc.period === "afternoon") {
      return {
        name: sc.name,
        time: `${sc.startTime} – ${sc.endTime}`,
        badge: "bg-sky-100 text-sky-950 border-sky-300",
        period: "☀️ Ca Chiều",
      };
    }
    return {
      name: sc.name,
      time: `${sc.startTime} – ${sc.endTime}`,
      badge: "bg-indigo-100 text-indigo-950 border-indigo-300",
      period: "🌙 Ca Tối",
    };
  };

  return (
    <div id="teaching-history-section" className="space-y-5 pt-4">
      {/* SECTION HEADER CARD */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-300 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Title and description */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-xs flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Sổ Theo Dõi Giảng Dạy
              </span>
              <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-950 border border-blue-300 font-black text-xs">
                {formatMonthDisplay(selectedMonth)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <span>📜 Lịch Sử Dạy Học & Tiến Độ Từng Tháng</span>
            </h2>
            <p className="text-xs text-slate-600 font-medium max-w-3xl">
              Xem chi tiết tất cả các buổi đã dạy trong tháng: nội dung bài học, tiến độ thực tế, bài tập về nhà (BTVN), giáo viên, trợ giảng và báo cáo ca dạy chuyên cần.
            </p>
          </div>

          {/* Action buttons on top right */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportMonthExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-xs transition-all cursor-pointer"
              title="Xuất danh sách tất cả các buổi dạy trong tháng ra file Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Sổ Giảng Dạy Excel</span>
            </button>
          </div>
        </div>

        {/* MONTH SELECTOR & FILTER CONTROLS BAR */}
        <div className="mt-4 pt-4 border-t-2 border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Month Navigation Control */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-300">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-indigo-900 transition-colors cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCurrentMonth}
                className="px-3 py-1 rounded-lg bg-white text-indigo-950 font-black text-xs shadow-2xs hover:bg-indigo-50 transition-colors cursor-pointer border border-slate-200"
              >
                Tháng Này
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-indigo-900 transition-colors cursor-pointer"
                title="Tháng tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Native HTML5 Month input picker */}
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(e.target.value);
                  }
                }}
                className="px-3 py-1 rounded-xl bg-white border-2 border-slate-300 hover:border-indigo-400 font-bold text-xs text-slate-800 outline-hidden cursor-pointer"
                title="Chọn tháng bất kỳ để xem lịch sử dạy học"
              />

              <div className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 font-black text-xs flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                <span>{formatMonthDisplay(selectedMonth)}</span>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Class filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-black text-slate-500 uppercase">Lớp:</span>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-white border-2 border-slate-200 font-bold text-xs text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả lớp ({monthStats.uniqueClasses})</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Report Status filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-black text-slate-500 uppercase">Báo cáo:</span>
              <select
                value={filterReportStatus}
                onChange={(e) => setFilterReportStatus(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-white border-2 border-slate-200 font-bold text-xs text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="has_report">Đã có báo cáo</option>
                <option value="no_report">Chưa nộp báo cáo</option>
                <option value="completed">Đã hoàn thành</option>
              </select>
            </div>

            {/* Keyword Search */}
            <div className="relative min-w-[170px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm bài học, BTVN..."
                className="w-full pl-7 pr-2.5 py-1 rounded-xl bg-white border-2 border-slate-200 font-bold text-xs text-slate-800 outline-hidden focus:border-indigo-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MONTHLY SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border-2 border-slate-300 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black shrink-0 border border-indigo-200">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-950">
              {monthStats.totalSessions}
            </div>
            <div className="text-[11px] font-bold text-slate-500">
              Tổng Buổi Dạy ({formatMonthDisplay(selectedMonth)})
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-slate-300 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-950">
              {monthStats.reportedSessions} / {monthStats.totalSessions}
            </div>
            <div className="text-[11px] font-bold text-slate-500">
              Đã Có Báo Cáo ({monthStats.reportRate}%)
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-slate-300 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black shrink-0 border border-blue-200">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-950">
              {monthStats.uniqueClasses}
            </div>
            <div className="text-[11px] font-bold text-slate-500">
              Lớp Học Giảng Dạy
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-slate-300 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black shrink-0 border border-amber-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-950">
              {monthStats.withHomework}
            </div>
            <div className="text-[11px] font-bold text-slate-500">
              Buổi Đã Giao BTVN
            </div>
          </div>
        </div>
      </div>

      {/* VIEW CONTROLS & EXPAND/COLLAPSE */}
      <div className="flex items-center justify-between gap-2 px-1 text-xs">
        <div className="text-slate-600 font-bold">
          Hiển thị <strong>{monthTeachingSessions.length}</strong> buổi học trong{" "}
          <strong>{formatMonthDisplay(selectedMonth)}</strong>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
            className="px-2.5 py-1 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            {sortOrder === "desc" ? "⬇️ Mới nhất trước" : "⬆️ Cũ nhất trước"}
          </button>

          <button
            type="button"
            onClick={expandAll}
            className="px-2.5 py-1 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            Mở rộng tất cả
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2.5 py-1 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            Thu gọn
          </button>
        </div>
      </div>

      {/* DETAILED SESSIONS LIST */}
      {monthTeachingSessions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-slate-300 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 mx-auto flex items-center justify-center">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900">
            Chưa có lịch sử buổi dạy trong {formatMonthDisplay(selectedMonth)}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
            Thầy/Cô có thể chuyển sang các tháng khác bằng nút chuyển tháng ở trên hoặc thêm các buổi học trong bảng Thời khóa biểu.
          </p>
          <button
            type="button"
            onClick={handleCurrentMonth}
            className="px-4 py-2 rounded-xl bg-indigo-700 text-white font-black text-xs shadow-md hover:bg-indigo-800 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Quay về tháng hiện tại</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {monthTeachingSessions.map((session, index) => {
            const shiftInfo = getShiftBadge(session.shiftId);
            const isExpanded = expandedSlotIds.has(session.id);
            const isCompleted = session.status === "completed" || session.hasReport;

            return (
              <div
                key={session.id}
                className="bg-white rounded-3xl border-2 border-slate-300 shadow-sm overflow-hidden hover:border-indigo-400 transition-all"
              >
                {/* Session Main Header Summary Row */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-200">
                  <div className="flex items-start sm:items-center gap-3 flex-wrap">
                    {/* Index & Date Badge */}
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-indigo-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="px-3 py-1 rounded-xl bg-white border-2 border-slate-300 font-black text-xs text-slate-900 flex items-center gap-1.5 shadow-2xs">
                        <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                        <span>{formatFullDateVN(session.date)}</span>
                      </div>
                    </div>

                    {/* Shift Badge */}
                    <div
                      className={`px-3 py-1 rounded-xl border font-black text-xs flex items-center gap-1.5 ${shiftInfo.badge}`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {shiftInfo.period}: {shiftInfo.name} ({shiftInfo.time})
                      </span>
                    </div>

                    {/* Class Name Badge */}
                    <div className="px-3 py-1 rounded-xl bg-blue-700 text-white font-black text-xs shadow-xs">
                      {session.className}
                    </div>

                    {/* Report Status Badge */}
                    {session.hasReport ? (
                      <span className="px-2.5 py-0.5 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 font-black text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {session.report?.status === "approved"
                          ? "Báo Cáo Đã Duyệt"
                          : "Đã Nộp Báo Cáo"}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 font-black text-[11px] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Chưa Lập Báo Cáo
                      </span>
                    )}
                  </div>

                  {/* Right side buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View report button if exists */}
                    {session.report && (
                      <button
                        type="button"
                        onClick={() => setViewingReport(session.report || null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-black text-xs border border-emerald-300 shadow-2xs transition-all cursor-pointer"
                        title="Xem báo cáo buổi học hoàn chỉnh"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Xem Báo Cáo</span>
                      </button>
                    )}

                    {/* Create report button if not yet created */}
                    {!session.hasReport && onNavigateCreateReport && (
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateCreateReport({
                            className: session.className,
                            reportDate: session.date,
                            reportShift: `${shiftInfo.name} (${shiftInfo.time})`,
                            lessonTopic: session.lessonTopic,
                            lessonContent: session.lessonContent,
                            homeworkAssigned: session.homework,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>+ Lập Báo Cáo</span>
                      </button>
                    )}

                    {/* Open Slot Detail in Modal */}
                    {onOpenSlotDetail && (
                      <button
                        type="button"
                        onClick={() => onOpenSlotDetail(session)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-black text-xs border border-slate-300 shadow-2xs transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Chi Tiết</span>
                      </button>
                    )}

                    {/* Toggle Accordion Expand */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(session.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        isExpanded
                          ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
                      }`}
                      title={isExpanded ? "Thu gọn bớt thông tin" : "Mở rộng chi tiết tiến độ & BTVN"}
                    >
                      <span>{isExpanded ? "Thu gọn" : "Chi tiết"}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Session Compact Summary Bar (Always Visible, Concise & Clean) */}
                <div className="p-3.5 sm:p-4 bg-white space-y-2.5">
                  {/* Topic Line & Quick Highlights */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 text-[11px] font-black text-indigo-700 uppercase tracking-wider">
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        <span>Bài học:</span>
                      </div>
                      <span className="text-sm sm:text-base font-black text-slate-950">
                        {session.lessonTopic || "Chưa cập nhật tên bài học"}
                      </span>
                    </div>

                    {/* Personnel Pill Tags */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold border border-slate-200">
                        <span className="text-slate-500 font-normal">GV:</span>{" "}
                        <strong className="text-slate-900">{session.teacherName || "Thầy Thắng"}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-900 font-bold border border-blue-200">
                        <span className="text-blue-500 font-normal">TG:</span>{" "}
                        <strong className="text-blue-950">{session.assistantName || "Chưa phân công"}</strong>
                      </span>
                      {session.room && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 text-slate-700 font-bold border border-slate-200">
                          {session.room}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compact Quick Snippets if collapsed */}
                  {!isExpanded && (
                    <div className="flex items-center gap-2 flex-wrap text-xs pt-1 text-slate-600">
                      {session.progressNote && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 text-[11px] font-bold border border-amber-200 max-w-md truncate">
                          <CheckCircle2 className="w-3 h-3 text-amber-700 shrink-0" />
                          <span className="truncate">Tiến độ: {session.progressNote}</span>
                        </div>
                      )}
                      {session.homework && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-900 text-[11px] font-bold border border-blue-200 max-w-md truncate">
                          <BookOpen className="w-3 h-3 text-blue-700 shrink-0" />
                          <span className="truncate">BTVN: {session.homework}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expandable Deep Details (Only shown when expanded) */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-200 space-y-3 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Progress Note Box */}
                        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase">
                            <CheckCircle2 className="w-4 h-4 text-amber-700" />
                            <span>Tiến Độ Đã Học Thực Tế:</span>
                          </div>
                          <p className="text-xs text-amber-950 font-bold whitespace-pre-line leading-relaxed">
                            {session.progressNote || "Buổi học đã hoàn thành theo phân phối chương trình của lớp."}
                          </p>
                        </div>

                        {/* Homework Box */}
                        <div className="p-3.5 rounded-2xl bg-blue-50/90 border border-blue-300 space-y-1">
                          <div className="flex items-center justify-between flex-wrap gap-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-black text-blue-950 uppercase">
                              <BookOpen className="w-4 h-4 text-blue-700" />
                              <span>Bài Tập Về Nhà (BTVN):</span>
                            </div>
                            {session.homeworkDeadline && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-200 text-blue-950 text-[10.5px] font-black">
                                Hạn nộp: {session.homeworkDeadline}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-blue-950 font-bold whitespace-pre-line leading-relaxed">
                            {session.homework || "Không giao thêm bài tập về nhà trong ca học này."}
                          </p>
                        </div>
                      </div>

                      {/* Full detailed lesson content */}
                      {session.lessonContent && (
                        <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                          <div className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-600" />
                            <span>Nội Dung Lý Thuyết & Dạng Bài Đã Giảng:</span>
                          </div>
                          <div className="text-xs text-slate-700 font-medium whitespace-pre-line leading-relaxed pl-1">
                            {session.lessonContent}
                          </div>
                        </div>
                      )}

                      {/* General Notes */}
                      {session.generalNotes && (
                        <div className="p-3 rounded-2xl bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200">
                          <strong className="text-slate-900">Ghi chú thêm: </strong>
                          {session.generalNotes}
                        </div>
                      )}

                      {/* Attached Report Stats Snapshot */}
                      {session.report && session.report.attendanceStats && (
                        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="text-xs font-black text-emerald-950 uppercase flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Điểm Danh & Tình Hình Chuyên Cần:</span>
                            </span>
                            <span className="text-[11px] font-black text-emerald-900">
                              Tổng sĩ số: {session.report.attendanceStats.total} học sinh
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div className="bg-white p-2 rounded-xl border border-emerald-200">
                              <div className="font-black text-emerald-700 text-sm">
                                {session.report.attendanceStats.present}
                              </div>
                              <div className="text-[10px] font-bold text-slate-500">Có mặt</div>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-amber-200">
                              <div className="font-black text-amber-700 text-sm">
                                {session.report.attendanceStats.late}
                              </div>
                              <div className="text-[10px] font-bold text-slate-500">Đi muộn</div>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-blue-200">
                              <div className="font-black text-blue-700 text-sm">
                                {session.report.attendanceStats.excused}
                              </div>
                              <div className="text-[10px] font-bold text-slate-500">Có phép</div>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-rose-200">
                              <div className="font-black text-rose-700 text-sm">
                                {session.report.attendanceStats.unexcused}
                              </div>
                              <div className="text-[10px] font-bold text-slate-500">Không phép</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Detail Modal */}
      {viewingReport && (
        <ReportDetailModal
          report={viewingReport}
          currentUser={currentUser}
          onClose={() => setViewingReport(null)}
          onApprove={(rep) => {
            storageService.approveReport(rep.id, currentUser.name);
            setViewingReport({
              ...rep,
              status: "approved",
              approvedBy: currentUser.name,
            });
          }}
        />
      )}
    </div>
  );
};
