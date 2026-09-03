const fs = require('fs');
let code = fs.readFileSync('src/components/AssistantsView.tsx', 'utf8');

const anchor = '{isModalOpen && (';
const parts = code.split(anchor);
if (parts.length === 2) {
  let firstPart = parts[0];
  let secondPart = parts[1];
  
  // Close the activeSubTab === "list" block just before the modal
  let newFirstPart = firstPart + `
      </div> {/* End List View */}
      )}
      
      {activeSubTab === "attendance" && (
        <AssistantAttendanceSection />
      )}
      
      {activeSubTab === "payroll" && (
        <AssistantPayrollSection />
      )}
      
      `;
  
  fs.writeFileSync('src/components/AssistantsView.tsx', newFirstPart + anchor + secondPart);
}
