"use client";

import { useEffect, useReducer, useState } from "react";
import {
  Search,
  Building,
  CheckCircle,
  XCircle,
  RefreshCw,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/user-filter-reducer";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import AddIndustry from "@/components/popup/models/AddIndustry.model";
import { DELETE_INDUSTRIES } from "@/graphql/query/industry.query";
import { GET_PAGINATED_INDUSTRIES } from "@/graphql/current-website-queries/industry.query";

// --- shadcn/ui components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { useAppSelector } from "@/redux/hooks";

// --- types ---
interface IIndustry {
  _id: string;
  name: string;
  slug: string;
  iconImageUrl: string | { url: string; alt?: string };
  imageUrl: string | { url: string; alt?: string };
  bannerImage: string | { url: string; alt?: string };
  description: string;
  content: string | any;
  createdAt?: string;
  updatedAt?: string;
}

// --- constants ---
const ITEMS_PER_PAGE = 10;

// Columns that are NOT images or meta-fields – they get custom renderers
const TEXT_COLUMNS = ["name", "slug", "description", "content"];

// Helper to extract URL from image field
const getImageUrl = (field: any): string => {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field.url || "";
};

const Page = () => {
  const companyCurrentWebsite = useAppSelector((state) => state.companyCurrentWebsite.companyWebsite);
  const currentWebsiteId = companyCurrentWebsite?.id;
  console.log({companyCurrentWebsite:companyCurrentWebsite})
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, searchText } = state;
  const [selectedData, setSelectedData] = useState<IIndustry | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  // local state for table row selection (checkboxes)
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch data
  const { data, loading, error, refetch } = useQuery<any>(
    GET_PAGINATED_INDUSTRIES,
    {
      variables: {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
      },
      fetchPolicy: "network-only",
    }
  );


  console.log({Industryerror: error})
  console.log({IndustryData: data})

  const [deleteIndustries] = useMutation<any>(DELETE_INDUSTRIES);

  const allIndustries: IIndustry[] =
    data?.getPaginatedIndustries?.industries || [];
  const totalIndustries = data?.getPaginatedIndustries?.totalIndustries || 0;
  const totalPages = Math.ceil(totalIndustries / ITEMS_PER_PAGE);

  const industriesWithContent = allIndustries.filter((i) => {
    const content = i.content;
    if (typeof content === "string") return content.trim().length > 0;
    if (content && typeof content === "object") return true;
    return false;
  }).length;

  // --- Handlers ---
  const cancelDelete = () => {
    setSelectedIdsForDeletion([]);
    setShowConfirmationModel(false);
  };

  const confirmDelete = async () => {
    if (selectedIdsForDeletion.length === 0) return;
    setIsDeleting(true);
    try {
      const { data } = await deleteIndustries({
        variables: { ids: selectedIdsForDeletion },
      });
      if (data?.deleteIndustries?.success) {
        toast.success(data.deleteIndustries.message);
        setShowConfirmationModel(false);
        setSelectedIdsForDeletion([]);
        setSelectedRowIds([]);
        refetch();
      } else {
        toast.error(
          data?.deleteIndustries?.message || "Failed to delete industries"
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete industries");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = (ids: string[]) => {
    setSelectedIdsForDeletion(ids);
    setShowConfirmationModel(true);
  };

  const editHandler = (cData: IIndustry) => {
    setIsEditMode(true);
    setSelectedData(cData);
    setShowAddModel(true);
  };

  const addHandler = () => {
    setSelectedData(null);
    setIsEditMode(false);
    setShowAddModel(true);
  };

  const cancelAdd = () => {
    setShowAddModel(false);
  };

  // Table selection logic
  const toggleRowSelection = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.length === allIndustries.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(allIndustries.map((i) => i._id));
    }
  };

  // Bulk delete from table selection
  const handleBulkDelete = () => {
    if (selectedRowIds.length > 0) {
      deleteHandler(selectedRowIds);
    }
  };

  // --- Custom cell renderers ---
  const renderCell = (column: string, value: any, row: IIndustry) => {
    switch (column) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            {row.iconImageUrl && (
              <img
                src={getImageUrl(row.iconImageUrl)}
                alt=""
                className="h-8 w-8 rounded object-cover"
              />
            )}
            <span className="font-medium">{value}</span>
          </div>
        );
      case "description":
        return (
          <div className="max-w-[200px] truncate" title={value || ""}>
            {value || "—"}
          </div>
        );
      case "content":
        let display = "";
        if (typeof value === "string") {
          display = value;
        } else if (value && typeof value === "object") {
          display = value.text || value.content || JSON.stringify(value);
        }
        const truncated =
          display.length > 80 ? display.substring(0, 80) + "..." : display;
        return (
          <div className="max-w-[200px] truncate" title={display}>
            {truncated || "—"}
          </div>
        );
      case "createdAt":
      case "updatedAt":
        return value ? new Date(value).toLocaleDateString() : "—";
      default:
        return value?.toString() || "—";
    }
  };

  // --- Loading skeleton ---
  if (loading && allIndustries.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 pt-6">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Error loading industries</h3>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => refetch()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Industry Management
          </h1>
          <p className="text-muted-foreground">
            Total Industries: {totalIndustries}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={addHandler}>
            <Plus className="mr-2 h-4 w-4" />
            Add Industry
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, slug, or description..."
                value={searchText}
                onChange={(e) =>
                  dispatch({ type: "SET_SEARCH", payload: e.target.value })
                }
                className="pl-9"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: "RESET_FILTERS" })}
            >
              Reset Filters
            </Button>
            {selectedRowIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedRowIds.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Industries</p>
              <p className="text-2xl font-bold">{totalIndustries}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">With Content</p>
              <p className="text-2xl font-bold">{industriesWithContent}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={
                      allIndustries.length > 0 &&
                      selectedRowIds.length === allIndustries.length
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </TableHead>
                {[...TEXT_COLUMNS, "createdAt", "updatedAt"].map((col) => (
                  <TableHead key={col} className="capitalize">
                    {col.replace(/([A-Z])/g, " $1").trim()}
                  </TableHead>
                ))}
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allIndustries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={TEXT_COLUMNS.length + 3}
                    className="text-center text-muted-foreground py-8"
                  >
                    No industries found.
                  </TableCell>
                </TableRow>
              ) : (
                allIndustries.map((industry) => (
                  <TableRow key={industry._id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRowIds.includes(industry._id)}
                        onChange={() => toggleRowSelection(industry._id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableCell>
                    {TEXT_COLUMNS.map((col) => (
                      <TableCell key={col}>
                        {renderCell(
                          col,
                          (industry as any)[col],
                          industry
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      {industry.createdAt
                        ? new Date(industry.createdAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {industry.updatedAt
                        ? new Date(industry.updatedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editHandler(industry)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteHandler([industry._id])}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      dispatch({
                        type: "SET_PAGE",
                        payload: Math.max(1, currentPage - 1),
                      })
                    }
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() =>
                          dispatch({ type: "SET_PAGE", payload: page })
                        }
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      dispatch({
                        type: "SET_PAGE",
                        payload: Math.min(totalPages, currentPage + 1),
                      })
                    }
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
        )}
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={showConfirmationModel}
        onOpenChange={setShowConfirmationModel}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Industries</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              {selectedIdsForDeletion.length} industr
              {selectedIdsForDeletion.length === 1 ? "y" : "ies"}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add / Edit dialog */}
      <Dialog open={showAddModel} onOpenChange={setShowAddModel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Industry" : "Add Industry"}
            </DialogTitle>
          </DialogHeader>
          <AddIndustry
            onCancel={cancelAdd}
            isEditMode={isEditMode}
            refetch={refetch}
            selectedData={selectedData}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;