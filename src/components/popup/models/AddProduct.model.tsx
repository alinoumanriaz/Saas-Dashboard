// app/(dashboard)/products/AddProduct.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FiUpload,
  FiPlus,
  FiX,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { Switch } from "@headlessui/react";
import { toast } from "react-toastify";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { generateSlug } from "@/helpers/slug-maker";
import {
  CHECK_H1TAG_UNIQUE,
  CHECK_METATITLE_UNIQUE,
  CHECK_SLUG_UNIQUE,
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
} from "@/graphql/query/product.query";
import GalleryModel from "./GalleryModel";
import InputBox from "@/components/InputBox";
import { GET_ALL_MATERIAL } from "@/graphql/query/material.query";
import dynamic from "next/dynamic";
import { GET_ALL_INDUSTRY } from "@/graphql/query/industry.query";
import { useAppSelector } from "@/redux/hooks";
import { GET_ALL_STYLE } from "@/graphql/query/style.query";
import { addProduct_zodSchema } from "@/zodSchema/addproduct_zod";
import z from "zod";
import Popup from "../Popup";
const ToastEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
});

interface IType {
  onCancel: () => void;
  selectedData?: any;
  isEditMode?: boolean;
  refetch?: () => void;
}

type FormErrors = {
  name?: string;
  slug?: string;
  h1Tag?: string;
  metaTitle?: string;
  metaDescription?: string;
  [key: string]: string | undefined;
};

