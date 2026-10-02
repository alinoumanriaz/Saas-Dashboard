// // src/app/admin/company/page.tsx
// "use client";
// import { useQuery } from "@apollo/client/react";
// import Container from "@/components/Container";
// import { GET_COMPANY_BY_ID } from "@/graphql/query/company.query";
// import { useAppSelector } from "@/redux/hooks";
// import {
//   BsBuilding,
//   BsEnvelope,
//   BsTelephone,
//   BsGeoAlt,
//   BsClock,
//   BsCalendar,
//   BsShieldCheck,
//   BsMap,
// } from "react-icons/bs";
// import {
//   HiOutlineMail,
//   HiOutlinePhone,
// } from "react-icons/hi";
// import {
//   FaCity,
//   FaFlag,
// } from "react-icons/fa";
// import {
//   MdOutlineLocationCity,
// } from "react-icons/md";
// import { TbBuildingSkyscraper } from "react-icons/tb";
// import Image from "next/image";

// const CompanyPage = () => {
//   const selectedCompanyMember = useAppSelector((state) => state.currentCompanyMember.companyMember);
//   const companyId = selectedCompanyMember?.companyId?.id;

//   const { data, loading, error } = useQuery<any>(GET_COMPANY_BY_ID, {
//     variables: { id: companyId },
//     skip: !companyId,
//     fetchPolicy: "network-only",
//   })

//   if (error) {
//     console.log({ GET_COMPANY_BY_ID: error })
//   }

//   const company = data?.getCompanyById

//   console.log({ company: company })

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   };

//   const getStatusColor = (isActive: boolean) => {
//     return isActive
//       ? "bg-green-100 text-green-800 border-green-200"
//       : "bg-red-100 text-red-800 border-red-200";
//   };

//   if (loading) {
//     return (
//       <Container>
//         <div className="flex flex-col items-center justify-center h-[70vh]">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
//           <p className="text-gray-600 text-lg">Loading company information...</p>
//         </div>
//       </Container>
//     );
//   }

//   if (error) {
//     return (
//       <Container>
//         <div className="flex flex-col items-center justify-center h-[70vh]">
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Company</h2>
//           <p className="text-gray-600">There was an error loading your company information.</p>
//         </div>
//       </Container>
//     );
//   }

//   if (!company) {
//     return (
//       <Container>
//         <div className="flex flex-col items-center justify-center h-[70vh]">
//           <div className="h-24 w-24 bg-linear-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
//             <TbBuildingSkyscraper className="h-12 w-12 text-blue-600" />
//           </div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">No Company Found</h2>
//           <p className="text-gray-600">No company information is available.</p>
//         </div>
//       </Container>
//     );
//   }

//   return (
//     <Container className="overflow-y-auto h-full">
//       <div className="w-full h-full">
//         <div className=" mx-auto py-8 px-4">

//           {/* Company Header Card */}
//           <div className="relative overflow-hidden rounded-3xl p-12 mb-8">
//             {/* Background Image */}
//             {company.logo && (
//               <div
//                 className="absolute p-0.5 inset-0 bg-cover bg-center opacity-80"
//                 style={{ backgroundImage: `url('/comp.jpg')` }}
//               />
//             )}

//             {/* Optional gradient overlay */}
//             <div className="absolute inset-0 bg-linear-to-r from-blue-100 via-white/30 to-transparent " />

//             {/* Content */}
//             <div className="relative flex flex-col md:flex-row md:items-center gap-6">
//               <div className="flex items-center space-x-6">
//                 <div className="h-24 w-24 bg-white rounded-2xl flex items-center justify-center ">
//                   {company.logo ? (
//                     <Image
//                       src={company.logo}
//                       alt={company.name}
//                       width={20}
//                       height={20}
//                       className="h-16 w-16 object-cover rounded-lg"
//                     />
//                   ) : (
//                     <TbBuildingSkyscraper className="h-12 w-12 text-white" />
//                   )}
//                 </div>

//                 <div className="flex">
//                   <div className="flex flex-col justify-start items-start space-y-2 mb-2">
//                     <h1 className="text-3xl font-bold text-gray-900">
//                       {company.name}
//                     </h1>

