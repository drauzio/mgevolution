import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import { APP } from '../../config/app'
import { useMenu } from '../../hooks/useMenu'
import { getIcon } from '../../utils/menuIcons'
import NotificacaoBell from './NotificacaoBell'

const HOME_ITEM = { caminho: '/dashboard', icone: 'Home', nome: 'Início' }

function SideNavItem({ to, Icon, label, onClick, exact }) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px',
        borderRadius: 9,
        fontSize: 13, fontWeight: isActive ? 700 : 500,
        textDecoration: 'none', transition: 'all 0.15s',
        background: isActive ? 'rgba(204,26,26,0.08)' : 'transparent',
        color: isActive ? '#CC1A1A' : '#6B6560',
        borderLeft: `3px solid ${isActive ? '#CC1A1A' : 'transparent'}`,
      })}
      onMouseEnter={e => {
        if (e.currentTarget.style.borderLeftColor !== 'rgb(204, 26, 26)') {
          e.currentTarget.style.background = '#F0EBE4'
          e.currentTarget.style.color = '#1A1A1A'
        }
      }}
      onMouseLeave={e => {
        if (e.currentTarget.style.borderLeftColor !== 'rgb(204, 26, 26)') {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#6B6560'
        }
      }}
    >
      {({ isActive }) => (
        <>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isActive ? 'rgba(204,26,26,0.12)' : 'rgba(0,0,0,0.04)',
            color: isActive ? '#CC1A1A' : '#8A7F76',
            transition: 'all 0.15s',
          }}>
            <Icon size={14} strokeWidth={isActive ? 2.2 : 1.7} />
          </div>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        </>
      )}
    </NavLink>
  )
}

function Sidebar({ onClose }) {
  const { itens, isLoading } = useMenu()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3" style={{ height: 64, padding: '0 16px 0 20px', borderBottom: '1px solid #E0D6CA', flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 2 }}>
          <img src="/logo_mg.png" alt={APP.sigla} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
            <div key={grupo.id_menu} style={{ marginBottom: 6 }}>
              {gi > 0 && <div style={{ height: 1, background: '#F0EBE4', margin: '6px 4px 10px' }} />}

              {grupo.grupo && (() => {
                const GrupoIcon = getIcon(grupo.grupo_icone || grupo.itens[0]?.icone)
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 8px', marginBottom: 4 }}>
                    <GrupoIcon size={11} strokeWidth={1.8} style={{ color: '#B0A89E', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#B0A89E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {grupo.grupo}
                    </span>
                  </div>
                )
              })()}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
      className="sticky top-0 z-40 flex items-center gap-3 h-16 backdrop-blur-sm"
      style={{ paddingLeft: 24, paddingRight: 24, background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid #E0D6CA', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}
    >
      {onMenuClick && (
        <button onClick={onMenuClick} className="lg:hidden p-1 transition-colors" style={{ color: '#8A7F76' }}>
          <Menu size={20} />
        </button>
      )}

      <h1 className="font-black text-base uppercase tracking-wide flex-1" style={{ color: '#1A1A1A' }}>{titulo}</h1>

      <div className="flex items-center gap-3">
        <NotificacaoBell />

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
  const semDashboard = itens.filter(i => i.caminho !== '/dashboard').slice(0, 4)
  const todos = [HOME_ITEM, ...semDashboard]

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex"
      style={{ background: '#FFFFFF', borderTop: '1px solid #E0D6CA', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {todos.map(item => {
        const Icon = getIcon(item.icone)
        return (
          <NavLink
            key={item.caminho}
            to={item.caminho}
            end={item.caminho === '/dashboard'}
            style={({ isActive }) => ({
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, padding: '10px 4px 8px', textDecoration: 'none', position: 'relative',
              color: isActive ? '#CC1A1A' : '#B0A89E',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 28, height: 3, background: '#CC1A1A', borderRadius: '0 0 3px 3px' }} />
                )}
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? 'rgba(204,26,26,0.1)' : 'transparent',
                  transition: 'all 0.15s',
                }}>
                  <Icon size={19} strokeWidth={isActive ? 2.2 : 1.7} />
                </div>
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, lineHeight: 1 }}>
                  {item.nome}
                </span>
              </>
            )}
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
