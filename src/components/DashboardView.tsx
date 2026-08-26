import React, { useState } from "react";
import {
  Users,
  School,
  GraduationCap,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  Plus,
  Eye,
  Calendar,
} from "lucide-react";
import { Report, User } from "../types";
import { storageService } from "../services/storage";
import { ReportDetailModal } from "./ReportDetailModal";
import { AIBulletinSection } from "./AIBulletinSection";

interface DashboardViewProps {
  currentUser: User;
  onNavigateTab: (tab: any) => void;
  onEditReport?: (report: Report) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigateTab,
  onEditReport,
}) => {
  const isAdmin = currentUser.role === "admin";
  const students = storageService.getStudents();
  const classes = storageService.getClasses();
  const assistants = storageService.getAssistants();
  const [reports, setReports] = useState<Report[]>(() => storageService.getReports());

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const reportsToday = reports.filter((r) => r.date === todayStr);
  const pendingReports = reports.filter((r) => r.status === "submitted");

  // Aggregate stats across all reports
  let totalStudentEntries = 0;
  let presentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let unexcusedCount = 0;

  let hwExcellent = 0;
  let hwCompleted = 0;
  let hwIncomplete = 0;
  let hwNone = 0;

  let compVeryGood = 0;
  let compGood = 0;
  let compAcceptable = 0;
  let compNeedsEffort = 0;

  let attVeryActive = 0;
  let attActive = 0;
  let attNormal = 0;
  let attPassive = 0;

  reports.forEach((r) => {
    const studentList = r.students || [];
    studentList.forEach((s) => {
      totalStudentEntries++;
      // attendance
      if (s.attendance === "present") presentCount++;
      else if (s.attendance === "late") lateCount++;
      else if (s.attendance === "excused") excusedCount++;
      else if (s.attendance === "unexcused") unexcusedCount++;

      // homework
      if (s.homework === "excellent") hwExcellent++;
      else if (s.homework === "completed") hwCompleted++;
      else if (s.homework === "incomplete") hwIncomplete++;
      else if (s.homework === "none") hwNone++;

      // comprehension
      if (s.comprehension === "very_good") compVeryGood++;
      else if (s.comprehension === "good") compGood++;
      else if (s.comprehension === "acceptable") compAcceptable++;
      else compNeedsEffort++;

      // attitude
      if (s.attitude === "very_active") attVeryActive++;
      else if (s.attitude === "active") attActive++;
      else if (s.attitude === "normal") attNormal++;
      else attPassive++;
    });
  });

  const getPercent = (count: number) => {
    if (totalStudentEntries === 0) return 0;
    return Math.round((count / totalStudentEntries) * 100);
  };

  const handleApprove = (report: Report) => {
    const updated: Report = {
      ...report,
      status: "approved",
      approvedBy: currentUser.name,
      approvedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      updatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    storageService.saveReport(updated);
    setReports(storageService.getReports());
    setSelectedReport(updated);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner - Royal Blue & Indigo 3D */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/80 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/20 border border-cyan-400/50 text-cyan-300 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Hệ Thống Báo Cáo Thông Minh CLB Toán Thầy Thắng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            Chào {currentUser.name}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
            Hôm nay có <strong className="text-cyan-300 font-bold">{classes.length} lớp học</strong> đang hoạt động và{" "}
            <strong className="text-amber-300 font-bold">{pendingReports.length} báo cáo</strong> đang chờ duyệt.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab("schedule")}
              className="btn-3d-cyan text-xs"
            >
              <Calendar className="w-4 h-4" />
              <span>Thời Khóa Biểu 6 Ca</span>
            </button>
            <button
              onClick={() => onNavigateTab("create_report")}
              className="btn-3d-amber text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo báo cáo buổi học</span>
            </button>
            <button
              onClick={() => onNavigateTab("reports_history")}
              className="btn-3d-primary text-xs"
            >
              <span>Xem lịch sử báo cáo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Decorative Math Icon */}
        <div className="absolute right-6 -bottom-6 text-white/5 text-[170px] font-black select-none pointer-events-none">
          ∑
        </div>
      </div>

      {/* 5 High Level Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Students */}
        <div
          onClick={() => onNavigateTab("students")}
          className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md cursor-pointer transition-all space-y-1 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600">Tổng học sinh</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{students.length}</div>
          <span className="text-[11px] text-blue-700 font-bold">Toàn bộ câu lạc bộ</span>
        </div>

        {/* Total Classes */}
        <div
          onClick={() => onNavigateTab("classes")}
          className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md cursor-pointer transition-all space-y-1 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600">Tổng lớp học</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{classes.length}</div>
          <span className="text-[11px] text-indigo-700 font-bold">Từ Khối 6 đến Khối 10</span>
        </div>

        {/* Total Assistants */}
        <div
          onClick={() => onNavigateTab(isAdmin ? "assistants" : "dashboard")}
          className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md cursor-pointer transition-all space-y-1 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600">Trợ giảng</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold border border-amber-200 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{assistants.length}</div>
          <span className="text-[11px] text-amber-700 font-bold">Đang phụ trách các ca</span>
        </div>

        {/* Reports Today */}
        <div
          onClick={() => onNavigateTab("reports_history")}
          className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm hover:border-cyan-500 hover:shadow-md cursor-pointer transition-all space-y-1 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600">Báo cáo hôm nay</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-800 flex items-center justify-center font-bold border border-cyan-200 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{reportsToday.length}</div>
          <span className="text-[11px] text-cyan-700 font-bold">{todayStr}</span>
        </div>

        {/* Pending Approval */}
        <div
          onClick={() => onNavigateTab("reports_history")}
          className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm hover:border-rose-500 hover:shadow-md cursor-pointer transition-all space-y-1 col-span-2 sm:col-span-1 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600">Báo cáo chờ duyệt</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold border border-rose-200 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">{pendingReports.length}</div>
          <span className="text-[11px] text-rose-600 font-extrabold">
            {isAdmin ? "Cần Giáo viên duyệt" : "Đã gửi lên hệ thống"}
          </span>
        </div>
      </div>

      {/* AI WEEKLY & MONTHLY BULLETIN NOTICE BOARD (Trọng tâm Bảng Tin) */}
      <AIBulletinSection
        currentUser={currentUser}
        onNavigateTab={onNavigateTab}
        onSelectReport={(report) => setSelectedReport(report)}
      />

      {/* CHARTS / PROGRESS BARS SECTION (5 Visual Metrics) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Chuyên cần & Hoàn thành BTVN */}
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              1. Tỷ Lệ Chuyên Cần & 2. Hoàn Thành BTVN
            </h3>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">Tổng hợp</span>
          </div>

          {/* Attendance progress */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-slate-700">Chuyên cần (Có mặt đúng giờ):</span>
              <span className="text-blue-700 font-extrabold">{getPercent(presentCount)}%</span>
            </div>
            <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60 shadow-inner">
              <div
                style={{ width: `${getPercent(presentCount)}%` }}
                className="bg-blue-600 h-full"
                title="Có mặt"
              />
              <div
                style={{ width: `${getPercent(lateCount)}%` }}
                className="bg-amber-400 h-full"
                title="Đi muộn"
              />
              <div
                style={{ width: `${getPercent(excusedCount + unexcusedCount)}%` }}
                className="bg-rose-500 h-full"
                title="Vắng"
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 pt-0.5">
              <span className="text-blue-700">Có mặt: {presentCount}</span>
              <span className="text-amber-700">Đi muộn: {lateCount}</span>
              <span className="text-rose-700">Nghỉ: {excusedCount + unexcusedCount}</span>
            </div>
          </div>

          {/* Homework progress */}
          <div className="space-y-2 text-xs pt-2">
            <div className="flex justify-between font-bold">
              <span className="text-slate-700">Tình hình làm Bài tập về nhà:</span>
              <span className="text-amber-700 font-extrabold">
                {getPercent(hwExcellent + hwCompleted)}% Đạt
              </span>
            </div>
            <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60 shadow-inner">
              <div
                style={{ width: `${getPercent(hwExcellent)}%` }}
                className="bg-emerald-500 h-full"
                title="Tốt"
              />
              <div
                style={{ width: `${getPercent(hwCompleted)}%` }}
                className="bg-blue-600 h-full"
                title="Hoàn thành"
              />
              <div
                style={{ width: `${getPercent(hwIncomplete)}%` }}
                className="bg-amber-400 h-full"
                title="Chưa xong"
              />
              <div
                style={{ width: `${getPercent(hwNone)}%` }}
                className="bg-rose-500 h-full"
                title="Không làm"
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 pt-0.5">
              <span className="text-emerald-700">Tốt: {hwExcellent}</span>
              <span className="text-blue-700">Hoàn thành: {hwCompleted}</span>
              <span className="text-amber-700">Chưa đủ: {hwIncomplete}</span>
              <span className="text-rose-700">Không làm: {hwNone}</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Mức độ tiếp thu & Thái độ học tập */}
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              3. Mức Độ Tiếp Thu & 4. Thái Độ Học Tập
            </h3>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">Đánh giá</span>
          </div>

          {/* Comprehension */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-slate-700">Tiếp thu bài học:</span>
              <span className="text-indigo-700 font-extrabold">
                {getPercent(compVeryGood + compGood)}% Khá - Giỏi
              </span>
            </div>
            <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60 shadow-inner">
              <div
                style={{ width: `${getPercent(compVeryGood)}%` }}
                className="bg-indigo-600 h-full"
                title="Rất tốt"
              />
              <div
                style={{ width: `${getPercent(compGood)}%` }}
                className="bg-blue-500 h-full"
                title="Tốt"
              />
              <div
                style={{ width: `${getPercent(compAcceptable)}%` }}
                className="bg-amber-400 h-full"
                title="Đạt yêu cầu"
              />
              <div
                style={{ width: `${getPercent(compNeedsEffort)}%` }}
                className="bg-rose-400 h-full"
                title="Cần cố gắng"
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 pt-0.5">
              <span>Rất tốt: {compVeryGood}</span>
              <span>Tốt: {compGood}</span>
              <span>Đạt: {compAcceptable}</span>
              <span className="text-rose-600">Cần kèm: {compNeedsEffort}</span>
            </div>
          </div>

          {/* Attitude */}
          <div className="space-y-2 text-xs pt-2">
            <div className="flex justify-between font-bold">
              <span className="text-slate-700">Thái độ trong giờ học:</span>
              <span className="text-blue-800 font-extrabold">
                {getPercent(attVeryActive + attActive)}% Tích cực
              </span>
            </div>
            <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60 shadow-inner">
              <div
                style={{ width: `${getPercent(attVeryActive)}%` }}
                className="bg-blue-700 h-full"
                title="Rất tích cực"
              />
              <div
                style={{ width: `${getPercent(attActive)}%` }}
                className="bg-cyan-500 h-full"
                title="Tích cực"
              />
              <div
                style={{ width: `${getPercent(attNormal)}%` }}
                className="bg-slate-300 h-full"
                title="Bình thường"
              />
              <div
                style={{ width: `${getPercent(attPassive)}%` }}
                className="bg-rose-400 h-full"
                title="Chưa tập trung"
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 pt-0.5">
              <span className="text-blue-800">Rất hăng hái: {attVeryActive}</span>
              <span className="text-cyan-700">Tích cực: {attActive}</span>
              <span>Bình thường: {attNormal}</span>
              <span className="text-rose-600">Chưa tập trung: {attPassive}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart 5: Assistant Activity */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-700" />
            5. Hoạt Động & Đóng Góp Của Đội Ngũ Trợ Giảng
          </h3>
          <span className="text-xs font-bold text-slate-500">KPI số buổi báo cáo đã lập</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {assistants.map((asst) => {
            const asstReports = reports.filter((r) => r.assistantId === asst.id);
            return (
              <div
                key={asst.id}
                className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-2 border-blue-100 space-y-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center shadow-[0_2px_0_0_#1d4ed8]">
                    {asst.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{asst.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{asst.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 font-bold">
                  <span className="text-slate-600">Số buổi đã báo cáo:</span>
                  <span className="text-blue-800 text-sm font-extrabold">{asstReports.length} buổi</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Reports List */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700" />
            Báo Cáo Buổi Học Gần Đây
          </h3>
          <button
            onClick={() => onNavigateTab("reports_history")}
            className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {reports.slice(0, 5).map((r) => (
            <div
              key={r.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-blue-50/50 px-3 rounded-2xl transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{r.className}</span>
                  <span className="text-slate-400 font-medium">• {r.date}</span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      r.status === "approved"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : r.status === "submitted"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {r.status === "approved" ? "Đã duyệt" : r.status === "submitted" ? "Chờ duyệt" : "Bản nháp"}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] line-clamp-1">
                  {r.lessonContent} (Trợ giảng: {r.assistantName})
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => setSelectedReport(r)}
                  className="btn-3d-secondary text-xs py-1.5 px-3"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Xem chi tiết</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Report Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          currentUser={currentUser}
          onClose={() => setSelectedReport(null)}
          onApprove={handleApprove}
          onEdit={onEditReport}
        />
      )}
    </div>
  );
};
