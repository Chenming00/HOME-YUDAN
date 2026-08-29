import { RefreshCw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TopBar({ chapters, active, onSelect, onPrefetch, syncLabel, failed, loading, onRefresh }) {
  return (
    <>
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src="/icons/pwa-192.png" width="40" height="40" alt="" fetchPriority="high" />
          <div className="brand-text">
            <strong>鱼蛋家庭</strong>
            <span>YUDAN HOME</span>
          </div>
        </div>
        <nav className="chapter-nav" aria-label="主要导航">
          <span className="nav-label">生活中心</span>
          {chapters.map((chapter) => (
            <Button
              key={chapter.id}
              variant="ghost"
              className={`chapter-link ${active === chapter.id ? 'active' : ''}`}
              onClick={() => onSelect(chapter.id)}
              onPointerEnter={() => onPrefetch(chapter.id)}
              onFocus={() => onPrefetch(chapter.id)}
              aria-current={active === chapter.id ? 'page' : undefined}
            >
              <chapter.icon />
              <span>{chapter.label}</span>
              <span className="chapter-link-num">{chapter.number}</span>
            </Button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sparkles size={15} />
          <span>把家里的重要小事，放在一个地方。</span>
        </div>
      </aside>

      <header className="topbar">
        <div>
          <span className="topbar-kicker">鱼蛋家庭 · 生活数据中心</span>
          <strong>{chapters.find((chapter) => chapter.id === active)?.label}</strong>
        </div>
        <div className="topbar-actions">
          <Badge variant="outline" className={failed ? 'sync-badge error' : 'sync-badge'}>
            <span className="status-dot" />{syncLabel}
          </Badge>
          <Button variant="outline" size="icon-lg" onClick={onRefresh} disabled={loading} aria-label="刷新数据">
            <RefreshCw className={loading ? 'spin' : ''} />
          </Button>
        </div>
      </header>
    </>
  );
}
