import { RefreshCw } from 'lucide-react';

export default function TopBar({ chapters, active, isMobile, scrolled, onSelect, syncLabel, failed, loading, onRefresh }) {
  return (
    <header className={`topbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="brand">
        <img className="brand-logo" src="/brand/yudan-logo.png" alt="鱼蛋家庭标志" />
        <div className="brand-text">
          <strong>鱼蛋家庭</strong>
          <span>YUDAN HOME</span>
        </div>
      </div>

      {!isMobile && (
        <nav className="chapter-nav" aria-label="章节导航">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              className={`chapter-link ${active === chapter.id ? 'active' : ''}`}
              onClick={() => onSelect(chapter.id)}
              aria-current={active === chapter.id ? 'true' : undefined}
            >
              <span className="chapter-link-num">{chapter.number}</span>
              {chapter.label}
            </button>
          ))}
        </nav>
      )}

      <div className="topbar-actions">
        <div className="sync-state">
          <span className={failed ? 'status-dot error' : 'status-dot'} />
          <span>{syncLabel}</span>
        </div>
        <button className="refresh-button" onClick={onRefresh} disabled={loading} aria-label="刷新数据">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>刷新</span>
        </button>
      </div>
    </header>
  );
}
