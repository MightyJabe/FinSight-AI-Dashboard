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
import { createContext, useContext, useEffect, useState } from 'react';

// Create context for command palette
const CommandPaletteContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export const useCommandPalette = () => useContext(CommandPaletteContext);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette open={open} setOpen={setOpen} />
    </CommandPaletteContext.Provider>
  );
}

function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div className="fixed left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 px-4 animate-scale-in">
        <Command
          className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Command.Input
              placeholder="Search or jump to..."
              className="flex h-14 w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
          </div>
          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Pages" className="mb-2">
              <Command.Item
                onSelect={() => navigate('/dashboard')}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary cursor-pointer transition-colors duration-200 aria-selected:bg-secondary"
              >
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/transactions')}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary cursor-pointer transition-colors duration-200 aria-selected:bg-secondary"
              >
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Transactions</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/documents')}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary cursor-pointer transition-colors duration-200 aria-selected:bg-secondary"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Documents</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/tax')}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary cursor-pointer transition-colors duration-200 aria-selected:bg-secondary"
              >
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Tax Intelligence</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/subscriptions')}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary cursor-pointer transition-colors duration-200 aria-selected:bg-secondary"
              >
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Subscriptions</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/chat')}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary cursor-pointer transition-colors duration-200 aria-selected:bg-secondary"
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">AI Chat</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/settings')}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary cursor-pointer transition-colors duration-200 aria-selected:bg-secondary"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Settings</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground bg-secondary/30">
            Press <kbd className="rounded-md bg-background border border-border px-1.5 py-0.5 font-mono">Esc</kbd> to close
          </div>
        </Command>
      </div>
    </div>
  );
}
