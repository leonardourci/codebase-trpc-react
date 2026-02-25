import { createContext, useContext, useState, type ReactNode } from 'react'

type AuthMode = 'none' | 'login' | 'signup'

interface AuthModalContextType {
  authMode: AuthMode
  openAuth: (mode: 'login' | 'signup') => void
  closeAuth: () => void
  switchMode: (mode: 'login' | 'signup') => void
}

const AuthModalContext = createContext<AuthModalContextType | null>(null)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [authMode, setAuthMode] = useState<AuthMode>('none')

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
  }

  const closeAuth = () => {
    setAuthMode('none')
  }

  const switchMode = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
  }

  return (
    <AuthModalContext.Provider value={{ authMode, openAuth, closeAuth, switchMode }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}
