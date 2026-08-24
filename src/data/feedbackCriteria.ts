export interface FeedbackCriterion {
  id: string;
  category: string;
  categoryTitle: string;
  categoryIconName: string;
  label: string;
  type: "praise" | "warning"; // "praise" -> ✨ Khen, "warning" -> ⚠️ Lưu ý
  exclusiveWith?: string; // ID of opposite criterion to auto-uncheck if selected
}

// 7 CATEGORIES MATCHING USER'S EXACT SCREENSHOTS
export const FEEDBACK_CRITERIA_CATEGORIES = [
  {
    id: "attendance",
    title: "CHUYÊN CẦN & NỀ NẾP ĐẦU GIỜ",
    icon: "Clock",
  },
  {
    id: "equipment",
    title: "CHUẨN BỊ ĐỒ DÙNG & DỤNG CỤ HỌC TẬP",
    icon: "PenTool",
  },
  {
    id: "homework",
    title: "BÀI TẬP VỀ NHÀ (BTVN)",
    icon: "BookOpen",
  },
  {
    id: "attitude",
    title: "TINH THẦN HỌC TẬP & THÁI ĐỘ LÀM BÀI",
    icon: "Flame",
  },
  {
    id: "discipline",
    title: "GIỮ GÌN TRẬT TỰ & TẬP TRUNG NGHE GIẢNG",
    icon: "ShieldCheck",
  },
  {
    id: "interaction",
    title: "TƯƠNG TÁC & KHÔNG KHÍ LỚP HỌC",
    icon: "Zap",
  },
  {
    id: "presentation",
    title: "KỸ NĂNG TÍNH TOÁN & TRÌNH BÀY",
    icon: "ThumbsUp",
  },
];

