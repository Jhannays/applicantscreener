import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "0", 10);
  const pageSize = 50;

  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from("screened_resumes")
    .select("*", { count: "exact" })
    .order("screened_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    results: data || [],
    total: count || 0,
    page,
    pageSize,
  });
}
