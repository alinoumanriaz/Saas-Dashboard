"use client";
import { useEffect, useReducer, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  DELETE_TICKETS,
  GET_PAGINATED_TICKETS,
} from "@/graphql/query/ticket.query";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/user-filter-reducer";
import { useAppSelector } from "@/redux/hooks";
import { PlatformRole, Task, TicketPriority, TicketStatus } from "@/enums/common.enums";
import { DataListPage, FilterConfig, StatsCard } from "@/components/DataListPage";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
// import AddTicketModal from "@/components/popup/models/AddTicket.model"; // you'll create this modal
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BiSupport,
  BiCheckCircle,
  BiXCircle,
  BiTime,
  BiTask,
} from "react-icons/bi";
import { BsCalendar } from "react-icons/bs";
import AddTicketModal from "@/components/popup/models/AddTicket.model";

const ITEMS_PER_PAGE = 10;

interface ITicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  task: Task;
  createdAt: string;
  updatedAt: string;
  company?: { name: string }; // if populated
  createdBy?: { username: string; avatar?: string };
}

const Page = () => {
  const currentMember = useAppSelector((state) => state.currentMember.member);
  const selectedCompanyMember = useAppSelector(
    (state) => state.currentCompanyMember.companyMember
  );
  const companyId = selectedCompanyMember?.companyId?.id;
  const currentCompany = selectedCompanyMember?.company;
  const isSuperAdmin = currentMember?.role === PlatformRole.SUPER_ADMIN;

  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, status, searchText } = state;

  // Local filter states
  const [localStatus, setLocalStatus] = useState<string>(status || "");
  const [localSearch, setLocalSearch] = useState<string>(searchText || "");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const statusVal = localStatus === "" ? undefined : localStatus;
      dispatch({ type: "SET_STATUS", payload: statusVal });
      dispatch({ type: "SET_SEARCH", payload: localSearch || "" });
      dispatch({ type: "SET_PAGE", payload: 1 });
    }, 400);
    return () => clearTimeout(timer);
  }, [localStatus, localSearch, dispatch]);

  const [selectedData, setSelectedData] = useState<ITicket | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, loading, error, refetch, networkStatus } = useQuery<any>(
    GET_PAGINATED_TICKETS,
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

  const [deleteTickets] = useMutation<any>(DELETE_TICKETS);

  const tickets: ITicket[] = data?.getPaginatedTickets?.tickets || [];
  const totalTickets = data?.getPaginatedTickets?.totalTicketsCount || 0;
  const totalPages = Math.ceil(totalTickets / ITEMS_PER_PAGE);

  // Derived stats
  const openCount = tickets.filter((t) => t.status === TicketStatus.OPEN).length;
  const inProgressCount = tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length;
  const waitingCount = tickets.filter((t) => t.status === TicketStatus.WAITING_CUSTOMER).length;
  const resolvedCount = tickets.filter((t) => t.status === TicketStatus.RESOLVED).length;
  const closedCount = tickets.filter((t) => t.status === TicketStatus.CLOSED).length;

  const stats: StatsCard[] = [
    {
      label: "Total Tickets",
      value: totalTickets,
      icon: <BiSupport />,
    },
    {
      label: "Open",
      value: openCount,
      icon: <BiTime />,
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: <BiTask />,
    },
    {
      label: "Resolved",
      value: resolvedCount,
      icon: <BiCheckCircle />,
    },
    {
      label: "Closed",
      value: closedCount,
      icon: <BiXCircle />,
    },
  ];

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: "search",
      type: "search",
      placeholder: "Search by ticket number or subject...",
      label: "Search",
    },
    {
      key: "status",
      type: "select",
      placeholder: "All Status",
      label: "Status",
      options: [
        { label: "Open", value: TicketStatus.OPEN },
        { label: "In Progress", value: TicketStatus.IN_PROGRESS },
        { label: "Waiting Customer", value: TicketStatus.WAITING_CUSTOMER },
        { label: "Resolved", value: TicketStatus.RESOLVED },
        { label: "Closed", value: TicketStatus.CLOSED },
      ],
    },
  ];

  const filterValues = {
    search: localSearch,
    status: localStatus,
  };

  const activeFiltersCount = [status, searchText && searchText.length > 0].filter(Boolean).length;

  const handleResetFilters = () => {
    setLocalSearch("");
    setLocalStatus("all");
    dispatch({ type: "RESET_FILTERS" });
  };

  // Handlers
  const cancelDelete = () => {
    setSelectedIdsForDeletion([]);
    setShowConfirmationModel(false);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    if (selectedIdsForDeletion.length === 0) return;

    try {
      const { data } = await deleteTickets({
        variables: { ids: selectedIdsForDeletion },
      });

      if (data?.deleteTickets?.success) {
        toast.success(data.deleteTickets.message, { position: "top-center" });
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeletion([]);
      } else {
        toast.error(data?.deleteTickets?.message || "Failed to delete tickets", {
          position: "top-center",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete tickets", { position: "top-center" });
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = (ids: string[]) => {
    setSelectedIdsForDeletion(ids);
    setShowConfirmationModel(true);
  };

  const editHandler = (ticketData: ITicket) => {
    setIsEditMode(true);
    setSelectedData(ticketData);
    setShowAddModel(true);
  };

  const addHandler = () => {
    setSelectedData(null);
    setIsEditMode(false);
    setShowAddModel(true);
  };

  const cancelAddTicket = () => {
    setShowAddModel(false);
  };

  // Custom renderers for all columns
  const columns = ["ticketNumber", "subject", "status", "priority", "task", "createdAt"];

  const customRenderers = {
    ticketNumber: (value: string, row: ITicket) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
          <BiSupport className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className="font-medium">{value}</div>
          {row.company?.name && (
            <div className="text-xs text-muted-foreground">{row.company.name}</div>
          )}
        </div>
      </div>
    ),
    subject: (value: string) => (
      <div className="max-w-[200px] truncate" title={value}>
        {value}
      </div>
    ),
    status: (value: TicketStatus) => {
      const statusMap: Record<TicketStatus, { label: string; variant: any }> = {
        [TicketStatus.OPEN]: { label: "Open", variant: "default" },
        [TicketStatus.IN_PROGRESS]: { label: "In Progress", variant: "secondary" },
        [TicketStatus.WAITING_CUSTOMER]: { label: "Waiting", variant: "outline" },
        [TicketStatus.RESOLVED]: { label: "Resolved", variant: "success" },
        [TicketStatus.CLOSED]: { label: "Closed", variant: "destructive" },
      };
      const info = statusMap[value] || { label: value, variant: "outline" };
      return (
        <Badge variant={info.variant} className="gap-1">
          {value === TicketStatus.OPEN && <BiTime size={14} />}
          {value === TicketStatus.IN_PROGRESS && <BiTask size={14} />}
          {value === TicketStatus.RESOLVED && <BiCheckCircle size={14} />}
          {value === TicketStatus.CLOSED && <BiXCircle size={14} />}
          {info.label}
        </Badge>
      );
    },
    priority: (value: TicketPriority) => (
      <Badge variant="outline" className="capitalize">
        {value.toLowerCase()}
      </Badge>
    ),
    task: (value: Task) => (
      <span className="text-sm">{value.replace(/_/g, " ")}</span>
    ),
    createdAt: (value: string) => (
      <div className="flex items-center gap-1 text-sm">
        <BsCalendar className="h-3 w-3 text-muted-foreground" />
        {new Date(value).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    ),
  };

  // TableBox configuration
  const tableBoxConfig = {
    column: columns,
    checkbox: true,
    action: true,
    deletehandler: deleteHandler,
    edithandler: editHandler,
    height: "max-h-[calc(100vh-320px)]",
    createdAt: true,
    updatedAt: true,
    customRenderers,
  };

  const canManage = true;

  return (
    <DataListPage
      title="Ticket Management"
      subtitle={
        <span>
          {isSuperAdmin
            ? "All Companies"
            : currentCompany?.name || "No Company Selected"}{" "}
          • {totalTickets} {totalTickets === 1 ? "ticket" : "tickets"}
        </span>
      }
      stats={stats}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={(key, value) => {
        if (key === "search") setLocalSearch(value || "");
        else if (key === "status")
          setLocalStatus(value === undefined ? "all" : value);
      }}
      onResetFilters={handleResetFilters}
      showFilters={showFilters}
      networkStatus={networkStatus}
      onToggleFilters={() => setShowFilters(!showFilters)}
      activeFiltersCount={activeFiltersCount}
      onRefresh={() => refetch()}
      refreshing={showTableLoading}
      onAdd={addHandler}
      addLabel="Add Ticket"
      addDisabled={!companyId && !isSuperAdmin} // disable if no company selected
      data={tickets}
      loading={showTableLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      setCurrentPage={(page) => dispatch({ type: "SET_PAGE", payload: page })}
      tableBoxConfig={tableBoxConfig}
      error={error}
      onRetry={() => refetch()}
      canManage={canManage}
    >
      {/* Confirmation Modal */}
      {showConfirmationModel && (
        <ConfirmationBox
          onCancel={cancelDelete}
          onDelete={confirmDelete}
          title="Delete Tickets"
          message={`Are you sure you want to delete ${selectedIdsForDeletion.length} ticket(s)? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={isDeleting}
        />
      )}

      {showAddModel && (
        <AddTicketModal
          onCancel={cancelAddTicket}
          selectedData={selectedData}
          isEditMode={isEditMode}
          refetch={refetch}
          currentMemberId={currentMember?.id}
          companyId={companyId}
        />
        
      )}
    </DataListPage>
  );
};

export default Page;