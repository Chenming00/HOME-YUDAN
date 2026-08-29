import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertCircle } from 'lucide-react';
import { BABY_BIRTHDAY_FALLBACK, chapters, emptyData } from './lib/data.js';
import { daysBetween, isCompletedStatus, shanghaiDateKey } from './lib/utils.js';
import TopBar from './components/TopBar.jsx';
import MobileNav from './components/MobileNav.jsx';
import SourceStatus from './components/SourceStatus.jsx';
import LoadingView from './components/LoadingView.jsx';
import TodaySection from './components/today/TodaySection.jsx';
import './styles.css';

const sectionLoaders = {
  growth: () => import('./components/growth/GrowthSection.jsx'),
  ledger: () => import('./components/ledger/LedgerSection.jsx'),
  pantry: () => import('./components/pantry/PantrySection.jsx'),
};

const GrowthSection = lazy(sectionLoaders.growth);
const LedgerSection = lazy(sectionLoaders.ledger);
const PantrySection = lazy(sectionLoaders.pantry);

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

  const goTo = useCallback((id) => {
    setActive(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const prefetchSection = useCallback((id) => {
    sectionLoaders[id]?.();
  }, []);

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
    <div className="app-shell">
      <TopBar
        chapters={chapters}
        active={active}
        onSelect={goTo}
        onPrefetch={prefetchSection}
        syncLabel={syncLabel}
        failed={failed}
        loading={loading}
        onRefresh={refresh}
      />

      <main className="dashboard-main">
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

        {initialLoading ? <LoadingView active={active} /> : (
          <Suspense fallback={<LoadingView active={active} compact />}>
            <div className="page-transition" key={active}>{renderSection(active)}</div>
          </Suspense>
        )}
      </main>

      <MobileNav chapters={chapters} active={active} onSelect={goTo} onPrefetch={prefetchSection} />
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

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
