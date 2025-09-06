import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("source_products")
    .select("id, title");

  return (
    <>
      <h1>Products</h1>
      <ul>
        {products?.map((product) => (
          <li key={product.id}>{product.title}</li>
        ))}
      </ul>
    </>
  );
}
