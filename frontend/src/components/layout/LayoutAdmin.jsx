import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Menu, X, Bell } from 'lucide-react'
import { useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import { APP } from '../../config/app'
import { useMenu } from '../../hooks/useMenu'
import { getIcon } from '../../utils/menuIcons'

function SideNavItem({ to, Icon, label, exact }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        'flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all border ' +
        (isActive ? 'rounded-lg' : 'rounded-xl border-transparent')
      }
      style={({ isActive }) => isActive
        ? { background: 'rgba(204,26,26,0.08)', color: '#CC1A1A', borderColor: 'rgba(204,26,26,0.2)' }
        : { color: '#6B6560' }
      }
      onMouseEnter={e => { e.currentTarget.style.background = '#F0EBE4'; e.currentTarget.style.color = '#1A1A1A' }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}
    >
      <Icon size={18} strokeWidth={1.7} />
      <span>{label}</span>
    </NavLink>
  )
}


function SidebarAdmin({ onClose }) {
  const { itens, isLoading } = useMenu()

  return (
    <div className="flex flex-col h-full" style={{ background: '#FFFFFF' }}>
      {/* Logo */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px 0 20px', borderBottom: '1px solid #E0D6CA', flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#CC1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#FFFFFF', fontSize: 13, flexShrink: 0 }}>
          {APP.sigla}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 900, fontSize: 12, color: '#1A1A1A', letterSpacing: '0.06em', lineHeight: 1 }}>{APP.nome.toUpperCase()}</p>
          <p style={{ fontSize: 10, color: '#8A7F76', marginTop: 3 }}>Administração</p>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ color: '#B0A89E', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 20, paddingBottom: 16, paddingLeft: 12, paddingRight: 12, overflowY: 'auto' }}>
        {isLoading && (
          [1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: 40, borderRadius: 8, marginBottom: 4, background: '#F0EBE4' }} />
          ))
        )}
        {(() => {
          const grupos = []
          itens.forEach(item => {
            const g = grupos.find(g => g.id_menu === item.id_menu)
            if (g) g.itens.push(item)
            else grupos.push({ id_menu: item.id_menu, grupo: item.grupo, itens: [item] })
          })
          return grupos.map((grupo, gi) => (
            <div key={grupo.id_menu}>
              {gi > 0 && (
                <div style={{ margin: '10px 4px', height: 1, background: '#E0D6CA' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {grupo.itens.map(item => {
                  const Icon = getIcon(item.icone)
                  return (
                    <SideNavItem
                      key={item.id}
                      to={item.caminho}
                      Icon={Icon}
                      label={item.nome}
                      exact={item.caminho === '/admin'}
                    />
                  )
                })}
              </div>
            </div>
          ))
        })()}
      </nav>

      {/* Rodapé */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #E0D6CA' }}>
        <p style={{ fontSize: 10, color: '#C4B9A8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {APP.nome} · Admin
        </p>
      </div>
    </div>
  )
}

function TopBarAdmin({ onMenuClick }) {
  const { usuario, logout } = useAuthContext()
  const { itens } = useMenu()
  const navigate = useNavigate()
  const location = useLocation()

  const paginaAtual = itens.find(i => i.caminho === location.pathname)
  const titulo = paginaAtual?.nome || 'Admin'

  function sair() { logout(); navigate('/login') }

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-4 h-16 backdrop-blur-sm"
      style={{ paddingLeft: 40, paddingRight: 32, background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid #E0D6CA', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}
    >
      {onMenuClick && (
        <button onClick={onMenuClick} className="lg:hidden p-1" style={{ color: '#8A7F76' }}>
          <Menu size={20} />
        </button>
      )}

      <h1 className="font-black text-base uppercase tracking-wide flex-1" style={{ color: '#1A1A1A' }}>{titulo}</h1>

      {/* Ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          style={{ width: 36, height: 36, borderRadius: 10, background: '#F7F3EE', border: '1px solid #E0D6CA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#C4B9A8'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E0D6CA'}
        >
          <Bell size={15} color="#8A7F76" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 10, borderLeft: '1px solid #E0D6CA' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#FFFFFF', flexShrink: 0 }}>
            {usuario?.nome?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block">
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', lineHeight: 1 }}>{usuario?.nome?.split(' ')[0]}</p>
            <p style={{ fontSize: 11, color: '#8A7F76', marginTop: 2 }}>Administrador</p>
          </div>
        </div>

        <button
          onClick={sair}
          title="Sair"
          style={{ width: 36, height: 36, borderRadius: 10, background: '#F7F3EE', border: '1px solid #E0D6CA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#CC1A1A'; e.currentTarget.style.borderColor = 'rgba(204,26,26,0.3)'; e.currentTarget.style.background = 'rgba(204,26,26,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.background = '#F7F3EE' }}
        >
          <LogOut size={15} color="#8A7F76" />
        </button>
      </div>
    </header>
  )
}

export default function LayoutAdmin() {
  const [drawer, setDrawer] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F0EBE4' }}>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex" style={{ width: 240, flexShrink: 0, flexDirection: 'column' }}>
        <SidebarAdmin />
      </aside>

      {/* Drawer mobile */}
      {drawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} className="lg:hidden">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,26,0.5)' }} onClick={() => setDrawer(false)} />
          <aside style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 240, zIndex: 10 }}>
            <SidebarAdmin onClose={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      {/* Área principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBarAdmin onMenuClick={() => setDrawer(true)} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '40px 48px 80px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
