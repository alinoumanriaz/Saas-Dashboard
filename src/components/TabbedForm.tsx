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
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/** One tab: an id, a label shown on the tab trigger, and its content. */
export interface TabConfig {
    id: string;
    label: string;
    content: ReactNode;
    disabled?: boolean;
    /** Optional small badge/count shown next to the label, e.g. FAQs (3) */
    badge?: string | number;
}

/** A single footer button. Fully caller-defined so any page can wire up
 * whatever actions it needs (Cancel, Save Draft, Publish, Delete, etc). */
export interface DynamicButtonConfig {
    id: string;
    label: string;
    /** Defaults to "button". Use "submit" to trigger the form's onSubmit/validation. */
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
    xl: "sm:max-w-4xl",
    "2xl": "sm:max-w-6xl",
    full: "sm:max-w-[95vw] h-[90vh]",
};

interface DynamicFormPopupProps<TFormValues extends Record<string, any>> {
    open: boolean;
    onOpenChange: (open: boolean) => void;

    /** Dynamic heading content */
    title: ReactNode;
    subtitle?: ReactNode;

    /** Dynamic tabs. If omitted, `children` is rendered instead (no tab bar). */
    tabs?: TabConfig[];
    children?: ReactNode;
    /** Controlled active tab (optional — component manages its own state if omitted) */
    activeTab?: string;
    onActiveTabChange?: (tabId: string) => void;
    defaultActiveTab?: string;

    /** react-hook-form setup */
    defaultValues: DefaultValues<TFormValues>;
    validationSchema?: ZodSchema<TFormValues>;
    onSubmit: SubmitHandler<TFormValues>;
    mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";

    /**
     * Dynamic footer buttons. If provided, this fully replaces the default
     * Cancel / Submit pair — build any combination of actions you need.
     * If omitted, a default Cancel + Submit button pair is rendered using
     * `cancelLabel` / `submitLabel` / `isSubmitting`.
     */
    buttons?: DynamicButtonConfig[];
    submitLabel?: string;
    cancelLabel?: string;
    isSubmitting?: boolean;
    /** Hide the footer entirely (e.g. for read-only/preview popups) */
    hideFooter?: boolean;

    size?: PopupSize;
    className?: string;
    /** Disable closing on outside click / escape (useful mid-submit) */
    preventClose?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
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
}: DynamicFormPopupProps<TFormValues>) {
    const methods = useForm<TFormValues>({
        defaultValues,
        resolver: validationSchema ? zodResolver(validationSchema as any) as Resolver<TFormValues> : undefined,
        mode,
    });

    const { handleSubmit, reset } = methods;

    // Re-hydrate the form whenever the popup is reopened with new defaults
    // (e.g. switching from "Add" to "Edit" on a different row).
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

    const renderFooter = () => {
        if (hideFooter) return null;

        if (buttons && buttons.length > 0) {
            return (
                <DialogFooter className="gap-2.5 border-t border-gray-100 px-6 py-4 sm:gap-2.5">
                    {buttons
                        .filter((btn) => !btn.hidden)
                        .map((btn) => (
                            <Button
                                key={btn.id}
                                type={btn.type ?? "button"}
                                variant={btn.variant ?? "outline"}
                                disabled={btn.disabled || btn.loading}
                                onClick={btn.type === "submit" ? undefined : btn.onClick}
                                className={cn(
                                    "min-w-24 rounded-lg font-medium transition-all duration-150 active:scale-[0.98]",
                                    btn.variant === "default" &&
                                    "bg-primary shadow-sm hover:bg-primary hover:shadow-md",
                                    (!btn.variant || btn.variant === "outline") &&
                                    "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                                    btn.className
                                )}
                            >
                                {btn.loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                                {btn.label}
                            </Button>
                        ))}
                </DialogFooter>
            );
        }

        return (
            <DialogFooter className="gap-2.5 border-t border-gray-100 px-6 py-4 sm:gap-2.5">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                    className="rounded-lg border-gray-200 font-medium text-gray-700 transition-all duration-150 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                >
                    {cancelLabel}
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-28 rounded-lg bg-primary font-medium shadow-sm transition-all duration-150 hover:bg-primary hover:shadow-md active:scale-[0.98]"
                >
                    {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {submitLabel}
                </Button>
            </DialogFooter>
        );
    };

    const body =
        tabs && tabs.length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-gray-200 p-0">
                    {tabs.map((tab) => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            disabled={tab.disabled}
                            className={cn(
                                "group relative -mb-px rounded-none  border-transparent! bg-transparent! px-4 py-2.5",
                                "font-medium text-sm text-gray-500 shadow-none! transition-colors duration-200",
                                "hover:text-gray-800",
                                "data-[state=active]:border-b-primary! data-[state=active]:bg-transparent!",
                                "data-[state=active]:text-gray-900 data-[state=active]:shadow-none",
                                "disabled:cursor-not-allowed disabled:text-gray-300"
                            )}
                        >
                            {tab.label}
                            {tab.badge !== undefined && (
                                <span
                                    className={cn(
                                        "ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none transition-colors duration-200",
                                        "bg-gray-100 text-gray-500",
                                        "group-data-[state=active]:bg-primary group-data-[state=active]:text-primary"
                                    )}
                                >
                                    {tab.badge}
                                </span>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {tabs.map((tab) => (
                    <TabsContent
                        key={tab.id}
                        value={tab.id}
                        className="mt-5 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200"
                    >
                        {tab.content}
                    </TabsContent>
                ))}
            </Tabs>
        ) : (
            children
        );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className={cn(
                    SIZE_CLASSES[size],
                    "flex flex-col gap-0 overflow-hidden rounded-xl border-none! p-0",
                    className
                )}
                onInteractOutside={(e) => preventClose && e.preventDefault()}
                onEscapeKeyDown={(e) => preventClose && e.preventDefault()}
            >
                <DialogHeader className="space-y-1 border-b border-gray-100 px-6 py-5">
                    <DialogTitle className="text-lg font-semibold tracking-tight text-gray-900">
                        {title}
                    </DialogTitle>
                    {subtitle && (
                        <DialogDescription className="text-sm text-gray-500">
                            {subtitle}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <FormProvider {...methods}>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-1 flex-col overflow-hidden"
                    >
                        <div className="flex-1 overflow-y-auto px-6 py-1">{body}</div>
                        {renderFooter()}
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}

export const DynamicFormPopup = DynamicFormPopupInner;
export default DynamicFormPopup;