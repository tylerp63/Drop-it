"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";

type AddSourceState = { error?: string; success?: boolean } | null;

export function AddSourceForm({
  action,
  productId,
}: {
  action: (prev: AddSourceState, formData: FormData) => Promise<AddSourceState>;
  productId: number;
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="product_id" value={productId} />
      <div className="flex gap-2">
        <Input
          name="competitor_url"
          type="url"
          placeholder="https://other-supplier.com/product/..."
          required
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          <span className="ml-1.5">{isPending ? "Scraping…" : "Add & scrape"}</span>
        </Button>
      </div>
      {state?.error && (
        <p className="text-xs text-red-500">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-xs text-green-600">Offer added!</p>
      )}
    </form>
  );
}
