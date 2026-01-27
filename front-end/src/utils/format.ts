export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')

    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }

    // Format as +X (XXX) XXX-XXXX for international numbers starting with 1
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }

    return phone
}

export const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

export const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export const formatCurrency = (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
    }).format(amount)
}

export const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
}

export const formatTitle = (str: string): string => {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
}

export const formatInitials = (fullName: string): string => {
    return fullName
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2)
}

export const maskEmail = (email: string): string => {
    if (!email) return ''

    const [localPart, domain] = email.split('@')
    if (!localPart || !domain) return email

    const firstTwoChars = localPart.slice(0, Math.min(2, localPart.length))
    const lastThreeChars = localPart.length > 5
        ? localPart.slice(-3)
        : ''

    const masked = lastThreeChars
        ? `${firstTwoChars}****${lastThreeChars}@${domain}`
        : `${firstTwoChars}****@${domain}`

    return masked
}

export const maskPhone = (phone: string): string => {
    if (!phone) return ''

    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length < 6) return phone

    const firstThreeChars = digitsOnly.slice(0, 3)
    const lastThreeChars = digitsOnly.slice(-3)

    return `${firstThreeChars}****${lastThreeChars}`
}