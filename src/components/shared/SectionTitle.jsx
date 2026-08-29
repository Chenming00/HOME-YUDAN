import { Button } from '@/components/ui/button';

export default function SectionTitle({ eyebrow, title, action, onClick }) {
  return (
    <div className="section-title">
      <div>
        <span>{eyebrow}</span>
        <h3>{title}</h3>
      </div>
      {action && <Button variant="ghost" size="sm" onClick={onClick}>{action}</Button>}
    </div>
  );
}
