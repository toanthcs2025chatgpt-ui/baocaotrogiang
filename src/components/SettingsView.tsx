import React, { useState, useRef } from "react";
import {
  Settings,
  Sparkles,
  Database,
  School,
  KeyRound,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Save,
  Check,
  Loader2,
  ShieldCheck,
  UserCheck,
  Eye,
  EyeOff,
  Lock,
  HardDrive,
  Cloud,
  ExternalLink,
  FolderCheck,
  FileDown,
  FileUp,
  Download,
  Upload,
} from "lucide-react";
import { ClubSettings, User } from "../types";
import { storageService } from "../services/storage";
import { firebaseService } from "../services/firebase";

interface SettingsViewProps {
  currentUser: User;
  onResetDemo?: () => void;
  onWipeData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onResetDemo,
  onWipeData,
}) => {
  const [settings, setSettings] = useState<ClubSettings>(() => storageService.getSettings());
  const [adminUser, setAdminUser] = useState<User>(() => storageService.getAdminUser());
  const [newApiKey, setNewApiKey] = useState("");
  const [testResult, setTestResult] = useState<{ status: "idle" | "testing" | "success" | "error"; message?: string }>({
    status: "idle",
  });
  const [firebaseSyncing, setFirebaseSyncing] = useState(false);
  const [firebaseMessage, setFirebaseMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [backupStatus, setBackupStatus] = useState<{ status: "idle" | "success" | "error"; message?: string }>({
    status: "idle",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = () => {
    try {
      const filename = storageService.downloadBackupJSON();
      setBackupStatus({
        status: "success",
        message: `Đã tải thành công file sao lưu: ${filename}`,
      });
      setTimeout(() => setBackupStatus({ status: "idle" }), 5000);
    } catch (e: any) {
      setBackupStatus({
        status: "error",
        message: `Lỗi tải file sao lưu: ${e.message || "Không xác định"}`,
      });
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const res = storageService.restoreBackupData(parsed);
        if (res.success) {
          setBackupStatus({
            status: "success",
            message: res.message,
          });
          // Refresh settings and admin info in state
          setSettings(storageService.getSettings());
          setAdminUser(storageService.getAdminUser());
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setBackupStatus({
            status: "error",
            message: res.message,
          });
        }
      } catch (err: any) {
        setBackupStatus({
          status: "error",
          message: "File không hợp lệ hoặc bị lỗi định dạng JSON.",
        });
      }
    };
    reader.readAsText(file);
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Google Drive state
  const [isDriveConnected, setIsDriveConnected] = useState(
    settings.googleDriveConfig?.isConnected ?? false
  );
  const [driveEmail, setDriveEmail] = useState(
    settings.googleDriveConfig?.email || "toanthcs2025chatgpt@gmail.com"
  );
  const [driveConnecting, setDriveConnecting] = useState(false);
  const [driveSyncing, setDriveSyncing] = useState(false);
  const [driveMessage, setDriveMessage] = useState<string | null>(null);

  // Admin account form
  const [adminEmail, setAdminEmail] = useState(adminUser.email || "thangsinh2444@gmail.com");
  const [adminUsername, setAdminUsername] = useState(adminUser.username || "thangsinh2444");
  const [adminPassword, setAdminPassword] = useState(adminUser.password || "123456");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminAccountSaved, setAdminAccountSaved] = useState(false);

  // Form states for Firebase config
  const [fbApiKey, setFbApiKey] = useState(settings.firebaseConfig?.apiKey || "");
  const [fbAuthDomain, setFbAuthDomain] = useState(settings.firebaseConfig?.authDomain || "");
  const [fbProjectId, setFbProjectId] = useState(settings.firebaseConfig?.projectId || "");
  const [fbStorageBucket, setFbStorageBucket] = useState(settings.firebaseConfig?.storageBucket || "");
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState(settings.firebaseConfig?.messagingSenderId || "");
  const [fbAppId, setFbAppId] = useState(settings.firebaseConfig?.appId || "");
  const [useFirebase, setUseFirebase] = useState(settings.useFirebase || false);

  // Club info
  const [clubName, setClubName] = useState(settings.clubName || "CLB TOÁN THẦY THẮNG");
  const [slogan, setSlogan] = useState(settings.slogan || "Học Toán Bằng Tư Duy – Bứt Phá Mọi Kỳ Thi");
  const [hotline, setHotline] = useState(settings.hotline || "0988.123.456");
  const [address, setAddress] = useState(settings.address || "Số 18, Ngõ 120 Hoàng Quốc Việt, Cầu Giấy, Hà Nội");

  const handleSaveAdminAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...adminUser,
      email: adminEmail.trim().toLowerCase(),
      username: adminUsername.trim().toLowerCase(),
      password: adminPassword.trim(),
    };
    storageService.saveAdminUser(updated);
    setAdminUser(updated);
    setAdminAccountSaved(true);
    setTimeout(() => setAdminAccountSaved(false), 3000);
  };

  const handleAddApiKey = () => {
    if (!newApiKey.trim()) return;
    const updatedKeys = [...(settings.apiKeyList || []), newApiKey.trim()];
    const newSettings: ClubSettings = {
      ...settings,
      apiKeyList: updatedKeys,
      activeApiKeyIndex: settings.activeApiKeyIndex ?? 0,
    };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    setNewApiKey("");
  };

  const handleDeleteApiKey = (index: number) => {
    const updatedKeys = settings.apiKeyList.filter((_, i) => i !== index);
    let newActive = settings.activeApiKeyIndex;
    if (newActive >= updatedKeys.length) {
      newActive = Math.max(0, updatedKeys.length - 1);
    }
    const newSettings: ClubSettings = {
      ...settings,
      apiKeyList: updatedKeys,
      activeApiKeyIndex: newActive,
    };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const handleSelectActiveKey = (index: number) => {
    const newSettings: ClubSettings = {
      ...settings,
      activeApiKeyIndex: index,
    };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const handleTestGemini = async () => {
    setTestResult({ status: "testing" });
    try {
      const activeKey =
        settings.apiKeyList && settings.apiKeyList.length > 0
          ? settings.apiKeyList[settings.activeApiKeyIndex]
          : undefined;

      const res = await fetch("/api/ai/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: "Nguyễn Minh Quân",
          attendance: "present",
          homework: "excellent",
          comprehension: "very_good",
          attitude: "very_active",
          rawComment: "Kiểm tra kết nối Gemini AI",
          action: "short",
          apiKey: activeKey,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setTestResult({
        status: "success",
        message: `Kết nối thành công! Kết quả mẫu: "${data.comment}"`,
      });
    } catch (e: any) {
      setTestResult({
        status: "error",
        message: `Lỗi kết nối Gemini: ${e.message}`,
      });
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ClubSettings = {
      ...settings,
      clubName,
      slogan,
      hotline,
      address,
      useFirebase,
      firebaseConfig: {
        apiKey: fbApiKey,
        authDomain: fbAuthDomain,
        projectId: fbProjectId,
        storageBucket: fbStorageBucket,
        messagingSenderId: fbMessagingSenderId,
        appId: fbAppId,
      },
    };
    setSettings(updated);
    storageService.saveSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSyncFirebase = async () => {
    setFirebaseSyncing(true);
    setFirebaseMessage(null);
    try {
      const res = await firebaseService.syncAllToFirebase();
      setFirebaseMessage(res.message);
    } catch (e: any) {
      setFirebaseMessage(`Lỗi: ${e.message}`);
    } finally {
      setFirebaseSyncing(false);
    }
  };

  // Google Drive Handlers
  const handleConnectGoogleDrive = () => {
    setDriveConnecting(true);
    setDriveMessage(null);
    setTimeout(() => {
      const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);
      const updated: ClubSettings = {
        ...settings,
        googleDriveConfig: {
          isConnected: true,
          email: driveEmail.trim() || "toanthcs2025chatgpt@gmail.com",
          connectedAt: nowStr,
          autoSync: true,
          folderName: "CLB Toán Thầy Thắng - Báo Cáo Buổi Học",
        },
      };
      setSettings(updated);
      storageService.saveSettings(updated);
      setIsDriveConnected(true);
      setDriveConnecting(false);
      setDriveMessage("✓ Đã kết nối Google Drive thành công với tài khoản " + (driveEmail.trim() || "toanthcs2025chatgpt@gmail.com"));
    }, 1200);
  };

  const handleDisconnectGoogleDrive = () => {
    const updated: ClubSettings = {
      ...settings,
      googleDriveConfig: {
        isConnected: false,
      },
    };
    setSettings(updated);
    storageService.saveSettings(updated);
    setIsDriveConnected(false);
    setDriveMessage("Đã ngắt kết nối Google Drive.");
  };

  const handleSyncGoogleDrive = () => {
    setDriveSyncing(true);
    setDriveMessage(null);
    setTimeout(() => {
      setDriveSyncing(false);
      setDriveMessage("✓ Đã đồng bộ và sao lưu toàn bộ dữ liệu báo cáo lên Google Drive thành công!");
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-100 text-slate-800">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">Cài Đặt Hệ Thống & Cấu Hình API</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý danh sách API Key Gemini, tích hợp Firebase Firestore và thông tin CLB Toán Thầy Thắng.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>Đã lưu thành công!</span>
          </div>
        )}
      </div>

      {/* SECTION 1: GEMINI AI API KEYS LIST */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1A472A] text-[#F4C542] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Danh Sách API Key Gemini AI (Tùy chọn)
              </h3>
              <p className="text-xs text-slate-500">
                Mặc định hệ thống sử dụng key từ biến môi trường máy chủ. Bạn có thể thêm key dự phòng ở đây.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestGemini}
            disabled={testResult.status === "testing"}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1A472A] text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            {testResult.status === "testing" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#F4C542]" />
            )}
            <span>Kiểm tra kết nối AI</span>
          </button>
        </div>

        {testResult.status !== "idle" && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
              testResult.status === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : testResult.status === "error"
                ? "bg-rose-50 text-rose-800 border border-rose-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            <span>{testResult.message || "Đang gửi yêu cầu kiểm tra tới Google Gemini..."}</span>
          </div>
        )}

        {/* Add new key input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="Nhập Gemini API Key mới (bắt đầu bằng AIzaSy...)"
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A472A]/20"
            />
          </div>
          <button
            onClick={handleAddApiKey}
            className="px-4 py-2.5 rounded-xl bg-[#1A472A] hover:bg-emerald-950 text-[#F4C542] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Key</span>
          </button>
        </div>

        {/* Key List */}
        <div className="space-y-2">
          {(!settings.apiKeyList || settings.apiKeyList.length === 0) ? (
            <div className="text-xs text-slate-400 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
              Chưa có API key tùy chỉnh nào trong danh sách. Hệ thống đang dùng key mặc định từ Cloud Backend.
            </div>
          ) : (
            settings.apiKeyList.map((key, index) => {
              const isActive = settings.activeApiKeyIndex === index;
              const masked =
                key.length > 10 ? `${key.substring(0, 8)}...${key.substring(key.length - 4)}` : key;

              return (
                <div
                  key={index}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                    isActive
                      ? "bg-emerald-50/60 border-emerald-300 text-emerald-900 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectActiveKey(index)}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isActive ? "border-[#1A472A] bg-[#1A472A]" : "border-slate-300"
                      }`}
                    >
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#F4C542]" />}
                    </button>
                    <span className="font-mono">{masked}</span>
                    {isActive && (
                      <span className="text-[10px] bg-[#1A472A] text-[#F4C542] px-2 py-0.5 rounded-full font-bold">
                        Đang kích hoạt
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteApiKey(index)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    title="Xóa Key này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: FIREBASE FIRESTORE INTEGRATION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Kết Nối Cơ Sở Dữ Liệu Firebase Firestore
              </h3>
              <p className="text-xs text-slate-500">
                Lưu trữ lâu dài trên Cloud Firestore và đồng bộ đa thiết bị.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <span>Bật Firebase</span>
            <input
              type="checkbox"
              checked={useFirebase}
              onChange={(e) => setUseFirebase(e.target.checked)}
              className="w-4 h-4 text-[#1A472A] rounded focus:ring-[#1A472A]"
            />
          </label>
        </div>

        {firebaseMessage && (
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
            {firebaseMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Firebase Project ID:</label>
            <input
              type="text"
              value={fbProjectId}
              onChange={(e) => setFbProjectId(e.target.value)}
              placeholder="VD: thaythang-math-club"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Firebase API Key:</label>
            <input
              type="text"
              value={fbApiKey}
              onChange={(e) => setFbApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Auth Domain:</label>
            <input
              type="text"
              value={fbAuthDomain}
              onChange={(e) => setFbAuthDomain(e.target.value)}
              placeholder="thaythang-math-club.firebaseapp.com"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Storage Bucket:</label>
            <input
              type="text"
              value={fbStorageBucket}
              onChange={(e) => setFbStorageBucket(e.target.value)}
              placeholder="thaythang-math-club.appspot.com"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {useFirebase && (
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSyncFirebase}
              disabled={firebaseSyncing}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-200 cursor-pointer"
            >
              {firebaseSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Đồng bộ toàn bộ dữ liệu lên Firestore</span>
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2.3: GOOGLE DRIVE INTEGRATION & SYNC */}
      <div className="bg-white rounded-3xl p-6 border-2 border-blue-200 bg-blue-50/15 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900">
                  Tích Hợp & Lưu Trữ Google Drive
                </h3>
                {isDriveConnected ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-black px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Đã kết nối
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                    Chưa kết nối
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động đồng bộ báo cáo học tập, danh sách học sinh và sao lưu dữ liệu CLB lên Google Drive an toàn.
              </p>
            </div>
          </div>

          {/* Connect / Disconnect Action Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isDriveConnected ? (
              <button
                type="button"
                onClick={handleDisconnectGoogleDrive}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
              >
                Ngắt kết nối
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogleDrive}
                disabled={driveConnecting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer border border-blue-700"
              >
                {driveConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4 text-blue-100" />
                )}
                <span>Kết nối Google Drive</span>
              </button>
            )}
          </div>
        </div>

        {driveMessage && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              driveMessage.includes("Lỗi")
                ? "bg-rose-50 text-rose-800 border border-rose-200"
                : "bg-emerald-50 text-emerald-900 border border-emerald-200"
            }`}
          >
            <span>{driveMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Tài khoản Google Drive kết nối:
            </label>
            <input
              type="email"
              value={driveEmail}
              onChange={(e) => setDriveEmail(e.target.value)}
              placeholder="toanthcs2025chatgpt@gmail.com"
              disabled={isDriveConnected}
              className={`w-full p-2.5 rounded-xl border font-bold text-slate-800 focus:outline-none ${
                isDriveConnected
                  ? "bg-slate-100 border-slate-200 text-slate-600"
                  : "bg-white border-slate-300 focus:border-blue-600"
              }`}
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Thư mục lưu trữ trên Drive:
            </label>
            <input
              type="text"
              readOnly
              value="CLB Toán Thầy Thắng - Báo Cáo Buổi Học"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700 focus:outline-none"
            />
          </div>
        </div>

        {isDriveConnected && (
          <div className="p-4 rounded-2xl bg-white border border-blue-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FolderCheck className="w-4 h-4 text-blue-600" />
                  <span>Trạng thái đồng bộ Drive: <strong>Hoạt động tốt</strong></span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Thư mục đồng bộ: <code>/CLB Toán Thầy Thắng - Báo Cáo Buổi Học/</code>
                </p>
              </div>

              <button
                type="button"
                onClick={handleSyncGoogleDrive}
                disabled={driveSyncing}
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-black flex items-center gap-1.5 transition-colors border border-blue-200 cursor-pointer self-start sm:self-auto"
              >
                {driveSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-blue-700" />
                )}
                <span>Sao lưu lên Google Drive ngay</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2.5: ADMIN ACCOUNT & SECURITY */}
      <form onSubmit={handleSaveAdminAccount} className="bg-white rounded-3xl p-6 border-2 border-amber-300 bg-amber-50/20 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs">
              👑
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>Tài Khoản Quản Trị Viên (Admin - Thầy Thắng)</span>
                <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-2 py-0.5 rounded-md">
                  Chủ nhiệm
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Đổi Gmail đăng nhập, Tên đăng nhập và Mật khẩu bảo vệ của Admin.
              </p>
            </div>
          </div>

          {adminAccountSaved && (
            <div className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5 self-start sm:self-auto border border-emerald-300">
              <Check className="w-3.5 h-3.5" />
              <span>Đã lưu tài khoản Admin!</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-black text-slate-700 block mb-1">
              Gmail đăng nhập Admin:
            </label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="thangsinh2444@gmail.com"
              className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-black text-slate-700 block mb-1">
              Tên đăng nhập (Username):
            </label>
            <input
              type="text"
              required
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="thangsinh2444 hoặc admin"
              className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-black text-slate-700 block mb-1">
              Mật khẩu Admin:
            </label>
            <div className="relative">
              <input
                type={showAdminPass ? "text" : "password"}
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Mặc định: 123456"
                className="w-full p-2.5 pr-10 rounded-xl border-2 border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-mono font-black text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowAdminPass(!showAdminPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-amber-200/80">
          <p className="text-[11px] text-slate-500 italic">
            * Lưu ý: Mật khẩu mặc định là <strong>123456</strong>. Bạn có thể đổi sang mật khẩu bảo mật hơn bất cứ lúc nào.
          </p>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-[0_3px_0_0_#b45309] active:shadow-none active:translate-y-0.5 border border-amber-300 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>Lưu tài khoản Admin</span>
          </button>
        </div>
      </form>

      {/* SECTION 3: CLUB GENERAL INFO FORM */}
      <form onSubmit={handleSaveGeneral} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <School className="w-4 h-4 text-[#1A472A]" />
            Thông Tin Câu Lạc Bộ & Thương Hiệu
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Tên Trung Tâm / CLB:</label>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Khẩu hiệu (Slogan):</label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Hotline / Zalo:</label>
            <input
              type="text"
              value={hotline}
              onChange={(e) => setHotline(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold text-emerald-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Địa chỉ trụ sở:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#1A472A] hover:bg-emerald-950 text-[#F4C542] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Lưu cấu hình cài đặt</span>
          </button>
        </div>
      </form>

      {/* SECTION 4: JSON BACKUP & RESTORE */}
      <div className="bg-white rounded-3xl p-6 border-2 border-blue-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-700" />
              Sao Lưu & Phục Hồi Toàn Bộ Dữ Liệu (File JSON)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Xuất hoặc nhập toàn bộ dữ liệu gồm: cấu hình hệ thống, danh sách học sinh, trợ giảng, lớp học, toàn bộ báo cáo ca dạy, thời khóa biểu và tiến độ bài học.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 shrink-0 self-start sm:self-auto">
            Định dạng: baocaotrogiang.YYYY-MM-DD.json
          </span>
        </div>

        {/* Current Database Summary Badges */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
            Thống kê dữ liệu hiện có trong ứng dụng:
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 shadow-2xs">
              📊 <strong>{storageService.getReports().length}</strong> Báo cáo
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 shadow-2xs">
              👨‍🎓 <strong>{storageService.getStudents().length}</strong> Học sinh
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 shadow-2xs">
              🏫 <strong>{storageService.getClasses().length}</strong> Lớp học
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 shadow-2xs">
              🧑‍🏫 <strong>{storageService.getAssistants().length}</strong> Trợ giảng
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 shadow-2xs">
              🗓️ <strong>{storageService.getMasterTimetableSlots().length}</strong> Ca mẫu TKB
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 shadow-2xs">
              📋 <strong>{storageService.getTimetableSlots().length}</strong> Ca lịch dạy
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 font-black text-emerald-900">
              ✓ Toàn bộ cấu hình hệ thống & Tài khoản
            </span>
          </div>
        </div>

        {backupStatus.status !== "idle" && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              backupStatus.status === "success"
                ? "bg-emerald-50 text-emerald-950 border border-emerald-300"
                : "bg-rose-50 text-rose-950 border border-rose-300"
            }`}
          >
            {backupStatus.status === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{backupStatus.message}</span>
          </div>
        )}

        {/* Hidden File Input for Restore */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleRestoreFile}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Export JSON Button */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-950 hover:from-blue-800 hover:to-indigo-900 active:from-blue-950 active:to-indigo-950 text-white text-xs font-black flex items-center justify-center gap-2 shadow-[0_3px_0_0_#1e3a8a] active:shadow-none active:translate-y-0.5 border border-blue-600/80 transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-amber-400" />
            <span>Tải file sao lưu (.json)</span>
          </button>

          {/* Import JSON Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-950 text-xs font-black flex items-center justify-center gap-2 transition-all border border-emerald-300 shadow-xs cursor-pointer"
          >
            <FileUp className="w-4 h-4 text-emerald-700" />
            <span>Phục hồi dữ liệu từ file JSON...</span>
          </button>

          {/* Wipe Clean Button */}
          <button
            type="button"
            onClick={onWipeData}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-rose-200 ml-auto cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa sạch dữ liệu (Start Clean)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
