// // src/app/admin/user/page.tsx
// "use client";
// import React, { useEffect, useReducer, useState } from "react";
// import { BiSearch } from "react-icons/bi";
// import TableBox from "@/components/tablebox/TableBox";
// import Container from "@/components/Container";
// import { useMutation, useQuery } from "@apollo/client";
// import { DELETE_USERS, GET_PAGINATED_USERS } from "@/graphql/query/user.query";
// import {
//   filterReducer,
//   initialFilterState,
// } from "@/useReducerHooks/user-filter-reducer";
// import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
// import { toast } from "react-toastify";
// import AddUser from "@/components/popup/models/AddUser";
// import { UserRole } from "@/Types/types";
// const column = ["username", "email", "phone", "role"];
// const ITEMS_PER_PAGE = 10;

// interface IUser {
//   _id: string;
//   username: string;
//   email: string;
//   phone: string;
//   imageUrl: string;
//   role: string;
//   isVerified: boolean;
// }

// const Page = () => {
//   const [state, dispatch] = useReducer(filterReducer, initialFilterState);
//   const { currentPage, role, isVerified, searchText } = state;
//   const [selectedData, setSelectedData] = useState<any | null>(null);
//   const [debouncedSearch, setDebouncedSearch] = useState(searchText);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [showConfirmationModel, setShowConfirmationModel] = useState(false);
//   const [showAddModel, setShowAddModel] = useState(false);
//   const [selectedIdsForDeleteion, setSelectedIdsForDeleteion] = useState<
//     string[]
//   >([]);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearch(searchText);
//     }, 400);
//     return () => clearTimeout(timer);
//   }, [searchText]);

//   const roleValue: UserRole | null =
//   role === "superadmin"
//     ? UserRole.SUPERADMIN
//     : role === "admin"
//     ? UserRole.ADMIN
//     : role === "manager"
//     ? UserRole.MANAGER
//     : role === "user"
//     ? UserRole.USER
//     : role === "guest"
//     ? UserRole.GUEST
//     : null;

//   console.log({ role: role })
//   const { data, loading, error, refetch } = useQuery(GET_PAGINATED_USERS, {
//     variables: {
//       page: Number(currentPage) || 1,
//       limit: Number(ITEMS_PER_PAGE) || 10,
//       role: roleValue,
//       isVerified: isVerified,
//       search: debouncedSearch,
//     },
//     fetchPolicy: "network-only",
//   }); 
//   const [deleteUsers] = useMutation(DELETE_USERS);

//   const alldata: IUser[] = data?.getPaginatedUsers?.users || [];
//   const totalUsers = data?.getPaginatedUsers?.totalUsers || 0;
//   const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

//   const cancelDelete = () => {
//     setSelectedIdsForDeleteion([]);
//     console.log({ selectedIdsForDeleteion: selectedIdsForDeleteion });
//     setShowConfirmationModel(false);
//   };
//   const confirmDelete = async () => {
//     console.log({ selectedIdsForDeleteion: selectedIdsForDeleteion });
//     if (selectedIdsForDeleteion.length === 0) return;

//     const { data } = await deleteUsers({
//       variables: { ids: selectedIdsForDeleteion },
//     });

//     if (data?.deleteUsers?.success) {
//       toast.success(data.deleteUsers.message);
//       setShowConfirmationModel(false);
//       refetch(); // refresh list
//       setSelectedIdsForDeleteion([]);
//     } else {
//       console.log("frontend confirm delete funstion not working");
//       toast.error(data?.deleteUsers?.message || "Failed to delete users");
//     }
//   };
//   const deleteHandler = async (id: string[]) => {
//     setSelectedIdsForDeleteion(id);
//     setShowConfirmationModel(true);
//   };
//   const editHandler = (userData: any) => {
//     setIsEditMode(true);
//     setSelectedData(userData);
//     setShowAddModel(true);
//     console.log(isEditMode);
//     console.log(userData);
//   };

//   const addHandler = () => {
//     setSelectedData(null);
//     setIsEditMode(false);
//     setShowAddModel(true);
//   };

