import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { TRPCProvider } from './providers/trpc-provider'
import { ThemeProvider } from './providers/ThemeContext'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <GoogleOAuthProvider
                clientId={googleClientId}
                locale='en'
            >
                <TRPCProvider>
                    <App />
                </TRPCProvider>
            </GoogleOAuthProvider>
        </ThemeProvider>
    </StrictMode>,
)