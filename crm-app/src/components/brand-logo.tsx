// ========================================================================
// Twenty2Jobs Premium Logo Component
// ========================================================================

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
  showTagline?: boolean;
}

const sizeMap = {
  sm: { logo: 32, text: 'text-lg', tagline: 'text-xs' },
  md: { logo: 48, text: 'text-xl', tagline: 'text-sm' },
  lg: { logo: 64, text: 'text-2xl', tagline: 'text-base' },
  xl: { logo: 96, text: 'text-4xl', tagline: 'text-lg' },
};

export default function Logo({ 
  size = 'md', 
  variant = 'full', 
  className = '',
  showTagline = false 
}: LogoProps) {
  const { logo, text, tagline } = sizeMap[size];

  // SVG Logo matching the brand
  const LogoIcon = () => (
    <svg 
      width={logo} 
      height={logo} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Network Circle Background */}
      <circle cx="50" cy="50" r="45" fill="url(#networkGradient)" opacity="0.1"/>
      
      {/* Network Lines */}
      <g stroke="#7CB342" strokeWidth="1" opacity="0.6">
        <circle cx="50" cy="50" r="40" fill="none"/>
        <circle cx="50" cy="50" r="30" fill="none"/>
        <circle cx="50" cy="50" r="20" fill="none"/>
        {/* Radial lines */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
          <line 
            key={angle}
            x1="50" 
            y1="50" 
            x2={50 + 40 * Math.cos(angle * Math.PI / 180)} 
            y2={50 + 40 * Math.sin(angle * Math.PI / 180)}
          />
        ))}
      </g>
      
      {/* Network Dots */}
      <g fill="#7CB342">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <circle 
            key={angle}
            cx={50 + 40 * Math.cos(angle * Math.PI / 180)} 
            cy={50 + 40 * Math.sin(angle * Math.PI / 180)}
            r="3"
          />
        ))}
      </g>
      
      {/* Number 2 - Teal */}
      <text 
        x="30" 
        y="65" 
        fill="url(#tealGradient)" 
        fontSize="42" 
        fontWeight="bold" 
        fontFamily="Arial, sans-serif"
      >
        2
      </text>
      
      {/* Number 2 - Orange */}
      <text 
        x="55" 
        y="65" 
        fill="url(#orangeGradient)" 
        fontSize="42" 
        fontWeight="bold" 
        fontFamily="Arial, sans-serif"
      >
        2
      </text>
      
      {/* Orange Arc */}
      <path 
        d="M 20 75 Q 50 85 80 75" 
        stroke="#FF8C00" 
        strokeWidth="4" 
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D4D4"/>
          <stop offset="100%" stopColor="#008080"/>
        </linearGradient>
        <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB347"/>
          <stop offset="100%" stopColor="#E67300"/>
        </linearGradient>
        <radialGradient id="networkGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7CB342"/>
          <stop offset="100%" stopColor="#7CB342" stopOpacity="0"/>
        </radialGradient>
      </defs>
    </svg>
  );

  const LogoText = () => (
    <div className="flex flex-col">
      <div className={`font-bold leading-tight ${text}`}>
        <span className="text-[#00A8A8]">Twenty</span>
        <span className="bg-gradient-to-r from-[#00D4D4] to-[#00A8A8] bg-clip-text text-transparent">2</span>
        <span className="bg-gradient-to-r from-[#FF8C00] to-[#E67300] bg-clip-text text-transparent">2</span>
        <span className="text-[#FF8C00]">Jobs</span>
      </div>
      {showTagline && (
        <div className={`text-gray-500 ${tagline} mt-0.5`}>
          המרכז לעובדים ולמעסיקים בישראל
        </div>
      )}
    </div>
  );

  if (variant === 'icon') {
    return (
      <div className={`flex items-center ${className}`}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`flex items-center ${className}`}>
        <LogoText />
      </div>
    );
  }

  // Full variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon />
      <LogoText />
    </div>
  );
}

// Animated Logo Version
export function AnimatedLogo({ size = 'lg', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  return (
    <div className={`t22-animate-float ${className}`}>
      <Logo size={size} showTagline />
    </div>
  );
}

// Mini Logo for Headers
export function MiniLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00A8A8] to-[#008080] flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-sm">22</span>
      </div>
      <span className="font-bold text-lg">
        <span className="text-[#00A8A8]">Twenty2</span>
        <span className="text-[#FF8C00]">Jobs</span>
      </span>
    </div>
  );
}
