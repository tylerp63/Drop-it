"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

type RescrapeState = { error?: string; refreshed?: number } | null;

export function RescrapeAllButton({
  action,
  productId,
  sourceCount,
}: {
  action: (prev: RescrapeState, formData: FormData) => Promise<RescrapeState>;
  productId: number;
  sourceCount: number;
}) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="product_id" value={productId} />
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 size={14} className="mr-1.5 animate-spin" />
          ) : (
            <RefreshCw size={14} className="mr-1.5" />
          )}
          {isPending ? "Refreshing…" : `Rescrape all (${sourceCount})`}
        </Button>
      </form>
      {state?.error && (
        <p className="text-xs text-red-500">{state.error}</p>
      )}
      {state?.refreshed !== undefined && (
        <p className="text-xs text-green-600">
          Refreshed {state.refreshed} source{state.refreshed !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
