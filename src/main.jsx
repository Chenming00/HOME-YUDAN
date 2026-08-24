import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, AlertTriangle, Baby, CalendarDays, CircleDollarSign, HeartPulse, LayoutDashboard, PackageCheck, RefreshCw, Settings2, ShieldCheck, TrendingUp, WalletCards } from 'lucide-react';
import './styles.css';
import './readonly.css';

const fallback = {
  meta: { mode: 'demo', updatedAt: new Date().toISOString(), sources: [] },
  ledger: {
    monthly: [{month:'3月',income:1200,expense:980},{month:'4月',income:1500,expense:1120},{month:'5月',income:800,expense:1040},{month:'6月',income:1300,expense:1190},{month:'7月',income:1600,expense:1240},{month:'8月',income:1300,expense:860}],
    transactions: [{date:'08/23',title:'奶粉与纸尿裤',category:'宝宝用品',amount:268.5},{date:'08/22',title:'家庭日常采购',category:'日用',amount:156},{date:'08/20',title:'儿保挂号',category:'医疗健康',amount:42},{date:'08/18',title:'周末出行',category:'交通',amount:88}],
  },
  growth: { weights: [{date:'08/12',weight:7.8},{date:'07/29',weight:7.5},{date:'07/15',weight:7.2}] },
  vaccines: [{name:'五联疫苗 · 第 3 剂',date:'09/06',status:'即将到期'},{name:'肺炎球菌 · 第 3 剂',date:'09/20',status:'计划中'}],
  pantry: { total:18, low:3, nearExpiry:2, items:[{name:'好奇纸尿裤 NB',stock:2,unit:'包',status:'库存偏低'},{name:'婴儿湿巾',stock:8,unit:'包',status:'正常'},{name:'维达抽纸',stock:1,unit:'提',status:'库存偏低'},{name:'婴儿洗衣液',stock:1,unit:'瓶',status:'30 天内临期'}] },
};

