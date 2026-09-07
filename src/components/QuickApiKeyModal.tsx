import React, { useState } from "react";
import {
  X,
  Key,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Loader2,
  AlertTriangle,
  HelpCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  Server,
  Layers,
  ArrowRight,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { storageService } from "../services/storage";
import { aiService, ApiKeyTestResult } from "../services/ai";
import { ClubSettings } from "../types";

interface QuickApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
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

export const QuickApiKeyModal: React.FC<QuickApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [settings, setSettings] = useState<ClubSettings>(() => storageService.getSettings());
  const [addMode, setAddMode] = useState<"single" | "bulk">("single");
  const [newKey, setNewKey] = useState("");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [bulkKeysText, setBulkKeysText] = useState("");
  
  // Visibility toggles
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Test states
  const [testingIndex, setTestingIndex] = useState<number | null>(null);
  const [testingAll, setTestingAll] = useState(false);
  const [testingDefault, setTestingDefault] = useState(false);
  const [defaultKeyResult, setDefaultKeyResult] = useState<ApiKeyTestResult | null>(null);
  
  // Key test results keyed by key index or string
  const [testResults, setTestResults] = useState<Record<number, ApiKeyTestResult>>({});

  if (!isOpen) return null;

  const keyList = settings.apiKeyList || [];

  // Toggle visible for a specific key index
  const toggleVisibility = (index: number) => {
    setVisibleKeys((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopyKey = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Add a single key
  const handleAddSingleKey = () => {
    const cleanKey = newKey.trim();
    if (!cleanKey) return;

    const currentList = settings.apiKeyList || [];
    if (currentList.includes(cleanKey)) {
      alert("Key này đã có trong danh sách!");
      return;
    }

    const updatedList = [...currentList, cleanKey];
    const updatedMetadata = { ...(settings.apiKeyMetadata || {}) };
    if (newKeyLabel.trim()) {
      updatedMetadata[cleanKey] = {
        label: newKeyLabel.trim(),
        lastStatus: "untested",
      };
    }

    const newSettings: ClubSettings = {
      ...settings,
      apiKeyList: updatedList,
      apiKeyMetadata: updatedMetadata,
      activeApiKeyIndex: settings.activeApiKeyIndex ?? 0,
    };

    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    setNewKey("");
    setNewKeyLabel("");
    onSaved();
  };

  // Bulk add multiple keys from text (supports newlines, commas, spaces)
  const handleAddBulkKeys = () => {
    if (!bulkKeysText.trim()) return;

    // Split by newlines, commas, semicolons, or spaces
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

    const updatedList = [...currentList, ...uniqueNewKeys];
    const newSettings: ClubSettings = {
      ...settings,
      apiKeyList: updatedList,
      activeApiKeyIndex: settings.activeApiKeyIndex ?? 0,
    };

    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    setBulkKeysText("");
    setAddMode("single");
    onSaved();
  };

  const handleRemoveKey = (index: number) => {
    const keyToRemove = keyList[index];
    const updated = keyList.filter((_, i) => i !== index);
    let activeIdx = settings.activeApiKeyIndex;
    if (activeIdx >= updated.length) activeIdx = Math.max(0, updated.length - 1);

    const updatedMetadata = { ...(settings.apiKeyMetadata || {}) };
    if (keyToRemove && updatedMetadata[keyToRemove]) {
      delete updatedMetadata[keyToRemove];
    }

    const newSettings: ClubSettings = {
      ...settings,
      apiKeyList: updated,
      apiKeyMetadata: updatedMetadata,
      activeApiKeyIndex: activeIdx,
    };

    // Clean test result
    const newResults = { ...testResults };
    delete newResults[index];
    setTestResults(newResults);

    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    onSaved();
  };

  const handleClearAllKeys = () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ danh sách API Key tùy chỉnh?")) return;
    const newSettings: ClubSettings = {
      ...settings,
      apiKeyList: [],
      apiKeyMetadata: {},
      activeApiKeyIndex: 0,
    };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    setTestResults({});
    onSaved();
  };

  const handleSetActive = (index: number) => {
    const newSettings = { ...settings, activeApiKeyIndex: index };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    onSaved();
  };

  const handleSelectModel = (modelId: string) => {
    const newSettings = { ...settings, selectedModel: modelId };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    onSaved();
  };

  // Test single key connection
  const handleTestKey = async (index: number) => {
    const targetKey = keyList[index];
    if (!targetKey) return;

    setTestingIndex(index);
    try {
      const result = await aiService.testApiKey(targetKey, settings.selectedModel);
      setTestResults((prev) => ({ ...prev, [index]: result }));

      // Save status in metadata
      const updatedMetadata = { ...(settings.apiKeyMetadata || {}) };
      updatedMetadata[targetKey] = {
        ...(updatedMetadata[targetKey] || {}),
        lastStatus: result.status,
        lastTested: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        latencyMs: result.latencyMs,
        error: result.message,
      };
      const updatedSettings = { ...settings, apiKeyMetadata: updatedMetadata };
      setSettings(updatedSettings);
      storageService.saveSettings(updatedSettings);
    } catch (e: any) {
      setTestResults((prev) => ({
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
      setTestingIndex(null);
    }
  };

  // Test all keys in batch
  const handleTestAllKeys = async () => {
    if (keyList.length === 0) return;
    setTestingAll(true);

    try {
      const batchRes = await aiService.testBatchApiKeys(keyList, settings.selectedModel);
      const newResults: Record<number, ApiKeyTestResult> = {};
      const updatedMetadata = { ...(settings.apiKeyMetadata || {}) };

      batchRes.results.forEach((item, idx) => {
        newResults[idx] = item;
        const k = keyList[idx];
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

      setTestResults(newResults);
      const updatedSettings = { ...settings, apiKeyMetadata: updatedMetadata };
      setSettings(updatedSettings);
      storageService.saveSettings(updatedSettings);
    } catch (e) {
      console.error("Batch test error:", e);
    } finally {
      setTestingAll(false);
    }
  };

  // Reset status of all keys to fresh
  const handleResetAllStatus = () => {
    setTestResults({});
    const updatedMetadata = { ...(settings.apiKeyMetadata || {}) };
    keyList.forEach((k) => {
      if (updatedMetadata[k]) {
        delete updatedMetadata[k].lastStatus;
        delete updatedMetadata[k].error;
        delete updatedMetadata[k].latencyMs;
      }
    });
    const updatedSettings = { ...settings, apiKeyMetadata: updatedMetadata };
    setSettings(updatedSettings);
    storageService.saveSettings(updatedSettings);
    onSaved();
  };

  // Test Default Server Key
  const handleTestDefaultKey = async () => {
    setTestingDefault(true);
    setDefaultKeyResult(null);
    try {
      const res = await aiService.testApiKey(undefined, settings.selectedModel);
      setDefaultKeyResult(res);
    } catch (e: any) {
      setDefaultKeyResult({
        success: false,
        status: "error",
        latencyMs: 0,
        message: e.message || "Không thể kiểm tra máy chủ",
        isDefaultKey: true,
      });
    } finally {
      setTestingDefault(false);
    }
  };

  const renderStatusBadge = (res?: ApiKeyTestResult, metaStatus?: string) => {
    const status = res?.status || metaStatus;

    if (status === "valid") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Hoạt động ({res?.latencyMs || 0}ms)
        </span>
      );
    }
    if (status === "quota_exceeded") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300" title="Hết hạn mức Quota">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Hết Quota
        </span>
      );
    }
    if (status === "invalid") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300" title="Key không hợp lệ">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          Key không hợp lệ
        </span>
      );
    }
    if (status === "permission_denied") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300">
          <ShieldCheck className="w-3 h-3 text-purple-600" />
          Thiếu quyền
        </span>
      );
    }
    if (status === "error") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          Lỗi kết nối
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
        Chưa kiểm tra
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A472A] via-emerald-900 to-[#1A472A] text-white px-6 py-4 flex items-center justify-between border-b-2 border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F4C542] text-[#1A472A] flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-300">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-tight flex items-center gap-2">
                Quản Lý & Kiểm Tra Gemini API Keys
                <span className="text-[10px] bg-[#F4C542] text-[#1A472A] px-2 py-0.5 rounded-full font-black">
                  {keyList.length} Keys
                </span>
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                Thêm nhiều khóa API dự phòng và kiểm tra tốc độ phản hồi kết nối trực tiếp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
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

          {/* Top Action & Mode Selector */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold text-xs block">Cơ chế bảo toàn hoạt động AI:</span>
                <span className="text-[11px] text-emerald-800">
                  Khi 1 API key bị hết Quota (Rate limit 429), hệ thống sẽ tự động dùng key dự phòng tiếp theo.
                </span>
              </div>
            </div>

            {/* Test All Keys Button */}
            {keyList.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetAllStatus}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title="Đặt lại trạng thái kiểm tra của tất cả các keys"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Đặt lại trạng thái</span>
                </button>
                <button
                  type="button"
                  onClick={handleTestAllKeys}
                  disabled={testingAll || testingIndex !== null}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  {testingAll ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-[#F4C542]" />
                  )}
                  <span>{testingAll ? "Đang kiểm tra tất cả..." : "Kiểm tra tất cả Keys"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Add Key Tabs */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAddMode("single")}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    addMode === "single"
                      ? "bg-[#1A472A] text-[#F4C542] shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  + Thêm 1 Key
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("bulk")}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1 cursor-pointer ${
                    addMode === "bulk"
                      ? "bg-[#1A472A] text-[#F4C542] shadow-xs"
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

            {addMode === "single" ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSingleKey()}
                      placeholder="Dán Gemini API Key (Bắt đầu bằng AQ... hoặc AIzaSy...)"
                      className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-[#1A472A]"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newKeyLabel}
                      onChange={(e) => setNewKeyLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSingleKey()}
                      placeholder="Ghi chú / Tên (VD: Key Thầy Thắng)"
                      className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-white text-xs focus:outline-none focus:border-[#1A472A]"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddSingleKey}
                    disabled={!newKey.trim()}
                    className="px-4 py-2 rounded-xl bg-[#1A472A] hover:bg-emerald-950 disabled:opacity-50 text-[#F4C542] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lưu Key vào danh sách</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-[11px] text-slate-500">
                  Dán nhiều API Key (mỗi dòng 1 key, hoặc ngăn cách bằng dấu phẩy). Hệ thống tự nhận diện các key định dạng mới <code className="font-mono bg-slate-200 px-1 rounded">AQ...</code> hoặc <code className="font-mono bg-slate-200 px-1 rounded">AIzaSy...</code>:
                </p>
                <textarea
                  rows={3}
                  value={bulkKeysText}
                  onChange={(e) => setBulkKeysText(e.target.value)}
                  placeholder={`AQ.Ab8RNXXXXXX_key_1\nAQ.Ab8RNYYYYYY_key_2\nAIzaSyZZZZZZ_key_3`}
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-[#1A472A]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleAddBulkKeys}
                    disabled={!bulkKeysText.trim()}
                    className="px-4 py-2 rounded-xl bg-[#1A472A] hover:bg-emerald-950 disabled:opacity-50 text-[#F4C542] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm tất cả các Key này</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Keys List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-800 text-xs flex items-center gap-2">
                <span>Danh Sách API Keys Đang Cấu Hình ({keyList.length}):</span>
              </label>

              {keyList.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetAllStatus}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-bold hover:underline cursor-pointer"
                  >
                    Xóa lịch sử lỗi
                  </button>
                  {keyList.length > 1 && (
                    <button
                      type="button"
                      onClick={handleClearAllKeys}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
              )}
            </div>

            {keyList.length === 0 ? (
              <div className="text-center py-8 px-4 text-slate-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl space-y-2">
                <Key className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-xs">Chưa có API Key tùy chỉnh nào.</p>
                <p className="text-[11px] text-slate-400">
                  Hệ thống đang sử dụng Key mặc định của máy chủ. Bạn có thể thêm key dự phòng ở trên để không bị gián đoạn khi nhận xét đông học sinh.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {keyList.map((k, idx) => {
                  const isActive = settings.activeApiKeyIndex === idx;
                  const isVisible = visibleKeys[idx];
                  const testRes = testResults[idx];
                  const meta = settings.apiKeyMetadata?.[k];
                  const isTestingThis = testingIndex === idx;

                  const displayKey = isVisible
                    ? k
                    : k.length > 12
                    ? `${k.substring(0, 8)}••••••••••••${k.substring(k.length - 4)}`
                    : k;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border-2 transition-all space-y-2 ${
                        isActive
                          ? "bg-emerald-50/50 border-[#1A472A] shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Top row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {/* Active Radio */}
                          <button
                            type="button"
                            onClick={() => handleSetActive(idx)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer shrink-0 transition-colors ${
                              isActive
                                ? "border-[#1A472A] bg-[#1A472A] text-white"
                                : "border-slate-300 bg-white hover:border-[#1A472A]"
                            }`}
                            title="Chọn làm key chính ưu tiên sử dụng"
                          >
                            {isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>

                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-xs">
                                {meta?.label || `Key #${idx + 1}`}
                              </span>
                              {isActive && (
                                <span className="text-[9px] bg-[#1A472A] text-[#F4C542] px-2 py-0.2 rounded-full font-black">
                                  Đang kích hoạt
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-slate-600 text-[11px] truncate select-all">
                              {displayKey}
                            </div>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="shrink-0 flex items-center gap-1.5">
                          {renderStatusBadge(testRes, meta?.lastStatus)}
                        </div>
                      </div>

                      {/* Error details box if any */}
                      {(() => {
                        const errMessage = testRes?.message || meta?.error;
                        const currentStatus = testRes?.status || meta?.lastStatus;
                        const hasError = currentStatus && currentStatus !== "valid";
                        if (!hasError || !errMessage) return null;
                        return (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-bold">Chi tiết phản hồi: </span>
                              <span>{errMessage}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Action buttons on card */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center gap-2 text-slate-500">
                          {meta?.lastTested && (
                            <span>Lần test gần nhất: {meta.lastTested}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Test this key */}
                          <button
                            type="button"
                            onClick={() => handleTestKey(idx)}
                            disabled={isTestingThis || testingAll}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                            title="Gửi kiểm tra kết nối với Google Gemini"
                          >
                            {isTestingThis ? (
                              <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                            ) : (
                              <Zap className="w-3 h-3 text-amber-500" />
                            )}
                            <span>{isTestingThis ? "Đang test..." : "Kiểm tra kết nối"}</span>
                          </button>

                          {/* Toggle visibility */}
                          <button
                            type="button"
                            onClick={() => toggleVisibility(idx)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            title={isVisible ? "Ẩn bớt ký tự" : "Hiện toàn bộ Key"}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          {/* Copy key */}
                          <button
                            type="button"
                            onClick={() => handleCopyKey(k, idx)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Sao chép Key"
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete key */}
                          <button
                            type="button"
                            onClick={() => handleRemoveKey(idx)}
                            className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Xóa Key này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Diagnostic error / success message if tested */}
                      {testRes && (
                        <div
                          className={`p-2 rounded-xl text-[11px] leading-relaxed border ${
                            testRes.success
                              ? "bg-emerald-50 text-emerald-950 border-emerald-200"
                              : "bg-rose-50 text-rose-950 border-rose-200"
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1">
                            {testRes.success ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                            )}
                            <span>{testRes.message}</span>
                          </div>
                          {testRes.sampleResponse && (
                            <p className="text-[10px] opacity-80 mt-0.5 font-mono">
                              Phản hồi: &quot;{testRes.sampleResponse}&quot;
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Server Default Key Check */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-xs text-slate-800">
                  Key Mặc Định Của Máy Chủ (Server Environment Key):
                </span>
              </div>

              <button
                type="button"
                onClick={handleTestDefaultKey}
                disabled={testingDefault}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-800 font-bold rounded-lg border border-slate-200 text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {testingDefault ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                <span>Kiểm tra Key máy chủ</span>
              </button>
            </div>

            {defaultKeyResult && (
              <div
                className={`p-2.5 rounded-xl text-[11px] border ${
                  defaultKeyResult.success
                    ? "bg-emerald-50 text-emerald-950 border-emerald-200"
                    : "bg-rose-50 text-rose-950 border-rose-200"
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {defaultKeyResult.success ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>
                    {defaultKeyResult.message} ({defaultKeyResult.latencyMs}ms)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t-2 border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Tự động lưu vào cấu hình hệ thống
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-[#1A472A] hover:bg-emerald-950 text-[#F4C542] text-xs font-black shadow-sm transition-colors cursor-pointer"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
