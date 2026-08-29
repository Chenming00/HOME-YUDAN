// 库存条占满时对应的库存倍数（安全线 x2 = 100%），业务规则：
// 库存达到安全线 2 倍即视为"充足"，条满；低于 100% 时条越短越接近安全线。
const FULL_STOCK_MULTIPLIER = 2;
// 有库存时条的最小可见宽度（%），避免极低库存时条几乎不可见。
const MIN_VISIBLE_WIDTH = 4;

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
    ? Math.min(100, (stock / (minimum * FULL_STOCK_MULTIPLIER)) * 100)
    : stock > 0 ? 100 : 0;

  return (
    <div className="stock-cell">
      <div className="stock-bar">
        <div className={`stock-fill ${fillClass}`} style={{ width: `${Math.max(stock > 0 ? MIN_VISIBLE_WIDTH : 0, percent)}%` }} />
      </div>
      <small>安全线 {minimum > 0 ? `${minimum} ${unit}` : '--'}</small>
    </div>
  );
}