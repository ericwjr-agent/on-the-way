export default function CybertruckIcon({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="ct-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Body fill — subtle cyan tint */}
      <polygon
        points="4,54 4,36 12,22 42,14 72,14 80,24 106,24 112,32 116,42 116,54"
        fill="#00d4ff"
        opacity="0.10"
      />

      {/* Body outline — glowing cyan */}
      <polygon
        points="4,54 4,36 12,22 42,14 72,14 80,24 106,24 112,32 116,42 116,54"
        fill="none"
        stroke="#00d4ff"
        strokeWidth="2"
        strokeLinejoin="miter"
        filter="url(#ct-glow)"
      />

      {/* Windshield */}
      <polygon
        points="12,22 42,14 42,28 18,34"
        fill="#00d4ff"
        opacity="0.08"
        stroke="#00d4ff"
        strokeWidth="0.75"
        strokeOpacity="0.4"
      />

      {/* Front light bar */}
      <line x1="4" y1="36" x2="4" y2="44"
        stroke="#00d4ff" strokeWidth="3" strokeLinecap="round"
        filter="url(#ct-glow)" opacity="0.9"/>

      {/* Rear light bar */}
      <line x1="116" y1="36" x2="116" y2="44"
        stroke="#ff4560" strokeWidth="3" strokeLinecap="round" opacity="0.8"/>

      {/* Undercarriage line */}
      <line x1="4" y1="54" x2="116" y2="54"
        stroke="#00d4ff" strokeWidth="1" opacity="0.3"/>

      {/* Front wheel */}
      <circle cx="30"  cy="54" r="11" fill="#0a0a0a" stroke="#00d4ff" strokeWidth="1.5"/>
      <circle cx="30"  cy="54" r="5"  fill="#00d4ff" opacity="0.2"/>
      <circle cx="30"  cy="54" r="2.5" fill="#00d4ff" filter="url(#ct-glow)"/>

      {/* Rear wheel */}
      <circle cx="92"  cy="54" r="11" fill="#0a0a0a" stroke="#00d4ff" strokeWidth="1.5"/>
      <circle cx="92"  cy="54" r="5"  fill="#00d4ff" opacity="0.2"/>
      <circle cx="92"  cy="54" r="2.5" fill="#00d4ff" filter="url(#ct-glow)"/>
    </svg>
  );
}
