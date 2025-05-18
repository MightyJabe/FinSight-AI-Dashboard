import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.svg"
              alt="FinSight AI Dashboard"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="hidden font-bold sm:inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent text-lg tracking-tight">
              FinSight <span className="font-extrabold">AI</span>
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              href="/analytics"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Analytics
            </Link>
            <Link
              href="/insights"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Insights
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
} 