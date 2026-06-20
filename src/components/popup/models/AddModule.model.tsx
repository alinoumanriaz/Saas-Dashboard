"use client";
import { ChangeEvent, useState } from "react";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@apollo/client/react";
import { generateSlug } from "@/helpers/slug-maker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Separator } from "@/components/ui/separator";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  CREATE_CUSTOM_MODULE,
  GET_ALL_CUSTOM_MODULES,
  UPDATE_CUSTOM_MODULE,
} from "../../../graphql/query/module.query";
import {
  Loader2,
  Shield,
  Lock,
  Star,
  Crown,
  Settings,
} from "lucide-react";
import { getLucideIcon } from "@/helpers/LucidIconFinder";
import { BiUser } from "react-icons/bi";

// Enums
enum ModuleStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

interface IType {
  onCancel: () => void;
  selectedData?: any;
  isEditMode?: boolean;
  refetch?: () => void;
  currentMemberId?: string;
  materialId?: string;
  isSuperAdmin?: boolean;
}

const AddModules = ({
  onCancel,
  selectedData,
  isEditMode,
  refetch,
  currentMemberId,
}: IType) => {
  type FormState = {
    moduleName: string;
    route: string;
    description: string;
    moduleIcon: string;
    moduleType: string;
    status: ModuleStatus;
    parentModule: string;
    order: number;
    isDefaultForOwner: boolean;
    isDefaultForAdmin: boolean;
    isDefaultForSuperAdmin: boolean;
    createdBy: string;
  };

  const [form, setForm] = useState<FormState>({
    moduleName: selectedData?.moduleName || "",
    route: selectedData?.route || "",
    description: selectedData?.description || "",
    moduleIcon: selectedData?.moduleIcon || "Settings",
    moduleType: selectedData?.moduleType || "",
    status: selectedData?.status || ModuleStatus.ACTIVE,
    parentModule: selectedData?.parentModule || "",
    order: selectedData?.order || 0,
    isDefaultForOwner: selectedData?.isDefaultForOwner || false,
    isDefaultForAdmin: selectedData?.isDefaultForAdmin || false,
    isDefaultForSuperAdmin: selectedData?.isDefaultForSuperAdmin || false,
    createdBy: selectedData?.createdBy || currentMemberId || "",
  });

  const [activeTab, setActiveTab] = useState<"basic" | "permissions" | "advanced">("basic");
  const [showRouteHelper, setShowRouteHelper] = useState(false);

  const [updateCustomModule, { loading: updateLoading }] = useMutation<any>(UPDATE_CUSTOM_MODULE);
  const [createCustomModule, { loading: createLoading }] = useMutation<any>(CREATE_CUSTOM_MODULE);
  const { data } = useQuery<any>(GET_ALL_CUSTOM_MODULES, {
  fetchPolicy: "network-only",
  nextFetchPolicy: "cache-first",
});
  const modules = data?.getAllCustomModules || [];
  const handleOnChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Auto-generate route from module name
    if (name === "moduleName") {
      const generatedRoute = `/modules/${generateSlug(value)}`;
      setForm((prev) => ({ ...prev, Route: generatedRoute }));
    }
  };

  const handleSubmit = async () => {
    if (!form.moduleName) {
      toast.error("Module name is required");
      return;
    }

    if (!form.route) {
      toast.error("Route is required");
      return;
    }

    const inputData = {
      moduleName: form.moduleName,
      route: form.route,
      description: form.description,
      moduleIcon: form.moduleIcon,
      moduleType: form.moduleType,
      status: form.status,
      parentModule: form.parentModule || undefined,
      order: form.order,
      isDefaultForOwner: form.isDefaultForOwner,
      isDefaultForAdmin: form.isDefaultForAdmin,
      isDefaultForSuperAdmin: form.isDefaultForSuperAdmin,
    };

    console.log({ inputData: inputData })

    try {
      if (isEditMode && selectedData?.id) {
        const result = await updateCustomModule({
          variables: {
            id: selectedData?.id,
            input: inputData,
          },
        });
        console.log({ result: result })
        if (result.data?.updateCustomModule?.success) {
          toast.success(result.data.updateCustomModule.message || "Module updated successfully");
          refetch?.();
          onCancel();
        } else {
          toast.error(result.data?.updateCustomModule?.message || "Failed to update module");
        }
      } else {
        const result = await createCustomModule({
          variables: { input: inputData },
        });
        console.log({ moduleCreateResponse: result })
        if (result.data?.createCustomModule?.success) {
          toast.success(result.data.createCustomModule.message || "Module created successfully");
          refetch?.();
          onCancel();
        } else {
          toast.error(result.data?.createCustomModule?.message || "Failed to create module");
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Operation failed");
    }
  };

  const loading = updateLoading || createLoading;

  const availableIcons = [
    "Airplay", "Settings", "Shield", "Users", "Lock", "Star", "Crown", "FileText",
    "BarChart", "Calendar", "Bell", "Box", "BookOpen", "CreditCard",
    "Building", "Activity", "Server", "Key", "HelpCircle", "TrendingUp", "GalleryVerticalEndIcon",
  ];

  // Route suggestions
  const routeSuggestions = [
    `/modules/${generateSlug(form.moduleName)}`,
    `/admin/${generateSlug(form.moduleName)}`,
    `/settings/${generateSlug(form.moduleName)}`,
    `/dashboard/${generateSlug(form.moduleName)}`,
  ];

  return (
    <>
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-5xl! max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {isEditMode ? "Edit Module" : "Create New Module"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <Tabs defaultValue="basic" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">

            <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="mt-0 space-y-6 overflow-hidden px-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="moduleName">Module Name *</Label>
                    <Input
                      id="moduleName"
                      name="moduleName"
                      value={form.moduleName}
                      onChange={handleOnChange}
                      placeholder="Enter module name (e.g., User Management)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="moduleName">Module Type *</Label>
                    <Input
                      id="moduleType"
                      name="moduleType"
                      value={form.moduleType}
                      onChange={handleOnChange}
                      placeholder="Enter module Type"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="moduleIcon">Module Icon</Label>
                    <Select
                      value={form.moduleIcon}
                      onValueChange={(value) => setForm(prev => ({ ...prev, moduleIcon: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIcons.map(icon => {
                          const Icon = getLucideIcon(icon);
                          return (
                            <SelectItem key={icon} value={icon}>
                              <div className="flex items-center gap-2">
                                <div className="flex size-9 items-center justify-center">
                                  <Icon className="size-4 text-muted-foreground" />
                                </div>
                                <span className="text-sm">{icon}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>

                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="route">Route URL *</Label>
                    <div className="relative">
                      <Input
                        id="route"
                        name="route"
                        value={form.route}
                        onChange={handleOnChange}
                        placeholder="/modules/your-module-route"
                        onFocus={() => setShowRouteHelper(true)}
                        onBlur={() => setTimeout(() => setShowRouteHelper(false), 200)}
                      />
                      {showRouteHelper && form.moduleName && (
                        <Card className="absolute top-full left-0 right-0 mt-1 z-10 shadow-lg">
                          <CardContent className="p-2">
                            <p className="text-xs font-medium mb-1">Suggestions:</p>
                            {routeSuggestions.map(suggestion => (
                              <button
                                key={suggestion}
                                className="w-full text-left text-xs p-1 hover:bg-muted rounded"
                                onClick={() => setForm(prev => ({ ...prev, route: suggestion }))}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Unique URL path for this module. Auto-generated from module name.
                    </p>
                  </div>
                  <div className="space-x-4 flex items-center">
                    <Label htmlFor="Status">Active</Label>
                    <Switch
                      checked={form.status === ModuleStatus.ACTIVE}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, status: checked ? ModuleStatus.ACTIVE : ModuleStatus.INACTIVE }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleOnChange}
                    placeholder="Describe what this module does and its purpose"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentModule">Parent Module</Label>

                    <Select
                      value={form.parentModule}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          parentModule: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Parent Module" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="none">
                          No Parent Module
                        </SelectItem>

                        {modules
                          .filter((m: any) => m.id !== selectedData?.id)
                          .map((module: any) => (
                            <SelectItem key={module.id} value={module.id}>
                              {module.moduleName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    <p className="text-xs text-muted-foreground">
                      Select a module to make this a sub-module.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      name="order"
                      type="number"
                      value={form.order}
                      onChange={handleOnChange}
                      placeholder="Order in menu"
                    />
                  </div>
                </div>


              </TabsContent>

              {/* Advanced Settings Tab */}
              {/* <TabsContent value="advanced" className="mt-0 space-y-6 px-1">
                <div className="space-y-4">
                  <Label className="text-base">Default Module Settings</Label>
                  <p className="text-xs text-muted-foreground -mt-2">
                    These settings determine which roles get this module by default
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-yellow-600" />
                            <Label>Default for Owner</Label>
                          </div>
                          <Switch
                            checked={form.isDefaultForOwner}
                            onCheckedChange={(checked) =>
                              setForm((prev) => ({ ...prev, isDefaultForOwner: checked }))
                            }
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Auto-assign to all new Owner accounts
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-600" />
                            <Label>Default for Admin</Label>
                          </div>
                          <Switch
                            checked={form.isDefaultForAdmin}
                            onCheckedChange={(checked) =>
                              setForm((prev) => ({ ...prev, isDefaultForAdmin: checked }))
                            }
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Auto-assign to all new Admin accounts
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-purple-600" />
                            <Label>Default for Super Admin</Label>
                          </div>
                          <Switch
                            checked={form.isDefaultForSuperAdmin}
                            onCheckedChange={(checked) =>
                              setForm((prev) => ({ ...prev, isDefaultForSuperAdmin: checked }))
                            }
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
                      Modules marked as default will be automatically assigned to new users of that role.
                      Use this feature carefully as it affects user permissions at creation time.
                    </p>
                  </AlertDescription>
                </Alert>
              </TabsContent> */}
            </ScrollArea>
          </Tabs>

          {/* Action Buttons */}
          <Separator />
          <div className="flex justify-end gap-3 px-6 py-4">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update Module" : "Create Module"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddModules;