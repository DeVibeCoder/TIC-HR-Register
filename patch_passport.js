// ─── Passport Tracking complete redesign ────────────────────────────────────
const fs = require('fs');
let c = fs.readFileSync('hr-system-frontend/src/App.tsx', 'utf8');

// ── 1. Replace the type definition ──────────────────────────────────────────
const OLD_PP_TYPE = `type PassportHandoverRecord = LeaveBase & {
  passportStep: PassportStep
  givenDate?: string
  returnedDate?: string
  sentToHoDate?: string
  remarks: string
}`;
const NEW_PP_TYPE = `type PassportRecord = {
  id: string
  date: string
  employeeId: string
  name: string
  department: string
  nationality: string
  ppNo: string
  receivedFromHO: string
  purpose: string
  ppIssuedToStaff: string
  ppReturnedDate: string
  receivedBy: string
  ppSentToHO: string
  ppHandoverPerson: string
  ppReceivedByHO: string
  remarks: string
}
type PassportHandoverRecord = PassportRecord`;
if (!c.includes(OLD_PP_TYPE)) { console.error('Type not found'); process.exit(1); }
c = c.replace(OLD_PP_TYPE, NEW_PP_TYPE);
console.log('1. Type replaced');

// ── 2. Replace initial data ─────────────────────────────────────────────────
{
  const start  = c.indexOf('const initialPassportHandovers: PassportHandoverRecord[] = [');
  const end    = c.indexOf('\nconst initialNoticeTerminations', start);
  if (start === -1 || end === -1) { console.error('Data block not found'); process.exit(1); }
  const NEW_DATA = `const initialPassportHandovers: PassportRecord[] = [
  { id:'PP-2601-01', date:'2026-01-10', employeeId:'52527', name:'JAYASURYA SEKAR', department:'STORES', nationality:'INDIA', ppNo:'S9955670', receivedFromHO:'2026-01-10', purpose:'AL', ppIssuedToStaff:'2026-01-11', ppReturnedDate:'2026-02-20', receivedBy:'SHANTUMON', ppSentToHO:'2026-02-25', ppHandoverPerson:'MANOJ LAKSHITHA', ppReceivedByHO:'SONU', remarks:'' },
  { id:'PP-2601-02', date:'2026-01-10', employeeId:'53979', name:'NAVEEN SEKAR', department:'STORES', nationality:'INDIA', ppNo:'U7007933', receivedFromHO:'2026-01-10', purpose:'AL', ppIssuedToStaff:'2026-01-11', ppReturnedDate:'2026-02-20', receivedBy:'SHANTUMON', ppSentToHO:'2026-02-25', ppHandoverPerson:'MANOJ LAKSHITHA', ppReceivedByHO:'SONU', remarks:'' },
  { id:'PP-2601-03', date:'2026-01-10', employeeId:'34847', name:'ANOWAR', department:'STORES', nationality:'BANGLADESH', ppNo:'A12538258', receivedFromHO:'2026-01-10', purpose:'AL', ppIssuedToStaff:'2026-01-13', ppReturnedDate:'2026-02-21', receivedBy:'SHANTUMON', ppSentToHO:'2026-02-25', ppHandoverPerson:'MANOJ LAKSHITHA', ppReceivedByHO:'SONU', remarks:'' },
  { id:'PP-2601-04', date:'2026-01-10', employeeId:'54368', name:'SASIKUMAR SUDALAIYANDI', department:'CEMENT PLANT', nationality:'INDIA', ppNo:'U5709386', receivedFromHO:'2026-01-10', purpose:'AL', ppIssuedToStaff:'2026-01-14', ppReturnedDate:'2026-02-23', receivedBy:'SHANTUMON', ppSentToHO:'2026-02-25', ppHandoverPerson:'MANOJ LAKSHITHA', ppReceivedByHO:'SONU', remarks:'' },
  { id:'PP-2601-05', date:'2026-01-10', employeeId:'52807', name:'MD SHAKIL AHMED', department:'MAINTENANCE', nationality:'BANGLADESH', ppNo:'A03797308', receivedFromHO:'2026-01-10', purpose:'AL', ppIssuedToStaff:'2026-01-17', ppReturnedDate:'', receivedBy:'', ppSentToHO:'', ppHandoverPerson:'', ppReceivedByHO:'', remarks:'' },
  { id:'PP-2601-06', date:'2026-01-10', employeeId:'55484', name:'SAHIL CHETTRI', department:'LOSS PREVENTION', nationality:'INDIA', ppNo:'X5707789', receivedFromHO:'2026-01-10', purpose:'AL', ppIssuedToStaff:'2026-01-17', ppReturnedDate:'2026-03-07', receivedBy:'SHANTUMON', ppSentToHO:'2026-03-26', ppHandoverPerson:'JOEL BURGAIN', ppReceivedByHO:'SONU', remarks:'' },
  { id:'PP-2601-07', date:'2026-01-19', employeeId:'', name:'MD ALI', department:'ADMINISTRATION', nationality:'BANGLADESH', ppNo:'A19565772', receivedFromHO:'', purpose:'New Staff', ppIssuedToStaff:'', ppReturnedDate:'2026-01-19', receivedBy:'SHANTUMON', ppSentToHO:'2026-01-20', ppHandoverPerson:'SHANTUMON', ppReceivedByHO:'SONU', remarks:'' },
  { id:'PP-2601-08', date:'2026-01-19', employeeId:'', name:'MD MARUF', department:'ADMINISTRATION', nationality:'BANGLADESH', ppNo:'A13578328', receivedFromHO:'', purpose:'New Staff', ppIssuedToStaff:'', ppReturnedDate:'2026-01-19', receivedBy:'SHANTUMON', ppSentToHO:'2026-01-20', ppHandoverPerson:'SHANTUMON', ppReceivedByHO:'SONU', remarks:'' },
  { id:'PP-2601-09', date:'2026-01-19', employeeId:'', name:'SAYEM MOLLIK', department:'STORES', nationality:'BANGLADESH', ppNo:'A19033234', receivedFromHO:'', purpose:'New Staff', ppIssuedToStaff:'', ppReturnedDate:'2026-01-19', receivedBy:'SHANTUMON', ppSentToHO:'2026-01-20', ppHandoverPerson:'SHANTUMON', ppReceivedByHO:'SONU', remarks:'' },
  { id:'PP-2601-10', date:'2026-01-19', employeeId:'', name:'EMON AHMED', department:'STORES', nationality:'BANGLADESH', ppNo:'A06396736', receivedFromHO:'', purpose:'New Staff', ppIssuedToStaff:'', ppReturnedDate:'2026-01-19', receivedBy:'SHANTUMON', ppSentToHO:'2026-01-20', ppHandoverPerson:'SHANTUMON', ppReceivedByHO:'SONU', remarks:'' },
  { id:'PP-2601-11', date:'2026-01-19', employeeId:'', name:'LEWIS MARK ELISHA', department:'MAINTENANCE', nationality:'INDIA', ppNo:'N10584559', receivedFromHO:'', purpose:'New Staff', ppIssuedToStaff:'', ppReturnedDate:'2026-01-19', receivedBy:'SHANTUMON', ppSentToHO:'2026-01-20', ppHandoverPerson:'SHANTUMON', ppReceivedByHO:'SONU', remarks:'' },
  { id:'PP-2601-12', date:'2026-01-20', employeeId:'', name:'RASHVIN VETRIVEL', department:'MAINTENANCE', nationality:'INDIA', ppNo:'W0825786', receivedFromHO:'', purpose:'New Staff', ppIssuedToStaff:'', ppReturnedDate:'', receivedBy:'SHANTUMON', ppSentToHO:'', ppHandoverPerson:'IRNAS', ppReceivedByHO:'', remarks:'' },
  { id:'PP-2601-13', date:'2026-01-20', employeeId:'', name:'POLGAMPOLA RALALAGE NIMESH SUDARSHANA', department:'MAINTENANCE', nationality:'SRI LANKAN', ppNo:'N7037718', receivedFromHO:'', purpose:'New Staff', ppIssuedToStaff:'', ppReturnedDate:'2026-01-20', receivedBy:'SHANTUMON', ppSentToHO:'2026-01-20', ppHandoverPerson:'SHANTUMON', ppReceivedByHO:'SONU', remarks:'' },
  { id:'PP-2602-01', date:'2026-02-10', employeeId:'57464', name:'JEGATHEESHWARAN CHIKKANNAN', department:'MECHANICAL', nationality:'INDIA', ppNo:'T6614920', receivedFromHO:'2026-02-15', purpose:'AL', ppIssuedToStaff:'2026-02-19', ppReturnedDate:'', receivedBy:'', ppSentToHO:'', ppHandoverPerson:'', ppReceivedByHO:'', remarks:'' },
]`;
  c = c.slice(0, start) + NEW_DATA + c.slice(end);
  console.log('2. Initial data replaced');
}

