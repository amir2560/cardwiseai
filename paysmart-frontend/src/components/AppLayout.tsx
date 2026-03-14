import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Sparkles, BarChart3, Search, Bell, User, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cards', label: 'My Cards', icon: CreditCard },
  { to: '/recommend', label: 'Recommend', icon: Sparkles },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/cards': 'My Cards',
  '/recommend': 'Find Your Best Card',
  '/insights': 'Spending Insights',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const pageTitle = PAGE_TITLES[pathname] || 'CardWise AI';

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-screen border-r border-border bg-card z-40 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-4 border-b border-border shrink-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <CreditCard className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display text-lg font-bold tracking-tight">
              Card<span className="text-primary">Wise</span> AI
            </span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-12 flex items-center justify-center border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur-lg flex items-center px-4 md:px-6 gap-4">
          <h2 className="font-display font-semibold text-lg hidden md:block">{pageTitle}</h2>

          <div className="flex-1 max-w-md mx-auto hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search cards, transactions..."
                className="w-full h-9 rounded-lg border border-border bg-secondary pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <CreditCard className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-bold">
              Card<span className="text-primary">Wise</span>
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground">
              <Bell className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-[1200px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around h-16 px-2">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
