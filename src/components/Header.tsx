import React, { useState, useEffect } from "react";
import {
  Menu,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Shield,
  GraduationCap,
  LogOut,
  LogIn,
  KeyRound,
  Lock,
  UserCheck,
  Bell,
  CheckCircle2,
  CheckCheck,
  Clock,
  FileText,
  Trash2,
  FileDown,
  Download,
} from "lucide-react";
import { User, Report, AppNotification } from "../types";
import { storageService } from "../services/storage";

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onToggleSidebar: () => void;
  onResetDemo?: () => void;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
  onSelectReport?: (report: Report) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  onToggleSidebar,
  onOpenSettings,
  onOpenLogin,
  onOpenChangePassword,
  onLogout,
  onSelectReport,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [backupSuccessFilename, setBackupSuccessFilename] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    storageService.getUserNotifications(currentUser)
  );

  const isAdmin = currentUser.role === "admin";

  const handleBackup = () => {
    try {
      const filename = storageService.downloadBackupJSON();
      setBackupSuccessFilename(filename);
      setTimeout(() => setBackupSuccessFilename(null), 4000);
    } catch (e: any) {
      alert("Lỗi xuất file sao lưu: " + (e?.message || "Không xác định"));
    }
  };

  // Refresh notifications whenever user changes or dropdown is opened
  useEffect(() => {
    setNotifications(storageService.getUserNotifications(currentUser));
  }, [currentUser, notifDropdownOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    storageService.markAllNotificationsAsRead(currentUser);
    setNotifications(storageService.getUserNotifications(currentUser));
  };

  const handleNotificationClick = (notif: AppNotification) => {
    storageService.markNotificationAsRead(notif.id);
    setNotifications(storageService.getUserNotifications(currentUser));
    if (notif.reportId && onSelectReport) {
      const reports = storageService.getReports();
      const target = reports.find((r) => r.id === notif.reportId);
      if (target) {
        setNotifDropdownOpen(false);
        onSelectReport(target);
      }
    }
  };

  return (
    <header className="shrink-0 z-30 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white border-b border-blue-700/60 shadow-lg select-none">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 h-16">
        {/* Left side: Hamburger & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-blue-100 bg-blue-950/60 hover:bg-blue-800 border border-blue-700/50 shadow-xs focus:outline-none transition-all active:scale-95 cursor-pointer"
            title="Mở menu"
          >
            <Menu className="w-5 h-5 text-cyan-300" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-blue-950 flex items-center justify-center font-black text-xl shadow-[0_3px_0_0_#b45309] border border-amber-300/80">
              ∑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base md:text-lg tracking-tight text-white drop-shadow-xs truncate max-w-[170px] sm:max-w-none">
                  CLB TOÁN THẦY THẮNG
                </span>
                <span
                  className={`hidden sm:inline-block text-[10px] uppercase font-black px-2 py-0.5 rounded-full shadow-xs ${
                    isAdmin
                      ? "bg-amber-400 text-slate-950"
                      : "bg-cyan-400 text-blue-950"
                  }`}
                >
                  {isAdmin ? "Quản Trị Viên" : "Trợ Giảng"}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-blue-200/90 hidden sm:block font-medium">
                Học Toán Bằng Tư Duy – Bứt Phá Mọi Kỳ Thi
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Notifications, Quick Action & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick JSON Backup Button - Admin only */}
          {isAdmin && (
            <button
              type="button"
              onClick={handleBackup}
              title="Sao lưu toàn bộ dữ liệu cấu hình, học sinh, trợ giảng, lớp, báo cáo, nhận xét ra file JSON (baocaotrogiang.ngày.json)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/90 hover:bg-blue-900 active:bg-blue-950 text-blue-100 text-xs font-bold transition-all border border-blue-600/70 shadow-[0_3px_0_0_#1e3a8a] active:shadow-none active:translate-y-0.5 cursor-pointer"
            >
              <FileDown className={`w-3.5 h-3.5 ${backupSuccessFilename ? "text-emerald-400 animate-bounce" : "text-amber-400"}`} />
              <span className="text-[11px] font-black">
                {backupSuccessFilename ? "Đã xuất JSON!" : "Sao lưu JSON"}
              </span>
            </button>
          )}

          {/* AI Settings Indicator - Admin only */}
          {isAdmin && (
            <button
              onClick={onOpenSettings}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-950/90 hover:bg-indigo-900 active:bg-indigo-950 text-xs text-indigo-100 border border-indigo-500/60 shadow-[0_3px_0_0_#312e81] active:shadow-none active:translate-y-0.5 font-bold transition-all cursor-pointer"
              title="Cài đặt Gemini AI & Firebase"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[11px]">Gemini AI</span>
            </button>
          )}

          {/* NOTIFICATION BELL WITH UNREAD BADGE & POPOVER */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setUserDropdownOpen(false);
              }}
              title="Thông báo duyệt báo cáo & hệ thống"
              className={`relative p-2 rounded-xl transition-all border shadow-[0_3px_0_0_#0f172a] active:shadow-none active:translate-y-0.5 cursor-pointer ${
                unreadCount > 0
                  ? "bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 border-amber-300 ring-2 ring-amber-400/50"
                  : "bg-blue-950/90 text-blue-200 hover:text-white hover:bg-blue-900 border-blue-700/60"
              }`}
            >
              <Bell className={`w-4 h-4 ${unreadCount > 0 ? "animate-bounce" : ""}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2 ring-white shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white text-slate-800 shadow-2xl border-2 border-blue-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[480px]">
                {/* Popover Header */}
                <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-100 text-blue-900">
                      <Bell className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        Thông Báo Hệ Thống
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Đã đọc tất cả"}
                      </p>
                    </div>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] font-bold text-blue-700 hover:text-blue-950 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Đã đọc hết</span>
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="overflow-y-auto flex-1 p-2 space-y-2 divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto text-slate-300 stroke-1 mb-2" />
                      <p className="text-xs font-medium">Chưa có thông báo nào</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isApproved = notif.type === "report_approved";
                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 rounded-xl transition-all cursor-pointer text-left border ${
                            !notif.read
                              ? isApproved
                                ? "bg-emerald-50/90 border-emerald-300/80 hover:bg-emerald-100/90"
                                : "bg-blue-50/90 border-blue-300/80 hover:bg-blue-100/90"
                              : "bg-slate-50/50 border-transparent hover:bg-slate-100/80"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                                isApproved
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-blue-600 text-white shadow-xs"
                              }`}
                            >
                              {isApproved ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-xs font-black truncate ${
                                    isApproved ? "text-emerald-950" : "text-blue-950"
                                  }`}
                                >
                                  {notif.title}
                                </span>
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-700 font-medium mt-1 leading-relaxed line-clamp-3">
                                {notif.message}
                              </p>

                              <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-200/50 text-[10px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {notif.createdAt}
                                </span>
                                {notif.reportId && (
                                  <span className="font-bold text-blue-700 hover:underline">
                                    Xem báo cáo →
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account / Role Badge & Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
                setNotifDropdownOpen(false);
              }}
              className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-all border shadow-[0_3px_0_0_#0f172a] active:shadow-none active:translate-y-0.5 text-left cursor-pointer ${
                isAdmin
                  ? "bg-gradient-to-r from-blue-950 to-indigo-950 border-amber-400/60"
                  : "bg-gradient-to-r from-blue-950 to-cyan-950 border-cyan-400/60"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center shrink-0 font-black text-xs ${
                  isAdmin
                    ? "bg-amber-400 text-slate-950 shadow-xs"
                    : "bg-cyan-400 text-blue-950 shadow-xs"
                }`}
              >
                {isAdmin ? (
                  <Shield className="w-4 h-4 text-slate-950" />
                ) : (
                  <GraduationCap className="w-4 h-4 text-blue-950" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-black leading-tight text-white flex items-center gap-1">
                  <span className="truncate max-w-[130px]">{currentUser.name}</span>
                </div>
                <div className="text-[10px] font-extrabold flex items-center gap-1">
                  <span className={isAdmin ? "text-amber-300" : "text-cyan-300"}>
                    {isAdmin ? "👑 Admin" : "🎓 Trợ giảng"}
                  </span>
                  {currentUser.username && (
                    <span className="text-blue-300/80 font-mono text-[9px]">(@{currentUser.username})</span>
                  )}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white text-slate-800 shadow-2xl border-2 border-blue-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Current Profile Card */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isAdmin
                          ? "bg-amber-400 text-slate-950"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {isAdmin ? "GV" : "TG"}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-black text-xs text-slate-900 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {currentUser.email || currentUser.username}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isAdmin
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-blue-100 text-blue-900 border border-blue-300"
                      }`}
                    >
                      {isAdmin ? "👑 Quản Trị Viên (Admin)" : "🎓 Vai trò: Trợ Giảng"}
                    </span>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="p-1.5 space-y-1">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenChangePassword();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 font-bold transition-all text-left cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                    <span>Đổi mật khẩu tài khoản</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenLogin();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-blue-50 font-bold transition-all text-left cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                    <span>Đăng nhập tài khoản khác...</span>
                  </button>
                </div>

                {/* Logout Button */}
                <div className="mt-1 pt-1 border-t border-slate-100 px-1.5">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-700 hover:bg-rose-50 font-black transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Thoát đăng nhập (Đăng xuất)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prominent Log Out Button */}
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-black transition-all border border-rose-400 shadow-[0_3px_0_0_#9f1239] active:shadow-none active:translate-y-0.5 cursor-pointer"
            title="Thoát đăng nhập khỏi hệ thống"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        </div>
      </div>
    </header>
  );
};