// ── 3. Replace PassportHandoverModal ────────────────────────────────────────
{
  const start = c.indexOf('function PassportHandoverModal({');
  const end   = c.indexOf('\nfunction PassportTrackingSection', start);
  if (start === -1 || end === -1) { console.error('Modal bounds not found', start, end); process.exit(1); }
  const NEW_MODAL = `function PassportHandoverModal({
  record, employees, onClose, onSave,
}: {
  record: PassportRecord
  employees: Employee[]
  onClose: () => void
  onSave: (r: PassportRecord) => void
}) {
  const isNew = record.id.startsWith('PP-new')
  const [empSearch, setEmpSearch] = useState(record.name ? (record.employeeId ? \`\${record.name} (\${record.employeeId})\` : record.name) : '')
  const [showEmpDrop, setShowEmpDrop] = useState(false)
  const [empId,          setEmpId]          = useState(record.employeeId)
  const [name,           setName]           = useState(record.name)
  const [dept,           setDept]           = useState(record.department)
  const [nat,            setNat]            = useState(record.nationality)
  const [ppNo,           setPpNo]           = useState(record.ppNo)
  const [date,           setDate]           = useState(record.date || new Date().toISOString().slice(0,10))
  const [purpose,        setPurpose]        = useState(record.purpose || 'AL')
  const [recvFromHO,     setRecvFromHO]     = useState(record.receivedFromHO)
  const [issuedToStaff,  setIssuedToStaff]  = useState(record.ppIssuedToStaff)
  const [returnedDate,   setReturnedDate]   = useState(record.ppReturnedDate)
  const [receivedBy,     setReceivedBy]     = useState(record.receivedBy)
  const [sentToHO,       setSentToHO]       = useState(record.ppSentToHO)
  const [handoverPerson, setHandoverPerson] = useState(record.ppHandoverPerson)
  const [recvByHO,       setRecvByHO]       = useState(record.ppReceivedByHO)
  const [remarks,        setRemarks]        = useState(record.remarks)

  const empResults = useMemo(() => {
    const q = empSearch.trim().toLowerCase()
    if (!q || q.includes('(')) return []
    return employees.filter(e => e.fullName.toLowerCase().includes(q) || e.employeeId.includes(q)).slice(0, 8)
  }, [empSearch, employees])

  const pickEmp = (e: Employee) => {
    setEmpId(e.employeeId); setName(e.fullName); setDept(e.department); setNat(e.nationality)
    setPpNo(e.nicPassportNo)
    setEmpSearch(\`\${e.fullName} (\${e.employeeId})\`)
    setShowEmpDrop(false)
  }

  const save = () => onSave({ ...record,
    id: isNew ? \`PP-\${Date.now()}\` : record.id,
    date, employeeId: empId, name, department: dept, nationality: nat, ppNo,
    receivedFromHO: recvFromHO, purpose, ppIssuedToStaff: issuedToStaff,
    ppReturnedDate: returnedDate, receivedBy, ppSentToHO: sentToHO,
    ppHandoverPerson: handoverPerson, ppReceivedByHO: recvByHO, remarks,
  })

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal pp-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div><p className="eyebrow">Passport Record</p><h2>{isNew ? 'Add Passport Record' : 'Edit Passport Record'}</h2></div>
          <button className="icon-button" onClick={onClose} type="button">✕</button>
        </div>

        {/* Employee */}
        <div className="pp-modal-section">
          <div className="pp-modal-section-label">Employee Details</div>
          <div className="pp-modal-grid">
            <label className="ef-span2" style={{ position:'relative' }}>
              <span>Search Employee (optional for new staff)</span>
              <input value={empSearch} onChange={e => { setEmpSearch(e.target.value); setEmpId(''); setShowEmpDrop(true) }}
                onFocus={() => setShowEmpDrop(true)} onBlur={() => setTimeout(()=>setShowEmpDrop(false),150)}
                placeholder="Type name or employee ID…" autoComplete="off" />
              {showEmpDrop && empResults.length > 0 && (
                <div className="ei-emp-dropdown">
                  {empResults.map(e => (
                    <div key={e.employeeId} className="ei-emp-option" onMouseDown={() => pickEmp(e)}>
                      <strong>{e.fullName}</strong><span>{e.employeeId} · {e.department}</span>
                    </div>
                  ))}
                </div>
              )}
            </label>
            <label><span>Entry Date</span><input type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>
            <label><span>Passport / PP No</span><input value={ppNo} onChange={e=>setPpNo(e.target.value)} placeholder="Passport number" /></label>
            <label><span>Purpose</span>
              <select value={purpose} onChange={e=>setPurpose(e.target.value)}>
                {['AL','New Staff','Embassy','Other'].map(p=><option key={p}>{p}</option>)}
              </select>
            </label>
            {!empId && <label><span>Full Name</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter manually if not in system" /></label>}
          </div>
        </div>

        {/* Phase 1 */}
        <div className="pp-modal-section pp-recv-section">
          <div className="pp-modal-section-label pp-recv-label">📥 Receiving Passport from HO</div>
          <div className="pp-modal-grid">
            <label><span>Received From HO</span><input type="date" value={recvFromHO} onChange={e=>setRecvFromHO(e.target.value)} /></label>
            <label><span>PP Issued to Staff</span><input type="date" value={issuedToStaff} onChange={e=>setIssuedToStaff(e.target.value)} /></label>
          </div>
        </div>

        {/* Phase 2 */}
        <div className="pp-modal-section pp-send-section">
          <div className="pp-modal-section-label pp-send-label">📤 Sending Passport to HO</div>
          <div className="pp-modal-grid">
            <label><span>PP Returned by Staff</span><input type="date" value={returnedDate} onChange={e=>setReturnedDate(e.target.value)} /></label>
            <label><span>Received By (HR)</span><input value={receivedBy} onChange={e=>setReceivedBy(e.target.value)} placeholder="HR staff name" /></label>
            <label><span>PP Sent to HO</span><input type="date" value={sentToHO} onChange={e=>setSentToHO(e.target.value)} /></label>
            <label><span>Handover Person (HO)</span><input value={handoverPerson} onChange={e=>setHandoverPerson(e.target.value)} placeholder="Name at HO" /></label>
            <label><span>PP Received by (HO)</span><input value={recvByHO} onChange={e=>setRecvByHO(e.target.value)} placeholder="HO receiver name" /></label>
            <label><span>Remarks</span><input value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Optional" /></label>
          </div>
        </div>

        <div className="modal-actions">
          <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
          <button className="primary-button" onClick={save} type="button">{isNew ? 'Add Record' : 'Save Changes'}</button>
        </div>
      </section>
    </div>
  )
}`;
  c = c.slice(0, start) + NEW_MODAL + c.slice(end);
  console.log('3. Modal replaced');
}

