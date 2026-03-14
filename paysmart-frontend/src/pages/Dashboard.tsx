import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, CreditCard, TrendingDown, Trophy, ArrowRight, Loader2 } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { loadTransactions } from '@/lib/store';
import { Category, CATEGORIES } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getUserCards, getRecommendation } from '@/services/api';
import { mapApiCard } from '@/pages/MyCards';

const USER_ID = 'user-123';

export default function Dashboard() {
  const [txns] = useState(loadTransactions);

  // Quick recommend state
  const [qCategory, setQCategory] = useState<Category>('Dining');
  const [qAmount, setQAmount] = useState('');
  
  // Queries
  const { data: apiCards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['cards', USER_ID],
    queryFn: () => getUserCards(USER_ID),
  });

  const cards = apiCards.map(mapApiCard);

  const { data: recResults, isLoading: recLoading, refetch: fetchRecommendation } = useQuery({
    queryKey: ['quick-recommend', USER_ID, qCategory, qAmount],
    queryFn: () => getRecommendation(USER_ID, qCategory, Number(qAmount)),
    enabled: false, // Only run manually
  });

  const stats = useMemo(() => {
    const totalCashback = txns.reduce((s, t) => s + t.cashback, 0);
    const missedSavings = txns.reduce((s, t) => s + (t.missedSavings || 0), 0);
    const cardCashback: Record<string, number> = {};
    txns.forEach(t => { cardCashback[t.cardId] = (cardCashback[t.cardId] || 0) + t.cashback; });
    
    // Find best card ID, but map it to actual card if available
    const bestCardId = Object.entries(cardCashback).sort(([,a],[,b]) => b - a)[0]?.[0];
    const bestCard = cards.find(c => c.id === bestCardId) || cards.find(c => c.name === bestCardId);
    
    return { 
      totalCashback, 
      missedSavings, 
      bestCardName: bestCard?.name || bestCardId || '—',
      bestCardBank: bestCard?.bank || '',
      totalTxns: txns.length 
    };
  }, [cards, txns]);

  const handleQuickRecommend = () => {
    if (!qAmount || cards.length === 0) return;
    fetchRecommendation();
  };

  const qResult = recResults?.[0];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cashback This Month"
          value={`₹${stats.totalCashback.toLocaleString()}`}
          subtitle="+₹340 vs last month"
          icon={<IndianRupee className="h-4 w-4" />}
          accentColor="emerald"
        />
        <StatCard
          title="Active Cards"
          value={cardsLoading ? "..." : String(cards.length)}
          subtitle={cardsLoading ? "Loading..." : `${cards.length} cards linked`}
          icon={cardsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          accentColor="indigo"
        />
        <StatCard
          title="Missed Savings"
          value={`₹${stats.missedSavings}`}
          subtitle="Use better cards"
          icon={<TrendingDown className="h-4 w-4" />}
          accentColor="coral"
        />
        <StatCard
          title="Best Card"
          value={stats.bestCardName}
          subtitle={stats.bestCardBank}
          icon={<Trophy className="h-4 w-4" />}
          accentColor="amber"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="surface-card overflow-hidden"
        >
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg">Recent Transactions</h2>
            <Link to="/recommend">
              <Button variant="outline" size="sm" className="gap-1 text-primary border-primary/30 hover:bg-primary/5">
                Find Best Card <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-5 py-3 text-left font-medium">Merchant</th>
                  <th className="px-5 py-3 text-left font-medium">Category</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 text-left font-medium">Card</th>
                  <th className="px-5 py-3 text-right font-medium">Cashback</th>
                  <th className="px-5 py-3 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((txn, i) => {
                  const card = cards.find(c => c.id === txn.cardId) || cards.find(c => c.name === txn.cardId);
                  const isOptimal = !txn.missedSavings;
                  return (
                    <tr key={txn.id} className={`border-b border-border/60 transition-colors ${i % 2 === 0 ? 'bg-background' : 'bg-card'}`}>
                      <td className="px-5 py-3 font-medium text-foreground">{txn.merchant}</td>
                      <td className="px-5 py-3 text-muted-foreground">{txn.category}</td>
                      <td className="px-5 py-3 text-right text-foreground">₹{txn.amount.toLocaleString()}</td>
                      <td className="px-5 py-3 text-muted-foreground">{card?.name || txn.cardId}</td>
                      <td className="px-5 py-3 text-right font-medium text-emerald">₹{txn.cashback}</td>
                      <td className="px-5 py-3 text-center">
                        {isOptimal ? (
                          <span className="inline-flex items-center rounded-full bg-emerald/10 px-2.5 py-0.5 text-xs font-medium text-emerald">
                            Optimal
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-coral/10 px-2.5 py-0.5 text-xs font-medium text-coral">
                            Missed ₹{txn.missedSavings}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Recommend Widget */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="surface-card p-5 h-fit"
        >
          <h3 className="font-display font-semibold mb-4">Quick Recommend</h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setQCategory(cat)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                    qCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                type="number"
                value={qAmount}
                onChange={e => setQAmount(e.target.value)}
                placeholder="Amount"
                className="pl-7 bg-secondary border-border"
                onKeyDown={e => e.key === 'Enter' && handleQuickRecommend()}
              />
            </div>
            <Button onClick={handleQuickRecommend} disabled={recLoading || cardsLoading} className="w-full gap-1">
              {recLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Find Card <ArrowRight className="h-3 w-3" /></>}
            </Button>

            {qResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 p-4 rounded-lg bg-primary/5 border border-primary/20"
              >
                <p className="text-xs text-muted-foreground">Best card for {qCategory}</p>
                <p className="font-display font-bold text-foreground mt-1">{qResult.cardName}</p>
                <p className="text-xs text-muted-foreground">{qResult.bankName}</p>
                <p className="text-lg font-bold text-emerald mt-2">₹{qResult.benefitAmount.toFixed(2)}</p>
              </motion.div>
            )}
            {!qResult && recResults && recResults.length === 0 && (
              <div className="mt-3 p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground text-center">No cards available. Add a card first.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
