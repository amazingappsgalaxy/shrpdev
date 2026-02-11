"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

// A short, crisp mechanical click sound (base64)
const TICK_SOUND = "data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAAAAAAD/AP8A/wD/AP8AAAD//"

const MechanicalSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    label?: string
    visualTicks?: boolean
    leftLabel?: string
    rightLabel?: string
  }
>(({ className, label, visualTicks = true, leftLabel, rightLabel, onValueChange, ...props }, ref) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const lastValueRef = React.useRef<number>(props.value?.[0] ?? props.defaultValue?.[0] ?? 0)

  React.useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio(TICK_SOUND)
    audioRef.current.volume = 0.3
  }, [])

  const handleValueChange = (values: number[]) => {
    const newValue = values[0]
    // Play sound only if value actually changes and is a valid number
    if (typeof newValue === 'number' && newValue !== lastValueRef.current) {
      if (audioRef.current) {
        // Clone to allow rapid firing (polyphony)
        const sound = audioRef.current.cloneNode() as HTMLAudioElement
        sound.volume = 0.2
        sound.play().catch(() => {}) 
      }
      lastValueRef.current = newValue
    }
    onValueChange?.(values)
  }

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <div className="flex items-center gap-3">
        {leftLabel && (
          <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-500 select-none w-12 text-right">
            {leftLabel}
          </span>
        )}
        
        <SliderPrimitive.Root
          ref={ref}
          className="relative flex w-full touch-none select-none items-center group py-2"
          onValueChange={handleValueChange}
          {...props}
        >
          {/* Ticks Background - The "Track" */}
          {visualTicks && (
            <div className="absolute inset-0 flex justify-between items-center px-1 pointer-events-none">
              {Array.from({ length: 41 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-[1px] bg-neutral-800/80 transition-all duration-300 ease-out",
                    // Major ticks every 5 steps
                    i % 5 === 0 
                      ? "h-2 bg-neutral-600 group-hover:h-3 group-hover:bg-neutral-500" 
                      : "h-1 group-hover:h-2"
                  )}
                />
              ))}
            </div>
          )}

          {/* Invisible Track for hit area */}
          <SliderPrimitive.Track className="relative h-4 w-full grow overflow-visible bg-transparent">
             {/* We hide the Range (fill) as per the reference style which is just ticks + thumb */}
          </SliderPrimitive.Track>

          {/* Thumb - The Pill */}
          <SliderPrimitive.Thumb 
            className="block h-4 w-2 rounded-full border-none bg-[#FFFF00] shadow-[0_0_10px_rgba(255,255,0,0.4)] ring-0 transition-all duration-300 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 hover:scale-125 hover:shadow-[0_0_15px_rgba(255,255,0,0.6)] cursor-grab active:cursor-grabbing group-hover:h-5 group-hover:w-2.5"
          >
          </SliderPrimitive.Thumb>
        </SliderPrimitive.Root>

        {rightLabel && (
          <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-500 select-none w-12 text-left">
            {rightLabel}
          </span>
        )}
      </div>
    </div>
  )
})
MechanicalSlider.displayName = SliderPrimitive.Root.displayName

export { MechanicalSlider }
