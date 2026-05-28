import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'

type Page = 'overview' | 'employees' | 'leave' | 'operations' | 'activities' | 'termination' | 'settings'
type SiteStatus = 'On Site' | 'Off Site' | 'On Leave'
type RecordStatus = 'Pending' | 'Active'
type LeaveView = 'request' | 'active' | 'history' | 'medical'
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

type StaffStatus = 'Active' | 'Terminated' | 'Retired' | 'Transferred'

type PersonalFileRecord = {
  fileNo: string
  employeeId: string
  fullName: string
  department: string
  staffStatus: StaffStatus
  coc: boolean
  jd: boolean
  ea: boolean
  eaExpiryDate: string
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

type ActivitiesSection = 'requests' | 'visits' | 'incidents' | 'passport'

type MedicalCaseStatus = 'On Medical Leave' | 'Pending MC' | 'Medical Visit' | 'Completed'

type MedicalCaseRecord = {
  id: string
  caseDate: string
  employeeId: string
  pinNo: string
  name: string
  department: string
  reason: string
  hospital: string
  departTime: string
  returnTime: string
  doctorAdvice: string
  mcProvided: boolean
  sickLeaveFrom: string
  sickLeaveTo: string
  sickLeaveDays: number
  status: MedicalCaseStatus
  recordedBy: string
}

type RequestPriority = 'Low' | 'Medium' | 'High'

type StaffRequestRecord = {
  id: string
  employeeId: string
  employeeName: string
  department: string
  requestType: 'Accommodation' | 'Equipment' | 'Transfer' | 'Leave' | 'Documents' | 'Other'
  priority: RequestPriority
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
  nicPassportNo: string
  nationality: string
  visitType: 'Visa Medical' | 'Photo' | 'Passport Renewal' | 'Embassy Letter Collection' | 'Biometric Update'
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
  section: string
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
type TerminationTab = 'notice' | 'completed' | 'exit-interview'
type TerminationType = 'Resignation' | 'Dismissal' | 'Probation End' | 'Contract Expiry' | 'Absconded' | 'Other'
type SatisfactionRating = 1 | 2 | 3 | 4 | 5

type ExitInterviewRecord = {
  id: string
  employeeId: string
  name: string
  department: string
  nationality: string
  terminationType: TerminationType
  departureDate: string
  interviewDate: string
  management: SatisfactionRating
  workEnvironment: SatisfactionRating
  compensation: SatisfactionRating
  workLifeBalance: SatisfactionRating
  careerGrowth: SatisfactionRating
  communication: SatisfactionRating
  overall: SatisfactionRating
  wouldRecommend: boolean
  reasonForLeaving: string
  comments: string
}

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
const initialExitInterviews: ExitInterviewRecord[] = []
const initialMedicalCases: MedicalCaseRecord[] = []
const allTerminationStages: TerminationStage[] = ['Letter Submitted', 'Exit Interview', 'Ticket', 'Pending Departure']
const initialPersonalFiles: PersonalFileRecord[] = [
  { fileNo: '0001', employeeId: '25431', fullName: 'THILINA LAKSHAN PERERA', department: 'STORES', staffStatus: 'Terminated', coc: true, jd: true, ea: true, eaExpiryDate: '2022-12-31', remarks: 'Left company Dec 2022' },
  { fileNo: '0002', employeeId: '31672', fullName: 'MD RAFIQUL ISLAM', department: 'ADMINISTRATION', staffStatus: 'Terminated', coc: true, jd: true, ea: true, eaExpiryDate: '2023-06-30', remarks: 'Contract not renewed' },
  { fileNo: '0003', employeeId: '33856', fullName: 'KRISHNA PRASAD RIMAL', department: 'MECHANICAL', staffStatus: 'Terminated', coc: true, jd: false, ea: true, eaExpiryDate: '2024-01-15', remarks: 'Resigned' },
  { fileNo: '0004', employeeId: '35494', fullName: 'GAMARALALAGE AJITH WIJESIRI', department: 'ACCOUNTS AND FINANCE', staffStatus: 'Active', coc: true, jd: true, ea: true, eaExpiryDate: '2027-05-31', remarks: '' },
  { fileNo: '0005', employeeId: '37916', fullName: 'JAGO', department: 'STORES', staffStatus: 'Active', coc: true, jd: true, ea: true, eaExpiryDate: '2026-09-01', remarks: '' },
  { fileNo: '0006', employeeId: '43407', fullName: 'MOHAMMAD DELOWAR HOSSAIN', department: 'STORES', staffStatus: 'Active', coc: true, jd: true, ea: true, eaExpiryDate: '2026-08-01', remarks: '' },
  { fileNo: '0007', employeeId: '44386', fullName: 'MAJIB', department: 'STORES', staffStatus: 'Active', coc: true, jd: true, ea: true, eaExpiryDate: '2026-06-01', remarks: '' },
  { fileNo: '0008', employeeId: '50223', fullName: 'AYESHAN KUMARA WIJEYATHUNGA MUDALIGE', department: 'STORES', staffStatus: 'Active', coc: true, jd: true, ea: true, eaExpiryDate: '2027-04-10', remarks: '' },
  { fileNo: '0009', employeeId: '50427', fullName: 'MD SAIFUR RAHMAN', department: 'STORES', staffStatus: 'Active', coc: true, jd: true, ea: false, eaExpiryDate: '2027-06-01', remarks: 'EA renewal pending' },
  { fileNo: '0010', employeeId: '52804', fullName: 'AHMED IMRAN', department: 'ACCOUNTS AND FINANCE', staffStatus: 'Active', coc: true, jd: true, ea: true, eaExpiryDate: '2027-12-01', remarks: '' },
  { fileNo: '0011', employeeId: '53029', fullName: 'KUMARAN VAITHILINGAM', department: 'STORES', staffStatus: 'Active', coc: true, jd: true, ea: true, eaExpiryDate: '2026-01-20', remarks: '' },
  { fileNo: '0012', employeeId: '53979', fullName: 'NAVEEN SEKAR', department: 'STORES', staffStatus: 'Active', coc: true, jd: false, ea: true, eaExpiryDate: '2026-08-10', remarks: 'JD pending signature' },
  { fileNo: '0013', employeeId: '55427', fullName: 'SARAVANAN RAJENDRAN', department: 'STORES', staffStatus: 'Active', coc: true, jd: true, ea: true, eaExpiryDate: '2025-09-01', remarks: '' },
  { fileNo: '0014', employeeId: '56141', fullName: 'RAJU PERKA', department: 'CAFE', staffStatus: 'Active', coc: true, jd: true, ea: true, eaExpiryDate: '2026-04-01', remarks: '' },
  { fileNo: '0015', employeeId: '56530', fullName: 'PUBUDU MADURANGA ALAWATHTHA KANKANAMGE', department: 'ADMINISTRATION', staffStatus: 'Active', coc: true, jd: true, ea: true, eaExpiryDate: '2026-07-01', remarks: '' },
  { fileNo: '0016', employeeId: '56646', fullName: 'CHANDRASHEKHER PURELLA', department: 'ACCOUNTS AND FINANCE', staffStatus: 'Active', coc: true, jd: true, ea: true, eaExpiryDate: '2026-08-01', remarks: '' },
  { fileNo: '0017', employeeId: '57637', fullName: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', staffStatus: 'Active', coc: true, jd: true, ea: true, eaExpiryDate: '2027-02-10', remarks: '' },
  { fileNo: '0018', employeeId: '57803', fullName: 'INDIKA SAMPATH SAMARASINGHEGE', department: 'STORES', staffStatus: 'Active', coc: true, jd: false, ea: false, eaExpiryDate: '2027-05-20', remarks: 'JD and EA pending' },
  { fileNo: '0019', employeeId: '57935', fullName: 'ARUNODA KAVINDU NANAYAKKARA', department: 'ACCOUNTS AND FINANCE', staffStatus: 'Active', coc: true, jd: true, ea: false, eaExpiryDate: '2027-04-20', remarks: 'EA pending' },
  { fileNo: '0020', employeeId: '58034', fullName: 'SAMEERA MADUSANKA GUNARATHNA', department: 'STORES', staffStatus: 'Active', coc: true, jd: false, ea: false, eaExpiryDate: '2027-05-22', remarks: 'JD and EA pending' },
  { fileNo: '0021', employeeId: '58686', fullName: 'YASAR ARAFATH BASHEER AHAMED', department: 'STORES', staffStatus: 'Active', coc: false, jd: false, ea: false, eaExpiryDate: '2027-05-18', remarks: 'All documents pending' },
  { fileNo: '0022', employeeId: '58692', fullName: 'SHANTUMON PATHIYIL CHACKO', department: 'HUMAN RESOURCES', staffStatus: 'Active', coc: true, jd: true, ea: true, eaExpiryDate: '2027-10-15', remarks: '' },
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

function PassportTrackingSection({ records, employees, onUpdate }: {
  records: PassportHandoverRecord[]
  employees: Employee[]
  onUpdate: (fn: (prev: PassportHandoverRecord[]) => PassportHandoverRecord[]) => void
}) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [editing, setEditing] = useState<PassportHandoverRecord | null>(null)

  const empMap = useMemo(() => new Map(employees.map((e) => [e.employeeId, e])), [employees])
  const getNic = (id: string) => empMap.get(id)?.nicPassportNo ?? '—'

  const filtered = useMemo(() => records.filter((r) => {
    const text = [r.employeeId, r.name, r.department, r.nationality].join(' ').toLowerCase()
    return text.includes(search.trim().toLowerCase()) && (deptFilter === 'All Departments' || r.department === deptFilter)
  }).sort((a, b) => a.departureDate.localeCompare(b.departureDate)), [records, search, deptFilter])

  const save = (record: PassportHandoverRecord) => {
    onUpdate((prev) => {
      const exists = prev.some((r) => r.id === record.id)
      return exists ? prev.map((r) => r.id === record.id ? record : r) : [record, ...prev]
    })
    setEditing(null)
  }
  const del = (id: string) => onUpdate((prev) => prev.filter((r) => r.id !== id))

  const newRecord = (): PassportHandoverRecord => ({
    id: `PP-${Date.now()}`,
    employeeId: employees[0]?.employeeId ?? '',
    name: employees[0]?.fullName ?? '',
    department: employees[0]?.department ?? departmentsList[0],
    nationality: employees[0]?.nationality ?? 'MALDIVES',
    leaveTypeCode: 'AL',
    departureDate: new Date().toISOString().slice(0, 10),
    returnDate: new Date().toISOString().slice(0, 10),
    days: 1,
    passportStep: 'Issued',
    givenDate: '',
    returnedDate: '',
    sentToHoDate: '',
    remarks: '',
  })

  return (
    <section className="employee-workspace">
      <div className="table-toolbar leave-toolbar leave-toolbar-3 leave-toolbar-has-btn">
        <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Employee, ID" /></label>
        <label><span>Section</span><select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}><option>All Departments</option>{departmentsList.map((d) => <option key={d}>{d}</option>)}</select></label>
        <button className="primary-button toolbar-add-btn" onClick={() => setEditing(newRecord())} type="button">+ Add Passport</button>
      </div>
      <div className="employee-table-shell compact-scroll">
        <table className="data-table leave-table">
          <thead><tr><th>Emp ID</th><th>Name</th><th>Section</th><th>NIC / PP No</th><th>Leave Type</th><th>Status</th><th>Issued Date</th><th>Returned Date</th><th>Sent to HO</th><th>Remarks</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.employeeId}</td><td>{r.name}</td><td>{r.department}</td><td>{getNic(r.employeeId)}</td>
                <td>{r.leaveTypeCode}</td>
                <td className="passport-status-cell"><StatusBadge status={r.passportStep} /></td>
                <td>{r.givenDate ? formatDateDisplay(r.givenDate) : '—'}</td>
                <td>{r.returnedDate ? formatDateDisplay(r.returnedDate) : '—'}</td>
                <td>{r.sentToHoDate ? formatDateDisplay(r.sentToHoDate) : '—'}</td>
                <td>{r.remarks || '—'}</td>
                <td><div className="row-actions request-inline-actions">
                  <button className="action-glyph edit" onClick={() => setEditing(r)} type="button" title="Edit">✎</button>
                  <button className="action-glyph delete" onClick={() => del(r.id)} type="button" title="Delete">🗑</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="leave-empty-zone">No passport records yet. Click "+ Add Passport" to get started.</div>}
      {editing && <PassportHandoverModal record={editing} employees={employees} onClose={() => setEditing(null)} onSave={save} />}
    </section>
  )
}

