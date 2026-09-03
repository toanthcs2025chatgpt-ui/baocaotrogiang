import React, { useState, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  School,
  User,
  GraduationCap,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  CheckCircle2,
  TrendingUp,
  Award,
  Wallet,
  CalendarCheck,
  Coins,
} from "lucide-react";
import { Report, Student, ClassItem } from "../types";
import { storageService } from "../services/storage";
import { exportUtils } from "../utils/exportUtils";
import { AttendanceReportSection } from "./AttendanceReportSection";
import { AssistantPayrollSection } from "./AssistantPayrollSection";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Vietnamese Label Helpers
const getAttendanceLabel = (val: string): { label: string; badgeClass: string } => {
  switch (val) {
    case "present":
      return { label: "Có mặt", badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold" };
    case "late":
      return { label: "Đi muộn", badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold" };
    case "excused":
      return { label: "Nghỉ có phép", badgeClass: "bg-sky-100 text-sky-900 border-sky-300 font-bold" };
    case "unexcused":
      return { label: "Nghỉ K.phép", badgeClass: "bg-rose-100 text-rose-900 border-rose-300 font-bold" };
    default:
      return { label: val || "-", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" };
  }
};

const getHomeworkLabel = (val: string): { label: string; badgeClass: string } => {
  switch (val) {
    case "excellent":
      return { label: "Xuất sắc", badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold" };
    case "completed":
      return { label: "Hoàn thành", badgeClass: "bg-blue-100 text-blue-900 border-blue-300 font-bold" };
    case "incomplete":
      return { label: "Chưa xong", badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold" };
    case "none":
      return { label: "Chưa làm", badgeClass: "bg-rose-100 text-rose-900 border-rose-300 font-bold" };
    default:
      return { label: val || "-", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" };
  }
};

const getComprehensionLabel = (val: string): { label: string; badgeClass: string } => {
  switch (val) {
    case "very_good":
      return { label: "Rất tốt", badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold" };
    case "good":
      return { label: "Tốt / Khá", badgeClass: "bg-teal-100 text-teal-900 border-teal-300 font-bold" };
    case "acceptable":
      return { label: "Trung bình", badgeClass: "bg-slate-100 text-slate-800 border-slate-300 font-semibold" };
    case "needs_effort":
      return { label: "Cần cố gắng", badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold" };
    case "not_grasping":
      return { label: "Chưa hiểu", badgeClass: "bg-rose-100 text-rose-900 border-rose-300 font-bold" };
    default:
      return { label: val || "-", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" };
  }
};

const getAttitudeLabel = (val: string): { label: string; badgeClass: string } => {
  switch (val) {
    case "very_active":
      return { label: "Rất hăng hái", badgeClass: "bg-purple-100 text-purple-900 border-purple-300 font-bold" };
    case "active":
      return { label: "Tích cực", badgeClass: "bg-indigo-100 text-indigo-900 border-indigo-300 font-bold" };
    case "normal":
      return { label: "Bình thường", badgeClass: "bg-slate-100 text-slate-800 border-slate-300 font-semibold" };
    case "passive":
      return { label: "Thụ động", badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold" };
    case "unfocused":
      return { label: "Mất tập trung", badgeClass: "bg-rose-100 text-rose-900 border-rose-300 font-bold" };
    default:
      return { label: val || "-", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" };
  }
};

export const StatisticsView: React.FC = () => {
  const reports = storageService.getReports();
  const classes = storageService.getClasses();
  const students = storageService.getStudents();

  // Active Sub-Tab in Statistics: "learning" | "tuition" | "payroll"
  const [activeSubTab, setActiveSubTab] = useState<"learning" | "tuition" | "payroll">("learning");

  // Filters
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState("all");

  // Available months extracted from reports
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    reports.forEach((r) => {
      if (r.date) {
        // format YYYY-MM
        const ym = r.date.substring(0, 7);
        if (ym) monthsSet.add(ym);
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [reports]);

  // Filtered reports based on Class and Month
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (selectedClass !== "all" && r.classId !== selectedClass) return false;
      if (selectedMonth !== "all" && !r.date.startsWith(selectedMonth)) return false;
      return true;
    });
  }, [reports, selectedClass, selectedMonth]);

  // Aggregate student entries
  const studentEntries = useMemo(() => {
    const list: Array<{
      reportId: string;
      date: string;
      className: string;
      teacherName: string;
      assistantName: string;
      studentId: string;
      studentName: string;
      attendance: string;
      homework: string;
      comprehension: string;
      attitude: string;
      homeworkScore?: number | null;
      comment: string;
    }> = [];

    filteredReports.forEach((r) => {
      const reportStudents = r.students || [];
      reportStudents.forEach((s) => {
        if (selectedStudent !== "all" && s.studentId !== selectedStudent) return;
        list.push({
          reportId: r.id,
          date: r.date,
          className: r.className,
          teacherName: r.teacherName,
          assistantName: r.assistantName,
          studentId: s.studentId,
          studentName: s.studentName,
          attendance: s.attendance,
          homework: s.homework,
          comprehension: s.comprehension,
          attitude: s.attitude,
          homeworkScore: s.homeworkScore,
          comment: s.comment,
        });
      });
    });

    return list;
  }, [filteredReports, selectedStudent]);

  // Statistical calculations
  const totalRecords = studentEntries.length;
  const presentCount = studentEntries.filter((s) => s.attendance === "present" || s.attendance === "late").length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 100;

  const goodHwCount = studentEntries.filter((s) => s.homework === "excellent" || s.homework === "completed").length;
  const homeworkRate = totalRecords > 0 ? Math.round((goodHwCount / totalRecords) * 100) : 100;

  const goodCompCount = studentEntries.filter((s) => s.comprehension === "very_good" || s.comprehension === "good").length;
  const compRate = totalRecords > 0 ? Math.round((goodCompCount / totalRecords) * 100) : 100;

  const activeAttCount = studentEntries.filter((s) => s.attitude === "very_active" || s.attitude === "active").length;
  const attitudeRate = totalRecords > 0 ? Math.round((activeAttCount / totalRecords) * 100) : 100;

  // Export handlers
  const handleExportExcel = () => {
    const rows = studentEntries.map((item, idx) => ({
      STT: idx + 1,
      "Ngày học": item.date,
      "Lớp học": item.className,
      "Họ và tên học sinh": item.studentName,
      "Chuyên cần": getAttendanceLabel(item.attendance).label,
      "Bài tập về nhà": `${getHomeworkLabel(item.homework).label}${item.homeworkScore !== undefined && item.homeworkScore !== null ? ` (${item.homeworkScore}đ)` : ""}`,
      "Điểm BTVN": item.homeworkScore ?? "-",
      "Mức độ tiếp thu": getComprehensionLabel(item.comprehension).label,
      "Thái độ học tập": getAttitudeLabel(item.attitude).label,
      "Trợ giảng": item.assistantName,
      "Nhận xét": item.comment || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thong_Ke");
    XLSX.writeFile(wb, `Thong_Ke_CLB_Toan_Thay_Thang_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportCSV = () => {
    let csv = "\uFEFFSTT,Ngày,Lớp,Học sinh,Chuyên cần,BTVN,Điểm,Tiếp thu,Thái độ,Trợ giảng,Nhận xét\n";
    studentEntries.forEach((item, idx) => {
      const att = getAttendanceLabel(item.attendance).label;
      const hw = getHomeworkLabel(item.homework).label;
      const comp = getComprehensionLabel(item.comprehension).label;
      const attd = getAttitudeLabel(item.attitude).label;
      csv += `${idx + 1},"${item.date}","${item.className}","${item.studentName}","${att}","${hw}",${item.homeworkScore ?? "-"},"${comp}","${attd}","${item.assistantName}","${(item.comment || "").replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Thong_Ke_CLB_Toan_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFillColor(26, 71, 42);
    doc.rect(0, 0, 297, 22, "F");

    doc.setTextColor(244, 197, 66);
    doc.setFontSize(14);
    doc.text("CLB TOAN THAY THANG - BANG TONG HOP THONG KE HOC TAP", 14, 10);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Ngay xuat: ${new Date().toLocaleDateString("vi-VN")} | Tong so ban ghi: ${studentEntries.length}`, 14, 16);

    const rows = studentEntries.map((s, i) => [
      i + 1,
      s.date,
      s.className,
      s.studentName,
      getAttendanceLabel(s.attendance).label,
      `${getHomeworkLabel(s.homework).label}${s.homeworkScore !== undefined && s.homeworkScore !== null ? ` (${s.homeworkScore}d)` : ""}`,
      s.homeworkScore ?? "-",
      getComprehensionLabel(s.comprehension).label,
      getAttitudeLabel(s.attitude).label,
      s.assistantName,
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["STT", "Ngay", "Lop", "Hoc sinh", "Chuyen can", "BTVN", "Diem", "Tiep thu", "Thai do", "Tro giang"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [26, 71, 42], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    });

    doc.save(`Thong_Ke_CLB_Toan_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* SECTION TABS SWITCHER */}
      <div className="bg-white rounded-3xl p-2.5 sm:p-3 border-2 border-slate-300 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Sub-tab 1: Học tập & Đánh giá */}
          <button
            type="button"
            onClick={() => setActiveSubTab("learning")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeSubTab === "learning"
                ? "bg-purple-800 text-white shadow-md border border-purple-900"
                : "bg-slate-100 text-slate-700 hover:bg-purple-100 hover:text-purple-900 border border-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Thống Kê Học Tập & Chuyên Cần</span>
          </button>

          {/* Sub-tab 2: Điểm danh & Học phí */}
          <button
            type="button"
            onClick={() => setActiveSubTab("tuition")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeSubTab === "tuition"
                ? "bg-blue-800 text-white shadow-md border border-blue-900"
                : "bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-900 border border-slate-200"
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Điểm Danh & Học Phí Học Sinh</span>
          </button>

          
        </div>

        <div className="text-xs text-slate-500 font-bold px-2 hidden lg:block">
          CLB Toán Thầy Thắng • Hệ thống Báo cáo & Tài chính
        </div>
      </div>

      {/* VIEW CONTENT 1: LEARNING & STUDENT EVALUATION LOG */}
      {activeSubTab === "learning" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-100 text-purple-900">
                  <BarChart3 className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-bold text-slate-800">Thống Kê & Báo Cáo Học Tập</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Báo cáo đa chiều theo ngày, tuần, tháng, lớp học và học sinh.
              </p>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1A472A] text-xs font-bold transition-colors border border-emerald-200 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất CSV</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors border border-rose-200 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Xuất PDF</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-600 block mb-1 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-slate-400" />
                Lớp học:
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              >
                <option value="all">Tất cả lớp học</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Chọn Tháng:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none font-medium text-slate-800"
              >
                <option value="all">Tất cả các tháng</option>
                {availableMonths.map((m) => {
                  const [year, month] = m.split("-");
                  return (
                    <option key={m} value={m}>
                      Tháng {month}/{year}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Học sinh cụ thể:
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              >
                <option value="all">Tất cả học sinh</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <button
                onClick={() => {
                  setSelectedClass("all");
                  setSelectedMonth("all");
                  setSelectedStudent("all");
                }}
                className="w-full p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>

          {/* Aggregate KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">Tỷ lệ Chuyên cần</span>
              <div className="text-2xl font-black text-emerald-800">{attendanceRate}%</div>
              <p className="text-[11px] text-slate-400">{presentCount}/{totalRecords} lượt có mặt</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">Tỷ lệ Hoàn thành BTVN</span>
              <div className="text-2xl font-black text-amber-900">{homeworkRate}%</div>
              <p className="text-[11px] text-slate-400">{goodHwCount}/{totalRecords} bài đạt</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">Tỷ lệ Tiếp thu Khá/Giỏi</span>
              <div className="text-2xl font-black text-blue-900">{compRate}%</div>
              <p className="text-[11px] text-slate-400">{goodCompCount}/{totalRecords} lượt đánh giá</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">Thái độ Tích cực</span>
              <div className="text-2xl font-black text-purple-900">{attitudeRate}%</div>
              <p className="text-[11px] text-slate-400">{activeAttCount}/{totalRecords} hăng hái</p>
            </div>
          </div>

          {/* Table of Entries */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">
                Chi Tiết Nhật Ký Đánh Giá ({studentEntries.length} bản ghi)
              </h3>
            </div>

            <div className="overflow-x-auto border-2 border-slate-300 rounded-2xl shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-12 text-center border-r border-slate-700">STT</th>
                    <th className="p-3 w-28 border-r border-slate-700">Ngày học</th>
                    <th className="p-3 w-28 border-r border-slate-700">Lớp</th>
                    <th className="p-3 w-48 border-r border-slate-700">Họ và Tên Học Sinh</th>
                    <th className="p-3 w-32 text-center border-r border-slate-700">Chuyên cần</th>
                    <th className="p-3 w-36 text-center border-r border-slate-700">BTVN</th>
                    <th className="p-3 w-32 text-center border-r border-slate-700">Tiếp thu</th>
                    <th className="p-3 w-32 text-center border-r border-slate-700">Thái độ</th>
                    <th className="p-3">Nhận xét của Trợ giảng</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-200">
                  {studentEntries.map((item, idx) => {
                    const isEven = idx % 2 === 0;
                    const rowBg = isEven ? "bg-white hover:bg-amber-100/80" : "bg-sky-100/80 hover:bg-amber-100/80";
                    const attInfo = getAttendanceLabel(item.attendance);
                    const hwInfo = getHomeworkLabel(item.homework);
                    const compInfo = getComprehensionLabel(item.comprehension);
                    const attdInfo = getAttitudeLabel(item.attitude);

                    return (
                      <tr key={idx} className={`${rowBg} transition-colors border-b border-slate-300`}>
                        {/* STT */}
                        <td className="p-3 text-center border-r border-slate-300">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-black ${isEven ? "bg-slate-100 text-slate-800 border border-slate-300" : "bg-blue-200 text-blue-950 border border-blue-400"}`}>
                            {idx + 1}
                          </span>
                        </td>

                        {/* Ngày */}
                        <td className="p-3 font-bold text-slate-800 border-r border-slate-300 whitespace-nowrap">
                          {item.date}
                        </td>

                        {/* Lớp */}
                        <td className="p-3 font-black text-emerald-950 border-r border-slate-300 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300">
                            {item.className.split("–")[0].trim()}
                          </span>
                        </td>

                        {/* Học sinh */}
                        <td className="p-3 font-black text-slate-950 border-r border-slate-300 text-xs sm:text-sm">
                          {item.studentName}
                        </td>

                        {/* Chuyên cần */}
                        <td className="p-2.5 text-center border-r border-slate-300">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] border shadow-2xs ${attInfo.badgeClass}`}>
                            {attInfo.label}
                          </span>
                        </td>

                        {/* BTVN */}
                        <td className="p-2.5 text-center border-r border-slate-300">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[11px] border shadow-2xs ${hwInfo.badgeClass}`}>
                              {hwInfo.label}
                            </span>
                            {item.homeworkScore !== undefined && item.homeworkScore !== null && (
                              <span className="text-[10px] font-black text-slate-700">
                                ({item.homeworkScore} điểm)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Tiếp thu */}
                        <td className="p-2.5 text-center border-r border-slate-300">
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-[11px] border shadow-2xs ${compInfo.badgeClass}`}>
                            {compInfo.label}
                          </span>
                        </td>

                        {/* Thái độ */}
                        <td className="p-2.5 text-center border-r border-slate-300">
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-[11px] border shadow-2xs ${attdInfo.badgeClass}`}>
                            {attdInfo.label}
                          </span>
                        </td>

                        {/* Nhận xét */}
                        <td className="p-3 text-slate-700 font-medium">
                          {item.comment ? (
                            <span className="text-slate-900">{item.comment}</span>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

            {/* VIEW CONTENT 2: ATTENDANCE & TUITION MATRIX REPORT */}
      {activeSubTab === "tuition" && (
        <div className="animate-in fade-in duration-200">
          <AttendanceReportSection initialClassId={selectedClass} />
        </div>
      )}
    </div>
  );
};
