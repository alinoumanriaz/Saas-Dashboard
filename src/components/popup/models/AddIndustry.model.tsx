import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Box, LoaderCircle, Search, Check, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { generateSlug } from "@/helpers/slug-maker";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import {
  CHECK_INDUSTRY_H1_TAG_UNIQUE,
  CHECK_INDUSTRY_META_TITLE_UNIQUE,
  CHECK_INDUSTRY_SLUG_UNIQUE,
  CREATE_INDUSTRY,
  UPDATE_INDUSTRY,
} from "@/graphql/current-website-queries/industry.query";
import {
  FiCheckCircle,
  FiEdit2,
  FiFileText,
  FiHelpCircle,
  FiImage,
  FiSettings,
  FiTrash2,
  FiUploadCloud,
  FiX,
  FiXCircle,
  FiLayers,
  FiGrid,
  FiTag,
} from "react-icons/fi";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import TiptopTextEditor from "@/components/TiptopTextEditor";
import Image from "next/image";
import WebsiteGalleryModel from "./WebsiteGallery.model";
import { removeTypename } from "@/helpers/removetypename";
import { toast } from "sonner";

/* ============================================================
 * Constants & Types
 * ============================================================ */
const META_DESCRIPTION_MAX = 160;
const ALT_TEXT_MAX = 125;

