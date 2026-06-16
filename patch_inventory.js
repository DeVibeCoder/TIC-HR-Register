// ─── Inventory redesign: add Refresher category + Orders ────────────────────
const fs = require('fs');
let c = fs.readFileSync('hr-system-frontend/src/App.tsx', 'utf8');

// 1. Add Refresher to category type
c = c.replace(
  `type InventoryCategory = 'Stationery' | 'Medical'`,
  `type InventoryCategory = 'Stationery' | 'Medical' | 'Refresher'`
);

// 2. Add StoreOrder type after InventoryUsageRecord type
const ORD_TYPE = `
type StoreOrderItem = { itemId: string; itemName: string; quantity: number; unit: string }
type StoreOrder = {
  id: string
  orderDate: string
  orderedBy: string
  orderType: 'Store Order' | 'Bulk Request'
  category: InventoryCategory
  items: StoreOrderItem[]
  status: 'Pending' | 'Received' | 'Partial'
  receivedDate: string
  receivedBy: string
  remarks: string
}
`;
const ORD_INSERT_AFTER = `  remarks: string
}

type OffSiteRecord`;
c = c.replace(ORD_INSERT_AFTER, `  remarks: string
}\n${ORD_TYPE}\ntype OffSiteRecord`);
console.log('1-2. Types updated');

