import globalConfig from '../utils/global-config'
import { CustomError } from '../utils/errors'
import { EStatusCodes } from '../utils/status-codes'
import { sendEmail } from '../utils/email-client'
import Logger from '../utils/logger'

const logger = new Logger({ source: 'email.service' })

export interface ISendVerificationEmailInput {
	to: string
	fullName: string
	verificationToken: string
}

export interface ISendPasswordResetEmailInput {
	to: string
	fullName: string
	resetToken: string
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
		logger.error('Failed to send verification email', { error })
		throw new CustomError('Failed to send verification email', EStatusCodes.INTERNAL_SERVER_ERROR)
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
		logger.error('Failed to send password reset email', { error })
		throw new CustomError('Failed to send password reset email', EStatusCodes.INTERNAL_SERVER_ERROR)
	}
}
