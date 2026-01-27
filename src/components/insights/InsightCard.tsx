'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface Insight {
  title: string;
  description: string;
  actionItems?: string[];
  priority: 'high' | 'medium' | 'low';
}

interface InsightCardProps {
  insight: Insight;
  index: number; // For unique IDs if needed, or managing expansion state from parent
}

const priorityStyles: Record<
  'high' | 'medium' | 'low',
  { bg: string; text: string; border: string; badgeBg: string; badgeText: string }
> = {
  high: {
    bg: 'bg-destructive/10 backdrop-blur-sm',
    text: 'text-destructive-foreground',
    border: 'border-red-500/50',
    badgeBg: 'bg-gradient-to-br from-red-500 to-rose-600',
    badgeText: 'text-white',
  },
  medium: {
    bg: 'bg-amber-500/10 backdrop-blur-sm',
    text: 'text-amber-900 dark:text-amber-100',
    border: 'border-amber-500/50',
    badgeBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    badgeText: 'text-white',
  },
  low: {
    bg: 'bg-emerald-500/10 backdrop-blur-sm',
    text: 'text-emerald-900 dark:text-emerald-100',
    border: 'border-emerald-500/50',
    badgeBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    badgeText: 'text-white',
  },
};

/**
 *
 */
export default function InsightCard({ insight, index }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = priorityStyles[insight.priority] || priorityStyles.medium;

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      className={`rounded-2xl shadow-xl overflow-hidden border-l-4 ${styles.border} ${styles.bg}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: index * 0.1,
      }}
      whileHover={{
        y: -6,
        scale: 1.02,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 25,
        },
      }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className={`p-5`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.2 }}
      >
        <div className="flex justify-between items-start gap-3">
          <h3 className={`text-xl font-semibold ${styles.text}`}>{insight.title}</h3>
          <motion.span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles.badgeBg} ${styles.badgeText} shadow-sm flex-shrink-0`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.3, type: 'spring', stiffness: 400 }}
          >
            {insight.priority.toUpperCase()} PRIORITY
          </motion.span>
        </div>
      </motion.div>
      <div className="p-5 glass-card border-t border-white/10">
        <p className="text-foreground mb-3 text-sm leading-relaxed">{insight.description}</p>
        {insight.actionItems && insight.actionItems.length > 0 && (
          <div>
            <button
              onClick={toggleExpansion}
              className="flex items-center justify-between w-full py-2 text-left font-medium text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg px-2 -mx-2 transition-all duration-200"
              aria-expanded={isExpanded}
              aria-controls={`action-items-${index}`}
            >
              <span className="text-sm">Actionable Steps</span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="h-5 w-5" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.ul
                  id={`action-items-${index}`}
                  className="list-disc pl-6 mt-2 space-y-1 text-sm text-muted-foreground"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {insight.actionItems.map((item, itemIndex) => (
                    <motion.li
                      key={itemIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: itemIndex * 0.05 }}
                    >
                      {item}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
