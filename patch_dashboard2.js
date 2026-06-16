// ─── Dashboard redesign: read JSX from separate file ─────────────────────────
const fs = require('fs')
let c = fs.readFileSync('hr-system-frontend/src/App.tsx', 'utf8')
const newContent = fs.readFileSync('dashboard_content.tsx', 'utf8')

const startMarker = '\nfunction OverviewPage({'
const endMarker   = '\nfunction EmployeeFormModal('
const startIdx = c.indexOf(startMarker)
const endIdx   = c.indexOf(endMarker)
if (startIdx === -1 || endIdx === -1) {
  console.error('Bounds not found', startIdx, endIdx)
  process.exit(1)
}

c = c.slice(0, startIdx + 1) + newContent + '\n' + c.slice(endIdx + 1)
fs.writeFileSync('hr-system-frontend/src/App.tsx', c, 'utf8')
console.log('Dashboard replaced. Lines:', c.split('\n').length)
