import Empty from '../shared/Empty.jsx';
import { compactCurrency, shanghaiDateKey } from '../../lib/utils.js';

export default function ExpenseChart({ months, large }) {
  if (!months.length) return <Empty text="暂无支出记录" />;
  const max = Math.max(...months.filter((item) => item.available !== false).map((item) => Number(item.expense || 0)), 1);
  const currentMonthLabels = [
    shanghaiDateKey().slice(0, 7),
    `${Number(shanghaiDateKey().slice(5, 7))}月`,
  ];

  return (
    <div className={`expense-chart ${large ? 'large' : ''}`}>
      {months.map((item) => {
        const isCurrent = currentMonthLabels.includes(item.month);
        return (
          <div className={`expense-column ${isCurrent ? 'current' : ''} ${item.available === false ? 'unavailable' : ''}`} key={item.month}>
            <div className="expense-value">{item.available === false ? '--' : item.expense ? compactCurrency(item.expense) : '¥0'}</div>
            <div className="expense-track">
              <div className="expense-bar" style={{ height: item.available === false ? '0%' : Math.max(4, Number(item.expense || 0) / max * 100) + '%' }} />
            </div>
            <span>{item.month}</span>
          </div>
        );
      })}
    </div>
  );
}
