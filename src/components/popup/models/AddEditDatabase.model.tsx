// // src/components/popup/models/AddEditDatabase.model.tsx
// "use client";
// import React, { useState, useEffect } from "react";
// import { useMutation } from "@apollo/client";
// import { toast } from "react-toastify";
// import { CREATE_DATABASE, UPDATE_DATABASE } from "@/graphql/query/company.query";
// // import { IDatabase } from "@/app/admin/companies/page";

// interface AddEditDatabaseProps {
//   onCancel: () => void;
//   selectedData: any | null;
//   isEditMode: boolean;
//   companyId: string | undefined;
//   refetch: () => void;
//   databaseTypeOptions: { value: string; label: string }[];
//   databaseStatusOptions: { value: string; label: string }[];
// }

// const AddEditDatabase: React.FC<AddEditDatabaseProps> = ({
//   onCancel,
//   selectedData,
//   isEditMode,
//   companyId,
//   refetch,
//   databaseTypeOptions,
//   databaseStatusOptions,
// }) => {
//   const [formData, setFormData] = useState({
//     name: "",
//     domain: "",
//     siteName: "",
//     uri: "",
//     type: "DEVELOPMENT",
//     status: "ACTIVE",
//   });

//   const [loading, setLoading] = useState(false);

//   const [createDatabase] = useMutation(CREATE_DATABASE);
//   const [updateDatabase] = useMutation(UPDATE_DATABASE);

//   useEffect(() => {
//     if (selectedData && isEditMode) {
//       setFormData({
//         name: selectedData.name || "",
//         domain: selectedData.domain || "",
//         siteName: selectedData.siteName || "",
//         uri: selectedData.uri || "",
//         type: selectedData.type || "DEVELOPMENT",
//         status: selectedData.status || "ACTIVE",
//       });
//     }
//   }, [selectedData, isEditMode]);

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     if (!companyId && !isEditMode) {
//       toast.error("Company ID is required");
//       setLoading(false);
//       return;
//     }

//     try {
//       const input = {
//         ...formData,
//         companyId: isEditMode ? selectedData?.companyId : companyId,
//       };

//       if (isEditMode && selectedData) {
//         const { data } = await updateDatabase({
//           variables: {
//             id: selectedData._id,
//             input,
//           },
//         });

//         if (data?.updateDatabase?.success) {
//           toast.success(data.updateDatabase.message);
//           refetch();
//           onCancel();
//         } else {
//           toast.error(data?.updateDatabase?.message || "Failed to update database");
//         }
//       } else {
//         const { data } = await createDatabase({
//           variables: { input },
//         });

//         if (data?.createDatabase?.success) {
//           toast.success(data.createDatabase.message);
//           refetch();
//           onCancel();
//         } else {
//           toast.error(data?.createDatabase?.message || "Failed to create database");
//         }
//       }
//     } catch (error: any) {
//       toast.error(error.message || "An error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
//         <div className="border-b border-gray-200 px-6 py-4">
//           <div className="flex justify-between items-center">
//             <h2 className="text-xl font-bold text-gray-900">
//               {isEditMode ? "Edit Database" : "Add New Database"}
//             </h2>
//             <button
//               onClick={onCancel}
//               className="p-2 rounded-md hover:bg-gray-100 transition-colors"
//             >
//               <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
//           <div className="space-y-6">
//             {/* Database Information */}
//             <div className="space-y-4">
//               <h3 className="font-medium text-gray-900">Database Information</h3>
              
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Database Name *
//                 </label>
//                 <input
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//                   placeholder="e.g., Production DB, Staging DB"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Site Name *
//                 </label>
//                 <input
//                   type="text"
//                   name="siteName"
//                   value={formData.siteName}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//                   placeholder="e.g., My App Site"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Domain *
//                 </label>
//                 <div className="flex">
//                   <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
//                     https://
//                   </span>
//                   <input
//                     type="text"
//                     name="domain"
//                     value={formData.domain}
//                     onChange={handleChange}
//                     required
//                     className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//                     placeholder="example.com"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Database URI *
//                 </label>
//                 <input
//                   type="text"
//                   name="uri"
//                   value={formData.uri}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//                   placeholder="mongodb://localhost:27017/dbname"
//                 />
//               </div>
//             </div>

//             {/* Configuration */}
//             <div className="space-y-4">
//               <h3 className="font-medium text-gray-900">Configuration</h3>
              
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Type
//                   </label>
//                   <select
//                     name="type"
//                     value={formData.type}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//                   >
//                     {databaseTypeOptions.map((option) => (
//                       <option key={option.value} value={option.value}>
//                         {option.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Status
//                   </label>
//                   <select
//                     name="status"
//                     value={formData.status}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//                   >
//                     {databaseStatusOptions.map((option) => (
//                       <option key={option.value} value={option.value}>
//                         {option.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//             </div>

//             {/* Form Actions */}
//             <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
//               <button
//                 type="button"
//                 onClick={onCancel}
//                 className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
//                 disabled={loading}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
//               >
//                 {loading && (
//                   <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                   </svg>
//                 )}
//                 <span>{isEditMode ? "Update Database" : "Create Database"}</span>
//               </button>
//             </div>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddEditDatabase;