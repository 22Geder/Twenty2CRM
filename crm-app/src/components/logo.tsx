import React from 'react'
import Image from 'next/image'

// לוגו אמיתי מתמונה - להשתמש כאשר יש קובץ לוגו
export function Twenty2JobsLogoImage({ className = "h-12 w-auto", width = 200, height = 60 }: { 
  className?: string
  width?: number
  height?: number 
}) {
  return (
    <Image 
      src="/logo.jpeg" 
      alt="Twenty22Jobs Logo" 
      width={width}
      height={height}
      className={className}
      priority
    />
  )
}

export function Twenty2JobsLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Number "22" */}
      <text x="5" y="35" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#00A8A8">
        22
      </text>
      
      {/* "JOBS" text */}
      <text x="50" y="35" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="600" fill="#1E293B">
        JOBS
      </text>
      
      {/* Accent line */}
      <rect x="5" y="40" width="100" height="3" fill="#FF8C00" rx="1.5" />
    </svg>
  )
}

export function Twenty2JobsLogoFull({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        {/* Icon circle */}
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">22</span>
        </div>
        {/* Accent dot */}
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full border-2 border-white"></div>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-gray-900 leading-none">Twenty2</span>
        <span className="text-sm font-semibold text-teal-600 leading-none">JOBS</span>
      </div>
    </div>
  )
}

export function Twenty2JobsLogoCompact({ className = "" }: { className?: string }) {
  return (
    <div className="relative">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
        <span className="text-white font-bold text-lg">22</span>
      </div>
      <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full border-2 border-white animate-pulse"></div>
    </div>
  )
}
