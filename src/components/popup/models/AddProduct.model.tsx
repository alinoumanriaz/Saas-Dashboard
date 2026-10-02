/* eslint-disable react-hooks/set-state-in-effect */
import { ChangeEvent, useEffect, useState, useMemo, ReactNode } from "react";
import { useMutation, useLazyQuery, useQuery } from "@apollo/client/react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  FiX,
  FiEdit2,
  FiInfo,
  FiSearch,
  FiFileText,
  FiImage,
  FiDollarSign,
  FiGrid,
  FiSliders,
  FiHelpCircle,
  FiCheckCircle,
  FiXCircle,
  FiUploadCloud,
  FiStar,
  FiTrash2,
  FiTag,
  FiAlertCircle,
  FiSmartphone,
  FiMonitor,
  FiTrendingUp,
  FiHash,
  FiType,
  FiLink,
} from "react-icons/fi";
import { toast } from "sonner";

/* shadcn/ui components */
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@headlessui/react";

/* Custom components */
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

/* ============================================================
 * GraphQL queries for dropdown data
 * ============================================================ */
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

/* Rich Text Editor (client-only) */
const TiptopEditor = dynamic(() => import("../../TiptopTextEditor"), {
  ssr: false,
});

/* ============================================================
 * Types
 * ============================================================ */
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

/* Zod schema for the form */
const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message:
        "Slug can only contain lowercase letters, numbers, and hyphens",
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
  moq: z.string(),
});
type FormValues = z.infer<typeof productSchema>;

/* Normalize whatever shape the API returns into ImageItem[] */
const toImageArray = (input: unknown): ImageItem[] => {
  if (!Array.isArray(input)) return [];
  return input.map((item) =>
    typeof item === "string"
      ? { url: item, alt: "" }
      : { url: item?.url ?? "", alt: item?.alt ?? "" }
  );
};

/* Strip any lingering __typename fields from FAQ objects coming from the API */
const cleanFaqs = (input: unknown): FAQItem[] => {
  if (!Array.isArray(input)) return [];
  return input.map((f, i) => ({
    question: f?.question ?? "",
    answer: f?.answer ?? "",
    order: typeof f?.order === "number" ? f.order : i,
  }));
};

/* ============================================================
 * Shared presentational helpers
 * ============================================================ */
interface SectionCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  tone?: "indigo" | "violet" | "sky" | "amber" | "emerald" | "rose" | "slate";
  children: ReactNode;
}

const TONE_STYLES: Record<
  NonNullable<SectionCardProps["tone"]>,
  { bg: string; text: string }
> = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
  violet: { bg: "bg-violet-50", text: "text-violet-600" },
  sky: { bg: "bg-sky-50", text: "text-sky-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
  slate: { bg: "bg-slate-100", text: "text-slate-600" },
};

const SectionCard = ({
  icon,
  title,
  description,
  tone = "indigo",
  children,
}: SectionCardProps) => {
  const toneStyle = TONE_STYLES[tone];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${toneStyle.bg} ${toneStyle.text}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
};

const FieldLabel = ({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) => (
  <label
    htmlFor={htmlFor}
    className="mb-1.5 block text-sm font-medium text-slate-700"
  >
    {children}
    {required && <span className="ml-0.5 text-rose-500">*</span>}
  </label>
);

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
      <FiXCircle className="size-3.5 shrink-0" />
      {message}
    </p>
  ) : null;

