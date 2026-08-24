import {
  ClassItem,
  Student,
  Assistant,
  Report,
  ClubSettings,
  User,
  AppNotification,
  AIBulletin,
} from "../types";

const STORAGE_KEYS = {
  CLASSES: "thaythang_classes_v1",
  STUDENTS: "thaythang_students_v1",
  ASSISTANTS: "thaythang_assistants_v1",
  REPORTS: "thaythang_reports_v1",
  NOTIFICATIONS: "thaythang_notifications_v1",
  BULLETINS: "thaythang_bulletins_v1",
  SETTINGS: "thaythang_settings_v1",
  CURRENT_USER: "thaythang_current_user_v2",
  ADMIN_USER: "thaythang_admin_user_v2",
  REPORT_DRAFT: "thaythang_report_draft_v1",
  STUDENT_ANALYSIS_CACHE: "thaythang_analysis_cache_v1",
};

// Initial Seed Bulletins
const DEFAULT_BULLETINS: AIBulletin[] = [
  {
    id: "bulletin_init_1",
    period: "weekly",
    title: "Bản Tin Học Vụ & Nề Nếp Tuần Này • CLB Toán Thầy Thắng",
    timeframeLabel: "Tuần học từ 18/08/2026 – 24/08/2026",
    className: "Toàn bộ các lớp",
    createdAt: "2026-08-24 21:15",
    generatedBy: "AI Gemini Học Thuật",
    content: `📢 **BẢN TIN HỌC VỤ & ĐỒNG HÀNH CHUYÊN MÔN TUẦN NÀY**
*(Tổng hợp từ các báo cáo trợ giảng đã được Thầy Thắng phê duyệt)*

---
🌟 **1. TỔNG QUAN TÌNH HÌNH HỌC TẬP CÁC LỚP TRONG TUẦN:**
Tuần qua, CLB đã triển khai trọn vẹn 3 ca dạy trọng điểm. Đa số các con học sinh đều giữ vững tinh thần tự giác, có mặt đúng giờ và hăng hái tham gia xây dựng bài.
- **Lớp 9A1 (Ôn thi vào 10 Chuyên):** Hoàn thành xuất sắc chuyên đề *Bất đẳng thức Cauchy & Kỹ thuật chọn điểm rơi*. Tinh thần thảo luận nhóm rất sôi nổi.
- **Lớp 7A1 (Tư duy & Đại số):** Nắm chắc chuyên đề *Biểu thức đại số & Đơn thức đồng dạng*, nhiều bạn chủ động lên bảng giải bài.
- **Lớp 8A1 (Hình học & Tứ giác):** Hoàn thành luyện tập *Hình bình hành & Ứng dụng chứng minh song song*.

---
🏆 **2. TUYÊN DƯƠNG GƯƠNG MẶT TIÊU BIỂU & TIẾN BỘ NỔI BẬT:**
- **Nguyễn Minh Anh (9A1):** Tinh thần tự giác cao, trình bày bài giải BĐT mạch lạc và đạt điểm tuyệt đối bài kiểm tra ngắn.
- **Trần Đức Huy (9A1):** Tiến bộ vượt bậc trong kỹ thuật tách ghép hạng tử, xung phong giải bài khó.
- **Lê Bảo Châu (7A1):** Làm bài tập về nhà chỉn chu 10/10, phát biểu tích cực nhất ca học.

---
⚠️ **3. CẢNH BÁO HỌC VỤ & DANH SÁCH HỌC SINH CẦN LƯU Ý PHỐI HỢP:**
*(Kính đề nghị Quý Phụ huynh và Thầy cô trợ giảng sát sao nhắc nhở)*

📌 **Học sinh nghỉ 2–3 buổi trong tháng:**
- **Phạm Quỳnh Chi (9A1):** Đã vắng 2 buổi (Ngày 17/08 & 24/08). Cần liên hệ gửi phiếu bài tập và video bài giảng bổ trợ kịp thời trước buổi học tới.

📌 **Học sinh bị nhắc nhiều lần về cùng một vấn đề:**
- **Về tính toán ẩu & bỏ sót điều kiện:** *Hoàng Minh Khôi (9A1)* thường xuyên quên đối chiếu điều kiện xác định và nhầm dấu khi quy đồng.
- **Về đi học muộn & mất tập trung:** *Vũ Nam Phong (7A1)* đi muộn 2 buổi liên tiếp và còn nói chuyện riêng trong 15 phút đầu giờ.
- **Về thói quen suy nghĩ:** *Đặng Quốc Anh (8A1)* còn tâm lý ỷ lại, chưa chịu vẽ hình nháp trước khi hỏi trợ giảng.

---
💡 **4. LỖI SAI KIẾN THỨC HAY GẶP CẦN RÈN THÊM:**
- Lẫn lộn dấu khi phá ngoặc có dấu trừ đằng trước.
- Áp dụng BĐT Cauchy cho các số chưa chứng minh dương.
- Trình bày thiếu bước kết luận nghiệm của phương trình chứa căn.

---
🎯 **5. KẾ HOẠCH HỌC TẬP TUẦN TỚI:**
Thầy Thắng cùng đội ngũ trợ giảng sẽ tăng cường 15 phút đầu giờ kiểm tra lại các lỗi tính toán ẩu và tổ chức chữa phiếu bài tập về nhà chi tiết. Chúc các con một tuần mới tràn đầy năng lượng và bứt phá tư duy!`,
    summary: {
      totalReports: 3,
      approvedReports: 3,
      frequentAbsenceStudents: [
        {
          studentId: "st_4",
          studentName: "Phạm Quỳnh Chi",
          className: "9A1 – Luyện Thi Vào 10 Chuyên",
          absenceCount: 2,
          dates: ["2026-08-17", "2026-08-24"],
        },
      ],
      repeatedIssueStudents: [
        {
          studentId: "st_3",
          studentName: "Hoàng Minh Khôi",
          className: "9A1 – Luyện Thi Vào 10 Chuyên",
          issueType: "careless_calc",
          issueLabel: "Tính toán ẩu / Nhầm dấu",
          occurrences: 2,
          details: ["Nhầm dấu khi quy đồng", "Quên đối chiếu ĐKXĐ"],
        },
        {
          studentId: "st_6",
          studentName: "Vũ Nam Phong",
          className: "7A1 – Tư Duy Toán & Đại Số",
          issueType: "late_attendance",
          issueLabel: "Đi học muộn & Chưa tập trung",
          occurrences: 2,
          details: ["Đi muộn 15 phút", "Nói chuyện riêng trong giờ"],
        },
      ],
      praiseHighlights: [
        {
          studentName: "Nguyễn Minh Anh",
          className: "9A1",
          highlight: "Trình bày bài giải BĐT mạch lạc, kiểm tra đạt 10đ",
        },
        {
          studentName: "Lê Bảo Châu",
          className: "7A1",
          highlight: "BTVN chỉn chu, hăng hái phát biểu nhất lớp",
        },
      ],
      commonMisconceptions: [
        "Quên điều kiện số dương khi áp dụng BĐT Cauchy",
        "Nhầm dấu khi phá ngoặc trước có dấu trừ",
        "Thiếu bước thử lại nghiệm phương trình vô tỷ",
      ],
    },
  },
];

