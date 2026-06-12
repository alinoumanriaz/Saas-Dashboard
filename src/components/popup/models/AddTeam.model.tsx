"use client";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  BiGroup, BiPlus, BiEdit, BiTrash, BiX, BiCheck,
  BiUser, BiEnvelope, BiPhone, BiSearch, BiShield,
  BiGlobe, BiCheckCircle, BiCopy, BiChevronDown, BiBuilding,
} from "react-icons/bi";
import {
  FiDatabase, FiUsers, FiRefreshCw, FiUserCheck,
  FiClock, FiLock, FiFileText,
} from "react-icons/fi";
import {
  MdAdminPanelSettings, MdDashboard, MdStore, MdCategory,
  MdDescription, MdShoppingCart, MdPhotoLibrary, MdRateReview,
  MdPeople, MdBusiness, MdGroup, MdLanguage, MdApps,
  MdApartment, MdPerson,
} from "react-icons/md";
import { Switch } from "@headlessui/react";
import Image from "next/image";
import Popup from "../Popup";

// Import from your data file
import {
  COMPANY_MODULES,
  APP_MODULES,
  Permission,
  MemberStatus,
  CompanyMemberRole,
} from "@/enums/common.enums";

import {
  AVAILABLE_MODULES,
  PERMISSION_OPTIONS,
  ROLE_BASED_DEFAULT_MODULES,
  ROLE_OPTIONS,
  STATUS_OPTIONS
} from "@/modules/modules";

type ModuleName = COMPANY_MODULES | APP_MODULES;

// ─── Types ────────────────────────────────────────────────────────────────────
interface IModuleAccess {
  name: ModuleName;
  canAccess: boolean;
  isActive: boolean;
  description?: string;
  permissions: Permission[];
}

interface TeamMember {
  id: string;
  memberId: string;
  memberDetails?: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    phone?: string;
  };
  role: CompanyMemberRole;
  status: MemberStatus;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  createdBy: string;
  modules?: IModuleAccess[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
}

interface AddTeamProps {
  companyId: string;
  teams: Team[];
  selectedTeam?: Team | null;
  onClose: () => void;
  onCreateTeam: any;
  onUpdateTeam: any;
  onDeleteTeam: (teamId: string) => Promise<void>;
  canManage: boolean;
  currentUserRole?: CompanyMemberRole;
  currentUserId?: string;
  availableMembers?: any[];
  membersLoading?: boolean;
  onSearchMembers?: (query: string) => void;
  onAddMemberToTeam?: (teamId: string, memberId: string, role: CompanyMemberRole) => Promise<void>;
  onRemoveMemberFromTeam?: (teamId: string, memberId: string) => Promise<void>;
  onUpdateMemberRole?: (teamId: string, memberId: string, role: CompanyMemberRole) => Promise<void>;
  refetch?: () => void;
}

// ─── Helper functions ────────────────────────────────────────────────────
const emptyModules = (): IModuleAccess[] =>
  AVAILABLE_MODULES.map((m) => ({
    name: m.name,
    canAccess: false,
    isActive: true,
    permissions: [],
    description: m.description,
  }));

