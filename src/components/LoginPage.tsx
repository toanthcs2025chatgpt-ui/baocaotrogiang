import React, { useState } from "react";
import {
  LogIn,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  School,
  ArrowRight,
  Lock,
  UserCheck,
} from "lucide-react";
import { User } from "../types";
import { storageService } from "../services/storage";

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!identifier.trim() || !password.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ tên đăng nhập / Email và mật khẩu!");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const authenticatedUser = storageService.authenticate(identifier, password);

      if (authenticatedUser) {
        storageService.setCurrentUser(authenticatedUser);
        setSuccessMsg(
          authenticatedUser.role === "admin"
            ? `Đăng nhập thành công! Chào mừng Quản Trị Viên ${authenticatedUser.name}.`
            : `Đăng nhập thành công! Chào mừng Trợ Giảng ${authenticatedUser.name}.`
        );
        setTimeout(() => {
          onLoginSuccess(authenticatedUser);
        }, 400);
      } else {
        setIsLoading(false);
        setErrorMsg("Tên đăng nhập / Email hoặc Mật khẩu không chính xác. Vui lòng thử lại!");
      }
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-between relative overflow-hidden select-none font-sans text-slate-100">
      {/* Background Decor Elements */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-950/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="p-4 sm:p-6 max-w-6xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-[0_4px_0_0_#b45309] border border-amber-300">
            ∑
          </div>
          <div>
            <h1 className="font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
              <span>CLB TOÁN THẦY THẮNG</span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-black bg-cyan-400 text-blue-950 px-2 py-0.5 rounded-full">
                Báo Cáo Buổi Học
              </span>
            </h1>
            <p className="text-xs text-blue-300 font-medium">
              Học Toán Bằng Tư Duy – Bứt Phá Mọi Kỳ Thi
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-blue-200">
          <School className="w-4 h-4 text-amber-400" />
          <span>Hotline: 0988.123.456</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-slate-200 space-y-6">
          {/* Card Title */}
          <div className="text-center space-y-1.5 border-b border-slate-100 pb-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center border-2 border-blue-200 shadow-sm">
              <Lock className="w-7 h-7 text-blue-800" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Đăng Nhập Hệ Thống
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Dành cho Giáo viên Chủ nhiệm & Đội ngũ Trợ giảng
            </p>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-800" />
                <span>Tên đăng nhập hoặc Email:</span>
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Nhập tên đăng nhập hoặc email..."
                className="w-full p-3 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-bold text-slate-900 transition-all text-sm"
              />
            </div>

            <div>
              <label className="font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-800" />
                <span>Mật khẩu:</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full p-3 pr-11 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono font-black text-slate-900 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 hover:from-blue-800 hover:to-indigo-950 text-white font-black text-sm shadow-[0_4px_0_0_#1e3a8a] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-600"
            >
              {isLoading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>ĐĂNG NHẬP HỆ THỐNG</span>
                  <ArrowRight className="w-4 h-4 text-cyan-300 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer info */}
      <footer className="p-4 text-center text-xs text-slate-400 z-10">
        © {new Date().getFullYear()} CLB Toán Thầy Thắng. Hệ thống quản lý và báo cáo học tập.
      </footer>
    </div>
  );
};
