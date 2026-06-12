"use client";
import { useEffect, useReducer, useState } from "react";
import {
  BiSearch,
  BiUser,
  BiBuilding,
  BiGlobe,
  BiLock,
  BiLockOpen,
  BiCheckCircle,
  BiXCircle,
  BiTime
} from "react-icons/bi";
import {
  FiShield,
  FiUserCheck,
  FiUserX,
  FiClock,
  FiUsers,
  FiSettings,
  FiDatabase,
  FiCode
} from "react-icons/fi";
import { MdAdminPanelSettings, MdOutlineManageAccounts } from "react-icons/md";
import TableBox from "@/components/tablebox/TableBox";
import Container from "@/components/Container";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/company-member-filter-reducer";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import { toast } from "react-toastify";
import { useAppSelector } from "@/redux/hooks";
import { BsArrowClockwise } from "react-icons/bs";
import AddCompanyMember from "@/components/popup/models/AddCompanyMember.model";
import { GET_PAGINATED_COMPANY_MEMBERS, REMOVE_COMPANY_MEMBERS } from "@/graphql/query/company-member.query";
import { CompanyMemberRole, MemberStatus, COMPANY_MODULES, APP_MODULES} from "@/enums/common.enums";
import { CompanyMember } from "@/Types/companyMember.types";

const ITEMS_PER_PAGE = 10;

type ModuleName = COMPANY_MODULES | APP_MODULES;

interface IModuleAccess {
  moduleName: ModuleName;
  canAccess: boolean;
  permissions: string[];
}

// Module icons mapping
const moduleIcons: Record<string, React.ElementType> = {
  USER_MANAGEMENT: FiUsers,
  COMPANY_SETTINGS: FiSettings,
  DASHBOARD: FiDatabase,
  REPORTS: FiCode,
  WEBSITE_MANAGEMENT: BiGlobe,
  ANALYTICS: FiDatabase,
  BILLING: FiSettings,
  API_ACCESS: FiSettings,
  WEBSITES: FiSettings,
  COMPANY_MEMBER: FiSettings,
  MEMBERS: FiSettings,
  TEAM: FiSettings,
  SETTINGS: FiSettings
};

// Module display names
const moduleDisplayNames: Record<string, string> = {
  USER_MANAGEMENT: "User Management",
  COMPANY_SETTINGS: "Company Settings",
  DASHBOARD: "Dashboard",
  REPORTS: "Reports",
  WEBSITE_MANAGEMENT: "Website Management",
  ANALYTICS: "Analytics",
  BILLING: "Billing",
  API_ACCESS: "API Access",
  WEBSITES: "Websites",
  COMPANY_MEMBER: "Company Members",
  MEMBERS: "Members",
  TEAM: "Team",
  SETTINGS: "Settings"
};

