import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { suppliers, sourceProducts, scrapedOffers } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { scrapeProductPage } from "@/lib/scraper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrapeButton } from "@/components/scrape-button";
import { AddSourceForm } from "@/components/add-source-form";
import { RescrapeAllButton } from "@/components/rescrape-all-button";
import {
  ArrowLeft,
  ExternalLink,
  TrendingDown,
  TrendingUp,
  BarChart3,
} from "lucide-react";

type ScrapeState = { error?: string; success?: boolean } | null;
type RescrapeState = { error?: string; refreshed?: number } | null;

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

async function scrapeOffer(
  _prev: ScrapeState,
  formData: FormData
): Promise<ScrapeState> {
  "use server";
  const productId = Number(formData.get("product_id"));
  const sourceUrl = String(formData.get("source_url"));
  try {
    const result = await scrapeProductPage(sourceUrl);
    await db.insert(scrapedOffers).values({
      sourceProductId: productId,
      sourceUrl,
      title: result.title,
      price: result.price,
      currency: result.currency,
      inStock: result.inStock,
    });
    revalidatePath(`/products/${productId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Scrape failed" };
  }
}

async function scrapeNewSource(
  _prev: ScrapeState,
  formData: FormData
): Promise<ScrapeState> {
  "use server";
  const productId = Number(formData.get("product_id"));
  const competitorUrl = String(formData.get("competitor_url")).trim();
  if (!competitorUrl) return { error: "URL is required" };
  try {
    const result = await scrapeProductPage(competitorUrl);
    await db.insert(scrapedOffers).values({
      sourceProductId: productId,
      sourceUrl: competitorUrl,
      title: result.title,
      price: result.price,
      currency: result.currency,
      inStock: result.inStock,
    });
    revalidatePath(`/products/${productId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Scrape failed" };
  }
}

async function rescrapeAll(
  _prev: RescrapeState,
  formData: FormData
): Promise<RescrapeState> {
  "use server";
  const productId = Number(formData.get("product_id"));

  // Collect all distinct sourceUrls tracked for this product
  const existing = await db
    .select({ sourceUrl: scrapedOffers.sourceUrl })
    .from(scrapedOffers)
    .where(eq(scrapedOffers.sourceProductId, productId));

  const urls = [...new Set(existing.map((o) => o.sourceUrl).filter(Boolean))] as string[];
  if (urls.length === 0) return { error: "No source URLs to rescrape" };

  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const result = await scrapeProductPage(url);
      await db.insert(scrapedOffers).values({
        sourceProductId: productId,
        sourceUrl: url,
        title: result.title,
        price: result.price,
        currency: result.currency,
        inStock: result.inStock,
      });
    })
  );

  revalidatePath(`/products/${productId}`);
  revalidatePath("/dashboard");

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  if (succeeded === 0) return { error: "All sources failed to scrape" };
  return { refreshed: succeeded };
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

  const trackedSourceUrls = [
    ...new Set(offers.map((o) => o.sourceUrl).filter(Boolean)),
  ] as string[];

  const fmt = (n: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
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
        <div className="flex items-start gap-2">
          {trackedSourceUrls.length > 0 && (
            <RescrapeAllButton
              action={rescrapeAll}
              productId={productId}
              sourceCount={trackedSourceUrls.length}
            />
          )}
          <ScrapeButton
            action={scrapeOffer}
            productId={productId}
            sourceUrl={product.sourceUrl}
          />
        </div>
      </div>

      {/* Price stats */}
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

      {/* Add competitor source */}
      <Card>
        <CardHeader>
          <CardTitle>Add a competitor source</CardTitle>
          <CardDescription>
            Paste a product URL from any other supplier to scrape their price
            and compare against your current source.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddSourceForm action={scrapeNewSource} productId={productId} />
        </CardContent>
      </Card>

      {/* Offers list */}
      <Card>
        <CardHeader>
          <CardTitle>Offers</CardTitle>
          {trackedSourceUrls.length > 0 && (
            <CardDescription>
              Tracking {trackedSourceUrls.length} source
              {trackedSourceUrls.length !== 1 ? "s" : ""}:{" "}
              {trackedSourceUrls.map((u) => getDomain(u)).join(", ")}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <p className="text-sm text-foreground/60">
              No offers yet. Click{" "}
              <span className="font-medium">Scrape now</span> to pull the live
              price from the source URL, or add a competitor URL above.
            </p>
          ) : (
            <ul className="divide-y">
              {offers.map((offer) => (
                <li
                  key={offer.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {offer.title ?? "Untitled offer"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {offer.sourceUrl && (
                        <a
                          href={offer.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-xs text-foreground/40 hover:text-foreground"
                        >
                          {getDomain(offer.sourceUrl)}
                          <ExternalLink size={10} />
                        </a>
                      )}
                      <span className="text-xs text-foreground/30">
                        {offer.createdAt
                          ? new Date(offer.createdAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {priceStats &&
                      offer.inStock &&
                      offer.price === priceStats.min && (
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
