// /* eslint-disable @typescript-eslint/no-explicit-any */
// // src/components/popup/models/AddMember.tsx
// "use client";
// import React, { useState, useEffect, ChangeEvent } from "react";
// import { useMutation } from "@apollo/client/react";
// import { CREATE_MEMBER, UPDATE_MEMBER } from "@/graphql/query/member.query";
// import {
//   BiUser,
//   BiEnvelope,
//   BiPhone,
//   BiLock,
//   BiShield,
//   BiKey,
//   BiImage,
//   BiCheckCircle,
//   BiCalendar,
//   BiIdCard,
//   BiMap,
//   BiBriefcase,
//   BiBuilding,
//   BiWallet,
//   BiCog,
//   BiPlus,
//   BiX,
//   BiChevronDown,
//   BiChevronUp,
//   BiCopy,
//   BiReset
// } from "react-icons/bi";
// import {
//   FiX,
//   FiUpload,
//   FiGlobe,
//   FiCreditCard,
//   FiShield,
//   FiDatabase,
//   FiBarChart2,
//   FiUsers,
//   FiRefreshCw
// } from "react-icons/fi";
// import { Switch } from "@headlessui/react";
// import { PlatformRole, MemberStatus, SubscriptionPlan, SubscriptionStatus } from "@/enums/common.enums";
// import { toast } from "react-toastify";
// import Image from "next/image";
// import Popup from "../Popup";
// import InputBox from "@/components/InputBox";
// import { removeTypename } from "@/helpers/removetypename";
// import { AVAILABLE_MODULES, ROLE_BASED_DEFAULT_MODULES } from "@/modules/modules";

// interface AddMemberProps {
//   onCancel: () => void;
//   selectedData: any;
//   isEditMode: boolean;
//   refetch: () => void;
//   currentMemberId?: string;
//   currentTenantId?: string;
//   isSuperAdmin?: boolean;
// }

// interface ModuleAccess {
//   moduleName: string;
//   canAccess: boolean;
//   permissions: string[];
//   description?: string;
// }

// interface Address {
//   street?: string;
//   city?: string;
//   state?: string;
//   zip?: string;
//   country?: string;
// }

// interface Subscription {
//   plan: SubscriptionPlan;
//   startDate: string;
//   endDate?: string;
//   isActive: boolean;
//   paymentMethod?: string;
// }

// const ROLE_DEFAULT_CONFIG = {
//   [PlatformRole.SUPER_ADMIN]: {
//     modules: ROLE_BASED_DEFAULT_MODULES.SUPER_ADMIN,
//     isVerified: true,
//   },
//   [PlatformRole.OWNER]: {
//     modules: ROLE_BASED_DEFAULT_MODULES.OWNER,
//     isVerified: true,
//   }
// };

// const AddMember: React.FC<AddMemberProps> = ({
//   onCancel,
//   selectedData,
//   isEditMode,
//   refetch,
//   currentMemberId,
//   isSuperAdmin = false,
// }) => {
//   const [form, setForm] = useState({
//     firstName: "",
//     lastName: "",
//     username: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirmPassword: "",
//     role: PlatformRole.OWNER,
//     status: MemberStatus.ACTIVE,
//     isVerified: false,
//     avatar: "",
//     subscription: {
//       plan: SubscriptionPlan.FREE,
//       startDate: new Date().toISOString().split("T")[0],
//       endDate: "",
//       isActive: true,
//       paymentMethod: "",
//     } as Subscription,
//     address: {
//       street: "",
//       city: "",
//       state: "",
//       zip: "",
//       country: "",
//     } as Address,
//     modules: [] as ModuleAccess[],
//   });

//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("basic");
//   const [showPasswordFields, setShowPasswordFields] = useState(!isEditMode);
//   const [selectedImage, setSelectedImage] = useState<string>("");
//   const [useRoleDefaults, setUseRoleDefaults] = useState(true);

//   const tabs = [
//     { id: "basic", label: "Basic Info", icon: <BiUser className="w-4 h-4" /> },
//     { id: "role", label: "Role & Password", icon: <BiShield className="w-4 h-4" /> },
//     { id: "modules", label: "Module Permissions", icon: <FiDatabase className="w-4 h-4" /> },
//     { id: "subscription", label: "Subscription", icon: <BiWallet className="w-4 h-4" /> },
//     { id: "address", label: "Address", icon: <BiMap className="w-4 h-4" /> },
//   ];

//   type Permission = "READ" | "WRITE" | "DELETE" | "UPDATE";

//   const permissionOptions: Permission[] = [
//     "READ", "WRITE", "DELETE", "UPDATE"
//   ];

//   // Apply role defaults when role changes - FIXED: Removed MemberRole reference
//   const applyRoleDefaults = (role: PlatformRole) => {
//     if (!useRoleDefaults) return;

//     const defaults = ROLE_DEFAULT_CONFIG[role];

