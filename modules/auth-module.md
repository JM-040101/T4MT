# Authentication Module

## Purpose

The Authentication module handles user identity, account creation, login, session management, and profile updates. ThaiFightTalk uses **Supabase Auth** to simplify authentication flows and provide secure, scalable user management.

## Key Features

### User Signup
- Email + password authentication
- OAuth providers: Google, Apple (social sign-in)
- "Continue as Guest" option (limited features, data lost on logout)
- Email verification required before full access
- Automatic profile creation on signup

### User Login
- Email + password
- OAuth (Google, Apple)
- "Remember me" checkbox (extends session duration)
- Forgot password flow (email-based password reset)
- Session cookies (HTTP-only, secure)

### Session Management
- JWT-based authentication (Supabase handles token issuance)
- Access tokens (short-lived, 1 hour)
- Refresh tokens (long-lived, 7 days)
- Automatic token refresh on page load
- Logout clears all session data

### Profile Management
- Update display name
- Change email (requires re-verification)
- Change password
- Upload avatar (Supabase Storage)
- Delete account (with confirmation)

### Multi-Factor Authentication (V1.5+)
- TOTP-based MFA (Google Authenticator, Authy)
- Optional for all users
- Required for gym admins (enterprise plan)

## Implementation Constraints

### Security Rules
- **Passwords must be:** 8+ characters, 1 uppercase, 1 lowercase, 1 number
- **Email verification required** before accessing lessons
- **Session tokens stored in HTTP-only cookies** (not localStorage)
- **HTTPS only** in production
- **Rate limiting:** 5 login attempts per 15 minutes per IP

### Supabase Auth Configuration
```javascript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### OAuth Provider Setup
1. **Google OAuth:**
   - Enable Google provider in Supabase dashboard
   - Create OAuth credentials in Google Cloud Console
   - Add authorized redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`
   - Store client ID in Supabase settings

2. **Apple OAuth:**
   - Enable Apple provider in Supabase dashboard
   - Create App ID in Apple Developer portal
   - Configure service ID and private key
   - Add redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`

### User Profile Auto-Creation
When a user signs up, automatically create a profile record:
```sql
-- Trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## State Flow

### Signup Flow
```
1. User visits /signup
2. Enters email + password (or clicks OAuth button)
3. Supabase creates auth.users record
4. Trigger creates public.users profile
5. Email verification sent (if email/password)
6. User redirected to /verify-email or /onboarding (if OAuth)
7. After verification, user redirected to /dashboard
```

### Login Flow
```
1. User visits /login
2. Enters credentials or clicks OAuth
3. Supabase validates credentials
4. JWT access token + refresh token issued
5. Tokens stored in HTTP-only cookies
6. User redirected to /dashboard
7. Middleware checks auth on every route
```

### Session Persistence
```
1. User closes browser
2. Refresh token remains valid (7 days)
3. User returns to site
4. Supabase client auto-refreshes access token
5. User sees dashboard without re-login
```

### Password Reset Flow
```
1. User clicks "Forgot password" on /login
2. Redirected to /reset-password
3. Enters email
4. Supabase sends reset email
5. User clicks link in email
6. Redirected to /reset-password?token=xxx
7. Enters new password
8. Supabase updates password
9. User redirected to /login
```

## API Routes

### POST /api/auth/signup
**Purpose:** Create new user account

**Body:**
```typescript
{
  email: string;
  password: string;
  displayName?: string;
}
```

**Response:**
```typescript
{
  user: User | null;
  session: Session | null;
  error: Error | null;
}
```

**Logic:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: displayName
    }
  }
})
```

### POST /api/auth/login
**Purpose:** Authenticate user

**Body:**
```typescript
{
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

**Response:**
```typescript
{
  user: User | null;
  session: Session | null;
  error: Error | null;
}
```

### POST /api/auth/logout
**Purpose:** End user session

**Response:**
```typescript
{
  success: boolean;
}
```

**Logic:**
```typescript
await supabase.auth.signOut()
```

### POST /api/auth/reset-password
**Purpose:** Send password reset email

**Body:**
```typescript
{
  email: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  error: Error | null;
}
```

## Frontend Components

### LoginForm Component
```typescript
// components/auth/LoginForm.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
    } else {
      window.location.href = '/dashboard'
    }

    setLoading(false)
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) alert(error.message)
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Log In'}
      </button>
      <button type="button" onClick={handleGoogleLogin}>
        Sign in with Google
      </button>
    </form>
  )
}
```

### SignupForm Component
Similar structure to LoginForm, using `supabase.auth.signUp()`

### AuthProvider (Context)
```typescript
// components/auth/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

const AuthContext = createContext<{
  user: User | null;
  session: Session | null;
  loading: boolean;
}>({
  user: null,
  session: null,
  loading: true
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

## Middleware (Route Protection)
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session }
  } = await supabase.auth.getSession()

  // Redirect unauthenticated users to /login
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect authenticated users away from /login
  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup']
}
```

## RLS Policies (Database Security)

### users Table
```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

## Testing Checklist

- [ ] User can sign up with email/password
- [ ] Email verification email is sent
- [ ] User cannot access dashboard before verification
- [ ] User can log in after verification
- [ ] Google OAuth flow works
- [ ] Apple OAuth flow works
- [ ] "Remember me" extends session duration
- [ ] Password reset email is sent
- [ ] User can reset password via email link
- [ ] User can update display name
- [ ] User can change password
- [ ] User can delete account
- [ ] Session persists across browser restarts
- [ ] Logout clears all session data
- [ ] Rate limiting prevents brute force attacks

## Security Considerations

### Password Security
- Never store passwords in plain text (Supabase handles hashing)
- Use bcrypt with 10+ salt rounds (Supabase default)
- Require strong passwords (8+ chars, mixed case, number)
- Implement password strength meter on frontend

### Session Security
- Store tokens in HTTP-only cookies (not localStorage)
- Set SameSite=Lax on cookies
- Use HTTPS in production
- Rotate refresh tokens on use
- Invalidate all sessions on password change

### OAuth Security
- Validate OAuth state parameter
- Use PKCE flow for mobile apps (future)
- Never expose OAuth client secrets in frontend

### Anti-Abuse Measures
- Rate limit login attempts (5 per 15 min per IP)
- Implement CAPTCHA after 3 failed attempts (future)
- Log all authentication events
- Block disposable email domains (optional)

## Future Enhancements (V1.5+)

- Multi-factor authentication (TOTP)
- Passkey support (WebAuthn)
- Social login: Facebook, Twitter
- Phone number authentication
- Single Sign-On (SSO) for enterprise gyms
- Account recovery via security questions

---

**References:**
- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware

