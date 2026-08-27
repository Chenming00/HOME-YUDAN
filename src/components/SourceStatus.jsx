export default function SourceStatus({ sources }) {
  if (!sources.length) return null;
  const offline = sources.filter((source) => !source.ok);
  if (!offline.length) {
    return (
      <div className="source-strip source-summary">
        <span className="online"><i />{sources.length} 个数据源正常</span>
      </div>
    );
  }
  return (
    <div className="source-strip">
      {sources.map((source) => (
        <span key={source.name} className={source.ok ? 'online' : source.partial ? 'partial' : 'offline'}>
          <i />
          {source.name}
          <b>{source.ok ? '已连接' : source.partial ? '部分可用' : '待配置'}</b>
        </span>
      ))}
    </div>
  );
}
