"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useForm, Controller, useWatch, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateSlug } from "@/helpers/slug-maker";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CREATE_CUSTOM_MODULE,
  GET_ALL_CUSTOM_MODULES,
  UPDATE_CUSTOM_MODULE,
} from "../../../graphql/query/module.query";
import { LoaderCircle, Settings, Shield, Crown, Star, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { DynamicIcon } from "@/helpers/LucidIconFinder";

// ===================== Enums =====================
enum ModuleStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

// ===================== Types =====================
interface AddModulesProps {
  onCancel: () => void;
  selectedData?: any;
  isEditMode?: boolean;
  refetch?: () => void;
  currentMemberId?: string;
  materialId?: string;
  isSuperAdmin?: boolean;
}

// ===================== Tag Input Component =====================
interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

const TagInput = ({ value, onChange, placeholder = "Type and press Enter" }: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed]);
        setInputValue("");
      }
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="flex flex-wrap gap-2 border rounded-md p-2 focus-within:ring-2 focus-within:ring-ring">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) {
            const trimmed = inputValue.trim();
            if (!value.includes(trimmed)) {
              onChange([...value, trimmed]);
            }
            setInputValue("");
          }
        }}
        className="flex-1 min-w-30 border-0 p-0 shadow-none focus-visible:ring-0"
        placeholder={value.length === 0 ? placeholder : ""}
      />
    </div>
  );
};

// ===================== Zod Schema =====================
const moduleSchema = z.object({
  moduleName: z.string().min(1, "Module name is required"),
  route: z.string().min(1, "Route is required"),
  description: z.string().optional(),
  moduleIcon: z.string().optional(),
  moduleType: z.array(z.string()).min(1, "At least one module type is required"),
  status: z.nativeEnum(ModuleStatus).default(ModuleStatus.ACTIVE),
  parentModule: z.string().optional(), // "none" or a real ID
  order: z.coerce.number().min(0, "Order must be a positive number").default(0),
  isDefaultForOwner: z.boolean().default(false),
  isDefaultForAdmin: z.boolean().default(false),
  isDefaultForSuperAdmin: z.boolean().default(false),
});

type ModuleFormValues = z.infer<typeof moduleSchema>;

// ===================== Error Display =====================
const FieldErrorDisplay = ({ error }: { error?: any }) => {
  if (!error) return null;
  return <p className="text-sm text-destructive mt-1">{error.message}</p>;
};

