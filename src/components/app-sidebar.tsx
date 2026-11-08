
/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCompanyMember } from "@/redux/slicers/currentCompanyMember";

import { useQuery } from "@apollo/client/react";
import { GET_COMPANIES_OF_CURRENT_MEMBER_BY_ID } from "@/graphql/query/company-member.query";

import { Skeleton } from "@/components/ui/skeleton";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import { NavUser } from "@/components/nav-user";
import { CompanySwitcher } from "@/components/company-switcher";
import { NavManagement } from "./nav-management";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

import {
  Boxes,
  Building2,
  Globe,
  LayoutGrid,
  AppWindow,
  LucideIcon,
} from "lucide-react";

import { getInitials } from "@/helpers/getInitials";

type GroupedModules = Record<string, any[]>;

const GROUP_ICONS: Record<string, LucideIcon> = {
  website: Globe,
  modules: LayoutGrid,
  company: Building2,
  app: AppWindow,
};

function getGroupIcon(key: string): LucideIcon {
  return GROUP_ICONS[key] ?? Boxes;
}

// Normalize routes for consistent comparison
function normalizePath(path?: string): string {
  if (!path) return "";

  const cleanPath = path.split("?")[0].split("#")[0];

  if (!cleanPath) return "/";

  return cleanPath.length > 1
    ? cleanPath.replace(/\/+$/, "")
    : cleanPath;
}

// Get route from module data.
// Supports common route property names.
function getModuleRoute(item: any): string {
  const moduleData = item?.moduleId;

  const possibleRoutes = [
    moduleData?.path,
    moduleData?.route,
    moduleData?.url,
    moduleData?.href,
    moduleData?.slug,
    item?.path,
    item?.route,
    item?.url,
    item?.href,
  ];

  return (
    possibleRoutes.find(
      (route) => typeof route === "string" && route.trim()
    ) ?? ""
  );
}

// Check whether a module or any nested child matches the URL
function isModuleActive(
  modules: any[],
  pathname: string
): boolean {
  return modules.some((item) => {
    const moduleRoute = normalizePath(getModuleRoute(item));

    if (moduleRoute) {
      const currentPath = normalizePath(pathname);

      const isFullRoute =
        moduleRoute.startsWith("/") &&
        (currentPath === moduleRoute ||
          currentPath.startsWith(`${moduleRoute}/`));

      const isSlug =
        !moduleRoute.startsWith("/") &&
        currentPath.split("/").filter(Boolean).at(-1) ===
          moduleRoute.replace(/^\/+/, "");

      if (isFullRoute || isSlug) {
        return true;
      }
    }

    return isModuleActive(item.children ?? [], pathname);
  });
}

// Build nested module tree
function buildMenuTree(modules: any[]) {
  const map = new Map<string, any>();
  const tree: any[] = [];

  modules.forEach((item) => {
    map.set(item.moduleId.id, {
      ...item,
      children: [],
    });
  });

  modules.forEach((item) => {
    const parentId = item.moduleId.parentModule?.id;
    const node = map.get(item.moduleId.id);

    if (parentId && map.has(parentId)) {
      map.get(parentId).children.push(node);
    } else {
      tree.push(node);
    }
  });

  const sortTree = (items: any[]) => {
    items.sort(
      (a, b) =>
        (a.moduleId.order ?? 0) - (b.moduleId.order ?? 0)
    );

    items.forEach((item) => sortTree(item.children));
  };

  sortTree(tree);

  return tree;
}

