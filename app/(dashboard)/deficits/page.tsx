import { DeficitsScreen } from "@/features/deficits/deficits-screen";
import {
  getDeficitsGroupedByProduct,
  getDeficitsWithStatus,
} from "@/lib/api/deficits";

interface DeficitsPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function DeficitsPage({
  searchParams,
}: DeficitsPageProps) {
  const searchParamsResolved = await searchParams;
  const status =
    searchParamsResolved?.status === "RESOLVED" ? "RESOLVED" : "PENDING";
  const page = Number(searchParamsResolved?.page) || 1;
  const limit = Number(searchParamsResolved?.limit) || 20;

  const [groupedDeficits, detailedDeficits] = await Promise.all([
    getDeficitsGroupedByProduct(),
    getDeficitsWithStatus({ status, page, limit }),
  ]);

  return (
    <DeficitsScreen
      groupedDeficits={groupedDeficits}
      detailedDeficits={detailedDeficits}
    />
  );
}