// ===================== Main Component =====================
const AddModules = ({
  onCancel,
  selectedData,
  isEditMode,
  refetch,
  // currentMemberId,
}: AddModulesProps) => {
  const [activeTab, setActiveTab] = useState<"basic" | "advanced">("basic");
  const [showRouteHelper, setShowRouteHelper] = useState(false);

  console.log({ selectedMMMMMMModule: selectedData });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema) as Resolver<ModuleFormValues>,
    defaultValues: {
      moduleName: "",
      route: "",
      description: "",
      moduleIcon: "Settings",
      moduleType: [],
      status: ModuleStatus.ACTIVE,
      parentModule: "none",
      order: 0,
      isDefaultForOwner: false,
      isDefaultForAdmin: false,
      isDefaultForSuperAdmin: false,
    },
  });

  const moduleName = useWatch({ control, name: "moduleName" });
  const routeValue = useWatch({ control, name: "route" });

  // Auto-generate route from module name
  useEffect(() => {
    if (moduleName && !routeValue) {
      const generated = `/modules/${generateSlug(moduleName)}`;
      setValue("route", generated);
    }
  }, [moduleName, routeValue, setValue]);

  // Populate edit data
  useEffect(() => {
    if (isEditMode && selectedData) {
      // Ensure moduleType is an array
      let moduleTypeArray: string[] = [];
      if (selectedData.moduleType) {
        if (Array.isArray(selectedData.moduleType)) {
          moduleTypeArray = selectedData.moduleType;
        } else if (typeof selectedData.moduleType === "string") {
          moduleTypeArray = [selectedData.moduleType];
        }
      }

      reset({
        moduleName: selectedData.moduleName || "",
        route: selectedData.route || "",
        description: selectedData.description || "",
        moduleIcon: selectedData.moduleIcon || "Settings",
        moduleType: moduleTypeArray,
        status: selectedData.status || ModuleStatus.ACTIVE,
        parentModule: selectedData?.parentModule?.id || "none",
        order: selectedData.order || 0,
        isDefaultForOwner: selectedData.isDefaultForOwner || false,
        isDefaultForAdmin: selectedData.isDefaultForAdmin || false,
        isDefaultForSuperAdmin: selectedData.isDefaultForSuperAdmin || false,
      });
    }
  }, [isEditMode, selectedData, reset]);

  // GraphQL queries & mutations
  const { data } = useQuery<any>(GET_ALL_CUSTOM_MODULES, {
    fetchPolicy: "network-only",
  });
  const modules = data?.getAllCustomModules || [];

  const [updateCustomModule, { loading: updateLoading }] =
    useMutation<any>(UPDATE_CUSTOM_MODULE);
  const [createCustomModule, { loading: createLoading }] =
    useMutation<any>(CREATE_CUSTOM_MODULE);

  const loading = updateLoading || createLoading;

  const onSubmit = async (data: ModuleFormValues) => {
    // Convert "none" to undefined for the API
    const parentModuleId = data.parentModule === "none" ? undefined : data.parentModule;

    const inputData = {
      moduleName: data.moduleName,
      route: data.route,
      description: data.description,
      moduleIcon: data.moduleIcon,
      moduleType: data.moduleType, // now an array
      status: data.status,
      parentModule: parentModuleId,
      order: data.order,
      isDefaultForOwner: data.isDefaultForOwner,
      isDefaultForAdmin: data.isDefaultForAdmin,
      isDefaultForSuperAdmin: data.isDefaultForSuperAdmin,
    };

    try {
      if (isEditMode && selectedData?.id) {
        const result = await updateCustomModule({
          variables: {
            id: selectedData.id,
            input: inputData,
          },
        });
        if (result.data?.updateCustomModule?.success) {
          toast.success(
            result.data.updateCustomModule.message || "Module updated successfully",
            { position: "top-center" }
          );
          refetch?.();
          onCancel();
        } else {
          console.log(result)
          toast.error(
            result.data?.updateCustomModule?.message || "Failed to update module",
            { position: "top-center" }
          );
        }
      } else {
        const result = await createCustomModule({
          variables: { input: inputData },
        });
        if (result.data?.createCustomModule?.success) {
          toast.success(
            result.data.createCustomModule.message || "Module created successfully",
            { position: "top-center" }
          );
          refetch?.();
          onCancel();
        } else {
          toast.error(
            result.data?.createCustomModule?.message || "Failed to create module",
            { position: "top-center" }
          );
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Operation failed", { position: "top-center" });
    }
  };

  // Route suggestions
  const routeSuggestions = [
    `/modules/${generateSlug(moduleName)}`,
    `/admin/${generateSlug(moduleName)}`,
    `/settings/${generateSlug(moduleName)}`,
    `/dashboard/${generateSlug(moduleName)}`,
  ];

  const availableIcons = [
    "Airplay",
    "Settings",
    "Shield",
    "Users",
    "Lock",
    "Star",
    "Crown",
    "FileText",
    "BarChart",
    "Calendar",
    "Bell",
    "Box",
    "BookOpen",
    "CreditCard",
    "Building",
    "Activity",
    "Server",
    "Key",
    "HelpCircle",
    "TrendingUp",
    "GalleryVerticalEndIcon",
  ];

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-5xl! max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {isEditMode ? "Edit Module" : "Add New Module"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update module details" : "Create a new custom module"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "basic" | "advanced")}
            className="flex-1 flex flex-col overflow-hidden px-6 pt-2"
          >
            <TabsList className="grid grid-cols-2 pb-10! bg-muted">
              <TabsTrigger value="basic" className="flex items-center py-2! px-4! gap-2">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center py-2! px-4! gap-2">
                Advanced Settings
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 py-4 overflow-y-auto">
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="moduleName">Module Name *</Label>
                    <Controller
                      name="moduleName"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="moduleName"
                          placeholder="e.g., User Management"
                        />
                      )}
                    />
                    <FieldErrorDisplay error={errors.moduleName} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="moduleType">Module Types *</Label>
                    <Controller
                      name="moduleType"
                      control={control}
                      render={({ field }) => (
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add a type (e.g., Core, Feature)"
                        />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Press Enter or Tab to add a type. Click × to remove.
                    </p>
                    <FieldErrorDisplay error={errors.moduleType} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="moduleIcon">Module Icon</Label>
                    <Controller
                      name="moduleIcon"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="moduleIcon">
                            <SelectValue placeholder="Select an icon" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableIcons.map((icon) => {
                              return (
                                <SelectItem key={icon} value={icon}>
                                  <div className="flex items-center gap-2">
                                    <div className="flex size-9 items-center justify-center">
                                      <DynamicIcon name={icon} className="size-4 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm">{icon}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="route">Route URL *</Label>
                    <div className="relative">
                      <Controller
                        name="route"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="route"
                            placeholder="/modules/your-module-route"
                            onFocus={() => setShowRouteHelper(true)}
                            onBlur={() => setTimeout(() => setShowRouteHelper(false), 200)}
                          />
                        )}
                      />
                      {showRouteHelper && moduleName && (
                        <Card className="absolute top-full left-0 right-0 mt-1 z-10 shadow-lg">
                          <CardContent className="p-2">
                            <p className="text-xs font-medium mb-1">Suggestions:</p>
                            {routeSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                className="w-full text-left text-xs p-1 hover:bg-muted rounded"
                                onClick={() => setValue("route", suggestion)}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Unique URL path for this module. Auto-generated from the module name.
                    </p>
                    <FieldErrorDisplay error={errors.route} />
                  </div>

                  <div className="space-y-2 flex items-center">
                    <div className="flex items-center space-x-4">
                      <Label htmlFor="status">Active</Label>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            id="status"
                            checked={field.value === ModuleStatus.ACTIVE}
                            onCheckedChange={(checked) =>
                              field.onChange(checked ? ModuleStatus.ACTIVE : ModuleStatus.INACTIVE)
                            }
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="description"
                        placeholder="Describe what this module does and its purpose"
                        rows={3}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentModule">Parent Module</Label>
                    <Controller
                      name="parentModule"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="parentModule">
                            <SelectValue placeholder="Select Parent Module" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Parent Module</SelectItem>
                            {modules
                              .filter((m: any) => m.id !== selectedData?.id)
                              .map((module: any) => (
                                <SelectItem key={module.id} value={module.id}>
                                  {module.moduleName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Select a module to make this a sub-module.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order">Display Order</Label>
                    <Controller
                      name="order"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="order"
                          type="number"
                          placeholder="Order in menu"
                        />
                      )}
                    />
                    <FieldErrorDisplay error={errors.order} />
                  </div>
                </div>
              </TabsContent>

              {/* Advanced Settings Tab */}
              <TabsContent value="advanced" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <Label className="text-base">Default Module Settings</Label>
                  <p className="text-xs text-muted-foreground -mt-2">
                    These settings determine which roles get this module by default
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-yellow-600" />
                            <Label>Default for Owner</Label>
                          </div>
                          <Controller
                            name="isDefaultForOwner"
                            control={control}
                            render={({ field }) => (
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            )}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Auto-assign to all new Owner accounts
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-600" />
                            <Label>Default for Admin</Label>
                          </div>
                          <Controller
                            name="isDefaultForAdmin"
                            control={control}
                            render={({ field }) => (
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            )}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Auto-assign to all new Admin accounts
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-purple-600" />
                            <Label>Default for Super Admin</Label>
                          </div>
                          <Controller
                            name="isDefaultForSuperAdmin"
                            control={control}
                            render={({ field }) => (
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            )}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Auto-assign to all new Super Admin accounts
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertTitle>Security Note</AlertTitle>
                  <AlertDescription>
                    <p className="text-xs">
                      Modules marked as default will be automatically assigned to new users of that
                      role. Use this feature carefully as it affects user permissions at creation
                      time.
                    </p>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="px-6 py-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>{isEditMode ? "Update Module" : "Create Module"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddModules;