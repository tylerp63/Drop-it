import * as cheerio from "cheerio";

export interface ScrapeResult {
  price: number;
  currency: string;
  inStock: boolean;
  title: string | null;
}

export async function scrapeProductPage(url: string): Promise<ScrapeResult> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  let price: number | null = null;
  let currency = "USD";
  // null = no structured signal found yet; true/false = definitive answer from structured data
  let stockFromStructuredData: boolean | null = null;
  let title: string | null = null;

  // --- Title ---
  title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
    null;

  // --- JSON-LD structured data (most reliable) ---
  $('script[type="application/ld+json"]').each((_, el) => {
    if (price !== null) return;
    try {
      const raw = JSON.parse($(el).text());
      const nodes: unknown[] = Array.isArray(raw) ? raw : [raw];
      for (const node of nodes) {
        const obj = node as Record<string, unknown>;
        const type = obj["@type"];
        const isProduct =
          type === "Product" ||
          (Array.isArray(type) && (type as string[]).includes("Product"));
        if (!isProduct) continue;

        const offers = obj["offers"] as Record<string, unknown> | undefined;
        if (!offers) continue;

        const rawPrice = offers["price"] ?? offers["lowPrice"];
        if (rawPrice !== undefined) {
          const parsed = parseFloat(String(rawPrice));
          if (!isNaN(parsed)) price = parsed;
        }

        const cur = offers["priceCurrency"];
        if (typeof cur === "string" && cur.length === 3) currency = cur;

        const avail = String(offers["availability"] ?? "").toLowerCase();
        if (avail) {
          stockFromStructuredData =
            !avail.includes("outofstock") && !avail.includes("soldout");
        }
        if (price !== null) break;
      }
    } catch {
      // malformed JSON-LD — skip
    }
  });

  // --- Open Graph / meta tags ---
  if (price === null) {
    const metaPrice =
      $('meta[property="product:price:amount"]').attr("content") ||
      $('meta[property="og:price:amount"]').attr("content");
    if (metaPrice) {
      const parsed = parseFloat(metaPrice);
      if (!isNaN(parsed)) price = parsed;
    }
    const metaCur =
      $('meta[property="product:price:currency"]').attr("content") ||
      $('meta[property="og:price:currency"]').attr("content");
    if (metaCur && metaCur.length === 3) currency = metaCur;
  }

  // --- schema.org itemprop (price + availability) ---
  if (price === null) {
    const el = $('[itemprop="price"]').first();
    const raw = el.attr("content") || el.text();
    if (raw) {
      const parsed = parseFloat(raw.replace(/[^\d.]/g, ""));
      if (!isNaN(parsed)) price = parsed;
    }
  }

  if (stockFromStructuredData === null) {
    const availEl = $('[itemprop="availability"]').first();
    const availHref = availEl.attr("href") || availEl.attr("content") || availEl.text();
    if (availHref) {
      const a = availHref.toLowerCase();
      stockFromStructuredData =
        !a.includes("outofstock") && !a.includes("soldout");
    }
  }

  if (stockFromStructuredData === null) {
    const metaAvail = $('meta[property="product:availability"]').attr("content");
    if (metaAvail) {
      const a = metaAvail.toLowerCase();
      stockFromStructuredData = a === "instock" || a === "in stock";
    }
  }

  // --- CSS heuristic: elements whose class/id contains "price" ---
  if (price === null) {
    const priceEls = $(
      '[class*="price" i],[id*="price" i],[data-price],[data-product-price]'
    );
    priceEls.each((_, el) => {
      if (price !== null) return;
      const raw =
        $(el).attr("data-price") ||
        $(el).attr("data-product-price") ||
        $(el).text();
      const match = raw.match(/(\d{1,6}(?:[.,]\d{2,3})*)/);
      if (match) {
        const parsed = parseFloat(match[1].replace(",", "."));
        if (!isNaN(parsed) && parsed > 0) price = parsed;
      }
    });
  }

  if (price === null) {
    throw new Error(
      "Could not find a price on this page. The site may require JavaScript rendering or block scrapers."
    );
  }

  // --- Stock heuristic: only used when structured data gave no signal ---
  let inStock = stockFromStructuredData ?? true;

  if (stockFromStructuredData === null) {
    // Scope to stock/availability-specific elements only, not the full body.
    // This avoids false negatives from "notify me when out of stock" widgets
    // or unrelated out-of-stock products elsewhere on the page.
    const stockEls = $(
      '[class*="stock" i],[id*="stock" i],[class*="availability" i],[id*="availability" i]'
    );
    stockEls.each((_, el) => {
      const text = $(el).text().toLowerCase();
      if (text.includes("out of stock") || text.includes("sold out")) {
        inStock = false;
      }
    });
  }

  return { price, currency, inStock, title: title?.slice(0, 255) ?? null };
}
