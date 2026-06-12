"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import {
  BiUser, BiEnvelope, BiPhone, BiLock, BiShield, BiKey,
  BiImage, BiCheckCircle, BiCalendar, BiIdCard, BiMap,
  BiBriefcase, BiBuilding, BiWallet, BiCog, BiPlus, BiX,
  BiChevronDown, BiChevronUp, BiCopy, BiReset, BiGlobe,
  BiLockAlt, BiCheck,
  BiSearch
} from "react-icons/bi";
import {
  FiX, FiUpload, FiGlobe, FiCreditCard, FiShield as FiShieldIcon,
  FiDatabase, FiBarChart2, FiUsers, FiRefreshCw, FiUserCheck,
  FiClock, FiLock, FiGrid, FiShoppingBag, FiFileText, FiFolder,
  FiImage, FiStar, FiLayers
} from "react-icons/fi";
import { MdAdminPanelSettings, MdOutlineManageAccounts, MdDashboard, MdStore, MdCategory, MdDescription, MdShoppingCart, MdPhotoLibrary, MdRateReview, MdPeople, MdBusiness, MdGroup, MdLanguage, MdApps, MdApartment, MdPerson } from "react-icons/md";
import { Switch } from "@headlessui/react";
import { CompanyMemberRole, MemberStatus, APP_MODULES, COMPANY_MODULES, Permission } from "@/enums/common.enums";
import { CREATE_COMPANY_MEMBER, UPDATE_COMPANY_MEMBER } from "@/graphql/query/company-member.query";
import { GET_WEBSITES_BY_COMPANY_ID } from "@/graphql/query/website.query";
import { GET_GLOBLE_MEMBERS } from "@/graphql/query/member.query";
import Popup from "../Popup";
import InputBox from "@/components/InputBox";
import Image from "next/image";
import { useAppSelector } from "@/redux/hooks";
import { AVAILABLE_MODULES, PERMISSION_OPTIONS, ROLE_BASED_DEFAULT_MODULES, ROLE_OPTIONS, STATUS_OPTIONS } from "@/modules/modules";
import { ModuleAccess, ModuleName } from "@/Types/common.types";

interface ICompanyMemberInput {
  memberId: string;
  companyId: string;
  teamId?: string;
  role: CompanyMemberRole;
  status: MemberStatus;
  modules: ModuleAccess[];
  websiteIds: string[];
}

interface AddCompanyMemberProps {
  onCancel: () => void;
  selectedData?: any | null;
  isEditMode: boolean;
  refetch: () => void;
  currentCompanyId: string;
  currentTeamId?: string;
  currentUserRole?: CompanyMemberRole;
}


console.log({ROLE_BASED_DEFAULT_MODULES:ROLE_BASED_DEFAULT_MODULES})


