import type { IconName } from "@/components/icons";

export type WorkspaceTone = "neutral" | "success" | "warning" | "info" | "danger";

export interface WorkspaceMetric {
  label: string;
  value: string;
  change: string;
  tone?: WorkspaceTone;
  icon: IconName;
}

export interface WorkspaceColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
}

export interface WorkspaceFact {
  label: string;
  value: string;
}

export interface WorkspaceDetail {
  eyebrow?: string;
  description?: string;
  metrics: Array<{ label: string; value: string; tone?: WorkspaceTone }>;
  facts: WorkspaceFact[];
  secondaryTitle?: string;
  secondaryFacts?: WorkspaceFact[];
  tags?: string[];
  progress?: { current: number; steps: string[] };
  editionRun?: { total: number; sold: number; reserved?: number };
  callout?: { title: string; text: string; tone?: WorkspaceTone };
}

export interface WorkspaceRow {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  images?: Array<{ id: string; name: string; url: string; role: "main" | "supporting" }>;
  bucket: string;
  status: string;
  tone?: WorkspaceTone;
  cells: Record<string, string>;
  detail: WorkspaceDetail;
}

export interface WorkspaceConfig {
  entity: string;
  eyebrow: string;
  title: string;
  editorial: string;
  subtitle: string;
  intelligenceLabel: string;
  metrics: WorkspaceMetric[];
  tabs: Array<{ label: string; bucket: string; count: number }>;
  primaryAction: string;
  searchPlaceholder: string;
  filters: string[];
  columns: WorkspaceColumn[];
  rows: WorkspaceRow[];
  detailTabs: string[];
  detailActions: string[];
}


/**
 * Connects the designed workspace screen to the real database. Without it the screen is the sample (demo) screen,
 * exactly as before. With it, edits are saved for real, nothing is invented, and actions that do not exist yet say so.
 */
export interface LiveBinding {
  /** The fields of the add and edit window for this kind of record. */
  fields: (mode: "create" | "edit") => Array<{ key: string; label: string; type?: "text" | "email" | "date" | "textarea" | "select"; placeholder?: string; options?: string[] }>;
  /** The values to show in the edit window for an existing record. */
  toValues: (row: WorkspaceRow) => Record<string, string>;
  /** Missing = records of this kind cannot be added by hand; `createNote` says why. */
  create?: (values: Record<string, string>) => Promise<{ row: WorkspaceRow } | { error: string }>;
  createNote: string;
  /** Missing = records cannot be edited. */
  update?: (row: WorkspaceRow, values: Record<string, string>) => Promise<{ row: WorkspaceRow } | { error: string }>;
  /** Records are never deleted: this archives or cancels. Missing = no removal. */
  remove?: { menuLabel: string; confirmLabel: string; index: string; title: string; note: string; keep: string; button: string; run: (row: WorkspaceRow) => Promise<string | null> };
  /** What the detail action buttons do. A string is shown as a message; a function runs. Anything missing says "not available yet". */
  actions: Record<string, string | ((row: WorkspaceRow) => string | void)>;
}
