const fs = require('fs');
const content = fs.readFileSync('hr-system-frontend/src/App.tsx', 'utf8');

const OLD_START = `function OverviewPage({
  employees, leaveRequests, activeLeaves, leaveHistory,
  noticeTerminations, completedTerminations, exitInterviews,
  medicalCases, inventoryItems, passportHandovers,`;

const NEW_FN = `function OverviewPage({
  employees, leaveRequests, activeLeaves, leaveHistory,
  noticeTerminations, completedTerminations, exitInterviews,
  medicalCases, inventoryItems, passportHandovers,
}: {
  employees: Employee[]
  leaveRequests: LeaveRequestRecord[]
  activeLeaves: ActiveLeaveRecord[]
  leaveHistory: LeaveHistoryRecord[]
  noticeTerminations: EnhancedTerminationRecord[]
  completedTerminations: CompletedTerminationRecord[]
  exitInterviews: ExitInterviewRecord[]
  medicalCases: MedicalCaseRecord[]
  inventoryItems: InventoryItem[]
  passportHandovers: PassportHandoverRecord[]
}) {
  const pendingEmployees = employees.filter((employee) => recordStatus(employee) === 'Pending')
  const onSite  = employees.filter((e) => e.siteStatus === 'On Site').length
  const offSite = employees.filter((e) => e.siteStatus === 'Off Site').length
  const onLeave = employees.filter((e) => e.siteStatus === 'On Leave').length
  const onSitePct  = employees.length ? Math.round((onSite  / employees.length) * 100) : 0
  const completePct = employees.length ? Math.round(((employees.length - pendingEmployees.length) / employees.length) * 100) : 0

  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    employees.forEach((e) => { counts[e.department] = (counts[e.department] ?? 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [employees])
  const maxDeptCount = deptCounts[0]?.[1] ?? 1

  const recentLeave = [...leaveRequests].sort((a, b) => b.departureDate.localeCompare(a.departureDate)).slice(0, 5)

  const nationalityCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    employees.forEach((e) => { counts[e.nationality] = (counts[e.nationality] ?? 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [employees])
  const maxNatCount = nationalityCounts[0]?.[1] ?? 1

  const lowStockItems  = inventoryItems.filter(i => i.quantity > 0 && i.quantity <= i.minQuantity)
  const outOfStock     = inventoryItems.filter(i => i.quantity === 0).length
  const passHeld       = passportHandovers.filter(p => p.passportStep === 'Collected').length
  const passSentHO     = passportHandovers.filter(p => p.passportStep === 'Sent to HO').length
  const urgentCases    = medicalCases.filter(c => c.isUrgent).length
  const admittedNow    = medicalCases.filter(c => c.isAdmitted && !c.dischargedDate).length
  const exitDone       = exitInterviews.filter(e => !e.skipped).length
  const exitDonePct    = exitInterviews.length ? Math.round((exitDone / exitInterviews.length) * 100) : 0

  const todayStr = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  const stats = [
    { value: employees.length,       label: 'Total Staff',  color: '#7c3aed', bg: '#f5f3ff', accent: '#ede9fe', icon: '👥' },
    { value: onSite,                  label: 'On Site',      color: '#059669', bg: '#f0fdf4', accent: '#bbf7d0', icon: '🟢' },
    { value: onLeave,                 label: 'On Leave',     color: '#2563eb', bg: '#eff6ff', accent: '#bfdbfe', icon: '✈️' },
    { value: offSite,                 label: 'Off Site',     color: '#d97706', bg: '#fffbeb', accent: '#fde68a', icon: '🔄' },
    { value: pendingEmployees.length, label: 'Pending',      color: '#dc2626', bg: '#fef2f2', accent: '#fecaca', icon: '⚠️' },
    { value: leaveRequests.length,    label: 'Leave Req.',   color: '#0891b2', bg: '#f0f9ff', accent: '#bae6fd', icon: '📋' },
    { value: activeLeaves.length,     label: 'Active Leave', color: '#7c3aed', bg: '#faf5ff', accent: '#e9d5ff', icon: '🗓' },
    { value: leaveHistory.length,     label: 'History',      color: '#475569', bg: '#f8fafc', accent: '#e2e8f0', icon: '📁' },
  ]

  const stageColors: Record<string, string> = {
    'Letter Submitted':  '#f59e0b',
    'Exit Interview':    '#8b5cf6',
    'Ticket':            '#3b82f6',
    'Pending Departure': '#ef4444',
  }

  return (
    <section className="nx-overview ov2-wrap">

      {/* ── Header ── */}
      <div className="ov2-header">
        <div className="ov2-header-deco" />
        <div className="ov2-header-deco2" />
        <div className="ov2-header-left">
          <p className="ov2-eyebrow">Thilafushi Industrial Complex · HR Operations</p>
          <h1 className="ov2-title">HR Overview</h1>
          <p className="ov2-date">{todayStr}</p>
        </div>
        <div className="ov2-header-kpis">
          <div className="ov2-kpi"><span className="ov2-kpi-val">{onSitePct}%</span><span className="ov2-kpi-lbl">On Site</span></div>
          <div className="ov2-kpi-divider" />
          <div className="ov2-kpi"><span className="ov2-kpi-val">{completePct}%</span><span className="ov2-kpi-lbl">Records Complete</span></div>
          <div className="ov2-kpi-divider" />
          <div className="ov2-kpi"><span className="ov2-kpi-val">{employees.length}</span><span className="ov2-kpi-lbl">Total Staff</span></div>
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div className="ov2-strip">
        {stats.map(({ value, label, color, bg, accent, icon }) => (
          <div key={label} className="ov2-card" style={{ '--ov-color': color, '--ov-bg': bg, '--ov-accent': accent } as React.CSSProperties}>
            <div className="ov2-card-top">
              <span className="ov2-card-icon">{icon}</span>
              <strong className="ov2-card-val">{value}</strong>
            </div>
            <span className="ov2-card-lbl">{label}</span>
          </div>
        ))}
      </div>

      {/* ═══ ZONE 1 — Main panels (2-col, natural heights) ═══ */}
      <div className="ov2-grid">

        {/* Site Presence */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Site Presence</span>
            <span className="ov2-chip" style={{ background:'#ede9fe', color:'#6d28d9' }}>{onSitePct}% on site</span>
          </div>
          <div className="ov2-presence-bar">
            <div style={{ width:\`\${onSitePct}%\`, background:'#10b981', transition:'width 0.6s' }} title={\`On Site: \${onSite}\`} />
            <div style={{ width:\`\${employees.length ? Math.round((onLeave/employees.length)*100) : 0}%\`, background:'#3b82f6', transition:'width 0.6s' }} title={\`On Leave: \${onLeave}\`} />
            <div style={{ width:\`\${employees.length ? Math.round((offSite/employees.length)*100) : 0}%\`, background:'#f59e0b', transition:'width 0.6s' }} title={\`Off Site: \${offSite}\`} />
          </div>
          <div className="ov2-presence-legend">
            {[['#10b981','On Site',onSite],['#3b82f6','On Leave',onLeave],['#f59e0b','Off Site',offSite]].map(([c,l,v])=>(
              <div key={l as string} className="ov2-presence-item">
                <span className="ov2-dot" style={{ background: c as string }} />
                <div>
                  <div className="ov2-presence-val">{v as number}</div>
                  <div className="ov2-presence-lbl">{l as string}</div>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Record Completion */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Record Completion</span>
            {employees.length > 0 && (
              <span className="ov2-chip" style={{ background: pendingEmployees.length?'#fee2e2':'#dcfce7', color: pendingEmployees.length?'#dc2626':'#15803d' }}>
                {pendingEmployees.length} pending
              </span>
            )}
          </div>
          {employees.length === 0
            ? <p className="ov-empty">No employees added yet.</p>
            : <>
                <div className="ov2-progress-row">
                  <div className="ov2-progress-track"><div className="ov2-progress-fill" style={{ width:\`\${completePct}%\` }} /></div>
                  <span className="ov2-progress-pct">{completePct}%</span>
                </div>
                <div className="ov2-progress-labels">
                  <span>✓ {employees.length - pendingEmployees.length} complete</span>
                  <span>{pendingEmployees.length} pending</span>
                </div>
                {pendingEmployees.length > 0 && (
                  <ul className="ov2-pending-list">
                    {pendingEmployees.slice(0, 4).map((e) => (
                      <li key={e.employeeId}>
                        <span>{e.fullName || 'Unnamed'}</span>
                        <small>{getPendingTasks(e).slice(0, 2).join(', ')}</small>
                      </li>
                    ))}
                    {pendingEmployees.length > 4 && <li className="ov2-more">+{pendingEmployees.length - 4} more</li>}
                  </ul>
                )}
              </>
          }
        </article>

        {/* Employees by Section */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Employees by Section</span>
            <span className="ov2-chip" style={{ background:'#ede9fe', color:'#6d28d9' }}>{deptCounts.length} sections</span>
          </div>
          {deptCounts.length === 0
            ? <p className="ov-empty">No section data yet.</p>
            : <div className="ov-dept-bars" style={{ marginTop:8 }}>
                {deptCounts.map(([dept, count]) => (
                  <div className="dept-bar-item" key={dept}>
                    <span className="dept-bar-label">{dept}</span>
                    <div className="dept-bar-track"><div className="dept-bar-fill" style={{ width:\`\${Math.round((count/maxDeptCount)*100)}%\` }} /></div>
                    <span className="dept-bar-count">{count}</span>
                  </div>
                ))}
              </div>
          }
        </article>

        {/* Recent Leave */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Recent Leave Requests</span>
            <span className="ov2-chip" style={{ background:'#f0f9ff', color:'#0284c7' }}>{leaveRequests.length} total</span>
          </div>
          {recentLeave.length === 0
            ? <p className="ov-empty">No leave requests yet.</p>
            : <ul className="ov2-leave-list">
                {recentLeave.map((r) => (
                  <li key={r.id}>
                    <div className="ov2-leave-info">
                      <span>{r.name}</span>
                      <small>{r.department} · {leaveTypeLabel(r.leaveTypeCode)} · {formatDateDisplay(r.departureDate)}</small>
                    </div>
                    <StatusBadge status={r.step} />
                  </li>
                ))}
              </ul>
          }
        </article>

      </div>

      {/* ═══ ZONE 2 — Quick-stats mini-strip (4 uniform cards) ═══ */}
      <div className="ov-mini-strip">

        {/* Terminations */}
        <div className="ov-mini-card" style={{ '--mc-accent':'#f59e0b', '--mc-bg':'#fffbeb' } as React.CSSProperties}>
          <div className="ov-mini-header">
            <span className="ov-mini-icon">📤</span>
            <span className="ov-mini-label">Terminations</span>
          </div>
          <div className="ov-mini-body">
            <strong className="ov-mini-val">{noticeTerminations.length}</strong>
            <span className="ov-mini-sub">active notices</span>
          </div>
          <div className="ov-mini-footer">
            <span>{completedTerminations.length} completed</span>
            {noticeTerminations.length > 0 && (
              <span className="ov-mini-tag" style={{ background:'#fef3c7', color:'#92400e' }}>
                {noticeTerminations[0]?.currentStage}
              </span>
            )}
          </div>
        </div>

        {/* Medical */}
        <div className="ov-mini-card" style={{ '--mc-accent': urgentCases?'#ef4444':'#0891b2', '--mc-bg': urgentCases?'#fef2f2':'#f0f9ff' } as React.CSSProperties}>
          <div className="ov-mini-header">
            <span className="ov-mini-icon">🏥</span>
            <span className="ov-mini-label">Medical Cases</span>
          </div>
          <div className="ov-mini-body">
            <strong className="ov-mini-val">{medicalCases.length}</strong>
            <span className="ov-mini-sub">total recorded</span>
          </div>
          <div className="ov-mini-footer">
            <span>{urgentCases} urgent</span>
            <span>{admittedNow} admitted</span>
          </div>
        </div>

        {/* Passports */}
        <div className="ov-mini-card" style={{ '--mc-accent':'#7c3aed', '--mc-bg':'#f5f3ff' } as React.CSSProperties}>
          <div className="ov-mini-header">
            <span className="ov-mini-icon">🛂</span>
            <span className="ov-mini-label">Passports</span>
          </div>
          <div className="ov-mini-body">
            <strong className="ov-mini-val">{passportHandovers.length}</strong>
            <span className="ov-mini-sub">tracked</span>
          </div>
          <div className="ov-mini-footer">
            <span>{passHeld} held</span>
            <span>{passSentHO} at HO</span>
          </div>
        </div>

        {/* Exit Interviews */}
        <div className="ov-mini-card" style={{ '--mc-accent':'#059669', '--mc-bg':'#f0fdf4' } as React.CSSProperties}>
          <div className="ov-mini-header">
            <span className="ov-mini-icon">📝</span>
            <span className="ov-mini-label">Exit Interviews</span>
          </div>
          <div className="ov-mini-body">
            <strong className="ov-mini-val">{exitDonePct}%</strong>
            <span className="ov-mini-sub">completion rate</span>
          </div>
          <div className="ov-mini-footer">
            <span>{exitDone} done</span>
            <span>{exitInterviews.filter(e=>e.skipped).length} skipped</span>
          </div>
        </div>

      </div>

      {/* ═══ ZONE 3 — Breakdowns (2-col) ═══ */}
      <div className="ov2-grid">

        {/* Nationality Snapshot */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Nationality Snapshot</span>
            <span className="ov2-chip" style={{ background:'#f0fdf4', color:'#166534' }}>{nationalityCounts.length} nationalities</span>
          </div>
          {nationalityCounts.length === 0
            ? <p className="ov-empty">No employees added yet.</p>
            : <div style={{ marginTop:6 }}>
                {nationalityCounts.map(([nat, cnt]) => (
                  <div key={nat} style={{ display:'grid', gridTemplateColumns:'minmax(90px,1fr) 1fr 28px', alignItems:'center', gap:'5px 10px', marginBottom:7 }}>
                    <span style={{ fontSize:'0.76rem', color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nat}</span>
                    <div style={{ height:8, borderRadius:4, background:'#f1f5f9', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:\`\${Math.round((cnt/maxNatCount)*100)}%\`, background:'#6366f1', borderRadius:4, transition:'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize:'0.76rem', fontWeight:700, color:'#4f46e5', textAlign:'right' }}>{cnt}</span>
                  </div>
                ))}
              </div>
          }
        </article>

        {/* Inventory Status */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Inventory Status</span>
            <span className="ov2-chip" style={{
              background: outOfStock ? '#fef2f2' : lowStockItems.length ? '#fffbeb' : '#f0fdf4',
              color:       outOfStock ? '#dc2626' : lowStockItems.length ? '#92400e' : '#166534',
            }}>
              {outOfStock > 0 ? \`\${outOfStock} out of stock\` : lowStockItems.length > 0 ? \`\${lowStockItems.length} low stock\` : 'All stocked'}
            </span>
          </div>
          {inventoryItems.length === 0
            ? <p className="ov-empty">No inventory items added yet.</p>
            : outOfStock === 0 && lowStockItems.length === 0
              ? <p className="ov-empty" style={{ color:'#16a34a' }}>✓ All {inventoryItems.length} items are sufficiently stocked.</p>
              : <div style={{ marginTop:4 }}>
                  {inventoryItems.filter(i => i.quantity === 0).slice(0,3).map(i => (
                    <div key={i.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#dc2626' }}>{i.name}</div>
                        <div style={{ fontSize:'0.67rem', color:'#94a3b8' }}>{i.category} · {i.location}</div>
                      </div>
                      <span style={{ fontSize:'0.7rem', fontWeight:800, color:'#dc2626', background:'#fef2f2', padding:'2px 8px', borderRadius:20 }}>OUT</span>
                    </div>
                  ))}
                  {lowStockItems.slice(0,4).map(i => (
                    <div key={i.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontSize:'0.78rem', fontWeight:600, color:'#374151' }}>{i.name}</div>
                        <div style={{ fontSize:'0.67rem', color:'#94a3b8' }}>{i.category} · min {i.minQuantity} {i.unit}</div>
                      </div>
                      <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#d97706', background:'#fffbeb', padding:'2px 8px', borderRadius:20 }}>{i.quantity} {i.unit}</span>
                    </div>
                  ))}
                  {(outOfStock + lowStockItems.length) > 7 && (
                    <p style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:6 }}>+{(outOfStock + lowStockItems.length) - 7} more alerts</p>
                  )}
                </div>
          }
        </article>

        {/* Active Terminations */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Active Terminations</span>
            <span className="ov2-chip" style={{ background:'#fef3c7', color:'#92400e' }}>{noticeTerminations.length} in progress</span>
          </div>
          {noticeTerminations.length === 0
            ? <p className="ov-empty">No active termination notices.</p>
            : <div style={{ marginTop:4 }}>
                {noticeTerminations.slice(0, 5).map(t => (
                  <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #f1f5f9', gap:8 }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.name}</div>
                      <div style={{ fontSize:'0.67rem', color:'#64748b' }}>{t.department}</div>
                    </div>
                    <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'2px 8px', borderRadius:20, flexShrink:0,
                      background: (stageColors[t.currentStage] || '#94a3b8') + '20',
                      color: stageColors[t.currentStage] || '#64748b' }}>
                      {t.currentStage}
                    </span>
                  </div>
                ))}
                {noticeTerminations.length > 5 && <p style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:6 }}>+{noticeTerminations.length - 5} more</p>}
                <div style={{ marginTop:8, paddingTop:6, borderTop:'1px solid #f1f5f9', fontSize:'0.68rem', color:'#64748b' }}>
                  ✓ {completedTerminations.length} completed all time
                </div>
              </div>
          }
        </article>

        {/* Passport Tracking */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Passport Tracking</span>
            <span className="ov2-chip" style={{ background:'#f5f3ff', color:'#6d28d9' }}>{passportHandovers.length} tracked</span>
          </div>
          {passportHandovers.length === 0
            ? <p className="ov-empty">No passports tracked yet.</p>
            : <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, margin:'4px 0 12px' }}>
                  {[
                    { label:'Issued',     val: passportHandovers.filter(p=>p.passportStep==='Issued').length,     c:'#2563eb', bg:'#eff6ff' },
                    { label:'Collected',  val: passHeld,                                                           c:'#d97706', bg:'#fffbeb' },
                    { label:'At HO',      val: passSentHO,                                                         c:'#7c3aed', bg:'#f5f3ff' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign:'center', padding:'8px 4px', background:s.bg, borderRadius:8, border:\`1px solid \${s.c}30\` }}>
                      <div style={{ fontSize:'1.2rem', fontWeight:800, color:s.c }}>{s.val}</div>
                      <div style={{ fontSize:'0.65rem', color:'#64748b', marginTop:1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {passportHandovers.slice(0, 4).map(p => (
                  <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid #f1f5f9', gap:8 }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize:'0.67rem', color:'#64748b' }}>{p.department}</div>
                    </div>
                    <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'2px 8px', borderRadius:20, flexShrink:0,
                      color: p.passportStep==='Issued'?'#2563eb':p.passportStep==='Collected'?'#d97706':'#7c3aed',
                      background: p.passportStep==='Issued'?'#eff6ff':p.passportStep==='Collected'?'#fffbeb':'#f5f3ff' }}>
                      {p.passportStep}
                    </span>
                  </div>
                ))}
                {passportHandovers.length > 4 && <p style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:6 }}>+{passportHandovers.length - 4} more</p>}
              </>
          }
        </article>

      </div>
    </section>
  )
}`;

const start = content.indexOf(OLD_START);
if (start === -1) { console.error('Could not find OverviewPage start'); process.exit(1); }

const afterEnd = content.indexOf('\nfunction EmployeeFormModal', start);
if (afterEnd === -1) { console.error('Could not find end marker'); process.exit(1); }

const newContent = content.slice(0, start) + NEW_FN + '\n\n' + content.slice(afterEnd + 1);
fs.writeFileSync('hr-system-frontend/src/App.tsx', newContent, 'utf8');
console.log('Done. Size delta:', newContent.length - content.length);
