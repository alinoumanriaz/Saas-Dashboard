/* eslint-disable react-hooks/set-state-in-effect */
// src/components/popup/models/AddWebsite.model.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client/react";
import { CREATE_WEBSITE, UPDATE_WEBSITE } from "@/graphql/query/website.query";
import { WebsiteStatus, DatabaseType } from "@/enums/common.enums";
import { removeTypename } from "@/helpers/removetypename";
import { useAppSelector } from "@/redux/hooks";
import { useForm, Controller, FieldError as RHFError } from "react-hook-form";
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

// Icons
import {
  BiWorld,
  BiCheckCircle,
  BiCloud,
  BiPlus,
} from "react-icons/bi";
import { FiDatabase } from "react-icons/fi";

// ===================== Types =====================
interface AddWebsiteProps {
  onCancel: () => void;
  selectedData: any;
  isEditMode: boolean;
  refetch: () => void;
  currentMemberId?: string;
}

// ===================== Zod Schema =====================
const websiteSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  name: z.string().min(1, "Website name is required"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/,
      "Enter a valid domain (e.g., example.com)"
    ),
  status: z.nativeEnum(WebsiteStatus),
  database: z.object({
    name: z.string().min(1, "Database name is required"),
    type: z.nativeEnum(DatabaseType),
    host: z.string().min(1, "Host is required"),
    port: z.number().min(1, "Port is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  }),
  cloudinary: z
    .object({
      folderName: z.string().optional(),
      cloudinaryName: z.string().optional(),
      cloudinaryNameApiKey: z.string().optional(),
      cloudinaryNameApiKeySecret: z.string().optional(),
    })
    .optional()
    .nullable(),
});

type WebsiteFormValues = z.infer<typeof websiteSchema>;

// ===================== Error Display =====================
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
const AddWebsite: React.FC<AddWebsiteProps> = ({
  onCancel,
  selectedData,
  isEditMode,
  refetch,
}) => {
  const currentCompanyMember = useAppSelector(
    (state) => state.currentCompanyMember.companyMember
  );
  const currentCompany = currentCompanyMember?.companyId;

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [showCloudinary, setShowCloudinary] = useState(false);

  const form = useForm<WebsiteFormValues>({
    resolver: zodResolver(websiteSchema),
    defaultValues: {
      companyId: currentCompany?.id || "",
      name: "",
      domain: "",
      status: WebsiteStatus.ACTIVE,
      database: {
        name: "",
        type: DatabaseType.MONGODB,
        host: "localhost",
        port: 27017,
        username: "",
        password: "",
      },
      cloudinary: null,
    },
  });

  const {
    reset,
    setValue,
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = form;

  // Populate edit data
  useEffect(() => {
    if (isEditMode && selectedData) {
      const mapped: WebsiteFormValues = {
        companyId: selectedData.companyId || currentCompany?.id || "",
        name: selectedData.name || "",
        domain: selectedData.domain || "",
        status: selectedData.status || WebsiteStatus.ACTIVE,
        database: selectedData.database || {
          name: "",
          type: DatabaseType.MONGODB,
          host: "localhost",
          port: 27017,
          username: "",
          password: "",
        },
        cloudinary: selectedData.cloudinary || null,
      };
      reset(mapped);
      setShowCloudinary(!!selectedData.cloudinary);
    } else {
      // New: set company from currentCompany
      setValue("companyId", currentCompany?.id || "");
    }
  }, [isEditMode, selectedData, currentCompany, reset, setValue]);

  // GraphQL mutations
  const [createWebsite] = useMutation<any>(CREATE_WEBSITE);
  const [updateWebsite] = useMutation<any>(UPDATE_WEBSITE);

  const onSubmit = async (data: WebsiteFormValues) => {
    setLoading(true);
    try {
      // Build payload
      const websitePayload = {
        companyId: data.companyId,
        name: data.name.trim(),
        domain: data.domain.trim().toLowerCase(),
        status: data.status,
        database: {
          name: data.database.name.trim(),
          type: data.database.type,
          host: data.database.host.trim(),
          port: data.database.port,
          username: data.database.username.trim(),
          password: data.database.password,
        },
        ...(showCloudinary && data.cloudinary
          ? {
              cloudinary: {
                folderName: data.cloudinary.folderName?.trim() || "",
                cloudinaryName: data.cloudinary.cloudinaryName?.trim() || "",
                cloudinaryNameApiKey:
                  data.cloudinary.cloudinaryNameApiKey?.trim() || "",
                cloudinaryNameApiKeySecret:
                  data.cloudinary.cloudinaryNameApiKeySecret?.trim() || "",
              },
            }
          : {}),
      };

      // Validate cloudinary fields if enabled
      if (showCloudinary) {
        const cloud = data.cloudinary;
        if (!cloud?.folderName?.trim()) {
          setError("cloudinary.folderName", {
            type: "manual",
            message: "Folder name is required",
          });
          setLoading(false);
          return;
        }
        if (!cloud.cloudinaryName?.trim()) {
          setError("cloudinary.cloudinaryName", {
            type: "manual",
            message: "Cloudinary name is required",
          });
          setLoading(false);
          return;
        }
        if (!cloud.cloudinaryNameApiKey?.trim()) {
          setError("cloudinary.cloudinaryNameApiKey", {
            type: "manual",
            message: "API Key is required",
          });
          setLoading(false);
          return;
        }
        if (!cloud.cloudinaryNameApiKeySecret?.trim()) {
          setError("cloudinary.cloudinaryNameApiKeySecret", {
            type: "manual",
            message: "API Secret is required",
          });
          setLoading(false);
          return;
        }
      }

      const cleanInput = removeTypename(websitePayload);

      let response;
      if (isEditMode && selectedData) {
        response = await updateWebsite({
          variables: {
            id: selectedData.id || selectedData._id,
            input: cleanInput,
          },
        });
        if (response?.error) throw new Error(response.error.message);
        if (response.data?.updateWebsite) {
          toast.success("Website updated successfully!", {
            position: "top-center",
          });
          refetch();
          onCancel();
        }
      } else {
        response = await createWebsite({
          variables: { input: cleanInput },
        });
        if (response?.error) throw new Error(response.error.message);
        if (response.data?.createWebsite) {
          toast.success("Website created successfully!", {
            position: "top-center",
          });
          refetch();
          onCancel();
        }
      }
    } catch (error: any) {
      const msg = error.message || "An error occurred";
      if (/duplicate|already exists/i.test(msg)) {
        toast.error(
          msg.includes("domain")
            ? "A website with this domain already exists"
            : "Duplicate entry detected",
          { position: "top-center" }
        );
      } else {
        toast.error(msg, { position: "top-center" });
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle Cloudinary
  const toggleCloudinary = (enabled: boolean) => {
    setShowCloudinary(enabled);
    if (!enabled) {
      setValue("cloudinary", null);
    } else {
      setValue("cloudinary", {
        folderName: "",
        cloudinaryName: "",
        cloudinaryNameApiKey: "",
        cloudinaryNameApiKeySecret: "",
      });
    }
  };

  // ===================== Render =====================
  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl! max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-2xl font-bold">
            {isEditMode ? "Edit Website" : "Add New Website"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update website information"
              : "Create a new website"}
            {currentCompany && (
              <span className="block mt-1 text-xs text-blue-600">
                Company: {currentCompany.name}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <ScrollArea className="flex-1 px-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 pb-10! mb-4 bg-muted">
                <TabsTrigger
                  value="basic"
                  className="flex items-center py-2! px-4! gap-2"
                >
                  <BiWorld className="w-4 h-6" /> Basic Info
                </TabsTrigger>
                <TabsTrigger
                  value="database"
                  className="flex items-center py-2! px-4! gap-2"
                >
                  <FiDatabase className="w-4 h-6" /> Database
                </TabsTrigger>
                <TabsTrigger
                  value="cloudinary"
                  className="flex items-center py-2! px-4! gap-2"
                >
                  <BiCloud className="w-4 h-6" /> Cloudinary
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-6">
                <div className="bg-muted/50 p-5 rounded-lg border border-border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                    <BiWorld className="mr-2" /> Website Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Company (read-only) */}
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-foreground">
                        Company *
                      </label>
                      <div className="mt-1 px-3 py-2 border border-border rounded-lg bg-muted/30 text-foreground">
                        {currentCompany?.name || "No company selected"}
                      </div>
                      <Controller
                        name="companyId"
                        control={control}
                        render={({ field }) => (
                          <input type="hidden" {...field} />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Website Name *
                      </label>
                      <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="My E-commerce Store"
                          />
                        )}
                      />
                      <FieldErrorDisplay error={errors.name} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Domain *
                      </label>
                      <Controller
                        name="domain"
                        control={control}
                        render={({ field }) => (
                          <Input {...field} placeholder="example.com" />
                        )}
                      />
                      <FieldErrorDisplay error={errors.domain} />
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                        <div>
                          <p className="font-medium text-foreground">
                            Website Status
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Active or Inactive
                          </p>
                        </div>
                        <Controller
                          name="status"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value === WebsiteStatus.ACTIVE}
                              onCheckedChange={(checked) =>
                                field.onChange(
                                  checked
                                    ? WebsiteStatus.ACTIVE
                                    : WebsiteStatus.INACTIVE
                                )
                              }
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Database Tab */}
              <TabsContent value="database" className="space-y-6">
                <div className="bg-muted/50 p-5 rounded-lg border border-border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                    <FiDatabase className="mr-2" /> Database Configuration
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Database Name *
                      </label>
                      <Controller
                        name="database.name"
                        control={control}
                        render={({ field }) => (
                          <Input {...field} placeholder="myapp_database" />
                        )}
                      />
                      <FieldErrorDisplay
                        error={getNestedError(errors, "database.name")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Database Type *
                      </label>
                      <Controller
                        name="database.type"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={DatabaseType.MONGODB}>
                                MongoDB
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FieldErrorDisplay
                        error={getNestedError(errors, "database.type")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Host *
                      </label>
                      <Controller
                        name="database.host"
                        control={control}
                        render={({ field }) => (
                          <Input {...field} placeholder="localhost" />
                        )}
                      />
                      <FieldErrorDisplay
                        error={getNestedError(errors, "database.host")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Port *
                      </label>
                      <Controller
                        name="database.port"
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 27017)
                            }
                            placeholder="27017"
                          />
                        )}
                      />
                      <FieldErrorDisplay
                        error={getNestedError(errors, "database.port")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Username *
                      </label>
                      <Controller
                        name="database.username"
                        control={control}
                        render={({ field }) => (
                          <Input {...field} placeholder="db_user" />
                        )}
                      />
                      <FieldErrorDisplay
                        error={getNestedError(errors, "database.username")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Password *
                      </label>
                      <Controller
                        name="database.password"
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="password"
                            {...field}
                            placeholder="••••••••"
                          />
                        )}
                      />
                      <FieldErrorDisplay
                        error={getNestedError(errors, "database.password")}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Cloudinary Tab */}
              <TabsContent value="cloudinary" className="space-y-6">
                <div className="bg-muted/50 p-5 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center text-foreground">
                      <BiCloud className="mr-2" /> Cloudinary Configuration
                    </h3>
                    <Switch
                      checked={showCloudinary}
                      onCheckedChange={toggleCloudinary}
                    />
                  </div>

                  {showCloudinary ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Folder Name *
                        </label>
                        <Controller
                          name="cloudinary.folderName"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} placeholder="myapp-images" />
                          )}
                        />
                        <FieldErrorDisplay
                          error={getNestedError(errors, "cloudinary.folderName")}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Cloudinary Name *
                        </label>
                        <Controller
                          name="cloudinary.cloudinaryName"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} placeholder="mycloud" />
                          )}
                        />
                        <FieldErrorDisplay
                          error={getNestedError(
                            errors,
                            "cloudinary.cloudinaryName"
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          API Key *
                        </label>
                        <Controller
                          name="cloudinary.cloudinaryNameApiKey"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="123456789012345"
                            />
                          )}
                        />
                        <FieldErrorDisplay
                          error={getNestedError(
                            errors,
                            "cloudinary.cloudinaryNameApiKey"
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          API Secret *
                        </label>
                        <Controller
                          name="cloudinary.cloudinaryNameApiKeySecret"
                          control={control}
                          render={({ field }) => (
                            <Input
                              type="password"
                              {...field}
                              placeholder="••••••••"
                            />
                          )}
                        />
                        <FieldErrorDisplay
                          error={getNestedError(
                            errors,
                            "cloudinary.cloudinaryNameApiKeySecret"
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Cloudinary integration is disabled. Toggle the switch to
                      enable it.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <DialogFooter className="mt-4 border-t border-border px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
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
                  {isEditMode ? (
                    <>
                      <BiCheckCircle className="mr-2" /> Update Website
                    </>
                  ) : (
                    <>
                      <BiPlus className="mr-2" /> Create Website
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWebsite;