import React from "react";
import { cn } from "@/lib/utils";

export const ProcessingGradient = ({ className }: { className?: string }) => {
    return (
        <div className={cn("absolute inset-0 overflow-hidden bg-[#1a1a1c]", className)}>
            {/* Animated Gradient Background - Enhanced Intensity */}
            <div className="absolute inset-0 opacity-100">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,#ffffff_45deg,transparent_90deg)] opacity-60 blur-[40px]" />
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_10s_linear_infinite_reverse] bg-[conic-gradient(from_180deg,transparent_0deg,#d4d4d8_60deg,transparent_120deg)] opacity-40 blur-[50px]" />
            </div>

            {/* Noise Overlay - Stronger */}
            <div
                className="absolute inset-0 opacity-[0.25] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    backgroundSize: '100px 100px'
                }}
            />

            {/* Subtle Pulse */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent mix-blend-multiply" />

            {/* Text */}
            <div className="absolute bottom-3 left-3 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    <span className="text-[10px] font-medium text-white/90 tracking-widest uppercase shadow-black/50 drop-shadow-md">Generating</span>
                </div>
            </div>
        </div>
    );
};
