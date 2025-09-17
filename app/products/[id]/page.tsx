import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: { id: string };
};

export default async function ProductDetailPage(props: PageProps) {
  const { id } = props.params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("source_products")
    .select("id, title, source_url, supplier:suppliers(name)")
    .eq("id", id)
    .single();

  const { data: offers } = await supabase
    .from("scraped_offers")
    .select("id, price, currency, in_stock, created_at, title")
    .eq("source_product_id", id)
    .order("created_at", { ascending: false });

  async function seedDummyOffers() {
    "use server";
    const supa = await createClient();
    const { data: auth } = await supa.auth.getUser();
    if (!auth?.user?.id) return;

    const now = new Date();
    const values = [
      { price: 19.99, currency: "USD", in_stock: true, title: "Offer A" },
      { price: 17.49, currency: "USD", in_stock: true, title: "Offer B" },
      { price: 22.0, currency: "USD", in_stock: false, title: "Offer C" },
    ];
    await supa.from("scraped_offers").insert(
      values.map((v) => ({
        ...v,
        source_product_id: Number(id),
        created_at: now.toISOString(),
      })),
    );

    // No-op: relying on default revalidation behavior
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{product?.title}</h1>
          <div className="text-sm text-foreground/60">
            {product?.supplier?.name}
            {product?.source_url ? (
              <>
                {" • "}
                <a
                  href={product.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Source
                </a>
              </>
            ) : null}
          </div>
        </div>
        <form action={seedDummyOffers}>
          <button type="submit" className="px-3 py-2 text-sm border rounded">Seed dummy offers</button>
        </form>
      </div>

      <div className="border rounded-md divide-y">
        {(offers ?? []).length === 0 ? (
          <div className="p-4 text-sm text-foreground/60">No offers yet.</div>
        ) : (
          ((offers as unknown as { id: number; title?: string | null; created_at: string; currency: string; price: number; in_stock: boolean }[] | null) ?? []).map((o) => (
            <div key={o.id} className="p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <div className="font-medium">{o.title ?? "Untitled offer"}</div>
                <div className="text-xs text-foreground/60">
                  {new Date(o.created_at as unknown as string).toLocaleString()}
                </div>
              </div>
              <div className="text-sm">
                {o.in_stock ? (
                  <span className="mr-3 text-green-600">In stock</span>
                ) : (
                  <span className="mr-3 text-foreground/60">Out of stock</span>
                )}
                <span className="font-medium">
                  {o.currency} {Number(o.price).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

