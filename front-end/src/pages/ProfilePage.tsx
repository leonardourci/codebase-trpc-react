import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { AppLayout } from '@/components/layout/AppLayout'
import { useUser } from '@/hooks/useUser'
import { useFormValidation } from '@/hooks/useFormValidation'
import type { IUserProfile, TUpdateUserInput } from '@/types/user'
import { User, Save } from 'lucide-react'
import { updateUserSchema } from '@/validations/user.schemas'
import { maskEmail, maskPhone } from '@/utils/format'

export function ProfilePage() {
    const { isLoading, error, getProfile, updateProfile } = useUser()
    const [profile, setProfile] = useState<IUserProfile | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
            age: 0
        },
        updateUserSchema
    )

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const userProfile = await getProfile()
                setProfile(userProfile)
                setFormData({
                    fullName: userProfile.fullName,
                    email: userProfile.email,
                    phone: userProfile.phone,
                    age: userProfile.age
                })
            } catch (err) {
                console.error('Failed to load profile:', err)
            }
        }

        loadProfile()
    }, [getProfile, setFormData])

    const onSubmit = async (data: TUpdateUserInput) => {
        const updates: TUpdateUserInput = {}
        if (data.fullName !== profile?.fullName) updates.fullName = data.fullName
        if (data.email !== profile?.email) updates.email = data.email
        if (data.phone !== profile?.phone) updates.phone = data.phone
        if (data.age !== profile?.age) updates.age = data.age

        if (Object.keys(updates).length === 0) {
            setSuccessMessage('No changes to save')
            return
        }

        const updatedProfile = await updateProfile(updates)
        setProfile(updatedProfile)
        setSuccessMessage('Profile updated successfully!')
    }

    const handleFormInputChange = (field: keyof TUpdateUserInput, value: string | number) => {
        handleInputChange(field, value)
        setSuccessMessage(null)
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
                    <p className="text-muted-foreground text-base md:text-lg mt-1">Manage your account information and preferences</p>
                </div>

                <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                    <User className="h-5 w-5 text-primary" />
                                    Personal Information
                                </CardTitle>
                                <CardDescription>
                                    Update your personal details and contact information
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={(e) => {
                                    e.preventDefault()
                                    handleSubmit(onSubmit)
                                }} className="space-y-5">
                                    <ErrorMessage message={errors.general} />

                                    {successMessage && (
                                        <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">
                                            {successMessage}
                                        </div>
                                    )}

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
                                                onChange={(e) => handleFormInputChange('fullName', e.target.value)}
                                                className={errors.fullName ? 'border-destructive' : ''}
                                            />
                                            {errors.fullName && (
                                                <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-base font-medium">
                                                Email Address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="Enter your email"
                                                value={maskEmail(formData.email || '')}
                                                onChange={(e) => handleFormInputChange('email', e.target.value)}
                                                className={errors.email ? 'border-destructive' : ''}
                                            />
                                            {errors.email && (
                                                <p className="text-sm text-destructive mt-1">{errors.email}</p>
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
                                                value={maskPhone(formData.phone || '')}
                                                onChange={(e) => handleFormInputChange('phone', e.target.value)}
                                                className={errors.phone ? 'border-destructive' : ''}
                                            />
                                            {errors.phone && (
                                                <p className="text-sm text-destructive mt-1">{errors.phone}</p>
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
                                                onChange={(e) => handleFormInputChange('age', parseInt(e.target.value) || 0)}
                                                className={errors.age ? 'border-destructive' : ''}
                                                min="13"
                                                max="120"
                                            />
                                            {errors.age && (
                                                <p className="text-sm text-destructive mt-1">{errors.age}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex items-center gap-2"
                                            size="lg"
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
                            </CardContent>
                        </Card>
            </div>
        </AppLayout>
    )
}
