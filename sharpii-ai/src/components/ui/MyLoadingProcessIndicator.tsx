"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'


interface MyLoadingProcessIndicatorProps {
  isVisible: boolean
  progress: number
  status: 'loading' | 'success' | 'error'
  activeTasks?: Map<string, { progress: number; status: 'loading' | 'success' | 'error'; message?: string }>
}

export default function MyLoadingProcessIndicator({
  isVisible = false,
  progress = 0,
  status = 'loading',
  activeTasks
}: MyLoadingProcessIndicatorProps) {
  // Calculate average progress from all active tasks
  const averageProgress = activeTasks && activeTasks.size > 0 
    ? Array.from(activeTasks.values()).reduce((sum, task) => sum + task.progress, 0) / activeTasks.size
    : progress
  return (
    <AnimatePresence>
      {isVisible && (
        // Fixed, full-width wrapper to ensure perfect horizontal centering without relying on transform X
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: 0,
            right: 0,
            zIndex: 50,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          {/* Animated content only changes opacity and Y, not X transform */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-2xl shadow-black/60">
              <div className="flex items-center space-x-4">
                {/* Circular Loading Indicator */}
                <div className="relative">
                  {status === 'loading' && (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {status === 'success' && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Text and Percentage */}
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm font-medium">
                    {status === 'loading' && 'Enhancing...'}
                    {status === 'success' && 'Completed!'}
                    {status === 'error' && 'Failed'}
                  </span>
                  {status === 'loading' && (
                    <span className="text-white/80 text-sm font-medium">
                      {Math.round(averageProgress)}%
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                {status === 'loading' && (
                  <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${averageProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}