const fs = require('fs');

let code = fs.readFileSync('src/components/AssistantPayrollSection.tsx', 'utf8');

// replace timetableSlots and reports with attendance logic
code = code.replace(
  /const timetableSlots = storageService\.getTimetableSlots\(\);/,
  `const attendanceRecords = storageService.getAssistantAttendance();\n  const settings = storageService.getTimetableSettings();\n  const shifts = settings.shifts;`
);

code = code.replace(
  /const availableMonths = useMemo\(\(\) => \{[\s\S]*?\}, \[timetableSlots, reports\]\);/,
  `const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const now = new Date();
    months.add(\`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, "0")}\`);
    attendanceRecords.forEach((record) => {
      if (record.date) {
        months.add(record.date.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [attendanceRecords]);`
);

code = code.replace(
  /const payrollRecords = useMemo\(\(\) => \{[\s\S]*?\}, \[\s*assistants,\s*classes,\s*timetableSlots,\s*reports,\s*selectedMonth,\s*defaultSessionRate,\s*payrollAdjustments,\s*\]\);/,
  `const payrollRecords = useMemo(() => {
    const list: AssistantPayrollRecord[] = [];
    assistants.forEach((asst) => {
      // Find all attendance records where this assistant is present in this month
      const assistantAttendances = attendanceRecords.filter((rec) => {
        if (!rec.date || !rec.date.startsWith(selectedMonth)) return false;
        return rec.assistantIds.includes(asst.id);
      });

      const sessionList = assistantAttendances.map(att => {
        const shiftInfo = shifts.find(s => s.id === att.shiftId);
        return {
          id: att.id,
          date: att.date,
          className: "Ca dạy tại Trung tâm", // General since attendance is per shift now, not per class
          shiftName: shiftInfo ? shiftInfo.name : att.shiftId,
          lessonTopic: att.notes || "Điểm danh trợ giảng",
          hasReport: true, // We don't use reports for this anymore
          reportStatus: "approved",
        };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const totalSessions = sessionList.length;
      const completedSessions = totalSessions;
      const pendingReportSessions = 0;

      // Adjustments for this assistant
      const adj = payrollAdjustments[asst.id] || {};
      const ratePerSession = adj.ratePerSession ?? defaultSessionRate;
      const allowance = adj.allowance ?? 0;
      const bonus = adj.bonus ?? 0;
      const deduction = adj.deduction ?? 0;
      const sessionSalary = totalSessions * ratePerSession;
      const netSalary = Math.max(0, sessionSalary + allowance + bonus - deduction);

      const assignedClassNames = asst.classes
        .map((cid) => {
          const cls = classes.find((c) => c.id === cid);
          return cls ? cls.name.split("–")[0].trim() : cid;
        })
        .filter(Boolean);

      list.push({
        assistantId: asst.id,
        assistantName: asst.name,
        phone: asst.phone,
        email: asst.email,
        bankInfo: adj.bankInfo || "MB Bank - 9999.8888.66 - " + asst.name.toUpperCase(),
        assignedClasses: assignedClassNames,
        totalSessions,
        completedSessions,
        pendingReportSessions,
        sessionList,
        ratePerSession,
        sessionSalary,
        allowance,
        bonus,
        deduction,
        netSalary,
        paymentStatus: adj.paymentStatus || "unpaid",
        paidDate: adj.paidDate,
        paymentMethod: adj.paymentMethod || "transfer",
        notes: adj.notes || "",
      });
    });

    return list;
  }, [
    assistants,
    classes,
    attendanceRecords,
    shifts,
    selectedMonth,
    defaultSessionRate,
    payrollAdjustments,
  ]);`
);

fs.writeFileSync('src/components/AssistantPayrollSection.tsx', code);

console.log('updated payroll logic');
