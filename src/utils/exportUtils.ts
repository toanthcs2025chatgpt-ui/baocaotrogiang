import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Report, StudentReportItem } from "../types";

export const exportUtils = {
  // Export Single Report to Excel
  exportReportToExcel(report: Report) {
    const wsData: any[][] = [
      ["CLB TOÁN THẦY THẮNG - BÁO CÁO BUỔI HỌC TOÀN DIỆN"],
      ["Ngày:", report.date, "Ca học:", report.shift],
      ["Lớp:", report.className, "Giáo viên:", report.teacherName],
      [
        "Trợ giảng:",
        report.assistantName,
        "Trạng thái:",
        report.status === "approved"
          ? "Đã duyệt"
          : report.status === "submitted"
          ? "Đã gửi"
          : "Bản nháp",
      ],
      ["Nội dung bài học:", report.lessonContent],
      ["BTVN giao:", report.homeworkAssigned || "Không có"],
      ...(report.misconceptionTags?.length || report.misconceptionNotes || report.misconceptionStudents?.length
        ? [
            [
              "Ghi chú riêng lỗi sai:",
              [
                report.misconceptionTags?.length ? `Lỗi phổ biến: ${report.misconceptionTags.join("; ")}` : "",
                report.misconceptionStudents?.length ? `HS lưu ý: ${report.misconceptionStudents.join(", ")}` : "",
                report.misconceptionNotes ? `Chi tiết: ${report.misconceptionNotes}` : "",
              ]
                .filter(Boolean)
                .join(" | "),
            ],
          ]
        : []),
      [],
      ["BÀI NHẬN XÉT CHUNG CẢ LỚP (GỬI ZALO PHỤ HUYNH):"],
      [report.generalFeedback || "Chưa có nhận xét chung."],
      [],
      [
        "STT",
        "Họ và tên",
        "Chuyên cần",
        "BTVN",
        "Điểm BTVN",
        "Mức độ tiếp thu",
        "Thái độ",
        "Ghi chú / Nhận xét",
      ],
    ];

    const attMap: Record<string, string> = {
      present: "Có mặt",
      late: "Đi muộn",
      excused: "Nghỉ có phép",
      unexcused: "Nghỉ không phép",
    };
    const hwMap: Record<string, string> = {
      excellent: "Hoàn thành tốt",
      completed: "Hoàn thành",
      incomplete: "Chưa hoàn thành",
      none: "Không làm",
    };
    const compMap: Record<string, string> = {
      very_good: "Rất tốt",
      good: "Tốt",
      acceptable: "Đạt yêu cầu",
      needs_effort: "Cần cố gắng",
      not_grasping: "Chưa nắm được bài",
    };
    const attitMap: Record<string, string> = {
      very_active: "Rất tích cực",
      active: "Tích cực",
      normal: "Bình thường",
      passive: "Thụ động",
      unfocused: "Chưa tập trung",
    };

    report.students.forEach((s, idx) => {
      wsData.push([
        (idx + 1).toString(),
        s.studentName,
        attMap[s.attendance] || s.attendance,
        hwMap[s.homework] || s.homework,
        s.homeworkScore !== undefined && s.homeworkScore !== null ? s.homeworkScore.toString() : "-",
        compMap[s.comprehension] || s.comprehension,
        attitMap[s.attitude] || s.attitude,
        s.comment || "",
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Báo Cáo Buổi Học");

    const safeName = `Bao_Cao_${report.className.replace(/[^a-zA-Z0-9]/g, "_")}_${report.date}.xlsx`;
    XLSX.writeFile(wb, safeName);
  },

  // Export List of Reports to Excel
  exportReportsListToExcel(reports: Report[]) {
    const rows = reports.map((r, i) => ({
      STT: i + 1,
      "Ngày học": r.date,
      "Lớp học": r.className,
      "Ca học": r.shift,
      "Giáo viên": r.teacherName,
      "Trợ giảng": r.assistantName,
      "Số học sinh": r.students.length,
      "Trạng thái":
        r.status === "approved" ? "Đã duyệt" : r.status === "submitted" ? "Đã gửi" : "Bản nháp",
      "Nội dung": r.lessonContent,
      "Nhận xét chung": r.generalFeedback || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh Sách Báo Cáo");
    XLSX.writeFile(
      wb,
      `Danh_Sach_Bao_Cao_CLB_Toan_Thay_Thang_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  },

  // Export PDF with jsPDF & AutoTable
  exportReportToPDF(report: Report) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Custom Header
    doc.setFillColor(30, 58, 138); // Royal Blue #1e3a8a
    doc.rect(0, 0, 210, 26, "F");

    doc.setTextColor(244, 197, 66); // Gold
    doc.setFontSize(16);
    doc.text("CLB TOAN THAY THANG", 14, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("HE THONG QUAN LY & BAO CAO BUOI HOC", 14, 18);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(`BAO CAO BUOI HOC: ${report.className}`, 14, 34);

    doc.setFontSize(9);
    doc.text(`Ngay: ${report.date} | Ca hoc: ${report.shift}`, 14, 40);
    doc.text(`Giao vien: ${report.teacherName} | Tro giang: ${report.assistantName}`, 14, 46);
    doc.text(
      `Trang thai: ${
        report.status === "approved"
          ? "DA DUYET"
          : report.status === "submitted"
          ? "DA GUI"
          : "BAN NHAP"
      }`,
      14,
      52
    );

    const attMap: Record<string, string> = {
      present: "Co mat",
      late: "Di muon",
      excused: "Nghi co phep",
      unexcused: "Nghi khong phep",
    };
    const hwMap: Record<string, string> = {
      excellent: "HT tot",
      completed: "Hoan thanh",
      incomplete: "Chua xong",
      none: "Khong lam",
    };

    const tableRows = report.students.map((s, idx) => [
      idx + 1,
      s.studentName,
      attMap[s.attendance] || s.attendance,
      hwMap[s.homework] || s.homework,
      s.comment || "-",
    ]);

    autoTable(doc, {
      startY: 56,
      head: [["STT", "Hoc sinh", "Diem danh", "BTVN", "Ghi chu / Nhan xet"]],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 45 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: "auto" },
      },
    });

    const finalY = ((doc as any).lastAutoTable?.finalY ?? 180) + 10;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "CLB Toan Thay Thang - Hoc Toan Bang Tu Duy, But Pha Moi Ky Thi",
      14,
      Math.min(finalY, 280)
    );

    doc.save(`Bao_Cao_${report.className}_${report.date}.pdf`);
  },

  // Format Whole-Class Zalo Parent Message
  formatZaloWholeClassMessage(report: Report): string {
    if (report.generalFeedback) {
      return report.generalFeedback;
    }

    const presentCount = report.students.filter((s) => s.attendance === "present").length;
    const lateStudents = report.students
      .filter((s) => s.attendance === "late")
      .map((s) => s.studentName);
    const absentStudents = report.students
      .filter((s) => s.attendance === "excused" || s.attendance === "unexcused")
      .map((s) => s.studentName);

    let rollCallLine = `📊 Sĩ số tham gia: ${presentCount}/${report.students.length} học sinh có mặt.`;
    if (lateStudents.length > 0) rollCallLine += `\n⏰ Đi muộn: ${lateStudents.join(", ")}`;
    if (absentStudents.length > 0) rollCallLine += `\n❌ Nghỉ học: ${absentStudents.join(", ")}`;

    return `📚 [CLB TOÁN THẦY THẮNG - BÁO CÁO BUỔI HỌC TOÀN DIỆN]
📅 Ngày học: ${report.date} (${report.shift})
🏫 Lớp: ${report.className}
👨‍🏫 Giáo viên: ${report.teacherName} | Trợ giảng: ${report.assistantName}

📖 NỘI DUNG BÀI HỌC:
${report.lessonContent}

${rollCallLine}

🌟 ĐÁNH GIÁ CHUNG VÀ TỔNG KẾT CA DẠY:
Cả lớp hôm nay học tập tập trung, nghiêm túc và tiếp thu tốt các chuyên đề trọng tâm. Đa số các bạn hoàn thành bài tập đầy đủ và tích cực xây dựng bài giảng cùng thầy cô.

📌 BTVN VÀ DẶN DÒ BUỔI TỚI:
${report.homeworkAssigned || "Hoàn thành toàn bộ phiếu bài tập được phát trên lớp."}

Trân trọng gửi quý phụ huynh theo dõi và đồng hành cùng các con!`;
  },

  // Copy formatted report text for individual student
  formatZaloParentMessage(report: Report, studentItem: StudentReportItem): string {
    const attMap: Record<string, string> = {
      present: "Có mặt đúng giờ",
      late: "Đi muộn",
      excused: "Nghỉ có phép",
      unexcused: "Nghỉ không phép",
    };
    const hwMap: Record<string, string> = {
      excellent: "Hoàn thành xuất sắc ⭐",
      completed: "Hoàn thành đầy đủ",
      incomplete: "Chưa hoàn thành hết",
      none: "Chưa làm BTVN",
    };
    const compMap: Record<string, string> = {
      very_good: "Tiếp thu rất tốt, tư duy nhanh 💡",
      good: "Nắm chắc kiến thức trên lớp",
      acceptable: "Đạt yêu cầu cơ bản",
      needs_effort: "Cần luyện tập thêm",
      not_grasping: "Cần trợ giảng kèm thêm",
    };
    const attitMap: Record<string, string> = {
      very_active: "Rất tích cực, hăng hái phát biểu",
      active: "Tích cực, tập trung",
      normal: "Bình thường",
      passive: "Còn thụ động trong giờ",
      unfocused: "Cần tập trung hơn",
    };

    return `📚 [CLB TOÁN THẦY THẮNG - NHẬN XÉT BUỔI HỌC]
📅 Ngày học: ${report.date} (${report.shift})
🏫 Lớp: ${report.className}
👨‍🏫 Giáo viên: ${report.teacherName} | Trợ giảng: ${report.assistantName}
📖 Bài học: ${report.lessonContent}

👤 Học sinh: ${studentItem.studentName}
----------------------------------------
✅ Chuyên cần: ${attMap[studentItem.attendance] || studentItem.attendance}
📝 Bài tập về nhà: ${hwMap[studentItem.homework] || studentItem.homework} ${
      studentItem.homeworkScore ? `(Điểm: ${studentItem.homeworkScore}/10)` : ""
    }
🧠 Mức độ tiếp thu: ${compMap[studentItem.comprehension] || studentItem.comprehension}
⚡ Thái độ học tập: ${attitMap[studentItem.attitude] || studentItem.attitude}

💬 Nhận xét:
"${studentItem.comment || "Con học tập nghiêm túc, hoàn thành tốt nhiệm vụ buổi học."}"

📌 BTVN buổi tới: ${report.homeworkAssigned || "Theo phiếu phát trên lớp"}
Trân trọng gửi quý phụ huynh!`;
  },
};
