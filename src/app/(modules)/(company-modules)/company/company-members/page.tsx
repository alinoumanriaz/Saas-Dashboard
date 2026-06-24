"use client";
import { useEffect, useReducer, useState } from "react";
import {
  BiSearch,
  BiUser,
  BiGlobe,
} from "react-icons/bi";
import {
  FiUserCheck,
} from "react-icons/fi";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";

import { useAppSelector } from "@/redux/hooks";
import Container from "@/components/Container";
import TableBox from "@/components/tablebox/TableBox";
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

// shadcn/ui imports
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FilterX, ListFilter, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/helpers/getInitials";

const ITEMS_PER_PAGE = 10;

type FilterFormValues = {
  role: string;
  status: string;
  search: string;
};

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

  // ----- Replace react-hook-form with plain useState -----
  const [localRole, setLocalRole] = useState<string>("all");
  const [localStatus, setLocalStatus] = useState<string>("all");
  const [localSearch, setLocalSearch] = useState<string>("");

  // ----- Debounced filter changes with page reset -----
  useEffect(() => {
    const timer = setTimeout(() => {
      const roleVal = localRole === "all" ? undefined : localRole;
      const statusVal = localStatus === "all" ? undefined : localStatus;
      dispatch({ type: "SET_ROLE", payload: roleVal });
      dispatch({ type: "SET_STATUS", payload: statusVal });
      dispatch({ type: "SET_SEARCH", payload: localSearch || "" });
      // Reset to page 1 when filters change
      dispatch({ type: "SET_PAGE", payload: 1 });
    }, 400);
    return () => clearTimeout(timer);
  }, [localRole, localStatus, localSearch, dispatch]);

  const handleResetFilters = () => {
    setLocalRole("all");
    setLocalStatus("all");
    setLocalSearch("");
    dispatch({ type: "RESET_FILTERS" });
  };

  // Query
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

  console.log({ COMPANY_MEMBERS: data })
  console.log({ COMPANY_MEMBERS_ERROR: error })
  
  const showTableLoading = loading && networkStatus === 1;


  const [removeCompanyMembers] = useMutation<any>(REMOVE_COMPANY_MEMBERS);

  const rawMembers: any[] =
    data?.getPaginatedCompanyMembers?.companyMembers || [];
  const totalMembers =
    data?.getPaginatedCompanyMembers?.totalCompanyMembersCount || 0;
  const totalPages = Math.ceil(totalMembers / ITEMS_PER_PAGE);

  const members = rawMembers.map((member) => ({
    ...member,
    email: member.memberId?.email || "",
    username: member.memberId?.username || "",
    avatar: member.memberId?.avatar || "",
    phone: member.memberId?.phone || "",
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

  // Badge components
  const StatusBadge = ({ status }: { status: MemberStatus }) => {
    const config: Record<MemberStatus, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
      [MemberStatus.ACTIVE]: { label: "Active", variant: "default" },
      [MemberStatus.INACTIVE]: { label: "Inactive", variant: "secondary" },
      [MemberStatus.SUSPENDED]: { label: "Suspended", variant: "destructive" },
      [MemberStatus.PENDING]: { label: "Pending", variant: "outline" },
      [MemberStatus.INVITED]: { label: "Invited", variant: "outline" },
    };
    const { label, variant } = config[status] || config[MemberStatus.PENDING];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const RoleBadge = ({ role }: { role: CompanyMemberRole }) => {
    const config: Record<CompanyMemberRole, { label: string; className: string }> = {
      [CompanyMemberRole.OWNER]: { label: "Owner", className: "bg-purple-100 text-purple-800" },
      [CompanyMemberRole.MANAGER]: { label: "Manager", className: "bg-blue-100 text-blue-800" },
      [CompanyMemberRole.EMPLOYEE]: { label: "Employee", className: "bg-gray-100 text-gray-800" },
      [CompanyMemberRole.SUPER_ADMIN]: { label: "Super Admin", className: "bg-red-100 text-red-800" },
    };
    const { label, className } = config[role] || config[CompanyMemberRole.EMPLOYEE];
    return <Badge className={className}>{label}</Badge>;
  };

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
            <div className="font-medium ">
              {row.memberId.username}
            </div>
            <div className=" text-gray-400">
              {row.memberId.email}
            </div>
          </div>
        </div>
      );
    }
  };

  const activeFiltersCount = [
    role,
    status,
    searchText
  ].filter(Boolean).length;

  return (
    <Container className="overflow-y-auto h-full">
      <div className="w-full h-full text-[13px]">
        <div className="w-full h-full overflow-hidden px-4">

          {/* Header Section */}
          <div className="flex justify-between items-center pb-6">
            <CardHeader className="w-full p-0">
              <CardTitle className="text-xl">Company Members</CardTitle>
              <CardDescription>
                {currentCompanyMember?.companyId?.name} — Total Members: {totalMembers}
              </CardDescription>
            </CardHeader>

            <div className="flex items-center space-x-3">
              {/* Filter Toggle Button */}
              <Button
                variant={showFilters ? "outline" : "outline"}
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

              <Button onClick={addHandler}>
                Add Company Member
              </Button>
            </div>
          </div>

          {/* Filters – using "all" as the "All" value */}
          {showFilters && (
            <Card className="animate-in bg-background slide-in-from-top-2 duration-200 ring-0">
              <div className="w-full">
                <div className="w-full flex justify-start items-center gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative">
                      <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        className="pl-9"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 w-40">
                    <label className="text-sm font-medium">Role</label>
                    <Select
                      value={localRole}
                      onValueChange={(val) => setLocalRole(val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {Object.values(CompanyMemberRole).map((role) => {
                          // Hide OWNER if current user is not an owner
                          if (!isOwner && role === CompanyMemberRole.OWNER) return null;
                          return (
                            <SelectItem key={role} value={role}>
                              {role.replace("_", " ")}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
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
                        {Object.values(MemberStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
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
              {role && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                  Role: {role}
                  <button
                    onClick={() => {
                      setLocalRole("all");
                      dispatch({ type: "SET_ROLE", payload: undefined });
                      dispatch({ type: "SET_PAGE", payload: 1 });
                    }}
                    className="ml-2 hover:text-blue-600 font-bold"
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
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <BiUser className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMembers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <FiUserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Websites</CardTitle>
                <BiGlobe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWebsites}</div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          {error ? (
            <div className="p-4 text-red-500 bg-red-50 rounded-lg">
              <div className="font-semibold">Error loading company members</div>
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
                checkbox={canManageTeam}
                action={canManageTeam}
                loading={showTableLoading}
                data={members}
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
    </Container>
  );
};

export default CompanyMembersPage;