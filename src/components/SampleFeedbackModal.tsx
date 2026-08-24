import React from "react";
import { X, Sparkles, Check, Copy, BookOpen } from "lucide-react";
import { SAMPLE_FEEDBACK_TEMPLATES, SampleFeedbackTemplate } from "../data/feedbackCriteria";

interface SampleFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SampleFeedbackTemplate) => void;
}

export const SampleFeedbackModal: React.FC<SampleFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-6 py-4 flex items-center justify-between border-b-2 border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-tight">
                Kho Mẫu Câu Nhận Xét Chung Ca Dạy
              </h3>
              <p className="text-xs text-blue-200 font-medium">
                Chọn mẫu câu chuẩn sư phạm, truyền cảm hứng để áp dụng ngay hoặc cho AI tối ưu thêm
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

        {/* Content list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {SAMPLE_FEEDBACK_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 transition-all space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900">{tpl.title}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-extrabold border border-blue-200">
                    {tpl.persona}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectTemplate(tpl);
                    onClose();
                  }}
                  className="btn-3d-primary text-xs py-1.5 px-3"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Áp dụng mẫu này</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                {tpl.content}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t-2 border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-3d-secondary text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
