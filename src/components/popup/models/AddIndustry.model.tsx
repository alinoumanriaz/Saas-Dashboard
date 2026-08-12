/* eslint-disable react-hooks/set-state-in-effect */
import { ChangeEvent, useEffect, useState, useMemo } from "react";
import { useMutation, useLazyQuery } from "@apollo/client/react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import dynamic from "next/dynamic";
import Image from "next/image";
import { FiX } from "react-icons/fi";
import { toast } from "sonner";

// shadcn/ui components
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Custom components – now using DynamicFormPopup
// import { DynamicFormPopup, TabConfig } from "@/components/DynamicFormPopup";
import WebsiteGalleryModel from "./WebsiteGallery.model";
// Helpers & GraphQL
import { generateSlug } from "@/helpers/slug-maker";
import { removeTypename } from "@/helpers/removetypename";
import {
  CHECK_INDUSTRY_H1_TAG_UNIQUE,
  CHECK_INDUSTRY_META_TITLE_UNIQUE,
  CHECK_INDUSTRY_SLUG_UNIQUE,
  CREATE_INDUSTRY,
  UPDATE_INDUSTRY,
} from "@/graphql/current-website-queries/industry.query";
import { DynamicFormPopup, TabConfig} from "@/components/TabbedForm";

// Rich Text Editor (dynamic import)
const TiptopEditor = dynamic(() => import("../../TiptopTextEditor"), { ssr: false });

// ---------- Types ----------
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

// Zod schema for the form
const industrySchema = z.object({
  name: z.string().min(1, "Industry name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    }),
  h1Tag: z.string().min(1, "H1 Tag is required"),
  metaTitle: z.string().min(1, "Meta Title is required"),
  metaDescription: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
});

type FormValues = z.infer<typeof industrySchema>;

// Helper functions for image conversion
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

// ---------- Subcomponent: Image Upload Card ----------
const ImageUploadCard = ({
  label,
  imageUrl,
  hasAlt,
  onOpenGallery,
  onRemove,
}: {
  label: string;
  imageUrl: string;
  hasAlt: boolean;
  onOpenGallery: () => void;
  onRemove: () => void;
}) => {
  return (
    <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="group relative">
        <div
          onClick={onOpenGallery}
          className="relative cursor-pointer w-full aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          role="button"
          tabIndex={0}
          onKeyUp={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpenGallery();
          }}
        >
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt="Industry image"
                fill
                className="rounded-lg object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity rounded-lg">
                <span className="text-xs text-white font-medium">Change</span>
              </div>
            </>
          ) : (
            <div className="text-center p-4">
              <svg
                className="mx-auto h-8 w-8 text-gray-400"
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
              <p className="text-xs text-gray-500">Click to upload</p>
            </div>
          )}
        </div>
        {hasAlt && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Alt Text
          </div>
        )}
        {imageUrl && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
            aria-label="Remove image"
          >
            <FiX className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
};

// ---------- Tab Components ----------

// 1. Basic Tab
interface BasicTabProps {
  isEditMode: boolean;
  slugCheck: string;
  checkingSlug: boolean;
  checkSlugUnique: (slug: string) => void;
}

