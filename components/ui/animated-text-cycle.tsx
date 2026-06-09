'use client'

import * as React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence, type Variants } from "framer-motion"

interface AnimatedTextCycleProps {
  words:     string[]
  interval?: number
  className?: string
}

export default function AnimatedTextCycle({
  words,
  interval  = 3000,
  className = "",
}: AnimatedTextCycleProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % words.length)
    }, interval)
    return () => clearInterval(timer)
  }, [interval, words.length])

  const containerVariants: Variants = {
    hidden:  { y: -20, opacity: 0, filter: "blur(8px)" },
    visible: { y: 0,   opacity: 1, filter: "blur(0px)",
      transition: { duration: 0.4, ease: "easeOut" as const } },
    exit:    { y: 20,  opacity: 0, filter: "blur(8px)",
      transition: { duration: 0.3, ease: "easeIn" as const } },
  }

  return (
    <>
      {/* Palavra animada */}
      <span className="relative inline-block max-w-full align-top">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={currentIndex}
            className={`inline-block font-black ${className}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  )
}