// 3. Replace initialInventoryItems
{
  const start = c.indexOf('const initialInventoryItems: InventoryItem[] = [');
  const end   = c.indexOf('\nconst initialInventoryUsage', start);
  if (start === -1 || end === -1) { console.error('Items data not found'); process.exit(1); }
  const NEW_ITEMS = `const initialInventoryItems: InventoryItem[] = [
  // ─── Stationery ─────────────────────────────────────────────────────────
  { id:'ST-001', name:'A4 Paper', category:'Stationery', quantity:20, unit:'reams', minQuantity:5, location:'HR Storeroom', lastUpdated:'2026-05-20', remarks:'500 sheets per ream' },
  { id:'ST-002', name:'Printer Cartridge (HP Black)', category:'Stationery', quantity:3, unit:'pcs', minQuantity:2, location:'HR Office', lastUpdated:'2026-05-18', remarks:'' },
  { id:'ST-003', name:'Ball Pen (Blue)', category:'Stationery', quantity:80, unit:'pcs', minQuantity:20, location:'HR Storeroom', lastUpdated:'2026-04-25', remarks:'' },
  { id:'ST-004', name:'Staples', category:'Stationery', quantity:6, unit:'boxes', minQuantity:2, location:'HR Office', lastUpdated:'2026-04-10', remarks:'Standard 26/6 size' },
  { id:'ST-005', name:'Tissue Box', category:'Stationery', quantity:4, unit:'boxes', minQuantity:2, location:'HR Office', lastUpdated:'2026-05-01', remarks:'' },
  { id:'ST-006', name:'Face Mask', category:'Stationery', quantity:50, unit:'pcs', minQuantity:20, location:'HR Office', lastUpdated:'2026-05-15', remarks:'Surgical 3-ply' },
  { id:'ST-007', name:'Stapler', category:'Stationery', quantity:5, unit:'pcs', minQuantity:2, location:'HR Office', lastUpdated:'2026-03-15', remarks:'Non-consumable' },
  { id:'ST-008', name:'Paper Punch', category:'Stationery', quantity:3, unit:'pcs', minQuantity:1, location:'HR Office', lastUpdated:'2026-03-01', remarks:'Non-consumable' },
  { id:'ST-009', name:'Stamp Pad & Ink', category:'Stationery', quantity:2, unit:'pcs', minQuantity:1, location:'HR Office', lastUpdated:'2026-04-01', remarks:'Non-consumable' },
  { id:'ST-010', name:'Whiteboard Marker', category:'Stationery', quantity:8, unit:'pcs', minQuantity:4, location:'HR Office', lastUpdated:'2026-05-05', remarks:'' },
  // ─── Medical ────────────────────────────────────────────────────────────
  { id:'MD-001', name:'Panadol (500mg)', category:'Medical', quantity:60, unit:'tablets', minQuantity:20, location:'HR Office', lastUpdated:'2026-05-10', remarks:'For basic first aid. Do not dispense directly.' },
  { id:'MD-002', name:'Dolo 650 (650mg)', category:'Medical', quantity:40, unit:'tablets', minQuantity:15, location:'HR Office', lastUpdated:'2026-05-10', remarks:'High-dose paracetamol' },
  { id:'MD-003', name:'Penadine (Cough Syrup)', category:'Medical', quantity:8, unit:'bottles', minQuantity:3, location:'HR Office', lastUpdated:'2026-05-01', remarks:'100ml bottles' },
  { id:'MD-004', name:'Pantaz (Pantoprazole 40mg)', category:'Medical', quantity:30, unit:'tablets', minQuantity:10, location:'HR Office', lastUpdated:'2026-05-01', remarks:'For acidity/gastric' },
  { id:'MD-005', name:'Betadine (Antiseptic)', category:'Medical', quantity:5, unit:'bottles', minQuantity:2, location:'HR Office', lastUpdated:'2026-04-20', remarks:'100ml bottles' },
  { id:'MD-006', name:'Dettol (Antiseptic Liquid)', category:'Medical', quantity:4, unit:'bottles', minQuantity:2, location:'HR Office', lastUpdated:'2026-04-20', remarks:'500ml bottles' },
  { id:'MD-007', name:'Cotton (Absorbent)', category:'Medical', quantity:8, unit:'rolls', minQuantity:3, location:'HR Office', lastUpdated:'2026-04-15', remarks:'' },
  { id:'MD-008', name:'Bandage', category:'Medical', quantity:15, unit:'rolls', minQuantity:5, location:'HR Office', lastUpdated:'2026-05-01', remarks:'Assorted sizes' },
  { id:'MD-009', name:'Plaster (Band-Aid)', category:'Medical', quantity:3, unit:'boxes', minQuantity:1, location:'HR Office', lastUpdated:'2026-04-10', remarks:'Box of 100' },
  { id:'MD-010', name:'Eno (Antacid Sachets)', category:'Medical', quantity:20, unit:'sachets', minQuantity:8, location:'HR Office', lastUpdated:'2026-05-05', remarks:'' },
  { id:'MD-011', name:'Strepsils (Throat Lozenges)', category:'Medical', quantity:6, unit:'packs', minQuantity:2, location:'HR Office', lastUpdated:'2026-05-05', remarks:'16-lozenge packs' },
  { id:'MD-012', name:'Sunlyte ORS Sachets', category:'Medical', quantity:25, unit:'sachets', minQuantity:10, location:'HR Office', lastUpdated:'2026-05-05', remarks:'Oral rehydration salts' },
  // ─── Refresher ──────────────────────────────────────────────────────────
  { id:'RF-001', name:'Coffee Powder', category:'Refresher', quantity:3, unit:'tins', minQuantity:1, location:'HR Office', lastUpdated:'2026-05-28', remarks:'200g tins' },
  { id:'RF-002', name:'Tea Bags', category:'Refresher', quantity:2, unit:'boxes', minQuantity:1, location:'HR Office', lastUpdated:'2026-05-28', remarks:'Box of 100' },
  { id:'RF-003', name:'Milo Powder', category:'Refresher', quantity:2, unit:'tins', minQuantity:1, location:'HR Office', lastUpdated:'2026-05-20', remarks:'400g tins' },
  { id:'RF-004', name:'Powdered Milk', category:'Refresher', quantity:4, unit:'sachets', minQuantity:2, location:'HR Office', lastUpdated:'2026-05-20', remarks:'Coffeemate sachets' },
  { id:'RF-005', name:'Sugar', category:'Refresher', quantity:2, unit:'kg', minQuantity:1, location:'HR Office', lastUpdated:'2026-05-25', remarks:'' },
  { id:'RF-006', name:'Disposable Cups', category:'Refresher', quantity:80, unit:'pcs', minQuantity:30, location:'HR Office', lastUpdated:'2026-05-22', remarks:'' },
  { id:'RF-007', name:'Plastic Spoons', category:'Refresher', quantity:50, unit:'pcs', minQuantity:20, location:'HR Office', lastUpdated:'2026-05-22', remarks:'' },
]`;
  c = c.slice(0, start) + NEW_ITEMS + c.slice(end);
  console.log('3. Items updated');
}

