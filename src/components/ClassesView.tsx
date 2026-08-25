import React, { useState } from "react";
import {
  School,
  Plus,
  Users,
  Clock,
  MapPin,
  GraduationCap,
  Edit,
  Trash2,
  X,
  Check,
  UserPlus,
  ClipboardList,
  ChevronRight,
  BookOpen,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";
import { ClassItem, User } from "../types";
import { storageService } from "../services/storage";
import { ClassStudentsModal } from "./ClassStudentsModal";

interface ClassesViewProps {
  currentUser: User;
  onSelectClass?: (classId: string) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({ currentUser, onSelectClass }) => {
  const isAdmin = currentUser.role === "admin";
  const [classes, setClasses] = useState<ClassItem[]>(() => storageService.getClasses());
  const [students, setStudents] = useState(() => storageService.getStudents());
  const assistants = storageService.getAssistants();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<ClassItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("Khối 9");
  const [teacherName, setTeacherName] = useState("Thầy Thắng");
  const [schedule, setSchedule] = useState("");
  const [room, setRoom] = useState("");
  const [description, setDescription] = useState("");

  const reload = () => {
    setClasses(storageService.getClasses());
    setStudents(storageService.getStudents());
  };

  const handleOpenAdd = () => {
    setEditingClass(null);
    setName("");
    setGrade("Khối 9");
    setTeacherName("Thầy Thắng");
    setSchedule("Thứ 3, Thứ 6 (18:00 – 20:30)");
    setRoom("Phòng 301 - Tầng 3");
    setDescription("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassItem) => {
    setEditingClass(cls);
    setName(cls.name);
    setGrade(cls.grade);
    setTeacherName(cls.teacherName);
    setSchedule(cls.schedule);
    setRoom(cls.room);
    setDescription(cls.description || "");
    setIsModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newClass: ClassItem = {
      id: editingClass ? editingClass.id : `cls_${Date.now()}`,
      name: name.trim(),
      grade,
      teacherName: teacherName.trim(),
      assistantIds: editingClass?.assistantIds || ["asst_1"],
      schedule: schedule.trim(),
      room: room.trim(),
      description: description.trim(),
      active: true,
    };

    storageService.saveClass(newClass);
    reload();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lớp học này? Dữ liệu liên quan có thể bị ảnh hưởng.")) {
      storageService.deleteClass(id);
      reload();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-blue-100 text-blue-900 border border-blue-200">
              <School className="w-6 h-6 text-blue-900" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Quản Lý Danh Sách Lớp Học
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Quản lý các lớp Toán, xem & tạo danh sách học sinh cho từng lớp, nhập danh sách hàng loạt.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="btn-3d-primary text-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Thêm lớp học mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & View Mode Bar */}
      <div className="bg-white rounded-3xl p-4 border-2 border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên lớp, khối lớp, giáo viên, phòng học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 text-xs transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-slate-500 font-medium">
            Hiển thị <strong className="text-blue-900 font-black">
              {classes.filter((c) => {
                if (!searchTerm.trim()) return true;
                const q = searchTerm.toLowerCase();
                return (
                  c.name.toLowerCase().includes(q) ||
                  c.grade.toLowerCase().includes(q) ||
                  c.teacherName.toLowerCase().includes(q) ||
                  c.room?.toLowerCase().includes(q) ||
                  c.schedule?.toLowerCase().includes(q)
                );
              }).length}
            </strong> lớp học
          </div>

          {/* View mode toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-blue-900 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Xem dạng danh sách (List)"
            >
              <List className="w-4 h-4" />
              <span>Danh sách</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-blue-900 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Xem dạng lưới thẻ (Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Lưới thẻ</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER LIST VIEW OR GRID VIEW */}
      {classes.filter((c) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.grade.toLowerCase().includes(q) ||
          c.teacherName.toLowerCase().includes(q) ||
          c.room?.toLowerCase().includes(q) ||
          c.schedule?.toLowerCase().includes(q)
        );
      }).length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border-2 border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <School className="w-7 h-7" />
          </div>
          <h4 className="font-black text-slate-800 text-sm">Không tìm thấy lớp học nào</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm.
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* LIST VIEW TABLE FOR CLASSES */
        <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b-2 border-slate-200 text-slate-700 uppercase font-black text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">STT</th>
                  <th className="py-3.5 px-4">Tên Lớp Học</th>
                  <th className="py-3.5 px-4">Khối Lớp</th>
                  <th className="py-3.5 px-4">Giáo Viên Phụ Trách</th>
                  <th className="py-3.5 px-4">Lịch Học & Phòng</th>
                  <th className="py-3.5 px-4">Trợ Giảng</th>
                  <th className="py-3.5 px-4 text-center">Sĩ Số</th>
                  <th className="py-3.5 px-4 text-center w-52">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {classes
                  .filter((c) => {
                    if (!searchTerm.trim()) return true;
                    const q = searchTerm.toLowerCase();
                    return (
                      c.name.toLowerCase().includes(q) ||
                      c.grade.toLowerCase().includes(q) ||
                      c.teacherName.toLowerCase().includes(q) ||
                      c.room?.toLowerCase().includes(q) ||
                      c.schedule?.toLowerCase().includes(q)
                    );
                  })
                  .map((cls, idx) => {
                    const classStudents = students.filter((s) => s.classId === cls.id);
                    const assignedAssts = assistants.filter((a) => cls.assistantIds?.includes(a.id));

                    return (
                      <tr
                        key={cls.id}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-950 text-amber-400 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                              <School className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-black text-slate-900 text-xs block group-hover:text-blue-900 transition-colors">
                                {cls.name}
                              </span>
                              {cls.description && (
                                <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                                  {cls.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-black text-[10px] uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-1 rounded-md border border-blue-200">
                            {cls.grade}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-800" />
                            <span>{cls.teacherName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="space-y-0.5 text-[11px]">
                            <div className="flex items-center gap-1 font-semibold text-slate-700">
                              <Clock className="w-3 h-3 text-blue-700" />
                              <span>{cls.schedule}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{cls.room}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {assignedAssts.length > 0 ? (
                              assignedAssts.map((a) => (
                                <span
                                  key={a.id}
                                  className="text-[10px] font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200"
                                >
                                  {a.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-300 italic text-[11px]">Chưa phân công</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-black text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 text-xs">
                            <Users className="w-3 h-3" />
                            {classStudents.length}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedClassForStudents(cls)}
                              className="px-2.5 py-1 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                              title={`Xem danh sách học sinh lớp ${cls.name}`}
                            >
                              <Users className="w-3.5 h-3.5 text-amber-400" />
                              <span>DS Học Sinh</span>
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(cls)}
                                  className="p-1.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-800 transition-colors cursor-pointer"
                                  title="Chỉnh sửa lớp"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(cls.id)}
                                  className="p-1.5 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Xóa lớp"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Class Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {classes
            .filter((c) => {
              if (!searchTerm.trim()) return true;
              const q = searchTerm.toLowerCase();
              return (
                c.name.toLowerCase().includes(q) ||
                c.grade.toLowerCase().includes(q) ||
                c.teacherName.toLowerCase().includes(q) ||
                c.room?.toLowerCase().includes(q) ||
                c.schedule?.toLowerCase().includes(q)
              );
            })
            .map((cls) => {
              const classStudents = students.filter((s) => s.classId === cls.id);
              const assignedAssts = assistants.filter((a) => cls.assistantIds?.includes(a.id));

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-3 py-0.5 rounded-full mb-1.5 border border-blue-200">
                          {cls.grade}
                        </span>
                        <h3 className="font-black text-lg text-slate-900 leading-snug">{cls.name}</h3>
                      </div>

                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(cls)}
                              className="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-900 transition-colors"
                              title="Chỉnh sửa lớp"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cls.id)}
                              className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Xóa lớp"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {cls.description && (
                      <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        {cls.description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-700 font-medium">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <Clock className="w-4 h-4 text-blue-800 shrink-0" />
                        <span>{cls.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <MapPin className="w-4 h-4 text-blue-800 shrink-0" />
                        <span>{cls.room}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <GraduationCap className="w-4 h-4 text-blue-800 shrink-0" />
                        <span>GV: <strong className="text-slate-900">{cls.teacherName}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50 border border-blue-100">
                        <Users className="w-4 h-4 text-blue-800 shrink-0" />
                        <span>Sĩ số: <strong className="text-blue-950 font-black">{classStudents.length} học sinh</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Action: Open Student List for this Class */}
                  <div className="pt-3 border-t-2 border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium">Trợ giảng:</span>
                        <span className="font-bold text-slate-800">
                          {assignedAssts.map((a) => a.name).join(", ") || "Chưa phân công"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedClassForStudents(cls)}
                        className="w-full btn-3d-primary text-xs py-2.5 flex items-center justify-center gap-2"
                      >
                        <Users className="w-4 h-4 text-amber-400" />
                        <span>Quản lý danh sách học sinh ({classStudents.length} bạn)</span>
                        <ChevronRight className="w-4 h-4 text-white/70" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Modal Add / Edit Class */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border-2 border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                {editingClass ? "Chỉnh Sửa Lớp Học" : "Thêm Lớp Học Mới"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tên lớp học: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: 9A1 – Luyện Thi Vào 10 Chuyên"
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Khối lớp:</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Khối 6">Khối 6</option>
                    <option value="Khối 7">Khối 7</option>
                    <option value="Khối 8">Khối 8</option>
                    <option value="Khối 9">Khối 9</option>
                    <option value="Khối 10">Khối 10</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giáo viên phụ trách:</label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="VD: Thầy Thắng"
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lịch học trong tuần:</label>
                  <input
                    type="text"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="VD: Thứ 3, Thứ 6 (18:00 - 20:30)"
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phòng học:</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="VD: Phòng 301 - Tầng 3"
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô tả / Mục tiêu lớp:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Mô tả mục tiêu chuyên đề của lớp..."
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600 resize-none"
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
                  {editingClass ? "Lưu thay đổi" : "Tạo lớp học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Students Management Modal */}
      {selectedClassForStudents && (
        <ClassStudentsModal
          cls={selectedClassForStudents}
          currentUser={currentUser}
          onClose={() => setSelectedClassForStudents(null)}
          onUpdated={reload}
        />
      )}
    </div>
  );
};
