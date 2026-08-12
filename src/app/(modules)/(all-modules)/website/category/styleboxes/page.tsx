"use client";

import { useEffect, useReducer, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/user-filter-reducer";
import { GET_PAGINATED_STYLES, DELETE_STYLES } from "@/graphql/current-website-queries/style.query";
import {
  DataListPage,
  FilterConfig,
} from "@/components/DataListPage";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import AddStyle from "@/components/popup/models/AddStyle.model";
import Image from "next/image";

// --- Types ---
interface IStyle {
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

  const [selectedData, setSelectedData] = useState<IStyle | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, loading, error, refetch, networkStatus } = useQuery<any>(
    GET_PAGINATED_STYLES,
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

  const [deleteStyles] = useMutation<any>(DELETE_STYLES);

  const allStyles: IStyle[] =
    data?.getPaginatedStyles?.styles || [];
  const totalStyles = data?.getPaginatedStyles?.totalStyles || 0;
  const totalPages = Math.ceil(totalStyles / ITEMS_PER_PAGE);

  console.log({allStyles:allStyles})

  // Map data to include `id` for TableBox compatibility
  const stylesData = allStyles.map((style) => ({
    ...style,
    id: style.id,
  }));

  // const stylesWithContent = allStyles.filter((s) => {
  //   const content = s.content;
  //   if (typeof content === "string") return content.trim().length > 0;
  //   if (content && typeof content === "object") return true;
  //   return false;
  // }).length;

  // Stats cards
  // const stats: StatsCard[] = [
  //   {
  //     label: "Total Styles",
  //     value: totalStyles,
  //     icon: <Building className="h-5 w-5 text-blue-600" />,
  //   },
  //   {
  //     label: "With Content",
  //     value: stylesWithContent,
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
      const { data } = await deleteStyles({
        variables: { ids: selectedIdsForDeletion },
      });

      if (data?.deleteStyles?.success) {
        console.log({deleetdata:data})
        toast.success(data.deleteStyles.message);
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeletion([]);
      } else {
        toast.error(data?.deleteStyles?.message || "Failed to delete styles", {
          position: "top-center",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete styles");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = (ids: string[]) => {
    setSelectedIdsForDeletion(ids);
    setShowConfirmationModel(true);
  };

  const editHandler = (style: any) => {
    // Use the original style object (with _id)
    const original = allStyles.find((s: any) => s.id === style.id) || style;
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
      title="Style Management"
      subtitle={<span>Total Styles: {totalStyles}</span>}
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
      addLabel="Add Style"
      addDisabled={false}
      data={stylesData}  // <-- use the mapped data with `id`
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
          title="Delete Styles"
          message={`Are you sure you want to delete ${selectedIdsForDeletion.length} style${
            selectedIdsForDeletion.length === 1 ? "" : "s"
          }? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={isDeleting}
        />
      )}

      {/* Add / Edit Modal */}
      {showAddModel && (
        <AddStyle
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