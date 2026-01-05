import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractTikTokUsername(input: string | null | undefined): string | null {
  if (!input) return null;
  
  try {
    // Clean input
    const clean = input.trim();
    
    // Case 1: Full URL with @ (e.g. https://www.tiktok.com/@username/video/...)
    if (clean.includes('tiktok.com/@')) {
       const match = clean.match(/@([a-zA-Z0-9_.-]+)/);
       if (match && match[1]) return match[1];
    }
    
    // Case 2: Just @username
    if (clean.startsWith('@')) {
       return clean.substring(1);
    }
    
    // Case 3: Simple username (no spaces, no slashes, not a url, reasonable length)
    // Avoid returning "http:" or "https:" as username if parsing fails
    if (!clean.includes('/') && !clean.includes(' ') && !clean.includes(':') && clean.length > 1) {
       return clean;
    }
    
    return null;
  } catch (e) {
    return null;
  }
}
