import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import LoginPage from '../pages/LoginPage'
import SignUpPage from '../pages/SignUpPage'
import OnboardingPage from '../pages/OnboardingPage'
import NotFoundPage from '../pages/NotFoundPage'
import PageSkeleton from '../components/layout/PageSkeleton'

const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const POSPage = lazy(() => import('../pages/POSPage'))
const OrdersPage = lazy(() => import('../pages/OrdersPage'))
const KitchenPage = lazy(() => import('../pages/KitchenPage'))
const MenuPage = lazy(() => import('../pages/MenuPage'))
const InventoryPage = lazy(() => import('../pages/InventoryPage'))
const PurchasingPage = lazy(() => import('../pages/PurchasingPage'))
const FinancePage = lazy(() => import('../pages/FinancePage'))
const CustomersPage = lazy(() => import('../pages/CustomersPage'))
const MarketingPage = lazy(() => import('../pages/MarketingPage'))
const StaffPage = lazy(() => import('../pages/StaffPage'))
const ReportsPage = lazy(() => import('../pages/ReportsPage'))
const IngredientsPage = lazy(() => import('../pages/IngredientsPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))

function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {children}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute requireOrg={false}>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <LazyRoute><DashboardPage /></LazyRoute> },
      { path: 'pos', element: <LazyRoute><POSPage /></LazyRoute> },
      { path: 'orders', element: <LazyRoute><OrdersPage /></LazyRoute> },
      { path: 'kitchen', element: <LazyRoute><KitchenPage /></LazyRoute> },
      { path: 'menu', element: <LazyRoute><MenuPage /></LazyRoute> },
      { path: 'ingredients', element: <LazyRoute><IngredientsPage /></LazyRoute> },
      { path: 'inventory', element: <LazyRoute><InventoryPage /></LazyRoute> },
      { path: 'purchasing', element: <LazyRoute><PurchasingPage /></LazyRoute> },
      { path: 'finance', element: <LazyRoute><FinancePage /></LazyRoute> },
      { path: 'customers', element: <LazyRoute><CustomersPage /></LazyRoute> },
      { path: 'marketing', element: <LazyRoute><MarketingPage /></LazyRoute> },
      { path: 'staff', element: <LazyRoute><StaffPage /></LazyRoute> },
      { path: 'reports', element: <LazyRoute><ReportsPage /></LazyRoute> },
      { path: 'settings', element: <LazyRoute><SettingsPage /></LazyRoute> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
