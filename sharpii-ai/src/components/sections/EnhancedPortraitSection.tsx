"use client"

import PortraitEnhancementSuite from "@/components/ui/portrait-enhancement-suite"

export function EnhancedPortraitSection() {
  return (
    <PortraitEnhancementSuite
      beforeImage="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg"
      afterImage="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png"
      title="Complete Portrait Enhancement Suite"
      description="Experience the magic of AI-powered portrait enhancement. Watch as our advanced algorithms transform your photos with professional-grade skin smoothing, color correction, and detail enhancement in real-time."
      className="border-t border-white/10"
    />
  )
}