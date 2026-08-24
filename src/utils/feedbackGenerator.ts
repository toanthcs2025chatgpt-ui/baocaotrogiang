import { FEEDBACK_CRITERIA } from "../data/feedbackCriteria";
import { FeedbackPersona } from "../types";

export interface GenerateFeedbackOptions {
  className?: string;
  teacherName?: string;
  assistantName?: string;
  lessonContent?: string;
  homeworkAssigned?: string;
  persona?: FeedbackPersona;
  selectedCriteria?: string[]; // IDs or labels
  selectedCriteriaLabels?: string[];
  criteriaStudentMap?: Record<string, string>; // criterionId -> "Học sinh A, Học sinh B"
  customNotes?: string;
  
  // Ghi chú lỗi sai & lầm lẫn kiến thức
  misconceptionNotes?: string;
  misconceptionStudents?: string[];
  misconceptionTags?: string[];
}

/**
 * Helper to format a criterion with tagged student names
 */
function formatCriterionWithStudents(
  criterion: { id: string; label: string; type: "praise" | "warning" },
  criteriaStudentMap?: Record<string, string>
): string {
  const tagged = criteriaStudentMap?.[criterion.id]?.trim();
  if (!tagged) return criterion.label;
  const prefix = criterion.type === "praise" ? "Tuyên dương" : "Lưu ý";
  return `${criterion.label} (${prefix}: ${tagged})`;
}

/**
 * Helper to format math misconceptions section
 */
function formatMisconceptionsBlock(options: GenerateFeedbackOptions): string[] {
  const lines: string[] = [];
  const tags = options.misconceptionTags || [];
  const students = options.misconceptionStudents || [];
  const note = options.misconceptionNotes?.trim();

  if (tags.length === 0 && students.length === 0 && !note) {
    return lines;
  }

  lines.push(``);
  lines.push(`🔍 LƯU Ý LỖI SAI & KIẾN THỨC CẦN CỦNG CỐ:`);
  
  if (tags.length > 0) {
    lines.push(`• Lỗi sai thường gặp: ${tags.join("; ")}`);
  }
  if (students.length > 0) {
    lines.push(`• Học sinh cần chú ý rèn thêm: ${students.join(", ")}`);
  }
  if (note) {
    lines.push(`• Ghi chú hướng dẫn: ${note}`);
  }

  return lines;
}

/**
 * KIỂU 1: TỔNG HỢP NHANH DỰA TRÊN TÍCH CHỌN (ĐƠN GIẢN, NGẮN GỌN, TRỰC DIỆN - 0 GIÂY)
 */
export function generateDirectCriteriaFeedback(options: GenerateFeedbackOptions): string {
  const className = options.className?.trim() || "Lớp Toán";
  const teacherName = options.teacherName?.trim() || "Thầy Thắng";
  const assistantName = options.assistantName?.trim() || "Trợ giảng";
  const lessonContent = options.lessonContent?.trim() || "Chuyên đề Toán học tư duy";
  const homeworkAssigned = options.homeworkAssigned?.trim() || "Hoàn thành bài tập về nhà theo phiếu";
  
  // Match criteria
  const criterionIds = options.selectedCriteria || [];
  const activeCriteria = FEEDBACK_CRITERIA.filter(
    (c) =>
      criterionIds.includes(c.id) ||
      (options.selectedCriteriaLabels &&
        options.selectedCriteriaLabels.some((l) => l.includes(c.label)))
  );

  const praises = activeCriteria
    .filter((c) => c.type === "praise")
    .map((c) => formatCriterionWithStudents(c, options.criteriaStudentMap));
  const warnings = activeCriteria
    .filter((c) => c.type === "warning")
    .map((c) => formatCriterionWithStudents(c, options.criteriaStudentMap));

  const lines: string[] = [];
  lines.push(`📢 [CLB TOÁN THẦY THẮNG - NHẬN XÉT CA HỌC]`);
  lines.push(`🏫 Lớp: ${className} | GV: ${teacherName} | TG: ${assistantName}`);
  lines.push(`📖 Bài học: ${lessonContent}`);
  
  if (options.customNotes?.trim()) {
    lines.push(`📌 Ghi chú: ${options.customNotes.trim()}`);
  }

  lines.push(``);
  lines.push(`✅ ĐIỂM TỐT & NỀ NẾP:`);
  if (praises.length > 0) {
    praises.forEach((p) => lines.push(`• ${p}`));
  } else {
    lines.push(`• Cả lớp đi học đúng giờ, tập trung nghe giảng và tiếp thu bài tốt.`);
  }

  if (warnings.length > 0) {
    lines.push(``);
    lines.push(`⚠️ ĐIỂM CẦN LƯU Ý:`);
    warnings.forEach((w) => lines.push(`• ${w}`));
  }

  // Misconception block
  const miscLines = formatMisconceptionsBlock(options);
  if (miscLines.length > 0) {
    lines.push(...miscLines);
  }

  lines.push(``);
  lines.push(`📝 BÀI TẬP VỀ NHÀ:`);
  lines.push(`${homeworkAssigned}`);
  lines.push(``);
  lines.push(`Kính nhờ Quý Phụ huynh nhắc nhở các con hoàn thành bài tập đúng hạn. Cảm ơn bố mẹ!`);

  return lines.join("\n");
}

