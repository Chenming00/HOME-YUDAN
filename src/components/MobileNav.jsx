export default function MobileNav({ chapters, active, onSelect }) {
  return (
    <nav className="mobile-nav" aria-label="页面导航">
      {chapters.map((chapter) => {
        const Icon = chapter.icon;
        const isActive = active === chapter.id;
        return (
          <button
            key={chapter.id}
            className={isActive ? 'active' : ''}
            onClick={() => onSelect(chapter.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{chapter.short}</span>
          </button>
        );
      })}
    </nav>
  );
}
