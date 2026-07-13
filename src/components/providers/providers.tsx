"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryProvider>
          <TooltipProvider>
            {children}
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
