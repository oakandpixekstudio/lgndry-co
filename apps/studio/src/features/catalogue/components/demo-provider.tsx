"use client";

import type { ReactNode } from "react";
import { CatalogueApiProvider, checkImageFile, type CatalogueApi } from "../api";
import { COLLECTIONS } from "../demo-catalogue";
import { deleteArtwork, nextSku, resetDemoCatalogue, saveArtwork, saveSlot, useCatalogue } from "../store";

/** Sample data held in this browser tab only. Used while the studio has no database connection. */
export function DemoCatalogueProvider({ children }: { children: ReactNode }) {
  const { artworks, slots } = useCatalogue();

  const api: CatalogueApi = {
    mode: "demo",
    canEdit: true,
    artworks,
    slots,
    collections: COLLECTIONS,
    newId: () => `art-${Date.now()}`,
    nextSku: () => nextSku(artworks),
    saveArtwork: async (artwork) => {
      saveArtwork(artwork);
      return { ok: true, data: artwork };
    },
    deleteArtwork: async (id) => {
      deleteArtwork(id);
      return { ok: true, data: null };
    },
    saveSlot: async (slot) => {
      saveSlot(slot);
      return { ok: true, data: slot };
    },
    uploadImage: (file) =>
      new Promise((resolve) => {
        const problem = checkImageFile(file);
        if (problem) return resolve({ ok: false, error: problem });
        const reader = new FileReader();
        reader.onload = () => resolve({ ok: true, data: { assetId: null, url: String(reader.result), name: file.name } });
        reader.onerror = () => resolve({ ok: false, error: `Could not read ${file.name}.` });
        reader.readAsDataURL(file);
      }),
    resetDemo: resetDemoCatalogue,
  };

  return <CatalogueApiProvider value={api}>{children}</CatalogueApiProvider>;
}