// 4. Replace initialInventoryUsage
{
  const start = c.indexOf('const initialInventoryUsage: InventoryUsageRecord[] = [');
  const end   = c.indexOf('\nconst initialVisitRecords', start);
  if (start === -1 || end === -1) { console.error('Usage data not found'); process.exit(1); }
  const NEW_USAGE = `const initialInventoryUsage: InventoryUsageRecord[] = [
  { id:'USG-001', itemId:'ST-001', itemName:'A4 Paper', quantityUsed:3, unit:'reams', usedBy:'SHANTUMON PATHIYIL CHACKO', employeeId:'58692', department:'HUMAN RESOURCES', usedDate:'2026-05-18', purpose:'HR documentation printing', remarks:'' },
  { id:'USG-002', itemId:'ST-002', itemName:'Printer Cartridge (HP Black)', quantityUsed:1, unit:'pcs', usedBy:'SHANTUMON PATHIYIL CHACKO', employeeId:'58692', department:'HUMAN RESOURCES', usedDate:'2026-05-10', purpose:'HR printer replacement', remarks:'' },
  { id:'USG-003', itemId:'ST-003', itemName:'Ball Pen (Blue)', quantityUsed:20, unit:'pcs', usedBy:'SHANTUMON PATHIYIL CHACKO', employeeId:'58692', department:'HUMAN RESOURCES', usedDate:'2026-04-25', purpose:'Office stationery distribution', remarks:'' },
  { id:'USG-004', itemId:'MD-007', itemName:'Cotton (Absorbent)', quantityUsed:2, unit:'rolls', usedBy:'ABHISHEK CHETRY', employeeId:'55426', department:'LOSS PREVENTION', usedDate:'2026-05-27', purpose:'First aid box restock — Loss Prevention', remarks:'Issued to LP first aid box' },
  { id:'USG-005', itemId:'MD-008', itemName:'Bandage', quantityUsed:3, unit:'rolls', usedBy:'ABHISHEK CHETRY', employeeId:'55426', department:'LOSS PREVENTION', usedDate:'2026-05-27', purpose:'Knee injury dressing — worksite', remarks:'Issued to LP first aid box' },
  { id:'USG-006', itemId:'MD-005', itemName:'Betadine (Antiseptic)', quantityUsed:1, unit:'bottles', usedBy:'ABHISHEK CHETRY', employeeId:'55426', department:'LOSS PREVENTION', usedDate:'2026-04-30', purpose:'First aid box refill', remarks:'Issued to LP first aid box' },
  { id:'USG-007', itemId:'MD-001', itemName:'Panadol (500mg)', quantityUsed:10, unit:'tablets', usedBy:'ABHISHEK CHETRY', employeeId:'55426', department:'LOSS PREVENTION', usedDate:'2026-05-10', purpose:'Distributed to security first aid boxes', remarks:'Issued to LP first aid box' },
  { id:'USG-008', itemId:'RF-001', itemName:'Coffee Powder', quantityUsed:1, unit:'tins', usedBy:'SHANTUMON PATHIYIL CHACKO', employeeId:'58692', department:'HUMAN RESOURCES', usedDate:'2026-05-15', purpose:'Office refreshment', remarks:'' },
  { id:'USG-009', itemId:'RF-006', itemName:'Disposable Cups', quantityUsed:20, unit:'pcs', usedBy:'SHANTUMON PATHIYIL CHACKO', employeeId:'58692', department:'HUMAN RESOURCES', usedDate:'2026-05-22', purpose:'Office use', remarks:'' },
]
const initialStoreOrders: StoreOrder[] = [
  { id:'ORD-001', orderDate:'2026-05-05', orderedBy:'SHANTUMON PATHIYIL CHACKO', orderType:'Store Order', category:'Medical', items:[{ itemId:'MD-007', itemName:'Cotton (Absorbent)', quantity:10, unit:'rolls' }, { itemId:'MD-008', itemName:'Bandage', quantity:20, unit:'rolls' }, { itemId:'MD-009', itemName:'Plaster (Band-Aid)', quantity:5, unit:'boxes' }], status:'Received', receivedDate:'2026-05-07', receivedBy:'SHANTUMON PATHIYIL CHACKO', remarks:'Monthly medical restock' },
  { id:'ORD-002', orderDate:'2026-05-20', orderedBy:'SHANTUMON PATHIYIL CHACKO', orderType:'Store Order', category:'Stationery', items:[{ itemId:'ST-001', itemName:'A4 Paper', quantity:20, unit:'reams' }, { itemId:'ST-003', itemName:'Ball Pen (Blue)', quantity:100, unit:'pcs' }], status:'Received', receivedDate:'2026-05-22', receivedBy:'SHANTUMON PATHIYIL CHACKO', remarks:'' },
  { id:'ORD-003', orderDate:'2026-06-02', orderedBy:'SHANTUMON PATHIYIL CHACKO', orderType:'Store Order', category:'Medical', items:[{ itemId:'MD-001', itemName:'Panadol (500mg)', quantity:100, unit:'tablets' }, { itemId:'MD-012', itemName:'Sunlyte ORS Sachets', quantity:30, unit:'sachets' }], status:'Pending', receivedDate:'', receivedBy:'', remarks:'Low stock reorder' },
  { id:'ORD-004', orderDate:'2026-06-05', orderedBy:'SHANTUMON PATHIYIL CHACKO', orderType:'Bulk Request', category:'Refresher', items:[{ itemId:'RF-001', itemName:'Coffee Powder', quantity:6, unit:'tins' }, { itemId:'RF-002', itemName:'Tea Bags', quantity:4, unit:'boxes' }, { itemId:'RF-003', itemName:'Milo Powder', quantity:4, unit:'tins' }], status:'Pending', receivedDate:'', receivedBy:'', remarks:'Not available at main store — bulk purchase request' },
]`;
  c = c.slice(0, start) + NEW_USAGE + c.slice(end);
  console.log('4. Usage + orders data updated');
}

