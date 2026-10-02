/* eslint-disable react-hooks/set-state-in-effect */
import { ChangeEvent, useEffect, useState, useMemo, ReactNode } from "react";
import { useMutation, useLazyQuery } from "@apollo/client/react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
    FiX,
    FiInfo,
    FiSearch,
    FiFileText,
    FiImage,
    FiHelpCircle,
    FiCheckCircle,
    FiXCircle,
    FiAlertCircle,
    FiSmartphone,
    FiMonitor,
    FiTrendingUp,
    FiHash,
    FiType,
    FiLink,
    FiEdit2,
    FiTrash2,
    FiUploadCloud,
} from "react-icons/fi";
import { toast } from "sonner";

// shadcn/ui components
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Custom components
import WebsiteGalleryModel from "./WebsiteGallery.model";
import { DynamicFormPopup, TabConfig } from "@/components/TabbedForm";

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

// Rich Text Editor (dynamic import)
const TiptopEditor = dynamic(() => import("../../TiptopTextEditor"), {
    ssr: false,
});

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

const META_DESCRIPTION_MAX = 160;

// Zod schema for the form
const industrySchema = z.object({
    name: z.string().min(1, "Industry name is required"),
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
            description="The essentials visitors and search engines see first."
            tone="indigo"
        >
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                {/* Name */}
                <div>
                    <FieldLabel htmlFor="industry-name" required>
                        Industry name
                    </FieldLabel>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input
                                id="industry-name"
                                placeholder="e.g., Web Development"
                                {...field}
                            />
                        )}
                    />
                    <FieldError message={errors.name?.message} />
                </div>

                {/* Slug */}
                <div>
                    <FieldLabel htmlFor="industry-slug" required>
                        Slug
                    </FieldLabel>
                    <div className="flex gap-2">
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

                {/* Description */}
                <div className="md:col-span-2">
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
                    <FieldError message={errors.description?.message} />
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
            description="Controls how this industry appears in search results."
            tone="sky"
        >
            <div className="space-y-5">
                {/* H1 Tag */}
                <div>
                    <FieldLabel htmlFor="industry-h1" required>
                        H1 tag
                    </FieldLabel>
                    <div className="flex gap-2">
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
                    <FieldLabel htmlFor="industry-meta-title" required>
                        Meta title
                    </FieldLabel>
                    <div className="flex gap-2">
                        <Controller
                            name="metaTitle"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="industry-meta-title"
                                    placeholder="e.g., Web Development Services | Your Company"
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
                        <FieldLabel htmlFor="industry-meta-desc">
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
                                id="industry-meta-desc"
                                placeholder="Summarize this industry for search engines, ideally 150–160 characters"
                                rows={3}
                                {...field}
                            />
                        )}
                    />
                    <FieldError
                        message={errors.metaDescription?.message as string}
                    />
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
            description="The detailed content shown on the industry page."
            tone="violet"
        >
            <div>
                <FieldLabel>Detailed content</FieldLabel>
                <Controller
                    name="content"
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
        </SectionCard>
    );
};

/* ============================================================
 * 4. Images Tab
 * ============================================================ */
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
        <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
                {label}
            </label>
            <div className="group relative">
                <div
                    onClick={onOpenGallery}
                    className="relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 transition hover:border-indigo-400 hover:bg-indigo-50/50"
                    role="button"
                    tabIndex={0}
                    onKeyUp={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                            onOpenGallery();
                    }}
                >
                    {imageUrl ? (
                        <>
                            <Image
                                src={imageUrl}
                                alt="Industry"
                                fill
                                className="rounded-xl object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                <span className="text-xs font-medium text-white">
                                    Change
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="p-4 text-center">
                            <FiUploadCloud className="mx-auto size-6 text-slate-400" />
                            <p className="mt-1 text-xs text-slate-500">
                                Click to upload
                            </p>
                        </div>
                    )}
                </div>
                {hasAlt && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900/80 px-2 py-0.5 text-[10px] text-white">
                        Alt text set
                    </div>
                )}
                {imageUrl && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-1 text-white opacity-0 shadow-md transition group-hover:opacity-100 hover:bg-rose-600"
                        aria-label="Remove image"
                    >
                        <FiX className="size-3" />
                    </button>
                )}
            </div>
        </div>
    );
};

