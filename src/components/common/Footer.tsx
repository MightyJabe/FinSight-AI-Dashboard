export function Footer() {
  return (
    <footer className="w-full border-t bg-background py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        <a href="/privacy" className="hover:underline transition-colors">
          Privacy Policy
        </a>
        <span className="text-muted-foreground">|</span>
        <a href="/terms" className="hover:underline transition-colors">
          Terms of Service
        </a>
        <span className="text-muted-foreground">|</span>
        <a
          href="mailto:finsight.ai.dashboard@gmail.com"
          className="hover:underline transition-colors"
        >
          Contact
        </a>
      </div>
      <span className="pt-2 block">
        &copy; {new Date().getFullYear()} FinSight AI. All rights reserved.
      </span>
    </footer>
  );
}
