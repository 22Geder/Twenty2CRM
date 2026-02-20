'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function MobileUploadButton() {
  const [isMobile, setIsMobile] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Show tooltip on first visit
    const hasSeenTooltip = localStorage.getItem('upload-tooltip-seen');
    if (!hasSeenTooltip) {
      setTimeout(() => {
        setShowTooltip(true);
        setTimeout(() => {
          setShowTooltip(false);
          localStorage.setItem('upload-tooltip-seen', 'true');
        }, 4000);
      }, 2000);
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't show on app pages
  if (pathname === '/app' || pathname === '/upload-cv' || pathname === '/install') {
    return null;
  }

  // Only show on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Tooltip */}
      {showTooltip && (
        <div className="fixed bottom-24 right-4 z-40 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce text-sm">
          <div className="relative">
            לחץ כאן להעלות קורות חיים 👆
            <div className="absolute -bottom-2 right-4 w-3 h-3 bg-gray-800 transform rotate-45"></div>
          </div>
        </div>
      )}
      
      {/* Floating Action Button */}
      <Link
        href="/app"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-[#00A8A8] to-[#008888] rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-200"
        aria-label="העלאת קורות חיים"
        onClick={() => setShowTooltip(false)}
      >
        {/* Upload Icon */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-8 h-8" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={2}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" 
          />
        </svg>
        
        {/* Pulse Animation */}
        <span className="absolute w-full h-full rounded-full bg-[#00A8A8] animate-ping opacity-30"></span>
      </Link>
      
      {/* Bottom spacing for safe area */}
      <style jsx global>{`
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .fixed.bottom-6 {
            bottom: calc(1.5rem + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </>
  );
}
