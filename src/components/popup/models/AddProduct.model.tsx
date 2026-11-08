import CardWithTitleAndIcon from "@/components/CardWithTitleAndIcon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Box, LoaderCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { generateSlug } from "@/helpers/slug-maker";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { CHECK_PRODUCT_H1_TAG_UNIQUE, CHECK_PRODUCT_META_TITLE_UNIQUE, CHECK_PRODUCT_SLUG_UNIQUE, CREATE_PRODUCT, UPDATE_PRODUCT } from "@/graphql/current-website-queries/product.query";
import {
    FiCheckCircle,
    FiChevronDown,
    FiChevronUp,
    FiDollarSign,
    FiEdit2,
    FiFileText,
    FiGrid,
    FiHelpCircle,
    FiImage,
    FiStar,
    FiTag,
    FiTrash2,
    FiUploadCloud,
    FiX,
    FiXCircle,
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

const IMAGE_MIN = 1;
const IMAGE_MAX = 10;
const META_DESCRIPTION_MAX = 160;
const ALT_TEXT_MAX = 125;

interface LookupOption {
    id: string;
    name: string;
}

interface AddProductProps {
    onCancel: () => void;
    selectedData?: any;
    isEditMode: boolean;
    refetch?: () => void;
}

const productFormSchema = z.object({
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
    imageUrl: z
        .array(
            z.object({
                url: z.string().url("Invalid image URL"),
                alt: z.string().max(ALT_TEXT_MAX, `Alt text must be at most ${ALT_TEXT_MAX} characters`),
            })
        )
        .min(IMAGE_MIN, `At least ${IMAGE_MIN} image is required`)
        .max(IMAGE_MAX, `Maximum ${IMAGE_MAX} images allowed`),
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
    // rating: z.number().min(0).max(5).default(0),
    // reviewsCount: z.number().min(0).default(0),
});

const AddProduct = ({
    onCancel,
    selectedData,
    isEditMode = false,
    refetch,
}: AddProductProps) => {
    const companyMember = useAppSelector(
        (state) => state.currentCompanyMember?.companyMember
    );
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

    const { control, watch, setValue, handleSubmit, formState: { errors }, } = useForm({
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
            industries: (selectedData?.industries || []).map((i: any) =>
                typeof i === "string" ? i : i.id),
            materials: (selectedData?.materials || []).map((i: any) =>
                typeof i === "string" ? i : i.id),
            styles: (selectedData?.styles || []).map((i: any) =>
                typeof i === "string" ? i : i.id),
            tags: selectedData?.tags || [],
            lowPrice: selectedData?.lowPrice ?? null,
            highPrice: selectedData?.highPrice ?? null,
            moq: selectedData?.moq || "",
            status: selectedData?.status || "DRAFT",
            isFeatured: selectedData?.isFeatured || false,
            // rating: selectedData?.rating || 0,
            // reviewsCount: selectedData?.reviewsCount || 0,
        }
    })

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
    const imageUrl = watch("imageUrl") ?? [];
    const faqs = watch("faqs") ?? [];
    const tags = watch("tags") ?? [];
    const selectedIndustries = watch("industries") ?? [];
    const selectedMaterials = watch("materials") ?? [];
    const selectedStyles = watch("styles") ?? [];


    /* ---------- Submit ---------- */
    const onSubmit = async (values: any) => {
        if (values.imageUrl.length < IMAGE_MIN) {
            toast.error(`Please add at least ${IMAGE_MIN} image`);
            return;
        }
        if (values.imageUrl.length > IMAGE_MAX) {
            toast.error(`You can only have up to ${IMAGE_MAX} images`);
            return;
        }
        if (!companyMember?.id) {
            toast.error(
                "Unable to identify the current user. Please refresh and try again."
            );
            return;
        }


        const clean = removeTypename(values);
        console.log("Submitting product data:", clean);

        try {
            if (isEditMode && selectedData?.id) {
                const result = await updateProduct({
                    variables: { id: selectedData.id, input: clean },
                });

                console.log("Update product result:", result);
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

    const [
        checkSlug,
        { loading: checkingSlug, data: slugData, error: slugError },
    ] = useLazyQuery<any>(CHECK_PRODUCT_SLUG_UNIQUE, { fetchPolicy: "network-only" });
    const [
        checkH1Tag,
        { loading: checkingH1Tag, data: h1TagData, error: h1TagError },
    ] = useLazyQuery<any>(CHECK_PRODUCT_H1_TAG_UNIQUE, { fetchPolicy: "network-only" });
    const [
        checkMetaTitle,
        { loading: checkingMetaTitle, data: metaTitleData, error: metaTitleError },
    ] = useLazyQuery<any>(CHECK_PRODUCT_META_TITLE_UNIQUE, { fetchPolicy: "network-only" });

    const { data: industriesData, error: industriesError } = useQuery<any>(GET_INDUSTRIES, { fetchPolicy: "network-only" });
    const { data: materialsData, error: materialsError } = useQuery<any>(GET_MATERIALS, { fetchPolicy: "network-only" });
    const { data: stylesData, error: stylesError } = useQuery<any>(GET_STYLES, { fetchPolicy: "network-only" });

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

    const [createProduct, { loading: createLoading }] = useMutation<any>(CREATE_PRODUCT);
    const [updateProduct, { loading: updateLoading }] = useMutation<any>(UPDATE_PRODUCT);
    const isSubmitting = createLoading || updateLoading;

    useEffect(() => {
        if (industriesData?.findAllIndustries)
            setIndustriesDropdown(industriesData.findAllIndustries);
        if (industriesError) toast.error("Failed to load industries");
    }, [industriesData, industriesError]);

    useEffect(() => {
        if (materialsData?.findAllMaterials)
            setMaterialsDropdown(materialsData.findAllMaterials);
        if (materialsError) toast.error("Failed to load materials");
    }, [materialsData, materialsError]);

    useEffect(() => {
        if (stylesData?.findAllStyles)
            setStylesDropdown(stylesData.findAllStyles);
        if (stylesError) toast.error("Failed to load styles");
    }, [stylesData, stylesError]);

    useEffect(() => {
        const handleClickOutside = () => {
            setIndustryDropdownOpen(false);
            setMaterialDropdownOpen(false);
            setStyleDropdownOpen(false);
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const FieldErrorMsg = ({ message }: { message?: string }) => {
        if (!message) return null;
        return (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
                <FiXCircle className="size-3.5 shrink-0" />
                {message}
            </p>
        )
    };

    const UniquenessResult = ({ status }: { status: string }) =>
        status ? (
            <p
                className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${status.startsWith("✓") ? "text-emerald-600" : "text-rose-600"}`}
            >
                {status.startsWith("✓") ? (
                    <FiCheckCircle className="size-3.5 shrink-0" />
                ) : (
                    <FiXCircle className="size-3.5 shrink-0" />
                )}
                {status.replace(/^[✓✗]\s*/, "")}
            </p>
        ) : null;

    const checkSlugUnique = (slug: string) => {
        if (!slug?.trim()) {
            toast.error("Please enter a slug");
            return;
        }
        setSlugCheck("");
        checkSlug({
            variables: { slug, excludeId: isEditMode ? selectedData?.id : undefined },
        });
    };

    const checkH1TagUnique = (h1Tag: string) => {
        if (!h1Tag?.trim()) {
            toast.error("Please enter an H1 tag");
            return;
        }
        setH1TagCheck("");
        checkH1Tag({
            variables: { h1Tag, excludeId: isEditMode ? selectedData?.id : undefined },
        });
    };

    const checkMetaTitleUnique = (metaTitle: string) => {
        if (!metaTitle?.trim()) {
            toast.error("Please enter a meta title");
            return;
        }
        setMetaTitleCheck("");
        checkMetaTitle({
            variables: { metaTitle, excludeId: isEditMode ? selectedData?.id : undefined },
        });
    };

    const startEditAlt = (index: number) => {
        setEditingIndex(index);
        setAltInput(imageUrl?.[index]?.alt ?? "");
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setAltInput("");
    };

    const saveAlt = (index: number) => {
        const current = imageUrl ?? [];
        const next = current.map((img, i) =>
            i === index ? { ...img, alt: altInput.trim() } : img
        );
        setValue("imageUrl", next, { shouldValidate: true, shouldDirty: true });
        setEditingIndex(null);
        setAltInput("");
    };

    const handleRemove = (index: number) => {
        const current = imageUrl ?? [];
        setValue(
            "imageUrl",
            current.filter((_, i) => i !== index),
            { shouldValidate: true, shouldDirty: true }
        );
    };

    const handleGalleryClose = () => setShowGallery(false);
    const handleGallerySelect = (selected: any[]) => {
        if (!selected?.length) {
            setShowGallery(false);
            return;
        }
        const current = imageUrl ?? [];
        const remainingSlots = IMAGE_MAX - current.length;
        if (remainingSlots <= 0) {
            toast.error(`You can add up to ${IMAGE_MAX} images`);
            setShowGallery(false);
            return;
        }
        const newImages = selected
            .slice(0, remainingSlots)
            .map((img) => ({ url: img.url, alt: img.alt || "" }));

        setValue("imageUrl", [...current, ...newImages], {
            shouldValidate: true,
            shouldDirty: true,
        });

        setShowGallery(false);
    };

    const validation = {
        total: imageUrl.length,
        withAlt: imageUrl.filter((img) => img.alt.trim().length > 0).length,
        min: IMAGE_MIN,
        max: IMAGE_MAX,
    };

    const checks = [
        { label: `Minimum ${validation.min} image`, ok: validation.total >= validation.min },
        { label: `Maximum ${validation.max} images`, ok: validation.total <= validation.max },
        { label: "At least 1 image has alt text", ok: validation.withAlt >= 1 },
    ];

    const handleFaqChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setCurrentFaq((prev) => ({ ...prev, [name]: value }));
    };

    const addOrUpdateFaq = () => {
        const question = currentFaq.question.trim();
        const answer = currentFaq.answer.trim();

        if (!question) {
            toast.error("FAQ question is required");
            return;
        }
        if (!answer) {
            toast.error("FAQ answer is required");
            return;
        }

        const current = faqs ?? [];

        if (editingFaqIndex !== null) {
            const next = current.map((f, i) =>
                i === editingFaqIndex ? { question, answer } : f
            );
            setValue("faqs", next, { shouldValidate: true, shouldDirty: true });
            toast.success("FAQ updated");
        } else {
            setValue("faqs", [...current, { question, answer }], {
                shouldValidate: true,
                shouldDirty: true,
            });
            toast.success("FAQ added");
        }

        setCurrentFaq({ question: "", answer: "" });
        setEditingFaqIndex(null);
    };

    const editFaq = (index: number) => {
        const faq = faqs?.[index];
        if (!faq) return;
        setCurrentFaq({ question: faq.question, answer: faq.answer });
        setEditingFaqIndex(index);
    };

    const deleteFaq = (index: number) => {
        const current = faqs ?? [];
        setValue(
            "faqs",
            current.filter((_, i) => i !== index),
            { shouldValidate: true, shouldDirty: true }
        );
        if (editingFaqIndex === index) {
            setEditingFaqIndex(null);
            setCurrentFaq({ question: "", answer: "" });
        }
    };

    const cancelEditFaq = () => {
        setEditingFaqIndex(null);
        setCurrentFaq({ question: "", answer: "" });
    };

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

    const handleIndustrySelection = (id: string) => {
        const current = watch("industries") ?? [];
        const next = current.includes(id)
            ? current.filter((i) => i !== id)
            : [...current, id];
        setValue("industries", next, { shouldValidate: true, shouldDirty: true });
    };

    const handleMaterialSelection = (id: string) => {
        const current = watch("materials") ?? [];
        const next = current.includes(id)
            ? current.filter((i) => i !== id)
            : [...current, id];
        setValue("materials", next, { shouldValidate: true, shouldDirty: true });
    };

    const handleStyleSelection = (id: string) => {
        const current = watch("styles") ?? [];
        const next = current.includes(id)
            ? current.filter((i) => i !== id)
            : [...current, id];
        setValue("styles", next, { shouldValidate: true, shouldDirty: true });
    };

    /* ============================================================
     * Reusable UI pieces for consistent look across dropdowns
     * ============================================================ */
    const dropdownTriggerClass =
        "w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm text-slate-700 shadow-xs text-left flex justify-between items-center transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

    const renderMultiSelect = (
        label: string,
        options: LookupOption[],
        selectedIds: string[],
        isOpen: boolean,
        onToggleOpen: () => void,
        onToggleItem: (id: string) => void,
        chipClass: string,
        removeBtnClass: string
    ) => (
        <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {label}
            </label>
            <button
                type="button"
                className={dropdownTriggerClass}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleOpen();
                }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="truncate">
                    {selectedIds.length > 0
                        ? `${selectedIds.length} ${label.toLowerCase()}(s) selected`
                        : `Select ${label.toLowerCase()}`}
                </span>
                {isOpen ? (
                    <FiChevronUp className="size-4 shrink-0 text-slate-500" />
                ) : (
                    <FiChevronDown className="size-4 shrink-0 text-slate-500" />
                )}
            </button>

            {isOpen && (
                <div
                    className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto py-1"
                    onClick={(e) => e.stopPropagation()}
                    role="listbox"
                >
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-400">
                            No {label.toLowerCase()} found
                        </div>
                    ) : (
                        options.map((opt) => {
                            const checked = selectedIds.includes(opt.id);
                            return (
                                <label
                                    key={opt.id}
                                    className={`flex items-center px-3 py-2 cursor-pointer text-sm transition ${checked ? "bg-slate-50" : "hover:bg-slate-50"}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onToggleItem(opt.id)}
                                        className="mr-2 size-4 rounded border-slate-300 text-primary focus:ring-primary"
                                    />
                                    <span className={checked ? "font-medium text-slate-800" : "text-slate-600"}>
                                        {opt.name}
                                    </span>
                                </label>
                            );
                        })
                    )}
                </div>
            )}

            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedIds.map((id) => {
                        const opt = options.find((o) => o.id === id);
                        if (!opt) return null;
                        return (
                            <span
                                key={id}
                                className={`inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full text-xs font-medium ${chipClass}`}
                            >
                                {opt.name}
                                <button
                                    type="button"
                                    onClick={() => onToggleItem(id)}
                                    className={`rounded-full p-0.5 transition ${removeBtnClass}`}
                                    aria-label={`Remove ${opt.name}`}
                                >
                                    <FiX className="size-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <>
            <Dialog open={true} onOpenChange={() => onCancel()}>
                <DialogContent className="max-w-5xl! max-h-[90vh] p-0 overflow-hidden">
                    {/* ---------------- Header ---------------- */}
                    <DialogHeader className="px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                                <Box size={22} strokeWidth={1.8} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">
                                    {isEditMode ? "Edit Product" : "Add New Product"}
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-500">
                                    {isEditMode ? "Update product details" : "Create a new product"}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className=" flex flex-col h-[60vh] overflow-auto ">
                        {/* ScrollArea height increased from 50vh → 60vh for better UX */}
                        <ScrollArea className="flex flex-col space-y-6 px-6 pt-4 pb-20">

                            {/* ---------------- Product Details ---------------- */}
                            <CardWithTitleAndIcon
                                title="Product Details"
                                description="Provide comprehensive information about your product."
                                icon={<Box size={17} />}
                            >
                                <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 bg-slate-50/80 p-6 rounded-xl m-0.5 ring-1 ring-slate-200">
                                    {/* Name */}
                                    <div>
                                        <FieldLabel htmlFor="product-name">
                                            Product name <span className="text-rose-500">*</span>
                                        </FieldLabel>
                                        <div className="mt-1">
                                            <Controller
                                                name="name"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        id="product-name"
                                                        placeholder="e.g., Handwoven Wool Throw"
                                                        {...field}
                                                        className="bg-white"
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            if (!isSlugManual) {
                                                                setValue("slug", generateSlug(e.target.value), {
                                                                    shouldValidate: true,
                                                                    shouldDirty: true,
                                                                });
                                                            }
                                                        }}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <FieldErrorMsg message={errors.name?.message as string} />
                                    </div>

                                    {/* Slug */}
                                    <div>
                                        <FieldLabel htmlFor="product-slug">
                                            Slug <span className="text-rose-500">*</span>
                                        </FieldLabel>
                                        <div className="flex gap-2 mt-1">
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
                                                                field.value === generateSlug(name ?? "")
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
                                                className="shrink-0 bg-blue-600 text-white hover:text-white hover:bg-blue-700 border-blue-600"
                                            >
                                                {checkingSlug ? (
                                                    <LoaderCircle className="size-4 animate-spin" />
                                                ) : "Check"}
                                            </Button>
                                        </div>
                                        <UniquenessResult status={slugCheck} />
                                        <FieldErrorMsg message={errors.slug?.message as string} />
                                    </div>

                                    {/* Short Description */}
                                    <div className="md:col-span-2">
                                        <FieldLabel htmlFor="product-short-desc">
                                            Short description
                                        </FieldLabel>
                                        <div className="mt-1">
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
                                        <FieldErrorMsg message={errors.shortDescription?.message as string} />
                                    </div>
                                </div>
                            </CardWithTitleAndIcon>

                            {/* ---------------- SEO ---------------- */}
                            <CardWithTitleAndIcon
                                title="Seo & Metadata"
                                description="Optimize your product for search engines with relevant metadata."
                                icon={<Search size={17} />}
                            >
                                <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 bg-slate-50/80 p-6 rounded-xl m-0.5 ring-1 ring-slate-200">
                                    {/* H1 */}
                                    <div>
                                        <FieldLabel htmlFor="product-h1">
                                            H1 tag <span className="text-rose-500">*</span>
                                        </FieldLabel>
                                        <div className="flex gap-2 mt-1">
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
                                                className="shrink-0 bg-blue-600 text-white hover:bg-blue-700 hover:text-white border-blue-600"
                                            >
                                                {checkingH1Tag ? (
                                                    <LoaderCircle className="size-4 animate-spin" />
                                                ) : "Check"}
                                            </Button>
                                        </div>
                                        <UniquenessResult status={h1TagCheck} />
                                        <FieldErrorMsg message={errors.h1Tag?.message as string} />
                                    </div>

                                    {/* Meta title */}
                                    <div>
                                        <FieldLabel htmlFor="meta-title">
                                            Meta title <span className="text-rose-500">*</span>
                                        </FieldLabel>
                                        <div className="flex gap-2 mt-1">
                                            <Controller
                                                name="metaTitle"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        id="meta-title"
                                                        placeholder="e.g., Premium Wool Throw Blanket"
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
                                                onClick={() => checkMetaTitleUnique(metaTitle)}
                                                disabled={checkingMetaTitle || !metaTitle?.trim()}
                                                className="shrink-0 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                                            >
                                                {checkingMetaTitle ? (
                                                    <LoaderCircle className="size-4 animate-spin" />
                                                ) : "Check"}
                                            </Button>
                                        </div>
                                        <UniquenessResult status={metaTitleCheck} />
                                        <FieldErrorMsg message={errors.metaTitle?.message as string} />
                                    </div>

                                    {/* Meta Description */}
                                    <div className="md:col-span-2">
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
                                        <FieldErrorMsg message={errors.metaDescription?.message as string} />
                                    </div>
                                </div>
                            </CardWithTitleAndIcon>

                            {/* ---------------- Content ---------------- */}
                            <CardWithTitleAndIcon
                                title="Content"
                                description="The full description and specification shown on the product page."
                                icon={<FiFileText className="size-4.5" />}
                            >
                                <div className="space-y-6 p-6 bg-slate-50/80 rounded-xl ring-1 ring-slate-200 m-0.5">
                                    <div>
                                        <FieldLabel>Description</FieldLabel>
                                        <Controller
                                            name="description"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="mt-1 overflow-hidden rounded-lg border border-slate-200">
                                                    <TiptopTextEditor
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
                                                <div className="mt-1 overflow-hidden rounded-lg border border-slate-200">
                                                    <TiptopTextEditor
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
                            </CardWithTitleAndIcon>

                            {/* ---------------- Images ---------------- */}
                            <CardWithTitleAndIcon
                                title="Images"
                                description="Add product photos and describe them for accessibility and SEO."
                                icon={<FiImage className="size-4.5" />}
                            >
                                <div className="space-y-4 bg-slate-50/80 p-6 rounded-xl ring-1 ring-slate-200 m-0.5">
                                    <div className="flex flex-wrap gap-4">
                                        {imageUrl.map((img, index) => (
                                            <div
                                                key={`${img.url}-${index}`}
                                                className="group relative size-48 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm transition-shadow hover:shadow-md"
                                            >
                                                <Image
                                                    src={img.url}
                                                    alt={img.alt || `Product ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                                {editingIndex === index ? (
                                                    <div className="absolute inset-0 flex flex-col bg-slate-900/90 p-2">
                                                        <Textarea
                                                            value={altInput}
                                                            onChange={(e) =>
                                                                setAltInput(e.target.value)
                                                            }
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
                                                            className="absolute right-1 top-1 rounded-full bg-rose-500 p-1.5 text-white opacity-0 shadow-md transition group-hover:opacity-100 hover:bg-rose-600"
                                                            aria-label="Remove image"
                                                        >
                                                            <FiX className="size-3" />
                                                        </button>
                                                        {img.alt ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => startEditAlt(index)}
                                                                className="absolute inset-x-0 bottom-0 truncate bg-black/60 p-1.5 text-left text-[11px] text-white transition hover:bg-black/75"
                                                                title="Edit alt text"
                                                            >
                                                                {img.alt}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => startEditAlt(index)}
                                                                className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-amber-500 w-fit text-nowrap px-2.5 py-1 text-[11px] font-medium text-white shadow-md transition hover:bg-amber-600"
                                                            >
                                                                <FiEdit2 className="size-3" /> Add alt text
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}

                                        {(imageUrl?.length ?? 0) < IMAGE_MAX && (
                                            <button
                                                type="button"
                                                onClick={() => setShowGallery(true)}
                                                className="flex size-48 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-primary hover:bg-primary/5 hover:text-primary"
                                            >
                                                <FiUploadCloud className="size-7" />
                                                <span className="text-xs font-medium">Add image</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
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
                                    <FieldErrorMsg message={errors.imageUrl?.message as string} />
                                </div>
                            </CardWithTitleAndIcon>

                            {/* ---------------- Price ---------------- */}
                            <CardWithTitleAndIcon
                                title="Price"
                                description="Set the price for your product."
                                icon={<FiDollarSign className="size-4.5" />}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-xl ring-1 ring-slate-200 bg-slate-50/80 m-0.5">
                                    <div>
                                        <FieldLabel>Low price</FieldLabel>
                                        <div className="relative mt-1">
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
                                        <FieldErrorMsg message={errors.lowPrice?.message as string} />
                                    </div>
                                    <div>
                                        <FieldLabel>High price</FieldLabel>
                                        <div className="relative mt-1">
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
                                        <FieldErrorMsg message={errors.highPrice?.message as string} />
                                    </div>
                                    <div>
                                        <FieldLabel htmlFor="moq">MOQ</FieldLabel>
                                        <Controller
                                            name="moq"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    id="moq"
                                                    placeholder="50"
                                                    className="mt-1"
                                                    {...field}
                                                />
                                            )}
                                        />
                                        <FieldErrorMsg message={errors.moq?.message as string} />
                                    </div>
                                </div>
                            </CardWithTitleAndIcon>

                            {/* ---------------- FAQs ---------------- */}
                            <CardWithTitleAndIcon
                                title="FAQs"
                                description="Add frequently asked questions and answers about your product."
                                icon={<FiHelpCircle className="size-4.5" />}
                            >
                                <div className="space-y-3 ring-1 ring-slate-200 mb-6 rounded-xl bg-slate-50/80 p-6 m-0.5">
                                    <div>
                                        <FieldLabel htmlFor="faq-question">Question</FieldLabel>
                                        <Input
                                            id="faq-question"
                                            name="question"
                                            value={currentFaq.question}
                                            onChange={handleFaqChange}
                                            placeholder="e.g., Is this product machine washable?"
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
                                            rows={3}
                                            className="mt-1"
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
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-slate-700">
                                            Published FAQs
                                        </h3>
                                        {faqs && faqs.length > 0 && (
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                                {faqs.length}
                                            </span>
                                        )}
                                    </div>
                                    {faqs && faqs?.length === 0 ? (
                                        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-400">
                                            <FiHelpCircle className="size-6" />
                                            <p className="text-sm">
                                                No FAQs yet — add your first one above.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {faqs?.map((faq, index) => (
                                                <div
                                                    key={`${faq.question}-${index}`}
                                                    className={`flex items-start justify-between gap-4 rounded-xl border bg-white p-4 shadow-xs transition ${editingFaqIndex === index
                                                        ? "border-emerald-300 ring-1 ring-emerald-200"
                                                        : "border-slate-200 hover:border-slate-300"
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
                            </CardWithTitleAndIcon>

                            {/* ---------------- Categorization ---------------- */}
                            <CardWithTitleAndIcon
                                title="Categorization"
                                description="Categorize your product to help customers find it more easily."
                                icon={<FiGrid className="size-4.5" />}
                            >
                                <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2 p-6 ring-1 ring-slate-200 rounded-xl bg-slate-50/80 m-0.5">
                                    <div className="space-y-5 text-sm">
                                        {renderMultiSelect(
                                            "Industries",
                                            industriesDropdown,
                                            selectedIndustries,
                                            industryDropdownOpen,
                                            () => setIndustryDropdownOpen(!industryDropdownOpen),
                                            handleIndustrySelection,
                                            "bg-emerald-50 text-emerald-700",
                                            "text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700"
                                        )}
                                        {renderMultiSelect(
                                            "Materials",
                                            materialsDropdown,
                                            selectedMaterials,
                                            materialDropdownOpen,
                                            () => setMaterialDropdownOpen(!materialDropdownOpen),
                                            handleMaterialSelection,
                                            "bg-blue-50 text-blue-700",
                                            "text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                                        )}
                                        {renderMultiSelect(
                                            "Styles",
                                            stylesDropdown,
                                            selectedStyles,
                                            styleDropdownOpen,
                                            () => setStyleDropdownOpen(!styleDropdownOpen),
                                            handleStyleSelection,
                                            "bg-violet-50 text-violet-700",
                                            "text-violet-500 hover:bg-violet-100 hover:text-violet-700"
                                        )}
                                    </div>

                                    <div>
                                        <FieldLabel>Tags</FieldLabel>
                                        <div className="flex gap-2 mt-1">
                                            <div className="relative flex-1">
                                                <FiTag className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                                                <Controller
                                                    name="tags"
                                                    control={control}
                                                    render={() => (
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
                                                    )}
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
                                        <FieldErrorMsg message={errors.tags?.message as string} />
                                    </div>
                                </div>
                            </CardWithTitleAndIcon>

                            {/* ---------------- Settings ---------------- */}
                            <CardWithTitleAndIcon
                                title="Settings"
                                description="Set the visibility and availability of your product."
                                icon={<FiGrid className="size-4.5" />}
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 ring-1 ring-slate-200 rounded-xl bg-slate-50/80 m-0.5">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-800 mb-4">
                                            Product Status
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    Status
                                                </label>
                                                <Controller
                                                    name="status"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <select
                                                            id="status"
                                                            {...field}
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 outline-none rounded-lg text-sm text-slate-700 shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                                        >
                                                            <option value="DRAFT">Draft</option>
                                                            <option value="PUBLISHED">Published</option>
                                                            {/* <option value="archived">Archived</option> */}
                                                        </select>
                                                    )}
                                                />
                                                <FieldErrorMsg message={errors.status?.message as string} />
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-white rounded-lg ring-1 ring-slate-200">
                                                <div>
                                                    <p className="font-medium text-slate-800 text-sm">
                                                        Featured Product
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Show this product in featured sections
                                                    </p>
                                                </div>
                                                <Controller
                                                    name="isFeatured"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={(value: boolean) =>
                                                                field.onChange(value)
                                                            }
                                                        />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* <div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-800 mb-4">
                                                Product Rating
                                            </h3>

                                            <Controller
                                                name="rating"
                                                control={control}
                                                render={({ field }) => (
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                onClick={() => field.onChange(star)}
                                                                aria-label={`Set rating to ${star} stars`}
                                                                aria-pressed={field.value === star}
                                                                className={`transition-transform hover:scale-110 ${star <= (field.value ?? 0)
                                                                    ? "text-yellow-400"
                                                                    : "text-gray-300 hover:text-yellow-300"
                                                                    }`}
                                                            >
                                                                <FiStar
                                                                    className="size-7"
                                                                    fill={star <= (field.value ?? 0) ? "currentColor" : "none"}
                                                                />
                                                            </button>
                                                        ))}

                                                        <span className="ml-2 text-sm text-slate-600">
                                                            {field.value != null && field.value > 0
                                                                ? `${field.value} out of 5`
                                                                : "Not rated"}
                                                        </span>
                                                    </div>
                                                )}
                                            />

                                            <p className="mt-2 text-xs text-slate-500">
                                                Click a star to select the product rating.
                                            </p>

                                            <Controller
                                                name="rating"
                                                control={control}
                                                render={({ field }) =>
                                                    field.value != null && field.value > 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => field.onChange(0)}
                                                            className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                                                        >
                                                            Clear rating
                                                        </button>
                                                    ) : <></>
                                                }
                                            />
                                        </div>
                                        <div className="mt-6">
                                            <label
                                                htmlFor="reviewsCount"
                                                className="block text-sm font-medium text-slate-700 mb-1.5"
                                            >
                                                Reviews Count
                                            </label>
                                            <Controller
                                                name="reviewsCount"
                                                control={control}
                                                render={({ field }) => (
                                                    <input
                                                        id="reviewsCount"
                                                        type="number"
                                                        value={field.value ?? ""}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value === ""
                                                                    ? 0
                                                                    : Number(e.target.value)
                                                            )
                                                        }
                                                        placeholder="Enter a number"
                                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 outline-none shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                                    />
                                                )}
                                            />
                                            <FieldErrorMsg message={errors.reviewsCount?.message as string} />
                                        </div>
                                    </div> */}
                                </div>
                            </CardWithTitleAndIcon>
                        </ScrollArea>

                        {/* ---------------- Footer ---------------- */}
                        <DialogFooter className="border-t border-border bg-white w-full px-6 py-4 flex items-center justify-end gap-2 absolute bottom-0 left-0 right-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={loading || isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || isSubmitting}
                                className="min-w-[140px]"
                            >
                                {loading || isSubmitting ? (
                                    <>
                                        <LoaderCircle className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {isEditMode ? "Update Product" : "Create Product"}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent >
            </Dialog >
            {showGallery && (
                <WebsiteGalleryModel
                    onCancel={handleGalleryClose}
                    onSentSelected={handleGallerySelect}
                    mode="multiple"
                />
            )}
        </>
    )
}

export default AddProduct