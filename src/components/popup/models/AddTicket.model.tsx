/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client/react";
import { CREATE_TICKET, UPDATE_TICKET } from "@/graphql/query/ticket.query";
import {
    BiSupport,
    BiCalendar,
    BiMap,
    BiTag,
    BiImage,
    BiPurchaseTag,
} from "react-icons/bi";
import { FiUpload, FiPaperclip, FiX } from "react-icons/fi";
import { useForm, Controller, FieldError, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { removeTypename } from "@/helpers/removetypename";
import { cn } from "@/lib/utils";

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
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoaderCircle } from "lucide-react";
import AppGalleryModel from "./AppGallery.model";

// Import enums from the SAME source as your page
import { TicketStatus, TicketPriority, Task } from "@/enums/common.enums";
import Image from "next/image";

// ===================== Types =====================
interface AddTicketProps {
    onCancel: () => void;
    selectedData: any;
    isEditMode: boolean;
    refetch: () => void;
    currentMemberId?: string;
    companyId?: string;
}

// ===================== Zod Schema =====================
const ticketSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    description: z.string().min(1, "Description is required"),
    status: z.nativeEnum(TicketStatus),
    priority: z.nativeEnum(TicketPriority),
    task: z.nativeEnum(Task),
    dueDate: z.string().optional(),
    address: z.string().optional(),
    attachments: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

// ===================== Visual maps =====================
const PRIORITY_STYLES: Record<string, string> = {
    [TicketPriority.LOW]:
        "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    [TicketPriority.MEDIUM]:
        "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
    [TicketPriority.HIGH]:
        "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900",
    [TicketPriority.URGENT]:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
};

const STATUS_DOT: Record<string, string> = {
    [TicketStatus.OPEN]: "bg-emerald-500",
    [TicketStatus.IN_PROGRESS]: "bg-blue-500",
    [TicketStatus.RESOLVED]: "bg-slate-400",
    [TicketStatus.CLOSED]: "bg-slate-400",
};

const priorityBadgeClass = (p?: string) =>
    cn(
        "capitalize border",
        p && PRIORITY_STYLES[p]
            ? PRIORITY_STYLES[p]
            : "bg-muted text-muted-foreground border-border"
    );

const statusDotClass = (s?: string) => (s && STATUS_DOT[s]) || "bg-muted-foreground";

// ===================== Error Display Components =====================
const FieldErrorDisplay = ({ error }: { error?: FieldError }) => {
    if (!error) return null;
    return (
        <p className="text-xs font-medium text-destructive mt-1.5 flex items-center gap-1">
            {error.message}
        </p>
    );
};

const FieldLabel = ({
    children,
    required,
}: {
    children: React.ReactNode;
    required?: boolean;
}) => (
    <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
        {children}
        {required && <span className="text-destructive">*</span>}
    </label>
);

