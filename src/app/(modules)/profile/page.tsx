"use client";

import { formatDate } from "@/helpers/date-formate";
import { useAppSelector } from "@/redux/hooks";
import Image from "next/image";
import { useState } from "react";
import {
  BiUser,
  BiEnvelope,
  BiPhone,
  BiMap,
  BiWallet,
  BiCalendar,
  BiBuilding,
  BiIdCard,
  BiBadgeCheck,
  BiShield,
  BiTime,
  BiCheckCircle,
  BiXCircle,
  BiBriefcase,
  BiGlobe,
  BiCreditCard,
  BiDollar,
  BiCalendarCheck,
  BiCalendarExclamation,
  BiInfoCircle,
  BiLock,
  BiCopy,
  BiChevronRight,
  BiCog,
} from "react-icons/bi";
import { FiDatabase, FiCreditCard, FiShield } from "react-icons/fi";
import { toast } from "react-toastify";

const ProfilePage = () => {
  const currentMember = useAppSelector(
    (state) => state.currentMember.member
  );
  const loading = useAppSelector(
    (state) => state.currentMember.loading
  );
  const [activeTab, setActiveTab] = useState("overview");

  console.log({currentMember:currentMember})

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-35px)] w-full bg-gray-200 flex items-center justify-center">
        <div className=" ring-blue-400 ring-2 p-1 rounded-full flex justify-center items-center">
          {/* <div className="inline-block h-8 w-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> */}
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  if (!currentMember) return null;

  const getInitials = () => {
    return `${currentMember.firstName?.charAt(0) || ''}${currentMember.lastName?.charAt(0) || ''}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <BiUser className="w-4 h-4" /> },
    { id: "subscription", label: "Subscription", icon: <BiWallet className="w-4 h-4" /> },
    { id: "modules", label: "Module Access", icon: <FiDatabase className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <BiShield className="w-4 h-4" /> },
    { id: "address", label: "Address", icon: <BiMap className="w-4 h-4" /> },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: BiCheckCircle };
      case 'INACTIVE':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: BiTime };
      case 'SUSPENDED':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: BiXCircle };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: BiInfoCircle };
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PRO':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'BASIC':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const StatusIcon = getStatusBadge(currentMember.memberStatus).icon;

  

  return (
    <div  className="min-h-[100vh-35px] overflow-auto bg-gray-50 px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {/* <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            View member information and account details
          </p>
        </div> */}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          

          {/* ========== RIGHT CONTENT - TABS ========== */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              
              {/* Tab Navigation */}
              <div className="px-6 border-b border-gray-200 bg-gray-50/50">
                <nav className="flex space-x-1 overflow-hidden">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-4 py-3 rounded-t-lg transition-colors text-sm font-medium whitespace-nowrap ${
                        activeTab === tab.id
                          ? "bg-white text-blue-600 border-b-2 border-t-blue-600 -mb-px"
                          : "text-gray-600 hover:text-blue-600 hover:bg-white/50"
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard
                        icon={<BiCalendar className="w-6 h-6" />}
                        label="Member Since"
                        value={formatDate(currentMember?.createdAt)}
                        bgColor="bg-blue-50"
                        textColor="text-blue-600"
                      />
                      <StatCard
                        icon={<BiTime className="w-6 h-6" />}
                        label="Last Updated"
                        value={formatDate(currentMember.updatedAt)}
                        bgColor="bg-amber-50"
                        textColor="text-amber-600"
                      />
                      <StatCard
                        icon={<BiShield className="w-6 h-6" />}
                        label="Verification"
                        value={currentMember.isVerified ? "Verified" : "Unverified"}
                        bgColor={currentMember.isVerified ? "bg-green-50" : "bg-yellow-50"}
                        textColor={currentMember.isVerified ? "text-green-600" : "text-yellow-600"}
                      />
                      <StatCard
                        icon={<BiBriefcase className="w-6 h-6" />}
                        label="Role"
                        value={currentMember.platformRole}
                        bgColor="bg-purple-50"
                        textColor="text-purple-600"
                      />
                    </div>

                    {/* Account Summary */}
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <BiUser className="mr-2" />
                        Account Summary
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoRow label="Full Name" value={`${currentMember.firstName} ${currentMember.lastName}`} />
                        <InfoRow label="Username" value={`@${currentMember.username}`} />
                        <InfoRow label="Email" value={currentMember.email} />
                        <InfoRow label="Phone" value={currentMember.phone || 'Not provided'} />
                        <InfoRow label="Member Status" value={currentMember.memberStatus} />
                        <InfoRow label="Verification" value={currentMember.isVerified ? 'Verified' : 'Unverified'} />
                      </div>
                    </div>

                  </div>
                )}

                {/* Subscription Tab */}
                {activeTab === "subscription" && (
                  <div className="space-y-6">
                    {currentMember.subscription ? (
                      <>
                        {/* Current Plan Card */}
                        <div className={`p-6 rounded-lg border ${getPlanBadge(currentMember.subscription.plan)} bg-white`}>
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                                <FiCreditCard className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                                <h3 className="text-2xl font-bold text-gray-900">{currentMember.subscription.plan}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPlanBadge(currentMember.subscription.plan)}`}>
                                    {currentMember.subscription.plan}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                    currentMember.subscription.SubscriptionStatus 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : 'bg-gray-100 text-gray-800 border-gray-200'
                                  }`}>
                                    {currentMember.subscription.SubscriptionStatus ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Subscription Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentMember.subscription.startDate && (
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                                  <BiCalendarCheck className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Start Date</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatDate(currentMember.subscription.startDate)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {currentMember.subscription.endDate && (
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                                  <BiCalendarExclamation className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Renewal Date</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatDate(currentMember.subscription.endDate)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {currentMember.subscription.paymentMethod && (
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                                  <BiDollar className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {currentMember.subscription.paymentMethod}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                          <BiWallet className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription</h3>
                        <p className="text-sm text-gray-500">This member doesn't have an active subscription plan.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Module Access Tab */}
                {activeTab === "modules" && (
                  <div className="space-y-4">
                    {currentMember.modules?.filter((m: any) => m.canAccess).length > 0 ? (
                      currentMember.modules
                        .filter((module: any) => module.canAccess)
                        .map((module: any, index: number) => (
                          <ModuleCard key={index} module={module} />
                        ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                          <FiDatabase className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Module Access</h3>
                        <p className="text-sm text-gray-500">This member doesn't have access to any modules.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Email Verification */}
                      <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              currentMember.isVerified ? 'bg-green-100' : 'bg-yellow-100'
                            }`}>
                              <BiEnvelope className={`w-5 h-5 ${
                                currentMember.isVerified ? 'text-green-600' : 'text-yellow-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Email Verification</p>
                              <p className="text-sm text-gray-600">
                                {currentMember.isVerified ? 'Verified' : 'Unverified'}
                              </p>
                            </div>
                          </div>
                          {currentMember.isVerified ? (
                            <BiCheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <BiXCircle className="w-6 h-6 text-yellow-500" />
                          )}
                        </div>
                      </div>

                      {/* Account Status */}
                      <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              currentMember.memberStatus === 'ACTIVE' ? 'bg-green-100' : 
                              currentMember.memberStatus === 'INACTIVE' ? 'bg-yellow-100' : 'bg-red-100'
                            }`}>
                              <BiLock className={`w-5 h-5 ${
                                currentMember.memberStatus === 'ACTIVE' ? 'text-green-600' : 
                                currentMember.memberStatus === 'INACTIVE' ? 'text-yellow-600' : 'text-red-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Account Status</p>
                              <p className="text-sm text-gray-600">{currentMember.memberStatus}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            getStatusBadge(currentMember.memberStatus).color
                          }`}>
                            {currentMember.memberStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* System Information */}
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <BiInfoCircle className="mr-2" />
                        System Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Created</p>
                          <p className="font-medium text-gray-900">{formatDate(currentMember.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Last Modified</p>
                          <p className="font-medium text-gray-900">{formatDate(currentMember.updatedAt)}</p>
                        </div>
                        {currentMember.createdBy && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Created By</p>
                            <p className="font-medium text-gray-900">{currentMember.createdBy}</p>
                          </div>
                        )}
                        {currentMember.createdBy && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Modified By</p>
                            <p className="font-medium text-gray-900">{currentMember.createdBy}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Tab */}
                {activeTab === "address" && (
                  <div>
                    {currentMember.address?.street || currentMember.address?.city ? (
                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <BiMap className="mr-2" />
                          Address Information
                        </h3>
                        <div className="space-y-3">
                          {currentMember.address.street && (
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                                <BiMap className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Street Address</p>
                                <p className="text-sm font-medium text-gray-900">{currentMember.address.street}</p>
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            {currentMember.address.city && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">City</p>
                                <p className="text-sm font-medium text-gray-900">{currentMember.address.city}</p>
                              </div>
                            )}
                            {currentMember.address.state && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">State</p>
                                <p className="text-sm font-medium text-gray-900">{currentMember.address.state}</p>
                              </div>
                            )}
                            {currentMember.address.zip && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">ZIP Code</p>
                                <p className="text-sm font-medium text-gray-900">{currentMember.address.zip}</p>
                              </div>
                            )}
                            {currentMember.address.country && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Country</p>
                                <p className="text-sm font-medium text-gray-900">{currentMember.address.country}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                          <BiMap className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Address</h3>
                        <p className="text-sm text-gray-500">No address information has been added yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========== LEFT SIDEBAR - PROFILE CARD ========== */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="pt-12">
              {/* Cover with gradient */}
              
              {/* Avatar */}
              <div className="px-6 pb-6">
                <div className="flex justify-center -mt-10 mb-4">
                  <div className="relative">
                    <div className="w-60 h-60 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                      {currentMember.avatar ? (
                        <Image
                          src={currentMember.avatar}
                          alt="avatar"
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {getInitials()}
                          </span>
                        </div>
                      )}
                    </div>
                    {currentMember.isVerified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                        <BiBadgeCheck className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name & Role */}
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentMember.firstName} {currentMember.lastName}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    @{currentMember.username}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {currentMember.platformRole.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(currentMember.memberStatus).color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {currentMember.memberStatus}
                    </span>
                  </div>
                </div>

                {/* Quick Info List */}
                {/* <div className="border-t border-gray-100 pt-4 mt-2">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center mr-3 shrink-0">
                        <BiEnvelope className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm text-gray-900 truncate">{currentMember.email}</p>
                      </div>
                    </div>
                    
                    {currentMember.phone && (
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center mr-3 shrink-0">
                          <BiPhone className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm text-gray-900 truncate">{currentMember.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <BiIdCard className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">Member ID</p>
                          <button 
                            onClick={() => copyToClipboard(currentMember.MemberId, 'Member ID')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <BiCopy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs font-mono text-gray-900 truncate">{currentMember.MemberId}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <BiBuilding className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">Tenant ID</p>
                          <button 
                            onClick={() => copyToClipboard(currentMember.tenantId, 'Tenant ID')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <BiCopy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs font-mono text-gray-900 truncate">{currentMember.tenantId}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <BiCalendar className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Joined</p>
                        <p className="text-sm text-gray-900 truncate">{formatDate(currentMember.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========== Reusable Components ========== */

const StatCard = ({ icon, label, value, bgColor, textColor }: any) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
        <div className={`${textColor} `}>{icon}</div>
      </div>
    </div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-semibold text-gray-900">{value}</p>
  </div>
);

const InfoRow = ({ label, value }: any) => (
  <div>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value || 'Not provided'}</p>
  </div>
);

const ModuleCard = ({ module }: any) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="p-4 border-b border-gray-200 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <BiGlobe className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{module.moduleName}</h4>
            <p className="text-xs text-gray-500">{module.permissions.length} permissions</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200">
          Active
        </span>
      </div>
    </div>
    <div className="p-4">
      <div className="flex flex-wrap gap-2">
        {module.permissions.map((permission: string, i: number) => (
          <span
            key={i}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg border border-gray-200"
          >
            {permission}
          </span>
        ))}
      </div>
    </div>
  </div>
);

export default ProfilePage;