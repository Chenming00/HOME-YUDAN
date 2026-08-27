import Empty from '../shared/Empty.jsx';
import { formatCurrency } from '../../lib/utils.js';

export default function CategoryBreakdown({ breakdown }) {
  if (!breakdown.length) return <Empty text="本月暂无分类数据" small />;

  const total = breakdown.reduce((sum, row) => sum + row.amount, 0);
  const max = breakdown[0].amount;
  const top = breakdown.slice(0, 6);

  return (
    <div className="breakdown-list">
      {top.map((row, index) => {
        const share = total ? Math.round(row.amount / total * 100) : 0;
        const width = Math.max(4, row.amount / max * 100);
        return (
          <div className="breakdown-row" key={row.name + index}>
            <div className="breakdown-head">
              <strong><span className="breakdown-rank">{String(index + 1).padStart(2, '0')}</span>{row.name}</strong>
              <b>{formatCurrency(row.amount)}</b>
            </div>
            <div className="breakdown-track">
              <div className="breakdown-fill" style={{ width: `${width}%` }} />
            </div>
            <span className="breakdown-meta">占本月支出 {share}%</span>
          </div>
        );
      })}
      {breakdown.length > top.length && (
        <span className="breakdown-meta breakdown-more">
          另有 {breakdown.length - top.length} 个分类未展示
        </span>
      )}
    </div>
  );
}
