import { notFound } from "next/navigation";
import { RecordDetailPage } from "@/features/workspaces/components/record-detail-page";
import { getWorkspace } from "@/features/workspaces/workspace-registry";

export default async function FullRecordPage({ params }: { params: Promise<{ entity: string; id: string }> }) {
  const { entity, id } = await params;
  const config = getWorkspace(entity);
  const record = config?.rows.find((item) => item.id === decodeURIComponent(id));
  if (!config || !record) notFound();
  return <RecordDetailPage config={config} initialRecord={record} />;
}
