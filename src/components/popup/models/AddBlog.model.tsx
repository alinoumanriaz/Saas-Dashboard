"use client";
import { useState } from "react";
import Image from "next/image";
import { FiUpload, FiPlus, FiX } from "react-icons/fi";
import { Switch } from "@headlessui/react";
import { toast } from "react-toastify";
import { useLazyQuery, useMutation } from "@apollo/client";
import { generateSlug } from "@/helpers/slug-maker";
import GalleryModel from "./GalleryModel";
import InputBox from "@/components/InputBox";
import dynamic from "next/dynamic";
import { useAppSelector } from "@/redux/hooks";
import { CREATE_BLOG, UPDATE_BLOG } from "@/graphql/query/blog.query";
import { CHECK_SLUG_UNIQUE } from "@/graphql/query/blog.query"; // You'll need to create this query

const ToastEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
});

interface IType {
  onCancel: () => void;
  selectedData?: any;
  isEditMode?: boolean;
  refetch?: () => void;
}

const AddBlog = ({ onCancel, selectedData, isEditMode, refetch }: IType) => {
  const currentUser = useAppSelector((state) => state.currentUser.user);
  type FormState = {
    title: string;
    imageUrl: string[];
    slug: string;
    excerpt: string;
    content: string;
    author: string | null;
    status: string;
    tags: string[];
    isFeatured: boolean;
  };

  const [form, setForm] = useState<FormState>({
    title: selectedData?.title || "",
    imageUrl: selectedData?.imageUrl || [],
    slug: selectedData?.slug || "",
    excerpt: selectedData?.excerpt || "",
    content: selectedData?.content || "",
    author: currentUser?._id || null,
    status: selectedData?.status || "draft",
    tags: selectedData?.tags || [],
    isFeatured: selectedData?.isFeatured || false,
  });

  const [showGallery, setShowGallery] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>(
    selectedData?.imageUrl || []
  );
  const [tagInput, setTagInput] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [slugCheck, setSlugCheck] = useState("");

  const [updateBlog, { loading: updateLoading }] = useMutation(UPDATE_BLOG);
  const [createBlog, { loading: createLoading }] = useMutation(CREATE_BLOG);
  const [checkSlugUnique, { loading: slugLoading }] = useLazyQuery(CHECK_SLUG_UNIQUE);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "title" && !isSlugManual) {
      const newSlug = generateSlug(value);
      setForm((prev) => ({ ...prev, slug: newSlug }));
    }
  };

  const handleSlugFocus = () => setIsSlugManual(true);
  const handleSlugBlur = () => {
    if (form.slug === generateSlug(form.title)) {
      setIsSlugManual(false);
    }
  };

  const handleSlugCheck = async () => {
    if (!form.slug) {
      toast.error("Please enter a slug first");
      return;
    }


    console.log({slug:form.slug})
    console.log({excludedId:selectedData?._id})
    try {
      const { data } = await checkSlugUnique({
        variables: {
          slug: form.slug,
          excludedId: isEditMode ? selectedData?._id : null,
        },
        fetchPolicy: "network-only",
      });
      console.log({checkslugresultdata:data})

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

  const handleSubmit = async () => {
    if (!form.title) {
      toast.error("Blog title is required");
      return;
    }

    if (!form.content) {
      toast.error("Blog content is required");
      return;
    }

    if (selectedImages.length === 0) {
      toast.error("Please select at least one blog image");
      return;
    }

    const inputData = {
      ...form,
      imageUrl: selectedImages,
      author: currentUser?._id,
    };

    try {
      if (isEditMode && selectedData?._id) {
        const result = await updateBlog({
          variables: {
            id: selectedData._id,
            input: inputData,
          },
        });

        if (result.data?.updateBlog?.success) {
          toast.success("Blog updated successfully");
        } else {
          toast.error("Failed to update blog");
        }
      } else {
        const result = await createBlog({
          variables: {
            input: inputData,
          },
        });

        if (result.data?.createBlog?.success) {
          toast.success("Blog created successfully");
          onCancel();
        } else {
          toast.error("Failed to create blog");
        }
      }

      if (refetch) refetch();
      onCancel();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col justify-between items-center sticky top-0 bg-white z-30 rounded-t-xl">
          <div className="w-full flex justify-between items-center px-6 py-4">
            <div className="w-full">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? "Edit Blog" : "Add New Blog"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode
                  ? "Update your blog details"
                  : "Fill in the details to create a new blog post"}
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
                    <>{isEditMode ? "Update Blog" : "Create Blog"}</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-blue-50 px-6 w-full">
            <nav className="flex space-x-6 ">
              {["content", "media", "settings"].map((tab) => (
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

        <div className="p-6">
          {/* Content Tab */}
          {activeTab === "content" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Blog Content
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <InputBox
                        type="text"
                        label="Blog Title *"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Enter blog title"
                        className="bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Slug *
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
                            placeholder="blog-slug"
                            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                          : "Auto-generated from title"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Excerpt *
                      </label>
                      <textarea
                        name="excerpt"
                        value={form.excerpt}
                        onChange={handleChange}
                        rows={3}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="Brief excerpt that summarizes your blog post"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Blog Content
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Content *
                    </label>
                    <div className="border border-gray-300 rounded-md overflow-hidden">
                      <ToastEditor
                        initialValue={form.content}
                        onChange={(content: any) =>
                          setForm((prev) => ({ ...prev, content: content }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === "media" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="p-5 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Featured Image
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Blog Images *
                    </label>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {selectedImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                            <Image
                              src={img}
                              alt={`Blog ${index + 1}`}
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

              <div className="space-y-6">
                <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Tags
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Blog Tags
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
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Blog Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
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

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900">
                        Featured Blog
                      </p>
                      <p className="text-sm text-gray-500">
                        Show this blog in featured sections
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
          onSentSelected={(images) => {
            setSelectedImages(images);
            setForm((prev) => ({ ...prev, imageUrl: images }));
          }}
          mode="array"
        />
      )}
    </div>
  );
};

export default AddBlog;