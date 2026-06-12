"use client";
import React, { ChangeEvent, useState, useCallback, useEffect } from "react";
import axios from "axios";
import Popup from "../Popup";
import Image from "next/image";
import { RxCross2 } from "react-icons/rx";
import { TiTick } from "react-icons/ti";
import {
  FiUpload,
  FiImage,
  FiTrash2,
  FiSend,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import LoaderSpin from "@/components/LoaderSpin";

interface IProps {
  onCancel: () => void;
  onSentSelected: (imagesUrl: any[]) => void;
  mode: string;
}

interface CloudinaryImage {
  secure_url: string;
  public_id: string;
  original_filename: string;
  alt_text?: string;
}

const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/dvu49dsgg/image/upload";
const UPLOAD_PRESET = "uniquecustomboxes";
const FOLDER = "dbManagementDashboard";

const AppGalleryModel = ({ onCancel, onSentSelected, mode }: IProps) => {
  const [activeTab, setActiveTab] = useState<"gallery" | "upload">("gallery");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<CloudinaryImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Preview and Alt text state
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);
  const [altTexts, setAltTexts] = useState<{ [key: string]: string }>({});

  // Fetch images with pagination (infinite scroll)
  const fetchImages = useCallback(
    async (cursor: string | null = null) => {
      try {
        if (!cursor) setLoading(true);
        else setLoadingMore(true);

        const params: any = { folder: FOLDER, limit: 50 };
        if (cursor) params.next_cursor = cursor;

        const response = await axios.get("/api/cloudinary", { params });
        setImages((prev) => [...prev, ...(response.data.images || [])]);
      setNextCursor(response.data.next_cursor || null);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch images.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (activeTab === "gallery") fetchImages();
  }, [activeTab, fetchImages]);

  // Infinite scroll handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 50 && nextCursor && !loadingMore) {
      fetchImages(nextCursor);
    }
  };

  // File upload
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((file) => {
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
        const validSize = file.size <= 10 * 1024 * 1024;
        return validTypes.includes(file.type) && validSize;
      });

      if (validFiles.length !== fileArray.length) {
        setError("Some files skipped (only JPEG/PNG/WebP/SVG under 10MB allowed)");
      }
      if (validFiles.length === 0) return;

      const uploadedImages: CloudinaryImage[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        formData.append("folder", FOLDER);

        const baseName = file.name.replace(/\.[^/.]+$/, "").trim().replace(/\s+/g, "-");
        formData.append("public_id", baseName);

        const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(percentCompleted);
          },
        });

        uploadedImages.push(response.data);
        setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
      }

      setImages((prev) => [...uploadedImages, ...prev]);
      setSuccess(`${uploadedImages.length} images uploaded successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      setActiveTab("gallery");
    } catch (err) {
      console.error(err);
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFileUpload(e.target.files);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
  };

  // Image selection
  const handleImageSelect = (image: CloudinaryImage) => {
    if (mode === "array") {
      setSelectedImages((prev) =>
        prev.find((img) => img.secure_url === image.secure_url)
          ? prev.filter((img) => img.secure_url !== image.secure_url)
          : [...prev, image]
      );
    } else {
      setSelectedImages((prev) =>
        prev.length > 0 && prev[0].secure_url === image.secure_url ? [] : [image]
      );
    }
  };

  // Delete selected images
  const handleImageDelete = useCallback(async () => {
    if (selectedImages.length === 0) return;
    try {
      setUploading(true);
      const public_ids = selectedImages.map((img) => img.public_id);
      await axios.delete("/api/cloudinary", { data: { public_ids, folder: FOLDER } });

      setImages((prev) => prev.filter((img) => !public_ids.includes(img.public_id)));
      setSelectedImages([]);
      setSuccess(`${public_ids.length} images deleted successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete images. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [selectedImages]);

  const handleSendImages = () => {
    const selectedUrls: any[] = selectedImages.map((img) => ({
      url: img.secure_url,
      alt: altTexts[img.public_id] || img.original_filename || "",
    }));
    onSentSelected(selectedUrls);
    setSuccess(`${selectedUrls.length} images sent successfully!`);
    setTimeout(() => setSuccess(null), 3000);
    onCancel();
  };

  const handleAltTextChange = (publicId: string, text: string) => {
    setAltTexts((prev) => ({ ...prev, [publicId]: text }));
  };

  const currentPreviewImage = selectedImages[currentPreviewIndex];
  const currentAltText = currentPreviewImage
    ? altTexts[currentPreviewImage.public_id] || ""
    : "";

  const navigatePreview = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentPreviewIndex((prev) =>
        prev > 0 ? prev - 1 : selectedImages.length - 1
      );
    } else {
      setCurrentPreviewIndex((prev) =>
        prev < selectedImages.length - 1 ? prev + 1 : 0
      );
    }
  };

  return (
    <Popup>
      <div className="bg-white rounded-xl w-[95%] h-[90%] md:w-[90%] xl:w-[95%] relative overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Image Gallery</h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <RxCross2 className="text-gray-600 size-5" />
          </button>
        </div>

        {/* Status messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-0 right-0 flex justify-center z-10"
            >
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-0 right-0 flex justify-center z-10"
            >
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-md text-sm">
                {success}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex justify-between items-center border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex items-center px-6 py-3 text-sm font-medium ${
                activeTab === "upload"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiUpload className="mr-2" /> Upload
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`flex items-center px-6 py-3 text-sm font-medium ${
                activeTab === "gallery"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiImage className="mr-2" /> Gallery
            </button>
          </div>

          {selectedImages.length > 0 && (
            <div className="flex space-x-3 mr-4">
              <button
                onClick={handleImageDelete}
                disabled={uploading}
                className="flex items-center px-4 py-1.5 ring-1 ring-red-200 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50"
              >
                {uploading ? (
                  "loading..."
                ) : (
                  <>
                    <FiTrash2 className="mr-2" /> Delete ({selectedImages.length})
                  </>
                )}
              </button>
              <button
                onClick={handleSendImages}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FiSend className="mr-2" /> Send ({selectedImages.length})
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="h-[calc(100%-120px)] overflow-hidden">
          {activeTab === "gallery" ? (
            <div className="flex h-full">
              {/* Left - Gallery */}
              <div
                className={`${
                  selectedImages.length > 0 ? "w-[70%]" : "w-full"
                } overflow-y-auto p-4`}
                onScroll={handleScroll}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {loading ? (
                    <div className="col-span-full flex justify-center items-center h-64">
                      <LoaderSpin color="text-blue-500" />
                    </div>
                  ) : images.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 py-12">
                      <FiImage className="size-12 mb-4 opacity-50 mx-auto" />
                      <p className="text-lg">No images found</p>
                      <button
                        onClick={() => setActiveTab("upload")}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                      >
                        Upload some images
                      </button>
                    </div>
                  ) : (
                    images.map((img, index) => (
                      <div key={`${img.public_id}-${index}`} className="rounded shadow-md relative group">
                        <label htmlFor={img.public_id} className="cursor-pointer">
                          <input
                            type="checkbox"
                            id={img.public_id}
                            checked={selectedImages.some(
                              (selected) => selected.secure_url === img.secure_url
                            )}
                            onChange={() => handleImageSelect(img)}
                            className="peer hidden"
                          />
                          <div className="absolute top-1 right-1 w-5 h-5 bg-white border-2 border-gray-300 flex justify-center items-center rounded opacity-0 peer-checked:opacity-100 peer-checked:border-blue-600 peer-checked:bg-blue-600 transition">
                            <TiTick className="size-6 text-white" />
                          </div>
                          <Image
                            src={img.secure_url}
                            alt={altTexts[img.public_id] || img.original_filename || "gallery image"}
                            width={300}
                            height={300}
                            loading="lazy"
                            className="w-full h-48 object-cover rounded"
                          />
                          {altTexts[img.public_id] && (
                            <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                              Alt Text
                            </div>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>

                {loadingMore && (
                  <div className="text-center mt-4 text-gray-500">
                    Loading more images...
                  </div>
                )}
              </div>

              {/* Right - Preview Panel */}
              {selectedImages.length > 0 && (
                <div className="w-[30%] border-l border-gray-200 bg-gray-50 flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Image Preview ({currentPreviewIndex + 1}/{selectedImages.length})
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    {selectedImages.length > 1 && (
                      <div className="flex justify-between items-center mb-4">
                        <button
                          onClick={() => navigatePreview("prev")}
                          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          <FiChevronLeft className="size-5" />
                        </button>
                        <span className="text-sm text-gray-600">
                          Image {currentPreviewIndex + 1} of {selectedImages.length}
                        </span>
                        <button
                          onClick={() => navigatePreview("next")}
                          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          <FiChevronRight className="size-5" />
                        </button>
                      </div>
                    )}

                    {currentPreviewImage && (
                      <>
                        <div className="flex justify-center mb-4">
                          <Image
                            src={currentPreviewImage.secure_url}
                            alt={currentAltText || "Preview"}
                            width={300}
                            height={300}
                            className="rounded-md w-full h-48 object-contain bg-white"
                          />
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              Filename
                            </label>
                            <p className="text-sm text-gray-600 truncate">
                              {currentPreviewImage.original_filename}
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              Alt Text
                            </label>
                            <input
                              type="text"
                              value={currentAltText}
                              onChange={(e) =>
                                handleAltTextChange(currentPreviewImage.public_id, e.target.value)
                              }
                              placeholder="Enter alt text for this image..."
                              className="border border-gray-300 rounded-md p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              This alt text will be used for accessibility and SEO
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Quick navigation */}
                    {selectedImages.length > 1 && (
                      <div className="mt-3">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Quick Navigation
                        </label>
                        <div className="grid grid-cols-4 gap-2 max-h-24 overflow-y-auto">
                          {selectedImages.map((img, index) => (
                            <button
                              key={img.public_id}
                              onClick={() => setCurrentPreviewIndex(index)}
                              className={`relative border-2 rounded-md overflow-hidden ${
                                index === currentPreviewIndex ? "border-blue-500" : "border-gray-300"
                              }`}
                            >
                              <Image src={img.secure_url} alt="" width={60} height={60} className="w-full h-12 object-cover" />
                              {altTexts[img.public_id] && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[8px] p-0.5 text-center">
                                  Alt
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Upload Section
            <div
              className={`h-full flex items-center justify-center p-6 transition-colors ${
                isDragging ? "bg-blue-50" : "bg-gray-50"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="text-center max-w-md">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 transition-all ${
                    isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-300"
                  }`}
                >
                  <FiUpload className={`mx-auto size-12 mb-4 transition-colors ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {isDragging ? "Drop to upload" : "Drag & drop images here"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <label
                    htmlFor="cloudinary-upload"
                    className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      uploading ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    }`}
                  >
                    {uploading ? `Uploading... (${uploadProgress}%)` : "Select Files"}
                  </label>
                  <input
                    id="cloudinary-upload"
                    type="file"
                    multiple
                    accept="image/jpeg, image/png, image/webp, image/svg+xml"
                    onChange={handleInputChange}
                    disabled={uploading}
                    className="hidden"
                  />
                  <p className="mt-4 text-xs text-gray-500">Supports JPEG, PNG up to 10MB each</p>
                </div>

                {uploading && (
                  <div className="mt-6 w-full">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
};

export default AppGalleryModel;
