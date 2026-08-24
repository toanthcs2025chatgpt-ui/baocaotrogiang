import React, { useState } from "react";
import {
  X,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  School,
  GraduationCap,
  Sparkles,
  Edit,
  Trash2,
  Users,
  MessageSquareHeart,
  FileCheck,
} from "lucide-react";
import { Report, StudentReportItem, User } from "../types";
import { exportUtils } from "../utils/exportUtils";

interface ReportDetailModalProps {
  report: Report | null;
  currentUser: User;
  onClose: () => void;
  onApprove?: (report: Report) => void;
  onEdit?: (report: Report) => void;
  onDelete?: (reportId: string) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  currentUser,
  onClose,
  onApprove,
  onEdit,
  onDelete,
}) => {
  const [copiedGeneral, setCopiedGeneral] = useState(false);

  if (!report) return null;

  const isAdmin = currentUser.role === "admin";

  const handleCopyGeneralZalo = () => {
    const text = report.generalFeedback || exportUtils.formatZaloWholeClassMessage(report);
    navigator.clipboard.writeText(text);
    setCopiedGeneral(true);
    setTimeout(() => setCopiedGeneral(false), 2500);
  };

  const attMap: Record<string, { label: string; bg: string }> = {
    present: { label: "Có mặt", bg: "bg-emerald-100 text-emerald-800" },
    late: { label: "Đi muộn", bg: "bg-amber-100 text-amber-800" },
    excused: { label: "Nghỉ có phép", bg: "bg-blue-100 text-blue-800" },
    unexcused: { label: "Nghỉ không phép", bg: "bg-rose-100 text-rose-800" },
  };

  const studentList = report.students || [];
  const presentCount =
    report.attendanceStats?.present ??
    studentList.filter((s) => s.attendance === "present").length;
  const lateCount =
    report.attendanceStats?.late ??
    studentList.filter((s) => s.attendance === "late").length;
  const absentCount =
    (report.attendanceStats?.excused || 0) + (report.attendanceStats?.unexcused || 0) ||
    studentList.filter((s) => s.attendance === "excused" || s.attendance === "unexcused").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-6 py-4 flex items-center justify-between border-b-2 border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-300">
              ∑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  Chi Tiết Báo Cáo Buổi Học
                </h3>
                <span
                  className={`text-xs font-black px-3 py-0.5 rounded-full border ${
                    report.status === "approved"
                      ? "bg-amber-400 text-slate-950 border-amber-300"
                      : report.status === "submitted"
                      ? "bg-blue-400/20 text-cyan-300 border-cyan-400/40"
                      : "bg-slate-700 text-slate-200 border-slate-600"
                  }`}
                >
                  {report.status === "approved"
                    ? "✓ Đã duyệt"
                    : report.status === "submitted"
                    ? "⏳ Chờ duyệt"
                    : "📝 Bản nháp"}
                </span>
              </div>
              <p className="text-xs text-blue-200 font-medium">
                CLB Toán Thầy Thắng • {report.className} • Ngày: {report.date}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-50 px-6 py-3 border-b-2 border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportUtils.exportReportToExcel(report)}
              className="btn-3d-secondary text-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Xuất Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => exportUtils.exportReportToPDF(report)}
              className="btn-3d-secondary text-xs"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Xuất PDF</span>
            </button>

            <button
              onClick={handleCopyGeneralZalo}
              className="btn-3d-primary text-xs"
            >
              {copiedGeneral ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-amber-400" />
              )}
              <span>{copiedGeneral ? "Đã copy bài nhận xét!" : "Copy nhận xét gửi Zalo cả lớp"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && report.status !== "approved" && onApprove && (
              <button
                onClick={() => onApprove(report)}
                className="btn-3d-amber text-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Duyệt báo cáo</span>
              </button>
            )}

            {onEdit && (isAdmin || report.status !== "approved") && (
              <button
                onClick={() => {
                  onEdit(report);
                  onClose();
                }}
                className="btn-3d-secondary text-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Sửa</span>
              </button>
            )}

            {isAdmin && onDelete && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Bạn có chắc chắn muốn xóa báo cáo này? Thao tác này không thể hoàn tác."
                    )
                  ) {
                    onDelete(report.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white border-2 border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 font-bold text-xs shadow-xs active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-700 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
            <div>
              <span className="text-slate-400 font-medium block">Ngày & Ca học:</span>
              <p className="font-black text-slate-900 text-sm mt-0.5">
                {report.date} • {report.shift}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Lớp học:</span>
              <p className="font-black text-blue-950 text-sm mt-0.5">{report.className}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Giáo viên:</span>
              <p className="font-black text-slate-900 text-sm mt-0.5">{report.teacherName}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Trợ giảng:</span>
              <p className="font-black text-blue-900 text-sm mt-0.5">{report.assistantName}</p>
            </div>
          </div>

          {/* Lesson Content Box */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border-2 border-blue-200 space-y-2">
            <div>
              <span className="font-black text-blue-950 uppercase tracking-wider text-[11px] block">
                Nội dung bài học đã giảng dạy:
              </span>
              <p className="text-slate-900 text-sm font-bold mt-1 leading-relaxed">
                {report.lessonContent}
              </p>
            </div>
            {report.homeworkAssigned && (
              <div className="pt-2 border-t border-blue-200">
                <span className="font-black text-blue-900 text-[11px]">BTVN giao về nhà: </span>
                <span className="text-slate-800 font-medium">{report.homeworkAssigned}</span>
              </div>
            )}
          </div>

          {/* Attendance Overview Stats */}
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-800" />
              <span className="font-black text-slate-900 text-xs">
                Sĩ số lớp tham gia: {report.students.length} học sinh
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-300">
                ✓ Có mặt: {presentCount}
              </span>
              {lateCount > 0 && (
                <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-black text-xs border border-amber-300">
                  ⚠️ Đi muộn: {lateCount}
                </span>
              )}
              {absentCount > 0 && (
                <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-900 font-black text-xs border border-rose-300">
                  ✕ Vắng: {absentCount}
                </span>
              )}
            </div>
          </div>

          {/* Misconception Notes Section */}
          {(report.misconceptionNotes ||
            (report.misconceptionTags && report.misconceptionTags.length > 0) ||
            (report.misconceptionStudents && report.misconceptionStudents.length > 0)) && (
            <div className="p-5 rounded-3xl bg-amber-50/70 border-2 border-amber-300 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500 text-slate-950">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h4 className="font-black text-sm text-slate-900">
                  Ghi Chú Riêng: Kiến Thức Còn Lầm Lẫn & Lỗi Sai Cần Củng Cố
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                {report.misconceptionTags && report.misconceptionTags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-700">Lỗi sai phổ biến:</span>
                    {report.misconceptionTags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-900 font-bold border border-blue-200 text-[11px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {report.misconceptionStudents && report.misconceptionStudents.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-700">Học sinh cần lưu ý kèm thêm:</span>
                    {report.misconceptionStudents.map((st, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-0.5 rounded-lg bg-amber-200 text-amber-900 font-bold border border-amber-300 text-[11px]"
                      >
                        {st}
                      </span>
                    ))}
                  </div>
                )}

                {report.misconceptionNotes && (
                  <div className="p-3.5 rounded-2xl bg-white border border-amber-200 text-slate-800 font-medium whitespace-pre-line leading-relaxed shadow-inner">
                    {report.misconceptionNotes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PRIMARY: Whole-Class General Feedback */}
          {report.generalFeedback ? (
            <div className="p-5 rounded-3xl bg-blue-50/40 border-2 border-blue-300 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-blue-600 text-amber-300">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h4 className="font-black text-sm text-blue-950">
                    Nhận Xét Chung Toàn Bộ Ca Dạy (Gửi Phụ Huynh)
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={handleCopyGeneralZalo}
                  className="btn-3d-primary text-xs py-1.5 px-3"
                >
                  {copiedGeneral ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{copiedGeneral ? "Đã copy!" : "Copy gửi Zalo"}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white border-2 border-blue-200 text-slate-800 font-medium whitespace-pre-line leading-relaxed text-xs shadow-inner">
                {report.generalFeedback}
              </div>
            </div>
          ) : null}

          {/* Quick Roster List if needed */}
          {studentList.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-black text-slate-900 text-sm">
                Danh Sách Điểm Danh Học Sinh ({studentList.length} bạn)
              </h4>

              <div className="border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold border-b-2 border-slate-200 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3 w-10 text-center">STT</th>
                        <th className="p-3">Họ và tên</th>
                        <th className="p-3 w-28">Chuyên cần</th>
                        <th className="p-3">Ghi chú / Nhận xét</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentList.map((student, idx) => (
                        <tr key={student.studentId} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-3 font-black text-slate-900">{student.studentName}</td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black ${
                                attMap[student.attendance]?.bg || "bg-slate-100"
                              }`}
                            >
                              {attMap[student.attendance]?.label || student.attendance}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-medium">
                            {student.comment || "Tham gia đầy đủ theo nhận xét chung."}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Footer Info */}
          {report.approvedBy && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-xs text-amber-950 font-bold flex items-center justify-between">
              <span>
                ✅ Đã được phê duyệt bởi: <strong>{report.approvedBy}</strong>
              </span>
              <span className="text-amber-800 font-medium">{report.approvedAt}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t-2 border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-3d-secondary text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
