"use client";
import { ChangeEvent, useState, useCallback, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { TiTick } from "react-icons/ti";
import { FiUpload, FiImage, FiTrash2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import LoaderSpin from "@/components/LoaderSpin";
import Container from "@/components/Container";

interface CloudinaryImage {
  secure_url: string;
  public_id: string;
  original_filename: string;
}

const FOLDER = "uniquecustomboxesmedia";

const Page = () => {
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

  // Fetch images
  const fetchImages = useCallback(async (cursor: string | null = null) => {
    try {
      if (!cursor) setLoading(true);

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
  }, []);

  // Initial fetch
  useEffect(() => {
    if (activeTab === "gallery") fetchImages();
  }, [activeTab, fetchImages]);

  // Infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 50 && nextCursor && !loadingMore) {
      setLoadingMore(true);
      fetchImages(nextCursor);
    }
  };

  // Upload files
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
        formData.append("upload_preset", "uniquecustomboxes");
        formData.append("folder", FOLDER);

        const baseName = file.name.replace(/\.[^/.]+$/, "").trim().replace(/\s+/g, "-");
        formData.append("public_id", baseName);

        const response = await axios.post(
          "https://api.cloudinary.com/v1_1/dvu49dsgg/image/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || 1)
              );
              setUploadProgress(percentCompleted);
            },
          }
        );

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

  const handleImageSelect = (image: CloudinaryImage) => {
    setSelectedImages((prev) =>
      prev.find((img) => img.secure_url === image.secure_url)
        ? prev.filter((img) => img.secure_url !== image.secure_url)
        : [...prev, image]
    );
  };

  const handleImageDelete = useCallback(async () => {
    if (selectedImages.length === 0) return;

    try {
      setUploading(true);
      const public_ids = selectedImages.map((img) => img.public_id);

      await axios.delete("/api/cloudinary", {
        data: { public_ids, folder: FOLDER },
      });

      setImages((prev) => prev.filter((img) => !public_ids.includes(img.public_id)));
      setSelectedImages([]);
      setSuccess(`${public_ids.length} images deleted successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setError("Delete failed.");
    } finally {
      setUploading(false);
    }
  }, [selectedImages]);

  return (
    <Container className="overflow-hidden">
      <div className="bg-white rounded-md w-full h-[calc(100dvh-80px)] relative overflow-hidden ring-1 ring-gray-300 my-1">
        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute z-50 top-16 left-0 right-0 flex justify-center"
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
              className="absolute z-50 top-16 left-0 right-0 flex justify-center"
            >
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-md text-sm">
                {success}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex justify-between items-center border-b border-gray-200">
          <div className="flex justify-center items-center">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "upload"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiUpload className="mr-2" /> Upload
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "gallery"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiImage className="mr-2" /> Gallery
            </button>
          </div>

          {selectedImages.length > 0 && (
            <div className="flex justify-end bg-blue-50 mr-4">
              <button
                onClick={handleImageDelete}
                disabled={uploading}
                className={`flex items-center px-4 py-1.5 ring-1 ring-red-200 bg-red-100 text-red-700 rounded-md hover:bg-red-200 ${
                  uploading ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {uploading ? (
                  <span>Loading...</span>
                ) : (
                  <>
                    <FiTrash2 className="mr-2" /> Delete ({selectedImages.length})
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Gallery / Upload */}
        <div className="h-[calc(100%-50px)] overflow-hidden">
          {activeTab === "gallery" ? (
            <div className="h-full overflow-y-auto p-4" onScroll={handleScroll}>
              {loading && images.length === 0 ? (
                <div className="flex justify-center items-center w-full h-full">
                  <LoaderSpin color="text-blue-500" />
                </div>
              ) : images.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <FiImage className="size-12 mb-4 opacity-50" />
                  <p className="text-lg">No images found</p>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="mt-4 text-blue-600 hover:text-blue-800"
                  >
                    Upload some images
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {images.map((img, index) => (
                    <div key={`${img.public_id}-${index}`} className="rounded shadow-md relative">
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
                          alt="gallery"
                          width={300}
                          height={300}
                          loading="lazy"
                          className="w-full h-48 object-cover rounded"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {loadingMore && (
                <div className="text-center mt-4 text-gray-500">Loading more images...</div>
              )}
            </div>
          ) : (
            // Upload tab
            <UploadTab
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              uploading={uploading}
              uploadProgress={uploadProgress}
              handleFileUpload={handleFileUpload}
              handleInputChange={handleInputChange}
            />
          )}
        </div>
      </div>
    </Container>
  );
};

// Separate component for upload UI
const UploadTab = ({
  isDragging,
  setIsDragging,
  uploading,
  uploadProgress,
  handleFileUpload,
  handleInputChange,
}: any) => (
  <div
    className={`h-full flex items-center justify-center p-6 transition-colors ${
      isDragging ? "bg-blue-50" : "bg-gray-50"
    }`}
    onDragEnter={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    }}
    onDragLeave={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }}
    onDragOver={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
    onDrop={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
    }}
  >
    <div className="text-center max-w-md">
      <div
        className={`border-2 border-dashed rounded-xl p-8 transition-all ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-300"
        }`}
      >
        <FiUpload
          className={`mx-auto size-12 mb-4 transition-colors ${
            isDragging ? "text-blue-500" : "text-gray-400"
          }`}
        />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          {isDragging ? "Drop to upload" : "Drag & drop images here"}
        </h3>
        <p className="text-sm text-gray-500 mb-4">or</p>
        <label
          htmlFor="cloudinary-upload"
          className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            uploading
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
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
        <p className="mt-4 text-xs text-gray-500">
          Supports JPEG, PNG up to 10MB each
        </p>
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
);

export default Page;
