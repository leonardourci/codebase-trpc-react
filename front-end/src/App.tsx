import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { BillingPage } from './pages/BillingPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ProtectedRoute } from './components/routes/ProtectedRoute'
import { PublicRoute } from './components/routes/PublicRoute'
import { LoadingSpinner } from './components/ui/loading-spinner'
import { useAuth } from './hooks/useAuth'
import { PricingRoute } from './routes/pricing'
import { AuthModalProvider } from './contexts/AuthModalContext'
import { MobileAuthDialog } from './components/auth/AuthModal'

function RootLayout() {
    return (
        <>
            <Outlet />
            <MobileAuthDialog />
        </>
    )
}

function App() {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return <LoadingSpinner size="lg" text="Loading application..." fullScreen />
    }

    const router = createBrowserRouter([
        {
            element: <RootLayout />,
            children: [
                {
                    path: "/",
                    element: (
                        <PublicRoute allowAuthenticated>
                            <LandingPage />
                        </PublicRoute>
                    ),
                },
                {
                    path: "/pricing",
                    element: (
                        <PublicRoute allowAuthenticated>
                            <PricingRoute />
                        </PublicRoute>
                    ),
                },
                {
                    path: "/login",
                    element: (
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    ),
                },
                {
                    path: "/signup",
                    element: (
                        <PublicRoute>
                            <SignupPage />
                        </PublicRoute>
                    ),
                },
                {
                    path: "/forgot-password",
                    element: (
                        <PublicRoute>
                            <ForgotPasswordPage />
                        </PublicRoute>
                    ),
                },
                {
                    path: "/reset-password",
                    element: <ResetPasswordPage />,
                },
                {
                    path: "/verify-email",
                    element: <VerifyEmailPage />,
                },
                {
                    path: "/dashboard",
                    element: (
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "/profile",
                    element: (
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "/billing",
                    element: (
                        <ProtectedRoute>
                            <BillingPage />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "*",
                    element: <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />,
                },
            ],
        },
    ])

    return (
        <AuthModalProvider>
            <RouterProvider router={router} />
        </AuthModalProvider>
    )
}

export default App
