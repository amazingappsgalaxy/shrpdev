'use client'

import { NavigationHero4 } from "@/components/ui/navigation-hero4"
import { HeroSection } from "@/components/ui/hero-section"
import { GridMotion } from "@/components/ui/grid-motion"
import { InteractiveBentoGallerySecond } from "@/components/ui/interactive-bento-gallery"
import { WorkflowSection } from "@/components/sections/WorkflowSection"
import { ComparisonSection } from "@/components/sections/ComparisonSection"
import { TestimonialsSection } from "@/components/sections/TestimonialsSection"
import { MyPricingPlans2 } from "@/components/ui/mypricingplans2"
import { FAQChatAccordion } from "@/components/ui/faq-chat-accordion"
import { Footer } from "@/components/ui/footer"
import { SkinRealismSection } from "@/components/sections/SkinRealismSection"
import { IncrediblePowerSection } from "@/components/sections/IncrediblePowerSection"
import { UnifiedEnhancementSection } from "@/components/sections/UnifiedEnhancementSection"
import { AIInfluencerSection } from "@/components/sections/AIInfluencerSection"
import { CostOptimizationSection } from "@/components/sections/CostOptimizationSection"
import MagicalPortraitSection from "@/components/sections/MagicalPortraitSection"

export default function Home() {
  return (
    <main className="min-h-screen">
      <NavigationHero4 />
      <HeroSection />
      <InteractiveBentoGallerySecond />
      <ComparisonSection />
      <MagicalPortraitSection />
      <GridMotion />
      <SkinRealismSection />
      <IncrediblePowerSection />
      <UnifiedEnhancementSection />
      <AIInfluencerSection />
      <CostOptimizationSection />
      <WorkflowSection />
      <TestimonialsSection />
      <section id="pricing-section" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <MyPricingPlans2
            title="Choose Your Perfect Plan"
            subtitle="Transform your images with professional AI enhancement. Start with any plan."
          />
        </div>
      </section>
      <FAQChatAccordion />
      <Footer />
    </main>
  )
}