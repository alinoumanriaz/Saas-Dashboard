/* eslint-disable react-hooks/set-state-in-effect */
import { ChangeEvent, useEffect, useState, useMemo } from "react";
import { useMutation, useLazyQuery, useQuery } from "@apollo/client/react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import dynamic from "next/dynamic";
import Image from "next/image";
import { FiX, FiPlus, FiEdit } from "react-icons/fi";
import { toast } from "sonner";

// shadcn/ui components
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@headlessui/react";

// Custom components
import { DynamicFormPopup, TabConfig } from "@/components/TabbedForm";
import WebsiteGalleryModel from "./WebsiteGallery.model";
import { generateSlug } from "@/helpers/slug-maker";
import { removeTypename } from "@/helpers/removetypename";
import {
  CHECK_PRODUCT_SLUG_UNIQUE,
  CHECK_PRODUCT_H1_TAG_UNIQUE,
  CHECK_PRODUCT_META_TITLE_UNIQUE,
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
} from "@/graphql/current-website-queries/product.query";
import { gql } from "@apollo/client";
import { useAppSelector } from "@/redux/hooks";

// ============================================================
// GraphQL queries for dropdown data
// ============================================================
const GET_INDUSTRIES = gql`
  query findAllIndustries {
    findAllIndustries {
      id
      name
    }
  }
`;

const GET_MATERIALS = gql`
  query findAllMaterials {
    findAllMaterials {
      id
      name
    }
  }
`;

const GET_STYLES = gql`
  query findAllStyles {
    findAllStyles {
      id
      name
    }
  }
`;

// Rich Text Editor (client-only)
const TiptopEditor = dynamic(() => import("../../TiptopTextEditor"), { ssr: false });

// ============================================================
// Types
// ============================================================
interface FAQItem {
  question: string;
  answer: string;
  order: number;
}

interface ImageItem {
  url: string;
  alt: string;
}

interface LookupOption {
  id: string;
  name: string;
}

const IMAGE_MIN = 1;
const IMAGE_MAX = 10;
const META_DESCRIPTION_MAX = 160;
const ALT_TEXT_MAX = 125;

// Zod schema for the form
const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    }),
  h1Tag: z.string().min(1, "H1 Tag is required"),
  metaTitle: z.string().min(1, "Meta Title is required"),
  metaDescription: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  specification: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  industry: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  style: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  lowPrice: z.number().min(0).nullable().optional(),
  highPrice: z.number().min(0).nullable().optional(),
});

type FormValues = z.infer<typeof productSchema>;

// Normalize whatever shape the API returns into ImageItem[]
const toImageArray = (input: unknown): ImageItem[] => {
  if (!Array.isArray(input)) return [];
  return input.map((item) =>
    typeof item === "string"
      ? { url: item, alt: "" }
      : { url: item?.url ?? "", alt: item?.alt ?? "" }
  );
};

// Strip any lingering __typename fields from FAQ objects coming from the API
const cleanFaqs = (input: unknown): FAQItem[] => {
  if (!Array.isArray(input)) return [];
  return input.map((f, i) => ({
    question: f?.question ?? "",
    answer: f?.answer ?? "",
    order: typeof f?.order === "number" ? f.order : i,
  }));
};

// ============================================================
// 1. Basic Tab
// ============================================================
interface BasicTabProps {
  isEditMode: boolean;
  slugCheck: string;
  checkingSlug: boolean;
  checkSlugUnique: (slug: string) => void;
}

