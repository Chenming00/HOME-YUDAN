import { ArrowUpRight, CalendarDays, HeartPulse, Sprout, ShoppingBag, Syringe, WalletCards } from 'lucide-react';
import WeightOverview from '../growth/WeightOverview.jsx';
import Empty from '../shared/Empty.jsx';
import { daysBetween, formatCurrency, formatDate, shanghaiDateKey } from '../../lib/utils.js';

export const focusOptions = [
  { id: 'weight', label: '体重成长', description: '把每一次变化，慢慢记下来。' },
  { id: 'care', label: '疫苗儿保', description: '把接下来的成长安排，提前准备好。' },
  { id: 'supplies', label: '生活准备', description: '照看日常所需，也照看家的小事。' },
];

function CarePreview({ nextVaccine, nextCare, goTo }) {
  const items = [
    nextVaccine && { ...nextVaccine, title: nextVaccine.name, label: '下一针疫苗', Icon: Syringe },
    nextCare && { ...nextCare, title: nextCare.label, label: '下一次儿保', Icon: HeartPulse },
  ].filter(Boolean);
  return <section className="journal-panel" aria-label="接下来的安排">
    <div className="panel-title"><h2>接下来的安排</h2><span>疫苗 · 儿保</span></div>
    {items.length ? items.map((item) => {
      const days = daysBetween(shanghaiDateKey(), item.date);
      return <button type="button" className="care-preview-row" key={item.label} onClick={() => goTo('growth', 'care')}>
        <span className="focus-icon clay"><item.Icon size={18} /></span>
        <span className="focus-body"><span>{item.label}</span><strong>{item.title}</strong><span>{formatDate(item.date)}</span></span>
        <span className="care-countdown">{days === 0 ? '今天' : `${days} 天后`}<ArrowUpRight size={15} /></span>
      </button>;
    }) : <Empty text="暂无已同步的后续安排" small />}
  </section>;
}

function LifePreview({ pantry, currentMonth, sources, goTo }) {
  const pantrySource = sources.find((source) => source.name === '鱼蛋宝贝消耗品');
  const pantryKnown = Boolean(pantrySource?.ok || pantrySource?.partial || pantry.allItems?.length);
  const restock = (pantry.outOfStock || 0) + (pantry.low || 0);
  const expiry = (pantry.nearExpiry || 0) + (pantry.expired || 0);
  const monthKnown = currentMonth && currentMonth.available !== false;
  return <section className="journal-panel" aria-label="家里的小事">
    <div className="panel-title"><h2>家里的小事</h2><span>日常 · 准备</span></div>
    <button className="life-row" onClick={() => goTo('pantry')}><span className="focus-icon"><ShoppingBag size={18} /></span><span><strong>用品补货</strong><small>{pantryKnown ? restock ? `${pantry.outOfStock || 0} 项缺货 · ${pantry.low || 0} 项偏低` : '当前库存暂无补货提醒' : '等待库存数据同步'}</small></span><b>{pantryKnown ? restock : '—'}<small> 项</small></b><ArrowUpRight size={16} /></button>
    {expiry > 0 && <button className="life-row" onClick={() => goTo('pantry')}><span className="focus-icon clay"><CalendarDays size={18} /></span><span><strong>留意有效期</strong><small>{pantry.nearExpiry || 0} 项临期 · {pantry.expired || 0} 项过期</small></span><b>{expiry}<small> 项</small></b><ArrowUpRight size={16} /></button>}
    <button className="life-row" onClick={() => goTo('ledger')}><span className="focus-icon"><WalletCards size={18} /></span><span><strong>本月支出</strong><small>{monthKnown ? `${currentMonth.transactionCount || 0} 笔家庭账目` : '等待账本数据同步'}</small></span><b>{monthKnown ? formatCurrency(currentMonth.expense) : '—'}</b><ArrowUpRight size={16} /></button>
  </section>;
}

export default function TodaySection({ nextVaccine, nextCare, pantry, currentMonth, weights, babyDays, birthday, goTo, focus, onFocusChange, sources, weightAvailable }) {
  const selected = focusOptions.find((item) => item.id === focus) || focusOptions[0];
  const today = shanghaiDateKey();
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  const panels = {
    weight: <WeightOverview weights={weights} available={weightAvailable} onViewRecords={() => goTo('growth', 'weight')} />,
    care: <CarePreview nextVaccine={nextVaccine} nextCare={nextCare} goTo={goTo} />,
    supplies: <LifePreview pantry={pantry} currentMonth={currentMonth} sources={sources} goTo={goTo} />,
  };
  return <section className="chapter home-chapter" id="chapter-today" data-chapter="today">
    <header className="journal-heading">
      <div><p className="journal-eyebrow">YUDAN / 成长手记</p><h1>陪鱼蛋，一点点长大<span>。</span></h1><p className="journal-subtitle">{birthday && babyDays >= 0 ? <>出生第 <strong>{babyDays + 1}</strong> 天<span className="text-divider">/</span></> : null}<time dateTime={today}>{dateLabel}</time></p></div>
      <div className="journal-seal" aria-hidden="true"><Sprout size={21} /><span>家的每一天<br />都值得记住</span></div>
    </header>
    <div className="focus-toolbar">
      <div><span className="focus-dot" /><strong>当前关注</strong><span className="focus-description">{selected.description}</span></div>
      <label className="focus-select"><span className="sr-only">切换当前关注</span><select value={selected.id} onChange={(event) => onFocusChange(event.target.value)}>{focusOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
    </div>
    <div className="home-primary" key={selected.id}>{panels[selected.id]}</div>
    <div className={`home-secondary ${selected.id !== 'weight' ? 'has-weight' : ''}`}>{focusOptions.filter((option) => option.id !== selected.id).map((option) => <div key={option.id}>{panels[option.id]}</div>)}</div>
    <p className="journal-footnote">不同阶段，有不同的牵挂。当前关注可随时切换，选择会保存在这台设备。</p>
  </section>;
}
