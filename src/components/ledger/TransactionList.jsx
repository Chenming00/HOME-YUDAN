import { ChevronDown, WalletCards } from 'lucide-react';
import Empty from '../shared/Empty.jsx';
import { formatCurrency, formatDate } from '../../lib/utils.js';

function fullTime(value) {
  if (!value) return '未记录';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(date) + '（北京时间）';
}

export default function TransactionList({ items, limit }) {
  const visible = limit ? items.slice(0, limit) : items;
  if (!visible.length) return <Empty text="暂无账目" />;
  return (
    <div className="transaction-list">
      {visible.map((item, index) => {
        const amount = Number(item.amount || 0);
        const income = item.type === 'income';
        const typeLabel = income ? '收入' : item.type === 'expense' || !item.type ? '支出' : item.type;
        const title = [item.brand?.trim(), item.product?.trim()].filter(Boolean).join(' ') || item.title || '家庭账目';
        const time = item.transaction_time || item.date;
        return (
          <details className="transaction-card" key={item.id ?? [time, title, amount, index].join('-')}>
            <summary className="transaction-summary">
              <span className="item-icon"><WalletCards size={16} aria-hidden="true" /></span>
              <span className="transaction-overview">
                <strong>{title}</strong>
                <span className="transaction-meta">
                  <span>{formatDate(time)}</span>
                  <span>{item.category || '未分类'}</span>
                </span>
              </span>
              <b className={income ? 'tx-income' : 'tx-expense'}>{income ? '+' : '−'}{formatCurrency(Math.abs(amount))}</b>
              <span className="transaction-toggle">
                <span className="tx-show">查看详情</span><span className="tx-hide">收起详情</span>
                <ChevronDown size={14} aria-hidden="true" />
              </span>
            </summary>
            <dl className="transaction-details">
              <div><dt>品牌</dt><dd>{item.brand || '未记录'}</dd></div>
              <div><dt>商品</dt><dd>{item.product || item.title || '未记录'}</dd></div>
              <div><dt>金额</dt><dd>{formatCurrency(Math.abs(amount))}</dd></div>
              <div><dt>收支类型</dt><dd>{typeLabel}</dd></div>
              <div><dt>分类</dt><dd>{item.category || '未分类'}</dd></div>
              <div><dt>交易时间</dt><dd>{fullTime(time)}</dd></div>
              <div className="transaction-note"><dt>备注</dt><dd>{item.note || '无备注'}</dd></div>
            </dl>
          </details>
        );
      })}
    </div>
  );
}
