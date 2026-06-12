/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { IoMdArrowDroprightCircle } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { FaBoxes } from "react-icons/fa";
import { FaBuilding, FaUsersGear } from "react-icons/fa6";
import { HiMiniBuildingOffice2 } from "react-icons/hi2";
import {
  RiBox1Line,
  RiBox3Fill,
  RiDashboardHorizontalFill,
  RiGalleryFill,
  RiGalleryLine,
  RiPagesLine,
  RiTeamFill,
} from "react-icons/ri";
import { HiInbox, HiUser, HiUsers } from "react-icons/hi2";
import { TbBrandBlogger, TbLayoutCards, TbLayoutKanbanFilled } from "react-icons/tb";
import SidebarOption from "./SidebarOption";
import { FiCodesandbox } from "react-icons/fi";
import { useAppSelector } from "@/redux/hooks";
import { BsBoxes, BsFillBoxFill, BsInboxFill } from "react-icons/bs";
import { CgMenuLeft, CgStyle } from "react-icons/cg";
import { usePathname } from "next/navigation";
import LogoutButton from "../LogoutButton";
import { BiHomeSmile } from "react-icons/bi";
import { GrContactInfo } from "react-icons/gr";
import {
  MdOutlinePrivacyTip,
  MdOutlineIndeterminateCheckBox,
  MdOutlineRateReview,
  MdRateReview,
} from "react-icons/md";
import { FaBloggerB, FaInbox, FaPager, FaRegAddressCard, FaUser } from "react-icons/fa6";
import { LuContact, LuUserRound } from "react-icons/lu";
import { RxDashboard } from "react-icons/rx";
import { useAppDispatch } from "@/redux/hooks";
import { toggle } from "@/redux/slicers/sidebarToggle";
import { GiCardboardBoxClosed } from "react-icons/gi";
import { PiBuildingApartmentFill } from "react-icons/pi";
import { GET_COMPANIES_OF_CURRENT_MEMBER_BY_ID } from "@/graphql/query/company-member.query";
import { setCompanyMember } from "@/redux/slicers/currentCompanyMember";
import { CompanyMember } from "@/Types/companyMember.types";
import { useQuery } from "@apollo/client/react";
import CustomDropdown from "../CustomDropdown";
import { PlatformRole } from "@/enums/common.enums";
import CompaniesDropdown from "../dropdown/CompaniesDropdown";
import MemberDropdown from "../dropdown/MemberDropdown";

