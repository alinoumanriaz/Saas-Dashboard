"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { getLucideIcon } from "@/helpers/LucidIconFinder"
import { MoreHorizontalIcon, FolderIcon, ArrowRightIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavCompanyManagement({
  details,
}: {
  details: any[]
}) {
   const pathname = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Company Management</SidebarGroupLabel>
      <SidebarMenu>
        {details.map((item: any, index: number) => {
          const Icon = getLucideIcon(item.moduleId.moduleIcon)
          const isActive = pathname === item.moduleId.route
          return (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton asChild isActive={isActive}>
              <Link href={item.moduleId.route}>
                <Icon />
                <span>{item.moduleId.moduleName}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )})}
      </SidebarMenu>
    </SidebarGroup>
  )
}
