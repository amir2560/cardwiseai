import { CreditCard, Transaction, DEFAULT_CARDS, DEFAULT_TRANSACTIONS } from './data';

const CARDS_KEY = 'cardwise-cards';
const TXN_KEY = 'cardwise-txns';

export function loadCards(): CreditCard[] {
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const cards = [...DEFAULT_CARDS];
  saveCards(cards);
  return cards;
}

export function saveCards(cards: CreditCard[]) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TXN_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const txns = [...DEFAULT_TRANSACTIONS];
  saveTransactions(txns);
  return txns;
}

export function saveTransactions(txns: Transaction[]) {
  localStorage.setItem(TXN_KEY, JSON.stringify(txns));
}
