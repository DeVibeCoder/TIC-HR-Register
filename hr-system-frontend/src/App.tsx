import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, usernameToEmail } from './lib/supabase'

type Page = 'overview' | 'employees' | 'leave' | 'operations' | 'activities' | 'termination' | 'settings'
type SiteStatus = 'On Site' | 'Off Site' | 'On Leave'
type RecordStatus = 'Pending' | 'Active'
type LeaveView = 'request' | 'active' | 'history' | 'medical'
type PageSize = 50 | 100 | 'All'
type LeaveTypeCode = 'AL' | 'FRL' | 'NP' | 'PT' | 'CC'
type LeaveRequestStep = 'Letter Submitted' | 'Approved' | 'Dates Shared' | 'Ticket Booked' | 'Pending Departure'
type HistoryConfirmation = 'Returned' | 'Not Returned'

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

type PassportRecord = {
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
type PassportHandoverRecord = PassportRecord

type TripRequestStatus = 'Pending Approval' | 'Approved' | 'Rejected'
type TripType = 'One-Way' | 'Round Trip'

type TripRequest = {
  id: string
  requesterName: string
  jobTitle: string
  department: string
  departingFrom: string
  destination: string
  departureDate: string
  departureTime: string
  purpose: string
  passengers: string
  tripType: TripType
  returnDate: string
  returnTime: string
  returnTBD: boolean
  requestDate: string
  status: TripRequestStatus
  approvedDate: string
  remarks: string
}

type OpsSection = 'files' | 'induction' | 'training' | 'bank' | 'meetings'

type MeetingAttendance = 'Attended' | 'On Leave' | 'Absent'
type MeetingRep = {
  id: string
  name: string
  designation: string
  meetingDept: string
  deptCode: string
  attendance: MeetingAttendance
  reason: string
  replacementName: string
  replacementDesignation: string
  replacementId: string
}
type MeetingDeptUpdate = {
  dept: string
  points: string
}
type MeetingRecord = {
  id: string
  refNumber: string
  date: string
  timeStarted: string
  timeEnded: string
  venue: string
  chairperson: string
  reps: MeetingRep[]
  prevMeetingDate: string   // date of previous meeting for agenda item 1
  deptUpdates: MeetingDeptUpdate[]
  agendaType?: 'standard' | 'custom'
  customAgenda?: string
  reviewNotes?: string              // discussion notes for agenda item 1 (optional, backward-compat)
  additionalSectionNotes?: string   // extra ad-hoc section notes for Section Minutes
  otherMatters: string
  preparedBy: string
  approvedBy: string
  status: 'Draft' | 'Final'
  createdAt: string
}

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

type ActivitiesSection = 'requests' | 'visits' | 'incidents' | 'passport' | 'tripreq' | 'inventory'

type InventoryCategory = 'Stationery' | 'Medical' | 'Refresher'

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
  section: string
  department: string
  requestType: 'Documents' | 'Villa Metrics' | 'Yono App' | 'Wifi' | 'IT' | 'Leave' | 'Transfer' | 'Meals & Stay' | 'Other'
  priority: RequestPriority
  description: string
  submittedDate: string
  completedDate: string
  status: 'Open' | 'In Progress' | 'Resolved' | 'Rejected'
  actionTaken: string
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
  joinDate?: string
  rehireEligible: boolean
  interviewDate: string
  skipped?: boolean
  skipReason?: string
  interviewerEmployeeId?: string
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

// ── Lightweight localStorage helper (no sample-data fallback) ────────────────
function tryLoad<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[] } catch { return [] }
}

// ── Reusable delete confirmation (bottom slide-up bar) ────────────────────────
function useDeleteConfirm() {
  const [pending, setPending] = useState<{ message: string; resolve: (v: boolean) => void } | null>(null)

  const confirmDelete = (message: string): Promise<boolean> =>
    new Promise(resolve => setPending({ message, resolve }))

  const confirm = () => { pending?.resolve(true);  setPending(null) }
  const cancel  = () => { pending?.resolve(false); setPending(null) }

  const bar = pending ? (
    <div className="delete-confirm-bar" role="alertdialog">
      <span className="dcb-msg">{pending.message}</span>
      <div className="dcb-actions">
        <button className="dcb-cancel"  onClick={cancel}  type="button">Cancel</button>
        <button className="dcb-confirm" onClick={confirm} type="button">Delete</button>
      </div>
    </div>
  ) : null

  return { confirmDelete, deleteBar: bar }
}

// ── Database row ↔ TypeScript type converters ──────────────────────────────
type DbRow = Record<string, unknown>

const empFromDb = (r: DbRow): Employee => ({ employeeId: r.employee_id as string, fullName: r.full_name as string, department: r.department as string, designation: r.designation as string, nationality: r.nationality as string, nicPassportNo: r.nic_passport_no as string, workPermitNo: r.work_permit_no as string, dateOfJoin: r.date_of_join as string, mobileNo: r.mobile_no as string, dateOfBirth: r.date_of_birth as string, passportStatus: r.passport_status as string, siteStatus: r.site_status as SiteStatus, gender: (r.gender as string) || '' })
const empToDb = (e: Employee) => ({ employee_id: e.employeeId, full_name: e.fullName, department: e.department, designation: e.designation, nationality: e.nationality, nic_passport_no: e.nicPassportNo, work_permit_no: e.workPermitNo, date_of_join: e.dateOfJoin, mobile_no: e.mobileNo, date_of_birth: e.dateOfBirth, passport_status: e.passportStatus, site_status: e.siteStatus, gender: e.gender ?? '' })
// NOTE: updated_at intentionally excluded — including it caused every employee to appear
// "changed" in syncTable's JSON comparison (fresh timestamp on every call), triggering
// unnecessary upserts of the full employees table on every sync cycle.

const _leaveBase = (r: DbRow): LeaveBase => ({ id: r.id as string, employeeId: r.employee_id as string, name: r.name as string, department: r.department as string, nationality: r.nationality as string, leaveTypeCode: r.leave_type_code as LeaveTypeCode, departureDate: r.departure_date as string, returnDate: r.return_date as string, days: r.days as number, remarks: r.remarks as string })
const _leaveBaseDb = (r: LeaveBase) => ({ id: r.id, employee_id: r.employeeId, name: r.name, department: r.department, nationality: r.nationality, leave_type_code: r.leaveTypeCode, departure_date: r.departureDate, return_date: r.returnDate, days: r.days, remarks: r.remarks ?? '' })

const leaveReqFromDb = (r: DbRow): LeaveRequestRecord => ({ ..._leaveBase(r), step: r.step as LeaveRequestStep, stepDates: (r.step_dates ?? {}) as Partial<Record<LeaveRequestStep,string>>, skipProgress: r.skip_progress as boolean })
const leaveReqToDb   = (r: LeaveRequestRecord) => ({ ..._leaveBaseDb(r), step: r.step, step_dates: r.stepDates ?? {}, skip_progress: r.skipProgress ?? false })

const activeLeaveFromDb = (r: DbRow): ActiveLeaveRecord => ({ ..._leaveBase(r), status: 'Departed' as const, stepDates: (r.step_dates ?? {}) as Partial<Record<LeaveRequestStep,string>>, skipProgress: r.skip_progress as boolean, extensions: (r.extensions ?? []) as LeaveExtension[], originalReturnDate: r.original_return_date as string, originalDays: r.original_days as number })
const activeLeaveToDb   = (r: ActiveLeaveRecord) => ({ ..._leaveBaseDb(r), status: r.status, step_dates: r.stepDates ?? {}, skip_progress: r.skipProgress ?? false, extensions: r.extensions ?? [], original_return_date: r.originalReturnDate ?? '', original_days: r.originalDays ?? 0 })

const leaveHistFromDb = (r: DbRow): LeaveHistoryRecord => ({ ..._leaveBase(r), confirmation: r.confirmation as HistoryConfirmation | undefined, stepDates: (r.step_dates ?? {}) as Partial<Record<LeaveRequestStep,string>>, skipProgress: r.skip_progress as boolean, extensions: (r.extensions ?? []) as LeaveExtension[], originalReturnDate: r.original_return_date as string, originalDays: r.original_days as number })
const leaveHistToDb   = (r: LeaveHistoryRecord) => ({ ..._leaveBaseDb(r), confirmation: r.confirmation ?? '', step_dates: r.stepDates ?? {}, skip_progress: r.skipProgress ?? false, extensions: r.extensions ?? [], original_return_date: r.originalReturnDate ?? '', original_days: r.originalDays ?? 0 })

const medFromDb = (r: DbRow): MedicalCaseRecord => ({ id: r.id as string, caseDate: r.case_date as string, employeeId: r.employee_id as string, name: r.name as string, department: r.department as string, reason: r.reason as string, hospital: r.hospital as string, departTime: r.depart_time as string, returnTime: r.return_time as string, doctorAdvice: r.doctor_advice as string, mcProvided: r.mc_provided as boolean, sickLeaveFrom: r.sick_leave_from as string, sickLeaveTo: r.sick_leave_to as string, sickLeaveDays: r.sick_leave_days as number, recordedBy: r.recorded_by as string, isUrgent: r.is_urgent as boolean, isAdmitted: r.is_admitted as boolean, admittedDate: r.admitted_date as string, dischargedDate: r.discharged_date as string })
const medToDb   = (r: MedicalCaseRecord) => ({ id: r.id, case_date: r.caseDate, employee_id: r.employeeId, name: r.name, department: r.department, reason: r.reason, hospital: r.hospital, depart_time: r.departTime, return_time: r.returnTime, doctor_advice: r.doctorAdvice, mc_provided: r.mcProvided, sick_leave_from: r.sickLeaveFrom, sick_leave_to: r.sickLeaveTo, sick_leave_days: r.sickLeaveDays, recorded_by: r.recordedBy, is_urgent: r.isUrgent ?? false, is_admitted: r.isAdmitted ?? false, admitted_date: r.admittedDate ?? '', discharged_date: r.dischargedDate ?? '' })

const offSiteFromDb = (r: DbRow): OffSiteRecord => ({ id: r.id as string, employeeId: r.employee_id as string, name: r.name as string, department: r.department as string, nationality: r.nationality as string, departureDate: r.departure_date as string, returnDate: r.return_date as string, purpose: r.purpose as string, status: r.status as 'Out'|'Returned', recordedBy: r.recorded_by as string })
const offSiteToDb   = (r: OffSiteRecord) => ({ id: r.id, employee_id: r.employeeId, name: r.name, department: r.department, nationality: r.nationality, departure_date: r.departureDate, return_date: r.returnDate, purpose: r.purpose, status: r.status, recorded_by: r.recordedBy })

const noticetermFromDb = (r: DbRow): EnhancedTerminationRecord => ({ id: r.id as string, employeeId: r.employee_id as string, name: r.name as string, department: r.department as string, designation: r.designation as string, nationality: r.nationality as string, passportNo: r.passport_no as string, wpNo: r.wp_no as string, dateOfJoin: r.date_of_join as string, dateSubmitted: r.date_submitted as string, lastWorkingDate: r.last_working_date as string, departureDate: r.departure_date as string, currentStage: r.current_stage as TerminationStage, stageDates: (r.stage_dates ?? {}) as Partial<Record<TerminationStage,string>>, reasonForLeaving: r.reason_for_leaving as string, satisfactionRating: r.satisfaction_rating as number, rehireEligible: r.rehire_eligible as boolean, exitInterviewCompleted: r.exit_interview_completed as boolean, comments: r.comments as string, terminationType: r.termination_type as TerminationType })
const noticetermToDb   = (r: EnhancedTerminationRecord) => ({ id: r.id, employee_id: r.employeeId, name: r.name, department: r.department, designation: r.designation, nationality: r.nationality, passport_no: r.passportNo, wp_no: r.wpNo, date_of_join: r.dateOfJoin, date_submitted: r.dateSubmitted, last_working_date: r.lastWorkingDate, departure_date: r.departureDate, current_stage: r.currentStage, stage_dates: r.stageDates ?? {}, reason_for_leaving: r.reasonForLeaving, satisfaction_rating: r.satisfactionRating, rehire_eligible: r.rehireEligible, exit_interview_completed: r.exitInterviewCompleted, comments: r.comments, termination_type: r.terminationType })

const compTermFromDb = (r: DbRow): CompletedTerminationRecord => ({ id: r.id as string, employeeId: r.employee_id as string, name: r.name as string, department: r.department as string, designation: r.designation as string, nationality: r.nationality as string, passportNo: r.passport_no as string, wpNo: r.wp_no as string, dateOfJoin: r.date_of_join as string, lastWorkingDate: r.last_working_date as string, departureDate: r.departure_date as string, currentStage: r.current_stage as TerminationStage, rehireEligible: r.rehire_eligible as boolean, exitInterviewCompleted: r.exit_interview_completed as boolean, reasonForLeaving: r.reason_for_leaving as string, comments: r.comments as string, terminationType: r.termination_type as TerminationType })
const compTermToDb   = (r: CompletedTerminationRecord) => ({ id: r.id, employee_id: r.employeeId, name: r.name, department: r.department, designation: r.designation, nationality: r.nationality, passport_no: r.passportNo, wp_no: r.wpNo, date_of_join: r.dateOfJoin, last_working_date: r.lastWorkingDate, departure_date: r.departureDate, current_stage: r.currentStage, rehire_eligible: r.rehireEligible, exit_interview_completed: r.exitInterviewCompleted, reason_for_leaving: r.reasonForLeaving, comments: r.comments, termination_type: r.terminationType })

const exitIntFromDb = (r: DbRow): ExitInterviewRecord => ({ id: r.id as string, employeeId: r.employee_id as string, name: r.name as string, department: r.department as string, designation: r.designation as string, nationality: r.nationality as string, terminationType: r.termination_type as TerminationType, departureDate: r.departure_date as string, periodOfService: r.period_of_service as string, joinDate: r.join_date as string, rehireEligible: r.rehire_eligible as boolean, interviewDate: r.interview_date as string, skipped: r.skipped as boolean, skipReason: r.skip_reason as string, interviewerEmployeeId: r.interviewer_employee_id as string, involuntaryReasons: (r.involuntary_reasons ?? []) as string[], voluntaryReasons: (r.voluntary_reasons ?? []) as string[], invOther: r.inv_other as string, volOther: r.vol_other as string, employeeComments: r.employee_comments as string, questionnaire: (r.questionnaire ?? {}) as EIQuestionnaire, areasToImprove: r.areas_to_improve as string, q1: r.q1 as string, q2: r.q2 as string, q3: r.q3 as string, q4: r.q4 as string, q5: r.q5 as string, q6: r.q6 as string, q7: r.q7 as string, q8: r.q8 as string, q9: r.q9 as string, q10: r.q10 as string, q11: r.q11 as string, q12: r.q12 as string, q13: r.q13 as string, q14: r.q14 as string, interviewerComments: r.interviewer_comments as string, interviewerName: r.interviewer_name as string })
const exitIntToDb   = (r: ExitInterviewRecord) => ({ id: r.id, employee_id: r.employeeId, name: r.name, department: r.department, designation: r.designation, nationality: r.nationality, termination_type: r.terminationType, departure_date: r.departureDate, period_of_service: r.periodOfService, join_date: r.joinDate ?? '', rehire_eligible: r.rehireEligible, interview_date: r.interviewDate, skipped: r.skipped ?? false, skip_reason: r.skipReason ?? '', interviewer_employee_id: r.interviewerEmployeeId ?? '', involuntary_reasons: r.involuntaryReasons ?? [], voluntary_reasons: r.voluntaryReasons ?? [], inv_other: r.invOther, vol_other: r.volOther, employee_comments: r.employeeComments, questionnaire: r.questionnaire ?? {}, areas_to_improve: r.areasToImprove, q1: r.q1, q2: r.q2, q3: r.q3, q4: r.q4, q5: r.q5, q6: r.q6, q7: r.q7, q8: r.q8, q9: r.q9, q10: r.q10, q11: r.q11, q12: r.q12, q13: r.q13, q14: r.q14, interviewer_comments: r.interviewerComments, interviewer_name: r.interviewerName })

const passportFromDb = (r: DbRow): PassportRecord => ({ id: r.id as string, date: r.date as string, employeeId: r.employee_id as string, name: r.name as string, department: r.department as string, nationality: r.nationality as string, ppNo: r.pp_no as string, receivedFromHO: r.received_from_ho as string, purpose: r.purpose as string, ppIssuedToStaff: r.pp_issued_to_staff as string, ppReturnedDate: r.pp_returned_date as string, receivedBy: r.received_by as string, ppSentToHO: r.pp_sent_to_ho as string, ppHandoverPerson: r.pp_handover_person as string, ppReceivedByHO: r.pp_received_by_ho as string, remarks: r.remarks as string })
const passportToDb   = (r: PassportRecord) => ({ id: r.id, date: r.date, employee_id: r.employeeId, name: r.name, department: r.department, nationality: r.nationality, pp_no: r.ppNo, received_from_ho: r.receivedFromHO, purpose: r.purpose, pp_issued_to_staff: r.ppIssuedToStaff, pp_returned_date: r.ppReturnedDate, received_by: r.receivedBy, pp_sent_to_ho: r.ppSentToHO, pp_handover_person: r.ppHandoverPerson, pp_received_by_ho: r.ppReceivedByHO, remarks: r.remarks })

const tripReqFromDb = (r: DbRow): TripRequest => ({ id: r.id as string, requesterName: r.requester_name as string, jobTitle: r.job_title as string, department: r.department as string, departingFrom: r.departing_from as string, destination: r.destination as string, departureDate: r.departure_date as string, departureTime: r.departure_time as string, purpose: r.purpose as string, passengers: r.passengers as string, tripType: r.trip_type as TripType, returnDate: r.return_date as string, returnTime: r.return_time as string, returnTBD: r.return_tbd as boolean, requestDate: r.request_date as string, status: r.status as TripRequestStatus, approvedDate: r.approved_date as string, remarks: r.remarks as string })
const tripReqToDb   = (r: TripRequest) => ({ id: r.id, requester_name: r.requesterName, job_title: r.jobTitle, department: r.department, departing_from: r.departingFrom, destination: r.destination, departure_date: r.departureDate, departure_time: r.departureTime, purpose: r.purpose, passengers: r.passengers, trip_type: r.tripType, return_date: r.returnDate, return_time: r.returnTime, return_tbd: r.returnTBD, request_date: r.requestDate, status: r.status, approved_date: r.approvedDate, remarks: r.remarks })

const invItemFromDb = (r: DbRow): InventoryItem => ({ id: r.id as string, name: r.name as string, category: r.category as InventoryCategory, quantity: r.quantity as number, unit: r.unit as string, minQuantity: r.min_quantity as number, location: r.location as string, lastUpdated: r.last_updated as string, remarks: r.remarks as string })
const invItemToDb   = (r: InventoryItem) => ({ id: r.id, name: r.name, category: r.category, quantity: r.quantity, unit: r.unit, min_quantity: r.minQuantity, location: r.location, last_updated: r.lastUpdated, remarks: r.remarks })

const invUsageFromDb = (r: DbRow): InventoryUsageRecord => ({ id: r.id as string, itemId: r.item_id as string, itemName: r.item_name as string, quantityUsed: r.quantity_used as number, unit: r.unit as string, usedBy: r.used_by as string, employeeId: r.employee_id as string, department: r.department as string, usedDate: r.used_date as string, purpose: r.purpose as string, remarks: r.remarks as string })
const invUsageToDb   = (r: InventoryUsageRecord) => ({ id: r.id, item_id: r.itemId, item_name: r.itemName, quantity_used: r.quantityUsed, unit: r.unit, used_by: r.usedBy, employee_id: r.employeeId, department: r.department, used_date: r.usedDate, purpose: r.purpose, remarks: r.remarks })

const storeOrderFromDb = (r: DbRow): StoreOrder => ({ id: r.id as string, orderDate: r.order_date as string, orderedBy: r.ordered_by as string, orderType: r.order_type as 'Store Order'|'Bulk Request', category: r.category as InventoryCategory, items: (r.items ?? []) as StoreOrderItem[], status: r.status as 'Pending'|'Received'|'Partial', receivedDate: r.received_date as string, receivedBy: r.received_by as string, remarks: r.remarks as string })
const storeOrderToDb   = (r: StoreOrder) => ({ id: r.id, order_date: r.orderDate, ordered_by: r.orderedBy, order_type: r.orderType, category: r.category, items: r.items ?? [], status: r.status, received_date: r.receivedDate, received_by: r.receivedBy, remarks: r.remarks })

// ── Operations + Activities mappers ───────────────────────────────────────────
const personalFileFromDb = (r: DbRow): PersonalFileRecord => ({ fileNo: r.file_no as string, employeeId: r.employee_id as string, fullName: r.full_name as string, department: r.department as string, staffStatus: r.staff_status as StaffStatus, coc: r.coc as boolean, jd: r.jd as boolean, ea: r.ea as boolean, eaExpiryDate: r.ea_expiry_date as string, remarks: r.remarks as string })
const personalFileToDb   = (r: PersonalFileRecord) => ({ file_no: r.fileNo, employee_id: r.employeeId, full_name: r.fullName, department: r.department, staff_status: r.staffStatus, coc: r.coc, jd: r.jd, ea: r.ea, ea_expiry_date: r.eaExpiryDate, remarks: r.remarks })

const inductionFromDb = (r: DbRow): InductionRecord => ({ id: r.id as string, refNo: r.ref_no as string, inductionDate: r.induction_date as string, conductedBy: r.conducted_by as string, conductedByEmpId: r.conducted_by_emp_id as string, participants: (r.participants ?? []) as InductionParticipant[], inductionContent: r.induction_content as string, status: r.status as InductionRecord['status'], remarks: r.remarks as string })
const inductionToDb   = (r: InductionRecord) => ({ id: r.id, ref_no: r.refNo, induction_date: r.inductionDate, conducted_by: r.conductedBy, conducted_by_emp_id: r.conductedByEmpId ?? '', participants: r.participants ?? [], induction_content: r.inductionContent, status: r.status, remarks: r.remarks })

const trainingFromDb = (r: DbRow): TrainingRecord => ({ id: r.id as string, trainingTitle: r.training_title as string, date: r.date as string, conductedBy: r.conducted_by as string, trainingType: r.training_type as 'Internal'|'External', participants: (r.participants ?? []) as TrainingParticipant[], status: r.status as 'Completed'|'Pending', remarks: r.remarks as string })
const trainingToDb   = (r: TrainingRecord) => ({ id: r.id, training_title: r.trainingTitle, date: r.date, conducted_by: r.conductedBy, training_type: r.trainingType, participants: r.participants ?? [], status: r.status, remarks: r.remarks })

const meetingFromDb = (r: DbRow): MeetingRecord => ({ id: r.id as string, refNumber: r.ref_number as string, date: r.date as string, timeStarted: r.time_started as string, timeEnded: r.time_ended as string, venue: r.venue as string, chairperson: r.chairperson as string, reps: (r.reps ?? []) as MeetingRep[], prevMeetingDate: r.prev_meeting_date as string, deptUpdates: (r.dept_updates ?? []) as MeetingDeptUpdate[], agendaType: (r.agenda_type ?? 'standard') as 'standard'|'custom', customAgenda: r.custom_agenda as string, reviewNotes: r.review_notes as string, additionalSectionNotes: r.additional_section_notes as string, otherMatters: r.other_matters as string, preparedBy: r.prepared_by as string, approvedBy: r.approved_by as string, status: r.status as 'Draft'|'Final', createdAt: r.created_at as string })
const meetingToDb   = (r: MeetingRecord) => ({ id: r.id, ref_number: r.refNumber, date: r.date, time_started: r.timeStarted, time_ended: r.timeEnded, venue: r.venue, chairperson: r.chairperson, reps: r.reps ?? [], prev_meeting_date: r.prevMeetingDate, dept_updates: r.deptUpdates ?? [], agenda_type: r.agendaType ?? 'standard', custom_agenda: r.customAgenda ?? '', review_notes: r.reviewNotes ?? '', additional_section_notes: r.additionalSectionNotes ?? '', other_matters: r.otherMatters, prepared_by: r.preparedBy, approved_by: r.approvedBy, status: r.status, created_at: r.createdAt })

const bankAccFromDb = (r: DbRow): BankAccountRecord => ({ id: r.id as string, employeeId: r.employee_id as string, fullName: r.full_name as string, department: r.department as string, nationality: r.nationality as string, bank: r.bank as BankName, accountType: r.account_type as AccountType, scheduledDate: r.scheduled_date as string, status: r.status as AccountStatus, remarks: r.remarks as string })
const bankAccToDb   = (r: BankAccountRecord) => ({ id: r.id, employee_id: r.employeeId, full_name: r.fullName, department: r.department, nationality: r.nationality, bank: r.bank, account_type: r.accountType, scheduled_date: r.scheduledDate, status: r.status, remarks: r.remarks ?? '' })

const staffReqFromDb = (r: DbRow): StaffRequestRecord => ({ id: r.id as string, employeeId: r.employee_id as string, employeeName: r.employee_name as string, section: r.section as string, department: r.department as string, requestType: r.request_type as StaffRequestRecord['requestType'], priority: r.priority as RequestPriority, description: r.description as string, submittedDate: r.submitted_date as string, completedDate: r.completed_date as string, status: r.status as StaffRequestRecord['status'], actionTaken: r.action_taken as string })
const staffReqToDb   = (r: StaffRequestRecord) => ({ id: r.id, employee_id: r.employeeId, employee_name: r.employeeName, section: r.section, department: r.department, request_type: r.requestType, priority: r.priority, description: r.description, submitted_date: r.submittedDate, completed_date: r.completedDate, status: r.status, action_taken: r.actionTaken })

const visitFromDb = (r: DbRow): VisitRecord => ({ id: r.id as string, employeeId: r.employee_id as string, employeeName: r.employee_name as string, department: r.department as string, nicPassportNo: r.nic_passport_no as string, nationality: r.nationality as string, visitType: r.visit_type as VisitRecord['visitType'], visitDate: r.visit_date as string, status: r.status as VisitRecord['status'], remarks: r.remarks as string })
const visitToDb   = (r: VisitRecord) => ({ id: r.id, employee_id: r.employeeId, employee_name: r.employeeName, department: r.department, nic_passport_no: r.nicPassportNo, nationality: r.nationality, visit_type: r.visitType, visit_date: r.visitDate, status: r.status, remarks: r.remarks })

const incidentFromDb = (r: DbRow): IncidentRecord => ({ id: r.id as string, incidentDate: r.incident_date as string, timeOfIncident: r.time_of_incident as IncidentRecord['timeOfIncident'], employeeId: r.employee_id as string, employeeName: r.employee_name as string, reportedById: r.reported_by_id as string, reportedByName: r.reported_by_name as string, section: r.section as string, department: r.department as string, siteLocation: r.site_location as string, incidentType: r.incident_type as IncidentRecord['incidentType'], incidentSummary: r.incident_summary as string, exactLocation: r.exact_location as string, immediateCause: r.immediate_cause as string, witnessName: r.witness_name as string, witnessId: r.witness_id as string, correctiveOwner: r.corrective_owner as string, followUpDate: r.follow_up_date as string, description: r.description as string, injuryInvolved: r.injury_involved as boolean, actionTaken: r.action_taken as string, statementTaken: r.statement_taken as boolean, disciplinaryAction: r.disciplinary_action as boolean, status: r.status as IncidentRecord['status'] })
const incidentToDb   = (r: IncidentRecord) => ({ id: r.id, incident_date: r.incidentDate, time_of_incident: r.timeOfIncident, employee_id: r.employeeId, employee_name: r.employeeName, reported_by_id: r.reportedById, reported_by_name: r.reportedByName, section: r.section, department: r.department, site_location: r.siteLocation, incident_type: r.incidentType, incident_summary: r.incidentSummary ?? '', exact_location: r.exactLocation ?? '', immediate_cause: r.immediateCause ?? '', witness_name: r.witnessName ?? '', witness_id: r.witnessId ?? '', corrective_owner: r.correctiveOwner ?? '', follow_up_date: r.followUpDate ?? '', description: r.description, injury_involved: r.injuryInvolved, action_taken: r.actionTaken, statement_taken: r.statementTaken, disciplinary_action: r.disciplinaryAction, status: r.status })

// ── Supabase sync helper: upsert changed rows + delete removed rows ──────────
function syncTable<T>(
  table: string, pkField: string,
  current: T[], previous: T[],
  toDb: (item: T) => Record<string, unknown>,
  getPk: (item: T) => string,
) {
  const prevIds = new Set(previous.map(getPk))
  const changed = current.filter(item => {
    const id = getPk(item)
    const prev = previous.find(p => getPk(p) === id)
    // Always upsert new items; for existing, compare JSON to detect changes
    return !prevIds.has(id) || JSON.stringify(toDb(item)) !== JSON.stringify(prev ? toDb(prev) : null)
  })
  if (changed.length > 0) {
    supabase.from(table)
      .upsert(changed.map(toDb), { onConflict: pkField })
      .then(({ error }) => {
        if (error) console.error(`[DB] ${table} upsert error:`, error.message, error.code)
      })
  }
  const curIds = new Set(current.map(getPk))
  const delIds = previous.map(getPk).filter(id => !curIds.has(id))
  if (delIds.length) {
    supabase.from(table).delete().in(pkField, delIds)
      .then(({ error }) => {
        if (error) console.error(`[DB] ${table} delete error:`, error.message)
      })
  }
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

// HOD briefing meeting — sections with their representatives
const MEETING_DEPTS = [
  { label: 'ACCOUNTS',          code: 'ACC', appDepts: ['ACCOUNTS AND FINANCE'] },
  { label: 'ENGINEERING',       code: 'ENG', appDepts: ['ENGINEERING ADMINISTRATION','MECHANICAL','ELECTRICAL','MAINTENANCE','POWER HOUSE','POWERHOUSE','PAINTING PROJECT'] },
  { label: 'LOSS PREVENTION',   code: 'LP',  appDepts: ['LOSS PREVENTION'] },
  { label: 'HOUSEKEEPING',      code: 'HK',  appDepts: ['HOUSEKEEPING'] },
  { label: 'FOOD & BEVERAGE',   code: 'F&B', appDepts: ['KITCHEN','STAFF MESS','CAFE'] },
  { label: 'STORES',            code: 'STR', appDepts: ['STORES'] },
  { label: 'LPG PLANT',         code: 'LPG', appDepts: ['LPG PLANT','OXYGEN PLANT'] },
  { label: 'FUEL FARM',         code: 'FF',  appDepts: ['FUEL FARM'] },
  { label: 'ADMINISTRATION',    code: 'ADM', appDepts: ['ADMINISTRATION'] },
  { label: 'HUMAN RESOURCES',   code: 'HR',  appDepts: ['HUMAN RESOURCES'] },
  { label: 'CEMENT PLANT',      code: 'CP',  appDepts: ['CEMENT PLANT','ROOFING FACTORY','BATCHING PLANT'] },
] as const

// All sections shown in the headcount table (matches the PDF layout)
const HEADCOUNT_DEPTS = [
  { label: 'Accounts & Finance',  appDepts: ['ACCOUNTS AND FINANCE','ACCOUNTS','FINANCE'] },
  { label: 'Administration',      appDepts: ['ADMINISTRATION','ADMIN'] },
  { label: 'Batching Plant',      appDepts: ['BATCHING PLANT'] },
  { label: 'Cement Plant',        appDepts: ['CEMENT PLANT'] },
  { label: 'Engineering',         appDepts: ['ENGINEERING ADMINISTRATION','MECHANICAL','ELECTRICAL','MAINTENANCE','POWER HOUSE','POWERHOUSE','PAINTING PROJECT','ENGINEERING'] },
  { label: 'Fuel Farm',           appDepts: ['FUEL FARM'] },
  { label: 'Food & Beverage',     appDepts: ['KITCHEN','STAFF MESS','CAFE','FOOD AND BEVERAGE','FOOD & BEVERAGE'] },
  { label: 'Human Resource',      appDepts: ['HUMAN RESOURCE','HUMAN RESOURCES','HR'] },
  { label: 'Housekeeping',        appDepts: ['HOUSEKEEPING'] },
  { label: 'Loss Prevention',     appDepts: ['LOSS PREVENTION'] },
  { label: 'LPG & Oxygen Plant',  appDepts: ['LPG PLANT','OXYGEN PLANT','LPG'] },
  { label: 'Roofing Factory',     appDepts: ['ROOFING FACTORY','ROOFING'] },
  { label: 'Stores',              appDepts: ['STORES','STORE'] },
] as const

// Fixed HOD meeting participants — employee IDs of standing section representatives
// 35494=Accounts, 56251=Engineering HOD, 57360=Loss Prevention, 40780=Housekeeping,
// 58121=F&B HOD, 50223=Stores, 25237=LPG Plant, 34846=Fuel Farm,
// 41966=Administration/CementPlant (Ahmed Ali), 50814=Human Resources
const FIXED_PARTICIPANT_IDS = ['35494','56251','57360','40780','58121','50223','25237','34846','41966','50814']

// GM and DGM employee IDs — handled dynamically based on who chairs
const GM_ID  = '36693'  // Ali Didi — General Manager
const DGM_ID = '47149'  // Hussain Shahid — Deputy General Manager

// Chairperson options — GM chairs normally, DGM chairs when GM is absent
const CHAIRPERSON_OPTIONS = [
  { label: 'Ali Didi',       role: 'General Manager',        value: 'Ali Didi — General Manager',               approvedBy: 'ALI DIDI' },
  { label: 'Hussain Shahid', role: 'Deputy General Manager', value: 'Hussain Shahid — Deputy General Manager',  approvedBy: 'HUSSAIN SHAHID' },
]

const nationalities = ['MALDIVES', 'INDIA', 'BANGLADESH', 'SRI LANKA', 'NEPAL', 'FINLAND', 'MALAYSIA', 'PHILIPPINES', 'MYANMAR', 'PAKISTAN']

const leaveTypeOptions: Array<{ code: LeaveTypeCode; label: string }> = [
  { code: 'AL', label: 'Annual Leave' },
  { code: 'FRL', label: 'Family Responsibility Leave' },
  { code: 'NP', label: 'No Pay' },
  { code: 'PT', label: 'Paternity' },
  { code: 'CC', label: 'Circumcision' },
]

const requestSteps: LeaveRequestStep[] = ['Letter Submitted', 'Approved', 'Dates Shared', 'Ticket Booked', 'Pending Departure']

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
  // Management
  { employeeId: '36693', fullName: 'ALI DIDI', department: 'ADMINISTRATION', designation: 'GENERAL MANAGER', nationality: 'MALDIVES', nicPassportNo: 'A100001A', workPermitNo: '', dateOfJoin: '2018-01-01', mobileNo: '', dateOfBirth: '1972-06-15', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '47149', fullName: 'HUSSAIN SHAHID', department: 'ADMINISTRATION', designation: 'DEPUTY GENERAL MANAGER', nationality: 'MALDIVES', nicPassportNo: 'A100002B', workPermitNo: '', dateOfJoin: '2019-03-01', mobileNo: '', dateOfBirth: '1978-09-20', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '41966', fullName: 'AHMED ALI', department: 'ADMINISTRATION', designation: 'ADMINISTRATOR', nationality: 'MALDIVES', nicPassportNo: 'A100003C', workPermitNo: '', dateOfJoin: '2015-07-01', mobileNo: '', dateOfBirth: '1985-04-10', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  // Section heads
  { employeeId: '56251', fullName: 'ENGINEERING SECTION HEAD', department: 'ENGINEERING ADMINISTRATION', designation: 'CHIEF ENGINEER', nationality: 'INDIA', nicPassportNo: 'T2000001', workPermitNo: 'WP-56251', dateOfJoin: '2021-06-01', mobileNo: '', dateOfBirth: '1982-01-01', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '57360', fullName: 'LOSS PREVENTION SUPERVISOR', department: 'LOSS PREVENTION', designation: 'LOSS PREVENTION SUPERVISOR', nationality: 'INDIA', nicPassportNo: 'T2000002', workPermitNo: 'WP-57360', dateOfJoin: '2022-04-01', mobileNo: '', dateOfBirth: '1985-05-15', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '40780', fullName: 'HOUSEKEEPING SUPERVISOR', department: 'HOUSEKEEPING', designation: 'HOUSEKEEPING SUPERVISOR', nationality: 'INDIA', nicPassportNo: 'T2000003', workPermitNo: 'WP-40780', dateOfJoin: '2012-02-01', mobileNo: '', dateOfBirth: '1980-08-22', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '58121', fullName: 'FOOD AND BEVERAGE SUPERVISOR', department: 'KITCHEN', designation: 'FOOD & BEVERAGE SUPERVISOR', nationality: 'INDIA', nicPassportNo: 'T2000004', workPermitNo: 'WP-58121', dateOfJoin: '2023-01-15', mobileNo: '', dateOfBirth: '1986-11-05', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '25237', fullName: 'LPG PLANT SUPERVISOR', department: 'LPG PLANT', designation: 'LPG PLANT SUPERVISOR', nationality: 'INDIA', nicPassportNo: 'T2000005', workPermitNo: 'WP-25237', dateOfJoin: '2009-05-01', mobileNo: '', dateOfBirth: '1979-03-18', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '34846', fullName: 'FUEL FARM SUPERVISOR', department: 'FUEL FARM', designation: 'FUEL FARM SUPERVISOR', nationality: 'INDIA', nicPassportNo: 'T2000006', workPermitNo: 'WP-34846', dateOfJoin: '2007-09-01', mobileNo: '', dateOfBirth: '1977-07-12', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
  { employeeId: '50814', fullName: 'HUMAN RESOURCES SUPERVISOR', department: 'HUMAN RESOURCES', designation: 'HR SUPERVISOR', nationality: 'MALDIVES', nicPassportNo: 'A100004D', workPermitNo: '', dateOfJoin: '2017-11-01', mobileNo: '', dateOfBirth: '1988-12-30', passportStatus: 'Valid', siteStatus: 'On Site', gender: 'Male' },
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

const initialPassportHandovers: PassportRecord[] = [
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
]

const initialTripRequests: TripRequest[] = []

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _initialMedicalCases: MedicalCaseRecord[] = [
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

const getMaldivianNationalities = () => ['MALDIVES', 'MALDIVIAN', 'MDVS']

const getStagesForNationality = (nationality: string): TerminationStage[] => {
  const nat = nationality?.toUpperCase() ?? ''
  if (getMaldivianNationalities().some(m => nat.includes(m))) {
    return ['Letter Submitted', 'Exit Interview', 'Pending Departure'] as TerminationStage[]
  }
  return allTerminationStages
}
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
  { id: 'REQ-2026-001', employeeId: '53979', employeeName: 'NAVEEN SEKAR', section: 'STORES', department: 'THILAFUSHI INDUSTRIAL COMPLEX', requestType: 'Other', priority: 'High', description: 'Room C-14 has a broken ceiling fan and leaking roof. Requested urgent repair before monsoon season.', submittedDate: '2026-05-10', completedDate: '', status: 'In Progress', actionTaken: 'Maintenance team scheduled for 30 May' },
  { id: 'REQ-2026-002', employeeId: '50427', employeeName: 'MD SAIFUR RAHMAN', section: 'STORES', department: 'THILAFUSHI INDUSTRIAL COMPLEX', requestType: 'Documents', priority: 'High', description: 'Work permit renewal required. Current WP expires on 27 Jun 2026. Requesting HR to initiate renewal process with Immigration.', submittedDate: '2026-05-15', completedDate: '', status: 'In Progress', actionTaken: '' },
  { id: 'REQ-2026-003', employeeId: '58692', employeeName: 'SHANTUMON PATHIYIL CHACKO', section: 'HUMAN RESOURCES', department: 'THILAFUSHI INDUSTRIAL COMPLEX', requestType: 'IT', priority: 'Medium', description: 'Laptop screen flickering intermittently. Affects HR system data entry. Requesting replacement or repair.', submittedDate: '2026-04-22', completedDate: '2026-04-30', status: 'Resolved', actionTaken: 'New laptop issued on 30 April' },
  { id: 'REQ-2026-004', employeeId: '57637', employeeName: 'MUNI ACHARI GUNTI KOVALA', section: 'CAFE', department: 'THILAFUSHI INDUSTRIAL COMPLEX', requestType: 'Transfer', priority: 'Medium', description: 'Requesting department transfer to Kitchen. Have 8 years of culinary experience and believe skills are better utilised there.', submittedDate: '2026-05-08', completedDate: '2026-05-20', status: 'Rejected', actionTaken: 'Transfer declined — CAFE currently understaffed' },
  { id: 'REQ-2026-005', employeeId: '59217', employeeName: 'RAJKUMAR GUPTA', section: 'MECHANICAL', department: 'THILAFUSHI INDUSTRIAL COMPLEX', requestType: 'Leave', priority: 'Low', description: 'Requesting 2 days emergency leave on 5-6 June 2026 to handle urgent banking matters in Male.', submittedDate: '2026-05-25', completedDate: '', status: 'In Progress', actionTaken: '' },
  { id: 'REQ-2026-006', employeeId: '61245', employeeName: 'ARUSHULLA RASHID', section: 'HUMAN RESOURCES', department: 'THILAFUSHI INDUSTRIAL COMPLEX', requestType: 'IT', priority: 'Low', description: 'Requesting ergonomic chair for HR office workstation. Current chair causing back strain during extended working hours.', submittedDate: '2026-05-02', completedDate: '2026-05-14', status: 'Resolved', actionTaken: 'Ergonomic chair procured and delivered' },
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _initialOffSiteRecords: OffSiteRecord[] = []; void _initialOffSiteRecords

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _initialInventoryItems: InventoryItem[] = [
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
]
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _initialInventoryUsage: InventoryUsageRecord[] = [
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _initialStoreOrders: StoreOrder[] = [
  { id:'ORD-001', orderDate:'2026-05-05', orderedBy:'SHANTUMON PATHIYIL CHACKO', orderType:'Store Order', category:'Medical', items:[{ itemId:'MD-007', itemName:'Cotton (Absorbent)', quantity:10, unit:'rolls' }, { itemId:'MD-008', itemName:'Bandage', quantity:20, unit:'rolls' }, { itemId:'MD-009', itemName:'Plaster (Band-Aid)', quantity:5, unit:'boxes' }], status:'Received', receivedDate:'2026-05-07', receivedBy:'SHANTUMON PATHIYIL CHACKO', remarks:'Monthly medical restock' },
  { id:'ORD-002', orderDate:'2026-05-20', orderedBy:'SHANTUMON PATHIYIL CHACKO', orderType:'Store Order', category:'Stationery', items:[{ itemId:'ST-001', itemName:'A4 Paper', quantity:20, unit:'reams' }, { itemId:'ST-003', itemName:'Ball Pen (Blue)', quantity:100, unit:'pcs' }], status:'Received', receivedDate:'2026-05-22', receivedBy:'SHANTUMON PATHIYIL CHACKO', remarks:'' },
  { id:'ORD-003', orderDate:'2026-06-02', orderedBy:'SHANTUMON PATHIYIL CHACKO', orderType:'Store Order', category:'Medical', items:[{ itemId:'MD-001', itemName:'Panadol (500mg)', quantity:100, unit:'tablets' }, { itemId:'MD-012', itemName:'Sunlyte ORS Sachets', quantity:30, unit:'sachets' }], status:'Pending', receivedDate:'', receivedBy:'', remarks:'Low stock reorder' },
  { id:'ORD-004', orderDate:'2026-06-05', orderedBy:'SHANTUMON PATHIYIL CHACKO', orderType:'Bulk Request', category:'Refresher', items:[{ itemId:'RF-001', itemName:'Coffee Powder', quantity:6, unit:'tins' }, { itemId:'RF-002', itemName:'Tea Bags', quantity:4, unit:'boxes' }, { itemId:'RF-003', itemName:'Milo Powder', quantity:4, unit:'tins' }], status:'Pending', receivedDate:'', receivedBy:'', remarks:'Not available at main store — bulk purchase request' },
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
  department: 'ADMINISTRATION',
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

// Converts a 24h "HH:MM" time input into "HHMM HRS" (matches Villa Marine Transport form style)
function formatTimeHrs(time: string) {
  if (!time) return ''
  return `${time.replace(':', '')} HRS`
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

function OverviewPage({
  employees,
  leaveRequests: _leaveRequests,
  activeLeaves,
  leaveHistory: _leaveHistory,
  noticeTerminations,
  completedTerminations,
  exitInterviews: _exitInterviews,
  medicalCases,
  inventoryItems: _inventoryItems,
  passportHandovers: _passportHandovers,
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
  // ── Staff presence ───────────────────────────────────────────────────────
  const onSite    = employees.filter(e => e.siteStatus === 'On Site').length
  const offSite   = employees.filter(e => e.siteStatus === 'Off Site').length
  const onLeave   = employees.filter(e => e.siteStatus === 'On Leave').length
  const onSitePct = employees.length ? Math.round((onSite / employees.length) * 100) : 0

  // ── Employees by section ─────────────────────────────────────────────────
  const deptCounts = useMemo(() => {
    const d: Record<string, number> = {}
    employees.forEach(e => { d[e.department] = (d[e.department] ?? 0) + 1 })
    return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [employees])
  const maxDept = deptCounts[0]?.[1] ?? 1

  // ── Medical leave ────────────────────────────────────────────────────────
  const now = new Date()
  const thisMonthMed = medicalCases.filter(m => {
    if (!m.caseDate) return false
    const d = new Date(m.caseDate)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
  const urgentMed  = medicalCases.filter(m => m.isUrgent).length
  const admittedMed = medicalCases.filter(m => m.isAdmitted && !m.dischargedDate).length

  const medByDept = useMemo(() => {
    const d: Record<string, number> = {}
    medicalCases.forEach(m => { d[m.department] = (d[m.department] ?? 0) + 1 })
    return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [medicalCases])
  const maxMedDept = medByDept[0]?.[1] ?? 1

  // ── Termination stage styles ─────────────────────────────────────────────
  const stageStyle: Record<string, { color: string; bg: string }> = {
    'Letter Submitted':  { color:'#92400e', bg:'#fef3c7' },
    'Exit Interview':    { color:'#5b21b6', bg:'#ede9fe' },
    'Ticket':            { color:'#1d4ed8', bg:'#dbeafe' },
    'Pending Departure': { color:'#991b1b', bg:'#fee2e2' },
  }

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })

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
            <span className="dash-kpi-val" style={{ color:'#f59e0b' }}>{offSite}</span>
            <span className="dash-kpi-lbl">Off Site</span>
          </div>
          <div className="dash-kpi-sep" />
          <div className="dash-kpi">
            <span className="dash-kpi-val" style={{ color:'#3b82f6' }}>{onLeave}</span>
            <span className="dash-kpi-lbl">On Leave</span>
          </div>
        </div>
      </div>

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
            <div className="dash-presence-stats">
              {([
                { lbl:'Total',    val: employees.length, color:'#334155', bg:'#f8fafc' },
                { lbl:'On Site',  val: onSite,           color:'#166534', bg:'#dcfce7' },
                { lbl:'Off Site', val: offSite,          color:'#92400e', bg:'#fef3c7' },
                { lbl:'On Leave', val: onLeave,          color:'#1d4ed8', bg:'#dbeafe' },
              ] as const).map(s => (
                <div key={s.lbl} className="dash-ps-stat" style={{ background: s.bg }}>
                  <span className="dash-ps-val" style={{ color: s.color }}>{s.val}</span>
                  <span className="dash-ps-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
            <div className="dash-presence-bar">
              <div style={{ flex: onSite  || 0.01, background:'#10b981' }} title={'On Site: '  + onSite} />
              <div style={{ flex: offSite || 0.01, background:'#f59e0b' }} title={'Off Site: ' + offSite} />
              <div style={{ flex: onLeave || 0.01, background:'#3b82f6' }} title={'On Leave: ' + onLeave} />
            </div>
            <div className="dash-presence-legend">
              {([['#10b981','On Site',onSite],['#f59e0b','Off Site',offSite],['#3b82f6','On Leave',onLeave]] as const).map(([col,lbl,val]) => (
                <div key={lbl} className="dash-legend-item">
                  <span className="dash-dot" style={{ background: col }} />
                  <span className="dash-legend-val">{val}</span>
                  <span className="dash-legend-lbl">{lbl}</span>
                </div>
              ))}
            </div>
          </article>

          {/* Employees by Section */}
          <article className="dash-panel">
            <div className="dash-panel-hd">
              <span className="dash-panel-ttl">Employees by Section</span>
              <span className="dash-chip" style={{ background:'#ede9fe', color:'#6d28d9' }}>{employees.length} total</span>
            </div>
            {deptCounts.length === 0
              ? <p className="dash-empty">No employees added yet.</p>
              : <div className="dash-bars">
                  {deptCounts.map(([dept, cnt]) => (
                    <div key={dept} className="dash-bar-row">
                      <span className="dash-bar-lbl">{dept}</span>
                      <div className="dash-bar-track">
                        <div className="dash-bar-fill" style={{ width: Math.round((cnt / maxDept) * 100) + '%' }} />
                      </div>
                      <span className="dash-bar-num">{cnt}</span>
                    </div>
                  ))}
                </div>
            }
          </article>

        </div>

        {/* RIGHT COLUMN */}
        <div className="dash-col">

          {/* Active Leaves */}
          <article className="dash-panel">
            <div className="dash-panel-hd">
              <span className="dash-panel-ttl">Leave — Currently Active</span>
              <span className="dash-chip" style={{ background:'#dbeafe', color:'#1d4ed8' }}>{activeLeaves.length} on leave</span>
            </div>
            {activeLeaves.length === 0
              ? <p className="dash-empty">No staff currently on leave.</p>
              : <>
                  <div className="dash-al-head">
                    <span>Name</span><span>Section</span><span>Type</span><span>Departed</span><span>Due Back</span>
                  </div>
                  <div className="dash-al-list">
                    {activeLeaves.slice(0, 9).map(r => (
                      <div key={r.id} className="dash-al-row">
                        <span className="dash-al-name">{r.name}</span>
                        <span className="dash-al-dept">{r.department}</span>
                        <LeaveTypeBadge code={r.leaveTypeCode} />
                        <span className="dash-al-date">{formatDateDisplay(r.departureDate)}</span>
                        <span className="dash-al-date">{r.returnDate ? formatDateDisplay(r.returnDate) : '—'}</span>
                      </div>
                    ))}
                  </div>
                  {activeLeaves.length > 9 && <p className="dash-more">+{activeLeaves.length - 9} more</p>}
                </>
            }
          </article>

          {/* Medical Leave */}
          <article className="dash-panel">
            <div className="dash-panel-hd">
              <span className="dash-panel-ttl">Medical Leave</span>
              <span className="dash-chip" style={{ background:'#f0fdf4', color:'#166534' }}>{medicalCases.length} total</span>
            </div>
            <div className="dash-med-kpis">
              {([
                { lbl:'This Month', val: thisMonthMed,  color:'#0f172a',                                    bg:'#f8fafc' },
                { lbl:'Urgent',     val: urgentMed,     color: urgentMed   ? '#dc2626' : '#94a3b8',         bg: urgentMed   ? '#fef2f2' : '#f8fafc' },
                { lbl:'Admitted',   val: admittedMed,   color: admittedMed ? '#7c3aed' : '#94a3b8',         bg: admittedMed ? '#f5f3ff' : '#f8fafc' },
              ] as const).map(s => (
                <div key={s.lbl} className="dash-med-kpi" style={{ background: s.bg }}>
                  <span className="dash-med-num" style={{ color: s.color }}>{s.val}</span>
                  <span className="dash-med-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
            {medByDept.length > 0 && (
              <>
                <p className="dash-sub-lbl">Visits by Section</p>
                <div className="dash-bars">
                  {medByDept.map(([dept, cnt]) => (
                    <div key={dept} className="dash-bar-row">
                      <span className="dash-bar-lbl">{dept}</span>
                      <div className="dash-bar-track">
                        <div className="dash-bar-fill" style={{ width: Math.round((cnt / maxMedDept) * 100) + '%', background:'#0891b2' }} />
                      </div>
                      <span className="dash-bar-num" style={{ color:'#0891b2' }}>{cnt}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {medicalCases.length === 0 && <p className="dash-empty">No medical cases recorded.</p>}
          </article>

          {/* Termination — Notice Period */}
          <article className="dash-panel">
            <div className="dash-panel-hd">
              <span className="dash-panel-ttl">Termination — Notice Period</span>
              <span className="dash-chip" style={{ background:'#fef3c7', color:'#92400e' }}>{noticeTerminations.length} active</span>
            </div>
            {noticeTerminations.length === 0
              ? <p className="dash-empty">No staff in notice period.</p>
              : <div className="dash-term-detail-list">
                  {noticeTerminations.map(t => {
                    const sc = stageStyle[t.currentStage] ?? { color:'#64748b', bg:'#f8fafc' }
                    return (
                      <div key={t.id} className="dash-td-row">
                        <div className="dash-td-info">
                          <span className="dash-td-name">{t.name}</span>
                          <span className="dash-td-meta">{t.designation} · {t.department}</span>
                        </div>
                        <div className="dash-td-right">
                          <span className="dash-td-badge" style={{ color: sc.color, background: sc.bg }}>{t.currentStage}</span>
                          {t.lastWorkingDate && <span className="dash-td-lwd">LWD {formatDateDisplay(t.lastWorkingDate)}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
            <div className="dash-term-footer">{'✓ ' + completedTerminations.length + ' completed'}</div>
          </article>

        </div>
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
            <label><span>Section</span>
              <select value={form.department} onChange={(e) => update('department', e.target.value)}>
                <option value="">Select section…</option>
                {departmentsList.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
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
              <button className="primary-button vwh" onClick={() => setShowAdd(true)} type="button">+ Add Off Site</button>
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
                              <button className="os-return-btn vwh" onClick={() => markReturned(r.id)} type="button" title="Mark returned today">↩ Return</button>
                              <button className="action-glyph edit vwh" onClick={() => editingId === r.id ? setEditingId(null) : openEdit(r)} type="button" title="Edit">✎</button>
                              <button className="action-glyph delete vwh" onClick={() => del(r.id)} type="button" title="Delete">🗑</button>
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
                                <button className="action-glyph edit vwh" onClick={() => editingId === r.id ? setEditingId(null) : openEdit(r)} type="button" title="Edit">✎</button>
                                <button className="action-glyph delete vwh" onClick={() => del(r.id)} type="button" title="Delete">🗑</button>
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

function EmployeesPage({ employees, onAdd, onEdit, onDelete, onExport, onImport, onTemplate, onShowTasks, medicalCases, noticeTerminations, offSiteRecords, onUpdateOffSite }: {
  employees: Employee[]
  onAdd: () => void
  onEdit: (employee: Employee) => void
  onDelete: (employeeId: string) => void
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
            <button className="primary-button vwh" onClick={onTemplate} type="button">Template</button>
            <button className="primary-button vwh" onClick={onImport} type="button">Import</button>
          </div>
          <div className="table-actions-right">
            <button className="primary-button" onClick={onShowTasks} type="button">
              Pending Tasks{pendingCount > 0 && <span className="pending-count-badge" style={{ marginLeft: '6px' }}>{pendingCount}</span>}
            </button>
            <button className="primary-button" onClick={() => setShowOffSite(true)} type="button">
              Off Site{offSiteRecords.filter(r => r.status === 'Out').length > 0 && <span className="pending-count-badge" style={{ marginLeft: '6px' }}>{offSiteRecords.filter(r => r.status === 'Out').length}</span>}
            </button>
            <button className="primary-button" onClick={onExport} type="button">Export</button>
            <button className="primary-button vwh" onClick={onAdd} type="button">Add Employee</button>
          </div>
        </div>
        <div className="table-toolbar employee-toolbar">
          <label className="search-field"><span>Search</span><input onChange={(event) => setFilter(setQuery, event.target.value)} placeholder="Name, ID, section, designation, passport, permit..." type="text" value={query} /></label>
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
                  <td>
                    <div className="row-actions">
                      <button className="action-glyph edit vwh" onClick={() => onEdit(employee)} type="button" title="Edit">✎</button>
                      <button className="action-glyph delete vwh" onClick={() => onDelete(employee.employeeId)} type="button" title="Delete employee">🗑</button>
                    </div>
                  </td>
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
  record, employees, onClose, onSave,
}: {
  record: PassportRecord
  employees: Employee[]
  onClose: () => void
  onSave: (r: PassportRecord) => void
}) {
  const isNew = record.id.startsWith('PP-new')
  const [empSearch, setEmpSearch] = useState(record.name ? (record.employeeId ? `${record.name} (${record.employeeId})` : record.name) : '')
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
    setEmpSearch(`${e.fullName} (${e.employeeId})`)
    setShowEmpDrop(false)
  }

  const save = () => onSave({ ...record,
    id: isNew ? `PP-${Date.now()}` : record.id,
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
            <label><span>Full Name</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Employee full name" /></label>
            <label><span>Section / Department</span>
              <select value={dept} onChange={e=>setDept(e.target.value)}>
                <option value="">Select section…</option>
                {departmentsList.map(d=><option key={d}>{d}</option>)}
              </select>
            </label>
            <label><span>Nationality</span>
              <select value={nat} onChange={e=>setNat(e.target.value)}>
                <option value="">Select nationality…</option>
                {nationalities.map(n=><option key={n}>{n}</option>)}
              </select>
            </label>
            <label><span>Passport / PP No</span><input value={ppNo} onChange={e=>setPpNo(e.target.value)} placeholder="Passport number" /></label>
            <label><span>Entry Date</span><input type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>
            <label><span>Purpose</span>
              <select value={purpose} onChange={e=>setPurpose(e.target.value)}>
                {['AL','New Staff','Embassy','Other'].map(p=><option key={p}>{p}</option>)}
              </select>
            </label>
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
}
function PassportTrackingSection({ records, employees, onUpdate }: {
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
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, Emp ID, PP No" />
        </label>
        <label style={{ flex:'0 0 auto' }}>
          <span>Purpose</span>
          <select value={purpose} onChange={e=>setPurpose(e.target.value)}>
            {['All','AL','New Staff','Embassy','Other'].map(p=><option key={p}>{p}</option>)}
          </select>
        </label>
        <button className="primary-button vwh" onClick={()=>setEditing(newRec())} type="button">+ Add Record</button>
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
                      <button className="action-glyph edit vwh"   onClick={()=>setEditing(r)}  type="button" title="Edit">✎</button>
                      <button className="action-glyph delete vwh" onClick={()=>del(r.id)}      type="button" title="Delete">🗑</button>
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
}

function TripRequestModal({ record, employees, onClose, onSave }: {
  record: TripRequest
  employees: Employee[]
  onClose: () => void
  onSave: (r: TripRequest) => void
}) {
  const isNew = record.id === 'TR-new'
  const [empSearch,      setEmpSearch]      = useState(record.requesterName || '')
  const [showEmpDrop,    setShowEmpDrop]    = useState(false)
  const [requesterName,  setRequesterName]  = useState(record.requesterName)
  const [jobTitle,       setJobTitle]       = useState(record.jobTitle)
  const [department,     setDepartment]     = useState(record.department)
  const [departingFrom,  setDepartingFrom]  = useState(record.departingFrom)
  const [destination,    setDestination]    = useState(record.destination)
  const [departureDate,  setDepartureDate]  = useState(record.departureDate || new Date().toISOString().slice(0,10))
  const [departureTime,  setDepartureTime]  = useState(record.departureTime)
  const [purpose,        setPurpose]        = useState(record.purpose)
  const [passengers,     setPassengers]     = useState(record.passengers || '1')
  const [tripType,       setTripType]       = useState<TripType>(record.tripType || 'One-Way')
  const [returnDate,     setReturnDate]     = useState(record.returnDate)
  const [returnTime,     setReturnTime]     = useState(record.returnTime)
  const [returnTBD,      setReturnTBD]      = useState(record.returnTBD || false)
  const [requestDate,    setRequestDate]    = useState(record.requestDate || new Date().toISOString().slice(0,10))
  const [remarks,        setRemarks]        = useState(record.remarks)

  const empResults = useMemo(() => {
    const q = empSearch.trim().toLowerCase()
    if (!q || q.includes('(')) return []
    return employees.filter(e => e.fullName.toLowerCase().includes(q) || e.employeeId.includes(q)).slice(0, 8)
  }, [empSearch, employees])

  const pickEmp = (e: Employee) => {
    setRequesterName(e.fullName); setJobTitle(e.designation); setDepartment(e.department)
    setEmpSearch(`${e.fullName} (${e.employeeId})`)
    setShowEmpDrop(false)
  }

  const save = () => onSave({ ...record,
    id: isNew ? `TR-${Date.now()}` : record.id,
    requesterName, jobTitle, department,
    departingFrom, destination, departureDate, departureTime,
    purpose, passengers, tripType,
    returnDate: tripType === 'Round Trip' && !returnTBD ? returnDate : '',
    returnTime: tripType === 'Round Trip' && !returnTBD ? returnTime : '',
    returnTBD: tripType === 'Round Trip' ? returnTBD : false,
    requestDate, remarks,
    status: record.status || 'Pending Approval',
    approvedDate: record.approvedDate || '',
  })

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal pp-modal tr-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div><p className="eyebrow">Trip Requisition</p><h2>{isNew ? 'New Trip Request' : 'Edit Trip Request'}</h2></div>
          <button className="icon-button" onClick={onClose} type="button">✕</button>
        </div>

        {/* Requester Details */}
        <div className="pp-modal-section">
          <div className="pp-modal-section-label tr-req-label">🧑 Requester Details</div>
          <div className="pp-modal-grid">
            <label><span>Full Name</span><input value={requesterName} onChange={e=>setRequesterName(e.target.value)} placeholder="Full name" /></label>
            <label><span>Job Title / Designation</span><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="e.g. HR Officer" /></label>
            <label><span>Department / Section</span>
              <select value={department} onChange={e=>setDepartment(e.target.value)}>
                <option value="">Select section…</option>
                {departmentsList.map(d=><option key={d}>{d}</option>)}
              </select>
            </label>
            <label><span>Business Unit</span><input value="VHPL — Thilafushi Industrial Complex" readOnly style={{ color:'#64748b', background:'#f8fafc' }} /></label>
            <label className="ef-span2" style={{ position:'relative' }}>
              <span>Quick-fill from Employee Directory <em style={{ fontWeight:400, textTransform:'none', fontSize:'0.72rem', color:'#94a3b8' }}>(optional — auto-fills fields above)</em></span>
              <input value={empSearch} onChange={e => { setEmpSearch(e.target.value); setShowEmpDrop(true) }}
                onFocus={() => setShowEmpDrop(true)} onBlur={() => setTimeout(()=>setShowEmpDrop(false),150)}
                placeholder="Search by name or employee ID…" autoComplete="off" />
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
          </div>
        </div>

        {/* Trip Details */}
        <div className="pp-modal-section tr-trip-section">
          <div className="pp-modal-section-label tr-trip-label">⛴ Trip Details</div>
          <div className="pp-modal-grid">
            <label><span>Departing From</span><input value={departingFrom} onChange={e=>setDepartingFrom(e.target.value)} placeholder="e.g. Airport / Hulhumale" /></label>
            <label><span>Destination</span><input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="e.g. Thilafushi" /></label>
            <label><span>Departure Date</span><input type="date" value={departureDate} onChange={e=>setDepartureDate(e.target.value)} /></label>
            <label><span>Departure Time</span><input type="time" value={departureTime} onChange={e=>setDepartureTime(e.target.value)} /></label>
            <label className="ef-span2"><span>Purpose of Trip</span><input value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="e.g. Escorting staff to airport" /></label>
            <label><span>No. of Passengers</span><input type="number" min="1" value={passengers} onChange={e=>setPassengers(e.target.value)} /></label>
            <label><span>Trip to be Invoiced to</span><input value="VHPL" readOnly style={{ color:'#64748b', background:'#f8fafc' }} /></label>
          </div>
        </div>

        {/* Trip Type */}
        <div className="pp-modal-section tr-type-section">
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <div className="pp-modal-section-label tr-type-label" style={{ marginBottom:0 }}>↔ Trip Type</div>
            <div className="tr-type-toggle">
              <button type="button" className={tripType==='One-Way' ? 'active' : ''} onClick={()=>setTripType('One-Way')}>One-Way</button>
              <button type="button" className={tripType==='Round Trip' ? 'active' : ''} onClick={()=>setTripType('Round Trip')}>Round Trip</button>
            </div>
          </div>
          {tripType === 'Round Trip' && (
            <div className="pp-modal-grid" style={{ marginTop:10 }}>
              <label className="tr-tbd-check ef-span2">
                <input type="checkbox" checked={returnTBD} onChange={e=>setReturnTBD(e.target.checked)} />
                <span>Return date/time not yet confirmed — mark as TBD</span>
              </label>
              {!returnTBD && (
                <>
                  <label><span>Return Date</span><input type="date" value={returnDate} onChange={e=>setReturnDate(e.target.value)} /></label>
                  <label><span>Return Time</span><input type="time" value={returnTime} onChange={e=>setReturnTime(e.target.value)} /></label>
                </>
              )}
            </div>
          )}
        </div>

        {/* Request Info */}
        <div className="pp-modal-section">
          <div className="pp-modal-section-label">📋 Request Information</div>
          <div className="pp-modal-grid">
            <label><span>Request Date</span><input type="date" value={requestDate} onChange={e=>setRequestDate(e.target.value)} /></label>
            <label><span>Requested By</span><input value={requesterName} readOnly style={{ color:'#64748b', background:'#f8fafc' }} /></label>
            <label className="ef-span2"><span>Remarks / Additional Notes</span><input value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Any special instructions or notes for VMT…" /></label>
          </div>
        </div>

        <div className="modal-actions">
          <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
          <button className="primary-button" onClick={save} type="button">{isNew ? 'Submit Request' : 'Save Changes'}</button>
        </div>
      </section>
    </div>
  )
}

function TripReqSection({ records, employees, onUpdate, currentUserName = '' }: {
  records: TripRequest[]
  employees: Employee[]
  onUpdate: (fn: (prev: TripRequest[]) => TripRequest[]) => void
  currentUserName?: string
}) {
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editing,      setEditing]      = useState<TripRequest | null>(null)
  const [approving,    setApproving]    = useState<TripRequest | null>(null)
  const [sigRequester, setSigRequester] = useState<string>(() => localStorage.getItem('tic_sig_requester') || '')
  const [sigAhmedAli,  setSigAhmedAli]  = useState<string>(() => localStorage.getItem('tic_sig_ahmedali') || '')

  const filtered = useMemo(() => records.filter(r => {
    const txt = [r.requesterName, r.department, r.departingFrom, r.destination, r.purpose].join(' ').toLowerCase()
    return txt.includes(search.trim().toLowerCase()) && (statusFilter === 'All' || r.status === statusFilter)
  }).sort((a,b) => b.requestDate.localeCompare(a.requestDate)), [records, search, statusFilter])

  const save = (r: TripRequest) => {
    onUpdate(prev => prev.some(x=>x.id===r.id) ? prev.map(x=>x.id===r.id?r:x) : [r, ...prev])
    setEditing(null)
  }
  const del = (id: string) => { if (window.confirm('Delete this trip request?')) onUpdate(prev=>prev.filter(r=>r.id!==id)) }

  const newRec = (): TripRequest => {
    const emp = employees.find(e => e.fullName === currentUserName)
    return {
      id:'TR-new',
      requesterName: emp?.fullName ?? currentUserName,
      jobTitle: emp?.designation ?? '',
      department: emp?.department ?? '',
      departingFrom:'', destination:'',
      departureDate:new Date().toISOString().slice(0,10), departureTime:'',
      purpose:'', passengers:'1', tripType:'One-Way', returnDate:'', returnTime:'', returnTBD:false,
      requestDate:new Date().toISOString().slice(0,10), status:'Pending Approval', approvedDate:'', remarks:'',
    }
  }

  const approve = () => {
    if (!approving) return
    onUpdate(prev => prev.map(r => r.id===approving.id ? { ...r, status:'Approved', approvedDate:new Date().toISOString().slice(0,10) } : r))
    setApproving(null)
  }
  const reject = (r: TripRequest) => {
    if (window.confirm(`Reject the trip request from ${r.requesterName || 'this requester'}?`))
      onUpdate(prev => prev.map(x => x.id===r.id ? { ...x, status:'Rejected' } : x))
  }

  const handleSigUpload = (which: 'requester'|'ahmedali', file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      if (which === 'requester') { setSigRequester(dataUrl); localStorage.setItem('tic_sig_requester', dataUrl) }
      else { setSigAhmedAli(dataUrl); localStorage.setItem('tic_sig_ahmedali', dataUrl) }
    }
    reader.readAsDataURL(file)
  }

  const statCards = [
    { label:'Total',    val: records.length,                                              c:'#475569', bg:'#f8fafc' },
    { label:'Pending',  val: records.filter(r=>r.status==='Pending Approval').length,     c:'#d97706', bg:'#fef3c7' },
    { label:'Approved', val: records.filter(r=>r.status==='Approved').length,             c:'#16a34a', bg:'#dcfce7' },
    { label:'Rejected', val: records.filter(r=>r.status==='Rejected').length,             c:'#dc2626', bg:'#fef2f2' },
  ]

  return (
    <section className="employee-workspace tr-workspace">

      <div className="pp-stat-strip" style={{ gridTemplateColumns:'repeat(4, 1fr)' }}>
        {statCards.map(s => (
          <div key={s.label} className="pp-stat-card" style={{ background:s.bg }}>
            <span style={{ fontSize:'1.4rem', fontWeight:800, color:s.c, lineHeight:1 }}>{s.val}</span>
            <span style={{ fontSize:'0.67rem', color:'#64748b', marginTop:2 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="table-toolbar" style={{ display:'grid', gridTemplateColumns:'1fr auto auto', alignItems:'end', gap:'8px', padding:'8px 0 6px' }}>
        <label className="search-field">
          <span>Search</span>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Requester, route, purpose" />
        </label>
        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            {['All','Pending Approval','Approved','Rejected'].map(s=><option key={s}>{s}</option>)}
          </select>
        </label>
        <button className="primary-button vwh toolbar-add-btn" onClick={()=>setEditing(newRec())} type="button" style={{ padding:'0 14px', height:34, fontSize:'0.8rem', whiteSpace:'nowrap' }}>+ New Trip Request</button>
      </div>

      <div className="employee-table-shell compact-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ whiteSpace:'nowrap' }}>Request Date</th>
              <th>Requester</th>
              <th>Department</th>
              <th>Route</th>
              <th style={{ whiteSpace:'nowrap' }}>Departure</th>
              <th style={{ textAlign:'center' }}>Type</th>
              <th style={{ textAlign:'center' }}>Pax</th>
              <th style={{ textAlign:'center' }}>Status</th>
              <th style={{ textAlign:'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={9} className="empty-row">No trip requests found. Click "+ New Trip Request" to get started.</td></tr>
              : filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ whiteSpace:'nowrap', fontSize:'0.8rem' }}>{formatDateDisplay(r.requestDate)}</td>
                  <td style={{ fontWeight:600 }}>{r.requesterName || '—'}</td>
                  <td style={{ color:'#64748b', fontSize:'0.78rem' }}>{r.department || '—'}</td>
                  <td style={{ whiteSpace:'nowrap' }}>{r.departingFrom || '—'} → {r.destination || '—'}</td>
                  <td style={{ whiteSpace:'nowrap', fontSize:'0.8rem' }}>
                    {formatDateDisplay(r.departureDate)}{r.departureTime ? ` · ${formatTimeHrs(r.departureTime)}` : ''}
                  </td>
                  <td style={{ textAlign:'center', whiteSpace:'nowrap' }}><span className="req-type-chip">{r.tripType}</span></td>
                  <td style={{ textAlign:'center' }}>{r.passengers || '—'}</td>
                  <td style={{ textAlign:'center' }}><StatusBadge status={r.status} /></td>
                  <td style={{ textAlign:'center' }}>
                    <div className="row-actions">
                      {r.status === 'Pending Approval' && <button className="action-glyph approve vwh" title="Approve" onClick={()=>setApproving(r)} type="button">✓</button>}
                      {r.status === 'Pending Approval' && <button className="action-glyph delete vwh" title="Reject" onClick={()=>reject(r)} type="button">✕</button>}
                      <button className="action-glyph edit vwh" title="Edit" onClick={()=>setEditing(r)} type="button">✎</button>
                      <button className="action-glyph print" title="Print" onClick={()=>printTripRequest(r, sigRequester, sigAhmedAli)} type="button">🖶</button>
                      <button className="action-glyph delete vwh" title="Delete" onClick={()=>del(r.id)} type="button">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Signature management (admin / non-viewer only) */}
      <div className="tr-sig-panel vwh">
        <div className="tr-sig-hd">🖋 Print Signatures</div>
        <p className="tr-sig-note">Upload each signature once — they will be embedded automatically on approved trip request printouts.</p>
        <div className="tr-sig-grid">
          <div className="tr-sig-item">
            <span className="tr-sig-label">Requested By Signature</span>
            {sigRequester ? <img src={sigRequester} alt="Requested by signature" /> : <div className="tr-sig-empty">No signature uploaded</div>}
            <label className="tr-sig-upload">
              {sigRequester ? 'Replace' : 'Upload'}
              <input type="file" accept="image/png,image/jpeg" onChange={e=>handleSigUpload('requester', e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <div className="tr-sig-item">
            <span className="tr-sig-label">Authorized By Signature — Ahmed Ali</span>
            {sigAhmedAli ? <img src={sigAhmedAli} alt="Authorized by signature" /> : <div className="tr-sig-empty">No signature uploaded</div>}
            <label className="tr-sig-upload">
              {sigAhmedAli ? 'Replace' : 'Upload'}
              <input type="file" accept="image/png,image/jpeg" onChange={e=>handleSigUpload('ahmedali', e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
      </div>

      {editing && <TripRequestModal record={editing} employees={employees} onClose={()=>setEditing(null)} onSave={save} />}
      {approving && (
        <div className="modal-backdrop" role="presentation">
          <section className="registration-modal" role="dialog" aria-modal="true" style={{ maxWidth:460 }}>
            <div className="modal-header">
              <div><p className="eyebrow">Trip Request</p><h2>Confirm Approval</h2></div>
              <button className="icon-button" onClick={()=>setApproving(null)} type="button">✕</button>
            </div>
            <div style={{ padding:'16px 20px' }}>
              <p style={{ fontSize:'0.85rem', color:'#374151', lineHeight:1.6 }}>
                Approve the trip request from <strong>{approving.requesterName || 'this requester'}</strong>
                {' '}({approving.departingFrom || '—'} → {approving.destination || '—'}) as{' '}
                <strong>Ahmed Ali — Operations Manager</strong>?
              </p>
            </div>
            <div className="modal-actions">
              <button className="quiet-button light" onClick={()=>setApproving(null)} type="button">Cancel</button>
              <button className="primary-button" onClick={approve} type="button">✓ Approve</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

function printTripRequest(record: TripRequest, sigRequester: string, sigAhmedAli: string) {
  const esc = (s: string) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

  const isApproved = record.status === 'Approved'
  const oneWayChecked = record.tripType === 'One-Way'
  const roundTripChecked = record.tripType === 'Round Trip'

  let returnDisplay = '-'
  if (record.tripType === 'Round Trip') {
    if (record.returnTBD) {
      returnDisplay = 'TBD'
    } else {
      const d = record.returnDate ? formatDateDisplay(record.returnDate) : ''
      const t = record.returnTime ? formatTimeHrs(record.returnTime) : ''
      returnDisplay = [d, t].filter(Boolean).join(' ') || 'TBD'
    }
  }

  const requesterSigHtml = isApproved && sigRequester ? `<img class="sig-img" src="${sigRequester}" alt="Signature" />` : '&nbsp;'
  const authorizedSigHtml = isApproved && sigAhmedAli ? `<img class="sig-img" src="${sigAhmedAli}" alt="Signature" />` : '&nbsp;'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Trip Requisition — ${esc(record.requesterName) || 'Trip Request'}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #111; background: #f0f0f0; margin: 0; padding: 0; }

  .screen-bar { display:flex; align-items:center; gap:14px; padding:10px 20px; background:#1e1b4b; position: sticky; top:0; z-index:10; font-family: system-ui, sans-serif; font-size:13px; }
  .screen-bar button { padding:7px 20px; background:#6d28d9; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; }
  .screen-bar button:hover { background:#5b21b6; }
  .screen-bar .ref-label { font-weight:700; color:#ddd6fe; }
  .screen-bar .meta-label { color: rgba(221,214,254,0.7); font-size:12px; }

  .a4-wrap { max-width:210mm; margin:24px auto; padding-bottom:40px; }
  .a4-page { background:#fff; box-shadow:0 4px 20px rgba(30,27,75,0.16); min-height:297mm; padding:30pt 36pt; position:relative; overflow:hidden; }
  .accent-bar { position:absolute; top:0; left:0; right:0; height:5pt; background: linear-gradient(90deg,#4f46e5,#06b6d4); }

  .vmt-title { text-align:center; font-size:14pt; font-weight:700; letter-spacing:0.5px; margin:14pt 0 2pt; }
  .vmt-subtitle { text-align:center; font-size:11.5pt; font-weight:700; margin-bottom:14pt; }

  .sec-label { font-weight:700; font-size:11pt; margin:10pt 0 4pt; }

  table.vmt-tbl { width:100%; border-collapse:collapse; margin-bottom:6pt; }
  table.vmt-tbl td { border:1pt solid #333; padding:4pt 8pt; font-size:10.5pt; vertical-align:middle; }
  table.vmt-tbl td.lbl { font-weight:700; width:170pt; }

  .tick-row { display:flex; align-items:center; gap:8pt; font-size:10.5pt; flex-wrap:wrap; }
  .tick-box { display:inline-flex; align-items:center; justify-content:center; width:24pt; height:16pt; border:1pt solid #333; font-weight:700; font-size:11pt; flex-shrink:0; }
  .return-box { flex:1; min-width:120pt; border:1pt solid #333; padding:3pt 8pt; min-height:14pt; }

  .sig-grid { display:grid; grid-template-columns:1fr 1fr; border:1pt solid #333; margin-top:12pt; }
  .sig-col { padding:8pt 12pt 12pt; border-right:1pt solid #333; }
  .sig-col:last-child { border-right:none; }
  .sig-col-hdr { font-weight:700; font-size:10.5pt; border-bottom:1pt solid #333; margin:-8pt -12pt 10pt; padding:6pt 12pt; background:#f8fafc; }
  .sig-row { font-size:10.5pt; margin-bottom:8pt; display:flex; align-items:baseline; gap:6pt; }
  .sig-line { flex:1; border-bottom:1pt solid #333; min-width:80pt; height:14pt; display:inline-block; vertical-align:bottom; padding-left:4pt; }
  .sig-img-row { min-height:56pt; align-items:flex-end; padding-bottom:2pt; }
  .sig-img-row .sig-line { height:54pt; border-bottom:1pt solid #333; display:flex; align-items:center; }
  .sig-img { height:46pt; max-width:160pt; object-fit:contain; }
  .sig-lbl { font-weight:600; white-space:nowrap; }

  .status-stamp { position:absolute; top:54pt; right:42pt; font-family: system-ui, sans-serif; font-size:13pt; font-weight:800; letter-spacing:2px; text-transform:uppercase; padding:4pt 12pt; border:2pt solid; border-radius:4pt; transform:rotate(8deg); opacity:0.8; }
  .status-stamp.pending { color:#b45309; border-color:#b45309; }
  .status-stamp.rejected { color:#b91c1c; border-color:#b91c1c; }

  .vmt-footer { text-align:center; font-family: system-ui, sans-serif; font-size:7.5pt; color:#94a3b8; margin-top:16pt; letter-spacing:0.5px; }

  @media print {
    body { background:#fff; }
    .screen-bar { display:none !important; }
    .a4-wrap { max-width:none; margin:0; padding:0; }
    .a4-page { box-shadow:none; min-height:unset; }
  }
</style>
</head>
<body>

<div class="screen-bar">
  <button onclick="window.print()">🖨&nbsp; Print / Save as PDF</button>
  <span class="ref-label">${esc(record.requesterName) || 'Trip Request'}</span>
  <span class="meta-label">${esc(record.departingFrom)} → ${esc(record.destination)} &nbsp;·&nbsp; ${esc(record.status)}</span>
</div>

<div class="a4-wrap">
  <div class="a4-page">
    <div class="accent-bar"></div>
    ${record.status !== 'Approved' ? `<div class="status-stamp ${record.status === 'Rejected' ? 'rejected' : 'pending'}">${esc(record.status)}</div>` : ''}

    <div class="vmt-title">VILLA MARINE TRANSPORT</div>
    <div class="vmt-subtitle">Non-Routine Trip Requisition Form</div>

    <div class="sec-label" style="margin-top:2pt">Requester Details</div>
    <table class="vmt-tbl">
      <tr><td class="lbl">Requester Name</td><td>${esc(record.requesterName) || '&nbsp;'}</td></tr>
      <tr><td class="lbl">Job Title</td><td>${esc(record.jobTitle) || '&nbsp;'}</td></tr>
      <tr><td class="lbl">Department</td><td>${esc(record.department) || '&nbsp;'}</td></tr>
      <tr><td class="lbl">Business Unit</td><td>VHPL</td></tr>
    </table>

    <div class="sec-label">Trip Details</div>
    <table class="vmt-tbl">
      <tr><td class="lbl">Departing from:</td><td colspan="3">${esc(record.departingFrom) || '&nbsp;'}</td></tr>
      <tr><td class="lbl">Destination:</td><td colspan="3">${esc(record.destination) || '&nbsp;'}</td></tr>
      <tr><td class="lbl">Departure Date:</td><td>${record.departureDate ? formatDateDisplay(record.departureDate) : '&nbsp;'}</td><td class="lbl">Departure Time</td><td>${record.departureTime ? formatTimeHrs(record.departureTime) : '&nbsp;'}</td></tr>
      <tr><td class="lbl">Purpose of trip:</td><td colspan="3">${esc(record.purpose) || '&nbsp;'}</td></tr>
      <tr><td class="lbl">Number of Passengers:</td><td colspan="3">${esc(String(record.passengers || '')) || '&nbsp;'}</td></tr>
    </table>

    <div class="sec-label">Tick the appropriate box</div>
    <div class="tick-row">
      <span>One-Way</span><span class="tick-box">${oneWayChecked ? '✓' : ''}</span>
      <span style="margin-left:10pt">Round Trip</span><span class="tick-box">${roundTripChecked ? '✓' : ''}</span>
      <span style="margin-left:10pt">Return Date &amp; Time</span>
      <span class="return-box">${esc(returnDisplay)}</span>
    </div>

    <div class="sec-label">Tick the appropriate box</div>
    <table class="vmt-tbl">
      <tr><td class="lbl">Trip to be invoiced to:</td><td>VHPL</td></tr>
    </table>

    <div class="sig-grid">
      <div class="sig-col">
        <div class="sig-col-hdr">Requested by:</div>
        <div class="sig-row"><span class="sig-lbl">Name:</span><span class="sig-line">${esc(record.requesterName) || ''}</span></div>
        <div class="sig-row sig-img-row"><span class="sig-lbl">Signature:</span><span class="sig-line">${requesterSigHtml}</span></div>
        <div class="sig-row"><span class="sig-lbl">Date:</span><span class="sig-line">${record.requestDate ? formatDateDisplay(record.requestDate) : ''}</span></div>
      </div>
      <div class="sig-col">
        <div class="sig-col-hdr">Authorized by:</div>
        <div class="sig-row"><span class="sig-lbl">Name:</span><span class="sig-line">AHMED ALI</span></div>
        <div class="sig-row sig-img-row"><span class="sig-lbl">Signature:</span><span class="sig-line">${authorizedSigHtml}</span></div>
        <div class="sig-row"><span class="sig-lbl">Date:</span><span class="sig-line">${record.approvedDate ? formatDateDisplay(record.approvedDate) : ''}</span></div>
      </div>
    </div>

    <div class="sec-label">For VMT's use only</div>
    <table class="vmt-tbl">
      <tr><td class="lbl">Cost of the trip</td><td>&nbsp;</td></tr>
    </table>
    <div class="sig-grid">
      <div class="sig-col">
        <div class="sig-col-hdr">Reviewed by: Movement Controller</div>
        <div class="sig-row"><span class="sig-lbl">Name:</span><span class="sig-line"></span></div>
        <div class="sig-row sig-img-row"><span class="sig-lbl">Signature:</span><span class="sig-line"></span></div>
        <div class="sig-row"><span class="sig-lbl">Date:</span><span class="sig-line"></span></div>
      </div>
      <div class="sig-col">
        <div class="sig-col-hdr">Authorized by: Manager of Transport</div>
        <div class="sig-row"><span class="sig-lbl">Name:</span><span class="sig-line"></span></div>
        <div class="sig-row sig-img-row"><span class="sig-lbl">Signature:</span><span class="sig-line"></span></div>
        <div class="sig-row"><span class="sig-lbl">Date:</span><span class="sig-line"></span></div>
      </div>
    </div>

    <div class="vmt-footer">VHPL · Thilafushi Industrial Complex Pvt. Ltd. · Maldives</div>
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
            <button className="mc-submit-btn vwh" type="submit">
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

          {/* Charts row — dept breakdown + monthly trend side by side */}
          <div className="mc-charts-row">

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

          </div>{/* mc-charts-row */}

          {/* Staff table — full width, takes remaining height */}
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
                        <th style={{ width: 36, textAlign: 'center', padding: '5px 8px', fontSize: '0.67rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>#</th>
                        <th style={{ width: 80, textAlign: 'left', padding: '5px 8px', fontSize: '0.67rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Emp ID</th>
                        <th style={{ textAlign: 'left', padding: '5px 8px', fontSize: '0.67rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '5px 8px', fontSize: '0.67rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Section</th>
                        <th style={{ width: 70, textAlign: 'center', padding: '5px 8px', fontSize: '0.67rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Cases</th>
                        <th style={{ width: 70, textAlign: 'center', padding: '5px 8px', fontSize: '0.67rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Days</th>
                        <th style={{ width: 140, padding: '5px 8px' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {topStaff.map(([empId, v], rank) => (
                        <tr key={empId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: rank === 0 ? '#fbbf24' : rank === 1 ? '#94a3b8' : rank === 2 ? '#d97706' : '#e2e8f0', color: rank <= 2 ? '#fff' : '#374151', fontSize: '0.64rem', fontWeight: 800 }}>{rank + 1}</span>
                          </td>
                          <td style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{empId}</td>
                          <td style={{ padding: '4px 8px', fontSize: '0.80rem', whiteSpace: 'nowrap' }}><strong style={{ color: '#111827' }}>{v.name}</strong></td>
                          <td style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#374151', whiteSpace: 'nowrap' }}>{v.department}</td>
                          <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '0.80rem', color: '#374151', fontWeight: 600 }}>{v.cases}</td>
                          <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 800, color: '#1e40af', whiteSpace: 'nowrap' }}>{v.days}d</td>
                          <td style={{ padding: '4px 12px 4px 8px' }}>
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
        <label className="search-field"><span>Search</span><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, Emp ID, reason…" /></label>
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
        <button className="primary-button toolbar-add-btn vwh" onClick={() => setEditing(newCase())} type="button">+ Add Medical Case</button>
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
                        <button className="action-glyph edit vwh" onClick={() => setEditing(r)} type="button" title="Edit">✎</button>
                        <button className="action-glyph delete vwh" onClick={() => del(r.id)} type="button" title="Delete">🗑</button>
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
  isHOD = false,
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
  isHOD?: boolean
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
    const matchesHodScope = !isHOD || record.step === 'Pending Departure'
    return matchesSearch && matchesType && matchesDepartment && matchesHodScope
  }).sort((a, b) => a.departureDate.localeCompare(b.departureDate)), [leaveRequests, requestSearch, requestTypeFilter, requestDepartmentFilter, isHOD])

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
              <label className="search-field"><span>Search</span><input type="text" value={requestSearch} onChange={(event) => setRequestSearch(event.target.value)} placeholder="Employee, ID, purpose" /></label>
              <label><span>Leave Type</span><select value={requestTypeFilter} onChange={(event) => setRequestTypeFilter(event.target.value as 'All' | LeaveTypeCode)}><option value="All">All Types</option>{leaveTypeOptions.map((item) => <option key={item.code} value={item.code}>{item.label} ({item.code})</option>)}</select></label>
              <label><span>Section</span><select value={requestDepartmentFilter} onChange={(event) => setRequestDepartmentFilter(event.target.value)}><option>All Departments</option>{departmentsList.map((item) => <option key={item}>{item}</option>)}</select></label>
              <button className="primary-button toolbar-add-btn vwh" onClick={onAddRequest} type="button">Add Leave Request</button>
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
                              disabled={isLast || isHOD}
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
                              <button className="action-glyph edit vwh" onClick={() => onEditRequest(record)} type="button" title="Edit">✎</button>
                              <button className="action-glyph delete vwh" onClick={() => onDeleteRequest(record.id)} type="button" title="Delete">🗑</button>
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
                                            disabled={isHOD}
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
              <label className="search-field"><span>Search</span><input type="text" value={activeSearch} onChange={(event) => setActiveSearch(event.target.value)} placeholder="Employee, ID, purpose" /></label>
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
                              className={`action-glyph vwh ${hasExt ? 'action-glyph-edit-ext' : 'action-glyph-extend'}`}
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
              <label className="search-field"><span>Search</span><input type="text" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Employee, ID, purpose" /></label>
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
                      <td className="leave-status-cell-sm">{record.confirmation ? <StatusBadge status={record.confirmation} /> : <div className="row-actions history-confirm-actions"><button className="mini-button vwh" onClick={() => onHistoryConfirm(record.id, 'Returned')} type="button">Returned</button><button className="mini-button danger vwh" onClick={() => onHistoryConfirm(record.id, 'Not Returned')} type="button">Not Returned</button></div>}</td>
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
            <button className="ind-add-row-btn vwh" onClick={addRow} type="button">+ Add Row</button>
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
                      <button className="action-glyph delete ind-remove-row vwh" onClick={() => removeRow(i)} type="button" title="Remove row">×</button>
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
            <button className="ind-add-row-btn vwh" onClick={addRow} type="button">+ Add Row</button>
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
                      <button className="ind-remove-row-btn vwh" onClick={() => removeRow(i)} type="button" title="Remove row" aria-label="Remove row">×</button>
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

function PersonalFilesSection({ records, onUpdate, employees = [], isAdmin = false }: {
  records: PersonalFileRecord[]
  onUpdate: (fn: (prev: PersonalFileRecord[]) => PersonalFileRecord[]) => void
  employees?: Employee[]
  isAdmin?: boolean
  onBack?: () => void
}) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All Sections')
  const [staffFilter, setStaffFilter] = useState<'Active' | 'Inactive' | 'All'>('Active')
  const [editingFileNo, setEditingFileNo] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<50 | 100 | 'All'>(50)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const { confirmDelete, deleteBar } = useDeleteConfirm()

  // Employees not yet in personal files
  const existingEmpIds = useMemo(() => new Set(records.map(r => r.employeeId)), [records])
  const availableEmps = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase()
    return employees
      .filter(e => !existingEmpIds.has(e.employeeId))
      .filter(e => !q || e.fullName.toLowerCase().includes(q) || e.employeeId.includes(q) || e.department.toLowerCase().includes(q))
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [employees, existingEmpIds, pickerSearch])

  const addFromEmployee = (emp: Employee) => {
    const maxNum = Math.max(0, ...records.map(r => parseInt(r.fileNo, 10)).filter(n => !isNaN(n)))
    const newFile: PersonalFileRecord = {
      fileNo: String(maxNum + 1).padStart(4, '0'),
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      department: emp.department,
      staffStatus: 'Active',
      coc: false, jd: false, ea: false, eaExpiryDate: '', remarks: '',
    }
    onUpdate(prev => [newFile, ...prev])
    supabase.from('personal_files').upsert(personalFileToDb(newFile), { onConflict: 'file_no' })
      .then(({ error }) => { if (error) console.error('[PF add]', error.message) })
    setPickerSearch('')
  }

  const deleteFile = async (fileNo: string, name: string) => {
    const ok = await confirmDelete(`Delete personal file for ${name}?`)
    if (!ok) return
    onUpdate(prev => prev.filter(r => r.fileNo !== fileNo))
    supabase.from('personal_files').delete().eq('file_no', fileNo)
      .then(({ error }) => { if (error) console.error('[PF delete]', error.message) })
  }

  const downloadPfTemplate = () => downloadCsv('personal-files-template.csv', [
    ['File No', 'Emp ID', 'Full Name', 'Section', 'Status', 'COC', 'JD', 'EA', 'EA Expiry Date', 'Remarks'],
    ['0001', '12345', 'EXAMPLE EMPLOYEE', 'ADMINISTRATION', 'Active', 'TRUE', 'FALSE', 'FALSE', '', ''],
  ])

  const importPfCsv = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.csv,text/csv'
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length < 2) return
      const hdr = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
      const ci = (terms: string[]) => terms.map(t => hdr.indexOf(t)).find(i => i >= 0) ?? -1
      const g = (row: string[], idx: number) => idx >= 0 ? (row[idx] ?? '').trim() : ''
      const iFileNo = ci(['fileno','file']), iEmpId = ci(['empid','employeeid']),
            iName   = ci(['fullname','name']), iDept = ci(['section','department']),
            iStatus = ci(['status','staffstatus']), iCoc = ci(['coc']),
            iJd     = ci(['jd']),               iEa   = ci(['ea']),
            iEaExp  = ci(['eaexpirydate','eaexpiry']), iRemarks = ci(['remarks'])
      const imported: PersonalFileRecord[] = rows.slice(1)
        .filter(r => r.some(c => c.trim()))
        .map(r => ({
          fileNo:        g(r, iFileNo) || String(Date.now()).slice(-6),
          employeeId:    g(r, iEmpId),
          fullName:      g(r, iName),
          department:    g(r, iDept),
          staffStatus:   (g(r, iStatus) || 'Active') as StaffStatus,
          coc:           g(r, iCoc).toLowerCase() === 'true' || g(r, iCoc) === '1',
          jd:            g(r, iJd).toLowerCase()  === 'true' || g(r, iJd)  === '1',
          ea:            g(r, iEa).toLowerCase()  === 'true' || g(r, iEa)  === '1',
          eaExpiryDate:  g(r, iEaExp),
          remarks:       g(r, iRemarks),
        }))
      if (imported.length === 0) return
      onUpdate(prev => {
        const existingNos = new Set(prev.map(r => r.fileNo))
        const toAdd = imported.filter(r => !existingNos.has(r.fileNo))
        const toUpdate = imported.filter(r => existingNos.has(r.fileNo))
        const updated = prev.map(r => { const u = toUpdate.find(x => x.fileNo === r.fileNo); return u ?? r })
        return [...toAdd, ...updated]
      })
      await supabase.from('personal_files').upsert(imported.map(personalFileToDb), { onConflict: 'file_no' })
    }
    input.click()
  }

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
          <label className="search-field" style={{ flex:'1 1 220px' }}>
            <span>Search</span>
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="File no, employee, department" />
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
              <option value={50}>50</option><option value={100}>100</option><option value="All">All</option>
            </select>
          </label>
          {/* Admin-only actions */}
          {isAdmin && <>
            <button className="quiet-button vwh" type="button" onClick={downloadPfTemplate} title="Download CSV template">Template</button>
            <button className="quiet-button vwh" type="button" onClick={importPfCsv} title="Import from CSV">Import</button>
          </>}
          <button className="primary-button vwh" type="button" onClick={() => { setPickerSearch(''); setShowPicker(true) }}>+ Add Staff</button>
        </div>

        <div className="employee-table-shell compact-scroll">
          <table className="data-table personal-files-table">
            <thead>
              <tr>
                <th>File No</th><th>Emp ID</th><th>Full Name</th><th>Section</th>
                <th style={{ textAlign:'center' }}>COC</th>
                <th style={{ textAlign:'center' }}>JD</th>
                <th style={{ textAlign:'center' }}>EA</th>
                <th style={{ textAlign:'center' }}>EA Expiry</th>
                <th style={{ textAlign:'center' }}>Status</th>
                <th style={{ textAlign:'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={10} className="empty-row">No personal file records. Use "+ Add Staff" to add employees.</td></tr>
              ) : rows.map((file) => (
                <tr key={file.fileNo} className={rowClass(file.staffStatus)}>
                  <td>{file.fileNo}</td>
                  <td>{file.employeeId}</td>
                  <td>{file.fullName}</td>
                  <td>{file.department}</td>
                  <td className="doc-check-cell">{file.coc ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
                  <td className="doc-check-cell">{file.jd  ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
                  <td className="doc-check-cell">{file.ea  ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
                  <td style={{ textAlign:'center' }}>{file.eaExpiryDate ? formatDateDisplay(file.eaExpiryDate) : '—'}</td>
                  <td style={{ textAlign:'center' }}><StaffStatusBadge status={file.staffStatus} /></td>
                  <td style={{ textAlign:'center' }}>
                    <div className="row-actions">
                      <button className="action-glyph edit vwh" onClick={() => setEditingFileNo(file.fileNo)} type="button" title="Edit">✎</button>
                      <button className="action-glyph delete vwh" onClick={() => deleteFile(file.fileNo, file.fullName)} type="button" title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pageSize !== 'All' && totalPages > 1 && (
          <div className="pagination-bar">
            <button className="page-btn" onClick={() => setPage(1)} disabled={safePage === 1} type="button">«</button>
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={safePage === 1} type="button">‹</button>
            <span className="page-info">Page {safePage} of {totalPages} · {filtered.length} records</span>
            <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={safePage === totalPages} type="button">›</button>
            <button className="page-btn" onClick={() => setPage(totalPages)} disabled={safePage === totalPages} type="button">»</button>
          </div>
        )}
        {pageSize === 'All' && <div className="pagination-bar"><span className="page-info">{filtered.length} records total</span></div>}
      </section>

      {editingFile && <PersonalFileModal file={editingFile} onClose={() => setEditingFileNo(null)} onSave={saveFile} />}

      {/* ── Add Staff picker ──────────────────────────────────────────── */}
      {showPicker && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowPicker(false)}>
          <section className="registration-modal pf-picker-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ maxWidth:560 }}>
            <div className="modal-header">
              <div><p className="eyebrow">Personal Files</p><h2>Add Staff</h2></div>
              <button className="icon-button" onClick={() => setShowPicker(false)} type="button">✕</button>
            </div>
            <p style={{ fontSize:'0.82rem', color:'#64748b', margin:'0 0 12px' }}>
              Select an employee to add to Personal Files. Only staff not already in the list are shown.
            </p>
            <div className="uf-emp-search-wrap" style={{ marginBottom:12 }}>
              <input
                className="uf-emp-search-input"
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                placeholder="Search by name, ID or section…"
                autoFocus
                autoComplete="off"
              />
            </div>
            <div className="pf-picker-list">
              {availableEmps.length === 0 ? (
                <p style={{ textAlign:'center', color:'#94a3b8', padding:'24px 0', fontSize:'0.85rem' }}>
                  {pickerSearch ? 'No employees match your search.' : 'All employees are already in Personal Files.'}
                </p>
              ) : availableEmps.map(emp => (
                <button
                  key={emp.employeeId}
                  className="pf-picker-row"
                  type="button"
                  onClick={() => { addFromEmployee(emp); setShowPicker(false) }}
                >
                  <div className="pf-picker-info">
                    <span className="pf-picker-name">{emp.fullName}</span>
                    <span className="pf-picker-meta">{emp.employeeId} · {emp.department} · {emp.designation || '—'}</span>
                  </div>
                  <span className="pf-picker-add">+ Add</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {deleteBar}
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
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ref no, conducted by, participant name" />
          </label>
          <button className="primary-button vwh" onClick={() => setEditing(newRecord())} type="button">Add Session</button>
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
                      <button className="action-glyph edit vwh" onClick={() => setEditing(record)} type="button" title="Edit" aria-label="Edit">✎</button>
                      <button className="action-glyph delete vwh" onClick={() => deleteRecord(record.id)} type="button" title="Delete" aria-label="Delete">🗑</button>
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
          <label className="search-field"><span>Search</span><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Training title, trainer" /></label>
          <label><span>Type</span><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}><option value="All">All Types</option><option value="Internal">Internal</option><option value="External">External</option></select></label>
          <button className="primary-button vwh" onClick={() => setEditing(newRecord())} type="button">Add</button>
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
                      <button className="action-glyph edit vwh" onClick={() => setEditing(record)} type="button" title="Edit" aria-label="Edit">✎</button>
                      <button className="action-glyph delete vwh" onClick={() => deleteRecord(record.id)} type="button" title="Delete" aria-label="Delete">🗑</button>
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
                      <button className="action-glyph edit vwh" onClick={() => setEditing(r)} type="button" title="Edit" aria-label="Edit">✎</button>
                      <button className="action-glyph delete vwh" onClick={() => deleteRecord(r.id)} type="button" title="Delete" aria-label="Delete">🗑</button>
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
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, Emp ID, section, bank, nationality…" />
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
          <button className="primary-button vwh" onClick={() => setEditing(newRecord())} type="button">Add</button>
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
      <section className="registration-modal mc-wide-modal trn-form-redesign" role="dialog" aria-modal="true" aria-labelledby="termination-form-title">

        {/* Gradient header */}
        <div className="trn-form-header">
          <div className="trn-form-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <p className="trn-form-eyebrow">Termination Workflow</p>
            <h2 id="termination-form-title" className="trn-form-title">{mode === 'add' ? 'Add Termination Record' : 'Edit Termination Record'}</h2>
          </div>
          <button className="trn-form-close" onClick={onClose} type="button">×</button>
        </div>

        <form onSubmit={save} className="trn-form-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 12 }}>

            {/* Left — Employee Details */}
            <div className="trn-form-section trn-section-emp">
              <div className="trn-section-label">
                <span className="trn-section-dot trn-dot-blue"/>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Employee Details
              </div>
              {/* Employee search */}
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <label><span>Search Staff</span>
                  <input className="lf-search-input" placeholder="Employee ID or name…"
                    type="text" value={searchQuery} autoComplete="off"
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => !form.employeeId && setShowResults(true)} />
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
              {form.employeeId && (
                <div className="os-emp-pill" style={{ marginBottom: 10 }}>
                  <div>
                    <strong>{form.name}</strong>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#3b82f6' }}>{form.employeeId} · {form.department}</span>
                  </div>
                </div>
              )}
              {/* Readonly fields — same form-grid pattern as rest of app */}
              <div className="form-grid">
                <label><span>Designation</span><input readOnly value={form.designation} placeholder="—" className="lf-readonly" /></label>
                <label><span>Nationality</span><input readOnly value={form.nationality} placeholder="—" className="lf-readonly" /></label>
                <label><span>Section</span><input readOnly value={form.department} placeholder="—" className="lf-readonly" /></label>
                <label><span>Date of Join</span><input readOnly value={form.dateOfJoin} placeholder="—" className="lf-readonly" /></label>
              </div>
            </div>

            {/* Right — Termination Details */}
            <div className="trn-form-section trn-section-term">
              <div className="trn-section-label">
                <span className="trn-section-dot trn-dot-red"/>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Termination Details
              </div>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Termination Type</span>
                  <select value={form.terminationType} onChange={(e) => setForm((cur) => ({ ...cur, terminationType: e.target.value as TerminationType }))}>
                    <option>Resignation</option><option>Dismissal</option><option>Probation End</option>
                    <option>Contract Expiry</option><option>Absconded</option><option>Other</option>
                  </select>
                </label>
                <label><span>Date Submitted</span><input type="date" value={form.dateSubmitted ?? ''} onChange={(e) => setForm((cur) => ({ ...cur, dateSubmitted: e.target.value }))} /></label>
                <label><span>Last Working Date</span><input type="date" value={form.lastWorkingDate} onChange={(e) => setForm((cur) => ({ ...cur, lastWorkingDate: e.target.value }))} required /></label>
                <label><span>Departure Date</span><input type="date" value={form.departureDate} onChange={(e) => setForm((cur) => ({ ...cur, departureDate: e.target.value }))} required /></label>
                {mode === 'edit' && (
                  <label><span>Stage</span>
                    <select value={form.currentStage} onChange={(e) => setForm((cur) => ({ ...cur, currentStage: e.target.value as TerminationStage }))} required>
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Bottom — Reason & Comments */}
          <div className="trn-form-section trn-section-notes" style={{ marginBottom: 12 }}>
            <div className="trn-section-label">
              <span className="trn-section-dot trn-dot-amber"/>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Reason &amp; Notes
            </div>
            <div className="form-grid">
              <label><span>Reason for Leaving</span>
                <textarea rows={2} placeholder="Reason for termination" value={form.reasonForLeaving} onChange={(e) => setForm((cur) => ({ ...cur, reasonForLeaving: e.target.value }))} style={{ resize: 'none' }} />
              </label>
              <label><span>Comments (optional)</span>
                <textarea rows={2} placeholder="Any additional notes…" value={form.comments ?? ''} onChange={(e) => setForm((cur) => ({ ...cur, comments: e.target.value }))} style={{ resize: 'none' }} />
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

/* ─── printExitInterview — exact match to Villa Hakatha PDF ── */
function printExitInterview(record: ExitInterviewRecord) {
  const esc = (s: string) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const fmt = (d: string) => {
    if (!d) return ''
    const [y, m, dd] = d.split('-')
    const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${dd}-${months[parseInt(m,10)]}-${y}`
  }
  // Checkbox: large, bold tick mark — prominent and clearly visible on print
  const box = (checked: boolean) =>
    `<span style="display:inline-block;width:14pt;height:14pt;border:1.2pt solid #222;text-align:center;line-height:14pt;font-size:12pt;font-weight:900;margin-right:6pt;vertical-align:middle;flex-shrink:0;">${checked?'&#10003;':''}</span>`

  const inv = record.involuntaryReasons ?? []
  const vol = record.voluntaryReasons ?? []

  const invRows = invReasonsList.map(r =>
    `<div style="display:flex;align-items:center;margin-bottom:6pt;font-size:9pt;">${box(inv.includes(r))}${esc(r)}</div>`
  ).join('')
  const volRows = volReasonsList.map(r =>
    `<div style="display:flex;align-items:center;margin-bottom:6pt;font-size:9pt;">${box(vol.includes(r))}${esc(r)}</div>`
  ).join('')

  const q = record.questionnaire ?? {}
  const questRows = eiQuestionnaireCategories.map(({ key, label }) => {
    const v = q[key as keyof EIQuestionnaire] ?? ''
    return `<tr>
      <td style="padding:7pt 4pt;border:none;font-size:9pt;">${label}</td>
      <td style="text-align:center;border:none;padding:7pt 0;">${box(v==='Very Satisfied')}</td>
      <td style="text-align:center;border:none;padding:7pt 0;">${box(v==='Satisfied')}</td>
      <td style="text-align:center;border:none;padding:7pt 0;">${box(v==='Dissatisfied')}</td>
    </tr>`
  }).join('')

  // Each question: question text + bordered rectangular answer box (not underlines)
  const ansBox = (ans: string) =>
    `<div style="border:1pt solid #444;min-height:38pt;padding:5pt 7pt;font-size:9pt;margin-top:5pt;width:100%;box-sizing:border-box;">${ans}</div>`

  const qBlock = (from: number, to: number) => eiShortQuestions.slice(from - 1, to).map((qText, i) => {
    const qi = `q${from + i}` as keyof ExitInterviewRecord
    const ans = esc(record[qi] as string || '')
    return `<div style="margin-bottom:13pt;">
      <div style="font-size:9pt;margin-bottom:3pt;">${from+i}.&nbsp;&nbsp;${esc(qText)}</div>
      ${ansBox(ans)}
    </div>`
  }).join('')

  // Villa Hakatha logo — mathematically correct structure:
  // 4 equilateral triangles derived from tessellation of a large inverted equilateral (side 2a).
  // Each triangle shrunken toward its centroid by gap/2 = 6px to create uniform 12px white gaps.
  //
  // Large inverted triangle: (0,0)→(500,0)→(250,433)  [side≈500, h≈433]
  // Sub-triangles (side≈250, h≈216.5), shrunk by scale 0.917 toward centroid:
  //
  //   TL (↓ blue): centroid (125,72)  → (10,6), (240,6), (125,204)
  //   TR (↓ blue): centroid (375,72)  → (260,6), (490,6), (375,204)
  //   Center (↑ purple): centroid (250,144) → (135,210), (365,210), (250,12)
  //   Bottom (↓ blue): centroid (250,289) → (135,222), (365,222), (250,421)
  //
  // The center purple points UPWARD — its apex is at the TOP between TL and TR.
  const logoSvg = `<svg viewBox="0 0 500 430" xmlns="http://www.w3.org/2000/svg" style="width:74pt;height:64pt;flex-shrink:0;">
    <rect width="500" height="430" fill="white"/>
    <!-- Top-left: equilateral, pointing DOWN, cyan -->
    <polygon points="10,6 240,6 125,204" fill="#1796E6"/>
    <!-- Top-right: equilateral, pointing DOWN, cyan -->
    <polygon points="260,6 490,6 375,204" fill="#1796E6"/>
    <!-- Center: equilateral, pointing UP, deep purple — fills gap between 3 blue triangles -->
    <polygon points="135,210 365,210 250,12" fill="#2E1A78"/>
    <!-- Bottom: equilateral, pointing DOWN, cyan -->
    <polygon points="135,222 365,222 250,421" fill="#1796E6"/>
  </svg>`

  // Page header — exact PDF layout: logo left, company name right, EXIT INTERVIEW centered below
  const pageHdr = `
    <div style="display:flex;align-items:center;gap:12pt;margin-bottom:4pt;">
      ${logoSvg}
      <div>
        <div style="font-size:11pt;font-weight:400;color:#111;font-family:Arial,Helvetica,sans-serif;">Human Resource &amp; Administration</div>
        <div style="font-size:14pt;font-weight:900;letter-spacing:1pt;color:#111;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">VILLA HAKATHA PVT LTD</div>
      </div>
    </div>
    <div style="text-align:center;font-size:12pt;font-weight:800;letter-spacing:2pt;margin:14pt 0 16pt;font-family:Arial,Helvetica,sans-serif;">EXIT INTERVIEW</div>`

  const fieldRow = (l1: string, v1: string, l2: string, v2: string) =>
    `<tr>
      <td style="font-size:9pt;padding:5pt 0;white-space:nowrap;">${l1}</td>
      <td style="border-bottom:1pt solid #111;padding:5pt 6pt 2pt;font-size:9pt;min-width:130pt;">${esc(v1)}</td>
      <td style="width:16pt;"></td>
      <td style="font-size:9pt;padding:5pt 0;white-space:nowrap;">${l2}</td>
      <td style="border-bottom:1pt solid #111;padding:5pt 6pt 2pt;font-size:9pt;min-width:130pt;">${esc(v2)}</td>
    </tr>`

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Exit Interview — ${esc(record.name)}</title>
<style>
  @page { size: A4 portrait; margin: 18mm 18mm 18mm 18mm; }
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #111; background: #e8e8e8; margin:0; padding:0; }
  .print-bar { display:flex; align-items:center; gap:14px; padding:10px 20px; background:#1e1b4b; position:sticky; top:0; z-index:10; font-family:system-ui,sans-serif; font-size:13px; }
  .print-bar button { padding:7px 18px; background:#6d28d9; color:#fff; border:none; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer; }
  .print-bar span { color:rgba(221,214,254,0.7); font-size:12px; }
  .a4-wrap { max-width:210mm; margin:20px auto; display:flex; flex-direction:column; gap:18px; padding-bottom:40px; }
  .a4-page { background:#fff; box-shadow:0 4px 24px rgba(0,0,0,0.16); padding:18mm; }
  .quest-table { width:100%; border-collapse:collapse; }
  .quest-table tr td:first-child { width:55%; }
  .quest-table thead th { text-align:center; font-size:9pt; font-weight:700; padding:0 0 8pt; border-bottom:1pt solid #ccc; }
  .quest-table thead th:first-child { text-align:left; }
  .page-num { text-align:center; font-size:8pt; color:#666; margin-top:20pt; }
  @media print {
    body { background:#fff; }
    .print-bar { display:none !important; }
    .a4-wrap { max-width:none; margin:0; padding:0; gap:0; }
    .a4-page { box-shadow:none; padding:0; }
    .page-break { page-break-before:always; }
    .page-num { display:none; }
  }
</style></head><body>
<div class="print-bar">
  <button onclick="window.print()">🖨&nbsp; Print / Save as PDF</button>
  <span>Exit Interview — ${esc(record.name)} &nbsp;·&nbsp; ${esc(record.employeeId)}</span>
</div>
<div class="a4-wrap">

<!-- ══ PAGE 1: Employee details + Reasons + Comments ══ -->
<div class="a4-page">
  ${pageHdr}

  <table style="width:100%;border-collapse:collapse;margin-bottom:8pt;">
    <tbody>
      ${fieldRow('Employee Name', record.name, 'Termination Date', fmt(record.departureDate))}
      <tr>
        <td style="font-size:9pt;padding:5pt 0;white-space:nowrap;">Employee ID #</td>
        <td style="border-bottom:1pt solid #111;padding:5pt 6pt 2pt;font-size:9pt;">${esc(record.employeeId)}</td>
        <td style="width:16pt;"></td>
        <td style="font-size:9pt;padding:5pt 0;white-space:nowrap;">Eligible to Re-employee</td>
        <td style="padding:5pt 0 2pt;font-size:9pt;">
          &nbsp;${box(record.rehireEligible)} Yes&nbsp;&nbsp;${box(!record.rehireEligible)} No
        </td>
      </tr>
      ${fieldRow('Job Title', record.designation, 'Section / Department', record.department)}
      <tr>
        <td style="font-size:9pt;padding:5pt 0;white-space:nowrap;">Period of Service:</td>
        <td colspan="4" style="border-bottom:1pt solid #111;padding:5pt 6pt 2pt;font-size:9pt;">${esc(record.periodOfService||'')}</td>
      </tr>
    </tbody>
  </table>

  <div style="text-align:center;font-size:11pt;font-weight:800;margin:14pt 0 4pt;">Reason for Resignation / Termination</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 30pt;margin-bottom:10pt;">
    <div>
      <div style="font-size:9pt;font-weight:800;text-decoration:underline;text-align:center;margin-bottom:8pt;">Involuntary</div>
      ${invRows}
      <div style="display:flex;align-items:center;margin-bottom:6pt;font-size:9pt;">
        ${box(!!record.invOther)}Other &nbsp;<span style="border:1pt solid #444;flex:1;display:inline-block;padding:2pt 5pt;min-height:15pt;">${esc(record.invOther||'')}</span>
      </div>
    </div>
    <div>
      <div style="font-size:9pt;font-weight:800;text-decoration:underline;text-align:center;margin-bottom:8pt;">Voluntary</div>
      ${volRows}
      <div style="display:flex;align-items:center;margin-bottom:6pt;font-size:9pt;">
        ${box(!!record.volOther)}Other &nbsp;<span style="border:1pt solid #444;flex:1;display:inline-block;padding:2pt 5pt;min-height:15pt;">${esc(record.volOther||'')}</span>
      </div>
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;border:1pt solid #111;margin-top:8pt;">
    <tr><td style="font-size:9pt;font-weight:700;padding:4pt 8pt;border-bottom:1pt solid #111;"><strong>Employee Comments:</strong></td></tr>
    ${['','','',''].map((_, i) => {
      const lines = (record.employeeComments || '').split('\n')
      return `<tr><td style="padding:4pt 8pt;border-bottom:0.5pt solid #ccc;min-height:18pt;font-size:9pt;">${esc(lines[i]||'')}&nbsp;</td></tr>`
    }).join('')}
  </table>
  <div class="page-num">1</div>
</div>

<!-- ══ PAGE 2: Questionnaire ══ -->
<div class="a4-page page-break">
  <div style="text-align:center;font-size:13pt;font-weight:800;margin-bottom:16pt;">Questionnaire</div>
  <div style="font-size:9pt;font-weight:700;margin-bottom:12pt;">Check which best describes your feelings about the following aspects of your employment.</div>
  <table class="quest-table">
    <thead><tr>
      <th style="text-align:left;"></th>
      <th>Very Satisfied</th>
      <th>Satisfied</th>
      <th>Dissatisfied</th>
    </tr></thead>
    <tbody>${questRows}</tbody>
  </table>
  <div style="font-size:9pt;margin:10pt 0 14pt;">
    <div style="font-size:9pt;margin-bottom:3pt;font-weight:600;">Areas to be improved:</div>
    <div style="border:1pt solid #444;min-height:32pt;padding:5pt 7pt;font-size:9pt;">${esc(record.areasToImprove||'')}</div>
  </div>
  <div style="font-size:9pt;font-weight:700;margin-bottom:10pt;">Please answer the following questions in short</div>
  ${qBlock(1, 3)}
  <div class="page-num">2</div>
</div>

<!-- ══ PAGE 3: Questions 4–13 ══ -->
<div class="a4-page page-break">
  ${qBlock(4, 13)}
  <div class="page-num">3</div>
</div>

<!-- ══ PAGE 4: Q14 + Interviewer + Signatures ══ -->
<div class="a4-page page-break">
  ${qBlock(14, 14)}

  <table style="width:100%;border-collapse:collapse;border:1pt solid #111;margin:16pt 0;">
    <tr><td style="font-size:9pt;font-weight:700;padding:4pt 8pt;border-bottom:1pt solid #111;"><strong>Interviewer Comments:</strong></td></tr>
    ${['','','',''].map((_, i) => {
      const lines = (record.interviewerComments || '').split('\n')
      return `<tr><td style="padding:4pt 8pt;border-bottom:0.5pt solid #ccc;min-height:18pt;font-size:9pt;">${esc(lines[i]||'')}&nbsp;</td></tr>`
    }).join('')}
  </table>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 80pt;margin-top:40pt;">
    <div>
      <div style="border-top:1pt solid #111;padding-top:5pt;">
        <div style="font-size:9pt;font-weight:700;">Employee's Signature</div>
        <div style="font-size:9pt;margin-top:4pt;">${esc(record.name)}</div>
      </div>
    </div>
    <div>
      <div style="border-top:1pt solid #111;padding-top:5pt;">
        <div style="font-size:9pt;font-weight:700;">Interviewer's Signature</div>
        <div style="font-size:9pt;margin-top:4pt;">${esc(record.interviewerName || '—')}</div>
      </div>
    </div>
  </div>
  <div style="margin-top:20pt;font-size:9pt;display:flex;align-items:center;gap:6pt;">
    Date &nbsp;<span style="border:1pt solid #444;display:inline-block;min-width:90pt;padding:3pt 7pt;">${fmt(record.interviewDate)}</span>
  </div>
  <div class="page-num">4</div>
</div>

</div></body></html>`

  const w = window.open('', '_blank', 'width=920,height=720')
  if (w) { w.document.write(html); w.document.close() }
}

/* ─── ExitInterviewFormModal ─────────────────────────────── */
const calcService = (join: string, depart: string) => {
  if (!join || !depart) return ''
  const j = new Date(join), d = new Date(depart)
  let years = d.getFullYear() - j.getFullYear()
  let months = d.getMonth() - j.getMonth()
  if (months < 0) { years--; months += 12 }
  return years > 0
    ? `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`
    : `${months} month${months !== 1 ? 's' : ''}`
}

function ExitInterviewFormModal({ record, employees, onClose, onSave, viewOnly = false }: {
  record: ExitInterviewRecord
  employees: Employee[]
  onClose: () => void
  onSave: (r: ExitInterviewRecord) => void
  viewOnly?: boolean
}) {
  const blankQ: EIQuestionnaire = { duties: '', training: '', advancement: '', salary: '', benefits: '', workConditions: '', workHours: '', coworkers: '', supervision: '', overall: '' }
  const [form, setForm] = useState<ExitInterviewRecord>(() => ({
    ...record,
    involuntaryReasons: record.involuntaryReasons ?? [],
    voluntaryReasons: record.voluntaryReasons ?? [],
    invOther: record.invOther ?? '', volOther: record.volOther ?? '',
    employeeComments: record.employeeComments ?? '',
    areasToImprove: record.areasToImprove ?? '',
    q1: record.q1 ?? '', q2: record.q2 ?? '', q3: record.q3 ?? '',
    q4: record.q4 ?? '', q5: record.q5 ?? '', q6: record.q6 ?? '',
    q7: record.q7 ?? '', q8: record.q8 ?? '', q9: record.q9 ?? '',
    q10: record.q10 ?? '', q11: record.q11 ?? '', q12: record.q12 ?? '',
    q13: record.q13 ?? '', q14: record.q14 ?? '',
    interviewerComments: record.interviewerComments ?? '',
    interviewerName: record.interviewerName ?? '',
    questionnaire: record.questionnaire ?? blankQ,
    skipped: record.skipped ?? false,
    skipReason: record.skipReason ?? '',
    joinDate: record.joinDate ?? '',
  }))

  const hrEmployees = employees.filter(e => e.department === 'HUMAN RESOURCES')
  const autoFilled = !!record.employeeId

  const toggleInv = (reason: string) => setForm(p => ({
    ...p, involuntaryReasons: (p.involuntaryReasons ?? []).includes(reason)
      ? (p.involuntaryReasons ?? []).filter(x => x !== reason)
      : [...(p.involuntaryReasons ?? []), reason],
  }))
  const toggleVol = (reason: string) => setForm(p => ({
    ...p, voluntaryReasons: (p.voluntaryReasons ?? []).includes(reason)
      ? (p.voluntaryReasons ?? []).filter(x => x !== reason)
      : [...(p.voluntaryReasons ?? []), reason],
  }))
  const setQuestionnaire = (key: keyof EIQuestionnaire, val: EISatisfactionLevel) =>
    setForm(p => ({ ...p, questionnaire: { ...p.questionnaire, [key]: val } }))

  const servicePeriod = calcService(form.joinDate ?? '', form.departureDate)

  const questFilled = eiQuestionnaireCategories.every(({ key }) => (form.questionnaire?.[key] ?? '') !== '')
  const allQsFilled = ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','q11','q12','q13','q14']
    .every(k => !!(form[k as keyof ExitInterviewRecord] as string)?.trim())
  const hasReason = (form.involuntaryReasons?.length ?? 0) > 0 || (form.voluntaryReasons?.length ?? 0) > 0
    || !!form.invOther?.trim() || !!form.volOther?.trim()
  const hasInterviewer = !!form.interviewerName?.trim()
  const canSave = form.skipped
    ? !!form.skipReason
    : questFilled && allQsFilled && hasReason && hasInterviewer && !!form.employeeComments?.trim()
  const missingFields = form.skipped ? [] : [
    !questFilled && 'Questionnaire (all 10 categories)',
    !hasReason && 'Reason for resignation/termination',
    !allQsFilled && 'All 14 short questions',
    !form.employeeComments?.trim() && 'Employee comments',
    !hasInterviewer && 'Interviewer name',
  ].filter(Boolean) as string[]

  const fStyle: React.CSSProperties = { padding: '7px 10px', borderRadius: '7px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', background: '#fff', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
  const roStyle: React.CSSProperties = { ...fStyle, background: '#f8fafc', color: '#374151' }
  const taStyle: React.CSSProperties = { ...fStyle, resize: 'vertical', minHeight: '52px' }

  const save = (e: FormEvent) => {
    e.preventDefault()
    onSave({ ...form, periodOfService: servicePeriod || form.periodOfService })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal ei-form-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)', flexShrink: 0, paddingLeft: 24 }}>
          <div style={{ paddingLeft: 4 }}>
            <p className="eyebrow">Exit Interview</p>
            <h2>{record.name || 'New Exit Interview'}</h2>
            {record.department && <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>{record.department} · {record.designation}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {viewOnly && <span className="ei-completed-badge">✓ Completed</span>}
            <button className="icon-button" onClick={onClose} type="button">×</button>
          </div>
        </div>

        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="ei-form-body">

            {/* Skip Banner — at the very top */}
            {!viewOnly && (
              <div className="ei-skip-banner">
                <div className="ei-skip-banner-text">
                  <strong>Skip Exit Interview</strong>
                  <p>Use when a formal interview is not applicable (dismissal, absconded, etc.)</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {form.skipped && (
                    <select
                      value={form.skipReason ?? ''}
                      onChange={e => setForm(p => ({ ...p, skipReason: e.target.value }))}
                      style={{ ...fStyle, width: 'auto', minWidth: 180 }}
                    >
                      <option value="">Select reason…</option>
                      <option>Dismissal</option>
                      <option>Probationary Release</option>
                      <option>Absconded</option>
                      <option>Other</option>
                    </select>
                  )}
                  <button
                    type="button"
                    className={form.skipped ? 'primary-button' : 'quiet-button light'}
                    style={{ padding: '5px 16px', fontSize: '0.78rem' }}
                    onClick={() => setForm(p => ({ ...p, skipped: !p.skipped, skipReason: p.skipped ? '' : p.skipReason }))}
                  >
                    {form.skipped ? 'Skipped ✓' : 'Mark as Skipped'}
                  </button>
                </div>
              </div>
            )}

            {viewOnly && form.skipped && (
              <div className="ei-skip-banner">
                <div className="ei-skip-banner-text">
                  <strong>Interview was skipped</strong>
                  <p>Reason: {form.skipReason || '—'}</p>
                </div>
              </div>
            )}

            {/* Section 1 — Employee Details */}
            <div className="ei-form-section" style={{ margin: '0 4px' }}>
              <div className="ei-form-section-title">1 — Employee Details</div>
              {autoFilled && (
                <p style={{ fontSize: '0.76rem', color: '#6366f1', marginBottom: 8, fontStyle: 'italic' }}>
                  Employee details are automatically populated from the Notice Period record.
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Employee Name</span>
                  <input value={form.name} readOnly style={roStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Termination Date</span>
                  <input type="date" value={form.departureDate} onChange={e => !viewOnly && setForm(p => ({ ...p, departureDate: e.target.value }))} style={viewOnly ? roStyle : fStyle} readOnly={viewOnly} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Employee ID</span>
                  <input value={form.employeeId} readOnly style={roStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nationality</span>
                  <input value={form.nationality} readOnly style={roStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Job Title / Designation</span>
                  <input value={form.designation} readOnly style={roStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Section / Department</span>
                  <input value={form.department} readOnly style={roStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Join Date</span>
                  <input value={form.joinDate ?? ''} readOnly style={roStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Period of Service</span>
                  <input value={servicePeriod} readOnly style={roStyle} placeholder="—" />
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Eligible to Re-employ?</span>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: viewOnly ? 'default' : 'pointer' }}>
                      <input type="radio" name="rehire" checked={form.rehireEligible} onChange={() => !viewOnly && setForm(p => ({ ...p, rehireEligible: true }))} disabled={viewOnly} /> Yes
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: viewOnly ? 'default' : 'pointer' }}>
                      <input type="radio" name="rehire" checked={!form.rehireEligible} onChange={() => !viewOnly && setForm(p => ({ ...p, rehireEligible: false }))} disabled={viewOnly} /> No
                    </label>
                  </div>
                </div>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Interview Date</span>
                  <input type="date" value={form.interviewDate} onChange={e => !viewOnly && setForm(p => ({ ...p, interviewDate: e.target.value }))} style={viewOnly ? roStyle : fStyle} readOnly={viewOnly} />
                </label>
              </div>
            </div>

            {/* Only show full form if NOT skipped */}
            {!form.skipped && (
              <>
                {/* Section 2 — Reasons */}
                <div className="ei-form-section">
                  <div className="ei-form-section-title">2 — Reasons for Resignation / Termination</div>
                  <div className="ei-reasons-grid">
                    <div>
                      <div className="ei-reason-col-title">Involuntary</div>
                      {invReasonsList.map(r => (
                        <label key={r} className="ei-reason-check">
                          <input type="checkbox" checked={form.involuntaryReasons.includes(r)} onChange={() => !viewOnly && toggleInv(r)} disabled={viewOnly} />
                          {r}
                        </label>
                      ))}
                      <div style={{ marginTop: '6px' }}>
                        <label className="ei-reason-check" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Other:</span>
                          <input value={form.invOther} onChange={e => !viewOnly && setForm(p => ({ ...p, invOther: e.target.value }))} style={{ ...fStyle, width: '100%' }} placeholder="Specify…" readOnly={viewOnly} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <div className="ei-reason-col-title">Voluntary</div>
                      {volReasonsList.map(r => (
                        <label key={r} className="ei-reason-check">
                          <input type="checkbox" checked={form.voluntaryReasons.includes(r)} onChange={() => !viewOnly && toggleVol(r)} disabled={viewOnly} />
                          {r}
                        </label>
                      ))}
                      <div style={{ marginTop: '6px' }}>
                        <label className="ei-reason-check" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Other:</span>
                          <input value={form.volOther} onChange={e => !viewOnly && setForm(p => ({ ...p, volOther: e.target.value }))} style={{ ...fStyle, width: '100%' }} placeholder="Specify…" readOnly={viewOnly} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3 — Employee Comments */}
                <div className="ei-form-section">
                  <div className="ei-form-section-title">3 — Employee Comments</div>
                  <textarea value={form.employeeComments} onChange={e => !viewOnly && setForm(p => ({ ...p, employeeComments: e.target.value }))} style={{ ...taStyle, minHeight: '70px' }} placeholder="Employee's general comments…" readOnly={viewOnly} />
                </div>

                {/* Section 4 — Questionnaire */}
                <div className="ei-form-section">
                  <div className="ei-form-section-title">4 — Satisfaction Questionnaire</div>
                  {!viewOnly && !questFilled && (
                    <p style={{ fontSize: '0.76rem', color: '#dc2626', marginBottom: 8 }}>Please complete all 10 questionnaire fields before saving.</p>
                  )}
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
                                onChange={() => !viewOnly && setQuestionnaire(key, opt)}
                                disabled={viewOnly}
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
                      <input value={form.areasToImprove} onChange={e => !viewOnly && setForm(p => ({ ...p, areasToImprove: e.target.value }))} style={viewOnly ? roStyle : fStyle} placeholder="Areas the employee suggests for improvement…" readOnly={viewOnly} />
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
                          onChange={e => !viewOnly && setForm(p => ({ ...p, [qKey]: e.target.value }))}
                          readOnly={viewOnly}
                        />
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Section 6 — Interviewer */}
            <div className="ei-form-section">
              <div className="ei-form-section-title">{form.skipped ? '2' : '6'} — Interviewer</div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Interviewer Comments</span>
                  <textarea value={form.interviewerComments} onChange={e => !viewOnly && setForm(p => ({ ...p, interviewerComments: e.target.value }))} style={{ ...taStyle, minHeight: '60px' }} readOnly={viewOnly} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Interviewer (HR Staff)</span>
                  {viewOnly
                    ? <input value={form.interviewerName} readOnly style={roStyle} />
                    : (
                      <select
                        value={form.interviewerEmployeeId ?? ''}
                        onChange={e => {
                          const emp = hrEmployees.find(x => x.employeeId === e.target.value)
                          setForm(p => ({ ...p, interviewerEmployeeId: e.target.value, interviewerName: emp?.fullName ?? p.interviewerName }))
                        }}
                        style={fStyle}
                      >
                        <option value="">— Select HR staff —</option>
                        {hrEmployees.map(e => <option key={e.employeeId} value={e.employeeId}>{e.fullName}</option>)}
                      </select>
                    )
                  }
                  {!viewOnly && form.interviewerName && (
                    <span style={{ fontSize: '0.74rem', color: '#6366f1', marginTop: 2 }}>{form.interviewerName}</span>
                  )}
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Interview Date</span>
                  <input type="date" value={form.interviewDate} onChange={e => !viewOnly && setForm(p => ({ ...p, interviewDate: e.target.value }))} style={viewOnly ? roStyle : fStyle} readOnly={viewOnly} />
                </label>
              </div>
            </div>

          </div>

          {/* Footer */}
          {!viewOnly && !canSave && missingFields.length > 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 14px', margin: '0 24px 4px', fontSize: '0.76rem', color: '#92400e' }}>
              <strong>Required before saving:</strong> {missingFields.join(' · ')}
            </div>
          )}
          <div className="modal-actions" style={{ flexShrink: 0, borderTop: '1px solid #e8eaf0', padding: '12px 24px' }}>
            <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
            <button className="quiet-button" type="button" onClick={() => printExitInterview({ ...form, periodOfService: servicePeriod || form.periodOfService })} style={{ marginLeft: 'auto' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print
            </button>
            {!viewOnly && (
              <button className="primary-button" type="submit" disabled={!canSave}>
                {form.skipped ? 'Mark as Skipped' : 'Save'}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}

/* ─── ExitInterviewAnalyticsModal ────────────────────────── */

function ExitInterviewAnalyticsModal({ records, onClose }: { records: ExitInterviewRecord[]; onClose: () => void }) {
  const [view, setView] = useState<'overall' | 'person'>('overall')
  const [personSearch, setPersonSearch] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<ExitInterviewRecord | null>(null)

  const completed   = records.filter(r => r.questionnaire && Object.values(r.questionnaire).some(v => v !== ''))
  const skipped     = records.filter(r => r.skipped)
  const rehireCount = records.filter(r => r.rehireEligible).length
  const total       = records.length

  const buildQuestStats = (src: ExitInterviewRecord[]) =>
    eiQuestionnaireCategories.map(({ key, label }) => {
      const vs = src.filter(r => r.questionnaire?.[key] === 'Very Satisfied').length
      const s  = src.filter(r => r.questionnaire?.[key] === 'Satisfied').length
      const d  = src.filter(r => r.questionnaire?.[key] === 'Dissatisfied').length
      const n  = vs + s + d
      return { key, label, vs, s, d, n, vsPct: n ? vs/n*100 : 0, sPct: n ? s/n*100 : 0, dPct: n ? d/n*100 : 0 }
    })

  const buildReasonCounts = (src: ExitInterviewRecord[], type: 'inv' | 'vol') => {
    const m: Record<string, number> = {}
    src.forEach(r => {
      const arr = type === 'inv' ? r.involuntaryReasons : r.voluntaryReasons
      arr?.forEach(v => { m[v] = (m[v] ?? 0) + 1 })
    })
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }

  const SatisfactionBars = ({ src }: { src: ExitInterviewRecord[] }) => {
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
              <div style={{ width:`${vsPct}%`, background:'#16a34a', transition:'width 0.4s', flexShrink:0 }} title={`Very Satisfied ${Math.round(vsPct)}%`} />
              <div style={{ width:`${sPct}%`,  background:'#d97706', transition:'width 0.4s', flexShrink:0 }} title={`Satisfied ${Math.round(sPct)}%`} />
              <div style={{ width:`${dPct}%`,  background:'#dc2626', transition:'width 0.4s', flexShrink:0 }} title={`Dissatisfied ${Math.round(dPct)}%`} />
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
  }

  const ReasonBars = ({ src, type }: { src: ExitInterviewRecord[]; type: 'inv'|'vol' }) => {
    const counts = buildReasonCounts(src, type)
    const max = counts[0]?.[1] ?? 1
    if (counts.length === 0) return <p style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle:'italic' }}>None recorded</p>
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {counts.map(([reason, count]) => (
          <div key={reason} style={{ display:'grid', gridTemplateColumns:'1fr 80px 28px', gap:6, alignItems:'center' }}>
            <span style={{ fontSize:'0.75rem', color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reason}</span>
            <div style={{ height:8, borderRadius:4, background:'#f1f5f9', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(count/max)*100}%`, background: type==='inv'?'#ef4444':'#6366f1', borderRadius:4, transition:'width 0.3s' }} />
            </div>
            <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#475569', textAlign:'right' }}>{count}</span>
          </div>
        ))}
      </div>
    )
  }

  // Per-employee: list of filtered records
  const filteredPersonRecords = useMemo(() => {
    const q = personSearch.toLowerCase().trim()
    if (!q) return records
    return records.filter(r => r.name.toLowerCase().includes(q) || r.employeeId.toLowerCase().includes(q))
  }, [records, personSearch])

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal ei-analytics-modal" role="dialog" aria-modal="true"
        style={{ display:'flex', flexDirection:'column', maxHeight:'90vh' }}>
        {/* ── Header ── */}
        <div style={{ background:'linear-gradient(135deg,#4338ca 0%,#7c3aed 100%)', flexShrink:0, padding:'18px 24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <p style={{ margin:'0 0 4px', fontSize:'0.7rem', fontWeight:700, color:'rgba(199,210,254,0.85)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Exit Interview Analytics</p>
              <h2 style={{ margin:0, color:'#fff', fontSize:'1.2rem', fontWeight:800 }}>
                {view === 'person' && selectedRecord ? selectedRecord.name : 'Analytics Dashboard'}
              </h2>
            </div>
            <button className="icon-button" onClick={onClose} type="button"
              style={{ color:'#fff', background:'rgba(255,255,255,0.15)', borderRadius:8, fontSize:'1.1rem', width:34, height:34, flexShrink:0 }}>×</button>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
            <p style={{ margin:0, fontSize:'0.8rem', color:'rgba(199,210,254,0.8)' }}>
              {total} interview{total!==1?'s':''} &nbsp;·&nbsp; {completed.length} completed &nbsp;·&nbsp; {skipped.length} skipped &nbsp;·&nbsp; {rehireCount} rehire-eligible
            </p>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {!(view === 'person' && selectedRecord) && (
                <div style={{ display:'flex', background:'rgba(255,255,255,0.12)', borderRadius:8, padding:3, gap:2 }}>
                  {(['overall','person'] as const).map(v => (
                    <button key={v} type="button" onClick={() => { setView(v); setSelectedRecord(null) }}
                      style={{ padding:'6px 16px', borderRadius:6, border:'none', fontSize:'0.78rem', fontWeight:700, cursor:'pointer',
                        background: view===v ? '#fff' : 'transparent',
                        color:      view===v ? '#4338ca' : 'rgba(255,255,255,0.85)' }}>
                      {v === 'overall' ? 'Overall' : 'Per Employee'}
                    </button>
                  ))}
                </div>
              )}
              {view === 'person' && selectedRecord && (
                <button type="button" onClick={() => setSelectedRecord(null)}
                  style={{ padding:'6px 16px', borderRadius:8, border:'none', fontSize:'0.78rem', fontWeight:700, cursor:'pointer', background:'rgba(255,255,255,0.15)', color:'#fff' }}>
                  ← Back
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Body — single scrollable area ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 20px' }}>
          {total === 0
            ? <div style={{ textAlign:'center', padding:'40px 0', color:'#94a3b8' }}>No exit interview data to analyse.</div>
            : (
              <>
                {/* OVERALL VIEW */}
                {view === 'overall' && (
                  <>
                    {/* KPI row */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                      {[
                        { label:'Total', n:total,            color:'#4338ca', bg:'#eef2ff', border:'#c7d2fe' },
                        { label:'Completed', n:completed.length, color:'#15803d', bg:'#f0fdf4', border:'#86efac' },
                        { label:'Skipped',   n:skipped.length,   color:'#b45309', bg:'#fffbeb', border:'#fde68a' },
                        { label:'Rehire Eligible', n:rehireCount, color:'#0369a1', bg:'#f0f9ff', border:'#bae6fd' },
                      ].map(k => (
                        <div key={k.label} style={{ background:k.bg, border:`1.5px solid ${k.border}`, borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
                          <div style={{ fontSize:'1.6rem', fontWeight:900, color:k.color, lineHeight:1 }}>{k.n}</div>
                          <div style={{ fontSize:'0.65rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginTop:4 }}>{k.label}</div>
                        </div>
                      ))}
                    </div>

                    <SatisfactionBars src={completed} />

                    {/* Reasons grid */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px' }}>
                        <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Involuntary Exits</div>
                        <ReasonBars src={records} type="inv" />
                      </div>
                      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px' }}>
                        <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#6366f1', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Voluntary Exits</div>
                        <ReasonBars src={records} type="vol" />
                      </div>
                    </div>

                    {/* Exits by department */}
                    {(() => {
                      const deptMap: Record<string, number> = {}
                      records.forEach(r => { if (r.department) deptMap[r.department] = (deptMap[r.department] ?? 0) + 1 })
                      const sorted = Object.entries(deptMap).sort((a,b) => b[1]-a[1])
                      const max = sorted[0]?.[1] ?? 1
                      return sorted.length > 0 ? (
                        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px', marginBottom:14 }}>
                          <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Exits by Department</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                            {sorted.map(([dept, count]) => (
                              <div key={dept} style={{ display:'grid', gridTemplateColumns:'1fr 80px 28px', gap:6, alignItems:'center' }}>
                                <span style={{ fontSize:'0.75rem', color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{dept}</span>
                                <div style={{ height:8, borderRadius:4, background:'#f1f5f9', overflow:'hidden' }}>
                                  <div style={{ height:'100%', width:`${(count/max)*100}%`, background:'#6366f1', borderRadius:4 }} />
                                </div>
                                <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#475569', textAlign:'right' }}>{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null
                    })()}

                    {/* Rehire eligibility */}
                    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px' }}>
                      <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Rehire Eligibility</div>
                      <div style={{ display:'flex', gap:10 }}>
                        <div style={{ flex:1, background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:8, padding:'10px', textAlign:'center' }}>
                          <div style={{ fontSize:'1.3rem', fontWeight:900, color:'#15803d' }}>{rehireCount}</div>
                          <div style={{ fontSize:'0.65rem', color:'#15803d', fontWeight:700, textTransform:'uppercase' }}>Eligible</div>
                        </div>
                        <div style={{ flex:1, background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:8, padding:'10px', textAlign:'center' }}>
                          <div style={{ fontSize:'1.3rem', fontWeight:900, color:'#dc2626' }}>{total - rehireCount}</div>
                          <div style={{ fontSize:'0.65rem', color:'#dc2626', fontWeight:700, textTransform:'uppercase' }}>Not Eligible</div>
                        </div>
                        <div style={{ flex:2, background:'#f8fafc', borderRadius:8, padding:'10px', overflow:'hidden' }}>
                          <div style={{ height:18, borderRadius:9, overflow:'hidden', background:'#fca5a5', marginBottom:6 }}>
                            <div style={{ height:'100%', width: total>0?`${(rehireCount/total)*100}%`:'0%', background:'#16a34a', borderRadius:9, transition:'width 0.4s' }} />
                          </div>
                          <div style={{ fontSize:'0.68rem', color:'#64748b' }}>{total>0?Math.round((rehireCount/total)*100):0}% eligible</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* PER EMPLOYEE VIEW — list */}
                {view === 'person' && !selectedRecord && (
                  <>
                    <div style={{ marginBottom:12 }}>
                      <label className="search-field" style={{ maxWidth:380 }}>
                        <span>Search</span>
                        <input type="text" value={personSearch} onChange={e => setPersonSearch(e.target.value)}
                          placeholder="Name or employee ID…" />
                      </label>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {filteredPersonRecords.length === 0
                        ? <p style={{ textAlign:'center', color:'#94a3b8', padding:'24px 0' }}>No records match the search.</p>
                        : filteredPersonRecords.map(r => (
                          <div key={r.id} onClick={() => setSelectedRecord(r)}
                            style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'11px 14px',
                              cursor:'pointer', display:'flex', alignItems:'center', gap:12,
                              transition:'border-color 0.15s, box-shadow 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor='#a5b4fc'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 8px rgba(99,102,241,0.12)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='#e2e8f0'; (e.currentTarget as HTMLDivElement).style.boxShadow='none' }}>
                            <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4338ca)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'1rem', flexShrink:0 }}>
                              {(r.name[0] ?? '').toUpperCase()}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#1e1b4b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</div>
                              <div style={{ fontSize:'0.72rem', color:'#64748b' }}>{r.employeeId} · {r.department} · {r.designation}</div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                              <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'2px 8px', borderRadius:5,
                                background: r.skipped ? '#fef3c7' : '#dcfce7',
                                color:      r.skipped ? '#92400e' : '#15803d' }}>
                                {r.skipped ? 'Skipped' : 'Completed'}
                              </span>
                              <span style={{ fontSize:'0.68rem', color:'#94a3b8' }}>{formatDateDisplay(r.departureDate)}</span>
                            </div>
                            <span style={{ color:'#94a3b8', fontSize:'0.9rem', flexShrink:0 }}>›</span>
                          </div>
                        ))
                      }
                    </div>
                  </>
                )}

                {/* PER EMPLOYEE VIEW — detail */}
                {view === 'person' && selectedRecord && (
                  <>
                    {/* Employee card */}
                    <div style={{ background:'linear-gradient(135deg,#7c3aed 0%,#4338ca 100%)', borderRadius:12, padding:'14px 18px', color:'#fff', marginBottom:14, display:'flex', gap:14, alignItems:'center' }}>
                      <div style={{ width:46, height:46, borderRadius:'50%', background:'rgba(255,255,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', fontWeight:900, flexShrink:0 }}>
                        {(selectedRecord.name[0] ?? '').toUpperCase()}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:'1rem' }}>{selectedRecord.name}</div>
                        <div style={{ fontSize:'0.78rem', opacity:0.8 }}>{selectedRecord.employeeId} · {selectedRecord.department} · {selectedRecord.designation}</div>
                        <div style={{ fontSize:'0.73rem', opacity:0.7, marginTop:2 }}>
                          Departed: {formatDateDisplay(selectedRecord.departureDate)} · Service: {selectedRecord.periodOfService || '—'} · Rehire: {selectedRecord.rehireEligible ? '✓ Yes' : '✗ No'}
                        </div>
                      </div>
                      <span style={{ background: selectedRecord.skipped ? '#fef3c7' : 'rgba(255,255,255,0.2)', color: selectedRecord.skipped ? '#92400e' : '#fff', padding:'3px 10px', borderRadius:8, fontSize:'0.74rem', fontWeight:700, flexShrink:0 }}>
                        {selectedRecord.skipped ? `Skipped: ${selectedRecord.skipReason}` : 'Completed'}
                      </span>
                    </div>

                    {!selectedRecord.skipped && (
                      <>
                        <SatisfactionBars src={[selectedRecord]} />
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px' }}>
                            <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Involuntary Reasons</div>
                            <ReasonBars src={[selectedRecord]} type="inv" />
                            {selectedRecord.invOther && <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:6, fontStyle:'italic' }}>Other: {selectedRecord.invOther}</div>}
                          </div>
                          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px' }}>
                            <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#6366f1', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Voluntary Reasons</div>
                            <ReasonBars src={[selectedRecord]} type="vol" />
                            {selectedRecord.volOther && <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:6, fontStyle:'italic' }}>Other: {selectedRecord.volOther}</div>}
                          </div>
                        </div>
                        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px', marginBottom:14 }}>
                          <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Interview Responses</div>
                          {eiShortQuestions.map((q, i) => {
                            const ans = selectedRecord[`q${i+1}` as keyof ExitInterviewRecord] as string
                            return ans ? (
                              <div key={i} style={{ marginBottom:10, borderBottom:'1px solid #f1f5f9', paddingBottom:8 }}>
                                <div style={{ fontSize:'0.73rem', fontWeight:700, color:'#6366f1', marginBottom:2 }}>{i+1}. {q}</div>
                                <div style={{ fontSize:'0.82rem', color:'#374151', lineHeight:1.5 }}>{ans}</div>
                              </div>
                            ) : null
                          })}
                          {selectedRecord.employeeComments && (
                            <div style={{ marginTop:8, background:'#f8fafc', borderRadius:8, padding:'8px 12px' }}>
                              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b', marginBottom:4 }}>Employee Comments</div>
                              <div style={{ fontSize:'0.82rem', color:'#374151' }}>{selectedRecord.employeeComments}</div>
                            </div>
                          )}
                        </div>
                        {selectedRecord.areasToImprove && (
                          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px' }}>
                            <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Areas to Improve</div>
                            <p style={{ fontSize:'0.82rem', color:'#374151', margin:0 }}>{selectedRecord.areasToImprove}</p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
        </div>

        <div className="modal-actions" style={{ flexShrink:0 }}>
          <button className="quiet-button light" onClick={onClose} type="button">Close</button>
        </div>
      </section>
    </div>
  )
}

function ExitInterviewSection({ records, onUpdate, employees, isHOD = false }: {
  records: ExitInterviewRecord[]
  onUpdate: (fn: (prev: ExitInterviewRecord[]) => ExitInterviewRecord[]) => void
  employees: Employee[]
  isHOD?: boolean
}) {
  const [monthFilter, setMonthFilter] = useState('All')
  const [deptFilter, setDeptFilter] = useState('All Sections')
  const [editing, setEditing] = useState<ExitInterviewRecord | null>(null)
  const [editingReadOnly, setEditingReadOnly] = useState(false)
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

  const eiStatus = (r: ExitInterviewRecord): 'Completed' | 'Skipped' | 'Draft' =>
    r.skipped ? 'Skipped'
    : (r.questionnaire && Object.values(r.questionnaire).every(v => v !== '')) ? 'Completed'
    : 'Draft'

  const save = (r: ExitInterviewRecord) => {
    onUpdate((prev) => {
      const idx = prev.findIndex((x) => x.id === r.id)
      return idx >= 0 ? prev.map((x) => x.id === r.id ? r : x) : [r, ...prev]
    })
    setEditing(null)
    setEditingReadOnly(false)
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
                    <td className="name-cell"><button className="name-link" type="button" onClick={() => { setEditing(r); setEditingReadOnly(isHOD) }}>{r.name}</button></td>
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
                        background: status === 'Completed' ? '#dcfce7' : status === 'Skipped' ? '#f1f5f9' : '#fef3c7',
                        color: status === 'Completed' ? '#15803d' : status === 'Skipped' ? '#64748b' : '#92400e',
                      }}>{status}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="action-glyph" title="View / Print" onClick={() => { setEditing(r); setEditingReadOnly(true) }} type="button">👁</button>
                        <button className="action-glyph vwh" title="Open Form" onClick={() => { setEditing(r); setEditingReadOnly(false) }} type="button">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                        </button>
                        <button className="action-glyph delete vwh" title="Delete" onClick={() => del(r.id)} type="button">🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {showAnalytics && <ExitInterviewAnalyticsModal records={filtered} onClose={() => setShowAnalytics(false)} />}
      {editing && <ExitInterviewFormModal record={editing} employees={employees} viewOnly={editingReadOnly} onClose={() => { setEditing(null); setEditingReadOnly(false) }} onSave={save} />}
    </>
  )
}

function TerminationPage({
  noticeTerminations,
  completedTerminations,
  exitInterviews,
  employees,
  onAdd,
  onEdit,
  onSetStage,
  onDelete,
  onViewDetails,
  onUpdateExitInterviews,
  isHOD = false,
}: {
  noticeTerminations: EnhancedTerminationRecord[]
  completedTerminations: CompletedTerminationRecord[]
  exitInterviews: ExitInterviewRecord[]
  employees: Employee[]
  onAdd: () => void
  onEdit: (record: EnhancedTerminationRecord) => void
  onSetStage: (id: string, stage: TerminationStage) => void
  onDelete: (id: string) => void
  onViewDetails: (record: EnhancedTerminationRecord | CompletedTerminationRecord) => void
  onUpdateExitInterviews: (fn: (prev: ExitInterviewRecord[]) => ExitInterviewRecord[]) => void
  isHOD?: boolean
}) {
  const [activeTab, setActiveTab] = useState<TerminationTab>('notice')
  const [noticeSearch, setNoticeSearch] = useState('')
  const [completedSearch, setCompletedSearch] = useState('')
  const [noticeDepartmentFilter, setNoticeDepartmentFilter] = useState('All Departments')
  const [completedDepartmentFilter, setCompletedDepartmentFilter] = useState('All Departments')
  const [noticeStageFilter, setNoticeStageFilter] = useState<'All' | TerminationStage>('All')
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null)

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
              <label className="search-field"><span>Search</span><input onChange={(e) => setNoticeSearch(e.target.value)} placeholder="Employee, ID, department…" type="text" value={noticeSearch} /></label>
              <label><span>Section</span><select onChange={(e) => setNoticeDepartmentFilter(e.target.value)} value={noticeDepartmentFilter}>{noticeDepartments.map((d) => <option key={d}>{d}</option>)}</select></label>
              <label><span>Stage</span><select onChange={(e) => setNoticeStageFilter(e.target.value === 'All' ? 'All' : e.target.value as TerminationStage)} value={noticeStageFilter}><option value="All">All Stages</option>{allTerminationStages.map((s) => <option key={s}>{s}</option>)}</select></label>
              <button className="primary-button toolbar-add-btn vwh" onClick={onAdd} type="button">+ Add</button>
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
                      const stages = getStagesForNationality(r.nationality)
                      const stageIdx = stages.indexOf(r.currentStage)
                      const isLast = stageIdx === stages.length - 1
                      const nextStage = isLast ? null : stages[stageIdx + 1]
                      const isExp = expandedTermId === r.id
                      return (
                        <Fragment key={r.id}>
                          <tr className={`termination-row lr-row${isExp ? ' lr-row-open' : ''}`} onClick={() => setExpandedTermId(isExp ? null : r.id)}>
                            <td className="lr-expand-td"><span className={`mc-arrow${isExp ? ' mc-arrow-open' : ''}`}>›</span></td>
                            <td className="term-empid">{r.employeeId}</td>
                            <td className="name-cell" onClick={(e) => e.stopPropagation()}>{r.name}</td>
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
                                <button className="action-glyph edit vwh" onClick={() => onEdit(r)} type="button" title="Edit">✎</button>
                                <button className="action-glyph delete vwh" onClick={() => onDelete(r.id)} type="button" title="Delete">🗑</button>
                              </div>
                            </td>
                          </tr>
                          {isExp && (
                            <tr className="lr-pipeline-row">
                              <td colSpan={11}>
                                {/* Visual pipeline with dates for all stages */}
                                <div className="lr-pipeline" style={{ margin: '8px 8px 4px', borderRadius: 8 }}>
                                  {stages.map((stage, i) => {
                                    const isDone = i < stageIdx
                                    const isCurrent = i === stageIdx
                                    const cls = isDone ? 'lr-done' : isCurrent ? 'lr-current' : 'lr-future'
                                    const stageDate = r.stageDates?.[stage]
                                      ?? (stage === 'Letter Submitted' ? r.dateSubmitted
                                        : stage === 'Pending Departure' ? r.departureDate
                                        : undefined)
                                    return (
                                      <Fragment key={stage}>
                                        <button
                                          className={`lr-pip-step ${cls}`}
                                          onClick={(e) => { e.stopPropagation(); onSetStage(r.id, stage) }}
                                          type="button"
                                          title={`Set to: ${stage}`}
                                        >
                                          <div className="lr-pip-circle">{isDone ? '✓' : i + 1}</div>
                                          <div className="lr-pip-label">{stage}</div>
                                          <div className="lr-pip-date">{stageDate ? formatDateDisplay(stageDate) : (isDone || isCurrent ? '—' : '')}</div>
                                        </button>
                                        {i < stages.length - 1 && (
                                          <div className={`lr-pip-line ${isDone ? 'lr-pip-line-done' : 'lr-pip-line-future'}`} />
                                        )}
                                      </Fragment>
                                    )
                                  })}
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
              <label className="search-field"><span>Search</span><input onChange={(e) => setCompletedSearch(e.target.value)} placeholder="Employee, ID, department…" type="text" value={completedSearch} /></label>
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
                        <td className="name-cell">{r.name}</td>
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
            employees={employees}
            isHOD={isHOD}
          />
        )}
      </section>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════
   MEETING MINUTES MODULE
   ══════════════════════════════════════════════════════════════ */

function calcMeetingHeadcount(
  dept: { label: string; appDepts: readonly string[] },
  employees: Employee[],
  activeLeaves: ActiveLeaveRecord[]
) {
  const lower = dept.appDepts.map((d: string) => d.toLowerCase())
  const inDept = employees.filter(e => lower.includes(e.department.toLowerCase()))
  const activeLeaveIds = new Set(activeLeaves.map(l => l.employeeId))
  const onDuty     = inDept.filter(e => e.siteStatus === 'On Site').length
  const notInSite  = inDept.filter(e => e.siteStatus === 'Off Site').length
  const onLeave    = inDept.filter(e => e.siteStatus === 'On Leave' || activeLeaveIds.has(e.employeeId)).length
  return { onDuty, notInSite, sickLeave: 0, onLeave, total: onDuty + notInSite + onLeave }
}

function printMeetingMinutes(record: MeetingRecord, employees: Employee[], activeLeaves: ActiveLeaveRecord[]) {
  const esc = (s: string) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const pad2 = (n: number) => String(n).padStart(2, '0')

  const fmtMeetingDate = (d: string) => {
    if (!d) return ''
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const dt  = new Date(d + 'T12:00:00')
    const day = dt.getDate()
    const ord = (day===1||day===21||day===31)?'st':(day===2||day===22)?'nd':(day===3||day===23)?'rd':'th'
    return `${day}<sup style="font-size:0.65em;vertical-align:super;">${ord}</sup> ${months[dt.getMonth()]} ${dt.getFullYear()}, ${days[dt.getDay()]}`
  }

  const attended   = record.reps.filter(r => r.attendance === 'Attended' && r.name.trim())
  const onLeaveR   = record.reps.filter(r => r.attendance === 'On Leave' && r.name.trim())
  const absentR    = record.reps.filter(r => r.attendance === 'Absent'   && r.name.trim())

  // Replacements attend on behalf of on-leave / absent reps
  const replacements = record.reps
    .filter(r => r.attendance !== 'Attended' && r.replacementName?.trim())
    .map(r => ({ ...r, name: r.replacementName, designation: r.replacementDesignation }))

  const allAttended = [...attended, ...replacements]

  // Participants table — 3 columns: Name (46%) | Designation (44%) | Section code (10%)
  const pTableRows = allAttended.map(r => `<tr>
    <td style="padding:2.5pt 5pt;border:0.5pt solid #ddd;width:46%;font-size:8pt;">${esc(r.name)}</td>
    <td style="padding:2.5pt 5pt;border:0.5pt solid #ddd;width:44%;font-size:7.5pt;color:#444;">${esc(r.designation)}</td>
    <td style="padding:2.5pt 4pt;border:0.5pt solid #ddd;width:10%;text-align:center;font-weight:700;font-size:8pt;">${esc(r.deptCode)}</td>
  </tr>`).join('')

  const repRows = (list: MeetingRep[], emptyRows = 2) => list.length === 0
    ? Array(emptyRows).fill(`<tr><td colspan="3" style="padding:5pt;">&nbsp;</td></tr>`).join('')
    : list.map(r => `<tr>
        <td style="padding:2.5pt 5pt;border:0.5pt solid #ddd;width:46%;font-size:8pt;">${esc(r.name)}</td>
        <td style="padding:2.5pt 5pt;border:0.5pt solid #ddd;width:44%;font-size:7.5pt;color:#444;">${esc(r.reason || (r.attendance === 'On Leave' ? 'Annual Leave' : ''))}${r.replacementName?.trim() ? ` <em style="color:#666;">(Replacement: ${esc(r.replacementName)})</em>` : ''}</td>
        <td style="padding:2.5pt 4pt;border:0.5pt solid #ddd;width:10%;text-align:center;font-weight:700;font-size:8pt;">${esc(r.deptCode)}</td>
      </tr>`).join('')

  const hcRows = HEADCOUNT_DEPTS.map(dept => {
    const { onDuty, notInSite, sickLeave, onLeave, total } = calcMeetingHeadcount(dept, employees, activeLeaves)
    return `<tr>
      <td style="padding:4pt 6pt;font-size:9pt;border:0.5pt solid #bbb;">${esc(dept.label)}</td>
      <td style="text-align:center;padding:4pt;font-size:9pt;border:0.5pt solid #bbb;">${pad2(onDuty)}</td>
      <td style="text-align:center;padding:4pt;font-size:9pt;border:0.5pt solid #bbb;">${pad2(notInSite)}</td>
      <td style="text-align:center;padding:4pt;font-size:9pt;border:0.5pt solid #bbb;">${pad2(sickLeave)}</td>
      <td style="text-align:center;padding:4pt;font-size:9pt;border:0.5pt solid #bbb;">${pad2(onLeave)}</td>
      <td style="text-align:center;padding:4pt;font-size:9pt;border:0.5pt solid #bbb;font-weight:700;">${pad2(total)}</td>
    </tr>`
  }).join('')

  const totOnDuty    = employees.filter(e => e.siteStatus === 'On Site').length
  const totNotInSite = employees.filter(e => e.siteStatus === 'Off Site').length
  const totOnLeave   = employees.filter(e => e.siteStatus === 'On Leave').length
  const grandTotal   = totOnDuty + totNotInSite + totOnLeave

  // Always render all MEETING_DEPTS sections — empty ones show Nil
  // Administration and Human Resources attend all meetings but don't have section-level updates in print
  const PRINT_EXCLUDED_DEPTS = new Set(['ADMINISTRATION', 'HUMAN RESOURCES'])
  const deptHtml = MEETING_DEPTS
    .filter(md => !PRINT_EXCLUDED_DEPTS.has(md.label))
    .map(md => {
      const update = record.deptUpdates.find(d => d.dept === md.label)
      const bullets = (update?.points ?? '').split('\n').filter(p => p.trim())
        .map(p => `<li style="margin-bottom:4pt;font-size:9pt;">${esc(p.trim())}</li>`).join('')
      return `<div style="margin-bottom:12pt;">
      <div style="font-size:9pt;font-weight:700;text-decoration:underline;margin-bottom:4pt;">${esc(md.label)}</div>
      ${bullets
        ? `<ul style="margin:0;padding-left:16pt;">${bullets}</ul>`
        : `<p style="margin:0;font-size:9pt;color:#888;">Nil</p>`}
    </div>`
    }).join('')
  // Additional ad-hoc section notes
  const additionalHtml = record.additionalSectionNotes?.trim()
    ? record.additionalSectionNotes.trim().split('\n').filter(l => l.trim())
        .map(l => `<li style="margin-bottom:4pt;font-size:9pt;">${esc(l.trim())}</li>`).join('')
    : ''

  // Agenda — fixed or custom
  const fmtAgendaDate = (d: string) => {
    if (!d) return '[DATE]'
    const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
    const dt = new Date(d + 'T12:00:00')
    const day = dt.getDate()
    const ord = (day===1||day===21||day===31)?'st':(day===2||day===22)?'nd':(day===3||day===23)?'rd':'th'
    return `${months[dt.getMonth()]} ${day}${ord}, ${dt.getFullYear()}`
  }

  const agendaHtml = (record.agendaType ?? 'standard') === 'custom' && record.customAgenda?.trim()
    ? `<ol style="margin:0 0 0 20pt;padding:0;">${record.customAgenda.trim().split('\n').filter(l=>l.trim()).map(l=>`<li style="margin-bottom:5pt;font-size:9pt;">${esc(l.trim())}</li>`).join('')}</ol>`
    : `<ol style="margin:0 0 0 20pt;padding:0;">
        <li style="margin-bottom:5pt;font-size:9pt;">REVIEW OF MINUTES FROM THE PREVIOUS MEETING HELD ON ${fmtAgendaDate(record.prevMeetingDate)}.</li>
        <li style="margin-bottom:5pt;font-size:9pt;">DISCUSSION OF ISSUES, UPDATES AND CHALLENGES FACED BY EACH SECTION.</li>
        <li style="margin-bottom:5pt;font-size:9pt;">ANY OTHER MATTERS THAT NEED TO BE ADDRESSED&hellip;</li>
      </ol>`

  // Letterhead image URL
  const letterheadUrl = `${window.location.origin}/letterhead.png`
  const refSeq = record.refNumber.split('/').pop() || ''

  // Dynamic approved-by role
  const approvedByRole = record.chairperson === CHAIRPERSON_OPTIONS[1].value ? 'Deputy General Manager' : 'General Manager'

  // Footer: title LEFT · page number CENTRE
  const pgFooter = (n: number) =>
    `<div style="display:flex;align-items:center;border-top:0.8pt solid #2f78c5;padding-top:5pt;margin-top:14pt;font-size:7.5pt;color:#2f78c5;">
      <span style="flex:1;letter-spacing:0.4pt;opacity:0.75;">BRIEFING MEETING MINUTES &mdash; ${esc(refSeq)}</span>
      <span style="flex:1;text-align:center;font-weight:800;">${n}</span>
      <span style="flex:1;"></span>
    </div>`

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Briefing Meeting Minutes — ${esc(record.refNumber)}</title>
<style>
  @page { size:A4 portrait; margin:5mm 18mm 14mm 18mm; }
  *,*::before,*::after { box-sizing:border-box; }
  body { font-family:Arial,Helvetica,sans-serif; font-size:9pt; color:#111; background:#e8e8e8; margin:0; padding:0; }
  .pbar { display:flex; align-items:center; gap:14px; padding:10px 20px; background:#1e1b4b; position:sticky; top:0; z-index:10; font-family:system-ui,sans-serif; font-size:13px; }
  .pbar button { padding:7px 18px; background:#6d28d9; color:#fff; border:none; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer; }
  .pbar span { color:rgba(221,214,254,0.7); font-size:12px; }
  .wrap { max-width:210mm; margin:20px auto; display:flex; flex-direction:column; gap:18px; padding-bottom:40px; }
  .page { background:#fff; box-shadow:0 4px 24px rgba(0,0,0,0.16); padding:5mm 18mm 14mm; }
  .info-tbl { width:100%; border-collapse:collapse; margin-bottom:12pt; }
  .info-tbl td { border:0.8pt solid #999; padding:4pt 8pt; font-size:9pt; vertical-align:top; }
  .info-tbl td.lbl { font-weight:700; white-space:nowrap; width:28mm; background:#f0f0f0; color:#111; font-size:8.5pt; }
  .p-tbl { width:100%; border-collapse:collapse; }
  .p-tbl th { background:#f0f0f0; border:0.5pt solid #ccc; padding:3pt 6pt; font-size:8pt; font-weight:700; text-align:left; }
  .p-tbl th.ctr { text-align:center; }
  .hc-tbl { width:100%; border-collapse:collapse; }
  .hc-tbl th { background:#4a7fb5; color:#fff; font-size:8pt; font-weight:700; padding:5pt 4pt; border:0.5pt solid #3a6f9f; text-align:center; }
  .hc-tbl th.lft { text-align:left; }
  .hc-tbl .tot td { font-weight:800; background:#f0f0f0; }
  @media print {
    body { background:#fff; }
    .pbar { display:none !important; }
    .wrap { max-width:none; margin:0; padding:0; gap:0; }
    .page { box-shadow:none; padding:0; }
    .pgbrk { page-break-before:always; }
  }
</style></head><body>
<div class="pbar">
  <button onclick="window.print()">🖨&nbsp; Print / Save as PDF</button>
  <span>Briefing Meeting Minutes — ${esc(record.refNumber)}</span>
</div>
<div class="wrap">

<div class="page">
  <div style="text-align:center;margin-top:0;margin-bottom:8pt;padding-bottom:6pt;border-bottom:1pt solid #d0d8ee;">
    <img src="${letterheadUrl}" alt="Villa Hakatha Pvt. Ltd. Letterhead"
         style="max-width:100%;width:auto;height:auto;max-height:110pt;display:inline-block;vertical-align:top;mix-blend-mode:multiply;"
         onerror="this.style.display='none'"/>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:baseline;padding-bottom:5pt;margin-bottom:0;">
    <span style="font-size:11pt;font-weight:900;text-transform:uppercase;letter-spacing:0.5pt;">Briefing Meeting Minutes</span>
    <span style="font-size:10pt;font-weight:700;">Ref: ${esc(record.refNumber)}</span>
  </div>
  <table class="info-tbl">
    <tr><td class="lbl">Date</td><td style="text-transform:uppercase;">${fmtMeetingDate(record.date)}</td></tr>
    <tr><td class="lbl">Time Started</td><td style="text-transform:uppercase;">${esc(record.timeStarted)} hrs.</td></tr>
    <tr><td class="lbl">Time Ended</td><td style="text-transform:uppercase;">${esc(record.timeEnded ? record.timeEnded + ' hrs.' : '—')}</td></tr>
    <tr><td class="lbl">Venue</td><td style="text-transform:uppercase;">${esc(record.venue)}</td></tr>
    <tr><td class="lbl">Chairperson</td><td style="font-weight:600;text-transform:uppercase;">${esc(record.chairperson)}</td></tr>
    <tr>
      <td class="lbl">Participants</td>
      <td style="padding:4pt 8pt;">
        <table class="p-tbl">
          <thead><tr>
            <th style="width:46%;">NAME</th>
            <th style="width:44%;">DESIGNATION</th>
            <th class="ctr" style="width:10%;">SECTION</th>
          </tr></thead>
          <tbody>${pTableRows || '<tr><td colspan="3" style="padding:5pt;color:#aaa;">—</td></tr>'}</tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td class="lbl">On Leave</td>
      <td style="padding:4pt 8pt;">
        <table class="p-tbl">
          <thead><tr><th style="width:46%;">NAME</th><th style="width:44%;">REASON / REPLACEMENT</th><th class="ctr" style="width:10%;">SECTION</th></tr></thead>
          <tbody>${repRows(onLeaveR)}</tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td class="lbl">Absentees</td>
      <td style="padding:4pt 8pt;">
        <table class="p-tbl">
          <thead><tr><th style="width:46%;">NAME</th><th style="width:44%;">REASON</th><th class="ctr" style="width:10%;">SECTION</th></tr></thead>
          <tbody>${repRows(absentR)}</tbody>
        </table>
      </td>
    </tr>
  </table>
  <div style="font-size:10pt;font-weight:800;margin-bottom:7pt;">Daily Headcount of Sections</div>
  <table class="hc-tbl">
    <thead><tr>
      <th class="lft">Section</th>
      <th>On Duty</th><th>Not in Site</th><th>Sick Leave</th><th>On Leave</th>
      <th>Total</th>
    </tr></thead>
    <tbody>${hcRows}</tbody>
    <tfoot><tr class="tot">
      <td style="padding:4pt 6pt;font-size:9pt;border:0.5pt solid #bbb;font-weight:800;">TOTAL</td>
      <td style="text-align:center;padding:4pt;font-size:9pt;border:0.5pt solid #bbb;">${pad2(totOnDuty)}</td>
      <td style="text-align:center;padding:4pt;font-size:9pt;border:0.5pt solid #bbb;">${pad2(totNotInSite)}</td>
      <td style="text-align:center;padding:4pt;font-size:9pt;border:0.5pt solid #bbb;">00</td>
      <td style="text-align:center;padding:4pt;font-size:9pt;border:0.5pt solid #bbb;">${pad2(totOnLeave)}</td>
      <td style="text-align:center;padding:4pt;font-size:9pt;border:0.5pt solid #bbb;font-weight:800;">${pad2(grandTotal)}</td>
    </tr></tfoot>
  </table>
  ${pgFooter(1)}
</div>

<div class="page pgbrk">
  <div style="font-size:9pt;font-weight:700;margin-bottom:12pt;padding-bottom:8pt;border-bottom:0.5pt solid #ccc;">The discussions and action points agreed during the meeting are as follows.</div>

  <div style="margin-bottom:14pt;">
    <div style="display:flex;align-items:baseline;gap:8pt;margin-bottom:6pt;">
      <span style="font-size:10pt;">&#9675;</span>
      <strong style="font-size:9pt;text-transform:uppercase;letter-spacing:0.3pt;">Agenda:</strong>
    </div>
    ${agendaHtml}
  </div>

  <div style="margin-bottom:14pt;">
    <div style="display:flex;align-items:baseline;gap:8pt;margin-bottom:10pt;">
      <span style="font-size:10pt;">&#9675;</span>
      <strong style="font-size:9pt;text-transform:uppercase;letter-spacing:0.3pt;">Discussion:</strong>
    </div>

    <div style="margin-bottom:14pt;padding-left:18pt;">
      <div style="font-size:9pt;font-weight:800;text-decoration:underline;text-transform:uppercase;margin-bottom:6pt;">
        1. Review of Minutes from the Previous Meeting Held on ${fmtAgendaDate(record.prevMeetingDate)}.
      </div>
      <div style="font-size:9pt;line-height:1.6;">${record.reviewNotes?.trim() ? esc(record.reviewNotes.trim()) : 'Highlighted: The minutes from the previous meeting were reviewed and accepted without any changes.'}</div>
    </div>

    <div style="margin-bottom:14pt;padding-left:18pt;">
      <div style="font-size:9pt;font-weight:800;text-decoration:underline;text-transform:uppercase;margin-bottom:10pt;">
        2. Discussion of Issues, Updates and Challenges Faced by Each Section:
      </div>
      ${deptHtml}
      ${additionalHtml ? `<div style="margin-bottom:12pt;"><div style="font-size:9pt;font-weight:700;text-decoration:underline;margin-bottom:4pt;">ADDITIONAL</div><ul style="margin:0;padding-left:16pt;">${additionalHtml}</ul></div>` : ''}
    </div>

    <div style="padding-left:18pt;">
      <div style="font-size:9pt;font-weight:800;text-decoration:underline;text-transform:uppercase;margin-bottom:8pt;">
        3. Any Other Matters That Need to Be Addressed:
      </div>
      <div style="font-size:9pt;white-space:pre-line;line-height:1.6;">${record.otherMatters.trim() ? esc(record.otherMatters) : '<span style="color:#888;font-style:italic;">None.</span>'}</div>
    </div>
  </div>

  <div style="page-break-inside:avoid;break-inside:avoid;">
    <div style="text-align:center;border:0.8pt solid #888;padding:7pt;margin:18pt 0;font-size:9pt;color:#555;font-style:italic;">We&rsquo;ll end the meeting if there&rsquo;s nothing else to discuss.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40pt;margin-top:12pt;">
      <div style="border:0.8pt solid #888;padding:12pt 14pt;">
        <div style="font-size:9pt;margin-bottom:22pt;">Prepared by:</div>
        <div style="border-bottom:0.8pt solid #888;margin-bottom:6pt;height:16pt;"></div>
        <div style="font-size:9pt;font-weight:700;">${esc(record.preparedBy)}</div>
        <div style="font-size:9pt;">Administrator</div>
      </div>
      <div style="border:0.8pt solid #888;padding:12pt 14pt;">
        <div style="font-size:9pt;margin-bottom:22pt;">Approved by:</div>
        <div style="border-bottom:0.8pt solid #888;margin-bottom:6pt;height:16pt;"></div>
        <div style="font-size:9pt;font-weight:700;">${esc(record.approvedBy)}</div>
        <div style="font-size:9pt;">${approvedByRole}</div>
      </div>
    </div>
  </div>
  ${pgFooter(2)}
</div>

</div></body></html>`
  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close() }
}

/* ─── MeetingFormModal ─────────────────────────────────────────── */
function MeetingFormModal({ record, employees, activeLeaves, onClose, onSave, viewOnly = false }: {
  record: MeetingRecord
  employees: Employee[]
  activeLeaves: ActiveLeaveRecord[]
  onClose: () => void
  onSave: (r: MeetingRecord) => void
  viewOnly?: boolean
}) {
  const isNew = record.id.includes('-new-')
  // Tab order: details → attendance → other (agenda) → minutes (section updates)
  const [tab, setTab] = useState<'details'|'attendance'|'other'|'minutes'>('details')
  const [date,        setDate]        = useState(record.date)
  const [timeStarted, setTimeStarted] = useState(record.timeStarted)
  const [timeEnded,   setTimeEnded]   = useState(record.timeEnded)
  const [chairperson, setChairperson] = useState(record.chairperson)
  const [status,      setStatus]      = useState<'Draft'|'Final'>(record.status)
  const [approvedBy,  setApprovedBy]  = useState(record.approvedBy)
  const [reps,        setReps]        = useState<MeetingRep[]>(record.reps)
  const [deptUpdates,     setDeptUpdates]     = useState<MeetingDeptUpdate[]>(
    // Ensure all current MEETING_DEPTS sections are present
    MEETING_DEPTS.map(md => record.deptUpdates.find(d => d.dept === md.label) ?? { dept: md.label, points: '' })
  )
  const [prevMeetingDate, setPrevMeetingDate] = useState(record.prevMeetingDate ?? '')
  const [agendaType,      setAgendaType]      = useState<'standard'|'custom'>(record.agendaType ?? 'standard')
  const [customAgenda,    setCustomAgenda]    = useState(record.customAgenda ?? '')
  const [reviewNotes,            setReviewNotes]            = useState(record.reviewNotes ?? '')
  const [additionalSectionNotes, setAdditionalSectionNotes] = useState(record.additionalSectionNotes ?? '')
  const [additionalNotesOpen,    setAdditionalNotesOpen]    = useState(false)
  const [otherMatters,           setOtherMatters]           = useState(record.otherMatters)
  const [confirmFinal,    setConfirmFinal]    = useState(false)

  // Fixed: venue and preparedBy are not editable
  const FIXED_VENUE = 'Villa Hakatha Pvt Ltd, Thilafushi, Meeting Room'
  const FIXED_PREPARED_BY = 'ARUSHULLA RASHID'

  const buildCurrent = (overrideStatus?: 'Draft'|'Final'): MeetingRecord => ({
    ...record, date, timeStarted, timeEnded,
    venue: FIXED_VENUE,
    chairperson, status: overrideStatus ?? status,
    preparedBy: FIXED_PREPARED_BY,
    approvedBy, reps, deptUpdates, prevMeetingDate,
    agendaType, customAgenda, reviewNotes, additionalSectionNotes, otherMatters
  })

  const updateRep = (id: string, field: keyof MeetingRep, value: string) =>
    setReps(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))

  const updateDeptPts = (dept: string, points: string) =>
    setDeptUpdates(prev => prev.map(d => d.dept === dept ? { ...d, points } : d))

  // When chairperson changes: sync approvedBy + swap GM/DGM in reps
  const buildGmDgmRep = (empId: string, meetingDept: string, deptCode: string, attendance: MeetingAttendance, reason: string): MeetingRep => {
    const emp = employees.find(e => e.employeeId === empId)
    return {
      id: `rep-${deptCode.toLowerCase()}`,
      name: emp?.fullName ?? (deptCode === 'GM' ? 'ALI DIDI' : 'HUSSAIN SHAHID'),
      designation: emp?.designation ?? (deptCode === 'GM' ? 'GENERAL MANAGER' : 'DEPUTY GENERAL MANAGER'),
      meetingDept, deptCode, attendance, reason,
      replacementName: '', replacementDesignation: '', replacementId: '',
    }
  }

  const handleChairpersonSelect = (opt: typeof CHAIRPERSON_OPTIONS[number]) => {
    setChairperson(opt.value)
    setApprovedBy(opt.approvedBy)
    const isGMChair = opt.value === CHAIRPERSON_OPTIONS[0].value
    setReps(prev => {
      const base = prev.filter(r => r.id !== 'rep-gm' && r.id !== 'rep-dgm')
      if (isGMChair) {
        // GM chairs → DGM attends as participant
        return [buildGmDgmRep(DGM_ID, 'DEPUTY GENERAL MANAGER', 'DGM', 'Attended', ''), ...base]
      } else {
        // DGM chairs → GM is absent (only chairs when GM unavailable)
        return [buildGmDgmRep(GM_ID, 'GENERAL MANAGER', 'GM', 'Absent', 'Not Available'), ...base]
      }
    })
  }

  // Replacement by employee ID — auto-lookup name/designation
  const handleReplacementId = (repId: string, empId: string) => {
    updateRep(repId, 'replacementId', empId)
    const emp = employees.find(e => e.employeeId === empId.trim())
    if (emp) {
      updateRep(repId, 'replacementName', emp.fullName)
      updateRep(repId, 'replacementDesignation', emp.designation)
    }
  }

  const inp:   React.CSSProperties = { padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.83rem', background:'#fff', width:'100%', boxSizing:'border-box' }
  const inpRO: React.CSSProperties = { ...inp, background:'#f8fafc', color:'#64748b', cursor:'not-allowed' }
  const ta:    React.CSSProperties = { ...inp, resize:'vertical', minHeight:'72px', fontFamily:'inherit', lineHeight:'1.5' }

  const tabLabels: Record<string, string> = {
    details: 'Meeting Details', attendance: 'Attendance',
    other: 'Agenda & Other', minutes: 'Section Minutes',
  }

  const handleSave = (targetStatus?: 'Draft'|'Final') => {
    onSave(buildCurrent(targetStatus))
  }

  const handleMarkFinal = () => {
    if (record.status === 'Final' && !confirmFinal) {
      // already final — just save
      handleSave('Final'); return
    }
    setConfirmFinal(true)
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="registration-modal" style={{ width:'94vw', maxWidth:'960px', height:'88vh', maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', padding:0, borderRadius:16 }}>

        {/* Confirm Final popup */}
        {confirmFinal && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', zIndex:20, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:16 }}>
            <div style={{ background:'#fff', borderRadius:14, padding:'28px 32px', maxWidth:380, textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize:'2rem', marginBottom:8 }}>📋</div>
              <h3 style={{ margin:'0 0 10px', color:'#1e1b4b', fontSize:'1rem', fontWeight:800 }}>Confirm — Mark as Final</h3>
              <p style={{ margin:'0 0 20px', fontSize:'0.84rem', color:'#64748b', lineHeight:1.5 }}>
                This will mark the meeting record as <strong>Final</strong>. Once finalized, changes should only be made with caution.
              </p>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button type="button" className="primary-button" onClick={() => { setConfirmFinal(false); handleSave('Final') }}>
                  ✓ Yes, Mark as Final
                </button>
                <button type="button" className="quiet-button" onClick={() => setConfirmFinal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f5f9', flexShrink:0, display:'flex', alignItems:'center', gap:12 }}>
          <div>
            <h2 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'#1e1b4b' }}>
              {isNew ? 'New Meeting Minutes' : viewOnly ? `View — ${record.refNumber}` : `Edit — ${record.refNumber}`}
            </h2>
            <p style={{ margin:'2px 0 0', fontSize:'0.72rem', color:'#64748b' }}>HOD Briefing Meeting Record</p>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
            <button type="button" className="quiet-button" style={{ fontSize:'0.76rem', padding:'5px 12px' }}
              onClick={() => printMeetingMinutes(buildCurrent(), employees, activeLeaves)}>
              🖨 Preview &amp; Print
            </button>
            <button type="button" className="quiet-button" onClick={onClose} style={{ padding:'5px 10px' }}>✕</button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:2, padding:'0 20px', borderBottom:'1px solid #f1f5f9', flexShrink:0, background:'#fafbff' }}>
          {(['details','attendance','other','minutes'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              style={{ padding:'9px 16px', fontSize:'0.78rem', fontWeight:tab===t?800:600, color:tab===t?'#4f46e5':'#64748b',
                borderBottom: tab===t?'2px solid #4f46e5':'2px solid transparent', background:'transparent',
                border:'none', borderRadius:0, cursor:'pointer', transition:'color 120ms' }}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:'18px 20px' }}>
        <fieldset disabled={viewOnly} style={{ border:'none', margin:0, padding:0 }}>

          {/* ── TAB: Meeting Details ── */}
          {tab === 'details' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {/* Ref — read-only */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#374151' }}>Reference Number <span style={{ fontWeight:400, color:'#94a3b8' }}>(auto)</span></span>
                  <input style={inpRO} value={record.refNumber} readOnly />
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#374151' }}>Status</span>
                  <div style={{ display:'flex', gap:6 }}>
                    {(['Draft','Final'] as const).map(s => (
                      <button key={s} type="button"
                        onClick={() => s === 'Final' ? handleMarkFinal() : setStatus('Draft')}
                        style={{ flex:1, padding:'7px 0', borderRadius:7, fontSize:'0.82rem', fontWeight:700, cursor:'pointer',
                          background: status === s ? (s==='Final'?'#15803d':'#d97706') : '#f1f5f9',
                          color:      status === s ? '#fff' : '#94a3b8',
                          border:     status === s ? 'none' : '1.5px solid #e2e8f0' }}>
                        {s === 'Final' ? '✓ Final' : '✏ Draft'}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#374151' }}>Date</span>
                  <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#374151' }}>Time Started</span>
                  <input type="time" style={inp} value={timeStarted} onChange={e => setTimeStarted(e.target.value)} />
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#374151' }}>Time Ended</span>
                  <input type="time" style={inp} value={timeEnded} onChange={e => setTimeEnded(e.target.value)} />
                </label>
              </div>
              {/* Venue — fixed, read-only */}
              <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#374151' }}>Venue <span style={{ fontWeight:400, color:'#94a3b8' }}>(fixed)</span></span>
                <input style={inpRO} value={FIXED_VENUE} readOnly />
              </label>
              {/* Chairperson — quick-pick + approvedBy sync */}
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#374151' }}>Chairperson</span>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {CHAIRPERSON_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => handleChairpersonSelect(opt)}
                      style={{ fontSize:'0.72rem', padding:'5px 14px', borderRadius:7, cursor:'pointer', fontWeight:600,
                        background: chairperson === opt.value ? '#1e1b4b' : '#f1f5f9',
                        color:      chairperson === opt.value ? '#fff'    : '#374151',
                        border:     chairperson === opt.value ? '1.5px solid #1e1b4b' : '1.5px solid #e2e8f0' }}>
                      {opt.label} <span style={{ opacity:0.65, fontWeight:400 }}>({opt.role})</span>
                    </button>
                  ))}
                </div>
                <input style={{ ...inp, marginTop:4 }} value={chairperson} onChange={e => setChairperson(e.target.value)} placeholder="Or type custom chairperson…" />
              </div>
              {/* Prepared By — fixed; Approved By — synced from chairperson */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#374151' }}>Prepared By <span style={{ fontWeight:400, color:'#94a3b8' }}>(fixed)</span></span>
                  <input style={inpRO} value={FIXED_PREPARED_BY} readOnly />
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#374151' }}>Approved By</span>
                  <input style={inp} value={approvedBy} onChange={e => setApprovedBy(e.target.value)} />
                </label>
              </div>
            </div>
          )}

          {/* ── TAB: Attendance ── */}
          {tab === 'attendance' && (
            <div>
              <p style={{ margin:'0 0 12px', fontSize:'0.76rem', color:'#64748b' }}>
                Mark each section representative&rsquo;s attendance. <strong>Participants / On Leave / Absentees</strong> in the printout are auto-generated.
              </p>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.81rem', minWidth:700 }}>
                  <thead>
                    <tr style={{ background:'linear-gradient(135deg,#1e1b4b,#4338ca)', color:'#fff' }}>
                      <th style={{ padding:'9px 12px', textAlign:'left', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.04em', width:160 }}>SECTION</th>
                      <th style={{ padding:'9px 10px', textAlign:'left', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.04em' }}>NAME</th>
                      <th style={{ padding:'9px 10px', textAlign:'left', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.04em' }}>DESIGNATION</th>
                      <th style={{ padding:'9px 10px', textAlign:'center', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.04em', width:190 }}>ATTENDANCE</th>
                      <th style={{ padding:'9px 10px', textAlign:'left', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.04em' }}>REASON / REPLACEMENT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reps.map((rep, idx) => (
                      <tr key={rep.id} style={{ background: idx % 2 === 0 ? '#fafbff' : '#fff', borderBottom:'1px solid #e8eaf0', verticalAlign:'top' }}>
                        <td style={{ padding:'8px 12px', fontWeight:700, fontSize:'0.75rem', color:'#1e1b4b', whiteSpace:'nowrap' }}>
                          {rep.meetingDept}
                          {rep.deptCode && <span style={{ marginLeft:5, fontSize:'0.63rem', fontWeight:700, background:'#e0e7ff', color:'#4338ca', borderRadius:4, padding:'1px 5px' }}>{rep.deptCode}</span>}
                        </td>
                        <td style={{ padding:'6px 8px' }}>
                          <input style={{ ...inp, minWidth:130 }} value={rep.name} onChange={e => updateRep(rep.id,'name',e.target.value)} placeholder="Full name" />
                        </td>
                        <td style={{ padding:'6px 8px' }}>
                          <input style={{ ...inp, minWidth:120 }} value={rep.designation} onChange={e => updateRep(rep.id,'designation',e.target.value)} placeholder="Designation" />
                        </td>
                        <td style={{ padding:'6px 10px' }}>
                          <div style={{ display:'flex', gap:3, justifyContent:'center' }}>
                            {(['Attended','On Leave','Absent'] as MeetingAttendance[]).map(a => {
                              const active = rep.attendance === a
                              const colors: Record<MeetingAttendance,{bg:string;border:string;text:string}> = {
                                'Attended': {bg:'#dcfce7',border:'#16a34a',text:'#15803d'},
                                'On Leave': {bg:'#fef3c7',border:'#d97706',text:'#b45309'},
                                'Absent':   {bg:'#fee2e2',border:'#dc2626',text:'#b91c1c'},
                              }
                              const c = active ? colors[a] : {bg:'#f8fafc',border:'#e2e8f0',text:'#94a3b8'}
                              return (
                                <button key={a} type="button" onClick={() => updateRep(rep.id,'attendance',a)}
                                  style={{ padding:'3px 6px', borderRadius:5, border:`1.5px solid ${c.border}`, fontSize:'0.63rem', fontWeight:700, cursor:'pointer', background:c.bg, color:c.text }}>
                                  {a === 'Attended' ? '✓' : a === 'On Leave' ? 'Leave' : 'Absent'}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                        <td style={{ padding:'6px 8px' }}>
                          {rep.attendance !== 'Attended' ? (
                            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                              <input style={{ ...inp, minWidth:120 }} value={rep.reason}
                                onChange={e => updateRep(rep.id,'reason',e.target.value)}
                                placeholder={rep.attendance === 'On Leave' ? 'e.g. Annual Leave' : 'Reason'} />
                              <div style={{ fontSize:'0.67rem', fontWeight:700, color:'#6366f1', marginTop:2 }}>Replacement (optional):</div>
                              <input style={{ ...inp, minWidth:120 }}
                                value={rep.replacementId ?? ''}
                                onChange={e => handleReplacementId(rep.id, e.target.value)}
                                placeholder="Employee ID → auto-lookup" />
                              {rep.replacementName.trim() && (
                                <div style={{ fontSize:'0.69rem', color:'#15803d', fontWeight:600, background:'#f0fdf4', padding:'3px 7px', borderRadius:5 }}>
                                  ✓ {rep.replacementName} — {rep.replacementDesignation}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize:'0.72rem', color:'#cbd5e1' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: Agenda & Other ── */}
          {tab === 'other' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Previous meeting date */}
              <label style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#374151' }}>Previous Meeting Date <span style={{ fontWeight:400, color:'#94a3b8' }}>(used in Agenda item 1)</span></span>
                <input type="date" style={{ ...inp, maxWidth:220 }} value={prevMeetingDate} onChange={e => setPrevMeetingDate(e.target.value)} />
              </label>

              {/* Agenda type toggle */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#374151' }}>Agenda Type</span>
                <div style={{ display:'flex', gap:6 }}>
                  {(['standard','custom'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setAgendaType(t)}
                      style={{ padding:'5px 16px', borderRadius:7, fontSize:'0.78rem', fontWeight:700, cursor:'pointer',
                        background: agendaType === t ? '#4f46e5' : '#f1f5f9',
                        color:      agendaType === t ? '#fff'    : '#374151',
                        border:     agendaType === t ? 'none' : '1.5px solid #e2e8f0' }}>
                      {t === 'standard' ? '📋 Standard Agenda' : '✏ Custom Agenda'}
                    </button>
                  ))}
                </div>

                {agendaType === 'standard' ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ background:'#f8fafc', border:'1.5px solid #e0e7ff', borderRadius:10, padding:'12px 16px' }}>
                      <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#4338ca', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Standard Agenda (printed automatically)</div>
                      <ol style={{ margin:0, paddingLeft:20, color:'#374151', fontSize:'0.82rem', lineHeight:1.8 }}>
                        <li>REVIEW OF MINUTES FROM THE PREVIOUS MEETING HELD ON <strong style={{ color:'#7c3aed' }}>
                          {prevMeetingDate ? (() => {
                            const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
                            const dt = new Date(prevMeetingDate + 'T12:00:00')
                            const d = dt.getDate()
                            const ord = (d===1||d===21||d===31)?'st':(d===2||d===22)?'nd':(d===3||d===23)?'rd':'th'
                            return `${months[dt.getMonth()]} ${d}${ord}, ${dt.getFullYear()}`
                          })() : '[select date above]'}
                        </strong>.</li>
                        <li>DISCUSSION OF ISSUES, UPDATES AND CHALLENGES FACED BY EACH SECTION.</li>
                        <li>ANY OTHER MATTERS THAT NEED TO BE ADDRESSED…</li>
                      </ol>
                    </div>
                    {/* Editable discussion notes for agenda item 1 */}
                    <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#374151' }}>
                        Item 1 — Discussion Notes <span style={{ fontWeight:400, color:'#94a3b8' }}>(optional — leave blank for default text)</span>
                      </span>
                      <textarea style={{ ...ta, minHeight:72 }} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                        placeholder="Highlighted: The minutes from the previous meeting were reviewed and accepted without any changes." />
                    </label>
                  </div>
                ) : (
                  <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    <span style={{ fontSize:'0.70rem', color:'#64748b' }}>One agenda item per line — each line becomes a numbered item in the print.</span>
                    <textarea style={{ ...ta, minHeight:110 }} value={customAgenda} onChange={e => setCustomAgenda(e.target.value)}
                      placeholder="1. Review of previous minutes...&#10;2. Department updates...&#10;3. Any other matters..." />
                  </label>
                )}
              </div>

              {/* Other matters */}
              <label style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#374151' }}>Other Matters / AOB <span style={{ fontWeight:400, color:'#94a3b8' }}>(printed under section 3)</span></span>
                <textarea style={{ ...ta, minHeight:160 }} value={otherMatters} onChange={e => setOtherMatters(e.target.value)} placeholder="Any other matters discussed…" />
              </label>
            </div>
          )}

          {/* ── TAB: Section Minutes ── */}
          {tab === 'minutes' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <p style={{ margin:'0 0 8px', fontSize:'0.76rem', color:'#64748b' }}>
                Enter updates for each section — <strong>one bullet point per line</strong>. Empty sections show &ldquo;Nil&rdquo; in the printout.
              </p>
              {deptUpdates.filter(d => d.dept !== 'ADMINISTRATION' && d.dept !== 'HUMAN RESOURCES').map(d => {
                const pts = d.points.split('\n').filter(p => p.trim()).length
                return (
                  <div key={d.dept} style={{ background:'#f8fafc', border:`1.5px solid ${d.points.trim() ? '#c7d2fe' : '#e8eaf0'}`, borderRadius:10, padding:'10px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ fontSize:'0.8rem', fontWeight:800, color:'#1e1b4b' }}>{d.dept}</span>
                      {pts > 0 && <span style={{ fontSize:'0.64rem', fontWeight:700, background:'#e0e7ff', color:'#4338ca', borderRadius:5, padding:'2px 7px' }}>{pts} pt{pts !== 1 ? 's' : ''}</span>}
                    </div>
                    <textarea style={ta} value={d.points} onChange={e => updateDeptPts(d.dept, e.target.value)}
                      placeholder={`Updates for ${d.dept} (one item per line)`} />
                  </div>
                )
              })}
              {/* Additional section notes — collapsible */}
              <div style={{ background:'#f0fdf4', border:`1.5px solid ${additionalNotesOpen ? '#86efac' : '#bbf7d0'}`, borderRadius:10, marginTop:4, overflow:'hidden' }}>
                <button type="button" onClick={() => setAdditionalNotesOpen(o => !o)}
                  style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                  <span style={{ fontSize:'0.8rem', fontWeight:800, color:'#166534' }}>
                    Additional Notes
                    <span style={{ fontWeight:400, fontSize:'0.72rem', color:'#4ade80', marginLeft:6 }}>(optional — shown in print if filled)</span>
                  </span>
                  <span style={{ fontSize:'0.75rem', color:'#15803d', fontWeight:700 }}>{additionalNotesOpen ? '▲ Hide' : '▼ Show'}</span>
                </button>
                {additionalNotesOpen && (
                  <div style={{ padding:'0 14px 12px' }}>
                    <textarea style={{ ...ta, minHeight:64 }} value={additionalSectionNotes} onChange={e => setAdditionalSectionNotes(e.target.value)}
                      placeholder="Any additional section updates not in the standard list (one item per line)…" />
                  </div>
                )}
              </div>
            </div>
          )}
        </fieldset>
        </div>

        {/* Footer */}
        <div style={{ flexShrink:0, borderTop:'1px solid #f1f5f9', padding:'10px 20px', display:'flex', gap:8, justifyContent:'flex-end', background:'#fafbff' }}>
          {!viewOnly && status === 'Draft' && !isNew && (
            <button type="button" style={{ padding:'7px 16px', borderRadius:7, fontSize:'0.8rem', fontWeight:700, cursor:'pointer', background:'#15803d', color:'#fff', border:'none' }}
              onClick={handleMarkFinal}>
              ✓ Mark as Final
            </button>
          )}
          {!viewOnly && (
            <button type="button" className="primary-button" onClick={() => handleSave()}>
              {isNew ? 'Create Meeting Record' : 'Save Changes'}
            </button>
          )}
          <button type="button" className="quiet-button" onClick={onClose}>{viewOnly ? 'Close' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  )
}

/* ─── MeetingCalendar ──────────────────────────────────────────── */
function MeetingCalendar({ records }: { records: MeetingRecord[] }) {
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selected, setSelected] = useState<string | null>(null)

  const isMeetingDay = (d: Date) => { const w = d.getDay(); return w === 0 || w === 4 }
  const toStr = (d: Date) => d.toISOString().split('T')[0]
  const today = new Date(); today.setHours(0,0,0,0)

  const yr = viewDate.getFullYear(); const mo = viewDate.getMonth()
  const first = new Date(yr, mo, 1); const last = new Date(yr, mo + 1, 0)
  const start = new Date(first); start.setDate(start.getDate() - start.getDay())
  const end   = new Date(last);  end.setDate(end.getDate() + (6 - end.getDay()))

  const cells: Date[] = []
  const cur = new Date(start)
  while (cur <= end) { cells.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }

  const recMap = new Map(records.map(r => [r.date, r]))
  const selRec = selected ? recMap.get(selected) ?? null : null

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DOW    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  // Monthly stats
  const monthMtgDays = cells.filter(c => c.getMonth() === mo && isMeetingDay(c))
  const conducted = monthMtgDays.filter(c => recMap.has(toStr(c))).length
  const skipped   = monthMtgDays.filter(c => !recMap.has(toStr(c)) && c < today).length
  const upcoming  = monthMtgDays.filter(c => !recMap.has(toStr(c)) && c >= today).length

  const navBtn: React.CSSProperties = {
    background:'rgba(255,255,255,0.15)', border:'none', color:'#fff',
    width:32, height:32, borderRadius:8, cursor:'pointer',
    fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', borderRadius:14, border:'1.5px solid #e0e7ff',
      overflow:'hidden', boxShadow:'0 4px 18px rgba(30,27,75,0.09)' }}>

      {/* ── Header ── */}
      <div style={{ background:'linear-gradient(135deg,#1e1b4b 0%,#4338ca 100%)',
        padding:'14px 18px', display:'flex', alignItems:'center', gap:10 }}>
        <button type="button" style={navBtn}
          onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}>‹</button>
        <div style={{ flex:1, textAlign:'center' }}>
          <div style={{ fontWeight:900, fontSize:'1.05rem', color:'#fff', letterSpacing:'0.03em' }}>{MONTHS[mo]}</div>
          <div style={{ fontSize:'0.72rem', color:'rgba(199,210,254,0.8)', fontWeight:600, marginTop:1 }}>{yr}</div>
        </div>
        <button type="button" style={navBtn}
          onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}>›</button>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', background:'#f5f3ff',
        borderBottom:'1.5px solid #e0e7ff' }}>
        {[
          { label:'Conducted', n:conducted, color:'#15803d', ring:'#86efac', bg:'#f0fdf4' },
          { label:'Skipped',   n:skipped,   color:'#b45309', ring:'#fcd34d', bg:'#fffbeb' },
          { label:'Upcoming',  n:upcoming,  color:'#4338ca', ring:'#a5b4fc', bg:'#eef2ff' },
        ].map((s,i) => (
          <div key={s.label} style={{ textAlign:'center', padding:'9px 0',
            borderRight: i < 2 ? '1px solid #e0e7ff' : 'none' }}>
            <div style={{ fontSize:'1.25rem', fontWeight:900, color:s.color, lineHeight:1 }}>{s.n}</div>
            <div style={{ fontSize:'0.6rem', fontWeight:700, color:'#6b7280', textTransform:'uppercase',
              letterSpacing:'0.07em', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Day-of-week header ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'#f1f5f9',
        borderBottom:'1px solid #e2e8f0' }}>
        {DOW.map(d => (
          <div key={d} style={{ textAlign:'center', padding:'7px 0', fontSize:'0.63rem', fontWeight:800,
            letterSpacing:'0.06em', color: d==='Sun'||d==='Thu' ? '#4338ca' : '#94a3b8' }}>{d}</div>
        ))}
      </div>

      {/* ── Calendar cells ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'#fff' }}>
        {cells.map((cell, idx) => {
          const ds      = toStr(cell)
          const inMonth = cell.getMonth() === mo
          const isMtg   = isMeetingDay(cell)
          const rec     = recMap.get(ds)
          const isPast  = cell < today
          const isToday = cell.getTime() === today.getTime()
          const isSel   = selected === ds
          const isLastCol = (idx % 7) === 6

          // Accent colour for top bar
          let accent = ''
          if (isMtg && inMonth) {
            if (rec)      accent = isSel ? '#4338ca' : '#16a34a'
            else if (isPast) accent = '#f59e0b'
            else          accent = '#818cf8'
          }
          if (isToday)  accent = '#4338ca'

          // Cell background
          let cellBg = inMonth ? '#fff' : '#f8fafc'
          if (isMtg && inMonth) {
            if (isSel)       cellBg = '#e0e7ff'
            else if (isToday) cellBg = '#eef2ff'
            else if (rec)    cellBg = '#f0fdf4'
            else if (isPast) cellBg = '#fffbeb'
          } else if (isToday) cellBg = '#eef2ff'

          return (
            <div key={ds}
              onClick={() => isMtg && inMonth && setSelected(isSel ? null : ds)}
              style={{
                background: cellBg,
                borderRight: isLastCol ? 'none' : '1px solid #f0f4f8',
                borderBottom: '1px solid #f0f4f8',
                minHeight: 74,
                cursor: isMtg && inMonth ? 'pointer' : 'default',
                opacity: inMonth ? 1 : 0.35,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                paddingTop: 8, paddingBottom: 6,
                position: 'relative',
                transition: 'background 0.12s',
              }}>
              {/* Top accent bar */}
              {accent && (
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
                  background:accent, borderRadius:'0 0 2px 2px', opacity: inMonth ? 1 : 0.4 }} />
              )}
              {/* Date circle */}
              <div style={{
                width:26, height:26, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                background: isToday ? '#4338ca' : isSel ? '#c7d2fe' : 'transparent',
                color: isToday ? '#fff' : isMtg && inMonth ? '#1e1b4b' : '#94a3b8',
                fontSize:'0.78rem', fontWeight: isMtg && inMonth ? 800 : 400,
                marginTop: 2,
              }}>
                {cell.getDate()}
              </div>
              {/* Status badge */}
              {isMtg && inMonth && (
                <div style={{ marginTop:5, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  {rec ? (
                    <>
                      <div style={{ fontSize:'0.53rem', fontWeight:800, color:'#166534',
                        letterSpacing:'0.02em', lineHeight:1 }}>
                        #{rec.refNumber.split('/').pop()}
                      </div>
                      <div style={{ fontSize:'0.48rem', fontWeight:700, borderRadius:3, padding:'1px 5px',
                        background: rec.status==='Final' ? '#dcfce7' : '#fef3c7',
                        color:      rec.status==='Final' ? '#15803d' : '#b45309' }}>
                        {rec.status.toUpperCase()}
                      </div>
                    </>
                  ) : isPast ? (
                    <div style={{ fontSize:'0.5rem', fontWeight:800, color:'#b45309',
                      background:'#fef3c7', borderRadius:4, padding:'2px 5px' }}>SKIPPED</div>
                  ) : (
                    <div style={{ fontSize:'0.5rem', fontWeight:700, color:'#4338ca',
                      background:'#e0e7ff', borderRadius:4, padding:'2px 5px' }}>SCHED.</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Legend ── */}
      <div style={{ display:'flex', gap:14, padding:'8px 16px', borderTop:'1px solid #e2e8f0',
        background:'#fafafa', justifyContent:'center', flexWrap:'wrap' }}>
        {[
          { label:'Conducted', dot:'#16a34a', bg:'#dcfce7' },
          { label:'Skipped',   dot:'#d97706', bg:'#fef3c7' },
          { label:'Scheduled', dot:'#818cf8', bg:'#e0e7ff' },
          { label:'Today',     dot:'#4338ca', bg:'#eef2ff' },
        ].map(l => (
          <span key={l.label} style={{ display:'flex', alignItems:'center', gap:5,
            fontSize:'0.63rem', color:'#64748b', fontWeight:600 }}>
            <span style={{ width:9, height:9, borderRadius:2, background:l.bg,
              border:`1.5px solid ${l.dot}`, display:'inline-block', flexShrink:0 }} />
            {l.label}
          </span>
        ))}
      </div>

      {/* ── Detail panel ── */}
      {selected && (() => {
        const d = new Date(selected + 'T12:00:00')
        const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]
        return (
          <div style={{ borderTop:'2.5px solid #4338ca', background:'linear-gradient(180deg,#f5f3ff 0%,#fff 100%)',
            padding:'14px 18px' }}>
            {/* Detail header */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
              <div style={{ background:'#4338ca', color:'#fff', borderRadius:8, padding:'4px 12px',
                fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.02em' }}>
                {d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} · {dayName}
              </div>
              {selRec && (
                <>
                  <span style={{ fontSize:'0.78rem', fontWeight:800, color:'#1e1b4b' }}>{selRec.refNumber}</span>
                  <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'2px 9px', borderRadius:5,
                    background: selRec.status==='Final'?'#dcfce7':'#fef3c7',
                    color:      selRec.status==='Final'?'#15803d':'#92400e',
                    border:     selRec.status==='Final'?'1px solid #86efac':'1px solid #fcd34d' }}>
                    {selRec.status}
                  </span>
                </>
              )}
              <button type="button" onClick={() => setSelected(null)}
                style={{ marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer',
                  color:'#94a3b8', fontSize:'1rem', lineHeight:1, padding:0 }}>✕</button>
            </div>

            {selRec ? (
              <>
                <div style={{ fontSize:'0.72rem', color:'#475569', marginBottom:10, fontWeight:600 }}>
                  🪑&nbsp; {selRec.chairperson}
                </div>
                {/* Attendance badges */}
                <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase',
                  letterSpacing:'0.08em', marginBottom:5 }}>Attendance</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {selRec.reps.filter(r => r.name.trim()).map(rep => {
                    const isAtt   = rep.attendance === 'Attended'
                    const isLeave = rep.attendance === 'On Leave'
                    const bg   = isAtt ? '#f0fdf4' : isLeave ? '#fffbeb' : '#fef2f2'
                    const tx   = isAtt ? '#15803d' : isLeave ? '#92400e' : '#b91c1c'
                    const bd   = isAtt ? '#86efac' : isLeave ? '#fcd34d' : '#fca5a5'
                    const icon = isAtt ? '✓' : isLeave ? '⊘' : '✗'
                    return (
                      <span key={rep.id} title={`${rep.name} — ${rep.meetingDept} — ${rep.attendance}`}
                        style={{ fontSize:'0.68rem', fontWeight:700, borderRadius:6, padding:'4px 9px',
                          background:bg, color:tx, border:`1px solid ${bd}`,
                          display:'flex', alignItems:'center', gap:3 }}>
                        <span style={{ fontSize:'0.65rem', fontWeight:900 }}>{icon}</span>
                        {rep.deptCode || rep.meetingDept.slice(0,3)}
                      </span>
                    )
                  })}
                </div>
              </>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:10, color:'#92400e', fontSize:'0.78rem',
                background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px' }}>
                <span style={{ fontSize:'1.1rem' }}>⚠️</span>
                No meeting record for this date — meeting was skipped or not yet recorded.
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

/* ─── MeetingsSection ──────────────────────────────────────────── */
function MeetingsSection({ records, onUpdate, employees, activeLeaves }: {
  records: MeetingRecord[]
  onUpdate: (fn: (prev: MeetingRecord[]) => MeetingRecord[]) => void
  employees: Employee[]
  activeLeaves: ActiveLeaveRecord[]
}) {
  const [editing,   setEditing]   = useState<MeetingRecord | null>(null)
  const [search,    setSearch]    = useState('')
  const [view,      setView]      = useState<'list'|'calendar'>('list')

  const mkNew = (): MeetingRecord => {
    const yr = new Date().getFullYear().toString().slice(-2)
    // Auto-generate ref from last record's sequence
    const sortedRecs = [...records].sort((a,b) => a.createdAt.localeCompare(b.createdAt))
    const lastRef  = sortedRecs[sortedRecs.length - 1]?.refNumber ?? ''
    const lastSeq  = parseInt(lastRef.split('/').pop() ?? '30', 10)
    const nextSeq  = String(isNaN(lastSeq) ? records.length + 31 : lastSeq + 1).padStart(3, '0')

    // DGM attends when Ali Didi (GM) chairs (default)
    const dgmEmp = employees.find(e => e.employeeId === DGM_ID)
    const dgmRep: MeetingRep = {
      id: 'rep-dgm',
      name:        dgmEmp?.fullName    ?? 'HUSSAIN SHAHID',
      designation: dgmEmp?.designation ?? 'DEPUTY GENERAL MANAGER',
      meetingDept: 'DEPUTY GENERAL MANAGER', deptCode: 'DGM',
      attendance: 'Attended', reason: '',
      replacementName: '', replacementDesignation: '', replacementId: '',
    }

    const fixedReps: MeetingRep[] = FIXED_PARTICIPANT_IDS.map((empId, i) => {
      const emp   = employees.find(e => e.employeeId === empId)
      const mDept = emp
        ? MEETING_DEPTS.find(d => d.appDepts.some(ad => ad.toLowerCase() === emp.department?.toLowerCase()))
        : undefined
      return {
        id: `rep-${i}`,
        name:        emp?.fullName    ?? '',
        designation: emp?.designation ?? '',
        meetingDept: mDept?.label     ?? emp?.department ?? '',
        deptCode:    mDept?.code      ?? '',
        attendance:  'Attended' as MeetingAttendance,
        reason: '', replacementName: '', replacementDesignation: '', replacementId: '',
      }
    })

    const lastRecord = sortedRecs[sortedRecs.length - 1]

    return {
      id: `MTG-new-${Date.now()}`,
      refNumber: `VHPL/MBM/${yr}/${nextSeq}`,
      date: new Date().toISOString().split('T')[0],
      timeStarted: '10:00', timeEnded: '',
      venue: 'Villa Hakatha Pvt Ltd, Thilafushi, Meeting Room',
      chairperson: CHAIRPERSON_OPTIONS[0].value,
      reps: [dgmRep, ...fixedReps],
      prevMeetingDate: lastRecord?.date ?? '',
      deptUpdates: MEETING_DEPTS.map(d => ({ dept: d.label, points: '' })),
      agendaType: 'standard', customAgenda: '',
      otherMatters: '',
      preparedBy: 'ARUSHULLA RASHID',
      approvedBy: 'ALI DIDI',
      status: 'Draft',
      createdAt: new Date().toISOString(),
    }
  }

  const save = (r: MeetingRecord) => {
    onUpdate(prev => {
      const final = r.id.includes('-new-') ? { ...r, id: `MTG-${Date.now()}` } : r
      const idx = prev.findIndex(x => x.id === r.id)
      return idx >= 0 ? prev.map(x => x.id === r.id ? final : x) : [final, ...prev]
    })
    setEditing(null)
  }

  const del = (id: string) => {
    if (confirm('Delete this meeting record?')) onUpdate(prev => prev.filter(x => x.id !== id))
  }

  const fmtD = (d: string) => {
    if (!d) return null
    const [y,m,dd] = d.split('-')
    return { day: dd, rest: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m,10)-1]} ${y}` }
  }

  // Descending by date (latest first)
  const sortedDesc = [...records].sort((a,b) => b.date.localeCompare(a.date))
  const filtered   = search
    ? sortedDesc.filter(r =>
        r.refNumber.toLowerCase().includes(search.toLowerCase()) ||
        r.date.includes(search) ||
        r.chairperson.toLowerCase().includes(search.toLowerCase()))
    : sortedDesc

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'12px 14px 8px' }}>
      <div className="section-header">
        <div>
          <h2 style={{ margin:0, fontSize:'0.9rem', fontWeight:800, color:'#1e1b4b' }}>HOD Meeting Minutes</h2>
          <p style={{ margin:'2px 0 0', fontSize:'0.73rem', color:'#64748b' }}>Briefing meeting records — headcount auto-calculated from employee database</p>
        </div>
        <div className="top-actions">
          {/* List / Calendar toggle */}
          <div style={{ display:'flex', gap:3, background:'#f1f5f9', borderRadius:8, padding:3 }}>
            {(['list','calendar'] as const).map(v => (
              <button key={v} type="button" onClick={() => setView(v)}
                style={{ padding:'4px 12px', borderRadius:6, fontSize:'0.74rem', fontWeight:700, cursor:'pointer', border:'none',
                  background: view===v ? '#fff' : 'transparent',
                  color: view===v ? '#1e1b4b' : '#64748b',
                  boxShadow: view===v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                {v === 'list' ? '☰ List' : '📅 Calendar'}
              </button>
            ))}
          </div>
          {view === 'list' && (
            <label className="search-field">
              <span>Search</span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ref, date, chairperson…" />
            </label>
          )}
          <button className="primary-button vwh" onClick={() => setEditing(mkNew())} type="button">+ New Meeting</button>
        </div>
      </div>

      {view === 'calendar' ? (
        <MeetingCalendar records={records} />
      ) : records.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'#94a3b8', background:'#f8fafc', borderRadius:12, border:'1.5px dashed #e2e8f0', fontSize:'0.84rem' }}>
          No meeting records yet. Click <strong>&ldquo;+ New Meeting&rdquo;</strong> to create the first one.
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'24px', color:'#94a3b8', fontSize:'0.84rem' }}>No results match that search.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {filtered.map(rec => {
            const nAttended = rec.reps.filter(r => r.attendance === 'Attended' && r.name.trim()).length
            const nLeave    = rec.reps.filter(r => r.attendance === 'On Leave').length
            const nAbsent   = rec.reps.filter(r => r.attendance === 'Absent').length
            const deptNotes = rec.deptUpdates.filter(d => d.points.trim()).map(d => d.dept)
            const dt        = fmtD(rec.date)
            return (
              <div key={rec.id} className="mtg-card">
                {dt && (
                  <div className="mtg-date-box">
                    <span className="mtg-day">{dt.day}</span>
                    <span className="mtg-month">{dt.rest}</span>
                  </div>
                )}
                <div className="mtg-card-body">
                  <div className="mtg-top-row">
                    <span className="mtg-ref">{rec.refNumber}</span>
                    <span className={`mtg-badge ${rec.status === 'Final' ? 'final' : 'draft'}`}>{rec.status}</span>
                    <span className="mtg-chair" style={{ marginLeft:2 }}>{rec.chairperson}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <div className="mtg-chips" style={{ margin:0 }}>
                      <span className="mtg-chip attended">{nAttended} attended</span>
                      {nLeave  > 0 && <span className="mtg-chip leave">{nLeave} on leave</span>}
                      {nAbsent > 0 && <span className="mtg-chip absent">{nAbsent} absent</span>}
                    </div>
                    {deptNotes.length > 0 && (
                      <div className="mtg-dept-line" style={{ flex:1 }}>{deptNotes.join(' · ')}</div>
                    )}
                  </div>
                </div>
                {/* Icons only — no text labels */}
                <div className="mtg-actions">
                  <button className="quiet-button vwh" type="button" title="Edit" onClick={() => setEditing(rec)} style={{ fontSize:'0.9rem', padding:'3px 8px' }}>✎</button>
                  <button className="quiet-button" type="button" title="Print" onClick={() => printMeetingMinutes(rec, employees, activeLeaves)} style={{ fontSize:'0.9rem', padding:'3px 8px' }}>🖨</button>
                  <button className="quiet-button vwh" type="button" title="Delete" onClick={() => del(rec.id)} style={{ fontSize:'0.9rem', padding:'3px 8px', color:'#ef4444' }}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <MeetingFormModal
          record={editing}
          employees={employees}
          activeLeaves={activeLeaves}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  )
}

/* ─── Sample meeting minutes ──────────────────────────────────── */
const _sampleRep = (id:string, name:string, desig:string, dept:string, code:string, att:MeetingAttendance='Attended', reason='', repName='', repDesig=''): MeetingRep =>
  ({ id, name, designation:desig, meetingDept:dept, deptCode:code, attendance:att, reason, replacementName:repName, replacementDesignation:repDesig, replacementId:'' })
const initialMeetingRecords: MeetingRecord[] = [
  {
    id: 'mtg-001', refNumber: 'VHPL/MBM/26/031', date: '2026-03-26',
    timeStarted: '10:00', timeEnded: '11:45',
    venue: 'Villa Hakatha Pvt Ltd, Thilafushi, Meeting Room',
    chairperson: 'Ali Didi — General Manager', prevMeetingDate: '2026-02-26',
    reps: [
      _sampleRep('r-dgm','HUSSAIN SHAHID','DEPUTY GENERAL MANAGER','DEPUTY GENERAL MANAGER','DGM'),
      _sampleRep('r01','Ibrahim Rasheed','Head of Accounts','ACCOUNTS','ACC'),
      _sampleRep('r02','Mohamed Nizam','Chief Engineer','ENGINEERING','ENG'),
      _sampleRep('r03','Ali Shareef','LP Supervisor','LOSS PREVENTION','LP'),
      _sampleRep('r04','Fathimath Laila','Housekeeping Supervisor','HOUSEKEEPING','HK'),
      _sampleRep('r05','Hassan Niyaz','F&B Supervisor','FOOD & BEVERAGE','F&B','On Leave','Annual Leave','Ahmed Riyaz','F&B Assistant'),
      _sampleRep('r06','Abdul Waheed','Store Keeper','STORES','STR'),
      _sampleRep('r07','Mohamed Hasan','LPG Plant Supervisor','LPG PLANT','LPG'),
      _sampleRep('r08','Ibrahim Ali','Fuel Farm Supervisor','FUEL FARM','FF'),
      _sampleRep('r09','Ahmed Ali','Administrator','ADMINISTRATION','ADM'),
      _sampleRep('r10','Mariyam Shifa','HR Officer','HUMAN RESOURCES','HR'),
    ],
    deptUpdates: [
      { dept:'ACCOUNTS',        points:'Monthly payroll processed on time.\nPetty cash reconciliation completed for February.' },
      { dept:'ENGINEERING',     points:'Generator 2 scheduled maintenance completed.\nElectrical panel inspection pending — scheduled for next week.' },
      { dept:'LOSS PREVENTION', points:'No major incidents reported this month.\nFire drill conducted on 20th March — all clear.' },
      { dept:'HOUSEKEEPING',    points:'Deep cleaning of staff quarters completed.\nNew cleaning schedule implemented across all blocks.' },
      { dept:'FOOD & BEVERAGE', points:'Menu updated for Ramadan season.\nNew kitchen equipment installed and operational.' },
      { dept:'STORES',          points:'Stock audit completed — report submitted to management.\nNew procurement requests for Q2 submitted.' },
      { dept:'LPG PLANT',       points:'LPG stock levels at 72% — refill scheduled end of month.\nAll safety valves tested and operational.' },
      { dept:'FUEL FARM',       points:'Monthly fuel inventory check completed — all records updated.' },
      { dept:'ADMINISTRATION',  points:'Staff welfare matters reviewed.\nNew attendance register system piloted.' },
      { dept:'HUMAN RESOURCES', points:'Visa renewals for 3 staff processed.\nNew joiners induction scheduled for next week.' },
      { dept:'CEMENT PLANT',    points:'Production target met for February.\nConveyor belt replaced — downtime was 6 hours.' },
    ],
    otherMatters:'Management reminded all section heads to submit Q1 performance reports by 31st March.\nNext meeting scheduled for 23rd April 2026.',
    preparedBy:'ARUSHULLA RASHID', approvedBy:'ALI DIDI',
    status:'Final', agendaType:'standard', customAgenda:'',
    createdAt:'2026-03-26T12:00:00.000Z',
  },
  {
    id: 'mtg-002', refNumber: 'VHPL/MBM/26/032', date: '2026-04-23',
    timeStarted: '10:00', timeEnded: '12:10',
    venue: 'Villa Hakatha Pvt Ltd, Thilafushi, Meeting Room',
    chairperson: 'Ali Didi — General Manager', prevMeetingDate: '2026-03-26',
    reps: [
      _sampleRep('r-dgm','HUSSAIN SHAHID','DEPUTY GENERAL MANAGER','DEPUTY GENERAL MANAGER','DGM'),
      _sampleRep('r01','Ibrahim Rasheed','Head of Accounts','ACCOUNTS','ACC'),
      _sampleRep('r02','Mohamed Nizam','Chief Engineer','ENGINEERING','ENG'),
      _sampleRep('r03','Ali Shareef','LP Supervisor','LOSS PREVENTION','LP'),
      _sampleRep('r04','Fathimath Laila','Housekeeping Supervisor','HOUSEKEEPING','HK','Absent','Medical Appointment'),
      _sampleRep('r05','Hassan Niyaz','F&B Supervisor','FOOD & BEVERAGE','F&B'),
      _sampleRep('r06','Abdul Waheed','Store Keeper','STORES','STR'),
      _sampleRep('r07','Mohamed Hasan','LPG Plant Supervisor','LPG PLANT','LPG'),
      _sampleRep('r08','Ibrahim Ali','Fuel Farm Supervisor','FUEL FARM','FF'),
      _sampleRep('r09','Ahmed Ali','Administrator','ADMINISTRATION','ADM'),
      _sampleRep('r10','Mariyam Shifa','HR Officer','HUMAN RESOURCES','HR'),
    ],
    deptUpdates: [
      { dept:'ACCOUNTS',        points:'Q1 financial summary presented — within budget.\nStaff loan deductions reconciled for all sections.' },
      { dept:'ENGINEERING',     points:'Power House fuel consumption report submitted — 8% reduction achieved.\nMaintenance log for April updated and shared.' },
      { dept:'LOSS PREVENTION', points:'CCTV system upgraded in Zone B.\nNew SOP for visitor access distributed to all sections.' },
      { dept:'HOUSEKEEPING',    points:'Laundry machine breakdown — temporary arrangements in place, repair ETA 3 days.' },
      { dept:'FOOD & BEVERAGE', points:'Staff mess feedback survey conducted — 87% satisfaction rate.\nNew supplier for vegetables onboarded.' },
      { dept:'STORES',          points:'Slow-moving inventory list submitted to GM for disposal approval.\nBarcode system implementation in progress.' },
      { dept:'LPG PLANT',       points:'Monthly safety inspection completed — no issues found.\nLPG stock replenished on 18th April.' },
      { dept:'FUEL FARM',       points:'Fuel pump maintenance completed.\nStock levels reviewed and within safe limits.' },
      { dept:'ADMINISTRATION',  points:'Q1 admin report submitted to management.' },
      { dept:'HUMAN RESOURCES', points:'Work permit renewals for 5 employees in process.\nMonthly headcount report submitted.' },
      { dept:'CEMENT PLANT',    points:'Cement production up 12% compared to March.\nDust control measures improved following complaint.' },
    ],
    otherMatters:'GM announced annual leave schedule for May–June will be released by 30th April.\nAll sections to submit manpower requirements for Q3 by 10th May.',
    preparedBy:'ARUSHULLA RASHID', approvedBy:'ALI DIDI',
    status:'Final', agendaType:'standard', customAgenda:'',
    createdAt:'2026-04-23T12:30:00.000Z',
  },
  {
    id: 'mtg-003', refNumber: 'VHPL/MBM/26/033', date: '2026-05-28',
    timeStarted: '10:00', timeEnded: '11:55',
    venue: 'Villa Hakatha Pvt Ltd, Thilafushi, Meeting Room',
    chairperson: 'Hussain Shahid — Deputy General Manager', prevMeetingDate: '2026-04-23',
    reps: [
      _sampleRep('r-gm','ALI DIDI','GENERAL MANAGER','GENERAL MANAGER','GM','Absent','Not Available'),
      _sampleRep('r01','Ibrahim Rasheed','Head of Accounts','ACCOUNTS','ACC'),
      _sampleRep('r02','Mohamed Nizam','Chief Engineer','ENGINEERING','ENG'),
      _sampleRep('r03','Ali Shareef','LP Supervisor','LOSS PREVENTION','LP','On Leave','Annual Leave','Hussain Rasheed','Acting LP Supervisor'),
      _sampleRep('r04','Fathimath Laila','Housekeeping Supervisor','HOUSEKEEPING','HK'),
      _sampleRep('r05','Hassan Niyaz','F&B Supervisor','FOOD & BEVERAGE','F&B'),
      _sampleRep('r06','Abdul Waheed','Store Keeper','STORES','STR'),
      _sampleRep('r07','Mohamed Hasan','LPG Plant Supervisor','LPG PLANT','LPG'),
      _sampleRep('r08','Ibrahim Ali','Fuel Farm Supervisor','FUEL FARM','FF'),
      _sampleRep('r09','Ahmed Ali','Administrator','ADMINISTRATION','ADM'),
      _sampleRep('r10','Mariyam Shifa','HR Officer','HUMAN RESOURCES','HR'),
    ],
    deptUpdates: [
      { dept:'ACCOUNTS',        points:'May payroll preparation in progress — to be processed by 29th.\nAnnual audit documentation being compiled.' },
      { dept:'ENGINEERING',     points:'Air conditioning units serviced in all office blocks.\nBackup generator fuel topped up — stock sufficient for 3 weeks.' },
      { dept:'LOSS PREVENTION', points:'Acting LP Supervisor Hussain Rasheed representing section.\nIncident report for 15th May submitted and closed.' },
      { dept:'HOUSEKEEPING',    points:'Pest control treatment carried out on 22nd May — all clear.\nCleaning supplies stock replenished.' },
      { dept:'FOOD & BEVERAGE', points:'Ramadan meal schedule concluded — back to regular menu from 1st June.\nKitchen deep cleaning completed post-Ramadan.' },
      { dept:'STORES',          points:'Barcode system fully operational across main stores.\nMonthly stock report submitted on 25th May.' },
      { dept:'LPG PLANT',       points:'Quarterly safety audit conducted — passed with minor observations.\nObservations to be addressed by end of June.' },
      { dept:'FUEL FARM',       points:'Fuel delivery received — stock at 85%.\nAll meters calibrated and certified.' },
      { dept:'ADMINISTRATION',  points:'Staff ID card registrations completed for all sections.' },
      { dept:'HUMAN RESOURCES', points:'Annual leave schedules for June–July circulated.\nNew employee joining formalities completed for 2 staff.' },
      { dept:'CEMENT PLANT',    points:'New batch order received — production ramping up for June.\nOvertime approved for 12 workers for the coming 3 weeks.' },
    ],
    otherMatters:'DGM reminded all sections that new ID card system goes live on 1st June — all staff must register biometrics before 31st May.\nNext meeting tentatively scheduled for 25th June 2026.',
    preparedBy:'ARUSHULLA RASHID', approvedBy:'HUSSAIN SHAHID',
    status:'Final', agendaType:'standard', customAgenda:'',
    createdAt:'2026-05-28T13:00:00.000Z',
  },
  {
    id: 'mtg-004', refNumber: 'VHPL/MBM/26/034', date: '2026-06-25',
    timeStarted: '10:00', timeEnded: '',
    venue: 'Villa Hakatha Pvt Ltd, Thilafushi, Meeting Room',
    chairperson: 'Ali Didi — General Manager', prevMeetingDate: '2026-05-28',
    reps: [
      _sampleRep('r-dgm','HUSSAIN SHAHID','DEPUTY GENERAL MANAGER','DEPUTY GENERAL MANAGER','DGM'),
      _sampleRep('r01','Ibrahim Rasheed','Head of Accounts','ACCOUNTS','ACC'),
      _sampleRep('r02','Mohamed Nizam','Chief Engineer','ENGINEERING','ENG'),
      _sampleRep('r03','Ali Shareef','LP Supervisor','LOSS PREVENTION','LP'),
      _sampleRep('r04','Fathimath Laila','Housekeeping Supervisor','HOUSEKEEPING','HK'),
      _sampleRep('r05','Hassan Niyaz','F&B Supervisor','FOOD & BEVERAGE','F&B'),
      _sampleRep('r06','Abdul Waheed','Store Keeper','STORES','STR'),
      _sampleRep('r07','Mohamed Hasan','LPG Plant Supervisor','LPG PLANT','LPG'),
      _sampleRep('r08','Ibrahim Ali','Fuel Farm Supervisor','FUEL FARM','FF'),
      _sampleRep('r09','Ahmed Ali','Administrator','ADMINISTRATION','ADM'),
      _sampleRep('r10','Mariyam Shifa','HR Officer','HUMAN RESOURCES','HR'),
    ],
    deptUpdates: [
      { dept:'ACCOUNTS',        points:'' }, { dept:'ENGINEERING',     points:'' },
      { dept:'LOSS PREVENTION', points:'' }, { dept:'HOUSEKEEPING',    points:'' },
      { dept:'FOOD & BEVERAGE', points:'' }, { dept:'STORES',          points:'' },
      { dept:'LPG PLANT',       points:'' }, { dept:'FUEL FARM',       points:'' },
      { dept:'ADMINISTRATION',  points:'' }, { dept:'HUMAN RESOURCES', points:'' },
      { dept:'CEMENT PLANT',    points:'' },
    ],
    otherMatters:'', preparedBy:'ARUSHULLA RASHID', approvedBy:'ALI DIDI',
    status:'Draft', agendaType:'standard', customAgenda:'',
    createdAt:'2026-06-05T09:00:00.000Z',
  },
]

function OperationsPage({ employees, completedTerminations, activeLeaves, isHOD = false, userRole = 'HR' }: {
  employees: Employee[]
  completedTerminations: CompletedTerminationRecord[]
  activeLeaves: ActiveLeaveRecord[]
  isHOD?: boolean
  userRole?: UserRole
}) {
  const [activeSection, setActiveSection] = useState<OpsSection>(isHOD ? 'training' : 'files')
  const [meetingRecords,    setMeetingRecords]    = useState<MeetingRecord[]>(() => tryLoad('tic_meetings'))
  const [personalFiles,     setPersonalFiles]     = useState<PersonalFileRecord[]>(() => tryLoad('tic_personal_files'))
  const [inductionRecords,  setInductionRecords]  = useState<InductionRecord[]>(() => tryLoad('tic_induction'))
  const [trainingRecords,   setTrainingRecords]   = useState<TrainingRecord[]>(() => tryLoad('tic_training'))
  const [bankAccountRecords,setBankAccountRecords]= useState<BankAccountRecord[]>(() => tryLoad('tic_bank_acc'))

  // ── Supabase load on mount ────────────────────────────────────────────────
  const opsLoaded = useRef(false)
  const prevMt  = useRef<MeetingRecord[]>([])
  const prevPf  = useRef<PersonalFileRecord[]>([])
  const prevInd = useRef<InductionRecord[]>([])
  const prevTr  = useRef<TrainingRecord[]>([])
  const prevBnk = useRef<BankAccountRecord[]>([])

  useEffect(() => {
    Promise.all([
      supabase.from('meeting_records').select('*'),
      supabase.from('personal_files').select('*'),
      supabase.from('induction_records').select('*'),
      supabase.from('training_records').select('*'),
      supabase.from('bank_account_records').select('*'),
    ]).then(([mt, pf, ind, tr, bnk]) => {
      if (mt.data?.length)  setMeetingRecords(mt.data.map(meetingFromDb))
      if (pf.data?.length)  setPersonalFiles(pf.data.map(personalFileFromDb))
      if (ind.data?.length) setInductionRecords(ind.data.map(inductionFromDb))
      if (tr.data?.length)  setTrainingRecords(tr.data.map(trainingFromDb))
      if (bnk.data?.length) setBankAccountRecords(bnk.data.map(bankAccFromDb))
      opsLoaded.current = true
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Supabase sync on change ───────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('tic_meetings', JSON.stringify(meetingRecords)); if (opsLoaded.current) { syncTable('meeting_records','id',meetingRecords,prevMt.current,meetingToDb,r=>r.id); prevMt.current=meetingRecords } }, [meetingRecords])
  useEffect(() => { localStorage.setItem('tic_personal_files', JSON.stringify(personalFiles)); if (opsLoaded.current) { syncTable('personal_files','file_no',personalFiles,prevPf.current,personalFileToDb,r=>r.fileNo); prevPf.current=personalFiles } }, [personalFiles])
  useEffect(() => { localStorage.setItem('tic_induction', JSON.stringify(inductionRecords)); if (opsLoaded.current) { syncTable('induction_records','id',inductionRecords,prevInd.current,inductionToDb,r=>r.id); prevInd.current=inductionRecords } }, [inductionRecords])
  useEffect(() => { localStorage.setItem('tic_training', JSON.stringify(trainingRecords)); if (opsLoaded.current) { syncTable('training_records','id',trainingRecords,prevTr.current,trainingToDb,r=>r.id); prevTr.current=trainingRecords } }, [trainingRecords])
  useEffect(() => { localStorage.setItem('tic_bank_acc', JSON.stringify(bankAccountRecords)); if (opsLoaded.current) { syncTable('bank_account_records','id',bankAccountRecords,prevBnk.current,bankAccToDb,r=>r.id); prevBnk.current=bankAccountRecords } }, [bankAccountRecords])

  // NOTE: auto-copy from employees removed — Personal Files and Bank Accounts
  // are now managed manually via Add Staff picker and CSV import.

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
        {!isHOD && <button className={activeSection === 'files' ? 'active' : ''} onClick={() => setActiveSection('files')} type="button">Personal Files</button>}
        {!isHOD && <button className={activeSection === 'induction' ? 'active' : ''} onClick={() => setActiveSection('induction')} type="button">Induction</button>}
        <button className={activeSection === 'training' ? 'active' : ''} onClick={() => setActiveSection('training')} type="button">Training</button>
        {!isHOD && <button className={activeSection === 'bank' ? 'active' : ''} onClick={() => setActiveSection('bank')} type="button">Bank Account</button>}
        <button className={activeSection === 'meetings' ? 'active' : ''} onClick={() => setActiveSection('meetings')} type="button">
          Minutes
        </button>
      </div>
      {activeSection === 'files'     && <PersonalFilesSection records={personalFiles} onUpdate={setPersonalFiles} employees={employees} isAdmin={userRole === 'Admin'} />}
      {activeSection === 'induction' && <InductionSection employees={employees} records={inductionRecords} onUpdate={setInductionRecords} onBack={() => {}} />}
      {activeSection === 'training'  && <TrainingSection records={trainingRecords} employees={employees} onUpdate={setTrainingRecords} onBack={() => {}} />}
      {activeSection === 'bank'      && <BankAccountSection employees={employees} records={bankAccountRecords} onUpdate={setBankAccountRecords} onBack={() => {}} />}
      {activeSection === 'meetings'  && <MeetingsSection records={meetingRecords} onUpdate={setMeetingRecords} employees={employees} activeLeaves={activeLeaves} />}
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
  const [section, setSection] = useState(record.section)
  const [department, setDepartment] = useState(record.department)
  const [empFromDB, setEmpFromDB] = useState(!!record.employeeId && !!record.employeeName)
  const [requestType, setRequestType] = useState<StaffRequestRecord['requestType']>(record.requestType)
  const [priority, setPriority] = useState<RequestPriority>(record.priority)
  const [description, setDescription] = useState(record.description)
  const [submittedDate, setSubmittedDate] = useState(record.submittedDate)
  const [completedDate, setCompletedDate] = useState(record.completedDate)
  const [status, setStatus] = useState<StaffRequestRecord['status']>(record.status)
  const [actionTaken, setActionTaken] = useState(record.actionTaken)

  const empDir = useMemo(() => new Map(employees.map((e) => [e.employeeId.trim().toUpperCase(), e])), [employees])

  const handleEmpIdChange = (val: string) => {
    setEmployeeId(val)
    const matched = empDir.get(val.trim().toUpperCase())
    if (matched) {
      setEmployeeName(matched.fullName)
      setSection(matched.department)
      setDepartment('THILAFUSHI INDUSTRIAL COMPLEX')
      setEmpFromDB(true)
    } else {
      setEmpFromDB(false)
    }
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    onSave({ ...record, id: isNew ? `REQ-${Date.now()}` : record.id, employeeId, employeeName, section, department, requestType, priority, description, submittedDate, completedDate: isNew ? '' : completedDate, status: isNew ? 'Open' : status, actionTaken: isNew ? '' : actionTaken })
  }

  const fieldStyle = { padding: '7px 10px', borderRadius: '7px', border: '1.5px solid rgba(124,58,237,0.2)', fontSize: '0.85rem', background: '#fff', width: '100%' }
  const roStyle    = { ...fieldStyle, background: '#f8fafc', color: '#374151' }

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
            <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:10 }}>
              <span className="trn-modal-field-lbl">Employee ID</span>
              <input value={employeeId} onChange={(e) => handleEmpIdChange(e.target.value)}
                placeholder="Enter ID to auto-fill name, section and department" style={{ ...fieldStyle, maxWidth:240 }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Name {empFromDB && <span style={{ color:'#16a34a', fontSize:'0.75rem' }}>✓</span>}</span>
                <input value={employeeName} onChange={empFromDB ? undefined : (e) => setEmployeeName(e.target.value)}
                  readOnly={empFromDB} required placeholder="Full name" style={empFromDB ? roStyle : fieldStyle} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Section {empFromDB && <span style={{ color:'#16a34a', fontSize:'0.75rem' }}>✓</span>}</span>
                <input value={section} onChange={empFromDB ? undefined : (e) => setSection(e.target.value)}
                  readOnly={empFromDB} placeholder="Employee's section" style={empFromDB ? roStyle : fieldStyle} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Department {empFromDB && <span style={{ color:'#16a34a', fontSize:'0.75rem' }}>✓</span>}</span>
                <input value={department} onChange={empFromDB ? undefined : (e) => setDepartment(e.target.value)}
                  readOnly={empFromDB} placeholder="Organisation department" style={empFromDB ? roStyle : fieldStyle} />
              </label>
            </div>
          </div>

          {/* Request details card */}
          <div className="trn-modal-card" style={{ marginBottom: '14px' }}>
            <div className="trn-modal-detail-row">
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Request Type</span>
                <select value={requestType} onChange={(e) => setRequestType(e.target.value as StaffRequestRecord['requestType'])} style={fieldStyle}>
                  <option>Documents</option><option>Villa Metrics</option><option>Yono App</option>
                  <option>Wifi</option><option>IT</option><option>Leave</option>
                  <option>Transfer</option><option>Meals &amp; Stay</option><option>Other</option>
                </select>
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Priority</span>
                <select value={priority} onChange={(e) => setPriority(e.target.value as RequestPriority)} style={fieldStyle}>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                </select>
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Submitted Date</span>
                <input type="date" value={submittedDate} onChange={(e) => setSubmittedDate(e.target.value)} required style={fieldStyle} />
              </label>
            </div>
            {!isNew && (
              <div className="trn-modal-detail-row" style={{ gridTemplateColumns:'1fr 1fr', marginTop:'10px' }}>
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Status</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value as StaffRequestRecord['status'])} style={fieldStyle}>
                    <option>Open</option><option>In Progress</option><option>Resolved</option><option>Rejected</option>
                  </select>
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <span className="trn-modal-field-lbl">Closed Date</span>
                  <input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} style={fieldStyle} />
                </label>
              </div>
            )}
            {isNew && (
              <div style={{ marginTop:10, padding:'8px 12px', background:'#f8fafc', borderRadius:7, border:'1px solid #e2e8f0' }}>
                <span style={{ fontSize:'0.78rem', color:'#64748b' }}>Status will be set to <strong>Open</strong> automatically on creation.</span>
              </div>
            )}
          </div>

          {/* Description + Action Taken */}
          <div className="trn-modal-card">
            <label style={{ display:'flex', flexDirection:'column', gap:'4px', marginBottom:10 }}>
              <span className="trn-modal-field-lbl">Description</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the request" rows={2}
                style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff', resize:'vertical' }} />
            </label>
            {!isNew && (
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Action Taken</span>
                <textarea value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="Notes or resolution details" rows={2}
                  style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff', resize:'vertical' }} />
              </label>
            )}
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
  const [empFromDB, setEmpFromDB] = useState(!!record.employeeId && !!record.employeeName)
  const [visitType, setVisitType] = useState<VisitRecord['visitType']>(record.visitType)
  const [visitDate, setVisitDate] = useState(record.visitDate)
  const [status, setStatus] = useState<VisitRecord['status']>(record.status)
  const [remarks, setRemarks] = useState(record.remarks)

  const empDir = useMemo(() => new Map(employees.map((e) => [e.employeeId.trim().toUpperCase(), e])), [employees])

  const handleEmpIdChange = (val: string) => {
    setEmployeeId(val)
    const matched = empDir.get(val.trim().toUpperCase())
    if (matched) {
      setEmployeeName(matched.fullName)
      setNationality(matched.nationality)
      setEmpFromDB(true)
    } else {
      setEmpFromDB(false)
    }
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    onSave({ ...record, id: isNew ? `VIS-${Date.now()}` : record.id, employeeId, employeeName, department, nicPassportNo, nationality, visitType, visitDate, status, remarks })
  }

  const fieldStyle = { padding: '7px 10px', borderRadius: '7px', border: '1.5px solid rgba(124,58,237,0.2)', fontSize: '0.85rem', background: '#fff', width: '100%' }
  const roStyle    = { ...fieldStyle, background: '#f8fafc', color: '#374151' }

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
          {/* Employee ID — shown first; Name & Nationality auto-fill */}
          <div className="trn-modal-card" style={{ marginBottom: '14px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:12 }}>
              <span className="trn-modal-field-lbl">Employee ID</span>
              <input value={employeeId} onChange={(e) => handleEmpIdChange(e.target.value)}
                placeholder="Enter ID — auto-fills name and nationality"
                style={{ ...fieldStyle, maxWidth:240 }} />
            </div>
            <div className="trn-modal-detail-row" style={{ marginTop: '4px' }}>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Full Name {empFromDB && <span style={{ color:'#16a34a', fontSize:'0.75rem' }}>✓</span>}</span>
                <input value={employeeName} onChange={empFromDB ? undefined : (e) => setEmployeeName(e.target.value)}
                  readOnly={empFromDB} required placeholder="Name" style={empFromDB ? roStyle : fieldStyle} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">NIC / PP No.</span>
                <input value={nicPassportNo} onChange={(e) => setNicPassportNo(e.target.value)}
                  placeholder="Passport or NIC number" style={fieldStyle} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Nationality {empFromDB && <span style={{ color:'#16a34a', fontSize:'0.75rem' }}>✓</span>}</span>
                <input value={nationality} onChange={empFromDB ? undefined : (e) => setNationality(e.target.value)}
                  readOnly={empFromDB} placeholder="Nationality" style={empFromDB ? roStyle : fieldStyle} />
              </label>
            </div>
            <div className="trn-modal-detail-row" style={{ gridTemplateColumns: '1fr', marginTop: '10px' }}>
              <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <span className="trn-modal-field-lbl">Section</span>
                <input value={department} onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Employee section" style={fieldStyle} />
              </label>
            </div>
          </div>

          {/* Visit details */}
          <div className="trn-modal-card">
            <div className="trn-modal-detail-row" style={{ gridTemplateColumns:'2fr 1fr 1fr' }}>
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
    setDepartment('THILAFUSHI INDUSTRIAL COMPLEX')
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
                      <span className="trn-modal-field-lbl">Section <span style={{ color:'#64748b', fontSize:'0.65rem' }}>(auto-filled or manual)</span></span>
                      <input value={section} onChange={(e) => setSection(e.target.value)}
                        placeholder="e.g. STORES, MECHANICAL"
                        style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
                    </label>
                    <label style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      <span className="trn-modal-field-lbl">Department <span style={{ color:'#64748b', fontSize:'0.65rem' }}>(auto-filled or manual)</span></span>
                      <input value={department} onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. THILAFUSHI INDUSTRIAL COMPLEX"
                        style={{ padding:'7px 10px', borderRadius:'7px', border:'1.5px solid rgba(124,58,237,0.2)', fontSize:'0.85rem', background:'#fff' }} />
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

function RequestsSection({ records, employees, onUpdate, isHOD = false }: {
  records: StaffRequestRecord[]
  employees: Employee[]
  onUpdate: (fn: (prev: StaffRequestRecord[]) => StaffRequestRecord[]) => void
  onBack?: () => void
  isHOD?: boolean
}) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editing, setEditing] = useState<StaffRequestRecord | null>(null)
  const [statusMenu, setStatusMenu] = useState<string | null>(null)
  const [resolveModal, setResolveModal] = useState<StaffRequestRecord | null>(null)
  const [resolveAction, setResolveAction] = useState('')

  const filtered = useMemo(() => records.filter((r) =>
    `${r.employeeId} ${r.employeeName} ${r.section} ${r.department} ${r.requestType} ${r.description}`.toLowerCase().includes(search.toLowerCase())
    && (typeFilter === 'All' || r.requestType === typeFilter)
    && (statusFilter === 'All' || r.status === statusFilter)
  ), [records, search, typeFilter, statusFilter])

  const save = (r: StaffRequestRecord) => { onUpdate((prev) => { const idx = prev.findIndex((x) => x.id === r.id); return idx >= 0 ? prev.map((x) => x.id === r.id ? r : x) : [...prev, r] }); setEditing(null) }
  const del = (id: string) => onUpdate((prev) => prev.filter((x) => x.id !== id))

  const changeStatus = (r: StaffRequestRecord, newStatus: StaffRequestRecord['status']) => {
    if (newStatus === 'Resolved') { setResolveAction(r.actionTaken || ''); setResolveModal(r); setStatusMenu(null) }
    else { save({ ...r, status: newStatus, completedDate: (newStatus === 'Rejected') ? new Date().toISOString().slice(0,10) : r.completedDate }); setStatusMenu(null) }
  }

  const newReq = (): StaffRequestRecord => ({
    id: 'REQ-new', employeeId: '', employeeName: '', section: '', department: '', requestType: 'Documents',
    priority: 'Medium', description: '', submittedDate: new Date().toISOString().slice(0, 10),
    completedDate: '', status: 'Open', actionTaken: '',
  })

  return (
    <>
      <section className="employee-workspace">
        <div className="table-toolbar activities-toolbar">
          <label className="search-field"><span>Search</span><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Emp ID, name, description…" /></label>
          <label><span>Type</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option>Documents</option><option>Villa Metrics</option><option>Yono App</option>
              <option>Wifi</option><option>IT</option><option>Leave</option>
              <option>Transfer</option><option>Meals &amp; Stay</option><option>Other</option>
            </select>
          </label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="All">All Statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option><option>Rejected</option></select></label>
          <button className="primary-button vwh" type="button" onClick={() => setEditing(newReq())}>+ Add Request</button>
        </div>
        <div className="employee-table-shell compact-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{whiteSpace:'nowrap'}}>ID</th>
                <th style={{textAlign:'center',whiteSpace:'nowrap'}}>Submitted</th>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Section</th>
                <th style={{textAlign:'center'}}>Type</th>
                <th style={{textAlign:'center'}}>Priority</th>
                <th>Description</th>
                <th style={{textAlign:'center'}}>Status</th>
                <th style={{textAlign:'center',whiteSpace:'nowrap'}}>Closed Date</th>
                <th>Action Taken</th>
                <th style={{textAlign:'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={12} className="empty-row">No requests found</td></tr>
                : filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={{whiteSpace:'nowrap', fontSize:'0.75rem', color:'#6366f1', fontWeight:700}}>{r.id}</td>
                    <td style={{textAlign:'center',fontSize:'0.8rem',whiteSpace:'nowrap'}}>{formatDateDisplay(r.submittedDate)}</td>
                    <td style={{whiteSpace:'nowrap', fontSize:'0.8rem'}}>{r.employeeId || '—'}</td>
                    <td style={{whiteSpace:'nowrap', fontWeight:600}}>{r.employeeName}</td>
                    <td style={{whiteSpace:'nowrap', fontSize:'0.8rem'}}>{r.section || '—'}</td>
                    <td style={{textAlign:'center'}}><span className="req-type-chip">{r.requestType}</span></td>
                    <td style={{textAlign:'center'}}><span className={`req-priority-badge ${priorityColors[r.priority]}`}>{r.priority}</span></td>
                    <td style={{minWidth:220, maxWidth:320}}>
                      <span title={r.description || undefined} style={{ display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden', fontSize:'0.81rem', lineHeight:'1.45', color:'#1e293b' }}>
                        {r.description || '—'}
                      </span>
                    </td>
                    <td style={{textAlign:'center', position:'relative', whiteSpace:'nowrap'}}>
                      {isHOD ? (
                        <StatusBadge status={r.status} />
                      ) : (
                        <button type="button" onClick={() => setStatusMenu(statusMenu === r.id ? null : r.id)}
                          style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
                          <StatusBadge status={r.status} />
                        </button>
                      )}
                      {!isHOD && statusMenu === r.id && (
                        <div style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', zIndex:20,
                          background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:8,
                          boxShadow:'0 4px 14px rgba(0,0,0,0.13)', padding:'4px 0', minWidth:140 }}
                          onMouseLeave={() => setStatusMenu(null)}>
                          {(['Open','In Progress','Resolved','Rejected'] as const).map(s => (
                            <button key={s} type="button" onClick={() => changeStatus(r, s)}
                              style={{ display:'block', width:'100%', padding:'7px 14px', textAlign:'left', background: r.status===s?'#f1f5f9':'none', border:'none', cursor:'pointer', fontSize:'0.78rem', fontWeight: r.status===s?700:400 }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{textAlign:'center',fontSize:'0.8rem',whiteSpace:'nowrap'}}>{r.completedDate ? formatDateDisplay(r.completedDate) : '—'}</td>
                    <td style={{maxWidth:180}}>
                      <span title={r.actionTaken || undefined} style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', fontSize:'0.82rem', lineHeight:'1.4', color:'#64748b' }}>
                        {r.actionTaken || '—'}
                      </span>
                    </td>
                    <td style={{textAlign:'center',whiteSpace:'nowrap'}}>
                      <div className="row-actions" style={{ flexWrap: 'nowrap' }}>
                        <button className="action-glyph edit vwh" title="Edit" onClick={() => setEditing(r)} type="button">✎</button>
                        <button className="action-glyph delete vwh" title="Delete" onClick={() => del(r.id)} type="button">🗑</button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing && <StaffRequestModal record={editing} employees={employees} onClose={() => setEditing(null)} onSave={save} />}
      {resolveModal && (
        <div className="modal-backdrop" role="presentation">
          <section className="registration-modal" role="dialog" aria-modal="true" style={{ maxWidth:480 }}>
            <div className="modal-header">
              <div><p className="eyebrow">Resolve Request</p><h2>{resolveModal.requestType} — {resolveModal.id}</h2></div>
              <button className="icon-button" onClick={() => setResolveModal(null)} type="button">×</button>
            </div>
            <div style={{ padding:'16px 20px' }}>
              <p style={{ fontSize:'0.85rem', color:'#374151', marginBottom:12 }}>
                Confirm marking <strong>{resolveModal.employeeName || resolveModal.employeeId}</strong>'s request as <strong>Resolved</strong>?
              </p>
              <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Action Taken <span style={{ fontWeight:400, color:'#94a3b8' }}>(update if needed)</span></span>
                <textarea value={resolveAction} onChange={e => setResolveAction(e.target.value)}
                  placeholder="Describe what was done to resolve this request…"
                  style={{ padding:'8px 10px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:'0.85rem', minHeight:80, resize:'vertical', width:'100%', boxSizing:'border-box' }} />
              </label>
            </div>
            <div className="modal-actions">
              <button className="quiet-button light" onClick={() => setResolveModal(null)} type="button">Cancel</button>
              <button className="primary-button" type="button" onClick={() => {
                save({ ...resolveModal, status: 'Resolved', actionTaken: resolveAction, completedDate: new Date().toISOString().slice(0,10) })
                setResolveModal(null)
              }}>✓ Confirm Resolved</button>
            </div>
          </section>
        </div>
      )}
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
          <label className="search-field"><span>Search</span><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID, name, NIC/PP, department" /></label>
          <label><span>Type</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option>Visa Medical</option><option>Passport Renewal</option><option>Photo</option>
              <option>Embassy Letter Collection</option><option>Biometric Update</option>
            </select>
          </label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="All">All Statuses</option><option>Scheduled</option><option>Completed</option><option>Cancelled</option></select></label>
          <button className="primary-button vwh" type="button" onClick={() => setEditing(newVisit())}>+ Add Visit</button>
        </div>
        <div className="employee-table-shell compact-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th style={{textAlign:'center'}}>Date</th>
                <th>Emp ID</th><th>Name</th><th>Section</th>
                <th>NIC / PP No.</th><th>Nationality</th>
                <th style={{textAlign:'center', minWidth:160}}>Visit Type</th>
                <th style={{textAlign:'center'}}>Status</th>
                <th>Remarks</th>
                <th style={{textAlign:'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={11} className="empty-row">No visits found</td></tr>
                : filtered.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{textAlign:'center'}}>{i + 1}</td>
                    <td style={{textAlign:'center',whiteSpace:'nowrap'}}>{formatDateDisplay(r.visitDate)}</td>
                    <td>{r.employeeId || '—'}</td>
                    <td>{r.employeeName}</td>
                    <td>{r.department}</td>
                    <td>{r.nicPassportNo || '—'}</td>
                    <td>{r.nationality}</td>
                    <td style={{textAlign:'center'}}><span className="req-type-chip">{r.visitType}</span></td>
                    <td style={{textAlign:'center'}}><StatusBadge status={r.status} /></td>
                    <td style={{maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#64748b', fontSize:'0.82rem'}}>{r.remarks || '—'}</td>
                    <td style={{textAlign:'center'}}>
                      <div className="row-actions">
                        <button className="action-glyph edit vwh" title="Edit" onClick={() => setEditing(r)} type="button">✎</button>
                        <button className="action-glyph delete vwh" title="Delete" onClick={() => del(r.id)} type="button">🗑</button>
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
          <label className="search-field"><span>Search</span><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Employee, type, location" /></label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="All">All Statuses</option><option>Open</option><option>Under Review</option><option>Closed</option></select></label>
          <button className="primary-button vwh" type="button" onClick={() => setEditing(newIncident())}>+ Log Incident</button>
        </div>
        <div className="employee-table-shell compact-scroll"><table className="data-table"><thead><tr><th>Ref No.</th><th>Date</th><th>Time</th><th>Employee</th><th>Section</th><th>Department</th><th>Site / Location</th><th>Type</th><th style={{textAlign:'center'}}>Injury</th><th style={{textAlign:'center'}}>Statement</th><th style={{textAlign:'center'}}>Disciplinary</th><th style={{textAlign:'center'}}>Status</th><th style={{textAlign:'center'}}>Actions</th></tr></thead>
          <tbody>{filtered.length === 0 ? <tr><td colSpan={13} className="empty-row">No incidents found</td></tr> : filtered.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td style={{whiteSpace:'nowrap'}}>{formatDateDisplay(r.incidentDate)}</td>
              <td>{r.timeOfIncident || '—'}</td>
              <td>{r.employeeName || '—'}</td>
              <td>{r.section || '—'}</td>
              <td>{r.department || '—'}</td>
              <td>{r.siteLocation || '—'}</td>
              <td>{r.incidentType}</td>
              <td style={{textAlign:'center'}}>{r.injuryInvolved ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
              <td style={{textAlign:'center'}}>{r.statementTaken ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
              <td style={{textAlign:'center'}}>{r.disciplinaryAction ? <span className="doc-yes">✓</span> : <span className="doc-no">—</span>}</td>
              <td style={{textAlign:'center'}}><StatusBadge status={r.status} /></td>
              <td style={{textAlign:'center'}}><div className="row-actions"><button className="action-glyph" title="View" onClick={() => setViewing(r)} type="button">👁</button><button className="action-glyph edit vwh" title="Edit" onClick={() => setEditing(r)} type="button">✎</button><button className="action-glyph delete vwh" title="Delete" onClick={() => del(r.id)} type="button">🗑</button></div></td>
            </tr>
          ))}</tbody>
        </table></div>
      </section>
      {editing && <IncidentModal record={editing} employees={employees} onClose={() => setEditing(null)} onSave={save} />}
      {viewing && (
        <div className="modal-backdrop" role="presentation">
          <section className="registration-modal incident-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Incident Reference · {viewing.id}</p>
                <h2 style={{ margin:'2px 0 0' }}>{viewing.incidentType}</h2>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <StatusBadge status={viewing.status} />
                <button className="icon-button" onClick={() => setViewing(null)} type="button">×</button>
              </div>
            </div>
            <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14, maxHeight:'70vh', overflowY:'auto' }}>
              {/* Row 1: Core facts */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>
                {[
                  ['Date', formatDateDisplay(viewing.incidentDate)],
                  ['Time', viewing.timeOfIncident || '—'],
                  ['Site / Location', viewing.siteLocation || '—'],
                  ['Section', viewing.section || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ background:'#f8fafc', borderRadius:8, padding:'8px 12px', border:'1px solid #e2e8f0' }}>
                    <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:'0.85rem', fontWeight:600, color:'#1e293b' }}>{value}</div>
                  </div>
                ))}
              </div>
              {/* Row 2: People */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div style={{ background:'#f0f4ff', borderRadius:8, padding:'10px 14px', border:'1px solid #c7d2fe' }}>
                  <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#6366f1', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Involved Employee</div>
                  <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#1e1b4b' }}>{viewing.employeeName || '—'}</div>
                  {viewing.employeeId && <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:2 }}>ID: {viewing.employeeId}</div>}
                  <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:2 }}>Dept: {viewing.department || '—'}</div>
                </div>
                <div style={{ background:'#fefce8', borderRadius:8, padding:'10px 14px', border:'1px solid #fde68a' }}>
                  <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#b45309', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Reported By</div>
                  <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#78350f' }}>{viewing.reportedByName || '—'}</div>
                  {viewing.reportedById && <div style={{ fontSize:'0.75rem', color:'#92400e', marginTop:2 }}>ID: {viewing.reportedById}</div>}
                </div>
              </div>
              {/* Row 3: Flags */}
              <div style={{ display:'flex', gap:10 }}>
                {[
                  ['Injury Involved', viewing.injuryInvolved, '#ef4444', '#fee2e2'],
                  ['Statement Taken', viewing.statementTaken, '#6366f1', '#eef2ff'],
                  ['Disciplinary Action', viewing.disciplinaryAction, '#f59e0b', '#fef3c7'],
                ].map(([label, active, color, bg]) => (
                  <div key={label as string} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:7, background: active ? bg as string : '#f1f5f9', border:`1px solid ${active ? color : '#e2e8f0'}` }}>
                    <span style={{ fontSize:'0.9rem' }}>{active ? '✓' : '—'}</span>
                    <span style={{ fontSize:'0.78rem', fontWeight: active ? 700 : 400, color: active ? color as string : '#94a3b8' }}>{label as string}</span>
                  </div>
                ))}
              </div>
              {/* Summary & Cause */}
              {(viewing.incidentSummary || viewing.immediateCause) && (
                <div style={{ display:'grid', gridTemplateColumns: viewing.incidentSummary && viewing.immediateCause ? '1fr 1fr' : '1fr', gap:10 }}>
                  {viewing.incidentSummary && (
                    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px' }}>
                      <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Summary</div>
                      <div style={{ fontSize:'0.85rem', color:'#334155' }}>{viewing.incidentSummary}</div>
                    </div>
                  )}
                  {viewing.immediateCause && (
                    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px' }}>
                      <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Immediate Cause</div>
                      <div style={{ fontSize:'0.85rem', color:'#334155' }}>{viewing.immediateCause}</div>
                    </div>
                  )}
                </div>
              )}
              {/* Full description */}
              {viewing.description && (
                <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px' }}>
                  <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Incident Description</div>
                  <div style={{ fontSize:'0.85rem', color:'#334155', lineHeight:1.6 }}>{viewing.description}</div>
                </div>
              )}
              {/* Action taken */}
              {viewing.actionTaken && (
                <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'10px 14px' }}>
                  <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#166534', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Action Taken</div>
                  <div style={{ fontSize:'0.85rem', color:'#14532d', lineHeight:1.6 }}>{viewing.actionTaken}</div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="primary-button vwh" type="button" onClick={() => { setViewing(null); setEditing(viewing) }}>✎ Edit</button>
              <button className="back-btn-sm" type="button" onClick={() => setViewing(null)}>Close</button>
            </div>
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

  const stockPct = (item: InventoryItem) => item.minQuantity > 0 ? Math.min(100, Math.round(item.quantity / item.minQuantity * 100)) : 100
  const stockColor = (item: InventoryItem) => item.quantity <= 0 ? '#dc2626' : item.quantity <= item.minQuantity ? '#f59e0b' : '#16a34a'

  const catColor = cat === 'Medical' ? { accent: '#059669', light: '#f0fdf4', border: '#bbf7d0', badge: '#16a34a' }
    : { accent: '#2563eb', light: '#eff6ff', border: '#bfdbfe', badge: '#2563eb' }

  const issueCount = usage.filter(u => catItemIds.has(u.itemId)).length
  const totalStock = catItems.reduce((s, i) => s + i.quantity, 0)

  return (
    <>
      {/* Category header banner */}
      <div className="inv-cat-banner" style={{ background: `linear-gradient(135deg, ${catColor.accent} 0%, ${catColor.accent}cc 100%)` }}>
        <div className="inv-cat-banner-icon">
          {cat === 'Medical'
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
        </div>
        <div>
          <p className="inv-banner-eyebrow">Inventory</p>
          <h3 className="inv-banner-title">{cat} Supplies</h3>
        </div>
        <div className="inv-banner-kpis">
          <div className="inv-banner-kpi"><span className="inv-banner-num">{catItems.length}</span><span className="inv-banner-lbl">Items</span></div>
          <div className="inv-banner-kpi"><span className="inv-banner-num">{totalStock}</span><span className="inv-banner-lbl">In Stock</span></div>
          {lowStockCount > 0 && <div className="inv-banner-kpi inv-banner-kpi-warn"><span className="inv-banner-num">{lowStockCount}</span><span className="inv-banner-lbl">Low Stock</span></div>}
          <div className="inv-banner-kpi"><span className="inv-banner-num">{issueCount}</span><span className="inv-banner-lbl">Issued</span></div>
        </div>
        <button className="inv-add-btn vwh" onClick={() => setEditingItem(newItem())} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Item
        </button>
      </div>

      {/* Search bar */}
      <div style={{ padding: '10px 0 6px', display: 'flex', gap: 10 }}>
        <label className="search-field" style={{ flex: 1 }}>
          <span>Search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${cat} items by name or location…`} />
        </label>
      </div>

      {/* Main layout: items cards + dept sidebar */}
      <div className="inv-redesign-layout">
        {/* Items */}
        <div className="inv-items-area">
          {filtered.length === 0
            ? <div className="leave-empty-zone">No {cat} items yet. Click "Add Item" above.</div>
            : filtered.map(item => {
              const isLow = item.quantity <= item.minQuantity
              const isEmpty = item.quantity === 0
              const pct = stockPct(item)
              const color = stockColor(item)
              return (
                <div key={item.id} className={`inv-item-card${isLow ? ' inv-item-low' : ''}${isEmpty ? ' inv-item-empty' : ''}`}>
                  <div className="inv-item-card-left">
                    <div className="inv-item-name">
                      {item.name}
                      {isEmpty && <span className="inv-badge-empty">Out of Stock</span>}
                      {!isEmpty && isLow && <span className="inv-badge-low">Low Stock</span>}
                    </div>
                    <div className="inv-item-meta">{item.location || '—'}{item.remarks ? ` · ${item.remarks}` : ''}</div>
                    {/* Stock level bar */}
                    <div className="inv-stock-bar-wrap">
                      <div className="inv-stock-bar-track">
                        <div className="inv-stock-bar-fill" style={{ width: `${Math.min(100,pct)}%`, background: color }} />
                      </div>
                      <span className="inv-stock-label" style={{ color }}>
                        {item.quantity} / {item.minQuantity} {item.unit}
                      </span>
                    </div>
                  </div>
                  <div className="inv-item-card-right">
                    <div className="inv-item-qty" style={{ color }}>
                      <span className="inv-qty-num">{item.quantity}</span>
                      <span className="inv-qty-unit">{item.unit}</span>
                    </div>
                    <div className="inv-item-actions">
                      <button className="inv-issue-btn vwh" onClick={() => setUsingItem(item)} type="button" title="Issue item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="8 5 2 12 8 19"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                        Issue
                      </button>
                      <button className="action-glyph edit vwh" onClick={() => setEditingItem(item)} type="button" title="Edit">✎</button>
                      <button className="action-glyph delete vwh" onClick={() => delItem(item.id)} type="button" title="Delete">🗑</button>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Dept issuance sidebar */}
        {deptBreakdown.length > 0 && (
          <div className="inv-dept-panel" style={{ borderColor: catColor.border, background: catColor.light }}>
            <p className="inv-dept-title" style={{ color: catColor.accent }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: 5 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Issued to Departments
            </p>
            {deptBreakdown.map(([dept, val]) => (
              <div className="inv-dept-row" key={dept}>
                <div className="inv-dept-name" title={dept}>{dept}</div>
                <div className="inv-dept-track">
                  <div className="inv-dept-fill" style={{ width: `${Math.round((val.qty / maxDept) * 100)}%`, background: catColor.accent }} />
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
        <button className="primary-button toolbar-add-btn vwh" onClick={()=>setEditing(newOrder())} type="button">+ New Order</button>
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
                      {o.status === 'Pending' && <button className="action-glyph vwh" style={{color:'#16a34a',fontSize:'0.75rem',fontWeight:700,padding:'2px 7px',background:'#dcfce7',borderRadius:6,border:'none',cursor:'pointer'}} onClick={()=>markReceived(o)} type="button" title="Mark received">✓ Received</button>}
                      <button className="action-glyph edit vwh"   onClick={()=>setEditing(o)} type="button" title="Edit">✎</button>
                      <button className="action-glyph delete vwh" onClick={()=>del(o.id)}    type="button" title="Delete">🗑</button>
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

function InventorySection({ items, usage, orders, onUpdateItems, onUpdateUsage, onUpdateOrders, employees }: {
  items: InventoryItem[]
  usage: InventoryUsageRecord[]
  orders: StoreOrder[]
  onUpdateItems: (fn: (prev: InventoryItem[]) => InventoryItem[]) => void
  onUpdateUsage: (fn: (prev: InventoryUsageRecord[]) => InventoryUsageRecord[]) => void
  onUpdateOrders: (fn: (prev: StoreOrder[]) => StoreOrder[]) => void
  employees: Employee[]
}) {
  const [subTab, setSubTab] = useState<'stationery' | 'medical' | 'refresher' | 'orders' | 'history'>('stationery')
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
  const totalLow    = items.filter(i => i.quantity <= i.minQuantity).length
  const medLow      = items.filter(i => i.category === 'Medical' && i.quantity <= i.minQuantity).length
  const ordPending  = orders.filter(o => o.status === 'Pending').length

  return (
    <section className="employee-workspace inv-workspace">
      {/* Main tabs */}
      <div className="inv-main-tabs">
        <button className={`inv-tab-btn${subTab === 'stationery' ? ' inv-tab-active inv-tab-blue' : ''}`} onClick={() => setSubTab('stationery')} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Stationery
          {items.filter(i => i.category === 'Stationery').length > 0 && (
            <span className="inv-tab-count">{items.filter(i => i.category === 'Stationery').length}</span>
          )}
        </button>
        <button className={`inv-tab-btn${subTab === 'medical' ? ' inv-tab-active inv-tab-green' : ''}`} onClick={() => setSubTab('medical')} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Medical
          {medLow > 0 && <span className="inv-tab-count inv-tab-count-warn">{medLow}</span>}
        </button>
        <button className={`inv-tab-btn${subTab === 'refresher' ? ' inv-tab-active inv-tab-orange' : ''}`} onClick={() => setSubTab('refresher')} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
          Refresher
          {items.filter(i=>i.category==='Refresher').length > 0 && <span className="inv-tab-count">{items.filter(i=>i.category==='Refresher').length}</span>}
        </button>
        <button className={`inv-tab-btn${subTab === 'orders' ? ' inv-tab-active inv-tab-teal' : ''}`} onClick={() => setSubTab('orders')} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>
          Orders
          {ordPending > 0 && <span className="inv-tab-count inv-tab-count-warn">{ordPending}</span>}
        </button>
        <button className={`inv-tab-btn${subTab === 'history' ? ' inv-tab-active inv-tab-purple' : ''}`} onClick={() => setSubTab('history')} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Usage History
          {usage.length > 0 && <span className="inv-tab-count">{usage.length}</span>}
        </button>
        {totalLow > 0 && (
          <div className="inv-alert-pill">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {totalLow} item{totalLow !== 1 ? 's' : ''} need reorder
          </div>
        )}
      </div>

      {subTab === 'stationery' && (
        <InventoryCategoryTab cat="Stationery" items={items} usage={usage} onUpdateItems={onUpdateItems} onUpdateUsage={onUpdateUsage} employees={employees} />
      )}

      {subTab === 'medical' && (
        <InventoryCategoryTab cat="Medical" items={items} usage={usage} onUpdateItems={onUpdateItems} onUpdateUsage={onUpdateUsage} employees={employees} />
      )}

      {subTab === 'refresher' && (
        <InventoryCategoryTab cat="Refresher" items={items} usage={usage} onUpdateItems={onUpdateItems} onUpdateUsage={onUpdateUsage} employees={employees} />
      )}

      {subTab === 'orders' && (
        <OrdersTab orders={orders} items={items} onUpdateOrders={onUpdateOrders} />
      )}

      {subTab === 'history' && (
        <>
          <div className="table-toolbar" style={{ display: 'flex', gap: 10, padding: '10px 0', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label className="search-field" style={{ flex: 2 }}><span>Search</span><input type="text" value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="Item name, employee, department, purpose…" /></label>
            <label><span>Department</span>
              <select value={histDeptFilter} onChange={e => setHistDeptFilter(e.target.value)}>
                {histDepts.map(d => <option key={d}>{d}</option>)}
              </select>
            </label>
          </div>
          <div className="employee-table-shell compact-scroll">
            <table className="data-table inv-table">
              <thead><tr>
                <th>Date</th><th>Item</th><th>Category</th>
                <th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'center' }}>Unit</th>
                <th>Issued To</th><th>Issued By</th><th>Purpose</th>
              </tr></thead>
              <tbody>
                {filteredHistory.length === 0
                  ? <tr><td colSpan={8} className="empty-row">No usage records found.</td></tr>
                  : filteredHistory.map(u => {
                    const catItem = items.find(i => i.id === u.itemId)
                    const isMedial = catItem?.category === 'Medical'
                    return (
                      <tr key={u.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDateDisplay(u.usedDate)}</td>
                        <td><strong>{u.itemName}</strong></td>
                        <td>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: isMedial ? '#f0fdf4' : '#eff6ff', color: isMedial ? '#059669' : '#2563eb', border: `1px solid ${isMedial ? '#bbf7d0' : '#bfdbfe'}` }}>
                            {catItem?.category ?? '—'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}><strong>{u.quantityUsed}</strong></td>
                        <td style={{ textAlign: 'center' }}>{u.unit}</td>
                        <td><strong>{u.department}</strong></td>
                        <td>{u.usedBy}</td>
                        <td>{u.purpose}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function ActivitiesPage({
  employees,
  passportHandovers,
  onUpdatePassport,
  tripRequests,
  onUpdateTripRequests,
  inventoryItems,
  inventoryUsage,
  inventoryOrders,
  onUpdateInventoryItems,
  onUpdateInventoryUsage,
  onUpdateInventoryOrders,
  isHOD = false,
  isHR = false,
  currentUserSections = [],
  currentUserName = '',
}: {
  employees: Employee[]
  passportHandovers: PassportRecord[]
  onUpdatePassport: (fn: (prev: PassportRecord[]) => PassportRecord[]) => void
  tripRequests: TripRequest[]
  onUpdateTripRequests: (fn: (prev: TripRequest[]) => TripRequest[]) => void
  inventoryItems: InventoryItem[]
  inventoryUsage: InventoryUsageRecord[]
  inventoryOrders: StoreOrder[]
  onUpdateInventoryItems: (fn: (prev: InventoryItem[]) => InventoryItem[]) => void
  onUpdateInventoryUsage: (fn: (prev: InventoryUsageRecord[]) => InventoryUsageRecord[]) => void
  onUpdateInventoryOrders: (fn: (prev: StoreOrder[]) => StoreOrder[]) => void
  isHOD?: boolean
  isHR?: boolean
  currentUserSections?: string[]
  currentUserName?: string
}) {
  const [activeSection, setActiveSection] = useState<ActivitiesSection>('requests')
  const [staffRequests,   setStaffRequests]   = useState<StaffRequestRecord[]>(() => tryLoad('tic_staff_req'))
  const [visitRecords,    setVisitRecords]    = useState<VisitRecord[]>(() => tryLoad('tic_visit_rec'))
  const [incidentRecords, setIncidentRecords] = useState<IncidentRecord[]>(() => tryLoad('tic_incidents'))

  // ── Supabase load on mount ────────────────────────────────────────────────
  const actLoaded = useRef(false)
  const prevSr  = useRef<StaffRequestRecord[]>([])
  const prevVr  = useRef<VisitRecord[]>([])
  const prevIr  = useRef<IncidentRecord[]>([])

  useEffect(() => {
    Promise.all([
      supabase.from('staff_requests').select('*'),
      supabase.from('visit_records').select('*'),
      supabase.from('incident_records').select('*'),
    ]).then(([sr, vr, ir]) => {
      if (sr.data?.length) setStaffRequests(sr.data.map(staffReqFromDb))
      if (vr.data?.length) setVisitRecords(vr.data.map(visitFromDb))
      if (ir.data?.length) setIncidentRecords(ir.data.map(incidentFromDb))
      actLoaded.current = true
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Supabase sync on change ───────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('tic_staff_req', JSON.stringify(staffRequests)); if (actLoaded.current) { syncTable('staff_requests','id',staffRequests,prevSr.current,staffReqToDb,r=>r.id); prevSr.current=staffRequests } }, [staffRequests])
  useEffect(() => { localStorage.setItem('tic_visit_rec', JSON.stringify(visitRecords)); if (actLoaded.current) { syncTable('visit_records','id',visitRecords,prevVr.current,visitToDb,r=>r.id); prevVr.current=visitRecords } }, [visitRecords])
  useEffect(() => { localStorage.setItem('tic_incidents', JSON.stringify(incidentRecords)); if (actLoaded.current) { syncTable('incident_records','id',incidentRecords,prevIr.current,incidentToDb,r=>r.id); prevIr.current=incidentRecords } }, [incidentRecords])

  // For HOD: limit Requests/Visits to records tied to the assigned section(s)
  const scopedStaffRequests = isHOD ? staffRequests.filter((r) => currentUserSections.includes(r.section)) : staffRequests
  const scopedVisitRecords  = isHOD ? visitRecords.filter((r) => currentUserSections.includes(r.department)) : visitRecords

  return (
    <>
      <PageHeader eyebrow="Activities" title="Activities" />
      <div className="section-inline-tabs">
        <button className={activeSection === 'requests' ? 'active' : ''} onClick={() => setActiveSection('requests')} type="button">Requests</button>
        <button className={activeSection === 'visits' ? 'active' : ''} onClick={() => setActiveSection('visits')} type="button">Visits</button>
        {!isHOD && <button className={activeSection === 'incidents' ? 'active' : ''} onClick={() => setActiveSection('incidents')} type="button">Incidents</button>}
        {!isHOD && <button className={activeSection === 'passport' ? 'active' : ''} onClick={() => setActiveSection('passport')} type="button">Passports</button>}
        {!isHOD && !isHR && <button className={activeSection === 'tripreq' ? 'active' : ''} onClick={() => setActiveSection('tripreq')} type="button">Trip Req</button>}
        {!isHOD && !isHR && <button className={activeSection === 'inventory' ? 'active' : ''} onClick={() => setActiveSection('inventory')} type="button">Inventory</button>}
      </div>
      {activeSection === 'requests' && <RequestsSection records={scopedStaffRequests} employees={employees} onUpdate={setStaffRequests} onBack={() => {}} isHOD={isHOD} />}
      {activeSection === 'visits' && <VisitsSection records={scopedVisitRecords} employees={employees} onUpdate={setVisitRecords} onBack={() => {}} />}
      {!isHOD && activeSection === 'incidents' && <IncidentsSection records={incidentRecords} employees={employees} onUpdate={setIncidentRecords} onBack={() => {}} />}
      {!isHOD && activeSection === 'passport' && <PassportTrackingSection records={passportHandovers} employees={employees} onUpdate={onUpdatePassport} />}
      {!isHOD && !isHR && activeSection === 'tripreq' && <TripReqSection records={tripRequests} employees={employees} onUpdate={onUpdateTripRequests} currentUserName={currentUserName} />}
      {!isHOD && !isHR && activeSection === 'inventory' && <InventorySection items={inventoryItems} usage={inventoryUsage} orders={inventoryOrders} onUpdateItems={onUpdateInventoryItems} onUpdateUsage={onUpdateInventoryUsage} onUpdateOrders={onUpdateInventoryOrders} employees={employees} />}
    </>
  )
}

type UserRole = 'Admin' | 'HR' | 'Viewer' | 'HOD'
type AppUserStatus = 'Active' | 'Inactive'

type AppUser = {
  id: string
  name: string
  username: string
  password?: string
  role: UserRole
  status: AppUserStatus
  lastLogin: string
  designation?: string
  /** Section(s) this Head of Department is scoped to — only relevant when role === 'HOD' */
  sections?: string[]
}

const initialAppUsers: AppUser[] = [
  { id: 'USR-001', name: 'Administrator', username: 'admin', password: 'TIC@Admin#2026', role: 'Admin', status: 'Active', lastLogin: '2026-06-01', designation: 'System Administrator' },
  { id: 'USR-002', name: 'Viewer', username: 'viewer', password: 'TIC@View#2026', role: 'Viewer', status: 'Active', lastLogin: '2026-06-01', designation: 'Read-only User' },
]

const rolePermissions: Record<UserRole, string> = {
  'Admin': 'Full access — view, edit, delete, manage users',
  'HR': 'View and edit HR records (Employees, Leave, Operations, Termination) — no user management, no Trip Req or Inventory',
  'Viewer': 'Read-only access to employees and leave records',
  'HOD': 'Read-only access scoped to assigned section(s) only',
}

function UserFormModal({ user, employees, onClose, onSave }: {
  user: AppUser & { password?: string }
  employees: Employee[]
  onClose: () => void
  onSave: (user: AppUser) => Promise<void>
}) {
  const isNew = user.id.startsWith('USR-new')
  const [name, setName] = useState(user.name)
  const [username, setUsername] = useState(user.username)
  const [designation, setDesignation] = useState(user.designation ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(user.role)
  const [status, setStatus] = useState<AppUserStatus>(user.status)
  const [showPassword, setShowPassword] = useState(false)
  const [sections, setSections] = useState<string[]>(user.sections ?? [])
  const [empSearch, setEmpSearch] = useState('')
  const [showEmpDrop, setShowEmpDrop] = useState(false)

  const empResults = useMemo(() => {
    const q = empSearch.trim().toLowerCase()
    if (!q || q.includes('(')) return []
    return employees.filter(e =>
      e.fullName.toLowerCase().includes(q) || e.employeeId.includes(q)
    ).slice(0, 8)
  }, [empSearch, employees])

  const pickEmp = (e: Employee) => {
    setName(e.fullName)
    setDesignation(e.designation)
    const lastName = e.fullName.trim().split(/\s+/).at(-1)?.toLowerCase() ?? ''
    setUsername(lastName + e.employeeId)
    setEmpSearch(`${e.fullName} (${e.employeeId})`)
    setShowEmpDrop(false)
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
    const pwd = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setPassword(pwd)
    setShowPassword(true)
  }

  const toggleSection = (dept: string) => {
    setSections((prev) => prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept])
  }

  const [isSaving, setIsSaving] = useState(false)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (isNew && !password) { alert('Password is required for new users.'); return }
    setIsSaving(true)
    await onSave({
      ...user,
      id: isNew ? 'USR-new' : user.id,
      name, username, designation, role, status,
      lastLogin: user.lastLogin || new Date().toISOString().slice(0, 10),
      password: password || user.password,
      sections: role === 'HOD' ? sections : [],
    })
    setIsSaving(false)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">User Management</p>
            <h2>{isNew ? 'Add User' : `Edit — ${user.name}`}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">✕</button>
        </div>
        <form onSubmit={save}>
          {/* Employee quick-fill */}
          <div className="uf-emp-search-wrap" style={{ position:'relative', marginBottom:16 }}>
            <label className="uf-emp-search-label">
              <span>Quick-fill from Employee Directory</span>
              <em className="uf-emp-hint">(optional — auto-fills name, designation & username)</em>
            </label>
            <input
              className="uf-emp-search-input"
              value={empSearch}
              onChange={e => { setEmpSearch(e.target.value); setShowEmpDrop(true) }}
              onFocus={() => setShowEmpDrop(true)}
              onBlur={() => setTimeout(() => setShowEmpDrop(false), 150)}
              placeholder="Search employee by name or ID…"
              autoComplete="off"
            />
            {showEmpDrop && empResults.length > 0 && (
              <div className="ei-emp-dropdown">
                {empResults.map(e => (
                  <div key={e.employeeId} className="ei-emp-option" onMouseDown={() => pickEmp(e)}>
                    <strong>{e.fullName}</strong>
                    <span>{e.employeeId} · {e.designation} · {e.department}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-grid">
            <label><span>Full Name</span><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Display name" /></label>
            <label><span>Username</span><input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Login username" /></label>
            <label><span>Designation</span><input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. HR Officer" /></label>
            <label><span>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                <option value="Admin">Admin</option>
                <option value="HR">HR</option>
                <option value="Viewer">Viewer</option>
                <option value="HOD">HOD</option>
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
                <button type="button" className="password-toggle" onClick={generatePassword} style={{ background:'#ede9fe', color:'#6d28d9', borderColor:'#c4b5fd' }}>Generate</button>
              </div>
            </label>
            {role === 'HOD' && (
              <div className="full-field">
                <span>Assigned Section(s)</span>
                <div className="hod-section-grid">
                  {departmentsList.map((d) => (
                    <label key={d} className="hod-section-check">
                      <input type="checkbox" checked={sections.includes(d)} onChange={() => toggleSection(d)} />
                      <span>{d}</span>
                    </label>
                  ))}
                </div>
                {sections.length === 0 && <p className="hod-section-warn">Select at least one section this HOD will be able to view.</p>}
              </div>
            )}
            <div className="full-field user-role-hint">
              <strong>{role}</strong>
              <span>{rolePermissions[role]}</span>
            </div>
          </div>
          <div className="modal-actions">
            <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : isNew ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function SettingsPage({ employees, leaveRequests: _lr, activeLeaves: _al, onReset, currentUserName, loggedInUser, users, onUpdateUsers }: {
  employees: Employee[]
  leaveRequests: LeaveRequestRecord[]
  activeLeaves: ActiveLeaveRecord[]
  onReset: () => void
  loggedInUser: AppUser | null
  currentUserName: string
  users: AppUser[]
  onUpdateUsers: (fn: (prev: AppUser[]) => AppUser[]) => void
}) {
  const [editing,     setEditing]     = useState<AppUser | null>(null)
  const [showAdd,     setShowAdd]     = useState(false)
  const [search,      setSearch]      = useState('')
  const [showChangePw,setShowChangePw]= useState(false)
  const [_saving,     _setSaving]     = useState(false); void _saving; void _setSaving

  const filtered = users.filter((u) =>
    `${u.name} ${u.username} ${u.role}`.toLowerCase().includes(search.toLowerCase())
  )

  // Helper: map a Supabase profiles row → AppUser
  const mapProfile = (d: Record<string, unknown>): AppUser => ({
    id:          d.id as string,
    name:        d.name as string,
    username:    d.username as string,
    role:        d.role as UserRole,
    designation: (d.designation as string) ?? '',
    sections:    (d.sections as string[]) ?? [],
    status:      d.status as AppUserStatus,
    lastLogin:   (d.last_login as string) ?? '',
  })

  // Reload users list from Supabase
  const refreshUsers = async () => {
    const { data } = await supabase.from('profiles').select('*')
    if (data) onUpdateUsers(() => data.map(mapProfile))
  }

  const saveUser = async (user: AppUser) => {
    _setSaving(true)
    const isNew = user.id.startsWith('USR-new')
    try {
      if (isNew) {
        // Create new auth user + profile via Edge Function
        const { data, error } = await supabase.functions.invoke('manage-user', {
          body: {
            action:      'create',
            username:    user.username,
            password:    user.password,
            name:        user.name,
            role:        user.role,
            designation: user.designation ?? '',
            sections:    user.sections ?? [],
          },
        })
        if (error || !data?.success) {
          alert('Failed to create user: ' + (data?.error ?? error?.message))
          return
        }
        await refreshUsers()
      } else {
        // Update profile + metadata via Edge Function
        const { data, error } = await supabase.functions.invoke('manage-user', {
          body: {
            action:      'update',
            userId:      user.id,
            name:        user.name,
            role:        user.role,
            designation: user.designation ?? '',
            sections:    user.sections ?? [],
            ...(user.password ? { password: user.password } : {}),
          },
        })
        if (error || !data?.success) {
          alert('Failed to update user: ' + (data?.error ?? error?.message))
          return
        }
        onUpdateUsers((prev) => prev.map((u) =>
          u.id === user.id
            ? { ...u, name: user.name, role: user.role, designation: user.designation ?? '', sections: user.sections ?? [] }
            : u
        ))
      }
    } finally {
      _setSaving(false)
      setEditing(null)
      setShowAdd(false)
    }
  }

  const deleteUser = async (id: string) => {
    if (!window.confirm('Delete this user? They will lose all access immediately.')) return
    const { data, error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'delete', userId: id },
    })
    if (error || !data?.success) {
      alert('Failed to delete user: ' + (data?.error ?? error?.message))
      return
    }
    onUpdateUsers((prev) => prev.filter((u) => u.id !== id))
  }

  const toggleStatus = async (id: string) => {
    const target = users.find((u) => u.id === id)
    if (!target) return
    const newStatus: AppUserStatus = target.status === 'Active' ? 'Inactive' : 'Active'
    await supabase.from('profiles').update({ status: newStatus }).eq('id', id)
    onUpdateUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: newStatus } : u))
  }

  const newUser: AppUser = { id: 'USR-new', name: '', username: '', role: 'HR', status: 'Active', lastLogin: '' }

  const roleColors: Record<UserRole, string> = {
    'Admin': 'role-admin',
    'HR': 'role-hr',
    'Viewer': 'role-viewer',
    'HOD': 'role-hod',
  }

  // Helpers for profile card
  const profileInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'A'
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  // Use Supabase-loaded profile as authoritative fallback — never fall back to
  // users[0] which was causing the admin-view flash for non-admin users
  const currentAppUser = users.find(u => u.name === currentUserName) ?? loggedInUser ?? null
  const isAdmin = currentAppUser?.role === 'Admin'
  const [settingsTab, setSettingsTab] = useState<'users' | 'system'>('users')

  return (
    <div className="settings-page user-mgmt-page">
      {/* Profile Card — always shown */}
      <div className="settings-profile-card">
        <div className="settings-avatar">{profileInitials(currentAppUser?.name ?? currentUserName)}</div>
        <div className="settings-profile-info">
          <div className="settings-profile-name-row">
            <div className="profile-name">{currentAppUser?.name ?? currentUserName}</div>
            <span className="settings-role-badge">{currentAppUser?.role ?? 'Admin'}</span>
          </div>
          <div className="profile-desig">{currentAppUser?.designation ?? 'HR Staff'}</div>
          <div className="profile-username">@{currentAppUser?.username ?? 'admin'}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="quiet-button light" type="button" onClick={() => setShowChangePw(true)} style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}>
            Change Password
          </button>
        </div>
      </div>

      {/* Non-admin: own details only */}
      {!isAdmin && (
        <div className="user-mgmt-table-wrap" style={{ marginTop: 16 }}>
          <div className="user-table-toolbar">
            <h2 style={{ fontSize: '0.84rem', fontWeight: 700, color: '#374151', margin: 0 }}>My Account Details</h2>
          </div>
          <div className="employee-table-shell">
            <table className="data-table user-table">
              <thead>
                <tr><th>Name</th><th>Username</th><th>Role</th><th>Designation</th>{currentAppUser?.role === 'HOD' && <th>Assigned Section(s)</th>}<th>Status</th><th>Last Login</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><div className="user-avatar-cell"><span className="user-avatar">{profileInitials(currentAppUser?.name ?? currentUserName)}</span><strong>{currentAppUser?.name ?? currentUserName}</strong></div></td>
                  <td><code className="user-username">{currentAppUser?.username ?? '—'}</code></td>
                  <td><span className={`role-chip ${roleColors[currentAppUser?.role ?? 'HR']}`}>{currentAppUser?.role ?? '—'}</span></td>
                  <td>{currentAppUser?.designation ?? '—'}</td>
                  {currentAppUser?.role === 'HOD' && (
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(currentAppUser?.sections ?? []).length === 0
                          ? <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>None assigned</span>
                          : currentAppUser!.sections!.map((s) => <span key={s} className="req-type-chip">{s}</span>)}
                      </div>
                    </td>
                  )}
                  <td><span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '2px 9px', borderRadius: 8 }}>{currentAppUser?.status ?? 'Active'}</span></td>
                  <td>{currentAppUser?.lastLogin ? formatDateDisplay(currentAppUser.lastLogin) : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin: tabbed view */}
      {isAdmin && (
        <>
          {/* Tab bar */}
          <div className="settings-tabs">
            <button type="button" className={`settings-tab-btn${settingsTab === 'users' ? ' active' : ''}`} onClick={() => setSettingsTab('users')}>
              Users
            </button>
            <button type="button" className={`settings-tab-btn${settingsTab === 'system' ? ' active' : ''}`} onClick={() => setSettingsTab('system')}>
              System
            </button>
          </div>

          {/* ── Tab: Users ── */}
          {settingsTab === 'users' && (
            <div className="settings-tab-panel">
              <div className="user-table-toolbar" style={{ marginBottom: 12 }}>
                <label className="search-field">
                  <span>Search</span>
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, username or role" />
                </label>
                <span className="user-count">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
                <button className="primary-button" onClick={() => setShowAdd(true)} type="button" style={{ marginLeft: 'auto' }}>+ Add User</button>
              </div>
              <div className="employee-table-shell">
                <table className="data-table user-table">
                  <thead>
                    <tr>
                      <th>User</th><th>Username</th><th>Role</th><th>Permissions</th>
                      <th>Section(s)</th><th>Last Login</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user) => (
                      <tr key={user.id} className={user.status === 'Inactive' ? 'user-row-inactive' : ''}>
                        <td>
                          <div className="user-avatar-cell">
                            <span className="user-avatar">{profileInitials(user.name)}</span>
                            <div>
                              <strong>{user.name}</strong>
                              {user.designation && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{user.designation}</div>}
                            </div>
                          </div>
                        </td>
                        <td><code className="user-username">{user.username}</code></td>
                        <td><span className={`role-chip ${roleColors[user.role]}`}>{user.role}</span></td>
                        <td className="user-perms">{rolePermissions[user.role]}</td>
                        <td>
                          {user.role === 'HOD'
                            ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                                {(user.sections ?? []).length === 0
                                  ? <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>None</span>
                                  : (user.sections ?? []).map((s) => <span key={s} className="req-type-chip">{s}</span>)}
                              </div>
                            : <span style={{ color: '#cbd5e1', fontSize: '0.74rem' }}>—</span>}
                        </td>
                        <td>{user.lastLogin ? formatDateDisplay(user.lastLogin) : '—'}</td>
                        <td>
                          <button type="button" className={`status-toggle-btn ${user.status === 'Active' ? 'active' : 'inactive'}`}
                            onClick={() => toggleStatus(user.id)} disabled={user.id === 'USR-001'}
                            title={user.id === 'USR-001' ? 'Cannot deactivate admin' : `Set ${user.status === 'Active' ? 'Inactive' : 'Active'}`}>
                            {user.status}
                          </button>
                        </td>
                        <td>
                          <div className="row-actions" style={{ flexWrap: 'nowrap' }}>
                            <button className="action-glyph edit" onClick={() => setEditing(user)} type="button" title="Edit user">✎</button>
                            <button className="action-glyph delete" onClick={() => deleteUser(user.id)} type="button" disabled={user.id === 'USR-001'} title={user.id === 'USR-001' ? 'Cannot delete admin' : 'Delete user'}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tab: System ── */}
          {settingsTab === 'system' && (
            <div className="settings-tab-panel">
              {/* Role descriptions */}
              <h2 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#374151', margin: '0 0 10px' }}>Role Permissions</h2>
              <div className="role-legend" style={{ marginBottom: 28 }}>
                {(Object.entries(rolePermissions) as [UserRole, string][]).map(([role, desc]) => (
                  <div key={role} className="role-legend-item">
                    <span className={`role-chip ${roleColors[role]}`}>{role}</span>
                    <span className="role-legend-desc">{desc}</span>
                  </div>
                ))}
              </div>

              {/* Danger Zone */}
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
          )}

          {(editing || showAdd) && (
            <UserFormModal user={editing ?? newUser} employees={employees} onClose={() => { setEditing(null); setShowAdd(false) }} onSave={saveUser} />
          )}
        </>
      )}

      {showChangePw && currentAppUser && (
        <ChangePasswordModal
          user={currentAppUser}
          onClose={() => setShowChangePw(false)}
          onSave={async (newPassword) => {
            await supabase.functions.invoke('manage-user', {
              body: { action: 'update', userId: currentAppUser.id, password: newPassword }
            })
            setShowChangePw(false)
          }}
        />
      )}
    </div>
  )
}

function ChangePasswordModal({ user, onClose, onSave }: {
  user: AppUser
  onClose: () => void
  onSave: (newPassword: string) => void
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (user.password && current !== user.password) { setError('Current password is incorrect.'); return }
    if (next.length < 6) { setError('New password must be at least 6 characters.'); return }
    if (next !== confirm) { setError('New password and confirmation do not match.'); return }
    onSave(next)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="registration-modal" role="dialog" aria-modal="true" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div><p className="eyebrow">My Account</p><h2>Change Password</h2></div>
          <button className="icon-button" onClick={onClose} type="button">✕</button>
        </div>
        <form onSubmit={save}>
          <div className="form-grid">
            <label className="full-field">
              <span>Current Password</span>
              <div className="password-field">
                <input type={showPw ? 'text' : 'password'} value={current} onChange={(e) => { setCurrent(e.target.value); setError('') }} required placeholder="Enter current password" />
                <button type="button" className="password-toggle" onClick={() => setShowPw((p) => !p)}>{showPw ? 'Hide' : 'Show'}</button>
              </div>
            </label>
            <label className="full-field"><span>New Password</span><input type={showPw ? 'text' : 'password'} value={next} onChange={(e) => { setNext(e.target.value); setError('') }} required placeholder="At least 6 characters" /></label>
            <label className="full-field"><span>Confirm New Password</span><input type={showPw ? 'text' : 'password'} value={confirm} onChange={(e) => { setConfirm(e.target.value); setError('') }} required placeholder="Re-enter new password" /></label>
            {error && <div className="full-field" style={{ color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600 }}>{error}</div>}
          </div>
          <div className="modal-actions">
            <button className="quiet-button light" onClick={onClose} type="button">Cancel</button>
            <button className="primary-button" type="submit">Update Password</button>
          </div>
        </form>
      </section>
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
                  <button className="pending-edit-btn vwh" type="button" onClick={() => { onEdit(employee); onClose() }} title="Edit employee record">
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

function LoginPage() {
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginLoading(true)
    setLoginError(false)
    const { error } = await supabase.auth.signInWithPassword({
      email:    usernameToEmail(loginUser),
      password: loginPass,
    })
    if (error) setLoginError(true)
    setLoginLoading(false)
    // On success the onAuthStateChange listener in App() handles the rest
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
        <span className="login-topbar-badge">HR Portal</span>
      </div>

      {/* Centre content */}
      <div className="login-center">
        {/* Left: headline */}
        <div className="login-headline-col login-animate-left">
          <p className="login-eyebrow">People Operations Platform</p>
          <h1 className="login-headline">
            TIC&nbsp;HR<br />Portal
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
              <img src="/logo.png" alt="TIC HR Portal" className="login-logo" />
              <h2 className="login-form-title">Sign in</h2>
              <p className="login-form-sub">Access your HR dashboard</p>
            </div>

            <label className="login-field">
              <span>Username</span>
              <input value={loginUser} onChange={(e) => { setLoginUser(e.target.value); setLoginError(false) }} autoComplete="username" />
            </label>

            <label className="login-field">
              <span>Password</span>
              <div className="login-pass-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={loginPass}
                  onChange={(e) => { setLoginPass(e.target.value); setLoginError(false) }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-pass-toggle"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </label>

            {loginError && <p className="login-error">Invalid username or password.</p>}

            <button className="login-btn" type="submit" disabled={loginLoading}>
              {loginLoading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <span>Thilafushi Industrial Complex · Maldives</span>
        <span>TIC HR Portal v1.0</span>
      </div>
    </main>
  )
}

const pageIcons: Record<Page, string> = {
  overview: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  employees: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  leave: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  operations: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>`,
  activities: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  termination: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/></svg>`,
}

function App() {
  const [activePage, setActivePageState] = useState<Page>(() => (localStorage.getItem('tic_page') as Page) ?? 'overview')
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => localStorage.getItem('tic_sidebar') === '1')

  const setActivePage = (page: Page) => { setActivePageState(page); localStorage.setItem('tic_page', page) }
  const setSidebarCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
    setSidebarCollapsedState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val
      localStorage.setItem('tic_sidebar', next ? '1' : '0')
      return next
    })
  }

  // ── Supabase auth state ──────────────────────────────────────────────────
  const [authLoading,    setAuthLoading]    = useState(true)
  const [supaUser,       setSupaUser]       = useState<SupabaseUser | null>(null)
  const [currentProfile, setCurrentProfile] = useState<AppUser | null>(null)
  const [loggingOut,     setLoggingOut]     = useState(false)

  // Listen for auth session changes (login, logout, token refresh, page reload)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupaUser(session?.user ?? null)
      // If no session, stop loading immediately. If session exists, wait for profile fetch.
      if (!session?.user) setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupaUser(session?.user ?? null)
      if (!session) { setCurrentProfile(null); setAuthLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Fetch profile from DB whenever the logged-in user changes
  useEffect(() => {
    if (!supaUser) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', supaUser.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setCurrentProfile({
            id:          data.id,
            name:        data.name,
            username:    data.username,
            role:        data.role as UserRole,
            designation: data.designation ?? '',
            sections:    data.sections ?? [],
            status:      data.status,
            lastLogin:   data.last_login ?? '',
          })
          supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', supaUser.id)
        }
        // Auth loading done — profile found or not
        setAuthLoading(false)
      })
  }, [supaUser])

  // Derived auth values used throughout the app
  const isLoggedIn      = !!supaUser && !!currentProfile
  const currentUserName = currentProfile?.name ?? ''
  const currentUserRole: UserRole = currentProfile?.role ?? 'HR'

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'A'
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const logout = () => {
    setLoggingOut(true)
    supabase.auth.signOut().finally(() => setLoggingOut(false))
  }
  const [importResult, setImportResult] = useState<{ added: number; updated: number; skipped: number; unchanged: number } | null>(null)
  const [resetStep, setResetStep]   = useState<0|1|2>(0)  // 0=none 1=first 2=second confirm
  const [resetDone, setResetDone]   = useState(false)

  function loadStore<T>(key: string, fallback: T[]): T[] {
    try {
      const s = localStorage.getItem(key)
      if (!s) return fallback
      const parsed = JSON.parse(s) as T[]
      // If stored value is an empty array but we now have seed data, show seed data
      return Array.isArray(parsed) && parsed.length === 0 && fallback.length > 0 ? fallback : parsed
    } catch { return fallback }
  }

  // ── Data state — initialise from localStorage for instant render,
  //    then Supabase overrides on login (single source of truth after that)
  const [employees,            setEmployees]            = useState<Employee[]>(() => loadStore('tic_employees', []))
  const [leaveRequests,        setLeaveRequests]        = useState<LeaveRequestRecord[]>(() => loadStore('tic_leave_req', []))
  const [activeLeaves,         setActiveLeaves]         = useState<ActiveLeaveRecord[]>(() => loadStore('tic_leave_active', []))
  const [leaveHistory,         setLeaveHistory]         = useState<LeaveHistoryRecord[]>(() => loadStore('tic_leave_history_v2', []))
  const [passportHandovers,    setPassportHandovers]    = useState<PassportRecord[]>(() => loadStore('tic_passport', []))
  const [tripRequests,         setTripRequests]         = useState<TripRequest[]>(() => loadStore('tic_tripreq', []))
  const [noticeTerminations,   setNoticeTerminations]   = useState<EnhancedTerminationRecord[]>(() => loadStore('tic_term_notice', []))
  const [completedTerminations,setCompletedTerminations]= useState<CompletedTerminationRecord[]>(() => loadStore('tic_term_done', []))
  const [exitInterviews,       setExitInterviews]       = useState<ExitInterviewRecord[]>(() => loadStore('tic_exit_interviews_v2', []))
  const [medicalCases,         setMedicalCases]         = useState<MedicalCaseRecord[]>(() => loadStore('tic_medical_cases', []))
  const [inventoryItems,       setInventoryItems]       = useState<InventoryItem[]>(() => loadStore('tic_inventory_items', []))
  const [inventoryOrders,      setInventoryOrders]      = useState<StoreOrder[]>(() => loadStore('tic_inv_orders', []))
  const [inventoryUsage,       setInventoryUsage]       = useState<InventoryUsageRecord[]>(() => loadStore('tic_inventory_usage', []))
  const [offSiteRecords,       setOffSiteRecords]       = useState<OffSiteRecord[]>(() => loadStore('tic_offsite', []))
  const [users, setUsers] = useState<AppUser[]>([])

  // Fetch all user profiles from Supabase whenever logged in
  useEffect(() => {
    if (!isLoggedIn) return
    supabase.from('profiles').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        setUsers(data.map(d => ({
          id:          d.id,
          name:        d.name,
          username:    d.username,
          role:        d.role as UserRole,
          designation: d.designation ?? '',
          sections:    d.sections ?? [],
          status:      d.status,
          lastLogin:   d.last_login ?? '',
        })))
      }
    })
  }, [isLoggedIn])

  // ── Refresh key: incremented on window focus/visibility → re-fetches all data ──
  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => {
    if (!isLoggedIn) return
    let lastFire = 0
    const bump = () => {
      const now = Date.now()
      if (now - lastFire < 5000) return   // debounce: ignore if < 5s since last fire
      lastFire = now
      setRefreshKey(k => k + 1)
    }
    window.addEventListener('focus', bump)
    const onVis = () => { if (!document.hidden) bump() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', bump)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [isLoggedIn])

  // ── Load ALL data from Supabase on login + on every focus/visibility change ──
  const dbLoaded = useRef(false)
  useEffect(() => {
    if (!isLoggedIn) { dbLoaded.current = false; return }
    const go = async () => {
      const [emp, lr, al, lh, med, off, nt, ct, ei, pp, tr, ii, iu, so] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('leave_requests').select('*'),
        supabase.from('active_leaves').select('*'),
        supabase.from('leave_history').select('*'),
        supabase.from('medical_cases').select('*'),
        supabase.from('off_site_records').select('*'),
        supabase.from('notice_terminations').select('*'),
        supabase.from('completed_terminations').select('*'),
        supabase.from('exit_interviews').select('*'),
        supabase.from('passport_records').select('*'),
        supabase.from('trip_requests').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('inventory_usage').select('*'),
        supabase.from('store_orders').select('*'),
      ])
      // Always apply Supabase result — null means error, array (even []) is truth
      // Using !== null instead of ?.length so empty arrays clear the state after a reset
      if (emp.data !== null) setEmployees(emp.data.map(empFromDb))
      if (lr.data  !== null) setLeaveRequests(lr.data.map(leaveReqFromDb))
      if (al.data  !== null) setActiveLeaves(al.data.map(activeLeaveFromDb))
      if (lh.data  !== null) setLeaveHistory(lh.data.map(leaveHistFromDb))
      if (med.data !== null) setMedicalCases(med.data.map(medFromDb))
      if (off.data !== null) setOffSiteRecords(off.data.map(offSiteFromDb))
      if (nt.data  !== null) setNoticeTerminations(nt.data.map(noticetermFromDb))
      if (ct.data  !== null) setCompletedTerminations(ct.data.map(compTermFromDb))
      if (ei.data  !== null) setExitInterviews(ei.data.map(exitIntFromDb))
      if (pp.data  !== null) setPassportHandovers(pp.data.map(passportFromDb))
      if (tr.data  !== null) setTripRequests(tr.data.map(tripReqFromDb))
      if (ii.data  !== null) setInventoryItems(ii.data.map(invItemFromDb))
      if (iu.data  !== null) setInventoryUsage(iu.data.map(invUsageFromDb))
      if (so.data  !== null) setInventoryOrders(so.data.map(storeOrderFromDb))
      dbLoaded.current = true
    }
    go()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, refreshKey])
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

  // ── Sync data → Supabase + localStorage on every state change ──────────────
  // Refs hold the previous array so we can detect deletes
  const prevEmp   = useRef<Employee[]>([])
  const prevLr    = useRef<LeaveRequestRecord[]>([])
  const prevAl    = useRef<ActiveLeaveRecord[]>([])
  const prevLh    = useRef<LeaveHistoryRecord[]>([])
  const prevPp    = useRef<PassportRecord[]>([])
  const prevTr    = useRef<TripRequest[]>([])
  const prevNt    = useRef<EnhancedTerminationRecord[]>([])
  const prevCt    = useRef<CompletedTerminationRecord[]>([])
  const prevEi    = useRef<ExitInterviewRecord[]>([])
  const prevMed   = useRef<MedicalCaseRecord[]>([])
  const prevInvI  = useRef<InventoryItem[]>([])
  const prevInvO  = useRef<StoreOrder[]>([])
  const prevInvU  = useRef<InventoryUsageRecord[]>([])
  const prevOff   = useRef<OffSiteRecord[]>([])

  useEffect(() => { localStorage.setItem('tic_employees', JSON.stringify(employees)); if (dbLoaded.current) { syncTable('employees','employee_id',employees,prevEmp.current,empToDb,e=>e.employeeId); prevEmp.current=employees } }, [employees])
  useEffect(() => { localStorage.setItem('tic_leave_req', JSON.stringify(leaveRequests)); if (dbLoaded.current) { syncTable('leave_requests','id',leaveRequests,prevLr.current,leaveReqToDb,r=>r.id); prevLr.current=leaveRequests } }, [leaveRequests])
  useEffect(() => { localStorage.setItem('tic_leave_active', JSON.stringify(activeLeaves)); if (dbLoaded.current) { syncTable('active_leaves','id',activeLeaves,prevAl.current,activeLeaveToDb,r=>r.id); prevAl.current=activeLeaves } }, [activeLeaves])
  useEffect(() => { localStorage.setItem('tic_leave_history_v2', JSON.stringify(leaveHistory)); if (dbLoaded.current) { syncTable('leave_history','id',leaveHistory,prevLh.current,leaveHistToDb,r=>r.id); prevLh.current=leaveHistory } }, [leaveHistory])
  useEffect(() => { localStorage.setItem('tic_passport', JSON.stringify(passportHandovers)); if (dbLoaded.current) { syncTable('passport_records','id',passportHandovers,prevPp.current,passportToDb,r=>r.id); prevPp.current=passportHandovers } }, [passportHandovers])
  useEffect(() => { localStorage.setItem('tic_tripreq', JSON.stringify(tripRequests)); if (dbLoaded.current) { syncTable('trip_requests','id',tripRequests,prevTr.current,tripReqToDb,r=>r.id); prevTr.current=tripRequests } }, [tripRequests])
  useEffect(() => { localStorage.setItem('tic_term_notice', JSON.stringify(noticeTerminations)); if (dbLoaded.current) { syncTable('notice_terminations','id',noticeTerminations,prevNt.current,noticetermToDb,r=>r.id); prevNt.current=noticeTerminations } }, [noticeTerminations])
  useEffect(() => { localStorage.setItem('tic_term_done', JSON.stringify(completedTerminations)); if (dbLoaded.current) { syncTable('completed_terminations','id',completedTerminations,prevCt.current,compTermToDb,r=>r.id); prevCt.current=completedTerminations } }, [completedTerminations])
  useEffect(() => { localStorage.setItem('tic_exit_interviews_v2', JSON.stringify(exitInterviews)); if (dbLoaded.current) { syncTable('exit_interviews','id',exitInterviews,prevEi.current,exitIntToDb,r=>r.id); prevEi.current=exitInterviews } }, [exitInterviews])
  useEffect(() => { localStorage.setItem('tic_medical_cases', JSON.stringify(medicalCases)); if (dbLoaded.current) { syncTable('medical_cases','id',medicalCases,prevMed.current,medToDb,r=>r.id); prevMed.current=medicalCases } }, [medicalCases])
  useEffect(() => { localStorage.setItem('tic_inventory_items', JSON.stringify(inventoryItems)); if (dbLoaded.current) { syncTable('inventory_items','id',inventoryItems,prevInvI.current,invItemToDb,r=>r.id); prevInvI.current=inventoryItems } }, [inventoryItems])
  useEffect(() => { localStorage.setItem('tic_inv_orders', JSON.stringify(inventoryOrders)); if (dbLoaded.current) { syncTable('store_orders','id',inventoryOrders,prevInvO.current,storeOrderToDb,r=>r.id); prevInvO.current=inventoryOrders } }, [inventoryOrders])
  useEffect(() => { localStorage.setItem('tic_inventory_usage', JSON.stringify(inventoryUsage)); if (dbLoaded.current) { syncTable('inventory_usage','id',inventoryUsage,prevInvU.current,invUsageToDb,r=>r.id); prevInvU.current=inventoryUsage } }, [inventoryUsage])
  useEffect(() => { localStorage.setItem('tic_offsite', JSON.stringify(offSiteRecords)); if (dbLoaded.current) { syncTable('off_site_records','id',offSiteRecords,prevOff.current,offSiteToDb,r=>r.id); prevOff.current=offSiteRecords } }, [offSiteRecords])
  // (users are now stored in Supabase — no localStorage sync needed)

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

  const resetAllData = async () => {

    // Stop sync useEffects from firing during the reset
    dbLoaded.current = false
    // Also zero out all prev-refs so sync can't re-detect "deletes"
    prevEmp.current  = []; prevLr.current   = []; prevAl.current  = []
    prevLh.current   = []; prevPp.current   = []; prevTr.current  = []
    prevNt.current   = []; prevCt.current   = []; prevEi.current  = []
    prevMed.current  = []; prevInvI.current = []; prevInvO.current = []
    prevInvU.current = []; prevOff.current  = []

    // ── 1. Delete every row from every table ─────────────────────────────
    // Use gte('created_at','1900-01-01') — works on ALL tables regardless of PK name
    const allTables = [
      'employees', 'leave_requests', 'active_leaves', 'leave_history',
      'medical_cases', 'off_site_records', 'notice_terminations',
      'completed_terminations', 'exit_interviews', 'passport_records',
      'trip_requests', 'inventory_items', 'inventory_usage', 'store_orders',
      'personal_files', 'induction_records', 'training_records',
      'meeting_records', 'bank_account_records',
      'staff_requests', 'visit_records', 'incident_records',
    ]
    const results = await Promise.all(
      allTables.map(t =>
        supabase.from(t).delete().gte('created_at', '1900-01-01')
          .then(({ error }) => {
            if (error) console.error(`[Reset] ${t}:`, error.message)
            return { table: t, ok: !error }
          })
      )
    )
    const failed = results.filter(r => !r.ok).map(r => r.table)
    if (failed.length > 0) {
      alert(`Warning: some tables could not be cleared: ${failed.join(', ')}. Check console for details.`)
    }

    // ── 2. Clear all localStorage keys ───────────────────────────────────
    const lsKeys = [
      'tic_employees','tic_leave_req','tic_leave_active','tic_leave_history_v2',
      'tic_passport','tic_tripreq','tic_term_notice','tic_term_done',
      'tic_exit_interviews_v2','tic_medical_cases','tic_inventory_items',
      'tic_inv_orders','tic_inventory_usage','tic_offsite',
      'tic_meetings','tic_personal_files','tic_induction',
      'tic_training','tic_bank_acc','tic_staff_req','tic_visit_rec','tic_incidents',
    ]
    lsKeys.forEach(k => localStorage.removeItem(k))

    // ── 3. Reset all React state ──────────────────────────────────────────
    setEmployees([]);           setLeaveRequests([]);      setActiveLeaves([])
    setLeaveHistory([]);        setPassportHandovers([]);  setTripRequests([])
    setNoticeTerminations([]);  setCompletedTerminations([]); setExitInterviews([])
    setMedicalCases([]);        setInventoryItems([]);     setInventoryUsage([])
    setInventoryOrders([]);     setOffSiteRecords([])
    setResetStep(0)
    setResetDone(true)
  }

  const deleteEmployee = (employeeId: string) => {
    // Uses window.confirm for the employee table — the employee row uses
    // its own inline delete button; a global bottom bar would need context threading
    if (!window.confirm('Delete this employee record permanently?')) return
    setEmployees(prev => prev.filter(e => e.employeeId !== employeeId))
    supabase.from('employees').delete().eq('employee_id', employeeId)
      .then(({ error }) => { if (error) console.error('[deleteEmployee]', error.message) })
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
            periodOfService: '', joinDate: r.dateOfJoin, rehireEligible: true, interviewDate: '',
            skipped: false, skipReason: '',
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
      reader.onload = async () => {
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
        let added = 0; let updated = 0; let skipped = 0; let unchanged = 0
        // Work directly from the current employees closure value — avoids React
        // StrictMode double-invoking a functional updater and inflating counters.
        const byId = new Map(employees.map((e) => [e.employeeId, e]))
        const result = [...employees]
        dataRows.forEach((row, index) => {
          if (row.every((c) => !c.trim())) { skipped++; return } // blank row
          const eid = g(row, 'id') || `PENDING-${String(employees.length + index + 1).padStart(4, '0')}`
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
          const existing = byId.get(eid)
          if (existing) {
            // Only update if at least one CSV-provided field actually changed
            const changed = (
              parsed.fullName      !== existing.fullName      ||
              parsed.department    !== existing.department    ||
              parsed.designation   !== existing.designation   ||
              parsed.nationality   !== existing.nationality   ||
              parsed.nicPassportNo !== existing.nicPassportNo ||
              parsed.workPermitNo  !== existing.workPermitNo  ||
              parsed.dateOfJoin    !== existing.dateOfJoin    ||
              parsed.mobileNo      !== existing.mobileNo      ||
              parsed.dateOfBirth   !== existing.dateOfBirth   ||
              parsed.siteStatus    !== existing.siteStatus
            )
            if (changed) {
              const idx = result.findIndex((e) => e.employeeId === eid)
              if (idx >= 0) { result[idx] = { ...existing, ...parsed }; updated++ }
            } else {
              unchanged++
            }
          } else {
            result.unshift(parsed); byId.set(eid, parsed); added++
          }
        })
        // Show the result in UI immediately (optimistic update)
        setEmployees(result)
        setImportResult({ added, updated, skipped, unchanged })

        if (added > 0 || updated > 0) {
          // 1. Await upsert so Supabase has the data before we re-read
          const { error } = await supabase.from('employees')
            .upsert(result.map(empToDb), { onConflict: 'employee_id' })
          if (error) {
            console.error('[importCsv] upsert failed:', error.message)
          } else {
            // 2. Re-fetch employees from Supabase — this overwrites any stale
            //    data that a concurrent initial-load fetch may have written
            const { data } = await supabase.from('employees').select('*')
            if (data) setEmployees(data.map(empFromDb))
          }
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const downloadTemplate = () => downloadCsv('tic-employee-template.csv', [
    ['Emp ID', 'Full Name', 'Section', 'Designation', 'Nationality', 'NIC/PP No', 'WP No', 'Date of Join', 'Mobile No', 'Date of Birth', 'Site Status'],
    ['TIC-0001', 'Example Name', 'ADMINISTRATION', 'Manager', 'MALDIVES', 'A123456', '', '01-01-2024', '+960 777 0000', '15-06-1990', 'On Site'],
  ])

  if (authLoading) return (
    <div style={{ display:'grid', placeItems:'center', height:'100vh', background:'#0f172a', color:'rgba(255,255,255,0.5)', fontSize:'0.85rem', letterSpacing:'0.05em' }}>
      Authenticating…
    </div>
  )
  if (!isLoggedIn) return <LoginPage />

  // Current user's app-record (from Supabase profile)
  const currentAppUser = currentProfile
  const isHOD = currentUserRole === 'HOD'
  const isHR  = currentUserRole === 'HR'
  const currentUserSections = currentAppUser?.sections ?? []
  const inAssignedSection = (dept: string) => !isHOD || currentUserSections.includes(dept)

  // For HOD: scope every department-bearing dataset down to the assigned section(s)
  const scopedEmployees             = isHOD ? employees.filter((e) => inAssignedSection(e.department)) : employees
  const scopedLeaveRequests         = isHOD ? leaveRequests.filter((r) => inAssignedSection(r.department)) : leaveRequests
  const scopedActiveLeaves          = isHOD ? activeLeaves.filter((r) => inAssignedSection(r.department)) : activeLeaves
  const scopedLeaveHistory          = isHOD ? leaveHistory.filter((r) => inAssignedSection(r.department)) : leaveHistory
  const scopedMedicalCases          = isHOD ? medicalCases.filter((r) => inAssignedSection(r.department)) : medicalCases
  const scopedNoticeTerminations    = isHOD ? noticeTerminations.filter((r) => inAssignedSection(r.department)) : noticeTerminations
  const scopedCompletedTerminations = isHOD ? completedTerminations.filter((r) => inAssignedSection(r.department)) : completedTerminations
  const scopedExitInterviews        = isHOD ? exitInterviews.filter((r) => inAssignedSection(r.department)) : exitInterviews
  const scopedPassportHandovers     = isHOD ? passportHandovers.filter((r) => inAssignedSection(r.department)) : passportHandovers

  const openEditEmployee = (employee: Employee) => {
    setEmployeeMode('edit')
    setEmployeeForm(employee)
    setShowEmployeeForm(true)
    setActivePage('employees')
  }

  return (
    <div className={`app-shell${sidebarCollapsed ? ' sidebar-is-collapsed' : ''}${loggingOut ? ' app-logging-out' : ''}${(currentUserRole === 'Viewer' || isHOD) ? ' view-only-mode' : ''}`}>
      <aside className={`sidebar${sidebarCollapsed ? ' sidebar--collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="TIC" className="sidebar-logo-img" />
            {!sidebarCollapsed && <span className="sidebar-brand-text"><strong>TIC HR Portal</strong><small>Thilafushi Industrial Complex</small></span>}
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
          <div className="sidebar-user" title={sidebarCollapsed ? currentUserName : undefined}>
            <div className="sidebar-user-avatar">{getInitials(currentUserName)}</div>
            {!sidebarCollapsed && (
              <span className="sidebar-user-name">
                <span className="sidebar-user-name-text">{currentUserName.trim().split(/\s+/)[0]}</span>
                <span className="sidebar-user-desig">
                  {currentAppUser?.designation ?? currentUserRole}
                  {currentUserRole === 'Viewer' && <span className="sidebar-view-only-badge" style={{ marginLeft: 4 }}>View Only</span>}
                  {isHOD && <span className="sidebar-view-only-badge" style={{ marginLeft: 4 }}>HOD</span>}
                </span>
              </span>
            )}
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
          {activePage === 'overview' && <OverviewPage employees={scopedEmployees} leaveRequests={scopedLeaveRequests} activeLeaves={scopedActiveLeaves} leaveHistory={scopedLeaveHistory} noticeTerminations={scopedNoticeTerminations} completedTerminations={scopedCompletedTerminations} exitInterviews={scopedExitInterviews} medicalCases={scopedMedicalCases} inventoryItems={inventoryItems} passportHandovers={scopedPassportHandovers} />}
          {activePage === 'employees' && <EmployeesPage employees={scopedEmployees} medicalCases={scopedMedicalCases} noticeTerminations={scopedNoticeTerminations} offSiteRecords={offSiteRecords} onUpdateOffSite={(fn) => setOffSiteRecords(fn)} onAdd={() => { setEmployeeMode('add'); setEmployeeForm(emptyEmployee); setShowEmployeeForm(true) }} onEdit={openEditEmployee} onDelete={deleteEmployee} onExport={exportCsv} onImport={importCsv} onTemplate={downloadTemplate} onShowTasks={() => setShowPendingTasks(true)} />}
          {activePage === 'leave' && <LeavePage employees={scopedEmployees} leaveRequests={scopedLeaveRequests} activeLeaves={scopedActiveLeaves} leaveHistory={scopedLeaveHistory} medicalCases={scopedMedicalCases} isHOD={isHOD} onAddRequest={() => { setEditingLeaveRequest(null); setShowLeaveForm(true) }} onEditRequest={(record) => { setEditingLeaveRequest(record); setShowLeaveForm(true) }} onDeleteRequest={deleteLeaveRequest} onSetRequestStep={setLeaveRequestStep} onExtendLeave={extendActiveLeave} onEditActiveLeave={editActiveLeave} onHistoryConfirm={updateHistoryConfirmation} onUpdateMedical={(fn) => setMedicalCases(fn)} />}
          {activePage === 'operations' && <OperationsPage employees={employees} completedTerminations={completedTerminations} activeLeaves={activeLeaves} isHOD={isHOD} userRole={currentUserRole} />}
          {activePage === 'activities' && <ActivitiesPage employees={scopedEmployees} passportHandovers={scopedPassportHandovers} onUpdatePassport={(fn) => setPassportHandovers(fn)} tripRequests={tripRequests} onUpdateTripRequests={(fn) => setTripRequests(fn)} inventoryItems={inventoryItems} inventoryUsage={inventoryUsage} inventoryOrders={inventoryOrders} onUpdateInventoryItems={(fn) => setInventoryItems(fn)} onUpdateInventoryUsage={(fn) => setInventoryUsage(fn)} onUpdateInventoryOrders={(fn) => setInventoryOrders(fn)} isHOD={isHOD} isHR={isHR} currentUserSections={currentUserSections} currentUserName={currentUserName} />}
          {activePage === 'termination' && <TerminationPage noticeTerminations={scopedNoticeTerminations} completedTerminations={scopedCompletedTerminations} exitInterviews={scopedExitInterviews} employees={scopedEmployees} isHOD={isHOD} onAdd={openAddTermination} onEdit={openEditTermination} onSetStage={setTerminationStage} onDelete={deleteTermination} onViewDetails={(record) => setTerminationDetails(record)} onUpdateExitInterviews={(fn) => setExitInterviews(fn)} />}
          {activePage === 'settings' && <SettingsPage employees={employees} leaveRequests={leaveRequests} activeLeaves={activeLeaves} onReset={() => setResetStep(1)} currentUserName={currentUserName} loggedInUser={currentProfile} users={users} onUpdateUsers={(fn) => setUsers(fn)} />}
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
            {importResult.unchanged > 0 && <p><strong>{importResult.unchanged}</strong> record{importResult.unchanged !== 1 ? 's' : ''} unchanged — skipped</p>}
            {importResult.skipped > 0 && <p><strong>{importResult.skipped}</strong> blank row{importResult.skipped !== 1 ? 's' : ''} skipped</p>}
            <button className="primary-button" onClick={() => setImportResult(null)} type="button">Done</button>
          </div>
        </div>
      )}

      {/* ── Reset All Data — step 1 confirmation ─────────────────────── */}
      {resetStep === 1 && (
        <div className="import-toast-backdrop" role="presentation" onClick={() => setResetStep(0)}>
          <div className="reset-confirm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="reset-confirm-icon">⚠️</div>
            <h3>Reset All Data?</h3>
            <p>This will permanently delete <strong>all employees, leave records, medical cases, terminations, passports, inventory, and every other HR record</strong> for all users.</p>
            <p className="reset-confirm-sub">This action affects everyone logged in and <strong>cannot be undone</strong>.</p>
            <div className="reset-confirm-actions">
              <button className="quiet-button light" onClick={() => setResetStep(0)} type="button">Cancel</button>
              <button className="danger-button" onClick={() => setResetStep(2)} type="button">Yes, continue →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset All Data — step 2 final confirmation ───────────────── */}
      {resetStep === 2 && (
        <div className="import-toast-backdrop" role="presentation" onClick={() => setResetStep(0)}>
          <div className="reset-confirm-modal reset-confirm-final" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="reset-confirm-icon reset-confirm-icon-red">🗑</div>
            <h3>Final Confirmation</h3>
            <p>You are about to <strong>delete everything</strong> from the database. All users will lose access to all data immediately.</p>
            <p className="reset-confirm-sub">Are you absolutely sure?</p>
            <div className="reset-confirm-actions">
              <button className="quiet-button light" onClick={() => setResetStep(0)} type="button">Cancel</button>
              <button className="danger-button" onClick={resetAllData} type="button">Delete Everything</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset complete toast ──────────────────────────────────────── */}
      {resetDone && (
        <div className="import-toast-backdrop" role="presentation" onClick={() => setResetDone(false)}>
          <div className="import-toast" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="import-toast-icon" style={{ background:'linear-gradient(135deg,#dc2626,#f87171)' }}>✓</div>
            <h3>Reset Complete</h3>
            <p>All data has been permanently deleted from the database.</p>
            <p style={{ fontSize:'0.8rem', color:'#94a3b8' }}>All users will see empty data on their next refresh.</p>
            <button className="primary-button" onClick={() => setResetDone(false)} type="button" style={{ marginTop:16, width:'100%' }}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

