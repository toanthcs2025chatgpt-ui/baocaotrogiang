import React, { useState, useMemo, useEffect } from "react";
import {
  CalendarCheck,
  Calendar,
  School,
  Coins,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  Filter,
  Users,
  DollarSign,
  TrendingUp,
  Percent,
  Copy,
  Check,
  Search,
} from "lucide-react";
import { Report, Student, ClassItem } from "../types";
import { storageService } from "../services/storage";
import * as XLSX from "xlsx";

interface AttendanceReportSectionProps {
  initialClassId?: string;
}

export const AttendanceReportSection: React.FC<AttendanceReportSectionProps> = ({
  initialClassId,
}) => {
  const classes = storageService.getClasses();
  const students = storageService.getStudents();
  const reports = storageService.getReports();

  // Selected Class
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (initialClassId && initialClassId !== "all") return initialClassId;
    return classes[0]?.id || "";
  });

  // Tuition fee per session (Default 150.000 VND)
  const [feePerSession, setFeePerSession] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`clb_tuition_fee_${selectedClassId}`);
      if (saved) return Number(saved);
      const globalSaved = localStorage.getItem("clb_tuition_fee_default");
      if (globalSaved) return Number(globalSaved);
    } catch {}
    return 150000;
  });

  // Time filter: "all" or specific month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [searchStudent, setSearchStudent] = useState<string>("");
  const [copiedToast, setCopiedToast] = useState(false);

  // When class changes, reload custom tuition fee if any
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`clb_tuition_fee_${selectedClassId}`);
      if (saved) {
        setFeePerSession(Number(saved));
      }
    } catch {}
  }, [selectedClassId]);

  // Save tuition fee on change
  const handleFeeChange = (val: number) => {
    setFeePerSession(val);
    try {
      localStorage.setItem(`clb_tuition_fee_${selectedClassId}`, String(val));
      localStorage.setItem("clb_tuition_fee_default", String(val));
    } catch {}
  };

  // Get selected class info
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  // All reports for this class, sorted by date ascending
  const classReports = useMemo(() => {
    if (!selectedClassId) return [];
    return reports
      .filter((r) => r.classId === selectedClassId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reports, selectedClassId]);

  // Available months from class reports
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    classReports.forEach((r) => {
      if (r.date) {
        months.add(r.date.slice(0, 7)); // "YYYY-MM"
      }
    });
    return Array.from(months).sort().reverse();
  }, [classReports]);

  // Filtered reports by selected month
  const filteredReports = useMemo(() => {
    if (selectedMonth === "all") return classReports;
    return classReports.filter((r) => r.date.startsWith(selectedMonth));
  }, [classReports, selectedMonth]);

  // Distinct dates from filtered reports
  const sessionDates = useMemo(() => {
    return filteredReports.map((r) => ({
      reportId: r.id,
      date: r.date,
      shift: r.shift,
      lessonContent: r.lessonContent,
      assistantName: r.assistantName,
    }));
  }, [filteredReports]);

  // Students belonging to this class
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    // Get students declared in class
    const list = students.filter((s) => s.classId === selectedClassId);

    // Also include any students mentioned in reports of this class that might not be in the master list
    const studentMap = new Map<string, { id: string; name: string; phone?: string }>();
    list.forEach((s) => studentMap.set(s.id, { id: s.id, name: s.name, phone: s.parentPhone }));

    classReports.forEach((r) => {
      (r.students || []).forEach((sr) => {
        if (!studentMap.has(sr.studentId)) {
          studentMap.set(sr.studentId, { id: sr.studentId, name: sr.studentName });
        }
      });
    });

    let result = Array.from(studentMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "vi")
    );

    if (searchStudent.trim()) {
      const q = searchStudent.toLowerCase().trim();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }

    return result;
  }, [students, selectedClassId, classReports, searchStudent]);

  // Matrix data: Map<studentId, Map<date, "present" | "late" | "excused" | "unexcused" | "none">>
  const attendanceMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, string>> = {};

    filteredReports.forEach((report) => {
      (report.students || []).forEach((st) => {
        if (!matrix[st.studentId]) {
          matrix[st.studentId] = {};
        }
        matrix[st.studentId][report.date] = st.attendance;
      });
    });

    return matrix;
  }, [filteredReports]);

  // Student summary calculations
  const studentStats = useMemo(() => {
    return classStudents.map((st) => {
      let presentCount = 0; // X (Đi học)
      let excusedCount = 0; // P (Nghỉ có phép)
      let unexcusedCount = 0; // K (Nghỉ không phép)
      let noDataCount = 0;

      sessionDates.forEach((s) => {
        const att = attendanceMatrix[st.id]?.[s.date];
        if (att === "present" || att === "late") {
          presentCount++;
        } else if (att === "excused") {
          excusedCount++;
        } else if (att === "unexcused") {
          unexcusedCount++;
        } else {
          noDataCount++;
        }
      });

      const totalFee = presentCount * feePerSession;

      return {
        studentId: st.id,
        studentName: st.name,
        phone: st.phone,
        presentCount,
        excusedCount,
        unexcusedCount,
        noDataCount,
        totalFee,
      };
    });
  }, [classStudents, sessionDates, attendanceMatrix, feePerSession]);

  // Class-level grand totals
  const classGrandTotal = useMemo(() => {
    const totalStudents = classStudents.length;
    const totalSessions = sessionDates.length;
    let totalPresent = 0;
    let totalExcused = 0;
    let totalUnexcused = 0;
    let totalRevenue = 0;

    studentStats.forEach((s) => {
      totalPresent += s.presentCount;
      totalExcused += s.excusedCount;
      totalUnexcused += s.unexcusedCount;
      totalRevenue += s.totalFee;
    });

    const totalPossibleSlots = totalStudents * totalSessions;
    const attendancePercentage =
      totalPossibleSlots > 0 ? Math.round((totalPresent / totalPossibleSlots) * 100) : 100;

    return {
      totalStudents,
      totalSessions,
      totalPresent,
      totalExcused,
      totalUnexcused,
      totalRevenue,
      attendancePercentage,
    };
  }, [classStudents, sessionDates, studentStats]);

  // Export to Excel
  const handleExportExcel = () => {
    if (!currentClass) return;

    // Header row
    const headers = [
      "STT",
      "Họ và Tên Học Sinh",
      "SĐT Phụ Huynh",
      ...sessionDates.map((s) => `Ngày ${formatDateVN(s.date)}`),
      "Tổng Đi Học (X)",
      "Nghỉ Có Phép (P)",
      "Nghỉ K.Phép (K)",
      "Đơn Giá / Buổi (VNĐ)",
      "TỔNG HỌC PHÍ (VNĐ)",
    ];

    const dataRows = studentStats.map((st, idx) => {
      const row: any[] = [idx + 1, st.studentName, st.phone || "-"];

      sessionDates.forEach((s) => {
        const att = attendanceMatrix[st.studentId]?.[s.date];
        if (att === "present" || att === "late") {
          row.push("X");
        } else if (att === "excused") {
          row.push("P");
        } else if (att === "unexcused") {
          row.push("K");
        } else {
          row.push("-");
        }
      });

      row.push(
        st.presentCount,
        st.excusedCount,
        st.unexcusedCount,
        feePerSession,
        st.totalFee
      );

      return row;
    });

    // Grand total summary row
    const summaryRow: any[] = [
      "TỔNG CỘNG",
      `${classGrandTotal.totalStudents} học sinh`,
      "-",
      ...sessionDates.map((s) => {
        const countPresentOnDate = classStudents.filter((st) => {
          const att = attendanceMatrix[st.id]?.[s.date];
          return att === "present" || att === "late";
        }).length;
        return `${countPresentOnDate}/${classGrandTotal.totalStudents}`;
      }),
      classGrandTotal.totalPresent,
      classGrandTotal.totalExcused,
      classGrandTotal.totalUnexcused,
      "-",
      classGrandTotal.totalRevenue,
    ];

    const wsData = [
      ["CLB TOÁN THẦY THẮNG - BÁO CÁO ĐIỂM DANH & QUYẾT TOÁN HỌC PHÍ"],
      [`Lớp: ${currentClass.name}`, `Thời gian: ${selectedMonth === "all" ? "Tất cả các buổi học" : `Tháng ${selectedMonth}`}`],
      [`Đơn giá học phí: ${feePerSession.toLocaleString("vi-VN")} đ/buổi`, `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`],
      [`Tổng số buổi học: ${sessionDates.length} buổi`, `Tổng học phí dự thu: ${classGrandTotal.totalRevenue.toLocaleString("vi-VN")} đ`],
      [],
      ["CHÚ THÍCH: [X] = Đi học (Tính phí) | [P] = Nghỉ có phép | [K] = Nghỉ không phép"],
      [],
      headers,
      ...dataRows,
      summaryRow,
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Diem_Danh_Hoc_Phi");

    const fileName = `DiemDanh_HocPhi_${currentClass.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Copy Summary text to Clipboard
  const handleCopySummary = () => {
    if (!currentClass) return;

    let text = `📊 BÁO CÁO ĐIỂM DANH & HỌC PHÍ • CLB TOÁN THẦY THẮNG\n`;
    text += `🏫 Lớp: ${currentClass.name}\n`;
    text += `📅 Kỳ báo cáo: ${selectedMonth === "all" ? "Tất cả các buổi" : `Tháng ${selectedMonth}`}\n`;
    text += `💰 Đơn giá: ${feePerSession.toLocaleString("vi-VN")} đ / buổi\n`;
    text += `👥 Sĩ số: ${classGrandTotal.totalStudents} học sinh | Số buổi: ${classGrandTotal.totalSessions} buổi\n`;
    text += `----------------------------------------\n`;
    text += `DANH SÁCH CHI TIẾT:\n`;

    studentStats.forEach((s, i) => {
      text += `${i + 1}. ${s.studentName}: Đi học ${s.presentCount} buổi (X), Nghỉ phép ${s.excusedCount} (P), Không phép ${s.unexcusedCount} (K) => Học phí: ${s.totalFee.toLocaleString("vi-VN")} đ\n`;
    });

    text += `----------------------------------------\n`;
    text += `💵 TỔNG THU HỌC PHÍ CẢ LỚP: ${classGrandTotal.totalRevenue.toLocaleString("vi-VN")} VNĐ\n`;
    text += `(Ký hiệu: [X] Đi học | [P] Nghỉ có phép | [K] Nghỉ không phép)`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    });
  };

  function formatDateVN(dateStr: string) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  }

  return (
    <div id="attendance-report-section" className="bg-white rounded-3xl border-2 border-slate-300 shadow-md p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-sm">
              <CalendarCheck className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <span>Báo Cáo Điểm Danh & Quyết Toán Học Phí</span>
                <span className="text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                  Theo từng buổi học
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Theo dõi nhật ký chuyên cần của học sinh theo ngày và tự động tính học phí theo số buổi có mặt.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Sao chép văn bản tóm tắt để gửi Zalo"
          >
            {copiedToast ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedToast ? "✓ Đã chép tóm tắt!" : "Chép báo cáo Zalo"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
            title="Xuất bảng ma trận điểm danh ra file Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Bảng Excel</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Class selector, Month selector, Tuition Fee input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
        {/* 1. Class Selector */}
        <div>
          <label className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-1.5">
            <School className="w-4 h-4 text-emerald-700" />
            <span>Chọn Lớp Học:</span>
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full p-2.5 rounded-xl border-2 border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Month Filter */}
        <div>
          <label className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-4 h-4 text-blue-700" />
            <span>Kỳ / Tháng Báo Cáo:</span>
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full p-2.5 rounded-xl border-2 border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
          >
            <option value="all">Tất cả các buổi học ({classReports.length} buổi)</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                Tháng {m.split("-")[1]}/{m.split("-")[0]} (
                {classReports.filter((r) => r.date.startsWith(m)).length} buổi)
              </option>
            ))}
          </select>
        </div>

        {/* 3. Tuition Fee Input (Khai báo học phí 1 buổi) */}
        <div>
          <label className="text-xs font-black text-slate-800 flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-700" />
              <span>Học Phí 1 Buổi:</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-800">
              {feePerSession.toLocaleString("vi-VN")} đ
            </span>
          </label>
          <div className="relative">
            <input
              type="number"
              step={10000}
              min={0}
              value={feePerSession}
              onChange={(e) => handleFeeChange(Math.max(0, Number(e.target.value) || 0))}
              placeholder="VD: 150000"
              className="w-full p-2.5 pr-14 rounded-xl border-2 border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
            />
            <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">
              VNĐ
            </span>
          </div>
          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {[150000, 180000, 200000, 250000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleFeeChange(preset)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-colors ${
                  feePerSession === preset
                    ? "bg-amber-600 text-white"
                    : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                }`}
              >
                {preset / 1000}k
              </button>
            ))}
          </div>
        </div>

        {/* 4. Search Student */}
        <div>
          <label className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-1.5">
            <Search className="w-4 h-4 text-purple-700" />
            <span>Tìm Kiếm Học Sinh:</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="Nhập tên học sinh..."
              className="w-full p-2.5 rounded-xl border-2 border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
            />
            {searchStudent && (
              <button
                type="button"
                onClick={() => setSearchStudent("")}
                className="absolute right-2.5 top-2.5 text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Legend & Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Legend Box */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-100/90 border-2 border-slate-300 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-black text-slate-900 block mb-2 uppercase tracking-wide">
              📌 Quy ước Ký hiệu Điểm danh:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {/* X: Đi học */}
              <div className="p-2 rounded-xl bg-emerald-50 border-2 border-emerald-400 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  X
                </span>
                <div className="text-[11px] leading-tight">
                  <span className="font-black text-emerald-950 block">Đi học</span>
                  <span className="text-slate-500 font-medium">Tính phí</span>
                </div>
              </div>

              {/* P: Có phép */}
              <div className="p-2 rounded-xl bg-amber-50 border-2 border-amber-400 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  P
                </span>
                <div className="text-[11px] leading-tight">
                  <span className="font-black text-amber-950 block">Nghỉ phép</span>
                  <span className="text-slate-500 font-medium">Có báo trước</span>
                </div>
              </div>

              {/* K: Không phép */}
              <div className="p-2 rounded-xl bg-rose-50 border-2 border-rose-400 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  K
                </span>
                <div className="text-[11px] leading-tight">
                  <span className="font-black text-rose-950 block">Không phép</span>
                  <span className="text-slate-500 font-medium">Cần nhắc nhở</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 font-medium pt-2 border-t border-slate-300">
            💡 Công thức: <strong>Học phí = Số buổi [X] × {feePerSession.toLocaleString("vi-VN")} đ</strong>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Sĩ số */}
          <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-300 flex flex-col justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Sĩ Số Lớp
            </span>
            <div className="mt-1">
              <span className="text-2xl font-black text-blue-950">{classGrandTotal.totalStudents}</span>
              <span className="text-xs font-bold text-blue-800 ml-1">học sinh</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Đã ghi nhận {classGrandTotal.totalSessions} buổi học
            </span>
          </div>

          {/* Tổng lượt có mặt */}
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-col justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Lượt Đi Học [X]
            </span>
            <div className="mt-1">
              <span className="text-2xl font-black text-emerald-950">{classGrandTotal.totalPresent}</span>
              <span className="text-xs font-bold text-emerald-800 ml-1">lượt</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold">
              Chuyên cần: {classGrandTotal.attendancePercentage}%
            </span>
          </div>

          {/* Tổng lượt nghỉ */}
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Lượt Nghỉ Học
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-950">
                {classGrandTotal.totalExcused + classGrandTotal.totalUnexcused}
              </span>
              <span className="text-xs font-bold text-amber-800">lượt</span>
            </div>
            <span className="text-[11px] text-slate-600 font-medium">
              {classGrandTotal.totalExcused} [P] phép • {classGrandTotal.totalUnexcused} [K] không phép
            </span>
          </div>

          {/* Tổng Doanh thu học phí */}
          <div className="p-4 rounded-2xl bg-linear-to-br from-emerald-600 to-teal-700 text-white border-2 border-emerald-800 flex flex-col justify-between shadow-xs">
            <span className="text-xs font-bold text-emerald-100 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-300" />
              Tổng Học Phí Lớp
            </span>
            <div className="mt-1">
              <span className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
                {classGrandTotal.totalRevenue.toLocaleString("vi-VN")}
              </span>
              <span className="text-xs font-bold text-white ml-1">đ</span>
            </div>
            <span className="text-[11px] text-emerald-100 font-medium">
              Quyết toán {classGrandTotal.totalPresent} buổi học
            </span>
          </div>
        </div>
      </div>

      {/* Main Attendance Matrix Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <span>Bảng Điểm Danh Chi Tiết ({classStudents.length} học sinh • {sessionDates.length} buổi học)</span>
          </h4>
          <span className="text-[11px] text-slate-700 font-bold bg-blue-50 px-3 py-1 rounded-xl border-2 border-blue-200 shadow-2xs">
            🎨 Hàng được tô màu xen kẽ tương phản cao để dễ nhìn theo từng học sinh
          </span>
        </div>

        {sessionDates.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 text-center space-y-2">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Chưa có dữ liệu buổi học nào cho lớp này trong kỳ đã chọn.</p>
            <p className="text-xs text-slate-500">
              Hãy tạo báo cáo điểm danh mới trong mục "Tạo Báo Cáo" để hệ thống tự động ghi nhận dữ liệu vào bảng.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-slate-400 rounded-2xl shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              {/* Header */}
              <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-3 w-14 text-center border-r border-slate-700 shrink-0">STT</th>
                  <th className="p-3 min-w-[200px] max-w-[240px] border-r border-slate-700">Họ và Tên Học Sinh</th>
                  
                  {/* Date Columns */}
                  {sessionDates.map((s, idx) => (
                    <th
                      key={s.reportId || idx}
                      className="p-2.5 text-center min-w-[62px] max-w-[75px] border-r border-slate-700 bg-slate-850 hover:bg-slate-750 transition-colors"
                      title={`${s.date} • ${s.shift}\nNội dung: ${s.lessonContent}\nTrợ giảng: ${s.assistantName}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] text-amber-300 font-black">{formatDateVN(s.date)}</span>
                        <span className="text-[9px] text-slate-300 font-medium truncate max-w-[55px]">
                          Buổi {idx + 1}
                        </span>
                      </div>
                    </th>
                  ))}

                  {/* Total Fee Column */}
                  <th className="p-3 text-right min-w-[140px] bg-teal-950 text-amber-300 font-black tracking-wide border-l border-slate-700">
                    Tổng Học Phí
                  </th>
                </tr>
              </thead>

              {/* Body with High-Contrast Alternating Rows */}
              <tbody className="divide-y-2 divide-slate-300 font-medium">
                {studentStats.map((st, idx) => {
                  // High-Contrast Alternating Rows:
                  // Even index: Crisp White (bg-white)
                  // Odd index: Vibrant Soft Blue (bg-sky-100 / bg-blue-100)
                  const isEven = idx % 2 === 0;
                  const rowBgClass = isEven
                    ? "bg-white hover:bg-amber-100 transition-colors"
                    : "bg-sky-100/90 hover:bg-amber-100 transition-colors";

                  return (
                    <tr
                      key={st.studentId}
                      className={`${rowBgClass} border-b-2 border-slate-300 group`}
                    >
                      {/* STT */}
                      <td className="p-3 text-center border-r-2 border-slate-300">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black shadow-2xs border ${
                            isEven
                              ? "bg-slate-100 text-slate-800 border-slate-300 group-hover:bg-amber-200"
                              : "bg-blue-200 text-blue-950 border-blue-400 group-hover:bg-amber-200"
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>

                      {/* Họ và Tên */}
                      <td className="p-3 border-r-2 border-slate-300">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-950 text-xs sm:text-sm group-hover:text-blue-900 leading-snug">
                            {st.studentName}
                          </span>
                          {st.phone ? (
                            <span className="text-[10px] text-slate-600 font-semibold mt-0.5">
                              📞 {st.phone}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic mt-0.5">
                              {st.presentCount} buổi đi học
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date Cells: X (Green), P (Yellow), K (Red) */}
                      {sessionDates.map((s) => {
                        const status = attendanceMatrix[st.studentId]?.[s.date];

                        return (
                          <td
                            key={s.reportId}
                            className="p-1.5 text-center border-r border-slate-300/80 align-middle"
                          >
                            {status === "present" || status === "late" ? (
                              <div
                                className="w-8 h-8 mx-auto rounded-xl bg-emerald-500 border-2 border-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs"
                                title={`Đi học: Ngày ${s.date}${status === "late" ? " (Đi muộn)" : ""}`}
                              >
                                X
                              </div>
                            ) : status === "excused" ? (
                              <div
                                className="w-8 h-8 mx-auto rounded-xl bg-amber-400 border-2 border-amber-500 text-amber-950 font-black text-sm flex items-center justify-center shadow-xs"
                                title={`Nghỉ có phép: Ngày ${s.date}`}
                              >
                                P
                              </div>
                            ) : status === "unexcused" ? (
                              <div
                                className="w-8 h-8 mx-auto rounded-xl bg-rose-500 border-2 border-rose-600 text-white font-black text-sm flex items-center justify-center shadow-xs"
                                title={`Nghỉ KHÔNG phép: Ngày ${s.date}`}
                              >
                                K
                              </div>
                            ) : (
                              <div
                                className="w-8 h-8 mx-auto rounded-xl text-slate-300 font-bold text-xs flex items-center justify-center"
                                title="Không có dữ liệu / Chưa vào lớp"
                              >
                                -
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Tổng Học Phí */}
                      <td className="p-3 text-right font-black border-l-2 border-slate-300 text-xs sm:text-sm">
                        <div className="flex flex-col items-end">
                          <div className="flex items-baseline gap-1">
                            <span className="text-emerald-950 font-black text-sm sm:text-base">
                              {st.totalFee.toLocaleString("vi-VN")}
                            </span>
                            <span className="text-[10px] text-slate-600 font-bold">đ</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            ({st.presentCount} buổi × {feePerSession / 1000}k)
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer Total Summary Row */}
              <tfoot className="bg-slate-900 text-white font-black border-t-4 border-slate-950 text-xs sticky bottom-0">
                <tr>
                  <td colSpan={2} className="p-3.5 text-left border-r border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="uppercase tracking-wider text-amber-300 text-xs">
                        TỔNG CỘNG CẢ LỚP:
                      </span>
                      <span className="text-[11px] text-slate-300 font-bold">
                        {classGrandTotal.totalStudents} học sinh
                      </span>
                    </div>
                  </td>

                  {/* Summary per Date Column: count present */}
                  {sessionDates.map((s) => {
                    const presentOnDate = classStudents.filter((st) => {
                      const att = attendanceMatrix[st.id]?.[s.date];
                      return att === "present" || att === "late";
                    }).length;

                    return (
                      <td
                        key={s.reportId}
                        className="p-2 text-center border-r border-slate-700 bg-slate-950/90"
                        title={`Có mặt: ${presentOnDate}/${classGrandTotal.totalStudents} học sinh`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[12px] font-black text-emerald-300">
                            {presentOnDate}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            /{classGrandTotal.totalStudents}
                          </span>
                        </div>
                      </td>
                    );
                  })}

                  {/* Grand Total Revenue */}
                  <td className="p-3.5 text-right bg-teal-950 text-amber-300 font-black text-sm sm:text-base border-l border-slate-700">
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span className="text-amber-300 text-base">
                          {classGrandTotal.totalRevenue.toLocaleString("vi-VN")}
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold">VNĐ</span>
                      </div>
                      <span className="text-[10px] text-emerald-300 font-normal">
                        (Tổng {classGrandTotal.totalPresent} lượt đi học)
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
