"use client";
import { useEffect, useReducer, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { DELETE_MEMBERS, GET_PAGINATED_MEMBERS } from "@/graphql/query/member.query";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/user-filter-reducer";
import { useAppSelector } from "@/redux/hooks";
import { PlatformRole } from "@/enums/common.enums";
import { Member } from "@/Types/member.types";
import { DataListPage, FilterConfig, StatsCard } from "@/components/DataListPage";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import AddMember from "@/components/popup/models/AddMember.model";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/helpers/getInitials";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BiSearch } from "react-icons/bi";

const ITEMS_PER_PAGE = 10;

const Page = () => {
  const currentMember = useAppSelector((state) => state.currentMember.member);
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, role, isVerified, searchText } = state;

  // Local filter states (for immediate UI feedback)
  const [localSearch, setLocalSearch] = useState<string>(searchText || "");
  const [localRole, setLocalRole] = useState<string>(role || "");
  const [localVerified, setLocalVerified] = useState<string>(
    isVerified === undefined ? "" : String(isVerified)
  );
  const [showFilters, setShowFilters] = useState(false);

  // Debounce filter changes to reducer (with page reset)
  useEffect(() => {
    const timer = setTimeout(() => {
      const roleVal = localRole === "" ? undefined : localRole;
      const verifiedVal = localVerified === "" ? undefined : localVerified === "true";
      dispatch({ type: "SET_SEARCH", payload: localSearch || "" });
      dispatch({ type: "SET_ROLE", payload: roleVal });
      dispatch({ type: "SET_VERIFIED", payload: verifiedVal });
      dispatch({ type: "SET_PAGE", payload: 1 });
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, localRole, localVerified, dispatch]);

  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeleteion, setSelectedIdsForDeleteion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSuperAdmin = currentMember?.role === PlatformRole.SUPER_ADMIN;
  const isAdmin = currentMember?.role === PlatformRole.ADMIN;
  const isOwner = currentMember?.role === PlatformRole.OWNER;

  // Convert platformRole string to enum value for query
  const roleValue: PlatformRole | null =
    role === "SUPER_ADMIN" ? PlatformRole.SUPER_ADMIN :
      role === "ADMIN" ? PlatformRole.ADMIN :
        role === "OWNER" ? PlatformRole.OWNER : null;

  const { data, loading, error, refetch, networkStatus } = useQuery<any>(GET_PAGINATED_MEMBERS, {
    variables: {
      page: Number(currentPage) || 1,
      limit: Number(ITEMS_PER_PAGE) || 10,
      role: roleValue,
      isVerified: isVerified,
      search: searchText,
    },
    fetchPolicy: "network-only",
  });

  const showTableLoading = loading && networkStatus === 1;

  const [deleteMembers] = useMutation<any>(DELETE_MEMBERS);

  const allMembers: Member[] = data?.getPaginatedMembers?.members || [];
  const totalMembers = data?.getPaginatedMembers?.totalMembersCount || 0;
  const totalPages = Math.ceil(totalMembers / ITEMS_PER_PAGE);

  const tableData = allMembers.map(member => ({
    ...member,
    firstName: member.firstName,
    lastName: member.lastName,
    username: member.username,
    email: member.email,
    phone: member.phone || "-",
    role: member.role,
    avatar: member.avatar,
    // these fields should exist; adjust if needed
    isVerified: member.isVerified,
    subscription: member.subscription, // or member.isSubscribed, etc.
    memberStatus: member.status, // if available
  }));

  // ---- Stats ----
  const verifiedCount = allMembers.filter(m => m.isVerified).length;
  const unverifiedCount = totalMembers - verifiedCount;

  const stats: StatsCard[] = [
    {
      label: "Total Members",
      value: totalMembers,
      icon: <BiSearch />, // replace with appropriate icon (e.g., FaUsers)
    },
    {
      label: "Verified",
      value: verifiedCount,
      icon: <BiSearch />,
    },
    {
      label: "Unverified",
      value: unverifiedCount,
      icon: <BiSearch />,
    },
  ];

  // ---- Filter configuration ----
  const filterConfig: FilterConfig[] = [
    {
      key: "search",
      type: "search",
      placeholder: "Search members...",
      label: "Search",
    },
    {
      key: "role",
      type: "select",
      placeholder: "All Roles",
      label: "Role",
      options: [
        { label: "Super Admin", value: "SUPER_ADMIN" },
        { label: "Admin", value: "ADMIN" },
        { label: "Owner", value: "OWNER" },
      ],
    },
    {
      key: "verified",
      type: "select",
      placeholder: "All Status",
      label: "Verification",
      options: [
        { label: "Verified", value: "true" },
        { label: "Unverified", value: "false" },
      ],
    },
  ];

  const filterValues = {
    search: localSearch,
    role: localRole,
    verified: localVerified,
  };

  const activeFiltersCount = [
    role,
    isVerified !== undefined,
    searchText && searchText.length > 0,
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setLocalSearch("");
    setLocalRole("");
    setLocalVerified("");
    dispatch({ type: "RESET_FILTERS" });
  };

  // ---- Handlers ----
  const cancelDelete = () => {
    setSelectedIdsForDeleteion([]);
    setShowConfirmationModel(false);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    if (selectedIdsForDeleteion.length === 0) return;

    if (!isSuperAdmin) {
      toast.error("Access denied");
      setIsDeleting(false);
      return;
    }

    try {
      const { data } = await deleteMembers({
        variables: { ids: selectedIdsForDeleteion },
      });

      if (data?.deleteMembers?.success) {
        toast.success(data.deleteMembers.message);
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeleteion([]);
      } else {
        toast.error(data?.deleteMembers?.message || "Failed to delete members");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete members");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = async (ids: string[]) => {
    setSelectedIdsForDeleteion(ids);
    setShowConfirmationModel(true);
  };

  const editHandler = (memberData: any) => {
    if (!isSuperAdmin && !isAdmin && !isOwner) {
      toast.error("Only SUPER_ADMIN, ADMIN, or OWNER can edit members");
      return;
    }
    // Additional tenant checks can be added if needed
    setIsEditMode(true);
    setSelectedData(memberData);
    setShowAddModel(true);
  };

  const addHandler = () => {
    setSelectedData(null);
    setIsEditMode(false);
    setShowAddModel(true);
  };

  const cancelAddMember = () => {
    setShowAddModel(false);
  };

  // ---- Custom renderers for all columns ----
  const columns = ["member", "phone", "role", "isVerified", "memberStatus", "subscriptionStatus"];

  const customRenderers = {
    member: (_: any, row: any) => (
      <div className="flex items-center gap-1">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={row.avatar} alt={row.username} />
            <AvatarFallback className="rounded-lg h-8 w-8">{getInitials(row.username)}</AvatarFallback>
          </Avatar>
        </div>
        <div>
          <div className="font-medium">{row.username}</div>
          <div className="text-gray-400">{row.email}</div>
        </div>
      </div>
    ),
    phone: (value: string) => <span>{value || "-"}</span>,
    role: (value: PlatformRole) => {
      const config: Record<PlatformRole, { label: string; className: string }> = {
        [PlatformRole.SUPER_ADMIN]: { label: "Super Admin", className: "bg-purple-100 text-purple-800" },
        [PlatformRole.ADMIN]: { label: "Admin", className: "bg-blue-100 text-blue-800" },
        [PlatformRole.OWNER]: { label: "Owner", className: "bg-orange-100 text-orange-800" },
      };
      const { label, className } = config[value] || { label: value, className: "bg-gray-100" };
      return <Badge className={className}>{label}</Badge>;
    },
    isVerified: (value: boolean) => (
      <Badge className={value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
        {value ? "Verified" : "Unverified"}
      </Badge>
    ),
    subscriptionStatus: (value: any, row: any) => {
      const plan = row.subscriptionPlan || "No Plan";
      const isActive = row.subscriptionActive;

      if (!isActive) {
        return <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>;
      }

      // Custom colors per plan (optional)
      const planColors: Record<string, string> = {
        enterprise: "bg-purple-100 text-purple-800",
        pro: "bg-blue-100 text-blue-800",
        premium: "bg-amber-100 text-amber-800",
        basic: "bg-gray-100 text-gray-800",
        // default green for any other plan
      };
      const colorClass = planColors[plan.toLowerCase()] || "bg-green-100 text-green-800";
      return <Badge className={colorClass}>{plan}</Badge>;
    },
    memberStatus: (value: string) => {
      const isActive = value === "ACTIVE";
      return (
        <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  };

  // ---- TableBox configuration ----
  const tableBoxConfig = {
    column: columns,
    checkbox: true, // Everyone can select, delete permission enforced in deleteHandler
    action: true,
    deletehandler: deleteHandler,
    edithandler: editHandler,
    height: "max-h-[calc(100vh-320px)]",
    subscription: true,
    createdAt: false,
    updatedAt: true,
    customRenderers,
  };

  const canManage = true; // all logged-in users can see the page, but edit/delete restricted

  return (
    <DataListPage
      title="Member Management"
      subtitle={
        <span>
          Total Members: {totalMembers}
        </span>
      }
      stats={stats}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={(key, value) => {
        if (key === "search") setLocalSearch(value || "");
        else if (key === "role") setLocalRole(value === undefined ? "" : value);
        else if (key === "verified") setLocalVerified(value === undefined ? "" : value);
      }}
      onResetFilters={handleResetFilters}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters(!showFilters)}
      activeFiltersCount={activeFiltersCount}
      onRefresh={() => refetch()}
      networkStatus={networkStatus}
      refreshing={showTableLoading}
      onAdd={addHandler}
      addLabel="Add Member"
      addDisabled={false} // Always enabled; permission inside modal
      data={tableData}
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
          title="Delete Members"
          message={`Are you sure you want to delete ${selectedIdsForDeleteion.length} member(s)? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={isDeleting}
        />
      )}

      {/* Add/Edit Member Modal */}
      {showAddModel && (
        <AddMember
          onCancel={cancelAddMember}
          selectedData={selectedData}
          isEditMode={isEditMode}
          refetch={refetch}
          currentMemberId={currentMember?.id}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </DataListPage>
  );
};

export default Page;