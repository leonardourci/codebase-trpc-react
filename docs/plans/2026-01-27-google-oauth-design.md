# Google OAuth Implementation Design

## Overview

Add Google OAuth authentication to the app, appearing in both sign-in and sign-up modals/pages. Uses popup window flow with `@react-oauth/google` library.

## Decisions Made

| Decision | Choice |
|----------|--------|
| OAuth flow | Popup window (not redirect) |
| Library | `@react-oauth/google` (frontend) + `google-auth-library` (backend) |
| User flow | Unified - same button for login/signup, auto-creates users |
| Account linking | If email exists with password, link Google to that account |
| Password for Google users | Random unusable hash (can set real password via "forgot password") |
| Security on password attempt | Generic "Invalid email or password" - no information leakage |

## Architecture

**Flow:**
1. User clicks "Continue with Google" in login/signup modal
2. `@react-oauth/google` opens popup → user authenticates with Google
3. Library returns a credential (JWT ID token from Google)
4. Frontend sends this token to backend via new tRPC endpoint
5. Backend verifies token with `google-auth-library`, extracts email/profile
6. Backend finds or creates user, links Google auth if email exists
7. Backend returns app's JWT tokens (accessToken, refreshToken)
8. Frontend stores tokens, updates auth state, closes modal

## Backend Implementation

### Database (modify `001_create_users_table.ts`)

```sql
google_id VARCHAR(255) UNIQUE  -- nullable, for Google OAuth linking
```

### Type Updates (`src/types/user.ts`)

- Add `googleId?: string` to `IUser`
- Add `googleId?: string` to `ICreateUserInput` (optional)
- Add `googleId` to `EUserDbRowKeys` and `IUserDbRow`

### Repository Updates (`user.repository.ts`)

- Add `getUserByGoogleId(googleId: string)` - new function
- Expand `getUserByEmail` to also return `googleId`
- Add `googleId` to `updateUserById` allowed fields

### New Service (`src/services/google-auth.service.ts`)

```typescript
async function authenticateWithGoogle(credential: string) {
  // 1. Verify credential with google-auth-library
  // 2. Extract email, googleId, name from payload
  // 3. Check getUserByGoogleId → if found, return user + generate tokens
  // 4. Check getUserByEmail → if found, link account via updateUserById
  // 5. If no user exists, create new user (random passwordHash)
  // 6. Return tokens
}
```

### New Router (`src/trpc/routers/google-auth.router.ts`)

Single public procedure `authenticate` that calls the service.

### Environment Variables

Add to `envs.schemas.ts`:
```typescript
GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required')
```

## Frontend Implementation

### New Dependency

```bash
npm install @react-oauth/google
```

### Provider Setup (`main.tsx` or `App.tsx`)

Wrap app with `<GoogleOAuthProvider clientId={...}>`.

### New Component (`src/components/auth/GoogleAuthButton.tsx`)

Following frontend-development-guide.md patterns:
- Uses `cva` for variants, `ComponentProps` for typing
- `data-slot="google-auth-button"`
- Handles loading state with `data-loading` attribute
- Shows Google icon + "Continue with Google" text
- On success: calls tRPC `googleAuth.authenticate` endpoint
- On success response: stores tokens, updates auth state, closes modal

### Modified Files

- `AuthModal.tsx` - Add `<GoogleAuthButton />` with divider ("or")
- `LoginPage.tsx` - Add `<GoogleAuthButton />` with divider
- `SignupPage.tsx` - Add `<GoogleAuthButton />` with divider

### Environment

Add to `front-end/.env`:
```
VITE_GOOGLE_CLIENT_ID=your-client-id
```

Add validation in `env-validation.ts`.

## Error Handling

### Frontend

| Scenario | Handling |
|----------|----------|
| User closes Google popup | Silent fail - no error shown |
| Google returns error | Toast: "Google sign-in failed. Please try again." |
| Backend verification fails | Toast: "Authentication failed. Please try again." |
| Network error | Toast: "Connection error. Please check your internet." |

### Backend

| Scenario | Handling |
|----------|----------|
| Invalid/expired Google token | tRPC error: `UNAUTHORIZED` |
| Google API unreachable | tRPC error: `INTERNAL_SERVER_ERROR`, log details |
| Database error | tRPC error: `INTERNAL_SERVER_ERROR`, log details |

## Edge Cases

| Case | Behavior |
|------|----------|
| Google user tries password login | Generic "Invalid email or password" |
| Password user uses Google (same email) | Link accounts - both methods work |
| User's Google email changes | `google_id` is source of truth - still works |
| Multiple Google accounts | Each gets separate app account |

## Security

- Google Client ID is safe to expose in frontend (designed to be public)
- Always verify Google token on backend (never trust frontend)
- `google_id` column has UNIQUE constraint
- No information leakage on login attempts

## Google Cloud Console Setup

To obtain `GOOGLE_CLIENT_ID`:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Select "Web application" as application type
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)
7. Click "Create" and copy the Client ID
8. Add to backend `.env` as `GOOGLE_CLIENT_ID`
9. Add to frontend `.env` as `VITE_GOOGLE_CLIENT_ID`

Note: You may need to configure the OAuth consent screen first if prompted.
