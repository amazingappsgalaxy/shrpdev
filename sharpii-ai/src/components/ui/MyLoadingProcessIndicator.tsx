"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'


type TaskStatus = 'loading' | 'success' | 'error'

type TaskItem = {
  id: string
  progress: number
  status: TaskStatus
  message?: string
}

interface MyLoadingProcessIndicatorProps {
  isVisible: boolean
  tasks: TaskItem[]
  onCloseTask?: (taskId: string) => void
}

export default function MyLoadingProcessIndicator({
  isVisible = false,
  tasks,
  onCloseTask
}: MyLoadingProcessIndicatorProps) {
  return (
    <AnimatePresence>
      {isVisible && (
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl shadow-black/60 space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3">
                  <div className="relative">
                    {task.status === 'loading' && (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {task.status === 'success' && (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {task.status === 'error' && (
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-white text-sm font-medium">
                      {task.message || (task.status === 'loading' ? 'Enhancing...' : task.status === 'success' ? 'Enhancement Complete!' : 'Enhancement Failed')}
                    </span>
                    {task.status === 'loading' && (
                      <span className="text-white/80 text-sm font-medium">
                        {Math.round(task.progress)}%
                      </span>
                    )}
                  </div>

                  {task.status === 'loading' && (
                    <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${task.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onCloseTask?.(task.id)}
                    className="ml-auto text-white/60 hover:text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
