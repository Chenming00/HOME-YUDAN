import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingView({ active }) {
  return <div className="chapter loading-view" role="status" aria-label="正在加载看板">
    <span className="sr-only">正在加载记录…</span>
    <div className="loading-heading"><Skeleton style={{ height: 16, width: 140 }} /><Skeleton style={{ height: 42, width: '65%', maxWidth: 420 }} /><Skeleton style={{ height: 18, width: 180 }} /></div>
    {active === 'today' || active === 'growth' ? <>
      <Skeleton className="loading-focus" />
      <div className="weight-overview loading-overview"><div className="weight-summary"><Skeleton style={{ height: 18, width: '60%' }} /><Skeleton style={{ height: 70, width: '80%', marginBlock: 24 }} /><Skeleton style={{ height: 64 }} /></div><div className="weight-plot"><Skeleton style={{ height: 24, width: '40%' }} /><Skeleton style={{ height: 220, marginTop: 24 }} /></div></div>
      <div className="home-secondary"><Skeleton style={{ height: 190 }} /><Skeleton style={{ height: 190 }} /></div>
    </> : <Card className="section-card"><Skeleton style={{ height: 300 }} /></Card>}
  </div>;
}
