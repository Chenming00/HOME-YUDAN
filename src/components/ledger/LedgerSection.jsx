import { CalendarDays, CircleDollarSign, WalletCards } from 'lucide-react';
import ChapterHeading from '../ChapterHeading.jsx';
import ExpenseChart from '../charts/ExpenseChart.jsx';
import CategoryBreakdown from './CategoryBreakdown.jsx';
import TransactionList from './TransactionList.jsx';
import Metric from '../shared/Metric.jsx';
import SectionTitle from '../shared/SectionTitle.jsx';
import { chapterLeads } from '../../lib/data.js';
import { formatCurrency, normalizeBreakdown } from '../../lib/utils.js';

export default function LedgerSection({ months, transactions, currentMonth, expenseChange }) {
  const breakdown = normalizeBreakdown(currentMonth?.categoryBreakdown);

  return (
    <section className="chapter" id="chapter-ledger" data-chapter="ledger">
      <ChapterHeading number="03" en="FAMILY LEDGER" title="家庭账本" lead={chapterLeads.ledger} />

      <section className="metric-grid compact three" aria-label="账本关键数据">
        <Metric icon={CircleDollarSign} tone="red" label="本月支出" value={currentMonth?.available === false ? '暂无数据' : formatCurrency(currentMonth?.expense || 0)} detail={currentMonth?.available === false ? '本月账本接口不可用' : '当前自然月'} delta={expenseChange} currencyDelta deltaType="expense" />
        <Metric icon={WalletCards} tone="teal" label="本月笔数" value={currentMonth?.available === false ? '--' : String(currentMonth?.transactionCount || 0)} unit={currentMonth?.available === false ? '' : '笔'} detail="交易记录" />
        <Metric icon={CalendarDays} tone="blue" label="近六个月" value={formatCurrency(months.reduce((sum, item) => sum + Number(item.expense || 0), 0))} detail={months.some((item) => item.available === false) ? '仅统计已同步月份' : '累计支出'} />
      </section>

      <div className="detail-layout ledger-layout">
        <div className="detail-main">
          <section className="section-card">
            <SectionTitle eyebrow="月度趋势" title="近六个月支出" />
            <ExpenseChart months={months} large />
          </section>
          <section className="section-card">
            <SectionTitle eyebrow="花在哪里" title="本月分类占比" />
            <CategoryBreakdown breakdown={breakdown} />
          </section>
        </div>
        <section className="section-card detail-side">
          <SectionTitle eyebrow="消费明细" title="最近账目" />
          <TransactionList items={transactions} />
        </section>
      </div>
    </section>
  );
}
