const fs = require('fs');
let code = fs.readFileSync('src/components/StatisticsView.tsx', 'utf8');

// Remove payroll sub-tab button
code = code.replace(/\{\/\* Sub-tab 3: Bảng Lương Trợ Giảng \*\/\}.*?<\/button>/s, '');
// Remove activeSubTab logic for payroll
code = code.replace(/\{\/\* VIEW CONTENT 3: ASSISTANT PAYROLL SECTION \*\/\}.*?<\/div>.*?<\/div>.*?}/s, '');

fs.writeFileSync('src/components/StatisticsView.tsx', code);