const AddProduct = ({ onCancel, selectedData, isEditMode, refetch }: IType) => {
  type FormState = {
    name: string;
    slug: string;
    h1Tag: string;
    metaTitle: string;
    metaDescription: string;
    shortDescription: string;
    description: string;
    specification: string;
    status: string;
    industry: string;
    materials: string[];
    styles: string[];
    tags: string[];
    isFeatured: boolean;
    imageUrl: string[];
    author: string | null;
  };

  const currentMember = useAppSelector((state) => state.currentMember.member);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>(
    selectedData?.imageUrl || []
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [tagInput, setTagInput] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [slugCheck, setSlugCheck] = useState("");
  const [h1TagCheck, setH1TagCheck] = useState("");
  const [metaTitleCheck, setMetaTitleCheck] = useState("");
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: selectedData?.name || "",
    slug: selectedData?.slug || "",
    h1Tag: selectedData?.h1Tag || "",
    metaTitle: selectedData?.metaTitle || "",
    metaDescription: selectedData?.metaDescription || "",
    shortDescription: selectedData?.shortDescription || "",
    description: selectedData?.description || "",
    specification: selectedData?.specification || "",
    status: selectedData?.status || "draft",
    industry: selectedData?.industry?._id || selectedData?.industry || "",
    materials: selectedData?.materials?.map((m: any) => m._id || m) || [],
    styles: selectedData?.styles?.map((s: any) => s._id || s) || [],
    tags: selectedData?.tags || [],
    isFeatured: selectedData?.isFeatured || false,
    imageUrl: selectedData?.imageUrl || [],
    author: currentMember?._id || null,
  });

  const [updateProduct, { loading: updateLoading }] =
    useMutation(UPDATE_PRODUCT);
  const [createProduct, { loading: createLoading }] =
    useMutation(CREATE_PRODUCT);
  const { data: materialData } = useQuery(GET_ALL_MATERIAL);
  const { data: industryData } = useQuery(GET_ALL_INDUSTRY);
  const { data: styleData } = useQuery(GET_ALL_STYLE);
  const [checkSlugUnique, { loading: slugLoading }] =
    useLazyQuery(CHECK_SLUG_UNIQUE);
  const [checkH1TagUnique] = useLazyQuery(CHECK_H1TAG_UNIQUE);
  const [checkMetaTitleUnique] = useLazyQuery(CHECK_METATITLE_UNIQUE);

  const validateField = (name: string, value: string): string | undefined => {
    try {
      if (name === "name") {
        addProduct_zodSchema.shape.name.parse(value);
      } else if (name === "slug") {
        addProduct_zodSchema.shape.slug.parse(value);
      } else if (name === "h1Tag") {
        addProduct_zodSchema.shape.h1Tag.parse(value);
      } else if (name === "metaTitle") {
        addProduct_zodSchema.shape.metaTitle.parse(value);
      } else if (name === "metaDescription") {
        addProduct_zodSchema.shape.metaDescription.parse(value);
      }
      return undefined;
    } catch (error) {
      console.log({ zoderror: error });
      if (error instanceof z.ZodError) {
        return error.issues[0]?.message;
      }
      return "Invalid value";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate required fields from Zod schema
    const validationResult = addProduct_zodSchema.safeParse({
      name: form.name,
      slug: form.slug,
      h1Tag: form.h1Tag,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
    });

    if (!validationResult.success) {
      console.log({ validationResult: validationResult });
      validationResult.error.issues.forEach((error) => {
        const fieldName = error.path[0] as string;
        newErrors[fieldName] = error.message;
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Validate field on change
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));

    if (name === "name" && !isSlugManual) {
      const newSlug = generateSlug(value);
      setForm((prev) => ({ ...prev, slug: newSlug }));

      // Also validate the auto-generated slug
      const slugError = validateField("slug", newSlug);
      setErrors((prev) => ({ ...prev, slug: slugError }));
    }
  };

  const handleMaterialSelection = (materialId: string) => {
    setForm((prev) => {
      if (prev.materials.includes(materialId)) {
        return {
          ...prev,
          materials: prev.materials.filter((id) => id !== materialId),
        };
      } else {
        return {
          ...prev,
          materials: [...prev.materials, materialId],
        };
      }
    });
  };

  const handleStyleSelection = (styleId: string) => {
    setForm((prev) => {
      if (prev.styles.includes(styleId)) {
        return {
          ...prev,
          styles: prev.styles.filter((id) => id !== styleId),
        };
      } else {
        return {
          ...prev,
          styles: [...prev.styles, styleId],
        };
      }
    });
  };

  const handleSlugFocus = () => setIsSlugManual(true);
  const handleSlugBlur = () => {
    if (form.slug === generateSlug(form.name)) {
      setIsSlugManual(false);
    }

    // Validate slug on blur
    const error = validateField("slug", form.slug);
    setErrors((prev) => ({ ...prev, slug: error }));
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleImageSelection = (images: string[]) => {
    setSelectedImages(images);
    setForm((prev) => ({ ...prev, imageUrl: images }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    const inputData = {
      ...form,
      imageUrl: selectedImages,
      author: currentMember?._id,
    };

    console.log({ inputData: inputData });

    try {
      if (isEditMode && selectedData?._id) {
        const result = await updateProduct({
          variables: {
            id: selectedData._id,
            input: inputData,
          },
        });

        if (result.data?.updateProduct?.success) {
          toast.success("Product updated successfully");
        } else {
          toast.error("Failed to update product");
        }
      } else {
        const result = await createProduct({
          variables: { input: inputData },
        });

        if (result.data?.createProduct?.success) {
          toast.success("Product created successfully");
          onCancel();
        } else {
          toast.error("Failed to create product");
        }
      }

      if (refetch) refetch();
      onCancel();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    }
  };

  const handleSlugCheck = async () => {
    try {
      const { data } = await checkSlugUnique({
        variables: {
          slug: form.slug,
          excludedId: isEditMode ? selectedData?._id : null,
        },
        fetchPolicy: "network-only",
      });

      const result = data.checkSlugUnique;
      if (result.success) {
        setSlugCheck("✓ Slug is available");
      } else {
        setSlugCheck("✗ Slug is already taken");
      }
    } catch (error) {
      toast.error("Failed to check slug availability");
      console.log(error);
    }
  };

  const handleH1TagCheck = async () => {
    try {
      const { data } = await checkH1TagUnique({
        variables: {
          h1Tag: form.h1Tag,
          excludedId: isEditMode ? selectedData?._id : null,
        },
      });

      const result = data.checkH1TagUnique;
      if (result.success) {
        setH1TagCheck("✓ H1Tag is available");
      } else {
        setH1TagCheck("✗ H1Tag is already taken");
      }
    } catch (error) {
      toast.error("Failed to check H1Tag availability");
      console.log(error);
    }
  };

  const handleMetaTitleCheck = async () => {
    try {
      const { data } = await checkMetaTitleUnique({
        variables: {
          metaTitle: form.metaTitle,
          excludedId: isEditMode ? selectedData?._id : null,
        },
      });

      const result = data.checkMetaTitleUnique;
      if (result.success) {
        setMetaTitleCheck("✓ MetaTitle is available");
      } else {
        setMetaTitleCheck("✗ MetaTitle is already taken");
      }
    } catch (error) {
      toast.error("Failed to check MetaTitle availability");
      console.log(error);
    }
  };

  return (
    <Popup>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto overflow-visible">
        <div className="flex flex-col justify-between items-center sticky top-0 bg-white z-30 rounded-t-xl">
          <div className="w-full flex justify-between items-center px-6 py-4">
            <div className="w-full">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode
                  ? "Update your product details"
                  : "Fill in the details to create a new product"}
              </p>
            </div>
            <div className="flex justify-between items-center text-sm w-fit">
              <div className="flex space-x-3">
                <button
                  onClick={onCancel}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={updateLoading || createLoading}
                  className={`px-5 py-2.5 text-white rounded-lg text-nowrap flex items-center ${
                    updateLoading || createLoading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 transition-colors"
                  }`}
                >
                  {updateLoading || createLoading ? (
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
                    <>{isEditMode ? "Update Product" : "Create Product"}</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-blue-50 px-6 w-full">
            <nav className="flex space-x-6 ">
              {[
                "basic",
                "meta Data",
                "content",
                "categorization",
                "settings",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6 ">
          {/* Basic Information Tab */}
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <InputBox
                        type="text"
                        label="Product Name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter product name"
                        className="bg-white"
                        error={errors.name}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Slug
                      </label>
                      <div className="w-full flex justify-center items-center">
                        <div className="relative w-full">
                          <input
                            type="text"
                            name="slug"
                            value={form.slug}
                            onChange={handleChange}
                            onFocus={handleSlugFocus}
                            onBlur={handleSlugBlur}
                            placeholder="product-slug"
                            className={`w-full px-3 py-1 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                              errors.slug ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {isSlugManual ? "Manual" : "Auto"}
                            </span>
                          </div>
                        </div>
                        <div
                          onClick={handleSlugCheck}
                          className="px-2 py-1 text-white rounded-md text-sm ml-1 cursor-pointer bg-blue-500"
                        >
                          {slugLoading ? "Checking..." : "Check"}
                        </div>
                      </div>
                      {slugCheck && (
                        <p
                          className={`text-xs mt-1 ${
                            slugCheck.startsWith("✓")
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {slugCheck}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {isSlugManual
                          ? "Editing manually"
                          : "Auto-generated from name"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Short Description
                      </label>
                      <textarea
                        name="shortDescription"
                        value={form.shortDescription}
                        onChange={handleChange}
                        rows={3}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="Brief description that will appear in product listings"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Product Images
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Product Images
                    </label>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {selectedImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                            <Image
                              src={img}
                              alt={`Product ${index + 1}`}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() =>
                              setSelectedImages((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <FiX className="size-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setShowGallery(true)}
                        className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <FiUpload className="text-gray-400 mb-2 size-5" />
                        <span className="text-xs text-gray-500 text-center">
                          Add Image
                        </span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {selectedImages.length} image(s) selected
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "meta Data" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Meta Data
                  </h3>
                  <div className="space-y-4">
                    <div className="">
                      <label className="text-sm pl-1 font-medium" htmlFor="">
                        H1 Tag
                      </label>
                      <div className="flex w-full justify-center items-center">
                        <InputBox
                          type="text"
                          name="h1Tag"
                          value={form.h1Tag}
                          onChange={handleChange}
                          placeholder="Enter H1 Tag"
                          className="bg-white"
                        />
                        <div
                          onClick={handleH1TagCheck}
                          className="px-2 py-1.5 text-white rounded-md text-sm ml-1 cursor-pointer bg-blue-500"
                        >
                          Check
                        </div>
                      </div>
                      {errors.h1Tag && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.h1Tag}
                        </p>
                      )}
                      {h1TagCheck && (
                        <p
                          className={`text-xs mt-1 ${
                            h1TagCheck.startsWith("✓")
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {h1TagCheck}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm pl-1 font-medium" htmlFor="">
                        Meta Title
                      </label>
                      <div className="flex w-full justify-center items-center">
                        <InputBox
                          type="text"
                          name="metaTitle"
                          value={form.metaTitle}
                          onChange={handleChange}
                          placeholder="Enter Meta Title"
                          className="bg-white"
                        />
                        <div
                          onClick={handleMetaTitleCheck}
                          className="px-2 py-1.5 text-white rounded-md text-sm ml-1 cursor-pointer bg-blue-500"
                        >
                          Check
                        </div>
                      </div>
                      {errors.metaTitle && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.metaTitle}
                        </p>
                      )}
                      {metaTitleCheck && (
                        <p
                          className={`text-xs mt-1 ${
                            metaTitleCheck.startsWith("✓")
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {metaTitleCheck}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Meta Description
                      </label>
                      <textarea
                        name="metaDescription"
                        value={form.metaDescription}
                        onChange={handleChange}
                        rows={3}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="Brief description that will appear in product listings"
                      />
                      {errors.metaDescription && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.metaDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <div className="bg-gray-100 ring-1 ring-gray-200 p-5 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Product Content
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Description
                    </label>
                    <div className="border border-gray-300 rounded-md overflow-hidden">
                      <ToastEditor
                        initialValue={form.description}
                        onChange={(content: any) => {
                          setForm((prev) => ({
                            ...prev,
                            description: content,
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Specifications
                    </label>
                    <div className="border border-gray-300 rounded-md overflow-hidden">
                      <ToastEditor
                        initialValue={form.specification}
                        onChange={(content: any) =>
                          setForm((prev) => ({
                            ...prev,
                            specification: content,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Categorization Tab */}
          {activeTab === "categorization" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-5 rounded-lg ring-1 ring-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Categorization
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <select
                      name="industry"
                      value={form.industry}
                      onChange={handleChange}
                      className="w-full px-3 py-1 focus:outline-none focus:ring-blue-500 ring-1 ring-gray-300 rounded-md bg-white"
                    >
                      <option value="">Select industry</option>
                      {industryData?.getAllIndustry?.map((industry: any) => (
                        <option key={industry._id} value={industry._id}>
                          {industry.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Materials
                    </label>
                    <button
                      type="button"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left flex justify-between items-center"
                      onClick={() =>
                        setMaterialDropdownOpen(!materialDropdownOpen)
                      }
                    >
                      <span>
                        {form.materials.length > 0
                          ? `${form.materials.length} material(s) selected`
                          : "Select materials"}
                      </span>
                      {materialDropdownOpen ? (
                        <FiChevronUp />
                      ) : (
                        <FiChevronDown />
                      )}
                    </button>

                    {materialDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {materialData?.getAllMaterial?.map((material: any) => (
                          <label
                            key={material._id}
                            className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={form.materials.includes(material._id)}
                              onChange={() =>
                                handleMaterialSelection(material._id)
                              }
                              className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                            />
                            {material.name}
                          </label>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.materials.map((materialId) => {
                        const material = materialData?.getAllMaterial?.find(
                          (m: any) => m._id === materialId
                        );
                        return material ? (
                          <span
                            key={materialId}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {material.name}
                            <button
                              type="button"
                              onClick={() =>
                                handleMaterialSelection(materialId)
                              }
                              className="ml-1 text-blue-500 hover:text-blue-700"
                            >
                              <FiX className="size-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Styles
                    </label>
                    <button
                      type="button"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left flex justify-between items-center"
                      onClick={() => setStyleDropdownOpen(!styleDropdownOpen)}
                    >
                      <span>
                        {form.styles.length > 0
                          ? `${form.styles.length} style(s) selected`
                          : "Select styles"}
                      </span>
                      {styleDropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </button>

                    {styleDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {styleData?.getAllStyle?.map((style: any) => (
                          <label
                            key={style._id}
                            className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={form.styles.includes(style._id)}
                              onChange={() => handleStyleSelection(style._id)}
                              className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                            />
                            {style.name}
                          </label>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.styles.map((styleId) => {
                        const style = styleData?.getAllStyle?.find(
                          (s: any) => s._id === styleId
                        );
                        return style ? (
                          <span
                            key={styleId}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                          >
                            {style.name}
                            <button
                              type="button"
                              onClick={() => handleStyleSelection(styleId)}
                              className="ml-1 text-green-500 hover:text-green-700"
                            >
                              <FiX className="size-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-lg ring-1 ring-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Product Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1.5 text-blue-500 hover:text-blue-700 rounded-full"
                        >
                          <FiX className="size-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="flex-1 px-3 py-2 outline-none ring-gray-300 rounded-l-md ring-1 focus:ring-blue-500"
                      placeholder="Add tags"
                    />
                    <button
                      onClick={addTag}
                      className="px-4 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors flex items-center"
                    >
                      <FiPlus className="mr-1" /> Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter or click Add to include tags
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-5 rounded-lg ring-1 ring-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Product Status
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 ring-1 ring-gray-300 outline-none rounded-md focus:ring-blue-500 bg-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-300 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        Featured Product
                      </p>
                      <p className="text-sm text-gray-500">
                        Show this product in featured sections
                      </p>
                    </div>
                    <Switch
                      checked={form.isFeatured}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, isFeatured: value }))
                      }
                      className={`${
                        form.isFeatured ? "bg-blue-600" : "bg-gray-200"
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                    >
                      <span
                        className={`${
                          form.isFeatured ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                      />
                    </Switch>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showGallery && (
        <GalleryModel
          onCancel={() => setShowGallery(false)}
          onSentSelected={handleImageSelection}
          mode="array"
        />
      )}
    </Popup>
  );
};

export default AddProduct;
