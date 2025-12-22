import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-10 flex h-[56px] items-center gap-4 border-b border-border bg-card px-6 shadow-sm">
            <SidebarTrigger className="text-foreground" />
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-foreground tracking-wide">
                  しぇれす
                </span>
                <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  sheless
                </span>
              </div>
            </div>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
