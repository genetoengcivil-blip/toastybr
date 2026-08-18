import { Navigate } from 'react-router-dom'
import { useAuth, useCurrentOrganization } from '../../features/auth/context'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOrg?: boolean
}

export default function ProtectedRoute({ children, requireOrg = true }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { organization, loading: orgLoading } = useCurrentOrganization()

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-sm text-[var(--color-text-secondary)]">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireOrg && !organization) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
