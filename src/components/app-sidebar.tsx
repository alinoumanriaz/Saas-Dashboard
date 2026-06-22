"use client"
import * as React from "react"
import { NavUser } from "@/components/nav-user"
import { CompanySwitcher } from "@/components/company-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon, FrameIcon, PieChartIcon, MapIcon } from "lucide-react"
import { useAppSelector } from "@/redux/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { NavCompanyManagement } from "./nav-company-management"
import { NavWebsite } from "./nav-website"
import { useQuery } from "@apollo/client/react"
import { GET_COMPANIES_OF_CURRENT_MEMBER_BY_ID } from "@/graphql/query/company-member.query"
import { Skeleton } from "./ui/skeleton"
import { NavAppManagement } from "./nav-app-management"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentMember = useAppSelector((state) => state.currentMember.member);
  const { data, loading, error } = useQuery<any>(
    GET_COMPANIES_OF_CURRENT_MEMBER_BY_ID,
    {
      variables: {
        id: currentMember?.id,
      },
      skip: !currentMember,
      fetchPolicy: "network-only", // Add this to ensure fresh data
    }
  );
  const currentCompaniesOfLogedInMember = data?.getCompaniesOfCurrentMemberById?.companyMembers || [];
  console.log({ currentCompaniesOfLogedInMember: currentCompaniesOfLogedInMember })
  console.log({ currentCompaniesOfLogedInMember: error })
  console.log({ sidebarCurrentMember: currentMember?.modules })

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="mt-2">
        {loading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-37.5" />
              <Skeleton className="h-4 w-37.5" />
            </div>
          </div>
        )
          :
          <CompanySwitcher companyMembers={currentCompaniesOfLogedInMember} />
        }
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} /> */}
        {/* <NavWebsite items={dataa.navMain} /> */}
        {/* <NavCompanyManagement details={dataa.projects} /> */}
        {
          (currentMember?.role === "SUPER_ADMIN") &&
          <NavAppManagement details={currentMember?.modules || []} />
        }
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentMember} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
