"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signIn as simpleSignIn, signUp as simpleSignUp } from '@/lib/auth-client-simple'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop && textArray.length > 1) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    text,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input dark:border-input/50 bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary-foreground/60 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
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
          "flex h-10 w-full rounded-lg border border-input dark:border-input/50 bg-background px-3 py-3 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  // Removed Supabase resetPassword usage
  const router = useRouter();

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Input validation
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    
    if (!password) {
      toast.error('Please enter your password');
      return;
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);

    try {
      await simpleSignIn(email.trim().toLowerCase(), password);

      toast.success('Successfully signed in!');

      // Check for stored plan after successful login
      const storedPlan = typeof window !== 'undefined' ? localStorage.getItem('selectedPlan') : null;

      if (storedPlan) {
        router.replace('/#pricing-section');
        return;
      }

      // Default dashboard redirect - use replace to avoid back button issues
      router.replace('/app/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
      // Handle network and unexpected errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else {
        const message = (error as any)?.message || 'Failed to sign in. Please try again.';
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-balance text-sm text-muted-foreground">Enter your credentials to sign in</p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="m@example.com" 
            required 
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <PasswordInput 
          name="password" 
          label="Password" 
          required 
          autoComplete="current-password" 
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <Button type="submit" variant="outline" className="mt-2" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
      
      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Reset Password</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="m@example.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                  }}
                  disabled={isResettingPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    if (!forgotPasswordEmail.trim()) {
                      toast.error('Please enter your email address');
                      return;
                    }
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(forgotPasswordEmail.trim())) {
                      toast.error('Please enter a valid email address');
                      return;
                    }
                    setIsResettingPassword(true);
                    try {
                      await new Promise((res) => setTimeout(res, 600));
                      toast.info('If an account exists for this email, you will receive a reset link shortly.');
                      setShowForgotPassword(false);
                      setForgotPasswordEmail('');
                    } catch (error) {
                      console.error('Reset password placeholder error:', error);
                      toast.error('An unexpected error occurred. Please try again.');
                    } finally {
                      setIsResettingPassword(false);
                    }
                  }}
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function SignUpForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Using custom simple auth API for signup
   const router = useRouter();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Input validation
    if (!formData.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    
    if (!formData.password) {
      toast.error('Please enter a password');
      return;
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Password strength validation
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    // Check for common weak passwords
    const weakPasswords = ['password', '12345678', 'qwerty123', 'password123'];
    if (weakPasswords.includes(formData.password.toLowerCase())) {
      toast.error('Please choose a stronger password');
      return;
    }
    
    setIsLoading(true);

    try {
      await simpleSignUp(
        formData.email.trim().toLowerCase(),
        formData.password,
        formData.name.trim()
      );
      toast.success('Account created successfully! Welcome to Sharpii.ai');
      
      // Check for stored plan after successful signup
      const selectedPlan = typeof window !== 'undefined' ? localStorage.getItem('selectedPlan') : null;
      
      if (selectedPlan) {
        router.replace('/#pricing-section');
        return;
      }

      // Default dashboard redirect - use replace to avoid back button issues
      router.replace('/app/dashboard');
    } catch (error) {
      console.error('Sign up error:', error);
      // Handle specific error types
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (error instanceof Error) {
        // Show the actual error message for better debugging
        toast.error(error.message || 'An unexpected error occurred. Please try again.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">Enter your details below to sign up</p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-1">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name" 
            name="name" 
            type="text" 
            placeholder="John Doe" 
            required 
            autoComplete="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="m@example.com" 
            required 
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
        <PasswordInput 
          name="password" 
          label="Password" 
          required 
          autoComplete="new-password" 
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
        />
        <Button type="submit" variant="outline" className="mt-2" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </Button>
      </div>
    </form>
  );
}

function AuthFormContainer({ isSignIn, onToggle }: { isSignIn: boolean; onToggle: () => void; }) {
    return (
        <div className="mx-auto grid w-[350px] gap-2">
            {isSignIn ? <SignInForm /> : <SignUpForm />}
            <div className="text-center text-sm">
                {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
                <Button variant="link" className="pl-1 text-foreground" onClick={onToggle}>
                    {isSignIn ? "Sign up" : "Sign in"}
                </Button>
            </div>
            <SocialSignIn />
        </div>
    );
}

function SocialSignIn() {
    return (
        <div className="grid gap-4 mt-4">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>
            <Button variant="outline" type="button" onClick={() => console.log("UI: Google button clicked")}>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" className="mr-2 h-4 w-4" />
                Continue with Google
            </Button>
        </div>
    )
}

interface AuthContentProps {
    image?: {
        src: string;
        alt: string;
    };
    quote?: {
        text: string;
        author: string;
    }
}

interface AuthUIProps {
    signInContent?: AuthContentProps;
    signUpContent?: AuthContentProps;
}

const defaultSignInContent = {
    image: {
        src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80",
        alt: "A beautiful modern office space for sign-in"
    },
    quote: {
        text: "Welcome Back! The journey continues.",
        author: "Sharpii AI"
    }
};

const defaultSignUpContent = {
    image: {
        src: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1000&q=80",
        alt: "A vibrant, modern space for new beginnings"
    },
    quote: {
        text: "Create an account. A new chapter awaits.",
        author: "Sharpii AI"
    }
};

export function AuthUI({ signInContent = {}, signUpContent = {} }: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(true);
  const router = useRouter();
  const toggleForm = () => setIsSignIn((prev) => !prev);

  // Handle password reset URL fragments
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(hash.substring(1));
      const accessToken = urlParams.get('access_token');
      const type = urlParams.get('type');
      
      if (accessToken && type === 'recovery') {
        // This is a password reset link, redirect to reset password page
        toast.info('Redirecting to password reset page...');
        router.push('/app/reset-password');
        return;
      }
    }
  }, [router]);

  const finalSignInContent = {
      image: { ...defaultSignInContent.image, ...signInContent.image },
      quote: { ...defaultSignInContent.quote, ...signInContent.quote },
  };
  const finalSignUpContent = {
      image: { ...defaultSignUpContent.image, ...signUpContent.image },
      quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
  };

  const currentContent = isSignIn ? finalSignInContent : finalSignUpContent;

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      <div className="flex items-center justify-center py-12">
        <AuthFormContainer isSignIn={isSignIn} onToggle={toggleForm} />
      </div>
      <div className="hidden bg-muted md:block relative overflow-hidden">
        <img
          src={currentContent.image.src}
          alt={currentContent.image.alt}
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
            <blockquote className="space-y-2">
              <p className="text-lg text-white font-medium">
                  <Typewriter
                      key={currentContent.quote.text}
                      text={currentContent.quote.text}
                      speed={60}
                  />
              </p>
              <cite className="block text-sm font-light text-muted-foreground not-italic text-white/80">
                  — {currentContent.quote.author}
              </cite>
            </blockquote>
        </div>
      </div>
    </div>
  );
}