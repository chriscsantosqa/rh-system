import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "RH Lupatelli — Gestão de Pessoas",
  description: "Mini ERP de RH: funcionários, escalas, vale transporte, atestados e indicadores.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <Toaster richColors position="top-right" closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
