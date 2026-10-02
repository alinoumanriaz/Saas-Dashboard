/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Boxes, Building2, Globe, LayoutGrid, AppWindow, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/helpers/getInitials";

type GroupedModules = Record<string, any[]>;

// icon lookup for known group keys, fallback to a generic icon
const GROUP_ICONS: Record<string, LucideIcon> = {
  website: Globe,
  modules: LayoutGrid,
  company: Building2,
  app: AppWindow,
};

function getGroupIcon(key: string): LucideIcon {
  return GROUP_ICONS[key] ?? Boxes;
}

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
    items.sort((a, b) => (a.moduleId.order ?? 0) - (b.moduleId.order ?? 0));
    items.forEach((item) => sortTree(item.children));
  };

  sortTree(tree);
  return tree;
}

function getActiveModulesGroupedByType(modules: any[]): GroupedModules {
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
      if (!grouped[type]) grouped[type] = [];

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
      (a, b) => (a.moduleId.order ?? 0) - (b.moduleId.order ?? 0)
    );
  });

  Object.keys(grouped).forEach((type) => {
    grouped[type] = buildMenuTree(grouped[type]);
  });

  return grouped;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const dispatch = useAppDispatch();
  const currentMember = useAppSelector((state) => state.currentMember.member);
  const { companyMember: selectedCompanyMember } = useAppSelector(
    (state) => state.currentCompanyMember
  );

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
    () => data?.getCompaniesOfCurrentMemberById?.companyMembers ?? [],
    [data]
  );

  React.useEffect(() => {
    if (!companyMembers.length) return;

    const currentCompanyId = selectedCompanyMember?.companyId?.id;
    let freshMember: any | undefined;

    if (currentCompanyId) {
      freshMember = companyMembers.find(
        (m) => m.companyId?.id === currentCompanyId
      );
    }

    if (!freshMember) {
      freshMember = companyMembers[0];
    }

    if (freshMember && freshMember.id !== selectedCompanyMember?.id) {
      dispatch(setCompanyMember(freshMember));
    }
  }, [companyMembers, selectedCompanyMember, dispatch]);

  const groupedModules = React.useMemo(
    () => getActiveModulesGroupedByType(selectedCompanyMember?.modules ?? []),
    [selectedCompanyMember?.modules]
  );

  const appGroupedModules = React.useMemo(
    () => getActiveModulesGroupedByType(currentMember?.modules ?? []),
    [currentMember?.modules]
  );

  const allGroupedModules = React.useMemo(() => {
    const base = { ...groupedModules };

    if (currentMember?.role === "SUPER_ADMIN") {
      Object.entries(appGroupedModules).forEach(([key, modules]) => {
        if (base[key]) {
          const combined = [...base[key], ...modules];
          const seen = new Set<string>();
          const unique = combined.filter((item) => {
            const id = item.moduleId.id;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          });
          base[key] = unique;
        } else {
          base[key] = modules;
        }
      });
    }

    return base;
  }, [groupedModules, appGroupedModules, currentMember?.role]);

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

  // ---- NEW: which group icon is currently selected ----
  const [activeGroup, setActiveGroup] = React.useState<string | null>(null);

  // default to the first available group once data loads
  React.useEffect(() => {
    if (!activeGroup && orderedGroups.length) {
      setActiveGroup(orderedGroups[0][0]);
    }
  }, [orderedGroups, activeGroup]);

  const activeGroupModules = React.useMemo(() => {
    const found = orderedGroups.find(([key]) => key === activeGroup);
    return found ? found[1] : [];
  }, [orderedGroups, activeGroup]);

  if (queryError) {
    console.error("AppSidebar query error:", queryError);
    return (
      <Sidebar {...props}>
        <SidebarHeader className="p-4 text-destructive">
          <p>Error loading companies.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm underline mt-1 cursor-pointer"
          >
            Retry
          </button>
        </SidebarHeader>
      </Sidebar>
    );
  }

  if (queryLoading || !currentMember) {
    return (
      <Sidebar {...props}>
        <SidebarHeader className="mt-2 p-4 space-y-2">
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
      {/* ---------- FIRST SIDEBAR: icon rail, one icon per group ---------- */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader className="mt-2 pb-12 flex items-center justify-center">
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
                <SidebarMenuItem key={moduleType} className=" my-1">
                  <SidebarMenuButton
                    tooltip={moduleType}
                    isActive={isActive}
                    onClick={() => setActiveGroup(moduleType)}
                    className={`flex items-center justify-center active:bg-transparent hover:bg-transparent data-active:bg-transparent hover:text-sidebar-accent-foreground`}
                  >
                    <div className={cn("flex items-center py-1 p-1 my-1 rounded-md",
                      isActive && "bg-white border border-gray-300"
                    )}>
                      <Icon className="size-12 m-1" />
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <Avatar className="h-8 w-8 rounded-lg mb-2">
            <AvatarImage src={currentMember?.avatar || "/avatars/shadcn.jpg"} alt={currentMember?.username} />
          </Avatar>
        </SidebarFooter>
      </Sidebar>

      {/* ---------- SECOND SIDEBAR: modules of the selected group ---------- */}
      <Sidebar collapsible="none" className="flex-1 flex bg-transparent">
        <SidebarHeader className=" px-2 text-sm font-medium capitalize">
          <SidebarHeader className=" flex items-center justify-center">
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