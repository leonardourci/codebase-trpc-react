import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { maskEmail, maskPhone } from '@/utils/format'
import { User, Mail, Phone, Calendar } from 'lucide-react'

export function DashboardPage() {
    const { user } = useAuth()

    if (!user) {
        return (
            <AppLayout showSidebar>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold">Loading...</h2>
                    </div>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout showSidebar>
            <div className="space-y-6 md:space-y-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground text-base md:text-lg mt-1">Welcome back, {user.fullName}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                <User className="h-5 w-5 text-primary" />
                                Profile Information
                            </CardTitle>
                            <CardDescription>
                                Your account details and information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Full Name</p>
                                    <p className="text-sm text-muted-foreground">{user.fullName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Email</p>
                                    <p className="text-sm text-muted-foreground">{maskEmail(user.email)}</p>
                                </div>
                            </div>

                            {user.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Phone</p>
                                        <p className="text-sm text-muted-foreground">{maskPhone(user.phone)}</p>
                                    </div>
                                </div>
                            )}

                            {user.age && (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Age</p>
                                        <p className="text-sm text-muted-foreground">{user.age} years old</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg md:text-xl">Welcome to Your Dashboard</CardTitle>
                            <CardDescription>
                                This is your personal dashboard where you can manage your account and access features.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    You're successfully authenticated and can now access all the features of the application.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button size="sm">Get Started</Button>
                                    <Button variant="outline" size="sm">Learn More</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
                            <CardDescription>
                                Common tasks and shortcuts
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Button variant="ghost" className="w-full justify-start">
                                    View Profile Settings
                                </Button>
                                <Button variant="ghost" className="w-full justify-start">
                                    Update Account Info
                                </Button>
                                <Button variant="ghost" className="w-full justify-start">
                                    Security Settings
                                </Button>
                                <Button variant="ghost" className="w-full justify-start">
                                    Help & Support
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg md:text-xl">Application Features</CardTitle>
                        <CardDescription>
                            This template provides a solid foundation for your SaaS application
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="p-5 bg-muted/50 rounded-xl border border-border/50">
                                <h3 className="font-semibold mb-2">Authentication</h3>
                                <p className="text-sm text-muted-foreground">
                                    Complete login/signup system with form validation and error handling
                                </p>
                            </div>

                            <div className="p-5 bg-muted/50 rounded-xl border border-border/50">
                                <h3 className="font-semibold mb-2">Protected Routes</h3>
                                <p className="text-sm text-muted-foreground">
                                    Automatic redirection and session management for secure areas
                                </p>
                            </div>

                            <div className="p-5 bg-muted/50 rounded-xl border border-border/50">
                                <h3 className="font-semibold mb-2">Responsive Design</h3>
                                <p className="text-sm text-muted-foreground">
                                    Mobile-first design that works perfectly on all devices
                                </p>
                            </div>

                            <div className="p-5 bg-muted/50 rounded-xl border border-border/50">
                                <h3 className="font-semibold mb-2">Modern UI</h3>
                                <p className="text-sm text-muted-foreground">
                                    Beautiful components built with shadcn/ui and Tailwind CSS
                                </p>
                            </div>

                            <div className="p-5 bg-muted/50 rounded-xl border border-border/50">
                                <h3 className="font-semibold mb-2">Type Safety</h3>
                                <p className="text-sm text-muted-foreground">
                                    Full TypeScript support with tRPC for end-to-end type safety
                                </p>
                            </div>

                            <div className="p-5 bg-muted/50 rounded-xl border border-border/50">
                                <h3 className="font-semibold mb-2">Production Ready</h3>
                                <p className="text-sm text-muted-foreground">
                                    Optimized build process and deployment-ready configuration
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
