import React, { useState, useEffect } from "react";
import { X, Clock, Sun, SunDim, Moon, Save, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { ShiftConfig, ShiftPeriod, TimetableSettings } from "../types";
import { DEFAULT_SHIFT_CONFIGS } from "../services/storage";

interface ShiftSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: TimetableSettings;
  onSave: (newSettings: TimetableSettings) => void;
}

export const ShiftSettingsModal: React.FC<ShiftSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave,
}) => {
  const [shifts, setShifts] = useState<ShiftConfig[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShifts(
        currentSettings.shifts && currentSettings.shifts.length === 6
          ? JSON.parse(JSON.stringify(currentSettings.shifts))
          : JSON.parse(JSON.stringify(DEFAULT_SHIFT_CONFIGS))
      );
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleTimeChange = (id: string, field: "startTime" | "endTime", val: string) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
    setError(null);
    setSuccessMsg(null);
  };

  const handleResetDefault = () => {
    setShifts(JSON.parse(JSON.stringify(DEFAULT_SHIFT_CONFIGS)));
    setError(null);
    setSuccessMsg("Đã khôi phục khung giờ ca học chuẩn của CLB!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSave = () => {
    // Validate each shift time
    for (const shift of shifts) {
      if (!shift.startTime || !shift.endTime) {
        setError(`Vui lòng nhập đầy đủ giờ vào ca và kết thúc cho "${shift.name}"!`);
        return;
      }
      if (shift.startTime >= shift.endTime) {
        setError(
          `Giờ vào ca (${shift.startTime}) phải sớm hơn giờ kết thúc (${shift.endTime}) ở "${shift.name}"!`
        );
        return;
      }
    }

    onSave({
      ...currentSettings,
      shifts,
    });
    setSuccessMsg("Đã cập nhật khung giờ ca học thành công!");
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const getPeriodIcon = (period: ShiftPeriod) => {
    switch (period) {
      case "morning":
        return <Sun className="w-5 h-5 text-amber-500" />;
      case "afternoon":
        return <SunDim className="w-5 h-5 text-sky-500" />;
      case "evening":
        return <Moon className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getPeriodBadge = (period: ShiftPeriod) => {
    switch (period) {
      case "morning":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
            Ca Sáng
          </span>
        );
      case "afternoon":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-sky-100 text-sky-800 border border-sky-300">
            Ca Chiều
          </span>
        );
      case "evening":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
            Ca Tối
          </span>
        );
    }
  };

  const getPeriodBorder = (period: ShiftPeriod) => {
    switch (period) {
      case "morning":
        return "border-amber-200 bg-amber-50/40";
      case "afternoon":
        return "border-sky-200 bg-sky-50/40";
      case "evening":
        return "border-indigo-200 bg-indigo-50/40";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl shadow-2xl border-2 border-blue-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                Cài Đặt Khung Giờ Ca Học
              </h2>
              <p className="text-xs text-blue-200 font-medium">
                Cấu hình giờ vào ca và kết thúc cho 2 Ca Sáng, 2 Ca Chiều, 2 Ca Tối
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-blue-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5 animate-in shake duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className={`p-4 rounded-2xl border-2 transition-all shadow-2xs ${getPeriodBorder(
                  shift.period
                )}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getPeriodIcon(shift.period)}
                    <span className="font-black text-slate-900 text-sm">
                      {shift.name}
                    </span>
                  </div>
                  {getPeriodBadge(shift.period)}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Giờ vào ca:
                    </label>
                    <input
                      type="time"
                      value={shift.startTime}
                      onChange={(e) =>
                        handleTimeChange(shift.id, "startTime", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-slate-900 font-bold text-sm outline-hidden transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Giờ kết thúc:
                    </label>
                    <input
                      type="time"
                      value={shift.endTime}
                      onChange={(e) =>
                        handleTimeChange(shift.id, "endTime", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-slate-900 font-bold text-sm outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div className="mt-2 text-right">
                  <span className="text-[11px] font-bold text-slate-500">
                    Thời lượng:{" "}
                    <strong className="text-slate-800">
                      {shift.startTime && shift.endTime
                        ? `${shift.startTime} – ${shift.endTime}`
                        : "Chưa đặt"}
                    </strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs font-medium space-y-1">
            <div className="font-black text-blue-950 flex items-center gap-1.5">
              <span>💡 Hướng dẫn:</span>
            </div>
            <p>
              Khung giờ ca học sẽ được đồng bộ trên bảng Thời khóa biểu tuần và tự động gợi ý khi Trợ giảng lập báo cáo ca dạy.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-4 py-2.5 rounded-xl border-2 border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cài Đặt Giờ Ca Học</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
