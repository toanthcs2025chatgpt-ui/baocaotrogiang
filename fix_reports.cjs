const fs = require('fs');
let code = fs.readFileSync('src/components/AssistantPayrollSection.tsx', 'utf8');

code = code.replace(/const reports = storageService\.getReports\(\);\n/g, '');

fs.writeFileSync('src/components/AssistantPayrollSection.tsx', code);
