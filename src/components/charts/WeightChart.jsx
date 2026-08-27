import { useRef, useState } from 'react';
import Empty from '../shared/Empty.jsx';
import { formatDate, formatWeight, shortDate } from '../../lib/utils.js';

export default function WeightChart({ weights, large, spark }) {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const count = spark ? 10 : large ? 12 : 8;
  const items = weights.slice(0, count).reverse();

  if (!items.length) return <Empty text="暂无体重记录" small={spark} />;

  const values = items.map((item) => Number(item.weight));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.2, 0.05);
  const low = min - padding;
  const high = max + padding;
  const width = 640;
  const height = spark ? 84 : large ? 290 : 220;
  const left = spark ? 10 : 36;
  const right = spark ? 10 : 20;
  const top = spark ? 10 : 20;
  const bottom = spark ? 10 : 38;
  const x = (index) => left + index * ((width - left - right) / Math.max(items.length - 1, 1));
  const y = (value) => top + (high - value) / Math.max(high - low, 0.1) * (height - top - bottom);
  const points = items.map((item, index) => x(index) + ',' + y(item.weight)).join(' ');
  const areaPoints = `${x(0)},${height - bottom} ${points} ${x(items.length - 1)},${height - bottom}`;
  const gradientId = spark ? 'weightGradientSpark' : 'weightGradient';

  const showPoint = (item, index) => setTooltip({
    index,
    x: (x(index) / width) * 100,
    y: (y(item.weight) / height) * 100,
    text: `${formatDate(item.date)} · ${formatWeight(item.weight)} kg`,
  });

  const gridLines = spark ? [] : [0.25, 0.5, 0.75].map((ratio) => (
    <line
      key={ratio}
      x1={left}
      y1={top + ratio * (height - top - bottom)}
      x2={width - right}
      y2={top + ratio * (height - top - bottom)}
      className="chart-grid-line"
    />
  ));

  return (
    <div className={`line-chart ${large ? 'large' : ''} ${spark ? 'spark' : ''}`} ref={containerRef}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="体重趋势图">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--moss)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--moss)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridLines}
        {!spark && <line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} className="axis-line" />}
        {tooltip && !spark && (
          <line
            className="chart-crosshair"
            x1={x(tooltip.index)}
            x2={x(tooltip.index)}
            y1={top - 6}
            y2={height - bottom}
          />
        )}
        <polyline points={areaPoints} className="weight-area" />
        <polyline points={points} className="weight-line" />
        {items.map((item, index) => (
          <g
            key={item.date}
            tabIndex={spark ? undefined : '0'}
            role={spark ? undefined : 'button'}
            aria-label={spark ? undefined : `${formatDate(item.date)}，${formatWeight(item.weight)} 千克`}
            onFocus={() => showPoint(item, index)}
            onBlur={() => setTooltip(null)}
            onPointerEnter={() => showPoint(item, index)}
            onPointerLeave={() => setTooltip(null)}
            onClick={() => showPoint(item, index)}
          >
            <circle cx={x(index)} cy={y(item.weight)} r="14" className="chart-hit-area" />
            <circle
              cx={x(index)}
              cy={y(item.weight)}
              r={spark ? (index === items.length - 1 ? 4.5 : 2.5) : index === items.length - 1 ? 6 : 4}
              className={index === items.length - 1 ? 'point latest' : 'point'}
            />
            {!spark && <text x={x(index)} y={height - 16} textAnchor="middle" className="chart-label">{shortDate(item.date)}</text>}
            {!spark && (large || index === items.length - 1) && (
              <text x={x(index)} y={y(item.weight) - 12} textAnchor="middle" className="chart-value">{formatWeight(item.weight)}</text>
            )}
          </g>
        ))}
      </svg>
      {tooltip && !spark && (
        <div
          className="chart-tooltip visible"
          aria-live="polite"
          style={{ left: `${tooltip.x}%`, top: `${tooltip.y}%` }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
