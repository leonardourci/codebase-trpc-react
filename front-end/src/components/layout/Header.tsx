import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { AuthButtons } from '@/components/auth/AuthModal'
import { Menu, X, LogOut, User } from 'lucide-react'

interface HeaderProps {
    onMenuToggle?: () => void
    showMenuButton?: boolean
}

export function Header({ onMenuToggle, showMenuButton = false }: HeaderProps) {
    const { user, logout, isAuthenticated } = useAuth()
    const { openAuth } = useAuthModal()
    const navigate = useNavigate()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        setIsMobileMenuOpen(false)
        navigate('/login')
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const handleMobileAuth = (mode: 'login' | 'signup') => {
        setIsMobileMenuOpen(false)
        openAuth(mode)
    }

    return (
        <header className="bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/50 fixed top-0 left-0 right-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-20">
                    <div className="flex items-center space-x-4">
                        {showMenuButton && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onMenuToggle}
                                className="lg:hidden"
                                aria-label="Toggle sidebar"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        )}

                        <Link to="/" className="flex items-center space-x-2 group">
                            <div className="w-9 h-9 md:w-10 md:h-10 bg-primary rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                <span className="text-primary-foreground font-bold text-sm md:text-base">A</span>
                            </div>
                            <span className="font-semibold text-lg md:text-xl hidden sm:block">App Name</span>
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center space-x-2">
                        <ThemeToggle />

                        <Link to="/pricing">
                            <Button variant="ghost" size="sm">
                                Pricing
                            </Button>
                        </Link>

                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard">
                                    <Button variant="ghost" size="sm">
                                        Dashboard
                                    </Button>
                                </Link>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground px-3">
                                    <User className="h-4 w-4" />
                                    <span>{user?.fullName || user?.email}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </Button>
                            </>
                        ) : (
                            <AuthButtons className="flex items-center space-x-2" />
                        )}
                    </nav>

                    <div className="flex items-center space-x-1 md:hidden">
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMobileMenu}
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {isMobileMenuOpen && !isAuthenticated && (
                    <div className="md:hidden border-t border-border/50 py-4 bg-background/95 backdrop-blur-md">
                        <nav className="flex flex-col space-y-2">
                            <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start">
                                    Pricing
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => handleMobileAuth('login')}
                            >
                                Sign In
                            </Button>
                            <Button
                                className="w-full justify-start"
                                onClick={() => handleMobileAuth('signup')}
                            >
                                Sign Up
                            </Button>
                        </nav>
                    </div>
                )}

                {isMobileMenuOpen && isAuthenticated && (
                    <div className="md:hidden border-t border-border/50 py-4 bg-background/95 backdrop-blur-md">
                        <nav className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{user?.fullName || user?.email}</span>
                            </div>
                            <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start">
                                    Pricing
                                </Button>
                            </Link>
                            <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start">
                                    Dashboard
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="justify-start"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    )
}
