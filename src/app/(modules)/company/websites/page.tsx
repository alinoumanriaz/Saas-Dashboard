// src/app/admin/all-websites/page.tsx
"use client";
import { useEffect, useReducer, useState } from "react";
import { BiSearch, BiWorld, BiCheckCircle, BiXCircle, BiBuilding } from "react-icons/bi";
import { BsArrowClockwise, BsDatabase, BsCloud } from "react-icons/bs";
import TableBox from "@/components/tablebox/TableBox";
import Container from "@/components/Container";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_PAGINATED_WEBSITES, DELETE_WEBSITES } from "@/graphql/query/website.query";
import {
    filterReducer,
    initialFilterState,
} from "@/useReducerHooks/website-filter-reducer";
import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
import { toast } from "react-toastify";
import { useAppSelector } from "@/redux/hooks";
import { GET_PAGINATED_COMPANIES } from "@/graphql/query/company.query";
import AddWebsite from "@/components/popup/models/AddWebsite.model";
import { PlatformRole, WebsiteStatus } from "@/enums/common.enums";

const ITEMS_PER_PAGE = 10;

// Interface matching the Website schema
interface IWebsite {
    id: string;
    companyId: string;
    name: string;
    domain: string;
    status: WebsiteStatus;
    database: {
        name: string;
        type: string;
        host: string;
        port: number;
        username: string;
    };
    cloudinary?: {
        folderName?: string;
        cloudinaryName?: string;
        cloudinaryNameApiKey?: string;
        cloudinaryNameApiKeySecret?: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface ICompany {
    id: string;
    companyName: string;
    ownerIds: string[];
}

interface GetPaginatedWebsitesResponse {
    getPaginatedWebsites: {
        websites: IWebsite[];
        totalWebsitesCount: number;
    }
}

interface DeleteWebsitesResponse {
    deleteWebsites: {
        success: boolean;
        message: string;
    }
}

const AllWebsitesPage = () => {
    // Get current company and member from Redux
    const currentMember = useAppSelector((state) => state.currentMember.member);
    const selectedCompanyMember = useAppSelector((state) => state.currentCompanyMember.companyMember);
    const companyId = selectedCompanyMember?.company?.id;
    const currentCompany = selectedCompanyMember?.company

    const [state, dispatch] = useReducer(filterReducer, initialFilterState);
    const { currentPage, status, searchText } = state;
    const [selectedData, setSelectedData] = useState<IWebsite | null>(null);
    const [debouncedSearch, setDebouncedSearch] = useState(searchText);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showConfirmationModel, setShowConfirmationModel] = useState(false);
    const [showAddModel, setShowAddModel] = useState(false);
    const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchText]);

    const { data, loading, error, refetch } = useQuery<GetPaginatedWebsitesResponse>(GET_PAGINATED_WEBSITES, {
        variables: {
            page: Number(currentPage) || 1,
            limit: Number(ITEMS_PER_PAGE) || 10,
            status: status || null,
            search: debouncedSearch || null,
            companyId: companyId || null, // Use the effective company ID
        },
        fetchPolicy: "network-only",
        skip: !companyId, // Skip if no company for non-super admins
    });

    if (error) {
        console.log({ WebsitePaginated: error })
    }

    const [deleteWebsites] = useMutation<DeleteWebsitesResponse>(DELETE_WEBSITES);

    const allWebsites: IWebsite[] = data?.getPaginatedWebsites?.websites || [];
    const totalWebsites = data?.getPaginatedWebsites?.totalWebsitesCount || 0;
    const totalPages = Math.ceil(totalWebsites / ITEMS_PER_PAGE);


    const columns = ["name", "domain", "status", "companyId"];

    const cancelDelete = () => {
        setSelectedIdsForDeletion([]);
        setShowConfirmationModel(false);
    };

    const confirmDelete = async () => {
        if (selectedIdsForDeletion.length === 0) return;


        try {
            const { data } = await deleteWebsites({
                variables: { ids: selectedIdsForDeletion },
            });

            if (data?.deleteWebsites?.success) {
                toast.success(data.deleteWebsites.message);
                setShowConfirmationModel(false);
                refetch();
                setSelectedIdsForDeletion([]);
            } else {
                toast.error(data?.deleteWebsites?.message || "Failed to delete websites");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to delete websites");
        }
    };

    const deleteHandler = async (ids: string[]) => {
        setSelectedIdsForDeletion(ids);
        setShowConfirmationModel(true);
    };

    const editHandler = (websiteData: IWebsite) => {

        setIsEditMode(true);
        setSelectedData(websiteData);
        setShowAddModel(true);
    };

    const addHandler = () => {

        setSelectedData(null);
        setIsEditMode(false);
        setShowAddModel(true);
    };

    const cancelAddWebsite = () => {
        setShowAddModel(false);
        setSelectedData(null);
        setIsEditMode(false);
    };

    // Custom renderer for status column
    const statusRenderer = (value: WebsiteStatus) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${value === WebsiteStatus.ACTIVE
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
            }`}>
            {value === WebsiteStatus.ACTIVE ? (
                <>
                    <BiCheckCircle className="mr-1" size={14} />
                    Active
                </>
            ) : (
                <>
                    <BiXCircle className="mr-1" size={14} />
                    Inactive
                </>
            )}
        </span>
    );

    // Custom renderer for website name
    const nameRenderer = (value: string, row: any) => (
        <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <BiWorld className="text-blue-600" size={16} />
            </div>
            <div>
                <span className="font-medium text-gray-900">{value}</span>
                {row.domain && (
                    <p className="text-xs text-gray-500">{row.domain}</p>
                )}
            </div>
        </div>
    );

    // Custom renderer for company column
    // const companyRenderer = (value: string) => {
    //     const company = companies.find(c => c.id === value) || currentCompany;
    //     return (
    //         <div className="flex items-center">
    //             <BiBuilding className="text-gray-400 mr-1" size={14} />
    //             <span className="text-gray-600">{company?.companyName || value}</span>
    //         </div>
    //     );
    // };

    // Custom renderer for database info
    const databaseRenderer = (value: any) => (
        <div className="flex items-center text-xs">
            <BsDatabase className="text-gray-400 mr-1" size={12} />
            <span className="text-gray-600">{value?.type || 'MongoDB'}</span>
        </div>
    );

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
                                <h3 className="text-sm font-medium text-red-800">Error loading websites</h3>
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

    // Show message if no company is selected for non-super admins
    if (!companyId) {
        return (
            <Container className="overflow-y-auto h-full">
                <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                        <BiBuilding className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No company selected</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Please select a company to view its websites.
                        </p>
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
                            <h1 className="text-2xl font-bold text-gray-900">Website Management</h1>
                            <p className="text-gray-600 flex items-center">

                                <span>Websites for: </span>
                                <span className="ml-1 font-semibold text-blue-600">
                                    {currentCompany?.name}
                                </span>
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs">
                                    {totalWebsites} websites
                                </span>
                            </p>
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
                                Add Website
                            </button>
                        </div>
                    </div>
                    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    onChange={(e) =>
                                        dispatch({
                                            type: "SET_STATUS",
                                            payload: e.target.value || undefined,
                                        })
                                    }
                                    value={status || ""}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option value="">All Status</option>
                                    <option value={WebsiteStatus.ACTIVE}>Active</option>
                                    <option value={WebsiteStatus.INACTIVE}>Inactive</option>
                                </select>
                            </div>

                            {/* Search Input */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search
                                </label>
                                <div className="relative">
                                    <input
                                        onChange={(e) =>
                                            dispatch({ type: "SET_SEARCH", payload: e.target.value })
                                        }
                                        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="Search by website name or domain..."
                                        type="text"
                                        value={searchText}
                                    />
                                    <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                    <BiWorld className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        {'Your Websites'}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {totalWebsites}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg mr-3">
                                    <BiCheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Active Websites</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {allWebsites.filter(w => w.status === WebsiteStatus.ACTIVE).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                                    <BsDatabase className="w-6 h-6 text-purple-600" />
                                </div>
                                {/* <div>
                                    <p className="text-sm text-gray-600">With Cloudinary</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {(isSuperAdmin ? allWebsites : filteredWebsites).filter(w => w.cloudinary).length}
                                    </p>
                                </div> */}
                            </div>
                        </div>
                    </div>

                    {/* Main Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <TableBox
                            column={columns}
                            checkbox={true}
                            action={true}
                            loading={loading}
                            data={allWebsites}
                            logo={false}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            setCurrentPage={(page) =>
                                dispatch({ type: "SET_PAGE", payload: page })
                            }
                            status={false}
                            deletehandler={deleteHandler}
                            edithandler={editHandler}
                            height="max-h-[calc(100vh-420px)]"
                            createdAt={true}
                            updatedAt={true}
                            customRenderers={{
                                status: statusRenderer,
                                // name: nameRenderer,
                                // companyId: companyRenderer,
                                // database: databaseRenderer,
                            }}
                        // columnHeaders={{
                        //     name: "Website Name",
                        //     domain: "Domain",
                        //     status: "Status",
                        //     companyId: "Company",
                        //     createdAt: "Created Date",
                        //     updatedAt: "Last Updated",
                        // }}
                        />
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmationModel && (
                <ConfirmationBox
                    onCancel={cancelDelete}
                    onDelete={confirmDelete}
                    title="Delete Websites"
                    message={`Are you sure you want to delete ${selectedIdsForDeletion.length} website(s)? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                />
            )}

            {/* Add/Edit Website Modal */}
            {showAddModel && (
                <AddWebsite
                    onCancel={cancelAddWebsite}
                    selectedData={selectedData}
                    isEditMode={isEditMode}
                    refetch={refetch}
                    currentMemberId={currentMember?.id}
                // currentCompanyId={currentCompany?.id} // Pass current company ID to modal
                />
            )}
        </Container>
    );
};

export default AllWebsitesPage;