/**
 * KIỂU 2: TỔNG HỢP SÚC TÍCH VỚI VĂN PHONG (NGẮN GỌN 5-8 DÒNG, CHỌN LỌC, ĐỦ Ý)
 */
export function generateSmartClassFeedback(options: GenerateFeedbackOptions): string {
  const className = options.className || "Lớp Toán";
  const teacherName = options.teacherName?.trim() || "Thầy Thắng";
  const assistantName = options.assistantName?.trim() || "Trợ giảng CLB";
  const lessonContent =
    options.lessonContent?.trim() ||
    "Chuyên đề Toán học tư duy & Rèn luyện kỹ năng giải bài";
  const homeworkAssigned =
    options.homeworkAssigned?.trim() ||
    "Hoàn thành toàn bộ phiếu bài tập được giao và nộp đúng hạn.";
  const persona = options.persona || "pedagogical";

  const criterionIds = options.selectedCriteria || [];
  const activeCriteria = FEEDBACK_CRITERIA.filter(
    (c) =>
      criterionIds.includes(c.id) ||
      (options.selectedCriteriaLabels &&
        options.selectedCriteriaLabels.some((l) => l.includes(c.label)))
  );

  const praises = activeCriteria
    .filter((c) => c.type === "praise")
    .map((c) => formatCriterionWithStudents(c, options.criteriaStudentMap));
  const warnings = activeCriteria
    .filter((c) => c.type === "warning")
    .map((c) => formatCriterionWithStudents(c, options.criteriaStudentMap));

  if (praises.length === 0 && warnings.length === 0) {
    praises.push("Cả lớp đi học đúng giờ, hăng hái phát biểu và tiếp thu bài nhanh");
  }

  const customNotesLine = options.customNotes?.trim() ? `\n📌 Ghi chú: ${options.customNotes.trim()}` : "";

  // Format misconception summary for concise views
  let miscShortText = "";
  if (options.misconceptionTags?.length || options.misconceptionNotes?.trim()) {
    const parts: string[] = [];
    if (options.misconceptionTags?.length) {
      parts.push(`Lỗi cần lưu ý: ${options.misconceptionTags.join(", ")}`);
    }
    if (options.misconceptionStudents?.length) {
      parts.push(`(Nhắc riêng: ${options.misconceptionStudents.join(", ")})`);
    }
    if (options.misconceptionNotes?.trim()) {
      parts.push(`- Hướng dẫn: ${options.misconceptionNotes.trim()}`);
    }
    miscShortText = `\n🔍 Kiến thức cần rèn thêm: ${parts.join(" ")}`;
  }

  // 1. Chuẩn sư phạm – Ngắn gọn
  if (persona === "pedagogical") {
    const praiseSection = praises.map((p) => `• ${p}`).join("\n");
    const warningSection =
      warnings.length > 0
        ? `\n⚠️ Lưu ý rèn luyện:\n${warnings.map((w) => `• ${w}`).join("\n")}`
        : "";

    return `📚 [CLB TOÁN THẦY THẮNG - NHẬN XÉT BUỔI HỌC]
🏫 Lớp: ${className} | GV: ${teacherName} & TG: ${assistantName}
📖 Chuyên đề: ${lessonContent}${customNotesLine}

📊 Tình hình học tập:
${praiseSection}${warningSection}${miscShortText}

📝 BTVN & Dặn dò: ${homeworkAssigned}

Kính mong Quý Phụ huynh đôn đốc các con tự giác làm bài đầy đủ. Trân trọng!`;
  }

  // 2. Tích cực – Khích lệ (Ngắn gọn)
  if (persona === "positive") {
    const praiseSection = praises.map((p) => `✨ ${p}`).join("\n");
    const warningSection =
      warnings.length > 0
        ? `\n🎯 Cùng cố gắng hơn:\n${warnings.map((w) => `• ${w}`).join("\n")}`
        : "";

    return `🌟 [CLB TOÁN THẦY THẮNG - TIN BUỔI HỌC ${className}]
Chào bố mẹ và các con! Hôm nay lớp có một buổi học rất tích cực cùng thầy ${teacherName} & ${assistantName}.
📖 Bài học: ${lessonContent}${customNotesLine}

🎉 Điểm sáng hôm nay:
${praiseSection}${warningSection}${miscShortText}

📝 BTVN: ${homeworkAssigned}
Chúc các con luôn giữ vững phong độ và đam mê môn Toán! ❤️📐`;
  }

  // 3. Thân thiện – Gần gũi (Ngắn gọn)
  if (persona === "friendly") {
    const praiseSection = praises.map((p) => `🌱 ${p}`).join("\n");
    const warningSection =
      warnings.length > 0
        ? `\n📌 Thầy cô nhắn nhủ nhẹ:\n${warnings.map((w) => `• ${w}`).join("\n")}`
        : "";

    return `🌸 [CLB TOÁN THẦY THẮNG - GỬI PHỤ HUYNH ${className}]
Thầy ${teacherName} & ${assistantName} gửi lời thăm bố mẹ và báo cáo buổi học:
📖 Chuyên đề: ${lessonContent}${customNotesLine}

🌼 Tình hình lớp học:
${praiseSection}${warningSection}${miscShortText}

📝 Dặn dò BTVN: ${homeworkAssigned}
Nhờ bố mẹ động viên các con hoàn thành bài tập sớm nhé ạ. Cảm ơn bố mẹ! 🌿`;
  }

  // 4. “Thầy cô chủ nhiệm” – Ấm áp & Hài hước (Ngắn gọn)
  const praiseSection = praises.map((p) => `🚀 ${p}`).join("\n");
  const warningSection =
    warnings.length > 0
      ? `\n👉 Nhắc nhẹ một xíu:\n${warnings.map((w) => `• ${w}`).join("\n")}`
      : "";

  return `☕🎉 [CLB TOÁN THẦY THẮNG - BẢN TIN LỚP ${className}]
Đội ngũ phụ trách: ${teacherName} & ${assistantName} báo cáo nhanh tình hình:
📐 Thử thách hôm nay: ${lessonContent}${customNotesLine}

🔥 Phong độ lớp học:
${praiseSection}${warningSection}${miscShortText}

📝 BTVN: ${homeworkAssigned}
Nhớ hoàn thành bài tập trước khi thư giãn nhé các bạn! Chúc cả nhà buổi tối vui vẻ! 🥳✨`;
}

