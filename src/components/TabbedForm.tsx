"use client";

import { ReactNode, useEffect, useState } from "react";
import {
    useForm,
    FormProvider,
    DefaultValues,
    SubmitHandler,
    Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodSchema } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, ChevronRight, Circle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
export interface TabConfig {
    id: string;
    label: string;
    badge?: string | number;
    content: ReactNode;
    disabled?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
    iconClassName?: string;
    iconBgClassName?: string;
}

export interface DynamicButtonConfig {
    id: string;
    label: string;
    type?: "button" | "submit";
    variant?:
    | "default"
    | "outline"
    | "ghost"
    | "destructive"
    | "secondary"
    | "link";
    onClick?: () => void | Promise<void>;
    loading?: boolean;
    disabled?: boolean;
    hidden?: boolean;
    className?: string;
}

export type PopupSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

const SIZE_CLASSES: Record<PopupSize, string> = {
    sm: "sm:max-w-md",
    md: "sm:max-w-xl",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-5xl",
    "2xl": "sm:max-w-7xl",
    full: "sm:max-w-[96vw] h-[94vh]",
};

interface DynamicFormPopupProps<TFormValues extends Record<string, any>> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    subtitle?: ReactNode;
    tabs?: TabConfig[];
    children?: ReactNode;
    activeTab?: string;
    onActiveTabChange?: (tabId: string) => void;
    defaultActiveTab?: string;
    defaultValues: DefaultValues<TFormValues>;
    validationSchema?: ZodSchema<TFormValues>;
    onSubmit: SubmitHandler<TFormValues>;
    mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
    buttons?: DynamicButtonConfig[];
    submitLabel?: string;
    cancelLabel?: string;
    isSubmitting?: boolean;
    hideFooter?: boolean;
    size?: PopupSize;
    className?: string;
    preventClose?: boolean;
    /** Optional right-hand sidebar rendered next to the scrollable body */
    sidebar?: ReactNode;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
