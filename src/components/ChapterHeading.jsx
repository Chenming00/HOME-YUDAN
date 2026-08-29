import { Badge } from '@/components/ui/badge';

export default function ChapterHeading({ number, en, title, lead }) {
  return (
    <div className="chapter-head">
      <div className="chapter-heading">
        <Badge variant="secondary" className="eyebrow"><span>{number}</span>{en}</Badge>
        <h2>{title}</h2>
        {lead && <p className="chapter-lead">{lead}</p>}
      </div>
    </div>
  );
}
