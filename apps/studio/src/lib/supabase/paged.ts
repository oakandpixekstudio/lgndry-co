/**
 * Reads every row of a query, a page at a time.
 *
 * Supabase returns at most 1,000 rows per request however large a `limit` you ask for, and says nothing when it cuts
 * the list short. Anything that counts or lists rows from a query must go through this, or the numbers quietly stop
 * growing at 1,000. The query must have a stable order (an `order(...)` on a unique-ish column) so pages do not overlap.
 *
 * `build(from, to)` returns the query for one page, for example `(from, to) => db.from("t").select("a").order("id").range(from, to)`.
 */
export async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string; code?: string } | null }>,
  { pageSize = 1000, maxPages = 50 }: { pageSize?: number; maxPages?: number } = {},
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    const from = page * pageSize;
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw new Error(error.message || error.code || "database error");
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < pageSize) return rows;
  }
  throw new Error(`There are more than ${maxPages * pageSize} rows. This screen needs a smarter query before it can show them all.`);
}
