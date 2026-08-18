import { Navigate } from 'react-router-dom'
import { useAuth, useCurrentOrganization } from '../context'
import { can, type Permission } from '../../../lib/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requirePermission?: Permission
  redirectTo?: string
  forbiddenTo?: string
}

export default function ProtectedRoute({
  children,
  requirePermission,
  redirectTo = '/login',
  forbiddenTo = '/forbidden',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const { role, loading: orgLoading } = useCurrentOrganization()

  if (loading || orgLoading) {
    return <div data-testid="route-loading">Carregando…</div>
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />
  }

  if (requirePermission && !can(role, requirePermission)) {
    return <Navigate to={forbiddenTo} replace />
  }

  return <>{children}</>
}