// PRECISE CRITERIA MATCHING USER'S EXACT SCREENSHOTS
export const FEEDBACK_CRITERIA: FeedbackCriterion[] = [
  // 1. Chuyên cần & nề nếp đầu giờ
  {
    id: "att_on_time",
    category: "attendance",
    categoryTitle: "CHUYÊN CẦN & NỀ NẾP ĐẦU GIỜ",
    categoryIconName: "Clock",
    label: "Cả lớp đi học đúng giờ",
    type: "praise",
    exclusiveWith: "att_late",
  },
  {
    id: "att_late",
    category: "attendance",
    categoryTitle: "CHUYÊN CẦN & NỀ NẾP ĐẦU GIỜ",
    categoryIconName: "Clock",
    label: "Một số bạn còn đi học muộn",
    type: "warning",
    exclusiveWith: "att_on_time",
  },

  // 2. Chuẩn bị đồ dùng & dụng cụ học tập
  {
    id: "eq_full",
    category: "equipment",
    categoryTitle: "CHUẨN BỊ ĐỒ DÙNG & DỤNG CỤ HỌC TẬP",
    categoryIconName: "PenTool",
    label: "Mang đầy đủ dụng cụ học tập",
    type: "praise",
    exclusiveWith: "eq_missing",
  },
  {
    id: "eq_missing",
    category: "equipment",
    categoryTitle: "CHUẨN BỊ ĐỒ DÙNG & DỤNG CỤ HỌC TẬP",
    categoryIconName: "PenTool",
    label: "Còn thiếu dụng cụ học tập",
    type: "warning",
    exclusiveWith: "eq_full",
  },

  // 3. Bài tập về nhà (BTVN)
  {
    id: "hw_full",
    category: "homework",
    categoryTitle: "BÀI TẬP VỀ NHÀ (BTVN)",
    categoryIconName: "BookOpen",
    label: "Các bạn đã hoàn thành bài tập về nhà đầy đủ",
    type: "praise",
    exclusiveWith: "hw_incomplete",
  },
  {
    id: "hw_incomplete",
    category: "homework",
    categoryTitle: "BÀI TẬP VỀ NHÀ (BTVN)",
    categoryIconName: "BookOpen",
    label: "Một số bạn còn chưa hoàn thành bài tập về nhà",
    type: "warning",
    exclusiveWith: "hw_full",
  },

  // 4. Tinh thần học tập & thái độ làm bài
  {
    id: "att_hardworking",
    category: "attitude",
    categoryTitle: "TINH THẦN HỌC TẬP & THÁI ĐỘ LÀM BÀI",
    categoryIconName: "Flame",
    label: "Các bạn đều chăm chỉ luyện tập bài tập",
    type: "praise",
  },
  {
    id: "att_distracted",
    category: "attitude",
    categoryTitle: "TINH THẦN HỌC TẬP & THÁI ĐỘ LÀM BÀI",
    categoryIconName: "Flame",
    label: "Tuy vậy còn một số em lơ đãng, mất tập trung, ngồi chờ lời giải và chép bài",
    type: "warning",
  },

  // 5. Giữ gìn trật tự & tập trung nghe giảng
  {
    id: "disc_quiet",
    category: "discipline",
    categoryTitle: "GIỮ GÌN TRẬT TỰ & TẬP TRUNG NGHE GIẢNG",
    categoryIconName: "ShieldCheck",
    label: "Các em giữ gìn trật tự trong buổi học",
    type: "praise",
  },
  {
    id: "disc_noisy",
    category: "discipline",
    categoryTitle: "GIỮ GÌN TRẬT TỰ & TẬP TRUNG NGHE GIẢNG",
    categoryIconName: "ShieldCheck",
    label: "Một số em còn mất trật tự, làm việc riêng, chưa chú ý nghe giảng",
    type: "warning",
  },

  // 6. Tương tác & không khí lớp học
  {
    id: "inter_active",
    category: "interaction",
    categoryTitle: "TƯƠNG TÁC & KHÔNG KHÍ LỚP HỌC",
    categoryIconName: "Zap",
    label: "Các em tương tác bài học, đặt nhiều câu hỏi hay cho thầy",
    type: "praise",
    exclusiveWith: "inter_quiet",
  },
  {
    id: "inter_quiet",
    category: "interaction",
    categoryTitle: "TƯƠNG TÁC & KHÔNG KHÍ LỚP HỌC",
    categoryIconName: "Zap",
    label: "Lớp còn trầm, các con chưa sôi nổi lắm",
    type: "warning",
    exclusiveWith: "inter_active",
  },

  // 7. Kỹ năng tính toán & trình bày
  {
    id: "pres_master",
    category: "presentation",
    categoryTitle: "KỸ NĂNG TÍNH TOÁN & TRÌNH BÀY",
    categoryIconName: "ThumbsUp",
    label: "Nhiều bạn nắm chắc kiến thức và có tiến bộ vượt bậc",
    type: "praise",
  },
  {
    id: "pres_calc",
    category: "presentation",
    categoryTitle: "KỸ NĂNG TÍNH TOÁN & TRÌNH BÀY",
    categoryIconName: "ThumbsUp",
    label: "Một số em cần chú ý phần tính toán",
    type: "warning",
  },
  {
    id: "pres_neat",
    category: "presentation",
    categoryTitle: "KỸ NĂNG TÍNH TOÁN & TRÌNH BÀY",
    categoryIconName: "ThumbsUp",
    label: "Một số bạn cần trình bày cẩn thận lời giải và cải thiện chữ",
    type: "warning",
  },
];

// 8 QUICK EVALUATION TAGS FOR INDIVIDUAL STUDENT CARD (MATCHING IMAGE 1)
export const STUDENT_QUICK_TAGS = [
  { id: "att_present", label: "Đi học đầy đủ", defaultChecked: true },
  { id: "hw_done", label: "Hoàn thành BTVN", defaultChecked: false },
  { id: "att_focus", label: "Tập trung nghe giảng", defaultChecked: false },
  { id: "self_practice", label: "Tự giác luyện tập", defaultChecked: false },
  { id: "active_speech", label: "Hăng hái phát biểu", defaultChecked: false },
  { id: "understand_progress", label: "Hiểu bài / Tiến bộ", defaultChecked: false },
  { id: "side_talk", label: "Nói chuyện / Việc riêng", defaultChecked: false },
  { id: "need_tutoring", label: "Cần phụ đạo thêm", defaultChecked: false },
];

