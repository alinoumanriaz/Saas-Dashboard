// "use client";

// import { useEffect, useReducer, useState } from "react";
// import { useMutation, useQuery } from "@apollo/client/react";
// import { useAppSelector } from "@/redux/hooks";
// import { PlatformRole } from "@/enums/common.enums";
// import {
//   GET_PAGINATED_TICKETS,
//   DELETE_TICKETS,
// } from "@/graphql/query/ticket.query"; // you'll need to create these
// import { filterReducer, initialFilterState } from "@/useReducerHooks/website-filter-reducer";

// // shadcn/ui components
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { FilterX, ListFilter, RefreshCw } from "lucide-react";
// // Icons
// import {
//   BiSearch,
//   BiShoppingBag,
//   BiCheckCircle,
//   BiXCircle,
//   BiTime,
//   BiUser,
//   BiDollar,
// } from "react-icons/bi";
// import { BsCalendar } from "react-icons/bs";

// // Custom modals (placeholder)
// // import AddOrderTicket from "@/components/popup/models/AddOrderTicket.model"; // you need to create this
// import TableBox from "@/components/tablebox/TableBox";
// import Container from "@/components/Container";
// import { toast } from "sonner";

// // Order status enum (adjust to your actual enum)
// export enum OrderStatus {
//   PENDING = "PENDING",
//   PROCESSING = "PROCESSING",
//   COMPLETED = "COMPLETED",
//   CANCELLED = "CANCELLED",
// }

// const ITEMS_PER_PAGE = 10;

// interface IOrder {
//   id: string;
//   orderNumber: string;
//   customerName: string;
//   customerEmail: string;
//   totalAmount: number;
//   status: OrderStatus;
//   createdAt: string;
//   updatedAt: string;
//   // additional fields as needed
// }

// const AllOrderTicketPage = () => {
//   const currentMember = useAppSelector((state) => state.currentMember.member);
//   const selectedCompanyMember = useAppSelector(
//     (state) => state.currentCompanyMember.companyMember
//   );
//   const companyId = selectedCompanyMember?.companyId?.id;
//   const currentCompany = selectedCompanyMember?.company;
//   const isSuperAdmin = currentMember?.role === PlatformRole.SUPER_ADMIN;

//   const [state, dispatch] = useReducer(filterReducer, initialFilterState);
//   const { currentPage, status, searchText } = state;

//   // Local filter state
//   const [localStatus, setLocalStatus] = useState<string>(status || "all");
//   const [localSearch, setLocalSearch] = useState<string>(searchText || "");

//   // Debounced filter updates
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       const statusVal = localStatus === "all" ? undefined : localStatus;
//       dispatch({ type: "SET_STATUS", payload: statusVal });
//       dispatch({ type: "SET_SEARCH", payload: localSearch || "" });
//       dispatch({ type: "SET_PAGE", payload: 1 });
//     }, 400);
//     return () => clearTimeout(timer);
//   }, [localStatus, localSearch, dispatch]);

//   const [showFilters, setShowFilters] = useState(false);

//   // Selection & modals
//   const [selectedIds, setSelectedIds] = useState<string[]>([]);
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [showAddEditDialog, setShowAddEditDialog] = useState(false);
//   const [editingOrder, setEditingOrder] = useState<IOrder | null>(null);
//   const [isDeleting, setIsDeleting] = useState(false);

//   // Query
//   const { data, loading, error, refetch, networkStatus } = useQuery<any>(
//     GET_PAGINATED_TICKETS,
//     {
//       variables: {
//         page: Number(currentPage) || 1,
//         limit: ITEMS_PER_PAGE,
//         status: status || null,
//         search: searchText || null,
//         companyId: companyId,
//       },
//       fetchPolicy: "network-only",
//       skip: !companyId,
//     }
//   );

//   const showTableLoading = loading && networkStatus === 1;

//   const [deleteTickets] = useMutation<any>(DELETE_TICKETS);

