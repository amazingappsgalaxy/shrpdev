# Supabase Authentication Setup Guide

This guide covers the necessary configuration steps in the Supabase Dashboard to enable Google Sign-In and Email Notifications (including Password Reset).

## 1. Google Sign-In Configuration

To enable Google Sign-In, you need to configure the Google provider in Supabase and set up OAuth credentials in the Google Cloud Console.

### Step 1: Get Google Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services** > **Credentials**.
4. Click **Create Credentials** > **OAuth client ID**.
5. Select **Web application** as the application type.
6. Name your OAuth client (e.g., "Sharpii Auth").
7. **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local development)
   - `https://your-production-domain.com` (for production)
8. **Authorized redirect URIs**:
   - `https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/auth/v1/callback`
   - You can find your specific redirect URL in the Supabase Dashboard (Authentication > Providers > Google).
9. Click **Create** and copy the **Client ID** and **Client Secret**.

### Step 2: Configure Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** > **Providers**.
3. Select **Google** from the list.
4. Toggle **Enable Google**.
5. Paste the **Client ID** and **Client Secret** you obtained from Google.
6. Click **Save**.

### Step 3: Add Redirect URLs
1. Navigate to **Authentication** > **URL Configuration**.
2. **Site URL**: Set this to your production URL calling (e.g., `https://sharpii.ai`).
3. **Redirect URLs**: Add the following based on your environments:
   - `http://localhost:3000/app/auth/callback` (Local)
   - `https://sharpii.ai/app/auth/callback` (Production)
   - `http://localhost:3000/app/reset-password` (Optional, direct links)
   - `https://sharpii.ai/app/reset-password`

## 2. Email Notifications (Password Reset)

We have implemented a password reset flow that redirects users to a specific page to set their new password. You need to ensure the Email Templates in Supabase point to the correct callback.

### Step 1: Configure Email Provider
1. Navigate to **Authentication** > **Email Settings**.
2. Ensure **Enable Email Signup** is toggled ON.
3. (Optional) Configure your custom SMTP server for better deliverability in production. The default Supabase email service has strict limits.

### Step 2: Update Email Templates
1. Navigate to **Authentication** > **Email Templates**.

#### **Reset Password Template**
Modify the `{{ .ConfirmationURL }}` to ensure it redirects correctly. By default, our code sends a `redirectTo` parameter, but it's good practice to ensure the base settings are correct.

- **Subject**: Reset Your Password
- **Body**:
  ```html
  <h2>Reset Password</h2>
  <p>Follow this link to reset the password for your user:</p>
  <p><a href="{{ .SiteURL }}/app/auth/callback?next=/app/reset-password&type=recovery&token={{ .Token }}">Reset Password</a></p>
  ```
  *Note: Our application logic requests a specific redirect URL (`/app/auth/callback?next=/app/reset-password`), which Supabase appends as a query parameter. The standard `{{ .ConfirmationURL }}` works automatically with this providing you have allowed the Redirect URLs in step 1.3.*

#### **Confirm Signup Template**
- **Subject**: Confirm your Signup
- **Body**:
  ```html
  <h2>Confirm your signup</h2>
  <p>Follow this link to confirm your user:</p>
  <p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
  ```

## 3. Testing

1. **Google Sign-In**: Click "Continue with Google". It should redirect you to Google, then back to the app (`/app/dashboard`) on success.
2. **Password Reset**:
   - Go to Sign In.
   - Click "Or sign in with email" / wait for the view (if you are on sign up).
   - Enter your email and Click "Forgot password?".
   - Check your email inbox.
   - Click the link. It should log you in and take you to `/app/reset-password`.
   - Enter a new password.
   - You should be redirected to the dashboard.
