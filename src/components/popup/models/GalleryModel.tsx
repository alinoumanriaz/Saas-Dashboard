"use client";
import React, { ChangeEvent, useState, useCallback, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Send,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Check,
  FileImage,
  AlertCircle,
} from "lucide-react";

// shadcn/ui imports
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
const FOLDER = "uniquecustomboxesmedia";

const GalleryModel = ({ onCancel, onSentSelected, mode }: IProps) => {
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
  const [altTexts, setAltTexts] = useState<{ [key: string]: string }>({});

  // Fetch images with pagination
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
          onUploadProgress: (progressEvent: any) => {
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
  const handleImageSelect = (image: CloudinaryImage, checked: boolean) => {
    if (mode === "array") {
      if (checked) {
        setSelectedImages((prev) => [...prev, image]);
      } else {
        setSelectedImages((prev) =>
          prev.filter((img) => img.secure_url !== image.secure_url)
        );
      }
    } else {
      if (checked) {
        setSelectedImages([image]);
      } else {
        setSelectedImages([]);
      }
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
    onCancel();
  };

  const handleAltTextChange = (publicId: string, text: string) => {
    setAltTexts((prev) => ({ ...prev, [publicId]: text }));
  };

  const isSelected = (image: CloudinaryImage) => {
    return selectedImages.some((selected) => selected.secure_url === image.secure_url);
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Image Gallery
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Status Messages */}
        <AnimatePresence>
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-0 right-0 flex justify-center z-10 px-6"
            >
              {error && (
                <Alert variant="destructive" className="max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="max-w-md bg-green-50 border-green-200 text-green-800">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "gallery" | "upload")}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex justify-between items-center px-6 border-b">
            <TabsList className="h-auto p-0 bg-transparent gap-1">
              <TabsTrigger
                value="upload"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-4 py-2"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger
                value="gallery"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-4 py-2"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Gallery
              </TabsTrigger>
            </TabsList>

            {selectedImages.length > 0 && (
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleImageDelete}
                        disabled={uploading}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete ({selectedImages.length})
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete selected images</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" onClick={handleSendImages}>
                        <Send className="w-4 h-4 mr-2" />
                        Send ({selectedImages.length})
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send selected images</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="flex-1 overflow-hidden m-0">
            <div className="flex h-full">
              {/* Images Grid */}
              <div
                className={`${
                  selectedImages.length > 0 ? "w-[70%]" : "w-full"
                } overflow-hidden`}
              >
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {loading ? (
                        <div className="col-span-full flex justify-center items-center h-64">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                      ) : images.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                          <Card>
                            <CardContent className="pt-12 pb-8">
                              <FileImage className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                              <p className="text-muted-foreground">No images found</p>
                              <Button
                                variant="link"
                                onClick={() => setActiveTab("upload")}
                                className="mt-2"
                              >
                                Upload some images
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        images.map((img, index) => (
                          <Card
                            key={`${img.public_id}-${index}`}
                            className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                          >
                            <CardContent className="p-0">
                              <div className="relative aspect-square">
                                <Image
                                  src={img.secure_url}
                                  alt={altTexts[img.public_id] || img.original_filename}
                                  fill
                                  className="object-cover"
                                />
                                <div
                                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() =>
                                    handleImageSelect(img, !isSelected(img))
                                  }
                                />
                                <div className="absolute top-2 left-2">
                                  <Checkbox
                                    checked={isSelected(img)}
                                    onCheckedChange={(checked) =>
                                      handleImageSelect(img, checked as boolean)
                                    }
                                    className="bg-white"
                                  />
                                </div>
                                {altTexts[img.public_id] && (
                                  <Badge
                                    variant="secondary"
                                    className="absolute bottom-2 left-2 text-xs"
                                  >
                                    Alt
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>

                    {loadingMore && (
                      <div className="text-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Loading more...
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Preview Panel */}
              {selectedImages.length > 0 && (
                <div className="w-[30%] border-l bg-muted/30 flex flex-col">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Preview ({selectedImages.length})
                    </h3>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                      <Carousel className="w-full">
                        <CarouselContent>
                          {selectedImages.map((img, idx) => (
                            <CarouselItem key={img.public_id}>
                              <Card>
                                <CardContent className="p-4">
                                  <div className="relative aspect-video mb-4">
                                    <Image
                                      src={img.secure_url}
                                      alt={altTexts[img.public_id] || "Preview"}
                                      fill
                                      className="object-contain rounded-md"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">
                                        Filename
                                      </Label>
                                      <p className="text-sm font-mono truncate">
                                        {img.original_filename}
                                      </p>
                                    </div>
                                    <div>
                                      <Label htmlFor={`alt-${img.public_id}`}>
                                        Alt Text
                                      </Label>
                                      <Input
                                        id={`alt-${img.public_id}`}
                                        value={altTexts[img.public_id] || ""}
                                        onChange={(e) =>
                                          handleAltTextChange(img.public_id, e.target.value)
                                        }
                                        placeholder="Enter alt text for accessibility..."
                                        className="mt-1"
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Improves accessibility and SEO
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {selectedImages.length > 1 && (
                          <>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2" />
                          </>
                        )}
                      </Carousel>

                      {/* Thumbnail Navigation */}
                      {selectedImages.length > 1 && (
                        <div>
                          <Label className="text-sm mb-2 block">Quick Navigation</Label>
                          <div className="grid grid-cols-4 gap-2">
                            {selectedImages.map((img, idx) => (
                              <button
                                key={img.public_id}
                                onClick={() => {
                                  const carousel = document.querySelector(
                                    "[data-carousel]"
                                  ) as any;
                                  if (carousel?.scrollTo) {
                                    carousel.scrollTo(idx);
                                  }
                                }}
                                className="relative aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors"
                              >
                                <Image
                                  src={img.secure_url}
                                  alt=""
                                  fill
                                  className="object-cover"
                                />
                                {altTexts[img.public_id] && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] p-0.5 text-center">
                                    Alt
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1 m-0">
            <div
              className={`h-full flex items-center justify-center p-6 transition-colors ${
                isDragging ? "bg-blue-50" : "bg-muted/30"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Card className="max-w-md w-full">
                <CardContent className="pt-8 pb-6">
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      isDragging
                        ? "border-blue-500 bg-blue-50"
                        : "border-border hover:border-blue-300"
                    }`}
                  >
                    <Upload
                      className={`mx-auto w-12 h-12 mb-4 transition-colors ${
                        isDragging ? "text-blue-500" : "text-muted-foreground"
                      }`}
                    />
                    <h3 className="text-lg font-medium mb-1">
                      {isDragging ? "Drop to upload" : "Drag & drop images here"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">or</p>
                    <div className="relative">
                      <Button
                        variant="default"
                        disabled={uploading}
                        className="relative"
                        onClick={() =>
                          document.getElementById("cloudinary-upload")?.click()
                        }
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading... ({uploadProgress}%)
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Select Files
                          </>
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
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Supports JPEG, PNG, WebP, SVG up to 10MB each
                    </p>
                  </div>

                  {uploading && (
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryModel;