"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { RefreshCw } from "lucide-react"

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const startY = useRef(0)
  const isPulling = useRef(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || refreshing || window.scrollY > 0) return

    const y = e.touches[0].clientY
    const distance = y - startY.current
    
    if (distance > 0) {
      // Prevent native pull to refresh
      if (e.cancelable) {
        e.preventDefault()
      }
      const dampened = Math.min(distance * 0.4, 80)
      setPullDistance(dampened)
    }
  }, [refreshing])

  const handleTouchEnd = useCallback(async () => {
    isPulling.current = false
    
    setPullDistance((prev) => {
      if (prev >= 60 && !refreshing) {
        // Trigger refresh
        setRefreshing(true)
        onRefresh().finally(() => {
          setRefreshing(false)
          setPullDistance(0)
        })
        return 60 // Hold position at 60px while refreshing
      }
      return 0 // Reset if didn't pull far enough
    })
  }, [refreshing, onRefresh])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // passive: false is necessary to preventDefault inside touchmove
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div ref={containerRef} className="min-h-screen">
      <div 
        className="fixed top-0 left-0 w-full flex justify-center z-[100] pointer-events-none transition-transform duration-200"
        style={{
          transform: `translateY(${refreshing ? 60 : pullDistance}px)`,
          opacity: pullDistance > 10 ? 1 : 0
        }}
      >
        <div className="bg-white rounded-full p-2.5 shadow-md flex items-center justify-center -mt-12">
          <RefreshCw 
            className={`w-5 h-5 text-blue-600 ${refreshing ? "animate-spin" : ""}`} 
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      </div>
      
      <div 
        className="transition-transform duration-200 min-h-screen"
        style={{
          transform: `translateY(${refreshing ? 60 : pullDistance}px)`
        }}
      >
        {children}
      </div>
    </div>
  )
}
