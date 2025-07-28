"use client";

import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SidebarProvider>
        {children}
      </SidebarProvider>
      <Toaster />
    </SessionProvider>
  );
} 