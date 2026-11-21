"use client";

import { createContext, useContext } from "react";
import type { CatalogueArtwork, CatalogueCollection, MediaSlot } from "./types";

/**
 * The one interface every catalogue screen talks to. Two implementations sit behind it:
 *   demo: session-only sample data (no database)
 *   live: Supabase, with row-level security and private/public storage
 * The screens never know which one they have, except for the banner text and `mode`.
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export interface UploadedImage {
  /** The private master. Null in demo mode. */
  assetId: string | null;
  /** What the screen shows: a public web-sized copy (live) or the picked file (demo). */
  url: string;
  name: string;
}

export interface CatalogueApi {
  mode: "demo" | "live";
  /** Owners and studio managers can change the catalogue; other staff can look. */
  canEdit: boolean;
  artworks: CatalogueArtwork[];
  slots: MediaSlot[];
  collections: CatalogueCollection[];
  newId: () => string;
  nextSku: () => string;
  saveArtwork: (artwork: CatalogueArtwork) => Promise<ApiResult<CatalogueArtwork>>;
  deleteArtwork: (id: string) => Promise<ApiResult<null>>;
  saveSlot: (slot: MediaSlot) => Promise<ApiResult<MediaSlot>>;
  uploadImage: (file: File) => Promise<ApiResult<UploadedImage>>;
  /** Demo only. */
  resetDemo?: () => void;
}

const CatalogueApiContext = createContext<CatalogueApi | null>(null);
export const CatalogueApiProvider = CatalogueApiContext.Provider;

export function useCatalogueApi(): CatalogueApi {
  const api = useContext(CatalogueApiContext);
  if (!api) throw new Error("useCatalogueApi must be used inside a catalogue provider");
  return api;
}

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/tiff"];
/** Per file. Keeps processing inside a serverless time and memory budget; raise it once a worker handles large masters. */
export const MAX_IMAGE_BYTES = 30 * 1024 * 1024;

export function checkImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return `${file.name}: use a JPEG, PNG, WebP or TIFF image.`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name} is larger than ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB.`;
  return null;
}