interface GetCompaniesResponse {
  getCompaniesOfCurrentMemberById: {
    companyMembers: CompanyMember[];
    totalCompanyMembersCount: number;
  };
}

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const [collapsedHover, setCollapsedHover] = useState(false);
  const sidebarOpen = useAppSelector((state) => state.sidebarToggle);
  const pathName = usePathname();

  const currentMember = useAppSelector((state) => state.currentMember.member);
  const selectedCompanyMember = useAppSelector((state) => state.currentCompanyMember.companyMember);

  const memberId = currentMember?.id;
  const currentMemberRole = selectedCompanyMember?.role;

  // Fix: Add proper typing for the query
  const { data, loading, error } = useQuery<GetCompaniesResponse>(
    GET_COMPANIES_OF_CURRENT_MEMBER_BY_ID,
    {
      variables: {
        id: memberId, // Fix: Check your query variable name - might be 'id' instead of 'memberId'
      },
      skip: !currentMember,
      fetchPolicy: "network-only", // Add this to ensure fresh data
    }
  );

  // Log errors properly
  useEffect(() => {
    if (error) {
      console.error("Error fetching company members:", error);
    }
  }, [error]);

  // Extract company members from the response
  const currentCompaniesOfLogedInMember = data?.getCompaniesOfCurrentMemberById?.companyMembers || [];


  if (pathName.startsWith("/auth")) return null;

  const navigationItems = [
    {
      icon: RiDashboardHorizontalFill,
      link: "/",
      name: "Dashboard",
      exactMatch: true,
      moduleName: "dashboard"
    },
    {
      icon: TbLayoutKanbanFilled,
      name: "Website",
      showArrow: true,
      subItems: [
        {
          icon: RiBox3Fill,
          link: "/website/products",
          name: "Products",
        },
        {
          icon: FaBloggerB,
          link: "/website/blogs",
          name: "Blogs",
          // showArrow: true,
        },
        {
          icon: BsInboxFill,
          name: "Orders",
          link: "/website/orders",
        },
        {
          icon: RiGalleryFill,
          link: "/website/gallery",
          name: "Gallery",
        },
        {
          icon: MdRateReview,
          link: "/website/reviews",
          name: "Reviews",
        },
        {
          icon: HiUser,
          link: "/website/users",
          name: "Users",
        },
        {
          icon: TbLayoutKanbanFilled,
          name: "Catergries",
          showArrow: true,
          subItems: [
            {
              icon: BsBoxes,
              link: "/website/category/industry",
              name: "By Industry",
            },
            {
              icon: FiCodesandbox,
              link: "/website/category/material",
              name: "By Material",
            },
            {
              icon: CgStyle,
              link: "/website/category/styleboxes",
              name: "By Style",
            },
          ],
        },
        {
          icon: FaPager,
          name: "Pages",
          showArrow: true,
          subItems: [
            {
              icon: BiHomeSmile,
              link: "/page/home",
              name: "Home",
            },
            {
              icon: GrContactInfo,
              link: "/page/about-us",
              name: "About Us",
            },
            {
              icon: LuContact,
              link: "/page/contact-us",
              name: "Contact Us",
            },
            {
              icon: FaRegAddressCard,
              link: "/page/delivery-info",
              name: "Delivery Info",
            },
            {
              icon: MdOutlinePrivacyTip,
              link: "/page/privacy-policy",
              name: "Privacy Policy",
            },
            {
              icon: MdOutlineIndeterminateCheckBox,
              link: "/page/terms-conditions",
              name: "Terms & Conditions",
            },
          ],
        },

      ],
      exactMatch: true,
      moduleName: "Website"
    },
    {
      icon: FaBuilding,
      name: "Company",
      showArrow: true,
      subItems: [
        {
          icon: FaBuilding,
          link: "/company/company-details",
          name: "Company",
        },
        {
          icon: HiUsers,
          link: "/company/company-members",
          name: "Members",
        },
        // {
        //   icon: HiUsers,
        //   link: "/company/teams",
        //   name: "Teams",
        // },
        {
          icon: FaBuilding,
          link: "/company/websites",
          name: "Websites",
        },
      ],
      exactMatch: true,
      moduleName: "Company"
    },

  ];

  if (currentMemberRole as any === PlatformRole.OWNER) {
    navigationItems.push(
      {
        icon: PiBuildingApartmentFill,
        link: "/app-gallery",
        name: "App Gallery",
        exactMatch: true,
        moduleName: "app-gallery"
      },
      {
        icon: PiBuildingApartmentFill,
        link: "/companies",
        name: "Companies",
        exactMatch: true,
        moduleName: "Companies"
      },
    );
  }

  if (currentMemberRole as any === PlatformRole.SUPER_ADMIN) {
    navigationItems.push(
      {
        icon: FaUsersGear,
        link: "/members",
        name: "Members",
        exactMatch: true,
        moduleName: "Members"
      },
    );
  }

  const effectiveSidebarWidth = sidebarOpen
    ? "w-[350px]"
    : collapsedHover
      ? "w-[350px]"
      : "w-[45px]";

  return (
    <div
      onMouseEnter={() => !sidebarOpen && setCollapsedHover(true)}
      onMouseLeave={() => !sidebarOpen && setCollapsedHover(false)}
      className={` ${effectiveSidebarWidth} text-sm transition-all duration-500 ease-in-out hidden md:flex flex-col justify-between items-center relative`}
    >
      <div className="w-full h-full ">
        <div className="w-full ">
          <div
            className={`w-full flex justify-between items-center text-black `}
          >
            <div className="w-full flex justify-center items-center text-md text-center relative">
              <div className="w-full flex justify-center items-center p-1">
                <CompaniesDropdown
                  data={currentCompaniesOfLogedInMember}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-start pt-4 items-center ">
          <nav className="w-full text-black overflow-auto h-[calc(100dvh-150px)] scrollbar-hide flex flex-col space-y-1 px-2 ">
            {navigationItems.map((item) => (
              <SidebarOption
                key={item.name}
                icon={item.icon}
                link={item.link}
                arrowIcon={IoIosArrowForward}
                name={item.name}
                exactMatch={item.exactMatch}
                sidebarOpen={sidebarOpen || collapsedHover}
                subItems={item.subItems}
              />
            ))}
          </nav>
        </div>
      </div>
      {/* <div
        onClick={() => dispatch(toggle())}
        className={`text-white w-full rounded-md  md:flex ${sidebarOpen ? "justify-start pl-2" : "justify-start px-2 w-6"}  items-center`}>
        <IoMdArrowDroprightCircle className=" size-8 p-1.5" />
        <div className={`${sidebarOpen ? "flex" : "hidden"} text-nowrap`}>Collapse Menu</div>
      </div> */}
      <div className=" flex w-full border-t-2 py-3 border-t-gray-300/30">
        {/* <LogoutButton />  */}
        <MemberDropdown data={currentCompaniesOfLogedInMember} />
      </div>
    </div>
  );
};

export default Sidebar;
