import { getRevenueSummary } from "@/lib/api/analytics";
import { getTenantId } from "@/lib/get-tenant-id";
import { RevenueOverviewScreen } from "@/features/analytics/revenue-overview-screen";

export default async function RevenueOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const tenantId = await getTenantId();
  const searchParamsResolved = await searchParams;

  const period = searchParamsResolved.period || "last30days";
  const dateFrom = searchParamsResolved.dateFrom;
  const dateTo = searchParamsResolved.dateTo;

  // Fetch revenue summary server-side with query params
  const revenueSummary = await getRevenueSummary(tenantId, period, dateFrom, dateTo);

  return (
    <RevenueOverviewScreen
      revenueSummary={revenueSummary}
      period={period}
      dateFrom={dateFrom}
      dateTo={dateTo}
    />
  );
}
