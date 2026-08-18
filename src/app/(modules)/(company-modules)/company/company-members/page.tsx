"use client";
import { useEffect, useReducer, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAppSelector } from "@/redux/hooks";
import { DataListPage, FilterConfig, StatsCard } from "@/components/DataListPage";
import AddCompanyMember from "@/components/popup/models/AddCompanyMember.model";
import {
  GET_PAGINATED_COMPANY_MEMBERS,
  REMOVE_COMPANY_MEMBERS,
} from "@/graphql/query/company-member.query";
import {
  CompanyMemberRole,
  MemberStatus,
} from "@/enums/common.enums";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/company-member-filter-reducer";
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
import { BiUser, BiGlobe } from "react-icons/bi";
import { FiUserCheck } from "react-icons/fi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/helpers/getInitials";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

const CompanyMembersPage = () => {
  const currentCompanyMember = useAppSelector(
    (state) => state.currentCompanyMember.companyMember
  );

  const [showFilters, setShowFilters] = useState(false);
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, role, status, searchText } = state;

  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const companyId = currentCompanyMember?.companyId?.id;
  const teamId = currentCompanyMember?.team?.id || "";

  const canManageTeam = currentCompanyMember?.role
    ? [
      CompanyMemberRole.OWNER,
      CompanyMemberRole.MANAGER,
    ].includes(currentCompanyMember.role as CompanyMemberRole)
    : false;

  const isOwner = currentCompanyMember?.role === CompanyMemberRole.OWNER;

  // Local filter states for debouncing
  const [localRole, setLocalRole] = useState<string>("");
  const [localStatus, setLocalStatus] = useState<string>("");
  const [localSearch, setLocalSearch] = useState<string>("");

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const roleVal = localRole === "" ? undefined : localRole;
      const statusVal = localStatus === "" ? undefined : localStatus;
      dispatch({ type: "SET_ROLE", payload: roleVal });
      dispatch({ type: "SET_STATUS", payload: statusVal });
      dispatch({ type: "SET_SEARCH", payload: localSearch || "" });
      dispatch({ type: "SET_PAGE", payload: 1 });
    }, 400);
    return () => clearTimeout(timer);
  }, [localRole, localStatus, localSearch, dispatch]);

  const handleResetFilters = () => {
    setLocalRole("");
    setLocalStatus("");
    setLocalSearch("");
    dispatch({ type: "RESET_FILTERS" });
  };

  // GraphQL query
  const { data, loading, error, refetch, networkStatus } = useQuery<any>(
    GET_PAGINATED_COMPANY_MEMBERS,
    {
      variables: {
        companyId: companyId,
        page: Number(currentPage) || 1,
        limit: Number(ITEMS_PER_PAGE) || 10,
        role: role || undefined,
        status: status || undefined,
        search: searchText || undefined,
      },
      fetchPolicy: "network-only",
      skip: !companyId,
    }
  );

  const showTableLoading = (loading && networkStatus === 1) || !companyId;

  const [removeCompanyMembers] = useMutation<any>(REMOVE_COMPANY_MEMBERS);

  const rawMembers: any[] =
    data?.getPaginatedCompanyMembers?.companyMembers || [];
  const totalMembers =
    data?.getPaginatedCompanyMembers?.totalCompanyMembersCount || 0;
  const totalPages = Math.ceil(totalMembers / ITEMS_PER_PAGE);

  // console.log("Raw Members Data:", rawMembers);

  const members = rawMembers.map((member) => ({
    ...member,
    email: member.memberId?.email || "",
    username: member.memberId?.username || "",
    avatar: member.memberId?.avatar || "",
    phone: member.memberId?.phone || "",
    modules: member.modules || [],
    websites: member.websites || [],
    websitesCount: member.websites?.length || 0,
  }));

  const activeCount = members.filter(
    (m) => m.status === MemberStatus.ACTIVE
  ).length;
  const totalWebsites = members.reduce(
    (acc, m) => acc + (m.websites?.length || 0),
    0
  );

  // Delete handlers
  const cancelDelete = () => {
    setSelectedIdsForDeletion([]);
    setShowConfirmationModel(false);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    if (selectedIdsForDeletion.length === 0) return;
    if (!canManageTeam) {
      toast.error("You don't have permission to remove team members");
      setIsDeleting(false);
      return;
    }
    const ownersToDelete = members.filter(
      (m) =>
        selectedIdsForDeletion.includes(m.id as string) &&
        m.role === CompanyMemberRole.OWNER
    );
    if (ownersToDelete.length > 0 && !isOwner) {
      toast.error("Only owners can delete other owners");
      setIsDeleting(false);
      return;
    }
    try {
      const { data, error } = await removeCompanyMembers({
        variables: { ids: selectedIdsForDeletion },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data?.removeCompanyMembers?.success) {
        toast.success(data.removeCompanyMembers.message);
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeletion([]);
      } else {
        toast.error(data?.removeCompanyMembers?.message || "Failed to remove members");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to remove members");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = async (ids: string[]) => {
    if (!canManageTeam) {
      toast.error("You don't have permission to delete team members");
      return;
    }
    const ownersToDelete = members.filter(
      (m) => ids.includes(m.id) && m.role === CompanyMemberRole.OWNER
    );
    if (ownersToDelete.length > 0 && !isOwner) {
      toast.error("Only owners can delete members with OWNER role");
      return;
    }
    setSelectedIdsForDeletion(ids);
    setShowConfirmationModel(true);
  };

  const editHandler = (memberData: any) => {
    if (!canManageTeam) {
      toast.error("You don't have permission to edit team members");
      return;
    }
    if (memberData.role === CompanyMemberRole.OWNER && !isOwner) {
      toast.error("Only owners can edit other owners");
      return;
    }
    setIsEditMode(true);
    // console.log({ SelectedData: memberData })
    setSelectedData(memberData);
    setShowAddModel(true);
  };

  const addHandler = () => {
    if (!canManageTeam) {
      toast.error("You don't have permission to add team members");
      return;
    }
    setSelectedData(null);
    setIsEditMode(false);
    setShowAddModel(true);
  };

  const cancelAddMember = () => {
    setShowAddModel(false);
  };

  // ----- Badges for custom renderers -----
  const StatusBadge = ({ status }: { status: MemberStatus }) => {
    const config: Record<MemberStatus, { label: string; className: string }> = {
      [MemberStatus.ACTIVE]: { label: "Active", className: "bg-green-100 text-green-800" },
      [MemberStatus.INACTIVE]: { label: "Inactive", className: "bg-orange-100 text-orange-800" },
      [MemberStatus.SUSPENDED]: { label: "Suspended", className: "bg-red-100 text-red-800" },
      [MemberStatus.PENDING]: { label: "Pending", className: "bg-orange-100 text-orange-800" },
      [MemberStatus.INVITED]: { label: "Invited", className: "bg-blue-100 text-blue-800" },
    };
    const { label, className } = config[status] || config[MemberStatus.PENDING];
    return <Badge className={className}>{label}</Badge>;
  };

  const RoleBadge = ({ role }: { role: CompanyMemberRole }) => {
    const config: Record<CompanyMemberRole, { label: string; className: string }> = {
      [CompanyMemberRole.OWNER]: { label: "Owner", className: "bg-orange-100 text-orange-800" },
      [CompanyMemberRole.MANAGER]: { label: "Manager", className: "bg-blue-100 text-blue-800" },
      [CompanyMemberRole.EMPLOYEE]: { label: "Employee", className: "bg-gray-100 text-gray-800" },
    };
    const { label, className } = config[role] || config[CompanyMemberRole.EMPLOYEE];
    return <Badge className={className}>{label}</Badge>;
  };

  // ---- Columns and custom renderers ----
  const columns = ["companyMember", "role", "status", "websitesCount"];

  const customRenderers = {
    role: (value: CompanyMemberRole) => <RoleBadge role={value} />,
    status: (value: MemberStatus) => <StatusBadge status={value} />,
    websitesCount: (value: number) => (
      <span className="inline-flex items-center gap-1">
        <BiGlobe className="h-4 w-4 text-muted-foreground" />
        {value}
      </span>
    ),
    companyMember: (value: any, row: any) => {
      return (
        <div className="flex items-center gap-1">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={row.memberId.avatar} alt={row.memberId.username} />
              <AvatarFallback className="rounded-lg h-8 w-8">{getInitials(row.memberId.username)}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <div className="font-medium">{row.memberId.username}</div>
            <div className="text-gray-400">{row.memberId.email}</div>
          </div>
        </div>
      );
    },
  };

  // ---- Filter configuration ----
  const filterConfig: FilterConfig[] = [
    {
      key: "search",
      type: "search",
      placeholder: "Search by name or email...",
      label: "Search",
    },
    {
      key: "role",
      type: "select",
      placeholder: "All Roles",
      label: "Role",
      options: Object.values(CompanyMemberRole)
        .filter((r) => isOwner || r !== CompanyMemberRole.OWNER)
        .map((r) => ({ label: r.replace("_", " "), value: r })),
    },
    {
      key: "status",
      type: "select",
      placeholder: "All Status",
      label: "Status",
      options: Object.values(MemberStatus).map((s) => ({ label: s, value: s })),
    },
  ];

  const filterValues = {
    search: localSearch,
    role: localRole,
    status: localStatus,
  };

  const activeFiltersCount = [role, status, searchText].filter(Boolean).length;

  // Stats
  const stats: StatsCard[] = [
    {
      label: "Total Members",
      value: totalMembers,
      icon: <BiUser />,
    },
    {
      label: "Active",
      value: activeCount,
      icon: <FiUserCheck />,
    },
    {
      label: "Websites",
      value: totalWebsites,
      icon: <BiGlobe />,
    },
  ];

  // TableBox configuration (column is now required, but we provide it)
  const tableBoxConfig = {
    column: columns,
    checkbox: canManageTeam,
    action: canManageTeam,
    deletehandler: deleteHandler,
    edithandler: editHandler,
    height: "max-h-[calc(100vh-320px)]",
    createdAt: true,
    updatedAt: true,
    customRenderers,
  };

  // ---- Render ----
  return (
    <DataListPage
      title="Company Members"
      // subtitle={`${currentCompanyMember?.companyId?.name} — Total Members: ${totalMembers}`}
      stats={stats}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={(key, value) => {
        if (key === "search") setLocalSearch(value || "");
        else if (key === "role") setLocalRole(value === undefined ? "" : value);
        else if (key === "status") setLocalStatus(value === undefined ? "" : value);
      }}
      onResetFilters={handleResetFilters}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters(!showFilters)}
      activeFiltersCount={activeFiltersCount}
      onRefresh={() => refetch()}
      refreshing={showTableLoading}
      networkStatus={networkStatus}
      onAdd={addHandler}
      addLabel="Add Company Member"
      addDisabled={!canManageTeam}
      data={members}
      loading={showTableLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      setCurrentPage={(page) => dispatch({ type: "SET_PAGE", payload: page })}
      tableBoxConfig={tableBoxConfig}
      error={error}
      onRetry={() => refetch()}
      canManage={canManageTeam}
    >
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmationModel} onOpenChange={setShowConfirmationModel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Members</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedIdsForDeletion.length} team member(s)?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Member Modal */}
      {showAddModel && (
        <AddCompanyMember
          onCancel={cancelAddMember}
          selectedData={selectedData}
          isEditMode={isEditMode}
          refetch={refetch}
          currentCompanyId={companyId || ""}
          currentTeamId={teamId}
          currentUserRole={currentCompanyMember?.role}
        />
      )}
    </DataListPage>
  );
};

export default CompanyMembersPage;