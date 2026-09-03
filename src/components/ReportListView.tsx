import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle2,
  Trash2,
  Copy,
  Plus,
  FileSpreadsheet,
  Calendar,
  School,
  UserCheck,
  GraduationCap,
  Clock,
  Layers,
} from "lucide-react";
import { Report, User } from "../types";
import { storageService } from "../services/storage";
import { assistantReportService } from "../services/assistantReportService";
import { exportUtils } from "../utils/exportUtils";
import { ReportDetailModal } from "./ReportDetailModal";

interface ReportListViewProps {
  currentUser: User;
  onNavigateCreate: () => void;
  onEditReport: (report: Report) => void;
}

// Helpers for ISO Week and date range filtering
function getIsoWeek(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function isThisWeek(dateStr: string): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const day = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return target >= monday && target <= sunday;
}

function isLastWeek(dateStr: string): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const day = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1 - 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return target >= monday && target <= sunday;
}

export const ReportListView: React.FC<ReportListViewProps> = ({
  currentUser,
  onNavigateCreate,
  onEditReport,
}) => {
  const isAdmin = currentUser.role === "admin";
  const [reports, setReports] = useState<Report[]>(() => storageService.getReports());
  const classes = storageService.getClasses();
  const assistants = storageService.getAssistants();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterAssistant, setFilterAssistant] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterWeek, setFilterWeek] = useState<"all" | "this_week" | "last_week" | "custom">("all");
  const [customWeek, setCustomWeek] = useState("");

  // Extract available months from reports
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    reports.forEach((r) => {
      if (r.date) {
        const ym = r.date.substring(0, 7);
        if (ym) monthsSet.add(ym);
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [reports]);

  // Modal
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const reloadData = () => {
    setReports(storageService.getReports());
  };

  useEffect(() => {
    const handleUpdate = () => {
      setReports(storageService.getReports());
    };
    window.addEventListener("clb-storage-updated", handleUpdate);
    return () => window.removeEventListener("clb-storage-updated", handleUpdate);
  }, []);

  const handleApprove = async (report: Report) => {
    const updated: Report = {
      ...report,
      status: "approved",
      approvedBy: currentUser.name,
      approvedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      updatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    await assistantReportService.saveAssistantReport(updated);
    reloadData();
    setSelectedReport(updated);
  };

  const handleDelete = async (reportId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn báo cáo này trên cả hệ thống Cloud?")) {
      await assistantReportService.deleteAssistantReport(reportId);
      reloadData();
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    }
  };

  const handleDuplicate = async (report: Report) => {
    const duplicated: Report = {
      ...report,
      id: `rep_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      status: "draft",
      approvedBy: undefined,
      approvedAt: undefined,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      updatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    await assistantReportService.saveAssistantReport(duplicated);
    reloadData();
    onEditReport(duplicated);
  };

  // Filter logic
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Role constraint: Assistant can ONLY see their own reports
      if (!isAdmin && currentUser.role === "assistant") {
        const isOwner =
          r.assistantId === currentUser.id ||
          r.assistantId === currentUser.assistantId ||
          (r.assistantIds && (r.assistantIds.includes(currentUser.id) || (currentUser.assistantId && r.assistantIds.includes(currentUser.assistantId)))) ||
          (currentUser.name && r.assistantName?.toLowerCase().includes(currentUser.name.toLowerCase().replace("trợ giảng ", "").trim())) ||
          (currentUser.name && r.assistantNames?.some((an) => an.toLowerCase().includes(currentUser.name.toLowerCase().replace("trợ giảng ", "").trim()))) ||
          (currentUser.email && r.assistantId && assistants.find((a) => a.email === currentUser.email)?.id === r.assistantId);
        if (!isOwner) return false;
      }

      if (filterClass !== "all" && r.classId !== filterClass) return false;
      if (isAdmin && filterAssistant !== "all" && r.assistantId !== filterAssistant) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;

      // Filter by Month
      if (filterMonth !== "all" && !r.date.startsWith(filterMonth)) return false;

      // Filter by Week
      if (filterWeek !== "all") {
        if (filterWeek === "this_week") {
          if (!isThisWeek(r.date)) return false;
        } else if (filterWeek === "last_week") {
          if (!isLastWeek(r.date)) return false;
        } else if (filterWeek === "custom" && customWeek) {
          if (getIsoWeek(r.date) !== customWeek) return false;
        }
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchLesson = r.lessonContent.toLowerCase().includes(query);
        const matchClass = r.className.toLowerCase().includes(query);
        const matchTeacher = r.teacherName.toLowerCase().includes(query);
        const matchAssistant = r.assistantName.toLowerCase().includes(query);
        const matchStudent = r.students.some((s) => s.studentName.toLowerCase().includes(query));
        if (!matchLesson && !matchClass && !matchTeacher && !matchAssistant && !matchStudent) {
          return false;
        }
      }

      return true;
    });
  }, [reports, filterClass, filterAssistant, filterStatus, filterMonth, filterWeek, customWeek, searchTerm, isAdmin, currentUser, assistants]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-blue-100 text-blue-800 border border-blue-200">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {isAdmin ? "Lịch Sử & Quản Lý Báo Cáo Buổi Học" : "Lịch Sử Báo Cáo Buổi Học Của Tôi"}
                </h2>
                {!isAdmin && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-md border border-blue-200">
                    Báo cáo cá nhân
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {isAdmin
                  ? "Toàn bộ dữ liệu báo cáo sau mỗi ca dạy, duyệt báo cáo và theo dõi học tập của CLB."
                  : `Danh sách toàn bộ các buổi học và ca dạy do bạn (${currentUser.name}) phụ trách báo cáo.`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => exportUtils.exportReportsListToExcel(filteredReports)}
            className="btn-3d-secondary text-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={onNavigateCreate}
            className="btn-3d-primary text-xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Tạo báo cáo mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border-2 border-slate-200/80 shadow-sm space-y-3">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-3`}>
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Tìm theo nội dung bài, lớp, tên học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Filter Class */}
          <div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
            >
              <option value="all">Tất cả lớp học</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Assistant (Admin only) */}
          {isAdmin && (
            <div>
              <select
                value={filterAssistant}
                onChange={(e) => setFilterAssistant(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
              >
                <option value="all">Tất cả trợ giảng</option>
                {assistants.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="submitted">Đã gửi (Chờ duyệt)</option>
              <option value="approved">Đã duyệt</option>
            </select>
          </div>
        </div>

        {/* Month & Week Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-slate-100 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filter by Month */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Tháng:
              </span>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 shadow-2xs"
              >
                <option value="all">Tất cả các tháng</option>
                {availableMonths.map((m) => {
                  const [y, mon] = m.split("-");
                  return (
                    <option key={m} value={m}>
                      Tháng {mon}/{y}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filter by Week */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Tuần:
              </span>
              <select
                value={filterWeek}
                onChange={(e) => {
                  setFilterWeek(e.target.value as any);
                  if (e.target.value !== "custom") {
                    setCustomWeek("");
                  }
                }}
                className="text-xs px-3 py-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 shadow-2xs"
              >
                <option value="all">Tất cả các tuần</option>
                <option value="this_week">Tuần này (Hiện tại)</option>
                <option value="last_week">Tuần trước</option>
                <option value="custom">Chọn tuần cụ thể (Lịch)...</option>
              </select>

              {filterWeek === "custom" && (
                <input
                  type="week"
                  value={customWeek}
                  onChange={(e) => setCustomWeek(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-xl border-2 border-indigo-300 bg-indigo-50/50 font-bold text-indigo-950 focus:outline-none focus:border-indigo-600 shadow-2xs"
                />
              )}
            </div>

            {/* Reset Time Filter Button */}
            {(filterMonth !== "all" || filterWeek !== "all" || customWeek) && (
              <button
                onClick={() => {
                  setFilterMonth("all");
                  setFilterWeek("all");
                  setCustomWeek("");
                }}
                className="text-[11px] text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 font-bold transition-colors"
              >
                ✕ Xóa lọc thời gian
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Tìm thấy: <strong className="text-blue-900 font-black text-sm">{filteredReports.length}</strong> báo cáo
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border-2 border-slate-200/80 shadow-sm overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-slate-800">Không tìm thấy báo cáo nào</p>
            <p className="text-xs text-slate-400 font-medium">
              Hãy thử thay đổi bộ lọc tìm kiếm hoặc tạo báo cáo mới cho buổi học.
            </p>
            <button
              onClick={onNavigateCreate}
              className="btn-3d-primary text-xs mx-auto inline-flex"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Tạo báo cáo ngay</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-extrabold border-b-2 border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 w-28">Ngày học</th>
                  <th className="p-4 w-44">Lớp học</th>
                  <th className="p-4 w-36">Trợ giảng</th>
                  <th className="p-4 w-28">Giáo viên</th>
                  <th className="p-4 w-24 text-center">Số HS</th>
                  <th className="p-4">Nội dung bài học</th>
                  <th className="p-4 w-28 text-center">Trạng thái</th>
                  <th className="p-4 w-44 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => {
                  const isApproved = report.status === "approved";
                  const isSubmitted = report.status === "submitted";
                  const canEdit = isAdmin || !isApproved;

                  return (
                    <tr key={report.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Date & Shift */}
                      <td className="p-4">
                        <div className="font-black text-slate-900">{report.date}</div>
                        <div className="text-[11px] text-slate-400 font-semibold">{report.shift}</div>
                      </td>

                      {/* Class */}
                      <td className="p-4">
                        <span className="font-black text-blue-900">{report.className}</span>
                      </td>

                      {/* Assistant */}
                      <td className="p-4">
                        <span className="font-bold text-slate-700">{report.assistantName}</span>
                      </td>

                      {/* Teacher */}
                      <td className="p-4">
                        <span className="text-slate-600 font-medium">{report.teacherName}</span>
                      </td>

                      {/* Student count */}
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 font-black text-blue-900 border border-blue-200">
                          {report.students.length}
                        </span>
                      </td>

                      {/* Lesson Content snippet */}
                      <td className="p-4 text-slate-700 max-w-xs font-medium">
                        <p className="line-clamp-2">{report.lessonContent}</p>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black border shadow-xs ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-950 border-emerald-300 ring-1 ring-emerald-400/50"
                              : isSubmitted
                              ? "bg-amber-100 text-amber-950 border-amber-300"
                              : "bg-slate-200 text-slate-800 border-slate-300"
                          }`}
                        >
                          {isApproved ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>Đã duyệt</span>
                            </>
                          ) : isSubmitted ? (
                            <>
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Chờ GV duyệt</span>
                            </>
                          ) : (
                            <span>📝 Bản nháp</span>
                          )}
                        </span>
                        {isApproved && report.approvedBy && (
                          <div className="text-[9px] text-emerald-700 font-bold mt-1">
                            bởi {report.approvedBy}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <button
                            onClick={() => setSelectedReport(report)}
                            title="Xem chi tiết báo cáo"
                            className="p-2 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-900 shadow-xs active:translate-y-0.5 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          {canEdit && (
                            <button
                              onClick={() => onEditReport(report)}
                              title="Chỉnh sửa báo cáo"
                              className="p-2 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-900 shadow-xs active:translate-y-0.5 transition-all cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Approve (Admin) */}
                          {isAdmin && !isApproved && (
                            <button
                              onClick={() => handleApprove(report)}
                              title="Duyệt báo cáo này"
                              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_2px_0_0_#065f46] active:translate-y-0.5 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicate(report)}
                            title="Sao chép làm mẫu buổi sau"
                            className="p-2 rounded-xl bg-white border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 hover:text-amber-900 shadow-xs active:translate-y-0.5 transition-all cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete (Admin) */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(report.id)}
                              title="Xóa báo cáo"
                              className="p-2 rounded-xl bg-white border-2 border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 shadow-xs active:translate-y-0.5 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          currentUser={currentUser}
          onClose={() => setSelectedReport(null)}
          onApprove={handleApprove}
          onEdit={onEditReport}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
