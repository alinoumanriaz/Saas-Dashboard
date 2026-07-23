"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
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
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

// ------------------------------------------------------------
// MenuItem – supports both top‑level and sub‑level rendering
// ------------------------------------------------------------
function MenuItem({
  item,
  isSubItem = false,
}: {
  item: any;
  isSubItem?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.moduleId?.route;
  const hasChildren = item.children && item.children.length > 0;

  // ----- Leaf (no children) -----
  if (!hasChildren) {
    if (isSubItem) {
      return (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton asChild isActive={isActive}>
            <Link href={item.moduleId.route}>
              <span>{item.moduleId.moduleName}</span>
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      );
    }

    // Top‑level leaf
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive}>
          <Link href={item.moduleId.route}>
            <DynamicIcon name={item.moduleId.moduleIcon} />
            <span>{item.moduleId.moduleName}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // ----- Parent (has children) -----
  if (isSubItem) {
    // Sub‑level parent – no icon
    return (
      <SidebarMenuSubItem>
        <Collapsible className="group/collapsible" defaultOpen={isActive}>
          <CollapsibleTrigger asChild>
            <SidebarMenuSubButton asChild>
              <div>
                <span>{item.moduleId.moduleName}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </div>
            </SidebarMenuSubButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child: any) => (
                <MenuItem
                  key={child.moduleId.id}
                  item={child}
                  isSubItem={true}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuSubItem>
    );
  }

  // Top‑level parent – shows icon
  return (
    <Collapsible className="group/collapsible" defaultOpen={isActive}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.moduleId.moduleName}>
            <DynamicIcon name={item.moduleId.moduleIcon} />
            <span>{item.moduleId.moduleName}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child: any) => (
              <MenuItem
                key={child.moduleId.id}
                item={child}
                isSubItem={true}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

// ------------------------------------------------------------
// NavManagement – renders a group of modules
// ------------------------------------------------------------
export function NavManagement({
  title,
  details,
}: {
  title: string;
  details: any[];
}) {
  return (
    <SidebarGroup className="">
      <SidebarGroupLabel className="capitalize">
        {title} Management
      </SidebarGroupLabel>

      <SidebarMenu>
        {details.map((item) => (
          <MenuItem key={item.moduleId.id} item={item} isSubItem={false} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}