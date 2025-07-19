"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max: number
  labelPosition?: 'left' | 'right'
  customLabel?: string
}

export function ProgressBar({ value, max, labelPosition = 'right', customLabel }: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100)
  
  return (
    <div className="w-full space-y-1">
      
      
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-blue-400 origin-left"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 0.6, 
            ease: "easeOut"
          }}
        />
      </div>
      {labelPosition === 'left' && customLabel && (
        <div className="text-xs text-gray-500">{customLabel}</div>
      )}
    </div>
  )
}
