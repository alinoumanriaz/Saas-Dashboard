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
import { NavAppManagement } from "./nav-app-management";
import { NavCompanyManagement } from "./nav-company-management";




type GroupedModules = Record<string, any[]>;

// ========== Utility Function (pure, memoizable) ==========
function getActiveModulesGroupedByType(
  modules: any[]
): GroupedModules {
  const grouped: GroupedModules = {};

  // Filter active modules
  const active = modules.filter(
    (access) => access.isActive === true && access.moduleId?.status === "ACTIVE"
  );

  // Group by moduleType
  active.forEach((access) => {
    const singleModule = access.moduleId;
    const types =
      Array.isArray(singleModule.moduleType) && singleModule.moduleType.length > 0
        ? singleModule.moduleType
        : ["unknown"];

    types.forEach((type: any) => {
      if (!grouped[type]) grouped[type] = [];
      // Avoid duplicates (unlikely but safe)
      const exists = grouped[type].some((item) => item.moduleId.id === singleModule.id);
      if (!exists) grouped[type].push(access);
    });
  });

  // Sort each group by order (ascending)
  Object.keys(grouped).forEach((type) => {
    grouped[type].sort((a, b) => {
      const orderA = a.moduleId.order ?? 0;
      const orderB = b.moduleId.order ?? 0;
      return orderA - orderB;
    });
  });

  return grouped;
}

// ========== Component ==========
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const dispatch = useAppDispatch();
  const currentMember = useAppSelector((state) => state.currentMember.member);
  const { companyMember: selectedCompanyMember } = useAppSelector(
    (state) => state.currentCompanyMember
  );

  // 1. Fetch all company memberships
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

  // 2. Sync Redux store with the latest query data
  React.useEffect(() => {
    if (!companyMembers.length) return;

    const currentCompanyId = selectedCompanyMember?.companyId?.id;
    let freshMember: any | undefined;

    if (currentCompanyId) {
      freshMember = companyMembers.find(
        (m) => m.companyId?.id === currentCompanyId
      );
    }

    // If no previously selected company or it no longer exists, pick the first
    if (!freshMember) {
      freshMember = companyMembers[0];
    }

    // Update Redux only if the data actually changed
    if (freshMember && freshMember.id !== selectedCompanyMember?.id) {
      dispatch(setCompanyMember(freshMember));
    }
  }, [companyMembers, selectedCompanyMember, dispatch]);

  // 3. Compute grouped modules (memoized)
  const groupedModules = React.useMemo(
    () => getActiveModulesGroupedByType(selectedCompanyMember?.modules ?? []),
    [selectedCompanyMember?.modules]
  );

  const companyModules = groupedModules.company ?? [];

  // 4. Error state
  if (queryError) {
    return (
      <Sidebar {...props}>
        <SidebarHeader className="p-4 text-destructive">
          <p>Error loading companies.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm underline mt-1"
          >
            Retry
          </button>
        </SidebarHeader>
      </Sidebar>
    );
  }

  // 5. Loading state
  if (queryLoading || !currentMember) {
    return (
      <div className="h-full bg-red-400!">
        <Sidebar {...props}>
          <SidebarHeader className="mt-2 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </SidebarHeader>
          <div>
            <div className="">
              <SidebarContent className="space-y-2 p-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </SidebarContent>
              <SidebarContent className="space-y-2 p-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </SidebarContent>
            </div>
          </div>
        </Sidebar>
      </div>
    );
  }

  // 6. Main render
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="mt-2">
        <CompanySwitcher companyMembers={companyMembers} />
      </SidebarHeader>

      <SidebarContent>
        {/* Company Management (visible to all) */}
        <NavCompanyManagement details={companyModules} />

        {/* Super Admin extra navigation */}
        {currentMember?.role === "SUPER_ADMIN" && (
          <NavAppManagement details={currentMember?.modules ?? []} />
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={currentMember} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}