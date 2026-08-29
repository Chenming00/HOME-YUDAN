import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function daysBetween(a, b) {
  const ms = new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime();
  return Math.floor(ms / 86400000);
}

export function shanghaiDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2 }).format(Number(value || 0));
}

export function compactCurrency(value) {
  return '¥' + new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}

export function formatWeight(value) {
  return Number(value).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

export function formatDate(value, compact = false) {
  if (!value) return '--';
  const date = new Date(String(value).slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('zh-CN', compact ? { month: 'short', day: 'numeric' } : { month: 'long', day: 'numeric' });
}

export function shortDate(value) {
  return String(value || '').slice(5).replace('-', '/');
}

export function isCompletedStatus(status) {
  return /(已完成|已接种|completed|done)/i.test(String(status || ''));
}

export function classifyItem(item) {
  const status = String(item?.status || '');
  if (/未知/.test(status)) return 'ok';
  const stock = Number(item?.stock ?? 0);
  if (/缺货|耗尽|out/i.test(status) || stock <= 0) return 'out';
  if (/过期|临期/.test(status)) return 'expiry';
  const minimum = Number(item?.minimum ?? 0);
  if (/偏低|待补|低库存/.test(status) || (minimum > 0 && stock <= minimum)) return 'low';
  return 'ok';
}

export function normalizeBreakdown(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      name: row?.categoryName || row?.category || row?.name || row?.label || '未分类',
      amount: Number(row?.amount ?? row?.expense ?? row?.total ?? row?.totalExpense ?? row?.total_amount ?? 0),
    }))
    .filter((row) => Number.isFinite(row.amount) && row.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}