const BasicTab = ({ isEditMode, slugCheck, checkingSlug, checkSlugUnique }: BasicTabProps) => {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>();
  const name = useWatch({ control, name: "name" });
  const slug = useWatch({ control, name: "slug" });
  const h1Tag = useWatch({ control, name: "h1Tag" });
  const metaTitle = useWatch({ control, name: "metaTitle" });
  const [isSlugManual, setIsSlugManual] = useState(isEditMode);

  // Auto-generate slug from name until the user edits it manually
  useEffect(() => {
    if (!isSlugManual && name) {
      setValue("slug", generateSlug(name), { shouldValidate: true, shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, isSlugManual]);

  // Auto-fill h1Tag and metaTitle from name, only while they're still empty
  useEffect(() => {
    if (!h1Tag && name) setValue("h1Tag", name, { shouldValidate: true });
    if (!metaTitle && name) setValue("metaTitle", name, { shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-auto">
      {/* Name */}
      <div>
        <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">
          Product Name *
        </label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input id="product-name" placeholder="Enter product name" {...field} />}
        />
        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="product-slug" className="block text-sm font-medium text-gray-700 mb-1">
          Slug *
        </label>
        <div className="flex gap-2">
          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <Input
                id="product-slug"
                placeholder="product-slug"
                {...field}
                onFocus={() => setIsSlugManual(true)}
                onBlur={() => {
                  if (field.value === generateSlug(name ?? "")) {
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

      {/* Short Description */}
      <div className="md:col-span-2">
        <label htmlFor="product-short-desc" className="block text-sm font-medium text-gray-700 mb-1">
          Short Description
        </label>
        <Controller
          name="shortDescription"
          control={control}
          render={({ field }) => (
            <Textarea id="product-short-desc" placeholder="Brief description for listings" rows={3} {...field} />
          )}
        />
      </div>
    </div>
  );
};

// ============================================================
// 2. Meta Tab
// ============================================================
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
  const {
    control,
    formState: { errors },
  } = useFormContext<FormValues>();
  const h1Tag = useWatch({ control, name: "h1Tag" });
  const metaTitle = useWatch({ control, name: "metaTitle" });
  const metaDescription = useWatch({ control, name: "metaDescription" });
  const descLength = metaDescription?.length ?? 0;

  return (
    <Card>
      <CardContent className="space-y-4 pt-4 max-h-96 overflow-auto">
        {/* H1 Tag */}
        <div>
          <label htmlFor="product-h1" className="block text-sm font-medium text-gray-700 mb-1">
            H1 Tag *
          </label>
          <div className="flex gap-2">
            <Controller
              name="h1Tag"
              control={control}
              render={({ field }) => (
                <Input id="product-h1" placeholder="e.g., Premium Product Name" {...field} />
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
          <label htmlFor="product-meta-title" className="block text-sm font-medium text-gray-700 mb-1">
            Meta Title *
          </label>
          <div className="flex gap-2">
            <Controller
              name="metaTitle"
              control={control}
              render={({ field }) => (
                <Input id="product-meta-title" placeholder="e.g., Best Product for You | Company" {...field} />
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
          <label htmlFor="product-meta-desc" className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description
          </label>
          <Controller
            name="metaDescription"
            control={control}
            render={({ field }) => (
              <Textarea
                id="product-meta-desc"
                placeholder="Description for search engines (150-160 chars)"
                rows={3}
                {...field}
              />
            )}
          />
          <div className="flex justify-between mt-1">
            <span className="text-sm text-gray-500">Recommended: 150-160 characters</span>
            <span
              className={`text-sm ${
                descLength > META_DESCRIPTION_MAX
                  ? "text-red-500"
                  : descLength > 150
                  ? "text-yellow-500"
                  : "text-green-500"
              }`}
            >
              {descLength}/{META_DESCRIPTION_MAX}
            </span>
          </div>
          {errors.metaDescription && (
            <p className="text-sm text-red-600 mt-1">{errors.metaDescription.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================
// 3. Content Tab
// ============================================================
const ContentTab = () => {
  const { control } = useFormContext<FormValues>();

  return (
    <div className="space-y-6 max-h-96 overflow-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <div className="border rounded-md">
              <TiptopEditor height="h-40" initialValue={field.value} onChange={(content: string) => field.onChange(content)} />
            </div>
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
        <Controller
          name="specification"
          control={control}
          render={({ field }) => (
            <div className="border rounded-md">
              <TiptopEditor height="h-40" initialValue={field.value} onChange={(content: string) => field.onChange(content)} />
            </div>
          )}
        />
      </div>
    </div>
  );
};

// ============================================================
// 4. Images Tab
// ============================================================
interface ImagesTabProps {
  images: ImageItem[];
  setImages: (images: ImageItem[]) => void;
  openGallery: () => void;
}

const ImagesTab = ({ images, setImages, openGallery }: ImagesTabProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [altInput, setAltInput] = useState("");

  const handleRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const startEditAlt = (index: number) => {
    setEditingIndex(index);
    setAltInput(images[index].alt || "");
  };

  const saveAlt = (index: number) => {
    if (altInput.length > ALT_TEXT_MAX) {
      toast.error(`Alt text must be ≤ ${ALT_TEXT_MAX} characters`);
      return;
    }
    setImages(images.map((img, i) => (i === index ? { ...img, alt: altInput } : img)));
    setEditingIndex(null);
    setAltInput("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setAltInput("");
  };

  const validation = {
    total: images.length,
    withAlt: images.filter((img) => img.alt.trim().length > 0).length,
    min: IMAGE_MIN,
    max: IMAGE_MAX,
  };

  return (
    <div className="space-y-4 max-h-96 overflow-auto">
      <div className="flex flex-wrap gap-4">
        {images.map((img, index) => (
          <div key={`${img.url}-${index}`} className="relative group w-28 h-28 border rounded-lg overflow-hidden">
            <Image src={img.url} alt={img.alt || `Product ${index + 1}`} fill className="object-cover" />
            {editingIndex === index ? (
              <div className="absolute inset-0 bg-black/80 flex flex-col p-2">
                <Textarea
                  value={altInput}
                  onChange={(e) => setAltInput(e.target.value)}
                  placeholder="Alt text for SEO"
                  className="flex-1 text-white bg-transparent border border-gray-400 rounded p-1 text-xs resize-none"
                  maxLength={ALT_TEXT_MAX}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-300">
                    {altInput.length}/{ALT_TEXT_MAX}
                  </span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => saveAlt(index)} className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                      Save
                    </button>
                    <button type="button" onClick={cancelEdit} className="text-xs bg-gray-500 text-white px-2 py-1 rounded">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-md"
                >
                  <FiX className="size-3" />
                </button>
                {img.alt ? (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                    Alt: {img.alt}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditAlt(index)}
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1"
                  >
                    <FiEdit className="size-3" /> Add Alt
                  </button>
                )}
              </>
            )}
          </div>
        ))}
        {images.length < validation.max && (
          <button
            type="button"
            onClick={openGallery}
            className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <FiPlus className="size-6 text-gray-400" />
            <span className="text-xs text-gray-500 mt-1">Add Image</span>
          </button>
        )}
      </div>

      {/* Validation summary */}
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="flex gap-4 text-xs flex-wrap">
          <span className={validation.total >= validation.min ? "text-green-600" : "text-red-600"}>
            {validation.total >= validation.min ? "✓" : "✗"} Min {validation.min}
          </span>
          <span className={validation.total <= validation.max ? "text-green-600" : "text-yellow-600"}>
            {validation.total <= validation.max ? "✓" : "✗"} Max {validation.max}
          </span>
          <span className={validation.withAlt >= 1 ? "text-green-600" : "text-red-600"}>
            {validation.withAlt >= 1 ? "✓" : "✗"} At least 1 alt text
          </span>
          <span className="text-gray-500">
            {validation.total} image{validation.total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 5. FAQs Tab
// ============================================================
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
          <h3 className="text-sm font-medium">{editingFaqIndex !== null ? "Edit FAQ" : "Add New FAQ"}</h3>
          <Input name="question" value={currentFaq.question} onChange={handleFaqChange} placeholder="Question *" />
          <Textarea name="answer" value={currentFaq.answer} onChange={handleFaqChange} placeholder="Answer *" rows={3} />
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
              <Card key={`${faq.question}-${index}`}>
                <CardContent className="flex justify-between items-start pt-4">
                  <div>
                    <h4 className="font-medium">{faq.question}</h4>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
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

// ============================================================
// 6. Pricing Tab
// ============================================================
const PricingTab = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext<FormValues>();

  return (
    <div className="grid grid-cols-2 gap-4 max-h-96 overflow-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Low Price (£)</label>
        <Controller
          name="lowPrice"
          control={control}
          render={({ field }) => (
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...field}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
            />
          )}
        />
        {errors.lowPrice && <p className="text-sm text-red-600 mt-1">{errors.lowPrice.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">High Price (£)</label>
        <Controller
          name="highPrice"
          control={control}
          render={({ field }) => (
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...field}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
            />
          )}
        />
        {errors.highPrice && <p className="text-sm text-red-600 mt-1">{errors.highPrice.message}</p>}
      </div>
    </div>
  );
};

// ============================================================
// 7. Categorization Tab
// ============================================================
interface CategorizationTabProps {
  industries: LookupOption[];
  materials: LookupOption[];
  styles: LookupOption[];
}

const CategorizationTab = ({ industries, materials, styles }: CategorizationTabProps) => {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>();
  const tags = useWatch({ control, name: "tags" });
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setValue("tags", [...tags, trimmed], { shouldValidate: true });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setValue(
      "tags",
      tags.filter((t) => t !== tag),
      { shouldValidate: true }
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
        <Controller
          name="industry"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              value={field.value || ""}
              onChange={(e) => field.onChange(e.target.value || null)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select industry</option>
              {industries.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.name}
                </option>
              ))}
            </select>
          )}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
        <Controller
          name="material"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              value={field.value || ""}
              onChange={(e) => field.onChange(e.target.value || null)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select material</option>
              {materials.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.name}
                </option>
              ))}
            </select>
          )}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <Controller
          name="style"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              value={field.value || ""}
              onChange={(e) => field.onChange(e.target.value || null)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select style</option>
              {styles.map((sty) => (
                <option key={sty.id} value={sty.id}>
                  {sty.name}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tag"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" onClick={addTag}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600">
                <FiX className="size-3" />
              </button>
            </span>
          ))}
        </div>
        {errors.tags && <p className="text-sm text-red-600 mt-1">{errors.tags.message as string}</p>}
      </div>
    </div>
  );
};

// ============================================================
// 8. Settings Tab
// ============================================================
const SettingsTab = () => {
  const { control } = useFormContext<FormValues>();

  return (
    <div className="space-y-4 max-h-96 overflow-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <select {...field} className="w-full p-2 border rounded-md">
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          )}
        />
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div>
          <p className="font-medium text-gray-900">Featured Product</p>
          <p className="text-sm text-gray-500">Show this product in featured sections</p>
        </div>
        <Controller
          name="isFeatured"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onChange={field.onChange}
              className={`${field.value ? "bg-blue-600" : "bg-gray-200"} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
            >
              <span
                className={`${field.value ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition`}
              />
            </Switch>
          )}
        />
      </div>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
interface AddProductProps {
  onCancel: () => void;
  selectedData?: any;
  isEditMode?: boolean;
  refetch?: () => void;
}

const AddProduct = ({ onCancel, selectedData, isEditMode = false, refetch }: AddProductProps) => {
  const companyMember = useAppSelector((state) => state.currentCompanyMember?.companyMember);

  // ---------- Dropdown data ----------
  const [industries, setIndustries] = useState<LookupOption[]>([]);
  const [materials, setMaterials] = useState<LookupOption[]>([]);
  const [styles, setStyles] = useState<LookupOption[]>([]);

  // ---------- Images ----------
  const [images, setImages] = useState<ImageItem[]>(toImageArray(selectedData?.imageUrl));

  // ---------- FAQs ----------
  const [faqs, setFaqs] = useState<FAQItem[]>(cleanFaqs(selectedData?.faqs));
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [currentFaq, setCurrentFaq] = useState<FAQItem>({ question: "", answer: "", order: 0 });

  // ---------- Gallery modal ----------
  const [showGallery, setShowGallery] = useState(false);

  // ---------- Uniqueness check messages ----------
  const [slugCheck, setSlugCheck] = useState("");
  const [h1TagCheck, setH1TagCheck] = useState("");
  const [metaTitleCheck, setMetaTitleCheck] = useState("");

  // ---------- Uniqueness check queries ----------
  const [checkSlug, { loading: checkingSlug, data: slugData, error: slugError }] =
    useLazyQuery<any>(CHECK_PRODUCT_SLUG_UNIQUE, { fetchPolicy: "network-only" });
  const [checkH1Tag, { loading: checkingH1Tag, data: h1TagData, error: h1TagError }] =
    useLazyQuery<any>(CHECK_PRODUCT_H1_TAG_UNIQUE, { fetchPolicy: "network-only" });
  const [checkMetaTitle, { loading: checkingMetaTitle, data: metaTitleData, error: metaTitleError }] =
    useLazyQuery<any>(CHECK_PRODUCT_META_TITLE_UNIQUE, { fetchPolicy: "network-only" });

  const { data: industriesData, error: industriesError } = useQuery<any>(GET_INDUSTRIES);
  const { data: materialsData, error: materialsError } = useQuery<any>(GET_MATERIALS);
  const { data: stylesData, error: stylesError } = useQuery<any>(GET_STYLES);

  useEffect(() => {
    if (slugData?.checkProductSlugUnique) {
      setSlugCheck(slugData.checkProductSlugUnique.isUnique ? "✓ Slug is available" : "✗ Slug is already taken");
    }
    if (slugError) toast.error("Failed to check slug availability");
  }, [slugData, slugError]);

  useEffect(() => {
    if (h1TagData?.checkProductH1TagUnique) {
      setH1TagCheck(h1TagData.checkProductH1TagUnique.isUnique ? "✓ H1 Tag is available" : "✗ H1 Tag is already taken");
    }
    if (h1TagError) toast.error("Failed to check H1 Tag availability");
  }, [h1TagData, h1TagError]);

  useEffect(() => {
    if (metaTitleData?.checkProductMetaTitleUnique) {
      setMetaTitleCheck(
        metaTitleData.checkProductMetaTitleUnique.isUnique ? "✓ Meta Title is available" : "✗ Meta Title is already taken"
      );
    }
    if (metaTitleError) toast.error("Failed to check Meta Title availability");
  }, [metaTitleData, metaTitleError]);

  // ---------- Mutations ----------
  const [createProduct, { loading: createLoading }] = useMutation<any>(CREATE_PRODUCT);
  const [updateProduct, { loading: updateLoading }] = useMutation<any>(UPDATE_PRODUCT);
  const isSubmitting = createLoading || updateLoading;

  // ---------- Load dropdown data ----------
  useEffect(() => {
    if (industriesData?.findAllIndustries) setIndustries(industriesData.findAllIndustries);
    if (industriesError) toast.error("Failed to load industries");
  }, [industriesData, industriesError]);

  useEffect(() => {
    if (materialsData?.findAllMaterials) setMaterials(materialsData.findAllMaterials);
    if (materialsError) toast.error("Failed to load materials");
  }, [materialsData, materialsError]);

  useEffect(() => {
    if (stylesData?.findAllStyles) setStyles(stylesData.findAllStyles);
    if (stylesError) toast.error("Failed to load styles");
  }, [stylesData, stylesError]);

  // ---------- Default values ----------
  const defaultValues = useMemo<FormValues>(
    () => ({
      name: selectedData?.name || "",
      slug: selectedData?.slug || "",
      h1Tag: selectedData?.h1Tag || "",
      metaTitle: selectedData?.metaTitle || "",
      metaDescription: selectedData?.metaDescription || "",
      shortDescription: selectedData?.shortDescription || "",
      description: selectedData?.description || "",
      specification: selectedData?.specification || "",
      status: selectedData?.status || "DRAFT",
      industry: selectedData?.industry?.id || selectedData?.industry || null,
      material: selectedData?.material?.id || selectedData?.material || null,
      style: selectedData?.style?.id || selectedData?.style || null,
      tags: selectedData?.tags || [],
      isFeatured: selectedData?.isFeatured || false,
      lowPrice: selectedData?.lowPrice ?? null,
      highPrice: selectedData?.highPrice ?? null,
    }),
    [selectedData]
  );

  // ---------- FAQ handlers ----------
  const handleFaqChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentFaq((prev) => ({ ...prev, [name]: value }));
  };

  const addOrUpdateFaq = () => {
    if (!currentFaq.question.trim() || !currentFaq.answer.trim()) {
      toast.error("Both question and answer are required");
      return;
    }
    if (editingFaqIndex !== null) {
      const updated = [...faqs];
      updated[editingFaqIndex] = { ...currentFaq, order: editingFaqIndex };
      setFaqs(updated);
      setEditingFaqIndex(null);
      setCurrentFaq({ question: "", answer: "", order: updated.length });
    } else {
      const updated = [...faqs, { ...currentFaq, order: faqs.length }];
      setFaqs(updated);
      setCurrentFaq({ question: "", answer: "", order: updated.length });
    }
  };

  const editFaq = (index: number) => {
    setCurrentFaq(faqs[index]);
    setEditingFaqIndex(index);
  };

  const deleteFaq = (index: number) => {
    const updated = faqs.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i }));
    setFaqs(updated);
    if (editingFaqIndex === index) {
      setEditingFaqIndex(null);
      setCurrentFaq({ question: "", answer: "", order: updated.length });
    } else if (editingFaqIndex !== null && editingFaqIndex > index) {
      setEditingFaqIndex(editingFaqIndex - 1);
    }
  };

  const cancelEditFaq = () => {
    setEditingFaqIndex(null);
    setCurrentFaq({ question: "", answer: "", order: faqs.length });
  };

  // ---------- Gallery handlers ----------
  const handleGalleryClose = () => setShowGallery(false);

  const handleGallerySelect = (selected: any[]) => {
    if (!selected.length) return;
    const remainingSlots = IMAGE_MAX - images.length;
    if (remainingSlots <= 0) {
      toast.error(`You can add up to ${IMAGE_MAX} images`);
      return;
    }
    const newImages = selected.slice(0, remainingSlots).map((img) => ({ url: img.url, alt: img.alt || "" }));
    setImages((prev) => [...prev, ...newImages]);
    setShowGallery(false);
  };

  // ---------- Submit ----------
  const onSubmit = async (values: FormValues) => {
    if (images.length < IMAGE_MIN) {
      toast.error(`Please add at least ${IMAGE_MIN} image`);
      return;
    }
    if (images.length > IMAGE_MAX) {
      toast.error(`You can only have up to ${IMAGE_MAX} images`);
      return;
    }
    if (!companyMember?.id) {
      toast.error("Unable to identify the current user. Please refresh and try again.");
      return;
    }

    const inputData = {
      ...values,
      imageUrl: images,
      author: companyMember.id,
      faqs,
    };
    const clean = removeTypename(inputData);

    try {
      if (isEditMode && selectedData?.id) {
        const result = await updateProduct({ variables: { id: selectedData.id, input: clean } });
        if (result.data?.updateProduct?.success) {
          toast.success(result.data.updateProduct.message || "Product updated");
          refetch?.();
          onCancel();
        } else {
          toast.error(result.data?.updateProduct?.message || "Update failed");
        }
      } else {
        const result = await createProduct({ variables: { input: clean } });
        if (result.data?.createProduct?.success) {
          toast.success(result.data.createProduct.message || "Product created");
          refetch?.();
          onCancel();
        } else {
          toast.error(result.data?.createProduct?.message || "Creation failed");
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Operation failed. Please try again.");
    }
  };

  // ---------- Uniqueness check callbacks ----------
  const checkSlugUnique = (slug: string) => {
    if (!slug?.trim()) {
      toast.error("Please enter a slug");
      return;
    }
    setSlugCheck("");
    checkSlug({ variables: { slug, excludeId: isEditMode ? selectedData?.id : undefined } });
  };

  const checkH1TagUnique = (h1Tag: string) => {
    if (!h1Tag?.trim()) {
      toast.error("Please enter an H1 tag");
      return;
    }
    setH1TagCheck("");
    checkH1Tag({ variables: { h1Tag, excludeId: isEditMode ? selectedData?.id : undefined } });
  };

  const checkMetaTitleUnique = (metaTitle: string) => {
    if (!metaTitle?.trim()) {
      toast.error("Please enter a meta title");
      return;
    }
    setMetaTitleCheck("");
    checkMetaTitle({ variables: { metaTitle, excludeId: isEditMode ? selectedData?.id : undefined } });
  };

  // ---------- Tabs ----------
  const tabs: TabConfig[] = [
    {
      id: "basic",
      label: "Basic",
      content: (
        <BasicTab isEditMode={isEditMode} slugCheck={slugCheck} checkingSlug={checkingSlug} checkSlugUnique={checkSlugUnique} />
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
      badge: images.length > 0 ? images.length : undefined,
      content: <ImagesTab images={images} setImages={setImages} openGallery={() => setShowGallery(true)} />,
    },
    {
      id: "faqs",
      label: "FAQs",
      badge: faqs.length > 0 ? faqs.length : undefined,
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
    {
      id: "pricing",
      label: "Pricing",
      content: <PricingTab />,
    },
    {
      id: "categorization",
      label: "Categorization",
      content: <CategorizationTab industries={industries} materials={materials} styles={styles} />,
    },
    {
      id: "settings",
      label: "Settings",
      content: <SettingsTab />,
    },
  ];

  return (
    <>
      <DynamicFormPopup<FormValues>
        open={true}
        onOpenChange={onCancel}
        title={isEditMode ? "Edit Product" : "Add New Product"}
        tabs={tabs}
        defaultValues={defaultValues}
        validationSchema={productSchema}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        submitLabel={isEditMode ? "Update Product" : "Create Product"}
        size="xl"
      />

      {showGallery && (
        <WebsiteGalleryModel onCancel={handleGalleryClose} onSentSelected={handleGallerySelect} mode="multiple" />
      )}
    </>
  );
};

export default AddProduct;