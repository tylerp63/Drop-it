import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { suppliers, sourceProducts, scrapedOffers } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ExternalLink,
  Sparkles,
  TrendingDown,
  TrendingUp,
  BarChart3,
} from "lucide-react";

async function seedDummyOffers(formData: FormData) {
  "use server";
  const id = Number(formData.get("product_id"));
  await db.insert(scrapedOffers).values([
    { sourceProductId: id, title: "Offer from Seller A", price: 19.99, currency: "USD", inStock: true },
    { sourceProductId: id, title: "Offer from Seller B", price: 17.49, currency: "USD", inStock: true },
    { sourceProductId: id, title: "Offer from Seller C", price: 22.0, currency: "USD", inStock: false },
  ]);
  revalidatePath(`/products/${id}`);
  revalidatePath("/dashboard");
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const [product] = await db
    .select({
      id: sourceProducts.id,
      title: sourceProducts.title,
      sourceUrl: sourceProducts.sourceUrl,
      createdAt: sourceProducts.createdAt,
      supplierName: suppliers.name,
    })
    .from(sourceProducts)
    .leftJoin(suppliers, eq(sourceProducts.supplierId, suppliers.id))
    .where(eq(sourceProducts.id, productId))
    .limit(1);

  if (!product) notFound();

  const offers = await db
    .select()
    .from(scrapedOffers)
    .where(eq(scrapedOffers.sourceProductId, productId))
    .orderBy(desc(scrapedOffers.createdAt));

  const inStockOffers = offers.filter((o) => o.inStock);
  const priceStats =
    inStockOffers.length > 0
      ? {
          min: Math.min(...inStockOffers.map((o) => o.price)),
          max: Math.max(...inStockOffers.map((o) => o.price)),
          avg:
            inStockOffers.reduce((s, o) => s + o.price, 0) /
            inStockOffers.length,
          currency: inStockOffers[0].currency,
        }
      : null;

  const fmt = (n: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link
            href="/products"
            className="flex w-fit items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Back to products
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{product.title}</h1>
          <div className="flex items-center gap-2">
            {product.supplierName && (
              <Badge variant="outline">{product.supplierName}</Badge>
            )}
            <a
              href={product.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground"
            >
              View source <ExternalLink size={12} />
            </a>
          </div>
        </div>
        <form action={seedDummyOffers}>
          <input type="hidden" name="product_id" value={productId} />
          <Button type="submit" variant="outline" size="sm">
            <Sparkles size={14} className="mr-1.5" />
            Seed dummy offers
          </Button>
        </form>
      </div>

      {priceStats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground/60">
                Lowest
              </CardTitle>
              <TrendingDown size={16} className="text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums text-green-600">
                {fmt(priceStats.min, priceStats.currency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground/60">
                Average
              </CardTitle>
              <BarChart3 size={16} className="text-foreground/40" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {fmt(priceStats.avg, priceStats.currency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground/60">
                Highest
              </CardTitle>
              <TrendingUp size={16} className="text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums text-red-600">
                {fmt(priceStats.max, priceStats.currency)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Offers</CardTitle>
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <p className="text-sm text-foreground/60">
              No offers yet. Click{" "}
              <span className="font-medium">Seed dummy offers</span> above to
              add some sample data.
            </p>
          ) : (
            <ul className="divide-y">
              {offers.map((offer) => (
                <li
                  key={offer.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {offer.title ?? "Untitled offer"}
                    </p>
                    <p className="text-xs text-foreground/40">
                      {offer.createdAt
                        ? new Date(offer.createdAt).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {priceStats && offer.inStock && offer.price === priceStats.min && (
                      <Badge className="bg-green-500 text-white hover:bg-green-600">
                        Best price
                      </Badge>
                    )}
                    <Badge variant={offer.inStock ? "default" : "secondary"}>
                      {offer.inStock ? "In stock" : "Out of stock"}
                    </Badge>
                    <span className="text-sm font-semibold tabular-nums">
                      {fmt(offer.price, offer.currency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
