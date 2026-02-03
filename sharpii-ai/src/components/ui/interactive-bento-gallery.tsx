"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { IMAGE_ASSETS } from "@/lib/constants"
import Image from "next/image"
import { cn } from "@/lib/utils"

// Symmetrical Grid - No Categories
const galleryItems = IMAGE_ASSETS.beforeAfterPairs.slice(0, 8) // Take top 8 for a clean 4x2 or 2x4 grid

export function InteractiveBentoGallerySecond() {
  return (
    <section className="py-32 relative bg-black">
      {/* Reduced Background Noise for Cleanness */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] right-[-10%] w-[800px] h-[800px] bg-[#FFFF00]/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl md:text-6xl font-bold text-center mb-6 leading-tight text-white">
            Masterpiece Collection
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Witness the transformation. Hover over any image to reveal the original.
          </p>
          {/* No Filter Tabs - As requested */}
        </div>

        {/* Symmetrical Grid - 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {galleryItems.map((item, index) => (
            <GalleryCard key={index} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

function GalleryCard({ item }: { item: any }) {
  // Simple Hover Logic: Default shows AFTER. Hover shows BEFORE.
  // "The user should clearly see the difference... no disturbance."

  return (
    <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10">
      {/* AFTER Image (Default) */}
      <Image
        src={item.after}
        alt="After Enhancement"
        fill
        className="object-cover transition-opacity duration-300 ease-in-out group-hover:opacity-0"
        priority
      />

      {/* BEFORE Image (Revealed on Hover) */}
      <Image
        src={item.before}
        alt="Original Image"
        fill
        className="object-cover absolute inset-0 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
      />

      {/* Minimal Status Indicator */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-white/70 uppercase">
          Original
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center transition-opacity duration-300 group-hover:opacity-0">
        <div className="px-2 py-1 rounded bg-[#FFFF00]/10 backdrop-blur-sm border border-[#FFFF00]/20 text-[10px] font-bold text-[#FFFF00] uppercase">
          Masterpiece
        </div>
      </div>
    </div>
  )
}