function App() {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState('总览');\n  const goTo = (label, target) => { setActive(label); document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/home', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('sync failed');
      setData(await response.json());
    } catch { setData((current) => ({...current, meta:{...current.meta, mode:'demo', error:true}})); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const isDemo = data.meta?.mode === 'demo';\n  const months = data.ledger?.monthly?.length ? data.ledger.monthly : (isDemo ? fallback.ledger.monthly : []);
  const transactions = data.ledger?.transactions?.length ? data.ledger.transactions : (isDemo ? fallback.ledger.transactions : []);
  const weights = data.growth?.weights?.length ? data.growth.weights : (isDemo ? fallback.growth.weights : []);
  const vaccines = data.vaccines?.length ? data.vaccines : (isDemo ? fallback.vaccines : []);
  const pantry = data.pantry?.items?.length ? data.pantry : (isDemo ? fallback.pantry : {total:0,low:0,nearExpiry:0,items:[]});
  const latestWeight = Number(weights[0]?.weight || weights.at(-1)?.weight || 0);
  const currentMonth = months.at(-1) || {};
  const online = data.meta?.sources?.filter((source) => source.ok).length || 0;
  const updatedAt = useMemo(() => new Date(data.meta?.updatedAt || Date.now()).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}), [data.meta?.updatedAt]);

  return <div className="app"><aside>
    <div className="brand"><div className="brandmark">鱼</div><div><b>鱼蛋之家</b><span>家庭只读总看板</span></div></div>
    <nav>{[['总览',LayoutDashboard,'overview'],['家庭账本',WalletCards,'ledger'],['成长健康',HeartPulse,'growth'],['用品库存',PackageCheck,'pantry']].map(([label,Icon,target]) => <button key={label} className={active===label?'active':''} onClick={()=>goTo(label,target)}><Icon size={18}/><span>{label}</span>{active===label&&<i/>}</button>)}</nav>
    <div className="side-bottom"><button><Settings2 size={17}/>数据源状态</button><div className="profile"><div className="avatar">Y</div><div><b>Yudan family</b><span>只读 · 不修改源数据</span></div></div></div>
  </aside><main>
    <header><div><p className="eyebrow">家庭生活数据中心</p><h1>早上好，鱼蛋一家 <span>✦</span></h1><p className="muted">账本、成长、疫苗与宝宝用品，一眼看清。</p></div><div className="actions"><div className="sync"><span className={online?'dot':'dot pending'}/>{online||'演示'} 个数据源在线 · {updatedAt}</div><button className="refresh" onClick={refresh} disabled={loading}><RefreshCw size={16} className={loading?'spin':''}/>刷新数据</button></div></header>
    <div className="content">
      {data.meta?.mode!=='live'&&<div className="demo-banner"><AlertTriangle size={15}/>当前显示演示或部分真实数据；配置服务端 API Key 后可读取全部家庭数据。</div>}\n      <div className="source-strip">{(data.meta?.sources||[]).map((source)=><span key={source.name} className={source.ok?'online':'offline'}><i/>{source.name}<b>{source.ok?'已连接':'待配置'}</b></span>)}</div>
      <section className="hero" id="overview"><div><div className="hero-label"><Baby size={16}/> 鱼蛋成长档案</div><div className="hero-title">今天也在认真长大<br/><strong>每一天都值得记录</strong></div><p>数据来自鱼蛋看板，页面仅用于查看。</p></div><div className="milestone"><div className="rings"><ShieldCheck size={22}/><small>只读</small></div><div><span>数据保护</span><b>不提供新增、编辑或删除操作</b></div></div></section>
      <section className="grid stats"><Card icon={<CircleDollarSign/>} color="orange" label="本月支出" value={`¥ ${Number(currentMonth.expense||0).toLocaleString()}`} meta="来自鱼蛋小账本"/><Card icon={<TrendingUp/>} color="green" label="最近体重" value={`${latestWeight||'--'} kg`} meta="来自成长记录"/><Card icon={<CalendarDays/>} color="blue" label="疫苗提醒" value={`${vaccines.length} 项`} meta="近期计划"/><Card icon={<PackageCheck/>} color="purple" label="用品需关注" value={`${Number(pantry.low||0)+Number(pantry.nearExpiry||0)} 项`} meta="低库存与临期"/></section>
      <div className="section-head"><div><h2>家庭概览</h2><p>最近的生活动态与重要提醒</p></div><span className="readonly"><ShieldCheck size={14}/>全站只读</span></div>
      <section className="grid lower">
        <div className="panel chart-panel" id="ledger"><div className="panel-head"><div><h3>家庭支出趋势</h3><span>近 6 个月 · 单位：元</span></div><div className="legend"><i className="orange"/>支出 <i className="gray"/>收入</div></div><Chart months={months}/></div>
        <div className="panel growth-panel" id="growth"><div className="panel-head"><div><h3>成长记录</h3><span>最近 {weights.length} 次测量</span></div><Activity className="shield"/></div><div className="weight"><div className="weight-main"><span>当前体重</span><b>{latestWeight||'--'} <em>kg</em></b><small><TrendingUp size={14}/> 连续观察 <label>以儿保评估为准</label></small></div><div className="mini-bars">{weights.slice(0,4).reverse().map((item,index)=><div key={`${item.date}-${index}`} style={{height:`${Math.max(20,Number(item.weight||0)/Math.max(latestWeight,1)*80)}px`}}><span>{item.weight}</span></div>)}</div></div></div>
        <div className="panel activity-panel" id="latest-ledger"><div className="panel-head"><div><h3>最近账本</h3><span>来自鱼蛋小账本</span></div><WalletCards className="shield"/></div>{transactions.slice(0,4).map((item,index)=><div className="transaction" key={`${item.date}-${index}`}><div className="trans-icon">◆</div><div><b>{item.title||'家庭支出'}</b><span>{item.date||'--'} · {item.category||'未分类'}</span></div><strong>¥ {Math.abs(Number(item.amount||0)).toFixed(2)}</strong></div>)}</div>
        <div className="panel vaccine-panel" id="vaccines"><div className="panel-head"><div><h3>疫苗提醒</h3><span>按计划接种，安心每一步</span></div><ShieldCheck className="shield"/></div>{vaccines.slice(0,3).map((item,index)=><div className="vaccine" key={`${item.name}-${index}`}><div className="vaccine-check">✓</div><div><b>{item.name||'疫苗计划'}</b><span>建议日期 {item.date||'--'}</span></div><label>{item.status||'计划中'}</label></div>)}</div>
        <div className="panel pantry-panel" id="pantry"><div className="panel-head"><div><h3>宝宝用品库存</h3><span>来自鱼蛋宝贝消耗品管家</span></div><span className="readonly"><ShieldCheck size={13}/>只读</span></div><div className="pantry-stats"><div><b>{pantry.total??pantry.items.length}</b><span>启用商品</span></div><div className="warn"><b>{pantry.low||0}</b><span>库存偏低</span></div><div className="danger"><b>{pantry.nearExpiry||0}</b><span>近期临期</span></div></div>{pantry.items.slice(0,6).map((item,index)=><div className="pantry-item" key={`${item.name}-${index}`}><div className="product-dot">◆</div><div><b>{item.name}</b><span>{item.status||'库存正常'}</span></div><strong>{item.stock??'--'} <em>{item.unit||''}</em></strong></div>)}<div className="source-note">仅展示库存信息，不支持入库、出库或调整库存</div></div>
      </section>
      <footer><span>数据来源：鱼蛋看板 · 鱼蛋小账本 · 鱼蛋宝贝消耗品管家</span><span><ShieldCheck size={14}/>只读访问，不修改源数据</span></footer>\n      <div className="mobile-nav">{[['总览',LayoutDashboard,'overview'],['账本',WalletCards,'ledger'],['成长',HeartPulse,'growth'],['库存',PackageCheck,'pantry']].map(([label,Icon,target])=><button key={label} onClick={()=>goTo(label,target)}><Icon size={19}/><span>{label}</span></button>)}</div>
    </div>
  </main></div>;
}

function Card({icon,color,label,value,meta}) { return <div className="card"><div className={`card-icon ${color}`}>{icon}</div><span>{label}</span><b>{value}</b><small>{meta}</small></div>; }
function Chart({months}) { const visible=months.slice(-6); const max=Math.max(...visible.map(x=>Math.max(Number(x.expense||0),Number(x.income||0))),1); return <div className="chart"><div className="axis"><span>¥ {Math.round(max)}</span><span>¥ {Math.round(max*.5)}</span><span>¥ 0</span></div><div className="bars">{visible.map((item,index)=><div className="bar-group" key={`${item.month}-${index}`}><div className="bar orange" style={{height:`${Number(item.expense||0)/max*145}px`}}/><div className="bar gray" style={{height:`${Number(item.income||0)/max*145}px`}}/><span>{item.month||item.label}</span></div>)}</div></div>; }
createRoot(document.getElementById('root')).render(<App/>);
