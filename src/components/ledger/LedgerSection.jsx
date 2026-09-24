import { CalendarDays, CircleDollarSign, PiggyBank, WalletCards } from 'lucide-react';
import ChapterHeading from '../ChapterHeading.jsx';
import ExpenseChart from '../charts/ExpenseChart.jsx';
import DailyExpenseChart from '../charts/DailyExpenseChart.jsx';
import CategoryBreakdown from './CategoryBreakdown.jsx';
import TransactionList from './TransactionList.jsx';
import Metric from '../shared/Metric.jsx';
import SectionTitle from '../shared/SectionTitle.jsx';
import { chapterLeads } from '../../lib/data.js';
import { formatCurrency, normalizeBreakdown } from '../../lib/utils.js';
import { Card } from '@/components/ui/card';

export default function LedgerSection({ months, transactions, currentMonth, expenseChange }) {
  const breakdown = normalizeBreakdown(currentMonth?.categoryBreakdown);
  const allTime = [...months].reverse().find((item) => item.available !== false && item.allTimeExpense != null)?.allTimeExpense;

  return (
    <section className="chapter" id="chapter-ledger" data-chapter="ledger">
      <ChapterHeading number="03" en="FAMILY LEDGER" title="家庭账本" lead={chapterLeads.ledger} />

      <section className="metric-grid compact" aria-label="账本关键数据">
        <Metric icon={CircleDollarSign} tone="red" label="本月支出" value={currentMonth?.available === false ? '暂无数据' : formatCurrency(currentMonth?.expense || 0)} detail={currentMonth?.available === false ? '本月账本接口不可用' : '当前自然月'} delta={expenseChange} currencyDelta deltaType="expense" />
        <Metric icon={WalletCards} tone="teal" label="本月笔数" value={currentMonth?.available === false ? '--' : String(currentMonth?.transactionCount || 0)} unit={currentMonth?.available === false ? '' : '笔'} detail="交易记录" />
        <Metric icon={CalendarDays} tone="blue" label="近六个月" value={formatCurrency(months.reduce((sum, item) => sum + Number(item.expense || 0), 0))} detail={months.some((item) => item.available === false) ? '仅统计已同步月份' : '累计支出'} />
        <Metric icon={PiggyBank} tone="amber" label="累计支出" value={allTime != null ? formatCurrency(allTime) : '--'} detail="账本记录以来" />
      </section>

      <div className="detail-layout ledger-layout">
        <div className="detail-main">
          <Card className="section-card">
            <SectionTitle eyebrow="月度趋势" title="近六个月支出" />
            <ExpenseChart months={months} large />
          </Card>
          <Card className="section-card">
            <SectionTitle eyebrow="花在哪里" title="本月分类占比" />
            <CategoryBreakdown breakdown={breakdown} />
          </Card>
          <Card className="section-card">
            <SectionTitle eyebrow="每日节奏" title="本月每日支出" />
            <DailyExpenseChart days={currentMonth?.available === false ? [] : currentMonth?.dailyExpenses} />
          </Card>
        </div>
        <Card className="section-card detail-side">
          <SectionTitle eyebrow="按购买时间 · 最新在前" title="最近 30 笔账目" />
          <TransactionList items={transactions} limit={30} />
        </Card>
      </div>
    </section>
  );
}
