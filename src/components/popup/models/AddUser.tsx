// // src/components/popup/models/AddUser.tsx
// "use client";
// import React, { useState, useEffect } from "react";
// import { useMutation } from "@apollo/client";
// import { CREATE_USER, UPDATE_USER } from "@/graphql/query/user.query";
// import { BiX, BiUser, BiMale, BiPhone, BiLock, BiImage } from "react-icons/bi";
// import { UserRole } from "@/Types/types";
// import { toast } from "react-toastify";
// import Image from "next/image";

// interface AddUserProps {
//   onCancel: () => void;
//   selectedData: any;
//   isEditMode: boolean;
//   refetch: () => void;
//   currentUserId?: string;
//   currentTenantId?: string;
//   isSuperAdmin?: boolean;
// }

// const AddUser: React.FC<AddUserProps> = ({
//   onCancel,
//   selectedData,
//   isEditMode,
//   refetch,
//   currentUserId,
//   currentTenantId,
//   isSuperAdmin = false,
// }) => {
//   const [formData, setFormData] = useState({
//     username: "",
//     email: "",
//     phone: "",
//     role: UserRole.USER,
//     imageUrl: "",
//     password: "",
//     confirmPassword: "",
//     isVerified: false,
//   });

//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (isEditMode && selectedData) {
//       setFormData({
//         username: selectedData.username || "",
//         email: selectedData.email || "",
//         phone: selectedData.phone || "",
//         role: selectedData.role || UserRole.USER,
//         imageUrl: selectedData.imageUrl || "",
//         password: "",
//         confirmPassword: "",
//         isVerified: selectedData.isVerified || false,
//       });
//     }
//   }, [isEditMode, selectedData]);

//   const [createUser] = useMutation(CREATE_USER);
//   const [updateUser] = useMutation(UPDATE_USER);

//   const validateForm = () => {
//     const newErrors: Record<string, string> = {};

//     if (!formData.username.trim()) {
//       newErrors.username = "Username is required";
//     }

//     if (!formData.email.trim()) {
//       newErrors.email = "Email is required";
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = "Email is invalid";
//     }

//     if (!isEditMode) {
//       if (!formData.password) {
//         newErrors.password = "Password is required";
//       } else if (formData.password.length < 6) {
//         newErrors.password = "Password must be at least 6 characters";
//       }

//       if (formData.password !== formData.confirmPassword) {
//         newErrors.confirmPassword = "Passwords do not match";
//       }
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       return;
//     }

//     setLoading(true);

//     try {
//       const userData = {
//         username: formData.username,
//         email: formData.email,
//         phone: formData.phone,
//         role: formData.role,
//         imageUrl: formData.imageUrl,
//         isVerified: formData.isVerified,
//         ...(!isSuperAdmin && { tenantId: currentTenantId }),
//       };

//       if (isEditMode && selectedData) {
//         const updateData = { ...userData };
//         // Don't send password in update unless it's being changed
//         if (formData.password) {
//           (updateData as any).password = formData.password;
//         }

//         const { data } = await updateUser({
//           variables: {
//             id: selectedData._id,
//             input: updateData,
//           },
//         });

//         if (data?.updateUser) {
//           toast.success("User updated successfully");
//           refetch();
//           onCancel();
//         }
//       } else {
//         const { data } = await createUser({
//           variables: {
//             input: {
//               ...userData,
//               password: formData.password,
//             },
//           },
//         });

//         if (data?.createUser) {
//           toast.success("User created successfully");
//           refetch();
//           onCancel();
//         }
//       }
//     } catch (error: any) {
//       toast.error(error.message || "An error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChange = (field: string, value: any) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     // Clear error when user starts typing
//     if (errors[field]) {
//       setErrors(prev => ({ ...prev, [field]: "" }));
//     }
//   };

//   const getRoleOptions = () => {
//     const options = [
//       { value: UserRole.USER, label: "User" },
//       { value: UserRole.MANAGER, label: "Manager" },
//     ];

//     if (isSuperAdmin) {
//       options.unshift(
//         { value: UserRole.SUPERADMIN, label: "Super Admin" },
//         { value: UserRole.ADMIN, label: "Admin" }
//       );
//     } else if (currentUserId && currentUserId === selectedData?._id) {
//       // Admin editing themselves - keep admin role
//       options.unshift({ value: UserRole.ADMIN, label: "Admin" });
//     }

//     return options;
//   };

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
//         <div
//           className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
//           onClick={onCancel}
//         ></div>

//         <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
//           <div className="bg-white px-6 pt-6 pb-4">
//             <div className="flex items-center justify-between mb-6">
//               <div>
//                 <h3 className="text-xl font-bold text-gray-900">
//                   {isEditMode ? "Edit User" : "Add New User"}
//                 </h3>
//                 <p className="text-sm text-gray-600 mt-1">
//                   {isEditMode 
//                     ? "Update user information" 
//                     : "Create a new user account"}
//                 </p>
//               </div>
//               <button
//                 onClick={onCancel}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//               >
//                 <BiX className="w-5 h-5 text-gray-500" />
//               </button>
//             </div>

//             <form onSubmit={handleSubmit}>
//               <div className="space-y-4">
//                 {/* Profile Image */}
//                 <div className="flex justify-center mb-4">
//                   <div className="relative">
//                     {formData.imageUrl ? (
//                       <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
//                         <Image
//                           src={formData.imageUrl}
//                           alt="Profile"
//                           width={96}
//                           height={96}
//                           className="object-cover"
//                         />
//                       </div>
//                     ) : (
//                       <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
//                         {formData.username.charAt(0).toUpperCase() || "U"}
//                       </div>
//                     )}
//                     <button
//                       type="button"
//                       className="absolute bottom-0 right-0 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
//                     >
//                       <BiImage className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>

//                 {/* Username */}
//                 <div>
//                   <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
//                     <BiUser className="w-4 h-4 mr-2" />
//                     Username *
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.username}
//                     onChange={(e) => handleChange("username", e.target.value)}
//                     className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
//                       errors.username ? "border-red-500" : "border-gray-300"
//                     }`}
//                     placeholder="Enter username"
//                   />
//                   {errors.username && (
//                     <p className="mt-1 text-sm text-red-600">{errors.username}</p>
//                   )}
//                 </div>

//                 {/* Email */}
//                 <div>
//                   <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
//                     <BiMale className="w-4 h-4 mr-2" />
//                     Email Address *
//                   </label>
//                   <input
//                     type="email"
//                     value={formData.email}
//                     onChange={(e) => handleChange("email", e.target.value)}
//                     className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
//                       errors.email ? "border-red-500" : "border-gray-300"
//                     }`}
//                     placeholder="Enter email address"
//                   />
//                   {errors.email && (
//                     <p className="mt-1 text-sm text-red-600">{errors.email}</p>
//                   )}
//                 </div>

//                 {/* Phone */}
//                 <div>
//                   <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
//                     <BiPhone className="w-4 h-4 mr-2" />
//                     Phone Number
//                   </label>
//                   <input
//                     type="tel"
//                     value={formData.phone}
//                     onChange={(e) => handleChange("phone", e.target.value)}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                     placeholder="Enter phone number"
//                   />
//                 </div>

//                 {/* Role */}
//                 <div>
//                   <label className="text-sm font-medium text-gray-700 mb-2 block">
//                     Role
//                   </label>
//                   <select
//                     value={formData.role}
//                     onChange={(e) => handleChange("role", e.target.value)}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                   >
//                     {getRoleOptions().map((option) => (
//                       <option key={option.value} value={option.value}>
//                         {option.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Password Fields (only for create or if changing password) */}
//                 {!isEditMode && (
//                   <>
//                     <div>
//                       <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
//                         <BiLock className="w-4 h-4 mr-2" />
//                         Password *
//                       </label>
//                       <input
//                         type="password"
//                         value={formData.password}
//                         onChange={(e) => handleChange("password", e.target.value)}
//                         className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
//                           errors.password ? "border-red-500" : "border-gray-300"
//                         }`}
//                         placeholder="Enter password"
//                       />
//                       {errors.password && (
//                         <p className="mt-1 text-sm text-red-600">{errors.password}</p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="text-sm font-medium text-gray-700 mb-2 block">
//                         Confirm Password *
//                       </label>
//                       <input
//                         type="password"
//                         value={formData.confirmPassword}
//                         onChange={(e) => handleChange("confirmPassword", e.target.value)}
//                         className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
//                           errors.confirmPassword ? "border-red-500" : "border-gray-300"
//                         }`}
//                         placeholder="Confirm password"
//                       />
//                       {errors.confirmPassword && (
//                         <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
//                       )}
//                     </div>
//                   </>
//                 )}

//                 {/* Verification Status */}
//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     id="isVerified"
//                     checked={formData.isVerified}
//                     onChange={(e) => handleChange("isVerified", e.target.checked)}
//                     className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
//                   />
//                   <label htmlFor="isVerified" className="ml-2 text-sm text-gray-700">
//                     User is verified
//                   </label>
//                 </div>
//               </div>

//               {/* Form Actions */}
//               <div className="mt-8 flex justify-end space-x-3">
//                 <button
//                   type="button"
//                   onClick={onCancel}
//                   className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//                   disabled={loading}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {loading ? (
//                     <span className="flex items-center">
//                       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       {isEditMode ? "Updating..." : "Creating..."}
//                     </span>
//                   ) : (
//                     <span>{isEditMode ? "Update User" : "Create User"}</span>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddUser;