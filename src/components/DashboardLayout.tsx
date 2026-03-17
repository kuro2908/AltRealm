import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-40">
            <AppSidebar />
          </div>
        </div>
      )}

      {/* Mobile hamburger button */}
      <button
        className="fixed left-3.5 bottom-4 z-20 p-2 rounded-lg bg-card border border-border/60 shadow-sm lg:hidden"
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-4 w-4 text-muted-foreground" />
      </button>

      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
