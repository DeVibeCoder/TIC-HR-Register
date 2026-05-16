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
  permanentAddress?: string
  presentAddress?: string
  qualification?: string
  experience?: string
  emergencyContact?: string
  bankDetails?: string
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

type InductionRecord = {
  id: string
  refNo: string
  employeeId: string
  name: string
  department: string
  inductionDate: string
  conductedBy: string
  inductionContent: string
  status: 'Completed' | 'Pending' | 'Scheduled'
  remarks: string
}

type TrainingRecord = {
  id: string
  trainingTitle: string
  date: string
  conductedBy: string
  trainingType: 'Internal' | 'External'
  participants: string[]
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
const nationalities = ['MALDIVIAN', 'INDIAN', 'BANGLADESHI', 'SRI LANKAN', 'NEPALESE', 'FINNISH', 'MALAYSIAN']

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
  { employeeId: '36693', fullName: 'ALI DIDI', department: 'ADMINISTRATION', designation: 'GENERAL MANAGER', nationality: 'MALDIVIAN', nicPassportNo: 'A026683', workPermitNo: '', dateOfJoin: '2007-12-01', mobileNo: '7786691', dateOfBirth: '1960-03-03', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '47149', fullName: 'HUSSAIN SHAHID', department: 'ADMINISTRATION', designation: 'DEPUTY GENERAL MANAGER', nationality: 'MALDIVIAN', nicPassportNo: 'A059738', workPermitNo: '', dateOfJoin: '2021-09-13', mobileNo: '7989870', dateOfBirth: '1966-10-13', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '41966', fullName: 'AHMED ALI', department: 'ADMINISTRATION', designation: 'OPERATIONS MANAGER', nationality: 'MALDIVIAN', nicPassportNo: 'A240435', workPermitNo: '', dateOfJoin: '2012-01-13', mobileNo: '9980110', dateOfBirth: '1993-03-07', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '56530', fullName: 'PUBUDU MADURANGA ALAWATHTHA KANKANAMGE', department: 'ADMINISTRATION', designation: 'PACKING & BAGGING CREW', nationality: 'SRI LANKAN', nicPassportNo: 'N9702660', workPermitNo: 'WP00601866', dateOfJoin: '2024-06-15', mobileNo: '7225658', dateOfBirth: '1998-12-17', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '50814', fullName: 'ARUSHULLA RASHID', department: 'HUMAN RESOURCES', designation: 'ADMINISTRATOR', nationality: 'MALDIVIAN', nicPassportNo: 'A254362', workPermitNo: '', dateOfJoin: '2019-07-22', mobileNo: '7654009', dateOfBirth: '2001-03-21', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Female' },
  { employeeId: '58692', fullName: 'SHANTUMON PATHIYIL CHACKO', department: 'HUMAN RESOURCES', designation: 'HR ADMINISTRATION SPECIALIST', nationality: 'INDIAN', nicPassportNo: 'C4846043', workPermitNo: 'WP00725382', dateOfJoin: '2025-10-10', mobileNo: '7260520', dateOfBirth: '1998-02-10', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '35494', fullName: 'GAMARALALAGE AJITH WIJESIRI', department: 'ACCOUNTS AND FINANCE', designation: 'SENIOR ACCOUNTANT', nationality: 'SRI LANKAN', nicPassportNo: 'N6296286', workPermitNo: 'WP00202472', dateOfJoin: '2007-05-01', mobileNo: '7665760', dateOfBirth: '1969-11-28', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '52804', fullName: 'AHMED IMRAN', department: 'ACCOUNTS AND FINANCE', designation: 'ACCOUNTS ASSISTANT', nationality: 'BANGLADESHI', nicPassportNo: 'A05854471', workPermitNo: 'WP00394323', dateOfJoin: '2020-11-16', mobileNo: '9422460', dateOfBirth: '1991-02-02', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '56646', fullName: 'CHANDRASHEKHER PURELLA', department: 'ACCOUNTS AND FINANCE', designation: 'ACCOUNTS ASSISTANT', nationality: 'INDIAN', nicPassportNo: 'P7063576', workPermitNo: 'WP00606434', dateOfJoin: '2024-07-16', mobileNo: '9157925', dateOfBirth: '1999-07-03', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '57935', fullName: 'ARUNODA KAVINDU NANAYAKKARA', department: 'ACCOUNTS AND FINANCE', designation: 'ACCOUNTS ASSISTANT', nationality: 'SRI LANKAN', nicPassportNo: 'P0284056', workPermitNo: 'WP00661094', dateOfJoin: '2025-04-10', mobileNo: '7986407', dateOfBirth: '1988-11-16', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '57637', fullName: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', designation: 'TRANSACTION SPECIALIST', nationality: 'INDIAN', nicPassportNo: 'T1139224', workPermitNo: 'WP00647914', dateOfJoin: '2025-02-01', mobileNo: '', dateOfBirth: '1994-05-10', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '56141', fullName: 'RAJU PERKA', department: 'CAFE', designation: 'TRANSACTION SPECIALIST', nationality: 'INDIAN', nicPassportNo: 'S3358854', workPermitNo: 'WP00585966', dateOfJoin: '2024-03-20', mobileNo: '9398452', dateOfBirth: '1999-05-24', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '50223', fullName: 'AYESHAN KUMARA WIJEYATHUNGA MUDALIGE', department: 'STORES', designation: 'STOREKEEPER', nationality: 'SRI LANKAN', nicPassportNo: 'N5366962', workPermitNo: 'WP00310428', dateOfJoin: '2019-03-21', mobileNo: '9837704', dateOfBirth: '1996-03-13', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '37916', fullName: 'JAGO', department: 'STORES', designation: 'STORE OPERATIONS SUPERVISOR', nationality: 'BANGLADESHI', nicPassportNo: 'R2320412', workPermitNo: 'WP00428783', dateOfJoin: '2008-08-21', mobileNo: '7727368', dateOfBirth: '1979-03-01', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '43407', fullName: 'MOHAMMAD DELOWAR HOSSAIN', department: 'STORES', designation: 'SENIOR ASSISTANT', nationality: 'BANGLADESHI', nicPassportNo: 'A03797309', workPermitNo: 'WP00031976', dateOfJoin: '2013-07-25', mobileNo: '9494380', dateOfBirth: '1986-02-04', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '44386', fullName: 'MAJIB', department: 'STORES', designation: 'SENIOR ASSISTANT', nationality: 'BANGLADESHI', nicPassportNo: 'EL0754008', workPermitNo: 'WP00079203', dateOfJoin: '2014-05-21', mobileNo: '7677578', dateOfBirth: '1972-01-01', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '53029', fullName: 'KUMARAN VAITHILINGAM', department: 'STORES', designation: 'ASSISTANT STOREKEEPER', nationality: 'INDIAN', nicPassportNo: 'N9611274', workPermitNo: 'WP00403148', dateOfJoin: '2022-01-05', mobileNo: '7514147', dateOfBirth: '1974-05-20', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '50427', fullName: 'MD SAIFUR RAHMAN', department: 'STORES', designation: 'SENIOR ASSISTANT', nationality: 'BANGLADESHI', nicPassportNo: 'A06214870', workPermitNo: 'WP00515811', dateOfJoin: '2019-05-06', mobileNo: '7742400', dateOfBirth: '1999-06-11', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '53979', fullName: 'NAVEEN SEKAR', department: 'STORES', designation: 'MATERIAL HANDLING OPERATOR', nationality: 'INDIAN', nicPassportNo: 'R3499139', workPermitNo: 'WP00441782', dateOfJoin: '2022-07-25', mobileNo: '7476327', dateOfBirth: '2001-05-04', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '55427', fullName: 'SARAVANAN RAJENDRAN', department: 'STORES', designation: 'STORE OPERATIONS CREW', nationality: 'INDIAN', nicPassportNo: 'R4247453', workPermitNo: 'WP00524039', dateOfJoin: '2023-08-08', mobileNo: '9978551', dateOfBirth: '2000-06-04', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
]

function createEmployees(): Employee[] {
  // All remaining employees from VHPL real dataset
  const allEmployees: Employee[] = [
    ...baseEmployees,
    { employeeId: '55692', fullName: 'MOHAMMAD NISAR', department: 'STORES', designation: 'STORE OPERATIONS CREW', nationality: 'INDIAN', nicPassportNo: 'V4828255', workPermitNo: 'WP00545111', dateOfJoin: '2023-11-06', mobileNo: '9728054', dateOfBirth: '2001-06-05', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '55866', fullName: 'MD SALEH AHMED', department: 'STORES', designation: 'STORE OPERATIONS CREW', nationality: 'BANGLADESHI', nicPassportNo: 'EH0537122', workPermitNo: 'WP00558905', dateOfJoin: '2023-12-31', mobileNo: '9938927', dateOfBirth: '2002-06-02', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '55864', fullName: 'RAKIB HUSEN', department: 'STORES', designation: 'STORE OPERATIONS CREW', nationality: 'BANGLADESHI', nicPassportNo: 'B00381623', workPermitNo: 'WP00558906', dateOfJoin: '2023-12-31', mobileNo: '9499458', dateOfBirth: '1998-03-12', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '56542', fullName: 'MOHAMMAD FOYSAL MASSTHAN', department: 'STORES', designation: 'STORE OPERATIONS CREW', nationality: 'BANGLADESHI', nicPassportNo: 'A03159939', workPermitNo: 'WP00602130', dateOfJoin: '2024-06-02', mobileNo: '9566780', dateOfBirth: '1992-02-02', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '56872', fullName: 'MOHAN MOHAN RAJ', department: 'STORES', designation: 'DISPATCH ASSISTANT', nationality: 'INDIAN', nicPassportNo: 'Y2147348', workPermitNo: 'WP00616219', dateOfJoin: '2024-09-03', mobileNo: '7987825', dateOfBirth: '2005-08-18', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '57015', fullName: 'AJITHKUMAR VELMURUGAN', department: 'STORES', designation: 'STORE OPERATIONS CREW', nationality: 'INDIAN', nicPassportNo: 'S6583653', workPermitNo: 'WP00620439', dateOfJoin: '2024-09-25', mobileNo: '7397460', dateOfBirth: '1997-06-01', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '57803', fullName: 'INDIKA SAMPATH SAMARASINGHEGE', department: 'STORES', designation: 'CRANE OPERATOR', nationality: 'SRI LANKAN', nicPassportNo: 'N10416975', workPermitNo: 'WP00654248', dateOfJoin: '2025-03-12', mobileNo: '', dateOfBirth: '1989-03-11', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '58034', fullName: 'SAMEERA MADUSANKA GUNARATHNA', department: 'STORES', designation: 'CRANE OPERATOR', nationality: 'SRI LANKAN', nicPassportNo: 'P0202237', workPermitNo: 'WP00668084', dateOfJoin: '2025-05-01', mobileNo: '', dateOfBirth: '2000-05-10', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '26486', fullName: 'MOHAMED SAMEER', department: 'STORES', designation: 'SENIOR DRIVER', nationality: 'MALDIVIAN', nicPassportNo: 'A101223', workPermitNo: '', dateOfJoin: '2001-02-05', mobileNo: '7991616', dateOfBirth: '1981-09-28', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '32545', fullName: 'AHMED RAUF', department: 'STORES', designation: 'HEAVY VEHICLE DRIVER', nationality: 'MALDIVIAN', nicPassportNo: 'A088013', workPermitNo: '', dateOfJoin: '2005-02-24', mobileNo: '7812131', dateOfBirth: '1985-04-14', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '57557', fullName: 'MOHAMED ASLAM UNISKHAN', department: 'STORES', designation: 'STORE OPERATIONS CREW', nationality: 'INDIAN', nicPassportNo: 'P0615141', workPermitNo: 'WP00643964', dateOfJoin: '2025-01-14', mobileNo: '', dateOfBirth: '1997-04-11', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '58686', fullName: 'YASAR ARAFATH BASHEER AHAMED', department: 'STORES', designation: 'DISPATCH SUPERVISOR', nationality: 'INDIAN', nicPassportNo: 'B7214529', workPermitNo: 'WP00722732', dateOfJoin: '2025-10-09', mobileNo: '', dateOfBirth: '1992-07-20', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '56863', fullName: 'MD HARUN MIAH', department: 'STORES', designation: 'STORE OPERATIONS CREW', nationality: 'BANGLADESHI', nicPassportNo: 'A06663404', workPermitNo: 'WP00616222', dateOfJoin: '2024-08-26', mobileNo: '', dateOfBirth: '1995-03-09', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '40780', fullName: 'MOHSIN MIAZI', department: 'HOUSEKEEPING', designation: 'HOUSEKEEPING OPERATIONS SUPERVISOR', nationality: 'BANGLADESHI', nicPassportNo: 'A11123060', workPermitNo: 'WP00202473', dateOfJoin: '2011-02-10', mobileNo: '7598249', dateOfBirth: '1984-08-13', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '37026', fullName: 'MD RIAZ UDDIN', department: 'HOUSEKEEPING', designation: 'ASSISTANT SUPERVISOR', nationality: 'BANGLADESHI', nicPassportNo: 'A07264062', workPermitNo: 'WP00024929', dateOfJoin: '2008-02-03', mobileNo: '9821456', dateOfBirth: '1983-12-22', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '44451', fullName: 'HOSSAIN ALAMIN', department: 'HOUSEKEEPING', designation: 'FACILITIES MAINTENANCE CREW', nationality: 'BANGLADESHI', nicPassportNo: 'EF0998050', workPermitNo: 'WP00078005', dateOfJoin: '2014-06-03', mobileNo: '7226814', dateOfBirth: '1988-06-20', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '49561', fullName: 'MD JOYNAL ABEDIN', department: 'HOUSEKEEPING', designation: 'FACILITIES MAINTENANCE CREW', nationality: 'BANGLADESHI', nicPassportNo: 'EJ0985210', workPermitNo: 'WP00299427', dateOfJoin: '2018-10-27', mobileNo: '9579237', dateOfBirth: '1981-08-03', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '49134', fullName: 'FARUK MIAH', department: 'HOUSEKEEPING', designation: 'FACILITIES MAINTENANCE CREW', nationality: 'BANGLADESHI', nicPassportNo: 'EJ0285596', workPermitNo: 'WP00282580', dateOfJoin: '2018-08-11', mobileNo: '9154977', dateOfBirth: '1984-05-01', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
    { employeeId: '56544', fullName: 'MOHAMMAD SOBIR AHAMMAD', department: 'HOUSEKEEPING', designation: 'FACILITIES MAINTENANCE CREW', nationality: 'BANGLADESHI', nicPassportNo: 'A08339817', workPermitNo: 'WP00603036', dateOfJoin: '2024-06-02', mobileNo: '', dateOfBirth: '1994-01-01', passportStatus: 'With Employee', siteStatus: 'On Site', gender: 'Male' },
  ]
  
  return allEmployees.sort((a, b) => a.department.localeCompare(b.department) || a.fullName.localeCompare(b.fullName))
}

const initialEmployees = createEmployees()

const initialLeaveRequests: LeaveRequestRecord[] = [
  { id: 'LVR-001', employeeId: 'VHPL-0031', name: 'Shiyam Ismail', department: 'Coordination', nationality: 'Maldivian', leaveTypeCode: 'FRL', departureDate: '2026-05-08', returnDate: '2026-05-12', days: 5, step: 'Approved' },
  { id: 'LVR-002', employeeId: 'VHPL-0063', name: 'Mohamed Zahir', department: 'Operations', nationality: 'Bangladeshi', leaveTypeCode: 'AL', departureDate: '2026-05-18', returnDate: '2026-06-02', days: 16, step: 'Dates Shared' },
  { id: 'LVR-003', employeeId: 'VHPL-0023', name: 'Mufeedh Ali', department: 'Safety', nationality: 'Maldivian', leaveTypeCode: 'PT', departureDate: '2026-05-21', returnDate: '2026-05-27', days: 7, step: 'Letter Submitted' },
]

const initialActiveLeaves: ActiveLeaveRecord[] = [
  { id: 'LVA-001', employeeId: 'VHPL-0014', name: 'Aishath Naza', department: 'Administration', nationality: 'Maldivian', leaveTypeCode: 'AL', departureDate: '2026-04-29', returnDate: '2026-05-06', days: 8, status: 'Departed' },
  { id: 'LVA-002', employeeId: 'VHPL-0108', name: 'Nimal Perera', department: 'Warehouse', nationality: 'Sri Lankan', leaveTypeCode: 'AL', departureDate: '2026-04-24', returnDate: '2026-05-12', days: 19, status: 'Departed' },
]

const initialLeaveHistory: LeaveHistoryRecord[] = [
  { id: 'LVH-001', employeeId: 'VHPL-0052', name: 'Hassan Latheef', department: 'Maintenance', nationality: 'Maldivian', leaveTypeCode: 'NP', departureDate: '2026-03-10', returnDate: '2026-03-20', days: 11 },
]

const initialPassportHandovers: PassportHandoverRecord[] = [
  { id: 'PP-001', employeeId: 'VHPL-0014', name: 'Aishath Naza', department: 'Administration', nationality: 'Maldivian', leaveTypeCode: 'AL', departureDate: '2026-04-29', returnDate: '2026-05-06', days: 8, passportStep: 'Collected', givenDate: '2026-04-28', remarks: 'Collected from HR desk' },
]

const initialNoticeTerminations: EnhancedTerminationRecord[] = [
  { id: 'TERM-001', employeeId: '37916', name: 'JAGO', department: 'STORES', designation: 'STORE OPERATIONS SUPERVISOR', nationality: 'BANGLADESHI', passportNo: 'R2320412', wpNo: 'WP00428783', dateOfJoin: '2008-08-21', dateSubmitted: '2026-04-10', lastWorkingDate: '2026-06-30', departureDate: '2026-07-15', currentStage: 'Letter Submitted', reasonForLeaving: 'Family reasons', satisfactionRating: 3, rehireEligible: true, exitInterviewCompleted: false, comments: '', terminationType: 'Resignation' },
  { id: 'TERM-002', employeeId: '44451', name: 'HOSSAIN ALAMIN', department: 'HOUSEKEEPING', designation: 'FACILITIES MAINTENANCE CREW', nationality: 'BANGLADESHI', passportNo: 'EF0998050', wpNo: 'WP00078005', dateOfJoin: '2014-06-03', dateSubmitted: '2026-04-20', lastWorkingDate: '2026-06-15', departureDate: '2026-07-30', currentStage: 'Exit Interview', reasonForLeaving: 'Better opportunity', satisfactionRating: 4, rehireEligible: true, exitInterviewCompleted: true, comments: 'Employee satisfied with work environment', terminationType: 'Resignation' },
  { id: 'TERM-003', employeeId: '53029', name: 'KUMARAN VAITHILINGAM', department: 'STORES', designation: 'ASSISTANT STOREKEEPER', nationality: 'INDIAN', passportNo: 'N9611274', wpNo: 'WP00403148', dateOfJoin: '2022-01-05', dateSubmitted: '2026-03-15', lastWorkingDate: '2026-05-31', departureDate: '2026-06-15', currentStage: 'Ticket', reasonForLeaving: 'Return to home country', satisfactionRating: 3, rehireEligible: true, exitInterviewCompleted: true, comments: 'Arranged return flight', terminationType: 'Resignation' },
  { id: 'TERM-004', employeeId: '50427', name: 'MD SAIFUR RAHMAN', department: 'STORES', designation: 'SENIOR ASSISTANT', nationality: 'BANGLADESHI', passportNo: 'A06214870', wpNo: 'WP00515811', dateOfJoin: '2019-05-06', dateSubmitted: '2026-02-01', lastWorkingDate: '2026-05-10', departureDate: '2026-05-20', currentStage: 'Pending Departure', reasonForLeaving: 'Contract not renewed', satisfactionRating: 2, rehireEligible: false, exitInterviewCompleted: true, comments: 'Final dues being processed', terminationType: 'Contract Expiry' },
]

const initialCompletedTerminations: CompletedTerminationRecord[] = [
  { id: 'TERM-C001', employeeId: 'VHPL-0044', name: 'Hussain Amir', department: 'Operations', designation: 'Plant Operator', nationality: 'Bangladeshi', passportNo: 'A01458962', wpNo: '', dateOfJoin: '2016-01-08', lastWorkingDate: '2026-03-18', departureDate: '2026-04-01', currentStage: 'Pending Departure', rehireEligible: true, exitInterviewCompleted: true, reasonForLeaving: 'Personal decision', comments: '', terminationType: 'Resignation' },
  { id: 'TERM-C002', employeeId: 'VHPL-0099', name: 'Ravi Menon', department: 'Maintenance', designation: 'Technician', nationality: 'Indian', passportNo: 'P1045682', wpNo: '', dateOfJoin: '2019-05-20', lastWorkingDate: '2026-02-02', departureDate: '2026-02-15', currentStage: 'Pending Departure', rehireEligible: false, exitInterviewCompleted: false, reasonForLeaving: 'Policy violation', comments: '', terminationType: 'Dismissal' },
]

const allTerminationStages: TerminationStage[] = ['Letter Submitted', 'Exit Interview', 'Ticket', 'Pending Departure']

const initialPersonalFiles: PersonalFileRecord[] = [
  { fileNo: '0001', employeeId: '36693', fullName: 'ALI DIDI', department: 'ADMINISTRATION', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '', remarks: '' },
  { fileNo: '0002', employeeId: '47149', fullName: 'HUSSAIN SHAHID', department: 'ADMINISTRATION', isFormerStaff: false, coc: true, jd: false, cont: true, contractExpiryDate: '', remarks: 'JD pending' },
  { fileNo: '0003', employeeId: '50814', fullName: 'ARUSHULLA RASHID', department: 'HUMAN RESOURCES', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2027-07-22', remarks: '' },
  { fileNo: '0004', employeeId: '58692', fullName: 'SHANTUMON PATHIYIL CHACKO', department: 'HUMAN RESOURCES', isFormerStaff: false, coc: false, jd: false, cont: false, contractExpiryDate: '2027-10-10', remarks: 'Documents pending collection' },
  { fileNo: '0005', employeeId: '35494', fullName: 'GAMARALALAGE AJITH WIJESIRI', department: 'ACCOUNTS AND FINANCE', isFormerStaff: false, coc: true, jd: true, cont: true, contractExpiryDate: '2026-12-31', remarks: '' },
  { fileNo: '0006', employeeId: '50223', fullName: 'AYESHAN KUMARA WIJEYATHUNGA MUDALIGE', department: 'STORES', isFormerStaff: false, coc: true, jd: true, cont: false, contractExpiryDate: '2026-09-30', remarks: 'Contract renewal pending' },
  { fileNo: '0007', employeeId: 'EX-001', fullName: 'HUSSAIN AMIR', department: 'OPERATIONS', isFormerStaff: true, coc: true, jd: true, cont: true, contractExpiryDate: '2026-03-31', remarks: 'Left March 2026 – Resignation' },
]

const initialInductionRecords: InductionRecord[] = [
  { id: 'IND-001', refNo: 'IND-REF-001', employeeId: '36693', name: 'ALI DIDI', department: 'ADMINISTRATION', inductionDate: '2021-03-15', conductedBy: 'Arushulla Rashid', inductionContent: 'General site orientation covering workplace safety rules, emergency procedures, site layout, HR policies, code of conduct, and employee responsibilities. Staff was briefed on accommodation rules, mess timings, and reporting procedures.', status: 'Completed', remarks: '' },
  { id: 'IND-002', refNo: 'IND-REF-002', employeeId: '50814', name: 'ARUSHULLA RASHID', department: 'HUMAN RESOURCES', inductionDate: '2020-08-10', conductedBy: 'Arushulla Rashid', inductionContent: 'HR department induction: introduction to HR processes, leave management system, payroll procedures, employee record keeping, confidentiality policy, and access to HR systems.', status: 'Completed', remarks: '' },
  { id: 'IND-003', refNo: 'IND-REF-003', employeeId: '50223', name: 'AYESHAN KUMARA WIJEYATHUNGA MUDALIGE', department: 'STORES', inductionDate: '2022-03-21', conductedBy: 'Shantumon Pathiyil Chacko', inductionContent: 'Stores department induction: material handling procedures, inventory management, store safety, PPE requirements, forklift zone awareness, and emergency evacuation route for the stores building.', status: 'Completed', remarks: '' },
  { id: 'IND-004', refNo: 'IND-REF-004', employeeId: '58692', name: 'SHANTUMON PATHIYIL CHACKO', department: 'HUMAN RESOURCES', inductionDate: '', conductedBy: '', inductionContent: '', status: 'Pending', remarks: 'Schedule with HR team' },
]

const initialTrainingRecords: TrainingRecord[] = [
  { id: 'TRN-001', trainingTitle: 'Fire Safety & Emergency Response', date: '2024-01-15', conductedBy: 'Ahmed Ali', trainingType: 'Internal', participants: ['ALI DIDI', 'HUSSAIN SHAHID', 'ARUSHULLA RASHID', 'AHMED ALI', 'SHANTUMON PATHIYIL CHACKO'], status: 'Completed', remarks: 'Annual refresher – renewal due Jan 2026' },
  { id: 'TRN-002', trainingTitle: 'First Aid & CPR', date: '2025-03-10', conductedBy: 'External Trainer – Maldives Red Crescent', trainingType: 'External', participants: ['ARUSHULLA RASHID', 'SHANTUMON PATHIYIL CHACKO', 'GAMARALALAGE AJITH WIJESIRI'], status: 'Completed', remarks: '' },
  { id: 'TRN-003', trainingTitle: 'Forklift & Crane Operation Safety', date: '2022-06-01', conductedBy: 'Mohamed Sameer', trainingType: 'Internal', participants: ['AYESHAN KUMARA WIJEYATHUNGA MUDALIGE', 'JAGO', 'NAVEEN SEKAR', 'SARAVANAN RAJENDRAN', 'MOHAN MOHAN RAJ'], status: 'Pending', remarks: 'Renewal overdue – retrain required' },
  { id: 'TRN-004', trainingTitle: 'Hazardous Materials Handling', date: '2025-07-20', conductedBy: 'Ahmed Ali', trainingType: 'Internal', participants: ['JAGO', 'MOHAMMAD DELOWAR HOSSAIN', 'KUMARAN VAITHILINGAM', 'MD SAIFUR RAHMAN'], status: 'Completed', remarks: '' },
  { id: 'TRN-005', trainingTitle: 'Supervisory & Leadership Skills', date: '2023-11-15', conductedBy: 'External Trainer – MNU', trainingType: 'External', participants: ['HUSSAIN SHAHID', 'AHMED ALI', 'MOHSIN MIAZI'], status: 'Pending', remarks: 'Renewal needed' },
]

const initialStaffRequests: StaffRequestRecord[] = [
  { id: 'REQ-001', employeeName: 'Adam Rasheed', department: 'Operations', requestType: 'Accommodation', description: 'Requesting accommodation change to Block B', submittedDate: '2026-05-02', completedDate: '', status: 'Open', remarks: '' },
  { id: 'REQ-002', employeeName: 'Nimal Perera', department: 'Warehouse', requestType: 'Documents', description: 'Employment confirmation letter required for visa', submittedDate: '2026-04-28', completedDate: '', status: 'In Progress', remarks: 'Letter being prepared' },
  { id: 'REQ-003', employeeName: 'Shiyam Ismail', department: 'Coordination', requestType: 'Equipment', description: 'New PPE set requested — boots and gloves', submittedDate: '2026-04-25', completedDate: '2026-04-27', status: 'Resolved', remarks: 'Issued on 27 Apr' },
]

const initialVisitRecords: VisitRecord[] = [
  { id: 'VIS-001', employeeId: '56543', employeeName: 'MD MASUD ALOM', department: 'STAFF MESS', nationality: 'BANGLADESHI', visitType: 'Visa Medical', visitDate: '2026-03-02', status: 'Completed', remarks: '' },
  { id: 'VIS-002', employeeId: '55428', employeeName: 'ARNEL SARABIA CARAMPATAN', department: 'MECHANICAL', nationality: 'FILIPINO', visitType: 'Visa Medical', visitDate: '2026-03-02', status: 'Completed', remarks: '' },
  { id: 'VIS-003', employeeId: '56678', employeeName: 'AJITH ARUL SELVASAMY PUSHPPANATHAN', department: 'FUEL FARM', nationality: 'INDIAN', visitType: 'Visa Medical', visitDate: '2026-03-03', status: 'Completed', remarks: '' },
  { id: 'VIS-004', employeeId: '57967', employeeName: 'NALLATHAMBI DURAISAMY', department: 'BATCHING PLANT', nationality: 'INDIAN', visitType: 'Visa Medical', visitDate: '2026-03-03', status: 'Completed', remarks: '' },
  { id: 'VIS-005', employeeId: '53979', employeeName: 'NAVEEN SEKAR', department: 'STORES', nationality: 'INDIAN', visitType: 'Visa Medical', visitDate: '2026-03-03', status: 'Completed', remarks: '' },
  { id: 'VIS-006', employeeId: '56544', employeeName: 'MOHAMMAD SOBIR AHAMMAD', department: 'HOUSEKEEPING', nationality: 'BANGLADESHI', visitType: 'Visa Medical', visitDate: '2026-03-04', status: 'Completed', remarks: '' },
  { id: 'VIS-007', employeeId: '55427', employeeName: 'SARAVANAN RAJENDRAN', department: 'STORES', nationality: 'INDIAN', visitType: 'Embassy Letter Collection', visitDate: '2026-04-09', status: 'Completed', remarks: '' },
  { id: 'VIS-008', employeeId: '57557', employeeName: 'MOHAMED ASLAM UNISKHAN', department: 'STORES', nationality: 'INDIAN', visitType: 'Passport Renewal', visitDate: '2026-04-12', status: 'Completed', remarks: '' },
  { id: 'VIS-009', employeeId: '59584', employeeName: 'MARUTHUPANDIYAN DURAIRAJ', department: 'LOSS PREVENTION', nationality: 'INDIAN', visitType: 'Photo', visitDate: '2026-04-16', status: 'Completed', remarks: '' },
  { id: 'VIS-010', employeeId: '56863', employeeName: 'MD HARUN MIAH', department: 'STORES', nationality: 'BANGLADESHI', visitType: 'Visa Medical', visitDate: '2026-04-23', status: 'Completed', remarks: '' },
  { id: 'VIS-011', employeeId: '52806', employeeName: 'MOHAMMED ABDUS SALAM', department: 'FUEL FARM', nationality: 'BANGLADESHI', visitType: 'Visa Medical', visitDate: '2026-04-26', status: 'Completed', remarks: '' },
  { id: 'VIS-012', employeeId: '58121', employeeName: 'DANASIRI SILVA KALUPERUMA', department: 'KITCHEN', nationality: 'SRI LANKAN', visitType: 'Visa Medical', visitDate: '2026-04-29', status: 'Completed', remarks: '' },
]

const initialIncidentRecords: IncidentRecord[] = [
  { id: 'INC-001', incidentDate: '2026-01-26', timeOfIncident: 'Evening', employeeId: '57360', employeeName: 'ZAHIR', reportedById: '57978', reportedByName: 'MD NOOR ALAM MIA', department: 'QMARINE', siteLocation: 'QMARINE WELDING WORKSHOP', incidentType: 'Work Injury', description: 'After undocking Villa Roalhi 33 and during keeping the spreader on top of welding workshop, he was required to remove the cables. While removing the cables he lost focus and the cable hit him which made him lose balance and fell inside the workshop and sustained an injury on left shin.', injuryInvolved: true, actionTaken: 'Staff was immediately sent to Male\' IGMH for medical by a speedboat. Necessary actions were taken however LP was not informed on the incident.', statementTaken: false, disciplinaryAction: true, status: 'Closed' },
  { id: 'INC-002', incidentDate: '2026-01-29', timeOfIncident: 'Evening', employeeId: '51558', employeeName: 'VINAYAGAM', reportedById: '58416', reportedByName: 'MD RIPON HOSSAIN', department: 'CEMENT PLANT', siteLocation: 'CEMENT PLANT', incidentType: 'Work Injury', description: 'During evening duty at the cement plant, the worker fainted while loading activities were ongoing. At that time, he complained of chest pain.', injuryInvolved: true, actionTaken: 'Sent to Male\' IGMH for medical by speedboat.', statementTaken: false, disciplinaryAction: true, status: 'Closed' },
  { id: 'INC-003', incidentDate: '2026-02-06', timeOfIncident: 'Morning', employeeId: '58692', employeeName: 'SHANTUMON', reportedById: '57622', reportedByName: 'SACHIDA NAND SINGH', department: 'MECHANICAL', siteLocation: 'MESS HALL', incidentType: 'Misconduct', description: 'During morning breakfast time, he attended a phone call in the mess hall and was speaking loudly. The mess staff informed him loud noise not allowed inside the mess hall and asked him to step outside. At that time, he argued with the staff and raised his voice.', injuryInvolved: false, actionTaken: 'Staff was brought to HR and briefed on maintaining discipline at places and respect all staff at all times.', statementTaken: false, disciplinaryAction: false, status: 'Closed' },
  { id: 'INC-004', incidentDate: '2026-02-06', timeOfIncident: 'Morning', employeeId: '31606', employeeName: 'AHMED', reportedById: '52684', reportedByName: 'KARANRAJ GANESAN', department: 'POWER HOUSE', siteLocation: 'POWER HOUSE', incidentType: 'Sleeping on Duty', description: 'He was found sleeping during assigned duty hours.', injuryInvolved: false, actionTaken: '', statementTaken: false, disciplinaryAction: true, status: 'Closed' },
  { id: 'INC-005', incidentDate: '2026-02-25', timeOfIncident: 'Afternoon', employeeId: '52808', employeeName: 'HOSSAIN EMRAN', reportedById: '58509', reportedByName: 'MD KAWSER ALI', department: 'ROOFING FACTORY', siteLocation: 'ROOFING FACTORY', incidentType: 'Work Injury', description: 'During machine cleaning operations, the worker\'s finger became caught in the roller mechanism, resulting in an injury.', injuryInvolved: true, actionTaken: 'The staff member was brought to the HR office, a statement was taken.', statementTaken: true, disciplinaryAction: false, status: 'Closed' },
  { id: 'INC-006', incidentDate: '2026-03-10', timeOfIncident: 'Morning', employeeId: '58121', employeeName: 'SILVA', reportedById: '44960', reportedByName: 'NIZAM UDDIN', department: 'KITCHEN', siteLocation: 'KITCHEN', incidentType: 'Work Injury', description: 'During duty hours, while performing his assigned tasks, the staff member accidentally got his finger stuck in the wall gap between the chillers.', injuryInvolved: true, actionTaken: 'Male\' IGMH for medical treatment by speedboat. Afterward, the staff member was brought to the HR office, where a statement was taken.', statementTaken: true, disciplinaryAction: false, status: 'Closed' },
  { id: 'INC-007', incidentDate: '2026-04-04', timeOfIncident: 'Morning', employeeId: '52558', employeeName: 'ALAVUDEEN', reportedById: '56985', reportedByName: 'MATHEWS THOMAS', department: 'LOSS PREVENTION', siteLocation: 'MAIN GATE', incidentType: 'Misconduct', description: 'LP officer argued with executive for duty assigned location.', injuryInvolved: false, actionTaken: 'He is advised not to repeat the same again and if repeated in future further action will be taken. Issued verbal warning.', statementTaken: false, disciplinaryAction: false, status: 'Closed' },
  { id: 'INC-008', incidentDate: '2026-04-13', timeOfIncident: 'Morning', employeeId: '', employeeName: '', reportedById: '55996', reportedByName: 'SAIM MIA', department: 'FUEL FARM', siteLocation: 'FUEL FARM', incidentType: 'Work Injury', description: 'During work time try to cut one pipe with cutter and slip the cutter and finger injured.', injuryInvolved: true, actionTaken: 'Provided first AID', statementTaken: false, disciplinaryAction: false, status: 'Open' },
]

const emptyEmployee: EmployeeForm = {
  employeeId: '',
  fullName: '',
  department: 'Operations',
  designation: '',
  nationality: 'Maldivian',
  nicPassportNo: '',
  workPermitNo: '',
  dateOfJoin: new Date().toISOString().slice(0, 10),
  mobileNo: '',
  dateOfBirth: '',
  passportStatus: 'With Employee',
  siteStatus: 'Off Site',
  gender: '',
  permanentAddress: '',
  presentAddress: '',
  qualification: '',
  experience: '',
  emergencyContact: '',
  bankDetails: '',
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
  return `${day}-${month}-${year}`
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
    ['Passport Status', employee.passportStatus],
    ...(employee.nationality === 'Maldivian' ? [] : [['WP No', employee.workPermitNo]]),
  ].filter(([, value]) => !value || String(value).startsWith('PENDING-')).map(([label]) => label)
}

function recordStatus(employee: Employee): RecordStatus {
  return getPendingTasks(employee).length ? 'Pending' : 'Active'
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge ${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>
}

function PageHeader(_props: { eyebrow: string; title: string; subtitle: string }) {
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

function parseCsv(text: string) {
  return text.split(/\r?\n/).filter(Boolean).map((line) => line.split(',').map((value) => value.replace(/^"|"$/g, '').replaceAll('""', '"').trim()))
}

function OverviewPage({ employees, leaveRequests, activeLeaves, leaveHistory }: { employees: Employee[]; leaveRequests: LeaveRequestRecord[]; activeLeaves: ActiveLeaveRecord[]; leaveHistory: LeaveHistoryRecord[] }) {
  const pendingTasks = employees.filter((employee) => recordStatus(employee) === 'Pending')
  const onSite = employees.filter((employee) => employee.siteStatus === 'On Site').length
  const onLeave = activeLeaves.length
  const pendingLeave = leaveRequests.length
  const completedLeave = leaveHistory.length
  const projectTime = Math.round((onSite / Math.max(1, employees.length)) * 100)
  const output = Math.round((completedLeave / Math.max(1, pendingLeave + completedLeave)) * 100)
  const weeklyHours = 6.1

  return (
    <section className="nx-overview">
      <div className="nx-hero">
        <div>
          <h1>Welcome in, TIC HR</h1>
          <div className="nx-track-row">
            <div className="nx-track-item"><span>Interviews</span><strong>{pendingLeave}</strong></div>
            <div className="nx-track-item"><span>Hired</span><strong>{onSite}</strong></div>
            <div className="nx-track-item wide"><span>Project time</span><strong>{projectTime}%</strong><div className="nx-track-bar"><i style={{ width: `${projectTime}%` }} /></div></div>
            <div className="nx-track-item"><span>Output</span><strong>{output}%</strong></div>
          </div>
        </div>
        <div className="nx-kpis">
          <article><strong>{employees.length}</strong><span>Employee</span></article>
          <article><strong>{onSite}</strong><span>Hirings</span></article>
          <article><strong>{pendingTasks.length + completedLeave + onLeave}</strong><span>Projects</span></article>
        </div>
      </div>

      <div className="nx-grid">
        <article className="nx-profile-card">
          <div className="nx-profile-photo"><span>{employees[0]?.fullName?.[0] ?? 'E'}</span></div>
          <div className="nx-profile-meta">
            <strong>{employees[0]?.fullName ?? 'Employee'}</strong>
            <p>{employees[0]?.designation ?? 'Team Member'}</p>
            <button type="button">$1,200</button>
          </div>
          <div className="nx-profile-list">
            <div><span>Pension contributions</span><em>{onSite}</em></div>
            <div><span>Devices</span><em>{employees.length > 0 ? '1' : '0'}</em></div>
            <div><span>Compensation Summary</span><em>View</em></div>
            <div><span>Employee Benefits</span><em>View</em></div>
          </div>
        </article>

        <div className="nx-center-stack">
          <div className="nx-cards-row">
            <article className="nx-widget">
              <header><h3>Progress</h3><span>↗</span></header>
              <div className="nx-progress-head"><strong>{weeklyHours}h</strong><small>Work Time This week</small></div>
              <div className="nx-week-bars">
                {[32, 46, 38, 58, 44, 66, 50].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
              </div>
            </article>

            <article className="nx-widget">
              <header><h3>Time tracker</h3><span>↗</span></header>
              <div className="nx-time-ring"><div><strong>02:35</strong><small>Work Time</small></div></div>
              <div className="nx-player"><button type="button">▶</button><button type="button">⏸</button><button type="button">◼</button></div>
            </article>
          </div>

          <article className="nx-schedule">
            <div className="nx-month-strip"><span>August</span><span>September 2024</span><span>October</span></div>
            <div className="nx-event-row"><strong>Weekly Team Sync</strong><small>Discuss progress and priorities</small></div>
            <div className="nx-event-row light"><strong>Onboarding Session</strong><small>Introduction for new staff</small></div>
          </article>
        </div>

        <article className="nx-onboarding">
          <div className="nx-onboard-head"><h3>Onboarding</h3><strong>18%</strong></div>
          <div className="nx-onboard-gauge"><span style={{ width: '30%' }} /><span style={{ width: '25%' }} /><span style={{ width: '45%' }} /></div>
          <div className="nx-onboard-panel">
            <header><strong>Onboarding Task</strong><span>2/8</span></header>
            <ul>
              {[...leaveRequests, ...activeLeaves].slice(0, 4).map((record) => <li key={record.id}><span>{record.name}</span><small>{record.department}</small></li>)}
            </ul>
          </div>
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
    if (key === 'nationality' && value === 'Maldivian') next.workPermitNo = ''
    setForm(next)
  }
  const wpDisabled = form.nationality === 'Maldivian'

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal wide-modal" role="dialog" aria-modal="true" aria-labelledby="registration-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{mode === 'add' ? 'Initial registration' : 'Update employee'}</p>
            <h2 id="registration-title">Employee Registration Form</h2>
            <p>Structured like the registration PDF: save incomplete data now and complete the record later.</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">x</button>
        </div>

        <div className="form-section"><h3>Personal Details</h3><div className="form-grid">
          <label><span>Full Name</span><input disabled={mode === 'edit'} value={form.fullName} onChange={(event) => update('fullName', event.target.value)} /></label>
          <label><span>Date of Birth</span><input type="date" value={form.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)} /></label>
          <label><span>Contact Details</span><input value={form.mobileNo} onChange={(event) => update('mobileNo', event.target.value)} /></label>
          <label><span>Nationality</span><select value={form.nationality} onChange={(event) => update('nationality', event.target.value)}>{nationalities.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Gender</span><select value={form.gender ?? ''} onChange={(event) => update('gender', event.target.value)}><option></option><option>Male</option><option>Female</option></select></label>
          <label><span>NIC/PP No</span><input value={form.nicPassportNo} onChange={(event) => update('nicPassportNo', event.target.value)} /></label>
        </div></div>

        <div className="form-section"><h3>Employment Details</h3><div className="form-grid">
          <label><span>Employee ID</span><input value={form.employeeId} onChange={(event) => update('employeeId', event.target.value)} /></label>
          <label><span>Department</span><select value={form.department} onChange={(event) => update('department', event.target.value)}>{departmentsList.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Designation</span><input value={form.designation} onChange={(event) => update('designation', event.target.value)} /></label>
          <label><span>Date of Join</span><input type="date" value={form.dateOfJoin} onChange={(event) => update('dateOfJoin', event.target.value)} /></label>
          <label><span>WP No</span><input disabled={wpDisabled} value={wpDisabled ? '' : form.workPermitNo} onChange={(event) => update('workPermitNo', event.target.value)} /></label>
          <label><span>Site Status</span><select value={form.siteStatus} onChange={(event) => update('siteStatus', event.target.value as SiteStatus)}><option>On Site</option><option>Off Site</option><option>On Leave</option></select></label>
        </div></div>

        <div className="modal-actions">
          <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
          <button className="primary-button" onClick={onSave} type="button">{mode === 'add' ? 'Save Registration' : 'Update Record'}</button>
        </div>
      </section>
    </div>
  )
}

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
  const [department, setDepartment] = useState('All Departments')
  const [status, setStatus] = useState('All Statuses')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(50)
  const departments = useMemo(() => ['All Departments', ...Array.from(new Set(employees.map((employee) => employee.department))).sort()], [employees])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return [...employees].filter((employee) => {
      const haystack = [employee.employeeId, employee.fullName, employee.department, employee.designation, employee.nationality, employee.nicPassportNo, employee.workPermitNo, employee.mobileNo].join(' ').toLowerCase()
      return haystack.includes(normalized) && (department === 'All Departments' || employee.department === department) && (status === 'All Statuses' || employee.siteStatus === status)
    }).sort((a, b) => a.department.localeCompare(b.department) || a.fullName.localeCompare(b.fullName))
  }, [department, employees, query, status])

  const totalPages = pageSize === 'All' ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const visibleRows = pageSize === 'All' ? filtered : filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const setFilter = (setter: (value: string) => void, value: string) => { setter(value); setPage(1) }

  return (
    <>
      <PageHeader eyebrow="Employee register" title="Employees" subtitle="TIC Employee Details in one place with site status" />
      <section className="employee-workspace">
        <div className="table-actions">
          <div className="table-actions-left"><button className="primary-button" onClick={onTemplate} type="button">Template</button><button className="primary-button" onClick={onImport} type="button">Import</button></div>
          <div className="table-actions-right"><button className="primary-button" onClick={onShowTasks} type="button">Pending Tasks</button><button className="primary-button" onClick={onExport} type="button">Export</button><button className="primary-button" onClick={onAdd} type="button">Add Employee</button></div>
        </div>
        <div className="table-toolbar employee-toolbar">
          <label className="search-field"><span>Search</span><input onChange={(event) => setFilter(setQuery, event.target.value)} placeholder="Name, ID, department, designation, passport, permit..." type="search" value={query} /></label>
          <label><span>Department</span><select onChange={(event) => setFilter(setDepartment, event.target.value)} value={department}>{departments.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Status</span><select onChange={(event) => setFilter(setStatus, event.target.value)} value={status}>{['All Statuses', 'On Site', 'Off Site', 'On Leave'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Rows</span><select onChange={(event) => { setPageSize(event.target.value === 'All' ? 'All' : Number(event.target.value) as 50 | 100); setPage(1) }} value={pageSize}><option>50</option><option>100</option><option>All</option></select></label>
        </div>
        <div className="employee-table-shell">
          <table className="data-table employee-table">
            <thead><tr><th>#</th><th>Employee ID</th><th>Full Name</th><th>Department</th><th>Designation</th><th>Nationality</th><th>NIC/PP No</th><th>WP No</th><th>Date of Join</th><th>Mobile No</th><th>Date of Birth</th><th>Age</th><th>Site Status</th><th>Action</th></tr></thead>
            <tbody>
              {visibleRows.map((employee, index) => (
                <tr className={`${recordStatus(employee) === 'Pending' ? 'pending-row' : ''} status-row-${employee.siteStatus.toLowerCase().replaceAll(' ', '-')}`} key={`${employee.employeeId}-${employee.fullName}`}>
                  <td>{pageSize === 'All' ? index + 1 : (safePage - 1) * pageSize + index + 1}</td><td>{employee.employeeId || 'Pending'}</td><td>{employee.fullName}</td><td>{employee.department}</td><td>{employee.designation}</td><td>{employee.nationality}</td><td>{employee.nicPassportNo}</td><td>{employee.nationality === 'Maldivian' ? '' : employee.workPermitNo || 'Pending'}</td><td>{formatDateDisplay(employee.dateOfJoin)}</td><td>{employee.mobileNo}</td><td>{employee.dateOfBirth ? formatDateDisplay(employee.dateOfBirth) : '-'}</td><td>{calculateAge(employee.dateOfBirth)}</td><td><StatusBadge status={employee.siteStatus} /></td><td><button className="action-glyph edit" onClick={() => onEdit(employee)} type="button" title="Edit" aria-label="Edit employee">✎</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && <div className="table-footer"><span>Showing {visibleRows.length ? (pageSize === 'All' ? 1 : (safePage - 1) * pageSize + 1) : 0}-{pageSize === 'All' ? filtered.length : Math.min(safePage * pageSize, filtered.length)} of {filtered.length}</span><div><button className="quiet-button light" disabled={safePage === 1 || pageSize === 'All'} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">Previous</button><strong>{safePage} / {totalPages}</strong><button className="quiet-button light" disabled={safePage === totalPages || pageSize === 'All'} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} type="button">Next</button></div></div>}
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
  const [employeeId, setEmployeeId] = useState(initialRecord?.employeeId ?? employees[0]?.employeeId ?? '')
  const [leaveTypeCode, setLeaveTypeCode] = useState<LeaveTypeCode>(initialRecord?.leaveTypeCode ?? 'AL')
  const [departureDate, setDepartureDate] = useState(initialRecord?.departureDate ?? new Date().toISOString().slice(0, 10))
  const [returnDate, setReturnDate] = useState(initialRecord?.returnDate ?? new Date().toISOString().slice(0, 10))
  const [step, setStep] = useState<LeaveRequestStep>(initialRecord?.step ?? 'Letter Submitted')
  const employee = employees.find((item) => item.employeeId === employeeId) ?? employees[0]

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header"><div><p className="eyebrow">Leave request</p><h2>{initialRecord ? 'Edit Leave Request' : 'Add Leave Request'}</h2><p>Operational request workflow with automatic movement to active leaves.</p></div><button className="icon-button" onClick={onClose} type="button">x</button></div>
        <div className="form-grid">
          <label><span>Employee</span><select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>{employees.slice(0, 120).map((item) => <option key={item.employeeId} value={item.employeeId}>{item.employeeId} - {item.fullName}</option>)}</select></label>
          <label><span>Purpose</span><select value={leaveTypeCode} onChange={(event) => setLeaveTypeCode(event.target.value as LeaveTypeCode)}>{leaveTypeOptions.map((item) => <option key={item.code} value={item.code}>{item.label} ({item.code})</option>)}</select></label>
          <label><span>Departure Date</span><input type="date" value={departureDate} onChange={(event) => setDepartureDate(event.target.value)} /></label>
          <label><span>Return Date</span><input type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} /></label>
          {initialRecord && <label><span>Status</span><select value={step} onChange={(event) => setStep(event.target.value as LeaveRequestStep)}>{requestSteps.map((item) => <option key={item}>{item}</option>)}</select></label>}
        </div>
        <div className="modal-actions"><button className="quiet-button light" onClick={onClose} type="button">Cancel</button><button className="primary-button" onClick={() => onSave({
          id: initialRecord?.id ?? `LVR-${Date.now()}`,
          employeeId,
          name: employee.fullName,
          department: employee.department,
          nationality: employee.nationality,
          leaveTypeCode,
          departureDate,
          returnDate,
          days: dayCount(departureDate, returnDate),
          step,
        })} type="button">{initialRecord ? 'Update Request' : 'Save Request'}</button></div>
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
          <label><span>Purpose</span><select value={leaveTypeCode} onChange={(event) => setLeaveTypeCode(event.target.value as LeaveTypeCode)}>{leaveTypeOptions.map((item) => <option key={item.code} value={item.code}>{item.label} ({item.code})</option>)}</select></label>
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
          nationality: employee?.nationality ?? 'Maldivian',
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
              <label><span>Purpose</span><select value={requestTypeFilter} onChange={(event) => setRequestTypeFilter(event.target.value as 'All' | LeaveTypeCode)}><option value="All">All Types</option>{leaveTypeOptions.map((item) => <option key={item.code} value={item.code}>{item.label} ({item.code})</option>)}</select></label>
              <label><span>Status</span><select value={requestStatusFilter} onChange={(event) => setRequestStatusFilter(event.target.value as 'All' | LeaveRequestStep)}><option value="All">All Statuses</option>{requestSteps.map((step) => <option key={step}>{step}</option>)}</select></label>
              <label><span>Department</span><select value={requestDepartmentFilter} onChange={(event) => setRequestDepartmentFilter(event.target.value)}><option>All Departments</option>{departmentsList.map((item) => <option key={item}>{item}</option>)}</select></label>
              <button className="primary-button toolbar-add-btn" onClick={onAddRequest} type="button">Add Leave Request</button>
            </div>
            <div className="employee-table-shell compact-scroll">
              <table className="data-table leave-table"><thead><tr><th>Employee ID</th><th>Name</th><th>Department</th><th>Purpose</th><th>Departure Date</th><th>Return Date</th><th>Days</th><th>Status</th><th>Action</th></tr></thead><tbody>
                {requestRows.map((record) => {
                  const currentIndex = requestSteps.indexOf(record.step)
                  const progress = ((currentIndex + 1) / requestSteps.length) * 100
                  return (
                    <tr key={record.id}>
                      <td>{record.employeeId}</td><td>{record.name}</td><td>{record.department}</td><td>{record.leaveTypeCode}</td><td>{formatDateDisplay(record.departureDate)}</td><td>{formatDateDisplay(record.returnDate)}</td><td>{record.days}</td>
                      <td className="leave-status-cell">
                        <button type="button" className={`status-advance-btn status-step-${record.step.toLowerCase().replaceAll(' ', '-')}`} disabled={record.step === 'Pending Departure'} onClick={() => onAdvanceRequestStep(record.id)}>{record.step}</button>
                        <div className={`status-progress-track status-step-${record.step.toLowerCase().replaceAll(' ', '-')}`}><span style={{ width: `${progress}%` }} /></div>
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
              <label><span>Department</span><select value={activeDepartmentFilter} onChange={(event) => setActiveDepartmentFilter(event.target.value)}><option>All Departments</option>{departmentsList.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>Purpose</span><select value={activeTypeFilter} onChange={(event) => setActiveTypeFilter(event.target.value as 'All' | LeaveTypeCode)}><option value="All">All Types</option>{leaveTypeOptions.map((item) => <option key={item.code} value={item.code}>{item.label} ({item.code})</option>)}</select></label>
            </div>
            <div className="employee-table-shell compact-scroll">
              <table className="data-table leave-table"><thead><tr><th>Employee ID</th><th>Name</th><th>Department</th><th>Purpose</th><th>Departure Date</th><th>Return Date</th><th>Days</th><th>Status</th></tr></thead><tbody>
                {activeRows.map((record) => <tr key={record.id}><td>{record.employeeId}</td><td>{record.name}</td><td>{record.department}</td><td>{record.leaveTypeCode}</td><td>{formatDateDisplay(record.departureDate)}</td><td>{formatDateDisplay(record.returnDate)}</td><td>{record.days}</td><td><StatusBadge status="Departed" /></td></tr>)}
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
              <label><span>Department</span><select value={historyDepartmentFilter} onChange={(event) => setHistoryDepartmentFilter(event.target.value)}><option>All Departments</option>{departmentsList.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <div className="employee-table-shell compact-scroll">
              <table className="data-table leave-table"><thead><tr><th>Employee ID</th><th>Name</th><th>Department</th><th>Purpose</th><th>Departure Date</th><th>Return Date</th><th>Days</th><th>Status</th></tr></thead><tbody>
                {historyRows.map((record) => <tr className={record.confirmation === 'Not Returned' ? 'not-returned-row' : ''} key={record.id}><td>{record.employeeId}</td><td>{record.name}</td><td>{record.department}</td><td>{record.leaveTypeCode}</td><td>{formatDateDisplay(record.departureDate)}</td><td>{formatDateDisplay(record.returnDate)}</td><td>{record.days}</td><td>{record.confirmation ? <StatusBadge status={record.confirmation} /> : <div className="row-actions history-confirm-actions"><button className="mini-button" onClick={() => onHistoryConfirm(record.id, 'Returned')} type="button">Returned</button><button className="mini-button danger" onClick={() => onHistoryConfirm(record.id, 'Not Returned')} type="button">Not Returned</button></div>}</td></tr>)}
              </tbody></table>
            </div>
          </>
        )}

        {activeLeaveView === 'passport' && (
          <>
            <div className="table-toolbar leave-toolbar leave-toolbar-3 leave-toolbar-has-btn">
              <label className="search-field"><span>Search</span><input type="search" value={passportSearch} onChange={(event) => setPassportSearch(event.target.value)} placeholder="Employee, ID, purpose" /></label>
              <label><span>Department</span><select value={passportDepartmentFilter} onChange={(event) => setPassportDepartmentFilter(event.target.value)}><option>All Departments</option>{departmentsList.map((item) => <option key={item}>{item}</option>)}</select></label>
              <button className="primary-button toolbar-add-btn" onClick={onAddPassport} type="button">Add Passport</button>
            </div>
            <div className="employee-table-shell compact-scroll">
              <table className="data-table leave-table"><thead><tr><th>Employee ID</th><th>Name</th><th>Department</th><th>Purpose</th><th>Status</th><th>Issued Date</th><th>Returned Date</th><th>Sent to HO Date</th><th>Remarks</th><th>Action</th></tr></thead><tbody>
                {passportRows.map((record) => <tr key={record.id}><td>{record.employeeId}</td><td>{record.name}</td><td>{record.department}</td><td>{record.leaveTypeCode}</td><td className="passport-status-cell"><StatusBadge status={record.passportStep} /></td><td>{record.givenDate ? formatDateDisplay(record.givenDate) : '-'}</td><td>{record.returnedDate ? formatDateDisplay(record.returnedDate) : '-'}</td><td>{record.sentToHoDate ? formatDateDisplay(record.sentToHoDate) : '-'}</td><td>{record.remarks || '-'}</td><td className="passport-action-cell"><div className="row-actions request-inline-actions"><button className="action-glyph edit" onClick={() => onEditPassport(record)} type="button" title="Edit" aria-label="Edit passport">✎</button><button className="action-glyph delete" onClick={() => onDeletePassport(record.id)} type="button" title="Delete" aria-label="Delete passport">🗑</button></div></td></tr>)}
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
  const [employeeId, setEmployeeId] = useState(record.employeeId)
  const [refNo, setRefNo] = useState(record.refNo)
  const [inductionDate, setInductionDate] = useState(record.inductionDate)
  const [conductedBy, setConductedBy] = useState(record.conductedBy)
  const [inductionContent, setInductionContent] = useState(record.inductionContent)
  const [status, setStatus] = useState<InductionRecord['status']>(record.status)
  const [remarks, setRemarks] = useState(record.remarks)
  const employee = employees.find((e) => e.employeeId === employeeId) ?? employees[0]

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal wide-modal" role="dialog" aria-modal="true">
        <div className="modal-header"><div><p className="eyebrow">Induction</p><h2>{record.id.startsWith('IND-new') ? 'Add Induction' : 'Edit Induction'}</h2></div><button className="icon-button" onClick={onClose} type="button">x</button></div>
        <div className="form-grid">
          <label><span>Employee</span><select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>{employees.slice(0, 120).map((emp) => <option key={emp.employeeId} value={emp.employeeId}>{emp.employeeId} – {emp.fullName}</option>)}</select></label>
          <label><span>Reference No</span><input value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="e.g. IND-REF-005" /></label>
          <label><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value as InductionRecord['status'])}><option>Completed</option><option>Pending</option><option>Scheduled</option></select></label>
          <label><span>Induction Date</span><input type="date" value={inductionDate} onChange={(e) => setInductionDate(e.target.value)} /></label>
          <label className="full-field"><span>Conducted By (HR Person Name)</span><input value={conductedBy} onChange={(e) => setConductedBy(e.target.value)} placeholder="Name of HR person conducting the induction" /></label>
          <label className="full-field"><span>Induction Content</span><textarea className="induction-textarea" rows={6} value={inductionContent} onChange={(e) => setInductionContent(e.target.value)} placeholder="Describe what was covered during the induction session — topics explained, policies briefed, areas toured..." /></label>
          <label className="full-field"><span>Remarks</span><input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></label>
        </div>
        <div className="modal-actions"><button className="quiet-button light" onClick={onClose} type="button">Cancel</button><button className="primary-button" onClick={() => onSave({ ...record, employeeId: employee?.employeeId ?? '', name: employee?.fullName ?? '', department: employee?.department ?? '', refNo, inductionDate, conductedBy, inductionContent, status, remarks })} type="button">Save</button></div>
      </section>
    </div>
  )
}

function InductionViewModal({ record, onClose }: { record: InductionRecord; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal wide-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Induction Record</p>
            <h2>{record.name}</h2>
            <p>{record.refNo ? `${record.refNo} · ` : ''}{record.employeeId} – {record.department}</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">x</button>
        </div>
        <div className="induction-view-grid">
          <div className="induction-detail-row"><strong>Induction Date</strong><span>{record.inductionDate ? formatDateDisplay(record.inductionDate) : '—'}</span></div>
          <div className="induction-detail-row"><strong>Conducted By</strong><span>{record.conductedBy || '—'}</span></div>
          <div className="induction-detail-row"><strong>Status</strong><span><StatusBadge status={record.status} /></span></div>
          <div className="induction-detail-row"><strong>Remarks</strong><span>{record.remarks || '—'}</span></div>
        </div>
        <div className="induction-content-box">
          <h3>Induction Content</h3>
          <p className="induction-content-text">{record.inductionContent || 'No induction content recorded for this session.'}</p>
        </div>
        <div className="modal-actions"><button className="primary-button" onClick={onClose} type="button">Close</button></div>
      </section>
    </div>
  )
}

function TrainingModal({ record, onClose, onSave }: {
  record: TrainingRecord
  onClose: () => void
  onSave: (record: TrainingRecord) => void
}) {
  const [trainingTitle, setTrainingTitle] = useState(record.trainingTitle)
  const [date, setDate] = useState(record.date)
  const [conductedBy, setConductedBy] = useState(record.conductedBy)
  const [trainingType, setTrainingType] = useState<TrainingRecord['trainingType']>(record.trainingType)
  const [participantsText, setParticipantsText] = useState(record.participants.join('\n'))
  const [status, setStatus] = useState<TrainingRecord['status']>(record.status)
  const [remarks, setRemarks] = useState(record.remarks)

  const save = () => {
    const participants = participantsText.split('\n').map((p) => p.trim()).filter(Boolean)
    onSave({ ...record, trainingTitle, date, conductedBy, trainingType, participants, status, remarks })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal wide-modal" role="dialog" aria-modal="true">
        <div className="modal-header"><div><p className="eyebrow">Training</p><h2>{record.id.startsWith('TRN-new') ? 'Add Training Record' : 'Edit Training Record'}</h2></div><button className="icon-button" onClick={onClose} type="button">x</button></div>
        <div className="form-grid">
          <label className="full-field"><span>Training Title</span><input value={trainingTitle} onChange={(e) => setTrainingTitle(e.target.value)} /></label>
          <label><span>Training Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label><span>Type</span><select value={trainingType} onChange={(e) => setTrainingType(e.target.value as TrainingRecord['trainingType'])}><option value="Internal">Internal</option><option value="External">External</option></select></label>
          <label><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value as TrainingRecord['status'])}><option value="Completed">Completed</option><option value="Pending">Pending</option></select></label>
          <label className="full-field"><span>Conducted By / Trainer Name</span><input value={conductedBy} onChange={(e) => setConductedBy(e.target.value)} placeholder="Name of trainer or organisation" /></label>
          <label className="full-field"><span>Participants (one name per line)</span><textarea className="induction-textarea" rows={6} value={participantsText} onChange={(e) => setParticipantsText(e.target.value)} placeholder="Enter each participant name on a new line..." /></label>
          <label className="full-field"><span>Remarks</span><input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></label>
        </div>
        <div className="modal-actions"><button className="quiet-button light" onClick={onClose} type="button">Cancel</button><button className="primary-button" onClick={save} type="button">Save</button></div>
      </section>
    </div>
  )
}

function TrainingParticipantsModal({ record, employees, onClose }: { record: TrainingRecord; employees: Employee[]; onClose: () => void }) {
  const participantDetails = record.participants.map((name) => {
    const emp = employees.find((e) => e.fullName.toUpperCase() === name.toUpperCase())
    return { name, employeeId: emp?.employeeId || '—', department: emp?.department || '—' }
  })

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal wide-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Training Participants</p>
            <h2>{record.trainingTitle}</h2>
            <p>{record.date ? formatDateDisplay(record.date) : '—'} · <span className={`training-type-badge ${record.trainingType.toLowerCase()}`}>{record.trainingType}</span> · {record.conductedBy}</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">x</button>
        </div>
        <p className="participants-count-label">{record.participants.length} participant{record.participants.length !== 1 ? 's' : ''}</p>
        {record.participants.length > 0
          ? <table className="participants-table"><thead><tr><th>Employee ID</th><th>Name</th><th>Department</th></tr></thead><tbody>{participantDetails.map((p, i) => <tr key={i}><td>{p.employeeId}</td><td>{p.name}</td><td>{p.department}</td></tr>)}</tbody></table>
          : <p className="participants-empty">No participants recorded for this training.</p>
        }
        <div className="modal-actions"><button className="primary-button" onClick={onClose} type="button">Close</button></div>
      </section>
    </div>
  )
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

function PersonalFilesSection({ employees, records, onUpdate, onBack }: {
  employees: Employee[]
  records: PersonalFileRecord[]
  onUpdate: (fn: (prev: PersonalFileRecord[]) => PersonalFileRecord[]) => void
  onBack: () => void
}) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [staffFilter, setStaffFilter] = useState<'Active' | 'Inactive' | 'All'>('Active')
  const [editingFileNo, setEditingFileNo] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const rows = useMemo(() => records.filter((r) => {
    const matchSearch = [r.fileNo, r.employeeId, r.fullName, r.department].join(' ').toLowerCase().includes(search.trim().toLowerCase())
    const matchDept = deptFilter === 'All Departments' || r.department === deptFilter
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
          <button className="back-btn-sm" onClick={onBack} type="button">← Back</button>
          <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="File no, employee, department" /></label>
          <label><span>Department</span><select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}><option>All Departments</option>{departmentsList.map((d) => <option key={d}>{d}</option>)}</select></label>
          <label><span>Staff</span><select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value as typeof staffFilter)}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="All">All</option></select></label>
          <button className="primary-button" onClick={() => setShowAddModal(true)} type="button">Add</button>
        </div>
        <div className="employee-table-shell compact-scroll">
          <table className="data-table personal-files-table">
            <thead><tr><th>File No</th><th>Employee ID</th><th>Full Name</th><th>Department</th><th>COC</th><th>JD</th><th>CONT</th><th>Contract Expiry</th><th>Status</th><th>Action</th></tr></thead>
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

function InductionSection({ employees, records, onUpdate, onBack }: {
  employees: Employee[]
  records: InductionRecord[]
  onUpdate: (fn: (prev: InductionRecord[]) => InductionRecord[]) => void
  onBack: () => void
}) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [statusFilter, setStatusFilter] = useState<'All' | InductionRecord['status']>('All')
  const [editing, setEditing] = useState<InductionRecord | null>(null)
  const [viewing, setViewing] = useState<InductionRecord | null>(null)

  const rows = useMemo(() => records.filter((r) => {
    const matchSearch = [r.refNo, r.employeeId, r.name, r.department, r.conductedBy].join(' ').toLowerCase().includes(search.trim().toLowerCase())
    const matchDept = deptFilter === 'All Departments' || r.department === deptFilter
    const matchStatus = statusFilter === 'All' || r.status === statusFilter
    return matchSearch && matchDept && matchStatus
  }).sort((a, b) => a.department.localeCompare(b.department)), [records, search, deptFilter, statusFilter])

  const saveRecord = (record: InductionRecord) => {
    onUpdate((prev) => {
      const exists = prev.some((r) => r.id === record.id)
      return exists ? prev.map((r) => r.id === record.id ? record : r) : [record, ...prev]
    })
    setEditing(null)
  }

  const deleteRecord = (id: string) => onUpdate((prev) => prev.filter((r) => r.id !== id))

  const newRecord = (): InductionRecord => ({ id: `IND-new-${Date.now()}`, refNo: '', employeeId: employees[0]?.employeeId ?? '', name: employees[0]?.fullName ?? '', department: employees[0]?.department ?? '', inductionDate: new Date().toISOString().slice(0, 10), conductedBy: '', inductionContent: '', status: 'Pending', remarks: '' })

  return (
    <>
      <section className="employee-workspace">
        <div className="table-toolbar ops-section-toolbar">
          <button className="back-btn-sm" onClick={onBack} type="button">← Back</button>
          <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ref, employee, ID, department" /></label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}><option value="All">All Status</option><option>Completed</option><option>Pending</option><option>Scheduled</option></select></label>
          <label><span>Department</span><select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}><option>All Departments</option>{departmentsList.map((d) => <option key={d}>{d}</option>)}</select></label>
          <button className="primary-button" onClick={() => setEditing(newRecord())} type="button">Add</button>
        </div>
        <div className="employee-table-shell compact-scroll">
          <table className="data-table induction-table">
            <thead><tr><th>Ref No</th><th>Employee ID</th><th>Name</th><th>Department</th><th>Induction Date</th><th>Conducted By</th><th>Status</th><th>Remarks</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((record) => (
                <tr key={record.id}>
                  <td>{record.refNo || '—'}</td><td>{record.employeeId}</td><td>{record.name}</td><td>{record.department}</td>
                  <td>{record.inductionDate ? formatDateDisplay(record.inductionDate) : '—'}</td>
                  <td>{record.conductedBy ? record.conductedBy.split(' ')[0] : '—'}</td>
                  <td><StatusBadge status={record.status} /></td>
                  <td>{record.remarks || '—'}</td>
                  <td><div className="row-actions request-inline-actions">
                    <button className="action-glyph" onClick={() => setViewing(record)} type="button" title="View" aria-label="View induction">👁</button>
                    <button className="action-glyph edit" onClick={() => setEditing(record)} type="button" title="Edit" aria-label="Edit">✎</button>
                    <button className="action-glyph delete" onClick={() => deleteRecord(record.id)} type="button" title="Delete" aria-label="Delete">🗑</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing && <InductionModal employees={employees} record={editing} onClose={() => setEditing(null)} onSave={saveRecord} />}
      {viewing && <InductionViewModal record={viewing} onClose={() => setViewing(null)} />}
    </>
  )
}

function TrainingSection({ records, onUpdate, onBack, employees }: {
  records: TrainingRecord[]
  onUpdate: (fn: (prev: TrainingRecord[]) => TrainingRecord[]) => void
  onBack: () => void
  employees: Employee[]
}) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'All' | 'Internal' | 'External'>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | TrainingRecord['status']>('All')
  const [editing, setEditing] = useState<TrainingRecord | null>(null)
  const [viewingParticipants, setViewingParticipants] = useState<TrainingRecord | null>(null)

  const rows = useMemo(() => records.filter((r) => {
    const matchSearch = [r.trainingTitle, r.conductedBy].join(' ').toLowerCase().includes(search.trim().toLowerCase())
    const matchType = typeFilter === 'All' || r.trainingType === typeFilter
    const matchStatus = statusFilter === 'All' || r.status === statusFilter
    return matchSearch && matchType && matchStatus
  }).sort((a, b) => b.date.localeCompare(a.date)), [records, search, typeFilter, statusFilter])

  const saveRecord = (record: TrainingRecord) => {
    onUpdate((prev) => {
      const exists = prev.some((r) => r.id === record.id)
      return exists ? prev.map((r) => r.id === record.id ? record : r) : [record, ...prev]
    })
    setEditing(null)
  }

  const deleteRecord = (id: string) => onUpdate((prev) => prev.filter((r) => r.id !== id))

  const newRecord = (): TrainingRecord => ({ id: `TRN-new-${Date.now()}`, trainingTitle: '', date: new Date().toISOString().slice(0, 10), conductedBy: '', trainingType: 'Internal', participants: [], status: 'Pending', remarks: '' })

  return (
    <>
      <section className="employee-workspace">
        <div className="table-toolbar ops-section-toolbar">
          <button className="back-btn-sm" onClick={onBack} type="button">← Back</button>
          <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Training title, trainer" /></label>
          <label><span>Type</span><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}><option value="All">All Types</option><option value="Internal">Internal</option><option value="External">External</option></select></label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}><option value="All">All Status</option><option value="Completed">Completed</option><option value="Pending">Pending</option></select></label>
          <button className="primary-button" onClick={() => setEditing(newRecord())} type="button">Add</button>
        </div>
        <div className="employee-table-shell compact-scroll">
          <table className="data-table training-table">
            <thead><tr><th>Training Title</th><th>Date</th><th>Conducted By</th><th>Type</th><th>Participants</th><th>Status</th><th>Remarks</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((record) => (
                <tr key={record.id}>
                  <td>{record.trainingTitle}</td>
                  <td>{record.date ? formatDateDisplay(record.date) : '—'}</td>
                  <td>{record.conductedBy || '—'}</td>
                  <td><span className={`training-type-badge ${record.trainingType.toLowerCase()}`}>{record.trainingType}</span></td>
                  <td><button className="participants-count-btn" onClick={() => setViewingParticipants(record)} type="button">{record.participants.length} participant{record.participants.length !== 1 ? 's' : ''}</button></td>
                  <td><StatusBadge status={record.status} /></td>
                  <td>{record.remarks || '—'}</td>
                  <td><div className="row-actions request-inline-actions">
                    <button className="action-glyph edit" onClick={() => setEditing(record)} type="button" title="Edit" aria-label="Edit">✎</button>
                    <button className="action-glyph delete" onClick={() => deleteRecord(record.id)} type="button" title="Delete" aria-label="Delete">🗑</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing && <TrainingModal record={editing} onClose={() => setEditing(null)} onSave={saveRecord} />}
      {viewingParticipants && <TrainingParticipantsModal record={viewingParticipants} employees={employees} onClose={() => setViewingParticipants(null)} />}
    </>
  )
}

// ── Bank Account Opening ────────────────────────────────────

type BankName = 'SBI' | 'BOC' | 'CBM'
type AccountStatus = 'Pending' | 'Completed' | 'Incomplete'

type BankAccountRecord = {
  id: string
  employeeId: string
  fullName: string
  department: string
  nationality: string
  bank: BankName
  usdStatus: AccountStatus
  usdScheduledDate: string
  mvrStatus: AccountStatus
  mvrScheduledDate: string
}

const initialBankAccountRecords: BankAccountRecord[] = [
  { id: 'BNK-35494', employeeId: '35494', fullName: 'GAMARALALAGE AJITH WIJESIRI', department: 'ACCOUNTS AND FINANCE', nationality: 'SRI LANKAN', bank: 'SBI', usdStatus: 'Completed', usdScheduledDate: '2007-06-01', mvrStatus: 'Completed', mvrScheduledDate: '2007-06-01' },
  { id: 'BNK-37916', employeeId: '37916', fullName: 'JAGO', department: 'STORES', nationality: 'BANGLADESHI', bank: 'SBI', usdStatus: 'Completed', usdScheduledDate: '2008-09-01', mvrStatus: 'Completed', mvrScheduledDate: '2008-09-01' },
  { id: 'BNK-43407', employeeId: '43407', fullName: 'MOHAMMAD DELOWAR HOSSAIN', department: 'STORES', nationality: 'BANGLADESHI', bank: 'SBI', usdStatus: 'Completed', usdScheduledDate: '2013-08-01', mvrStatus: 'Completed', mvrScheduledDate: '2013-08-01' },
  { id: 'BNK-44386', employeeId: '44386', fullName: 'MAJIB', department: 'STORES', nationality: 'BANGLADESHI', bank: 'SBI', usdStatus: 'Completed', usdScheduledDate: '2014-06-01', mvrStatus: 'Completed', mvrScheduledDate: '2014-06-01' },
  { id: 'BNK-50223', employeeId: '50223', fullName: 'AYESHAN KUMARA WIJEYATHUNGA MUDALIGE', department: 'STORES', nationality: 'SRI LANKAN', bank: 'BOC', usdStatus: 'Completed', usdScheduledDate: '2019-04-10', mvrStatus: 'Completed', mvrScheduledDate: '2019-04-10' },
  { id: 'BNK-50427', employeeId: '50427', fullName: 'MD SAIFUR RAHMAN', department: 'STORES', nationality: 'BANGLADESHI', bank: 'SBI', usdStatus: 'Completed', usdScheduledDate: '2019-06-01', mvrStatus: 'Completed', mvrScheduledDate: '2019-06-01' },
  { id: 'BNK-52804', employeeId: '52804', fullName: 'AHMED IMRAN', department: 'ACCOUNTS AND FINANCE', nationality: 'BANGLADESHI', bank: 'SBI', usdStatus: 'Completed', usdScheduledDate: '2020-12-01', mvrStatus: 'Completed', mvrScheduledDate: '2020-12-01' },
  { id: 'BNK-53029', employeeId: '53029', fullName: 'KUMARAN VAITHILINGAM', department: 'STORES', nationality: 'INDIAN', bank: 'SBI', usdStatus: 'Completed', usdScheduledDate: '2022-01-20', mvrStatus: 'Completed', mvrScheduledDate: '2022-01-20' },
  { id: 'BNK-53979', employeeId: '53979', fullName: 'NAVEEN SEKAR', department: 'STORES', nationality: 'INDIAN', bank: 'SBI', usdStatus: 'Completed', usdScheduledDate: '2022-08-10', mvrStatus: 'Completed', mvrScheduledDate: '2022-08-10' },
  { id: 'BNK-55427', employeeId: '55427', fullName: 'SARAVANAN RAJENDRAN', department: 'STORES', nationality: 'INDIAN', bank: 'SBI', usdStatus: 'Completed', usdScheduledDate: '2023-09-01', mvrStatus: 'Completed', mvrScheduledDate: '2023-09-01' },
  { id: 'BNK-56141', employeeId: '56141', fullName: 'RAJU PERKA', department: 'CAFE', nationality: 'INDIAN', bank: 'BOC', usdStatus: 'Completed', usdScheduledDate: '2024-04-01', mvrStatus: 'Completed', mvrScheduledDate: '2024-04-01' },
  { id: 'BNK-56530', employeeId: '56530', fullName: 'PUBUDU MADURANGA ALAWATHTHA KANKANAMGE', department: 'ADMINISTRATION', nationality: 'SRI LANKAN', bank: 'SBI', usdStatus: 'Completed', usdScheduledDate: '2024-07-01', mvrStatus: 'Completed', mvrScheduledDate: '2024-07-01' },
  { id: 'BNK-56646', employeeId: '56646', fullName: 'CHANDRASHEKHER PURELLA', department: 'ACCOUNTS AND FINANCE', nationality: 'INDIAN', bank: 'BOC', usdStatus: 'Completed', usdScheduledDate: '2024-08-01', mvrStatus: 'Completed', mvrScheduledDate: '2024-08-01' },
  { id: 'BNK-57637', employeeId: '57637', fullName: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', nationality: 'INDIAN', bank: 'SBI', usdStatus: 'Completed', usdScheduledDate: '2025-02-10', mvrStatus: 'Completed', mvrScheduledDate: '2025-02-10' },
  { id: 'BNK-57935', employeeId: '57935', fullName: 'ARUNODA KAVINDU NANAYAKKARA', department: 'ACCOUNTS AND FINANCE', nationality: 'SRI LANKAN', bank: 'SBI', usdStatus: 'Completed', usdScheduledDate: '2025-04-20', mvrStatus: 'Completed', mvrScheduledDate: '2025-04-20' },
  { id: 'BNK-58692', employeeId: '58692', fullName: 'SHANTUMON PATHIYIL CHACKO', department: 'HUMAN RESOURCES', nationality: 'INDIAN', bank: 'SBI', usdStatus: 'Completed', usdScheduledDate: '2025-10-15', mvrStatus: 'Completed', mvrScheduledDate: '2025-10-15' },
  { id: 'BNK-57803', employeeId: '57803', fullName: 'INDIKA SAMPATH SAMARASINGHEGE', department: 'STORES', nationality: 'SRI LANKAN', bank: 'SBI', usdStatus: 'Pending', usdScheduledDate: '2026-05-20', mvrStatus: 'Pending', mvrScheduledDate: '2026-05-20' },
  { id: 'BNK-58034', employeeId: '58034', fullName: 'SAMEERA MADUSANKA GUNARATHNA', department: 'STORES', nationality: 'SRI LANKAN', bank: 'SBI', usdStatus: 'Pending', usdScheduledDate: '2026-05-22', mvrStatus: 'Pending', mvrScheduledDate: '2026-05-22' },
  { id: 'BNK-58686', employeeId: '58686', fullName: 'YASAR ARAFATH BASHEER AHAMED', department: 'STORES', nationality: 'INDIAN', bank: 'SBI', usdStatus: 'Pending', usdScheduledDate: '2026-05-18', mvrStatus: 'Incomplete', mvrScheduledDate: '2026-05-18' },
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
  const [usdStatus, setUsdStatus] = useState<AccountStatus>(record.usdStatus)
  const [usdScheduledDate, setUsdScheduledDate] = useState(record.usdScheduledDate)
  const [mvrStatus, setMvrStatus] = useState<AccountStatus>(record.mvrStatus)
  const [mvrScheduledDate, setMvrScheduledDate] = useState(record.mvrScheduledDate)

  const nonLocals = employees.filter((e) => e.nationality !== 'MALDIVIAN')
  const selected = nonLocals.find((e) => e.employeeId === employeeId) ?? nonLocals[0]

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    onSave({
      ...record,
      id: isNew ? `BNK-${selected.employeeId}` : record.id,
      employeeId: selected.employeeId,
      fullName: selected.fullName,
      department: selected.department,
      nationality: selected.nationality,
      bank, usdStatus, usdScheduledDate,
      mvrStatus, mvrScheduledDate,
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
          <div className="form-grid" style={{ marginBottom: 16 }}>
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
          </div>

          <div className="bank-account-sections">
            <div className="bank-account-block usd-block">
              <h3 className="bank-block-title">USD Account</h3>
              <div className="form-grid">
                <label><span>Status</span>
                  <select value={usdStatus} onChange={(e) => setUsdStatus(e.target.value as AccountStatus)}>
                    <option>Pending</option><option>Completed</option><option>Incomplete</option>
                  </select>
                </label>
                <label><span>Scheduled Date</span>
                  <input type="date" value={usdScheduledDate} onChange={(e) => setUsdScheduledDate(e.target.value)} />
                </label>
              </div>
            </div>
            <div className="bank-account-block mvr-block">
              <h3 className="bank-block-title">MVR Account</h3>
              <div className="form-grid">
                <label><span>Status</span>
                  <select value={mvrStatus} onChange={(e) => setMvrStatus(e.target.value as AccountStatus)}>
                    <option>Pending</option><option>Completed</option><option>Incomplete</option>
                  </select>
                </label>
                <label><span>Scheduled Date</span>
                  <input type="date" value={mvrScheduledDate} onChange={(e) => setMvrScheduledDate(e.target.value)} />
                </label>
              </div>
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

function BankAccountSection({ employees, records, onUpdate, onBack }: {
  employees: Employee[]
  records: BankAccountRecord[]
  onUpdate: (fn: (prev: BankAccountRecord[]) => BankAccountRecord[]) => void
  onBack: () => void
}) {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [search, setSearch] = useState('')
  const [bankFilter, setBankFilter] = useState<'All' | BankName>('All')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [editing, setEditing] = useState<BankAccountRecord | null>(null)

  const isCompleted = (r: BankAccountRecord) => r.usdStatus === 'Completed' && r.mvrStatus === 'Completed'

  const applyFilters = (list: BankAccountRecord[]) => {
    const q = search.trim().toLowerCase()
    return list.filter((r) => {
      const matchSearch = !q || [r.employeeId, r.fullName, r.department, r.nationality, r.bank].join(' ').toLowerCase().includes(q)
      const matchBank = bankFilter === 'All' || r.bank === bankFilter
      const matchDept = deptFilter === 'All Departments' || r.department === deptFilter
      return matchSearch && matchBank && matchDept
    }).sort((a, b) => a.fullName.localeCompare(b.fullName))
  }

  const pendingRows = useMemo(() => applyFilters(records.filter((r) => !isCompleted(r))), [records, search, bankFilter, deptFilter])
  const completedRows = useMemo(() => applyFilters(records.filter((r) => isCompleted(r))), [records, search, bankFilter, deptFilter])

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
    usdStatus: 'Pending',
    usdScheduledDate: new Date().toISOString().slice(0, 10),
    mvrStatus: 'Pending',
    mvrScheduledDate: new Date().toISOString().slice(0, 10),
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
          <col style={{ width: '100px' }} />
          <col style={{ width: '110px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '110px' }} />
          {showEdit && <col style={{ width: '72px' }} />}
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>Emp ID</th>
            <th>Full Name</th>
            <th>Department</th>
            <th>Nationality</th>
            <th>Bank</th>
            <th>USD Status</th>
            <th>USD Scheduled</th>
            <th>MVR Status</th>
            <th>MVR Scheduled</th>
            {showEdit && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={showEdit ? 11 : 10} className="empty-row">No records in this section.</td></tr>
            : rows.map((r, i) => (
              <tr key={r.id}>
                <td className="bank-td-num">{i + 1}</td>
                <td>{r.employeeId}</td>
                <td className="name-cell-plain">{r.fullName}</td>
                <td>{r.department}</td>
                <td>{r.nationality}</td>
                <td><span className="bank-chip">{r.bank}</span></td>
                <td><StatusBadge status={r.usdStatus} /></td>
                <td>{r.usdScheduledDate ? formatDateDisplay(r.usdScheduledDate) : '—'}</td>
                <td><StatusBadge status={r.mvrStatus} /></td>
                <td>{r.mvrScheduledDate ? formatDateDisplay(r.mvrScheduledDate) : '—'}</td>
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
          <button className="back-btn-sm" onClick={onBack} type="button">← Back</button>
          <label className="search-field">
            <span>Search</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, ID, department, nationality" />
          </label>
          <label><span>Bank</span>
            <select value={bankFilter} onChange={(e) => setBankFilter(e.target.value as typeof bankFilter)}>
              <option value="All">All Banks</option>
              <option>SBI</option><option>BOC</option><option>CBM</option>
            </select>
          </label>
          <label><span>Department</span>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option>All Departments</option>
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
            <span className="bank-footer-hint"> — Edit a record and set both USD and MVR to Completed to move it to the Completed tab.</span>
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
  const [activeSection, setActiveSection] = useState<OpsSection | null>(null)
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
        usdStatus: 'Pending',
        usdScheduledDate: '',
        mvrStatus: 'Pending',
        mvrScheduledDate: '',
      }))]
    })
  }, [employees])

  const fileStats = useMemo(() => {
    const activeFiles = personalFiles.filter((r) => !r.isFormerStaff)
    const incomplete = activeFiles.filter((r) => !(r.coc && r.jd && r.cont)).length
    return { total: activeFiles.length, incomplete }
  }, [personalFiles])

  const inductionStats = useMemo(() => ({
    completed: inductionRecords.filter((r) => r.status === 'Completed').length,
    pending: inductionRecords.filter((r) => r.status !== 'Completed').length,
  }), [inductionRecords])

  const trainingStats = useMemo(() => ({
    active: trainingRecords.filter((r) => r.status === 'Completed').length,
    attention: trainingRecords.filter((r) => r.status === 'Pending').length,
  }), [trainingRecords])

  const bankStats = useMemo(() => ({
    total: bankAccountRecords.length,
    completed: bankAccountRecords.filter((r) => r.usdStatus === 'Completed' && r.mvrStatus === 'Completed').length,
    pending: bankAccountRecords.filter((r) => r.usdStatus === 'Pending' || r.mvrStatus === 'Pending').length,
    incomplete: bankAccountRecords.filter((r) => r.usdStatus === 'Incomplete' || r.mvrStatus === 'Incomplete').length,
  }), [bankAccountRecords])

  if (activeSection === 'files') return <PersonalFilesSection employees={employees} records={personalFiles} onUpdate={setPersonalFiles} onBack={() => setActiveSection(null)} />
  if (activeSection === 'induction') return <InductionSection employees={employees} records={inductionRecords} onUpdate={setInductionRecords} onBack={() => setActiveSection(null)} />
  if (activeSection === 'training') return <TrainingSection records={trainingRecords} employees={employees} onUpdate={setTrainingRecords} onBack={() => setActiveSection(null)} />
  if (activeSection === 'bank') return <BankAccountSection employees={employees} records={bankAccountRecords} onUpdate={setBankAccountRecords} onBack={() => setActiveSection(null)} />

  return (
    <>
      <PageHeader eyebrow="HR operations" title="HR Operations" subtitle="Manage employee personal files, site inductions, training records and bank account tracking." />
      <div className="ops-cards-grid">
        <button className="ops-card" onClick={() => setActiveSection('files')} type="button">
          <span className="ops-card-icon">PF</span>
          <div className="ops-card-body">
            <h3>Personal Files</h3>
            <p>Track document collection status for all employees — IDs, passports, photos and signed contracts.</p>
            <div className="ops-card-stats">
              <span>{fileStats.total} employees</span>
              {fileStats.incomplete > 0 ? <span className="stat-warn">{fileStats.incomplete} incomplete</span> : <span className="stat-ok">All complete</span>}
            </div>
          </div>
          <span className="ops-card-arrow">→</span>
        </button>
        <button className="ops-card" onClick={() => setActiveSection('induction')} type="button">
          <span className="ops-card-icon">IN</span>
          <div className="ops-card-body">
            <h3>Induction</h3>
            <p>Track site induction completions and schedules for new and existing staff members.</p>
            <div className="ops-card-stats">
              <span>{inductionStats.completed} completed</span>
              {inductionStats.pending > 0 ? <span className="stat-warn">{inductionStats.pending} pending</span> : <span className="stat-ok">All inducted</span>}
            </div>
          </div>
          <span className="ops-card-arrow">→</span>
        </button>
        <button className="ops-card" onClick={() => setActiveSection('training')} type="button">
          <span className="ops-card-icon">TR</span>
          <div className="ops-card-body">
            <h3>Training</h3>
            <p>Manage training certifications, renewal dates and compliance status for all employees.</p>
            <div className="ops-card-stats">
              <span>{trainingStats.active} active</span>
              {trainingStats.attention > 0 ? <span className="stat-warn">{trainingStats.attention} due / expired</span> : <span className="stat-ok">All up to date</span>}
            </div>
          </div>
          <span className="ops-card-arrow">→</span>
        </button>
        <button className="ops-card" onClick={() => setActiveSection('bank')} type="button">
          <span className="ops-card-icon">BK</span>
          <div className="ops-card-body">
            <h3>Bank Account Opening</h3>
            <p>Track USD and MVR bank account opening for new expatriate staff across SBI, BOC and CBM.</p>
            <div className="ops-card-stats">
              <span>{bankStats.total} staff</span>
              {bankStats.pending > 0 ? <span className="stat-warn">{bankStats.pending} pending</span> : <span className="stat-ok">None pending</span>}
              {bankStats.incomplete > 0 && <span className="stat-warn">{bankStats.incomplete} incomplete</span>}
              {bankStats.completed > 0 && <span className="stat-ok">{bankStats.completed} completed</span>}
            </div>
          </div>
          <span className="ops-card-arrow">→</span>
        </button>
      </div>
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

function RequestsSection({ records, onUpdate, onBack }: { records: StaffRequestRecord[]; onUpdate: (fn: (prev: StaffRequestRecord[]) => StaffRequestRecord[]) => void; onBack: () => void }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editing, setEditing] = useState<StaffRequestRecord | null>(null)
  const filtered = records.filter((r) => `${r.employeeName} ${r.department} ${r.requestType} ${r.description}`.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'All' || r.status === statusFilter))
  const save = (r: StaffRequestRecord) => { onUpdate((prev) => { const idx = prev.findIndex((x) => x.id === r.id); return idx >= 0 ? prev.map((x) => x.id === r.id ? r : x) : [...prev, r] }); setEditing(null) }
  const del = (id: string) => onUpdate((prev) => prev.filter((x) => x.id !== id))
  return (
    <>
      <PageHeader eyebrow="Activities" title="Staff Requests" subtitle="Track and manage staff requests from submission to resolution." />
      <section className="employee-workspace">
        <div className="table-toolbar activities-toolbar">
          <button className="back-btn-sm" onClick={onBack} type="button">← Back</button>
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

function VisitsSection({ records, onUpdate, onBack }: { records: VisitRecord[]; onUpdate: (fn: (prev: VisitRecord[]) => VisitRecord[]) => void; onBack: () => void }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editing, setEditing] = useState<VisitRecord | null>(null)
  const filtered = records.filter((r) => `${r.employeeId} ${r.employeeName} ${r.department} ${r.nationality}`.toLowerCase().includes(search.toLowerCase()) && (typeFilter === 'All' || r.visitType === typeFilter) && (statusFilter === 'All' || r.status === statusFilter))
  const save = (r: VisitRecord) => { onUpdate((prev) => { const idx = prev.findIndex((x) => x.id === r.id); return idx >= 0 ? prev.map((x) => x.id === r.id ? r : x) : [...prev, r] }); setEditing(null) }
  const del = (id: string) => onUpdate((prev) => prev.filter((x) => x.id !== id))
  return (
    <>
      <PageHeader eyebrow="Activities" title="HR Visits" subtitle="Track HR-arranged visits for employees — visa medical, photo, passport renewal and embassy letter collection." />
      <section className="employee-workspace">
        <div className="table-toolbar activities-toolbar">
          <button className="back-btn-sm" onClick={onBack} type="button">← Back</button>
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

function IncidentsSection({ records, employees, onUpdate, onBack }: { records: IncidentRecord[]; employees: Employee[]; onUpdate: (fn: (prev: IncidentRecord[]) => IncidentRecord[]) => void; onBack: () => void }) {
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
      <PageHeader eyebrow="Activities" title="Incidents" subtitle="Record and follow up on site incidents and near misses." />
      <section className="employee-workspace">
        <div className="table-toolbar activities-toolbar">
          <button className="back-btn-sm" onClick={onBack} type="button">← Back</button>
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
  const [activeSection, setActiveSection] = useState<ActivitiesSection | null>(null)
  const [staffRequests, setStaffRequests] = useState<StaffRequestRecord[]>(initialStaffRequests)
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>(initialVisitRecords)
  const [incidentRecords, setIncidentRecords] = useState<IncidentRecord[]>(initialIncidentRecords)
  const reqStats = { open: staffRequests.filter((r) => r.status === 'Open').length, inProgress: staffRequests.filter((r) => r.status === 'In Progress').length }
  const visStats = { scheduled: visitRecords.filter((r) => r.status === 'Scheduled').length, total: visitRecords.length }
  const incStats = { open: incidentRecords.filter((r) => r.status === 'Open' || r.status === 'Under Review').length, closed: incidentRecords.filter((r) => r.status === 'Closed').length }
  if (activeSection === 'requests') return <RequestsSection records={staffRequests} onUpdate={setStaffRequests} onBack={() => setActiveSection(null)} />
  if (activeSection === 'visits') return <VisitsSection records={visitRecords} onUpdate={setVisitRecords} onBack={() => setActiveSection(null)} />
  if (activeSection === 'incidents') return <IncidentsSection records={incidentRecords} employees={employees} onUpdate={setIncidentRecords} onBack={() => setActiveSection(null)} />
  return (
    <>
      <PageHeader eyebrow="Activities" title="Requests, visits and incidents" subtitle="A daily operating queue for staff requests, scheduled visits and incident follow-up." />
      <div className="ops-cards-grid">
        <button className="ops-card" onClick={() => setActiveSection('requests')} type="button">
          <span className="ops-card-icon">RE</span>
          <div className="ops-card-body">
            <h3>Requests</h3>
            <p>Manage staff requests for accommodation, equipment, documents, transfers and more.</p>
            <div className="ops-card-stats">
              {reqStats.open > 0 ? <span className="stat-warn">{reqStats.open} open</span> : <span className="stat-ok">No open items</span>}
              {reqStats.inProgress > 0 && <span>{reqStats.inProgress} in progress</span>}
              <span>{staffRequests.length} total</span>
            </div>
          </div>
          <span className="ops-card-arrow">→</span>
        </button>
        <button className="ops-card" onClick={() => setActiveSection('visits')} type="button">
          <span className="ops-card-icon">VI</span>
          <div className="ops-card-body">
            <h3>Visits</h3>
            <p>Schedule and track contractor, supplier, government and client site visits.</p>
            <div className="ops-card-stats">
              {visStats.scheduled > 0 ? <span>{visStats.scheduled} scheduled</span> : <span className="stat-ok">None scheduled</span>}
              <span>{visStats.total} total</span>
            </div>
          </div>
          <span className="ops-card-arrow">→</span>
        </button>
        <button className="ops-card" onClick={() => setActiveSection('incidents')} type="button">
          <span className="ops-card-icon">IN</span>
          <div className="ops-card-body">
            <h3>Incidents</h3>
            <p>Log and follow up on site incidents, near misses and safety-related observations.</p>
            <div className="ops-card-stats">
              {incStats.open > 0 ? <span className="stat-warn">{incStats.open} open / under review</span> : <span className="stat-ok">All closed</span>}
              {incStats.closed > 0 && <span>{incStats.closed} closed</span>}
              <span>{incidentRecords.length} total</span>
            </div>
          </div>
          <span className="ops-card-arrow">→</span>
        </button>
      </div>
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

function SettingsPage({ employees: _employees, leaveRequests: _lr, activeLeaves: _al }: {
  employees: Employee[]
  leaveRequests: LeaveRequestRecord[]
  activeLeaves: ActiveLeaveRecord[]
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
    </div>
  )
}

function PendingTasksModal({ employees, onClose }: { employees: Employee[]; onClose: () => void }) {
  const taskRows = employees.map((employee) => ({ employee, tasks: getPendingTasks(employee) })).filter((row) => row.tasks.length > 0)
  return <div className="modal-backdrop" role="presentation"><section className="registration-modal pending-modal" role="dialog" aria-modal="true"><div className="modal-header"><div><p className="eyebrow">Record completion</p><h2>Pending Tasks</h2><p>Employees with missing registration details that need HR/admin follow-up.</p></div><button className="icon-button" onClick={onClose} type="button">x</button></div><div className="structured-list pending-task-list">{taskRows.map(({ employee, tasks }) => <article className="structured-row" key={`${employee.employeeId}-${employee.fullName}`}><div><strong>{employee.fullName}</strong><span>{employee.employeeId}</span></div><div><strong>{employee.department}</strong><span>{tasks.join(', ')}</span></div><StatusBadge status={recordStatus(employee)} /></article>)}</div></section></div>
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onLogin() }
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
              <input defaultValue="admin" autoComplete="username" />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input type="password" defaultValue="admin" autoComplete="current-password" />
            </label>

            <button className="login-btn" type="submit">
              Sign In →
            </button>

            <p className="login-demo-note">Demo credentials: <strong>admin</strong> / <strong>admin</strong></p>
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

function App() {
  const [activePage, setActivePage] = useState<Page>('overview')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>(initialLeaveRequests)
  const [activeLeaves, setActiveLeaves] = useState<ActiveLeaveRecord[]>(initialActiveLeaves)
  const [leaveHistory, setLeaveHistory] = useState<LeaveHistoryRecord[]>(initialLeaveHistory)
  const [passportHandovers, setPassportHandovers] = useState<PassportHandoverRecord[]>(initialPassportHandovers)
  const [noticeTerminations, setNoticeTerminations] = useState<EnhancedTerminationRecord[]>(initialNoticeTerminations)
  const [completedTerminations, setCompletedTerminations] = useState<CompletedTerminationRecord[]>(initialCompletedTerminations)
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

  const saveEmployee = () => {
    const employee = { ...employeeForm, employeeId: employeeForm.employeeId || `PENDING-${String(employees.length + 1).padStart(4, '0')}`, fullName: employeeForm.fullName || 'Pending Employee', designation: employeeForm.designation || 'Pending Designation', workPermitNo: employeeForm.nationality === 'Maldivian' ? '' : employeeForm.workPermitNo }
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

  const exportCsv = () => {
    const headers = ['Employee ID', 'Full Name', 'Department', 'Designation', 'Nationality', 'NIC/PP No', 'WP No', 'Date of Join', 'Mobile No', 'Date of Birth', 'Age', 'Passport Status', 'Site Status', 'Record Status']
    const rows = employees.map((employee) => [employee.employeeId, employee.fullName, employee.department, employee.designation, employee.nationality, employee.nicPassportNo, employee.nationality === 'Maldivian' ? '' : employee.workPermitNo, employee.dateOfJoin, employee.mobileNo, employee.dateOfBirth, calculateAge(employee.dateOfBirth), employee.passportStatus, employee.siteStatus, recordStatus(employee)])
    downloadCsv('vhpl-tic-employees.csv', [headers, ...rows])
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
        const imported = parseCsv(String(reader.result ?? '')).slice(1).map((row, index): Employee => ({
          employeeId: row[0] || `PENDING-${String(employees.length + index + 1).padStart(4, '0')}`,
          fullName: row[1] || 'Imported Employee',
          department: row[2] || 'Operations',
          designation: row[3] || 'Pending Assignment',
          nationality: row[4] || 'Maldivian',
          nicPassportNo: row[5] || '',
          workPermitNo: row[4] === 'Maldivian' ? '' : row[6] || '',
          dateOfJoin: row[7] || new Date().toISOString().slice(0, 10),
          mobileNo: row[8] || '',
          dateOfBirth: row[9] || '',
          passportStatus: row[10] || 'With Employee',
          siteStatus: row[11] === 'On Leave' || row[11] === 'Off Site' ? row[11] : 'On Site',
        }))
        setEmployees((current) => [...imported, ...current])
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const downloadTemplate = () => downloadCsv('vhpl-tic-employee-template.csv', [['Employee ID', 'Full Name', 'Department', 'Designation', 'Nationality', 'NIC/PP No', 'WP No', 'Date of Join', 'Mobile No', 'Date of Birth', 'Passport Status', 'Site Status']])

  if (!isLoggedIn) return <LoginPage onLogin={() => setIsLoggedIn(true)} />

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="VHPL Thilafushi Industrial Complex home"><span className="brand-mark">VH</span><span><strong>HR REGISTER</strong><small>VHPL | Thilafushi Industrial Complex</small></span></a>
        <nav className="page-tabs" aria-label="Primary sections">{pages.map((page) => <button className={activePage === page.id ? 'active' : ''} key={page.id} onClick={() => setActivePage(page.id)} type="button">{page.label}</button>)}</nav>
        <div className="top-actions"><button className="quiet-button" onClick={() => setIsLoggedIn(false)} type="button">Logout</button></div>
      </header>

      <main className="workspace" id="top">
        {activePage === 'overview' && <OverviewPage employees={employees} leaveRequests={leaveRequests} activeLeaves={activeLeaves} leaveHistory={leaveHistory} />}
        {activePage === 'employees' && <EmployeesPage employees={employees} onAdd={() => { setEmployeeMode('add'); setEmployeeForm(emptyEmployee); setShowEmployeeForm(true) }} onEdit={(employee) => { setEmployeeMode('edit'); setEmployeeForm(employee); setShowEmployeeForm(true) }} onExport={exportCsv} onImport={importCsv} onTemplate={downloadTemplate} onShowTasks={() => setShowPendingTasks(true)} />}
        {activePage === 'leave' && <LeavePage leaveRequests={leaveRequests} activeLeaves={activeLeaves} leaveHistory={leaveHistory} passportHandovers={passportHandovers} onAddRequest={() => { setEditingLeaveRequest(null); setShowLeaveForm(true) }} onAddPassport={() => setEditingPassportRecord({ id: `PP-${Date.now()}`, employeeId: employees[0]?.employeeId ?? '', name: employees[0]?.fullName ?? '', department: employees[0]?.department ?? departmentsList[0], nationality: employees[0]?.nationality ?? 'Maldivian', leaveTypeCode: 'AL', departureDate: new Date().toISOString().slice(0, 10), returnDate: new Date().toISOString().slice(0, 10), days: 1, passportStep: 'Issued', givenDate: '', returnedDate: '', sentToHoDate: '', remarks: '' })} onEditRequest={(record) => { setEditingLeaveRequest(record); setShowLeaveForm(true) }} onDeleteRequest={deleteLeaveRequest} onAdvanceRequestStep={advanceLeaveRequestStep} onHistoryConfirm={updateHistoryConfirmation} onEditPassport={(record) => setEditingPassportRecord(record)} onDeletePassport={deletePassportRecord} />}
        {activePage === 'operations' && <OperationsPage employees={employees} />}
        {activePage === 'activities' && <ActivitiesPage employees={employees} />}
        {activePage === 'termination' && <TerminationPage noticeTerminations={noticeTerminations} completedTerminations={completedTerminations} onAdd={openAddTermination} onEdit={openEditTermination} onAdvanceStatus={advanceTerminationStatus} onDelete={deleteTermination} onViewDetails={(record) => setTerminationDetails(record)} />}
        {activePage === 'settings' && <SettingsPage employees={employees} leaveRequests={leaveRequests} activeLeaves={activeLeaves} />}
      </main>

      {showEmployeeForm && <EmployeeFormModal form={employeeForm} mode={employeeMode} onClose={() => setShowEmployeeForm(false)} onSave={saveEmployee} setForm={setEmployeeForm} />}
      {showPendingTasks && <PendingTasksModal employees={employees} onClose={() => setShowPendingTasks(false)} />}
      {showLeaveForm && <LeaveFormModal employees={employees} initialRecord={editingLeaveRequest} onClose={() => { setShowLeaveForm(false); setEditingLeaveRequest(null) }} onSave={saveLeaveRequest} />}
      {editingPassportRecord && <PassportHandoverModal record={editingPassportRecord} employees={employees} onClose={() => setEditingPassportRecord(null)} onSave={savePassportRecord} />}
      {showTerminationForm && editingTermination && <TerminationFormModal mode={terminationFormMode} record={editingTermination} employees={employees} onClose={() => { setShowTerminationForm(false); setEditingTermination(null) }} onSave={saveTerminationRecord} />}
      {terminationDetails && <TerminationDetailsModal record={terminationDetails} onClose={() => setTerminationDetails(null)} />}
    </div>
  )
}

export default App

