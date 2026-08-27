import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ChapterHeading from '../ChapterHeading.jsx';
import WeightChart from '../charts/WeightChart.jsx';
import SectionTitle from '../shared/SectionTitle.jsx';
import Empty from '../shared/Empty.jsx';
import { Delta } from '../shared/Metric.jsx';
import { chapterLeads } from '../../lib/data.js';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { formatDate, formatWeight, isCompletedStatus, shanghaiDateKey } from '../../lib/utils.js';

const TIMELINE_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'todo', label: '未完成' },
  { id: 'done', label: '已完成' },
];

function CareTimeline({ items }) {
  const today = shanghaiDateKey();
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const nextIndex = items.findIndex((item) => !item.actualDate && !isCompletedStatus(item.status) && item.date >= today);
  const collapseStart = nextIndex > 0 ? Math.max(0, nextIndex - 1) : 0;

  const enriched = useMemo(() => items.map((item) => {
    const completed = Boolean(item.actualDate) || isCompletedStatus(item.status);
    return { ...item, completed, overdue: !completed && item.date < today };
  }), [items, today]);

  const counts = useMemo(() => ({
    todo: enriched.filter((item) => !item.completed).length,
    done: enriched.filter((item) => item.completed).length,
  }), [enriched]);

  if (!items.length) return <Empty text="暂无儿童保健计划" />;

  const filtered = filter === 'todo'
    ? enriched.filter((item) => !item.completed)
    : filter === 'done'
      ? enriched.filter((item) => item.completed)
      : enriched;

  const collapseActive = filter === 'all' && isMobile && collapseStart > 0;
  const visibleItems = collapseActive && !expanded ? filtered.slice(collapseStart) : filtered;
  const hiddenCount = collapseActive ? collapseStart : 0;

  return (
    <>
      <div className="chip-row" role="tablist" aria-label="时间线筛选">
        {TIMELINE_FILTERS.map((option) => (
          <button
            key={option.id}
            className={`chip ${filter === option.id ? 'active' : ''}`}
            onClick={() => setFilter(option.id)}
            role="tab"
            aria-selected={filter === option.id}
          >
            {option.label}{option.id === 'todo' && counts.todo ? ` · ${counts.todo}` : ''}{option.id === 'done' && counts.done ? ` · ${counts.done}` : ''}
          </button>
        ))}
      </div>
      {visibleItems.length ? (
        <div className="timeline care-timeline">
          {visibleItems.map((item) => {
            const markerClass = item.completed ? 'done' : item === enriched[nextIndex] ? 'current' : item.overdue ? 'overdue' : '';
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
      ) : <Empty text="没有符合条件的项目" small />}
      {hiddenCount > 0 && (
        <button className="timeline-toggle" onClick={() => setExpanded((value) => !value)}>
          {expanded ? <><ChevronUp size={14} /> 收起已完成项目</> : <><ChevronDown size={14} /> 展开 {hiddenCount} 项已完成</>}
        </button>
      )}
    </>
  );
}

export default function GrowthSection({ weights, carePlan, latestWeight, weightChange }) {
  return (
    <section className="chapter" id="chapter-growth" data-chapter="growth">
      <ChapterHeading number="02" en="GROWTH & CARE" title="成长健康" lead={chapterLeads.growth} />

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
          {!weights.length && <Empty text="暂无体重记录" />}
        </section>

        <section className="section-card detail-side care-plan-card">
          <SectionTitle eyebrow="疫苗 · 卓正儿保" title="儿童保健计划" />
          <CareTimeline items={carePlan} />
        </section>
      </div>
    </section>
  );
}
