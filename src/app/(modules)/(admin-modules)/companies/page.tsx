"use client";
import { useEffect, useReducer, useState } from "react";
import { BiSearch, BiCheckCircle, BiXCircle } from "react-icons/bi";
import { useMutation, useQuery } from "@apollo/client/react";
import { DELETE_COMPANIES, GET_PAGINATED_COMPANIES } from "@/graphql/query/company.query";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/company-filter-reducer";
import { useAppSelector } from "@/redux/hooks";
import { CompanyMemberRole, PlatformRole } from "@/enums/common.enums";
import { Company } from "@/Types/company.types";
import { DataListPage, FilterConfig, StatsCard } from "@/components/DataListPage";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import AddCompany from "@/components/popup/models/AddCompany.model";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/helpers/getInitials";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

const AllCompaniesPage = () => {
  const currentCompanyMember = useAppSelector((state) => state?.currentCompanyMember?.companyMember);
  const currentMember = useAppSelector((state) => state?.currentMember?.member);
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, isActive, searchText } = state;

  // Local filter states for immediate UI feedback (used by DataListPage)
  const [localSearch, setLocalSearch] = useState<string>(searchText || "");
  const [localStatus, setLocalStatus] = useState<string>(
    isActive === undefined ? "all" : String(isActive)
  );

  // Debounce filter changes to reducer (with page reset)
  useEffect(() => {
    const timer = setTimeout(() => {
      const statusVal = localStatus === "all" ? undefined : localStatus === "true";
      dispatch({ type: "SET_SEARCH", payload: localSearch || "" });
      dispatch({ type: "SET_ACTIVE", payload: statusVal });
      dispatch({ type: "SET_PAGE", payload: 1 });
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, localStatus, dispatch]);

  const [selectedData, setSelectedData] = useState<Company | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const isSuperAdmin = currentMember?.role === PlatformRole.SUPER_ADMIN;
  const isOwner = currentCompanyMember?.role === CompanyMemberRole.OWNER;

  // Query – skip only if not super admin and no current company member
  const shouldSkip = !isSuperAdmin && !currentCompanyMember;

  const { data, loading, error, refetch, networkStatus } = useQuery<any>(GET_PAGINATED_COMPANIES, {
    variables: {
      page: Number(currentPage) || 1,
      limit: Number(ITEMS_PER_PAGE) || 10,
      isActive: isActive === undefined ? null : isActive,
      search: searchText || null,
    },
    fetchPolicy: "network-only",
    skip: shouldSkip,
  });

  const [deleteCompanies] = useMutation<any>(DELETE_COMPANIES);

  const showTableLoading = loading && networkStatus === 1;

  const allCompanies: Company[] = data?.getPaginatedCompanies?.companies || [];
  const totalCompanies = data?.getPaginatedCompanies?.totalCompaniesCount || 0;
  const totalPages = Math.ceil(totalCompanies / ITEMS_PER_PAGE);

  // Filter companies based on user role and tenant access (for display)
  const filteredCompanies = allCompanies.filter(company => {
    if (isSuperAdmin) return true;
    if (currentCompanyMember) {
      // Owner sees companies where they are in ownerIds
      return company.ownerIds?.includes(currentMember?.id || "");
    }
    return false;
  });

  // Stats
  const activeCount = filteredCompanies.filter(c => c.isActive).length;
  const inactiveCount = filteredCompanies.length - activeCount;

  const stats: StatsCard[] = [
    {
      label: "Total Companies",
      value: filteredCompanies.length,
      icon: <BiSearch />, // placeholder, can replace with a company icon
    },
    {
      label: "Active",
      value: activeCount,
      icon: <BiCheckCircle />,
    },
    {
      label: "Inactive",
      value: inactiveCount,
      icon: <BiXCircle />,
    },
  ];

  // Filter configuration for DataListPage
  const filterConfig: FilterConfig[] = [
    {
      key: "search",
      type: "search",
      placeholder: "Search companies...",
      label: "Search",
    },
    {
      key: "status",
      type: "select",
      placeholder: "All Status",
      label: "Status",
      options: [
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    },
  ];

  const filterValues = {
    search: localSearch,
    status: localStatus,
  };

  const activeFiltersCount = [
    isActive !== undefined,
    searchText && searchText.length > 0,
  ].filter(Boolean).length;

  // ---- Handlers ----
  const handleResetFilters = () => {
    setLocalSearch("");
    setLocalStatus("all");
    dispatch({ type: "RESET_FILTERS" });
  };

  const cancelDelete = () => {
    setSelectedIdsForDeletion([]);
    setShowConfirmationModel(false);
  };

  const confirmDelete = async () => {
    if (selectedIdsForDeletion.length === 0) return;

    if (!isSuperAdmin) {
      toast.error("Access denied");
      return;
    }

    try {
      const { data } = await deleteCompanies({
        variables: { ids: selectedIdsForDeletion },
      });

      if (data?.deleteCompanies?.success) {
        toast.success(data.deleteCompanies.message);
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeletion([]);
      } else {
        toast.error(data?.deleteCompanies?.message || "Failed to delete companies");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete companies");
    }
  };

  const deleteHandler = async (ids: string[]) => {
    if (!isSuperAdmin) {
      toast.error("Only super admins can delete companies");
      return;
    }
    setSelectedIdsForDeletion(ids);
    setShowConfirmationModel(true);
  };

  const editHandler = (companyData: Company) => {
    if (!isSuperAdmin && !isOwner) {
      toast.error("Only super admins, owners, and admins can edit companies");
      return;
    }
    if (!isSuperAdmin && !companyData.ownerIds?.includes(currentCompanyMember?.id || "")) {
      toast.error("You can only edit companies you own");
      return;
    }
    setIsEditMode(true);
    setSelectedData(companyData);
    setShowAddModel(true);
  };

  const addHandler = () => {
    if (!isSuperAdmin && !isOwner) {
      toast.error("Only super admins, owners, and admins can add companies");
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

  // ---- Custom renderers for TableBox ----
  const columns = ["company", "owners", "status", "number"];

  const customRenderers = {
    status: (_: string, value: boolean) => (
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
    ),
    company: (_: string, value: any) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage src={value.logo} alt={value.name} />
          <AvatarFallback>{getInitials(value.name)}</AvatarFallback>
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
    ),
    owners: (_: string, value: any) => {
      if (!value.ownerIds || value.ownerIds.length === 0) {
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
    },
  };

  // ---- TableBox configuration ----
  const tableBoxConfig = {
    column: columns,
    checkbox: isSuperAdmin, // Only super admin can bulk delete
    action: true,
    deletehandler: deleteHandler,
    edithandler: editHandler,
    height: "max-h-[calc(100vh-320px)]",
    createdAt: true,
    updatedAt: true,
    customRenderers,
  };

  // Determine if user can add companies
  const canAdd = isSuperAdmin || isOwner;

  // ---- Render ----
  return (
    <DataListPage
      title="Companies Management"
      subtitle={
        <span>
          Total Companies: {totalCompanies}
          {!isSuperAdmin && (
            <span className="ml-2 text-sm text-blue-600">
              (Showing {filteredCompanies.length} of {totalCompanies} – Your Companies)
            </span>
          )}
        </span>
      }
      stats={stats}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={(key, value) => {
        if (key === "search") setLocalSearch(value || "");
        else if (key === "status") setLocalStatus(value === undefined ? "all" : value);
      }}
      onResetFilters={handleResetFilters}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters(!showFilters)}
      activeFiltersCount={activeFiltersCount}
      onRefresh={() => refetch()}
      refreshing={showTableLoading}
      networkStatus={networkStatus}
      onAdd={addHandler}
      addLabel="Add Company"
      addDisabled={!canAdd}
      data={filteredCompanies}
      loading={showTableLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      setCurrentPage={(page) => dispatch({ type: "SET_PAGE", payload: page })}
      tableBoxConfig={tableBoxConfig}
      error={error}
      onRetry={() => refetch()}
      canManage={canAdd} // Used for add button and some UI hints
    >
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
    </DataListPage>
  );
};

export default AllCompaniesPage;