import { useEffect, useId, useRef, useState } from 'react';
import Empty from '../shared/Empty.jsx';
import { formatDate, formatWeight, shortDate } from '../../lib/utils.js';

export default function WeightChart({ weights, available = true }) {
  const containerRef = useRef(null);
  const gradientId = useId();
  const [width, setWidth] = useState(480);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(200, entry.contentRect.width)));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => setSelected(null), [weights]);

  const items = [...weights].reverse();
  const height = width < 400 ? 184 : 238;
  const left = 34;
  const right = width - 18;
  const top = 24;
  const bottom = height - 32;
  const values = items.map((item) => Number(item.weight));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const padding = Math.max((max - min) * .2, .1);
  const low = Math.max(0, min - padding);
  const high = max + padding;
  const firstTime = Date.parse(items[0]?.date) || 0;
  const lastTime = Date.parse(items.at(-1)?.date) || firstTime;
  const x = (index) => lastTime === firstTime ? (left + right) / 2 : left + (Date.parse(items[index].date) - firstTime) / (lastTime - firstTime) * (right - left);
  const y = (value) => top + (high - value) / (high - low) * (bottom - top);
  const points = items.map((item, index) => `${x(index)},${y(item.weight)}`).join(' ');
  const selectedItem = items[selected];
  const labelStep = Math.max(1, Math.ceil((items.length - 1) / (width < 400 ? 3 : 5)));

  return (
    <div className="line-chart" ref={containerRef} style={{ height }}>
      {!items.length ? <Empty text={available ? '还没有体重记录，记录后即可查看趋势' : '体重记录暂未同步，请稍后刷新'} /> : <>
        <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`体重趋势，共 ${items.length} 次记录，单位千克`}>
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--moss)" stopOpacity=".16" /><stop offset="100%" stopColor="var(--moss)" stopOpacity="0" /></linearGradient></defs>
          {[0, .5, 1].map((ratio) => {
            const value = low + ratio * (high - low);
            return <g key={ratio}><line x1={left} x2={right} y1={y(value)} y2={y(value)} className="chart-grid-line" /><text x={left - 9} y={y(value) + 4} textAnchor="end" className="chart-label">{value.toFixed(1)}</text></g>;
          })}
          <polygon points={`${x(0)},${bottom} ${points} ${x(items.length - 1)},${bottom}`} fill={`url(#${gradientId})`} />
          <polyline points={points} className="weight-line" />
          {selectedItem && <line x1={x(selected)} x2={x(selected)} y1={top} y2={bottom} className="chart-crosshair" />}
          {items.map((item, index) => <g key={`${item.date}-${index}`}>
            <circle style={{ cx: x(index), cy: y(item.weight) }} r={index === items.length - 1 || selected === index ? 5 : 3} className={index === items.length - 1 ? 'point latest' : 'point'} />
            <circle style={{ cx: x(index), cy: y(item.weight) }} r="22" className="chart-hit-area" role="button" tabIndex={0} aria-label={`${item.date}，${formatWeight(item.weight)} 千克`}
              onFocus={() => setSelected(index)} onBlur={() => setSelected(null)} onPointerEnter={() => setSelected(index)} onPointerLeave={(event) => { if (event.pointerType === 'mouse') setSelected(null); }} onClick={() => setSelected(index)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(index); } if (event.key === 'Escape') setSelected(null); }} />
            {(index % labelStep === 0 && items.length - 1 - index >= labelStep / 2 || index === items.length - 1) && <text x={x(index)} y={height - 8} textAnchor={index === items.length - 1 ? 'end' : index === 0 ? 'start' : 'middle'} className="chart-label">{shortDate(item.date)}</text>}
          </g>)}
        </svg>
        {selectedItem && <div className="chart-tooltip" role="status" style={{ left: `${Math.max(86, Math.min(width - 86, x(selected)))}px`, top: `${Math.max(48, y(selectedItem.weight))}px` }}>{formatDate(selectedItem.date)} · {formatWeight(selectedItem.weight)} kg</div>}
      </>}
    </div>
  );
}
