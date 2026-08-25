import React from "react";
import {
  LayoutDashboard,
  FilePlus2,
  History,
  Users,
  School,
  GraduationCap,
  BarChart3,
  Settings,
  Sparkles,
  Shield,
  KeyRound,
  LogOut,
  X,
} from "lucide-react";
import { User } from "../types";

export type TabType =
  | "dashboard"
  | "create_report"
  | "reports_history"
  | "students"
  | "classes"
  | "assistants"
  | "statistics"
  | "settings";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentUser: User;
  pendingReportsCount?: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  pendingReportsCount = 0,
  isOpen,
  onClose,
  onOpenChangePassword,
  onLogout,
}) => {
  const isAdmin = currentUser.role === "admin";

  const navItems: Array<{
    id: TabType;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    adminOnly?: boolean;
  }> = [
    { id: "dashboard", label: "Bảng tin tổng hợp", icon: LayoutDashboard, adminOnly: true },
    { id: "create_report", label: "Báo cáo buổi học", icon: FilePlus2 },
    {
      id: "reports_history",
      label: isAdmin ? "Lịch sử báo cáo" : "Lịch sử báo cáo của tôi",
      icon: History,
      badge: isAdmin && pendingReportsCount > 0 ? `${pendingReportsCount} chờ` : undefined,
    },
    { id: "students", label: "Học sinh", icon: Users, adminOnly: true },
    { id: "classes", label: "Lớp học", icon: School, adminOnly: true },
    { id: "assistants", label: "Trợ giảng", icon: GraduationCap, adminOnly: true },
    { id: "statistics", label: "Thống kê", icon: BarChart3, adminOnly: true },
    { id: "settings", label: "Cài đặt", icon: Settings, adminOnly: true },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const handleSelect = (tab: TabType) => {
    onTabChange(tab);
    onClose();
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Navigation Items */}
      <div className="p-4 space-y-2 overflow-y-auto flex-1">
        {/* Role Badge in Sidebar */}
        <div className="px-3 py-2 rounded-xl bg-blue-950/90 border border-blue-800/80 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${
                isAdmin
                  ? "bg-amber-400 text-slate-950"
                  : "bg-cyan-400 text-blue-950"
              }`}
            >
              {isAdmin ? "GV" : "TG"}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-black text-white truncate max-w-[130px]">
                {currentUser.name}
              </div>
              <div
                className={`text-[9px] font-black uppercase ${
                  isAdmin ? "text-amber-300" : "text-cyan-300"
                }`}
              >
                {isAdmin ? "Quản Trị Viên" : "Trợ Giảng"}
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-300/80 flex items-center justify-between">
          <span>{isAdmin ? "Quản trị CLB" : "Khu vực Trợ giảng"}</span>
        </div>

        <div className="space-y-1.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group select-none text-left cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white font-extrabold shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)] border-l-4 border-cyan-400 ring-1 ring-blue-400/50 translate-x-1"
                    : "text-blue-100/80 hover:bg-blue-900/60 hover:text-white hover:translate-x-0.5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-150 group-hover:scale-110 ${
                      isActive ? "text-cyan-300" : "text-blue-300/80 group-hover:text-cyan-300"
                    }`}
                  />
                  <span className="tracking-tight">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-[0_2px_0_0_rgba(0,0,0,0.2)] ${
                      isActive
                        ? "bg-amber-400 text-slate-950"
                        : "bg-amber-400 text-slate-950 font-extrabold"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Account Controls & AI Card */}
      <div className="p-3.5 border-t border-blue-900/60 bg-blue-950/80 space-y-2">
        {/* Quick action buttons: Change Password & Logout */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {onOpenChangePassword && (
            <button
              onClick={() => {
                onClose();
                onOpenChangePassword();
              }}
              className="py-1.5 px-2 rounded-xl bg-blue-900/80 hover:bg-blue-800 text-blue-100 border border-blue-700/60 flex items-center justify-center gap-1.5 font-bold transition-all text-[11px] cursor-pointer"
              title="Đổi mật khẩu"
            >
              <KeyRound className="w-3 h-3 text-cyan-300" />
              <span>Đổi Pass</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="py-1.5 px-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 flex items-center justify-center gap-1.5 font-bold transition-all text-[11px] cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-3 h-3 text-rose-400" />
              <span>Thoát</span>
            </button>
          )}
        </div>

        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-900/90 to-indigo-950/90 border border-blue-700/60 text-xs shadow-inner shadow-black/20">
          <div className="flex items-center gap-1.5 mb-1 text-cyan-300 font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>CLB TOÁN THẦY THẮNG</span>
          </div>
          <p className="text-[10px] text-blue-200/80 leading-snug">
            Hotline: 0988.123.456
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer (overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />
          <aside className="relative z-50 w-72 max-w-[80vw] h-full bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 text-white flex flex-col border-r border-blue-800 shadow-2xl">
            <div className="p-4 border-b border-blue-800 flex items-center justify-between">
              <span className="font-extrabold text-sm text-cyan-300">CLB TOÁN THẦY THẮNG</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-blue-200 hover:bg-blue-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {navContent}
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-full bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 text-white border-r border-blue-900/60 shadow-xl overflow-hidden select-none">
        {navContent}
      </aside>
    </>
  );
};
