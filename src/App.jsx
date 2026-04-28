// App.jsx
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { ShoppingCart, Calendar, ArrowLeftRight, Car } from 'lucide-react'
import PurchasePage    from './pages/PurchasePage.jsx'
import LeasePage       from './pages/LeasePage.jsx'
import ComparisonPage  from './pages/ComparisonPage.jsx'

const NAV = [
  { to: '/',          label: 'Purchase', Icon: ShoppingCart },
  { to: '/lease',     label: 'Lease',    Icon: Calendar },
  { to: '/compare',   label: 'Compare',  Icon: ArrowLeftRight },
]

export default function App() {
  const { pathname } = useLocation()

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh]">
      {/* ── Top bar (desktop sidebar nav placeholder / mobile header) ── */}
      <header className="sticky top-0 z-40 bg-surface-900/80 backdrop-blur border-b border-surface-700
                         px-4 py-3 flex items-center gap-3 md:hidden">
        <Car size={20} className="text-accent" />
        <span className="font-display text-lg text-slate-100">CarFinance</span>
      </header>

      {/* ── Desktop layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar nav — desktop only */}
        <aside className="hidden md:flex flex-col w-56 bg-surface-800 border-r border-surface-700
                          p-4 gap-1 shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-4 mb-4">
            <Car size={22} className="text-accent" />
            <span className="font-display text-xl text-slate-100">CarFinance</span>
          </div>
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                 transition-colors duration-150
                 ${isActive
                   ? 'bg-accent/10 text-accent'
                   : 'text-slate-400 hover:text-slate-200 hover:bg-surface-700'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-accent' : ''} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 pb-28 md:pb-8">
            <Routes>
              <Route path="/"        element={<PurchasePage />}   />
              <Route path="/lease"   element={<LeasePage />}      />
              <Route path="/compare" element={<ComparisonPage />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* ── Bottom nav — mobile only ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40
                      bg-surface-800/90 backdrop-blur border-t border-surface-700
                      flex justify-around items-center
                      pb-[env(safe-area-inset-bottom)]">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-tab flex-1 ${isActive ? 'nav-tab-active' : 'nav-tab-inactive'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-accent' : ''} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
