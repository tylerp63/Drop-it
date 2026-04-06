import type { Supplier, SourceProduct } from "@/lib/db/schema";

export type SourceProductWithSupplier = SourceProduct & {
  supplier: Pick<Supplier, "name"> | null;
};
