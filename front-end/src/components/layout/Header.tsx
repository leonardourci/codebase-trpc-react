import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useFormValidation } from '@/hooks/useFormValidation'
import { Menu, X, LogOut, User } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { loginSchema, type TLoginInput } from '@/validations/auth.schemas'
import { signupSchema, type TSignUpFormInput } from '@/validations/auth.schemas'
import { type TSignupInput } from '@/types/auth'

interface HeaderProps {
    onMenuToggle?: () => void
    showMenuButton?: boolean
}

export function Header({ onMenuToggle, showMenuButton = false }: HeaderProps) {
    const { user, logout, isAuthenticated, login, signup } = useAuth()
    const navigate = useNavigate()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [authMode, setAuthMode] = useState<'none' | 'login' | 'signup'>('none')
    const [isAuthLoading, setIsAuthLoading] = useState(false)

    const {
        formData: loginData,
        errors: loginErrors,
        handleInputChange: handleLoginChange,
        handleSubmit: handleLoginSubmit,
    } = useFormValidation<TLoginInput>(
        { email: '', password: '' },
        loginSchema
    )

    const {
        formData: signupData,
        errors: signupErrors,
        handleInputChange: handleSignupChange,
        handleSubmit: handleSignupSubmit,
    } = useFormValidation<TSignUpFormInput>(
        {
            fullName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            age: 0
        },
        signupSchema
    )

    const handleLogout = async () => {
        await logout()
        setIsMobileMenuOpen(false)
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const openAuth = (mode: 'login' | 'signup') => {
        setAuthMode(mode)
        setIsMobileMenuOpen(false)
    }

    const closeAuth = () => {
        setAuthMode('none')
    }

    const onLoginSubmit = async (data: TLoginInput) => {
        setIsAuthLoading(true)
        try {
            await login(data)
            navigate('/dashboard')
            closeAuth()
        } finally {
            setIsAuthLoading(false)
        }
    }

    const onSignupSubmit = async (data: TSignUpFormInput) => {
        setIsAuthLoading(true)
        try {
            const { confirmPassword, ...signupPayload } = data
            await signup(signupPayload as TSignupInput)
            navigate('/dashboard')
            closeAuth()
        } finally {
            setIsAuthLoading(false)
        }
    }

    return (
        <>
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
                            <Link to="/pricing">
                                <Button variant="ghost" size="sm">
                                    Pricing
                                </Button>
                            </Link>

                            {isAuthenticated ? (
                                <>
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
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openAuth('login')}
                                    >
                                        Sign In
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => openAuth('signup')}
                                    >
                                        Sign Up
                                    </Button>
                                </>
                            )}
                        </nav>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMobileMenu}
                            className="md:hidden"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
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
                                    onClick={() => openAuth('login')}
                                >
                                    Sign In
                                </Button>
                                <Button
                                    className="w-full justify-start"
                                    onClick={() => openAuth('signup')}
                                >
                                    Sign Up
                                </Button>
                            </nav>
                        </div>
                    )}

                    {isMobileMenuOpen && isAuthenticated && (
                        <div className="md:hidden border-t border-border/50 py-4 bg-background/95 backdrop-blur-md">
                            <nav className="flex flex-col space-y-2">
                                <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start">
                                        Pricing
                                    </Button>
                                </Link>
                                <div className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>{user?.fullName || user?.email}</span>
                                </div>
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

            {authMode !== 'none' && (
                <div className="bg-muted/30 border-b border-border/50 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                        <div className="max-w-md mx-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl md:text-2xl font-bold">
                                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={closeAuth}
                                    aria-label="Close"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {authMode === 'login' ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        handleLoginSubmit(onLoginSubmit)
                                    }}
                                    className="space-y-4"
                                >
                                    {loginErrors.general && (
                                        <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
                                            {loginErrors.general}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="login-email">Email</Label>
                                        <Input
                                            id="login-email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={loginData.email}
                                            onChange={(e) => handleLoginChange('email', e.target.value)}
                                            className={loginErrors.email ? 'border-destructive' : ''}
                                        />
                                        {loginErrors.email && (
                                            <p className="text-sm text-destructive">{loginErrors.email}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="login-password">Password</Label>
                                        <Input
                                            id="login-password"
                                            type="password"
                                            placeholder="Enter your password"
                                            value={loginData.password}
                                            onChange={(e) => handleLoginChange('password', e.target.value)}
                                            className={loginErrors.password ? 'border-destructive' : ''}
                                        />
                                        {loginErrors.password && (
                                            <p className="text-sm text-destructive">{loginErrors.password}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setAuthMode('signup')}
                                        >
                                            Don't have an account? Sign up
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isAuthLoading}
                                        >
                                            {isAuthLoading ? (
                                                <div className="flex items-center">
                                                    <LoadingSpinner size="sm" className="mr-2" />
                                                    Signing in...
                                                </div>
                                            ) : (
                                                'Sign In'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        handleSignupSubmit(onSignupSubmit)
                                    }}
                                    className="space-y-4"
                                >
                                    {signupErrors.general && (
                                        <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
                                            {signupErrors.general}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="signup-fullName">Full Name</Label>
                                        <Input
                                            id="signup-fullName"
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={signupData.fullName}
                                            onChange={(e) => handleSignupChange('fullName', e.target.value)}
                                            className={signupErrors.fullName ? 'border-destructive' : ''}
                                        />
                                        {signupErrors.fullName && (
                                            <p className="text-sm text-destructive">{signupErrors.fullName}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">Email</Label>
                                        <Input
                                            id="signup-email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={signupData.email}
                                            onChange={(e) => handleSignupChange('email', e.target.value)}
                                            className={signupErrors.email ? 'border-destructive' : ''}
                                        />
                                        {signupErrors.email && (
                                            <p className="text-sm text-destructive">{signupErrors.email}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-phone">Phone</Label>
                                            <Input
                                                id="signup-phone"
                                                type="tel"
                                                placeholder="Enter phone"
                                                value={signupData.phone}
                                                onChange={(e) => handleSignupChange('phone', e.target.value)}
                                                className={signupErrors.phone ? 'border-destructive' : ''}
                                            />
                                            {signupErrors.phone && (
                                                <p className="text-sm text-destructive">{signupErrors.phone}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-age">Age</Label>
                                            <Input
                                                id="signup-age"
                                                type="number"
                                                placeholder="Age"
                                                value={signupData.age || ''}
                                                onChange={(e) => handleSignupChange('age', parseInt(e.target.value) || 0)}
                                                className={signupErrors.age ? 'border-destructive' : ''}
                                                min="13"
                                                max="120"
                                            />
                                            {signupErrors.age && (
                                                <p className="text-sm text-destructive">{signupErrors.age}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Password</Label>
                                        <Input
                                            id="signup-password"
                                            type="password"
                                            placeholder="Create a password"
                                            value={signupData.password}
                                            onChange={(e) => handleSignupChange('password', e.target.value)}
                                            className={signupErrors.password ? 'border-destructive' : ''}
                                        />
                                        {signupErrors.password && (
                                            <p className="text-sm text-destructive">{signupErrors.password}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signup-confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="signup-confirmPassword"
                                            type="password"
                                            placeholder="Confirm your password"
                                            value={signupData.confirmPassword}
                                            onChange={(e) => handleSignupChange('confirmPassword', e.target.value)}
                                            className={signupErrors.confirmPassword ? 'border-destructive' : ''}
                                        />
                                        {signupErrors.confirmPassword && (
                                            <p className="text-sm text-destructive">{signupErrors.confirmPassword}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setAuthMode('login')}
                                        >
                                            Already have an account? Sign in
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isAuthLoading}
                                        >
                                            {isAuthLoading ? (
                                                <div className="flex items-center">
                                                    <LoadingSpinner size="sm" className="mr-2" />
                                                    Creating account...
                                                </div>
                                            ) : (
                                                'Sign Up'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
