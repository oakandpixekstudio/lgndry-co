"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { CatalogueApiProvider, checkImageFile, type ApiResult, type CatalogueApi } from "../api";
import { fetchCatalogue, friendlyError, toPayload, type CatalogueData } from "../db";
import type { CatalogueArtwork, MediaSlot } from "../types";

const notConnected = { ok: false as const, error: "The studio is not connected to the database." };

/** The real catalogue: Supabase as the signed-in person, so row-level security decides what they can change. */
export function LiveCatalogueProvider({
  initial,
  workspaceId,
  canEdit,
  children,
}: {
  initial: CatalogueData;
  workspaceId: string;
  canEdit: boolean;
  children: ReactNode;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [data, setData] = useState<CatalogueData>(initial);

  const nextSku = useCallback(() => {
    const highest = data.artworks.reduce((max, item) => Math.max(max, Number(item.sku.replace(/\D/g, "")) || 0), 0);
    return `LGN-${String(highest + 1).padStart(4, "0")}`;
  }, [data.artworks]);

  const saveArtwork = useCallback(
    async (artwork: CatalogueArtwork): Promise<ApiResult<CatalogueArtwork>> => {
      if (!supabase) return notConnected;
      const { data: id, error } = await supabase.rpc("save_artwork", { p_workspace: workspaceId, p: toPayload(artwork) });
      if (error) return { ok: false, error: friendlyError(error) };
      try {
        // Re-read what the database actually stored, so the screen shows the truth (including web-copy addresses).
        const fresh = await fetchCatalogue(supabase, workspaceId, [String(id)]);
        const saved = fresh.artworks[0];
        if (!saved) return { ok: false, error: "Saved, but the work could not be read back. Reload the page." };
        setData((current) => ({
          ...current,
          artworks: current.artworks.some((item) => item.id === saved.id)
            ? current.artworks.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...current.artworks],
        }));
        return { ok: true, data: saved };
      } catch (problem) {
        return { ok: false, error: problem instanceof Error ? problem.message : "Saved, but could not reload the work." };
      }
    },
    [supabase, workspaceId],
  );

  const deleteArtwork = useCallback(
    async (id: string): Promise<ApiResult<null>> => {
      if (!supabase) return notConnected;
      const { error } = await supabase.rpc("delete_draft_artwork", { p_id: id });
      if (error) return { ok: false, error: friendlyError(error) };
      setData((current) => ({ ...current, artworks: current.artworks.filter((item) => item.id !== id) }));
      return { ok: true, data: null };
    },
    [supabase],
  );

  const saveSlot = useCallback(
    async (slot: MediaSlot): Promise<ApiResult<MediaSlot>> => {
      if (!supabase) return notConnected;
      const { error } = await supabase.from("media_slots").upsert(
        {
          workspace_id: workspaceId, slot_key: slot.key, asset_id: slot.assetId,
          alt_text: slot.assetId ? slot.altText : null, focal_x: slot.focalX, focal_y: slot.focalY,
        },
        { onConflict: "workspace_id,slot_key" },
      );
      if (error) return { ok: false, error: friendlyError(error) };
      setData((current) => ({ ...current, slots: current.slots.map((item) => (item.key === slot.key ? slot : item)) }));
      return { ok: true, data: slot };
    },
    [supabase, workspaceId],
  );

  const uploadImage = useCallback(
    async (file: File): Promise<ApiResult<{ assetId: string | null; url: string; name: string }>> => {
      if (!supabase) return notConnected;
      const problem = checkImageFile(file);
      if (problem) return { ok: false, error: problem };

      // 1. The original goes straight to the PRIVATE bucket, filed under this workspace.
      const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
      const key = `${workspaceId}/uploads/${crypto.randomUUID()}.${extension}`;
      const upload = await supabase.storage.from("artwork-masters").upload(key, file, { contentType: file.type, upsert: false });
      if (upload.error) return { ok: false, error: friendlyError({ message: upload.error.message }) };

      // 2. The server checks who you are, then makes the public web-sized copies from the private original.
      try {
        const response = await fetch("/api/assets/derive", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ key, name: file.name }),
        });
        const body = (await response.json().catch(() => null)) as { error?: string; assetId?: string; url?: string } | null;
        if (!response.ok || !body?.assetId || !body.url) throw new Error(body?.error ?? "The image could not be processed.");
        return { ok: true, data: { assetId: body.assetId, url: body.url, name: file.name } };
      } catch (problemWithCopies) {
        await supabase.storage.from("artwork-masters").remove([key]); // do not leave an orphaned original behind
        return { ok: false, error: problemWithCopies instanceof Error ? problemWithCopies.message : "The image could not be processed." };
      }
    },
    [supabase, workspaceId],
  );

  const api: CatalogueApi = {
    mode: "live",
    canEdit,
    artworks: data.artworks,
    slots: data.slots,
    collections: data.collections,
    newId: () => crypto.randomUUID(),
    nextSku,
    saveArtwork,
    deleteArtwork,
    saveSlot,
    uploadImage,
  };

  return <CatalogueApiProvider value={api}>{children}</CatalogueApiProvider>;
}
