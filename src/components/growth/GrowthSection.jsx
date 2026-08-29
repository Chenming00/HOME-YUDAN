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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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

  const enriched = useMemo(() => items.map((item) => {
    const autoCompleted = item.recordType === 'care' && item.date < today;
    const completed = autoCompleted || Boolean(item.actualDate) || isCompletedStatus(item.status);
    return { ...item, autoCompleted, completed, overdue: !completed && item.date < today, status: autoCompleted ? '已完成' : item.status };
  }), [items, today]);

  const nextIndex = enriched.findIndex((item) => !item.completed && item.date >= today);
  const collapseStart = nextIndex > 0 ? Math.max(0, nextIndex - 1) : 0;

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
  const collapsedItems = collapseActive && !expanded
    ? filtered.slice(0, collapseStart).filter((item) => item.completed)
    : [];
  const visibleItems = collapsedItems.length
    ? filtered.filter((item) => !collapsedItems.includes(item))
    : filtered;
  const hiddenCount = collapsedItems.length;

  const handleFilterKeyDown = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? TIMELINE_FILTERS.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + TIMELINE_FILTERS.length) % TIMELINE_FILTERS.length;
    setFilter(TIMELINE_FILTERS[nextIndex].id);
    document.getElementById(`care-filter-${TIMELINE_FILTERS[nextIndex].id}`)?.focus();
  };

  return (
    <>
      <div className="chip-row" role="tablist" aria-label="时间线筛选">
        {TIMELINE_FILTERS.map((option, index) => (
          <Button
            key={option.id}
            id={`care-filter-${option.id}`}
            variant={filter === option.id ? 'default' : 'outline'}
            size="sm"
            className={`chip ${filter === option.id ? 'active' : ''}`}
            onClick={() => setFilter(option.id)}
            onKeyDown={(event) => handleFilterKeyDown(event, index)}
            role="tab"
            aria-selected={filter === option.id}
            aria-controls="care-timeline-panel"
            tabIndex={filter === option.id ? 0 : -1}
          >
            {option.label}{option.id === 'todo' && counts.todo ? ` · ${counts.todo}` : ''}{option.id === 'done' && counts.done ? ` · ${counts.done}` : ''}
          </Button>
        ))}
      </div>
      <div id="care-timeline-panel" role="tabpanel" aria-labelledby={`care-filter-${filter}`}>
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
      </div>
      {hiddenCount > 0 && (
        <Button
          variant="outline"
          className="timeline-toggle"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls="care-timeline-panel"
        >
          {expanded ? <><ChevronUp size={14} /> 收起已完成项目</> : <><ChevronDown size={14} /> 展开 {hiddenCount} 项已完成</>}
        </Button>
      )}
    </>
  );
}

const GROWTH_TABS = [
  { id: 'weight', label: '体重' },
  { id: 'care', label: '保健' },
];

export default function GrowthSection({ weights, carePlan, latestWeight, weightChange }) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [activeTab, setActiveTab] = useState('weight');

  const weightCard = (
    <Card className="section-card detail-main">
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
    </Card>
  );

  const careCard = (
    <Card className="section-card detail-side care-plan-card">
      <SectionTitle eyebrow="疫苗 · 卓正儿保" title="儿童保健计划" />
      <CareTimeline items={carePlan} />
    </Card>
  );

  return (
    <section className="chapter" id="chapter-growth" data-chapter="growth">
      <ChapterHeading number="02" en="GROWTH & CARE" title="成长健康" lead={chapterLeads.growth} />

      {isMobile && (
        <div className="growth-tabs" role="tablist" aria-label="成长健康切换">
          {GROWTH_TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              size="sm"
              className={`chip ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`growth-panel-${tab.id}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      )}

      <div className="detail-layout">
        {isMobile ? (
          activeTab === 'weight' ? (
            <div id="growth-panel-weight" role="tabpanel">{weightCard}</div>
          ) : (
            <div id="growth-panel-care" role="tabpanel">{careCard}</div>
          )
        ) : (
          <>
            {weightCard}
            {careCard}
          </>
        )}
      </div>
    </section>
  );
}
