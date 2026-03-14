import { useState } from 'react';
import { Sparkles, Copy, Check, ArrowRight, Loader2 } from 'lucide-react';
import { CATEGORIES, Category } from '@/lib/data';
import CreditCardUI from '@/components/CreditCardUI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getUserCards, getRecommendation } from '@/services/api';
import { mapApiCard } from '@/pages/MyCards';

const USER_ID = 'user-123';

const EXAMPLE_CHIPS = [
  { label: '🍕 Swiggy ₹800', value: 'Swiggy ₹800' },
  { label: '✈️ Flight ₹12,000', value: 'booked flight on MakeMyTrip ₹12000' },
  { label: '⛽ Fuel ₹2,000', value: 'BPCL fuel ₹2000' },
  { label: '🛒 Amazon ₹3,500', value: 'bought on Amazon ₹3500' },
];

export default function Recommend() {
  const [nlInput, setNlInput] = useState('');
  const [category, setCategory] = useState<Category>('Dining');
  const [amount, setAmount] = useState('');
  const [searchCategory, setSearchCategory] = useState<Category>('Dining');
  const [searchAmount, setSearchAmount] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: apiCards = [] } = useQuery({
    queryKey: ['cards', USER_ID],
    queryFn: () => getUserCards(USER_ID),
  });

  const cards = apiCards.map(mapApiCard);

  const { data: results, isLoading, isFetching, refetch: fetchResults } = useQuery({
    queryKey: ['recommendation', USER_ID, searchCategory, searchAmount],
    queryFn: () => getRecommendation(USER_ID, searchCategory, searchAmount),
    enabled: false,
  });

  const parseNL = (input: string): { category: Category; amount: number } | null => {
    const amountMatch = input.match(/₹?\s*(\d[\d,]*)/);
    const amt = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : 0;
    if (!amt) return null;
    const lower = input.toLowerCase();
    let cat: Category = 'Other';
    if (/swiggy|zomato|dine|dinner|lunch|breakfast|restaurant|food|pizza/.test(lower)) cat = 'Dining';
    else if (/flipkart|amazon|shop|myntra|online|buy|bought|shoes/.test(lower)) cat = 'Shopping';
    else if (/fuel|petrol|diesel|bpcl|hp|ioc/.test(lower)) cat = 'Fuel';
    else if (/travel|flight|hotel|makemytrip|trip|booking|booked/.test(lower)) cat = 'Travel';
    else if (/movie|netflix|hotstar|entertain|spotify/.test(lower)) cat = 'Entertainment';
    return { category: cat, amount: amt };
  };

  const handleNL = () => {
    const parsed = parseNL(nlInput);
    if (!parsed) {
      toast({ title: 'Could not parse', description: 'Please include an amount and merchant/category.', variant: 'destructive' });
      return;
    }
    
    setSearchCategory(parsed.category);
    setSearchAmount(parsed.amount);
    
    // We must use a slight timeout so states are setter before fetching, or rely on effect/query keys
    setTimeout(() => {
      runRecommend();
    }, 0);
  };

  const handleManual = () => {
    if (!amount) return;
    setSearchCategory(category);
    setSearchAmount(Number(amount));
    
    setTimeout(() => {
      runRecommend();
    }, 0);
  };

  const runRecommend = () => {
    if (cards.length === 0) {
      toast({ title: 'No cards', description: 'Add cards first to get recommendations.', variant: 'destructive' });
      return;
    }
    fetchResults();
  };

  const copyName = (name: string, id: string) => {
    navigator.clipboard.writeText(name);
    setCopiedId(id);
    toast({ title: 'Copied!', description: `${name} copied to clipboard.` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const winner = results?.[0];
  const winnerCard = winner ? cards.find(c => c.name === winner.cardName && c.bank === winner.bankName) : null;
  const showLoading = isLoading || isFetching;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Find Your Best Card</h1>
        <p className="text-muted-foreground text-sm mt-1">Tell us what you're buying — we'll tell you which card to use</p>
      </div>

      {/* AI Input */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={nlInput}
            onChange={e => setNlInput(e.target.value)}
            placeholder="Try: 'ordered pizza on Swiggy for ₹850' or 'bought shoes on Myntra ₹2400'"
            className="flex-1 bg-secondary border-border text-sm h-11 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            onKeyDown={e => e.key === 'Enter' && handleNL()}
          />
          <Button onClick={handleNL} disabled={showLoading} className="h-11 px-5 gap-2 rounded-full bg-primary hover:bg-primary/90">
            {showLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyze ✦
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLE_CHIPS.map(chip => (
            <button
              key={chip.label}
              onClick={() => { setNlInput(chip.value); }}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-secondary text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or select manually</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Manual */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={category} onValueChange={v => setCategory(v as Category)}>
          <SelectTrigger className="sm:w-48 bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
          <Input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Amount"
            className="pl-7 bg-card border-border"
            onKeyDown={e => e.key === 'Enter' && handleManual()}
          />
        </div>
        <Button onClick={handleManual} disabled={showLoading} variant="outline" className="gap-1 border-primary/30 text-primary hover:bg-primary/5">
          {showLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Compare Cards <ArrowRight className="h-3 w-3" /></>}
        </Button>
      </div>

      {/* Loading */}
      {showLoading && (
        <div className="space-y-4">
          <div className="shimmer h-40 rounded-xl" />
          <div className="shimmer h-20 rounded-xl" />
        </div>
      )}

      {/* Results */}
      {results && !showLoading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Winner Banner */}
          {winnerCard && winner && (
            <div className="surface-card p-6 bg-primary/5 border-primary/20">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-full md:w-56 shrink-0">
                  <CreditCardUI card={winnerCard} highlight compact />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Best Card for this Purchase</p>
                  <p className="text-xl font-display font-bold text-foreground">{winner.cardName}</p>
                  <p className="text-sm text-muted-foreground">{winner.bankName}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-display font-bold text-emerald">₹{winner.benefitAmount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{winner.percentage}% reward rate</p>
                  <span className="inline-flex items-center mt-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    USE THIS CARD
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          {results.length > 1 && (
            <div className="surface-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="font-display font-semibold">Full Comparison</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="px-5 py-3 text-left font-medium">Rank</th>
                      <th className="px-5 py-3 text-left font-medium">Card</th>
                      <th className="px-5 py-3 text-left font-medium">Bank</th>
                      <th className="px-5 py-3 text-right font-medium">Category Rate</th>
                      <th className="px-5 py-3 text-right font-medium">You Earn</th>
                      <th className="px-5 py-3 text-right font-medium">vs Best</th>
                      <th className="px-5 py-3 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr
                        key={i}
                        className={`border-b border-border/60 transition-colors ${
                          i === 0 ? 'bg-amber/5 border-l-4 border-l-amber' : ''
                        }`}
                      >
                        <td className="px-5 py-3 font-medium">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className="px-5 py-3 font-medium text-foreground">{r.cardName}</td>
                        <td className="px-5 py-3 text-muted-foreground">{r.bankName}</td>
                        <td className="px-5 py-3 text-right">{r.percentage}%</td>
                        <td className="px-5 py-3 text-right font-medium text-emerald">₹{r.benefitAmount.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right">
                          {i === 0 ? (
                            <span className="text-emerald font-medium">Best</span>
                          ) : (
                            <span className="text-coral">–₹{(winner!.benefitAmount - r.benefitAmount).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => copyName(r.cardName, String(i))} className="text-muted-foreground hover:text-primary transition-colors">
                            {copiedId === String(i) ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Insight line */}
          {results.length > 1 && winner && searchCategory && (
            <div className="surface-card p-4 text-sm text-muted-foreground">
              💡 You save ₹{(winner.benefitAmount - results[1].benefitAmount).toFixed(2)} more by using <span className="font-semibold text-foreground">{winner.cardName}</span> over <span className="font-semibold text-foreground">{results[1].cardName}</span> for {searchCategory.toLowerCase()}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
