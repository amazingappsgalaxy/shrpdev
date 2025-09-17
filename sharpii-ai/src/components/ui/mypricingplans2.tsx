"use client"

import * as React from "react"
import { motion, Transition } from "framer-motion"
import { Check, ArrowRight, Star, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { PRICING_PLANS, PRICING_CONFIG } from "@/lib/pricing-config"
import { useSession } from "@/lib/auth-client-simple"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface MyPricingPlans2Props {
  showHeader?: boolean
  title?: string
  subtitle?: string
  className?: string
}

type FREQUENCY = 'monthly' | 'yearly'
const frequencies: FREQUENCY[] = ['monthly', 'yearly']

// Enhanced animation variants for premium feel
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
}

const cardHover = {
  scale: 1.02,
  y: -8,
  transition: { duration: 0.04, ease: [0.4, 0, 0.2, 1] }
}

type PricingFrequencyToggleProps = React.ComponentProps<'div'> & {
  frequency: FREQUENCY
  setFrequency: React.Dispatch<React.SetStateAction<FREQUENCY>>
}

function PricingFrequencyToggle({
  frequency,
  setFrequency,
  ...props
}: PricingFrequencyToggleProps) {
  const discountPercent = Math.round((PRICING_CONFIG.yearlyDiscount ?? 0) * 100)

  return (
    <div
      className={cn(
        'bg-gray-100 dark:bg-gray-800/60 mx-auto flex w-fit rounded-lg border border-gray-200 dark:border-gray-700/60 p-1 shadow-sm',
        props.className,
      )}
      {...props}
    >
      {frequencies.map((freq) => (
        <button
          key={freq}
          onClick={() => setFrequency(freq)}
          className={cn(
            "px-6 py-2 text-sm font-medium capitalize transition-all duration-200 rounded-md",
            frequency === freq
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-gray-600"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          )}
        >
          <span className="flex items-center gap-2">
            {freq}
            {freq === 'yearly' && (
              <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                Save {discountPercent}%
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}

type BorderTrailProps = {
  className?: string
  size?: number
  transition?: Transition
  delay?: number
  onAnimationComplete?: () => void
  style?: React.CSSProperties
}

function BorderTrail({
  className,
  size = 60,
  transition,
  delay,
  onAnimationComplete,
  style,
}: BorderTrailProps) {
  const BASE_TRANSITION = {
    repeat: Infinity,
    duration: 6.5, // Much slower - 70% reduction in speed
    ease: 'linear',
  }

  return (
    <div className='pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]'>
      <motion.div
        className={cn('absolute aspect-square bg-gradient-to-r from-accent-neon/60 via-accent-blue/60 to-accent-purple/60 rounded-full', className)}
        style={{
          width: size * 1.5, // Increased length
          height: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          filter: 'blur(2px) brightness(0.8)', // Reduced brightness
          ...style,
        }}
        animate={{
          offsetDistance: ['0%', '100%'],
        }}
        transition={{
          ...(transition ?? BASE_TRANSITION),
          delay: delay,
        }}
        onAnimationComplete={onAnimationComplete}
      />
    </div>
  )
}

type PricingCardProps = React.ComponentProps<'div'> & {
  plan: any
  frequency?: FREQUENCY
  onPlanSelect: (plan: any) => void
  isLoading?: boolean
}

function PricingCard({
  plan,
  className,
  frequency = frequencies[0],
  onPlanSelect,
  isLoading,
  ...props
}: PricingCardProps) {
  const Icon = plan.icon || Star
  const monthlyPrice = plan.price.monthly
  const yearlyPrice = plan.price.yearly
  const displayPrice = frequency === 'yearly' ? Math.round(yearlyPrice / 12) : monthlyPrice
  const isCreator = plan.name.toLowerCase().includes("creator")
  const isProfessional = plan.name.toLowerCase().includes("professional")
  const isSpecial = isCreator || isProfessional
  const discountPercent = Math.round((PRICING_CONFIG.yearlyDiscount ?? 0) * 100)

  // Professional plan is the most sought-out
  const isPopular = isProfessional

  return (
    <motion.div
      key={plan.name}
      className={cn(
        'relative flex w-full flex-col rounded-2xl border bg-card shadow-lg hover:shadow-2xl transition-all duration-500 group',
        className,
      )}
      whileHover={cardHover}
      {...props}
    >
      {/* BorderTrail for Creator and Professional plans */}
      {isSpecial && (
        <BorderTrail
          style={{
            boxShadow: isProfessional
              ? '0px 0px 80px 40px rgb(139 92 246 / 35%), 0 0 120px 70px rgb(79 70 229 / 25%)'
              : '0px 0px 80px 40px rgb(59 130 246 / 35%), 0 0 120px 70px rgb(37 99 235 / 25%)',
          }}
          size={100}
        />
      )}

      {/* Floating gradient orb for premium effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500",
          isProfessional && "bg-gradient-to-br from-accent-purple to-accent-blue",
          isCreator && "bg-gradient-to-br from-accent-blue to-accent-neon",
          !isSpecial && "bg-gradient-to-br from-accent-blue/50 to-accent-purple/50"
        )} />
      </div>

      {/* Header Section with enhanced premium styling */}
      <div
        className={cn(
          'rounded-t-2xl border-b p-6 relative backdrop-blur-sm',
          // Premium backgrounds with subtle gradients
          isCreator && 'bg-gradient-to-br from-accent-blue/25 to-accent-blue/15 border-b-accent-blue/30',
          isProfessional && 'bg-gradient-to-br from-accent-purple/30 to-accent-purple/20 border-b-accent-purple/40',
          !isSpecial && 'bg-gradient-to-br from-muted/20 to-muted/10 border-b-border',
        )}
      >
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
          {isPopular && (
            <div className="bg-gradient-to-r from-accent-purple to-accent-blue text-white flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium shadow-lg">
              <Star className="h-2.5 w-2.5 fill-current" />
              Most Popular
            </div>
          )}
          {isCreator && !isProfessional && (
            <div className="bg-gradient-to-r from-accent-blue to-accent-blue/80 text-white flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium shadow-lg">
              <Star className="h-2.5 w-2.5 fill-current" />
              Popular
            </div>
          )}
          {frequency === 'yearly' && discountPercent > 0 && (
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg px-2.5 py-1 text-[10px] font-medium shadow-lg">
              {discountPercent}% off
            </div>
          )}
        </div>

        {/* Plan name and subtitle with enhanced typography */}
        <div className="text-xl font-bold tracking-tight mb-2">{plan.name}</div>
        <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-4">{plan.subtitle}</p>

        {/* Enhanced price display */}
        <div className="space-y-1">
          <h3 className="flex items-end gap-1">
            <span className={cn(
              "text-4xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent",
              isProfessional && "from-accent-purple via-accent-blue to-accent-neon",
              isCreator && "from-accent-blue via-accent-neon to-accent-blue",
              !isSpecial && "from-foreground to-foreground"
            )}>
              ${displayPrice}
            </span>
            <span className="text-muted-foreground text-lg font-medium">
              /month
            </span>
          </h3>

          {/* Yearly pricing caption with enhanced styling */}
          {frequency === 'yearly' && (
            <p className="text-sm text-muted-foreground font-medium">
              ${yearlyPrice}/year (billed annually)
            </p>
          )}
        </div>
      </div>

      {/* Body Section with enhanced premium styling */}
      <div
        className={cn(
          'text-muted-foreground space-y-4 px-6 py-6 text-sm flex-1 relative',
          // Enhanced backgrounds with subtle gradients
          isCreator && 'bg-gradient-to-br from-accent-blue/8 to-transparent',
          isProfessional && 'bg-gradient-to-br from-accent-purple/10 to-transparent',
          !isSpecial && 'bg-gradient-to-br from-muted/5 to-transparent'
        )}
      >
        {/* Description with better spacing */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-medium">{plan.description}</p>

        {/* Enhanced features list */}
        <div className="space-y-3">
          {plan.features.map((feature: string, index: number) => (
            <div
              key={index}
              className="flex items-start gap-3 group/feature"
            >
              <CheckCircle className={cn(
                "h-4 w-4 flex-shrink-0 mt-0.5 transition-all duration-200",
                isCreator && "text-accent-blue group-hover/feature:scale-110",
                isProfessional && "text-accent-purple group-hover/feature:scale-110",
                !isSpecial && "text-emerald-600 dark:text-emerald-400 group-hover/feature:scale-110"
              )} />
              <p className="text-sm leading-relaxed font-medium group-hover/feature:text-foreground transition-colors duration-200">{feature}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Section with enhanced CTA */}
      <div
        className={cn(
          'mt-auto w-full border-t p-6 relative',
          // Enhanced footer backgrounds
          isCreator && 'bg-gradient-to-br from-accent-blue/12 to-accent-blue/6 border-t-accent-blue/30',
          isProfessional && 'bg-gradient-to-br from-accent-purple/18 to-accent-purple/12 border-t-accent-purple/40',
          !isSpecial && 'bg-gradient-to-br from-muted/8 to-muted/4 border-t-border',
        )}
      >
        <button
          className={cn(
            "w-full rounded-lg px-4 py-3.5 text-sm font-semibold transition-all duration-200 relative group/btn shadow-md hover:shadow-lg",
            // Minimal button styling with subtle hover effects for ALL plans
            isProfessional
              ? "bg-gradient-to-r from-accent-purple to-accent-blue text-white hover:opacity-90"
              : isCreator
              ? "bg-gradient-to-r from-accent-blue to-accent-blue/80 text-white hover:opacity-90"
              : plan.highlight
              ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:opacity-90"
              : "bg-background text-foreground border-2 border-border hover:border-accent-blue/70 hover:bg-muted/30"
          )}
          onClick={() => onPlanSelect(plan)}
          disabled={isLoading}
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <>
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </>
            )}
          </span>
        </button>
      </div>
    </motion.div>
  )
}

export function MyPricingPlans2({
  showHeader = true,
  title = "Plans that Scale with You",
  subtitle = "Whether you're just starting out or growing fast, our flexible pricing has you covered — with no hidden costs.",
  className = ""
}: MyPricingPlans2Props) {
  const [frequency, setFrequency] = React.useState<FREQUENCY>('monthly')
  const [isLoading, setIsLoading] = React.useState<string | null>(null)
  const { data: authData, isLoading: sessionLoading } = useSession()
  const router = useRouter()

  const handlePlanSelect = async (plan: any) => {
    console.log('🎯 Plan selected:', plan.name, 'Billing:', frequency)

    setIsLoading(plan.name)

    try {
      console.log('📋 Auth data:', {
        sessionLoading,
        hasUser: !!authData?.user,
        userEmail: authData?.user?.email
      })

      if (sessionLoading) {
        console.log('⏳ Session still loading, retrying in 300ms...')
        setTimeout(() => {
          setIsLoading(null)
          handlePlanSelect(plan)
        }, 300)
        return
      }

      if (!authData?.user) {
        console.log('🔒 User not authenticated, redirecting to login')
        const planData = {
          plan: plan.name.toLowerCase().replace(/\s+/g, '_'),
          billingPeriod: frequency
        }
        localStorage.setItem('selectedPlan', JSON.stringify(planData))
        router.push('/app/login')
        return
      }

      console.log('✅ User authenticated, proceeding with checkout')

      const requestBody = {
        plan: plan.name.toLowerCase().replace(/\s+/g, '_'),
        billingPeriod: frequency
      }

      // Add timeout to prevent hanging indefinitely
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      let data: any = null
      try {
        data = await response.json()
        console.log('📤 Response data:', data)
      } catch (e) {
        console.error('❌ Failed to parse response JSON:', e)
        toast.error('Invalid response from server')
        return
      }

      if (response.status === 401) {
        const planData = {
          plan: plan.name.toLowerCase().replace(/\s+/g, '_'),
          billingPeriod: frequency
        }
        localStorage.setItem('selectedPlan', JSON.stringify(planData))
        router.push('/app/login')
        return
      }

      if (!response.ok) {
        const message = (data && data.error) ? data.error : 'Failed to create checkout session'
        toast.error(message)
        return
      }

      if (data && data.checkoutUrl) {
        console.log('✅ Checkout URL received:', data.checkoutUrl)
        toast.success('Redirecting to payment...')

        // Use window.open as fallback if location.href fails
        try {
          window.location.href = data.checkoutUrl
        } catch (redirectError) {
          console.error('Primary redirect failed, trying window.open:', redirectError)
          window.open(data.checkoutUrl, '_self')
        }
      } else {
        console.error('❌ No checkout URL in response:', data)
        toast.error('No checkout URL received')
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Payment service is taking too long to respond. Please try again.')
      } else {
        toast.error(error instanceof Error ? error.message : 'Checkout failed')
      }
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center space-y-8 p-4 relative',
        className,
      )}
    >
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-accent-neon/10 to-accent-blue/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 w-full">
        {showHeader && (
          <motion.div
            className="mx-auto max-w-3xl space-y-4 text-center mb-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Enhanced typography matching homepage style */}
            <motion.h2
              className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
              variants={fadeInUp}
            >
              {title}
            </motion.h2>
            {subtitle && (
              <motion.p
                className="text-muted-foreground text-base sm:text-lg leading-relaxed font-medium"
                variants={fadeInUp}
              >
                {subtitle}
              </motion.p>
            )}
          </motion.div>
        )}

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex justify-center mb-8"
        >
          <PricingFrequencyToggle
            frequency={frequency}
            setFrequency={setFrequency}
          />
        </motion.div>

        <motion.div
          className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {PRICING_PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeInUp}
            >
              <PricingCard
                plan={plan}
                frequency={frequency}
                onPlanSelect={handlePlanSelect}
                isLoading={isLoading === plan.name}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}