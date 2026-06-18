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

// This is sample data.
const dataa = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  companies: [
    {
      name: "Acme Inc",
      logo: (
        <GalleryVerticalEndIcon
        />
      ),
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: (
        <AudioLinesIcon
        />
      ),
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: (
        <TerminalIcon
        />
      ),
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: (
        <TerminalSquareIcon
        />
      ),
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: (
        <BotIcon
        />
      ),
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: (
        <BookOpenIcon
        />
      ),
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: (
        <Settings2Icon
        />
      ),
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: (
        <FrameIcon
        />
      ),
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: (
        <PieChartIcon
        />
      ),
    },
    {
      name: "Travel",
      url: "#",
      icon: (
        <MapIcon
        />
      ),
    },
  ],
}

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
    const currentCompaniesOfLogedInMember = data?.getCompaniesOfCurrentMemberById || [];
    console.log({currentCompaniesOfLogedInMember:currentCompaniesOfLogedInMember})

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {
         (currentMember?.role === "SUPER_ADMIN" ) ?
            <div
              className="flex px-0 py-2 gap-x-3 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={currentMember.avatar || "/avatars/shadcn.jpg"} alt={currentMember.username} />
                <AvatarFallback>ER</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{currentMember?.username}</span>
                <span className="truncate text-xs">{currentMember?.role}</span>
              </div>
            </div>
            :
            <CompanySwitcher companies={currentCompaniesOfLogedInMember?.companyMembers} />
        }
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} /> */}
        <NavWebsite items={dataa.navMain} />
        <NavCompanyManagement details={dataa.projects}/>
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentMember} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