// ── 4. Replace PassportTrackingSection ────────────────────────────────────
{
  const start = c.indexOf('function PassportTrackingSection({ records, employees, onUpdate }: {');
  const end   = c.indexOf('\nfunction MedicalCaseModal', start);
  if (start === -1 || end === -1) { console.error('Section bounds not found', start, end); process.exit(1); }

  const NEW_SECTION = `function PassportTrackingSection({ records, employees, onUpdate }: {
  records: PassportRecord[]
  employees: Employee[]
  onUpdate: (fn: (prev: PassportRecord[]) => PassportRecord[]) => void
}) {
  const [search,  setSearch]  = useState('')
  const [purpose, setPurpose] = useState('All')
  const [editing, setEditing] = useState<PassportRecord | null>(null)

  const passStatus = (r: PassportRecord) => {
    if (r.ppReceivedByHO)                                    return { label:'Complete',    color:'#16a34a', bg:'#dcfce7' }
    if (r.ppSentToHO)                                        return { label:'Sent to HO',  color:'#7c3aed', bg:'#f5f3ff' }
    if (r.ppReturnedDate)                                    return { label:'Returned',     color:'#d97706', bg:'#fef3c7' }
    if (r.ppIssuedToStaff || (r.purpose==='AL'&&r.receivedFromHO)) return { label:'With Staff', color:'#2563eb', bg:'#eff6ff' }
    return { label:'Pending', color:'#94a3b8', bg:'#f8fafc' }
  }

  const filtered = useMemo(() => records.filter(r => {
    const txt = [r.employeeId, r.name, r.department, r.ppNo, r.purpose].join(' ').toLowerCase()
    return txt.includes(search.trim().toLowerCase()) && (purpose === 'All' || r.purpose === purpose)
  }).sort((a,b) => b.date.localeCompare(a.date)), [records, search, purpose])

  const save = (r: PassportRecord) => {
    onUpdate(prev => prev.some(x=>x.id===r.id) ? prev.map(x=>x.id===r.id?r:x) : [r,...prev])
    setEditing(null)
  }
  const del = (id: string) => { if(window.confirm('Delete this passport record?')) onUpdate(prev=>prev.filter(r=>r.id!==id)) }

  const newRec = (): PassportRecord => ({
    id:'PP-new', date:new Date().toISOString().slice(0,10),
    employeeId:'', name:'', department:'', nationality:'', ppNo:'',
    receivedFromHO:'', purpose:'AL', ppIssuedToStaff:'',
    ppReturnedDate:'', receivedBy:'', ppSentToHO:'',
    ppHandoverPerson:'', ppReceivedByHO:'', remarks:'',
  })

  const statCards = [
    { label:'Total',      val: records.length,                                                                   c:'#475569', bg:'#f8fafc' },
    { label:'With Staff', val: records.filter(r => r.ppIssuedToStaff && !r.ppReturnedDate).length,              c:'#2563eb', bg:'#eff6ff' },
    { label:'Returned',   val: records.filter(r => r.ppReturnedDate && !r.ppSentToHO).length,                   c:'#d97706', bg:'#fef3c7' },
    { label:'Sent to HO', val: records.filter(r => r.ppSentToHO && !r.ppReceivedByHO).length,                   c:'#7c3aed', bg:'#f5f3ff' },
    { label:'Complete',   val: records.filter(r => r.ppReceivedByHO).length,                                    c:'#16a34a', bg:'#dcfce7' },
  ]

  return (
    <section className="employee-workspace pp-workspace">

      <div className="pp-stat-strip">
        {statCards.map(s => (
          <div key={s.label} className="pp-stat-card" style={{ background:s.bg }}>
            <span style={{ fontSize:'1.4rem', fontWeight:800, color:s.c, lineHeight:1 }}>{s.val}</span>
            <span style={{ fontSize:'0.67rem', color:'#64748b', marginTop:2 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="table-toolbar leave-toolbar leave-toolbar-has-btn" style={{ flexWrap:'wrap', gap:'6px 10px' }}>
        <label className="search-field" style={{ flex:'1 1 200px' }}>
          <span>Search</span>
          <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, Emp ID, PP No" />
        </label>
        <label style={{ flex:'0 0 auto' }}>
          <span>Purpose</span>
          <select value={purpose} onChange={e=>setPurpose(e.target.value)}>
            {['All','AL','New Staff','Embassy','Other'].map(p=><option key={p}>{p}</option>)}
          </select>
        </label>
        <button className="pp-add-btn" onClick={()=>setEditing(newRec())} type="button">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Record
        </button>
      </div>

      <div className="employee-table-shell compact-scroll">
        <table className="data-table pp-table">
          <thead>
            <tr className="pp-thead-group">
              <th colSpan={8} className="pp-th-recv">📥 RECEIVING PASSPORT FROM HO</th>
              <th colSpan={6} className="pp-th-send">📤 SENDING PASSPORT TO HO</th>
              <th className="pp-th-action" style={{ verticalAlign:'middle' }}>Actions</th>
            </tr>
            <tr>
              <th>Date</th><th>Emp ID</th><th style={{ minWidth:140 }}>Name</th><th>Section</th>
              <th>PP No</th><th style={{ whiteSpace:'nowrap' }}>From HO</th><th>Purpose</th><th style={{ whiteSpace:'nowrap' }}>Issued to Staff</th>
              <th>Status</th>
              <th style={{ whiteSpace:'nowrap' }}>Returned</th><th style={{ whiteSpace:'nowrap' }}>Recv By</th>
              <th style={{ whiteSpace:'nowrap' }}>Sent to HO</th><th>Handover</th><th style={{ whiteSpace:'nowrap' }}>HO Confirm</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const st = passStatus(r)
              return (
                <tr key={r.id}>
                  <td style={{ whiteSpace:'nowrap', color:'#475569', fontSize:'0.77rem' }}>{r.date ? formatDateDisplay(r.date) : '—'}</td>
                  <td style={{ fontWeight:600, color:'#1e40af', fontSize:'0.77rem' }}>{r.employeeId || '—'}</td>
                  <td style={{ fontWeight:600, color:'#0f172a', fontSize:'0.82rem' }}>{r.name}</td>
                  <td style={{ color:'#64748b', fontSize:'0.75rem' }}>{r.department || '—'}</td>
                  <td style={{ fontFamily:'monospace', fontSize:'0.8rem', color:'#0f172a', fontWeight:700 }}>{r.ppNo || '—'}</td>
                  <td style={{ whiteSpace:'nowrap', color:'#475569', fontSize:'0.77rem' }}>{r.receivedFromHO ? formatDateDisplay(r.receivedFromHO) : '—'}</td>
                  <td>
                    <span style={{ fontSize:'0.71rem', fontWeight:700, padding:'2px 8px', borderRadius:20,
                      background: r.purpose==='AL'?'#eff6ff':r.purpose==='New Staff'?'#f0fdf4':'#f8fafc',
                      color:      r.purpose==='AL'?'#1d4ed8':r.purpose==='New Staff'?'#15803d':'#64748b' }}>
                      {r.purpose||'—'}
                    </span>
                  </td>
                  <td style={{ whiteSpace:'nowrap', color:'#475569', fontSize:'0.77rem' }}>{r.ppIssuedToStaff ? formatDateDisplay(r.ppIssuedToStaff) : '—'}</td>
                  <td>
                    <span style={{ fontSize:'0.71rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background:st.bg, color:st.color, whiteSpace:'nowrap' }}>
                      {st.label}
                    </span>
                  </td>
                  <td style={{ whiteSpace:'nowrap', color:'#475569', fontSize:'0.77rem' }}>{r.ppReturnedDate ? formatDateDisplay(r.ppReturnedDate) : '—'}</td>
                  <td style={{ color:'#64748b', fontSize:'0.75rem' }}>{r.receivedBy || '—'}</td>
                  <td style={{ whiteSpace:'nowrap', color:'#475569', fontSize:'0.77rem' }}>{r.ppSentToHO ? formatDateDisplay(r.ppSentToHO) : '—'}</td>
                  <td style={{ color:'#64748b', fontSize:'0.75rem' }}>{r.ppHandoverPerson || '—'}</td>
                  <td style={{ color: r.ppReceivedByHO ? '#16a34a' : '#94a3b8', fontWeight: r.ppReceivedByHO ? 700 : 400, fontSize:'0.75rem' }}>
                    {r.ppReceivedByHO || '—'}
                  </td>
                  <td>
                    <div className="row-actions request-inline-actions">
                      <button className="action-glyph edit"   onClick={()=>setEditing(r)}  type="button" title="Edit">✎</button>
                      <button className="action-glyph delete" onClick={()=>del(r.id)}      type="button" title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="leave-empty-zone">No passport records found. Click "+ Add Record" to get started.</div>}
      {editing && <PassportHandoverModal record={editing} employees={employees} onClose={()=>setEditing(null)} onSave={save} />}
    </section>
  )
}`;
  c = c.slice(0, start) + NEW_SECTION + c.slice(end);
  console.log('4. Section replaced');
}