//                     <span
//                       className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
//                         company.isActive
//                       )}`}
//                     >
//                       {company.isActive ? "ACTIVE" : "INACTIVE"}
//                     </span>

//                     <span className="text-sm text-gray-600">
//                       Complete company information at a glance.
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Main Content Grid */}
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             {/* Left Column - Main Company Details */}
//             <div className="lg:col-span-2 space-y-8">
//               {/* Company Information Card */}
//               <div className="bg-white rounded-2xl border border-gray-200 p-8">
//                 <div className="flex items-center space-x-3 mb-8">
//                   <div className="p-3 bg-linear-to-br from-blue-50 to-blue-100 rounded-xl">
//                     <BsBuilding className="h-6 w-6 text-blue-600" />
//                   </div>
//                   <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
//                 </div>

//                 <div className="space-y-6">
//                   {/* Company Name */}
//                   <div className="border-b border-gray-100 pb-4">
//                     <div className="flex items-center space-x-2 mb-2">
//                       <BsBuilding className="text-gray-400" />
//                       <span className="text-sm font-medium text-gray-500">Company Name</span>
//                     </div>
//                     <p className="text-2xl font-bold text-gray-900">{company.name}</p>
//                   </div>

//                   {/* Email */}
//                   <div className="border-b border-gray-100 pb-4">
//                     <div className="flex items-center space-x-2 mb-2">
//                       <HiOutlineMail className="text-gray-400" />
//                       <span className="text-sm font-medium text-gray-500">Email Address</span>
//                     </div>
//                     <div className="flex items-center space-x-3">
//                       <BsEnvelope className="text-blue-500" />
//                       <span className="text-lg text-gray-900">{company.email}</span>
//                     </div>
//                   </div>

//                   {/* Phone */}
//                   <div className="border-b border-gray-100 pb-4">
//                     <div className="flex items-center space-x-2 mb-2">
//                       <HiOutlinePhone className="text-gray-400" />
//                       <span className="text-sm font-medium text-gray-500">Phone Number</span>
//                     </div>
//                     <div className="flex items-center space-x-3">
//                       <BsTelephone className="text-green-500" />
//                       <span className="text-lg text-gray-900">
//                         {company.phone || "Not provided"}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Owner ID */}
//                   <div>
//                     <div className="flex items-center space-x-2 mb-2">
//                       <BsShieldCheck className="text-gray-400" />
//                       <span className="text-sm font-medium text-gray-500">Owner Member ID</span>
//                     </div>
//                     <p className="text-lg font-mono text-gray-900">{`company.ownerIds`}</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Address Information Card */}
//               {company.address && (
//                 <div className="bg-white rounded-2xl border border-gray-200 p-8">
//                   <div className="flex items-center space-x-3 mb-8">
//                     <div className="p-3 bg-linear-to-br from-green-50 to-green-100 rounded-xl">
//                       <BsMap className="h-6 w-6 text-green-600" />
//                     </div>
//                     <h2 className="text-2xl font-bold text-gray-900">Address Information</h2>
//                   </div>

//                   <div className="space-y-6">
//                     <div className="p-6 bg-linear-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
//                       <div className="space-y-4">
//                         <p className="text-xl font-bold text-gray-900">{company.address.street}</p>

//                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                           <div>
//                             <div className="flex items-center space-x-2 mb-1">
//                               <FaCity className="text-gray-400" />
//                               <span className="text-sm font-medium text-gray-500">City</span>
//                             </div>
//                             <p className="text-lg font-medium text-gray-900">{company.address.city}</p>
//                           </div>

//                           <div>
//                             <div className="flex items-center space-x-2 mb-1">
//                               <MdOutlineLocationCity className="text-gray-400" />
//                               <span className="text-sm font-medium text-gray-500">State</span>
//                             </div>
//                             <p className="text-lg font-medium text-gray-900">{company.address.state}</p>
//                           </div>

//                           <div>
//                             <div className="flex items-center space-x-2 mb-1">
//                               <FaFlag className="text-gray-400" />
//                               <span className="text-sm font-medium text-gray-500">Country</span>
//                             </div>
//                             <p className="text-lg font-medium text-gray-900">{company.address.country}</p>
//                           </div>

