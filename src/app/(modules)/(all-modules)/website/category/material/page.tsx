"use client";

import { useEffect, useReducer, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/user-filter-reducer";
import { GET_PAGINATED_MATERIALS, DELETE_MATERIALS } from "@/graphql/current-website-queries/material.query";
import {
  DataListPage,
  FilterConfig,
} from "@/components/DataListPage";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import AddMaterial from "@/components/popup/models/AddMaterial.model";
import Image from "next/image";

// --- Types ---
interface IMaterial {
  id: string;
  name: string;
  slug: string;
  iconImageUrl: string | { url: string; alt?: string };
  imageUrl: string | { url: string; alt?: string };
  bannerImage: string | { url: string; alt?: string };
  description: string;
  content: string | any;
  createdAt?: string;
  updatedAt?: string;
}

const ITEMS_PER_PAGE = 10;

// Helper to extract image URL
const getImageUrl = (field: any): string => {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field.url || "";
};

const Page = () => {
  const companyCurrentWebsite = useAppSelector(
    (state) => state.companyCurrentWebsite.companyWebsite
  );
  const currentWebsiteId = companyCurrentWebsite?.id;

  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, searchText } = state;

  const [localSearch, setLocalSearch] = useState<string>(searchText || "");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: "SET_SEARCH", payload: localSearch || "" });
      dispatch({ type: "SET_PAGE", payload: 1 });
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, dispatch]);

  const [selectedData, setSelectedData] = useState<IMaterial | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, loading, error, refetch, networkStatus } = useQuery<any>(
    GET_PAGINATED_MATERIALS,
    {
      variables: {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchText || undefined,
      },
      skip: !currentWebsiteId,
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  );

  const showTableLoading = (loading && networkStatus === 1) || !currentWebsiteId;

  const [deleteMaterials] = useMutation<any>(DELETE_MATERIALS);

  const allMaterials: IMaterial[] =
    data?.getPaginatedMaterials?.materials || [];
  const totalMaterials = data?.getPaginatedMaterials?.totalMaterials || 0;
  const totalPages = Math.ceil(totalMaterials / ITEMS_PER_PAGE);

  console.log({allMaterials:allMaterials})

  // Map data to include `id` for TableBox compatibility
  const materialsData = allMaterials.map((material) => ({
    ...material,
    id: material.id,
  }));

  // const materialsWithContent = allMaterials.filter((m) => {
  //   const content = m.content;
  //   if (typeof content === "string") return content.trim().length > 0;
  //   if (content && typeof content === "object") return true;
  //   return false;
  // }).length;

  // Stats cards
  // const stats: StatsCard[] = [
  //   {
  //     label: "Total Materials",
  //     value: totalMaterials,
  //     icon: <Building className="h-5 w-5 text-blue-600" />,
  //   },
  //   {
  //     label: "With Content",
  //     value: materialsWithContent,
  //     icon: <CheckCircle className="h-5 w-5 text-green-600" />,
  //   },
  // ];

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: "search",
      type: "search",
      placeholder: "Search by name, slug, or description...",
      label: "Search",
    },
  ];

  const filterValues = {
    search: localSearch,
  };

  const activeFiltersCount = searchText && searchText.length > 0 ? 1 : 0;

  const handleResetFilters = () => {
    setLocalSearch("");
    dispatch({ type: "RESET_FILTERS" });
  };

  // Handlers
  const cancelDelete = () => {
    setSelectedIdsForDeletion([]);
    setShowConfirmationModel(false);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    if (selectedIdsForDeletion.length === 0) return;

    try {
      const { data } = await deleteMaterials({
        variables: { ids: selectedIdsForDeletion },
      });

      if (data?.deleteMaterials?.success) {
        console.log({deleetdata:data})
        toast.success(data.deleteMaterials.message, { position: "top-center" });
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeletion([]);
      } else {
        toast.error(data?.deleteMaterials?.message || "Failed to delete materials", {
          position: "top-center",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete materials", { position: "top-center" });
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = (ids: string[]) => {
    setSelectedIdsForDeletion(ids);
    setShowConfirmationModel(true);
  };

  const editHandler = (material: any) => {
    // Use the original material object (with _id)
    const original = allMaterials.find((m: any) => m.id === material.id) || material;
    setIsEditMode(true);
    setSelectedData(original);
    setShowAddModel(true);
  };

  const addHandler = () => {
    setSelectedData(null);
    setIsEditMode(false);
    setShowAddModel(true);
  };

  const cancelAdd = () => {
    setShowAddModel(false);
  };

  // Columns and custom renderers
  const columns = ["images", "name", "slug", "description", "content", "createdAt", "updatedAt"];

  const customRenderers = {
    images: (value: string, row: any) => (
      <div className="flex items-center gap-2">
        {row.iconImageUrl && (
          <Image
            src={getImageUrl(row.iconImageUrl)}
            alt={row.name}
            className="h-8 w-8 rounded object-cover"
            width={80}
            height={80}
          />
        )}
        {row.imageUrl && (
          <Image
            src={getImageUrl(row.imageUrl[0])}
            alt={row.name}
            className="h-8 w-8 rounded object-cover"
            width={80}
            height={80}
          />
        )}
        {row.bannerImage && (
          <Image
            src={getImageUrl(row.bannerImage)}
            alt={row.name}
            className="h-8 w-8 rounded object-cover"
            width={80}
            height={80}
          />
        )}
      </div>
    ),
    name: (value: string) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{value}</span>
      </div>
    ),
    description: (value: string) => (
      <div className="max-w-50 truncate" title={value || ""}>
        {value || "—"}
      </div>
    ),
    content: (value: any) => {
      if (!value) return "—";
      let display = "";
      if (typeof value === "string") {
        display = value;
      } else if (typeof value === "object") {
        display = value.text || value.content || JSON.stringify(value);
      }
      const truncated = display.length > 80 ? display.substring(0, 80) + "..." : display;
      return (
        <div className="max-w-50 truncate" title={display}>
          {truncated || "—"}
        </div>
      );
    },
    createdAt: (value: string) =>
      value ? new Date(value).toLocaleDateString() : "—",
    updatedAt: (value: string) =>
      value ? new Date(value).toLocaleDateString() : "—",
  };

  const tableBoxConfig = {
    column: columns,
    checkbox: true,
    action: true,
    deletehandler: deleteHandler,
    edithandler: editHandler,
    height: "max-h-[calc(100vh-180px)]",
    createdAt: false,
    updatedAt: false,
    customRenderers,
  };

  const canManage = true;

  return (
    <DataListPage
      title="Material Management"
      subtitle={<span>Total Materials: {totalMaterials}</span>}
      // stats={stats}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={(key, value) => {
        if (key === "search") setLocalSearch(value || "");
      }}
      onResetFilters={handleResetFilters}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters(!showFilters)}
      activeFiltersCount={activeFiltersCount}
      onRefresh={() => refetch()}
      refreshing={showTableLoading}
      networkStatus={networkStatus}
      onAdd={addHandler}
      addLabel="Add Material"
      addDisabled={false}
      data={materialsData}  // <-- use the mapped data with `id`
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
          title="Delete Materials"
          message={`Are you sure you want to delete ${selectedIdsForDeletion.length} material${
            selectedIdsForDeletion.length === 1 ? "" : "s"
          }? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={isDeleting}
        />
      )}

      {/* Add / Edit Modal */}
      {showAddModel && (
        <AddMaterial
          onCancel={cancelAdd}
          isEditMode={isEditMode}
          refetch={refetch}
          selectedData={selectedData}
        />
      )}
    </DataListPage>
  );
};

export default Page;