// ===================== Component =====================
const AddTicketModal: React.FC<AddTicketProps> = ({
    onCancel,
    selectedData,
    isEditMode,
    refetch,
    currentMemberId,
    companyId,
}) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const [showGalleryOpen, setShowGalleryOpen] = useState(false);
    const [attachments, setAttachments] = useState<string[]>([]);

    const form = useForm<TicketFormValues>({
        resolver: zodResolver(ticketSchema) as Resolver<TicketFormValues>,
        defaultValues: {
            subject: "",
            description: "",
            status: TicketStatus.OPEN,
            priority: TicketPriority.MEDIUM,
            task: Task.GENERAL,
            dueDate: "",
            address: "",
            attachments: [],
            tags: [],
        },
    });

    const {
        reset,
        setValue,
        control,
        handleSubmit,
        formState: { errors },
    } = form;

    // Populate edit data
    useEffect(() => {
        if (isEditMode && selectedData) {
            reset({
                subject: selectedData.subject || "",
                description: selectedData.description || "",
                status: selectedData.status || TicketStatus.OPEN,
                priority: selectedData.priority || TicketPriority.MEDIUM,
                task: selectedData.task || Task.GENERAL,
                dueDate: selectedData.dueDate
                    ? new Date(selectedData.dueDate).toISOString().split("T")[0]
                    : "",
                address: selectedData.address || "",
                attachments: selectedData.attachments || [],
                tags: selectedData.tags || [],
            });
            setAttachments(selectedData.attachments || []);
        }
    }, [isEditMode, selectedData, reset]);

    // GraphQL mutations
    const [createTicket] = useMutation<any>(CREATE_TICKET);
    const [updateTicket] = useMutation<any>(UPDATE_TICKET);

    const onSubmit = async (data: TicketFormValues) => {
        setLoading(true);
        try {
            const ticketData = {
                subject: data.subject.trim(),
                description: data.description.trim(),
                status: data.status,
                priority: data.priority,
                task: data.task,
                dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
                address: data.address?.trim() || null,
                attachments: data.attachments,
                tags: data.tags,
            };

            console.log({ticketData:ticketData})
            // Remove Apollo's __typename before sending
            const cleanInput = removeTypename(ticketData);

            console.log({cleanInput:cleanInput})

            let response;
            if (isEditMode && selectedData) {
                const id = selectedData._id || selectedData.id;
                response = await updateTicket({
                    variables: {
                        id,
                        input: { id, ...cleanInput },
                    },
                });
                if (response?.data?.updateTicket?.success) {
                    toast.success("Ticket updated!");
                    refetch();
                    onCancel();
                } else {
                    throw new Error(
                        response?.data?.updateTicket?.message || "Update failed"
                    );
                }
            } else {
                response = await createTicket({
                    variables: {
                        input: {
                            ...cleanInput,
                            companyId,
                            createdBy: currentMemberId,
                        },
                    },
                });
                if (response?.data?.createTicket?.success) {
                    toast.success("Ticket created!");
                    refetch();
                    onCancel();
                } else {
                    throw new Error(
                        response?.data?.createTicket?.message || "Creation failed"
                    );
                }
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred", {
                position: "top-center",
            });
        } finally {
            setLoading(false);
        }
    };

    // Attachment helpers
    const handleAddAttachment = (url: string) => {
        const updated = [...attachments, url];
        setAttachments(updated);
        setValue("attachments", updated);
    };

    const handleRemoveAttachment = (index: number) => {
        const updated = attachments.filter((_, i) => i !== index);
        setAttachments(updated);
        setValue("attachments", updated);
    };

    const handleGallerySelected = (images: any[]) => {
        images.forEach((img) => handleAddAttachment(img.secure_url));
        setShowGalleryOpen(false);
    };

    // Tag helpers
    const [tagInput, setTagInput] = useState("");

    const handleAddTag = () => {
        const tag = tagInput.trim();
        if (tag && !form.getValues("tags").includes(tag)) {
            const newTags = [...form.getValues("tags"), tag];
            setValue("tags", newTags);
        }
        setTagInput("");
    };

    const handleRemoveTag = (tag: string) => {
        const newTags = form.getValues("tags").filter((t) => t !== tag);
        setValue("tags", newTags);
    };

    const descriptionValue = form.watch("description") || "";
    const tagsValue = form.watch("tags") || [];
    const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(url);

    return (
        <>
            <Dialog open={true} onOpenChange={() => onCancel()}>
                <DialogContent className="!max-w-5xl max-h-[90vh] p-0 overflow-hidden gap-0">
                    {/* Header */}
                    <DialogHeader className="px-6 py-5 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <BiSupport className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold leading-tight">
                                    {isEditMode ? "Edit Ticket" : "Create New Ticket"}
                                </DialogTitle>
                                <DialogDescription className="text-sm">
                                    {isEditMode
                                        ? "Update the details below and save your changes."
                                        : "Fill in the details to open a new support ticket."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col h-full min-h-0"
                    >
                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="w-full flex flex-col flex-1 min-h-0"
                        >
                            <div className="px-6 pt-4">
                                <TabsList className="grid grid-cols-2 !pb-10 mb-4 bg-muted">
                                    <TabsTrigger
                                        value="basic"
                                        className="flex items-center !py-2 !px-4 gap-2"
                                    >
                                        <BiSupport className="w-4 h-4" /> Basic Info
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="additional"
                                        className="flex items-center !py-2 !px-4 gap-2"
                                    >
                                        <BiTag className="w-4 h-4" /> Attachments &amp; Tags
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1 min-h-0">
                                <div className="px-6 py-6">
                                    {/* Basic Info Tab */}
                                    <TabsContent value="basic" className="mt-0 space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="space-y-5">
                                                <div>
                                                    <FieldLabel required>Subject</FieldLabel>
                                                    <Controller
                                                        name="subject"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Input
                                                                {...field}
                                                                placeholder="e.g. Unable to access billing dashboard"
                                                                className={cn(
                                                                    errors.subject &&
                                                                    "border-destructive focus-visible:ring-destructive/30"
                                                                )}
                                                            />
                                                        )}
                                                    />
                                                    <FieldErrorDisplay error={errors.subject} />
                                                </div>

                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <FieldLabel required>Description</FieldLabel>
                                                        <span className="text-xs text-muted-foreground">
                                                            {descriptionValue.length} characters
                                                        </span>
                                                    </div>
                                                    <Controller
                                                        name="description"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Textarea
                                                                {...field}
                                                                placeholder="Describe the issue in as much detail as possible — what happened, when, and any steps already taken..."
                                                                className={cn(
                                                                    "min-h-[140px] resize-none",
                                                                    errors.description &&
                                                                    "border-destructive focus-visible:ring-destructive/30"
                                                                )}
                                                            />
                                                        )}
                                                    />
                                                    <FieldErrorDisplay error={errors.description} />
                                                </div>

                                                {/* <Separator /> */}


                                            </div>

                                            {/* Right side removed - no preview */}
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <FieldLabel>Status</FieldLabel>
                                                        <Controller
                                                            name="status"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Select
                                                                    value={field.value}
                                                                    onValueChange={field.onChange}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select status" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Object.values(TicketStatus).map((s) => (
                                                                            <SelectItem key={s} value={s}>
                                                                                <span className="flex items-center gap-2">
                                                                                    <span
                                                                                        className={cn(
                                                                                            "h-2 w-2 rounded-full",
                                                                                            statusDotClass(s)
                                                                                        )}
                                                                                    />
                                                                                    {s.replace(/_/g, " ")}
                                                                                </span>
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        />
                                                    </div>
                                                    <div>
                                                        <FieldLabel>Priority</FieldLabel>
                                                        <Controller
                                                            name="priority"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Select
                                                                    value={field.value}
                                                                    onValueChange={field.onChange}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select priority" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Object.values(TicketPriority).map((p) => (
                                                                            <SelectItem key={p} value={p}>
                                                                                <span className="capitalize">{p}</span>
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <FieldLabel>Task Type</FieldLabel>
                                                        <Controller
                                                            name="task"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Select
                                                                    value={field.value}
                                                                    onValueChange={field.onChange}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select task" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Object.values(Task).map((t) => (
                                                                            <SelectItem key={t} value={t}>
                                                                                {t.replace(/_/g, " ")}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        />
                                                    </div>
                                                    <div>
                                                        <FieldLabel>
                                                            <span className="flex items-center gap-1.5">
                                                                <BiCalendar className="h-4 w-4 text-muted-foreground" />
                                                                Due Date
                                                            </span>
                                                        </FieldLabel>
                                                        <Controller
                                                            name="dueDate"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Input type="date" {...field} />
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <FieldLabel>
                                                        <span className="flex items-center gap-1.5">
                                                            <BiMap className="h-4 w-4 text-muted-foreground" />
                                                            Address
                                                            <span className="text-xs font-normal text-muted-foreground">
                                                                (optional)
                                                            </span>
                                                        </span>
                                                    </FieldLabel>
                                                    <Controller
                                                        name="address"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Input
                                                                {...field}
                                                                placeholder="Site or location relevant to this ticket"
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Attachments & Tags Tab */}
                                    <TabsContent value="additional" className="mt-0 space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Attachments */}
                                            <div className="bg-muted/40 p-5 rounded-xl border border-border">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm font-semibold flex items-center text-foreground uppercase tracking-wide">
                                                        <BiImage className="mr-2 h-4 w-4" /> Attachments
                                                    </h3>
                                                    <span className="text-xs text-muted-foreground">
                                                        {attachments.length} file
                                                        {attachments.length === 1 ? "" : "s"}
                                                    </span>
                                                </div>

                                                <div className="space-y-2 mb-3">
                                                    {attachments.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center text-center py-8 rounded-lg border border-dashed border-border bg-background/50">
                                                            <FiPaperclip className="h-5 w-5 text-muted-foreground mb-2" />
                                                            <p className="text-sm text-muted-foreground">
                                                                No files attached yet
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        attachments.map((url, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center gap-3 bg-background p-2.5 rounded-lg border border-border"
                                                            >
                                                                {isImageUrl(url) ? (
                                                                    <Image
                                                                        src={url}
                                                                        alt="attachment preview"
                                                                        className="h-9 w-9 rounded-md object-cover shrink-0 border border-border"
                                                                        width={100}
                                                                        height={100}
                                                                    />
                                                                ) : (
                                                                    <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                                                                        <FiPaperclip className="h-4 w-4 text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                                <span className="text-sm truncate flex-1 min-w-0">
                                                                    {url.split("/").pop()}
                                                                </span>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => handleRemoveAttachment(index)}
                                                                >
                                                                    <FiX className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() => setShowGalleryOpen(true)}
                                                >
                                                    <FiUpload className="mr-2 h-4 w-4" /> Add from Gallery
                                                </Button>
                                            </div>

                                            {/* Tags */}
                                            <div className="bg-muted/40 p-5 rounded-xl border border-border">
                                                <h3 className="text-sm font-semibold mb-4 flex items-center text-foreground uppercase tracking-wide">
                                                    <BiTag className="mr-2 h-4 w-4" /> Tags
                                                </h3>

                                                <div className="min-h-[40px] flex flex-wrap gap-2 mb-3 p-2 rounded-lg border border-dashed border-border bg-background/50">
                                                    {tagsValue.length === 0 ? (
                                                        <span className="text-sm text-muted-foreground flex items-center gap-1.5 px-1">
                                                            <BiPurchaseTag className="h-4 w-4" />
                                                            No tags added yet
                                                        </span>
                                                    ) : (
                                                        tagsValue.map((tag) => (
                                                            <Badge
                                                                key={tag}
                                                                variant="secondary"
                                                                className="gap-1 pl-2.5 pr-1.5 py-1 text-sm"
                                                            >
                                                                {tag}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveTag(tag)}
                                                                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 hover:text-destructive transition-colors"
                                                                    aria-label={`Remove tag ${tag}`}
                                                                >
                                                                    <FiX className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        ))
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <Input
                                                        value={tagInput}
                                                        onChange={(e) => setTagInput(e.target.value)}
                                                        placeholder="Type a tag and press Enter"
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                handleAddTag();
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={handleAddTag}
                                                        disabled={!tagInput.trim()}
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </Tabs>

                        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30 sm:justify-between gap-2">
                            <p className="hidden sm:block text-xs text-muted-foreground">
                                Fields marked <span className="text-destructive">*</span> are
                                required
                            </p>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="flex-1 sm:flex-none"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 sm:flex-none min-w-[140px]"
                                >
                                    {loading ? (
                                        <>
                                            <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : isEditMode ? (
                                        "Update Ticket"
                                    ) : (
                                        "Create Ticket"
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {showGalleryOpen && (
                <AppGalleryModel
                    onCancel={() => setShowGalleryOpen(false)}
                    onSentSelected={handleGallerySelected}
                    mode={"multiple"}
                />
            )}
        </>
    );
};

export default AddTicketModal;