const applyRoleToModules = (role: CompanyMemberRole): IModuleAccess[] => {
  const roleConfig = ROLE_BASED_DEFAULT_MODULES[role];
  const defaultMods = roleConfig.modules;
  const defaultPerms = roleConfig.permissions;

  return AVAILABLE_MODULES.map((m) => {
    const hasAccess = defaultMods.includes(m.name);
    return {
      name: m.name,
      canAccess: hasAccess,
      isActive: true,
      permissions: hasAccess ? [...defaultPerms] : [],
      description: m.description,
    };
  });
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AddTeam: React.FC<AddTeamProps> = ({
  companyId,
  teams,
  selectedTeam: externalSelectedTeam,
  onClose,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  canManage,
  currentUserRole = CompanyMemberRole.EMPLOYEE,
  currentUserId,
  availableMembers = [],
  membersLoading = false,
  onSearchMembers,
  onAddMemberToTeam,
  onRemoveMemberFromTeam,
  onUpdateMemberRole,
  refetch,
}) => {
  // ─── State ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    role: CompanyMemberRole.EMPLOYEE as CompanyMemberRole,
    modules: emptyModules(),
  });
  const [useRoleDefaults, setUseRoleDefaults] = useState(true);
  const [loading, setLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Members tab state
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleToAdd, setMemberRoleToAdd] = useState<CompanyMemberRole>(CompanyMemberRole.EMPLOYEE);
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState<any>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberRole, setEditingMemberRole] = useState<CompanyMemberRole>(CompanyMemberRole.EMPLOYEE);
  const [memberActionLoading, setMemberActionLoading] = useState(false);

  // ─── Role permission check ────────────────────────────────────────────────
  const canManageMembers =
    currentUserRole === CompanyMemberRole.OWNER ||
    currentUserRole === CompanyMemberRole.MANAGER ||
    currentUserRole === CompanyMemberRole.TEAM_LEAD;

  const canAssignRole = (role: CompanyMemberRole) => {
    if (currentUserRole === CompanyMemberRole.OWNER) return true;
    if (currentUserRole === CompanyMemberRole.MANAGER)
      return [CompanyMemberRole.EMPLOYEE, CompanyMemberRole.TEAM_LEAD].includes(role);
    if (currentUserRole === CompanyMemberRole.TEAM_LEAD)
      return role === CompanyMemberRole.EMPLOYEE;
    return false;
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: <BiGroup className="w-4 h-4" /> },
    { id: "modules", label: "Module Permissions", icon: <FiDatabase className="w-4 h-4" /> },
    { id: "members", label: "Members", icon: <FiUsers className="w-4 h-4" /> },
  ];

  // ─── Load edit data ───────────────────────────────────────────────────────
  useEffect(() => {
    if (externalSelectedTeam) {
      setEditingTeam(externalSelectedTeam);
      setFormData({
        name: externalSelectedTeam.name,
        description: externalSelectedTeam.description || "",
        isActive: externalSelectedTeam.isActive,
        role: CompanyMemberRole.EMPLOYEE,
        modules: externalSelectedTeam.modules?.length
          ? externalSelectedTeam.modules.map((m) => ({
              ...m,
              description: AVAILABLE_MODULES.find((am) => am.name === m.name)?.description || m.description || "",
            }))
          : emptyModules(),
      });
      setUseRoleDefaults(false);
    }
  }, [externalSelectedTeam]);

  // ─── Modules helpers ──────────────────────────────────────────────────────
  const handleModuleAccessChange = (moduleName: ModuleName, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.name === moduleName
          ? {
              ...m,
              canAccess: checked,
              permissions: checked && useRoleDefaults
                ? [...ROLE_BASED_DEFAULT_MODULES[formData.role].permissions]
                : checked ? m.permissions : [],
            }
          : m
      ),
    }));
  };

  const handlePermissionChange = (moduleName: ModuleName, permission: Permission, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.name === moduleName
          ? {
              ...m,
              permissions: checked
                ? [...m.permissions, permission]
                : m.permissions.filter((p) => p !== permission),
            }
          : m
      ),
    }));
  };

  const applyRoleDefaults = () => {
    setFormData((prev) => ({ ...prev, modules: applyRoleToModules(formData.role) }));
    toast.success("Role defaults applied");
  };

  const resetToRoleDefaults = () => {
    const confirm = window.confirm("Reset all permissions and modules to role defaults? This will overwrite current settings.");
    if (confirm) {
      applyRoleDefaults();
      toast.success("Reset to role defaults");
    }
  };

  const copyPermissionsToAllModules = () => {
    const confirm = window.confirm("Copy selected permissions to all enabled modules? This will overwrite module-specific permissions.");
    if (confirm) {
      const allPermissions = Array.from(
        new Set(formData.modules.flatMap(m => m.permissions))
      ) as Permission[];

      setFormData(prev => ({
        ...prev,
        modules: prev.modules.map(module => ({
          ...module,
          permissions: module.canAccess ? [...allPermissions] : []
        }))
      }));
      toast.success("Permissions copied to all enabled modules");
    }
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Team name is required");
      return;
    }
    setLoading(true);
    try {
      const modulesToSend = formData.modules
        .filter((m) => m.canAccess)
        .map((m) => ({
          name: m.name,
          description: m.description || "",
          canAccess: m.canAccess,
          permissions: m.permissions,
        }));

      let response;
      if (editingTeam) {
        response = await onUpdateTeam({
          variables: {
            id: editingTeam.id,
            input: {
              name: formData.name,
              description: formData.description,
              companyId,
              updatedBy: currentUserId,
              modules: modulesToSend,
              isActive: formData.isActive,
            },
          },
        });
        if (response.data?.updateTeam?.success) {
          toast.success("Team updated successfully");
        } else {
          toast.error(response.data?.updateTeam?.message || "Failed to update team");
        }
      } else {
        response = await onCreateTeam({
          variables: {
            input: {
              name: formData.name,
              description: formData.description,
              companyId,
              createdBy: currentUserId,
              modules: modulesToSend,
              isActive: formData.isActive,
            },
          },
        });
        if (response.data?.createTeam?.success) {
          toast.success("Team created successfully");
        } else {
          toast.error(response.data?.createTeam?.message || "Failed to create team");
        }
      }
      
      refetch?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!teamToDelete) return;
    try {
      await onDeleteTeam(teamToDelete);
      setShowDeleteConfirm(false);
      setTeamToDelete(null);
      toast.success("Team deleted successfully");
      refetch?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete team");
    }
  };

  // ─── Member actions ───────────────────────────────────────────────────────
  const handleAddMember = async () => {
    if (!selectedMemberToAdd || !editingTeam) return;
    setMemberActionLoading(true);
    try {
      await onAddMemberToTeam?.(editingTeam.id, selectedMemberToAdd.id, memberRoleToAdd);
      toast.success("Member added to team");
      setSelectedMemberToAdd(null);
      setMemberSearch("");
      refetch?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to add member");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!editingTeam) return;
    setMemberActionLoading(true);
    try {
      await onRemoveMemberFromTeam?.(editingTeam.id, memberId);
      toast.success("Member removed from team");
      refetch?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: CompanyMemberRole) => {
    if (!editingTeam) return;
    setMemberActionLoading(true);
    try {
      await onUpdateMemberRole?.(editingTeam.id, memberId, role);
      toast.success("Member role updated");
      setEditingMemberId(null);
      refetch?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to update member role");
    } finally {
      setMemberActionLoading(false);
    }
  };

  // ─── Search members ───────────────────────────────────────────────────────
  useEffect(() => {
    if (memberSearch) onSearchMembers?.(memberSearch);
  }, [memberSearch, onSearchMembers]);

  // ─── Render Helpers ───────────────────────────────────────────────────────
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

  // ─── BASIC INFO TAB ────────────────────────────────────────────────────────
  const renderBasicTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BiGroup className="mr-2 text-blue-600" />
          Team Details
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Team Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter team name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Describe this team's purpose (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white resize-none"
          />
        </div>
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
          <Switch
            checked={formData.isActive}
            onChange={(v) => setFormData({ ...formData, isActive: v })}
            className={`${formData.isActive ? "bg-blue-600" : "bg-gray-200"} relative inline-flex h-5 w-10 items-center rounded-full transition-colors`}
          >
            <span className={`${formData.isActive ? "translate-x-5" : "translate-x-1"} inline-block h-3 w-3 transform rounded-full bg-white transition`} />
          </Switch>
          <div>
            <p className="text-sm font-medium text-gray-900">Active Team</p>
            <p className="text-xs text-gray-500">Members can access this team's resources</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
            <BiBuilding className="mr-2 text-blue-600" />
            Company Information
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-blue-100">
              <span className="text-xs text-gray-500">Company ID</span>
              <span className="text-xs font-mono text-gray-800">{companyId}</span>
            </div>
            {editingTeam && (
              <>
                <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-blue-100">
                  <span className="text-xs text-gray-500">Team ID</span>
                  <span className="text-xs font-mono text-gray-800">{editingTeam.id}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-blue-100">
                  <span className="text-xs text-gray-500">Created</span>
                  <span className="text-xs text-gray-800">{new Date(editingTeam.createdAt).toLocaleDateString()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="text-sm font-semibold text-green-900 mb-2">Module Summary</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p>Enabled: {formData.modules.filter((m) => m.canAccess).length} / {formData.modules.length} modules</p>
            <p>Total Permissions: {formData.modules.reduce((s, m) => s + m.permissions.length, 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── MODULES TAB ──────────────────────────────────────────────────────────
  const renderModulesTab = () => (
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
          {formData.modules.map((module, index) => {
            const roleDefaults = ROLE_BASED_DEFAULT_MODULES[formData.role];
            const hasModule = roleDefaults?.modules.includes(module.name);
            const moduleConfig = AVAILABLE_MODULES.find(m => m.name === module.name);
            const ModuleIcon = moduleConfig?.icon || FiDatabase;

            return (
              <div key={module.name} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <Switch
                      checked={module.canAccess}
                      onChange={(checked) => handleModuleAccessChange(module.name, checked)}
                      className={`${module.canAccess ? "bg-blue-600" : "bg-gray-200"} relative inline-flex h-5 w-10 items-center rounded-full mr-3`}
                    >
                      <span
                        className={`${module.canAccess ? "translate-x-5" : "translate-x-1"} inline-block h-3 w-3 transform rounded-full bg-white transition`}
                      />
                    </Switch>
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${module.canAccess ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <ModuleIcon className={`w-5 h-5 ${module.canAccess ? 'text-blue-600' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h4 className="font-medium text-gray-900">{moduleConfig?.label || module.name}</h4>
                          {hasModule && useRoleDefaults && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                              Role default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{module.description}</p>
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
                        if (module.canAccess && hasModule && useRoleDefaults) {
                          const newModules = [...formData.modules];
                          newModules[index] = {
                            ...module,
                            permissions: [...roleDefaults.permissions]
                          };
                          setFormData(prev => ({ ...prev, modules: newModules }));
                          toast.success(`Reset ${module.name} to role defaults`);
                        } else if (module.canAccess) {
                          const newModules = [...formData.modules];
                          newModules[index] = { ...module, permissions: [] };
                          setFormData(prev => ({ ...prev, modules: newModules }));
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                      disabled={!module.canAccess}
                    >
                      {module.canAccess ? (hasModule && useRoleDefaults ? "Reset" : "Clear") : "Enable to configure"}
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
                        
                        return (
                          <label
                            key={permission.value}
                            className={`flex items-center p-2 rounded border cursor-pointer ${isRoleDefault && isModuleSpecific ? 'bg-blue-50' : 'bg-white'} ${isModuleSpecific ? 'border-blue-300' : 'border-gray-200 hover:border-gray-300'}`}
                            title={permission.description}
                          >
                            <input
                              type="checkbox"
                              checked={isModuleSpecific}
                              onChange={(e) => handlePermissionChange(module.name, permission.value, e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                              disabled={loading}
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
                              const newModules = [...formData.modules];
                              newModules[index] = { ...module, permissions: [] };
                              setFormData(prev => ({ ...prev, modules: newModules }));
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
                                  onClick={() => handlePermissionChange(module.name, permission, false)}
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
          <h4 className="font-medium text-green-900 mb-1">Access Summary</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p>Enabled Modules: {formData.modules.filter(m => m.canAccess).length} of {formData.modules.length}</p>
            <p>Total Permissions: {formData.modules.reduce((sum, module) => sum + module.permissions.length, 0)}</p>
            <div className="mt-2 pt-2 border-t border-green-200">
              <p className="font-medium">Role Defaults Applied:</p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="text-xs">
                  <span className="font-medium">Default Modules:</span>{' '}
                  {ROLE_BASED_DEFAULT_MODULES[formData.role]?.modules?.length || 0}
                </div>
                <div className="text-xs">
                  <span className="font-medium">Default Permissions:</span>{' '}
                  {ROLE_BASED_DEFAULT_MODULES[formData.role]?.permissions?.length || 0} per module
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── MEMBERS TAB ─────────────────────────────────────────────────────────
  const renderMembersTab = () => {
    const currentMembers = editingTeam?.members || [];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add member section */}
        {canManageMembers && editingTeam && (
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BiPlus className="mr-2 text-blue-600" />
              Add Member to Team
            </h3>
            
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search members by email..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              />
              <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Member search results */}
            {memberSearch && (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg mb-4 bg-white">
                {membersLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading members...</div>
                ) : availableMembers.length > 0 ? (
                  availableMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        setSelectedMemberToAdd(member);
                        setMemberSearch("");
                      }}
                      className={`w-full p-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 ${selectedMemberToAdd?.id === member.id ? "bg-blue-50" : ""}`}
                    >
                      {member.avatar ? (
                        <Image
                          src={member.avatar}
                          alt={member.username}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {(member.username || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{member.username || "Unknown"}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                      {selectedMemberToAdd?.id === member.id && (
                        <BiCheck className="w-5 h-5 text-blue-600" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <BiUser className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No members found</p>
                  </div>
                )}
              </div>
            )}

            {/* Selected member preview */}
            {selectedMemberToAdd && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedMemberToAdd.avatar ? (
                      <Image
                        src={selectedMemberToAdd.avatar}
                        alt={selectedMemberToAdd.username}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {(selectedMemberToAdd.username || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{selectedMemberToAdd.username}</p>
                      <p className="text-xs text-gray-600">{selectedMemberToAdd.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMemberToAdd(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <BiX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Role selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign Role</label>
              <div className="space-y-2">
                {ROLE_OPTIONS.filter(opt => canAssignRole(opt.value)).map((role) => {
                  const Icon = role.icon;
                  const isSelected = memberRoleToAdd === role.value;
                  return (
                    <label
                      key={role.value}
                      className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                          ? `border-${role.color}-300 bg-${role.color}-50`
                          : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="memberRole"
                        value={role.value}
                        checked={isSelected}
                        onChange={() => setMemberRoleToAdd(role.value)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center">
                          <div className={`p-1.5 rounded-lg bg-${role.color}-100 mr-2`}>
                            <Icon className={`w-4 h-4 text-${role.color}-600`} />
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{role.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-8">{role.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleAddMember}
              disabled={!selectedMemberToAdd || memberActionLoading}
              className={`w-full py-2 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center ${!selectedMemberToAdd || memberActionLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {memberActionLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <BiPlus className="mr-2" />
                  Add to Team
                </>
              )}
            </button>
          </div>
        )}

        {/* Current members list */}
        <div className={`bg-gray-50 p-5 rounded-lg border border-gray-200 ${!canManageMembers || !editingTeam ? "lg:col-span-2" : ""}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiUsers className="mr-2" />
            Team Members ({currentMembers.length})
          </h3>

          {!editingTeam ? (
            <div className="text-center py-12">
              <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Save the team first to manage members</p>
              <p className="text-sm text-gray-400 mt-1">Create the team, then you can add members</p>
            </div>
          ) : currentMembers.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No members in this team yet</p>
              {canManageMembers && (
                <p className="text-sm text-gray-400 mt-1">Use the form to add team members</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {currentMembers.map((tm) => {
                const member = tm.memberDetails;
                const roleOpt = ROLE_OPTIONS.find((r) => r.value === tm.role);
                const roleColor = roleOpt?.color || "gray";
                const isEditing = editingMemberId === tm.memberId;

                return (
                  <div key={tm.memberId} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {member?.avatar ? (
                          <Image
                            src={member.avatar}
                            alt={member.username || "User"}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                            {(member?.username || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{member?.username || "Unknown"}</p>
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <BiEnvelope className="mr-1 w-3 h-3" />
                            {member?.email}
                          </p>
                          {member?.phone && (
                            <p className="text-xs text-gray-400 flex items-center mt-0.5">
                              <BiPhone className="mr-1 w-3 h-3" />
                              {member.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${roleColor}-100 text-${roleColor}-700`}>
                          {renderRoleIcon(tm.role)}
                          <span className="ml-1">{roleOpt?.label || tm.role}</span>
                        </span>
                        {canManageMembers && (
                          <>
                            <button
                              onClick={() => {
                                setEditingMemberId(isEditing ? null : tm.memberId);
                                setEditingMemberRole(tm.role);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Change role"
                            >
                              <BiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveMember(tm.memberId)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove from team"
                            >
                              <BiTrash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-2">Change Role:</p>
                        <div className="flex flex-wrap gap-2">
                          {ROLE_OPTIONS.filter((r) => canAssignRole(r.value)).map((r) => {
                            const Icon = r.icon;
                            const isSelected = editingMemberRole === r.value;
                            return (
                              <button
                                key={r.value}
                                onClick={() => setEditingMemberRole(r.value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${isSelected
                                    ? `border-${r.color}-300 bg-${r.color}-50 text-${r.color}-700`
                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                  }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {r.label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleUpdateMemberRole(tm.memberId, editingMemberRole)}
                            disabled={memberActionLoading}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMemberId(null)}
                            className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <Popup>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-30 rounded-t-xl border-b border-gray-100">
          <div className="flex justify-between items-center px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTeam ? "Edit Team" : "Create New Team"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingTeam
                  ? "Update team details, modules, and members"
                  : "Set up a new team with modules and permissions"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.name.trim()}
                className={`px-4 py-2 text-white rounded-lg font-medium text-sm flex items-center ${loading || !formData.name.trim()
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 transition-colors"
                  }`}
              >
                {loading ? (
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
                    {editingTeam ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <BiCheckCircle className="mr-2" />
                    {editingTeam ? "Update Team" : "Create Team"}
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
          {activeTab === "basic" && renderBasicTab()}
          {activeTab === "modules" && renderModulesTab()}
          {activeTab === "members" && renderMembersTab()}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-50 rounded-full">
                <BiTrash className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Team</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm">
              Are you sure you want to delete this team? This action cannot be undone and all member associations will be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setTeamToDelete(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </Popup>
  );
};

export default AddTeam;