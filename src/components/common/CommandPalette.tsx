'use client';

import { Command } from 'cmdk';
import {
  DollarSign,
  FileText,
  MessageSquare,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="fixed left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 px-4">
        <Command
          className="rounded-xl border border-gray-200 bg-white shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center border-b border-gray-200 px-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Command.Input
              placeholder="Search or jump to..."
              className="flex h-14 w-full bg-transparent px-3 text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Pages" className="mb-2">
              <Command.Item
                onSelect={() => navigate('/dashboard')}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/transactions')}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span>Transactions</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/documents')}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-gray-500" />
                <span>Documents</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/tax')}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <Receipt className="h-4 w-4 text-gray-500" />
                <span>Tax Intelligence</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/subscriptions')}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 text-gray-500" />
                <span>Subscriptions</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/chat')}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span>AI Chat</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/settings')}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <Settings className="h-4 w-4 text-gray-500" />
                <span>Settings</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
            Press <kbd className="rounded bg-gray-100 px-1.5 py-0.5">Esc</kbd> to close
          </div>
        </Command>
      </div>
    </div>
  );
}
