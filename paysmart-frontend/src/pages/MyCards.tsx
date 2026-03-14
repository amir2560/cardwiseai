import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import CreditCardUI from '@/components/CreditCardUI';
import { CreditCard, CATEGORIES, BANKS, QUICK_ADD_CARDS, Category, BANK_DOT_COLOR } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserCards, addCard as apiAddCard, deleteCard as apiDeleteCard, Card as ApiCard, RewardRule } from '@/services/api';

const USER_ID = 'user-123';

/** Map backend Card to frontend CreditCard structure */
export function mapApiCard(apiCard: ApiCard): CreditCard {
  const rewards: Record<Category, number> = {
    Dining: 0, Shopping: 0, Fuel: 0, Travel: 0, Entertainment: 0, Other: 0,
  };
  
  apiCard.rewardRules?.forEach(rule => {
    const cat = rule.category as Category;
    if (Object.keys(rewards).includes(cat)) {
      rewards[cat] = rule.percentage;
    } else if (rule.category.toLowerCase() === 'other') {
      rewards['Other'] = rule.percentage;
    }
  });

  return {
    id: apiCard.cardId,
    bank: apiCard.bankName,
    name: apiCard.cardName,
    rewards,
  };
}

export default function MyCards() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bank, setBank] = useState('');
  const [name, setName] = useState('');
  const [rewards, setRewards] = useState<Record<Category, number>>(
    Object.fromEntries(CATEGORIES.map(c => [c, 0])) as Record<Category, number>
  );
  const [cap, setCap] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: apiCards = [], isLoading } = useQuery({
    queryKey: ['cards', USER_ID],
    queryFn: () => getUserCards(USER_ID),
  });

  const cards = apiCards.map(mapApiCard);

  // Mutations
  const addMutation = useMutation({
    mutationFn: (newCard: Omit<ApiCard, 'cardId' | 'userId'>) => apiAddCard(USER_ID, newCard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', USER_ID] });
      toast({ title: 'Card added!', description: 'Card has been added to your wallet.' });
      setDrawerOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (cardId: string) => apiDeleteCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', USER_ID] });
      toast({ title: 'Card removed', description: 'Card has been removed from your wallet.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const handleAddCard = () => {
    if (!bank || !name) return;
    
    // Transform Record<Category, number> to RewardRule[]
    const rewardRules: RewardRule[] = Object.entries(rewards)
      .filter(([_, percentage]) => percentage > 0)
      .map(([category, percentage]) => ({
        category,
        rewardType: 'cashback',
        percentage,
        monthlyCap: cap ? Number(cap) : 0,
        pointsValue: 1, // Default to 1 for cashback equivalent
      }));

    addMutation.mutate({
      bankName: bank,
      cardName: name,
      rewardRules,
    });
  };

  const deleteCard = (id: string) => {
    deleteMutation.mutate(id);
  };

  const quickAdd = (card: CreditCard) => {
    if (cards.some(c => c.name === card.name && c.bank === card.bank)) {
      toast({ title: 'Already added', description: `${card.name} is already in your wallet.`, variant: 'destructive' });
      return;
    }

    const rewardRules: RewardRule[] = Object.entries(card.rewards)
      .filter(([_, percentage]) => percentage > 0)
      .map(([category, percentage]) => ({
        category,
        rewardType: 'cashback',
        percentage,
        monthlyCap: card.monthlyCap || 0,
        pointsValue: 1,
      }));

    addMutation.mutate({
      bankName: card.bank,
      cardName: card.name,
      rewardRules,
    });
  };

  const resetForm = () => {
    setBank(''); setName(''); setCap('');
    setRewards(Object.fromEntries(CATEGORIES.map(c => [c, 0])) as Record<Category, number>);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">My Cards</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your credit cards and reward rules</p>
        </div>
        <Button onClick={() => setDrawerOpen(true)} className="gap-2" disabled={addMutation.isPending}>
          {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} 
          Add Card
        </Button>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : cards.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <p className="text-muted-foreground">No cards added yet. Add your first card to get started!</p>
          <Button onClick={() => setDrawerOpen(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" /> Add Your First Card
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative group"
            >
              <CreditCardUI card={card} />
              {/* Actions overlay */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => deleteCard(card.id)}
                  disabled={deleteMutation.isPending}
                  className="h-7 w-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-destructive hover:bg-white transition-colors shadow-sm disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Reward pills below card */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {Object.entries(card.rewards)
                  .filter(([, v]) => v > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, pct]) => (
                    <span key={cat} className="text-xs font-medium bg-secondary text-muted-foreground rounded-full px-2.5 py-1 border border-border">
                      {cat} {pct}%
                    </span>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Add */}
      {!isLoading && (
        <div className="surface-card p-6">
          <h2 className="font-display font-semibold text-base mb-1">Quick Add Popular Cards</h2>
          <p className="text-xs text-muted-foreground mb-4">Add in one click</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ADD_CARDS.map(card => {
              const dotClass = BANK_DOT_COLOR[card.bank] || 'bg-muted-foreground';
              return (
                <button
                  key={card.id}
                  onClick={() => quickAdd(card)}
                  disabled={addMutation.isPending}
                  className="flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-50"
                >
                  <span className={`h-2 w-2 rounded-full ${dotClass}`} />
                  {card.name}
                  <Plus className="h-3 w-3 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Slide-in Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col shadow-xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-display font-semibold text-lg">Add Credit Card</h3>
                <button onClick={() => setDrawerOpen(false)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div>
                  <Label className="text-sm font-medium">Bank</Label>
                  <Select value={bank} onValueChange={setBank}>
                    <SelectTrigger className="mt-1.5 bg-secondary border-border"><SelectValue placeholder="Select bank" /></SelectTrigger>
                    <SelectContent>
                      {BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Card Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Regalia Gold" className="mt-1.5 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Reward % by Category</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {CATEGORIES.map(cat => (
                      <div key={cat}>
                        <span className="text-xs text-muted-foreground">{cat}</span>
                        <Input
                          type="number"
                          min={0}
                          step={0.25}
                          value={rewards[cat]}
                          onChange={e => setRewards(r => ({ ...r, [cat]: Number(e.target.value) }))}
                          className="mt-1 bg-secondary border-border h-9 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Monthly Cashback Cap (₹, optional)</Label>
                  <Input type="number" value={cap} onChange={e => setCap(e.target.value)} placeholder="e.g. 1000" className="mt-1.5 bg-secondary border-border" />
                </div>
              </div>
              <div className="p-5 border-t border-border flex gap-3">
                <Button variant="outline" onClick={() => setDrawerOpen(false)} className="flex-1" disabled={addMutation.isPending}>Cancel</Button>
                <Button onClick={handleAddCard} className="flex-1" disabled={addMutation.isPending}>
                  {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Card
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
