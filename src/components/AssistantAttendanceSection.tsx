import React, { useState, useMemo, useEffect } from "react";
import { format, addDays, startOfWeek, subWeeks, addWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, Users, Check, Save, X, UserCheck, Sun, CloudSun, Moon } from "lucide-react";
import { storageService } from "../services/storage";
import { Assistant, AssistantAttendanceRecord, TimetableSettings } from "../types";

// Helper function to extract the last two words of an assistant's name
const getShortName = (fullName: string) => {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) return fullName.trim();
  return parts.slice(-2).join(" ");
};

// Helper function to categorize shift and provide distinct visual theme (100% độ phủ màu ca dạy, các ô điểm danh đồng nhất màu xanh dương ca chiều & chữ trắng)
const getShiftTheme = (shift: { id?: string; name?: string; period?: string }, index: number) => {
  const name = (shift.name || "").toLowerCase();
  const id = (shift.id || "").toLowerCase();
  const period = (shift.period || "").toLowerCase();

  // Shared Blue theme for attendance boxes (giống màu ca chiều, chữ trắng)
  const attendanceBoxStyle = {
    emptyBox: "min-h-[84px] rounded-xl border-2 border-dashed border-blue-700 bg-blue-100 hover:bg-white hover:border-blue-800 transition-all flex flex-col items-center justify-center p-2 text-blue-950 shadow-xs group",
    emptyText: "text-xs sm:text-sm font-black text-blue-950 group-hover:text-blue-900",
    filledBox: "min-h-[84px] rounded-xl p-2 border-2 border-blue-950 bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900 text-white flex flex-col items-center justify-center gap-1.5 shadow-[0_5px_0_0_#172554,0_8px_14px_rgba(23,37,84,0.35)] hover:shadow-[0_3px_0_0_#172554,0_5px_10px_rgba(23,37,84,0.3)] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer",
    statusDot: "bg-cyan-300",
    modalHeader: "bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-950",
    modalButton: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30",
  };

  // 2 Ca Sáng: Nền màu Xanh Lá Cây (100% độ phủ)
  if (period === "morning" || id.includes("morning") || name.includes("sáng") || index < 2) {
    return {
      type: "morning" as const,
      periodLabel: "Ca Sáng",
      icon: Sun,
      headerBg: "bg-emerald-600 text-white border-r-2 border-emerald-700",
      badgeClass: "bg-emerald-900 text-emerald-100 font-black shadow-xs",
      nameColor: "text-white",
      timeColor: "text-emerald-100 font-extrabold",
      rowBg: "bg-emerald-200 hover:bg-emerald-300 transition-colors border-b-2 border-emerald-400",
      cellTd: "p-2 border-r-2 border-emerald-300 cursor-pointer align-middle bg-emerald-200 hover:bg-emerald-300 transition-colors",
      ...attendanceBoxStyle,
    };
  }

  // 2 Ca Chiều: Nền màu Xanh Dương (100% độ phủ)
  if (period === "afternoon" || id.includes("afternoon") || name.includes("chiều") || (index >= 2 && index < 4)) {
    return {
      type: "afternoon" as const,
      periodLabel: "Ca Chiều",
      icon: CloudSun,
      headerBg: "bg-blue-600 text-white border-r-2 border-blue-700",
      badgeClass: "bg-blue-900 text-blue-100 font-black shadow-xs",
      nameColor: "text-white",
      timeColor: "text-blue-100 font-extrabold",
      rowBg: "bg-blue-200 hover:bg-blue-300 transition-colors border-b-2 border-blue-400",
      cellTd: "p-2 border-r-2 border-blue-300 cursor-pointer align-middle bg-blue-200 hover:bg-blue-300 transition-colors",
      ...attendanceBoxStyle,
    };
  }

  // Ca Tối: Nền màu Vàng (100% độ phủ)
  return {
    type: "evening" as const,
    periodLabel: "Ca Tối",
    icon: Moon,
    headerBg: "bg-amber-400 text-slate-950 border-r-2 border-amber-500",
    badgeClass: "bg-amber-600 text-slate-950 font-black shadow-xs",
    nameColor: "text-slate-950",
    timeColor: "text-amber-950 font-black",
    rowBg: "bg-amber-200 hover:bg-amber-300 transition-colors border-b-2 border-amber-400",
    cellTd: "p-2 border-r-2 border-amber-300 cursor-pointer align-middle bg-amber-200 hover:bg-amber-300 transition-colors",
    ...attendanceBoxStyle,
  };
};

