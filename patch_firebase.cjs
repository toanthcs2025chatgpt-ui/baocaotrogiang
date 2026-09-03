const fs = require('fs');
let code = fs.readFileSync('src/services/firebase.ts', 'utf8');

code = code.replace(/if \(\!config \|\| \!config\.projectId\) \{/, 'if (!config || !config.projectId || !config.apiKey) {');

fs.writeFileSync('src/services/firebase.ts', code);
