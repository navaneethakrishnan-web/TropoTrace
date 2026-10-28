import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  CloudLightning,
  Crosshair,
  LogOut,
  RadioTower,
  RefreshCw,
  Settings2,
  ShieldAlert,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { ViewId } from '../domain/types'

interface NavItem {
  id: ViewId
  label: string
  icon: LucideIcon
  group?: string
  badge?: string | number
}

export function Sidebar() {
  const {
    activeView,
    navigate,
    mobileMenuOpen,
    setMobileMenuOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    reviewedAlertIds,
    user,
    signOut,
  } = useApp()

  const unreviewedCount = Math.max(0, 3 - reviewedAlertIds.size)

  const navItems: NavItem[] = [
    { id: 'command', label: 'Command Center', icon: Crosshair, group: 'Operations' },
    { id: 'storm', label: 'Storm Intelligence', icon: Activity },
    { id: 'hazards', label: 'Hazard Explorer', icon: CloudLightning },
    { id: 'impact', label: 'Impact Intelligence', icon: ShieldAlert },
    {
      id: 'alerts',
      label: 'Alert Center',
      icon: Bell,
      group: 'Decision & Warning',
      badge: unreviewedCount > 0 ? `0${unreviewedCount}` : undefined,
    },
    { id: 'observatory', label: 'Data Observatory', icon: RadioTower, group: 'Scientific Lab' },
    { id: 'simulation', label: 'Simulation Lab', icon: RefreshCw },
    { id: 'verification', label: 'Model Verification', icon: BarChart3 },
    { id: 'analyst', label: 'Tropo', icon: Bot, group: 'Intelligence Tools' },
    { id: 'settings', label: 'System Settings', icon: Settings2 },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`side-nav ${mobileMenuOpen ? 'is-open' : ''} ${
          sidebarCollapsed ? 'is-collapsed' : ''
        }`}
        aria-label="Primary Navigation"
      >
        {/* Brand Header */}
        <div
          className="brand-lockup"
          onClick={() => navigate('command')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('command')}
          aria-label="TropoTrace Home"
        >
          <div className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </div>
          {!sidebarCollapsed && (
            <div className="brand-text-wrap">
              <div className="brand-name">
                TROPO<span>TRACE</span>
              </div>
              <div className="brand-subtitle">CONVECTIVE INTELLIGENCE</div>
              <div className="brand-agency">MoES · NCMRWF</div>
            </div>
          )}

          {/* Close button on mobile */}
          <button
            className="mobile-close-btn"
            onClick={(e) => {
              e.stopPropagation()
              setMobileMenuOpen(false)
            }}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="nav-scroll">
          {navItems.map((item, index) => (
            <div key={item.id} className="nav-group-section">
              {item.group && !sidebarCollapsed && (
                <div className="nav-group-label">{item.group}</div>
              )}
              {!item.group && index === 0 && !sidebarCollapsed && (
                <div className="nav-group-label">Operations</div>
              )}
              <button
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => navigate(item.id)}
                aria-current={activeView === item.id ? 'page' : undefined}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon
                  size={18}
                  strokeWidth={activeView === item.id ? 2.3 : 1.7}
                  className="nav-icon"
                />
                {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                {item.badge && !sidebarCollapsed && (
                  <span className="nav-badge" aria-label={`${item.badge} active alerts`}>
                    {item.badge}
                  </span>
                )}
              </button>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Session & Collapse Toggle */}
        <div className="side-footer">
          <div className="operator-card">
            <div className="operator-row">
              <span className="online-dot" />
              {!sidebarCollapsed && (
                <>
                  <span className="operator-role">OPERATOR SESSION</span>
                  <span className="operator-id">TT-01</span>
                </>
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="operator-email" title={user?.email ?? 'operator@tropotrace.app'}>
                {user?.email ?? 'operator@tropotrace.app'}
              </div>
            )}
          </div>

          <div className="sidebar-bottom-actions">
            {!sidebarCollapsed && (
              <button
                className="sidebar-signout-btn"
                onClick={signOut}
                title="Sign out of operator session"
                aria-label="Sign out"
              >
                <LogOut size={13} />
                <span>SIGN OUT</span>
              </button>
            )}

            <button
              className="sidebar-collapse-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