const UniquenessResult = ({ status }: { status: string }) =>
  status ? (
    <p
      className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${status.startsWith("✓") ? "text-emerald-600" : "text-rose-600"
        }`}
    >
      {status.startsWith("✓") ? (
        <FiCheckCircle className="size-3.5 shrink-0" />
      ) : (
        <FiXCircle className="size-3.5 shrink-0" />
      )}
      {status.replace(/^[✓✗]\s*/, "")}
    </p>
  ) : null;

/* ============================================================
 * 1. Basic Tab
 * ============================================================ */
interface BasicTabProps {
  isEditMode: boolean;
  slugCheck: string;
  checkingSlug: boolean;
  checkSlugUnique: (slug: string) => void;
  isSlugManual: boolean;
  setIsSlugManual: (value: boolean) => void;
}

const BasicTab = ({
  isEditMode,
  slugCheck,
  checkingSlug,
  checkSlugUnique,
  isSlugManual,
  setIsSlugManual,
}: BasicTabProps) => {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>();
  const name = useWatch({ control, name: "name" });
  const slug = useWatch({ control, name: "slug" });

  /* Auto-generate slug from name until the user edits it manually */
  useEffect(() => {
    if (!isSlugManual && name) {
      setValue("slug", generateSlug(name), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, isSlugManual]);

  return (
    <SectionCard
      icon={<FiInfo className="size-4.5" />}
      title="Basic information"
      description="The essentials shoppers and search engines see first."
      tone="indigo"
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        {/* Name */}
        <div>
          <FieldLabel htmlFor="product-name" required>
            Product name
          </FieldLabel>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                id="product-name"
                placeholder="e.g., Handwoven Wool Throw"
                {...field}
              />
            )}
          />
          <FieldError message={errors.name?.message} />
        </div>

        {/* Slug */}
        <div>
          <FieldLabel htmlFor="product-slug" required>
            Slug
          </FieldLabel>
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
                    if (
                      field.value ===
                      generateSlug(name ?? "")
                    ) {
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
              className="shrink-0"
            >
              {checkingSlug ? "Checking…" : "Check"}
            </Button>
          </div>
          <UniquenessResult status={slugCheck} />
          <FieldError message={errors.slug?.message} />
        </div>

        {/* Short Description */}
        <div className="md:col-span-2">
          <FieldLabel htmlFor="product-short-desc">
            Short description
          </FieldLabel>
          <Controller
            name="shortDescription"
            control={control}
            render={({ field }) => (
              <Textarea
                id="product-short-desc"
                placeholder="A one- or two-line summary shown on listing and category pages"
                rows={3}
                {...field}
              />
            )}
          />
        </div>
      </div>
    </SectionCard>
  );
};

/* ============================================================
 * 2. Meta Tab
 * ============================================================ */
interface MetaTabProps {
  h1TagCheck: string;
  checkingH1Tag: boolean;
  metaTitleCheck: string;
  checkingMetaTitle: boolean;
  checkH1TagUnique: (h1Tag: string) => void;
  checkMetaTitleUnique: (metaTitle: string) => void;
  isH1Manual: boolean;
  setIsH1Manual: (value: boolean) => void;
  isMetaTitleManual: boolean;
  setIsMetaTitleManual: (value: boolean) => void;
}

const MetaTab = ({
  h1TagCheck,
  checkingH1Tag,
  metaTitleCheck,
  checkingMetaTitle,
  checkH1TagUnique,
  checkMetaTitleUnique,
  isH1Manual,
  setIsH1Manual,
  isMetaTitleManual,
  setIsMetaTitleManual,
}: MetaTabProps) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<FormValues>();
  const name = useWatch({ control, name: "name" });
  const h1Tag = useWatch({ control, name: "h1Tag" });
  const metaTitle = useWatch({ control, name: "metaTitle" });
  const metaDescription = useWatch({ control, name: "metaDescription" });
  const descLength = metaDescription?.length ?? 0;
  const descTone =
    descLength > META_DESCRIPTION_MAX
      ? "text-rose-500"
      : descLength > 150
        ? "text-amber-500"
        : "text-emerald-600";

  return (
    <SectionCard
      icon={<FiSearch className="size-4.5" />}
      title="Meta & SEO"
      description="Controls how this product appears in search results."
      tone="sky"
    >
      <div className="space-y-5">
        {/* H1 Tag */}
        <div>
          <FieldLabel htmlFor="product-h1" required>
            H1 tag
          </FieldLabel>
          <div className="flex gap-2">
            <Controller
              name="h1Tag"
              control={control}
              render={({ field }) => (
                <Input
                  id="product-h1"
                  placeholder="e.g., Premium Wool Throw Blanket"
                  {...field}
                  onFocus={() => setIsH1Manual(true)}
                  onBlur={() => {
                    if (field.value === (name ?? "")) {
                      setIsH1Manual(false);
                    }
                  }}
                />
              )}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => checkH1TagUnique(h1Tag)}
              disabled={checkingH1Tag || !h1Tag?.trim()}
              className="shrink-0"
            >
              {checkingH1Tag ? "Checking…" : "Check"}
            </Button>
          </div>
          <UniquenessResult status={h1TagCheck} />
          <FieldError message={errors.h1Tag?.message} />
        </div>

        {/* Meta Title */}
        <div>
          <FieldLabel htmlFor="product-meta-title" required>
            Meta title
          </FieldLabel>
          <div className="flex gap-2">
            <Controller
              name="metaTitle"
              control={control}
              render={({ field }) => (
                <Input
                  id="product-meta-title"
                  placeholder="e.g., Wool Throw Blanket | Your Company"
                  {...field}
                  onFocus={() => setIsMetaTitleManual(true)}
                  onBlur={() => {
                    if (field.value === (name ?? "")) {
                      setIsMetaTitleManual(false);
                    }
                  }}
                />
              )}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => checkMetaTitleUnique(metaTitle)}
              disabled={checkingMetaTitle || !metaTitle?.trim()}
              className="shrink-0"
            >
              {checkingMetaTitle ? "Checking…" : "Check"}
            </Button>
          </div>
          <UniquenessResult status={metaTitleCheck} />
          <FieldError message={errors.metaTitle?.message} />
        </div>

        {/* Meta Description */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <FieldLabel htmlFor="product-meta-desc">
              Meta description
            </FieldLabel>
            <span className={`text-xs font-medium ${descTone}`}>
              {descLength}/{META_DESCRIPTION_MAX}
            </span>
          </div>
          <Controller
            name="metaDescription"
            control={control}
            render={({ field }) => (
              <Textarea
                id="product-meta-desc"
                placeholder="Summarize the product for search engines, ideally 150–160 characters"
                rows={3}
                {...field}
              />
            )}
          />
          <FieldError message={errors.metaDescription?.message as string} />
        </div>
      </div>
    </SectionCard>
  );
};

/* ============================================================
 * 3. Content Tab
 * ============================================================ */
const ContentTab = () => {
  const { control } = useFormContext<FormValues>();
  return (
    <SectionCard
      icon={<FiFileText className="size-4.5" />}
      title="Content"
      description="The full description and specification shown on the product page."
      tone="violet"
    >
      <div className="space-y-6">
        <div>
          <FieldLabel>Description</FieldLabel>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <TiptopEditor
                  height="h-40"
                  initialValue={field.value}
                  onChange={(content: string) =>
                    field.onChange(content)
                  }
                />
              </div>
            )}
          />
        </div>
        <div>
          <FieldLabel>Specifications</FieldLabel>
          <Controller
            name="specification"
            control={control}
            render={({ field }) => (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <TiptopEditor
                  height="h-40"
                  initialValue={field.value}
                  onChange={(content: string) =>
                    field.onChange(content)
                  }
                />
              </div>
            )}
          />
        </div>
      </div>
    </SectionCard>
  );
};

/* ============================================================
 * 4. Images Tab
 * ============================================================ */
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
    setImages(
      images.map((img, i) =>
        i === index ? { ...img, alt: altInput } : img
      )
    );
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

  const checks = [
    { label: `Minimum ${validation.min} image`, ok: validation.total >= validation.min },
    { label: `Maximum ${validation.max} images`, ok: validation.total <= validation.max },
    { label: "At least 1 image has alt text", ok: validation.withAlt >= 1 },
  ];

  return (
    <SectionCard
      icon={<FiImage className="size-4.5" />}
      title="Images"
      description="Add product photos and describe them for accessibility and SEO."
      tone="amber"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          {images.map((img, index) => (
            <div
              key={`${img.url}-${index}`}
              className="group relative size-52 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-shadow hover:shadow-md"
            >
              <Image
                src={img.url}
                alt={img.alt || `Product ${index + 1}`}
                fill
                className="object-cover"
              />
              {editingIndex === index ? (
                <div className="absolute inset-0 flex flex-col bg-slate-900/85 p-2">
                  <Textarea
                    value={altInput}
                    onChange={(e) =>
                      setAltInput(e.target.value)
                    }
                    placeholder="Describe this image"
                    className="flex-1 resize-none rounded border border-slate-500 bg-transparent p-1 text-xs text-white placeholder:text-slate-400"
                    maxLength={ALT_TEXT_MAX}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-300">
                      {altInput.length}/{ALT_TEXT_MAX}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => saveAlt(index)}
                        className="rounded bg-emerald-500 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-emerald-600"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded bg-slate-600 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-slate-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="absolute right-1 top-1 rounded-full bg-rose-500 p-1 text-white opacity-0 shadow-md transition group-hover:opacity-100 hover:bg-rose-600"
                    aria-label="Remove image"
                  >
                    <FiX className="size-3" />
                  </button>
                  {img.alt ? (
                    <button
                      type="button"
                      onClick={() => startEditAlt(index)}
                      className="absolute inset-x-0 bottom-0 truncate bg-black/60 p-1 text-left text-[11px] text-white transition hover:bg-black/75"
                      title="Edit alt text"
                    >
                      {img.alt}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditAlt(index)}
                      className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-amber-500 w-fit text-nowrap px-2 py-0.5 text-[11px] font-medium text-white shadow"
                    >
                      <FiEdit2 className="size-3" /> Add alt text
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
              className="flex size-28 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-500"
            >
              <FiUploadCloud className="size-6" />
              <span className="text-xs font-medium">
                Add image
              </span>
            </button>
          )}
        </div>

        {/* Validation summary */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          {checks.map((c) => (
            <span
              key={c.label}
              className={`flex items-center gap-1.5 text-xs font-medium ${c.ok ? "text-emerald-600" : "text-rose-600"
                }`}
            >
              {c.ok ? (
                <FiCheckCircle className="size-3.5" />
              ) : (
                <FiXCircle className="size-3.5" />
              )}
              {c.label}
            </span>
          ))}
          <span className="ml-auto text-xs text-slate-400">
            {validation.total} image
            {validation.total !== 1 ? "s" : ""} added
          </span>
        </div>
      </div>
    </SectionCard>
  );
};

/* ============================================================
 * 5. FAQs Tab
 * ============================================================ */
interface FaqsTabProps {
  faqs: FAQItem[];
  currentFaq: FAQItem;
  editingFaqIndex: number | null;
  handleFaqChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
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
    <div className="space-y-6">
      <SectionCard
        icon={<FiHelpCircle className="size-4.5" />}
        title={editingFaqIndex !== null ? "Edit FAQ" : "Add a FAQ"}
        description="Answer the questions customers ask most before they buy."
        tone="emerald"
      >
        <div className="space-y-3">
          <div>
            <FieldLabel htmlFor="faq-question" required>
              Question
            </FieldLabel>
            <Input
              id="faq-question"
              name="question"
              value={currentFaq.question}
              onChange={handleFaqChange}
              placeholder="e.g., Is this product machine washable?"
            />
          </div>
          <div>
            <FieldLabel htmlFor="faq-answer" required>
              Answer
            </FieldLabel>
            <Textarea
              id="faq-answer"
              name="answer"
              value={currentFaq.answer}
              onChange={handleFaqChange}
              placeholder="Write a clear, helpful answer"
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" onClick={addOrUpdateFaq}>
              {editingFaqIndex !== null ? "Update FAQ" : "Add FAQ"}
            </Button>
            {editingFaqIndex !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={cancelEditFaq}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </SectionCard>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">
            Published FAQs
          </h3>
          {faqs.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {faqs.length}
            </span>
          )}
        </div>
        {faqs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
            <FiHelpCircle className="size-6" />
            <p className="text-sm">
              No FAQs yet — add your first one above.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {faqs.map((faq, index) => (
              <div
                key={`${faq.question}-${index}`}
                className={`flex items-start justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm transition ${editingFaqIndex === index
                  ? "border-emerald-300 ring-1 ring-emerald-200"
                  : "border-slate-200"
                  }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {faq.question}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => editFaq(index)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Edit FAQ"
                  >
                    <FiEdit2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFaq(index)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Delete FAQ"
                  >
                    <FiTrash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================
 * 6. Pricing Tab
 * ============================================================ */
const PricingTab = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext<FormValues>();
  return (
    <SectionCard
      icon={<FiDollarSign className="size-4.5" />}
      title="Pricing"
      description="The price range shown to shoppers browsing this product."
      tone="rose"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Low price</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              £
            </span>
            <Controller
              name="lowPrice"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        ? parseFloat(e.target.value)
                        : null
                    )
                  }
                />
              )}
            />
          </div>
          <FieldError message={errors.lowPrice?.message} />
        </div>
        <div>
          <FieldLabel>High price</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              £
            </span>
            <Controller
              name="highPrice"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        ? parseFloat(e.target.value)
                        : null
                    )
                  }
                />
              )}
            />
          </div>
          <FieldError message={errors.highPrice?.message} />
        </div>
        <div>
          <FieldLabel htmlFor="moq">
            MOQ
          </FieldLabel>
          <Controller
            name="moq"
            control={control}
            render={({ field }) => (
              <Input
                id="moq"
                placeholder="50"
                {...field}
              />
            )}
          />
          <FieldError message={errors.moq?.message} />
        </div>
      </div>
    </SectionCard>
  );
};

