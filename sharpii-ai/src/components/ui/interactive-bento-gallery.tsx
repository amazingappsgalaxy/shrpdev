"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Sparkles, Image as ImageIcon, Maximize2, ArrowUpRight } from "lucide-react"
import { EnhancementGalleryModal } from "../ui/enhancement-gallery-modal"
import { IMAGE_ASSETS } from "@/lib/constants"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface GalleryItem {
  before: string
  after: string
  title: string
  description: string
  category: string
  improvement: string
}

const staticImprovements = ["94%", "91%", "96%", "89%", "92%", "95%", "93%", "97%", "88%", "90%"]

const galleryItems: GalleryItem[] = IMAGE_ASSETS.beforeAfterPairs.map((pair, index) => ({
  before: pair.before,
  after: pair.after,
  title: pair.title,
  description: "AI-powered image enhancement with professional results",
  category: index < 3 ? 'Portrait' : index < 6 ? 'Professional' : 'Artistic',
  improvement: staticImprovements[index] || "93%",
}))

const categories = ["All", "Portrait", "Professional", "Artistic"]

interface MediaItemProps {
  item: GalleryItem
  onClick: () => void
  className?: string
}

const MediaItem = ({ item, onClick, className }: MediaItemProps) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn("relative w-full h-full overflow-hidden rounded-3xl cursor-pointer group bg-white/5", className)}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0">
        <Image
          src={item.after}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <Maximize2 className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
        <div className="flex items-center justify-between mb-2">
          <span className="px-3 py-1 rounded-full bg-[#FFFF00]/10 text-[#FFFF00] text-xs font-bold uppercase tracking-wider border border-[#FFFF00]/20">
            {item.category}
          </span>
          <span className="text-xs font-mono text-white/70 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#FFFF00]" />
            +{item.improvement}
          </span>
        </div>
        <h3 className="text-xl font-bold text-white mb-1 leading-tight group-hover:text-[#FFFF00] transition-colors">{item.title}</h3>
      </div>

      {/* Top Right Icon */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-4 group-hover:translate-x-0">
        <div className="bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10">
          <ArrowUpRight className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}

export function InteractiveBentoGallerySecond() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)

  const filteredItems = selectedCategory === "All"
    ? galleryItems
    : galleryItems.filter(item => item.category === selectedCategory)

  const handleImageClick = (index: number) => {
    const originalIndex = galleryItems.findIndex(item => item === filteredItems[index])
    setModalIndex(originalIndex !== -1 ? originalIndex : index)
    setIsModalOpen(true)
  }

  // Bento Grid Logic - Creates a pattern of Large, Small, Tall, etc.
  const getSpanClasses = (index: number) => {
    // Pattern: Big Square, Tall, Wide, Small, Small, Wide
    const patternIndex = index % 6

    if (patternIndex === 0) return "md:col-span-2 md:row-span-2 aspect-square" // Big feature
    if (patternIndex === 1) return "md:col-span-1 md:row-span-2 aspect-[3/5]" // Tall portrait
    if (patternIndex === 2) return "md:col-span-2 md:row-span-1 aspect-[2/1]" // Wide landscape
    if (patternIndex === 3) return "md:col-span-1 md:row-span-1 aspect-square" // Standard
    if (patternIndex === 4) return "md:col-span-1 md:row-span-1 aspect-square" // Standard
    if (patternIndex === 5) return "md:col-span-3 md:row-span-1 aspect-[3/1]" // Panoramic

    return "md:col-span-1 md:row-span-1 aspect-square" // Default fallback
  }

  return (
    <section className="py-32 relative bg-black">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] right-[-10%] w-[800px] h-[800px] bg-[#FFFF00]/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-heading text-5xl md:text-7xl font-bold text-center mb-8 leading-tight">
            <span className="text-white">Masterpiece</span> <span className="text-white/50 italic font-serif">Collection</span>
          </h2>

          {/* Filter Tabs */}
          <div className="flex justify-center flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 border border-transparent",
                  selectedCategory === category
                    ? "bg-[#FFFF00] text-black border-[#FFFF00]"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-min"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.slice(0, 9).map((item, index) => (
              <motion.div
                key={item.title}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className={cn(getSpanClasses(index))}
              >
                <MediaItem
                  item={item}
                  onClick={() => handleImageClick(index)}
                  className="h-full w-full"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <EnhancementGalleryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pairs={galleryItems}
          initialIndex={modalIndex}
        />
      </div>
    </section>
  )
}