// 5. Update App state to add inventoryOrders
const APP_STATE_INV = `  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => loadStore('tic_inventory_items', initialInventoryItems))`;
c = c.replace(APP_STATE_INV, APP_STATE_INV + `\n  const [inventoryOrders, setInventoryOrders] = useState<StoreOrder[]>(() => loadStore('tic_inv_orders', initialStoreOrders))`);

// 6. Update ActivitiesPage to pass orders
c = c.replace(
  `{activePage === 'activities' && <ActivitiesPage employees={employees} passportHandovers={passportHandovers} onUpdatePassport={(fn) => setPassportHandovers(fn)} inventoryItems={inventoryItems} inventoryUsage={inventoryUsage} onUpdateInventoryItems={(fn) => setInventoryItems(fn)} onUpdateInventoryUsage={(fn) => setInventoryUsage(fn)} />}`,
  `{activePage === 'activities' && <ActivitiesPage employees={employees} passportHandovers={passportHandovers} onUpdatePassport={(fn) => setPassportHandovers(fn)} inventoryItems={inventoryItems} inventoryUsage={inventoryUsage} inventoryOrders={inventoryOrders} onUpdateInventoryItems={(fn) => setInventoryItems(fn)} onUpdateInventoryUsage={(fn) => setInventoryUsage(fn)} onUpdateInventoryOrders={(fn) => setInventoryOrders(fn)} />}`
);

// 7. Update ActivitiesPage props type
c = c.replace(
  `  onUpdateInventoryItems: (fn: (prev: InventoryItem[]) => InventoryItem[]) => void
  onUpdateInventoryUsage: (fn: (prev: InventoryUsageRecord[]) => InventoryUsageRecord[]) => void`,
  `  inventoryOrders: StoreOrder[]
  onUpdateInventoryItems: (fn: (prev: InventoryItem[]) => InventoryItem[]) => void
  onUpdateInventoryUsage: (fn: (prev: InventoryUsageRecord[]) => InventoryUsageRecord[]) => void
  onUpdateInventoryOrders: (fn: (prev: StoreOrder[]) => StoreOrder[]) => void`
);

