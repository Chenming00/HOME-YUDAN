import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../../lib/utils.js';

export function Delta({ value, suffix = '', label, currency, deltaType }) {
  if (value === null || value === undefined) return <span className="delta neutral">--</span>;
  const num = Number(value);
  const positive = num >= 0;

  let tone = positive ? 'up' : 'down';
  if (deltaType === 'weight') {
    tone = positive ? 'positive' : 'negative';
  } else if (deltaType === 'expense') {
    tone = positive ? 'negative' : 'positive';
  }

  const absValue = currency
    ? formatCurrency(Math.abs(num))
    : Math.abs(num).toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + suffix;

  return (
    <span className={`delta ${tone}`}>
      {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {absValue}
      {label && <em>{label}</em>}
    </span>
  );
}

export default function Metric({ icon: Icon, tone, label, value, unit, detail, delta, deltaUnit, currencyDelta, deltaType }) {
  return (
    <div className="metric-card">
      <span className={`metric-icon ${tone}`}><Icon size={20} /></span>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}{unit && <small>{unit}</small>}</div>
      <div className="metric-foot">
        <span>{detail}</span>
        {delta !== undefined && delta !== null && (
          <Delta value={delta} suffix={currencyDelta ? '' : deltaUnit} currency={currencyDelta} deltaType={deltaType} />
        )}
      </div>
    </div>
  );
}
