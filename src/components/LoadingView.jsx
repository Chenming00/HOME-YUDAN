import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MetricSkeleton() {
  return (
    <Card className="metric-card metric-skeleton">
      <Skeleton className="skeleton-icon" />
      <Skeleton className="skeleton-label" />
      <Skeleton className="skeleton-value" />
    </Card>
  );
}

export function SectionSkeleton({ tall }) {
  return (
    <Card className="section-card" style={{ minHeight: tall ? 300 : 160 }}>
      <Skeleton style={{ height: 20, width: '40%', marginBottom: 20 }} />
      <Skeleton style={{ height: tall ? 200 : 60, width: '100%' }} />
    </Card>
  );
}

export default function LoadingView({ active, compact }) {
  return (
    <div className="page-transition">
      <div className="loading-heading">
        <Skeleton style={{ height: 22, width: 100 }} />
        <Skeleton style={{ height: 38, width: 220 }} />
      </div>
      {active !== 'growth' && (
        <div className={`metric-grid ${active === 'ledger' ? 'compact three' : ''}`}>
          {Array.from({ length: active === 'ledger' ? 3 : 4 }, (_, index) => <MetricSkeleton key={index} />)}
        </div>
      )}
      <SectionSkeleton tall={!compact} />
    </div>
  );
}
