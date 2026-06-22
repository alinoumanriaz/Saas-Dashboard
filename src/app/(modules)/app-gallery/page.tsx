/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { ChangeEvent, useState, useCallback, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { FiUpload, FiImage, FiTrash2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Container from "@/components/Container";

// shadcn/ui components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

interface CloudinaryImage {
  secure_url: string;
  public_id: string;
  original_filename: string;
}

const FOLDER = "dbManagementDashboard";

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
  const [hasFetchedGallery, setHasFetchedGallery] = useState(false);

  // Fetch images
  const fetchImages = useCallback(async (cursor: string | null = null) => {
    try {
      if (!cursor) setLoading(true);

      const params: any = { folder: FOLDER, limit: 50 };
      if (cursor) params.next_cursor = cursor;

      const response = await axios.get("/api/cloudinary", { params });

      setImages((prev) =>
        cursor ? [...prev, ...(response.data.images || [])] : response.data.images || []
      );
      setNextCursor(response.data.next_cursor || null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch images.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "gallery" && !hasFetchedGallery) {
      setHasFetchedGallery(true);
      fetchImages();
    }
  }, [activeTab, hasFetchedGallery, fetchImages]);

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
        formData.append("upload_preset", "dbManagementDashboard");
        formData.append("folder", FOLDER);

        const baseName = file.name
          .replace(/\.[^/.]+$/, "")
          .trim()
          .replace(/\s+/g, "-");

        const uniqueFileName = `${baseName}-${Math.random()
          .toString(36)
          .substring(2, 8)}`;

        formData.append("public_id", uniqueFileName);

        const response = await axios.post(
          "https://api.cloudinary.com/v1_1/dj5dbawzz/image/upload",
          formData,
          {
            withCredentials: false,
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
      toast.success(`${uploadedImages.length} images uploaded successfully!`, { position: "top-center" })
      // setSuccess(`${uploadedImages.length} images uploaded successfully!`);
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
    <Container className="overflow-hidden px-4 py-0.5 h-full">
      <Card className="w-full h-[calc(100dvh-80px)] relative overflow-hidden border-border shadow-sm">
        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute z-50 top-16 left-0 right-0 flex justify-center px-4"
            >
              <Alert variant="destructive" className="max-w-md shadow-lg">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute z-50 top-16 left-0 right-0 flex justify-center px-4"
            >
              <Alert className="max-w-md shadow-lg border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
                <AlertTitle className="text-green-800 dark:text-green-300">Success</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                  {success}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "gallery" | "upload")}
          className="h-full flex flex-col"
        >
          <div className="flex items-center justify-between border-b border-border px-4">

            <TabsList className="grid grid-cols-2 pb-10! mb-4 bg-muted">
              <TabsTrigger value="upload" className="flex items-center py-2! px-4! gap-2">
                <FiUpload className="mr-2 h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center py-2! px-4! gap-2">
                <FiImage className="mr-2 h-4 w-4" />
                Gallery
              </TabsTrigger>
            </TabsList>

            {selectedImages.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleImageDelete}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                <FiTrash2 className="h-4 w-4" />
                Delete ({selectedImages.length})
              </Button>
            )}
          </div>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="flex-1 mt-0 p-4 overflow-hidden">
            <ScrollArea className="h-full pr-4" onScrollCapture={handleScroll}>
              {loading && images.length === 0 ? (
                <div className="flex justify-center items-center w-full h-full">
                  <LoaderCircle className={`animate-spin`} />
                </div>
              ) : images.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <FiImage className="size-12 mb-4 opacity-30" />
                  <p className="text-lg">No images found</p>
                  <Button
                    variant="link"
                    onClick={() => setActiveTab("upload")}
                    className="mt-2"
                  >
                    Upload some images
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-1">
                  {images.map((img, index) => (
                    <Card
                      key={`${img.public_id}-${index}`}
                      className={cn(
                        "relative overflow-hidden group cursor-pointer transition-all hover:shadow-md",
                        selectedImages.some((s) => s.secure_url === img.secure_url) &&
                        "ring-2 ring-blue-600"
                      )}
                      onClick={() => handleImageSelect(img)}
                    >
                      <CardContent className="p-0">
                        <div className="relative aspect-square">
                          <Image
                            src={img.secure_url}
                            alt={img.original_filename || "gallery image"}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                          />
                          <div className="absolute top-2 left-2">
                            <Checkbox
                              checked={selectedImages.some(
                                (s) => s.secure_url === img.secure_url
                              )}
                              onCheckedChange={() => { }}
                              className="bg-background/80 backdrop-blur-sm "
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {loadingMore && (
                <div className="flex justify-center py-4">
                  <LoaderCircle className={`animate-spin`} />
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1 mt-0 p-4 overflow-hidden">
            <div
              className={cn(
                "h-full flex items-center justify-center transition-colors rounded-lg border-2 border-dashed p-8",
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
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
                <FiUpload
                  className={cn(
                    "mx-auto size-12 mb-4 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  {isDragging ? "Drop to upload" : "Drag & drop images here"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">or</p>
                <Button
                  onClick={() => document.getElementById("cloudinary-upload")?.click()}
                  disabled={uploading}
                  className="relative"
                >
                  {uploading ? (
                    <>
                      <LoaderCircle className={`animate-spin`} />
                      Uploading...
                    </>
                  ) : (
                    "Select Files"
                  )}
                </Button>
                <input
                  id="cloudinary-upload"
                  type="file"
                  multiple
                  accept="image/jpeg, image/png, image/webp, image/svg+xml"
                  onChange={handleInputChange}
                  disabled={uploading}
                  className="hidden"
                />
                <p className="mt-4 text-xs text-muted-foreground">
                  Supports JPEG, PNG, WebP, SVG up to 10MB each
                </p>

                {uploading && (
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </Container>
  );
};

export default Page;