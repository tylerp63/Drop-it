import { createClient } from "@/lib/supabase/server";
// Using plain anchor to avoid next/link type resolution issues in strict lint

export default async function Page() {
  const supabase = await createClient();

  const {
    data: authData,
  } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: products } = await supabase
    .from("source_products")
    .select(
      "id, title, created_at, supplier:suppliers(name)",
    )
    .order("created_at", { ascending: false });

  async function createProduct(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const { data: auth } = await supabaseServer.auth.getUser();
    const currentUserId = auth?.user?.id;
    const title = String(formData.get("title") || "").trim();
    const sourceUrl = String(formData.get("source_url") || "").trim();
    const supplierIdRaw = formData.get("supplier_id");
    const supplierId = supplierIdRaw ? Number(supplierIdRaw) : null;

    if (!currentUserId || !title || !sourceUrl || !supplierId) {
      return;
    }

    await supabaseServer
      .from("source_products")
      .insert({
        title,
        source_url: sourceUrl,
        supplier_id: supplierId,
        created_by: currentUserId,
      });

    // No-op: relying on default revalidation behavior
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Products</h1>

      <form action={createProduct} className="flex flex-col gap-3 max-w-xl p-4 border rounded-md">
        <h2 className="text-lg font-medium">Add a new product</h2>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Title</span>
          <input
            name="title"
            type="text"
            placeholder="Product title"
            className="border rounded px-3 py-2"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Source URL</span>
          <input
            name="source_url"
            type="url"
            placeholder="https://example.com/product"
            className="border rounded px-3 py-2"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Supplier</span>
          <select name="supplier_id" className="border rounded px-3 py-2" required defaultValue="">
            <option value="" disabled>
              Select a supplier
            </option>
            {suppliers?.map((s: { id: number; name: string }) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 rounded bg-foreground text-background text-sm">
            Create
          </button>
        </div>
      </form>

      <ul className="divide-y border rounded-md">
        {(products as unknown as { id: number; title: string; created_at: string | null; supplier?: { name?: string | null } | null }[] | null)?.map((product) => (
          <li key={product.id} className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <a href={`/products/${product.id}`} className="font-medium hover:underline">
                {product.title}
              </a>
              <span className="text-xs text-foreground/60">
                {product.supplier?.name ? `${product.supplier.name} • ` : ""}
                {product.created_at ? new Date(product.created_at as unknown as string).toLocaleString() : null}
              </span>
            </div>
            <div />
          </li>
        ))}
      </ul>
    </div>
  );
}
