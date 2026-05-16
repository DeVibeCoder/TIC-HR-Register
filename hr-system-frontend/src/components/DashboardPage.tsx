import { employees, metrics } from '../data/dashboardData'

type MetricIcon = 'employees' | 'positions' | 'interviews' | 'attendance'

const metricMeta: Record<string, { icon: MetricIcon; tone: string }> = {
  'Total Employees': { icon: 'employees', tone: 'teal' },
  'Open Positions': { icon: 'positions', tone: 'violet' },
  'Interviews This Week': { icon: 'interviews', tone: 'amber' },
  'Attendance Today': { icon: 'attendance', tone: 'blue' },
}

function MetricGlyph({ icon }: { icon: MetricIcon }) {
  if (icon === 'employees') {
    return (
      <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
        <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm8 1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 12Zm-8 1c-3 0-5.5 1.8-5.5 4v1h11v-1c0-2.2-2.5-4-5.5-4Zm8 0c-.7 0-1.4.1-2 .3 1.2.9 2 2.2 2 3.7v1h6v-.8c0-2.1-2.7-4.2-6-4.2Z" />
      </svg>
    )
  }

  if (icon === 'positions') {
    return (
      <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
        <path d="M9 3h6l.8 2H20a2 2 0 0 1 2 2v3H2V7a2 2 0 0 1 2-2h4.2L9 3Zm13 9v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7h7v2h6v-2h7Z" />
      </svg>
    )
  }

  if (icon === 'interviews') {
    return (
      <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
        <path d="M6 4h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 3v-3H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 5h8v2H8V9Zm0-3h8v2H8V6Zm0 6h5v2H8v-2Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 15H5V10h14v9Zm-7-7 4 4h-3v2h-2v-2H8l4-4Z" />
    </svg>
  )
}

export default function DashboardPage() {
  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <h1>People Operations Dashboard</h1>
        <p>
          Track key workforce updates for Thilafushi Industrial Complex and shared
          cross-site HR activities.
        </p>
      </header>

      <section className="metric-grid" aria-label="HR summary">
        {metrics.map((metric) => {
          const meta = metricMeta[metric.label]

          return (
            <article className={`metric-card tone-${meta.tone}`} key={metric.label}>
              <div className="metric-top">
                <p className="metric-label">{metric.label}</p>
                <span className="metric-icon" aria-hidden="true">
                  <MetricGlyph icon={meta.icon} />
                </span>
              </div>
              <p className="metric-value">{metric.value}</p>
            </article>
          )
        })}
      </section>

      <section className="panel-card">
        <div className="panel-header">
          <div>
            <h2>Employee Snapshot</h2>
            <p className="panel-subtitle">Current status overview for monitored staff</p>
          </div>
          <button type="button" className="primary-btn">
            Add Employee
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td>{employee.name}</td>
                  <td>{employee.department}</td>
                  <td>
                    <span className={`status-badge ${employee.status.toLowerCase().replace(' ', '-')}`}>
                      {employee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
