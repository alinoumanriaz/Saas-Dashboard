/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  useForm,
  useWatch,
  Controller,
  FieldError as RHFError,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";
import {
  BiUser,
  BiEnvelope,
  BiPhone,
  BiShield,
  BiCheck,
  BiGlobe,
  BiPlus,
  BiX,
  BiCheckCircle,
  BiBuilding,
  BiChevronDown,
} from "react-icons/bi";
import { FiDatabase, FiClock, FiCopy } from "react-icons/fi";

// GraphQL
import {
  CREATE_COMPANY_MEMBER,
  UPDATE_COMPANY_MEMBER,
} from "@/graphql/query/company-member.query";
import { GET_WEBSITES_BY_COMPANY_ID } from "@/graphql/query/website.query";
import { GET_GLOBLE_MEMBERS } from "@/graphql/query/member.query";

// Enums & Types
import {
  CompanyMemberRole,
  MemberStatus,
  Permission,
} from "@/enums/common.enums";
import {
  PERMISSION_OPTIONS,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
} from "@/modules/modules";

// shadcn/ui components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LoaderCircle } from "lucide-react";
import { DynamicIcon } from "@/helpers/LucidIconFinder";

// ===================== Types & Schemas =====================
// FIXED: moduleId is now an object (as it comes from your data)
const moduleSchema = z.object({
  moduleId: z.object({
    id: z.string(),
    moduleName: z.string(),
    moduleIcon: z.string(),
    status: z.string(),
    route: z.string(),
  }),
  isActive: z.boolean(),
  permissions: z.array(z.string()),
});

