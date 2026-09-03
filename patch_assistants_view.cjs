const fs = require('fs');
let code = fs.readFileSync('src/components/AssistantsView.tsx', 'utf8');

// Ensure imports
if (!code.includes('AssistantPayrollSection')) {
  code = `import { AssistantPayrollSection } from "./AssistantPayrollSection";\n` + code;
}
if (!code.includes('AssistantAttendanceSection')) {
  code = `import { AssistantAttendanceSection } from "./AssistantAttendanceSection";\n` + code;
}

// Ensure activeTab state
if (!code.includes('activeSubTab')) {
  code = code.replace('const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);', 
  `const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"list" | "attendance" | "payroll">("list");`);
}

// Insert tabs right after the Header Banner
const tabHtml = `
      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b-2 border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab("list")}
          className={\`px-5 py-3 font-bold text-sm transition-colors whitespace-nowrap \${
            activeSubTab === "list" ? "text-blue-700 border-b-4 border-blue-600" : "text-slate-500 hover:text-slate-800"
          }\`}
        >
          Danh Sách Trợ Giảng
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("attendance")}
          className={\`px-5 py-3 font-bold text-sm transition-colors whitespace-nowrap \${
            activeSubTab === "attendance" ? "text-blue-700 border-b-4 border-blue-600" : "text-slate-500 hover:text-slate-800"
          }\`}
        >
          Điểm Danh Ca Dạy
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("payroll")}
          className={\`px-5 py-3 font-bold text-sm transition-colors whitespace-nowrap \${
            activeSubTab === "payroll" ? "text-blue-700 border-b-4 border-blue-600" : "text-slate-500 hover:text-slate-800"
          }\`}
        >
          Bảng Lương
        </button>
      </div>
`;
code = code.replace('      {/* Filter & View Mode Bar */}', tabHtml + '\n      {activeSubTab === "list" && (\n      <div className="space-y-6"> {/* Start List View */}\n      {/* Filter & View Mode Bar */}');

// Close the wrapper
code = code.replace('      {/* Add/Edit Modal */}', `
      </div> {/* End List View */}
      )}
      
      {activeSubTab === "attendance" && (
        <AssistantAttendanceSection />
      )}
      
      {activeSubTab === "payroll" && (
        <AssistantPayrollSection />
      )}

      {/* Add/Edit Modal */}`);

fs.writeFileSync('src/components/AssistantsView.tsx', code);
