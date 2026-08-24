import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Award,
  BookOpen,
  Filter,
  UserX,
  BrainCircuit,
  Lightbulb,
  Share2,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageCircle,
  TrendingUp,
  Printer,
  History,
  Trash2,
  BookX,
  FileWarning,
} from "lucide-react";
import Markdown from "react-markdown";
import { Report, User, AIBulletin } from "../types";
import { storageService } from "../services/storage";
import { aiService } from "../services/ai";

interface AIBulletinSectionProps {
  currentUser: User;
  onNavigateTab?: (tab: any) => void;
  onSelectReport?: (report: Report) => void;
}

export const AIBulletinSection: React.FC<AIBulletinSectionProps> = ({
  currentUser,
  onNavigateTab,
  onSelectReport,
}) => {
  const isAdmin = currentUser.role === "admin";
  const classes = storageService.getClasses();
  const reports = storageService.getReports();

  // Filter states
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all">("weekly");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [directNoticeStudent, setDirectNoticeStudent] = useState<{
    studentName: string;
    className: string;
    issue: string;
    parentPhone?: string;
  } | null>(null);

  // Saved bulletins
  const [bulletins, setBulletins] = useState<AIBulletin[]>(() =>
    storageService.getBulletins()
  );

  // Active displayed bulletin (default to latest or matching period)
  const [activeBulletin, setActiveBulletin] = useState<AIBulletin | null>(() => {
    const saved = storageService.getBulletins();
    return saved.length > 0 ? saved[0] : null;
  });

  // Filter approved reports in current scope
  const approvedReports = useMemo(() => {
    const now = new Date();
    return reports.filter((r) => {
      if (r.status !== "approved") return false;
      if (selectedClassId !== "all" && r.classId !== selectedClassId) return false;

      if (period === "all") return true;

      const repDate = new Date(r.date);
      if (isNaN(repDate.getTime())) return true;

      const diffDays = Math.floor(
        (now.getTime() - repDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (period === "weekly") {
        return diffDays >= 0 && diffDays <= 7;
      }
      if (period === "monthly") {
        return diffDays >= 0 && diffDays <= 31;
      }
      return true;
    });
  }, [reports, period, selectedClassId]);

  // Derive timeframe label
  const timeframeLabel = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString("vi-VN");
    if (period === "weekly") {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `Tuần từ ${past7.toLocaleDateString("vi-VN")} đến ${todayStr}`;
    }
    if (period === "monthly") {
      return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
    }
    return "Tất cả các ca dạy đã duyệt";
  }, [period]);

  const selectedClassName = useMemo(() => {
    if (selectedClassId === "all") return "Toàn bộ các lớp";
    const found = classes.find((c) => c.id === selectedClassId);
    return found ? found.name : "Toàn bộ các lớp";
  }, [classes, selectedClassId]);

  // EXTRACT 1: Frequent Absences (Nghỉ 2-3 buổi trong tháng)
  const frequentAbsences = useMemo(() => {
    const studentAbsenceMap = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        className: string;
        absenceCount: number;
        dates: string[];
      }
    >();

    // We scan approved reports in the monthly scope (last 31 days or all)
    const monthlyScopeReports = reports.filter((r) => {
      if (r.status !== "approved") return false;
      if (selectedClassId !== "all" && r.classId !== selectedClassId) return false;
      return true;
    });

    monthlyScopeReports.forEach((rep) => {
      (rep.students || []).forEach((st) => {
        if (st.attendance === "excused" || st.attendance === "unexcused") {
          const key = `${st.studentId || st.studentName}_${rep.className}`;
          const curr = studentAbsenceMap.get(key) || {
            studentId: st.studentId,
            studentName: st.studentName,
            className: rep.className,
            absenceCount: 0,
            dates: [],
          };
          curr.absenceCount += 1;
          if (!curr.dates.includes(rep.date)) {
            curr.dates.push(rep.date);
          }
          studentAbsenceMap.set(key, curr);
        }
      });
    });

    // Filter students with 2 or more absences
    return Array.from(studentAbsenceMap.values())
      .filter((s) => s.absenceCount >= 2)
      .sort((a, b) => b.absenceCount - a.absenceCount);
  }, [reports, selectedClassId]);

  // EXTRACT 2: Repetitive Issues Scanner
  // (Đi học muộn, quên dụng cụ học tập, mất trật tự, mất tập trung, tính toán ẩu, viết chữ xấu)
  const repeatedIssues = useMemo(() => {
    const issueMap = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        className: string;
        issueType: string;
        issueLabel: string;
        occurrences: number;
        details: string[];
      }
    >();

    const targetReports = approvedReports.length > 0 ? approvedReports : reports.filter((r) => r.status === "approved");

    targetReports.forEach((rep) => {
      (rep.students || []).forEach((st) => {
        const comment = (st.comment || "").toLowerCase();
        const studentKey = `${st.studentId || st.studentName}_${rep.className}`;

        // 1. Đi học muộn
        if (st.attendance === "late" || comment.includes("đi muộn") || comment.includes("đến muộn") || comment.includes("vào muộn")) {
          const key = `${studentKey}_late`;
          const item = issueMap.get(key) || {
            studentId: st.studentId,
            studentName: st.studentName,
            className: rep.className,
            issueType: "late",
            issueLabel: "Đi học muộn",
            occurrences: 0,
            details: [],
          };
          item.occurrences += 1;
          item.details.push(`Buổi ${rep.date}: ${st.comment || "Đến lớp muộn"}`);
          issueMap.set(key, item);
        }

        // 2. Quên dụng cụ học tập (Thước kẻ, compa, máy tính, vở nháp, bút...)
        if (
          comment.includes("quên compa") ||
          comment.includes("quên thước") ||
          comment.includes("quên máy tính") ||
          comment.includes("quên vở") ||
          comment.includes("quên bút") ||
          comment.includes("quên sách") ||
          comment.includes("quên dụng cụ") ||
          comment.includes("thiếu dụng cụ") ||
          comment.includes("không mang thước") ||
          comment.includes("không mang compa") ||
          comment.includes("không mang máy tính") ||
          comment.includes("không mang sách") ||
          comment.includes("không mang vở") ||
          comment.includes("không mang bút") ||
          comment.includes("không mang dụng cụ")
        ) {
          const key = `${studentKey}_tools`;
          const item = issueMap.get(key) || {
            studentId: st.studentId,
            studentName: st.studentName,
            className: rep.className,
            issueType: "tools",
            issueLabel: "Quên dụng cụ học tập",
            occurrences: 0,
            details: [],
          };
          item.occurrences += 1;
          item.details.push(`Buổi ${rep.date}: ${st.comment || "Quên dụng cụ học tập (thước/compa/máy tính)"}`);
          issueMap.set(key, item);
        }

        // 3. Mất trật tự (Nói chuyện, trêu bạn, ồn ào)
        if (
          comment.includes("mất trật tự") ||
          comment.includes("nói chuyện") ||
          comment.includes("gây mất trật tự") ||
          comment.includes("ồn ào") ||
          comment.includes("trêu bạn") ||
          comment.includes("làm ồn")
        ) {
          const key = `${studentKey}_disruptive`;
          const item = issueMap.get(key) || {
            studentId: st.studentId,
            studentName: st.studentName,
            className: rep.className,
            issueType: "disruptive",
            issueLabel: "Mất trật tự",
            occurrences: 0,
            details: [],
          };
          item.occurrences += 1;
          item.details.push(`Buổi ${rep.date}: ${st.comment || "Còn mất trật tự, nói chuyện riêng trong giờ"}`);
          issueMap.set(key, item);
        }

        // 4. Mất tập trung (Làm việc riêng, lơ là, không chú ý)
        if (
          (st.attitude === "unfocused" && !comment.includes("mất trật tự") && !comment.includes("nói chuyện")) ||
          comment.includes("chưa tập trung") ||
          comment.includes("mất tập trung") ||
          comment.includes("làm việc riêng") ||
          comment.includes("lơ là") ||
          comment.includes("ngơ ngác") ||
          comment.includes("ngồi chơi") ||
          comment.includes("chưa chú ý")
        ) {
          const key = `${studentKey}_unfocused`;
          const item = issueMap.get(key) || {
            studentId: st.studentId,
            studentName: st.studentName,
            className: rep.className,
            issueType: "unfocused",
            issueLabel: "Mất tập trung",
            occurrences: 0,
            details: [],
          };
          item.occurrences += 1;
          item.details.push(`Buổi ${rep.date}: ${st.comment || "Chưa tập trung chú ý nghe giảng"}`);
          issueMap.set(key, item);
        }

        // 5. Tính toán ẩu / Nhầm dấu / Không kiểm tra lại bài
        if (
          comment.includes("tính ẩu") ||
          comment.includes("ẩu") ||
          comment.includes("nhầm dấu") ||
          comment.includes("sai số") ||
          comment.includes("không kiểm tra") ||
          comment.includes("quên điều kiện") ||
          comment.includes("đkxđ") ||
          comment.includes("tính sai") ||
          comment.includes("sai ngớ ngẩn")
        ) {
          const key = `${studentKey}_careless`;
          const item = issueMap.get(key) || {
            studentId: st.studentId,
            studentName: st.studentName,
            className: rep.className,
            issueType: "careless",
            issueLabel: "Tính toán ẩu / Nhầm dấu",
            occurrences: 0,
            details: [],
          };
          item.occurrences += 1;
          item.details.push(`Buổi ${rep.date}: ${st.comment || "Hay nhầm lẫn các bước tính toán"}`);
          issueMap.set(key, item);
        }

        // 6. Viết chữ xấu / Trình bày cẩu thả
        if (
          comment.includes("chữ xấu") ||
          comment.includes("viết xấu") ||
          comment.includes("chữ ẩu") ||
          comment.includes("viết ẩu") ||
          comment.includes("trình bày ẩu") ||
          comment.includes("trình bày cẩu thả") ||
          comment.includes("trình bày chưa sạch") ||
          comment.includes("tẩy xóa") ||
          comment.includes("vẽ hình ẩu") ||
          comment.includes("vẽ tay") ||
          comment.includes("không dùng thước")
        ) {
          const key = `${studentKey}_handwriting`;
          const item = issueMap.get(key) || {
            studentId: st.studentId,
            studentName: st.studentName,
            className: rep.className,
            issueType: "handwriting",
            issueLabel: "Viết chữ xấu & Trình bày ẩu",
            occurrences: 0,
            details: [],
          };
          item.occurrences += 1;
          item.details.push(`Buổi ${rep.date}: ${st.comment || "Chữ viết và trình bày bài chưa cẩn thận"}`);
          issueMap.set(key, item);
        }
      });
    });

    return Array.from(issueMap.values()).sort((a, b) => b.occurrences - a.occurrences);
  }, [approvedReports, reports]);

  // EXTRACT 2B: Dedicated Missing Homework Scanner (Chưa làm / Không làm BTVN)
  const missingHomeworkList = useMemo(() => {
    const hwMap = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        className: string;
        missingCount: number;
        noneCount: number;
        incompleteCount: number;
        dates: string[];
        details: string[];
      }
    >();

    const targetReports = approvedReports.length > 0 ? approvedReports : reports.filter((r) => r.status === "approved");

    targetReports.forEach((rep) => {
      (rep.students || []).forEach((st) => {
        const comment = (st.comment || "").toLowerCase();
        const isNone =
          st.homework === "none" ||
          comment.includes("chưa làm btvn") ||
          comment.includes("không làm btvn") ||
          comment.includes("không có btvn") ||
          comment.includes("quên btvn") ||
          comment.includes("chưa làm bài tập");
        const isIncomplete =
          st.homework === "incomplete" ||
          comment.includes("thiếu btvn") ||
          comment.includes("thiếu bài tập") ||
          comment.includes("chưa xong btvn") ||
          comment.includes("chưa hoàn thành btvn");

        if (isNone || isIncomplete) {
          const key = `${st.studentId || st.studentName}_${rep.className}`;
          const item = hwMap.get(key) || {
            studentId: st.studentId,
            studentName: st.studentName,
            className: rep.className,
            missingCount: 0,
            noneCount: 0,
            incompleteCount: 0,
            dates: [],
            details: [],
          };
          item.missingCount += 1;
          if (isNone) item.noneCount += 1;
          if (isIncomplete) item.incompleteCount += 1;

          if (!item.dates.includes(rep.date)) {
            item.dates.push(rep.date);
          }

          const statusText = isNone ? "Chưa làm BTVN" : "Làm thiếu BTVN";
          const detailStr = st.comment ? `Buổi ${rep.date}: ${st.comment}` : `Buổi ${rep.date}: ${statusText}`;
          item.details.push(detailStr);
          hwMap.set(key, item);
        }
      });
    });

    return Array.from(hwMap.values()).sort((a, b) => b.missingCount - a.missingCount);
  }, [approvedReports, reports]);

  // EXTRACT 3: Praises (Tuyên dương học sinh nỗ lực / điểm 10 / tiến bộ)
  const praiseList = useMemo(() => {
    const list: Array<{ studentName: string; className: string; highlight: string }> = [];
    const seen = new Set<string>();

    const targetReports = approvedReports.length > 0 ? approvedReports : reports.filter((r) => r.status === "approved");

    targetReports.forEach((rep) => {
      (rep.students || []).forEach((st) => {
        const comment = (st.comment || "").toLowerCase();
        if (
          st.attitude === "very_active" ||
          st.homework === "excellent" ||
          st.comprehension === "very_good" ||
          comment.includes("xuất sắc") ||
          comment.includes("tiến bộ") ||
          comment.includes("10đ") ||
          comment.includes("hăng hái") ||
          comment.includes("tích cực")
        ) {
          if (!seen.has(st.studentName)) {
            seen.add(st.studentName);
            list.push({
              studentName: st.studentName,
              className: rep.className,
              highlight:
                st.comment ||
                (st.homework === "excellent"
                  ? "Hoàn thành BTVN xuất sắc 10/10, tiếp thu bài nhanh"
                  : "Rất tích cực xây dựng bài và tư duy tốt"),
            });
          }
        }
      });
    });

    return list.slice(0, 6);
  }, [approvedReports, reports]);

  // EXTRACT 4: Common misconceptions
  const commonMisconceptions = useMemo(() => {
    const set = new Set<string>();
    const targetReports = approvedReports.length > 0 ? approvedReports : reports.filter((r) => r.status === "approved");

    targetReports.forEach((rep) => {
      if (rep.misconceptionNotes) {
        set.add(rep.misconceptionNotes);
      }
      (rep.misconceptionTags || []).forEach((t) => set.add(t));
    });

    if (set.size === 0) {
      return [
        "Nhầm lẫn dấu khi quy đồng và khử mẫu",
        "Quên đối chiếu điều kiện xác định (ĐKXĐ) trước khi kết luận nghiệm",
        "Chưa chứng minh tính dương của các biểu thức khi dùng BĐT Cauchy",
      ];
    }

    return Array.from(set);
  }, [approvedReports, reports]);

  // TRIGGER: Generate Bulletin via Gemini API
  const handleGenerateBulletin = async () => {
    setIsGenerating(true);

    try {
      const generated = await aiService.generateAIBulletin({
        period: period === "all" ? "custom" : period,
        timeframeLabel,
        className: selectedClassName,
        reports: approvedReports.length > 0 ? approvedReports : reports.filter((r) => r.status === "approved"),
        frequentAbsenceStudents: frequentAbsences,
        repeatedIssueStudents: repeatedIssues,
        praiseStudents: praiseList,
        commonMisconceptions,
      });

      storageService.saveBulletin(generated);
      const updatedList = storageService.getBulletins();
      setBulletins(updatedList);
      setActiveBulletin(generated);
    } catch (error) {
      console.error("Generate bulletin error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyBulletin = () => {
    if (!activeBulletin) return;
    navigator.clipboard.writeText(activeBulletin.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyWarningSection = () => {
    const warningText = `📢 CẢNH BÁO HỌC VỤ & DANH SÁCH NHẮC NHỞ (${timeframeLabel}):\n\n📌 1. Học sinh nghỉ từ 2 buổi trong tháng:\n${
      frequentAbsences.length > 0
        ? frequentAbsences.map((s) => `• ${s.studentName} (${s.className}): Nghỉ ${s.absenceCount} buổi (Ngày ${s.dates.join(", ")})`).join("\n")
        : "• Không có học sinh nghỉ nhiều buổi."
    }\n\n📌 2. Học sinh chưa làm / thiếu Bài tập về nhà (BTVN):\n${
      missingHomeworkList.length > 0
        ? missingHomeworkList.map((s) => `• ${s.studentName} (${s.className}): Chưa làm BTVN ${s.missingCount} buổi (Ngày: ${s.dates.join(", ")})`).join("\n")
        : "• 100% học sinh nộp bài tập về nhà đầy đủ."
    }\n\n📌 3. Học sinh bị nhắc nhiều lần về nề nếp & kỹ năng:\n${
      repeatedIssues.length > 0
        ? repeatedIssues.map((s) => `• ${s.studentName} (${s.className}) - [${s.issueLabel}]: Bị nhắc ${s.occurrences} lần.`).join("\n")
        : "• Đa số học sinh giữ vững nề nếp."
    }`;

    navigator.clipboard.writeText(warningText);
    setCopiedSection("warnings");
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER WITH ACTION BAR */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-blue-800/80 relative overflow-hidden">
        {/* Glow background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-black">
                <BrainCircuit className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>AI Gemini 2.5 • Bảng Tin Tự Động Hóa Học Vụ</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Bản Tin Thông Báo Hàng Tuần & Hàng Tháng</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  {approvedReports.length} ca dạy đã duyệt
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/80 max-w-3xl leading-relaxed font-medium">
                Sử dụng trí tuệ nhân tạo Gemini đọc toàn bộ các báo cáo trợ giảng đã được Thầy Thắng phê duyệt, tự động lọc học sinh nghỉ 2–3 buổi, phân tích học sinh bị nhắc nhở nhiều lần (đi muộn, tính ẩu, mất trật tự, ngại tư duy) và tổng hợp bản tin gửi Zalo Phụ huynh.
              </p>
            </div>

            {/* AI Generate Action Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleGenerateBulletin}
                disabled={isGenerating}
                className="btn-3d-amber text-xs sm:text-sm px-4 py-2.5 flex items-center gap-2 shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Gemini đang đọc báo cáo & tổng hợp...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>{activeBulletin ? "Tạo / Cập nhật Bản tin với AI" : "Tạo Bản tin AI ngay"}</span>
                  </>
                )}
              </button>

              {bulletins.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  title="Lịch sử các bản tin đã lưu"
                  className="p-2.5 rounded-xl bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700/80 shadow-md cursor-pointer transition-all"
                >
                  <History className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar Controls */}
          <div className="pt-3 border-t border-blue-800/60 flex flex-wrap items-center justify-between gap-3">
            {/* Period tabs */}
            <div className="flex items-center bg-blue-950/90 p-1 rounded-2xl border border-blue-700/60">
              <button
                onClick={() => setPeriod("weekly")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  period === "weekly"
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "text-blue-200 hover:text-white"
                }`}
              >
                📅 Bản tin Tuần này
              </button>
              <button
                onClick={() => setPeriod("monthly")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  period === "monthly"
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "text-blue-200 hover:text-white"
                }`}
              >
                🗓️ Bản tin Tháng này
              </button>
              <button
                onClick={() => setPeriod("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  period === "all"
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "text-blue-200 hover:text-white"
                }`}
              >
                ⚡ Toàn bộ ca dạy
              </button>
            </div>

            {/* Class filter dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-200 font-bold hidden sm:inline-flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Lớp học:</span>
              </span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-blue-950 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-700/80 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
              >
                <option value="all">🌟 Tất cả các lớp ({classes.length} lớp)</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.grade})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 5 ACTIONABLE RADAR WARNING & BULLETIN CARDS - MỖI Ô MỘT HÀNG RỘNG RÃI */}
      <div className="space-y-4">
        {/* CARD 1: Cảnh báo nghỉ 2-3 buổi */}
        <div className="bg-gradient-to-br from-rose-50 via-white to-red-50/70 rounded-3xl p-5 sm:p-6 border-2 border-rose-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/80">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-xs">
                <UserX className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-rose-950 uppercase tracking-tight">
                    1. Học Sinh Nghỉ 2–3 Buổi Trong Tháng
                  </h3>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-950 border border-rose-300">
                    {frequentAbsences.length} học sinh
                  </span>
                </div>
                <p className="text-xs text-rose-800/90 font-medium mt-0.5">
                  Cần liên hệ Phụ huynh gửi phiếu bài tập & video bài giảng bổ trợ kịp thời để học sinh không hổng kiến thức.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {frequentAbsences.length === 0 ? (
              <div className="text-xs text-emerald-900 font-bold bg-emerald-100/90 p-3 rounded-2xl border border-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Nề nếp chuyên cần tuyệt vời! Không có học sinh nào nghỉ từ 2 buổi trở lên trong tháng này.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {frequentAbsences.map((st, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      setDirectNoticeStudent({
                        studentName: st.studentName,
                        className: st.className,
                        issue: `Đã nghỉ ${st.absenceCount} buổi trong tháng (Ngày: ${st.dates.join(", ")}). Cần liên hệ gửi phiếu bài tập tự luyện và hướng dẫn bài tập bù.`,
                      })
                    }
                    className="p-3.5 rounded-2xl bg-white border border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 hover:shadow-md transition-all cursor-pointer text-left group shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-rose-950 group-hover:text-rose-700 transition-colors">
                        {st.studentName}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold shrink-0">
                        Vắng {st.absenceCount} buổi
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-semibold mt-1">
                      {st.className}
                    </div>
                    <div className="text-xs text-rose-800 font-medium mt-1.5 flex items-center gap-1">
                      <span className="font-bold">Ngày vắng:</span> {st.dates.join(", ")}
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-700 font-bold">
                      <span>💬 Bấm để xem mẫu tin nhắn Zalo</span>
                      <span>→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: Học sinh chưa hoàn thành / Không làm bài tập về nhà (BTVN) */}
        <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50/80 rounded-3xl p-5 sm:p-6 border-2 border-orange-300 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-orange-200/80">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-orange-600 text-white shadow-xs font-black">
                <BookX className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-orange-950 uppercase tracking-tight">
                    2. Học Sinh Chưa Hoàn Thành / Không Làm Bài Tập Về Nhà (BTVN)
                  </h3>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-orange-200 text-orange-950 border border-orange-300">
                    {missingHomeworkList.length} học sinh
                  </span>
                </div>
                <p className="text-xs text-orange-900/90 font-medium mt-0.5">
                  Danh sách học sinh quên nộp, không làm hoặc làm thiếu phiếu bài tập cần giáo viên & phụ huynh đôn đốc hoàn thiện bài bù.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {missingHomeworkList.length === 0 ? (
              <div className="text-xs text-emerald-900 font-bold bg-emerald-100/90 p-3 rounded-2xl border border-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>100% học sinh nộp bài tập về nhà đầy đủ! Tinh thần tự giác học tập rất đáng khen ngợi.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {missingHomeworkList.map((item, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      setDirectNoticeStudent({
                        studentName: item.studentName,
                        className: item.className,
                        issue: `Chưa hoàn thành BTVN (${item.missingCount} buổi - Ngày: ${item.dates.join(", ")}). Chi tiết: ${item.details.join("; ")}`,
                      })
                    }
                    className="p-3.5 rounded-2xl bg-white border border-orange-200 hover:border-orange-400 hover:bg-orange-50/40 hover:shadow-md transition-all cursor-pointer text-left group shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-slate-900 group-hover:text-orange-800 transition-colors">
                          {item.studentName}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500 text-white font-black shrink-0">
                          Thiếu {item.missingCount} buổi
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-semibold mt-1">
                        {item.className}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {item.noneCount > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-800 font-bold text-[11px] border border-red-200">
                            Không làm: {item.noneCount} buổi
                          </span>
                        )}
                        {item.incompleteCount > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-200">
                            Làm thiếu: {item.incompleteCount} buổi
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {item.details.slice(0, 2).map((d, dIdx) => (
                          <div key={dIdx} className="text-[11px] text-slate-600 font-medium leading-relaxed line-clamp-1">
                            • {d}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-orange-100 flex items-center justify-between text-[11px] text-orange-800 font-bold">
                      <span>💬 Bấm gửi nhắc nhở làm bù BTVN</span>
                      <span>→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: Bị nhắc nhiều lần về nề nếp & kỹ năng làm bài */}
        <div className="bg-gradient-to-br from-amber-50 via-white to-yellow-50/70 rounded-3xl p-5 sm:p-6 border-2 border-amber-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-amber-600 text-slate-950 shadow-xs font-black">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-amber-950 uppercase tracking-tight">
                    3. Học Sinh Bị Nhắc Nhiều Lần Về Nề Nếp & Kỹ Năng Làm Bài
                  </h3>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-300">
                    {repeatedIssues.length} trường hợp
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 font-medium mt-0.5">
                  Các biểu hiện lặp lại: Đi học muộn, quên dụng cụ học tập, mất trật tự, mất tập trung, tính toán ẩu, viết chữ xấu/trình bày ẩu.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {repeatedIssues.length === 0 ? (
              <div className="text-xs text-emerald-900 font-bold bg-emerald-100/90 p-3 rounded-2xl border border-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Không có học sinh nào bị nhắc nhở lặp lại. Thái độ và nề nếp của các con rất tích cực!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {repeatedIssues.map((item, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      setDirectNoticeStudent({
                        studentName: item.studentName,
                        className: item.className,
                        issue: `Thường xuyên bị nhắc nhở về [${item.issueLabel}] (${item.occurrences} lần). Chi tiết: ${item.details.join("; ")}`,
                      })
                    }
                    className="p-3.5 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-md transition-all cursor-pointer text-left group shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                          {item.studentName}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black shrink-0 border border-amber-500">
                          Nhắc {item.occurrences} lần
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-semibold mt-1">
                        {item.className}
                      </div>
                      <div className="mt-2 inline-block px-2.5 py-1 rounded-xl bg-amber-100/90 text-amber-950 font-bold text-xs border border-amber-300/80">
                        {item.issueLabel}
                      </div>
                      <div className="mt-2 space-y-1">
                        {item.details.slice(0, 2).map((d, dIdx) => (
                          <div key={dIdx} className="text-[11px] text-slate-600 font-medium leading-relaxed">
                            • {d}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-800 font-bold">
                      <span>💬 Bấm để gửi nhắc nhở Phụ huynh</span>
                      <span>→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CARD 4: Tuyên dương gương mặt tiêu biểu */}
        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/70 rounded-3xl p-5 sm:p-6 border-2 border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/80">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
                <Award className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-emerald-950 uppercase tracking-tight">
                    4. Bảng Vàng Tuyên Dương & Học Sinh Tiến Bộ
                  </h3>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-950 border border-emerald-300">
                    {praiseList.length} gương mặt
                  </span>
                </div>
                <p className="text-xs text-emerald-800/90 font-medium mt-0.5">
                  Học sinh có tinh thần tự giác cao, tích cực xây dựng bài, làm BTVN xuất sắc hoặc tiến bộ vượt bậc.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {praiseList.length === 0 ? (
              <div className="text-xs text-slate-500 font-medium p-3 text-center bg-slate-50 rounded-2xl">
                Chưa có dữ liệu tuyên dương trong giai đoạn này.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {praiseList.map((p, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all text-left shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-emerald-950">
                          {p.studentName}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                          {p.className}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 font-medium mt-2 leading-relaxed bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                        🌟 {p.highlight}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CARD 5: Lỗi sai kiến thức trọng tâm */}
        <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50/70 rounded-3xl p-5 sm:p-6 border-2 border-indigo-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-200/80">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-indigo-700 text-white shadow-xs">
                <Lightbulb className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-indigo-950 uppercase tracking-tight">
                    5. Lỗi Sai Kiến Thức Hay Gặp Cần Củng Cố
                  </h3>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-200 text-indigo-950 border border-indigo-300">
                    {commonMisconceptions.length} lưu ý
                  </span>
                </div>
                <p className="text-xs text-indigo-800/90 font-medium mt-0.5">
                  Các bẫy toán học và lỗi trình bày giáo viên & trợ giảng cần lưu ý sửa ngay trong buổi học tới.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {commonMisconceptions.map((m, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-white border border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all text-left text-xs text-indigo-950 font-medium leading-relaxed shadow-xs flex items-start gap-2.5"
                >
                  <span className="p-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold shrink-0 text-[11px]">
                    #{i + 1}
                  </span>
                  <span className="pt-0.5">{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN BULLETIN CONTENT CONTAINER */}
      {activeBulletin ? (
        <div className="bg-white rounded-3xl border-2 border-blue-200 shadow-lg overflow-hidden transition-all">
          {/* Bulletin Toolbar Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-400 text-slate-950 font-black shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">
                  {activeBulletin.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-blue-200 font-medium mt-0.5">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-cyan-300" />
                    {activeBulletin.createdAt}
                  </span>
                  <span>•</span>
                  <span className="text-cyan-300 font-bold">
                    {activeBulletin.generatedBy}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions for the Bulletin */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyBulletin}
                className="btn-3d-amber text-xs px-3 py-2 flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-900" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-950" />
                    <span>Copy gửi Zalo</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyWarningSection}
                title="Sao chép riêng danh sách nhắc nhở & chuyên cần"
                className="btn-3d-secondary text-xs px-3 py-2 flex items-center gap-1.5"
              >
                {copiedSection === "warnings" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã copy cảnh báo!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Copy mục Nhắc nhở</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                title="In hoặc xuất PDF bản tin"
                className="p-2 rounded-xl bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-700/80 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bulletin Markdown Render Area */}
          <div className="p-6 sm:p-8 bg-slate-50/50">
            <div className="prose max-w-none text-slate-800 leading-relaxed font-sans space-y-4">
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-950 font-medium flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Bản tin được AI tổng hợp dựa trên <strong>{activeBulletin.summary?.approvedReports || approvedReports.length} ca dạy đã được Thầy Thắng duyệt</strong>.
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-200 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-300 shrink-0">
                  {activeBulletin.timeframeLabel}
                </span>
              </div>

              {/* Formatted Markdown */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs text-sm sm:text-base leading-relaxed">
                <Markdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl sm:text-2xl font-black text-blue-950 border-b-2 border-blue-200 pb-2 mb-4">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-black text-blue-900 mt-6 mb-3">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-black text-slate-900 mt-4 mb-2">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-slate-700 text-sm leading-relaxed mb-3">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1.5 text-slate-700 text-sm mb-3">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-slate-700 text-sm">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-black text-slate-950">
                        {children}
                      </strong>
                    ),
                    hr: () => <hr className="my-4 border-slate-200" />,
                  }}
                >
                  {activeBulletin.content}
                </Markdown>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-900 flex items-center justify-center mx-auto shadow-sm">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-black text-slate-900">
              Chưa có bản tin nào cho giai đoạn này
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Nhấn nút <strong>"Tạo Bản tin AI ngay"</strong> bên trên để Gemini tự động quét tất cả các báo cáo ca dạy đã được duyệt và lập thông báo hoàn chỉnh!
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateBulletin}
            disabled={isGenerating}
            className="btn-3d-amber text-xs px-5 py-2.5"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Tạo bản tin với AI Gemini</span>
          </button>
        </div>
      )}

      {/* POPUP: Quick Contact & Direct Notice to Parent */}
      {directNoticeStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-blue-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Nhắc Nhở Học Vụ & Đồng Hành
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Học sinh: <strong className="text-blue-950">{directNoticeStudent.studentName}</strong> ({directNoticeStudent.className})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDirectNoticeStudent(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium space-y-2">
              <span className="font-black text-amber-900 block uppercase">
                Nội dung vấn đề ghi nhận từ ca dạy:
              </span>
              <p className="leading-relaxed">{directNoticeStudent.issue}</p>
            </div>

            {/* Suggested Message Template for Teacher/Assistant to send to Parent */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800">
                Mẫu tin nhắn Zalo gửi Phụ huynh:
              </label>
              <textarea
                readOnly
                rows={4}
                value={`Dạ em chào Quý Phụ huynh em ${directNoticeStudent.studentName} ạ! Thầy Thắng và CLB Toán xin phép gửi lời chào đến gia đình. Trong các ca học vừa qua, CLB nhận thấy: ${directNoticeStudent.issue}. Kính mong Quý Phụ huynh cùng CLB đôn đốc, đồng hành nhắc nhở con để con đạt kết quả tốt nhất ạ! Em cảm ơn Quý Phụ huynh.`}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 font-sans leading-relaxed text-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Dạ em chào Quý Phụ huynh em ${directNoticeStudent.studentName} ạ! Thầy Thắng và CLB Toán xin phép gửi lời chào đến gia đình. Trong các ca học vừa qua, CLB nhận thấy: ${directNoticeStudent.issue}. Kính mong Quý Phụ huynh cùng CLB đôn đốc, đồng hành nhắc nhở con để con đạt kết quả tốt nhất ạ! Em cảm ơn Quý Phụ huynh.`
                  );
                  alert("Đã sao chép tin nhắn gửi Phụ huynh!");
                  setDirectNoticeStudent(null);
                }}
                className="btn-3d-primary text-xs px-4 py-2"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Sao chép tin nhắn Zalo</span>
              </button>
              <button
                type="button"
                onClick={() => setDirectNoticeStudent(null)}
                className="btn-3d-secondary text-xs px-4 py-2"
              >
                <span>Đóng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Bulletin History */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-blue-200 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-950 font-bold">
                  <History className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    Lịch Sử Các Bản Tin AI Đã Tạo
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Tổng cộng có {bulletins.length} bản tin được lưu trữ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-700 font-black text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2.5 p-1">
              {bulletins.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    activeBulletin?.id === b.id
                      ? "bg-blue-50/90 border-blue-400 ring-2 ring-blue-300/50"
                      : "bg-slate-50/80 border-slate-200 hover:bg-slate-100/80"
                  }`}
                >
                  <div
                    onClick={() => {
                      setActiveBulletin(b);
                      setShowHistoryModal(false);
                    }}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-blue-950 truncate">
                        {b.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                        {b.period === "monthly" ? "Hàng tháng" : "Hàng tuần"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-1">
                      <span>{b.timeframeLabel}</span>
                      <span>•</span>
                      <span>Tạo lúc: {b.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setActiveBulletin(b);
                        setShowHistoryModal(false);
                      }}
                      className="text-xs font-bold text-blue-700 hover:text-blue-950 hover:underline cursor-pointer"
                    >
                      Xem
                    </button>
                    {isAdmin && bulletins.length > 1 && (
                      <button
                        onClick={() => {
                          storageService.deleteBulletin(b.id);
                          const rest = storageService.getBulletins();
                          setBulletins(rest);
                          if (activeBulletin?.id === b.id) {
                            setActiveBulletin(rest[0] || null);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
