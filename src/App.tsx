import React, { useState, useEffect } from "react";
import { User, TabType, Report } from "./types";
import { storageService } from "./services/storage";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardView } from "./components/DashboardView";
import { CreateReportView } from "./components/CreateReportView";
import { ReportListView } from "./components/ReportListView";
import { StudentsView } from "./components/StudentsView";
import { ClassesView } from "./components/ClassesView";
import { AssistantsView } from "./components/AssistantsView";
import { StatisticsView } from "./components/StatisticsView";
import { SettingsView } from "./components/SettingsView";
import { ScheduleView } from "./components/ScheduleView";
import { LoginModal } from "./components/LoginModal";
import { LoginPage } from "./components/LoginPage";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import { ReportDetailModal } from "./components/ReportDetailModal";

export function App() {
  // Current user session: if null, show LoginPage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = storageService.getCurrentUser();
    // Default to admin on first load if no explicit logout, or return saved
    if (saved) return saved;
    const defaultAdmin = storageService.getAdminUser();
    storageService.setCurrentUser(defaultAdmin);
    return defaultAdmin;
  });

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const user = storageService.getCurrentUser();
    return user?.role === "assistant" ? "create_report" : "dashboard";
  });

  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [activeModalReport, setActiveModalReport] = useState<Report | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [syncToastMsg, setSyncToastMsg] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  // Auto-sync on startup across devices (Google Drive & Cloud Store)
  useEffect(() => {
    let isMounted = true;
    storageService.autoSyncOnStartup().then((res) => {
      if (isMounted && res.synced) {
        setSyncToastMsg(res.message || "Đã tự động đồng bộ dữ liệu mới nhất!");
        setDataVersion((v) => v + 1);
        setTimeout(() => setSyncToastMsg(null), 4500);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Role constraint enforcement: Assistants can access create_report, reports_history, and schedule
  useEffect(() => {
    if (currentUser?.role === "assistant") {
      if (
        activeTab !== "create_report" &&
        activeTab !== "reports_history" &&
        activeTab !== "schedule"
      ) {
        setActiveTab("schedule");
      }
    }
  }, [currentUser, activeTab]);

  // Sync current user change with storage
  const handleUserChange = (user: User) => {
    setCurrentUser(user);
    storageService.setCurrentUser(user);
    if (user.role === "assistant") {
      setActiveTab("schedule");
    } else {
      setActiveTab("dashboard");
    }
    setEditingReport(null);
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setActiveTab("create_report");
  };

  const handleCreateReportFromSchedule = (initialData: {
    className?: string;
    reportDate?: string;
    reportShift?: string;
    lessonTopic?: string;
    lessonContent?: string;
    homeworkAssigned?: string;
  }) => {
    const allClasses = storageService.getClasses();
    const matchingClass = allClasses.find((c) => c.name === initialData.className) || allClasses[0];
    const classId = matchingClass ? matchingClass.id : "cls_9a1";

    const draftReport: Report = {
      id: `rep_from_sched_${Date.now()}`,
      classId: classId,
      className: initialData.className || matchingClass?.name || "9A1 – Luyện Thi Vào 10 Chuyên",
      date: initialData.reportDate || new Date().toISOString().split("T")[0],
      shift: initialData.reportShift || "Ca 1 (18:30 – 20:30)",
      teacherName: matchingClass?.teacherName || "Thầy Thắng (Chủ nhiệm)",
      assistantId: currentUser?.assistantId || "asst_1",
      assistantName: currentUser?.name || "Trợ giảng CLB",
      lessonContent: initialData.lessonTopic
        ? `${initialData.lessonTopic}${initialData.lessonContent ? `\n\n${initialData.lessonContent}` : ""}`
        : initialData.lessonContent || "",
      homeworkAssigned: initialData.homeworkAssigned || "",
      students: [],
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEditingReport(draftReport);
    setActiveTab("create_report");
  };

  const handleCancelReport = () => {
    setEditingReport(null);
    setActiveTab("reports_history");
  };

  const handleSavedReport = () => {
    setEditingReport(null);
    setActiveTab("reports_history");
  };

  const handleResetDemo = () => {
    if (
      window.confirm(
        "Bạn có chắc muốn nạp lại dữ liệu mẫu của CLB Toán Thầy Thắng? Dữ liệu hiện tại sẽ được cập nhật."
      )
    ) {
      storageService.resetToDemo();
      window.location.reload();
    }
  };

  const handleWipeData = () => {
    if (
      window.confirm(
        "CẢNH BÁO: Thao tác này sẽ xóa toàn bộ báo cáo và đưa danh sách về ban đầu. Bạn có chắc chắn không?"
      )
    ) {
      storageService.wipeData();
      window.location.reload();
    }
  };

  // If user is not logged in, render the full-screen Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleUserChange} />;
  }

  const isAdmin = currentUser.role === "admin";

  return (
    <div className="h-screen flex flex-col bg-slate-100 font-sans text-slate-900 selection:bg-blue-600 selection:text-white overflow-hidden">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        onResetDemo={handleResetDemo}
        onOpenSettings={() => {
          if (isAdmin) setActiveTab("settings");
        }}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onLogout={handleLogout}
        onSelectReport={(report) => setActiveModalReport(report)}
      />

      {/* Main Layout Body: Sidebar on Left, Content on Right */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab !== "create_report") {
              setEditingReport(null);
            }
            setActiveTab(tab);
          }}
          currentUser={currentUser}
          pendingReportsCount={
            storageService.getReports().filter((r) => r.status === "submitted").length
          }
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic Main Content Area */}
        <main key={`data_v_${dataVersion}`} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100">
          <div className="max-w-7xl mx-auto">
            {/* Auto Cloud & Drive Sync Success Banner */}
            {syncToastMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-white/20">☁️</span>
                  <span>{syncToastMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSyncToastMsg(null)}
                  className="px-2 py-0.5 rounded-lg bg-black/20 hover:bg-black/40 text-[11px] font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            )}

            {/* Assistant restriction notice if on assistant role */}
            {!isAdmin && (
              <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-950 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black font-mono text-[10px] shadow-xs">
                    VAI TRÒ: TRỢ GIẢNG
                  </span>
                  <span>
                    Xin chào <strong>{currentUser.name}</strong>! Bạn đang đăng nhập với quyền{" "}
                    <strong>Lập báo cáo ca dạy</strong> & <strong>Xem lịch sử báo cáo cá nhân</strong>.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="text-[11px] text-blue-700 hover:text-blue-900 underline font-bold cursor-pointer"
                  >
                    Đổi mật khẩu
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-[11px] text-rose-600 hover:text-rose-800 underline font-bold cursor-pointer"
                  >
                    Thoát đăng nhập
                  </button>
                </div>
              </div>
            )}

            {/* Dashboard - Admin only */}
            {isAdmin && activeTab === "dashboard" && (
              <DashboardView
                currentUser={currentUser}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onEditReport={handleEditReport}
              />
            )}

            {/* Timetable / Thời Khóa Biểu - Available for Admin & Assistant */}
            {activeTab === "schedule" && (
              <ScheduleView
                currentUser={currentUser}
                onNavigateCreateReport={handleCreateReportFromSchedule}
              />
            )}

            {/* Create Report - Available for Admin & Assistant */}
            {activeTab === "create_report" && (
              <CreateReportView
                currentUser={currentUser}
                classes={storageService.getClasses()}
                assistants={storageService.getAssistants()}
                allStudents={storageService.getStudents()}
                editingReport={editingReport}
                onCancelEdit={handleCancelReport}
                onReportSaved={handleSavedReport}
              />
            )}

            {/* Reports History - Available for Admin & Assistant (Scoped to assistant's own reports) */}
            {activeTab === "reports_history" && (
              <ReportListView
                currentUser={currentUser}
                onNavigateCreate={() => {
                  setEditingReport(null);
                  setActiveTab("create_report");
                }}
                onEditReport={handleEditReport}
              />
            )}

            {/* Admin-only Views */}
            {isAdmin && activeTab === "students" && (
              <StudentsView currentUser={currentUser} />
            )}

            {isAdmin && activeTab === "classes" && (
              <ClassesView currentUser={currentUser} />
            )}

            {isAdmin && activeTab === "assistants" && (
              <AssistantsView
                currentUser={currentUser}
                onSwitchUser={handleUserChange}
              />
            )}

            {isAdmin && activeTab === "statistics" && (
              <StatisticsView />
            )}

            {isAdmin && activeTab === "settings" && (
              <SettingsView
                currentUser={currentUser}
                onResetDemo={handleResetDemo}
                onWipeData={handleWipeData}
                onUserUpdate={handleUserChange}
              />
            )}
          </div>
        </main>
      </div>

      {/* Login Modal for quick switch */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          handleUserChange(user);
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
      />

      {/* Report Detail Modal from Notifications */}
      {activeModalReport && (
        <ReportDetailModal
          report={activeModalReport}
          currentUser={currentUser}
          onClose={() => setActiveModalReport(null)}
          onApprove={(rep) => {
            const updated = storageService.approveReport(rep.id, currentUser.name);
            if (updated) {
              setActiveModalReport(updated);
            }
          }}
          onEdit={(rep) => {
            setActiveModalReport(null);
            handleEditReport(rep);
          }}
        />
      )}
    </div>
  );
}

export default App;
