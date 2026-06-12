// src/components/popup/models/AddWebsite.model.tsx
"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { useMutation } from "@apollo/client/react"; // Fixed import
import { CREATE_WEBSITE, UPDATE_WEBSITE } from "@/graphql/query/website.query";
import {
    BiWorld,
    BiCheckCircle,
    BiCloud,
    BiPlus,
} from "react-icons/bi";
import {
    FiDatabase,
} from "react-icons/fi";
import { Switch } from "@headlessui/react";
import { WebsiteStatus, DatabaseType } from "@/enums/common.enums"; // Removed PlatformRole as it's not used
import { toast } from "react-toastify";
import Popup from "../Popup";
import InputBox from "@/components/InputBox";
import { removeTypename } from "@/helpers/removetypename";
import { useAppSelector } from "@/redux/hooks";

interface AddWebsiteProps {
    onCancel: () => void;
    selectedData: any;
    isEditMode: boolean;
    refetch: () => void;
    currentMemberId?: string;
}

interface DatabaseConfig {
    name: string;
    type: DatabaseType;
    host: string;
    port: number;
    username: string;
    password: string;
}

interface CloudinaryInfo {
    folderName?: string;
    cloudinaryName?: string;
    cloudinaryNameApiKey?: string;
    cloudinaryNameApiKeySecret?: string;
}

interface WebsiteFormData {
    companyId: string;
    // companyName: string;
    name: string;
    domain: string;
    status: WebsiteStatus;
    database: DatabaseConfig;
    cloudinary?: CloudinaryInfo | null;
}

