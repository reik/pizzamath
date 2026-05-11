import { RightTriangleSVG } from './shapes/RightTriangleSVG'
import { TriangleSVG } from './shapes/TriangleSVG'
import { VectorDiagramSVG, type VecSpec } from './shapes/VectorDiagramSVG'

interface GeometryRendererProps {
  content: string
}

type ShapeResult =
  | { type: 'right-triangle'; hyp?: string; opp?: string; adj?: string; angle?: string; label?: string }
  | { type: 'triangle-angles'; angleA: number; angleB: number; angleC: number; sideA?: string; sideB?: string; sideC?: string }
  | { type: 'vector'; vectors: VecSpec[] }
  | null

function anglesFromSides(a: number, b: number, c: number): [number, number, number] {
  const A = Math.round(Math.acos((b * b + c * c - a * a) / (2 * b * c)) * 180 / Math.PI)
  const B = Math.round(Math.acos((a * a + c * c - b * b) / (2 * a * c)) * 180 / Math.PI)
  return [A, B, 180 - A - B]
}

function detectVectors(text: string): VecSpec[] | null {
  const lo = text.toLowerCase()

  // Parallel / perpendicular: show both vectors from same origin
  const isComparison = lo.includes('parallel') || lo.includes('perpendicular')
  const compMatches = [...text.matchAll(/[⟨<]\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*[⟩>]/g)]
  if (compMatches.length >= 2) {
    return compMatches.slice(0, 2).map((m, i) => ({
      dx: parseFloat(m[1]),
      dy: parseFloat(m[2]),
      label: `v${i + 1}`,
      dashed: i === 1 && !isComparison,
    }))
  }

  // Tip-to-tail addition: two component vectors + dashed resultant
  // e.g. Force A = ⟨4, 0⟩, Force B = ⟨0, 3⟩
  if (compMatches.length === 2) {
    const v1 = { dx: parseFloat(compMatches[0][1]), dy: parseFloat(compMatches[0][2]), label: 'A' }
    const v2 = { dx: parseFloat(compMatches[1][1]), dy: parseFloat(compMatches[1][2]), fromX: v1.dx, fromY: v1.dy, label: 'B' }
    const res: VecSpec = { dx: v1.dx + v2.dx, dy: v1.dy + v2.dy, label: 'R', dashed: true }
    return [v1, v2, res]
  }

  // North/East direction vectors
  const northM = lo.match(/(\d+(?:\.\d+)?)\s*km\/h[^.]*north|north[^.]*?(\d+(?:\.\d+)?)\s*km\/h|(\d+(?:\.\d+)?)\s*km\s+north/)
  const eastM  = lo.match(/(\d+(?:\.\d+)?)\s*km\/h[^.]*east|east[^.]*?(\d+(?:\.\d+)?)\s*km\/h|(\d+(?:\.\d+)?)\s*km\s+east/)

  if (northM || eastM) {
    const n = parseFloat(northM?.[1] ?? northM?.[2] ?? northM?.[3] ?? '0')
    const e = parseFloat(eastM?.[1]  ?? eastM?.[2]  ?? eastM?.[3]  ?? '0')
    const vectors: VecSpec[] = []
    if (n) vectors.push({ dx: 0, dy: n, label: `${n}N` })
    if (e) vectors.push({ dx: e, dy: 0, fromX: 0, fromY: n || 0, label: `${e}E` })
    if (n && e) vectors.push({ dx: e, dy: n, dashed: true, label: 'R' })
    return vectors.length ? vectors : null
  }

  return null
}