interface ImagesTabProps {
    imageUrl: ImageItem[];
    bannerImage: ImageItem | null;
    iconImageUrl: ImageItem | null;
    getImageUrl: (mode: "imageUrl" | "bannerImage" | "iconImageUrl") => string;
    hasCustomAltText: (
        mode: "imageUrl" | "bannerImage" | "iconImageUrl"
    ) => boolean;
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
        <SectionCard
            icon={<FiImage className="size-4.5" />}
            title="Images"
            description="Add and describe the images used across the site."
            tone="amber"
        >
            <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <ImageUploadCard
                        label="Profile image"
                        imageUrl={getImageUrl("imageUrl")}
                        hasAlt={hasCustomAltText("imageUrl")}
                        onOpenGallery={() => openGallery("imageUrl")}
                        onRemove={() => removeImage("imageUrl")}
                    />
                    <ImageUploadCard
                        label="Banner image"
                        imageUrl={getImageUrl("bannerImage")}
                        hasAlt={hasCustomAltText("bannerImage")}
                        onOpenGallery={() => openGallery("bannerImage")}
                        onRemove={() => removeImage("bannerImage")}
                    />
                    <ImageUploadCard
                        label="Icon image"
                        imageUrl={getImageUrl("iconImageUrl")}
                        hasAlt={hasCustomAltText("iconImageUrl")}
                        onOpenGallery={() => openGallery("iconImageUrl")}
                        onRemove={() => removeImage("iconImageUrl")}
                    />
                </div>

