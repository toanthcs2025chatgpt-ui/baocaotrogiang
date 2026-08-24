import React, { useState } from "react";
import {
  KeyRound,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  GraduationCap,
  Lock,
} from "lucide-react";
import { User } from "../types";
import { storageService } from "../services/storage";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onPasswordChanged?: (newPassword: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPasswordChanged,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentPassword) {
      setErrorMsg("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setErrorMsg("Mật khẩu mới phải có ít nhất 4 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không trùng khớp với mật khẩu mới.");
      return;
    }

    const result = storageService.changePassword(
      currentUser.id || currentUser.username || currentUser.email,
      currentPassword,
      newPassword
    );

    if (result.success) {
      setSuccessMsg(result.message);
      if (onPasswordChanged) {
        onPasswordChanged(newPassword);
      }
      setTimeout(() => {
        onClose();
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccessMsg("");
      }, 1500);
    } else {
      setErrorMsg(result.message);
    }
  };

  const isAdmin = currentUser.role === "admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border-2 border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b-2 border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white shadow-sm ${
                isAdmin
                  ? "bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950"
                  : "bg-gradient-to-br from-blue-700 to-indigo-800 text-cyan-300"
              }`}
            >
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 leading-tight">
                Đổi Mật Khẩu Tài Khoản
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isAdmin ? (
                  <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                    👑 Quản trị viên (Admin)
                  </span>
                ) : (
                  <span className="text-[10px] font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md border border-blue-200">
                    🎓 Trợ giảng: {currentUser.name.replace("Trợ giảng ", "")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Account Info Pill */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="text-[11px] text-slate-500 font-bold">Tài khoản đang đăng nhập:</div>
          <div className="font-mono font-black text-slate-900 flex items-center gap-2">
            <span>{currentUser.email || currentUser.username}</span>
            {currentUser.username && (
              <span className="text-slate-400 font-normal">(@{currentUser.username})</span>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Current Password */}
          <div>
            <label className="font-black text-slate-700 block mb-1">
              Mật khẩu hiện tại: <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại (mặc định: 123456)"
                className="w-full p-2.5 pr-10 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono font-black text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="font-black text-slate-700 block mb-1">
              Mật khẩu mới: <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 4 ký tự)"
                className="w-full p-2.5 pr-10 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono font-black text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="font-black text-slate-700 block mb-1">
              Xác nhận mật khẩu mới: <span className="text-rose-500">*</span>
            </label>
            <input
              type={showNew ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono font-black text-slate-900"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-3d-secondary text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-3d-primary text-xs flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Cập nhật mật khẩu mới</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
