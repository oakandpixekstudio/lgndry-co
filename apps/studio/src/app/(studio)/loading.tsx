import { PageSkeleton } from "@/components/layout/page-skeleton";

/** Shown immediately on every navigation inside the studio while the next page's data is on its way. */
export default function Loading() {
  return <PageSkeleton />;
}
