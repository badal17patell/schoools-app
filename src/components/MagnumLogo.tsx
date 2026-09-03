import React, { useState, useEffect } from 'react';

interface MagnumLogoProps {
  variant?: 'full' | 'icon' | 'crest' | 'header';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  darkBg?: boolean;
}

export const MagnumLogo: React.FC<MagnumLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  darkBg = true,
}) => {
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('magnum_custom_logo_url');
    if (saved) {
      setCustomLogoUrl(saved);
    }
  }, []);

  // Determine pixel sizes
  let dimension = 48;
  if (typeof size === 'number') {
    dimension = size;
  } else {
    switch (size) {
      case 'xs':
        dimension = 24;
        break;
      case 'sm':
        dimension = 36;
        break;
      case 'md':
        dimension = 48;
        break;
      case 'lg':
        dimension = 84;
        break;
      case 'xl':
        dimension = 140;
        break;
    }
  }

  const logoSrc = customLogoUrl || '/assets/magnum-logo.svg';

  // Pure winged M crest (rendered as crisp inline SVG)
  if (variant === 'icon' || variant === 'crest') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-xl overflow-hidden shadow-xs shrink-0 select-none bg-black border border-[#d4af37]/40 ${className}`}
        style={{ width: dimension, height: dimension }}
      >
        <svg
          viewBox="90 50 320 270"
          className="w-full h-full object-contain p-1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="crestGoldLinear" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE899" />
              <stop offset="25%" stopColor="#DEB038" />
              <stop offset="50%" stopColor="#FDF0A6" />
              <stop offset="75%" stopColor="#B8860B" />
              <stop offset="100%" stopColor="#8F6205" />
            </linearGradient>
            <linearGradient id="crestGoldLight" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ECC658" />
              <stop offset="40%" stopColor="#FFF5C2" />
              <stop offset="70%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#9C6F0A" />
            </linearGradient>
            <linearGradient id="crestGoldDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ECC554" />
              <stop offset="60%" stopColor="#AA771C" />
              <stop offset="100%" stopColor="#6B4702" />
            </linearGradient>
          </defs>

          <g transform="translate(250, 185)">
            <path
              d="M -15 -92 A 118 118 0 1 1 -116 18"
              fill="none"
              stroke="url(#crestGoldLinear)"
              strokeWidth="13"
              strokeLinecap="round"
            />
            <path
              d="M -15 -92 A 118 118 0 1 1 -116 18"
              fill="none"
              stroke="url(#crestGoldLight)"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M -15 -92 C -75 -105 -150 -60 -185 -10 C -160 5 -125 -5 -85 -20 C -60 -30 -30 -50 -15 -92 Z"
              fill="url(#crestGoldLight)"
            />
            <path
              d="M -50 -32 C -115 -35 -165 0 -178 30 C -150 32 -120 20 -80 0 C -65 -8 -55 -18 -50 -32 Z"
              fill="url(#crestGoldLinear)"
            />
            <path
              d="M -60 -5 C -120 2 -155 35 -162 62 C -135 55 -110 38 -75 20 C -65 14 -60 5 -60 -5 Z"
              fill="url(#crestGoldDark)"
            />
            <path
              d="M -65 18 C -110 30 -138 60 -140 85 C -118 72 -98 52 -72 35 C -68 30 -65 24 -65 18 Z"
              fill="url(#crestGoldLinear)"
            />
            <path
              d="M -180 -8 C -135 -1 -80 -25 -20 -90"
              fill="none"
              stroke="#FFFBE0"
              strokeWidth="2.5"
              opacity="0.8"
            />
            <path
              d="M -175 30 C -135 22 -95 6 -52 -30"
              fill="none"
              stroke="#FFFBE0"
              strokeWidth="2"
              opacity="0.7"
            />
            <path
              d="M -52 68 L -52 -45 L -42 -45 L 8 40 L 16 40 L 66 -45 L 76 -45 L 76 68 L 62 68 L 62 -22 L 18 58 L 6 58 L -38 -22 L -38 68 Z"
              fill="url(#crestGoldLinear)"
            />
            <polygon
              points="-52,-45 -42,-45 12,42 6,42"
              fill="url(#crestGoldLight)"
            />
            <polygon
              points="66,-45 76,-45 76,68 68,68"
              fill="url(#crestGoldLight)"
            />
            <polygon
              points="-38,-22 8,40 16,40 66,-45 62,-45 12,32"
              fill="url(#crestGoldDark)"
              opacity="0.75"
            />
            <rect x="-58" y="64" width="26" height="5" rx="1.5" fill="url(#crestGoldLight)" />
            <rect x="56" y="64" width="26" height="5" rx="1.5" fill="url(#crestGoldLight)" />
            <rect x="-58" y="-48" width="20" height="4" rx="1" fill="url(#crestGoldLight)" />
            <rect x="62" y="-48" width="20" height="4" rx="1" fill="url(#crestGoldLight)" />
          </g>
        </svg>
      </div>
    );
  }

  // Full brand lockup showing the complete logo image
  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${
        darkBg ? 'bg-[#050505] text-[#f7e18c] rounded-2xl p-3 shadow-md border border-[#d4af37]/30' : ''
      } ${className}`}
      style={{
        width: typeof size === 'number' ? size : dimension * 2.2,
        maxWidth: '100%',
      }}
    >
      <img
        src={logoSrc}
        alt="Magnum School Uniform - Quality You Can Trust"
        className="w-full h-auto object-contain rounded-xl"
      />
    </div>
  );
};

