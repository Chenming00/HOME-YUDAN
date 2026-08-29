import { useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, PackageCheck, Search, ShoppingBag } from 'lucide-react';
import ChapterHeading from '../ChapterHeading.jsx';
import Metric from '../shared/Metric.jsx';
import SectionTitle from '../shared/SectionTitle.jsx';
import Empty from '../shared/Empty.jsx';
import StockBar from './StockBar.jsx';
import { chapterLeads } from '../../lib/data.js';
import { classifyItem } from '../../lib/utils.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const PANTRY_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'low', label: '待补货' },
  { id: 'out', label: '已缺货' },
  { id: 'expiry', label: '临期过期' },
  { id: 'ok', label: '正常' },
];

function StatusTag({ status }) {
  const text = status || '需关注';
  let tone = '';
  if (/缺货|耗尽|紧急|过期/.test(text)) tone = 'danger';
  else if (/充足|正常/.test(text)) tone = 'success';
  return <Badge variant={tone === 'danger' ? 'destructive' : 'outline'} className={`tag ${tone}`}>{text}</Badge>;
}

/* 上游状态文案偶尔与数量矛盾（如 stock=0 但 status=正常），展示时以数量为准 */
function displayStatus(item) {
  const cls = classifyItem(item);
  const status = String(item.status || '');
  if (cls === 'out') return '已缺货';
  if (cls === 'low' && /正常|充足/.test(status)) return '库存偏低';
  return item.status;
}

export default function PantrySection({ pantry }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const allItems = pantry.allItems || [];
  const counts = useMemo(() => {
    const result = { all: allItems.length, low: 0, out: 0, expiry: 0, ok: 0 };
    allItems.forEach((item) => { result[classifyItem(item)] += 1; });
    return result;
  }, [allItems]);

  const visibleItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (filter !== 'all' && classifyItem(item) !== filter) return false;
      if (keyword && !String(item.name || '').toLowerCase().includes(keyword)) return false;
      return true;
    });
  }, [allItems, filter, query]);

  const handleFilterKeyDown = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? PANTRY_FILTERS.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + PANTRY_FILTERS.length) % PANTRY_FILTERS.length;
    setFilter(PANTRY_FILTERS[nextIndex].id);
    document.getElementById(`pantry-filter-${PANTRY_FILTERS[nextIndex].id}`)?.focus();
  };

  return (
    <section className="chapter" id="chapter-pantry" data-chapter="pantry">
      <ChapterHeading number="04" en="BABY PANTRY" title="用品库存" lead={chapterLeads.pantry} />

      <section className="metric-grid" aria-label="库存关键数据">
        <Metric icon={PackageCheck} tone="teal" label="启用商品" value={String(pantry.total || 0)} unit="种" detail="用品总数" />
        <Metric icon={AlertCircle} tone="red" label="已缺货" value={String(pantry.outOfStock || 0)} unit="项" detail="需要优先购买" />
        <Metric icon={ShoppingBag} tone="amber" label="待补货" value={String(pantry.low || 0)} unit="项" detail="达到安全线" />
        <Metric icon={CalendarDays} tone="blue" label="临期与过期" value={String((pantry.nearExpiry || 0) + (pantry.expired || 0))} unit="项" detail={`${pantry.nearExpiry || 0} 项临期 · ${pantry.expired || 0} 项过期`} />
      </section>

      {pantry.favorites?.length > 0 && (
        <Card className="section-card">
          <SectionTitle eyebrow="常用余量" title={`常用用品 · ${pantry.favorites.length} 项`} />
          <div className="favorites-grid">
            {pantry.favorites.map((item) => (
              <Card size="sm" className="favorite-card" key={item.code || item.name}>
                <header>
                  <strong>{item.name}</strong>
                  <StatusTag status={displayStatus(item)} />
                </header>
                <div className="favorite-stock">
                  剩 {item.stock ?? '--'} {item.unit}
                </div>
                <StockBar stock={item.stock} minimum={item.minimum} unit={item.unit} />
              </Card>
            ))}
          </div>
        </Card>
      )}

      {pantry.items?.length > 0 && (
        <Card className="section-card">
          <SectionTitle eyebrow="需要准备" title="补货清单" />
          <div className="inventory-table">
            <div className="inventory-head"><span>商品</span><span>库存水位</span><span>建议</span><span>状态</span></div>
            {pantry.items.map((item) => (
              <div className="inventory-row" key={item.code || item.name}>
                <div>
                  <span className="item-icon"><PackageCheck size={16} /></span>
                  <span className="inventory-name">
                    <strong>{item.name}</strong>
                    {item.note && <small>{item.note}</small>}
                  </span>
                </div>
                <StockBar stock={item.stock} minimum={item.minimum} unit={item.unit} />
                <b>{item.suggested > 0 ? `补 ${item.suggested} ${item.unit}` : `剩 ${item.stock ?? '--'} ${item.unit}`}</b>
                <StatusTag status={displayStatus(item)} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="section-card pantry-all">
        <SectionTitle eyebrow="全部用品" title={`完整库存 · ${allItems.length} 项`} />
        <div className="pantry-toolbar">
          <div className="filter-tabs" role="tablist" aria-label="库存筛选">
            {PANTRY_FILTERS.map((option, index) => (
              <Button
                key={option.id}
                id={`pantry-filter-${option.id}`}
                variant={filter === option.id ? 'default' : 'outline'}
                size="sm"
                className={`filter-tab ${filter === option.id ? 'active' : ''}`}
                onClick={() => setFilter(option.id)}
                onKeyDown={(event) => handleFilterKeyDown(event, index)}
                role="tab"
                aria-selected={filter === option.id}
                aria-controls="pantry-inventory-panel"
                tabIndex={filter === option.id ? 0 : -1}
              >
                {option.label}
                <b>{counts[option.id]}</b>
              </Button>
            ))}
          </div>
          <label className="search-box">
            <Search size={14} />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索用品名称"
              aria-label="搜索用品名称"
            />
          </label>
        </div>
        <div id="pantry-inventory-panel" role="tabpanel" aria-labelledby={`pantry-filter-${filter}`} className="inventory-table">
          <div className="inventory-head"><span>商品</span><span>库存水位</span><span>当前库存</span><span>状态</span></div>
          {visibleItems.length ? (
            visibleItems.map((item) => (
              <div className="inventory-row" key={item.code || item.name}>
                <div>
                  <span className="item-icon"><PackageCheck size={16} /></span>
                  <span className="inventory-name">
                    <strong>{item.name}</strong>
                    <small>{item.category || '未分类'}</small>
                  </span>
                </div>
                <StockBar stock={item.stock} minimum={item.minimum} unit={item.unit} />
                <b>{item.stock ?? '--'} {item.unit}</b>
                <StatusTag status={displayStatus(item)} />
              </div>
            ))
          ) : (
            <Empty text={query ? '没有匹配的用品' : '这个分类下暂时没有用品'} small />
          )}
        </div>
        {(filter !== 'all' || query) && (
          <p className="pantry-count-line">显示 {visibleItems.length} / {allItems.length} 项</p>
        )}
      </Card>
    </section>
  );
}
