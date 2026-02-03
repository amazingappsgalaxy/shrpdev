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

        {/* CTA Section - Redesigned */}
        <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-b from-white/10 to-black border border-white/10 p-12 md:p-24 text-center mb-24">
          {/* Glow Effects */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFFF00]/50 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFFF00]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="font-heading text-6xl md:text-9xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
              CREATE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FFFF00] to-yellow-600">IMPACT.</span>
            </h2>
            <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join the revolution of AI-enhanced aesthetics. Your masterpiece awaits.
            </p>

            <Link
              href="/app/login"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#FFFF00] text-black font-bold text-xl rounded-full hover:bg-[#E6E600] hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,0,0.5)]"
            >
              Enter App <Send className="w-5 h-5 -rotate-45" />
            </Link>
          </div>
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
