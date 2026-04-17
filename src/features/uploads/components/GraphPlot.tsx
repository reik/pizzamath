import { Mafs, Coordinates, Plot, Point, Text, Theme } from 'mafs'
import 'mafs/core.css'

export interface GraphSpec {
  functions?: string[]
  xDomain?: [number, number]
  yDomain?: [number, number]
  points?: Array<{ x: number; y: number; label?: string }>
}

const PLOT_COLORS = [
  Theme.blue,
  Theme.pink,
  Theme.green,
  Theme.violet,
  Theme.yellow,
]

function makeFn(expr: string): ((x: number) => number) | null {
  try {
    // Claude-generated expressions only — not user input
    // eslint-disable-next-line no-new-func
    return new Function('x', `"use strict"; try { var r=(${expr}); return isFinite(r)?r:NaN; } catch(e){ return NaN; }`) as (x: number) => number
  } catch {
    return null
  }
}

interface GraphPlotProps {
  spec: GraphSpec
}

export function GraphPlot({ spec }: GraphPlotProps) {
  const xDomain = (spec.xDomain ?? [-6, 6]) as [number, number]
  const yDomain = (spec.yDomain ?? [-6, 6]) as [number, number]

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <Mafs
        viewBox={{ x: xDomain, y: yDomain }}
        preserveAspectRatio={false}
        height={320}
      >
        <Coordinates.Cartesian />

        {spec.functions?.map((expr, i) => {
          const fn = makeFn(expr)
          if (!fn) return null
          return (
            <Plot.OfX
              key={i}
              y={fn}
              color={PLOT_COLORS[i % PLOT_COLORS.length]}
            />
          )
        })}

        {spec.points?.map((p, i) => (
          <g key={i}>
            <Point x={p.x} y={p.y} color={Theme.red} />
            {p.label && (
              <Text x={p.x} y={p.y + 0.4} attach="n" size={14}>
                {p.label}
              </Text>
            )}
          </g>
        ))}
      </Mafs>
    </div>
  )
}
