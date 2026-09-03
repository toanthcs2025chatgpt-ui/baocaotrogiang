const fs = require('fs');
let code = fs.readFileSync('src/components/AssistantAttendanceSection.tsx', 'utf8');

const oldBlock = `{weekDays.map((day, dIdx) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const record = getRecord(dateStr, shift.id);
                  const count = record?.assistantIds.length || 0;
                  return (
                    <td 
                      key={\`\${sIdx}-\${dIdx}\`} 
                      className="p-2 border-r border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => openCell(day, shift.id)}
                    >
                      <div className={\`h-16 rounded-xl border-2 flex flex-col items-center justify-center p-2 transition-all \${count > 0 ? "border-blue-300 bg-blue-100" : "border-dashed border-slate-300 bg-white hover:border-blue-400"}\`}>
                        {count > 0 ? (
                          <>
                            <span className="text-lg font-black text-blue-700">{count}</span>
                            <span className="text-[9px] font-bold text-blue-600 uppercase">Trợ giảng</span>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">+ Thêm</span>
                        )}
                      </div>
                    </td>
                  );
                })}`;

const newBlock = `{weekDays.map((day, dIdx) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const record = getRecord(dateStr, shift.id);
                  const count = record?.assistantIds.length || 0;
                  
                  const assignedNames = (record?.assistantIds || [])
                    .map(id => {
                      const asst = assistants.find(a => a.id === id);
                      if (!asst) return "Trợ giảng";
                      const parts = asst.name.split(" ");
                      return parts.length > 2 ? parts.slice(-2).join(" ") : asst.name;
                    });

                  return (
                    <td 
                      key={\`\${sIdx}-\${dIdx}\`} 
                      className="p-1.5 border-r border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => openCell(day, shift.id)}
                    >
                      <div className={\`h-16 rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all \${count > 0 ? "border-blue-400 bg-blue-50 shadow-sm" : "border-dashed border-slate-300 bg-white hover:border-blue-400"}\`}>
                        {count > 0 ? (
                          <div className="flex flex-col items-center justify-center gap-0.5 w-full overflow-hidden">
                            {assignedNames.slice(0, 2).map((name, i) => (
                              <span key={i} className="text-[10px] font-bold text-blue-800 truncate w-full text-center leading-tight px-0.5" title={name}>
                                {name}
                              </span>
                            ))}
                            {count > 2 && (
                              <span className="text-[9px] font-black text-blue-600 bg-blue-200/50 px-1.5 rounded-full mt-0.5">
                                +{count - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">+ Thêm</span>
                        )}
                      </div>
                    </td>
                  );
                })}`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync('src/components/AssistantAttendanceSection.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find the exact block. Please check syntax.");
}
