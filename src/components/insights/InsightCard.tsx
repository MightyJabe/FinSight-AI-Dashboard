'use client';

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
    <div
      className={`rounded-2xl shadow-xl overflow-hidden border-l-4 ${styles.border} ${styles.bg} transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]`}
    >
      <div className={`p-5`}>
        <div className="flex justify-between items-start gap-3">
          <h3 className={`text-xl font-semibold ${styles.text}`}>{insight.title}</h3>
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles.badgeBg} ${styles.badgeText} shadow-sm flex-shrink-0`}
          >
            {insight.priority.toUpperCase()} PRIORITY
          </span>
        </div>
      </div>
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
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
            {isExpanded && (
              <ul
                id={`action-items-${index}`}
                className="list-disc pl-6 mt-2 space-y-1 text-sm text-muted-foreground"
              >
                {insight.actionItems.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
