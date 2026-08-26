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

async function readMonthlySeries() {
  const today = new Date();
  const targets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (5 - index), 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
  });
  const results = await Promise.all(targets.map(({ year, month }) => read(LOG_BASE, `/api/monthly?year=${year}&month=${month}`)));
  return {
    ok: results.some((result) => result.ok),
    data: results.map((result, index) => ({
      month: `${targets[index].month}月`,
      income: 0,
      expense: Number(result.data?.totalExpense || 0),
      transactionCount: Number(result.data?.transactionCount || 0),
      categoryBreakdown: arrayOf(result.data?.categoryBreakdown),
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
  const all = arrayOf(products, ['products', 'items']);
  const alerts = arrayOf(attention, ['batches', 'items']);
  const source = arrayOf(value, ['replenishList', 'favorites', 'searchItems', 'attention', 'restock', 'items', 'products']);
  const items = source.map((item) => {
    const stock = Number(item.stock ?? item.current_stock ?? item.quantity ?? item.total_quantity ?? 0);
    const minimum = Number(item.min_stock ?? item.minimum_stock ?? item.safety_stock ?? 0);
    return {
      name: item.name || item.product_name || item.product?.name,
      stock,
      minimum,
      suggested: Number(item.suggest ?? item.suggested_quantity ?? Math.max(0, minimum - stock)),
      unit: item.unit || item.product?.unit || '',
      status: stock <= 0 ? '已缺货' : stock <= minimum ? '库存偏低' : (item.status_text || item.alert || item.status || '正常'),
    };
  }).filter((item) => item.name);
  const stats = value || {};
  return {
    total: Number(stats.productCount ?? stats.total_products ?? stats.active_products ?? all.length ?? items.length),
    low: Number(stats.lowStockCount ?? stats.low_stock ?? stats.low_stock_count ?? 0),
    outOfStock: Number(stats.outOfStockCount ?? stats.out_of_stock ?? stats.out_of_stock_count ?? 0),
    nearExpiry: Number(stats.nearExpiryCount ?? stats.near_expiry ?? stats.near_expiry_count ?? alerts.length ?? 0),
    items,
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
  const sources = [
    { name: '鱼蛋小账本', ok: monthly.ok || list.ok },
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
