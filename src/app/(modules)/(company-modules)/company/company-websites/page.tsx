// src/app/admin/all-websites/page.tsx
"use client";

import { useEffect, useReducer, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAppSelector } from "@/redux/hooks";
import { PlatformRole, WebsiteStatus } from "@/enums/common.enums";
import { GET_PAGINATED_WEBSITES, DELETE_WEBSITES } from "@/graphql/query/website.query";
import {
    filterReducer,
    initialFilterState,
} from "@/useReducerHooks/website-filter-reducer";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FilterX, ListFilter, RefreshCw } from "lucide-react";
// Icons
import {
    BiSearch,
    BiWorld,
    BiCheckCircle,
    BiXCircle,
    BiBuilding,
} from "react-icons/bi";
import { BsDatabase } from "react-icons/bs";

// Custom modals
import AddWebsite from "@/components/popup/models/AddWebsite.model";
import TableBox from "@/components/tablebox/TableBox";
import Container from "@/components/Container";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

interface IWebsite {
    id: string;
    companyId: string;
    name: string;
    domain: string;
    status: WebsiteStatus;
    database: {
        name: string;
        type: string;
        host: string;
        port: number;
        username: string;
    };
    cloudinary?: {
        folderName?: string;
        cloudinaryName?: string;
        cloudinaryNameApiKey?: string;
        cloudinaryNameApiKeySecret?: string;
    };
    createdAt: string;
    updatedAt: string;
}

