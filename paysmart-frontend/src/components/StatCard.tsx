import { motion } from 'framer-motion';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: 'indigo' | 'emerald' | 'coral' | 'amber';
}

const BORDER_COLORS = {
  indigo: 'border-l-indigo',
  emerald: 'border-l-emerald',
  coral: 'border-l-coral',
  amber: 'border-l-amber',
};

const ICON_BG = {
  indigo: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald/10 text-emerald',
  coral: 'bg-coral/10 text-coral',
  amber: 'bg-amber/10 text-amber',
};

export default function StatCard({ title, value, subtitle, icon, accentColor = 'indigo' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`surface-card-hover p-5 flex flex-col gap-3 border-l-4 ${BORDER_COLORS[accentColor]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${ICON_BG[accentColor]}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
