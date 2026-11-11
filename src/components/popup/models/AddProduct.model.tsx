import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Box, LoaderCircle, Search, Check, ChevronRight, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { generateSlug } from "@/helpers/slug-maker";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import {
    CHECK_PRODUCT_H1_TAG_UNIQUE, CHECK_PRODUCT_META_TITLE_UNIQUE,
    CHECK_PRODUCT_SLUG_UNIQUE, CREATE_PRODUCT, UPDATE_PRODUCT
} from "@/graphql/current-website-queries/product.query";
import {
    FiCheckCircle, FiChevronDown, FiChevronUp, FiDollarSign, FiEdit2,
    FiFileText, FiGrid, FiHelpCircle, FiImage, FiTag, FiTrash2,
    FiUploadCloud, FiX, FiXCircle, FiSettings, FiLayers
} from "react-icons/fi";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import TiptopTextEditor from "@/components/TiptopTextEditor";
import Image from "next/image";
import WebsiteGalleryModel from "./WebsiteGallery.model";
import { gql } from "@apollo/client";
import { Switch } from "@/components/ui/switch";
import { removeTypename } from "@/helpers/removetypename";
import { useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";

/* ============================================================
 * GraphQL
 * ============================================================ */
const GET_INDUSTRIES = gql`query findAllIndustries { findAllIndustries { id name } }`;
const GET_MATERIALS = gql`query findAllMaterials { findAllMaterials { id name } }`;
const GET_STYLES = gql`query findAllStyles { findAllStyles { id name } }`;

const IMAGE_MIN = 1;
const IMAGE_MAX = 10;
const META_DESCRIPTION_MAX = 160;
const ALT_TEXT_MAX = 125;

interface LookupOption { id: string; name: string }
interface AddProductProps {
    onCancel: () => void;
    selectedData?: any;
    isEditMode: boolean;
    refetch?: () => void;
}

const productFormSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Lowercase letters, numbers, and hyphens only" }),
    h1Tag: z.string().min(1, "H1 Tag is required"),
    metaTitle: z.string().min(1, "Meta Title is required"),
    metaDescription: z.string().optional(),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    specification: z.string().optional(),
    imageUrl: z.array(z.object({ url: z.string().url("Invalid image URL"), alt: z.string().max(ALT_TEXT_MAX) })).min(IMAGE_MIN).max(IMAGE_MAX),
    industries: z.array(z.string()).default([]),
    materials: z.array(z.string()).default([]),
    styles: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    lowPrice: z.number().min(0).nullable().optional(),
    highPrice: z.number().min(0).nullable().optional(),
    moq: z.string(),
    faqs: z.array(z.any()).default([]),
    status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
    isFeatured: z.boolean().default(false),
});

/* ============================================================
 * Small reusable UI helpers
 * ============================================================ */
const FieldErrorMsg = ({ message }: { message?: string }) =>
    message ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600">
            <FiXCircle className="size-3.5 shrink-0" />{message}
        </p>
    ) : null;

const Hint = ({ children }: { children: React.ReactNode }) => (
    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
        <Info className="size-3" /> {children}
    </p>
);

