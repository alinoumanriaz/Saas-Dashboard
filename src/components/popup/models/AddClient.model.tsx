/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client/react";
import { CREATE_CLIENT, UPDATE_CLIENT } from "@/graphql/query/client.query";
import {
  BiUser,
  BiEnvelope,
  BiPhone,
  BiBuilding,
  BiMap,
  BiGlobe,
  BiPlus,
  BiX,
  BiStar,
} from "react-icons/bi";
import { removeTypename } from "@/helpers/removetypename";
import {
  useForm,
  Controller,
  useFieldArray,
  FieldError as RHFError,
  Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ===================== Types =====================
interface AddClientProps {
  onCancel: () => void;
  selectedData: any;
  isEditMode: boolean;
  refetch: () => void;
  currentMemberId?: string; // not used but kept for consistency
}

// ===================== Zod Schema =====================
const addressSchema = z.object({
  type: z.enum(["billing", "shipping", "office", "home", "other"]).default("other"),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  isDefault: z.boolean().default(false),
});

const clientSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  secondaryEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  company: z.string().optional(),
  designation: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["lead", "customer", "inactive", "blocked"]).default("lead"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  isVerified: z.boolean().default(false),
  isActive: z.boolean().default(false),
  preferredCurrency: z.string().optional(),
  preferredLanguage: z.string().optional(),
  timezone: z.string().optional(),
  notes: z.string().optional(),
  addresses: z.array(addressSchema).default([]),
});

type ClientFormValues = z.infer<typeof clientSchema>;

// ===================== Small building blocks =====================
const FieldErrorDisplay = ({ error }: { error?: RHFError }) => {
  if (!error) return null;
  return <p className="text-xs text-destructive mt-1">{error.message}</p>;
};

// Wraps a label + control + error so every field has consistent spacing,
// a visible required marker, and room for its error message (nothing
// jumps around or gets clipped when validation kicks in).
const FormField = ({
  label,
  required,
  htmlFor,
  icon,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  icon?: React.ReactNode;
  error?: RHFError;
  children: React.ReactNode;
}) => (
  <div>
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium text-foreground/90 flex items-center gap-1.5"
    >
      {icon}
      {label}
      {required && <span className="text-destructive">*</span>}
    </label>
    <div className="mt-1.5">{children}</div>
    <FieldErrorDisplay error={error} />
  </div>
);

const SectionHeading = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <div className="mb-4">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {description && (
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    )}
  </div>
);

const TAB_ORDER = ["basic", "addresses", "preferences"] as const;
type TabValue = (typeof TAB_ORDER)[number];

const ADDRESS_TYPE_META: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  billing: { label: "Billing", icon: <BiStar className="w-4 h-4" /> },
  shipping: { label: "Shipping", icon: <BiGlobe className="w-4 h-4" /> },
  office: { label: "Office", icon: <BiBuilding className="w-4 h-4" /> },
  home: { label: "Home", icon: <BiMap className="w-4 h-4" /> },
  other: { label: "Other", icon: <BiMap className="w-4 h-4" /> },
};