/**
 * KIỂU 3: TỔNG HỢP ĐẦY ĐỦ / TOÀN DIỆN (CHI TIẾT, BÀI BẢN, TRANG TRỌNG)
 */
export function generateDetailedFullFeedback(options: GenerateFeedbackOptions): string {
  const className = options.className?.trim() || "Lớp Toán";
  const teacherName = options.teacherName?.trim() || "Thầy Thắng";
  const assistantName = options.assistantName?.trim() || "Trợ giảng CLB";
  const lessonContent =
    options.lessonContent?.trim() ||
    "Chuyên đề Toán học tư duy & Phương pháp giải toán nâng cao";
  const homeworkAssigned =
    options.homeworkAssigned?.trim() ||
    "Hoàn thành toàn bộ bài tập trong phiếu học tập và chuẩn bị bài cho buổi tiếp theo.";

  // Match criteria
  const criterionIds = options.selectedCriteria || [];
  const activeCriteria = FEEDBACK_CRITERIA.filter(
    (c) =>
      criterionIds.includes(c.id) ||
      (options.selectedCriteriaLabels &&
        options.selectedCriteriaLabels.some((l) => l.includes(c.label)))
  );

  const praiseCriteria = activeCriteria.filter((c) => c.type === "praise");
  const warningCriteria = activeCriteria.filter((c) => c.type === "warning");

  const lines: string[] = [];
  lines.push(`📋 [CLB TOÁN THẦY THẮNG - BÁO CÁO TOÀN DIỆN BUỔI HỌC]`);
  lines.push(`Kính gửi Quý Phụ huynh và các con học sinh ${className},`);
  lines.push(``);
  lines.push(`📍 THÔNG TIN CA HỌC:`);
  lines.push(`• Lớp học: ${className}`);
  lines.push(`• Giáo viên giảng dạy: ${teacherName}`);
  lines.push(`• Trợ giảng phụ trách: ${assistantName}`);
  lines.push(`• Chuyên đề trọng tâm: ${lessonContent}`);
  if (options.customNotes?.trim()) {
    lines.push(`• Tình hình sĩ số & nề nếp: ${options.customNotes.trim()}`);
  }

  lines.push(``);
  lines.push(`🌟 1. ĐÁNH GIÁ TÍCH CỰC & ĐIỂM SÁNG:`);
  if (praiseCriteria.length > 0) {
    praiseCriteria.forEach((c) => {
      const tagged = options.criteriaStudentMap?.[c.id]?.trim();
      if (tagged) {
        lines.push(`• ${c.label}`);
        lines.push(`  👉 Tuyên dương: ${tagged}`);
      } else {
        lines.push(`• ${c.label}`);
      }
    });
  } else {
    lines.push(`• Cả lớp tham gia học tập nghiêm túc, tích cực tương tác và xây dựng bài.`);
  }

  if (warningCriteria.length > 0) {
    lines.push(``);
    lines.push(`⚠️ 2. CÁC ĐIỂM CẦN LƯU Ý & RÈN LUYỆN THÊM:`);
    warningCriteria.forEach((c) => {
      const tagged = options.criteriaStudentMap?.[c.id]?.trim();
      if (tagged) {
        lines.push(`• ${c.label}`);
        lines.push(`  👉 Thầy cô lưu ý riêng: ${tagged}`);
      } else {
        lines.push(`• ${c.label}`);
      }
    });
    lines.push(`(Thầy cô đã trực tiếp kèm cặp và nhắc nhở các con ngay trong giờ học)`);
  }

  // Misconception block
  const miscLines = formatMisconceptionsBlock(options);
  if (miscLines.length > 0) {
    lines.push(...miscLines);
  }

  lines.push(``);
  lines.push(`📚 3. HƯỚNG DẪN BÀI TẬP VỀ NHÀ & TỰ HỌC:`);
  lines.push(`• Nội dung: ${homeworkAssigned}`);
  lines.push(`• Yêu cầu: Trình bày bài cẩn thận, rõ ràng từng bước giải, vẽ hình chuẩn xác (nếu có hình học).`);

  lines.push(``);
  lines.push(`💖 LỜI NHẮN NHỦ TỪ THẦY CÔ:`);
  lines.push(`Sự đồng hành và đôn đốc hàng ngày của Bố Mẹ là nguồn động lực to lớn giúp các con tiến bộ vững chắc. Thầy cô luôn sẵn sàng giải đáp thắc mắc của các con trong quá trình tự học ở nhà.`);
  lines.push(``);
  lines.push(`Kính chúc Quý Phụ huynh cùng gia đình một tuần làm việc hiệu quả và nhiều niềm vui!`);
  lines.push(`Trân trọng cảm ơn! 🙏✨`);

  return lines.join("\n");
}