// COMMON MATH MISCONCEPTIONS & MISTAKES (FOR QUICK PICKING)
export const COMMON_MATH_MISCONCEPTIONS = [
  "Nhầm dấu khi chuyển vế / đổi dấu",
  "Quên tìm điều kiện xác định (ĐKXĐ)",
  "Sai hằng đẳng thức đáng nhớ",
  "Quy đồng quên khử mẫu / nhân sai liên hợp",
  "Nhầm dấu bất đẳng thức khi nhân/chia số âm",
  "Chưa rút gọn kết quả về phân số tối giản",
  "Quên đặt điều kiện / đơn vị cho ẩn số",
  "Vẽ hình chưa chuẩn / ngộ nhận giả thiết hình",
  "Lúng túng bước chứng minh & lập luận hình học",
  "Tính nhẩm ẩu / sai sót cộng trừ nhân chia cơ bản",
  "Nhầm lẫn giữa phương trình và bất phương trình",
  "Quên thử lại nghiệm với điều kiện bài toán",
];

// QUICK REMARK SUGGESTIONS FOR INDIVIDUAL STUDENT
export const QUICK_STUDENT_REMARK_SUGGESTIONS = [
  "Tính toán cẩn thận; hiểu bài nhanh; cần làm thêm bài tập tương tự",
  "Tiếp thu rất nhanh, giải quyết tốt các bài toán tư duy nâng cao",
  "Chăm chỉ làm bài, chủ động hỏi trợ giảng khi gặp câu khó",
  "Nắm vững phương pháp nhưng còn lúng túng ở bước tính toán rút gọn",
  "Cần tập trung hơn trong giờ luyện tập, hạn chế nói chuyện riêng",
  "Trình bày bài sạch đẹp, chữ viết rõ ràng, lập luận chặt chẽ",
  "Tiến bộ rõ rệt so với các buổi học trước, hăng hái phát biểu",
  "Cần xem lại bài giảng và hoàn thành đủ phiếu BTVN trước buổi tới",
];

export interface PersonaStyleConfig {
  id: "pedagogical" | "positive" | "friendly" | "warm_humor";
  title: string;
  badge: string;
  description: string;
  iconName: string;
}

export const PERSONA_STYLES: PersonaStyleConfig[] = [
  {
    id: "pedagogical",
    title: "Chuẩn sư phạm – Khách quan",
    badge: "Mô phạm, chỉn chu & công tâm",
    description:
      "Ngôn từ chuẩn mực, phân tích tiến độ, nề nếp và kết quả học tập rõ ràng, khoa học và súc tích.",
    iconName: "Landmark",
  },
  {
    id: "positive",
    title: "Tích cực – Khích lệ",
    badge: "Nhiệt huyết, truyền động lực & khen ngợi",
    description:
      "Tràn đầy năng lượng, tôn vinh từng nỗ lực dù nhỏ nhất, biến nhắc nhở thành lời động viên ấm lòng.",
    iconName: "SunMedium",
  },
  {
    id: "friendly",
    title: "Thân thiện – Gần gũi",
    badge: "Chân thành, tâm tình như trò chuyện",
    description:
      "Nhẹ nhàng, tình cảm, như cuộc trò chuyện chân tình giữa thầy cô với phụ huynh và học sinh.",
    iconName: "MessageCircleHeart",
  },
  {
    id: "warm_humor",
    title: "“Thầy cô chủ nhiệm” – Ấm áp & Hài hước",
    badge: "Dí dỏm, yêu thương & gắn kết",
    description:
      "Vừa yêu thương như người nhà, vừa dí dỏm, mang lại nụ cười và năng lượng tích cực.",
    iconName: "Coffee",
  },
];

export interface SampleFeedbackTemplate {
  id: string;
  title: string;
  persona: string;
  content: string;
}

