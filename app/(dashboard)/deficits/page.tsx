import { DeficitsScreen } from "@/features/deficits/deficits-screen";
import {
  getDeficitsGroupedByProduct,
  getDeficitsWithStatus,
} from "@/lib/api/deficits";

interface DeficitsPageProps {
  searchParams?: {
    status?: string;
    page?: string;
    limit?: string;
  };
}

export default async function DeficitsPage({
  searchParams,
}: DeficitsPageProps) {
  const status = searchParams?.status === "RESOLVED" ? "RESOLVED" : "PENDING";
  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 20;

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