const SectionHeader = ({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) => (
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{children}</div>
);

const AddProduct = ({ onCancel, selectedData, isEditMode = false, refetch }: AddProductProps) => {
    const companyMember = useAppSelector((state) => state.currentCompanyMember?.companyMember);
    const [loading, setLoading] = useState(false);
    const [isSlugManual, setIsSlugManual] = useState(isEditMode);
    const [isH1Manual, setIsH1Manual] = useState(isEditMode);
    const [isMetaTitleManual, setIsMetaTitleManual] = useState(isEditMode);
    const [slugCheck, setSlugCheck] = useState("");
    const [h1TagCheck, setH1TagCheck] = useState("");
    const [metaTitleCheck, setMetaTitleCheck] = useState("");
    const [showGallery, setShowGallery] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [altInput, setAltInput] = useState("");
    const [currentFaq, setCurrentFaq] = useState({ question: "", answer: "" });
    const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
    const [tagInput, setTagInput] = useState("");

    const [industriesDropdown, setIndustriesDropdown] = useState<LookupOption[]>([]);
    const [materialsDropdown, setMaterialsDropdown] = useState<LookupOption[]>([]);
    const [stylesDropdown, setStylesDropdown] = useState<LookupOption[]>([]);

    const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);
    const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);
    const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);

    const { control, watch, setValue, handleSubmit, formState: { errors, dirtyFields } } = useForm({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: selectedData?.name || "",
            slug: selectedData?.slug || "",
            h1Tag: selectedData?.h1Tag || "",
            metaTitle: selectedData?.metaTitle || "",
            metaDescription: selectedData?.metaDescription || "",
            shortDescription: selectedData?.shortDescription || "",
            description: selectedData?.description || "",
            specification: selectedData?.specification || "",
            imageUrl: selectedData?.imageUrl || [],
            faqs: selectedData?.faqs || [],
            industries: (selectedData?.industries || []).map((i: any) => typeof i === "string" ? i : i.id),
            materials: (selectedData?.materials || []).map((i: any) => typeof i === "string" ? i : i.id),
            styles: (selectedData?.styles || []).map((i: any) => typeof i === "string" ? i : i.id),
            tags: selectedData?.tags || [],
            lowPrice: selectedData?.lowPrice ?? null,
            highPrice: selectedData?.highPrice ?? null,
            moq: selectedData?.moq || "",
            status: selectedData?.status || "DRAFT",
            isFeatured: selectedData?.isFeatured || false,
        }
    });

    const name = watch("name");
    const slug = watch("slug");
    const h1Tag = watch("h1Tag");
    const metaTitle = watch("metaTitle");
    const metaDescription = watch("metaDescription");
    const descLength = metaDescription?.length ?? 0;
    const descTone = descLength > META_DESCRIPTION_MAX ? "text-rose-500" : descLength > 150 ? "text-amber-500" : "text-emerald-600";
    const imageUrl = watch("imageUrl") ?? [];
    const faqs = watch("faqs") ?? [];
    const tags = watch("tags") ?? [];
    const selectedIndustries = watch("industries") ?? [];
    const selectedMaterials = watch("materials") ?? [];
    const selectedStyles = watch("styles") ?? [];


    /* -------- Submit -------- */
    const onSubmit = async (values: any) => {
        if (values.imageUrl.length < IMAGE_MIN) { toast.error(`Please add at least ${IMAGE_MIN} image`); return; }
        if (values.imageUrl.length > IMAGE_MAX) { toast.error(`Max ${IMAGE_MAX} images`); return; }
        if (!companyMember?.id) { toast.error("Unable to identify the current user."); return; }

        const clean = removeTypename(values);
        try {
            if (isEditMode && selectedData?.id) {
                const result = await updateProduct({ variables: { id: selectedData.id, input: clean } });
                if (result.data?.updateProduct?.success) {
                    toast.success(result.data.updateProduct.message || "Product updated");
                    refetch?.(); onCancel();
                } else toast.error(result.data?.updateProduct?.message || "Update failed");
            } else {
                const result = await createProduct({ variables: { input: clean } });
                if (result.data?.createProduct?.success) {
                    toast.success(result.data.createProduct.message || "Product created");
                    refetch?.(); onCancel();
                } else toast.error(result.data?.createProduct?.message || "Creation failed");
            }
        } catch (error: any) {
            toast.error(error?.message || "Operation failed. Please try again.");
        }
    };

    const [checkSlug, { loading: checkingSlug, data: slugData, error: slugError }] = useLazyQuery<any>(CHECK_PRODUCT_SLUG_UNIQUE, { fetchPolicy: "network-only" });
    const [checkH1Tag, { loading: checkingH1Tag, data: h1TagData, error: h1TagError }] = useLazyQuery<any>(CHECK_PRODUCT_H1_TAG_UNIQUE, { fetchPolicy: "network-only" });
    const [checkMetaTitle, { loading: checkingMetaTitle, data: metaTitleData, error: metaTitleError }] = useLazyQuery<any>(CHECK_PRODUCT_META_TITLE_UNIQUE, { fetchPolicy: "network-only" });

    const { data: industriesData, error: industriesError } = useQuery<any>(GET_INDUSTRIES, { fetchPolicy: "network-only" });
    const { data: materialsData, error: materialsError } = useQuery<any>(GET_MATERIALS, { fetchPolicy: "network-only" });
    const { data: stylesData, error: stylesError } = useQuery<any>(GET_STYLES, { fetchPolicy: "network-only" });

    useEffect(() => { if (slugData?.checkProductSlugUnique) setSlugCheck(slugData.checkProductSlugUnique.isUnique ? "✓ Slug is available" : "✗ Slug is already taken"); if (slugError) toast.error("Failed to check slug availability"); }, [slugData, slugError]);
    useEffect(() => { if (h1TagData?.checkProductH1TagUnique) setH1TagCheck(h1TagData.checkProductH1TagUnique.isUnique ? "✓ H1 Tag is available" : "✗ H1 Tag is already taken"); if (h1TagError) toast.error("Failed to check H1 Tag"); }, [h1TagData, h1TagError]);
    useEffect(() => { if (metaTitleData?.checkProductMetaTitleUnique) setMetaTitleCheck(metaTitleData.checkProductMetaTitleUnique.isUnique ? "✓ Meta Title is available" : "✗ Meta Title is already taken"); if (metaTitleError) toast.error("Failed to check Meta Title"); }, [metaTitleData, metaTitleError]);

    const [createProduct, { loading: createLoading }] = useMutation<any>(CREATE_PRODUCT);
    const [updateProduct, { loading: updateLoading }] = useMutation<any>(UPDATE_PRODUCT);
    const isSubmitting = createLoading || updateLoading;

    useEffect(() => { if (industriesData?.findAllIndustries) setIndustriesDropdown(industriesData.findAllIndustries); if (industriesError) toast.error("Failed to load industries"); }, [industriesData, industriesError]);
    useEffect(() => { if (materialsData?.findAllMaterials) setMaterialsDropdown(materialsData.findAllMaterials); if (materialsError) toast.error("Failed to load materials"); }, [materialsData, materialsError]);
    useEffect(() => { if (stylesData?.findAllStyles) setStylesDropdown(stylesData.findAllStyles); if (stylesError) toast.error("Failed to load styles"); }, [stylesData, stylesError]);

    useEffect(() => {
        const handler = () => { setIndustryDropdownOpen(false); setMaterialDropdownOpen(false); setStyleDropdownOpen(false); };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);

    const UniquenessResult = ({ status }: { status: string }) =>
        status ? (
            <p className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${status.startsWith("✓") ? "text-emerald-600" : "text-rose-600"}`}>
                {status.startsWith("✓") ? <FiCheckCircle className="size-3.5 shrink-0" /> : <FiXCircle className="size-3.5 shrink-0" />}
                {status.replace(/^[✓✗]\s*/, "")}
            </p>
        ) : null;

    const checkSlugUnique = (s: string) => { if (!s?.trim()) { toast.error("Please enter a slug"); return; } setSlugCheck(""); checkSlug({ variables: { slug: s, excludeId: isEditMode ? selectedData?.id : undefined } }); };
    const checkH1TagUnique = (h: string) => { if (!h?.trim()) { toast.error("Please enter an H1 tag"); return; } setH1TagCheck(""); checkH1Tag({ variables: { h1Tag: h, excludeId: isEditMode ? selectedData?.id : undefined } }); };
    const checkMetaTitleUnique = (m: string) => { if (!m?.trim()) { toast.error("Please enter a meta title"); return; } setMetaTitleCheck(""); checkMetaTitle({ variables: { metaTitle: m, excludeId: isEditMode ? selectedData?.id : undefined } }); };

    const startEditAlt = (i: number) => { setEditingIndex(i); setAltInput(imageUrl?.[i]?.alt ?? ""); };
    const cancelEdit = () => { setEditingIndex(null); setAltInput(""); };
    const saveAlt = (i: number) => {
        const next = (imageUrl ?? []).map((img, idx) => idx === i ? { ...img, alt: altInput.trim() } : img);
        setValue("imageUrl", next, { shouldValidate: true, shouldDirty: true });
        setEditingIndex(null); setAltInput("");
    };
    const handleRemove = (i: number) => {
        setValue("imageUrl", (imageUrl ?? []).filter((_, idx) => idx !== i), { shouldValidate: true, shouldDirty: true });
    };
    const handleGalleryClose = () => setShowGallery(false);
    const handleGallerySelect = (selected: any[]) => {
        if (!selected?.length) { setShowGallery(false); return; }
        const remaining = IMAGE_MAX - (imageUrl?.length ?? 0);
        if (remaining <= 0) { toast.error(`You can add up to ${IMAGE_MAX} images`); setShowGallery(false); return; }
        const newImages = selected.slice(0, remaining).map((img) => ({ url: img.url, alt: img.alt || "" }));
        setValue("imageUrl", [...(imageUrl ?? []), ...newImages], { shouldValidate: true, shouldDirty: true });
        setShowGallery(false);
    };

    const validation = {
        total: imageUrl.length,
        withAlt: imageUrl.filter((img) => img.alt.trim().length > 0).length,
        min: IMAGE_MIN, max: IMAGE_MAX,
    };
    const checks = [
        { label: `Min ${validation.min} image`, ok: validation.total >= validation.min },
        { label: `Max ${validation.max} images`, ok: validation.total <= validation.max },
        { label: "Alt text added", ok: validation.withAlt >= 1 },
    ];

    const handleFaqChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentFaq((prev) => ({ ...prev, [name]: value }));
    };
    const addOrUpdateFaq = () => {
        const q = currentFaq.question.trim(); const a = currentFaq.answer.trim();
        if (!q) { toast.error("FAQ question is required"); return; }
        if (!a) { toast.error("FAQ answer is required"); return; }
        const cur = faqs ?? [];
        if (editingFaqIndex !== null) {
            setValue("faqs", cur.map((f, i) => i === editingFaqIndex ? { question: q, answer: a } : f), { shouldValidate: true, shouldDirty: true });
            toast.success("FAQ updated");
        } else {
            setValue("faqs", [...cur, { question: q, answer: a }], { shouldValidate: true, shouldDirty: true });
            toast.success("FAQ added");
        }
        setCurrentFaq({ question: "", answer: "" }); setEditingFaqIndex(null);
    };
    const editFaq = (i: number) => { const f = faqs?.[i]; if (!f) return; setCurrentFaq({ question: f.question, answer: f.answer }); setEditingFaqIndex(i); };
    const deleteFaq = (i: number) => { setValue("faqs", (faqs ?? []).filter((_, idx) => idx !== i), { shouldValidate: true, shouldDirty: true }); if (editingFaqIndex === i) { setEditingFaqIndex(null); setCurrentFaq({ question: "", answer: "" }); } };
    const cancelEditFaq = () => { setEditingFaqIndex(null); setCurrentFaq({ question: "", answer: "" }); };

    const addTag = () => { const t = tagInput.trim(); if (t && !tags.includes(t)) setValue("tags", [...tags, t], { shouldValidate: true }); setTagInput(""); };
    const removeTag = (t: string) => setValue("tags", tags.filter((x) => x !== t), { shouldValidate: true });

    const toggle = (field: any, id: string) => {
        const cur = watch(field) ?? [];
        const next = cur.includes(id) ? cur.filter((x: string) => x !== id) : [...cur, id];
        setValue(field, next, { shouldValidate: true, shouldDirty: true });
    };

    /* ============================================================
     * Multi-select render (improved)
     * ============================================================ */
    const renderMultiSelect = (
        label: string, options: LookupOption[], selectedIds: string[],
        isOpen: boolean, onToggleOpen: () => void, onToggleItem: (id: string) => void,
        chipClass: string, removeBtnClass: string
    ) => (
        <div className="relative">
            <FieldLabel>{label}</FieldLabel>
            <button
                type="button"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm text-slate-700 shadow-xs text-left flex justify-between items-center transition hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                onClick={(e) => { e.stopPropagation(); onToggleOpen(); }}
                aria-haspopup="listbox" aria-expanded={isOpen}
            >
                <span className="truncate">
                    {selectedIds.length > 0 ? `${selectedIds.length} ${label.toLowerCase()}(s) selected` : `Select ${label.toLowerCase()}`}
                </span>
                {isOpen ? <FiChevronUp className="size-4 shrink-0 text-slate-500" /> : <FiChevronDown className="size-4 shrink-0 text-slate-500" />}
            </button>
            {isOpen && (
                <div
                    className="absolute w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto py-1 z-10"
                    onClick={(e) => e.stopPropagation()} role="listbox"
                >
                    {options.length === 0 ? (
                        <div className="px-3 py-4 text-xs text-slate-400 text-center">No {label.toLowerCase()} found</div>
                    ) : options.map((opt) => {
                        const checked = selectedIds.includes(opt.id);
                        return (
                            <label key={opt.id} className={`flex items-center px-3 py-2 cursor-pointer text-sm transition ${checked ? "bg-indigo-50/70" : "hover:bg-slate-50"}`}>
                                <input type="checkbox" checked={checked} onChange={() => onToggleItem(opt.id)} className="mr-2 size-4 rounded border-slate-300 text-primary/90 focus:ring-indigo-500" />
                                <span className={checked ? "font-medium text-slate-800" : "text-slate-600"}>{opt.name}</span>
                            </label>
                        );
                    })}
                </div>
            )}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedIds.map((id) => {
                        const opt = options.find((o) => o.id === id); if (!opt) return null;
                        return (
                            <span key={id} className={`inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full text-xs font-medium ${chipClass}`}>
                                {opt.name}
                                <button type="button" onClick={() => onToggleItem(id)} className={`rounded-full p-0.5 transition ${removeBtnClass}`} aria-label={`Remove ${opt.name}`}>
                                    <FiX className="size-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );

    /* ============================================================
     * Tab layout
     * ============================================================ */
    const [activeTab, setActiveTab] = useState<"basic" | "content" | "media" | "details">("basic");

    const tabs: { id: typeof activeTab; label: string; icon: React.ReactNode }[] = [
        { id: "basic", label: "Basics", icon: <Box className="size-4" /> },
        { id: "content", label: "Content & SEO", icon: <FiFileText className="size-4" /> },
        { id: "media", label: "Media & Pricing", icon: <FiImage className="size-4" /> },
        { id: "details", label: "Details & Settings", icon: <FiLayers className="size-4" /> },
    ];

    return (
        <>
            <Dialog open={true} onOpenChange={() => onCancel()}>
                <DialogContent className="max-w-6xl! p-0 overflow-hidden bg-slate-50">
                    {/* ============ Header with progress ============ */}
                    <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-indigo-500/30">
                                    <Box size={20} strokeWidth={1.8} />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold text-slate-900">
                                        {isEditMode ? "Edit Product" : "Add New Product"}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-slate-500">
                                        {isEditMode ? "Update product details and metadata." : "Fill in the sections below. Required fields marked with *"}
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
                                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition whitespace-nowrap ${active
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

                    {/* ============ Scrollable Form Body ============ */}
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                        <ScrollArea className="h-[calc(90vh-220px)]">
                            <div className="px-6 py-5 space-y-5">

                                {/* ---------- BASIC ---------- */}
                                {activeTab === "basic" && (
                                    <div className="space-y-5">
                                        <Section>
                                            <SectionHeader title="Product Identity" desc="The name, URL slug, and short summary for this product." icon={<Box className="size-4" />} />
                                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                                                <div>
                                                    <FieldLabel htmlFor="product-name">Product name <span className="text-rose-500">*</span></FieldLabel>
                                                    <Controller name="name" control={control} render={({ field }) => (
                                                        <Input
                                                            id="product-name"
                                                            placeholder="e.g., Handwoven Wool Throw"
                                                            {...field}
                                                            className="mt-1"
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                if (!isSlugManual) setValue("slug", generateSlug(e.target.value), { shouldValidate: true, shouldDirty: true });
                                                            }}
                                                        />
                                                    )} />
                                                    <FieldErrorMsg message={errors.name?.message as string} />
                                                </div>
                                                <div>
                                                    <FieldLabel htmlFor="product-slug">Slug <span className="text-rose-500">*</span></FieldLabel>
                                                    <div className="flex gap-2 mt-1">
                                                        <Controller name="slug" control={control} render={({ field }) => (
                                                            <Input
                                                                id="product-slug" placeholder="product-slug" {...field}
                                                                onFocus={() => setIsSlugManual(true)}
                                                                onBlur={() => { if (field.value === generateSlug(name ?? "")) setIsSlugManual(false); }}
                                                            />
                                                        )} />
                                                        <Button type="button" size="sm" onClick={() => checkSlugUnique(slug)} disabled={checkingSlug || !slug?.trim()}
                                                            className="shrink-0 bg-primary/90 text-white hover:bg-primary">
                                                            {checkingSlug ? <LoaderCircle className="size-4 animate-spin" /> : "Check"}
                                                        </Button>
                                                    </div>
                                                    <UniquenessResult status={slugCheck} />
                                                    <FieldErrorMsg message={errors.slug?.message as string} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <FieldLabel htmlFor="product-short-desc">Short description</FieldLabel>
                                                    <Controller name="shortDescription" control={control} render={({ field }) => (
                                                        <Textarea id="product-short-desc" rows={2}
                                                            placeholder="A concise summary for listing and category pages"
                                                            className="mt-1" {...field} />
                                                    )} />
                                                    <Hint>Appears in listings. Keep it under 120 characters.</Hint>
                                                </div>
                                            </div>
                                        </Section>

                                        <Section>
                                            <SectionHeader title="Search Engine Optimization" desc="Help people find your product on search engines." icon={<Search className="size-4" />} />
                                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                                                <div>
                                                    <FieldLabel htmlFor="product-h1">H1 tag <span className="text-rose-500">*</span></FieldLabel>
                                                    <div className="flex gap-2 mt-1">
                                                        <Controller name="h1Tag" control={control} render={({ field }) => (
                                                            <Input id="product-h1" placeholder="e.g., Premium Wool Throw Blanket" {...field}
                                                                onFocus={() => setIsH1Manual(true)}
                                                                onBlur={() => { if (field.value === (name ?? "")) setIsH1Manual(false); }} />
                                                        )} />
                                                        <Button type="button" size="sm" onClick={() => checkH1TagUnique(h1Tag)} disabled={checkingH1Tag || !h1Tag?.trim()}
                                                            className="shrink-0 bg-primary/90 text-white hover:bg-primary">
                                                            {checkingH1Tag ? <LoaderCircle className="size-4 animate-spin" /> : "Check"}
                                                        </Button>
                                                    </div>
                                                    <UniquenessResult status={h1TagCheck} />
                                                    <FieldErrorMsg message={errors.h1Tag?.message as string} />
                                                </div>
                                                <div>
                                                    <FieldLabel htmlFor="meta-title">Meta title <span className="text-rose-500">*</span></FieldLabel>
                                                    <div className="flex gap-2 mt-1">
                                                        <Controller name="metaTitle" control={control} render={({ field }) => (
                                                            <Input id="meta-title" placeholder="e.g., Premium Wool Throw Blanket" {...field}
                                                                onFocus={() => setIsMetaTitleManual(true)}
                                                                onBlur={() => { if (field.value === (name ?? "")) setIsMetaTitleManual(false); }} />
                                                        )} />
                                                        <Button type="button" size="sm" onClick={() => checkMetaTitleUnique(metaTitle)} disabled={checkingMetaTitle || !metaTitle?.trim()}
                                                            className="shrink-0 bg-primary/90 text-white hover:bg-primary">
                                                            {checkingMetaTitle ? <LoaderCircle className="size-4 animate-spin" /> : "Check"}
                                                        </Button>
                                                    </div>
                                                    <UniquenessResult status={metaTitleCheck} />
                                                    <FieldErrorMsg message={errors.metaTitle?.message as string} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <div className="mb-1.5 flex items-baseline justify-between">
                                                        <FieldLabel htmlFor="product-meta-desc">Meta description</FieldLabel>
                                                        <span className={`text-xs font-medium ${descTone}`}>{descLength}/{META_DESCRIPTION_MAX}</span>
                                                    </div>
                                                    <Controller name="metaDescription" control={control} render={({ field }) => (
                                                        <Textarea id="product-meta-desc" rows={3}
                                                            placeholder="Summarize the product for search engines, ideally 150–160 characters"
                                                            {...field} />
                                                    )} />
                                                    <Hint>Appears in Google search results under the title.</Hint>
                                                    <FieldErrorMsg message={errors.metaDescription?.message as string} />
                                                </div>
                                            </div>
                                        </Section>
                                    </div>
                                )}

                                {/* ---------- CONTENT ---------- */}
                                {activeTab === "content" && (
                                    <div className="space-y-5">
                                        <Section>
                                            <SectionHeader title="Full Description" desc="Rich details shown on the product detail page." icon={<FiFileText className="size-4" />} />
                                            <Controller name="description" control={control} render={({ field }) => (
                                                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                                    <TiptopTextEditor height="h-96" initialValue={field.value} onChange={field.onChange} />
                                                </div>
                                            )} />
                                        </Section>
                                        <Section>
                                            <SectionHeader title="Specifications" desc="Technical details, materials, sizes, dimensions, etc." icon={<FiGrid className="size-4" />} />
                                            <Controller name="specification" control={control} render={({ field }) => (
                                                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                                    <TiptopTextEditor height="h-96" initialValue={field.value} onChange={field.onChange} />
                                                </div>
                                            )} />
                                        </Section>
                                    </div>
                                )}

                                {/* ---------- MEDIA & PRICING ---------- */}
                                {activeTab === "media" && (
                                    <div className="space-y-5">
                                        <Section>
                                            <SectionHeader title="Product Images" desc="Upload up to 10 images. Add alt text for accessibility and SEO." icon={<FiImage className="size-4" />} />
                                            <div className="flex flex-wrap gap-3">
                                                {imageUrl.map((img, index) => (
                                                    <div key={`${img.url}-${index}`}
                                                        className="group relative size-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm transition hover:shadow-md">
                                                        <Image src={img.url} alt={img.alt || `Product ${index + 1}`} fill className="object-cover" />
                                                        {editingIndex === index ? (
                                                            <div className="absolute inset-0 flex flex-col bg-slate-900/90 p-2">
                                                                <Textarea value={altInput} onChange={(e) => setAltInput(e.target.value)}
                                                                    placeholder="Describe this image"
                                                                    className="flex-1 resize-none rounded border border-slate-500 bg-transparent p-1.5 text-xs text-white placeholder:text-slate-400"
                                                                    maxLength={ALT_TEXT_MAX} autoFocus />
                                                                <div className="mt-1 flex items-center justify-between">
                                                                    <span className="text-[10px] text-slate-300">{altInput.length}/{ALT_TEXT_MAX}</span>
                                                                    <div className="flex gap-1">
                                                                        <button type="button" onClick={() => saveAlt(index)} className="rounded bg-emerald-500 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-emerald-600">Save</button>
                                                                        <button type="button" onClick={cancelEdit} className="rounded bg-slate-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-slate-500">Cancel</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                                                                <button type="button" onClick={() => handleRemove(index)}
                                                                    className="absolute right-1 top-1 rounded-full bg-rose-500 p-1.5 text-white opacity-0 shadow-md transition group-hover:opacity-100 hover:bg-rose-600" aria-label="Remove image">
                                                                    <FiX className="size-3" />
                                                                </button>
                                                                {img.alt ? (
                                                                    <button type="button" onClick={() => startEditAlt(index)}
                                                                        className="absolute inset-x-0 bottom-0 truncate bg-black/60 p-1.5 text-left text-[11px] text-white hover:bg-black/75" title="Edit alt text">
                                                                        {img.alt}
                                                                    </button>
                                                                ) : (
                                                                    <button type="button" onClick={() => startEditAlt(index)}
                                                                        className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-medium text-white shadow-md hover:bg-amber-600">
                                                                        <FiEdit2 className="size-3" /> Add alt text
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                                {(imageUrl?.length ?? 0) < IMAGE_MAX && (
                                                    <button type="button" onClick={() => setShowGallery(true)}
                                                        className="flex size-40 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-indigo-500 hover:bg-indigo-50 hover:text-primary/90">
                                                        <FiUploadCloud className="size-7" />
                                                        <span className="text-xs font-medium">Add image</span>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-2.5">
                                                {checks.map((c) => (
                                                    <span key={c.label} className={`flex items-center gap-1.5 text-xs font-medium ${c.ok ? "text-emerald-600" : "text-rose-600"}`}>
                                                        {c.ok ? <FiCheckCircle className="size-3.5" /> : <FiXCircle className="size-3.5" />}
                                                        {c.label}
                                                    </span>
                                                ))}
                                                <span className="ml-auto text-xs text-slate-400">{validation.total} image{validation.total !== 1 ? "s" : ""} added</span>
                                            </div>
                                            <FieldErrorMsg message={errors.imageUrl?.message as string} />
                                        </Section>

                                        <Section>
                                            <SectionHeader title="Pricing & MOQ" desc="Set the price range and minimum order quantity." icon={<FiDollarSign className="size-4" />} />
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <FieldLabel>Low price</FieldLabel>
                                                    <div className="relative mt-1">
                                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">£</span>
                                                        <Controller name="lowPrice" control={control} render={({ field }) => (
                                                            <Input type="number" step="0.01" min="0" placeholder="0.00" className="pl-7" {...field}
                                                                value={field.value ?? ""}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                                                        )} />
                                                    </div>
                                                    <FieldErrorMsg message={errors.lowPrice?.message as string} />
                                                </div>
                                                <div>
                                                    <FieldLabel>High price</FieldLabel>
                                                    <div className="relative mt-1">
                                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">£</span>
                                                        <Controller name="highPrice" control={control} render={({ field }) => (
                                                            <Input type="number" step="0.01" min="0" placeholder="0.00" className="pl-7" {...field}
                                                                value={field.value ?? ""}
                                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                                                        )} />
                                                    </div>
                                                    <FieldErrorMsg message={errors.highPrice?.message as string} />
                                                </div>
                                                <div>
                                                    <FieldLabel htmlFor="moq">Minimum order quantity</FieldLabel>
                                                    <Controller name="moq" control={control} render={({ field }) => (
                                                        <Input id="moq" placeholder="50" className="mt-1" {...field} />
                                                    )} />
                                                    <FieldErrorMsg message={errors.moq?.message as string} />
                                                </div>
                                            </div>
                                        </Section>
                                    </div>
                                )}

                                {/* ---------- DETAILS & SETTINGS ---------- */}
                                {activeTab === "details" && (
                                    <div className="space-y-5">
                                        <Section>
                                            <SectionHeader title="Categorization" desc="Help customers find your product by industry, material, and style." icon={<FiGrid className="size-4" />} />
                                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                                                <div className="space-y-4">
                                                    {renderMultiSelect("Industries", industriesDropdown, selectedIndustries, industryDropdownOpen,
                                                        () => setIndustryDropdownOpen(!industryDropdownOpen), (id) => toggle("industries", id),
                                                        "bg-emerald-50 text-emerald-700", "text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700")}
                                                    {renderMultiSelect("Materials", materialsDropdown, selectedMaterials, materialDropdownOpen,
                                                        () => setMaterialDropdownOpen(!materialDropdownOpen), (id) => toggle("materials", id),
                                                        "bg-blue-50 text-blue-700", "text-blue-500 hover:bg-blue-100 hover:text-blue-700")}
                                                    {renderMultiSelect("Styles", stylesDropdown, selectedStyles, styleDropdownOpen,
                                                        () => setStyleDropdownOpen(!styleDropdownOpen), (id) => toggle("styles", id),
                                                        "bg-violet-50 text-violet-700", "text-violet-500 hover:bg-violet-100 hover:text-violet-700")}
                                                </div>
                                                <div>
                                                    <FieldLabel>Tags</FieldLabel>
                                                    <div className="flex gap-2 mt-1">
                                                        <div className="relative flex-1">
                                                            <FiTag className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                                                            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                                                                placeholder="Add a tag and press Enter" className="pl-8"
                                                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
                                                        </div>
                                                        <Button type="button" size="sm" variant="outline" onClick={addTag}>Add</Button>
                                                    </div>
                                                    <div className="mt-2.5 flex flex-wrap gap-1.5 min-h-[24px]">
                                                        {tags.length === 0 && <span className="text-xs text-slate-400">No tags added yet.</span>}
                                                        {tags.map((tag) => (
                                                            <span key={tag} className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-primary">
                                                                {tag}
                                                                <button type="button" onClick={() => removeTag(tag)} className="rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-rose-600" aria-label={`Remove ${tag}`}>
                                                                    <FiX className="size-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </Section>

                                        <Section>
                                            <SectionHeader title="FAQs" desc="Answer common customer questions to build trust." icon={<FiHelpCircle className="size-4" />} />
                                            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 mb-4">
                                                <div className="grid gap-3">
                                                    <div>
                                                        <FieldLabel htmlFor="faq-question">Question</FieldLabel>
                                                        <Input id="faq-question" name="question" value={currentFaq.question} onChange={handleFaqChange}
                                                            placeholder="e.g., Is this product machine washable?" className="mt-1" />
                                                    </div>
                                                    <div>
                                                        <FieldLabel htmlFor="faq-answer">Answer</FieldLabel>
                                                        <Textarea id="faq-answer" name="answer" value={currentFaq.answer} onChange={handleFaqChange}
                                                            placeholder="Write a clear, helpful answer" rows={2} className="mt-1" />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button type="button" size="sm" onClick={addOrUpdateFaq}>
                                                            {editingFaqIndex !== null ? "Update FAQ" : "Add FAQ"}
                                                        </Button>
                                                        {editingFaqIndex !== null && (
                                                            <Button type="button" size="sm" variant="outline" onClick={cancelEditFaq}>Cancel</Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {faqs && faqs.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Published FAQs</h3>
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{faqs.length}</span>
                                                    </div>
                                                    {faqs.map((faq, index) => (
                                                        <div key={`${faq.question}-${index}`}
                                                            className={`flex items-start justify-between gap-4 rounded-lg border bg-white p-3 transition ${editingFaqIndex === index ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200 hover:border-slate-300"}`}>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-slate-800">{faq.question}</p>
                                                                <p className="mt-1 text-xs leading-relaxed text-slate-500">{faq.answer}</p>
                                                            </div>
                                                            <div className="flex shrink-0 gap-1">
                                                                <button type="button" onClick={() => editFaq(index)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                                                    <FiEdit2 className="size-3.5" />
                                                                </button>
                                                                <button type="button" onClick={() => deleteFaq(index)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
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
                                                    <p className="text-xs">No FAQs yet — add your first one above.</p>
                                                </div>
                                            )}
                                        </Section>

                                        <Section>
                                            <SectionHeader title="Publishing" desc="Control when and where this product is visible." icon={<FiSettings className="size-4" />} />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <FieldLabel htmlFor="status">Status</FieldLabel>
                                                    <Controller name="status" control={control} render={({ field }) => (
                                                        <select id="status" {...field}
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 outline-none rounded-lg text-sm text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition mt-1">
                                                            <option value="DRAFT">Draft — hidden from public</option>
                                                            <option value="PUBLISHED">Published — visible on site</option>
                                                        </select>
                                                    )} />
                                                    <FieldErrorMsg message={errors.status?.message as string} />
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-white rounded-lg ring-1 ring-slate-200 mt-1">
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm">Featured Product</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">Highlight in featured sections</p>
                                                    </div>
                                                    <Controller name="isFeatured" control={control} render={({ field }) => (
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    )} />
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
                                All changes saved locally — click {isEditMode ? "Update" : "Create"} to submit.
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <Button type="button" variant="outline" onClick={onCancel} disabled={loading || isSubmitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading || isSubmitting} className="min-w-[140px] bg-primary/90 hover:bg-primary">
                                    {loading || isSubmitting ? (
                                        <><LoaderCircle className="animate-spin" /> Processing...</>
                                    ) : (
                                        <>{isEditMode ? "Update Product" : "Create Product"}</>
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {showGallery && (
                <WebsiteGalleryModel onCancel={handleGalleryClose} onSentSelected={handleGallerySelect} mode="multiple" />
            )}
        </>
    );
};

export default AddProduct;