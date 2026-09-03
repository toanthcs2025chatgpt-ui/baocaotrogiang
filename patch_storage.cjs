const fs = require('fs');
let code = fs.readFileSync('src/services/storage.ts', 'utf8');

const newMethods = `
  getAssistantAttendance(): import("../types").AssistantAttendanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSISTANT_ATTENDANCE);
    if (!raw) return [];
    try {
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  },

  saveAssistantAttendance(records: import("../types").AssistantAttendanceRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.ASSISTANT_ATTENDANCE, JSON.stringify(records));
  },
`;

code = code.replace(/(\/\/ ==================== TIMETABLE & SCHEDULE ====================)/, newMethods + '\n  $1');

fs.writeFileSync('src/services/storage.ts', code);