export const AssistantAttendanceSection: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dataVersion, setDataVersion] = useState(0);

  // Sync when storage updates
  useEffect(() => {
    const handleUpdate = () => {
      setDataVersion((v) => v + 1);
      setRecords(storageService.getAssistantAttendance());
    };
    window.addEventListener("clb-storage-updated", handleUpdate);
    return () => window.removeEventListener("clb-storage-updated", handleUpdate);
  }, []);
  
  const assistants = useMemo(() => storageService.getAssistants().filter(a => a.active), [dataVersion]);
  const settings = useMemo(() => storageService.getTimetableSettings(), [dataVersion]);
  const shifts = settings.shifts; // Assuming it has 6 shifts

  const [records, setRecords] = useState<AssistantAttendanceRecord[]>(() => storageService.getAssistantAttendance());

  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));
  }, [startOfCurrentWeek]);

  // Modal State
  const [selectedCell, setSelectedCell] = useState<{ dateStr: string; shiftId: string } | null>(null);
  const [selectedAssistants, setSelectedAssistants] = useState<Set<string>>(new Set());

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  const getRecord = (dateStr: string, shiftId: string) => {
    return records.find(r => r.date === dateStr && r.shiftId === shiftId);
  };

  const openCell = (date: Date, shiftId: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existing = getRecord(dateStr, shiftId);
    setSelectedCell({ dateStr, shiftId });
    setSelectedAssistants(new Set(existing ? existing.assistantIds : []));
  };

  const handleToggleAssistant = (id: string) => {
    const newSet = new Set(selectedAssistants);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedAssistants(newSet);
  };

  const handleSaveCell = () => {
    if (!selectedCell) return;
    const newRecords = [...records];
    const index = newRecords.findIndex(r => r.date === selectedCell.dateStr && r.shiftId === selectedCell.shiftId);
    
    if (index >= 0) {
      newRecords[index].assistantIds = Array.from(selectedAssistants);
      newRecords[index].updatedAt = new Date().toISOString();
    } else {
      newRecords.push({
        id: `att_${selectedCell.dateStr}_${selectedCell.shiftId}`,
        date: selectedCell.dateStr,
        shiftId: selectedCell.shiftId,
        assistantIds: Array.from(selectedAssistants),
        updatedAt: new Date().toISOString()
      });
    }
    
    setRecords(newRecords);
    storageService.saveAssistantAttendance(newRecords);
    setSelectedCell(null);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border-2 border-slate-300 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
            <Users className="w-7 h-7 text-blue-600" />
            Điểm Danh Trợ Giảng
          </h2>
          <p className="text-sm font-bold text-slate-600 mt-1">
            Ghi nhận trợ giảng theo ca dạy hàng ngày • Phân màu trực quan theo ca Sáng, Chiều, Tối
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 border-2 border-slate-300 shadow-xs">
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-white rounded-xl transition-all text-slate-700 hover:text-slate-950 font-bold active:scale-95 cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Tuần {format(startOfCurrentWeek, "dd/MM")} - {format(addDays(startOfCurrentWeek, 6), "dd/MM")}
            </span>
            <button
              onClick={nextWeek}
              className="p-2 hover:bg-white rounded-xl transition-all text-slate-700 hover:text-slate-950 font-bold active:scale-95 cursor-pointer"
              title="Tuần kế tiếp"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Color Legend Bar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4 p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl">
        <span className="text-xs font-black text-slate-700 uppercase tracking-wider mr-1">Quy ước màu ca dạy:</span>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs">
          <Sun className="w-3.5 h-3.5 text-white shrink-0" />
          <span>2 Ca Sáng (Xanh lá cây)</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-black shadow-xs">
          <CloudSun className="w-3.5 h-3.5 text-white shrink-0" />
          <span>2 Ca Chiều (Xanh dương)</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-xs">
          <Moon className="w-3.5 h-3.5 text-slate-950 shrink-0" />
          <span>Ca Tối (Màu vàng)</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-700 to-blue-900 text-white border-2 border-blue-950 rounded-xl text-xs font-black shadow-xs sm:ml-auto">
          <UserCheck className="w-3.5 h-3.5 text-white shrink-0" />
          <span>Ô điểm danh: Xanh dương • Tên trợ giảng: Chữ trắng</span>
        </div>
      </div>

      <div className="overflow-x-auto border-2 border-slate-400 rounded-2xl shadow-md">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead className="bg-slate-950 text-white font-black uppercase tracking-wide">
            <tr>
              <th className="p-3.5 w-36 border-r-2 border-slate-800 text-center text-sm sm:text-base font-black">
                Ca dạy
              </th>
              {weekDays.map((day, idx) => (
                <th key={idx} className="p-3.5 border-r-2 border-slate-800 text-center w-40">
                  <div className="text-sm sm:text-base font-black text-white">
                    Thứ {idx === 6 ? "CN" : idx + 2}
                  </div>
                  <div className="text-xs sm:text-sm text-sky-300 font-extrabold mt-0.5">
                    {format(day, "dd/MM")}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-300">
            {shifts.map((shift, sIdx) => {
              const theme = getShiftTheme(shift, sIdx);
              const ShiftIcon = theme.icon;

              return (
                <tr key={shift.id} className={theme.rowBg}>
                  <td className={`p-3 text-center ${theme.headerBg}`}>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase mb-1.5 shadow-xs ${theme.badgeClass}`}>
                      <ShiftIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{theme.periodLabel}</span>
                    </div>
                    <div className={`font-black text-sm sm:text-base ${theme.nameColor}`}>{shift.name}</div>
                    <div className={`text-xs sm:text-[13px] font-black mt-1 ${theme.timeColor}`}>
                      {shift.startTime} - {shift.endTime}
                    </div>
                  </td>
                  {weekDays.map((day, dIdx) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const record = getRecord(dateStr, shift.id);
                    const count = record?.assistantIds.length || 0;
                    
                    const assignedAssistants = (record?.assistantIds || [])
                      .map(id => assistants.find(a => a.id === id))
                      .filter(Boolean) as Assistant[];

                    return (
                      <td 
                        key={`${sIdx}-${dIdx}`} 
                        className={theme.cellTd}
                        onClick={() => openCell(day, shift.id)}
                      >
                        {count > 0 ? (
                          /* Prominent 3D Extruded Block with High Contrast */
                          <div
                            className={theme.filledBox}
                            title="Bấm để chỉnh sửa trợ giảng điểm danh ca này"
                          >
                            {/* Assistant Names: simple white text, last 2 words only, no frame, no dots */}
                            <div className="w-full flex flex-col items-center justify-center gap-1.5 py-1">
                              {assignedAssistants.slice(0, 2).map((asst, i) => (
                                <div
                                  key={asst.id || i}
                                  className="text-xs sm:text-[14px] font-black text-white text-center tracking-tight drop-shadow-xs leading-snug w-full px-1 truncate"
                                  title={asst.name}
                                >
                                  {getShortName(asst.name)}
                                </div>
                              ))}
                              {count > 2 && (
                                <div className="text-[11px] font-bold text-blue-100 text-center tracking-tight">
                                  +{count - 2} khác
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Empty State: Colored dashed box matching shift theme */
                          <div className={theme.emptyBox}>
                            <span className={theme.emptyText}>+ Điểm danh</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Selection */}
      {selectedCell && (() => {
        const activeShiftIndex = shifts.findIndex(s => s.id === selectedCell.shiftId);
        const activeShift = activeShiftIndex >= 0 ? shifts[activeShiftIndex] : undefined;
        const modalTheme = activeShift ? getShiftTheme(activeShift, activeShiftIndex) : undefined;

        return (
          <div className="fixed inset-0 bg-slate-950/70 z-[100] flex flex-col items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border-2 border-slate-300">
              <div className={`${modalTheme?.modalHeader || "bg-gradient-to-r from-blue-700 to-indigo-800"} p-6 flex items-center justify-between text-white`}>
                <div>
                  <h3 className="text-lg sm:text-xl font-black flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-white" />
                    Điểm Danh Trợ Giảng
                  </h3>
                  <p className="text-white/95 text-xs sm:text-sm mt-1.5 font-bold flex items-center gap-2">
                    {modalTheme && (
                      <span className="px-2 py-0.5 rounded-md bg-white/20 font-black text-xs uppercase tracking-wide">
                        {modalTheme.periodLabel}
                      </span>
                    )}
                    <span>{activeShift?.name}</span> • <span>Ngày {selectedCell.dateStr}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
                {assistants.length === 0 ? (
                  <p className="text-center text-slate-600 text-sm font-bold py-6">
                    Chưa có trợ giảng nào hoạt động trong hệ thống.
                  </p>
                ) : (
                  assistants.map(asst => {
                    const isSelected = selectedAssistants.has(asst.id);
                    return (
                      <div 
                        key={asst.id} 
                        onClick={() => handleToggleAssistant(asst.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/80 shadow-xs"
                            : "border-slate-200 bg-white hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {asst.avatar ? (
                            <img
                              src={asst.avatar}
                              alt={asst.name}
                              className="w-11 h-11 rounded-xl object-cover border-2 border-slate-200"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                              <Users className="w-6 h-6 text-slate-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-black text-slate-900 text-sm sm:text-base">{asst.name}</p>
                            <p className="text-xs text-slate-600 font-bold mt-0.5">{asst.phone || "Chưa có SĐT"}</p>
                          </div>
                        </div>
                        <div
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-5 bg-slate-100 border-t-2 border-slate-200 flex gap-3">
                <button
                  onClick={() => setSelectedCell(null)}
                  className="flex-1 py-3.5 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={handleSaveCell}
                  className={`flex-1 py-3.5 ${modalTheme?.modalButton || "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"} text-white font-black rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95`}
                >
                  <Save className="w-5 h-5" />
                  Lưu Điểm Danh
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