// FIXED: removed the misplaced `moduleId` field; added only needed fields
const formSchema = z.object({
  memberId: z.string().min(1, "Please select a member"),
  role: z.enum(CompanyMemberRole),
  status: z.enum(MemberStatus),
  modules: z.array(moduleSchema),
  websiteIds: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

// ===================== Error Display Helpers =====================
const FieldErrorDisplay = ({ error }: { error?: RHFError }) => {
  if (!error) return null;
  return <p className="text-sm text-destructive mt-1">{error.message}</p>;
};

// ===================== Component =====================
interface AddCompanyMemberProps {
  onCancel: () => void;
  selectedData?: any | null;
  isEditMode: boolean;
  refetch: () => void;
  currentCompanyId: string;
  currentTeamId?: string;
  currentUserRole?: CompanyMemberRole;
}

const AddCompanyMember: React.FC<AddCompanyMemberProps> = ({
  onCancel,
  selectedData,
  isEditMode,
  refetch,
  currentCompanyId,
  currentTeamId,
  currentUserRole,
}) => {

  console.log({selectedData:selectedData})
  // --- State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);

  // --- Redux ---
  const currentCompanyMember = useAppSelector(
    (state) => state.currentCompanyMember.companyMember
  );
  const currentMember = useAppSelector(
    (state) => state.currentMember.member
  );
  const currentMemberId = currentCompanyMember?.memberId?.id;

  // --- Build available modules and info map from currentMember.modules ---
  const modulesList = currentMember?.modules ?? [];

  // If no modules are available, show a message
  if (!modulesList.length) {
    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Modules Available</DialogTitle>
            <DialogDescription>
              You don&apos;t have any modules assigned. You cannot assign
              permissions to other members.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onCancel}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // --- Debounce search term ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- Queries ---
  const { data: membersData, loading: membersLoading } = useQuery<any>(
    GET_GLOBLE_MEMBERS,
    {
      variables: {
        excludeCurrentMember: currentMemberId,
        email: debouncedSearchTerm || undefined,
      },
      skip: !debouncedSearchTerm,
    }
  );

  const { data: websitesData, loading: websitesLoading } = useQuery<any>(
    GET_WEBSITES_BY_COMPANY_ID,
    {
      variables: { companyId: currentCompanyId },
      skip: !currentCompanyId,
    }
  );

  // --- Mutations ---
  const [createCompanyMember] = useMutation<any>(CREATE_COMPANY_MEMBER);
  const [updateCompanyMember] = useMutation<any>(UPDATE_COMPANY_MEMBER);

  // --- Form Setup ---
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: "",
      role: CompanyMemberRole.EMPLOYEE,
      status: MemberStatus.PENDING,
      modules: modulesList.map((mod) => ({
        ...mod, // mod.moduleId is an object → matches schema now
        isActive: false,
        permissions: [],
      })),
      websiteIds: [],
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = form;

  // ✅ Memo‑safe alternatives to watch()
  const memberId = useWatch({ control, name: "memberId" });
  const watchedModules = useWatch({ control, name: "modules" });
  const watchedWebsiteIds = useWatch({ control, name: "websiteIds" });

  // --- DEBUG: log validation state & errors ---
  useEffect(() => {
    console.log("🔍 Form is valid:", isValid);
    if (!isValid) {
      console.log("❌ Form errors:", errors);
    }
  }, [isValid, errors]);

  // --- Load edit data ---
  useEffect(() => {
    if (selectedData && isEditMode) {
      setSelectedMember(selectedData.memberId || null);

      // Merge existing modules with modulesList to preserve full list
      reset({
        memberId: selectedData.memberId?.id || selectedData.memberId || "",
        role: selectedData.role || CompanyMemberRole.EMPLOYEE,
        status: selectedData.status || MemberStatus.PENDING,
        modules: modulesList, // modulesList already has correct shape
        websiteIds:
          selectedData.websites?.map((w: any) => w.id || w._id || w) || [],
      });
    }
  }, [selectedData, isEditMode, reset, modulesList]);

  // --- Permission checks ---
  const canAssignRole = (role: CompanyMemberRole) => {
    if (currentUserRole === CompanyMemberRole.OWNER) return true;
    if (currentUserRole === CompanyMemberRole.MANAGER) {
      return [CompanyMemberRole.EMPLOYEE].includes(role);
    }
    return false;
  };

  // --- Handlers ---
  const handleMemberSelect = (member: any) => {
    setSelectedMember(member);
    setValue("memberId", member.id);
    setMemberPopoverOpen(false);
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };

  const handleModuleAccessChange = (index: number) => {
    const updated = watchedModules.map((mod, i) => {
      if (i === index) {
        return {
          ...mod,
          isActive: !mod.isActive,
          permissions: mod.isActive ? [] : mod.permissions,
        };
      }
      return mod;
    });
    setValue("modules", updated);
  };

  const handleModulePermissionChange = (
    index: number,
    permission: Permission,
    checked: boolean
  ) => {
    const updated = watchedModules.map((mod, i) => {
      if (i === index) {
        const permissions = checked
          ? [...mod.permissions, permission]
          : mod.permissions.filter((p) => p !== permission);
        return { ...mod, permissions };
      }
      return mod;
    });
    setValue("modules", updated);
  };

  const copyPermissionsToAllModules = () => {
    const activeModules = watchedModules.filter((m) => m.isActive);
    if (activeModules.length === 0) {
      toast.warning("No active modules to copy from", {
        position: "top-center",
      });
      return;
    }
    const source = activeModules[0];
    const updated = watchedModules.map((mod) => {
      if (mod.isActive) {
        return { ...mod, permissions: [...source.permissions] };
      }
      return mod;
    });
    setValue("modules", updated);
    toast.success("Permissions copied to all active modules", {
      position: "top-center",
    });
  };

  const handleWebsiteToggle = (websiteId: string) => {
    const current = watchedWebsiteIds;
    const updated = current.includes(websiteId)
      ? current.filter((id) => id !== websiteId)
      : [...current, websiteId];
    setValue("websiteIds", updated);
  };

  const handleSelectAllWebsites = () => {
    if (websitesData?.getWebsitesByCompanyId) {
      const allIds = websitesData.getWebsitesByCompanyId.map(
        (w: any) => w.id
      );
      setValue("websiteIds", allIds);
    }
  };

  const handleClearAllWebsites = () => {
    setValue("websiteIds", []);
  };

  // --- Form submission ---
  const onSubmit = async (data: FormValues) => {
    console.log("✅ Submit called with data:", data);
    try {
      const modulesToSend = data.modules.map((m) => ({
        moduleId: m.moduleId.id, // extract the string ID for the server
        isActive: m.isActive,
        permissions: m.permissions,
      }));

      const input = {
        id: selectedData.id,
        memberId: data.memberId,
        companyId: currentCompanyId,
        teamId: currentTeamId || undefined,
        role: data.role,
        status: data.status,
        modules: modulesToSend,
        websites: data.websiteIds,
      };

      console.log("🚀 Mutation input:", input);

      let response;
      if (isEditMode && selectedData?.id) {
        response = await updateCompanyMember({
          variables: { id: selectedData.id, input },
        });
      } else {
        response = await createCompanyMember({
          variables: { input },
        });
      }

      console.log("📨 Response:", response);

      if (
        response.data?.createCompanyMember ||
        response.data?.updateCompanyMember
      ) {
        toast.success(
          isEditMode
            ? "Member updated successfully"
            : "Member added successfully",
          { position: "top-center" }
        );
        refetch();
        onCancel();
      } else {
        toast.error("Operation failed", { position: "top-center" });
      }
    } catch (error: any) {
      console.error("🔥 Submission error:", error);
      toast.error(error.message || "An error occurred", {
        position: "top-center",
      });
    }
  };

  // --- Computed ---
  const availableMembers = membersData?.getGlobleMember || [];
  const websites = websitesData?.getWebsitesByCompanyId || [];

  const activeModulesCount = watchedModules.filter((m) => m.isActive).length;
  const totalPermissions = watchedModules.reduce(
    (sum, m) => sum + m.permissions.length,
    0
  );

  // ===================== Render =====================
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-6xl! max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-bold">
            {isEditMode ? "Edit Company Member" : "Add Company Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update member details and permissions"
              : "Add a new member to your company"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col h-full"
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <div className="px-6">
              <TabsList className="grid grid-cols-4 pb-10! bg-muted">
                <TabsTrigger
                  value="basic"
                  className="flex items-center py-2! px-4! gap-2"
                >
                  Basic Info
                </TabsTrigger>
                <TabsTrigger
                  value="role"
                  className="flex items-center py-2! px-4! gap-2"
                >
                  Role & Status
                </TabsTrigger>
                <TabsTrigger
                  value="modules"
                  className="flex items-center py-2! px-4! gap-2"
                >
                  Module Permissions
                </TabsTrigger>
                <TabsTrigger
                  value="websites"
                  className="flex items-center py-2! px-4! gap-2"
                >
                  Website Access
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 p-6">
              {/* ----- Basic Info Tab ----- */}
              <TabsContent value="basic" className="mt-0 p-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Member Selection - Combobox */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <BiUser className="mr-2" />
                        Select Member
                      </CardTitle>
                      <CardDescription>
                        Search and select an existing member.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Popover
                        open={memberPopoverOpen}
                        onOpenChange={setMemberPopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={memberPopoverOpen}
                            className="w-full justify-between font-normal"
                          >
                            {selectedMember ? (
                              <div className="flex items-center gap-2 truncate">
                                <span>
                                  {selectedMember.fullName ||
                                    selectedMember.username}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                  {selectedMember.email}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Search for a member...
                              </span>
                            )}
                            <BiChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[--radix-popover-trigger-width] p-0"
                          align="start"
                        >
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search by email..."
                              value={searchTerm}
                              onValueChange={setSearchTerm}
                              className="h-9"
                            />
                            <CommandList>
                              {membersLoading && debouncedSearchTerm ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  Searching...
                                </div>
                              ) : availableMembers.length > 0 ? (
                                <CommandGroup>
                                  {availableMembers.map((member: any) => (
                                    <CommandItem
                                      key={member.id}
                                      value={member.id}
                                      onSelect={() =>
                                        handleMemberSelect(member)
                                      }
                                      className="flex items-center gap-3 cursor-pointer"
                                    >
                                      <div className="shrink-0">
                                        {member.avatar ? (
                                          <Image
                                            src={member.avatar}
                                            alt={member.username}
                                            width={32}
                                            height={32}
                                            className="rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {(member.username || "U")
                                              .charAt(0)
                                              .toUpperCase()}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {member.fullName ||
                                            member.username}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {member.email}
                                        </p>
                                      </div>
                                      {memberId === member.id && (
                                        <BiCheck className="h-4 w-4 text-primary shrink-0" />
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ) : debouncedSearchTerm ? (
                                <CommandEmpty>No members found.</CommandEmpty>
                              ) : (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  Type to start searching
                                </div>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <input type="hidden" {...form.register("memberId")} />
                      <FieldErrorDisplay error={errors.memberId} />

                      {selectedMember && (
                        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <p className="text-xs text-muted-foreground">
                            Selected Member
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="shrink-0">
                              {selectedMember.avatar ? (
                                <Image
                                  src={selectedMember.avatar}
                                  alt={
                                    selectedMember.fullName ||
                                    selectedMember.username
                                  }
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                  {(
                                    selectedMember.fullName ||
                                    selectedMember.username ||
                                    "U"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {selectedMember.fullName ||
                                  selectedMember.username}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <BiEnvelope className="h-3 w-3" />
                                {selectedMember.email}
                              </p>
                              {selectedMember.phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <BiPhone className="h-3 w-3" />
                                  {selectedMember.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Company Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center">
                        <BiBuilding className="mr-2" />
                        Company Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Company ID
                        </span>
                        <span className="font-mono">
                          {currentCompanyMember?.companyId?.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Company Name
                        </span>
                        <span className="font-mono">
                          {currentCompanyMember?.companyId?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-mono">
                          {currentCompanyMember?.companyId?.isActive ??
                            "Active"}
                        </span>
                      </div>
                      {currentTeamId && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Team ID
                          </span>
                          <span className="font-mono">{currentTeamId}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ----- Role & Status Tab ----- */}
              <TabsContent value="role" className="mt-0 p-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <BiShield className="mr-2" />
                        Company Role
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Controller
                        name="role"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="w-full py-8">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.filter((opt) =>
                                canAssignRole(opt.value)
                              ).map((role) => {
                                const Icon = role.icon;
                                return (
                                  <SelectItem
                                    key={role.value}
                                    value={role.value}
                                  >
                                    <div className="flex items-center gap-3 py-2">
                                      <div
                                        className={`p-1.5 rounded-md bg-${role.color}-100`}
                                      >
                                        <Icon
                                          className={`h-4 w-4 text-${role.color}-600`}
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">
                                            {role.label}
                                          </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {role.description}
                                        </p>
                                      </div>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FieldErrorDisplay error={errors.role} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <FiClock className="mr-2" />
                        Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="w-full py-8">
                              <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((status) => {
                                const Icon = status.icon;
                                return (
                                  <SelectItem
                                    key={status.value}
                                    value={status.value}
                                  >
                                    <div className="flex items-center gap-3 py-2">
                                      <div
                                        className={`p-1.5 rounded-md bg-${status.color}-100`}
                                      >
                                        <Icon
                                          className={`h-4 w-4 text-${status.color}-600`}
                                        />
                                      </div>
                                      <div>
                                        <div className="font-medium">
                                          {status.label}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {status.description}
                                        </p>
                                      </div>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FieldErrorDisplay error={errors.status} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ----- Modules Tab ----- */}
              <TabsContent value="modules" className="mt-0  overflow-auto! h-92">
                <Card className="">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          <FiDatabase className="mr-2" />
                          Module Permissions
                        </CardTitle>
                        <CardDescription>
                          Configure which modules the member can access and
                          their permissions.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1">
                          <span className="font-medium">
                            {activeModulesCount}
                          </span>{" "}
                          / {watchedModules.length} modules
                        </Badge>
                        <Badge variant="secondary" className="px-3 py-1">
                          {totalPermissions} permissions total
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={copyPermissionsToAllModules}
                        >
                          <FiCopy className="mr-2 h-4 w-4" />
                          Copy to All
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {watchedModules.map((module: any, index) => {
                      const moduleName =
                        module?.moduleId.moduleName || "Unnamed";
                      const iconName =
                        module?.moduleId.moduleIcon || "FiDatabase";

                      return (
                        <div
                          key={module.moduleId.id}
                          className={`rounded-lg border transition-all ${
                            module.isActive
                              ? "border-primary/20 bg-primary/5"
                              : "border-border bg-card"
                          }`}
                        >
                          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Switch
                                checked={module.isActive}
                                onCheckedChange={() =>
                                  handleModuleAccessChange(index)
                                }
                                disabled={isSubmitting}
                              />
                              <div
                                className={`p-2 rounded-lg ${
                                  module.isActive
                                    ? "bg-primary/10"
                                    : "bg-muted"
                                }`}
                              >
                                <DynamicIcon
                                  name={iconName}
                                  className={`h-5 w-5 ${
                                    module.isActive
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">
                                    {moduleName}
                                  </span>
                                  {module.isActive && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {module.permissions.length} permissions
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {module.isActive && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updated = [...watchedModules];
                                    updated[index] = {
                                      ...module,
                                      permissions: [],
                                    };
                                    setValue("modules", updated);
                                  }}
                                  disabled={!module.isActive || isSubmitting}
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                          </div>

                          {module.isActive && (
                            <div className="px-4 pb-4 pt-0 border-t border-border/50">
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Permissions
                                  </span>
                                  {module.permissions.length > 0 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto p-1 text-xs text-muted-foreground hover:text-destructive"
                                      onClick={() => {
                                        const updated = [...watchedModules];
                                        updated[index] = {
                                          ...module,
                                          permissions: [],
                                        };
                                        setValue("modules", updated);
                                      }}
                                    >
                                      Clear all
                                    </Button>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {PERMISSION_OPTIONS.map((permission) => {
                                    const isChecked = module.permissions.includes(
                                      permission.value
                                    );
                                    return (
                                      <label
                                        key={permission.value}
                                        className={`flex items-center p-2 rounded-md border cursor-pointer transition-all ${
                                          isChecked
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:bg-muted/50"
                                        }`}
                                      >
                                        <Checkbox
                                          checked={isChecked}
                                          onCheckedChange={(checked) =>
                                            handleModulePermissionChange(
                                              index,
                                              permission.value,
                                              checked === true
                                            )
                                          }
                                          disabled={isSubmitting}
                                          className="mr-2"
                                        />
                                        <span className="text-sm">
                                          {permission.label}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                                {module.permissions.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-1">
                                    {module.permissions.map((perm: any) => {
                                      const permLabel =
                                        PERMISSION_OPTIONS.find(
                                          (p) => p.value === perm
                                        )?.label || perm;
                                      return (
                                        <Badge
                                          key={perm}
                                          variant="secondary"
                                          className="flex items-center gap-1"
                                        >
                                          {permLabel}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleModulePermissionChange(
                                                index,
                                                perm,
                                                false
                                              )
                                            }
                                            className="hover:text-destructive"
                                          >
                                            <BiX className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <Separator />

                    <div className="bg-muted/50 p-4 rounded-lg border">
                      <h4 className="font-medium mb-2">Access Summary</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex flex-wrap gap-4">
                          <div>
                            <span className="text-muted-foreground">
                              Enabled Modules:
                            </span>
                            <span className="font-medium ml-1">
                              {activeModulesCount} of {watchedModules.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Total Permissions:
                            </span>
                            <span className="font-medium ml-1">
                              {totalPermissions}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ----- Websites Tab ----- */}
              <TabsContent value="websites" className="mt-0">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <BiGlobe className="mr-2" />
                        Website Access
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllWebsites}
                          disabled={websites.length === 0 || isSubmitting}
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleClearAllWebsites}
                          disabled={isSubmitting}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Choose which websites this member can access.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {websitesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Loading websites...
                        </p>
                      </div>
                    ) : websites.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {websites.map((website: any) => {
                          const isSelected = watchedWebsiteIds.includes(
                            website.id
                          );
                          return (
                            <button
                              key={website.id}
                              type="button"
                              onClick={() =>
                                handleWebsiteToggle(website.id)
                              }
                              className={`p-4 border rounded-lg flex items-start space-x-3 transition-all duration-200 ${
                                isSelected
                                  ? "border-2 border-primary bg-primary/5 shadow-sm"
                                  : "border-border hover:border-primary/50 hover:bg-muted/30"
                              }`}
                            >
                              <div
                                className={`p-2 rounded-lg transition-colors ${
                                  isSelected ? "bg-primary/10" : "bg-muted"
                                }`}
                              >
                                <BiGlobe
                                  className={`h-5 w-5 transition-colors ${
                                    isSelected
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </div>
                              <div className="flex-1 text-left">
                                <p
                                  className={`font-medium ${
                                    isSelected ? "text-primary" : ""
                                  }`}
                                >
                                  {website.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {website.domain}
                                </p>
                                {website.status && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Status: {website.status}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <BiCheck className="h-5 w-5 text-primary shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BiGlobe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          No websites found
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Create a website first in the Websites section
                        </p>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-primary">
                            Selected Websites
                          </p>
                          <p className="text-xs text-primary/70">
                            {watchedWebsiteIds.length} of {websites.length}{" "}
                            websites selected
                          </p>
                        </div>
                        {watchedWebsiteIds.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setValue("websiteIds", [])}
                            className="text-xs"
                          >
                            Clear selection
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t bg-muted/20">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !isValid}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isEditMode ? (
                  <>
                    Update Member
                  </>
                ) : (
                  <>
                    <BiPlus className="mr-2" />
                    Add Member
                  </>
                )}
              </Button>
            </DialogFooter>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompanyMember;