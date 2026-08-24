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
} from "lucide-react";
import { Report, Student, ClassItem } from "../types";
import { storageService } from "../services/storage";
import { exportUtils } from "../utils/exportUtils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export const StatisticsView: React.FC = () => {
  const reports = storageService.getReports();
  const classes = storageService.getClasses();
  const students = storageService.getStudents();
  const assistants = storageService.getAssistants();

  // Filters
  const [timeFilter, setTimeFilter] = useState<"all" | "this_week" | "this_month">("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedAssistant, setSelectedAssistant] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState("all");

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (selectedClass !== "all" && r.classId !== selectedClass) return false;
      if (selectedAssistant !== "all" && r.assistantId !== selectedAssistant) return false;
      return true;
    });
  }, [reports, selectedClass, selectedAssistant]);

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
      "Chuyên cần": item.attendance,
      "Bài tập về nhà": item.homework,
      "Điểm BTVN": item.homeworkScore ?? "-",
      "Mức độ tiếp thu": item.comprehension,
      "Thái độ": item.attitude,
      "Trợ giảng": item.assistantName,
      "Nhận xét": item.comment,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thong_Ke");
    XLSX.writeFile(wb, `Thong_Ke_CLB_Toan_Thay_Thang_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportCSV = () => {
    let csv = "\uFEFFSTT,Ngày,Lớp,Học sinh,Chuyên cần,BTVN,Điểm,Tiếp thu,Thái độ,Trợ giảng,Nhận xét\n";
    studentEntries.forEach((item, idx) => {
      csv += `${idx + 1},"${item.date}","${item.className}","${item.studentName}","${item.attendance}","${item.homework}",${item.homeworkScore ?? "-"},"${item.comprehension}","${item.attitude}","${item.assistantName}","${(item.comment || "").replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Thong_Ke_CLB_Toan_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
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
      s.attendance,
      s.homework,
      s.homeworkScore ?? "-",
      s.comprehension,
      s.attitude,
      s.assistantName,
    ]);

    (doc as any).autoTable({
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
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-900">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">Thống Kê & Báo Cáo Tổng Hợp</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Báo cáo đa chiều theo ngày, tuần, tháng, lớp học, học sinh và trợ giảng.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1A472A] text-xs font-bold transition-colors border border-emerald-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors border border-rose-200"
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
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            Trợ giảng:
          </label>
          <select
            value={selectedAssistant}
            onChange={(e) => setSelectedAssistant(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
          >
            <option value="all">Tất cả trợ giảng</option>
            {assistants.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
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
              setSelectedAssistant("all");
              setSelectedStudent("all");
            }}
            className="w-full p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
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

        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center">STT</th>
                <th className="p-3 w-28">Ngày</th>
                <th className="p-3 w-36">Lớp</th>
                <th className="p-3 w-36">Học sinh</th>
                <th className="p-3 w-24">Chuyên cần</th>
                <th className="p-3 w-28">BTVN</th>
                <th className="p-3 w-24">Tiếp thu</th>
                <th className="p-3 w-24">Thái độ</th>
                <th className="p-3">Nhận xét</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentEntries.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="p-3 font-semibold text-slate-800">{item.date}</td>
                  <td className="p-3 text-[#1A472A] font-bold">{item.className.split("–")[0]}</td>
                  <td className="p-3 font-bold text-slate-900">{item.studentName}</td>
                  <td className="p-3">{item.attendance}</td>
                  <td className="p-3">
                    {item.homework} {item.homeworkScore !== undefined && `(${item.homeworkScore}đ)`}
                  </td>
                  <td className="p-3">{item.comprehension}</td>
                  <td className="p-3">{item.attitude}</td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">{item.comment || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
