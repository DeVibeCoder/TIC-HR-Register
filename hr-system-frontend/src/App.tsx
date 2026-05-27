import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'

type Page = 'overview' | 'employees' | 'leave' | 'operations' | 'activities' | 'termination' | 'settings'
type SiteStatus = 'On Site' | 'Off Site' | 'On Leave'
type RecordStatus = 'Pending' | 'Active'
type LeaveView = 'request' | 'active' | 'history' | 'passport'
type PageSize = 50 | 100 | 'All'
type LeaveTypeCode = 'AL' | 'FRL' | 'NP' | 'PT' | 'CC'
type LeaveRequestStep = 'Letter Submitted' | 'Approved' | 'Dates Shared' | 'Ticket Booked' | 'Pending Departure'
type HistoryConfirmation = 'Returned' | 'Not Returned'
type PassportStep = 'Issued' | 'Collected' | 'Sent to HO'

type Employee = {
  employeeId: string
  fullName: string
  department: string
  designation: string
  nationality: string
  nicPassportNo: string
  workPermitNo: string
  dateOfJoin: string
  mobileNo: string
  dateOfBirth: string
  passportStatus: string
  siteStatus: SiteStatus
  gender?: string
}

type EmployeeForm = Employee

type LeaveBase = {
  id: string
  employeeId: string
  name: string
  department: string
  nationality: string
  leaveTypeCode: LeaveTypeCode
  departureDate: string
  returnDate: string
  days: number
  remarks?: string
}

type LeaveRequestRecord = LeaveBase & {
  step: LeaveRequestStep
}

type ActiveLeaveRecord = LeaveBase & {
  status: 'Departed'
}

type LeaveHistoryRecord = LeaveBase & {
  confirmation?: HistoryConfirmation
}

type PassportHandoverRecord = LeaveBase & {
  passportStep: PassportStep
  givenDate?: string
  returnedDate?: string
  sentToHoDate?: string
  remarks: string
}

type OpsSection = 'files' | 'induction' | 'training' | 'bank'

type PersonalFileRecord = {
  fileNo: string
  employeeId: string
  fullName: string
  department: string
  isFormerStaff: boolean
  coc: boolean
  jd: boolean
  cont: boolean
  contractExpiryDate: string
  remarks: string
}

type InductionParticipant = {
  employeeId: string
  name: string
  nicPassportNo: string
  section: string      // sub-unit within the org (HR, Stores, Operations…)
  department: string   // organisation / company name
}

type InductionRecord = {
  id: string
  refNo: string            // short number, e.g. "001"
  inductionDate: string
  conductedBy: string
  conductedByEmpId?: string
  participants: InductionParticipant[]
  inductionContent: string
  status: 'Completed' | 'Pending' | 'Scheduled'
  remarks: string
}

type TrainingParticipant = {
  employeeId: string
  name: string
  department: string
  attended: boolean
}

type TrainingRecord = {
  id: string
  trainingTitle: string
  date: string
  conductedBy: string
  trainingType: 'Internal' | 'External'
  participants: TrainingParticipant[]
  status: 'Completed' | 'Pending'
  remarks: string
}

type ActivitiesSection = 'requests' | 'visits' | 'incidents'

type StaffRequestRecord = {
  id: string
  employeeName: string
  department: string
  requestType: 'Accommodation' | 'Equipment' | 'Transfer' | 'Leave' | 'Documents' | 'Other'
  description: string
  submittedDate: string
  completedDate: string
  status: 'Open' | 'In Progress' | 'Resolved' | 'Rejected'
  remarks: string
}

type VisitRecord = {
  id: string
  employeeId: string
  employeeName: string
  department: string
  nationality: string
  visitType: 'Visa Medical' | 'Photo' | 'Passport Renewal' | 'Embassy Letter Collection'
  visitDate: string
  status: 'Scheduled' | 'Completed' | 'Cancelled'
  remarks: string
}

type IncidentRecord = {
  id: string
  incidentDate: string
  timeOfIncident: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | ''
  employeeId: string
  employeeName: string
  reportedById: string
  reportedByName: string
  department: string
  siteLocation: string
  incidentType: 'Work Injury' | 'Near Miss' | 'Property Damage' | 'Fire' | 'Misconduct' | 'Sleeping on Duty' | 'Other'
  incidentSummary?: string
  exactLocation?: string
  immediateCause?: string
  witnessName?: string
  witnessId?: string
  correctiveOwner?: string
  followUpDate?: string
  description: string
  injuryInvolved: boolean
  actionTaken: string
  statementTaken: boolean
  disciplinaryAction: boolean
  status: 'Open' | 'Under Review' | 'Closed'
}

type TerminationStage = 'Letter Submitted' | 'Exit Interview' | 'Ticket' | 'Pending Departure'
type TerminationTab = 'notice' | 'completed'
type TerminationType = 'Resignation' | 'Dismissal' | 'Probation End' | 'Contract Expiry' | 'Absconded' | 'Other'

type EnhancedTerminationRecord = {
  id: string
  employeeId: string
  name: string
  department: string
  designation: string
  nationality: string
  passportNo: string
  wpNo: string
  dateOfJoin: string
  dateSubmitted: string
  lastWorkingDate: string
  departureDate: string
  currentStage: TerminationStage
  reasonForLeaving: string
  satisfactionRating: number
  rehireEligible: boolean
  exitInterviewCompleted: boolean
  comments: string
  terminationType: TerminationType
}

type CompletedTerminationRecord = {
  id: string
  employeeId: string
  name: string
  department: string
  designation: string
  nationality: string
  passportNo: string
  wpNo: string
  dateOfJoin: string
  lastWorkingDate: string
  departureDate: string
  currentStage: TerminationStage
  rehireEligible: boolean
  exitInterviewCompleted: boolean
  reasonForLeaving: string
  comments: string
  terminationType: TerminationType
}

const pages: Array<{ id: Page; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'employees', label: 'Employees' },
  { id: 'leave', label: 'Leave' },
  { id: 'operations', label: 'HR Operations' },
  { id: 'activities', label: 'Activities' },
  { id: 'termination', label: 'Termination' },
  { id: 'settings', label: 'Settings' },
]

const departmentsList = ['ADMINISTRATION', 'HUMAN RESOURCES', 'ACCOUNTS AND FINANCE', 'CAFE', 'STORES', 'HOUSEKEEPING', 'LPG PLANT', 'OXYGEN PLANT', 'CEMENT PLANT', 'FUEL FARM', 'ENGINEERING ADMINISTRATION', 'MECHANICAL', 'ELECTRICAL', 'MAINTENANCE', 'POWER HOUSE', 'PAINTING PROJECT', 'KITCHEN', 'STAFF MESS', 'LOSS PREVENTION', 'ROOFING FACTORY', 'BATCHING PLANT']
const nationalities = ['MALDIVES', 'INDIA', 'BANGLADESH', 'SRI LANKA', 'NEPAL', 'FINLAND', 'MALAYSIA', 'PHILIPPINES', 'MYANMAR', 'PAKISTAN']

const leaveTypeOptions: Array<{ code: LeaveTypeCode; label: string }> = [
  { code: 'AL', label: 'Annual Leave' },
  { code: 'FRL', label: 'Family Responsibility Leave' },
  { code: 'NP', label: 'No Pay' },
  { code: 'PT', label: 'Paternity' },
  { code: 'CC', label: 'Circumcision' },
]

const requestSteps: LeaveRequestStep[] = ['Letter Submitted', 'Approved', 'Dates Shared', 'Ticket Booked', 'Pending Departure']
const passportSteps: PassportStep[] = ['Issued', 'Collected', 'Sent to HO']

const baseEmployees: Employee[] = [
]

function createEmployees(): Employee[] {
  return baseEmployees.sort((a, b) => a.department.localeCompare(b.department) || a.fullName.localeCompare(b.fullName))
}

const initialEmployees = createEmployees()

const initialLeaveRequests: LeaveRequestRecord[] = [
]

