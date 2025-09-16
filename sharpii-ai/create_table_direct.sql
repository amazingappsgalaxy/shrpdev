-- Direct table creation for checkout_sessions
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id text NOT NULL UNIQUE,
  payment_id text,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  plan text NOT NULL,
  billing_period text NOT NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS checkout_sessions_subscription_id_idx ON public.checkout_sessions(subscription_id);
CREATE INDEX IF NOT EXISTS checkout_sessions_user_id_idx ON public.checkout_sessions(user_id);

-- Disable RLS for now to allow webhook access
ALTER TABLE public.checkout_sessions DISABLE ROW LEVEL SECURITY;