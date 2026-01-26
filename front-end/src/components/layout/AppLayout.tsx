import { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface AppLayoutProps {
    children: React.ReactNode
    showSidebar?: boolean
}

export function AppLayout({ children, showSidebar = false }: AppLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const closeSidebar = () => {
        setIsSidebarOpen(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
            <Header
                onMenuToggle={toggleSidebar}
                showMenuButton={showSidebar}
            />

            <div className="flex">
                {showSidebar && (
                    <Sidebar
                        isOpen={isSidebarOpen}
                        onClose={closeSidebar}
                    />
                )}

                <main
                    className={`flex-1 transition-all duration-200 ${showSidebar ? 'lg:ml-64' : ''}`}
                >
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