//                           <div>
//                             <div className="flex items-center space-x-2 mb-1">
//                               <BsGeoAlt className="text-gray-400" />
//                               <span className="text-sm font-medium text-gray-500">Postal Code</span>
//                             </div>
//                             <p className="text-lg font-medium text-gray-900">{company.address.postalCode}</p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Right Column - Company Metadata */}
//             <div className="space-y-8">
//               {/* Company Status Card */}
//               <div className="bg-white rounded-2xl border border-gray-200 p-6">
//                 <h3 className="text-xl font-bold text-gray-900 mb-6">Company Details</h3>

//                 <div className="space-y-4">
//                   <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
//                     <div className="flex items-center space-x-3">
//                       <BsShieldCheck className={`${company.isActive ? 'text-green-500' : 'text-red-500'}`} />
//                       <span className="font-medium text-gray-700">Status</span>
//                     </div>
//                     <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getStatusColor(company.isActive)}`}>
//                       {company.isActive ? "Active" : "Inactive"}
//                     </span>
//                   </div>

//                   <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
//                     <div className="flex items-center space-x-3">
//                       <BsCalendar className="text-blue-500" />
//                       <span className="font-medium text-gray-700">Created</span>
//                     </div>
//                     <span className="text-sm font-medium text-gray-900">
//                       {formatDate(company.createdAt)}
//                     </span>
//                   </div>

//                   <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
//                     <div className="flex items-center space-x-3">
//                       <BsClock className="text-blue-500" />
//                       <span className="font-medium text-gray-700">Last Updated</span>
//                     </div>
//                     <span className="text-sm font-medium text-gray-900">
//                       {formatDate(company.updatedAt)}
//                     </span>
//                   </div>

//                   <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
//                     <div className="flex items-center space-x-3">
//                       <BsBuilding className="text-purple-500" />
//                       <span className="font-medium text-gray-700">Company ID</span>
//                     </div>
//                     <span className="text-sm font-mono font-medium text-gray-900">
//                       {company.id.substring(0, 8)}...
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </Container>
//   );
// };

// export default CompanyPage;


"use client";

import { useQuery } from "@apollo/client/react";
import Container from "@/components/Container";
import { GET_COMPANY_BY_ID } from "@/graphql/query/company.query";
import { useAppSelector } from "@/redux/hooks";

import {
  BsBuilding,
  BsEnvelope,
  BsTelephone,
  BsGeoAlt,
  BsClock,
  BsCalendar,
  BsShieldCheck,
  BsMap,
  BsPerson,
  BsCheckCircle,
  BsArrowRight,
  BsPencil,
  BsShare,
  BsCopy,
} from "react-icons/bs";

import { HiOutlineMail, HiOutlinePhone } from "react-icons/hi";
import { FaCity, FaFlag } from "react-icons/fa";
import { MdOutlineLocationCity } from "react-icons/md";
import { TbBuildingSkyscraper } from "react-icons/tb";
import Image from "next/image";
import { useState } from "react";

const demoCompany = {
  id: "6a725da7e8f3",
  name: "My Packaging Hub",
  email: "info@mypackaginghub.com",
  phone: "+92 300 123 4567",
  isActive: true,
  createdAt: "2025-04-12T10:24:00.000Z",
  updatedAt: "2025-08-05T15:17:00.000Z",
  logo: "",
  address: {
    street: "123 Business Avenue, Tech Park",
    city: "Lahore",
    state: "Punjab",
    country: "Pakistan",
    postalCode: "54000",
  },
};

