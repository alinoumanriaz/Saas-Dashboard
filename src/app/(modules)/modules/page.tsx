"use client";
import { useEffect, useReducer, useState } from "react";
import { BiSearch } from "react-icons/bi";
import TableBox from "@/components/tablebox/TableBox";
import Container from "@/components/Container";
import { useMutation, useQuery } from "@apollo/client/react";
import { DELETE_MODULES, GET_PAGINATED_MODULES } from "@/graphql/query/module.query";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/module-filter-reducer";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import { toast } from "react-toastify";
import AddModule from "@/components/popup/models/AddModule.model";
import { useAppSelector } from "@/redux/hooks";
import { PlatformRole } from "@/enums/common.enums";
import { Module, ModuleStatus } from "@/Types/module.types";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FilterX, 
  RefreshCw, 
  ListFilter, 
  Calendar, 
  MapPin, 
  Users, 
  Ticket, 
  Clock,
  TrendingUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const ITEMS_PER_PAGE = 10;

// Event filter reducer
// const filterReducer = (state: any, action: any) => {
//   switch (action.type) {
//     case "SET_PAGE":
//       return { ...state, currentPage: action.payload };
//     case "SET_STATUS":
//       return { ...state, status: action.payload, currentPage: 1 };
//     case "SET_CATEGORY":
//       return { ...state, category: action.payload, currentPage: 1 };
//     case "SET_EVENT_TYPE":
//       return { ...state, eventType: action.payload, currentPage: 1 };
//     case "SET_SEARCH":
//       return { ...state, searchText: action.payload, currentPage: 1 };
//     case "RESET_FILTERS":
//       return {
//         ...state,
//         status: undefined,
//         category: undefined,
//         eventType: undefined,
//         searchText: "",
//         currentPage: 1,
//       };
//     default:
//       return state;
//   }
// };

// const initialFilterState = {
//   currentPage: 1,
//   status: undefined,
//   category: undefined,
//   eventType: undefined,
//   searchText: "",
// };

const Page = () => {
  const currentMember = useAppSelector((state) => state.currentMember.member);
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const isSuperAdmin = currentMember?.role === PlatformRole.SUPER_ADMIN;
  const isAdmin = currentMember?.role === PlatformRole.ADMIN;

  const { data, loading, error, refetch } = useQuery<any>(GET_PAGINATED_MODULES, {
    variables: {
      page: 1,
      limit: Number(ITEMS_PER_PAGE) || 10,
      status: null,
      category: null,
      search: null,
    },
    fetchPolicy: "network-only",
  });

  const [deleteModules] = useMutation<any>(DELETE_MODULES);

  const allModules: Module[] = data?.getPaginatedModules?.modules || [];
  const totalModules = data?.getPaginatedModules?.totalModulesCount || 0;
  const totalPages = Math.ceil(totalModules / ITEMS_PER_PAGE);


  const tableData = allModules.map(module => ({
    ...module,
    moduleName: module.title,
    date: `${new Date(module.startDate).toLocaleDateString()} - ${new Date(module.endDate).toLocaleDateString()}`,
    time: `${module.startTime} - ${module.endTime}`,
    attendees: module.attendees?.length || 0,
    capacity: module.capacity || "-",
  }));

  const columns = ["moduleName", "date", "location", "attendees", "capacity"];

  const cancelDelete = () => {
    setSelectedIdsForDeletion([]);
    setShowConfirmationModel(false);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    if (selectedIdsForDeletion.length === 0) return;

    if (!isSuperAdmin && !isAdmin) {
      toast.error("Access denied");
      return;
    }

    try {
      const { data } = await deleteModules({
        variables: { ids: selectedIdsForDeletion },
      });

      if (data?.deleteModules?.success) {
        toast.success(data.deleteModules.message);
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeletion([]);
      } else {
        toast.error(data?.deleteModules?.message || "Failed to delete modules");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete modules");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteHandler = async (id: string[]) => {
    setSelectedIdsForDeletion(id);
    setShowConfirmationModel(true);
  };

  const editHandler = (eventData: any) => {
    if (!isSuperAdmin && !isAdmin) {
      toast.error("You don't have permission to edit events");
      return;
    }
    setIsEditMode(true);
    setSelectedData(eventData);
    setShowAddModel(true);
  };

  const addHandler = () => {
    setSelectedData(null);
    setIsEditMode(false);
    setShowAddModel(true);
  };

  const cancelAddEvent = () => {
    setShowAddModel(false);
  };



  return (
    <Container className="overflow-y-auto h-full">
      <div className="w-full h-full text-[13px]">
        <div className="w-full h-full overflow-hidden px-4">
          {/* Header Section */}
          <div className="flex justify-between items-center pb-6">
            <CardHeader className="w-full">
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Module Management
              </CardTitle>
              <CardDescription>
                Total Modules: {totalModules}
                {!isSuperAdmin && <span className="ml-2 text-sm text-blue-600">(Filtered by your tenant)</span>}
              </CardDescription>
            </CardHeader>

            <div className="flex items-center space-x-3">

              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={loading}
                className="gap-1"
              >
                {loading ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4" />
                    <span>Refresh</span>
                  </>
                )}
              </Button>

              <Button onClick={addHandler} className="gap-2">
                <Calendar className="size-4" />
                Create Module
              </Button>
            </div>
          </div>


          {/* Main Table */}
          {error ? (
            <div className="p-4 text-red-500 bg-red-50 rounded-lg">
              <div className="font-semibold">Error loading events</div>
              <div className="text-sm mt-1">{error.message}</div>
              <button
                onClick={() => refetch()}
                className="mt-3 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <TableBox
                column={columns}
                checkbox={true}
                action={true}
                loading={loading}
                data={tableData}
                currentPage={1}
                totalPages={totalPages}
                setCurrentPage={(page) =>
                  dispatch({ type: "SET_PAGE", payload: page })
                }
                deletehandler={deleteHandler}
                edithandler={editHandler}
                height="max-h-[calc(100vh-380px)]"
                status={true}
                createdAt={true}
                updatedAt={true}
                customRenderers={{
                  eventName: (value, row) => (
                    <div>
                      <div className="font-medium text-gray-900">{value}</div>
                      <div className="text-xs text-gray-500">{row.description?.substring(0, 50)}...</div>
                    </div>
                  ),
                  location: (value, row) => (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span>{value || "Virtual"}</span>
                    </div>
                  ),
                  attendees: (value) => (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span>{value}</span>
                    </div>
                  ),
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmationModel && (
        <ConfirmationBox
          onCancel={cancelDelete}
          onDelete={confirmDelete}
          title="Delete Events"
          message={`Are you sure you want to delete ${selectedIdsForDeletion.length} event(s)? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={isDeleting}
        />
      )}

      {/* Add/Edit Event Modal */}
      {/* {showAddModel && (
        <AddModule
          onCancel={cancelledModules}
          selectedData={selectedData}
          isEditMode={isEditMode}
          refetch={refetch}
          currentMemberId={currentMember?.id}
          isSuperAdmin={isSuperAdmin}
        />
      )} */}
    </Container>
  );
};

export default Page;