// src/components/popup/models/AddCompany.model.tsx
"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { useMutation } from "@apollo/client/react";
import { CREATE_COMPANY, UPDATE_COMPANY } from "@/graphql/query/company.query";
import {
  BiBuilding,
  BiEnvelope,
  BiPhone,
  BiMap,
  BiCheckCircle,
  BiImage,
  BiPlus,
  BiX,
  BiUser,
} from "react-icons/bi";
import {
  FiUpload,
} from "react-icons/fi";
import { Switch } from "@headlessui/react";
import { toast } from "react-toastify";
import Image from "next/image";
import Popup from "../Popup";
import InputBox from "@/components/InputBox";
import { removeTypename } from "@/helpers/removetypename";
import { PlatformRole } from "@/enums/common.enums";

interface AddCompanyProps {
  onCancel: () => void;
  selectedData: any;
  isEditMode: boolean;
  refetch: () => void;
  isSuperAdmin?: boolean;
  currentMember?: any;
}

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface CompanyFormData {
  name: string;
  logo?: string | null;
  email?: string | null;
  number?: string | null;
  isActive: boolean;
  address?: Address | null;
  ownerIds: string[];  // Changed from ownerMemberId to ownerIds array
}

const AddCompany: React.FC<AddCompanyProps> = ({
  onCancel,
  selectedData,
  isEditMode,
  refetch,
  isSuperAdmin = false,
  currentMember,
}) => {
  const [form, setForm] = useState<CompanyFormData>({
    name: "",
    logo: null,
    email: null,
    number: null,
    isActive: true,
    address: null,
    ownerIds: currentMember ? [currentMember.id] : [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [newOwnerId, setNewOwnerId] = useState<string>("");

  const tabs = [
    { id: "basic", label: "Company Info", icon: <BiBuilding className="w-4 h-4" /> },
    { id: "address", label: "Address", icon: <BiMap className="w-4 h-4" /> },
  ];

  useEffect(() => {
    if (isEditMode && selectedData) {
      // Map existing data to form - Updated to use ownerIds array
      const mappedData: CompanyFormData = {
        name: selectedData.name || "",
        logo: selectedData.logo || null,
        email: selectedData.email || null,
        number: selectedData.number || null,
        isActive: selectedData.isActive ?? true,
        address: selectedData.address || null,
        ownerIds: selectedData.ownerIds || (currentMember ? [currentMember.id] : []),
      };

      setForm(mappedData);
      setSelectedImage(selectedData.logo || "");
    } else {
      // Initialize form for new company
      setForm(prev => ({
        ...prev,
        name: "",
        logo: null,
        email: null,
        number: null,
        isActive: true,
        address: null,
        ownerIds: currentMember ? [currentMember.id] : [],
      }));
    }
  }, [isEditMode, selectedData, currentMember.id]);

  const [createCompany] = useMutation<any>(CREATE_COMPANY);
  const [updateCompany] = useMutation<any>(UPDATE_COMPANY);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name.includes('.')) {
      // Handle nested properties (address)
      const [parent, child] = name.split('.');
      if (parent === 'address') {
        setForm(prev => {
          // Initialize address object if it doesn't exist
          const currentAddress = prev.address || {};
          return {
            ...prev,
            [parent]: {
              ...currentAddress,
              [child]: value || undefined // Don't store empty strings
            }
          };
        });
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddOwnerId = () => {
    if (!newOwnerId.trim()) {
      toast.error("Please enter a valid member ID");
      return;
    }

    if (form.ownerIds.includes(newOwnerId.trim())) {
      toast.error("This owner ID is already added");
      return;
    }

    setForm(prev => ({
      ...prev,
      ownerIds: [...prev.ownerIds, newOwnerId.trim()]
    }));
    setNewOwnerId("");
  };

  const handleRemoveOwnerId = (ownerIdToRemove: string) => {
    // Don't allow removing the last owner
    if (form.ownerIds.length <= 1) {
      toast.error("Company must have at least one owner");
      return;
    }

    setForm(prev => ({
      ...prev,
      ownerIds: prev.ownerIds.filter(id => id !== ownerIdToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name?.trim()) {
      newErrors.name = "Company name is required";
    }

    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (form.ownerIds.length === 0) {
      newErrors.ownerIds = "At least one owner is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    setLoading(true);

    try {
      // Build company payload according to schema
      const companyData = {
        name: form.name.trim(),
        ...(form.logo ? { logo: form.logo } : {}),
        ...(form.email?.trim() ? { email: form.email.trim() } : {}),
        ...(form.number?.trim() ? { number: form.number.trim() } : {}),
        isActive: form.isActive,
        ...(form.address && Object.values(form.address).some(v => v) ? {
          address: {
            ...(form.address.street ? { street: form.address.street } : {}),
            ...(form.address.city ? { city: form.address.city } : {}),
            ...(form.address.state ? { state: form.address.state } : {}),
            ...(form.address.zip ? { zip: form.address.zip } : {}),
            ...(form.address.country ? { country: form.address.country } : {}),
          }
        } : {}),
        ownerIds: form.ownerIds, // Now sending as array
      };

      // Clean input by removing __typename
      const cleanInput = removeTypename(companyData);

      let response;

      if (isEditMode && selectedData) {
        // Security check for non-superadmins
        if (!isSuperAdmin) {
          const companyOwners = selectedData.ownerIds || [];
          if (!companyOwners.includes(currentMember.id)) {
            toast.error("You can only edit companies you own");
            setLoading(false);
            return;
          }
        }

        console.log("Updating company with ID:", selectedData.id);
        console.log("Update payload:", cleanInput);

        response = await updateCompany({
          variables: {
            id: selectedData.id || selectedData._id,
            input: cleanInput,
          },
        });

        console.log("Update Company Response:", response);

        if (response.data?.updateCompany) {
          toast.success("Company updated successfully!");
          refetch();
          onCancel();
        }
      } else {
        console.log("Creating company with payload:", cleanInput);

        response = await createCompany({
          variables: {
            input: cleanInput,
          },
        });

        console.log("Create Company Response:", response);

        if (response.data?.createCompany) {
          toast.success("Company created successfully!");
          refetch();
          onCancel();
        }
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);

      // Handle GraphQL errors
      const gqlMessage = error?.graphQLErrors?.[0]?.message;
      const networkError = error?.networkError?.result?.errors?.[0]?.message;
      const errorMessage = gqlMessage || networkError || error.message || "An error occurred";

      // Handle specific error cases
      if (errorMessage.includes("duplicate") || errorMessage.includes("already exists")) {
        if (errorMessage.includes("name")) {
          toast.error("A company with this name already exists");
        } else {
          toast.error("Duplicate entry detected");
        }
      } else if (errorMessage.includes("validation")) {
        toast.error("Please check all required fields");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }

      // In a real app, you'd upload this to a server and get a URL back
      // For now, we'll create a local URL
      const imageUrl = URL.createObjectURL(file);
      setForm(prev => ({ ...prev, logo: imageUrl }));
      setSelectedImage(imageUrl);
    }
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, logo: null }));
    setSelectedImage("");
  };

  return (
    <Popup>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-30 rounded-t-xl border-b border-gray-100">
          <div className="flex justify-between items-center px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? "Edit Company" : "Add New Company"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode
                  ? "Update company information"
                  : "Create a new company"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-4 py-2 text-white rounded-lg font-medium text-sm flex items-center ${loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 transition-colors"
                  }`}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    {isEditMode ? (
                      <>
                        <BiCheckCircle className="mr-2" />
                        Update Company
                      </>
                    ) : (
                      <>
                        <BiPlus className="mr-2" />
                        Create Company
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 bg-gray-50">
            <nav className="flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 rounded-t-lg transition-colors text-sm font-medium ${activeTab === tab.id
                    ? "bg-white text-blue-700 border-t-2 border-x-2 border-gray-200 border-b-0"
                    : "text-gray-600 hover:text-blue-600 hover:bg-white/50"
                    }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6">
          {/* Basic Information Tab */}
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BiBuilding className="mr-2" />
                    Company Information
                  </h3>
                  <div className="space-y-4">
                    <InputBox
                      type="text"
                      label="Company Name *"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Acme Corporation"
                      error={errors.name}
                    />

                    <InputBox
                      type="email"
                      label="Company Email"
                      name="email"
                      value={form.email || ""}
                      onChange={handleChange}
                      placeholder="info@company.com"
                      error={errors.email}
                    />

                    <InputBox
                      type="tel"
                      label="Company Phone"
                      name="number"
                      value={form.number || ""}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                    />

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Active Company</p>
                        <p className="text-sm text-gray-500">Enable company access</p>
                      </div>
                      <Switch
                        checked={form.isActive}
                        onChange={(value: boolean) =>
                          setForm(prev => ({ ...prev, isActive: value }))
                        }
                        className={`${form.isActive ? "bg-green-600" : "bg-gray-200"
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                      >
                        <span
                          className={`${form.isActive ? "translate-x-6" : "translate-x-1"
                            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                        />
                      </Switch>
                    </div>
                  </div>
                </div>

                {/* Company Owners Section */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BiUser className="mr-2" />
                    Company Owners
                  </h3>

                  <div className="space-y-4">
                    {/* List of owners */}
                    <span className="mr-2 font-semibold text-xs rounded-t-2xl rounded-r-2xl bg-blue-200 right-1 ring-green-300 p-2">{currentMember.role}</span>
                    <span className="mr-2">{currentMember.username}</span>
                    <div className="flex flex-wrap gap-2">
                      {form.ownerIds.map((ownerId, index) => (
                        <div
                          key={index}
                          className="inline-flex ring-1 ring-blue-200 items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          <span className="mr-2">{ownerId}</span>
                          {form.ownerIds.length > 1 && isSuperAdmin && (
                            <button
                              onClick={() => handleRemoveOwnerId(ownerId)}
                              className="hover:text-blue-900"
                              type="button"
                            >
                              <BiX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add owner input - Only for super admin */}
                    {isSuperAdmin && (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newOwnerId}
                          onChange={(e) => setNewOwnerId(e.target.value)}
                          placeholder="Enter member ID"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddOwnerId();
                            }
                          }}
                        />
                        <button
                          onClick={handleAddOwnerId}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          type="button"
                        >
                          Add Owner
                        </button>
                      </div>
                    )}

                    {!isSuperAdmin && form.ownerIds.length === 1 && (
                      <p className="text-xs text-gray-500">
                        You are the owner of this company
                      </p>
                    )}

                    {errors.ownerIds && (
                      <p className="text-xs text-red-500">{errors.ownerIds}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BiImage className="mr-2" />
                    Company Logo
                  </h3>
                  <div className="flex flex-col items-center">
                    <div className="relative group mb-4">
                      <div className="w-32 h-32 rounded-lg overflow-hidden border-4 border-white shadow-lg bg-linear-to-br from-blue-50 to-gray-100 flex items-center justify-center">
                        {selectedImage ? (
                          <Image
                            src={selectedImage}
                            alt="Company Logo"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                            {form.name?.charAt(0).toUpperCase() || "C"}
                          </div>
                        )}
                      </div>
                      {selectedImage && (
                        <button
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                          type="button"
                        >
                          <BiX className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <label className="cursor-pointer">
                      <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <FiUpload className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">
                          Upload Logo
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Max 2MB • JPG, PNG, GIF
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Address Tab */}
          {activeTab === "address" && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BiMap className="mr-2" />
                  Company Address
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <InputBox
                      type="text"
                      label="Street"
                      name="address.street"
                      value={form.address?.street || ""}
                      onChange={handleChange}
                      placeholder="123 Main St"
                    />

                    <InputBox
                      type="text"
                      label="City"
                      name="address.city"
                      value={form.address?.city || ""}
                      onChange={handleChange}
                      placeholder="New York"
                    />

                    <InputBox
                      type="text"
                      label="State"
                      name="address.state"
                      value={form.address?.state || ""}
                      onChange={handleChange}
                      placeholder="NY"
                    />
                  </div>

                  <div className="space-y-4">
                    <InputBox
                      type="text"
                      label="ZIP/Postal Code"
                      name="address.zip"
                      value={form.address?.zip || ""}
                      onChange={handleChange}
                      placeholder="10001"
                    />

                    <InputBox
                      type="text"
                      label="Country"
                      name="address.country"
                      value={form.address?.country || ""}
                      onChange={handleChange}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
};

export default AddCompany;