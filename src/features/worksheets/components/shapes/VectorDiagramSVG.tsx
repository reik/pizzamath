export interface VecSpec {
  dx: number
  dy: number
  fromX?: number
  fromY?: number
  label?: string
  dashed?: boolean
}

interface VectorDiagramSVGProps {
  vectors: VecSpec[]
}

const PALETTE = ['#ea580c', '#2563eb', '#16a34a', '#9333ea']

function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill={color} />
    </marker>
  )
}

export function VectorDiagramSVG({ vectors }: VectorDiagramSVGProps) {
  const VW = 200, VH = 170, PAD = 24

  const pts: [number, number][] = [[0, 0]]
  for (const v of vectors) {
    const fx = v.fromX ?? 0, fy = v.fromY ?? 0
    pts.push([fx, fy], [fx + v.dx, fy + v.dy])
  }

  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  let minX = Math.min(...xs, 0), maxX = Math.max(...xs, 0)
  let minY = Math.min(...ys, 0), maxY = Math.max(...ys, 0)
  const mx = (maxX - minX) * 0.18 || 1
  const my = (maxY - minY) * 0.18 || 1
  minX -= mx; maxX += mx; minY -= my; maxY += my

  const scale = Math.min((VW - 2 * PAD) / (maxX - minX), (VH - 2 * PAD) / (maxY - minY))
  const ox = PAD - minX * scale
  const oy = VH - PAD + minY * scale

  const sv = (mx: number, my: number): [number, number] => [ox + mx * scale, oy - my * scale]

  const [axX0] = sv(minX, 0), [axX1] = sv(maxX, 0)
  const [, axY0] = sv(0, maxY), [, axY1] = sv(0, minY)
  const [originX, originY] = sv(0, 0)

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="160" height="136" className="shrink-0 select-none">
      <defs>
        {PALETTE.map((c, i) => <ArrowMarker key={i} id={`va${i}`} color={c} />)}
        <ArrowMarker id="vaAxis" color="#d1d5db" />
        <ArrowMarker id="vaDash" color="#6b7280" />
      </defs>

      <line x1={axX0} y1={originY} x2={axX1} y2={originY} stroke="#e5e7eb" strokeWidth="1" markerEnd="url(#vaAxis)" />
      <line x1={originX} y1={axY1} x2={originX} y2={axY0} stroke="#e5e7eb" strokeWidth="1" markerEnd="url(#vaAxis)" />
      <circle cx={originX} cy={originY} r="2.5" fill="#9ca3af" />

      {vectors.map((v, i) => {
        const fx = v.fromX ?? 0, fy = v.fromY ?? 0
        const [x1, y1] = sv(fx, fy)
        const [x2, y2] = sv(fx + v.dx, fy + v.dy)
        const color = v.dashed ? '#6b7280' : PALETTE[i % PALETTE.length]
        const markerId = v.dashed ? 'vaDash' : `va${i % PALETTE.length}`
        const dx = x2 - x1, dy = y2 - y1
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const shorten = 9
        const lx2 = len > shorten + 2 ? x2 - (dx / len) * shorten : x2
        const ly2 = len > shorten + 2 ? y2 - (dy / len) * shorten : y2
        const lbx = x2 + (dx / len) * 10
        const lby = y2 - (dy / len) * 10 + (dy >= 0 ? -4 : 12)

        return (
          <g key={i}>
            <line
              x1={x1} y1={y1} x2={lx2} y2={ly2}
              stroke={color} strokeWidth={v.dashed ? 1.5 : 2}
              strokeDasharray={v.dashed ? '5,3' : undefined}
              markerEnd={`url(#${markerId})`}
            />
            {v.label && (
              <text x={lbx} y={lby} textAnchor="middle" fontSize="10" fill={color} fontWeight="500">
                {v.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
