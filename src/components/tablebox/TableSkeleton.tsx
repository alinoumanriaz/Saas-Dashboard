// components/ui/table-skeleton.tsx
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  /** Number of columns (headers) to display */
  columns?: number;
  /** Number of rows of skeleton cells */
  rows?: number;
  /** Additional CSS classes */
  className?: string;
  /** Show a card wrapper with border and shadow */
  card?: boolean;
}

const TableSkeleton = ({
  columns = 8,
  rows = 4,
  className,
  card = true,
}: TableSkeletonProps) => {
  const content = (
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, idx) => (
              <TableHead key={idx}>
                <Skeleton className="h-6 w-full max-w-[120px] rounded-md" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <TableCell key={colIdx}>
                  <Skeleton className="h-5 w-full rounded-md" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
  );

  if (card) {
    return (
      <div className="p-1">
        <Card className={cn("w-full overflow-hidden", className)}>
        <CardContent className="p-1">{content}</CardContent>
      </Card>
      </div>
    );
  }

  return <div className={cn("w-full overflow-x-auto", className)}>{content}</div>;
};

export default TableSkeleton;