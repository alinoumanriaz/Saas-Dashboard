"use client";
import { useEffect, useReducer, useState } from "react";
import { BiSearch, BiCheckCircle, BiXCircle } from "react-icons/bi";
import TableBox from "@/components/tablebox/TableBox";
import Container from "@/components/Container";
import { useMutation, useQuery } from "@apollo/client/react";
import { DELETE_COMPANIES, GET_PAGINATED_COMPANIES } from "@/graphql/query/company.query";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/company-filter-reducer";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import AddCompany from "@/components/popup/models/AddCompany.model";
import { useAppSelector } from "@/redux/hooks";
import { CompanyMemberRole, PlatformRole } from "@/enums/common.enums";
import { Company } from "@/Types/company.types";

// shadcn/ui components
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterX, RefreshCw, ListFilter } from "lucide-react";
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
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

const AllCompaniesPage = () => {
  const currentCompanyMember = useAppSelector((state) => state?.currentCompanyMember?.companyMember);
  const currentMember = useAppSelector((state) => state?.currentMember?.member);
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, isActive, searchText } = state;
  const [selectedData, setSelectedData] = useState<Company | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const isSuperAdmin = currentMember?.role === PlatformRole.SUPER_ADMIN;
  const isOwner = currentCompanyMember?.role === CompanyMemberRole.OWNER;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Query – skip only if not super admin and no current company member
  const shouldSkip = !isSuperAdmin && !currentCompanyMember;

  const { data, loading, error, refetch, networkStatus } = useQuery<any>(GET_PAGINATED_COMPANIES, {
    variables: {
      page: Number(currentPage) || 1,
      limit: Number(ITEMS_PER_PAGE) || 10,
      isActive: isActive === undefined ? null : isActive,
      search: debouncedSearch || null,
    },
    fetchPolicy: "network-only",
    skip: shouldSkip,
  });


  const [deleteCompanies] = useMutation<any>(DELETE_COMPANIES);

  const showTableLoading = loading && networkStatus === 1;

  const allCompanies: Company[] = data?.getPaginatedCompanies?.companies || [];
  const totalCompanies = data?.getPaginatedCompanies?.totalCompaniesCount || 0;
  const totalPages = Math.ceil(totalCompanies / ITEMS_PER_PAGE);

  console.log({ companies: allCompanies })
  // Filter companies based on user role and tenant access
  const filteredCompanies = allCompanies.filter(company => {
    if (isSuperAdmin) return true;
    if (currentCompanyMember) {
      // Owner sees companies where they are in ownerIds
      return company.ownerIds?.includes(currentMember?.id || "");
    }
    return false;
  });

  const tableData = filteredCompanies.map(company => ({
    ...company,
  }));

  const columns = ["company", "owners", "status", "number"];

  const cancelDelete = () => {
    setSelectedIdsForDeletion([]);
    setShowConfirmationModel(false);
  };

  const confirmDelete = async () => {
    if (selectedIdsForDeletion.length === 0) return;

    if (!isSuperAdmin) {
      toast.error("Access denied", { position: "top-center" });
      return;
    }

    try {
      const { data } = await deleteCompanies({
        variables: { ids: selectedIdsForDeletion },
      });

      if (data?.deleteCompanies?.success) {
        toast.success(data.deleteCompanies.message, { position: "top-center" });
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeletion([]);
      } else {
        toast.error(data?.deleteCompanies?.message || "Failed to delete companies", { position: "top-center" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete companies", { position: "top-center" });
    }
  };

  const deleteHandler = async (ids: string[]) => {
    setSelectedIdsForDeletion(ids);
    setShowConfirmationModel(true);
  };

  const editHandler = (companyData: Company) => {
    if (!isSuperAdmin && !isOwner) {
      toast.error("Only super admins, owners, and admins can edit companies", { position: "top-center" });
      return;
    }
    if (!isSuperAdmin && !companyData.ownerIds?.includes(currentCompanyMember?.id || "")) {
      toast.error("You can only edit companies you own", { position: "top-center" });
      return;
    }
    setIsEditMode(true);
    setSelectedData(companyData);
    setShowAddModel(true);
  };

  const addHandler = () => {
    if (!isSuperAdmin && !isOwner) {
      toast.error("Only super admins, owners, and admins can add companies", { position: "top-center" });
      return;
    }
    setSelectedData(null);
    setIsEditMode(false);
    setShowAddModel(true);
  };

  const cancelAddCompany = () => {
    setShowAddModel(false);
    setSelectedData(null);
    setIsEditMode(false);
  };

  // Custom renderer for status column
  const statusRenderer = (_: string, value: boolean) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value
      ? 'bg-green-200/10 text-green-600'
      : 'bg-red-100 text-red-800'
      }`}>
      {value ? (
        <>
          <BiCheckCircle className="mr-1" size={14} />
          Active
        </>
      ) : (
        <>
          <BiXCircle className="mr-1" size={14} />
          Inactive
        </>
      )}
    </span>
  );

  // Custom renderer for company name with logo (using shadcn Avatar)
  const companyRenderer = (_: string, value: any) => (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={value.logo} alt={value.name} />
        <AvatarFallback >{getInitials(value.name)}</AvatarFallback>
      </Avatar>
      <div>
        <div className="font-medium text-foreground">
          {value?.name || "Unknown"}
        </div>
        <div className="text-xs text-gray-500">
          {value?.email || "No email"}
        </div>
      </div>
    </div>
  );

  const ownersRender = (_: string, value: any) => {
    if (!value.ownerIds || (value.ownerIds).length === 0) {
      return <span className="text-muted-foreground text-sm">No owners</span>;
    }

    return (
      <div className="flex gap-1">
        {value.ownerIds.map((owner: any) => (
          <div key={owner.id} className="flex flex-col items-start">
            <div className="font-medium text-foreground">
              {owner.username || owner.email || "Unknown"}
            </div>
            {owner.email && (
              <div className="text-xs text-muted-foreground">{owner.email}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Count active filters
  const activeFiltersCount = [
    isActive !== undefined,
    searchText
  ].filter(Boolean).length;

  if (error) {
    return (
      <Container className="overflow-y-auto h-full">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="shrink-0">
                <BiXCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading companies</h3>
                <div className="mt-2 text-sm text-red-700">{error.message}</div>
                <button
                  onClick={() => refetch()}
                  className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="overflow-y-auto h-full">
      <div className="w-full h-full text-[13px]">
        <div className="w-full h-full overflow-hidden px-4">
          {/* Header Section */}
          <div className="flex justify-between items-center pb-4">
            <CardHeader className="w-full p-0">
              <CardTitle className="text-xl">Companies Management</CardTitle>
              <CardDescription>
                Total Companies: {totalCompanies}
                {!isSuperAdmin && (
                  <span className="ml-2 text-sm text-blue-600">
                    (Showing {filteredCompanies.length} of {totalCompanies} – Your Companies)
                  </span>
                )}
              </CardDescription>
            </CardHeader>

            <div className="flex items-center space-x-3">
              {/* Filter Toggle Button */}
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

              {(isSuperAdmin || isOwner) && (
                <Button onClick={addHandler}>
                  Add Company
                </Button>
              )}
            </div>
          </div>

          {/* Filter Section - Toggle visibility */}
          {showFilters && (
            <Card className="animate-in bg-background slide-in-from-top-2 duration-200 ring-0">
              <div className="w-full">
                <div className="w-full flex justify-start items-center gap-2 flex-wrap">
                  {/* Search Input */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="search"
                        onChange={(e) =>
                          dispatch({ type: "SET_SEARCH", payload: e.target.value })
                        }
                        className="pl-10 w-64"
                        placeholder="Search companies..."
                        type="text"
                        value={searchText}
                      />
                      <BiSearch className="absolute left-2 top-1/2 size-5 transform -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2 w-40">
                    <Select
                      onValueChange={(value) =>
                        dispatch({
                          type: "SET_ACTIVE",
                          payload: value === "all" ? undefined : value === "true",
                        })
                      }
                      value={isActive === undefined ? "all" : String(isActive)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
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
              {isActive !== undefined && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                  {isActive ? "Active" : "Inactive"}
                  <button
                    onClick={() => dispatch({ type: "SET_ACTIVE", payload: undefined })}
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
                  className="text-red-600 ml-auto hover:text-red-700"
                >
                  <FilterX className="size-4 mr-1" />
                  Reset All Filters
                </Button>
              )}
            </div>
          )}

          {/* Main Table */}
          <TableBox
            column={columns}
            checkbox={isSuperAdmin} // Only super admin can bulk delete
            action={true}
            loading={showTableLoading}
            data={tableData}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={(page) =>
              dispatch({ type: "SET_PAGE", payload: page })
            }
            status={false}
            deletehandler={isSuperAdmin ? deleteHandler : undefined} // Only super admin can delete
            edithandler={editHandler}
            height="max-h-[calc(100vh-380px)]"
            createdAt={true}
            updatedAt={true}
            customRenderers={{
              status: statusRenderer,
              company: companyRenderer,
              owners: ownersRender,
            }}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmationModel && (
        <ConfirmationBox
          onCancel={cancelDelete}
          onDelete={confirmDelete}
          title="Delete Companies"
          message={`Are you sure you want to delete ${selectedIdsForDeletion.length} company(ies)? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}

      {/* Add/Edit Company Modal */}
      {showAddModel && (
        <AddCompany
          onCancel={cancelAddCompany}
          selectedData={selectedData}
          isEditMode={isEditMode}
          refetch={refetch}
          isSuperAdmin={isSuperAdmin}
          currentMember={currentMember}
        />
      )}
    </Container>
  );
};

export default AllCompaniesPage;