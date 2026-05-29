import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  website: text("website"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  createdBy: text("created_by").references(() => user.id),
});

export const sourceProducts = sqliteTable(
  "source_products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    sourceUrl: text("source_url").notNull(),
    supplierId: integer("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    createdBy: text("created_by").references(() => user.id),
  },
  (t) => [index("source_products_supplier_id_idx").on(t.supplierId)]
);

export const scrapedOffers = sqliteTable(
  "scraped_offers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceProductId: integer("source_product_id")
      .notNull()
      .references(() => sourceProducts.id, { onDelete: "cascade" }),
    sourceUrl: text("source_url"),
    title: text("title"),
    price: real("price").notNull(),
    currency: text("currency").notNull().default("USD"),
    inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("scraped_offers_source_product_id_idx").on(t.sourceProductId)]
);

export const accountSuppliers = sqliteTable(
  "account_suppliers",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    supplierId: integer("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [primaryKey({ columns: [t.userId, t.supplierId] })]
);

export type Supplier = typeof suppliers.$inferSelect;
export type SourceProduct = typeof sourceProducts.$inferSelect;
export type ScrapedOffer = typeof scrapedOffers.$inferSelect;
export type AccountSupplier = typeof accountSuppliers.$inferSelect;