//   const tickets: ITicket[] = data?.getPaginatedTickets?.tickets || [];
//   const totalTickets = data?.getPaginatedTickets?.totalTicketsCount || 0;
//   const totalPages = Math.ceil(totalTickets / ITEMS_PER_PAGE);

//   // Derived stats
//   const pendingCount = tickets.filter((t) => t.status === TicketStatus.PENDING).length;
//   const processingCount = tickets.filter((t) => t.status === TicketStatus.PROCESSING).length;
//   const completedCount = tickets.filter((t) => t.status === TicketStatus.COMPLETED).length;
//   const cancelledCount = tickets.filter((t) => t.status === TicketStatus.CANCELLED).length;
//   const totalRevenue = tickets.reduce((sum, t) => sum + t.totalAmount, 0);

//   // ----- Handlers -----
//   const handleResetFilters = () => {
//     setLocalStatus("all");
//     setLocalSearch("");
//     dispatch({ type: "RESET_FILTERS" });
//   };

//   const handleAdd = () => {
//     setEditingOrder(null);
//     setShowAddEditDialog(true);
//   };

//   const handleEdit = (order: IOrder) => {
//     setEditingOrder(order);
//     setShowAddEditDialog(true);
//   };

//   const handleDelete = async () => {
//     if (selectedIds.length === 0) return;
//     setIsDeleting(true);
//     try {
//       const { data } = await deleteOrders({
//         variables: { ids: selectedIds },
//       });
//       if (data?.deleteOrders?.success) {
//         toast.success(data.deleteOrders.message, { position: "top-center" });
//         setShowDeleteDialog(false);
//         setSelectedIds([]);
//         refetch();
//       } else {
//         toast.error(data?.deleteOrders?.message || "Failed to delete orders", {
//           position: "top-center",
//         });
//       }
//     } catch (err: any) {
//       toast.error(err.message || "Failed to delete orders", { position: "top-center" });
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const deleteHandler = (ids: string[]) => {
//     setSelectedIds(ids);
//     setShowDeleteDialog(true);
//   };

//   const editHandler = (order: any) => {
//     handleEdit(order);
//   };

//   // ----- TableBox columns and custom renderers -----
//   const columns = ["orderNumber", "customer", "totalAmount", "status", "createdAt"];

//   const customRenderers = {
//     orderNumber: (value: string, row: IOrder) => (
//       <div className="flex items-center gap-2">
//         <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
//           <BiShoppingBag className="h-4 w-4 text-muted-foreground" />
//         </div>
//         <div>
//           <div className="font-medium">{row.orderNumber}</div>
//           <div className="text-xs text-muted-foreground">ID: {row.id.slice(0, 8)}</div>
//         </div>
//       </div>
//     ),
//     customer: (value: any, row: IOrder) => (
//       <div>
//         <div className="font-medium">{row.customerName}</div>
//         <div className="text-xs text-muted-foreground">{row.customerEmail}</div>
//       </div>
//     ),
//     totalAmount: (value: number) => (
//       <span className="font-mono text-sm font-semibold">
//         ${value.toFixed(2)}
//       </span>
//     ),
//     status: (value: OrderStatus) => {
//       const statusMap: Record<OrderStatus, { label: string; variant: "default" | "destructive" | "outline" | "secondary" | "success" }> = {
//         [OrderStatus.PENDING]: { label: "Pending", variant: "outline" },
//         [OrderStatus.PROCESSING]: { label: "Processing", variant: "secondary" },
//         [OrderStatus.COMPLETED]: { label: "Completed", variant: "success" },
//         [OrderStatus.CANCELLED]: { label: "Cancelled", variant: "destructive" },
//       };
//       const info = statusMap[value] || { label: value, variant: "outline" };
//       return (
//         <Badge variant={info.variant} className="gap-1">
//           {value === OrderStatus.PENDING && <BiTime size={14} />}
//           {value === OrderStatus.COMPLETED && <BiCheckCircle size={14} />}
//           {value === OrderStatus.CANCELLED && <BiXCircle size={14} />}
//           {info.label}
//         </Badge>
//       );
//     },
//     createdAt: (value: string) => (
//       <div className="flex items-center gap-1 text-sm">
//         <BsCalendar className="h-3 w-3 text-muted-foreground" />
//         {new Date(value).toLocaleDateString("en-US", {
//           year: "numeric",
//           month: "short",
//           day: "numeric",
//           hour: "2-digit",
//           minute: "2-digit",
//         })}
//       </div>
//     ),
//   };

//   // Count active filters
//   const activeFiltersCount = [status, searchText].filter(Boolean).length;

//   const canManage = true; // adjust based on permissions

//   if (!isSuperAdmin && !companyId) {
//     return (
//       <Container className="overflow-y-auto h-full">
//         <div className="flex items-center justify-center min-h-[60vh]">
//           <Card className="w-full max-w-md">
//             <CardHeader>
//               <CardTitle className="text-center">No Company Selected</CardTitle>
//               <CardDescription className="text-center">
//                 Please select a company to view its orders.
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="flex justify-center">
//               <BiShoppingBag className="h-16 w-16 text-muted-foreground" />
//             </CardContent>
//           </Card>
//         </div>
//       </Container>
//     );
//   }

//   return (
//     <Container className="overflow-y-auto h-full">
//       <div className="w-full h-full text-[13px]">
//         <div className="w-full h-full overflow-hidden px-4">
//           {/* Header Section */}
//           <div className="flex justify-between items-center pb-6">
//             <CardHeader className="w-full p-0">
//               <CardTitle className="text-xl">Order Management</CardTitle>
//               <CardDescription>
//                 <span>
//                   {isSuperAdmin ? "All Companies" : currentCompany?.name || "N/A"}
//                 </span>
//                 <span className="ml-2 text-muted-foreground">
//                   • {totalOrders} {totalOrders === 1 ? "order" : "orders"}
//                 </span>
//               </CardDescription>
//             </CardHeader>

//             <div className="flex items-center space-x-3">
//               {/* Filter Toggle */}
//               <Button
//                 variant="outline"
//                 onClick={() => setShowFilters(!showFilters)}
//                 className="gap-2"
//               >
//                 <ListFilter className="size-4" />
//                 {activeFiltersCount > 0 && (
//                   <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5">
//                     {activeFiltersCount}
//                   </span>
//                 )}
//               </Button>

//               <Button
//                 variant="outline"
//                 onClick={() => refetch()}
//                 disabled={loading}
//                 className="gap-1"
//               >
//                 {loading ? (
//                   <>
//                     <RefreshCw className="size-4 animate-spin" />
//                     <span>Refreshing...</span>
//                   </>
//                 ) : (
//                   <>
//                     <RefreshCw className="size-4" />
//                     <span>Refresh</span>
//                   </>
//                 )}
//               </Button>

//               <Button onClick={handleAdd}>
//                 Add Order
//               </Button>
//             </div>
//           </div>

//           {/* Filters */}
//           {showFilters && (
//             <Card className="animate-in bg-background slide-in-from-top-2 duration-200 ring-0">
//               <div className="w-full">
//                 <div className="w-full flex justify-start items-center gap-2">
//                   <div className="space-y-2">
//                     <label className="text-sm font-medium">Search</label>
//                     <div className="relative">
//                       <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                       <Input
//                         placeholder="Search by order number or customer..."
//                         className="pl-9"
//                         value={localSearch}
//                         onChange={(e) => setLocalSearch(e.target.value)}
//                       />
//                     </div>
//                   </div>

//                   <div className="space-y-2 w-40">
//                     <label className="text-sm font-medium">Status</label>
//                     <Select
//                       value={localStatus}
//                       onValueChange={(val) => setLocalStatus(val)}
//                     >
//                       <SelectTrigger className="w-full">
//                         <SelectValue placeholder="All Status" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="all">All Status</SelectItem>
//                         <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
//                         <SelectItem value={OrderStatus.PROCESSING}>Processing</SelectItem>
//                         <SelectItem value={OrderStatus.COMPLETED}>Completed</SelectItem>
//                         <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>
//               </div>
//             </Card>
//           )}

//           {/* Active Filters Display */}
//           {activeFiltersCount > 0 && (
//             <div className="mb-4 flex flex-wrap gap-2 items-center px-3">
//               <span className="text-sm text-gray-600 font-medium">Active Filters:</span>
//               {searchText && (
//                 <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-800">
//                   Search: {searchText}
//                   <button
//                     onClick={() => {
//                       setLocalSearch("");
//                       dispatch({ type: "SET_SEARCH", payload: "" });
//                       dispatch({ type: "SET_PAGE", payload: 1 });
//                     }}
//                     className="ml-2 hover:text-purple-600 font-bold"
//                   >
//                     ×
//                   </button>
//                 </span>
//               )}
//               {status && (
//                 <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
//                   Status: {status}
//                   <button
//                     onClick={() => {
//                       setLocalStatus("all");
//                       dispatch({ type: "SET_STATUS", payload: undefined });
//                       dispatch({ type: "SET_PAGE", payload: 1 });
//                     }}
//                     className="ml-2 hover:text-green-600 font-bold"
//                   >
//                     ×
//                   </button>
//                 </span>
//               )}
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={handleResetFilters}
//                 className="text-red-600 ml-auto hover:text-red-700"
//               >
//                 <FilterX className="size-4 mr-1" />
//                 Reset All Filters
//               </Button>
//             </div>
//           )}

//           {/* Stats */}
//           <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
//                 <BiShoppingBag className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{totalOrders}</div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Pending</CardTitle>
//                 <BiTime className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{pendingCount}</div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Processing</CardTitle>
//                 <BiTime className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{processingCount}</div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Completed</CardTitle>
//                 <BiCheckCircle className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{completedCount}</div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Revenue</CardTitle>
//                 <BiDollar className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Table */}
//           {error ? (
//             <div className="p-4 text-red-500 bg-red-50 rounded-lg">
//               <div className="font-semibold">Error loading orders</div>
//               <div className="text-sm mt-1">{error.message}</div>
//               <Button
//                 variant="destructive"
//                 onClick={() => refetch()}
//                 className="mt-3"
//               >
//                 Retry
//               </Button>
//             </div>
//           ) : (
//             <TableBox
//               column={columns}
//               checkbox={canManage}
//               action={canManage}
//               loading={showTableLoading}
//               data={orders}
//               currentPage={currentPage}
//               totalPages={totalPages}
//               setCurrentPage={(page) =>
//                 dispatch({ type: "SET_PAGE", payload: page })
//               }
//               deletehandler={deleteHandler}
//               edithandler={editHandler}
//               height="max-h-[calc(100vh-420px)]"
//               createdAt={true}
//               updatedAt={true}
//               customRenderers={customRenderers}
//             />
//           )}
//         </div>
//       </div>

//       {/* Delete Confirmation Dialog */}
//       <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Delete Orders</DialogTitle>
//             <DialogDescription>
//               Are you sure you want to delete {selectedIds.length} order(s)?
//               This action cannot be undone.
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
//               Cancel
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={handleDelete}
//               disabled={isDeleting}
//             >
//               {isDeleting ? "Deleting..." : "Delete"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Add/Edit Order Modal */}
//       {/* {showAddEditDialog && (
//         <AddOrderTicket
//           onCancel={() => setShowAddEditDialog(false)}
//           selectedData={editingOrder}
//           isEditMode={!!editingOrder}
//           refetch={refetch}
//           currentMemberId={currentMember?.id}
//         />
//       )} */}
//     </Container>
//   );
// };

// export default AllOrderTicketPage;