//     // Set default modules based on role
//     const defaultModules = AVAILABLE_MODULES.map(module => {
//       const roleModule = defaults?.modules.find(m => m.moduleName === module.name);
//       return {
//         moduleName: module.name,
//         canAccess: !!roleModule,
//         permissions: roleModule ? [...roleModule.permissions] : [],
//         description: module.description,
//       };
//     });

//     setForm(prev => ({
//       ...prev,
//       status: defaults?.defaultStatus || MemberStatus.ACTIVE,
//       isVerified: defaults?.isVerified || false,
//       modules: defaultModules,
//     }));
//   };

//   useEffect(() => {
//     if (isEditMode && selectedData) {
//       // Map existing data to form
//       const mappedData: any = {
//         firstName: selectedData.firstName || "",
//         lastName: selectedData.lastName || "",
//         username: selectedData.username || "",
//         email: selectedData.email || "",
//         phone: selectedData.phone || "",
//         password: "",
//         confirmPassword: "",
//         role: selectedData.role || PlatformRole.OWNER,
//         status: selectedData.status || MemberStatus.ACTIVE,
//         isVerified: selectedData.isVerified || false,
//         avatar: selectedData.avatar || "",
//         subscription: {
//           plan: selectedData.subscription?.plan || SubscriptionPlan.FREE,
//           startDate: selectedData.subscription?.startDate
//             ? new Date(selectedData.subscription.startDate).toISOString().split("T")[0]
//             : new Date().toISOString().split("T")[0],
//           endDate: selectedData.subscription?.endDate
//             ? new Date(selectedData.subscription.endDate).toISOString().split("T")[0]
//             : "",
//           isActive: selectedData.subscription?.isActive || true,
//           paymentMethod: selectedData.subscription?.paymentMethod || "",
//         },
//         address: selectedData.address || {
//           street: "",
//           city: "",
//           state: "",
//           zip: "",
//           country: "",
//         },
//         modules: selectedData.modules || [],
//       };

//       setForm(mappedData);
//       setSelectedImage(selectedData.avatar || "");
//       setUseRoleDefaults(false); // Don't apply defaults in edit mode

//       // Initialize modules if not present
//       if (!selectedData.modules || selectedData.modules.length === 0) {
//         const defaultModules = AVAILABLE_MODULES.map(module => ({
//           moduleName: module.name,
//           canAccess: false,
//           permissions: [],
//           description: module.description,
//         }));
//         setForm(prev => ({ ...prev, modules: defaultModules }));
//       }
//     } else {
//       // Initialize with role defaults for new members
//       const defaultModules = AVAILABLE_MODULES.map(module => ({
//         moduleName: module.name,
//         canAccess: false,
//         permissions: [],
//         description: module.description,
//       }));

//       setForm(prev => ({
//         ...prev,
//         modules: defaultModules,
//         // Auto-generate username from email if available
//         username: prev.email ? prev.email.split('@')[0] : '',
//         // Set default role based on isSuperAdmin
//         role: isSuperAdmin ? PlatformRole.SUPER_ADMIN : PlatformRole.OWNER,
//       }));

//       // Apply default role settings
//       const defaultRole = isSuperAdmin ? PlatformRole.SUPER_ADMIN : PlatformRole.OWNER;
//       applyRoleDefaults(defaultRole);
//     }
//   }, [isEditMode, selectedData, isSuperAdmin]);

//   const [createMember] = useMutation<any>(CREATE_MEMBER);
//   const [updateMember] = useMutation<any>(UPDATE_MEMBER);

//   const handleChange = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value, type } = e.target;

//     if (name === 'role') {
//       const newRole = value as PlatformRole;
//       setForm(prev => ({ ...prev, role: newRole }));

//       // Apply role defaults when role changes
//       if (useRoleDefaults) {
//         applyRoleDefaults(newRole);
//       }
//       return;
//     }

//     if (name.includes('.')) {
//       // Handle nested properties
//       const [parent, child] = name.split('.');
//       if (parent === 'subscription' || parent === 'address') {
//         setForm(prev => ({
//           ...prev,
//           [parent]: {
//             ...(prev[parent as keyof typeof form] as Record<string, any>),
//             [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
//           }
//         }));
//       }
//     } else {
//       if (type === "checkbox") {
//         const checked = (e.target as HTMLInputElement).checked;
//         setForm((prev) => ({ ...prev, [name]: checked }));
//       } else {
//         setForm((prev) => ({ ...prev, [name]: value }));
//       }
//     }

//     // Auto-generate username from email
//     if (name === 'email' && !isEditMode && !form.username) {
//       const username = value.split('@')[0];
//       setForm(prev => ({ ...prev, username }));
//     }

//     // Clear error when user starts typing
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: "" }));
//     }
//   };

