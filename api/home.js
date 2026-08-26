const LOG_BASE = process.env.YUDAN_LOG_BASE_URL || 'https://cost.ykn.cm';
const PANTRY_BASE = process.env.YUDAN_PANTRY_BASE_URL || 'https://wupin.ykn.cm';

async function read(base, path, key) {
  try {
    const response = await fetch(`${base}${path}`, {
      headers: { Accept: 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { ok: false, data: null };
    const json = await response.json();
    return { ok: true, data: json?.data ?? json };
  } catch {
    return { ok: false, data: null };
  }
}

function arrayOf(value, keys = []) {
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return [];
}

function shanghaiYearMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { year: Number(value.year), month: Number(value.month) };
}

async function readMonthlySeries() {
  const current = shanghaiYearMonth();
  const targets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(current.year, current.month - 1 - (5 - index), 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
  });
  const results = await Promise.all(targets.map(({ year, month }) => read(LOG_BASE, `/api/monthly?year=${year}&month=${month}`)));
  const successCount = results.filter((result) => result.ok).length;
  return {
    ok: successCount === results.length,
    partial: successCount > 0 && successCount < results.length,
    data: results.map((result, index) => ({
      month: `${targets[index].month}月`,
      income: 0,
      expense: result.ok ? Number(result.data?.totalExpense || 0) : null,
      transactionCount: result.ok ? Number(result.data?.transactionCount || 0) : null,
      categoryBreakdown: result.ok ? arrayOf(result.data?.categoryBreakdown) : [],
      available: result.ok,
    })),
  };
}

const transactionsOf = (value) => arrayOf(value, ['items', 'transactions', 'records']).map((item) => ({
  date: item.date || item.transaction_date || item.transaction_time || item.created_at,
  title: item.title || item.description || item.note || '家庭支出',
  category: item.category || item.category_name || '未分类',
  amount: Number(item.amount || 0),
}));

const weightsOf = (value) => arrayOf(value?.weight_records || value?.weights || value, ['weight_records', 'weights', 'records']).map((item) => ({
  date: item.date || item.measured_date,
  weight: Number(item.weight || item.weight_kg || 0),
})).filter((item) => item.weight).sort((a, b) => String(b.date).localeCompare(String(a.date)));

const vaccinesOf = (value) => arrayOf(value, ['vaccines', 'vaccine_records', 'schedule', 'items']).map((item) => {
  const actualDate = item.actual_date || item.actualDate || item.done_date || item.doneDate || '';
  return {
    planId: item.plan_id || item.planId || '',
    name: [item.vaccine_name || item.vaccine || item.name, item.dose || ''].filter(Boolean).join(' · '),
    date: item.suggested_date || item.suggestedDate || item.date,
    actualDate,
    ageLabel: item.age_label || item.ageLabel || '',
    status: actualDate ? '已完成' : item.status || '计划中',
  };
}).filter((item) => item.date);

function careOf(value) {
  const milestones = arrayOf(value?.milestones || value, ['milestones', 'items']).map((item) => ({
    id: item.id || item.label || item.date,
    label: item.label || item.name || '儿童保健',
    date: item.date,
    weekday: item.weekday || '',
  })).filter((item) => item.date).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return {
    provider: value?.provider || '',
    birthday: value?.birthday || '',
    milestones,
  };
}
function pantryOf(value, products, attention) {
  const productsList = arrayOf(products, ['products', 'items']);
  const alerts = arrayOf(attention, ['batches', 'items']);
  const replenishment = arrayOf(value?.replenishList);
  const favorites = arrayOf(value?.favorites);
  const inventory = arrayOf(value?.searchItems);
  const toItem = (item) => {
    const rawStock = item.stock ?? item.current_stock ?? item.quantity ?? item.total_quantity;
    const stock = rawStock === undefined || rawStock === null ? null : Number(rawStock);
    const minimum = Number(item.min_stock ?? item.minimum_stock ?? item.safety_stock ?? 0);
    const fallbackStatus = stock === null
      ? '库存未知'
      : minimum > 0 && stock <= 0
        ? '已缺货'
        : minimum > 0 && stock <= minimum
          ? '库存偏低'
          : '正常';
    return {
      code: item.product_code || item.code || item.product?.product_code || '',
      name: item.name || item.product_name || item.product?.name,
      category: item.category || item.product?.category || '未分类',
      note: item.note || '',
      stock,
      minimum,
      suggested: Number(item.suggest ?? item.suggested_quantity ?? (stock === null ? 0 : Math.max(0, minimum - stock))),
      unit: item.unit || item.product?.unit || '',
      status: item.status_text || item.alert || item.status || fallbackStatus,
    };
  };
  const unique = (items) => [...new Map(items.filter((item) => item.name).map((item) => [item.code || item.name, item])).values()];
  const items = unique(replenishment.map(toItem));
  const favoriteItems = unique(favorites.map(toItem));
  const allItems = unique((inventory.length ? inventory : productsList).map(toItem));
  const stats = value || {};
  return {
    total: Number(stats.productCount ?? stats.total_products ?? stats.active_products ?? (productsList.length || allItems.length)),
    low: Number(stats.lowStockCount ?? stats.low_stock ?? stats.low_stock_count ?? 0),
    outOfStock: Number(stats.outOfStockCount ?? stats.out_of_stock ?? stats.out_of_stock_count ?? 0),
    nearExpiry: Number(stats.nearExpiryCount ?? stats.near_expiry ?? stats.near_expiry_count ?? alerts.length ?? 0),
    expired: Number(stats.expiredCount ?? stats.expired_count ?? 0),
    items,
    favorites: favoriteItems,
    allItems,
  };
}

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ message: 'Method Not Allowed' });
  const logKey = process.env.YUDAN_LOG_API_KEY;
  const pantryKey = process.env.YUDAN_PANTRY_API_KEY;
  const [monthly, list, growth, vaccines, care, dashboard, products, attention] = await Promise.all([
    readMonthlySeries(),
    read(LOG_BASE, '/api/list?limit=8'),
    read(LOG_BASE, '/api/yudan', logKey),
    read(LOG_BASE, '/api/yudan/vaccines', logKey),
    read(LOG_BASE, '/api/yudan/care', logKey),
    read(PANTRY_BASE, '/api/dashboard'),
    read(PANTRY_BASE, '/api/products?active=1'),
    read(PANTRY_BASE, '/api/batches?filter=attention', pantryKey),
  ]);
  const ledgerOk = monthly.ok && list.ok;
  const sources = [
    { name: '鱼蛋小账本', ok: ledgerOk, partial: !ledgerOk && (monthly.partial || monthly.ok || list.ok) },
    { name: '鱼蛋成长看板', ok: growth.ok, requiresKey: !logKey },
    { name: '鱼蛋儿保计划', ok: care.ok, requiresKey: !logKey },
    { name: '鱼蛋宝贝消耗品', ok: dashboard.ok || products.ok, requiresKey: !pantryKey && !dashboard.ok },
  ];
  response.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
  return response.status(200).json({
    meta: { mode: sources.every((source) => source.ok) ? 'live' : 'partial', updatedAt: new Date().toISOString(), sources },
    ledger: { monthly: monthly.data, transactions: transactionsOf(list.data) },
    growth: { weights: weightsOf(growth.data) },
    vaccines: vaccinesOf(vaccines.data),
    care: careOf(care.data),
    pantry: pantryOf(dashboard.data, products.data, attention.data),
  });
}
