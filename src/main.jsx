import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUp,
  ArrowUpRight,
  Baby,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock,
  HeartPulse,
  LayoutDashboard,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Syringe,
  WalletCards,
} from 'lucide-react';
import './styles.css';

const emptyData = {
  meta: { mode: 'loading', updatedAt: null, sources: [] },
  ledger: { monthly: [], transactions: [] },
  growth: { weights: [] },
  vaccines: [],
  care: { provider: '', birthday: '', milestones: [] },
  pantry: { total: 0, low: 0, outOfStock: 0, nearExpiry: 0, items: [] },
};

const navigation = [
  { id: 'overview', label: '总览', short: '总览', icon: LayoutDashboard },
  { id: 'growth', label: '成长健康', short: '成长', icon: HeartPulse },
  { id: 'ledger', label: '家庭账本', short: '账本', icon: WalletCards },
  { id: 'pantry', label: '用品库存', short: '库存', icon: PackageCheck },
];

const BABY_BIRTHDAY_FALLBACK = '2026-08-30';

/* ---------- Helpers ---------- */

function daysBetween(a, b) {
  const ms = new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime();
  return Math.floor(ms / 86400000);
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
  return date.toLocaleDateString('zh-CN', compact ? { month: 'short', day: 'numeric' } : { month: 'long', day: 'numeric' });
}

function shortDate(value) {
  return String(value || '').slice(5).replace('-', '/');
}

function isCompletedStatus(status) {
  return /(已完成|已接种|completed|done)/i.test(String(status || ''));
}

/* ---------- Main App ---------- */

function App() {
  const [data, setData] = useState(emptyData);
  const [view, setView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [topbarHidden, setTopbarHidden] = useState(false);
  const [topbarScrolled, setTopbarScrolled] = useState(false);
  const lastScrollY = useRef(0);

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

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setTopbarScrolled(y > 8);
      if (window.innerWidth < 768) {
        setTopbarHidden(y > 120 && y > lastScrollY.current);
      }
      setShowBackToTop(y > 400);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const nextEvent = useMemo(() => {
    const candidates = [];
    if (nextVaccine) candidates.push({ ...nextVaccine, type: 'vaccine', label: nextVaccine.name });
    if (nextCare) candidates.push({ ...nextCare, type: 'care', label: nextCare.label });
    const today = new Date().toISOString().slice(0, 10);
    return candidates
      .filter((item) => item.date)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .find((item) => item.date >= today) || candidates[0];
  }, [nextVaccine, nextCare]);

  const carePlan = useMemo(() => {
    const vaccines = (data.vaccines || []).map((item) => ({
      ...item,
      recordType: 'vaccine',
      source: item.source || '疫苗',
    }));
    const careMilestones = (data.care?.milestones || []).map((item) => ({
      ...item,
      recordType: 'care',
      source: item.source || '卓正儿保',
    }));
    return [...vaccines, ...careMilestones]
      .map((item, originalIndex) => ({ ...item, originalIndex }))
      .filter((item) => item.date)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.originalIndex - b.originalIndex);
  }, [data.vaccines, data.care?.milestones]);

  const updatedAt = data.meta?.updatedAt
    ? new Date(data.meta.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const birthday = data.care?.birthday || BABY_BIRTHDAY_FALLBACK;
  const babyDays = daysBetween(birthday, new Date().toISOString().slice(0, 10));

  const selectView = (id) => {
    setView(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="identity">
          <div className="identity-mark">Y</div>
          <div>
            <strong>鱼蛋家庭</strong>
            <span>生活数据中心</span>
          </div>
        </div>
        <nav className="desktop-nav">
          {navigation.map((item) => (
            <NavButton key={item.id} item={item} active={view === item.id} onClick={() => selectView(item.id)} />
          ))}
        </nav>
        <div className="privacy">
          <ShieldCheck size={18} />
          <div>
            <strong>全站只读</strong>
            <span>不会修改源数据</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className={`topbar ${topbarScrolled ? 'scrolled' : ''} ${topbarHidden ? 'hidden-mobile' : ''}`}>
          <div>
            <p className="kicker">YUDAN HOME</p>
            <h1>{navigation.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <div className="sync-state">
              <span className={failed ? 'status-dot error' : 'status-dot'} />
              <span>{failed ? '同步失败' : '数据已同步'} · {updatedAt}</span>
            </div>
            <button className="refresh-button" onClick={refresh} disabled={loading} aria-label="刷新数据">
              <RefreshCw size={17} className={loading ? 'spin' : ''} />
              <span>刷新</span>
            </button>
          </div>
        </header>

        <div className="page">
          {failed && (
            <div className="notice error">
              <AlertCircle size={17} />
              <span>暂时无法读取数据，请稍后刷新。页面不会使用演示数据代替真实记录。</span>
            </div>
          )}
          {!failed && data.meta?.mode !== 'live' && data.meta?.mode !== 'loading' && (
            <div className="notice">
              <AlertCircle size={17} />
              <span>部分数据源暂未连接，未连接的项目显示为空。</span>
            </div>
          )}
          <SourceStatus sources={data.meta?.sources || []} />

          {loading && data.meta?.mode === 'loading' ? (
            <LoadingView view={view} />
          ) : (
            <div className="page-transition" key={view}>
              {view === 'overview' && (
                <Overview
                  data={data}
                  weights={weights}
                  latestWeight={latestWeight}
                  weightChange={weightChange}
                  months={months}
                  currentMonth={currentMonth}
                  expenseChange={expenseChange}
                  nextVaccine={nextVaccine}
                  nextCare={nextCare}
                  nextEvent={nextEvent}
                  babyDays={babyDays}
                  birthday={birthday}
                  onNavigate={selectView}
                />
              )}
              {view === 'growth' && (
                <GrowthView weights={weights} carePlan={carePlan} latestWeight={latestWeight} weightChange={weightChange} />
              )}
              {view === 'ledger' && (
                <LedgerView months={months} transactions={data.ledger?.transactions || []} currentMonth={currentMonth} expenseChange={expenseChange} />
              )}
              {view === 'pantry' && <PantryView pantry={data.pantry || emptyData.pantry} />}
            </div>
          )}
        </div>
      </main>

      <nav className="mobile-nav">
        {navigation.map((item) => (
          <NavButton key={item.id} item={item} active={view === item.id} onClick={() => selectView(item.id)} mobile />
        ))}
      </nav>

      <button
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="回到顶部"
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}

/* ---------- Loading Skeleton View ---------- */

function LoadingView({ view }) {
  return (
    <div className="page-transition">
      {view === 'overview' && (
        <>
          <div className="hero-card section-card" style={{ opacity: 0.7 }}>
            <div className="skeleton" style={{ height: 64, width: '60%' }} />
          </div>
          <div className="metric-grid">
            {[1, 2, 3, 4].map((i) => <MetricSkeleton key={i} />)}
          </div>
          <div className="editorial-layout loading-editorial">
            <div className="editorial-primary">
              <SectionSkeleton tall />
              <SectionSkeleton tall />
              <SectionSkeleton />
            </div>
            <div className="editorial-aside">
              <SectionSkeleton />
              <SectionSkeleton />
            </div>
          </div>
        </>
      )}
      {view === 'growth' && (
        <div className="detail-layout">
          <SectionSkeleton tall />
          <SectionSkeleton tall />
        </div>
      )}
      {view === 'ledger' && (
        <>
          <div className="metric-grid compact">
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
          <div className="detail-layout ledger-layout">
            <SectionSkeleton tall />
            <SectionSkeleton tall />
          </div>
        </>
      )}
      {view === 'pantry' && (
        <>
          <div className="metric-grid compact three">
            {[1, 2, 3].map((i) => <MetricSkeleton key={i} />)}
          </div>
          <SectionSkeleton />
        </>
      )}
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="metric-card metric-skeleton">
      <div className="skeleton skeleton-icon" />
      <div className="skeleton skeleton-label" />
      <div className="skeleton skeleton-value" />
    </div>
  );
}

function SectionSkeleton({ tall }) {
  return (
    <div className="section-card" style={{ minHeight: tall ? 300 : 160 }}>
      <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 20 }} />
      <div className="skeleton" style={{ height: tall ? 200 : 60, width: '100%' }} />
    </div>
  );
}

/* ---------- Overview ---------- */

function Overview({ data, weights, latestWeight, weightChange, months, currentMonth, expenseChange, nextVaccine, nextCare, nextEvent, babyDays, birthday, onNavigate }) {
  const pantry = data.pantry || emptyData.pantry;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <HeroCard babyDays={babyDays} birthday={birthday} nextEvent={nextEvent} today={today} latestWeight={latestWeight} />

      <section className="metric-grid editorial-metrics" aria-label="家庭关键数据">
        <Metric icon={Baby} tone="teal" label="最新体重" value={latestWeight ? formatWeight(latestWeight.weight) : '暂无记录'} unit={latestWeight ? 'kg' : ''} detail={latestWeight ? formatDate(latestWeight.date) : '成长数据'} delta={weightChange} deltaUnit=" kg" deltaType="weight" />
        <Metric icon={Syringe} tone="blue" label="下次疫苗" value={nextVaccine ? formatDate(nextVaccine.date, true) : '暂无计划'} detail={nextVaccine?.name || '疫苗计划'} />
        <Metric icon={CircleDollarSign} tone="red" label="本月支出" value={formatCurrency(currentMonth?.expense || 0)} detail={`${currentMonth?.transactionCount || 0} 笔家庭账目`} delta={expenseChange} currencyDelta deltaType="expense" />
        <Metric icon={ShoppingBag} tone="amber" label="用品提醒" value={String(pantry.low || 0)} unit="项" detail={`${pantry.outOfStock || 0} 项已经缺货`} />
      </section>

      <section className="editorial-layout">
        <div className="editorial-primary">
          <section className="section-card growth-feature">
            <SectionTitle eyebrow="成长记录" title="体重变化" action="查看全部" onClick={() => onNavigate('growth')} />
            <WeightChart weights={weights} large />
          </section>

          <section className="section-card ledger-feature">
            <SectionTitle eyebrow="家庭账本" title="近六个月支出" action="账本详情" onClick={() => onNavigate('ledger')} />
            <ExpenseChart months={months} />
          </section>

          <section className="section-card transaction-card">
            <SectionTitle eyebrow="最近发生" title="家庭账目" action="查看全部" onClick={() => onNavigate('ledger')} />
            <TransactionList items={data.ledger?.transactions?.slice(0, 5) || []} />
          </section>
        </div>

        <aside className="editorial-aside">
          <section className="agenda-panel">
            <SectionTitle eyebrow="接下来" title="疫苗与儿保" action="完整计划" onClick={() => onNavigate('growth')} />
            <div className="agenda-list">
              {nextVaccine && <NextEventCard event={nextVaccine} type="vaccine" subtitle="下一项疫苗" today={today} />}
              {nextCare && <NextEventCard event={nextCare} type="care" subtitle="下一次儿保" today={today} />}
              {!nextVaccine && !nextCare && <Empty text="暂无近期安排" />}
            </div>
          </section>

          <section className="restock-panel">
            <SectionTitle eyebrow="需要准备" title="用品补货" action="查看库存" onClick={() => onNavigate('pantry')} />
            {pantry.items?.length ? (
              <div className="attention-list">
                {pantry.items.slice(0, 5).map((item) => (
                  <div className="attention-row" key={item.name}>
                    <span className="item-icon"><PackageCheck size={16} /></span>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.status || '需要关注'} · 安全线 {item.minimum ?? '--'} {item.unit}</span>
                    </div>
                    <b>{item.suggested > 0 ? `补 ${item.suggested}` : `剩 ${item.stock}`} {item.unit}</b>
                  </div>
                ))}
              </div>
            ) : <Empty text="当前没有需要补货的用品" />}
          </section>
        </aside>
      </section>
    </>
  );
}

function HeroCard({ babyDays, birthday, nextEvent, today, latestWeight }) {
  const isKnownBirthday = birthday !== BABY_BIRTHDAY_FALLBACK;
  const ageText = isKnownBirthday && babyDays >= 0
    ? `来到世界的第 ${babyDays} 天`
    : '鱼蛋的成长日记';
  const daysToEvent = nextEvent ? daysBetween(today, nextEvent.date) : null;
  const todayLabel = new Date(today + 'T00:00:00').toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <section className="hero-card">
      <div className="hero-date">
        <span>{todayLabel}</span>
        <i />
        <span>家庭成长手册</span>
      </div>
      <div className="hero-content">
        <div className="hero-greeting">
          <p className="hero-overline">YUDAN'S JOURNAL</p>
          <h2>{ageText}</h2>
          <p className="hero-copy">记录每一次成长，也照看生活里那些需要被记住的小事。</p>
          {latestWeight && <span className="hero-weight">最近体重 {formatWeight(latestWeight.weight)} kg · {formatDate(latestWeight.date)}</span>}
        </div>
        {nextEvent && daysToEvent !== null && (
          <div className="hero-countdown">
            <Clock size={18} />
            <div>
              <span>下一项安排</span>
              <strong>{nextEvent.label}</strong>
              <em>{daysToEvent <= 0 ? '就在今天' : `${daysToEvent} 天后`}</em>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function NextEventCard({ event, type, subtitle, today, compact = false }) {
  const date = new Date(event.date + 'T00:00:00');
  const daysLeft = daysBetween(today, event.date);
  return (
    <div className={`next-event ${compact ? 'compact' : ''}`}>
      <div className={`date-block ${type === 'care' ? 'teal' : ''}`}>
        <strong>{date.getDate()}</strong>
        <span>{date.toLocaleDateString('zh-CN', { month: 'short' })}</span>
      </div>
      <div>
        <strong>{event.name || event.label}</strong>
        <span>{subtitle}</span>
        <div className="countdown-pill">
          <Sparkles size={11} />
          {daysLeft <= 0 ? '今天' : `${daysLeft} 天后`}
        </div>
      </div>
    </div>
  );
}

/* ---------- Growth View ---------- */

function GrowthView({ weights, carePlan, latestWeight, weightChange }) {
  return (
    <div className="detail-layout">
      <section className="section-card detail-main">
        <SectionTitle eyebrow="成长趋势" title="体重记录" />
        <div className="detail-summary">
          <div>
            <span>最新体重</span>
            <strong>{latestWeight ? formatWeight(latestWeight.weight) : '--'} <small>kg</small></strong>
          </div>
          <Delta value={weightChange} suffix=" kg" label="较上次" deltaType="weight" />
        </div>
        <WeightChart weights={weights} large />
        <div className="record-table">
          <div className="table-head"><span>日期</span><span>体重</span><span>较上次</span></div>
          {weights.map((item, index) => {
            const older = weights[index + 1];
            return (
              <div className="table-row" key={item.date}>
                <span>{formatDate(item.date)}</span>
                <strong>{formatWeight(item.weight)} kg</strong>
                <Delta value={older ? item.weight - older.weight : null} suffix=" kg" deltaType="weight" />
              </div>
            );
          })}
        </div>
      </section>

      <div className="detail-stack">
        <section className="section-card detail-side care-plan-card">
          <SectionTitle eyebrow="疫苗 · 卓正儿保" title="儿童保健计划" />
          <CarePlanTimeline items={carePlan} />
        </section>
      </div>
    </div>
  );
}

function CarePlanTimeline({ items }) {
  const today = new Date().toISOString().slice(0, 10);
  const [expanded, setExpanded] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const nextIndex = items.findIndex((item) => !item.actualDate && !isCompletedStatus(item.status) && item.date >= today);

  const visibleItems = useMemo(() => {
    if (!isMobile || expanded || nextIndex <= 0) return items;
    return items.filter((_, index) => index >= Math.max(0, nextIndex - 1));
  }, [items, isMobile, expanded, nextIndex]);

  const hiddenCount = items.length - visibleItems.length;

  if (!items.length) return <Empty text="暂无儿童保健计划" />;

  return (
    <>
      <div className="timeline care-timeline">
        {visibleItems.map((item) => {
          const originalIndex = items.indexOf(item);
          const completed = Boolean(item.actualDate) || isCompletedStatus(item.status) || originalIndex < nextIndex || nextIndex < 0;
          const markerClass = completed ? 'done' : item === items[nextIndex] ? 'current' : '';
          return (
            <div className="timeline-item" key={[item.recordType, item.planId || item.id || item.name || item.label, item.date, item.originalIndex].join('-')}>
              <i className={markerClass} />
              <div>
                <div className="timeline-meta">
                  <span>{formatDate(item.date)}{item.weekday ? ' · ' + item.weekday : ''}</span>
                  <b className={'source-tag ' + item.recordType}>{item.source || (item.recordType === 'vaccine' ? '疫苗' : '卓正儿保')}</b>
                  {item.status && <em>{item.status}</em>}
                </div>
                <strong>{item.name || item.label}</strong>
              </div>
            </div>
          );
        })}
      </div>
      {isMobile && hiddenCount > 0 && (
        <button className="timeline-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? <><ChevronUp size={14} /> 收起已完成项目</> : <><ChevronDown size={14} /> 展开 {hiddenCount} 项已完成</>}
        </button>
      )}
    </>
  );
}

/* ---------- Ledger View ---------- */

function LedgerView({ months, transactions, currentMonth, expenseChange }) {
  return (
    <>
      <section className="metric-grid compact three">
        <Metric icon={CircleDollarSign} tone="red" label="本月支出" value={formatCurrency(currentMonth?.expense || 0)} detail="当前自然月" delta={expenseChange} currencyDelta deltaType="expense" />
        <Metric icon={WalletCards} tone="teal" label="本月笔数" value={String(currentMonth?.transactionCount || 0)} unit="笔" detail="交易记录" />
        <Metric icon={CalendarDays} tone="blue" label="近六个月" value={formatCurrency(months.reduce((sum, item) => sum + Number(item.expense || 0), 0))} detail="累计支出" />
      </section>
      <div className="detail-layout ledger-layout">
        <section className="section-card detail-main">
          <SectionTitle eyebrow="月度趋势" title="近六个月支出" />
          <ExpenseChart months={months} large />
        </section>
        <section className="section-card detail-side">
          <SectionTitle eyebrow="消费明细" title="最近账目" />
          <TransactionList items={transactions} />
        </section>
      </div>
    </>
  );
}

/* ---------- Pantry View ---------- */

function PantryView({ pantry }) {
  return (
    <>
      <section className="metric-grid">
        <Metric icon={PackageCheck} tone="teal" label="启用商品" value={String(pantry.total || 0)} unit="种" detail="用品总数" />
        <Metric icon={AlertCircle} tone="red" label="已缺货" value={String(pantry.outOfStock || 0)} unit="项" detail="需要优先购买" />
        <Metric icon={ShoppingBag} tone="amber" label="待补货" value={String(pantry.low || 0)} unit="项" detail="达到安全线" />
        <Metric icon={CalendarDays} tone="blue" label="近期临期" value={String(pantry.nearExpiry || 0)} unit="项" detail="未来 30 天" />
      </section>
      <section className="section-card">
        <SectionTitle eyebrow="库存关注" title="补货清单" />
        <div className="inventory-table">
          <div className="inventory-head"><span>商品</span><span>当前库存</span><span>状态</span></div>
          {pantry.items?.length ? (
            pantry.items.map((item) => (
              <div className="inventory-row" key={item.name}>
                <div>
                  <span className="item-icon"><PackageCheck size={16} /></span>
                  <strong>{item.name}</strong>
                </div>
                <b>{item.stock} {item.unit}</b>
                <StatusTag status={item.status} />
              </div>
            ))
          ) : (
            <Empty text="当前没有需要关注的库存" />
          )}
        </div>
      </section>
    </>
  );
}

function StatusTag({ status }) {
  const text = status || '需关注';
  let tone = 'warning';
  if (/缺货|耗尽|紧急/.test(text)) tone = 'danger';
  if (/充足|正常/.test(text)) tone = 'success';
  return <span className={`tag ${tone}`}>{text}</span>;
}

/* ---------- Reusable Components ---------- */

function Metric({ icon: Icon, tone, label, value, unit, detail, delta, deltaUnit, currencyDelta, deltaType }) {
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

function Delta({ value, suffix = '', label, currency, deltaType }) {
  if (value === null || value === undefined) return <span className="delta neutral">--</span>;
  const num = Number(value);
  const positive = num >= 0;

  // Semantic mapping: weight up = good (green), expense up = bad (red)
  let tone = positive ? 'up' : 'down';
  if (deltaType === 'weight') {
    tone = positive ? 'positive' : 'negative';
  } else if (deltaType === 'expense') {
    tone = positive ? 'negative' : 'positive';
  }

  const absValue = currency ? formatCurrency(Math.abs(num)) : Math.abs(num).toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + suffix;

  return (
    <span className={`delta ${tone}`}>
      {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {absValue}
      {label && <em>{label}</em>}
    </span>
  );
}

function WeightChart({ weights, large }) {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const items = weights.slice(0, large ? 12 : 8).reverse();

  if (!items.length) return <Empty text="暂无体重记录" />;

  const values = items.map((item) => Number(item.weight));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.2, 0.05);
  const low = min - padding;
  const high = max + padding;
  const width = 640;
  const height = large ? 290 : 220;
  const x = (index) => 36 + index * ((width - 72) / Math.max(items.length - 1, 1));
  const y = (value) => 20 + (high - value) / Math.max(high - low, 0.1) * (height - 58);
  const points = items.map((item, index) => x(index) + ',' + y(item.weight)).join(' ');
  const areaPoints = `${x(0)},${height - 38} ${points} ${x(items.length - 1)},${height - 38}`;

  const gridLines = [0.25, 0.5, 0.75].map((ratio) => (
    <line
      key={ratio}
      x1="36"
      y1={20 + ratio * (height - 58)}
      x2={width - 20}
      y2={20 + ratio * (height - 58)}
      className="chart-grid-line"
    />
  ));

  return (
    <div className={`line-chart ${large ? 'large' : ''}`} ref={containerRef}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="体重趋势图">
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--teal-500)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--teal-500)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridLines}
        <line x1="36" y1={height - 38} x2={width - 20} y2={height - 38} className="axis-line" />
        <polyline points={areaPoints} className="weight-area" />
        <polyline points={points} className="weight-line" />
        {items.map((item, index) => (
          <g key={item.date}>
            <circle
              cx={x(index)}
              cy={y(item.weight)}
              r={index === items.length - 1 ? 6 : 4}
              className={index === items.length - 1 ? 'point latest' : 'point'}
              onMouseEnter={() => setTooltip({
                x: (x(index) / width) * 100,
                y: (y(item.weight) / height) * 100,
                text: `${formatDate(item.date)} · ${formatWeight(item.weight)} kg`,
              })}
              onMouseLeave={() => setTooltip(null)}
            />
            <text x={x(index)} y={height - 16} textAnchor="middle" className="chart-label">{shortDate(item.date)}</text>
            {(large || index === items.length - 1) && (
              <text x={x(index)} y={y(item.weight) - 12} textAnchor="middle" className="chart-value">{formatWeight(item.weight)}</text>
            )}
          </g>
        ))}
      </svg>
      {tooltip && (
        <div
          className={`chart-tooltip ${tooltip ? 'visible' : ''}`}
          style={{ left: `${tooltip.x}%`, top: `${tooltip.y}%` }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

function ExpenseChart({ months, large }) {
  if (!months.length) return <Empty text="暂无支出记录" />;
  const max = Math.max(...months.map((item) => Number(item.expense || 0)), 1);
  const currentMonthLabels = [
    new Date().toISOString().slice(0, 7),
    `${new Date().getMonth() + 1}月`,
  ];

  return (
    <div className={`expense-chart ${large ? 'large' : ''}`}>
      {months.map((item) => {
        const isCurrent = currentMonthLabels.includes(item.month);
        return (
          <div className={`expense-column ${isCurrent ? 'current' : ''}`} key={item.month}>
            <div className="expense-value">{item.expense ? compactCurrency(item.expense) : '¥0'}</div>
            <div className="expense-track">
              <div className="expense-bar" style={{ height: Math.max(4, Number(item.expense || 0) / max * 100) + '%' }} />
            </div>
            <span>{item.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function TransactionList({ items }) {
  if (!items.length) return <Empty text="暂无账目" />;
  return (
    <div className="transaction-list">
      {items.map((item, index) => (
        <div className="transaction-row" key={(item.date || '') + index}>
          <span className="item-icon money"><WalletCards size={16} /></span>
          <div>
            <strong>{item.title || '家庭支出'}</strong>
            <span>{formatDate(item.date)} · {item.category || '未分类'}</span>
          </div>
          <b>{formatCurrency(Math.abs(Number(item.amount || 0)))}</b>
        </div>
      ))}
    </div>
  );
}

function SourceStatus({ sources }) {
  if (!sources.length) return null;
  const offline = sources.filter((source) => !source.ok);
  if (!offline.length) {
    return (
      <div className="source-strip source-summary">
        <span className="online"><i />{sources.length} 个数据源正常</span>
      </div>
    );
  }
  return (
    <div className="source-strip">
      {sources.map((source) => (
        <span key={source.name} className={source.ok ? 'online' : 'offline'}>
          <i />
          {source.name}
          <b>{source.ok ? '已连接' : '待配置'}</b>
        </span>
      ))}
    </div>
  );
}

function SectionTitle({ eyebrow, title, action, onClick }) {
  return (
    <div className="section-title">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action && <button onClick={onClick}>{action}</button>}
    </div>
  );
}

function NavButton({ item, active, onClick, mobile }) {
  const Icon = item.icon;
  return (
    <button className={active ? 'active' : ''} onClick={onClick} aria-current={active ? 'page' : undefined}>
      <Icon size={mobile ? 20 : 18} />
      <span>{mobile ? item.short : item.label}</span>
    </button>
  );
}

function Empty({ text }) {
  return (
    <div className="empty">
      <CheckCircle2 size={20} />
      <span>{text}</span>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
