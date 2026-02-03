"use client";

import * as React from "react";
import { useState, useId } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, ArrowRight, ArrowUpRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signIn as simpleSignIn, signUp as simpleSignUp } from '@/lib/auth-client-simple'
import { MainLogo } from '@/components/ui/main-logo'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- UI Components ---

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-400 font-sans mb-2 block"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' | 'google' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-sans";

    let variantStyles = "";
    if (variant === 'primary') {
      variantStyles = "bg-[#FFFF00] text-black hover:bg-[#FFFF00]/90 shadow-[0_0_20px_rgba(255,255,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,0,0.5)] transform hover:-translate-y-0.5";
    } else if (variant === 'outline') {
      variantStyles = "border border-zinc-800 bg-transparent hover:bg-zinc-800/50 text-white";
    } else if (variant === 'google') {
      variantStyles = "bg-white text-black hover:bg-gray-100 border border-gray-300 transform hover:-translate-y-0.5 shadow-lg";
    } else if (variant === 'ghost') {
      variantStyles = "hover:bg-zinc-800 text-zinc-400 hover:text-white";
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles, "h-12 px-6", className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white shadow-sm transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFFF00] focus-visible:border-[#FFFF00]/50 focus-visible:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 font-sans",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="grid w-full items-center gap-1.5">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 end-0 flex h-full w-12 items-center justify-center text-zinc-500 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

// --- Forms ---

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await simpleSignIn(email.trim().toLowerCase(), password);
      // Wait a moment for session to set
      await new Promise(r => setTimeout(r, 500));
      toast.success('Signed in successfully');
      router.push('/app/dashboard');
    } catch (error) {
      const message = (error as any)?.message || 'Failed to sign in.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} className="grid gap-6">
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@work.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            className="text-xs font-medium text-zinc-500 hover:text-[#FFFF00] transition-colors"
            onClick={() => toast.info('Password reset coming soon')}
          >
            Forgot password?
          </button>
        </div>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="mt-2 w-full text-black font-extrabold tracking-wide uppercase">
        {isLoading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return toast.error('Check fields');

    setIsLoading(true);
    try {
      await simpleSignUp(formData.email.trim().toLowerCase(), formData.password, formData.name.trim());
      // Wait a moment for session to set
      await new Promise(r => setTimeout(r, 500));
      toast.success('Account created successfully');
      router.push('/app/dashboard');
    } catch (error) {
      const message = (error as any)?.message || 'Sign up failed.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="grid gap-6">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          placeholder="John Doe"
          required
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="signup-email">Email address</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="name@work.com"
          required
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="signup-password">Create Password</Label>
        <PasswordInput
          id="signup-password"
          placeholder="Min 8 characters"
          required
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
        />
      </div>
      <Button type="submit" disabled={isLoading} className="mt-2 w-full text-black font-extrabold tracking-wide uppercase">
        {isLoading ? 'Creating Account...' : 'Get Started'} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}

// --- Main Auth UI ---

export function AuthUI() {
  const [isSignIn, setIsSignIn] = useState(true);
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full bg-[#030303] selection:bg-[#FFFF00] selection:text-black font-sans overflow-hidden">

      {/* Premium Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#FFFF00]/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Top Left Logo (Consistent Component) */}
      <div className="absolute top-8 left-8 z-50">
        <MainLogo />
      </div>

      <div className="container relative z-10 flex min-h-screen items-center justify-end px-4 md:px-12 lg:px-24">

        {/* Main Content Area */}
        <div className="w-full max-w-[450px] flex flex-col gap-8">

          {/* Login Card - Glassmorphism Premium */}
          <div className="glass-premium bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl ring-1 ring-white/5">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tighter">
                {isSignIn ? "Welcome Back" : "Start your journey"}
              </h2>
              <p className="text-zinc-400 text-base leading-relaxed">
                {isSignIn ? "Enter your credentials to access your dashboard." : "Join thousands of creators enhancing their content with AI."}
              </p>
            </div>

            {/* Premium Toggle */}
            <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 mb-8">
              <button
                onClick={() => setIsSignIn(true)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300",
                  isSignIn
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignIn(false)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300",
                  !isSignIn
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Sign Up
              </button>
            </div>

            {isSignIn ? <SignInForm /> : <SignUpForm />}

            {/* Google Auth - Separator */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0c0c0c] px-2 text-zinc-500 font-bold tracking-wider">Or continue with</span>
              </div>
            </div>

            <Button variant="google" type="button" onClick={() => console.log("Google Auth")} className="w-full">
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </Button>
          </div>

          {/* Premium Demo Button - Outside Card */}
          <div className="flex justify-end gap-4 items-center">
            <p className="text-sm text-zinc-500 font-medium hidden md:block">
              Just asking around?
            </p>
            <button
              onClick={() => router.push('/app/dashboard?demo=true')}
              className="group relative flex items-center gap-3 px-6 py-3 rounded-full bg-black/40 border border-white/10 hover:border-[#FFFF00]/50 hover:bg-white/5 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#FFFF00]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">
                Enter Demo App
              </span>
              <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-white/10 group-hover:bg-[#FFFF00] transition-all duration-300">
                <ArrowUpRight className="w-3.5 h-3.5 text-white group-hover:text-black transition-colors" />
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}