                <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                    <h3 className="mb-2 text-xs font-semibold text-sky-800">
                        Image guidelines
                    </h3>
                    <ul className="space-y-1 text-[11px] text-sky-600">
                        <li>
                            • Profile image: square (1:1), first image is used
                        </li>
                        <li>• Banner image: wide (3:1) recommended</li>
                        <li>• Icon image: simple, recognizable</li>
                        <li>• Supported formats: JPG, PNG, SVG, WebP</li>
                    </ul>
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
                description="Answer the questions visitors ask most before they contact you."
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
                            placeholder="e.g., What services are included?"
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
                            {editingFaqIndex !== null
                                ? "Update FAQ"
                                : "Add FAQ"}
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
                                className={`flex items-start justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm transition ${
                                    editingFaqIndex === index
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
 * SEO & Insights Sidebar
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
        <div
            className="relative shrink-0"
            style={{ width: size, height: size }}
        >
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
    icon?: ReactNode;
    children: ReactNode;
    badge?: ReactNode;
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
    icon?: ReactNode;
}) => (
    <div
        className={`rounded-lg border p-2 transition ${
            ok
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
                className={`text-sm font-bold tabular-nums ${
                    ok ? "text-emerald-700" : "text-slate-700"
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
    hasProfileImage,
    hasBannerImage,
    hasIconImage,
    faqsCount,
}: {
    hasProfileImage: boolean;
    hasBannerImage: boolean;
    hasIconImage: boolean;
    faqsCount: number;
}) => {
    const { control } = useFormContext<FormValues>();
    const metaTitle = useWatch({ control, name: "metaTitle" });
    const metaDescription = useWatch({ control, name: "metaDescription" });
    const slug = useWatch({ control, name: "slug" });
    const name = useWatch({ control, name: "name" });
    const h1Tag = useWatch({ control, name: "h1Tag" });
    const description = useWatch({ control, name: "description" });
    const content = useWatch({ control, name: "content" });

    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
        "desktop"
    );

    /* ---------- Derived values ---------- */
    const title =
        metaTitle?.trim() || name || "Industry title will appear here";
    const desc =
        metaDescription?.trim() ||
        "Meta description preview will appear here. Aim for 150–160 characters.";
    const url = `yourdomain.com › industries › ${slug || "industry-slug"}`;

    const titleLen = title.length;
    const descLen = desc.length;

    /* Strip HTML for word count */
    const stripHtml = (html?: string) =>
        (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    const descText = stripHtml(description);
    const descWords = descText ? descText.split(" ").length : 0;
    const contentText = stripHtml(content);
    const contentWords = contentText ? contentText.split(" ").length : 0;

    /* ---------- SEO checks ---------- */
    const imageCount =
        (hasProfileImage ? 1 : 0) +
        (hasBannerImage ? 1 : 0) +
        (hasIconImage ? 1 : 0);

    const checks = {
        titleLength: titleLen >= 30 && titleLen <= 60,
        descLength: descLen >= 120 && descLen <= 160,
        hasSlug: !!slug?.trim(),
        slugShort: (slug?.length ?? 0) <= 60,
        hasH1: !!h1Tag?.trim(),
        hasImages: imageCount >= 2,
        hasDescription: descWords >= 30,
        hasContent: contentWords >= 100,
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

    /* ---------- Keyword hints ---------- */
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
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3.5 shadow-sm">
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
                badge={
                    <div className="flex overflow-hidden rounded-md border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setPreviewMode("desktop")}
                            className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium transition ${
                                previewMode === "desktop"
                                    ? "bg-slate-800 text-white"
                                    : "bg-white text-slate-500 hover:bg-slate-50"
                            }`}
                            aria-label="Desktop preview"
                        >
                            <FiMonitor className="size-2.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setPreviewMode("mobile")}
                            className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium transition ${
                                previewMode === "mobile"
                                    ? "bg-slate-800 text-white"
                                    : "bg-white text-slate-500 hover:bg-slate-50"
                            }`}
                            aria-label="Mobile preview"
                        >
                            <FiSmartphone className="size-2.5" />
                        </button>
                    </div>
                }
            >
                <div
                    className={
                        previewMode === "mobile"
                            ? "mx-auto max-w-[220px]"
                            : ""
                    }
                >
                    <div className="flex items-center gap-2">
                        <div className="size-[22px] rounded-full border border-dashed border-slate-300 bg-slate-100" />
                        <div className="min-w-0">
                            <p className="truncate text-[11px] font-medium text-slate-800">
                                Your Company
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
                                className={`text-[10px] font-semibold tabular-nums ${
                                    checks.titleLength
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
                                className={`text-[10px] font-semibold tabular-nums ${
                                    checks.descLength
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
                        ok={descWords >= 30}
                    />
                    <StatCard
                        label="Content"
                        value={contentWords}
                        unit="words"
                        ok={contentWords >= 100}
                    />
                    <StatCard
                        label="Images"
                        value={imageCount}
                        unit="/ 3"
                        ok={imageCount >= 2}
                        icon={<FiImage className="size-3" />}
                    />
                    <StatCard
                        label="FAQs"
                        value={faqsCount}
                        unit="items"
                        ok={faqsCount >= 2}
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
                        label="Short description"
                        hint="At least 30 words"
                    />
                    <CheckItem
                        status={checks.hasContent ? "pass" : "warn"}
                        label="Detailed content"
                        hint="Aim for 100+ words"
                    />
                    <CheckItem
                        status={checks.hasImages ? "pass" : "warn"}
                        label="Images added"
                        hint="At least 2 of 3 image slots"
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
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                        both
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
    imageUrl: ImageItem[];
    bannerImage: ImageItem | null;
    iconImageUrl: ImageItem | null;
    getImageUrl: (mode: "imageUrl" | "bannerImage" | "iconImageUrl") => string;
    hasCustomAltText: (
        mode: "imageUrl" | "bannerImage" | "iconImageUrl"
    ) => boolean;
    openGallery: (mode: "imageUrl" | "bannerImage" | "iconImageUrl") => void;
    removeImage: (mode: "imageUrl" | "bannerImage" | "iconImageUrl") => void;
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
    imageUrl,
    bannerImage,
    iconImageUrl,
    getImageUrl,
    hasCustomAltText,
    openGallery,
    removeImage,
}: DetailsTabProps) => {
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
                imageUrl={imageUrl}
                bannerImage={bannerImage}
                iconImageUrl={iconImageUrl}
                getImageUrl={getImageUrl}
                hasCustomAltText={hasCustomAltText}
                openGallery={openGallery}
                removeImage={removeImage}
            />
        </div>
    );
};

/* ============================================================
 * Main Component
 * ============================================================ */
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
    const [
        checkSlug,
        { loading: checkingSlug, data: slugData, error: slugError },
    ] = useLazyQuery<any>(CHECK_INDUSTRY_SLUG_UNIQUE);
    const [
        checkH1Tag,
        { loading: checkingH1Tag, data: h1TagData, error: h1TagError },
    ] = useLazyQuery<any>(CHECK_INDUSTRY_H1_TAG_UNIQUE);
    const [
        checkMetaTitle,
        {
            loading: checkingMetaTitle,
            data: metaTitleData,
            error: metaTitleError,
        },
    ] = useLazyQuery<any>(CHECK_INDUSTRY_META_TITLE_UNIQUE);

    // Update check feedback when data arrives
    useEffect(() => {
        if (slugData?.checkIndustrySlugUnique) {
            const isUnique = slugData.checkIndustrySlugUnique.isUnique;
            setSlugCheck(
                isUnique ? "✓ Slug is available" : "✗ Slug is already taken"
            );
        }
        if (slugError) toast.error("Failed to check slug availability");
    }, [slugData, slugError]);

    useEffect(() => {
        if (h1TagData?.checkIndustryH1TagUnique) {
            const isUnique = h1TagData.checkIndustryH1TagUnique.isUnique;
            setH1TagCheck(
                isUnique ? "✓ H1 Tag is available" : "✗ H1 Tag is already taken"
            );
        }
        if (h1TagError) toast.error("Failed to check H1 Tag availability");
    }, [h1TagData, h1TagError]);

    useEffect(() => {
        if (metaTitleData?.checkIndustryMetaTitleUnique) {
            const isUnique = metaTitleData.checkIndustryMetaTitleUnique.isUnique;
            setMetaTitleCheck(
                isUnique
                    ? "✓ Meta Title is available"
                    : "✗ Meta Title is already taken"
            );
        }
        if (metaTitleError)
            toast.error("Failed to check Meta Title availability");
    }, [metaTitleData, metaTitleError]);

    // ---------- Mutations ----------
    const [createIndustry, { loading: createLoading }] =
        useMutation<any>(CREATE_INDUSTRY);
    const [updateIndustry, { loading: updateLoading }] =
        useMutation<any>(UPDATE_INDUSTRY);
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
            toast.error("Please enter an H1 tag first");
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
            toast.error("Please enter a meta title first");
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
            updatedFaqs[editingFaqIndex] = {
                ...currentFaq,
                order: editingFaqIndex,
            };
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
        const reorderedFaqs = updatedFaqs.map((faq, i) => ({
            ...faq,
            order: i,
        }));
        setFaqs(reorderedFaqs);
        if (editingFaqIndex === index) {
            setEditingFaqIndex(null);
            setCurrentFaq({
                question: "",
                answer: "",
                order: reorderedFaqs.length,
            });
        } else if (editingFaqIndex !== null && editingFaqIndex > index) {
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

    const removeImage = (mode: "imageUrl" | "bannerImage" | "iconImageUrl") => {
        if (mode === "imageUrl") setImageUrl([]);
        else if (mode === "bannerImage") setBannerImage(null);
        else setIconImageUrl(null);
    };

    const getImageUrl = (
        mode: "imageUrl" | "bannerImage" | "iconImageUrl"
    ): string => {
        if (mode === "imageUrl")
            return imageUrl.length > 0 ? imageUrl[0].url : "";
        const img = mode === "bannerImage" ? bannerImage : iconImageUrl;
        return img?.url || "";
    };

    const hasCustomAltText = (
        mode: "imageUrl" | "bannerImage" | "iconImageUrl"
    ): boolean => {
        if (mode === "imageUrl")
            return imageUrl.length > 0 && !!imageUrl[0].alt;
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

        try {
            let result;
            if (isEditMode && selectedData?.id) {
                result = await updateIndustry({
                    variables: { id: selectedData.id, input: cleanInputData },
                });
                if (result.data?.updateIndustry?.success) {
                    toast.success(
                        result.data.updateIndustry.message ||
                            "Industry updated successfully"
                    );
                } else {
                    toast.error(
                        result.data?.updateIndustry?.message ||
                            "Failed to update industry"
                    );
                }
            } else {
                result = await createIndustry({
                    variables: { input: cleanInputData },
                });
                if (result.data?.createIndustry?.success) {
                    toast.success(
                        result.data.createIndustry.message ||
                            "Industry created successfully"
                    );
                } else {
                    toast.error(
                        result.data?.createIndustry?.message ||
                            "Failed to create industry"
                    );
                }
            }
            if (refetch) refetch();
            onCancel();
        } catch (error: any) {
            console.error("GraphQL Error:", error);
            toast.error(error.message || "Operation failed");
        }
    };

    // ---------- Tabs ----------
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

    // ---------- Render ----------
    return (
        <>
            <DynamicFormPopup<FormValues>
                open={true}
                onOpenChange={onCancel}
                title={isEditMode ? "Edit Industry" : "Add New Industry"}
                subtitle={
                    isEditMode
                        ? "Update the details below and save your changes"
                        : "Add a new industry to your website catalog"
                }
                tabs={tabs}
                defaultValues={defaultValues}
                validationSchema={industrySchema}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                submitLabel={isEditMode ? "Update Industry" : "Create Industry"}
                size="2xl"
                sidebar={
                    <SeoPreviewSidebar
                        hasProfileImage={imageUrl.length > 0}
                        hasBannerImage={!!bannerImage}
                        hasIconImage={!!iconImageUrl}
                        faqsCount={faqs.length}
                    />
                }
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