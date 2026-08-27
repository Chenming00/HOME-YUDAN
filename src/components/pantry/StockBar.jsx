export default function StockBar({ stock, minimum, unit }) {
  if (stock === null || stock === undefined) {
    return (
      <div className="stock-cell">
        <div className="stock-bar"><div className="stock-fill" style={{ width: '0%' }} /></div>
        <small>库存未知{minimum > 0 ? ` · 安全线 ${minimum} ${unit}` : ''}</small>
      </div>
    );
  }
  const fillClass = stock <= 0 ? 'out' : minimum > 0 && stock <= minimum ? 'low' : '';
  const percent = minimum > 0
    ? Math.min(100, stock / (minimum * 2) * 100)
    : stock > 0 ? 100 : 0;

  return (
    <div className="stock-cell">
      <div className="stock-bar">
        <div className={`stock-fill ${fillClass}`} style={{ width: `${Math.max(stock > 0 ? 4 : 0, percent)}%` }} />
      </div>
      <small>安全线 {minimum > 0 ? `${minimum} ${unit}` : '--'}</small>
    </div>
  );
}
