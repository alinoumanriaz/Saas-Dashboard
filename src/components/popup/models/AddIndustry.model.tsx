/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeEvent, useState, useEffect } from "react";
import { useMutation, useLazyQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import { FiX } from "react-icons/fi";
import { RxCross2 } from "react-icons/rx";
import dynamic from "next/dynamic";
import Image from "next/image";

import Popup from "../Popup";
import InputBox from "@/components/InputBox";
import GalleryModel from "./GalleryModel";
import { generateSlug } from "@/helpers/slug-maker";
import { removeTypename } from "@/helpers/removetypename";
import {
  CHECK_INDUSTRY_H1_TAG_UNIQUE,
  CHECK_INDUSTRY_META_TITLE_UNIQUE,
  CHECK_INDUSTRY_SLUG_UNIQUE,
  CREATE_INDUSTRY,
  UPDATE_INDUSTRY,
} from "@/graphql/current-website-queries/industry.query";

const ToastEditor = dynamic(() => import("../../RichTextEditor"), { ssr: false });

interface IType {
  onCancel: () => void;
  selectedData?: any;
  isEditMode?: boolean;
  refetch?: () => void;
}

interface FAQItem {
  __typename?: string;
  question: string;
  answer: string;
  order: number;
}

interface ImageItem {
  url: string;
  alt: string;
}

interface FormState {
  name: string;
  slug: string;
  h1Tag: string;
  metaTitle: string;
  metaDescription: string;
  imageUrl: ImageItem[];      // array of images
  bannerImage: ImageItem | null;
  iconImageUrl: ImageItem | null;
  description: string;
  content: string;
}

const AddIndustry = ({ onCancel, selectedData, isEditMode, refetch }: IType) => {
  // Helper to convert legacy data (string, object, or array) to correct format
  const toSingleImage = (input: any): ImageItem | null => {
    if (!input) return null;
    if (typeof input === "string") return { url: input, alt: "" };
    if (input.url) return { url: input.url, alt: input.alt || "" };
    return null;
  };

  const toImageArray = (input: any): ImageItem[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === "string") return [{ url: input, alt: "" }];
    if (input.url) return [{ url: input.url, alt: input.alt || "" }];
    return [];
  };

  const [form, setForm] = useState<FormState>({
    name: selectedData?.name || "",
    slug: selectedData?.slug || "",
    h1Tag: selectedData?.h1Tag || "",
    metaTitle: selectedData?.metaTitle || "",
    metaDescription: selectedData?.metaDescription || "",
    imageUrl: toImageArray(selectedData?.imageUrl),
    bannerImage: toSingleImage(selectedData?.bannerImage),
    iconImageUrl: toSingleImage(selectedData?.iconImageUrl || selectedData?.iconName),
    description: selectedData?.description || "",
    content: selectedData?.content || "",
  });

  const [faqs, setFaqs] = useState<FAQItem[]>(selectedData?.faqs || []);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [currentFaq, setCurrentFaq] = useState<FAQItem>({ question: "", answer: "", order: 0 });
  const [showGalleryOpen, setShowGalleryOpen] = useState(false);
  const [galleryMode, setGalleryMode] = useState<"imageUrl" | "bannerImage" | "iconImageUrl">("imageUrl");
  const [activeTab, setActiveTab] = useState<"basic" | "meta" | "content" | "images" | "faqs">("basic");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [slugCheck, setSlugCheck] = useState("");
  const [h1TagCheck, setH1TagCheck] = useState("");
  const [metaTitleCheck, setMetaTitleCheck] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mutations
  const [createIndustry, { loading: createLoading }] = useMutation<any>(CREATE_INDUSTRY);
  const [updateIndustry, { loading: updateLoading }] = useMutation<any>(UPDATE_INDUSTRY);
  const loading = createLoading || updateLoading;

  // Lazy queries for uniqueness
  const [checkSlug, { loading: checkingSlug, data: slugData, error: slugError }] = useLazyQuery<any>(CHECK_INDUSTRY_SLUG_UNIQUE);
  const [checkH1Tag, { loading: checkingH1Tag, data: h1TagData, error: h1TagError }] = useLazyQuery<any>(CHECK_INDUSTRY_H1_TAG_UNIQUE);
  const [checkMetaTitle, { loading: checkingMetaTitle, data: metaTitleData, error: metaTitleError }] = useLazyQuery<any>(CHECK_INDUSTRY_META_TITLE_UNIQUE);

  useEffect(() => {
    if (slugData?.checkIndustrySlugUnique) {
      const isUnique = slugData.checkIndustrySlugUnique.isUnique;
      setSlugCheck(isUnique ? "✓ Slug is available" : "✗ Slug is already taken");
    }
    if (slugError) toast.error("Failed to check slug availability");
  }, [slugData, slugError]);

  useEffect(() => {
    if (h1TagData?.checkIndustryH1TagUnique) {
      const isUnique = h1TagData.checkIndustryH1TagUnique.isUnique;
      setH1TagCheck(isUnique ? "✓ H1 Tag is available" : "✗ H1 Tag is already taken");
    }
    if (h1TagError) toast.error("Failed to check H1 Tag availability");
  }, [h1TagData, h1TagError]);

  useEffect(() => {
    if (metaTitleData?.checkIndustryMetaTitleUnique) {
      const isUnique = metaTitleData.checkIndustryMetaTitleUnique.isUnique;
      setMetaTitleCheck(isUnique ? "✓ Meta Title is available" : "✗ Meta Title is already taken");
    }
    if (metaTitleError) toast.error("Failed to check Meta Title availability");
  }, [metaTitleData, metaTitleError]);

  const handleOnChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (name === "name" && !isSlugManual) {
      const newSlug = generateSlug(value);
      setForm((prev) => ({ ...prev, slug: newSlug }));
      if (errors.slug) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.slug;
          return newErrors;
        });
      }
    }
    if (name === "name" && !form.h1Tag) setForm((prev) => ({ ...prev, h1Tag: value }));
    if (name === "name" && !form.metaTitle) setForm((prev) => ({ ...prev, metaTitle: value }));
  };

  const handleSlugFocus = () => setIsSlugManual(true);
  const handleSlugBlur = () => {
    if (form.slug === generateSlug(form.name)) setIsSlugManual(false);
  };

  const handleFaqChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentFaq((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content: string) => setForm((prev) => ({ ...prev, content }));

  const addOrUpdateFaq = () => {
    if (!currentFaq.question.trim() || !currentFaq.answer.trim()) {
      toast.error("Both question and answer are required");
      return;
    }
    if (editingFaqIndex !== null) {
      const updatedFaqs = [...faqs];
      updatedFaqs[editingFaqIndex] = { ...currentFaq, order: editingFaqIndex };
      setFaqs(updatedFaqs);
      setEditingFaqIndex(null);
    } else {
      setFaqs([...faqs, { ...currentFaq, order: faqs.length }]);
    }
    setCurrentFaq({ question: "", answer: "", order: faqs.length });
  };

  const editFaq = (index: number) => {
    setCurrentFaq(faqs[index]);
    setEditingFaqIndex(index);
  };

  const deleteFaq = (index: number) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    const reorderedFaqs = updatedFaqs.map((faq, i) => ({ ...faq, order: i }));
    setFaqs(reorderedFaqs);
    if (editingFaqIndex === index) {
      setEditingFaqIndex(null);
      setCurrentFaq({ question: "", answer: "", order: reorderedFaqs.length });
    }
  };

  const cancelEdit = () => {
    setEditingFaqIndex(null);
    setCurrentFaq({ question: "", answer: "", order: faqs.length });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Industry name is required";
    if (!form.slug.trim()) newErrors.slug = "Slug is required";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug))
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    if (!form.h1Tag.trim()) newErrors.h1Tag = "H1 Tag is required";
    if (!form.metaTitle.trim()) newErrors.metaTitle = "Meta Title is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    const inputData = {
      name: form.name,
      slug: form.slug,
      h1Tag: form.h1Tag,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      iconImageUrl: form.iconImageUrl,
      description: form.description,
      content: form.content,
      imageUrl: form.imageUrl.length > 0 ? form.imageUrl : null,
      bannerImage: form.bannerImage,
      faqs: faqs,
    };

    const cleanInputData = removeTypename(inputData);

    try {
      let result;
      if (isEditMode && selectedData?._id) {
        result = await updateIndustry({
          variables: { id: selectedData._id, input: cleanInputData },
        });
        if (result.data?.updateIndustry?.success) {
          toast.success(result.data.updateIndustry.message || "Industry updated successfully");
        } else {
          toast.error(result.data?.updateIndustry?.message || "Failed to update industry");
        }
      } else {
        result = await createIndustry({ variables: { input: cleanInputData } });
        if (result.data?.createIndustry?.success) {
          toast.success(result.data.createIndustry.message || "Industry created successfully");
        } else {
          toast.error(result.data?.createIndustry?.message || "Failed to create industry");
        }
      }
      if (refetch) refetch();
      onCancel();
    } catch (error: any) {
      console.error("GraphQL Error:", error);
      toast.error(error.message || "Operation failed");
    }
  };

  // Gallery handlers
  const galleryCloseHandler = () => setShowGalleryOpen(false);

  const handleSelectedImage = (images: any[]) => {
    if (images.length === 0) {
      // Remove image
      if (galleryMode === "imageUrl") {
        setForm((prev) => ({ ...prev, imageUrl: [] }));
      } else {
        setForm((prev) => ({ ...prev, [galleryMode]: null }));
      }
    } else {
      const selected = images[0];
      const newImage = { url: selected.url, alt: selected.alt || "" };
      if (galleryMode === "imageUrl") {
        setForm((prev) => ({ ...prev, imageUrl: [newImage] }));
      } else {
        setForm((prev) => ({ ...prev, [galleryMode]: newImage }));
      }
    }
    setShowGalleryOpen(false);
  };

  const openGallery = (mode: "imageUrl" | "bannerImage" | "iconImageUrl") => {
    setGalleryMode(mode);
    setShowGalleryOpen(true);
  };

  const removeImage = (mode: "imageUrl" | "bannerImage" | "iconImageUrl") => {
    if (mode === "imageUrl") {
      setForm((prev) => ({ ...prev, imageUrl: [] }));
    } else {
      setForm((prev) => ({ ...prev, [mode]: null }));
    }
  };

  const getImageUrl = (mode: "imageUrl" | "bannerImage" | "iconImageUrl"): string => {
    if (mode === "imageUrl") {
      return form.imageUrl.length > 0 ? form.imageUrl[0].url : "";
    }
    const img = form[mode];
    return img?.url || "";
  };

  const hasCustomAltText = (mode: "imageUrl" | "bannerImage" | "iconImageUrl"): boolean => {
    if (mode === "imageUrl") {
      return form.imageUrl.length > 0 && !!form.imageUrl[0].alt;
    }
    const img = form[mode];
    return !!img?.alt;
  };

  // Uniqueness check handlers
  const handleSlugCheck = () => {
    if (!form.slug.trim()) {
      toast.error("Please enter a slug first");
      return;
    }
    checkSlug({
      variables: {
        slug: form.slug,
        excludeId: isEditMode ? selectedData?._id : undefined,
      },
    });
  };

  const handleH1TagCheck = () => {
    if (!form.h1Tag.trim()) {
      toast.error("Please enter an H1 tag first");
      return;
    }
    checkH1Tag({
      variables: {
        h1Tag: form.h1Tag,
        excludeId: isEditMode ? selectedData?._id : undefined,
      },
    });
  };

  const handleMetaTitleCheck = () => {
    if (!form.metaTitle.trim()) {
      toast.error("Please enter a meta title first");
      return;
    }
    checkMetaTitle({
      variables: {
        metaTitle: form.metaTitle,
        excludeId: isEditMode ? selectedData?._id : undefined,
      },
    });
  };

  // JSX remains exactly as before (same visual layout)
  return (
    <Popup>
      <div className="bg-white w-full max-w-6xl relative py-6 px-8 shadow-xl rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? "Edit Industry" : "Add New Industry"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
            aria-label="Close dialog"
          >
            <RxCross2 className="size-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex space-x-8">
            {["basic", "meta", "content", "images", "faqs"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                aria-selected={activeTab === tab}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "faqs" && faqs.length > 0 && (
                  <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {faqs.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {/* Basic Tab */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputBox
                  onChange={handleOnChange}
                  label="Industry Name *"
                  name="name"
                  type="text"
                  value={form.name}
                  placeholder="Enter industry name"
                  error={errors.name}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Slug *</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        name="slug"
                        value={form.slug}
                        onChange={handleOnChange}
                        onFocus={handleSlugFocus}
                        onBlur={handleSlugBlur}
                        placeholder="industry-slug"
                        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                          errors.slug ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {isSlugManual ? "Manual" : "Auto"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleSlugCheck}
                      disabled={checkingSlug || !form.slug.trim()}
                      className="px-3 py-2 text-white rounded-md text-sm cursor-pointer bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                      {checkingSlug ? "Checking..." : "Check"}
                    </button>
                  </div>
                  {slugCheck && (
                    <p className={`text-xs mt-1 ${slugCheck.startsWith("✓") ? "text-green-500" : "text-red-500"}`}>
                      {slugCheck}
                    </p>
                  )}
                  {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleOnChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Enter a short description for the industry"
                />
              </div>
            </div>
          )}

          {/* Meta Tab */}
          {activeTab === "meta" && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">SEO & Meta Data</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">H1 Tag *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        name="h1Tag"
                        value={form.h1Tag}
                        onChange={handleOnChange}
                        className={`flex-1 px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                          errors.h1Tag ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="e.g., Web Development Services"
                      />
                      <button
                        onClick={handleH1TagCheck}
                        disabled={checkingH1Tag || !form.h1Tag.trim()}
                        className="px-3 py-2 text-white rounded-md text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                      >
                        {checkingH1Tag ? "Checking..." : "Check"}
                      </button>
                    </div>
                    {h1TagCheck && (
                      <p className={`text-xs mt-1 ${h1TagCheck.startsWith("✓") ? "text-green-500" : "text-red-500"}`}>
                        {h1TagCheck}
                      </p>
                    )}
                    {errors.h1Tag && <p className="text-xs text-red-500 mt-1">{errors.h1Tag}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        name="metaTitle"
                        value={form.metaTitle}
                        onChange={handleOnChange}
                        className={`flex-1 px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                          errors.metaTitle ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="e.g., Professional Web Development Services | Company"
                      />
                      <button
                        onClick={handleMetaTitleCheck}
                        disabled={checkingMetaTitle || !form.metaTitle.trim()}
                        className="px-3 py-2 text-white rounded-md text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                      >
                        {checkingMetaTitle ? "Checking..." : "Check"}
                      </button>
                    </div>
                    {metaTitleCheck && (
                      <p className={`text-xs mt-1 ${metaTitleCheck.startsWith("✓") ? "text-green-500" : "text-red-500"}`}>
                        {metaTitleCheck}
                      </p>
                    )}
                    {errors.metaTitle && <p className="text-xs text-red-500 mt-1">{errors.metaTitle}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                    <textarea
                      name="metaDescription"
                      value={form.metaDescription}
                      onChange={handleOnChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Description for search engines (150-160 chars)"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">Recommended: 150-160 characters</p>
                      <span
                        className={`text-xs ${
                          form.metaDescription.length > 160
                            ? "text-red-500"
                            : form.metaDescription.length > 150
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {form.metaDescription.length}/160
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === "images" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["imageUrl", "bannerImage", "iconImageUrl"] as const).map((mode) => (
                  <div key={mode} className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="text-sm font-medium text-gray-700">
                      {mode === "imageUrl" ? "Profile Image (Gallery)" : mode === "bannerImage" ? "Banner Image" : "Icon Image"}
                    </label>
                    <div className="group relative">
                      <div
                        onClick={() => openGallery(mode)}
                        className="relative cursor-pointer w-full aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        role="button"
                        tabIndex={0}
                        onKeyUp={(e) => {
                          if (e.key === "Enter" || e.key === " ") openGallery(mode);
                        }}
                      >
                        {getImageUrl(mode) ? (
                          <>
                            <Image
                              src={getImageUrl(mode)}
                              alt={mode === "imageUrl" ? (form.imageUrl[0]?.alt || "Industry image") : (form[mode]?.alt || "Industry image")}
                              fill
                              className="rounded-lg object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity rounded-lg">
                              <span className="text-xs text-white font-medium">Change Image</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-4">
                            <div className="mx-auto text-gray-400 mb-1">
                              <svg
                                className="w-8 h-8"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <p className="text-xs text-gray-500">Click to upload</p>
                          </div>
                        )}
                      </div>
                      {hasCustomAltText(mode) && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          Alt Text
                        </div>
                      )}
                      {getImageUrl(mode) && (
                        <button
                          onClick={() => removeImage(mode)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                          aria-label="Remove image"
                        >
                          <FiX className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Image Guidelines</h3>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Profile Image (Gallery): Square aspect ratio recommended (1:1) – supports multiple images (UI shows first)</li>
                  <li>• Banner Image: Wide aspect ratio recommended (3:1)</li>
                  <li>• Icon Image: Simple, recognizable icon (SVG recommended)</li>
                  <li>• Supported formats: JPG, PNG, SVG, WebP</li>
                  <li>• You can add alt text for each image for better accessibility</li>
                </ul>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Content</label>
                <div className="border border-gray-300 rounded-md overflow-hidden">
                  <ToastEditor initialValue={form.content} onChange={handleContentChange} />
                </div>
              </div>
            </div>
          )}

          {/* FAQs Tab */}
          {activeTab === "faqs" && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {editingFaqIndex !== null ? "Edit FAQ" : "Add New FAQ"}
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    name="question"
                    value={currentFaq.question}
                    onChange={handleFaqChange}
                    placeholder="Question *"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <textarea
                    name="answer"
                    value={currentFaq.answer}
                    onChange={handleFaqChange}
                    placeholder="Answer *"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={addOrUpdateFaq}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-300"
                    >
                      {editingFaqIndex !== null ? "Update FAQ" : "Add FAQ"}
                    </button>
                    {editingFaqIndex !== null && (
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">FAQs ({faqs.length})</h3>
                {faqs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    <p>No FAQs added yet. Add your first FAQ above.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {faqs.map((faq, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-800 flex-1">{faq.question}</h4>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => editFaq(index)}
                              className="text-blue-600 hover:text-blue-800 text-sm hover:underline transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteFaq(index)}
                              className="text-red-600 hover:text-red-800 text-sm hover:underline transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-300 mt-4">
          <button
            onClick={onCancel}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-5 py-2 rounded-lg text-white transition-colors flex items-center ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isEditMode ? "Update Industry" : "Create Industry"}
          </button>
        </div>
      </div>

      {showGalleryOpen && (
        <GalleryModel onCancel={galleryCloseHandler} onSentSelected={handleSelectedImage} mode="single" />
      )}
    </Popup>
  );
};

export default AddIndustry;