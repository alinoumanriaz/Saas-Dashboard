import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

interface Props {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

const PaginationComponent = ({
  currentPage,
  totalPages,
  setCurrentPage,
}: Props) => {
  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Generate page numbers with ellipsis logic
  const renderPageNumbers = () => {
    const items: React.ReactNode[] = [];
    const total = totalPages;

    for (let i = 1; i <= total; i++) {
      const isActive = i === currentPage;

      // Always show first, last, and pages around current
      if (
        total <= 7 ||
        i === 1 ||
        i === total ||
        Math.abs(currentPage - i) <= 1
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={isActive}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (
        (i === currentPage - 2 || i === currentPage + 2) &&
        !items.some(
          (item) =>
            React.isValidElement(item) && item.key === `ellipsis-${i}`
        )
      ) {
        items.push(
          <PaginationItem key={`ellipsis-${i}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    return items;
  };

  return (
    <div className="flex items-center justify-between mt-2 px-4 py-1 sm:px-6">
      {/* Mobile view: simple previous/next buttons */}
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>

      {/* Desktop view: full pagination with shadcn components */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          {/* Optional: You can add "Showing X-Y of Z" here if needed */}
        </div>
        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={handlePrevious}
                  aria-disabled={currentPage === 1}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {renderPageNumbers()}

              <PaginationItem>
                <PaginationNext
                  onClick={handleNext}
                  aria-disabled={currentPage === totalPages}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default PaginationComponent;