export const SAMPLE_FEEDBACK_TEMPLATES: SampleFeedbackTemplate[] = [
  {
    id: "tpl_1",
    title: "Mẫu 1: Ca học xuất sắc & Tiếp thu nhanh (Chuẩn sư phạm)",
    persona: "Chuẩn sư phạm – Khách quan",
    content: `Kính gửi Quý Phụ huynh Lớp Toán!

CLB Toán Thầy Thắng xin gửi tới Quý Phụ huynh báo cáo tổng kết buổi học hôm nay:
📊 Nề nếp & Chuyên cần: 100% các con đi học đúng giờ, mang đầy đủ sách vở, dụng cụ học tập và máy tính cầm tay.
💡 Tinh thần học tập: Không khí lớp học rất nghiêm túc, tập trung và sôi nổi. Các con hăng hái xung phong lên bảng giải các bài toán chuyên đề mới.
📝 Mức độ tiếp thu: Đa số các con nắm vững phương pháp và định hướng giải nhanh, trình bày lời giải mạch lạc, khoa học.
📌 Dặn dò BTVN: Quý Phụ huynh nhắc các con hoàn thành đầy đủ phiếu bài tập theo lịch hẹn để củng cố kiến thức tốt nhất.

Cảm ơn Quý Phụ huynh luôn đồng hành cùng CLB và các con!`,
  },
  {
    id: "tpl_2",
    title: "Mẫu 2: Khích lệ & Truyền cảm hứng năng lượng cao",
    persona: "Tích cực – Khích lệ",
    content: `Chào Quý Phụ huynh và các chiến binh Toán học! 🌟

Buổi học hôm nay của lớp đã diễn ra vô cùng bùng nổ và tràn đầy năng lượng!
✨ Các con đã vượt qua những bài toán nâng cao khó nhằn với tinh thần không bỏ cuộc. Rất nhiều ý tưởng sáng tạo và cách giải độc đáo đã được các bạn đưa ra trong giờ.
💪 Thầy cô đặc biệt khen ngợi tinh thần tự giác và sự tiến bộ rõ rệt của cả lớp so với tuần trước.
🎯 Các con hãy tiếp tục giữ vững ngọn lửa đam mê này, hoàn thiện bài tập về nhà thật chu đáo để chuẩn bị bứt phá trong buổi học tiếp theo nhé!

Chúc các con và gia đình một buổi tối tràn ngập niềm vui! ❤️`,
  },
  {
    id: "tpl_3",
    title: "Mẫu 3: Thân thiện, tâm tình & Nhắc nhở ân cần",
    persona: "Thân thiện – Gần gũi",
    content: `Kính chào Quý Phụ huynh thân mến! 🌸

Thầy và Trợ giảng xin gửi đôi dòng chia sẻ về buổi học hôm nay của các con:
Nhìn chung, cả lớp hôm nay học rất ngoan và chăm chú. Dạng toán hôm nay có phần mới lạ và đòi hỏi tư duy biến đổi nhiều bước, nhưng các con đều rất nỗ lực lắng nghe và ghi chép cẩn thận.
Có một vài bạn ở bước tính toán cuối còn hơi vội một chút, thầy cô đã hướng dẫn kỹ lại và các con đều đã hiểu bài trọn vẹn.
Nhờ Quý Phụ huynh tối nay động viên con xem lại vở ghi 10 phút và làm phiếu bài tập về nhà nhé. 

Thầy cô cảm ơn bố mẹ rất nhiều ạ! Chúc các con ngủ ngon! 🌿`,
  },
  {
    id: "tpl_4",
    title: "Mẫu 4: Dí dỏm, ấm áp phong cách Thầy Chủ Nhiệm",
    persona: "“Thầy cô chủ nhiệm” – Ấm áp & Hài hước",
    content: `Alo alo Quý Phụ huynh và cả nhà thân thương! ☕🎉

Hôm nay đội hình lớp Toán nhà mình đi học siêu đầy đủ và đúng giờ, phong độ đỉnh cao luôn ạ!
Trong giờ học các "nhà toán học nhí" làm việc hết công suất, não bộ hoạt động 200% để giải quyết các câu hỏi hóc búa của thầy Thắng. Lúc đầu có hơi "nhăn trán" suy nghĩ một tẹo nhưng khi tìm ra đáp án thì cả lớp đều reo vui rạng rỡ.
Thầy dặn nhẹ các "thần đồng": Nhớ làm xong bài tập về nhà rồi hẵng xem phim/thư giãn nha! 

Chúc cả nhà một buổi tối ấm áp, tràn ngập tiếng cười! 😊📐`,
  },
];
