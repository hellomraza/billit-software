import { getRevenueSummary } from "@/lib/api/analytics";
import { getTenantId } from "@/lib/get-tenant-id";
import { RevenueOverviewScreen } from "@/features/analytics/revenue-overview-screen";

export default async function RevenueOverviewPage() {
  const tenantId = await getTenantId();

  // Fetch initial default last30days revenue summary server-side
  const revenueSummary = await getRevenueSummary(tenantId, "last30days");

  return <RevenueOverviewScreen revenueSummary={revenueSummary} />;
}