//   const handleModuleAccessChange = (moduleName: string, checked: boolean) => {
//     setForm(prev => {
//       const modules = prev.modules.map(module => {
//         if (module.moduleName === moduleName) {
//           // If enabling module and it has no permissions, use role defaults
//           if (checked && module.permissions.length === 0 && useRoleDefaults) {
//             const roleDefaults = ROLE_DEFAULT_CONFIG[form.role];
//             const roleModule = roleDefaults?.modules.find((m: any) => m.moduleName === moduleName);
//             return {
//               ...module,
//               canAccess: checked,
//               permissions: roleModule ? [...roleModule.permissions] : []
//             };
//           }
//           return { ...module, canAccess: checked };
//         }
//         return module;
//       });
//       return { ...prev, modules };
//     });
//   };

//   const handleModulePermissionChange = (moduleName: string, permission: string, checked: boolean) => {
//     setForm(prev => {
//       const modules = prev.modules.map(module => {
//         if (module.moduleName === moduleName) {
//           const permissions = checked
//             ? [...module.permissions, permission]
//             : module.permissions.filter(p => p !== permission);
//           return { ...module, permissions };
//         }
//         return module;
//       });
//       return { ...prev, modules };
//     });
//   };

//   const resetToRoleDefaults = () => {
//     const confirm = window.confirm("Reset all permissions and modules to role defaults? This will overwrite current settings.");
//     if (confirm) {
//       applyRoleDefaults(form.role);
//       toast.success("Reset to role defaults");
//     }
//   };

//   const copyPermissionsToAllModules = () => {
//     const confirm = window.confirm("Copy selected permissions to all enabled modules? This will overwrite module-specific permissions.");
//     if (confirm) {
//       // Get all permissions that are selected across any module
//       const allPermissions = Array.from(
//         new Set(form.modules.flatMap(m => m.permissions))
//       );

//       setForm(prev => ({
//         ...prev,
//         modules: prev.modules.map(module => ({
//           ...module,
//           permissions: module.canAccess ? [...allPermissions] : []
//         }))
//       }));
//       toast.success("Permissions copied to all enabled modules");
//     }
//   };

//   const validateForm = () => {
//     const newErrors: Record<string, string> = {};

//     if (!form.firstName.trim()) {
//       newErrors.firstName = "First name is required";
//     }

//     if (!form.lastName.trim()) {
//       newErrors.lastName = "Last name is required";
//     }

//     if (!form.username.trim()) {
//       newErrors.username = "Username is required";
//     } else if (form.username.length < 3) {
//       newErrors.username = "Username must be at least 3 characters";
//     }

//     if (!form.email.trim()) {
//       newErrors.email = "Email is required";
//     } else if (!/\S+@\S+\.\S+/.test(form.email)) {
//       newErrors.email = "Please enter a valid email address";
//     }

//     if (!isEditMode || showPasswordFields) {
//       if (!form.password) {
//         newErrors.password = "Password is required";
//       } else if (form.password.length < 6) {
//         newErrors.password = "Password must be at least 6 characters";
//       }

//       if (form.password !== form.confirmPassword) {
//         newErrors.confirmPassword = "Passwords do not match";
//       }
//     }

//     setErrors(newErrors);
//     console.log({ newErrors: newErrors })
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     // Optional: enable validation
//     // if (!validateForm()) {
//     //   toast.error("Please fix the validation errors before submitting.");
//     //   return;
//     // }

//     setLoading(true);

//     try {
//       // ✅ Build member payload cleanly
//       const memberData = {
//         firstName: form.firstName.trim(),
//         lastName: form.lastName.trim(),
//         username: form.username.trim(),
//         email: form.email.trim().toLowerCase(),
//         phone: form.phone.trim(),
//         role: form.role,
//         status: form.status,
//         isVerified: form.isVerified,
//         avatar: form.avatar?.trim() || null,
//         subscription: {
//           ...form.subscription,
//           startDate: form.subscription.startDate,
//           endDate: form.subscription.endDate ? new Date(form.subscription.endDate) : null,
//         },
//         address: form.address?.street ? form.address : null,
//         modules: form.modules
//           .filter(m => m.canAccess)
//           .map(m => ({
//             moduleName: m.moduleName,
//             canAccess: true,
//             permissions: m.permissions,
//           })),
//       };

//       const cleanInput = removeTypename(memberData)
//       console.log({ memberData: memberData })
//       console.log({ cleanInput: cleanInput })

//       let response;

//       if (isEditMode && selectedData) {
//         // ✅ Build update payload
//         const updateData: any = { ...cleanInput };
//         if (showPasswordFields && form.password) {
//           updateData.password = form.password;
//         }

//         response = await updateMember({
//           variables: {
//             id: selectedData._id || selectedData.id,
//             input: {
//               id: selectedData._id || selectedData.id,
//               ...cleanInput,
//             },
//           },
//         });

//         // if (response?.error?.errors[0]?.length) throw new Error(response?.error?.errors[0].message);
//         if (response?.error) {
//           toast.error(response?.error?.message)
//         };

