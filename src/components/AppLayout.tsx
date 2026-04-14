import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar/Navbar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Outlet />
    </div>
  )
}
