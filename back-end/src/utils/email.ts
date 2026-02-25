import { ISendPasswordResetEmailInput, ISendVerificationEmailInput } from '../services/email.service'
import { CustomError } from './errors'
import globalConfig from './global-config'
import { StatusCodes } from './status-codes'

export const MILLISECONDS_PER_SECOND = 1000
export const EMAIL_CHANGE_COOLDOWN_MS = 60000 // 1 minute
export const EMAIL_CHANGE_TOKEN_EXPIRATION_MINUTES = 15
export const MAX_VERIFICATION_ATTEMPTS = 5
export const VERIFICATION_CODE_MIN = 100000
export const VERIFICATION_CODE_MAX = 999999

export interface ISendEmailInput {
	to: string
	subject: string
	html: string
}

export interface ISendEmailResponse {
	id: string
}

export async function sendEmail(input: ISendEmailInput): Promise<ISendEmailResponse> {
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${globalConfig.resendApiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: globalConfig.resendFromEmail,
			to: input.to,
			subject: input.subject,
			html: input.html
		})
	})

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
		throw new Error(`Resend API error: ${errorData.message || response.statusText}`)
	}

	return response.json()
}

export async function sendVerificationEmail(input: ISendVerificationEmailInput): Promise<void> {
	const verificationUrl = `${globalConfig.appUrl}/verify-email?token=${input.verificationToken}`

	try {
		await sendEmail({
			to: input.to,
			subject: 'Verify your email address',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h1 style="color: #333;">Welcome ${input.fullName}!</h1>
					<p style="color: #666; font-size: 16px;">Thank you for signing up. Please verify your email address to unlock all features.</p>
					<p style="margin: 30px 0;">
						<a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
							Verify Email Address
						</a>
					</p>
					<p style="color: #999; font-size: 14px;">This link expires in 30 minutes.</p>
					<p style="color: #999; font-size: 12px;">If you didn't sign up for this account, you can safely ignore this email.</p>
				</div>
			`
		})
	} catch (error) {
		console.error('Failed to send verification email:', error)
		throw new CustomError('Failed to send verification email', StatusCodes.INTERNAL_SERVER_ERROR)
	}
}

export async function sendPasswordResetEmail(input: ISendPasswordResetEmailInput): Promise<void> {
	const resetUrl = `${globalConfig.appUrl}/reset-password?token=${input.resetToken}`

	try {
		await sendEmail({
			to: input.to,
			subject: 'Reset your password',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h1 style="color: #333;">Password Reset Request</h1>
					<p style="color: #666; font-size: 16px;">Hi ${input.fullName},</p>
					<p style="color: #666; font-size: 16px;">We received a request to reset your password. Click the button below to create a new password.</p>
					<p style="margin: 30px 0;">
						<a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
							Reset Password
						</a>
					</p>
					<p style="color: #999; font-size: 14px;">This link expires in 15 minutes.</p>
					<p style="color: #999; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
				</div>
			`
		})
	} catch (error) {
		console.error('Failed to send password reset email:', error)
		throw new CustomError('Failed to send password reset email', StatusCodes.INTERNAL_SERVER_ERROR)
	}
}

export function generateSixDigitsVerificationCode(): string {
	return Math.floor(VERIFICATION_CODE_MIN + Math.random() * (VERIFICATION_CODE_MAX - VERIFICATION_CODE_MIN + 1)).toString()
}

export async function sendEmailChangeCode(input: { to: string; fullName: string; code: string }): Promise<void> {
	try {
		await sendEmail({
			to: input.to,
			subject: 'Verify your new email address',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h1 style="color: #333;">Email Change Verification</h1>
					<p style="color: #666; font-size: 16px;">Hi ${input.fullName},</p>
					<p style="color: #666; font-size: 16px;">Your verification code is:</p>
					<div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 4px;">
						<span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${input.code}</span>
					</div>
					<p style="color: #999; font-size: 14px;">This code will expire in 15 minutes.</p>
					<p style="color: #999; font-size: 12px;">If you didn't request this email change, please ignore this message.</p>
				</div>
			`
		})
	} catch (error) {
		console.error('Failed to send email change code:', error)
		throw new CustomError('Failed to send verification code', StatusCodes.INTERNAL_SERVER_ERROR)
	}
}