const AllWebsitesPage = () => {
    const currentMember = useAppSelector((state) => state.currentMember.member);
    const selectedCompanyMember = useAppSelector(
        (state) => state.currentCompanyMember.companyMember
    );
    const companyId = selectedCompanyMember?.companyId?.id;
    const currentCompany = selectedCompanyMember?.company;
    const isSuperAdmin = currentMember?.role === PlatformRole.SUPER_ADMIN;

    const [state, dispatch] = useReducer(filterReducer, initialFilterState);
    const { currentPage, status, searchText } = state;

    // Local filter state (for immediate UI feedback)
    const [localStatus, setLocalStatus] = useState<string>(status || "all");
    const [localSearch, setLocalSearch] = useState<string>(searchText || "");

    // Debounced filter updates (with page reset)
    useEffect(() => {
        const timer = setTimeout(() => {
            const statusVal = localStatus === "all" ? undefined : localStatus;
            dispatch({ type: "SET_STATUS", payload: statusVal });
            dispatch({ type: "SET_SEARCH", payload: localSearch || "" });
            dispatch({ type: "SET_PAGE", payload: 1 });
        }, 400);
        return () => clearTimeout(timer);
    }, [localStatus, localSearch, dispatch]);

    // Show/hide filters
    const [showFilters, setShowFilters] = useState(false);

    // Selection & modals
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showAddEditDialog, setShowAddEditDialog] = useState(false);
    const [editingWebsite, setEditingWebsite] = useState<IWebsite | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Query
    const { data, loading, error, refetch, networkStatus } = useQuery<any>(
        GET_PAGINATED_WEBSITES,
        {
            variables: {
                page: Number(currentPage) || 1,
                limit: ITEMS_PER_PAGE,
                status: status || null,
                search: searchText || null,
                companyId: companyId,
            },
            fetchPolicy: "network-only",
            skip: !companyId,
        }
    );

    const showTableLoading = loading && networkStatus === 1;

    const [deleteWebsites] = useMutation<any>(DELETE_WEBSITES);

    const websites: IWebsite[] = data?.getPaginatedWebsites?.websites || [];
    const totalWebsites = data?.getPaginatedWebsites?.totalWebsitesCount || 0;
    const totalPages = Math.ceil(totalWebsites / ITEMS_PER_PAGE);

    // Derived stats
    const activeCount = websites.filter((w) => w.status === WebsiteStatus.ACTIVE).length;
    const cloudinaryCount = websites.filter((w) => w.cloudinary).length;

    // ----- Handlers -----
    const handleResetFilters = () => {
        setLocalStatus("all");
        setLocalSearch("");
        dispatch({ type: "RESET_FILTERS" });
    };

    const handleAdd = () => {
        setEditingWebsite(null);
        setShowAddEditDialog(true);
    };

    const handleEdit = (website: IWebsite) => {
        setEditingWebsite(website);
        setShowAddEditDialog(true);
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        setIsDeleting(true);
        try {
            const { data } = await deleteWebsites({
                variables: { ids: selectedIds },
            });
            if (data?.deleteWebsites?.success) {
                toast.success(data.deleteWebsites.message, { position: "top-center" });
                setShowDeleteDialog(false);
                setSelectedIds([]);
                refetch();
            } else {
                toast.error(data?.deleteWebsites?.message || "Failed to delete websites", { position: "top-center" });
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to delete websites", { position: "top-center" });
        } finally {
            setIsDeleting(false);
        }
    };

    const deleteHandler = (ids: string[]) => {
        setSelectedIds(ids);
        setShowDeleteDialog(true);
    };

    const editHandler = (website: any) => {
        handleEdit(website);
    };

    // ----- TableBox columns and custom renderers -----
    const columns = ["website", "domain", "status", "database", "cloudinary"];

    const customRenderers = {
        website: (value: any, row: IWebsite) => (
            <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <BiWorld className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">ID: {row.id.slice(0, 8)}</div>
                </div>
            </div>
        ),
        domain: (value: string) => (
            <span className="font-mono text-sm">{value}</span>
        ),
        status: (value: WebsiteStatus) => {
            const isActive = value === WebsiteStatus.ACTIVE;
            return (
                <Badge variant={isActive ? "default" : "destructive"} className="gap-1">
                    {isActive ? <BiCheckCircle size={14} /> : <BiXCircle size={14} />}
                    {isActive ? "Active" : "Inactive"}
                </Badge>
            );
        },
        database: (value: any, row: IWebsite) => {
            const db = row.database;
            return (
                <div className="text-sm">
                    <div className="font-medium">{db.name}</div>
                    <div className="text-xs text-muted-foreground">
                        {db.type} • {db.host}:{db.port}
                    </div>
                </div>
            );
        },
        cloudinary: (value: any, row: IWebsite) => {
            const hasCloudinary = !!row.cloudinary?.folderName;
            return (
                <Badge variant={hasCloudinary ? "default" : "outline"} className="gap-1">
                    <BsDatabase size={14} />
                    {hasCloudinary ? "Configured" : "None"}
                </Badge>
            );
        },
    };

    // Count active filters (for badge)
    const activeFiltersCount = [status, searchText].filter(Boolean).length;

    // Permission: can manage (delete/edit) – only super admin or company admins? We'll allow if user has permission.
    // For now, we assume if they can see the page, they can manage (adjust as needed)
    const canManage = true; // or based on role

    // If no company selected and not super admin, show message
    if (!isSuperAdmin && !companyId) {
        return (
            <Container className="overflow-y-auto h-full">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="text-center">No Company Selected</CardTitle>
                            <CardDescription className="text-center">
                                Please select a company to view its websites.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <BiBuilding className="h-16 w-16 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </div>
            </Container>
        );
    }

    return (
        <Container className="overflow-y-auto h-full">
            <div className="w-full h-full text-[13px]">
                <div className="w-full h-full overflow-hidden px-4">
                    {/* Header Section */}
                    <div className="flex justify-between items-center pb-6">
                        <CardHeader className="w-full p-0">
                            <CardTitle className="text-xl">Website Management</CardTitle>
                            <CardDescription>
                                <span>
                                    {isSuperAdmin ? "All Companies" : currentCompany?.name || "N/A"}
                                </span>
                                <span className="ml-2 text-muted-foreground">
                                    • {totalWebsites} {totalWebsites === 1 ? "website" : "websites"}
                                </span>
                            </CardDescription>
                        </CardHeader>

                        <div className="flex items-center space-x-3">
                            {/* Filter Toggle */}
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className="gap-2"
                            >
                                <ListFilter className="size-4" />
                                {activeFiltersCount > 0 && (
                                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => refetch()}
                                disabled={loading}
                                className="gap-1"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="size-4 animate-spin" />
                                        <span>Refreshing...</span>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="size-4" />
                                        <span>Refresh</span>
                                    </>
                                )}
                            </Button>

                            <Button onClick={handleAdd}>
                                Add Website
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <Card className="animate-in bg-background slide-in-from-top-2 duration-200 ring-0">
                            <div className="w-full">
                                <div className="w-full flex justify-start items-center gap-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Search</label>
                                        <div className="relative">
                                            <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name or domain..."
                                                className="pl-9"
                                                value={localSearch}
                                                onChange={(e) => setLocalSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 w-40">
                                        <label className="text-sm font-medium">Status</label>
                                        <Select
                                            value={localStatus}
                                            onValueChange={(val) => setLocalStatus(val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="All Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value={WebsiteStatus.ACTIVE}>Active</SelectItem>
                                                <SelectItem value={WebsiteStatus.INACTIVE}>Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Active Filters Display */}
                    {activeFiltersCount > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2 items-center px-3">
                            <span className="text-sm text-gray-600 font-medium">Active Filters:</span>
                            {searchText && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-800">
                                    Search: {searchText}
                                    <button
                                        onClick={() => {
                                            setLocalSearch("");
                                            dispatch({ type: "SET_SEARCH", payload: "" });
                                            dispatch({ type: "SET_PAGE", payload: 1 });
                                        }}
                                        className="ml-2 hover:text-purple-600 font-bold"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                            {status && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                                    Status: {status}
                                    <button
                                        onClick={() => {
                                            setLocalStatus("all");
                                            dispatch({ type: "SET_STATUS", payload: undefined });
                                            dispatch({ type: "SET_PAGE", payload: 1 });
                                        }}
                                        className="ml-2 hover:text-green-600 font-bold"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                                className="text-red-600 ml-auto hover:text-red-700"
                            >
                                <FilterX className="size-4 mr-1" />
                                Reset All Filters
                            </Button>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Websites</CardTitle>
                                <BiWorld className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalWebsites}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active</CardTitle>
                                <BiCheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{activeCount}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">With Cloudinary</CardTitle>
                                <BsDatabase className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{cloudinaryCount}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table */}
                    {error ? (
                        <div className="p-4 text-red-500 bg-red-50 rounded-lg">
                            <div className="font-semibold">Error loading websites</div>
                            <div className="text-sm mt-1">{error.message}</div>
                            <Button
                                variant="destructive"
                                onClick={() => refetch()}
                                className="mt-3"
                            >
                                Retry
                            </Button>
                        </div>
                    ) : (
                        <TableBox
                            column={columns}
                            checkbox={canManage}
                            action={canManage}
                            loading={showTableLoading}
                            data={websites}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            setCurrentPage={(page) =>
                                dispatch({ type: "SET_PAGE", payload: page })
                            }
                            deletehandler={deleteHandler}
                            edithandler={editHandler}
                            height="max-h-[calc(100vh-420px)]"
                            createdAt={true}
                            updatedAt={true}
                            customRenderers={customRenderers}
                        />
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Websites</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedIds.length} website(s)?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Website Modal */}
            {showAddEditDialog && (
                <AddWebsite
                    onCancel={() => setShowAddEditDialog(false)}
                    selectedData={editingWebsite}
                    isEditMode={!!editingWebsite}
                    refetch={refetch}
                    currentMemberId={currentMember?.id}
                />
            )}
        </Container>
    );
};

export default AllWebsitesPage;