//         if (response?.data?.updateMember) {
//           toast.success("Member updated successfully!");
//           refetch();
//           onCancel();
//         }
//       } else {
//         response = await createMember({
//           variables: {
//             input: {
//               ...cleanInput,
//               password: form.password,
//             },
//           },
//         });

//         // if (response.errors?.length) throw new Error(response.errors[0].message);
//         if (response?.error) {
//           toast.error(response?.error?.message)
//         };

//         if (response.data?.createMember) {
//           toast.success("Member created successfully!");
//           refetch();
//           onCancel();
//         }
//       }
//     } catch (error: any) {
//       console.error("Error:", error);

//       // ✅ Safe error extraction
//       const gqlMessage = error?.graphQLErrors?.[0]?.message;
//       const errorMessage = gqlMessage || error.message || "An error occurred";

//       if (/duplicate|already exists/i.test(errorMessage)) {
//         if (/email/i.test(errorMessage)) {
//           toast.error("This email is already registered");
//         } else if (/username/i.test(errorMessage)) {
//           toast.error("This username is already taken");
//         } else {
//           toast.error("Duplicate entry detected");
//         }
//       } else {
//         toast.error(errorMessage);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };


//   const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       if (file.size > 2 * 1024 * 1024) {
//         toast.error("Image size must be less than 2MB");
//         return;
//       }

//       const imageUrl = URL.createObjectURL(file);
//       setForm(prev => ({ ...prev, avatar: imageUrl }));
//       setSelectedImage(imageUrl);
//     }
//   };

//   const removeImage = () => {
//     setForm(prev => ({ ...prev, avatar: "" }));
//     setSelectedImage("");
//   };

//   const getRoleOptions = () => {
//     const options = [
//       {
//         value: PlatformRole.OWNER,
//         label: "Owner",
//         description: "Owner privileges",
//         color: "text-green-600",
//         bgColor: "bg-green-100"
//       },
//     ];

//     if (isSuperAdmin) {
//       options.unshift(
//         {
//           value: PlatformRole.SUPER_ADMIN,
//           label: "Super Admin",
//           description: "Full system access and control",
//           color: "text-purple-600",
//           bgColor: "bg-purple-100"
//         },
//         {
//           value: PlatformRole.ADMIN,
//           label: "Admin",
//           description: "Administrative privileges",
//           color: "text-blue-600",
//           bgColor: "bg-blue-100"
//         }
//       );
//     } else {
//       options.unshift({
//         value: PlatformRole.ADMIN,
//         label: "Admin",
//         description: "Administrative privileges",
//         color: "text-blue-600",
//         bgColor: "bg-blue-100"
//       });
//     }

//     if (isEditMode && currentMemberId === selectedData?._id) {
//       return options.filter(option => option.value === selectedData?.role);
//     }

//     return options;
//   };

//   const renderRoleIcon = (role: PlatformRole) => {
//     switch (role) {
//       case PlatformRole.SUPER_ADMIN:
//         return <BiShield className="w-5 h-5 text-purple-600" />;
//       case PlatformRole.ADMIN:
//         return <BiShield className="w-5 h-5 text-blue-600" />;
//       case PlatformRole.OWNER:
//         return <BiUser className="w-5 h-5 text-green-600" />;
//       default:
//         return <BiUser className="w-5 h-5 text-gray-600" />;
//     }
//   };

//   return (
//     <Popup>
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
//         {/* Header */}
//         <div className="sticky top-0 bg-white z-30 rounded-t-xl border-b border-gray-100">
//           <div className="flex justify-between items-center px-6 py-4">
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900">
//                 {isEditMode ? "Edit Member" : "Add New Member"}
//               </h2>
//               <p className="text-sm text-gray-500 mt-1">
//                 {isEditMode
//                   ? "Update member details and permissions"
//                   : "Create a new team member account"}
//               </p>
//             </div>
//             <div className="flex items-center space-x-3">
//               <button
//                 onClick={onCancel}
//                 className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
//                 disabled={loading}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSubmit}
//                 disabled={loading}
//                 className={`px-4 py-2 text-white rounded-lg font-medium text-sm flex items-center ${loading
//                   ? "bg-blue-400 cursor-not-allowed"
//                   : "bg-blue-600 hover:bg-blue-700 transition-colors"
//                   }`}
//               >
//                 {loading ? (
//                   <>
//                     <svg
//                       className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       ></circle>
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                       ></path>
//                     </svg>
//                     Processing...
//                   </>
//                 ) : (
//                   <>
//                     {isEditMode ? (
//                       <>
//                         <BiCheckCircle className="mr-2" />
//                         Update Member
//                       </>
//                     ) : (
//                       <>
//                         <BiPlus className="mr-2" />
//                         Create Member
//                       </>
//                     )}
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>

