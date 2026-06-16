function OverviewPage({
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
  // ── Derived values ───────────────────────────────────────────────────────
  const onSite   = employees.filter(e => e.siteStatus === 'On Site').length
  const offSite  = employees.filter(e => e.siteStatus === 'Off Site').length
  const onLeave  = employees.filter(e => e.siteStatus === 'On Leave').length
  const pending  = employees.filter(e => recordStatus(e) === 'Pending').length
  const onSitePct = employees.length ? Math.round((onSite / employees.length) * 100) : 0

  const passWithStaff = passportHandovers.filter(p => p.ppIssuedToStaff && !p.ppReturnedDate).length
  const passReturned  = passportHandovers.filter(p => p.ppReturnedDate && !p.ppSentToHO).length
  const passAtHO      = passportHandovers.filter(p => p.ppSentToHO && !p.ppReceivedByHO).length
  const passComplete  = passportHandovers.filter(p => p.ppReceivedByHO).length

  const lowStock  = inventoryItems.filter(i => i.quantity > 0 && i.quantity <= i.minQuantity).length
  const outStock  = inventoryItems.filter(i => i.quantity === 0).length

  const urgentMed = medicalCases.filter(m => m.isUrgent).length
  const admitted  = medicalCases.filter(m => m.isAdmitted && !m.dischargedDate).length

  const exitDone  = exitInterviews.filter(e => !e.skipped).length
  const exitPct   = exitInterviews.length ? Math.round((exitDone / exitInterviews.length) * 100) : 0

  const deptCounts = useMemo(() => {
    const d: Record<string, number> = {}
    employees.forEach(e => { d[e.department] = (d[e.department] ?? 0) + 1 })
    return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 7)
  }, [employees])
  const maxDept = deptCounts[0]?.[1] ?? 1

  const recentLeave = [...leaveRequests]
    .sort((a, b) => b.departureDate.localeCompare(a.departureDate))
    .slice(0, 5)

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })

  const stageColors: Record<string, string> = {
    'Letter Submitted': '#f59e0b',
    'Exit Interview':   '#8b5cf6',
    'Ticket':           '#3b82f6',
    'Pending Departure':'#ef4444',
  }

  // ── Alerts: items that need attention ───────────────────────────────────
  const alerts: { id: string; color: string; bg: string; icon: string; title: string; body: string }[] = []
  if (outStock > 0)
    alerts.push({ id:'out-stock', color:'#dc2626', bg:'#fef2f2', icon:'📦',
      title: outStock + ' item' + (outStock > 1 ? 's' : '') + ' out of stock',
      body:'Check inventory — reorder required.' })
  if (lowStock > 0)
    alerts.push({ id:'low-stock', color:'#d97706', bg:'#fffbeb', icon:'⚠️',
      title: lowStock + ' item' + (lowStock > 1 ? 's' : '') + ' running low',
      body:'Stock below reorder level.' })
  if (urgentMed > 0)
    alerts.push({ id:'med-urgent', color:'#dc2626', bg:'#fef2f2', icon:'🚨',
      title: urgentMed + ' urgent medical case' + (urgentMed > 1 ? 's' : ''),
      body: admitted > 0 ? admitted + ' currently admitted.' : 'Requires follow-up.' })
  if (pending > 0)
    alerts.push({ id:'pending', color:'#7c3aed', bg:'#f5f3ff', icon:'📋',
      title: pending + ' employee record' + (pending > 1 ? 's' : '') + ' incomplete',
      body:'Missing NIC, Work Permit or other details.' })
  if (passAtHO > 0)
    alerts.push({ id:'pass-ho', color:'#2563eb', bg:'#eff6ff', icon:'🛂',
      title: passAtHO + ' passport' + (passAtHO > 1 ? 's' : '') + ' pending HO confirmation',
      body:'Awaiting received-by confirmation from HQ.' })
  if (noticeTerminations.length > 0)
    alerts.push({ id:'term', color:'#f59e0b', bg:'#fffbeb', icon:'📤',
      title: noticeTerminations.length + ' active termination' + (noticeTerminations.length > 1 ? 's' : ''),
      body:'Notices in progress — follow up required.' })

  return (
    <section className="dash-wrap">

      {/* ── Hero bar ─────────────────────────────────────────────────── */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <p className="dash-eyebrow">Thilafushi Industrial Complex</p>
          <h1 className="dash-title">HR Dashboard</h1>
          <p className="dash-date">{todayStr}</p>
        </div>
        <div className="dash-kpis">
          <div className="dash-kpi">
            <span className="dash-kpi-val">{employees.length}</span>
            <span className="dash-kpi-lbl">Total Staff</span>
          </div>
          <div className="dash-kpi-sep" />
          <div className="dash-kpi">
            <span className="dash-kpi-val" style={{ color:'#10b981' }}>{onSite}</span>
            <span className="dash-kpi-lbl">On Site</span>
          </div>
          <div className="dash-kpi-sep" />
          <div className="dash-kpi">
            <span className="dash-kpi-val" style={{ color:'#3b82f6' }}>{onLeave}</span>
            <span className="dash-kpi-lbl">On Leave</span>
          </div>
          <div className="dash-kpi-sep" />
          <div className="dash-kpi">
            <span className="dash-kpi-val" style={{ color: pending ? '#dc2626' : '#94a3b8' }}>{pending}</span>
            <span className="dash-kpi-lbl">Pending</span>
          </div>
        </div>
      </div>

      {/* ── Alerts row ───────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="dash-alerts">
          {alerts.map(a => (
            <div key={a.id} className="dash-alert-card" style={{ '--da-color': a.color, '--da-bg': a.bg } as React.CSSProperties}>
              <span className="da-icon">{a.icon}</span>
              <div className="da-text">
                <span className="da-title">{a.title}</span>
                <span className="da-body">{a.body}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <div className="dash-grid">

        {/* LEFT COLUMN */}
        <div className="dash-col">

          {/* Staff Presence */}
          <article className="dash-panel">
            <div className="dash-panel-hd">
              <span className="dash-panel-ttl">Staff Presence</span>
              <span className="dash-chip" style={{ background:'#f0fdf4', color:'#166534' }}>{onSitePct}% on site</span>
            </div>
            <div className="dash-presence-bar">
              <div style={{ flex: onSite  || 0.01, background:'#10b981' }} title={'On Site: ' + onSite} />
              <div style={{ flex: onLeave || 0.01, background:'#3b82f6' }} title={'On Leave: ' + onLeave} />
              <div style={{ flex: offSite || 0.01, background:'#f59e0b' }} title={'Off Site: ' + offSite} />
            </div>
            <div className="dash-presence-legend">
              {[['#10b981','On Site',onSite],['#3b82f6','On Leave',onLeave],['#f59e0b','Off Site',offSite]].map(([col,lbl,val]) => (
                <div key={lbl as string} className="dash-legend-item">
                  <span className="dash-dot" style={{ background: col as string }} />
                  <span className="dash-legend-val">{val as number}</span>
                  <span className="dash-legend-lbl">{lbl as string}</span>
                </div>
              ))}
            </div>
          </article>

          {/* Employees by Section */}
          <article className="dash-panel">
            <div className="dash-panel-hd">
              <span className="dash-panel-ttl">Employees by Section</span>
              <span className="dash-chip" style={{ background:'#ede9fe', color:'#6d28d9' }}>{deptCounts.length} sections</span>
            </div>
            {deptCounts.length === 0
              ? <p className="dash-empty">No employees added yet.</p>
              : <div className="dash-bars" style={{ marginTop: 6 }}>
                  {deptCounts.map(([dept, cnt]) => (
                    <div key={dept} className="dash-bar-row">
                      <span className="dash-bar-lbl">{dept}</span>
                      <div className="dash-bar-track">
                        <div className="dash-bar-fill" style={{ width: Math.round((cnt/maxDept)*100) + '%' }} />
                      </div>
                      <span className="dash-bar-num">{cnt}</span>
                    </div>
                  ))}
                </div>
            }
          </article>

          {/* Leave Activity */}
          <article className="dash-panel">
            <div className="dash-panel-hd">
              <span className="dash-panel-ttl">Leave Activity</span>
              <span className="dash-chip" style={{ background:'#f0f9ff', color:'#0284c7' }}>{leaveRequests.length} requests</span>
            </div>
            <div className="dash-leave-counts">
              {[
                { lbl:'Requests', val: leaveRequests.length,  c:'#0891b2', bg:'#f0f9ff' },
                { lbl:'Active',   val: activeLeaves.length,   c:'#7c3aed', bg:'#f5f3ff' },
                { lbl:'History',  val: leaveHistory.length,   c:'#475569', bg:'#f8fafc' },
              ].map(s => (
                <div key={s.lbl} className="dash-mini-stat" style={{ '--msc': s.c, '--msb': s.bg } as React.CSSProperties}>
                  <span className="dms-val">{s.val}</span>
                  <span className="dms-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
            {recentLeave.length > 0 && (
              <div className="dash-leave-list">
                {recentLeave.map(r => (
                  <div key={r.id} className="dash-leave-row">
                    <div className="dash-leave-info">
                      <span className="dash-leave-name">{r.name}</span>
                      <span className="dash-leave-meta">{leaveTypeLabel(r.leaveTypeCode)} · {formatDateDisplay(r.departureDate)}</span>
                    </div>
                    <StatusBadge status={r.step} />
                  </div>
                ))}
              </div>
            )}
          </article>

        </div>

        {/* RIGHT COLUMN */}
        <div className="dash-col">

          {/* Passport Tracker */}
          <article className="dash-panel">
            <div className="dash-panel-hd">
              <span className="dash-panel-ttl">Passport Tracker</span>
              <span className="dash-chip" style={{ background:'#f5f3ff', color:'#6d28d9' }}>{passportHandovers.length} tracked</span>
            </div>
            <div className="dash-pp-stats">
              {[
                { lbl:'With Staff', val: passWithStaff, c:'#2563eb', bg:'#eff6ff' },
                { lbl:'Returned',   val: passReturned,  c:'#d97706', bg:'#fffbeb' },
                { lbl:'At HO',      val: passAtHO,      c:'#7c3aed', bg:'#f5f3ff' },
                { lbl:'Complete',   val: passComplete,  c:'#16a34a', bg:'#dcfce7' },
              ].map(s => (
                <div key={s.lbl} className="dash-pp-stat" style={{ '--ppc': s.c, '--ppb': s.bg } as React.CSSProperties}>
                  <span className="dpp-val">{s.val}</span>
                  <span className="dpp-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
            {passportHandovers.length > 0 && (
              <div className="dash-pp-list">
                {passportHandovers.slice(0, 5).map(p => (
                  <div key={p.id} className="dash-pp-row">
                    <div className="dash-pp-info">
                      <span className="dash-pp-name">{p.name}</span>
                      <span className="dash-pp-dept">{p.department}</span>
                    </div>
                    <span className="dash-pp-badge" style={{
                      color:      p.ppReceivedByHO ? '#16a34a' : p.ppSentToHO ? '#7c3aed' : p.ppReturnedDate ? '#d97706' : '#2563eb',
                      background: p.ppReceivedByHO ? '#dcfce7' : p.ppSentToHO ? '#f5f3ff' : p.ppReturnedDate ? '#fffbeb' : '#eff6ff',
                    }}>
                      {p.ppReceivedByHO ? 'Complete' : p.ppSentToHO ? 'At HO' : p.ppReturnedDate ? 'Returned' : 'With Staff'}
                    </span>
                  </div>
                ))}
                {passportHandovers.length > 5 && <p className="dash-more">+{passportHandovers.length - 5} more</p>}
              </div>
            )}
          </article>

          {/* Inventory Health */}
          <article className="dash-panel">
            <div className="dash-panel-hd">
              <span className="dash-panel-ttl">Inventory Health</span>
              <span className="dash-chip" style={{
                background: outStock ? '#fef2f2' : lowStock ? '#fffbeb' : '#f0fdf4',
                color:       outStock ? '#dc2626' : lowStock ? '#92400e' : '#166534',
              }}>
                {outStock > 0 ? (outStock + ' out of stock') : lowStock > 0 ? (lowStock + ' low stock') : 'All stocked'}
              </span>
            </div>
            <div className="dash-inv-counts">
              {[
                { lbl:'Total Items',  val: inventoryItems.length, c:'#475569', bg:'#f8fafc' },
                { lbl:'Low Stock',    val: lowStock,  c: lowStock  ? '#d97706' : '#94a3b8', bg: lowStock  ? '#fffbeb' : '#f8fafc' },
                { lbl:'Out of Stock', val: outStock,  c: outStock  ? '#dc2626' : '#94a3b8', bg: outStock  ? '#fef2f2' : '#f8fafc' },
              ].map(s => (
                <div key={s.lbl} className="dash-mini-stat" style={{ '--msc': s.c, '--msb': s.bg } as React.CSSProperties}>
                  <span className="dms-val">{s.val}</span>
                  <span className="dms-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
            {(outStock > 0 || lowStock > 0) && (
              <div className="dash-inv-alerts">
                {inventoryItems.filter(i => i.quantity === 0).slice(0, 2).map(i => (
                  <div key={i.id} className="dash-inv-row">
                    <span className="dash-inv-name">{i.name}</span>
                    <span className="dash-inv-badge" style={{ color:'#dc2626', background:'#fef2f2' }}>OUT</span>
                  </div>
                ))}
                {inventoryItems.filter(i => i.quantity > 0 && i.quantity <= i.minQuantity).slice(0, 3).map(i => (
                  <div key={i.id} className="dash-inv-row">
                    <span className="dash-inv-name">{i.name}</span>
                    <span className="dash-inv-badge" style={{ color:'#d97706', background:'#fffbeb' }}>{i.quantity} {i.unit}</span>
                  </div>
                ))}
              </div>
            )}
            {outStock === 0 && lowStock === 0 && inventoryItems.length > 0 && (
              <p className="dash-ok">{'✓ All ' + inventoryItems.length + ' items sufficiently stocked.'}</p>
            )}
          </article>

          {/* Terminations + Medical */}
          <div className="dash-row-pair">

            <article className="dash-panel">
              <div className="dash-panel-hd">
                <span className="dash-panel-ttl">Terminations</span>
                <span className="dash-chip" style={{ background:'#fef3c7', color:'#92400e' }}>{noticeTerminations.length} active</span>
              </div>
              {noticeTerminations.length === 0
                ? <p className="dash-empty">No active notices.</p>
                : <div className="dash-term-list">
                    {noticeTerminations.slice(0, 4).map(t => (
                      <div key={t.id} className="dash-term-row">
                        <span className="dash-term-name">{t.name.split(' ')[0]}</span>
                        <span className="dash-term-stage" style={{
                          color:       stageColors[t.currentStage] || '#64748b',
                          background: (stageColors[t.currentStage] || '#94a3b8') + '20',
                        }}>{t.currentStage}</span>
                      </div>
                    ))}
                  </div>
              }
              <div className="dash-term-footer">{'✓ ' + completedTerminations.length + ' completed'}</div>
            </article>

            <article className="dash-panel">
              <div className="dash-panel-hd">
                <span className="dash-panel-ttl">Medical Cases</span>
                <span className="dash-chip" style={{ background: urgentMed ? '#fef2f2' : '#f0f9ff', color: urgentMed ? '#dc2626' : '#0284c7' }}>
                  {urgentMed > 0 ? (urgentMed + ' urgent') : (medicalCases.length + ' total')}
                </span>
              </div>
              <div className="dash-med-counts">
                <div className="dash-mini-stat" style={{ '--msc':'#475569', '--msb':'#f8fafc' } as React.CSSProperties}>
                  <span className="dms-val">{medicalCases.length}</span>
                  <span className="dms-lbl">Total</span>
                </div>
                <div className="dash-mini-stat" style={{ '--msc': urgentMed ? '#dc2626' : '#94a3b8', '--msb': urgentMed ? '#fef2f2' : '#f8fafc' } as React.CSSProperties}>
                  <span className="dms-val">{urgentMed}</span>
                  <span className="dms-lbl">Urgent</span>
                </div>
                <div className="dash-mini-stat" style={{ '--msc': admitted ? '#7c3aed' : '#94a3b8', '--msb': admitted ? '#f5f3ff' : '#f8fafc' } as React.CSSProperties}>
                  <span className="dms-val">{admitted}</span>
                  <span className="dms-lbl">Admitted</span>
                </div>
              </div>
            </article>

          </div>

          {/* Record Health + Exit Interviews */}
          <div className="dash-row-pair">

            <article className="dash-panel">
              <div className="dash-panel-hd">
                <span className="dash-panel-ttl">Record Health</span>
                <span className="dash-chip" style={{ background: pending ? '#fef2f2' : '#dcfce7', color: pending ? '#dc2626' : '#166534' }}>
                  {pending + ' pending'}
                </span>
              </div>
              <div className="dash-rh-bar">
                <div className="dash-rh-track">
                  <div className="dash-rh-fill" style={{ width: employees.length ? ((employees.length - pending) / employees.length * 100) + '%' : '0%' }} />
                </div>
                <span className="dash-rh-pct">{employees.length ? Math.round((employees.length - pending) / employees.length * 100) : 0}%</span>
              </div>
              <div className="dash-rh-labels">
                <span>{'✓ ' + (employees.length - pending) + ' complete'}</span>
                <span>{pending + ' missing fields'}</span>
              </div>
            </article>

            <article className="dash-panel">
              <div className="dash-panel-hd">
                <span className="dash-panel-ttl">Exit Interviews</span>
                <span className="dash-chip" style={{ background:'#f0fdf4', color:'#166534' }}>{exitPct}% done</span>
              </div>
              <div className="dash-rh-bar">
                <div className="dash-rh-track">
                  <div className="dash-rh-fill" style={{ width: exitPct + '%', background:'#22c55e' }} />
                </div>
                <span className="dash-rh-pct">{exitPct}%</span>
              </div>
              <div className="dash-rh-labels">
                <span>{'✓ ' + exitDone + ' done'}</span>
                <span>{exitInterviews.filter(e => e.skipped).length + ' skipped'}</span>
              </div>
            </article>

          </div>

        </div>
      </div>

    </section>
  )
}
