'use client'

import { useRef } from 'react'
import { useSequence } from '../motion'

const STEPS = ['Evidence received', 'Scanning both screenshots', 'UID located in each', 'Reviewer confirms the match']

/**
 * Illustration of the core rule: a report counts only when a reviewer has
 * matched the reported UID across both screenshots.
 */
export function UidMatch() {
  const ref = useRef<HTMLDivElement>(null)
  const { active, reduce } = useSequence(4, 1900, ref)
  const step = reduce ? 3 : active
  const frame = (x: number, title: string, kind: 'report' | 'profile') => (
    <g transform={`translate(${x} 20)`}>
      <rect width="200" height="300" rx="10" fill="var(--color-ink-1)" stroke={step >= 2 ? 'var(--color-ac)' : 'var(--color-line-3)'} style={{ transition: 'stroke 500ms' }} />
      <text x="16" y="28" className="font-mono" fontSize="9" letterSpacing="1.6" fill="var(--color-fg-3)">
        {title}
      </text>
      {kind === 'report' ? (
        <g>
          <rect x="16" y="48" width="168" height="70" rx="6" fill="var(--color-ink-3)" />
          <circle cx="40" cy="83" r="12" fill="none" stroke="var(--color-ok)" strokeWidth="1.5" />
          <path d="M34 83l4 4 8-8" fill="none" stroke="var(--color-ok)" strokeWidth="1.5" />
          <rect x="62" y="74" width="100" height="6" fill="var(--color-fg-2)" opacity="0.6" />
          <rect x="62" y="86" width="70" height="5" fill="var(--color-fg-3)" opacity="0.6" />
          {[0, 1, 2, 3].map((r) => (
            <rect key={r} x="16" y={138 + r * 22} width={168 - r * 24} height="7" fill="var(--color-fg-3)" opacity="0.35" />
          ))}
        </g>
      ) : (
        <g>
          <circle cx="56" cy="88" r="32" fill="var(--color-ink-3)" />
          <rect x="100" y="66" width="80" height="8" fill="var(--color-fg-2)" opacity="0.6" />
          <rect x="100" y="82" width="56" height="6" fill="var(--color-fg-3)" opacity="0.6" />
          {[0, 1, 2].map((r) => (
            <rect key={r} x="16" y={150 + r * 22} width={150 - r * 30} height="7" fill="var(--color-fg-3)" opacity="0.35" />
          ))}
        </g>
      )}
      {/* the UID token */}
      <g transform={`translate(16 ${kind === 'report' ? 236 : 232})`}>
        <rect width="168" height="28" rx="4" fill={step >= 2 ? 'color-mix(in oklab, var(--color-ac) 16%, transparent)' : 'var(--color-ink-3)'} stroke={step >= 2 ? 'var(--color-ac)' : 'transparent'} style={{ transition: 'all 500ms' }} />
        <text x="12" y="18" className="font-mono" fontSize="11" letterSpacing="1.4" fill={step >= 2 ? 'var(--color-fg)' : 'var(--color-fg-3)'}>
          UID 51•••••789
        </text>
      </g>
      {/* scan line */}
      {step === 1 && (
        <rect x="0" y="0" width="200" height="2" fill="var(--color-ac)" opacity="0.8">
          <animate attributeName="y" from="10" to="290" dur="1.8s" repeatCount="1" fill="freeze" />
        </rect>
      )}
    </g>
  )

  return (
    <div ref={ref} className="relative">
      <svg viewBox="0 0 560 360" className="w-full" role="img" aria-label="Illustration: a report screenshot and a profile screenshot are matched by the same UID before a reviewer confirms">
        {frame(20, 'REPORT CONFIRMATION', 'report')}
        {frame(340, 'PLAYER PROFILE', 'profile')}
        {/* match link */}
        <path
          d="M 204 270 C 260 270, 300 266, 356 266"
          fill="none"
          stroke="var(--color-ac)"
          strokeWidth="1.5"
          strokeDasharray="160"
          strokeDashoffset={step >= 2 ? 0 : 160}
          style={{ transition: 'stroke-dashoffset 900ms var(--ease-draw)' }}
        />
        <g transform="translate(280 268)" opacity={step >= 3 ? 1 : 0} style={{ transition: 'opacity 500ms' }}>
          <g transform="rotate(45)">
            <rect x="-11" y="-11" width="22" height="22" fill="var(--color-ac)" />
          </g>
          <path d="M-5 0l3.5 3.5L5-3.5" fill="none" stroke="#06070a" strokeWidth="1.8" />
        </g>
      </svg>
      <ol className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4" aria-label="Review steps">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex items-start gap-2 text-[13px] transition-colors ${i <= step ? 'text-fg' : 'text-fg-3'}`}>
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45" style={{ background: i <= step ? 'var(--color-ac)' : 'var(--color-line-3)' }} />
            {s}
          </li>
        ))}
      </ol>
    </div>
  )
}
