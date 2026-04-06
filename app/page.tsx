import Link from "next/link";
import { Package, Store, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme-switcher";

const features = [
  {
    icon: Package,
    title: "Product Tracking",
    description:
      "Add source products from any supplier and keep all your listings in one place.",
  },
  {
    icon: Store,
    title: "Supplier Management",
    description:
      "Organise your suppliers, add websites, and enable the ones you actively monitor.",
  },
  {
    icon: BarChart3,
    title: "Price Comparison",
    description:
      "Log scraped price offers and instantly see the lowest, average, and highest prices.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Mini navbar */}
      <nav className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <Package size={14} />
            </div>
            <span className="font-semibold">Drop-It</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Button asChild size="sm" variant="ghost">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-5 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Track every supplier.
            <br />
            Win every margin.
          </h1>
          <p className="mt-6 text-lg text-foreground/60">
            Drop-It is a dropshipping price and availability tracker. Monitor
            source products, manage suppliers, and compare scraped offers — all
            in one dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/auth/sign-up">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="border-t py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted mb-2">
                    <f.icon size={20} className="text-foreground/70" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-foreground/50">
        Drop-It · Built with Next.js, Drizzle ORM, and Better Auth
      </footer>
    </div>
  );
}
