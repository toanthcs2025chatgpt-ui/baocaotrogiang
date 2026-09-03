const fs = require('fs');
let code = fs.readFileSync('src/components/AssistantsView.tsx', 'utf8');

code = code.replace(/      \)}\s*\);\s*\};\s*$/, '      )}\n    </div>\n  );\n};\n');
fs.writeFileSync('src/components/AssistantsView.tsx', code);
