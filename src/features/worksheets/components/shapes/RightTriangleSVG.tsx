interface RightTriangleSVGProps {
  hyp?: string
  opp?: string
  adj?: string
  angle?: string
  label?: string
}

export function RightTriangleSVG({ hyp, opp, adj, angle, label }: RightTriangleSVGProps) {
  // A = bottom-left (right angle), B = bottom-right, C = top-left
  const pts = '28,138 168,138 28,22'

  return (
    <svg viewBox="0 0 200 168" width="160" height="135" className="shrink-0 select-none">
      {label && (
        <text x="100" y="12" textAnchor="middle" fontSize="10" fill="#6b7280" fontStyle="italic">
          {label}
        </text>
      )}

      <polygon points={pts} fill="#fff7ed" stroke="#ea580c" strokeWidth="2" />

      {/* Right-angle marker at A */}
      <polyline points="28,118 48,118 48,138" fill="none" stroke="#ea580c" strokeWidth="1.5" />

      {/* Angle arc at B */}
      <path d="M 148,138 A 20 20 0 0 0 168,118" fill="none" stroke="#6b7280" strokeWidth="1.5" />

      {/* Adjacent label — below bottom edge */}
      {adj && (
        <text x="98" y="155" textAnchor="middle" fontSize="11" fill="#1f2937">{adj}</text>
      )}

      {/* Opposite label — left of left edge, upright */}
      {opp && (
        <text x="22" y="83" textAnchor="end" fontSize="11" fill="#1f2937">{opp}</text>
      )}

      {/* Hypotenuse label — above diagonal midpoint, upright */}
      {hyp && (
        <text x="112" y="68" textAnchor="middle" fontSize="11" fill="#1f2937">{hyp}</text>
      )}

      {/* Angle label at B */}
      <text x="141" y="132" fontSize="11" fill={angle ? '#1f2937' : '#6b7280'}>
        {angle ? `${angle}°` : 'θ'}
      </text>
    </svg>
  )
}
