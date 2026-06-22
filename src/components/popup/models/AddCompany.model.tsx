"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { useMutation } from "@apollo/client/react";
import { CREATE_COMPANY, UPDATE_COMPANY } from "@/graphql/query/company.query";
import {
  BiBuilding,
  BiMap,
  BiImage,
  BiX,
} from "react-icons/bi";
import { FiUpload } from "react-icons/fi";
import { toast } from "react-toastify";
import Image from "next/image";
import { removeTypename } from "@/helpers/removetypename";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LoaderCircle } from "lucide-react";

// react-hook-form + zod
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Gallery Modal
import AppGalleryModel from "./AppGallery.model";

// ===================== Types =====================
interface AddCompanyProps {
  onCancel: () => void;
  selectedData: any;
  isEditMode: boolean;
  refetch: () => void;
  isSuperAdmin?: boolean;
  currentMember?: any;
}

// ===================== Zod Schema =====================
const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  logo: z.string().nullable().optional(),
  email: z.string().email("Invalid email address").nullable().optional(),
  number: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .nullable()
    .optional(),
  ownerIds: z.array(z.string()).min(1, "At least one owner is required"),
});

type CompanyFormValues = z.infer<typeof companySchema>;

// ===================== Error Display =====================
const FieldErrorDisplay = ({ error }: { error?: any }) => {
  if (!error) return null;
  return <p className="text-sm text-destructive mt-1">{error.message}</p>;
};

