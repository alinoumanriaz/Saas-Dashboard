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
import { DataListPage, FilterConfig, StatsCard } from "@/components/DataListPage";
import AddWebsite from "@/components/popup/models/AddWebsite.model";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BiWorld, BiCheckCircle, BiXCircle } from "react-icons/bi";
import { BsDatabase } from "react-icons/bs";
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

const CompanyWebsitesPage = () => {
  const currentMember = useAppSelector((state) => state.currentMember.member);
  const selectedCompanyMember = useAppSelector(
    (state) => state.currentCompanyMember.companyMember
  );
  const companyId = selectedCompanyMember?.companyId?.id;
  const isSuperAdmin = currentMember?.role === PlatformRole.SUPER_ADMIN;

  // Permission: can manage (add/edit/delete) if Owner, Manager, or Super Admin
  const canManage =
    isSuperAdmin ||
    (selectedCompanyMember?.role &&
      ["OWNER", "MANAGER"].includes(selectedCompanyMember.role));

  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, status, searchText } = state;

  // Local filter states (for immediate UI feedback)
  const [localStatus, setLocalStatus] = useState<string>(status || "all");
  const [localSearch, setLocalSearch] = useState<string>(searchText || "");
  const [showFilters, setShowFilters] = useState(false);

  // Selection & modals
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<IWebsite | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // GraphQL query
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
      skip: !companyId && !isSuperAdmin,
    }
  );

  const showTableLoading = (loading && networkStatus === 1) || !companyId || !data;

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
    if (!canManage) {
      toast.error("You don't have permission to add websites");
      return;
    }
    setEditingWebsite(null);
    setShowAddEditDialog(true);
  };

  const handleEdit = (website: IWebsite) => {
    if (!canManage) {
      toast.error("You don't have permission to edit websites");
      return;
    }
    setEditingWebsite(website);
    setShowAddEditDialog(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!canManage) {
      toast.error("You don't have permission to delete websites");
      return;
    }
    setIsDeleting(true);
    try {
      const { data } = await deleteWebsites({
        variables: { ids: selectedIds },
      });
      if (data?.deleteWebsites?.success) {
        toast.success(data.deleteWebsites.message);
        setShowDeleteDialog(false);
        setSelectedIds([]);
        refetch();
      } else {
        toast.error(data?.deleteWebsites?.message || "Failed to delete websites");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete websites");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = (ids: string[]) => {
    if (!canManage) {
      toast.error("You don't have permission to delete websites");
      return;
    }
    setSelectedIds(ids);
    setShowDeleteDialog(true);
  };

  const editHandler = (website: any) => {
    handleEdit(website);
  };

  // ----- Custom renderers for TableBox -----
  const columns = ["website", "domain", "status", "database", "cloudinary"];

  const customRenderers = {
    website: (_: any, row: IWebsite) => (
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
    database: (_: any, row: IWebsite) => {
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
    cloudinary: (_: any, row: IWebsite) => {
      const hasCloudinary = !!row.cloudinary?.folderName;
      return (
        <Badge variant={hasCloudinary ? "default" : "outline"} className="gap-1">
          <BsDatabase size={14} />
          {hasCloudinary ? "Configured" : "None"}
        </Badge>
      );
    },
  };

  // ----- Filter configuration -----
  const filterConfig: FilterConfig[] = [
    {
      key: "search",
      type: "search",
      placeholder: "Search by name or domain...",
      label: "Search",
    },
    {
      key: "status",
      type: "select",
      placeholder: "All Status",
      label: "Status",
      options: Object.values(WebsiteStatus).map((s) => ({ label: s, value: s })),
    },
  ];

  const filterValues = {
    search: localSearch,
    status: localStatus,
  };

  const activeFiltersCount = [status, searchText].filter(Boolean).length;

  // ----- Stats -----
  const stats: StatsCard[] = [
    {
      label: "Total Websites",
      value: totalWebsites,
      icon: <BiWorld />,
    },
    {
      label: "Active",
      value: activeCount,
      icon: <BiCheckCircle />,
    },
    {
      label: "With Cloudinary",
      value: cloudinaryCount,
      icon: <BsDatabase />,
    },
  ];

  // TableBox configuration
  const tableBoxConfig = {
    column: columns,
    checkbox: canManage,
    action: canManage,
    deletehandler: deleteHandler,
    edithandler: editHandler,
    height: "max-h-[calc(100vh-320px)]",
    createdAt: true,
    updatedAt: true,
    customRenderers,
  };

  // If no company selected and not super admin, show a message (DataListPage could also handle this)
  if (!isSuperAdmin && !companyId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <BiWorld className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">No Company Selected</h2>
          <p className="text-muted-foreground">Please select a company to view its websites.</p>
        </div>
      </div>
    );
  }

  return (
    <DataListPage
      title="Website Management"
    //   subtitle={
    //     <span>
    //       {isSuperAdmin ? "All Companies" : currentCompany?.name || "N/A"}
    //       <span className="ml-2 text-muted-foreground">
    //         • {totalWebsites} {totalWebsites === 1 ? "website" : "websites"}
    //       </span>
    //     </span>
    //   }
      stats={stats}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={(key, value) => {
        if (key === "search") setLocalSearch(value || "");
        else if (key === "status") setLocalStatus(value === undefined ? "" : value);
      }}
      onResetFilters={handleResetFilters}
      showFilters={showFilters}
      networkStatus={networkStatus}
      onToggleFilters={() => setShowFilters(!showFilters)}
      activeFiltersCount={activeFiltersCount}
      onRefresh={() => refetch()}
      refreshing={showTableLoading}
      onAdd={handleAdd}
      addLabel="Add Website"
      addDisabled={!canManage}
      data={websites}
      loading={showTableLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      setCurrentPage={(page) => dispatch({ type: "SET_PAGE", payload: page })}
      tableBoxConfig={tableBoxConfig}
      error={error}
      onRetry={() => refetch()}
      canManage={canManage}
    >
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
    </DataListPage>
  );
};

export default CompanyWebsitesPage;