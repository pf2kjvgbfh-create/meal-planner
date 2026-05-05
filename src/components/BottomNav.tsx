import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Меню', icon: '📅' },
  { to: '/recipes', label: 'Рецепты', icon: '📖' },
  { to: '/shopping', label: 'Покупки', icon: '🛒' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-green-100 flex safe-bottom">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
              isActive ? 'text-green-600' : 'text-gray-400 hover:text-green-500'
            }`
          }
        >
          <span className="text-xl leading-none">{tab.icon}</span>
          <span className="text-xs font-medium">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
