"use client";
import { useReducer, useState } from "react";
import TableBox from "@/components/tablebox/TableBox";
import Container from "@/components/Container";
import { useMutation, useQuery } from "@apollo/client/react";
import { DELETE_CUSTOM_MODULES, GET_PAGINATED_CUSTOM_MODULES } from "@/graphql/query/module.query";
import {
  filterReducer,
  initialFilterState,
} from "@/useReducerHooks/module-filter-reducer";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import { toast } from "react-toastify";
import AddModule from "@/components/popup/models/AddModule.model";
import { useAppSelector } from "@/redux/hooks";
import { PlatformRole } from "@/enums/common.enums";
import { Module } from "@/Types/module.types";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Calendar,
} from "lucide-react";
import { getLucideIcon } from "@/helpers/LucidIconFinder";

const ITEMS_PER_PAGE = 10;

const Page = () => {
  const currentMember = useAppSelector((state) => state.currentMember.member);
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModel, setShowConfirmationModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSuperAdmin = currentMember?.role === PlatformRole.SUPER_ADMIN;
  const isAdmin = currentMember?.role === PlatformRole.ADMIN;

  const { data, loading, error, refetch } = useQuery<any>(GET_PAGINATED_CUSTOM_MODULES, {
    variables: {
      page: 1,
      limit: Number(ITEMS_PER_PAGE) || 10,
    },
    fetchPolicy: "network-only",
  });

  console.log({ dataa: data })

  const [deleteCustomModules] = useMutation<any>(DELETE_CUSTOM_MODULES);

  const allModules: Module[] = data?.getPaginatedCustomModules?.customModules || [];
  const totalModules = data?.getPaginatedCustomModules?.totalCustomModulesCount || 0;
  const totalPages = Math.ceil(totalModules / ITEMS_PER_PAGE);


  const tableData = allModules.map(module => ({
    ...module,
  }));

  const columns = ["moduleName", "route"];

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
      const { data } = await deleteCustomModules({
        variables: { ids: selectedIdsForDeletion },
      });

      if (data?.deleteCustomModules?.success) {
        toast.success(data.deleteCustomModules.message);
        setShowConfirmationModel(false);
        refetch();
        setSelectedIdsForDeletion([]);
      } else {
        toast.error(data?.deleteCustomModules?.message || "Failed to delete modules");
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

  const cancelAddModule = () => {
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
              <div className="font-semibold">Error loading modules</div>
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
                status={false}
                createdAt={true}
                updatedAt={true}
                customRenderers={{
                  moduleName: (value, row) => {
                    const Icon = getLucideIcon(row.moduleIcon);

                    return (
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>

                        <div>
                          <div className="font-medium text-gray-900">
                            {value}
                          </div>
                        </div>
                      </div>
                    );
                  },
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
    </Container>
  );
};

export default Page;