const initialActiveLeaves: ActiveLeaveRecord[] = []
const initialLeaveHistory: LeaveHistoryRecord[] = []
const initialPassportHandovers: PassportHandoverRecord[] = []
const initialNoticeTerminations: EnhancedTerminationRecord[] = []
const initialCompletedTerminations: CompletedTerminationRecord[] = []
const allTerminationStages: TerminationStage[] = ['Letter Submitted', 'Exit Interview', 'Ticket', 'Pending Departure']
const initialPersonalFiles: PersonalFileRecord[] = [
  { fileNo: '0001', employeeId: '25431', fullName: 'THILINA LAKSHAN PERERA', department: 'STORES', isFormerStaff: true, coc: true, jd: true, cont: true, contractExpiryDate: '2022-12-31', remarks: 'Left company Dec 2022' },
  { fileNo: '0002', employeeId: '31672', fullName: 'MD RAFIQUL ISLAM', department: 'ADMINISTRATION', isFormerStaff: true, coc: true, jd: true, cont: true, contractExpiryDate: '2023-06-30', remarks: 'Contract not renewed' },
  { fileNo: '0003', employeeId: '33856', fullName: 'KRISHNA PRASAD RIMAL', department: 'MECHANICAL', isFormerStaff: true, coc: true, jd: false, cont: true, contractExpiryDate: '2024-01-15', remarks: 'Resigned' },
  { fileNo: '0004', employeeId: '35494', fullName: 'GAMARALALAGE AJITH WIJESIRI', department: 'ACCOUNTS AND FINANCE', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2027-05-31', remarks: '' },
  { fileNo: '0005', employeeId: '37916', fullName: 'JAGO', department: 'STORES', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2026-09-01', remarks: '' },
  { fileNo: '0006', employeeId: '43407', fullName: 'MOHAMMAD DELOWAR HOSSAIN', department: 'STORES', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2026-08-01', remarks: '' },
  { fileNo: '0007', employeeId: '44386', fullName: 'MAJIB', department: 'STORES', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2026-06-01', remarks: '' },
  { fileNo: '0008', employeeId: '50223', fullName: 'AYESHAN KUMARA WIJEYATHUNGA MUDALIGE', department: 'STORES', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2027-04-10', remarks: '' },
  { fileNo: '0009', employeeId: '50427', fullName: 'MD SAIFUR RAHMAN', department: 'STORES', isFormerStaff: false, coc: true, jd: true, cont: false, contractExpiryDate: '2027-06-01', remarks: 'Contract renewal pending' },
  { fileNo: '0010', employeeId: '52804', fullName: 'AHMED IMRAN', department: 'ACCOUNTS AND FINANCE', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2027-12-01', remarks: '' },
  { fileNo: '0011', employeeId: '53029', fullName: 'KUMARAN VAITHILINGAM', department: 'STORES', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2026-01-20', remarks: '' },
  { fileNo: '0012', employeeId: '53979', fullName: 'NAVEEN SEKAR', department: 'STORES', isFormerStaff: false, coc: true, jd: false, cont: true, contractExpiryDate: '2026-08-10', remarks: 'JD pending signature' },
  { fileNo: '0013', employeeId: '55427', fullName: 'SARAVANAN RAJENDRAN', department: 'STORES', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2025-09-01', remarks: '' },
  { fileNo: '0014', employeeId: '56141', fullName: 'RAJU PERKA', department: 'CAFE', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2026-04-01', remarks: '' },
  { fileNo: '0015', employeeId: '56530', fullName: 'PUBUDU MADURANGA ALAWATHTHA KANKANAMGE', department: 'ADMINISTRATION', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2026-07-01', remarks: '' },
  { fileNo: '0016', employeeId: '56646', fullName: 'CHANDRASHEKHER PURELLA', department: 'ACCOUNTS AND FINANCE', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2026-08-01', remarks: '' },
  { fileNo: '0017', employeeId: '57637', fullName: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2027-02-10', remarks: '' },
  { fileNo: '0018', employeeId: '57803', fullName: 'INDIKA SAMPATH SAMARASINGHEGE', department: 'STORES', isFormerStaff: false, coc: true, jd: false, cont: false, contractExpiryDate: '2027-05-20', remarks: 'JD and contract pending' },
  { fileNo: '0019', employeeId: '57935', fullName: 'ARUNODA KAVINDU NANAYAKKARA', department: 'ACCOUNTS AND FINANCE', isFormerStaff: false, coc: true, jd: true, cont: false, contractExpiryDate: '2027-04-20', remarks: 'Contract pending' },
  { fileNo: '0020', employeeId: '58034', fullName: 'SAMEERA MADUSANKA GUNARATHNA', department: 'STORES', isFormerStaff: false, coc: true, jd: false, cont: false, contractExpiryDate: '2027-05-22', remarks: 'JD and contract pending' },
  { fileNo: '0021', employeeId: '58686', fullName: 'YASAR ARAFATH BASHEER AHAMED', department: 'STORES', isFormerStaff: false, coc: false, jd: false, cont: false, contractExpiryDate: '2027-05-18', remarks: 'All documents pending' },
  { fileNo: '0022', employeeId: '58692', fullName: 'SHANTUMON PATHIYIL CHACKO', department: 'HUMAN RESOURCES', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2027-10-15', remarks: '' },
]

const initialInductionRecords: InductionRecord[] = [
  {
    id: 'IND-001',
    refNo: '001',
    inductionDate: '2025-11-20',
    conductedBy: 'SHANTUMON PATHIYIL CHACKO',
    conductedByEmpId: '58692',
    participants: [
      { employeeId: '57803', name: 'INDIKA SAMPATH SAMARASINGHEGE', nicPassportNo: 'N0234561', section: 'STORES', department: 'Thilafushi Industrial Complex' },
      { employeeId: '57935', name: 'ARUNODA KAVINDU NANAYAKKARA', nicPassportNo: 'N0287342', section: 'ACCOUNTS & FINANCE', department: 'Thilafushi Industrial Complex' },
      { employeeId: '57637', name: 'MUNI ACHARI GUNTI KOVALA', nicPassportNo: 'T6678234', section: 'CAFÉ', department: 'Thilafushi Industrial Complex' },
      { employeeId: '56530', name: 'PUBUDU MADURANGA ALAWATHTHA KANKANAMGE', nicPassportNo: 'N0189342', section: 'ADMINISTRATION', department: 'Thilafushi Industrial Complex' },
    ],
    inductionContent: 'Company overview and organizational structure of TIC. Site safety rules, PPE requirements, and emergency procedures including evacuation routes. HR policies — working hours, leave types, code of conduct, and grievance handling. Work permit compliance for expatriate staff. Bank account opening requirements (SBI/BOC/CBM). Accommodation rules, mess facilities, and recreational areas.',
    status: 'Completed',
    remarks: 'All participants completed induction successfully.',
  },
  {
    id: 'IND-002',
    refNo: '002',
    inductionDate: '2026-03-10',
    conductedBy: 'SHANTUMON PATHIYIL CHACKO',
    conductedByEmpId: '58692',
    participants: [
      { employeeId: '58034', name: 'SAMEERA MADUSANKA GUNARATHNA', nicPassportNo: 'N0187423', section: 'STORES', department: 'Thilafushi Industrial Complex' },
      { employeeId: '58686', name: 'YASAR ARAFATH BASHEER AHAMED', nicPassportNo: 'R8821054', section: 'STORES', department: 'Thilafushi Industrial Complex' },
      { employeeId: '58692', name: 'SHANTUMON PATHIYIL CHACKO', nicPassportNo: 'T4482910', section: 'HUMAN RESOURCES', department: 'Thilafushi Industrial Complex' },
    ],
    inductionContent: 'Welcome briefing and site tour. Introduction to key departments and reporting structure. Safety orientation including fire drill procedures, first aid kit locations, and emergency contacts. Payroll cycle and bank account setup. IT access and communication tools usage.',
    status: 'Completed',
    remarks: '',
  },
  {
    id: 'IND-003',
    refNo: '003',
    inductionDate: '2026-06-15',
    conductedBy: 'SHANTUMON PATHIYIL CHACKO',
    conductedByEmpId: '58692',
    participants: [
      { employeeId: '59104', name: 'RAJESH KUMAR PILLAI', nicPassportNo: 'V2341876', section: 'STORES', department: 'Thilafushi Industrial Complex' },
      { employeeId: '59105', name: 'MOHD ARIF HUSSAIN', nicPassportNo: 'Z1122334', section: 'CAFÉ', department: 'Thilafushi Industrial Complex' },
      { employeeId: '', name: 'PRADEEP NATH SHARMA', nicPassportNo: 'S3321456', section: 'OPERATIONS', department: 'Thilafushi Industrial Complex' },
    ],
    inductionContent: 'Company overview and organizational structure of TIC. Site safety rules, PPE requirements, and emergency procedures. HR policies — working hours, leave entitlements, code of conduct. Work permit compliance. Bank account opening requirements (SBI/BOC/CBM). Accommodation rules and mess facilities.',
    status: 'Completed',
    remarks: '',
  },
]

const initialTrainingRecords: TrainingRecord[] = [
  {
    id: 'TRN-001',
    trainingTitle: 'Fire Safety & Emergency Procedures',
    date: '2026-01-22',
    conductedBy: 'EXTERNAL SAFETY CONSULTANT',
    trainingType: 'External',
    participants: [
      { employeeId: '58692', name: 'SHANTUMON PATHIYIL CHACKO', department: 'HUMAN RESOURCES', attended: true },
      { employeeId: '56530', name: 'PUBUDU MADURANGA ALAWATHTHA KANKANAMGE', department: 'ADMINISTRATION', attended: true },
      { employeeId: '56646', name: 'CHANDRASHEKHER PURELLA', department: 'ACCOUNTS AND FINANCE', attended: true },
      { employeeId: '53029', name: 'KUMARAN VAITHILINGAM', department: 'STORES', attended: true },
      { employeeId: '53979', name: 'NAVEEN SEKAR', department: 'STORES', attended: true },
      { employeeId: '55427', name: 'SARAVANAN RAJENDRAN', department: 'STORES', attended: false },
      { employeeId: '56141', name: 'RAJU PERKA', department: 'CAFE', attended: true },
      { employeeId: '57637', name: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', attended: true },
    ],
    status: 'Completed',
    remarks: 'SARAVANAN RAJENDRAN absent — will join next session.',
  },
  {
    id: 'TRN-002',
    trainingTitle: 'First Aid & Basic CPR',
    date: '2026-03-18',
    conductedBy: 'RED CRESCENT MALDIVES',
    trainingType: 'External',
    participants: [
      { employeeId: '58692', name: 'SHANTUMON PATHIYIL CHACKO', department: 'HUMAN RESOURCES', attended: true },
      { employeeId: '56530', name: 'PUBUDU MADURANGA ALAWATHTHA KANKANAMGE', department: 'ADMINISTRATION', attended: true },
      { employeeId: '57803', name: 'INDIKA SAMPATH SAMARASINGHEGE', department: 'STORES', attended: true },
      { employeeId: '58034', name: 'SAMEERA MADUSANKA GUNARATHNA', department: 'STORES', attended: true },
      { employeeId: '57935', name: 'ARUNODA KAVINDU NANAYAKKARA', department: 'ACCOUNTS AND FINANCE', attended: true },
      { employeeId: '56141', name: 'RAJU PERKA', department: 'CAFE', attended: false },
    ],
    status: 'Completed',
    remarks: 'RAJU PERKA absent — rescheduled for next batch.',
  },
  {
    id: 'TRN-003',
    trainingTitle: 'Forklift Operation Safety',
    date: '2026-06-10',
    conductedBy: 'SHANTUMON PATHIYIL CHACKO',
    trainingType: 'Internal',
    participants: [
      { employeeId: '43407', name: 'MOHAMMAD DELOWAR HOSSAIN', department: 'STORES', attended: false },
      { employeeId: '44386', name: 'MAJIB', department: 'STORES', attended: false },
      { employeeId: '50427', name: 'MD SAIFUR RAHMAN', department: 'STORES', attended: false },
      { employeeId: '53029', name: 'KUMARAN VAITHILINGAM', department: 'STORES', attended: false },
      { employeeId: '53979', name: 'NAVEEN SEKAR', department: 'STORES', attended: false },
    ],
    status: 'Pending',
    remarks: '',
  },
]
const initialStaffRequests: StaffRequestRecord[] = []
const initialVisitRecords: VisitRecord[] = []
const initialIncidentRecords: IncidentRecord[] = []

const emptyEmployee: EmployeeForm = {
  employeeId: '',
  fullName: '',
  department: 'Operations',
  designation: '',
  nationality: 'MALDIVES',
  nicPassportNo: '',
  workPermitNo: '',
  dateOfJoin: new Date().toISOString().slice(0, 10),
  mobileNo: '',
  dateOfBirth: '',
  passportStatus: 'With Employee',
  siteStatus: 'On Site',
  gender: '',
}

function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) return ''
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1
  return String(age)
}

function dayCount(start: string, end: string) {
  if (!start || !end) return 0
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1)
}

function formatDateDisplay(isoDate: string) {
  if (!isoDate) return '-'
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return isoDate
  return `${day}/${month}/${year}`
}

function nextIncidentRef(records: IncidentRecord[]) {
  const maxSequence = records.reduce((highest, record) => {
    const match = /^INC-(\d+)$/.exec(record.id)
    return match ? Math.max(highest, Number(match[1])) : highest
  }, 0)
  return `INC-${String(maxSequence + 1).padStart(3, '0')}`
}

function monthKey(isoDate: string) {
  if (!isoDate) return ''
  const [year, month] = isoDate.split('-')
  if (!year || !month) return ''
  return `${year}-${month}`
}

function formatMonthLabel(key: string) {
  if (!key) return 'All Months'
  const [year, month] = key.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  if (Number.isNaN(date.getTime())) return key
  return date.toLocaleString('en-GB', { month: 'long', year: 'numeric' })
}

function leaveTypeLabel(code: LeaveTypeCode) {
  return leaveTypeOptions.find((item) => item.code === code)?.label ?? code
}

function inductionYear(inductionDate?: string): string {
  if (inductionDate) {
    const y = inductionDate.split('-')[0]
    if (y && y.length >= 4) return y.slice(2)
  }
  return String(new Date().getFullYear()).slice(2)
}

function fullInductionRef(refNo: string, inductionDate?: string): string {
  return `VHPL/TIC/HR/IND/${inductionYear(inductionDate)}/${refNo.padStart(3, '0')}`
}

function shortInductionRef(refNo: string, inductionDate?: string): string {
  return `${inductionYear(inductionDate)}/${refNo.padStart(3, '0')}`
}

function leaveSearchText(record: LeaveBase) {
  return [record.employeeId, record.name, record.department, record.nationality, record.leaveTypeCode, leaveTypeLabel(record.leaveTypeCode)]
    .join(' ')
    .toLowerCase()
}

function toActiveLeave(record: LeaveRequestRecord): ActiveLeaveRecord {
  return {
    id: `LVA-${record.id}`,
    employeeId: record.employeeId,
    name: record.name,
    department: record.department,
    nationality: record.nationality,
    leaveTypeCode: record.leaveTypeCode,
    departureDate: record.departureDate,
    returnDate: record.returnDate,
    days: record.days,
    remarks: record.remarks,
    status: 'Departed',
  }
}

function toHistoryLeave(record: ActiveLeaveRecord): LeaveHistoryRecord {
  return {
    id: `LVH-${record.id}`,
    employeeId: record.employeeId,
    name: record.name,
    department: record.department,
    nationality: record.nationality,
    leaveTypeCode: record.leaveTypeCode,
    departureDate: record.departureDate,
    returnDate: record.returnDate,
    days: record.days,
    remarks: record.remarks,
  }
}

function getPendingTasks(employee: Employee) {
  return [
    ['Employee ID', employee.employeeId],
    ['Full Name', employee.fullName],
    ['Department', employee.department],
    ['Designation', employee.designation],
    ['Nationality', employee.nationality],
    ['NIC/PP No', employee.nicPassportNo],
    ['Date of Join', employee.dateOfJoin],
    ['Mobile No', employee.mobileNo],
    ['Date of Birth', employee.dateOfBirth],
    ...(employee.nationality === 'MALDIVES' ? [] : [['WP No', employee.workPermitNo]]),
  ].filter(([, value]) => !value || String(value).startsWith('PENDING-')).map(([label]) => label)
}

function recordStatus(employee: Employee): RecordStatus {
  return getPendingTasks(employee).length ? 'Pending' : 'Active'
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge ${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>
}

function PageHeader(_props: { eyebrow: string; title: string; subtitle?: string }) {
  return null
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const fields: string[] = []
    let i = 0
    while (i <= line.length) {
      if (i === line.length) { fields.push(''); break }
      if (line[i] === '"') {
        // quoted field — commas inside are literal
        let field = ''; i++
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2 }
          else if (line[i] === '"') { i++; break }
          else { field += line[i++] }
        }
        fields.push(field.trim())
        if (line[i] === ',') i++; else break
      } else {
        const end = line.indexOf(',', i)
        if (end === -1) { fields.push(line.slice(i).trim()); break }
        fields.push(line.slice(i, end).trim()); i = end + 1
      }
    }
    rows.push(fields)
  }
  return rows
}

const leaveTypeMeta: Record<LeaveTypeCode, { bg: string; border: string; color: string }> = {
  AL:  { bg: '#dcfce7', border: '#86efac', color: '#14532d' },
  FRL: { bg: '#ffedd5', border: '#fdba74', color: '#7c2d12' },
  NP:  { bg: '#fee2e2', border: '#fca5a5', color: '#7f1d1d' },
  PT:  { bg: '#dbeafe', border: '#93c5fd', color: '#1e3a5f' },
  CC:  { bg: '#ede9fe', border: '#a78bfa', color: '#4c1d95' },
}

function LeaveTypeBadge({ code }: { code: LeaveTypeCode }) {
  const meta = leaveTypeMeta[code] ?? { bg: '#f1f5f9', border: '#94a3b8', color: '#334155' }
  return (
    <span
      className="lv-type-badge"
      style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
      title={leaveTypeLabel(code)}
    >
      {code}
    </span>
  )
}

function OverviewPage({ employees, leaveRequests, activeLeaves, leaveHistory }: { employees: Employee[]; leaveRequests: LeaveRequestRecord[]; activeLeaves: ActiveLeaveRecord[]; leaveHistory: LeaveHistoryRecord[] }) {
  const pendingEmployees = employees.filter((employee) => recordStatus(employee) === 'Pending')
  const onSite = employees.filter((employee) => employee.siteStatus === 'On Site').length
  const offSite = employees.filter((employee) => employee.siteStatus === 'Off Site').length
  const onLeave = employees.filter((employee) => employee.siteStatus === 'On Leave').length
  const onSitePct = employees.length ? Math.round((onSite / employees.length) * 100) : 0

  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    employees.forEach((e) => { counts[e.department] = (counts[e.department] ?? 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [employees])

  const maxDeptCount = deptCounts[0]?.[1] ?? 1

  const recentLeave = [...leaveRequests].sort((a, b) => b.departureDate.localeCompare(a.departureDate)).slice(0, 5)

  return (
    <section className="nx-overview">
      <div className="overview-header-band">
        <div>
          <p className="eyebrow">Thilafushi Industrial Complex</p>
          <h1>HR Overview</h1>
          <p className="overview-sub">Live summary of workforce status, leave activity, and record completeness.</p>
        </div>
      </div>

      <div className="overview-stats-row">
        <div className="ov-stat ov-stat--purple">
          <strong>{employees.length}</strong>
          <span>Total Employees</span>
        </div>
        <div className="ov-stat ov-stat--green">
          <strong>{onSite}</strong>
          <span>On Site</span>
        </div>
        <div className="ov-stat ov-stat--blue">
          <strong>{onLeave}</strong>
          <span>On Leave</span>
        </div>
        <div className="ov-stat ov-stat--orange">
          <strong>{offSite}</strong>
          <span>Off Site</span>
        </div>
        <div className="ov-stat ov-stat--red">
          <strong>{pendingEmployees.length}</strong>
          <span>Pending Records</span>
        </div>
        <div className="ov-stat ov-stat--teal">
          <strong>{leaveRequests.length}</strong>
          <span>Leave Requests</span>
        </div>
        <div className="ov-stat ov-stat--indigo">
          <strong>{activeLeaves.length}</strong>
          <span>Active Leaves</span>
        </div>
        <div className="ov-stat ov-stat--slate">
          <strong>{leaveHistory.length}</strong>
          <span>Leave History</span>
        </div>
      </div>

      <div className="overview-grid-2">
        <article className="overview-panel">
          <h3>Site Presence</h3>
          <div className="ov-presence-bar">
            <div className="ov-bar-segment ov-bar-green" style={{ width: `${onSitePct}%` }} title={`On Site: ${onSite}`} />
            <div className="ov-bar-segment ov-bar-blue" style={{ width: `${employees.length ? Math.round((onLeave / employees.length) * 100) : 0}%` }} title={`On Leave: ${onLeave}`} />
            <div className="ov-bar-segment ov-bar-orange" style={{ width: `${employees.length ? Math.round((offSite / employees.length) * 100) : 0}%` }} title={`Off Site: ${offSite}`} />
          </div>
          <div className="ov-legend">
            <span className="ov-dot green" />On Site ({onSite})
            <span className="ov-dot blue" />On Leave ({onLeave})
            <span className="ov-dot orange" />Off Site ({offSite})
          </div>
          <div className="ov-site-pct">{onSitePct}% workforce on site</div>
        </article>

        <article className="overview-panel">
          <h3>Record Completion</h3>
          {employees.length === 0
            ? <p className="ov-empty">No employees added yet.</p>
            : <>
                <div className="ov-completion-bar">
                  <div style={{ width: `${Math.round(((employees.length - pendingEmployees.length) / employees.length) * 100)}%` }} />
                </div>
                <div className="ov-completion-label">
                  <span>{employees.length - pendingEmployees.length} complete</span>
                  <span>{pendingEmployees.length} pending</span>
                </div>
                {pendingEmployees.length > 0 && (
                  <ul className="ov-list">
                    {pendingEmployees.slice(0, 5).map((employee) => (
                      <li key={employee.employeeId}>
                        <span>{employee.fullName || 'Unnamed'}</span>
                        <small>{getPendingTasks(employee).join(', ')}</small>
                      </li>
                    ))}
                    {pendingEmployees.length > 5 && <li className="ov-more">+ {pendingEmployees.length - 5} more pending</li>}
                  </ul>
                )}
              </>
          }
        </article>

        <article className="overview-panel">
          <h3>Employees by Section</h3>
          {deptCounts.length === 0
            ? <p className="ov-empty">No department data yet.</p>
            : <div className="ov-dept-bars">
                {deptCounts.map(([dept, count]) => (
                  <div className="dept-bar-item" key={dept}>
                    <span className="dept-bar-label">{dept}</span>
                    <div className="dept-bar-track">
                      <div className="dept-bar-fill" style={{ width: `${Math.round((count / maxDeptCount) * 100)}%` }} />
                    </div>
                    <span className="dept-bar-count">{count}</span>
                  </div>
                ))}
              </div>
          }
        </article>

        <article className="overview-panel">
          <h3>Recent Leave Requests</h3>
          {recentLeave.length === 0
            ? <p className="ov-empty">No leave requests yet.</p>
            : <ul className="ov-list">
                {recentLeave.map((record) => (
                  <li key={record.id}>
                    <span>{record.name}</span>
                    <small>{record.department} · {leaveTypeLabel(record.leaveTypeCode)} · {formatDateDisplay(record.departureDate)}</small>
                    <StatusBadge status={record.step} />
                  </li>
                ))}
              </ul>
          }
        </article>
      </div>
    </section>
  )
}

function EmployeeFormModal({ form, mode, onClose, onSave, setForm }: {
  form: EmployeeForm
  mode: 'add' | 'edit'
  onClose: () => void
  onSave: () => void
  setForm: (form: EmployeeForm) => void
}) {
  const update = (key: keyof EmployeeForm, value: string) => {
    const next = { ...form, [key]: value }
    if (key === 'nationality' && value === 'MALDIVES') next.workPermitNo = ''
    setForm(next)
  }
  const wpDisabled = form.nationality === 'MALDIVES'

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal emp-form-modal" role="dialog" aria-modal="true" aria-labelledby="registration-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{mode === 'add' ? 'New employee' : 'Edit employee'}</p>
            <h2 id="registration-title">{mode === 'add' ? 'Add Employee' : 'Update Employee'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">✕</button>
        </div>

        <div className="emp-form-section">
          <div className="emp-form-section-label">Personal Details</div>
          <div className="emp-form-grid">
            <label className="ef-span3"><span>Full Name</span><input disabled={mode === 'edit'} value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Full name as per passport / NIC" /></label>
            <label><span>Date of Birth</span><input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} /></label>
            <label><span>Gender</span><select value={form.gender ?? ''} onChange={(e) => update('gender', e.target.value)}><option value="">— Select —</option><option>Male</option><option>Female</option></select></label>
            <label><span>Nationality</span><select value={form.nationality} onChange={(e) => update('nationality', e.target.value)}>{nationalities.map((n) => <option key={n}>{n}</option>)}</select></label>
            <label className="ef-span2"><span>NIC / Passport No</span><input value={form.nicPassportNo} onChange={(e) => update('nicPassportNo', e.target.value)} placeholder="NIC or passport number" /></label>
            <label><span>Mobile No</span><input value={form.mobileNo} onChange={(e) => update('mobileNo', e.target.value)} placeholder="+960 xxx xxxx" /></label>
          </div>
        </div>

        <div className="emp-form-section">
          <div className="emp-form-section-label">Employment Details</div>
          <div className="emp-form-grid">
            <label><span>Emp ID</span><input value={form.employeeId} onChange={(e) => update('employeeId', e.target.value)} placeholder="e.g. TIC-0001" /></label>
            <label><span>Section</span><select value={form.department} onChange={(e) => update('department', e.target.value)}>{departmentsList.map((d) => <option key={d}>{d}</option>)}</select></label>
            <label><span>Designation</span><input value={form.designation} onChange={(e) => update('designation', e.target.value)} placeholder="Job title" /></label>
            <label><span>Date of Join</span><input type="date" value={form.dateOfJoin} onChange={(e) => update('dateOfJoin', e.target.value)} /></label>
            <label><span>Work Permit No</span><input disabled={wpDisabled} placeholder={wpDisabled ? 'N/A — Maldivian' : 'Work permit number'} value={wpDisabled ? '' : form.workPermitNo} onChange={(e) => update('workPermitNo', e.target.value)} /></label>
            <label><span>Site Status</span><select value={form.siteStatus} onChange={(e) => update('siteStatus', e.target.value as SiteStatus)}><option>On Site</option><option>Off Site</option><option>On Leave</option></select></label>
          </div>
        </div>

        <div className="modal-actions">
          <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
          <button className="primary-button" onClick={onSave} type="button">{mode === 'add' ? 'Add Employee' : 'Save Changes'}</button>
        </div>
      </section>
    </div>
  )
}

type SortKey = 'employeeId' | 'fullName' | 'department' | 'designation' | 'nationality' | 'dateOfJoin' | 'siteStatus'

function EmployeesPage({ employees, onAdd, onEdit, onExport, onImport, onTemplate, onShowTasks }: {
  employees: Employee[]
  onAdd: () => void
  onEdit: (employee: Employee) => void
  onExport: () => void
  onImport: () => void
  onTemplate: () => void
  onShowTasks: () => void
}) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('All Sections')
  const [status, setStatus] = useState('All Statuses')
  const [nationality, setNationality] = useState('All Nationalities')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(50)
  const [sortKey, setSortKey] = useState<SortKey>('department')
  const [sortAsc, setSortAsc] = useState(true)

  const departments = useMemo(() => ['All Sections', ...Array.from(new Set(employees.map((employee) => employee.department))).sort()], [employees])
  const nationalityList = useMemo(() => {
    // Build a set of ALL section names from both the predefined list and actual employee data
    // so imported sections that differ from the predefined list are also excluded
    const deptSet = new Set([
      ...departmentsList,
      ...employees.map((e) => e.department).filter(Boolean),
    ])
    const validNats = Array.from(new Set(
      employees.map((e) => e.nationality).filter((n) => n && !deptSet.has(n))
    )).sort()
    return ['All Nationalities', ...validNats]
  }, [employees])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) { setSortAsc((prev) => !prev) } else { setSortKey(key); setSortAsc(true) }
    setPage(1)
  }

  const SortTh = ({ col, label }: { col: SortKey; label: string }) => (
    <th className={`sortable-th${sortKey === col ? ' sort-active' : ''}`} onClick={() => handleSort(col)}>
      {label}<span className="sort-indicator">{sortKey === col ? (sortAsc ? ' ↑' : ' ↓') : ' ⇅'}</span>
    </th>
  )

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return [...employees].filter((employee) => {
      const haystack = [employee.employeeId, employee.fullName, employee.department, employee.designation, employee.nationality, employee.nicPassportNo, employee.workPermitNo, employee.mobileNo].join(' ').toLowerCase()
      return haystack.includes(normalized)
        && (department === 'All Sections' || employee.department === department)
        && (status === 'All Statuses' || employee.siteStatus === status)
        && (nationality === 'All Nationalities' || employee.nationality === nationality)
    }).sort((a, b) => {
      const va = String(a[sortKey] ?? '').toLowerCase()
      const vb = String(b[sortKey] ?? '').toLowerCase()
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  }, [department, employees, nationality, query, sortAsc, sortKey, status])

  const totalPages = pageSize === 'All' ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const visibleRows = pageSize === 'All' ? filtered : filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const setFilter = (setter: (value: string) => void, value: string) => { setter(value); setPage(1) }

  const pendingCount = employees.filter((employee) => recordStatus(employee) === 'Pending').length

  return (
    <>
      <PageHeader eyebrow="Employee register" title="Employees" subtitle="TIC Employee Details in one place with site status" />
      <section className="employee-workspace">
        <div className="table-actions">
          <div className="table-actions-left">
            <button className="primary-button" onClick={onTemplate} type="button">Template</button>
            <button className="primary-button" onClick={onImport} type="button">Import</button>
          </div>
          <div className="table-actions-right">
            <button className="primary-button" onClick={onShowTasks} type="button">
              Pending Tasks{pendingCount > 0 && <span className="pending-count-badge" style={{ marginLeft: '6px' }}>{pendingCount}</span>}
            </button>
            <button className="primary-button" onClick={onExport} type="button">Export</button>
            <button className="primary-button" onClick={onAdd} type="button">Add Employee</button>
          </div>
        </div>
        <div className="table-toolbar employee-toolbar">
          <label className="search-field"><span>Search</span><input onChange={(event) => setFilter(setQuery, event.target.value)} placeholder="Name, ID, section, designation, passport, permit..." type="search" value={query} /></label>
          <label><span>Section</span><select onChange={(event) => setFilter(setDepartment, event.target.value)} value={department}>{departments.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Nationality</span><select onChange={(event) => setFilter(setNationality, event.target.value)} value={nationality}>{nationalityList.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Status</span><select onChange={(event) => setFilter(setStatus, event.target.value)} value={status}>{['All Statuses', 'On Site', 'Off Site', 'On Leave'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Rows</span><select onChange={(event) => { setPageSize(event.target.value === 'All' ? 'All' : Number(event.target.value) as 50 | 100); setPage(1) }} value={pageSize}><option>50</option><option>100</option><option>All</option></select></label>
        </div>
        <div className="employee-table-shell">
          <table className="data-table employee-table">
            <thead>
              <tr>
                <th>#</th>
                <SortTh col="employeeId" label="Emp ID" />
                <SortTh col="fullName" label="Full Name" />
                <SortTh col="department" label="Section" />
                <SortTh col="designation" label="Designation" />
                <SortTh col="nationality" label="Nationality" />
                <th>NIC/PP No</th>
                <th>WP No</th>
                <SortTh col="dateOfJoin" label="Date of Join" />
                <th>Mobile No</th>
                <th>Date of Birth</th>
                <th>Age</th>
                <SortTh col="siteStatus" label="Site Status" />
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((employee, index) => (
                <tr className={`${recordStatus(employee) === 'Pending' ? 'pending-row' : ''} status-row-${employee.siteStatus.toLowerCase().replaceAll(' ', '-')}`} key={`${employee.employeeId}-${employee.fullName}`}>
                  <td>{pageSize === 'All' ? index + 1 : (safePage - 1) * pageSize + index + 1}</td>
                  <td className="col-empid">{employee.employeeId || 'Pending'}</td>
                  <td><div className="col-name">{employee.fullName}</div></td>
                  <td>{employee.department}</td>
                  <td><div className="col-desig">{employee.designation}</div></td>
                  <td>{employee.nationality === employee.department ? <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700 }}>⚠ Fix needed</span> : employee.nationality}</td>
                  <td>{employee.nicPassportNo}</td>
                  <td>{employee.nationality === 'MALDIVES' ? '—' : employee.workPermitNo || 'Pending'}</td>
                  <td>{formatDateDisplay(employee.dateOfJoin)}</td>
                  <td>{employee.mobileNo}</td>
                  <td>{employee.dateOfBirth ? formatDateDisplay(employee.dateOfBirth) : '—'}</td>
                  <td>{calculateAge(employee.dateOfBirth)}</td>
                  <td><StatusBadge status={employee.siteStatus} /></td>
                  <td><button className="action-glyph edit" onClick={() => onEdit(employee)} type="button" title="Edit" aria-label="Edit employee">✎</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibleRows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            {employees.length === 0 ? 'No employees added yet — use Add Employee or Import to get started.' : 'No employees match the current filters.'}
          </div>
        )}
        {filtered.length > 0 && (
          <div className="table-footer">
            <span>Showing {visibleRows.length ? (pageSize === 'All' ? 1 : (safePage - 1) * pageSize + 1) : 0}–{pageSize === 'All' ? filtered.length : Math.min(safePage * pageSize, filtered.length)} of {filtered.length}</span>
            <div>
              <button className="quiet-button light" disabled={safePage === 1 || pageSize === 'All'} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">Previous</button>
              <strong>{safePage} / {totalPages}</strong>
              <button className="quiet-button light" disabled={safePage === totalPages || pageSize === 'All'} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} type="button">Next</button>
            </div>
          </div>
        )}
      </section>
    </>
  )
}

function LeaveFormModal({
  employees,
  initialRecord,
  onClose,
  onSave,
}: {
  employees: Employee[]
  initialRecord?: LeaveRequestRecord | null
  onClose: () => void
  onSave: (record: LeaveRequestRecord) => void
}) {
  const initEmp = initialRecord ? employees.find((e) => e.employeeId === initialRecord.employeeId) ?? null : null
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(initEmp)
  const [searchQuery, setSearchQuery] = useState(initEmp ? `${initEmp.employeeId} – ${initEmp.fullName}` : '')
  const [showResults, setShowResults] = useState(false)
  const [leaveTypeCode, setLeaveTypeCode] = useState<LeaveTypeCode>(initialRecord?.leaveTypeCode ?? 'AL')
  const [departureDate, setDepartureDate] = useState(initialRecord?.departureDate ?? new Date().toISOString().slice(0, 10))
  const [returnDate, setReturnDate] = useState(initialRecord?.returnDate ?? new Date().toISOString().slice(0, 10))
  const [step, setStep] = useState<LeaveRequestStep>(initialRecord?.step ?? 'Letter Submitted')
  const [remarks, setRemarks] = useState(initialRecord?.remarks ?? '')

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q || selectedEmp) return []
    return employees.filter((e) =>
      e.employeeId.toLowerCase().includes(q) || e.fullName.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [searchQuery, selectedEmp, employees])

  const totalDays = dayCount(departureDate, returnDate)

  const selectEmployee = (emp: Employee) => {
    setSelectedEmp(emp)
    setSearchQuery(`${emp.employeeId} – ${emp.fullName}`)
    setShowResults(false)
  }

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setSelectedEmp(null)
    setShowResults(true)
  }

  const canSave = !!selectedEmp && !!departureDate && !!returnDate

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal lf-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Leave request</p>
            <h2>{initialRecord ? 'Edit Leave Request' : 'Add Leave Request'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">✕</button>
        </div>

        {/* Employee search */}
        <div className="lf-section-label">Employee</div>
        <div className="lf-search-wrap">
          <input
            className="lf-search-input"
            placeholder="Search by Emp ID or name…"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => !selectedEmp && setShowResults(true)}
            autoComplete="off"
          />
          {showResults && searchResults.length > 0 && (
            <ul className="lf-search-results">
              {searchResults.map((emp) => (
                <li key={emp.employeeId} onMouseDown={() => selectEmployee(emp)}>
                  <span className="lf-res-id">{emp.employeeId}</span>
                  <span className="lf-res-name">{emp.fullName}</span>
                  <span className="lf-res-dept">{emp.department}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Auto-filled employee info */}
        <div className="lf-grid lf-grid-2" style={{ marginTop: '12px' }}>
          <label>
            <span>NIC / PP No</span>
            <input readOnly value={selectedEmp?.nicPassportNo ?? ''} placeholder="—" className="lf-readonly" />
          </label>
          <label>
            <span>Section</span>
            <input readOnly value={selectedEmp?.department ?? ''} placeholder="—" className="lf-readonly" />
          </label>
        </div>

        {/* Leave type + remarks */}
        <div className="lf-grid lf-grid-2" style={{ marginTop: '10px' }}>
          <label>
            <span>Leave Type</span>
            <select value={leaveTypeCode} onChange={(e) => setLeaveTypeCode(e.target.value as LeaveTypeCode)}>
              {leaveTypeOptions.map((item) => <option key={item.code} value={item.code}>{item.label} ({item.code})</option>)}
            </select>
          </label>
          <label>
            <span>Remarks</span>
            <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes" />
          </label>
        </div>

        {/* Dates + days */}
        <div className="lf-grid lf-grid-3" style={{ marginTop: '10px' }}>
          <label>
            <span>Departure Date</span>
            <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
          </label>
          <label>
            <span>Return Date</span>
            <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          </label>
          <label>
            <span>Total Days</span>
            <input readOnly value={totalDays > 0 ? `${totalDays} day${totalDays !== 1 ? 's' : ''}` : '—'} className="lf-readonly" />
          </label>
        </div>

        {/* Status (edit only) */}
        {initialRecord && (
          <div className="lf-grid lf-grid-2" style={{ marginTop: '10px' }}>
            <label>
              <span>Status</span>
              <select value={step} onChange={(e) => setStep(e.target.value as LeaveRequestStep)}>
                {requestSteps.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
        )}

        <div className="modal-actions">
          <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
          <button className="primary-button" disabled={!canSave} onClick={() => {
            if (!selectedEmp) return
            onSave({
              id: initialRecord?.id ?? `LVR-${Date.now()}`,
              employeeId: selectedEmp.employeeId,
              name: selectedEmp.fullName,
              department: selectedEmp.department,
              nationality: selectedEmp.nationality,
              leaveTypeCode,
              departureDate,
              returnDate,
              days: totalDays,
              step,
              remarks,
            })
          }} type="button">{initialRecord ? 'Update Request' : 'Save Request'}</button>
        </div>
      </section>
    </div>
  )
}

function PassportHandoverModal({
  record,
  employees,
  onClose,
  onSave,
}: {
  record: PassportHandoverRecord
  employees: Employee[]
  onClose: () => void
  onSave: (record: PassportHandoverRecord) => void
}) {
  const [employeeId, setEmployeeId] = useState(record.employeeId)
  const [leaveTypeCode, setLeaveTypeCode] = useState<LeaveTypeCode>(record.leaveTypeCode)
  const [departureDate, setDepartureDate] = useState(record.departureDate)
  const [returnDate, setReturnDate] = useState(record.returnDate)
  const [passportStep, setPassportStep] = useState<PassportStep>(record.passportStep)
  const [givenDate, setGivenDate] = useState(record.givenDate ?? '')
  const [returnedDate, setReturnedDate] = useState(record.returnedDate ?? '')
  const [sentToHoDate, setSentToHoDate] = useState(record.sentToHoDate ?? '')
  const [remarks, setRemarks] = useState(record.remarks ?? '')

  const employee = employees.find((item) => item.employeeId === employeeId) ?? employees[0]

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header"><div><p className="eyebrow">Passport handover</p><h2>{record.name ? 'Edit Passport Workflow' : 'Add Passport Workflow'}</h2><p>{employee?.employeeId ?? '-'} - {employee?.fullName ?? '-'}</p></div><button className="icon-button" onClick={onClose} type="button">x</button></div>
        <div className="form-grid">
          <label><span>Employee</span><select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>{employees.slice(0, 120).map((item) => <option key={item.employeeId} value={item.employeeId}>{item.employeeId} - {item.fullName}</option>)}</select></label>
          <label><span>Leave Type</span><select value={leaveTypeCode} onChange={(event) => setLeaveTypeCode(event.target.value as LeaveTypeCode)}>{leaveTypeOptions.map((item) => <option key={item.code} value={item.code}>{item.label} ({item.code})</option>)}</select></label>
          <label><span>Departure Date</span><input type="date" value={departureDate} onChange={(event) => setDepartureDate(event.target.value)} /></label>
          <label><span>Return Date</span><input type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} /></label>
          <label><span>Status</span><select value={passportStep} onChange={(event) => setPassportStep(event.target.value as PassportStep)}>{passportSteps.map((step) => <option key={step}>{step}</option>)}</select></label>
          <label><span>Issued Date</span><input type="date" value={givenDate} onChange={(event) => setGivenDate(event.target.value)} /></label>
          <label><span>Returned Date</span><input type="date" value={returnedDate} onChange={(event) => setReturnedDate(event.target.value)} /></label>
          <label><span>Sent to HO Date</span><input type="date" value={sentToHoDate} onChange={(event) => setSentToHoDate(event.target.value)} /></label>
          <label className="full-field"><span>Remarks</span><input value={remarks} onChange={(event) => setRemarks(event.target.value)} /></label>
        </div>
        <div className="modal-actions"><button className="quiet-button light" onClick={onClose} type="button">Cancel</button><button className="primary-button" onClick={() => onSave({
          ...record,
          employeeId: employee?.employeeId ?? '',
          name: employee?.fullName ?? '',
          department: employee?.department ?? departmentsList[0],
          nationality: employee?.nationality ?? 'MALDIVES',
          leaveTypeCode,
          departureDate,
          returnDate,
          days: dayCount(departureDate, returnDate),
          passportStep,
          givenDate,
          returnedDate,
          sentToHoDate,
          remarks,
        })} type="button">Save Passport</button></div>
      </section>
    </div>
  )
}

function LeavePage({
  employees,
  leaveRequests,
  activeLeaves,
  leaveHistory,
  passportHandovers,
  onAddRequest,
  onAddPassport,
  onEditRequest,
  onDeleteRequest,
  onAdvanceRequestStep,
  onHistoryConfirm,
  onEditPassport,
  onDeletePassport,
}: {
  employees: Employee[]
  leaveRequests: LeaveRequestRecord[]
  activeLeaves: ActiveLeaveRecord[]
  leaveHistory: LeaveHistoryRecord[]
  passportHandovers: PassportHandoverRecord[]
  onAddRequest: () => void
  onAddPassport: () => void
  onEditRequest: (record: LeaveRequestRecord) => void
  onDeleteRequest: (id: string) => void
  onAdvanceRequestStep: (id: string) => void
  onHistoryConfirm: (id: string, confirmation: HistoryConfirmation) => void
  onEditPassport: (record: PassportHandoverRecord) => void
  onDeletePassport: (id: string) => void
}) {
  const [activeLeaveView, setActiveLeaveView] = useState<LeaveView>('request')

  const empMap = useMemo(() => new Map(employees.map((e) => [e.employeeId, e])), [employees])
  const getNic = (empId: string) => empMap.get(empId)?.nicPassportNo ?? '—'

  const [requestSearch, setRequestSearch] = useState('')
  const [requestTypeFilter, setRequestTypeFilter] = useState<'All' | LeaveTypeCode>('All')
  const [requestStatusFilter, setRequestStatusFilter] = useState<'All' | LeaveRequestStep>('All')
  const [requestDepartmentFilter, setRequestDepartmentFilter] = useState('All Departments')

  const [activeSearch, setActiveSearch] = useState('')
  const [activeTypeFilter, setActiveTypeFilter] = useState<'All' | LeaveTypeCode>('All')
  const [activeDepartmentFilter, setActiveDepartmentFilter] = useState('All Departments')

  const [historySearch, setHistorySearch] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'All' | HistoryConfirmation>('All')
  const [historyMonthFilter, setHistoryMonthFilter] = useState<'All' | string>('All')
  const [historyDepartmentFilter, setHistoryDepartmentFilter] = useState('All Departments')

  const [passportSearch, setPassportSearch] = useState('')
  const [passportDepartmentFilter, setPassportDepartmentFilter] = useState('All Departments')

  const historyMonths = useMemo(() => {
    const keys = Array.from(new Set(leaveHistory.map((record) => monthKey(record.returnDate)).filter(Boolean)))
    return keys.sort()
  }, [leaveHistory])

  const requestRows = useMemo(() => leaveRequests.filter((record) => {
    const matchesSearch = leaveSearchText(record).includes(requestSearch.trim().toLowerCase())
    const matchesType = requestTypeFilter === 'All' || record.leaveTypeCode === requestTypeFilter
    const matchesStatus = requestStatusFilter === 'All' || record.step === requestStatusFilter
    const matchesDepartment = requestDepartmentFilter === 'All Departments' || record.department === requestDepartmentFilter
    return matchesSearch && matchesType && matchesStatus && matchesDepartment
  }).sort((a, b) => a.departureDate.localeCompare(b.departureDate)), [leaveRequests, requestSearch, requestTypeFilter, requestStatusFilter, requestDepartmentFilter])

  const activeRows = useMemo(() => activeLeaves.filter((record) => {
    const matchesSearch = leaveSearchText(record).includes(activeSearch.trim().toLowerCase())
    const matchesType = activeTypeFilter === 'All' || record.leaveTypeCode === activeTypeFilter
    const matchesDepartment = activeDepartmentFilter === 'All Departments' || record.department === activeDepartmentFilter
    return matchesSearch && matchesType && matchesDepartment
  }).sort((a, b) => a.departureDate.localeCompare(b.departureDate)), [activeLeaves, activeSearch, activeTypeFilter, activeDepartmentFilter])

  const historyRows = useMemo(() => leaveHistory.filter((record) => {
    const matchesSearch = leaveSearchText(record).includes(historySearch.trim().toLowerCase())
    const matchesStatus = historyStatusFilter === 'All' || record.confirmation === historyStatusFilter
    const matchesMonth = historyMonthFilter === 'All' || monthKey(record.returnDate) === historyMonthFilter
    const matchesDepartment = historyDepartmentFilter === 'All Departments' || record.department === historyDepartmentFilter
    return matchesSearch && matchesStatus && matchesMonth && matchesDepartment
  }).sort((a, b) => a.departureDate.localeCompare(b.departureDate)), [leaveHistory, historySearch, historyStatusFilter, historyMonthFilter, historyDepartmentFilter])

  const passportRows = useMemo(() => passportHandovers.filter((record) => {
    const matchesSearch = leaveSearchText(record).includes(passportSearch.trim().toLowerCase())
    const matchesDepartment = passportDepartmentFilter === 'All Departments' || record.department === passportDepartmentFilter
    return matchesSearch && matchesDepartment
  }).sort((a, b) => a.departureDate.localeCompare(b.departureDate)), [passportHandovers, passportSearch, passportDepartmentFilter])

  const currentCount = activeLeaveView === 'request' ? requestRows.length : activeLeaveView === 'active' ? activeRows.length : activeLeaveView === 'history' ? historyRows.length : passportRows.length

  return (
    <>
      <PageHeader eyebrow="Leave management" title="Leave tracker" subtitle="Leave Request to Active Leaves to Leave History with passport handover tracking in parallel." />
      <section className="employee-workspace leave-workspace">
        <div className="leave-section-tabs">
          {[
            ['request', 'LEAVE REQUEST'],
            ['active', 'ACTIVE LEAVES'],
            ['history', 'LEAVE HISTORY'],
            ['passport', 'PASSPORT HANDOVER'],
          ].map(([id, label]) => <button className={activeLeaveView === id ? 'active' : ''} key={id} onClick={() => setActiveLeaveView(id as LeaveView)} type="button">{label}</button>)}
        </div>

        {activeLeaveView === 'request' && (
          <>
            <div className="table-toolbar leave-toolbar leave-toolbar-4 leave-toolbar-has-btn">
              <label className="search-field"><span>Search</span><input type="search" value={requestSearch} onChange={(event) => setRequestSearch(event.target.value)} placeholder="Employee, ID, purpose" /></label>
              <label><span>Leave Type</span><select value={requestTypeFilter} onChange={(event) => setRequestTypeFilter(event.target.value as 'All' | LeaveTypeCode)}><option value="All">All Types</option>{leaveTypeOptions.map((item) => <option key={item.code} value={item.code}>{item.label} ({item.code})</option>)}</select></label>
              <label><span>Status</span><select value={requestStatusFilter} onChange={(event) => setRequestStatusFilter(event.target.value as 'All' | LeaveRequestStep)}><option value="All">All Statuses</option>{requestSteps.map((step) => <option key={step}>{step}</option>)}</select></label>
              <label><span>Section</span><select value={requestDepartmentFilter} onChange={(event) => setRequestDepartmentFilter(event.target.value)}><option>All Departments</option>{departmentsList.map((item) => <option key={item}>{item}</option>)}</select></label>
              <button className="primary-button toolbar-add-btn" onClick={onAddRequest} type="button">Add Leave Request</button>
            </div>
            <div className="employee-table-shell compact-scroll">
              <table className="data-table leave-table"><thead><tr><th>Emp ID</th><th>Name</th><th>Section</th><th>NIC / PP No</th><th className="leave-type-th">Leave Type</th><th className="leave-date-th">Departure</th><th className="leave-date-th">Return</th><th className="leave-days-th">Days</th><th>Remarks</th><th className="leave-status-th">Status</th><th>Action</th></tr></thead><tbody>
                {requestRows.map((record) => {
                  const stepIdx = requestSteps.indexOf(record.step)
                  return (
                    <tr key={record.id}>
                      <td>{record.employeeId}</td>
                      <td>{record.name}</td>
                      <td>{record.department}</td>
                      <td>{getNic(record.employeeId)}</td>
                      <td className="leave-type-cell"><LeaveTypeBadge code={record.leaveTypeCode} /></td>
                      <td className="leave-date-cell">{formatDateDisplay(record.departureDate)}</td>
                      <td className="leave-date-cell">{formatDateDisplay(record.returnDate)}</td>
                      <td className="leave-days-cell">{record.days}</td>
                      <td className="leave-remarks-cell">{record.remarks || <span className="muted-dash">—</span>}</td>
                      <td className="leave-status-cell">
                        <button type="button" className={`status-advance-btn step-${stepIdx}`} disabled={record.step === 'Pending Departure'} onClick={() => onAdvanceRequestStep(record.id)} title={record.step === 'Pending Departure' ? '' : 'Click to advance'}>{record.step}</button>
                      </td>
                      <td>
                        <div className="row-actions request-inline-actions">
                          <button className="action-glyph edit" onClick={() => onEditRequest(record)} type="button" title="Edit" aria-label="Edit request">✎</button>
                          <button className="action-glyph delete" onClick={() => onDeleteRequest(record.id)} type="button" title="Delete" aria-label="Delete request">🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody></table>
            </div>
          </>
        )}

        {activeLeaveView === 'active' && (
          <>
            <div className="table-toolbar leave-toolbar leave-toolbar-3">
              <label className="search-field"><span>Search</span><input type="search" value={activeSearch} onChange={(event) => setActiveSearch(event.target.value)} placeholder="Employee, ID, purpose" /></label>
              <label><span>Section</span><select value={activeDepartmentFilter} onChange={(event) => setActiveDepartmentFilter(event.target.value)}><option>All Departments</option>{departmentsList.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>Leave Type</span><select value={activeTypeFilter} onChange={(event) => setActiveTypeFilter(event.target.value as 'All' | LeaveTypeCode)}><option value="All">All Types</option>{leaveTypeOptions.map((item) => <option key={item.code} value={item.code}>{item.label} ({item.code})</option>)}</select></label>
            </div>
            <div className="employee-table-shell compact-scroll">
              <table className="data-table leave-table"><thead><tr><th>Emp ID</th><th>Name</th><th>Section</th><th>NIC / PP No</th><th className="leave-type-th">Leave Type</th><th className="leave-date-th">Departure</th><th className="leave-date-th">Return</th><th className="leave-days-th">Days</th><th>Remarks</th><th className="leave-status-th">Status</th></tr></thead><tbody>
                {activeRows.map((record) => <tr key={record.id}><td>{record.employeeId}</td><td>{record.name}</td><td>{record.department}</td><td>{getNic(record.employeeId)}</td><td className="leave-type-cell"><LeaveTypeBadge code={record.leaveTypeCode} /></td><td className="leave-date-cell">{formatDateDisplay(record.departureDate)}</td><td className="leave-date-cell">{formatDateDisplay(record.returnDate)}</td><td className="leave-days-cell">{record.days}</td><td className="leave-remarks-cell">{record.remarks || <span className="muted-dash">—</span>}</td><td className="leave-status-cell-sm"><StatusBadge status="Departed" /></td></tr>)}
              </tbody></table>
            </div>
          </>
        )}

        {activeLeaveView === 'history' && (
          <>
            <div className="table-toolbar leave-toolbar leave-toolbar-4">
              <label className="search-field"><span>Search</span><input type="search" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Employee, ID, purpose" /></label>
              <label><span>Status</span><select value={historyStatusFilter} onChange={(event) => setHistoryStatusFilter(event.target.value as 'All' | HistoryConfirmation)}><option value="All">All Status</option><option>Returned</option><option>Not Returned</option></select></label>
              <label><span>Month</span><select value={historyMonthFilter} onChange={(event) => setHistoryMonthFilter(event.target.value)}><option value="All">All Months</option>{historyMonths.map((key) => <option key={key} value={key}>{formatMonthLabel(key)}</option>)}</select></label>
              <label><span>Section</span><select value={historyDepartmentFilter} onChange={(event) => setHistoryDepartmentFilter(event.target.value)}><option>All Departments</option>{departmentsList.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <div className="employee-table-shell compact-scroll">
              <table className="data-table leave-table"><thead><tr><th>Emp ID</th><th>Name</th><th>Section</th><th>NIC / PP No</th><th className="leave-type-th">Leave Type</th><th className="leave-date-th">Departure</th><th className="leave-date-th">Return</th><th className="leave-days-th">Days</th><th>Remarks</th><th className="leave-status-th">Status</th></tr></thead><tbody>
                {historyRows.map((record) => <tr className={record.confirmation === 'Not Returned' ? 'not-returned-row' : ''} key={record.id}><td>{record.employeeId}</td><td>{record.name}</td><td>{record.department}</td><td>{getNic(record.employeeId)}</td><td className="leave-type-cell"><LeaveTypeBadge code={record.leaveTypeCode} /></td><td className="leave-date-cell">{formatDateDisplay(record.departureDate)}</td><td className="leave-date-cell">{formatDateDisplay(record.returnDate)}</td><td className="leave-days-cell">{record.days}</td><td className="leave-remarks-cell">{record.remarks || <span className="muted-dash">—</span>}</td><td className="leave-status-cell-sm">{record.confirmation ? <StatusBadge status={record.confirmation} /> : <div className="row-actions history-confirm-actions"><button className="mini-button" onClick={() => onHistoryConfirm(record.id, 'Returned')} type="button">Returned</button><button className="mini-button danger" onClick={() => onHistoryConfirm(record.id, 'Not Returned')} type="button">Not Returned</button></div>}</td></tr>)}
              </tbody></table>
            </div>
          </>
        )}

        {activeLeaveView === 'passport' && (
          <>
            <div className="table-toolbar leave-toolbar leave-toolbar-3 leave-toolbar-has-btn">
              <label className="search-field"><span>Search</span><input type="search" value={passportSearch} onChange={(event) => setPassportSearch(event.target.value)} placeholder="Employee, ID, purpose" /></label>
              <label><span>Section</span><select value={passportDepartmentFilter} onChange={(event) => setPassportDepartmentFilter(event.target.value)}><option>All Departments</option>{departmentsList.map((item) => <option key={item}>{item}</option>)}</select></label>
              <button className="primary-button toolbar-add-btn" onClick={onAddPassport} type="button">Add Passport</button>
            </div>
            <div className="employee-table-shell compact-scroll">
              <table className="data-table leave-table"><thead><tr><th>Emp ID</th><th>Name</th><th>Section</th><th>NIC / PP No</th><th className="leave-type-th">Leave Type</th><th className="leave-status-th">Status</th><th>Issued Date</th><th>Returned Date</th><th>Sent to HO Date</th><th>Remarks</th><th>Action</th></tr></thead><tbody>
                {passportRows.map((record) => <tr key={record.id}><td>{record.employeeId}</td><td>{record.name}</td><td>{record.department}</td><td>{getNic(record.employeeId)}</td><td>{record.leaveTypeCode}</td><td className="passport-status-cell"><StatusBadge status={record.passportStep} /></td><td>{record.givenDate ? formatDateDisplay(record.givenDate) : '-'}</td><td>{record.returnedDate ? formatDateDisplay(record.returnedDate) : '-'}</td><td>{record.sentToHoDate ? formatDateDisplay(record.sentToHoDate) : '-'}</td><td>{record.remarks || '-'}</td><td className="passport-action-cell"><div className="row-actions request-inline-actions"><button className="action-glyph edit" onClick={() => onEditPassport(record)} type="button" title="Edit" aria-label="Edit passport">✎</button><button className="action-glyph delete" onClick={() => onDeletePassport(record.id)} type="button" title="Delete" aria-label="Delete passport">🗑</button></div></td></tr>)}
              </tbody></table>
            </div>
          </>
        )}

        <div className="leave-empty-zone">
          {currentCount === 0 ? 'No records yet. Details will appear here when entries are added.' : `Showing ${currentCount} record${currentCount > 1 ? 's' : ''}.`}
        </div>
      </section>
    </>
  )
}

function InductionModal({ employees, record, onClose, onSave }: {
  employees: Employee[]
  record: InductionRecord
  onClose: () => void
  onSave: (record: InductionRecord) => void
}) {
  const isNew = record.id.startsWith('IND-new')

  const [refNo, setRefNo] = useState(record.refNo)
  const [inductionDate, setInductionDate] = useState(
    record.inductionDate || new Date().toISOString().slice(0, 10)
  )
  const [conductedByEmpId, setConductedByEmpId] = useState(record.conductedByEmpId ?? '')
  const [conductedBy, setConductedBy] = useState(record.conductedBy)
  const [inductionContent, setInductionContent] = useState(record.inductionContent)
  const [remarks, setRemarks] = useState(record.remarks)

  // Start with at least one blank row when creating new, else existing participants
  const blankRow = (): InductionParticipant => ({ employeeId: '', name: '', nicPassportNo: '', section: '', department: '' })
  const [participants, setParticipants] = useState<InductionParticipant[]>(
    record.participants.length > 0 ? record.participants : [blankRow()]
  )

  const hrEmployees = employees.filter((e) => e.department === 'HUMAN RESOURCES')

  const derivedFullRef = fullInductionRef(refNo, inductionDate)

  const handleConductedBySelect = (empId: string) => {
    setConductedByEmpId(empId)
    const emp = employees.find((e) => e.employeeId === empId)
    setConductedBy(emp ? emp.fullName : '')
  }

  const updateRow = (index: number, field: keyof InductionParticipant, value: string) => {
    setParticipants((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const addRow = () => setParticipants((prev) => [...prev, blankRow()])

  const removeRow = (index: number) => {
    setParticipants((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.length > 0 ? next : [blankRow()]
    })
  }

  const save = () => {
    const cleanParticipants = participants.filter((p) => p.name.trim() || p.employeeId.trim())
    onSave({
      ...record,
      refNo,
      inductionDate,
      conductedBy,
      conductedByEmpId: conductedByEmpId || undefined,
      participants: cleanParticipants,
      inductionContent,
      status: 'Completed',
      remarks,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal wide-modal induction-modal-shell" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Induction Session</p>
            <h2 className="ind-modal-ref">{derivedFullRef}</h2>
            <p className="ind-modal-sub">Saved as <strong>Completed</strong> — update after the session is conducted</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        {/* ── 2-column form ── */}
        <div className="ind-form-grid">
          <label>
            <span>Sequence No</span>
            <input value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="e.g. 004" />
          </label>
          <label>
            <span>Induction Date</span>
            <input type="date" value={inductionDate} onChange={(e) => setInductionDate(e.target.value)} />
          </label>
          <label>
            <span>Full Reference</span>
            <input className="ind-ref-readonly" disabled value={derivedFullRef} />
          </label>
          <label>
            <span>Conducted By (HR Staff)</span>
            <select
              value={conductedByEmpId}
              onChange={(e) => handleConductedBySelect(e.target.value)}
            >
              <option value="">— Select HR person —</option>
              {hrEmployees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.fullName}{emp.designation ? ` — ${emp.designation}` : ''}
                </option>
              ))}
              {/* fallback: allow typing name if no HR staff in system */}
              {hrEmployees.length === 0 && conductedBy && (
                <option value="">{conductedBy}</option>
              )}
            </select>
          </label>
          {/* if no HR employees in system, show text input fallback */}
          {hrEmployees.length === 0 && (
            <label className="ind-span-2">
              <span>Conducted By (Name)</span>
              <input value={conductedBy} onChange={(e) => setConductedBy(e.target.value)} placeholder="HR person name" />
            </label>
          )}
          <label className="ind-span-2">
            <span>Topics Covered / Induction Content</span>
            <textarea
              className="induction-textarea"
              rows={3}
              value={inductionContent}
              onChange={(e) => setInductionContent(e.target.value)}
              placeholder="Topics covered — company intro, safety rules, HR policies, bank account setup, accommodation…"
            />
          </label>
          <label className="ind-span-2">
            <span>Remarks</span>
            <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any notes about this session" />
          </label>
        </div>

        {/* ── Manual participant table ── */}
        <div className="ind-participants-section">
          <div className="ind-participants-header">
            <h3 className="ind-participants-title">
              Participants
              <span className="ind-participants-count">{participants.filter(p => p.name.trim()).length}</span>
            </h3>
            <p className="ind-participants-hint">Enter details manually — staff may not yet be in the system</p>
            <button className="ind-add-row-btn" onClick={addRow} type="button">+ Add Row</button>
          </div>
          <div className="ind-table-scroll">
            <table className="data-table ind-edit-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}>#</th>
                  <th style={{ width: 76 }}>Emp ID</th>
                  <th>Full Name</th>
                  <th style={{ width: 110 }}>NIC / PP No</th>
                  <th style={{ width: 116 }}>Section</th>
                  <th style={{ width: 140 }}>Department</th>
                  <th style={{ width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, i) => (
                  <tr key={i}>
                    <td className="ind-row-num">{i + 1}</td>
                    <td><input className="cell-input" value={p.employeeId} onChange={(e) => updateRow(i, 'employeeId', e.target.value)} placeholder="ID" /></td>
                    <td><input className="cell-input cell-input-name" value={p.name} onChange={(e) => updateRow(i, 'name', e.target.value)} placeholder="Full name" /></td>
                    <td><input className="cell-input" value={p.nicPassportNo} onChange={(e) => updateRow(i, 'nicPassportNo', e.target.value)} placeholder="NIC or PP" /></td>
                    <td><input className="cell-input" value={p.section} onChange={(e) => updateRow(i, 'section', e.target.value)} placeholder="e.g. HR, Stores" /></td>
                    <td><input className="cell-input" value={p.department} onChange={(e) => updateRow(i, 'department', e.target.value)} placeholder="e.g. Thilafushi Industrial Complex" /></td>
                    <td>
                      <button className="action-glyph delete ind-remove-row" onClick={() => removeRow(i)} type="button" title="Remove row">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-actions">
          <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
          <button className="primary-button" onClick={save} type="button">
            {isNew ? 'Save as Completed' : 'Save Changes'}
          </button>
        </div>
      </section>
    </div>
  )
}

function InductionViewModal({ record, employees = [], onClose, onPrint }: {
  record: InductionRecord
  employees?: Employee[]
  onClose: () => void
  onPrint?: () => void
}) {
  const fullRef = fullInductionRef(record.refNo, record.inductionDate)
  const dateStr = record.inductionDate ? formatDateDisplay(record.inductionDate) : '—'
  const conductedByEmp = employees.find((e) => e.employeeId === record.conductedByEmpId)
  const conductedByDesig = conductedByEmp?.designation || ''
  const conductedByDisplay = (record.conductedBy || '—') + (record.conductedByEmpId ? ` (${record.conductedByEmpId})` : '')
  const countStr = String(record.participants.length).padStart(2, '0')

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal ind-preview-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Print Preview</p>
            <h2>{fullRef}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        <div className="ind-preview-scroll">
          <div className="ind-preview-doc">

            {/* ── Page 1 Header ── */}
            <div className="ind-prev-hdr">
              <div className="ind-prev-title">STAFF INDUCTION</div>
              <div className="ind-prev-sub">VHPL | Thilafushi Industrial Complex</div>
            </div>

            {/* ── Info table ── */}
            <table className="ind-prev-info">
              <tbody>
                <tr>
                  <td className="ind-pi-lbl">Reference No:</td>
                  <td className="ind-pi-val">{fullRef}</td>
                  <td className="ind-pi-lbl">Status:</td>
                  <td className="ind-pi-val ind-pi-completed">{record.status}</td>
                </tr>
                <tr>
                  <td className="ind-pi-lbl">Date:</td>
                  <td className="ind-pi-val">{dateStr}</td>
                  <td className="ind-pi-lbl">No. of Participants:</td>
                  <td className="ind-pi-val">{countStr}</td>
                </tr>
                <tr>
                  <td className="ind-pi-lbl">Department:</td>
                  <td className="ind-pi-val" colSpan={3} style={{ textTransform: 'uppercase' }}>Thilafushi Industrial Complex</td>
                </tr>
                <tr>
                  <td className="ind-pi-lbl">Conducted by:</td>
                  <td className="ind-pi-val" colSpan={3}>{conductedByDisplay}</td>
                </tr>
              </tbody>
            </table>

            {/* ── Participants table ── */}
            <p className="ind-prev-tbl-label">Participants</p>
            <table className="data-table ind-prev-ptbl">
              <colgroup>
                <col style={{ width: '4%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '14%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Emp ID</th>
                  <th>Full Name</th>
                  <th>NIC / PP No</th>
                  <th>Section</th>
                  <th>Department</th>
                  <th>Signature</th>
                </tr>
              </thead>
              <tbody>
                {record.participants.length === 0 ? (
                  <tr><td colSpan={7} className="empty-row">No participants recorded.</td></tr>
                ) : record.participants.map((p, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: 'center' }}>{i + 1}</td>
                    <td>{p.employeeId || '—'}</td>
                    <td>{p.name}</td>
                    <td>{p.nicPassportNo || '—'}</td>
                    <td>{p.section || '—'}</td>
                    <td style={{ textTransform: 'uppercase' }}>{p.department || '—'}</td>
                    <td className="ind-sig-cell-view"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Signature blocks ── */}
            <div className="ind-prev-sig-row">
              <div className="ind-prev-sig-block">
                <div className="ind-prev-sig-space"></div>
                <div className="ind-prev-sig-btm">
                  <div className="ind-prev-sig-role">Conducted By:</div>
                  <div className="ind-prev-sig-name">{conductedByDisplay}</div>
                  {conductedByDesig && <div className="ind-prev-sig-desig">{conductedByDesig}</div>}
                </div>
              </div>
              <div className="ind-prev-sig-block">
                <div className="ind-prev-sig-space"></div>
                <div className="ind-prev-sig-btm">
                  <div className="ind-prev-sig-role">Approved By:</div>
                  <div className="ind-prev-sig-name">Arushulla Rashid (50814)</div>
                  <div className="ind-prev-sig-desig">Administrator</div>
                </div>
              </div>
            </div>

            {/* ── Page 2 preview ── */}
            <div className="ind-prev-pg2">
              <p className="ind-prev-pg2-label">— Page 2: Summary —</p>
              <div className="ind-prev-pg2-meta">
                <span><strong>Ref No:</strong> {fullRef}</span>
                <span><strong>Date:</strong> {dateStr}</span>
              </div>
              <p className="ind-prev-tbl-label" style={{ marginTop: 8 }}>Summary</p>
              {record.inductionContent ? (
                <p className="ind-prev-content-text">{record.inductionContent}</p>
              ) : (
                <p className="ind-prev-content-default">
                  Company Introduction · Site Safety &amp; Rules · HR Policies · Work Permit &amp; Documentation · Accommodation &amp; Facilities · Bank Account Opening
                </p>
              )}
              {record.remarks && (
                <p className="ind-prev-remarks"><strong>Remarks:</strong> {record.remarks}</p>
              )}
            </div>

          </div>
        </div>

        <div className="modal-actions">
          {onPrint && (
            <button className="primary-button" onClick={onPrint} type="button">🖨 Print</button>
          )}
          <button className="back-btn-sm" onClick={onClose} type="button">Close</button>
        </div>
      </section>
    </div>
  )
}

function InductionParticipantsModal({ record, onClose }: { record: InductionRecord; onClose: () => void }) {
  const fullRef = fullInductionRef(record.refNo, record.inductionDate)
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal ind-participants-view-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Participants</p>
            <h2>{fullRef}</h2>
            <p>{record.inductionDate ? formatDateDisplay(record.inductionDate) : '—'} &nbsp;·&nbsp; {record.participants.length} participant{record.participants.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <table className="data-table ind-pv-table">
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '26%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '30%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>#</th>
              <th>Emp ID</th>
              <th>Full Name</th>
              <th>NIC / PP No</th>
              <th>Section</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {record.participants.length === 0 ? (
              <tr><td colSpan={6} className="empty-row">No participants recorded for this session.</td></tr>
            ) : record.participants.map((p, i) => (
              <tr key={i}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td>{p.employeeId || '—'}</td>
                <td>{p.name}</td>
                <td>{p.nicPassportNo || '—'}</td>
                <td>{p.section || '—'}</td>
                <td>{p.department || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="modal-actions">
          <button className="primary-button" onClick={onClose} type="button">Close</button>
        </div>
      </section>
    </div>
  )
}

function printInductionRecord(record: InductionRecord, employees: Employee[] = []) {
  const fullRef = fullInductionRef(record.refNo, record.inductionDate)
  const dateStr = record.inductionDate ? formatDateDisplay(record.inductionDate) : '—'
  const conductedByEmp = employees.find((e) => e.employeeId === record.conductedByEmpId)
  const conductedByDesig = conductedByEmp?.designation || ''
  const conductedByDisplay = (record.conductedBy || 'HR Officer') + (record.conductedByEmpId ? ` (${record.conductedByEmpId})` : '')
  const countStr = String(record.participants.length).padStart(2, '0')

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const filledRows = record.participants.map((p, i) => `
    <tr>
      <td class="tc">${i + 1}</td>
      <td>${esc(p.employeeId || '')}</td>
      <td>${esc(p.name)}</td>
      <td>${esc(p.nicPassportNo || '')}</td>
      <td>${esc(p.section || '')}</td>
      <td style="text-transform:uppercase">${esc(p.department || '')}</td>
      <td class="sig-cell"></td>
    </tr>`).join('')

  const emptyCount = Math.max(0, 8 - record.participants.length)
  const emptyRows = Array.from({ length: emptyCount }, (_, i) => `
    <tr>
      <td class="tc">${record.participants.length + i + 1}</td>
      <td></td><td></td><td></td><td></td><td></td>
      <td class="sig-cell"></td>
    </tr>`).join('')

  const defaultContent = `
    <p><strong>1. Company Introduction</strong><br>Overview of Thilafushi Industrial Complex Pvt. Ltd., its operations, core values, and organisational structure.</p>
    <p><strong>2. Site Safety &amp; Rules</strong><br>Workplace safety procedures, PPE requirements, emergency evacuation routes, fire drill procedures, and first aid kit locations.</p>
    <p><strong>3. HR Policies</strong><br>Working hours, leave entitlements, code of conduct, disciplinary procedures, and grievance handling process.</p>
    <p><strong>4. Work Permit &amp; Documentation</strong><br>Work permit requirements, document submission timelines, and compliance obligations for expatriate employees.</p>
    <p><strong>5. Accommodation &amp; Facilities</strong><br>Site accommodation rules, mess facilities, internet access, curfew policy, and recreational areas.</p>
    <p><strong>6. Bank Account Opening</strong><br>SBI / BOC / CBM account requirements, payroll cycle, salary payment dates, and wage protection procedures.</p>`

  const contentHtml = record.inductionContent
    ? esc(record.inductionContent).replace(/\n/g, '<br>')
    : defaultContent

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Staff Induction ${esc(fullRef)}</title>
  <style>
    @page { size: A4 portrait; margin: 18mm 16mm; }
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; color: #000; background: #f1f5f9; margin: 0; padding: 0; }

    /* ── Screen toolbar ── */
    .screen-bar {
      display: flex; align-items: center; gap: 14px;
      padding: 10px 20px; background: #1a0d52; position: sticky; top: 0; z-index: 10;
      font-family: system-ui, -apple-system, sans-serif; font-size: 13px;
    }
    .screen-bar button {
      padding: 7px 20px; background: #7c3aed; color: #fff; border: none;
      border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 0.03em;
    }
    .screen-bar button:hover { background: #6d28d9; }
    .screen-bar .ref-label { font-weight: 700; color: #ddd6fe; font-size: 13px; }
    .screen-bar .meta-label { color: rgba(221,214,254,0.7); font-size: 12px; }

    /* ── A4 page shells ── */
    .a4-wrap { max-width: 210mm; margin: 24px auto; display: flex; flex-direction: column; gap: 20px; padding-bottom: 40px; }
    .a4-page { background: #fff; padding: 18mm 16mm; box-shadow: 0 3px 16px rgba(0,0,0,0.13); min-height: 257mm; }

    /* ══ PAGE 1 ══ */
    .p1-hdr { text-align: center; padding-bottom: 10pt; border-bottom: 2.5pt solid #000; margin-bottom: 13pt; }
    .p1-title { font-size: 21pt; font-weight: 900; letter-spacing: 2.5px; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif; }
    .p1-sub { font-size: 11pt; margin-top: 4pt; letter-spacing: 0.4px; }

    /* Info table */
    .info-tbl { width: 100%; border-collapse: collapse; margin-bottom: 13pt; }
    .info-tbl td { border: 0.75pt solid #000; padding: 4.5pt 8pt; font-size: 10pt; }
    .info-tbl .lbl { font-weight: bold; background: #f0f0f0; width: 115pt; white-space: nowrap; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .info-tbl .status-ok { font-weight: bold; color: #166534; }

    /* Participants table */
    table.p-tbl { width: 100%; border-collapse: collapse; margin-bottom: 14pt; font-size: 9.5pt; table-layout: fixed; }
    .p-tbl th, .p-tbl td { border: 0.75pt solid #444; padding: 4pt 5pt; vertical-align: middle; }
    .p-tbl thead th { background: #ede9fe; font-weight: bold; text-align: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .p-tbl .tc { text-align: center; }
    .p-tbl .sig-cell { height: 22pt; }

    /* Signature blocks */
    .sig-row { display: flex; gap: 20pt; margin-top: 18pt; }
    .sig-block { flex: 1; border: 1pt solid #333; }
    .sig-space { height: 66pt; }
    .sig-info { padding: 6pt 8pt; border-top: 1pt solid #333; }
    .sig-role { font-size: 8.5pt; color: #555; }
    .sig-person { font-weight: bold; font-size: 10pt; margin-top: 2pt; }
    .sig-desig { font-size: 9pt; color: #333; margin-top: 2pt; }

    /* ══ PAGE 2 ══ */
    .p2-meta { display: flex; gap: 32pt; margin-bottom: 12pt; font-size: 10pt; padding: 5pt 0; border-bottom: 0.75pt solid #ccc; }
    .section-title { font-size: 11pt; font-weight: bold; margin: 0 0 9pt; padding-bottom: 4pt; border-bottom: 1pt solid #aaa; }
    .content-text { font-size: 10.5pt; line-height: 1.7; }
    .content-text p { margin: 0 0 8pt; }
    .remarks-box { margin-top: 14pt; padding: 6pt 10pt; border: 1pt solid #ccc; font-size: 9.5pt; background: #fafafa; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    /* ── Print ── */
    @media print {
      body { background: white; }
      .screen-bar { display: none !important; }
      .a4-wrap { max-width: none; margin: 0; padding: 0; gap: 0; }
      .a4-page { padding: 0; box-shadow: none; min-height: 261mm; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>

<div class="screen-bar">
  <button onclick="window.print()">🖨&nbsp; Print / Save as PDF</button>
  <span class="ref-label">${esc(fullRef)}</span>
  <span class="meta-label">${dateStr} &nbsp;·&nbsp; ${record.participants.length} participant${record.participants.length !== 1 ? 's' : ''} &nbsp;·&nbsp; ${esc(record.status)}</span>
</div>

<div class="a4-wrap">

  <!-- ══ PAGE 1 — Staff Induction ══ -->
  <div class="a4-page">

    <div class="p1-hdr">
      <div class="p1-title">STAFF INDUCTION</div>
      <div class="p1-sub">VHPL | Thilafushi Industrial Complex</div>
    </div>

    <table class="info-tbl">
      <tbody>
        <tr>
          <td class="lbl">Reference No:</td>
          <td>${esc(fullRef)}</td>
          <td class="lbl">Status:</td>
          <td class="status-ok">${esc(record.status)}</td>
        </tr>
        <tr>
          <td class="lbl">Date:</td>
          <td>${dateStr}</td>
          <td class="lbl">No. of Participants:</td>
          <td>${countStr}</td>
        </tr>
        <tr>
          <td class="lbl">Department:</td>
          <td colspan="3" style="text-transform:uppercase">Thilafushi Industrial Complex</td>
        </tr>
        <tr>
          <td class="lbl">Conducted by:</td>
          <td colspan="3">${esc(conductedByDisplay)}</td>
        </tr>
      </tbody>
    </table>

    <table class="p-tbl">
      <thead>
        <tr>
          <th style="width:20pt" class="tc">#</th>
          <th style="width:52pt">Emp ID</th>
          <th>Full Name</th>
          <th style="width:84pt">NIC/PP No</th>
          <th style="width:72pt">Section</th>
          <th style="width:82pt">Department</th>
          <th style="width:64pt">Signature</th>
        </tr>
      </thead>
      <tbody>
        ${filledRows}
        ${emptyRows}
      </tbody>
    </table>

    <div class="sig-row">
      <div class="sig-block">
        <div class="sig-space"></div>
        <div class="sig-info">
          <div class="sig-role">Conducted By:</div>
          <div class="sig-person">${esc(conductedByDisplay)}</div>
          ${conductedByDesig ? `<div class="sig-desig">${esc(conductedByDesig)}</div>` : ''}
        </div>
      </div>
      <div class="sig-block">
        <div class="sig-space"></div>
        <div class="sig-info">
          <div class="sig-role">Approved By:</div>
          <div class="sig-person">Arushulla Rashid (50814)</div>
          <div class="sig-desig">Administrator</div>
        </div>
      </div>
    </div>

  </div>

  <!-- ══ PAGE 2 — Content Summary ══ -->
  <div class="a4-page page-break">

    <div class="p1-hdr">
      <div class="p1-title">STAFF INDUCTION</div>
      <div class="p1-sub">VHPL | Thilafushi Industrial Complex</div>
    </div>

    <div class="p2-meta">
      <span><strong>Ref No:</strong> ${esc(fullRef)}</span>
      <span><strong>Date:</strong> ${dateStr}</span>
    </div>

    <div class="section-title">Summary</div>
    <div class="content-text">${contentHtml}</div>

    ${record.remarks ? `<div class="remarks-box"><strong>Remarks:</strong>&nbsp; ${esc(record.remarks)}</div>` : ''}

  </div>

</div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    win.focus()
  }
}

function TrainingModal({ record, employees, onClose, onSave }: {
  record: TrainingRecord
  employees: Employee[]
  onClose: () => void
  onSave: (record: TrainingRecord) => void
}) {
  const isNew = record.id.startsWith('TRN-new')
  const [trainingTitle, setTrainingTitle] = useState(record.trainingTitle)
  const [date, setDate] = useState(record.date)
  const [conductedBy, setConductedBy] = useState(record.conductedBy)
  const [trainingType, setTrainingType] = useState<TrainingRecord['trainingType']>(record.trainingType)
  const [participants, setParticipants] = useState<TrainingParticipant[]>(record.participants)
  const [participantSearch, setParticipantSearch] = useState('')

  const searchResults = useMemo(() => {
    const q = participantSearch.trim().toLowerCase()
    if (!q) return []
    return employees
      .filter((e) => !participants.some((p) => p.employeeId === e.employeeId))
      .filter((e) => `${e.employeeId} ${e.fullName} ${e.department}`.toLowerCase().includes(q))
      .slice(0, 8)
  }, [employees, participants, participantSearch])

  const addParticipant = (emp: Employee) => {
    setParticipants((prev) => [...prev, { employeeId: emp.employeeId, name: emp.fullName, department: emp.department, attended: true }])
    setParticipantSearch('')
  }

  const removeParticipant = (empId: string) => {
    setParticipants((prev) => prev.filter((p) => p.employeeId !== empId))
  }

  const save = () => {
    onSave({ ...record, trainingTitle, date, conductedBy, trainingType, participants, status: 'Completed', remarks: '' })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal wide-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Training</p>
            <h2>{isNew ? 'Add Training Record' : 'Edit Training Record'}</h2>
            <p className="ind-modal-sub">Saved as <strong>Completed</strong> — update after the training is conducted</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        <div className="trn-form-grid">
          <label className="trn-span-3">
            <span>Training Title</span>
            <input value={trainingTitle} onChange={(e) => setTrainingTitle(e.target.value)} placeholder="e.g. Fire Safety Training" />
          </label>
          <label>
            <span>Training Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            <span>Type</span>
            <select value={trainingType} onChange={(e) => setTrainingType(e.target.value as TrainingRecord['trainingType'])}>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
          </label>
          <label>
            <span>Conducted By / Trainer</span>
            <input value={conductedBy} onChange={(e) => setConductedBy(e.target.value)} placeholder="Trainer name or organisation" />
          </label>
        </div>

        <div className="induction-participants-editor">
          <div className="participants-editor-header">
            <h3>Participants <span className="participants-count-label-inline">({participants.length} attended)</span></h3>
            <div className="participant-search-wrap">
              <input
                className="participant-search-input"
                type="search"
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                placeholder="Search employee by ID or name to add…"
              />
              {searchResults.length > 0 && (
                <div className="participant-search-results">
                  {searchResults.map((emp) => (
                    <button
                      key={emp.employeeId}
                      className="participant-search-result-item"
                      type="button"
                      onClick={() => addParticipant(emp)}
                    >
                      <strong>{emp.employeeId}</strong> {emp.fullName} <span>{emp.department}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {participants.length > 0 ? (
            <table className="data-table participants-editor-table">
              <thead><tr><th style={{ width: 32 }}>#</th><th style={{ width: 80 }}>Emp ID</th><th>Name</th><th style={{ width: 160 }}>Section</th><th style={{ width: 36 }}></th></tr></thead>
              <tbody>
                {participants.map((p, i) => (
                  <tr key={p.employeeId}>
                    <td style={{ textAlign: 'center' }}>{i + 1}</td>
                    <td>{p.employeeId}</td>
                    <td>{p.name}</td>
                    <td>{p.department}</td>
                    <td><button className="action-glyph delete" onClick={() => removeParticipant(p.employeeId)} type="button" title="Remove" aria-label="Remove participant">×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="participants-empty">No participants added. Search above to add employees.</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
          <button className="primary-button" onClick={save} type="button">{isNew ? 'Save as Completed' : 'Save Changes'}</button>
        </div>
      </section>
    </div>
  )
}

function TrainingParticipantsModal({ record, onClose }: { record: TrainingRecord; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal ind-participants-view-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Participants · {record.participants.length} attended</p>
            <h2>{record.trainingTitle}</h2>
            <p>
              {record.date ? formatDateDisplay(record.date) : '—'} ·{' '}
              <span className={`training-type-badge ${record.trainingType.toLowerCase()}`}>{record.trainingType}</span> ·{' '}
              {record.conductedBy || '—'}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <table className="data-table ind-pv-table">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '40%' }} />
            <col style={{ width: '43%' }} />
          </colgroup>
          <thead>
            <tr><th>#</th><th>Emp ID</th><th>Name</th><th>Section</th></tr>
          </thead>
          <tbody>
            {record.participants.length === 0 ? (
              <tr><td colSpan={4} className="empty-row">No participants recorded for this training.</td></tr>
            ) : record.participants.map((p, i) => (
              <tr key={p.employeeId}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td>{p.employeeId}</td>
                <td>{p.name}</td>
                <td>{p.department}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="modal-actions">
          <button className="primary-button" onClick={onClose} type="button">Close</button>
        </div>
      </section>
    </div>
  )
}

function TrainingViewModal({ record, onClose, onPrint }: {
  record: TrainingRecord
  onClose: () => void
  onPrint?: () => void
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal ind-preview-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Training Record</p>
            <h2>{record.trainingTitle}</h2>
            <p>
              {record.date ? formatDateDisplay(record.date) : '—'} ·{' '}
              <span className={`training-type-badge ${record.trainingType.toLowerCase()}`}>{record.trainingType}</span>
            </p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        <div className="ind-preview-scroll">
          <div className="ind-preview-doc">
            <div className="ind-prev-hdr">
              <div className="ind-prev-title" style={{ fontSize: '1.05rem', letterSpacing: '1.5px' }}>{record.trainingTitle.toUpperCase()}</div>
              <div className="ind-prev-sub">VHPL | Thilafushi Industrial Complex</div>
            </div>

            <table className="ind-prev-info">
              <tbody>
                <tr>
                  <td className="ind-pi-lbl">Date:</td>
                  <td className="ind-pi-val">{record.date ? formatDateDisplay(record.date) : '—'}</td>
                  <td className="ind-pi-lbl">Training Type:</td>
                  <td className="ind-pi-val">{record.trainingType}</td>
                </tr>
                <tr>
                  <td className="ind-pi-lbl">Conducted By:</td>
                  <td className="ind-pi-val" colSpan={3}>{record.conductedBy || '—'}</td>
                </tr>
                <tr>
                  <td className="ind-pi-lbl">No. of Participants:</td>
                  <td className="ind-pi-val" colSpan={3}>{record.participants.length} attended</td>
                </tr>
              </tbody>
            </table>

            <p className="ind-prev-tbl-label">Participants</p>
            <table className="data-table ind-prev-ptbl">
              <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '42%' }} />
                <col style={{ width: '42%' }} />
              </colgroup>
              <thead>
                <tr><th>#</th><th>Emp ID</th><th>Name</th><th>Section</th></tr>
              </thead>
              <tbody>
                {record.participants.length === 0 ? (
                  <tr><td colSpan={4} className="empty-row">No participants recorded.</td></tr>
                ) : record.participants.map((p, i) => (
                  <tr key={p.employeeId}>
                    <td style={{ textAlign: 'center' }}>{i + 1}</td>
                    <td>{p.employeeId}</td>
                    <td>{p.name}</td>
                    <td>{p.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-actions">
          {onPrint && <button className="primary-button" onClick={onPrint} type="button">🖨 Print</button>}
          <button className="back-btn-sm" onClick={onClose} type="button">Close</button>
        </div>
      </section>
    </div>
  )
}

function printTrainingRecord(record: TrainingRecord) {
  const dateStr = record.date ? formatDateDisplay(record.date) : '—'
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const participantRows = record.participants.map((p, i) => `
    <tr>
      <td class="tc">${i + 1}</td>
      <td>${esc(p.employeeId)}</td>
      <td>${esc(p.name)}</td>
      <td>${esc(p.department)}</td>
      <td class="sig-cell"></td>
    </tr>`).join('')

  const emptyCount = Math.max(0, 8 - record.participants.length)
  const emptyRows = Array.from({ length: emptyCount }, (_, i) => `
    <tr>
      <td class="tc">${record.participants.length + i + 1}</td>
      <td></td><td></td><td></td>
      <td class="sig-cell"></td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Training — ${esc(record.trainingTitle)}</title>
  <style>
    @page { size: A4 portrait; margin: 18mm 16mm; }
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; color: #000; background: #f1f5f9; margin: 0; padding: 0; }

    .screen-bar {
      display: flex; align-items: center; gap: 14px;
      padding: 10px 20px; background: #1a0d52; position: sticky; top: 0; z-index: 10;
      font-family: system-ui, sans-serif; font-size: 13px;
    }
    .screen-bar button { padding: 7px 20px; background: #7c3aed; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .screen-bar button:hover { background: #6d28d9; }
    .screen-bar .ref-label { font-weight: 700; color: #ddd6fe; }
    .screen-bar .meta-label { color: rgba(221,214,254,0.7); font-size: 12px; }

    .a4-wrap { max-width: 210mm; margin: 24px auto; padding-bottom: 40px; }
    .a4-page { background: #fff; padding: 18mm 16mm; box-shadow: 0 3px 16px rgba(0,0,0,0.13); min-height: 257mm; }

    .p1-hdr { text-align: center; padding-bottom: 10pt; border-bottom: 2.5pt solid #000; margin-bottom: 13pt; }
    .p1-title { font-size: 18pt; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif; }
    .p1-sub { font-size: 11pt; margin-top: 4pt; letter-spacing: 0.4px; }

    .info-tbl { width: 100%; border-collapse: collapse; margin-bottom: 13pt; }
    .info-tbl td { border: 0.75pt solid #000; padding: 4.5pt 8pt; font-size: 10pt; }
    .info-tbl .lbl { font-weight: bold; background: #f0f0f0; width: 115pt; white-space: nowrap; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    table.p-tbl { width: 100%; border-collapse: collapse; font-size: 9.5pt; table-layout: fixed; }
    .p-tbl th, .p-tbl td { border: 0.75pt solid #444; padding: 4pt 5pt; vertical-align: middle; }
    .p-tbl thead th { background: #ede9fe; font-weight: bold; text-align: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .p-tbl .tc { text-align: center; }
    .p-tbl .sig-cell { height: 22pt; }

    @media print {
      body { background: white; }
      .screen-bar { display: none !important; }
      .a4-wrap { max-width: none; margin: 0; padding: 0; }
      .a4-page { padding: 0; box-shadow: none; min-height: 261mm; }
    }
  </style>
</head>
<body>

<div class="screen-bar">
  <button onclick="window.print()">🖨&nbsp; Print / Save as PDF</button>
  <span class="ref-label">${esc(record.trainingTitle)}</span>
  <span class="meta-label">${dateStr} &nbsp;·&nbsp; ${esc(record.trainingType)} &nbsp;·&nbsp; ${record.participants.length} attended</span>
</div>

<div class="a4-wrap">
  <div class="a4-page">

    <div class="p1-hdr">
      <div class="p1-title">${esc(record.trainingTitle)}</div>
      <div class="p1-sub">VHPL | Thilafushi Industrial Complex</div>
    </div>

    <table class="info-tbl">
      <tbody>
        <tr>
          <td class="lbl">Date:</td>
          <td>${dateStr}</td>
          <td class="lbl">Training Type:</td>
          <td>${esc(record.trainingType)}</td>
        </tr>
        <tr>
          <td class="lbl">Conducted By:</td>
          <td colspan="3">${esc(record.conductedBy || '—')}</td>
        </tr>
        <tr>
          <td class="lbl">No. of Participants:</td>
          <td colspan="3">${record.participants.length} attended</td>
        </tr>
      </tbody>
    </table>

    <table class="p-tbl">
      <thead>
        <tr>
          <th style="width:20pt" class="tc">#</th>
          <th style="width:54pt">Emp ID</th>
          <th>Name</th>
          <th style="width:130pt">Section</th>
          <th style="width:66pt">Signature</th>
        </tr>
      </thead>
      <tbody>
        ${participantRows}
        ${emptyRows}
      </tbody>
    </table>

  </div>
</div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    win.focus()
  }
}

function PersonalFileModal({ file, employees, isNew, onClose, onSave }: {
  file: PersonalFileRecord
  employees: Employee[]
  isNew: boolean
  onClose: () => void
  onSave: (file: PersonalFileRecord) => void
}) {
  const [employeeId, setEmployeeId] = useState(file.employeeId)
  const [fullName, setFullName] = useState(file.fullName)
  const [department, setDepartment] = useState(file.department)
  const [isFormerStaff, setIsFormerStaff] = useState(file.isFormerStaff)
  const [coc, setCoc] = useState(file.coc)
  const [jd, setJd] = useState(file.jd)
  const [cont, setCont] = useState(file.cont)
  const [contractExpiryDate, setContractExpiryDate] = useState(file.contractExpiryDate)
  const [remarks, setRemarks] = useState(file.remarks)

  const handleEmployeeSelect = (id: string) => {
    setEmployeeId(id)
    const emp = employees.find((e) => e.employeeId === id)
    if (emp) { setFullName(emp.fullName); setDepartment(emp.department) }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Personal files</p>
            <h2>{isNew ? 'Add Personal File' : file.fullName}</h2>
            {!isNew && <p>{file.fileNo} · {file.employeeId} – {file.department}</p>}
          </div>
          <button className="icon-button" onClick={onClose} type="button">x</button>
        </div>
        {isNew && (
          <div className="form-grid" style={{ marginBottom: '12px' }}>
            <label><span>Staff Type</span><select value={isFormerStaff ? 'former' : 'active'} onChange={(e) => setIsFormerStaff(e.target.value === 'former')}><option value="active">Active Staff</option><option value="former">Former Staff</option></select></label>
            {!isFormerStaff ? (
              <label><span>Employee</span><select value={employeeId} onChange={(e) => handleEmployeeSelect(e.target.value)}><option value="">Select employee</option>{employees.map((emp) => <option key={emp.employeeId} value={emp.employeeId}>{emp.employeeId} – {emp.fullName}</option>)}</select></label>
            ) : (
              <>
                <label><span>Employee ID</span><input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Former employee ID" /></label>
                <label><span>Full Name</span><input value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
                <label><span>Department</span><select value={department} onChange={(e) => setDepartment(e.target.value)}>{departmentsList.map((d) => <option key={d}>{d}</option>)}</select></label>
              </>
            )}
          </div>
        )}
        <div className="file-check-grid">
          <label className="check-field"><input type="checkbox" checked={coc} onChange={(e) => setCoc(e.target.checked)} /><span>COC – Code of Conduct</span></label>
          <label className="check-field"><input type="checkbox" checked={jd} onChange={(e) => setJd(e.target.checked)} /><span>JD – Job Description</span></label>
          <label className="check-field"><input type="checkbox" checked={cont} onChange={(e) => setCont(e.target.checked)} /><span>CONT – Contract</span></label>
        </div>
        <div className="form-grid" style={{ marginTop: '12px' }}>
          <label><span>Contract Expiry Date</span><input type="date" value={contractExpiryDate} onChange={(e) => setContractExpiryDate(e.target.value)} /></label>
          <label className="full-field"><span>Remarks</span><input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></label>
        </div>
        <div className="modal-actions">
          <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
          <button className="primary-button" onClick={() => onSave({ ...file, employeeId, fullName, department, isFormerStaff, coc, jd, cont, contractExpiryDate, remarks })} type="button">Save</button>
        </div>
      </section>
    </div>
  )
}

function PersonalFilesSection({ employees, records, onUpdate }: {
  employees: Employee[]
  records: PersonalFileRecord[]
  onUpdate: (fn: (prev: PersonalFileRecord[]) => PersonalFileRecord[]) => void
  onBack?: () => void
}) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All Sections')
  const [staffFilter, setStaffFilter] = useState<'Active' | 'Inactive' | 'All'>('Active')
  const [editingFileNo, setEditingFileNo] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const rows = useMemo(() => records.filter((r) => {
    const matchSearch = [r.fileNo, r.employeeId, r.fullName, r.department].join(' ').toLowerCase().includes(search.trim().toLowerCase())
    const matchDept = deptFilter === 'All Sections' || r.department === deptFilter
    const matchStaff = staffFilter === 'All' || (staffFilter === 'Active' && !r.isFormerStaff) || (staffFilter === 'Inactive' && r.isFormerStaff)
    return matchSearch && matchDept && matchStaff
  }), [records, search, deptFilter, staffFilter])

  const editingFile = editingFileNo ? (records.find((r) => r.fileNo === editingFileNo) ?? null) : null

  const nextFileNo = () => {
    const nums = records.map((r) => parseInt(r.fileNo, 10)).filter((n) => !isNaN(n))
    const max = nums.length ? Math.max(...nums) : 0
    return String(max + 1).padStart(4, '0')
  }

  const saveFile = (file: PersonalFileRecord) => {
    onUpdate((prev) => {
      const exists = prev.some((r) => r.fileNo === file.fileNo)
      return exists ? prev.map((r) => r.fileNo === file.fileNo ? file : r) : [file, ...prev]
    })
    setEditingFileNo(null)
    setShowAddModal(false)
  }

  const newFile = (): PersonalFileRecord => ({
    fileNo: nextFileNo(), employeeId: '', fullName: '', department: departmentsList[0], isFormerStaff: false,
    coc: false, jd: false, cont: false, contractExpiryDate: '', remarks: '',
  })

  return (
    <>
      <section className="employee-workspace">
        <div className="table-toolbar pf-toolbar">
          <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="File no, employee, department" /></label>
          <label><span>Section</span><select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}><option>All Sections</option>{departmentsList.map((d) => <option key={d}>{d}</option>)}</select></label>
          <label><span>Staff</span><select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value as typeof staffFilter)}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="All">All</option></select></label>
          <button className="primary-button" onClick={() => setShowAddModal(true)} type="button">Add</button>
        </div>
        <div className="employee-table-shell compact-scroll">
          <table className="data-table personal-files-table">
            <thead><tr><th>File No</th><th>Employee ID</th><th>Full Name</th><th>Section</th><th>COC</th><th>JD</th><th>CONT</th><th>Contract Expiry</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((file) => (
                <tr key={file.fileNo} className={file.isFormerStaff ? 'former-staff-row' : ''}>
                  <td>{file.fileNo}</td>
                  <td>{file.employeeId}</td>
                  <td>{file.fullName}{file.isFormerStaff && <span className="former-badge"> (Former)</span>}</td>
                  <td>{file.department}</td>
                  <td className="doc-check-cell">{file.coc ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
                  <td className="doc-check-cell">{file.jd ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
                  <td className="doc-check-cell">{file.cont ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
                  <td>{file.contractExpiryDate ? formatDateDisplay(file.contractExpiryDate) : '—'}</td>
                  <td><StatusBadge status={file.coc && file.jd && file.cont ? 'Completed' : 'Incomplete'} /></td>
                  <td><button className="action-glyph edit" onClick={() => setEditingFileNo(file.fileNo)} type="button" title="Edit" aria-label="Edit file">✎</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editingFile && <PersonalFileModal file={editingFile} employees={employees} isNew={false} onClose={() => setEditingFileNo(null)} onSave={saveFile} />}
      {showAddModal && <PersonalFileModal file={newFile()} employees={employees} isNew={true} onClose={() => setShowAddModal(false)} onSave={saveFile} />}
    </>
  )
}

function InductionSection({ employees, records, onUpdate }: {
  employees: Employee[]
  records: InductionRecord[]
  onUpdate: (fn: (prev: InductionRecord[]) => InductionRecord[]) => void
  onBack?: () => void
}) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<InductionRecord | null>(null)
  const [viewing, setViewing] = useState<InductionRecord | null>(null)
  const [viewingParticipants, setViewingParticipants] = useState<InductionRecord | null>(null)

  const rows = useMemo(() => records.filter((r) => {
    const participantText = r.participants.map((p) => `${p.employeeId} ${p.name}`).join(' ')
    return !search.trim() || [r.refNo, r.conductedBy, participantText].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  }).sort((a, b) => b.inductionDate.localeCompare(a.inductionDate)), [records, search])

  const saveRecord = (record: InductionRecord) => {
    onUpdate((prev) => {
      const exists = prev.some((r) => r.id === record.id)
      return exists ? prev.map((r) => r.id === record.id ? record : r) : [record, ...prev]
    })
    setEditing(null)
  }

  const deleteRecord = (id: string) => onUpdate((prev) => prev.filter((r) => r.id !== id))

  const nextRefNo = (): string => {
    const currentYear = new Date().getFullYear().toString()
    const thisYearRecords = records.filter((r) => r.inductionDate.startsWith(currentYear))
    const maxSeq = thisYearRecords.reduce((max, r) => {
      const n = parseInt(r.refNo, 10)
      return isNaN(n) ? max : Math.max(max, n)
    }, 0)
    return String(maxSeq + 1).padStart(3, '0')
  }

  const newRecord = (): InductionRecord => ({
    id: `IND-new-${Date.now()}`,
    refNo: nextRefNo(),
    inductionDate: new Date().toISOString().slice(0, 10),
    conductedBy: '',
    conductedByEmpId: undefined,
    participants: [],
    inductionContent: '',
    status: 'Completed',
    remarks: '',
  })

  return (
    <>
      <section className="employee-workspace">
        <div className="table-toolbar ops-section-toolbar">
          <label className="search-field">
            <span>Search</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ref no, conducted by, participant name" />
          </label>
          <button className="primary-button" onClick={() => setEditing(newRecord())} type="button">Add Session</button>
        </div>
        <div className="employee-table-shell compact-scroll">
          <table className="data-table induction-table">
            <thead>
              <tr>
                <th>Ref No</th>
                <th>Date</th>
                <th>Conducted By</th>
                <th>Participants</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="empty-row">No induction sessions found.</td></tr>
              ) : rows.map((record) => (
                <tr key={record.id}>
                  <td>
                    <span className="induction-ref-chip" title={fullInductionRef(record.refNo, record.inductionDate)}>
                      {shortInductionRef(record.refNo, record.inductionDate)}
                    </span>
                  </td>
                  <td>{record.inductionDate ? formatDateDisplay(record.inductionDate) : '—'}</td>
                  <td>{record.conductedBy || '—'}</td>
                  <td>
                    {record.participants.length > 0 ? (
                      <button className="participants-count-btn" onClick={() => setViewingParticipants(record)} type="button">
                        {record.participants.length} participant{record.participants.length !== 1 ? 's' : ''}
                      </button>
                    ) : (
                      <span className="no-participants-text">—</span>
                    )}
                  </td>
                  <td className="ind-remarks-cell">{record.remarks || '—'}</td>
                  <td>
                    <div className="row-actions ind-actions">
                      <button className="action-glyph" onClick={() => setViewing(record)} type="button" title="View participants" aria-label="View participants">👁</button>
                      <button className="action-glyph" onClick={() => printInductionRecord(record, employees)} type="button" title="Print" aria-label="Print induction">🖨</button>
                      <button className="action-glyph edit" onClick={() => setEditing(record)} type="button" title="Edit" aria-label="Edit">✎</button>
                      <button className="action-glyph delete" onClick={() => deleteRecord(record.id)} type="button" title="Delete" aria-label="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing && <InductionModal employees={employees} record={editing} onClose={() => setEditing(null)} onSave={saveRecord} />}
      {viewing && <InductionViewModal record={viewing} employees={employees} onClose={() => setViewing(null)} onPrint={() => printInductionRecord(viewing, employees)} />}
      {viewingParticipants && <InductionParticipantsModal record={viewingParticipants} onClose={() => setViewingParticipants(null)} />}
    </>
  )
}

function TrainingSection({ records, onUpdate, employees }: {
  records: TrainingRecord[]
  onUpdate: (fn: (prev: TrainingRecord[]) => TrainingRecord[]) => void
  onBack?: () => void
  employees: Employee[]
}) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'All' | 'Internal' | 'External'>('All')
  const [editing, setEditing] = useState<TrainingRecord | null>(null)
  const [viewing, setViewing] = useState<TrainingRecord | null>(null)
  const [viewingParticipants, setViewingParticipants] = useState<TrainingRecord | null>(null)

  const rows = useMemo(() => records.filter((r) => {
    const matchSearch = [r.trainingTitle, r.conductedBy].join(' ').toLowerCase().includes(search.trim().toLowerCase())
    const matchType = typeFilter === 'All' || r.trainingType === typeFilter
    return matchSearch && matchType
  }).sort((a, b) => b.date.localeCompare(a.date)), [records, search, typeFilter])

  const saveRecord = (record: TrainingRecord) => {
    onUpdate((prev) => {
      const exists = prev.some((r) => r.id === record.id)
      return exists ? prev.map((r) => r.id === record.id ? record : r) : [record, ...prev]
    })
    setEditing(null)
  }

  const deleteRecord = (id: string) => onUpdate((prev) => prev.filter((r) => r.id !== id))

  const newRecord = (): TrainingRecord => ({ id: `TRN-new-${Date.now()}`, trainingTitle: '', date: new Date().toISOString().slice(0, 10), conductedBy: '', trainingType: 'Internal', participants: [], status: 'Completed', remarks: '' })

  return (
    <>
      <section className="employee-workspace">
        <div className="table-toolbar ops-section-toolbar">
          <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Training title, trainer" /></label>
          <label><span>Type</span><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}><option value="All">All Types</option><option value="Internal">Internal</option><option value="External">External</option></select></label>
          <button className="primary-button" onClick={() => setEditing(newRecord())} type="button">Add</button>
        </div>
        <div className="employee-table-shell compact-scroll">
          <table className="data-table training-table">
            <thead><tr><th className="trn-title-th">Training Title</th><th>Date</th><th>Conducted By</th><th>Type</th><th>Participants</th><th>Action</th></tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="empty-row">No training records found.</td></tr>
              ) : rows.map((record) => (
                <tr key={record.id}>
                  <td className="trn-title-cell">{record.trainingTitle}</td>
                  <td>{record.date ? formatDateDisplay(record.date) : '—'}</td>
                  <td>{record.conductedBy || '—'}</td>
                  <td><span className={`training-type-badge ${record.trainingType.toLowerCase()}`}>{record.trainingType}</span></td>
                  <td>
                    {record.participants.length > 0 ? (
                      <button className="participants-count-btn" onClick={() => setViewingParticipants(record)} type="button">
                        {record.participants.length} attended
                      </button>
                    ) : <span className="no-participants-text">—</span>}
                  </td>
                  <td>
                    <div className="row-actions ind-actions">
                      <button className="action-glyph" onClick={() => setViewing(record)} type="button" title="View" aria-label="View">👁</button>
                      <button className="action-glyph" onClick={() => printTrainingRecord(record)} type="button" title="Print" aria-label="Print">🖨</button>
                      <button className="action-glyph edit" onClick={() => setEditing(record)} type="button" title="Edit" aria-label="Edit">✎</button>
                      <button className="action-glyph delete" onClick={() => deleteRecord(record.id)} type="button" title="Delete" aria-label="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing && <TrainingModal record={editing} employees={employees} onClose={() => setEditing(null)} onSave={saveRecord} />}
      {viewing && <TrainingViewModal record={viewing} onClose={() => setViewing(null)} onPrint={() => printTrainingRecord(viewing)} />}
      {viewingParticipants && <TrainingParticipantsModal record={viewingParticipants} onClose={() => setViewingParticipants(null)} />}
    </>
  )
}

// ── Bank Account Opening ────────────────────────────────────

type BankName = 'SBI' | 'BOC' | 'CBM'
type AccountStatus = 'Pending' | 'Completed' | 'Incomplete'
type AccountType = 'USD Only' | 'MVR Only' | 'Both USD & MVR'

type BankAccountRecord = {
  id: string
  employeeId: string
  fullName: string
  department: string
  nationality: string
  bank: BankName
  accountType: AccountType
  scheduledDate: string
  status: AccountStatus
}

const initialBankAccountRecords: BankAccountRecord[] = [
  { id: 'BNK-35494', employeeId: '35494', fullName: 'GAMARALALAGE AJITH WIJESIRI', department: 'ACCOUNTS AND FINANCE', nationality: 'SRI LANKAN', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2007-06-01', status: 'Completed' },
  { id: 'BNK-37916', employeeId: '37916', fullName: 'JAGO', department: 'STORES', nationality: 'BANGLADESHI', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2008-09-01', status: 'Completed' },
  { id: 'BNK-43407', employeeId: '43407', fullName: 'MOHAMMAD DELOWAR HOSSAIN', department: 'STORES', nationality: 'BANGLADESHI', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2013-08-01', status: 'Completed' },
  { id: 'BNK-44386', employeeId: '44386', fullName: 'MAJIB', department: 'STORES', nationality: 'BANGLADESHI', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2014-06-01', status: 'Completed' },
  { id: 'BNK-50223', employeeId: '50223', fullName: 'AYESHAN KUMARA WIJEYATHUNGA MUDALIGE', department: 'STORES', nationality: 'SRI LANKAN', bank: 'BOC', accountType: 'Both USD & MVR', scheduledDate: '2019-04-10', status: 'Completed' },
  { id: 'BNK-50427', employeeId: '50427', fullName: 'MD SAIFUR RAHMAN', department: 'STORES', nationality: 'BANGLADESHI', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2019-06-01', status: 'Completed' },
  { id: 'BNK-52804', employeeId: '52804', fullName: 'AHMED IMRAN', department: 'ACCOUNTS AND FINANCE', nationality: 'BANGLADESHI', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2020-12-01', status: 'Completed' },
  { id: 'BNK-53029', employeeId: '53029', fullName: 'KUMARAN VAITHILINGAM', department: 'STORES', nationality: 'INDIAN', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2022-01-20', status: 'Completed' },
  { id: 'BNK-53979', employeeId: '53979', fullName: 'NAVEEN SEKAR', department: 'STORES', nationality: 'INDIAN', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2022-08-10', status: 'Completed' },
  { id: 'BNK-55427', employeeId: '55427', fullName: 'SARAVANAN RAJENDRAN', department: 'STORES', nationality: 'INDIAN', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2023-09-01', status: 'Completed' },
  { id: 'BNK-56141', employeeId: '56141', fullName: 'RAJU PERKA', department: 'CAFE', nationality: 'INDIAN', bank: 'BOC', accountType: 'Both USD & MVR', scheduledDate: '2024-04-01', status: 'Completed' },
  { id: 'BNK-56530', employeeId: '56530', fullName: 'PUBUDU MADURANGA ALAWATHTHA KANKANAMGE', department: 'ADMINISTRATION', nationality: 'SRI LANKAN', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2024-07-01', status: 'Completed' },
  { id: 'BNK-56646', employeeId: '56646', fullName: 'CHANDRASHEKHER PURELLA', department: 'ACCOUNTS AND FINANCE', nationality: 'INDIAN', bank: 'BOC', accountType: 'Both USD & MVR', scheduledDate: '2024-08-01', status: 'Completed' },
  { id: 'BNK-57637', employeeId: '57637', fullName: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', nationality: 'INDIAN', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2025-02-10', status: 'Completed' },
  { id: 'BNK-57935', employeeId: '57935', fullName: 'ARUNODA KAVINDU NANAYAKKARA', department: 'ACCOUNTS AND FINANCE', nationality: 'SRI LANKAN', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2025-04-20', status: 'Completed' },
  { id: 'BNK-58692', employeeId: '58692', fullName: 'SHANTUMON PATHIYIL CHACKO', department: 'HUMAN RESOURCES', nationality: 'INDIAN', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2025-10-15', status: 'Completed' },
  { id: 'BNK-57803', employeeId: '57803', fullName: 'INDIKA SAMPATH SAMARASINGHEGE', department: 'STORES', nationality: 'SRI LANKAN', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2026-05-20', status: 'Pending' },
  { id: 'BNK-58034', employeeId: '58034', fullName: 'SAMEERA MADUSANKA GUNARATHNA', department: 'STORES', nationality: 'SRI LANKAN', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2026-05-22', status: 'Pending' },
  { id: 'BNK-58686', employeeId: '58686', fullName: 'YASAR ARAFATH BASHEER AHAMED', department: 'STORES', nationality: 'INDIAN', bank: 'SBI', accountType: 'Both USD & MVR', scheduledDate: '2026-05-18', status: 'Incomplete' },
]

function BankAccountModal({ record, employees, onClose, onSave }: {
  record: BankAccountRecord
  employees: Employee[]
  onClose: () => void
  onSave: (r: BankAccountRecord) => void
}) {
  const isNew = record.id.startsWith('BNK-new')
  const [employeeId, setEmployeeId] = useState(record.employeeId)
  const [bank, setBank] = useState<BankName>(record.bank)
  const [accountType, setAccountType] = useState<AccountType>(record.accountType)
  const [scheduledDate, setScheduledDate] = useState(record.scheduledDate)
  const [status, setStatus] = useState<AccountStatus>(record.status)

  const nonLocals = employees.filter((e) => e.nationality !== 'MALDIVIAN')
  const selected = isNew
    ? (nonLocals.find((e) => e.employeeId === employeeId) ?? nonLocals[0])
    : employees.find((e) => e.employeeId === record.employeeId)

  const save = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      ...record,
      id: isNew && selected ? `BNK-${selected.employeeId}` : record.id,
      employeeId: selected?.employeeId ?? record.employeeId,
      fullName: selected?.fullName ?? record.fullName,
      department: selected?.department ?? record.department,
      nationality: selected?.nationality ?? record.nationality,
      bank,
      accountType,
      scheduledDate,
      status,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal wide-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Bank Account Opening</p>
            <h2>{isNew ? 'Add Record' : `Edit — ${record.fullName}`}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <form onSubmit={save}>
          <div className="form-grid">
            {isNew ? (
              <label className="full-field">
                <span>Employee (Expatriate Staff)</span>
                <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  {nonLocals.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>{emp.employeeId} – {emp.fullName}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="full-field">
                <span>Employee</span>
                <input disabled value={`${record.employeeId} – ${record.fullName}`} />
              </label>
            )}
            <label>
              <span>Bank</span>
              <select value={bank} onChange={(e) => setBank(e.target.value as BankName)}>
                <option>SBI</option><option>BOC</option><option>CBM</option>
              </select>
            </label>
            <label>
              <span>Account Type</span>
              <select value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)}>
                <option value="USD Only">USD Only</option>
                <option value="MVR Only">MVR Only</option>
                <option value="Both USD &amp; MVR">Both USD &amp; MVR</option>
              </select>
            </label>
            <label>
              <span>Scheduled Date</span>
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </label>
            <label>
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as AccountStatus)}>
                <option>Pending</option><option>Completed</option><option>Incomplete</option>
              </select>
            </label>
          </div>
          <div className="modal-actions">
            <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
            <button className="primary-button" type="submit">Save Record</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function BankAccountSection({ employees, records, onUpdate }: {
  employees: Employee[]
  records: BankAccountRecord[]
  onUpdate: (fn: (prev: BankAccountRecord[]) => BankAccountRecord[]) => void
  onBack?: () => void
}) {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [search, setSearch] = useState('')
  const [bankFilter, setBankFilter] = useState<'All' | BankName>('All')
  const [sectionFilter, setSectionFilter] = useState('All Sections')
  const [editing, setEditing] = useState<BankAccountRecord | null>(null)

  const isCompleted = (r: BankAccountRecord) => r.status === 'Completed'

  const applyFilters = (list: BankAccountRecord[]) => {
    const q = search.trim().toLowerCase()
    return list.filter((r) => {
      const matchSearch = !q || [r.employeeId, r.fullName, r.department, r.nationality, r.bank, r.accountType].join(' ').toLowerCase().includes(q)
      const matchBank = bankFilter === 'All' || r.bank === bankFilter
      const matchSection = sectionFilter === 'All Sections' || r.department === sectionFilter
      return matchSearch && matchBank && matchSection
    }).sort((a, b) => a.fullName.localeCompare(b.fullName))
  }

  const pendingRows = useMemo(() => applyFilters(records.filter((r) => !isCompleted(r))), [records, search, bankFilter, sectionFilter])
  const completedRows = useMemo(() => applyFilters(records.filter((r) => isCompleted(r))), [records, search, bankFilter, sectionFilter])

  const pendingAll = records.filter((r) => !isCompleted(r)).length
  const completedAll = records.filter((r) => isCompleted(r)).length

  const activeRows = activeTab === 'pending' ? pendingRows : completedRows

  const saveRecord = (rec: BankAccountRecord) => {
    onUpdate((prev) => {
      const exists = prev.some((r) => r.id === rec.id)
      return exists ? prev.map((r) => r.id === rec.id ? rec : r) : [rec, ...prev]
    })
    setEditing(null)
    if (isCompleted(rec) && activeTab === 'pending') setActiveTab('completed')
  }

  const deleteRecord = (id: string) => onUpdate((prev) => prev.filter((r) => r.id !== id))

  const newRecord = (): BankAccountRecord => ({
    id: 'BNK-new',
    employeeId: '',
    fullName: '',
    department: '',
    nationality: '',
    bank: 'SBI',
    accountType: 'Both USD & MVR',
    scheduledDate: new Date().toISOString().slice(0, 10),
    status: 'Pending',
  })

  const BankTable = ({ rows, showEdit }: { rows: BankAccountRecord[]; showEdit: boolean }) => (
    <div className="bank-table-shell">
      <table className="data-table bank-table">
        <colgroup>
          <col style={{ width: '36px' }} />
          <col style={{ width: '88px' }} />
          <col />
          <col style={{ width: '160px' }} />
          <col style={{ width: '110px' }} />
          <col style={{ width: '62px' }} />
          <col style={{ width: '130px' }} />
          <col style={{ width: '110px' }} />
          <col style={{ width: '100px' }} />
          {showEdit && <col style={{ width: '72px' }} />}
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>Emp ID</th>
            <th>Full Name</th>
            <th>Section</th>
            <th>Nationality</th>
            <th>Bank</th>
            <th>Account Type</th>
            <th>Scheduled Date</th>
            <th>Status</th>
            {showEdit && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={showEdit ? 10 : 9} className="empty-row">No records in this section.</td></tr>
            : rows.map((r, i) => (
              <tr key={r.id}>
                <td className="bank-td-num">{i + 1}</td>
                <td>{r.employeeId}</td>
                <td className="name-cell-plain">{r.fullName}</td>
                <td>{r.department}</td>
                <td>{r.nationality}</td>
                <td><span className="bank-chip">{r.bank}</span></td>
                <td><span className="account-type-chip">{r.accountType}</span></td>
                <td>{r.scheduledDate ? formatDateDisplay(r.scheduledDate) : '—'}</td>
                <td><StatusBadge status={r.status} /></td>
                {showEdit && (
                  <td>
                    <div className="row-actions request-inline-actions">
                      <button className="action-glyph edit" onClick={() => setEditing(r)} type="button" title="Edit" aria-label="Edit">✎</button>
                      <button className="action-glyph delete" onClick={() => deleteRecord(r.id)} type="button" title="Delete" aria-label="Delete">🗑</button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )

  return (
    <>
      <section className="employee-workspace bank-workspace">

        {/* Toolbar */}
        <div className="table-toolbar bank-toolbar">
          <label className="search-field">
            <span>Search</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, ID, section, nationality" />
          </label>
          <label><span>Bank</span>
            <select value={bankFilter} onChange={(e) => setBankFilter(e.target.value as typeof bankFilter)}>
              <option value="All">All Banks</option>
              <option>SBI</option><option>BOC</option><option>CBM</option>
            </select>
          </label>
          <label><span>Section</span>
            <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
              <option>All Sections</option>
              {departmentsList.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <button className="primary-button" onClick={() => setEditing(newRecord())} type="button">Add</button>
        </div>

        {/* Tabs */}
        <div className="bank-section-tabs">
          <button
            type="button"
            className={activeTab === 'pending' ? 'active' : ''}
            onClick={() => setActiveTab('pending')}
          >
            PENDING / INCOMPLETE
            <span className={`bank-tab-count ${activeTab === 'pending' ? 'active' : ''}`}>{pendingAll}</span>
          </button>
          <button
            type="button"
            className={activeTab === 'completed' ? 'active' : ''}
            onClick={() => setActiveTab('completed')}
          >
            COMPLETED
            <span className={`bank-tab-count ${activeTab === 'completed' ? 'active' : ''}`}>{completedAll}</span>
          </button>
        </div>

        {/* Table */}
        <BankTable rows={activeRows} showEdit={activeTab === 'pending'} />

        {/* Footer */}
        <div className="bank-footer-zone">
          {activeRows.length > 0
            ? `Showing ${activeRows.length} of ${activeTab === 'pending' ? pendingAll : completedAll} record${activeRows.length !== 1 ? 's' : ''}`
            : 'No records match current filters.'}
          {activeTab === 'pending' && activeRows.length > 0 && (
            <span className="bank-footer-hint"> — Edit a record and set Status to Completed to move it to the Completed tab.</span>
          )}
        </div>
      </section>

      {editing && (
        <BankAccountModal
          record={editing}
          employees={employees}
          onClose={() => setEditing(null)}
          onSave={saveRecord}
        />
      )}
    </>
  )
}

function TerminationFormModal({
  mode,
  record,
  employees,
  onClose,
  onSave,
}: {
  mode: 'add' | 'edit'
  record: EnhancedTerminationRecord
  employees: Employee[]
  onClose: () => void
  onSave: (record: EnhancedTerminationRecord) => void
}) {
  const [form, setForm] = useState(record)
  const [employeeSearch, setEmployeeSearch] = useState('')

  const statusOptions = useMemo(() => {
    if (mode === 'add') return allTerminationStages
    const currentIndex = allTerminationStages.indexOf(record.currentStage)
    return allTerminationStages.slice(Math.max(0, currentIndex))
  }, [mode, record.currentStage])

  const employeeMatches = useMemo(() => {
    const term = employeeSearch.trim().toLowerCase()
    if (!term) return employees.slice(0, 25)
    return employees
      .filter((employee) => `${employee.employeeId} ${employee.fullName}`.toLowerCase().includes(term))
      .slice(0, 25)
  }, [employeeSearch, employees])

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find((item) => item.employeeId === employeeId)
    if (!employee) return
    setForm((current) => ({
      ...current,
      employeeId: employee.employeeId,
      name: employee.fullName,
      department: employee.department,
      designation: employee.designation,
      nationality: employee.nationality,
      passportNo: employee.nicPassportNo,
      wpNo: employee.workPermitNo,
      dateOfJoin: employee.dateOfJoin,
    }))
    setEmployeeSearch(`${employee.employeeId} - ${employee.fullName}`)
  }

  const save = (event: FormEvent) => {
    event.preventDefault()
    onSave(form)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal wide-modal termination-form-modal" role="dialog" aria-modal="true" aria-labelledby="termination-form-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Termination Workflow</p>
            <h2 id="termination-form-title">{mode === 'add' ? 'Add' : 'Edit Termination'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">x</button>
        </div>

        <form onSubmit={save}>
          <div className="termination-form-grid">
            {mode === 'add' && (
              <>
                <label className="full-width">
                  <span>Search Staff (ID or Name)</span>
                  <input
                    placeholder="Search by employee ID or name"
                    type="search"
                    value={employeeSearch}
                    onChange={(event) => setEmployeeSearch(event.target.value)}
                  />
                </label>
                <label className="full-width">
                  <span>Select Staff</span>
                  <select value={form.employeeId} onChange={(event) => handleEmployeeSelect(event.target.value)} required>
                    <option value="">Choose from search results</option>
                    {employeeMatches.map((employee) => (
                      <option key={employee.employeeId} value={employee.employeeId}>{employee.employeeId} - {employee.fullName}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label><span>Employee ID</span><input disabled value={form.employeeId} /></label>
            <label><span>Name</span><input disabled value={form.name} /></label>
            <label><span>Department</span><input disabled value={form.department} /></label>
            <label><span>Designation</span><input disabled value={form.designation} /></label>
            <label><span>PP No</span><input disabled value={form.passportNo} /></label>
            <label><span>Nationality</span><input disabled value={form.nationality} /></label>
            <label><span>Date of Join</span><input disabled value={form.dateOfJoin} /></label>
            <label><span>Type</span><select value={form.terminationType} onChange={(event) => setForm((current) => ({ ...current, terminationType: event.target.value as TerminationType }))}><option>Resignation</option><option>Dismissal</option><option>Probation End</option><option>Contract Expiry</option><option>Absconded</option><option>Other</option></select></label>
            <label><span>Last Working Date</span><input type="date" value={form.lastWorkingDate} onChange={(event) => setForm((current) => ({ ...current, lastWorkingDate: event.target.value }))} required /></label>
            <label><span>Departure Date</span><input type="date" value={form.departureDate} onChange={(event) => setForm((current) => ({ ...current, departureDate: event.target.value }))} required /></label>
            <label className="full-width"><span>Reason</span><input placeholder="Reason for termination" value={form.reasonForLeaving} onChange={(event) => setForm((current) => ({ ...current, reasonForLeaving: event.target.value }))} required /></label>
            {mode === 'edit' && <label><span>Status</span><select value={form.currentStage} onChange={(event) => setForm((current) => ({ ...current, currentStage: event.target.value as TerminationStage }))} required>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>}
          </div>
          <div className="modal-actions">
            <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
            <button className="primary-button" disabled={!form.employeeId} type="submit">{mode === 'add' ? 'Add' : 'Save Changes'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function TerminationDetailsModal({
  record,
  onClose,
}: {
  record: EnhancedTerminationRecord | CompletedTerminationRecord
  onClose: () => void
}) {
  const currentStage = record.currentStage
  const termination = 'dateSubmitted' in record ? record : null
  const isCompletedRecord = !('dateSubmitted' in record)

  const durationOfService = () => {
    if (!record.dateOfJoin) return '-'
    const start = new Date(record.dateOfJoin)
    const end = termination ? new Date(termination.lastWorkingDate || Date.now()) : new Date()
    let years = end.getFullYear() - start.getFullYear()
    let months = end.getMonth() - start.getMonth()
    if (months < 0) { years -= 1; months += 12 }
    return `${years}y ${months}m`
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal termination-details-modal" role="dialog" aria-modal="true" aria-labelledby="termination-details-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Termination Record</p>
            <h2 id="termination-details-title">{record.name}</h2>
            <p>{record.employeeId} • {record.department}</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">x</button>
        </div>

        {/* Employee Information */}
        <div className="term-detail-section">
          <h3 className="term-section-title">Employee Information</h3>
          <div className="term-employee-grid">
            <div className="term-card term-card-name"><strong>Name</strong><p>{record.name}</p></div>
            <div className="term-card"><strong>Employee ID</strong><p>{record.employeeId}</p></div>
            <div className="term-card"><strong>Designation</strong><p>{record.designation || '-'}</p></div>
            <div className="term-card"><strong>Department</strong><p>{record.department}</p></div>
            <div className="term-card"><strong>Nationality</strong><p>{record.nationality}</p></div>
            <div className="term-card"><strong>NIC / PP No.</strong><p>{record.passportNo || '-'}</p></div>
            <div className="term-card"><strong>WP No.</strong><p>{record.wpNo || '-'}</p></div>
            <div className="term-card"><strong>Date of Join</strong><p>{formatDateDisplay(record.dateOfJoin)}</p></div>
            <div className="term-card"><strong>Duration of Service</strong><p>{durationOfService()}</p></div>
          </div>
        </div>

        {/* Termination Details */}
        <div className="term-detail-section">
          <h3 className="term-section-title">Termination Details</h3>
          <div className="term-termination-grid">
            <div className="term-card"><strong>Date of Termination</strong><p>{formatDateDisplay(record.lastWorkingDate)}</p></div>
            <div className="term-card"><strong>Departure Date</strong><p>{formatDateDisplay(record.departureDate)}</p></div>
            <div className="term-card"><strong>Type</strong><p>{record.terminationType}</p></div>
            <div className="term-card"><strong>Status</strong><p>{isCompletedRecord ? 'Departed' : record.currentStage}</p></div>
            <div className="term-card term-card-wide"><strong>Reason</strong><p>{record.reasonForLeaving || '-'}</p></div>
          </div>
        </div>

        {/* Status Progression — Notice Period only */}
        {!isCompletedRecord && (
          <div className="term-detail-section">
            <h3 className="term-section-title">Status Progression</h3>
            <div className="detail-status-track">
              {allTerminationStages.map((stage, index) => {
                const currentIndex = allTerminationStages.indexOf(currentStage)
                const stateClass = index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'pending'
                return <span key={stage} className={`detail-step ${stateClass}`}>{stage}</span>
              })}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="primary-button" onClick={onClose} type="button">Close</button>
        </div>
      </section>
    </div>
  )
}

function TerminationPage({
  noticeTerminations,
  completedTerminations,
  onAdd,
  onEdit,
  onAdvanceStatus,
  onDelete,
  onViewDetails,
}: {
  noticeTerminations: EnhancedTerminationRecord[]
  completedTerminations: CompletedTerminationRecord[]
  onAdd: () => void
  onEdit: (record: EnhancedTerminationRecord) => void
  onAdvanceStatus: (id: string) => void
  onDelete: (id: string) => void
  onViewDetails: (record: EnhancedTerminationRecord | CompletedTerminationRecord) => void
}) {
  const [activeTab, setActiveTab] = useState<TerminationTab>('notice')
  const [noticeSearch, setNoticeSearch] = useState('')
  const [completedSearch, setCompletedSearch] = useState('')
  const [noticeDepartmentFilter, setNoticeDepartmentFilter] = useState('All Departments')
  const [completedDepartmentFilter, setCompletedDepartmentFilter] = useState('All Departments')
  const [noticeStageFilter, setNoticeStageFilter] = useState<'All' | TerminationStage>('All')

  const getDuration = (joinDate: string) => {
    if (!joinDate) return '-'
    const start = new Date(joinDate)
    const now = new Date()
    let years = now.getFullYear() - start.getFullYear()
    let months = now.getMonth() - start.getMonth()
    if (months < 0) {
      years -= 1
      months += 12
    }
    return `${years}y ${months}m`
  }

  const noticeDepartments = useMemo(() => ['All Departments', ...Array.from(new Set(noticeTerminations.map((record) => record.department))).sort()], [noticeTerminations])
  const completedDepartments = useMemo(() => ['All Departments', ...Array.from(new Set(completedTerminations.map((record) => record.department))).sort()], [completedTerminations])

  const noticeRows = useMemo(() => noticeTerminations.filter((record) => {
    const term = noticeSearch.trim().toLowerCase()
    const matchesSearch = term === '' || `${record.employeeId} ${record.name} ${record.department} ${record.nationality}`.toLowerCase().includes(term)
    const matchesDepartment = noticeDepartmentFilter === 'All Departments' || record.department === noticeDepartmentFilter
    const matchesStatus = noticeStageFilter === 'All' || record.currentStage === noticeStageFilter
    return matchesSearch && matchesDepartment && matchesStatus
  }).sort((a, b) => a.departureDate.localeCompare(b.departureDate)), [noticeTerminations, noticeSearch, noticeDepartmentFilter, noticeStageFilter])

  const completedRows = useMemo(() => completedTerminations.filter((record) => {
    const term = completedSearch.trim().toLowerCase()
    const matchesSearch = term === '' || `${record.employeeId} ${record.name} ${record.department} ${record.nationality}`.toLowerCase().includes(term)
    const matchesDepartment = completedDepartmentFilter === 'All Departments' || record.department === completedDepartmentFilter
    return matchesSearch && matchesDepartment
  }).sort((a, b) => a.departureDate.localeCompare(b.departureDate)), [completedTerminations, completedSearch, completedDepartmentFilter])

  return (
    <>
      <PageHeader eyebrow="Employee separation" title="Termination" subtitle="Table-first workflow for notice period and completed departures." />
      <section className="employee-workspace leave-workspace termination-workspace">
        <div className="leave-section-tabs termination-tabs">
          <button className={activeTab === 'notice' ? 'active' : ''} onClick={() => setActiveTab('notice')} type="button">NOTICE PERIOD</button>
          <button className={activeTab === 'completed' ? 'active' : ''} onClick={() => setActiveTab('completed')} type="button">COMPLETED</button>
        </div>

        {activeTab === 'notice' && (
          <>
            <div className="table-toolbar leave-toolbar leave-toolbar-3 termination-topbar leave-toolbar-has-btn">
              <label className="search-field"><span>Search</span><input className="termination-search" onChange={(event) => setNoticeSearch(event.target.value)} placeholder="Search employee, ID, department..." type="search" value={noticeSearch} /></label>
              <label><span>Department</span><select className="termination-filter" onChange={(event) => setNoticeDepartmentFilter(event.target.value)} value={noticeDepartmentFilter}>{noticeDepartments.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>Status</span><select className="termination-filter" onChange={(event) => setNoticeStageFilter(event.target.value === 'All' ? 'All' : event.target.value as TerminationStage)} value={noticeStageFilter}><option value="All">All Status</option>{allTerminationStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></label>
              <button className="primary-button toolbar-add-btn" onClick={onAdd} type="button">Add</button>
            </div>

            <div className="employee-table-shell compact-scroll termination-table-shell">
              <table className="data-table termination-table compact">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Nationality</th>
                    <th>Date of Join</th>
                    <th>Duration</th>
                    <th>Last Working Date</th>
                    <th>Departure Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {noticeRows.map((record) => {
                    const currentIndex = allTerminationStages.indexOf(record.currentStage)
                    const progress = ((currentIndex + 1) / allTerminationStages.length) * 100

                    return (
                      <tr key={record.id} className="termination-row">
                        <td>{record.employeeId}</td>
                        <td className="name-cell"><button className="name-link" onClick={() => onViewDetails(record)} type="button">{record.name}</button></td>
                        <td>{record.department}</td>
                        <td>{record.nationality}</td>
                        <td>{formatDateDisplay(record.dateOfJoin)}</td>
                        <td>{getDuration(record.dateOfJoin)}</td>
                        <td>{formatDateDisplay(record.lastWorkingDate)}</td>
                        <td>{formatDateDisplay(record.departureDate)}</td>
                        <td className="leave-status-cell termination-status-cell"><button className={`status-advance-btn status-text status-chip status-step-${record.currentStage.toLowerCase().replaceAll(' ', '-')}`} onClick={() => onAdvanceStatus(record.id)} disabled={record.currentStage === 'Pending Departure'} type="button" title={record.currentStage === 'Pending Departure' ? 'Final status reached' : 'Click to move to next status'}>{record.currentStage}</button><div className={`status-progress-track status-step-${record.currentStage.toLowerCase().replaceAll(' ', '-')}`}><span style={{ width: `${progress}%` }} /></div></td>
                        <td className="termination-actions"><div className="row-actions request-inline-actions"><button className="action-glyph" onClick={() => onViewDetails(record)} type="button" title="View details" aria-label="View details">👁</button><button className="action-glyph edit" onClick={() => onEdit(record)} type="button" title="Edit" aria-label="Edit termination">✎</button><button className="action-glyph delete" onClick={() => onDelete(record.id)} type="button" title="Delete" aria-label="Delete termination">🗑</button></div></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'completed' && (
          <>
            <div className="table-toolbar leave-toolbar termination-topbar termination-topbar-completed">
              <label className="search-field"><span>Search</span><input className="termination-search" onChange={(event) => setCompletedSearch(event.target.value)} placeholder="Search employee, ID, department..." type="search" value={completedSearch} /></label>
              <label><span>Department</span><select className="termination-filter" onChange={(event) => setCompletedDepartmentFilter(event.target.value)} value={completedDepartmentFilter}>{completedDepartments.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>

            <div className="employee-table-shell compact-scroll termination-table-shell">
              <table className="data-table termination-table compact">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Nationality</th>
                    <th>Date of Join</th>
                    <th>Duration</th>
                    <th>Last Working Date</th>
                    <th>Departure Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {completedRows.map((record) => (
                    <tr key={record.id} className="termination-row">
                      <td>{record.employeeId}</td>
                      <td className="name-cell"><button className="name-link" onClick={() => onViewDetails(record)} type="button">{record.name}</button></td>
                      <td>{record.department}</td>
                      <td>{record.nationality}</td>
                      <td>{formatDateDisplay(record.dateOfJoin)}</td>
                      <td>{getDuration(record.dateOfJoin)}</td>
                      <td>{formatDateDisplay(record.lastWorkingDate)}</td>
                      <td>{formatDateDisplay(record.departureDate)}</td>
                      <td><button className="status-advance-btn status-text status-chip status-step-pending-departure" disabled type="button">Departed</button></td>
                      <td className="termination-actions"><button className="action-glyph" onClick={() => onViewDetails(record)} type="button" title="View details" aria-label="View details">👁</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="leave-empty-zone">
          {(activeTab === 'notice' ? noticeRows.length : completedRows.length) === 0
            ? 'No records yet. Details will appear here when entries are added.'
            : `Showing ${(activeTab === 'notice' ? noticeRows.length : completedRows.length)} record${(activeTab === 'notice' ? noticeRows.length : completedRows.length) > 1 ? 's' : ''}.`}
        </div>
      </section>
    </>
  )
}

function OperationsPage({ employees }: { employees: Employee[] }) {
  const [activeSection, setActiveSection] = useState<OpsSection>('files')
  const [personalFiles, setPersonalFiles] = useState<PersonalFileRecord[]>(initialPersonalFiles)
  const [inductionRecords, setInductionRecords] = useState<InductionRecord[]>(initialInductionRecords)
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>(initialTrainingRecords)
  const [bankAccountRecords, setBankAccountRecords] = useState<BankAccountRecord[]>(initialBankAccountRecords)

  // Auto-add newly registered non-Maldivian employees
  const prevEmployeeIdsRef = useRef<Set<string>>(new Set(employees.map((e) => e.employeeId)))
  useEffect(() => {
    const currentIds = new Set(employees.map((e) => e.employeeId))
    const addedEmployees = employees.filter(
      (e) => e.nationality !== 'MALDIVIAN' && !prevEmployeeIdsRef.current.has(e.employeeId)
    )
    prevEmployeeIdsRef.current = currentIds
    if (addedEmployees.length === 0) return
    setBankAccountRecords((prev) => {
      const existingIds = new Set(prev.map((r) => r.employeeId))
      const toAdd = addedEmployees.filter((e) => !existingIds.has(e.employeeId))
      if (toAdd.length === 0) return prev
      return [...prev, ...toAdd.map((e): BankAccountRecord => ({
        id: `BNK-auto-${e.employeeId}`,
        employeeId: e.employeeId,
        fullName: e.fullName,
        department: e.department,
        nationality: e.nationality,
        bank: 'SBI',
        accountType: 'Both USD & MVR',
        scheduledDate: '',
        status: 'Pending',
      }))]
    })
  }, [employees])

  return (
    <>
      <PageHeader eyebrow="HR operations" title="HR Operations" />
      <div className="section-inline-tabs">
        <button className={activeSection === 'files' ? 'active' : ''} onClick={() => setActiveSection('files')} type="button">Personal Files</button>
        <button className={activeSection === 'induction' ? 'active' : ''} onClick={() => setActiveSection('induction')} type="button">Induction</button>
        <button className={activeSection === 'training' ? 'active' : ''} onClick={() => setActiveSection('training')} type="button">Training</button>
        <button className={activeSection === 'bank' ? 'active' : ''} onClick={() => setActiveSection('bank')} type="button">Bank Account</button>
      </div>
      {activeSection === 'files' && <PersonalFilesSection employees={employees} records={personalFiles} onUpdate={setPersonalFiles} onBack={() => {}} />}
      {activeSection === 'induction' && <InductionSection employees={employees} records={inductionRecords} onUpdate={setInductionRecords} onBack={() => {}} />}
      {activeSection === 'training' && <TrainingSection records={trainingRecords} employees={employees} onUpdate={setTrainingRecords} onBack={() => {}} />}
      {activeSection === 'bank' && <BankAccountSection employees={employees} records={bankAccountRecords} onUpdate={setBankAccountRecords} onBack={() => {}} />}
    </>
  )
}

function StaffRequestModal({ record, onClose, onSave }: { record: StaffRequestRecord; onClose: () => void; onSave: (r: StaffRequestRecord) => void }) {
  const isNew = record.id.startsWith('REQ-new')
  const [employeeName, setEmployeeName] = useState(record.employeeName)
  const [department, setDepartment] = useState(record.department)
  const [requestType, setRequestType] = useState<StaffRequestRecord['requestType']>(record.requestType)
  const [description, setDescription] = useState(record.description)
  const [submittedDate, setSubmittedDate] = useState(record.submittedDate)
  const [completedDate, setCompletedDate] = useState(record.completedDate)
  const [status, setStatus] = useState<StaffRequestRecord['status']>(record.status)
  const [remarks, setRemarks] = useState(record.remarks)
  const save = (e: FormEvent) => { e.preventDefault(); onSave({ ...record, id: isNew ? `REQ-${Date.now()}` : record.id, employeeName, department, requestType, description, submittedDate, completedDate, status, remarks }) }
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header"><div><p className="eyebrow">Activities</p><h2>{isNew ? 'New Request' : 'Edit Request'}</h2></div><button className="icon-button" onClick={onClose} type="button">×</button></div>
        <form onSubmit={save}>
          <div className="form-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}>
            <label><span>Employee Name</span><input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} required /></label>
            <label><span>Department</span><select value={department} onChange={(e) => setDepartment(e.target.value)}>{departmentsList.map((d) => <option key={d}>{d}</option>)}</select></label>
            <label><span>Request Type</span><select value={requestType} onChange={(e) => setRequestType(e.target.value as StaffRequestRecord['requestType'])}><option>Accommodation</option><option>Equipment</option><option>Transfer</option><option>Leave</option><option>Documents</option><option>Other</option></select></label>
            <label><span>Submitted Date</span><input type="date" value={submittedDate} onChange={(e) => setSubmittedDate(e.target.value)} required /></label>
            <label><span>Completed Date</span><input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} /></label>
            <label><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value as StaffRequestRecord['status'])}><option>Open</option><option>In Progress</option><option>Resolved</option><option>Rejected</option></select></label>
            <label className="full-width" style={{gridColumn:'1/-1'}}><span>Description</span><input value={description} onChange={(e) => setDescription(e.target.value)} /></label>
            <label className="full-width" style={{gridColumn:'1/-1'}}><span>Remarks</span><input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></label>
          </div>
          <div className="modal-actions"><button className="primary-button" type="submit">{isNew ? 'Add Request' : 'Save Changes'}</button></div>
        </form>
      </section>
    </div>
  )
}

function VisitModal({ record, onClose, onSave }: { record: VisitRecord; onClose: () => void; onSave: (r: VisitRecord) => void }) {
  const isNew = record.id.startsWith('VIS-new')
  const [employeeId, setEmployeeId] = useState(record.employeeId)
  const [employeeName, setEmployeeName] = useState(record.employeeName)
  const [department, setDepartment] = useState(record.department)
  const [nationality, setNationality] = useState(record.nationality)
  const [visitType, setVisitType] = useState<VisitRecord['visitType']>(record.visitType)
  const [visitDate, setVisitDate] = useState(record.visitDate)
  const [status, setStatus] = useState<VisitRecord['status']>(record.status)
  const [remarks, setRemarks] = useState(record.remarks)
  const save = (e: FormEvent) => { e.preventDefault(); onSave({ ...record, id: isNew ? `VIS-${Date.now()}` : record.id, employeeId, employeeName, department, nationality, visitType, visitDate, status, remarks }) }
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header"><div><p className="eyebrow">Activities</p><h2>{isNew ? 'New Visit' : 'Edit Visit'}</h2></div><button className="icon-button" onClick={onClose} type="button">×</button></div>
        <form onSubmit={save}>
          <div className="form-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}>
            <label><span>Employee ID</span><input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} /></label>
            <label style={{gridColumn:'2/4'}}><span>Employee Name</span><input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} required /></label>
            <label><span>Department</span><select value={department} onChange={(e) => setDepartment(e.target.value)}><option value="">Select...</option>{departmentsList.map((d) => <option key={d}>{d}</option>)}</select></label>
            <label><span>Nationality</span><select value={nationality} onChange={(e) => setNationality(e.target.value)}>{nationalities.map((n) => <option key={n}>{n}</option>)}</select></label>
            <label><span>Visit Type</span><select value={visitType} onChange={(e) => setVisitType(e.target.value as VisitRecord['visitType'])}><option>Visa Medical</option><option>Photo</option><option>Passport Renewal</option><option>Embassy Letter Collection</option></select></label>
            <label><span>Visit Date</span><input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required /></label>
            <label><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value as VisitRecord['status'])}><option>Scheduled</option><option>Completed</option><option>Cancelled</option></select></label>
            <label style={{gridColumn:'3/4'}}><span>Remarks</span><input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></label>
          </div>
          <div className="modal-actions"><button className="primary-button" type="submit">{isNew ? 'Add Visit' : 'Save Changes'}</button></div>
        </form>
      </section>
    </div>
  )
}

function IncidentModal({ record, employees, onClose, onSave }: { record: IncidentRecord; employees: Employee[]; onClose: () => void; onSave: (r: IncidentRecord) => void }) {
  const isNew = record.id.startsWith('INC-new')
  const [incidentDate, setIncidentDate] = useState(record.incidentDate)
  const [timeOfIncident, setTimeOfIncident] = useState<IncidentRecord['timeOfIncident']>(record.timeOfIncident)
  const [employeeId, setEmployeeId] = useState(record.employeeId)
  const [employeeName, setEmployeeName] = useState(record.employeeName)
  const [reportedById, setReportedById] = useState(record.reportedById)
  const [reportedByName, setReportedByName] = useState(record.reportedByName)
  const [department, setDepartment] = useState(record.department)
  const [siteLocation, setSiteLocation] = useState(record.siteLocation)
  const [incidentType, setIncidentType] = useState<IncidentRecord['incidentType']>(record.incidentType)
  const [incidentSummary, setIncidentSummary] = useState(record.incidentSummary ?? '')
  const [exactLocation, setExactLocation] = useState(record.exactLocation ?? '')
  const [immediateCause, setImmediateCause] = useState(record.immediateCause ?? '')
  const [witnessName, setWitnessName] = useState(record.witnessName ?? '')
  const [witnessId, setWitnessId] = useState(record.witnessId ?? '')
  const [correctiveOwner, setCorrectiveOwner] = useState(record.correctiveOwner ?? '')
  const [followUpDate, setFollowUpDate] = useState(record.followUpDate ?? '')
  const [description, setDescription] = useState(record.description)
  const [injuryInvolved, setInjuryInvolved] = useState(record.injuryInvolved)
  const [actionTaken, setActionTaken] = useState(record.actionTaken)
  const [statementTaken, setStatementTaken] = useState(record.statementTaken)
  const [disciplinaryAction, setDisciplinaryAction] = useState(record.disciplinaryAction)
  const [status, setStatus] = useState<IncidentRecord['status']>(record.status)
  const employeeDirectory = useMemo(() => new Map(employees.map((employee) => [employee.employeeId.trim().toUpperCase(), employee])), [employees])
  const matchedEmployee = employeeDirectory.get(employeeId.trim().toUpperCase()) ?? null
  const matchedReporter = employeeDirectory.get(reportedById.trim().toUpperCase()) ?? null
  const save = (e: FormEvent) => { e.preventDefault(); onSave({ ...record, incidentDate, timeOfIncident, employeeId, employeeName, reportedById, reportedByName, department, siteLocation, incidentType, incidentSummary, exactLocation, immediateCause, witnessName, witnessId, correctiveOwner, followUpDate, description, injuryInvolved, actionTaken, statementTaken, disciplinaryAction, status }) }

  const handleEmployeeIdChange = (value: string) => {
    setEmployeeId(value)
    const matched = employeeDirectory.get(value.trim().toUpperCase())
    if (!matched) return
    setEmployeeName(matched.fullName)
    setDepartment(matched.department)
  }

  const handleReportedByIdChange = (value: string) => {
    setReportedById(value)
    const matched = employeeDirectory.get(value.trim().toUpperCase())
    if (!matched) return
    setReportedByName(matched.fullName)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal wide-modal" role="dialog" aria-modal="true">
        <div className="modal-header"><div><p className="eyebrow">Activities</p><h2>{isNew ? 'Log Incident' : 'Edit Incident'}</h2><p>Enter IDs to auto-fill from the register. Names can still be edited manually.</p></div><button className="icon-button" onClick={onClose} type="button">×</button></div>
        <form onSubmit={save}>
          <div className="incident-modal-stack">
            <section className="incident-shell-card">
              <div className="incident-ref-row">
                <div><span>Incident Ref</span><strong>{isNew ? 'Auto on save' : record.id}</strong></div>
              </div>
              <div className="incident-form-grid incident-form-grid-4">
                <label><span>Incident Date</span><input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} required /></label>
                <label><span>Time</span><select value={timeOfIncident} onChange={(e) => setTimeOfIncident(e.target.value as IncidentRecord['timeOfIncident'])}><option value="">Select...</option><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Night</option></select></label>
                <label><span>Incident Type</span><select value={incidentType} onChange={(e) => setIncidentType(e.target.value as IncidentRecord['incidentType'])}><option>Work Injury</option><option>Near Miss</option><option>Property Damage</option><option>Fire</option><option>Misconduct</option><option>Sleeping on Duty</option><option>Other</option></select></label>
                <label><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value as IncidentRecord['status'])}><option>Open</option><option>Under Review</option><option>Closed</option></select></label>
              </div>
            </section>

            <div className="incident-split-grid">
              <section className="incident-shell-card">
                <h3 className="incident-block-title">Involved Staff</h3>
                <div className="incident-form-grid incident-form-grid-2">
                  <label>
                    <span>Employee ID</span>
                    <input value={employeeId} onChange={(e) => handleEmployeeIdChange(e.target.value)} placeholder="Enter employee ID" />
                    <small className={`field-note ${matchedEmployee ? 'matched' : ''}`}>{matchedEmployee ? `Matched: ${matchedEmployee.fullName}` : ''}</small>
                  </label>
                  <label><span>Employee Name</span><input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="Type or accept auto-fill" /></label>
                  <label className="full-field"><span>Department</span><select value={department} onChange={(e) => setDepartment(e.target.value)}><option value="">Select...</option>{departmentsList.map((d) => <option key={d}>{d}</option>)}</select></label>
                </div>
              </section>

              <section className="incident-shell-card">
                <h3 className="incident-block-title">Reporter & Follow-up</h3>
                <div className="incident-form-grid incident-form-grid-2">
                  <label>
                    <span>Reported By ID</span>
                    <input value={reportedById} onChange={(e) => handleReportedByIdChange(e.target.value)} placeholder="Enter reporter ID" />
                    <small className={`field-note ${matchedReporter ? 'matched' : ''}`}>{matchedReporter ? `Matched: ${matchedReporter.fullName}` : ''}</small>
                  </label>
                  <label><span>Reported By Name</span><input value={reportedByName} onChange={(e) => setReportedByName(e.target.value)} placeholder="Type or accept auto-fill" /></label>
                  <label className="full-field"><span>Site / Location</span><input value={siteLocation} onChange={(e) => setSiteLocation(e.target.value)} placeholder="Workshop, gate, plant, room..." /></label>
                </div>
                <div className="incident-check-grid">
                  <label className="incident-check-card"><input type="checkbox" checked={injuryInvolved} onChange={(e) => setInjuryInvolved(e.target.checked)} /><span>Injury</span></label>
                  <label className="incident-check-card"><input type="checkbox" checked={statementTaken} onChange={(e) => setStatementTaken(e.target.checked)} /><span>Statement</span></label>
                  <label className="incident-check-card"><input type="checkbox" checked={disciplinaryAction} onChange={(e) => setDisciplinaryAction(e.target.checked)} /><span>Disciplinary</span></label>
                </div>
              </section>
            </div>

            <section className="incident-shell-card">
              <h3 className="incident-block-title">Narrative</h3>
              <div className="incident-form-grid incident-form-grid-4">
                <label><span>Incident Summary</span><input value={incidentSummary} onChange={(e) => setIncidentSummary(e.target.value)} placeholder="Short incident headline" /></label>
                <label><span>Exact Spot</span><input value={exactLocation} onChange={(e) => setExactLocation(e.target.value)} placeholder="Line, zone, unit, room" /></label>
                <label><span>Immediate Cause</span><input value={immediateCause} onChange={(e) => setImmediateCause(e.target.value)} placeholder="Slip, tool issue, behavior" /></label>
                <label><span>Follow-up Date</span><input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} /></label>
                <label><span>Witness Name</span><input value={witnessName} onChange={(e) => setWitnessName(e.target.value)} placeholder="Optional" /></label>
                <label><span>Witness ID</span><input value={witnessId} onChange={(e) => setWitnessId(e.target.value)} placeholder="Optional" /></label>
                <label><span>Corrective Owner</span><input value={correctiveOwner} onChange={(e) => setCorrectiveOwner(e.target.value)} placeholder="Responsible person" /></label>
                <label className="full-field"><span>Incident Description</span><textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened?" /></label>
                <label className="full-field"><span>Action Taken</span><textarea rows={3} value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="Immediate action and follow-up" /></label>
              </div>
            </section>
          </div>
          <div className="modal-actions"><button className="primary-button" type="submit">{isNew ? 'Log Incident' : 'Save Changes'}</button></div>
        </form>
      </section>
    </div>
  )
}

function RequestsSection({ records, onUpdate }: { records: StaffRequestRecord[]; onUpdate: (fn: (prev: StaffRequestRecord[]) => StaffRequestRecord[]) => void; onBack?: () => void }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editing, setEditing] = useState<StaffRequestRecord | null>(null)
  const filtered = records.filter((r) => `${r.employeeName} ${r.department} ${r.requestType} ${r.description}`.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'All' || r.status === statusFilter))
  const save = (r: StaffRequestRecord) => { onUpdate((prev) => { const idx = prev.findIndex((x) => x.id === r.id); return idx >= 0 ? prev.map((x) => x.id === r.id ? r : x) : [...prev, r] }); setEditing(null) }
  const del = (id: string) => onUpdate((prev) => prev.filter((x) => x.id !== id))
  return (
    <>
      <section className="employee-workspace">
        <div className="table-toolbar activities-toolbar">
          <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Employee, type, description" /></label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="All">All Statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option><option>Rejected</option></select></label>
          <button className="primary-button" type="button" onClick={() => setEditing({ id: 'REQ-new', employeeName: '', department: departmentsList[0], requestType: 'Accommodation', description: '', submittedDate: new Date().toISOString().slice(0, 10), completedDate: '', status: 'Open', remarks: '' })}>+ Add Request</button>
        </div>
        <div className="employee-table-shell compact-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Employee</th><th>Department</th><th>Type</th><th>Description</th><th>Submitted</th><th>Completed</th><th>Status</th><th>Remarks</th><th>Actions</th></tr></thead>
          <tbody>{filtered.length === 0 ? <tr><td colSpan={10} className="empty-row">No requests found</td></tr> : filtered.map((r) => (
            <tr key={r.id}><td>{r.id}</td><td>{r.employeeName}</td><td>{r.department}</td><td>{r.requestType}</td><td>{r.description}</td><td>{formatDateDisplay(r.submittedDate)}</td><td>{r.completedDate ? formatDateDisplay(r.completedDate) : '—'}</td><td><StatusBadge status={r.status} /></td><td>{r.remarks || '-'}</td>
              <td><div className="row-actions"><button className="action-glyph edit" title="Edit" onClick={() => setEditing(r)} type="button">✎</button><button className="action-glyph delete" title="Delete" onClick={() => del(r.id)} type="button">🗑</button></div></td></tr>
          ))}</tbody>
        </table></div>
      </section>
      {editing && <StaffRequestModal record={editing} onClose={() => setEditing(null)} onSave={save} />}
    </>
  )
}

function VisitsSection({ records, onUpdate }: { records: VisitRecord[]; onUpdate: (fn: (prev: VisitRecord[]) => VisitRecord[]) => void; onBack?: () => void }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editing, setEditing] = useState<VisitRecord | null>(null)
  const filtered = records.filter((r) => `${r.employeeId} ${r.employeeName} ${r.department} ${r.nationality}`.toLowerCase().includes(search.toLowerCase()) && (typeFilter === 'All' || r.visitType === typeFilter) && (statusFilter === 'All' || r.status === statusFilter))
  const save = (r: VisitRecord) => { onUpdate((prev) => { const idx = prev.findIndex((x) => x.id === r.id); return idx >= 0 ? prev.map((x) => x.id === r.id ? r : x) : [...prev, r] }); setEditing(null) }
  const del = (id: string) => onUpdate((prev) => prev.filter((x) => x.id !== id))
  return (
    <>
      <section className="employee-workspace">
        <div className="table-toolbar activities-toolbar">
          <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID, name, department" /></label>
          <label><span>Type</span><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="All">All Types</option><option>Visa Medical</option><option>Photo</option><option>Passport Renewal</option><option>Embassy Letter Collection</option></select></label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="All">All Statuses</option><option>Scheduled</option><option>Completed</option><option>Cancelled</option></select></label>
          <button className="primary-button" type="button" onClick={() => setEditing({ id: 'VIS-new', employeeId: '', employeeName: '', department: departmentsList[0], nationality: nationalities[0], visitType: 'Visa Medical', visitDate: new Date().toISOString().slice(0, 10), status: 'Scheduled', remarks: '' })}>+ Add Visit</button>
        </div>
        <div className="employee-table-shell compact-scroll"><table className="data-table"><thead><tr><th>#</th><th>Emp ID</th><th>Name</th><th>Department</th><th>Nationality</th><th>Visit Type</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{filtered.length === 0 ? <tr><td colSpan={9} className="empty-row">No visits found</td></tr> : filtered.map((r, i) => (
            <tr key={r.id}><td>{i + 1}</td><td>{r.employeeId || '—'}</td><td>{r.employeeName}</td><td>{r.department}</td><td>{r.nationality}</td><td>{r.visitType}</td><td>{formatDateDisplay(r.visitDate)}</td><td><StatusBadge status={r.status} /></td>
              <td><div className="row-actions"><button className="action-glyph edit" title="Edit" onClick={() => setEditing(r)} type="button">✎</button><button className="action-glyph delete" title="Delete" onClick={() => del(r.id)} type="button">🗑</button></div></td></tr>
          ))}</tbody>
        </table></div>
      </section>
      {editing && <VisitModal record={editing} onClose={() => setEditing(null)} onSave={save} />}
    </>
  )
}

function IncidentsSection({ records, employees, onUpdate }: { records: IncidentRecord[]; employees: Employee[]; onUpdate: (fn: (prev: IncidentRecord[]) => IncidentRecord[]) => void; onBack?: () => void }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editing, setEditing] = useState<IncidentRecord | null>(null)
  const [viewing, setViewing] = useState<IncidentRecord | null>(null)
  const filtered = records.filter((r) => `${r.employeeId} ${r.employeeName} ${r.department} ${r.siteLocation} ${r.incidentType}`.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'All' || r.status === statusFilter))
  const save = (r: IncidentRecord) => {
    onUpdate((prev) => {
      const nextRecord = r.id.startsWith('INC-new') ? { ...r, id: nextIncidentRef(prev) } : r
      const idx = prev.findIndex((x) => x.id === nextRecord.id)
      return idx >= 0 ? prev.map((x) => x.id === nextRecord.id ? nextRecord : x) : [nextRecord, ...prev]
    })
    setEditing(null)
  }
  const del = (id: string) => onUpdate((prev) => prev.filter((x) => x.id !== id))
  const newIncident = (): IncidentRecord => ({ id: 'INC-new', incidentDate: new Date().toISOString().slice(0, 10), timeOfIncident: 'Morning', employeeId: '', employeeName: '', reportedById: '', reportedByName: '', department: departmentsList[0], siteLocation: '', incidentType: 'Work Injury', incidentSummary: '', exactLocation: '', immediateCause: '', witnessName: '', witnessId: '', correctiveOwner: '', followUpDate: '', description: '', injuryInvolved: false, actionTaken: '', statementTaken: false, disciplinaryAction: false, status: 'Open' })
  return (
    <>
      <section className="employee-workspace">
        <div className="table-toolbar activities-toolbar">
          <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Employee, type, location" /></label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="All">All Statuses</option><option>Open</option><option>Under Review</option><option>Closed</option></select></label>
          <button className="primary-button" type="button" onClick={() => setEditing(newIncident())}>+ Log Incident</button>
        </div>
        <div className="employee-table-shell compact-scroll"><table className="data-table"><thead><tr><th>Ref No.</th><th>Date</th><th>Time</th><th>Employee</th><th>Department</th><th>Site / Location</th><th>Type</th><th>Injury</th><th>Statement</th><th>Disciplinary</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{filtered.length === 0 ? <tr><td colSpan={12} className="empty-row">No incidents found</td></tr> : filtered.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{formatDateDisplay(r.incidentDate)}</td>
              <td>{r.timeOfIncident || '—'}</td>
              <td>{r.employeeName || '—'}</td>
              <td>{r.department}</td>
              <td>{r.siteLocation || '—'}</td>
              <td>{r.incidentType}</td>
              <td style={{textAlign:'center'}}>{r.injuryInvolved ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
              <td style={{textAlign:'center'}}>{r.statementTaken ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
              <td style={{textAlign:'center'}}>{r.disciplinaryAction ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
              <td><StatusBadge status={r.status} /></td>
              <td><div className="row-actions"><button className="action-glyph" title="View" onClick={() => setViewing(r)} type="button">👁</button><button className="action-glyph edit" title="Edit" onClick={() => setEditing(r)} type="button">✎</button><button className="action-glyph delete" title="Delete" onClick={() => del(r.id)} type="button">🗑</button></div></td>
            </tr>
          ))}</tbody>
        </table></div>
      </section>
      {editing && <IncidentModal record={editing} employees={employees} onClose={() => setEditing(null)} onSave={save} />}
      {viewing && (
        <div className="modal-backdrop" role="presentation">
          <section className="registration-modal wide-modal" role="dialog" aria-modal="true">
            <div className="modal-header"><div><p className="eyebrow">Incident Reference {viewing.id}</p><h2>{viewing.incidentType}</h2></div><button className="icon-button" onClick={() => setViewing(null)} type="button">×</button></div>
            <div className="induction-view-grid">
              <div className="induction-detail-row"><span>Date</span><strong>{formatDateDisplay(viewing.incidentDate)}</strong></div>
              <div className="induction-detail-row"><span>Time</span><strong>{viewing.timeOfIncident || '—'}</strong></div>
              <div className="induction-detail-row"><span>Employee</span><strong>{viewing.employeeName || '—'} {viewing.employeeId ? `(${viewing.employeeId})` : ''}</strong></div>
              <div className="induction-detail-row"><span>Reported By</span><strong>{viewing.reportedByName || '—'} {viewing.reportedById ? `(${viewing.reportedById})` : ''}</strong></div>
              <div className="induction-detail-row"><span>Department</span><strong>{viewing.department}</strong></div>
              <div className="induction-detail-row"><span>Site / Location</span><strong>{viewing.siteLocation || '—'}</strong></div>
              <div className="induction-detail-row"><span>Summary</span><strong>{viewing.incidentSummary || '—'}</strong></div>
              <div className="induction-detail-row"><span>Exact Spot</span><strong>{viewing.exactLocation || '—'}</strong></div>
              <div className="induction-detail-row"><span>Immediate Cause</span><strong>{viewing.immediateCause || '—'}</strong></div>
              <div className="induction-detail-row"><span>Witness</span><strong>{viewing.witnessName || '—'} {viewing.witnessId ? `(${viewing.witnessId})` : ''}</strong></div>
              <div className="induction-detail-row"><span>Corrective Owner</span><strong>{viewing.correctiveOwner || '—'}</strong></div>
              <div className="induction-detail-row"><span>Follow-up Date</span><strong>{viewing.followUpDate ? formatDateDisplay(viewing.followUpDate) : '—'}</strong></div>
              <div className="induction-detail-row"><span>Injury Involved</span><strong>{viewing.injuryInvolved ? 'Yes' : 'No'}</strong></div>
              <div className="induction-detail-row"><span>Statement Taken</span><strong>{viewing.statementTaken ? 'Yes' : 'No'}</strong></div>
              <div className="induction-detail-row"><span>Disciplinary</span><strong>{viewing.disciplinaryAction ? 'Yes' : 'No'}</strong></div>
              <div className="induction-detail-row"><span>Status</span><strong>{viewing.status}</strong></div>
            </div>
            {viewing.description && <div className="induction-content-box" style={{marginTop:12}}><p className="eyebrow">Incident Description</p><p className="induction-content-text">{viewing.description}</p></div>}
            {viewing.actionTaken && <div className="induction-content-box" style={{marginTop:8}}><p className="eyebrow">Action Taken</p><p className="induction-content-text">{viewing.actionTaken}</p></div>}
            <div className="modal-actions"><button className="primary-button" type="button" onClick={() => { setViewing(null); setEditing(viewing) }}>✎ Edit</button><button className="back-btn-sm" type="button" onClick={() => setViewing(null)}>Close</button></div>
          </section>
        </div>
      )}
    </>
  )
}

function ActivitiesPage({ employees }: { employees: Employee[] }) {
  const [activeSection, setActiveSection] = useState<ActivitiesSection>('requests')
  const [staffRequests, setStaffRequests] = useState<StaffRequestRecord[]>(initialStaffRequests)
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>(initialVisitRecords)
  const [incidentRecords, setIncidentRecords] = useState<IncidentRecord[]>(initialIncidentRecords)
  return (
    <>
      <PageHeader eyebrow="Activities" title="Activities" />
      <div className="section-inline-tabs">
        <button className={activeSection === 'requests' ? 'active' : ''} onClick={() => setActiveSection('requests')} type="button">Requests</button>
        <button className={activeSection === 'visits' ? 'active' : ''} onClick={() => setActiveSection('visits')} type="button">Visits</button>
        <button className={activeSection === 'incidents' ? 'active' : ''} onClick={() => setActiveSection('incidents')} type="button">Incidents</button>
      </div>
      {activeSection === 'requests' && <RequestsSection records={staffRequests} onUpdate={setStaffRequests} onBack={() => {}} />}
      {activeSection === 'visits' && <VisitsSection records={visitRecords} onUpdate={setVisitRecords} onBack={() => {}} />}
      {activeSection === 'incidents' && <IncidentsSection records={incidentRecords} employees={employees} onUpdate={setIncidentRecords} onBack={() => {}} />}
    </>
  )
}

type UserRole = 'Admin' | 'HR Manager' | 'Viewer'
type AppUserStatus = 'Active' | 'Inactive'

type AppUser = {
  id: string
  name: string
  username: string
  role: UserRole
  status: AppUserStatus
  lastLogin: string
}

const initialAppUsers: AppUser[] = [
  { id: 'USR-001', name: 'System Admin', username: 'admin', role: 'Admin', status: 'Active', lastLogin: '2026-05-14' },
  { id: 'USR-002', name: 'Arushulla Rashid', username: 'arushulla.r', role: 'HR Manager', status: 'Active', lastLogin: '2026-05-13' },
  { id: 'USR-003', name: 'Shantumon Pathiyil', username: 'shantumon.p', role: 'HR Manager', status: 'Active', lastLogin: '2026-05-10' },
]

const rolePermissions: Record<UserRole, string> = {
  'Admin': 'Full access — view, edit, delete, manage users',
  'HR Manager': 'View and edit all HR records — no user management',
  'Viewer': 'Read-only access to employees and leave records',
}

function UserFormModal({ user, onClose, onSave }: {
  user: AppUser & { password?: string }
  onClose: () => void
  onSave: (user: AppUser) => void
}) {
  const isNew = user.id.startsWith('USR-new')
  const [name, setName] = useState(user.name)
  const [username, setUsername] = useState(user.username)
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(user.role)
  const [status, setStatus] = useState<AppUserStatus>(user.status)
  const [showPassword, setShowPassword] = useState(false)

  const save = (e: FormEvent) => {
    e.preventDefault()
    onSave({ ...user, id: isNew ? `USR-${String(Date.now()).slice(-4)}` : user.id, name, username, role, status, lastLogin: user.lastLogin || new Date().toISOString().slice(0, 10) })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">User management</p>
            <h2>{isNew ? 'Add User' : `Edit — ${user.name}`}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <form onSubmit={save}>
          <div className="form-grid">
            <label><span>Full Name</span><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Display name" /></label>
            <label><span>Username</span><input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Login username" /></label>
            <label><span>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                <option>Admin</option>
                <option>HR Manager</option>
                <option>Viewer</option>
              </select>
            </label>
            <label><span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as AppUserStatus)}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            <label className="full-field">
              <span>{isNew ? 'Password' : 'New Password (leave blank to keep current)'}</span>
              <div className="password-field">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required={isNew} placeholder={isNew ? 'Set a password' : 'Enter new password to change'} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((p) => !p)}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </label>
            <div className="full-field user-role-hint">
              <strong>{role}</strong>
              <span>{rolePermissions[role]}</span>
            </div>
          </div>
          <div className="modal-actions">
            <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
            <button className="primary-button" type="submit">{isNew ? 'Create User' : 'Save Changes'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function SettingsPage({ employees: _employees, leaveRequests: _lr, activeLeaves: _al, onReset }: {
  employees: Employee[]
  leaveRequests: LeaveRequestRecord[]
  activeLeaves: ActiveLeaveRecord[]
  onReset: () => void
}) {
  const [users, setUsers] = useState<AppUser[]>(initialAppUsers)
  const [editing, setEditing] = useState<AppUser | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = users.filter((u) =>
    `${u.name} ${u.username} ${u.role}`.toLowerCase().includes(search.toLowerCase())
  )

  const saveUser = (user: AppUser) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id)
      return exists ? prev.map((u) => u.id === user.id ? user : u) : [...prev, user]
    })
    setEditing(null)
    setShowAdd(false)
  }

  const deleteUser = (id: string) => {
    if (id === 'USR-001') return
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  const toggleStatus = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u))
  }

  const newUser: AppUser = { id: 'USR-new', name: '', username: '', role: 'HR Manager', status: 'Active', lastLogin: '' }

  const roleColors: Record<UserRole, string> = {
    'Admin': 'role-admin',
    'HR Manager': 'role-hr',
    'Viewer': 'role-viewer',
  }

  return (
    <div className="settings-page user-mgmt-page">
      <div className="user-mgmt-header">
        <div>
          <h1 className="user-mgmt-title">User Management</h1>
          <p className="user-mgmt-subtitle">Manage who can access the TIC HR system and what they can do.</p>
        </div>
        <button className="primary-button" onClick={() => setShowAdd(true)} type="button">+ Add User</button>
      </div>

      {/* Role legend — 3 horizontal cards */}
      <div className="role-legend">
        {(Object.entries(rolePermissions) as [UserRole, string][]).map(([role, desc]) => (
          <div key={role} className="role-legend-item">
            <span className={`role-chip ${roleColors[role]}`}>{role}</span>
            <span className="role-legend-desc">{desc}</span>
            <span className="role-legend-note">Role assignment available when backend is connected.</span>
          </div>
        ))}
      </div>

      {/* Search + table filling remaining space */}
      <div className="user-mgmt-table-wrap">
        <div className="user-table-toolbar">
          <label className="search-field">
            <span>Search</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, username or role" />
          </label>
          <span className="user-count">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="employee-table-shell">
          <table className="data-table user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className={user.status === 'Inactive' ? 'user-row-inactive' : ''}>
                  <td>
                    <div className="user-avatar-cell">
                      <span className="user-avatar">{user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                      <strong>{user.name}</strong>
                    </div>
                  </td>
                  <td><code className="user-username">{user.username}</code></td>
                  <td><span className={`role-chip ${roleColors[user.role]}`}>{user.role}</span></td>
                  <td className="user-perms">{rolePermissions[user.role]}</td>
                  <td>{user.lastLogin ? formatDateDisplay(user.lastLogin) : '—'}</td>
                  <td>
                    <button
                      type="button"
                      className={`status-toggle-btn ${user.status === 'Active' ? 'active' : 'inactive'}`}
                      onClick={() => toggleStatus(user.id)}
                      disabled={user.id === 'USR-001'}
                      title={user.id === 'USR-001' ? 'Cannot deactivate system admin' : `Set ${user.status === 'Active' ? 'Inactive' : 'Active'}`}
                    >
                      {user.status}
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="action-glyph edit" onClick={() => setEditing(user)} type="button" title="Edit user" aria-label="Edit user">✎</button>
                      <button className="action-glyph delete" onClick={() => deleteUser(user.id)} type="button" title={user.id === 'USR-001' ? 'Cannot delete system admin' : 'Delete user'} aria-label="Delete user" disabled={user.id === 'USR-001'}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(editing || showAdd) && (
        <UserFormModal
          user={editing ?? newUser}
          onClose={() => { setEditing(null); setShowAdd(false) }}
          onSave={saveUser}
        />
      )}

      <div className="settings-danger-zone">
        <div className="danger-zone-header">
          <h2>Danger Zone</h2>
          <p>Irreversible actions. Proceed with caution.</p>
        </div>
        <div className="danger-zone-row">
          <div>
            <strong>Reset All Data</strong>
            <p>Permanently delete all employees, leave records, terminations, and operations data. This cannot be undone.</p>
          </div>
          <button className="danger-button" type="button" onClick={onReset}>Reset All Data</button>
        </div>
      </div>
    </div>
  )
}

function PendingTasksModal({ employees, onEdit, onClose }: { employees: Employee[]; onEdit: (employee: Employee) => void; onClose: () => void }) {
  const taskRows = employees.map((employee) => ({ employee, tasks: getPendingTasks(employee) })).filter((row) => row.tasks.length > 0)
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal pending-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Record completion</p>
            <h2>Pending Tasks <span className="pending-count-badge">{taskRows.length}</span></h2>
            <p>Employees with incomplete registration details. Click a name to open the edit form.</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">✕</button>
        </div>
        <div className="pending-task-list">
          {taskRows.length === 0
            ? <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '2rem 1rem' }}>✓ All employee records are complete</p>
            : taskRows.map(({ employee, tasks }) => (
              <div className="pending-task-row" key={`${employee.employeeId}-${employee.fullName}`}>
                <div className="pending-task-info">
                  <button className="pending-name-btn" type="button" onClick={() => { onEdit(employee); onClose() }}>
                    {employee.fullName || 'Unnamed Employee'}
                  </button>
                  <span className="pending-task-id">{employee.employeeId || 'No ID'} · {employee.department}</span>
                </div>
                <div className="pending-task-fields">
                  {tasks.map((task) => <span className="pending-field-chip" key={task}>{task}</span>)}
                </div>
              </div>
            ))
          }
        </div>
      </section>
    </div>
  )
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState(false)
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loginUser === 'admin' && loginPass === 'Admin@Pending') {
      setLoginError(false)
      onLogin()
    } else {
      setLoginError(true)
    }
  }
  return (
    <main className="login-shell">
      {/* Background decorative grid */}
      <div className="login-bg-grid" aria-hidden="true" />

      {/* Top bar */}
      <div className="login-topbar">
        <div className="login-topbar-brand">
          <span className="login-topbar-mark">TIC</span>
          <span className="login-topbar-name">Thilafushi Industrial Complex</span>
        </div>
        <span className="login-topbar-badge">HR Register</span>
      </div>

      {/* Centre content */}
      <div className="login-center">
        {/* Left: headline */}
        <div className="login-headline-col">
          <p className="login-eyebrow">People Operations Platform</p>
          <h1 className="login-headline">
            TIC&nbsp;HR<br />Register
          </h1>
          <p className="login-desc">
            Centralised HR management for employee records, leave, operations, and site activities across Thilafushi Industrial Complex.
          </p>
          <div className="login-tags">
            {['Employee Register', 'Leave', 'HR Ops', 'Activities', 'Termination'].map((t) => (
              <span key={t} className="login-tag">{t}</span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="login-divider" aria-hidden="true" />

        {/* Right: form */}
        <div className="login-form-col">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-top">
              <h2 className="login-form-title">Sign in</h2>
              <p className="login-form-sub">Access your HR dashboard</p>
            </div>

            <label className="login-field">
              <span>Username</span>
              <input value={loginUser} onChange={(e) => { setLoginUser(e.target.value); setLoginError(false) }} autoComplete="username" />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input type="password" value={loginPass} onChange={(e) => { setLoginPass(e.target.value); setLoginError(false) }} autoComplete="current-password" />
            </label>

            {loginError && <p className="login-error">Invalid username or password.</p>}

            <button className="login-btn" type="submit">
              Sign In →
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <span>Thilafushi Industrial Complex · Maldives</span>
        <span>TIC HR Register v0.1</span>
      </div>
    </main>
  )
}

const pageIcons: Record<Page, string> = {
  overview: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  employees: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  leave: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  operations: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>`,
  activities: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>`,
  termination: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/></svg>`,
}

function App() {
  const [activePage, setActivePageState] = useState<Page>(() => (localStorage.getItem('tic_page') as Page) ?? 'overview')
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('tic_auth') === '1')
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => localStorage.getItem('tic_sidebar') === '1')

  const setActivePage = (page: Page) => { setActivePageState(page); localStorage.setItem('tic_page', page) }
  const setSidebarCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
    setSidebarCollapsedState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val
      localStorage.setItem('tic_sidebar', next ? '1' : '0')
      return next
    })
  }
  const login = () => { localStorage.setItem('tic_auth', '1'); setIsLoggedIn(true) }
  const logout = () => { localStorage.removeItem('tic_auth'); setIsLoggedIn(false) }
  const [importResult, setImportResult] = useState<{ added: number; updated: number; skipped: number } | null>(null)

  function loadStore<T>(key: string, fallback: T[]): T[] {
    try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T[]) : fallback } catch { return fallback }
  }

  const [employees, setEmployees] = useState<Employee[]>(() => loadStore('tic_employees', initialEmployees))
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>(() => loadStore('tic_leave_req', initialLeaveRequests))
  const [activeLeaves, setActiveLeaves] = useState<ActiveLeaveRecord[]>(() => loadStore('tic_leave_active', initialActiveLeaves))
  const [leaveHistory, setLeaveHistory] = useState<LeaveHistoryRecord[]>(() => loadStore('tic_leave_history', initialLeaveHistory))
  const [passportHandovers, setPassportHandovers] = useState<PassportHandoverRecord[]>(() => loadStore('tic_passport', initialPassportHandovers))
  const [noticeTerminations, setNoticeTerminations] = useState<EnhancedTerminationRecord[]>(() => loadStore('tic_term_notice', initialNoticeTerminations))
  const [completedTerminations, setCompletedTerminations] = useState<CompletedTerminationRecord[]>(() => loadStore('tic_term_done', initialCompletedTerminations))
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [employeeMode, setEmployeeMode] = useState<'add' | 'edit'>('add')
  const [employeeForm, setEmployeeForm] = useState<EmployeeForm>(emptyEmployee)
  const [showPendingTasks, setShowPendingTasks] = useState(false)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [editingLeaveRequest, setEditingLeaveRequest] = useState<LeaveRequestRecord | null>(null)
  const [editingPassportRecord, setEditingPassportRecord] = useState<PassportHandoverRecord | null>(null)
  const [editingTermination, setEditingTermination] = useState<EnhancedTerminationRecord | null>(null)
  const [showTerminationForm, setShowTerminationForm] = useState(false)
  const [terminationFormMode, setTerminationFormMode] = useState<'add' | 'edit'>('add')
  const [terminationDetails, setTerminationDetails] = useState<EnhancedTerminationRecord | CompletedTerminationRecord | null>(null)

  // Persist all data to localStorage on every change
  // One-time fix: repair employees whose designation had a comma causing CSV to
  // split it and write the second half (e.g. "BLASTING & PAINTING") into nationality
  useEffect(() => {
    setEmployees((prev) => {
      const fixes: Record<string, Partial<Employee>> = {
        '57785': { nationality: 'SRI LANKAN', designation: 'SITE MANAGER, BLASTING & PAINTING' },
        '56251': { nationality: 'SRI LANKAN', designation: 'SENIOR MANAGER, ENGINEERING AND MAINTENANCE' },
      }
      const needsFix = prev.some((e) => fixes[e.employeeId] && e.nationality !== 'SRI LANKAN')
      if (!needsFix) return prev
      return prev.map((e) => fixes[e.employeeId] && e.nationality !== 'SRI LANKAN' ? { ...e, ...fixes[e.employeeId] } : e)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { localStorage.setItem('tic_employees', JSON.stringify(employees)) }, [employees])
  useEffect(() => { localStorage.setItem('tic_leave_req', JSON.stringify(leaveRequests)) }, [leaveRequests])
  useEffect(() => { localStorage.setItem('tic_leave_active', JSON.stringify(activeLeaves)) }, [activeLeaves])
  useEffect(() => { localStorage.setItem('tic_leave_history', JSON.stringify(leaveHistory)) }, [leaveHistory])
  useEffect(() => { localStorage.setItem('tic_passport', JSON.stringify(passportHandovers)) }, [passportHandovers])
  useEffect(() => { localStorage.setItem('tic_term_notice', JSON.stringify(noticeTerminations)) }, [noticeTerminations])
  useEffect(() => { localStorage.setItem('tic_term_done', JSON.stringify(completedTerminations)) }, [completedTerminations])

  const resetAllData = () => {
    if (!window.confirm('This will permanently delete ALL data (employees, leave records, etc.). Are you sure?')) return
    const keys = ['tic_employees','tic_leave_req','tic_leave_active','tic_leave_history','tic_passport','tic_term_notice','tic_term_done']
    keys.forEach((k) => localStorage.removeItem(k))
    setEmployees([])
    setLeaveRequests([])
    setActiveLeaves([])
    setLeaveHistory([])
    setPassportHandovers([])
    setNoticeTerminations([])
    setCompletedTerminations([])
  }

  const saveEmployee = () => {
    const employee = { ...employeeForm, employeeId: employeeForm.employeeId || `PENDING-${String(employees.length + 1).padStart(4, '0')}`, fullName: employeeForm.fullName || 'Pending Employee', designation: employeeForm.designation || 'Pending Designation', workPermitNo: employeeForm.nationality === 'MALDIVES' ? '' : employeeForm.workPermitNo }
    setEmployees((current) => employeeMode === 'edit' ? current.map((item) => item.employeeId === employee.employeeId ? employee : item) : [employee, ...current])
    setEmployeeForm(emptyEmployee)
    setShowEmployeeForm(false)
    setActivePage('employees')
  }

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)

    const dueRequestIds = leaveRequests
      .filter((record) => record.step === 'Pending Departure' && record.departureDate <= today)
      .map((record) => record.id)

    if (dueRequestIds.length > 0) {
      const dueRequests = leaveRequests.filter((record) => dueRequestIds.includes(record.id))

      setLeaveRequests((current) => current.filter((record) => !dueRequestIds.includes(record.id)))
      setActiveLeaves((current) => {
        const existingKey = new Set(current.map((item) => `${item.employeeId}-${item.departureDate}-${item.returnDate}`))
        const additions = dueRequests
          .map((record) => toActiveLeave(record))
          .filter((record) => !existingKey.has(`${record.employeeId}-${record.departureDate}-${record.returnDate}`))
        return [...additions, ...current]
      })
      setEmployees((current) => current.map((employee) =>
        dueRequests.some((record) => record.employeeId === employee.employeeId)
          ? { ...employee, siteStatus: 'On Leave' }
          : employee,
      ))
    }

    const dueActiveIds = activeLeaves
      .filter((record) => record.returnDate <= today)
      .map((record) => record.id)

    if (dueActiveIds.length > 0) {
      const dueActive = activeLeaves.filter((record) => dueActiveIds.includes(record.id))

      setActiveLeaves((current) => current.filter((record) => !dueActiveIds.includes(record.id)))
      setLeaveHistory((current) => {
        const existingKey = new Set(current.map((item) => `${item.employeeId}-${item.departureDate}-${item.returnDate}`))
        const additions = dueActive
          .map((record) => toHistoryLeave(record))
          .filter((record) => !existingKey.has(`${record.employeeId}-${record.departureDate}-${record.returnDate}`))
        return [...additions, ...current]
      })
      setEmployees((current) => current.map((employee) =>
        dueActive.some((record) => record.employeeId === employee.employeeId)
          ? { ...employee, siteStatus: 'On Site' }
          : employee,
      ))
    }
  }, [leaveRequests, activeLeaves])

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)

    const dueTerminationIds = noticeTerminations
      .filter((record) => record.departureDate <= today)
      .map((record) => record.id)

    if (dueTerminationIds.length > 0) {
      const dueTerminations = noticeTerminations.filter((record) => dueTerminationIds.includes(record.id))

      setNoticeTerminations((current) => current.filter((record) => !dueTerminationIds.includes(record.id)))
      setCompletedTerminations((current) => [
        ...dueTerminations.map((record) => ({
          id: record.id,
          employeeId: record.employeeId,
          name: record.name,
          department: record.department,
          designation: record.designation,
          nationality: record.nationality,
          passportNo: record.passportNo,
          wpNo: record.wpNo,
          dateOfJoin: record.dateOfJoin,
          lastWorkingDate: record.lastWorkingDate,
          departureDate: record.departureDate,
          currentStage: 'Pending Departure' as TerminationStage,
          rehireEligible: record.rehireEligible,
          exitInterviewCompleted: record.exitInterviewCompleted,
          reasonForLeaving: record.reasonForLeaving,
          comments: record.comments,
          terminationType: record.terminationType,
        })),
        ...current,
      ])
      setEmployees((current) => current.filter((employee) => !dueTerminations.some((record) => record.employeeId === employee.employeeId)))
    }
  }, [noticeTerminations])

  const saveLeaveRequest = (record: LeaveRequestRecord) => {
    setLeaveRequests((current) => {
      const exists = current.some((item) => item.id === record.id)
      return exists ? current.map((item) => item.id === record.id ? record : item) : [record, ...current]
    })
    setShowLeaveForm(false)
    setEditingLeaveRequest(null)
  }

  const deleteLeaveRequest = (id: string) => {
    setLeaveRequests((current) => current.filter((record) => record.id !== id))
  }

  const advanceLeaveRequestStep = (id: string) => {
    const currentRecord = leaveRequests.find((record) => record.id === id)
    if (!currentRecord) return

    const currentIndex = requestSteps.indexOf(currentRecord.step)
    if (currentIndex >= requestSteps.length - 1) return

    const targetStep = requestSteps[currentIndex + 1]

    const nextRecord = { ...currentRecord, step: targetStep }
    setLeaveRequests((current) => current.map((record) => record.id === id ? nextRecord : record))
  }

  const updateHistoryConfirmation = (id: string, confirmation: HistoryConfirmation) => {
    setLeaveHistory((current) => current.map((record) => record.id === id ? { ...record, confirmation } : record))

    if (confirmation === 'Not Returned') {
      const record = leaveHistory.find((item) => item.id === id)
      if (record) {
        const employee = employees.find((item) => item.employeeId === record.employeeId)
        setNoticeTerminations((current) => [{ id: `TERM-${Date.now()}`, employeeId: record.employeeId, name: record.name, department: record.department, designation: employee?.designation ?? '', nationality: record.nationality, passportNo: employee?.nicPassportNo ?? '', wpNo: employee?.workPermitNo ?? '', dateOfJoin: employee?.dateOfJoin ?? '', dateSubmitted: new Date().toISOString().slice(0, 10), lastWorkingDate: new Date().toISOString().slice(0, 10), departureDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), currentStage: 'Letter Submitted', reasonForLeaving: 'Absconded / Did Not Return', satisfactionRating: 0, rehireEligible: false, exitInterviewCompleted: false, comments: '', terminationType: 'Absconded' }, ...current])
      }
    }
  }

  const savePassportRecord = (record: PassportHandoverRecord) => {
    setPassportHandovers((current) => {
      const exists = current.some((item) => item.id === record.id)
      return exists ? current.map((item) => item.id === record.id ? record : item) : [record, ...current]
    })
    setEditingPassportRecord(null)
  }

  const deletePassportRecord = (id: string) => {
    setPassportHandovers((current) => current.filter((record) => record.id !== id))
  }

  const openAddTermination = () => {
    setTerminationFormMode('add')
    setEditingTermination({
      id: `TERM-${Date.now()}`,
      employeeId: '',
      name: '',
      department: '',
      designation: '',
      nationality: '',
      passportNo: '',
      wpNo: '',
      dateOfJoin: '',
      dateSubmitted: new Date().toISOString().slice(0, 10),
      lastWorkingDate: new Date().toISOString().slice(0, 10),
      departureDate: new Date().toISOString().slice(0, 10),
      currentStage: 'Letter Submitted',
      reasonForLeaving: '',
      satisfactionRating: 0,
      rehireEligible: true,
      exitInterviewCompleted: false,
      comments: '',
      terminationType: 'Resignation',
    })
    setShowTerminationForm(true)
  }

  const openEditTermination = (record: EnhancedTerminationRecord) => {
    setTerminationFormMode('edit')
    setEditingTermination(record)
    setShowTerminationForm(true)
  }

  const advanceTerminationStatus = (id: string) => {
    setNoticeTerminations((current) => current.map((record) => {
      if (record.id !== id) return record
      const currentIndex = allTerminationStages.indexOf(record.currentStage)
      if (currentIndex < 0 || currentIndex >= allTerminationStages.length - 1) return record
      return { ...record, currentStage: allTerminationStages[currentIndex + 1] }
    }))
  }

  const saveTerminationRecord = (record: EnhancedTerminationRecord) => {
    setNoticeTerminations((current) => {
      const exists = current.some((item) => item.id === record.id)
      return exists ? current.map((item) => item.id === record.id ? record : item) : [record, ...current]
    })
    setShowTerminationForm(false)
    setEditingTermination(null)
  }

  const deleteTermination = (id: string) => {
    setNoticeTerminations((current) => current.filter((record) => record.id !== id))
  }

  // Convert DD-MM-YYYY or DD/MM/YYYY → YYYY-MM-DD for storage; pass through if already ISO
  const parseImportDate = (raw: string) => {
    if (!raw) return ''
    const dmY = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(raw.trim())
    if (dmY) return `${dmY[3]}-${dmY[2].padStart(2,'0')}-${dmY[1].padStart(2,'0')}`
    return raw.trim() // already YYYY-MM-DD or blank
  }

  const exportCsv = () => {
    const headers = ['Emp ID', 'Full Name', 'Section', 'Department', 'Designation', 'Nationality', 'NIC/PP No', 'WP No', 'Date of Join', 'Mobile No', 'Date of Birth', 'Age', 'Site Status', 'Record Status']
    const rows = employees.map((e) => [e.employeeId, e.fullName, e.department, 'THILAFUSHI INDUSTRIAL COMPLEX', e.designation, e.nationality, e.nicPassportNo, e.nationality === 'MALDIVES' ? '' : e.workPermitNo, formatDateDisplay(e.dateOfJoin), e.mobileNo, e.dateOfBirth ? formatDateDisplay(e.dateOfBirth) : '', calculateAge(e.dateOfBirth), e.siteStatus, recordStatus(e)])
    downloadCsv('tic-employees.csv', [headers, ...rows])
  }

  const importCsv = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,text/csv'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const allRows = parseCsv(String(reader.result ?? ''))
        if (allRows.length < 2) return
        // Build column index map from the header row (case-insensitive)
        const hdr = allRows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
        const col = (terms: string[]) => terms.map((t) => hdr.indexOf(t)).find((i) => i >= 0) ?? -1
        const CI = {
          id:     col(['empid','employeeid']),
          name:   col(['fullname','name']),
          dept:   col(['section','department']),
          desig:  col(['designation']),
          nat:    col(['nationality']),
          nic:    col(['nicppno','nicpassportno','nic','passport']),
          wp:     col(['wpno','workpermitno','wp']),
          doj:    col(['dateofjoin','joiningdate','dateofjoining','join']),
          mobile: col(['mobileno','mobile','contact','phone']),
          dob:    col(['dateofbirth','dob','birth']),
          status: col(['sitestatus','status']),
        }
        const g = (row: string[], key: keyof typeof CI) => { const i = CI[key]; return i >= 0 ? (row[i] ?? '').trim() : '' }

        const dataRows = allRows.slice(1)
        let added = 0; let updated = 0; let skipped = 0
        setEmployees((current) => {
          const byId = new Map(current.map((e) => [e.employeeId, e]))
          const result = [...current]
          dataRows.forEach((row, index) => {
            if (row.every((c) => !c.trim())) { skipped++; return } // blank row
            const eid = g(row, 'id') || `PENDING-${String(current.length + index + 1).padStart(4, '0')}`
            const nat = (g(row, 'nat') || 'MALDIVES').toUpperCase()
            const siteRaw = g(row, 'status')
            const parsed: Employee = {
              employeeId: eid,
              fullName: g(row, 'name') || 'Imported Employee',
              department: g(row, 'dept') || departmentsList[0],
              designation: g(row, 'desig') || '',
              nationality: nat,
              nicPassportNo: g(row, 'nic'),
              workPermitNo: nat === 'MALDIVES' ? '' : g(row, 'wp'),
              dateOfJoin: parseImportDate(g(row, 'doj')) || new Date().toISOString().slice(0, 10),
              mobileNo: g(row, 'mobile'),
              dateOfBirth: parseImportDate(g(row, 'dob')),
              passportStatus: 'With Employee',
              siteStatus: siteRaw === 'On Leave' || siteRaw === 'Off Site' ? siteRaw as SiteStatus : 'On Site',
            }
            const existId = g(row, 'id')
            if (existId && byId.has(existId)) {
              const idx = result.findIndex((e) => e.employeeId === existId)
              if (idx >= 0) { result[idx] = { ...result[idx], ...parsed }; updated++ }
            } else {
              result.unshift(parsed); byId.set(eid, parsed); added++
            }
          })
          setImportResult({ added, updated, skipped })
          return result
        })
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const downloadTemplate = () => downloadCsv('tic-employee-template.csv', [
    ['Emp ID', 'Full Name', 'Section', 'Designation', 'Nationality', 'NIC/PP No', 'WP No', 'Date of Join', 'Mobile No', 'Date of Birth', 'Site Status'],
    ['TIC-0001', 'Example Name', 'ADMINISTRATION', 'Manager', 'MALDIVES', 'A123456', '', '01-01-2024', '+960 777 0000', '15-06-1990', 'On Site'],
  ])

  if (!isLoggedIn) return <LoginPage onLogin={login} />

  const openEditEmployee = (employee: Employee) => {
    setEmployeeMode('edit')
    setEmployeeForm(employee)
    setShowEmployeeForm(true)
    setActivePage('employees')
  }

  return (
    <div className={`app-shell${sidebarCollapsed ? ' sidebar-is-collapsed' : ''}`}>
      <aside className={`sidebar${sidebarCollapsed ? ' sidebar--collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-logo">TIC</span>
            {!sidebarCollapsed && <span className="sidebar-brand-text"><strong>HR Register</strong><small>Thilafushi Industrial Complex</small></span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {pages.map((page) => (
            <button
              className={`sidebar-item${activePage === page.id ? ' active' : ''}`}
              key={page.id}
              onClick={() => setActivePage(page.id)}
              type="button"
              title={sidebarCollapsed ? page.label : undefined}
            >
              <span className="sidebar-icon" dangerouslySetInnerHTML={{ __html: pageIcons[page.id] }} />
              {!sidebarCollapsed && <span className="sidebar-label">{page.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user" title={sidebarCollapsed ? 'admin' : undefined}>
            <div className="sidebar-user-avatar">A</div>
            {!sidebarCollapsed && <span className="sidebar-user-name">admin</span>}
          </div>
          <button className="sidebar-logout" onClick={logout} type="button" title={sidebarCollapsed ? 'Logout' : undefined}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="workspace">
        <div className="workspace-topbar">
          <button
            className="topbar-toggle-btn"
            onClick={() => setSidebarCollapsed((c) => !c)}
            type="button"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {/* outer panel rect */}
              <rect x="2" y="2" width="16" height="16" rx="3"/>
              {/* sidebar divider */}
              <line x1="7" y1="2" x2="7" y2="18"/>
              {/* arrow pointing toward divider (collapse) or away (expand) */}
              {sidebarCollapsed
                ? <polyline points="11,7.5 14.5,10 11,12.5"/>
                : <polyline points="13,7.5 9.5,10 13,12.5"/>
              }
            </svg>
          </button>
          <div className="topbar-divider" aria-hidden="true" />
          <span className="topbar-page-title">{pages.find((p) => p.id === activePage)?.label}</span>
        </div>
        <main className="workspace-inner" id="top">
          {activePage === 'overview' && <OverviewPage employees={employees} leaveRequests={leaveRequests} activeLeaves={activeLeaves} leaveHistory={leaveHistory} />}
          {activePage === 'employees' && <EmployeesPage employees={employees} onAdd={() => { setEmployeeMode('add'); setEmployeeForm(emptyEmployee); setShowEmployeeForm(true) }} onEdit={openEditEmployee} onExport={exportCsv} onImport={importCsv} onTemplate={downloadTemplate} onShowTasks={() => setShowPendingTasks(true)} />}
          {activePage === 'leave' && <LeavePage employees={employees} leaveRequests={leaveRequests} activeLeaves={activeLeaves} leaveHistory={leaveHistory} passportHandovers={passportHandovers} onAddRequest={() => { setEditingLeaveRequest(null); setShowLeaveForm(true) }} onAddPassport={() => setEditingPassportRecord({ id: `PP-${Date.now()}`, employeeId: employees[0]?.employeeId ?? '', name: employees[0]?.fullName ?? '', department: employees[0]?.department ?? departmentsList[0], nationality: employees[0]?.nationality ?? 'MALDIVES', leaveTypeCode: 'AL', departureDate: new Date().toISOString().slice(0, 10), returnDate: new Date().toISOString().slice(0, 10), days: 1, passportStep: 'Issued', givenDate: '', returnedDate: '', sentToHoDate: '', remarks: '' })} onEditRequest={(record) => { setEditingLeaveRequest(record); setShowLeaveForm(true) }} onDeleteRequest={deleteLeaveRequest} onAdvanceRequestStep={advanceLeaveRequestStep} onHistoryConfirm={updateHistoryConfirmation} onEditPassport={(record) => setEditingPassportRecord(record)} onDeletePassport={deletePassportRecord} />}
          {activePage === 'operations' && <OperationsPage employees={employees} />}
          {activePage === 'activities' && <ActivitiesPage employees={employees} />}
          {activePage === 'termination' && <TerminationPage noticeTerminations={noticeTerminations} completedTerminations={completedTerminations} onAdd={openAddTermination} onEdit={openEditTermination} onAdvanceStatus={advanceTerminationStatus} onDelete={deleteTermination} onViewDetails={(record) => setTerminationDetails(record)} />}
          {activePage === 'settings' && <SettingsPage employees={employees} leaveRequests={leaveRequests} activeLeaves={activeLeaves} onReset={resetAllData} />}
        </main>
      </div> {/* .workspace */}

      {showEmployeeForm && <EmployeeFormModal form={employeeForm} mode={employeeMode} onClose={() => setShowEmployeeForm(false)} onSave={saveEmployee} setForm={setEmployeeForm} />}
      {showPendingTasks && <PendingTasksModal employees={employees} onEdit={openEditEmployee} onClose={() => setShowPendingTasks(false)} />}
      {showLeaveForm && <LeaveFormModal employees={employees} initialRecord={editingLeaveRequest} onClose={() => { setShowLeaveForm(false); setEditingLeaveRequest(null) }} onSave={saveLeaveRequest} />}
      {editingPassportRecord && <PassportHandoverModal record={editingPassportRecord} employees={employees} onClose={() => setEditingPassportRecord(null)} onSave={savePassportRecord} />}
      {showTerminationForm && editingTermination && <TerminationFormModal mode={terminationFormMode} record={editingTermination} employees={employees} onClose={() => { setShowTerminationForm(false); setEditingTermination(null) }} onSave={saveTerminationRecord} />}
      {terminationDetails && <TerminationDetailsModal record={terminationDetails} onClose={() => setTerminationDetails(null)} />}

      {importResult && (
        <div className="import-toast-backdrop" role="presentation" onClick={() => setImportResult(null)}>
          <div className="import-toast" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="import-toast-icon">✓</div>
            <h3>Import Complete</h3>
            {importResult.added > 0 && <p><strong>{importResult.added}</strong> new employee{importResult.added !== 1 ? 's' : ''} added</p>}
            {importResult.updated > 0 && <p><strong>{importResult.updated}</strong> existing record{importResult.updated !== 1 ? 's' : ''} updated</p>}
            {importResult.skipped > 0 && <p><strong>{importResult.skipped}</strong> blank row{importResult.skipped !== 1 ? 's' : ''} skipped</p>}
            <button className="primary-button" onClick={() => setImportResult(null)} type="button">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