// ── 5. Fix OverviewPage passport stat computations ───────────────────────
c = c.replace(
  `const passHeld   = passportHandovers.filter(p => p.passportStep === 'Collected').length\n  const passSentHO = passportHandovers.filter(p => p.passportStep === 'Sent to HO').length`,
  `const passHeld   = passportHandovers.filter(p => p.ppIssuedToStaff && !p.ppReturnedDate).length\n  const passSentHO = passportHandovers.filter(p => p.ppSentToHO && !p.ppReceivedByHO).length`
);

// Fix the passport detail panel stat boxes in OverviewPage
c = c.replace(
  `{ label:'Issued',    val: passportHandovers.filter(p=>p.passportStep==='Issued').length,    c:'#2563eb', bg:'#eff6ff' },`,
  `{ label:'With Staff', val: passHeld, c:'#2563eb', bg:'#eff6ff' },`
);
c = c.replace(
  `{ label:'Collected', val: passHeld,                                                          c:'#d97706', bg:'#fffbeb' },`,
  `{ label:'Returned',  val: passportHandovers.filter(p=>p.ppReturnedDate&&!p.ppSentToHO).length, c:'#d97706', bg:'#fffbeb' },`
);

// Fix mini-strip passport footer stats
c = c.replace(`<span>{passHeld} held</span>`, `<span>{passHeld} with staff</span>`);

// ── 6. Fix ActivitiesPage props type ────────────────────────────────────
c = c.replace(
  `  passportHandovers: PassportHandoverRecord[]\n  onUpdatePassport: (fn: (prev: PassportHandoverRecord[]) => PassportHandoverRecord[]) => void`,
  `  passportHandovers: PassportRecord[]\n  onUpdatePassport: (fn: (prev: PassportRecord[]) => PassportRecord[]) => void`
);

// ── 7. Fix App state type ─────────────────────────────────────────────────
c = c.replace(
  `useState<PassportHandoverRecord[]>(() => loadStore('tic_passport', initialPassportHandovers))`,
  `useState<PassportRecord[]>(() => loadStore('tic_passport', initialPassportHandovers))`
);

fs.writeFileSync('hr-system-frontend/src/App.tsx', c, 'utf8');
console.log('Passport redesign complete.');
