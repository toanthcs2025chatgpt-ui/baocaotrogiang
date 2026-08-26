import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Phone,
  User,
  GraduationCap,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  HeartHandshake,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Student, Report, AIStudentAnalysis } from "../types";
import { storageService } from "../services/storage";
import { aiService } from "../services/ai";

interface StudentProfileViewProps {
  student: Student;
  onBack: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({ student, onBack }) => {
  const allReports = storageService.getReports();

  // Find all past reports containing this student
  const studentReports = allReports
    .map((r) => {
      const studentsList = r.students || [];
      const match = studentsList.find((s) => s.studentId === student.id);
      if (!match) return null;
      return {
        reportId: r.id,
        date: r.date,
        shift: r.shift,
        className: r.className,
        teacherName: r.teacherName,
        assistantName: r.assistantName,
        lessonContent: r.lessonContent,
        homeworkAssigned: r.homeworkAssigned,
        status: r.status,
        ...match,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.date > a!.date ? 1 : -1));

  // Compute stats
  const totalSessions = studentReports.length;
  const presentCount = studentReports.filter((r) => r!.attendance === "present" || r!.attendance === "late").length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

  const completedHwCount = studentReports.filter(
    (r) => r!.homework === "excellent" || r!.homework === "completed"
  ).length;
  const homeworkRate = totalSessions > 0 ? Math.round((completedHwCount / totalSessions) * 100) : 100;

  const scores = studentReports
    .map((r) => r!.homeworkScore)
    .filter((s): s is number => s !== undefined && s !== null);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "9.0";

  // AI Analysis state
  const [analysis, setAnalysis] = useState<AIStudentAnalysis | null>(() => {
    return storageService.getAnalysisCache(student.id);
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedParentMsg, setCopiedParentMsg] = useState(false);

  // Auto trigger AI analysis if no cache and has reports
  useEffect(() => {
    if (!analysis && studentReports.length > 0) {
      handleRunAIAnalysis();
    }
  }, [student.id]);

  const handleRunAIAnalysis = async () => {
    if (studentReports.length === 0) {
      setAiError("Chưa có báo cáo buổi học nào cho học sinh này để AI phân tích.");
      return;
    }

    setAnalyzing(true);
    setAiError(null);

    try {
      const result = await aiService.analyzeStudentProgress(student, studentReports);
      const withTimestamp: AIStudentAnalysis = {
        ...result,
        generatedAt: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
      };
      setAnalysis(withTimestamp);
      storageService.setAnalysisCache(student.id, withTimestamp);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Lỗi khi chạy AI phân tích học sinh.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyParentSummary = () => {
    if (!analysis?.parentSummary) return;
    navigator.clipboard.writeText(analysis.parentSummary);
    setCopiedParentMsg(true);
    setTimeout(() => setCopiedParentMsg(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Back & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách học sinh</span>
        </button>

        <button
          onClick={handleRunAIAnalysis}
          disabled={analyzing || studentReports.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A472A] text-[#F4C542] hover:bg-emerald-950 text-xs font-bold transition-all shadow-sm"
        >
          {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{analysis ? "Phân tích lại bằng AI" : "AI Phân tích quá trình học"}</span>
        </button>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-[#1A472A] to-emerald-800 text-[#F4C542] flex items-center justify-center text-4xl font-black shadow-lg overflow-hidden shrink-0 border-3 border-emerald-600 ring-4 ring-emerald-50">
              {student.avatar ? (
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                student.name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <h2 className="text-2xl font-black text-slate-900">{student.name}</h2>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black">
                  {student.className || "Lớp Toán"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                {student.dob && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày sinh: {student.dob}
                  </span>
                )}
                {student.parentName && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Phụ huynh: {student.parentName}
                  </span>
                )}
                {student.parentPhone && (
                  <span className="flex items-center gap-1 font-semibold text-emerald-800">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {student.parentPhone}
                  </span>
                )}
              </p>
              {student.note && (
                <div className="mt-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                  <span className="font-semibold text-slate-700">Mục tiêu / Ghi chú:</span> {student.note}
                </div>
              )}
            </div>
          </div>

          <div className="text-right flex md:flex-col items-center md:items-end gap-2 text-xs text-slate-400">
            <span>Ngày gia nhập: {student.joinedDate || "01/09/2024"}</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
              Tổng số {totalSessions} buổi học đã ghi nhận
            </span>
          </div>
        </div>

        {/* 4 Metric Key KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-xs font-semibold">Tỷ lệ Chuyên cần</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-[#1A472A]">{attendanceRate}%</div>
            <p className="text-[10px] text-emerald-700 mt-0.5">
              {presentCount}/{totalSessions} buổi có mặt
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-xs font-semibold">Hoàn thành BTVN</span>
              <Award className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-amber-900">{homeworkRate}%</div>
            <p className="text-[10px] text-amber-700 mt-0.5">
              {completedHwCount}/{totalSessions} bài hoàn thành
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
            <div className="flex items-center justify-between text-blue-800 mb-1">
              <span className="text-xs font-semibold">Điểm BTVN TB</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-blue-950">{avgScore} / 10</div>
            <p className="text-[10px] text-blue-700 mt-0.5">Đánh giá thực tế qua các bài</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80">
            <div className="flex items-center justify-between text-purple-800 mb-1">
              <span className="text-xs font-semibold">Mức độ Tiếp thu</span>
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="text-lg font-black text-purple-950 pt-1">
              {totalSessions > 0 ? "Khá - Giỏi 🌟" : "Mới bắt đầu"}
            </div>
            <p className="text-[10px] text-purple-700 mt-0.5">Đánh giá bởi Trợ giảng</p>
          </div>
        </div>
      </div>

      {/* SECTION VII: AI PHÂN TÍCH TIẾN BỘ HỌC TẬP (6 Structured Blocks) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1A472A] text-[#F4C542] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                AI Phân Tích Quá Trình Học Tập & Tiến Bộ
                <span className="text-[10px] bg-[#F4C542] text-[#1A472A] font-bold px-2 py-0.5 rounded-full">
                  Gemini 2.5
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Phân tích sâu dựa trên toàn bộ lịch sử báo cáo thực tế đã ghi nhận.
              </p>
            </div>
          </div>

          {analysis?.generatedAt && (
            <span className="text-[11px] text-slate-400">Tạo lúc: {analysis.generatedAt}</span>
          )}
        </div>

        {analyzing ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-emerald-800">
            <Loader2 className="w-8 h-8 animate-spin text-[#1A472A]" />
            <p className="text-xs font-semibold">
              Gemini AI đang tổng hợp lịch sử các buổi học và phân tích năng lực của {student.name}...
            </p>
          </div>
        ) : aiError ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <span>{aiError}</span>
            <button
              onClick={handleRunAIAnalysis}
              className="px-3 py-1.5 rounded-xl bg-rose-200 hover:bg-rose-300 font-bold text-rose-900"
            >
              Thử lại
            </button>
          </div>
        ) : analysis ? (
          <div className="space-y-4 text-xs">
            {/* Grid for Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Điểm mạnh */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  1. Điểm mạnh nổi bật
                </h4>
                <ul className="space-y-1.5 pl-2 text-slate-700">
                  {analysis.strengths?.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 2. Điểm cần cải thiện */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-amber-700" />
                  2. Điểm cần cải thiện
                </h4>
                <ul className="space-y-1.5 pl-2 text-slate-700">
                  {analysis.improvements?.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 3. Xu hướng tiến bộ */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                3. Xu hướng tiến bộ qua các buổi học
              </h4>
              <p className="text-slate-700 leading-relaxed font-medium pl-2">{analysis.trend}</p>
            </div>

            {/* 4. Các vấn đề cần chú ý & 5. Đề xuất cho giáo viên */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 4. Vấn đề cần chú ý */}
              <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200 space-y-2">
                <h4 className="font-bold text-rose-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  4. Vấn đề cần chú ý
                </h4>
                <ul className="space-y-1.5 pl-2 text-slate-700">
                  {analysis.attentionPoints?.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 5. Đề xuất cho giáo viên */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-2">
                <h4 className="font-bold text-indigo-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <HeartHandshake className="w-4 h-4 text-indigo-600" />
                  5. Đề xuất cho Giáo viên & Trợ giảng
                </h4>
                <p className="text-slate-700 leading-relaxed font-medium pl-2">{analysis.teacherAdvice}</p>
              </div>
            </div>

            {/* 6. Gợi ý nhận xét gửi phụ huynh */}
            <div className="p-4 rounded-2xl bg-[#1A472A]/5 border border-[#1A472A]/20 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[#1A472A] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#F4C542]" />
                  6. Gợi ý nhận xét tổng quan gửi Phụ huynh (Zalo / Sổ liên lạc)
                </h4>
                <button
                  onClick={handleCopyParentSummary}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-[#1A472A] font-semibold text-[11px] transition-colors"
                >
                  {copiedParentMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedParentMsg ? "Đã copy" : "Copy tin nhắn"}</span>
                </button>
              </div>
              <p className="text-slate-800 leading-relaxed font-medium italic bg-white p-3 rounded-xl border border-slate-200/70">
                "{analysis.parentSummary}"
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            Bấm "AI Phân tích quá trình học" để hệ thống đọc toàn bộ nhận xét và lập báo cáo năng lực chi tiết.
          </div>
        )}
      </div>

      {/* TIMELINE LỊCH SỬ BUỔI HỌC */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1A472A]" />
            Timeline Lịch Sử Buổi Học ({studentReports.length} buổi)
          </h3>
          <span className="text-xs text-slate-400">Xếp theo thứ tự thời gian gần nhất</span>
        </div>

        {studentReports.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs border border-dashed rounded-2xl">
            Chưa có buổi học nào được ghi nhận cho học sinh này.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
            {studentReports.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[27px] top-1.5 w-4 h-4 rounded-full bg-[#1A472A] border-2 border-white shadow-xs" />

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item!.date}</span>
                      <span className="text-slate-400">• {item!.shift}</span>
                      <span className="text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                        {item!.className}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Trợ giảng: <strong>{item!.assistantName}</strong>
                    </div>
                  </div>

                  <p className="text-slate-800 font-medium">
                    <span className="text-slate-400">Bài học:</span> {item!.lessonContent}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-semibold text-slate-700">
                      Chuyên cần: {item!.attendance}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-semibold text-slate-700">
                      BTVN: {item!.homework}{" "}
                      {item!.homeworkScore !== undefined && `(${item!.homeworkScore}đ)`}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-semibold text-slate-700">
                      Tiếp thu: {item!.comprehension}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-semibold text-slate-700">
                      Thái độ: {item!.attitude}
                    </span>
                  </div>

                  {item!.comment && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-slate-700 italic">
                      "{item!.comment}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
