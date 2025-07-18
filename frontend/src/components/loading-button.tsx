"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2 } from "lucide-react"

interface LoadingButtonProps {
  children: React.ReactNode
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
  showArrow?: boolean
  onClick?: () => void
}

export function LoadingButton({
  children,
  variant = "default",
  size = "default",
  className = "",
  showArrow = false,
  onClick,
}: LoadingButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (onClick) {
      setIsLoading(true)
      try {
        await onClick()
      } finally {
        setTimeout(() => setIsLoading(false), 1000)
      }
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isLoading ? "Načítání..." : undefined}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Načítání...
        </>
      ) : (
        <>
          {children}
          {showArrow && <ArrowRight className="ml-2 h-4 w-4" />}
        </>
      )}
    </Button>
  )
}
