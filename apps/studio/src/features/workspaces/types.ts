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

