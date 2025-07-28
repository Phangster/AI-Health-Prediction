import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // If user is logged in, redirect to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <main className="flex flex-col gap-8 items-center max-w-xl text-center">
        <Image
          className="dark:invert mb-4"
          src="/next.svg"
          alt="Next.js logo"
          width={120}
          height={30}
          priority
        />
        <h1 className="text-4xl font-bold mb-2">AI Health Tracker</h1>
        <p className="text-lg mb-4">
          Welcome to your personal AI-powered health tracker!<br />
          Snap a photo or upload your grocery or restaurant receipt, and our AI will extract and analyze the contents using OCR to help you track your nutrition and spending.
        </p>
        <div className="flex flex-col gap-2 w-full">
          <Button asChild className="w-full">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Please <span className="font-semibold">login</span> or <span className="font-semibold">sign up</span> to get started.
        </p>
      </main>
      <footer className="flex gap-[24px] flex-wrap items-center justify-center text-xs text-muted-foreground mt-8">
        <span>Built with Next.js, shadcn/ui, and AI OCR</span>
      </footer>
    </div>
  );
}
