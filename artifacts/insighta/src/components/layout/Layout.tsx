import { Navbar } from "./Navbar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="border-t border-border/50 py-8 bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Insighta. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span>
            <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