/* ============================================================
 * 7. Categorization Tab
 * ============================================================ */
interface CategorizationTabProps {
  industries: LookupOption[];
  materials: LookupOption[];
  styles: LookupOption[];
}

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

const CategorizationTab = ({
  industries,
  materials,
  styles,
}: CategorizationTabProps) => {
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
    <SectionCard
      icon={<FiGrid className="size-4.5" />}
      title="Categorization"
      description="Helps customers filter and find this product."
      tone="violet"
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        <div>
          <FieldLabel>Industry</FieldLabel>
          <Controller
            name="industry"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                value={field.value || ""}
                onChange={(e) =>
                  field.onChange(e.target.value || null)
                }
                className={selectClass}
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
          <FieldLabel>Material</FieldLabel>
          <Controller
            name="material"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                value={field.value || ""}
                onChange={(e) =>
                  field.onChange(e.target.value || null)
                }
                className={selectClass}
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
          <FieldLabel>Style</FieldLabel>
          <Controller
            name="style"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                value={field.value || ""}
                onChange={(e) =>
                  field.onChange(e.target.value || null)
                }
                className={selectClass}
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
          <FieldLabel>Tags</FieldLabel>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FiTag className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag and press Enter"
                className="pl-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
            </div>
            <Button type="button" variant="outline" onClick={addTag}>
              Add
            </Button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.length === 0 && (
              <span className="text-xs text-slate-400">
                No tags added yet.
              </span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="rounded-full p-0.5 text-indigo-400 transition hover:bg-indigo-100 hover:text-rose-600"
                  aria-label={`Remove ${tag}`}
                >
                  <FiX className="size-3" />
                </button>
              </span>
            ))}
          </div>
          {errors.tags && (
            <FieldError message={errors.tags.message as string} />
          )}
        </div>
      </div>
    </SectionCard>
  );
};

