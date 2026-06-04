import { useState } from 'react'
import { LayoutGrid, Users, BarChart3, Settings, ChevronDown, ChevronRight, UserCircle } from 'lucide-react'
import DealBoardsList from './rep/DealBoardsList'
import DealBoardDetail from './rep/DealBoardDetail'
// Import actual manager view from deaboard_manager
import DealBoardsManagerView from '../deaboard_manager/DealBoardsManagerView'
import './index.css'

type View = 'list' | 'detail' | 'manager'
type Role = 'manager' | 'rep' | null

const REP_NAMES = [
  'Lakshmi Prasanna',
  'Sujeevan Jayshanker',
  'Revenue Intelligence Demo',
] as const;

function Sidebar({
  expandedMenu,
  setExpandedMenu,
  selectedRole,
  setSelectedRole,
  selectedRep,
  setSelectedRep,
  currentView,
  setCurrentView
}: {
  expandedMenu: string | null
  setExpandedMenu: (menu: string | null) => void
  selectedRole: Role
  setSelectedRole: (role: Role) => void
  selectedRep: string | null
  setSelectedRep: (rep: string | null) => void
  currentView: View
  setCurrentView: (view: View) => void
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'engagement', label: 'Engagement', icon: Users },
    { id: 'calls', label: 'Calls', icon: BarChart3 },
    { id: 'call-list', label: 'Call List', icon: LayoutGrid },
    { id: 'revenue', label: 'Revenue', icon: BarChart3 },
    { id: 'deal-boards', label: 'Deal Boards', icon: LayoutGrid, hasSubmenu: true },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'all-team', label: 'All Team Research', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const handleDealBoardsClick = () => {
    if (expandedMenu === 'deal-boards') {
      setExpandedMenu(null)
    } else {
      setExpandedMenu('deal-boards')
    }
  }

  const handleRoleSelect = (role: Role, repName?: string) => {
    setSelectedRole(role)
    setSelectedRep(repName || null)
    if (role === 'manager') {
      setCurrentView('manager')
    } else if (role === 'rep') {
      setCurrentView('list')
    }
  }

  return (
    <aside style={{
      width: 260,
      background: 'rgba(4, 8, 20, 0.75)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>📊 Revenue Intelligence UI</div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {menuItems.map(item => {
          const Icon = item.icon
          const isExpanded = expandedMenu === item.id
          const isActive = item.id === 'deal-boards' && (currentView === 'list' || currentView === 'detail' || currentView === 'manager')

          return (
            <div key={item.id}>
              <button
                onClick={item.hasSubmenu ? handleDealBoardsClick : () => setCurrentView('list')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: 4,
                }}
              >
                <Icon size={18} />
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {item.hasSubmenu && (
                  isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                )}
              </button>

              {/* Submenu for Deal Boards */}
              {item.hasSubmenu && isExpanded && (
                <div style={{ paddingLeft: 32, marginBottom: 8 }}>
                  <button
                    onClick={() => handleRoleSelect('manager')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: 'none',
                      background: selectedRole === 'manager' ? 'rgba(79, 70, 229, 0.3)' : 'transparent',
                      color: selectedRole === 'manager' ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontSize: 13,
                      cursor: 'pointer',
                      marginBottom: 4,
                    }}
                  >
                    <UserCircle size={14} />
                    <span>Login as Manager</span>
                  </button>
                  <div style={{ padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingLeft: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reps</span>
                  </div>
                  {REP_NAMES.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleRoleSelect('rep', name)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: 'none',
                        background: selectedRole === 'rep' && selectedRep === name ? 'rgba(79, 70, 229, 0.3)' : 'transparent',
                        color: selectedRole === 'rep' && selectedRep === name ? '#fff' : 'rgba(255,255,255,0.5)',
                        fontSize: 13,
                        cursor: 'pointer',
                        marginBottom: 4,
                      }}
                    >
                      <UserCircle size={14} />
                      <span>{name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

function App() {
  const [currentView, setCurrentView] = useState<View>('list')
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [selectedRep, setSelectedRep] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        style={{
          position: 'fixed',
          top: 20,
          left: sidebarCollapsed ? 20 : 270,
          zIndex: 100,
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: 'none',
          background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          transition: 'left 0.3s ease',
        }}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? '→' : '←'}
      </button>

      {/* Sidebar */}
      {!sidebarCollapsed && (
        <Sidebar
          expandedMenu={expandedMenu}
          setExpandedMenu={setExpandedMenu}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          selectedRep={selectedRep}
          setSelectedRep={setSelectedRep}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
      )}

      {/* Main Content - Scrollable */}
      <main style={{
        flex: 1,
        marginLeft: sidebarCollapsed ? 0 : 260,
        background: '#f8f8fa',
        minHeight: '100vh',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'margin-left 0.3s ease',
      }}>
        <div style={{ minHeight: '100%', padding: '20px', paddingBottom: 40 }}>
          {currentView === 'list' && (
            <DealBoardsList onBoardClick={() => setCurrentView('detail')} repName={selectedRep} />
          )}
          {currentView === 'detail' && (
            <DealBoardDetail onBack={() => setCurrentView('list')} repName={selectedRep} />
          )}
          {currentView === 'manager' && <DealBoardsManagerView />}
        </div>
      </main>
    </div>
  )
}

export default App