// 8. Update ActivitiesPage body - pass orders to InventorySection
c = c.replace(
  `{activeSection === 'inventory' && <InventorySection items={inventoryItems} usage={inventoryUsage} onUpdateItems={onUpdateInventoryItems} onUpdateUsage={onUpdateInventoryUsage} employees={employees} />}`,
  `{activeSection === 'inventory' && <InventorySection items={inventoryItems} usage={inventoryUsage} orders={inventoryOrders} onUpdateItems={onUpdateInventoryItems} onUpdateUsage={onUpdateInventoryUsage} onUpdateOrders={onUpdateInventoryOrders} employees={employees} />}`
);

// 9. Update InventorySection signature to include orders
c = c.replace(
  `function InventorySection({ items, usage, onUpdateItems, onUpdateUsage, employees }: {
  items: InventoryItem[]
  usage: InventoryUsageRecord[]
  onUpdateItems: (fn: (prev: InventoryItem[]) => InventoryItem[]) => void
  onUpdateUsage: (fn: (prev: InventoryUsageRecord[]) => InventoryUsageRecord[]) => void
  employees: Employee[]
})`,
  `function InventorySection({ items, usage, orders, onUpdateItems, onUpdateUsage, onUpdateOrders, employees }: {
  items: InventoryItem[]
  usage: InventoryUsageRecord[]
  orders: StoreOrder[]
  onUpdateItems: (fn: (prev: InventoryItem[]) => InventoryItem[]) => void
  onUpdateUsage: (fn: (prev: InventoryUsageRecord[]) => InventoryUsageRecord[]) => void
  onUpdateOrders: (fn: (prev: StoreOrder[]) => StoreOrder[]) => void
  employees: Employee[]
})`
);

// 10. Add Refresher sub-tab and Orders tab in InventorySection
c = c.replace(
  `  const [subTab, setSubTab] = useState<'stationery' | 'medical' | 'history'>('stationery')`,
  `  const [subTab, setSubTab] = useState<'stationery' | 'medical' | 'refresher' | 'orders' | 'history'>('stationery')`
);

// Add Refresher count + Orders pending vars
c = c.replace(
  `  const totalLow = items.filter(i => i.quantity <= i.minQuantity).length
  const medLow   = items.filter(i => i.category === 'Medical' && i.quantity <= i.minQuantity).length`,
  `  const totalLow    = items.filter(i => i.quantity <= i.minQuantity).length
  const medLow      = items.filter(i => i.category === 'Medical' && i.quantity <= i.minQuantity).length
  const ordPending  = orders.filter(o => o.status === 'Pending').length`
);

// Add Refresher and Orders tabs after Medical tab button
c = c.replace(
  `        <button className={\`inv-tab-btn\${subTab === 'history' ? ' inv-tab-active inv-tab-purple' : ''}\`} onClick={() => setSubTab('history')} type="button">`,
  `        <button className={\`inv-tab-btn\${subTab === 'refresher' ? ' inv-tab-active inv-tab-orange' : ''}\`} onClick={() => setSubTab('refresher')} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
          Refresher
          {items.filter(i=>i.category==='Refresher').length > 0 && <span className="inv-tab-count">{items.filter(i=>i.category==='Refresher').length}</span>}
        </button>
        <button className={\`inv-tab-btn\${subTab === 'orders' ? ' inv-tab-active inv-tab-teal' : ''}\`} onClick={() => setSubTab('orders')} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>
          Orders
          {ordPending > 0 && <span className="inv-tab-count inv-tab-count-warn">{ordPending}</span>}
        </button>
        <button className={\`inv-tab-btn\${subTab === 'history' ? ' inv-tab-active inv-tab-purple' : ''}\`} onClick={() => setSubTab('history')} type="button">`
);