/* ============================================================
 * 8. Settings Tab
 * ============================================================ */
const SettingsTab = () => {
  const { control } = useFormContext<FormValues>();
  const status = useWatch({ control, name: "status" });
  return (
    <SectionCard
      icon={<FiSliders className="size-4.5" />}
      title="Settings"
      description="Publishing status and merchandising options."
      tone="slate"
    >
      <div className="space-y-4">
        <div>
          <FieldLabel>Status</FieldLabel>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <select {...field} className={selectClass}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            )}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            {status === "PUBLISHED"
              ? "This product is visible to customers."
              : "This product is hidden until you publish it."}
          </p>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
              <FiStar className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-800">
                Featured product
              </p>
              <p className="text-xs text-slate-500">
                Show this product in featured sections across
                the site.
              </p>
            </div>
          </div>
          <Controller
            name="isFeatured"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={field.onChange}
                className={`${field.value ? "bg-indigo-600" : "bg-slate-300"
                  } relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-200`}
              >
                <span
                  className={`${field.value
                    ? "translate-x-6"
                    : "translate-x-1"
                    } inline-block size-4 transform rounded-full bg-white shadow transition`}
                />
              </Switch>
            )}
          />
        </div>
      </div>
    </SectionCard>
  );
};

/* ============================================================
 * SEO & Insights Sidebar — advanced version
 * ============================================================ */

/* ---- Animated progress ring ---- */
const ProgressRing = ({
  value,
  size = 84,
  stroke = 7,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value >= 80 ? "#10b981" : value >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition:
              "stroke-dashoffset 500ms cubic-bezier(0.4, 0, 0.2, 1), stroke 300ms",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-lg font-bold leading-none"
          style={{ color }}
        >
          {value}
        </span>
        <span className="text-[9px] uppercase tracking-wider text-slate-400">
          score
        </span>
      </div>
    </div>
  );
};

