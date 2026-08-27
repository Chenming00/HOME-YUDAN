export default function SectionTitle({ eyebrow, title, action, onClick }) {
  return (
    <div className="section-title">
      <div>
        <span>{eyebrow}</span>
        <h3>{title}</h3>
      </div>
      {action && <button onClick={onClick}>{action}</button>}
    </div>
  );
}
