import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { loginSchema, type TLoginInput } from '@/validations/auth.schemas'
import { signupSchema, type TSignUpFormInput } from '@/validations/auth.schemas'
import type { TSignupInput } from '@/types/auth'
import { GoogleAuthButton } from './GoogleAuthButton'
import { AuthDivider } from './AuthDivider'

interface AuthFormProps {
  mode: 'login' | 'signup'
  onSwitchMode: (mode: 'login' | 'signup') => void
  onSuccess?: () => void
}

function AuthForm({ mode, onSwitchMode, onSuccess }: AuthFormProps) {
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

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

  const onLoginSubmit = async (data: TLoginInput) => {
    setIsLoading(true)
    try {
      await login(data)
      onSuccess?.()
      navigate('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const onSignupSubmit = async (data: TSignUpFormInput) => {
    setIsLoading(true)
    try {
      const { confirmPassword, ...signupPayload } = data
      await signup(signupPayload as TSignupInput)
      onSuccess?.()
      navigate('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  if (mode === 'login') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleLoginSubmit(onLoginSubmit)
        }}
        className="space-y-4"
        data-slot="auth-form"
      >
        {loginErrors.general && (
          <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
            {loginErrors.general}
          </div>
        )}

        <GoogleAuthButton onSuccess={onSuccess} />
        <AuthDivider />

        <div className="space-y-2">
          <Label htmlFor="auth-login-email">Email</Label>
          <Input
            id="auth-login-email"
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
          <Label htmlFor="auth-login-password">Password</Label>
          <Input
            id="auth-login-password"
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

        <div className="flex flex-col gap-3 pt-2">
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSwitchMode('signup')}
            className="text-muted-foreground"
          >
            Don't have an account? Sign up
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSignupSubmit(onSignupSubmit)
      }}
      className="space-y-4"
      data-slot="auth-form"
    >
      {signupErrors.general && (
        <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
          {signupErrors.general}
        </div>
      )}

      <GoogleAuthButton onSuccess={onSuccess} />
      <AuthDivider />

      <div className="space-y-2">
        <Label htmlFor="auth-signup-fullName">Full Name</Label>
        <Input
          id="auth-signup-fullName"
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
        <Label htmlFor="auth-signup-email">Email</Label>
        <Input
          id="auth-signup-email"
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
          <Label htmlFor="auth-signup-phone">Phone</Label>
          <Input
            id="auth-signup-phone"
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
          <Label htmlFor="auth-signup-age">Age</Label>
          <Input
            id="auth-signup-age"
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
        <Label htmlFor="auth-signup-password">Password</Label>
        <Input
          id="auth-signup-password"
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
        <Label htmlFor="auth-signup-confirmPassword">Confirm Password</Label>
        <Input
          id="auth-signup-confirmPassword"
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

      <div className="flex flex-col gap-3 pt-2">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <div className="flex items-center">
              <LoadingSpinner size="sm" className="mr-2" />
              Creating account...
            </div>
          ) : (
            'Sign Up'
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onSwitchMode('login')}
          className="text-muted-foreground"
        >
          Already have an account? Sign in
        </Button>
      </div>
    </form>
  )
}

interface DesktopAuthPopoverProps {
  signInButtonRef: React.RefObject<HTMLButtonElement | null>
  signUpButtonRef: React.RefObject<HTMLButtonElement | null>
}

export function DesktopAuthPopover({ signInButtonRef, signUpButtonRef }: DesktopAuthPopoverProps) {
  const { authMode, closeAuth, switchMode } = useAuthModal()
  const isOpen = authMode !== 'none'

  const anchorRef = authMode === 'signup' ? signUpButtonRef : signInButtonRef

  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && closeAuth()}>
      <PopoverAnchor virtualRef={anchorRef as React.RefObject<HTMLButtonElement>} />
      <PopoverContent
        className="w-80 p-4 bg-white border border-border shadow-lg"
        align="end"
        sideOffset={8}
        data-slot="auth-popover"
      >
        <h3 className="text-lg font-semibold mb-4">
          {authMode === 'login' ? 'Sign In' : 'Create Account'}
        </h3>
        {authMode !== 'none' && (
          <AuthForm
            mode={authMode}
            onSwitchMode={switchMode}
            onSuccess={closeAuth}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}

export function MobileAuthDialog() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { authMode, closeAuth, switchMode } = useAuthModal()

  if (isDesktop || authMode === 'none') {
    return null
  }

  return (
    <Dialog open onOpenChange={(open) => !open && closeAuth()}>
      <DialogContent hideOverlay className="bg-white" data-slot="auth-dialog">
        <DialogHeader>
          <DialogTitle>
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 pt-6">
          <div className="w-full max-w-sm mx-auto">
            <AuthForm
              mode={authMode}
              onSwitchMode={switchMode}
              onSuccess={closeAuth}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface AuthButtonsProps {
  className?: string
}

export function AuthButtons({ className }: AuthButtonsProps) {
  const { openAuth } = useAuthModal()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const signInButtonRef = useRef<HTMLButtonElement>(null)
  const signUpButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <div className={className} data-slot="auth-buttons">
      <Button
        ref={signInButtonRef}
        variant="ghost"
        size="sm"
        onClick={() => openAuth('login')}
      >

        Sign In
      </Button>
      <Button
        ref={signUpButtonRef}
        size="sm"
        onClick={() => openAuth('signup')}
      >
        Sign Up
      </Button>
      {isDesktop && (
        <DesktopAuthPopover
          signInButtonRef={signInButtonRef}
          signUpButtonRef={signUpButtonRef}
        />
      )}
    </div>
  )
}
