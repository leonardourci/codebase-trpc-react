import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Shield, Zap, Smartphone, Code, Users, Star } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'

export function LandingPage() {
    const { openAuth } = useAuthModal()
    const { isAuthenticated } = useAuth()

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background pt-16 md:pt-20">
            <Header />

            <section className="px-4 py-12 md:py-20 lg:py-24">
                <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                        Production-Ready
                        <span className="text-primary block md:inline md:ml-2">SaaS Template</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        A complete, functional React template with authentication, protected routes,
                        and beautiful UI components. Deploy immediately and customize with your content.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className="flex items-center gap-2 w-full"
                                >
                                    Go to Dashboard
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Button
                                    size="lg"
                                    className="flex items-center gap-2 w-full sm:w-auto"
                                    onClick={() => openAuth('signup')}
                                >
                                    Start Building
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full sm:w-auto"
                                    onClick={() => openAuth('login')}
                                >
                                    View Demo
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <section className="px-4 py-12 md:py-16 lg:py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 md:mb-16 space-y-3">
                        <h2 className="text-3xl md:text-4xl font-bold">Everything You Need</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                            Built with modern technologies and best practices for rapid SaaS development
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <Shield className="h-8 w-8 text-primary mb-3" />
                                <CardTitle>Complete Authentication</CardTitle>
                                <CardDescription>
                                    Full login/signup system with form validation, error handling, and secure token management
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Zap className="h-8 w-8 text-primary mb-3" />
                                <CardTitle>Protected Routes</CardTitle>
                                <CardDescription>
                                    Automatic redirection, session management, and secure access control for authenticated areas
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Smartphone className="h-8 w-8 text-primary mb-3" />
                                <CardTitle>Mobile-First Design</CardTitle>
                                <CardDescription>
                                    Responsive design that works perfectly on all devices with Tailwind CSS and modern patterns
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Code className="h-8 w-8 text-primary mb-3" />
                                <CardTitle>Type-Safe API</CardTitle>
                                <CardDescription>
                                    End-to-end type safety with tRPC, automatic API client generation, and React Query integration
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Users className="h-8 w-8 text-primary mb-3" />
                                <CardTitle>Modern UI Components</CardTitle>
                                <CardDescription>
                                    Beautiful, accessible components built with shadcn/ui, Radix UI primitives, and React 19
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Star className="h-8 w-8 text-primary mb-3" />
                                <CardTitle>Production Ready</CardTitle>
                                <CardDescription>
                                    Optimized build process, ESLint configuration, and deployment-ready setup for immediate use
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            <section className="px-4 py-12 md:py-16 lg:py-20 bg-muted/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 md:mb-16 space-y-3">
                        <h2 className="text-3xl md:text-4xl font-bold">Built With Modern Tech</h2>
                        <p className="text-muted-foreground text-lg">
                            Leveraging the best tools and frameworks for optimal developer experience
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
                        <Card className="text-center">
                            <CardHeader>
                                <CardTitle className="text-xl">React 19</CardTitle>
                                <CardDescription>Latest React with modern patterns</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="text-center">
                            <CardHeader>
                                <CardTitle className="text-xl">TypeScript</CardTitle>
                                <CardDescription>Full type safety and IntelliSense</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="text-center">
                            <CardHeader>
                                <CardTitle className="text-xl">Tailwind CSS</CardTitle>
                                <CardDescription>Utility-first styling framework</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="text-center">
                            <CardHeader>
                                <CardTitle className="text-xl">tRPC</CardTitle>
                                <CardDescription>End-to-end type-safe APIs</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            <section className="px-4 py-12 md:py-16 lg:py-20">
                <div className="max-w-3xl mx-auto text-center space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold">Ready to Start Building?</h2>
                    <p className="text-muted-foreground text-lg">
                        Get started with our production-ready template and launch your SaaS application faster than ever.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className="flex items-center gap-2 w-full"
                                >
                                    Go to Dashboard
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Button
                                    size="lg"
                                    className="flex items-center gap-2 w-full sm:w-auto"
                                    onClick={() => openAuth('signup')}
                                >
                                    Create Account
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full sm:w-auto"
                                    onClick={() => openAuth('login')}
                                >
                                    Sign In
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm mt-20">
                <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
                                <Code className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <span className="font-semibold text-lg">Frontend Foundation</span>
                        </div>
                        <div className="text-sm text-muted-foreground text-center md:text-right">
                            Built with React 19, TypeScript, and Tailwind CSS
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
