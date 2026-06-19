/* eslint-disable react-hooks/set-state-in-effect */
"use client"
import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { getInitials } from "@/helpers/getInitials"
import { useAppDispatch } from "@/redux/hooks"
import { setCompanyMember } from "@/redux/slicers/currentCompanyMember"


export function CompanySwitcher({
  companyMembers,
}: {
  companyMembers: any[]
}) {
  const dispatch = useAppDispatch();
  const { isMobile } = useSidebar()
  const [activeCompany, setActiveCompany] = React.useState<any>(companyMembers[0])

  React.useEffect(() => {
    if (companyMembers?.length) {
      setActiveCompany(companyMembers[0]);
      // dispatch(setCompanyMember(companyMembers[0]));
    } else {
      setActiveCompany(null);
    }
  }, [companyMembers]);

  if (!activeCompany) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage className="rounded-lg!" src={activeCompany.company.logo} alt={activeCompany.company.name} />
                  <AvatarFallback className="ring-1 ring-gray-300">{getInitials(activeCompany.company.name)}</AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeCompany.company.name}</span>
                <span className="truncate text-xs">{activeCompany.role}</span>
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
              Companies
            </DropdownMenuLabel>
            {companyMembers.map((companyMember, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => {
                  setActiveCompany(companyMember);
                  console.log({companyMember:companyMember})
                  dispatch(setCompanyMember(companyMember))
                  }
                }
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={companyMember.company.logo} alt={companyMember.company.name} />
                    <AvatarFallback className="rounded-lg h-8 w-8">{getInitials(companyMember.company.name)}</AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <div>{companyMember.company.name}</div>
                  {/* <div>{companyMember.company.name}</div> */}
                </div>
                {/* <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> */}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <PlusIcon className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add Company</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
