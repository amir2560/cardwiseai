import { forwardRef, useMemo } from 'react';
import { getBankGradient, CreditCard as CardType } from '@/lib/data';
import { CreditCard as CardIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  card: CardType;
  onClick?: () => void;
  highlight?: boolean;
  compact?: boolean;
}

const CreditCardUI = forwardRef<HTMLDivElement, Props>(({ card, onClick, highlight, compact }, ref) => {
  const lastFour = useMemo(() => String(Math.floor(1000 + Math.random() * 9000)), []);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 ${compact ? 'aspect-[2/1]' : 'aspect-[1.6/1]'} flex flex-col justify-between cursor-pointer text-white ${getBankGradient(card.bank)} ${
        highlight ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-medium opacity-80">{card.bank}</p>
          <p className="text-base font-display font-bold">{card.name}</p>
        </div>
        <CardIcon className="h-7 w-7 opacity-30" />
      </div>

      <div>
        <p className="text-sm font-mono tracking-widest opacity-50 mb-2">
          •••• •••• •••• {lastFour}
        </p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(card.rewards)
            .filter(([, v]) => v >= 2)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([cat, pct]) => (
              <span
                key={cat}
                className="text-[10px] font-semibold bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5"
              >
                {cat} {pct}%
              </span>
            ))}
        </div>
      </div>

      {/* Decorative */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute -right-4 top-8 h-20 w-20 rounded-full bg-white/5" />
    </motion.div>
  );
});

CreditCardUI.displayName = 'CreditCardUI';
export default CreditCardUI;
