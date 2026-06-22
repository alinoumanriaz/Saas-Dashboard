/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { useMutation } from "@apollo/client/react";
import { CREATE_MEMBER, UPDATE_MEMBER } from "@/graphql/query/member.query";
import {
  BiUser,
  BiShield,
  BiLock,
  BiImage,
  BiCheckCircle,
  BiMap,
  BiWallet,
  BiPlus,
  BiX,
} from "react-icons/bi";
import { FiUpload } from "react-icons/fi";
import { PlatformRole, MemberStatus, SubscriptionPlan } from "@/enums/common.enums";
import Image from "next/image";
import { removeTypename } from "@/helpers/removetypename";
import { useForm, Controller, useWatch, FieldError as RHFError, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner"

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
import AppGalleryModel from "./AppGallery.model";

// ===================== Types =====================
interface AddMemberProps {
  onCancel: () => void;
  selectedData: any;
  isEditMode: boolean;
  refetch: () => void;
  currentMemberId?: string;
  currentTenantId?: string;
  isSuperAdmin?: boolean;
}

// ===================== Zod Schema =====================
const memberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  role: z.nativeEnum(PlatformRole),
  status: z.nativeEnum(MemberStatus),
  isVerified: z.boolean().default(false),
  avatar: z.string().optional(),
  subscription: z.object({
    plan: z.nativeEnum(SubscriptionPlan),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    isActive: z.boolean().default(true),
    paymentMethod: z.string().optional(),
  }),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }),
}).refine((data) => !data.password || data.password.length >= 6, {
  message: "Password must be at least 6 characters",
  path: ["password"],
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type MemberFormValues = z.infer<typeof memberSchema>;

// ===================== Error Display Components =====================
const FieldErrorDisplay = ({ error }: { error?: RHFError }) => {
  if (!error) return null;
  return <p className="text-sm text-destructive mt-1">{error.message}</p>;
};

const getNestedError = (errors: any, path: string): RHFError | undefined => {
  const parts = path.split(".");
  let current = errors;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current as RHFError | undefined;
};

// ===================== Component =====================
const AddMember: React.FC<AddMemberProps> = ({
  onCancel,
  selectedData,
  isEditMode,
  refetch,
  isSuperAdmin = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedImage, setSelectedImage] = useState<string>("");

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema) as Resolver<MemberFormValues>,
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: isSuperAdmin ? PlatformRole.SUPER_ADMIN : PlatformRole.OWNER,
      status: MemberStatus.ACTIVE,
      isVerified: false,
      avatar: "",
      subscription: {
        plan: SubscriptionPlan.FREE,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        isActive: true,
        paymentMethod: "",
      },
      address: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      },
    },
  });

  const {
    reset,
    setValue,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const watch = useWatch({ control });
  const emailValue = watch.email;
  const usernameValue = watch.username;

  // Populate edit data
  useEffect(() => {
    if (isEditMode && selectedData) {
      const mapped: MemberFormValues = {
        firstName: selectedData.firstName || "",
        lastName: selectedData.lastName || "",
        username: selectedData.username || "",
        email: selectedData.email || "",
        phone: selectedData.phone || "",
        password: "",
        confirmPassword: "",
        role: selectedData.role || PlatformRole.OWNER,
        status: selectedData.status || MemberStatus.ACTIVE,
        isVerified: selectedData.isVerified || false,
        avatar: selectedData.avatar || "",
        subscription: {
          plan: selectedData.subscription?.plan || SubscriptionPlan.FREE,
          startDate: selectedData.subscription?.startDate
            ? new Date(selectedData.subscription.startDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          endDate: selectedData.subscription?.endDate
            ? new Date(selectedData.subscription.endDate).toISOString().split("T")[0]
            : "",
          isActive: selectedData.subscription?.isActive ?? true,
          paymentMethod: selectedData.subscription?.paymentMethod || "",
        },
        address: selectedData.address || { street: "", city: "", state: "", zip: "", country: "" },
      };
      reset(mapped);
      setSelectedImage(selectedData.avatar || "");
    }
  }, [isEditMode, selectedData, reset]);

  const [showGalleryOpen, setShowGalleryOpen] = useState(false);

  const galleryCloseHandler = () => {
    setShowGalleryOpen(false);
  };
  const handleSelectedImage = (images: any[]) => {
    if (images && images.length > 0) {
      const image = images[0];
      const imageUrl = image.secure_url; // Cloudinary image object
      setValue("avatar", imageUrl);
      setSelectedImage(imageUrl);
    }
    setShowGalleryOpen(false);
  };

  // Auto-generate username from email
  useEffect(() => {
    if (!isEditMode && emailValue && !usernameValue) {
      setValue("username", emailValue.split("@")[0]);
    }
  }, [emailValue, usernameValue, isEditMode, setValue]);

  // GraphQL mutations
  const [createMember] = useMutation<any>(CREATE_MEMBER);
  const [updateMember] = useMutation<any>(UPDATE_MEMBER);

  const onSubmit = async (data: MemberFormValues) => {
    setLoading(true);
    try {
      const memberData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || "",
        role: data.role,
        status: data.status,
        isVerified: data.isVerified,
        avatar: data.avatar?.trim() || null,
        subscription: {
          ...data.subscription,
          endDate: data.subscription.endDate ? new Date(data.subscription.endDate) : null,
        },
        address: data.address?.street ? data.address : null,
      };
      const cleanInput = removeTypename(memberData);

      let response;
      if (isEditMode && selectedData) {
        response = await updateMember({
          variables: {
            id: selectedData._id || selectedData.id,
            input: { id: selectedData._id || selectedData.id, ...cleanInput },
          },
        });
        if (response?.error) throw new Error(response.error.message);
        if (response?.data?.updateMember) {
          toast.success("Member updated!", { position: "top-center" });

          refetch();
          onCancel();
        }
      } else {
        response = await createMember({
          variables: { input: { ...cleanInput, password: data.password } },
        });
        if (response?.error) throw new Error(response.error.message);
        if (response.data?.createMember) {
          toast.success("Member created!", { position: "top-center" });
          refetch();
          onCancel();
        }
      }
    } catch (error: any) {
      const msg = error.message || "An error occurred";
      if (/duplicate|already exists/i.test(msg)) {
        toast.error(msg.includes("email") ? "Email already registered" : "Username already taken", { position: "top-center" });
      } else {
        toast.error(msg, { position: "top-center" });
      }
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setValue("avatar", "");
    setSelectedImage("");
  };

  // Helper: render role icon
  const renderRoleIcon = (role: PlatformRole) => {
    switch (role) {
      case PlatformRole.SUPER_ADMIN: return <BiShield className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
      case PlatformRole.ADMIN: return <BiShield className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      case PlatformRole.OWNER: return <BiUser className="w-5 h-5 text-green-500 dark:text-green-400" />;
      default: return <BiUser className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // ===================== Render =====================
  return (
    <>
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-5xl! max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle className="text-2xl font-bold">
              {isEditMode ? "Edit Member" : "Add New Member"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update member details" : "Create a new team member"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full px-6">
            <ScrollArea className="flex-1">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 pb-10! mb-4 bg-muted">
                  <TabsTrigger value="basic" className="flex items-center py-2! px-4! gap-2">
                    <BiUser className="w-4 h-6" /> Basic Info
                  </TabsTrigger>
                  <TabsTrigger value="role" className="flex items-center py-2! px-4! gap-2">
                    <BiShield className="w-4 h-6" /> Role &amp; Password
                  </TabsTrigger>
                  <TabsTrigger value="subscription" className="flex items-center py-2! px-4! gap-2">
                    <BiWallet className="w-4 h-6" /> Subscription
                  </TabsTrigger>
                  <TabsTrigger value="address" className="flex items-center py-2! px-4! gap-2">
                    <BiMap className="w-4 h-6" /> Address
                  </TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">First Name *</label>
                        <Controller
                          name="firstName"
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="John" className="mt-1" />}
                        />
                        <FieldErrorDisplay error={errors.firstName} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Last Name *</label>
                        <Controller
                          name="lastName"
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="Doe" className="mt-1" />}
                        />
                        <FieldErrorDisplay error={errors.lastName} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Username *</label>
                        <Controller
                          name="username"
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="john_doe" className="mt-1" />}
                        />
                        <FieldErrorDisplay error={errors.username} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Email *</label>
                        <Controller
                          name="email"
                          control={control}
                          render={({ field }) => <Input type="email" {...field} placeholder="john@example.com" className="mt-1" />}
                        />
                        <FieldErrorDisplay error={errors.email} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Phone</label>
                        <Controller
                          name="phone"
                          control={control}
                          render={({ field }) => <Input {...field} placeholder="+1 (555) 123-4567" className="mt-1" />}
                        />
                      </div>
                    </div>

                    {/* Avatar */}
                    <div className="bg-muted/50 p-5 rounded-lg border border-border">
                      <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                        <BiImage className="mr-2" /> Profile Photo
                      </h3>
                      <div className="flex flex-col items-center">
                        <div className="relative group mb-4">
                          <div onClick={() => setShowGalleryOpen(true)} className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-lg bg-gradient-to-br from-primary to-primary/70">
                            {selectedImage ? (
                              <Image src={selectedImage} alt="Profile" width={128} height={128} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                                {watch.firstName?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                            )}
                          </div>
                          {selectedImage && (
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-destructive/90"
                            >
                              <BiX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Max 2MB • JPG, PNG, GIF</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Role & Password Tab */}
                <TabsContent value="role" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">Role *</label>
                        <Controller
                          name="role"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(PlatformRole).map((role) => (
                                  <SelectItem key={role} value={role}>
                                    <div className="flex items-center gap-2">
                                      {renderRoleIcon(role)}
                                      {role}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <FieldErrorDisplay error={errors.role} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Status *</label>
                        <Controller
                          name="status"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={MemberStatus.ACTIVE}>Active – Can access system</SelectItem>
                                <SelectItem value={MemberStatus.INACTIVE}>Inactive – Limited access</SelectItem>
                                <SelectItem value={MemberStatus.SUSPENDED}>Suspended – No access</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <FieldErrorDisplay error={errors.status} />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                        <span className="font-medium text-foreground">Verified Account</span>
                        <Controller
                          name="isVerified"
                          control={control}
                          render={({ field }) => (
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-4 bg-muted/50 p-5 rounded-lg border border-border">
                      <h3 className="text-lg font-semibold flex items-center text-foreground">
                        <BiLock className="mr-2" /> Password
                      </h3>
                      <div>
                        <label className="text-sm font-medium text-foreground">Password {!isEditMode && "*"}</label>
                        <Controller
                          name="password"
                          control={control}
                          render={({ field }) => (
                            <Input type="password" {...field} placeholder={isEditMode ? "New password" : "Enter password"} className="mt-1" />
                          )}
                        />
                        <FieldErrorDisplay error={errors.password} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Confirm Password</label>
                        <Controller
                          name="confirmPassword"
                          control={control}
                          render={({ field }) => (
                            <Input type="password" {...field} placeholder="Confirm password" className="mt-1" />
                          )}
                        />
                        <FieldErrorDisplay error={errors.confirmPassword} />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Subscription Tab */}
                <TabsContent value="subscription" className="space-y-6">
                  <div className="bg-muted/50 p-5 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                      <BiWallet className="mr-2" /> Subscription
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Plan *</label>
                          <Controller
                            name="subscription.plan"
                            control={control}
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(SubscriptionPlan).map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          <FieldErrorDisplay error={getNestedError(errors, "subscription.plan")} />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Start Date *</label>
                          <Controller
                            name="subscription.startDate"
                            control={control}
                            render={({ field }) => <Input type="date" {...field} className="mt-1" />}
                          />
                          <FieldErrorDisplay error={getNestedError(errors, "subscription.startDate")} />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">End Date (optional)</label>
                          <Controller
                            name="subscription.endDate"
                            control={control}
                            render={({ field }) => <Input type="date" {...field} className="mt-1" />}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Payment Method</label>
                          <Controller
                            name="subscription.paymentMethod"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="Credit Card, PayPal" className="mt-1" />}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                          <span className="font-medium text-foreground">Active Subscription</span>
                          <Controller
                            name="subscription.isActive"
                            control={control}
                            render={({ field }) => (
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Address Tab */}
                <TabsContent value="address" className="space-y-6">
                  <div className="bg-muted/50 p-5 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                      <BiMap className="mr-2" /> Address
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Street</label>
                          <Controller
                            name="address.street"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="123 Main St" className="mt-1" />}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">City</label>
                          <Controller
                            name="address.city"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="New York" className="mt-1" />}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">State</label>
                          <Controller
                            name="address.state"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="NY" className="mt-1" />}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">ZIP</label>
                          <Controller
                            name="address.zip"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="10001" className="mt-1" />}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Country</label>
                          <Controller
                            name="address.country"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="United States" className="mt-1" />}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>

            <DialogFooter className="mt-4 border-t border-border ">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isEditMode ? "Update Member" : "Create Member"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {showGalleryOpen && (
        <AppGalleryModel
          onCancel={galleryCloseHandler}
          onSentSelected={handleSelectedImage}
          mode={"single"}
        />
      )}
    </>
  );
};

export default AddMember;