// ===================== Component =====================
const AddCompany: React.FC<AddCompanyProps> = ({
  onCancel,
  selectedData,
  isEditMode,
  refetch,
  isSuperAdmin = false,
  currentMember,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [newOwnerId, setNewOwnerId] = useState<string>("");
  const [showGalleryOpen, setShowGalleryOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema) as Resolver<CompanyFormValues>,
    defaultValues: {
      name: "",
      logo: null,
      email: null,
      number: null,
      isActive: true,
      address: null,
      ownerIds: currentMember?.id ? [currentMember.id] : [],
    },
  });

  const logoValue = watch("logo");
  const ownerIds = watch("ownerIds");

  // Gallery handlers
  const galleryCloseHandler = () => setShowGalleryOpen(false);
  const handleSelectedImage = (images: any[]) => {
    if (images && images.length > 0) {
      const image = images[0];
      const imageUrl = image.secure_url;
      setValue("logo", imageUrl);
      setSelectedImage(imageUrl);
    }
    setShowGalleryOpen(false);
  };

  // Populate edit data
  useEffect(() => {
    if (isEditMode && selectedData) {
      let ownerIdsArray = selectedData.ownerIds || [];
      // If ownerIds are populated objects, extract ids
      if (Array.isArray(ownerIdsArray) && ownerIdsArray.length > 0) {
        if (typeof ownerIdsArray[0] === "object" && ownerIdsArray[0] !== null) {
          ownerIdsArray = ownerIdsArray
            .map((owner: any) => owner.id || owner._id)
            .filter(Boolean);
        }
      }
      if (ownerIdsArray.length === 0 && currentMember?.id) {
        ownerIdsArray = [currentMember.id];
      }

      reset({
        name: selectedData.name || "",
        logo: selectedData.logo || null,
        email: selectedData.email || null,
        number: selectedData.number || null,
        isActive: selectedData.isActive ?? true,
        address: selectedData.address || null,
        ownerIds: ownerIdsArray,
      });
      setSelectedImage(selectedData.logo || "");
    }
  }, [isEditMode, selectedData, currentMember, reset]);

  // Update image preview when logo changes
  useEffect(() => {
    if (logoValue) {
      setSelectedImage(logoValue);
    } else {
      setSelectedImage("");
    }
  }, [logoValue]);

  // Log validation errors for debugging
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
    }
  }, [errors]);

  // Mutations
  const [createCompany] = useMutation<any>(CREATE_COMPANY);
  const [updateCompany] = useMutation<any>(UPDATE_COMPANY);

  const onSubmit = async (data: CompanyFormValues) => {
    // Extra safety check
    if (!data.name || !data.ownerIds || data.ownerIds.length === 0) {
      toast.error("Please fill in all required fields (Company Name and Owner)");
      return;
    }

    setLoading(true);

    try {
      const companyData = {
        name: data.name.trim(),
        ...(data.logo ? { logo: data.logo } : {}),
        ...(data.email?.trim() ? { email: data.email.trim() } : {}),
        ...(data.number?.trim() ? { number: data.number.trim() } : {}),
        isActive: data.isActive,
        ...(data.address && Object.values(data.address).some((v) => v)
          ? {
              address: {
                ...(data.address.street ? { street: data.address.street } : {}),
                ...(data.address.city ? { city: data.address.city } : {}),
                ...(data.address.state ? { state: data.address.state } : {}),
                ...(data.address.zip ? { zip: data.address.zip } : {}),
                ...(data.address.country ? { country: data.address.country } : {}),
              },
            }
          : {}),
        ownerIds: data.ownerIds,
      };

      const cleanInput = removeTypename(companyData);

      let response;

      if (isEditMode && selectedData) {
        // Permission check for non-super admin
        if (!isSuperAdmin) {
          const companyOwners = selectedData.ownerIds || [];
          if (!companyOwners.includes(currentMember?.id)) {
            toast.error("You can only edit companies you own");
            setLoading(false);
            return;
          }
        }

        response = await updateCompany({
          variables: {
            id: selectedData.id || selectedData._id,
            input: cleanInput,
          },
        });

        if (response.data?.updateCompany) {
          toast.success("Company updated successfully!");
          refetch();
          onCancel();
        }
      } else {
        response = await createCompany({
          variables: { input: cleanInput },
        });

        if (response.data?.createCompany) {
          toast.success("Company created successfully!");
          refetch();
          onCancel();
        }
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      const gqlMessage = error?.graphQLErrors?.[0]?.message;
      const networkError = error?.networkError?.result?.errors?.[0]?.message;
      const errorMessage = gqlMessage || networkError || error.message || "An error occurred";

      if (errorMessage.includes("duplicate") || errorMessage.includes("already exists")) {
        toast.error(
          errorMessage.includes("name")
            ? "A company with this name already exists"
            : "Duplicate entry detected"
        );
      } else if (errorMessage.includes("validation")) {
        toast.error("Please check all required fields");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Image upload
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be <2MB");
        return;
      }
      const url = URL.createObjectURL(file);
      setValue("logo", url);
      setSelectedImage(url);
    }
  };

  const removeImage = () => {
    setValue("logo", null);
    setSelectedImage("");
  };

  // Owner management
  const handleAddOwnerId = () => {
    if (!newOwnerId.trim()) {
      toast.error("Please enter a valid member ID");
      return;
    }
    if (ownerIds.includes(newOwnerId.trim())) {
      toast.error("This owner ID is already added");
      return;
    }
    setValue("ownerIds", [...ownerIds, newOwnerId.trim()]);
    setNewOwnerId("");
  };

  const handleRemoveOwnerId = (ownerIdToRemove: string) => {
    if (ownerIds.length <= 1) {
      toast.error("Company must have at least one owner");
      return;
    }
    setValue(
      "ownerIds",
      ownerIds.filter((id) => id !== ownerIdToRemove)
    );
  };

  return (
    <>
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-5xl! max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <BiBuilding className="h-5 w-5" />
              {isEditMode ? "Edit Company" : "Add New Company"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update company details" : "Create a new company"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
                <TabsList className="grid grid-cols-2 pb-10! mb-4 bg-muted">
                  <TabsTrigger
                    value="basic"
                    className="flex items-center py-2! px-4! gap-2"
                  >
                    <BiBuilding className="h-4 w-4" />
                    Company Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="address"
                    className="flex items-center py-2! px-4! gap-2"
                  >
                    <BiMap className="w-4 h-6" /> Address
                  </TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Company Name *</Label>
                        <Controller
                          name="name"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="name"
                              placeholder="Acme Corporation"
                            />
                          )}
                        />
                        <FieldErrorDisplay error={errors.name} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Company Email</Label>
                        <Controller
                          name="email"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="email"
                              type="email"
                              placeholder="info@company.com"
                              value={field.value || ""}
                            />
                          )}
                        />
                        <FieldErrorDisplay error={errors.email} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="number">Company Phone</Label>
                        <Controller
                          name="number"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="number"
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              value={field.value || ""}
                            />
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                        <div>
                          <p className="font-medium text-foreground">
                            Active Company
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Enable company access
                          </p>
                        </div>
                        <Controller
                          name="isActive"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                      </div>

                      {/* Owners Section */}
                      <div className="space-y-3">
                        <Label>Company Owners</Label>
                        <div className="flex flex-wrap gap-2">
                          {ownerIds.map((ownerId, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                            >
                              <span>{ownerId}</span>
                              {ownerIds.length > 1 && isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOwnerId(ownerId)}
                                  className="hover:text-blue-900"
                                >
                                  <BiX className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {isSuperAdmin && (
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              value={newOwnerId}
                              onChange={(e) => setNewOwnerId(e.target.value)}
                              placeholder="Enter owner ID"
                              className="flex-1"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddOwnerId();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleAddOwnerId}
                            >
                              Add
                            </Button>
                          </div>
                        )}

                        {!isSuperAdmin && ownerIds.length === 1 && (
                          <p className="text-xs text-muted-foreground">
                            You are the owner of this company
                          </p>
                        )}
                        <FieldErrorDisplay error={errors.ownerIds} />
                      </div>
                    </div>

                    {/* Right Column – Logo */}
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-5 rounded-lg border border-border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                          <BiImage className="mr-2" /> Company Logo
                        </h3>
                        <div className="flex flex-col items-center">
                          <div className="relative group mb-4">
                            <div
                              onClick={() => setShowGalleryOpen(true)}
                              className="w-32 h-32 rounded-lg overflow-hidden border-4 border-background shadow-lg bg-linear-to-br from-primary to-primary/70 flex items-center justify-center cursor-pointer"
                            >
                              {selectedImage ? (
                                <Image
                                  src={selectedImage}
                                  alt="Company Logo"
                                  width={128}
                                  height={128}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                                  {watch("name")?.charAt(0)?.toUpperCase() || "C"}
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
                          <p className="text-xs text-muted-foreground mt-2">
                            Max 2MB • JPG, PNG, GIF
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Address Tab */}
                <TabsContent value="address" className="mt-0 space-y-6">
                  <div className="bg-muted/50 p-5 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                      <BiMap className="mr-2" /> Company Address
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="address.street">Street</Label>
                          <Controller
                            name="address.street"
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                id="address.street"
                                placeholder="123 Main St"
                                value={field.value || ""}
                              />
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address.city">City</Label>
                          <Controller
                            name="address.city"
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                id="address.city"
                                placeholder="New York"
                                value={field.value || ""}
                              />
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address.state">State</Label>
                          <Controller
                            name="address.state"
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                id="address.state"
                                placeholder="NY"
                                value={field.value || ""}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="address.zip">ZIP / Postal Code</Label>
                          <Controller
                            name="address.zip"
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                id="address.zip"
                                placeholder="10001"
                                value={field.value || ""}
                              />
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address.country">Country</Label>
                          <Controller
                            name="address.country"
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                id="address.country"
                                placeholder="United States"
                                value={field.value || ""}
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <Separator />
            <DialogFooter className="px-6 py-4">
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
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isEditMode ? (
                  "Update Company"
                ) : (
                  "Create Company"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gallery Modal */}
      {showGalleryOpen && (
        <AppGalleryModel
          onCancel={galleryCloseHandler}
          onSentSelected={handleSelectedImage}
          mode="single"
        />
      )}
    </>
  );
};

export default AddCompany;