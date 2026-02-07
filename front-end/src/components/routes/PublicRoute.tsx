import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface PublicRouteProps {
    children: React.ReactNode
    allowAuthenticated?: boolean
}

export function PublicRoute({ children, allowAuthenticated = false }: PublicRouteProps) {
    const { isAuthenticated } = useAuth()

    if (isAuthenticated && !allowAuthenticated) {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}