/* ---- Meter bar with optimal zone ---- */
const Meter = ({
  value,
  max,
  optimalMin,
  optimalMax,
}: {
  value: number;
  max: number;
  optimalMin: number;
  optimalMax: number;
}) => {
  const pct = Math.min((value / max) * 100, 100);
  const inRange = value >= optimalMin && value <= optimalMax;
  const over = value > optimalMax;

  const color = over
    ? "bg-rose-500"
    : inRange
      ? "bg-emerald-500"
      : value < optimalMin
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="absolute inset-y-0 bg-emerald-100"
        style={{
          left: `${(optimalMin / max) * 100}%`,
          width: `${((optimalMax - optimalMin) / max) * 100}%`,
        }}
      />
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${color} transition-all duration-300`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

/* ---- Checklist item ---- */
const CheckItem = ({
  status,
  label,
  hint,
}: {
  status: "pass" | "warn" | "fail";
  label: string;
  hint?: string;
}) => {
  const icon =
    status === "pass" ? (
      <FiCheckCircle className="size-3.5 text-emerald-500" />
    ) : status === "warn" ? (
      <FiAlertCircle className="size-3.5 text-amber-500" />
    ) : (
      <FiXCircle className="size-3.5 text-rose-500" />
    );

  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium leading-tight text-slate-700">
          {label}
        </p>
        {hint && (
          <p className="mt-0.5 text-[10px] leading-tight text-slate-400">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
};

/* ---- Section wrapper for sidebar ---- */
const SidebarSection = ({
  title,
  icon,
  children,
  badge,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h4>
      </div>
      {badge}
    </div>
    {children}
  </div>
);

/* ---- Tiny stat card ---- */
const StatCard = ({
  label,
  value,
  unit,
  ok,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  ok: boolean;
  icon?: React.ReactNode;
}) => (
  <div
    className={`rounded-lg border p-2 transition ${ok
      ? "border-emerald-100 bg-emerald-50/50"
      : "border-slate-100 bg-slate-50/60"
      }`}
  >
    <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-slate-500">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    <div className="mt-0.5 flex items-baseline gap-1">
      <span
        className={`text-sm font-bold tabular-nums ${ok ? "text-emerald-700" : "text-slate-700"
          }`}
      >
        {value}
      </span>
      <span className="text-[9px] text-slate-400">{unit}</span>
    </div>
  </div>
);

/* ---- Main sidebar ---- */
const SeoPreviewSidebar = ({
  images,
  faqsCount,
}: {
  images: ImageItem[];
  faqsCount: number;
}) => {
  const { control } = useFormContext<FormValues>();
  const metaTitle = useWatch({ control, name: "metaTitle" });
  const metaDescription = useWatch({ control, name: "metaDescription" });
  const slug = useWatch({ control, name: "slug" });
  const name = useWatch({ control, name: "name" });
  const h1Tag = useWatch({ control, name: "h1Tag" });
  const description = useWatch({ control, name: "description" });
  const tags = useWatch({ control, name: "tags" });
  const shortDescription = useWatch({ control, name: "shortDescription" });

  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop"
  );

  /* ---------- Derived values ---------- */
  const title =
    metaTitle?.trim() || name || "Product title will appear here";
  const desc =
    metaDescription?.trim() ||
    "Meta description preview will appear here. Aim for 150–160 characters.";
  const url = `yourdomain.com › products › ${slug || "product-slug"}`;
  const img = images[0]?.url;

  const titleLen = title.length;
  const descLen = desc.length;

  /* Strip HTML for word count */
  const stripHtml = (html?: string) =>
    (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  const descText = stripHtml(description);
  const descWords = descText ? descText.split(" ").length : 0;
  const shortText = stripHtml(shortDescription);
  const shortWords = shortText ? shortText.split(" ").length : 0;

  /* ---------- SEO checks ---------- */
  const checks = {
    titleLength: titleLen >= 30 && titleLen <= 60,
    descLength: descLen >= 120 && descLen <= 160,
    hasSlug: !!slug?.trim(),
    slugShort: (slug?.length ?? 0) <= 60,
    hasH1: !!h1Tag?.trim(),
    hasImages: images.length >= 3,
    imagesWithAlt: images.filter((i) => i.alt.trim()).length >= 1,
    hasDescription: descWords >= 100,
    hasShortDesc: shortWords >= 10,
    hasTags: tags.length >= 3,
    hasFaqs: faqsCount >= 2,
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const score = Math.round((passed / total) * 100);

  const scoreLabel =
    score >= 80 ? "Excellent" : score >= 50 ? "Good" : "Needs work";
  const scoreColor =
    score >= 80
      ? "text-emerald-600"
      : score >= 50
        ? "text-amber-600"
        : "text-rose-600";

  /* ---------- Keyword hints (first 3 meaningful words) ---------- */
  const keywords = name
    ? name
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 3)
    : [];

  return (
    <div className="space-y-3.5">
      {/* ============ Score header ============ */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-3.5 shadow-sm">
        <ProgressRing value={score} />
        <div className="min-w-0 flex-1">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            SEO Score
          </h4>
          <p className={`mt-0.5 text-sm font-bold ${scoreColor}`}>
            {scoreLabel}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {passed}/{total} checks passed
          </p>
        </div>
      </div>

      {/* ============ SERP Preview ============ */}
      <SidebarSection
        title="Search Preview"
        icon={<FiLink className="size-3.5" />}
        // badge={
        //   <div className="flex overflow-hidden rounded-md border border-slate-200">
        //     <button
        //       type="button"
        //       onClick={() => setPreviewMode("desktop")}
        //       className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium transition ${previewMode === "desktop"
        //         ? "bg-slate-800 text-white"
        //         : "bg-white text-slate-500 hover:bg-slate-50"
        //         }`}
        //       aria-label="Desktop preview"
        //     >
        //       <FiMonitor className="size-2.5" />
        //     </button>
        //     <button
        //       type="button"
        //       onClick={() => setPreviewMode("mobile")}
        //       className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium transition ${previewMode === "mobile"
        //         ? "bg-slate-800 text-white"
        //         : "bg-white text-slate-500 hover:bg-slate-50"
        //         }`}
        //       aria-label="Mobile preview"
        //     >
        //       <FiSmartphone className="size-2.5" />
        //     </button>
        //   </div>
        // }
      >
        <div
          className={
            previewMode === "mobile"
              ? "mx-auto max-w-55"
              : ""
          }
        >
          <div className="flex items-center gap-2">
            {img ? (
              <Image
                src={img}
                alt=""
                width={22}
                height={22}
                className="size-5.5 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="size-5.5 rounded-full border border-dashed border-slate-300 bg-slate-100" />
            )}
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-slate-800">
                domain
              </p>
              <p className="truncate text-[10px] text-slate-500">
                {url}
              </p>
            </div>
          </div>
          <p className="mt-1.5 line-clamp-2 cursor-pointer text-[15px] font-normal leading-snug text-[#1a0dab] hover:underline">
            {title}
          </p>
          <p className="mt-0.5 line-clamp-3 text-[11px] leading-snug text-slate-600">
            {desc}
          </p>
        </div>
      </SidebarSection>

      {/* ============ Character Limits ============ */}
      <SidebarSection
        title="Character Limits"
        icon={<FiType className="size-3.5" />}
      >
        <div className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-700">
                Title
              </span>
              <span
                className={`text-[10px] font-semibold tabular-nums ${checks.titleLength
                  ? "text-emerald-600"
                  : "text-amber-600"
                  }`}
              >
                {titleLen}
                <span className="text-slate-400">/60</span>
              </span>
            </div>
            <Meter
              value={titleLen}
              max={70}
              optimalMin={30}
              optimalMax={60}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-700">
                Description
              </span>
              <span
                className={`text-[10px] font-semibold tabular-nums ${checks.descLength
                  ? "text-emerald-600"
                  : "text-amber-600"
                  }`}
              >
                {descLen}
                <span className="text-slate-400">/160</span>
              </span>
            </div>
            <Meter
              value={descLen}
              max={180}
              optimalMin={120}
              optimalMax={160}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-700">
                Slug
              </span>
              <span className="text-[10px] font-semibold tabular-nums text-slate-500">
                {slug?.length ?? 0}
                <span className="text-slate-400">/60</span>
              </span>
            </div>
            <Meter
              value={slug?.length ?? 0}
              max={80}
              optimalMin={3}
              optimalMax={60}
            />
          </div>
        </div>
      </SidebarSection>

      {/* ============ Content Stats ============ */}
      <SidebarSection
        title="Content"
        icon={<FiFileText className="size-3.5" />}
      >
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Description"
            value={descWords}
            unit="words"
            ok={descWords >= 100}
          />
          <StatCard
            label="Short desc"
            value={shortWords}
            unit="words"
            ok={shortWords >= 10}
          />
          <StatCard
            label="Images"
            value={images.length}
            unit={`/ ${IMAGE_MAX}`}
            ok={images.length >= 3}
            icon={<FiImage className="size-3" />}
          />
          <StatCard
            label="Tags"
            value={tags.length}
            unit="tags"
            ok={tags.length >= 3}
            icon={<FiHash className="size-3" />}
          />
        </div>
      </SidebarSection>

      {/* ============ Best Practices ============ */}
      <SidebarSection
        title="Best Practices"
        icon={<FiTrendingUp className="size-3.5" />}
        badge={
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
            {passed}/{total}
          </span>
        }
      >
        <div className="space-y-2.5">
          <CheckItem
            status={checks.titleLength ? "pass" : "warn"}
            label="Meta title length"
            hint="Between 30–60 characters"
          />
          <CheckItem
            status={checks.descLength ? "pass" : "warn"}
            label="Meta description length"
            hint="Between 120–160 characters"
          />
          <CheckItem
            status={
              checks.hasH1 && checks.hasSlug ? "pass" : "fail"
            }
            label="H1 tag & slug"
            hint="Required for on-page SEO"
          />
          <CheckItem
            status={checks.slugShort ? "pass" : "warn"}
            label="Slug is concise"
            hint="Keep under 60 characters"
          />
          <CheckItem
            status={checks.hasDescription ? "pass" : "warn"}
            label="Rich description"
            hint="Aim for 100+ words"
          />
          <CheckItem
            status={
              checks.hasImages && checks.imagesWithAlt
                ? "pass"
                : "warn"
            }
            label="Images with alt text"
            hint="At least 3 images, 1 with alt"
          />
          <CheckItem
            status={checks.hasTags ? "pass" : "warn"}
            label="Categorization tags"
            hint="Add 3+ relevant tags"
          />
          <CheckItem
            status={checks.hasFaqs ? "pass" : "warn"}
            label="FAQ section"
            hint="Rich snippets boost CTR"
          />
        </div>
      </SidebarSection>

      {/* ============ Keyword Hints ============ */}
      {keywords.length > 0 && (
        <SidebarSection
          title="Keyword Hints"
          icon={<FiHash className="size-3.5" />}
        >
          <p className="mb-2 text-[10px] text-slate-400">
            Consider including these in your title & description.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw) => {
              const inTitle = title
                .toLowerCase()
                .includes(kw);
              const inDesc = desc.toLowerCase().includes(kw);
              const both = inTitle && inDesc;
              return (
                <span
                  key={kw}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${both
                    ? "bg-emerald-100 text-emerald-700"
                    : inTitle || inDesc
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-500"
                    }`}
                >
                  {kw}
                </span>
              );
            })}
          </div>
        </SidebarSection>
      )}
    </div>
  );
};

/* ============================================================
 * Details Tab (merged view) — declared at module scope
 * ============================================================ */
interface DetailsTabProps {
  isEditMode: boolean;
  slugCheck: string;
  checkingSlug: boolean;
  checkSlugUnique: (slug: string) => void;
  h1TagCheck: string;
  checkingH1Tag: boolean;
  metaTitleCheck: string;
  checkingMetaTitle: boolean;
  checkH1TagUnique: (h1Tag: string) => void;
  checkMetaTitleUnique: (metaTitle: string) => void;
  images: ImageItem[];
  setImages: (images: ImageItem[]) => void;
  openGallery: () => void;
  industries: LookupOption[];
  materials: LookupOption[];
  styles: LookupOption[];
}

const DetailsTab = ({
  isEditMode,
  slugCheck,
  checkingSlug,
  checkSlugUnique,
  h1TagCheck,
  checkingH1Tag,
  metaTitleCheck,
  checkingMetaTitle,
  checkH1TagUnique,
  checkMetaTitleUnique,
  images,
  setImages,
  openGallery,
  industries,
  materials,
  styles,
}: DetailsTabProps) => {
  /*
   * name -> slug / h1Tag / metaTitle auto-fill lives here because it's the
   * lowest common ancestor of BasicTab (owns `name`) and MetaTab (owns
   * h1Tag/metaTitle). Each field mirrors `name` only until the user edits
   * that field directly (tracked by the *Manual flags below), so typing
   * keeps updating the derived fields instead of freezing after the first
   * keystroke.
   */
  const { control, setValue } = useFormContext<FormValues>();
  const name = useWatch({ control, name: "name" });
  const [isSlugManual, setIsSlugManual] = useState(isEditMode);
  const [isH1Manual, setIsH1Manual] = useState(isEditMode);
  const [isMetaTitleManual, setIsMetaTitleManual] = useState(isEditMode);

  useEffect(() => {
    if (!isH1Manual && name !== undefined) {
      setValue("h1Tag", name, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, isH1Manual]);

  useEffect(() => {
    if (!isMetaTitleManual && name !== undefined) {
      setValue("metaTitle", name, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, isMetaTitleManual]);

  return (
    <div className="space-y-5">
      <BasicTab
        isEditMode={isEditMode}
        slugCheck={slugCheck}
        checkingSlug={checkingSlug}
        checkSlugUnique={checkSlugUnique}
        isSlugManual={isSlugManual}
        setIsSlugManual={setIsSlugManual}
      />
      <MetaTab
        h1TagCheck={h1TagCheck}
        checkingH1Tag={checkingH1Tag}
        metaTitleCheck={metaTitleCheck}
        checkingMetaTitle={checkingMetaTitle}
        checkH1TagUnique={checkH1TagUnique}
        checkMetaTitleUnique={checkMetaTitleUnique}
        isH1Manual={isH1Manual}
        setIsH1Manual={setIsH1Manual}
        isMetaTitleManual={isMetaTitleManual}
        setIsMetaTitleManual={setIsMetaTitleManual}
      />
      <ContentTab />
      <ImagesTab
        images={images}
        setImages={setImages}
        openGallery={openGallery}
      />
      <PricingTab />
      <CategorizationTab
        industries={industries}
        materials={materials}
        styles={styles}
      />
      <SettingsTab />
    </div>
  );
};

/* ============================================================
 * Main Component
 * ============================================================ */
interface AddProductProps {
  onCancel: () => void;
  selectedData?: any;
  isEditMode?: boolean;
  refetch?: () => void;
}

const AddProduct = ({
  onCancel,
  selectedData,
  isEditMode = false,
  refetch,
}: AddProductProps) => {
  const companyMember = useAppSelector(
    (state) => state.currentCompanyMember?.companyMember
  );

  /* ---------- Dropdown data ---------- */
  const [industries, setIndustries] = useState<LookupOption[]>([]);
  const [materials, setMaterials] = useState<LookupOption[]>([]);
  const [styles, setStyles] = useState<LookupOption[]>([]);

  /* ---------- Images ---------- */
  const [images, setImages] = useState<ImageItem[]>(
    toImageArray(selectedData?.imageUrl)
  );

  /* ---------- FAQs ---------- */
  const [faqs, setFaqs] = useState<FAQItem[]>(cleanFaqs(selectedData?.faqs));
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [currentFaq, setCurrentFaq] = useState<FAQItem>({
    question: "",
    answer: "",
    order: 0,
  });

  /* ---------- Gallery modal ---------- */
  const [showGallery, setShowGallery] = useState(false);

  /* ---------- Uniqueness check messages ---------- */
  const [slugCheck, setSlugCheck] = useState("");
  const [h1TagCheck, setH1TagCheck] = useState("");
  const [metaTitleCheck, setMetaTitleCheck] = useState("");

  /* ---------- Uniqueness check queries ---------- */
  const [
    checkSlug,
    { loading: checkingSlug, data: slugData, error: slugError },
  ] = useLazyQuery<any>(CHECK_PRODUCT_SLUG_UNIQUE, {
    fetchPolicy: "network-only",
  });
  const [
    checkH1Tag,
    { loading: checkingH1Tag, data: h1TagData, error: h1TagError },
  ] = useLazyQuery<any>(CHECK_PRODUCT_H1_TAG_UNIQUE, {
    fetchPolicy: "network-only",
  });
  const [
    checkMetaTitle,
    {
      loading: checkingMetaTitle,
      data: metaTitleData,
      error: metaTitleError,
    },
  ] = useLazyQuery<any>(CHECK_PRODUCT_META_TITLE_UNIQUE, {
    fetchPolicy: "network-only",
  });

  const { data: industriesData, error: industriesError } = useQuery<any>(
    GET_INDUSTRIES,
    { fetchPolicy: "network-only" }
  );
  const { data: materialsData, error: materialsError } = useQuery<any>(
    GET_MATERIALS,
    { fetchPolicy: "network-only" }
  );
  const { data: stylesData, error: stylesError } = useQuery<any>(
    GET_STYLES,
    { fetchPolicy: "network-only" }
  );

  useEffect(() => {
    if (slugData?.checkProductSlugUnique) {
      setSlugCheck(
        slugData.checkProductSlugUnique.isUnique
          ? "✓ Slug is available"
          : "✗ Slug is already taken"
      );
    }
    if (slugError) toast.error("Failed to check slug availability");
  }, [slugData, slugError]);

  useEffect(() => {
    if (h1TagData?.checkProductH1TagUnique) {
      setH1TagCheck(
        h1TagData.checkProductH1TagUnique.isUnique
          ? "✓ H1 Tag is available"
          : "✗ H1 Tag is already taken"
      );
    }
    if (h1TagError) toast.error("Failed to check H1 Tag availability");
  }, [h1TagData, h1TagError]);

  useEffect(() => {
    if (metaTitleData?.checkProductMetaTitleUnique) {
      setMetaTitleCheck(
        metaTitleData.checkProductMetaTitleUnique.isUnique
          ? "✓ Meta Title is available"
          : "✗ Meta Title is already taken"
      );
    }
    if (metaTitleError)
      toast.error("Failed to check Meta Title availability");
  }, [metaTitleData, metaTitleError]);

  /* ---------- Mutations ---------- */
  const [createProduct, { loading: createLoading }] =
    useMutation<any>(CREATE_PRODUCT);
  const [updateProduct, { loading: updateLoading }] =
    useMutation<any>(UPDATE_PRODUCT);
  const isSubmitting = createLoading || updateLoading;

  /* ---------- Load dropdown data ---------- */
  useEffect(() => {
    if (industriesData?.findAllIndustries)
      setIndustries(industriesData.findAllIndustries);
    if (industriesError) toast.error("Failed to load industries");
  }, [industriesData, industriesError]);

  useEffect(() => {
    if (materialsData?.findAllMaterials)
      setMaterials(materialsData.findAllMaterials);
    if (materialsError) toast.error("Failed to load materials");
  }, [materialsData, materialsError]);

  useEffect(() => {
    if (stylesData?.findAllStyles)
      setStyles(stylesData.findAllStyles);
    if (stylesError) toast.error("Failed to load styles");
  }, [stylesData, stylesError]);

  /* ---------- Default values ---------- */
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
      industry:
        selectedData?.industry?.id || selectedData?.industry || null,
      material:
        selectedData?.material?.id || selectedData?.material || null,
      style: selectedData?.style?.id || selectedData?.style || null,
      tags: selectedData?.tags || [],
      isFeatured: selectedData?.isFeatured || false,
      lowPrice: selectedData?.lowPrice ?? null,
      highPrice: selectedData?.highPrice ?? null,
      moq: selectedData?.moq || "",
    }),
    [selectedData]
  );

  /* ---------- FAQ handlers ---------- */
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
      const updated = [...faqs];
      updated[editingFaqIndex] = {
        ...currentFaq,
        order: editingFaqIndex,
      };
      setFaqs(updated);
      setEditingFaqIndex(null);
      setCurrentFaq({
        question: "",
        answer: "",
        order: updated.length,
      });
    } else {
      const updated = [...faqs, { ...currentFaq, order: faqs.length }];
      setFaqs(updated);
      setCurrentFaq({
        question: "",
        answer: "",
        order: updated.length,
      });
    }
  };

  const editFaq = (index: number) => {
    setCurrentFaq(faqs[index]);
    setEditingFaqIndex(index);
  };

  const deleteFaq = (index: number) => {
    const updated = faqs
      .filter((_, i) => i !== index)
      .map((f, i) => ({ ...f, order: i }));
    setFaqs(updated);
    if (editingFaqIndex === index) {
      setEditingFaqIndex(null);
      setCurrentFaq({
        question: "",
        answer: "",
        order: updated.length,
      });
    } else if (editingFaqIndex !== null && editingFaqIndex > index) {
      setEditingFaqIndex(editingFaqIndex - 1);
    }
  };

  const cancelEditFaq = () => {
    setEditingFaqIndex(null);
    setCurrentFaq({
      question: "",
      answer: "",
      order: faqs.length,
    });
  };

  /* ---------- Gallery handlers ---------- */
  const handleGalleryClose = () => setShowGallery(false);
  const handleGallerySelect = (selected: any[]) => {
    if (!selected.length) return;
    const remainingSlots = IMAGE_MAX - images.length;
    if (remainingSlots <= 0) {
      toast.error(`You can add up to ${IMAGE_MAX} images`);
      return;
    }
    const newImages = selected
      .slice(0, remainingSlots)
      .map((img) => ({ url: img.url, alt: img.alt || "" }));
    setImages((prev) => [...prev, ...newImages]);
    setShowGallery(false);
  };

  /* ---------- Submit ---------- */
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
      toast.error(
        "Unable to identify the current user. Please refresh and try again."
      );
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
        const result = await updateProduct({
          variables: { id: selectedData.id, input: clean },
        });
        if (result.data?.updateProduct?.success) {
          toast.success(
            result.data.updateProduct.message ||
            "Product updated"
          );
          refetch?.();
          onCancel();
        } else {
          toast.error(
            result.data?.updateProduct?.message ||
            "Update failed"
          );
        }
      } else {
        const result = await createProduct({
          variables: { input: clean },
        });
        if (result.data?.createProduct?.success) {
          toast.success(
            result.data.createProduct.message ||
            "Product created"
          );
          refetch?.();
          onCancel();
        } else {
          toast.error(
            result.data?.createProduct?.message ||
            "Creation failed"
          );
        }
      }
    } catch (error: any) {
      toast.error(
        error?.message || "Operation failed. Please try again."
      );
    }
  };

  /* ---------- Uniqueness check callbacks ---------- */
  const checkSlugUnique = (slug: string) => {
    if (!slug?.trim()) {
      toast.error("Please enter a slug");
      return;
    }
    setSlugCheck("");
    checkSlug({
      variables: {
        slug,
        excludeId: isEditMode ? selectedData?.id : undefined,
      },
    });
  };

  const checkH1TagUnique = (h1Tag: string) => {
    if (!h1Tag?.trim()) {
      toast.error("Please enter an H1 tag");
      return;
    }
    setH1TagCheck("");
    checkH1Tag({
      variables: {
        h1Tag,
        excludeId: isEditMode ? selectedData?.id : undefined,
      },
    });
  };

  const checkMetaTitleUnique = (metaTitle: string) => {
    if (!metaTitle?.trim()) {
      toast.error("Please enter a meta title");
      return;
    }
    setMetaTitleCheck("");
    checkMetaTitle({
      variables: {
        metaTitle,
        excludeId: isEditMode ? selectedData?.id : undefined,
      },
    });
  };

  /* ---------- Tabs ---------- */
  const tabs: TabConfig[] = [
    {
      id: "details",
      label: "Details",
      content: (
        <DetailsTab
          isEditMode={isEditMode}
          slugCheck={slugCheck}
          checkingSlug={checkingSlug}
          checkSlugUnique={checkSlugUnique}
          h1TagCheck={h1TagCheck}
          checkingH1Tag={checkingH1Tag}
          metaTitleCheck={metaTitleCheck}
          checkingMetaTitle={checkingMetaTitle}
          checkH1TagUnique={checkH1TagUnique}
          checkMetaTitleUnique={checkMetaTitleUnique}
          images={images}
          setImages={setImages}
          openGallery={() => setShowGallery(true)}
          industries={industries}
          materials={materials}
          styles={styles}
        />
      ),
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
  ];

  return (
    <>
      <DynamicFormPopup<FormValues>
        open={true}
        onOpenChange={onCancel}
        title={isEditMode ? "Edit Product" : "Create Product"}
        subtitle={
          isEditMode
            ? "Update the details below and save your changes"
            : "Add a new product to your website catalog"
        }
        tabs={tabs}
        defaultValues={defaultValues}
        validationSchema={productSchema}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        submitLabel={isEditMode ? "Update product" : "Create product"}
        size="2xl"
        sidebar={
          <SeoPreviewSidebar
            images={images}
            faqsCount={faqs.length}
          />
        }
      />

      {showGallery && (
        <WebsiteGalleryModel
          onCancel={handleGalleryClose}
          onSentSelected={handleGallerySelect}
          mode="multiple"
        />
      )}
    </>
  );
};

export default AddProduct;