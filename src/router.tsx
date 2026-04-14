import { createBrowserRouter } from 'react-router-dom'
import { AuthGuard } from './components/AuthGuard'
import { SubscriptionGuard } from './components/SubscriptionGuard'
import { AdminGuard } from './components/AdminGuard'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SubscribePage } from './pages/SubscribePage'
import { BrowsePage } from './pages/BrowsePage'
import { WorksheetPage } from './pages/WorksheetPage'
import { AccountPage } from './pages/AccountPage'
import { UsageHistoryPage } from './pages/UsageHistoryPage'
import { AdminPage } from './pages/admin/AdminPage'
import { GeneratePage } from './pages/admin/GeneratePage'

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/subscribe', element: <SubscribePage /> },

  // Authenticated routes
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Subscription-gated routes
          {
            element: <SubscriptionGuard />,
            children: [
              { path: '/', element: <BrowsePage /> },
              { path: '/worksheets/:id', element: <WorksheetPage /> },
              { path: '/account', element: <AccountPage /> },
              { path: '/history', element: <UsageHistoryPage /> },
            ],
          },

          // Admin-only routes (bypass subscription gate)
          {
            element: <AdminGuard />,
            children: [
              { path: '/admin', element: <AdminPage /> },
              { path: '/admin/generate', element: <GeneratePage /> },
            ],
          },
        ],
      },
    ],
  },
])
