import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Health Tracker",
  description: "Track your health with AI and OCR receipts.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const user = session?.user
    ? {
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
        image: session.user.image ?? undefined,
      }
    : null;
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {user && <AppSidebar user={user} />}
          <main className={user ? "w-full min-h-screen" : "min-h-screen"}>
            {user && <SidebarTrigger className="top-4 left-4" />}
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
