export type EmployeeStatus = 'Active' | 'On Leave' | 'Probation'

export type Employee = {
  id: string
  name: string
  department: string
  status: EmployeeStatus
}

export const metrics = [
  { label: 'Total Employees', value: '142' },
  { label: 'Open Positions', value: '11' },
  { label: 'Interviews This Week', value: '24' },
  { label: 'Attendance Today', value: '96.4%' },
]

export const employees: Employee[] = [
  { id: 'THF-001', name: 'Adam Rasheed', department: 'Site Operations', status: 'Active' },
  { id: 'THF-014', name: 'Aishath Naza', department: 'Administration', status: 'On Leave' },
  { id: 'THF-023', name: 'Mufeedh Ali', department: 'Safety & Compliance', status: 'Probation' },
  { id: 'THF-031', name: 'Shiyam Ismail', department: 'Workforce Coordination', status: 'Active' },
  { id: 'THF-047', name: 'Asna Haleem', department: 'Industrial Services', status: 'Active' },
]