const BasicTab = ({ isEditMode, slugCheck, checkingSlug, checkSlugUnique }: BasicTabProps) => {
  const { control, setValue, formState: { errors } } = useFormContext<FormValues>();
  const name = useWatch({ control, name: "name" });
  const slug = useWatch({ control, name: "slug" });
  const [isSlugManual, setIsSlugManual] = useState(isEditMode);

  // Auto-generate slug from name (only when not manually edited)
  useEffect(() => {
    if (!isSlugManual && name) {
      const newSlug = generateSlug(name);
      setValue("slug", newSlug, { shouldValidate: true, shouldDirty: true });
    }
  }, [name, isSlugManual, setValue]);

  // Auto-fill h1Tag and metaTitle from name (only if empty)
  const h1Tag = useWatch({ control, name: "h1Tag" });
  const metaTitle = useWatch({ control, name: "metaTitle" });
  useEffect(() => {
    if (!h1Tag && name) setValue("h1Tag", name, { shouldValidate: true });
    if (!metaTitle && name) setValue("metaTitle", name, { shouldValidate: true });
  }, [name, h1Tag, metaTitle, setValue]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-auto">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Industry Name *
        </label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input placeholder="Enter industry name" {...field} />}
        />
        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Slug *
        </label>
        <div className="flex gap-2">
          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="industry-slug"
                {...field}
                onFocus={() => setIsSlugManual(true)}
                onBlur={() => {
                  if (field.value === generateSlug(name)) {
                    setIsSlugManual(false);
                  }
                }}
              />
            )}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => checkSlugUnique(slug)}
            disabled={checkingSlug || !slug?.trim()}
          >
            {checkingSlug ? "Checking..." : "Check"}
          </Button>
        </div>
        {slugCheck && (
          <p className={`text-sm ${slugCheck.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
            {slugCheck}
          </p>
        )}
        {errors.slug && <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>}
      </div>

      {/* Description */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <div className="border rounded-md">
              <TiptopEditor
                height="h-30"
                initialValue={field.value}
                onChange={(content: string) => field.onChange(content)}
              />
            </div>
          )}
        />
        {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
      </div>
    </div>
  );
};

// 2. Meta Tab
interface MetaTabProps {
  h1TagCheck: string;
  checkingH1Tag: boolean;
  metaTitleCheck: string;
  checkingMetaTitle: boolean;
  checkH1TagUnique: (h1Tag: string) => void;
  checkMetaTitleUnique: (metaTitle: string) => void;
}

const MetaTab = ({
  h1TagCheck,
  checkingH1Tag,
  metaTitleCheck,
  checkingMetaTitle,
  checkH1TagUnique,
  checkMetaTitleUnique,
}: MetaTabProps) => {
  const { control, formState: { errors } } = useFormContext<FormValues>();
  const h1Tag = useWatch({ control, name: "h1Tag" });
  const metaTitle = useWatch({ control, name: "metaTitle" });
  const metaDescription = useWatch({ control, name: "metaDescription" });

  return (
    <Card>
      <CardContent className="space-y-4 pt-4 max-h-96 overflow-auto">
        {/* H1 Tag */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            H1 Tag *
          </label>
          <div className="flex gap-2">
            <Controller
              name="h1Tag"
              control={control}
              render={({ field }) => (
                <Input placeholder="e.g., Web Development Services" {...field} />
              )}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => checkH1TagUnique(h1Tag)}
              disabled={checkingH1Tag || !h1Tag?.trim()}
            >
              {checkingH1Tag ? "Checking..." : "Check"}
            </Button>
          </div>
          {h1TagCheck && (
            <p className={`text-sm ${h1TagCheck.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
              {h1TagCheck}
            </p>
          )}
          {errors.h1Tag && <p className="text-sm text-red-600 mt-1">{errors.h1Tag.message}</p>}
        </div>

        {/* Meta Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Title *
          </label>
          <div className="flex gap-2">
            <Controller
              name="metaTitle"
              control={control}
              render={({ field }) => (
                <Input placeholder="e.g., Professional Web Development Services | Company" {...field} />
              )}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => checkMetaTitleUnique(metaTitle)}
              disabled={checkingMetaTitle || !metaTitle?.trim()}
            >
              {checkingMetaTitle ? "Checking..." : "Check"}
            </Button>
          </div>
          {metaTitleCheck && (
            <p className={`text-sm ${metaTitleCheck.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
              {metaTitleCheck}
            </p>
          )}
          {errors.metaTitle && <p className="text-sm text-red-600 mt-1">{errors.metaTitle.message}</p>}
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description
          </label>
          <Controller
            name="metaDescription"
            control={control}
            render={({ field }) => (
              <Textarea
                placeholder="Description for search engines (150-160 chars)"
                rows={3}
                {...field}
              />
            )}
          />
          <div className="flex justify-between mt-1">
            <span className="text-sm text-gray-500">
              Recommended: 150-160 characters
            </span>
            <span
              className={`text-sm ${(metaDescription?.length || 0) > 160
                ? "text-red-500"
                : (metaDescription?.length || 0) > 150
                  ? "text-yellow-500"
                  : "text-green-500"
                }`}
            >
              {metaDescription?.length || 0}/160
            </span>
          </div>
          {errors.metaDescription && <p className="text-sm text-red-600 mt-1">{errors.metaDescription.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

// 3. Content Tab
const ContentTab = () => {
  const { control } = useFormContext<FormValues>();
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Detailed Content
      </label>
      <Controller
        name="content"
        control={control}
        render={({ field }) => (
          <div className="border rounded-md">
            <TiptopEditor
              height="h-75"
              initialValue={field.value}
              onChange={(content: string) => field.onChange(content)}
            />
          </div>
        )}
      />
    </div>
  );
};

// 4. Images Tab (unchanged)
interface ImagesTabProps {
  imageUrl: ImageItem[];
  bannerImage: ImageItem | null;
  iconImageUrl: ImageItem | null;
  getImageUrl: (mode: "imageUrl" | "bannerImage" | "iconImageUrl") => string;
  hasCustomAltText: (mode: "imageUrl" | "bannerImage" | "iconImageUrl") => boolean;
  openGallery: (mode: "imageUrl" | "bannerImage" | "iconImageUrl") => void;
  removeImage: (mode: "imageUrl" | "bannerImage" | "iconImageUrl") => void;
}

const ImagesTab = ({
  imageUrl,
  bannerImage,
  iconImageUrl,
  getImageUrl,
  hasCustomAltText,
  openGallery,
  removeImage,
}: ImagesTabProps) => {
  return (
    <div className="space-y-4 max-h-96 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ImageUploadCard
          label="Profile Image (Gallery)"
          imageUrl={getImageUrl("imageUrl")}
          hasAlt={hasCustomAltText("imageUrl")}
          onOpenGallery={() => openGallery("imageUrl")}
          onRemove={() => removeImage("imageUrl")}
        />
        <ImageUploadCard
          label="Banner Image"
          imageUrl={getImageUrl("bannerImage")}
          hasAlt={hasCustomAltText("bannerImage")}
          onOpenGallery={() => openGallery("bannerImage")}
          onRemove={() => removeImage("bannerImage")}
        />
        <ImageUploadCard
          label="Icon Image"
          imageUrl={getImageUrl("iconImageUrl")}
          hasAlt={hasCustomAltText("iconImageUrl")}
          onOpenGallery={() => openGallery("iconImageUrl")}
          onRemove={() => removeImage("iconImageUrl")}
        />
      </div>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Image Guidelines
        </h3>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• Profile Image: Square (1:1) – supports multiple images (UI shows first)</li>
          <li>• Banner Image: Wide (3:1) recommended</li>
          <li>• Icon Image: Simple, recognizable (SVG preferred)</li>
          <li>• Supported formats: JPG, PNG, SVG, WebP</li>
          <li>• Click to add/change, click × to remove</li>
        </ul>
      </div>
    </div>
  );
};

// 5. FAQs Tab (unchanged but with a small bug fix)
interface FaqsTabProps {
  faqs: FAQItem[];
  currentFaq: FAQItem;
  editingFaqIndex: number | null;
  handleFaqChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  addOrUpdateFaq: () => void;
  editFaq: (index: number) => void;
  deleteFaq: (index: number) => void;
  cancelEditFaq: () => void;
}

const FaqsTab = ({
  faqs,
  currentFaq,
  editingFaqIndex,
  handleFaqChange,
  addOrUpdateFaq,
  editFaq,
  deleteFaq,
  cancelEditFaq,
}: FaqsTabProps) => {
  return (
    <div className="space-y-6 max-h-96 overflow-auto">
      <Card>
        <CardContent className="space-y-3 pt-4">
          <h3 className="text-sm font-medium">
            {editingFaqIndex !== null ? "Edit FAQ" : "Add New FAQ"}
          </h3>
          <Input
            name="question"
            value={currentFaq.question}
            onChange={handleFaqChange}
            placeholder="Question *"
          />
          <Textarea
            name="answer"
            value={currentFaq.answer}
            onChange={handleFaqChange}
            placeholder="Answer *"
            rows={3}
          />
          <div className="flex gap-2">
            <Button type="button" onClick={addOrUpdateFaq}>
              {editingFaqIndex !== null ? "Update FAQ" : "Add FAQ"}
            </Button>
            {editingFaqIndex !== null && (
              <Button type="button" variant="outline" onClick={cancelEditFaq}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-medium mb-3">FAQs ({faqs.length})</h3>
        {faqs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border">
            <p>No FAQs added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="flex justify-between items-start pt-4">
                  <div>
                    <h4 className="font-medium">{faq.question}</h4>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => editFaq(index)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => deleteFaq(index)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Main Component ----------
interface AddIndustryProps {
  onCancel: () => void;
  selectedData?: any;
  isEditMode?: boolean;
  refetch?: () => void;
}

const AddIndustry = ({
  onCancel,
  selectedData,
  isEditMode = false,
  refetch,
}: AddIndustryProps) => {
  // ---------- Local state for images ----------
  const [imageUrl, setImageUrl] = useState<ImageItem[]>(
    toImageArray(selectedData?.imageUrl)
  );
  const [bannerImage, setBannerImage] = useState<ImageItem | null>(
    toSingleImage(selectedData?.bannerImage)
  );
  const [iconImageUrl, setIconImageUrl] = useState<ImageItem | null>(
    toSingleImage(selectedData?.iconImageUrl || selectedData?.iconName)
  );

  // ---------- Local state for FAQs ----------
  const [faqs, setFaqs] = useState<FAQItem[]>(selectedData?.faqs || []);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [currentFaq, setCurrentFaq] = useState<FAQItem>({
    question: "",
    answer: "",
    order: 0,
  });

  // ---------- Gallery modal state ----------
  const [showGalleryOpen, setShowGalleryOpen] = useState(false);
  const [galleryMode, setGalleryMode] = useState<
    "imageUrl" | "bannerImage" | "iconImageUrl"
  >("imageUrl");

  // ---------- Unique check states ----------
  const [slugCheck, setSlugCheck] = useState("");
  const [h1TagCheck, setH1TagCheck] = useState("");
  const [metaTitleCheck, setMetaTitleCheck] = useState("");

  // ---------- GraphQL queries for uniqueness ----------
  const [checkSlug, { loading: checkingSlug, data: slugData, error: slugError }] =
    useLazyQuery<any>(CHECK_INDUSTRY_SLUG_UNIQUE);
  const [checkH1Tag, { loading: checkingH1Tag, data: h1TagData, error: h1TagError }] =
    useLazyQuery<any>(CHECK_INDUSTRY_H1_TAG_UNIQUE);
  const [checkMetaTitle, { loading: checkingMetaTitle, data: metaTitleData, error: metaTitleError }] =
    useLazyQuery<any>(CHECK_INDUSTRY_META_TITLE_UNIQUE);

  // Update check feedback when data arrives
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

  // ---------- Mutations ----------
  const [createIndustry, { loading: createLoading }] = useMutation<any>(CREATE_INDUSTRY);
  const [updateIndustry, { loading: updateLoading }] = useMutation<any>(UPDATE_INDUSTRY);
  const isSubmitting = createLoading || updateLoading;

  // ---------- Default values for the form ----------
  const defaultValues = useMemo<FormValues>(
    () => ({
      name: selectedData?.name || "",
      slug: selectedData?.slug || "",
      h1Tag: selectedData?.h1Tag || "",
      metaTitle: selectedData?.metaTitle || "",
      metaDescription: selectedData?.metaDescription || "",
      description: selectedData?.description || "",
      content: selectedData?.content || "",
    }),
    [selectedData]
  );

  // ---------- Handlers for unique checks ----------
  const checkSlugUnique = (slug: string) => {
    if (!slug?.trim()) {
      toast.error("Please enter a slug first");
      return;
    }
    checkSlug({
      variables: {
        slug,
        excludeId: isEditMode ? selectedData?.id : undefined,
      },
    });
  };

  const checkH1TagUnique = (h1Tag: string) => {
    if (!h1Tag?.trim()) {
      toast.error("Please enter an H1 tag first");
      return;
    }
    checkH1Tag({
      variables: {
        h1Tag,
        excludeId: isEditMode ? selectedData?.id : undefined,
      },
    });
  };

  const checkMetaTitleUnique = (metaTitle: string) => {
    if (!metaTitle?.trim()) {
      toast.error("Please enter a meta title first");
      return;
    }
    checkMetaTitle({
      variables: {
        metaTitle,
        excludeId: isEditMode ? selectedData?.id : undefined,
      },
    });
  };

  // ---------- FAQ handlers ----------
  const handleFaqChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCurrentFaq((prev) => ({ ...prev, [name]: value }));
  };

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
    } else if (editingFaqIndex !== null && editingFaqIndex > index) {
      // If the edited item was after the deleted one, shift its index
      setEditingFaqIndex(editingFaqIndex - 1);
    }
  };

  const cancelEditFaq = () => {
    setEditingFaqIndex(null);
    setCurrentFaq({ question: "", answer: "", order: faqs.length });
  };

  // ---------- Gallery handlers ----------
  const galleryCloseHandler = () => setShowGalleryOpen(false);

  const handleSelectedImage = (images: any[]) => {
    if (images.length === 0) {
      if (galleryMode === "imageUrl") setImageUrl([]);
      else if (galleryMode === "bannerImage") setBannerImage(null);
      else setIconImageUrl(null);
    } else {
      const selected = images[0];
      const newImage = { url: selected.url, alt: selected.alt || "" };
      if (galleryMode === "imageUrl") setImageUrl([newImage]);
      else if (galleryMode === "bannerImage") setBannerImage(newImage);
      else setIconImageUrl(newImage);
    }
    setShowGalleryOpen(false);
  };

  const openGallery = (
    mode: "imageUrl" | "bannerImage" | "iconImageUrl"
  ) => {
    setGalleryMode(mode);
    setShowGalleryOpen(true);
  };

  const removeImage = (
    mode: "imageUrl" | "bannerImage" | "iconImageUrl"
  ) => {
    if (mode === "imageUrl") setImageUrl([]);
    else if (mode === "bannerImage") setBannerImage(null);
    else setIconImageUrl(null);
  };

  const getImageUrl = (
    mode: "imageUrl" | "bannerImage" | "iconImageUrl"
  ): string => {
    if (mode === "imageUrl") return imageUrl.length > 0 ? imageUrl[0].url : "";
    const img = mode === "bannerImage" ? bannerImage : iconImageUrl;
    return img?.url || "";
  };

  const hasCustomAltText = (
    mode: "imageUrl" | "bannerImage" | "iconImageUrl"
  ): boolean => {
    if (mode === "imageUrl") return imageUrl.length > 0 && !!imageUrl[0].alt;
    const img = mode === "bannerImage" ? bannerImage : iconImageUrl;
    return !!img?.alt;
  };

  // ---------- Form submission ----------
  const onSubmit = async (values: FormValues) => {
    const inputData = {
      ...values,
      imageUrl: imageUrl.length > 0 ? imageUrl : null,
      bannerImage,
      iconImageUrl,
      faqs,
    };
    const cleanInputData = removeTypename(inputData);

    console.log({ cleanInputData: cleanInputData })

    try {
      let result;
      if (isEditMode && selectedData?.id) {
        result = await updateIndustry({
          variables: { id: selectedData.id, input: cleanInputData },
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

  // ---------- Build Tabs Array ----------
  const tabs: TabConfig[] = [
    {
      id: "basic",
      label: "Basic",
      content: (
        <BasicTab
          isEditMode={isEditMode}
          slugCheck={slugCheck}
          checkingSlug={checkingSlug}
          checkSlugUnique={checkSlugUnique}
        />
      ),
    },
    {
      id: "meta",
      label: "Meta",
      content: (
        <MetaTab
          h1TagCheck={h1TagCheck}
          checkingH1Tag={checkingH1Tag}
          metaTitleCheck={metaTitleCheck}
          checkingMetaTitle={checkingMetaTitle}
          checkH1TagUnique={checkH1TagUnique}
          checkMetaTitleUnique={checkMetaTitleUnique}
        />
      ),
    },
    {
      id: "content",
      label: "Content",
      content: <ContentTab />,
    },
    {
      id: "images",
      label: "Images",
      content: (
        <ImagesTab
          imageUrl={imageUrl}
          bannerImage={bannerImage}
          iconImageUrl={iconImageUrl}
          getImageUrl={getImageUrl}
          hasCustomAltText={hasCustomAltText}
          openGallery={openGallery}
          removeImage={removeImage}
        />
      ),
    },
    {
      id: "faqs",
      label: "FAQs",
      badge: faqs.length > 0 ? faqs.length : undefined, // shows count on tab
      content: (
        <FaqsTab
          faqs={faqs}
          currentFaq={currentFaq}
          editingFaqIndex={editingFaqIndex}
          handleFaqChange={handleFaqChange}
          addOrUpdateFaq={addOrUpdateFaq}
          editFaq={editFaq}
          deleteFaq={deleteFaq}
          cancelEditFaq={cancelEditFaq}
        />
      ),
    },
  ];

  // ---------- Render ----------
  return (
    <>
      <DynamicFormPopup<FormValues>
        open={true}
        onOpenChange={onCancel}
        title={isEditMode ? "Edit Industry" : "Add New Industry"}
        tabs={tabs}
        defaultValues={defaultValues}
        validationSchema={industrySchema}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        submitLabel={isEditMode ? "Update Industry" : "Create Industry"}
      />

      {showGalleryOpen && (
        <WebsiteGalleryModel
          onCancel={galleryCloseHandler}
          onSentSelected={handleSelectedImage}
          mode="single"
        />
      )}
    </>
  );
};

export default AddIndustry;