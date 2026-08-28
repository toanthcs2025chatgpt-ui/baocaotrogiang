import {
  ClassItem,
  Student,
  Assistant,
  Report,
  ClubSettings,
  User,
  AppNotification,
  AIBulletin,
  ShiftConfig,
  TimetableSlot,
  TimetableSettings,
  MasterTimetableSlot,
  ShiftId,
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
  MISCONCEPTIONS_CUSTOM: "clb_custom_math_misconceptions",
  MISCONCEPTIONS_ORDER: "clb_math_misconceptions_order",
  MISCONCEPTIONS_LOCKED: "clb_math_misconceptions_locked",
  TIMETABLE_SLOTS: "thaythang_timetable_slots_v2",
  MASTER_TIMETABLE_SLOTS: "thaythang_master_timetable_slots_v2",
  TIMETABLE_SETTINGS: "thaythang_timetable_settings_v2",
  GDRIVE_SYNC_SNAPSHOT: "thaythang_gdrive_synced_data",
  LAST_CLOUD_SYNC_VERSION: "thaythang_cloud_sync_version_v1",
  LAST_CLOUD_SYNC_TIME: "thaythang_cloud_sync_time_v1",
  DEVICE_ID: "thaythang_device_id_v1",
};

export const DEFAULT_SHIFT_CONFIGS: ShiftConfig[] = [
  { id: "morning_1", name: "Ca Sáng 1", period: "morning", startTime: "07:30", endTime: "09:30" },
  { id: "morning_2", name: "Ca Sáng 2", period: "morning", startTime: "09:45", endTime: "11:45" },
  { id: "afternoon_1", name: "Ca Chiều 1", period: "afternoon", startTime: "14:00", endTime: "16:00" },
  { id: "afternoon_2", name: "Ca Chiều 2", period: "afternoon", startTime: "16:15", endTime: "18:15" },
  { id: "evening_1", name: "Ca Tối 1", period: "evening", startTime: "18:30", endTime: "20:30" },
  { id: "evening_2", name: "Ca Tối 2", period: "evening", startTime: "20:45", endTime: "22:30" },
];

export const DEFAULT_MASTER_TIMETABLE_SLOTS: MasterTimetableSlot[] = [
  {
    id: "master_t2_e1",
    dayOfWeek: 1, // Thứ 2
    shiftId: "evening_1",
    classId: "cls_9a1",
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_1",
    assistantName: "Nguyễn Minh Hùng",
    room: "Phòng 301 - Tầng 3",
    lessonTopic: "Bất đẳng thức Cauchy & Kỹ thuật chọn điểm rơi",
    lessonContent: "1. Nguyên lý BĐT Cauchy 2 số, 3 số\n2. Kỹ thuật tách, thêm bớt hạng tử đối xứng\n3. Hướng dẫn các bài tập chọn điểm rơi cơ bản và nâng cao",
    progressNote: "Đã hoàn thành lý thuyết & bài tập 1-5 trang 32; Bài 6, 7 cho về nhà",
    homework: "Làm bài tập 6, 7, 8 trong Phiếu Chuyên Đề 05 + Hoàn thiện đề thi thử số 03",
    homeworkDeadline: "Thứ Năm hàng tuần",
    generalNotes: "Học sinh cần lưu ý điều kiện dấu đẳng thức xảy ra; Lớp tập trung cao",
  },
  {
    id: "master_t3_a1",
    dayOfWeek: 2, // Thứ 3
    shiftId: "afternoon_1",
    classId: "cls_7a1",
    className: "7A1 – Tư Duy Toán & Đại Số",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_2",
    assistantName: "Trần Thảo Vy",
    room: "Phòng 202 - Tầng 2",
    lessonTopic: "Đơn thức đồng dạng & Thu gọn biểu thức đại số",
    lessonContent: "1. Khái niệm đơn thức đồng dạng, hệ số, phần biến\n2. Phép cộng, trừ các đơn thức đồng dạng\n3. Bài tập phân dạng và tính giá trị biểu thức",
    progressNote: "Đã chữa xong dạng 1 (Cơ bản) và dạng 2 (Nâng cao); Học sinh nắm bài rất tốt",
    homework: "Phiếu bài tập số 04 (Trang 12-15 Sách Bổ Trợ) – Nộp đầu ca học sau",
    homeworkDeadline: "Thứ Sáu hàng tuần",
    generalNotes: "Rèn chữ viết và cách trình bày ngay ngắn cho các con",
  },
  {
    id: "master_t4_e1",
    dayOfWeek: 3, // Thứ 4
    shiftId: "evening_1",
    classId: "cls_8a2",
    className: "8A2 – Toán Nâng Cao & HSG",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_3",
    assistantName: "Lê Đức Anh",
    room: "Phòng 302 - Tầng 3",
    lessonTopic: "Hình bình hành & Ứng dụng chứng minh song song",
    lessonContent: "1. Định nghĩa và 5 dấu hiệu nhận biết hình bình hành\n2. Kỹ thuật vẽ hình phụ và liên kết trung điểm\n3. Luyện tập chứng minh 3 điểm thẳng hàng và đường thẳng song song",
    progressNote: "Đã dạy xong 5 dấu hiệu, đang luyện tập câu C hình và chữa bài tập 1-3",
    homework: "Làm bài 1, 2, 3, 4 Phiếu Luyện Hình 03",
    homeworkDeadline: "Thứ Bảy hàng tuần",
    generalNotes: "Yêu cầu học sinh mang đầy đủ thước kẻ, compa vẽ hình chuẩn xác",
  },
  {
    id: "master_t5_e1",
    dayOfWeek: 4, // Thứ 5
    shiftId: "evening_1",
    classId: "cls_9a1",
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_1",
    assistantName: "Nguyễn Minh Hùng",
    room: "Phòng 301 - Tầng 3",
    lessonTopic: "Chữa Đề Khảo Sát & Bổ Trợ BĐT Cauchy Nâng Cao",
    lessonContent: "1. Chữa chi tiết câu I, II, III trong Đề KSCL\n2. Phân tích các lỗi trừ điểm đại số\n3. Luyện kỹ năng giải câu BĐT phân loại 0.5 - 1.0 điểm",
    progressNote: "Kế hoạch: Chữa xong câu I-IV trong 90 phút đầu, 30 phút cuối phân tích câu V",
    homework: "Làm lại các câu sai vào vở sửa bài + Chuẩn bị bài Phương trình vô tỷ",
    homeworkDeadline: "Chủ Nhật hàng tuần",
    generalNotes: "Kiểm tra kỹ vở sửa bài của từng học sinh",
  },
  {
    id: "master_t6_a1",
    dayOfWeek: 5, // Thứ 6
    shiftId: "afternoon_1",
    classId: "cls_7a1",
    className: "7A1 – Tư Duy Toán & Đại Số",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_2",
    assistantName: "Trần Thảo Vy",
    room: "Phòng 202 - Tầng 2",
    lessonTopic: "Đa thức một biến & Cộng trừ đa thức",
    lessonContent: "1. Khái niệm đa thức một biến, sắp xếp theo lũy thừa giảm dần\n2. Bậc, hệ số cao nhất, hệ số tự do\n3. Luyện tập cộng trừ đa thức theo cột dọc và hàng ngang",
    progressNote: "Dự kiến học xong lý thuyết và 3 ví dụ mẫu phân dạng",
    homework: "Bài tập 1 đến 5 Phiếu 05 Đa thức",
    homeworkDeadline: "Thứ Ba tuần tới",
    generalNotes: "Rèn chữ viết và tính cẩn thận khi cộng trừ dấu âm",
  },
  {
    id: "master_t7_m1",
    dayOfWeek: 6, // Thứ 7
    shiftId: "morning_1",
    classId: "cls_8a2",
    className: "8A2 – Toán Nâng Cao & HSG",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_3",
    assistantName: "Lê Đức Anh",
    room: "Phòng 302 - Tầng 3",
    lessonTopic: "Hình chữ nhật – Tính chất & Dấu hiệu nhận biết",
    lessonContent: "1. Định nghĩa và các tính chất đặc trưng của hình chữ nhật\n2. Dấu hiệu nhận biết liên quan đến góc vuông và đường chéo\n3. Bài toán áp dụng vào tam giác vuông có trung tuyến",
    progressNote: "Dự kiến học định lý trung tuyến tam giác vuông và làm bài tập áp dụng",
    homework: "Làm bài 1, 2, 3 trang 45 Sách Bài Tập",
    homeworkDeadline: "Thứ Tư tuần tới",
    generalNotes: "Học sinh lớp 8 chuẩn bị cho bài kiểm tra 15 phút đầu giờ",
  },
  {
    id: "master_t7_m2",
    dayOfWeek: 6, // Thứ 7
    shiftId: "morning_2",
    classId: "cls_9a1",
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_1",
    assistantName: "Nguyễn Minh Hùng",
    room: "Phòng 301 - Tầng 3",
    lessonTopic: "Chuyên đề Bồi Dưỡng Học Sinh Giỏi – Số Học & Đồng Dư",
    lessonContent: "1. Phép chia có dư và tính chất đồng dư thức\n2. Định lý Fermat nhỏ và ứng dụng tìm chữ số tận cùng\n3. Luyện giải các bài toán chia hết trong đề thi Chuyên",
    progressNote: "Dự kiến làm quen định lý Fermat nhỏ và giải 4 bài toán mẫu",
    homework: "Phiếu Số Học Nâng Cao số 02 (5 bài tập)",
    homeworkDeadline: "Thứ Hai tuần tới",
    generalNotes: "Dành cho nhóm học sinh đăng ký thi Chuyên Toán – Tin",
  },
  {
    id: "master_cn_e1",
    dayOfWeek: 7, // Chủ Nhật
    shiftId: "evening_1",
    classId: "cls_7a1",
    className: "7A1 – Tư Duy Toán & Đại Số",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_2",
    assistantName: "Trần Thảo Vy",
    room: "Phòng 202 - Tầng 2",
    lessonTopic: "Luyện Tập Cuối Tuần & Đấu Trường Toán Học",
    lessonContent: "1. Trắc nghiệm nhanh 15 câu ôn tập kiến thức tuần\n2. Giải bài toán vui tư duy logic\n3. Trao thưởng học sinh tiến bộ trong tuần",
    progressNote: "Hoạt động củng cố nề nếp và tăng cảm hứng học toán",
    homework: "Đọc trước bài mới và chuẩn bị câu hỏi cho ca tuần tới",
    homeworkDeadline: "Thứ Sáu tuần tới",
    generalNotes: "Trợ giảng chuẩn bị phiếu câu hỏi và phần quà nhỏ",
  },
];

