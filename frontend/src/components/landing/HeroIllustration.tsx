"use client";

/**
 * Stylized Mediterranean / French marketplace scene.
 * Pure SVG so it stays crisp at any size and inherits brand colors.
 * Animations are handled with `agora-*` utility classes from globals.css.
 */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Illustration d'une boutique Agora avec produits flottants"
    >
      <defs>
        <linearGradient id="awningGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffa726" />
          <stop offset="100%" stopColor="#fb8c00" />
        </linearGradient>
        <linearGradient id="storeWallGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8eaf6" />
        </linearGradient>
        <linearGradient id="windowGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#5c6bc0" />
          <stop offset="100%" stopColor="#3949ab" />
        </linearGradient>
        <linearGradient id="bagGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffa726" />
          <stop offset="100%" stopColor="#ff7043" />
        </linearGradient>
        <linearGradient id="boxGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#26a69a" />
          <stop offset="100%" stopColor="#00796b" />
        </linearGradient>
        <linearGradient id="parcelGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#e8eaf6" />
          <stop offset="100%" stopColor="#c5cae9" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffa726" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffa726" stopOpacity="0" />
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
          <feOffset dy="6" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.18" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Soft glow halo behind the boutique */}
      <circle cx="260" cy="270" r="220" fill="url(#glow)" />

      {/* Ground shadow */}
      <ellipse cx="260" cy="455" rx="180" ry="14" fill="#1a1a2e" opacity="0.18" />

      {/* === Boutique facade === */}
      <g filter="url(#softShadow)">
        {/* Wall */}
        <rect x="120" y="180" width="280" height="240" rx="14" fill="url(#storeWallGrad)" />
        {/* Cornice */}
        <rect x="112" y="170" width="296" height="18" rx="6" fill="#1a1a2e" />
        {/* Awning stripes */}
        <g>
          <path d="M120 170 L260 130 L400 170 Z" fill="url(#awningGrad)" />
          {/* Awning fringe */}
          <path
            d="M120 168 L140 188 L160 168 L180 188 L200 168 L220 188 L240 168 L260 188 L280 168 L300 188 L320 168 L340 188 L360 168 L380 188 L400 168 Z"
            fill="#fb8c00"
          />
          {/* Stripe overlays */}
          <path d="M150 156 L260 130 L260 130 L168 162 Z" fill="#ffffff" opacity="0.22" />
          <path d="M260 130 L370 156 L352 162 L260 130 Z" fill="#1a1a2e" opacity="0.1" />
        </g>

        {/* Sign — “Agora” */}
        <rect x="180" y="196" width="160" height="36" rx="8" fill="#1a1a2e" />
        <text
          x="260"
          y="221"
          textAnchor="middle"
          fontFamily="Sora, sans-serif"
          fontWeight="700"
          fontSize="20"
          fill="#ffa726"
          letterSpacing="2"
        >
          AGORA
        </text>

        {/* Window frame */}
        <rect x="148" y="252" width="224" height="120" rx="10" fill="#1a1a2e" />
        <rect x="156" y="260" width="208" height="104" rx="6" fill="url(#windowGrad)" />
        {/* Window light reflections */}
        <path
          d="M156 260 L208 260 L172 364 L156 364 Z"
          fill="#ffffff"
          opacity="0.18"
        />
        {/* Mannequin / display silhouette */}
        <circle cx="220" cy="295" r="14" fill="#ffffff" opacity="0.85" />
        <path
          d="M204 312 Q220 304 236 312 L240 354 L200 354 Z"
          fill="#ffffff"
          opacity="0.85"
        />
        {/* Shelf */}
        <rect x="260" y="296" width="92" height="6" rx="2" fill="#ffffff" opacity="0.7" />
        <rect x="266" y="270" width="14" height="26" rx="3" fill="#ffa726" />
        <rect x="286" y="278" width="14" height="18" rx="3" fill="#26a69a" />
        <rect x="306" y="266" width="14" height="30" rx="3" fill="#e8eaf6" />
        <rect x="326" y="282" width="14" height="14" rx="3" fill="#ffa726" />

        {/* Door */}
        <rect x="232" y="380" width="56" height="40" rx="6" fill="#1a1a2e" />
        <rect x="238" y="386" width="20" height="30" rx="3" fill="#5c6bc0" />
        <rect x="262" y="386" width="20" height="30" rx="3" fill="#5c6bc0" />
        <circle cx="260" cy="402" r="2" fill="#ffa726" />

        {/* Pots / decoration */}
        <rect x="128" y="396" width="20" height="22" rx="3" fill="#26a69a" />
        <path
          d="M138 396 q-14 -16 -4 -28 q12 12 4 28 z"
          fill="#26a69a"
          opacity="0.85"
        />
        <rect x="372" y="396" width="20" height="22" rx="3" fill="#26a69a" />
        <path
          d="M382 396 q14 -16 4 -28 q-12 12 -4 28 z"
          fill="#26a69a"
          opacity="0.85"
        />
      </g>

      {/* === Floating shopping bag (right) === */}
      <g className="agora-float-slow" style={{ transformOrigin: "420px 200px" }}>
        <g filter="url(#softShadow)">
          <path
            d="M388 168 L452 168 L460 232 Q460 244 448 244 L392 244 Q380 244 380 232 Z"
            fill="url(#bagGrad)"
          />
          <path
            d="M404 168 Q404 152 420 152 Q436 152 436 168"
            stroke="#ffffff"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Logo on bag */}
          <path d="M420 192 L432 214 L408 214 Z" fill="#ffffff" opacity="0.95" />
          <path d="M420 200 L428 214 L412 214 Z" fill="#1a1a2e" />
        </g>
      </g>

      {/* === Floating parcel box (left) === */}
      <g className="agora-float-mid" style={{ transformOrigin: "100px 280px" }}>
        <g filter="url(#softShadow)">
          <rect x="60" y="252" width="84" height="74" rx="6" fill="url(#parcelGrad)" />
          <rect x="60" y="252" width="84" height="20" rx="6" fill="#c5cae9" />
          <rect x="96" y="252" width="12" height="74" fill="#ffa726" />
          <path
            d="M102 244 q-6 -10 0 -18 q6 8 0 18 z"
            fill="#ffa726"
          />
          <path
            d="M102 244 q6 -10 0 -18 q-6 8 0 18 z"
            fill="#fb8c00"
          />
        </g>
      </g>

      {/* === Floating gift box (top-right) === */}
      <g className="agora-float-fast" style={{ transformOrigin: "440px 90px" }}>
        <g filter="url(#softShadow)">
          <rect x="408" y="64" width="72" height="56" rx="6" fill="url(#boxGrad)" />
          <rect x="408" y="64" width="72" height="14" rx="6" fill="#00897b" />
          <rect x="438" y="64" width="12" height="56" fill="#ffa726" />
          <path
            d="M444 56 q-8 -8 0 -16 q8 8 0 16 z"
            fill="#ffa726"
          />
        </g>
      </g>

      {/* === Sparkles === */}
      <g>
        <circle cx="80" cy="120" r="4" fill="#ffa726" className="agora-twinkle" />
        <circle
          cx="460"
          cy="320"
          r="3"
          fill="#ffa726"
          className="agora-twinkle"
          style={{ animationDelay: "0.6s" }}
        />
        <circle
          cx="380"
          cy="150"
          r="3"
          fill="#ffffff"
          className="agora-twinkle"
          style={{ animationDelay: "1.1s" }}
        />
        <circle
          cx="160"
          cy="100"
          r="3"
          fill="#ffffff"
          className="agora-twinkle"
          style={{ animationDelay: "1.5s" }}
        />
        <path
          d="M440 220 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 z"
          fill="#ffa726"
          className="agora-twinkle"
          style={{ animationDelay: "0.3s" }}
        />
        <path
          d="M70 360 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 z"
          fill="#ffa726"
          className="agora-twinkle"
          style={{ animationDelay: "0.9s" }}
        />
      </g>
    </svg>
  );
}
