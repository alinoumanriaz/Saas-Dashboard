"use client";
import React, { useEffect, useReducer, useState } from "react";
import { BiSearch } from "react-icons/bi";
import TableBox from "@/components/tablebox/TableBox";
import Container from "@/components/Container";
import { useMutation, useQuery } from "@apollo/client";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/user-filter-reducer";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import { toast } from "react-toastify";
import AddReview from "@/components/popup/models/AddReview.model"; // <-- create similar to AddIndustry
import {
  DELETE_REVIEWS,
  GET_ALL_REVIEWS,
} from "@/graphql/query/review.query"; // <-- from your reviews.ts

// Table columns for reviews
const column = ["customerName", "slug", "content", "imageUrl"];
const ITEMS_PER_PAGE = 10;

// Review interface
interface IReview {
  id: string;
  customerName: string;
  slug: string;
  imageUrl?: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

const Page = () => {
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { currentPage, searchText } = state;
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeleteion, setSelectedIdsForDeleteion] = useState<
    string[]
  >([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Query reviews
  const { data, loading, error, refetch } = useQuery(GET_ALL_REVIEWS, {
    variables: {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: debouncedSearch || undefined,
    },
    fetchPolicy: "network-only",
  });

  console.log({reviewdata: data})

  const [deleteReviews] = useMutation(DELETE_REVIEWS);

  const reviews: IReview[] = data?.getAllReviews?.reviews || [];
  const totalReviews = data?.getAllReviews?.totalReviews || 0;
  const totalPages = Math.ceil(totalReviews / ITEMS_PER_PAGE);

  // Cancel delete
  const cancelDelete = () => {
    setSelectedIdsForDeleteion([]);
    setShowConfirmationModel(false);
  };

  // Confirm delete
  const confirmDelete = async () => {
    setIsDeleting(true);
    if (selectedIdsForDeleteion.length === 0) return;

    console.log({selectedIdsForDeleteion:selectedIdsForDeleteion})
    const { data } = await deleteReviews({
      variables: { ids: selectedIdsForDeleteion },
    });

    setIsDeleting(false);
    if (data?.deleteReviews?.success) {
      toast.success(data.deleteReviews.message);
      setShowConfirmationModel(false);
      refetch();
      setSelectedIdsForDeleteion([]);
    } else {
      toast.error(data?.deleteReviews?.message || "Failed to delete reviews");
    }
  };

  // Delete handler
  const deleteHandler = async (ids: string[]) => {
    console.log({idshandlke:ids})
    setSelectedIdsForDeleteion(ids);
    setShowConfirmationModel(true);
  };

  // Edit handler
  const editHandler = (review: any) => {
    setIsEditMode(true);
    setSelectedData(review);
    setShowAddModel(true);
  };

  // Add handler
  const addHandler = () => {
    setSelectedData(null);
    setIsEditMode(false);
    setShowAddModel(true);
  };

  const cancelAdd = () => {
    setShowAddModel(false);
  };

  return (
    <Container className="overflow-auto">
      <div className="w-full text-[13px]">
        <div className="w-full ring-1 ring-gray-300/80 bg-white rounded-md overflow-hidden px-4 my-1">
          <div className="flex justify-between items-center">
            <div className="p-6 space-y-1">
              <div className="text-lg">Review List</div>
              <div className=" text-gray-600">
                You have {totalReviews} Reviews.
              </div>
            </div>

            <div className="flex p-6 justify-center items-center space-x-2">
              {/* Search Input */}
              <div className="relative ring-1 ring-gray-300 rounded-md">
                <input
                  onChange={(e) =>
                    dispatch({ type: "SET_SEARCH", payload: e.target.value })
                  }
                  className="placeholder:text-gray-500/80 w-60 outline-none focus:ring-1 focus:ring-gray-700/40 py-1 pl-2 pr-8 bg-white rounded-md"
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
                Add Review
              </button>
            </div>
          </div>

          {/* Error or Table */}
          {error ? (
            <div className="p-4 text-red-500">
              Error loading reviews: {error.message}
            </div>
          ) : (
            <TableBox
              column={column}
              checkbox={true}
              action={true}
              loading={loading}
              data={reviews}
              image={true}
              iconImageUrl={false}
              bannerImage={false} 
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={(page) =>
                dispatch({ type: "SET_PAGE", payload: page })
              }
              status={false}
              isVerified={false}
              deletehandler={deleteHandler}
              edithandler={editHandler}
              createdAt={true}
              updatedAt={true}
            />
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showConfirmationModel && (
        <ConfirmationBox
          onCancel={cancelDelete}
          onDelete={confirmDelete}
          loading={isDeleting}
        />
      )}

      {/* Add/Edit review modal */}
      {showAddModel && (
        <AddReview
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