interface ImageItem {
  url: string;
  alt: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

type ImageMode = "imageUrl" | "bannerImage" | "iconImageUrl";

interface AddIndustryProps {
  onCancel: () => void;
  selectedData?: any;
  isEditMode: boolean;
  refetch?: () => void;
}

/* ============================================================
 * Image normalisation — handles string | object | nested | array
 * ============================================================ */
const toImageItem = (input: any): ImageItem | null => {
  if (!input) return null;
  if (typeof input === "string") return { url: input, alt: "" };
  if (typeof input === "object") {
    if (input.image && (input.image.url || typeof input.image === "string")) {
      return toImageItem(input.image);
    }
    if (input.url) return { url: input.url, alt: input.alt || "" };
  }
  return null;
};

const toSingleImage = (input: any): ImageItem | null => {
  if (Array.isArray(input)) return toImageItem(input[0]);
  return toImageItem(input);
};

/* ============================================================
 * Zod Schema
 * ============================================================ */
const imageObjectSchema = z.object({
  url: z.string().min(1, "Image is required"),
  alt: z.string().max(ALT_TEXT_MAX).default(""),
});

const industryFormSchema = z.object({
  name: z.string().min(1, "Industry name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Lowercase letters, numbers, and hyphens only",
    }),
  h1Tag: z.string().min(1, "H1 Tag is required"),
  metaTitle: z.string().min(1, "Meta Title is required"),
  metaDescription: z.string().optional(),
  shortDescription: z.string().optional(),
  content: z.string().optional(),
  imageUrl: imageObjectSchema.nullable().optional(), // single
  bannerImage: imageObjectSchema.nullable().optional(), // single
  iconImageUrl: imageObjectSchema.nullable().optional(), // single
  faqs: z.array(z.any()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

type FormValues = z.infer<typeof industryFormSchema>;

/* ============================================================
 * Reusable inline UI helpers (mirror of AddProduct)
 * ============================================================ */
const FieldErrorMsg = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600">
      <FiXCircle className="size-3.5 shrink-0" />
      {message}
    </p>
  ) : null;

const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
    <Info className="size-3" /> {children}
  </p>
);

const SectionHeader = ({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-primary/90 ring-1 ring-indigo-100">
      {icon}
    </div>
    <div>
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </div>
  </div>
);

const Section = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    {children}
  </div>
);

const UniquenessResult = ({ status }: { status: string }) =>
  status ? (
    <p
      className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${
        status.startsWith("✓") ? "text-emerald-600" : "text-rose-600"
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
 * Reusable single-image uploader (with inline alt editing)
 * ============================================================ */
const ImageUploadCard = ({
  label,
  hint,
  image,
  aspect = "square",
  onPick,
  onRemove,
}: {
  label: string;
  hint?: string;
  image: ImageItem | null | undefined;
  aspect?: "square" | "banner" | "icon";
  onPick: () => void;
  onRemove: () => void;
}) => {
  const container =
    aspect === "banner"
      ? "aspect-[3/1] w-full"
      : aspect === "icon"
        ? "size-24"
        : "aspect-square w-full";

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
      </div>

      <div
        className={`group relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 transition hover:border-indigo-400 ${container}`}
      >
        {image?.url ? (
          <>
            <Image
              src={image.url}
              alt={image.alt || label}
              fill
              className={
                aspect === "icon"
                  ? "object-contain p-2"
                  : "object-cover"
              }
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
              <button
                type="button"
                onClick={onPick}
                className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-800 shadow hover:bg-white"
              >
                Change
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="rounded-full bg-rose-500/90 px-3 py-1 text-[11px] font-medium text-white shadow hover:bg-rose-600"
              >
                Remove
              </button>
            </div>
            {!image.alt && (
              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
                Missing alt
              </span>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={onPick}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400 transition hover:text-primary/90"
          >
            <FiUploadCloud className="size-6" />
            <span className="text-xs font-medium">Upload</span>
          </button>
        )}
      </div>
    </div>
  );
};

/* ============================================================
 * Main Component
 * ============================================================ */
const AddIndustry = ({
  onCancel,
  selectedData,
  isEditMode = false,
  refetch,
}: AddIndustryProps) => {
  /* ---------- Unique-check state ---------- */
  const [isSlugManual, setIsSlugManual] = useState(isEditMode);
  const [isH1Manual, setIsH1Manual] = useState(isEditMode);
  const [isMetaTitleManual, setIsMetaTitleManual] = useState(isEditMode);
  const [slugCheck, setSlugCheck] = useState("");
  const [h1TagCheck, setH1TagCheck] = useState("");
  const [metaTitleCheck, setMetaTitleCheck] = useState("");

  /* ---------- Gallery & alt edit ---------- */
  const [showGallery, setShowGallery] = useState(false);
  const [galleryMode, setGalleryMode] = useState<ImageMode>("imageUrl");
  // sentinel: "imageUrl" | "bannerImage" | "iconImageUrl" | null
  const [editingAltOf, setEditingAltOf] = useState<ImageMode | null>(null);
  const [altInput, setAltInput] = useState("");

  /* ---------- FAQs ---------- */
  const [currentFaq, setCurrentFaq] = useState<FaqItem>({
    question: "",
    answer: "",
  });
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);


  /* ---------- Form ---------- */
  const {
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(industryFormSchema),
    defaultValues: {
      name: selectedData?.name || "",
      slug: selectedData?.slug || "",
      h1Tag: selectedData?.h1Tag || "",
      metaTitle: selectedData?.metaTitle || "",
      metaDescription: selectedData?.metaDescription || "",
      shortDescription: selectedData?.shortDescription || "",
      content: selectedData?.content || "",
      imageUrl: toSingleImage(selectedData?.imageUrl),
      bannerImage: toSingleImage(selectedData?.bannerImage),
      iconImageUrl: toSingleImage(
        selectedData?.iconImageUrl || selectedData?.iconName
      ),
      faqs: selectedData?.faqs || [],
      status: selectedData?.status || "DRAFT",
    },
  });

  // Rehydrate when selectedData arrives late (async parent fetch)
  useEffect(() => {
    if (!selectedData) return;
    reset({
      name: selectedData.name || "",
      slug: selectedData.slug || "",
      h1Tag: selectedData.h1Tag || "",
      metaTitle: selectedData.metaTitle || "",
      metaDescription: selectedData.metaDescription || "",
      shortDescription: selectedData.shortDescription || "",
      content: selectedData.content || "",
      imageUrl: toSingleImage(selectedData.imageUrl),
      bannerImage: toSingleImage(selectedData.bannerImage),
      iconImageUrl: toSingleImage(
        selectedData.iconImageUrl || selectedData.iconName
      ),
      faqs: selectedData.faqs || [],
      status: selectedData.status || "DRAFT",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedData?.id]);

  const name = watch("name");
  const slug = watch("slug");
  const h1Tag = watch("h1Tag");
  const metaTitle = watch("metaTitle");
  const metaDescription = watch("metaDescription");
  const descLength = metaDescription?.length ?? 0;
  const descTone =
    descLength > META_DESCRIPTION_MAX
      ? "text-rose-500"
      : descLength > 150
        ? "text-amber-500"
        : "text-emerald-600";

  const imageUrl = watch("imageUrl");
  const bannerImage = watch("bannerImage");
  const iconImageUrl = watch("iconImageUrl");
  const faqs = watch("faqs") ?? [];

  /* ---------- Queries ---------- */
  const [
    checkSlug,
    { loading: checkingSlug, data: slugData, error: slugError },
  ] = useLazyQuery<any>(CHECK_INDUSTRY_SLUG_UNIQUE, {
    fetchPolicy: "network-only",
  });
  const [
    checkH1Tag,
    { loading: checkingH1Tag, data: h1TagData, error: h1TagError },
  ] = useLazyQuery<any>(CHECK_INDUSTRY_H1_TAG_UNIQUE, {
    fetchPolicy: "network-only",
  });
  const [
    checkMetaTitle,
    { loading: checkingMetaTitle, data: metaTitleData, error: metaTitleError },
  ] = useLazyQuery<any>(CHECK_INDUSTRY_META_TITLE_UNIQUE, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (slugData?.checkIndustrySlugUnique) {
      setSlugCheck(
        slugData.checkIndustrySlugUnique.isUnique
          ? "✓ Slug is available"
          : "✗ Slug is already taken"
      );
    }
    if (slugError) toast.error("Failed to check slug availability");
  }, [slugData, slugError]);

  useEffect(() => {
    if (h1TagData?.checkIndustryH1TagUnique) {
      setH1TagCheck(
        h1TagData.checkIndustryH1TagUnique.isUnique
          ? "✓ H1 Tag is available"
          : "✗ H1 Tag is already taken"
      );
    }
    if (h1TagError) toast.error("Failed to check H1 Tag");
  }, [h1TagData, h1TagError]);

  useEffect(() => {
    if (metaTitleData?.checkIndustryMetaTitleUnique) {
      setMetaTitleCheck(
        metaTitleData.checkIndustryMetaTitleUnique.isUnique
          ? "✓ Meta Title is available"
          : "✗ Meta Title is already taken"
      );
    }
    if (metaTitleError) toast.error("Failed to check Meta Title");
  }, [metaTitleData, metaTitleError]);

  /* ---------- Mutations ---------- */
  const [createIndustry, { loading: createLoading }] =
    useMutation<any>(CREATE_INDUSTRY);
  const [updateIndustry, { loading: updateLoading }] =
    useMutation<any>(UPDATE_INDUSTRY);
  const isSubmitting = createLoading || updateLoading;

  /* ---------- Unique check handlers ---------- */
  const checkSlugUnique = (s: string) => {
    if (!s?.trim()) {
      toast.error("Please enter a slug");
      return;
    }
    setSlugCheck("");
    checkSlug({
      variables: {
        slug: s,
        excludeId: isEditMode ? selectedData?.id : undefined,
      },
    });
  };
  const checkH1TagUnique = (h: string) => {
    if (!h?.trim()) {
      toast.error("Please enter an H1 tag");
      return;
    }
    setH1TagCheck("");
    checkH1Tag({
      variables: {
        h1Tag: h,
        excludeId: isEditMode ? selectedData?.id : undefined,
      },
    });
  };
  const checkMetaTitleUnique = (m: string) => {
    if (!m?.trim()) {
      toast.error("Please enter a meta title");
      return;
    }
    setMetaTitleCheck("");
    checkMetaTitle({
      variables: {
        metaTitle: m,
        excludeId: isEditMode ? selectedData?.id : undefined,
      },
    });
  };

  /* ---------- Submit ---------- */
  const onSubmit = async (values: FormValues) => {
    const clean = removeTypename(values);

    // Ensure all image fields are pure { url, alt } objects
    const payload = {
      ...clean,
      imageUrl: clean.imageUrl
        ? { url: clean.imageUrl.url, alt: clean.imageUrl.alt || "" }
        : null,
      bannerImage: clean.bannerImage
        ? { url: clean.bannerImage.url, alt: clean.bannerImage.alt || "" }
        : null,
      iconImageUrl: clean.iconImageUrl
        ? { url: clean.iconImageUrl.url, alt: clean.iconImageUrl.alt || "" }
        : null,
    };

    try {
      if (isEditMode && selectedData?.id) {
        const result = await updateIndustry({
          variables: { id: selectedData.id, input: payload },
        });
        if (result.data?.updateIndustry?.success) {
          toast.success(
            result.data.updateIndustry.message || "Industry updated"
          );
          refetch?.();
          onCancel();
        } else {
          toast.error(result.data?.updateIndustry?.message || "Update failed");
        }
      } else {
        const result = await createIndustry({ variables: { input: payload } });
        if (result.data?.createIndustry?.success) {
          toast.success(
            result.data.createIndustry.message || "Industry created"
          );
          refetch?.();
          onCancel();
        } else {
          toast.error(result.data?.createIndustry?.message || "Creation failed");
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Operation failed. Please try again.");
    }
  };

  /* ---------- Image handlers ---------- */
  const openGallery = (mode: ImageMode) => {
    setGalleryMode(mode);
    setShowGallery(true);
  };
  const handleGalleryClose = () => setShowGallery(false);

  const handleGallerySelect = (selected: any[]) => {
    setShowGallery(false);
    if (!selected?.length) return;
    const item = toImageItem(selected[0]);
    if (!item?.url) {
      toast.error("Selected image has no URL");
      return;
    }
    setValue(galleryMode, item, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const removeImage = (mode: ImageMode) =>
    setValue(mode, null, { shouldValidate: true, shouldDirty: true });

  const startEditAlt = (mode: ImageMode) => {
    setEditingAltOf(mode);
    const current =
      mode === "imageUrl"
        ? imageUrl
        : mode === "bannerImage"
          ? bannerImage
          : iconImageUrl;
    setAltInput(current?.alt ?? "");
  };
  const cancelEditAlt = () => {
    setEditingAltOf(null);
    setAltInput("");
  };
  const saveAlt = () => {
    if (!editingAltOf) return;
    const current =
      editingAltOf === "imageUrl"
        ? imageUrl
        : editingAltOf === "bannerImage"
          ? bannerImage
          : iconImageUrl;
    if (!current) {
      cancelEditAlt();
      return;
    }
    setValue(
      editingAltOf,
      { ...current, alt: altInput.trim() },
      { shouldValidate: true, shouldDirty: true }
    );
    cancelEditAlt();
  };

  /* ---------- Validation summary ---------- */
  const validation = {
    hasPrimary: !!imageUrl?.url,
    hasAlt:
      !!imageUrl?.alt?.trim() ||
      !!bannerImage?.alt?.trim() ||
      !!iconImageUrl?.alt?.trim(),
    slotsFilled: [imageUrl, bannerImage, iconImageUrl].filter((i) => !!i?.url)
      .length,
  };
  const checks = [
    { label: "Primary image set", ok: validation.hasPrimary },
    {
      label: "Alt text added",
      ok: validation.hasAlt,
    },
    {
      label: "Optional slots filled",
      ok: validation.slotsFilled >= 2,
    },
  ];

  /* ---------- FAQ handlers ---------- */
  const handleFaqChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCurrentFaq((prev) => ({ ...prev, [name]: value }));
  };
  const addOrUpdateFaq = () => {
    const q = currentFaq.question.trim();
    const a = currentFaq.answer.trim();
    if (!q) {
      toast.error("FAQ question is required");
      return;
    }
    if (!a) {
      toast.error("FAQ answer is required");
      return;
    }
    const cur = faqs ?? [];
    if (editingFaqIndex !== null) {
      setValue(
        "faqs",
        cur.map((f, i) =>
          i === editingFaqIndex ? { question: q, answer: a } : f
        ),
        { shouldValidate: true, shouldDirty: true }
      );
      toast.success("FAQ updated");
    } else {
      setValue("faqs", [...cur, { question: q, answer: a }], {
        shouldValidate: true,
        shouldDirty: true,
      });
      toast.success("FAQ added");
    }
    setCurrentFaq({ question: "", answer: "" });
    setEditingFaqIndex(null);
  };
  const editFaq = (i: number) => {
    const f = faqs?.[i];
    if (!f) return;
    setCurrentFaq({ question: f.question, answer: f.answer });
    setEditingFaqIndex(i);
  };
  const deleteFaq = (i: number) => {
    setValue(
      "faqs",
      (faqs ?? []).filter((_, idx) => idx !== i),
      { shouldValidate: true, shouldDirty: true }
    );
    if (editingFaqIndex === i) {
      setEditingFaqIndex(null);
      setCurrentFaq({ question: "", answer: "" });
    }
  };
  const cancelEditFaq = () => {
    setEditingFaqIndex(null);
    setCurrentFaq({ question: "", answer: "" });
  };

  /* ============================================================
   * Tab layout
   * ============================================================ */
  const [activeTab, setActiveTab] = useState<
    "basic" | "content" | "media" | "details"
  >("basic");

  const tabs: {
    id: typeof activeTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "basic", label: "Basics", icon: <Box className="size-4" /> },
    {
      id: "content",
      label: "Content & SEO",
      icon: <FiFileText className="size-4" />,
    },
    { id: "media", label: "Media", icon: <FiImage className="size-4" /> },
    {
      id: "details",
      label: "Details & Settings",
      icon: <FiLayers className="size-4" />,
    },
  ];

  /* ============================================================
   * Render helpers for the media tab
   * ============================================================ */
  const renderAltEditor = (mode: ImageMode) => {
    const current =
      mode === "imageUrl"
        ? imageUrl
        : mode === "bannerImage"
          ? bannerImage
          : iconImageUrl;
    if (editingAltOf !== mode || !current) return null;
    return (
      <div className="absolute inset-0 flex flex-col bg-slate-900/90 p-2">
        <Textarea
          value={altInput}
          onChange={(e) => setAltInput(e.target.value)}
          placeholder="Describe this image"
          className="flex-1 resize-none rounded border border-slate-500 bg-transparent p-1.5 text-xs text-white placeholder:text-slate-400"
          maxLength={ALT_TEXT_MAX}
          autoFocus
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[10px] text-slate-300">
            {altInput.length}/{ALT_TEXT_MAX}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={saveAlt}
              className="rounded bg-emerald-500 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-emerald-600"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancelEditAlt}
              className="rounded bg-slate-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-slate-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderImageCard = (mode: ImageMode, label: string) => {
    const img =
      mode === "imageUrl"
        ? imageUrl
        : mode === "bannerImage"
          ? bannerImage
          : iconImageUrl;

    return (
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-slate-600">{label}</span>
          {img?.url && (
            <button
              type="button"
              onClick={() => startEditAlt(mode)}
              className="text-[10px] font-medium text-primary/90 hover:underline"
            >
              {img.alt ? "Edit alt" : "Add alt"}
            </button>
          )}
        </div>

        <div className="group relative aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 transition hover:border-indigo-400">
          {img?.url ? (
            <>
              <Image
                src={img.url}
                alt={img.alt || label}
                fill
                className="object-cover"
              />
              {editingAltOf === mode ? (
                renderAltEditor(mode)
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openGallery(mode)}
                      className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-800 shadow hover:bg-white"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(mode)}
                      className="rounded-full bg-rose-500/90 px-3 py-1 text-[11px] font-medium text-white shadow hover:bg-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                  {img.alt ? (
                    <button
                      type="button"
                      onClick={() => startEditAlt(mode)}
                      className="absolute inset-x-0 bottom-0 truncate bg-black/60 p-1.5 text-left text-[11px] text-white hover:bg-black/75"
                      title="Edit alt text"
                    >
                      {img.alt}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditAlt(mode)}
                      className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-medium text-white shadow-md hover:bg-amber-600"
                    >
                      <FiEdit2 className="size-3" /> Add alt text
                    </button>
                  )}
                </>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => openGallery(mode)}
              className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400 transition hover:text-primary/90"
            >
              <FiUploadCloud className="size-7" />
              <span className="text-xs font-medium">Add image</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ============================================================
   * Render
   * ============================================================ */
  return (
    <>
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-6xl! p-0 overflow-hidden bg-slate-50">
          {/* ============ Header ============ */}
          <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-indigo-500/30">
                  <FiGrid size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    {isEditMode ? "Edit Industry" : "Add New Industry"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    {isEditMode
                      ? "Update industry details and metadata."
                      : "Fill in the sections below. Required fields marked with *"}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mt-4 -mb-4 overflow-x-auto">
              {tabs.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                      active
                        ? "border-indigo-500 text-primary/90"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                );
              })}
            </div>
          </DialogHeader>

          {/* ============ Body ============ */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <ScrollArea className="h-[calc(90vh-220px)]">
              <div className="px-6 py-5 space-y-5">
                {/* ---------- BASIC ---------- */}
                {activeTab === "basic" && (
                  <div className="space-y-5">
                    <Section>
                      <SectionHeader
                        title="Industry Identity"
                        desc="The name, URL slug, and short summary for this industry."
                        icon={<Box className="size-4" />}
                      />
                      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                        <div>
                          <FieldLabel htmlFor="industry-name">
                            Industry name{" "}
                            <span className="text-rose-500">*</span>
                          </FieldLabel>
                          <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                              <Input
                                id="industry-name"
                                placeholder="e.g., Web Development"
                                {...field}
                                className="mt-1"
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (!isSlugManual)
                                    setValue(
                                      "slug",
                                      generateSlug(e.target.value),
                                      {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                      }
                                    );
                                }}
                              />
                            )}
                          />
                          <FieldErrorMsg message={errors.name?.message} />
                        </div>

                        <div>
                          <FieldLabel htmlFor="industry-slug">
                            Slug <span className="text-rose-500">*</span>
                          </FieldLabel>
                          <div className="flex gap-2 mt-1">
                            <Controller
                              name="slug"
                              control={control}
                              render={({ field }) => (
                                <Input
                                  id="industry-slug"
                                  placeholder="industry-slug"
                                  {...field}
                                  onFocus={() => setIsSlugManual(true)}
                                  onBlur={() => {
                                    if (
                                      field.value === generateSlug(name ?? "")
                                    )
                                      setIsSlugManual(false);
                                  }}
                                />
                              )}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => checkSlugUnique(slug)}
                              disabled={checkingSlug || !slug?.trim()}
                              className="shrink-0 bg-primary/90 text-white hover:bg-primary"
                            >
                              {checkingSlug ? (
                                <LoaderCircle className="size-4 animate-spin" />
                              ) : (
                                "Check"
                              )}
                            </Button>
                          </div>
                          <UniquenessResult status={slugCheck} />
                          <FieldErrorMsg message={errors.slug?.message} />
                        </div>

                        <div className="md:col-span-2">
                          <FieldLabel htmlFor="industry-short-desc">
                            Short description
                          </FieldLabel>
                          <Controller
                            name="shortDescription"
                            control={control}
                            render={({ field }) => (
                              <Textarea
                                id="industry-short-desc"
                                rows={2}
                                placeholder="A concise summary for listing pages"
                                className="mt-1"
                                {...field}
                              />
                            )}
                          />
                          <Hint>
                            Appears in listings. Keep it under 120 characters.
                          </Hint>
                        </div>
                      </div>
                    </Section>

                    <Section>
                      <SectionHeader
                        title="Search Engine Optimization"
                        desc="Help people find your industry on search engines."
                        icon={<Search className="size-4" />}
                      />
                      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                        <div>
                          <FieldLabel htmlFor="industry-h1">
                            H1 tag <span className="text-rose-500">*</span>
                          </FieldLabel>
                          <div className="flex gap-2 mt-1">
                            <Controller
                              name="h1Tag"
                              control={control}
                              render={({ field }) => (
                                <Input
                                  id="industry-h1"
                                  placeholder="e.g., Professional Web Development Services"
                                  {...field}
                                  onFocus={() => setIsH1Manual(true)}
                                  onBlur={() => {
                                    if (field.value === (name ?? ""))
                                      setIsH1Manual(false);
                                  }}
                                />
                              )}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => checkH1TagUnique(h1Tag)}
                              disabled={checkingH1Tag || !h1Tag?.trim()}
                              className="shrink-0 bg-primary/90 text-white hover:bg-primary"
                            >
                              {checkingH1Tag ? (
                                <LoaderCircle className="size-4 animate-spin" />
                              ) : (
                                "Check"
                              )}
                            </Button>
                          </div>
                          <UniquenessResult status={h1TagCheck} />
                          <FieldErrorMsg message={errors.h1Tag?.message} />
                        </div>

                        <div>
                          <FieldLabel htmlFor="meta-title">
                            Meta title{" "}
                            <span className="text-rose-500">*</span>
                          </FieldLabel>
                          <div className="flex gap-2 mt-1">
                            <Controller
                              name="metaTitle"
                              control={control}
                              render={({ field }) => (
                                <Input
                                  id="meta-title"
                                  placeholder="e.g., Web Development Services | Your Company"
                                  {...field}
                                  onFocus={() => setIsMetaTitleManual(true)}
                                  onBlur={() => {
                                    if (field.value === (name ?? ""))
                                      setIsMetaTitleManual(false);
                                  }}
                                />
                              )}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => checkMetaTitleUnique(metaTitle)}
                              disabled={checkingMetaTitle || !metaTitle?.trim()}
                              className="shrink-0 bg-primary/90 text-white hover:bg-primary"
                            >
                              {checkingMetaTitle ? (
                                <LoaderCircle className="size-4 animate-spin" />
                              ) : (
                                "Check"
                              )}
                            </Button>
                          </div>
                          <UniquenessResult status={metaTitleCheck} />
                          <FieldErrorMsg message={errors.metaTitle?.message} />
                        </div>

                        <div className="md:col-span-2">
                          <div className="mb-1.5 flex items-baseline justify-between">
                            <FieldLabel htmlFor="industry-meta-desc">
                              Meta description
                            </FieldLabel>
                            <span
                              className={`text-xs font-medium ${descTone}`}
                            >
                              {descLength}/{META_DESCRIPTION_MAX}
                            </span>
                          </div>
                          <Controller
                            name="metaDescription"
                            control={control}
                            render={({ field }) => (
                              <Textarea
                                id="industry-meta-desc"
                                rows={3}
                                placeholder="Summarize the industry for search engines, ideally 150–160 characters"
                                {...field}
                              />
                            )}
                          />
                          <Hint>
                            Appears in Google search results under the title.
                          </Hint>
                          <FieldErrorMsg
                            message={errors.metaDescription?.message}
                          />
                        </div>
                      </div>
                    </Section>
                  </div>
                )}

                {/* ---------- CONTENT ---------- */}
                {activeTab === "content" && (
                  <div className="space-y-5">
                    <Section>
                      <SectionHeader
                        title="Detailed Content"
                        desc="Long-form content that supports this industry."
                        icon={<FiGrid className="size-4" />}
                      />
                      <Controller
                        name="content"
                        control={control}
                        render={({ field }) => (
                          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <TiptopTextEditor
                              height="h-72"
                              initialValue={field.value}
                              onChange={field.onChange}
                            />
                          </div>
                        )}
                      />
                    </Section>
                  </div>
                )}

                {/* ---------- MEDIA ---------- */}
                {activeTab === "media" && (
                  <div className="space-y-5">
                    <Section>
                      <SectionHeader
                        title="Industry Images"
                        desc="Each slot takes a single image. Add alt text for accessibility and SEO."
                        icon={<FiImage className="size-4" />}
                      />

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        {renderImageCard("imageUrl", "Primary image")}
                        {renderImageCard("bannerImage", "Banner image")}
                        {renderImageCard("iconImageUrl", "Icon image")}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-2.5">
                        {checks.map((c) => (
                          <span
                            key={c.label}
                            className={`flex items-center gap-1.5 text-xs font-medium ${
                              c.ok ? "text-emerald-600" : "text-rose-600"
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
                          {validation.slotsFilled}/3 slots filled
                        </span>
                      </div>

                      <FieldErrorMsg
                        message={
                          errors.imageUrl?.message ||
                          errors.bannerImage?.message ||
                          errors.iconImageUrl?.message
                        }
                      />

                      <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-4">
                        <h3 className="mb-2 text-xs font-semibold text-sky-800">
                          Image guidelines
                        </h3>
                        <ul className="space-y-1 text-[11px] text-sky-600">
                          <li>• Primary image: square (1:1)</li>
                          <li>• Banner image: wide (3:1) recommended</li>
                          <li>• Icon image: simple, recognizable (1:1)</li>
                          <li>• Supported formats: JPG, PNG, SVG, WebP</li>
                        </ul>
                      </div>
                    </Section>
                  </div>
                )}

                {/* ---------- DETAILS ---------- */}
                {activeTab === "details" && (
                  <div className="space-y-5">

                    <Section>
                      <SectionHeader
                        title="FAQs"
                        desc="Answer common questions to build trust."
                        icon={<FiHelpCircle className="size-4" />}
                      />
                      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 mb-4">
                        <div className="grid gap-3">
                          <div>
                            <FieldLabel htmlFor="faq-question">
                              Question
                            </FieldLabel>
                            <Input
                              id="faq-question"
                              name="question"
                              value={currentFaq.question}
                              onChange={handleFaqChange}
                              placeholder="e.g., What services are included?"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <FieldLabel htmlFor="faq-answer">Answer</FieldLabel>
                            <Textarea
                              id="faq-answer"
                              name="answer"
                              value={currentFaq.answer}
                              onChange={handleFaqChange}
                              placeholder="Write a clear, helpful answer"
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={addOrUpdateFaq}
                            >
                              {editingFaqIndex !== null
                                ? "Update FAQ"
                                : "Add FAQ"}
                            </Button>
                            {editingFaqIndex !== null && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={cancelEditFaq}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {faqs && faqs.length > 0 && (
                        <div className="space-y-2">
                          <div className="mb-2 flex items-center gap-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Published FAQs
                            </h3>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                              {faqs.length}
                            </span>
                          </div>
                          {faqs.map((faq, index) => (
                            <div
                              key={`${faq.question}-${index}`}
                              className={`flex items-start justify-between gap-4 rounded-lg border bg-white p-3 transition ${
                                editingFaqIndex === index
                                  ? "border-emerald-300 ring-1 ring-emerald-200"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800">
                                  {faq.question}
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                  {faq.answer}
                                </p>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <button
                                  type="button"
                                  onClick={() => editFaq(index)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                >
                                  <FiEdit2 className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteFaq(index)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <FiTrash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {(!faqs || faqs.length === 0) && (
                        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-6 text-center text-slate-400">
                          <FiHelpCircle className="size-5" />
                          <p className="text-xs">
                            No FAQs yet — add your first one above.
                          </p>
                        </div>
                      )}
                    </Section>

                    <Section>
                      <SectionHeader
                        title="Publishing"
                        desc="Control when and where this industry is visible."
                        icon={<FiSettings className="size-4" />}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel htmlFor="status">Status</FieldLabel>
                          <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                              <select
                                id="status"
                                {...field}
                                className="w-full px-3 py-2 bg-white border border-slate-300 outline-none rounded-lg text-sm text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition mt-1"
                              >
                                <option value="DRAFT">
                                  Draft — hidden from public
                                </option>
                                <option value="PUBLISHED">
                                  Published — visible on site
                                </option>
                              </select>
                            )}
                          />
                          <FieldErrorMsg message={errors.status?.message} />
                        </div>
                        
                      </div>
                    </Section>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* ============ Footer ============ */}
            <DialogFooter className="border-t border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                <Check className="size-3.5 text-emerald-500" />
                All changes saved locally — click{" "}
                {isEditMode ? "Update" : "Create"} to submit.
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[140px] bg-primary/90 hover:bg-primary"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="animate-spin" /> Processing...
                    </>
                  ) : (
                    <>{isEditMode ? "Update Industry" : "Create Industry"}</>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showGallery && (
        <WebsiteGalleryModel
          onCancel={handleGalleryClose}
          onSentSelected={handleGallerySelect}
          mode="single"
        />
      )}
    </>
  );
};

export default AddIndustry;