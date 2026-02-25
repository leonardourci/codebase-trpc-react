import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { AppLayout } from '@/components/layout/AppLayout'
import { useUser } from '@/hooks/useUser'
import { useFormValidation } from '@/hooks/useFormValidation'
import type { UserProfile, UpdateUserInput as TUpdateUserInput } from '@/lib/trpc-types'
import { User, Save, Edit, X, Mail } from 'lucide-react'
import { updateUserSchema } from '@/validations/user.schemas'
import { trpc } from '@/lib/trpc'
import { ChangeEmailDialog } from '@/components/profile/ChangeEmailDialog'

type EditMode = 'view' | 'edit'

export function ProfilePage() {
  const { isLoading, error, getProfile, updateProfile } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [mode, setMode] = useState<EditMode>('view')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const resendMutation = trpc.auth.resendVerificationEmail.useMutation()

  const {
    formData,
    setFormData,
    errors,
    handleInputChange,
    handleSubmit,
    isSubmitting,
  } = useFormValidation<TUpdateUserInput>(
    {
      fullName: '',
      email: '',
      phone: '',
      age: 0,
    },
    updateUserSchema
  )

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const userProfile = await getProfile()
      setProfile(userProfile)
      setFormData({
        fullName: userProfile.fullName,
        email: userProfile.email,
        phone: userProfile.phone,
        age: userProfile.age,
      })
    } catch (err) {
      console.error('Failed to load profile:', err)
    }
  }

  const handleEditClick = () => {
    setMode('edit')
    setSuccessMessage(null)
  }

  const handleCancelClick = () => {
    setMode('view')
    setSuccessMessage(null)
    // Reset form to original profile values
    if (profile) {
      setFormData({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        age: profile.age,
      })
    }
  }

  const onSubmit = async (data: TUpdateUserInput) => {
    if (!profile) return

    const updates: TUpdateUserInput = {}
    if (data.fullName !== profile.fullName) updates.fullName = data.fullName
    if (data.phone !== profile.phone) updates.phone = data.phone
    if (data.age !== profile.age) updates.age = data.age

    if (Object.keys(updates).length === 0) {
      setSuccessMessage('No changes to save')
      return
    }

    const updatedProfile = await updateProfile(updates)
    setProfile(updatedProfile)
    setMode('view')
    setSuccessMessage('Profile updated successfully!')
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleFormInputChange = (
    field: keyof TUpdateUserInput,
    value: string | number
  ) => {
    handleInputChange(field, value)
    setSuccessMessage(null)
  }

  const handleEmailChangeSuccess = async () => {
    setSuccessMessage('Email changed successfully!')
    setTimeout(() => setSuccessMessage(null), 3000)
    await loadProfile()
  }

  if (isLoading && !profile) {
    return (
      <AppLayout showSidebar>
        <LoadingSpinner size="lg" text="Loading profile..." fullScreen />
      </AppLayout>
    )
  }

  if (error && !profile) {
    return (
      <AppLayout showSidebar>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                <p>Failed to load profile: {error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4"
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout showSidebar>
      <div className="space-y-6 md:space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground text-base md:text-lg mt-1">
            Manage your account information and preferences
          </p>
        </div>

        {!profile?.emailVerified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Email not verified
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Please verify your email to unlock all features
                </p>
              </div>
              <Button
                onClick={() => {
                  resendMutation.mutate(undefined, {
                    onSuccess: () => {
                      alert('Verification email sent!')
                    },
                    onError: error => {
                      alert(error.message)
                    },
                  })
                }}
                disabled={resendMutation.isPending}
                size="sm"
              >
                {resendMutation.isPending ? 'Sending...' : 'Resend Email'}
              </Button>
            </div>
          </div>
        )}

        {profile?.emailVerified && (
          <div className="flex items-center gap-2 text-green-600 text-sm mb-4">
            <span>✓</span>
            <span>Email verified</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">
            {successMessage}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  {mode === 'view'
                    ? 'View your personal details'
                    : 'Update your personal details'}
                </CardDescription>
              </div>
              {mode === 'view' && (
                <Button onClick={handleEditClick} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {mode === 'view' ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Full Name
                    </Label>
                    <p className="text-base font-medium mt-1">
                      {profile?.fullName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Phone Number
                    </Label>
                    <p className="text-base font-medium mt-1">
                      {profile?.phone || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Age</Label>
                    <p className="text-base font-medium mt-1">
                      {profile?.age || 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Email Address
                    </Label>
                    <p className="text-base font-medium mt-1">
                      {profile?.email}
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsEmailDialogOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Change Email
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  handleSubmit(onSubmit)
                }}
                className="space-y-5"
              >
                <ErrorMessage message={errors.general} />

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-base font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName || ''}
                      onChange={e =>
                        handleFormInputChange('fullName', e.target.value)
                      }
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone || ''}
                      onChange={e =>
                        handleFormInputChange('phone', e.target.value)
                      }
                      className={errors.phone ? 'border-destructive' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-base font-medium">
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter your age"
                      value={formData.age || ''}
                      onChange={e =>
                        handleFormInputChange(
                          'age',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className={errors.age ? 'border-destructive' : ''}
                      min="13"
                      max="120"
                    />
                    {errors.age && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.age}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelClick}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {profile && (
        <ChangeEmailDialog
          open={isEmailDialogOpen}
          onOpenChange={setIsEmailDialogOpen}
          onSuccess={handleEmailChangeSuccess}
          currentEmail={profile.email}
        />
      )}
    </AppLayout>
  )
}
