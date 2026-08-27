import { HeartPulse, PackageCheck, Sparkles, WalletCards } from 'lucide-react';

export const BABY_BIRTHDAY_FALLBACK = '2026-08-30';

export const emptyData = {
  meta: { mode: 'loading', updatedAt: null, sources: [] },
  ledger: { monthly: [], transactions: [] },
  growth: { weights: [] },
  vaccines: [],
  care: { provider: '', birthday: '', milestones: [] },
  pantry: { total: 0, low: 0, outOfStock: 0, nearExpiry: 0, expired: 0, items: [], favorites: [], allItems: [] },
};

export const chapters = [
  { id: 'today', number: '01', en: 'TODAY', label: '今天', short: '今天', icon: Sparkles },
  { id: 'growth', number: '02', en: 'GROWTH & CARE', label: '成长健康', short: '成长', icon: HeartPulse },
  { id: 'ledger', number: '03', en: 'FAMILY LEDGER', label: '家庭账本', short: '账本', icon: WalletCards },
  { id: 'pantry', number: '04', en: 'BABY PANTRY', label: '用品库存', short: '库存', icon: PackageCheck },
];

export const chapterLeads = {
  today: '先看今天需要知道的事，再看其余。',
  growth: '体重的每一克、每一针疫苗，都值得被认真记录。',
  ledger: '这个月为这个小家花了多少，一眼看清。',
  pantry: '日用品还剩多少、该补什么，不再靠猜。',
};
