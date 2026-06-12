// src/app/admin/all-companies/page.tsx
"use client";
import { useEffect, useReducer, useState } from "react";
import { BiSearch, BiBuilding, BiCheckCircle, BiXCircle } from "react-icons/bi";
import TableBox from "@/components/tablebox/TableBox";
import Container from "@/components/Container";
import { useMutation, useQuery } from "@apollo/client/react";
import { DELETE_COMPANIES, GET_PAGINATED_COMPANIES } from "@/graphql/query/company.query";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/company-filter-reducer";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import { toast } from "react-toastify";
import AddCompany from "@/components/popup/models/AddCompany.model";
import { useAppSelector } from "@/redux/hooks";
import { BsArrowClockwise } from "react-icons/bs";
import { CompanyMemberRole, PlatformRole } from "@/enums/common.enums";
import { Company } from "@/Types/company.types";
import Image from "next/image";

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

  const isSuperAdmin = currentMember?.role === PlatformRole.SUPER_ADMIN;
  const isOwner = currentCompanyMember?.role === CompanyMemberRole.OWNER;
  console.log({ isOwner: isOwner })
  console.log({ isSuperAdmin: isSuperAdmin })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, loading, error, refetch } = useQuery<any>(GET_PAGINATED_COMPANIES, {
    variables: {
      page: Number(currentPage) || 1,
      limit: Number(ITEMS_PER_PAGE) || 10,
      isActive: isActive === undefined ? null : isActive,
      search: debouncedSearch || null,
    },
    fetchPolicy: "network-only",
    skip: !currentCompanyMember, // Skip if no current member
  });

  const [deleteCompanies] = useMutation<any>(DELETE_COMPANIES);

  const allCompanies: Company[] = data?.getPaginatedCompanies?.companies || [];
  const totalCompanies = data?.getPaginatedCompanies?.totalCompaniesCount || 0;
  const totalPages = Math.ceil(totalCompanies / ITEMS_PER_PAGE);

  // Filter companies based on user role and tenant access
  const filteredCompanies = allCompanies.filter(company => {
    // Super admin sees all companies
    if (isSuperAdmin) return true;

    // Owner see only companies they own
    if (currentCompanyMember) {
      return company.ownerIds?.includes(currentMember?.id || "");
    }

    return false;
  });

  console.log({ filteredCompanies: filteredCompanies })


  const columns = ["company", "status", "number"];

  const cancelDelete = () => {
    setSelectedIdsForDeletion([]);
    setShowConfirmationModel(false);
  };

  const confirmDelete = async () => {
    if (selectedIdsForDeletion.length === 0) return;

    // Security check for non-superadmins
    if (!isSuperAdmin) {
      const companiesToDelete = filteredCompanies.filter(company =>
        selectedIdsForDeletion.includes(company?.id || "")
      );

      console.log({ companiesToDelete: companiesToDelete })

      const hasUnauthorizedDelete = companiesToDelete.some(company =>
        !company.ownerIds?.includes(currentCompanyMember?.member?.id || "")
      );

      if (hasUnauthorizedDelete) {
        toast.error("You can only delete companies you own");
        return;
      }
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
    setSelectedIdsForDeletion(ids);
    setShowConfirmationModel(true);
  };

  const editHandler = (companyData: Company) => {
    // Check if user has permission to edit
    if (!isSuperAdmin && !isOwner) {
      toast.error("Only super admins, owners, and admins can edit companies");
      return;
    }

    // Check if user owns this company (for non-super admins)
    if (!isSuperAdmin && !companyData.ownerIds?.includes(currentCompanyMember?.id || "")) {
      toast.error("You can only edit companies you own");
      return;
    }

    setIsEditMode(true);
    setSelectedData(companyData);
    setShowAddModel(true);
  };

  const addHandler = () => {
    // Check if user has permission to add
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

  // Custom renderer for status column
  const statusRenderer = (_: string, value: boolean) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value
      ? 'bg-green-100 text-green-800'
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

  // Custom renderer for company name with logo
  const companyRenderer = (_: string, value: any) => (
    <div className="flex items-center space-x-3">
      {/* Avatar */}
      <div className="shrink-0">
        {value ? (
          <Image
            src={value?.logo || '/userAvater.jpg'}
            alt={value?.name || "Company"}
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10 ring-2 ring-gray-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center ring-2 ring-gray-200">
            <span className="text-gray-500 text-sm font-medium">
              {value?.name?.charAt(0)?.toUpperCase() || "C"}
            </span>
          </div>
        )}
      </div>

      {/* Email and Username */}
      <div>
        <div className="font-medium text-gray-900">
          {value?.name || "Unknown"}
        </div>
        <div className="text-xs text-gray-600">
          {value?.email || "No email"}
        </div>
      </div>
    </div>
  );

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
          <div className="flex justify-between items-center py-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
              <p className="text-gray-600 flex items-center">
                <span>Total Companies: {totalCompanies}</span>
                {!isSuperAdmin && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs">
                    Showing {filteredCompanies.length} of {totalCompanies} (Your Companies)
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="px-4 py-2 cursor-pointer rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BsArrowClockwise className={`${loading ? "animate-spin" : ""} size-4`} />
                <span>Refresh</span>
              </button>
              {(isSuperAdmin || isOwner) && (
                <button
                  onClick={addHandler}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Add Company
                </button>
              )}
            </div>
          </div>

          {/* Filter Section - Only show for Super Admin */}
          {isSuperAdmin && (
            <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    onChange={(e) =>
                      dispatch({
                        type: "SET_ACTIVE",
                        payload: e.target.value === "" ? undefined : e.target.value === "true",
                      })
                    }
                    value={isActive === undefined ? "" : String(isActive)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                {/* Search Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <input
                      onChange={(e) =>
                        dispatch({ type: "SET_SEARCH", payload: e.target.value })
                      }
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Search by company name or email..."
                      type="text"
                      value={searchText}
                    />
                    <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                  <button
                    onClick={() => dispatch({ type: "RESET_FILTERS" })}
                    className="w-full px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <BiBuilding className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {isSuperAdmin ? 'Total Companies' : 'Your Companies'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isSuperAdmin ? totalCompanies : filteredCompanies.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <BiCheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Companies</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(isSuperAdmin ? allCompanies : filteredCompanies).filter(c => c.isActive).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <TableBox
              column={columns}
              checkbox={isSuperAdmin} // Only super admin can bulk delete
              action={true}
              loading={loading}
              data={filteredCompanies}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={(page) =>
                dispatch({ type: "SET_PAGE", payload: page })
              }
              status={false}
              deletehandler={isSuperAdmin || isOwner ? deleteHandler : undefined} // Only super admin can delete
              edithandler={editHandler}
              height="max-h-[calc(100vh-380px)]"
              createdAt={true}
              updatedAt={true}
              customRenderers={{
                status: statusRenderer,
                company: companyRenderer,
              }}
            />
          </div>
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