import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { maskEmail, maskPhone } from '@/utils/format'
import { User, Mail, Phone, Calendar } from 'lucide-react'
import { trpc } from '@/lib/trpc'

export function DashboardPage() {
  const { user } = useAuth()
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const resendMutation = trpc.auth.resendVerificationEmail.useMutation()

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
          <p className="text-muted-foreground text-base md:text-lg mt-1">
            Welcome back, {user.fullName}
          </p>
        </div>

        {!user?.emailVerified && !bannerDismissed && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Please verify your email to unlock all features.{' '}
                    <button
                      onClick={() => {
                        resendMutation.mutate(undefined, {
                          onSuccess: () => alert('Verification email sent!'),
                          onError: error => alert(error.message),
                        })
                      }}
                      className="font-medium underline hover:text-blue-600"
                      disabled={resendMutation.isPending}
                    >
                      {resendMutation.isPending ? 'Sending...' : 'Resend email'}
                    </button>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-blue-400 hover:text-blue-600"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

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
                  <p className="text-sm text-muted-foreground">
                    {user.fullName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {maskEmail(user.email)}
                  </p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {maskPhone(user.phone)}
                    </p>
                  </div>
                </div>
              )}

              {/* Converts to boolean to prevent from displaying "0" user.phone is undefined for Google users */}
              {!!user.age && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Age</p>
                    <p className="text-sm text-muted-foreground">
                      {user.age} years old
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Welcome to Your Dashboard
              </CardTitle>
              <CardDescription>
                This is your personal dashboard where you can manage your
                account and access features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You're successfully authenticated and can now access all the
                  features of the application.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button size="sm">Get Started</Button>
                  <Button variant="outline" size="sm">
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
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
            <CardTitle className="text-lg md:text-xl">
              Application Features
            </CardTitle>
            <CardDescription>
              This template provides a solid foundation for your SaaS
              application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-5 bg-muted/50 rounded-xl border border-border/50">
                <h3 className="font-semibold mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Complete login/signup system with form validation and error
                  handling
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
