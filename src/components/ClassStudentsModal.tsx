import React, { useState } from "react";
import {
  X,
  Plus,
  Users,
  Search,
  UserPlus,
  FileSpreadsheet,
  Trash2,
  Edit,
  ClipboardList,
  Check,
  Phone,
  Calendar,
  Sparkles,
} from "lucide-react";
import { ClassItem, Student, User } from "../types";
import { storageService } from "../services/storage";
import * as XLSX from "xlsx";

interface ClassStudentsModalProps {
  cls: ClassItem;
  currentUser: User;
  onClose: () => void;
  onUpdated: () => void;
}

export const ClassStudentsModal: React.FC<ClassStudentsModalProps> = ({
  cls,
  currentUser,
  onClose,
  onUpdated,
}) => {
  const isAdmin = currentUser.role === "admin";
  const [allStudents, setAllStudents] = useState<Student[]>(() =>
    storageService.getStudentsByClass(cls.id)
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Sub-modal states
  const [isAddSingleOpen, setIsAddSingleOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Single form
  const [formName, setFormName] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formParentName, setFormParentName] = useState("");
  const [formParentPhone, setFormParentPhone] = useState("");
  const [formNote, setFormNote] = useState("");

  // Batch form
  const [batchText, setBatchText] = useState("");
  const [batchFeedback, setBatchFeedback] = useState<string | null>(null);

  const reload = () => {
    setAllStudents(storageService.getStudentsByClass(cls.id));
    onUpdated();
  };

  const handleOpenAddSingle = () => {
    setEditingStudent(null);
    setFormName("");
    setFormDob("");
    setFormParentName("");
    setFormParentPhone("");
    setFormNote("");
    setIsAddSingleOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormDob(student.dob || "");
    setFormParentName(student.parentName || "");
    setFormParentPhone(student.parentPhone || "");
    setFormNote(student.note || "");
    setIsAddSingleOpen(true);
  };

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newStudent: Student = {
      id: editingStudent ? editingStudent.id : `std_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: formName.trim(),
      classId: cls.id,
      className: cls.name,
      dob: formDob || undefined,
      parentName: formParentName.trim() || undefined,
      parentPhone: formParentPhone.trim() || undefined,
      note: formNote.trim() || undefined,
      joinedDate: editingStudent?.joinedDate || new Date().toISOString().slice(0, 10),
    };

    storageService.saveStudent(newStudent);
    reload();
    setIsAddSingleOpen(false);
  };

  const handleDelete = (studentId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?")) {
      storageService.deleteStudent(studentId);
      reload();
    }
  };

  // Quick Batch Paste Handler:
  // Supports:
  // 1. "Nguyễn Văn A"
  // 2. "Nguyễn Văn A - 0988123456"
  // 3. "Nguyễn Văn A - 0988123456 - PH Nguyễn Văn Bố"
  // 4. Tab-separated values (copied from Excel)
  const handleBatchImport = () => {
    if (!batchText.trim()) return;

    const lines = batchText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return;

    let addedCount = 0;
    lines.forEach((line) => {
      // Split by tab or dash or comma
      let name = "";
      let phone = "";
      let parent = "";

      if (line.includes("\t")) {
        const parts = line.split("\t").map((p) => p.trim());
        name = parts[0] || "";
        phone = parts[1] || "";
        parent = parts[2] || "";
      } else if (line.includes("-")) {
        const parts = line.split("-").map((p) => p.trim());
        name = parts[0] || "";
        phone = parts[1] || "";
        parent = parts[2] || "";
      } else if (line.includes(",")) {
        const parts = line.split(",").map((p) => p.trim());
        name = parts[0] || "";
        phone = parts[1] || "";
        parent = parts[2] || "";
      } else {
        name = line;
      }

      // Remove numbers if user pasted e.g. "1. Nguyễn Văn A"
      name = name.replace(/^[0-9]+[.)\s-]+/, "").trim();

      if (name) {
        const newStudent: Student = {
          id: `std_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
          name,
          classId: cls.id,
          className: cls.name,
          parentPhone: phone || undefined,
          parentName: parent || undefined,
          joinedDate: new Date().toISOString().slice(0, 10),
        };
        storageService.saveStudent(newStudent);
        addedCount++;
      }
    });

    setBatchFeedback(`Đã thêm thành công ${addedCount} học sinh vào lớp!`);
    setTimeout(() => {
      setBatchFeedback(null);
      setIsBatchOpen(false);
      setBatchText("");
    }, 1500);

    reload();
  };

  const handleExportExcel = () => {
    const wsData = [
      [`DANH SÁCH HỌC SINH LỚP: ${cls.name}`],
      [`Khối: ${cls.grade}`, `Lịch học: ${cls.schedule}`, `Phòng: ${cls.room}`],
      [`Giáo viên: ${cls.teacherName}`],
      [],
      ["STT", "Họ và tên học sinh", "Ngày sinh", "Tên phụ huynh", "SĐT phụ huynh", "Ghi chú"],
    ];

    allStudents.forEach((s, idx) => {
      wsData.push([
        (idx + 1).toString(),
        s.name,
        s.dob || "-",
        s.parentName || "-",
        s.parentPhone || "-",
        s.note || "-",
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh Sách Học Sinh");
    XLSX.writeFile(wb, `Danh_Sach_Hoc_Sinh_${cls.name.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`);
  };

  const filteredStudents = allStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.parentPhone && s.parentPhone.includes(searchTerm)) ||
      (s.parentName && s.parentName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-6 py-4 flex items-center justify-between border-b-2 border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  Danh Sách Học Sinh – {cls.name}
                </h3>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-500/30 text-amber-300 border border-amber-400/40">
                  {allStudents.length} học sinh
                </span>
              </div>
              <p className="text-xs text-blue-200 font-medium">
                {cls.grade} • Lịch học: {cls.schedule} • GV: {cls.teacherName}
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

        {/* Toolbar */}
        <div className="bg-slate-50 p-4 border-b-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-blue-600 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={handleExportExcel}
              className="btn-3d-secondary text-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBatchOpen(true)}
              className="btn-3d-secondary text-xs"
            >
              <ClipboardList className="w-4 h-4 text-indigo-600" />
              <span>Dán danh sách nhiều HS</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddSingle}
              className="btn-3d-primary text-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Thêm học sinh</span>
            </button>
          </div>
        </div>

        {/* Students Table / List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3 border-2 border-dashed border-slate-200 rounded-3xl">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">Lớp học này hiện chưa có học sinh nào.</p>
              <p className="text-[11px] text-slate-400">
                Bạn có thể bấm "Thêm học sinh" hoặc "Dán danh sách nhiều HS" từ Excel để tạo nhanh.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button onClick={handleOpenAddSingle} className="btn-3d-primary text-xs">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Thêm học sinh ngay</span>
                </button>
                <button onClick={() => setIsBatchOpen(true)} className="btn-3d-secondary text-xs">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                  <span>Dán danh sách hàng loạt</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-extrabold border-b-2 border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 w-12 text-center">STT</th>
                    <th className="p-3">Họ và tên học sinh</th>
                    <th className="p-3">Ngày sinh</th>
                    <th className="p-3">Phụ huynh</th>
                    <th className="p-3">Số điện thoại</th>
                    <th className="p-3">Ghi chú</th>
                    <th className="p-3 w-20 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStudents.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-black text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <span>{student.name}</span>
                      </td>
                      <td className="p-3 text-slate-600">{student.dob || "-"}</td>
                      <td className="p-3 text-slate-700">{student.parentName || "-"}</td>
                      <td className="p-3">
                        {student.parentPhone ? (
                          <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                            {student.parentPhone}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{student.note || "-"}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-500 hover:text-blue-800 transition-colors"
                            title="Sửa học sinh"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors"
                              title="Xóa học sinh khỏi lớp"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t-2 border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Tổng cộng: <strong className="text-blue-950 font-black">{allStudents.length}</strong> học sinh trong lớp
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-3d-secondary text-xs"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Submodal: Single Add/Edit */}
      {isAddSingleOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                {editingStudent ? "Sửa Thông Tin Học Sinh" : "Thêm Học Sinh Vào Lớp"}
              </h3>
              <button
                onClick={() => setIsAddSingleOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="space-y-3.5 pt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Họ và tên học sinh: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Nguyễn Minh Quân"
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày sinh:</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tên phụ huynh:</label>
                  <input
                    type="text"
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    placeholder="VD: Nguyễn Văn Hùng"
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số điện thoại phụ huynh:</label>
                <input
                  type="text"
                  value={formParentPhone}
                  onChange={(e) => setFormParentPhone(e.target.value)}
                  placeholder="VD: 0912.333.444"
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-black text-blue-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mục tiêu / Ghi chú:</label>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  rows={2}
                  placeholder="VD: Mục tiêu thi chuyên KHTN, rèn tính cẩn thận..."
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSingleOpen(false)}
                  className="btn-3d-secondary text-xs"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-3d-primary text-xs">
                  {editingStudent ? "Lưu thay đổi" : "Thêm vào lớp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submodal: Batch Paste */}
      {isBatchOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border-2 border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-900">
                  <ClipboardList className="w-5 h-5" />
                </span>
                <h3 className="font-black text-base text-slate-900">
                  Dán Danh Sách Học Sinh Hàng Loạt
                </h3>
              </div>
              <button onClick={() => setIsBatchOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 space-y-1.5">
              <p className="font-bold text-blue-950">💡 Cách nhập nhanh từ Excel hoặc danh sách văn bản:</p>
              <p>Mỗi học sinh 1 dòng. Bạn có thể dán theo các định dạng sau:</p>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-blue-900 font-medium">
                <li><code>Nguyễn Minh Quân</code></li>
                <li><code>Trần Bảo Ngọc - 0912.333.444</code></li>
                <li><code>Phạm Đức Minh - 0988.777.666 - PH Mẹ Lan</code></li>
                <li>Hoặc copy trực tiếp các cột từ file Excel rồi dán vào đây.</li>
              </ul>
            </div>

            <textarea
              rows={8}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={`Nguyễn Minh Quân - 0912.333.444 - Bố Hùng\nTrần Bảo Ngọc - 0988.111.222\nPhạm Đức Minh\nHoàng Mai Anh - 0977.888.999`}
              className="w-full p-3 rounded-2xl border-2 border-slate-200 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600"
            />

            {batchFeedback && (
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>{batchFeedback}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t-2 border-slate-100">
              <button
                type="button"
                onClick={() => setIsBatchOpen(false)}
                className="btn-3d-secondary text-xs"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleBatchImport}
                disabled={!batchText.trim()}
                className="btn-3d-primary text-xs"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Thêm danh sách vào lớp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
