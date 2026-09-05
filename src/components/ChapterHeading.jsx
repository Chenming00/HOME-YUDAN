import { Badge } from '@/components/ui/badge';

export default function ChapterHeading({ number, en, title, lead }) {
  return (
    <div className="chapter-head">
      <div className="chapter-heading">
        <Badge variant="secondary" className="eyebrow"><span>{number}</span>{en}</Badge>
        <h1>{title}</h1>
        {lead && <p className="chapter-lead">{lead}</p>}
      </div>
    </div>
  );
}
