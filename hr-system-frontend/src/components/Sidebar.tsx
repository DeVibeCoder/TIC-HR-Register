type Page = 'overview' | 'employees' | 'leave' | 'operations' | 'activities' | 'termination' | 'settings'

type SidebarProps = {
  activePage: Page
  expandedSections: Record<string, boolean>
  onSelectPage: (page: Page) => void
  onToggleSection: (section: string) => void
}

type Group = {
  id: string
  label: string
  pages: Array<{ id: Page; label: string }>
}

const rootItems: Array<{ id: Page; label: string }> = [
  { id: 'overview', label: 'Overview' },
]

const groups: Group[] = [
  {
    id: 'staff-management',
    label: 'Staff Management',
    pages: [
      { id: 'employees', label: 'Employees' },
      { id: 'leave', label: 'Leave' },
    ],
  },
  {
    id: 'hr-operations',
    label: 'HR Operations',
    pages: [
      { id: 'operations', label: 'Operations' },
      { id: 'activities', label: 'Activities' },
      { id: 'termination', label: 'Termination' },
    ],
  },
]

const bottomItems: Array<{ id: Page; label: string }> = [
  { id: 'settings', label: 'Settings' },
]

export default function Sidebar({
  activePage,
  expandedSections,
  onSelectPage,
  onToggleSection,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand-box">
        <div className="brand-mark sidebar-brand-mark" aria-hidden="true">
          <span>TIC</span>
        </div>
        <div>
          <p className="brand-kicker">People Suite</p>
          <h2 className="brand-title">TIC HR</h2>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {rootItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item root-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onSelectPage(item.id)}
          >
            {item.label}
          </button>
        ))}

        {groups.map((group) => {
          const expanded = expandedSections[group.id] ?? true

          return (
            <div className="nav-group" key={group.id}>
              <button
                type="button"
                className="group-toggle"
                onClick={() => onToggleSection(group.id)}
                aria-expanded={expanded}
              >
                <span>{group.label}</span>
                <span className={`group-chevron ${expanded ? 'expanded' : ''}`}>›</span>
              </button>

              {expanded && (
                <ul className="nav-sub">
                  {group.pages.map((page) => (
                    <li key={page.id}>
                      <button
                        type="button"
                        className={`nav-item ${activePage === page.id ? 'active' : ''}`}
                        onClick={() => onSelectPage(page.id)}
                      >
                        {page.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      <div className="sidebar-bottom">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item root-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onSelectPage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  )
}
