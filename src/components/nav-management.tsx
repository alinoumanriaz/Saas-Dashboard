/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { DynamicIcon } from "@/helpers/LucidIconFinder";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

/* ============================================================
   Types
   ============================================================ */

export type NavigationModule = {
  id: string;
  route: string;
  moduleName: string;
  moduleIcon?: string | null;
};

export type NavigationItem = {
  moduleId: NavigationModule;
  children?: NavigationItem[];
};

type MenuItemProps = {
  item: NavigationItem;
  level?: number;
};

/* ============================================================
   Helpers
   ============================================================ */

/**
 * Normalize routes so these are treated as the same:
 *
 * /products
 * /products/
 */
function normalizePath(path?: string | null): string {
  if (!path) return "";

  if (path === "/") return "/";

  return path.replace(/\/+$/, "");
}

/**
 * Check whether the current pathname exactly matches an item.
 */
function isRouteActive(
  route: string | null | undefined,
  pathname: string,
): boolean {
  return normalizePath(route) === normalizePath(pathname);
}

/**
 * Recursively determine whether an item or one of its
 * descendants is active.
 */
function hasActiveDescendant(
  item: NavigationItem,
  pathname: string,
): boolean {
  if (isRouteActive(item.moduleId.route, pathname)) {
    return true;
  }

  return (
    item.children?.some((child) =>
      hasActiveDescendant(child, pathname),
    ) ?? false
  );
}

/**
 * Determine whether an item has children.
 */
function hasChildren(item: NavigationItem): boolean {
  return Boolean(item.children?.length);
}

/* ============================================================
   Menu Item
   ============================================================ */

function MenuItem({ item, level = 0 }: MenuItemProps) {
  const pathname = usePathname();

  const children = item.children ?? [];

  const hasNestedItems = children.length > 0;

  const isActive = isRouteActive(
    item.moduleId.route,
    pathname,
  );

  /**
   * This is true when:
   *
   * - the current item is active
   * - OR any child/grandchild is active
   */
  const shouldBeOpen = hasActiveDescendant(item, pathname);

  /**
   * Controlled Collapsible state.
   *
   * This is important because defaultOpen only works on the
   * initial render. Using state lets the sidebar react when
   * Next.js navigation changes the pathname.
   */
  const [open, setOpen] = useState(shouldBeOpen);

  /**
   * When navigation changes, automatically open the parent
   * chain if the new pathname belongs to this item.
   */
  useEffect(() => {
    if (shouldBeOpen) {
      setOpen(true);
    }
  }, [shouldBeOpen]);

  /* ==========================================================
     Leaf Item
     ========================================================== */

  if (!hasNestedItems) {
    /**
     * Nested leaf
     */
    if (level > 0) {
      return (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton
            asChild
            isActive={isActive}
          >
            <Link href={item.moduleId.route}>
              <span>{item.moduleId.moduleName}</span>
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      );
    }

    /**
     * Top-level leaf
     */
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.moduleId.moduleName}
        >
          <Link href={item.moduleId.route}>
            {item.moduleId.moduleIcon && (
              <DynamicIcon
                name={item.moduleId.moduleIcon}
              />
            )}

            <span>{item.moduleId.moduleName}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  /* ==========================================================
     Nested Parent
     ========================================================== */

  if (level > 0) {
    return (
      <SidebarMenuSubItem>
        <Collapsible
          open={open}
          onOpenChange={setOpen}
          className="group/collapsible"
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuSubButton
              isActive={isActive}
              className={
                shouldBeOpen
                  ? "text-foreground"
                  : undefined
              }
            >
              <span>{item.moduleId.moduleName}</span>

              <ChevronRight
                className="
                  ml-auto
                  size-4
                  shrink-0
                  transition-transform
                  duration-200
                  group-data-[state=open]/collapsible:rotate-90
                "
              />
            </SidebarMenuSubButton>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <SidebarMenuSub>
              {children.map((child) => (
                <MenuItem
                  key={child.moduleId.id}
                  item={child}
                  level={level + 1}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuSubItem>
    );
  }

  /* ==========================================================
     Top-Level Parent
     ========================================================== */

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={isActive}
            tooltip={item.moduleId.moduleName}
          >
            {item.moduleId.moduleIcon && (
              <DynamicIcon
                name={item.moduleId.moduleIcon}
              />
            )}

            <span>{item.moduleId.moduleName}</span>

            <ChevronRight
              className="
                ml-auto
                size-4
                shrink-0
                transition-transform
                duration-200
                group-data-[state=open]/collapsible:rotate-90
              "
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((child) => (
              <MenuItem
                key={child.moduleId.id}
                item={child}
                level={1}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

/* ============================================================
   Nav Management
   ============================================================ */

type NavManagementProps = {
  title: string;
  details: NavigationItem[];
};

export function NavManagement({
  title,
  details,
}: NavManagementProps) {
  if (!details?.length) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="capitalize">
        {title} Management
      </SidebarGroupLabel>

      <SidebarMenu>
        {details.map((item) => (
          <MenuItem
            key={item.moduleId.id}
            item={item}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}