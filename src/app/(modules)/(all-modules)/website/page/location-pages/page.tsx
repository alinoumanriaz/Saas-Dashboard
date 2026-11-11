"use client"
import { DataListPage, FilterConfig } from "@/components/DataListPage";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import AddlocationPage from "@/components/popup/models/LocationPage.model";
import { DELETE_LOCATION_PAGES, GET_PAGINATED_LOCATION_PAGES } from "@/graphql/current-website-queries/location-page.query";
import { useAppSelector } from "@/redux/hooks";
import { filterReducer, initialFilterState } from "@/useReducerHooks/filter-reducer";
import { useMutation, useQuery } from "@apollo/client/react";
import Image from "next/image";
import { useEffect, useReducer, useState } from "react";
import { toast } from "sonner";

interface IFaq {
  question: string;
  answer: string;
  order: number;
}

interface IBoxContent {
  boxTitle: string;
  boxContent: string;
  rightImage: {
    url: string;
    alt: string;
  };
}

interface ILocationPage {
  id: string;
  name: string;
  slug: string;
  h1Tag: string;
  metaTitle: string;
  metaDescription: string;
  shortDescription: string;
  content: string;
  box: IBoxContent;
  status: "draft" | "published";
  author: {
    id: string;
    name: string;
  };
  image: {
    url: string;
    alt: string;
  };
  faqs: IFaq[];
  createdAt: string;
  updatedAt: string;
}

const ITEMS_PER_PAGE = 10

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

  const [selectedData, setSelectedData] = useState<ILocationPage | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // GraphQL query for paginated location pages
  const { data, loading, error, refetch, networkStatus } = useQuery<any>(
    GET_PAGINATED_LOCATION_PAGES,
    {
      variables: {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchText || undefined,
        status: status || undefined,
      },
      skip: !currentWebsiteId,
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  );
  console.log({ locationPageError: error })

  const showTableLoading = (loading && networkStatus === 1) || !currentWebsiteId;

  // Delete mutation
  const [deleteLocationPages] = useMutation<any>(DELETE_LOCATION_PAGES);

  const allLocationPages: ILocationPage[] =
    data?.getPaginatedLocationPages?.locationPages || [];
  const totalLocationPages = data?.getPaginatedLocationPages?.totalLocationPages || 0;
  const totalPages = Math.ceil(totalLocationPages / ITEMS_PER_PAGE);



  // Map data to include `id` for TableBox compatibility
  const locationPagesData = allLocationPages.map((LocationPage) => ({
    ...LocationPage,
    id: LocationPage.id,
  }));

  console.log('all pagenated location pages:', allLocationPages)

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
        { value: "PUBLISHED", label: "Published" },
        { value: "DRAFT", label: "Draft" },
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
      const { data } = await deleteLocationPages({
        variables: { ids: selectedIdsForDeletion },
      });
      if (data?.deleteLocationPages?.success) {
        toast.success(data.deleteLocationPages.message);
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeletion([]);
      } else {
        toast.error(data?.deleteLocationPages?.message || "Failed to delete Location Pages", {
          position: "top-center",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete Location Pages");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = (ids: string[]) => {
    setSelectedIdsForDeletion(ids);
    setShowConfirmationModel(true);
  };

  const editHandler = (locationPage: any) => {
    const original = allLocationPages.find((l: any) => l.id === locationPage.id) || locationPage;
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

  useEffect(() => {
    if (currentWebsiteId) {
      refetch();
    }
  }, [currentWebsiteId, refetch]);

  // Reset page and search when switching websites
  // useEffect(() => {
  //   dispatch({ type: "SET_PAGE", payload: 1 });
  // }, [currentWebsiteId, dispatch]);


  // Table columns and custom renderers
  const columns = ["image", "name", "slug", "h1Tag", "metaTitle", "metaDescription", "content", "status", "author", "createdAt", "updatedAt"];


  const customRenderers = {
    image: (value: string, row: any) => (
      <div className="flex relative items-center justify-center">
        {row.image && (
          <Image
            src={row.image[0].url}
            alt={row.name}
            className="h-10 w-10 rounded object-cover"
            width={40}
            height={40}
          />
        )}
        <div
          className={`absolute -top-1.5 -right-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white shadow-sm ring-1 ring-background ${row.image.length < 2 ? "bg-red-500" : "bg-green-500"
            }`}
        >
          {row.image.length}
        </div>
      </div>
    ),
  }


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
      title="Location Pages Management"
      subtitle={<span>Total Location Pages: {totalLocationPages}</span>}
      // stats={stats}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={(key, value) => {
        if (key === "search") {
          setLocalSearch(value || "");
        } else if (key === "status") {
          dispatch({ type: "SET_STATUS", payload: value || undefined });
        } else if (key === "isFeatured") {
          const val =
            value === undefined || value === null || value === ""
              ? undefined
              : value === true || value === "true";
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
      addLabel="Add Location Page"
      addDisabled={false}
      data={locationPagesData}
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
          message={`Are you sure you want to delete ${selectedIdsForDeletion.length} product${selectedIdsForDeletion.length === 1 ? "" : "s"
            }? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={isDeleting}
        />
      )}

      {/* Add / Edit Modal */}
      {showAddModel && (
            <AddlocationPage
              onCancel={cancelAdd}
              isEditMode={isEditMode}
              refetch={refetch}
              selectedData={selectedData}
            />
          )}
    </DataListPage>
  )
}

export default Page
