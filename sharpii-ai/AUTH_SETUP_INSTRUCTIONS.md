# Authentication Setup Guide

## 1. Google Sign-In Setup

To enable "Continue with Google", you need to configure it in both Google Cloud Console and Supabase.

### Step 1: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "Sharpii App").
3. Navigate to **APIs & Services** > **OAuth consent screen**.
   - Select **External**.
   - Fill in App Name, User Support Email, etc.
   - Click Save.
4. Go to **Credentials**.
   - Click **Create Credentials** > **OAuth client ID**.
   - Application Type: **Web application**.
   - **Authorized JavaScript origins**: `https://<your-project>.supabase.co` (and `http://localhost:3000` for dev).
   - **Authorized redirect URIs**: `https://<your-project>.supabase.co/auth/v1/callback`.
   - Click **Create**.
5. Copy the **Client ID** and **Client Secret**.

### Step 2: Supabase Dashboard
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication** > **Providers**.
3. Select **Google** and toggle it **ON**.
4. Paste the **Client ID** and **Client Secret** from Step 1.
5. Click **Save**.

### Step 3: Update Code
In `src/components/ui/auth-fuse.tsx`, update the Google button `onClick` handler:

```typescript
const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`
        }
    })
    if (error) toast.error(error.message)
}
```

## 2. Password Reset & Email Notifications

Supabase handles email sending automatically, but for production, you should configure a custom SMTP server.

### Email Templates
1. Go to **Supabase Dashboard** > **Authentication** > **Email Templates**.
2. You can customize the content for:
   - **Confirm Signup**: Sent when a new user signs up.
   - **Reset Password**: Sent when a user requests a password reset.
   - **Magic Link**: For passwordless login.

### Triggering Password Reset
To implement the "Forgot Password" feature in your app:

1. Create a callback route (e.g., `/app/reset-password`).
2. Update the "Forgot password?" button in `auth-fuse.tsx` to open a dialog or redirect to a reset page.
3. Call the API:

```typescript
const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://your-domain.com/app/reset-password', // Page where user sets new password
    })
}
```

### Verifying Users
By default, **Enable Email Confirmations** is ON in Supabase.
- Users will not be able to sign in until they click the link in their email.
- To disable this for testing: Go to **Authentication** > **Providers** > **Email** > Toggle **Confirm email**.