// Group active modules by module type
function getActiveModulesGroupedByType(
  modules: any[]
): GroupedModules {
  const grouped: GroupedModules = {};

  const activeModules = modules.filter(
    (access) =>
      access.isActive &&
      access.moduleId &&
      access.moduleId.status === "ACTIVE"
  );

  activeModules.forEach((access) => {
    const types =
      Array.isArray(access.moduleId.moduleType) &&
      access.moduleId.moduleType.length
        ? access.moduleId.moduleType
        : ["unknown"];

    types.forEach((type: string) => {
      if (!grouped[type]) {
        grouped[type] = [];
      }

      const exists = grouped[type].some(
        (item) => item.moduleId.id === access.moduleId.id
      );

      if (!exists) {
        grouped[type].push(access);
      }
    });
  });

  Object.keys(grouped).forEach((type) => {
    grouped[type].sort(
      (a, b) =>
        (a.moduleId.order ?? 0) - (b.moduleId.order ?? 0)
    );

    grouped[type] = buildMenuTree(grouped[type]);
  });

  return grouped;
}

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  const currentMember = useAppSelector(
    (state) => state.currentMember.member
  );

  const { companyMember: selectedCompanyMember } =
    useAppSelector((state) => state.currentCompanyMember);

  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery<{
    getCompaniesOfCurrentMemberById: {
      companyMembers: any[];
    };
  }>(GET_COMPANIES_OF_CURRENT_MEMBER_BY_ID, {
    variables: { id: currentMember?.id },
    skip: !currentMember,
    fetchPolicy: "network-only",
  });

  const companyMembers = React.useMemo(
    () =>
      data?.getCompaniesOfCurrentMemberById?.companyMembers ?? [],
    [data]
  );

  // Keep selected company member updated
  React.useEffect(() => {
    if (!companyMembers.length) return;

    const currentCompanyId = selectedCompanyMember?.companyId?.id;

    let freshMember: any | undefined;

    if (currentCompanyId) {
      freshMember = companyMembers.find(
        (member) => member.companyId?.id === currentCompanyId
      );
    }

    if (!freshMember) {
      freshMember = companyMembers[0];
    }

    if (freshMember && freshMember.id !== selectedCompanyMember?.id) {
      dispatch(setCompanyMember(freshMember));
    }
  }, [companyMembers, selectedCompanyMember, dispatch]);

  // Company modules
  const groupedModules = React.useMemo(
    () =>
      getActiveModulesGroupedByType(
        selectedCompanyMember?.modules ?? []
      ),
    [selectedCompanyMember?.modules]
  );

  // Application modules
  const appGroupedModules = React.useMemo(
    () =>
      getActiveModulesGroupedByType(currentMember?.modules ?? []),
    [currentMember?.modules]
  );

  // Merge application modules for SUPER_ADMIN
  const allGroupedModules = React.useMemo(() => {
    const base = { ...groupedModules };

    if (currentMember?.role === "SUPER_ADMIN") {
      Object.entries(appGroupedModules).forEach(
        ([key, modules]) => {
          if (base[key]) {
            const combined = [...base[key], ...modules];

            const seen = new Set<string>();

            base[key] = combined.filter((item) => {
              const id = item.moduleId.id;

              if (seen.has(id)) return false;

              seen.add(id);
              return true;
            });
          } else {
            base[key] = modules;
          }
        }
      );
    }

    return base;
  }, [
    groupedModules,
    appGroupedModules,
    currentMember?.role,
  ]);

  // Sort sidebar groups
  const orderedGroups = React.useMemo(() => {
    const order: Record<string, number> = {
      website: 0,
      modules: 1,
      company: 2,
      app: 3,
    };

    return Object.entries(allGroupedModules).sort(
      ([a], [b]) => (order[a] ?? 999) - (order[b] ?? 999)
    );
  }, [allGroupedModules]);

  // Active group: no default first-group selection
  const [activeGroup, setActiveGroup] = React.useState<string | null>(
    null
  );

  // Select the group containing the currently active route
  React.useEffect(() => {
    if (!orderedGroups.length || !pathname) {
      setActiveGroup(null);
      return;
    }

    const currentGroup = orderedGroups.find(([, modules]) =>
      isModuleActive(modules, pathname)
    );

    setActiveGroup(currentGroup?.[0] ?? null);
  }, [orderedGroups, pathname]);

  // Modules belonging to selected group
  const activeGroupModules = React.useMemo(() => {
    const found = orderedGroups.find(
      ([key]) => key === activeGroup
    );

    return found ? found[1] : [];
  }, [orderedGroups, activeGroup]);

  // Error state
  if (queryError) {
    console.error("AppSidebar query error:", queryError);

    return (
      <Sidebar {...props}>
        <SidebarHeader className="p-4 text-destructive">
          <p>Error loading companies.</p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-1 cursor-pointer text-sm underline"
          >
            Retry
          </button>
        </SidebarHeader>
      </Sidebar>
    );
  }

  // Loading state
  if (queryLoading || !currentMember) {
    return (
      <Sidebar {...props}>
        <SidebarHeader className="mt-2 space-y-2 p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </SidebarHeader>

        <SidebarContent className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* FIRST SIDEBAR: Group icons */}

      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader className="mt-2 flex items-center justify-center pb-12">
          <Avatar className="mt-2 h-8 w-8 rounded-lg">
            <AvatarImage
              className="rounded-lg!"
              src={selectedCompanyMember?.companyId?.logo}
              alt={selectedCompanyMember?.companyId?.name}
            />

            <AvatarFallback className="ring-1 ring-gray-300">
              {getInitials(selectedCompanyMember?.companyId?.name)}
            </AvatarFallback>
          </Avatar>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu className="flex flex-col items-center gap-2">
            {orderedGroups.map(([moduleType]) => {
              const Icon = getGroupIcon(moduleType);
              const isActive = moduleType === activeGroup;

              return (
                <SidebarMenuItem
                  key={moduleType}
                  className="my-1"
                >
                  <SidebarMenuButton
                    tooltip={moduleType}
                    isActive={isActive}
                    onClick={() => setActiveGroup(moduleType)}
                    className="size-10 rounded-xl p-0 flex items-center justify-center transition-all data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                  >
                    <Icon className="size-5" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <Avatar className="mb-2 h-8 w-8 rounded-lg">
            <AvatarImage
              src={currentMember?.avatar || "/avatars/shadcn.jpg"}
              alt={currentMember?.username}
            />
          </Avatar>
        </SidebarFooter>
      </Sidebar>

      {/* SECOND SIDEBAR: Selected group modules */}

      <Sidebar
        collapsible="none"
        className="flex-1 bg-transparent"
      >
        <SidebarHeader className="px-2 text-sm font-medium capitalize">
          <SidebarHeader className="flex items-center justify-center">
            <CompanySwitcher companyMembers={companyMembers} />
          </SidebarHeader>
        </SidebarHeader>

        <SidebarContent>
          {activeGroup && (
            <NavManagement
              key={activeGroup}
              title={activeGroup}
              details={activeGroupModules}
            />
          )}
        </SidebarContent>

        <SidebarFooter>
          <NavUser user={currentMember} />
        </SidebarFooter>
      </Sidebar>

      <SidebarRail />
    </Sidebar>
  );
}
