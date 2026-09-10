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
  AlertCircle,
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
  RotateCcw,
  Copy,
  HelpCircle,
  Code,
  Zap,
  Layers,
  ArrowRight,
  Server,
  Cpu,
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  Unlink,
  Link,
} from "lucide-react";
import { ClubSettings, User } from "../types";
import { storageService } from "../services/storage";
import { firebaseService } from "../services/firebase";
import { aiService, ApiKeyTestResult } from "../services/ai";
import { AvatarUpload } from "./AvatarUpload";

// Types and interfaces

interface SettingsViewProps {
  currentUser: User;
  onResetDemo?: () => void;
  onWipeData: () => void;
  onUserUpdate?: (user: User) => void;
}

const AI_MODEL_OPTIONS = [
  {
    id: "gemini-3.8-flash",
    shortName: "3.8",
    name: "Gemini 3.8 Flash",
    tag: "Khuyên Dùng / Mới Nhất",
    description: "Thế hệ 3.8 siêu tốc, nhận xét sắc nét, tinh tế và tối ưu quota.",
    color: "border-indigo-500 bg-indigo-50/70 text-indigo-900",
    badgeColor: "bg-indigo-600 text-white",
  },
  {
    id: "gemini-3.7-flash",
    shortName: "3.7",
    name: "Gemini 3.7 Flash",
    tag: "Tư Duy Nâng Cao",
    description: "Khả năng suy luận & phân tích tiến trình học tập chuyên sâu.",
    color: "border-emerald-500 bg-emerald-50/70 text-emerald-900",
    badgeColor: "bg-emerald-600 text-white",
  },
  {
    id: "gemini-3.5-flash",
    shortName: "3.5",
    name: "Gemini 3.5 Flash",
    tag: "Ổn Định Cao",
    description: "Tốc độ nhanh, ổn định cao cho tác vụ viết nhận xét học vụ.",
    color: "border-blue-500 bg-blue-50/70 text-blue-900",
    badgeColor: "bg-blue-600 text-white",
  },
  {
    id: "gemini-flash-latest",
    shortName: "Auto",
    name: "Gemini Flash (Tự Động)",
    tag: "Tự Động Cập Nhật",
    description: "Tự động kết nối mô hình Flash mới nhất được tối ưu của Google.",
    color: "border-amber-500 bg-amber-50/70 text-amber-900",
    badgeColor: "bg-amber-600 text-white",
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onResetDemo,
  onWipeData,
  onUserUpdate,
}) => {
  const [settings, setSettings] = useState<ClubSettings>(() => storageService.getSettings());
  const [adminUser, setAdminUser] = useState<User>(() => storageService.getAdminUser());
  const [newApiKey, setNewApiKey] = useState("");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [bulkKeysText, setBulkKeysText] = useState("");
  const [addKeyMode, setAddKeyMode] = useState<"single" | "bulk">("single");
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({});
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);

  const [testingKeyIndex, setTestingKeyIndex] = useState<number | null>(null);
  const [testingAllKeys, setTestingAllKeys] = useState(false);
  const [testingServerKey, setTestingServerKey] = useState(false);
  const [serverKeyResult, setServerKeyResult] = useState<ApiKeyTestResult | null>(null);
  const [keyTestResults, setKeyTestResults] = useState<Record<number, ApiKeyTestResult>>({});

  const [testResult, setTestResult] = useState<{ status: "idle" | "testing" | "success" | "error"; message?: string }>({
    status: "idle",
  });
  const [firebaseSyncing, setFirebaseSyncing] = useState(false);
  const [firebaseMessage, setFirebaseMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Google Drive state
  const [isDriveConnected, setIsDriveConnected] = useState(
    settings.googleDriveConfig?.isConnected ?? false
  );
  const [driveEmail, setDriveEmail] = useState(
    settings.googleDriveConfig?.email || "toanthcs2025chatgpt@gmail.com"
  );
  const [scriptWebhookUrl, setScriptWebhookUrl] = useState(
    settings.googleDriveConfig?.scriptWebhookUrl || ""
  );
  const [driveFolderUrl, setDriveFolderUrl] = useState(
    settings.googleDriveConfig?.driveFolderUrl || ""
  );
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptGuide, setShowScriptGuide] = useState(true);
  const [driveConnecting, setDriveConnecting] = useState(false);
  const [driveSyncing, setDriveSyncing] = useState(false);
  const [driveMessage, setDriveMessage] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    needsAuthAccess?: boolean;
  } | null>(null);

  // Admin account form
  const [adminName, setAdminName] = useState(adminUser.name || "Thầy Thắng (Chủ nhiệm)");
  const [adminEmail, setAdminEmail] = useState(adminUser.email || "thangsinh2444@gmail.com");
  const [adminUsername, setAdminUsername] = useState(adminUser.username || "thangsinh2444");
  const [adminPassword, setAdminPassword] = useState(adminUser.password || "123456");
  const [adminPhone, setAdminPhone] = useState(adminUser.phone || "0988.123.456");
  const [adminAvatar, setAdminAvatar] = useState(adminUser.avatar || "");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminAccountSaved, setAdminAccountSaved] = useState(false);

  // Form states for Firebase config (Pre-filled with project bctg-408ca)
  const [fbApiKey, setFbApiKey] = useState(settings.firebaseConfig?.apiKey || "");
  const [fbAuthDomain, setFbAuthDomain] = useState(settings.firebaseConfig?.authDomain || "bctg-408ca.firebaseapp.com");
  const [fbProjectId, setFbProjectId] = useState(settings.firebaseConfig?.projectId || "bctg-408ca");
  const [fbStorageBucket, setFbStorageBucket] = useState(settings.firebaseConfig?.storageBucket || "bctg-408ca.appspot.com");
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState(settings.firebaseConfig?.messagingSenderId || "");
  const [fbAppId, setFbAppId] = useState(settings.firebaseConfig?.appId || "");
  const [useFirebase, setUseFirebase] = useState(settings.useFirebase ?? true);

  const [testingFirebase, setTestingFirebase] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<"idle" | "connected" | "error">(
    settings.firebaseConfig?.apiKey && settings.useFirebase ? "connected" : "idle"
  );
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);

  // Auto fill domains when project ID changes
  const handleProjectIdChange = (val: string) => {
    const clean = val.trim();
    setFbProjectId(clean);
    if (clean) {
      if (!fbAuthDomain || fbAuthDomain.endsWith(".firebaseapp.com")) {
        setFbAuthDomain(`${clean}.firebaseapp.com`);
      }
      if (!fbStorageBucket || fbStorageBucket.endsWith(".appspot.com") || fbStorageBucket.endsWith(".firebasestorage.app")) {
        setFbStorageBucket(`${clean}.appspot.com`);
      }
    }
  };

  const handleSaveAndTestFirebase = async () => {
    if (!fbProjectId.trim() || !fbApiKey.trim()) {
      setFirebaseMessage("⚠️ Vui lòng nhập tối thiểu Firebase Project ID và Firebase API Key.");
      setFirebaseStatus("error");
      return;
    }

    setTestingFirebase(true);
    setFirebaseMessage("Đang kiểm tra kết nối tới Firebase Firestore...");
    setFirebaseStatus("idle");

    const updatedConfig = {
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
      projectId: fbProjectId.trim(),
      storageBucket: fbStorageBucket.trim() || `${fbProjectId.trim()}.appspot.com`,
      messagingSenderId: fbMessagingSenderId.trim(),
      appId: fbAppId.trim(),
    };

    const updated: ClubSettings = {
      ...settings,
      useFirebase: true,
      firebaseConfig: updatedConfig,
    };

    setUseFirebase(true);
    setSettings(updated);
    storageService.saveSettings(updated);

    try {
      const res = await firebaseService.testConnection();
      setFirebaseStatus("connected");
      setFirebaseMessage(`✓ ${res.message}`);
    } catch (err: any) {
      setFirebaseStatus("error");
      setFirebaseMessage(`❌ Lỗi kết nối Firestore: ${err.message}. Vui lòng kiểm tra lại Project ID, API Key hoặc quyền Firestore Rules.`);
    } finally {
      setTestingFirebase(false);
    }
  };

  const handleQuickSetupDemoFirebase = () => {
    setFbProjectId("thaythang-math-club");
    setFbApiKey("AIzaSyB_demo_key_for_thaythang_club_2025");
    setFbAuthDomain("thaythang-math-club.firebaseapp.com");
    setFbStorageBucket("thaythang-math-club.appspot.com");
    setUseFirebase(true);
    setFirebaseMessage("ℹ️ Đã điền thông số mẫu. Bạn có thể thay bằng API Key từ Firebase Console của bạn.");
  };

  // Club info
  const [clubName, setClubName] = useState(settings.clubName || "CLB TOÁN THẦY THẮNG");
  const [slogan, setSlogan] = useState(settings.slogan || "Học Toán Bằng Tư Duy – Bứt Phá Mọi Kỳ Thi");
  const [hotline, setHotline] = useState(settings.hotline || "0988.123.456");
  const [address, setAddress] = useState(settings.address || "Số 18, Ngõ 120 Hoàng Quốc Việt, Cầu Giấy, Hà Nội");

  const handleSaveAdminAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...adminUser,
      name: adminName.trim() || "Thầy Thắng (Chủ nhiệm)",
      email: adminEmail.trim().toLowerCase(),
      username: adminUsername.trim().toLowerCase(),
      password: adminPassword.trim(),
      phone: adminPhone.trim(),
      avatar: adminAvatar.trim(),
    };
    storageService.saveAdminUser(updated);
    setAdminUser(updated);
    if (onUserUpdate && currentUser.role === "admin") {
      onUserUpdate(updated);
    }
    setAdminAccountSaved(true);
    setTimeout(() => setAdminAccountSaved(false), 3000);
  };

  const handleAddApiKey = () => {
    const clean = newApiKey.trim();
    if (!clean) return;
    const currentList = settings.apiKeyList || [];
    if (currentList.includes(clean)) {
      alert("Key này đã có trong danh sách!");
      return;
    }
    const updatedKeys = [...currentList, clean];
    const updatedMetadata = { ...(settings.apiKeyMetadata || {}) };
    if (newKeyLabel.trim()) {
      updatedMetadata[clean] = {
        label: newKeyLabel.trim(),
        lastStatus: "untested",
      };
    }
    const newSettings: ClubSettings = {
      ...settings,
      apiKeyList: updatedKeys,
      apiKeyMetadata: updatedMetadata,
      activeApiKeyIndex: settings.activeApiKeyIndex ?? 0,
    };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    setNewApiKey("");
    setNewKeyLabel("");
  };

  const handleAddBulkApiKeys = () => {
    if (!bulkKeysText.trim()) return;
    const extracted = bulkKeysText
      .split(/[\n,;\s]+/)
      .map((k) => k.trim())
      .filter((k) => k.length >= 15);

    if (extracted.length === 0) {
      alert("Không tìm thấy API Key Gemini hợp lệ nào (mỗi key thường có từ 15 ký tự trở lên).");
      return;
    }

    const currentList = settings.apiKeyList || [];
    const uniqueNewKeys = extracted.filter((k) => !currentList.includes(k));

    if (uniqueNewKeys.length === 0) {
      alert("Tất cả các key vừa nhập đều đã tồn tại trong danh sách!");
      return;
    }

    const updatedKeys = [...currentList, ...uniqueNewKeys];
    const newSettings: ClubSettings = {
      ...settings,
      apiKeyList: updatedKeys,
      activeApiKeyIndex: settings.activeApiKeyIndex ?? 0,
    };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    setBulkKeysText("");
    setAddKeyMode("single");
  };

  const handleDeleteApiKey = (index: number) => {
    const keyToRemove = settings.apiKeyList?.[index];
    const updatedKeys = (settings.apiKeyList || []).filter((_, i) => i !== index);
    let newActive = settings.activeApiKeyIndex;
    if (newActive >= updatedKeys.length) {
      newActive = Math.max(0, updatedKeys.length - 1);
    }
    const updatedMetadata = { ...(settings.apiKeyMetadata || {}) };
    if (keyToRemove && updatedMetadata[keyToRemove]) {
      delete updatedMetadata[keyToRemove];
    }
    const newSettings: ClubSettings = {
      ...settings,
      apiKeyList: updatedKeys,
      apiKeyMetadata: updatedMetadata,
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

  const handleSelectModel = (modelId: string) => {
    const newSettings = { ...settings, selectedModel: modelId };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const handleTestSingleKey = async (index: number) => {
    const key = settings.apiKeyList?.[index];
    if (!key) return;
    setTestingKeyIndex(index);

    try {
      const res = await aiService.testApiKey(key, settings.selectedModel);
      setKeyTestResults((prev) => ({ ...prev, [index]: res }));
      const updatedMetadata = { ...(settings.apiKeyMetadata || {}) };
      updatedMetadata[key] = {
        ...(updatedMetadata[key] || {}),
        lastStatus: res.status,
        lastTested: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        latencyMs: res.latencyMs,
        error: res.message,
      };
      const newSettings = { ...settings, apiKeyMetadata: updatedMetadata };
      setSettings(newSettings);
      storageService.saveSettings(newSettings);
    } catch (e: any) {
      setKeyTestResults((prev) => ({
        ...prev,
        [index]: {
          success: false,
          status: "error",
          latencyMs: 0,
          message: e.message || "Lỗi kiểm tra",
          isDefaultKey: false,
        },
      }));
    } finally {
      setTestingKeyIndex(null);
    }
  };

  const handleTestAllApiKeys = async () => {
    const list = settings.apiKeyList || [];
    if (list.length === 0) return;
    setTestingAllKeys(true);

    try {
      const batchRes = await aiService.testBatchApiKeys(list, settings.selectedModel);
      const newResults: Record<number, ApiKeyTestResult> = {};
      const updatedMetadata = { ...(settings.apiKeyMetadata || {}) };

      batchRes.results.forEach((item, idx) => {
        newResults[idx] = item;
        const k = list[idx];
        if (k) {
          updatedMetadata[k] = {
            ...(updatedMetadata[k] || {}),
            lastStatus: item.status,
            lastTested: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            latencyMs: item.latencyMs,
            error: item.message,
          };
        }
      });

      setKeyTestResults(newResults);
      const newSettings = { ...settings, apiKeyMetadata: updatedMetadata };
      setSettings(newSettings);
      storageService.saveSettings(newSettings);
    } catch (e) {
      console.error(e);
    } finally {
      setTestingAllKeys(false);
    }
  };

  const handleResetKeyStatus = () => {
    setKeyTestResults({});
    const updatedMetadata = { ...(settings.apiKeyMetadata || {}) };
    (settings.apiKeyList || []).forEach((k) => {
      if (updatedMetadata[k]) {
        delete updatedMetadata[k].lastStatus;
        delete updatedMetadata[k].error;
        delete updatedMetadata[k].latencyMs;
      }
    });
    const newSettings = { ...settings, apiKeyMetadata: updatedMetadata };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const handleTestServerKey = async () => {
    setTestingServerKey(true);
    setServerKeyResult(null);
    try {
      const res = await aiService.testApiKey(undefined, settings.selectedModel);
      setServerKeyResult(res);
    } catch (e: any) {
      setServerKeyResult({
        success: false,
        status: "error",
        latencyMs: 0,
        message: e.message || "Lỗi kiểm tra",
        isDefaultKey: true,
      });
    } finally {
      setTestingServerKey(false);
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
      const res = await firebaseService.migrateLocalDataToFirebase();
      setFirebaseMessage(`✓ ${res.message}`);
    } catch (e: any) {
      setFirebaseMessage(`Lỗi: ${e.message}`);
    } finally {
      setFirebaseSyncing(false);
    }
  };

  const handlePullFirebase = async () => {
    setFirebaseSyncing(true);
    setFirebaseMessage(null);
    try {
      const res = await firebaseService.pullAllFromFirebase();
      setFirebaseMessage(`✓ ${res.message}`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      setFirebaseMessage(`Lỗi: ${e.message}`);
    } finally {
      setFirebaseSyncing(false);
    }
  };

  // Google Drive Handlers
  const handleSaveDriveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: ClubSettings = {
      ...settings,
      googleDriveConfig: {
        ...(settings.googleDriveConfig || { isConnected: true }),
        isConnected: true,
        email: driveEmail.trim() || "toanthcs2025chatgpt@gmail.com",
        scriptWebhookUrl: scriptWebhookUrl.trim(),
        driveFolderUrl: driveFolderUrl.trim(),
        folderName: "CLB Toán Thầy Thắng - Báo Cáo Buổi Học",
      },
    };
    setSettings(updated);
    storageService.saveSettings(updated);
    setIsDriveConnected(true);
    setDriveMessage("✓ Đã lưu cấu hình Google Drive thành công!");
    setTimeout(() => setDriveMessage(null), 4000);
  };

  const handleConnectGoogleDrive = () => {
    setDriveConnecting(true);
    setDriveMessage(null);
    setTimeout(() => {
      const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);
      const email = driveEmail.trim() || "toanthcs2025chatgpt@gmail.com";
      const updated: ClubSettings = {
        ...settings,
        googleDriveConfig: {
          isConnected: true,
          email,
          scriptWebhookUrl: scriptWebhookUrl.trim(),
          driveFolderUrl: driveFolderUrl.trim(),
          connectedAt: nowStr,
          lastSyncAt: new Date().toLocaleString("vi-VN"),
          lastSyncStatus: "success",
          autoSync: true,
          folderName: "CLB Toán Thầy Thắng - Báo Cáo Buổi Học",
        },
      };
      setSettings(updated);
      storageService.saveSettings(updated);
      const syncRes = storageService.syncToGoogleDrive();
      setIsDriveConnected(true);
      setDriveConnecting(false);
      setDriveMessage(`✓ Đã kết nối Google Drive thành công với tài khoản ${email}! ${syncRes.message}`);
    }, 600);
  };

  const handleDisconnectGoogleDrive = () => {
    const updated: ClubSettings = {
      ...settings,
      googleDriveConfig: {
        isConnected: false,
        email: driveEmail,
        scriptWebhookUrl,
        driveFolderUrl,
      },
    };
    setSettings(updated);
    storageService.saveSettings(updated);
    setIsDriveConnected(false);
    setDriveMessage("Đã ngắt kết nối Google Drive.");
  };

  const handleSyncGoogleDrive = async (andOpenDrive: boolean = false) => {
    setDriveSyncing(true);
    setDriveMessage(null);
    try {
      const res = await storageService.pushToCloudLive({ updatedBy: settings.clubName || "Thầy Thắng" });
      setDriveSyncing(false);
      if (res.success) {
        setDriveMessage(`✓ ${res.message}`);
        setSettings(storageService.getSettings());
        if (andOpenDrive) {
          const targetUrl =
            driveFolderUrl.trim() || "https://drive.google.com/drive/u/0/my-drive";
          window.open(targetUrl, "_blank", "noopener,noreferrer");
        }
      } else {
        setDriveMessage(`⚠️ ${res.message}`);
      }
    } catch (err: any) {
      setDriveSyncing(false);
      setDriveMessage(`⚠️ Lỗi: ${err.message || "Không thể đồng bộ"}`);
    }
  };

  const handlePullFromCloud = async () => {
    if (!window.confirm("Bạn có muốn tải và cập nhật phiên bản mới nhất từ Đám mây / Google Drive về thiết bị này không? Dữ liệu trên máy này sẽ được cập nhật đồng bộ.")) {
      return;
    }
    setDriveSyncing(true);
    setDriveMessage(null);
    try {
      const res = await storageService.pullFromCloudLive();
      setDriveSyncing(false);
      if (res.success) {
        setDriveMessage(`✓ Đồng bộ thành công: ${res.message}`);
        setSettings(storageService.getSettings());
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setDriveMessage(`⚠️ ${res.message}`);
      }
    } catch (err: any) {
      setDriveSyncing(false);
      setDriveMessage(`⚠️ Lỗi: ${err.message || "Không thể tải dữ liệu"}`);
    }
  };

  const handleTestWebhook = async () => {
    if (!scriptWebhookUrl.trim()) {
      setWebhookTestResult({
        success: false,
        error: "Vui lòng dán đường dẫn Webhook (URL ứng dụng web Google Apps Script) trước khi kiểm tra.",
      });
      return;
    }

    setTestingWebhook(true);
    setWebhookTestResult(null);

    try {
      const res = await storageService.testGoogleDriveWebhook(scriptWebhookUrl.trim());
      setTestingWebhook(false);
      setWebhookTestResult(res);

      if (res.success) {
        // Auto save this working webhook URL
        const updated: ClubSettings = {
          ...settings,
          googleDriveConfig: {
            ...(settings.googleDriveConfig || { isConnected: true }),
            isConnected: true,
            scriptWebhookUrl: scriptWebhookUrl.trim(),
            driveFolderUrl: driveFolderUrl.trim(),
            autoSync: true,
          },
        };
        setSettings(updated);
        storageService.saveSettings(updated);
      }
    } catch (err: any) {
      setTestingWebhook(false);
      setWebhookTestResult({
        success: false,
        error: err.message || "Lỗi không xác định khi kết nối Webhook",
      });
    }
  };

  const handleCopyAppsScript = () => {
    const scriptCode = storageService.getGoogleAppsScriptCode();
    navigator.clipboard.writeText(scriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleRestoreFromDrive = () => {
    if (window.confirm("Bạn có chắc muốn khôi phục lại toàn bộ dữ liệu từ bản đồng bộ Google Drive gần nhất không?")) {
      const res = storageService.restoreFromGoogleDriveSnapshot();
      if (res.success) {
        setDriveMessage(`✓ ${res.message}`);
        setSettings(storageService.getSettings());
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setDriveMessage(`⚠️ ${res.message}`);
      }
    }
  };

  const handleToggleAutoSync = () => {
    const currentAuto = settings.googleDriveConfig?.autoSync !== false;
    const updated: ClubSettings = {
      ...settings,
      googleDriveConfig: {
        ...(settings.googleDriveConfig || { isConnected: true }),
        isConnected: true,
        autoSync: !currentAuto,
      },
    };
    setSettings(updated);
    storageService.saveSettings(updated);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1A472A] text-[#F4C542] flex items-center justify-center font-black text-base shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800">
                  Cấu Hình & Kiểm Tra Danh Sách Gemini API Keys
                </h3>
                <span className="text-[10px] bg-[#1A472A] text-[#F4C542] px-2 py-0.5 rounded-full font-black">
                  {(settings.apiKeyList || []).length} Keys
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Thêm nhiều key dự phòng, kiểm tra trạng thái hoạt động trực tiếp với Google Gemini AI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Reset status and Test All Keys Button */}
            {(settings.apiKeyList || []).length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleResetKeyStatus}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Đặt lại trạng thái kiểm tra"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Đặt lại trạng thái</span>
                </button>
                <button
                  type="button"
                  onClick={handleTestAllApiKeys}
                  disabled={testingAllKeys || testingKeyIndex !== null}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {testingAllKeys ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-[#F4C542]" />
                  )}
                  <span>{testingAllKeys ? "Đang kiểm tra tất cả..." : "Kiểm tra tất cả Keys"}</span>
                </button>
              </>
            )}

            {/* Test Server Default Key */}
            <button
              type="button"
              onClick={handleTestServerKey}
              disabled={testingServerKey}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {testingServerKey ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Server className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>Kiểm tra Key máy chủ</span>
            </button>
          </div>
        </div>

        {/* Server Default Key Result Banner */}
        {serverKeyResult && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center justify-between gap-2 border ${
              serverKeyResult.success
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {serverKeyResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>
                <strong>Key máy chủ:</strong> {serverKeyResult.message} ({serverKeyResult.latencyMs}ms)
              </span>
            </div>
            <button
              onClick={() => setServerKeyResult(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Đóng
            </button>
          </div>
        )}

        {/* AI Model Selection Section */}
        <div className="bg-gradient-to-r from-indigo-50/60 to-purple-50/40 p-4 rounded-2xl border-2 border-indigo-100 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/70 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <span>Lựa Chọn Mô Hình AI Google Gemini</span>
                  <span className="text-[10px] font-normal text-indigo-700 bg-indigo-100 px-2 py-0.2 rounded-full font-bold">
                    3.5 • 3.7 • 3.8
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Lựa chọn linh hoạt phiên bản mô hình AI phù hợp với nhu cầu sinh nhận xét và phân tích tiến độ học tập
                </p>
              </div>
            </div>
            <span className="text-[10.5px] font-black px-2.5 py-1 rounded-xl bg-indigo-600 text-white shadow-xs self-start sm:self-auto flex items-center gap-1">
              <Check className="w-3 h-3 text-[#F4C542]" />
              <span>Đang dùng: {AI_MODEL_OPTIONS.find((m) => m.id === (settings.selectedModel || "gemini-flash-latest"))?.shortName || "3.8"}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {AI_MODEL_OPTIONS.map((opt) => {
              const isSelected =
                (settings.selectedModel || "gemini-flash-latest") === opt.id ||
                settings.selectedModel === opt.shortName ||
                (!settings.selectedModel && opt.id === "gemini-3.8-flash");
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectModel(opt.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? `${opt.color} shadow-xs ring-2 ring-indigo-400/50 scale-[1.01]`
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-xs text-slate-900 flex items-center gap-1">
                        {opt.name}
                      </span>
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 bg-slate-100 shrink-0" />
                      )}
                    </div>
                    <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded-md ${opt.badgeColor}`}>
                      {opt.tag}
                    </span>
                    <p className="text-[10.5px] leading-tight text-slate-600 mt-1">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Keys Section (Single / Bulk tabs) */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddKeyMode("single")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  addKeyMode === "single"
                    ? "bg-[#1A472A] text-[#F4C542]"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                + Thêm 1 Key
              </button>
              <button
                type="button"
                onClick={() => setAddKeyMode("bulk")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                  addKeyMode === "bulk"
                    ? "bg-[#1A472A] text-[#F4C542]"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Dán hàng loạt (Nhiều Keys)</span>
              </button>
            </div>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Lấy Key miễn phí tại Google AI Studio</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {addKeyMode === "single" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddApiKey()}
                  placeholder="Dán Gemini API Key (Bắt đầu bằng AQ... hoặc AIzaSy...)"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#1A472A]/20"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddApiKey()}
                  placeholder="Ghi chú (VD: Key 1)"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A472A]/20"
                />
                <button
                  type="button"
                  onClick={handleAddApiKey}
                  disabled={!newApiKey.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#1A472A] hover:bg-emerald-950 disabled:opacity-50 text-[#F4C542] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={bulkKeysText}
                onChange={(e) => setBulkKeysText(e.target.value)}
                placeholder={`AQ.Ab8RNXXXXXX_key_1\nAIzaSyYYYYYY_key_2`}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#1A472A]/20"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddBulkApiKeys}
                  disabled={!bulkKeysText.trim()}
                  className="px-4 py-2 rounded-xl bg-[#1A472A] hover:bg-emerald-950 disabled:opacity-50 text-[#F4C542] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm tất cả các Key này</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Key List */}
        <div className="space-y-2.5">
          {(!settings.apiKeyList || settings.apiKeyList.length === 0) ? (
            <div className="text-xs text-slate-400 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1">
              <p className="font-bold text-slate-600">Chưa có API key tùy chỉnh nào trong danh sách.</p>
              <p className="text-[11px]">Hệ thống hiện đang dùng key mặc định từ Cloud Server.</p>
            </div>
          ) : (
            settings.apiKeyList.map((key, index) => {
              const isActive = settings.activeApiKeyIndex === index;
              const isVisible = visibleKeys[index];
              const testRes = keyTestResults[index];
              const meta = settings.apiKeyMetadata?.[key];
              const isTestingThis = testingKeyIndex === index;

              const displayKey = isVisible
                ? key
                : key.length > 12
                ? `${key.substring(0, 8)}••••••••••••${key.substring(key.length - 4)}`
                : key;

              const currentStatus = testRes?.status || meta?.lastStatus;
              const errMessage = testRes?.message || meta?.error;

              return (
                <div
                  key={index}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                    isActive
                      ? "bg-emerald-50/50 border-[#1A472A] shadow-xs"
                      : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleSelectActiveKey(index)}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${
                          isActive ? "border-[#1A472A] bg-[#1A472A]" : "border-slate-300 bg-white"
                        }`}
                        title="Chọn làm key chính ưu tiên sử dụng"
                      >
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#F4C542]" />}
                      </button>

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {meta?.label || `Key #${index + 1}`}
                          </span>
                          {isActive && (
                            <span className="text-[9px] bg-[#1A472A] text-[#F4C542] px-2 py-0.2 rounded-full font-bold">
                              Đang kích hoạt
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-600 text-[11px] select-all block truncate">
                          {displayKey}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Status pill */}
                      {currentStatus === "valid" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Hoạt động ({testRes?.latencyMs || meta?.latencyMs || 0}ms)
                        </span>
                      ) : currentStatus === "quota_exceeded" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Hết Quota
                        </span>
                      ) : currentStatus === "invalid" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                          Không hợp lệ
                        </span>
                      ) : currentStatus === "permission_denied" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                          Thiếu quyền
                        </span>
                      ) : currentStatus === "error" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                          Lỗi kết nối
                        </span>
                      ) : null}

                      {/* Test connection button */}
                      <button
                        type="button"
                        onClick={() => handleTestSingleKey(index)}
                        disabled={isTestingThis || testingAllKeys}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#1A472A] font-bold text-[11px] border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Kiểm tra kết nối key này"
                      >
                        {isTestingThis ? (
                          <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                        ) : (
                          <Zap className="w-3 h-3 text-amber-500" />
                        )}
                        <span>{isTestingThis ? "Đang test..." : "Kiểm tra"}</span>
                      </button>

                      {/* Visibility toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleKeys((prev) => ({ ...prev, [index]: !prev[index] }))
                        }
                        className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      {/* Copy */}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(key);
                          setCopiedKeyIndex(index);
                          setTimeout(() => setCopiedKeyIndex(null), 2000);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {copiedKeyIndex === index ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteApiKey(index)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Xóa Key này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {errMessage && currentStatus !== "valid" && (
                    <div className="p-2 rounded-xl text-[11px] bg-rose-50 text-rose-900 border border-rose-200 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold">Chi tiết: </span>
                        <span>{errMessage}</span>
                      </div>
                    </div>
                  )}

                  {testRes && testRes.success && (
                    <div className="p-2 rounded-xl text-[11px] bg-emerald-50 text-emerald-950 border border-emerald-200">
                      <span className="font-bold">{testRes.message}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: FIREBASE FIRESTORE INTEGRATION */}
      <div className="bg-white rounded-3xl p-6 border-2 border-amber-200 bg-amber-50/15 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800">
                  Kết Nối Cơ Sở Dữ Liệu Firebase Firestore
                </h3>
                {firebaseStatus === "connected" ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Đã kết nối Firestore
                  </span>
                ) : firebaseStatus === "error" ? (
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md border border-rose-300 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    Chưa kết nối
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                    {useFirebase ? "Đã bật cấu hình" : "Chưa kích hoạt"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Lưu trữ vĩnh viễn trên Google Cloud Firestore và tự động đồng bộ realtime giữa mọi thiết bị.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
              className="text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200/80 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>{showFirebaseGuide ? "Ẩn hướng dẫn" : "Xem hướng dẫn lấy Key"}</span>
            </button>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs cursor-pointer select-none">
              <span>Bật Firebase</span>
              <input
                type="checkbox"
                checked={useFirebase}
                onChange={(e) => setUseFirebase(e.target.checked)}
                className="w-4 h-4 text-[#1A472A] rounded focus:ring-[#1A472A]"
              />
            </label>
          </div>
        </div>

        {/* Step-by-Step Guide Accordion */}
        {showFirebaseGuide && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-2.5 leading-relaxed">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-900 text-sm">
              <Check className="w-4 h-4 text-emerald-600" />
              Lấy Web API Key cho dự án <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-900">bctg-408ca</span>:
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-slate-700">
              <li>
                Mở trực tiếp trang Cài đặt dự án:{" "}
                <a
                  href="https://console.firebase.google.com/u/0/project/bctg-408ca/settings/general"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-bold underline inline-flex items-center gap-1 hover:text-blue-800"
                >
                  Firebase Console: Cài đặt dự án bctg-408ca ↗
                </a>
              </li>
              <li>
                Tại mục <strong>Web API Key</strong> (hoặc cuộn xuống mục <strong>Your apps ➔ Web app SDK config</strong>), sao chép chuỗi <strong>API Key</strong> (dạng <code>AIzaSy...</code>).
              </li>
              <li>
                Dán vào ô <strong>Firebase API Key</strong> bên dưới và bấm nút <strong>💾 Lưu & Kiểm tra kết nối Firestore</strong>.
              </li>
            </ol>
          </div>
        )}

        {firebaseMessage && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
              firebaseStatus === "connected"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                : firebaseStatus === "error"
                ? "bg-rose-50 text-rose-800 border border-rose-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            <span>{firebaseMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Firebase Project ID <span className="text-rose-500">*</span>:
            </label>
            <input
              type="text"
              value={fbProjectId}
              onChange={(e) => handleProjectIdChange(e.target.value)}
              placeholder="VD: thaythang-math-club"
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Firebase API Key <span className="text-rose-500">*</span>:
            </label>
            <input
              type="text"
              value={fbApiKey}
              onChange={(e) => setFbApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Auth Domain (Tự động):</label>
            <input
              type="text"
              value={fbAuthDomain}
              onChange={(e) => setFbAuthDomain(e.target.value)}
              placeholder="thaythang-math-club.firebaseapp.com"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none font-mono text-slate-700"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Storage Bucket (Tự động):</label>
            <input
              type="text"
              value={fbStorageBucket}
              onChange={(e) => setFbStorageBucket(e.target.value)}
              placeholder="thaythang-math-club.appspot.com"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none font-mono text-slate-700"
            />
          </div>
        </div>

        {/* Action buttons inside Firebase card */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-100">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveAndTestFirebase}
              disabled={testingFirebase}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all border border-amber-600 shadow-sm cursor-pointer"
            >
              {testingFirebase ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{testingFirebase ? "Đang kiểm tra kết nối..." : "💾 Lưu & Kiểm tra kết nối Firestore"}</span>
            </button>
          </div>

          {useFirebase && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSyncFirebase}
                disabled={firebaseSyncing}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                title="Đẩy toàn bộ học sinh, lớp học, tài khoản và báo cáo hiện có lên Firebase"
              >
                {firebaseSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-amber-300" />}
                <span>⚡ Migrate dữ liệu lên Firestore</span>
              </button>

              <button
                type="button"
                onClick={handlePullFirebase}
                disabled={firebaseSyncing}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
                title="Tải lại toàn bộ dữ liệu từ Cloud Firestore về máy này"
              >
                {firebaseSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5 text-blue-600" />}
                <span>Tải dữ liệu từ Firestore</span>
              </button>
            </div>
          )}
        </div>
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
                Tự động đồng bộ báo cáo học tập, danh sách học sinh và sao lưu toàn bộ dữ liệu CLB lên Google Drive an toàn.
              </p>
            </div>
          </div>

          {/* Connect / Disconnect Action Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isDriveConnected ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveDriveConfig()}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-all border border-blue-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu cấu hình</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectGoogleDrive}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                >
                  Ngắt kết nối
                </button>
              </div>
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
              driveMessage.includes("Lỗi") || driveMessage.includes("⚠️")
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
              placeholder="thangsinh2444@gmail.com"
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-blue-600"
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

          <div className="sm:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">
              Đường link thư mục Google Drive (Tùy chọn - để mở nhanh):
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={driveFolderUrl}
                onChange={(e) => setDriveFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="flex-1 p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={() => {
                  const target = driveFolderUrl.trim() || "https://drive.google.com/drive/u/0/my-drive";
                  window.open(target, "_blank", "noopener,noreferrer");
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-300 cursor-pointer shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>Mở Drive</span>
              </button>
            </div>
          </div>
        </div>

        {isDriveConnected && (
          <div className="p-4 rounded-2xl bg-white border border-blue-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="font-black text-slate-800 flex items-center gap-1.5">
                  <FolderCheck className="w-4 h-4 text-blue-600" />
                  <span>Trạng thái kết nối: <strong className="text-emerald-700">Tự động đồng bộ đa thiết bị (Máy tính, Điện thoại, Máy khác)</strong></span>
                </div>
                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Thư mục Drive: <code>/CLB Toán Thầy Thắng - Báo Cáo Buổi Học/</code></span>
                  {settings.googleDriveConfig?.lastSyncAt && (
                    <span className="text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      Lần đồng bộ gần nhất: {settings.googleDriveConfig.lastSyncAt}
                    </span>
                  )}
                  {settings.googleDriveConfig?.lastSyncItemCount !== undefined && (
                    <span className="text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ✓ Đã đồng bộ an toàn {settings.googleDriveConfig.lastSyncItemCount} mục
                    </span>
                  )}
                </div>
              </div>

              {/* Auto Sync Toggle */}
              <button
                type="button"
                onClick={handleToggleAutoSync}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer self-start sm:self-auto ${
                  settings.googleDriveConfig?.autoSync !== false
                    ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    settings.googleDriveConfig?.autoSync !== false
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-slate-400"
                  }`}
                />
                <span>
                  {settings.googleDriveConfig?.autoSync !== false
                    ? "Tự động đồng bộ: BẬT"
                    : "Tự động đồng bộ: TẮT"}
                </span>
              </button>
            </div>

            {/* Quick Action Buttons for Drive */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleSyncGoogleDrive(false)}
                disabled={driveSyncing}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 transition-all border border-blue-700 shadow-sm cursor-pointer"
                title="Đẩy toàn bộ dữ liệu hiện tại lên đám mây và Google Drive"
              >
                {driveSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Đồng bộ lên Đám mây & Drive ngay</span>
              </button>

              <button
                type="button"
                onClick={handlePullFromCloud}
                disabled={driveSyncing}
                className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-black flex items-center gap-1.5 transition-colors border border-emerald-300 cursor-pointer"
                title="Tải và đồng bộ dữ liệu mới nhất từ máy khác / Drive về máy này"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-700" />
                <span>Kéo dữ liệu từ Đám mây về máy này</span>
              </button>

              <button
                type="button"
                onClick={() => handleSyncGoogleDrive(true)}
                disabled={driveSyncing}
                className="px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-950 text-xs font-black flex items-center gap-1.5 transition-colors border border-sky-300 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-700" />
                <span>Mở Google Drive</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreFromDrive}
                className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-black flex items-center gap-1.5 transition-colors border border-amber-300 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Khôi phục bản lưu trước</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    const filename = storageService.downloadBackupJSON();
                    setDriveMessage(`✓ Đã tải file sao lưu: ${filename}`);
                  } catch (e: any) {
                    setDriveMessage(`⚠️ Lỗi: ${e.message}`);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-700" />
                <span>Tải file JSON dự phòng</span>
              </button>
            </div>

            {/* Google Apps Script Webhook Integration Section (Optional direct cloud push) */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowScriptGuide(!showScriptGuide)}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1.5 cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                <span>
                  {showScriptGuide
                    ? "Ẩn hướng dẫn Tự động hóa Google Apps Script Webhook (Đẩy trực tiếp không cần mở tab)"
                    : "⚙️ Tùy chọn nâng cao: Tự động lưu thẳng vào Drive bằng Google Apps Script Webhook"}
                </span>
              </button>

              {showScriptGuide && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3 text-slate-700">
                  <p className="font-bold text-slate-900">
                    Cách tạo Webhook đẩy dữ liệu trực tiếp vào Google Drive (chỉ mất 1 phút):
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                    <li>
                      Mở <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">script.google.com</a> và bấm <strong>Dự án mới</strong>.
                    </li>
                    <li>
                      Dán đoạn mã dưới đây vào file <code>Mã.gs</code>:
                    </li>
                  </ol>

                  <div className="relative">
                    <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto">
{`function doPost(e) {
  try {
    var contents = e.postData.contents;
    var folderName = "CLB Toán Thầy Thắng - Báo Cáo Buổi Học";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    var dateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd_HHmm");
    var fileName = "SaoLuu_CLBToan_" + dateStr + ".json";
    var file = folder.createFile(fileName, contents, MimeType.PLAIN_TEXT);
    return ContentService.createTextOutput(JSON.stringify({ status: "success", fileId: file.getId() })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`}
                    </pre>
                    <button
                      type="button"
                      onClick={handleCopyAppsScript}
                      className="absolute top-2 right-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                    >
                      {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedScript ? "Đã chép mã" : "Chép mã"}</span>
                    </button>
                  </div>

                  <ol start={3} className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                    <li>
                      Bấm <strong>Triển khai (Deploy)</strong> &gt; <strong>Tùy chọn triển khai mới (New deployment)</strong> &gt; Chọn loại <strong>Ứng dụng web (Web app)</strong>.
                    </li>
                    <li>
                      Chọn <em>Thực thi dưới dạng:</em> <strong>Tôi (My account)</strong> | <em>Ai có quyền truy cập:</em> <strong>Bất kỳ ai (Anyone)</strong>.
                    </li>
                    <li>
                      Sao chép URL ứng dụng web (dạng <code>https://script.google.com/macros/s/.../exec</code>) và dán vào ô bên dưới:
                    </li>
                  </ol>

                  <div className="space-y-3 pt-1">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={scriptWebhookUrl}
                        onChange={(e) => {
                          setScriptWebhookUrl(e.target.value);
                          setWebhookTestResult(null);
                        }}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="flex-1 p-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:outline-none focus:border-blue-600 shadow-inner"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleTestWebhook}
                          disabled={testingWebhook || !scriptWebhookUrl.trim()}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                        >
                          {testingWebhook ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Kiểm tra & Lưu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveDriveConfig()}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs cursor-pointer border border-slate-300 shrink-0"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>

                    {/* Webhook Test Diagnostic Result Card */}
                    {webhookTestResult && (
                      <div
                        className={`p-3.5 rounded-xl text-xs space-y-1.5 border leading-relaxed ${
                          webhookTestResult.success
                            ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                            : "bg-rose-50 text-rose-950 border-rose-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-black">
                          {webhookTestResult.success ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>✓ Kết nối Webhook Google Drive thành công 100%!</span>
                            </>
                          ) : (
                            <>
                              <HelpCircle className="w-4 h-4 text-rose-600" />
                              <span>⚠️ Chưa kết nối được với Google Apps Script</span>
                            </>
                          )}
                        </div>

                        <p className="text-[11px] opacity-90">
                          {webhookTestResult.message || webhookTestResult.error}
                        </p>

                        {webhookTestResult.needsAuthAccess && (
                          <div className="mt-2 p-2.5 rounded-lg bg-amber-100/90 text-amber-950 border border-amber-300 text-[11px] space-y-1">
                            <p className="font-bold">👉 Cách sửa lỗi quyền truy cập trong Google Apps Script:</p>
                            <p>
                              1. Vào trang script của bạn &gt; Bấm nút <strong>Triển khai (Deploy)</strong> &gt; <strong>Quản lý bản triển khai (Manage deployments)</strong>.
                            </p>
                            <p>
                              2. Bấm biểu tượng ✏️ <strong>Chỉnh sửa (Edit)</strong>.
                            </p>
                            <p>
                              3. Tại mục <strong>Ai có quyền truy cập (Who has access)</strong>, chọn: <strong>Bất kỳ ai (Anyone)</strong> (thay vì "Chỉ mình tôi").
                            </p>
                            <p>
                              4. Chọn <em>Phiên bản:</em> <strong>Mới (New)</strong> và bấm <strong>Triển khai (Deploy)</strong>.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2.5: ADMIN ACCOUNT & SECURITY & AVATAR */}
      <form onSubmit={handleSaveAdminAccount} className="bg-white rounded-3xl p-6 border-2 border-amber-300 bg-amber-50/20 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs">
              👑
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>Tài Khoản & Ảnh Đại Diện Quản Trị Viên (Admin - Thầy Thắng)</span>
                <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-2 py-0.5 rounded-md">
                  Chủ nhiệm
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Đổi ảnh đại diện Admin, Tên hiển thị, Gmail đăng nhập, Username và Mật khẩu quản trị.
              </p>
            </div>
          </div>

          {adminAccountSaved && (
            <div className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5 self-start sm:self-auto border border-emerald-300">
              <Check className="w-3.5 h-3.5" />
              <span>Đã lưu tài khoản & ảnh đại diện Admin!</span>
            </div>
          )}
        </div>

        {/* Avatar Upload for Admin */}
        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs">
          <AvatarUpload
            value={adminAvatar}
            onChange={(url) => setAdminAvatar(url)}
            name={adminName}
            label="Ảnh đại diện Quản Trị Viên (Admin - Thầy Thắng):"
            type="admin"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-black text-slate-700 block mb-1">
              Tên hiển thị Quản Trị Viên:
            </label>
            <input
              type="text"
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Thầy Thắng (Chủ nhiệm)"
              className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-bold text-slate-900"
            />
          </div>

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
              Số điện thoại Admin / Hotline:
            </label>
            <input
              type="tel"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              placeholder="0988.123.456"
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

          <div className="sm:col-span-2 lg:col-span-2">
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
            * Sau khi lưu, ảnh đại diện sẽ tự động cập nhật ngay trên thanh Header, thẻ Admin và hệ thống.
          </p>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-[0_3px_0_0_#b45309] active:shadow-none active:translate-y-0.5 border border-amber-300 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>Lưu tài khoản & Ảnh Admin</span>
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

    </div>
  );
};
