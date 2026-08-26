import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  X,
  User,
  Image as ImageIcon,
  Check,
  RotateCcw,
} from "lucide-react";

interface AvatarUploadProps {
  value?: string;
  onChange: (avatarUrl: string) => void;
  name?: string;
  label?: string;
  type?: "student" | "assistant" | "user";
}

// Preset avatars curated for Students & Assistants
const PRESET_STUDENT_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
];

const PRESET_ASSISTANT_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
];

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  value,
  onChange,
  name = "",
  label = "Ảnh đại diện:",
  type = "student",
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const presets = type === "assistant" ? PRESET_ASSISTANT_AVATARS : PRESET_STUDENT_AVATARS;
  const initialChar = name.trim() ? name.trim().charAt(name.trim().lastIndexOf(" ") + 1) || name.trim().charAt(0) : "?";

  // Compress & convert file to Base64 (max 240x240) to keep localStorage fast
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file định dạng hình ảnh (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 240;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          onChange(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleApplyUrl = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setCustomUrl("");
      setShowUrlInput(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-700 block text-xs">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Xóa ảnh (dùng mặc định)</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-3xl bg-slate-50 border-2 border-slate-200">
        {/* Avatar Display - 4x size (w-28 h-28 / w-32 h-32) */}
        <div className="relative group shrink-0">
          <div
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden flex items-center justify-center font-black text-3xl border-3 shadow-md transition-all ${
              value
                ? "border-blue-400 bg-slate-100"
                : type === "assistant"
                ? "bg-blue-600 text-white border-blue-700"
                : "bg-emerald-600 text-amber-300 border-emerald-700"
            }`}
          >
            {value ? (
              <img
                src={value}
                alt={name || "Avatar"}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{initialChar.toUpperCase()}</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-2 border-white cursor-pointer transition-transform group-hover:scale-110 flex items-center gap-1"
            title="Tải ảnh lên từ máy"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-900 border-2 border-blue-200 hover:border-blue-400 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Tải ảnh từ máy</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                showPresets
                  ? "bg-amber-100 border-amber-400 text-amber-900"
                  : "bg-white hover:bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Chọn avatar mẫu</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline px-1.5 py-1"
            >
              Dán link URL
            </button>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            Khung ảnh hiển thị sắc nét cỡ lớn. Hỗ trợ định dạng PNG, JPG, WEBP trực quan.
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Preset Avatars Drawer */}
      {showPresets && (
        <div className="p-3 rounded-2xl bg-amber-50/70 border-2 border-amber-200 animate-in fade-in duration-150 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-950 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Chọn một ảnh đại diện mẫu phù hợp:
            </span>
            <button
              type="button"
              onClick={() => setShowPresets(false)}
              className="text-amber-800 hover:text-amber-950 text-xs font-bold"
            >
              Đóng
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {presets.map((url, idx) => {
              const isSelected = value === url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(url);
                    setShowPresets(false);
                  }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 group cursor-pointer ${
                    isSelected
                      ? "border-blue-600 ring-2 ring-blue-400 scale-105"
                      : "border-slate-200 hover:border-blue-400 hover:scale-105 bg-white"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Preset ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center rounded-lg">
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom URL Input */}
      {showUrlInput && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 border border-slate-200 animate-in fade-in duration-150">
          <input
            type="url"
            placeholder="Dán đường dẫn link ảnh (https://...)"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-medium focus:outline-none focus:border-blue-600"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            Áp dụng
          </button>
        </div>
      )}
    </div>
  );
};