//           {/* Tab Navigation */}
//           <div className="px-6 bg-blue-50">
//             <nav className="flex space-x-1 overflow-x-auto">
//               {tabs.map((tab) => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`flex items-center px-4 py-3 rounded-t-lg transition-colors text-sm font-medium ${activeTab === tab.id
//                     ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
//                     : "text-gray-600 hover:text-blue-600"
//                     }`}
//                 >
//                   <span className="mr-2">{tab.icon}</span>
//                   {tab.label}
//                 </button>
//               ))}
//             </nav>
//           </div>
//         </div>

//         <div className="p-6">
//           {/* Basic Information Tab */}
//           {activeTab === "basic" && (
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <div className="space-y-6">
//                 <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//                     <BiUser className="mr-2" />
//                     Personal Information
//                   </h3>
//                   <div className="space-y-4">
//                     <div className="grid grid-cols-2 gap-4">
//                       <InputBox
//                         type="text"
//                         label="First Name *"
//                         name="firstName"
//                         value={form.firstName}
//                         onChange={handleChange}
//                         placeholder="John"
//                         error={errors.firstName}
//                       />
//                       <InputBox
//                         type="text"
//                         label="Last Name *"
//                         name="lastName"
//                         value={form.lastName}
//                         onChange={handleChange}
//                         placeholder="Doe"
//                         error={errors.lastName}
//                       />
//                     </div>

//                     <InputBox
//                       type="text"
//                       label="Username *"
//                       name="username"
//                       value={form.username}
//                       onChange={handleChange}
//                       placeholder="john_doe"
//                       error={errors.username}
//                     />

//                     <InputBox
//                       type="email"
//                       label="Email Address *"
//                       name="email"
//                       value={form.email}
//                       onChange={handleChange}
//                       placeholder="john@example.com"
//                       error={errors.email}
//                     />

//                     <InputBox
//                       type="tel"
//                       label="Phone Number"
//                       name="phone"
//                       value={form.phone}
//                       onChange={handleChange}
//                       placeholder="+1 (555) 123-4567"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-6">
//                 <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//                     <BiImage className="mr-2" />
//                     Profile Photo
//                   </h3>
//                   <div className="flex flex-col items-center">
//                     <div className="relative group mb-4">
//                       <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-linear-to-br from-blue-50 to-gray-100">
//                         {selectedImage ? (
//                           <Image
//                             src={selectedImage}
//                             alt="Profile"
//                             width={128}
//                             height={128}
//                             className="w-full h-full object-cover"
//                           />
//                         ) : (
//                           <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
//                             {form.firstName.charAt(0).toUpperCase() || "U"}
//                           </div>
//                         )}
//                       </div>
//                       {selectedImage && (
//                         <button
//                           onClick={removeImage}
//                           className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
//                         >
//                           <BiX className="w-4 h-4" />
//                         </button>
//                       )}
//                     </div>

