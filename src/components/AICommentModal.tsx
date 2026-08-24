import React, { useState } from "react";
import { Sparkles, Check, X, Wand2, Zap, HeartHandshake, GraduationCap, Lightbulb, Loader2, ArrowRight } from "lucide-react";
import { aiService, AIRefineRequest } from "../services/ai";

interface AICommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  attendance: string;
  homework: string;
  comprehension: string;
  attitude: string;
  initialComment: string;
  onApply: (newComment: string) => void;
}

export const AICommentModal: React.FC<AICommentModalProps> = ({
  isOpen,
  onClose,
  studentName,
  attendance,
  homework,
  comprehension,
  attitude,
  initialComment,
  onApply,
}) => {
  const [currentComment, setCurrentComment] = useState(initialComment || "");
  const [generatedComment, setGeneratedComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string>("rewrite");
  const [customPrompt, setCustomPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (action: AIRefineRequest["action"], promptText?: string) => {
    setActiveAction(action);
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.refineComment({
        studentName,
        attendance,
        homework,
        comprehension,
        attitude,
        rawComment: currentComment,
        action,
        customPrompt: promptText || customPrompt,
      });

      setGeneratedComment(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể kết nối AI. Vui lòng kiểm tra lại kết nối mạng hoặc API Key.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedComment) {
      onApply(generatedComment);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#1A472A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4C542]/20 border border-[#F4C542] flex items-center justify-center text-[#F4C542]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                AI Hỗ Trợ Viết Nhận Xét
                <span className="text-xs bg-[#F4C542] text-[#1A472A] px-2 py-0.5 rounded-full font-bold">
                  Gemini 2.5
                </span>
              </h3>
              <p className="text-xs text-emerald-100">
                Học sinh: <strong className="text-white">{studentName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700">
          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Chọn kiểu nhận xét mong muốn:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleGenerate("rewrite")}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                  activeAction === "rewrite" && generatedComment
                    ? "bg-[#1A472A] text-white border-[#1A472A] shadow-xs"
                    : "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border-slate-200 text-slate-700"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-[#F4C542] shrink-0" />
                <span>Viết lại chuẩn mực</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerate("short")}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                  activeAction === "short" && generatedComment
                    ? "bg-[#1A472A] text-white border-[#1A472A] shadow-xs"
                    : "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border-slate-200 text-slate-700"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Ngắn gọn, súc tích</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerate("positive")}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                  activeAction === "positive" && generatedComment
                    ? "bg-[#1A472A] text-white border-[#1A472A] shadow-xs"
                    : "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border-slate-200 text-slate-700"
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Tích cực, khích lệ</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerate("teacher_style")}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                  activeAction === "teacher_style" && generatedComment
                    ? "bg-[#1A472A] text-white border-[#1A472A] shadow-xs"
                    : "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border-slate-200 text-slate-700"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Văn phong Giáo viên</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerate("improvement")}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                  activeAction === "improvement" && generatedComment
                    ? "bg-[#1A472A] text-white border-[#1A472A] shadow-xs"
                    : "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border-slate-200 text-slate-700"
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                <span>Gợi ý hướng cải thiện</span>
              </button>
            </div>
          </div>

          {/* Context Summary */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs flex flex-wrap gap-x-4 gap-y-1.5 text-slate-600">
            <div>
              <span className="font-semibold text-slate-700">Chuyên cần:</span>{" "}
              <span className="text-emerald-700 font-medium">{attendance}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">BTVN:</span>{" "}
              <span className="text-emerald-700 font-medium">{homework}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Tiếp thu:</span>{" "}
              <span className="text-emerald-700 font-medium">{comprehension}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Thái độ:</span>{" "}
              <span className="text-emerald-700 font-medium">{attitude}</span>
            </div>
          </div>

          {/* Side by side / Stack Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Draft */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Nháp ghi chú ban đầu:
              </label>
              <textarea
                value={currentComment}
                onChange={(e) => setCurrentComment(e.target.value)}
                placeholder="Ghi chú thô của trợ giảng (ví dụ: làm tốt câu 1, câu 2 còn tính nhầm...)"
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A472A]/20 focus:border-[#1A472A] resize-none"
              />
            </div>

            {/* Generated AI Output */}
            <div>
              <label className="text-xs font-semibold text-emerald-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#F4C542]" />
                  Đề xuất từ AI:
                </span>
                {generatedComment && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    {generatedComment.length} ký tự
                  </span>
                )}
              </label>
              <div
                className={`relative w-full h-[106px] text-xs p-3 rounded-xl border overflow-y-auto transition-all ${
                  loading
                    ? "bg-slate-50 border-emerald-200 flex items-center justify-center text-slate-400"
                    : generatedComment
                    ? "bg-emerald-50/50 border-emerald-300 text-slate-800 font-medium leading-relaxed"
                    : "bg-slate-50 border-dashed border-slate-200 text-slate-400 flex items-center justify-center text-center italic"
                }`}
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-1.5 text-emerald-700">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[11px] font-medium">AI đang viết nhận xét...</span>
                  </div>
                ) : generatedComment ? (
                  generatedComment
                ) : (
                  "Bấm một trong các nút phía trên để AI gợi ý nhận xét chuẩn phụ huynh."
                )}
              </div>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-2">
            {!generatedComment && (
              <button
                type="button"
                onClick={() => handleGenerate("rewrite")}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold bg-emerald-100 text-[#1A472A] hover:bg-emerald-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Tạo nhận xét
              </button>
            )}

            {generatedComment && (
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 text-xs font-bold bg-[#1A472A] text-white hover:bg-emerald-900 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-[#F4C542]" />
                Áp dụng nhận xét này
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
