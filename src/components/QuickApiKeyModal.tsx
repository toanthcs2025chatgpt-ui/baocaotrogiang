import React, { useState } from "react";
import { X, Key, Plus, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";
import { storageService } from "../services/storage";

interface QuickApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const QuickApiKeyModal: React.FC<QuickApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [settings, setSettings] = useState(() => storageService.getSettings());
  const [newKey, setNewKey] = useState("");

  if (!isOpen) return null;

  const handleAddKey = () => {
    if (!newKey.trim()) return;
    const currentList = settings.apiKeyList || [];
    const updated = [...currentList, newKey.trim()];
    const newSettings = { ...settings, apiKeyList: updated };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    setNewKey("");
    onSaved();
  };

  const handleRemoveKey = (index: number) => {
    const currentList = settings.apiKeyList || [];
    const updated = currentList.filter((_, i) => i !== index);
    let activeIdx = settings.activeApiKeyIndex;
    if (activeIdx >= updated.length) activeIdx = Math.max(0, updated.length - 1);
    const newSettings = { ...settings, apiKeyList: updated, activeApiKeyIndex: activeIdx };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    onSaved();
  };

  const handleSetActive = (index: number) => {
    const newSettings = { ...settings, activeApiKeyIndex: index };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    onSaved();
  };

  const keyList = settings.apiKeyList || [];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-6 py-4 flex items-center justify-between border-b-2 border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-300">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-tight">
                Cài Đặt Gemini API Key
              </h3>
              <p className="text-xs text-blue-200 font-medium">
                Quản lý danh sách API Key dự phòng để tạo nhận xét AI không gián đoạn
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 font-medium space-y-1">
            <div className="flex items-center gap-1.5 font-black text-blue-950 text-xs">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Hệ thống luân chuyển & Dự phòng API Key</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Bạn có thể thêm nhiều API Key Gemini. Khi 1 key hết hạn mức, hệ thống có thể chuyển sang key tiếp theo.
            </p>
          </div>

          {/* Add Key Form */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">Thêm API Key mới:</label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleAddKey}
                disabled={!newKey.trim()}
                className="btn-3d-primary text-xs py-2 px-3 shrink-0"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Thêm</span>
              </button>
            </div>
          </div>

          {/* Keys List */}
          <div className="space-y-2 pt-2">
            <label className="font-bold text-slate-700 block">
              Danh sách Keys ({keyList.length} keys):
            </label>

            {keyList.length === 0 ? (
              <div className="text-center py-6 text-slate-400 border border-dashed rounded-2xl">
                Chưa có API key tùy chỉnh nào (Hệ thống đang dùng key mặc định từ máy chủ).
              </div>
            ) : (
              <div className="space-y-2">
                {keyList.map((k, idx) => {
                  const isActive = settings.activeApiKeyIndex === idx;
                  const masked = k.slice(0, 8) + "••••••••" + k.slice(-4);

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${
                        isActive
                          ? "bg-blue-50/80 border-blue-500 shadow-xs"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleSetActive(idx)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                            isActive
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <div>
                          <span className="font-mono font-bold text-slate-800 text-xs">{masked}</span>
                          <span className="text-[10px] text-slate-400 block">Key #{idx + 1}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                            Đang sử dụng
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveKey(idx)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600"
                          title="Xóa Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t-2 border-slate-200 flex items-center justify-end">
          <button type="button" onClick={onClose} className="btn-3d-secondary text-xs">
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