const AddCompanyMember: React.FC<AddCompanyMemberProps> = ({
  onCancel,
  selectedData,
  isEditMode,
  refetch,
  currentCompanyId,
  currentTeamId,
  currentUserRole,
}) => {
  const [form, setForm] = useState<ICompanyMemberInput>({
    memberId: "",
    companyId: currentCompanyId,
    teamId: currentTeamId || "",
    role: CompanyMemberRole.EMPLOYEE,
    status: MemberStatus.PENDING,
    modules: AVAILABLE_MODULES.map(module => ({
      name: module.name,
      canAccess: false,
      isActive: true,
      permissions: [],
      description: module.description,
    })),
    websiteIds: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [searchTerm, setSearchTerm] = useState("");
  const [useRoleDefaults, setUseRoleDefaults] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const selectedCompanyMember = useAppSelector((state) => state.currentCompanyMember.companyMember);
  const currentCompanyMember = selectedCompanyMember?.member?.id;

  const tabs = [
    { id: "basic", label: "Basic Info", icon: <BiUser className="w-4 h-4" /> },
    { id: "role", label: "Role & Status", icon: <BiShield className="w-4 h-4" /> },
    { id: "modules", label: "Module Permissions", icon: <FiDatabase className="w-4 h-4" /> },
    { id: "websites", label: "Website Access", icon: <BiGlobe className="w-4 h-4" /> },
  ];


  // Fetch available members
  const { data: membersData, loading: membersLoading, error: membersError } = useQuery<any>(GET_GLOBLE_MEMBERS, {
    variables: {
      excludeCurrentMember: currentCompanyMember,
      email: searchTerm || undefined,
    },
    skip: !searchTerm,
  });

  if (membersError) {
    console.log({ error: membersError });
  }

  // Fetch available websites
  const { data: websitesData, loading: websitesLoading, error: websitesError } = useQuery<any>(GET_WEBSITES_BY_COMPANY_ID, {
    variables: { companyId: currentCompanyId },
    skip: !currentCompanyId,
  });

  if (websitesError) {
    console.log(websitesError)
  }

  console.log({ currentCompanyId: currentCompanyId })
  console.log({ websitesData: websitesData })

  const [createCompanyMember] = useMutation<any>(CREATE_COMPANY_MEMBER);
  const [updateCompanyMember] = useMutation<any>(UPDATE_COMPANY_MEMBER);

  // Apply role defaults when role changes
  const applyRoleDefaults = (role: CompanyMemberRole) => {
    if (!useRoleDefaults) return;

    const defaults = ROLE_BASED_DEFAULT_MODULES[role];
    if (!defaults) return;
    
    const defaultModules = AVAILABLE_MODULES.map(availModule => {
      const hasModule = defaults.modules.includes(availModule.name);
      return {
        name: availModule.name,
        canAccess: hasModule,
        isActive: true,
        permissions: hasModule ? [...defaults.permissions] : [],
        description: availModule.description,
      };
    });
    
    console.log({defaultModules:defaultModules})

    setForm(prev => ({
      ...prev,
      modules: defaultModules,
      status: defaults.defaultStatus,
    }));
  };

  // Load selected data in edit mode
  useEffect(() => {
    if (selectedData && isEditMode) {

      console.log({selectedData:selectedData})
      // Find the selected member details
      if (selectedData.member) {
        setSelectedMember(selectedData.member);
      }

      setForm({
        memberId: selectedData.member?.id || selectedData.memberId || "",
        companyId: currentCompanyId,
        teamId: selectedData?.team?.id || currentTeamId || "",
        role: selectedData.role || CompanyMemberRole.EMPLOYEE,
        status: selectedData.status || MemberStatus.PENDING,
        modules: selectedData.modules?.length
          ? selectedData.modules.map((mod: any) => ({
              ...mod,
              description: AVAILABLE_MODULES.find(m => m.name === mod.name)?.description || mod.description,
            }))
          : AVAILABLE_MODULES.map(module => ({
              name: module.name,
              canAccess: false,
              isActive: true,
              permissions: [],
              description: module.description,
            })),
        websiteIds: selectedData.websites?.map((w: any) => w.id || w._id || w) || [],
      });
      setUseRoleDefaults(false);
    }
  }, [selectedData, isEditMode, currentCompanyId, currentTeamId]);

  // Check permissions for role assignment
  const canAssignRole = (role: CompanyMemberRole) => {
    if (currentUserRole === CompanyMemberRole.OWNER) return true;
    if (currentUserRole === CompanyMemberRole.MANAGER) {
      return [CompanyMemberRole.EMPLOYEE, CompanyMemberRole.TEAM_LEAD].includes(role);
    }
    return false;
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === 'role') {
      const newRole = value as CompanyMemberRole;
      setForm(prev => ({ ...prev, role: newRole }));

      if (useRoleDefaults) {
        applyRoleDefaults(newRole);
      }
      return;
    }

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked } as any));
    } else {
      setForm((prev) => ({ ...prev, [name]: value } as any));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleMemberSelect = (member: any) => {
    setSelectedMember(member);
    setForm(prev => ({ ...prev, memberId: member.id }));
  };

  const handleModuleAccessChange = (moduleName: ModuleName, checked: boolean) => {
    setForm(prev => {
      const modules = prev.modules.map(module => {
        if (module.name === moduleName) {
          // If enabling module and using role defaults, get default permissions
          if (checked && useRoleDefaults) {
            const roleDefaults = ROLE_BASED_DEFAULT_MODULES[form.role];
            const hasModule = roleDefaults?.modules.includes(moduleName);
            return {
              ...module,
              canAccess: checked,
              permissions: hasModule ? [...roleDefaults.permissions] : []
            };
          }
          return { ...module, canAccess: checked };
        }
        return module;
      });
      return { ...prev, modules };
    });
  };

  const handleModulePermissionChange = (moduleName: ModuleName, permission: Permission, checked: boolean) => {
    setForm(prev => {
      const modules = prev.modules.map(module => {
        if (module.name === moduleName) {
          const permissions = checked
            ? [...module.permissions, permission]
            : module.permissions.filter(p => p !== permission);
          return { ...module, permissions };
        }
        return module;
      });
      return { ...prev, modules };
    });
  };

  const handleWebsiteToggle = (websiteId: string) => {
    setForm(prev => ({
      ...prev,
      websiteIds: prev.websiteIds.includes(websiteId)
        ? prev.websiteIds.filter(id => id !== websiteId)
        : [...prev.websiteIds, websiteId]
    }));
  };

  const handleSelectAllWebsites = () => {
    if (websitesData?.getWebsitesByCompanyId) {
      setForm(prev => ({
        ...prev,
        websiteIds: websitesData.getWebsitesByCompanyId.map((w: any) => w.id)
      }));
    }
  };

  const handleSelectNoneWebsites = () => {
    setForm(prev => ({ ...prev, websiteIds: [] }));
  };

  const resetToRoleDefaults = () => {
    const confirm = window.confirm("Reset all permissions and modules to role defaults? This will overwrite current settings.");
    if (confirm) {
      applyRoleDefaults(form.role);
      toast.success("Reset to role defaults");
    }
  };

  const copyPermissionsToAllModules = () => {
    const confirm = window.confirm("Copy selected permissions to all enabled modules? This will overwrite module-specific permissions.");
    if (confirm) {
      // Get all permissions that are selected across any module
      const allPermissions = Array.from(
        new Set(form.modules.flatMap(m => m.permissions))
      ) as Permission[];

      setForm(prev => ({
        ...prev,
        modules: prev.modules.map(module => ({
          ...module,
          permissions: module.canAccess ? [...allPermissions] : []
        }))
      }));
      toast.success("Permissions copied to all enabled modules");
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.memberId) {
      newErrors.memberId = "Please select a member";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    setLoading(true);

    try {
      // Filter out modules without access
      const modulesToSend = form.modules
        .filter(m => m.canAccess)
        .map(m => ({
          name: m.name,
          description: m.description || "",
          canAccess: m.canAccess,
          permissions: m.permissions,
        }));

      const input = {
        memberId: form.memberId,
        companyId: form.companyId,
        teamId: form.teamId || undefined,
        role: form.role,
        status: form.status,
        modules: modulesToSend,
        websites: form.websiteIds,
      };

      console.log({input:input})
      let response;
      if (isEditMode && selectedData?.id) {
        response = await updateCompanyMember({
          variables: {
            id: selectedData.id,
            input: {
              ...input,
              id: selectedData.id
            }
          },
        });
      } else {
        response = await createCompanyMember({
          variables: { input: input },
        });
      }

      console.log({response})

      if (response.data?.createCompanyMember || response.data?.updateCompanyMember) {
        toast.success(isEditMode ? "Member updated successfully" : "Member added successfully");
        refetch();
        onCancel();
      } else {
        toast.error("Operation failed");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || membersLoading || websitesLoading;

  // Get available members
  const availableMembers = membersData?.getGlobleMember || [];

  console.log({ availableMembers: availableMembers })

  const renderRoleIcon = (role: CompanyMemberRole) => {
    switch (role) {
      case CompanyMemberRole.OWNER:
        return <MdAdminPanelSettings className="w-5 h-5 text-purple-600" />;
      case CompanyMemberRole.MANAGER:
        return <FiUsers className="w-5 h-5 text-blue-600" />;
      case CompanyMemberRole.TEAM_LEAD:
        return <FiUsers className="w-5 h-5 text-green-600" />;
      case CompanyMemberRole.EMPLOYEE:
        return <BiUser className="w-5 h-5 text-gray-600" />;
      default:
        return <BiUser className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <Popup>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-30 rounded-t-xl border-b border-gray-100">
          <div className="flex justify-between items-center px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? "Edit Company Member" : "Add Company Member"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode
                  ? "Update member details and permissions"
                  : "Add a new member to your company"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !form.memberId}
                className={`px-4 py-2 text-white rounded-lg font-medium text-sm flex items-center ${isLoading || !form.memberId
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 transition-colors"
                  }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    {isEditMode ? (
                      <>
                        <BiCheckCircle className="mr-2" />
                        Update Member
                      </>
                    ) : (
                      <>
                        <BiPlus className="mr-2" />
                        Add Member
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 bg-blue-50">
            <nav className="flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 rounded-t-lg transition-colors text-sm font-medium ${activeTab === tab.id
                      ? "bg-white text-blue-700 border-t-2 border-x-2 border-gray-200 border-b-0 -mb-px"
                      : "text-gray-600 hover:text-blue-600"
                    }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BiUser className="mr-2" />
                    Select Member
                  </h3>

                  {/* Search */}
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Search members by email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>

                  {/* Member List */}
                  <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                    {membersLoading ? (
                      <div className="p-4 text-center text-gray-500">Loading members...</div>
                    ) : availableMembers && availableMembers.length > 0 ? (
                      availableMembers.map((member: any) => (
                        <button
                          key={member.id}
                          onClick={() => handleMemberSelect(member)}
                          className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 ${form.memberId === member.id ? "bg-blue-50" : ""
                            }`}
                        >
                          <div className="shrink-0">
                            {member.avatar ? (
                              <Image
                                src={member.avatar}
                                alt={member.username}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                                {(member.username || "U").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900">
                              {member.username || "Unknown"}
                            </p>
                            <p className="text-sm text-gray-600">{member.email}</p>
                            {member.phone && (
                              <p className="text-xs text-gray-500 mt-1">{member.phone}</p>
                            )}
                          </div>
                          {form.memberId === member.id && (
                            <BiCheck className="w-5 h-5 text-blue-600" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <BiUser className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No members found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Create a member first in the Members section
                        </p>
                      </div>
                    )}
                  </div>

                  {errors.memberId && (
                    <p className="text-xs text-red-500 mt-2">{errors.memberId}</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Selected Member Preview */}
                {selectedMember && (
                  <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-medium text-blue-900 mb-4 flex items-center">
                      <BiCheckCircle className="mr-2 text-blue-600" />
                      Selected Member
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="shrink-0">
                        {selectedMember.avatar ? (
                          <Image
                            src={selectedMember.avatar}
                            alt={selectedMember.fullName || selectedMember.username}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-full object-cover ring-4 ring-white"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                            {(selectedMember.fullName || selectedMember.username || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedMember.fullName || selectedMember.username || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-700 flex items-center mt-1">
                          <BiEnvelope className="mr-1" />
                          {selectedMember.email}
                        </p>
                        {selectedMember.phone && (
                          <p className="text-sm text-gray-700 flex items-center mt-1">
                            <BiPhone className="mr-1" />
                            {selectedMember.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Info */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BiBuilding className="mr-2" />
                    Company Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-600">Company ID</span>
                      <span className="text-sm font-mono text-gray-900">{currentCompanyId}</span>
                    </div>
                    {currentTeamId && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-600">Team ID</span>
                        <span className="text-sm font-mono text-gray-900">{currentTeamId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Role & Status Tab */}
          {activeTab === "role" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <BiShield className="mr-2" />
                      Company Role
                    </h3>
                    {/* {!isEditMode && ( */}
                      <div className="flex items-center">
                        <Switch
                          checked={useRoleDefaults}
                          onChange={setUseRoleDefaults}
                          className={`${useRoleDefaults ? "bg-blue-600" : "bg-gray-200"
                            } relative inline-flex h-5 w-10 items-center rounded-full mr-2`}
                        >
                          <span
                            className={`${useRoleDefaults ? "translate-x-5" : "translate-x-1"
                              } inline-block h-3 w-3 transform rounded-full bg-white transition`}
                          />
                        </Switch>
                        <span className="text-sm text-gray-600">Use role defaults</span>
                      </div>
                    {/* )} */}
                  </div>
                  <div className="space-y-3">
                    {ROLE_OPTIONS.filter(opt => canAssignRole(opt.value)).map((role) => {
                      const Icon = role.icon;
                      const isSelected = form.role === role.value;
                      return (
                        <label
                          key={role.value}
                          className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all ${isSelected
                              ? `border-${role.color}-300 bg-${role.color}-50`
                              : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role.value}
                            checked={isSelected}
                            onChange={handleInputChange}
                            className="mt-1 text-blue-600 focus:ring-blue-500"
                            disabled={isLoading}
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg bg-${role.color}-100 mr-2`}>
                                <Icon className={`w-5 h-5 text-${role.color}-600`} />
                              </div>
                              <span className="font-medium text-gray-900">
                                {role.label}
                              </span>
                              {useRoleDefaults && isSelected && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                  Defaults applied
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-2 ml-12">
                              {role.description}
                            </p>
                            {useRoleDefaults && isSelected && (
                              <div className="mt-2 ml-12 text-xs text-gray-500">
                                <span className="font-medium">
                                  {ROLE_BASED_DEFAULT_MODULES[role.value]?.modules?.length || 0} modules enabled
                                </span>
                                {' · '}
                                <span className="font-medium">
                                  {ROLE_BASED_DEFAULT_MODULES[role.value]?.permissions?.length || 0} permissions per module
                                </span>
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <BiCheck className={`w-5 h-5 text-${role.color}-600`} />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiClock className="mr-2" />
                    Status
                  </h3>
                  <div className="space-y-3">
                    {STATUS_OPTIONS.map((status) => {
                      const Icon = status.icon;
                      const isSelected = form.status === status.value;
                      return (
                        <label
                          key={status.value}
                          className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all ${isSelected
                              ? `border-${status.color}-300 bg-${status.color}-50`
                              : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                          <input
                            type="radio"
                            name="status"
                            value={status.value}
                            checked={isSelected}
                            onChange={handleInputChange}
                            className="mt-1 text-blue-600 focus:ring-blue-500"
                            disabled={isLoading}
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg bg-${status.color}-100 mr-2`}>
                                <Icon className={`w-5 h-5 text-${status.color}-600`} />
                              </div>
                              <span className="font-medium text-gray-900">
                                {status.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2 ml-12">
                              {status.description}
                            </p>
                          </div>
                          {isSelected && (
                            <BiCheck className={`w-5 h-5 text-${status.color}-600`} />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {isEditMode && (
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <button
                      onClick={resetToRoleDefaults}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FiRefreshCw className="mr-2" />
                      Reset to Role Defaults
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === "modules" && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiDatabase className="mr-2" />
                    Module Permissions
                  </h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={copyPermissionsToAllModules}
                      className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50"
                      title="Copy to all enabled modules"
                    >
                      <BiCopy className="mr-1" />
                      Copy to All Modules
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Configure permissions for each module individually. Each module has its own set of permissions.
                  </p>
                </div>

                <div className="space-y-4">
                  {form.modules.map((module, index) => {
                    const roleDefaults = ROLE_BASED_DEFAULT_MODULES[form.role];
                    const hasModule = roleDefaults?.modules.includes(module.name);
                    const hasRoleDefaults = hasModule;
                    const moduleConfig = AVAILABLE_MODULES.find(m => m.name === module.name);
                    const ModuleIcon = moduleConfig?.icon || FiDatabase;

                    return (
                      <div key={module.name} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                          <div className="flex items-center">
                            <Switch
                              checked={module.canAccess}
                              onChange={(checked) => handleModuleAccessChange(module.name, checked)}
                              className={`${module.canAccess ? "bg-blue-600" : "bg-gray-200"
                                } relative inline-flex h-5 w-10 items-center rounded-full mr-3`}
                            >
                              <span
                                className={`${module.canAccess ? "translate-x-5" : "translate-x-1"
                                  } inline-block h-3 w-3 transform rounded-full bg-white transition`}
                              />
                            </Switch>
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg mr-3 ${module.canAccess ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                <ModuleIcon className={`w-5 h-5 ${module.canAccess ? 'text-blue-600' : 'text-gray-500'}`} />
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <h4 className="font-medium text-gray-900">{moduleConfig?.label || module.name}</h4>
                                  {hasRoleDefaults && useRoleDefaults && (
                                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                      Role default
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {module.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {module.canAccess && (
                              <span className="text-sm text-gray-600">
                                {module.permissions.length} permissions
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (module.canAccess && hasRoleDefaults && useRoleDefaults) {
                                  // Reset to role defaults
                                  const newModules = [...form.modules];
                                  newModules[index] = {
                                    ...module,
                                    permissions: [...roleDefaults.permissions]
                                  };
                                  setForm(prev => ({ ...prev, modules: newModules }));
                                  toast.success(`Reset ${module.name} to role defaults`);
                                } else if (module.canAccess) {
                                  // Clear module permissions
                                  const newModules = [...form.modules];
                                  newModules[index] = { ...module, permissions: [] };
                                  setForm(prev => ({ ...prev, modules: newModules }));
                                }
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800"
                              disabled={!module.canAccess}
                            >
                              {module.canAccess ? (hasRoleDefaults && useRoleDefaults ? "Reset" : "Clear") : "Enable to configure"}
                            </button>
                          </div>
                        </div>

                        {module.canAccess && (
                          <div className="p-4 bg-gray-50">
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Module Permissions
                              </label>
                              <div className="text-xs text-gray-500 mb-2">
                                {module.permissions.length === 0
                                  ? "No permissions set"
                                  : `${module.permissions.length} permission(s) selected`}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {PERMISSION_OPTIONS.map(permission => {
                                const isModuleSpecific = module.permissions.includes(permission.value);
                                const isRoleDefault = roleDefaults?.permissions.includes(permission.value);

                                let bgColor = "bg-white";
                                if (isRoleDefault && isModuleSpecific) bgColor = "bg-blue-50";

                                return (
                                  <label
                                    key={permission.value}
                                    className={`flex items-center p-2 rounded border cursor-pointer ${bgColor} ${isModuleSpecific ? 'border-blue-300' : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                    title={permission.description}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isModuleSpecific}
                                      onChange={(e) => handleModulePermissionChange(module.name, permission.value, e.target.checked)}
                                      className="rounded text-blue-600 focus:ring-blue-500"
                                      disabled={isLoading}
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                      {permission.label}
                                      {isRoleDefault && !isModuleSpecific && (
                                        <span className="ml-1 text-xs text-blue-600">(role)</span>
                                      )}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                            {module.permissions.length > 0 && (
                              <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-medium text-blue-900">
                                    Selected Permissions ({module.permissions.length})
                                  </p>
                                  <button
                                    onClick={() => {
                                      const newModules = [...form.modules];
                                      newModules[index] = { ...module, permissions: [] };
                                      setForm(prev => ({ ...prev, modules: newModules }));
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    Clear All
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {module.permissions.map((permission) => {
                                    const permLabel = PERMISSION_OPTIONS.find(p => p.value === permission)?.label || permission;
                                    return (
                                      <span
                                        key={permission}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                      >
                                        {permLabel}
                                        <button
                                          type="button"
                                          onClick={() => handleModulePermissionChange(module.name, permission, false)}
                                          className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                          <BiX className="w-3 h-3" />
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-1">
                    Access Summary
                  </h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>
                      Enabled Modules: {form.modules.filter(m => m.canAccess).length} of {form.modules.length}
                    </p>
                    <p>
                      Total Permissions: {form.modules.reduce((sum, module) => sum + module.permissions.length, 0)}
                    </p>
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="font-medium">Role Defaults Applied:</p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="text-xs">
                          <span className="font-medium">Default Modules:</span>{' '}
                          {ROLE_BASED_DEFAULT_MODULES[form.role]?.modules?.length || 0}
                        </div>
                        <div className="text-xs">
                          <span className="font-medium">Default Permissions:</span>{' '}
                          {ROLE_BASED_DEFAULT_MODULES[form.role]?.permissions?.length || 0} per module
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Websites Tab */}
          {activeTab === "websites" && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BiGlobe className="mr-2" />
                    Website Access
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAllWebsites}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                      disabled={!websitesData?.getWebsitesByCompanyId?.length}
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleSelectNoneWebsites}
                      className="px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {websitesLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading websites...</p>
                  </div>
                ) : websitesData?.getWebsitesByCompanyId?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {websitesData.getWebsitesByCompanyId.map((website: any) => {
                      const isSelected = form.websiteIds.includes(website.id);
                      return (
                        <button
                          key={website.id}
                          onClick={() => handleWebsiteToggle(website.id)}
                          className={`p-4 border rounded-lg flex items-start space-x-3 transition-all ${isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <BiGlobe className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                              {website.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{website.domain}</p>
                            {website.status && (
                              <p className="text-xs text-gray-400 mt-1">
                                Status: {website.status}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <BiCheck className="w-5 h-5 text-blue-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BiGlobe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No websites found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Create a website first in the Websites section
                    </p>
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Selected Websites</p>
                      <p className="text-xs text-blue-700 mt-1">
                        {form.websiteIds.length} of {websitesData?.getWebsitesByCompanyId?.length || 0} websites selected
                      </p>
                    </div>
                    {form.websiteIds.length > 0 && (
                      <button
                        onClick={() => setForm(prev => ({ ...prev, websiteIds: [] }))}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
};

export default AddCompanyMember;