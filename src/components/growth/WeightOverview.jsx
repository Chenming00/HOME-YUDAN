import { useState } from 'react';
import { ArrowUpRight, Scale } from 'lucide-react';
import WeightChart from '../charts/WeightChart.jsx';
import { Delta } from '../shared/Metric.jsx';
import { formatDate, formatWeight } from '../../lib/utils.js';
import { Button } from '../ui/button.jsx';

const ranges = [{ count: 12, label: '近 12 次' }, { count: 30, label: '近 30 次' }, { count: 0, label: '全部' }];

export default function WeightOverview({ weights, available = true, onViewRecords }) {
  const [count, setCount] = useState(12);
  const latest = weights[0];
  const previous = weights[1];
  const visible = count ? weights.slice(0, count) : weights;

  return (
    <section className="weight-overview" aria-label="体重成长">
      <div className="weight-summary">
        <div className="weight-kicker"><Scale size={18} /><span>每一克，都是成长</span></div>
        <p className="weight-label">最新体重</p>
        <div className="weight-value"><strong>{latest ? formatWeight(latest.weight) : '—'}</strong><span>kg</span></div>
        <p className="weight-date">{latest ? <><time dateTime={latest.date}>{formatDate(latest.date)}</time> 记录</> : available ? '等待第一笔体重记录' : '体重记录暂未同步'}</p>
        <div className="weight-facts">
          <div><span>较上次记录</span><Delta value={previous ? latest.weight - previous.weight : null} suffix=" kg" deltaType="weight" /></div>
          <div><span>累计记录</span><strong>{available || weights.length ? weights.length : '—'}<small> 次</small></strong></div>
        </div>
        <a className="record-link" href="https://cost.ykn.cm" target="_blank" rel="noopener noreferrer">打开记录本 <ArrowUpRight size={16} /><span className="sr-only">（在新标签页打开）</span></a>
      </div>
      <div className="weight-plot">
        <div className="plot-heading"><div><h2>体重的变化</h2><p>{visible.length ? `${formatDate(visible.at(-1).date)} — ${formatDate(visible[0].date)}` : '每一次记录，都会在这里留下轨迹'}</p></div></div>
        <div className="range-control" role="group" aria-label="体重趋势范围">
          {ranges.map((range) => <button type="button" key={range.count} aria-pressed={count === range.count} onClick={() => setCount(range.count)}>{range.label}</button>)}
        </div>
        <WeightChart weights={visible} available={available} />
        <div className="plot-footer"><span>{visible.length ? '点击曲线上的圆点查看记录' : '同步后在这里查看体重变化'}</span>{onViewRecords && <Button variant="ghost" onClick={onViewRecords}>全部记录 <ArrowUpRight size={15} /></Button>}</div>
      </div>
    </section>
  );
}
