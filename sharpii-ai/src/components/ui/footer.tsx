"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Github, Youtube, Sparkles, Send } from "lucide-react"
import { cn } from "@/lib/utils"

export function Footer() {
  return (
    <footer className="relative bg-black border-t border-white/10 pt-24 pb-12 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-purple/10 rounded-full blur-[150px] mix-blend-screen opacity-30" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-blue/10 rounded-full blur-[150px] mix-blend-screen opacity-30" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">

        {/* CTA Section */}
        <div className="flex flex-col items-center justify-center text-center mb-24 border-b border-white/10 pb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10 mb-8">
            <Sparkles className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">Join the Revolution</span>
          </div>
          <h2 className="text-5xl md:text-8xl font-bold font-heading text-white mb-8 tracking-tight">
            Create Impact.
          </h2>
          <p className="text-xl text-white/50 max-w-2xl mb-12">
            Join thousands of creators who are using Sharpii AI to transform their visuals.
          </p>
          <Link
            href="/app/login"
            className="group relative px-10 py-5 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform duration-300"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-neon via-white to-accent-blue blur opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative z-10 flex items-center gap-3">
              Start Creating Free <Send className="w-5 h-5 -rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </span>
          </Link>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-24 mb-16">

          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-8">
            <Link href="/" className="inline-block">
              <span className="font-heading text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                Sharpii<span className="text-accent-neon">.</span>ai
              </span>
            </Link>
            <p className="text-white/50 leading-relaxed max-w-sm">
              The advanced AI platform for next-generation image and video enhancement. Elevate your content with professional-grade tools.
            </p>
            <div className="flex gap-4 pt-4">
              {[Twitter, Github, Linkedin, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full glass-elevated border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-accent-neon/50 hover:bg-accent-neon/10 transition-all duration-300 group"
                >
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-12">

            {/* Column 1 */}
            <div className="space-y-6">
              <h4 className="text-white font-bold font-heading text-lg">Platform</h4>
              <ul className="space-y-4">
                {["Image Upscaler", "Video Enhancer", "Face Restoration", "Background Remover", "Color Correction"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-white/50 hover:text-accent-neon transition-colors duration-300 text-sm font-medium">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2 */}
            <div className="space-y-6">
              <h4 className="text-white font-bold font-heading text-lg">Company</h4>
              <ul className="space-y-4">
                {["About Us", "Careers", "Blog", "Press Kit", "Contact"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-white/50 hover:text-accent-neon transition-colors duration-300 text-sm font-medium">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-6">
              <h4 className="text-white font-bold font-heading text-lg">Legal</h4>
              <ul className="space-y-4">
                {["Privacy Policy", "Terms of Service", "Cookie Policy", "Security", "GDPR"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-white/50 hover:text-accent-neon transition-colors duration-300 text-sm font-medium">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} Sharpii AI Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              <span className="text-white/50 text-xs font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