// ===================== Component =====================
const AddClient: React.FC<AddClientProps> = ({
  onCancel,
  selectedData,
  isEditMode,
  refetch,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("basic");

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as Resolver<ClientFormValues>,
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      secondaryEmail: "",
      phone: "",
      mobile: "",
      whatsapp: "",
      website: "",
      company: "",
      designation: "",
      source: "",
      status: "lead",
      priority: "medium",
      isVerified: false,
      isActive: false,
      preferredCurrency: "",
      preferredLanguage: "",
      timezone: "",
      notes: "",
      addresses: [],
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "addresses",
  });

  // Populate edit data
  useEffect(() => {
    if (isEditMode && selectedData) {
      const addresses =
        selectedData.addresses?.map((addr: any) => ({
          type: addr.type || "other",
          street: addr.street || "",
          city: addr.city || "",
          state: addr.state || "",
          postalCode: addr.postalCode || "",
          country: addr.country || "",
          isDefault: addr.isDefault || false,
        })) || [];

      reset({
        fullName: selectedData.fullName || "",
        email: selectedData.email || "",
        secondaryEmail: selectedData.secondaryEmail || "",
        phone: selectedData.phone || "",
        mobile: selectedData.mobile || "",
        whatsapp: selectedData.whatsapp || "",
        website: selectedData.website || "",
        company: selectedData.company || "",
        designation: selectedData.designation || "",
        source: selectedData.source || "",
        status: selectedData.status || "lead",
        priority: selectedData.priority || "medium",
        isVerified: selectedData.isVerified || false,
        isActive: selectedData.isActive || false,
        preferredCurrency: selectedData.preferredCurrency || "",
        preferredLanguage: selectedData.preferredLanguage || "",
        timezone: selectedData.timezone || "",
        notes: selectedData.notes || "",
        addresses,
      });
    }
  }, [isEditMode, selectedData, reset]);

  // GraphQL mutations
  const [createClient] = useMutation<any>(CREATE_CLIENT);
  const [updateClient] = useMutation<any>(UPDATE_CLIENT);

  // If basic-info fields are invalid, jump the user back to that tab
  // instead of silently blocking the submit button with no explanation.
  const jumpToFirstErrorTab = () => {
    const basicKeys: (keyof ClientFormValues)[] = [
      "fullName",
      "email",
      "secondaryEmail",
      "website",
    ];
    if (basicKeys.some((key) => errors[key])) {
      setActiveTab("basic");
      return;
    }
    if (errors.addresses) {
      setActiveTab("addresses");
    }
  };

  const onInvalid = () => {
    jumpToFirstErrorTab();
    toast.error("Please fix the highlighted fields", { position: "top-center" });
  };

  const onSubmit = async (data: ClientFormValues) => {
    setLoading(true);
    try {
      const clientData = {
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        secondaryEmail: data.secondaryEmail?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        mobile: data.mobile?.trim() || undefined,
        whatsapp: data.whatsapp?.trim() || undefined,
        website: data.website?.trim() || undefined,
        company: data.company?.trim() || undefined,
        designation: data.designation?.trim() || undefined,
        source: data.source?.trim() || undefined,
        status: data.status,
        priority: data.priority,
        isVerified: data.isVerified,
        isActive: data.isActive,
        preferredCurrency: data.preferredCurrency?.trim() || undefined,
        preferredLanguage: data.preferredLanguage?.trim() || undefined,
        timezone: data.timezone?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        addresses: data.addresses.filter(
          (addr) => addr.street || addr.city || addr.state || addr.country
        ), // remove empty addresses
      };
      const cleanInput = removeTypename(clientData);

      let response;
      if (isEditMode && selectedData) {
        response = await updateClient({
          variables: {
            id: selectedData._id || selectedData.id,
            input: { id: selectedData._id || selectedData.id, ...cleanInput },
          },
        });
        if (response?.error) throw new Error(response.error.message);
        if (response?.data?.updateClient?.success) {
          toast.success("Client updated successfully", { position: "top-center" });
          refetch();
          onCancel();
        }
      } else {
        response = await createClient({
          variables: { input: cleanInput },
        });
        console.log("Create Client Response:", response); // Debugging line
        if (response?.error) throw new Error(response.error.message);

        if (response?.data?.createClient?.success) {
          toast.success("Client created successfully", { position: "top-center" });
          refetch();
          onCancel();
        }
      }
    } catch (error: any) {
      const msg = error.message || "An error occurred";
      if (/duplicate|already exists/i.test(msg)) {
        toast.error("Email already registered", { position: "top-center" });
      } else {
        toast.error(msg, { position: "top-center" });
      }
    } finally {
      setLoading(false);
    }
  };

  // Add new empty address and jump straight to it
  const addAddress = () => {
    append({
      type: "other",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      isDefault: fields.length === 0, // first address defaults to "default"
    });
  };

  const goToTab = async (direction: 1 | -1) => {
    const idx = TAB_ORDER.indexOf(activeTab);
    // validate the current tab's fields before letting the user move on
    if (direction === 1 && activeTab === "basic") {
      const valid = await trigger(["fullName", "email", "secondaryEmail", "website"]);
      if (!valid) return;
    }
    const next = TAB_ORDER[idx + direction];
    if (next) setActiveTab(next);
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-3xl! h-[88vh] max-h-[720px] p-0 flex flex-col overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="text-xl font-bold">
            {isEditMode ? "Edit Client" : "Add New Client"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this client's details."
              : "Fill in the details below to create a new client record."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="flex-1 flex flex-col min-h-0"
        >
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Tab bar stays pinned; only the panel below scrolls */}
            <div className="px-6 pt-4 shrink-0">
              <TabsList className="grid w-fit grid-cols-3 h-12! bg-muted p-1">
                <TabsTrigger
                  value="basic"
                  className="flex items-center justify-center gap-2 py-2 text-sm data-[state=active]:shadow-sm"
                >
                  <BiUser className="w-4 h-4 shrink-0" />
                  <span className="truncate">Basic Info</span>
                  {(errors.fullName || errors.email || errors.secondaryEmail || errors.website) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="addresses"
                  className="flex items-center justify-center gap-2 py-2 text-sm data-[state=active]:shadow-sm"
                >
                  <BiMap className="w-4 h-4 shrink-0" />
                  <span className="truncate">Addresses</span>
                  {fields.length > 0 && (
                    <span className="text-xs text-muted-foreground">({fields.length})</span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="preferences"
                  className="flex items-center justify-center gap-2 py-2 text-sm data-[state=active]:shadow-sm"
                >
                  <BiGlobe className="w-4 h-4 shrink-0" />
                  <span className="truncate">Preferences</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* This is the piece that makes scrolling actually work: a
                flex-1 + min-h-0 wrapper gives ScrollArea a bounded height
                to measure against, instead of growing past the dialog. */}
            <div className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-full px-6">
                <TabsContent value="basic" className="space-y-6 px-1 pb-6 mt-0">
                  <div>
                    <SectionHeading title="Contact details" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                      <FormField label="Full Name" required icon={<BiUser className="w-3.5 h-3.5 text-muted-foreground" />} error={errors.fullName}>
                        <Controller
                          name="fullName"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} placeholder="John Doe" aria-invalid={!!errors.fullName} />
                          )}
                        />
                      </FormField>
                      <FormField label="Email" required icon={<BiEnvelope className="w-3.5 h-3.5 text-muted-foreground" />} error={errors.email}>
                        <Controller
                          name="email"
                          control={control}
                          render={({ field }) => (
                            <Input type="email" {...field} placeholder="john@example.com" aria-invalid={!!errors.email} />
                          )}
                        />
                      </FormField>
                      <FormField label="Secondary Email" error={errors.secondaryEmail}>
                        <Controller
                          name="secondaryEmail"
                          control={control}
                          render={({ field }) => (
                            <Input type="email" {...field} placeholder="john.alt@example.com" aria-invalid={!!errors.secondaryEmail} />
                          )}
                        />
                      </FormField>
                      <FormField label="Phone" icon={<BiPhone className="w-3.5 h-3.5 text-muted-foreground" />}>
                        <Controller
                          name="phone"
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="+1 (555) 123-4567" />}
                        />
                      </FormField>
                      <FormField label="Mobile">
                        <Controller
                          name="mobile"
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="+1 (555) 987-6543" />}
                        />
                      </FormField>
                      <FormField label="WhatsApp">
                        <Controller
                          name="whatsapp"
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="+1 (555) 555-5555" />}
                        />
                      </FormField>
                    </div>
                  </div>

                  <div>
                    <SectionHeading title="Company" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                      <FormField label="Company" icon={<BiBuilding className="w-3.5 h-3.5 text-muted-foreground" />}>
                        <Controller
                          name="company"
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="Acme Inc." />}
                        />
                      </FormField>
                      <FormField label="Designation">
                        <Controller
                          name="designation"
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="CEO" />}
                        />
                      </FormField>
                      <FormField label="Website" icon={<BiGlobe className="w-3.5 h-3.5 text-muted-foreground" />} error={errors.website}>
                        <Controller
                          name="website"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} placeholder="https://example.com" aria-invalid={!!errors.website} />
                          )}
                        />
                      </FormField>
                      <FormField label="Source">
                        <Controller
                          name="source"
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="Website, Referral, etc." />}
                        />
                      </FormField>
                    </div>
                  </div>

                  <div>
                    <SectionHeading title="Status" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <FormField label="Status">
                        <Controller
                          name="status"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lead">Lead</SelectItem>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>
                      <FormField label="Priority">
                        <Controller
                          name="priority"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      <Controller
                        name="isVerified"
                        control={control}
                        render={({ field }) => (
                          <label className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer">
                            <span className="text-sm font-medium">Verified Account</span>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </label>
                        )}
                      />
                      <Controller
                        name="isActive"
                        control={control}
                        render={({ field }) => (
                          <label className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer">
                            <span className="text-sm font-medium">Active Account</span>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </label>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Addresses Tab */}
                <TabsContent value="addresses" className="space-y-4 px-1 pb-6 mt-0">
                  <div className="flex items-center justify-between">
                    <SectionHeading
                      title="Addresses"
                      description="Add one or more addresses for this client."
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addAddress}>
                      <BiPlus className="mr-1 w-4 h-4" /> Add Address
                    </Button>
                  </div>

                  {fields.length === 0 && (
                    <div className="border border-dashed rounded-lg py-10 flex flex-col items-center justify-center text-center gap-2">
                      <BiMap className="w-8 h-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No addresses yet.</p>
                      <Button type="button" variant="outline" size="sm" onClick={addAddress}>
                        <BiPlus className="mr-1 w-4 h-4" /> Add the first address
                      </Button>
                    </div>
                  )}

                  {fields.map((field, index) => {
                    const currentType = form.watch(`addresses.${index}.type`) || "other";
                    const meta = ADDRESS_TYPE_META[currentType] ?? ADDRESS_TYPE_META.other;
                    return (
                      <div
                        key={field.id}
                        className="border rounded-lg p-4 space-y-4 bg-muted/30"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{meta.icon}</span>
                            Address #{index + 1}
                            <span className="text-xs font-normal text-muted-foreground">
                              &middot; {meta.label}
                            </span>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-destructive hover:text-destructive h-8 w-8"
                            aria-label={`Remove address ${index + 1}`}
                          >
                            <BiX className="w-5 h-5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField label="Type">
                            <Controller
                              name={`addresses.${index}.type`}
                              control={control}
                              render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(ADDRESS_TYPE_META).map(([value, m]) => (
                                      <SelectItem key={value} value={value}>
                                        <span className="flex items-center gap-2">
                                          {m.icon} {m.label}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </FormField>

                          <div className="flex items-end">
                            <Controller
                              name={`addresses.${index}.isDefault`}
                              control={control}
                              render={({ field }) => (
                                <label className="flex items-center gap-2 w-full h-9 px-3 rounded-md border bg-background cursor-pointer">
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  <span className="text-sm">Set as default address</span>
                                </label>
                              )}
                            />
                          </div>

                          <FormField label="Street" htmlFor={`addr-street-${index}`}>
                            <Controller
                              name={`addresses.${index}.street`}
                              control={control}
                              render={({ field }) => (
                                <Input id={`addr-street-${index}`} {...field} placeholder="123 Main St" />
                              )}
                            />
                          </FormField>
                          <FormField label="City">
                            <Controller
                              name={`addresses.${index}.city`}
                              control={control}
                              render={({ field }) => <Input {...field} placeholder="New York" />}
                            />
                          </FormField>
                          <FormField label="State">
                            <Controller
                              name={`addresses.${index}.state`}
                              control={control}
                              render={({ field }) => <Input {...field} placeholder="NY" />}
                            />
                          </FormField>
                          <FormField label="Postal Code">
                            <Controller
                              name={`addresses.${index}.postalCode`}
                              control={control}
                              render={({ field }) => <Input {...field} placeholder="10001" />}
                            />
                          </FormField>
                          <FormField label="Country">
                            <Controller
                              name={`addresses.${index}.country`}
                              control={control}
                              render={({ field }) => <Input {...field} placeholder="United States" />}
                            />
                          </FormField>
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>

                {/* Preferences & Notes Tab */}
                <TabsContent value="preferences" className="space-y-6 px-1 pb-6 mt-0">
                  <div>
                    <SectionHeading title="Preferences" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-4">
                      <FormField label="Preferred Currency">
                        <Controller
                          name="preferredCurrency"
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="USD" />}
                        />
                      </FormField>
                      <FormField label="Preferred Language">
                        <Controller
                          name="preferredLanguage"
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="English" />}
                        />
                      </FormField>
                      <FormField label="Timezone">
                        <Controller
                          name="timezone"
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="America/New_York" />}
                        />
                      </FormField>
                    </div>
                  </div>

                  <div>
                    <SectionHeading title="Notes" description="Internal notes, not visible to the client." />
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={6}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          placeholder="Add any internal notes..."
                        />
                      )}
                    />
                  </div>
                </TabsContent>
              </ScrollArea>
            </div>
          </Tabs>

          <DialogFooter className="border-t border-border px-6 py-4 shrink-0 flex items-center sm:justify-between gap-2">
            <div className="flex gap-2">
              {activeTab !== "basic" && (
                <Button type="button" variant="ghost" onClick={() => goToTab(-1)} disabled={loading}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              {activeTab !== "preferences" ? (
                <Button type="button" onClick={() => goToTab(1)} disabled={loading}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <LoaderCircle className="animate-spin mr-2 w-4 h-4" />
                      Processing...
                    </>
                  ) : (
                    <>{isEditMode ? "Update Client" : "Create Client"}</>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClient;