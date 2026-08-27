import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertCircle, ArrowUp } from 'lucide-react';
import { BABY_BIRTHDAY_FALLBACK, chapters, emptyData } from './lib/data.js';
import { daysBetween, isCompletedStatus, shanghaiDateKey } from './lib/utils.js';
import { useMediaQuery } from './hooks/useMediaQuery.js';
import TopBar from './components/TopBar.jsx';
import MobileNav from './components/MobileNav.jsx';
import SourceStatus from './components/SourceStatus.jsx';
import LoadingView from './components/LoadingView.jsx';
import TodaySection from './components/today/TodaySection.jsx';
import GrowthSection from './components/growth/GrowthSection.jsx';
import LedgerSection from './components/ledger/LedgerSection.jsx';
import PantrySection from './components/pantry/PantrySection.jsx';
import './styles.css';

/* ---------- Error boundary ---------- */

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('Yudan Home render failed', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="fatal-error" role="alert">
          <AlertCircle size={28} />
          <h1>页面暂时无法显示</h1>
          <p>数据没有被修改，请刷新页面重试。</p>
          <button onClick={() => window.location.reload()}>重新加载</button>
        </main>
      );
    }
    return this.props.children;
  }
}

/* ---------- Main App ---------- */

function App() {
  const [data, setData] = useState(emptyData);
  const [active, setActive] = useState('today');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [topbarScrolled, setTopbarScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

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
      setTopbarScrolled(window.scrollY > 8);
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dataReady = !loading || data.meta?.mode !== 'loading';

  /* Desktop scrollspy: highlight chapter nav while scrolling */
  useEffect(() => {
    if (isMobile || !dataReady || typeof document === 'undefined') return undefined;
    const elements = Array.from(document.querySelectorAll('.chapter[data-chapter]'));
    if (!elements.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.dataset.chapter);
      });
    }, { rootMargin: '-30% 0px -55% 0px' });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [isMobile, dataReady]);

  const goTo = useCallback((id) => {
    setActive(id);
    if (isMobile || typeof document === 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(`chapter-${id}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [isMobile]);

  /* ---------- Derived data ---------- */

  const weights = data.growth?.weights || [];
  const latestWeight = weights[0];
  const previousWeight = weights[1];
  const weightChange = latestWeight && previousWeight ? latestWeight.weight - previousWeight.weight : null;

  const months = data.ledger?.monthly || [];
  const currentMonth = months.at(-1);
  const previousMonth = months.at(-2);
  const expenseChange = currentMonth?.available !== false && previousMonth?.available !== false && currentMonth && previousMonth
    ? currentMonth.expense - previousMonth.expense
    : null;

  const nextVaccine = useMemo(() => {
    const today = shanghaiDateKey();
    return (data.vaccines || [])
      .filter((item) => item.date >= today && !item.actualDate && !isCompletedStatus(item.status))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0] || null;
  }, [data.vaccines]);

  const nextCare = useMemo(() => {
    const today = shanghaiDateKey();
    return (data.care?.milestones || []).find((item) => item.date >= today) || null;
  }, [data.care]);

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

  const birthday = data.care?.birthday || BABY_BIRTHDAY_FALLBACK;
  const babyDays = daysBetween(birthday, shanghaiDateKey());

  const updatedAt = data.meta?.updatedAt
    ? new Date(data.meta.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const syncLabel = failed ? '同步失败' : `数据已同步 · ${updatedAt}`;
  const pantry = data.pantry || emptyData.pantry;

  const renderSection = (id) => {
    switch (id) {
      case 'today':
        return (
          <TodaySection
            nextVaccine={nextVaccine}
            nextCare={nextCare}
            pantry={pantry}
            currentMonth={currentMonth}
            latestWeight={latestWeight}
            weightChange={weightChange}
            weights={weights}
            babyDays={babyDays}
            birthday={birthday}
            goTo={goTo}
          />
        );
      case 'growth':
        return <GrowthSection weights={weights} carePlan={carePlan} latestWeight={latestWeight} weightChange={weightChange} />;
      case 'ledger':
        return <LedgerSection months={months} transactions={data.ledger?.transactions || []} currentMonth={currentMonth} expenseChange={expenseChange} />;
      case 'pantry':
        return <PantrySection pantry={pantry} />;
      default:
        return null;
    }
  };

  const initialLoading = loading && data.meta?.mode === 'loading';

  return (
    <div className="shell">
      <TopBar
        chapters={chapters}
        active={active}
        isMobile={isMobile}
        scrolled={topbarScrolled}
        onSelect={goTo}
        syncLabel={syncLabel}
        failed={failed}
        loading={loading}
        onRefresh={refresh}
      />

      <main className="magazine">
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

        {initialLoading ? (
          <LoadingView isMobile={isMobile} active={active} />
        ) : isMobile ? (
          <div className="page-transition" key={active}>
            {renderSection(active)}
          </div>
        ) : (
          <div className="page-transition">
            {chapters.map((chapter) => (
              <React.Fragment key={chapter.id}>{renderSection(chapter.id)}</React.Fragment>
            ))}
          </div>
        )}
      </main>

      {isMobile && <MobileNav chapters={chapters} active={active} onSelect={goTo} />}

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

if (typeof document !== 'undefined') {
  createRoot(document.getElementById('root')).render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>,
  );
}

export { App, AppErrorBoundary };
export { shanghaiDateKey } from './lib/utils.js';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
