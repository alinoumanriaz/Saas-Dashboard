"use client";
import { useReducer, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  DELETE_CUSTOM_MODULES,
  GET_PAGINATED_CUSTOM_MODULES,
  UPDATE_ALL_MEMBER_CUSTOM_MODULES,
} from "@/graphql/query/module.query";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/module-filter-reducer";
import { useAppSelector } from "@/redux/hooks";
import { PlatformRole } from "@/enums/common.enums";
import { Module } from "@/Types/module.types";
import { DataListPage, FilterConfig, StatsCard } from "@/components/DataListPage";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import AddModule from "@/components/popup/models/AddModule.model";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { DynamicIcon } from "@/helpers/LucidIconFinder";
import { Calendar } from "lucide-react";

const ITEMS_PER_PAGE = 8;

const Page = () => {
  const currentMember = useAppSelector((state) => state.currentMember.member);
  const [toggleOverrides, setToggleOverrides] = useState<Record<string, boolean>>({});
  const [loadingSwitches, setLoadingSwitches] = useState<Record<string, boolean>>({});
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // optional if you add filters

  const isSuperAdmin = currentMember?.role === PlatformRole.SUPER_ADMIN;
  const isAdmin = currentMember?.role === PlatformRole.ADMIN;
  const canManage = isSuperAdmin || isAdmin;

  const [deleteCustomModules] = useMutation<any>(DELETE_CUSTOM_MODULES);
  const [updateAllMemberCustomModules] = useMutation<any>(UPDATE_ALL_MEMBER_CUSTOM_MODULES);

  const { data, loading, error, refetch, networkStatus } = useQuery<any>(GET_PAGINATED_CUSTOM_MODULES, {
    variables: {
      page: state.currentPage,
      limit: Number(ITEMS_PER_PAGE) || 10,
    },
    fetchPolicy: "network-only",
  });

  const showTableLoading = loading && networkStatus === 2;

  const allModules: Module[] = data?.getPaginatedCustomModules?.customModules || [];
  const totalModules = data?.getPaginatedCustomModules?.totalCustomModulesCount || 0;
  const totalPages = Math.ceil(totalModules / ITEMS_PER_PAGE);

  const tableData = allModules.map((module) => ({
    ...module,
  }));

  // ---- Stats ----
  const stats: StatsCard[] = [
    {
      label: "Total Modules",
      value: totalModules,
      icon: <Calendar className="h-4 w-4" />,
    },
  ];

  // ---- Filters (optional; set empty if not needed) ----
  const filterConfig: FilterConfig[] = [
    // You can add a search filter here if desired
    // {
    //   key: "search",
    //   type: "search",
    //   placeholder: "Search modules...",
    //   label: "Search",
    // },
  ];
  const filterValues = {};
  const activeFiltersCount = 0;
  const handleResetFilters = () => {};
  const handleFilterChange = () => {};

  // ---- Handlers ----
  const cancelDelete = () => {
    setSelectedIdsForDeletion([]);
    setShowConfirmationModel(false);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    if (selectedIdsForDeletion.length === 0) return;

    if (!canManage) {
      toast.error("Access denied", { position: "top-center" });
      setIsDeleting(false);
      return;
    }

    try {
      const { data, error } = await deleteCustomModules({
        variables: { ids: selectedIdsForDeletion },
      });

      if (data?.deleteCustomModules?.success) {
        toast.success(data.deleteCustomModules.message, { position: "top-center" });
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeletion([]);
      } else {
        toast.error(data?.deleteCustomModules?.message || "Failed to delete modules", {
          position: "top-center",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete modules", { position: "top-center" });
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = async (ids: string[]) => {
    setSelectedIdsForDeletion(ids);
    setShowConfirmationModel(true);
  };

  const editHandler = (moduleData: any) => {
    if (!canManage) {
      toast.error("You don't have permission to edit modules", { position: "top-center" });
      return;
    }
    setIsEditMode(true);
    setSelectedData(moduleData);
    setShowAddModel(true);
  };

  const addHandler = () => {
    setSelectedData(null);
    setIsEditMode(false);
    setShowAddModel(true);
  };

  const cancelAddModule = () => {
    setShowAddModel(false);
  };

  // ---- Switch handlers ----
  const handleToggleDefault = async (
    moduleId: string,
    field: string,
    newValue: boolean
  ) => {
    const key = `${moduleId}-${field}`;

    setLoadingSwitches((prev) => ({ ...prev, [key]: true }));

    setToggleOverrides((prev) => ({
      ...prev,
      [key]: newValue,
    }));

    try {
      await updateAllMemberCustomModules({
        variables: {
          id: moduleId,
          field,
          value: newValue,
        },
      });
      // Optionally refetch to get fresh data
      // refetch();
    } catch (err: any) {
      setToggleOverrides((prev) => ({
        ...prev,
        [key]: !newValue,
      }));
      toast.error(err.message || "Failed to update module", { position: "top-center" });
    } finally {
      setLoadingSwitches((prev) => ({ ...prev, [key]: false }));
    }
  };

  // ---- TableBox configuration ----
  const columns = ["moduleName", "moduleType", "superAdmin", "owner", "admin"];

  const customRenderers = {
    moduleName: (value: string, row: any) => (
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <DynamicIcon name={row.moduleIcon} className="size-4 text-muted-foreground" />
        </div>
        <div>
          <div className="font-medium text-primary">{value}</div>
          <div className="text-gray-400">{row.route}</div>
        </div>
      </div>
    ),
    superAdmin: (value: boolean, row: any) => (
      <Field orientation="horizontal" data-disabled className="w-fit">
        <Switch
          checked={
            toggleOverrides[`${row.id}-isDefaultForSuperAdmin`] ??
            row.isDefaultForSuperAdmin
          }
          disabled={loadingSwitches[`${row.id}-isDefaultForSuperAdmin`]}
          onCheckedChange={(checked) =>
            handleToggleDefault(row.id, "isDefaultForSuperAdmin", checked)
          }
        />
      </Field>
    ),
    admin: (value: boolean, row: any) => (
      <Field orientation="horizontal" data-disabled className="w-fit">
        <Switch
          checked={
            toggleOverrides[`${row.id}-isDefaultForAdmin`] ??
            row.isDefaultForAdmin
          }
          disabled={loadingSwitches[`${row.id}-isDefaultForAdmin`]}
          onCheckedChange={(checked) =>
            handleToggleDefault(row.id, "isDefaultForAdmin", checked)
          }
        />
      </Field>
    ),
    owner: (value: boolean, row: any) => (
      <Field orientation="horizontal" data-disabled className="w-fit">
        <Switch
          checked={
            toggleOverrides[`${row.id}-isDefaultForOwner`] ??
            row.isDefaultForOwner
          }
          disabled={loadingSwitches[`${row.id}-isDefaultForOwner`]}
          onCheckedChange={(checked) =>
            handleToggleDefault(row.id, "isDefaultForOwner", checked)
          }
        />
      </Field>
    ),
  };

  const tableBoxConfig = {
    column: columns,
    checkbox: true,
    action: true,
    deletehandler: deleteHandler,
    edithandler: editHandler,
    height: "max-h-[calc(100vh-320px)]",
    createdAt: false,
    updatedAt: false,
    customRenderers,
  };

  // ---- Render ----
  return (
    <DataListPage
      title="Module Management"
      subtitle={<span>Total Modules: {totalModules}</span>}
      stats={stats}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      onResetFilters={handleResetFilters}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters(!showFilters)}
      activeFiltersCount={activeFiltersCount}
      onRefresh={() => refetch()}
      refreshing={showTableLoading}
      networkStatus={networkStatus}
      onAdd={addHandler}
      addLabel="Create Module"
      addDisabled={!canManage}
      data={tableData}
      loading={showTableLoading}
      currentPage={state.currentPage}
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
          title="Delete Modules"
          message={`Are you sure you want to delete ${selectedIdsForDeletion.length} module(s)? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={isDeleting}
        />
      )}

      {/* Add/Edit Module Modal */}
      {showAddModel && (
        <AddModule
          onCancel={cancelAddModule}
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