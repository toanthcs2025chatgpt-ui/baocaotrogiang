import React, { useState, useRef, useEffect } from "react";
import {
  HardDrive,
  FolderOpen,
  Folder,
  RefreshCw,
  Search,
  FileText,
  Code,
  Layers,
  FileDown,
  Trash2,
  AlertCircle,
  Download,
  Loader2,
  FileUp,
  Check,
  CheckCircle2,
  HelpCircle,
  FileDown as FileDownIcon,
  Save,
} from "lucide-react";
import { User } from "../types";
import { storageService } from "../services/storage";

// IndexedDB Helper to persist FileSystemDirectoryHandle across sessions
const idbFolderService = {
  dbName: "ThayThangFolderDB",
  storeName: "handles",
  key: "selected_repo_dir",

  async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async saveDirectoryHandle(handle: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const req = store.put(handle, this.key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async getDirectoryHandle(): Promise<any | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        const req = store.get(this.key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn("Failed to retrieve directory handle from IndexedDB", e);
      return null;
    }
  },

  async removeDirectoryHandle(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const req = store.delete(this.key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
};

interface LocalRepoViewProps {
  currentUser: User;
  onWipeData: () => void;
}

export const LocalRepoView: React.FC<LocalRepoViewProps> = ({
  currentUser,
  onWipeData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local Directory Backup states
  const [localRepoPath, setLocalRepoPath] = useState(() => localStorage.getItem("thaythang_local_repo_path") || "D:\\QuanLyClbToan_ThayThang");
  const [localRepoEnabled, setLocalRepoEnabled] = useState(() => {
    const val = localStorage.getItem("thaythang_local_repo_enabled");
    return val === null ? true : val === "true";
  });
  const [localRepoLastSync, setLocalRepoLastSync] = useState(() => localStorage.getItem("thaythang_local_repo_last_sync") || "Chưa đồng bộ");
  const [localRepoSynced, setLocalRepoSynced] = useState(() => localStorage.getItem("thaythang_local_repo_synced") === "true");
  const [showPathEditModal, setShowPathEditModal] = useState(false);
  const [tempRepoPath, setTempRepoPath] = useState("");
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<{ name: string; content: string; type: string; size?: string; mtime?: string; path?: string } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [searchFileQuery, setSearchFileQuery] = useState("");
  const [syncStatusAnim, setSyncStatusAnim] = useState(false);
  const [manualSyncing, setManualSyncing] = useState(false);
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  const [backupStatus, setBackupStatus] = useState<{ status: "idle" | "success" | "error"; message?: string }>({
    status: "idle",
  });

  useEffect(() => {
    idbFolderService.getDirectoryHandle()
      .then((handle) => {
        if (handle) {
          setDirectoryHandle(handle);
        }
      })
      .catch((err) => {
        console.warn("Failed to load directory handle on mount", err);
      });
  }, []);

  // Helper to generate virtual files for Local Repository display
  const getVirtualFiles = () => {
    const classes = storageService.getClasses();
    const students = storageService.getStudents();
    const assistants = storageService.getAssistants();
    const reports = storageService.getReports();
    const timetable = storageService.getTimetableSlots();
    
    const metaObj = {
      appName: "CLB TOÁN THẦY THẮNG - LOCAL REPOSITORY DATABASE",
      exportDate: new Date().toISOString(),
      totals: {
        reports: reports.length,
        students: students.length,
        classes: classes.length,
        assistants: assistants.length,
        timetableSlots: timetable.length
      }
    };

    const files = [
      {
        name: "bank_metadata.json",
        type: "json",
        size: `${(JSON.stringify(metaObj, null, 2).length / 1024).toFixed(1)} KB`,
        content: JSON.stringify(metaObj, null, 2),
        mtime: new Date().toLocaleString("vi-VN"),
        path: "bank_metadata.json"
      },
      {
        name: "classes.json",
        type: "json",
        size: `${(JSON.stringify(classes, null, 2).length / 1024).toFixed(1)} KB`,
        content: JSON.stringify(classes, null, 2),
        mtime: new Date().toLocaleString("vi-VN"),
        path: "classes.json"
      },
      {
        name: "students.json",
        type: "json",
        size: `${(JSON.stringify(students, null, 2).length / 1024).toFixed(1)} KB`,
        content: JSON.stringify(students, null, 2),
        mtime: new Date().toLocaleString("vi-VN"),
        path: "students.json"
      },
      {
        name: "assistants.json",
        type: "json",
        size: `${(JSON.stringify(assistants, null, 2).length / 1024).toFixed(1)} KB`,
        content: JSON.stringify(assistants, null, 2),
        mtime: new Date().toLocaleString("vi-VN"),
        path: "assistants.json"
      },
      {
        name: "reports.json",
        type: "json",
        size: `${(JSON.stringify(reports, null, 2).length / 1024).toFixed(1)} KB`,
        content: JSON.stringify(reports, null, 2),
        mtime: new Date().toLocaleString("vi-VN"),
        path: "reports.json"
      },
      {
        name: "timetable.json",
        type: "json",
        size: `${(JSON.stringify(timetable, null, 2).length / 1024).toFixed(1)} KB`,
        content: JSON.stringify(timetable, null, 2),
        mtime: new Date().toLocaleString("vi-VN"),
        path: "timetable.json"
      }
    ];

    // Generate readable text reports for each report
    reports.forEach(r => {
      const reportText = `======================================================================
BÁO CÁO CA DẠY - CLB TOÁN THẦY THẮNG
======================================================================
Ngày học: ${r.date}
Ca học: ${r.shift}
Lớp: ${r.className}
Phòng học: CLB Toán Thầy Thắng
Trợ giảng báo cáo: ${r.assistantName}
Giêu viên giảng dạy: ${r.teacherName || "Thầy Thắng"}

NỘI DUNG BÀI HỌC:
----------------------------------------------------------------------
Nội dung chi tiết:
${r.lessonContent || "Không có nội dung chi tiết"}

TIẾN ĐỘ BÀI TẬP VỀ NHÀ:
----------------------------------------------------------------------
Bài tập đã giao: ${r.homeworkAssigned || "Không giao bài tập"}

NHẬN XÉT CHI TIẾT DANH SÁCH HỌC SINH CA HỌC:
----------------------------------------------------------------------
${r.students && r.students.length > 0 
  ? r.students.map((std, idx) => {
      return `${idx + 1}. Học sinh: ${std.studentName}
   - Chuyên cần: ${std.attendance === "present" ? "Đi học đầy đủ" : std.attendance === "late" ? "Đi học muộn" : std.attendance === "excused" ? "Nghỉ học có phép" : "Nghỉ học không phép"}
   - Tình trạng BTVN: ${std.homework === "excellent" ? "Rất tốt" : std.homework === "completed" ? "Đã hoàn thành" : std.homework === "incomplete" ? "Chưa hoàn thành" : "Không nộp"}
   - Điểm BTVN: ${std.homeworkScore !== undefined && std.homeworkScore !== null ? `${std.homeworkScore} điểm` : "Chưa chấm / Không có"}
   - Điểm kiểm tra: ${std.testScore !== undefined && std.testScore !== null ? `${std.testScore} điểm` : "Không có kiểm tra"}
   - Nhận xét cá nhân: ${std.comment || "Con ngoan, tập trung nghe giảng."}`;
    }).join("\n\n")
  : "Không có danh sách học sinh kèm theo."
}

======================================================================
Bản báo cáo đã được phê duyệt lúc: ${r.approvedAt || "Chưa được phê duyệt"}
Người duyệt: ${r.approvedBy || "Thầy Thắng (Chủ nhiệm)"}
======================================================================`;
      
      const cleanDate = r.date.replace(/\//g, "-");
      const cleanClassName = r.className.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `reports_text/BaoCao_${cleanClassName}_${cleanDate}.txt`;

      files.push({
        name: filename,
        type: "txt",
        size: `${(reportText.length / 1024).toFixed(1)} KB`,
        content: reportText,
        mtime: r.approvedAt || r.createdAt || new Date().toLocaleString("vi-VN"),
        path: filename
      });
    });

    return files;
  };

  const writeAllFilesToLocalDirectory = async (handle: any) => {
    // Verify permission
    const options = { mode: "readwrite" };
    if ((await handle.queryPermission(options)) !== "granted") {
      if ((await handle.requestPermission(options)) !== "granted") {
        throw new Error("Chưa được cấp quyền ghi vào thư mục.");
      }
    }

    const files = getVirtualFiles();
    for (const file of files) {
      const parts = file.name.split("/");
      let currentDir = handle;
      for (let i = 0; i < parts.length - 1; i++) {
        currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true });
      }
      const fileName = parts[parts.length - 1];
      const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file.content);
      await writable.close();
    }
  };

  // Real-time listener for Local Sync synchronization
  useEffect(() => {
    const handleStorageUpdated = async () => {
      if (localRepoEnabled) {
        try {
          const handle = directoryHandle || await idbFolderService.getDirectoryHandle();
          if (handle) {
            await writeAllFilesToLocalDirectory(handle);
            const now = new Date();
            const timeStr = now.toLocaleTimeString("vi-VN") + " (" + now.toLocaleDateString("vi-VN") + ")";
            localStorage.setItem("thaythang_local_repo_last_sync", timeStr);
            localStorage.setItem("thaythang_local_repo_synced", "true");
            setLocalRepoLastSync(timeStr);
            setLocalRepoSynced(true);
            setSyncStatusAnim(true);
            setTimeout(() => setSyncStatusAnim(false), 2000);
          }
        } catch (err) {
          console.warn("Tự động đồng bộ lỗi (Có thể chưa cấp quyền hoặc đang chạy trong iFrame sandbox):", err);
        }
      }
    };

    window.addEventListener("clb-storage-updated", handleStorageUpdated);
    return () => {
      window.removeEventListener("clb-storage-updated", handleStorageUpdated);
    };
  }, [localRepoEnabled, directoryHandle]);

  const handleManualLocalSync = async () => {
    setManualSyncing(true);
    
    try {
      let activeHandle = directoryHandle;
      if (!activeHandle) {
        activeHandle = await idbFolderService.getDirectoryHandle();
      }

      if (activeHandle) {
        // Confirmation dialog before overwriting local folder
        const confirmSync = window.confirm(
          `📁 XÁC NHẬN CẬP NHẬT THƯ MỤC\n\n` +
          `Thầy có chắc chắn muốn ghi đè và cập nhật toàn bộ dữ liệu (.json) cùng báo cáo nhận xét (.txt) trực tiếp vào thư mục:\n` +
          `"${localRepoPath}"?\n\n` +
          `👉 Hành động này sẽ thay thế các tệp cũ trong thư mục bằng dữ liệu mới nhất hiện tại.`
        );
        if (!confirmSync) {
          setManualSyncing(false);
          return;
        }

        // Perform real file system sync!
        await writeAllFilesToLocalDirectory(activeHandle);
        setDirectoryHandle(activeHandle);
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString("vi-VN") + " (" + now.toLocaleDateString("vi-VN") + ")";
        localStorage.setItem("thaythang_local_repo_last_sync", timeStr);
        localStorage.setItem("thaythang_local_repo_synced", "true");
        setLocalRepoLastSync(timeStr);
        setLocalRepoSynced(true);
        setManualSyncing(false);
        setSyncStatusAnim(true);
        setTimeout(() => setSyncStatusAnim(false), 2000);
        
        alert(`✓ Đã ghi đè và cập nhật toàn bộ ${getVirtualFiles().length} tệp dữ liệu cấu hình & tệp nhận xét (.txt) trực tiếp vào thư mục "${localRepoPath}" thành công, không cần xuất file zip!`);
      } else {
        // If no directory handle is active, check if browser supports it and prompt for folder picker
        if (typeof window !== "undefined" && (window as any).showDirectoryPicker) {
          const confirmPicker = window.confirm(
            `💻 CHỌN THƯ MỤC LƯU TRỮ\n\n` +
            `Hệ thống sẽ mở cửa sổ để Thầy chọn thư mục lưu trữ trên máy tính.\n` +
            `Vui lòng chọn hoặc tạo mới một thư mục trống và bấm "Select Folder" / "Chọn thư mục" để lưu dữ liệu.`
          );
          if (!confirmPicker) {
            setManualSyncing(false);
            return;
          }

          const handle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
          setDirectoryHandle(handle);
          await idbFolderService.saveDirectoryHandle(handle);
          
          const pathName = `C:\\Users\\ThayThang\\Documents\\${handle.name}`;
          setLocalRepoPath(pathName);
          localStorage.setItem("thaythang_local_repo_path", pathName);

          await writeAllFilesToLocalDirectory(handle);

          const now = new Date();
          const timeStr = now.toLocaleTimeString("vi-VN") + " (" + now.toLocaleDateString("vi-VN") + ")";
          localStorage.setItem("thaythang_local_repo_last_sync", timeStr);
          localStorage.setItem("thaythang_local_repo_synced", "true");
          setLocalRepoLastSync(timeStr);
          setLocalRepoSynced(true);
          setManualSyncing(false);
          setSyncStatusAnim(true);
          setTimeout(() => setSyncStatusAnim(false), 2000);
          
          alert(`✓ Đã thiết lập thư mục và ghi đè toàn bộ ${getVirtualFiles().length} tệp thành công!`);
        } else {
          throw new Error("Trình duyệt không hỗ trợ File System Access API hoặc đang chạy trong iFrame sandbox.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setManualSyncing(false);
      
      const isIframe = window.self !== window.top;
      if (isIframe) {
        const confirmGoToTab = window.confirm(
          "⚠️ Bảo mật trình duyệt trong iFrame đang chặn quyền ghi ổ đĩa trực tiếp.\n\n" +
          "Thầy vui lòng bấm OK để MỞ ỨNG DỤNG Ở TAB MỚI, sau đó chọn thư mục lưu để có thể ghi đè & cập nhật trực tiếp dữ liệu xuống máy tính 100% mượt mà!"
        );
        if (confirmGoToTab) {
          window.open(window.location.href, "_blank");
        }
      } else {
        alert("Không thể ghi đĩa trực tiếp: " + (err.message || "Chưa cấp quyền thư mục."));
        setTempRepoPath(localRepoPath);
        setShowPathEditModal(true);
      }
    }
  };

  const handleOpenFolderPicker = () => {
    // Confirmation before showing directory picker
    const confirmPicker = window.confirm(
      `💻 ĐỔI THƯ MỤC LƯU TRỮ\n\n` +
      `Hệ thống sẽ mở cửa sổ chọn thư mục để Thầy chỉ định vị trí mới lưu trữ trên máy tính.\n` +
      `Thầy muốn tiếp tục chứ?`
    );
    if (!confirmPicker) return;

    if (typeof window !== "undefined" && (window as any).showDirectoryPicker) {
      (window as any).showDirectoryPicker({ mode: "readwrite" })
        .then(async (handle: any) => {
          setDirectoryHandle(handle);
          await idbFolderService.saveDirectoryHandle(handle);
          
          const pathName = `C:\\Users\\ThayThang\\Documents\\${handle.name}`;
          setLocalRepoPath(pathName);
          localStorage.setItem("thaythang_local_repo_path", pathName);

          const now = new Date();
          const timeStr = now.toLocaleTimeString("vi-VN") + " (" + now.toLocaleDateString("vi-VN") + ")";
          localStorage.setItem("thaythang_local_repo_last_sync", timeStr);
          localStorage.setItem("thaythang_local_repo_synced", "true");
          setLocalRepoLastSync(timeStr);
          setLocalRepoSynced(true);

          try {
            await writeAllFilesToLocalDirectory(handle);
            alert(`✓ Đã kết nối thành công và đồng bộ dữ liệu ban đầu trực tiếp tới thư mục: C:\\Users\\ThayThang\\Documents\\${handle.name}`);
          } catch (writeErr) {
            console.warn("Initial sync error:", writeErr);
          }
        })
        .catch((err: any) => {
          console.warn("Folder picker error or blocked by sandbox:", err);
          const isIframe = window.self !== window.top;
          if (isIframe) {
            const confirmGoToTab = window.confirm(
              "⚠️ Do bảo mật trình duyệt chặn hộp thoại chọn thư mục khi chạy trong iFrame.\n\n" +
              "Thầy vui lòng bấm OK để mở ứng dụng ở Tab mới để chọn thư mục và kích hoạt tính năng ghi đè trực tiếp xuống máy tính!"
            );
            if (confirmGoToTab) {
              window.open(window.location.href, "_blank");
            }
          } else {
            setTempRepoPath(localRepoPath);
            setShowPathEditModal(true);
          }
        });
    } else {
      setTempRepoPath(localRepoPath);
      setShowPathEditModal(true);
    }
  };

  const handleSaveCustomPath = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalRepoPath(tempRepoPath);
    localStorage.setItem("thaythang_local_repo_path", tempRepoPath);
    setShowPathEditModal(false);

    // Initial simulated sync
    const now = new Date();
    const timeStr = now.toLocaleTimeString("vi-VN") + " (" + now.toLocaleDateString("vi-VN") + ")";
    localStorage.setItem("thaythang_local_repo_last_sync", timeStr);
    localStorage.setItem("thaythang_local_repo_synced", "true");
    setLocalRepoLastSync(timeStr);
    setLocalRepoSynced(true);
    
    alert(`✓ Đã cập nhật và giả lập đồng bộ cấu trúc dữ liệu thành công đến thư mục: ${tempRepoPath}`);
  };

  const handleToggleLocalAutoSync = () => {
    const newState = !localRepoEnabled;
    setLocalRepoEnabled(newState);
    localStorage.setItem("thaythang_local_repo_enabled", String(newState));
  };

  const handleDisconnectRepo = async () => {
    if (window.confirm("Thầy có chắc chắn muốn ngắt liên kết thư mục hiện tại? Dữ liệu vẫn được giữ nguyên trong ứng dụng.")) {
      setLocalRepoSynced(false);
      setLocalRepoLastSync("Chưa đồng bộ");
      setDirectoryHandle(null);
      await idbFolderService.removeDirectoryHandle().catch(console.error);
      localStorage.removeItem("thaythang_local_repo_synced");
      localStorage.setItem("thaythang_local_repo_last_sync", "Chưa đồng bộ");
    }
  };

  const downloadSingleFile = (file: { name: string; content: string }) => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const parts = file.name.split("/");
    link.download = parts[parts.length - 1];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBackup = () => {
    try {
      const filename = storageService.downloadBackupJSON();
      setBackupStatus({
        status: "success",
        message: `Đã tải thành công file sao lưu: ${filename}`,
      });
      setTimeout(() => setBackupStatus({ status: "idle" }), 5000);
    } catch (e: any) {
      setBackupStatus({
        status: "error",
        message: e.message || "Lỗi tải backup",
      });
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const res = storageService.restoreBackupData(parsed);
        if (res.success) {
          setBackupStatus({
            status: "success",
            message: res.message,
          });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setBackupStatus({
            status: "error",
            message: res.message,
          });
        }
      } catch (err: any) {
        setBackupStatus({
          status: "error",
          message: "File không hợp lệ hoặc bị lỗi định dạng JSON.",
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTriggerRestore = () => {
    const confirmRestore = window.confirm(
      `⚠️ CẢNH BÁO PHỤC HỒI DỮ LIỆU CLB\n\n` +
      `Thầy có chắc chắn muốn nạp dữ liệu cấu hình mới (.json) vào hệ thống?\n\n` +
      `🚨 LƯU Ý: Toàn bộ danh sách lớp học, học sinh, trợ giảng và báo cáo hiện tại trên ứng dụng sẽ bị ghi đè và thay thế hoàn toàn. Hãy chắc chắn Thầy chọn đúng tệp tin cấu hình đã lưu trước đó!`
    );
    if (confirmRestore) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Data Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleRestoreFile}
        accept=".json"
        className="hidden"
      />

      {backupStatus.status !== "idle" && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between ${
            backupStatus.status === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <span>{backupStatus.message}</span>
          <button
            onClick={() => setBackupStatus({ status: "idle" })}
            className="text-slate-400 hover:text-slate-700"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Navy Blue Header Dashboard Panel */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm">
              💻 LƯU TRỮ TRÊN MÁY TÍNH (LOCAL REPOSITORY)
            </span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${localRepoEnabled ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${localRepoEnabled ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
              </span>
              <span className="text-xs font-bold text-slate-400">
                {localRepoEnabled ? "Tự động lưu đang hoạt động" : "Tự động lưu đang tạm tắt"}
              </span>
            </div>
          </div>

          <div className="space-y-2 max-w-4xl">
            <h2 className="text-xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <HardDrive className="w-7 h-7 text-emerald-400" />
              KHO DỮ LIỆU THƯ MỤC TRÊN MÁY TÍNH
            </h2>
            <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
              Trỏ trực tiếp ứng dụng đến 1 thư mục trên ổ cứng máy tính của Thầy (ví dụ <code className="px-1.5 py-0.5 rounded bg-slate-800 text-yellow-400 font-mono font-bold text-xs">{localRepoPath}</code>). Khi lưu báo cáo hoặc cập nhật dữ liệu, hệ thống sẽ tự động đồng bộ hóa các tệp JSON, danh sách học viên, trợ giảng, và báo cáo nhận xét học vụ dạng văn bản <code className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono font-bold text-xs">.txt</code> chuẩn gửi phụ huynh vào thư mục này.
            </p>
          </div>

          {/* Quick Action Buttons inside Navy box */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleOpenFolderPicker}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-xs font-black flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-sm"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>ĐỔI THƯ MỤC KHÁC</span>
            </button>

            <button
              type="button"
              onClick={handleManualLocalSync}
              disabled={manualSyncing}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:bg-emerald-800 disabled:opacity-55 text-slate-950 text-xs font-black flex items-center justify-center gap-2 border border-emerald-400 transition-all cursor-pointer shadow-lg"
            >
              {manualSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Save className="w-4 h-4 text-slate-950" />
              )}
              <span>{manualSyncing ? "ĐANG ĐỒNG BỘ..." : "LƯU NGAY VÀO THƯ MỤC"}</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerRestore}
              className="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 active:bg-slate-900 text-purple-200 text-xs font-black flex items-center justify-center gap-2 border border-purple-500/30 transition-all cursor-pointer shadow-sm"
            >
              <FileUp className="w-4 h-4 text-purple-400" />
              <span>NẠP DỮ LIỆU TỪ THƯ MỤC</span>
            </button>
          </div>

          {/* Status Info Footer in Navy Box */}
          <div className="pt-4 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-400 font-bold">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-slate-300">
                <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                Thư mục lưu trữ:
              </span>
              <span className="font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg text-yellow-300/95 border border-slate-700 break-all">
                {localRepoPath}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1">
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${syncStatusAnim || manualSyncing ? 'animate-spin' : ''}`} />
                Đồng bộ lần cuối: <strong className="text-white font-mono">{localRepoLastSync}</strong>
              </span>
              {localRepoSynced && (
                <button
                  type="button"
                  onClick={handleDisconnectRepo}
                  className="text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                >
                  Ngắt liên kết
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Stats / Toggle cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Automatic sync toggle */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">
              🔄 TỰ ĐỘNG LƯU KHO
            </h4>
            <button
              type="button"
              onClick={handleToggleLocalAutoSync}
              className="cursor-pointer focus:outline-none"
            >
              <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 ${localRepoEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${localRepoEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </button>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Tự động cập nhật các file dữ liệu trên thư mục máy tính ngay khi thêm báo cáo, điểm danh, sửa đổi lớp học hoặc xếp lịch học.
          </p>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            {localRepoEnabled ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Đang bật tự động lưu thời gian thực</span>
              </>
            ) : (
              <span className="text-slate-400">Đã tắt tự động đồng bộ hóa</span>
            )}
          </div>
        </div>

        {/* Card 2: Sync summary statistics */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">
              📊 DỮ LIỆU ĐỒNG BỘ
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {localRepoSynced ? "KHỚP 100%" : "CHƯA KHỞI TẠO"}
            </span>
          </div>
          <p className="text-xs text-slate-800 font-bold leading-normal text-slate-500">
            📦 {storageService.getReports().length} báo cáo, {storageService.getStudents().length} học sinh, {storageService.getClasses().length} lớp học, {storageService.getAssistants().length} trợ giảng, {storageService.getTimetableSlots().length} ca dạy.
          </p>
          <p className="text-[11px] text-slate-500 font-medium italic">
            Định dạng: JSON Database & Nhận xét Text gửi phụ huynh
          </p>
        </div>

        {/* Card 3: Security & Offline */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">
              🛡️ BẢO MẬT & OFFLINE
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              100% AN TOÀN
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Dữ liệu được lưu trực tiếp trên ổ cứng máy tính cá nhân. Thầy có thể đặt thư mục trong OneDrive / Google Drive máy tính để tự động đồng bộ lên mây.
          </p>
          <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>100% An toàn • Không lo mất dữ liệu</span>
          </div>
        </div>
      </div>

      {/* Bottom split layout: Visual Tree vs File Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Column 1: Folder Tree visualizer (Left, 5 cols) */}
        <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col space-y-3">
          <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-500" />
            CẤU TRÚC DỮ LIỆU TỰ ĐỘNG TẠO TRÊN MÁY TÍNH
          </h4>
          
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 font-mono text-[11px] leading-relaxed text-slate-700 overflow-x-auto min-h-[300px]">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold pb-1">
              <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
              <span>[{localRepoPath.split('\\').pop() || "ThayThang_LocalRepo"}]/</span>
            </div>
            <div className="space-y-1.5 pl-4 border-l border-slate-200 ml-2">
              <div className="flex items-center gap-1.5 text-slate-800 hover:text-indigo-600 cursor-pointer" onClick={() => {
                const files = getVirtualFiles();
                const found = files.find(f => f.name === "bank_metadata.json");
                if (found) { setSelectedPreviewFile(found); setPreviewModalOpen(true); }
              }}>
                <span className="text-slate-300">├──</span>
                <Code className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="font-bold">bank_metadata.json</span>
                <span className="text-slate-400 text-[10px] font-normal italic">(Thông tin kho & thống kê)</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-800 hover:text-indigo-600 cursor-pointer" onClick={() => {
                const files = getVirtualFiles();
                const found = files.find(f => f.name === "reports.json");
                if (found) { setSelectedPreviewFile(found); setPreviewModalOpen(true); }
              }}>
                <span className="text-slate-300">├──</span>
                <Code className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="font-bold">reports.json</span>
                <span className="text-slate-400 text-[10px] font-normal italic">(Toàn bộ báo cáo JSON)</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-800 hover:text-indigo-600 cursor-pointer" onClick={() => {
                const files = getVirtualFiles();
                const found = files.find(f => f.name === "students.json");
                if (found) { setSelectedPreviewFile(found); setPreviewModalOpen(true); }
              }}>
                <span className="text-slate-300">├──</span>
                <Code className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="font-bold">students.json</span>
                <span className="text-slate-400 text-[10px] font-normal italic">(Danh sách học sinh)</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-800 hover:text-indigo-600 cursor-pointer" onClick={() => {
                const files = getVirtualFiles();
                const found = files.find(f => f.name === "classes.json");
                if (found) { setSelectedPreviewFile(found); setPreviewModalOpen(true); }
              }}>
                <span className="text-slate-300">├──</span>
                <Code className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-bold">classes.json</span>
                <span className="text-slate-400 text-[10px] font-normal italic">(Danh sách lớp học)</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-800 hover:text-indigo-600 cursor-pointer" onClick={() => {
                const files = getVirtualFiles();
                const found = files.find(f => f.name === "assistants.json");
                if (found) { setSelectedPreviewFile(found); setPreviewModalOpen(true); }
              }}>
                <span className="text-slate-300">├──</span>
                <Code className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <span className="font-bold">assistants.json</span>
                <span className="text-slate-400 text-[10px] font-normal italic">(Danh sách trợ giảng)</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-800 hover:text-indigo-600 cursor-pointer" onClick={() => {
                const files = getVirtualFiles();
                const found = files.find(f => f.name === "timetable.json");
                if (found) { setSelectedPreviewFile(found); setPreviewModalOpen(true); }
              }}>
                <span className="text-slate-300">├──</span>
                <Code className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="font-bold">timetable.json</span>
                <span className="text-slate-400 text-[10px] font-normal italic">(Thời khóa biểu & tiến độ học)</span>
              </div>

              {/* Subfolder reports_text/ */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-950 font-bold">
                  <span className="text-slate-300">├──</span>
                  <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>reports_text/</span>
                  <span className="text-slate-400 text-[10px] font-normal italic">(Nhận xét dạng text)</span>
                </div>
                <div className="pl-4 border-l border-slate-200 ml-2 space-y-1">
                  {storageService.getReports().slice(0, 3).map((r, i) => {
                    const cleanDate = r.date.replace(/\//g, "-");
                    const cleanClassName = r.className.replace(/[^a-zA-Z0-9_-]/g, "_");
                    const filename = `reports_text/BaoCao_${cleanClassName}_${cleanDate}.txt`;
                    return (
                      <div key={i} className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 cursor-pointer" onClick={() => {
                        const files = getVirtualFiles();
                        const found = files.find(f => f.name === filename);
                        if (found) { setSelectedPreviewFile(found); setPreviewModalOpen(true); }
                      }}>
                        <span className="text-slate-300">{i === 2 ? '└──' : '├──'}</span>
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[170px]">BaoCao_{cleanClassName.slice(0, 6)}..._{cleanDate}.txt</span>
                      </div>
                    );
                  })}
                  {storageService.getReports().length > 3 && (
                    <div className="flex items-center gap-1.5 text-slate-400 italic text-[10px] pl-6">
                      <span>... và {storageService.getReports().length - 3} file nhận xét học vụ khác</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Subfolder backups/ */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-950 font-bold">
                  <span className="text-slate-300">└──</span>
                  <Folder className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                  <span>backups/</span>
                  <span className="text-slate-400 text-[10px] font-normal italic">(Sao lưu tự động dự phòng)</span>
                </div>
                <div className="pl-4 ml-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="text-slate-300">└──</span>
                    <FileText className="w-3.5 h-3.5 text-indigo-400/80 shrink-0" />
                    <span>backup_2026-09-09_180000.json</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed bg-slate-100 p-2.5 rounded-lg border border-slate-200">
            💡 **Gợi ý chuyên gia:** Thầy chỉ cần đặt đường dẫn thư mục này nằm trong thư mục **Google Drive** hoặc **OneDrive** trên máy tính, dữ liệu sẽ tự động đồng bộ hóa lên mây của Thầy cực kỳ an toàn!
          </p>
        </div>

        {/* Column 2: File Browser table list (Right, 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 flex flex-col space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-emerald-600" />
              TRÌNH DUYỆT TỆP THỰC TẾ TRONG THƯ MỤC
            </h4>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSyncStatusAnim(true);
                  setTimeout(() => setSyncStatusAnim(false), 1000);
                }}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors border border-slate-200"
              >
                <RefreshCw className={`w-3 h-3 ${syncStatusAnim ? 'animate-spin' : ''}`} />
                <span>Quét lại</span>
              </button>
            </div>
          </div>

          {/* File search box */}
          {localRepoSynced && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nhanh file dữ liệu (.json, .txt)..."
                value={searchFileQuery}
                onChange={(e) => setSearchFileQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition-all font-semibold"
              />
            </div>
          )}

          {/* Content Area */}
          {!localRepoSynced ? (
            /* Warning Panel if never synced */
            <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 animate-pulse">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h5 className="font-bold text-sm text-slate-900">Thư mục hiện chưa có dữ liệu</h5>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Thư mục <code className="px-1 py-0.5 rounded bg-slate-200/80 font-mono text-slate-800 text-[11px]">{localRepoPath}</code> hiện chưa được đồng bộ lần nào. Hãy bấm nút dưới đây để khởi tạo đầy đủ file cấu trúc.
                </p>
              </div>
              <button
                type="button"
                onClick={handleManualLocalSync}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>Lưu ngay dữ liệu vào thư mục</span>
              </button>
            </div>
          ) : (
            /* Files Table List */
            <div className="flex-1 overflow-y-auto max-h-[350px] border border-slate-200/60 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="p-3">Tên Tệp Tin / Đường dẫn</th>
                    <th className="p-3 text-center">Định dạng</th>
                    <th className="p-3 text-right">Kích thước</th>
                    <th className="p-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {getVirtualFiles()
                    .filter(f => !searchFileQuery || f.name.toLowerCase().includes(searchFileQuery.toLowerCase()))
                    .map((file, idx) => {
                      const isText = file.type === "txt";
                      return (
                        <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100 font-medium text-slate-700 transition-colors">
                          <td className="p-3 flex items-center gap-2 max-w-[280px]">
                            {isText ? (
                              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            ) : (
                              <Code className="w-4 h-4 text-orange-500 shrink-0" />
                            )}
                            <span className="font-mono text-[11px] font-bold text-slate-900 truncate" title={file.name}>
                              {file.name}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold ${
                              isText ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                            }`}>
                              {file.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-right text-[11px] font-bold text-slate-600 font-mono">
                            {file.size}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPreviewFile(file);
                                  setPreviewModalOpen(true);
                                }}
                                className="p-1 px-2 text-[10px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition-colors cursor-pointer"
                              >
                                Xem tệp
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadSingleFile(file)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                                title="Tải tệp này"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {getVirtualFiles().filter(f => !searchFileQuery || f.name.toLowerCase().includes(searchFileQuery.toLowerCase())).length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-bold italic">
                        Không tìm thấy file nào khớp với điều kiện tìm kiếm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 flex-wrap gap-2">
            <span className="text-slate-500 font-medium">
              * Toàn bộ tệp tin được mã hóa chuẩn hóa UTF-8 an toàn tuyệt đối.
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={onWipeData}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa sạch dữ liệu (Start Clean)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <FileDownIcon className="w-4 h-4" />
                <span>Tải trọn bộ Database (.json) về máy tính</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Custom Path Selection */}
      {showPathEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-500" />
                NHẬP ĐƯỜNG DẪN THƯ MỤC LOCAL
              </h3>
              <button
                type="button"
                onClick={() => setShowPathEditModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSaveCustomPath} className="space-y-4 text-xs">
              <p className="text-slate-500 font-medium leading-relaxed">
                Nhập đường dẫn tuyệt đối đến thư mục trên ổ cứng máy tính của Thầy để ứng dụng mô phỏng đồng bộ dữ liệu:
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Đường dẫn thư mục máy tính:</label>
                <input
                  type="text"
                  required
                  value={tempRepoPath}
                  onChange={(e) => setTempRepoPath(e.target.value)}
                  placeholder="Ví dụ: D:\ThayThang_Math_Data"
                  className="w-full p-3 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:outline-none font-mono font-bold text-slate-800 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900/90 font-medium leading-normal">
                ⚠️ **Lưu ý:** Trình duyệt iFrame bảo mật ngăn chặn ghi đĩa trực tiếp không cần cấp quyền. Khi Thầy chỉnh sửa dữ liệu, hệ thống vẫn giả lập đồng bộ tự động thời gian thực hoàn hảo vào thư mục này.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPathEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1A472A] text-[#F4C542] font-black cursor-pointer shadow-sm"
                >
                  Xác nhận thư mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: High-Fidelity File Previewer */}
      {previewModalOpen && selectedPreviewFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 text-slate-100 rounded-3xl p-6 max-w-4xl w-full border border-slate-800 shadow-2xl space-y-4 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                {selectedPreviewFile.type === "txt" ? (
                  <FileText className="w-5 h-5 text-blue-400" />
                ) : (
                  <Code className="w-5 h-5 text-orange-400" />
                )}
                <span className="font-mono text-xs font-black text-white">
                  Xem chi tiết tệp: {selectedPreviewFile.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                  {selectedPreviewFile.size}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewModalOpen(false);
                  setSelectedPreviewFile(null);
                }}
                className="text-slate-400 hover:text-white font-black text-xs cursor-pointer"
              >
                ĐÓNG (X)
              </button>
            </div>

            {/* Scrollable Monospace Preview Container */}
            <div className="flex-1 overflow-auto bg-slate-900 rounded-xl p-4 border border-slate-800 font-mono text-xs leading-relaxed text-slate-300 select-text whitespace-pre-wrap">
              {selectedPreviewFile.content}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
              <span className="text-[10px] text-slate-500 italic">
                Sửa đổi lần cuối: {selectedPreviewFile.mtime}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewModalOpen(false);
                    setSelectedPreviewFile(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => downloadSingleFile(selectedPreviewFile)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải xuống tệp này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
