"use client";
import { useEffect, useReducer, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAppSelector } from "@/redux/hooks";
import { PlatformRole } from "@/enums/common.enums";
import { GET_PAGINATED_CLIENTS, DELETE_CLIENTS } from "@/graphql/query/client.query";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/client-filter-reducer";
import { DataListPage, FilterConfig, StatsCard } from "@/components/DataListPage";
import AddClient from "@/components/popup/models/AddClient.model";
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
import {
  BiUser,
  BiCheckCircle,
  BiXCircle,
  BiEnvelope,
  BiFlag,
  BiMap,
  BiStar,
} from "react-icons/bi";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

// Adjust to match your GraphQL Client type (id comes from BaseModel)
interface IClient {
  id: string;
  fullName: string;
  email: string;
  secondaryEmail?: string | null;
  phone?: string | null;
  mobile?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  company?: string | null;
  designation?: string | null;
  addresses?: Array<{
    type: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    isDefault: boolean;
  }> | null;
  source?: string | null;
  status: string; // 'lead' | 'customer' | 'inactive' | 'blocked'
  priority: string; // 'low' | 'medium' | 'high'
  isVerified: boolean;
  isActive: boolean;
  preferredCurrency?: string | null;
  preferredLanguage?: string | null;
  timezone?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

const ClientsPage = () => {
  const currentMember = useAppSelector((state) => state.currentMember.member);
  const selectedCompanyMember = useAppSelector(
    (state) => state.currentCompanyMember.companyMember
  );
  const companyId = selectedCompanyMember?.companyId?.id;
  const isSuperAdmin = currentMember?.role === PlatformRole.SUPER_ADMIN;

  // Permissions (same idea: Owner, Manager, or Super Admin can manage)
  const canManage =
    isSuperAdmin ||
    (selectedCompanyMember?.role &&
      ["OWNER", "MANAGER"].includes(selectedCompanyMember.role));

  // Filter state (reducer similar to website filter)
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, status, priority, searchText } = state;

  // Local filter UI state
  const [localStatus, setLocalStatus] = useState<string>(status || "all");
  const [localPriority, setLocalPriority] = useState<string>(priority || "all");
  const [localSearch, setLocalSearch] = useState<string>(searchText || "");
  const [showFilters, setShowFilters] = useState(false);

