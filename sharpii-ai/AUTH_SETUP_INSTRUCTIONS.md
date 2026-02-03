# Authentication Setup Instructions

## 1. Google Sign-In Setup

To enable "Continue with Google", you need to configure the Google Provider in Supabase.

1.  **Google Cloud Console**:
    *   Go to [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a New Project.
    *   Go to **APIs & Services** > **OAuth consent screen**. Set it to "External" and fill in required fields.
    *   Go to **Credentials** > **Create Credentials** > **OAuth client ID**.
    *   Application Type: **Web application**.
    *   **Authorized redirect URIs**: Add your Supabase Callback URL. It looks like:
        `https://<your-project-id>.supabase.co/auth/v1/callback`
    *   Copy the **Client ID** and **Client Secret**.

2.  **Supabase Dashboard**:
    *   Go to **Authentication** > **Providers** > **Google**.
    *   Enable **Google**.
    *   Paste the **Client ID** and **Client Secret**.
    *   Click **Save**.

3.  **Frontend Code Update**:
    *   In `auth-fuse.tsx`, update the Google Button's `onClick` handler:
    ```typescript
    const handleGoogleLogin = async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    }
    ```

## 2. Forgot Password & Email Verification

To enable these features, you use the standard Supabase Auth API.

### Essential Settings (Supabase Dashboard)
*   Go to **Authentication** > **URL Configuration**.
*   **Site URL**: Set to your production URL (e.g., `https://sharpii.ai`).
*   **Redirect URLs**: Add `http://localhost:3000/**` or `3005` for local dev.

### Implementation Guide

**a. Forgot Password (Request Reset)**
Create a form that takes an email and calls:
```typescript
const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://your-site.com/app/reset-password',
})
```

**b. Update Password (After Reset Click)**
On the `/app/reset-password` page, allow the user to enter a new password and call:
```typescript
const { data, error } = await supabase.auth.updateUser({
  password: newPassword
})
```

**c. Email Verification**
*   Supabase handles this automatically if "Confirm email" is enabled in **Authentication** > **Providers** > **Email**.
*   Users will receive an email link.
*   Clicking it verifies their account.