//                     <label className="cursor-pointer">
//                       <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
//                         <FiUpload className="text-gray-400 mr-2" />
//                         <span className="text-sm text-gray-700">
//                           Upload Photo
//                         </span>
//                       </div>
//                       <input
//                         type="file"
//                         accept="image/*"
//                         onChange={handleImageUpload}
//                         className="hidden"
//                         disabled={loading}
//                       />
//                     </label>
//                     <p className="text-xs text-gray-500 mt-2">
//                       Max 2MB • JPG, PNG, GIF
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Role & Password Tab */}
//           {activeTab === "role" && (
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <div>
//                 <div className="bg-gray-50 p-5 rounded-lg h-fit border border-gray-200">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//                     <BiLock className="mr-2" />
//                     Password
//                   </h3>
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Password {!isEditMode && "*"}
//                       </label>
//                       <div className="relative">
//                         <input
//                           type="password"
//                           name="password"
//                           value={form.password}
//                           onChange={handleChange}
//                           placeholder={isEditMode ? "Enter new password" : "Enter password"}
//                           className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password ? "border-red-500 bg-red-50" : "border-gray-300"
//                             }`}
//                           disabled={loading}
//                         />
//                         <BiLock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                       </div>
//                       {errors.password && (
//                         <p className="text-xs text-red-500 mt-1">{errors.password}</p>
//                       )}
//                       <p className="text-xs text-gray-500 mt-1">
//                         Minimum 6 characters
//                       </p>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Confirm Password {!isEditMode && "*"}
//                       </label>
//                       <div className="relative">
//                         <input
//                           type="password"
//                           name="confirmPassword"
//                           value={form.confirmPassword}
//                           onChange={handleChange}
//                           placeholder="Confirm password"
//                           className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.confirmPassword ? "border-red-500 bg-red-50" : "border-gray-300"
//                             }`}
//                           disabled={loading}
//                         />
//                         <BiLock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                       </div>
//                       {errors.confirmPassword && (
//                         <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex flex-col space-y-4 mt-6">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Status *
//                       </label>
//                       <select
//                         name="status"
//                         value={form.status}
//                         onChange={handleChange}
//                         className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         disabled={loading}
//                       >
//                         <option value={MemberStatus.ACTIVE}>Active - Can access system</option>
//                         <option value={MemberStatus.INACTIVE}>Inactive - Limited access</option>
//                         <option value={MemberStatus.SUSPENDED}>Suspended - No access</option>
//                       </select>
//                     </div>
//                     <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
//                       <div>
//                         <p className="font-medium text-gray-900">Verified Account</p>
//                         <p className="text-sm text-gray-500">Mark member as verified</p>
//                       </div>
//                       <Switch
//                         checked={form.isVerified}
//                         onChange={(value) =>
//                           setForm(prev => ({ ...prev, isVerified: value }))
//                         }
//                         className={`${form.isVerified ? "bg-green-600" : "bg-gray-200"
//                           } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
//                       >
//                         <span
//                           className={`${form.isVerified ? "translate-x-6" : "translate-x-1"
//                             } inline-block h-4 w-4 transform rounded-full bg-white transition`}
//                         />
//                       </Switch>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               <div className="space-y-6">
//                 <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="text-lg font-semibold text-gray-900 flex items-center">
//                       <BiShield className="mr-2" />
//                       Role & Status
//                     </h3>
//                     {!isEditMode && (
//                       <div className="flex items-center">
//                         <Switch
//                           checked={useRoleDefaults}
//                           onChange={setUseRoleDefaults}
//                           className={`${useRoleDefaults ? "bg-blue-600" : "bg-gray-200"
//                             } relative inline-flex h-5 w-10 items-center rounded-full mr-2`}
//                         >
//                           <span
//                             className={`${useRoleDefaults ? "translate-x-5" : "translate-x-1"
//                               } inline-block h-3 w-3 transform rounded-full bg-white transition`}
//                           />
//                         </Switch>
//                         <span className="text-sm text-gray-600">Use role defaults</span>
//                       </div>
//                     )}
//                   </div>
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Role *
//                       </label>
//                       <div className="grid grid-cols-1 gap-2">
//                         {getRoleOptions().map((option) => (
//                           <label
//                             key={option.value}
//                             className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${form.role === option.value
//                               ? "border-blue-300 bg-blue-50"
//                               : "border-gray-200 hover:border-gray-300"
//                               }`}
//                           >
//                             <input
//                               type="radio"
//                               name="role"
//                               value={option.value}
//                               checked={form.role === option.value}
//                               onChange={handleChange}
//                               className="mt-1 text-blue-600 focus:ring-blue-500"
//                               disabled={loading || (isEditMode && currentMemberId === selectedData?._id)}
//                             />
//                             <div className="ml-3">
//                               <div className="flex items-center">
//                                 {renderRoleIcon(option.value)}
//                                 <span className="ml-2 font-medium text-gray-900">
//                                   {option.label}
//                                 </span>
//                                 {useRoleDefaults && (
//                                   <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
//                                     Defaults applied
//                                   </span>
//                                 )}
//                               </div>
//                               <p className="text-sm text-gray-600 mt-1">
//                                 {option.description}
//                               </p>
//                               {useRoleDefaults && (
//                                 <div className="mt-2 text-xs text-gray-500">
//                                   <div>
//                                     {ROLE_DEFAULT_CONFIG[option.value]?.modules?.length || 0} modules enabled
//                                   </div>
//                                 </div>
//                               )}
//                             </div>
//                           </label>
//                         ))}
//                       </div>
//                     </div>
//                     {isEditMode && (
//                       <button
//                         onClick={resetToRoleDefaults}
//                         className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//                       >
//                         <FiRefreshCw className="mr-2" />
//                         Reset to Role Defaults
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Modules Tab */}
//           {activeTab === "modules" && (
//             <div className="space-y-6">
//               <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-lg font-semibold text-gray-900 flex items-center">
//                     <FiDatabase className="mr-2" />
//                     Module Permissions
//                   </h3>
//                   <div className="flex items-center space-x-3">
//                     <button
//                       onClick={copyPermissionsToAllModules}
//                       className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50"
//                       title="Copy to all enabled modules"
//                     >
//                       <BiCopy className="mr-1" />
//                       Copy to All Modules
//                     </button>
//                   </div>
//                 </div>
//                 <div className="mb-4">
//                   <p className="text-sm text-gray-600">
//                     Configure permissions for each module individually. Each module has its own set of permissions.
//                   </p>
//                 </div>

//                 <div className="space-y-4">
//                   {form.modules.map((module: any, index) => {
//                     const roleModule = ROLE_DEFAULT_CONFIG[form.role]?.modules?.find(m => m.moduleName === module.moduleName);
//                     const hasRoleDefaults = roleModule && roleModule.permissions.length > 0;

