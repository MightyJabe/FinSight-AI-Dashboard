import { motion } from 'framer-motion';

import { Overview } from '@/lib/finance';
import { formatCurrency, formatPercentage } from '@/utils/format';

interface BudgetSectionProps {
  overview: Overview;
}

/**
 *
 */
export function BudgetSection({ overview = { budgetCategories: [] } }: BudgetSectionProps) {
  const { budgetCategories } = overview;
  const topSpendingCategories = [...budgetCategories].sort((a, b) => b.spent - a.spent).slice(0, 5);

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, type: 'spring', stiffness: 80 },
    }),
  };

  return (
    <motion.div
      className="bg-card/80 backdrop-blur rounded-xl shadow-lg p-6 border border-border/40 hover:shadow-xl transition-shadow duration-200"
      initial="hidden"
      animate="visible"
      custom={0}
      variants={cardVariants}
      tabIndex={0}
    >
      <h2 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
        Budget Overview
        <span className="text-xs text-muted-foreground font-normal">(top spending categories)</span>
      </h2>
      <div className="space-y-4">
        {topSpendingCategories.length === 0 ? (
          <div className="text-muted-foreground text-sm">No budget categories found.</div>
        ) : (
          topSpendingCategories.map((category, i) => {
            const utilization = (category.spent / category.amount) * 100;
            let barColor = 'bg-green-500';
            if (utilization >= 100) barColor = 'bg-rose-500';
            else if (utilization >= 75) barColor = 'bg-amber-500';
            return (
              <motion.div
                key={category.id}
                className="space-y-2 group"
                initial="hidden"
                animate="visible"
                custom={i}
                variants={cardVariants}
                tabIndex={0}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{category.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(category.spent)} / {formatCurrency(category.amount)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, utilization)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPercentage(utilization)} utilized</span>
                  <span>
                    {category.spent >= category.amount ? (
                      <span className="text-rose-600 font-semibold">Over budget</span>
                    ) : category.spent >= category.amount * 0.75 ? (
                      <span className="text-amber-600 font-semibold">Near limit</span>
                    ) : (
                      <span className="text-green-600 font-semibold">On track</span>
                    )}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