const CompanyPage = () => {
  const selectedCompanyMember = useAppSelector(
    (state) => state.currentCompanyMember.companyMember
  );

  const companyId = selectedCompanyMember?.companyId?.id;

  const { data, loading, error } = useQuery<any>(GET_COMPANY_BY_ID, {
    variables: { id: companyId },
    skip: !companyId,
    fetchPolicy: "network-only",
  });

  const [copied, setCopied] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const company = data?.getCompanyById;

  // Demo values are used only when the API does not provide optional fields.
  const displayCompany = {
    ...demoCompany,
    ...(company || {}),
    address: {
      ...demoCompany.address,
      ...(company?.address || {}),
    },
  };

  const copyCompanyId = async () => {
    try {
      await navigator.clipboard.writeText(displayCompany.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be unavailable in some browsers/environments.
    }
  };

  const statusClasses = displayCompany.isActive
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-red-50 text-red-700 border-red-200";

  if (loading) {
    return (
      <Container>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <p className="text-base font-semibold text-gray-900">
              Loading company profile
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Fetching your latest company information...
            </p>
          </div>
        </div>
      </Container>
    );
  }

  if (!company) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <div className="h-24 w-24 bg-linear-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
            <TbBuildingSkyscraper className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Company Found</h2>
          <p className="text-gray-600">No company information is available.</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <BsBuilding className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Unable to load company
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              We couldn&apos;t retrieve the latest company information. Please
              refresh the page and try again.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="h-full overflow-y-auto ">
      <div className="mx-auto w-full px-4 py-6 lg:px-4 lg:py-2">

        {/* Company Hero */}
        <section className="relative mb-6 overflow-hidden custom-white-box bg-linear-to-r from-blue-50 via-white to-indigo-50">
          {/* Background Image */}
          {company.logo && (
            <div
              className="absolute p-0.5 inset-0 bg-cover bg-center opacity-80"
              style={{ backgroundImage: `url('/comp.jpg')` }}
            />
          )}

          {/* Optional gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/60 to-transparent " />
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute -bottom-28 right-32 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />

          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white bg-white shadow-md">
              {displayCompany.logo ? (
                <Image
                  src={displayCompany.logo}
                  alt={displayCompany.name}
                  width={88}
                  height={88}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-600 to-indigo-600">
                  <TbBuildingSkyscraper className="h-11 w-11 text-white" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                  {displayCompany.name}
                </h2>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusClasses}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${displayCompany.isActive ? "bg-emerald-500" : "bg-red-500"
                      }`}
                  />
                  {displayCompany.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <p className="max-w-xl text-sm font-medium text-slate-600">
                Premium custom packaging solutions for businesses looking for
                reliable quality, professional presentation and flexible
                packaging options.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <BsEnvelope className="text-blue-500" />
                  {displayCompany.email}
                </span>

                <span className="inline-flex items-center gap-2">
                  <BsGeoAlt className="text-emerald-500" />
                  {displayCompany.address.city},{" "}
                  {displayCompany.address.country}
                </span>
              </div>
            </div>

            {/* <div className="hidden shrink-0 lg:block">
              <div className="flex h-32 w-44 items-center justify-center rounded-2xl border border-white/80 bg-white/60 shadow-sm backdrop-blur">
                <div className="grid grid-cols-3 items-end gap-2 opacity-80">
                  <div className="h-12 w-8 rounded bg-blue-200" />
                  <div className="h-20 w-8 rounded bg-blue-400" />
                  <div className="h-16 w-8 rounded bg-indigo-400" />
                </div>
              </div>
            </div> */}
          </div>
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* Left column */}
          <div className="space-y-6 xl:col-span-2">

            {/* Company Information */}
            <section className="overflow-hidden custom-white-box ">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                      <BsBuilding className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">
                        Company Information
                      </h2>
                      <p className="text-sm text-slate-500">
                        Essential business and contact information
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Name */}
                <div className="border-b border-slate-100 p-6 md:col-span-2">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <BsBuilding />
                    Business Name
                  </div>
                  <p className="text-xl font-bold text-slate-950">
                    {displayCompany.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Official company name used across your packaging platform.
                  </p>
                </div>

                {/* Email */}
                <div className="border-b border-slate-100 p-6 md:border-r">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <HiOutlineMail className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Business Email
                  </p>
                  <p className="mt-1 break-all text-base font-semibold text-slate-900">
                    {displayCompany.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Primary email for business communication.
                  </p>
                </div>

                {/* Phone */}
                <div className="border-b border-slate-100 p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                    <HiOutlinePhone className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Phone Number
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {displayCompany.phone || "Not provided"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Used for important account and order communication.
                  </p>
                </div>

                {/* Owner */}
                <div className="p-6 md:border-r">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                    <BsShieldCheck className="h-5 w-5 text-violet-600" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Owner Member ID
                  </p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
                    company.ownerIds
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Identifies the primary owner of this company account.
                  </p>
                </div>

                {/* Business Type */}
                <div className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                    <BsPerson className="h-5 w-5 text-indigo-600" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Business Type
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    Packaging Manufacturer & Supplier
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Custom packaging solutions for businesses of different
                    sizes and industries.
                  </p>
                </div>
              </div>
            </section>

            {/* About Company */}
            <section className="custom-white-box bg-linear-to-br from-blue-200/80 to-white p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <BsCheckCircle className="h-5 w-5 text-blue-600" />
                </div>

                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-950">
                    About Our Company
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    My Packaging Hub provides custom packaging solutions
                    designed to help businesses present their products
                    professionally. Our packaging range can include rigid
                    boxes, cardboard boxes, kraft boxes, paper bags and other
                    made-to-order packaging formats.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      "Custom packaging solutions",
                      "Multiple box & bag formats",
                      "Professional print options",
                      "Flexible quantities and specifications",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-sm font-medium text-slate-700"
                      >
                        <BsCheckCircle className="shrink-0 text-emerald-500" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Address */}
            <section className="overflow-hidden custom-white-box">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <BsMap className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      Address Information
                    </h2>
                    <p className="text-sm text-slate-500">
                      Registered business location
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <BsGeoAlt className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-950">
                        {displayCompany.address.street}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Business / registered address
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-emerald-100 pt-5 md:grid-cols-4">
                    <div>
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <FaCity />
                        City
                      </div>
                      <p className="font-semibold text-slate-900">
                        {displayCompany.address.city}
                      </p>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <MdOutlineLocationCity />
                        State
                      </div>
                      <p className="font-semibold text-slate-900">
                        {displayCompany.address.state}
                      </p>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <FaFlag />
                        Country
                      </div>
                      <p className="font-semibold text-slate-900">
                        {displayCompany.address.country}
                      </p>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <BsGeoAlt />
                        Postal Code
                      </div>
                      <p className="font-semibold text-slate-900">
                        {displayCompany.address.postalCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right column */}
          <aside className="space-y-6">

            {/* Quick Overview */}
            <section className="p-6 custom-white-box">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <TbBuildingSkyscraper className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    Quick Overview
                  </h3>
                  <p className="text-xs text-slate-500">
                    Company profile summary
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Company Status
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Account status
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses}`}
                    >
                      {displayCompany.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Company Location
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {displayCompany.address.city},{" "}
                    {displayCompany.address.country}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Business Category
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    Custom Packaging
                  </p>
                </div>
              </div>
            </section>

            {/* Account Details */}
            <section className="custom-white-box p-6">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-950">
                  Account Details
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Important account metadata
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <BsCalendar className="text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-400">Created</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDate(displayCompany.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <BsClock className="text-indigo-500" />
                    <div>
                      <p className="text-xs text-slate-400">Last Updated</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDate(displayCompany.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <BsBuilding className="shrink-0 text-violet-500" />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">Company ID</p>
                        <p className="truncate font-mono text-sm font-semibold text-slate-900">
                          {displayCompany.id}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={copyCompanyId}
                      title="Copy company ID"
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-blue-600"
                    >
                      <BsCopy />
                    </button>
                  </div>

                  {copied && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600">
                      Company ID copied to clipboard.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Contact / Help */}
            <section className="custom-white-box bg-linear-to-br from-blue-200 to-indigo-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                <HiOutlinePhone className="h-5 w-5 text-blue-600" />
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-950">
                Need help with your company profile?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Update your business information, contact details or address
                whenever your company information changes.
              </p>

              <button
                type="button"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Contact Support
                <BsArrowRight />
              </button>
            </section>

            {/* Profile completeness */}
            <section className="custom-white-box bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    Profile Completeness
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Keep your company information up to date.
                  </p>
                </div>

                <span className="text-lg font-bold text-blue-600">80%</span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[80%] rounded-full bg-blue-600" />
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Add missing information such as business phone, website and
                additional company details to complete your profile.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </Container>
  );
};

export default CompanyPage;
