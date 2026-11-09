import { NavLink } from 'react-router'

function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        <NavLink to="/" className="text-2xl font-bold text-blue-600">
          BookHub
        </NavLink>

        <div className="flex items-center gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? 'font-semibold text-blue-600'
                : 'text-slate-600 hover:text-blue-600'
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/explore"
            className={({ isActive }) =>
              isActive
                ? 'font-semibold text-blue-600'
                : 'text-slate-600 hover:text-blue-600'
            }
          >
            Explore
          </NavLink>
        </div>

      </nav>
    </header>
  )
}

export default Navbar