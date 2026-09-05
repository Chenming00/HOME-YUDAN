import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertCircle } from 'lucide-react';
import { BABY_BIRTHDAY_FALLBACK, chapters, emptyData } from './lib/data.js';
import { daysBetween, isCompletedStatus, shanghaiDateKey } from './lib/utils.js';
import TopBar from './components/TopBar.jsx';
import MobileNav from './components/MobileNav.jsx';
import SourceStatus from './components/SourceStatus.jsx';
import LoadingView from './components/LoadingView.jsx';
import TodaySection, { focusOptions } from './components/today/TodaySection.jsx';
import './styles.css';

const sectionLoaders = {
  growth: () => import('./components/growth/GrowthSection.jsx'),
  ledger: () => import('./components/ledger/LedgerSection.jsx'),
  pantry: () => import('./components/pantry/PantrySection.jsx'),
};
const GrowthSection = lazy(sectionLoaders.growth);
const LedgerSection = lazy(sectionLoaders.ledger);
const PantrySection = lazy(sectionLoaders.pantry);

class AppErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('Yudan Home render failed', error); }
  render() {
    if (this.state.failed) return <main className="fatal-error" role="alert"><AlertCircle size={28} /><h1>页面暂时无法显示</h1><p>数据没有被修改，请刷新页面重试。</p><button onClick={() => window.location.reload()}>重新加载</button></main>;
    return this.props.children;
  }
}

function App() {
  const [data, setData] = useState(emptyData);
  const [active, setActive] = useState('today');
  const [growthTab, setGrowthTab] = useState('weight');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [focus, setFocus] = useState(() => {
    try {
      const saved = localStorage.getItem('yudan-home-focus');
      return focusOptions.some((option) => option.id === saved) ? saved : 'weight';
    } catch { return 'weight'; }
  });
  const requestRef = useRef(null);
  const changeFocus = (value) => {
    setFocus(value);
    try { localStorage.setItem('yudan-home-focus', value); } catch { /* Private browsing may disable storage. */ }
  };
  const refresh = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch('/api/home', { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error('sync failed');
      const payload = await response.json();
      if (!['live', 'partial'].includes(payload.meta?.mode)) throw new Error('invalid response');
      if (requestRef.current === controller) setData(payload);
    } catch {
      if (requestRef.current === controller) setFailed(true);
    } finally {
      clearTimeout(timeout);
      if (requestRef.current === controller) setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    return () => { requestRef.current?.abort(); requestRef.current = null; };
  }, [refresh]);
  const goTo = useCallback((id, tab = 'weight') => {
    setActive(id);
    if (id === 'growth') setGrowthTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  const prefetchSection = useCallback((id) => { sectionLoaders[id]?.().catch(() => {}); }, []);

  const weightAvailable = data.meta?.mode !== 'loading' && data.meta?.sources?.find((source) => source.name === '鱼蛋成长看板')?.ok !== false;
  const weights = data.growth?.weights || [];
  const months = data.ledger?.monthly || [];
  const currentMonth = months.at(-1);
  const previousMonth = months.at(-2);
  const expenseChange = currentMonth?.available !== false && previousMonth?.available !== false && currentMonth && previousMonth ? currentMonth.expense - previousMonth.expense : null;
  const nextVaccine = useMemo(() => (data.vaccines || [])
    .filter((item) => item.date >= shanghaiDateKey() && !item.actualDate && !isCompletedStatus(item.status))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0] || null, [data.vaccines]);
  const nextCare = useMemo(() => (data.care?.milestones || [])
    .filter((item) => item.date >= shanghaiDateKey() && !item.actualDate && !isCompletedStatus(item.status))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0] || null, [data.care]);
  const carePlan = useMemo(() => [
    ...(data.vaccines || []).map((item) => ({ ...item, recordType: 'vaccine', source: item.source || '疫苗' })),
    ...(data.care?.milestones || []).map((item) => ({ ...item, recordType: 'care', source: item.source || '卓正儿保' })),
  ].map((item, originalIndex) => ({ ...item, originalIndex })).filter((item) => item.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.originalIndex - b.originalIndex), [data.vaccines, data.care?.milestones]);
  const birthday = data.care?.birthday || BABY_BIRTHDAY_FALLBACK;
  const updatedAt = data.meta?.updatedAt ? new Date(data.meta.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' }) : '--:--';
  const syncLabel = loading ? '正在同步…' : failed ? '同步失败' : `${data.meta?.mode === 'partial' ? '部分已同步' : '已同步'} · ${updatedAt}`;
  const initialLoading = loading && data.meta?.mode === 'loading';
  const renderSection = () => {
    switch (active) {
      case 'today': return <TodaySection weightAvailable={weightAvailable} nextVaccine={nextVaccine} nextCare={nextCare} pantry={data.pantry || emptyData.pantry} currentMonth={currentMonth} weights={weights} babyDays={daysBetween(birthday, shanghaiDateKey())} birthday={birthday} goTo={goTo} focus={focus} onFocusChange={changeFocus} sources={data.meta?.sources || []} />;
      case 'growth': return <GrowthSection weightAvailable={weightAvailable} weights={weights} carePlan={carePlan} activeTab={growthTab} onTabChange={setGrowthTab} />;
      case 'ledger': return <LedgerSection months={months} transactions={data.ledger?.transactions || []} currentMonth={currentMonth} expenseChange={expenseChange} />;
      case 'pantry': return <PantrySection pantry={data.pantry || emptyData.pantry} />;
      default: return null;
    }
  };
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">跳到主要内容</a>
    <TopBar chapters={chapters} active={active} onSelect={goTo} onPrefetch={prefetchSection} syncLabel={syncLabel} failed={failed} loading={loading} onRefresh={refresh} />
    <main className="dashboard-main" id="main-content" tabIndex={-1}>
      {failed && <div className="notice error" role="alert"><AlertCircle size={17} /><span>暂时无法读取数据，请稍后刷新。{data.meta?.updatedAt ? '已加载的记录会保留。' : '暂时没有可显示的记录。'}</span></div>}
      {!failed && data.meta?.mode === 'partial' && <div className="notice" role="status"><AlertCircle size={17} /><span>部分记录暂未同步，连接详情可在页尾查看。</span></div>}
      {initialLoading ? <LoadingView active={active} /> : <Suspense fallback={<LoadingView active={active} />}><div className="page-transition" key={active}>{renderSection()}</div></Suspense>}
      <SourceStatus sources={data.meta?.sources || []} />
    </main>
    <MobileNav chapters={chapters} active={active} onSelect={goTo} onPrefetch={prefetchSection} />
  </div>;
}

if (typeof document !== 'undefined') {
  createRoot(document.getElementById('root')).render(<AppErrorBoundary><App /></AppErrorBoundary>);
}
export { App, AppErrorBoundary };
export { shanghaiDateKey } from './lib/utils.js';
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}
