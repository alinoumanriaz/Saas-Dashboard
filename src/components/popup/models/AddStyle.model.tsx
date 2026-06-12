"use client";
import React, { ChangeEvent, useState } from "react";
import Popup from "../Popup";
import { RxCross2 } from "react-icons/rx";
import Image from "next/image";
import InputBox from "@/components/InputBox";
import GalleryModel from "./GalleryModel";
import { toast } from "react-toastify";
import { useMutation } from "@apollo/client";
import { generateSlug } from "@/helpers/slug-maker";
import { CREATE_STYLE, UPDATE_STYLE } from "@/graphql/query/style.query";
import dynamic from "next/dynamic";

// Dynamically import the ToastEditor to avoid SSR issues
const ToastEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
});

interface IType {
  onCancel: () => void;
  selectedData?: any;
  isEditMode?: boolean;
  refetch?: () => void;
}

interface FAQItem {
  __typename?: string | undefined;
  question: string;
  answer: string;
  order: number;
}

const AddStyle = ({ onCancel, selectedData, isEditMode, refetch }: IType) => {
  type FormState = {
    name: string;
    slug: string;
    imageUrl: string;
    bannerImage: string;
    iconImageUrl: string;
    description: string;
    content: string;
  };

  const [form, setForm] = useState<FormState>({
    name: selectedData?.name || "",
    slug: selectedData?.slug || "",
    imageUrl: selectedData?.imageUrl || "",
    bannerImage: selectedData?.bannerImage || "",
    iconImageUrl: selectedData?.iconImageUrl || selectedData?.iconName || "",
    description: selectedData?.description || "",
    content: selectedData?.content || "",
  });

  const [faqs, setFaqs] = useState<FAQItem[]>(selectedData?.faqs || []);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [currentFaq, setCurrentFaq] = useState<FAQItem>({
    question: "",
    answer: "",
    order: 0,
  });

  const [showGalleryOpen, setShowGalleryOpen] = useState(false);
  const [galleryMode, setGalleryMode] = useState<
    "imageUrl" | "bannerImage" | "iconImageUrl"
  >("imageUrl");
  const [selectedImage, setSelectedImage] = useState<string>(
    selectedData?.imageUrl || ""
  );
  const [selectedBannerImage, setSelectedBannerImage] = useState<string>(
    selectedData?.bannerImage || ""
  );
  const [selectedIconImage, setSelectedIconImage] = useState<string>(
    selectedData?.iconImageUrl || selectedData?.iconName || ""
  );
  const [activeTab, setActiveTab] = useState<"images" | "content" | "faqs">(
    "content"
  );

  const [updateStyle, { loading: updateLoading }] = useMutation(UPDATE_STYLE);
  const [createStyle, { loading: createLoading }] = useMutation(CREATE_STYLE);

  const handleOnChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug when name changes
    if (name === "name") {
      setForm((prev) => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  const handleFaqChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCurrentFaq((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content: string) => {
    setForm((prev) => ({ ...prev, content }));
  };

  const addOrUpdateFaq = () => {
    if (!currentFaq.question.trim() || !currentFaq.answer.trim()) {
      toast.error("Both question and answer are required");
      return;
    }

    if (editingFaqIndex !== null) {
      // Update existing FAQ
      const updatedFaqs = [...faqs];
      updatedFaqs[editingFaqIndex] = {
        ...currentFaq,
        order: editingFaqIndex,
      };
      setFaqs(updatedFaqs);
      setEditingFaqIndex(null);
    } else {
      // Add new FAQ
      setFaqs([...faqs, { ...currentFaq, order: faqs.length }]);
    }

    // Reset form
    setCurrentFaq({
      question: "",
      answer: "",
      order: faqs.length,
    });
  };

  const editFaq = (index: number) => {
    setCurrentFaq(faqs[index]);
    setEditingFaqIndex(index);
  };

  const deleteFaq = (index: number) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    // Reorder the remaining FAQs
    const reorderedFaqs = updatedFaqs.map((faq, i) => ({ ...faq, order: i }));
    setFaqs(reorderedFaqs);

    if (editingFaqIndex === index) {
      setEditingFaqIndex(null);
      setCurrentFaq({
        question: "",
        answer: "",
        order: reorderedFaqs.length,
      });
    }
  };

  const cancelEdit = () => {
    setEditingFaqIndex(null);
    setCurrentFaq({
      question: "",
      answer: "",
      order: faqs.length,
    });
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error("Style name is required");
      return;
    }

      const cleanedFaqs = faqs.map(({ __typename, ...faq }) => faq);

    const inputData = {
      name: form.name,
      slug: form.slug,
      iconImageUrl: selectedIconImage,
      description: form.description,
      content: form.content,
      imageUrl: selectedImage,
      bannerImage: selectedBannerImage,
      faqs: cleanedFaqs,
    };

    console.log({inputData:inputData})

    try {
      if (isEditMode && selectedData?._id) {
        const result = await updateStyle({
          variables: {
            id: selectedData?._id,
            input: inputData,
          },
        });
        if (result.data?.updateStyle?.success) {
          toast.success(
            result.data.updateStyle.message || "Style updated successfully"
          );
        } else {
          toast.error(
            result.data?.updateStyle?.message || "Failed to update style"
          );
        }
      } else {
        const result = await createStyle({
          variables: {
            input: inputData,
          },
        });
        if (result.data?.createStyle?.success) {
          toast.success(
            result.data.createStyle.message || "Style created successfully"
          );
          onCancel();
        } else {
          toast.error(
            result.data?.createStyle?.message || "Failed to create style"
          );
        }
      }

      if (refetch) {
        refetch();
      }
      onCancel();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Operation failed");
    }
  };

  const galleryCloseHandler = () => {
    setShowGalleryOpen(false);
  };

  const handleSelectedImage = (imageUrl: string[]) => {
    const selected = imageUrl[0] || "";
    if (galleryMode === "imageUrl") {
      setSelectedImage(selected);
    } else if (galleryMode === "bannerImage") {
      setSelectedBannerImage(selected);
    } else if (galleryMode === "iconImageUrl") {
      setSelectedIconImage(selected);
    }
    setShowGalleryOpen(false);
  };

  const openGallery = (mode: "imageUrl" | "bannerImage" | "iconImageUrl") => {
    setGalleryMode(mode);
    setShowGalleryOpen(true);
  };

  const loading = updateLoading || createLoading;

  return (
    <Popup>
      <div className="bg-white w-full max-w-4xl relative py-6 px-8 shadow-xl rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? "Edit Style" : "Add New Style"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
          >
            <RxCross2 className="size-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("content")}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "content"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab("images")}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "images"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setActiveTab("faqs")}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "faqs"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              FAQs ({faqs.length})
            </button>
          </nav>
        </div>

        <div className="max-h-[50vh] overflow-y-auto pr-2">
          {/* Images Tab */}
          {activeTab === "images" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Profile Image */}
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-700">
                    Profile Image
                  </label>
                  <div
                    onClick={() => openGallery("imageUrl")}
                    className="group relative cursor-pointer w-full aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                  >
                    {selectedImage ? (
                      <>
                        <Image
                          src={selectedImage}
                          alt="industry image"
                          fill
                          className="rounded-lg object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity rounded-lg">
                          <span className="text-xs text-white font-medium">
                            Change Image
                          </span>
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
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-500">
                          Click to upload profile image
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Image */}
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-700">
                    Banner Image
                  </label>
                  <div
                    onClick={() => openGallery("bannerImage")}
                    className="group relative cursor-pointer w-full h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                  >
                    {selectedBannerImage ? (
                      <>
                        <Image
                          src={selectedBannerImage}
                          alt="banner image"
                          fill
                          className="rounded-lg object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity rounded-lg">
                          <span className="text-xs text-white font-medium">
                            Change Image
                          </span>
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
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-500">
                          Click to upload banner
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Icon Image */}
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-700">
                    Icon Image
                  </label>
                  <div
                    onClick={() => openGallery("iconImageUrl")}
                    className="group relative cursor-pointer w-full aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                  >
                    {selectedIconImage ? (
                      <>
                        <Image
                          src={selectedIconImage}
                          alt="icon image"
                          fill
                          className="rounded-lg object-contain p-2"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity rounded-lg">
                          <span className="text-xs text-white font-medium">
                            Change Icon
                          </span>
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
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM16 7l4 4m0 0l-4 4m4-4H4"
                            />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-500">
                          Click to upload icon
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Image Guidelines
                </h3>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>
                    • Profile Image: Square aspect ratio recommended (1:1)
                  </li>
                  <li>• Banner Image: Wide aspect ratio recommended (3:1)</li>
                  <li>
                    • Icon Image: Simple, recognizable icon (SVG recommended)
                  </li>
                  <li>• Supported formats: JPG, PNG, SVG, WebP</li>
                </ul>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === "content" && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <InputBox
                    onChange={handleOnChange}
                    label="Style Name *"
                    name="name"
                    type="text"
                    value={form.name}
                    placeholder="Enter style name"
                  />
                </div>
                <div>
                  <InputBox
                    onChange={handleOnChange}
                    label="Slug"
                    name="slug"
                    type="text"
                    value={form.slug}
                    placeholder="Style slug"
                  />
                  <p className="text-xs text-gray-500 mt-1 ml-1">
                    Auto-generated from name
                  </p>
                </div>
              </div>

              <div>
                <InputBox
                  onChange={handleOnChange}
                  label="Short Description"
                  name="description"
                  type="text"
                  value={form.description}
                  placeholder="Enter a short description"
                />
              </div>

              {/* Content Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Content
                </label>
                <div className="border border-gray-300 rounded-md overflow-hidden">
                  <ToastEditor
                    initialValue={form.content}
                    onChange={handleContentChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* FAQs Tab */}
          {activeTab === "faqs" && (
            <div className="space-y-6">
              {/* Add/Edit FAQ Form */}
              <div className="">
                <h3 className="text-sm font-medium text极客时间-gray-700 mb-3">
                  {editingFaqIndex !== null ? "Edit FAQ" : "Add New FAQ"}
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question *
                    </label>
                    <input
                      type="text"
                      name="question"
                      value={currentFaq.question}
                      onChange={handleFaqChange}
                      placeholder="Enter question"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Answer *
                    </label>
                    <textarea
                      name="answer"
                      value={currentFaq.answer}
                      onChange={handleFaqChange}
                      placeholder="Enter answer"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={addOrUpdateFaq}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {editingFaqIndex !== null ? "Update FAQ" : "Add FAQ"}
                    </button>

                    {editingFaqIndex !== null && (
                      <button
                        onClick={cancelEdit}
                        className="px极客时间4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* FAQs List */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  FAQs ({faqs.length})
                </h3>

                {faqs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p>No FAQs added yet. Add your first FAQ above.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {faqs.map((faq, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-800">
                            {faq.question}
                          </h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => editFaq(index)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteFaq(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
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
        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-300">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-5 py-2.5 rounded-lg text-white transition-colors flex items-center ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading && (
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
            )}
            {isEditMode ? "Update Style" : "Create Style"}
          </button>
        </div>
      </div>

      {showGalleryOpen && (
        <GalleryModel
          onCancel={galleryCloseHandler}
          onSentSelected={handleSelectedImage}
          mode={"single"}
        />
      )}
    </Popup>
  );
};

export default AddStyle;