const AddWebsite: React.FC<AddWebsiteProps> = ({
    onCancel,
    selectedData,
    isEditMode,
    refetch,
    currentMemberId,
}) => {
    // Get current company from Redux
    const currentCompanyMember = useAppSelector((state) => state.currentCompanyMember.companyMember);
    console.log({currentCompanyMembercurrentCompanyMembercurrentCompanyMember:currentCompanyMember})
    const currentCompany = currentCompanyMember?.company;

    const [form, setForm] = useState<WebsiteFormData>({
        companyId: currentCompany?.id || "", // Initialize with current company ID
        name: "",
        domain: "",
        status: WebsiteStatus.ACTIVE,
        database: {
            name: "",
            type: DatabaseType.MONGODB,
            host: "localhost",
            port: 27017,
            username: "",
            password: "",
        },
        cloudinary: null,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const [showCloudinary, setShowCloudinary] = useState(false);

    const tabs = [
        { id: "basic", label: "Basic Info", icon: <BiWorld className="w-4 h-4" /> },
        { id: "database", label: "Database", icon: <FiDatabase className="w-4 h-4" /> },
        { id: "cloudinary", label: "Cloudinary", icon: <BiCloud className="w-4 h-4" /> },
    ];

    useEffect(() => {
        if (isEditMode && selectedData) {
            // Map existing data to form
            const mappedData: WebsiteFormData = {
                companyId: selectedData.companyId || currentCompany?.id || "",
                name: selectedData.name || "",
                domain: selectedData.domain || "",
                status: selectedData.status || WebsiteStatus.ACTIVE,
                database: selectedData.database || {
                    name: "",
                    type: DatabaseType.MONGODB,
                    host: "localhost",
                    port: 27017,
                    username: "",
                    password: "",
                },
                cloudinary: selectedData.cloudinary || null,
            };

            setForm(mappedData);
            setShowCloudinary(!!selectedData.cloudinary);
        } else {
            // For new websites, set the current company as default
            setForm(prev => ({
                ...prev,
                companyId: currentCompany?.id || "",
            }));
        }
    }, [isEditMode, selectedData, currentCompany]); // Removed unnecessary dependencies

    const [createWebsite] = useMutation<any>(CREATE_WEBSITE); // Removed <any> type
    const [updateWebsite] = useMutation<any>(UPDATE_WEBSITE); // Removed <any> type

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        if (name.includes('.')) {
            // Handle nested properties
            const [parent, child] = name.split('.');

            if (parent === 'database') {
                setForm(prev => {
                    const currentDatabase = prev.database || {
                        name: "",
                        type: DatabaseType.MONGODB,
                        host: "",
                        port: 27017,
                        username: "",
                        password: "",
                    };

                    return {
                        ...prev,
                        database: {
                            ...currentDatabase,
                            [child]: child === 'port' ? parseInt(value) || 27017 : value
                        }
                    };
                });
            } else if (parent === 'cloudinary') {
                setForm(prev => ({
                    ...prev,
                    cloudinary: {
                        ...(prev.cloudinary || {
                            folderName: "",
                            cloudinaryName: "",
                            cloudinaryNameApiKey: "",
                            cloudinaryNameApiKeySecret: "",
                        }),
                        [child]: value
                    }
                }));
            }
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!form.companyId) {
            newErrors.companyId = "Company is required";
        }

        if (!form.name?.trim()) {
            newErrors.name = "Website name is required";
        }

        if (!form.domain?.trim()) {
            newErrors.domain = "Domain is required";
        } else {
            // Basic domain validation
            const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/;
            if (!domainRegex.test(form.domain)) {
                newErrors.domain = "Please enter a valid domain (e.g., example.com)";
            }
        }

        // Database validation
        if (!form.database.name?.trim()) {
            newErrors['database.name'] = "Database name is required";
        }

        if (!form.database.host?.trim()) {
            newErrors['database.host'] = "Database host is required";
        }

        if (!form.database.port) {
            newErrors['database.port'] = "Database port is required";
        }

        if (!form.database.username?.trim()) {
            newErrors['database.username'] = "Database username is required";
        }

        if (!form.database.password?.trim()) {
            newErrors['database.password'] = "Database password is required";
        }

        console.log({showCloudinary:showCloudinary})
        // Cloudinary validation (if enabled)
        if (showCloudinary) {
            if (!form.cloudinary?.folderName?.trim()) {
                newErrors['cloudinary.folderName'] = "Folder name is required";
            }
            if (!form.cloudinary?.cloudinaryName?.trim()) {
                newErrors['cloudinary.cloudinaryName'] = "Cloudinary name is required";
            }
            if (!form.cloudinary?.cloudinaryNameApiKey?.trim()) {
                newErrors['cloudinary.cloudinaryNameApiKey'] = "API Key is required";
            }
            if (!form.cloudinary?.cloudinaryNameApiKeySecret?.trim()) {
                newErrors['cloudinary.cloudinaryNameApiKeySecret'] = "API Secret is required";
            }
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
            // Build website payload according to schema
            const websiteData = {
                companyId: form.companyId,
                name: form.name.trim(),
                domain: form.domain.trim().toLowerCase(),
                status: form.status,
                database: {
                    name: form.database.name.trim(),
                    type: form.database.type,
                    host: form.database.host.trim(),
                    port: form.database.port,
                    username: form.database.username.trim(),
                    password: form.database.password,
                },
                ...(showCloudinary && form.cloudinary ? {
                    cloudinary: {
                        ...(form.cloudinary.folderName?.trim() && { folderName: form.cloudinary.folderName.trim() }),
                        ...(form.cloudinary.cloudinaryName?.trim() && { cloudinaryName: form.cloudinary.cloudinaryName.trim() }),
                        ...(form.cloudinary.cloudinaryNameApiKey?.trim() && { cloudinaryNameApiKey: form.cloudinary.cloudinaryNameApiKey.trim() }),
                        ...(form.cloudinary.cloudinaryNameApiKeySecret?.trim() && { cloudinaryNameApiKeySecret: form.cloudinary.cloudinaryNameApiKeySecret.trim() }),
                    }
                } : {}),
            };

            // Clean input by removing __typename
            const cleanInput = removeTypename(websiteData);
            console.log({cleanInput:cleanInput})

            let response;

            if (isEditMode && selectedData) {
                console.log("Updating website with ID:", selectedData.id);
                console.log("Update payload:", cleanInput);

                response = await updateWebsite({
                    variables: {
                        id: selectedData.id || selectedData._id,
                        input: cleanInput,
                    },
                });

                console.log("Update Website Response:", response);

                if (response.data?.updateWebsite) {
                    toast.success("Website updated successfully!");
                    refetch();
                    onCancel();
                }
            } else {
                console.log("Creating website with payload:", cleanInput);

                response = await createWebsite({
                    variables: {
                        input: cleanInput,
                    },
                });

                console.log("Create Website Response:", response);

                if (response.data?.createWebsite) {
                    toast.success("Website created successfully!");
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
                if (errorMessage.includes("domain")) {
                    toast.error("A website with this domain already exists");
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

    const toggleCloudinary = (enabled: boolean) => {
        setShowCloudinary(enabled);
        if (!enabled) {
            setForm(prev => ({ ...prev, cloudinary: null }));
        } else {
            setForm(prev => ({
                ...prev,
                cloudinary: {
                    folderName: "",
                    cloudinaryName: "",
                    cloudinaryNameApiKey: "",
                    cloudinaryNameApiKeySecret: "",
                }
            }));
        }
    };

    return (
        <Popup>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white z-30 rounded-t-xl border-b border-gray-100">
                    <div className="flex justify-between items-center px-6 py-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isEditMode ? "Edit Website" : "Add New Website"}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {isEditMode
                                    ? "Update website information"
                                    : "Create a new website"}
                                {currentCompany && (
                                    <span className="block mt-1 text-xs text-blue-600">
                                        Company: {currentCompany.name}
                                    </span>
                                )}
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
                                                Update Website
                                            </>
                                        ) : (
                                            <>
                                                <BiPlus className="mr-2" />
                                                Create Website
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
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <BiWorld className="mr-2" />
                                    Website Information
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Company Selection */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company *
                                        </label>
                                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700">
                                            {currentCompany?.name || "Loading..."}
                                        </div>
                                        {errors.company && (
                                            <p className="mt-1 text-xs text-red-500">{errors.company}</p>
                                        )}
                                    </div>

                                    <InputBox
                                        type="text"
                                        label="Website Name *"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="My E-commerce Store"
                                        error={errors.name}
                                    />

                                    <InputBox
                                        type="text"
                                        label="Domain *"
                                        name="domain"
                                        value={form.domain}
                                        onChange={handleChange}
                                        placeholder="example.com"
                                        error={errors.domain}
                                    />

                                    <div className="col-span-2">
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                            <div>
                                                <p className="font-medium text-gray-900">Website Status</p>
                                                <p className="text-sm text-gray-500">Enable or disable website</p>
                                            </div>
                                            <Switch
                                                checked={form.status === WebsiteStatus.ACTIVE}
                                                onChange={(value: boolean) =>
                                                    setForm(prev => ({
                                                        ...prev,
                                                        status: value ? WebsiteStatus.ACTIVE : WebsiteStatus.INACTIVE
                                                    }))
                                                }
                                                className={`${form.status === WebsiteStatus.ACTIVE ? "bg-green-600" : "bg-gray-200"
                                                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                                            >
                                                <span
                                                    className={`${form.status === WebsiteStatus.ACTIVE ? "translate-x-6" : "translate-x-1"
                                                        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                                                />
                                            </Switch>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Database Tab */}
                    {activeTab === "database" && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <FiDatabase className="mr-2" />
                                    Database Configuration
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <InputBox
                                        type="text"
                                        label="Database Name *"
                                        name="database.name"
                                        value={form.database.name}
                                        onChange={handleChange}
                                        placeholder="myapp_database"
                                        error={errors['database.name']}
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Database Type *
                                        </label>
                                        <select
                                            name="database.type"
                                            value={form.database.type}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        >
                                            <option value={DatabaseType.MONGODB}>MongoDB</option>
                                        </select>
                                    </div>

                                    <InputBox
                                        type="text"
                                        label="Host *"
                                        name="database.host"
                                        value={form.database.host}
                                        onChange={handleChange}
                                        placeholder="localhost"
                                        error={errors['database.host']}
                                    />

                                    <InputBox
                                        type="number"
                                        label="Port *"
                                        name="database.port"
                                        value={form.database.port.toString()}
                                        onChange={handleChange}
                                        placeholder="27017"
                                        error={errors['database.port']}
                                    />

                                    <InputBox
                                        type="text"
                                        label="Username *"
                                        name="database.username"
                                        value={form.database.username}
                                        onChange={handleChange}
                                        placeholder="db_user"
                                        error={errors['database.username']}
                                    />

                                    <InputBox
                                        type="password"
                                        label="Password *"
                                        name="database.password"
                                        value={form.database.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        error={errors['database.password']}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cloudinary Tab */}
                    {activeTab === "cloudinary" && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <BiCloud className="mr-2" />
                                        Cloudinary Configuration
                                    </h3>
                                    <Switch
                                        checked={showCloudinary}
                                        onChange={toggleCloudinary}
                                        className={`${showCloudinary ? "bg-blue-600" : "bg-gray-200"
                                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                                    >
                                        <span
                                            className={`${showCloudinary ? "translate-x-6" : "translate-x-1"
                                                } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                                        />
                                    </Switch>
                                </div>

                                {showCloudinary && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <InputBox
                                            type="text"
                                            label="Folder Name *"
                                            name="cloudinary.folderName"
                                            value={form.cloudinary?.folderName || ""}
                                            onChange={handleChange}
                                            placeholder="myapp-images"
                                            error={errors['cloudinary.folderName']}
                                        />

                                        <InputBox
                                            type="text"
                                            label="Cloudinary Name *"
                                            name="cloudinary.cloudinaryName"
                                            value={form.cloudinary?.cloudinaryName || ""}
                                            onChange={handleChange}
                                            placeholder="mycloud"
                                            error={errors['cloudinary.cloudinaryName']}
                                        />

                                        <InputBox
                                            type="text"
                                            label="API Key *"
                                            name="cloudinary.cloudinaryNameApiKey"
                                            value={form.cloudinary?.cloudinaryNameApiKey || ""}
                                            onChange={handleChange}
                                            placeholder="123456789012345"
                                            error={errors['cloudinary.cloudinaryNameApiKey']}
                                        />

                                        <InputBox
                                            type="password"
                                            label="API Secret *"
                                            name="cloudinary.cloudinaryNameApiKeySecret"
                                            value={form.cloudinary?.cloudinaryNameApiKeySecret || ""}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            error={errors['cloudinary.cloudinaryNameApiKeySecret']}
                                        />
                                    </div>
                                )}

                                {!showCloudinary && (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        Cloudinary integration is disabled. Toggle the switch to enable it.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Popup>
    );
};

export default AddWebsite;