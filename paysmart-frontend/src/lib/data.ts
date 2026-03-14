export type Category = 'Dining' | 'Shopping' | 'Fuel' | 'Travel' | 'Entertainment' | 'Other';

export interface CreditCard {
  id: string;
  bank: string;
  name: string;
  rewards: Record<Category, number>;
  monthlyCap?: number;
}

export interface Transaction {
  id: string;
  merchant: string;
  category: Category;
  amount: number;
  cardId: string;
  cashback: number;
  missedSavings?: number;
  bestCardId?: string;
  date: string;
}

export interface RecommendationResult {
  cardId: string;
  bank: string;
  name: string;
  rewardPercent: number;
  cashback: number;
}

export const BANKS = ['HDFC', 'Axis', 'SBI', 'ICICI', 'Amex', 'Kotak', 'Yes Bank', 'Other'] as const;
export const CATEGORIES: Category[] = ['Dining', 'Shopping', 'Fuel', 'Travel', 'Entertainment', 'Other'];

export const BANK_GRADIENT: Record<string, string> = {
  'Axis': 'card-gradient-axis',
  'HDFC': 'card-gradient-hdfc',
  'SBI': 'card-gradient-sbi',
  'ICICI': 'card-gradient-icici',
  'Amex': 'card-gradient-amex',
  'Kotak': 'card-gradient-kotak',
  'Yes Bank': 'card-gradient-yes',
};

export const BANK_DOT_COLOR: Record<string, string> = {
  'Axis': 'bg-indigo',
  'HDFC': 'bg-destructive',
  'SBI': 'bg-primary',
  'ICICI': 'bg-amber',
  'Amex': 'bg-muted-foreground',
  'Kotak': 'bg-coral',
  'Yes Bank': 'bg-primary',
};

export const DEFAULT_CARDS: CreditCard[] = [
  {
    id: 'axis-ace',
    bank: 'Axis',
    name: 'Axis Ace',
    rewards: { Dining: 5, Shopping: 2, Fuel: 4, Travel: 2, Entertainment: 2, Other: 1 },
  },
  {
    id: 'hdfc-millennia',
    bank: 'HDFC',
    name: 'HDFC Millennia',
    rewards: { Dining: 2, Shopping: 5, Fuel: 1, Travel: 2, Entertainment: 1, Other: 1 },
  },
  {
    id: 'sbi-simplyclick',
    bank: 'SBI',
    name: 'SBI SimplyCLICK',
    rewards: { Dining: 1, Shopping: 10, Fuel: 0.25, Travel: 1, Entertainment: 1, Other: 0.25 },
  },
  {
    id: 'icici-amazon',
    bank: 'ICICI',
    name: 'ICICI Amazon Pay',
    rewards: { Dining: 2, Shopping: 5, Fuel: 1, Travel: 1, Entertainment: 1, Other: 1 },
  },
];

export const QUICK_ADD_CARDS: CreditCard[] = [
  ...DEFAULT_CARDS,
  {
    id: 'amex-mrcc',
    bank: 'Amex',
    name: 'Amex MRCC',
    rewards: { Dining: 3, Shopping: 3, Fuel: 1, Travel: 5, Entertainment: 3, Other: 1 },
  },
  {
    id: 'kotak-811',
    bank: 'Kotak',
    name: 'Kotak 811',
    rewards: { Dining: 2, Shopping: 2, Fuel: 2, Travel: 2, Entertainment: 2, Other: 1 },
  },
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: 't1', merchant: 'Swiggy', category: 'Dining', amount: 800, cardId: 'axis-ace', cashback: 40, date: '2026-03-12' },
  { id: 't2', merchant: 'Flipkart', category: 'Shopping', amount: 3200, cardId: 'sbi-simplyclick', cashback: 320, date: '2026-03-11' },
  { id: 't3', merchant: 'BPCL Fuel', category: 'Fuel', amount: 2000, cardId: 'hdfc-millennia', cashback: 20, missedSavings: 60, bestCardId: 'axis-ace', date: '2026-03-10' },
  { id: 't4', merchant: 'Zomato', category: 'Dining', amount: 600, cardId: 'hdfc-millennia', cashback: 12, missedSavings: 18, bestCardId: 'axis-ace', date: '2026-03-09' },
  { id: 't5', merchant: 'MakeMyTrip', category: 'Travel', amount: 8000, cardId: 'axis-ace', cashback: 160, date: '2026-03-08' },
];

export function recommendCards(cards: CreditCard[], category: Category, amount: number): RecommendationResult[] {
  return cards
    .map(card => ({
      cardId: card.id,
      bank: card.bank,
      name: card.name,
      rewardPercent: card.rewards[category] || 0,
      cashback: Math.round((card.rewards[category] || 0) * amount) / 100,
    }))
    .sort((a, b) => b.cashback - a.cashback);
}

export function getBankGradient(bank: string): string {
  return BANK_GRADIENT[bank] || 'card-gradient-default';
}
