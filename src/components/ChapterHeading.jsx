export default function ChapterHeading({ number, en, title, lead }) {
  return (
    <div className="chapter-head">
      <span className="chapter-number" aria-hidden="true">{number}</span>
      <div className="chapter-heading">
        <span className="eyebrow">{en}</span>
        <h2>{title}</h2>
        {lead && <p className="chapter-lead">{lead}</p>}
      </div>
    </div>
  );
}
