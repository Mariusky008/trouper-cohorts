import { cn } from "@/lib/utils"

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      width="24"
      height="24"
    >
      <path d="M16.6 5.82C15.55 5.82 14.56 5.46 13.76 4.86V15.5C13.76 18.26 11.52 20.5 8.76 20.5C6 20.5 3.76 18.26 3.76 15.5C3.76 12.74 6 10.5 8.76 10.5C9.17 10.5 9.56 10.57 9.93 10.69V14.16C9.57 14.04 9.18 13.97 8.76 13.97C7.91 13.97 7.23 14.65 7.23 15.5C7.23 16.35 7.91 17.03 8.76 17.03C9.61 17.03 10.29 16.35 10.29 15.5V2H13.76C13.76 3.55 15.02 4.81 16.57 4.81V5.82H16.6Z" />
    </svg>
  )
}
