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
  string,
  { bg: string; text: string; border: string; badgeBg: string; badgeText: string }
> = {
  high: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-500',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
  },
  medium: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-500',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-700',
  },
  low: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-500',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-700',
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
      className={`rounded-xl shadow-lg overflow-hidden border-l-4 ${styles.border} ${styles.bg}`}
    >
      <div className={`p-5`}>
        <div className="flex justify-between items-start">
          <h3 className={`text-xl font-semibold ${styles.text}`}>{insight.title}</h3>
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles.badgeBg} ${styles.badgeText}`}
          >
            {insight.priority.toUpperCase()} PRIORITY
          </span>
        </div>
      </div>
      <div className="p-5 bg-white">
        <p className="text-gray-700 mb-3 text-sm">{insight.description}</p>
        {insight.actionItems && insight.actionItems.length > 0 && (
          <div>
            <button
              onClick={toggleExpansion}
              className="flex items-center justify-between w-full py-2 text-left font-medium text-primary hover:text-primary/80 focus:outline-none"
              aria-expanded={isExpanded}
              aria-controls={`action-items-${index}`}
            >
              <span className="text-sm">Actionable Steps</span>
              <ChevronDown
                className={`h-5 w-5 transition-transform transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
            {isExpanded && (
              <ul
                id={`action-items-${index}`}
                className="list-disc pl-6 mt-2 space-y-1 text-sm text-gray-600"
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
