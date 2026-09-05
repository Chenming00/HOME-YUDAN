import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.TEST_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
const dateAt = (offset) => new Date(Date.parse(today + 'T00:00:00Z') + offset * 86400000).toISOString().slice(0, 10);
const fixture = {
  meta: { mode: 'live', updatedAt: new Date().toISOString(), sources: ['鱼蛋小账本', '鱼蛋成长看板', '鱼蛋儿保计划', '鱼蛋宝贝消耗品'].map(name => ({ name, ok: true })) },
  growth: { weights: [3.28, 3.24, 3.2, 3.19, 3.17, 3.21, 3.25].map((weight, index) => ({ date: dateAt(-index), weight })) },
  care: { birthday: dateAt(-6), milestones: [{ date: dateAt(24), label: '满月儿保 · 生长发育评估', status: '待完成' }] },
  vaccines: [{ date: dateAt(23), name: '乙肝疫苗 · 第二针', status: '待接种' }],
  ledger: { monthly: Array.from({ length: 6 }, (_, i) => ({ month: i + 4, year: 2026, label: (i + 4) + '月', expense: 1680 + i * 201.6, income: 5000, transactionCount: 12, available: true, categoryBreakdown: [{ name: '宝宝日常', amount: 1600 }, { name: '家庭生活', amount: 1088 }] })), transactions: [{ id: 'tx1', date: today, title: '宝宝用品采购', category: '宝宝日常', amount: 168 }] },
  pantry: { total: 8, low: 2, outOfStock: 1, nearExpiry: 0, expired: 0, items: [], favorites: [], allItems: [{ code: 'diaper', name: '宝宝纸尿裤', stock: 8, minimum: 10, unit: '片', status: '库存偏低', category: '日常护理' }, { code: 'wipes', name: '棉柔巾', stock: 0, minimum: 3, unit: '包', status: '已缺货' }] },
};
await fs.mkdir('.dev-shots', { recursive: true });
const failures = [];
const results = [];
try {
  const context = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', e => failures.push(e.message));
  let payload = fixture;
  let status = 200;
  let delay = 0;
  const methods = [];
  await page.route('**/api/home', async route => {
    methods.push(route.request().method());
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(payload) });
  });
  const checkOverflow = async (label) => {
    const size = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }));
    assert(size.page <= size.viewport + 1, `${label}: page overflow ${JSON.stringify(size)}`);
  };
  const navigate = async (chapter, width) => {
    await page.locator(width < 768 ? '.mobile-nav' : '.chapter-nav').getByRole('button', { name: chapter }).click();
  };
  await page.goto(baseURL);
  await page.locator('.home-chapter').waitFor();
  assert.equal(await page.locator('.weight-value strong').innerText(), '3.28');
  assert.equal(await page.locator('vite-error-overlay').count(), 0);
  for (const width of [320, 375, 390, 430, 600, 768, 820, 1024, 1180, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1024 });
    await navigate(/今天/, width);
    await page.locator('.home-chapter').waitFor();
    await checkOverflow(`home ${width}`);
    assert(await page.locator('.home-primary > .weight-overview').isVisible());
    for (const mode of ['care', 'supplies', 'weight']) {
      await page.getByLabel('切换当前关注').selectOption(mode);
      await checkOverflow(`focus ${mode} ${width}`);
    }
    await page.waitForFunction(() => {
      const chart = document.querySelector('.line-chart');
      if (Math.abs(chart.clientWidth - chart.querySelector('svg').viewBox.baseVal.width) > 1) return false;
      const points = chart.querySelector('polyline').points;
      return [...chart.querySelectorAll('.point')].every((circle, index) => Math.abs(parseFloat(getComputedStyle(circle).cx) - points[index].x) < 1);
    });
    if ([390, 820, 1440].includes(width)) {
      await page.screenshot({ path: `.dev-shots/dashboard-${width}.png`, fullPage: true });
    }
    await page.getByRole('button', { name: /下一针疫苗/ }).click();
    await page.locator('.growth-care').waitFor();
    await checkOverflow(`care ${width}`);
    await page.getByRole('button', { name: '体重记录', exact: true }).click();
    await page.locator('.growth-weight').waitFor();
    await checkOverflow(`weight ${width}`);
    await navigate(/账本/, width);
    await page.locator('#chapter-ledger').waitFor();
    await checkOverflow(`ledger ${width}`);
    await navigate(/库存/, width);
    await page.locator('#chapter-pantry').waitFor();
    await checkOverflow(`pantry ${width}`);
    results.push(`responsive ${width}px: home, all focuses, growth, care, ledger, pantry`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel('搜索用品名称').fill('棉柔巾');
  assert.equal(await page.locator('#pantry-inventory-panel .inventory-row').count(), 1);
  await navigate(/今天/, 390);
  await page.getByLabel('切换当前关注').selectOption('care');
  await page.reload();
  await page.locator('.home-chapter').waitFor();
  assert.equal(await page.getByLabel('切换当前关注').inputValue(), 'care');
  await page.getByLabel('切换当前关注').selectOption('weight');
  const point = page.locator('.chart-hit-area').last();
  await point.focus();
  await point.press('Enter');
  assert.match(await page.locator('.chart-tooltip').innerText(), /3.28 kg/);
  await point.press('Escape');
  assert.equal(await page.locator('.chart-tooltip').count(), 0);
  status = 503;
  await page.getByRole('button', { name: '刷新数据' }).click();
  await page.getByRole('alert').waitFor();
  assert.equal(await page.locator('.weight-value strong').innerText(), '3.28');
  status = 200;
  delay = 800;
  await page.reload();
  await page.getByRole('status', { name: '正在加载看板' }).waitFor();
  await page.locator('.home-chapter').waitFor();
  delay = 0;
  payload = structuredClone(fixture);
  payload.growth.weights = [];
  payload.meta.mode = 'partial';
  payload.meta.sources[1].ok = false;
  await page.getByRole('button', { name: '刷新数据' }).click();
  await page.getByText('体重记录暂未同步', { exact: true }).waitFor();
  assert.equal(await page.locator('.weight-value strong').innerText(), '—');
  await checkOverflow('missing source');
  payload.growth.weights = [{ date: today, weight: 3.25 }];
  await page.getByRole('button', { name: '刷新数据' }).click();
  await page.locator('.chart-hit-area').waitFor();
  assert.equal(await page.locator('.chart-hit-area').count(), 1);
  payload = structuredClone(fixture);
  payload.growth.weights = Array.from({ length: 45 }, (_, index) => ({ date: dateAt(-index), weight: 3.2 + Math.sin(index) / 10 }));
  payload.vaccines[0].name = '很长的疫苗名称和补充说明'.repeat(8);
  payload.pantry.allItems[0].name = '很长的宝宝日常用品名称'.repeat(8);
  payload.ledger.monthly.at(-1).expense = 1234567.89;
  await page.getByRole('button', { name: '刷新数据' }).click();
  await page.waitForFunction(() => document.querySelector('.weight-facts strong')?.textContent.includes('45'));
  await page.getByRole('button', { name: '全部', exact: true }).click();
  assert.equal(await page.locator('.chart-hit-area').count(), 45);
  await checkOverflow('stress data');
  await page.getByRole('button', { name: '全部记录', exact: true }).click();
  await page.locator('.weight-history').waitFor();
  assert.equal(await page.locator('.weight-history .table-row').count(), 20);
  await page.getByRole('button', { name: /查看更多记录/ }).click();
  assert.equal(await page.locator('.weight-history .table-row').count(), 40);
  assert(methods.every(method => method === 'GET'), 'dashboard must remain read-only');
  assert.deepEqual(failures, [], 'browser exceptions');
  results.push('search, persistent focus, chart keyboard, failed refresh retains data, loading, disconnected source, single point, 45 records, pagination, long text, read-only requests');
  console.log(JSON.stringify({ passed: results, browserErrors: failures, fixture: 'Synthetic data intercepted only in the test browser; no server data modified.' }, null, 2));
} finally { await browser.close(); }
