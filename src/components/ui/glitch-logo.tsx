import Image from "next/image"
import { cn } from "@/lib/utils"

interface GlitchLogoProps {
  width?: number
  height?: number
  className?: string // Wrapper class
  imageClassName?: string
  sizes?: string
}

export function GlitchLogo({ 
  width = 128, 
  height = 128, 
  className,
  imageClassName,
  sizes
}: GlitchLogoProps) {
  return (
    <div className={cn("glitch-wrapper inline-block relative overflow-hidden rounded-2xl", className)}>
      <Image 
        src="/icon.svg" 
        alt="Popey Logo" 
        width={width} 
        height={height}
        sizes={sizes}
        className={cn("rounded-2xl opacity-0", imageClassName)}
      />
    </div>
  )
}
