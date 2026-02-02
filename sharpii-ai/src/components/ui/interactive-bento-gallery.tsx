"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Sparkles, Grid3X3, Maximize2, Image as ImageIcon, ArrowRight, Eye } from "lucide-react"
import { SimpleImageViewer } from "../ui/simple-image-viewer"
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
      className={cn("relative overflow-hidden rounded-2xl cursor-pointer group", className)}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[4/5] relative">
        <Image
          src={item.after}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Simple Hover Overlay */}
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20">
            <Maximize2 className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Corner badge */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
          <Sparkles className="w-3 h-3 text-accent-neon" />
        </div>
      </div>
    </div>
  )
}

export function InteractiveBentoGallery() {
  return <InteractiveBentoGallerySecond />
}

export function InteractiveBentoGallerySecond() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const filteredItems = selectedCategory === "All"
    ? galleryItems
    : galleryItems.filter(item => item.category === selectedCategory)

  const handleImageClick = (index: number) => {
    // Find the original index if filtered
    const originalIndex = galleryItems.findIndex(item => item === filteredItems[index])
    setModalIndex(originalIndex !== -1 ? originalIndex : index)
    setIsModalOpen(true)
  }

  return (
    <section className="py-32 relative overflow-hidden bg-black">
      {/* Premium Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-accent-blue/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-accent-purple/5 rounded-full blur-[100px] mix-blend-screen opacity-40" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10 mb-8">
            <ImageIcon className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">Enhanced Gallery</span>
          </div>

          <h2 className="font-heading text-5xl md:text-7xl font-bold text-center mb-8 leading-tight">
            <span className="text-white">Masterpiece</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink">Collection</span>
          </h2>

          <p className="text-xl text-white/60 text-center max-w-3xl mx-auto mb-12 leading-relaxed">
            Explore a curated selection of stunning transformations powered by our advanced AI engine.
          </p>
        </motion.div>

        {/* Filter Controls */}
        <motion.div
          className="flex justify-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="p-1.5 glass-card rounded-2xl flex items-center gap-1 overflow-x-auto max-w-full">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 relative whitespace-nowrap",
                  selectedCategory === category ? "text-white" : "text-white/40 hover:text-white/70"
                )}
              >
                {selectedCategory === category && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute inset-0 bg-white/10 rounded-xl border border-white/10 shadow-lg"
                    style={{ borderRadius: "0.75rem" }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{category}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Simplified Grid Gallery */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.slice(0, 6).map((item, index) => (
              <motion.div
                key={`${item.title}-${index}`} // Using item.title and index for a unique key
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={cn(
                  "group",
                  index === 0 || index === 3 ? "md:col-span-2" : "" // Apply span complexity as per instruction
                )}
              >
                <MediaItem
                  item={item}
                  onClick={() => handleImageClick(index)}
                  className="mb-5 shadow-2xl" // Apply existing styling to MediaItem
                />

                {/* Content Below Image - Kept for context/description */}
                <div className="px-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-accent-blue uppercase tracking-wider">{item.category}</span>
                    <span className="text-xs font-bold text-accent-green">+{item.improvement} Quality</span>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-accent-neon transition-colors duration-300">{item.title}</h3>
                  <p className="text-white/40 text-sm mt-1 line-clamp-2">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Enhanced Gallery Modal */}
        <EnhancementGalleryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pairs={galleryItems} // Pass full list for navigation
          initialIndex={modalIndex}
        />

        {/* Decorative CTA */}
        <div className="mt-20 text-center">
          <motion.button
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-5 h-5 fill-black" />
            Start Creating Now
          </motion.button>
        </div>
      </div>
    </section>
  )
}