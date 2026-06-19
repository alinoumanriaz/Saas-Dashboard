/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react"
import { setCompanyCurrentWebsite } from "@/redux/slicers/companyCurrentWebsite"
import { useAppDispatch } from "@/redux/hooks"

export function WebsiteSwitcher({
  websites,
}: {
  websites: any[]
}) {
  const dispatch = useAppDispatch()
  const { isMobile } = useSidebar()
  const [activeWebsite, setActiveWebsite] = React.useState<any>()

  React.useEffect(() => {
    if (websites?.length) {
      setActiveWebsite(websites[0]);
      dispatch(setCompanyCurrentWebsite(websites[0]));
    } else {
      setActiveWebsite(null);
    }
  }, [websites]);

  if (!activeWebsite) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="min-w-56 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {activeWebsite.logo}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeWebsite.name}</span>
                <span className="truncate text-xs">{activeWebsite.plan}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Websites
            </DropdownMenuLabel>
            {websites.map((website, index) => (
              <DropdownMenuItem
                key={website.name}
                onClick={() => setActiveWebsite(website)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  {website.logo}
                </div>
                {website.name}
                {/* <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> */}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <PlusIcon className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add Website</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
