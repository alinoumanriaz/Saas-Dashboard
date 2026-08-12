"use client";

import { useEffect, useReducer, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/user-filter-reducer";
import {
  DataListPage,
  FilterConfig,
} from "@/components/DataListPage";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import AddProduct from "@/components/popup/models/AddProduct.model";
import Image from "next/image";
import { DELETE_PRODUCTS, GET_PAGINATED_PRODUCTS } from "@/graphql/current-website-queries/product.query";

// --- Types ---
interface IProduct {
  id: string;
  name: string;
  slug: string;
  h1Tag?: string;
  metaTitle?: string;
  metaDescription?: string;
  description?: string;
  shortDescription?: string;
  specification?: any;
  imageUrl: string | { url: string; alt?: string } | string[];
  status?: string;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const ITEMS_PER_PAGE = 10;

// Helper to extract image URL from various formats
const getImageUrl = (field: any): string => {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (Array.isArray(field) && field.length > 0) {
    const first = field[0];
    if (typeof first === "string") return first;
    return first?.url || "";
  }
  if (typeof field === "object" && field.url) return field.url;
  return "";
};

const Page = () => {
  const companyCurrentWebsite = useAppSelector(
    (state) => state.companyCurrentWebsite.companyWebsite
  );
  const currentWebsiteId = companyCurrentWebsite?.id;

  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, searchText, status, isFeatured } = state;

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

  const [selectedData, setSelectedData] = useState<IProduct | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // GraphQL query for paginated products
  const { data, loading, error, refetch, networkStatus } = useQuery<any>(
    GET_PAGINATED_PRODUCTS,
    {
      variables: {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchText || undefined,
        status: status || undefined,
        isFeatured: isFeatured !== undefined ? isFeatured : undefined,
      },
      skip: !currentWebsiteId,
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  );

  const showTableLoading = (loading && networkStatus === 1) || !currentWebsiteId;

  // Delete mutation
  const [deleteProducts] = useMutation<any>(DELETE_PRODUCTS);

  const allProducts: IProduct[] =
    data?.getPaginatedProducts?.products || [];
  const totalProducts = data?.getPaginatedProducts?.totalProducts || 0;
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  console.log({allProducts:data})

  // Map data to include `id` for TableBox compatibility
  const productsData = allProducts.map((product) => ({
    ...product,
    id: product.id,
  }));

  // Optional stats – adapt as needed
  // const featuredCount = allProducts.filter(p => p.isFeatured).length;
  // const stats: StatsCard[] = [
  //   { label: "Total Products", value: totalProducts, icon: <Package className="h-5 w-5 text-blue-600" /> },
  //   { label: "Featured", value: featuredCount, icon: <Star className="h-5 w-5 text-yellow-600" /> },
  // ];

  // Filter configuration – supports "search", "select", etc.
  const filterConfig: FilterConfig[] = [
    {
      key: "search",
      type: "search",
      placeholder: "Search by name, slug, description...",
      label: "Search",
    },
    {
      key: "status",
      type: "select",
      label: "Status",
      options: [
        { value: "", label: "All Statuses" },
        { value: "published", label: "Published" },
        { value: "draft", label: "Draft" },
      ],
    },
    {
      key: "isFeatured",
      type: "select",
      label: "Featured",
      options: [
        { value: "", label: "All" },
        { value: "true", label: "Featured" },
        { value: "false", label: "Not Featured" },
      ],
    },
  ];

  const filterValues = {
    search: localSearch,
    status: status || "",
    isFeatured: isFeatured !== undefined ? String(isFeatured) : "",
  };

  const activeFiltersCount =
    (searchText && searchText.length > 0 ? 1 : 0) +
    (status ? 1 : 0) +
    (isFeatured !== undefined ? 1 : 0);

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
    if (selectedIdsForDeletion.length === 0) return;
    setIsDeleting(true);
    try {
      const { data } = await deleteProducts({
        variables: { ids: selectedIdsForDeletion },
      });
      if (data?.deleteProducts?.success) {
        toast.success(data.deleteProducts.message);
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeletion([]);
      } else {
        toast.error(data?.deleteProducts?.message || "Failed to delete products", {
          position: "top-center",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete products");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = (ids: string[]) => {
    setSelectedIdsForDeletion(ids);
    setShowConfirmationModel(true);
  };

  const editHandler = (product: any) => {
    const original = allProducts.find((p: any) => p.id === product.id) || product;
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

  // Table columns and custom renderers
  const columns = ["image", "name", "slug", "h1Tag", "metaTitle", "metaDescription", "description", "status", "isFeatured", "createdAt", "updatedAt"];

  const customRenderers = {
    image: (value: string, row: any) => (
      <div className="flex items-center justify-center">
        {row.imageUrl && (
          <Image
            src={getImageUrl(row.imageUrl)}
            alt={row.name}
            className="h-10 w-10 rounded object-cover"
            width={40}
            height={40}
          />
        )}
      </div>
    ),
    name: (value: string) => (
      <div className="font-medium max-w-30 truncate" title={value}>
        {value}
      </div>
    ),
    slug: (value: string) => (
      <div className="max-w-30 truncate" title={value}>
        {value}
      </div>
    ),
    h1Tag: (value: string) => value || "—",
    metaTitle: (value: string) => (
      <div className="max-w-30 truncate" title={value || ""}>
        {value || "—"}
      </div>
    ),
    metaDescription: (value: string) => (
      <div className="max-w-37.5 truncate" title={value || ""}>
        {value || "—"}
      </div>
    ),
    description: (value: string) => (
      <div className="max-w-37.5 truncate" title={value || ""}>
        {value || "—"}
      </div>
    ),
    status: (value: string) => (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          value === "published"
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {value || "draft"}
      </span>
    ),
    isFeatured: (value: boolean) => (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          value ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
        }`}
      >
        {value ? "Featured" : "No"}
      </span>
    ),
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
      title="Product Management"
      subtitle={<span>Total Products: {totalProducts}</span>}
      // stats={stats}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={(key, value) => {
        if (key === "search") {
          setLocalSearch(value || "");
        } else if (key === "status") {
          dispatch({ type: "SET_STATUS", payload: value || undefined });
        } else if (key === "isFeatured") {
          const val = value === "" ? undefined : value === "true";
          dispatch({ type: "SET_FEATURED", payload: val });
        }
      }}
      onResetFilters={handleResetFilters}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters(!showFilters)}
      activeFiltersCount={activeFiltersCount}
      onRefresh={() => refetch()}
      refreshing={showTableLoading}
      networkStatus={networkStatus}
      onAdd={addHandler}
      addLabel="Add Product"
      addDisabled={false}
      data={productsData}
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
          title="Delete Products"
          message={`Are you sure you want to delete ${selectedIdsForDeletion.length} product${
            selectedIdsForDeletion.length === 1 ? "" : "s"
          }? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={isDeleting}
        />
      )}

      {/* Add / Edit Modal */}
      {showAddModel && (
        <AddProduct
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