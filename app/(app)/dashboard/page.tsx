import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suppliers, sourceProducts, scrapedOffers } from "@/lib/db/schema";
import { count, desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Store, Tag } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const [productCountRow] = await db
    .select({ c: count() })
    .from(sourceProducts);
  const [supplierCountRow] = await db.select({ c: count() }).from(suppliers);
  const [offerCountRow] = await db.select({ c: count() }).from(scrapedOffers);

  const recent = await db
    .select({
      id: sourceProducts.id,
      title: sourceProducts.title,
      createdAt: sourceProducts.createdAt,
      supplierName: suppliers.name,
    })
    .from(sourceProducts)
    .leftJoin(suppliers, eq(sourceProducts.supplierId, suppliers.id))
    .orderBy(desc(sourceProducts.createdAt))
    .limit(5);

  const username = session?.user.email?.split("@")[0] ?? "there";

  const stats = [
    {
      label: "Products",
      value: productCountRow.c,
      icon: Package,
      href: "/products",
    },
    {
      label: "Suppliers",
      value: supplierCountRow.c,
      icon: Store,
      href: "/suppliers",
    },
    {
      label: "Offers",
      value: offerCountRow.c,
      icon: Tag,
      href: "/products",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {username}
        </h1>
        <p className="text-foreground/60 mt-1">
          Here&apos;s an overview of your dropshipping tracker.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:border-foreground/30 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground/60">
                  {stat.label}
                </CardTitle>
                <stat.icon size={16} className="text-foreground/40" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Products</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-foreground/60">
              No products yet. Add your first one.
            </p>
          ) : (
            <ul className="divide-y">
              {recent.map((product) => (
                <li key={product.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link
                      href={`/products/${product.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {product.title}
                    </Link>
                    {product.supplierName && (
                      <p className="text-xs text-foreground/50">
                        {product.supplierName}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-foreground/40">
                    {product.createdAt
                      ? new Date(product.createdAt).toLocaleDateString()
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
