import { createClient } from "@/lib/supabase/server";

export default async function SuppliersPage() {
  const supabase = await createClient();

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, website")
    .order("name", { ascending: true });

  const { data: enabledRows } = await supabase
    .from("account_suppliers")
    .select("supplier_id")
    .eq("user_id", userId ?? "");

  const enabledSet = new Set<number>(
    (enabledRows ?? []).map((r: { supplier_id: number }) => r.supplier_id),
  );

  async function toggleSupplier(formData: FormData) {
    "use server";
    const supa = await createClient();
    const { data: auth } = await supa.auth.getUser();
    const currentUserId = auth?.user?.id;
    if (!currentUserId) return;

    const supplierIdRaw = formData.get("supplier_id");
    const nextEnabled = String(formData.get("next_enabled")) === "true";
    const supplierId = supplierIdRaw ? Number(supplierIdRaw) : undefined;
    if (!supplierId) return;

    if (nextEnabled) {
      await supa.from("account_suppliers").upsert(
        {
          user_id: currentUserId,
          supplier_id: supplierId,
          enabled: true,
        },
        { onConflict: "user_id,supplier_id" },
      );
    } else {
      // Disable by deleting mapping (or you could update enabled=false)
      await supa
        .from("account_suppliers")
        .delete()
        .match({ user_id: currentUserId, supplier_id: supplierId });
    }

    // No-op: relying on default revalidation behavior
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Suppliers</h1>
      <div className="border rounded-md divide-y">
        {(suppliers as unknown as { id: number; name: string; website?: string | null }[] | null ?? []).map((s) => {
          const isEnabled = enabledSet.has(s.id);
          return (
            <div key={s.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <div className="font-medium">{s.name}</div>
                {s.website ? (
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-foreground/60 hover:underline"
                  >
                    {s.website}
                  </a>
                ) : null}
              </div>
              <form action={toggleSupplier} className="flex items-center gap-2">
                <input type="hidden" name="supplier_id" value={s.id} />
                <input type="hidden" name="next_enabled" value={(!isEnabled).toString()} />
                <button
                  type="submit"
                  className={`px-3 py-1.5 rounded text-sm border ${
                    isEnabled
                      ? "bg-green-600 text-white border-green-700"
                      : "bg-transparent text-foreground"
                  }`}
                >
                  {isEnabled ? "Enabled" : "Enable"}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}

