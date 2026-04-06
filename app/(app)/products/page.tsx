import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suppliers, sourceProducts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ExternalLink } from "lucide-react";

async function createProduct(formData: FormData) {
  "use server";
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;
  const title = String(formData.get("title") || "").trim();
  const sourceUrl = String(formData.get("source_url") || "").trim();
  const supplierId = Number(formData.get("supplier_id"));
  if (!title || !sourceUrl || !supplierId) return;

  await db.insert(sourceProducts).values({
    title,
    sourceUrl,
    supplierId,
    createdBy: session.user.id,
  });
  revalidatePath("/products");
  revalidatePath("/dashboard");
}

export default async function ProductsPage() {
  const supplierList = await db
    .select()
    .from(suppliers)
    .orderBy(suppliers.name);

  const products = await db
    .select({
      id: sourceProducts.id,
      title: sourceProducts.title,
      sourceUrl: sourceProducts.sourceUrl,
      createdAt: sourceProducts.createdAt,
      supplierName: suppliers.name,
    })
    .from(sourceProducts)
    .leftJoin(suppliers, eq(sourceProducts.supplierId, suppliers.id))
    .orderBy(desc(sourceProducts.createdAt));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-foreground/60 mt-1">
            Track source products from your suppliers.
          </p>
        </div>
        <Badge variant="secondary">{products.length} total</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a product</CardTitle>
          <CardDescription>
            Track a new product from one of your suppliers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {supplierList.length === 0 ? (
            <div className="rounded-md border-2 border-dashed p-6 text-center">
              <p className="text-sm text-foreground/60">
                You need at least one supplier before adding products.{" "}
                <Link
                  href="/suppliers"
                  className="font-medium underline underline-offset-4"
                >
                  Add a supplier →
                </Link>
              </p>
            </div>
          ) : (
            <form action={createProduct}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 grid gap-2">
                  <Label htmlFor="title">Product title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g. Wireless Earbuds Pro"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source_url">Source URL</Label>
                  <Input
                    id="source_url"
                    name="source_url"
                    type="url"
                    placeholder="https://supplier.com/product/123"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supplier_id">Supplier</Label>
                  <select
                    id="supplier_id"
                    name="supplier_id"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select a supplier…</option>
                    {supplierList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" className="mt-4">
                Add product
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Package size={28} className="text-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-medium">No products yet</p>
              <p className="text-sm text-foreground/60">
                Add your first product using the form above.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((product) => (
            <Card
              key={product.id}
              className="transition-colors hover:border-foreground/30"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${product.id}`}
                      className="font-medium hover:underline line-clamp-1 block"
                    >
                      {product.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      {product.supplierName && (
                        <Badge variant="outline" className="text-xs">
                          {product.supplierName}
                        </Badge>
                      )}
                      <span className="text-xs text-foreground/40">
                        {product.createdAt
                          ? new Date(product.createdAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  </div>
                  <a
                    href={product.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-foreground/40 hover:text-foreground"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