const CompanyMembersPage = () => {
  const currentCompanyMember = useAppSelector((state) => state.currentCompanyMember.companyMember);

  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, role, status, searchText } = state;
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeleteion, setSelectedIdsForDeleteion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedMemberModules, setSelectedMemberModules] = useState<IModuleAccess[]>([]);
  const [showModulesModal, setShowModulesModal] = useState(false);

  useEffect(()=>{
    console.log({selectedData:selectedData})
  },[selectedData])

  // Get company ID from the companyMember object
  const companyId = currentCompanyMember?.company?.id;

  // Get team ID from the companyMember object (if available)
  const teamId = currentCompanyMember?.team?.id || "";

  // Check user permissions
  const canManageTeam = currentCompanyMember?.role
    ? [
      CompanyMemberRole.OWNER,
      CompanyMemberRole.MANAGER
    ].includes(currentCompanyMember.role as CompanyMemberRole)
    : false;

  const isOwnerOrAdmin = currentCompanyMember?.role
    ? [
      CompanyMemberRole.OWNER,
    ].includes(currentCompanyMember.role as CompanyMemberRole)
    : false;

  const isOwner = currentCompanyMember?.role === CompanyMemberRole.OWNER;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, loading, error, refetch } = useQuery<any>(GET_PAGINATED_COMPANY_MEMBERS, {
    variables: {
      companyId: companyId,
      page: Number(currentPage) || 1,
      limit: Number(ITEMS_PER_PAGE) || 10,
      role: role || undefined,
      status: status || undefined,
      search: debouncedSearch || undefined,
    },
    fetchPolicy: "network-only",
    skip: !companyId,
  });

  const [removeCompanyMembers] = useMutation<any>(REMOVE_COMPANY_MEMBERS);

  const alldata: CompanyMember[] = data?.getPaginatedCompanyMembers?.companyMembers || [];
  const totalMembers = data?.getPaginatedCompanyMembers?.totalCompanyMembersCount || 0;
  const totalPages = Math.ceil(totalMembers / ITEMS_PER_PAGE);

  console.log({ CurrentCompanyyyyyMMMmeberalldata: alldata });

  // Define how to extract member information for the TableBox
  const memberData = {
    avatar: 'member.avatar',  // Path to avatar in the data object
    email: 'member.email',     // Path to email in the data object
    username: 'member.username' // Path to username in the data object
  };

  console.log({memberData:memberData})

  // Calculate module access stats
  const moduleStats = alldata.reduce((acc, member) => {
    member.modules?.forEach(module => {
      if (module.canAccess) {
        acc[module.name] = (acc[module.name] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const columns = ["role", "status", "modulesCount", "websitesCount"];

  const cancelDelete = () => {
    setSelectedIdsForDeleteion([]);
    setShowConfirmationModel(false);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    if (selectedIdsForDeleteion.length === 0) return;

    if (!canManageTeam) {
      toast.error("You don't have permission to remove team members");
      setIsDeleting(false);
      return;
    }

    // Check if trying to delete owners (only owners can delete owners)
    const ownersToDelete = alldata.filter(m =>
      selectedIdsForDeleteion.includes(m.id as string) &&
      m.role === CompanyMemberRole.OWNER
    );

    if (ownersToDelete.length > 0 && !isOwner) {
      toast.error("Only owners can delete other owners");
      setIsDeleting(false);
      return;
    }
    console.log({selectedIdsForDeleteion:selectedIdsForDeleteion})

    try {
      const { data, error } = await removeCompanyMembers({
        variables: { ids: selectedIdsForDeleteion },
      });

      if(error){
        console.log({error:error})
      }

      if (data?.removeCompanyMembers?.success) {
        toast.success(data.removeCompanyMembers.message);
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeleteion([]);
      } else {
        toast.error(data?.removeCompanyMember?.message || "Failed to remove members");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to remove members");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = async (ids: string[]) => {
    // Check if user has permission
    if (!canManageTeam) {
      toast.error("You don't have permission to delete team members");
      return;
    }

    // Check if trying to delete owners
    const ownersToDelete = alldata.filter((m: any) => ids.includes(m.id) && m.companyMemberRole === CompanyMemberRole.OWNER);
    if (ownersToDelete.length > 0 && !isOwner) {
      toast.error("Only owners can delete members with OWNER role");
      return;
    }

    setSelectedIdsForDeleteion(ids);
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

  const viewModulesHandler = (memberData: any) => {
    setSelectedMemberModules(memberData.modules || []);
    setShowModulesModal(true);
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

  const closeModulesModal = () => {
    setShowModulesModal(false);
    setSelectedMemberModules([]);
  };

  // Get role options
  const getRoleOptions = () => {
    const options = [
      { value: "", label: "All Roles" },
      { value: CompanyMemberRole.OWNER, label: "Owner" },
      { value: CompanyMemberRole.MANAGER, label: "Manager" },
      { value: CompanyMemberRole.TEAM_LEAD, label: "Team Lead" },
      { value: CompanyMemberRole.EMPLOYEE, label: "Employee" },
    ];

    // Only owners can see/filter by OWNER role
    if (!isOwner) {
      return options.filter(opt => opt.value !== CompanyMemberRole.OWNER && opt.value !== "");
    }
    return options;
  };

  // Get status options
  const getStatusOptions = () => {
    return [
      { value: "", label: "All Status" },
      { value: MemberStatus.ACTIVE, label: "Active" },
      { value: MemberStatus.INACTIVE, label: "Inactive" },
      { value: MemberStatus.SUSPENDED, label: "Suspended" },
      { value: MemberStatus.PENDING, label: "Pending" },
    ];
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: MemberStatus }) => {
    const statusConfig: any = {
      [MemberStatus.ACTIVE]: { bg: "bg-green-100", text: "text-green-800", icon: FiUserCheck, label: "Active" },
      [MemberStatus.INACTIVE]: { bg: "bg-gray-100", text: "text-gray-800", icon: FiUserX, label: "Inactive" },
      [MemberStatus.SUSPENDED]: { bg: "bg-red-100", text: "text-red-800", icon: FiUserX, label: "Suspended" },
      [MemberStatus.PENDING]: { bg: "bg-yellow-100", text: "text-yellow-800", icon: FiClock, label: "Pending" },
    };

    const config = statusConfig[status] || statusConfig[MemberStatus.PENDING];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </span>
    );
  };

  // Role badge component
  const RoleBadge = ({ role }: { role: CompanyMemberRole }) => {
    const roleConfig = {
      [CompanyMemberRole.OWNER]: { bg: "bg-purple-100", text: "text-purple-800", icon: MdAdminPanelSettings },
      [CompanyMemberRole.MANAGER]: { bg: "bg-blue-100", text: "text-blue-800", icon: FiUsers },
      [CompanyMemberRole.TEAM_LEAD]: { bg: "bg-green-100", text: "text-green-800", icon: FiUsers },
      [CompanyMemberRole.EMPLOYEE]: { bg: "bg-gray-100", text: "text-gray-800", icon: BiUser },
    };

    const config = roleConfig[role] || roleConfig[CompanyMemberRole.EMPLOYEE];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="mr-1 h-3 w-3" />
        {role.replace('_', ' ')}
      </span>
    );
  };

  // Modules badge component
  const ModulesBadge = ({ count, total }: { count: number; total: number }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    let bgColor = "bg-gray-100";
    let textColor = "text-gray-800";

    if (percentage >= 75) {
      bgColor = "bg-green-100";
      textColor = "text-green-800";
    } else if (percentage >= 50) {
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
    } else if (percentage >= 25) {
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        <BiLock className="mr-1 h-3 w-3" />
        {count}/{total} Modules
      </span>
    );
  };

  return (
    <Container className="overflow-y-auto h-full">
      <div className="w-full h-full text-[13px]">
        <div className="w-full h-full overflow-hidden px-4">
          {/* Header Section */}
          <div className="flex justify-between items-center py-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">Company Members</h1>
              <p className="text-gray-600">
                {currentCompanyMember?.company?.name} - Total Members: {totalMembers}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => refetch()}
                className="px-4 py-2 cursor-pointer rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <BsArrowClockwise className={`${loading ? "animate-spin" : ""} size-4`} />
                <span>Refresh</span>
              </button>
              {canManageTeam && (
                <button
                  onClick={addHandler}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Add Team Member
                </button>
              )}
            </div>
          </div>

          {/* Filter Section */}
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  onChange={(e) =>
                    dispatch({
                      type: "SET_ROLE",
                      payload: e.target.value || undefined,
                    })
                  }
                  value={role || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {getRoleOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    dispatch({
                      type: "SET_STATUS",
                      payload: val || undefined,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {getStatusOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
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
                    placeholder="Search by name or email..."
                    type="text"
                    value={searchText}
                  />
                  <BiSearch className="absolute size-5 left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <BiUser className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <FiUserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {alldata.filter(m => m.status === MemberStatus.ACTIVE).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <BiLockOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Modules Access</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(moduleStats).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                  <BiBuilding className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Websites</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {alldata.reduce((acc, m) => acc + (m.websites?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Table */}
          {error ? (
            <div className="p-4 text-red-500 bg-red-50 rounded-lg">
              <div className="font-semibold">Error loading company members</div>
              <div className="text-sm mt-1">{error.message}</div>
              <button
                onClick={() => refetch()}
                className="mt-3 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <TableBox
                member={memberData}
                column={columns}
                checkbox={canManageTeam}
                action={canManageTeam}
                loading={loading}
                data={alldata}
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
                customRenderers={{
                  companyMemberRole: (value: CompanyMemberRole) => <RoleBadge role={value} />,
                  companyMemberStatus: (value: MemberStatus) => <StatusBadge status={value} />,
                  modulesCount: (value: number, row: any) => (
                    <button
                      onClick={() => viewModulesHandler(row)}
                      className="hover:opacity-80 transition-opacity"
                      title="Click to view module details"
                    >
                      <ModulesBadge count={value} total={row.totalModules} />
                    </button>
                  ),
                  websitesCount: (value: number) => (
                    <span className="inline-flex items-center">
                      <BiGlobe className="mr-1 h-4 w-4 text-gray-400" />
                      {value}
                    </span>
                  ),
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modules Access Modal */}
      {showModulesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Module Access Details</h2>
              <button
                onClick={closeModulesModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {selectedMemberModules.map((module, index) => {
                  const Icon = moduleIcons[module.moduleName] || FiSettings;
                  const hasAccess = module.canAccess;

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${hasAccess ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${hasAccess ? 'bg-green-100' : 'bg-gray-200'
                            }`}>
                            <Icon className={`w-5 h-5 ${hasAccess ? 'text-green-600' : 'text-gray-600'
                              }`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {moduleDisplayNames[module.moduleName] || module.moduleName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Access: {hasAccess ? (
                                <span className="text-green-600 font-medium">Granted</span>
                              ) : (
                                <span className="text-gray-500">Not Granted</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {hasAccess ? (
                          <BiCheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <BiXCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {hasAccess && module.permissions && module.permissions.length > 0 && (
                        <div className="mt-3 ml-11">
                          <p className="text-xs font-medium text-gray-500 mb-2">Permissions:</p>
                          <div className="flex flex-wrap gap-2">
                            {module.permissions.map((permission, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-white rounded-md text-xs text-gray-700 border border-gray-200"
                              >
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {selectedMemberModules.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No modules assigned to this member
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end p-6 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={closeModulesModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModel && (
        <ConfirmationBox
          onCancel={cancelDelete}
          onDelete={confirmDelete}
          title="Remove Team Members"
          message={`Are you sure you want to remove ${selectedIdsForDeleteion.length} team member(s)? This action cannot be undone.`}
          confirmText="Remove"
          cancelText="Cancel"
          loading={isDeleting}
        />
      )}

      {/* Add/Edit Team Member Modal */}
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