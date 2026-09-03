const fs = require('fs');
let code = fs.readFileSync('src/components/StatisticsView.tsx', 'utf8');

// Ensure correct closing
code = code.replace(/\{.*?VIEW CONTENT 2:.*?\n.*?\n.*?\n.*?\n.*?}/s, (match) => {
  return match;
});

// Let's just fix the end manually
const lines = code.split('\n');
while(lines[lines.length-1].trim() === ';' || lines[lines.length-1].trim() === '') {
  lines.pop();
}

const finalCode = lines.join('\n') + '\n    </div>\n  );\n};\n';
fs.writeFileSync('src/components/StatisticsView.tsx', finalCode);
