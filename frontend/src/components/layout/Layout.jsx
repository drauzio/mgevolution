import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { MoreHorizontal, LogOut, Menu, X, Bell } from 'lucide-react'
import { useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import { APP } from '../../config/app'
import { useMenu } from '../../hooks/useMenu'
import { getIcon } from '../../utils/menuIcons'

const MAIS_ITEM = { caminho: '/mais', icone: 'MoreHorizontal', nome: 'Mais' }

function SideNavItem({ to, Icon, label, onClick, exact }) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border border-transparent"
      style={({ isActive }) => isActive
        ? { background: 'rgba(204,26,26,0.08)', color: '#CC1A1A', borderColor: 'rgba(204,26,26,0.2)' }
        : { color: '#6B6560' }
      }
      onMouseEnter={e => { e.currentTarget.style.background = '#F0EBE4'; e.currentTarget.style.color = '#1A1A1A' }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}
    >
      <Icon size={17} strokeWidth={1.7} />
      <span>{label}</span>
    </NavLink>
  )
}

function Sidebar({ onClose }) {
  const { itens, isLoading } = useMenu()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3" style={{ height: 64, padding: '0 16px 0 20px', borderBottom: '1px solid #E0D6CA', flexShrink: 0 }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0" style={{ background: '#CC1A1A' }}>
          {APP.sigla}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-sm leading-none tracking-wide truncate" style={{ color: '#1A1A1A' }}>
            {APP.nome.toUpperCase()}
          </p>
          <p className="text-xs mt-1 truncate leading-none" style={{ color: '#8A7F76' }}>{APP.subtitulo}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 transition-colors shrink-0" style={{ color: '#B0A89E' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col overflow-y-auto" style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 20, paddingBottom: 16 }}>
        {isLoading && (
          [1,2,3,4,5,6,7].map(i => (
            <div key={i} className="h-10 rounded-lg mb-2 animate-pulse" style={{ background: '#F0EBE4' }} />
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
                      onClick={onClose}
                      exact={item.caminho === '/dashboard'}
                    />
                  )
                })}
              </div>
            </div>
          ))
        })()}
      </nav>
    </div>
  )
}

function TopBar({ onMenuClick }) {
  const { usuario, logout } = useAuthContext()
  const { itens } = useMenu()
  const navigate = useNavigate()
  const location = useLocation()

  const paginaAtual = itens.find(i => i.caminho === location.pathname)
  const titulo = paginaAtual?.nome || APP.nome

  function sair() { logout(); navigate('/login') }

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-4 h-16 backdrop-blur-sm"
      style={{ paddingLeft: 40, paddingRight: 32, background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid #E0D6CA', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}
    >
      {onMenuClick && (
        <button onClick={onMenuClick} className="lg:hidden p-1 transition-colors" style={{ color: '#8A7F76' }}>
          <Menu size={20} />
        </button>
      )}

      <h1 className="font-black text-base uppercase tracking-wide flex-1" style={{ color: '#1A1A1A' }}>{titulo}</h1>

      <div className="flex items-center gap-3">
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', color: '#8A7F76' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#1A1A1A'; e.currentTarget.style.borderColor = '#C4B9A8' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A7F76'; e.currentTarget.style.borderColor = '#E0D6CA' }}
        >
          <Bell size={16} strokeWidth={1.8} />
        </button>

        <div style={{ width: 1, height: 28, background: '#E0D6CA', flexShrink: 0 }} />

        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            style={{ background: 'rgba(204,26,26,0.1)', border: '1px solid rgba(204,26,26,0.25)', color: '#CC1A1A' }}
          >
            {usuario?.nome?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-semibold truncate leading-none" style={{ color: '#1A1A1A' }}>{usuario?.nome?.split(' ')[0] || 'Atleta'}</p>
            <p className="text-xs truncate mt-0.5 leading-none" style={{ color: '#8A7F76' }}>{usuario?.email || ''}</p>
          </div>
        </div>

        <button
          onClick={sair}
          title="Sair"
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', color: '#8A7F76' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#CC1A1A'; e.currentTarget.style.borderColor = 'rgba(204,26,26,0.3)'; e.currentTarget.style.background = 'rgba(204,26,26,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A7F76'; e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.background = '#F7F3EE' }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  )
}

function BottomNav() {
  const { itens } = useMenu()
  const primeiros = itens.slice(0, 4)
  const todos = [...primeiros, MAIS_ITEM]

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex" style={{ background: '#FFFFFF', borderTop: '1px solid #E0D6CA' }}>
      {todos.map(item => {
        const Icon = getIcon(item.icone)
        return (
          <NavLink
            key={item.caminho}
            to={item.caminho}
            end={item.caminho === '/dashboard'}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors"
            style={({ isActive }) => ({ color: isActive ? '#CC1A1A' : '#B0A89E' })}
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{item.nome}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function Layout() {
  const [drawer, setDrawer] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F0EBE4' }}>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col" style={{ background: '#FFFFFF', borderRight: '1px solid #E0D6CA' }}>
        <Sidebar />
      </aside>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0" style={{ background: 'rgba(26,26,26,0.4)' }} onClick={() => setDrawer(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 z-10" style={{ background: '#FFFFFF', borderRight: '1px solid #E0D6CA' }}>
            <Sidebar onClose={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setDrawer(true)} />

        <main className="flex-1 overflow-y-auto">
          <div style={{ padding: '52px 48px 96px' }}>
            <Outlet />
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