// Add Refresher tab content + Orders tab content before history check
c = c.replace(
  `      {subTab === 'medical' && (
        <InventoryCategoryTab cat="Medical" items={items} usage={usage} onUpdateItems={onUpdateItems} onUpdateUsage={onUpdateUsage} employees={employees} />
      )}`,
  `      {subTab === 'medical' && (
        <InventoryCategoryTab cat="Medical" items={items} usage={usage} onUpdateItems={onUpdateItems} onUpdateUsage={onUpdateUsage} employees={employees} />
      )}

      {subTab === 'refresher' && (
        <InventoryCategoryTab cat="Refresher" items={items} usage={usage} onUpdateItems={onUpdateItems} onUpdateUsage={onUpdateUsage} employees={employees} />
      )}

      {subTab === 'orders' && (
        <OrdersTab orders={orders} items={items} onUpdateOrders={onUpdateOrders} />
      )}`
);

// 11. Update useEffect to save orders
{
  const INV_EFFECT = `  useEffect(() => { localStorage.setItem('tic_inventory_items', JSON.stringify(inventoryItems)) }, [inventoryItems])`;
  const idx = c.indexOf(INV_EFFECT);
  if (idx !== -1) {
    c = c.slice(0, idx + INV_EFFECT.length) + `\n  useEffect(() => { localStorage.setItem('tic_inv_orders', JSON.stringify(inventoryOrders)) }, [inventoryOrders])` + c.slice(idx + INV_EFFECT.length);
  }
}

console.log('5-11. InventorySection wired up');

