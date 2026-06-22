"use client"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { getLucideIcon } from "@/helpers/LucidIconFinder"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavAppManagement({
  details,
}: {
  details: any
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>App Management</SidebarGroupLabel>
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
