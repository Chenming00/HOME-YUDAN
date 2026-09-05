export default function SourceStatus({ sources }) {
  if (!sources.length) return null;
  const online = sources.filter((source) => source.ok).length;
  return <details className="source-health">
    <summary><span className={online === sources.length ? 'health-dot online' : 'health-dot'} />数据连接 · {online}/{sources.length}<span>查看详情</span></summary>
    <div className="source-strip">{sources.map((source) => <span key={source.name} className={source.ok ? 'online' : ''}><i />{source.name}<b>{source.ok ? '已连接' : source.partial ? '部分可用' : source.requiresKey ? '待配置' : '暂未连接'}</b></span>)}</div>
  </details>;
}
