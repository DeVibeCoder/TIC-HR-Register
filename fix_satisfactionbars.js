const fs = require('fs');
const content = fs.readFileSync('hr-system-frontend/src/App.tsx', 'utf8');

const newFn = `  const SatisfactionBars = ({ src }: { src: ExitInterviewRecord[] }) => {
    const stats = buildQuestStats(src)
    const pctColors = ['#16a34a','#b45309','#dc2626']
    return (
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px', marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#6366f1', textTransform:'uppercase', letterSpacing:'0.07em' }}>Satisfaction by Category</div>
          <div style={{ display:'flex', gap:12 }}>
            {[['#16a34a','Very Satisfied'],['#d97706','Satisfied'],['#dc2626','Dissatisfied']].map(([c,l])=>(
              <span key={l} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.67rem', color:'#64748b' }}>
                <span style={{ width:9, height:9, borderRadius:2, background:c, display:'inline-block', flexShrink:0 }}/>{l}
              </span>
            ))}
          </div>
        </div>
        {stats.map(({ key, label, vsPct, sPct, dPct }) => (
          <div key={key} style={{ display:'grid', gridTemplateColumns:'minmax(120px,30%) 1fr 168px', gap:10, alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:'0.76rem', color:'#475569', lineHeight:1.3, wordBreak:'break-word' }}>{label}</span>
            <div style={{ height:10, borderRadius:5, overflow:'hidden', display:'flex', background:'#f1f5f9' }}>
              <div style={{ width:\`\${vsPct}%\`, background:'#16a34a', transition:'width 0.4s', flexShrink:0 }} title={\`Very Satisfied \${Math.round(vsPct)}%\`} />
              <div style={{ width:\`\${sPct}%\`,  background:'#d97706', transition:'width 0.4s', flexShrink:0 }} title={\`Satisfied \${Math.round(sPct)}%\`} />
              <div style={{ width:\`\${dPct}%\`,  background:'#dc2626', transition:'width 0.4s', flexShrink:0 }} title={\`Dissatisfied \${Math.round(dPct)}%\`} />
            </div>
            <div style={{ display:'flex' }}>
              {[vsPct, sPct, dPct].map((pct, i) => (
                <span key={i} style={{ flex:'0 0 56px', textAlign:'center', fontSize:'0.68rem', fontWeight:pct>0?700:400,
                  color: pct > 0 ? pctColors[i] : '#cbd5e1' }}>
                  {Math.round(pct)}%
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }`;

const oldStart = content.indexOf('  const SatisfactionBars = ({ src }: { src: ExitInterviewRecord[] }) => {');
const oldEnd = content.indexOf('\n  }\n\n  const ReasonBars', oldStart) + 4;
console.log('Replacing from', oldStart, 'to', oldEnd);
const newContent = content.slice(0, oldStart) + newFn + content.slice(oldEnd);
fs.writeFileSync('hr-system-frontend/src/App.tsx', newContent, 'utf8');
console.log('Done. Size change:', newContent.length - content.length);
