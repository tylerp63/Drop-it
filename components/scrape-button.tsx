"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Loader2 } from "lucide-react";

type ScrapeState = { error?: string; success?: boolean } | null;

export function ScrapeButton({
  action,
  productId,
  sourceUrl,
}: {
  action: (prev: ScrapeState, formData: FormData) => Promise<ScrapeState>;
  productId: number;
  sourceUrl: string;
}) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="product_id" value={productId} />
        <input type="hidden" name="source_url" value={sourceUrl} />
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 size={14} className="mr-1.5 animate-spin" />
          ) : (
            <Globe size={14} className="mr-1.5" />
          )}
          {isPending ? "Scraping…" : "Scrape now"}
        </Button>
      </form>
      {state?.error && (
        <p className="text-xs text-red-500 max-w-[240px] text-right">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-xs text-green-600">Offer saved!</p>
      )}
    </div>
  );
}
