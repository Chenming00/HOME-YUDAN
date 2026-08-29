import { CalendarDays, CircleDollarSign, HeartPulse, PackageCheck, ShoppingBag, Syringe } from 'lucide-react';
import ChapterHeading from '../ChapterHeading.jsx';
import WeightChart from '../charts/WeightChart.jsx';
import Empty from '../shared/Empty.jsx';
import { Delta } from '../shared/Metric.jsx';
import { chapterLeads } from '../../lib/data.js';
import { daysBetween, formatCurrency, formatDate, formatWeight, shanghaiDateKey } from '../../lib/utils.js';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

function countdownPill(daysLeft) {
  if (daysLeft === 0) return { text: '就在今天', cls: 'soon' };
  if (daysLeft > 0 && daysLeft <= 3) return { text: `${daysLeft} 天后`, cls: 'soon' };
  if (daysLeft > 0) return { text: `${daysLeft} 天后`, cls: '' };
  return { text: `已过 ${Math.abs(daysLeft)} 天`, cls: 'soon' };
}

function Masthead({ babyDays, birthday, latestWeight }) {
  const today = shanghaiDateKey();
  const date = new Date(today + 'T00:00:00');
  const weekday = date.toLocaleDateString('zh-CN', { weekday: 'short' });
  const monthLabel = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
  const isKnownBirthday = Boolean(birthday);
  const title = !isKnownBirthday
    ? '鱼蛋的成长日记'
    : babyDays >= 0
      ? `来到世界的第 ${babyDays} 天`
      : '等待与鱼蛋见面';

  return (
    <header className="masthead">
      <div className="masthead-date">
        <strong>{date.getDate()}</strong>
        <span>{monthLabel} · {weekday}</span>
      </div>
      <div className="masthead-body">
        <p className="masthead-overline">YUDAN FAMILY JOURNAL</p>
        <h1 className="masthead-title">{title}</h1>
        <p className="masthead-sub">
          {latestWeight
            ? `最近体重 ${formatWeight(latestWeight.weight)} kg · ${formatDate(latestWeight.date)} 记录。照看成长，也照看生活里需要被记住的小事。`
            : '照看成长，也照看生活里需要被记住的小事。'}
        </p>
      </div>
    </header>
  );
}

function buildFocusItems({ today, nextVaccine, nextCare, pantry, currentMonth }) {
  const focus = [];
  if (nextVaccine) {
    focus.push({
      key: 'vaccine', Icon: Syringe, tone: 'clay', target: 'growth',
      title: `下一针疫苗 · ${nextVaccine.name}`,
      meta: `${formatDate(nextVaccine.date)} 建议接种`,
      pill: countdownPill(daysBetween(today, nextVaccine.date)),
    });
  }
  if (nextCare) {
    focus.push({
      key: 'care', Icon: HeartPulse, tone: 'blue', target: 'growth',
      title: `下一次儿保 · ${nextCare.label}`,
      meta: `${formatDate(nextCare.date)}${nextCare.weekday ? ' · ' + nextCare.weekday : ''}`,
      pill: countdownPill(daysBetween(today, nextCare.date)),
    });
  }
  if (pantry.outOfStock > 0) {
    focus.push({
      key: 'out', Icon: PackageCheck, tone: 'red', target: 'pantry',
      title: `${pantry.outOfStock} 项用品已缺货`,
      meta: '需要优先购买',
      count: '尽快',
    });
  }
  if (pantry.low > 0) {
    focus.push({
      key: 'low', Icon: ShoppingBag, tone: 'ochre', target: 'pantry',
      title: `${pantry.low} 项用品待补货`,
      meta: '已到达安全线',
    });
  }
  if ((pantry.nearExpiry || 0) + (pantry.expired || 0) > 0) {
    focus.push({
      key: 'expiry', Icon: CalendarDays, tone: 'ochre', target: 'pantry',
      title: `${pantry.nearExpiry || 0} 项临期 · ${pantry.expired || 0} 项过期`,
      meta: '尽快用完或处理',
    });
  }
  if (currentMonth && currentMonth.available !== false) {
    focus.push({
      key: 'ledger', Icon: CircleDollarSign, tone: 'moss', target: 'ledger',
      title: `本月已支出 ${formatCurrency(currentMonth.expense || 0)}`,
      meta: `${currentMonth.transactionCount || 0} 笔家庭账目`,
    });
  }
  return focus;
}

export default function TodaySection({ nextVaccine, nextCare, pantry, currentMonth, latestWeight, weightChange, weights, babyDays, birthday, goTo }) {
  const today = shanghaiDateKey();
  const focus = buildFocusItems({ today, nextVaccine, nextCare, pantry, currentMonth });

  return (
    <section className="chapter" id="chapter-today" data-chapter="today">
      <ChapterHeading number="01" en="TODAY" title="今天" lead={chapterLeads.today} />
      <Masthead babyDays={babyDays} birthday={birthday} latestWeight={latestWeight} />

      <div className="today-layout">
        <Card className="focus-panel" aria-label="今日焦点">
          <div className="panel-title">
            <h3>今日焦点</h3>
            <span>{focus.length ? `共 ${focus.length} 项` : ''}</span>
          </div>
          {focus.length ? (
            <div className="focus-list">
              {focus.map((item) => {
                const Icon = item.Icon;
                return (
                  <button className="focus-row" key={item.key} onClick={() => goTo(item.target)}>
                    <span className={`focus-icon ${item.tone}`}><Icon size={18} /></span>
                    <span className="focus-body">
                      <strong>{item.title}</strong>
                      <span>{item.meta}</span>
                    </span>
                    <span className="focus-aside">
                      {item.count && <Badge variant="destructive" className="focus-count">{item.count}</Badge>}
                      {item.pill && <Badge variant="secondary" className={`focus-pill ${item.pill.cls}`}>{item.pill.text}</Badge>}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : <Empty text="今天没有特别需要关注的事" />}
        </Card>

        <Card className="snapshot" aria-label="成长速览">
          <p className="snapshot-eyebrow">GROWTH SNAPSHOT · 成长速览</p>
          {latestWeight ? (
            <>
              <div className="snapshot-weight">
                <strong>{formatWeight(latestWeight.weight)}</strong>
                <small>kg</small>
              </div>
              <div className="snapshot-meta">
                <span>{formatDate(latestWeight.date)} 记录</span>
                <Delta value={weightChange} suffix=" kg" label="较上次" deltaType="weight" />
              </div>
              <div className="snapshot-chart">
                <WeightChart weights={weights} spark />
              </div>
            </>
          ) : <Empty text="暂无成长记录" small />}
        </Card>
      </div>
    </section>
  );
}
