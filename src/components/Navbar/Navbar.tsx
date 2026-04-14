import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { CategoryDropdown } from './CategoryDropdown'
import { SubcategoryDropdown } from './SubcategoryDropdown'
import { SearchBar } from './SearchBar'
import { AccountMenu } from './AccountMenu'

export function Navbar() {
  const { logoutMutation, user } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      {/* Row 1: Logo, Account, Logout */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 pt-3 pb-2">
        <Link to="/" className="mr-4 flex items-center gap-2 font-bold text-orange-600 text-lg shrink-0">
          🍕 PizzaMath
        </Link>

        <div className="flex-1" />

        <AccountMenu />
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="rounded-md bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-200"
          >
            Admin
          </Link>
        )}
        <button
          onClick={() => logoutMutation.mutate()}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Logout
        </button>
      </div>

      {/* Row 2: Category, Subcategory, Search */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 pb-3">
        <CategoryDropdown />
        <SubcategoryDropdown />
        <div className="flex-1" />
        <SearchBar />
      </div>
    </header>
  )
}