//   const cancelAddUser = () => {
//     setShowAddModel(false);
//   };

//   return (
//     <Container className="overflow-y-auto h-full">
//       <div className="w-full h-full text-[13px]">
//         <div className="w-full h-full bg-red-200 overflow-hidden px-4">
//           <div className="flex justify-between items-center">
//             <div className="p-6 space-y-1">
//               <div className="text-lg">User List</div>
//               <div className=" text-gray-600">
//                 You have {totalUsers} users.
//               </div>
//             </div>

//             <div className="flex p-6 justify-center items-center space-x-2">
//               {/* Role Filter */}
//               <select
//                 onChange={(e) =>
//                   dispatch({
//                     type: "SET_ROLE",
//                     payload: e.target.value || undefined,
//                   })
//                 }
//                 value={role === undefined ? "" : role}
//                 className="px-6 py-1 outline-none ring-1 ring-gray-300 text-gray-500 rounded-md"
//               >
//                 <option value="">-- Select Role --</option>
//                 <option value="admin">Admin</option>
//                 <option value="manager">Manager</option>
//                 <option value="customer">Customer</option>
//               </select>

//               {/* Verified Filter */}
//               <select
//                 value={isVerified === undefined ? "" : String(isVerified)}
//                 onChange={(e) => {
//                   const val = e.target.value;
//                   dispatch({
//                     type: "SET_VERIFIED",
//                     payload:
//                       val === "true"
//                         ? true
//                         : val === "false"
//                           ? false
//                           : undefined,
//                   });
//                 }}
//                 className="px-6 py-1 outline-none ring-1 ring-gray-300 text-gray-500 rounded-md"
//               >
//                 <option value="">-- Verified --</option>
//                 <option value="true">Verified</option>
//                 <option value="false">Unverified</option>
//               </select>

//               {/* Search Input */}
//               <div className="relative ring-1 ring-gray-300 rounded-md">
//                 <input
//                   onChange={(e) =>
//                     dispatch({ type: "SET_SEARCH", payload: e.target.value })
//                   }
//                   className="placeholder:text-gray-400/80 w-60 outline-none focus:ring-1 focus:ring-gray-700/40 py-1 pl-2 pr-8 bg-white rounded-md"
//                   placeholder="Search any field"
//                   type="text"
//                   value={searchText}
//                 />
//                 <BiSearch className="absolute size-5 top-1 right-2.5 z-10 text-gray-500" />
//               </div>

//               {/* Reset Button */}
//               <button
//                 onClick={() => dispatch({ type: "RESET_FILTERS" })}
//                 className="px-4 py-1 rounded-md bg-gray-100 text-gray-700 ring-1 ring-gray-300"
//               >
//                 Reset
//               </button>
//               <button
//                 onClick={addHandler}
//                 className="px-4 py-1 rounded-md bg-blue-700 text-white ring-1 "
//               >
//                 Add User
//               </button>
//             </div>
//           </div>

//           {/* Error or Table */}
//           {error ? (
//             <div className="p-4 text-red-500">
//               Error loading users: {error.message}
//             </div>
//           ) : (
//             <TableBox
//               column={column}
//               checkbox={true}
//               action={true}
//               loading={loading}
//               data={alldata}
//               image={true}
//               currentPage={currentPage}
//               totalPages={totalPages}
//               setCurrentPage={(page) =>
//                 dispatch({ type: "SET_PAGE", payload: page })
//               }
//               status={false}
//               isVerified={true}
//               deletehandler={deleteHandler}
//               edithandler={editHandler}
//               createdAt={true}
//               updatedAt={true}
//             />
//           )}
//         </div>
//       </div>
//       {showConfirmationModel && (
//         <ConfirmationBox onCancel={cancelDelete} onDelete={confirmDelete} />
//       )}

//       {showAddModel && (
//         <AddUser
//           onCancel={cancelAddUser}
//           selectedData={selectedData}
//           isEditMode={isEditMode}
//           refetch={refetch}
//         />
//       )}
//     </Container>
//   );
// };

// export default Page;
