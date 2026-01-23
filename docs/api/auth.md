# Authentication API

## Overview
Authentication endpoints for user registration, login, token management, and logout functionality.

---

## `auth.login`

**Summary:** Authenticate user with email and password  
**Use case:** User login to the application

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

### Input Example
```json
{
  "email": "user@example.com",
  "password": "mypassword123"
}
```

### Output Example
```json
{
  "user": {
    "id": "123",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## `auth.signup`

**Summary:** Register a new user account  
**Use case:** New user registration

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fullName | string | Yes | User's full name (min 3 chars) |
| email | string | Yes | User's email address |
| phone | string | Yes | User's phone number |
| password | string | Yes | User's password |
| age | number | Yes | User's age (positive integer) |

### Input Example
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securepassword123",
  "age": 25
}
```

### Output Example
```json
{
  "user": {
    "id": "124",
    "email": "john@example.com",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "age": 25
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## `auth.refresh`

**Summary:** Refresh access token using refresh token  
**Use case:** Get new access token when current one expires

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| refreshToken | string | Yes | Valid refresh token |

### Input Example
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Output Example
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## `auth.logout`

**Summary:** Logout user and revoke refresh token  
**Use case:** User logout, invalidate session

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| - | - | - | No parameters (uses authenticated user context) |

**Note:** Requires authentication (Bearer token in Authorization header)

### Input Example
```json
{}
```

### Output Example
```json
{
  "success": true
}
```

---

## Usage Notes

- All endpoints except `logout` are public
- `logout` requires valid authentication token
- Tokens should be stored securely on the client side
- Use refresh token to get new access tokens when they expire
- Email validation follows standard email format rules