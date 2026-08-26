import React, { useState } from "react";
import {
  GraduationCap,
  Plus,
  Phone,
  Mail,
  Calendar,
  School,
  FileText,
  Edit,
  Trash2,
  X,
  Check,
  KeyRound,
  UserCheck,
  Eye,
  EyeOff,
  Copy,
  Sparkles,
  ShieldCheck,
  LogIn,
  Send,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";
import { Assistant, ClassItem, User } from "../types";
import { storageService } from "../services/storage";
import { AvatarUpload } from "./AvatarUpload";

interface AssistantsViewProps {
  currentUser: User;
  onSwitchUser?: (user: User) => void;
}

export const AssistantsView: React.FC<AssistantsViewProps> = ({
  currentUser,
  onSwitchUser,
}) => {
  const isAdmin = currentUser.role === "admin";
  const [assistants, setAssistants] = useState<Assistant[]>(() => storageService.getAssistants());
  const classes = storageService.getClasses();
  const reports = storageService.getReports();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [avatar, setAvatar] = useState("");
  const [formError, setFormError] = useState("");

  // Toast / Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswordMap, setVisiblePasswordMap] = useState<Record<string, boolean>>({});

  const reload = () => {
    setAssistants(storageService.getAssistants());
  };

  // Helper to generate username from name (lấy luôn tên bỏ dấu của trợ giảng viết liền không dấu)
  const generateUsernameFromName = (fullName: string) => {
    if (!fullName) return "";
    return fullName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase()
      .trim();
  };

  const [isUsernameCustomized, setIsUsernameCustomized] = useState(false);

  const handleOpenAdd = () => {
    setEditingAssistant(null);
    setName("");
    setUsername("");
    setPassword("123456");
    setShowPassword(false);
    setEmail("");
    setPhone("");
    setSelectedClasses([]);
    setNotes("");
    setAvatar("");
    setFormError("");
    setIsUsernameCustomized(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (asst: Assistant) => {
    setEditingAssistant(asst);
    setName(asst.name);
    setUsername(asst.username || generateUsernameFromName(asst.name));
    setPassword(asst.password || "123456");
    setShowPassword(false);
    setEmail(asst.email || "");
    setPhone(asst.phone || "");
    setSelectedClasses(asst.classes || []);
    setNotes(asst.notes || "");
    setAvatar(asst.avatar || "");
    setFormError("");
    setIsUsernameCustomized(true);
    setIsModalOpen(true);
  };

  const handleToggleClass = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingAssistant && !isUsernameCustomized) {
      const autoUser = generateUsernameFromName(val);
      setUsername(autoUser);
    }
  };

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    setUsername(clean);
    setIsUsernameCustomized(true);
  };

  const handleResetUsernameToAuto = () => {
    const autoUser = generateUsernameFromName(name);
    setUsername(autoUser);
    setIsUsernameCustomized(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Vui lòng nhập họ và tên trợ giảng.");
      return;
    }

    const cleanUsername = (username.trim() || generateUsernameFromName(name)).toLowerCase();
    const cleanPassword = password.trim() || "123456";

    // Check duplicate username if adding or changing username
    const existing = assistants.find(
      (a) => a.id !== editingAssistant?.id && a.username?.toLowerCase() === cleanUsername
    );
    if (existing) {
      setFormError(`Tên đăng nhập "${cleanUsername}" đã tồn tại. Vui lòng chọn tên đăng nhập khác.`);
      return;
    }

    const newAsst: Assistant = {
      id: editingAssistant ? editingAssistant.id : `asst_${Date.now()}`,
      name: name.trim(),
      username: cleanUsername,
      password: cleanPassword,
      email: email.trim() || `${cleanUsername}@thaythang.edu.vn`,
      phone: phone.trim(),
      classes: selectedClasses,
      avatar: avatar.trim() || undefined,
      active: true,
      joinedDate: editingAssistant?.joinedDate || new Date().toISOString().slice(0, 10),
      notes: notes.trim(),
    };

    storageService.saveAssistant(newAsst);
    reload();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa trợ giảng này cùng tài khoản đăng nhập?")) {
      storageService.deleteAssistant(id);
      reload();
    }
  };

  const handleCopyAccountInfo = (asst: Assistant) => {
    const assignedClassNames = classes
      .filter((c) => asst.classes?.includes(c.id))
      .map((c) => c.name)
      .join(", ") || "Chưa xếp lớp";

    const finalUsername = asst.username || generateUsernameFromName(asst.name) || asst.id;
    const finalPassword = asst.password || "123456";

    const text = `📋 THÔNG TIN TÀI KHOẢN TRỢ GIẢNG - CLB TOÁN THẦY THẮNG
------------------------------------------------
👤 Họ và tên: ${asst.name}
🔑 Tên đăng nhập: ${finalUsername}
🔒 Mật khẩu mặc định: ${finalPassword}
🏫 Lớp phụ trách: ${assignedClassNames}
🌐 Quyền hạn: Báo cáo buổi học & Xem lịch sử báo cáo của mình
------------------------------------------------
📌 Lưu ý: Trợ giảng đăng nhập tại hệ thống Báo cáo Học vụ CLB và đổi mật khẩu sau lần đầu đăng nhập.`;

    navigator.clipboard.writeText(text);
    setCopiedId(`full_${asst.id}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleTestLogin = (asst: Assistant) => {
    const userToSwitch: User = {
      id: asst.id,
      name: asst.name.startsWith("Trợ giảng") ? asst.name : `Trợ giảng ${asst.name}`,
      email: asst.email,
      role: "assistant",
      username: asst.username,
      password: asst.password,
      phone: asst.phone,
      avatar: asst.avatar,
      assignedClassIds: asst.classes || [],
      assistantId: asst.id,
    };
    storageService.setCurrentUser(userToSwitch);
    if (onSwitchUser) {
      onSwitchUser(userToSwitch);
    } else {
      window.location.reload();
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswordMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200">
              <GraduationCap className="w-6 h-6 text-amber-900" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">Quản Lý Đội Ngũ Trợ Giảng</h2>
                <span className="text-xs font-black bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {assistants.length} Trợ giảng
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Cấp tài khoản (Tên đăng nhập, Mật khẩu), phân công lớp và quản lý phân quyền báo cáo ca học.
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="btn-3d-primary text-xs flex items-center justify-center gap-1.5 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Trợ Giảng & Cấp Tài Khoản</span>
          </button>
        )}
      </div>

      {/* Filter & View Mode Bar */}
      <div className="bg-white rounded-3xl p-4 border-2 border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, tên đăng nhập, số điện thoại trợ giảng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 text-xs transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-slate-500 font-medium">
            Hiển thị <strong className="text-blue-900 font-black">
              {assistants.filter((a) => {
                if (!searchTerm.trim()) return true;
                const q = searchTerm.toLowerCase();
                return (
                  a.name.toLowerCase().includes(q) ||
                  a.username?.toLowerCase().includes(q) ||
                  a.phone?.toLowerCase().includes(q) ||
                  a.email?.toLowerCase().includes(q)
                );
              }).length}
            </strong> trợ giảng
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
      {assistants.filter((a) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.username?.toLowerCase().includes(q) ||
          a.phone?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q)
        );
      }).length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border-2 border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h4 className="font-black text-slate-800 text-sm">Không tìm thấy trợ giảng nào</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm.
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* LIST VIEW TABLE */
        <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b-2 border-slate-200 text-slate-700 uppercase font-black text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">STT</th>
                  <th className="py-3.5 px-4">Trợ Giảng</th>
                  <th className="py-3.5 px-4">Tài Khoản Đăng Nhập</th>
                  <th className="py-3.5 px-4">Mật Khẩu</th>
                  <th className="py-3.5 px-4">Liên Hệ</th>
                  <th className="py-3.5 px-4">Lớp Phụ Trách</th>
                  <th className="py-3.5 px-4 text-center">Số Ca Báo Cáo</th>
                  <th className="py-3.5 px-4 text-center w-52">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {assistants
                  .filter((a) => {
                    if (!searchTerm.trim()) return true;
                    const q = searchTerm.toLowerCase();
                    return (
                      a.name.toLowerCase().includes(q) ||
                      a.username?.toLowerCase().includes(q) ||
                      a.phone?.toLowerCase().includes(q) ||
                      a.email?.toLowerCase().includes(q)
                    );
                  })
                  .map((asst, idx) => {
                    const asstReports = reports.filter(
                      (r) => r.assistantId === asst.id || r.assistantName === asst.name
                    );
                    const assignedClassesList = classes.filter((c) => asst.classes?.includes(c.id));
                    const isPasswordVisible = visiblePasswordMap[asst.id];

                    return (
                      <tr
                        key={asst.id}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        <td className="py-3 px-4 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-amber-400 flex items-center justify-center font-black text-xl shadow-sm shrink-0 overflow-hidden border-2 border-blue-300">
                              {asst.avatar ? (
                                <img
                                  src={asst.avatar}
                                  alt={asst.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                asst.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <span className="font-black text-slate-900 text-sm block group-hover:text-blue-900 transition-colors">
                                {asst.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                  {asst.active ? "Đang hoạt động" : "Tạm nghỉ"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-blue-950 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                              {asst.username || asst.id}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              {isPasswordVisible ? (asst.password || "123456") : "••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(asst.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title={isPasswordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                              {isPasswordVisible ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5 text-[11px]">
                            {asst.phone && (
                              <div className="font-bold text-blue-900">{asst.phone}</div>
                            )}
                            {asst.email && (
                              <div className="text-slate-500 truncate max-w-[150px]">{asst.email}</div>
                            )}
                            {!asst.phone && !asst.email && (
                              <span className="text-slate-300 italic">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {assignedClassesList.length > 0 ? (
                              assignedClassesList.map((c) => (
                                <span
                                  key={c.id}
                                  className="text-[10px] font-extrabold bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md border border-blue-200"
                                >
                                  {c.name.split("–")[0]}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-300 italic text-[11px]">Chưa xếp lớp</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block font-black text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 text-[11px]">
                            {asstReports.length} ca
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleTestLogin(asst)}
                                className="px-2 py-1 rounded-xl bg-blue-50 hover:bg-blue-700 text-blue-900 hover:text-white border border-blue-200 text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                title={`Đăng nhập thử vai trò ${asst.name}`}
                              >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Đăng nhập thử</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopyAccountInfo(asst)}
                              className="p-1.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-800 transition-colors cursor-pointer"
                              title="Sao chép thông tin tài khoản"
                            >
                              {copiedId === `full_${asst.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(asst)}
                                  className="p-1.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-800 transition-colors cursor-pointer"
                                  title="Chỉnh sửa thông tin"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(asst.id)}
                                  className="p-1.5 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Xóa trợ giảng"
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
        /* Grid of Assistants */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {assistants.map((asst) => {
          const asstReports = reports.filter(
            (r) => r.assistantId === asst.id || r.assistantName === asst.name
          );
          const assignedClassesList = classes.filter((c) => asst.classes?.includes(c.id));
          const isPasswordVisible = visiblePasswordMap[asst.id];

          return (
            <div
              key={asst.id}
              className="bg-white rounded-3xl p-5 border-2 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Card Top: Avatar, Name & Action buttons */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-900 to-indigo-950 text-amber-400 flex items-center justify-center font-black text-2xl shadow-md border-2 border-blue-700 overflow-hidden shrink-0">
                      {asst.avatar ? (
                        <img
                          src={asst.avatar}
                          alt={asst.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        asst.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900 leading-tight">{asst.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="inline-block text-xs font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          Trợ giảng Toán
                        </span>
                        <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          {asst.active ? "● Đang hoạt động" : "Tạm nghỉ"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(asst)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-900 transition-colors"
                        title="Chỉnh sửa thông tin & mật khẩu"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(asst.id)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-colors"
                        title="Xóa trợ giảng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ACCOUNT & CREDENTIALS BOX */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-slate-50 border-2 border-blue-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-blue-950 font-black text-xs">
                      <KeyRound className="w-3.5 h-3.5 text-blue-800" />
                      <span>Tài khoản đăng nhập:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyAccountInfo(asst)}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline cursor-pointer"
                      title="Sao chép tài khoản gửi Zalo"
                    >
                      {copiedId === `full_${asst.id}` ? (
                        <span className="text-emerald-700 font-black flex items-center gap-1">
                          <Check className="w-3 h-3" /> Đã sao chép!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Copy className="w-3 h-3" /> Copy gửi Zalo
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Username */}
                    <div className="bg-white p-2 rounded-xl border border-blue-200 flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold">Tên đăng nhập</span>
                      <span className="font-mono font-black text-blue-950 truncate" title={asst.username || asst.id}>
                        {asst.username || asst.id}
                      </span>
                    </div>

                    {/* Password */}
                    <div className="bg-white p-2 rounded-xl border border-blue-200 flex flex-col relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-bold">Mật khẩu</span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(asst.id)}
                          className="text-slate-400 hover:text-blue-800"
                          title={isPasswordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {isPasswordVisible ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <span className="font-mono font-black text-amber-950 truncate">
                        {isPasswordVisible ? asst.password || "123456" : "••••••"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  {asst.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-800">{asst.phone}</span>
                    </div>
                  )}
                  {asst.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate text-slate-600">{asst.email}</span>
                    </div>
                  )}
                  {asst.notes && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                      {asst.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom stats, assigned classes & Quick Test Login Button */}
              <div className="pt-3 border-t-2 border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-500 font-bold">Lịch sử báo cáo đã nộp:</span>
                  <span className="text-blue-900 font-black bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                    {asstReports.length} buổi
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">
                    Lớp phụ trách ({assignedClassesList.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {assignedClassesList.length > 0 ? (
                      assignedClassesList.map((c) => (
                        <span
                          key={c.id}
                          className="text-[10px] font-extrabold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200"
                        >
                          {c.name.split("–")[0]}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Chưa xếp lớp</span>
                    )}
                  </div>
                </div>

                {/* Login as this assistant button for testing */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleTestLogin(asst)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-black text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-200 hover:border-blue-600 cursor-pointer shadow-2xs"
                    title="Chuyển ngay sang vai trò trợ giảng này để kiểm tra quyền hạn"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Đăng nhập thử vai trò {asst.name.split(" ").slice(-1)}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal Add / Edit Assistant with Username and Password */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border-2 border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-900">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {editingAssistant ? "Chỉnh Sửa Trợ Giảng & Tài Khoản" : "Thêm Trợ Giảng & Cấp Tài Khoản"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Trợ giảng dùng tài khoản này để báo cáo buổi học và xem lịch sử của mình.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              {/* Avatar Upload */}
              <AvatarUpload
                value={avatar}
                onChange={setAvatar}
                name={name}
                type="assistant"
                label="Ảnh đại diện trợ giảng:"
              />

              {/* Họ tên */}
              <div>
                <label className="font-black text-slate-700 block mb-1">
                  Họ và tên trợ giảng: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="VD: Nguyễn Minh Hùng"
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  💡 Gõ họ tên đầy đủ, hệ thống sẽ tự động tạo tên đăng nhập bỏ dấu viết liền bên dưới.
                </span>
              </div>

              {/* Tên đăng nhập & Mật khẩu */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border-2 border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-blue-800" />
                    CẤP TÀI KHOẢN ĐĂNG NHẬP
                  </span>
                  {name.trim() && isUsernameCustomized && (
                    <button
                      type="button"
                      onClick={handleResetUsernameToAuto}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer"
                      title="Khôi phục tên đăng nhập tự động theo họ tên"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Khôi phục username tự động</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Username */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">
                        Tên đăng nhập: <span className="text-rose-500">*</span>
                      </label>
                      {!isUsernameCustomized && username && (
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
                          Tự động sinh
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="VD: nguyenminhhung"
                      className="w-full p-2.5 rounded-xl border-2 border-slate-300 bg-white focus:outline-none focus:border-blue-600 font-mono font-black text-blue-950"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Viết liền không dấu (VD: <code>nguyenminhhung</code>)
                    </span>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">
                        Mật khẩu: <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                        Mặc định: 123456
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="VD: 123456"
                        className="w-full p-2.5 pr-9 rounded-xl border-2 border-slate-300 bg-white focus:outline-none focus:border-blue-600 font-mono font-black text-amber-950"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Thiết lập ban đầu <code>123456</code>
                    </span>
                  </div>
                </div>
              </div>

              {/* Email & SĐT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hung.ta@thaythang.edu.vn"
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0988.123.456"
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Phân công các lớp */}
              <div>
                <label className="font-black text-slate-700 block mb-1">
                  Phân công lớp phụ trách:
                </label>
                <div className="space-y-1.5 p-3 rounded-2xl border-2 border-slate-200 bg-slate-50 max-h-36 overflow-y-auto">
                  {classes.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2.5 cursor-pointer text-slate-800 font-medium p-1 hover:bg-slate-100 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(c.id)}
                        onChange={() => handleToggleClass(c.id)}
                        className="rounded text-blue-600 focus:ring-blue-600 w-4 h-4"
                      />
                      <span className="text-xs">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú chuyên môn:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Khoa Toán ĐH Sư Phạm Hà Nội, Giải Nhì HSG Quốc gia..."
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 resize-none font-medium"
                />
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-3d-secondary text-xs"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-3d-primary text-xs">
                  {editingAssistant ? "Lưu thay đổi" : "Tạo trợ giảng & Cấp tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
