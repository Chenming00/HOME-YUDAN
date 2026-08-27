import { WalletCards } from 'lucide-react';
import Empty from '../shared/Empty.jsx';
import { formatCurrency, formatDate } from '../../lib/utils.js';

export default function TransactionList({ items, limit }) {
  const visible = limit ? items.slice(0, limit) : items;
  if (!visible.length) return <Empty text="暂无账目" />;
  return (
    <div className="transaction-list">
      {visible.map((item, index) => (
        <div className="transaction-row" key={(item.date || '') + index}>
          <span className="item-icon"><WalletCards size={16} /></span>
          <div>
            <strong>
              {item.title || '家庭支出'}
              {item.category && item.category !== '未分类' && <span className="tx-tag">{item.category}</span>}
            </strong>
            <span>{formatDate(item.date)}</span>
          </div>
          <b>{formatCurrency(Math.abs(Number(item.amount || 0)))}</b>
        </div>
      ))}
    </div>
  );
}
