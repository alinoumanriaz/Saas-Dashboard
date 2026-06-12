"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useQuery } from "@apollo/client/react";
import { setCompanyMember } from "@/redux/slicers/currentCompanyMember";
import LogoutButton from "../LogoutButton";
import Link from "next/link";
import WebsiteDropdown from "../dropdown/WebsiteDropdown";
import { GET_WEBSITES_BY_COMPANY_ID } from "@/graphql/query/website.query";

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

  return (
    <div className="sticky top-0 z-50 w-full flex justify-between items-center text-sm py-2 pr-4 px-2">
      <div className="flex justify-center items-center space-x-3">
        <WebsiteDropdown data={currentCompanyWebsites} />
      </div>

      <div className="relative">
        <div className="flex justify-center items-center space-x-3">
          <div className="pl-2 hidden md:flex flex-col text-black">
            <div className="font-medium capitalize">{selectedCompanyMember?.role}</div>
          </div>

          <div
            onClick={() => setUserDropdown(!userDropdown)}
            className="flex rounded-full justify-center items-center text-[12px] cursor-pointer relative"
          >
            <Image
              className="rounded-full ring-1 ring-gray-200 w-8 h-8 object-cover"
              src={currentMember?.avatar || "/userPlaceholder.jpg"}
              alt="user"
              width={32}
              height={32}
            />

            {userDropdown && (
              <div
                onMouseLeave={() => setUserDropdown(false)}
                className="bg-white w-64 shadow-lg p-2 ring-1 ring-gray-200 overflow-hidden rounded-md absolute right-0 top-10 z-50"
              >
                <div className="flex items-center space-x-3 p-2 border-b border-gray-200">
                  <Image
                    className="rounded-full ring-1 ring-gray-300 w-10 h-10 object-cover"
                    src={currentMember?.avatar || "/userPlaceholder.jpg"}
                    alt="user"
                    width={40}
                    height={40}
                  />
                  <div className="flex flex-col">
                    <div className="font-medium">{currentMember?.username}</div>
                    <div className="text-xs text-gray-600 capitalize">{currentMember?.role?.toLowerCase()}</div>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors duration-200"
                    onClick={() => setUserDropdown(false)}
                  >
                    Profile
                  </Link>
                </div>

                <div className="border-t border-gray-200 pt-1">
                  <div className="px-3 py-2">
                    <LogoutButton />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;