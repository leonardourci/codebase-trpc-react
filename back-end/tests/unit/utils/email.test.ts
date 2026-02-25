// Unmock the module so we test the real implementation
jest.unmock('../../../src/utils/email')

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

jest.mock('../../../src/utils/global-config', () => ({
	__esModule: true,
	default: {
		resendApiKey: 're_test_fake_api_key',
		resendFromEmail: 'test@example.com',
		appUrl: 'http://localhost:5173'
	}
}))

import {
	sendEmail,
	sendVerificationEmail,
	sendPasswordResetEmail,
	generateSixDigitsVerificationCode,
	sendEmailChangeCode,
	VERIFICATION_CODE_MIN,
	VERIFICATION_CODE_MAX
} from '../../../src/utils/email'

describe('Email Utils', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('sendEmail', () => {
		it('should send email successfully via Resend API', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ id: 'email-123' })
			})

			const result = await sendEmail({
				to: 'user@example.com',
				subject: 'Test Subject',
				html: '<p>Hello</p>'
			})

			expect(result).toEqual({ id: 'email-123' })
			expect(mockFetch).toHaveBeenCalledWith('https://api.resend.com/emails', {
				method: 'POST',
				headers: {
					Authorization: 'Bearer re_test_fake_api_key',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					from: 'test@example.com',
					to: 'user@example.com',
					subject: 'Test Subject',
					html: '<p>Hello</p>'
				})
			})
		})

		it('should throw error when API returns error with message', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				statusText: 'Bad Request',
				json: () => Promise.resolve({ message: 'Invalid API key' })
			})

			await expect(sendEmail({ to: 'user@example.com', subject: 'Test', html: '<p>Hi</p>' })).rejects.toThrow('Resend API error: Invalid API key')
		})

		it('should throw error with statusText when json parsing fails', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				statusText: 'Internal Server Error',
				json: () => Promise.reject(new Error('parse error'))
			})

			await expect(sendEmail({ to: 'user@example.com', subject: 'Test', html: '<p>Hi</p>' })).rejects.toThrow('Resend API error: Unknown error')
		})

		it('should fall back to statusText when error message is empty', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				statusText: 'Forbidden',
				json: () => Promise.resolve({ message: '' })
			})

			await expect(sendEmail({ to: 'user@example.com', subject: 'Test', html: '<p>Hi</p>' })).rejects.toThrow('Resend API error: Forbidden')
		})
	})

	describe('sendVerificationEmail', () => {
		it('should send verification email with correct content', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ id: 'email-123' })
			})

			await sendVerificationEmail({
				to: 'user@example.com',
				fullName: 'John Doe',
				verificationToken: 'abc123'
			})

			expect(mockFetch).toHaveBeenCalledWith(
				'https://api.resend.com/emails',
				expect.objectContaining({
					method: 'POST',
					body: expect.stringContaining('Verify your email address')
				})
			)

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
			expect(callBody.to).toBe('user@example.com')
			expect(callBody.subject).toBe('Verify your email address')
			expect(callBody.html).toContain('Welcome John Doe')
			expect(callBody.html).toContain('http://localhost:5173/verify-email?token=abc123')
		})

		it('should throw CustomError when sendEmail fails', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'))

			await expect(
				sendVerificationEmail({
					to: 'user@example.com',
					fullName: 'John Doe',
					verificationToken: 'abc123'
				})
			).rejects.toThrow('Failed to send verification email')
		})
	})

	describe('sendPasswordResetEmail', () => {
		it('should send password reset email with correct content', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ id: 'email-456' })
			})

			await sendPasswordResetEmail({
				to: 'user@example.com',
				fullName: 'Jane Doe',
				resetToken: 'reset-xyz'
			})

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
			expect(callBody.to).toBe('user@example.com')
			expect(callBody.subject).toBe('Reset your password')
			expect(callBody.html).toContain('Hi Jane Doe')
			expect(callBody.html).toContain('http://localhost:5173/reset-password?token=reset-xyz')
		})

		it('should throw CustomError when sendEmail fails', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'))

			await expect(
				sendPasswordResetEmail({
					to: 'user@example.com',
					fullName: 'Jane Doe',
					resetToken: 'reset-xyz'
				})
			).rejects.toThrow('Failed to send password reset email')
		})
	})

	describe('generateSixDigitsVerificationCode', () => {
		it('should generate a 6-digit string', () => {
			const code = generateSixDigitsVerificationCode()
			expect(code).toMatch(/^\d{6}$/)
		})

		it('should generate codes within valid range', () => {
			for (let i = 0; i < 100; i++) {
				const code = parseInt(generateSixDigitsVerificationCode())
				expect(code).toBeGreaterThanOrEqual(VERIFICATION_CODE_MIN)
				expect(code).toBeLessThanOrEqual(VERIFICATION_CODE_MAX)
			}
		})
	})

	describe('sendEmailChangeCode', () => {
		it('should send email change verification code', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ id: 'email-789' })
			})

			await sendEmailChangeCode({
				to: 'new@example.com',
				fullName: 'Test User',
				code: '654321'
			})

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
			expect(callBody.to).toBe('new@example.com')
			expect(callBody.subject).toBe('Verify your new email address')
			expect(callBody.html).toContain('Hi Test User')
			expect(callBody.html).toContain('654321')
		})

		it('should throw CustomError when sendEmail fails', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'))

			await expect(
				sendEmailChangeCode({
					to: 'new@example.com',
					fullName: 'Test User',
					code: '654321'
				})
			).rejects.toThrow('Failed to send verification code')
		})
	})
})
