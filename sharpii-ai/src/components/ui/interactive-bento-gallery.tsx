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

        {/* Bento Grid Gallery */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={`${item.title}-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  "group relative rounded-3xl overflow-hidden cursor-pointer glass-card border border-white/10",
                  // Create a bento-like irregular grid
                  index === 0 ? "lg:col-span-2 lg:row-span-2" : "",
                  index === 3 ? "lg:col-span-2" : "",
                  index === 6 ? "md:col-span-2" : ""
                )}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleImageClick(index)}
              >
                {/* Image Container */}
                <div className="absolute inset-0 w-full h-full">
                  <Image
                    src={hoveredIndex === index ? item.after : item.before}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Hint Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs font-bold text-accent-neon flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Enhanced View
                    </span>
                  </div>

                  {/* Comparison Slider Hint (Visual Only) */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end z-10">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                      <div className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-white/80">
                        {item.category}
                      </div>
                      <div className="px-2 py-1 rounded-md bg-accent-green/20 border border-accent-green/30 text-xs font-bold text-accent-green">
                        +{item.improvement} Quality
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{item.title}</h3>
                    <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                      <p className="text-white/70 text-sm mt-2 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-4 text-accent-neon text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                        View Comparison <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover Overlay Gradient */}
                <div className="absolute inset-0 bg-accent-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />
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