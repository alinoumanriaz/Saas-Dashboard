"use client";
import { useEffect, useReducer, useState } from "react";
import { BiSearch, BiBuilding, BiCheckCircle, BiXCircle } from "react-icons/bi";
import { BsArrowClockwise } from "react-icons/bs";
import TableBox from "@/components/tablebox/TableBox";
import Container from "@/components/Container";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/user-filter-reducer";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import { toast } from "react-toastify";
import AddIndustry from "@/components/popup/models/AddIndustry.model";
import { DELETE_INDUSTRIES } from "@/graphql/query/industry.query";
import { GET_PAGINATED_INDUSTRIES } from "@/graphql/current-website-queries/industry.query";

const column = ["name", "slug", "description", "content"];
const ITEMS_PER_PAGE = 10;

// Adjust interface to match actual data (fields may be objects)
interface IIndustry {
  _id: string;
  name: string;
  slug: string;
  iconImageUrl: string | { url: string; alt?: string };
  imageUrl: string | { url: string; alt?: string };
  bannerImage: string | { url: string; alt?: string };
  description: string;
  content: string | any; // could be string or rich-text object
}

const Page = () => {
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, searchText } = state;
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeleteion, setSelectedIdsForDeleteion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, loading, error, refetch } = useQuery<any>(GET_PAGINATED_INDUSTRIES, {
    variables: {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: debouncedSearch || undefined,
    },
    fetchPolicy: "network-only",
  });

  const [deleteIndustries] = useMutation<any>(DELETE_INDUSTRIES);

  const allIndustries: IIndustry[] = data?.getPaginatedIndustries?.industries || [];
  const totalIndustries = data?.getPaginatedIndustries?.totalIndustries || 0;
  const totalPages = Math.ceil(totalIndustries / ITEMS_PER_PAGE);

  const industriesWithContent = allIndustries.filter(i => {
    const content = i.content;
    if (typeof content === "string") return content.trim().length > 0;
    if (content && typeof content === "object") return true;
    return false;
  }).length;

  const cancelDelete = () => {
    setSelectedIdsForDeleteion([]);
    setShowConfirmationModel(false);
  };

  const confirmDelete = async () => {
    if (selectedIdsForDeleteion.length === 0) return;
    setIsDeleting(true);
    try {
      const { data } = await deleteIndustries({
        variables: { ids: selectedIdsForDeleteion },
      });
      if (data?.deleteIndustries?.success) {
        toast.success(data.deleteIndustries.message);
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeleteion([]);
      } else {
        toast.error(data?.deleteIndustries?.message || "Failed to delete industries");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete industries");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = async (ids: string[]) => {
    setSelectedIdsForDeleteion(ids);
    setShowConfirmationModel(true);
  };

  const editHandler = (cData: any) => {
    setIsEditMode(true);
    setSelectedData(cData);
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

  // Helper to extract URL from iconImageUrl (string or object)
  const getIconUrl = (industry: IIndustry) => {
    if (!industry.iconImageUrl) return "";
    if (typeof industry.iconImageUrl === "string") return industry.iconImageUrl;
    return industry.iconImageUrl.url || "";
  };

  // Custom renderer for name column (includes icon)
  const nameRenderer = (_: string, industry: IIndustry) => {
    return (
      <div className="flex items-center space-x-3">
        <div className="font-medium text-gray-900">{industry.name}</div>
      </div>
    );
  };

  // Custom renderer for description (ensure string)
  const descriptionRenderer = (_: string, value: any) => {
    const desc = typeof value === "string" ? value : value?.description || "";
    return <div className="max-w-xs truncate" title={desc}>{desc || "—"}</div>;
  };

  // Custom renderer for content (handle string or object)
  const contentRenderer = (_: string, value: any) => {
    let display = "";
    if (typeof value === "string") {
      display = value;
    } else if (value && typeof value === "object") {
      // Try to extract text content from rich text object
      display = value.text || value.content || JSON.stringify(value);
    }
    const truncated = display.length > 100 ? display.substring(0, 100) + "..." : display;
    return <div className="max-w-xs truncate" title={display}>{truncated || "—"}</div>;
  };

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
                <h3 className="text-sm font-medium text-red-800">Error loading industries</h3>
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
              <h1 className="text-2xl font-bold text-gray-900">Industry Management</h1>
              <p className="text-gray-600">Total Industries: {totalIndustries}</p>
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
              <button
                onClick={addHandler}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Add Industry
              </button>
            </div>
          </div>

          {/* Filter Section */}
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <input
                    onChange={(e) => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Search by name, slug, or description..."
                    type="text"
                    value={searchText}
                  />
                  <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <BiBuilding className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Industries</p>
                  <p className="text-2xl font-bold text-gray-900">{totalIndustries}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <BiCheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">With Content</p>
                  <p className="text-2xl font-bold text-gray-900">{industriesWithContent}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <TableBox
              column={column}
              checkbox={true}
              action={true}
              loading={loading}
              data={allIndustries}
              image={true}
              iconImageUrl={true}
              bannerImage={true}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={(page) => dispatch({ type: "SET_PAGE", payload: page })}
              status={false}
              deletehandler={deleteHandler}
              edithandler={editHandler}
              createdAt={true}
              updatedAt={true}
              customRenderers={{
                description: descriptionRenderer,
                content: contentRenderer,
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
          loading={isDeleting}
          title="Delete Industries"
          message={`Are you sure you want to delete ${selectedIdsForDeleteion.length} industr${
            selectedIdsForDeleteion.length === 1 ? "y" : "ies"
          }? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}

      {/* Add/Edit Industry Modal */}
      {showAddModel && (
        <AddIndustry
          onCancel={cancelAdd}
          isEditMode={isEditMode}
          refetch={refetch}
          selectedData={selectedData}
        />
      )}
    </Container>
  );
};

export default Page;