import React, { useState } from "react";
import {
  LogIn,
  X,
  KeyRound,
  UserCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { User } from "../types";
import { storageService } from "../services/storage";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ thông tin đăng nhập!");
      return;
    }

    const authenticatedUser = storageService.authenticate(username, password);

    if (authenticatedUser) {
      storageService.setCurrentUser(authenticatedUser);
      setSuccessMsg(
        `Đăng nhập thành công! Vai trò: ${
          authenticatedUser.role === "admin" ? "Quản trị viên (Admin)" : "Trợ giảng"
        }`
      );
      setTimeout(() => {
        onLoginSuccess(authenticatedUser);
        onClose();
      }, 400);
    } else {
      setErrorMsg("Tên đăng nhập / Email hoặc Mật khẩu không chính xác. Vui lòng kiểm tra lại!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border-2 border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-amber-400 flex items-center justify-center font-black text-xl shadow-sm border border-blue-700">
              ∑
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 leading-tight">
                Đăng Nhập Tài Khoản
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                CLB TOÁN THẦY THẮNG
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
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

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-800" />
              Tên đăng nhập hoặc Email:
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập hoặc email..."
              className="w-full p-3 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-800" />
              Mật khẩu:
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full p-3 pr-10 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono font-black text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-black text-sm shadow-[0_3px_0_0_#1e3a8a] active:shadow-none active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-500/50"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>Đăng nhập vào tài khoản</span>
          </button>
        </form>
      </div>
    </div>
  );
};