function MedicalCaseModal({ record, employees, onClose, onSave }: {
  record: MedicalCaseRecord
  employees: Employee[]
  onClose: () => void
  onSave: (r: MedicalCaseRecord) => void
}) {
  const isNew = record.id.startsWith('MC-new')
  const [form, setForm] = useState<MedicalCaseRecord>(record)
  const setF = (f: Partial<MedicalCaseRecord>) => setForm((prev) => ({ ...prev, ...f }))

  const handleEmp = (empId: string) => {
    const emp = employees.find((e) => e.employeeId === empId)
    if (emp) setF({ employeeId: empId, name: emp.fullName, department: emp.department, pinNo: emp.employeeId })
  }

  useEffect(() => {
    if (form.sickLeaveFrom && form.sickLeaveTo && form.sickLeaveTo >= form.sickLeaveFrom) {
      const diff = Math.round((new Date(form.sickLeaveTo).getTime() - new Date(form.sickLeaveFrom).getTime()) / 86400000) + 1
      setForm((prev) => ({ ...prev, sickLeaveDays: diff }))
    }
  }, [form.sickLeaveFrom, form.sickLeaveTo])

  const save = (e: FormEvent) => {
    e.preventDefault()
    onSave({ ...form, id: isNew ? `MC-${Date.now()}` : form.id })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal wide-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div><p className="eyebrow">Medical Leave</p><h2>{isNew ? 'Add Medical Case' : `Edit — ${form.name}`}</h2></div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <form onSubmit={save}>
          <div className="trn-modal-card">
            <p className="trn-modal-card-title">Patient Details</p>
            <div className="form-grid">
              <label><span>Visit Date</span><input type="date" value={form.caseDate} onChange={(e) => setF({ caseDate: e.target.value })} required /></label>
              <label><span>Employee</span>
                <select value={form.employeeId} onChange={(e) => handleEmp(e.target.value)}>
                  <option value="">— Select employee —</option>
                  {employees.slice(0, 150).map((e) => <option key={e.employeeId} value={e.employeeId}>{e.fullName} ({e.employeeId})</option>)}
                </select>
              </label>
              <label><span>Pin No</span><input value={form.pinNo} onChange={(e) => setF({ pinNo: e.target.value })} placeholder="Pin number" /></label>
              <label><span>Department</span><select value={form.department} onChange={(e) => setF({ department: e.target.value })}><option value="">— Select —</option>{departmentsList.map((d) => <option key={d}>{d}</option>)}</select></label>
              <label className="full-field"><span>Reason for Visit</span><input value={form.reason} onChange={(e) => setF({ reason: e.target.value })} required placeholder="e.g. Fever, Body pain, Cough - Follow up" /></label>
            </div>
          </div>
          <div className="trn-modal-card">
            <p className="trn-modal-card-title">Clinic Details</p>
            <div className="form-grid">
              <label><span>Hospital / Clinic</span><input value={form.hospital} onChange={(e) => setF({ hospital: e.target.value })} placeholder="e.g. IGMH, ADK" /></label>
              <label><span>MC Provided</span>
                <select value={form.mcProvided ? 'yes' : 'no'} onChange={(e) => setF({ mcProvided: e.target.value === 'yes' })}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label><span>Depart Time</span><input type="time" value={form.departTime} onChange={(e) => setF({ departTime: e.target.value })} /></label>
              <label><span>Return Time</span><input type="time" value={form.returnTime} onChange={(e) => setF({ returnTime: e.target.value })} /></label>
              <label className="full-field"><span>Doctor Advice / Summary</span><textarea value={form.doctorAdvice} onChange={(e) => setF({ doctorAdvice: e.target.value })} rows={5} placeholder="Symptoms, diagnosis, medication provided, MC dates, follow-up notes..." style={{ resize: 'vertical' }} /></label>
            </div>
          </div>
          <div className="trn-modal-card">
            <p className="trn-modal-card-title">Sick Leave &amp; Status</p>
            <div className="form-grid">
              <label><span>Sick Leave From</span><input type="date" value={form.sickLeaveFrom} onChange={(e) => setF({ sickLeaveFrom: e.target.value })} /></label>
              <label><span>Sick Leave To</span><input type="date" value={form.sickLeaveTo} onChange={(e) => setF({ sickLeaveTo: e.target.value })} /></label>
              <label><span>Days</span><input type="number" value={form.sickLeaveDays} min={0} onChange={(e) => setF({ sickLeaveDays: parseInt(e.target.value) || 0 })} /></label>
              <label><span>Status</span>
                <select value={form.status} onChange={(e) => setF({ status: e.target.value as MedicalCaseStatus })}>
                  <option>On Medical Leave</option>
                  <option>Pending MC</option>
                  <option>Medical Visit</option>
                  <option>Completed</option>
                </select>
              </label>
              <label><span>Recorded By</span><input value={form.recordedBy} onChange={(e) => setF({ recordedBy: e.target.value })} placeholder="e.g. HR Admin" /></label>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="quiet-button light" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit">{isNew ? 'Add Case' : 'Save Changes'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function MedicalLeaveSection({ records, employees, onUpdate }: {
  records: MedicalCaseRecord[]
  employees: Employee[]
  onUpdate: (fn: (prev: MedicalCaseRecord[]) => MedicalCaseRecord[]) => void
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | MedicalCaseStatus>('All')
  const [mcFilter, setMcFilter] = useState<'All' | 'Yes' | 'No'>('All')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [monthFilter, setMonthFilter] = useState<'All' | string>('All')
  const [editing, setEditing] = useState<MedicalCaseRecord | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const months = useMemo(() => {
    const keys = Array.from(new Set(records.map((r) => monthKey(r.caseDate)).filter(Boolean)))
    return keys.sort().reverse()
  }, [records])

  const filtered = useMemo(() => records.filter((r) => {
    const text = [r.employeeId, r.pinNo, r.name, r.department, r.reason, r.hospital].join(' ').toLowerCase()
    const matchSearch = text.includes(search.trim().toLowerCase())
    const matchStatus = statusFilter === 'All' || r.status === statusFilter
    const matchMc = mcFilter === 'All' || (mcFilter === 'Yes' ? r.mcProvided : !r.mcProvided)
    const matchDept = deptFilter === 'All Departments' || r.department === deptFilter
    const matchMonth = monthFilter === 'All' || monthKey(r.caseDate) === monthFilter
    return matchSearch && matchStatus && matchMc && matchDept && matchMonth
  }).sort((a, b) => b.caseDate.localeCompare(a.caseDate)), [records, search, statusFilter, mcFilter, deptFilter, monthFilter])

  const onMedLeave = records.filter((r) => r.status === 'On Medical Leave').length
  const pendingMc = records.filter((r) => r.status === 'Pending MC').length
  const todayVisits = records.filter((r) => r.caseDate === today).length
  const returningToday = records.filter((r) => r.sickLeaveTo === today && r.status === 'On Medical Leave').length

  const monthlyData = useMemo(() => {
    const map = new Map<string, number>()
    records.forEach((r) => {
      if (r.caseDate) {
        const key = monthKey(r.caseDate)
        if (key) map.set(key, (map.get(key) ?? 0) + (r.sickLeaveDays || 1))
      }
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
  }, [records])
  const maxDays = Math.max(...monthlyData.map(([, d]) => d), 1)

  const newCase = (): MedicalCaseRecord => ({
    id: 'MC-new', caseDate: today, employeeId: '', pinNo: '', name: '', department: '',
    reason: '', hospital: '', departTime: '09:00', returnTime: '13:00',
    doctorAdvice: '', mcProvided: false, sickLeaveFrom: today, sickLeaveTo: today,
    sickLeaveDays: 1, status: 'On Medical Leave', recordedBy: '',
  })

  const save = (r: MedicalCaseRecord) => {
    onUpdate((prev) => {
      const exists = prev.some((x) => x.id === r.id)
      return exists ? prev.map((x) => x.id === r.id ? r : x) : [r, ...prev]
    })
    setEditing(null)
  }
  const del = (id: string) => onUpdate((prev) => prev.filter((r) => r.id !== id))

  const mcStatusStyle = (s: MedicalCaseStatus): { background: string; color: string } => {
    if (s === 'On Medical Leave') return { background: '#dcfce7', color: '#166534' }
    if (s === 'Pending MC') return { background: '#fef9c3', color: '#854d0e' }
    if (s === 'Medical Visit') return { background: '#dbeafe', color: '#1e40af' }
    return { background: '#f1f5f9', color: '#475569' }
  }

  return (
    <>
      {/* KPI stat cards */}
      <div className="mc-stat-row">
        <div className="mc-stat mc-stat-blue"><div className="mc-stat-value">{onMedLeave}</div><div className="mc-stat-label">On Medical Leave</div></div>
        <div className="mc-stat mc-stat-amber"><div className="mc-stat-value">{pendingMc}</div><div className="mc-stat-label">Pending MC</div></div>
        <div className="mc-stat mc-stat-purple"><div className="mc-stat-value">{todayVisits}</div><div className="mc-stat-label">Today's Visits</div></div>
        <div className="mc-stat mc-stat-green"><div className="mc-stat-value">{returningToday}</div><div className="mc-stat-label">Returning Today</div></div>
      </div>

      {/* Monthly sick-leave chart */}
      {monthlyData.length > 0 && (
        <div className="mc-chart-panel">
          <p className="mc-chart-title">Monthly Sick Leave Days</p>
          <div className="mc-chart-bars">
            {monthlyData.map(([key, days]) => (
              <div className="mc-chart-col" key={key}>
                <div className="mc-chart-bar-wrap">
                  <span className="mc-chart-bar" style={{ height: `${Math.round((days / maxDays) * 100)}%` }} />
                </div>
                <div className="mc-chart-val">{days}d</div>
                <div className="mc-chart-lbl">{formatMonthLabel(key).slice(0, 3)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters + Add */}
      <div className="table-toolbar mc-toolbar leave-toolbar-has-btn">
        <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, ID, reason, hospital" /></label>
        <label><span>Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'All' | MedicalCaseStatus)}>
            <option value="All">All Statuses</option>
            <option>On Medical Leave</option><option>Pending MC</option>
            <option>Medical Visit</option><option>Completed</option>
          </select>
        </label>
        <label><span>MC Provided</span>
          <select value={mcFilter} onChange={(e) => setMcFilter(e.target.value as 'All' | 'Yes' | 'No')}>
            <option value="All">All</option><option>Yes</option><option>No</option>
          </select>
        </label>
        <label><span>Department</span>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option>All Departments</option>
            {departmentsList.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label><span>Month</span>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="All">All Months</option>
            {months.map((key) => <option key={key} value={key}>{formatMonthLabel(key)}</option>)}
          </select>
        </label>
        <button className="primary-button toolbar-add-btn" onClick={() => setEditing(newCase())} type="button">+ Add Medical Case</button>
      </div>

      {/* Expandable table */}
      <div className="employee-table-shell compact-scroll">
        <table className="data-table mc-table">
          <thead>
            <tr>
              <th className="mc-expand-th" />
              <th>Date</th><th>Pin No</th><th>Name</th><th>Department</th>
              <th>Reason</th><th>Hosp</th><th>Depart</th><th>Return</th>
              <th>MC</th><th>SL From</th><th>SL To</th><th>Days</th>
              <th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const isExp = expandedId === r.id
              return (
                <Fragment key={r.id}>
                  <tr className={`mc-row${isExp ? ' mc-row-open' : ''}`} onClick={() => setExpandedId(isExp ? null : r.id)}>
                    <td className="mc-expand-cell"><span className={`mc-arrow${isExp ? ' mc-arrow-open' : ''}`}>›</span></td>
                    <td>{formatDateDisplay(r.caseDate)}</td>
                    <td>{r.pinNo || r.employeeId}</td>
                    <td className="mc-name-cell">{r.name}</td>
                    <td>{r.department}</td>
                    <td className="mc-reason-cell">{r.reason}</td>
                    <td>{r.hospital}</td>
                    <td>{r.departTime}</td>
                    <td>{r.returnTime}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <span className={`mc-bool-badge${r.mcProvided ? ' mc-yes' : ' mc-no'}`}>{r.mcProvided ? 'Yes' : 'No'}</span>
                    </td>
                    <td>{r.sickLeaveFrom ? formatDateDisplay(r.sickLeaveFrom) : '—'}</td>
                    <td>{r.sickLeaveTo ? formatDateDisplay(r.sickLeaveTo) : '—'}</td>
                    <td>{r.sickLeaveDays || '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <span className="mc-status-pill" style={mcStatusStyle(r.status)}>{r.status}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="row-actions request-inline-actions">
                        <button className="action-glyph edit" onClick={() => setEditing(r)} type="button" title="Edit">✎</button>
                        <button className="action-glyph delete" onClick={() => del(r.id)} type="button" title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                  {isExp && (
                    <tr className="mc-detail-row">
                      <td colSpan={15}>
                        <div className="mc-detail-content">
                          <strong className="mc-detail-heading">Doctor Advice / Summary</strong>
                          <div className="mc-detail-body">
                            {r.doctorAdvice
                              ? r.doctorAdvice.split('\n').map((line, i) => <p key={i}>{line}</p>)
                              : <em style={{ color: '#94a3b8' }}>No doctor advice recorded.</em>}
                          </div>
                          {r.recordedBy && <div className="mc-detail-meta">Recorded by: <strong>{r.recordedBy}</strong></div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="leave-empty-zone">No medical cases match the current filters.</div>
      )}

      {editing && <MedicalCaseModal record={editing} employees={employees} onClose={() => setEditing(null)} onSave={save} />}
    </>
  )
}

function LeavePage({
  employees,
  leaveRequests,
  activeLeaves,
  leaveHistory,
  medicalCases,
  onAddRequest,
  onEditRequest,
  onDeleteRequest,
  onAdvanceRequestStep,
  onHistoryConfirm,
  onUpdateMedical,
}: {
  employees: Employee[]
  leaveRequests: LeaveRequestRecord[]
  activeLeaves: ActiveLeaveRecord[]
  leaveHistory: LeaveHistoryRecord[]
  medicalCases: MedicalCaseRecord[]
  onAddRequest: () => void
  onEditRequest: (record: LeaveRequestRecord) => void
  onDeleteRequest: (id: string) => void
  onAdvanceRequestStep: (id: string) => void
  onHistoryConfirm: (id: string, confirmation: HistoryConfirmation) => void
  onUpdateMedical: (fn: (prev: MedicalCaseRecord[]) => MedicalCaseRecord[]) => void
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

  const currentCount = activeLeaveView === 'request' ? requestRows.length : activeLeaveView === 'active' ? activeRows.length : historyRows.length

  return (
    <>
      <PageHeader eyebrow="Leave management" title="Leave tracker" subtitle="Leave requests, active leaves, history and medical leave tracking." />
      <section className="employee-workspace leave-workspace">
        <div className="leave-section-tabs">
          {[
            ['request', 'LEAVE REQUEST'],
            ['active', 'ACTIVE LEAVES'],
            ['history', 'LEAVE HISTORY'],
            ['medical', 'MEDICAL LEAVE'],
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

        {activeLeaveView === 'medical' && (
          <MedicalLeaveSection records={medicalCases} employees={employees} onUpdate={onUpdateMedical} />
        )}

        {activeLeaveView !== 'medical' && (
          <div className="leave-empty-zone">
            {currentCount === 0 ? 'No records yet. Details will appear here when entries are added.' : `Showing ${currentCount} record${currentCount > 1 ? 's' : ''}.`}
          </div>
        )}
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

  const [refNo] = useState(record.refNo)
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
            <input value={refNo} readOnly className="ind-ref-readonly" title="Auto-generated — cannot be changed" />
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

            {/* ── Branded header ── */}
            <div className="ind-prev-doc-hdr">
              <div>
                <div className="ind-prev-brand">VHPL</div>
                <div className="ind-prev-co">Thilafushi Industrial Complex Pvt. Ltd.</div>
              </div>
              <div className="ind-prev-hdr-right">
                <div className="ind-prev-dept-lbl">Human Resources</div>
                <div className="ind-prev-doc-title">STAFF INDUCTION</div>
              </div>
            </div>
            <div className="ind-prev-hdr-accent"></div>

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
                  <div className="ind-prev-sig-role">Conducted By</div>
                  <div className="ind-prev-sig-name">{conductedByDisplay}</div>
                  {conductedByDesig && <div className="ind-prev-sig-desig">{conductedByDesig}</div>}
                </div>
              </div>
              <div className="ind-prev-sig-block">
                <div className="ind-prev-sig-space"></div>
                <div className="ind-prev-sig-btm">
                  <div className="ind-prev-sig-role">Approved By</div>
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
                <td style={{ textTransform: 'uppercase' }}>{p.department || '—'}</td>
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
    @page { size: A4 portrait; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1a1a2e; background: #e8e4f3; margin: 0; padding: 0; }

    /* ── Screen toolbar ── */
    .screen-bar {
      display: flex; align-items: center; gap: 14px;
      padding: 10px 20px; background: #1e1b4b; position: sticky; top: 0; z-index: 10;
      font-family: system-ui, -apple-system, sans-serif; font-size: 13px;
    }
    .screen-bar button {
      padding: 7px 20px; background: #6d28d9; color: #fff; border: none;
      border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 0.03em;
    }
    .screen-bar button:hover { background: #5b21b6; }
    .screen-bar .ref-label { font-weight: 700; color: #ddd6fe; font-size: 13px; }
    .screen-bar .meta-label { color: rgba(221,214,254,0.7); font-size: 12px; }

    /* ── A4 page shells ── */
    .a4-wrap { max-width: 210mm; margin: 24px auto; display: flex; flex-direction: column; gap: 20px; padding-bottom: 40px; }
    .a4-page { background: #fff; box-shadow: 0 4px 20px rgba(30,27,75,0.16); min-height: 297mm; overflow: hidden; display: flex; flex-direction: column; }

    /* ══ HEADER BANNER ══ */
    .doc-hdr {
      background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%);
      padding: 14pt 20pt 12pt;
      display: flex; justify-content: space-between; align-items: center;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .hdr-brand { font-size: 26pt; font-weight: 900; color: #fff; letter-spacing: 5px; line-height: 1; font-family: Arial, sans-serif; }
    .hdr-co { font-size: 7.5pt; color: #e0d9ff; letter-spacing: 0.4px; margin-top: 3pt; }
    .hdr-right { text-align: right; }
    .hdr-dept-lbl { font-size: 7pt; color: #c7d2fe; letter-spacing: 2px; text-transform: uppercase; }
    .hdr-doc-title { font-size: 15pt; font-weight: 900; color: #fff; letter-spacing: 1.5px; margin-top: 2pt; font-family: Arial, sans-serif; }
    .hdr-accent {
      height: 3pt;
      background: linear-gradient(90deg, #a5b4fc, #c4b5fd, #a5b4fc);
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }

    /* ══ PAGE BODY ══ */
    .page-body { padding: 14pt 20pt 18pt; flex: 1; }

    /* ── Info table ── */
    .info-tbl { width: 100%; border-collapse: collapse; margin-bottom: 14pt; }
    .info-tbl td { padding: 5.5pt 9pt; font-size: 9.5pt; border: 0.75pt solid #c4b5fd; vertical-align: middle; }
    .info-tbl .lbl {
      font-weight: 700; background: #ede9fe; color: #4338ca;
      width: 110pt; white-space: nowrap;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .status-badge {
      display: inline-block; background: #dcfce7; color: #166534;
      padding: 1.5pt 8pt; border-radius: 12pt; font-weight: 700; font-size: 8.5pt;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }

    /* ── Section heading bar ── */
    .sec-hdr {
      background: #8b5cf6; color: #fff;
      padding: 5pt 10pt; font-size: 8.5pt; font-weight: 700;
      text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }

    /* ── Participants table ── */
    table.p-tbl { width: 100%; border-collapse: collapse; margin-bottom: 14pt; font-size: 9pt; table-layout: fixed; }
    .p-tbl thead th {
      background: #6366f1; color: #fff;
      padding: 5pt 5pt; text-align: left; font-weight: 700;
      border: 0.75pt solid #6366f1;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .p-tbl thead th.tc { text-align: center; }
    .p-tbl tbody td { border: 0.75pt solid #e2d9f3; padding: 4pt 5pt; vertical-align: middle; }
    .p-tbl tbody tr:nth-child(even) td { background: #f8f6ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .p-tbl .tc { text-align: center; }
    .p-tbl .sig-cell { height: 20pt; }

    /* ── Signature blocks ── */
    .sig-row { display: flex; gap: 14pt; margin-top: 16pt; }
    .sig-block { flex: 1; border: 0.75pt solid #c4b5fd; border-top: 2pt solid #8b5cf6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sig-space { height: 52pt; }
    .sig-info { padding: 5pt 9pt; border-top: 0.75pt solid #c4b5fd; background: #f8f6ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sig-role { font-size: 7.5pt; color: #8b5cf6; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2pt; }
    .sig-person { font-weight: 700; font-size: 9.5pt; color: #1e1b4b; text-transform: uppercase; }
    .sig-desig { font-size: 8.5pt; color: #6d28d9; margin-top: 1pt; }

    /* ══ PAGE 2 ══ */
    .p2-meta-bar {
      display: flex; gap: 24pt;
      background: #f5f3ff; border-left: 3pt solid #8b5cf6;
      padding: 6pt 10pt; margin-bottom: 13pt; font-size: 9.5pt;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .summary-hdg {
      font-size: 10.5pt; font-weight: 700; color: #4338ca;
      border-bottom: 2pt solid #8b5cf6; padding-bottom: 5pt; margin-bottom: 11pt;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .content-text { font-size: 10pt; line-height: 1.75; color: #1a1a2e; }
    .content-text p { margin: 0 0 8pt; }
    .remarks-box {
      margin-top: 14pt; padding: 7pt 11pt;
      border-left: 3pt solid #8b5cf6; background: #faf5ff; font-size: 9.5pt;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }

    /* ── Print overrides ── */
    @media print {
      body { background: white; }
      .screen-bar { display: none !important; }
      .a4-wrap { max-width: none; margin: 0; padding: 0; gap: 0; }
      .a4-page { box-shadow: none; min-height: unset; }
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

  <!-- ══ PAGE 1 ══ -->
  <div class="a4-page">
    <div class="doc-hdr">
      <div>
        <div class="hdr-brand">VHPL</div>
        <div class="hdr-co">Thilafushi Industrial Complex Pvt. Ltd. &nbsp;·&nbsp; Maldives</div>
      </div>
      <div class="hdr-right">
        <div class="hdr-dept-lbl">Human Resources</div>
        <div class="hdr-doc-title">STAFF INDUCTION</div>
      </div>
    </div>
    <div class="hdr-accent"></div>
    <div class="page-body">

      <table class="info-tbl">
        <tbody>
          <tr>
            <td class="lbl">Reference No.</td>
            <td>${esc(fullRef)}</td>
            <td class="lbl">Status</td>
            <td><span class="status-badge">${esc(record.status)}</span></td>
          </tr>
          <tr>
            <td class="lbl">Date</td>
            <td>${dateStr}</td>
            <td class="lbl">No. of Participants</td>
            <td>${countStr}</td>
          </tr>
          <tr>
            <td class="lbl">Department</td>
            <td colspan="3" style="text-transform:uppercase">Thilafushi Industrial Complex</td>
          </tr>
          <tr>
            <td class="lbl">Conducted By</td>
            <td colspan="3">${esc(conductedByDisplay)}</td>
          </tr>
        </tbody>
      </table>

      <div class="sec-hdr">Participants</div>
      <table class="p-tbl">
        <thead>
          <tr>
            <th style="width:20pt" class="tc">#</th>
            <th style="width:50pt">Emp ID</th>
            <th>Full Name</th>
            <th style="width:78pt">NIC / Passport</th>
            <th style="width:66pt">Section</th>
            <th style="width:100pt">Department</th>
            <th style="width:58pt">Signature</th>
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
            <div class="sig-role">Conducted By</div>
            <div class="sig-person">${esc(conductedByDisplay)}</div>
            ${conductedByDesig ? `<div class="sig-desig">${esc(conductedByDesig)}</div>` : ''}
          </div>
        </div>
        <div class="sig-block">
          <div class="sig-space"></div>
          <div class="sig-info">
            <div class="sig-role">Approved By</div>
            <div class="sig-person">Arushulla Rashid (50814)</div>
            <div class="sig-desig">Administrator</div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- ══ PAGE 2 ══ -->
  <div class="a4-page page-break">
    <div class="doc-hdr">
      <div>
        <div class="hdr-brand">VHPL</div>
        <div class="hdr-co">Thilafushi Industrial Complex Pvt. Ltd. &nbsp;·&nbsp; Maldives</div>
      </div>
      <div class="hdr-right">
        <div class="hdr-dept-lbl">Human Resources</div>
        <div class="hdr-doc-title">STAFF INDUCTION</div>
      </div>
    </div>
    <div class="hdr-accent"></div>
    <div class="page-body">

      <div class="p2-meta-bar">
        <span><strong>Ref No:</strong>&nbsp;${esc(fullRef)}</span>
        <span><strong>Date:</strong>&nbsp;${dateStr}</span>
      </div>

      <div class="summary-hdg">Summary</div>
      <div class="content-text">${contentHtml}</div>

      ${record.remarks ? `<div class="remarks-box"><strong>Remarks:</strong>&nbsp; ${esc(record.remarks)}</div>` : ''}

    </div>
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

  const blankRow = (): TrainingParticipant => ({ employeeId: '', name: '', department: '', attended: true })
  const [participants, setParticipants] = useState<TrainingParticipant[]>(
    record.participants.length > 0 ? record.participants : [blankRow()]
  )

  const updateRow = (index: number, field: keyof TrainingParticipant, value: string) => {
    setParticipants((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const handleEmpIdBlur = (index: number, value: string) => {
    const emp = employees.find((e) => e.employeeId === value.trim())
    if (emp) {
      setParticipants((prev) => prev.map((p, i) =>
        i === index ? { ...p, employeeId: emp.employeeId, name: emp.fullName, department: emp.department } : p
      ))
    }
  }

  const addRow = () => setParticipants((prev) => [...prev, blankRow()])

  const removeRow = (index: number) => {
    setParticipants((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.length > 0 ? next : [blankRow()]
    })
  }

  const save = () => {
    const clean = participants.filter((p) => p.name.trim() || p.employeeId.trim())
    onSave({ ...record, trainingTitle, date, conductedBy, trainingType, participants: clean, status: 'Completed', remarks: '' })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal wide-modal induction-modal-shell" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Training Record</p>
            <h2>{isNew ? 'Add Training Record' : 'Edit Training Record'}</h2>
            <p className="ind-modal-sub">Saved as <strong>Completed</strong></p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        {/* ── Session details — reuse induction form grid style ── */}
        <div className="ind-form-grid">
          <label className="ind-span-2">
            <span>Training Title</span>
            <input
              value={trainingTitle}
              onChange={(e) => setTrainingTitle(e.target.value)}
              placeholder="e.g. Fire Safety & Emergency Procedures"
            />
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
          <label className="ind-span-2">
            <span>Conducted By / Trainer</span>
            <input value={conductedBy} onChange={(e) => setConductedBy(e.target.value)} placeholder="Trainer name or organisation" />
          </label>
        </div>

        {/* ── Participants — row-based like induction ── */}
        <div className="ind-participants-section">
          <div className="ind-participants-header">
            <h3 className="ind-participants-title">
              Participants
              <span className="ind-participants-count">{participants.filter((p) => p.name.trim() || p.employeeId.trim()).length}</span>
            </h3>
            <p className="ind-participants-hint">Enter Emp ID and press Tab — name &amp; section auto-fill if found in records</p>
            <button className="ind-add-row-btn" onClick={addRow} type="button">+ Add Row</button>
          </div>
          <div className="ind-table-scroll">
            <table className="data-table ind-edit-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}>#</th>
                  <th style={{ width: 80 }}>Emp ID</th>
                  <th>Full Name</th>
                  <th style={{ width: 180 }}>Section / Department</th>
                  <th style={{ width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, i) => (
                  <tr key={i}>
                    <td className="ind-row-num">{i + 1}</td>
                    <td>
                      <input
                        className="cell-input"
                        value={p.employeeId}
                        onChange={(e) => updateRow(i, 'employeeId', e.target.value)}
                        onBlur={(e) => handleEmpIdBlur(i, e.target.value)}
                        placeholder="ID"
                      />
                    </td>
                    <td>
                      <input
                        className="cell-input cell-input-name"
                        value={p.name}
                        onChange={(e) => updateRow(i, 'name', e.target.value)}
                        placeholder="Full name"
                      />
                    </td>
                    <td>
                      <input
                        className="cell-input"
                        value={p.department}
                        onChange={(e) => updateRow(i, 'department', e.target.value)}
                        placeholder="Section"
                      />
                    </td>
                    <td>
                      <button className="ind-remove-row-btn" onClick={() => removeRow(i)} type="button" title="Remove row" aria-label="Remove row">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-actions">
          <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
          <button className="primary-button" onClick={save} type="button">{isNew ? 'Save Record' : 'Save Changes'}</button>
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

  const typeBadgeBg = record.trainingType === 'External' ? '#dbeafe' : '#dcfce7'
  const typeBadgeColor = record.trainingType === 'External' ? '#1e40af' : '#166534'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Training — ${esc(record.trainingTitle)}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1a1a2e; background: #e8e4f3; margin: 0; padding: 0; }

    /* ── Screen toolbar ── */
    .screen-bar {
      display: flex; align-items: center; gap: 14px;
      padding: 10px 20px; background: #1e1b4b; position: sticky; top: 0; z-index: 10;
      font-family: system-ui, sans-serif; font-size: 13px;
    }
    .screen-bar button { padding: 7px 20px; background: #6d28d9; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .screen-bar button:hover { background: #5b21b6; }
    .screen-bar .ref-label { font-weight: 700; color: #ddd6fe; }
    .screen-bar .meta-label { color: rgba(221,214,254,0.7); font-size: 12px; }

    /* ── A4 shell ── */
    .a4-wrap { max-width: 210mm; margin: 24px auto; padding-bottom: 40px; }
    .a4-page { background: #fff; box-shadow: 0 4px 20px rgba(30,27,75,0.16); min-height: 297mm; overflow: hidden; display: flex; flex-direction: column; }

    /* ══ HEADER BANNER ══ */
    .doc-hdr {
      background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%);
      padding: 14pt 20pt 12pt;
      display: flex; justify-content: space-between; align-items: center;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .hdr-brand { font-size: 26pt; font-weight: 900; color: #fff; letter-spacing: 5px; line-height: 1; }
    .hdr-co { font-size: 7.5pt; color: #e0d9ff; letter-spacing: 0.4px; margin-top: 3pt; }
    .hdr-right { text-align: right; max-width: 58%; }
    .hdr-dept-lbl { font-size: 7pt; color: #c7d2fe; letter-spacing: 2px; text-transform: uppercase; }
    .hdr-doc-title { font-size: 14pt; font-weight: 900; color: #fff; letter-spacing: 0.5px; margin-top: 2pt; word-break: break-word; line-height: 1.25; }
    .hdr-accent {
      height: 3pt;
      background: linear-gradient(90deg, #818cf8, #a78bfa, #818cf8);
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }

    /* ── Page body ── */
    .page-body { padding: 14pt 20pt 18pt; flex: 1; }

    /* ── Info table ── */
    .info-tbl { width: 100%; border-collapse: collapse; margin-bottom: 14pt; }
    .info-tbl td { padding: 5.5pt 9pt; font-size: 9.5pt; border: 0.75pt solid #c4b5fd; vertical-align: middle; }
    .info-tbl .lbl {
      font-weight: 700; background: #ede9fe; color: #4338ca;
      width: 110pt; white-space: nowrap;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .type-badge {
      display: inline-block; padding: 1.5pt 8pt; border-radius: 12pt; font-weight: 700; font-size: 8.5pt;
      background: ${typeBadgeBg}; color: ${typeBadgeColor};
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .count-badge {
      display: inline-block; background: #ede9fe; color: #4c1d95;
      padding: 1.5pt 8pt; border-radius: 12pt; font-weight: 700; font-size: 8.5pt;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }

    /* ── Section heading bar ── */
    .sec-hdr {
      background: #8b5cf6; color: #fff;
      padding: 5pt 10pt; font-size: 8.5pt; font-weight: 700;
      text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }

    /* ── Participants table ── */
    table.p-tbl { width: 100%; border-collapse: collapse; font-size: 9pt; table-layout: fixed; }
    .p-tbl thead th {
      background: #6366f1; color: #fff;
      padding: 5pt 5pt; text-align: left; font-weight: 700;
      border: 0.75pt solid #6366f1;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .p-tbl thead th.tc { text-align: center; }
    .p-tbl tbody td { border: 0.75pt solid #e2d9f3; padding: 4pt 5pt; vertical-align: middle; }
    .p-tbl tbody tr:nth-child(even) td { background: #f8f6ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .p-tbl .tc { text-align: center; }
    .p-tbl .sig-cell { height: 20pt; }

    /* ── Print overrides ── */
    @media print {
      body { background: white; }
      .screen-bar { display: none !important; }
      .a4-wrap { max-width: none; margin: 0; padding: 0; }
      .a4-page { box-shadow: none; min-height: unset; }
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
    <div class="doc-hdr">
      <div>
        <div class="hdr-brand">VHPL</div>
        <div class="hdr-co">Thilafushi Industrial Complex Pvt. Ltd. &nbsp;·&nbsp; Maldives</div>
      </div>
      <div class="hdr-right">
        <div class="hdr-dept-lbl">Training Record</div>
        <div class="hdr-doc-title">${esc(record.trainingTitle)}</div>
      </div>
    </div>
    <div class="hdr-accent"></div>
    <div class="page-body">

      <table class="info-tbl">
        <tbody>
          <tr>
            <td class="lbl">Date</td>
            <td>${dateStr}</td>
            <td class="lbl">Training Type</td>
            <td><span class="type-badge">${esc(record.trainingType)}</span></td>
          </tr>
          <tr>
            <td class="lbl">Conducted By</td>
            <td colspan="3">${esc(record.conductedBy || '—')}</td>
          </tr>
          <tr>
            <td class="lbl">No. of Participants</td>
            <td colspan="3"><span class="count-badge">${record.participants.length} attended</span></td>
          </tr>
        </tbody>
      </table>

      <div class="sec-hdr">Participants</div>
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

function PersonalFileModal({ file, onClose, onSave }: {
  file: PersonalFileRecord
  onClose: () => void
  onSave: (file: PersonalFileRecord) => void
}) {
  const [coc, setCoc] = useState(file.coc)
  const [jd, setJd] = useState(file.jd)
  const [ea, setEa] = useState(file.ea)
  const [eaExpiryDate, setEaExpiryDate] = useState(file.eaExpiryDate)
  const [remarks, setRemarks] = useState(file.remarks)
  const [markInactive, setMarkInactive] = useState(file.staffStatus !== 'Active')
  const [inactiveReason, setInactiveReason] = useState<'Terminated' | 'Retired' | 'Transferred'>(
    file.staffStatus !== 'Active' ? (file.staffStatus as 'Terminated' | 'Retired' | 'Transferred') : 'Terminated'
  )

  const effectiveStatus: StaffStatus = markInactive ? inactiveReason : 'Active'

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Personal Files</p>
            <h2>{file.fullName}</h2>
            <p className="pf-modal-meta">{file.fileNo} &nbsp;·&nbsp; {file.employeeId} &nbsp;·&nbsp; {file.department}</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        {/* Document checklist */}
        <div className="pf-modal-section-hdr">Documents on File</div>
        <div className="file-check-grid">
          <label className="check-field"><input type="checkbox" checked={coc} onChange={(e) => setCoc(e.target.checked)} /><span>COC – Code of Conduct</span></label>
          <label className="check-field"><input type="checkbox" checked={jd} onChange={(e) => setJd(e.target.checked)} /><span>JD – Job Description</span></label>
          <label className="check-field"><input type="checkbox" checked={ea} onChange={(e) => setEa(e.target.checked)} /><span>EA – Employment Agreement</span></label>
        </div>

        {/* EA Expiry + Remarks */}
        <div className="form-grid pf-modal-bottom-row">
          <label>
            <span>EA Expiry Date</span>
            <input type="date" value={eaExpiryDate} onChange={(e) => setEaExpiryDate(e.target.value)} />
          </label>
          <label className="full-field">
            <span>Remarks</span>
            <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any notes about this file" />
          </label>
        </div>

        {/* Mark as Inactive toggle */}
        <div className="pf-inactive-toggle-row">
          <label className="pf-inactive-toggle-label">
            <input
              type="checkbox"
              checked={markInactive}
              onChange={(e) => setMarkInactive(e.target.checked)}
            />
            <span className="pf-inactive-toggle-text">Mark as Inactive</span>
          </label>
          {markInactive && (
            <label className="pf-inactive-reason-label">
              <span>Reason</span>
              <select value={inactiveReason} onChange={(e) => setInactiveReason(e.target.value as typeof inactiveReason)}>
                <option value="Terminated">Terminated</option>
                <option value="Retired">Retired</option>
                <option value="Transferred">Transferred</option>
              </select>
            </label>
          )}
        </div>

        <div className="modal-actions">
          <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
          <button className="primary-button" onClick={() => onSave({ ...file, staffStatus: effectiveStatus, coc, jd, ea, eaExpiryDate, remarks })} type="button">Save</button>
        </div>
      </section>
    </div>
  )
}

function StaffStatusBadge({ status }: { status: StaffStatus }) {
  return <span className={`pf-status-badge pf-status-${status.toLowerCase()}`}>{status}</span>
}

function PersonalFilesSection({ records, onUpdate }: {
  records: PersonalFileRecord[]
  onUpdate: (fn: (prev: PersonalFileRecord[]) => PersonalFileRecord[]) => void
  onBack?: () => void
}) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All Sections')
  const [staffFilter, setStaffFilter] = useState<'Active' | 'Inactive' | 'All'>('Active')
  const [editingFileNo, setEditingFileNo] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<50 | 100 | 'All'>(50)

  const filtered = useMemo(() => records.filter((r) => {
    const matchSearch = [r.fileNo, r.employeeId, r.fullName, r.department].join(' ').toLowerCase().includes(search.trim().toLowerCase())
    const matchDept = deptFilter === 'All Sections' || r.department === deptFilter
    const matchStaff = staffFilter === 'All'
      || (staffFilter === 'Active' && r.staffStatus === 'Active')
      || (staffFilter === 'Inactive' && r.staffStatus !== 'Active')
    return matchSearch && matchDept && matchStaff
  }), [records, search, deptFilter, staffFilter])

  const totalPages = pageSize === 'All' ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const rows = pageSize === 'All' ? filtered : filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const editingFile = editingFileNo ? (records.find((r) => r.fileNo === editingFileNo) ?? null) : null

  const saveFile = (file: PersonalFileRecord) => {
    onUpdate((prev) => {
      const exists = prev.some((r) => r.fileNo === file.fileNo)
      return exists ? prev.map((r) => r.fileNo === file.fileNo ? file : r) : [file, ...prev]
    })
    setEditingFileNo(null)
  }

  const rowClass = (s: StaffStatus) => {
    if (s === 'Terminated') return 'pf-row-terminated'
    if (s === 'Retired') return 'pf-row-retired'
    if (s === 'Transferred') return 'pf-row-transferred'
    return ''
  }

  return (
    <>
      <section className="employee-workspace">
        <div className="table-toolbar pf-toolbar">
          <label className="search-field">
            <span>Search</span>
            <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="File no, employee, department" />
          </label>
          <label>
            <span>Section</span>
            <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1) }}>
              <option>All Sections</option>
              {departmentsList.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={staffFilter} onChange={(e) => { setStaffFilter(e.target.value as typeof staffFilter); setPage(1) }}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="All">All</option>
            </select>
          </label>
          <label>
            <span>Rows</span>
            <select value={pageSize} onChange={(e) => { setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value) as 50 | 100); setPage(1) }}>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="All">All</option>
            </select>
          </label>
        </div>

        <div className="employee-table-shell compact-scroll">
          <table className="data-table personal-files-table">
            <thead>
              <tr>
                <th>File No</th>
                <th>Emp ID</th>
                <th>Full Name</th>
                <th>Section</th>
                <th style={{ textAlign: 'center' }}>COC</th>
                <th style={{ textAlign: 'center' }}>JD</th>
                <th style={{ textAlign: 'center' }}>EA</th>
                <th style={{ textAlign: 'center' }}>EA Expiry</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={10} className="empty-row">No personal file records match the current filters.</td></tr>
              ) : rows.map((file) => (
                <tr key={file.fileNo} className={rowClass(file.staffStatus)}>
                  <td>{file.fileNo}</td>
                  <td>{file.employeeId}</td>
                  <td>{file.fullName}</td>
                  <td>{file.department}</td>
                  <td className="doc-check-cell">{file.coc ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
                  <td className="doc-check-cell">{file.jd ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
                  <td className="doc-check-cell">{file.ea ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
                  <td style={{ textAlign: 'center' }}>{file.eaExpiryDate ? formatDateDisplay(file.eaExpiryDate) : '—'}</td>
                  <td style={{ textAlign: 'center' }}><StaffStatusBadge status={file.staffStatus} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="action-glyph edit" onClick={() => setEditingFileNo(file.fileNo)} type="button" title="Edit" aria-label="Edit file">✎</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageSize !== 'All' && totalPages > 1 && (
          <div className="pagination-bar">
            <button className="page-btn" onClick={() => setPage(1)} disabled={safePage === 1} type="button">«</button>
            <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} type="button">‹</button>
            <span className="page-info">Page {safePage} of {totalPages} &nbsp;·&nbsp; {filtered.length} records</span>
            <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} type="button">›</button>
            <button className="page-btn" onClick={() => setPage(totalPages)} disabled={safePage === totalPages} type="button">»</button>
          </div>
        )}
        {pageSize === 'All' && (
          <div className="pagination-bar"><span className="page-info">{filtered.length} records total</span></div>
        )}
      </section>
      {editingFile && <PersonalFileModal file={editingFile} onClose={() => setEditingFileNo(null)} onSave={saveFile} />}
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
            <thead><tr><th className="trn-title-th">Training Title</th><th>Date</th><th>Conducted By</th><th style={{ textAlign: 'center' }}>Type</th><th style={{ textAlign: 'center' }}>Participants</th><th style={{ textAlign: 'center' }}>Action</th></tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="empty-row">No training records found.</td></tr>
              ) : rows.map((record) => (
                <tr key={record.id}>
                  <td className="trn-title-cell">{record.trainingTitle}</td>
                  <td>{record.date ? formatDateDisplay(record.date) : '—'}</td>
                  <td>{record.conductedBy || '—'}</td>
                  <td style={{ textAlign: 'center' }}><span className={`training-type-badge ${record.trainingType.toLowerCase()}`}>{record.trainingType}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    {record.participants.length > 0 ? (
                      <button className="participants-count-btn" onClick={() => setViewingParticipants(record)} type="button">
                        {record.participants.length} attended
                      </button>
                    ) : <span className="no-participants-text">—</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="row-actions ind-actions" style={{ justifyContent: 'center' }}>
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
type AccountStatus = 'Pending' | 'Applied' | 'Completed'
type AccountType = 'USD' | 'MVR' | 'USD & MVR'

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
  remarks?: string
}

const initialBankAccountRecords: BankAccountRecord[] = [
  { id: 'BNK-35494', employeeId: '35494', fullName: 'GAMARALALAGE AJITH WIJESIRI', department: 'ACCOUNTS AND FINANCE', nationality: 'SRI LANKAN', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2007-06-01', status: 'Completed' },
  { id: 'BNK-37916', employeeId: '37916', fullName: 'JAGO', department: 'STORES', nationality: 'BANGLADESHI', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2008-09-01', status: 'Completed' },
  { id: 'BNK-43407', employeeId: '43407', fullName: 'MOHAMMAD DELOWAR HOSSAIN', department: 'STORES', nationality: 'BANGLADESHI', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2013-08-01', status: 'Completed' },
  { id: 'BNK-44386', employeeId: '44386', fullName: 'MAJIB', department: 'STORES', nationality: 'BANGLADESHI', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2014-06-01', status: 'Completed' },
  { id: 'BNK-50223', employeeId: '50223', fullName: 'AYESHAN KUMARA WIJEYATHUNGA MUDALIGE', department: 'STORES', nationality: 'SRI LANKAN', bank: 'BOC', accountType: 'USD & MVR', scheduledDate: '2019-04-10', status: 'Completed' },
  { id: 'BNK-50427', employeeId: '50427', fullName: 'MD SAIFUR RAHMAN', department: 'STORES', nationality: 'BANGLADESHI', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2019-06-01', status: 'Completed' },
  { id: 'BNK-52804', employeeId: '52804', fullName: 'AHMED IMRAN', department: 'ACCOUNTS AND FINANCE', nationality: 'BANGLADESHI', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2020-12-01', status: 'Completed' },
  { id: 'BNK-53029', employeeId: '53029', fullName: 'KUMARAN VAITHILINGAM', department: 'STORES', nationality: 'INDIAN', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2022-01-20', status: 'Completed' },
  { id: 'BNK-53979', employeeId: '53979', fullName: 'NAVEEN SEKAR', department: 'STORES', nationality: 'INDIAN', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2022-08-10', status: 'Completed' },
  { id: 'BNK-55427', employeeId: '55427', fullName: 'SARAVANAN RAJENDRAN', department: 'STORES', nationality: 'INDIAN', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2023-09-01', status: 'Completed' },
  { id: 'BNK-56141', employeeId: '56141', fullName: 'RAJU PERKA', department: 'CAFE', nationality: 'INDIAN', bank: 'BOC', accountType: 'USD & MVR', scheduledDate: '2024-04-01', status: 'Completed' },
  { id: 'BNK-56530', employeeId: '56530', fullName: 'PUBUDU MADURANGA ALAWATHTHA KANKANAMGE', department: 'ADMINISTRATION', nationality: 'SRI LANKAN', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2024-07-01', status: 'Completed' },
  { id: 'BNK-56646', employeeId: '56646', fullName: 'CHANDRASHEKHER PURELLA', department: 'ACCOUNTS AND FINANCE', nationality: 'INDIAN', bank: 'BOC', accountType: 'USD & MVR', scheduledDate: '2024-08-01', status: 'Completed' },
  { id: 'BNK-57637', employeeId: '57637', fullName: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', nationality: 'INDIAN', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2025-02-10', status: 'Completed' },
  { id: 'BNK-57935', employeeId: '57935', fullName: 'ARUNODA KAVINDU NANAYAKKARA', department: 'ACCOUNTS AND FINANCE', nationality: 'SRI LANKAN', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2025-04-20', status: 'Completed' },
  { id: 'BNK-58692', employeeId: '58692', fullName: 'SHANTUMON PATHIYIL CHACKO', department: 'HUMAN RESOURCES', nationality: 'INDIAN', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2025-10-15', status: 'Completed' },
  { id: 'BNK-57803', employeeId: '57803', fullName: 'INDIKA SAMPATH SAMARASINGHEGE', department: 'STORES', nationality: 'SRI LANKAN', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2026-05-20', status: 'Pending' },
  { id: 'BNK-58034', employeeId: '58034', fullName: 'SAMEERA MADUSANKA GUNARATHNA', department: 'STORES', nationality: 'SRI LANKAN', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2026-05-22', status: 'Pending' },
  { id: 'BNK-58686', employeeId: '58686', fullName: 'YASAR ARAFATH BASHEER AHAMED', department: 'STORES', nationality: 'INDIAN', bank: 'SBI', accountType: 'USD & MVR', scheduledDate: '2026-05-18', status: 'Pending' },
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
  const [remarks, setRemarks] = useState(record.remarks ?? '')

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
      remarks,
    })
  }

  const displayEmp = isNew ? selected : employees.find((e) => e.employeeId === record.employeeId)

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Bank Account Opening</p>
            <h2>{isNew ? 'Add Record' : `Edit — ${record.fullName}`}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <form onSubmit={save}>
          {/* Employee card */}
          <div className="trn-modal-card" style={{ marginBottom: '16px' }}>
            <div className="trn-modal-field-block">
              <span className="trn-modal-field-lbl">Employee</span>
              {isNew ? (
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1.5px solid rgba(124,58,237,0.2)', fontSize: '0.85rem', background: '#fff' }}
                >
                  {nonLocals.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>{emp.employeeId} – {emp.fullName} ({emp.department})</option>
                  ))}
                </select>
              ) : (
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#1e1b4b' }}>{record.fullName}</p>
              )}
            </div>
            {displayEmp && (
              <div className="trn-modal-detail-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: '8px' }}>
                <div>
                  <span className="trn-modal-field-lbl">Emp ID</span>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151' }}>{displayEmp.employeeId}</p>
                </div>
                <div>
                  <span className="trn-modal-field-lbl">Section</span>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151' }}>{displayEmp.department}</p>
                </div>
                <div>
                  <span className="trn-modal-field-lbl">Nationality</span>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151' }}>{displayEmp.nationality}</p>
                </div>
              </div>
            )}
          </div>

          {/* Account details card */}
          <div className="trn-modal-card" style={{ marginBottom: '16px' }}>
            <div className="trn-modal-detail-row">
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="trn-modal-field-lbl">Bank</span>
                <select value={bank} onChange={(e) => setBank(e.target.value as BankName)}
                  style={{ padding: '7px 10px', borderRadius: '7px', border: '1.5px solid rgba(124,58,237,0.2)', fontSize: '0.85rem', background: '#fff' }}>
                  <option>SBI</option><option>BOC</option><option>CBM</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="trn-modal-field-lbl">Account Type</span>
                <select value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)}
                  style={{ padding: '7px 10px', borderRadius: '7px', border: '1.5px solid rgba(124,58,237,0.2)', fontSize: '0.85rem', background: '#fff' }}>
                  <option value="USD">USD</option>
                  <option value="MVR">MVR</option>
                  <option value="USD & MVR">USD &amp; MVR</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="trn-modal-field-lbl">Scheduled Date</span>
                <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: '7px', border: '1.5px solid rgba(124,58,237,0.2)', fontSize: '0.85rem', background: '#fff' }} />
              </label>
            </div>
            <div className="trn-modal-detail-row" style={{ gridTemplateColumns: '1fr 2fr', marginTop: '10px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="trn-modal-field-lbl">Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as AccountStatus)}
                  style={{ padding: '7px 10px', borderRadius: '7px', border: '1.5px solid rgba(124,58,237,0.2)', fontSize: '0.85rem', background: '#fff' }}>
                  <option>Pending</option><option>Applied</option><option>Completed</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="trn-modal-field-lbl">Remarks</span>
                <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes"
                  style={{ padding: '7px 10px', borderRadius: '7px', border: '1.5px solid rgba(124,58,237,0.2)', fontSize: '0.85rem', background: '#fff' }} />
              </label>
            </div>
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
  const [appliedConfirm, setAppliedConfirm] = useState<BankAccountRecord | null>(null)

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

  const handleStatusAdvance = (r: BankAccountRecord) => {
    if (r.status === 'Pending') {
      onUpdate((prev) => prev.map((x) => x.id === r.id ? { ...x, status: 'Applied' as AccountStatus } : x))
    } else if (r.status === 'Applied') {
      setAppliedConfirm(r)
    }
  }

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
    accountType: 'USD & MVR',
    scheduledDate: new Date().toISOString().slice(0, 10),
    status: 'Pending',
    remarks: '',
  })

  const BankTable = ({ rows, showEdit }: { rows: BankAccountRecord[]; showEdit: boolean }) => (
    <div className="bank-table-shell">
      <table className="data-table bank-table">
        <colgroup>
          <col style={{ width: '36px' }} />
          <col style={{ width: '88px' }} />
          <col />
          <col style={{ width: '150px' }} />
          <col style={{ width: '110px' }} />
          <col style={{ width: '62px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '110px' }} />
          <col style={{ width: '96px' }} />
          {showEdit && <col style={{ width: '72px' }} />}
          {!showEdit && <col style={{ width: '160px' }} />}
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>Emp ID</th>
            <th>Full Name</th>
            <th>Section</th>
            <th>Nationality</th>
            <th style={{ textAlign: 'center' }}>Bank</th>
            <th>Account Type</th>
            <th style={{ textAlign: 'center' }}>Scheduled Date</th>
            <th style={{ textAlign: 'center' }}>Status</th>
            {showEdit && <th style={{ textAlign: 'center' }}>Action</th>}
            {!showEdit && <th>Remarks</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={10} className="empty-row">No records in this section.</td></tr>
            : rows.map((r, i) => (
              <tr key={r.id}>
                <td className="bank-td-num">{i + 1}</td>
                <td>{r.employeeId}</td>
                <td className="name-cell-plain">{r.fullName}</td>
                <td>{r.department}</td>
                <td>{r.nationality}</td>
                <td style={{ textAlign: 'center' }}><span className="bank-chip">{r.bank}</span></td>
                <td><span className="account-type-chip">{r.accountType}</span></td>
                <td style={{ textAlign: 'center' }}>{r.scheduledDate ? formatDateDisplay(r.scheduledDate) : '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  {r.status === 'Completed' ? (
                    <StatusBadge status="Completed" />
                  ) : (
                    <button
                      className={`bank-status-btn bank-status-${r.status.toLowerCase()}`}
                      onClick={() => handleStatusAdvance(r)}
                      type="button"
                      title={r.status === 'Pending' ? 'Click to mark as Applied' : 'Click to confirm completion'}
                    >{r.status}</button>
                  )}
                </td>
                {showEdit && (
                  <td style={{ textAlign: 'center' }}>
                    <div className="row-actions request-inline-actions" style={{ justifyContent: 'center' }}>
                      <button className="action-glyph edit" onClick={() => setEditing(r)} type="button" title="Edit" aria-label="Edit">✎</button>
                      <button className="action-glyph delete" onClick={() => deleteRecord(r.id)} type="button" title="Delete" aria-label="Delete">🗑</button>
                    </div>
                  </td>
                )}
                {!showEdit && (
                  <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{r.remarks || '—'}</td>
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
            PENDING
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
            <span className="bank-footer-hint"> — Click a status badge to advance the workflow: Pending → Applied → Completed.</span>
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

      {appliedConfirm && (
        <div className="modal-backdrop" role="presentation">
          <section className="registration-modal" style={{ maxWidth: '480px' }} role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Confirm Completion</p>
                <h2>Bank Account Application</h2>
              </div>
              <button className="icon-button" onClick={() => setAppliedConfirm(null)} type="button">×</button>
            </div>
            <div style={{ padding: '12px 0 18px' }}>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>{appliedConfirm.fullName}</p>
              <p style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: '14px' }}>
                {appliedConfirm.bank} &nbsp;·&nbsp; {appliedConfirm.accountType}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.55 }}>
                Has the bank account application been <strong>completed</strong> and details <strong>shared</strong>?
              </p>
            </div>
            <div className="modal-actions">
              <button className="quiet-button light" onClick={() => setAppliedConfirm(null)} type="button">Cancel</button>
              <button className="primary-button" onClick={() => {
                onUpdate((prev) => prev.map((x) => x.id === appliedConfirm!.id
                  ? { ...x, status: 'Completed' as AccountStatus, remarks: 'Details shared' }
                  : x))
                setAppliedConfirm(null)
              }} type="button">Yes, Mark as Completed</button>
            </div>
          </section>
        </div>
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

/* ─── Exit Interview helpers ─────────────────────────────── */
const eiCategories: { key: keyof ExitInterviewRecord; label: string }[] = [
  { key: 'management',     label: 'Management' },
  { key: 'workEnvironment',label: 'Work Environment' },
  { key: 'compensation',   label: 'Compensation' },
  { key: 'workLifeBalance',label: 'Work-Life Balance' },
  { key: 'careerGrowth',   label: 'Career Growth' },
  { key: 'communication',  label: 'Communication' },
  { key: 'overall',        label: 'Overall Experience' },
]
const ratingLabel = (r: number) => ['', 'Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'][Math.round(r)] ?? '—'
const ratingColor = (r: number) => r >= 4 ? '#16a34a' : r >= 3 ? '#d97706' : '#dc2626'
const ratingBg    = (r: number) => r >= 4 ? '#dcfce7' : r >= 3 ? '#fef3c7' : '#fee2e2'

function ExitInterviewModal({ record, completedTerminations, onClose, onSave }: {
  record: ExitInterviewRecord
  completedTerminations: CompletedTerminationRecord[]
  onClose: () => void
  onSave: (r: ExitInterviewRecord) => void
}) {
  const isNew = record.id.startsWith('EI-new')
  const [empSearch, setEmpSearch] = useState(record.employeeId ? `${record.employeeId} – ${record.name}` : '')
  const [form, setForm] = useState(record)

  const empMatches = useMemo(() => {
    const q = empSearch.trim().toLowerCase()
    if (!q) return completedTerminations.slice(0, 20)
    return completedTerminations.filter((r) => `${r.employeeId} ${r.name}`.toLowerCase().includes(q)).slice(0, 20)
  }, [empSearch, completedTerminations])

  const handleEmpSelect = (id: string) => {
    const r = completedTerminations.find((x) => x.employeeId === id)
    if (!r) return
    setEmpSearch(`${r.employeeId} – ${r.name}`)
    setForm((prev) => ({ ...prev, employeeId: r.employeeId, name: r.name, department: r.department, nationality: r.nationality, terminationType: r.terminationType, departureDate: r.departureDate, reasonForLeaving: r.reasonForLeaving }))
  }

  const setRating = (key: keyof ExitInterviewRecord, val: SatisfactionRating) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const save = (e: FormEvent) => {
    e.preventDefault()
    onSave({ ...form, id: isNew ? `EI-${Date.now()}` : form.id })
  }

  const RatingRow = ({ catKey, label }: { catKey: keyof ExitInterviewRecord; label: string }) => {
    const current = form[catKey] as SatisfactionRating
    return (
      <div className="ei-rating-row">
        <span className="ei-rating-label">{label}</span>
        <div className="ei-stars">
          {([1,2,3,4,5] as SatisfactionRating[]).map((n) => (
            <button key={n} type="button"
              className={`ei-star-btn${current === n ? ' active' : ''}`}
              onClick={() => setRating(catKey, n)}
              title={ratingLabel(n)}
            >{n}</button>
          ))}
        </div>
        <span className="ei-rating-desc" style={{ color: ratingColor(current), background: ratingBg(current) }}>{ratingLabel(current)}</span>
      </div>
    )
  }

  const fStyle = { padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff', width:'100%' }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal wide-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Exit Interview</p>
            <h2>{isNew ? 'Record Exit Interview' : `Edit — ${record.name}`}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <form onSubmit={save}>
          {/* Employee */}
          <div className="trn-modal-card" style={{ marginBottom:'14px' }}>
            {isNew && (
              <div style={{ marginBottom:'10px' }}>
                <span className="trn-modal-field-lbl">Select from Completed Departures</span>
                <input value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} placeholder="Search name or ID…" style={{ ...fStyle, marginTop:'4px' }} />
                {empSearch && !form.employeeId && (
                  <div className="ei-emp-dropdown">
                    {empMatches.map((r) => (
                      <button key={r.employeeId} type="button" className="ei-emp-option" onClick={() => handleEmpSelect(r.employeeId)}>
                        <strong>{r.employeeId}</strong> {r.name} <span>{r.department}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="trn-modal-detail-row">
              <div><span className="trn-modal-field-lbl">Employee</span><p style={{ margin:0, fontWeight:700, fontSize:'0.9rem', color:'#1e1b4b' }}>{form.name || '—'}</p></div>
              <div><span className="trn-modal-field-lbl">Section</span><p style={{ margin:0, fontSize:'0.85rem', color:'#374151' }}>{form.department || '—'}</p></div>
              <div><span className="trn-modal-field-lbl">Departure</span><p style={{ margin:0, fontSize:'0.85rem', color:'#374151' }}>{form.departureDate ? formatDateDisplay(form.departureDate) : '—'}</p></div>
            </div>
          </div>

          {/* Interview date + basics */}
          <div className="trn-modal-card" style={{ marginBottom:'14px' }}>
            <div className="trn-modal-detail-row" style={{ gridTemplateColumns:'1fr 1fr 1fr', marginBottom:'10px' }}>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Interview Date</span>
                <input type="date" value={form.interviewDate} onChange={(e) => setForm((p) => ({ ...p, interviewDate: e.target.value }))} required style={fStyle} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Termination Type</span>
                <select value={form.terminationType} onChange={(e) => setForm((p) => ({ ...p, terminationType: e.target.value as TerminationType }))} style={fStyle}>
                  <option>Resignation</option><option>Dismissal</option><option>Probation End</option><option>Contract Expiry</option><option>Absconded</option><option>Other</option>
                </select>
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl" style={{ display:'block', marginBottom:'6px' }}>Would Recommend TIC?</span>
                <label style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'6px' }}>
                  <input type="checkbox" checked={form.wouldRecommend} onChange={(e) => setForm((p) => ({ ...p, wouldRecommend: e.target.checked }))} style={{ width:'16px', height:'16px', accentColor:'#7c3aed' }} />
                  <span style={{ fontSize:'0.85rem', color:'#374151' }}>Yes, would recommend</span>
                </label>
              </label>
            </div>
            <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              <span className="trn-modal-field-lbl">Reason for Leaving</span>
              <input value={form.reasonForLeaving} onChange={(e) => setForm((p) => ({ ...p, reasonForLeaving: e.target.value }))} placeholder="Primary reason stated by employee" style={fStyle} />
            </label>
          </div>

          {/* Satisfaction ratings */}
          <div className="trn-modal-card" style={{ marginBottom:'14px' }}>
            <p className="trn-modal-field-lbl" style={{ marginBottom:'12px' }}>Satisfaction Ratings &nbsp;<span style={{ fontWeight:400, color:'#6b7280' }}>1 = Very Dissatisfied · 5 = Very Satisfied</span></p>
            <div className="ei-ratings-grid">
              {eiCategories.map(({ key, label }) => <RatingRow key={key} catKey={key} label={label} />)}
            </div>
          </div>

          {/* Comments */}
          <div className="trn-modal-card">
            <span className="trn-modal-field-lbl">Additional Comments</span>
            <textarea rows={3} value={form.comments} onChange={(e) => setForm((p) => ({ ...p, comments: e.target.value }))} placeholder="Any additional feedback from the employee…" style={{ ...fStyle, marginTop:'4px', resize:'vertical' }} />
          </div>

          <div className="modal-actions">
            <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
            <button className="primary-button" type="submit" disabled={!form.employeeId}>{isNew ? 'Save Interview' : 'Save Changes'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ExitInterviewSection({ records, completedTerminations, onUpdate }: {
  records: ExitInterviewRecord[]
  completedTerminations: CompletedTerminationRecord[]
  onUpdate: (fn: (prev: ExitInterviewRecord[]) => ExitInterviewRecord[]) => void
}) {
  const [monthFilter, setMonthFilter] = useState('All')
  const [deptFilter, setDeptFilter] = useState('All Sections')
  const [editing, setEditing] = useState<ExitInterviewRecord | null>(null)
  const [viewing, setViewing] = useState<ExitInterviewRecord | null>(null)

  const months = useMemo(() => {
    const keys = Array.from(new Set(records.map((r) => r.departureDate.slice(0, 7)))).sort().reverse()
    return ['All', ...keys]
  }, [records])

  const filtered = useMemo(() => records.filter((r) => {
    const mOk = monthFilter === 'All' || r.departureDate.startsWith(monthFilter)
    const dOk = deptFilter === 'All Sections' || r.department === deptFilter
    return mOk && dOk
  }), [records, monthFilter, deptFilter])

  const total = filtered.length

  const avg = (key: keyof ExitInterviewRecord) => {
    if (!total) return 0
    return filtered.reduce((s, r) => s + (r[key] as number), 0) / total
  }

  const avgOverall    = avg('overall')
  const recommendPct  = total ? Math.round(filtered.filter((r) => r.wouldRecommend).length / total * 100) : 0

  const reasonCounts = useMemo(() => {
    const m: Record<string, number> = {}
    filtered.forEach((r) => { m[r.terminationType] = (m[r.terminationType] ?? 0) + 1 })
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [filtered])

  const topReason = reasonCounts[0]?.[0] ?? '—'

  const save = (r: ExitInterviewRecord) => {
    onUpdate((prev) => {
      const idx = prev.findIndex((x) => x.id === r.id)
      return idx >= 0 ? prev.map((x) => x.id === r.id ? r : x) : [r, ...prev]
    })
    setEditing(null)
  }

  const del = (id: string) => onUpdate((prev) => prev.filter((x) => x.id !== id))

  const exportReport = () => {
    const headers = ['ID','Employee','Section','Nationality','Departure','Type','Recommend','Management','Work Env','Compensation','Work-Life','Career Growth','Communication','Overall','Reason','Comments']
    const rows = filtered.map((r) => [r.id, r.name, r.department, r.nationality, formatDateDisplay(r.departureDate), r.terminationType, r.wouldRecommend ? 'Yes' : 'No', String(r.management), String(r.workEnvironment), String(r.compensation), String(r.workLifeBalance), String(r.careerGrowth), String(r.communication), String(r.overall), r.reasonForLeaving, r.comments])
    downloadCsv('exit-interview-report.csv', [headers, ...rows])
  }

  const newEI = (): ExitInterviewRecord => ({
    id: 'EI-new', employeeId: '', name: '', department: '', nationality: '',
    terminationType: 'Resignation', departureDate: '', interviewDate: new Date().toISOString().slice(0,10),
    management: 3, workEnvironment: 3, compensation: 3, workLifeBalance: 3,
    careerGrowth: 3, communication: 3, overall: 3,
    wouldRecommend: false, reasonForLeaving: '', comments: '',
  })

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div className="ei-score-row">
      <span className="ei-score-label">{label}</span>
      <div className="ei-score-track">
        <div className="ei-score-fill" style={{ width: `${(value / 5) * 100}%`, background: ratingColor(value) }} />
      </div>
      <span className="ei-score-num" style={{ color: ratingColor(value) }}>{value ? value.toFixed(1) : '—'}</span>
      {value > 0 && <span className="ei-score-desc" style={{ color: ratingColor(value), background: ratingBg(value) }}>{ratingLabel(value)}</span>}
    </div>
  )

  return (
    <>
      {/* Toolbar */}
      <div className="table-toolbar activities-toolbar">
        <label><span>Month</span>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            {months.map((m) => <option key={m} value={m}>{m === 'All' ? 'All Months' : formatMonthLabel(m)}</option>)}
          </select>
        </label>
        <label><span>Section</span>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="All Sections">All Sections</option>
            {departmentsList.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <button className="quiet-button light" type="button" onClick={exportReport} style={{ marginLeft:'auto' }}>⬇ Export Report</button>
        <button className="primary-button" type="button" onClick={() => setEditing(newEI())}>+ Add Interview</button>
      </div>

      {/* KPI stat cards */}
      <div className="ei-stat-row">
        <div className="ei-stat ei-stat-purple">
          <strong>{total}</strong>
          <span>Total Interviews</span>
        </div>
        <div className="ei-stat ei-stat-blue">
          <strong>{avgOverall ? avgOverall.toFixed(1) : '—'}<small>/5</small></strong>
          <span>Avg Satisfaction</span>
        </div>
        <div className="ei-stat ei-stat-green">
          <strong>{recommendPct}<small>%</small></strong>
          <span>Would Recommend</span>
        </div>
        <div className="ei-stat ei-stat-amber">
          <strong>{topReason}</strong>
          <span>Top Exit Reason</span>
        </div>
      </div>

      {/* Satisfaction breakdown */}
      {total > 0 && (
        <div className="ei-dashboard-grid">
          <div className="ei-panel">
            <h3 className="ei-panel-title">Satisfaction by Area</h3>
            <div className="ei-scores">
              {eiCategories.map(({ key, label }) => (
                <ScoreBar key={key} label={label} value={avg(key)} />
              ))}
            </div>
          </div>

          <div className="ei-panel">
            <h3 className="ei-panel-title">Exit Reasons</h3>
            <div className="ei-reasons">
              {reasonCounts.map(([reason, count]) => (
                <div key={reason} className="ei-reason-row">
                  <span className="ei-reason-name">{reason}</span>
                  <div className="ei-reason-track">
                    <div className="ei-reason-fill" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="ei-reason-count">{count} <small>({Math.round(count / total * 100)}%)</small></span>
                </div>
              ))}
            </div>
            <div className="ei-recommend-ring" style={{ marginTop:'24px' }}>
              <div className="ei-ring-label">
                <strong style={{ fontSize:'2rem', color: recommendPct >= 60 ? '#16a34a' : '#dc2626' }}>{recommendPct}%</strong>
                <span>would recommend TIC as an employer</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="ei-empty">
          <svg viewBox="0 0 48 48" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="56" height="56"><circle cx="24" cy="24" r="20"/><path d="M24 14v10l6 4"/></svg>
          <p>No exit interview records match the current filters.</p>
          <p style={{ fontSize:'0.8rem', color:'#9ca3af' }}>Add interviews using the button above.</p>
        </div>
      )}

      {/* Interview table */}
      {total > 0 && (
        <div className="employee-table-shell compact-scroll" style={{ marginTop:'16px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Emp ID</th><th>Name</th><th>Section</th><th>Departure</th>
                <th>Type</th>
                <th style={{textAlign:'center'}}>Overall</th>
                <th style={{textAlign:'center'}}>Recommend</th>
                <th>Reason</th>
                <th style={{textAlign:'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.employeeId}</td>
                  <td className="name-cell"><button className="name-link" type="button" onClick={() => setViewing(r)}>{r.name}</button></td>
                  <td>{r.department}</td>
                  <td style={{textAlign:'center'}}>{formatDateDisplay(r.departureDate)}</td>
                  <td><span className="req-type-chip">{r.terminationType}</span></td>
                  <td style={{textAlign:'center'}}>
                    <span className="ei-overall-badge" style={{ color: ratingColor(r.overall), background: ratingBg(r.overall) }}>
                      {r.overall}/5
                    </span>
                  </td>
                  <td style={{textAlign:'center'}}>
                    {r.wouldRecommend
                      ? <span className="doc-yes" style={{fontSize:'0.75rem', fontWeight:700}}>✓ Yes</span>
                      : <span className="doc-no" style={{fontSize:'0.75rem'}}>No</span>}
                  </td>
                  <td style={{maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{r.reasonForLeaving || '—'}</td>
                  <td style={{textAlign:'center'}}>
                    <div className="row-actions">
                      <button className="action-glyph" title="View" onClick={() => setViewing(r)} type="button">👁</button>
                      <button className="action-glyph edit" title="Edit" onClick={() => setEditing(r)} type="button">✎</button>
                      <button className="action-glyph delete" title="Delete" onClick={() => del(r.id)} type="button">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View modal */}
      {viewing && (
        <div className="modal-backdrop" role="presentation">
          <section className="registration-modal wide-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Exit Interview · {viewing.id}</p>
                <h2>{viewing.name}</h2>
                <p style={{margin:0, fontSize:'0.78rem', color:'rgba(255,255,255,0.6)'}}>{viewing.department} · {formatDateDisplay(viewing.departureDate)}</p>
              </div>
              <button className="icon-button" onClick={() => setViewing(null)} type="button">×</button>
            </div>
            <div className="ei-view-grid">
              <div className="ei-panel" style={{gridColumn:'1/-1'}}>
                <div className="trn-modal-detail-row">
                  <div><span className="trn-modal-field-lbl">Employee</span><p style={{margin:0, fontWeight:700}}>{viewing.name}</p></div>
                  <div><span className="trn-modal-field-lbl">Section</span><p style={{margin:0}}>{viewing.department}</p></div>
                  <div><span className="trn-modal-field-lbl">Departure</span><p style={{margin:0}}>{formatDateDisplay(viewing.departureDate)}</p></div>
                  <div><span className="trn-modal-field-lbl">Type</span><p style={{margin:0}}>{viewing.terminationType}</p></div>
                  <div><span className="trn-modal-field-lbl">Would Recommend</span><p style={{margin:0, color: viewing.wouldRecommend ? '#16a34a' : '#dc2626', fontWeight:700}}>{viewing.wouldRecommend ? '✓ Yes' : '✗ No'}</p></div>
                </div>
              </div>
              <div className="ei-panel">
                <h3 className="ei-panel-title">Ratings</h3>
                {eiCategories.map(({ key, label }) => (
                  <ScoreBar key={key} label={label} value={viewing[key] as number} />
                ))}
              </div>
              <div className="ei-panel">
                <h3 className="ei-panel-title">Feedback</h3>
                <div style={{marginBottom:'12px'}}>
                  <span className="trn-modal-field-lbl">Reason for Leaving</span>
                  <p style={{margin:'4px 0 0', fontSize:'0.87rem', color:'#374151'}}>{viewing.reasonForLeaving || '—'}</p>
                </div>
                <div>
                  <span className="trn-modal-field-lbl">Additional Comments</span>
                  <p style={{margin:'4px 0 0', fontSize:'0.87rem', color:'#374151', lineHeight:1.6}}>{viewing.comments || '—'}</p>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="primary-button" type="button" onClick={() => { setViewing(null); setEditing(viewing) }}>✎ Edit</button>
              <button className="quiet-button light" type="button" onClick={() => setViewing(null)}>Close</button>
            </div>
          </section>
        </div>
      )}

      {editing && <ExitInterviewModal record={editing} completedTerminations={completedTerminations} onClose={() => setEditing(null)} onSave={save} />}
    </>
  )
}

function TerminationPage({
  noticeTerminations,
  completedTerminations,
  exitInterviews,
  onAdd,
  onEdit,
  onAdvanceStatus,
  onDelete,
  onViewDetails,
  onUpdateExitInterviews,
}: {
  noticeTerminations: EnhancedTerminationRecord[]
  completedTerminations: CompletedTerminationRecord[]
  exitInterviews: ExitInterviewRecord[]
  onAdd: () => void
  onEdit: (record: EnhancedTerminationRecord) => void
  onAdvanceStatus: (id: string) => void
  onDelete: (id: string) => void
  onViewDetails: (record: EnhancedTerminationRecord | CompletedTerminationRecord) => void
  onUpdateExitInterviews: (fn: (prev: ExitInterviewRecord[]) => ExitInterviewRecord[]) => void
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
    if (months < 0) { years -= 1; months += 12 }
    return `${years}y ${months}m`
  }

  const noticeDepartments = useMemo(() => ['All Departments', ...Array.from(new Set(noticeTerminations.map((r) => r.department))).sort()], [noticeTerminations])
  const completedDepartments = useMemo(() => ['All Departments', ...Array.from(new Set(completedTerminations.map((r) => r.department))).sort()], [completedTerminations])

  const noticeRows = useMemo(() => noticeTerminations.filter((r) => {
    const t = noticeSearch.trim().toLowerCase()
    return (!t || `${r.employeeId} ${r.name} ${r.department} ${r.nationality}`.toLowerCase().includes(t))
      && (noticeDepartmentFilter === 'All Departments' || r.department === noticeDepartmentFilter)
      && (noticeStageFilter === 'All' || r.currentStage === noticeStageFilter)
  }).sort((a, b) => a.departureDate.localeCompare(b.departureDate)), [noticeTerminations, noticeSearch, noticeDepartmentFilter, noticeStageFilter])

  const completedRows = useMemo(() => completedTerminations.filter((r) => {
    const t = completedSearch.trim().toLowerCase()
    return (!t || `${r.employeeId} ${r.name} ${r.department} ${r.nationality}`.toLowerCase().includes(t))
      && (completedDepartmentFilter === 'All Departments' || r.department === completedDepartmentFilter)
  }).sort((a, b) => a.departureDate.localeCompare(b.departureDate)), [completedTerminations, completedSearch, completedDepartmentFilter])

  return (
    <>
      <PageHeader eyebrow="Employee separation" title="Termination" subtitle="Manage notice periods, completed departures, and exit interview insights." />
      <section className="employee-workspace leave-workspace termination-workspace">
        <div className="leave-section-tabs termination-tabs">
          <button className={activeTab === 'notice' ? 'active' : ''} onClick={() => setActiveTab('notice')} type="button">
            Notice Period{noticeTerminations.length > 0 && <span className="tab-count">{noticeTerminations.length}</span>}
          </button>
          <button className={activeTab === 'completed' ? 'active' : ''} onClick={() => setActiveTab('completed')} type="button">
            Completed{completedTerminations.length > 0 && <span className="tab-count">{completedTerminations.length}</span>}
          </button>
          <button className={activeTab === 'exit-interview' ? 'active' : ''} onClick={() => setActiveTab('exit-interview')} type="button">
            Exit Interviews{exitInterviews.length > 0 && <span className="tab-count">{exitInterviews.length}</span>}
          </button>
        </div>

        {activeTab === 'notice' && (
          <>
            <div className="table-toolbar leave-toolbar leave-toolbar-3 termination-topbar leave-toolbar-has-btn">
              <label className="search-field"><span>Search</span><input onChange={(e) => setNoticeSearch(e.target.value)} placeholder="Employee, ID, department…" type="search" value={noticeSearch} /></label>
              <label><span>Section</span><select onChange={(e) => setNoticeDepartmentFilter(e.target.value)} value={noticeDepartmentFilter}>{noticeDepartments.map((d) => <option key={d}>{d}</option>)}</select></label>
              <label><span>Stage</span><select onChange={(e) => setNoticeStageFilter(e.target.value === 'All' ? 'All' : e.target.value as TerminationStage)} value={noticeStageFilter}><option value="All">All Stages</option>{allTerminationStages.map((s) => <option key={s}>{s}</option>)}</select></label>
              <button className="primary-button toolbar-add-btn" onClick={onAdd} type="button">+ Add</button>
            </div>
            <div className="employee-table-shell compact-scroll termination-table-shell">
              <table className="data-table termination-table compact">
                <thead><tr><th>Emp ID</th><th>Name</th><th>Section</th><th>Nationality</th><th>Date of Join</th><th>Duration</th><th>Last Working</th><th>Departure</th><th>Stage</th><th>Actions</th></tr></thead>
                <tbody>
                  {noticeRows.length === 0
                    ? <tr><td colSpan={10} className="empty-row">No notice period records.</td></tr>
                    : noticeRows.map((r) => {
                      const idx = allTerminationStages.indexOf(r.currentStage)
                      const pct = ((idx + 1) / allTerminationStages.length) * 100
                      return (
                        <tr key={r.id} className="termination-row">
                          <td>{r.employeeId}</td>
                          <td className="name-cell"><button className="name-link" onClick={() => onViewDetails(r)} type="button">{r.name}</button></td>
                          <td>{r.department}</td>
                          <td>{r.nationality}</td>
                          <td>{formatDateDisplay(r.dateOfJoin)}</td>
                          <td>{getDuration(r.dateOfJoin)}</td>
                          <td>{formatDateDisplay(r.lastWorkingDate)}</td>
                          <td>{formatDateDisplay(r.departureDate)}</td>
                          <td className="leave-status-cell termination-status-cell">
                            <button className={`status-advance-btn status-text status-chip status-step-${r.currentStage.toLowerCase().replaceAll(' ','-')}`} onClick={() => onAdvanceStatus(r.id)} disabled={r.currentStage === 'Pending Departure'} type="button">{r.currentStage}</button>
                            <div className={`status-progress-track status-step-${r.currentStage.toLowerCase().replaceAll(' ','-')}`}><span style={{ width:`${pct}%` }} /></div>
                          </td>
                          <td className="termination-actions">
                            <div className="row-actions">
                              <button className="action-glyph" onClick={() => onViewDetails(r)} type="button" title="View">👁</button>
                              <button className="action-glyph edit" onClick={() => onEdit(r)} type="button" title="Edit">✎</button>
                              <button className="action-glyph delete" onClick={() => onDelete(r.id)} type="button" title="Delete">🗑</button>
                            </div>
                          </td>
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
              <label className="search-field"><span>Search</span><input onChange={(e) => setCompletedSearch(e.target.value)} placeholder="Employee, ID, department…" type="search" value={completedSearch} /></label>
              <label><span>Section</span><select onChange={(e) => setCompletedDepartmentFilter(e.target.value)} value={completedDepartmentFilter}>{completedDepartments.map((d) => <option key={d}>{d}</option>)}</select></label>
            </div>
            <div className="employee-table-shell compact-scroll termination-table-shell">
              <table className="data-table termination-table compact">
                <thead><tr><th>Emp ID</th><th>Name</th><th>Section</th><th>Nationality</th><th>Date of Join</th><th>Duration</th><th>Last Working</th><th>Departure</th><th>Type</th><th>Action</th></tr></thead>
                <tbody>
                  {completedRows.length === 0
                    ? <tr><td colSpan={10} className="empty-row">No completed departures.</td></tr>
                    : completedRows.map((r) => (
                      <tr key={r.id} className="termination-row">
                        <td>{r.employeeId}</td>
                        <td className="name-cell"><button className="name-link" onClick={() => onViewDetails(r)} type="button">{r.name}</button></td>
                        <td>{r.department}</td>
                        <td>{r.nationality}</td>
                        <td>{formatDateDisplay(r.dateOfJoin)}</td>
                        <td>{getDuration(r.dateOfJoin)}</td>
                        <td>{formatDateDisplay(r.lastWorkingDate)}</td>
                        <td>{formatDateDisplay(r.departureDate)}</td>
                        <td><span className="req-type-chip">{r.terminationType}</span></td>
                        <td className="termination-actions"><button className="action-glyph" onClick={() => onViewDetails(r)} type="button" title="View">👁</button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'exit-interview' && (
          <ExitInterviewSection
            records={exitInterviews}
            completedTerminations={completedTerminations}
            onUpdate={onUpdateExitInterviews}
          />
        )}
      </section>
    </>
  )
}

function OperationsPage({ employees, completedTerminations }: {
  employees: Employee[]
  completedTerminations: CompletedTerminationRecord[]
}) {
  const [activeSection, setActiveSection] = useState<OpsSection>('files')
  const [personalFiles, setPersonalFiles] = useState<PersonalFileRecord[]>(initialPersonalFiles)
  const [inductionRecords, setInductionRecords] = useState<InductionRecord[]>(initialInductionRecords)
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>(initialTrainingRecords)
  const [bankAccountRecords, setBankAccountRecords] = useState<BankAccountRecord[]>(initialBankAccountRecords)

  // Auto-add newly registered employees → personal files + bank accounts
  const prevEmployeeIdsRef = useRef<Set<string>>(new Set(employees.map((e) => e.employeeId)))
  useEffect(() => {
    const currentIds = new Set(employees.map((e) => e.employeeId))
    const addedEmployees = employees.filter((e) => !prevEmployeeIdsRef.current.has(e.employeeId))
    prevEmployeeIdsRef.current = currentIds
    if (addedEmployees.length === 0) return

    // Auto-add to personal files
    setPersonalFiles((prev) => {
      const existingIds = new Set(prev.map((r) => r.employeeId))
      const toAdd = addedEmployees.filter((e) => !existingIds.has(e.employeeId))
      if (toAdd.length === 0) return prev
      const maxNum = Math.max(0, ...prev.map((r) => parseInt(r.fileNo, 10)).filter((n) => !isNaN(n)))
      return [...prev, ...toAdd.map((e, idx): PersonalFileRecord => ({
        fileNo: String(maxNum + 1 + idx).padStart(4, '0'),
        employeeId: e.employeeId,
        fullName: e.fullName,
        department: e.department,
        staffStatus: 'Active',
        coc: false,
        jd: false,
        ea: false,
        eaExpiryDate: '',
        remarks: '',
      }))]
    })

    // Auto-add non-Maldivians to bank accounts
    const nonMaldivian = addedEmployees.filter((e) => e.nationality !== 'MALDIVIAN')
    if (nonMaldivian.length > 0) {
      setBankAccountRecords((prev) => {
        const existingIds = new Set(prev.map((r) => r.employeeId))
        const toAdd = nonMaldivian.filter((e) => !existingIds.has(e.employeeId))
        if (toAdd.length === 0) return prev
        return [...prev, ...toAdd.map((e): BankAccountRecord => ({
          id: `BNK-auto-${e.employeeId}`,
          employeeId: e.employeeId,
          fullName: e.fullName,
          department: e.department,
          nationality: e.nationality,
          bank: 'SBI',
          accountType: 'USD & MVR',
          scheduledDate: '',
          status: 'Pending',
        }))]
      })
    }
  }, [employees])

  // Auto-terminate personal files when termination is completed
  useEffect(() => {
    if (completedTerminations.length === 0) return
    const terminatedIds = new Set(completedTerminations.map((t) => t.employeeId))
    setPersonalFiles((prev) => prev.map((pf) =>
      terminatedIds.has(pf.employeeId) && pf.staffStatus === 'Active'
        ? { ...pf, staffStatus: 'Terminated' as StaffStatus, remarks: pf.remarks || 'Terminated via HR process' }
        : pf
    ))
  }, [completedTerminations])

  return (
    <>
      <PageHeader eyebrow="HR operations" title="HR Operations" />
      <div className="section-inline-tabs">
        <button className={activeSection === 'files' ? 'active' : ''} onClick={() => setActiveSection('files')} type="button">Personal Files</button>
        <button className={activeSection === 'induction' ? 'active' : ''} onClick={() => setActiveSection('induction')} type="button">Induction</button>
        <button className={activeSection === 'training' ? 'active' : ''} onClick={() => setActiveSection('training')} type="button">Training</button>
        <button className={activeSection === 'bank' ? 'active' : ''} onClick={() => setActiveSection('bank')} type="button">Bank Account</button>
      </div>
      {activeSection === 'files' && <PersonalFilesSection records={personalFiles} onUpdate={setPersonalFiles} onBack={() => {}} />}
      {activeSection === 'induction' && <InductionSection employees={employees} records={inductionRecords} onUpdate={setInductionRecords} onBack={() => {}} />}
      {activeSection === 'training' && <TrainingSection records={trainingRecords} employees={employees} onUpdate={setTrainingRecords} onBack={() => {}} />}
      {activeSection === 'bank' && <BankAccountSection employees={employees} records={bankAccountRecords} onUpdate={setBankAccountRecords} onBack={() => {}} />}
    </>
  )
}

function StaffRequestModal({ record, employees, onClose, onSave }: {
  record: StaffRequestRecord
  employees: Employee[]
  onClose: () => void
  onSave: (r: StaffRequestRecord) => void
}) {
  const isNew = record.id.startsWith('REQ-new')
  const [employeeId, setEmployeeId] = useState(record.employeeId)
  const [employeeName, setEmployeeName] = useState(record.employeeName)
  const [department, setDepartment] = useState(record.department)
  const [requestType, setRequestType] = useState<StaffRequestRecord['requestType']>(record.requestType)
  const [priority, setPriority] = useState<RequestPriority>(record.priority)
  const [description, setDescription] = useState(record.description)
  const [submittedDate, setSubmittedDate] = useState(record.submittedDate)
  const [completedDate, setCompletedDate] = useState(record.completedDate)
  const [status, setStatus] = useState<StaffRequestRecord['status']>(record.status)
  const [remarks, setRemarks] = useState(record.remarks)

  const empDir = useMemo(() => new Map(employees.map((e) => [e.employeeId.trim().toUpperCase(), e])), [employees])

  const handleEmpIdBlur = (val: string) => {
    const matched = empDir.get(val.trim().toUpperCase())
    if (matched) { setEmployeeName(matched.fullName); setDepartment(matched.department) }
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    onSave({ ...record, id: isNew ? `REQ-${Date.now()}` : record.id, employeeId, employeeName, department, requestType, priority, description, submittedDate, completedDate: isNew ? '' : completedDate, status, remarks })
  }

  const fieldStyle = { padding: '7px 10px', borderRadius: '7px', border: '1.5px solid rgba(124,58,237,0.2)', fontSize: '0.85rem', background: '#fff', width: '100%' }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Activities · Requests</p>
            <h2>{isNew ? 'New Request' : 'Edit Request'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <form onSubmit={save}>
          {/* Employee card */}
          <div className="trn-modal-card" style={{ marginBottom: '14px' }}>
            <div className="trn-modal-detail-row" style={{ gridTemplateColumns: '140px 1fr 1fr' }}>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Emp ID</span>
                <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} onBlur={(e) => handleEmpIdBlur(e.target.value)} placeholder="Optional" style={fieldStyle} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Employee Name</span>
                <input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} required placeholder="Full name" style={fieldStyle} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Section</span>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} style={fieldStyle}>
                  <option value="">— select section —</option>
                  {departmentsList.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
            </div>
          </div>

          {/* Request details card */}
          <div className="trn-modal-card" style={{ marginBottom: '14px' }}>
            <div className="trn-modal-detail-row">
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Request Type</span>
                <select value={requestType} onChange={(e) => setRequestType(e.target.value as StaffRequestRecord['requestType'])} style={fieldStyle}>
                  <option>Accommodation</option><option>Equipment</option><option>Transfer</option>
                  <option>Leave</option><option>Documents</option><option>Other</option>
                </select>
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Priority</span>
                <select value={priority} onChange={(e) => setPriority(e.target.value as RequestPriority)} style={fieldStyle}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Submitted Date</span>
                <input type="date" value={submittedDate} onChange={(e) => setSubmittedDate(e.target.value)} required style={fieldStyle} />
              </label>
            </div>
            <div className="trn-modal-detail-row" style={{ gridTemplateColumns: !isNew ? '1fr 1fr' : '1fr', marginTop:'10px' }}>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as StaffRequestRecord['status'])} style={fieldStyle}>
                  <option>Open</option><option>In Progress</option><option>Resolved</option><option>Rejected</option>
                </select>
              </label>
              {!isNew && (
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Completed Date</span>
                  <input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} style={fieldStyle} />
                </label>
              )}
            </div>
          </div>

          {/* Description + Remarks */}
          <div className="trn-modal-card">
            <div className="trn-modal-field-block">
              <span className="trn-modal-field-lbl">Description</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the request" style={{ ...fieldStyle, marginTop: '4px' }} />
            </div>
            <div className="trn-modal-field-block" style={{ marginTop: '10px', marginBottom: 0 }}>
              <span className="trn-modal-field-lbl">Remarks</span>
              <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes or resolution details" style={{ ...fieldStyle, marginTop: '4px' }} />
            </div>
          </div>

          <div className="modal-actions">
            <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
            <button className="primary-button" type="submit">{isNew ? 'Add Request' : 'Save Changes'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function VisitModal({ record, employees, onClose, onSave }: {
  record: VisitRecord
  employees: Employee[]
  onClose: () => void
  onSave: (r: VisitRecord) => void
}) {
  const isNew = record.id.startsWith('VIS-new')
  const [employeeId, setEmployeeId] = useState(record.employeeId)
  const [employeeName, setEmployeeName] = useState(record.employeeName)
  const [department, setDepartment] = useState(record.department)
  const [nicPassportNo, setNicPassportNo] = useState(record.nicPassportNo)
  const [nationality, setNationality] = useState(record.nationality)
  const [visitType, setVisitType] = useState<VisitRecord['visitType']>(record.visitType)
  const [visitDate, setVisitDate] = useState(record.visitDate)
  const [status, setStatus] = useState<VisitRecord['status']>(record.status)
  const [remarks, setRemarks] = useState(record.remarks)

  const empDir = useMemo(() => new Map(employees.map((e) => [e.employeeId.trim().toUpperCase(), e])), [employees])

  const handleEmpIdBlur = (val: string) => {
    const matched = empDir.get(val.trim().toUpperCase())
    if (matched) {
      setEmployeeName(matched.fullName)
      setDepartment(matched.department)
      setNicPassportNo(matched.nicPassportNo)
      setNationality(matched.nationality)
    }
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    onSave({ ...record, id: isNew ? `VIS-${Date.now()}` : record.id, employeeId, employeeName, department, nicPassportNo, nationality, visitType, visitDate, status, remarks })
  }

  const fieldStyle = { padding: '7px 10px', borderRadius: '7px', border: '1.5px solid rgba(124,58,237,0.2)', fontSize: '0.85rem', background: '#fff', width: '100%' }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Activities · Visits</p>
            <h2>{isNew ? 'New Visit' : 'Edit Visit'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <form onSubmit={save}>
          {/* Employee identity card */}
          <div className="trn-modal-card" style={{ marginBottom: '14px' }}>
            <div className="trn-modal-field-block">
              <span className="trn-modal-field-lbl">Employee ID</span>
              <input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                onBlur={(e) => handleEmpIdBlur(e.target.value)}
                placeholder="Enter ID — auto-fills details"
                style={{ ...fieldStyle, marginTop: '4px' }}
              />
            </div>
            <div className="trn-modal-detail-row" style={{ marginTop: '10px' }}>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Full Name</span>
                <input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} required placeholder="Name" style={fieldStyle} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">NIC / PP No.</span>
                <input value={nicPassportNo} onChange={(e) => setNicPassportNo(e.target.value)} placeholder="Passport or NIC number" style={fieldStyle} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Nationality</span>
                <select value={nationality} onChange={(e) => setNationality(e.target.value)} style={fieldStyle}>
                  {nationalities.map((n) => <option key={n}>{n}</option>)}
                </select>
              </label>
            </div>
            <div className="trn-modal-detail-row" style={{ gridTemplateColumns: '1fr', marginTop: '10px' }}>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Section</span>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} style={fieldStyle}>
                  <option value="">— select section —</option>
                  {departmentsList.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
            </div>
          </div>

          {/* Visit details card */}
          <div className="trn-modal-card">
            <div className="trn-modal-detail-row">
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Visit Type</span>
                <select value={visitType} onChange={(e) => setVisitType(e.target.value as VisitRecord['visitType'])} style={fieldStyle}>
                  <option>Visa Medical</option>
                  <option>Passport Renewal</option>
                  <option>Photo</option>
                  <option>Embassy Letter Collection</option>
                  <option>Biometric Update</option>
                </select>
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Visit Date</span>
                <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required style={fieldStyle} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as VisitRecord['status'])} style={fieldStyle}>
                  <option>Scheduled</option><option>Completed</option><option>Cancelled</option>
                </select>
              </label>
            </div>
            <div className="trn-modal-field-block" style={{ marginTop: '10px', marginBottom: 0 }}>
              <span className="trn-modal-field-lbl">Remarks</span>
              <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes" style={{ ...fieldStyle, marginTop: '4px' }} />
            </div>
          </div>

          <div className="modal-actions">
            <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
            <button className="primary-button" type="submit">{isNew ? 'Add Visit' : 'Save Changes'}</button>
          </div>
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
  const [section, setSection] = useState(record.section)
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

  const save = (e: FormEvent) => { e.preventDefault(); onSave({ ...record, incidentDate, timeOfIncident, employeeId, employeeName, reportedById, reportedByName, section, department, siteLocation, incidentType, incidentSummary, exactLocation, immediateCause, witnessName, witnessId, correctiveOwner, followUpDate, description, injuryInvolved, actionTaken, statementTaken, disciplinaryAction, status }) }

  const handleEmployeeIdChange = (value: string) => {
    setEmployeeId(value)
    const matched = employeeDirectory.get(value.trim().toUpperCase())
    if (!matched) return
    setEmployeeName(matched.fullName)
    setSection(matched.department)
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
        <div className="modal-header">
          <div>
            <p className="eyebrow">Activities · Incidents</p>
            <h2>{isNew ? 'Log Incident' : 'Edit Incident'}</h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>Enter IDs to auto-fill from the register. Fields remain editable.</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <form onSubmit={save}>
          <div className="incident-modal-stack">

            {/* Row 1: Core info */}
            <div className="trn-modal-card" style={{ marginBottom: 0 }}>
              <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'12px' }}>
                <span className="trn-modal-field-lbl" style={{ fontSize:'0.7rem' }}>Ref:</span>
                <strong style={{ fontSize:'0.85rem', color:'#4c1d95' }}>{isNew ? 'Auto on save' : record.id}</strong>
              </div>
              <div className="trn-modal-detail-row">
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Incident Date</span>
                  <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} required style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Time</span>
                  <select value={timeOfIncident} onChange={(e) => setTimeOfIncident(e.target.value as IncidentRecord['timeOfIncident'])} style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }}>
                    <option value="">Select...</option><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Night</option>
                  </select>
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Incident Type</span>
                  <select value={incidentType} onChange={(e) => setIncidentType(e.target.value as IncidentRecord['incidentType'])} style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }}>
                    <option>Work Injury</option><option>Near Miss</option><option>Property Damage</option><option>Fire</option><option>Misconduct</option><option>Sleeping on Duty</option><option>Other</option>
                  </select>
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Status</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value as IncidentRecord['status'])} style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }}>
                    <option>Open</option><option>Under Review</option><option>Closed</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="incident-split-grid">
              {/* Involved Staff */}
              <div className="trn-modal-card">
                <h3 className="incident-block-title">Involved Staff</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      <span className="trn-modal-field-lbl">Employee ID</span>
                      <input value={employeeId} onChange={(e) => handleEmployeeIdChange(e.target.value)} placeholder="Enter ID — auto-fills" style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                      {matchedEmployee && <small style={{ color:'#059669', fontSize:'0.7rem', fontWeight:600 }}>✓ {matchedEmployee.fullName}</small>}
                    </label>
                    <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      <span className="trn-modal-field-lbl">Employee Name</span>
                      <input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="Type or accept auto-fill" style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                    </label>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      <span className="trn-modal-field-lbl">Section</span>
                      <select value={section} onChange={(e) => setSection(e.target.value)} style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }}>
                        <option value="">Select...</option>{departmentsList.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </label>
                    <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      <span className="trn-modal-field-lbl">Department</span>
                      <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Broader dept / division" style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Reporter & flags */}
              <div className="trn-modal-card">
                <h3 className="incident-block-title">Reporter & Location</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      <span className="trn-modal-field-lbl">Reported By ID</span>
                      <input value={reportedById} onChange={(e) => handleReportedByIdChange(e.target.value)} placeholder="Enter ID" style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                      {matchedReporter && <small style={{ color:'#059669', fontSize:'0.7rem', fontWeight:600 }}>✓ {matchedReporter.fullName}</small>}
                    </label>
                    <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      <span className="trn-modal-field-lbl">Reported By Name</span>
                      <input value={reportedByName} onChange={(e) => setReportedByName(e.target.value)} placeholder="Type or auto-fill" style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                    </label>
                  </div>
                  <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                    <span className="trn-modal-field-lbl">Site / Location</span>
                    <input value={siteLocation} onChange={(e) => setSiteLocation(e.target.value)} placeholder="Workshop, gate, plant, room..." style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                  </label>
                  <div className="incident-check-grid">
                    <label className="incident-check-card"><input type="checkbox" checked={injuryInvolved} onChange={(e) => setInjuryInvolved(e.target.checked)} /><span>Injury</span></label>
                    <label className="incident-check-card"><input type="checkbox" checked={statementTaken} onChange={(e) => setStatementTaken(e.target.checked)} /><span>Statement</span></label>
                    <label className="incident-check-card"><input type="checkbox" checked={disciplinaryAction} onChange={(e) => setDisciplinaryAction(e.target.checked)} /><span>Disciplinary</span></label>
                  </div>
                </div>
              </div>
            </div>

            {/* Narrative */}
            <div className="trn-modal-card">
              <h3 className="incident-block-title">Narrative &amp; Follow-up</h3>
              <div className="trn-modal-detail-row" style={{ marginBottom:'10px' }}>
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Incident Summary</span>
                  <input value={incidentSummary} onChange={(e) => setIncidentSummary(e.target.value)} placeholder="Short headline" style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Exact Spot</span>
                  <input value={exactLocation} onChange={(e) => setExactLocation(e.target.value)} placeholder="Line, zone, unit" style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Immediate Cause</span>
                  <input value={immediateCause} onChange={(e) => setImmediateCause(e.target.value)} placeholder="Slip, tool issue, behavior" style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Follow-up Date</span>
                  <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                </label>
              </div>
              <div className="trn-modal-detail-row" style={{ marginBottom:'10px' }}>
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Witness Name</span>
                  <input value={witnessName} onChange={(e) => setWitnessName(e.target.value)} placeholder="Optional" style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Witness ID</span>
                  <input value={witnessId} onChange={(e) => setWitnessId(e.target.value)} placeholder="Optional" style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Corrective Owner</span>
                  <input value={correctiveOwner} onChange={(e) => setCorrectiveOwner(e.target.value)} placeholder="Responsible person" style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                </label>
              </div>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px', marginBottom:'10px' }}>
                <span className="trn-modal-field-lbl">Incident Description</span>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened?" style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff', resize:'vertical' }} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Action Taken</span>
                <textarea rows={2} value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="Immediate action and follow-up" style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff', resize:'vertical' }} />
              </label>
            </div>
          </div>
          <div className="modal-actions">
            <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
            <button className="primary-button" type="submit">{isNew ? 'Log Incident' : 'Save Changes'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

const priorityColors: Record<RequestPriority, string> = {
  Low: 'req-priority-low',
  Medium: 'req-priority-medium',
  High: 'req-priority-high',
}

function RequestsSection({ records, employees, onUpdate }: {
  records: StaffRequestRecord[]
  employees: Employee[]
  onUpdate: (fn: (prev: StaffRequestRecord[]) => StaffRequestRecord[]) => void
  onBack?: () => void
}) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editing, setEditing] = useState<StaffRequestRecord | null>(null)

  const filtered = useMemo(() => records.filter((r) =>
    `${r.employeeId} ${r.employeeName} ${r.department} ${r.requestType} ${r.description}`.toLowerCase().includes(search.toLowerCase())
    && (typeFilter === 'All' || r.requestType === typeFilter)
    && (statusFilter === 'All' || r.status === statusFilter)
  ), [records, search, typeFilter, statusFilter])

  const save = (r: StaffRequestRecord) => { onUpdate((prev) => { const idx = prev.findIndex((x) => x.id === r.id); return idx >= 0 ? prev.map((x) => x.id === r.id ? r : x) : [...prev, r] }); setEditing(null) }
  const del = (id: string) => onUpdate((prev) => prev.filter((x) => x.id !== id))

  const newReq = (): StaffRequestRecord => ({
    id: 'REQ-new', employeeId: '', employeeName: '', department: '', requestType: 'Accommodation',
    priority: 'Medium', description: '', submittedDate: new Date().toISOString().slice(0, 10),
    completedDate: '', status: 'Open', remarks: '',
  })

  return (
    <>
      <section className="employee-workspace">
        <div className="table-toolbar activities-toolbar">
          <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Emp ID, name, description" /></label>
          <label><span>Type</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option>Accommodation</option><option>Equipment</option><option>Transfer</option>
              <option>Leave</option><option>Documents</option><option>Other</option>
            </select>
          </label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="All">All Statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option><option>Rejected</option></select></label>
          <button className="primary-button" type="button" onClick={() => setEditing(newReq())}>+ Add Request</button>
        </div>
        <div className="employee-table-shell compact-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Emp ID</th><th>Employee</th><th>Section</th>
                <th style={{textAlign:'center'}}>Type</th>
                <th style={{textAlign:'center'}}>Priority</th>
                <th>Description</th>
                <th style={{textAlign:'center'}}>Submitted</th>
                <th style={{textAlign:'center'}}>Status</th>
                <th>Remarks</th>
                <th style={{textAlign:'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={11} className="empty-row">No requests found</td></tr>
                : filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={{fontSize:'0.75rem', color:'#6b7280'}}>{r.id}</td>
                    <td>{r.employeeId || '—'}</td>
                    <td>{r.employeeName}</td>
                    <td>{r.department}</td>
                    <td style={{textAlign:'center'}}><span className="req-type-chip">{r.requestType}</span></td>
                    <td style={{textAlign:'center'}}><span className={`req-priority-badge ${priorityColors[r.priority]}`}>{r.priority}</span></td>
                    <td>{r.description || '—'}</td>
                    <td style={{textAlign:'center'}}>{formatDateDisplay(r.submittedDate)}</td>
                    <td style={{textAlign:'center'}}><StatusBadge status={r.status} /></td>
                    <td>{r.remarks || '—'}</td>
                    <td style={{textAlign:'center'}}>
                      <div className="row-actions">
                        <button className="action-glyph edit" title="Edit" onClick={() => setEditing(r)} type="button">✎</button>
                        <button className="action-glyph delete" title="Delete" onClick={() => del(r.id)} type="button">🗑</button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing && <StaffRequestModal record={editing} employees={employees} onClose={() => setEditing(null)} onSave={save} />}
    </>
  )
}

function VisitsSection({ records, employees, onUpdate }: {
  records: VisitRecord[]
  employees: Employee[]
  onUpdate: (fn: (prev: VisitRecord[]) => VisitRecord[]) => void
  onBack?: () => void
}) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editing, setEditing] = useState<VisitRecord | null>(null)

  const filtered = useMemo(() => records.filter((r) =>
    `${r.employeeId} ${r.employeeName} ${r.department} ${r.nationality} ${r.nicPassportNo}`.toLowerCase().includes(search.toLowerCase())
    && (typeFilter === 'All' || r.visitType === typeFilter)
    && (statusFilter === 'All' || r.status === statusFilter)
  ), [records, search, typeFilter, statusFilter])

  const save = (r: VisitRecord) => { onUpdate((prev) => { const idx = prev.findIndex((x) => x.id === r.id); return idx >= 0 ? prev.map((x) => x.id === r.id ? r : x) : [...prev, r] }); setEditing(null) }
  const del = (id: string) => onUpdate((prev) => prev.filter((x) => x.id !== id))

  const newVisit = (): VisitRecord => ({
    id: 'VIS-new', employeeId: '', employeeName: '', department: '', nicPassportNo: '',
    nationality: nationalities[0], visitType: 'Visa Medical',
    visitDate: new Date().toISOString().slice(0, 10), status: 'Scheduled', remarks: '',
  })

  return (
    <>
      <section className="employee-workspace">
        <div className="table-toolbar activities-toolbar">
          <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID, name, NIC/PP, department" /></label>
          <label><span>Type</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option>Visa Medical</option><option>Passport Renewal</option><option>Photo</option>
              <option>Embassy Letter Collection</option><option>Biometric Update</option>
            </select>
          </label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="All">All Statuses</option><option>Scheduled</option><option>Completed</option><option>Cancelled</option></select></label>
          <button className="primary-button" type="button" onClick={() => setEditing(newVisit())}>+ Add Visit</button>
        </div>
        <div className="employee-table-shell compact-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Emp ID</th><th>Name</th><th>Section</th>
                <th>NIC / PP No.</th><th>Nationality</th>
                <th style={{textAlign:'center'}}>Visit Type</th>
                <th style={{textAlign:'center'}}>Date</th>
                <th style={{textAlign:'center'}}>Status</th>
                <th style={{textAlign:'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={10} className="empty-row">No visits found</td></tr>
                : filtered.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{textAlign:'center'}}>{i + 1}</td>
                    <td>{r.employeeId || '—'}</td>
                    <td>{r.employeeName}</td>
                    <td>{r.department}</td>
                    <td>{r.nicPassportNo || '—'}</td>
                    <td>{r.nationality}</td>
                    <td style={{textAlign:'center'}}><span className="req-type-chip">{r.visitType}</span></td>
                    <td style={{textAlign:'center'}}>{formatDateDisplay(r.visitDate)}</td>
                    <td style={{textAlign:'center'}}><StatusBadge status={r.status} /></td>
                    <td style={{textAlign:'center'}}>
                      <div className="row-actions">
                        <button className="action-glyph edit" title="Edit" onClick={() => setEditing(r)} type="button">✎</button>
                        <button className="action-glyph delete" title="Delete" onClick={() => del(r.id)} type="button">🗑</button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing && <VisitModal record={editing} employees={employees} onClose={() => setEditing(null)} onSave={save} />}
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
  const newIncident = (): IncidentRecord => ({ id: 'INC-new', incidentDate: new Date().toISOString().slice(0, 10), timeOfIncident: 'Morning', employeeId: '', employeeName: '', reportedById: '', reportedByName: '', section: departmentsList[0], department: '', siteLocation: '', incidentType: 'Work Injury', incidentSummary: '', exactLocation: '', immediateCause: '', witnessName: '', witnessId: '', correctiveOwner: '', followUpDate: '', description: '', injuryInvolved: false, actionTaken: '', statementTaken: false, disciplinaryAction: false, status: 'Open' })
  return (
    <>
      <section className="employee-workspace">
        <div className="table-toolbar activities-toolbar">
          <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Employee, type, location" /></label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="All">All Statuses</option><option>Open</option><option>Under Review</option><option>Closed</option></select></label>
          <button className="primary-button" type="button" onClick={() => setEditing(newIncident())}>+ Log Incident</button>
        </div>
        <div className="employee-table-shell compact-scroll"><table className="data-table"><thead><tr><th>Ref No.</th><th>Date</th><th>Time</th><th>Employee</th><th>Section</th><th>Department</th><th>Site / Location</th><th>Type</th><th>Injury</th><th>Statement</th><th>Disciplinary</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{filtered.length === 0 ? <tr><td colSpan={13} className="empty-row">No incidents found</td></tr> : filtered.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{formatDateDisplay(r.incidentDate)}</td>
              <td>{r.timeOfIncident || '—'}</td>
              <td>{r.employeeName || '—'}</td>
              <td>{r.section || '—'}</td>
              <td>{r.department || '—'}</td>
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
              <div className="induction-detail-row"><span>Section</span><strong>{viewing.section || '—'}</strong></div>
              <div className="induction-detail-row"><span>Department</span><strong>{viewing.department || '—'}</strong></div>
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

function ActivitiesPage({
  employees,
  passportHandovers,
  onUpdatePassport,
}: {
  employees: Employee[]
  passportHandovers: PassportHandoverRecord[]
  onUpdatePassport: (fn: (prev: PassportHandoverRecord[]) => PassportHandoverRecord[]) => void
}) {
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
        <button className={activeSection === 'passport' ? 'active' : ''} onClick={() => setActiveSection('passport')} type="button">Passport Tracking</button>
      </div>
      {activeSection === 'requests' && <RequestsSection records={staffRequests} employees={employees} onUpdate={setStaffRequests} onBack={() => {}} />}
      {activeSection === 'visits' && <VisitsSection records={visitRecords} employees={employees} onUpdate={setVisitRecords} onBack={() => {}} />}
      {activeSection === 'incidents' && <IncidentsSection records={incidentRecords} employees={employees} onUpdate={setIncidentRecords} onBack={() => {}} />}
      {activeSection === 'passport' && <PassportTrackingSection records={passportHandovers} employees={employees} onUpdate={onUpdatePassport} />}
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

      {/* Animated floating HR icon cards */}
      <div className="login-floats" aria-hidden="true">
        {/* Employee */}
        <div className="lf-card lf-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
        {/* Calendar */}
        <div className="lf-card lf-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
        {/* Document/File */}
        <div className="lf-card lf-3 lf-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
        {/* Team/People */}
        <div className="lf-card lf-4 lf-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        {/* Chart / Bar */}
        <div className="lf-card lf-5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg></div>
        {/* Briefcase */}
        <div className="lf-card lf-6 lf-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12"/></svg></div>
        {/* ID / Badge */}
        <div className="lf-card lf-7 lf-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2"/><path d="M15 12h2"/><path d="M7 16h10"/></svg></div>
        {/* Clock */}
        <div className="lf-card lf-8"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg></div>
        {/* Clipboard checklist */}
        <div className="lf-card lf-9 lf-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 12 2 2 4-4"/></svg></div>
        {/* Building */}
        <div className="lf-card lf-10 lf-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg></div>
        {/* Shield */}
        <div className="lf-card lf-11"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
        {/* Key */}
        <div className="lf-card lf-12 lf-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg></div>
        {/* Plane/Ticket (leave) */}
        <div className="lf-card lf-13 lf-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 21 4s-2 0-3.5 1.5L14 9 5.8 7.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 3.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg></div>
        {/* Activity/Pulse */}
        <div className="lf-card lf-14"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg></div>
        {/* Passport */}
        <div className="lf-card lf-15 lf-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="2" width="18" height="20" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 21v-1a5 5 0 0 1 10 0v1"/></svg></div>
        {/* Award / Star */}
        <div className="lf-card lf-16 lf-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></div>
      </div>

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
        <div className="login-headline-col login-animate-left">
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
        <div className="login-form-col login-animate-right">
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
  const [loggingOut, setLoggingOut] = useState(false)
  const login = () => { localStorage.setItem('tic_auth', '1'); setIsLoggedIn(true) }
  const logout = () => {
    setLoggingOut(true)
    setTimeout(() => { localStorage.removeItem('tic_auth'); setIsLoggedIn(false); setLoggingOut(false) }, 700)
  }
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
  const [exitInterviews, setExitInterviews] = useState<ExitInterviewRecord[]>(() => loadStore('tic_exit_interviews', initialExitInterviews))
  const [medicalCases, setMedicalCases] = useState<MedicalCaseRecord[]>(() => loadStore('tic_medical_cases', initialMedicalCases))
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [employeeMode, setEmployeeMode] = useState<'add' | 'edit'>('add')
  const [employeeForm, setEmployeeForm] = useState<EmployeeForm>(emptyEmployee)
  const [showPendingTasks, setShowPendingTasks] = useState(false)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [editingLeaveRequest, setEditingLeaveRequest] = useState<LeaveRequestRecord | null>(null)
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
  useEffect(() => { localStorage.setItem('tic_exit_interviews', JSON.stringify(exitInterviews)) }, [exitInterviews])
  useEffect(() => { localStorage.setItem('tic_medical_cases', JSON.stringify(medicalCases)) }, [medicalCases])

  const resetAllData = () => {
    if (!window.confirm('This will permanently delete ALL data (employees, leave records, etc.). Are you sure?')) return
    const keys = ['tic_employees','tic_leave_req','tic_leave_active','tic_leave_history','tic_passport','tic_term_notice','tic_term_done','tic_exit_interviews','tic_medical_cases']
    keys.forEach((k) => localStorage.removeItem(k))
    setEmployees([])
    setLeaveRequests([])
    setActiveLeaves([])
    setLeaveHistory([])
    setPassportHandovers([])
    setNoticeTerminations([])
    setCompletedTerminations([])
    setExitInterviews([])
    setMedicalCases([])
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

  // Convert DD-MM-YYYY, DD/MM/YYYY, or DD-Mon-YYYY (e.g. 25-Jun-2026) → YYYY-MM-DD
  const parseImportDate = (raw: string) => {
    if (!raw) return ''
    const s = raw.trim()
    // Numeric: DD-MM-YYYY or DD/MM/YYYY
    const dmY = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(s)
    if (dmY) return `${dmY[3]}-${dmY[2].padStart(2,'0')}-${dmY[1].padStart(2,'0')}`
    // Alpha-month: DD-Mon-YYYY or DD/Mon/YYYY (e.g. 25-Jun-2026)
    const monthMap: Record<string, string> = {
      jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
      jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'
    }
    const dMonY = /^(\d{1,2})[-/]([A-Za-z]{3,})[-/](\d{4})$/.exec(s)
    if (dMonY) {
      const m = monthMap[dMonY[2].toLowerCase().slice(0,3)]
      if (m) return `${dMonY[3]}-${m}-${dMonY[1].padStart(2,'0')}`
    }
    return s // already YYYY-MM-DD or unrecognised
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
    <div className={`app-shell${sidebarCollapsed ? ' sidebar-is-collapsed' : ''}${loggingOut ? ' app-logging-out' : ''}`}>
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
          {activePage === 'leave' && <LeavePage employees={employees} leaveRequests={leaveRequests} activeLeaves={activeLeaves} leaveHistory={leaveHistory} medicalCases={medicalCases} onAddRequest={() => { setEditingLeaveRequest(null); setShowLeaveForm(true) }} onEditRequest={(record) => { setEditingLeaveRequest(record); setShowLeaveForm(true) }} onDeleteRequest={deleteLeaveRequest} onAdvanceRequestStep={advanceLeaveRequestStep} onHistoryConfirm={updateHistoryConfirmation} onUpdateMedical={(fn) => setMedicalCases(fn)} />}
          {activePage === 'operations' && <OperationsPage employees={employees} completedTerminations={completedTerminations} />}
          {activePage === 'activities' && <ActivitiesPage employees={employees} passportHandovers={passportHandovers} onUpdatePassport={(fn) => setPassportHandovers(fn)} />}
          {activePage === 'termination' && <TerminationPage noticeTerminations={noticeTerminations} completedTerminations={completedTerminations} exitInterviews={exitInterviews} onAdd={openAddTermination} onEdit={openEditTermination} onAdvanceStatus={advanceTerminationStatus} onDelete={deleteTermination} onViewDetails={(record) => setTerminationDetails(record)} onUpdateExitInterviews={(fn) => setExitInterviews(fn)} />}
          {activePage === 'settings' && <SettingsPage employees={employees} leaveRequests={leaveRequests} activeLeaves={activeLeaves} onReset={resetAllData} />}
        </main>
      </div> {/* .workspace */}

      {showEmployeeForm && <EmployeeFormModal form={employeeForm} mode={employeeMode} onClose={() => setShowEmployeeForm(false)} onSave={saveEmployee} setForm={setEmployeeForm} />}
      {showPendingTasks && <PendingTasksModal employees={employees} onEdit={openEditEmployee} onClose={() => setShowPendingTasks(false)} />}
      {showLeaveForm && <LeaveFormModal employees={employees} initialRecord={editingLeaveRequest} onClose={() => { setShowLeaveForm(false); setEditingLeaveRequest(null) }} onSave={saveLeaveRequest} />}
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