  // Selection & modals
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<IClient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce filter updates (resets page to 1)
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: "SET_STATUS", payload: localStatus === "all" ? undefined : localStatus });
      dispatch({ type: "SET_PRIORITY", payload: localPriority === "all" ? undefined : localPriority });
      dispatch({ type: "SET_SEARCH", payload: localSearch || "" });
      dispatch({ type: "SET_PAGE", payload: 1 });
    }, 400);
    return () => clearTimeout(timer);
  }, [localStatus, localPriority, localSearch, dispatch]);

  // GraphQL query – adjust the name and variables to match your backend
  const { data, loading, error, refetch, networkStatus } = useQuery<any>(
    GET_PAGINATED_CLIENTS,
    {
      variables: {
        page: Number(currentPage) || 1,
        limit: ITEMS_PER_PAGE,
        status: status || null,
        priority: priority || null,
        search: searchText || null,
      },
      fetchPolicy: "network-only",
      skip: !companyId && !isSuperAdmin,
    }
  );

  const showTableLoading = (loading && networkStatus === 1) || !companyId || !data;

  const [deleteClients] = useMutation<any>(DELETE_CLIENTS);

  const clients: IClient[] = data?.getPaginatedClients?.clients || [];
  const totalClients = data?.getPaginatedClients?.totalClientsCount || 0;
  const totalPages = Math.ceil(totalClients / ITEMS_PER_PAGE);

  // Derived stats
  const leadsCount = clients.filter((c) => c.status === "lead").length;
  const customersCount = clients.filter((c) => c.status === "customer").length;
  const verifiedCount = clients.filter((c) => c.isVerified).length;

  // ----- Handlers -----
  const handleResetFilters = () => {
    setLocalStatus("all");
    setLocalPriority("all");
    setLocalSearch("");
    dispatch({ type: "RESET_FILTERS" });
  };

  const handleAdd = () => {
    if (!canManage) {
      toast.error("You don't have permission to add clients");
      return;
    }
    setEditingClient(null);
    setShowAddEditDialog(true);
  };

  const handleEdit = (client: IClient) => {
    if (!canManage) {
      toast.error("You don't have permission to edit clients");
      return;
    }
    setEditingClient(client);
    setShowAddEditDialog(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!canManage) {
      toast.error("You don't have permission to delete clients",);
      return;
    }
    setIsDeleting(true);
    try {
      const { data } = await deleteClients({
        variables: { ids: selectedIds },
      });

      console.log("Delete response:", data);
      if (data?.removeClients?.success) {
        toast.success(data.removeClients.message);
        setShowDeleteDialog(false);
        setSelectedIds([]);
        refetch();
      } else {
        toast.error(data?.removeClients?.message || "Failed to delete clients");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete clients");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = (ids: string[]) => {
    if (!canManage) {
      toast.error("You don't have permission to delete clients");
      return;
    }
    setSelectedIds(ids);
    setShowDeleteDialog(true);
  };

  const editHandler = (client: any) => {
    handleEdit(client);
  };

  // ----- Column definitions & custom renderers -----
  const columns = ["fullName", "email", "status", "priority", "addresses", "isVerified", "isActive"];

  const customRenderers = {
    fullName: (_: any, row: IClient) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-muted">
          <BiUser className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className="font-medium">{row.fullName}</div>
          {row.company && (
            <div className="text-xs text-muted-foreground">{row.company}</div>
          )}
        </div>
      </div>
    ),
    email: (value: string) => (
      <span className="font-mono text-sm flex items-center gap-1">
        <BiEnvelope className="h-3 w-3" /> {value}
      </span>
    ),
    status: (value: string) => {
      let variant: "default" | "destructive" | "outline" | "secondary" = "outline";
      let icon = <BiFlag />;
      switch (value) {
        case "customer":
          variant = "default";
          icon = <BiCheckCircle />;
          break;
        case "lead":
          variant = "secondary";
          icon = <BiStar />;
          break;
        case "inactive":
          variant = "outline";
          icon = <BiXCircle />;
          break;
        case "blocked":
          variant = "destructive";
          icon = <BiXCircle />;
          break;
      }
      return (
        <Badge variant={variant} className="gap-1 capitalize">
          {icon}
          {value}
        </Badge>
      );
    },
    priority: (value: string) => {
      const colors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
        high: "destructive",
        medium: "default",
        low: "secondary",
      };
      return (
        <Badge variant={colors[value] || "outline"} className="capitalize">
          {value}
        </Badge>
      );
    },
    addresses: (_: any, row: IClient) => {
      const count = row.addresses?.length ?? 0;
      return (
        <div className="flex items-center gap-1 text-sm">
          <BiMap className="h-4 w-4" />
          <span>{count} {count === 1 ? "address" : "addresses"}</span>
        </div>
      );
    },
    isVerified: (value: boolean) =>
      value ? (
        <Badge variant="default" className="gap-1">
          <BiCheckCircle size={14} /> Verified
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1">
          <BiXCircle size={14} /> Not Verified
        </Badge>
      ),
    isActive: (value: boolean) =>
      value ? (
        <Badge variant="default" className="gap-1">
          Active
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1">
          Inactive
        </Badge>
      ),
  };

  // ----- Filter configuration -----
  const filterConfig: FilterConfig[] = [
    {
      key: "search",
      type: "search",
      placeholder: "Search by name or email...",
      label: "Search",
    },
    {
      key: "status",
      type: "select",
      placeholder: "All Statuses",
      label: "Status",
      options: [
        { label: "Lead", value: "lead" },
        { label: "Customer", value: "customer" },
        { label: "Inactive", value: "inactive" },
        { label: "Blocked", value: "blocked" },
      ],
    },
    {
      key: "priority",
      type: "select",
      placeholder: "All Priorities",
      label: "Priority",
      options: [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
      ],
    },
  ];

  const filterValues = {
    search: localSearch,
    status: localStatus,
    priority: localPriority,
  };

  const activeFiltersCount = [status, priority, searchText].filter(Boolean).length;

  // ----- Stats -----
  const stats: StatsCard[] = [
    {
      label: "Total Clients",
      value: totalClients,
      icon: <BiUser />,
    },
    {
      label: "Leads",
      value: leadsCount,
      icon: <BiStar />,
    },
    {
      label: "Customers",
      value: customersCount,
      icon: <BiCheckCircle />,
    },
    {
      label: "Verified",
      value: verifiedCount,
      icon: <BiCheckCircle />,
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

  // No company selected fallback
  if (!isSuperAdmin && !companyId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <BiUser className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">No Company Selected</h2>
          <p className="text-muted-foreground">Please select a company to view clients.</p>
        </div>
      </div>
    );
  }

  return (
    <DataListPage
      title="Client Management"
      stats={stats}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={(key, value) => {
        if (key === "search") setLocalSearch(value || "");
        else if (key === "status") setLocalStatus(value === undefined ? "all" : value);
        else if (key === "priority") setLocalPriority(value === undefined ? "all" : value);
      }}
      onResetFilters={handleResetFilters}
      showFilters={showFilters}
      networkStatus={networkStatus}
      onToggleFilters={() => setShowFilters(!showFilters)}
      activeFiltersCount={activeFiltersCount}
      onRefresh={() => refetch()}
      refreshing={showTableLoading}
      onAdd={handleAdd}
      addLabel="Add Client"
      addDisabled={!canManage}
      data={clients}
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
            <DialogTitle>Delete Clients</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length} client(s)?
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

      {/* Add/Edit Client Modal */}
      {showAddEditDialog && (
        <AddClient
          onCancel={() => setShowAddEditDialog(false)}
          selectedData={editingClient}
          isEditMode={!!editingClient}
          refetch={refetch}
          currentMemberId={currentMember?.id}
        />
      )}
    </DataListPage>
  );
};

export default ClientsPage;