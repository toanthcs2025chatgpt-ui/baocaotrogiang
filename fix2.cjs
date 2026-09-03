const fs = require('fs');
let code = fs.readFileSync('src/components/StatisticsView.tsx', 'utf8');

// I will just trim anything after `  {/* VIEW CONTENT 2: ATTENDANCE & TUITION MATRIX REPORT */}`
const parts = code.split('{/* VIEW CONTENT 2: ATTENDANCE & TUITION MATRIX REPORT */}');
if (parts.length > 1) {
  let firstPart = parts[0];
  let finalCode = firstPart + `      {/* VIEW CONTENT 2: ATTENDANCE & TUITION MATRIX REPORT */}
      {activeSubTab === "tuition" && (
        <div className="animate-in fade-in duration-200">
          <AttendanceReportSection initialClassId={selectedClass} />
        </div>
      )}
    </div>
  );
};
`;
  fs.writeFileSync('src/components/StatisticsView.tsx', finalCode);
}
