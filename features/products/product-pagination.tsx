import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
const ProductPagination = ({
  onFirstPage,
  onPreviousPage,
  onNextPage,
  onLastPage,
  pageIndex,
  pageCount,
}: {
  onFirstPage: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLastPage: () => void;
  pageIndex: number;
  pageCount: number;
}) => {
  return (
    <div className="flex gap-2 items-center justify-end mt-4">
      <Button variant="secondary" size="icon" onClick={onFirstPage}>
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button variant="secondary" size="icon" onClick={onPreviousPage}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="mx-2 text-sm font-medium">
        {pageIndex + 1} / {pageCount}
      </div>
      <Button variant="secondary" size="icon" onClick={onNextPage}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="secondary" size="icon" onClick={onLastPage}>
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ProductPagination;