function DynamicFormPopupInner<TFormValues extends Record<string, any>>({
    open,
    onOpenChange,
    title,
    subtitle,
    tabs,
    children,
    activeTab: controlledActiveTab,
    onActiveTabChange,
    defaultActiveTab,
    defaultValues,
    validationSchema,
    onSubmit,
    mode = "onSubmit",
    buttons,
    submitLabel = "Save",
    cancelLabel = "Cancel",
    isSubmitting = false,
    hideFooter = false,
    size = "lg",
    className,
    preventClose = false,
    sidebar,
}: DynamicFormPopupProps<TFormValues>) {
    const methods = useForm<TFormValues>({
        defaultValues,
        resolver: validationSchema
            ? (zodResolver(validationSchema as any) as Resolver<TFormValues>)
            : undefined,
        mode,
    });

    const { handleSubmit, reset } = methods;

    useEffect(() => {
        if (open) {
            reset(defaultValues);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, defaultValues, reset]);

    const [uncontrolledTab, setUncontrolledTab] = useState(
        defaultActiveTab ?? tabs?.[0]?.id
    );
    const activeTab = controlledActiveTab ?? uncontrolledTab;
    const setActiveTab = onActiveTabChange ?? setUncontrolledTab;

    const handleOpenChange = (next: boolean) => {
        if (!next && preventClose) return;
        onOpenChange(next);
    };

    const currentTabIndex = tabs?.findIndex((tab) => tab.id === activeTab);

    const renderFooter = () => {
        if (hideFooter) return null;

        if (buttons && buttons.length > 0) {
            return (
                <DialogFooter
                    className="
                        flex
                        flex-col-reverse
                        gap-3
                        border-t
                        border-slate-200
                        bg-white/95
                        px-6
                        py-4
                        backdrop-blur-xl
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                    "
                >
                    <div className="text-xs text-slate-400">
                        {isSubmitting
                            ? "Saving your changes..."
                            : "All changes are validated before saving."}
                    </div>
                    <div className="flex items-center gap-2">
                        {buttons
                            .filter((btn) => !btn.hidden)
                            .map((btn) => (
                                <Button
                                    key={btn.id}
                                    type={btn.type ?? "button"}
                                    variant={btn.variant ?? "outline"}
                                    disabled={btn.disabled || btn.loading}
                                    onClick={
                                        btn.type === "submit"
                                            ? undefined
                                            : btn.onClick
                                    }
                                    className={cn(
                                        "h-10 rounded-xl px-5 font-semibold transition-all",
                                        "active:scale-[0.98]",
                                        btn.variant === "default" &&
                                        "bg-[#1a3260] text-white shadow-sm hover:bg-[#14284d] hover:shadow-md",
                                        (!btn.variant ||
                                            btn.variant === "outline") &&
                                        "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                                        btn.className
                                    )}
                                >
                                    {btn.loading && (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    )}
                                    {btn.label}
                                </Button>
                            ))}
                    </div>
                </DialogFooter>
            );
        }

        return (
            <DialogFooter
                className="
                    flex
                    flex-col-reverse
                    gap-3
                    border-t
                    border-slate-200
                    bg-white/95
                    px-6
                    py-4
                    backdrop-blur-xl
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                "
            >
                <div className="text-xs text-slate-400">
                    {isSubmitting
                        ? "Saving your changes..."
                        : "Make sure all required information is complete."}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isSubmitting}
                        className="
                            h-10
                            rounded-xl
                            border-slate-200
                            bg-white
                            px-5
                            font-semibold
                            text-slate-700
                            hover:bg-slate-50
                        "
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="
                            h-10
                            min-w-32
                            rounded-xl
                            bg-[#1a3260]
                            px-6
                            font-semibold
                            text-white
                            shadow-sm
                            hover:bg-[#14284d]
                            hover:shadow-md
                        "
                    >
                        {isSubmitting && (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        {submitLabel}
                    </Button>
                </div>
            </DialogFooter>
        );
    };

    const body =
        tabs && tabs.length > 0 ? (
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex w-full flex-col"
            >
                <TabsList className="h-auto w-full border border-gray-200 justify-start gap-1 py-5.5 rounded-lg bg-primary/5 scrollbar-none">
                    {tabs.map((tab) => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            disabled={tab.disabled}
                            className={cn(
                                "group relative flex items-center gap-1.5",
                                "rounded-lg border border-transparent",
                                "px-4 py-4.5",
                                "text-sm font-medium text-gray-500",
                                "transition-all duration-200 ease-out",
                                "hover:-translate-y-px hover:bg-white/70 hover:text-gray-900",
                                "hover:shadow-sm",
                                "data-[state=active]:bg-white",
                                "data-[state=active]:text-primary",
                                "active:scale-[0.98]",
                                "disabled:pointer-events-none",
                                "disabled:cursor-not-allowed",
                                "disabled:opacity-40"
                            )}
                        >
                            {tab.icon && (
                                <tab.icon
                                    className={cn(
                                        "mr-1 size-4",
                                        tab.iconClassName
                                    )}
                                />
                            )}
                            {tab.label}
                            {tab.badge !== undefined && (
                                <span
                                    className={cn(
                                        "ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none transition-colors duration-200",
                                        "bg-gray-100 text-gray-500",
                                        "group-data-[state=active]:bg-primary group-data-[state=active]:text-white"
                                    )}
                                >
                                    {tab.badge}
                                </span>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="min-h-0">
                    {tabs.map((tab) => (
                        <TabsContent
                            key={tab.id}
                            value={tab.id}
                            className="mt-3 outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200"
                        >
                            {tab.content}
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        ) : (
            children
        );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className={cn(
                    SIZE_CLASSES[size],
                    `
                        flex
                        max-h-[94vh]
                        flex-col
                        gap-0
                        overflow-hidden
                        rounded-2xl
                        border
                        border-slate-200
                        bg-slate-50
                        p-0
                        shadow-2xl
                    `,
                    className
                )}
                onInteractOutside={(event) => {
                    if (preventClose) event.preventDefault();
                }}
                onEscapeKeyDown={(event) => {
                    if (preventClose) event.preventDefault();
                }}
            >
                {/* Header */}
                <DialogHeader className="shrink-0 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur-xl sm:px-7">
                    <div className="flex items-start justify-between gap-5">
                        <div className="flex justify-center items-center gap-2">
                            <div className="p-1.5 bg-primary rounded-lg text-white">
                                <Plus />
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
                                    {title}
                                </DialogTitle>
                                {subtitle && (
                                    <DialogDescription className="text-sm leading-5 text-slate-500">
                                        {subtitle}
                                    </DialogDescription>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Form */}
                <FormProvider {...methods}>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex min-h-0 flex-1 flex-col overflow-hidden"
                    >
                        <div className="flex min-h-0 flex-1 overflow-hidden">
                            {/* Main scrollable content */}
                            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-5">
                                {body}
                            </div>

                            {/* Right sidebar */}
                            {sidebar && (
                                <aside className="hidden w-96 shrink-0 overflow-y-auto border-l border-slate-200 bg-slate-50/50 p-4 lg:block">
                                    {sidebar}
                                </aside>
                            )}
                        </div>

                        {renderFooter()}
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}

export const DynamicFormPopup = DynamicFormPopupInner;
export default DynamicFormPopup;