//                     return (
//                       <div key={module.moduleName} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
//                         <div className="p-4 border-b border-gray-200 flex items-center justify-between">
//                           <div className="flex items-center">
//                             <Switch
//                               checked={module.canAccess}
//                               onChange={(value) => handleModuleAccessChange(module.moduleName, value)}
//                               className={`${module.canAccess ? "bg-blue-600" : "bg-gray-200"
//                                 } relative inline-flex h-5 w-10 items-center rounded-full mr-3`}
//                             >
//                               <span
//                                 className={`${module.canAccess ? "translate-x-5" : "translate-x-1"
//                                   } inline-block h-3 w-3 transform rounded-full bg-white transition`}
//                               />
//                             </Switch>
//                             <div>
//                               <div className="flex items-center">
//                                 <h4 className="font-medium text-gray-900">{module.moduleName}</h4>
//                                 {hasRoleDefaults && useRoleDefaults && (
//                                   <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
//                                     Role default
//                                   </span>
//                                 )}
//                               </div>
//                               <p className="text-sm text-gray-500">
//                                 {module.description}
//                               </p>
//                             </div>
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             {module.canAccess && (
//                               <span className="text-sm text-gray-600">
//                                 {module.permissions.length} permissions
//                               </span>
//                             )}
//                             <button
//                               type="button"
//                               onClick={() => {
//                                 if (module.canAccess && hasRoleDefaults && useRoleDefaults) {
//                                   // Reset to role defaults
//                                   const newModules = [...form.modules];
//                                   newModules[index] = {
//                                     ...module,
//                                     permissions: [...roleModule!.permissions]
//                                   };
//                                   setForm(prev => ({ ...prev, modules: newModules }));
//                                   toast.success(`Reset ${module.moduleName} to role defaults`);
//                                 } else if (module.canAccess) {
//                                   // Clear module permissions
//                                   const newModules = [...form.modules];
//                                   newModules[index] = { ...module, permissions: [] };
//                                   setForm(prev => ({ ...prev, modules: newModules }));
//                                 }
//                               }}
//                               className="text-sm text-blue-600 hover:text-blue-800"
//                               disabled={!module.canAccess}
//                             >
//                               {module.canAccess ? (hasRoleDefaults && useRoleDefaults ? "Reset" : "Clear") : "Enable to configure"}
//                             </button>
//                           </div>
//                         </div>

//                         {module.canAccess && (
//                           <div className="p-4 bg-gray-50">
//                             <div className="mb-3">
//                               <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Module Permissions
//                               </label>
//                               <div className="text-xs text-gray-500 mb-2">
//                                 {module.permissions.length === 0
//                                   ? "No permissions set"
//                                   : `${module.permissions.length} permission(s) selected`}
//                               </div>
//                             </div>
//                             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
//                               {permissionOptions.map(permission => {
//                                 const isModuleSpecific = module.permissions.includes(permission);
//                                 const isRoleDefault = roleModule?.permissions.includes(permission);

//                                 let bgColor = "bg-white";
//                                 if (isRoleDefault && isModuleSpecific) bgColor = "bg-blue-50";

//                                 return (
//                                   <label
//                                     key={permission}
//                                     className={`flex items-center p-2 rounded border cursor-pointer ${bgColor} ${isModuleSpecific ? 'border-blue-300' : 'border-gray-200 hover:border-gray-300'}`}
//                                   >
//                                     <input
//                                       type="checkbox"
//                                       checked={isModuleSpecific}
//                                       onChange={(e) => handleModulePermissionChange(module.moduleName, permission, e.target.checked)}
//                                       className="rounded text-blue-600 focus:ring-blue-500"
//                                       disabled={loading}
//                                     />
//                                     <span className="ml-2 text-sm text-gray-700 capitalize">
//                                       {permission}
//                                       {isRoleDefault && !isModuleSpecific && (
//                                         <span className="ml-1 text-xs text-blue-600">(role)</span>
//                                       )}
//                                     </span>
//                                   </label>
//                                 );
//                               })}
//                             </div>
//                             {module.permissions.length > 0 && (
//                               <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
//                                 <div className="flex items-center justify-between mb-1">
//                                   <p className="text-xs font-medium text-blue-900">
//                                     Selected Permissions ({module.permissions.length})
//                                   </p>
//                                   <button
//                                     onClick={() => {
//                                       const newModules = [...form.modules];
//                                       newModules[index] = { ...module, permissions: [] };
//                                       setForm(prev => ({ ...prev, modules: newModules }));
//                                     }}
//                                     className="text-xs text-blue-600 hover:text-blue-800"
//                                   >
//                                     Clear All
//                                   </button>
//                                 </div>
//                                 <div className="flex flex-wrap gap-1">
//                                   {module.permissions.map((permission: any) => (
//                                     <span
//                                       key={permission}
//                                       className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
//                                     >
//                                       {permission}
//                                       <button
//                                         type="button"
//                                         onClick={() => handleModulePermissionChange(module.moduleName, permission, false)}
//                                         className="ml-1 text-blue-600 hover:text-blue-800"
//                                       >
//                                         <BiX className="w-3 h-3" />
//                                       </button>
//                                     </span>
//                                   ))}
//                                 </div>
//                               </div>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>

//                 <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
//                   <h4 className="font-medium text-green-900 mb-1">
//                     Access Summary
//                   </h4>
//                   <div className="text-sm text-green-700 space-y-1">
//                     <p>
//                       Enabled Modules: {form.modules.filter(m => m.canAccess).length} of {form.modules.length}
//                     </p>
//                     <p>
//                       Total Permissions: {form.modules.reduce((sum, module) => sum + module.permissions.length, 0)}
//                     </p>
//                     <div className="mt-2 pt-2 border-t border-green-200">
//                       <p className="font-medium">Role Defaults Applied:</p>
//                       <div className="grid grid-cols-2 gap-2 mt-1">
//                         <div className="text-xs">
//                           <span className="font-medium">Default Modules:</span> {ROLE_DEFAULT_CONFIG[form.role]?.modules?.length || 0}
//                         </div>
//                         <div className="text-xs">
//                           <span className="font-medium">Default Permissions:</span>{" "}
//                           {ROLE_DEFAULT_CONFIG[form.role]?.modules?.reduce((sum, module) => sum + module.permissions.length, 0) || 0}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Subscription Tab */}
//           {activeTab === "subscription" && (
//             <div className="space-y-6">
//               <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//                   <BiWallet className="mr-2" />
//                   Subscription Details
//                 </h3>
//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Plan *
//                       </label>
//                       <select
//                         name="subscription.plan"
//                         value={form.subscription.plan}
//                         onChange={handleChange}
//                         className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         disabled={loading}
//                       >
//                         {Object.values(SubscriptionPlan).map(plan => (
//                           <option key={plan} value={plan}>
//                             {plan.charAt(0).toUpperCase() + plan.slice(1)}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Start Date *
//                       </label>
//                       <input
//                         type="date"
//                         name="subscription.startDate"
//                         value={form.subscription.startDate}
//                         onChange={handleChange}
//                         className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         disabled={loading}
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         End Date (Optional)
//                       </label>
//                       <input
//                         type="date"
//                         name="subscription.endDate"
//                         value={form.subscription.endDate}
//                         onChange={handleChange}
//                         className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         disabled={loading}
//                       />
//                     </div>
//                   </div>

//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Payment Method (Optional)
//                       </label>
//                       <input
//                         type="text"
//                         name="subscription.paymentMethod"
//                         value={form.subscription.paymentMethod}
//                         onChange={handleChange}
//                         placeholder="e.g., Credit Card, PayPal"
//                         className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         disabled={loading}
//                       />
//                     </div>

//                     <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
//                       <div>
//                         <p className="font-medium text-gray-900">Active Subscription</p>
//                         <p className="text-sm text-gray-500">Enable subscription access</p>
//                       </div>
//                       <Switch
//                         checked={form.subscription.isActive}
//                         onChange={(value) =>
//                           setForm(prev => ({
//                             ...prev,
//                             subscription: { ...prev.subscription, isActive: value }
//                           }))
//                         }
//                         className={`${form.subscription.isActive ? "bg-green-600" : "bg-gray-200"
//                           } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
//                       >
//                         <span
//                           className={`${form.subscription.isActive ? "translate-x-6" : "translate-x-1"
//                             } inline-block h-4 w-4 transform rounded-full bg-white transition`}
//                         />
//                       </Switch>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Address Tab */}
//           {activeTab === "address" && (
//             <div className="space-y-6">
//               <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//                   <BiMap className="mr-2" />
//                   Address Information
//                 </h3>
//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                   <div className="space-y-4">
//                     <InputBox
//                       type="text"
//                       label="Street"
//                       name="address.street"
//                       value={form.address.street}
//                       onChange={handleChange}
//                       placeholder="123 Main St"
//                     />

//                     <InputBox
//                       type="text"
//                       label="City"
//                       name="address.city"
//                       value={form.address.city}
//                       onChange={handleChange}
//                       placeholder="New York"
//                     />

//                     <InputBox
//                       type="text"
//                       label="State"
//                       name="address.state"
//                       value={form.address.state}
//                       onChange={handleChange}
//                       placeholder="NY"
//                     />
//                   </div>

//                   <div className="space-y-4">
//                     <InputBox
//                       type="text"
//                       label="ZIP/Postal Code"
//                       name="address.zip"
//                       value={form.address.zip}
//                       onChange={handleChange}
//                       placeholder="10001"
//                     />

//                     <InputBox
//                       type="text"
//                       label="Country"
//                       name="address.country"
//                       value={form.address.country}
//                       onChange={handleChange}
//                       placeholder="United States"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </Popup>
//   );
// };

// export default AddMember;