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
  stepDates?: Partial<Record<LeaveRequestStep, string>>
  skipProgress?: boolean
}

type LeaveExtension = {
  id: string
  leaveTypeCode: LeaveTypeCode
  additionalDays: number
  reason: string
  addedDate: string
}

type ActiveLeaveRecord = LeaveBase & {
  status: 'Departed'
  stepDates?: Partial<Record<LeaveRequestStep, string>>
  skipProgress?: boolean
  extensions?: LeaveExtension[]
  originalReturnDate?: string   // frozen before first extension
  originalDays?: number         // frozen before first extension
}

type LeaveHistoryRecord = LeaveBase & {
  confirmation?: HistoryConfirmation
  stepDates?: Partial<Record<LeaveRequestStep, string>>
  skipProgress?: boolean
  extensions?: LeaveExtension[]
  originalReturnDate?: string
  originalDays?: number
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

type ActivitiesSection = 'requests' | 'visits' | 'incidents' | 'passport' | 'inventory'

type InventoryCategory = 'Stationery' | 'Medical'

type InventoryItem = {
  id: string
  name: string
  category: InventoryCategory
  quantity: number
  unit: string
  minQuantity: number
  location: string
  lastUpdated: string
  remarks: string
}

type InventoryUsageRecord = {
  id: string
  itemId: string
  itemName: string
  quantityUsed: number
  unit: string
  usedBy: string
  employeeId: string
  department: string
  usedDate: string
  purpose: string
  remarks: string
}

type MedicalCaseRecord = {
  id: string
  caseDate: string
  employeeId: string
  name: string
  department: string   // displayed as "Section" in UI
  reason: string
  hospital: string
  departTime: string
  returnTime: string
  doctorAdvice: string
  mcProvided: boolean
  sickLeaveFrom: string
  sickLeaveTo: string
  sickLeaveDays: number
  recordedBy: string
  isUrgent?: boolean
  isAdmitted?: boolean
  admittedDate?: string
  dischargedDate?: string
}

type OffSiteRecord = {
  id: string
  employeeId: string
  name: string
  department: string
  nationality: string
  departureDate: string
  returnDate: string
  purpose: string
  status: 'Out' | 'Returned'
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
type TerminationTab = 'notice' | 'history' | 'exit-interview'
type TerminationType = 'Resignation' | 'Dismissal' | 'Probation End' | 'Contract Expiry' | 'Absconded' | 'Other'

type EISatisfactionLevel = 'Very Satisfied' | 'Satisfied' | 'Dissatisfied' | ''

type EIQuestionnaire = {
  duties: EISatisfactionLevel
  training: EISatisfactionLevel
  advancement: EISatisfactionLevel
  salary: EISatisfactionLevel
  benefits: EISatisfactionLevel
  workConditions: EISatisfactionLevel
  workHours: EISatisfactionLevel
  coworkers: EISatisfactionLevel
  supervision: EISatisfactionLevel
  overall: EISatisfactionLevel
}

type ExitInterviewRecord = {
  id: string
  employeeId: string
  name: string
  department: string
  designation: string
  nationality: string
  terminationType: TerminationType
  departureDate: string
  periodOfService: string
  rehireEligible: boolean
  interviewDate: string
  // Reasons
  involuntaryReasons: string[]
  voluntaryReasons: string[]
  invOther: string
  volOther: string
  employeeComments: string
  // Questionnaire
  questionnaire: EIQuestionnaire
  areasToImprove: string
  // 14 short questions
  q1: string; q2: string; q3: string; q4: string; q5: string
  q6: string; q7: string; q8: string; q9: string; q10: string
  q11: string; q12: string; q13: string; q14: string
  interviewerComments: string
  interviewerName: string
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
  stageDates?: Partial<Record<TerminationStage, string>>
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
  { employeeId: '35494', fullName: 'GAMARALALAGE AJITH WIJESIRI', department: 'ACCOUNTS AND FINANCE', designation: 'SENIOR ACCOUNTANT', nationality: 'SRI LANKAN', nicPassportNo: 'N5521034', workPermitNo: 'WP-35494', dateOfJoin: '2007-06-01', mobileNo: '7771234', dateOfBirth: '1978-03-14', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '37916', fullName: 'JAGO', department: 'STORES', designation: 'STORE ASSISTANT', nationality: 'INDIA', nicPassportNo: 'K7712345', workPermitNo: 'WP-37916', dateOfJoin: '2009-04-15', mobileNo: '7772345', dateOfBirth: '1985-07-20', passportStatus: 'Valid', siteStatus: 'Off Site', gender: 'Male' },
  { employeeId: '43407', fullName: 'MOHAMMAD DELOWAR HOSSAIN', department: 'STORES', designation: 'STOREKEEPER', nationality: 'BANGLADESH', nicPassportNo: 'BN1122334', workPermitNo: 'WP-43407', dateOfJoin: '2013-02-20', mobileNo: '7773456', dateOfBirth: '1987-11-05', passportStatus: 'Valid', siteStatus: 'On Leave', gender: 'Male' },
  { employeeId: '44160', fullName: 'ANURA PUSHPA KUMARA K W', department: 'CEMENT PLANT', designation: 'PLANT OPERATOR', nationality: 'SRI LANKAN', nicPassportNo: 'N0876541', workPermitNo: 'WP-44160', dateOfJoin: '2014-01-10', mobileNo: '7774567', dateOfBirth: '1983-06-22', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '44386', fullName: 'MAJIB', department: 'STORES', designation: 'STORE ASSISTANT', nationality: 'MALDIVES', nicPassportNo: 'A112233B', workPermitNo: '', dateOfJoin: '2014-03-01', mobileNo: '7775678', dateOfBirth: '1990-09-15', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '50223', fullName: 'AYESHAN KUMARA WIJEYATHUNGA MUDALIGE', department: 'STORES', designation: 'LOGISTICS COORDINATOR', nationality: 'SRI LANKAN', nicPassportNo: 'N0765432', workPermitNo: 'WP-50223', dateOfJoin: '2018-07-15', mobileNo: '7776789', dateOfBirth: '1991-04-08', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '50427', fullName: 'MD SAIFUR RAHMAN', department: 'STORES', designation: 'STOREKEEPER', nationality: 'BANGLADESH', nicPassportNo: 'BP2233445', workPermitNo: 'WP-50427', dateOfJoin: '2018-09-10', mobileNo: '7777890', dateOfBirth: '1989-01-30', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '51555', fullName: 'MOHAMED SHIFAZ', department: 'ADMINISTRATION', designation: 'ADMINISTRATIVE OFFICER', nationality: 'MALDIVES', nicPassportNo: 'A223344C', workPermitNo: '', dateOfJoin: '2019-03-05', mobileNo: '7778901', dateOfBirth: '1992-08-17', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '52804', fullName: 'AHMED IMRAN', department: 'ACCOUNTS AND FINANCE', designation: 'ACCOUNTS OFFICER', nationality: 'MALDIVES', nicPassportNo: 'A334455D', workPermitNo: '', dateOfJoin: '2019-11-20', mobileNo: '7779012', dateOfBirth: '1993-12-10', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '53029', fullName: 'KUMARAN VAITHILINGAM', department: 'STORES', designation: 'SENIOR STOREKEEPER', nationality: 'INDIA', nicPassportNo: 'T2234561', workPermitNo: 'WP-53029', dateOfJoin: '2020-01-08', mobileNo: '7770123', dateOfBirth: '1982-05-25', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '53979', fullName: 'NAVEEN SEKAR', department: 'STORES', designation: 'STORE ASSISTANT', nationality: 'INDIA', nicPassportNo: 'T3345672', workPermitNo: 'WP-53979', dateOfJoin: '2020-06-15', mobileNo: '7771234', dateOfBirth: '1994-02-14', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '55426', fullName: 'ABHISHEK CHETRY', department: 'LOSS PREVENTION', designation: 'SECURITY OFFICER', nationality: 'INDIA', nicPassportNo: 'T5567891', workPermitNo: 'WP-55426', dateOfJoin: '2021-04-20', mobileNo: '7772345', dateOfBirth: '1996-07-03', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '55427', fullName: 'SARAVANAN RAJENDRAN', department: 'STORES', designation: 'STOREKEEPER', nationality: 'INDIA', nicPassportNo: 'T6678902', workPermitNo: 'WP-55427', dateOfJoin: '2021-04-20', mobileNo: '7773456', dateOfBirth: '1988-10-18', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '56141', fullName: 'RAJU PERKA', department: 'CAFE', designation: 'FOOD SERVICE ASSISTANT', nationality: 'INDIA', nicPassportNo: 'T7789013', workPermitNo: 'WP-56141', dateOfJoin: '2021-10-05', mobileNo: '7774567', dateOfBirth: '1990-03-28', passportStatus: 'Valid', siteStatus: 'On Leave', gender: 'Male' },
  { employeeId: '56530', fullName: 'PUBUDU MADURANGA ALAWATHTHA KANKANAMGE', department: 'ADMINISTRATION', designation: 'HR COORDINATOR', nationality: 'SRI LANKAN', nicPassportNo: 'N0189342', workPermitNo: 'WP-56530', dateOfJoin: '2022-01-15', mobileNo: '7775678', dateOfBirth: '1991-09-12', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '56646', fullName: 'CHANDRASHEKHER PURELLA', department: 'ACCOUNTS AND FINANCE', designation: 'ACCOUNTANT', nationality: 'INDIA', nicPassportNo: 'T8890124', workPermitNo: 'WP-56646', dateOfJoin: '2022-02-28', mobileNo: '7776789', dateOfBirth: '1986-11-07', passportStatus: 'Valid', siteStatus: 'On Leave', gender: 'Male' },
  { employeeId: '57637', fullName: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', designation: 'COOK', nationality: 'INDIA', nicPassportNo: 'T6678234', workPermitNo: 'WP-57637', dateOfJoin: '2022-09-10', mobileNo: '7777890', dateOfBirth: '1985-04-14', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '57785', fullName: 'THUSITHA BANDARA', department: 'PAINTING PROJECT', designation: 'SITE MANAGER, BLASTING & PAINTING', nationality: 'SRI LANKAN', nicPassportNo: 'N1234567', workPermitNo: 'WP-57785', dateOfJoin: '2022-11-01', mobileNo: '7778901', dateOfBirth: '1980-06-30', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '57803', fullName: 'INDIKA SAMPATH SAMARASINGHEGE', department: 'STORES', designation: 'LOGISTICS ASSISTANT', nationality: 'SRI LANKAN', nicPassportNo: 'N0234561', workPermitNo: 'WP-57803', dateOfJoin: '2022-12-01', mobileNo: '7779012', dateOfBirth: '1992-02-20', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '57935', fullName: 'ARUNODA KAVINDU NANAYAKKARA', department: 'ACCOUNTS AND FINANCE', designation: 'ACCOUNTS ASSISTANT', nationality: 'SRI LANKAN', nicPassportNo: 'N0287342', workPermitNo: 'WP-57935', dateOfJoin: '2023-01-10', mobileNo: '7770123', dateOfBirth: '1997-05-16', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '58034', fullName: 'SAMEERA MADUSANKA GUNARATHNA', department: 'STORES', designation: 'STOREKEEPER', nationality: 'SRI LANKAN', nicPassportNo: 'N0187423', workPermitNo: 'WP-58034', dateOfJoin: '2023-02-14', mobileNo: '7771345', dateOfBirth: '1990-08-11', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '58686', fullName: 'YASAR ARAFATH BASHEER AHAMED', department: 'STORES', designation: 'STORE ASSISTANT', nationality: 'INDIA', nicPassportNo: 'R8821054', workPermitNo: 'WP-58686', dateOfJoin: '2023-05-18', mobileNo: '7772456', dateOfBirth: '1998-01-25', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '58692', fullName: 'SHANTUMON PATHIYIL CHACKO', department: 'HUMAN RESOURCES', designation: 'HR MANAGER', nationality: 'INDIA', nicPassportNo: 'T4482910', workPermitNo: 'WP-58692', dateOfJoin: '2023-05-20', mobileNo: '7773567', dateOfBirth: '1984-12-03', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '59217', fullName: 'RAJKUMAR GUPTA', department: 'MECHANICAL', designation: 'MECHANIC', nationality: 'INDIA', nicPassportNo: 'T9901235', workPermitNo: 'WP-59217', dateOfJoin: '2023-09-12', mobileNo: '7774678', dateOfBirth: '1988-04-22', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '59361', fullName: 'DIBIN ROY', department: 'LPG PLANT', designation: 'PLANT TECHNICIAN', nationality: 'INDIA', nicPassportNo: 'T0012346', workPermitNo: 'WP-59361', dateOfJoin: '2023-10-05', mobileNo: '7775789', dateOfBirth: '1993-09-08', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '59820', fullName: 'NARAYANAN KUTTY', department: 'HOUSEKEEPING', designation: 'HOUSEKEEPER', nationality: 'INDIA', nicPassportNo: 'T1123457', workPermitNo: 'WP-59820', dateOfJoin: '2024-01-08', mobileNo: '7776890', dateOfBirth: '1986-03-19', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '60104', fullName: 'SURESH BAHADUR THAPA', department: 'MAINTENANCE', designation: 'MAINTENANCE TECHNICIAN', nationality: 'NEPAL', nicPassportNo: 'N8876543', workPermitNo: 'WP-60104', dateOfJoin: '2024-03-15', mobileNo: '7777901', dateOfBirth: '1991-07-30', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '60512', fullName: 'CHAMINDA WIJESINGHE', department: 'PAINTING PROJECT', designation: 'PAINTER', nationality: 'SRI LANKAN', nicPassportNo: 'N1987654', workPermitNo: 'WP-60512', dateOfJoin: '2024-05-20', mobileNo: '7778012', dateOfBirth: '1985-11-14', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '61033', fullName: 'MD ARIF HOSSAIN', department: 'STORES', designation: 'STORE ASSISTANT', nationality: 'BANGLADESH', nicPassportNo: 'BR3344556', workPermitNo: 'WP-61033', dateOfJoin: '2024-08-10', mobileNo: '7779123', dateOfBirth: '1995-02-28', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '61245', fullName: 'ARUSHULLA RASHID', department: 'HUMAN RESOURCES', designation: 'HR OFFICER', nationality: 'MALDIVES', nicPassportNo: 'A445566E', workPermitNo: '', dateOfJoin: '2024-09-01', mobileNo: '7770234', dateOfBirth: '1994-06-05', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Female' },
]

function createEmployees(): Employee[] {
  return baseEmployees.sort((a, b) => a.department.localeCompare(b.department) || a.fullName.localeCompare(b.fullName))
}

const initialEmployees = createEmployees()

const initialLeaveRequests: LeaveRequestRecord[] = [
  { id: 'LV-2026-001', employeeId: '57803', name: 'INDIKA SAMPATH SAMARASINGHEGE', department: 'STORES', nationality: 'SRI LANKAN', leaveTypeCode: 'AL', departureDate: '2026-06-10', returnDate: '2026-07-10', days: 30, remarks: 'Annual home leave', step: 'Ticket Booked' },
  { id: 'LV-2026-002', employeeId: '50427', name: 'MD SAIFUR RAHMAN', department: 'STORES', nationality: 'BANGLADESH', leaveTypeCode: 'AL', departureDate: '2026-06-20', returnDate: '2026-07-20', days: 30, remarks: 'Annual leave — Bangladesh', step: 'Dates Shared' },
  { id: 'LV-2026-003', employeeId: '53029', name: 'KUMARAN VAITHILINGAM', department: 'STORES', nationality: 'INDIA', leaveTypeCode: 'FRL', departureDate: '2026-07-01', returnDate: '2026-07-15', days: 14, remarks: 'Family responsibility — father hospitalised', step: 'Approved' },
  { id: 'LV-2026-004', employeeId: '53979', name: 'NAVEEN SEKAR', department: 'STORES', nationality: 'INDIA', leaveTypeCode: 'AL', departureDate: '2026-08-01', returnDate: '2026-09-01', days: 31, remarks: '', step: 'Letter Submitted' },
  { id: 'LV-2026-005', employeeId: '59820', name: 'NARAYANAN KUTTY', department: 'HOUSEKEEPING', nationality: 'INDIA', leaveTypeCode: 'AL', departureDate: '2026-07-15', returnDate: '2026-08-14', days: 30, remarks: 'Annual home leave', step: 'Approved' },
]

const initialActiveLeaves: ActiveLeaveRecord[] = [
  { id: 'LVA-2026-001', employeeId: '56646', name: 'CHANDRASHEKHER PURELLA', department: 'ACCOUNTS AND FINANCE', nationality: 'INDIA', leaveTypeCode: 'AL', departureDate: '2026-04-28', returnDate: '2026-05-28', days: 30, remarks: 'Annual India leave', status: 'Departed' },
  { id: 'LVA-2026-002', employeeId: '43407', name: 'MOHAMMAD DELOWAR HOSSAIN', department: 'STORES', nationality: 'BANGLADESH', leaveTypeCode: 'AL', departureDate: '2026-05-01', returnDate: '2026-06-01', days: 31, remarks: 'Annual Bangladesh leave', status: 'Departed' },
  { id: 'LVA-2026-003', employeeId: '56141', name: 'RAJU PERKA', department: 'CAFE', nationality: 'INDIA', leaveTypeCode: 'FRL', departureDate: '2026-05-10', returnDate: '2026-05-24', days: 14, remarks: 'Emergency family leave', status: 'Departed' },
]

const initialLeaveHistory: LeaveHistoryRecord[] = [
  // ── Normal leaves (no extension) ──
  { id: 'LVH-2026-001', employeeId: '44386', name: 'MAJIB', department: 'STORES', nationality: 'MALDIVES', leaveTypeCode: 'AL', departureDate: '2026-02-01', returnDate: '2026-03-02', days: 30, remarks: 'Annual leave', confirmation: 'Returned' },
  { id: 'LVH-2026-002', employeeId: '57637', name: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', nationality: 'INDIA', leaveTypeCode: 'AL', departureDate: '2025-11-01', returnDate: '2025-12-01', days: 30, remarks: 'Annual India leave', confirmation: 'Returned' },
  { id: 'LVH-2026-003', employeeId: '50223', name: 'AYESHAN KUMARA WIJEYATHUNGA MUDALIGE', department: 'STORES', nationality: 'SRI LANKAN', leaveTypeCode: 'AL', departureDate: '2026-01-05', returnDate: '2026-02-04', days: 30, remarks: '', confirmation: 'Returned' },
  { id: 'LVH-2026-004', employeeId: '58034', name: 'SAMEERA MADUSANKA GUNARATHNA', department: 'STORES', nationality: 'SRI LANKAN', leaveTypeCode: 'FRL', departureDate: '2026-03-15', returnDate: '2026-03-29', days: 14, remarks: 'Father passed away', confirmation: 'Returned' },
  { id: 'LVH-2025-001', employeeId: '37916', name: 'JAGO', department: 'STORES', nationality: 'INDIA', leaveTypeCode: 'AL', departureDate: '2025-09-01', returnDate: '2025-10-01', days: 30, remarks: 'Annual leave — did not return on time', confirmation: 'Not Returned' },
  { id: 'LVH-2025-002', employeeId: '55427', name: 'SARAVANAN RAJENDRAN', department: 'STORES', nationality: 'INDIA', leaveTypeCode: 'AL', departureDate: '2025-07-10', returnDate: '2025-08-09', days: 30, remarks: '', confirmation: 'Returned' },
  { id: 'LVH-2025-003', employeeId: '59361', name: 'DIBIN ROY', department: 'LPG PLANT', nationality: 'INDIA', leaveTypeCode: 'AL', departureDate: '2025-12-05', returnDate: '2026-01-04', days: 30, remarks: 'Year-end home leave', confirmation: 'Returned' },
  // ── Extended leaves — AL originally, extended under NP ──
  {
    id: 'LVH-2026-005',
    employeeId: '53029', name: 'KUMARAN VAITHILINGAM', department: 'STORES', nationality: 'INDIA',
    leaveTypeCode: 'AL', departureDate: '2025-08-10', returnDate: '2025-09-19', days: 40,
    remarks: 'Extended: father hospitalised — required extra time | Extended +10d (No Pay) — father hospitalised, could not return',
    confirmation: 'Returned',
    originalReturnDate: '2025-09-09', originalDays: 30,
    extensions: [{ id: 'EXT-KV-001', leaveTypeCode: 'NP', additionalDays: 10, reason: 'Father hospitalised — could not return as planned', addedDate: '2025-09-07' }],
  },
  {
    id: 'LVH-2026-006',
    employeeId: '50427', name: 'MD SAIFUR RAHMAN', department: 'STORES', nationality: 'BANGLADESH',
    leaveTypeCode: 'AL', departureDate: '2025-05-01', returnDate: '2025-06-15', days: 45,
    remarks: 'Visa delay at Bangladesh — extended under NP',
    confirmation: 'Returned',
    originalReturnDate: '2025-05-31', originalDays: 30,
    extensions: [{ id: 'EXT-SR-001', leaveTypeCode: 'NP', additionalDays: 15, reason: 'Bangladesh visa processing delay — passport held at embassy', addedDate: '2025-05-29' }],
  },
  {
    id: 'LVH-2025-004',
    employeeId: '56141', name: 'RAJU PERKA', department: 'CAFE', nationality: 'INDIA',
    leaveTypeCode: 'FRL', departureDate: '2025-04-10', returnDate: '2025-04-31', days: 21,
    remarks: 'Emergency family leave extended',
    confirmation: 'Returned',
    originalReturnDate: '2025-04-24', originalDays: 14,
    extensions: [{ id: 'EXT-RP-001', leaveTypeCode: 'NP', additionalDays: 7, reason: 'Mother in ICU — required additional time at home', addedDate: '2025-04-22' }],
  },
  {
    id: 'LVH-2025-005',
    employeeId: '58034', name: 'SAMEERA MADUSANKA GUNARATHNA', department: 'STORES', nationality: 'SRI LANKAN',
    leaveTypeCode: 'AL', departureDate: '2024-12-20', returnDate: '2025-02-03', days: 45,
    remarks: 'Annual leave with Circumcision extension',
    confirmation: 'Returned',
    originalReturnDate: '2025-01-19', originalDays: 30,
    extensions: [{ id: 'EXT-SM-001', leaveTypeCode: 'CC', additionalDays: 15, reason: 'Son circumcision ceremony + family event in Sri Lanka', addedDate: '2025-01-17' }],
  },
]

const initialPassportHandovers: PassportHandoverRecord[] = [
  { id: 'PP-2026-001', employeeId: '56646', name: 'CHANDRASHEKHER PURELLA', department: 'ACCOUNTS AND FINANCE', nationality: 'INDIA', leaveTypeCode: 'AL', departureDate: '2026-04-28', returnDate: '2026-05-28', days: 30, passportStep: 'Sent to HO', givenDate: '2026-04-20', returnedDate: '', sentToHoDate: '2026-04-25', remarks: 'Passport submitted to Head Office for visa stamping' },
  { id: 'PP-2026-002', employeeId: '43407', name: 'MOHAMMAD DELOWAR HOSSAIN', department: 'STORES', nationality: 'BANGLADESH', leaveTypeCode: 'AL', departureDate: '2026-05-01', returnDate: '2026-06-01', days: 31, passportStep: 'Collected', givenDate: '2026-04-24', returnedDate: '2026-06-03', sentToHoDate: '', remarks: 'Collected on return from leave' },
  { id: 'PP-2026-003', employeeId: '50427', name: 'MD SAIFUR RAHMAN', department: 'STORES', nationality: 'BANGLADESH', leaveTypeCode: 'AL', departureDate: '2026-06-20', returnDate: '2026-07-20', days: 30, passportStep: 'Issued', givenDate: '2026-06-15', returnedDate: '', sentToHoDate: '', remarks: 'Passport issued for upcoming leave' },
  { id: 'PP-2025-001', employeeId: '57637', name: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', nationality: 'INDIA', leaveTypeCode: 'AL', departureDate: '2025-11-01', returnDate: '2025-12-01', days: 30, passportStep: 'Collected', givenDate: '2025-10-25', returnedDate: '2025-12-04', sentToHoDate: '', remarks: '' },
]

const initialNoticeTerminations: EnhancedTerminationRecord[] = [
  { id: 'TERM-2026-001', employeeId: '57637', name: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', designation: 'COOK', nationality: 'INDIA', passportNo: 'T6678234', wpNo: 'WP-57637', dateOfJoin: '2022-09-10', dateSubmitted: '2026-05-01', lastWorkingDate: '2026-05-31', departureDate: '2026-06-05', currentStage: 'Exit Interview', reasonForLeaving: 'Resigned to pursue better opportunity back home', satisfactionRating: 3, rehireEligible: true, exitInterviewCompleted: false, comments: 'Good performance throughout tenure', terminationType: 'Resignation' },
  { id: 'TERM-2026-002', employeeId: '55427', name: 'SARAVANAN RAJENDRAN', department: 'STORES', designation: 'STOREKEEPER', nationality: 'INDIA', passportNo: 'T6678902', wpNo: 'WP-55427', dateOfJoin: '2021-04-20', dateSubmitted: '2026-05-10', lastWorkingDate: '2026-06-09', departureDate: '2026-06-12', currentStage: 'Letter Submitted', reasonForLeaving: 'Contract expired — not renewing', satisfactionRating: 0, rehireEligible: true, exitInterviewCompleted: false, comments: '', terminationType: 'Contract Expiry' },
]

const initialCompletedTerminations: CompletedTerminationRecord[] = [
  { id: 'COMP-2025-001', employeeId: '33856', name: 'KRISHNA PRASAD RIMAL', department: 'MECHANICAL', designation: 'MECHANIC', nationality: 'NEPAL', passportNo: 'N8234567', wpNo: 'WP-33856', dateOfJoin: '2012-05-01', lastWorkingDate: '2024-01-15', departureDate: '2024-01-20', currentStage: 'Pending Departure', rehireEligible: true, exitInterviewCompleted: true, reasonForLeaving: 'Resigned to return to Nepal', comments: 'Excellent service for 12 years', terminationType: 'Resignation' },
  { id: 'COMP-2025-002', employeeId: '31672', name: 'MD RAFIQUL ISLAM', department: 'ADMINISTRATION', designation: 'ADMIN ASSISTANT', nationality: 'BANGLADESH', passportNo: 'BN3344556', wpNo: 'WP-31672', dateOfJoin: '2015-03-10', lastWorkingDate: '2023-06-30', departureDate: '2023-07-05', currentStage: 'Pending Departure', rehireEligible: false, exitInterviewCompleted: true, reasonForLeaving: 'Contract not renewed due to performance', comments: 'Contract terminated after performance review', terminationType: 'Contract Expiry' },
  { id: 'COMP-2025-003', employeeId: '25431', name: 'THILINA LAKSHAN PERERA', department: 'STORES', designation: 'STOREKEEPER', nationality: 'SRI LANKAN', passportNo: 'N4523678', wpNo: 'WP-25431', dateOfJoin: '2010-08-15', lastWorkingDate: '2022-12-31', departureDate: '2023-01-05', currentStage: 'Pending Departure', rehireEligible: true, exitInterviewCompleted: true, reasonForLeaving: 'Personal reasons — relocating to Australia', comments: 'Well-liked by all departments', terminationType: 'Resignation' },
  { id: 'COMP-2024-001', employeeId: '38201', name: 'PRASAD JAYAWARDENA', department: 'MAINTENANCE', designation: 'MAINTENANCE TECHNICIAN', nationality: 'SRI LANKAN', passportNo: 'N5634789', wpNo: 'WP-38201', dateOfJoin: '2011-06-01', lastWorkingDate: '2024-09-30', departureDate: '2024-10-04', currentStage: 'Pending Departure', rehireEligible: false, exitInterviewCompleted: false, reasonForLeaving: 'Absconded after annual leave — did not return', comments: 'No contact since Sept 2024', terminationType: 'Absconded' },
]

const initialExitInterviews: ExitInterviewRecord[] = [
  {
    id: 'EI-2024-001', employeeId: '33856', name: 'KRISHNA PRASAD RIMAL', department: 'MECHANICAL',
    designation: 'MECHANIC', nationality: 'NEPAL', terminationType: 'Resignation',
    departureDate: '2024-01-20', periodOfService: '11y 8m', rehireEligible: true, interviewDate: '2024-01-12',
    involuntaryReasons: [], voluntaryReasons: ['Personal Frictions', 'Lack of Promotional Possibility'],
    invOther: '', volOther: '',
    employeeComments: 'Enjoyed working at TIC. The team is very supportive. Would have stayed longer if personal situation allowed. Salary could be improved for senior staff.',
    questionnaire: { duties: 'Satisfied', training: 'Satisfied', advancement: 'Dissatisfied', salary: 'Satisfied', benefits: 'Satisfied', workConditions: 'Very Satisfied', workHours: 'Satisfied', coworkers: 'Very Satisfied', supervision: 'Very Satisfied', overall: 'Satisfied' },
    areasToImprove: 'Career advancement pathways and salary increments for long-serving staff.',
    q1: 'Personal reasons and desire to return to family in Nepal.', q2: 'The friendly work environment and supportive colleagues.',
    q3: 'Limited opportunities for career advancement.', q4: 'No major policy obstacles.', q5: 'Yes, if better opportunity is offered.',
    q6: 'Yes, TIC is a good company to work for.', q7: 'A promotion or salary increment might have helped.',
    q8: 'Yes, job duties were as expected.', q9: 'Yes, adequate training was provided.',
    q10: 'Generally yes, received feedback during appraisals.', q11: 'Partially — limited advancement options.',
    q12: 'Mostly satisfied with pay and benefits.', q13: 'Accommodation is clean and well-maintained. Food quality is good.',
    q14: 'No suitable internal transfer was available.',
    interviewerComments: 'Employee served with dedication for nearly 12 years. Departure is purely personal. Recommended for rehire.', interviewerName: 'SHANTUMON PATHIYIL CHACKO',
  },
  {
    id: 'EI-2023-001', employeeId: '31672', name: 'MD RAFIQUL ISLAM', department: 'ADMINISTRATION',
    designation: 'ADMIN ASSISTANT', nationality: 'BANGLADESH', terminationType: 'Contract Expiry',
    departureDate: '2023-07-05', periodOfService: '8y 3m', rehireEligible: false, interviewDate: '2023-06-25',
    involuntaryReasons: ['Unsatisfactory work, Poor Performance'], voluntaryReasons: ['Wages', 'Lack of Promotional Possibility'],
    invOther: '', volOther: '',
    employeeComments: 'Salary was not competitive compared to the market. Management communication could be improved. No clear career progression path was provided during my tenure.',
    questionnaire: { duties: 'Satisfied', training: 'Dissatisfied', advancement: 'Dissatisfied', salary: 'Dissatisfied', benefits: 'Dissatisfied', workConditions: 'Satisfied', workHours: 'Satisfied', coworkers: 'Satisfied', supervision: 'Dissatisfied', overall: 'Dissatisfied' },
    areasToImprove: 'Training programs, salary structure, and clearer career progression for admin staff.',
    q1: 'Contract not renewed and dissatisfaction with salary.', q2: 'Working with a diverse team.',
    q3: 'Low salary and lack of recognition.', q4: 'Some administrative procedures were slow and bureaucratic.',
    q5: 'Unlikely given current compensation levels.', q6: 'Not at the current salary rates.',
    q7: 'A salary review and clearer performance feedback would have helped.', q8: 'Mostly yes.',
    q9: 'No, training opportunities were very limited.', q10: 'Performance feedback was inconsistent.',
    q11: 'No, career goals were not supported.', q12: 'No, pay was below expectations.',
    q13: 'Accommodation is acceptable. Mess food variety could be improved.', q14: 'Yes, but no suitable position was available.',
    interviewerComments: 'Contract ended. Employee had performance issues in last year. Not recommended for rehire.', interviewerName: 'SHANTUMON PATHIYIL CHACKO',
  },
  {
    id: 'EI-2023-002', employeeId: '25431', name: 'THILINA LAKSHAN PERERA', department: 'STORES',
    designation: 'STOREKEEPER', nationality: 'SRI LANKAN', terminationType: 'Resignation',
    departureDate: '2023-01-05', periodOfService: '12y 5m', rehireEligible: true, interviewDate: '2022-12-22',
    involuntaryReasons: [], voluntaryReasons: ['Marriage', 'Further Studies'],
    invOther: '', volOther: '',
    employeeComments: 'Great company to work for. Leaving purely for personal reasons — relocating with family to Australia. Would highly recommend TIC to friends and colleagues.',
    questionnaire: { duties: 'Very Satisfied', training: 'Very Satisfied', advancement: 'Satisfied', salary: 'Satisfied', benefits: 'Very Satisfied', workConditions: 'Very Satisfied', workHours: 'Satisfied', coworkers: 'Very Satisfied', supervision: 'Very Satisfied', overall: 'Very Satisfied' },
    areasToImprove: 'Internet connectivity on-site could be faster.',
    q1: 'Personal decision to relocate with family to Australia.', q2: 'The team spirit and sense of community on-site.',
    q3: 'Being away from family for long periods.', q4: 'No obstacles.', q5: 'Yes, absolutely would consider returning.',
    q6: 'Definitely yes.', q7: 'Nothing — this is a purely personal decision.',
    q8: 'Yes, fully as expected.', q9: 'Yes, excellent training support.',
    q10: 'Yes, always received clear performance feedback.', q11: 'Yes, career growth was fully supported.',
    q12: 'Yes, fully satisfied with pay and benefits.', q13: 'Excellent accommodation and food. Very comfortable living conditions.',
    q14: 'Did not need to — decision was to leave the country.',
    interviewerComments: 'Outstanding employee over 12 years. Leaving due to relocation. Highly recommended for rehire if circumstances change.', interviewerName: 'SHANTUMON PATHIYIL CHACKO',
  },
]

const initialMedicalCases: MedicalCaseRecord[] = [
  { id: 'MC-2026-001', caseDate: '2026-04-26', employeeId: '55426', name: 'ABHISHEK CHETRY', department: 'LOSS PREVENTION', reason: 'Fever, Body pain - Follow up', hospital: 'IGMH', departTime: '09:00', returnTime: '14:00', doctorAdvice: '- Fever x 3 DAYS\n- Headache+, body pain+\n- Productive cough+, pleuritic chest pain\n- Sore throat+\n- No vomiting, abdominal pain\n- Poor appetite\n- No altered bowl habits\n- Medication provided for 5 days\n- MC : 26/04/26 to 27/04/26', mcProvided: true, sickLeaveFrom: '2026-04-26', sickLeaveTo: '2026-04-27', sickLeaveDays: 2, recordedBy: 'HR Admin', isUrgent: false, isAdmitted: false },
  { id: 'MC-2026-002', caseDate: '2026-04-26', employeeId: '59361', name: 'DIBIN ROY', department: 'LPG PLANT', reason: 'Fever, Dizziness, Vomiting', hospital: 'IGMH', departTime: '09:00', returnTime: '12:30', doctorAdvice: '- Fever since 25/04/26\n- Day 2 of illness\n- Coryza+, mild productive cough+\n- One episode of vomiting yesterday\n- Body pain+, headache+, dizziness+\n- No abdominal pain, loose motion\n- Bladder habits normal\n- Medication provided for 5 days\n- MC : 26/04/26 to 27/04/26', mcProvided: true, sickLeaveFrom: '2026-04-26', sickLeaveTo: '2026-04-27', sickLeaveDays: 2, recordedBy: 'HR Admin', isUrgent: false, isAdmitted: false },
  { id: 'MC-2026-003', caseDate: '2026-04-26', employeeId: '44160', name: 'ANURA PUSHPA KUMARA K W', department: 'CEMENT PLANT', reason: 'Back pain', hospital: 'IGMH', departTime: '09:00', returnTime: '12:30', doctorAdvice: '- Prescription not RECEIVED\n- MC : 26/04/26 to 27/04/26', mcProvided: false, sickLeaveFrom: '2026-04-26', sickLeaveTo: '2026-04-26', sickLeaveDays: 1, recordedBy: 'HR Admin', isUrgent: false, isAdmitted: false },
  { id: 'MC-2026-004', caseDate: '2026-04-26', employeeId: '59217', name: 'RAJKUMAR GUPTA', department: 'MECHANICAL', reason: 'Cough - Follow Up', hospital: 'IGMH', departTime: '09:00', returnTime: '12:30', doctorAdvice: '- Worsened cough x 1 week, productive cough, yellowish sputum\n- Loss of appetite+\n- No hx of vomiting\n- Initially had fever for 10 days was afebrile for 2 days and complains of fever again today\n- Medication provided for 5 days\n- MC : 26/04/26 to 28/04/26', mcProvided: true, sickLeaveFrom: '2026-04-26', sickLeaveTo: '2026-04-28', sickLeaveDays: 3, recordedBy: 'HR Admin', isUrgent: false, isAdmitted: false },
  { id: 'MC-2026-005', caseDate: '2026-05-05', employeeId: '58034', name: 'SAMEERA MADUSANKA GUNARATHNA', department: 'STORES', reason: 'Headache, Dizziness', hospital: 'IGMH', departTime: '09:30', returnTime: '13:00', doctorAdvice: '- Headache x 2 days, throbbing in nature\n- Dizziness+, mild nausea\n- No vomiting, fever\n- BP slightly elevated at clinic — advised monitoring\n- Medication for 3 days\n- MC : 05/05/26 to 07/05/26', mcProvided: true, sickLeaveFrom: '2026-05-05', sickLeaveTo: '2026-05-07', sickLeaveDays: 3, recordedBy: 'HR Admin', isUrgent: false, isAdmitted: false },
  { id: 'MC-2026-006', caseDate: '2026-05-12', employeeId: '59820', name: 'NARAYANAN KUTTY', department: 'HOUSEKEEPING', reason: 'Abdominal pain, Loose motion', hospital: 'IGMH', departTime: '09:00', returnTime: '14:30', doctorAdvice: '- Abdominal cramps + loose motions x 3 days\n- No blood in stool\n- Mild fever — 37.9°C\n- Dehydration signs, advised oral rehydration\n- Medication provided for 5 days\n- MC : 12/05/26 to 14/05/26', mcProvided: true, sickLeaveFrom: '2026-05-12', sickLeaveTo: '2026-05-14', sickLeaveDays: 3, recordedBy: 'HR Admin', isUrgent: false, isAdmitted: false },
  { id: 'MC-2026-007', caseDate: '2026-05-20', employeeId: '61033', name: 'MD ARIF HOSSAIN', department: 'STORES', reason: 'Eye infection, Redness', hospital: 'IGMH', departTime: '10:00', returnTime: '12:00', doctorAdvice: '- Right eye redness and discharge x 2 days\n- Conjunctivitis diagnosed\n- Eye drops prescribed for 5 days\n- No systemic symptoms\n- MC : 20/05/26 to 21/05/26', mcProvided: true, sickLeaveFrom: '2026-05-20', sickLeaveTo: '2026-05-21', sickLeaveDays: 2, recordedBy: 'HR Admin', isUrgent: false, isAdmitted: false },
  { id: 'MC-2026-008', caseDate: '2026-05-27', employeeId: '60104', name: 'SURESH BAHADUR THAPA', department: 'MAINTENANCE', reason: 'Knee pain, Swelling after work injury', hospital: 'IGMH', departTime: '09:00', returnTime: '15:00', doctorAdvice: '- Right knee pain and swelling post fall at worksite\n- X-ray done — no fracture, soft tissue injury\n- Advised rest and physiotherapy\n- MC : 27/05/26 to 02/06/26', mcProvided: true, sickLeaveFrom: '2026-05-27', sickLeaveTo: '2026-06-02', sickLeaveDays: 7, recordedBy: 'HR Admin', isUrgent: false, isAdmitted: false },
  { id: 'MC-2026-009', caseDate: '2026-05-14', employeeId: '56530', name: 'PUBUDU MADURANGA ALAWATHTHA KANKANAMGE', department: 'ADMINISTRATION', reason: 'Fever, Sore throat', hospital: 'ADK Hospital', departTime: '08:30', returnTime: '11:00', doctorAdvice: '- Fever 38.2°C on presentation\n- Sore throat, difficulty swallowing\n- Tonsillitis diagnosed\n- Antibiotics prescribed for 7 days\n- Rest advised, avoid cold food/drinks\n- MC : 14/05/26 to 16/05/26', mcProvided: true, sickLeaveFrom: '2026-05-14', sickLeaveTo: '2026-05-16', sickLeaveDays: 3, recordedBy: 'HR Admin', isUrgent: false, isAdmitted: false },
  { id: 'MC-2026-010', caseDate: '2026-05-19', employeeId: '43407', name: 'MOHAMMAD DELOWAR HOSSAIN', department: 'STORES', reason: 'Lower back pain', hospital: 'IGMH', departTime: '09:00', returnTime: '13:30', doctorAdvice: '- Chronic lower back pain, worsened after heavy lifting\n- No radiation of pain to legs\n- Paracetamol + muscle relaxant prescribed\n- Advised physiotherapy and ergonomic assessment\n- Light duties recommended for 3 days\n- MC : 19/05/26 to 19/05/26', mcProvided: false, sickLeaveFrom: '2026-05-19', sickLeaveTo: '2026-05-19', sickLeaveDays: 1, recordedBy: 'HR Admin', isUrgent: false, isAdmitted: false },
  { id: 'MC-2026-011', caseDate: '2026-03-10', employeeId: '57637', name: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', reason: 'Food poisoning symptoms', hospital: 'IGMH', departTime: '08:00', returnTime: '14:00', doctorAdvice: '- Nausea, vomiting x 4 episodes\n- Diarrhoea x 5 episodes since last night\n- Abdominal cramps+\n- IV fluids administered at IGMH\n- Anti-emetics prescribed\n- Advised clear fluids, BRAT diet\n- MC : 10/03/26 to 12/03/26', mcProvided: true, sickLeaveFrom: '2026-03-10', sickLeaveTo: '2026-03-12', sickLeaveDays: 3, recordedBy: 'HR Admin', isUrgent: false, isAdmitted: false },
  { id: 'MC-2026-012', caseDate: '2026-03-22', employeeId: '53029', name: 'KUMARAN VAITHILINGAM', department: 'STORES', reason: 'Chest pain, Palpitations', hospital: 'ADK Hospital', departTime: '10:30', returnTime: '16:00', doctorAdvice: '- Chest discomfort, palpitations since morning\n- ECG performed — normal sinus rhythm\n- Stress-related symptoms\n- Advised to reduce caffeine, manage stress\n- Medication for 5 days\n- Follow-up in 2 weeks recommended\n- MC : 22/03/26 to 23/03/26', mcProvided: true, sickLeaveFrom: '2026-03-22', sickLeaveTo: '2026-03-23', sickLeaveDays: 2, recordedBy: 'HR Admin', isUrgent: false, isAdmitted: false },
]
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
const initialStaffRequests: StaffRequestRecord[] = [
  { id: 'REQ-2026-001', employeeId: '53979', employeeName: 'NAVEEN SEKAR', department: 'STORES', requestType: 'Accommodation', priority: 'High', description: 'Room C-14 has a broken ceiling fan and leaking roof. Requested urgent repair before monsoon season.', submittedDate: '2026-05-10', completedDate: '', status: 'In Progress', remarks: 'Maintenance team scheduled for 30 May' },
  { id: 'REQ-2026-002', employeeId: '50427', employeeName: 'MD SAIFUR RAHMAN', department: 'STORES', requestType: 'Documents', priority: 'High', description: 'Work permit renewal required. Current WP expires on 27 Jun 2026. Requesting HR to initiate renewal process with Immigration.', submittedDate: '2026-05-15', completedDate: '', status: 'Open', remarks: '' },
  { id: 'REQ-2026-003', employeeId: '58692', employeeName: 'SHANTUMON PATHIYIL CHACKO', department: 'HUMAN RESOURCES', requestType: 'Equipment', priority: 'Medium', description: 'Laptop screen flickering intermittently. Affects HR system data entry. Requesting replacement or repair.', submittedDate: '2026-04-22', completedDate: '2026-04-30', status: 'Resolved', remarks: 'New laptop issued on 30 April' },
  { id: 'REQ-2026-004', employeeId: '57637', employeeName: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', requestType: 'Transfer', priority: 'Medium', description: 'Requesting department transfer to Kitchen. Have 8 years of culinary experience and believe skills are better utilised there.', submittedDate: '2026-05-08', completedDate: '2026-05-20', status: 'Rejected', remarks: 'Transfer declined — CAFE currently understaffed' },
  { id: 'REQ-2026-005', employeeId: '59217', employeeName: 'RAJKUMAR GUPTA', department: 'MECHANICAL', requestType: 'Leave', priority: 'Low', description: 'Requesting 2 days emergency leave on 5-6 June 2026 to handle urgent banking matters in Male.', submittedDate: '2026-05-25', completedDate: '', status: 'Open', remarks: '' },
  { id: 'REQ-2026-006', employeeId: '61245', employeeName: 'ARUSHULLA RASHID', department: 'HUMAN RESOURCES', requestType: 'Equipment', priority: 'Low', description: 'Requesting ergonomic chair for HR office workstation. Current chair causing back strain during extended working hours.', submittedDate: '2026-05-02', completedDate: '2026-05-14', status: 'Resolved', remarks: 'Ergonomic chair procured and delivered' },
]

const initialOffSiteRecords: OffSiteRecord[] = []

const initialInventoryItems: InventoryItem[] = [
  // Stationery
  { id: 'INV-001', name: 'A4 Paper (500 sheets)', category: 'Stationery', quantity: 25, unit: 'reams', minQuantity: 5, location: 'HR Storeroom', lastUpdated: '2026-05-20', remarks: '' },
  { id: 'INV-006', name: 'Printer Cartridge (HP Black)', category: 'Stationery', quantity: 4, unit: 'pcs', minQuantity: 2, location: 'HR Office', lastUpdated: '2026-05-18', remarks: '' },
  { id: 'INV-007', name: 'Ball Pen (Blue)', category: 'Stationery', quantity: 120, unit: 'pcs', minQuantity: 30, location: 'HR Storeroom', lastUpdated: '2026-04-25', remarks: '' },
  { id: 'INV-010', name: 'Stapler', category: 'Stationery', quantity: 7, unit: 'pcs', minQuantity: 2, location: 'HR Office', lastUpdated: '2026-03-15', remarks: '' },
  { id: 'INV-013', name: 'Stamp Pad & Ink', category: 'Stationery', quantity: 3, unit: 'pcs', minQuantity: 1, location: 'HR Office', lastUpdated: '2026-04-01', remarks: '' },
  // Medical
  { id: 'INV-005', name: 'First Aid Kit (Standard)', category: 'Medical', quantity: 8, unit: 'kits', minQuantity: 3, location: 'Various Departments', lastUpdated: '2026-05-10', remarks: 'Check expiry dates monthly' },
  { id: 'INV-008', name: 'Disposable Gloves (Box 100)', category: 'Medical', quantity: 3, unit: 'boxes', minQuantity: 5, location: 'Safety Store', lastUpdated: '2026-05-22', remarks: 'LOW STOCK — reorder required' },
  { id: 'INV-014', name: 'Bandages (Assorted)', category: 'Medical', quantity: 20, unit: 'rolls', minQuantity: 10, location: 'Loss Prevention Office', lastUpdated: '2026-05-01', remarks: 'For first aid boxes' },
  { id: 'INV-015', name: 'Antiseptic Solution (500ml)', category: 'Medical', quantity: 6, unit: 'bottles', minQuantity: 3, location: 'Loss Prevention Office', lastUpdated: '2026-04-15', remarks: 'Dettol' },
  { id: 'INV-016', name: 'Paracetamol Tablets (Strip)', category: 'Medical', quantity: 30, unit: 'strips', minQuantity: 10, location: 'HR Office', lastUpdated: '2026-05-05', remarks: 'For basic first aid only' },
]
const initialInventoryUsage: InventoryUsageRecord[] = [
  { id: 'USG-001', itemId: 'INV-008', itemName: 'Disposable Gloves (Box 100)', quantityUsed: 2, unit: 'boxes', usedBy: 'ABHISHEK CHETRY', employeeId: '55426', department: 'LOSS PREVENTION', usedDate: '2026-05-20', purpose: 'First aid box restock — Loss Prevention', remarks: '' },
  { id: 'USG-002', itemId: 'INV-001', itemName: 'A4 Paper (500 sheets)', quantityUsed: 3, unit: 'reams', usedBy: 'SHANTUMON PATHIYIL CHACKO', employeeId: '58692', department: 'HUMAN RESOURCES', usedDate: '2026-05-18', purpose: 'HR documentation printing', remarks: '' },
  { id: 'USG-003', itemId: 'INV-005', itemName: 'First Aid Kit (Standard)', quantityUsed: 1, unit: 'kits', usedBy: 'ABHISHEK CHETRY', employeeId: '55426', department: 'LOSS PREVENTION', usedDate: '2026-05-27', purpose: 'Worksite injury response — replaced used kit', remarks: '' },
  { id: 'USG-004', itemId: 'INV-016', itemName: 'Paracetamol Tablets (Strip)', quantityUsed: 5, unit: 'strips', usedBy: 'ARUSHULLA RASHID', employeeId: '61245', department: 'LOSS PREVENTION', usedDate: '2026-05-10', purpose: 'Distributed to security first aid boxes', remarks: '' },
  { id: 'USG-005', itemId: 'INV-006', itemName: 'Printer Cartridge (HP Black)', quantityUsed: 1, unit: 'pcs', usedBy: 'ARUSHULLA RASHID', employeeId: '61245', department: 'HUMAN RESOURCES', usedDate: '2026-05-10', purpose: 'HR printer replacement', remarks: '' },
  { id: 'USG-006', itemId: 'INV-014', itemName: 'Bandages (Assorted)', quantityUsed: 4, unit: 'rolls', usedBy: 'SURESH BAHADUR THAPA', employeeId: '60104', department: 'LOSS PREVENTION', usedDate: '2026-05-27', purpose: 'Knee injury dressing — worksite injury', remarks: '' },
  { id: 'USG-007', itemId: 'INV-015', itemName: 'Antiseptic Solution (500ml)', quantityUsed: 1, unit: 'bottles', usedBy: 'ABHISHEK CHETRY', employeeId: '55426', department: 'LOSS PREVENTION', usedDate: '2026-04-30', purpose: 'First aid box refill', remarks: '' },
  { id: 'USG-008', itemId: 'INV-007', itemName: 'Ball Pen (Blue)', quantityUsed: 20, unit: 'pcs', usedBy: 'SHANTUMON PATHIYIL CHACKO', employeeId: '58692', department: 'HUMAN RESOURCES', usedDate: '2026-04-25', purpose: 'Office stationery distribution', remarks: '' },
]

const initialVisitRecords: VisitRecord[] = [
  { id: 'VIS-2026-001', employeeId: '56646', employeeName: 'CHANDRASHEKHER PURELLA', department: 'ACCOUNTS AND FINANCE', nicPassportNo: 'T8890124', nationality: 'INDIA', visitType: 'Visa Medical', visitDate: '2026-04-10', status: 'Completed', remarks: 'Pre-visa medical for India embassy — passed' },
  { id: 'VIS-2026-002', employeeId: '50427', employeeName: 'MD SAIFUR RAHMAN', department: 'STORES', nicPassportNo: 'BP2233445', nationality: 'BANGLADESH', visitType: 'Passport Renewal', visitDate: '2026-06-18', status: 'Scheduled', remarks: 'Passport expires Aug 2026 — renewal booked at Bangladesh Embassy' },
  { id: 'VIS-2026-003', employeeId: '57637', employeeName: 'MUNI ACHARI GUNTI KOVALA', department: 'CAFE', nicPassportNo: 'T6678234', nationality: 'INDIA', visitType: 'Embassy Letter Collection', visitDate: '2026-03-25', status: 'Completed', remarks: 'NOC letter collected from Indian Embassy for work permit renewal' },
  { id: 'VIS-2026-004', employeeId: '55426', employeeName: 'ABHISHEK CHETRY', department: 'LOSS PREVENTION', nicPassportNo: 'T5567891', nationality: 'INDIA', visitType: 'Biometric Update', visitDate: '2026-05-30', status: 'Scheduled', remarks: 'Biometric update for work permit at Maldives Immigration' },
  { id: 'VIS-2026-005', employeeId: '43407', employeeName: 'MOHAMMAD DELOWAR HOSSAIN', department: 'STORES', nicPassportNo: 'BN1122334', nationality: 'BANGLADESH', visitType: 'Photo', visitDate: '2026-04-15', status: 'Completed', remarks: 'Passport size photo for work permit application' },
  { id: 'VIS-2026-006', employeeId: '60104', employeeName: 'SURESH BAHADUR THAPA', department: 'MAINTENANCE', nicPassportNo: 'N8876543', nationality: 'NEPAL', visitType: 'Visa Medical', visitDate: '2026-06-05', status: 'Scheduled', remarks: 'Medical check for employment visa renewal — Nepal embassy requirement' },
]

const initialIncidentRecords: IncidentRecord[] = [
  { id: 'INC-2026-001', incidentDate: '2026-05-27', timeOfIncident: 'Morning', employeeId: '60104', employeeName: 'SURESH BAHADUR THAPA', reportedById: '58692', reportedByName: 'SHANTUMON PATHIYIL CHACKO', section: 'MAINTENANCE', department: 'ENGINEERING ADMINISTRATION', siteLocation: 'Workshop Area B', incidentType: 'Work Injury', incidentSummary: 'Employee slipped on wet workshop floor while carrying a heavy component, resulting in right knee injury.', exactLocation: 'Workshop B — near equipment bay 3', immediateCause: 'Wet floor — water leak from pipe not reported. Employee was not wearing knee pads.', witnessName: 'CHAMINDA WIJESINGHE', witnessId: '60512', correctiveOwner: 'SHANTUMON PATHIYIL CHACKO', followUpDate: '2026-06-03', description: 'SURESH BAHADUR THAPA slipped on a wet surface in Workshop Area B while transporting a mechanical component. The employee fell and sustained a right knee injury. Emergency first aid was administered on site and the employee was transported to IGMH for further examination. X-ray results showed no fracture — soft tissue injury confirmed. Employee placed on 7-day medical leave.', injuryInvolved: true, actionTaken: 'First aid administered. Employee taken to IGMH. Wet floor sign placed. Pipe leak reported to maintenance. Safety briefing conducted with all workshop staff.', statementTaken: true, disciplinaryAction: false, status: 'Under Review' },
  { id: 'INC-2026-002', incidentDate: '2026-05-15', timeOfIncident: 'Afternoon', employeeId: '59361', employeeName: 'DIBIN ROY', reportedById: '58692', reportedByName: 'SHANTUMON PATHIYIL CHACKO', section: 'LPG PLANT', department: 'LPG PLANT', siteLocation: 'LPG Storage Area', incidentType: 'Near Miss', incidentSummary: 'LPG cylinder valve found partially open during routine inspection. No ignition source nearby — averted explosion risk.', exactLocation: 'LPG cylinder bay 4', immediateCause: 'Valve insufficiently tightened after last use. Procedure not followed correctly.', witnessName: 'RAJKUMAR GUPTA', witnessId: '59217', correctiveOwner: 'SHANTUMON PATHIYIL CHACKO', followUpDate: '2026-05-22', description: 'During afternoon inspection DIBIN ROY discovered an LPG storage cylinder with a partially open valve in cylinder bay 4. The area was immediately evacuated and the valve was closed. No injury or fire occurred. Investigation revealed the valve was not properly tightened during the previous shift change. The near-miss was reported immediately to the HR and safety team.', injuryInvolved: false, actionTaken: 'Valve closed. Area evacuated and ventilated. Incident reported to management. Safety procedure refresher conducted for all LPG plant staff. Valve tightness checklist updated.', statementTaken: true, disciplinaryAction: false, status: 'Closed' },
  { id: 'INC-2026-003', incidentDate: '2026-04-18', timeOfIncident: 'Night', employeeId: '58686', employeeName: 'YASAR ARAFATH BASHEER AHAMED', reportedById: '58692', reportedByName: 'SHANTUMON PATHIYIL CHACKO', section: 'STORES', department: 'STORES', siteLocation: 'Staff Accommodation Block C', incidentType: 'Sleeping on Duty', incidentSummary: 'Security officer found employee sleeping in storeroom during night shift duty hours.', exactLocation: 'Storeroom C — back area', immediateCause: 'Employee did not report fatigue or request assistance for night shift coverage.', witnessName: 'ABHISHEK CHETRY', witnessId: '55426', correctiveOwner: 'SHANTUMON PATHIYIL CHACKO', followUpDate: '2026-04-25', description: 'During night patrol on 18 April 2026 at approximately 02:30, security officer ABHISHEK CHETRY found YASAR ARAFATH BASHEER AHAMED sleeping inside Storeroom C. The employee was on active duty at the time. The employee was woken and given a verbal warning on-site. A formal written warning was issued the following morning after investigation.', injuryInvolved: false, actionTaken: 'Verbal warning issued on-site. Formal written warning issued on 19 April 2026 by HR. Employee counselled on duty responsibilities. Incident recorded in personal file.', statementTaken: true, disciplinaryAction: true, status: 'Closed' },
  { id: 'INC-2025-001', incidentDate: '2026-03-07', timeOfIncident: 'Morning', employeeId: '53979', employeeName: 'NAVEEN SEKAR', reportedById: '58692', reportedByName: 'SHANTUMON PATHIYIL CHACKO', section: 'STORES', department: 'STORES', siteLocation: 'Main Warehouse Loading Bay', incidentType: 'Property Damage', incidentSummary: 'Forklift operator misjudged distance and struck shelving unit causing partial collapse. No injuries.', exactLocation: 'Loading Bay — Row 3 shelving', immediateCause: 'Insufficient clearance observed during reversing. Employee was rushing to complete shift assignment.', witnessName: 'KUMARAN VAITHILINGAM', witnessId: '53029', correctiveOwner: 'SHANTUMON PATHIYIL CHACKO', followUpDate: '2026-03-14', description: 'On 7 March 2026 at approximately 08:45, NAVEEN SEKAR while operating forklift in the main warehouse loading bay struck a metal shelving unit whilst reversing. The shelving unit partially collapsed displacing approximately 15 cartons of stored goods. No persons were in the immediate area at the time. Damage estimated at MVR 4,500 for shelf replacement. Employee was not certified for the specific forklift model in use.', injuryInvolved: false, actionTaken: 'Area cordoned off. Goods recovered and inventoried. Shelf unit replaced. Employee suspended from forklift operation pending refresher training. Forklift certification records reviewed for all operators.', statementTaken: true, disciplinaryAction: true, status: 'Closed' },
]

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
            {/* Site Status is auto-managed — Off Site from offsite records, On Leave from active leaves */}
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

// ── Standalone form — must be OUTSIDE OffSiteModal to prevent remount-on-rerender ──
function OffSiteAddForm({ employees, departure, returnDate, purpose, recordedBy,
  onDepartureChange, onReturnChange, onPurposeChange, onRecordedByChange,
  onCancel, onSave,
}: {
  employees: Employee[]
  departure: string; returnDate: string; purpose: string; recordedBy: string
  onDepartureChange: (v: string) => void
  onReturnChange: (v: string) => void
  onPurposeChange: (v: string) => void
  onRecordedByChange: (v: string) => void
  onCancel: () => void
  onSave: (emp: Employee) => void
}) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Employee | null>(null)
  const [showDrop, setShowDrop] = useState(false)

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q || selected) return []
    return employees.filter(e =>
      e.employeeId.toLowerCase().includes(q) || e.fullName.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [search, selected, employees])

  const pick = (emp: Employee) => {
    setSelected(emp)
    setSearch(`${emp.fullName} (${emp.employeeId})`)
    setShowDrop(false)
  }

  const clear = () => { setSelected(null); setSearch('') }

  return (
    <div className="os-form-card">
      <p className="os-form-title">+ Add Staff Off Site</p>

      {/* Employee search */}
      <div className="os-form-row" style={{ position: 'relative' }}>
        <label className="os-lbl">Search Employee <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="os-input" style={{ paddingLeft: 34 }}
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(null); setShowDrop(true) }}
            onFocus={() => setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            placeholder="Type name or employee ID…"
            autoComplete="off"
          />
        </div>
        {showDrop && results.length > 0 && (
          <div className="ei-emp-dropdown">
            {results.map(emp => (
              <div key={emp.employeeId} className="ei-emp-option" onMouseDown={() => pick(emp)}>
                <strong>{emp.fullName}</strong>
                <span>{emp.employeeId} · {emp.department}</span>
              </div>
            ))}
          </div>
        )}
        {selected && (
          <div className="os-emp-pill">
            <div>
              <strong>{selected.fullName}</strong>
              <span style={{ display: 'block', fontSize: '0.74rem', color: '#3b82f6' }}>{selected.employeeId} · {selected.department}</span>
            </div>
            <button type="button" onClick={clear} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', lineHeight: 1 }}>×</button>
          </div>
        )}
      </div>

      {/* Date + Purpose grid */}
      <div className="os-form-grid">
        <div>
          <label className="os-lbl">Departure Date <span style={{ color: '#ef4444' }}>*</span></label>
          <input className="os-input" type="date" value={departure} onChange={e => onDepartureChange(e.target.value)} />
        </div>
        <div>
          <label className="os-lbl">Return Date <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
          <input className="os-input" type="date" value={returnDate} onChange={e => onReturnChange(e.target.value)} />
          <p className="os-hint">Leave blank if still out</p>
        </div>
        <div>
          <label className="os-lbl">Recorded By</label>
          <input className="os-input" value={recordedBy} onChange={e => onRecordedByChange(e.target.value)} placeholder="e.g. HR Admin" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="os-lbl">Purpose <span style={{ color: '#ef4444' }}>*</span></label>
          <input className="os-input" value={purpose} onChange={e => onPurposeChange(e.target.value)}
            placeholder="e.g. Visa Medical, Embassy Visit, Off-site Training, Personal…" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="quiet-button light" onClick={onCancel} type="button">Cancel</button>
        <button className="primary-button" disabled={!selected || !purpose.trim()} onClick={() => selected && onSave(selected)} type="button">
          Add Record
        </button>
      </div>
    </div>
  )
}

function OffSiteEditForm({ departure, returnDate, purpose, recordedBy,
  onDepartureChange, onReturnChange, onPurposeChange, onRecordedByChange,
  onCancel, onSave,
}: {
  departure: string; returnDate: string; purpose: string; recordedBy: string
  onDepartureChange: (v: string) => void
  onReturnChange: (v: string) => void
  onPurposeChange: (v: string) => void
  onRecordedByChange: (v: string) => void
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div className="os-form-card" style={{ margin: '0 0 8px', borderColor: '#fed7aa' }}>
      <p className="os-form-title" style={{ color: '#92400e' }}>✎ Edit Record</p>
      <div className="os-form-grid">
        <div>
          <label className="os-lbl">Departure Date</label>
          <input className="os-input" type="date" value={departure} onChange={e => onDepartureChange(e.target.value)} />
        </div>
        <div>
          <label className="os-lbl">Return Date <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
          <input className="os-input" type="date" value={returnDate} onChange={e => onReturnChange(e.target.value)} />
          <p className="os-hint">Fill to mark as returned</p>
        </div>
        <div>
          <label className="os-lbl">Recorded By</label>
          <input className="os-input" value={recordedBy} onChange={e => onRecordedByChange(e.target.value)} placeholder="e.g. HR Admin" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="os-lbl">Purpose</label>
          <input className="os-input" value={purpose} onChange={e => onPurposeChange(e.target.value)}
            placeholder="Reason for being off site…" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="quiet-button light" onClick={onCancel} type="button">Cancel</button>
        <button className="primary-button" disabled={!purpose.trim()} onClick={onSave} type="button">Save Changes</button>
      </div>
    </div>
  )
}

function OffSiteModal({ records, employees, onUpdate, onClose }: {
  records: OffSiteRecord[]
  employees: Employee[]
  onUpdate: (fn: (prev: OffSiteRecord[]) => OffSiteRecord[]) => void
  onClose: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [subTab, setSubTab] = useState<'out' | 'history'>('out')

  // ── Add form state ──
  const [showAdd, setShowAdd] = useState(false)
  const [addDeparture, setAddDeparture] = useState(today)
  const [addReturn, setAddReturn] = useState('')
  const [addPurpose, setAddPurpose] = useState('')
  const [addRecordedBy, setAddRecordedBy] = useState('')

  // ── Edit form state ──
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDeparture, setEditDeparture] = useState('')
  const [editReturn, setEditReturn] = useState('')
  const [editPurpose, setEditPurpose] = useState('')
  const [editRecordedBy, setEditRecordedBy] = useState('')

  const currentOut = records.filter(r => r.status === 'Out').sort((a, b) => b.departureDate.localeCompare(a.departureDate))
  const history    = records.filter(r => r.status === 'Returned').sort((a, b) => b.departureDate.localeCompare(a.departureDate))

  const daysOut = (departure: string) => {
    if (!departure) return 0
    return Math.max(0, Math.round((new Date(today).getTime() - new Date(departure).getTime()) / 86400000))
  }

  // Save new record — emp comes from OffSiteAddForm
  const saveAdd = (emp: Employee) => {
    if (!addPurpose.trim()) return
    const rec: OffSiteRecord = {
      id: `OS-${Date.now()}`, employeeId: emp.employeeId,
      name: emp.fullName, department: emp.department,
      nationality: emp.nationality, departureDate: addDeparture,
      returnDate: addReturn, purpose: addPurpose,
      status: addReturn ? 'Returned' : 'Out',
      recordedBy: addRecordedBy,
    }
    onUpdate(prev => [rec, ...prev])
    setShowAdd(false)
    setAddDeparture(today); setAddReturn(''); setAddPurpose(''); setAddRecordedBy('')
  }

  // Open edit
  const openEdit = (r: OffSiteRecord) => {
    setEditingId(r.id)
    setEditDeparture(r.departureDate)
    setEditReturn(r.returnDate)
    setEditPurpose(r.purpose)
    setEditRecordedBy(r.recordedBy)
  }

  // Save edit
  const saveEdit = (id: string) => {
    const hasReturn = !!editReturn
    onUpdate(prev => prev.map(r => r.id !== id ? r : {
      ...r,
      departureDate: editDeparture,
      returnDate: editReturn,
      purpose: editPurpose,
      recordedBy: editRecordedBy,
      status: hasReturn ? 'Returned' : 'Out',
    }))
    setEditingId(null)
  }

  // Mark returned today
  const markReturned = (id: string) => {
    onUpdate(prev => prev.map(r => r.id === id ? { ...r, status: 'Returned' as const, returnDate: today } : r))
  }

  const del = (id: string) => onUpdate(prev => prev.filter(r => r.id !== id))

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal os-modal" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="os-modal-hdr">
          <div className="os-hdr-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <p className="os-eyebrow">Employee Management</p>
            <h2 className="os-title">Off Site Tracking</h2>
          </div>
          <div className="os-hdr-kpis">
            <div className="os-kpi os-kpi-out">
              <span className="os-kpi-num">{currentOut.length}</span>
              <span className="os-kpi-lbl">Currently Out</span>
            </div>
            <div className="os-kpi os-kpi-total">
              <span className="os-kpi-num">{records.length}</span>
              <span className="os-kpi-lbl">Total Records</span>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        {/* Body */}
        <div className="os-body">

          {/* Tabs + Add button row */}
          <div className="os-topbar">
            <div className="os-subtabs">
              <button className={subTab === 'out' ? 'active' : ''} onClick={() => setSubTab('out')} type="button">
                Currently Out {currentOut.length > 0 && <span className="tab-count" style={{ background: '#2563eb' }}>{currentOut.length}</span>}
              </button>
              <button className={subTab === 'history' ? 'active' : ''} onClick={() => setSubTab('history')} type="button">
                History {history.length > 0 && <span className="tab-count">{history.length}</span>}
              </button>
            </div>
            {!showAdd && editingId === null && (
              <button className="primary-button" onClick={() => setShowAdd(true)} type="button">+ Add Off Site</button>
            )}
          </div>

          {/* Add form */}
          {showAdd && (
            <OffSiteAddForm
              employees={employees}
              departure={addDeparture} returnDate={addReturn} purpose={addPurpose} recordedBy={addRecordedBy}
              onDepartureChange={setAddDeparture} onReturnChange={setAddReturn}
              onPurposeChange={setAddPurpose} onRecordedByChange={setAddRecordedBy}
              onCancel={() => setShowAdd(false)}
              onSave={saveAdd}
            />
          )}

          {/* Currently Out table */}
          {subTab === 'out' && !showAdd && (
            <div className="employee-table-shell compact-scroll os-table-shell">
              <table className="data-table os-table">
                <thead>
                  <tr>
                    <th>Emp ID</th><th>Name</th><th>Section</th><th>Nationality</th>
                    <th>Departed</th><th>Return</th><th>Days Out</th>
                    <th>Purpose</th><th>Recorded By</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOut.length === 0
                    ? <tr><td colSpan={10} className="empty-row">No staff currently off site.</td></tr>
                    : currentOut.map(r => (
                      <Fragment key={r.id}>
                        <tr className={editingId === r.id ? 'os-editing-row' : ''}>
                          <td>{r.employeeId}</td>
                          <td><strong>{r.name}</strong></td>
                          <td>{r.department}</td>
                          <td>{r.nationality}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDateDisplay(r.departureDate)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{r.returnDate ? formatDateDisplay(r.returnDate) : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                          <td><span className="os-days-badge">{daysOut(r.departureDate)}d</span></td>
                          <td className="os-purpose-cell">{r.purpose}</td>
                          <td>{r.recordedBy || '—'}</td>
                          <td>
                            <div className="row-actions request-inline-actions" style={{ gap: 4 }}>
                              <button className="os-return-btn" onClick={() => markReturned(r.id)} type="button" title="Mark returned today">↩ Return</button>
                              <button className="action-glyph edit" onClick={() => editingId === r.id ? setEditingId(null) : openEdit(r)} type="button" title="Edit">✎</button>
                              <button className="action-glyph delete" onClick={() => del(r.id)} type="button" title="Delete">🗑</button>
                            </div>
                          </td>
                        </tr>
                        {editingId === r.id && (
                          <tr>
                            <td colSpan={10} style={{ padding: 0, background: '#f8fafc' }}>
                              <div style={{ padding: '0 12px 12px' }}>
                                <OffSiteEditForm
                                    departure={editDeparture} returnDate={editReturn} purpose={editPurpose} recordedBy={editRecordedBy}
                                    onDepartureChange={setEditDeparture} onReturnChange={setEditReturn}
                                    onPurposeChange={setEditPurpose} onRecordedByChange={setEditRecordedBy}
                                    onCancel={() => setEditingId(null)} onSave={() => saveEdit(r.id)}
                                  />
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* History table */}
          {subTab === 'history' && !showAdd && (
            <div className="employee-table-shell compact-scroll os-table-shell">
              <table className="data-table os-table">
                <thead>
                  <tr>
                    <th>Emp ID</th><th>Name</th><th>Section</th><th>Nationality</th>
                    <th>Departed</th><th>Returned</th><th>Days</th>
                    <th>Purpose</th><th>Recorded By</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0
                    ? <tr><td colSpan={10} className="empty-row">No history yet.</td></tr>
                    : history.map(r => {
                      const days = r.returnDate && r.departureDate
                        ? Math.max(0, Math.round((new Date(r.returnDate).getTime() - new Date(r.departureDate).getTime()) / 86400000))
                        : null
                      return (
                        <Fragment key={r.id}>
                          <tr className={editingId === r.id ? 'os-editing-row' : ''}>
                            <td>{r.employeeId}</td>
                            <td><strong>{r.name}</strong></td>
                            <td>{r.department}</td>
                            <td>{r.nationality}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDateDisplay(r.departureDate)}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{r.returnDate ? formatDateDisplay(r.returnDate) : '—'}</td>
                            <td>{days !== null ? <span className="os-days-badge os-days-done">{days}d</span> : '—'}</td>
                            <td className="os-purpose-cell">{r.purpose}</td>
                            <td>{r.recordedBy || '—'}</td>
                            <td>
                              <div className="row-actions request-inline-actions" style={{ gap: 4 }}>
                                <button className="action-glyph edit" onClick={() => editingId === r.id ? setEditingId(null) : openEdit(r)} type="button" title="Edit">✎</button>
                                <button className="action-glyph delete" onClick={() => del(r.id)} type="button" title="Delete">🗑</button>
                              </div>
                            </td>
                          </tr>
                          {editingId === r.id && (
                            <tr>
                              <td colSpan={10} style={{ padding: 0, background: '#f8fafc' }}>
                                <div style={{ padding: '0 12px 12px' }}>
                                  <OffSiteEditForm
                                    departure={editDeparture} returnDate={editReturn} purpose={editPurpose} recordedBy={editRecordedBy}
                                    onDepartureChange={setEditDeparture} onReturnChange={setEditReturn}
                                    onPurposeChange={setEditPurpose} onRecordedByChange={setEditRecordedBy}
                                    onCancel={() => setEditingId(null)} onSave={() => saveEdit(r.id)}
                                  />
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
          )}
        </div>
      </section>
    </div>
  )
}

function EmployeesPage({ employees, onAdd, onEdit, onExport, onImport, onTemplate, onShowTasks, medicalCases, noticeTerminations, offSiteRecords, onUpdateOffSite }: {
  employees: Employee[]
  onAdd: () => void
  onEdit: (employee: Employee) => void
  onExport: () => void
  onImport: () => void
  onTemplate: () => void
  onShowTasks: () => void
  medicalCases: MedicalCaseRecord[]
  noticeTerminations: EnhancedTerminationRecord[]
  offSiteRecords: OffSiteRecord[]
  onUpdateOffSite: (fn: (prev: OffSiteRecord[]) => OffSiteRecord[]) => void
}) {
  const [query, setQuery] = useState('')
  const [showOffSite, setShowOffSite] = useState(false)
  const [department, setDepartment] = useState('All Sections')
  const [status, setStatus] = useState('All Statuses')
  const [nationality, setNationality] = useState('All Nationalities')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(50)
  const [sortKey, setSortKey] = useState<SortKey>('department')
  const [sortAsc, setSortAsc] = useState(true)

  const today = new Date().toISOString().slice(0, 10)
  const onLeaveIds = useMemo(() => new Set(
    medicalCases.filter(r => r.sickLeaveFrom <= today && r.sickLeaveTo >= today).map(r => r.employeeId)
  ), [medicalCases, today])
  const noticeIds = useMemo(() => new Set(noticeTerminations.map(r => r.employeeId)), [noticeTerminations])

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
            <button className="primary-button" onClick={() => setShowOffSite(true)} type="button">
              Off Site{offSiteRecords.filter(r => r.status === 'Out').length > 0 && <span className="pending-count-badge" style={{ marginLeft: '6px' }}>{offSiteRecords.filter(r => r.status === 'Out').length}</span>}
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
                <tr className={`${recordStatus(employee) === 'Pending' ? 'pending-row' : ''} status-row-${employee.siteStatus.toLowerCase().replaceAll(' ', '-')}${noticeIds.has(employee.employeeId) ? ' emp-in-notice' : onLeaveIds.has(employee.employeeId) ? ' emp-on-medical' : ''}`} key={`${employee.employeeId}-${employee.fullName}`}>
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
      {showOffSite && <OffSiteModal records={offSiteRecords} employees={employees} onUpdate={onUpdateOffSite} onClose={() => setShowOffSite(false)} />}
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
  const [skipProgress, setSkipProgress] = useState(initialRecord?.skipProgress ?? false)

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

        {/* Skip Progress toggle */}
        <div className="lf-skip-toggle-row">
          <div>
            <strong className="lf-skip-label">Skip Progress (Fast Track)</strong>
            <p className="lf-skip-desc">For staff who go directly on leave without following the normal approval steps (locals, seniors).</p>
          </div>
          <button
            type="button"
            className={`lf-toggle${skipProgress ? ' lf-toggle-on' : ''}`}
            onClick={() => setSkipProgress(p => !p)}
            aria-pressed={skipProgress}
          >
            <span className="lf-toggle-thumb" />
          </button>
        </div>

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
              step: skipProgress ? 'Pending Departure' : step,
              skipProgress,
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

  const [empSearch, setEmpSearch] = useState(form.name ? `${form.name} (${form.employeeId})` : '')
  const [showEmpList, setShowEmpList] = useState(false)

  const empMatches = useMemo(() => {
    const q = empSearch.trim().toLowerCase()
    if (!q || q.includes('(')) return []
    return employees.filter((e) =>
      e.fullName.toLowerCase().includes(q) || e.employeeId.includes(q)
    ).slice(0, 8)
  }, [empSearch, employees])

  const pickEmp = (emp: Employee) => {
    setF({ employeeId: emp.employeeId, name: emp.fullName, department: emp.department })
    setEmpSearch(`${emp.fullName} (${emp.employeeId})`)
    setShowEmpList(false)
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
      <section className="registration-modal mc-wide-modal mc-modal-redesign" role="dialog" aria-modal="true">

        {/* ── Gradient header ── */}
        <div className="mc-modal-top">
          <div className="mc-modal-top-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div className="mc-modal-top-text">
            <p className="mc-modal-eyebrow">Medical Leave</p>
            <h2 className="mc-modal-title">{isNew ? 'Add Medical Case' : `Edit Case — ${form.name}`}</h2>
          </div>
          <button className="mc-modal-close" onClick={onClose} type="button">×</button>
        </div>

        <form onSubmit={save} className="mc-modal-form">

          {/* ═══ SECTION 1 — PATIENT ═══ */}
          <div className="mc-card mc-card-patient">
            <div className="mc-card-label">
              <span className="mc-card-dot mc-dot-blue" />
              Patient Details
            </div>

            <div className="mc-two-col">
              <div>
                <label className="mc-field-label">Visit Date <span className="mc-req">*</span></label>
                <input className="mc-input" type="date" value={form.caseDate} onChange={e => setF({ caseDate: e.target.value })} required />
              </div>
              <div style={{ position: 'relative' }}>
                <label className="mc-field-label">Search Employee</label>
                <div className="mc-emp-search-wrap">
                  <svg className="mc-search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    className="mc-input mc-search-inp"
                    value={empSearch}
                    onChange={e => { setEmpSearch(e.target.value); setShowEmpList(true) }}
                    onFocus={() => setShowEmpList(true)}
                    onBlur={() => setTimeout(() => setShowEmpList(false), 150)}
                    placeholder="Type name or Emp ID…"
                    autoComplete="off"
                  />
                </div>
                {showEmpList && empMatches.length > 0 && (
                  <div className="ei-emp-dropdown">
                    {empMatches.map(emp => (
                      <div key={emp.employeeId} className="ei-emp-option" onMouseDown={() => pickEmp(emp)}>
                        <strong>{emp.fullName}</strong>
                        <span>{emp.employeeId} · {emp.department}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Employee card on selection */}
            {form.name && (
              <div className="mc-emp-card">
                <div className="mc-emp-avatar">{form.name.charAt(0)}</div>
                <div className="mc-emp-card-info">
                  <strong>{form.name}</strong>
                  <span>{form.employeeId}{form.department && ` · ${form.department}`}</span>
                </div>
                <span className="mc-emp-card-check">✓</span>
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <label className="mc-field-label">Reason for Visit <span className="mc-req">*</span></label>
              <input className="mc-input" value={form.reason} onChange={e => setF({ reason: e.target.value })} required placeholder="e.g. Fever, Body pain, Cough – Follow up" />
            </div>
          </div>

          {/* ═══ SECTION 2 — CLINIC ═══ */}
          <div className="mc-card mc-card-clinic">
            <div className="mc-card-label">
              <span className="mc-card-dot mc-dot-green" />
              Clinic Details
            </div>

            <div className="mc-three-col">
              <div style={{ gridColumn: '1 / 2' }}>
                <label className="mc-field-label">Hospital / Clinic</label>
                <input className="mc-input" value={form.hospital} onChange={e => setF({ hospital: e.target.value })} placeholder="e.g. IGMH, ADK" />
              </div>
              <div>
                <label className="mc-field-label">Depart</label>
                <input className="mc-input" type="time" value={form.departTime} onChange={e => setF({ departTime: e.target.value })} />
              </div>
              <div>
                <label className="mc-field-label">Return</label>
                <input className="mc-input" type="time" value={form.returnTime} onChange={e => setF({ returnTime: e.target.value })} />
              </div>
            </div>

            {/* MC Provided — button toggle */}
            <div style={{ marginTop: 14 }}>
              <label className="mc-field-label">Medical Certificate (MC)</label>
              <div className="mc-mc-toggle">
                <button type="button" className={`mc-mc-btn${form.mcProvided ? ' mc-mc-btn-yes' : ''}`} onClick={() => setF({ mcProvided: true })}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Yes — MC Issued
                </button>
                <button type="button" className={`mc-mc-btn${!form.mcProvided ? ' mc-mc-btn-no' : ''}`} onClick={() => setF({ mcProvided: false })}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  No — Without Document
                </button>
              </div>
            </div>

            {/* Urgency toggle */}
            <div className={`mc-urgency${form.isUrgent ? ' mc-urgency-on' : ''}`}>
              <div className="mc-urgency-left">
                <span className="mc-urgency-ico">⚠</span>
                <div>
                  <strong>Urgent / Emergency</strong>
                  <p>Flag for immediate HR attention</p>
                </div>
              </div>
              <button type="button" className={`lf-toggle${form.isUrgent ? ' lf-toggle-on lf-toggle-urgent' : ''}`} onClick={() => setF({ isUrgent: !form.isUrgent })}>
                <span className="lf-toggle-thumb" />
              </button>
            </div>

            {form.isUrgent && (
              <div className="mc-admitted">
                <label className="mc-field-label">Admitted to Hospital?</label>
                <div className="mc-mc-toggle" style={{ marginTop: 6 }}>
                  <button type="button" className={`mc-mc-btn${form.isAdmitted ? ' mc-mc-btn-yes' : ''}`} onClick={() => setF({ isAdmitted: true })}>Yes — Admitted</button>
                  <button type="button" className={`mc-mc-btn${!form.isAdmitted ? ' mc-mc-btn-no' : ''}`} onClick={() => setF({ isAdmitted: false })}>No — Outpatient</button>
                </div>
                {form.isAdmitted && (
                  <div className="mc-form-grid" style={{ marginTop: 12 }}>
                    <div>
                      <label className="mc-field-label">Admitted Date</label>
                      <input className="mc-input" type="date" value={form.admittedDate ?? ''} onChange={e => setF({ admittedDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="mc-field-label">Discharged Date <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                      <input className="mc-input" type="date" value={form.dischargedDate ?? ''} onChange={e => setF({ dischargedDate: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Doctor Advice */}
            <div style={{ marginTop: 14 }}>
              <label className="mc-field-label">Doctor Advice / Summary</label>
              <textarea
                className="mc-textarea"
                value={form.doctorAdvice}
                onChange={e => setF({ doctorAdvice: e.target.value })}
                rows={4}
                placeholder="Symptoms noted, diagnosis, medication prescribed, MC dates, follow-up instructions…"
              />
            </div>
          </div>

          {/* ═══ SECTION 3 — SICK LEAVE ═══ */}
          <div className="mc-card mc-card-leave">
            <div className="mc-card-label">
              <span className="mc-card-dot mc-dot-amber" />
              Sick Leave Period
            </div>

            <div className="mc-sl-row">
              <div>
                <label className="mc-field-label">From</label>
                <input className="mc-input" type="date" value={form.sickLeaveFrom} onChange={e => setF({ sickLeaveFrom: e.target.value })} />
              </div>
              <div>
                <label className="mc-field-label">To</label>
                <input className="mc-input" type="date" value={form.sickLeaveTo} onChange={e => setF({ sickLeaveTo: e.target.value })} />
              </div>
              <div>
                <label className="mc-field-label">Days</label>
                <div className="mc-days-pill">
                  <span className="mc-days-num">{form.sickLeaveDays || 0}</span>
                  <span className="mc-days-unit">day{form.sickLeaveDays !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div>
                <label className="mc-field-label">Recorded By</label>
                <input className="mc-input" value={form.recordedBy} onChange={e => setF({ recordedBy: e.target.value })} placeholder="HR Admin" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mc-modal-footer">
            <button type="button" className="quiet-button light" onClick={onClose}>Cancel</button>
            <button className="mc-submit-btn" type="submit">
              {isNew
                ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Medical Case</>
                : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Save Changes</>
              }
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function MedicalAnalyticsModal({ records, onClose }: {
  records: MedicalCaseRecord[]
  onClose: () => void
}) {
  const [selectedMonth, setSelectedMonth] = useState<'All' | string>('All')

  const months = useMemo(() => {
    const keys = Array.from(new Set(records.map(r => monthKey(r.caseDate)).filter(Boolean)))
    return keys.sort().reverse()
  }, [records])

  const filtered = useMemo(() => selectedMonth === 'All' ? records : records.filter(r => monthKey(r.caseDate) === selectedMonth), [records, selectedMonth])

  const today = new Date().toISOString().slice(0, 10)
  const totalCases = filtered.length
  const todayCases = filtered.filter(r => r.caseDate === today).length
  const mcProvided = filtered.filter(r => r.mcProvided).length
  const onSickToday = filtered.filter(r => r.sickLeaveFrom <= today && r.sickLeaveTo >= today).length

  const monthlyData = useMemo(() => {
    const map = new Map<string, { days: number; cases: number }>()
    records.forEach((r) => {
      if (!r.caseDate) return
      const key = monthKey(r.caseDate)
      if (!key) return
      const cur = map.get(key) ?? { days: 0, cases: 0 }
      map.set(key, { days: cur.days + (r.sickLeaveDays || 1), cases: cur.cases + 1 })
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [records])

  const sectionData = useMemo(() => {
    const map = new Map<string, { days: number; cases: number }>()
    filtered.forEach((r) => {
      const dep = r.department || 'Unknown'
      const cur = map.get(dep) ?? { days: 0, cases: 0 }
      map.set(dep, { days: cur.days + (r.sickLeaveDays || 1), cases: cur.cases + 1 })
    })
    return Array.from(map.entries()).sort((a, b) => b[1].cases - a[1].cases)  // highest visits on top
  }, [filtered])

  const topStaff = useMemo(() => {
    const map = new Map<string, { name: string; department: string; days: number; cases: number }>()
    filtered.forEach((r) => {
      const cur = map.get(r.employeeId) ?? { name: r.name, department: r.department, days: 0, cases: 0 }
      map.set(r.employeeId, { name: r.name, department: r.department, days: cur.days + (r.sickLeaveDays || 1), cases: cur.cases + 1 })
    })
    return Array.from(map.entries()).sort((a, b) => b[1].days - a[1].days)
    // No .slice() — show everyone
  }, [filtered])

  const maxMonthCases = Math.max(...monthlyData.map(([, v]) => v.cases), 1)
  const maxSectCases  = Math.max(...sectionData.map(([, v]) => v.cases), 1)
  const maxStaffDays = Math.max(...topStaff.map(([, v]) => v.days), 1)
  const totalDays    = records.reduce((s, r) => s + (r.sickLeaveDays || 1), 0)
  const noMcCount    = records.filter((r) => !r.mcProvided).length

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal mc-analytics-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Medical Leave</p>
            <h2>Analytics</h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>{records.length} cases · {totalDays} total sick days · {noMcCount} without MC</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <label style={{display:'flex',flexDirection:'column',gap:4}}>
              <span style={{fontSize:'0.70rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.04em'}}>Filter Month</span>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{fontSize:'0.82rem',padding:'5px 10px',borderRadius:8,border:'1px solid #e2e8f0'}}>
                <option value="All">All Months</option>
                {months.map(key => <option key={key} value={key}>{formatMonthLabel(key)}</option>)}
              </select>
            </label>
            <button className="icon-button" onClick={onClose} type="button">×</button>
          </div>
        </div>

        {/* ── fixed-height body: no outer scroll ── */}
        <div className="mc-analytics-body">

          {/* KPI chips */}
          <div className="mc-kpi-bar mc-an-kpi-row">
            <div className="mc-kpi-chip mc-kpi-blue"><span className="mc-kpi-num">{totalCases}</span><span className="mc-kpi-lbl">Total Cases</span></div>
            <div className="mc-kpi-chip mc-kpi-purple"><span className="mc-kpi-num">{todayCases}</span><span className="mc-kpi-lbl">Today's Cases</span></div>
            <div className="mc-kpi-chip mc-kpi-green"><span className="mc-kpi-num">{mcProvided}</span><span className="mc-kpi-lbl">MC Provided</span></div>
            <div className="mc-kpi-chip mc-kpi-amber"><span className="mc-kpi-num">{onSickToday}</span><span className="mc-kpi-lbl">On Sick Leave</span></div>
          </div>

          {/* Top row: monthly chart + dept breakdown — fixed height */}
          <div className="mc-top-row">
            <div className="mc-an-panel">
              <p className="mc-an-title">Medical Visits per Month</p>
              {monthlyData.length === 0
                ? <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No data.</p>
                : (
                  <div className="mc-an-bar-chart">
                    {monthlyData.map(([key, val]) => (
                      <div className="mc-an-bar-col" key={key}>
                        <div className="mc-an-bar-wrap">
                          <span className={`mc-an-bar${selectedMonth === key ? ' mc-an-bar-active' : ''}`} style={{ height: `${Math.round((val.cases / maxMonthCases) * 100)}%` }} title={`${val.cases} visits · ${val.days}d`} />
                        </div>
                        <div className="mc-an-bar-val">{val.cases}</div>
                        <div className="mc-an-bar-lbl">{formatMonthLabel(key).slice(0, 3)}</div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="mc-an-panel">
              <p className="mc-an-title">Visits by Department{selectedMonth !== 'All' ? ` — ${formatMonthLabel(selectedMonth)}` : ''}</p>
              {sectionData.length === 0
                ? <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No data.</p>
                : sectionData.map(([dept, val]) => (
                  <div className="mc-an-h-row" key={dept}>
                    <div className="mc-an-h-label" title={dept}>{dept}</div>
                    <div className="mc-an-h-track"><div className="mc-an-h-fill" style={{ width: `${Math.round((val.cases / maxSectCases) * 100)}%` }} /></div>
                    <div className="mc-an-h-meta">{val.cases} visits</div>
                  </div>
                ))}
            </div>
          </div>

          {/* Staff summary — flex: 1, ONLY this scrolls */}
          <div className="mc-an-panel mc-an-staff-panel">
            <p className="mc-an-title">
              Staff Medical Summary{selectedMonth !== 'All' ? ` — ${formatMonthLabel(selectedMonth)}` : ''}
              {topStaff.length > 0 && <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 6 }}>({topStaff.length} staff)</span>}
            </p>
            {topStaff.length === 0
              ? <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No data.</p>
              : (
                <div className="mc-an-staff-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                      <tr style={{ borderBottom: '2px solid #e8eaf0' }}>
                        <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', width: 32 }}>#</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Emp ID</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Section</th>
                        <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Cases</th>
                        <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Days</th>
                        <th style={{ padding: '6px 8px', width: 100 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {topStaff.map(([empId, v], rank) => (
                        <tr key={empId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: rank === 0 ? '#fbbf24' : rank === 1 ? '#94a3b8' : rank === 2 ? '#d97706' : '#e2e8f0', color: rank <= 2 ? '#fff' : '#374151', fontSize: '0.65rem', fontWeight: 800 }}>{rank + 1}</span>
                          </td>
                          <td style={{ padding: '5px 8px', fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>{empId}</td>
                          <td style={{ padding: '5px 8px', fontSize: '0.82rem' }}><strong style={{ color: '#111827' }}>{v.name}</strong></td>
                          <td style={{ padding: '5px 8px', fontSize: '0.76rem', color: '#374151' }}>{v.department}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'center', fontSize: '0.82rem', color: '#374151', fontWeight: 600 }}>{v.cases}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 800, color: '#1e40af' }}>{v.days}d</td>
                          <td style={{ padding: '5px 8px' }}>
                            <div style={{ height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.round((v.days / maxStaffDays) * 100)}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#6366f1,#a5b4fc)' }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

        </div>{/* mc-analytics-body */}

        <div className="modal-actions" style={{ paddingTop: 8 }}>
          <button className="quiet-button light" onClick={onClose} type="button">Close</button>
        </div>
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
  const [mcFilter, setMcFilter] = useState<'All' | 'Yes' | 'No'>('All')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [monthFilter, setMonthFilter] = useState<'All' | string>('All')
  const [editing, setEditing] = useState<MedicalCaseRecord | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const months = useMemo(() => {
    const keys = Array.from(new Set(records.map((r) => monthKey(r.caseDate)).filter(Boolean)))
    return keys.sort().reverse()
  }, [records])

  const filtered = useMemo(() => records.filter((r) => {
    const text = [r.employeeId, r.name, r.department, r.reason, r.hospital].join(' ').toLowerCase()
    const matchSearch = text.includes(search.trim().toLowerCase())
    const matchMc = mcFilter === 'All' || (mcFilter === 'Yes' ? r.mcProvided : !r.mcProvided)
    const matchDept = deptFilter === 'All Departments' || r.department === deptFilter
    const matchMonth = monthFilter === 'All' || monthKey(r.caseDate) === monthFilter
    return matchSearch && matchMc && matchDept && matchMonth
  }).sort((a, b) => b.caseDate.localeCompare(a.caseDate)), [records, search, mcFilter, deptFilter, monthFilter])

  const totalCases    = records.length
  const todayVisits   = records.filter((r) => r.caseDate === today).length
  const mcProvided    = records.filter((r) => r.mcProvided).length
  const onSickToday   = records.filter((r) => r.sickLeaveFrom <= today && r.sickLeaveTo >= today).length
  const admittedCount = records.filter((r) => r.isAdmitted).length

  const newCase = (): MedicalCaseRecord => ({
    id: 'MC-new', caseDate: today, employeeId: '', name: '', department: '',
    reason: '', hospital: '', departTime: '09:00', returnTime: '13:00',
    doctorAdvice: '', mcProvided: false, sickLeaveFrom: today, sickLeaveTo: today,
    sickLeaveDays: 1, recordedBy: '', isUrgent: false, isAdmitted: false, admittedDate: '', dischargedDate: '',
  })

  const save = (r: MedicalCaseRecord) => {
    onUpdate((prev) => {
      const exists = prev.some((x) => x.id === r.id)
      return exists ? prev.map((x) => x.id === r.id ? r : x) : [r, ...prev]
    })
    setEditing(null)
  }
  const del = (id: string) => onUpdate((prev) => prev.filter((r) => r.id !== id))

  return (
    <>
      {/* Compact KPI bar */}
      <div className="mc-kpi-bar">
        <div className="mc-kpi-chip mc-kpi-blue">
          <span className="mc-kpi-num">{totalCases}</span>
          <span className="mc-kpi-lbl">Total Cases</span>
        </div>
        <div className="mc-kpi-chip mc-kpi-purple">
          <span className="mc-kpi-num">{todayVisits}</span>
          <span className="mc-kpi-lbl">Today's Cases</span>
        </div>
        <div className="mc-kpi-chip mc-kpi-green">
          <span className="mc-kpi-num">{mcProvided}</span>
          <span className="mc-kpi-lbl">MC Provided</span>
        </div>
        <div className="mc-kpi-chip mc-kpi-amber">
          <span className="mc-kpi-num">{onSickToday}</span>
          <span className="mc-kpi-lbl">On Sick Leave</span>
        </div>
        <div className="mc-kpi-chip mc-kpi-red">
          <span className="mc-kpi-num">{admittedCount}</span>
          <span className="mc-kpi-lbl">Admitted Cases</span>
        </div>
        <button className="mc-analytics-btn" onClick={() => setShowAnalytics(true)} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Analytics
        </button>
      </div>

      {/* Filters + Add */}
      <div className="table-toolbar mc-toolbar leave-toolbar-has-btn">
        <label className="search-field"><span>Search</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, Emp ID, reason…" /></label>
        <label><span>MC</span>
          <select value={mcFilter} onChange={(e) => setMcFilter(e.target.value as 'All' | 'Yes' | 'No')}>
            <option value="All">All</option><option>Yes</option><option>No</option>
          </select>
        </label>
        <label><span>Section</span>
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

      {/* Table */}
      <div className="employee-table-shell compact-scroll">
        <table className="data-table mc-table">
          <thead>
            <tr>
              <th className="mc-expand-th" />
              <th>Date</th>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Section</th>
              <th>Reason</th>
              <th style={{ textAlign: 'center' }}>MC</th>
              <th>SL From</th>
              <th>SL To</th>
              <th style={{ textAlign: 'center' }}>Days</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const isExp = expandedId === r.id
              return (
                <Fragment key={r.id}>
                  <tr className={`mc-row${isExp ? ' mc-row-open' : ''}${r.isAdmitted ? ' mc-admitted-row' : ''}`} onClick={() => setExpandedId(isExp ? null : r.id)}>
                    <td className="mc-expand-cell"><span className={`mc-arrow${isExp ? ' mc-arrow-open' : ''}`}>›</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateDisplay(r.caseDate)}</td>
                    <td>{r.employeeId}</td>
                    <td className="mc-name-cell">{r.name}</td>
                    <td>{r.department}</td>
                    <td className="mc-reason-cell">{r.reason}</td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <span className={`mc-bool-badge${r.mcProvided ? ' mc-yes' : ' mc-no'}`}>{r.mcProvided ? 'Yes' : 'No'}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.sickLeaveFrom ? formatDateDisplay(r.sickLeaveFrom) : '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.sickLeaveTo ? formatDateDisplay(r.sickLeaveTo) : '—'}</td>
                    <td style={{ textAlign: 'center' }}><strong>{r.sickLeaveDays || '—'}</strong></td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div className="row-actions request-inline-actions" style={{ justifyContent: 'center' }}>
                        <button className="action-glyph edit" onClick={() => setEditing(r)} type="button" title="Edit">✎</button>
                        <button className="action-glyph delete" onClick={() => del(r.id)} type="button" title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                  {isExp && (
                    <tr className="mc-detail-row">
                      <td colSpan={11}>
                        <div className="mc-detail-content mc-detail-3grid">
                          {/* Col 1 — Doctor Advice (wider) */}
                          <div className="mc-d3-advice">
                            <strong className="mc-detail-heading">Doctor Advice / Summary</strong>
                            <div className="mc-detail-body">
                              {r.doctorAdvice
                                ? r.doctorAdvice.split('\n').map((line, i) => <p key={i}>{line}</p>)
                                : <em style={{ color: '#94a3b8' }}>No doctor advice recorded.</em>}
                            </div>
                          </div>
                          {/* Col 2 — Clinic info (2×2 fixed grid) */}
                          <div className="mc-d3-clinic">
                            <strong className="mc-detail-heading">Clinic Info</strong>
                            <div className="mc-d3-clinic-grid">
                              <div className="mc-detail-info-item"><span className="mc-detail-info-label">Hospital</span><span className="mc-detail-info-value">{r.hospital || '—'}</span></div>
                              <div className="mc-detail-info-item"><span className="mc-detail-info-label">Depart</span><span className="mc-detail-info-value">{r.departTime || '—'}</span></div>
                              <div className="mc-detail-info-item"><span className="mc-detail-info-label">Recorded By</span><span className="mc-detail-info-value">{r.recordedBy || '—'}</span></div>
                              <div className="mc-detail-info-item"><span className="mc-detail-info-label">Return</span><span className="mc-detail-info-value">{r.returnTime || '—'}</span></div>
                            </div>
                          </div>
                          {/* Col 3 — Admitted info */}
                          <div className="mc-d3-admitted">
                            <strong className="mc-detail-heading">Admission</strong>
                            {r.isAdmitted ? (
                              <div className="mc-d3-admitted-card">
                                <span className="mc-d3-admitted-badge">🏥 Admitted</span>
                                <div className="mc-detail-info-item" style={{ marginTop: 8 }}>
                                  <span className="mc-detail-info-label">Admitted Date</span>
                                  <span className="mc-detail-info-value">{r.admittedDate ? formatDateDisplay(r.admittedDate) : '—'}</span>
                                </div>
                                <div className="mc-detail-info-item">
                                  <span className="mc-detail-info-label">Discharged</span>
                                  <span className="mc-detail-info-value" style={{ color: r.dischargedDate ? '#166534' : '#dc2626' }}>
                                    {r.dischargedDate ? formatDateDisplay(r.dischargedDate) : 'Still admitted'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 6 }}>Not admitted</p>
                            )}
                          </div>
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

      {showAnalytics && <MedicalAnalyticsModal records={records} onClose={() => setShowAnalytics(false)} />}
      {editing && <MedicalCaseModal record={editing} employees={employees} onClose={() => setEditing(null)} onSave={save} />}
    </>
  )
}

function ActiveLeaveEditModal({ record, onClose, onSave }: {
  record: ActiveLeaveRecord
  onClose: () => void
  onSave: (updated: ActiveLeaveRecord) => void
}) {
  const [leaveType, setLeaveType] = useState<LeaveTypeCode>(record.leaveTypeCode)
  const [departureDate, setDepartureDate] = useState(record.departureDate)
  const [returnDate, setReturnDate] = useState(record.returnDate)
  const [remarks, setRemarks] = useState(record.remarks ?? '')
  const days = dayCount(departureDate, returnDate)

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Active Leave</p>
            <h2>Edit — {record.name}</h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>{record.employeeId} · {record.department}</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <div className="form-grid">
          <label>
            <span>Leave Type</span>
            <select value={leaveType} onChange={e => setLeaveType(e.target.value as LeaveTypeCode)}>
              {leaveTypeOptions.map(l => <option key={l.code} value={l.code}>{l.label} ({l.code})</option>)}
            </select>
          </label>
          <label>
            <span>Departure Date</span>
            <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} />
          </label>
          <label>
            <span>Return Date</span>
            <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
          </label>
          <label>
            <span>Total Days</span>
            <input readOnly value={days > 0 ? `${days} day${days !== 1 ? 's' : ''}` : '—'} className="lf-readonly" />
          </label>
          <label className="full-field">
            <span>Remarks</span>
            <input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional notes" />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="quiet-button light" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={() => onSave({ ...record, leaveTypeCode: leaveType, departureDate, returnDate, days: days > 0 ? days : record.days, remarks })} type="button">
            Save Changes
          </button>
        </div>
      </section>
    </div>
  )
}

function LeaveExtendModal({ record, editExtension, onClose, onSave }: {
  record: ActiveLeaveRecord
  editExtension?: LeaveExtension          // if set → edit mode; else → add mode
  onClose: () => void
  onSave: (updated: ActiveLeaveRecord) => void
}) {
  const isEditMode = !!editExtension
  const [additionalDays, setAdditionalDays] = useState(editExtension?.additionalDays ?? 7)
  const [reason, setReason] = useState(editExtension?.reason ?? '')
  const [extLeaveType, setExtLeaveType] = useState<LeaveTypeCode>(editExtension?.leaveTypeCode ?? record.leaveTypeCode)

  // Freeze original values before the very first extension
  const originalReturn = record.originalReturnDate ?? record.returnDate
  const originalDays   = record.originalDays ?? record.days

  // Compute new return date from originalReturn + all extension days (including this one)
  const newReturnDate = useMemo(() => {
    if (!originalReturn) return originalReturn
    const existing = (record.extensions ?? []).filter(e => e.id !== editExtension?.id)
    const totalExt = existing.reduce((s, e) => s + e.additionalDays, 0) + additionalDays
    const d = new Date(originalReturn)
    d.setDate(d.getDate() + totalExt)
    return d.toISOString().slice(0, 10)
  }, [originalReturn, record.extensions, editExtension, additionalDays])

  const newTotalDays = useMemo(() => {
    const existing = (record.extensions ?? []).filter(e => e.id !== editExtension?.id)
    const totalExt = existing.reduce((s, e) => s + e.additionalDays, 0) + additionalDays
    return originalDays + totalExt
  }, [originalDays, record.extensions, editExtension, additionalDays])

  const save = () => {
    if (!reason.trim()) return
    const ext: LeaveExtension = {
      id: editExtension?.id ?? `EXT-${Date.now()}`,
      leaveTypeCode: extLeaveType,
      additionalDays,
      reason,
      addedDate: editExtension?.addedDate ?? new Date().toISOString().slice(0, 10),
    }
    const newExtensions = isEditMode
      ? (record.extensions ?? []).map(e => e.id === ext.id ? ext : e)
      : [...(record.extensions ?? []), ext]

    onSave({
      ...record,
      returnDate: newReturnDate,
      days: newTotalDays,
      // leaveTypeCode NEVER changes — original leave type is preserved
      extensions: newExtensions,
      originalReturnDate: originalReturn,
      originalDays,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Active Leave — {isEditMode ? 'Edit Extension' : 'Add Extension'}</p>
            <h2>{isEditMode ? 'Edit Extension' : 'Extend Leave'} — {record.name}</h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              {record.employeeId} · Original: <strong>{leaveTypeOptions.find(l => l.code === record.leaveTypeCode)?.label ?? record.leaveTypeCode}</strong>
              {' '}· Current return: <strong>{formatDateDisplay(record.returnDate)}</strong>
            </p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <div className="form-grid">
          <label>
            <span>Extension Leave Type</span>
            <select value={extLeaveType} onChange={e => setExtLeaveType(e.target.value as LeaveTypeCode)}>
              {leaveTypeOptions.map(l => <option key={l.code} value={l.code}>{l.label} ({l.code})</option>)}
            </select>
          </label>
          <label>
            <span>Additional Days</span>
            <input type="number" value={additionalDays} min={1} onChange={e => setAdditionalDays(parseInt(e.target.value) || 1)} />
          </label>
          <label>
            <span>New Return Date</span>
            <input readOnly value={newReturnDate ? formatDateDisplay(newReturnDate) : '—'} className="lf-readonly" />
          </label>
          <label>
            <span>New Total Days</span>
            <input readOnly value={`${newTotalDays} days (orig. ${originalDays})`} className="lf-readonly" />
          </label>
          <label className="full-field">
            <span>Reason <span style={{ color: '#ef4444' }}>*</span></span>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Medical extension, visa delay, family emergency…" />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="quiet-button light" onClick={onClose}>Cancel</button>
          <button className="primary-button" disabled={!reason.trim()} onClick={save} type="button">
            {isEditMode ? 'Save Extension' : 'Add Extension'}
          </button>
        </div>
      </section>
    </div>
  )
}

function LeaveProgressModal({ record, onClose }: {
  record: LeaveHistoryRecord
  onClose: () => void
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Leave History</p>
            <h2>Request Progress — {record.name}</h2>
            <p style={{ fontSize: '0.80rem', color: '#64748b' }}>{record.employeeId} · {record.department} · {formatDateDisplay(record.departureDate)} → {formatDateDisplay(record.returnDate)}</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        {record.skipProgress
          ? <div className="lr-fasttrack-badge" style={{ margin: '20px' }}>⚡ Fast Track — Progress steps were skipped for this leave</div>
          : (
            <div className="lr-pipeline" style={{ margin: '20px 8px', borderRadius: 8 }}>
              {requestSteps.map((step, i) => {
                const hasDone = record.stepDates?.[step]
                const cls = hasDone ? 'lr-done' : 'lr-future'
                return (
                  <Fragment key={step}>
                    <div className={`lr-pip-step ${cls}`} style={{ cursor: 'default' }}>
                      <div className="lr-pip-circle">{hasDone ? '✓' : i + 1}</div>
                      <div className="lr-pip-label">{step}</div>
                      <div className="lr-pip-date">{record.stepDates?.[step] ? formatDateDisplay(record.stepDates[step]!) : hasDone ? '—' : ''}</div>
                    </div>
                    {i < requestSteps.length - 1 && <div className={`lr-pip-line ${hasDone ? 'lr-pip-line-done' : 'lr-pip-line-future'}`} />}
                  </Fragment>
                )
              })}
            </div>
          )}
        <div className="modal-actions">
          <button className="quiet-button light" onClick={onClose} type="button">Close</button>
        </div>
      </section>
    </div>
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
  onSetRequestStep,
  onExtendLeave,
  onEditActiveLeave,
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
  onSetRequestStep: (id: string, step: LeaveRequestStep) => void
  onExtendLeave: (updated: ActiveLeaveRecord) => void
  onEditActiveLeave: (updated: ActiveLeaveRecord) => void
  onHistoryConfirm: (id: string, confirmation: HistoryConfirmation) => void
  onUpdateMedical: (fn: (prev: MedicalCaseRecord[]) => MedicalCaseRecord[]) => void
}) {
  const [activeLeaveView, setActiveLeaveView] = useState<LeaveView>('request')

  const empMap = useMemo(() => new Map(employees.map((e) => [e.employeeId, e])), [employees])
  const getNic = (empId: string) => empMap.get(empId)?.nicPassportNo ?? '—'

  const [requestSearch, setRequestSearch] = useState('')
  const [requestTypeFilter, setRequestTypeFilter] = useState<'All' | LeaveTypeCode>('All')
  const [requestDepartmentFilter, setRequestDepartmentFilter] = useState('All Departments')
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null)

  const [activeSearch, setActiveSearch] = useState('')
  const [activeTypeFilter, setActiveTypeFilter] = useState<'All' | LeaveTypeCode>('All')
  const [activeDepartmentFilter, setActiveDepartmentFilter] = useState('All Departments')
  const [extendingLeave, setExtendingLeave] = useState<ActiveLeaveRecord | null>(null)
  const [editingExtension, setEditingExtension] = useState<{ record: ActiveLeaveRecord; ext: LeaveExtension } | null>(null)
  const [editingActiveLeave, setEditingActiveLeave] = useState<ActiveLeaveRecord | null>(null)
  const [expandedActiveId, setExpandedActiveId] = useState<string | null>(null)

  const [historySearch, setHistorySearch] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'All' | HistoryConfirmation>('All')
  const [historyMonthFilter, setHistoryMonthFilter] = useState<'All' | string>('All')
  const [historyDepartmentFilter, setHistoryDepartmentFilter] = useState('All Departments')
  const [viewingProgress, setViewingProgress] = useState<LeaveHistoryRecord | null>(null)

  const historyMonths = useMemo(() => {
    const keys = Array.from(new Set(leaveHistory.map((record) => monthKey(record.returnDate)).filter(Boolean)))
    return keys.sort()
  }, [leaveHistory])

  const requestRows = useMemo(() => leaveRequests.filter((record) => {
    const matchesSearch = leaveSearchText(record).includes(requestSearch.trim().toLowerCase())
    const matchesType = requestTypeFilter === 'All' || record.leaveTypeCode === requestTypeFilter
    const matchesDepartment = requestDepartmentFilter === 'All Departments' || record.department === requestDepartmentFilter
    return matchesSearch && matchesType && matchesDepartment
  }).sort((a, b) => a.departureDate.localeCompare(b.departureDate)), [leaveRequests, requestSearch, requestTypeFilter, requestDepartmentFilter])

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
          <button className={`lst-btn${activeLeaveView === 'request' ? ' active' : ''}`} onClick={() => setActiveLeaveView('request')} type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Leave Request
          </button>
          <button className={`lst-btn${activeLeaveView === 'active' ? ' active' : ''}`} onClick={() => setActiveLeaveView('active')} type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Active Leaves
          </button>
          <button className={`lst-btn${activeLeaveView === 'history' ? ' active' : ''}`} onClick={() => setActiveLeaveView('history')} type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Leave History
          </button>
          <button className={`lst-btn${activeLeaveView === 'medical' ? ' active' : ''}`} onClick={() => setActiveLeaveView('medical')} type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Medical Leave
          </button>
        </div>

        {activeLeaveView === 'request' && (
          <>
            <div className="table-toolbar leave-toolbar leave-toolbar-3 leave-toolbar-has-btn">
              <label className="search-field"><span>Search</span><input type="search" value={requestSearch} onChange={(event) => setRequestSearch(event.target.value)} placeholder="Employee, ID, purpose" /></label>
              <label><span>Leave Type</span><select value={requestTypeFilter} onChange={(event) => setRequestTypeFilter(event.target.value as 'All' | LeaveTypeCode)}><option value="All">All Types</option>{leaveTypeOptions.map((item) => <option key={item.code} value={item.code}>{item.label} ({item.code})</option>)}</select></label>
              <label><span>Section</span><select value={requestDepartmentFilter} onChange={(event) => setRequestDepartmentFilter(event.target.value)}><option>All Departments</option>{departmentsList.map((item) => <option key={item}>{item}</option>)}</select></label>
              <button className="primary-button toolbar-add-btn" onClick={onAddRequest} type="button">Add Leave Request</button>
            </div>
            <div className="employee-table-shell compact-scroll">
              <table className="data-table leave-table">
                <thead><tr>
                  <th className="lr-expand-th" />
                  <th>Emp ID</th><th>Name</th><th>Section</th><th>NIC / PP No</th>
                  <th className="leave-type-th">Leave Type</th>
                  <th className="leave-date-th">Departure</th><th className="leave-date-th">Return</th>
                  <th className="leave-days-th">Days</th><th>Remarks</th>
                  <th className="leave-status-th">Status</th><th>Action</th>
                </tr></thead>
                <tbody>
                  {requestRows.map((record) => {
                    const stepIdx = requestSteps.indexOf(record.step)
                    const isLast = stepIdx === requestSteps.length - 1
                    const nextStep = isLast ? null : requestSteps[stepIdx + 1]
                    const isExp = expandedReqId === record.id
                    return (
                      <Fragment key={record.id}>
                        <tr className={`lr-row${isExp ? ' lr-row-open' : ''}`} onClick={() => setExpandedReqId(isExp ? null : record.id)}>
                          <td className="lr-expand-td"><span className={`mc-arrow${isExp ? ' mc-arrow-open' : ''}`}>›</span></td>
                          <td>{record.employeeId}</td>
                          <td>{record.name}</td>
                          <td>{record.department}</td>
                          <td>{getNic(record.employeeId)}</td>
                          <td className="leave-type-cell"><LeaveTypeBadge code={record.leaveTypeCode} /></td>
                          <td className="leave-date-cell">{formatDateDisplay(record.departureDate)}</td>
                          <td className="leave-date-cell">{formatDateDisplay(record.returnDate)}</td>
                          <td className="leave-days-cell">{record.days}</td>
                          <td className="leave-remarks-cell">{record.remarks || <span className="muted-dash">—</span>}</td>
                          <td className="leave-status-cell" onClick={(e) => e.stopPropagation()}>
                            <button
                              className={`lr-status-pill lr-step-${stepIdx}`}
                              disabled={isLast}
                              onClick={(e) => { e.stopPropagation(); if (nextStep) onSetRequestStep(record.id, nextStep) }}
                              type="button"
                              title={isLast ? 'Pending Departure — final step' : `Advance to: ${nextStep}`}
                            >
                              {record.step}
                              {!isLast && <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor" style={{ marginLeft: 4, opacity: 0.7 }}><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </button>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="row-actions request-inline-actions">
                              <button className="action-glyph edit" onClick={() => onEditRequest(record)} type="button" title="Edit">✎</button>
                              <button className="action-glyph delete" onClick={() => onDeleteRequest(record.id)} type="button" title="Delete">🗑</button>
                            </div>
                          </td>
                        </tr>
                        {isExp && (
                          <tr className="lr-pipeline-row">
                            <td colSpan={12}>
                              {record.skipProgress
                                ? <div className="lr-fasttrack-badge">⚡ Fast Track — Progress steps skipped</div>
                                : <div className="lr-pipeline">
                                    {requestSteps.map((step, i) => {
                                      const isDone = i < stepIdx
                                      const isCurrent = i === stepIdx
                                      const cls = isDone ? 'lr-done' : isCurrent ? 'lr-current' : 'lr-future'
                                      const stepDate = record.stepDates?.[step] ?? undefined
                                      return (
                                        <Fragment key={step}>
                                          <button
                                            className={`lr-pip-step ${cls}`}
                                            onClick={(e) => { e.stopPropagation(); onSetRequestStep(record.id, step) }}
                                            type="button"
                                            title={`Set to: ${step}`}
                                          >
                                            <div className="lr-pip-circle">{isDone ? '✓' : i + 1}</div>
                                            <div className="lr-pip-label">{step}</div>
                                            <div className="lr-pip-date">{stepDate ? formatDateDisplay(stepDate) : '—'}</div>
                                          </button>
                                          {i < requestSteps.length - 1 && (
                                            <div className={`lr-pip-line ${isDone ? 'lr-pip-line-done' : 'lr-pip-line-future'}`} />
                                          )}
                                        </Fragment>
                                      )
                                    })}
                                  </div>
                              }
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
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
              <table className="data-table leave-table">
                <thead><tr>
                  <th className="lr-expand-th" />
                  <th>Emp ID</th><th>Name</th><th>Section</th><th>NIC / PP No</th>
                  <th className="leave-type-th">Leave Type</th>
                  <th className="leave-date-th">Departure</th><th className="leave-date-th">Return</th>
                  <th className="leave-days-th">Days</th><th>Remarks</th>
                  <th className="leave-status-th">Status</th><th>Action</th>
                </tr></thead>
                <tbody>
                  {activeRows.map(record => {
                    const isExp = expandedActiveId === record.id
                    const ext = record.extensions?.[0] ?? null   // only 1 extension ever
                    const hasExt = !!ext
                    const ExtendSvg = () => (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="13" height="16" rx="2"/>
                        <line x1="7" y1="2" x2="7" y2="6"/><line x1="11" y1="2" x2="11" y2="6"/>
                        <line x1="2" y1="9" x2="15" y2="9"/>
                        <line x1="18" y1="12" x2="22" y2="12"/>
                        <polyline points="20 10 22 12 20 14"/>
                      </svg>
                    )
                    return (
                      <Fragment key={record.id}>
                        <tr className={`mc-row${isExp ? ' mc-row-open' : ''}`}
                          onClick={() => hasExt && setExpandedActiveId(isExp ? null : record.id)}
                          style={{ cursor: hasExt ? 'pointer' : 'default' }}
                        >
                          <td className="mc-expand-cell">
                            {hasExt && <span className={`mc-arrow${isExp ? ' mc-arrow-open' : ''}`}>›</span>}
                          </td>
                          <td>{record.employeeId}</td>
                          <td>{record.name}</td>
                          <td>{record.department}</td>
                          <td>{getNic(record.employeeId)}</td>
                          {/* Leave type: stacked — original on top, extension below */}
                          <td className="leave-type-cell">
                            <div className="al-type-stack">
                              <div className="al-type-row">
                                <LeaveTypeBadge code={record.leaveTypeCode} />
                                {hasExt && <span className="al-orig-tag">original</span>}
                              </div>
                              {hasExt && ext && (
                                <div className="al-type-row al-type-ext">
                                  <LeaveTypeBadge code={ext.leaveTypeCode} />
                                  <span className="al-ext-tag">+{ext.additionalDays}d ext</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="leave-date-cell">{formatDateDisplay(record.departureDate)}</td>
                          <td className="leave-date-cell">
                            <div>{formatDateDisplay(record.returnDate)}</div>
                            {hasExt && <div style={{ fontSize: '0.66rem', color: '#64748b' }}>was {formatDateDisplay(record.originalReturnDate!)}</div>}
                          </td>
                          <td className="leave-days-cell">
                            <div>{record.days}d</div>
                            {hasExt && <div style={{ fontSize: '0.66rem', color: '#64748b' }}>{record.originalDays} + {ext!.additionalDays}</div>}
                          </td>
                          <td className="leave-remarks-cell">{record.remarks || <span className="muted-dash">—</span>}</td>
                          <td className="leave-status-cell-sm"><StatusBadge status="Departed" /></td>
                          <td onClick={e => e.stopPropagation()}>
                            {/* Single-extension: if exists → edit it; if not → add it */}
                            <button
                              className={`action-glyph ${hasExt ? 'action-glyph-edit-ext' : 'action-glyph-extend'}`}
                              onClick={() => hasExt && ext
                                ? setEditingExtension({ record, ext })
                                : setExtendingLeave(record)
                              }
                              type="button"
                              title={hasExt ? 'Edit extension' : 'Add extension'}
                            >
                              <ExtendSvg />
                            </button>
                          </td>
                        </tr>
                        {isExp && hasExt && ext && (
                          <tr className="mc-detail-row">
                            <td colSpan={12}>
                              <div className="al-ext-detail">
                                <div className="al-ext-detail-section">
                                  <span className="al-ext-detail-lbl">Original Leave</span>
                                  <div className="al-ext-detail-row">
                                    <LeaveTypeBadge code={record.leaveTypeCode} />
                                    <span>{formatDateDisplay(record.departureDate)} → {formatDateDisplay(record.originalReturnDate!)}</span>
                                    <span className="al-ext-days">{record.originalDays}d</span>
                                  </div>
                                </div>
                                <div className="al-ext-detail-arrow">→</div>
                                <div className="al-ext-detail-section">
                                  <span className="al-ext-detail-lbl">Extension</span>
                                  <div className="al-ext-detail-row">
                                    <LeaveTypeBadge code={ext.leaveTypeCode} />
                                    <span>{formatDateDisplay(record.originalReturnDate!)} → {formatDateDisplay(record.returnDate)}</span>
                                    <span className="al-ext-days">+{ext.additionalDays}d</span>
                                  </div>
                                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 4 }}>{ext.reason}</div>
                                </div>
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
              <table className="data-table leave-table"><thead><tr><th>Emp ID</th><th>Name</th><th>Section</th><th>NIC / PP No</th><th className="leave-type-th">Leave Type</th><th className="leave-date-th">Departure</th><th className="leave-date-th">Return</th><th className="leave-days-th">Days</th><th>Remarks</th><th className="leave-status-th">Status</th><th></th></tr></thead><tbody>
                {historyRows.map((record) => {
                  const histExt = record.extensions?.[0] ?? null
                  return (
                    <tr className={record.confirmation === 'Not Returned' ? 'not-returned-row' : ''} key={record.id}>
                      <td>{record.employeeId}</td>
                      <td>{record.name}</td>
                      <td>{record.department}</td>
                      <td>{getNic(record.employeeId)}</td>
                      <td className="leave-type-cell">
                        <div className="al-type-stack">
                          <div className="al-type-row">
                            <LeaveTypeBadge code={record.leaveTypeCode} />
                            {histExt && <span className="al-orig-tag">original</span>}
                          </div>
                          {histExt && (
                            <div className="al-type-row al-type-ext">
                              <LeaveTypeBadge code={histExt.leaveTypeCode} />
                              <span className="al-ext-tag">+{histExt.additionalDays}d ext</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="leave-date-cell">{formatDateDisplay(record.departureDate)}</td>
                      <td className="leave-date-cell">{formatDateDisplay(record.returnDate)}</td>
                      <td className="leave-days-cell">
                        <div>{record.days}</div>
                        {histExt && <div style={{ fontSize: '0.66rem', color: '#64748b' }}>{record.originalDays} + {histExt.additionalDays}</div>}
                      </td>
                      <td className="leave-remarks-cell">{record.remarks || <span className="muted-dash">—</span>}</td>
                      <td className="leave-status-cell-sm">{record.confirmation ? <StatusBadge status={record.confirmation} /> : <div className="row-actions history-confirm-actions"><button className="mini-button" onClick={() => onHistoryConfirm(record.id, 'Returned')} type="button">Returned</button><button className="mini-button danger" onClick={() => onHistoryConfirm(record.id, 'Not Returned')} type="button">Not Returned</button></div>}</td>
                      <td><button className="action-glyph" onClick={() => setViewingProgress(record)} type="button" title="View Progress" style={{ fontSize: '1rem' }}>👁</button></td>
                    </tr>
                  )
                })}
              </tbody></table>
            </div>
          </>
        )}

        {activeLeaveView === 'medical' && (
          <MedicalLeaveSection records={medicalCases} employees={employees} onUpdate={onUpdateMedical} />
        )}

        {viewingProgress && <LeaveProgressModal record={viewingProgress} onClose={() => setViewingProgress(null)} />}
        {extendingLeave && <LeaveExtendModal record={extendingLeave} onClose={() => setExtendingLeave(null)} onSave={r => { onExtendLeave(r); setExtendingLeave(null) }} />}
        {editingExtension && <LeaveExtendModal record={editingExtension.record} editExtension={editingExtension.ext} onClose={() => setEditingExtension(null)} onSave={r => { onExtendLeave(r); setEditingExtension(null) }} />}
        {editingActiveLeave && <ActiveLeaveEditModal record={editingActiveLeave} onClose={() => setEditingActiveLeave(null)} onSave={r => { onEditActiveLeave(r); setEditingActiveLeave(null) }} />}

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
              <th style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>#</th>
              <th style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Emp ID</th>
              <th style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Full Name</th>
              <th style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>NIC / PP No</th>
              <th style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Section</th>
              <th style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Department</th>
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
    body { font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; color: #1a1a2e; background: #f0f0f0; margin: 0; padding: 0; }

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

    /* ══ HEADER BANNER — white bg, colored text ══ */
    .doc-hdr {
      background: #fff;
      padding: 12pt 20pt 10pt;
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 2.5pt solid #4f46e5;
    }
    .hdr-brand { font-size: 24pt; font-weight: 900; color: #3730a3; letter-spacing: 5px; line-height: 1; font-family: Arial, sans-serif; }
    .hdr-co { font-size: 7pt; color: #6b7280; letter-spacing: 0.4px; margin-top: 3pt; }
    .hdr-right { text-align: right; }
    .hdr-dept-lbl { font-size: 7pt; color: #4f46e5; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; }
    .hdr-doc-title { font-size: 13pt; font-weight: 900; color: #1e1b4b; letter-spacing: 1px; margin-top: 2pt; font-family: Arial, sans-serif; }
    .hdr-accent { height: 0; }

    /* ══ PAGE BODY ══ */
    .page-body { padding: 12pt 20pt 16pt; flex: 1; }

    /* ── Info table ── */
    .info-tbl { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
    .info-tbl td { padding: 4pt 8pt; font-size: 8pt; border: 0.75pt solid #d1d5db; vertical-align: middle; }
    .info-tbl .lbl {
      font-weight: 700; color: #4338ca; background: #fff;
      width: 100pt; white-space: nowrap;
    }
    .status-badge {
      display: inline-block; color: #166534; border: 1pt solid #166534;
      padding: 1pt 7pt; border-radius: 10pt; font-weight: 700; font-size: 7.5pt;
    }

    /* ── Section heading bar — no fill ── */
    .sec-hdr {
      color: #4338ca; background: #fff;
      padding: 5pt 0 3pt; font-size: 8pt; font-weight: 800;
      text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0;
      border-bottom: 1.5pt solid #4338ca;
    }

    /* ── Participants table ── */
    table.p-tbl { width: 100%; border-collapse: collapse; margin-bottom: 12pt; font-size: 7.5pt; table-layout: fixed; }
    .p-tbl thead th {
      background: #fff; color: #1e1b4b;
      padding: 4.5pt 5pt; text-align: left; font-weight: 800; font-size: 7.5pt;
      border-top: 1.5pt solid #4338ca; border-bottom: 1.5pt solid #4338ca;
      border-left: 0.75pt solid #d1d5db; border-right: 0.75pt solid #d1d5db;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .p-tbl thead th.tc { text-align: center; }
    .p-tbl tbody td { border: 0.75pt solid #d1d5db; padding: 3.5pt 5pt; vertical-align: middle; }
    .p-tbl .tc { text-align: center; }
    .p-tbl .sig-cell { height: 18pt; }

    /* ── Signature block — only Conducted By ── */
    .sig-row { display: flex; gap: 14pt; margin-top: 14pt; }
    .sig-block { flex: 1; max-width: 200pt; border: 0.75pt solid #9ca3af; border-top: 2pt solid #4338ca; }
    .sig-space { height: 46pt; }
    .sig-info { padding: 4pt 8pt; border-top: 0.75pt solid #d1d5db; }
    .sig-role { font-size: 7pt; color: #4338ca; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2pt; }
    .sig-person { font-weight: 700; font-size: 8.5pt; color: #1e1b4b; text-transform: uppercase; }
    .sig-desig { font-size: 7.5pt; color: #374151; margin-top: 1pt; }

    /* ══ PAGE 2 ══ */
    .p2-meta-bar {
      display: flex; gap: 24pt;
      border-left: 2.5pt solid #4338ca; border: 0.75pt solid #d1d5db; border-left-width: 2.5pt;
      padding: 5pt 10pt; margin-bottom: 12pt; font-size: 8pt;
    }
    .summary-hdg {
      font-size: 9pt; font-weight: 800; color: #4338ca;
      border-bottom: 1.5pt solid #4338ca; padding-bottom: 4pt; margin-bottom: 10pt;
    }
    .content-text { font-size: 8.5pt; line-height: 1.65; color: #1a1a2e; }
    .content-text p { margin: 0 0 6pt; }
    .remarks-box {
      margin-top: 12pt; padding: 6pt 10pt;
      border-left: 2.5pt solid #4338ca; border: 0.75pt solid #d1d5db; border-left-width: 2.5pt; font-size: 8pt;
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
            <tr>
              <th style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>#</th>
              <th style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Emp ID</th>
              <th style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Name</th>
              <th style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Section</th>
            </tr>
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

  const typeBadgeColor = record.trainingType === 'External' ? '#1e40af' : '#166534'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Training — ${esc(record.trainingTitle)}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; color: #1a1a2e; background: #f0f0f0; margin: 0; padding: 0; }

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

    /* ══ HEADER BANNER — white bg, colored text ══ */
    .doc-hdr {
      background: #fff;
      padding: 12pt 20pt 10pt;
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 2.5pt solid #4f46e5;
    }
    .hdr-brand { font-size: 24pt; font-weight: 900; color: #3730a3; letter-spacing: 5px; line-height: 1; }
    .hdr-co { font-size: 7pt; color: #6b7280; letter-spacing: 0.4px; margin-top: 3pt; }
    .hdr-right { text-align: right; max-width: 58%; }
    .hdr-dept-lbl { font-size: 7pt; color: #4f46e5; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; }
    .hdr-doc-title { font-size: 12pt; font-weight: 900; color: #1e1b4b; letter-spacing: 0.5px; margin-top: 2pt; word-break: break-word; line-height: 1.25; }
    .hdr-accent { height: 0; }

    /* ── Page body ── */
    .page-body { padding: 12pt 20pt 16pt; flex: 1; }

    /* ── Info table ── */
    .info-tbl { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
    .info-tbl td { padding: 4pt 8pt; font-size: 8pt; border: 0.75pt solid #d1d5db; vertical-align: middle; }
    .info-tbl .lbl { font-weight: 700; color: #4338ca; width: 100pt; white-space: nowrap; }
    .type-badge {
      display: inline-block; padding: 1pt 7pt; border-radius: 10pt; font-weight: 700; font-size: 7.5pt;
      color: ${typeBadgeColor}; border: 0.75pt solid ${typeBadgeColor};
    }
    .count-badge {
      display: inline-block; color: #4338ca; border: 0.75pt solid #4338ca;
      padding: 1pt 7pt; border-radius: 10pt; font-weight: 700; font-size: 7.5pt;
    }

    /* ── Section heading bar — no fill ── */
    .sec-hdr {
      color: #4338ca; background: #fff;
      padding: 5pt 0 3pt; font-size: 8pt; font-weight: 800;
      text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0;
      border-bottom: 1.5pt solid #4338ca;
    }

    /* ── Participants table ── */
    table.p-tbl { width: 100%; border-collapse: collapse; font-size: 7.5pt; table-layout: fixed; }
    .p-tbl thead th {
      background: #fff; color: #1e1b4b;
      padding: 4.5pt 5pt; text-align: left; font-weight: 800; font-size: 7.5pt;
      border-top: 1.5pt solid #4338ca; border-bottom: 1.5pt solid #4338ca;
      border-left: 0.75pt solid #d1d5db; border-right: 0.75pt solid #d1d5db;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .p-tbl thead th.tc { text-align: center; }
    .p-tbl tbody td { border: 0.75pt solid #d1d5db; padding: 3.5pt 5pt; vertical-align: middle; }
    .p-tbl .tc { text-align: center; }
    .p-tbl .sig-cell { height: 18pt; }

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
            <thead><tr>
              <th className="trn-title-th">Training Title</th>
              <th style={{ textAlign: 'center' }}>Date</th>
              <th>Conducted By</th>
              <th style={{ textAlign: 'center' }}>Type</th>
              <th style={{ textAlign: 'center' }}>Participants</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="empty-row">No training records found.</td></tr>
              ) : rows.map((record) => (
                <tr key={record.id}>
                  <td className="trn-title-cell">{record.trainingTitle}</td>
                  <td style={{ textAlign: 'center' }}>{record.date ? formatDateDisplay(record.date) : '—'}</td>
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
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, Emp ID, section, bank, nationality…" />
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
  const [searchQuery, setSearchQuery] = useState(() => {
    if (mode === 'edit' && record.employeeId) return `${record.employeeId} – ${record.name}`
    return ''
  })
  const [showResults, setShowResults] = useState(false)

  const statusOptions = useMemo(() => {
    if (mode === 'add') return allTerminationStages
    const currentIndex = allTerminationStages.indexOf(record.currentStage)
    return allTerminationStages.slice(Math.max(0, currentIndex))
  }, [mode, record.currentStage])

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q || form.employeeId) return []
    return employees
      .filter((e) => e.employeeId.toLowerCase().includes(q) || e.fullName.toLowerCase().includes(q))
      .slice(0, 8)
  }, [searchQuery, form.employeeId, employees])

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setForm((cur) => ({ ...cur, employeeId: '', name: '', department: '', designation: '', nationality: '', passportNo: '', wpNo: '', dateOfJoin: '' }))
    setShowResults(true)
  }

  const selectEmployee = (emp: Employee) => {
    setForm((cur) => ({
      ...cur,
      employeeId: emp.employeeId,
      name: emp.fullName,
      department: emp.department,
      designation: emp.designation,
      nationality: emp.nationality,
      passportNo: emp.nicPassportNo,
      wpNo: emp.workPermitNo,
      dateOfJoin: emp.dateOfJoin,
    }))
    setSearchQuery(`${emp.employeeId} – ${emp.fullName}`)
    setShowResults(false)
  }

  const save = (event: FormEvent) => {
    event.preventDefault()
    onSave(form)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal mc-wide-modal termination-form-modal" role="dialog" aria-modal="true" aria-labelledby="termination-form-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Termination Workflow</p>
            <h2 id="termination-form-title">{mode === 'add' ? 'Add Termination' : 'Edit Termination'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        <form onSubmit={save} style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 110px)', padding: '0 2px' }}>
          {/* Card 1 — Employee Details */}
          <div className="trn-modal-card" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', marginBottom: '14px' }}>
            <div className="mc-form-divider" style={{ marginBottom: '10px', color: '#1d4ed8' }}>Employee Details</div>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <label>
                <span>Search Staff (ID or Name)</span>
                <input
                  className="lf-search-input"
                  placeholder="Search by employee ID or name…"
                  type="search"
                  value={searchQuery}
                  autoComplete="off"
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => !form.employeeId && setShowResults(true)}
                />
              </label>
              {showResults && searchResults.length > 0 && (
                <ul className="lf-search-results" style={{ top: '100%', zIndex: 100 }}>
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
            <div className="mc-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
              <label><span>Designation</span><input readOnly value={form.designation} placeholder="—" className="lf-readonly" /></label>
              <label><span>Section</span><input readOnly value={form.department} placeholder="—" className="lf-readonly" /></label>
              <label><span>Nationality</span><input readOnly value={form.nationality} placeholder="—" className="lf-readonly" /></label>
              <label><span>Date of Join</span><input readOnly value={form.dateOfJoin} placeholder="—" className="lf-readonly" /></label>
            </div>
          </div>

          {/* Card 2 — Termination Details */}
          <div className="trn-modal-card" style={{ background: '#fefce8', border: '1.5px solid #fde68a', marginBottom: '14px' }}>
            <div className="mc-form-divider" style={{ marginBottom: '10px', color: '#92400e' }}>Termination Details</div>
            <div className="mc-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
              <label><span>Termination Type</span>
                <select value={form.terminationType} onChange={(e) => setForm((cur) => ({ ...cur, terminationType: e.target.value as TerminationType }))}>
                  <option>Resignation</option><option>Dismissal</option><option>Probation End</option>
                  <option>Contract Expiry</option><option>Absconded</option><option>Other</option>
                </select>
              </label>
              <label><span>Date Submitted</span><input type="date" value={form.dateSubmitted ?? ''} onChange={(e) => setForm((cur) => ({ ...cur, dateSubmitted: e.target.value }))} /></label>
              <label><span>Last Working Date</span><input type="date" value={form.lastWorkingDate} onChange={(e) => setForm((cur) => ({ ...cur, lastWorkingDate: e.target.value }))} required /></label>
              <label><span>Departure Date</span><input type="date" value={form.departureDate} onChange={(e) => setForm((cur) => ({ ...cur, departureDate: e.target.value }))} required /></label>
            </div>
            {mode === 'edit' && (
              <div className="mc-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', marginTop: 6 }}>
                <label><span>Stage</span>
                  <select value={form.currentStage} onChange={(e) => setForm((cur) => ({ ...cur, currentStage: e.target.value as TerminationStage }))} required>
                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
            )}
          </div>

          {/* Card 3 — Additional Info */}
          <div className="trn-modal-card" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', marginBottom: '14px' }}>
            <div className="mc-form-divider" style={{ marginBottom: '10px', color: '#166534' }}>Additional Info</div>
            <div className="mc-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <label style={{ gridColumn: 'span 2' }}><span>Reason for Leaving</span>
                <textarea rows={2} placeholder="Reason for termination" value={form.reasonForLeaving} onChange={(e) => setForm((cur) => ({ ...cur, reasonForLeaving: e.target.value }))} style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.82rem', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', width: '100%' }} />
              </label>
              <div>
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rehire Eligible</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className={form.rehireEligible ? 'primary-button' : 'quiet-button light'} style={{ padding: '5px 18px', fontSize: '0.78rem' }} onClick={() => setForm((cur) => ({ ...cur, rehireEligible: true }))}>Yes</button>
                  <button type="button" className={!form.rehireEligible ? 'primary-button' : 'quiet-button light'} style={{ padding: '5px 18px', fontSize: '0.78rem' }} onClick={() => setForm((cur) => ({ ...cur, rehireEligible: false }))}>No</button>
                </div>
              </div>
              <label><span>Comments (optional)</span>
                <textarea rows={2} placeholder="Any additional notes…" value={form.comments ?? ''} onChange={(e) => setForm((cur) => ({ ...cur, comments: e.target.value }))} style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.82rem', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', width: '100%' }} />
              </label>
            </div>
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
const eiQuestionnaireCategories: { key: keyof EIQuestionnaire; label: string }[] = [
  { key: 'duties',       label: 'Duties of the job' },
  { key: 'training',     label: 'Training & Development programs' },
  { key: 'advancement',  label: 'Opportunities for advancement' },
  { key: 'salary',       label: 'Salary treatment' },
  { key: 'benefits',     label: 'Benefit programs' },
  { key: 'workConditions',label: 'Working conditions' },
  { key: 'workHours',    label: 'Working hours' },
  { key: 'coworkers',    label: 'Co-workers' },
  { key: 'supervision',  label: 'Supervision' },
  { key: 'overall',      label: 'Overall, as a place to work' },
]

const invReasonsList = [
  'Insubordination',
  'Thieving, Cheating, Fraud',
  'Violation of Maldivian Law',
  'Unsatisfactory work, Poor Performance',
  'Redundancy',
  'Violation of Rules',
  'Poor Attendance',
  'Willful damage to company property',
  'Falsifying work records / employment application',
  'Abusive or threatening language to superiors',
  'Possession of narcotics or alcohol',
]

const volReasonsList = [
  'Working Hours',
  'Illness',
  'Further Studies',
  'Marriage',
  'Working Conditions',
  'Wages',
  'Other Benefits',
  'Personal Frictions',
  'Lack of Promotional Possibility',
  'End of Work Permit',
  'Inter work site transfer',
]

const eiShortQuestions: string[] = [
  'What are your primary reasons for leaving?',
  'What did you find most satisfying about your job?',
  'What did you find most frustrating about your job?',
  'Did any company policies or procedures (or any other obstacles) make your job more difficult?',
  'Would you consider returning to this company in the future?',
  'Would you recommend working for this company to your family or friends?',
  'Is there anything the company could have done to prevent you from leaving?',
  'Did your job duties turn out to be as you expected?',
  'Did you receive enough training to do your job effectively?',
  'Did you receive sufficient feedback about your performance?',
  'Did this company help you to fulfill your career goals?',
  'Were you happy with your pay, benefits and other incentives?',
  'What are your comments on accommodation, food and other areas (if any)?',
  'Before deciding to leave, did you investigate a transfer within the company?',
]

function blankQuestionnaire(): EIQuestionnaire {
  return { duties: '', training: '', advancement: '', salary: '', benefits: '', workConditions: '', workHours: '', coworkers: '', supervision: '', overall: '' }
}

/* ─── printExitInterview ─────────────────────────────────── */
function printExitInterview(record: ExitInterviewRecord) {
  const fmt = (d: string) => {
    if (!d) return '—'
    const [y, m, dd] = d.split('-')
    const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${dd} ${months[parseInt(m, 10)]} ${y}`
  }
  const chk = (val: boolean) => val ? '&#10003;' : '&#9633;'
  const invChecks = invReasonsList.map(r =>
    `<label style="display:flex;align-items:center;gap:6px;font-size:9pt;padding:2px 0;">${chk(record.involuntaryReasons.includes(r))} ${r}</label>`
  ).join('')
  const volChecks = volReasonsList.map(r =>
    `<label style="display:flex;align-items:center;gap:6px;font-size:9pt;padding:2px 0;">${chk(record.voluntaryReasons.includes(r))} ${r}</label>`
  ).join('')
  const questRows = eiQuestionnaireCategories.map(({ key, label }) => {
    const v = record.questionnaire[key]
    const vs = v === 'Very Satisfied' ? '&#10003;' : '&nbsp;'
    const s  = v === 'Satisfied'      ? '&#10003;' : '&nbsp;'
    const d  = v === 'Dissatisfied'   ? '&#10003;' : '&nbsp;'
    return `<tr><td style="padding:4px 6px;border:1px solid #ccc;font-size:9pt;">${label}</td>
      <td style="text-align:center;border:1px solid #ccc;font-size:10pt;">${vs}</td>
      <td style="text-align:center;border:1px solid #ccc;font-size:10pt;">${s}</td>
      <td style="text-align:center;border:1px solid #ccc;font-size:10pt;">${d}</td></tr>`
  }).join('')
  const qBlock = (from: number, to: number) => eiShortQuestions.slice(from - 1, to).map((q, i) => {
    const qi = `q${from + i}` as keyof ExitInterviewRecord
    const ans = record[qi] as string || ''
    return `<div style="margin-bottom:10px;">
      <div style="font-size:8.5pt;font-weight:600;color:#374151;">${from + i}. ${q}</div>
      <div style="margin-top:3px;border:1px solid #ccc;min-height:32px;padding:4px 6px;font-size:9pt;">${ans || '&nbsp;'}</div>
    </div>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Exit Interview — ${record.name}</title>
<style>
  @page { size: A4; margin: 14mm 14mm 14mm 14mm; }
  body { font-family: Arial, sans-serif; font-size: 9pt; color: #111; background: #fff; }
  .print-btn { position:fixed; top:10px; right:10px; padding:8px 18px; background:#7c3aed; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:11pt; z-index:9999; }
  @media print { .print-btn { display:none; } .page-break { page-break-before: always; } }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111; padding-bottom:6px; margin-bottom:10px; }
  .header-left { font-size:9pt; font-weight:700; }
  .header-right { font-size:9pt; text-align:right; }
  h2 { font-size:10pt; font-weight:800; margin:0 0 2px; }
  table.info { width:100%; border-collapse:collapse; margin-bottom:10px; }
  table.info td { padding:3px 6px; border:1px solid #ccc; font-size:9pt; }
  table.info td:first-child { font-weight:600; width:160px; background:#f8fafc; }
  .section-title { font-size:9pt; font-weight:800; text-transform:uppercase; letter-spacing:.05em; background:#f1f5f9; padding:4px 6px; border-left:3px solid #7c3aed; margin:12px 0 6px; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:4px 20px; }
  .col-title { font-size:8pt; font-weight:800; text-decoration:underline; margin-bottom:4px; text-transform:uppercase; }
  .quest-table { width:100%; border-collapse:collapse; margin-bottom:10px; }
  .quest-table th { padding:5px 8px; background:#f1f5f9; border:1px solid #ccc; font-size:8.5pt; }
  .quest-table th:first-child { text-align:left; }
  .sig-row { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; }
  .sig-line { border-top:1px solid #111; padding-top:4px; font-size:8pt; color:#374151; }
</style></head><body>
<button class="print-btn" onclick="window.print()">Print</button>

<!-- PAGE 1: Employee details + Reasons + Employee Comments -->
<div class="header">
  <div class="header-left"><h2>VHPL | VILLA HAKATHA PVT LTD</h2></div>
  <div class="header-right">Human Resource &amp; Administration<br/><strong>EXIT INTERVIEW</strong></div>
</div>
<table class="info">
  <tr><td>Employee Name</td><td>${record.name}</td><td>Termination Date</td><td>${fmt(record.departureDate)}</td></tr>
  <tr><td>Employee ID</td><td>${record.employeeId}</td><td>Eligible to Re-employ</td><td>${record.rehireEligible ? 'Yes' : 'No'}</td></tr>
  <tr><td>Job Title / Designation</td><td>${record.designation}</td><td>Section / Department</td><td>${record.department}</td></tr>
  <tr><td>Period of Service</td><td>${record.periodOfService || '—'}</td><td>Nationality</td><td>${record.nationality}</td></tr>
  <tr><td>Termination Type</td><td>${record.terminationType}</td><td>Interview Date</td><td>${fmt(record.interviewDate)}</td></tr>
</table>

<div class="section-title">Reasons for Resignation / Termination</div>
<div class="two-col">
  <div><div class="col-title">Involuntary</div>${invChecks}
    <div style="margin-top:4px;font-size:9pt;"><strong>Other:</strong> ${record.invOther || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</div>
  </div>
  <div><div class="col-title">Voluntary</div>${volChecks}
    <div style="margin-top:4px;font-size:9pt;"><strong>Other:</strong> ${record.volOther || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</div>
  </div>
</div>

<div class="section-title">Employee Comments</div>
<div style="border:1px solid #ccc;min-height:50px;padding:6px;font-size:9pt;">${record.employeeComments || '&nbsp;'}</div>

<!-- PAGE 2: Questionnaire + Areas to Improve + Q1-Q3 -->
<div class="page-break"></div>
<div class="header">
  <div class="header-left"><h2>VHPL | VILLA HAKATHA PVT LTD</h2></div>
  <div class="header-right">Human Resource &amp; Administration<br/><strong>EXIT INTERVIEW</strong></div>
</div>
<div class="section-title">Satisfaction Questionnaire</div>
<table class="quest-table">
  <thead><tr>
    <th style="text-align:left;width:55%;">Category</th>
    <th style="width:15%;">Very Satisfied</th>
    <th style="width:15%;">Satisfied</th>
    <th style="width:15%;">Dissatisfied</th>
  </tr></thead>
  <tbody>${questRows}</tbody>
</table>
<div style="margin-bottom:12px;">
  <div class="section-title">Areas to be Improved</div>
  <div style="border:1px solid #ccc;min-height:28px;padding:5px 6px;font-size:9pt;">${record.areasToImprove || '&nbsp;'}</div>
</div>
${qBlock(1, 3)}

<!-- PAGE 3: Q4-Q13 -->
<div class="page-break"></div>
<div class="header">
  <div class="header-left"><h2>VHPL | VILLA HAKATHA PVT LTD</h2></div>
  <div class="header-right">Human Resource &amp; Administration<br/><strong>EXIT INTERVIEW</strong></div>
</div>
${qBlock(4, 13)}

<!-- PAGE 4: Q14 + Interviewer -->
<div class="page-break"></div>
<div class="header">
  <div class="header-left"><h2>VHPL | VILLA HAKATHA PVT LTD</h2></div>
  <div class="header-right">Human Resource &amp; Administration<br/><strong>EXIT INTERVIEW</strong></div>
</div>
${qBlock(14, 14)}
<div class="section-title">Interviewer Comments</div>
<div style="border:1px solid #ccc;min-height:60px;padding:6px;font-size:9pt;">${record.interviewerComments || '&nbsp;'}</div>
<div class="sig-row" style="margin-top:24px;">
  <div>
    <div style="border-top:1px solid #111;padding-top:4px;font-size:8pt;">Employee Signature</div>
    <div style="font-size:9pt;margin-top:6px;">${record.name}</div>
  </div>
  <div>
    <div style="border-top:1px solid #111;padding-top:4px;font-size:8pt;">Interviewer Signature</div>
    <div style="font-size:9pt;margin-top:6px;">${record.interviewerName || '&nbsp;'}</div>
  </div>
</div>
<div style="margin-top:16px;font-size:8.5pt;"><strong>Date:</strong> ${fmt(record.interviewDate)}</div>
</body></html>`

  const w = window.open('', '_blank', 'width=900,height=700')
  if (w) { w.document.write(html); w.document.close() }
}

/* ─── ExitInterviewFormModal ─────────────────────────────── */
function ExitInterviewFormModal({ record, onClose, onSave }: {
  record: ExitInterviewRecord
  onClose: () => void
  onSave: (r: ExitInterviewRecord) => void
}) {
  const [form, setForm] = useState<ExitInterviewRecord>(record)

  const toggleInv = (reason: string) => setForm(p => ({
    ...p, involuntaryReasons: p.involuntaryReasons.includes(reason)
      ? p.involuntaryReasons.filter(x => x !== reason)
      : [...p.involuntaryReasons, reason],
  }))
  const toggleVol = (reason: string) => setForm(p => ({
    ...p, voluntaryReasons: p.voluntaryReasons.includes(reason)
      ? p.voluntaryReasons.filter(x => x !== reason)
      : [...p.voluntaryReasons, reason],
  }))
  const setQuestionnaire = (key: keyof EIQuestionnaire, val: EISatisfactionLevel) =>
    setForm(p => ({ ...p, questionnaire: { ...p.questionnaire, [key]: val } }))

  const fStyle: React.CSSProperties = { padding: '7px 10px', borderRadius: '7px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
  const taStyle: React.CSSProperties = { ...fStyle, resize: 'vertical', minHeight: '52px' }

  const save = (e: FormEvent) => { e.preventDefault(); onSave(form) }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal ei-form-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)', flexShrink: 0 }}>
          <div>
            <p className="eyebrow">Exit Interview</p>
            <h2>{record.name || 'New Exit Interview'}</h2>
            {record.department && <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>{record.department} · {record.designation}</p>}
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="ei-form-body">

            {/* Section 1 — Employee Details */}
            <div className="ei-form-section">
              <div className="ei-form-section-title">1 — Employee Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Employee Name</span>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={fStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Termination Date</span>
                  <input type="date" value={form.departureDate} onChange={e => setForm(p => ({ ...p, departureDate: e.target.value }))} style={fStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Employee ID</span>
                  <input value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))} style={fStyle} />
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Eligible to Re-employ</span>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="radio" name="rehire" checked={form.rehireEligible} onChange={() => setForm(p => ({ ...p, rehireEligible: true }))} /> Yes
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="radio" name="rehire" checked={!form.rehireEligible} onChange={() => setForm(p => ({ ...p, rehireEligible: false }))} /> No
                    </label>
                  </div>
                </div>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Job Title / Designation</span>
                  <input value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} style={fStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Section / Department</span>
                  <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} style={fStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Period of Service</span>
                  <input value={form.periodOfService} onChange={e => setForm(p => ({ ...p, periodOfService: e.target.value }))} placeholder="e.g. 3y 6m" style={fStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Interview Date</span>
                  <input type="date" value={form.interviewDate} onChange={e => setForm(p => ({ ...p, interviewDate: e.target.value }))} style={fStyle} />
                </label>
              </div>
            </div>

            {/* Section 2 — Reasons */}
            <div className="ei-form-section">
              <div className="ei-form-section-title">2 — Reasons for Resignation / Termination</div>
              <div className="ei-reasons-grid">
                <div>
                  <div className="ei-reason-col-title">Involuntary</div>
                  {invReasonsList.map(r => (
                    <label key={r} className="ei-reason-check">
                      <input type="checkbox" checked={form.involuntaryReasons.includes(r)} onChange={() => toggleInv(r)} />
                      {r}
                    </label>
                  ))}
                  <div style={{ marginTop: '6px' }}>
                    <label className="ei-reason-check" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Other:</span>
                      <input value={form.invOther} onChange={e => setForm(p => ({ ...p, invOther: e.target.value }))} style={{ ...fStyle, width: '100%' }} placeholder="Specify…" />
                    </label>
                  </div>
                </div>
                <div>
                  <div className="ei-reason-col-title">Voluntary</div>
                  {volReasonsList.map(r => (
                    <label key={r} className="ei-reason-check">
                      <input type="checkbox" checked={form.voluntaryReasons.includes(r)} onChange={() => toggleVol(r)} />
                      {r}
                    </label>
                  ))}
                  <div style={{ marginTop: '6px' }}>
                    <label className="ei-reason-check" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Other:</span>
                      <input value={form.volOther} onChange={e => setForm(p => ({ ...p, volOther: e.target.value }))} style={{ ...fStyle, width: '100%' }} placeholder="Specify…" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 — Employee Comments */}
            <div className="ei-form-section">
              <div className="ei-form-section-title">3 — Employee Comments</div>
              <textarea value={form.employeeComments} onChange={e => setForm(p => ({ ...p, employeeComments: e.target.value }))} style={{ ...taStyle, minHeight: '70px' }} placeholder="Employee's general comments…" />
            </div>

            {/* Section 4 — Questionnaire */}
            <div className="ei-form-section">
              <div className="ei-form-section-title">4 — Satisfaction Questionnaire</div>
              <table className="ei-quest-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Very Satisfied</th>
                    <th>Satisfied</th>
                    <th>Dissatisfied</th>
                  </tr>
                </thead>
                <tbody>
                  {eiQuestionnaireCategories.map(({ key, label }) => (
                    <tr key={key}>
                      <td>{label}</td>
                      {(['Very Satisfied', 'Satisfied', 'Dissatisfied'] as EISatisfactionLevel[]).map(opt => (
                        <td key={opt}>
                          <input
                            type="radio"
                            className="ei-quest-radio"
                            name={`q-${key}`}
                            checked={form.questionnaire[key] === opt}
                            onChange={() => setQuestionnaire(key, opt)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Areas to be Improved</span>
                  <input value={form.areasToImprove} onChange={e => setForm(p => ({ ...p, areasToImprove: e.target.value }))} style={fStyle} placeholder="Areas the employee suggests for improvement…" />
                </label>
              </div>
            </div>

            {/* Section 5 — Short Questions */}
            <div className="ei-form-section">
              <div className="ei-form-section-title">5 — Short Questions</div>
              {eiShortQuestions.map((q, i) => {
                const qKey = `q${i + 1}` as keyof ExitInterviewRecord
                return (
                  <div key={i} className="ei-question">
                    <span className="ei-question-label">{i + 1}. {q}</span>
                    <textarea
                      value={form[qKey] as string}
                      onChange={e => setForm(p => ({ ...p, [qKey]: e.target.value }))}
                    />
                  </div>
                )
              })}
            </div>

            {/* Section 6 — Interviewer */}
            <div className="ei-form-section">
              <div className="ei-form-section-title">6 — Interviewer</div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Interviewer Comments</span>
                  <textarea value={form.interviewerComments} onChange={e => setForm(p => ({ ...p, interviewerComments: e.target.value }))} style={{ ...taStyle, minHeight: '60px' }} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Interviewer Name</span>
                  <input value={form.interviewerName} onChange={e => setForm(p => ({ ...p, interviewerName: e.target.value }))} style={fStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Interview Date</span>
                  <input type="date" value={form.interviewDate} onChange={e => setForm(p => ({ ...p, interviewDate: e.target.value }))} style={fStyle} />
                </label>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-actions" style={{ flexShrink: 0, borderTop: '1px solid #e8eaf0', padding: '12px 24px' }}>
            <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
            <button className="quiet-button" type="button" onClick={() => printExitInterview(form)} style={{ marginLeft: 'auto' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print
            </button>
            <button className="primary-button" type="submit">Save</button>
          </div>
        </form>
      </section>
    </div>
  )
}

/* ─── ExitInterviewAnalyticsModal ────────────────────────── */

function ExitInterviewAnalyticsModal({ records, onClose }: { records: ExitInterviewRecord[]; onClose: () => void }) {
  const total = records.length
  const completed = records.filter(r =>
    Object.values(r.questionnaire).some(v => v !== '')
  ).length
  const rehireCount = records.filter(r => r.rehireEligible).length

  // Top voluntary reason
  const allVolReasons = useMemo(() => {
    const m: Record<string, number> = {}
    records.forEach(r => {
      r.voluntaryReasons.forEach(v => { m[v] = (m[v] ?? 0) + 1 })
      r.involuntaryReasons.forEach(v => { m[v] = (m[v] ?? 0) + 1 })
    })
    return m
  }, [records])
  const topReason = Object.entries(allVolReasons).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  // Questionnaire stacked bars
  const questStats = useMemo(() =>
    eiQuestionnaireCategories.map(({ key, label }) => {
      const vsCount = records.filter(r => r.questionnaire[key] === 'Very Satisfied').length
      const sCount  = records.filter(r => r.questionnaire[key] === 'Satisfied').length
      const dCount  = records.filter(r => r.questionnaire[key] === 'Dissatisfied').length
      const filled  = vsCount + sCount + dCount
      return { key, label, vsPct: filled ? vsCount / filled * 100 : 0, sPct: filled ? sCount / filled * 100 : 0, dPct: filled ? dCount / filled * 100 : 0, filled }
    }),
  [records])

  // Voluntary/Involuntary reason counts
  const invCounts = useMemo(() => {
    const m: Record<string, number> = {}
    records.forEach(r => r.involuntaryReasons.forEach(v => { m[v] = (m[v] ?? 0) + 1 }))
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [records])
  const volCounts = useMemo(() => {
    const m: Record<string, number> = {}
    records.forEach(r => r.voluntaryReasons.forEach(v => { m[v] = (m[v] ?? 0) + 1 }))
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [records])
  const maxInv = invCounts[0]?.[1] ?? 1
  const maxVol = volCounts[0]?.[1] ?? 1

  // Q5 (return?) and Q6 (recommend?) simple yes/no count
  const returnYes = records.filter(r => /yes|return|would/i.test(r.q5)).length
  const returnNo  = records.filter(r => /no|unlikely|not/i.test(r.q5) && !/yes/i.test(r.q5)).length
  const recYes    = records.filter(r => /yes|definitely|would/i.test(r.q6)).length
  const recNo     = records.filter(r => /no|not|unlikely/i.test(r.q6) && !/yes/i.test(r.q6)).length

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal ei-analytics-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div><p className="eyebrow">Exit Interviews</p><h2>Analytics</h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>{total} interview{total !== 1 ? 's' : ''} recorded</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        {total === 0
          ? <p style={{ padding: '24px', color: '#94a3b8', textAlign: 'center' }}>No exit interview data to analyse.</p>
          : (
            <div style={{ padding: '0 20px 20px', overflowY: 'auto', maxHeight: 'calc(85vh - 110px)' }}>
              {/* KPI row */}
              <div className="ei-stat-row" style={{ margin: '16px 0' }}>
                <div className="ei-stat ei-stat-purple"><strong>{total}</strong><span>Total</span></div>
                <div className="ei-stat ei-stat-blue"><strong>{completed}</strong><span>Completed</span></div>
                <div className="ei-stat ei-stat-green"><strong>{rehireCount}</strong><span>Rehire Eligible</span></div>
                <div className="ei-stat ei-stat-amber" style={{ fontSize: '0.72rem' }}><strong style={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>{topReason}</strong><span>Top Exit Reason</span></div>
              </div>

              {/* Satisfaction stacked bars */}
              <div className="ei-panel" style={{ marginBottom: '16px' }}>
                <h3 className="ei-panel-title">Satisfaction by Category</h3>
                {questStats.map(({ key, label, vsPct, sPct, dPct, filled }) => (
                  <div key={key} className="ei-an-stacked-row">
                    <span style={{ fontSize: '0.78rem', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                    {filled === 0
                      ? <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>No data</span>
                      : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                          <div className="ei-an-stacked-bar">
                            {vsPct > 0 && <div className="ei-an-vs" style={{ width: `${vsPct}%` }} title={`Very Satisfied: ${Math.round(vsPct)}%`} />}
                            {sPct  > 0 && <div className="ei-an-s"  style={{ width: `${sPct}%`  }} title={`Satisfied: ${Math.round(sPct)}%`} />}
                            {dPct  > 0 && <div className="ei-an-d"  style={{ width: `${dPct}%`  }} title={`Dissatisfied: ${Math.round(dPct)}%`} />}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem', color: '#6b7280' }}>
                            {vsPct > 0 && <span style={{ color: '#16a34a' }}>{Math.round(vsPct)}% VS</span>}
                            {sPct  > 0 && <span style={{ color: '#d97706' }}>{Math.round(sPct)}% S</span>}
                            {dPct  > 0 && <span style={{ color: '#dc2626' }}>{Math.round(dPct)}% D</span>}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#16a34a', display: 'inline-block' }} /> Very Satisfied</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#d97706', display: 'inline-block' }} /> Satisfied</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#dc2626', display: 'inline-block' }} /> Dissatisfied</span>
                </div>
              </div>

              {/* Exit Reasons */}
              <div className="ei-dashboard-grid" style={{ marginBottom: '16px' }}>
                <div className="ei-panel">
                  <h3 className="ei-panel-title">Involuntary Reasons</h3>
                  {invCounts.length === 0
                    ? <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>None recorded</p>
                    : invCounts.map(([reason, count]) => (
                      <div key={reason} className="ei-reason-row">
                        <span className="ei-reason-name">{reason}</span>
                        <div className="ei-reason-track"><div className="ei-reason-fill" style={{ width: `${(count / maxInv) * 100}%`, background: '#ef4444' }} /></div>
                        <span className="ei-reason-count">{count}</span>
                      </div>
                    ))}
                </div>
                <div className="ei-panel">
                  <h3 className="ei-panel-title">Voluntary Reasons</h3>
                  {volCounts.length === 0
                    ? <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>None recorded</p>
                    : volCounts.map(([reason, count]) => (
                      <div key={reason} className="ei-reason-row">
                        <span className="ei-reason-name">{reason}</span>
                        <div className="ei-reason-track"><div className="ei-reason-fill" style={{ width: `${(count / maxVol) * 100}%` }} /></div>
                        <span className="ei-reason-count">{count}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Q5/Q6 */}
              <div className="ei-dashboard-grid">
                <div className="ei-panel">
                  <h3 className="ei-panel-title">Would Return? (Q5)</h3>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="ei-stat ei-stat-green" style={{ flex: 1 }}><strong>{returnYes}</strong><span>Likely Yes</span></div>
                    <div className="ei-stat" style={{ flex: 1, background: '#fee2e2' }}><strong style={{ color: '#dc2626' }}>{returnNo}</strong><span style={{ color: '#991b1b' }}>Likely No</span></div>
                  </div>
                </div>
                <div className="ei-panel">
                  <h3 className="ei-panel-title">Would Recommend? (Q6)</h3>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="ei-stat ei-stat-green" style={{ flex: 1 }}><strong>{recYes}</strong><span>Likely Yes</span></div>
                    <div className="ei-stat" style={{ flex: 1, background: '#fee2e2' }}><strong style={{ color: '#dc2626' }}>{recNo}</strong><span style={{ color: '#991b1b' }}>Likely No</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

        <div className="modal-actions">
          <button className="quiet-button light" onClick={onClose} type="button">Close</button>
        </div>
      </section>
    </div>
  )
}

function ExitInterviewSection({ records, onUpdate }: {
  records: ExitInterviewRecord[]
  onUpdate: (fn: (prev: ExitInterviewRecord[]) => ExitInterviewRecord[]) => void
}) {
  const [monthFilter, setMonthFilter] = useState('All')
  const [deptFilter, setDeptFilter] = useState('All Sections')
  const [editing, setEditing] = useState<ExitInterviewRecord | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)

  const months = useMemo(() => {
    const keys = Array.from(new Set(records.map((r) => r.departureDate.slice(0, 7)))).sort().reverse()
    return ['All', ...keys]
  }, [records])

  const filtered = useMemo(() => records.filter((r) => {
    const mOk = monthFilter === 'All' || r.departureDate.startsWith(monthFilter)
    const dOk = deptFilter === 'All Sections' || r.department === deptFilter
    return mOk && dOk
  }), [records, monthFilter, deptFilter])

  const eiStatus = (r: ExitInterviewRecord) =>
    Object.values(r.questionnaire).some(v => v !== '') ? 'Completed' : 'Draft'

  const save = (r: ExitInterviewRecord) => {
    onUpdate((prev) => {
      const idx = prev.findIndex((x) => x.id === r.id)
      return idx >= 0 ? prev.map((x) => x.id === r.id ? r : x) : [r, ...prev]
    })
    setEditing(null)
  }

  const del = (id: string) => onUpdate((prev) => prev.filter((x) => x.id !== id))

  const exportReport = () => {
    const headers = ['ID','Employee','Designation','Section','Nationality','Departure','Type','Status','Rehire','Interviewer','InterviewDate']
    const rows = filtered.map((r) => [r.id, r.name, r.designation, r.department, r.nationality, formatDateDisplay(r.departureDate), r.terminationType, eiStatus(r), r.rehireEligible ? 'Yes' : 'No', r.interviewerName, r.interviewDate])
    downloadCsv('exit-interview-report.csv', [headers, ...rows])
  }

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
        <button className="mc-analytics-btn" type="button" onClick={() => setShowAnalytics(true)} style={{ marginLeft: 'auto' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Analytics
        </button>
        <button className="quiet-button light" type="button" onClick={exportReport}>⬇ Export</button>
      </div>

      {/* Table */}
      <div className="employee-table-shell compact-scroll">
        <table className="data-table ei-table">
          <thead>
            <tr>
              <th className="term-empid">Emp ID</th>
              <th>Name</th>
              <th>Section</th>
              <th>Departure</th>
              <th>Type</th>
              <th>Rehire</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={8} className="empty-row">No exit interview records. They are auto-created when a termination reaches the Exit Interview stage.</td></tr>
              : filtered.map((r) => {
                const status = eiStatus(r)
                return (
                  <tr key={r.id}>
                    <td className="term-empid">{r.employeeId}</td>
                    <td className="name-cell"><button className="name-link" type="button" onClick={() => setEditing(r)}>{r.name}</button></td>
                    <td>{r.department}</td>
                    <td>{formatDateDisplay(r.departureDate)}</td>
                    <td><span className="req-type-chip">{r.terminationType}</span></td>
                    <td>
                      {r.rehireEligible
                        ? <span className="doc-yes" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Yes</span>
                        : <span className="doc-no" style={{ fontSize: '0.75rem' }}>No</span>}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                        background: status === 'Completed' ? '#dcfce7' : '#fef3c7',
                        color: status === 'Completed' ? '#15803d' : '#92400e',
                      }}>{status}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="action-glyph" title="Open Form" onClick={() => setEditing(r)} type="button">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                        </button>
                        <button className="action-glyph delete" title="Delete" onClick={() => del(r.id)} type="button">🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {showAnalytics && <ExitInterviewAnalyticsModal records={filtered} onClose={() => setShowAnalytics(false)} />}
      {editing && <ExitInterviewFormModal record={editing} onClose={() => setEditing(null)} onSave={save} />}
    </>
  )
}

function TerminationPage({
  noticeTerminations,
  completedTerminations,
  exitInterviews,
  onAdd,
  onEdit,
  onSetStage,
  onDelete,
  onViewDetails,
  onUpdateExitInterviews,
}: {
  noticeTerminations: EnhancedTerminationRecord[]
  completedTerminations: CompletedTerminationRecord[]
  exitInterviews: ExitInterviewRecord[]
  onAdd: () => void
  onEdit: (record: EnhancedTerminationRecord) => void
  onSetStage: (id: string, stage: TerminationStage) => void
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
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null)
  const [viewingEI, setViewingEI] = useState<ExitInterviewRecord | null>(null)

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
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')} type="button">
            History{completedTerminations.length > 0 && <span className="tab-count">{completedTerminations.length}</span>}
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
                <thead><tr>
                  <th className="lr-expand-th" />
                  <th className="term-empid">Emp ID</th><th>Name</th><th>Section</th><th>Nationality</th>
                  <th>Date of Join</th><th>Duration</th><th>Last Working</th><th>Departure</th>
                  <th>Stage</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {noticeRows.length === 0
                    ? <tr><td colSpan={11} className="empty-row">No notice period records.</td></tr>
                    : noticeRows.map((r) => {
                      const stageIdx = allTerminationStages.indexOf(r.currentStage)
                      const isLast = stageIdx === allTerminationStages.length - 1
                      const nextStage = isLast ? null : allTerminationStages[stageIdx + 1]
                      const isExp = expandedTermId === r.id
                      return (
                        <Fragment key={r.id}>
                          <tr className={`termination-row lr-row${isExp ? ' lr-row-open' : ''}`} onClick={() => setExpandedTermId(isExp ? null : r.id)}>
                            <td className="lr-expand-td"><span className={`mc-arrow${isExp ? ' mc-arrow-open' : ''}`}>›</span></td>
                            <td className="term-empid">{r.employeeId}</td>
                            <td className="name-cell" onClick={(e) => e.stopPropagation()}><button className="name-link" onClick={() => onViewDetails(r)} type="button">{r.name}</button></td>
                            <td>{r.department}</td>
                            <td>{r.nationality}</td>
                            <td>{formatDateDisplay(r.dateOfJoin)}</td>
                            <td>{getDuration(r.dateOfJoin)}</td>
                            <td>{formatDateDisplay(r.lastWorkingDate)}</td>
                            <td>{formatDateDisplay(r.departureDate)}</td>
                            <td className="leave-status-cell termination-status-cell" onClick={(e) => e.stopPropagation()}>
                              <button
                                className={`lr-status-pill lr-step-${stageIdx}`}
                                disabled={isLast}
                                onClick={(e) => { e.stopPropagation(); if (nextStage) onSetStage(r.id, nextStage) }}
                                type="button"
                                title={isLast ? 'Pending Departure — final stage' : `Advance to: ${nextStage}`}
                              >
                                {r.currentStage}
                                {!isLast && <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4, opacity: 0.7 }}><path d="M4 2l4 4-4 4"/></svg>}
                              </button>
                            </td>
                            <td className="termination-actions" onClick={(e) => e.stopPropagation()}>
                              <div className="row-actions">
                                <button className="action-glyph" onClick={() => onViewDetails(r)} type="button" title="View">👁</button>
                                <button className="action-glyph edit" onClick={() => onEdit(r)} type="button" title="Edit">✎</button>
                                <button className="action-glyph delete" onClick={() => onDelete(r.id)} type="button" title="Delete">🗑</button>
                                {exitInterviews.some(ei => ei.employeeId === r.employeeId) && (
                                  <button className="action-glyph action-glyph-ei"
                                    onClick={() => {
                                      const ei = exitInterviews.find(x => x.employeeId === r.employeeId)
                                      if (ei) setViewingEI(ei)
                                    }}
                                    type="button" title="Exit Interview">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                      <polyline points="14 2 14 8 20 8"/>
                                      <line x1="16" y1="13" x2="8" y2="13"/>
                                      <line x1="16" y1="17" x2="8" y2="17"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isExp && (
                            <tr className="lr-pipeline-row">
                              <td colSpan={11}>
                                <div className="trn-detail-dates">
                                  <div className="trn-dd-item">
                                    <span className="trn-dd-lbl">Date Submitted</span>
                                    <span className="trn-dd-val">{formatDateDisplay(r.dateSubmitted)}</span>
                                  </div>
                                  {allTerminationStages.map((stage) => {
                                    const isDone = allTerminationStages.indexOf(stage) < stageIdx
                                    const isCurrent = stage === r.currentStage
                                    const stageDate = r.stageDates?.[stage]
                                      ?? (stage === 'Letter Submitted' ? r.dateSubmitted
                                        : stage === 'Pending Departure' ? r.departureDate
                                        : undefined)
                                    return (
                                      <div className="trn-dd-item" key={stage} style={{ opacity: isDone || isCurrent ? 1 : 0.45 }}>
                                        <span className="trn-dd-lbl">{stage}</span>
                                        <span className="trn-dd-val">{stageDate ? formatDateDisplay(stageDate) : (isDone || isCurrent ? '—' : '')}</span>
                                      </div>
                                    )
                                  })}
                                  <div className="trn-dd-item">
                                    <span className="trn-dd-lbl">Last Working</span>
                                    <span className="trn-dd-val">{formatDateDisplay(r.lastWorkingDate)}</span>
                                  </div>
                                  <div className="trn-dd-item">
                                    <span className="trn-dd-lbl">Departure</span>
                                    <span className="trn-dd-val">{formatDateDisplay(r.departureDate)}</span>
                                  </div>
                                  <div className="trn-dd-item">
                                    <span className="trn-dd-lbl">Type</span>
                                    <span className="trn-dd-val">{r.terminationType}</span>
                                  </div>
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
          </>
        )}

        {activeTab === 'history' && (
          <>
            <div className="table-toolbar leave-toolbar termination-topbar termination-topbar-completed">
              <label className="search-field"><span>Search</span><input onChange={(e) => setCompletedSearch(e.target.value)} placeholder="Employee, ID, department…" type="search" value={completedSearch} /></label>
              <label><span>Section</span><select onChange={(e) => setCompletedDepartmentFilter(e.target.value)} value={completedDepartmentFilter}>{completedDepartments.map((d) => <option key={d}>{d}</option>)}</select></label>
            </div>
            <div className="employee-table-shell compact-scroll termination-table-shell">
              <table className="data-table termination-table compact">
                <thead><tr><th className="term-empid">Emp ID</th><th>Name</th><th>Section</th><th>Nationality</th><th>Date of Join</th><th>Duration</th><th>Last Working</th><th>Departure</th><th>Type</th><th>Action</th></tr></thead>
                <tbody>
                  {completedRows.length === 0
                    ? <tr><td colSpan={10} className="empty-row">No completed departures.</td></tr>
                    : completedRows.map((r) => (
                      <tr key={r.id} className="termination-row">
                        <td className="term-empid">{r.employeeId}</td>
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
            onUpdate={onUpdateExitInterviews}
          />
        )}
      </section>
      {viewingEI && (
        <ExitInterviewFormModal
          record={viewingEI}
          onClose={() => setViewingEI(null)}
          onSave={(r) => {
            onUpdateExitInterviews(prev => {
              const idx = prev.findIndex(x => x.id === r.id)
              return idx >= 0 ? prev.map(x => x.id === r.id ? r : x) : [r, ...prev]
            })
            setViewingEI(null)
          }}
        />
      )}
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
      <section className="registration-modal incident-modal" role="dialog" aria-modal="true">
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
          <section className="registration-modal incident-modal" role="dialog" aria-modal="true">
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

function InventoryItemModal({ item, onClose, onSave }: {
  item: InventoryItem
  onClose: () => void
  onSave: (i: InventoryItem) => void
}) {
  const isNew = item.id.startsWith('INV-new')
  const [form, setForm] = useState<InventoryItem>(item)
  const set = (f: Partial<InventoryItem>) => setForm(p => ({ ...p, ...f }))
  const save = (e: FormEvent) => { e.preventDefault(); onSave({ ...form, id: isNew ? `INV-${Date.now()}` : form.id, lastUpdated: new Date().toISOString().slice(0,10) }) }
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div><p className="eyebrow">Inventory</p><h2>{isNew ? 'Add Item' : `Edit — ${form.name}`}</h2></div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <form onSubmit={save}>
          <div className="form-grid">
            <label className="full-field"><span>Item Name</span><input value={form.name} onChange={e => set({ name: e.target.value })} required placeholder="e.g. Safety Helmet" /></label>
            <label><span>Category</span>
              <select value={form.category} onChange={e => set({ category: e.target.value as InventoryCategory })}>
                {(['Stationery','Medical'] as InventoryCategory[]).map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label><span>Location</span><input value={form.location} onChange={e => set({ location: e.target.value })} placeholder="e.g. HR Storeroom" /></label>
            <label><span>Quantity</span><input type="number" value={form.quantity} min={0} onChange={e => set({ quantity: parseInt(e.target.value)||0 })} /></label>
            <label><span>Unit</span><input value={form.unit} onChange={e => set({ unit: e.target.value })} placeholder="pcs, reams, kg…" /></label>
            <label><span>Min Quantity (alert)</span><input type="number" value={form.minQuantity} min={0} onChange={e => set({ minQuantity: parseInt(e.target.value)||0 })} /></label>
            <label className="full-field"><span>Remarks</span><input value={form.remarks} onChange={e => set({ remarks: e.target.value })} placeholder="Notes, expiry, etc." /></label>
          </div>
          <div className="modal-actions">
            <button type="button" className="quiet-button light" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit">{isNew ? 'Add Item' : 'Save Changes'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function InventoryUseModal({ item, employees, onClose, onSave }: {
  item: InventoryItem
  employees: Employee[]
  onClose: () => void
  onSave: (usage: InventoryUsageRecord, updatedItem: InventoryItem) => void
}) {
  const [qty, setQty] = useState(1)
  const [empId, setEmpId] = useState('')
  const [dept, setDept] = useState(departmentsList[0])
  const [usedDate, setUsedDate] = useState(new Date().toISOString().slice(0,10))
  const [purpose, setPurpose] = useState('')
  const [remarks, setRemarks] = useState('')
  const empName = employees.find(e => e.employeeId === empId)?.fullName ?? ''
  const handleEmp = (id: string) => {
    setEmpId(id)
    const e = employees.find(x => x.employeeId === id)
    if (e) setDept(e.department)
  }
  const save = (e: FormEvent) => {
    e.preventDefault()
    if (qty > item.quantity) { alert('Quantity exceeds available stock'); return }
    const usage: InventoryUsageRecord = {
      id: `USG-${Date.now()}`, itemId: item.id, itemName: item.name, quantityUsed: qty,
      unit: item.unit, usedBy: empName || empId, employeeId: empId, department: dept,
      usedDate, purpose, remarks
    }
    const updatedItem: InventoryItem = { ...item, quantity: item.quantity - qty, lastUpdated: new Date().toISOString().slice(0,10) }
    onSave(usage, updatedItem)
  }
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div><p className="eyebrow">Record Usage</p><h2>{item.name}</h2><p style={{fontSize:'0.82rem',color:'#64748b'}}>Available: <strong>{item.quantity} {item.unit}</strong></p></div>
          <button className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <form onSubmit={save}>
          <div className="form-grid">
            <label><span>Qty Used</span><input type="number" value={qty} min={1} max={item.quantity} onChange={e => setQty(parseInt(e.target.value)||1)} required /></label>
            <label><span>Date Used</span><input type="date" value={usedDate} onChange={e => setUsedDate(e.target.value)} /></label>
            <label><span>Employee</span>
              <select value={empId} onChange={e => handleEmp(e.target.value)}>
                <option value="">— Select —</option>
                {employees.slice(0,150).map(e => <option key={e.employeeId} value={e.employeeId}>{e.fullName} ({e.employeeId})</option>)}
              </select>
            </label>
            <label><span>Section</span>
              <select value={dept} onChange={e => setDept(e.target.value)}>
                {departmentsList.map(d => <option key={d}>{d}</option>)}
              </select>
            </label>
            <label className="full-field"><span>Purpose</span><input value={purpose} onChange={e => setPurpose(e.target.value)} required placeholder="Reason for use" /></label>
            <label className="full-field"><span>Remarks</span><input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional notes" /></label>
          </div>
          <div className="modal-actions">
            <button type="button" className="quiet-button light" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit">Record Usage</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function InventoryCategoryTab({ cat, items, usage, onUpdateItems, onUpdateUsage, employees }: {
  cat: InventoryCategory
  items: InventoryItem[]
  usage: InventoryUsageRecord[]
  onUpdateItems: (fn: (prev: InventoryItem[]) => InventoryItem[]) => void
  onUpdateUsage: (fn: (prev: InventoryUsageRecord[]) => InventoryUsageRecord[]) => void
  employees: Employee[]
}) {
  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [usingItem, setUsingItem] = useState<InventoryItem | null>(null)

  const catItems = useMemo(() => items.filter(i => i.category === cat), [items, cat])
  const catItemIds = useMemo(() => new Set(catItems.map(i => i.id)), [catItems])

  const filtered = useMemo(() => catItems.filter(i => {
    const t = search.trim().toLowerCase()
    return !t || `${i.name} ${i.location}`.toLowerCase().includes(t)
  }).sort((a, b) => a.name.localeCompare(b.name)), [catItems, search])

  // Department issuance breakdown for this category
  const deptBreakdown = useMemo(() => {
    const map = new Map<string, { qty: number; times: number }>()
    usage.filter(u => catItemIds.has(u.itemId)).forEach(u => {
      const cur = map.get(u.department) ?? { qty: 0, times: 0 }
      map.set(u.department, { qty: cur.qty + u.quantityUsed, times: cur.times + 1 })
    })
    return Array.from(map.entries()).sort((a, b) => b[1].qty - a[1].qty)
  }, [usage, catItemIds])

  const maxDept = Math.max(...deptBreakdown.map(([, v]) => v.qty), 1)
  const lowStockCount = catItems.filter(i => i.quantity <= i.minQuantity).length

  const newItem = (): InventoryItem => ({
    id: 'INV-new', name: '', category: cat, quantity: 0, unit: 'pcs',
    minQuantity: 0, location: '', lastUpdated: new Date().toISOString().slice(0, 10), remarks: '',
  })

  const saveItem = (item: InventoryItem) => {
    onUpdateItems(prev => {
      const exists = prev.some(i => i.id === item.id)
      return exists ? prev.map(i => i.id === item.id ? item : i) : [...prev, item]
    })
    setEditingItem(null)
  }
  const delItem = (id: string) => onUpdateItems(prev => prev.filter(i => i.id !== id))
  const saveUsage = (usageRecord: InventoryUsageRecord, updatedItem: InventoryItem) => {
    onUpdateUsage(prev => [usageRecord, ...prev])
    onUpdateItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i))
    setUsingItem(null)
  }

  return (
    <>
      {/* KPI strip */}
      <div className="inv-kpi-row" style={{ paddingBottom: 0 }}>
        <div className="inv-kpi inv-kpi-blue"><span className="inv-kpi-num">{catItems.length}</span><span className="inv-kpi-lbl">Items</span></div>
        {lowStockCount > 0 && <div className="inv-kpi inv-kpi-red"><span className="inv-kpi-num">{lowStockCount}</span><span className="inv-kpi-lbl">Low Stock</span></div>}
        <div className="inv-kpi inv-kpi-green"><span className="inv-kpi-num">{usage.filter(u => catItemIds.has(u.itemId)).length}</span><span className="inv-kpi-lbl">Issues Recorded</span></div>
      </div>

      <div className="inv-cat-layout">
        {/* Stock table */}
        <div className="inv-cat-main">
          <div className="table-toolbar leave-toolbar-has-btn" style={{ display: 'flex', gap: 10, padding: '10px 0', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label className="search-field"><span>Search</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${cat} items…`} /></label>
            <button className="primary-button toolbar-add-btn" onClick={() => setEditingItem(newItem())} type="button">+ Add Item</button>
          </div>
          <div className="employee-table-shell compact-scroll">
            <table className="data-table inv-table">
              <thead><tr>
                <th>Item Name</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'center' }}>Unit</th>
                <th style={{ textAlign: 'center' }}>Min</th>
                <th>Location</th>
                <th style={{ textAlign: 'center' }}>Updated</th>
                <th>Remarks</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={8} className="empty-row">No {cat} items. Click "+ Add Item".</td></tr>
                  : filtered.map(item => {
                    const isLow = item.quantity <= item.minQuantity
                    return (
                      <tr key={item.id} className={isLow ? 'inv-low-stock-row' : ''}>
                        <td><strong>{item.name}</strong>{isLow && <span className="inv-low-badge">Low</span>}</td>
                        <td style={{ textAlign: 'center' }}><strong style={{ color: isLow ? '#ef4444' : '#111827' }}>{item.quantity}</strong></td>
                        <td style={{ textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ textAlign: 'center' }}>{item.minQuantity}</td>
                        <td>{item.location}</td>
                        <td style={{ textAlign: 'center' }}>{formatDateDisplay(item.lastUpdated)}</td>
                        <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.remarks || '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="row-actions request-inline-actions" style={{ justifyContent: 'center' }}>
                            <button className="action-glyph" onClick={() => setUsingItem(item)} type="button" title="Issue / Record usage" style={{ color: '#059669' }}>↓</button>
                            <button className="action-glyph edit" onClick={() => setEditingItem(item)} type="button" title="Edit">✎</button>
                            <button className="action-glyph delete" onClick={() => delItem(item.id)} type="button" title="Delete">🗑</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dept issuance sidebar */}
        {deptBreakdown.length > 0 && (
          <div className="inv-dept-panel">
            <p className="inv-dept-title">Issued to Departments</p>
            {deptBreakdown.map(([dept, val]) => (
              <div className="inv-dept-row" key={dept}>
                <div className="inv-dept-name" title={dept}>{dept}</div>
                <div className="inv-dept-track">
                  <div className="inv-dept-fill" style={{ width: `${Math.round((val.qty / maxDept) * 100)}%` }} />
                </div>
                <div className="inv-dept-meta">{val.qty} · {val.times}×</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingItem && <InventoryItemModal item={editingItem} onClose={() => setEditingItem(null)} onSave={saveItem} />}
      {usingItem && <InventoryUseModal item={usingItem} employees={employees} onClose={() => setUsingItem(null)} onSave={saveUsage} />}
    </>
  )
}

function InventorySection({ items, usage, onUpdateItems, onUpdateUsage, employees }: {
  items: InventoryItem[]
  usage: InventoryUsageRecord[]
  onUpdateItems: (fn: (prev: InventoryItem[]) => InventoryItem[]) => void
  onUpdateUsage: (fn: (prev: InventoryUsageRecord[]) => InventoryUsageRecord[]) => void
  employees: Employee[]
}) {
  const [subTab, setSubTab] = useState<'stationery' | 'medical' | 'history'>('stationery')
  const [histSearch, setHistSearch] = useState('')
  const [histDeptFilter, setHistDeptFilter] = useState('All')

  const filteredHistory = useMemo(() => {
    const t = histSearch.trim().toLowerCase()
    return usage.filter(u =>
      (!t || `${u.itemName} ${u.usedBy} ${u.department} ${u.purpose}`.toLowerCase().includes(t)) &&
      (histDeptFilter === 'All' || u.department === histDeptFilter)
    ).sort((a, b) => b.usedDate.localeCompare(a.usedDate))
  }, [usage, histSearch, histDeptFilter])

  const histDepts = useMemo(() => ['All', ...Array.from(new Set(usage.map(u => u.department))).sort()], [usage])

  const lowStock = items.filter(i => i.quantity <= i.minQuantity).length

  return (
    <section className="employee-workspace">
      {/* Sub-tabs */}
      <div className="inv-subtabs">
        <button className={subTab === 'stationery' ? 'active' : ''} onClick={() => setSubTab('stationery')} type="button">
          📋 Stationery
        </button>
        <button className={subTab === 'medical' ? 'active' : ''} onClick={() => setSubTab('medical')} type="button">
          🏥 Medical{lowStock > 0 && items.some(i => i.category === 'Medical' && i.quantity <= i.minQuantity) && <span className="tab-count" style={{ background: '#ef4444' }}>{items.filter(i => i.category === 'Medical' && i.quantity <= i.minQuantity).length}</span>}
        </button>
        <button className={subTab === 'history' ? 'active' : ''} onClick={() => setSubTab('history')} type="button">
          📋 Usage History
        </button>
      </div>

      {subTab === 'stationery' && (
        <InventoryCategoryTab cat="Stationery" items={items} usage={usage} onUpdateItems={onUpdateItems} onUpdateUsage={onUpdateUsage} employees={employees} />
      )}

      {subTab === 'medical' && (
        <InventoryCategoryTab cat="Medical" items={items} usage={usage} onUpdateItems={onUpdateItems} onUpdateUsage={onUpdateUsage} employees={employees} />
      )}

      {subTab === 'history' && (
        <>
          <div className="table-toolbar" style={{ display: 'flex', gap: 10, padding: '10px 0', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label className="search-field"><span>Search</span><input type="search" value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="Item, employee, department, purpose…" /></label>
            <label><span>Department</span>
              <select value={histDeptFilter} onChange={e => setHistDeptFilter(e.target.value)}>
                {histDepts.map(d => <option key={d}>{d}</option>)}
              </select>
            </label>
          </div>
          <div className="employee-table-shell compact-scroll">
            <table className="data-table inv-table">
              <thead><tr>
                <th style={{ textAlign: 'center' }}>Date</th>
                <th>Item</th>
                <th style={{ textAlign: 'center' }}>Category</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'center' }}>Unit</th>
                <th>Issued To (Dept)</th>
                <th>Issued By</th>
                <th>Purpose</th>
                <th>Remarks</th>
              </tr></thead>
              <tbody>
                {filteredHistory.length === 0
                  ? <tr><td colSpan={9} className="empty-row">No usage records found.</td></tr>
                  : filteredHistory.map(u => {
                    const itemCat = items.find(i => i.id === u.itemId)?.category ?? '—'
                    return (
                      <tr key={u.id}>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{formatDateDisplay(u.usedDate)}</td>
                        <td><strong>{u.itemName}</strong></td>
                        <td style={{ textAlign: 'center' }}><span className="inv-cat-badge">{itemCat}</span></td>
                        <td style={{ textAlign: 'center' }}><strong>{u.quantityUsed}</strong></td>
                        <td style={{ textAlign: 'center' }}>{u.unit}</td>
                        <td><strong>{u.department}</strong></td>
                        <td>{u.usedBy}</td>
                        <td>{u.purpose}</td>
                        <td>{u.remarks || '—'}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          {filteredHistory.length === 0 && <div className="leave-empty-zone">No usage records yet.</div>}
        </>
      )}

    </section>
  )
}

function ActivitiesPage({
  employees,
  passportHandovers,
  onUpdatePassport,
  inventoryItems,
  inventoryUsage,
  onUpdateInventoryItems,
  onUpdateInventoryUsage,
}: {
  employees: Employee[]
  passportHandovers: PassportHandoverRecord[]
  onUpdatePassport: (fn: (prev: PassportHandoverRecord[]) => PassportHandoverRecord[]) => void
  inventoryItems: InventoryItem[]
  inventoryUsage: InventoryUsageRecord[]
  onUpdateInventoryItems: (fn: (prev: InventoryItem[]) => InventoryItem[]) => void
  onUpdateInventoryUsage: (fn: (prev: InventoryUsageRecord[]) => InventoryUsageRecord[]) => void
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
        <button className={activeSection === 'inventory' ? 'active' : ''} onClick={() => setActiveSection('inventory')} type="button">Inventory</button>
      </div>
      {activeSection === 'requests' && <RequestsSection records={staffRequests} employees={employees} onUpdate={setStaffRequests} onBack={() => {}} />}
      {activeSection === 'visits' && <VisitsSection records={visitRecords} employees={employees} onUpdate={setVisitRecords} onBack={() => {}} />}
      {activeSection === 'incidents' && <IncidentsSection records={incidentRecords} employees={employees} onUpdate={setIncidentRecords} onBack={() => {}} />}
      {activeSection === 'passport' && <PassportTrackingSection records={passportHandovers} employees={employees} onUpdate={onUpdatePassport} />}
      {activeSection === 'inventory' && <InventorySection items={inventoryItems} usage={inventoryUsage} onUpdateItems={onUpdateInventoryItems} onUpdateUsage={onUpdateInventoryUsage} employees={employees} />}
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
                <div className="pending-task-top">
                  <div className="pending-task-info">
                    <span className="pending-name-text">{employee.fullName || 'Unnamed Employee'}</span>
                    <span className="pending-task-id">{employee.employeeId || 'No ID'} · {employee.department}</span>
                  </div>
                  <button className="pending-edit-btn" type="button" onClick={() => { onEdit(employee); onClose() }} title="Edit employee record">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
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
    try {
      const s = localStorage.getItem(key)
      if (!s) return fallback
      const parsed = JSON.parse(s) as T[]
      // If stored value is an empty array but we now have seed data, show seed data
      return Array.isArray(parsed) && parsed.length === 0 && fallback.length > 0 ? fallback : parsed
    } catch { return fallback }
  }

  const [employees, setEmployees] = useState<Employee[]>(() => loadStore('tic_employees', initialEmployees))
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>(() => loadStore('tic_leave_req', initialLeaveRequests))
  const [activeLeaves, setActiveLeaves] = useState<ActiveLeaveRecord[]>(() => loadStore('tic_leave_active', initialActiveLeaves))
  const [leaveHistory, setLeaveHistory] = useState<LeaveHistoryRecord[]>(() => loadStore('tic_leave_history_v2', initialLeaveHistory))
  const [passportHandovers, setPassportHandovers] = useState<PassportHandoverRecord[]>(() => loadStore('tic_passport', initialPassportHandovers))
  const [noticeTerminations, setNoticeTerminations] = useState<EnhancedTerminationRecord[]>(() => loadStore('tic_term_notice', initialNoticeTerminations))
  const [completedTerminations, setCompletedTerminations] = useState<CompletedTerminationRecord[]>(() => loadStore('tic_term_done', initialCompletedTerminations))
  const [exitInterviews, setExitInterviews] = useState<ExitInterviewRecord[]>(() => loadStore('tic_exit_interviews', initialExitInterviews))
  const [medicalCases, setMedicalCases] = useState<MedicalCaseRecord[]>(() => loadStore('tic_medical_cases', initialMedicalCases))
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => loadStore('tic_inventory_items', initialInventoryItems))
  const [inventoryUsage, setInventoryUsage] = useState<InventoryUsageRecord[]>(() => loadStore('tic_inventory_usage', initialInventoryUsage))
  const [offSiteRecords, setOffSiteRecords] = useState<OffSiteRecord[]>(() => loadStore('tic_offsite', initialOffSiteRecords))
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
  useEffect(() => { localStorage.setItem('tic_leave_history_v2', JSON.stringify(leaveHistory)) }, [leaveHistory])
  useEffect(() => { localStorage.setItem('tic_passport', JSON.stringify(passportHandovers)) }, [passportHandovers])
  useEffect(() => { localStorage.setItem('tic_term_notice', JSON.stringify(noticeTerminations)) }, [noticeTerminations])
  useEffect(() => { localStorage.setItem('tic_term_done', JSON.stringify(completedTerminations)) }, [completedTerminations])
  useEffect(() => { localStorage.setItem('tic_exit_interviews', JSON.stringify(exitInterviews)) }, [exitInterviews])
  useEffect(() => { localStorage.setItem('tic_medical_cases', JSON.stringify(medicalCases)) }, [medicalCases])
  useEffect(() => { localStorage.setItem('tic_inventory_items', JSON.stringify(inventoryItems)) }, [inventoryItems])
  useEffect(() => { localStorage.setItem('tic_inventory_usage', JSON.stringify(inventoryUsage)) }, [inventoryUsage])
  useEffect(() => { localStorage.setItem('tic_offsite', JSON.stringify(offSiteRecords)) }, [offSiteRecords])

  // Auto-sync employee siteStatus: Off Site → from offSiteRecords, On Leave → from activeLeaves
  useEffect(() => {
    const offIds    = new Set(offSiteRecords.filter(r => r.status === 'Out').map(r => r.employeeId))
    const leaveIds  = new Set(activeLeaves.map(r => r.employeeId))
    setEmployees(prev => {
      const next = prev.map(emp => {
        const computed: SiteStatus = offIds.has(emp.employeeId)
          ? 'Off Site'
          : leaveIds.has(emp.employeeId)
          ? 'On Leave'
          : 'On Site'
        return emp.siteStatus === computed ? emp : { ...emp, siteStatus: computed }
      })
      return next.some((e, i) => e !== prev[i]) ? next : prev
    })
  }, [offSiteRecords, activeLeaves])

  const resetAllData = () => {
    if (!window.confirm('This will permanently delete ALL data (employees, leave records, etc.). Are you sure?')) return
    const keys = ['tic_employees','tic_leave_req','tic_leave_active','tic_leave_history_v2','tic_passport','tic_term_notice','tic_term_done','tic_exit_interviews','tic_medical_cases','tic_inventory_items','tic_inventory_usage','tic_offsite']
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
    setInventoryItems([])
    setInventoryUsage([])
    setOffSiteRecords([])
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

  useEffect(() => {
    if (completedTerminations.length === 0) return
    const completedIds = new Set(completedTerminations.map(r => r.employeeId))
    setEmployees(prev => {
      const next = prev.filter(e => !completedIds.has(e.employeeId))
      return next.length === prev.length ? prev : next
    })
  }, [completedTerminations.length])

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

  // Auto-advance: Pending Departure → Active Leaves → Leave History based on dates
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    // Move Pending Departure requests whose departure date has arrived → Active Leaves
    setLeaveRequests(currentRequests => {
      const toActivate = currentRequests.filter(
        r => r.step === 'Pending Departure' && r.departureDate <= today
      )
      if (toActivate.length === 0) return currentRequests
      setActiveLeaves(prev => [
        ...toActivate.map(r => ({
          id: `LVA-${Date.now()}-${r.id.slice(-4)}`,
          employeeId: r.employeeId, name: r.name, department: r.department,
          nationality: r.nationality, leaveTypeCode: r.leaveTypeCode,
          departureDate: r.departureDate, returnDate: r.returnDate, days: r.days,
          remarks: r.remarks, status: 'Departed' as const,
          stepDates: r.stepDates, skipProgress: r.skipProgress,
        })),
        ...prev,
      ])
      return currentRequests.filter(r => !toActivate.find(t => t.id === r.id))
    })
    // Move Active Leaves whose return date has passed → Leave History
    setActiveLeaves(current => {
      const toHistory = current.filter(r => r.returnDate < today)
      if (toHistory.length === 0) return current
      setLeaveHistory(prev => [
        ...toHistory.map(r => ({
          id: `LVH-${Date.now()}-${r.id.slice(-4)}`,
          employeeId: r.employeeId, name: r.name, department: r.department,
          nationality: r.nationality, leaveTypeCode: r.leaveTypeCode,
          departureDate: r.departureDate, returnDate: r.returnDate, days: r.days,
          remarks: r.remarks, stepDates: r.stepDates, skipProgress: r.skipProgress,
          extensions: r.extensions, originalReturnDate: r.originalReturnDate, originalDays: r.originalDays,
        })),
        ...prev,
      ])
      return current.filter(r => !toHistory.find(t => t.id === r.id))
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const extendActiveLeave = (updated: ActiveLeaveRecord) => {
    setActiveLeaves(prev => prev.map(r => r.id === updated.id ? updated : r))
  }

  const editActiveLeave = (updated: ActiveLeaveRecord) => {
    setActiveLeaves(prev => prev.map(r => r.id === updated.id ? updated : r))
  }

  const setLeaveRequestStep = (id: string, step: LeaveRequestStep) => {
    const today = new Date().toISOString().slice(0, 10)
    setLeaveRequests((current) => current.map((record) => {
      if (record.id !== id) return record
      return {
        ...record,
        step,
        stepDates: { ...(record.stepDates ?? {}), [step]: record.stepDates?.[step] ?? today },
      }
    }))
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

  const setTerminationStage = (id: string, stage: TerminationStage) => {
    const today = new Date().toISOString().slice(0, 10)
    let targetRecord: EnhancedTerminationRecord | undefined

    setNoticeTerminations((cur) => {
      targetRecord = cur.find(r => r.id === id)
      return cur.map((r) => {
        if (r.id !== id) return r
        const dateForStage = stage === 'Letter Submitted'
          ? (r.stageDates?.['Letter Submitted'] ?? r.dateSubmitted ?? today)
          : (r.stageDates?.[stage] ?? today)
        return { ...r, currentStage: stage, stageDates: { ...(r.stageDates ?? {}), [stage]: dateForStage } }
      })
    })

    // Auto-create draft exit interview when stage reaches 'Exit Interview'
    if (stage === 'Exit Interview') {
      setTimeout(() => {
        if (!targetRecord) return
        const r = targetRecord
        setExitInterviews((prev) => {
          if (prev.some(ei => ei.employeeId === r.employeeId)) return prev
          const draft: ExitInterviewRecord = {
            id: `EI-${Date.now()}`, employeeId: r.employeeId, name: r.name,
            department: r.department, designation: r.designation, nationality: r.nationality,
            terminationType: r.terminationType, departureDate: r.departureDate,
            periodOfService: '', rehireEligible: true, interviewDate: '',
            involuntaryReasons: [], voluntaryReasons: [], invOther: '', volOther: '',
            employeeComments: '',
            questionnaire: blankQuestionnaire(),
            areasToImprove: '', q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '',
            q8: '', q9: '', q10: '', q11: '', q12: '', q13: '', q14: '',
            interviewerComments: '', interviewerName: '',
          }
          return [draft, ...prev]
        })
      }, 0)
    }
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
          {activePage === 'employees' && <EmployeesPage employees={employees} medicalCases={medicalCases} noticeTerminations={noticeTerminations} offSiteRecords={offSiteRecords} onUpdateOffSite={(fn) => setOffSiteRecords(fn)} onAdd={() => { setEmployeeMode('add'); setEmployeeForm(emptyEmployee); setShowEmployeeForm(true) }} onEdit={openEditEmployee} onExport={exportCsv} onImport={importCsv} onTemplate={downloadTemplate} onShowTasks={() => setShowPendingTasks(true)} />}
          {activePage === 'leave' && <LeavePage employees={employees} leaveRequests={leaveRequests} activeLeaves={activeLeaves} leaveHistory={leaveHistory} medicalCases={medicalCases} onAddRequest={() => { setEditingLeaveRequest(null); setShowLeaveForm(true) }} onEditRequest={(record) => { setEditingLeaveRequest(record); setShowLeaveForm(true) }} onDeleteRequest={deleteLeaveRequest} onSetRequestStep={setLeaveRequestStep} onExtendLeave={extendActiveLeave} onEditActiveLeave={editActiveLeave} onHistoryConfirm={updateHistoryConfirmation} onUpdateMedical={(fn) => setMedicalCases(fn)} />}
          {activePage === 'operations' && <OperationsPage employees={employees} completedTerminations={completedTerminations} />}
          {activePage === 'activities' && <ActivitiesPage employees={employees} passportHandovers={passportHandovers} onUpdatePassport={(fn) => setPassportHandovers(fn)} inventoryItems={inventoryItems} inventoryUsage={inventoryUsage} onUpdateInventoryItems={(fn) => setInventoryItems(fn)} onUpdateInventoryUsage={(fn) => setInventoryUsage(fn)} />}
          {activePage === 'termination' && <TerminationPage noticeTerminations={noticeTerminations} completedTerminations={completedTerminations} exitInterviews={exitInterviews} onAdd={openAddTermination} onEdit={openEditTermination} onSetStage={setTerminationStage} onDelete={deleteTermination} onViewDetails={(record) => setTerminationDetails(record)} onUpdateExitInterviews={(fn) => setExitInterviews(fn)} />}
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

