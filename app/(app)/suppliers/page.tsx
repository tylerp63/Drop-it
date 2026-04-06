import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suppliers, accountSuppliers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
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
import { Store, ExternalLink, Check } from "lucide-react";

async function createSupplier(formData: FormData) {
  "use server";
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;
  const name = String(formData.get("name") || "").trim();
  const website = String(formData.get("website") || "").trim() || null;
  if (!name) return;

  await db.insert(suppliers).values({ name, website, createdBy: session.user.id });
  revalidatePath("/suppliers");
  revalidatePath("/dashboard");
}

async function toggleSupplier(formData: FormData) {
  "use server";
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;
  const supplierId = Number(formData.get("supplier_id"));
  const action = String(formData.get("action"));

  if (action === "enable") {
    await db
      .insert(accountSuppliers)
      .values({ userId: session.user.id, supplierId, enabled: true })
      .onConflictDoUpdate({
        target: [accountSuppliers.userId, accountSuppliers.supplierId],
        set: { enabled: true },
      });
  } else {
    await db
      .delete(accountSuppliers)
      .where(
        and(
          eq(accountSuppliers.userId, session.user.id),
          eq(accountSuppliers.supplierId, supplierId)
        )
      );
  }
  revalidatePath("/suppliers");
}

export default async function SuppliersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const supplierList = await db.select().from(suppliers).orderBy(suppliers.name);

  const userAccountSuppliers = session
    ? await db
        .select()
        .from(accountSuppliers)
        .where(eq(accountSuppliers.userId, session.user.id))
    : [];

  const enabledIds = new Set(userAccountSuppliers.map((a) => a.supplierId));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-foreground/60 mt-1">
            Manage your suppliers and enable the ones you want to track.
          </p>
        </div>
        <Badge variant="secondary">{supplierList.length} total</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a supplier</CardTitle>
          <CardDescription>
            Add a new supplier to start tracking their products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSupplier}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Supplier name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. AliExpress"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://aliexpress.com"
                />
              </div>
            </div>
            <Button type="submit" className="mt-4">
              Add supplier
            </Button>
          </form>
        </CardContent>
      </Card>

      {supplierList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Store size={28} className="text-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-medium">No suppliers yet</p>
              <p className="text-sm text-foreground/60">
                Add your first supplier using the form above.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {supplierList.map((supplier) => {
            const isEnabled = enabledIds.has(supplier.id);
            return (
              <Card key={supplier.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{supplier.name}</p>
                      {supplier.website ? (
                        <a
                          href={supplier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground mt-0.5"
                        >
                          {supplier.website.replace(/^https?:\/\//, "")}
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <p className="text-xs text-foreground/40 mt-0.5">
                          No website
                        </p>
                      )}
                    </div>
                    <form action={toggleSupplier}>
                      <input
                        type="hidden"
                        name="supplier_id"
                        value={supplier.id}
                      />
                      <input
                        type="hidden"
                        name="action"
                        value={isEnabled ? "disable" : "enable"}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant={isEnabled ? "default" : "outline"}
                      >
                        {isEnabled && <Check size={13} className="mr-1" />}
                        {isEnabled ? "Enabled" : "Enable"}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
