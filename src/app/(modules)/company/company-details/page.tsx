// src/app/admin/company/page.tsx
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
} from "react-icons/bs";
import {
  HiOutlineMail,
  HiOutlinePhone,
} from "react-icons/hi";
import {
  FaCity,
  FaFlag,
} from "react-icons/fa";
import {
  MdOutlineLocationCity,
} from "react-icons/md";
import { TbBuildingSkyscraper } from "react-icons/tb";

const CompanyPage = () => {
  const selectedCompanyMember = useAppSelector((state) => state.currentCompanyMember.companyMember);
  const companyId = selectedCompanyMember?.company?.id;

  const { data, loading, error } = useQuery<any>(GET_COMPANY_BY_ID, {
    variables: { id: companyId },
    skip: !companyId,
    fetchPolicy: "network-only",
  })

  if (error) {
    console.log({ GET_COMPANY_BY_ID: error })
  }

  const company = data?.getCompanyById

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  if (loading) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading company information...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Company</h2>
          <p className="text-gray-600">There was an error loading your company information.</p>
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

  return (
    <Container className="overflow-y-auto h-full">
      <div className="w-full h-full">
        <div className="max-w-6xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
            <p className="text-gray-600 mt-1">Complete company information</p>
          </div>

          {/* Company Header Card */}
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 mb-8 border border-blue-200">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center space-x-6">
                <div className="h-24 w-24 bg-linear-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                  ) : (
                    <TbBuildingSkyscraper className="h-12 w-12 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-4xl font-bold text-gray-900">{company.name}</h1>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(company.isActive)}`}>
                      {company.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Company Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Company Information Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-3 bg-linear-to-br from-blue-50 to-blue-100 rounded-xl">
                    <BsBuilding className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
                </div>

                <div className="space-y-6">
                  {/* Company Name */}
                  <div className="border-b border-gray-100 pb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <BsBuilding className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Company Name</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{company.name}</p>
                  </div>

                  {/* Email */}
                  <div className="border-b border-gray-100 pb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <HiOutlineMail className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Email Address</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <BsEnvelope className="text-blue-500" />
                      <span className="text-lg text-gray-900">{company.email}</span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="border-b border-gray-100 pb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <HiOutlinePhone className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Phone Number</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <BsTelephone className="text-green-500" />
                      <span className="text-lg text-gray-900">
                        {company.phone || "Not provided"}
                      </span>
                    </div>
                  </div>

                  {/* Owner ID */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <BsShieldCheck className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Owner Member ID</span>
                    </div>
                    <p className="text-lg font-mono text-gray-900">{company.ownerIds}</p>
                  </div>
                </div>
              </div>

              {/* Address Information Card */}
              {company.address && (
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="p-3 bg-linear-to-br from-green-50 to-green-100 rounded-xl">
                      <BsMap className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Address Information</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-linear-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                      <div className="space-y-4">
                        <p className="text-xl font-bold text-gray-900">{company.address.street}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <FaCity className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">City</span>
                            </div>
                            <p className="text-lg font-medium text-gray-900">{company.address.city}</p>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <MdOutlineLocationCity className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">State</span>
                            </div>
                            <p className="text-lg font-medium text-gray-900">{company.address.state}</p>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <FaFlag className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">Country</span>
                            </div>
                            <p className="text-lg font-medium text-gray-900">{company.address.country}</p>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <BsGeoAlt className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">Postal Code</span>
                            </div>
                            <p className="text-lg font-medium text-gray-900">{company.address.postalCode}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Company Metadata */}
            <div className="space-y-8">
              {/* Company Status Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Company Details</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <BsShieldCheck className={`${company.isActive ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="font-medium text-gray-700">Status</span>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getStatusColor(company.isActive)}`}>
                      {company.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <BsCalendar className="text-blue-500" />
                      <span className="font-medium text-gray-700">Created</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(company.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <BsClock className="text-blue-500" />
                      <span className="font-medium text-gray-700">Last Updated</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(company.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <BsBuilding className="text-purple-500" />
                      <span className="font-medium text-gray-700">Company ID</span>
                    </div>
                    <span className="text-sm font-mono font-medium text-gray-900">
                      {company.id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default CompanyPage;