// src/app/admin/all-members/page.tsx
"use client";
import { useEffect, useReducer, useState } from "react";
import { BiSearch } from "react-icons/bi";
import TableBox from "@/components/tablebox/TableBox";
import Container from "@/components/Container";
import { useMutation, useQuery } from "@apollo/client/react";
import { DELETE_MEMBERS } from "@/graphql/query/member.query";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/user-filter-reducer";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import { toast } from "react-toastify";
import AddMember from "@/components/popup/models/AddMember.model";
import { useAppSelector } from "@/redux/hooks";
import { GET_PAGINATED_MEMBERS } from "@/graphql/query/member.query";
import { PlatformRole } from "@/enums/common.enums";
import { Member } from "@/Types/member.types";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, FilterX, RefreshCw, ChevronDown, ChevronUp, ListFilter, Activity, XCircle, BadgeCheck, Users, TrendingUp, Sparkles, AlertTriangle, ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/helpers/getInitials";

const ITEMS_PER_PAGE = 10;

const Page = () => {
  const currentMember = useAppSelector((state) => state.currentMember.member);
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, role, isVerified, searchText } = state;
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeleteion, setSelectedIdsForDeleteion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // State to control filter visibility

  const isSuperAdmin = currentMember?.role === PlatformRole.SUPER_ADMIN;
  const isAdmin = currentMember?.role === PlatformRole.ADMIN;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Convert platformRole string to enum value
  const roleValue: PlatformRole | null =
    role === "SUPER_ADMIN" ? PlatformRole.SUPER_ADMIN :
      role === "ADMIN" ? PlatformRole.ADMIN :
        role === "OWNER" ? PlatformRole.OWNER : null;

  const { data, loading, error, refetch } = useQuery<any>(GET_PAGINATED_MEMBERS, {
    variables: {
      page: Number(currentPage) || 1,
      limit: Number(ITEMS_PER_PAGE) || 10,
      role: roleValue,
      isVerified: isVerified,
      search: debouncedSearch,
    },
    fetchPolicy: "network-only",
  });

  const [deleteMembers] = useMutation<any>(DELETE_MEMBERS);

  const alldata: Member[] = data?.getPaginatedMembers?.members || [];
  const totalMembers = data?.getPaginatedMembers?.totalMembersCount || 0;
  const totalPages = Math.ceil(totalMembers / ITEMS_PER_PAGE);

  const tableData = alldata.map(member => ({
    ...member,
    firstName: member.firstName,
    lastName: member.lastName,
    username: member.username,
    email: member.email,
    phone: member.phone || "-",
    role: member.role,
    avatar: member.avatar,
  }));

  const columns = ["member", "phone", "role"];

  const cancelDelete = () => {
    setSelectedIdsForDeleteion([]);
    setShowConfirmationModel(false);
  };

  const confirmDelete = async () => {
    setIsDeleting(true)
    if (selectedIdsForDeleteion.length === 0) return;

    if (!isSuperAdmin) {
      toast.error("Access denied");
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
        setIsDeleting(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete members");
      setIsDeleting(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = async (id: string[]) => {
    setSelectedIdsForDeleteion(id);
    setShowConfirmationModel(true);
  };

  const editHandler = (memberData: any) => {
    if (
      currentMember?.role !== PlatformRole.ADMIN &&
      currentMember?.role !== PlatformRole.SUPER_ADMIN &&
      currentMember?.role !== PlatformRole.OWNER
    ) {
      toast.error("Only SUPER_ADMIN can edit members");
      return;
    }

    if (currentMember?.role === PlatformRole.SUPER_ADMIN) {
      setIsEditMode(true);
      setSelectedData(memberData);
      setShowAddModel(true);
      return;
    }

    toast.error("Admins can only edit members from their own tenant");
  };

  const addHandler = () => {
    setSelectedData(null);
    setIsEditMode(false);
    setShowAddModel(true);
  };

  const cancelAddMember = () => {
    setShowAddModel(false);
  };

  const getRoleOptions = () => {
    const options = [
      { value: "SUPER_ADMIN", label: "Super Admin" },
      { value: "OWNER", label: "Owner" },
      { value: "ADMIN", label: "Admin" },
    ];
    return options;
  };

  // Count active filters
  const activeFiltersCount = [
    role,
    isVerified !== undefined,
    searchText
  ].filter(Boolean).length;

  return (
    <Container className="overflow-y-auto h-full">
      <div className="w-full h-full text-[13px]">
        <div className="w-full h-full overflow-hidden px-4">
          {/* Header Section */}
          <div className="flex justify-between items-center pb-6">
            <CardHeader className="w-full">
              <CardTitle className="text-xl">Member Management</CardTitle>
              <CardDescription>
                Total Members: {totalMembers}
                {!isSuperAdmin && <span className="ml-2 text-sm text-blue-600">(Filtered by your tenant)</span>}
              </CardDescription>
            </CardHeader>

            <div className="flex items-center space-x-3">


              {/* Filter Toggle Button */}
              <Button
                variant={showFilters ? "default" : "outline"}
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
                Add Member
              </Button>
            </div>
          </div>


          {/* Filter Section - Toggle visibility */}
          {showFilters && (
            <Card className=" animate-in bg-background slide-in-from-top-2 duration-200 ring-0">
              <div className=" w-full">
                <div className="w-full flex justify-start items-center gap-2">

                  {/* Search Input */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="search"
                        onChange={(e) =>
                          dispatch({ type: "SET_SEARCH", payload: e.target.value })
                        }
                        className="pl-10"
                        placeholder="Search members..."
                        type="text"
                        value={searchText}
                      />
                      <BiSearch className="absolute left-2 top-1/2 size-5 transform -translate-y-1/2 " />
                    </div>
                  </div>

                  {/* platformRole Filter */}
                  <div className="space-y-2 w-40">
                    <Select
                      onValueChange={(value) =>
                        dispatch({
                          type: "SET_ROLE",
                          payload: value === "all" ? undefined : value,
                        })
                      }
                      value={role === undefined ? "all" : role}
                    >
                      <SelectTrigger className="w-full" id="platformRole">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {getRoleOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Verification Status */}
                  <div className="w-40">
                    <Select
                      value={isVerified === undefined ? "all" : String(isVerified)}
                      onValueChange={(value) => {
                        if (value === "all") {
                          dispatch({
                            type: "SET_VERIFIED",
                            payload: undefined,
                          });
                        } else {
                          dispatch({
                            type: "SET_VERIFIED",
                            payload: value === "true",
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full" id="verificationStatus">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent className="">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="true">Verified</SelectItem>
                        <SelectItem value="false">Unverified</SelectItem>
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
                  Role: {getRoleOptions().find(r => r.value === role)?.label}
                  <button
                    onClick={() => dispatch({ type: "SET_ROLE", payload: undefined })}
                    className="ml-2 hover:text-blue-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
              {isVerified !== undefined && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                  {isVerified ? "Verified" : "Unverified"}
                  <button
                    onClick={() => dispatch({ type: "SET_VERIFIED", payload: undefined })}
                    className="ml-2 hover:text-green-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchText && (
                <span className="inline-flex items-center px-2 rounded-md text-xs text-purple-800">
                  Search: {searchText}
                  <button
                    onClick={() => dispatch({ type: "SET_SEARCH", payload: "" })}
                    className="ml-2 hover:text-purple-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
              {showFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    dispatch({ type: "RESET_FILTERS" });
                  }}
                  className="text-red-600  ml-auto hover:text-red-700"
                >
                  <FilterX className="size-4 mr-1" />
                  Reset All Filters
                </Button>
              )}
            </div>
          )}



          {/* Main Table */}
          {error ? (
            <div className="p-4 text-red-500 bg-red-50 rounded-lg">
              <div className="font-semibold">Error loading members</div>
              <div className="text-sm mt-1">{error.message}</div>
              <button
                onClick={() => refetch()}
                className="mt-3 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          ) : (
              <TableBox
                column={columns}
                checkbox={true}
                action={true}
                loading={loading}
                data={tableData}
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={(page) =>
                  dispatch({ type: "SET_PAGE", payload: page })
                }
                MemberStatus={true}
                subscription={true}
                isVerified={true}
                deletehandler={deleteHandler}
                edithandler={editHandler}
                height="max-h-[calc(100vh-380px)]"
                createdAt={false}
                updatedAt={true}
                customRenderers={{
                  member: (value, row) => {
                    return (
                      <div className="flex items-center gap-1">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={row.avatar} alt={row.username} />
                            <AvatarFallback className="rounded-lg h-8 w-8">{getInitials(row.username)}</AvatarFallback>
                          </Avatar>
                        </div>

                        <div>
                          <div className="font-medium ">
                            {row.username}
                          </div>
                          <div className=" text-gray-400">
                            {row.email}
                          </div>
                        </div>
                      </div>
                    );
                  }
                }}
              />
          )}
        </div>
      </div>

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
    </Container>
  );
};

export default Page;