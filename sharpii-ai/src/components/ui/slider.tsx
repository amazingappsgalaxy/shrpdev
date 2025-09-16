import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10 backdrop-blur-xl border border-transparent shadow-inner">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full shadow-lg" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full bg-white/95 backdrop-blur-xl border-2 border-white/30 shadow-2xl ring-0 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/30 focus-visible:scale-110 hover:scale-105 hover:shadow-xl disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
