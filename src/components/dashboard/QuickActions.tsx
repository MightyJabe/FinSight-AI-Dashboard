'use client';

import { motion } from 'framer-motion';
import { Link as LinkIcon, MessageSquare, Plus, Upload } from 'lucide-react';
import Link from 'next/link';

const actions = [
  {
    icon: Plus,
    label: 'Add Transaction',
    href: '/manual-data',
    color: 'from-blue-500 via-blue-600 to-indigo-600',
  },
  {
    icon: LinkIcon,
    label: 'Link Account',
    href: '/accounts',
    color: 'from-purple-500 via-purple-600 to-pink-600',
  },
  {
    icon: MessageSquare,
    label: 'Ask AI',
    href: '/chat',
    color: 'from-green-500 via-emerald-600 to-teal-600',
  },
  {
    icon: Upload,
    label: 'Upload Document',
    href: '/documents',
    color: 'from-amber-500 via-orange-600 to-red-600',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {actions.map((action, index) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link
            href={action.href}
            className="group relative flex flex-col items-center gap-3 rounded-xl bg-white p-5 shadow-md transition-all hover:scale-105 hover:shadow-xl"
          >
            <div
              className={`rounded-xl bg-gradient-to-br ${action.color} p-3 text-white shadow-lg transition-transform group-hover:scale-110`}
            >
              <action.icon className="h-7 w-7" />
            </div>
            <span className="text-sm font-semibold text-gray-800">{action.label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
