export const mockStripe = {
    checkout: {
        sessions: {
            create: jest.fn()
        }
    },
    billingPortal: {
        sessions: {
            create: jest.fn()
        }
    }
}

export const mockCheckoutSessionResponse = {
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/pay/cs_test_123'
}

export const mockPortalSessionResponse = {
    url: 'https://billing.stripe.com/session/test_123'
}

export const setupStripeMocks = () => {
    mockStripe.checkout.sessions.create.mockResolvedValue(mockCheckoutSessionResponse)
    mockStripe.billingPortal.sessions.create.mockResolvedValue(mockPortalSessionResponse)
}

export const resetStripeMocks = () => {
    jest.clearAllMocks()
}