"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useQuery } from "@apollo/client/react";
import { setCompanyMember } from "@/redux/slicers/currentCompanyMember";
import Link from "next/link";
import WebsiteDropdown from "../dropdown/WebsiteDropdown";
import { GET_WEBSITES_BY_COMPANY_ID } from "@/graphql/query/website.query";
import { WebsiteSwitcher } from "../website-switcher";
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon } from "lucide-react";

const AdminHeader = () => {
  const [userDropdown, setUserDropdown] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const pathName = usePathname();
  const dispatch = useAppDispatch();

  const currentMember = useAppSelector((state) => state.currentMember.member);
  const selectedCompanyMember = useAppSelector((state) => state.currentCompanyMember.companyMember);

  const companyId = selectedCompanyMember?.company?.id;

  const { data, loading, error, refetch } = useQuery<any>(GET_WEBSITES_BY_COMPANY_ID, {
    variables: { companyId },
    skip: !currentMember || !companyId,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: false, // Don't trigger loading on refetch
  });

  // Set initial load to false after first data load
  useEffect(() => {
    if (data && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [data, isInitialLoad]);

  useEffect(() => {
    if (currentMember && companyId) {
      refetch({ companyId });
    }
  }, [companyId, currentMember, refetch]);

  useEffect(() => {
    if (error) {
      console.error("Error fetching websites:", error);
    }
  }, [error]);

  const currentCompanyWebsites = data?.getWebsitesByCompanyId || [];

  useEffect(() => {
    if (currentCompanyWebsites.length > 0 && !selectedCompanyMember) {
      dispatch(setCompanyMember(currentCompanyWebsites[0]));
    }
  }, [currentCompanyWebsites, dispatch, selectedCompanyMember]);

  if (pathName.startsWith("/auth")) return null;

  // Only show loading on initial load, not on refetch
  if (isInitialLoad && loading && companyId) {
    return <div className="sticky top-0 p-2 text-white">Loading websites...</div>;
  }

  const websites= [
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
  ]

  return (
    <div className="sticky top-0 z-50 w-full flex justify-between items-center text-sm py-2 pr-4 px-2">
      <div className="flex justify-center items-center space-x-3">
        <WebsiteSwitcher websites={websites} />
      </div>

      <div className="relative">
        <div className="flex justify-center items-center space-x-3">
          <div className="pl-2 hidden md:flex flex-col text-black">
            <div className="font-medium capitalize">{selectedCompanyMember?.role}</div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminHeader;