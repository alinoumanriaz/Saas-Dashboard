/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { FiUpload, FiImage, FiTrash2 } from "react-icons/fi";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

// shadcn/ui components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";

// ===================== Types =====================
export interface IImageData {
  url: string;
  alt: string;
}

interface CloudinaryImage {
  secure_url: string;
  public_id: string;
  original_filename: string;
}

interface WebsiteGalleryModelProps {
  onCancel: () => void;
  onSentSelected: (images: IImageData[]) => void;
  mode?: "single" | "multiple";
}

// ===================== Component =====================
const WebsiteGalleryModel = ({
  onCancel,
  onSentSelected,
  mode = "multiple",
}: WebsiteGalleryModelProps) => {
  // ------------------------------------------------------------
  // Read Cloudinary config from Redux
  // ------------------------------------------------------------
  const cloudinaryConfig = useAppSelector(
    (state) => state.companyCurrentWebsite.companyWebsite?.cloudinary
  );
  const {
    folderName = "dbManagementDashboard",   // fallback
    cloudinaryName = "dj5dbawzz",           // fallback
    cloudinaryNameApiKey,
    cloudinaryNameApiKeySecret,
  } = cloudinaryConfig || {};

  // These will be used throughout the component
  const FOLDER = folderName;
  const CLOUD_NAME = cloudinaryName;
  const CLOUDINARY_API_KEY = cloudinaryNameApiKey;
  const CLOUDINARY_API_SECRET = cloudinaryNameApiKeySecret;

  // ------------------------------------------------------------
  // State
  // ------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<"gallery" | "upload">("gallery");
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<CloudinaryImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasFetchedGallery, setHasFetchedGallery] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search / filtering
  const [searchQuery, setSearchQuery] = useState("");

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Alt text, preview & per-image loading state
  const [altTexts, setAltTexts] = useState<{ [key: string]: string }>({});
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);
  const [loadedThumbs, setLoadedThumbs] = useState<Set<string>>(new Set());

  // ------------------------------------------------------------
  // Fetch images (uses dynamic folder & cloud name)
  // ------------------------------------------------------------
  const fetchImages = useCallback(
    async (cursor: string | null = null) => {
      try {
        if (!cursor) {
          setLoading(true);
          setFetchError(null);
        }

        const params: Record<string, unknown> = {
          folder: FOLDER,
          cloudName: CLOUD_NAME,
          cloudinaryApiKey: CLOUDINARY_API_KEY,
          cloudinaryApiKeySecret: CLOUDINARY_API_SECRET,
          limit: 50,
        };
        if (cursor) params.next_cursor = cursor;

        const response = await axios.get("/api/cloudinary", { params });

        setImages((prev) =>
          cursor
            ? [...prev, ...(response.data.images || [])]
            : response.data.images || []
        );
        setNextCursor(response.data.next_cursor || null);
      } catch (err) {
        console.error(err);
        if (!cursor) {
          setFetchError(
            "We couldn't load your images. Check your connection and try again."
          );
        } else {
          toast.error("Failed to load more images.");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [FOLDER, CLOUD_NAME]
  );

  useEffect(() => {
    if (activeTab === "gallery" && !hasFetchedGallery) {
      setHasFetchedGallery(true);
      fetchImages();
    }
  }, [activeTab, hasFetchedGallery, fetchImages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (
      scrollTop + clientHeight >= scrollHeight - 50 &&
      nextCursor &&
      !loadingMore
    ) {
      setLoadingMore(true);
      fetchImages(nextCursor);
    }
  };

  // ------------------------------------------------------------
  // Upload files (uses dynamic cloud name)
  // ------------------------------------------------------------
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(
      (file) =>
        ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE
    );

    const skipped = fileArray.length - validFiles.length;
    if (skipped > 0) {
      toast.warning(
        `${skipped} file${skipped > 1 ? "s" : ""} skipped — only JPEG, PNG, WebP or SVG under 10MB are allowed.`
      );
    }
    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedImages: CloudinaryImage[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", FOLDER); // keep your preset
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
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          formData,
          {
            withCredentials: false,
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              const filePortion = 100 / validFiles.length;
              const percentOfFile = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || 1)
              );
              setUploadProgress(
                Math.round(i * filePortion + (percentOfFile * filePortion) / 100)
              );
            },
          }
        );

        uploadedImages.push(response.data);
      }

      setUploadProgress(100);
      setImages((prev) => [...uploadedImages, ...prev]);
      toast.success(
        `${uploadedImages.length} image${uploadedImages.length > 1 ? "s" : ""} uploaded successfully!`
      );
      setActiveTab("gallery");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFileUpload(e.target.files);
    e.target.value = "";
  };

  // ------------------------------------------------------------
  // Selection, deletion, alt text, preview navigation
  // ------------------------------------------------------------
  const handleImageSelect = (image: CloudinaryImage) => {
    if (mode === "single") {
      setSelectedImages((prev) =>
        prev.length > 0 && prev[0].secure_url === image.secure_url
          ? []
          : [image]
      );
      setCurrentPreviewIndex(0);
      return;
    }

    setSelectedImages((prev) => {
      const exists = prev.find((img) => img.secure_url === image.secure_url);
      const next = exists
        ? prev.filter((img) => img.secure_url !== image.secure_url)
        : [...prev, image];
      setCurrentPreviewIndex(Math.max(0, next.length - 1));
      return next;
    });
  };

  const handleConfirmSelection = () => {
    if (selectedImages.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    const imagesWithAlt: IImageData[] = selectedImages.map((img) => ({
      url: img.secure_url,
      alt: altTexts[img.public_id] || img.original_filename || "",
    }));

    onSentSelected(imagesWithAlt);
    onCancel();
  };

  const handleImageDelete = useCallback(async () => {
    if (selectedImages.length === 0) return;

    const public_ids = selectedImages.map((img) => img.public_id);
    setDeleteConfirmOpen(false);

    try {
      setUploading(true);
      await axios.delete("/api/cloudinary", {
        data: {
          public_ids,
          folder: FOLDER,
          cloudName: CLOUD_NAME,
          // (do NOT send apiKey/apiSecret from client – handled server-side)
        },
      });

      setImages((prev) =>
        prev.filter((img) => !public_ids.includes(img.public_id))
      );
      setSelectedImages([]);
      toast.success(
        `${public_ids.length} image${public_ids.length > 1 ? "s" : ""} deleted successfully!`
      );
    } catch (err) {
      console.error(err);
      toast.error("Delete failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [selectedImages, FOLDER, CLOUD_NAME]);

  const handleAltTextChange = (publicId: string, text: string) => {
    setAltTexts((prev) => ({ ...prev, [publicId]: text }));
  };

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

  const markThumbLoaded = (publicId: string) => {
    setLoadedThumbs((prev) => {
      if (prev.has(publicId)) return prev;
      const next = new Set(prev);
      next.add(publicId);
      return next;
    });
  };

  // ------------------------------------------------------------
  // Derived data
  // ------------------------------------------------------------
  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return images;
    const q = searchQuery.trim().toLowerCase();
    return images.filter((img) =>
      img.original_filename?.toLowerCase().includes(q)
    );
  }, [images, searchQuery]);

  const allFilteredSelected =
    filteredImages.length > 0 &&
    filteredImages.every((img) =>
      selectedImages.some((s) => s.secure_url === img.secure_url)
    );

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredUrls = new Set(filteredImages.map((i) => i.secure_url));
      setSelectedImages((prev) =>
        prev.filter((img) => !filteredUrls.has(img.secure_url))
      );
    } else {
      setSelectedImages((prev) => {
        const existingUrls = new Set(prev.map((i) => i.secure_url));
        const toAdd = filteredImages.filter(
          (img) => !existingUrls.has(img.secure_url)
        );
        return [...prev, ...toAdd];
      });
    }
  };

  const currentPreviewImage = selectedImages[currentPreviewIndex];
  const currentAltText = currentPreviewImage
    ? altTexts[currentPreviewImage.public_id] || ""
    : "";

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="w-[95vw] min-w-6xl! max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
        <DialogHeader className="px-4 sm:px-6 py-4 border-b border-border">
          <DialogTitle>Media Gallery</DialogTitle>
          <DialogDescription>
            {mode === "single" ? "Select a single image" : "Select one or more images"}
          </DialogDescription>
          {/* Display current Cloudinary config */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span>☁️ {CLOUD_NAME}</span>
            <span>📁 {FOLDER}</span>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "gallery" | "upload")}
          className="flex-1 flex flex-col overflow-hidden min-h-0"
        >
          <div className="px-4 sm:px-6 pt-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-border">
              <TabsList className="grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="upload" className="gap-2">
                  <FiUpload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="gallery" className="gap-2">
                  <FiImage className="h-4 w-4" />
                  Gallery
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2 ml-auto">
                {selectedImages.length > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {selectedImages.length} selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedImages([])}
                    >
                      Clear
                    </Button>
                    <AlertDialog
                      open={deleteConfirmOpen}
                      onOpenChange={setDeleteConfirmOpen}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={uploading}
                          className="gap-1.5"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete {selectedImages.length} image
                            {selectedImages.length > 1 ? "s" : ""}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action can&apos;t be undone. The selected image
                            {selectedImages.length > 1 ? "s" : ""} will be permanently
                            removed from the gallery.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleImageDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Gallery Tab */}
          <TabsContent
            value="gallery"
            className="flex-1 mt-3 overflow-hidden flex flex-col min-h-0"
          >
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              {/* Grid */}
              <div
                className={cn(
                  "overflow-hidden min-h-0",
                  selectedImages.length > 0
                    ? "flex-1 lg:w-[68%] lg:flex-none max-h-[45%] lg:max-h-none"
                    : "flex-1 w-full"
                )}
              >
                <ScrollArea
                  className="h-full px-4 sm:px-6 py-4"
                  onScrollCapture={handleScroll}
                >
                  {loading && images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 w-full h-64 text-muted-foreground">
                      <LoaderCircle className="size-6 animate-spin" />
                      <p className="text-sm">Loading images…</p>
                    </div>
                  ) : fetchError ? (
                    <div className="flex flex-col items-center justify-center gap-3 w-full h-64 text-center">
                      <p className="text-sm text-muted-foreground max-w-xs">{fetchError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchImages()}
                        className="gap-2"
                      >
                        <RefreshCw className="size-3.5" />
                        Retry
                      </Button>
                    </div>
                  ) : filteredImages.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-center px-4">
                      <FiImage className="size-10 mb-3 opacity-30" />
                      {searchQuery ? (
                        <>
                          <p className="text-sm">
                            No images match &quot;{searchQuery}&quot;
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setSearchQuery("")}
                          >
                            Clear search
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm">No images found</p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setActiveTab("upload")}
                          >
                            Upload some images
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 p-0.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {filteredImages.map((img) => {
                        const isSelected = selectedImages.some(
                          (s) => s.secure_url === img.secure_url
                        );
                        const isLoaded = loadedThumbs.has(img.public_id);

                        return (
                          <div
                            key={img.public_id}
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            aria-label={`${
                              isSelected ? "Deselect" : "Select"
                            } ${img.original_filename || "image"}`}
                            onClick={() => handleImageSelect(img)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleImageSelect(img);
                              }
                            }}
                            className={cn(
                              "group relative overflow-hidden rounded-lg border bg-card cursor-pointer transition-all",
                              "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              isSelected
                                ? "ring-1 ring-primary border-primary"
                                : "border-border"
                            )}
                          >
                            <div className="relative aspect-square bg-muted">
                              {!isLoaded && (
                                <div className="absolute inset-0 animate-pulse bg-muted" />
                              )}
                              <Image
                                src={img.secure_url}
                                alt={
                                  altTexts[img.public_id] ||
                                  img.original_filename ||
                                  "Gallery image"
                                }
                                fill
                                onLoad={() => markThumbLoaded(img.public_id)}
                                className={cn(
                                  "object-cover transition-opacity duration-200",
                                  isLoaded ? "opacity-100" : "opacity-0"
                                )}
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 18vw"
                              />

                              {/* Hover overlay with filename */}
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2 pt-6 pb-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                                <p className="truncate text-[11px] text-white">
                                  {img.original_filename}
                                </p>
                              </div>

                              {/* Selection indicator */}
                              <div
                                className={cn(
                                  "absolute top-2 left-2 flex size-5 items-center justify-center rounded-full border-2 transition-colors",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-white/80 bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100"
                                )}
                              >
                                {isSelected && (
                                  <Check className="size-3" strokeWidth={3} />
                                )}
                              </div>

                              {/* Alt text indicator */}
                              {altTexts[img.public_id] && (
                                <div className="absolute top-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                  ALT
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Preview panel */}
              {selectedImages.length > 0 && (
                <>
                  <Separator orientation="vertical" className="hidden lg:block" />
                  <Separator className="lg:hidden" />
                  <div className="flex flex-col lg:w-[32%] min-h-0 flex-1 lg:flex-none bg-muted/30">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <h3 className="text-sm font-semibold">
                        Preview{" "}
                        <span className="font-normal text-muted-foreground">
                          ({currentPreviewIndex + 1}/{selectedImages.length})
                        </span>
                      </h3>
                      {selectedImages.length > 1 && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label="Previous image"
                            onClick={() => navigatePreview("prev")}
                          >
                            <ChevronLeft className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label="Next image"
                            onClick={() => navigatePreview("next")}
                          >
                            <ChevronRight className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                      <div className="p-4">
                        {currentPreviewImage && (
                          <>
                            <div className="relative w-full aspect-square mb-4 bg-background rounded-md overflow-hidden border">
                              <Image
                                src={currentPreviewImage.secure_url}
                                alt={
                                  currentAltText ||
                                  currentPreviewImage.original_filename ||
                                  "Preview"
                                }
                                fill
                                className="object-contain"
                              />
                            </div>

                            <div className="mb-4">
                              <Label className="text-xs text-muted-foreground">
                                Filename
                              </Label>
                              <p
                                className="text-sm truncate font-medium"
                                title={currentPreviewImage.original_filename}
                              >
                                {currentPreviewImage.original_filename}
                              </p>
                            </div>

                            <div className="mb-4">
                              <Label
                                htmlFor={`alt-${currentPreviewImage.public_id}`}
                                className="text-sm font-medium"
                              >
                                Alt text
                              </Label>
                              <Input
                                id={`alt-${currentPreviewImage.public_id}`}
                                type="text"
                                value={currentAltText}
                                onChange={(e) =>
                                  handleAltTextChange(
                                    currentPreviewImage.public_id,
                                    e.target.value
                                  )
                                }
                                placeholder="Describe this image..."
                                className="mt-1"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Used for accessibility and SEO
                              </p>
                            </div>

                            {selectedImages.length > 1 && (
                              <div className="mt-2">
                                <Label className="text-xs font-medium mb-2 block">
                                  Quick navigation
                                </Label>
                                <div className="grid grid-cols-5 gap-1.5">
                                  {selectedImages.map((img, index) => (
                                    <button
                                      key={img.public_id}
                                      type="button"
                                      aria-label={`Preview ${
                                        img.original_filename || "image"
                                      }`}
                                      onClick={() =>
                                        setCurrentPreviewIndex(index)
                                      }
                                      className={cn(
                                        "relative rounded-md overflow-hidden border-2 transition-colors",
                                        index === currentPreviewIndex
                                          ? "border-primary"
                                          : "border-transparent hover:border-muted-foreground/50"
                                      )}
                                    >
                                      <div className="relative aspect-square">
                                        <Image
                                          src={img.secure_url}
                                          alt=""
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1 mt-3 p-4 sm:p-6 overflow-hidden">
            {/* Show config info */}
            <div className="text-sm text-muted-foreground mb-4 text-center">
              <p>
                Uploading to <span className="font-mono font-medium">{CLOUD_NAME}</span>
                {' / '}
                <span className="font-mono font-medium">{FOLDER}</span>
              </p>
            </div>

            <div
              className={cn(
                "h-full flex items-center justify-center transition-colors rounded-lg border-2 border-dashed p-8",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
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
                    "mx-auto size-10 mb-4 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <h3 className="text-base font-medium text-foreground mb-1">
                  {isDragging ? "Drop to upload" : "Drag & drop images here"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">or</p>

                <Button asChild disabled={uploading} className="relative">
                  <label htmlFor="cloudinary-upload-modal" className="cursor-pointer">
                    {uploading ? (
                      <>
                        <LoaderCircle className="mr-2 size-4 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      "Select files"
                    )}
                  </label>
                </Button>
                <input
                  id="cloudinary-upload-modal"
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES.join(",")}
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

        {/* Footer */}
        <DialogFooter className="px-4 sm:px-6 py-4 border-t border-border gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirmSelection} disabled={selectedImages.length === 0}>
            {mode === "single" ? "Select image" : "Select images"}
            {selectedImages.length > 0 && ` (${selectedImages.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WebsiteGalleryModel;

// These constants remain unchanged
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;