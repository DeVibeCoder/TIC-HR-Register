const fs = require('fs');
const content = fs.readFileSync('hr-system-frontend/src/App.tsx', 'utf8');

const OLD_SIGNATURE = `function OverviewPage({ employees, leaveRequests, activeLeaves, leaveHistory }: { employees: Employee[]; leaveRequests: LeaveRequestRecord[]; activeLeaves: ActiveLeaveRecord[]; leaveHistory: LeaveHistoryRecord[] }) {`;

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
  const onSitePct = employees.length ? Math.round((onSite / employees.length) * 100) : 0
  const completePct = employees.length ? Math.round(((employees.length - pendingEmployees.length) / employees.length) * 100) : 0

  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    employees.forEach((e) => { counts[e.department] = (counts[e.department] ?? 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [employees])
  const maxDeptCount = deptCounts[0]?.[1] ?? 1
  const recentLeave = [...leaveRequests].sort((a, b) => b.departureDate.localeCompare(a.departureDate)).slice(0, 5)

  // ── Nationality breakdown ──
  const nationalityCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    employees.forEach((e) => { counts[e.nationality] = (counts[e.nationality] ?? 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [employees])
  const maxNatCount = nationalityCounts[0]?.[1] ?? 1

  // ── Inventory alerts ──
  const lowStockItems = inventoryItems.filter(i => i.quantity <= i.minQuantity && i.quantity > 0).slice(0, 5)
  const outOfStock    = inventoryItems.filter(i => i.quantity === 0).length

  // ── Passport tracking ──
  const passHeld   = passportHandovers.filter(p => p.passportStep === 'Collected').length
  const passSentHO = passportHandovers.filter(p => p.passportStep === 'Sent to HO').length

  // ── Medical cases ──
  const recentMedical = [...medicalCases].sort((a, b) => b.caseDate.localeCompare(a.caseDate)).slice(0, 4)
  const urgentCases   = medicalCases.filter(c => c.isUrgent).length
  const admittedNow   = medicalCases.filter(c => c.isAdmitted && !c.dischargedDate).length

  // ── Exit interviews ──
  const exitDone    = exitInterviews.filter(e => !e.skipped).length
  const exitSkipped = exitInterviews.filter(e => e.skipped).length
  const exitDonePct = exitInterviews.length ? Math.round((exitDone / exitInterviews.length) * 100) : 0

  const todayStr = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  const stats = [
    { value: employees.length,       label: 'Total Staff',   color: '#7c3aed', bg: '#f5f3ff', accent: '#ede9fe', icon: '👥' },
    { value: onSite,                  label: 'On Site',       color: '#059669', bg: '#f0fdf4', accent: '#bbf7d0', icon: '🟢' },
    { value: onLeave,                 label: 'On Leave',      color: '#2563eb', bg: '#eff6ff', accent: '#bfdbfe', icon: '✈️' },
    { value: offSite,                 label: 'Off Site',      color: '#d97706', bg: '#fffbeb', accent: '#fde68a', icon: '🔄' },
    { value: pendingEmployees.length, label: 'Pending',       color: '#dc2626', bg: '#fef2f2', accent: '#fecaca', icon: '⚠️' },
    { value: leaveRequests.length,    label: 'Leave Req.',    color: '#0891b2', bg: '#f0f9ff', accent: '#bae6fd', icon: '📋' },
    { value: activeLeaves.length,     label: 'Active Leave',  color: '#7c3aed', bg: '#faf5ff', accent: '#e9d5ff', icon: '🗓' },
    { value: leaveHistory.length,     label: 'History',       color: '#475569', bg: '#f8fafc', accent: '#e2e8f0', icon: '📁' },
  ]

  const stageColors: Record<string, string> = {
    'Letter Submitted':  '#f59e0b',
    'Exit Interview':    '#8b5cf6',
    'Ticket':            '#3b82f6',
    'Pending Departure': '#ef4444',
  }

  return (
    <section className="nx-overview ov2-wrap">

      {/* ── Header banner ── */}
      <div className="ov2-header">
        <div className="ov2-header-deco" />
        <div className="ov2-header-deco2" />
        <div className="ov2-header-left">
          <p className="ov2-eyebrow">Thilafushi Industrial Complex · HR Operations</p>
          <h1 className="ov2-title">HR Overview</h1>
          <p className="ov2-date">{todayStr}</p>
        </div>
        <div className="ov2-header-kpis">
          <div className="ov2-kpi">
            <span className="ov2-kpi-val">{onSitePct}%</span>
            <span className="ov2-kpi-lbl">On Site</span>
          </div>
          <div className="ov2-kpi-divider" />
          <div className="ov2-kpi">
            <span className="ov2-kpi-val">{completePct}%</span>
            <span className="ov2-kpi-lbl">Records Complete</span>
          </div>
          <div className="ov2-kpi-divider" />
          <div className="ov2-kpi">
            <span className="ov2-kpi-val">{employees.length}</span>
            <span className="ov2-kpi-lbl">Total Staff</span>
          </div>
        </div>
      </div>

      {/* ── Stat strip — always 1 row ── */}
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

      {/* ── Main panels (2-col, natural heights) ── */}
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
                  <div className="ov2-progress-track">
                    <div className="ov2-progress-fill" style={{ width:\`\${completePct}%\` }} />
                  </div>
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
                    <div className="dept-bar-track">
                      <div className="dept-bar-fill" style={{ width:\`\${Math.round((count/maxDeptCount)*100)}%\` }} />
                    </div>
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

      {/* ── Insights grid (3-col) ── */}
      <div className="ov2-grid3">

        {/* Active Terminations */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Active Terminations</span>
            <span className="ov2-chip" style={{ background:'#fef3c7', color:'#92400e' }}>{noticeTerminations.length} in progress</span>
          </div>
          {noticeTerminations.length === 0
            ? <p className="ov-empty">No active termination notices.</p>
            : <>
                {noticeTerminations.slice(0, 4).map(t => (
                  <div key={t.id} className="ov3-row">
                    <div className="ov3-row-info">
                      <span className="ov3-row-name">{t.name}</span>
                      <span className="ov3-row-sub">{t.department}</span>
                    </div>
                    <span className="ov3-stage-badge" style={{ background: (stageColors[t.currentStage] || '#94a3b8') + '22', color: stageColors[t.currentStage] || '#64748b' }}>{t.currentStage}</span>
                  </div>
                ))}
                {noticeTerminations.length > 4 && <p className="ov2-more" style={{ marginTop:6 }}>+{noticeTerminations.length - 4} more</p>}
                <div className="ov3-footer-stat">
                  <span>✓ {completedTerminations.length} completed all time</span>
                </div>
              </>
          }
        </article>

        {/* Nationality Breakdown */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Nationality Snapshot</span>
            <span className="ov2-chip" style={{ background:'#f0fdf4', color:'#166534' }}>{nationalityCounts.length} nationalities</span>
          </div>
          {nationalityCounts.length === 0
            ? <p className="ov-empty">No employees added yet.</p>
            : <div style={{ marginTop:6 }}>
                {nationalityCounts.map(([nat, cnt]) => (
                  <div key={nat} style={{ display:'grid', gridTemplateColumns:'minmax(80px,1fr) 80px 28px', alignItems:'center', gap:'6px 8px', marginBottom:6 }}>
                    <span style={{ fontSize:'0.76rem', color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nat}</span>
                    <div style={{ height:7, borderRadius:4, background:'#f1f5f9', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:\`\${Math.round((cnt/maxNatCount)*100)}%\`, background:'#6366f1', borderRadius:4, transition:'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize:'0.76rem', fontWeight:700, color:'#4f46e5', textAlign:'right' }}>{cnt}</span>
                  </div>
                ))}
              </div>
          }
        </article>

        {/* Passport Tracking */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Passport Tracking</span>
            <span className="ov2-chip" style={{ background:'#ecfdf5', color:'#065f46' }}>{passportHandovers.length} tracked</span>
          </div>
          {passportHandovers.length === 0
            ? <p className="ov-empty">No passports tracked yet.</p>
            : <>
                <div className="ov3-stat-row">
                  {[
                    { label:'Issued', val: passportHandovers.filter(p=>p.passportStep==='Issued').length, c:'#2563eb' },
                    { label:'Collected', val: passHeld, c:'#d97706' },
                    { label:'Sent to HO', val: passSentHO, c:'#7c3aed' },
                  ].map(s=>(
                    <div key={s.label} className="ov3-stat-box">
                      <span style={{ fontSize:'1.25rem', fontWeight:800, color:s.c }}>{s.val}</span>
                      <span style={{ fontSize:'0.68rem', color:'#64748b', textAlign:'center', lineHeight:1.2 }}>{s.label}</span>
                    </div>
                  ))}
                </div>
                {passportHandovers.slice(0,3).map(p=>(
                  <div key={p.id} className="ov3-row" style={{ marginTop:4 }}>
                    <div className="ov3-row-info">
                      <span className="ov3-row-name">{p.name}</span>
                      <span className="ov3-row-sub">{p.department}</span>
                    </div>
                    <span style={{ fontSize:'0.7rem', fontWeight:700, color: p.passportStep==='Issued'?'#2563eb':p.passportStep==='Collected'?'#d97706':'#7c3aed', background: p.passportStep==='Issued'?'#eff6ff':p.passportStep==='Collected'?'#fffbeb':'#f5f3ff', padding:'2px 7px', borderRadius:20 }}>{p.passportStep}</span>
                  </div>
                ))}
                {passportHandovers.length > 3 && <p className="ov2-more" style={{ marginTop:4 }}>+{passportHandovers.length-3} more</p>}
              </>
          }
        </article>

        {/* Medical Cases */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Medical Cases</span>
            <span className="ov2-chip" style={{ background: urgentCases?'#fef2f2':'#f8fafc', color: urgentCases?'#dc2626':'#475569' }}>{medicalCases.length} total</span>
          </div>
          {medicalCases.length === 0
            ? <p className="ov-empty">No medical cases recorded.</p>
            : <>
                <div className="ov3-stat-row" style={{ marginBottom:8 }}>
                  <div className="ov3-stat-box">
                    <span style={{ fontSize:'1.1rem', fontWeight:800, color:'#dc2626' }}>{urgentCases}</span>
                    <span style={{ fontSize:'0.68rem', color:'#64748b', textAlign:'center' }}>Urgent</span>
                  </div>
                  <div className="ov3-stat-box">
                    <span style={{ fontSize:'1.1rem', fontWeight:800, color:'#d97706' }}>{admittedNow}</span>
                    <span style={{ fontSize:'0.68rem', color:'#64748b', textAlign:'center' }}>Admitted</span>
                  </div>
                  <div className="ov3-stat-box">
                    <span style={{ fontSize:'1.1rem', fontWeight:800, color:'#0891b2' }}>{medicalCases.filter(c=>c.mcProvided).length}</span>
                    <span style={{ fontSize:'0.68rem', color:'#64748b', textAlign:'center' }}>MC Given</span>
                  </div>
                </div>
                {recentMedical.map(c=>(
                  <div key={c.id} className="ov3-row">
                    <div className="ov3-row-info">
                      <span className="ov3-row-name">{c.name}{c.isUrgent && <span style={{ marginLeft:4, fontSize:'0.65rem', color:'#ef4444', fontWeight:700 }}>URGENT</span>}</span>
                      <span className="ov3-row-sub">{c.reason || c.hospital} · {formatDateDisplay(c.caseDate)}</span>
                    </div>
                  </div>
                ))}
              </>
          }
        </article>

        {/* Inventory Alerts */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Inventory Alerts</span>
            <span className="ov2-chip" style={{ background: outOfStock?'#fef2f2':lowStockItems.length?'#fffbeb':'#f0fdf4', color: outOfStock?'#dc2626':lowStockItems.length?'#92400e':'#166534' }}>
              {outOfStock} out · {lowStockItems.length} low
            </span>
          </div>
          {inventoryItems.length === 0
            ? <p className="ov-empty">No inventory items added yet.</p>
            : outOfStock === 0 && lowStockItems.length === 0
              ? <p className="ov-empty" style={{ color:'#16a34a' }}>✓ All items sufficiently stocked.</p>
              : <>
                  {outOfStock > 0 && (
                    <div style={{ marginBottom:8, padding:'6px 10px', background:'#fef2f2', borderRadius:7, border:'1px solid #fecaca', fontSize:'0.78rem', color:'#dc2626', fontWeight:700 }}>
                      ⚠ {outOfStock} item{outOfStock>1?'s':''} out of stock
                    </div>
                  )}
                  {inventoryItems.filter(i=>i.quantity===0).slice(0,2).map(i=>(
                    <div key={i.id} className="ov3-row">
                      <div className="ov3-row-info">
                        <span className="ov3-row-name" style={{ color:'#dc2626' }}>{i.name}</span>
                        <span className="ov3-row-sub">{i.category} · {i.location}</span>
                      </div>
                      <span style={{ fontSize:'0.7rem', fontWeight:800, color:'#dc2626' }}>0 {i.unit}</span>
                    </div>
                  ))}
                  {lowStockItems.map(i=>(
                    <div key={i.id} className="ov3-row">
                      <div className="ov3-row-info">
                        <span className="ov3-row-name">{i.name}</span>
                        <span className="ov3-row-sub">{i.category} · min {i.minQuantity} {i.unit}</span>
                      </div>
                      <span style={{ fontSize:'0.7rem', fontWeight:800, color:'#d97706' }}>{i.quantity} {i.unit}</span>
                    </div>
                  ))}
                </>
          }
        </article>

        {/* Exit Interviews */}
        <article className="ov2-panel">
          <div className="ov2-panel-hd">
            <span className="ov2-panel-ttl">Exit Interviews</span>
            <span className="ov2-chip" style={{ background:'#f5f3ff', color:'#6d28d9' }}>{exitInterviews.length} total</span>
          </div>
          {exitInterviews.length === 0
            ? <p className="ov-empty">No exit interviews recorded.</p>
            : <>
                <div className="ov2-progress-row" style={{ marginBottom:4 }}>
                  <div className="ov2-progress-track">
                    <div style={{ height:'100%', width:\`\${exitDonePct}%\`, background:'#8b5cf6', borderRadius:5, transition:'width 0.5s' }} />
                  </div>
                  <span className="ov2-progress-pct">{exitDonePct}%</span>
                </div>
                <div className="ov2-progress-labels" style={{ marginBottom:8 }}>
                  <span>✓ {exitDone} conducted</span>
                  <span>{exitSkipped} skipped</span>
                </div>
                {exitInterviews.slice(0,4).map(e=>(
                  <div key={e.id} className="ov3-row">
                    <div className="ov3-row-info">
                      <span className="ov3-row-name">{e.name}</span>
                      <span className="ov3-row-sub">{e.department} · {e.terminationType}</span>
                    </div>
                    <span style={{ fontSize:'0.7rem', fontWeight:700, color: e.skipped?'#94a3b8':'#7c3aed', background: e.skipped?'#f1f5f9':'#f5f3ff', padding:'2px 7px', borderRadius:20 }}>{e.skipped?'Skipped':'Done'}</span>
                  </div>
                ))}
                {exitInterviews.length > 4 && <p className="ov2-more" style={{ marginTop:4 }}>+{exitInterviews.length-4} more</p>}
              </>
          }
        </article>

      </div>
    </section>
  )
}`;

const start = content.indexOf(OLD_SIGNATURE);
if (start === -1) { console.error('Could not find OverviewPage signature'); process.exit(1); }

// Find end of the function — the next top-level `function` declaration
const afterStart = content.indexOf('\nfunction EmployeeFormModal', start);
if (afterStart === -1) { console.error('Could not find end of OverviewPage'); process.exit(1); }

const newContent = content.slice(0, start) + NEW_FN + '\n\n' + content.slice(afterStart + 1);
fs.writeFileSync('hr-system-frontend/src/App.tsx', newContent, 'utf8');
console.log('OverviewPage replaced. Size delta:', newContent.length - content.length);
