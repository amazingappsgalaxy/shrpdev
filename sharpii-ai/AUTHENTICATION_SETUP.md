# Authentication Setup Instructions

## 🚨 Critical Fix Required: RLS Policy Missing

Your sign-up is failing because the Supabase users table is missing the INSERT policy for Row Level Security (RLS).

### Step 1: Fix RLS Policy (REQUIRED)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ftndokqxuumwxsbwatbo/sql
2. In the SQL Editor, run this command:

```sql
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
```

3. Click "Run" to execute the SQL

**This will immediately fix your sign-up functionality!**

---

## 🧪 Testing Authentication

After fixing the RLS policy, test your authentication:

```bash
node test-auth-complete.js
```

This script will:
- ✅ Test sign-up with profile creation
- ✅ Test sign-in functionality
- ✅ Verify user profile access
- 🧹 Clean up test data automatically

---

## 🔐 Google Sign-In Integration

### Step 1: Configure Google OAuth in Supabase

1. **Go to Supabase Dashboard**:
   - Navigate to: https://supabase.com/dashboard/project/ftndokqxuumwxsbwatbo/auth/providers

2. **Enable Google Provider**:
   - Find "Google" in the list of providers
   - Toggle it to "Enabled"

3. **Get Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://ftndokqxuumwxsbwatbo.supabase.co/auth/v1/callback
     http://localhost:3002/auth/callback
     http://localhost:3003/auth/callback
     ```

4. **Configure in Supabase**:
   - Copy the Client ID and Client Secret from Google
   - Paste them in the Supabase Google provider settings
   - Save the configuration

### Step 2: Update Your Code

1. **Add Google Sign-In Button to AuthUI Component**:

```tsx
// In src/components/ui/auth-fuse.tsx, add to SocialSignIn component:

const handleGoogleSignIn = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      toast.error('Google sign-in failed: ' + error.message);
    }
  } catch (error) {
    toast.error('Google sign-in error');
  }
};

// Add this button to your SocialSignIn component:
<button
  onClick={handleGoogleSignIn}
  className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
>
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  Continue with Google
</button>
```

2. **Create Auth Callback Page**:

Create `src/app/auth/callback/page.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/providers/supabase-provider';

export default function AuthCallback() {
  const router = useRouter();
  const { supabase } = useSupabase();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/app/login?error=auth_callback_failed');
          return;
        }

        if (data.session) {
          // Create user profile if it doesn't exist
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.session.user.id)
            .single();

          if (!profile) {
            await supabase.from('users').insert({
              id: data.session.user.id,
              email: data.session.user.email!,
              name: data.session.user.user_metadata?.full_name || data.session.user.email!,
              password_hash: 'oauth_user',
              subscription_status: 'free'
            });
          }

          router.push('/app/dashboard');
        } else {
          router.push('/app/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/app/login?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  );
}
```

### Step 3: Test Google Sign-In

1. Start your development server: `npm run dev`
2. Go to http://localhost:3002/app/login
3. Click "Continue with Google"
4. Complete the Google OAuth flow
5. You should be redirected to the dashboard

---

## 🔧 Current Status

- ✅ **Auth UI**: Modern sign-in/sign-up forms implemented
- ✅ **Form Toggle**: Seamless switching between sign-in and sign-up
- ✅ **Supabase Integration**: Connected to authentication system
- ⚠️  **RLS Policy**: **NEEDS MANUAL FIX** (see Step 1 above)
- 📋 **Google Sign-In**: Ready to implement (follow steps above)

---

## 🚀 Next Steps

1. **FIRST**: Fix the RLS policy (critical for sign-up to work)
2. **TEST**: Run the authentication test script
3. **OPTIONAL**: Add Google Sign-In following the guide above
4. **VERIFY**: Test both email and Google authentication flows

---

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Verify environment variables in `.env.local`
3. Ensure Supabase project is properly configured
4. Run the test script to diagnose specific issues