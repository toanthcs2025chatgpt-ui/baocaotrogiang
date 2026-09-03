const fs = require('fs');
let code = fs.readFileSync('src/components/AssistantsView.tsx', 'utf8');

// I will find the last </div> and ); and fix the end of file properly
const lines = code.split('\n');
while(lines[lines.length-1].trim() === ';' || lines[lines.length-1].trim() === '};' || lines[lines.length-1].trim() === ');' || lines[lines.length-1].trim() === '</div>' || lines[lines.length-1].trim() === '') {
  lines.pop();
}
// Add proper closing
const finalCode = lines.join('\n') + '\n  );\n};\n';
fs.writeFileSync('src/components/AssistantsView.tsx', finalCode);
