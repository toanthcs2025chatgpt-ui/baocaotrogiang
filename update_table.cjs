const fs = require('fs');
let code = fs.readFileSync('src/components/AssistantAttendanceSection.tsx', 'utf8');

const tableBlockRegex = /<table className="w-full text-left text-xs border-collapse min-w-\[800px\]">([\s\S]*?)<\/table>/;

const newTable = `<table className="w-full text-left text-sm border-collapse min-w-[800px]">
          <thead className="bg-slate-900 text-white font-black uppercase text-xs tracking-wider">
            <tr>
              <th className="p-3 w-32 border-r border-slate-700 text-center">Ca dạy</th>
              {weekDays.map((day, idx) => (
                <th key={idx} className="p-3 border-r border-slate-700 text-center w-40">
                  <div className="text-sm">Thứ {idx === 6 ? "CN" : idx + 2}</div>
                  <div className="text-xs text-blue-300 font-bold mt-0.5">{format(day, "dd/MM")}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-200">
            {shifts.map((shift, sIdx) => (
              <tr key={shift.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 border-r border-slate-200 bg-slate-50 text-center">
                  <div className="font-black text-slate-900 text-sm">{shift.name}</div>
                  <div className="text-xs text-slate-500 font-bold mt-1">{shift.startTime} - {shift.endTime}</div>
                </td>
                {weekDays.map((day, dIdx) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const record = getRecord(dateStr, shift.id);
                  const count = record?.assistantIds.length || 0;
                  
                  const assignedNames = (record?.assistantIds || [])
                    .map(id => {
                      const asst = assistants.find(a => a.id === id);
                      if (!asst) return "Trợ giảng";
                      const parts = asst.name.split(" ");
                      return parts.length >= 2 ? parts.slice(-2).join(" ") : asst.name;
                    });

                  return (
                    <td 
                      key={\`\${sIdx}-\${dIdx}\`} 
                      className="p-2 border-r border-slate-200 cursor-pointer hover:bg-blue-50/50 transition-colors align-top"
                      onClick={() => openCell(day, shift.id)}
                    >
                      <div className={\`h-[72px] rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all active:scale-95 \${count > 0 ? "border-blue-700 bg-blue-600 shadow-[0_4px_0_0_#1d4ed8] hover:shadow-[0_2px_0_0_#1d4ed8] hover:translate-y-[2px]" : "border-dashed border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50"}\`}>
                        {count > 0 ? (
                          <div className="flex flex-col items-center justify-center gap-1 w-full overflow-hidden">
                            {assignedNames.slice(0, 2).map((name, i) => (
                              <span key={i} className="text-xs font-black text-white truncate w-full text-center leading-none px-1" title={name}>
                                {name}
                              </span>
                            ))}
                            {count > 2 && (
                              <span className="text-[10px] font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full mt-0.5 shadow-sm">
                                +{count - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold">+ Thêm</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>`;

if (code.match(tableBlockRegex)) {
  code = code.replace(tableBlockRegex, newTable);
  fs.writeFileSync('src/components/AssistantAttendanceSection.tsx', code);
  console.log('Table updated successfully!');
} else {
  console.log('Regex did not match.');
}