// 12. Inject OrdersTab function before InventorySection
const ORDERS_TAB_FN = `
function OrdersTab({ orders, items, onUpdateOrders }: {
  orders: StoreOrder[]
  items: InventoryItem[]
  onUpdateOrders: (fn: (prev: StoreOrder[]) => StoreOrder[]) => void
}) {
  const [editing, setEditing] = useState<StoreOrder | null>(null)
  const [catFilter, setCatFilter] = useState<InventoryCategory | 'All'>('All')
  const [typeFilter, setTypeFilter] = useState<'All' | 'Store Order' | 'Bulk Request'>('All')

  const filtered = orders.filter(o =>
    (catFilter === 'All' || o.category === catFilter) &&
    (typeFilter === 'All' || o.orderType === typeFilter)
  ).sort((a,b) => b.orderDate.localeCompare(a.orderDate))

  const save = (o: StoreOrder) => {
    onUpdateOrders(prev => prev.some(x=>x.id===o.id) ? prev.map(x=>x.id===o.id?o:x) : [o,...prev])
    setEditing(null)
  }
  const del = (id: string) => { if(window.confirm('Delete this order?')) onUpdateOrders(prev=>prev.filter(o=>o.id!==id)) }
  const markReceived = (o: StoreOrder) => {
    const updated = { ...o, status: 'Received' as const, receivedDate: new Date().toISOString().slice(0,10) }
    onUpdateOrders(prev => prev.map(x=>x.id===o.id?updated:x))
  }

  const newOrder = (): StoreOrder => ({
    id: 'ORD-new', orderDate: new Date().toISOString().slice(0,10),
    orderedBy: '', orderType: 'Store Order', category: 'Stationery',
    items: [{ itemId:'', itemName:'', quantity:1, unit:'pcs' }],
    status: 'Pending', receivedDate: '', receivedBy: '', remarks: '',
  })

  const statusStyle = (s: string) => s === 'Received' ? { color:'#16a34a', bg:'#dcfce7' }
    : s === 'Partial' ? { color:'#d97706', bg:'#fef3c7' } : { color:'#2563eb', bg:'#eff6ff' }

  return (
    <div style={{ padding:'0 0 16px' }}>
      <div className="table-toolbar leave-toolbar leave-toolbar-has-btn" style={{ flexWrap:'wrap', gap:'6px 10px' }}>
        <label style={{ flex:'0 0 auto' }}><span>Category</span>
          <select value={catFilter} onChange={e=>setCatFilter(e.target.value as InventoryCategory|'All')}>
            {['All','Stationery','Medical','Refresher'].map(c=><option key={c}>{c}</option>)}
          </select>
        </label>
        <label style={{ flex:'0 0 auto' }}><span>Type</span>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value as 'All'|'Store Order'|'Bulk Request')}>
            {['All','Store Order','Bulk Request'].map(t=><option key={t}>{t}</option>)}
          </select>
        </label>
        <button className="primary-button toolbar-add-btn" onClick={()=>setEditing(newOrder())} type="button">+ New Order</button>
      </div>

      <div className="employee-table-shell compact-scroll">
        <table className="data-table">
          <thead><tr>
            <th>Date</th><th>Type</th><th>Category</th><th>Items Ordered</th>
            <th style={{textAlign:'center'}}>Status</th><th>Received</th><th>Ordered By</th><th>Remarks</th><th style={{textAlign:'center'}}>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={9} style={{textAlign:'center',padding:'24px',color:'#94a3b8',fontSize:'0.82rem'}}>No orders yet.</td></tr>}
            {filtered.map(o => {
              const ss = statusStyle(o.status)
              return (
                <tr key={o.id}>
                  <td style={{fontSize:'0.78rem',whiteSpace:'nowrap'}}>{formatDateDisplay(o.orderDate)}</td>
                  <td><span style={{fontSize:'0.72rem',fontWeight:700,padding:'2px 8px',borderRadius:20,background:o.orderType==='Store Order'?'#eff6ff':'#fef3c7',color:o.orderType==='Store Order'?'#1d4ed8':'#92400e'}}>{o.orderType}</span></td>
                  <td style={{fontSize:'0.78rem'}}>{o.category}</td>
                  <td style={{fontSize:'0.76rem',color:'#374151',maxWidth:220}}>
                    {o.items.map((it,i) => <div key={i}>{it.itemName} — {it.quantity} {it.unit}</div>)}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <span style={{fontSize:'0.72rem',fontWeight:700,padding:'2px 8px',borderRadius:20,background:ss.bg,color:ss.color}}>{o.status}</span>
                  </td>
                  <td style={{fontSize:'0.78rem',whiteSpace:'nowrap',color:'#64748b'}}>{o.receivedDate ? formatDateDisplay(o.receivedDate) : '—'}</td>
                  <td style={{fontSize:'0.75rem',color:'#64748b'}}>{o.orderedBy || '—'}</td>
                  <td style={{fontSize:'0.75rem',color:'#64748b',maxWidth:160}}>{o.remarks || '—'}</td>
                  <td>
                    <div className="row-actions request-inline-actions">
                      {o.status === 'Pending' && <button className="action-glyph" style={{color:'#16a34a',fontSize:'0.75rem',fontWeight:700,padding:'2px 7px',background:'#dcfce7',borderRadius:6,border:'none',cursor:'pointer'}} onClick={()=>markReceived(o)} type="button" title="Mark received">✓ Received</button>}
                      <button className="action-glyph edit"   onClick={()=>setEditing(o)} type="button" title="Edit">✎</button>
                      <button className="action-glyph delete" onClick={()=>del(o.id)}    type="button" title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {editing && <OrderModal order={editing} items={items} onClose={()=>setEditing(null)} onSave={save} />}
    </div>
  )
}

function OrderModal({ order, items, onClose, onSave }: {
  order: StoreOrder; items: InventoryItem[]
  onClose: () => void; onSave: (o: StoreOrder) => void
}) {
  const isNew = order.id === 'ORD-new'
  const [form, setForm] = useState<StoreOrder>(order)
  const setF = (f: Partial<StoreOrder>) => setForm(p=>({...p,...f}))
  const catItems = items.filter(i => i.category === form.category)

  const addItem = () => setF({ items: [...form.items, { itemId:'', itemName:'', quantity:1, unit:'pcs' }] })
  const removeItem = (idx: number) => setF({ items: form.items.filter((_,i)=>i!==idx) })
  const updateItem = (idx: number, field: keyof StoreOrderItem, val: string|number) =>
    setF({ items: form.items.map((it,i) => i===idx ? {...it,[field]:val} : it) })
  const pickCatItem = (idx: number, itemId: string) => {
    const found = catItems.find(i=>i.id===itemId)
    if (found) setF({ items: form.items.map((it,i) => i===idx ? {...it,itemId,itemName:found.name,unit:found.unit} : it) })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div><p className="eyebrow">Inventory Order</p><h2>{isNew ? 'New Order' : 'Edit Order'}</h2></div>
          <button className="icon-button" onClick={onClose} type="button">✕</button>
        </div>
        <div className="form-grid">
          <label><span>Order Date</span><input type="date" value={form.orderDate} onChange={e=>setF({orderDate:e.target.value})} /></label>
          <label><span>Order Type</span>
            <select value={form.orderType} onChange={e=>setF({orderType:e.target.value as StoreOrder['orderType']})}>
              <option>Store Order</option><option>Bulk Request</option>
            </select>
          </label>
          <label><span>Category</span>
            <select value={form.category} onChange={e=>setF({category:e.target.value as InventoryCategory,items:[{itemId:'',itemName:'',quantity:1,unit:'pcs'}]})}>
              <option>Stationery</option><option>Medical</option><option>Refresher</option>
            </select>
          </label>
          <label><span>Ordered By</span><input value={form.orderedBy} onChange={e=>setF({orderedBy:e.target.value})} placeholder="Name" /></label>
          <label><span>Status</span>
            <select value={form.status} onChange={e=>setF({status:e.target.value as StoreOrder['status']})}>
              <option>Pending</option><option>Received</option><option>Partial</option>
            </select>
          </label>
          {form.status !== 'Pending' && <>
            <label><span>Received Date</span><input type="date" value={form.receivedDate} onChange={e=>setF({receivedDate:e.target.value})} /></label>
            <label><span>Received By</span><input value={form.receivedBy} onChange={e=>setF({receivedBy:e.target.value})} /></label>
          </>}
          <label className="full-field"><span>Remarks</span><input value={form.remarks} onChange={e=>setF({remarks:e.target.value})} /></label>
        </div>
        <div style={{marginTop:12}}>
          <div style={{fontSize:'0.72rem',fontWeight:800,color:'#475569',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Items</div>
          {form.items.map((it,idx) => (
            <div key={idx} style={{display:'grid',gridTemplateColumns:'1fr 80px 80px auto',gap:6,marginBottom:6,alignItems:'end'}}>
              <label><span>Item</span>
                <select value={it.itemId} onChange={e=>pickCatItem(idx,e.target.value)}>
                  <option value="">— Select —</option>
                  {catItems.map(ci=><option key={ci.id} value={ci.id}>{ci.name}</option>)}
                  <option value="custom">Other (type below)</option>
                </select>
              </label>
              {it.itemId === 'custom' && <label style={{gridColumn:'1/-2'}}><span>Item Name</span><input value={it.itemName} onChange={e=>updateItem(idx,'itemName',e.target.value)} /></label>}
              <label><span>Qty</span><input type="number" min={1} value={it.quantity} onChange={e=>updateItem(idx,'quantity',Number(e.target.value))} /></label>
              <label><span>Unit</span><input value={it.unit} onChange={e=>updateItem(idx,'unit',e.target.value)} /></label>
              <button type="button" onClick={()=>removeItem(idx)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:'1.1rem',paddingBottom:4}}>✕</button>
            </div>
          ))}
          <button type="button" onClick={addItem} style={{fontSize:'0.8rem',color:'#2563eb',background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:6,padding:'4px 12px',cursor:'pointer'}}>+ Add Item</button>
        </div>
        <div className="modal-actions">
          <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
          <button className="primary-button" onClick={()=>onSave({...form,id:isNew?('ORD-'+Date.now()):form.id})} type="button">{isNew?'Create Order':'Save Changes'}</button>
        </div>
      </section>
    </div>
  )
}

`;

{
  const idx = c.indexOf('\nfunction InventorySection(');
  if (idx === -1) { console.error('InventorySection not found for inject'); process.exit(1); }
  c = c.slice(0, idx) + ORDERS_TAB_FN + c.slice(idx + 1);
  console.log('12. OrdersTab injected');
}

fs.writeFileSync('hr-system-frontend/src/App.tsx', c, 'utf8');
console.log('Inventory redesign complete.');
