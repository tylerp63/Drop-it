import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/login");

  return (
    <main className="min-h-screen flex flex-col">
      <AppNav />
      <div className="flex-1 w-full max-w-6xl mx-auto px-5 py-10">
        {children}
      </div>
      <footer className="border-t py-6 text-center text-xs text-foreground/60">
        Drop-It · Built with Next.js, Drizzle, and Better Auth
      </footer>
    </main>
  );
}
