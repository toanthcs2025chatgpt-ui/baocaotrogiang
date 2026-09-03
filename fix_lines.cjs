const fs = require('fs');
let code = fs.readFileSync('src/components/AssistantsView.tsx', 'utf8');

// I will find `{/* Modal Add / Edit Assistant with Username and Password */}`
// and just replace everything before it up to `      </div>\n      )}` to make sure it's clean.

// Let's replace the duplicate:
code = code.replace(`      </div>
      )}
      {/* Modal Add / Edit Assistant with Username and Password */}
      
      </div> 
      )}
      
      {activeSubTab === "attendance" && (
        <AssistantAttendanceSection />
      )}
      
      {activeSubTab === "payroll" && (
        <AssistantPayrollSection />
      )}
      
      {isModalOpen && (`, `      </div>
      )}
      
      {activeSubTab === "attendance" && (
        <AssistantAttendanceSection />
      )}
      
      {activeSubTab === "payroll" && (
        <AssistantPayrollSection />
      )}

      {/* Modal Add / Edit Assistant with Username and Password */}
      {isModalOpen && (`);

fs.writeFileSync('src/components/AssistantsView.tsx', code);
