import { Button } from '@/components/ui/button';

export default function MobileNav({ chapters, active, onSelect, onPrefetch }) {
  return (
    <nav className="mobile-nav" aria-label="页面导航">
      {chapters.map((chapter) => {
        const Icon = chapter.icon;
        const isActive = active === chapter.id;
        return (
          <Button
            key={chapter.id}
            variant="ghost"
            className={isActive ? 'active' : ''}
            onClick={() => onSelect(chapter.id)}
            onPointerEnter={() => onPrefetch(chapter.id)}
            onFocus={() => onPrefetch(chapter.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{chapter.short}</span>
          </Button>
        );
      })}
    </nav>
  );
}