function detectShape(text: string): ShapeResult {
  const lo = text.toLowerCase()

  // Vector problems
  const hasVectorKeyword = lo.includes('⟨') || lo.includes('force') ||
    lo.includes('velocity') || lo.includes('displacement') ||
    lo.includes('parallel') || lo.includes('perpendicular') ||
    (lo.includes('north') && /\d/.test(lo)) || (lo.includes('east') && /\d/.test(lo))
  if (hasVectorKeyword) {
    const vecs = detectVectors(text)
    if (vecs) return { type: 'vector', vectors: vecs }
  }

  const isRightTri =
    lo.includes('right triangle') ||
    lo.includes('hypotenuse') ||
    lo.includes('ladder') ||
    lo.includes('ramp') ||
    lo.includes('angle of elevation') ||
    (lo.includes('opposite') && lo.includes('adjacent'))

  if (isRightTri) {
    const hypM = lo.match(/hypotenuse\s*[=:]\s*([\d.]+)/)
    const oppM = lo.match(/opposite\s*[=:]\s*([\d.]+)/)
    const adjM = lo.match(/adjacent\s*[=:]\s*([\d.]+)/)
    const angM = lo.match(/angle\s*[=:]\s*([\d.]+)/)
    const rampM = lo.match(/rises?\s+([\d.]+)\s+[a-z]+\s+over\s+([\d.]+)/)
    const ladderM = lo.match(/([\d.]+)\s*(?:ft|m)\s+ladder/)
    return {
      type: 'right-triangle',
      hyp: hypM?.[1] ?? (ladderM?.[1]),
      opp: oppM?.[1] ?? rampM?.[1],
      adj: adjM?.[1] ?? rampM?.[2],
      angle: angM?.[1],
      label: ladderM ? 'ladder' : rampM ? 'ramp' : undefined,
    }
  }

  // Explicit angles: "Angles: 90°, 45°, 45°"
  const anglesM = lo.match(/angles?:\s*([\d.]+)°?,?\s*([\d.]+)°?,?\s*([\d.]+)°?/)
  if (anglesM) {
    const [a, b, c] = [parseFloat(anglesM[1]), parseFloat(anglesM[2]), parseFloat(anglesM[3])]
    if (Math.abs(a + b + c - 180) < 2)
      return { type: 'triangle-angles', angleA: a, angleB: b, angleC: c }
  }

  // Explicit sides: "Sides: 3, 3, 3"
  const sidesM = lo.match(/sides?:\s*([\d.]+),?\s*([\d.]+),?\s*([\d.]+)/)
  if (sidesM && lo.includes('triangle')) {
    const [a, b, c] = [parseFloat(sidesM[1]), parseFloat(sidesM[2]), parseFloat(sidesM[3])]
    const [aA, aB, aC] = anglesFromSides(a, b, c)
    return { type: 'triangle-angles', angleA: aA, angleB: aB, angleC: aC, sideA: sidesM[1], sideB: sidesM[2], sideC: sidesM[3] }
  }

  return null
}

function ShapeBlock({ shape }: { shape: ShapeResult }) {
  if (!shape) return null
  if (shape.type === 'right-triangle')
    return <RightTriangleSVG hyp={shape.hyp} opp={shape.opp} adj={shape.adj} angle={shape.angle} label={shape.label} />
  if (shape.type === 'vector')
    return <VectorDiagramSVG vectors={shape.vectors} />
  return (
    <TriangleSVG
      angleA={shape.angleA} angleB={shape.angleB} angleC={shape.angleC}
      sideA={shape.sideA} sideB={shape.sideB} sideC={shape.sideC}
    />
  )
}

export function GeometryRenderer({ content }: GeometryRendererProps) {
  const lines = content.split('\n')

  const preamble: string[] = []
  const problems: { num: string; text: string }[] = []
  let seenProblem = false

  for (const line of lines) {
    const m = line.match(/^(\d+)\.\s+(.+)/)
    if (m) { seenProblem = true; problems.push({ num: m[1], text: m[2] }) }
    else if (!seenProblem) preamble.push(line)
  }

  const preambleShape = detectShape(preamble.join(' '))

  return (
    <div className="space-y-1 font-mono text-sm leading-relaxed">
      {preamble.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        if (line.startsWith('#'))
          return <p key={i} className="font-semibold text-base text-gray-900 mb-1">{line.replace(/^#+\s*/, '')}</p>
        return <p key={i} className="text-gray-700">{line}</p>
      })}

      {preambleShape && (
        <div className="my-3 flex justify-center">
          <ShapeBlock shape={preambleShape} />
        </div>
      )}

      {problems.map(({ num, text }, i) => {
        const shape = detectShape(text)
        return (
          <div key={i} className={`flex items-start gap-3 py-1.5 ${shape ? 'border-b border-gray-100' : ''}`}>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-gray-800">{num}.</span>{' '}
              <span className="text-gray-700">{text}</span>
            </div>
            {shape && <ShapeBlock shape={shape} />}
          </div>
        )
      })}
    </div>
  )
}