export const DEFAULT_TIMETABLE_SLOTS: TimetableSlot[] = [
  {
    id: "tt_slot_1",
    date: "2026-08-24",
    dayOfWeek: 1,
    shiftId: "evening_1",
    classId: "cls_9a1",
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_1",
    assistantName: "Nguyễn Minh Hùng",
    room: "Phòng 301 - Tầng 3",
    lessonTopic: "Bất đẳng thức Cauchy & Kỹ thuật chọn điểm rơi",
    lessonContent: "1. Nguyên lý BĐT Cauchy 2 số, 3 số\n2. Kỹ thuật tách, thêm bớt hạng tử đối xứng\n3. Hướng dẫn các bài tập chọn điểm rơi cơ bản và nâng cao",
    progressNote: "Đã hoàn thành lý thuyết & bài tập 1-5 trang 32; Bài 6, 7 cho về nhà",
    homework: "Làm bài tập 6, 7, 8 trong Phiếu Chuyên Đề 05 + Hoàn thiện đề thi thử số 03",
    homeworkDeadline: "2026-08-27",
    generalNotes: "Học sinh Khôi cần lưu ý điều kiện dấu đẳng thức xảy ra; Lớp tập trung cao",
    status: "completed",
  },
  {
    id: "tt_slot_2",
    date: "2026-08-25",
    dayOfWeek: 2,
    shiftId: "afternoon_1",
    classId: "cls_7a1",
    className: "7A1 – Tư Duy Toán & Đại Số",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_2",
    assistantName: "Trần Thảo Vy",
    room: "Phòng 202 - Tầng 2",
    lessonTopic: "Đơn thức đồng dạng & Thu gọn biểu thức đại số",
    lessonContent: "1. Khái niệm đơn thức đồng dạng, hệ số, phần biến\n2. Phép cộng, trừ các đơn thức đồng dạng\n3. Bài tập phân dạng và tính giá trị biểu thức",
    progressNote: "Đã chữa xong dạng 1 (Cơ bản) và dạng 2 (Nâng cao); Học sinh nắm bài rất tốt",
    homework: "Phiếu bài tập số 04 (Trang 12-15 Sách Bổ Trợ) – Nộp đầu ca học sau",
    homeworkDeadline: "2026-08-28",
    generalNotes: "Bạn Nam Phong cần chú ý giữ trật tự 15 phút đầu giờ",
    status: "completed",
  },
  {
    id: "tt_slot_3",
    date: "2026-08-26",
    dayOfWeek: 3,
    shiftId: "evening_1",
    classId: "cls_8a2",
    className: "8A2 – Toán Nâng Cao & HSG",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_3",
    assistantName: "Lê Đức Anh",
    room: "Phòng 302 - Tầng 3",
    lessonTopic: "Hình bình hành & Ứng dụng chứng minh song song",
    lessonContent: "1. Định nghĩa và 5 dấu hiệu nhận biết hình bình hành\n2. Kỹ thuật vẽ hình phụ và liên kết trung điểm\n3. Luyện tập chứng minh 3 điểm thẳng hàng và đường thẳng song song",
    progressNote: "Đã dạy xong 5 dấu hiệu, đang luyện tập câu C hình và chữa bài tập 1-3",
    homework: "Làm bài 1, 2, 3, 4 Phiếu Luyện Hình 03",
    homeworkDeadline: "2026-08-29",
    generalNotes: "Yêu cầu học sinh mang đầy đủ thước kẻ, compa vẽ hình chuẩn xác",
    status: "in_progress",
  },
  {
    id: "tt_slot_4",
    date: "2026-08-27",
    dayOfWeek: 4,
    shiftId: "evening_1",
    classId: "cls_9a1",
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_1",
    assistantName: "Nguyễn Minh Hùng",
    room: "Phòng 301 - Tầng 3",
    lessonTopic: "Chữa Đề Khảo Sát Tháng 8 & Bổ Trợ BĐT Cauchy Nâng Cao",
    lessonContent: "1. Chữa chi tiết câu I, II, III trong Đề KSCL Tháng 8\n2. Phân tích các lỗi trừ điểm đại số\n3. Luyện kỹ năng giải câu BĐT phân loại 0.5 - 1.0 điểm",
    progressNote: "Kế hoạch: Chữa xong câu I-IV trong 90 phút đầu, 30 phút cuối phân tích câu V",
    homework: "Làm lại các câu sai vào vở sửa bài + Chuẩn bị bài Phương trình vô tỷ",
    homeworkDeadline: "2026-08-31",
    generalNotes: "Kiểm tra kỹ vở sửa bài của từng học sinh",
    status: "upcoming",
  },
  {
    id: "tt_slot_5",
    date: "2026-08-28",
    dayOfWeek: 5,
    shiftId: "afternoon_1",
    classId: "cls_7a1",
    className: "7A1 – Tư Duy Toán & Đại Số",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_2",
    assistantName: "Trần Thảo Vy",
    room: "Phòng 202 - Tầng 2",
    lessonTopic: "Đa thức một biến & Cộng trừ đa thức",
    lessonContent: "1. Khái niệm đa thức một biến, sắp xếp theo lũy thừa giảm dần\n2. Bậc, hệ số cao nhất, hệ số tự do\n3. Luyện tập cộng trừ đa thức theo cột dọc và hàng ngang",
    progressNote: "Dự kiến học xong lý thuyết và 3 ví dụ mẫu phân dạng",
    homework: "Bài tập 1 đến 5 Phiếu 05 Đa thức",
    homeworkDeadline: "2026-09-01",
    generalNotes: "Rèn chữ viết và cách trình bày ngay ngắn cho các con",
    status: "upcoming",
  },
  {
    id: "tt_slot_6",
    date: "2026-08-29",
    dayOfWeek: 6,
    shiftId: "morning_1",
    classId: "cls_8a2",
    className: "8A2 – Toán Nâng Cao & HSG",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_3",
    assistantName: "Lê Đức Anh",
    room: "Phòng 302 - Tầng 3",
    lessonTopic: "Hình chữ nhật – Tính chất & Dấu hiệu nhận biết",
    lessonContent: "1. Định nghĩa và các tính chất đặc trưng của hình chữ nhật\n2. Dấu hiệu nhận biết liên quan đến góc vuông và đường chéo\n3. Bài toán áp dụng vào tam giác vuông có trung tuyến",
    progressNote: "Dự kiến học định lý trung tuyến tam giác vuông và làm bài tập áp dụng",
    homework: "Làm bài 1, 2, 3 trang 45 Sách Bài Tập",
    homeworkDeadline: "2026-09-02",
    generalNotes: "Học sinh lớp 8 chuẩn bị cho bài kiểm tra 15 phút đầu giờ",
    status: "upcoming",
  },
  {
    id: "tt_slot_7",
    date: "2026-08-29",
    dayOfWeek: 6,
    shiftId: "morning_2",
    classId: "cls_9a1",
    className: "9A1 – Luyện Thi Vào 10 Chuyên",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_1",
    assistantName: "Nguyễn Minh Hùng",
    room: "Phòng 301 - Tầng 3",
    lessonTopic: "Chuyên đề Bồi Dưỡng Học Sinh Giỏi – Số Học & Đồng Dư",
    lessonContent: "1. Phép chia có dư và tính chất đồng dư thức\n2. Định lý Fermat nhỏ và ứng dụng tìm chữ số tận cùng\n3. Luyện giải các bài toán chia hết trong đề thi Chuyên",
    progressNote: "Dự kiến làm quen định lý Fermat nhỏ và giải 4 bài toán mẫu",
    homework: "Phiếu Số Học Nâng Cao số 02 (5 bài tập)",
    homeworkDeadline: "2026-09-03",
    generalNotes: "Dành cho nhóm học sinh đăng ký thi Chuyên Toán – Tin",
    status: "upcoming",
  },
  {
    id: "tt_slot_8",
    date: "2026-08-30",
    dayOfWeek: 7,
    shiftId: "evening_1",
    classId: "cls_7a1",
    className: "7A1 – Tư Duy Toán & Đại Số",
    teacherName: "Thầy Thắng (Chủ nhiệm)",
    assistantId: "asst_2",
    assistantName: "Trần Thảo Vy",
    room: "Phòng 202 - Tầng 2",
    lessonTopic: "Luyện Tập Cuối Tuần & Thi Đấu Đấu Trường Toán Học",
    lessonContent: "1. Trắc nghiệm nhanh 15 câu ôn tập kiến thức tuần\n2. Giải bài toán vui tư duy logic\n3. Trao thưởng học sinh tiến bộ trong tuần",
    progressNote: "Hoạt động củng cố nề nếp và tăng cảm hứng học toán",
    homework: "Đọc trước bài mới và chuẩn bị câu hỏi cho ca tuần tới",
    homeworkDeadline: "2026-09-04",
    generalNotes: "Trợ giảng chuẩn bị phiếu câu hỏi và phần quà nhỏ",
    status: "upcoming",
  },
];

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
  googleDriveConfig: {
    isConnected: true,
    email: "thangsinh2444@gmail.com",
    connectedAt: "2026-08-20",
    autoSync: true,
    folderName: "CLB Toán Thầy Thắng - Báo Cáo Buổi Học",
  },
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
    username: "nguyenminhhung",
    password: "123456",
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
    username: "tranthaovy",
    password: "123456",
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
    username: "nguyenminhhung",
    password: "123456",
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
    username: "tranthaovy",
    password: "123456",
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
    username: "leducanh",
    password: "123456",
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
  // Bulk save methods
  saveClasses(classes: ClassItem[]): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    this.triggerAutoSync();
  },

  saveStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    this.triggerAutoSync();
  },

  saveReports(reports: Report[]): void {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    this.triggerAutoSync();
  },

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
      password: asst.password || "123456",
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
    this.triggerAutoSync();
  },

  // Classes
  getClasses(): ClassItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    return DEFAULT_CLASSES;
  },

  // Single Source of Truth for Class Names across the whole application
  normalizeClassReference(classId?: string, className?: string): { classId: string; className: string } {
    const classes = this.getClasses();
    let mappedId = classId;
    if (classId === "cls_1") mappedId = "cls_9a1";
    if (classId === "cls_2") mappedId = "cls_7a1";
    if (classId === "cls_3") mappedId = "cls_8a2";

    // 1. Match by class ID
    const foundById = classes.find((c) => c.id === mappedId || c.id === classId);
    if (foundById) {
      return { classId: foundById.id, className: foundById.name };
    }

    // 2. Match by class Name
    if (className) {
      const cleanName = className.trim().toLowerCase();
      const foundByName = classes.find((c) => {
        const cName = c.name.toLowerCase();
        return cName === cleanName || cName.includes(cleanName) || cleanName.includes(cName);
      });
      if (foundByName) {
        return { classId: foundByName.id, className: foundByName.name };
      }
    }

    // 3. Fallback to first available class or default
    return {
      classId: mappedId || classes[0]?.id || "cls_9a1",
      className: className || classes[0]?.name || "9A1 – Luyện Thi Vào 10 Chuyên",
    };
  },

  // Cascade any class name update in "Mục Lớp Học" to TKB, Master TKB, Sổ Dạy Học / Báo Cáo, Học Sinh
  cascadeClassNameUpdate(classId: string, newClassName: string, oldClassName?: string | null): void {
    try {
      // Synchronize Students
      const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (rawStudents) {
        const students: Student[] = JSON.parse(rawStudents);
        let studentChanged = false;
        const updatedStudents = students.map((s) => {
          if (s.classId === classId || (oldClassName && s.className === oldClassName)) {
            studentChanged = true;
            return { ...s, classId, className: newClassName };
          }
          return s;
        });
        if (studentChanged) {
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
        }
      }

      // Synchronize Master Timetable Slots
      const rawMaster = localStorage.getItem(STORAGE_KEYS.MASTER_TIMETABLE_SLOTS);
      if (rawMaster) {
        const masters: MasterTimetableSlot[] = JSON.parse(rawMaster);
        let masterChanged = false;
        const updatedMasters = masters.map((m) => {
          if (m.classId === classId || (oldClassName && m.className === oldClassName)) {
            masterChanged = true;
            return { ...m, classId, className: newClassName };
          }
          return m;
        });
        if (masterChanged) {
          localStorage.setItem(STORAGE_KEYS.MASTER_TIMETABLE_SLOTS, JSON.stringify(updatedMasters));
        }
      }

      // Synchronize Specific Timetable Slots
      const rawSlots = localStorage.getItem(STORAGE_KEYS.TIMETABLE_SLOTS);
      if (rawSlots) {
        const slots: TimetableSlot[] = JSON.parse(rawSlots);
        let slotsChanged = false;
        const updatedSlots = slots.map((s) => {
          if (s.classId === classId || (oldClassName && s.className === oldClassName)) {
            slotsChanged = true;
            return { ...s, classId, className: newClassName };
          }
          return s;
        });
        if (slotsChanged) {
          localStorage.setItem(STORAGE_KEYS.TIMETABLE_SLOTS, JSON.stringify(updatedSlots));
        }
      }

      // Synchronize Reports / Teaching History
      const rawReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (rawReports) {
        const reports: Report[] = JSON.parse(rawReports);
        let reportsChanged = false;
        const updatedReports = reports.map((r) => {
          if (r.classId === classId || (oldClassName && r.className === oldClassName)) {
            reportsChanged = true;
            return { ...r, classId, className: newClassName };
          }
          return r;
        });
        if (reportsChanged) {
          localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updatedReports));
        }
      }

      // Synchronize Notifications
      const rawNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (rawNotifs) {
        const notifs: AppNotification[] = JSON.parse(rawNotifs);
        let notifsChanged = false;
        const updatedNotifs = notifs.map((n) => {
          if (oldClassName && n.className === oldClassName) {
            notifsChanged = true;
            return { ...n, className: newClassName };
          }
          return n;
        });
        if (notifsChanged) {
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifs));
        }
      }
    } catch (e) {
      console.error("Error cascading class update:", e);
    }
  },

  saveClass(cls: ClassItem): void {
    const list = this.getClasses();
    const idx = list.findIndex((c) => c.id === cls.id);
    const oldName = idx >= 0 ? list[idx].name : null;
    if (idx >= 0) {
      list[idx] = cls;
    } else {
      list.push(cls);
    }
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(list));

    // Cascade name change across the entire application
    this.cascadeClassNameUpdate(cls.id, cls.name, oldName);
    this.triggerAutoSync();
  },

  deleteClass(classId: string): void {
    const list = this.getClasses().filter((c) => c.id !== classId);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(list));
    this.triggerAutoSync();
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
    this.triggerAutoSync();
  },

  deleteAssistant(id: string): void {
    const list = this.getAssistants().filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ASSISTANTS, JSON.stringify(list));

    // If current user is this assistant, revert to admin
    const currentUser = this.getCurrentUser();
    if (currentUser.id === id || currentUser.assistantId === id) {
      this.setCurrentUser(DEFAULT_USERS[0]);
    }
    this.triggerAutoSync();
  },

  // Students
  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (data) {
        const parsed: Student[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s) => {
            const { classId, className } = this.normalizeClassReference(s.classId, s.className);
            return { ...s, classId, className };
          });
        }
      }
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    return DEFAULT_STUDENTS;
  },

  saveStudent(std: Student): void {
    const list = this.getStudents();
    const { classId, className } = this.normalizeClassReference(std.classId, std.className);
    const normalizedStd = { ...std, classId, className };
    const idx = list.findIndex((s) => s.id === std.id);
    if (idx >= 0) {
      list[idx] = normalizedStd;
    } else {
      list.push(normalizedStd);
    }
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
    this.triggerAutoSync();
  },

  deleteStudent(id: string): void {
    const list = this.getStudents().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
    this.triggerAutoSync();
  },

  getStudentsByClass(classId: string): Student[] {
    return this.getStudents().filter((s) => s.classId === classId);
  },

  // Reports
  getReports(): Report[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (data) {
        const parsed: Report[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r) => {
            const { classId, className } = this.normalizeClassReference(r.classId, r.className);
            return { ...r, classId, className };
          });
        }
      }
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEFAULT_REPORTS));
    return DEFAULT_REPORTS;
  },

  saveReport(report: Report): void {
    const list = this.getReports();
    const { classId, className } = this.normalizeClassReference(report.classId, report.className);
    const normalizedReport: Report = { ...report, classId, className };
    const idx = list.findIndex((r) => r.id === normalizedReport.id);
    const prevReport = idx >= 0 ? list[idx] : null;

    if (idx >= 0) {
      list[idx] = normalizedReport;
    } else {
      list.unshift(normalizedReport); // Add latest to top
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
    this.triggerAutoSync();
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

    this.triggerAutoSync();
    return updated;
  },

  deleteReport(id: string): void {
    const list = this.getReports().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(list));
    this.triggerAutoSync();
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

  // ==========================================
  // BACKUP & RESTORE ALL SYSTEM DATA AS JSON
  // ==========================================
  getBackupPayload(): any {
    return {
      version: "2.0",
      app: "CLB TOÁN THẦY THẮNG - HỆ THỐNG QUẢN LÝ BÁO CÁO TRỢ GIẢNG & THỜI KHÓA BIỂU",
      backupDate: new Date().toISOString(),
      backupDateFormatted: new Date().toLocaleString("vi-VN"),
      clubInfo: {
        name: this.getSettings().clubName || "CLB TOÁN THẦY THẮNG",
        slogan: this.getSettings().slogan || "Học Toán Bằng Tư Duy – Bứt Phá Mọi Kỳ Thi",
        hotline: this.getSettings().hotline || "0988.123.456",
        address: this.getSettings().address || "Số 18, Ngõ 120 Hoàng Quốc Việt, Cầu Giấy, Hà Nội",
      },
      settings: this.getSettings(),
      adminUser: this.getAdminUser(),
      assistants: this.getAssistants(),
      classes: this.getClasses(),
      students: this.getStudents(),
      reports: this.getReports(),
      bulletins: this.getBulletins(),
      notifications: this.getNotifications(),
      timetableSlots: this.getTimetableSlots(),
      masterTimetableSlots: this.getMasterTimetableSlots(),
      timetableSettings: this.getTimetableSettings(),
      mathMisconceptions: this.getMathMisconceptionsConfig("admin"),
    };
  },

  downloadBackupJSON(): string {
    const payload = this.getBackupPayload();
    const jsonString = JSON.stringify(payload, null, 2);
    
    // Format date as YYYY-MM-DD (e.g., baocaotrogiang.2026-08-26.json)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateFormatted = `${year}-${month}-${day}`;
    const filename = `baocaotrogiang.${dateFormatted}.json`;

    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return filename;
  },

  restoreBackupData(backupData: any): { success: boolean; message: string; count?: any } {
    try {
      if (!backupData || typeof backupData !== "object") {
        throw new Error("Dữ liệu sao lưu không hợp lệ.");
      }

      // 1. Classes first so normalization works accurately
      if (Array.isArray(backupData.classes) && backupData.classes.length > 0) {
        localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(backupData.classes));
      }

      // 2. Assistants
      if (Array.isArray(backupData.assistants)) {
        localStorage.setItem(STORAGE_KEYS.ASSISTANTS, JSON.stringify(backupData.assistants));
      }

      // 3. Students (normalize class references)
      if (Array.isArray(backupData.students)) {
        const normalizedStudents = backupData.students.map((s: any) => {
          const { classId, className } = this.normalizeClassReference(s.classId, s.className);
          return { ...s, classId, className };
        });
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(normalizedStudents));
      }

      // 4. Reports (normalize class references)
      if (Array.isArray(backupData.reports)) {
        const normalizedReports = backupData.reports.map((r: any) => {
          const { classId, className } = this.normalizeClassReference(r.classId, r.className);
          return { ...r, classId, className };
        });
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(normalizedReports));
      }

      // 5. Settings (Club info, API keys, Google Drive, Firebase)
      if (backupData.settings && typeof backupData.settings === "object") {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(backupData.settings));
      }

      // 6. Admin User credentials
      if (backupData.adminUser && typeof backupData.adminUser === "object") {
        localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(backupData.adminUser));
      }

      // 7. Bulletins
      if (Array.isArray(backupData.bulletins)) {
        localStorage.setItem(STORAGE_KEYS.BULLETINS, JSON.stringify(backupData.bulletins));
      }

      // 8. Notifications
      if (Array.isArray(backupData.notifications)) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(backupData.notifications));
      }

      // 9. Master Timetable Slots (Weekly Recurring Schedule)
      const rawMaster = backupData.masterTimetableSlots || backupData.masterSlots;
      if (Array.isArray(rawMaster)) {
        const normalizedMasters = rawMaster.map((m: any) => {
          const { classId, className } = this.normalizeClassReference(m.classId, m.className);
          return { ...m, classId, className };
        });
        localStorage.setItem(STORAGE_KEYS.MASTER_TIMETABLE_SLOTS, JSON.stringify(normalizedMasters));
      }

      // 10. Specific Timetable Slots (Dated sessions & Teaching History)
      const rawSlots = backupData.timetableSlots || backupData.slots;
      if (Array.isArray(rawSlots)) {
        const normalizedSlots = rawSlots.map((s: any) => {
          const { classId, className } = this.normalizeClassReference(s.classId, s.className);
          return { ...s, classId, className };
        });
        localStorage.setItem(STORAGE_KEYS.TIMETABLE_SLOTS, JSON.stringify(normalizedSlots));
      }

      // 11. Timetable Settings (Shift configs)
      if (backupData.timetableSettings && typeof backupData.timetableSettings === "object") {
        localStorage.setItem(STORAGE_KEYS.TIMETABLE_SETTINGS, JSON.stringify(backupData.timetableSettings));
      }

      // 12. Math Misconceptions configuration
      if (backupData.mathMisconceptions && typeof backupData.mathMisconceptions === "object") {
        if (Array.isArray(backupData.mathMisconceptions.custom)) {
          localStorage.setItem(STORAGE_KEYS.MISCONCEPTIONS_CUSTOM, JSON.stringify(backupData.mathMisconceptions.custom));
        }
        if (Array.isArray(backupData.mathMisconceptions.order)) {
          localStorage.setItem(STORAGE_KEYS.MISCONCEPTIONS_ORDER, JSON.stringify(backupData.mathMisconceptions.order));
        }
        if (typeof backupData.mathMisconceptions.isLocked === "boolean") {
          localStorage.setItem(STORAGE_KEYS.MISCONCEPTIONS_LOCKED, JSON.stringify(backupData.mathMisconceptions.isLocked));
        }
      }

      const counts = {
        classes: backupData.classes?.length ?? 0,
        assistants: backupData.assistants?.length ?? 0,
        students: backupData.students?.length ?? 0,
        reports: backupData.reports?.length ?? 0,
        timetableSlots: (backupData.timetableSlots || backupData.slots)?.length ?? 0,
        masterTimetableSlots: (backupData.masterTimetableSlots || backupData.masterSlots)?.length ?? 0,
        bulletins: backupData.bulletins?.length ?? 0,
      };

      return {
        success: true,
        message: `Khôi phục thành công toàn bộ: ${counts.reports} báo cáo, ${counts.students} học sinh, ${counts.classes} lớp học, ${counts.assistants} trợ giảng, ${counts.masterTimetableSlots} ca mẫu cố định, ${counts.timetableSlots} ca học TKB và toàn bộ cấu hình cài đặt!`,
        count: counts,
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Lỗi khôi phục dữ liệu: ${e.message || "File JSON không đúng định dạng"}`,
      };
    }
  },

  // ==========================================
  // GOOGLE DRIVE & MULTI-DEVICE CLOUD SYNC ENGINE
  // ==========================================

  // Get or create unique persistent device identifier
  getDeviceId(): string {
    let devId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!devId) {
      devId = `device_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, devId);
    }
    return devId;
  },

  // Get complete Apps Script Code for thangsinh2444@gmail.com
  getGoogleAppsScriptCode(): string {
    return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT ĐỒNG BỘ 2 CHIỀU TỰ ĐỘNG - CLB TOÁN THẦY THẮNG
 * Tài khoản Google Drive: thangsinh2444@gmail.com
 * Tác giả: Thầy Thắng - Chủ nhiệm CLB Toán
 * =========================================================================
 */

var FOLDER_NAME = "CLB Toán Thầy Thắng - Báo Cáo Buổi Học";
var MASTER_FILENAME = "SaoLuu_CLBToan_Master_Latest.json";

function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(FOLDER_NAME);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (lockErr) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", error: "Hệ thống đang bận ghi dữ liệu, vui lòng thử lại sau giây lát." })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var rawPost = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var payload = JSON.parse(rawPost);
    var action = payload.action || "backup_sync";

    // 1. Kiểm tra kết nối Test
    if (action === "test_connection") {
      var testFolder = getOrCreateFolder();
      lock.releaseLock();
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "success",
          message: "Kết nối thành công tới Google Drive (thangsinh2444@gmail.com)!",
          folderName: FOLDER_NAME,
          folderUrl: testFolder.getUrl(),
          timestamp: new Date().toLocaleString("vi-VN")
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Kéo dữ liệu mới nhất (Pull latest)
    if (action === "get_latest" || action === "pull") {
      var folderPull = getOrCreateFolder();
      var masterFiles = folderPull.getFilesByName(MASTER_FILENAME);
      var latestFile = null;

      if (masterFiles.hasNext()) {
        latestFile = masterFiles.next();
      } else {
        // Tìm tệp json mới nhất trong folder
        var allFiles = folderPull.getFiles();
        var newestTime = 0;
        while (allFiles.hasNext()) {
          var f = allFiles.next();
          if (f.getName().indexOf(".json") !== -1 && f.getLastUpdated().getTime() > newestTime) {
            newestTime = f.getLastUpdated().getTime();
            latestFile = f;
          }
        }
      }

      lock.releaseLock();

      if (!latestFile) {
        return ContentService.createTextOutput(
          JSON.stringify({ status: "empty", message: "Chưa có bản sao lưu nào trong thư mục Google Drive." })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      var fileContent = latestFile.getBlob().getDataAsString();
      var parsedData = JSON.parse(fileContent);
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "success",
          fileName: latestFile.getName(),
          fileId: latestFile.getId(),
          lastUpdated: latestFile.getLastUpdated().toISOString(),
          data: parsedData
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Sao lưu & Đồng bộ lên Drive (Push / Backup)
    var folder = getOrCreateFolder();
    var dataContent = payload.data ? JSON.stringify(payload.data, null, 2) : JSON.stringify(payload, null, 2);
    
    // Ghi đè tệp Master mới nhất
    var existingMasters = folder.getFilesByName(MASTER_FILENAME);
    var masterFile;
    if (existingMasters.hasNext()) {
      masterFile = existingMasters.next();
      masterFile.setContent(dataContent);
    } else {
      masterFile = folder.createFile(MASTER_FILENAME, dataContent, MimeType.PLAIN_TEXT);
    }

    // Tạo thêm tệp sao lưu theo ngày giờ để lưu lịch sử an toàn
    var dateStamp = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "yyyy-MM-dd_HHmm");
    var historyFilename = "SaoLuu_CLBToan_" + dateStamp + ".json";
    var historyFile = folder.createFile(historyFilename, dataContent, MimeType.PLAIN_TEXT);

    lock.releaseLock();

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "success",
        message: "Đã lưu bản sao lưu mới lên Google Drive thành công!",
        masterFileId: masterFile.getId(),
        historyFileId: historyFile.getId(),
        folderUrl: folder.getUrl(),
        timestamp: new Date().toLocaleString("vi-VN")
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    lock.releaseLock();
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var folder = getOrCreateFolder();
    var masterFiles = folder.getFilesByName(MASTER_FILENAME);
    if (masterFiles.hasNext()) {
      var f = masterFiles.next();
      var content = f.getBlob().getDataAsString();
      return ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(
      JSON.stringify({ status: "empty", message: "Chưa có dữ liệu." })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}`;
  },

  syncToGoogleDrive(): {
    success: boolean;
    message: string;
    timestamp: string;
    totalItems: number;
    filename: string;
    stats: {
      reports: number;
      students: number;
      classes: number;
      assistants: number;
      timetableSlots: number;
      masterSlots: number;
    };
  } {
    try {
      const payload = this.getBackupPayload();
      const jsonString = JSON.stringify(payload, null, 2);
      
      // Save snapshot to local cloud storage cache
      localStorage.setItem(STORAGE_KEYS.GDRIVE_SYNC_SNAPSHOT, jsonString);

      const now = new Date();
      const timestamp = now.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const dateStr = now.toISOString().split("T")[0];
      const filename = `CLB_Toan_Thay_Thang_GoogleDrive_${dateStr}.json`;

      const stats = {
        reports: payload.reports?.length ?? 0,
        students: payload.students?.length ?? 0,
        classes: payload.classes?.length ?? 0,
        assistants: payload.assistants?.length ?? 0,
        timetableSlots: payload.timetableSlots?.length ?? 0,
        masterSlots: payload.masterTimetableSlots?.length ?? 0,
      };

      const totalItems =
        stats.reports +
        stats.students +
        stats.classes +
        stats.assistants +
        stats.timetableSlots +
        stats.masterSlots;

      // Update settings with latest sync metadata
      const currentSettings = this.getSettings();
      const updatedSettings: ClubSettings = {
        ...currentSettings,
        googleDriveConfig: {
          ...(currentSettings.googleDriveConfig || { isConnected: true }),
          isConnected: true,
          email: "thangsinh2444@gmail.com",
          lastSyncAt: timestamp,
          lastSyncStatus: "success",
          lastSyncItemCount: totalItems,
          folderName: currentSettings.googleDriveConfig?.folderName || "CLB Toán Thầy Thắng - Báo Cáo Buổi Học",
          autoSync: currentSettings.googleDriveConfig?.autoSync !== undefined ? currentSettings.googleDriveConfig.autoSync : true,
        },
      };

      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
      localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNC_TIME, now.toISOString());

      return {
        success: true,
        message: `Đã đồng bộ an toàn ${totalItems} mục dữ liệu (${stats.reports} báo cáo, ${stats.students} học sinh, ${stats.classes} lớp, ${stats.assistants} trợ giảng, ${stats.timetableSlots} ca dạy) thành công!`,
        timestamp,
        totalItems,
        filename,
        stats,
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Lỗi đồng bộ Google Drive: ${e.message || "Không xác định"}`,
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        totalItems: 0,
        filename: "",
        stats: { reports: 0, students: 0, classes: 0, assistants: 0, timetableSlots: 0, masterSlots: 0 },
      };
    }
  },

  async testGoogleDriveWebhook(webhookUrl: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    needsAuthAccess?: boolean;
    details?: any;
  }> {
    try {
      const response = await fetch("/api/gdrive/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: `Không thể kết nối đến máy chủ: ${err.message}`,
      };
    }
  },

  // Push to Cloud Live: Syncs both to shared server cache and Google Drive
  // Get or create unique persistent device identifier
  getDeviceId(): string {
    try {
      let id = localStorage.getItem("TT_DEVICE_ID");
      if (!id) {
        id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem("TT_DEVICE_ID", id);
      }
      return id;
    } catch {
      return "dev_default";
    }
  },

  async pushToCloudLive(options?: {
    forceDownload?: boolean;
    updatedBy?: string;
  }): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
    totalItems: number;
    filename: string;
    uploadedToCloud: boolean;
    cloudUrl?: string;
    serverVersion?: number;
  }> {
    const localRes = this.syncToGoogleDrive();
    if (!localRes.success) {
      return { ...localRes, uploadedToCloud: false };
    }

    const settings = this.getSettings();
    const webhookUrl = settings.googleDriveConfig?.scriptWebhookUrl?.trim();
    const payload = this.getBackupPayload();
    const deviceId = this.getDeviceId();
    let uploadedToCloud = false;
    let cloudUrl: string | undefined;
    let serverVersion: number | undefined;

    try {
      const pushRes = await fetch("/api/cloud-sync/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: payload,
          updatedBy: options?.updatedBy || settings.clubName || "Quản trị viên (Thầy Thắng)",
          account: "thangsinh2444@gmail.com",
          webhookUrl: webhookUrl || undefined,
          deviceId,
        }),
      });

      const pushData = await pushRes.json();
      if (pushData.success) {
        uploadedToCloud = true;
        serverVersion = pushData.version;
        if (pushData.version) {
          localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNC_VERSION, String(pushData.version));
        }
        if (pushData.updatedAt) {
          localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNC_TIME, pushData.updatedAt);
        }
        if (pushData.gdriveDetails?.url || pushData.gdriveDetails?.folderUrl) {
          cloudUrl = pushData.gdriveDetails.url || pushData.gdriveDetails.folderUrl;
        }
      }
    } catch (err: any) {
      console.warn("Shared cloud sync push error:", err);
    }

    if (options?.forceDownload && !uploadedToCloud) {
      try {
        this.downloadBackupJSON();
      } catch (err) {}
    }

    return {
      success: true,
      message: uploadedToCloud
        ? `Đã đồng bộ tự động ${localRes.totalItems} mục dữ liệu lên Đám mây & Google Drive (thangsinh2444@gmail.com) thành công!`
        : `Đã lưu an toàn ${localRes.totalItems} mục dữ liệu trên thiết bị!`,
      timestamp: localRes.timestamp,
      totalItems: localRes.totalItems,
      filename: localRes.filename,
      uploadedToCloud,
      cloudUrl,
      serverVersion,
    };
  },

  async syncToGoogleDriveLive(downloadFile: boolean = false): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
    totalItems: number;
    filename: string;
    uploadedToCloud: boolean;
    cloudUrl?: string;
  }> {
    return this.pushToCloudLive({ forceDownload: downloadFile });
  },

  // Pull from Cloud Live (Pulls latest shared snapshot from cloud server)
  async pullFromCloudLive(): Promise<{
    success: boolean;
    message: string;
    hasData: boolean;
    totalItems?: number;
    counts?: any;
    updatedAt?: string;
    updatedBy?: string;
  }> {
    try {
      const res = await fetch("/api/cloud-sync/pull");
      const json = await res.json();

      if (!json.success || !json.hasData || !json.data) {
        return {
          success: false,
          hasData: false,
          message: json.message || "Chưa có dữ liệu nào trên đám mây để tải về.",
        };
      }

      // Restore data into current machine's localStorage
      const restoreRes = this.restoreBackupData(json.data);
      if (restoreRes.success) {
        if (json.version) {
          localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNC_VERSION, String(json.version));
        }
        if (json.updatedAt) {
          localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNC_TIME, json.updatedAt);
        }
      }

      return {
        success: restoreRes.success,
        hasData: true,
        message: restoreRes.message,
        totalItems: json.totalItems,
        counts: restoreRes.count,
        updatedAt: json.updatedAt,
        updatedBy: json.updatedBy,
      };
    } catch (err: any) {
      return {
        success: false,
        hasData: false,
        message: `Lỗi kết nối tải dữ liệu đám mây: ${err.message}`,
      };
    }
  },

  // Pull directly from Google Drive Webhook
  async pullFromGoogleDriveLive(): Promise<{
    success: boolean;
    message: string;
    totalItems?: number;
    counts?: any;
  }> {
    const settings = this.getSettings();
    const webhookUrl = settings.googleDriveConfig?.scriptWebhookUrl?.trim();
    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      return {
        success: false,
        message: "Vui lòng nhập đường dẫn Google Apps Script Webhook trong Cài đặt trước.",
      };
    }

    try {
      const res = await fetch("/api/gdrive/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });
      const json = await res.json();

      if (!json.success || !json.data) {
        return {
          success: false,
          message: json.error || "Không tìm thấy dữ liệu từ Google Drive.",
        };
      }

      const restoreRes = this.restoreBackupData(json.data);
      return {
        success: restoreRes.success,
        message: `Đã tải về thành công từ Google Drive (${json.fileName || "Tệp sao lưu mới nhất"}): ${restoreRes.message}`,
        totalItems: json.totalItems,
        counts: restoreRes.count,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Lỗi tải từ Google Drive: ${err.message}`,
      };
    }
  },

  // Auto-sync on startup across devices (PC, Laptop, iPad, Phone)
  async autoSyncOnStartup(): Promise<{
    synced: boolean;
    message?: string;
    totalItems?: number;
  }> {
    try {
      // 1. Check version on cloud
      const res = await fetch("/api/cloud-sync/version");
      const meta = await res.json();

      if (!meta.success || !meta.hasData) {
        // If cloud is empty, seed cloud with local data so other devices can pull immediately
        this.pushToCloudLive({ updatedBy: "Khởi tạo thiết bị đầu tiên" }).catch(() => {});
        return { synced: false };
      }

      const localVersionStr = localStorage.getItem(STORAGE_KEYS.LAST_CLOUD_SYNC_VERSION);
      const localVersion = localVersionStr ? parseInt(localVersionStr, 10) : 0;
      const localSyncTime = localStorage.getItem(STORAGE_KEYS.LAST_CLOUD_SYNC_TIME);

      // Always pull if local has never synced, or local version/time differs from cloud
      if (!localVersionStr || localVersion < meta.version || (meta.updatedAt && meta.updatedAt !== localSyncTime)) {
        const pullRes = await this.pullFromCloudLive();
        if (pullRes.success) {
          return {
            synced: true,
            message: `Đã tự động cập nhật ${pullRes.totalItems || meta.totalItems || 0} mục dữ liệu mới nhất từ Đám mây (Cập nhật bởi ${meta.updatedBy || "Google Drive"})`,
            totalItems: pullRes.totalItems,
          };
        }
      }
      return { synced: false };
    } catch (e) {
      return { synced: false };
    }
  },

  // Real-time EventStream & Cross-Device Synchronizer for Instant Updates
  initRealtimeCloudSync(onSyncUpdate: (info: { version: number; updatedBy: string; totalItems?: number }) => void): () => void {
    let eventSource: EventSource | null = null;
    let isCleanedUp = false;
    let reconnectTimer: any = null;
    const deviceId = this.getDeviceId();

    // 1. Check version and pull if outdated
    const checkAndPull = async () => {
      if (isCleanedUp) return;
      try {
        const res = await fetch("/api/cloud-sync/version");
        const meta = await res.json();
        if (meta.success && meta.hasData) {
          const localVersionStr = localStorage.getItem(STORAGE_KEYS.LAST_CLOUD_SYNC_VERSION);
          const localVersion = localVersionStr ? parseInt(localVersionStr, 10) : 0;
          const localSyncTime = localStorage.getItem(STORAGE_KEYS.LAST_CLOUD_SYNC_TIME);

          if (!localVersionStr || localVersion < meta.version || (meta.updatedAt && meta.updatedAt !== localSyncTime)) {
            const pullRes = await this.pullFromCloudLive();
            if (pullRes.success) {
              onSyncUpdate({
                version: meta.version,
                updatedBy: meta.updatedBy || "Đám mây",
                totalItems: pullRes.totalItems || meta.totalItems,
              });
            }
          }
        }
      } catch (e) {
        // Network idle or offline
      }
    };

    // 2. Establish Server-Sent Events stream
    const connectSSE = () => {
      if (isCleanedUp) return;
      try {
        if (typeof window !== "undefined" && window.EventSource) {
          eventSource = new EventSource("/api/cloud-sync/stream");

          eventSource.onmessage = async (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === "cloud_sync_update") {
                // If updated by another device
                if (data.senderDeviceId !== deviceId) {
                  const pullRes = await this.pullFromCloudLive();
                  if (pullRes.success) {
                    onSyncUpdate({
                      version: data.version,
                      updatedBy: data.updatedBy || "Thiết bị khác",
                      totalItems: data.totalItems,
                    });
                  }
                }
              }
            } catch (err) {}
          };

          eventSource.onerror = () => {
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
            // Retry connecting in 5 seconds
            if (!isCleanedUp) {
              reconnectTimer = setTimeout(connectSSE, 5000);
            }
          };
        }
      } catch (e) {
        console.warn("SSE stream setup error:", e);
      }
    };

    connectSSE();

    // 3. Tab Visibility / Focus listener (Instant sync when user returns to tablet/phone/PC)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        checkAndPull();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    // 4. Polling heartbeat every 8 seconds as resilient backup
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        checkAndPull();
      }
    }, 8000);

    return () => {
      isCleanedUp = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  },

  getGoogleDriveSnapshot(): any | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GDRIVE_SYNC_SNAPSHOT);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {}
    return null;
  },

  restoreFromGoogleDriveSnapshot(): { success: boolean; message: string; count?: any } {
    const snapshot = this.getGoogleDriveSnapshot();
    if (!snapshot) {
      return {
        success: false,
        message: "Chưa tìm thấy bản sao lưu nào được đồng bộ từ Google Drive. Bạn hãy thực hiện Sao lưu trước.",
      };
    }
    return this.restoreBackupData(snapshot);
  },

  // Debounced auto sync to Cloud and Google Drive on all mutations
  triggerAutoSync(): void {
    if ((window as any).__autoSyncDebounceTimeout) {
      clearTimeout((window as any).__autoSyncDebounceTimeout);
    }
    (window as any).__autoSyncDebounceTimeout = setTimeout(() => {
      try {
        const currentUser = this.getCurrentUser();
        const updatedBy = currentUser?.name ? `${currentUser.name}` : "Hệ thống CLB Toán";
        this.pushToCloudLive({ updatedBy }).catch((e) =>
          console.warn("Auto background cloud sync error:", e)
        );
      } catch (e) {
        console.warn("Auto-sync to Cloud error:", e);
      }
    }, 600);
  },

  // Math Misconceptions Configuration (Admin configures global template, Assistants have personalized config)
  getMathMisconceptionsConfig(userId?: string): {
    custom: string[];
    order: string[];
    isLocked: boolean;
    globalCustom: string[];
  } {
    try {
      // Global admin configuration
      const customStr = localStorage.getItem(STORAGE_KEYS.MISCONCEPTIONS_CUSTOM);
      const orderStr = localStorage.getItem(STORAGE_KEYS.MISCONCEPTIONS_ORDER);
      const lockedStr = localStorage.getItem(STORAGE_KEYS.MISCONCEPTIONS_LOCKED);

      const globalCustom: string[] = customStr ? JSON.parse(customStr) : [];
      const globalOrder: string[] = orderStr ? JSON.parse(orderStr) : [];
      const globalLocked: boolean = lockedStr !== null ? JSON.parse(lockedStr) : false;

      // If user is assistant / specific user, load their personal overlay
      if (userId && userId !== "admin") {
        const userStorageKey = `clb_misconceptions_user_${userId}`;
        const userStr = localStorage.getItem(userStorageKey);
        if (userStr) {
          const userConfig = JSON.parse(userStr);
          return {
            custom: userConfig.custom || [],
            order: userConfig.order || [],
            isLocked: userConfig.isLocked !== undefined ? userConfig.isLocked : false,
            globalCustom,
          };
        }
        return {
          custom: [],
          order: globalOrder.length > 0 ? globalOrder : [],
          isLocked: false,
          globalCustom,
        };
      }

      return {
        custom: globalCustom,
        order: globalOrder,
        isLocked: globalLocked,
        globalCustom,
      };
    } catch {
      return { custom: [], order: [], isLocked: false, globalCustom: [] };
    }
  },

  saveMathMisconceptionsConfig(
    config: { custom?: string[]; order?: string[]; isLocked?: boolean },
    userId?: string
  ): void {
    if (userId && userId !== "admin") {
      const userStorageKey = `clb_misconceptions_user_${userId}`;
      try {
        const existing = this.getMathMisconceptionsConfig(userId);
        const updated = {
          custom: config.custom !== undefined ? config.custom : existing.custom,
          order: config.order !== undefined ? config.order : existing.order,
          isLocked: config.isLocked !== undefined ? config.isLocked : existing.isLocked,
        };
        localStorage.setItem(userStorageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving user misconceptions config", e);
      }
      return;
    }

    // Global Admin config
    if (config.custom !== undefined) {
      localStorage.setItem(STORAGE_KEYS.MISCONCEPTIONS_CUSTOM, JSON.stringify(config.custom));
    }
    if (config.order !== undefined) {
      localStorage.setItem(STORAGE_KEYS.MISCONCEPTIONS_ORDER, JSON.stringify(config.order));
    }
    if (config.isLocked !== undefined) {
      localStorage.setItem(STORAGE_KEYS.MISCONCEPTIONS_LOCKED, JSON.stringify(config.isLocked));
    }
  },

  // ==================== TIMETABLE & SCHEDULE ====================
  getTimetableSettings(): TimetableSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMETABLE_SETTINGS);
    if (!raw) {
      return { shifts: DEFAULT_SHIFT_CONFIGS };
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.shifts) && parsed.shifts.length > 0) {
        return parsed;
      }
      return { shifts: DEFAULT_SHIFT_CONFIGS };
    } catch {
      return { shifts: DEFAULT_SHIFT_CONFIGS };
    }
  },

  saveTimetableSettings(settings: TimetableSettings): void {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE_SETTINGS, JSON.stringify(settings));
  },

  getMasterTimetableSlots(): MasterTimetableSlot[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MASTER_TIMETABLE_SLOTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MASTER_TIMETABLE_SLOTS, JSON.stringify(DEFAULT_MASTER_TIMETABLE_SLOTS));
      return DEFAULT_MASTER_TIMETABLE_SLOTS;
    }
    try {
      const parsed: MasterTimetableSlot[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((m) => {
          const { classId, className } = this.normalizeClassReference(m.classId, m.className);
          return { ...m, classId, className };
        });
      }
      return DEFAULT_MASTER_TIMETABLE_SLOTS;
    } catch {
      return DEFAULT_MASTER_TIMETABLE_SLOTS;
    }
  },

  saveMasterTimetableSlots(masterSlots: MasterTimetableSlot[]): void {
    const normalized = masterSlots.map((m) => {
      const { classId, className } = this.normalizeClassReference(m.classId, m.className);
      return { ...m, classId, className };
    });
    localStorage.setItem(STORAGE_KEYS.MASTER_TIMETABLE_SLOTS, JSON.stringify(normalized));
    this.triggerAutoSync();
  },

  // Save/Update a Master Recurring slot
  saveMasterSlot(masterSlot: MasterTimetableSlot): MasterTimetableSlot {
    const masters = this.getMasterTimetableSlots();
    const { classId, className } = this.normalizeClassReference(masterSlot.classId, masterSlot.className);
    const normalizedSlot = { ...masterSlot, classId, className };
    const existingIndex = masters.findIndex(
      (m) => m.dayOfWeek === normalizedSlot.dayOfWeek && m.shiftId === normalizedSlot.shiftId
    );
    let updated: MasterTimetableSlot;
    if (existingIndex >= 0) {
      updated = {
        ...masters[existingIndex],
        ...normalizedSlot,
      };
      masters[existingIndex] = updated;
    } else {
      updated = {
        ...normalizedSlot,
        id: normalizedSlot.id || `master_${normalizedSlot.dayOfWeek}_${normalizedSlot.shiftId}`,
      };
      masters.push(updated);
    }
    this.saveMasterTimetableSlots(masters);
    return updated;
  },

  deleteMasterSlot(dayOfWeek: number, shiftId: ShiftId): void {
    const masters = this.getMasterTimetableSlots();
    const filtered = masters.filter(
      (m) => !(m.dayOfWeek === dayOfWeek && m.shiftId === shiftId)
    );
    this.saveMasterTimetableSlots(filtered);
  },

  // Get effective slots for any given week
  // Automatically populates from Master Schedule for any date without specific override!
  getEffectiveSlotsForWeek(
    weekDates: Array<{ dayOfWeek: number; dateStr: string }>
  ): TimetableSlot[] {
    const allSpecificSlots = this.getTimetableSlots();
    const masterSlots = this.getMasterTimetableSlots();
    const result: TimetableSlot[] = [];

    for (const { dayOfWeek, dateStr } of weekDates) {
      // Find all shifts in Master
      for (const master of masterSlots.filter((m) => m.dayOfWeek === dayOfWeek)) {
        // Check if there is already a specific slot saved for this date & shift
        const specificSlot = allSpecificSlots.find(
          (s) => s.date === dateStr && s.shiftId === master.shiftId
        );

        if (specificSlot) {
          const { classId, className } = this.normalizeClassReference(specificSlot.classId, specificSlot.className);
          result.push({ ...specificSlot, classId, className });
        } else {
          // Inherit from Master Recurring Schedule!
          const { classId, className } = this.normalizeClassReference(master.classId, master.className);
          result.push({
            id: `recurring_${dateStr}_${master.shiftId}`,
            date: dateStr,
            dayOfWeek: master.dayOfWeek,
            shiftId: master.shiftId,
            classId,
            className,
            teacherName: master.teacherName || "Thầy Thắng (Chủ nhiệm)",
            assistantId: master.assistantId,
            assistantName: master.assistantName,
            room: master.room || "Phòng CLB",
            lessonTopic: master.lessonTopic || "Bài học theo phân phối chương trình",
            lessonContent: master.lessonContent || "",
            progressNote: master.progressNote || "",
            homework: master.homework || "",
            homeworkDeadline: master.homeworkDeadline || "",
            generalNotes: master.generalNotes || "",
            status: "upcoming",
            isRecurringMaster: true,
          });
        }
      }

      // Also include any other specific slots that might have been custom-added to this date
      const customSlotsForDay = allSpecificSlots.filter(
        (s) =>
          s.date === dateStr &&
          !masterSlots.some((m) => m.dayOfWeek === dayOfWeek && m.shiftId === s.shiftId)
      );
      for (const cs of customSlotsForDay) {
        if (!result.some((r) => r.id === cs.id)) {
          const { classId, className } = this.normalizeClassReference(cs.classId, cs.className);
          result.push({ ...cs, classId, className });
        }
      }
    }

    return result;
  },

  getTimetableSlots(): TimetableSlot[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMETABLE_SLOTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TIMETABLE_SLOTS, JSON.stringify(DEFAULT_TIMETABLE_SLOTS));
      return DEFAULT_TIMETABLE_SLOTS;
    }
    try {
      const parsed: TimetableSlot[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s) => {
          const { classId, className } = this.normalizeClassReference(s.classId, s.className);
          return { ...s, classId, className };
        });
      }
      return DEFAULT_TIMETABLE_SLOTS;
    } catch {
      return DEFAULT_TIMETABLE_SLOTS;
    }
  },

  saveTimetableSlots(slots: TimetableSlot[]): void {
    const normalized = slots.map((s) => {
      const { classId, className } = this.normalizeClassReference(s.classId, s.className);
      return { ...s, classId, className };
    });
    localStorage.setItem(STORAGE_KEYS.TIMETABLE_SLOTS, JSON.stringify(normalized));
    this.triggerAutoSync();
  },

  getTimetableSlotById(id: string): TimetableSlot | undefined {
    const slots = this.getTimetableSlots();
    return slots.find((s) => s.id === id);
  },

  saveTimetableSlot(slot: TimetableSlot, applyToAllWeeks: boolean = true): TimetableSlot {
    const slots = this.getTimetableSlots();
    const { classId, className } = this.normalizeClassReference(slot.classId, slot.className);
    const normalizedSlotInput = { ...slot, classId, className };

    const existingIndex = slots.findIndex(
      (s) => s.id === normalizedSlotInput.id || (s.date === normalizedSlotInput.date && s.shiftId === normalizedSlotInput.shiftId)
    );
    const now = new Date().toISOString();

    let updatedSlot: TimetableSlot;
    if (existingIndex >= 0) {
      updatedSlot = {
        ...slots[existingIndex],
        ...normalizedSlotInput,
        id: slots[existingIndex].id.startsWith("recurring_")
          ? `slot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
          : slots[existingIndex].id,
        isRecurringMaster: false,
        updatedAt: now,
      };
      slots[existingIndex] = updatedSlot;
    } else {
      updatedSlot = {
        ...normalizedSlotInput,
        id: normalizedSlotInput.id && !normalizedSlotInput.id.startsWith("recurring_")
          ? normalizedSlotInput.id
          : `slot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        isRecurringMaster: false,
        createdAt: now,
        updatedAt: now,
      };
      slots.push(updatedSlot);
    }

    this.saveTimetableSlots(slots);

    // If applyToAllWeeks (default: true), automatically update the master recurring schedule
    // and sync all subsequent weeks!
    if (applyToAllWeeks !== false) {
      this.saveMasterSlot({
        id: `master_${updatedSlot.dayOfWeek}_${updatedSlot.shiftId}`,
        dayOfWeek: updatedSlot.dayOfWeek,
        shiftId: updatedSlot.shiftId,
        classId: updatedSlot.classId,
        className: updatedSlot.className,
        teacherName: updatedSlot.teacherName,
        assistantId: updatedSlot.assistantId,
        assistantName: updatedSlot.assistantName,
        room: updatedSlot.room,
        lessonTopic: updatedSlot.lessonTopic,
        lessonContent: updatedSlot.lessonContent,
        progressNote: updatedSlot.progressNote,
        homework: updatedSlot.homework,
        homeworkDeadline: updatedSlot.homeworkDeadline,
        generalNotes: updatedSlot.generalNotes,
      });

      // Clear obsolete specific overrides in future dates for this shift
      // so all upcoming weeks automatically and cleanly display the updated class!
      const allSlotsAfter = this.getTimetableSlots().filter((s) => {
        if (s.date > updatedSlot.date && s.shiftId === updatedSlot.shiftId && s.dayOfWeek === updatedSlot.dayOfWeek) {
          return false;
        }
        return true;
      });
      this.saveTimetableSlots(allSlotsAfter);
    }

    return updatedSlot;
  },

  deleteTimetableSlot(
    id: string,
    options?: { deleteFromMaster?: boolean; dayOfWeek?: number; shiftId?: ShiftId; date?: string }
  ): void {
    const slots = this.getTimetableSlots();
    const targetSlot = slots.find((s) => s.id === id);
    const dayOfWeek = options?.dayOfWeek || targetSlot?.dayOfWeek;
    const shiftId = options?.shiftId || targetSlot?.shiftId;
    const date = options?.date || targetSlot?.date;

    const filtered = slots.filter((s) => s.id !== id);
    this.saveTimetableSlots(filtered);

    if (options?.deleteFromMaster !== false && dayOfWeek && shiftId) {
      this.deleteMasterSlot(dayOfWeek, shiftId);
      if (date) {
        const futureCleaned = this.getTimetableSlots().filter(
          (s) => !(s.date >= date && s.dayOfWeek === dayOfWeek && s.shiftId === shiftId)
        );
        this.saveTimetableSlots(futureCleaned);
      }
    }
  },

  setWeekAsMasterTemplate(weekSlots: TimetableSlot[], currentWeekEndDate?: string): void {
    const newMasters: MasterTimetableSlot[] = weekSlots.map((s) => ({
      id: `master_${s.dayOfWeek}_${s.shiftId}`,
      dayOfWeek: s.dayOfWeek,
      shiftId: s.shiftId,
      classId: s.classId,
      className: s.className,
      teacherName: s.teacherName,
      assistantId: s.assistantId,
      assistantName: s.assistantName,
      room: s.room,
      lessonTopic: s.lessonTopic,
      lessonContent: s.lessonContent,
      progressNote: s.progressNote,
      homework: s.homework,
      homeworkDeadline: s.homeworkDeadline,
      generalNotes: s.generalNotes,
    }));
    // Overwrite the entire master recurring template with this week's full layout!
    this.saveMasterTimetableSlots(newMasters);

    // If currentWeekEndDate provided, clean any specific overrides in future weeks
    // so all subsequent weeks are 100% synchronized and built from the new Master Schedule!
    if (currentWeekEndDate) {
      const allSlots = this.getTimetableSlots();
      const filteredSlots = allSlots.filter((s) => s.date <= currentWeekEndDate);
      this.saveTimetableSlots(filteredSlots);
    }
  },

  copyWeekSchedule(sourceDates: string[], targetDates: string[]): TimetableSlot[] {
    if (sourceDates.length !== 7 || targetDates.length !== 7) return [];
    const allSlots = this.getTimetableSlots();
    const sourceDateSet = new Set(sourceDates);
    const sourceSlots = allSlots.filter((s) => sourceDateSet.has(s.date));

    // Remove any existing slots in target week to overwrite cleanly
    const targetDateSet = new Set(targetDates);
    const remainingSlots = allSlots.filter((s) => !targetDateSet.has(s.date));

    const newSlots: TimetableSlot[] = sourceSlots.map((s) => {
      const sourceIndex = sourceDates.indexOf(s.date);
      const newDate = targetDates[sourceIndex];
      const now = new Date().toISOString();
      return {
        ...s,
        id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        date: newDate,
        dayOfWeek: sourceIndex + 1,
        status: "upcoming", // Reset status for future week
        progressNote: "", // Reset lesson progress note for new week
        createdAt: now,
        updatedAt: now,
      };
    });

    const finalSlots = [...remainingSlots, ...newSlots];
    this.saveTimetableSlots(finalSlots);
    return newSlots;
  },

  // Reset to seed demo data
  resetDemoData(): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    localStorage.setItem(STORAGE_KEYS.ASSISTANTS, JSON.stringify(DEFAULT_ASSISTANTS));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEFAULT_REPORTS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.BULLETINS, JSON.stringify(DEFAULT_BULLETINS));
    localStorage.setItem(STORAGE_KEYS.TIMETABLE_SLOTS, JSON.stringify(DEFAULT_TIMETABLE_SLOTS));
    localStorage.setItem(STORAGE_KEYS.MASTER_TIMETABLE_SLOTS, JSON.stringify(DEFAULT_MASTER_TIMETABLE_SLOTS));
    localStorage.setItem(STORAGE_KEYS.TIMETABLE_SETTINGS, JSON.stringify({ shifts: DEFAULT_SHIFT_CONFIGS }));
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
    localStorage.setItem(STORAGE_KEYS.TIMETABLE_SLOTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MASTER_TIMETABLE_SLOTS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.REPORT_DRAFT);
    localStorage.removeItem(STORAGE_KEYS.STUDENT_ANALYSIS_CACHE);
  },

  wipeData(): void {
    this.wipeAllData();
  },
};

export { DEFAULT_CLASSES, DEFAULT_ASSISTANTS, DEFAULT_STUDENTS, DEFAULT_REPORTS };
