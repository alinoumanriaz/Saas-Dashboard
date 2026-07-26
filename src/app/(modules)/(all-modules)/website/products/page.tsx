"use client";
import { useEffect, useReducer, useState } from "react";
import { BiSearch } from "react-icons/bi";
import TableBox from "@/components/tablebox/TableBox";
import Container from "@/components/Container";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/user-filter-reducer";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import { toast } from "react-toastify";
import {
  DELETE_PRODUCT,
  GET_PAGINATED_PRODUCT,
} from "@/graphql/query/product.query";
import AddProduct from "@/components/popup/models/AddProduct.model";
const column = ["name", "slug", "h1Tag", "metaTitle"];
const ITEMS_PER_PAGE = 10;

interface IProduct {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  decription: string;
  specification: string;
  createdBy: {
    _id: string;
    name: string;
    imageUrl: string;
  };
  imageUrl: string;
}

const Page = () => {
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, searchText, status, isFeatured } = state;
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeleteion, setSelectedIdsForDeleteion] = useState<
    string[]
  >([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, loading, error, refetch } = useQuery(GET_PAGINATED_PRODUCT, {
    variables: {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: debouncedSearch || undefined,
      status,
      isFeatured,
    },
    fetchPolicy: "network-only",
  });
  const [deleteProducts] = useMutation(DELETE_PRODUCT);
  console.log({ Pdata: data });

  const alldata: IProduct[] = data?.getPaginatedProducts?.products || [];
  const totalProducts = data?.getPaginatedProducts?.totalProducts || 0;
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  const cancelDelete = () => {
    setSelectedIdsForDeleteion([]);
    console.log({ selectedIdsForDeleteion: selectedIdsForDeleteion });
    setShowConfirmationModel(false);
  };
  const confirmDelete = async () => {
    setIsDeleting(true);
    console.log({ selectedIdsForDeleteion: selectedIdsForDeleteion });
    if (selectedIdsForDeleteion.length === 0) return;

    const { data } = await deleteProducts({
      variables: { ids: selectedIdsForDeleteion },
    });

    console.log({ data: data });
    setIsDeleting(false);
    if (data?.deleteProducts?.success) {
      toast.success(data.deleteProducts.message);
      setShowConfirmationModel(false);
      refetch(); // refresh list
      setSelectedIdsForDeleteion([]);
    } else {
      console.log("frontend confirm delete funstion not working");
      toast.error(data?.deleteProducts?.message || "Failed to delete Products");
    }
  };
  const deleteHandler = async (id: string[]) => {
    setSelectedIdsForDeleteion(id);
    setShowConfirmationModel(true);
  };
  const editHandler = (cData: any) => {
    setIsEditMode(true);
    setSelectedData(cData);
    setShowAddModel(true);
    console.log(isEditMode);
    console.log(cData);
  };

  const addHandler = () => {
    setSelectedData(null);
    setIsEditMode(false);
    setShowAddModel(true);
  };

  const cancelAdd = () => {
    setShowAddModel(false);
  };

  return (
    <Container className="overflow-y-auto py-1">
      <div className="w-full text-[13px]">
        <div className="w-full bg-white rounded-md ring-1 ring-gray-300/80 overflow-hidden px-4">
          <div className="flex justify-between items-center">
            <div className="p-6 space-y-1">
              <div className="text-lg ">Products List</div>
              <div className=" text-gray-600">
                You have {totalProducts} Products.
              </div>
            </div>

            <div className="flex p-6 justify-center items-center space-x-2">
              {/* Status Filter */}
              <select
                onChange={(e) =>
                  dispatch({
                    type: "SET_STATUS",
                    payload: e.target.value || undefined,
                  })
                }
                value={status === undefined ? "": status}
                className="px-6 py-1 outline-none ring-1 ring-gray-300 text-gray-500 rounded-md"
              >
                <option value="">-- Select Status --</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              {/* Featured Filter */}
              <select
                value={isFeatured === undefined ? "" : String(isFeatured)}
                onChange={(e) => {
                  const val = e.target.value;
                  dispatch({
                    type: "SET_FEATURED",
                    payload:
                      val === "true"
                        ? true
                        : val === "false"
                        ? false
                        : undefined,
                  });
                }}
                className="px-6 py-1 outline-none ring-1 ring-gray-300 text-gray-500 rounded-md"
              >
                <option value="">-- Select Featured --</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>

              {/* Search Input */}
              <div className="relative ring-1 ring-gray-300 rounded-md">
                <input
                  onChange={(e) =>
                    dispatch({ type: "SET_SEARCH", payload: e.target.value })
                  }
                  className="placeholder:text-gray-400/80 w-60 outline-none focus:ring-1 focus:ring-gray-700/40 py-1 pl-2 pr-8 bg-white rounded-md"
                  placeholder="Search any field"
                  type="text"
                  value={searchText}
                />
                <BiSearch className="absolute size-5 top-1 right-2.5 z-10 text-gray-500" />
              </div>

              {/* Reset Button */}
              <button
                onClick={() => dispatch({ type: "RESET_FILTERS" })}
                className="px-4 py-1 rounded-md bg-gray-100 text-gray-700 ring-1 ring-gray-300"
              >
                Reset
              </button>
              <button
                onClick={addHandler}
                className="px-4 py-1 rounded-md bg-blue-700 text-white ring-1 "
              >
                Add Product
              </button>
            </div>
          </div>

          {/* Error or Table */}
          {error ? (
            <div className="p-4 text-red-500">
              Error loading products: {error.message}
            </div>
          ) : (
            <TableBox
              column={column}
              checkbox={true}
              action={true}
              loading={loading}
              data={alldata}
              image={true}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={(page) =>
                dispatch({ type: "SET_PAGE", payload: page })
              }
              status={true}
              isVerified={false}
              deletehandler={deleteHandler}
              edithandler={editHandler}
              author={true}
              createdAt={true}
              updatedAt={true}
              industry={true}
              material={true}
              style={true}
              isFeatured={true}
            />
          )}
        </div>
      </div>
      {showConfirmationModel && (
        <ConfirmationBox
          onCancel={cancelDelete}
          onDelete={confirmDelete}
          // loading={isDeleting}
        />
      )}

      {showAddModel && (
        <AddProduct
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
