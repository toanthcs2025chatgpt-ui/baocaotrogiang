import React, { useState } from "react";
import {
  Search,
  Plus,
  User,
  Phone,
  Calendar,
  School,
  Edit,
  Trash2,
  Eye,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { Student, ClassItem, User as UserType } from "../types";
import { storageService } from "../services/storage";
import { StudentProfileView } from "./StudentProfileView";

interface StudentsViewProps {
  currentUser: UserType;
  onSelectStudent?: (student: Student) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ currentUser }) => {
  const isAdmin = currentUser.role === "admin";
  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents());
  const classes = storageService.getClasses();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [activeProfileStudent, setActiveProfileStudent] = useState<Student | null>(null);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formName, setFormName] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formParentName, setFormParentName] = useState("");
  const [formParentPhone, setFormParentPhone] = useState("");
  const [formNote, setFormNote] = useState("");

  const reload = () => {
    setStudents(storageService.getStudents());
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormName("");
    setFormClassId(classes[0]?.id || "");
    setFormDob("");
    setFormParentName("");
    setFormParentPhone("");
    setFormNote("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormClassId(student.classId);
    setFormDob(student.dob || "");
    setFormParentName(student.parentName || "");
    setFormParentPhone(student.parentPhone || "");
    setFormNote(student.note || "");
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const currentClass = classes.find((c) => c.id === formClassId);
    const newStudent: Student = {
      id: editingStudent ? editingStudent.id : `std_${Date.now()}`,
      name: formName.trim(),
      classId: formClassId,
      className: currentClass?.name || "",
      dob: formDob,
      parentName: formParentName.trim(),
      parentPhone: formParentPhone.trim(),
      note: formNote.trim(),
      joinedDate: editingStudent?.joinedDate || new Date().toISOString().slice(0, 10),
    };

    storageService.saveStudent(newStudent);
    reload();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa học sinh này khỏi danh sách?")) {
      storageService.deleteStudent(id);
      reload();
    }
  };

  // Filter students
  const filtered = students.filter((s) => {
    if (selectedClassId !== "all" && s.classId !== selectedClassId) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchPhone = s.parentPhone?.toLowerCase().includes(q);
      const matchParent = s.parentName?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchParent) return false;
    }
    return true;
  });

  if (activeProfileStudent) {
    return (
      <StudentProfileView
        student={activeProfileStudent}
        onBack={() => setActiveProfileStudent(null)}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-blue-100 text-blue-800 border border-blue-200">
              <User className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Danh Sách Học Sinh</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Quản lý hồ sơ học sinh, xem lịch sử các buổi học và phân tích tiến độ học tập bằng AI.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-3d-primary text-xs self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Thêm học sinh mới</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-4 border-2 border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, số điện thoại phụ huynh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 text-xs transition-colors"
            />
          </div>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 text-xs transition-colors"
          >
            <option value="all">Tất cả lớp ({students.length} HS)</option>
            {classes.map((c) => {
              const count = students.filter((s) => s.classId === c.id).length;
              return (
                <option key={c.id} value={c.id}>
                  {c.name} ({count} HS)
                </option>
              );
            })}
          </select>
        </div>

        <div className="text-slate-500 font-medium">
          Hiển thị <strong className="text-blue-900 font-black">{filtered.length}</strong> học sinh
        </div>
      </div>

      {/* Students Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((student) => {
          return (
            <div
              key={student.id}
              className="bg-white rounded-3xl p-5 border-2 border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-amber-300 flex items-center justify-center font-black text-base shadow-sm border border-blue-600">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 leading-tight">
                        {student.name}
                      </h3>
                      <span className="inline-block text-[11px] font-bold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-lg border border-blue-200 mt-1">
                        {student.className || "Chưa xếp lớp"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(student)}
                      className="p-2 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-800 transition-colors cursor-pointer"
                      title="Sửa học sinh"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-2 rounded-xl border-2 border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa học sinh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100 font-medium">
                  {student.parentName && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>PH: <strong className="text-slate-800">{student.parentName}</strong></span>
                    </div>
                  )}
                  {student.parentPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-black text-blue-900">{student.parentPhone}</span>
                    </div>
                  )}
                  {student.note && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 line-clamp-2">
                      {student.note}
                    </div>
                  )}
                </div>
              </div>

              {/* View Profile Action */}
              <button
                onClick={() => setActiveProfileStudent(student)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-700 text-blue-900 hover:text-white border-2 border-blue-200 hover:border-blue-800 text-xs font-black transition-all cursor-pointer shadow-xs active:translate-y-0.5"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Xem Hồ Sơ & AI Phân Tích</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Student */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                {editingStudent ? "Chỉnh Sửa Học Sinh" : "Thêm Học Sinh Mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3.5 pt-4 text-xs">
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
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lớp học:</label>
                <select
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-bold transition-colors"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày sinh:</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tên phụ huynh:</label>
                  <input
                    type="text"
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    placeholder="VD: Nguyễn Văn Hùng"
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Số điện thoại phụ huynh:
                </label>
                <input
                  type="text"
                  value={formParentPhone}
                  onChange={(e) => setFormParentPhone(e.target.value)}
                  placeholder="VD: 0988.123.456"
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-black text-blue-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mục tiêu / Ghi chú học sinh:
                </label>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  rows={2}
                  placeholder="VD: Mục tiêu thi Chuyên Sư Phạm..."
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-3d-secondary text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-3d-primary text-xs"
                >
                  {editingStudent ? "Lưu thay đổi" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