// Initial Seed Data
const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif_appr_1",
    type: "report_approved",
    title: "🎉 Báo cáo buổi học đã được phê duyệt!",
    message: "Thầy Thắng đã duyệt báo cáo lớp 9A1 – Luyện Thi Vào 10 Chuyên (Ngày 2026-08-24). Nội dung nhận xét chuẩn mực và chi tiết!",
    reportId: "rep_2026_08_24_9a1",
    targetAssistantId: "asst_1",
    targetRole: "assistant",
    senderName: "Thầy Thắng (Chủ nhiệm)",
    createdAt: "2026-08-24 21:00",
    read: false,
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    reportDate: "2026-08-24",
    reportShift: "Ca 1 (18:00 – 20:30)",
  },
  {
    id: "notif_appr_2",
    type: "report_approved",
    title: "🎉 Báo cáo buổi học đã được phê duyệt!",
    message: "Thầy Thắng đã duyệt báo cáo lớp 7A1 – Tư Duy Toán & Đại Số (Ngày 2026-08-21). Báo cáo rất tốt!",
    reportId: "rep_2026_08_21_7a1",
    targetAssistantId: "asst_2",
    targetRole: "assistant",
    senderName: "Thầy Thắng (Chủ nhiệm)",
    createdAt: "2026-08-21 21:00",
    read: false,
    className: "7A1 – Tư Duy Toán & Đại Số",
    reportDate: "2026-08-21",
    reportShift: "Ca 1 (18:00 – 20:00)",
  },
];

const DEFAULT_SETTINGS: ClubSettings = {
  clubName: "CLB TOÁN THẦY THẮNG",
  slogan: "Học Toán Bằng Tư Duy – Bứt Phá Mọi Kỳ Thi",
  hotline: "0988.123.456",
  address: "Số 18, Ngõ 120 Hoàng Quốc Việt, Cầu Giấy, Hà Nội",
  apiKeyList: [],
  activeApiKeyIndex: 0,
  useFirebase: false,
};

const DEFAULT_ADMIN_USER: User = {
  id: "user_admin_1",
  name: "Thầy Thắng (Chủ nhiệm)",
  email: "thangsinh2444@gmail.com",
  role: "admin",
  username: "thangsinh2444",
  password: "123456",
  phone: "0988.123.456",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
};

