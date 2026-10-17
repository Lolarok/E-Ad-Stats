import React from 'react';

interface MetricItem {
  label: string;
  val1: number;
  val2: number;
  max: number;
  unit?: string;
}

interface Props {
  entity1Name: string;
  entity2Name: string;
  metrics: MetricItem[];
  color1?: string;
  color2?: string;
}

export const RadarComparisonChart: React.FC<Props> = ({
  entity1Name,
  entity2Name,
  metrics,
  color1 = '#3b82f6',
  color2 = '#f59e0b',
}) => {
  const size = 300;
  const center = size / 2;
  const radius = size * 0.38;
  const totalAxes = metrics.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Coordinate per ciascun asse
  const getCoordinates = (value: number, max: number, index: number) => {
    const normalized = Math.min(Math.max(value / max, 0.05), 1);
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * normalized * Math.cos(angle);
    const y = center + radius * normalized * Math.sin(angle);
    return { x, y };
  };

  const points1 = metrics
    .map((m, i) => {
      const { x, y } = getCoordinates(m.val1, m.max, i);
      return `${x},${y}`;
    })
    .join(' ');

  const points2 = metrics
    .map((m, i) => {
      const { x, y } = getCoordinates(m.val2, m.max, i);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col items-center">
      {/* Legenda */}
      <div className="flex items-center justify-center gap-6 mb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color1 }}></span>
          <span className="font-semibold text-white">{entity1Name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color2 }}></span>
          <span className="font-semibold text-white">{entity2Name}</span>
        </div>
      </div>

      <div className="relative">
        <svg width={size} height={size} className="overflow-visible select-none">
          {/* Cerchi concentrici di sfondo */}
          {[0.25, 0.5, 0.75, 1].map((level, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius * level}
              fill="none"
              stroke="#334155"
              strokeDasharray={i < 3 ? '3 3' : 'none'}
              strokeWidth="1"
            />
          ))}

          {/* Raggi assi */}
          {metrics.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#334155" strokeWidth="1" />;
          })}

          {/* Poligono Entità 1 */}
          <polygon
            points={points1}
            fill={color1}
            fillOpacity="0.25"
            stroke={color1}
            strokeWidth="2.5"
            className="transition-all duration-300"
          />

          {/* Poligono Entità 2 */}
          <polygon
            points={points2}
            fill={color2}
            fillOpacity="0.25"
            stroke={color2}
            strokeWidth="2.5"
            className="transition-all duration-300"
          />

          {/* Punti sui vertici */}
          {metrics.map((m, i) => {
            const c1 = getCoordinates(m.val1, m.max, i);
            const c2 = getCoordinates(m.val2, m.max, i);
            return (
              <g key={i}>
                <circle cx={c1.x} cy={c1.y} r="3.5" fill={color1} />
                <circle cx={c2.x} cy={c2.y} r="3.5" fill={color2} />
              </g>
            );
          })}

          {/* Etichette assi */}
          {metrics.map((m, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = radius + 24;
            const x = center + labelRadius * Math.cos(angle);
            const y = center + labelRadius * Math.sin(angle);
            return (
              <text
                key={i}
                x={x}
                y={y}
                fill="#94a3b8"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {m.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Tabella differenziali metriche */}
      <div className="w-full mt-4 space-y-1.5 text-xs">
        {metrics.map((m, idx) => {
          const diff = m.val1 - m.val2;
          const p1Wins = diff > 0;
          const tied = diff === 0;

          return (
            <div key={idx} className="flex items-center justify-between py-1 px-2 rounded bg-slate-800/40">
              <span
                className={`font-semibold ${
                  p1Wins ? 'text-blue-400' : 'text-slate-400'
                }`}
              >
                {m.val1}
                {m.unit}
              </span>
              <span className="text-slate-300 font-medium text-center">{m.label}</span>
              <span
                className={`font-semibold ${
                  !p1Wins && !tied ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {m.val2}
                {m.unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
