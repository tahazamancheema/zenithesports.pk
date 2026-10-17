/**
 * Original illustrations. These are NOT screenshots of ZenithProduction or
 * ZenithPoints and are always captioned as illustrations.
 */

export function IllustrationTag({ children = 'Illustration' }: { children?: React.ReactNode }) {
  return (
    <span className="t-label absolute top-3 left-3 z-10 rounded-xs border border-line-2 bg-void/80 px-2 py-1 !text-[10px] backdrop-blur">
      {children}
    </span>
  )
}

/** A broadcast frame: live standings column, lower third, kill-feed style ticks. */
export function BroadcastFrame({ animated = true }: { animated?: boolean }) {
  const rows = [92, 78, 71, 64, 58, 52, 47, 40]
  return (
    <svg viewBox="0 0 640 360" className="w-full" role="img" aria-label="Illustration of a broadcast layout: live standings, lower third and on-air tally">
      <defs>
        <linearGradient id="bf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141924" />
          <stop offset="1" stopColor="#0a0c10" />
        </linearGradient>
        <pattern id="bf-scan" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill="#fff" opacity="0.025" />
        </pattern>
      </defs>
      <rect width="640" height="360" fill="url(#bf-sky)" />
      {/* abstract terrain */}
      <path d="M0 250 L90 214 L170 236 L260 190 L350 222 L430 200 L520 232 L640 206 L640 360 L0 360 Z" fill="#11151d" />
      <path d="M0 286 L120 262 L240 280 L380 254 L500 276 L640 258 L640 360 L0 360 Z" fill="#0d1016" />
      <rect width="640" height="360" fill="url(#bf-scan)" />

      {/* live standings */}
      <g transform="translate(18 26)">
        <rect width="150" height="20" fill="var(--color-prod)" />
        <text x="8" y="14" fontSize="9" letterSpacing="1.6" fill="#0a0b0e" className="font-mono">
          LIVE STANDINGS
        </text>
        {rows.map((w, i) => (
          // CSS transform would override the SVG transform attribute, so animate an inner group.
          <g key={i} transform={`translate(0 ${24 + i * 17})`}>
          <g style={animated ? { animation: `rise 600ms var(--ease-out-expo) ${300 + i * 70}ms both` } : undefined}>
            <rect width="150" height="15" fill="#0b0d12" opacity="0.92" />
            <rect width="16" height="15" fill={i < 3 ? 'var(--color-prod)' : '#1d222c'} opacity={i < 3 ? 0.85 : 1} />
            <text x="8" y="11" fontSize="8" textAnchor="middle" fill={i < 3 ? '#0a0b0e' : '#a6aebb'} className="font-mono">
              {i + 1}
            </text>
            <rect x="22" y="5" width={w * 0.8} height="5" fill="#a6aebb" opacity="0.5" />
            <rect x="124" y="4" width="20" height="7" fill="#edf0f5" opacity="0.75" />
          </g>
          </g>
        ))}
      </g>

      {/* lower third */}
      <g transform="translate(190 300)">
<g style={animated ? { animation: 'rise 800ms var(--ease-out-expo) 900ms both' } : undefined}>
        <rect width="300" height="36" fill="#0b0d12" opacity="0.95" />
        <rect width="6" height="36" fill="var(--color-prod)" />
        <rect x="18" y="9" width="150" height="7" fill="#edf0f5" opacity="0.85" />
        <rect x="18" y="22" width="96" height="5" fill="#a6aebb" opacity="0.6" />
        <rect x="236" y="0" width="64" height="36" fill="#141924" />
        <text x="268" y="22" fontSize="9" textAnchor="middle" fill="#a6aebb" className="font-mono">
          M 3/6
        </text>
      </g>
      </g>

      {/* player pop-up */}
      <g transform="translate(470 120)">
<g style={animated ? { animation: 'rise 700ms var(--ease-out-expo) 1400ms both' } : undefined}>
        <rect width="150" height="54" fill="#0b0d12" opacity="0.95" />
        <rect width="150" height="3" fill="var(--color-prod)" />
        <rect x="12" y="14" width="26" height="26" fill="#1d222c" />
        <rect x="48" y="16" width="80" height="7" fill="#edf0f5" opacity="0.85" />
        <rect x="48" y="30" width="54" height="5" fill="var(--color-prod)" opacity="0.8" />
      </g>
      </g>

      {/* tally */}
      <g transform="translate(588 18)">
        <circle cx="0" cy="8" r="4" fill="var(--color-prod)" style={animated ? { animation: 'blink 1.6s steps(1) infinite' } : undefined} />
        <text x="-10" y="11" fontSize="9" textAnchor="end" fill="#edf0f5" letterSpacing="1.5" className="font-mono">
          ON AIR
        </text>
      </g>
      {/* safe-area guides */}
      <rect x="10" y="10" width="620" height="340" fill="none" stroke="#fff" strokeOpacity="0.06" strokeDasharray="3 5" />
    </svg>
  )
}

/** A phone with a leaderboard — for ZenithPoints (app in development). */
export function PointsPhone({ animated = true }: { animated?: boolean }) {
  const rows = [
    [1, 86],
    [2, 74],
    [3, 69],
    [4, 61],
    [5, 55],
    [6, 49],
    [7, 42],
  ]
  return (
    <svg viewBox="0 0 260 520" className="w-full" role="img" aria-label="Illustration of a mobile leaderboard">
      <rect x="2" y="2" width="256" height="516" rx="38" fill="#0b0d11" stroke="var(--color-line-3)" />
      <rect x="14" y="14" width="232" height="492" rx="28" fill="#10131a" />
      <rect x="100" y="24" width="60" height="16" rx="8" fill="#06070a" />
      <text x="30" y="78" fontSize="9" letterSpacing="1.8" fill="var(--color-pts)" className="font-mono">
        MATCH 4 · RESULTS
      </text>
      <rect x="30" y="88" width="120" height="10" fill="#edf0f5" opacity="0.85" />
      <g transform="translate(30 116)">
        {rows.map(([rank, w], i) => (
          <g key={rank} transform={`translate(0 ${i * 44})`}>
          <g style={animated ? { animation: `rise 600ms var(--ease-out-expo) ${400 + i * 90}ms both` } : undefined}>
            <rect width="200" height="36" rx="6" fill={i === 0 ? 'color-mix(in oklab, var(--color-pts) 18%, #10131a)' : '#161a22'} />
            <text x="16" y="23" fontSize="11" fill={i === 0 ? 'var(--color-pts)' : '#a6aebb'} className="font-mono">
              {String(rank).padStart(2, '0')}
            </text>
            <rect x="40" y="13" width={w} height="9" rx="2" fill="#a6aebb" opacity="0.55" />
            <rect x="160" y="11" width="28" height="13" rx="3" fill={i === 0 ? 'var(--color-pts)' : '#2a303b'} />
          </g>
          </g>
        ))}
      </g>
      <rect x="30" y="440" width="200" height="40" rx="8" fill="var(--color-pts)" />
      <text x="130" y="465" fontSize="10" letterSpacing="2" textAnchor="middle" fill="#0a0b0e" className="font-mono">
        SAVE RESULTS
      </text>
    </svg>
  )
}
