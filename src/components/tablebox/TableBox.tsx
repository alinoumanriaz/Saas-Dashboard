"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import { RxCaretSort } from "react-icons/rx";
import { formatDate } from "../../helpers/date-formate";
import Pagination from "./Pagination";
import TableSkeleton from "./TableSkeleton";

// shadcn imports
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Trash2 } from "lucide-react";

interface IProps {
  column: string[];
  checkbox?: boolean;
  action?: boolean;
  data: any[];
  loading: boolean;
  image?: boolean;
  logo?: boolean;
  iconImageUrl?: boolean;
  bannerImage?: boolean;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  currentPage: number;
  deletehandler?: (id: string[]) => void;
  edithandler?: (userData: any) => void;
  viewhandler?: (data: any) => void;
  status?: boolean;
  MemberStatus?: boolean;
  subscription?: boolean;
  isVerified?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  createdBy?: boolean;
  author?: boolean;
  industry?: boolean;
  material?: boolean;
  style?: boolean;
  isFeatured?: boolean;
  height?: string;
  customRenderers?: Record<string, (value: any, row: any) => React.ReactNode>;
}

const TableBox = ({
  column,
  checkbox = false,
  action = false,
  data,
  loading,
  image = false,
  logo = false,
  iconImageUrl = false,
  bannerImage = false,
  currentPage,
  totalPages,
  setCurrentPage,
  deletehandler,
  edithandler,
  viewhandler,
  status = false,
  MemberStatus = false,
  subscription = false,
  isVerified = false,
  createdAt = false,
  updatedAt = false,
  createdBy = false,
  author = false,
  industry,
  material,
  style,
  isFeatured,
  height,
  customRenderers = {},
}: IProps) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSort = (key: string) => {
    setSortConfig((prev) =>
      prev && prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === undefined || bVal === undefined) return 0;
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortConfig]);

  const toggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === sortedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedData.map((item) => item.id));
    }
  };

  const handleDeleteSelected = () => {
    deletehandler?.(selectedIds);
    setSelectedIds([]);
  };

  const totalColumns =
    column.length +
    (checkbox ? 1 : 0) +
    (image ? 1 : 0) +
    (iconImageUrl ? 1 : 0) +
    (logo ? 1 : 0) +
    (bannerImage ? 1 : 0) +
    (status ? 1 : 0) +
    (isVerified ? 1 : 0) +
    (createdBy ? 1 : 0) +
    (createdAt ? 1 : 0) +
    (updatedAt ? 1 : 0) +
    (action ? 1 : 0) +
    (subscription ? 1 : 0) +
    (isFeatured ? 1 : 0) +
    (MemberStatus ? 1 : 0) +
    (industry ? 1 : 0) +
    (material ? 1 : 0) +
    (style ? 1 : 0);

  if (loading) return <TableSkeleton />;

  return (
    <div className="flex flex-col h-fit bg-background text-foreground">
      {/* Selected Items Bar */}
      {selectedIds.length > 0 && (
        <div className="px-4 py-3 bg-primary/5 border-b border-primary/10 rounded-t-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected
            </span>
            <Button
              onClick={handleDeleteSelected}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden rounded-lg border border-border">
        <div className={`overflow-auto ${height || "max-h-125"} scrollbar-thin`}>
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-background backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                {checkbox && (
                  <TableHead className="sticky left-0 z-30 bg-background backdrop-blur-sm min-w-9">
                    <Checkbox
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === sortedData.length
                      }
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                )}

                {iconImageUrl && <TableHead>Icon</TableHead>}
                {image && <TableHead>Image</TableHead>}
                {logo && <TableHead>Company Logo</TableHead>}
                {bannerImage && <TableHead>Banner</TableHead>}

                {column.map((col, idx) => (
                  <TableHead
                    key={idx}
                    className="cursor-pointer"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center gap-2 capitalize">
                      <span>{col.replace(/([A-Z])/g, " $1").trim()}</span>
                      <RxCaretSort className="size-5" />
                    </div>
                  </TableHead>
                ))}

                {subscription && <TableHead>Subscription</TableHead>}
                {isFeatured && <TableHead>Featured</TableHead>}
                {MemberStatus && <TableHead>Status</TableHead>}

                {industry && (
                  <TableHead
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("industry")}
                  >
                    <div className="flex items-center gap-2">
                      <span>Industry</span>
                      <RxCaretSort className="size-5" />
                    </div>
                  </TableHead>
                )}

                {material && (
                  <TableHead
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("material")}
                  >
                    <div className="flex items-center gap-2">
                      <span>Material</span>
                      <RxCaretSort className="size-5" />
                    </div>
                  </TableHead>
                )}

                {style && (
                  <TableHead
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("style")}
                  >
                    <div className="flex items-center gap-2">
                      <span>Style</span>
                      <RxCaretSort className="size-5" />
                    </div>
                  </TableHead>
                )}

                {status && <TableHead>Status</TableHead>}

                {isVerified && (
                  <TableHead
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("isVerified")}
                  >
                    <div className="flex items-center gap-2">
                      <span>Verified</span>
                      <RxCaretSort className="size-5" />
                    </div>
                  </TableHead>
                )}

                {createdBy && (
                  <TableHead
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("createdBy")}
                  >
                    <div className="flex items-center gap-2">
                      <span>Created By</span>
                      <RxCaretSort className="size-5" />
                    </div>
                  </TableHead>
                )}

                {author && (
                  <TableHead
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("author")}
                  >
                    <div className="flex items-center gap-2">
                      <span>Author</span>
                      <RxCaretSort className="size-5" />
                    </div>
                  </TableHead>
                )}

                {updatedAt && (
                  <TableHead
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("updatedAt")}
                  >
                    <div className="flex items-center gap-2">
                      <span>Updated At</span>
                      <RxCaretSort className="size-5" />
                    </div>
                  </TableHead>
                )}

                {createdAt && (
                  <TableHead
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-2">
                      <span>Created At</span>
                      <RxCaretSort className="size-5" />
                    </div>
                  </TableHead>
                )}

                {action && (
                  <TableHead className="sticky right-0 z-30 bg-background backdrop-blur-sm text-center">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={totalColumns}
                    className="text-center text-muted-foreground py-12"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-12 h-12 text-muted-foreground/30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <span className="font-medium">No data available</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((item, index) => (
                  <TableRow
                    key={`${index}-${item.id || index}`}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {checkbox && (
                      <TableCell className="sticky left-0 z-10 bg-background">
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={() => toggleRow(item.id)}
                        />
                      </TableCell>
                    )}

                    {iconImageUrl && (
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              Array.isArray(item?.iconImageUrl)
                                ? item?.iconImageUrl[0]?.url || "/box-placeholder.jpg"
                                : item?.iconImageUrl?.url || "/box-placeholder.jpg"
                            }
                            alt="icon"
                          />
                          <AvatarFallback>IC</AvatarFallback>
                        </Avatar>
                      </TableCell>
                    )}

                    {image && (
                      <TableCell>
                        <Avatar className="h-10 w-10 ring-2 ring-border">
                          <AvatarImage
                            src={
                              Array.isArray(item?.imageUrl)
                                ? item?.imageUrl[0]?.url || "/box-placeholder.jpg"
                                : item?.imageUrl?.url || "/box-placeholder.jpg"
                            }
                            alt="image"
                          />
                          <AvatarFallback>IMG</AvatarFallback>
                        </Avatar>
                      </TableCell>
                    )}

                    {logo && (
                      <TableCell>
                        <Avatar className="h-10 w-10 ring-2 ring-border">
                          <AvatarImage
                            src={item?.logo || "/box-placeholder.jpg"}
                            alt="logo"
                          />
                          <AvatarFallback>LG</AvatarFallback>
                        </Avatar>
                      </TableCell>
                    )}

                    {bannerImage && (
                      <TableCell>
                        <div className="relative w-24 h-10 rounded-lg overflow-hidden ring-1 ring-border">
                          <Image
                            src={
                              Array.isArray(item?.bannerImage)
                                ? item?.bannerImage[0]?.url || "/box-placeholder.jpg"
                                : item?.bannerImage?.url || "/box-placeholder.jpg"
                            }
                            alt="banner"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                    )}

                    {/* Dynamic columns */}
                    {column.map((col, idx) => {
                      if (customRenderers[col]) {
                        return (
                          <TableCell key={`${idx}-${col}`}>
                            {customRenderers[col](item[col], item)}
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={`${idx}-${col}`}>
                          <div
                            className="max-w-xs truncate"
                            title={String(item[col] ?? "")}
                          >
                            {item[col] !== undefined && item[col] !== null
                              ? String(item[col])
                              : "-"}
                          </div>
                        </TableCell>
                      );
                    })}

                    {isFeatured && (
                      <TableCell>
                        <Badge
                          variant={item.isFeatured ? "default" : "secondary"}
                        >
                          {item.isFeatured ? "Featured" : "Standard"}
                        </Badge>
                      </TableCell>
                    )}

                    {subscription && (
                      <TableCell>
                        <Badge
                          variant={
                            item?.subscription?.isActive ? "default" : "destructive"
                          }
                        >
                          {item?.subscription?.plan || "-"}
                        </Badge>
                      </TableCell>
                    )}

                    {industry && (
                      <TableCell>{item?.industry?.name || "-"}</TableCell>
                    )}

                    {material && (
                      <TableCell>{item?.material?.name || "-"}</TableCell>
                    )}

                    {style && (
                      <TableCell>{item?.style?.name || "-"}</TableCell>
                    )}

                    {MemberStatus && (
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            item.status === "ACTIVE"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : item.status === "INACTIVE"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }
                        >
                          {item.status || "UNKNOWN"}
                        </Badge>
                      </TableCell>
                    )}

                    {status && (
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "published" ? "default" : "secondary"
                          }
                        >
                          {item.status === "published" ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                    )}

                    {isVerified && (
                      <TableCell>
                        <Badge
                          variant={item.isVerified ? "default" : "secondary"}
                        >
                          {item.isVerified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                    )}

                    {createdBy && (
                      <TableCell>{item?.createdBy?.username || "-"}</TableCell>
                    )}

                    {author && (
                      <TableCell>{item?.author?.username || "-"}</TableCell>
                    )}

                    {updatedAt && (
                      <TableCell className="text-muted-foreground">
                        {formatDate(item?.updatedAt)}
                      </TableCell>
                    )}

                    {createdAt && (
                      <TableCell className="text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </TableCell>
                    )}

                    {/* Actions */}
                    {action && (
                      <TableCell className="sticky right-0 z-10 bg-background flex justify-center items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {edithandler && (
                              <DropdownMenuItem onClick={() => edithandler?.(item)}>
                                Edit
                              </DropdownMenuItem>
                            )}
                            {viewhandler && (
                              <DropdownMenuItem onClick={() => viewhandler?.(item)}>
                                View
                              </DropdownMenuItem>
                            )}
                            {deletehandler && (
                              <DropdownMenuItem
                                onClick={() => deletehandler?.([item.id])}
                                className="text-destructive focus:text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default TableBox;