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
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { CompanySwitcher } from "@/components/company-switcher";
import { NavManagement } from "./nav-management";

type GroupedModules = Record<string, any[]>;

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

  console.log({compa:data})

  const companyMembers = React.useMemo(
    () => data?.getCompaniesOfCurrentMemberById?.companyMembers ?? [],
    [data]
  );

  // Sync Redux store with the latest query data
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

  // Memoized grouped modules
  const groupedModules = React.useMemo(
    () => getActiveModulesGroupedByType(selectedCompanyMember?.modules ?? []),
    [selectedCompanyMember?.modules]
  );

  const appGroupedModules = React.useMemo(
    () => getActiveModulesGroupedByType(currentMember?.modules ?? []),
    [currentMember?.modules]
  );

  // ✅ Merge company & app modules for Super Admin without losing data
  const allGroupedModules = React.useMemo(() => {
    const base = { ...groupedModules };

    if (currentMember?.role === "SUPER_ADMIN") {
      Object.entries(appGroupedModules).forEach(([key, modules]) => {
        if (base[key]) {
          // Combine existing + new modules and deduplicate by ID
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
      modules: 0,
      website: 1,
      company: 2,
      app: 3,
    };
    return Object.entries(allGroupedModules).sort(
      ([a], [b]) => (order[a] ?? 999) - (order[b] ?? 999)
    );
  }, [allGroupedModules]);

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
            className="text-sm underline mt-1 cursor-pointer"
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

  // Main render
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="mt-2">
        <CompanySwitcher companyMembers={companyMembers} />
      </SidebarHeader>

      <SidebarContent>
        {orderedGroups.map(([moduleType, modules]) => (
          <NavManagement
            key={moduleType}
            title={moduleType}
            details={modules}
          />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={currentMember} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}