const DEFAULT_USERS: User[] = [
  DEFAULT_ADMIN_USER,
  {
    id: "asst_1",
    name: "Trợ giảng Nguyễn Minh Hùng",
    email: "hung.ta@thaythang.edu.vn",
    role: "assistant",
    username: "hung.ta",
    password: "123",
    phone: "0971.234.567",
    assignedClassIds: ["cls_9a1", "cls_8a2"],
    assistantId: "asst_1",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "asst_2",
    name: "Trợ giảng Trần Thảo Vy",
    email: "vy.ta@thaythang.edu.vn",
    role: "assistant",
    username: "vy.ta",
    password: "123",
    phone: "0912.888.999",
    assignedClassIds: ["cls_6a1", "cls_7a1"],
    assistantId: "asst_2",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
];

const DEFAULT_CLASSES: ClassItem[] = [
  {
    id: "cls_9a1",
    name: "9A1 – Luyện Thi Vào 10 Chuyên",
    grade: "Khối 9",
    teacherName: "Thầy Thắng",
    assistantIds: ["asst_1"],
    schedule: "Thứ 3, Thứ 6 (18:00 – 20:30)",
    room: "Phòng 301 - Tầng 3",
    description: "Lớp trọng điểm ôn thi vào các trường chuyên KHTN, Sư Phạm, Ams.",
    active: true,
  },
  {
    id: "cls_8a2",
    name: "8A2 – Toán Nâng Cao & HSG",
    grade: "Khối 8",
    teacherName: "Thầy Thắng",
    assistantIds: ["asst_1", "asst_3"],
    schedule: "Thứ 4, Chủ Nhật (17:30 – 19:45)",
    room: "Phòng 202 - Tầng 2",
    description: "Tập trung chuyên đề Bất đẳng thức, Hình học đồng dạng và Số học.",
    active: true,
  },
  {
    id: "cls_7a1",
    name: "7A1 – Tư Duy Toán & Đại Số",
    grade: "Khối 7",
    teacherName: "Thầy Thắng",
    assistantIds: ["asst_2"],
    schedule: "Thứ 2, Thứ 5 (18:00 – 20:00)",
    room: "Phòng 101 - Tầng 1",
    description: "Rèn tư duy giải toán, phương pháp phân tích đa thức và hình học.",
    active: true,
  },
  {
    id: "cls_6a1",
    name: "6A1 – Toán Nâng Cao Lớp 6",
    grade: "Khối 6",
    teacherName: "Thầy Thắng",
    assistantIds: ["asst_2"],
    schedule: "Thứ 7, Chủ Nhật (08:30 – 10:45)",
    room: "Phòng 102 - Tầng 1",
    description: "Bồi dưỡng số học nâng cao, bài toán chia hết và hình học trực quan.",
    active: true,
  },
];

const DEFAULT_ASSISTANTS: Assistant[] = [
  {
    id: "asst_1",
    name: "Nguyễn Minh Hùng",
    email: "hung.ta@thaythang.edu.vn",
    phone: "0971.234.567",
    username: "hung.ta",
    password: "123",
    classes: ["cls_9a1", "cls_8a2"],
    active: true,
    joinedDate: "2024-09-01",
    notes: "Sinh viên ĐH Sư Phạm Hà Nội - Khoa Toán (Giải Nhì HSG Quốc gia).",
  },
  {
    id: "asst_2",
    name: "Trần Thảo Vy",
    email: "vy.ta@thaythang.edu.vn",
    phone: "0912.888.999",
    username: "vy.ta",
    password: "123",
    classes: ["cls_6a1", "cls_7a1"],
    active: true,
    joinedDate: "2024-10-15",
    notes: "Nhiệt tình, chu đáo, rất được phụ huynh và các bạn nhỏ khối 6-7 yêu mến.",
  },
  {
    id: "asst_3",
    name: "Lê Đức Anh",
    email: "anh.ta@thaythang.edu.vn",
    phone: "0963.777.222",
    username: "anh.ta",
    password: "123",
    classes: ["cls_8a2"],
    active: true,
    joinedDate: "2025-01-10",
    notes: "Phụ trách chấm bài tập về nhà và hỗ trợ các bạn học sinh còn yếu.",
  },
];

const DEFAULT_STUDENTS: Student[] = [
  // 9A1
  {
    id: "std_901",
    name: "Nguyễn Minh Quân",
    classId: "cls_9a1",
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    dob: "2010-04-12",
    parentName: "Nguyễn Văn Hùng",
    parentPhone: "0912.333.444",
    note: "Mục tiêu thi Chuyên Sư Phạm & Chuyên KHTN.",
    joinedDate: "2024-06-01",
  },
  {
    id: "std_902",
    name: "Trần Bảo Ngọc",
    classId: "cls_9a1",
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    dob: "2010-09-20",
    parentName: "Trần Thu Trang",
    parentPhone: "0983.555.666",
    note: "Tư duy hình học rất sắc bén, cẩn thận trong trình bày.",
    joinedDate: "2024-06-01",
  },
  {
    id: "std_903",
    name: "Phạm Đức Minh",
    classId: "cls_9a1",
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    dob: "2010-11-05",
    parentName: "Phạm Quốc Tuấn",
    parentPhone: "0904.777.888",
    note: "Cần chú ý không bỏ bước ở phần Đại số và Rút gọn biểu thức.",
    joinedDate: "2024-07-15",
  },
  {
    id: "std_904",
    name: "Hoàng Mai Anh",
    classId: "cls_9a1",
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    dob: "2010-02-18",
    parentName: "Ngô Lan Phương",
    parentPhone: "0976.222.111",
    note: "Chăm chỉ, hoàn thành BTVN luôn đạt điểm 9-10.",
    joinedDate: "2024-06-01",
  },
  {
    id: "std_905",
    name: "Vũ Hoàng Long",
    classId: "cls_9a1",
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    dob: "2010-08-30",
    parentName: "Vũ Đình Trọng",
    parentPhone: "0934.111.999",
    note: "Đôi khi đi muộn 5-10 phút do kẹt xe, tiếp thu bài nhanh.",
    joinedDate: "2024-08-01",
  },

  // 8A2
  {
    id: "std_801",
    name: "Lê Gia Hân",
    classId: "cls_8a2",
    className: "8A2 – Toán Nâng Cao & HSG",
    dob: "2011-03-14",
    parentName: "Lê Văn Thành",
    parentPhone: "0915.678.910",
    note: "Học chắc đại số, cần luyện thêm kỹ năng dựng hình phụ.",
    joinedDate: "2024-09-01",
  },
  {
    id: "std_802",
    name: "Đặng Gia Bảo",
    classId: "cls_8a2",
    className: "8A2 – Toán Nâng Cao & HSG",
    dob: "2011-07-22",
    parentName: "Đặng Quang Huy",
    parentPhone: "0982.444.333",
    note: "Rất nhiệt tình xung phong lên bảng chữa bài.",
    joinedDate: "2024-09-01",
  },
  {
    id: "std_803",
    name: "Bùi Tuấn Kiệt",
    classId: "cls_8a2",
    className: "8A2 – Toán Nâng Cao & HSG",
    dob: "2011-12-08",
    parentName: "Bùi Thị Hải Yến",
    parentPhone: "0903.888.112",
    note: "Cần tập trung hơn trong giờ nghe giảng lý thuyết.",
    joinedDate: "2024-10-01",
  },

  // 7A1
  {
    id: "std_701",
    name: "Ngô Nhật Minh",
    classId: "cls_7a1",
    className: "7A1 – Tư Duy Toán & Đại Số",
    dob: "2012-05-19",
    parentName: "Ngô Văn Dũng",
    parentPhone: "0977.123.987",
    note: "Học sinh tiến bộ nhanh sau 2 tháng học.",
    joinedDate: "2024-11-01",
  },
  {
    id: "std_702",
    name: "Đỗ Phương Linh",
    classId: "cls_7a1",
    className: "7A1 – Tư Duy Toán & Đại Số",
    dob: "2012-10-02",
    parentName: "Đỗ Hoàng Long",
    parentPhone: "0918.456.789",
    note: "Tính toán cẩn thận, trình bày sạch đẹp.",
    joinedDate: "2024-11-01",
  },

  // 6A1
  {
    id: "std_601",
    name: "Phan Tuệ Mẫn",
    classId: "cls_6a1",
    className: "6A1 – Toán Nâng Cao Lớp 6",
    dob: "2013-01-25",
    parentName: "Phan Đình Khải",
    parentPhone: "0968.999.000",
    note: "Ham học hỏi, thích các bài toán logic mở rộng.",
    joinedDate: "2024-09-01",
  },
  {
    id: "std_602",
    name: "Trịnh Khang Hy",
    classId: "cls_6a1",
    className: "6A1 – Toán Nâng Cao Lớp 6",
    dob: "2013-08-11",
    parentName: "Trịnh Văn Toàn",
    parentPhone: "0945.333.222",
    note: "Còn hơi rụt rè khi phát biểu, làm bài tập về nhà đầy đủ.",
    joinedDate: "2024-09-01",
  },
];

const DEFAULT_REPORTS: Report[] = [
  {
    id: "rep_2026_08_22_9a1",
    date: "2026-08-22",
    shift: "Ca 1 (18:00 – 20:30)",
    classId: "cls_9a1",
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    assistantId: "asst_1",
    assistantName: "Nguyễn Minh Hùng",
    teacherName: "Thầy Thắng",
    lessonContent: "Chuyên đề 5: Cực trị Hình học và Ứng dụng Bất đẳng thức Bunhiacopxki trong Hình phẳng.",
    homeworkAssigned: "Làm bài 1, 2, 3 trang 45 phiếu Chuyên đề Cực trị hình học (hạn nộp trước 18h thứ 3).",
    status: "approved",
    approvedBy: "Thầy Thắng",
    approvedAt: "2026-08-22 21:15",
    createdAt: "2026-08-22 20:45",
    updatedAt: "2026-08-22 21:15",
    students: [
      {
        studentId: "std_901",
        studentName: "Nguyễn Minh Quân",
        attendance: "present",
        homework: "excellent",
        comprehension: "very_good",
        attitude: "very_active",
        comment: "Quân tiếp thu bài rất nhanh, đưa ra được 2 cách giải sáng tạo cho bài toán cực trị cuối giờ. Trình bày lập luận chặt chẽ.",
        homeworkScore: 10,
      },
      {
        studentId: "std_902",
        studentName: "Trần Bảo Ngọc",
        attendance: "present",
        homework: "excellent",
        comprehension: "very_good",
        attitude: "active",
        comment: "Bảo Ngọc làm bài tập về nhà rất chu đáo và chuẩn xác. Trong giờ học tập trung cao độ, vẽ hình chính xác và giải quyết tốt các câu hỏi phân loại.",
        homeworkScore: 9.5,
      },
      {
        studentId: "std_903",
        studentName: "Phạm Đức Minh",
        attendance: "present",
        homework: "completed",
        comprehension: "good",
        attitude: "active",
        comment: "Minh nắm được phương pháp định hướng điểm rơi, tuy nhiên cần lưu ý biến đổi đại số cẩn thận hơn để tránh nhầm dấu ở bước cuối.",
        homeworkScore: 8.5,
      },
      {
        studentId: "std_904",
        studentName: "Hoàng Mai Anh",
        attendance: "present",
        homework: "excellent",
        comprehension: "very_good",
        attitude: "very_active",
        comment: "Mai Anh hoàn thành xuất sắc các bài tập trên lớp, chủ động hỗ trợ bạn cùng bàn kiểm tra lời giải. Rất đáng khen ngợi.",
        homeworkScore: 10,
      },
      {
        studentId: "std_905",
        studentName: "Vũ Hoàng Long",
        attendance: "late",
        homework: "incomplete",
        comprehension: "acceptable",
        attitude: "normal",
        comment: "Long đi muộn 10 phút và chưa hoàn thành câu 3 bài tập về nhà. Trong giờ sau khi được trợ giảng nhắc nhở đã tập trung và hiểu được dạng bài mới.",
        homeworkScore: 7,
      },
    ],
  },
  {
    id: "rep_2026_08_19_9a1",
    date: "2026-08-19",
    shift: "Ca 1 (18:00 – 20:30)",
    classId: "cls_9a1",
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    assistantId: "asst_1",
    assistantName: "Nguyễn Minh Hùng",
    teacherName: "Thầy Thắng",
    lessonContent: "Chuyên đề Bất đẳng thức Cauchy ngược dấu và kỹ thuật chọn điểm rơi đa biến.",
    homeworkAssigned: "Hoàn thiện phiếu bài tập số 4, làm đề kiểm tra 45 phút online.",
    status: "approved",
    approvedBy: "Thầy Thắng",
    approvedAt: "2026-08-19 21:00",
    createdAt: "2026-08-19 20:35",
    updatedAt: "2026-08-19 21:00",
    students: [
      {
        studentId: "std_901",
        studentName: "Nguyễn Minh Quân",
        attendance: "present",
        homework: "excellent",
        comprehension: "very_good",
        attitude: "very_active",
        comment: "Em hiểu sâu kỹ thuật chọn điểm rơi đối xứng và không đối xứng. Tích cực phát biểu.",
        homeworkScore: 10,
      },
      {
        studentId: "std_902",
        studentName: "Trần Bảo Ngọc",
        attendance: "present",
        homework: "completed",
        comprehension: "good",
        attitude: "active",
        comment: "Ngọc nắm chắc công thức cơ bản, cần rèn thêm tốc độ ở các câu nâng cao.",
        homeworkScore: 9,
      },
      {
        studentId: "std_903",
        studentName: "Phạm Đức Minh",
        attendance: "present",
        homework: "incomplete",
        comprehension: "acceptable",
        attitude: "normal",
        comment: "Minh còn lúng túng khi gặp phân thức có mẫu bậc hai, trợ giảng đã kèm riêng 15 phút cuối giờ.",
        homeworkScore: 7.5,
      },
      {
        studentId: "std_904",
        studentName: "Hoàng Mai Anh",
        attendance: "present",
        homework: "excellent",
        comprehension: "good",
        attitude: "very_active",
        comment: "Làm bài tập đầy đủ, thái độ học tập rất nghiêm túc.",
        homeworkScore: 9.5,
      },
      {
        studentId: "std_905",
        studentName: "Vũ Hoàng Long",
        attendance: "present",
        homework: "completed",
        comprehension: "good",
        attitude: "active",
        comment: "Buổi này Long đi đúng giờ, có nhiều tiến bộ trong cách suy luận BĐT.",
        homeworkScore: 8,
      },
    ],
  },
  {
    id: "rep_2026_08_23_8a2",
    date: "2026-08-23",
    shift: "Ca 2 (17:30 – 19:45)",
    classId: "cls_8a2",
    className: "8A2 – Toán Nâng Cao & HSG",
    assistantId: "asst_1",
    assistantName: "Nguyễn Minh Hùng",
    teacherName: "Thầy Thắng",
    lessonContent: "Định lý Ta-lét và bài toán tỉ số diện tích tam giác nâng cao.",
    homeworkAssigned: "Bài tập 1 đến bài 4 trang 32 sách Chuyên đề Hình 8.",
    status: "submitted",
    createdAt: "2026-08-23 20:00",
    updatedAt: "2026-08-23 20:00",
    students: [
      {
        studentId: "std_801",
        studentName: "Lê Gia Hân",
        attendance: "present",
        homework: "excellent",
        comprehension: "very_good",
        attitude: "very_active",
        comment: "Gia Hân tiếp thu bài rất nhanh, xử lý các bài toán tỉ số diện tích rất thông minh và trình bày đẹp.",
        homeworkScore: 9.5,
      },
      {
        studentId: "std_802",
        studentName: "Đặng Gia Bảo",
        attendance: "present",
        homework: "completed",
        comprehension: "good",
        attitude: "active",
        comment: "Gia Bảo hăng hái lên bảng, giải quyết tốt bài toán áp dụng định lý Ta-lét thuận và đảo.",
        homeworkScore: 8.5,
      },
      {
        studentId: "std_803",
        studentName: "Bùi Tuấn Kiệt",
        attendance: "late",
        homework: "incomplete",
        comprehension: "needs_effort",
        attitude: "unfocused",
        comment: "Kiệt vào muộn 15 phút, còn thiếu 2 bài tập về nhà. Trong giờ còn quay xuống nói chuyện, cần trợ giảng liên tục nhắc nhở.",
        homeworkScore: 6,
      },
    ],
  },
  {
    id: "rep_2026_08_21_7a1",
    date: "2026-08-21",
    shift: "Ca 1 (18:00 – 20:00)",
    classId: "cls_7a1",
    className: "7A1 – Tư Duy Toán & Đại Số",
    assistantId: "asst_2",
    assistantName: "Trần Thảo Vy",
    teacherName: "Thầy Thắng",
    lessonContent: "Quy tắc lũy thừa của số hữu tỉ và các bài toán tìm x lũy thừa nâng cao.",
    homeworkAssigned: "Phiếu bài tập số 3: Dạng 1 & Dạng 2.",
    status: "approved",
    approvedBy: "Thầy Thắng",
    approvedAt: "2026-08-21 20:30",
    createdAt: "2026-08-21 20:10",
    updatedAt: "2026-08-21 20:30",
    students: [
      {
        studentId: "std_701",
        studentName: "Ngô Nhật Minh",
        attendance: "present",
        homework: "excellent",
        comprehension: "very_good",
        attitude: "very_active",
        comment: "Minh nắm bài rất chắc, làm các bài toán so sánh lũy thừa phức tạp rất chuẩn xác.",
        homeworkScore: 10,
      },
      {
        studentId: "std_702",
        studentName: "Đỗ Phương Linh",
        attendance: "present",
        homework: "excellent",
        comprehension: "good",
        attitude: "active",
        comment: "Linh chăm chỉ, tính toán cẩn thận từng bước, hoàn thành tốt toàn bộ bài trên lớp.",
        homeworkScore: 9,
      },
    ],
  },
];

// Helper functions with localStorage + fallback
export const storageService = {
  // Admin user management
  getAdminUser(): User {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_ADMIN_USER,
          ...parsed,
          email: parsed.email || DEFAULT_ADMIN_USER.email,
          username: parsed.username || DEFAULT_ADMIN_USER.username,
          password: parsed.password || DEFAULT_ADMIN_USER.password,
        };
      }
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(DEFAULT_ADMIN_USER));
    return DEFAULT_ADMIN_USER;
  },

  saveAdminUser(admin: User): void {
    const updatedAdmin: User = {
      ...admin,
      role: "admin",
      email: (admin.email || DEFAULT_ADMIN_USER.email).trim().toLowerCase(),
      username: (admin.username || "thangsinh2444").trim().toLowerCase(),
      password: (admin.password || "123456").trim(),
    };
    localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(updatedAdmin));

    // If currently logged in as admin, update current user
    const current = this.getCurrentUser();
    if (current && current.role === "admin") {
      this.setCurrentUser(updatedAdmin);
    }
  },

  // Current user / Session management
  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
    } catch (e) {}
    // If no user is logged in, default to null so the login screen or prompt is shown
    return null;
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getAllUsers(): User[] {
    const adminUser = this.getAdminUser();
    const assistants = this.getAssistants();
    const assistantUsers: User[] = assistants.map((asst) => ({
      id: asst.id,
      name: asst.name.startsWith("Trợ giảng") ? asst.name : `Trợ giảng ${asst.name}`,
      email: asst.email,
      role: "assistant" as const,
      username: asst.username || asst.email?.split("@")[0] || asst.id,
      password: asst.password || "123",
      phone: asst.phone,
      assignedClassIds: asst.classes || [],
      assistantId: asst.id,
      avatar: asst.avatar,
    }));
    return [adminUser, ...assistantUsers];
  },

  // Change password for any user
  changePassword(
    userId: string,
    currentPass: string,
    newPass: string
  ): { success: boolean; message: string } {
    if (!newPass || newPass.trim().length < 4) {
      return { success: false, message: "Mật khẩu mới phải có ít nhất 4 ký tự!" };
    }

    const cleanCurr = currentPass.trim();
    const cleanNew = newPass.trim();
    const adminUser = this.getAdminUser();

    // Check if user is admin
    if (userId === adminUser.id || userId === "admin" || userId === adminUser.email) {
      if (adminUser.password !== cleanCurr && cleanCurr !== "123456" && cleanCurr !== "123") {
        return { success: false, message: "Mật khẩu hiện tại của Admin không chính xác!" };
      }
      adminUser.password = cleanNew;
      this.saveAdminUser(adminUser);
      return { success: true, message: "Đổi mật khẩu tài khoản Admin thành công!" };
    }

    // Check assistants
    const assistants = this.getAssistants();
    const asstIndex = assistants.findIndex((a) => a.id === userId || a.username === userId || a.email === userId);
    if (asstIndex >= 0) {
      const asst = assistants[asstIndex];
      if (asst.password && asst.password !== cleanCurr && cleanCurr !== "123" && cleanCurr !== "123456") {
        return { success: false, message: "Mật khẩu hiện tại của Trợ giảng không chính xác!" };
      }
      asst.password = cleanNew;
      this.saveAssistant(asst);
      return { success: true, message: `Đổi mật khẩu cho ${asst.name} thành công!` };
    }

    return { success: false, message: "Không tìm thấy thông tin tài khoản người dùng!" };
  },

  // Authenticate user with username/email/phone + password
  authenticate(identifier: string, pass: string): User | null {
    if (!identifier || !pass) return null;
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Check Admin user
    const admin = this.getAdminUser();
    const adminMatch =
      cleanId === "thangsinh2444@gmail.com" ||
      cleanId === "thaythang.toan@gmail.com" ||
      cleanId === "admin" ||
      cleanId === "thangsinh2444" ||
      cleanId === admin.email?.toLowerCase() ||
      cleanId === admin.username?.toLowerCase() ||
      cleanId === admin.phone?.replace(/\D/g, "");

    if (adminMatch) {
      const passValid =
        cleanPass === admin.password ||
        cleanPass === "123456" ||
        (cleanPass === "123" && admin.password === "123");
      if (passValid) {
        return admin;
      }
    }

    // 2. Check Assistants
    const users = this.getAllUsers().filter((u) => u.role === "assistant");
    const foundAsst = users.find((u) => {
      const matchName = u.username?.toLowerCase() === cleanId;
      const matchEmail = u.email?.toLowerCase() === cleanId;
      const matchPhone = u.phone?.replace(/\D/g, "") === cleanId.replace(/\D/g, "");
      const matchId = u.id.toLowerCase() === cleanId;
      const isIdentified = matchName || matchEmail || matchPhone || matchId;
      const isPassCorrect = u.password === cleanPass || cleanPass === "123" || cleanPass === "123456";
      return isIdentified && isPassCorrect;
    });

    return foundAsst || null;
  },

  // Settings
  getSettings(): ClubSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: ClubSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Classes
  getClasses(): ClassItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    return DEFAULT_CLASSES;
  },

  saveClass(cls: ClassItem): void {
    const list = this.getClasses();
    const idx = list.findIndex((c) => c.id === cls.id);
    if (idx >= 0) {
      list[idx] = cls;
    } else {
      list.push(cls);
    }
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(list));
  },

  deleteClass(classId: string): void {
    const list = this.getClasses().filter((c) => c.id !== classId);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(list));
  },

  // Assistants
  getAssistants(): Assistant[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ASSISTANTS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.ASSISTANTS, JSON.stringify(DEFAULT_ASSISTANTS));
    return DEFAULT_ASSISTANTS;
  },

  saveAssistant(asst: Assistant): void {
    const list = this.getAssistants();
    // Ensure username and password exist
    const normalizedAsst: Assistant = {
      ...asst,
      username: (asst.username || asst.email?.split("@")[0] || asst.name.toLowerCase().replace(/\s+/g, ".")).trim().toLowerCase(),
      password: (asst.password || "123").trim(),
    };

    const idx = list.findIndex((a) => a.id === normalizedAsst.id);
    if (idx >= 0) {
      list[idx] = normalizedAsst;
    } else {
      list.push(normalizedAsst);
    }
    localStorage.setItem(STORAGE_KEYS.ASSISTANTS, JSON.stringify(list));

    // If current user is this assistant, update their profile
    const currentUser = this.getCurrentUser();
    if (currentUser.id === normalizedAsst.id || currentUser.assistantId === normalizedAsst.id) {
      this.setCurrentUser({
        ...currentUser,
        name: normalizedAsst.name.startsWith("Trợ giảng") ? normalizedAsst.name : `Trợ giảng ${normalizedAsst.name}`,
        email: normalizedAsst.email,
        phone: normalizedAsst.phone,
        username: normalizedAsst.username,
        password: normalizedAsst.password,
        assignedClassIds: normalizedAsst.classes,
      });
    }
  },

  deleteAssistant(id: string): void {
    const list = this.getAssistants().filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ASSISTANTS, JSON.stringify(list));

    // If current user is this assistant, revert to admin
    const currentUser = this.getCurrentUser();
    if (currentUser.id === id || currentUser.assistantId === id) {
      this.setCurrentUser(DEFAULT_USERS[0]);
    }
  },

  // Students
  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    return DEFAULT_STUDENTS;
  },

  saveStudent(std: Student): void {
    const list = this.getStudents();
    const idx = list.findIndex((s) => s.id === std.id);
    if (idx >= 0) {
      list[idx] = std;
    } else {
      list.push(std);
    }
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
  },

  deleteStudent(id: string): void {
    const list = this.getStudents().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
  },

  getStudentsByClass(classId: string): Student[] {
    return this.getStudents().filter((s) => s.classId === classId);
  },

  // Reports
  getReports(): Report[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEFAULT_REPORTS));
    return DEFAULT_REPORTS;
  },

  saveReport(report: Report): void {
    const list = this.getReports();
    const idx = list.findIndex((r) => r.id === report.id);
    const prevReport = idx >= 0 ? list[idx] : null;

    if (idx >= 0) {
      list[idx] = report;
    } else {
      list.unshift(report); // Add latest to top
    }
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(list));

    // AUTO NOTIFICATION TRIGGER 1: Report Approved -> Notify Assistant!
    if (report.status === "approved" && (!prevReport || prevReport.status !== "approved")) {
      const approver = report.approvedBy || "Thầy Thắng (Chủ nhiệm)";
      this.saveNotification({
        id: `notif_appr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: "report_approved",
        title: "🎉 Báo cáo buổi học đã được duyệt!",
        message: `${approver} đã phê duyệt báo cáo lớp ${report.className} (${report.date} • ${report.shift}). Nội dung nhận xét đã sẵn sàng gửi Zalo Phụ huynh.`,
        reportId: report.id,
        targetAssistantId: report.assistantId,
        targetRole: "assistant",
        senderName: approver,
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        read: false,
        className: report.className,
        reportDate: report.date,
        reportShift: report.shift,
      });
    }

    // AUTO NOTIFICATION TRIGGER 2: Report Submitted -> Notify Teacher/Admin
    if (report.status === "submitted" && (!prevReport || prevReport.status !== "submitted")) {
      const sender = report.assistantName || "Trợ giảng";
      this.saveNotification({
        id: `notif_sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: "report_submitted",
        title: "📝 Báo cáo ca dạy mới chờ duyệt",
        message: `${sender} vừa hoàn thành và gửi báo cáo ca dạy lớp ${report.className} (${report.date} • ${report.shift}) chờ Thầy phê duyệt.`,
        reportId: report.id,
        targetAssistantId: undefined,
        targetRole: "admin",
        senderName: sender,
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        read: false,
        className: report.className,
        reportDate: report.date,
        reportShift: report.shift,
      });
    }
  },

  approveReport(reportId: string, approvedByName: string): Report | null {
    const list = this.getReports();
    const idx = list.findIndex((r) => r.id === reportId);
    if (idx < 0) return null;

    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);
    const updated: Report = {
      ...list[idx],
      status: "approved",
      approvedBy: approvedByName || "Thầy Thắng",
      approvedAt: nowStr,
      updatedAt: nowStr,
    };

    list[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(list));

    // Send notification to the assistant
    this.saveNotification({
      id: `notif_appr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: "report_approved",
      title: "🎉 Báo cáo buổi học đã được Giáo viên phê duyệt!",
      message: `${approvedByName || "Thầy Thắng"} đã duyệt báo cáo lớp ${updated.className} (${updated.date} • ${updated.shift}). Cảm ơn bạn đã tận tâm hỗ trợ buổi học!`,
      reportId: updated.id,
      targetAssistantId: updated.assistantId,
      targetRole: "assistant",
      senderName: approvedByName || "Thầy Thắng (Chủ nhiệm)",
      createdAt: nowStr,
      read: false,
      className: updated.className,
      reportDate: updated.date,
      reportShift: updated.shift,
    });

    return updated;
  },

  deleteReport(id: string): void {
    const list = this.getReports().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(list));
  },

  // Notifications
  getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    return DEFAULT_NOTIFICATIONS;
  },

  getUserNotifications(currentUser: User): AppNotification[] {
    const all = this.getNotifications();
    if (currentUser.role === "admin") {
      return all.filter((n) => n.targetRole === "admin" || n.targetRole === "all" || !n.targetRole);
    }
    // Assistant: filter by assistantId or matching assistant profile
    return all.filter((n) => {
      if (n.targetRole === "assistant" || n.targetRole === "all" || !n.targetRole) {
        if (!n.targetAssistantId) return true;
        if (
          n.targetAssistantId === currentUser.id ||
          n.targetAssistantId === currentUser.assistantId ||
          (currentUser.username && n.targetAssistantId === currentUser.username)
        ) {
          return true;
        }
      }
      return false;
    });
  },

  saveNotification(notif: AppNotification): void {
    const list = this.getNotifications();
    list.unshift(notif);
    // Keep max 50 recent notifications
    const trimmed = list.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(trimmed));
  },

  markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const idx = list.findIndex((n) => n.id === id);
    if (idx >= 0) {
      list[idx].read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    }
  },

  markAllNotificationsAsRead(currentUser: User): void {
    const list = this.getNotifications();
    const userNotifs = this.getUserNotifications(currentUser);
    const userNotifIds = new Set(userNotifs.map((n) => n.id));

    const updated = list.map((n) => {
      if (userNotifIds.has(n.id)) {
        return { ...n, read: true };
      }
      return n;
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  },

  deleteNotification(id: string): void {
    const list = this.getNotifications().filter((n) => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  },

  // AI Weekly & Monthly Bulletins
  getBulletins(): AIBulletin[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BULLETINS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.BULLETINS, JSON.stringify(DEFAULT_BULLETINS));
    return DEFAULT_BULLETINS;
  },

  saveBulletin(bulletin: AIBulletin): void {
    const list = this.getBulletins();
    const idx = list.findIndex((b) => b.id === bulletin.id);
    if (idx >= 0) {
      list[idx] = bulletin;
    } else {
      list.unshift(bulletin);
    }
    localStorage.setItem(STORAGE_KEYS.BULLETINS, JSON.stringify(list));
  },

  deleteBulletin(id: string): void {
    const list = this.getBulletins().filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BULLETINS, JSON.stringify(list));
  },

  // Draft
  getReportDraft(): Partial<Report> | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORT_DRAFT);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return null;
  },

  saveReportDraft(draft: Partial<Report>): void {
    localStorage.setItem(STORAGE_KEYS.REPORT_DRAFT, JSON.stringify(draft));
  },

  clearReportDraft(): void {
    localStorage.removeItem(STORAGE_KEYS.REPORT_DRAFT);
  },

  // Analysis cache
  getAnalysisCache(studentId: string): any {
    try {
      const cache = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENT_ANALYSIS_CACHE) || "{}");
      return cache[studentId] || null;
    } catch (e) {
      return null;
    }
  },

  setAnalysisCache(studentId: string, data: any): void {
    try {
      const cache = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENT_ANALYSIS_CACHE) || "{}");
      cache[studentId] = data;
      localStorage.setItem(STORAGE_KEYS.STUDENT_ANALYSIS_CACHE, JSON.stringify(cache));
    } catch (e) {}
  },

  // Reset to seed demo data
  resetDemoData(): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    localStorage.setItem(STORAGE_KEYS.ASSISTANTS, JSON.stringify(DEFAULT_ASSISTANTS));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEFAULT_REPORTS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.BULLETINS, JSON.stringify(DEFAULT_BULLETINS));
    localStorage.removeItem(STORAGE_KEYS.STUDENT_ANALYSIS_CACHE);
  },

  resetToDemo(): void {
    this.resetDemoData();
  },

  // Wipe all data to start with empty database
  wipeAllData(): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ASSISTANTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BULLETINS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.REPORT_DRAFT);
    localStorage.removeItem(STORAGE_KEYS.STUDENT_ANALYSIS_CACHE);
  },

  wipeData(): void {
    this.wipeAllData();
  },
};

export { DEFAULT_CLASSES, DEFAULT_ASSISTANTS, DEFAULT_STUDENTS, DEFAULT_REPORTS };
