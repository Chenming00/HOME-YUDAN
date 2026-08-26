import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle, ArrowDownRight, ArrowUpRight, Baby, CalendarDays, CheckCircle2,
  CircleDollarSign, HeartPulse, LayoutDashboard, PackageCheck, RefreshCw,
  ShieldCheck, ShoppingBag, Syringe, TrendingUp, WalletCards,
} from 'lucide-react';
import './styles.css';

const emptyData = {
  meta: { mode: 'loading', updatedAt: null, sources: [] },
  ledger: { monthly: [], transactions: [] },
  growth: { weights: [] },
  vaccines: [],
  care: { provider: '', birthday: '', milestones: [] },
  pantry: { total: 0, low: 0, nearExpiry: 0, items: [] },
};

const navigation = [
  { id: 'overview', label: '总览', short: '总览', icon: LayoutDashboard },
  { id: 'growth', label: '成长健康', short: '成长', icon: HeartPulse },
  { id: 'ledger', label: '家庭账本', short: '账本', icon: WalletCards },
  { id: 'pantry', label: '用品库存', short: '库存', icon: PackageCheck },
];

function App() {
  const [data, setData] = useState(emptyData);
  const [view, setView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch('/api/home', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('sync failed');
      setData(await response.json());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const weights = data.growth?.weights || [];
  const latestWeight = weights[0];
  const previousWeight = weights[1];
  const weightChange = latestWeight && previousWeight ? latestWeight.weight - previousWeight.weight : null;
  const months = data.ledger?.monthly || [];
  const currentMonth = months.at(-1);
  const previousMonth = months.at(-2);
  const expenseChange = currentMonth && previousMonth ? currentMonth.expense - previousMonth.expense : null;
  const nextVaccine = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (data.vaccines || []).find((item) => item.date >= today) || data.vaccines?.[0];
  }, [data.vaccines]);
  const nextCare = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (data.care?.milestones || []).find((item) => item.date >= today) || data.care?.milestones?.at(-1);
  }, [data.care]);
  const updatedAt = data.meta?.updatedAt
    ? new Date(data.meta.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const selectView = (id) => {
    setView(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return <div className="shell">
    <aside className="sidebar">
      <div className="identity"><div className="identity-mark">Y</div><div><strong>鱼蛋家庭</strong><span>生活数据中心</span></div></div>
      <nav className="desktop-nav">{navigation.map((item) => <NavButton key={item.id} item={item} active={view === item.id} onClick={() => selectView(item.id)}/>)}</nav>
      <div className="privacy"><ShieldCheck size={17}/><div><strong>全站只读</strong><span>不会修改源数据</span></div></div>
    </aside>

    <main className="workspace">
      <header className="topbar">
        <div><p className="kicker">YUDAN HOME</p><h1>{navigation.find((item) => item.id === view)?.label}</h1></div>
        <div className="topbar-actions">
          <div className="sync-state"><span className={failed ? 'status-dot error' : 'status-dot'}/><span>{failed ? '同步失败' : '数据已同步'} · {updatedAt}</span></div>
          <button className="refresh-button" onClick={refresh} disabled={loading} aria-label="刷新数据"><RefreshCw size={17} className={loading ? 'spin' : ''}/><span>刷新</span></button>
        </div>
      </header>

      <div className="page">
        {failed && <div className="notice error"><AlertCircle size={17}/><span>暂时无法读取数据，请稍后刷新。页面不会使用演示数据代替真实记录。</span></div>}
        {!failed && data.meta?.mode !== 'live' && data.meta?.mode !== 'loading' && <div className="notice"><AlertCircle size={17}/><span>部分数据源暂未连接，未连接的项目显示为空。</span></div>}
        <SourceStatus sources={data.meta?.sources || []}/>

        {view === 'overview' && <Overview
          data={data} weights={weights} latestWeight={latestWeight} weightChange={weightChange}
          months={months} currentMonth={currentMonth} expenseChange={expenseChange}
          nextVaccine={nextVaccine} nextCare={nextCare} onNavigate={selectView}
        />}
        {view === 'growth' && <GrowthView weights={weights} vaccines={data.vaccines || []} care={data.care || emptyData.care} latestWeight={latestWeight} weightChange={weightChange}/>}
        {view === 'ledger' && <LedgerView months={months} transactions={data.ledger?.transactions || []} currentMonth={currentMonth} expenseChange={expenseChange}/>}
        {view === 'pantry' && <PantryView pantry={data.pantry || emptyData.pantry}/>}
      </div>
    </main>

    <nav className="mobile-nav">{navigation.map((item) => <NavButton key={item.id} item={item} active={view === item.id} onClick={() => selectView(item.id)} mobile/>)}</nav>
  </div>;
}

function Overview({ data, weights, latestWeight, weightChange, months, currentMonth, expenseChange, nextVaccine, nextCare, onNavigate }) {
  const pantry = data.pantry || emptyData.pantry;
  return <>
    <section className="metric-grid">
      <Metric icon={Baby} tone="teal" label="最新体重" value={latestWeight ? formatWeight(latestWeight.weight) : '暂无记录'} unit={latestWeight ? 'kg' : ''} detail={latestWeight ? formatDate(latestWeight.date) : '成长数据'} delta={weightChange} deltaUnit=" kg"/>
      <Metric icon={CircleDollarSign} tone="red" label="本月支出" value={formatCurrency(currentMonth?.expense || 0)} detail="家庭账本" delta={expenseChange} currencyDelta/>
      <Metric icon={ShoppingBag} tone="amber" label="待补货" value={String(pantry.low || 0)} unit="项" detail={(pantry.total || 0) + ' 种启用商品'}/>
      <Metric icon={Syringe} tone="blue" label="下次疫苗" value={nextVaccine ? formatDate(nextVaccine.date, true) : '暂无计划'} detail={nextVaccine?.name || '疫苗计划'}/>
    </section>

    <section className="attention-grid overview-attention">
      <div className="section-card attention-card">
        <SectionTitle eyebrow="需要关注" title="用品补货" action="查看库存" onClick={() => onNavigate('pantry')}/>
        {pantry.items?.length ? <div className="attention-list">{pantry.items.slice(0, 3).map((item) => <div className="attention-row" key={item.name}><span className="item-icon"><PackageCheck size={16}/></span><div><strong>{item.name}</strong><span>{item.status || '需要关注'}</span></div><b>{item.stock} {item.unit}</b></div>)}</div> : <Empty text="当前没有需要补货的用品"/>}
      </div>
      <div className="section-card next-card">
        <SectionTitle eyebrow="近期计划" title="下一项疫苗" action="健康详情" onClick={() => onNavigate('growth')}/>
        {nextVaccine ? <div className="next-vaccine"><div className="date-block"><strong>{new Date(nextVaccine.date + 'T00:00:00').getDate()}</strong><span>{new Date(nextVaccine.date + 'T00:00:00').toLocaleDateString('zh-CN', { month: 'short' })}</span></div><div><strong>{nextVaccine.name}</strong><span>建议接种日期 {formatDate(nextVaccine.date)}</span></div></div> : <Empty text="暂无疫苗计划"/>}
      </div>
      <div className="section-card care-card">
        <SectionTitle eyebrow="儿童保健" title="下一次儿保" action="完整计划" onClick={() => onNavigate('growth')}/>
        {nextCare ? <div className="next-vaccine"><div className="date-block"><strong>{new Date(nextCare.date + 'T00:00:00').getDate()}</strong><span>{new Date(nextCare.date + 'T00:00:00').toLocaleDateString('zh-CN', { month: 'short' })}</span></div><div><strong>{nextCare.label}</strong><span>{data.care?.provider || '儿童保健'} · {nextCare.weekday || formatDate(nextCare.date)}</span></div></div> : <Empty text="暂无儿保计划"/>}
      </div>
    </section>

    <section className="chart-grid">
      <div className="section-card"><SectionTitle eyebrow="成长趋势" title="最近体重" action="全部记录" onClick={() => onNavigate('growth')}/><WeightChart weights={weights}/></div>
      <div className="section-card"><SectionTitle eyebrow="家庭账本" title="近六个月支出" action="账本详情" onClick={() => onNavigate('ledger')}/><ExpenseChart months={months}/></div>
    </section>

    <section className="section-card">
      <SectionTitle eyebrow="最新动态" title="最近账目" action="查看账本" onClick={() => onNavigate('ledger')}/>
      <TransactionList items={data.ledger?.transactions?.slice(0, 5) || []}/>
    </section>
  </>;
}

function GrowthView({ weights, vaccines, care, latestWeight, weightChange }) {
  return <div className="detail-layout">
    <section className="section-card detail-main">
      <SectionTitle eyebrow="成长趋势" title="体重记录"/>
      <div className="detail-summary"><div><span>最新体重</span><strong>{latestWeight ? formatWeight(latestWeight.weight) : '--'} <small>kg</small></strong></div><Delta value={weightChange} suffix=" kg" label="较上次"/></div>
      <WeightChart weights={weights} large/>
      <div className="record-table">
        <div className="table-head"><span>日期</span><span>体重</span><span>较上次</span></div>
        {weights.map((item, index) => {
          const older = weights[index + 1];
          return <div className="table-row" key={item.date}><span>{formatDate(item.date)}</span><strong>{formatWeight(item.weight)} kg</strong><Delta value={older ? item.weight - older.weight : null} suffix=" kg"/></div>;
        })}
      </div>
    </section>
    <div className="detail-stack">
      <section className="section-card detail-side">
        <SectionTitle eyebrow="接种安排" title="近期疫苗"/>
        <div className="timeline">{vaccines.slice(0, 8).map((item, index) => <div className="timeline-item" key={item.name + item.date}><i className={index === 0 ? 'current' : ''}/><div><span>{formatDate(item.date)}</span><strong>{item.name}</strong></div></div>)}</div>
      </section>
      <section className="section-card detail-side">
        <SectionTitle eyebrow={care?.provider || '儿童保健'} title="儿保计划"/>
        <CareTimeline care={care}/>
      </section>
    </div>
  </div>;
}

function CareTimeline({ care }) {
  const today = new Date().toISOString().slice(0, 10);
  const items = care?.milestones || [];
  const nextIndex = items.findIndex((item) => item.date >= today);
  if (!items.length) return <Empty text="暂无儿保计划"/>;
  return <div className="timeline care-timeline">{items.map((item, index) => <div className="timeline-item" key={item.id || item.date}><i className={index === nextIndex ? 'current' : index < nextIndex || nextIndex < 0 ? 'done' : ''}/><div><span>{formatDate(item.date)}{item.weekday ? ' · ' + item.weekday : ''}</span><strong>{item.label}</strong></div></div>)}</div>;
}
function LedgerView({ months, transactions, currentMonth, expenseChange }) {
  return <>
    <section className="metric-grid compact">
      <Metric icon={CircleDollarSign} tone="red" label="本月支出" value={formatCurrency(currentMonth?.expense || 0)} detail="当前自然月" delta={expenseChange} currencyDelta/>
      <Metric icon={CalendarDays} tone="blue" label="近六个月" value={formatCurrency(months.reduce((sum, item) => sum + Number(item.expense || 0), 0))} detail="累计支出"/>
    </section>
    <div className="detail-layout ledger-layout">
      <section className="section-card detail-main"><SectionTitle eyebrow="月度趋势" title="近六个月支出"/><ExpenseChart months={months} large/></section>
      <section className="section-card detail-side"><SectionTitle eyebrow="消费明细" title="最近账目"/><TransactionList items={transactions}/></section>
    </div>
  </>;
}

function PantryView({ pantry }) {
  return <>
    <section className="metric-grid compact three">
      <Metric icon={PackageCheck} tone="teal" label="启用商品" value={String(pantry.total || 0)} unit="种" detail="用品总数"/>
      <Metric icon={ShoppingBag} tone="amber" label="待补货" value={String(pantry.low || 0)} unit="项" detail="低库存与缺货"/>
      <Metric icon={CalendarDays} tone="red" label="近期临期" value={String(pantry.nearExpiry || 0)} unit="项" detail="未来 30 天"/>
    </section>
    <section className="section-card"><SectionTitle eyebrow="库存关注" title="补货清单"/><div className="inventory-table"><div className="inventory-head"><span>商品</span><span>当前库存</span><span>状态</span></div>{pantry.items?.length ? pantry.items.map((item) => <div className="inventory-row" key={item.name}><div><span className="item-icon"><PackageCheck size={16}/></span><strong>{item.name}</strong></div><b>{item.stock} {item.unit}</b><span className="tag warning">{item.status || '需关注'}</span></div>) : <Empty text="当前没有需要关注的库存"/>}</div></section>
  </>;
}

function Metric({ icon: Icon, tone, label, value, unit, detail, delta, deltaUnit, currencyDelta }) {
  return <div className="metric-card"><span className={'metric-icon ' + tone}><Icon size={19}/></span><div className="metric-label">{label}</div><div className="metric-value">{value}{unit && <small>{unit}</small>}</div><div className="metric-foot"><span>{detail}</span>{delta !== undefined && delta !== null && <Delta value={delta} suffix={currencyDelta ? '' : deltaUnit} currency={currencyDelta}/>}</div></div>;
}

function Delta({ value, suffix = '', label, currency }) {
  if (value === null || value === undefined) return <span className="delta neutral">--</span>;
  const positive = Number(value) >= 0;
  return <span className={'delta ' + (positive ? 'up' : 'down')}>{positive ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>} {currency ? formatCurrency(Math.abs(value)) : Math.abs(value).toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + suffix}{label && <em>{label}</em>}</span>;
}

function WeightChart({ weights, large }) {
  const items = weights.slice(0, large ? 12 : 8).reverse();
  if (!items.length) return <Empty text="暂无体重记录"/>;
  const values = items.map((item) => Number(item.weight));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * .2, .05);
  const low = min - padding;
  const high = max + padding;
  const width = 640;
  const height = large ? 270 : 210;
  const x = (index) => 36 + index * ((width - 72) / Math.max(items.length - 1, 1));
  const y = (value) => 20 + (high - value) / Math.max(high - low, .1) * (height - 58);
  const points = items.map((item, index) => x(index) + ',' + y(item.weight)).join(' ');
  return <div className={'line-chart ' + (large ? 'large' : '')}><svg viewBox={'0 0 ' + width + ' ' + height} role="img" aria-label="体重趋势图"><line x1="36" y1={height - 38} x2={width - 20} y2={height - 38} className="axis-line"/><polyline points={points} className="weight-line"/>{items.map((item, index) => <g key={item.date}><circle cx={x(index)} cy={y(item.weight)} r={index === items.length - 1 ? 6 : 4} className={index === items.length - 1 ? 'point latest' : 'point'}/><text x={x(index)} y={height - 16} textAnchor="middle" className="chart-label">{shortDate(item.date)}</text>{(large || index === items.length - 1) && <text x={x(index)} y={y(item.weight) - 12} textAnchor="middle" className="chart-value">{formatWeight(item.weight)}</text>}</g>)}</svg></div>;
}

function ExpenseChart({ months, large }) {
  if (!months.length) return <Empty text="暂无支出记录"/>;
  const max = Math.max(...months.map((item) => Number(item.expense || 0)), 1);
  return <div className={'expense-chart ' + (large ? 'large' : '')}>{months.map((item) => <div className="expense-column" key={item.month}><div className="expense-value">{item.expense ? compactCurrency(item.expense) : '¥0'}</div><div className="expense-track"><div className="expense-bar" style={{ height: Math.max(4, Number(item.expense || 0) / max * 100) + '%' }}/></div><span>{item.month}</span></div>)}</div>;
}

function TransactionList({ items }) {
  if (!items.length) return <Empty text="暂无账目"/>;
  return <div className="transaction-list">{items.map((item, index) => <div className="transaction-row" key={(item.date || '') + index}><span className="item-icon money"><WalletCards size={16}/></span><div><strong>{item.title || '家庭支出'}</strong><span>{formatDate(item.date)} · {item.category || '未分类'}</span></div><b>{formatCurrency(Math.abs(Number(item.amount || 0)))}</b></div>)}</div>;
}

function SourceStatus({ sources }) {
  if (!sources.length) return null;
  return <div className="source-strip">{sources.map((source) => <span key={source.name} className={source.ok ? 'online' : 'offline'}><i/>{source.name}<b>{source.ok ? '已连接' : '待配置'}</b></span>)}</div>;
}

function SectionTitle({ eyebrow, title, action, onClick }) {
  return <div className="section-title"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action && <button onClick={onClick}>{action}</button>}</div>;
}

function NavButton({ item, active, onClick, mobile }) {
  const Icon = item.icon;
  return <button className={active ? 'active' : ''} onClick={onClick}><Icon size={mobile ? 19 : 18}/><span>{mobile ? item.short : item.label}</span></button>;
}

function Empty({ text }) {
  return <div className="empty"><CheckCircle2 size={20}/><span>{text}</span></div>;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2 }).format(Number(value || 0));
}
function compactCurrency(value) {
  return '¥' + new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}
function formatWeight(value) {
  return Number(value).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}
function formatDate(value, compact = false) {
  if (!value) return '--';
  const date = new Date(String(value).slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('zh-CN', compact ? { month: 'short', day: 'numeric' } : { year: 'numeric', month: 'long', day: 'numeric' });
}
function shortDate(value) {
  return String(value || '').slice(5).replace('-', '/');
}

createRoot(document.getElementById('root')).render(<App/>);
