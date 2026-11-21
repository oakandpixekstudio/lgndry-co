export type PostResult = { ok: true; ref?: string } | { ok: false; message: string };

/** Posts a form to one of this site's own routes and turns every outcome into a sentence a visitor can act on. */
export async function postJson(url: string, body: Record<string, unknown>): Promise<PostResult> {
  try {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; ref?: string; message?: string } | null;
    if (response.ok && data?.ok) return { ok: true, ref: data.ref };
    return { ok: false, message: data?.message ?? "Something went wrong. Please try again." };
  } catch {
    return { ok: false, message: "We could not reach the site. Check your connection and try again." };
  }
}
