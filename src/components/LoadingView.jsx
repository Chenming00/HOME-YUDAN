export function MetricSkeleton() {
  return (
    <div className="metric-card metric-skeleton">
      <div className="skeleton skeleton-icon" />
      <div className="skeleton skeleton-label" />
      <div className="skeleton skeleton-value" />
    </div>
  );
}

export function SectionSkeleton({ tall }) {
  return (
    <div className="section-card" style={{ minHeight: tall ? 300 : 160 }}>
      <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 20 }} />
      <div className="skeleton" style={{ height: tall ? 200 : 60, width: '100%' }} />
    </div>
  );
}

export default function LoadingView({ isMobile, active }) {
  if (isMobile) {
    return (
      <div className="page-transition">
        {active === 'today' && (
          <>
            <div className="skeleton" style={{ height: 150, marginBottom: 26 }} />
            <div className="metric-grid">
              {[1, 2, 3, 4].map((i) => <MetricSkeleton key={i} />)}
            </div>
            <SectionSkeleton tall />
          </>
        )}
        {active === 'growth' && (
          <>
            <SectionSkeleton tall />
            <div style={{ height: 26 }} />
            <SectionSkeleton tall />
          </>
        )}
        {active === 'ledger' && (
          <>
            <div className="metric-grid compact three">
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </div>
            <SectionSkeleton tall />
          </>
        )}
        {active === 'pantry' && (
          <>
            <div className="metric-grid">
              {[1, 2, 3, 4].map((i) => <MetricSkeleton key={i} />)}
            </div>
            <SectionSkeleton tall />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="skeleton" style={{ height: 170, marginBottom: 44 }} />
      <div className="metric-grid">
        {[1, 2, 3, 4].map((i) => <MetricSkeleton key={i} />)}
      </div>
      <div style={{ height: 40 }} />
      <SectionSkeleton tall />
      <div style={{ height: 30 }} />
      <SectionSkeleton tall />
      <div style={{ height: 30 }} />
      <SectionSkeleton />
    </div>
  );
}
