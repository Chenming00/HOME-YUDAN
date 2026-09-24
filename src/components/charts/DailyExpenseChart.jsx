import Empty from '../shared/Empty.jsx';
import { formatCurrency, shanghaiDateKey } from '../../lib/utils.js';

/* 本月每日支出热力条：数据来自月度接口 dailyExpenses，未来日期置灰，今天高亮 */
export default function DailyExpenseChart({ days }) {
  const items = Array.isArray(days) ? days.filter((day) => day?.date) : [];
  if (!items.length) return <Empty text="暂无每日支出数据" />;
  const today = shanghaiDateKey();
  const max = Math.max(...items.map((day) => Number(day.amount || 0)), 1);
  const monthLabel = `${Number(items[0].date.slice(5, 7))}月`;

  return (
    <div className="daily-chart" role="img" aria-label={`${monthLabel}每日支出，最高单日 ${formatCurrency(max)}`}>
      <div className="daily-chart-bars">
        {items.map((day) => {
          const amount = Number(day.amount || 0);
          const isFuture = day.date > today;
          const isToday = day.date === today;
          const dayNum = Number(day.date.slice(8, 10));
          return (
            <div
              key={day.date}
              className={`daily-bar ${isFuture ? 'future' : ''} ${isToday ? 'today' : ''} ${amount === 0 ? 'zero' : ''}`}
              title={`${monthLabel}${dayNum}日 · ${formatCurrency(amount)}`}
            >
              <i style={{ height: isFuture ? '2px' : `${Math.max(amount > 0 ? 8 : 2, amount / max * 100) + '%'}` }} />
            </div>
          );
        })}
      </div>
      <div className="daily-chart-labels">
        <span>{monthLabel}1日</span>
        <span>15日</span>
        <span>{Number(items[items.length - 1].date.slice(8, 10))}日</span>
      </div>
    </div>
  );
}
