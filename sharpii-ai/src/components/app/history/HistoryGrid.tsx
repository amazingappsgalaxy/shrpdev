import { useState } from "react";
import { cn } from "@/lib/utils";
import { HistoryListItem } from "@/app/app/history/page"; // We'll need to export this or redefine
import { ProcessingGradient } from "./ProcessingGradient";
import { Download, Play, MoreVertical, Trash2, Maximize2, AlertCircle } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion } from "framer-motion";

// Redefine locally to avoid circular dep if needed, or import if exported
type Item = {
    id: string;
    outputUrls: Array<{ type: 'image' | 'video'; url: string }>;
    status: string;
    createdAt: string;
};

interface HistoryGridProps {
    items: Item[];
    onSelect: (id: string) => void;
    onDelete?: (id: string) => void; // Optional for now
}

export function HistoryGrid({ items, onSelect, onDelete }: HistoryGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {items.map((item, idx) => (
                <HistoryCard key={item.id} item={item} onSelect={onSelect} index={idx} />
            ))}
        </div>
    );
}

function HistoryCard({ item, onSelect, index }: { item: Item; onSelect: (id: string) => void; index: number }) {
    const primary = item.outputUrls?.find((o) => o.type === "image")?.url || item.outputUrls?.[0]?.url;
    const isVideo = item.outputUrls?.some((o) => o.type === "video");
    const isProcessing = item.status === "processing";
    const isFailed = item.status === "failed";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={cn(
                "group relative aspect-[4/5] rounded-xl overflow-hidden bg-white/[0.03] transition-all duration-300",
                isProcessing ? "cursor-default" : "cursor-pointer"
            )}
            onClick={() => !isProcessing && onSelect(item.id)}
        >
            {/* Background / Image */}
            {isProcessing ? (
                <ProcessingGradient />
            ) : primary ? (
                <div className="absolute inset-0 w-full h-full">
                    <img
                        src={primary}
                        alt="History Item"
                        className="w-full h-full object-cover transition-transform duration-700"
                    />

                </div>
            ) : (
                <div className="absolute inset-0 bg-white/[0.03] flex items-center justify-center text-white/20">
                    {isFailed ? (
                        <AlertCircle className="w-8 h-8 text-white/[0.05]" strokeWidth={1.5} />
                    ) : (
                        "No Preview"
                    )}
                </div>
            )}

            {/* Video Indicator */}
            {isVideo && !isProcessing && (
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                </div>
            )}



            {/* Hover Actions (Center) */}




            {/* Footer Badge (Bottom) */}
            {!isProcessing && (
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 cursor-default">
                    <span className="text-[10px] font-medium text-white/70 uppercase tracking-widest pl-1 mb-1">
                        {new Date(item.createdAt).toLocaleDateString()}
                    </span>

                    {!isFailed && (
                        <button
                            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg cursor-pointer z-20"
                            onClick={(e) => { e.stopPropagation(); /* download logic */ }}
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

        </motion.div>
    );
}
