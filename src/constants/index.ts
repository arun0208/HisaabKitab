export * from './theme';

export const APP_NAME = 'HisaabKitab';

export const SUPABASE_URL = 'YOUR_SUPABASE_URL';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const PAYMENT_TYPES = {
  CASH: 'cash',
  UPI: 'upi',
  CREDIT: 'credit',
} as const;

export const REMINDER_FREQUENCY = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const PRODUCT_CATEGORIES = [
  'Grocery',
  'Dairy',
  'Beverages',
  'Snacks',
  'Personal Care',
  'Household',
  'Spices',
  'Pulses & Grains',
  'Oil & Ghee',
  'Frozen',
  'Stationery',
  'Other',
];

export const LOW_STOCK_THRESHOLD = 10;

export const CURRENCY_SYMBOL = '\u20B9';

export const formatCurrency = (amount: number): string => {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};
