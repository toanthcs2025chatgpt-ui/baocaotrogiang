import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Helper to initialize Gemini
  function getGeminiClient(customApiKey?: string) {
    const key = customApiKey?.trim() || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Chưa cấu hình GEMINI_API_KEY trong hệ thống hoặc trong cài đặt.");
    }
    return new GoogleGenAI({ apiKey: key });
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI endpoint: Refine single student comment
  app.post("/api/ai/comment", async (req, res) => {
    try {
      const {
        studentName,
        attendance,
        homework,
        comprehension,
        attitude,
        rawComment,
        action, // 'rewrite' | 'short' | 'positive' | 'teacher_style' | 'improvement' | 'custom'
        customPrompt,
        apiKey,
      } = req.body;

      const ai = getGeminiClient(apiKey);

      const actionPromptMap: Record<string, string> = {
        rewrite: "Viết lại nhận xét này một cách rõ ràng, sư phạm, chuẩn mực và lịch sự.",
        short: "Viết lại nhận xét thật ngắn gọn, súc tích (1-2 câu) nhưng đầy đủ ý chính.",
        positive: "Viết lại với văn phong khích lệ, tích cực, nhấn mạnh sự cố gắng của học sinh.",
        teacher_style: "Viết theo văn phong giáo viên toán chủ nhiệm gửi phụ huynh: ân cần, nghiêm túc, sâu sát và cụ thể.",
        improvement: "Tập trung phân tích và đưa ra 1-2 lời khuyên, gợi ý cụ thể để học sinh cải thiện bài tập/kỹ năng trong các buổi tới.",
        custom: customPrompt || "Hoàn thiện nhận xét học sinh chuyên nghiệp.",
      };

      const attendanceLabels: Record<string, string> = {
        present: "Có mặt",
        late: "Đi muộn",
        excused: "Nghỉ có phép",
        unexcused: "Nghỉ không phép",
      };
      const homeworkLabels: Record<string, string> = {
        excellent: "Hoàn thành tốt",
        completed: "Hoàn thành",
        incomplete: "Chưa hoàn thành đầy đủ",
        none: "Không làm",
      };
      const comprehensionLabels: Record<string, string> = {
        very_good: "Rất tốt",
        good: "Tốt",
        acceptable: "Đạt yêu cầu",
        needs_effort: "Cần cố gắng",
        not_grasping: "Chưa nắm được bài",
      };
      const attitudeLabels: Record<string, string> = {
        very_active: "Rất tích cực",
        active: "Tích cực",
        normal: "Bình thường",
        passive: "Thụ động",
        unfocused: "Chưa tập trung",
      };

      const systemPrompt = `Bạn là trợ lý AI chuyên môn của CLB TOÁN THẦY THẮNG.
Nhiệm vụ của bạn là hỗ trợ trợ giảng và giáo viên viết nhận xét từng học sinh sau buổi học toán.
Quy tắc bắt buộc:
1. Tuyệt đối không sử dụng từ ngữ xúc phạm, tiêu cực hay gây tổn thương. Luôn mang tính xây dựng, chuyên nghiệp và sư phạm.
2. Dùng từ ngữ tự nhiên, mạch lạc, phù hợp để gửi trực tiếp cho phụ huynh qua Zalo/Sổ liên lạc.
3. Chỉ trả về nội dung đoạn nhận xét bằng tiếng Việt (không thêm tiêu đề, không chào hỏi dư thừa, không ngoặc kép).
4. Phản ánh đúng thực tế dữ liệu đầu vào.`;

      const userMessage = `Thông tin học sinh:
- Họ và tên: ${studentName || "Học sinh"}
- Chuyên cần: ${attendanceLabels[attendance] || attendance || "Có mặt"}
- Bài tập về nhà: ${homeworkLabels[homework] || homework || "Hoàn thành"}
- Mức độ tiếp thu: ${comprehensionLabels[comprehension] || comprehension || "Tốt"}
- Thái độ học tập: ${attitudeLabels[attitude] || attitude || "Tích cực"}
- Ghi chú/Nháp ban đầu của trợ giảng: "${rawComment || "(Chưa có nháp)"}"

Yêu cầu chỉnh sửa: ${actionPromptMap[action] || actionPromptMap.rewrite}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${systemPrompt}\n\n${userMessage}`,
      });

      const text = response.text?.trim() || "";
      res.json({ success: true, comment: text });
    } catch (error: any) {
      console.error("Gemini Comment Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Lỗi khi tạo nhận xét qua AI.",
      });
    }
  });

  // AI endpoint: Comprehensive student learning analysis based on history
  app.post("/api/ai/student-analysis", async (req, res) => {
    try {
      const { student, historyReports, apiKey } = req.body;

      if (!student || !historyReports || historyReports.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Cần ít nhất một báo cáo lịch sử để phân tích tiến độ học tập.",
        });
      }

      const ai = getGeminiClient(apiKey);

      const historySummary = historyReports
        .map((r: any, idx: number) => {
          return `Buổi ${idx + 1} (${r.date} - ${r.className || ""}):
- Chuyên cần: ${r.attendance}
- BTVN: ${r.homework}
- Tiếp thu: ${r.comprehension}
- Thái độ: ${r.attitude}
- Nhận xét buổi học: ${r.comment || "(Không có)"}
- Nội dung bài học: ${r.lessonContent || "(Không ghi)"}`;
        })
        .join("\n\n");

      const prompt = `Bạn là Chuyên gia Cố vấn Học thuật của CLB TOÁN THẦY THẮNG.
Hãy phân tích lịch sử học tập thực tế của học sinh sau đây và trả về định dạng JSON chính xác.

HỌC SINH:
- Họ tên: ${student.name}
- Lớp: ${student.className || ""}
- Ghi chú: ${student.note || "Không"}

LỊCH SỬ CÁC BUỔI HỌC GẦN ĐÂY (${historyReports.length} buổi):
${historySummary}

QUY TẮC PHÂN TÍCH:
1. Dựa hoàn toàn vào dữ liệu thực tế trên, không bịa đặt điểm số hay bài thi không có.
2. Trả về đúng định dạng JSON có cấu trúc sau:
{
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "improvements": ["Điểm cần cải thiện 1", "Điểm cần cải thiện 2"],
  "trend": "Mô tả xu hướng tiến bộ tổng thể (khoảng 2-3 câu súc tích)",
  "attentionPoints": ["Vấn đề cần lưu ý 1", "Vấn đề cần lưu ý 2"],
  "teacherAdvice": "Đề xuất cụ thể cho Giáo viên và Trợ giảng trong các buổi học tới",
  "parentSummary": "Đoạn nhận xét tổng kết lịch sự, chuẩn mực, ân cần để gửi Phụ huynh học sinh"
}

Chỉ trả về chuỗi JSON hợp lệ, không có markdown codeblock hay text thừa.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const rawJson = response.text?.trim() || "{}";
      let parsed = {};
      try {
        parsed = JSON.parse(rawJson);
      } catch (e) {
        // Fallback sanitize if markdown fences were returned
        const cleaned = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
      }

      res.json({ success: true, analysis: parsed });
    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Lỗi khi phân tích quá trình học tập qua AI.",
      });
    }
  });

  // AI endpoint: Batch generate draft comments for a whole class
  app.post("/api/ai/batch-comments", async (req, res) => {
    try {
      const { lessonContent, students, apiKey } = req.body;
      const ai = getGeminiClient(apiKey);

      const prompt = `Bạn là trợ lý AI CLB TOÁN THẦY THẮNG.
Hãy viết nhận xét ngắn gọn (1-2 câu), chuyên nghiệp, lịch sự cho từng học sinh dưới đây sau buổi học: "${lessonContent || "Buổi học toán"}".

Danh sách học sinh:
${JSON.stringify(students, null, 2)}

Trả về JSON array các object với format:
[
  {
    "studentId": "id",
    "comment": "Nội dung nhận xét"
  }
]
Chỉ trả về JSON hợp lệ.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const rawJson = response.text?.trim() || "[]";
      let results = [];
      try {
        results = JSON.parse(rawJson);
      } catch (e) {
        const cleaned = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
        results = JSON.parse(cleaned);
      }

      res.json({ success: true, comments: results });
    } catch (error: any) {
      console.error("Batch AI Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Lỗi khi sinh nhận xét hàng loạt.",
      });
    }
  });

  // AI endpoint: Generate whole-class pedagogical feedback based on selected criteria & persona
  app.post("/api/ai/class-feedback", async (req, res) => {
    try {
      const {
        className,
        teacherName,
        assistantName,
        lessonContent,
        homeworkAssigned,
        persona, // 'pedagogical' | 'positive' | 'friendly' | 'warm_humor'
        selectedCriteriaLabels, // string[]
        customNotes,
        misconceptionNotes,
        misconceptionStudents,
        misconceptionTags,
        mode = "concise", // 'concise' | 'detailed'
        apiKey,
      } = req.body;

      const ai = getGeminiClient(apiKey);

      const personaDirectives: Record<string, string> = {
        pedagogical:
          "Văn phong 'Chuẩn sư phạm – Khách quan & Ân cần': Mô phạm, chỉn chu, công tâm và giàu tính sư phạm. Phân tích tiến độ, nề nếp và kết quả học tập khoa học, khích lệ sự cố gắng.",
        positive:
          "Văn phong 'Tích cực – Khích lệ & Truyền cảm hứng': Tràn đầy năng lượng tích cực, tôn vinh từng nỗ lực dù nhỏ nhất, truyền lửa say mê học toán, biến những điểm cần nhắc nhở thành lời động viên ấm lòng.",
        friendly:
          "Văn phong 'Thân thiện – Gần gũi & Tâm tình': Chân thành, tâm tình ấm áp như trò chuyện gia đình giữa thầy cô và quý phụ huynh, đồng hành cùng các con.",
        warm_humor:
          "Văn phong '“Thầy cô chủ nhiệm” – Ấm áp, Hài hước & Truyền lửa': Hóm hỉnh, yêu thương, tạo không khí học toán hào hứng, tiếp thêm tự tin cho học sinh.",
      };

      const personaStyle = personaDirectives[persona] || personaDirectives.positive;

      // Misconceptions block string
      let miscInfo = "";
      if (
        (misconceptionTags && misconceptionTags.length > 0) ||
        (misconceptionStudents && misconceptionStudents.length > 0) ||
        misconceptionNotes
      ) {
        miscInfo = `\nKIẾN THỨC CÒN LẦM LẪN & LỖI SAI CẦN CỦNG CỐ:
- Lỗi sai phổ biến: ${misconceptionTags?.join("; ") || "Chưa ghi nhận"}
- Học sinh cần lưu ý rèn thêm: ${misconceptionStudents?.join(", ") || "Chưa ghi nhận"}
- Hướng dẫn của giáo viên: ${misconceptionNotes || "Chưa có"}`;
      }

      let prompt = "";
      if (mode === "detailed") {
        prompt = `Bạn là Trợ lý Giáo viên của CLB TOÁN THẦY THẮNG.
Nhiệm vụ: Viết một bài BÁO CÁO & NHẬN XÉT BUỔI HỌC TOÀN DIỆN, ĐẦY ĐỦ, VĂN PHONG THÂN THIỆN, KHÍCH LỆ, ĐỘNG VIÊN VÀ TRUYỀN CẢM HỨNG để gửi vào nhóm Zalo Phụ huynh.

THÔNG TIN BUỔI HỌC:
- Lớp: ${className || "Lớp Toán"}
- Giáo viên giảng dạy: ${teacherName || "Thầy Thắng"} | Trợ giảng: ${assistantName || "Trợ giảng CLB"}
- Chuyên đề bài học: ${lessonContent || "Chuyên đề Toán học tư duy & Rèn luyện kỹ năng giải bài"}
- BTVN / Dặn dò: ${homeworkAssigned || "Hoàn thành phiếu bài tập được giao và nộp đúng hạn"}
- Sĩ số & Ghi chú nề nếp: ${customNotes || "(Không có)"}

TIÊU CHÍ ĐÁNH GIÁ & DANH SÁCH HỌC SINH ĐƯỢC TUYÊN DƯƠNG / LƯU Ý:
${
  selectedCriteriaLabels && selectedCriteriaLabels.length > 0
    ? selectedCriteriaLabels.map((c: string) => `- ${c}`).join("\n")
    : "- Cả lớp đi học đúng giờ, tập trung nghe giảng và tiếp thu bài tốt."
}
${miscInfo}

ĐẶC TRƯNG VĂN PHONG YÊU CẦU:
- Văn phong: THÂN THIỆN, ẤM ÁP, KHÍCH LỆ, ĐỘNG VIÊN VÀ TRUYỀN CẢM HỨNG HỌC TOÁN.
- Giọng văn chân thành, tôn trọng phụ huynh, thương yêu học trò. Tuyên dương rõ nét những tiến bộ và nỗ lực của các con; với những điểm cần rèn thêm thì dùng ngôn từ ân cần, định hướng và tiếp thêm tự tin.
- Phong cách áp dụng: ${personaStyle}

CẤU TRÚC BÀI VIẾT ĐẦY ĐỦ GỒM (Bố cục đẹp mắt, trang trọng):
1. 📋 [CLB TOÁN THẦY THẮNG - BÁO CÁO TOÀN DIỆN BUỔI HỌC]
   Lời chào ân cần gửi Quý Phụ huynh và các con học sinh ${className || ""}.
2. 📍 THÔNG TIN CA HỌC:
   • Lớp: ${className || "Lớp Toán"} | GV: ${teacherName || "Thầy Thắng"} | TG: ${assistantName || "Trợ giảng CLB"}
   • Chuyên đề trọng tâm: ${lessonContent || ""}
   • Tình hình sĩ số & nề nếp: ${customNotes || "Đầy đủ sĩ số"}
3. 🌟 1. ĐIỂM SÁNG & TINH THẦN HỌC TẬP:
   Nêu bật tinh thần học tập của lớp và TUYÊN DƯƠNG RÕ TÊN các học sinh có biểu hiện xuất sắc, tiến bộ (kèm lời khích lệ).
4. 🌱 2. NHỮNG ĐIỂM THẦY CÔ ĐỒNG HÀNH RÈN LUYỆN THÊM:
   Nêu rõ các điểm cần lưu ý và nhắc nhở các học sinh được lưu ý một cách tinh tế, ân cần, tiếp thêm động lực (không phê bình tiêu cực).
5. 🔍 3. LƯU Ý KIẾN THỨC & LỖI SAI CẦN KHẮC PHỤC (nếu có thông tin ở trên):
   Chỉ rõ các lỗi sai thường gặp và cách thầy cô hướng dẫn để phụ huynh cùng nắm bắt.
6. 📚 4. HƯỚNG DẪN BÀI TẬP VỀ NHÀ & TỰ HỌC:
   Dặn dò bài tập cụ thể, khuyến khích các con tự giác làm bài.
7. 💖 LỜI NHẮN NHỦ TRUYỀN CẢM HỨNG & TRI ÂN:
   Đoạn văn ngắn truyền cảm hứng về môn Toán, sự kiên trì và lời cảm ơn chân thành đến Quý Phụ huynh.

QUY TẮC:
- Định dạng rõ ràng, tách bạch từng mục, dùng các biểu tượng emoji giáo dục tinh tế (📋, 📍, 🌟, 🌱, 🔍, 📚, 💖, 🙏✨).
- Tiếng Việt chuẩn mực, giàu cảm xúc tích cực và tính sư phạm.
- Trả về trực tiếp văn bản (không bọc code block markdown).`;
      } else {
        prompt = `Bạn là Trợ lý Giáo viên CLB TOÁN THẦY THẮNG.
Nhiệm vụ: Viết một bài BÁO CÁO & NHẬN XÉT BUỔI HỌC TOÁN NGẮN GỌN, SÚC TÍCH, VĂN PHONG THÂN THIỆN, ĐỘNG VIÊN để gửi vào nhóm Zalo Phụ huynh.

YÊU CẦU ĐỘ DÀI & PHONG CÁCH QUAN TRỌNG:
- CỰC KỲ NGẮN GỌN, SÚC TÍCH (khoảng 6-9 dòng), KHÔNG DÀI DÒNG.
- Bố cục rõ ràng để phụ huynh đọc trên điện thoại nắm ngay thông tin trong 15 giây.

THÔNG TIN BUỔI HỌC:
- Lớp: ${className || "Lớp Toán"}
- Giáo viên: ${teacherName || "Thầy Thắng"} | Trợ giảng: ${assistantName || "Trợ giảng CLB"}
- Bài học: ${lessonContent || "Chuyên đề Toán tư duy"}
- BTVN / Dặn dò: ${homeworkAssigned || "Hoàn thành phiếu bài tập được giao"}
- Ghi chú: ${customNotes || "(Không có)"}

TIÊU CHÍ ĐÃ CHỌN & HỌC SINH TAG:
${
  selectedCriteriaLabels && selectedCriteriaLabels.length > 0
    ? selectedCriteriaLabels.map((c: string) => `- ${c}`).join("\n")
    : "- Cả lớp đi học đúng giờ, tập trung nghe giảng và tiếp thu bài tốt."
}
${miscInfo}

VĂN PHONG ÁP DỤNG (${persona}):
${personaStyle}

CẤU TRÚC GỌN GÀNG GỒM:
1. Header: 📢 [CLB TOÁN THẦY THẮNG - NHẬN XÉT BUỔI HỌC] (Lớp, GV/TG, Bài học)
2. Tình hình buổi học (kết hợp các tiêu chí khen ngợi / lưu ý đã chọn thành 2-3 gạch đầu dòng ngắn gọn)
3. Lỗi sai cần lưu ý (nếu có)
4. BTVN & Lời nhắn nhủ gửi Quý Phụ huynh.

QUY TẮC:
- Tiếng Việt chuẩn mực, tôn trọng, chân thành, truyền cảm hứng.
- Trả về trực tiếp văn bản (không bọc code block markdown).`;
      }

      let text = "";
      try {
        const ai = getGeminiClient(apiKey);
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        text = response.text?.trim() || "";
      } catch (geminiError: any) {
        console.warn("Gemini model call failed, synthesizing server-side template:", geminiError.message);
        
        // Smart pedagogical template fallback on server
        const criteriaList =
          selectedCriteriaLabels && selectedCriteriaLabels.length > 0
            ? selectedCriteriaLabels.map((c: string) => `• ${c}`).join("\n")
            : "• Cả lớp đi học đúng giờ, tập trung nghe giảng và tiếp thu bài tốt.";

        text = `📚 [CLB TOÁN THẦY THẮNG - BÁO CÁO BUỔI HỌC TOÀN DIỆN]
🏫 Lớp: ${className || "Lớp Toán"}
👨‍🏫 Giáo viên: ${teacherName || "Thầy Thắng"} | Trợ giảng: ${assistantName || "Trợ giảng CLB"}
📖 Chuyên đề bài học: ${lessonContent || "Chuyên đề Toán học tư duy & Kỹ năng làm bài"}
${customNotes ? `📌 ${customNotes}` : ""}

📊 ĐÁNH GIÁ CHUNG VỀ NỀ NẾP & HỌC TẬP:
${criteriaList}

💡 MỨC ĐỘ TIẾP THU KIẾN THỨC:
Buổi học diễn ra nghiêm túc, đúng kế hoạch. Đa số các con nắm bắt tốt phương pháp tư duy và tích cực hoàn thành các bài tập trên lớp.

📝 BÀI TẬP VỀ NHÀ VÀ DẶN DÒ:
${homeworkAssigned || "Hoàn thành toàn bộ phiếu bài tập được giao và nộp đúng hạn."}

Kính mong Quý Phụ huynh phối hợp đôn đốc các con tự giác làm bài. Trân trọng cảm ơn Quý Phụ huynh!`;
      }

      res.json({ success: true, feedback: text });
    } catch (error: any) {
      console.error("Class Feedback Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Lỗi khi tổng hợp nhận xét chung.",
      });
    }
  });

  // AI endpoint: Weekly & Monthly Bulletin Synthesis from approved reports
  app.post("/api/ai/bulletin", async (req, res) => {
    try {
      const {
        period = "weekly", // 'weekly' | 'monthly' | 'custom'
        timeframeLabel,
        classId = "all",
        className = "Toàn bộ các lớp",
        reports = [],
        frequentAbsenceStudents = [],
        repeatedIssueStudents = [],
        praiseStudents = [],
        commonMisconceptions = [],
        apiKey,
      } = req.body;

      const isSpecificClass = className && className !== "Toàn bộ các lớp";
      const periodTitle = period === "monthly" ? "HÀNG THÁNG" : period === "custom" ? "TỔNG HỢP TOÀN KHÓA" : "HÀNG TUẦN";
      const classSuffix = isSpecificClass ? ` - LỚP ${className.toUpperCase()}` : "";
      const timeStr = timeframeLabel || (period === "monthly" ? "Tháng này" : "Tuần này");

      // Build structured context from approved reports
      const reportsSummary = reports
        .map((r: any, idx: number) => {
          return `Ca ${idx + 1} (${r.date} - ${r.className || ""}):
- Giáo viên/Trợ giảng: ${r.teacherName || "Thầy Thắng"} / ${r.assistantName || "Trợ giảng"}
- Nội dung bài học: ${r.lessonContent || "Chuyên đề Toán"}
- Nhận xét chung: ${r.generalComment || "Không có"}
- Lỗi sai cần lưu ý: ${r.misconceptionNotes || "Không có"}`;
        })
        .join("\n\n");

      const absenceText =
        frequentAbsenceStudents.length > 0
          ? frequentAbsenceStudents
              .map(
                (s: any) =>
                  `• ${s.studentName} (${s.className}): Nghỉ ${s.absenceCount} buổi (Ngày: ${s.dates?.join(", ")})`
              )
              .join("\n")
          : "• Không có học sinh nào nghỉ từ 2 buổi trở lên. Nề nếp chuyên cần rất tốt!";

      const issuesText =
        repeatedIssueStudents.length > 0
          ? repeatedIssueStudents
              .map(
                (s: any) =>
                  `• ${s.studentName} (${s.className}) - Vấn đề [${s.issueLabel}]: Bị nhắc ${s.occurrences} lần. Chi tiết: ${s.details?.join("; ")}`
              )
              .join("\n")
          : "• Đa số học sinh giữ vững nề nếp, không có học sinh bị nhắc nhở lặp lại.";

      const praiseText =
        praiseStudents.length > 0
          ? praiseStudents
              .map((s: any) => `• ${s.studentName} (${s.className}): ${s.highlight}`)
              .join("\n")
          : "• Các con học sinh đều có tinh thần học tập tích cực và chăm chỉ.";

      const miscText =
        commonMisconceptions.length > 0
          ? commonMisconceptions.map((m: string) => `• ${m}`).join("\n")
          : "• Chưa ghi nhận lỗ hổng kiến thức nghiêm trọng.";

      let text = "";

      try {
        const ai = getGeminiClient(apiKey);

        const prompt = `Bạn là Trợ lý Cố vấn Học thuật Cấp cao kiêm Thầy Chủ nhiệm CLB TOÁN THẦY THẮNG.
Nhiệm vụ: Hãy đọc toàn bộ dữ liệu báo cáo trợ giảng đã được Thầy Thắng duyệt dưới đây để viết một **BẢN TIN THÔNG BÁO & NHẮC NHỞ HỌC VỤ ${periodTitle}${classSuffix}** (${timeStr}) gửi vào nhóm Zalo Phụ huynh và học sinh ${isSpecificClass ? `lớp ${className}` : "toàn CLB"}.

DỮ LIỆU THỰC TẾ ĐÃ DUYỆT TỪ CÁC CA DẠY:
1. Thông tin thời gian: ${timeStr} - Đối tượng: ${className}
2. Tổng số ca dạy đã duyệt: ${reports.length} ca
3. Chi tiết các ca dạy:
${reportsSummary || "(Chưa có ca dạy cụ thể, viết theo tinh thần chung của lớp)"}

4. DANH SÁCH HỌC SINH NGHỈ HỌC (Cần nhắc nhở & bổ trợ bài):
${absenceText}

5. DANH SÁCH HỌC SINH BỊ NHẮC NHỞ NHIỀU LẦN VỀ CÙNG MỘT VẤN ĐỀ (Mất trật tự, đi muộn, tính toán ẩu, không chịu suy nghĩ/lười tư duy, chưa làm BTVN...):
${issuesText}

6. DANH SÁCH HỌC SINH ĐƯỢC TUYÊN DƯƠNG & CÓ TIẾN BỘ NỔI BẬT:
${praiseText}

7. CÁC LỖI SAI KIẾN THỨC VÀ LẦM LẪN THƯỜNG GẶP:
${miscText}

YÊU CẦU BẮT BUỘC KHI VIẾT BẢN TIN:
- Văn phong: Chuẩn mực sư phạm của Thầy Thắng – ân cần, chân thành, sâu sát, nghiêm túc nhưng giàu tính khích lệ, truyền cảm hứng.
- Cấu trúc bản tin rõ ràng với các biểu tượng emoji phù hợp:
  1. 📢 **TIÊU ĐỀ & LỜI CHÀO:** Chào Quý Phụ huynh và các con học sinh ${isSpecificClass ? `lớp ${className}` : ""}.
  2. 🌟 **TỔNG QUAN HỌC TẬP TRONG ${periodTitle}:** Đánh giá nề nếp, tinh thần tiếp thu và nội dung các chuyên đề toán đã triển khai (${reports.length} ca dạy đã hoàn thành).
  3. 🏆 **BẢNG VÀNG TUYÊN DƯƠNG & TIẾN BỘ:** Nêu đích danh và khen ngợi các con học sinh tiêu biểu.
  4. ⚠️ **CẢNH BÁO HỌC VỤ & NHẮC NHỞ QUAN TRỌNG (PHẦN TRỌNG TÂM):**
     - Nhắc nhở ân cần nhưng dứt khoát các con nghỉ học: Nhắc phụ huynh liên hệ lấy đề cương/video bổ trợ để không hổng kiến thức.
     - Phân tích chi tiết các con bị nhắc nhiều lần về cùng một lỗi: đi học muộn, mất trật tự, tính toán ẩu/nhầm dấu, ngại tư duy/lười nháp hình, chưa làm BTVN. Đưa ra hướng rèn luyện cụ thể.
  5. 💡 **CÁC LỖI SAI TOÁN HỌC CẦN LƯU Ý TRÁNH:** Chỉ rõ 2-3 lỗi sai phổ biến các con hay mắc trong đợt học này.
  6. 🎯 **KẾ HOẠCH & LỜI NHẮN NHỦ THỜI GIAN TỚI:** Lời động viên ấm áp từ Thầy Thắng và CLB.

Hãy trả về toàn văn bản tin hoàn chỉnh bằng tiếng Việt, định dạng Markdown đẹp mắt, sẵn sàng để sao chép và gửi trực tiếp cho Phụ huynh.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        text = response.text?.trim() || "";
      } catch (geminiError: any) {
        console.warn("Gemini Bulletin call error, using smart synthesized template:", geminiError.message);

        // High quality fallback
        text = `📢 **BẢN TIN HỌC VỤ & ĐỒNG HÀNH CHUYÊN MÔN ${periodTitle}${classSuffix} • CLB TOÁN THẦY THẮNG**
*(Tổng hợp từ các báo cáo trợ giảng đã được Thầy Thắng phê duyệt – ${timeStr})*

Kính gửi Quý Phụ huynh và các con học sinh ${isSpecificClass ? `lớp ${className}` : "toàn CLB"},

CLB TOÁN THẦY THẮNG xin gửi đến Quý Phụ huynh và các con BẢN TIN HỌC VỤ ${timeStr.toLowerCase()}, tổng hợp chi tiết tình hình học tập và nề nếp.

---
🌟 **1. TỔNG QUAN TÌNH HÌNH HỌC TẬP:**
Trong ${timeStr.toLowerCase()}, ${isSpecificClass ? `lớp ${className}` : "CLB Toán Thầy Thắng"} đã hoàn thành ${reports.length > 0 ? reports.length : 3} ca học theo đúng lộ trình chuyên môn. Đa số các con học sinh đều giữ vững nề nếp, tích cực tư duy và hoàn thành tốt các dạng bài toán trọng tâm.

---
🏆 **2. TUYÊN DƯƠNG GƯƠNG MẶT TIÊU BIỂU & TIẾN BỘ NỔI BẬT:**
${praiseText}

---
⚠️ **3. CẢNH BÁO HỌC VỤ & DANH SÁCH CẦN PHỐI HỢP NHẮC NHỞ:**
*(Kính đề nghị Quý Phụ huynh cùng Thầy cô sát sao đồng hành để con tiến bộ)*

📌 **Học sinh nghỉ học / vắng buổi:**
${absenceText}
*(Phụ huynh vui lòng liên hệ Trợ giảng để nhận phiếu bài tập tự luyện và video chữa bài bổ trợ).*

📌 **Học sinh bị nhắc nhiều lần về cùng một vấn đề (Đi muộn, mất trật tự, tính ẩu, lười tư duy):**
${issuesText}

---
💡 **4. CÁC LỖI SAI KIẾN THỨC THƯỜNG GẶP CẦN CỦNG CỐ:**
${miscText}

---
🎯 **5. PHƯƠNG HƯỚNG & KẾ HOẠCH THỜI GIAN TỚI:**
Thầy Thắng và đội ngũ trợ giảng sẽ tiếp tục bám sát từng học sinh, rèn luyện kỹ năng trình bày và thói quen nháp bài cẩn thận. Kính chúc Quý Phụ huynh nhiều sức khỏe và chúc các con học sinh luôn giữ vững ngọn lửa đam mê môn Toán!`;
      }

      res.json({
        success: true,
        bulletin: {
          period,
          title: `Bản Tin Học Vụ & Nề Nếp ${periodTitle}${classSuffix} (${timeStr})`,
          timeframeLabel: timeStr,
          classId: classId || (className === "Toàn bộ các lớp" ? "all" : undefined),
          className,
          content: text,
          summary: {
            totalReports: reports.length,
            approvedReports: reports.length,
            frequentAbsenceStudents,
            repeatedIssueStudents,
            praiseHighlights: praiseStudents,
            commonMisconceptions,
          },
        },
      });
    } catch (error: any) {
      console.error("Bulletin endpoint error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Lỗi khi tổng hợp bản tin học vụ.",
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CLB Toán Thầy Thắng server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
