interface TriangleSVGProps {
  /** Angles at A (bottom-left), B (bottom-right), C (top) in degrees */
  angleA: number
  angleB: number
  angleC: number
  sideA?: string
  sideB?: string
  sideC?: string
  label?: string
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

function computeVertices(angleA: number, angleB: number, angleC: number, vw: number, vh: number, pad: number) {
  const t = Math.sin(toRad(angleB)) / Math.sin(toRad(angleC))
  const Cx = t * Math.cos(toRad(angleA))
  const Cy = t * Math.sin(toRad(angleA))

  const xs = [0, 1, Cx], ys = [0, 0, Cy]
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const w = maxX - minX || 1
  const h = maxY - minY || 1

  const scale = Math.min((vw - 2 * pad) / w, (vh - 2 * pad) / h)
  const ox = pad + ((vw - 2 * pad) - w * scale) / 2 - minX * scale
  const oy = vh - pad - ((vh - 2 * pad) - h * scale) / 2 + minY * scale

  const s = (x: number, y: number): [number, number] => [ox + x * scale, oy - y * scale]
  return { A: s(0, 0), B: s(1, 0), C: s(Cx, Cy) }
}

function outward(vx: number, vy: number, cx: number, cy: number, d = 16): [number, number] {
  const dx = vx - cx, dy = vy - cy
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  return [vx + (dx / len) * d, vy + (dy / len) * d]
}

function midOutward(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, d = 13): [number, number] {
  const mx = (ax + bx) / 2, my = (ay + by) / 2
  return outward(mx, my, cx, cy, d)
}

function RightMarker({ vx, vy, d1x, d1y, d2x, d2y }: {
  vx: number; vy: number; d1x: number; d1y: number; d2x: number; d2y: number
}) {
  const sz = 10
  const n1 = Math.sqrt(d1x * d1x + d1y * d1y) || 1
  const n2 = Math.sqrt(d2x * d2x + d2y * d2y) || 1
  const u1x = d1x / n1 * sz, u1y = d1y / n1 * sz
  const u2x = d2x / n2 * sz, u2y = d2y / n2 * sz
  return (
    <polyline
      points={`${vx+u1x},${vy+u1y} ${vx+u1x+u2x},${vy+u1y+u2y} ${vx+u2x},${vy+u2y}`}
      fill="none" stroke="#ea580c" strokeWidth="1.5"
    />
  )
}

export function TriangleSVG({ angleA, angleB, angleC, sideA, sideB, sideC, label }: TriangleSVGProps) {
  const VW = 200, VH = 160, PAD = 28
  const { A, B, C } = computeVertices(angleA, angleB, angleC, VW, VH, PAD)
  const pts = `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`
  const cx = (A[0] + B[0] + C[0]) / 3
  const cy = (A[1] + B[1] + C[1]) / 3

  const [laX, laY] = outward(A[0], A[1], cx, cy)
  const [lbX, lbY] = outward(B[0], B[1], cx, cy)
  const [lcX, lcY] = outward(C[0], C[1], cx, cy)

  const [mABx, mABy] = midOutward(A[0], A[1], B[0], B[1], cx, cy)
  const [mBCx, mBCy] = midOutward(B[0], B[1], C[0], C[1], cx, cy)
  const [mACx, mACy] = midOutward(A[0], A[1], C[0], C[1], cx, cy)

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="160" height="128" className="shrink-0 select-none">
      {label && (
        <text x={VW / 2} y="11" textAnchor="middle" fontSize="10" fill="#6b7280" fontStyle="italic">{label}</text>
      )}

      <polygon points={pts} fill="#fff7ed" stroke="#ea580c" strokeWidth="2" />

      {Math.abs(angleA - 90) < 1 && (
        <RightMarker vx={A[0]} vy={A[1]} d1x={B[0]-A[0]} d1y={B[1]-A[1]} d2x={C[0]-A[0]} d2y={C[1]-A[1]} />
      )}
      {Math.abs(angleB - 90) < 1 && (
        <RightMarker vx={B[0]} vy={B[1]} d1x={A[0]-B[0]} d1y={A[1]-B[1]} d2x={C[0]-B[0]} d2y={C[1]-B[1]} />
      )}
      {Math.abs(angleC - 90) < 1 && (
        <RightMarker vx={C[0]} vy={C[1]} d1x={A[0]-C[0]} d1y={A[1]-C[1]} d2x={B[0]-C[0]} d2y={B[1]-C[1]} />
      )}

      <text x={laX} y={laY} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#374151">{angleA}°</text>
      <text x={lbX} y={lbY} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#374151">{angleB}°</text>
      <text x={lcX} y={lcY} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#374151">{angleC}°</text>

      {sideA && <text x={mABx} y={mABy} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#1d4ed8">{sideA}</text>}
      {sideB && <text x={mACx} y={mACy} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#1d4ed8">{sideB}</text>}
      {sideC && <text x={mBCx} y={mBCy} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#1d4ed8">{sideC}</text>}
    </svg>
  )
}
