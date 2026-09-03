import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Coins,
  DollarSign,
  Wallet,
  Receipt,
  Calendar,
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  ArrowUpDown,
  CreditCard,
  Building,
  Phone,
  Mail,
  UserCheck,
  HelpCircle,
  FileText,
  X,
  QrCode,
  Upload,
  Maximize2,
} from "lucide-react";
import { Assistant, Report, TimetableSlot, ClassItem } from "../types";
import { storageService } from "../services/storage";
import { compressImageFile } from "../utils/imageUtils";
import * as XLSX from "xlsx";

interface AssistantPayrollRecord {
  assistantId: string;
  assistantName: string;
  phone: string;
  email: string;
  bankInfo?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  qrCodeUrl?: string;
  assignedClasses: string[];
  totalSessions: number;
  completedSessions: number;
  pendingReportSessions: number;
  sessionList: Array<{
    id: string;
    date: string;
    className: string;
    shiftName: string;
    lessonTopic: string;
    hasReport: boolean;
    reportStatus?: string;
  }>;
  ratePerSession: number;
  sessionSalary: number;
  allowance: number; // Phụ cấp
  bonus: number; // Thưởng
  deduction: number; // Khấu trừ
  netSalary: number; // Thực nhận
  paymentStatus: "unpaid" | "paid" | "partial";
  paidDate?: string;
  paymentMethod?: "transfer" | "cash";
  notes?: string;
}

interface AssistantPayrollSectionProps {
  initialMonth?: string;
}

// Format VND currency
const formatVND = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// Format Month display
const formatMonthDisplay = (ym: string): string => {
  if (!ym || ym === "all") return "Tất cả các tháng";
  const [year, month] = ym.split("-");
  return `Tháng ${month}/${year}`;
};

