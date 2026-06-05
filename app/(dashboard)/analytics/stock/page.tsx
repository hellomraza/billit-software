import { getLowStockProducts, getDeficitSummary, getProductHealth } from "@/lib/api/analytics";
import { getTenantId } from "@/lib/get-tenant-id";
import { StockInsightsScreen } from "@/features/analytics/stock-insights-screen";

export default async function StockInsightsPage() {
  const tenantId = await getTenantId();

  const [lowStockData, deficitSummary, productHealthData] = await Promise.all([
    getLowStockProducts(tenantId),
    getDeficitSummary(tenantId),
    getProductHealth(tenantId, 30),
  ]);

  return (
    <StockInsightsScreen
      lowStockData={lowStockData}
      deficitSummary={deficitSummary}
      productHealthData={productHealthData}
    />
  );
}
