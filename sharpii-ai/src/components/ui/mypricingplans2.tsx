"use client"

import * as React from "react"
import { motion, Transition, HTMLMotionProps } from "framer-motion"
import { Check, ArrowRight, Star, CheckCircle, Sparkles } from "lucide-react"
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
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } },
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
  y: -10,
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as any }
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
        'glass-elevated mx-auto flex w-fit rounded-full border border-white/10 p-1.5',
        props.className,
      )}
      {...props}
    >
      {frequencies.map((freq) => (
        <button
          key={freq}
          onClick={() => setFrequency(freq)}
          className={cn(
            "relative px-8 py-3 text-sm font-bold capitalize transition-all duration-300 rounded-full",
            frequency === freq
              ? "text-black"
              : "text-white/60 hover:text-white"
          )}
        >
          {frequency === freq && (
            <motion.div
              layoutId="activeFrequency"
              className="absolute inset-0 bg-white rounded-full shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {freq}
            {freq === 'yearly' && (
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider",
                frequency === freq ? "bg-[#FFFF00]/20 text-[#FFFF00]" : "bg-[#FFFF00] text-black"
              )}>
                -{discountPercent}%
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
    duration: 4,
    ease: 'linear',
  }

  return (
    <div className='pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]'>
      <motion.div
        className={cn('absolute aspect-square bg-gradient-to-r from-[#FFFF00] via-white to-[#FFFF00] rounded-full opacity-80', className)}
        style={{
          width: size * 1.5,
          height: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          filter: 'blur(8px)',
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

type PricingCardProps = HTMLMotionProps<'div'> & {
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

  // Professional plan is the most sought-out
  const isPopular = isProfessional

  return (
    <motion.div
      key={plan.name}
      className={cn(
        'relative flex w-full flex-col rounded-3xl border border-white/5 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden group',
        // isSpecial ? "border-transparent" : "border-white/5",
        className,
      )}
      whileHover={cardHover}
      {...props}
    >
      {/* BorderTrail for Special Plans */}
      {isSpecial && (
        <BorderTrail
          style={{
            boxShadow: isProfessional
              ? '0px 0px 60px 30px rgba(255, 255, 0, 0.15)'
              : '0px 0px 60px 30px rgba(255, 255, 255, 0.15)',
          }}
          size={120}
        />
      )}

      {/* Background Glow */}
      <div className="absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-20",
          isProfessional ? "from-[#FFFF00]/10 to-transparent" :
            isCreator ? "from-white/10 to-transparent" :
              "from-white/5 to-transparent"
        )} />
      </div>

      {/* Header Section */}
      <div className="p-8 relative z-10">
        {/* Badges */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
          {isPopular && (
            <div className="bg-[#FFFF00] text-black flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,0,0.3)]">
              <Sparkles className="h-3 w-3 fill-current" />
              Popular
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className={cn("text-2xl font-bold font-heading mb-2", isSpecial ? "text-white" : "text-white/80")}>
          {plan.name}
        </h3>
        <p className="text-white/50 text-sm font-medium leading-relaxed mb-6 h-10">{plan.subtitle}</p>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-4xl font-bold text-white font-heading">${displayPrice}</span>
          <span className="text-white/40 font-medium">/month</span>
        </div>

        {frequency === 'yearly' && (
          <p className="text-xs text-accent-green font-bold mb-6">
            Billed ${yearlyPrice} yearly
          </p>
        )}

        <div className="w-full h-px bg-white/10 my-6" />

        {/* Features */}
        <ul className="space-y-4 mb-8 flex-1">
          {plan.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start gap-3 text-sm text-white/70 group/feature">
              <CheckCircle className={cn(
                "h-5 w-5 flex-shrink-0 transition-colors duration-300",
                isProfessional ? "text-[#FFFF00]" :
                  isCreator ? "text-white" : "text-white/40 group-hover:text-white"
              )} />
              <span className="group-hover/feature:text-white transition-colors duration-300">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          className={cn(
            "w-full rounded-2xl py-4 text-sm font-bold transition-all duration-300 relative overflow-hidden group/btn shadow-lg hover:shadow-xl hover:scale-[1.02]",
            isProfessional
              ? "bg-[#FFFF00] text-black shadow-[0_0_20px_rgba(255,255,0,0.4)] hover:shadow-[0_0_30px_rgba(255,255,0,0.6)]"
              : isCreator
                ? "bg-white text-black hover:bg-white/90"
                : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
          )}
          onClick={() => onPlanSelect(plan)}
          disabled={isLoading}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <>
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
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
      if (sessionLoading) {
        setTimeout(() => {
          setIsLoading(null)
          handlePlanSelect(plan)
        }, 300)
        return
      }

      if (!authData?.user) {
        const planData = {
          plan: plan.name.toLowerCase().replace(/\s+/g, '_'),
          billingPeriod: frequency
        }
        localStorage.setItem('selectedPlan', JSON.stringify(planData))
        router.push('/app/login')
        return
      }

      const requestBody = {
        plan: plan.name.toLowerCase().replace(/\s+/g, '_'),
        billingPeriod: frequency
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)

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
      } catch (e) {
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
        toast.success('Redirecting to payment...')
        try {
          window.location.href = data.checkoutUrl
        } catch (redirectError) {
          window.open(data.checkoutUrl, '_self')
        }
      } else {
        toast.error('No checkout URL received')
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout failed')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div
      className={cn(
        'relative flex w-full flex-col items-center justify-center space-y-12 py-24',
        className,
      )}
    >
      {/* Premium background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-r from-[#FFFF00]/5 via-white/5 to-[#FFFF00]/5 blur-[120px] rounded-full opacity-40" />
      </div>

      <div className="relative z-10 w-full container px-6">
        {showHeader && (
          <motion.div
            className="mx-auto max-w-3xl space-y-6 text-center mb-16"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10 mb-2">
              <Star className="h-4 w-4 text-[#FFFF00] fill-[#FFFF00]" />
              <span className="text-sm font-bold text-white uppercase tracking-widest">Premium Plans</span>
            </div>

            <motion.h2
              className="text-5xl md:text-7xl font-bold font-heading text-white"
              variants={fadeInUp}
            >
              {title}
            </motion.h2>
            {subtitle && (
              <motion.p
                className="text-white/60 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
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
          className="flex justify-center mb-16"
        >
          <PricingFrequencyToggle
            frequency={frequency}
            setFrequency={setFrequency}
          />
        </motion.div>

        <motion.div
          className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 items-start"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          {PRICING_PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeInUp}
              className="h-full"
            >
              <PricingCard
                plan={plan}
                frequency={frequency}
                onPlanSelect={handlePlanSelect}
                isLoading={isLoading === plan.name}
                className="h-full"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}