export const AssistantPayrollSection: React.FC<AssistantPayrollSectionProps> = ({
  initialMonth,
}) => {
  const [dataVersion, setDataVersion] = useState(0);
  const [assistants, setAssistants] = useState<Assistant[]>(() => storageService.getAssistants());

  useEffect(() => {
    const handleUpdate = () => {
      setAssistants(storageService.getAssistants());
      setDataVersion((v) => v + 1);
    };
    window.addEventListener("clb-storage-updated", handleUpdate);
    return () => window.removeEventListener("clb-storage-updated", handleUpdate);
  }, []);

  const classes = useMemo(() => storageService.getClasses(), [dataVersion]);
  const attendanceRecords = useMemo(() => storageService.getAssistantAttendance(), [dataVersion]);
  const settings = useMemo(() => storageService.getTimetableSettings(), [dataVersion]);
  const shifts = settings.shifts;

  // Current selected month: default to current month YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (initialMonth && initialMonth !== "all") return initialMonth;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  });

  // Default base rate per session (Default: 120.000đ / ca)
  const [defaultSessionRate, setDefaultSessionRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("clb_default_assistant_session_rate");
      if (saved) return Number(saved);
    } catch {}
    return 120000;
  });

  // Custom adjustments stored in localStorage per month & assistant
  // Key format: clb_payroll_adj_{YYYY-MM}
  const [payrollAdjustments, setPayrollAdjustments] = useState<
    Record<
      string,
      {
        ratePerSession?: number;
        allowance?: number;
        bonus?: number;
        deduction?: number;
        paymentStatus?: "unpaid" | "paid" | "partial";
        paidDate?: string;
        paymentMethod?: "transfer" | "cash";
        notes?: string;
        bankInfo?: string;
        qrCodeUrl?: string;
      }
    >
  >(() => {
    try {
      const saved = localStorage.getItem(`clb_payroll_adj_${selectedMonth}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");
  const [selectedAssistantDetail, setSelectedAssistantDetail] = useState<AssistantPayrollRecord | null>(null);
  const [editingAssistant, setEditingAssistant] = useState<AssistantPayrollRecord | null>(null);
  const [viewingPayslip, setViewingPayslip] = useState<AssistantPayrollRecord | null>(null);
  const [zoomQrModal, setZoomQrModal] = useState<{
    name: string;
    qrUrl: string;
    bankInfo: string;
    netSalary: number;
  } | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [showMonthPickerModal, setShowMonthPickerModal] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(() => {
    const parts = (selectedMonth || "").split("-");
    return parts[0] ? Number(parts[0]) : new Date().getFullYear();
  });

  // Navigate month by offset (-1 or +1)
  const handleOffsetMonth = (offset: number) => {
    const [yStr, mStr] = selectedMonth.split("-");
    let y = parseInt(yStr, 10) || new Date().getFullYear();
    let m = parseInt(mStr, 10) || (new Date().getMonth() + 1);
    m += offset;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    const nextMonthStr = `${y}-${String(m).padStart(2, "0")}`;
    setSelectedMonth(nextMonthStr);
    setPickerYear(y);
  };

  // Reload adjustments when month changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`clb_payroll_adj_${selectedMonth}`);
      if (saved) {
        setPayrollAdjustments(JSON.parse(saved));
      } else {
        setPayrollAdjustments({});
      }
    } catch {}
  }, [selectedMonth]);

  // Save adjustments to localStorage
  const saveAdjustment = (
    assistantId: string,
    updates: Partial<{
      ratePerSession: number;
      allowance: number;
      bonus: number;
      deduction: number;
      paymentStatus: "unpaid" | "paid" | "partial";
      paidDate: string;
      paymentMethod: "transfer" | "cash";
      notes: string;
      bankInfo: string;
      qrCodeUrl: string;
    }>
  ) => {
    const next = {
      ...payrollAdjustments,
      [assistantId]: {
        ...(payrollAdjustments[assistantId] || {}),
        ...updates,
      },
    };
    setPayrollAdjustments(next);
    try {
      localStorage.setItem(`clb_payroll_adj_${selectedMonth}`, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to save payroll adjustments", e);
    }
  };

  // Upload QR image directly from Payslip modal or Adjustment modal
  const handleUploadQrForPayslip = async (
    assistantId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const qrUrl = await compressImageFile(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.82,
      });

      saveAdjustment(assistantId, { qrCodeUrl: qrUrl });

      const currentAssistants = storageService.getAssistants();
      const targetAsst = currentAssistants.find((a) => a.id === assistantId);
      if (targetAsst) {
        storageService.saveAssistant({
          ...targetAsst,
          qrCodeUrl: qrUrl,
        });
        setAssistants(storageService.getAssistants());
      }

      if (viewingPayslip && viewingPayslip.assistantId === assistantId) {
        setViewingPayslip({
          ...viewingPayslip,
          qrCodeUrl: qrUrl,
        });
      }
    } catch (err) {
      console.warn("Failed to compress QR image:", err);
    }
  };

  // Save global default session rate
  const handleUpdateDefaultRate = (newRate: number) => {
    setDefaultSessionRate(newRate);
    try {
      localStorage.setItem("clb_default_assistant_session_rate", String(newRate));
    } catch {}
  };

  // Available months from timetable and reports
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    attendanceRecords.forEach((record) => {
      if (record.date) {
        months.add(record.date.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [attendanceRecords]);

  // Compute payroll records for all assistants
  const payrollRecords = useMemo(() => {
    const list: AssistantPayrollRecord[] = [];
    assistants.forEach((asst) => {
      // Find all attendance records where this assistant is present in this month
      const assistantAttendances = attendanceRecords.filter((rec) => {
        if (!rec.date || !rec.date.startsWith(selectedMonth)) return false;
        return rec.assistantIds.includes(asst.id);
      });

      const sessionList = assistantAttendances.map(att => {
        const shiftInfo = shifts.find(s => s.id === att.shiftId);
        return {
          id: att.id,
          date: att.date,
          className: "Ca dạy tại Trung tâm", // General since attendance is per shift now, not per class
          shiftName: shiftInfo ? shiftInfo.name : att.shiftId,
          lessonTopic: att.notes || "Điểm danh trợ giảng",
          hasReport: true, // We don't use reports for this anymore
          reportStatus: "approved",
        };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const totalSessions = sessionList.length;
      const completedSessions = totalSessions;
      const pendingReportSessions = 0;

      // Adjustments for this assistant
      const adj = payrollAdjustments[asst.id] || {};
      const ratePerSession = adj.ratePerSession ?? defaultSessionRate;
      const allowance = adj.allowance ?? 0;
      const bonus = adj.bonus ?? 0;
      const deduction = adj.deduction ?? 0;
      const sessionSalary = totalSessions * ratePerSession;
      const netSalary = Math.max(0, sessionSalary + allowance + bonus - deduction);

      const assignedClassNames = asst.classes
        .map((cid) => {
          const cls = classes.find((c) => c.id === cid);
          return cls ? cls.name.split("–")[0].trim() : cid;
        })
        .filter(Boolean);

      const formattedBankInfo =
        adj.bankInfo ||
        (asst.bankAccountNumber
          ? `${asst.bankName || "MB Bank"} - ${asst.bankAccountNumber} - ${(asst.bankAccountName || asst.name).toUpperCase()}`
          : "MB Bank - 9999.8888.66 - " + asst.name.toUpperCase());
      const assistantQrCode = adj.qrCodeUrl || asst.qrCodeUrl;

      list.push({
        assistantId: asst.id,
        assistantName: asst.name,
        phone: asst.phone,
        email: asst.email,
        bankInfo: formattedBankInfo,
        bankName: asst.bankName || "MB Bank",
        bankAccountNumber: asst.bankAccountNumber || "9999888866",
        bankAccountName: (asst.bankAccountName || asst.name).toUpperCase(),
        qrCodeUrl: assistantQrCode,
        assignedClasses: assignedClassNames,
        totalSessions,
        completedSessions,
        pendingReportSessions,
        sessionList,
        ratePerSession,
        sessionSalary,
        allowance,
        bonus,
        deduction,
        netSalary,
        paymentStatus: adj.paymentStatus || "unpaid",
        paidDate: adj.paidDate,
        paymentMethod: adj.paymentMethod || "transfer",
        notes: adj.notes || "",
      });
    });

    return list;
  }, [
    assistants,
    classes,
    attendanceRecords,
    shifts,
    selectedMonth,
    defaultSessionRate,
    payrollAdjustments,
  ]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return payrollRecords.filter((rec) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = rec.assistantName.toLowerCase().includes(q);
        const matchPhone = rec.phone.includes(q);
        if (!matchName && !matchPhone) return false;
      }
      // Status
      if (filterStatus === "paid" && rec.paymentStatus !== "paid") return false;
      if (filterStatus === "unpaid" && rec.paymentStatus === "paid") return false;
      return true;
    });
  }, [payrollRecords, searchQuery, filterStatus]);

  // Summary KPI stats
  const stats = useMemo(() => {
    const totalAssistants = payrollRecords.length;
    const totalTeachingSessions = payrollRecords.reduce((acc, r) => acc + r.totalSessions, 0);
    const totalPayrollBudget = payrollRecords.reduce((acc, r) => acc + r.netSalary, 0);
    const totalPaidAmount = payrollRecords
      .filter((r) => r.paymentStatus === "paid")
      .reduce((acc, r) => acc + r.netSalary, 0);
    const totalPendingAmount = totalPayrollBudget - totalPaidAmount;
    const paidCount = payrollRecords.filter((r) => r.paymentStatus === "paid").length;

    return {
      totalAssistants,
      totalTeachingSessions,
      totalPayrollBudget,
      totalPaidAmount,
      totalPendingAmount,
      paidCount,
    };
  }, [payrollRecords]);

  // Quick mark paid / unpaid
  const handleTogglePaymentStatus = (rec: AssistantPayrollRecord) => {
    const nextStatus = rec.paymentStatus === "paid" ? "unpaid" : "paid";
    saveAdjustment(rec.assistantId, {
      paymentStatus: nextStatus,
      paidDate: nextStatus === "paid" ? new Date().toISOString().slice(0, 10) : undefined,
    });
  };

  // Export full Payroll to Excel
  const handleExportPayrollExcel = () => {
    const wsData: any[][] = [];

    wsData.push([
      `BẢNG TỔNG HỢP LƯƠNG & THÙ LAO TRỢ GIẢNG – ${formatMonthDisplay(selectedMonth).toUpperCase()}`,
    ]);
    wsData.push([
      `CLB TOÁN THẦY THẮNG • Xuất ngày: ${new Date().toLocaleDateString("vi-VN")}`,
    ]);
    wsData.push([
      `Tổng số trợ giảng: ${stats.totalAssistants} | Tổng số ca dạy: ${stats.totalTeachingSessions} | Tổng quỹ lương: ${formatVND(
        stats.totalPayrollBudget
      )}`,
    ]);
    wsData.push([]);

    // Headers
    wsData.push([
      "STT",
      "Họ và tên Trợ Giảng",
      "Số điện thoại",
      "Lớp phụ trách",
      "Số ca dạy",
      "Đơn giá / Ca (VNĐ)",
      "Lương theo ca (VNĐ)",
      "Phụ cấp (VNĐ)",
      "Thưởng (VNĐ)",
      "Khấu trừ (VNĐ)",
      "THỰC NHẬN (VNĐ)",
      "Trạng thái chi trả",
      "Ngày chi trả",
      "Hình thức",
      "Thông tin nhận lương (STK)",
      "Ghi chú",
    ]);

    payrollRecords.forEach((rec, idx) => {
      wsData.push([
        idx + 1,
        rec.assistantName,
        rec.phone,
        rec.assignedClasses.join(", "),
        rec.totalSessions,
        rec.ratePerSession,
        rec.sessionSalary,
        rec.allowance,
        rec.bonus,
        rec.deduction,
        rec.netSalary,
        rec.paymentStatus === "paid"
          ? "ĐÃ THANH TOÁN"
          : rec.paymentStatus === "partial"
          ? "ĐÃ TẠM ỨNG"
          : "CHƯA THANH TOÁN",
        rec.paidDate || "-",
        rec.paymentMethod === "transfer" ? "Chuyển khoản" : "Tiền mặt",
        rec.bankInfo,
        rec.notes || "",
      ]);
    });

    wsData.push([]);
    wsData.push([
      "TỔNG CỘNG",
      "",
      "",
      "",
      stats.totalTeachingSessions,
      "",
      "",
      "",
      "",
      "",
      stats.totalPayrollBudget,
      `Đã trả: ${stats.paidCount}/${stats.totalAssistants} TG`,
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set columns width
    ws["!cols"] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 14 },
      { wch: 20 },
      { wch: 10 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 30 },
      { wch: 25 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BangLuongTroGiang");
    XLSX.writeFile(
      wb,
      `Bang_Luong_Tro_Giang_${selectedMonth.replace("-", "_")}.xlsx`
    );
  };

  // Copy text payslip for Zalo
  const handleCopyPayslipText = (rec: AssistantPayrollRecord) => {
    const text = `📌 PHIẾU BÁO LƯƠNG TRỢ GIẢNG – ${formatMonthDisplay(selectedMonth).toUpperCase()}
👤 Trợ giảng: ${rec.assistantName}
📞 Số điện thoại: ${rec.phone}
🏫 Lớp phụ trách: ${rec.assignedClasses.join(", ") || "Toàn bộ"}

📊 THỐNG KÊ CA DẠY:
• Tổng số ca đã trợ giảng: ${rec.totalSessions} ca
• Đơn giá / ca: ${formatVND(rec.ratePerSession)}
💰 Lương theo ca: ${formatVND(rec.sessionSalary)}
🎁 Phụ cấp: ${formatVND(rec.allowance)}
🌟 Tiền thưởng: ${formatVND(rec.bonus)}
🔻 Khấu trừ: ${formatVND(rec.deduction)}

👉 TỔNG THỰC NHẬN: ${formatVND(rec.netSalary)}
🏦 Thông tin thanh toán: ${rec.bankInfo}
⚡ Trạng thái: ${rec.paymentStatus === "paid" ? "✅ ĐÃ CHUYỂN KHOẢN" : "⏳ CHỜ THANH TOÁN"}
Ghi chú: ${rec.notes || "Thầy cảm ơn em đã đồng hành và hỗ trợ lớp rất chu đáo!"}
-----------------------------
CLB TOÁN THẦY THẮNG • Hotline: 0988.123.456`;

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative background shapes */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Coins className="w-4 h-4 text-emerald-400" />
                Quản Lý Tài Chính & Thù Lao
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 font-black text-xs">
                {formatMonthDisplay(selectedMonth)}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Wallet className="w-8 h-8 text-emerald-400" />
              <span>Bảng Lương & Thù Lao Trợ Giảng</span>
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/80 font-medium max-w-3xl leading-relaxed">
              Tự động tổng hợp số ca trợ giảng thực tế từ sổ lịch sử dạy học và báo cáo ca dạy. 
              Dễ dàng tùy chỉnh đơn giá, phụ cấp, tiền thưởng và xuất phiếu lương gửi Zalo hoặc Excel.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleExportPayrollExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer"
              title="Xuất toàn bộ bảng lương trợ giảng tháng này ra file Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              <span>Xuất Bảng Lương Excel</span>
            </button>
          </div>
        </div>

        {/* TIME PICKER & CONFIGURATION STRIP */}
        <div className="mt-6 pt-5 border-t border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Vietnamese Month selector */}
            <div className="relative flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-emerald-500/40 shadow-inner">
              <Calendar className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
              <span className="text-xs font-bold text-emerald-200">Chọn Tháng:</span>

              {/* Prev month button */}
              <button
                type="button"
                onClick={() => handleOffsetMonth(-1)}
                className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-emerald-600/50 text-emerald-200 hover:text-white transition-colors cursor-pointer border border-slate-700"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Current Month Dropdown button */}
              <button
                type="button"
                onClick={() => {
                  const parts = selectedMonth.split("-");
                  if (parts[0]) setPickerYear(Number(parts[0]));
                  setShowMonthPickerModal(!showMonthPickerModal);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/60 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <span>{formatMonthDisplay(selectedMonth)}</span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
              </button>

              {/* Next month button */}
              <button
                type="button"
                onClick={() => handleOffsetMonth(1)}
                className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-emerald-600/50 text-emerald-200 hover:text-white transition-colors cursor-pointer border border-slate-700"
                title="Tháng sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Quick Vietnamese Month Dropdown / Picker Modal */}
              {showMonthPickerModal && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMonthPickerModal(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 bg-slate-900 text-white rounded-2xl border-2 border-emerald-500 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                          Chọn Tháng (Tiếng Việt)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMonthPickerModal(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Year Selector */}
                    <div className="flex items-center justify-between my-3 px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setPickerYear((y) => y - 1)}
                        className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-black text-sm text-amber-300">
                        Năm {pickerYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPickerYear((y) => y + 1)}
                        className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 12 Months Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }, (_, i) => {
                        const mNum = i + 1;
                        const mStr = String(mNum).padStart(2, "0");
                        const ymVal = `${pickerYear}-${mStr}`;
                        const isSelected = selectedMonth === ymVal;

                        // Check if this month has reports/sessions
                        const hasData = availableMonths.includes(ymVal);

                        return (
                          <button
                            key={mNum}
                            type="button"
                            onClick={() => {
                              setSelectedMonth(ymVal);
                              setShowMonthPickerModal(false);
                            }}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                              isSelected
                                ? "bg-emerald-500 text-slate-950 font-black shadow-md ring-2 ring-emerald-300"
                                : "bg-slate-800 hover:bg-emerald-900/60 text-slate-200 hover:text-emerald-200 border border-slate-700/60"
                            }`}
                          >
                            <span>Tháng {mNum}</span>
                            {hasData && (
                              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-slate-950" : "bg-emerald-400"}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick helper current month */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const curYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                          setSelectedMonth(curYM);
                          setPickerYear(now.getFullYear());
                          setShowMonthPickerModal(false);
                        }}
                        className="text-emerald-400 hover:underline font-bold"
                      >
                        Tháng hiện tại
                      </button>
                      <span className="text-slate-500 font-medium">
                        Đang chọn: {formatMonthDisplay(selectedMonth)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Default Session Rate Editor */}
            <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-emerald-700/50">
              <DollarSign className="w-4 h-4 text-amber-400 ml-2 shrink-0" />
              <span className="text-xs font-bold text-amber-200">Đơn giá chuẩn/ca:</span>
              <select
                value={defaultSessionRate}
                onChange={(e) => handleUpdateDefaultRate(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-amber-600/60 text-amber-300 font-black text-xs outline-hidden cursor-pointer"
              >
                <option value={100000}>100.000 đ / ca</option>
                <option value={120000}>120.000 đ / ca</option>
                <option value={130000}>130.000 đ / ca</option>
                <option value={150000}>150.000 đ / ca</option>
                <option value={180000}>180.000 đ / ca</option>
                <option value={200000}>200.000 đ / ca</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-emerald-200/80 font-semibold flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>CLB Toán Thầy Thắng • {stats.totalAssistants} Trợ giảng tích cực</span>
          </div>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-md flex flex-col justify-between space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng Quỹ Lương
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black border border-emerald-300">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950">
              {formatVND(stats.totalPayrollBudget)}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              Cần chi trả trong {formatMonthDisplay(selectedMonth)}
            </div>
          </div>
        </div>

        {/* Total Teaching Sessions */}
        <div className="bg-white rounded-3xl p-5 border-2 border-blue-200 shadow-md flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng Ca Trợ Giảng
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black border border-blue-300">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-950">
              {stats.totalTeachingSessions} <span className="text-sm font-bold text-slate-500">ca dạy</span>
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              Ghi nhận từ {stats.totalAssistants} trợ giảng
            </div>
          </div>
        </div>

        {/* Paid Amount */}
        <div className="bg-white rounded-3xl p-5 border-2 border-teal-200 shadow-md flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đã Thanh Toán
            </span>
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-black border border-teal-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-teal-950">
              {formatVND(stats.totalPaidAmount)}
            </div>
            <div className="text-xs text-teal-700 font-bold mt-0.5">
              {stats.paidCount} / {stats.totalAssistants} Trợ giảng đã nhận
            </div>
          </div>
        </div>

        {/* Pending Amount */}
        <div className="bg-white rounded-3xl p-5 border-2 border-amber-200 shadow-md flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Còn Phải Chi Trả
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black border border-amber-300">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-950">
              {formatVND(stats.totalPendingAmount)}
            </div>
            <div className="text-xs text-amber-800 font-bold mt-0.5">
              {stats.totalAssistants - stats.paidCount} Trợ giảng đang chờ duyệt
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm trợ giảng theo tên, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white text-xs font-semibold text-slate-800 outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500">Trạng thái:</span>
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                filterStatus === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất cả ({payrollRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("paid")}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                filterStatus === "paid"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              Đã chi trả ({stats.paidCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("unpaid")}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                filterStatus === "unpaid"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-amber-700"
              }`}
            >
              Chưa chi trả ({stats.totalAssistants - stats.paidCount})
            </button>
          </div>
        </div>
      </div>

      {/* MAIN PAYROLL TABLE */}
      <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-md overflow-hidden space-y-3 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
              <span>📋 Danh Sách Bảng Lương Trợ Giảng</span>
              <span className="px-2.5 py-0.5 rounded-xl bg-emerald-100 text-emerald-950 text-xs font-black border border-emerald-300">
                {filteredRecords.length} Trợ Giảng
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Nhấn vào nút chỉnh sửa để điều chỉnh phụ cấp, tiền thưởng, đơn giá hoặc xem chi tiết từng ca dạy.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border-2 border-slate-300 rounded-2xl shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider sticky top-0 z-10">
              <tr>
                <th className="p-3 w-12 text-center border-r border-slate-700">STT</th>
                <th className="p-3 w-56 border-r border-slate-700">Trợ Giảng & Liên Hệ</th>
                <th className="p-3 w-36 border-r border-slate-700">Lớp Phụ Trách</th>
                <th className="p-3 w-28 text-center border-r border-slate-700">Số Ca Dạy</th>
                <th className="p-3 w-32 text-right border-r border-slate-700">Đơn Giá / Ca</th>
                <th className="p-3 w-32 text-right border-r border-slate-700">Lương Ca</th>
                <th className="p-3 w-28 text-right border-r border-slate-700">Phụ Cấp</th>
                <th className="p-3 w-28 text-right border-r border-slate-700">Thưởng / Phạt</th>
                <th className="p-3 w-36 text-right border-r border-slate-700 bg-emerald-950 text-emerald-300">
                  THỰC NHẬN
                </th>
                <th className="p-3 w-36 text-center border-r border-slate-700">Trạng Thái</th>
                <th className="p-3 w-40 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-200">
              {filteredRecords.map((rec, idx) => {
                const isEven = idx % 2 === 0;
                const rowBg = isEven
                  ? "bg-white hover:bg-amber-50/80"
                  : "bg-amber-50/40 hover:bg-amber-100/80";

                return (
                  <tr key={rec.assistantId} className={`${rowBg} transition-colors border-b border-slate-300`}>
                    {/* STT */}
                    <td className="p-3 text-center border-r border-slate-300">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-orange-600 text-white font-black text-xs border border-orange-700 shadow-xs">
                        {idx + 1}
                      </span>
                    </td>

                    {/* Assistant Name & Contact */}
                    <td className="p-3 border-r border-slate-300">
                      <div className="font-black text-slate-950 text-sm">
                        {rec.assistantName}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {rec.phone}
                        </span>
                      </div>
                    </td>

                    {/* Assigned Classes */}
                    <td className="p-3 border-r border-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {rec.assignedClasses.length > 0 ? (
                          rec.assignedClasses.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 font-black text-[10px]"
                            >
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Toàn bộ</span>
                        )}
                      </div>
                    </td>

                    {/* Teaching Sessions */}
                    <td className="p-3 text-center border-r border-slate-300">
                      <button
                        type="button"
                        onClick={() => setSelectedAssistantDetail(rec)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-950 hover:bg-indigo-200 border border-indigo-300 font-black text-xs transition-colors cursor-pointer"
                        title="Xem danh sách các ca dạy chi tiết"
                      >
                        <span>{rec.totalSessions} ca</span>
                        <Eye className="w-3.5 h-3.5 text-indigo-700" />
                      </button>
                    </td>

                    {/* Rate per session */}
                    <td className="p-3 text-right font-bold text-slate-700 border-r border-slate-300">
                      {formatVND(rec.ratePerSession)}
                    </td>

                    {/* Session Salary */}
                    <td className="p-3 text-right font-black text-slate-900 border-r border-slate-300">
                      {formatVND(rec.sessionSalary)}
                    </td>

                    {/* Allowance */}
                    <td className="p-3 text-right border-r border-slate-300 font-bold text-teal-800">
                      {rec.allowance > 0 ? `+${formatVND(rec.allowance)}` : "-"}
                    </td>

                    {/* Bonus / Deduction */}
                    <td className="p-3 text-right border-r border-slate-300">
                      {rec.bonus > 0 && (
                        <div className="text-emerald-700 font-black text-[11px]">
                          +{formatVND(rec.bonus)}
                        </div>
                      )}
                      {rec.deduction > 0 && (
                        <div className="text-rose-700 font-black text-[11px]">
                          -{formatVND(rec.deduction)}
                        </div>
                      )}
                      {rec.bonus === 0 && rec.deduction === 0 && (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Net Salary (Highlight) */}
                    <td className="p-3 text-right border-r border-slate-300 bg-emerald-50/70 font-black text-sm text-emerald-950">
                      {formatVND(rec.netSalary)}
                    </td>

                    {/* Payment Status Badge */}
                    <td className="p-3 text-center border-r border-slate-300">
                      <button
                        type="button"
                        onClick={() => handleTogglePaymentStatus(rec)}
                        className={`px-3 py-1.5 rounded-xl font-black text-[11px] border shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto ${
                          rec.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-950 border-emerald-400 hover:bg-emerald-200"
                            : "bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200"
                        }`}
                        title="Bấm để chuyển đổi trạng thái thanh toán"
                      >
                        {rec.paymentStatus === "paid" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>Đã Chi Trả</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>Chưa Chi Trả</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Compensation Adjustments */}
                        <button
                          type="button"
                          onClick={() => setEditingAssistant(rec)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-900 border border-slate-300 transition-colors cursor-pointer"
                          title="Điều chỉnh phụ cấp, tiền thưởng, đơn giá"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* View Payslip */}
                        <button
                          type="button"
                          onClick={() => setViewingPayslip(rec)}
                          className="p-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 transition-colors cursor-pointer"
                          title="Xem & In phiếu lương cá nhân"
                        >
                          <Receipt className="w-4 h-4 text-emerald-800" />
                        </button>

                        {/* Quick View QR code for payment */}
                        {rec.qrCodeUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setZoomQrModal({
                                name: rec.assistantName,
                                qrUrl: rec.qrCodeUrl!,
                                bankInfo: rec.bankInfo || "",
                                netSalary: rec.netSalary,
                              })
                            }
                            className="p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-colors cursor-pointer"
                            title="Quét mã QR chuyển tiền nhanh"
                          >
                            <QrCode className="w-4 h-4 text-amber-800" />
                          </button>
                        ) : null}

                        {/* Copy for Zalo */}
                        <button
                          type="button"
                          onClick={() => handleCopyPayslipText(rec)}
                          className="p-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-950 border border-blue-300 transition-colors cursor-pointer"
                          title="Sao chép nội dung báo lương gửi Zalo"
                        >
                          <Copy className="w-4 h-4 text-blue-800" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot className="bg-slate-900 text-white font-black text-xs">
              <tr>
                <td colSpan={3} className="p-3.5 text-right uppercase tracking-wider">
                  TỔNG CỘNG ({filteredRecords.length} TRỢ GIẢNG):
                </td>
                <td className="p-3.5 text-center text-amber-300 text-sm font-black">
                  {filteredRecords.reduce((acc, r) => acc + r.totalSessions, 0)} ca
                </td>
                <td className="p-3.5 text-right">-</td>
                <td className="p-3.5 text-right">
                  {formatVND(filteredRecords.reduce((acc, r) => acc + r.sessionSalary, 0))}
                </td>
                <td className="p-3.5 text-right text-teal-300">
                  +{formatVND(filteredRecords.reduce((acc, r) => acc + r.allowance, 0))}
                </td>
                <td className="p-3.5 text-right text-emerald-300">
                  +{formatVND(filteredRecords.reduce((acc, r) => acc + r.bonus - r.deduction, 0))}
                </td>
                <td className="p-3.5 text-right text-emerald-400 text-base font-black bg-emerald-950">
                  {formatVND(filteredRecords.reduce((acc, r) => acc + r.netSalary, 0))}
                </td>
                <td colSpan={2} className="p-3.5 text-center text-slate-300 text-[11px]">
                  Đã thanh toán: {filteredRecords.filter((r) => r.paymentStatus === "paid").length} /{" "}
                  {filteredRecords.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MODAL 1: DRILL-DOWN DETAILED SESSIONS OF ASSISTANT */}
      {selectedAssistantDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h4 className="font-black text-base">
                    Chi Tiết Ca Dạy: {selectedAssistantDetail.assistantName}
                  </h4>
                  <p className="text-xs text-indigo-200">
                    {formatMonthDisplay(selectedMonth)} • Tổng số: {selectedAssistantDetail.totalSessions} ca dạy
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssistantDetail(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {selectedAssistantDetail.sessionList.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Chưa ghi nhận ca dạy nào của trợ giảng trong tháng này.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border-2 border-slate-200 rounded-2xl overflow-hidden">
                  {selectedAssistantDetail.sessionList.map((ses, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3.5 bg-white hover:bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-900 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200">
                          {sIdx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs text-slate-900">
                              {ses.date}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 font-bold text-[11px] border border-blue-200">
                              {ses.className}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                              {ses.shiftName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-1">
                            📚 {ses.lessonTopic}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ses.hasReport ? (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-950 font-bold text-[11px] border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            Đã Nộp Báo Cáo
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-950 font-bold text-[11px] border border-amber-300 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                            Chưa Có Báo Cáo
                          </span>
                        )}
                        <span className="font-black text-xs text-slate-900">
                          {formatVND(selectedAssistantDetail.ratePerSession)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700">
                Thành tiền:{" "}
                <strong className="text-emerald-800 text-sm">
                  {formatVND(selectedAssistantDetail.sessionSalary)}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssistantDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT COMPENSATION (RATE, ALLOWANCE, BONUS, DEDUCTION, NOTES) */}
      {editingAssistant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h4 className="font-black text-base">
                    Điều Chỉnh Thù Lao: {editingAssistant.assistantName}
                  </h4>
                  <p className="text-xs text-emerald-200">
                    Áp dụng cho {formatMonthDisplay(selectedMonth)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAssistant(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Đơn giá trên mỗi ca dạy (VNĐ):
                </label>
                <input
                  type="number"
                  step="5000"
                  defaultValue={editingAssistant.ratePerSession}
                  id="edit_rate"
                  className="w-full p-2.5 rounded-xl border-2 border-slate-300 focus:border-emerald-500 font-black text-slate-900 text-sm outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-teal-800">
                    Phụ cấp (Xăng xe/Trách nhiệm):
                  </label>
                  <input
                    type="number"
                    step="10000"
                    defaultValue={editingAssistant.allowance}
                    id="edit_allowance"
                    placeholder="0"
                    className="w-full p-2.5 rounded-xl border-2 border-teal-300 focus:border-teal-500 font-bold text-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-emerald-800">
                    Thưởng thêm (Chuyên cần/Tốt):
                  </label>
                  <input
                    type="number"
                    step="10000"
                    defaultValue={editingAssistant.bonus}
                    id="edit_bonus"
                    placeholder="0"
                    className="w-full p-2.5 rounded-xl border-2 border-emerald-300 focus:border-emerald-500 font-bold text-slate-900 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-rose-800">
                    Khấu trừ (Nếu có):
                  </label>
                  <input
                    type="number"
                    step="10000"
                    defaultValue={editingAssistant.deduction}
                    id="edit_deduction"
                    placeholder="0"
                    className="w-full p-2.5 rounded-xl border-2 border-rose-300 focus:border-rose-500 font-bold text-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Hình thức thanh toán:
                  </label>
                  <select
                    id="edit_method"
                    defaultValue={editingAssistant.paymentMethod}
                    className="w-full p-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900 outline-hidden"
                  >
                    <option value="transfer">Chuyển khoản (Ngân hàng)</option>
                    <option value="cash">Tiền mặt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Thông tin tài khoản nhận lương (Số TK, Ngân hàng):
                </label>
                <input
                  type="text"
                  defaultValue={editingAssistant.bankInfo}
                  id="edit_bank"
                  className="w-full p-2.5 rounded-xl border-2 border-slate-300 focus:border-emerald-500 font-semibold text-slate-900 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ghi chú cho trợ giảng:
                </label>
                <textarea
                  id="edit_notes"
                  rows={2}
                  defaultValue={editingAssistant.notes}
                  placeholder="Ghi chú đánh giá, nhắc nhở hoặc lời cảm ơn..."
                  className="w-full p-2.5 rounded-xl border-2 border-slate-300 focus:border-emerald-500 font-medium text-slate-900 outline-hidden resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingAssistant(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  const rateEl = document.getElementById("edit_rate") as HTMLInputElement;
                  const allowEl = document.getElementById("edit_allowance") as HTMLInputElement;
                  const bonusEl = document.getElementById("edit_bonus") as HTMLInputElement;
                  const dedEl = document.getElementById("edit_deduction") as HTMLInputElement;
                  const methodEl = document.getElementById("edit_method") as HTMLSelectElement;
                  const bankEl = document.getElementById("edit_bank") as HTMLInputElement;
                  const noteEl = document.getElementById("edit_notes") as HTMLTextAreaElement;

                  saveAdjustment(editingAssistant.assistantId, {
                    ratePerSession: Number(rateEl.value) || defaultSessionRate,
                    allowance: Number(allowEl.value) || 0,
                    bonus: Number(bonusEl.value) || 0,
                    deduction: Number(dedEl.value) || 0,
                    paymentMethod: methodEl.value as any,
                    bankInfo: bankEl.value,
                    notes: noteEl.value,
                  });

                  setEditingAssistant(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs transition-colors cursor-pointer shadow-md"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW & PRINT OFFICIAL PAYSLIP (PHIẾU LƯƠNG CÁ NHÂN) */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Payslip Header Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="font-black text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Phiếu Báo Lương Cá Nhân
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Phiếu</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyPayslipText(viewingPayslip)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép Zalo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingPayslip(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Card Body */}
            <div className="p-6 overflow-y-auto space-y-5 bg-white print:p-0">
              {/* Center Branding */}
              <div className="text-center border-b-2 border-emerald-800 pb-4">
                <div className="text-xs font-black uppercase tracking-widest text-emerald-800">
                  CLB TOÁN THẦY THẮNG
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1 uppercase">
                  PHIẾU THANH TOÁN LƯƠNG TRỢ GIẢNG
                </h3>
                <p className="text-xs text-slate-600 font-bold mt-0.5">
                  {formatMonthDisplay(selectedMonth).toUpperCase()}
                </p>
              </div>

              {/* Personnel Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Họ và tên:</span>{" "}
                  <strong className="text-slate-900 text-sm block">
                    {viewingPayslip.assistantName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Số điện thoại:</span>{" "}
                  <strong className="text-slate-900 block">{viewingPayslip.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Lớp phụ trách:</span>{" "}
                  <strong className="text-slate-900 block">
                    {viewingPayslip.assignedClasses.join(", ") || "Toàn bộ CLB"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Ngày xuất phiếu:</span>{" "}
                  <strong className="text-slate-900 block">
                    {new Date().toLocaleDateString("vi-VN")}
                  </strong>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border border-slate-300 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 font-black text-slate-800 border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">Khoản Mục</th>
                      <th className="p-2.5 text-center">Số Lượng / Đơn Giá</th>
                      <th className="p-2.5 text-right">Thành Tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">
                        1. Lương trợ giảng theo ca
                      </td>
                      <td className="p-2.5 text-center text-slate-700">
                        {viewingPayslip.totalSessions} ca × {formatVND(viewingPayslip.ratePerSession)}
                      </td>
                      <td className="p-2.5 text-right font-black text-slate-900">
                        {formatVND(viewingPayslip.sessionSalary)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">
                        2. Phụ cấp trách nhiệm / xăng xe
                      </td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-right font-black text-teal-800">
                        +{formatVND(viewingPayslip.allowance)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">
                        3. Thưởng chuyên cần / hoàn thành tốt
                      </td>
                      <td className="p-2.5 text-center text-slate-500">-</td>
                      <td className="p-2.5 text-right font-black text-emerald-800">
                        +{formatVND(viewingPayslip.bonus)}
                      </td>
                    </tr>
                    {viewingPayslip.deduction > 0 && (
                      <tr>
                        <td className="p-2.5 font-bold text-rose-800">
                          4. Khấu trừ vi phạm / vắng
                        </td>
                        <td className="p-2.5 text-center text-slate-500">-</td>
                        <td className="p-2.5 text-right font-black text-rose-700">
                          -{formatVND(viewingPayslip.deduction)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-emerald-50 border-t-2 border-emerald-300 font-black">
                    <tr>
                      <td colSpan={2} className="p-3 text-emerald-950 uppercase">
                        TỔNG THỰC LĨNH:
                      </td>
                      <td className="p-3 text-right text-emerald-950 text-base">
                        {formatVND(viewingPayslip.netSalary)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* THÔNG TIN THANH TOÁN & MÃ QR SỐ TÀI KHOẢN (GẮN TRÊN PHIẾU BÁO LƯƠNG CÁ NHÂN) */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-xs space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="font-black text-amber-950 text-xs uppercase flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-black">
                      <QrCode className="w-3.5 h-3.5" />
                    </div>
                    <span>Thông tin thanh toán & Quét mã chuyển tiền</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                      viewingPayslip.paymentStatus === "paid"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-amber-200/90 text-amber-950 border border-amber-300"
                    }`}
                  >
                    {viewingPayslip.paymentStatus === "paid" ? "✓ Đã chuyển khoản" : "⏳ Chờ thanh toán"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                  {/* Left: Account details, amount & action buttons */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="bg-white/95 p-3.5 rounded-xl border border-amber-200 space-y-2 shadow-2xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Tài khoản ngân hàng nhận lương:
                        </span>
                        <div className="font-mono font-black text-slate-900 text-xs sm:text-sm tracking-wide mt-0.5 flex items-center justify-between gap-2">
                          <span className="break-all">{viewingPayslip.bankInfo}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(viewingPayslip.bankInfo || "");
                              setCopiedToast(true);
                              setTimeout(() => setCopiedToast(false), 2000);
                            }}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer print:hidden"
                            title="Sao chép thông tin tài khoản"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy STK</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-amber-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-bold">Số tiền cần thanh toán:</span>
                        <span className="font-black text-emerald-800 text-base font-mono">
                          {formatVND(viewingPayslip.netSalary)}
                        </span>
                      </div>
                    </div>

                    {/* QR Action Buttons in Payslip (hidden when printing) */}
                    <div className="flex flex-wrap items-center gap-2 print:hidden pt-0.5">
                      <label className="text-[11px] text-amber-900 font-bold flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-amber-700" />
                        <span>{viewingPayslip.qrCodeUrl ? "Đổi ảnh QR" : "Tải ảnh QR lên"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadQrForPayslip(viewingPayslip.assistantId, e)}
                        />
                      </label>

                      {viewingPayslip.qrCodeUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setZoomQrModal({
                              name: viewingPayslip.assistantName,
                              qrUrl: viewingPayslip.qrCodeUrl!,
                              bankInfo: viewingPayslip.bankInfo || "",
                              netSalary: viewingPayslip.netSalary,
                            })
                          }
                          className="text-[11px] text-blue-900 font-bold flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors shadow-2xs"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-blue-700" />
                          <span>Phóng to mã QR</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: QR Code Visual display */}
                  <div className="flex flex-col items-center shrink-0">
                    {viewingPayslip.qrCodeUrl ? (
                      <div
                        onClick={() =>
                          setZoomQrModal({
                            name: viewingPayslip.assistantName,
                            qrUrl: viewingPayslip.qrCodeUrl!,
                            bankInfo: viewingPayslip.bankInfo || "",
                            netSalary: viewingPayslip.netSalary,
                          })
                        }
                        className="relative group cursor-pointer bg-white p-2 rounded-2xl border-2 border-amber-400 shadow-md hover:shadow-lg transition-all text-center"
                        title="Bấm để phóng to mã QR quét chuyển khoản"
                      >
                        <img
                          src={viewingPayslip.qrCodeUrl}
                          alt={`Mã QR ${viewingPayslip.assistantName}`}
                          className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-xl bg-white"
                        />
                        <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] font-black text-amber-900">
                          <QrCode className="w-3 h-3 text-amber-700" />
                          <span>Quét mã chuyển tiền</span>
                        </div>
                        {/* Hover overlay on desktop (hidden when printing) */}
                        <div className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white print:hidden">
                          <Maximize2 className="w-6 h-6 mb-1 text-amber-300" />
                          <span className="text-[10px] font-bold">Phóng to QR</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl border-2 border-dashed border-amber-300 bg-white flex flex-col items-center justify-center p-3 text-center">
                        <QrCode className="w-10 h-10 text-amber-300 mb-1" />
                        <span className="text-[10px] font-bold text-amber-950">Chưa có ảnh QR</span>
                        <label className="mt-2 text-[10px] font-black text-blue-700 hover:underline cursor-pointer">
                          Tải ảnh ngay
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUploadQrForPayslip(viewingPayslip.assistantId, e)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 pt-6 text-center text-xs">
                <div>
                  <div className="font-bold text-slate-600">NGƯỜI NHẬN LƯƠNG</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16" />
                  <div className="font-black text-slate-900">
                    {viewingPayslip.assistantName}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-slate-600">CHỦ NHIỆM CLB TOÁN</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">(Đã duyệt & ký tên)</p>
                  <div className="h-16" />
                  <div className="font-black text-slate-900">
                    Thầy Thắng
                  </div>
                </div>
              </div>
            </div>

            {/* Payslip Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end print:hidden">
              <button
                type="button"
                onClick={() => setViewingPayslip(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng Phiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ZOOM QR CODE FOR PAYMENT */}
      {zoomQrModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border-2 border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="text-left">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-700 block">
                  Mã QR Chuyển Lương
                </span>
                <h4 className="font-black text-slate-900 text-sm">{zoomQrModal.name}</h4>
              </div>
              <button
                type="button"
                onClick={() => setZoomQrModal(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white p-3 rounded-2xl border-2 border-amber-300 shadow-inner flex flex-col items-center justify-center">
              <img
                src={zoomQrModal.qrUrl}
                alt="QR Code"
                className="w-64 h-64 object-contain rounded-xl"
              />
              <div className="mt-3 w-full bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center space-y-0.5">
                <div className="text-[10px] font-bold text-slate-500">Số tiền chuyển:</div>
                <div className="font-mono font-black text-emerald-800 text-lg">
                  {formatVND(zoomQrModal.netSalary)}
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-800 break-all pt-1">
                  {zoomQrModal.bankInfo}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href={zoomQrModal.qrUrl}
                download={`QR_Luong_${zoomQrModal.name}.png`}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải ảnh QR</span>
              </a>
              <button
                type="button"
                onClick={() => setZoomQrModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST COPIED */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-black animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Đã sao chép thông tin thành công!</span>
        </div>
      )}
    </div>
  );
};
